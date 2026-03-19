'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { JournalEntry } from '@/lib/types';
import { saveEntry, getEntryByDate, emptyEntry, formatDate, getToday } from '@/lib/storage';
import { getQuoteForDate, getMementoForDate } from '@/lib/quotes';

type FieldKey = keyof Omit<JournalEntry, 'id' | 'date' | 'savedAt'>;

interface Step {
  key: FieldKey | null;
  group: string;
  question: string;
  placeholder: string;
  hint?: string;
}

const STEPS: Step[] = [
  { key: 'mindRightNow', group: 'Mind', question: "What's on your mind right now?", placeholder: "Let it out. Don't filter it.", hint: 'Anything. Big or small.' },
  { key: 'didWell', group: 'Reflection', question: 'What did I do well today?', placeholder: 'Be honest with yourself.', hint: 'Even small things count.' },
  { key: 'fellShort', group: 'Reflection', question: 'Where did I fall short?', placeholder: 'Own it.', hint: 'No self-punishment — just clarity.' },
  { key: 'actedIntentionally', group: 'Reflection', question: 'Did I act intentionally or reactively?', placeholder: 'How did it feel to move through the day?', hint: undefined },
  { key: 'outsideControl', group: 'Control', question: 'What happened today that was outside my control?', placeholder: 'Name it — then let it go.', hint: 'Did you give it energy it didn\'t deserve?' },
  { key: 'followedThrough', group: 'Habits', question: 'Did I follow through on what I said I would do?', placeholder: 'Yes / No / Partly — and why.', hint: undefined },
  { key: 'smallWin', group: 'Habits', question: "What's one small win today?", placeholder: 'Find it. It exists.', hint: undefined },
  { key: 'drifting', group: 'Habits', question: 'Where am I drifting?', placeholder: 'Be specific. Name the drift.', hint: undefined },
  { key: 'improveTomorrow', group: 'Tomorrow', question: 'One thing to improve tomorrow', placeholder: 'Concrete. Actionable. One thing.', hint: undefined },
  { key: 'avoiding', group: 'Honesty', question: "Anything I'm avoiding?", placeholder: 'Name it.', hint: 'The thing you skipped past — that one.' },
  { key: 'whatMatters', group: 'Reset', question: 'What actually matters right now?', placeholder: 'Strip it back. What is real?', hint: undefined },
  { key: 'letGo', group: 'Reset', question: 'What can I let go of?', placeholder: 'Release it here.', hint: undefined },
];

type Screen = 'intro' | 'writing' | 'done';

