import type { JournalEntry } from './types';

const STORAGE_KEY = 'stoic_journal_entries';

export function getEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getEntryByDate(date: string): JournalEntry | null {
  const entries = getEntries();
  return entries.find((e) => e.date === date) ?? null;
}

export function saveEntry(entry: JournalEntry): void {
  const entries = getEntries();
  const idx = entries.findIndex((e) => e.date === entry.date);
  if (idx >= 0) {
    entries[idx] = { ...entry, savedAt: new Date().toISOString() };
  } else {
    entries.push({ ...entry, savedAt: new Date().toISOString() });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-IE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function emptyEntry(date: string): JournalEntry {
  return {
    id: crypto.randomUUID(),
    date,
    mindRightNow: '',
    didWell: '',
    fellShort: '',
    actedIntentionally: '',
    followedThrough: '',
    smallWin: '',
    drifting: '',
    improveTomorrow: '',
    avoiding: '',
    whatMatters: '',
    letGo: '',
    savedAt: '',
  };
}
