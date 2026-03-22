'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WeeklyReview } from '@/lib/types';
import {
  getCurrentWeekStart,
  getWeeklyReview,
  saveWeeklyReview,
  emptyWeeklyReview,
  getLastWeekEntries,
  formatDate,
} from '@/lib/storage';
import type { JournalEntry } from '@/lib/types';
import WeeklyMentor from './WeeklyMentor';

const WEEKLY_STEPS = [
  {
    key: 'patterns' as keyof Omit<WeeklyReview, 'id' | 'weekStart' | 'savedAt'>,
    question: 'What pattern kept appearing this week?',
    placeholder: 'Look across your nightly entries. What keeps showing up?',
    hint: 'In your drifting, your avoiding, your falls — what\'s the thread?',
  },
  {
    key: 'virtue' as keyof Omit<WeeklyReview, 'id' | 'weekStart' | 'savedAt'>,
    question: 'Which stoic virtue did I practise most?',
    placeholder: 'Wisdom · Justice · Courage · Temperance',
    hint: 'And which did I neglect?',
  },
  {
    key: 'proudOf' as keyof Omit<WeeklyReview, 'id' | 'weekStart' | 'savedAt'>,
    question: 'What am I proud of this week?',
    placeholder: 'Something real. Something yours.',
    hint: undefined,
  },
  {
    key: 'carryForward' as keyof Omit<WeeklyReview, 'id' | 'weekStart' | 'savedAt'>,
    question: 'What do I carry into next week?',
    placeholder: 'One intention. Make it count.',
    hint: undefined,
  },
];

type Screen = 'overview' | 'writing' | 'done';

