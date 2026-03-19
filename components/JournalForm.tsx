'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { JournalEntry } from '@/lib/types';
import { saveEntry, getEntryByDate, emptyEntry, formatDate, getToday } from '@/lib/storage';

type Section =
  | { number: string; title: string; subtitle: string | null; fields: readonly { key: string; placeholder: string; label?: string }[]; isIntro: true }
  | { number: string; title: string; subtitle: string | null; fields: readonly { key: string; placeholder: string; label?: string }[]; isIntro?: false };

const SECTIONS: Section[] = [
  {
    number: '01',
    title: 'Clear the noise',
    subtitle: 'Walk first. No phone, no music.',
    fields: [],
    isIntro: true,
  },
  {
    number: '02',
    title: "What's on your mind right now?",
    subtitle: null,
    fields: [
      { key: 'mindRightNow', placeholder: 'Let it out. No filter.' },
    ],
  },
  {
    number: '03',
    title: "Today's reflection",
    subtitle: null,
    fields: [
      { key: 'didWell', label: 'What did I do well today?', placeholder: 'Be honest.' },
      { key: 'fellShort', label: 'Where did I fall short?', placeholder: 'Own it.' },
      { key: 'actedIntentionally', label: 'Did I act intentionally or reactively?', placeholder: 'Reflect.' },
    ],
  },
  {
    number: '04',
    title: 'Habits & progress',
    subtitle: null,
    fields: [
      { key: 'followedThrough', label: 'Did I follow through on what I said I would do?', placeholder: 'Yes / No / Partly' },
      { key: 'smallWin', label: "What's one small win today?", placeholder: 'Find it.' },
      { key: 'drifting', label: 'Where am I drifting?', placeholder: 'Be specific.' },
    ],
  },
  {
    number: '05',
    title: 'One thing to improve tomorrow',
    subtitle: null,
    fields: [
      { key: 'improveTomorrow', placeholder: 'One thing. Make it concrete.' },
    ],
  },
  {
    number: '06',
    title: "Anything I'm avoiding?",
    subtitle: null,
    fields: [
      { key: 'avoiding', placeholder: 'Name it.' },
    ],
  },
  {
    number: '07',
    title: 'Reset',
    subtitle: null,
    fields: [
      { key: 'whatMatters', label: 'What actually matters right now?', placeholder: 'Strip it back.' },
      { key: 'letGo', label: 'What can I let go of?', placeholder: 'Release it.' },
    ],
  },
] as const;

type FieldKey = keyof Omit<JournalEntry, 'id' | 'date' | 'savedAt'>;

type SaveStatus = 'idle' | 'saving' | 'saved';

export default function JournalForm() {
  const today = getToday();
  const [entry, setEntry] = useState<JournalEntry>(() => {
    if (typeof window === 'undefined') return emptyEntry(today);
    return getEntryByDate(today) ?? emptyEntry(today);
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSave = useCallback((updated: JournalEntry) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    saveTimer.current = setTimeout(() => {
      saveEntry(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1800);
    }, 800);
  }, []);

  const handleChange = useCallback(
    (key: FieldKey, value: string) => {
      setEntry((prev) => {
        const updated = { ...prev, [key]: value };
        triggerSave(updated);
        return updated;
      });
    },
    [triggerSave]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <div className="relative z-10 max-w-2xl mx-auto px-6 py-16 pb-32">
      {/* Header */}
      <div className="mb-16">
        <p
          className="text-xs tracking-[0.3em] uppercase mb-3"
          style={{ color: '#8a6540', fontFamily: 'var(--font-dm-mono)' }}
        >
          Evening Solitude
        </p>
        <h1
          className="text-5xl font-light leading-tight mb-2"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#e6ddd0' }}
        >
          {formatDate(today)}
        </h1>
        <div className="flex items-center gap-3 mt-4">
          <div style={{ width: '40px', height: '1px', background: '#2a2318' }} />
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <>
                <span className="save-dot" />
                <span className="text-xs" style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}>
                  saving
                </span>
              </>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs" style={{ color: '#8a6540', fontFamily: 'var(--font-dm-mono)' }}>
                saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-16">
        {SECTIONS.map((section) => {
          if (section.isIntro) {
            return (
              <div key={section.number} className="entry-section relative">
                <span className="section-number">{section.number}</span>
                <p
                  className="text-xs tracking-[0.25em] uppercase mb-2"
                  style={{ color: '#6b5f52' }}
                >
                  {section.number}
                </p>
                <h2
                  className="text-3xl font-light mb-1"
                  style={{ fontFamily: 'var(--font-cormorant)', color: '#e6ddd0' }}
                >
                  {section.title}
                </h2>
                {section.subtitle && (
                  <p className="text-sm italic" style={{ color: '#6b5f52' }}>
                    {section.subtitle}
                  </p>
                )}
                <div className="mt-6 p-4 border-l-2" style={{ borderColor: '#2a2318' }}>
                  <p className="text-xs leading-relaxed" style={{ color: '#6b5f52' }}>
                    Step away first. 10 minutes. No phone, no music. Let your mind settle before you write.
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div key={section.number} className="entry-section relative">
              <span className="section-number">{section.number}</span>
              <p
                className="text-xs tracking-[0.25em] uppercase mb-2"
                style={{ color: '#6b5f52' }}
              >
                {section.number}
              </p>
              <h2
                className="text-3xl font-light mb-6"
                style={{ fontFamily: 'var(--font-cormorant)', color: '#e6ddd0' }}
              >
                {section.title}
              </h2>

              <div className="space-y-8">
                {section.fields.map((field) => (
                  <div key={field.key}>
                    {'label' in field && field.label && (
                      <p
                        className="text-xs tracking-wide mb-2"
                        style={{ color: '#8a6540', fontFamily: 'var(--font-dm-mono)' }}
                      >
                        {field.label}
                      </p>
                    )}
                    <AutoResizeTextarea
                      value={entry[field.key as FieldKey] as string}
                      onChange={(val) => handleChange(field.key as FieldKey, val)}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>

              <hr className="divider mt-10" />
            </div>
          );
        })}
      </div>

      {/* Affirmation */}
      <div className="entry-section mt-20 text-center py-10">
        <div
          style={{ width: '1px', height: '60px', background: 'linear-gradient(to bottom, transparent, #2a2318)', margin: '0 auto 2rem' }}
        />
        <p className="affirmation text-xl">
          &ldquo;I showed up today. Tomorrow I improve.&rdquo;
        </p>
        <div
          style={{ width: '1px', height: '60px', background: 'linear-gradient(to top, transparent, #2a2318)', margin: '2rem auto 0' }}
        />
      </div>
    </div>
  );
}

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      className="journal-textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
    />
  );
}