export default function JournalForm() {
  const today = getToday();
  const [entry, setEntry] = useState<JournalEntry>(() => {
    if (typeof window === 'undefined') return emptyEntry(today);
    return getEntryByDate(today) ?? emptyEntry(today);
  });
  const [screen, setScreen] = useState<Screen>('intro');
  const [stepIndex, setStepIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentStep = STEPS[stepIndex];
  const progress = (stepIndex / STEPS.length) * 100;
  const isLast = stepIndex === STEPS.length - 1;

  // Auto-focus textarea when step changes
  useEffect(() => {
    if (screen === 'writing') {
      const t = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [stepIndex, screen]);

  const persistEntry = useCallback((updated: JournalEntry) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(() => {
      saveEntry(updated);
      setSaving(false);
    }, 600);
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      if (!currentStep.key) return;
      setEntry((prev) => {
        const updated = { ...prev, [currentStep.key!]: value };
        persistEntry(updated);
        return updated;
      });
    },
    [currentStep, persistEntry]
  );

  const goNext = useCallback(() => {
    if (isLast) {
      // Save immediately on finish
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveEntry(entry);
      setScreen('done');
    } else {
      setStepIndex((i) => i + 1);
      setAnimKey((k) => k + 1);
    }
  }, [isLast, entry]);

  const goBack = useCallback(() => {
    if (stepIndex === 0) {
      setScreen('intro');
    } else {
      setStepIndex((i) => i - 1);
      setAnimKey((k) => k + 1);
    }
  }, [stepIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        goNext();
      }
    },
    [goNext]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // ── Intro screen ──────────────────────────────────────────────
  if (screen === 'intro') {
    const alreadyStarted = STEPS.some((s) => s.key && entry[s.key]?.trim());
    const quote = getQuoteForDate(today);
    return (
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="step-enter max-w-md w-full text-center">
          <p
            className="text-xs tracking-[0.4em] uppercase mb-10"
            style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}
          >
            Evening Solitude · {formatDate(today)}
          </p>

          {/* Daily quote */}
          <div className="mb-10 px-2">
            <p
              className="text-xl font-light italic leading-relaxed mb-3"
              style={{ fontFamily: 'var(--font-cormorant)', color: '#c9bfb2' }}
            >
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="text-xs" style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}>
              — {quote.author}, <span style={{ color: '#3a3028' }}>{quote.source}</span>
            </p>
          </div>

          <div style={{ height: '1px', background: '#2a2318', marginBottom: '2.5rem' }} />

          <h1
            className="text-5xl font-light mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#e6ddd0' }}
          >
            Clear the noise
          </h1>

          <p
            className="text-sm mb-10 leading-relaxed"
            style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}
          >
            Walk first. 10 minutes. No phone, no music.
            <br />
            Let your mind settle, then come back here.
          </p>

          <button
            onClick={() => { setScreen('writing'); setAnimKey((k) => k + 1); }}
            className="w-full py-4 text-sm tracking-[0.2em] uppercase transition-all duration-200"
            style={{
              fontFamily: 'var(--font-dm-mono)',
              background: 'rgba(196,147,90,0.1)',
              border: '1px solid #8a6540',
              color: '#c4935a',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196,147,90,0.18)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(196,147,90,0.1)'; }}
          >
            {alreadyStarted ? "Continue tonight's entry" : 'Begin'}
          </button>

          {alreadyStarted && (
            <p className="text-xs mt-4" style={{ color: '#3a3028', fontFamily: 'var(--font-dm-mono)' }}>
              You started this already — your answers are saved.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Done screen ───────────────────────────────────────────────
  if (screen === 'done') {
    const memento = getMementoForDate(today);
    return (
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <div className="completion-enter max-w-md w-full text-center">
          <div
            style={{ width: '1px', height: '80px', background: 'linear-gradient(to bottom, transparent, #2a2318)', margin: '0 auto 3rem' }}
          />
          <p
            className="text-xs tracking-[0.4em] uppercase mb-6"
            style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}
          >
            {formatDate(today)}
          </p>
          <p
            className="text-3xl font-light italic mb-8 leading-relaxed"
            style={{ fontFamily: 'var(--font-cormorant)', color: '#c4935a' }}
          >
            &ldquo;I showed up today.<br />Tomorrow I improve.&rdquo;
          </p>

          {memento && (
            <p
              className="text-sm italic leading-relaxed mb-8 px-4"
              style={{ fontFamily: 'var(--font-cormorant)', color: '#6b5f52', fontSize: '1rem' }}
            >
              &ldquo;{memento}&rdquo;
            </p>
          )}

          <div
            style={{ width: '1px', height: '80px', background: 'linear-gradient(to top, transparent, #2a2318)', margin: '0 auto 3rem' }}
          />
          <button
            onClick={() => { setScreen('writing'); setStepIndex(0); setAnimKey((k) => k + 1); }}
            className="text-xs tracking-[0.2em] uppercase transition-colors duration-200"
            style={{ color: '#3a3028', fontFamily: 'var(--font-dm-mono)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6b5f52'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#3a3028'; }}
          >
            Review answers
          </button>
        </div>
      </div>
    );
  }

  // ── Writing screen ────────────────────────────────────────────
  const currentValue = currentStep.key ? (entry[currentStep.key] as string) : '';

  return (
    <div className="relative z-10 min-h-screen flex flex-col px-6 py-8 max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goBack}
            className="text-xs tracking-[0.2em] uppercase transition-colors duration-200"
            style={{ color: '#3a3028', fontFamily: 'var(--font-dm-mono)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6b5f52'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#3a3028'; }}
          >
            ← back
          </button>
          <span className="text-xs" style={{ color: '#3a3028', fontFamily: 'var(--font-dm-mono)' }}>
            {stepIndex + 1} / {STEPS.length}
          </span>
        </div>
        <div style={{ height: '1px', background: '#1a1610', width: '100%', position: 'relative' }}>
          <div
            style={{
              height: '1px',
              background: '#8a6540',
              width: `${progress}%`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div key={animKey} className="step-enter flex-1 flex flex-col justify-center py-8">
        <p
          className="text-xs tracking-[0.3em] uppercase mb-5"
          style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}
        >
          {currentStep.group}
        </p>
        <h2
          className="text-4xl font-light mb-2 leading-snug"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#e6ddd0' }}
        >
          {currentStep.question}
        </h2>
        {currentStep.hint && (
          <p className="text-xs mb-8" style={{ color: '#3a3028', fontFamily: 'var(--font-dm-mono)' }}>
            {currentStep.hint}
          </p>
        )}
        {!currentStep.hint && <div className="mb-8" />}

        <textarea
          ref={textareaRef}
          className="journal-textarea"
          value={currentValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentStep.placeholder}
          rows={5}
        />

        <p className="text-xs mt-3" style={{ color: '#2a2318', fontFamily: 'var(--font-dm-mono)' }}>
          ⌘ + Enter to continue
        </p>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-6">
        <div className="text-xs" style={{ color: '#2a2318', fontFamily: 'var(--font-dm-mono)' }}>
          {saving ? 'saving...' : ''}
        </div>
        <button
          onClick={goNext}
          className="px-8 py-3 text-sm tracking-[0.15em] uppercase transition-all duration-200"
          style={{
            fontFamily: 'var(--font-dm-mono)',
            background: 'rgba(196,147,90,0.1)',
            border: '1px solid #8a6540',
            color: '#c4935a',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196,147,90,0.18)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(196,147,90,0.1)'; }}
        >
          {isLast ? 'Finish' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