export default function WeeklyReview() {
  const weekStart = getCurrentWeekStart();
  const [review, setReview] = useState<WeeklyReview>(() => emptyWeeklyReview(weekStart));
  const [weekEntries, setWeekEntries] = useState<JournalEntry[]>([]);
  const [screen, setScreen] = useState<Screen>('overview');
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentStep = WEEKLY_STEPS[stepIndex];
  const isLast = stepIndex === WEEKLY_STEPS.length - 1;

  useEffect(() => {
    const saved = getWeeklyReview(weekStart);
    if (saved) setReview(saved);
    setWeekEntries(getLastWeekEntries());
    setMounted(true);
  }, [weekStart]);

  useEffect(() => {
    if (screen === 'writing') {
      const t = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [stepIndex, screen]);

  const handleChange = useCallback((value: string) => {
    setReview((prev) => {
      const updated = { ...prev, [currentStep.key]: value };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaving(true);
      saveTimer.current = setTimeout(() => {
        saveWeeklyReview(updated);
        setSaving(false);
      }, 600);
      return updated;
    });
  }, [currentStep]);

  const goNext = useCallback(() => {
    if (isLast) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveWeeklyReview(review);
      setScreen('done');
    } else {
      setStepIndex((i) => i + 1);
      setAnimKey((k) => k + 1);
    }
  }, [isLast, review]);

  const goBack = useCallback(() => {
    if (stepIndex === 0) setScreen('overview');
    else { setStepIndex((i) => i - 1); setAnimKey((k) => k + 1); }
  }, [stepIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); goNext(); }
  }, [goNext]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  // ── Overview ──────────────────────────────────────────────────
  if (screen === 'overview') {
    const hasReview = mounted && WEEKLY_STEPS.some((s) => review[s.key]?.trim());
    const [wy, wm, wd] = weekStart.split('-').map(Number);
    const weekEnd = new Date(wy, wm - 1, wd + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    return (
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 pt-24">
        <div className="step-enter">
          <p className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#8a6540', fontFamily: 'var(--font-dm-mono)' }}>
            Weekly Review
          </p>
          <h1 className="text-5xl font-light mb-2" style={{ fontFamily: 'var(--font-cormorant)', color: '#e6ddd0' }}>
            This Week
          </h1>
          <p className="text-xs mb-10" style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}>
            {formatDate(weekStart)} → {formatDate(weekEndStr)}
          </p>

          {/* This week's entries */}
          {weekEntries.length > 0 ? (
            <div className="mb-10">
              <p className="text-xs tracking-[0.2em] uppercase mb-4" style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}>
                {weekEntries.length} evening{weekEntries.length !== 1 ? 's' : ''} this week
              </p>
              <div className="space-y-3">
                {weekEntries.map((e) => (
                  <div key={e.id} style={{ borderLeft: '2px solid #2a2318', paddingLeft: '1rem' }}>
                    <p className="text-sm mb-1" style={{ fontFamily: 'var(--font-cormorant)', color: '#c9bfb2', fontSize: '1rem' }}>
                      {formatDate(e.date)}
                    </p>
                    {e.smallWin && (
                      <p className="text-xs" style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}>
                        Win: {e.smallWin}
                      </p>
                    )}
                    {e.drifting && (
                      <p className="text-xs" style={{ color: '#3a3028', fontFamily: 'var(--font-dm-mono)' }}>
                        Drifting: {e.drifting}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-10 p-4" style={{ border: '1px solid #2a2318' }}>
              <p className="text-xs" style={{ color: '#3a3028', fontFamily: 'var(--font-dm-mono)' }}>
                No evening entries yet this week. Complete a few nightly sessions first.
              </p>
            </div>
          )}

          <div style={{ height: '1px', background: '#2a2318', marginBottom: '2rem' }} />

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
            {hasReview ? 'Continue review' : 'Begin weekly review'}
          </button>
        </div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────
  if (screen === 'done') {
    return (
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 pt-24">
        <div className="completion-enter text-center">
          <div style={{ width: '1px', height: '80px', background: 'linear-gradient(to bottom, transparent, #2a2318)', margin: '0 auto 3rem' }} />
          <p className="text-xs tracking-[0.4em] uppercase mb-6" style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}>
            Week reviewed
          </p>
          <p className="text-3xl font-light italic mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-cormorant)', color: '#c4935a' }}>
            &ldquo;What we do now echoes in eternity.&rdquo;
          </p>
          <p className="text-xs mb-8" style={{ color: '#3a3028', fontFamily: 'var(--font-dm-mono)' }}>— Marcus Aurelius</p>
        </div>

        <WeeklyMentor review={review} weekEntries={weekEntries} />

        <div className="text-center mt-12">
          <div style={{ width: '1px', height: '80px', background: 'linear-gradient(to top, transparent, #2a2318)', margin: '0 auto 3rem' }} />
          <button
            onClick={() => { setScreen('overview'); }}
            className="text-xs tracking-[0.2em] uppercase transition-colors duration-200"
            style={{ color: '#3a3028', fontFamily: 'var(--font-dm-mono)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6b5f52'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#3a3028'; }}
          >
            Back to overview
          </button>
        </div>
      </div>
    );
  }

  // ── Writing ───────────────────────────────────────────────────
  const currentValue = review[currentStep.key] as string;

  return (
    <div className="relative z-10 min-h-screen flex flex-col px-6 py-8 max-w-2xl mx-auto">
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
            {stepIndex + 1} / {WEEKLY_STEPS.length}
          </span>
        </div>
        <div style={{ height: '1px', background: '#1a1610', position: 'relative' }}>
          <div style={{ height: '1px', background: '#8a6540', width: `${((stepIndex) / WEEKLY_STEPS.length) * 100}%`, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <div key={animKey} className="step-enter flex-1 flex flex-col justify-center py-8">
        <p className="text-xs tracking-[0.3em] uppercase mb-5" style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}>
          Weekly Review
        </p>
        <h2 className="text-4xl font-light mb-2 leading-snug" style={{ fontFamily: 'var(--font-cormorant)', color: '#e6ddd0' }}>
          {currentStep.question}
        </h2>
        {currentStep.hint && (
          <p className="text-xs mb-8" style={{ color: '#3a3028', fontFamily: 'var(--font-dm-mono)' }}>{currentStep.hint}</p>
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
        <p className="text-xs mt-3" style={{ color: '#2a2318', fontFamily: 'var(--font-dm-mono)' }}>⌘ + Enter to continue</p>
      </div>

      <div className="flex items-center justify-between pt-6">
        <div className="text-xs" style={{ color: '#2a2318', fontFamily: 'var(--font-dm-mono)' }}>{saving ? 'saving...' : ''}</div>
        <button
          onClick={goNext}
          className="px-8 py-3 text-sm tracking-[0.15em] uppercase transition-all duration-200"
          style={{ fontFamily: 'var(--font-dm-mono)', background: 'rgba(196,147,90,0.1)', border: '1px solid #8a6540', color: '#c4935a' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(196,147,90,0.18)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(196,147,90,0.1)'; }}
        >
          {isLast ? 'Finish' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
