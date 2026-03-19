import type { JournalEntry, WeeklyReview } from './types';

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
    outsideControl: '',
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

// ── Weekly review ─────────────────────────────────────────────

const WEEKLY_KEY = 'stoic_journal_weekly';

export function getWeeklyReviews(): WeeklyReview[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WEEKLY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getWeeklyReview(weekStart: string): WeeklyReview | null {
  return getWeeklyReviews().find((r) => r.weekStart === weekStart) ?? null;
}

export function saveWeeklyReview(review: WeeklyReview): void {
  const reviews = getWeeklyReviews();
  const idx = reviews.findIndex((r) => r.weekStart === review.weekStart);
  const updated = { ...review, savedAt: new Date().toISOString() };
  if (idx >= 0) reviews[idx] = updated;
  else reviews.push(updated);
  localStorage.setItem(WEEKLY_KEY, JSON.stringify(reviews));
}

export function emptyWeeklyReview(weekStart: string): WeeklyReview {
  return { id: crypto.randomUUID(), weekStart, patterns: '', virtue: '', carryForward: '', proudOf: '', savedAt: '' };
}

/** Returns the Monday of the current week as YYYY-MM-DD */
export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

/** Returns last 7 entries sorted newest-first */
export function getLastWeekEntries(): JournalEntry[] {
  const weekStart = getCurrentWeekStart();
  return getEntries()
    .filter((e) => e.date >= weekStart)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── Patterns ──────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
  'to', 'for', 'of', 'it', 'is', 'was', 'am', 'are', 'be', 'been', 'being',
  'do', 'did', 'does', 'have', 'had', 'has', 'not', 'no', 'so', 'up', 'if',
  'just', 'more', 'that', 'this', 'with', 'as', 'by', 'from', 'than', 'very',
  'feel', 'felt', 'really', 'maybe', 'think', 'could', 'would', 'should',
  'get', 'got', 'going', 'been', 'some', 'what', 'when', 'where', 'how',
  'yes', 'no', 'bit', 'much', 'still', 'also', 'about', 'out', 'all', 'like',
]);

/** Returns top recurring words across drifting + avoiding fields */
export function getRecurringPatterns(limit = 8): { word: string; count: number }[] {
  const entries = getEntries();
  const freq: Record<string, number> = {};

  for (const entry of entries) {
    const text = `${entry.drifting} ${entry.avoiding}`.toLowerCase();
    const words = text.match(/\b[a-z]{4,}\b/g) ?? [];
    for (const word of words) {
      if (!STOP_WORDS.has(word)) freq[word] = (freq[word] ?? 0) + 1;
    }
  }

  return Object.entries(freq)
    .filter(([, count]) => count > 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

// ── Export ────────────────────────────────────────────────────

export function exportToMarkdown(): string {
  const entries = getEntries().sort((a, b) => a.date.localeCompare(b.date));
  const lines: string[] = ['# Evening Solitude — Journal\n'];

  for (const e of entries) {
    lines.push(`## ${formatDate(e.date)}\n`);
    if (e.mindRightNow) lines.push(`**What's on my mind**\n${e.mindRightNow}\n`);
    if (e.didWell) lines.push(`**Did well**\n${e.didWell}\n`);
    if (e.fellShort) lines.push(`**Fell short**\n${e.fellShort}\n`);
    if (e.actedIntentionally) lines.push(`**Intentional or reactive?**\n${e.actedIntentionally}\n`);
    if (e.outsideControl) lines.push(`**Outside my control**\n${e.outsideControl}\n`);
    if (e.followedThrough) lines.push(`**Followed through?**\n${e.followedThrough}\n`);
    if (e.smallWin) lines.push(`**Small win**\n${e.smallWin}\n`);
    if (e.drifting) lines.push(`**Drifting**\n${e.drifting}\n`);
    if (e.improveTomorrow) lines.push(`**Improve tomorrow**\n${e.improveTomorrow}\n`);
    if (e.avoiding) lines.push(`**Avoiding**\n${e.avoiding}\n`);
    if (e.whatMatters) lines.push(`**What actually matters**\n${e.whatMatters}\n`);
    if (e.letGo) lines.push(`**Let go of**\n${e.letGo}\n`);
    lines.push('---\n');
  }

  return lines.join('\n');
}
