'use client';

import { useState, useEffect } from 'react';
import type { JournalEntry } from '@/lib/types';
import { getEntries, formatDate } from '@/lib/storage';

const FIELD_LABELS: { key: keyof Omit<JournalEntry, 'id' | 'date' | 'savedAt'>; section: string; label: string }[] = [
  { key: 'mindRightNow', section: '02', label: "What's on your mind?" },
  { key: 'didWell', section: '03', label: 'Did well' },
  { key: 'fellShort', section: '03', label: 'Fell short' },
  { key: 'actedIntentionally', section: '03', label: 'Intentional or reactive?' },
  { key: 'followedThrough', section: '04', label: 'Followed through?' },
  { key: 'smallWin', section: '04', label: 'Small win' },
  { key: 'drifting', section: '04', label: 'Drifting?' },
  { key: 'improveTomorrow', section: '05', label: 'Improve tomorrow' },
  { key: 'avoiding', section: '06', label: 'Avoiding?' },
  { key: 'whatMatters', section: '07', label: 'What actually matters?' },
  { key: 'letGo', section: '07', label: 'Let go of' },
];

export default function HistoryView() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const all = getEntries().sort((a, b) => b.date.localeCompare(a.date));
    setEntries(all);
    if (all.length > 0) setSelected(all[0]);
  }, []);

  const filtered = filter
    ? entries.filter((e) => {
        const [year, month] = e.date.split('-');
        const label = `${year}-${month}`;
        return label === filter;
      })
    : entries;

  // Build month options from entries
  const months = Array.from(
    new Set(entries.map((e) => e.date.slice(0, 7)))
  ).sort((a, b) => b.localeCompare(a));

  const hasContent = (entry: JournalEntry) =>
    FIELD_LABELS.some((f) => entry[f.key]?.trim());

  if (entries.length === 0) {
    return (
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-32 text-center">
        <p
          className="text-4xl font-light mb-4"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#e6ddd0' }}
        >
          No entries yet
        </p>
        <p className="text-sm" style={{ color: '#6b5f52' }}>
          Complete your first evening session to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 pt-24">
      {/* Header */}
      <div className="mb-12">
        <p
          className="text-xs tracking-[0.3em] uppercase mb-3"
          style={{ color: '#8a6540' }}
        >
          Archive
        </p>
        <h1
          className="text-5xl font-light"
          style={{ fontFamily: 'var(--font-cormorant)', color: '#e6ddd0' }}
        >
          Past Evenings
        </h1>

        {/* Month filter */}
        {months.length > 1 && (
          <div className="flex gap-3 mt-8 flex-wrap">
            <button
              onClick={() => setFilter('')}
              className="text-xs tracking-[0.2em] uppercase px-4 py-2 transition-all duration-200"
              style={{
                fontFamily: 'var(--font-dm-mono)',
                color: filter === '' ? '#c4935a' : '#6b5f52',
                border: `1px solid ${filter === '' ? '#8a6540' : '#2a2318'}`,
                background: filter === '' ? 'rgba(196,147,90,0.06)' : 'transparent',
              }}
            >
              All
            </button>
            {months.map((m) => {
              const [year, month] = m.split('-');
              const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IE', {
                month: 'short',
                year: 'numeric',
              });
              return (
                <button
                  key={m}
                  onClick={() => setFilter(m)}
                  className="text-xs tracking-[0.2em] uppercase px-4 py-2 transition-all duration-200"
                  style={{
                    fontFamily: 'var(--font-dm-mono)',
                    color: filter === m ? '#c4935a' : '#6b5f52',
                    border: `1px solid ${filter === m ? '#8a6540' : '#2a2318'}`,
                    background: filter === m ? 'rgba(196,147,90,0.06)' : 'transparent',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-10">
        {/* Entry list */}
        <div className="w-48 shrink-0">
          <div className="space-y-1 sticky top-24">
            {filtered.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelected(entry)}
                className="w-full text-left px-3 py-3 transition-all duration-200 group"
                style={{
                  borderLeft: `2px solid ${selected?.id === entry.id ? '#c4935a' : '#2a2318'}`,
                  background: selected?.id === entry.id ? 'rgba(196,147,90,0.04)' : 'transparent',
                }}
              >
                <p
                  className="text-xs"
                  style={{
                    fontFamily: 'var(--font-cormorant)',
                    color: selected?.id === entry.id ? '#e6ddd0' : '#6b5f52',
                    fontSize: '1rem',
                    lineHeight: 1.3,
                  }}
                >
                  {(() => {
                    const [y, m, d] = entry.date.split('-').map(Number);
                    const dt = new Date(y, m - 1, d);
                    return dt.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });
                  })()}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{
                    fontFamily: 'var(--font-dm-mono)',
                    color: '#3a3028',
                    fontSize: '0.65rem',
                  }}
                >
                  {(() => {
                    const [y, m, d] = entry.date.split('-').map(Number);
                    const dt = new Date(y, m - 1, d);
                    return dt.toLocaleDateString('en-IE', { weekday: 'short' }).toUpperCase();
                  })()}
                </p>
                {hasContent(entry) && (
                  <div
                    className="mt-1.5 w-1 h-1 rounded-full"
                    style={{ background: '#8a6540' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Entry detail */}
        {selected && (
          <div className="flex-1 min-w-0">
            <div className="mb-10">
              <h2
                className="text-4xl font-light mb-1"
                style={{ fontFamily: 'var(--font-cormorant)', color: '#e6ddd0' }}
              >
                {formatDate(selected.date)}
              </h2>
              {selected.savedAt && (
                <p className="text-xs" style={{ color: '#6b5f52', fontFamily: 'var(--font-dm-mono)' }}>
                  Saved at {new Date(selected.savedAt).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            <div className="space-y-10">
              {FIELD_LABELS.filter((f) => selected[f.key]?.trim()).map((f) => (
                <div key={f.key}>
                  <p
                    className="text-xs tracking-[0.2em] uppercase mb-2"
                    style={{ color: '#8a6540', fontFamily: 'var(--font-dm-mono)' }}
                  >
                    <span style={{ color: '#3a3028' }}>{f.section} — </span>
                    {f.label}
                  </p>
                  <p
                    className="leading-relaxed whitespace-pre-wrap"
                    style={{ color: '#c9bfb2', fontFamily: 'var(--font-dm-mono)', fontSize: '0.875rem', lineHeight: 1.9 }}
                  >
                    {selected[f.key]}
                  </p>
                  <hr style={{ borderColor: '#1a1610', marginTop: '1.5rem' }} />
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p
                className="italic"
                style={{ fontFamily: 'var(--font-cormorant)', color: '#8a6540', fontSize: '1.1rem' }}
              >
                &ldquo;I showed up today. Tomorrow I improve.&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
