'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { WeeklyReview } from '@/lib/types';
import type { JournalEntry } from '@/lib/types';
import { getWeeklyMentorChat, saveWeeklyMentorChat } from '@/lib/storage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface WeeklyMentorProps {
  review: WeeklyReview;
  weekEntries: JournalEntry[];
}

export default function WeeklyMentor({ review, weekEntries }: WeeklyMentorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [started, setStarted] = useState(false);
  const [viewingHistory, setViewingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load saved chat on mount
  useEffect(() => {
    const saved = getWeeklyMentorChat(review.weekStart);
    if (saved && saved.messages.length > 0) {
      setMessages(saved.messages);
      setStarted(true);
      setViewingHistory(true);
    }
  }, [review.weekStart]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (started && !streaming) {
      inputRef.current?.focus();
    }
  }, [started, streaming]);

  const streamResponse = useCallback(
    async (conversationMessages: Message[]) => {
      setStreaming(true);

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      try {
        const res = await fetch('/api/mentor/weekly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationMessages,
            weeklyReview: review,
            weekEntries,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'Failed to reach the mentor');
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + parsed.text,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === 'assistant' && !last.content) {
            updated[updated.length - 1] = {
              ...last,
              content: `I cannot reach you at this moment. ${message}`,
            };
          }
          return updated;
        });
      } finally {
        setStreaming(false);
        setViewingHistory(false);
        setMessages((prev) => {
          saveWeeklyMentorChat(review.weekStart, prev);
          return prev;
        });
      }
    },
    [review, weekEntries]
  );

  const beginSession = useCallback(() => {
    setStarted(true);
    streamResponse([]);
  }, [streamResponse]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || streaming) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    streamResponse(updatedMessages);
  }, [input, streaming, messages, streamResponse]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // ── Not started yet ─────────────────────────────────────────
  if (!started) {
    return (
      <div className="step-enter mt-10">
        <div style={{ height: '1px', background: '#2a2318', marginBottom: '2rem' }} />
        <p
          className="text-xs tracking-[0.3em] uppercase mb-4"
          style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}
        >
          Stoic Mentor
        </p>
        <p
          className="text-sm font-light leading-relaxed mb-6"
          style={{ fontFamily: 'var(--font-dm-mono)', color: '#c9bfb2' }}
        >
          &ldquo;We suffer more often in imagination than in reality.&rdquo;
        </p>
        <p
          className="text-xs leading-relaxed mb-6"
          style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}
        >
          Share your weekly review with Seneca. He will read your week
          <br />
          and reflect on the patterns — honestly, as a mentor should.
        </p>
        <button
          onClick={beginSession}
          className="px-6 py-3 text-xs tracking-[0.2em] uppercase transition-all duration-200"
          style={{
            fontFamily: 'var(--font-dm-mono)',
            background: 'rgba(196,147,90,0.1)',
            border: '1px solid #8a6540',
            color: '#c4935a',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(196,147,90,0.18)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(196,147,90,0.1)';
          }}
        >
          Consult Seneca on your week
        </button>
      </div>
    );
  }

  // ── Chat view ───────────────────────────────────────────────
  return (
    <div className="step-enter mt-10">
      <div style={{ height: '1px', background: '#2a2318', marginBottom: '2rem' }} />
      <p
        className="text-xs tracking-[0.3em] uppercase mb-6"
        style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}
      >
        Seneca reflects on your week
      </p>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="space-y-6 mb-6 overflow-y-auto"
        style={{ maxHeight: '50vh' }}
      >
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'assistant' ? (
              <div>
                <p
                  className="text-xs tracking-[0.2em] uppercase mb-2"
                  style={{ color: '#8a6540', fontFamily: 'var(--font-dm-mono)' }}
                >
                  Seneca
                </p>
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    color: '#c9bfb2',
                    fontFamily: 'var(--font-dm-mono)',
                    lineHeight: '1.8',
                  }}
                >
                  {msg.content}
                  {streaming && i === messages.length - 1 && (
                    <span className="inline-block ml-1" style={{ color: '#c4935a' }}>
                      ▍
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p
                  className="text-xs tracking-[0.2em] uppercase mb-2"
                  style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}
                >
                  You
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#e6ddd0', fontFamily: 'var(--font-dm-mono)' }}
                >
                  {msg.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Viewing saved history */}
      {!streaming && messages.length > 0 && viewingHistory && (
        <div className="step-enter flex items-center gap-4">
          <p
            className="text-xs"
            style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}
          >
            Saved conversation from this week
          </p>
          <button
            onClick={() => setViewingHistory(false)}
            className="px-4 py-2 text-xs tracking-[0.15em] uppercase transition-all duration-200"
            style={{
              fontFamily: 'var(--font-dm-mono)',
              background: 'rgba(196,147,90,0.1)',
              border: '1px solid #8a6540',
              color: '#c4935a',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(196,147,90,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(196,147,90,0.1)';
            }}
          >
            Continue
          </button>
        </div>
      )}

      {/* Input area */}
      {!streaming && messages.length > 0 && !viewingHistory && (
        <div className="step-enter">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="journal-textarea"
            placeholder="Reply to Seneca..."
            rows={3}
            style={{ minHeight: '80px' }}
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs" style={{ color: '#2a2318', fontFamily: 'var(--font-dm-mono)' }}>
              ⌘ + Enter to send
            </p>
            <button
              onClick={sendMessage}
              className="px-6 py-2 text-xs tracking-[0.15em] uppercase transition-all duration-200"
              style={{
                fontFamily: 'var(--font-dm-mono)',
                background: 'rgba(196,147,90,0.1)',
                border: '1px solid #8a6540',
                color: '#c4935a',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(196,147,90,0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(196,147,90,0.1)';
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
