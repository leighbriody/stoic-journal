export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mindRightNow: string;
  didWell: string;
  fellShort: string;
  actedIntentionally: string;
  outsideControl: string;
  followedThrough: string;
  smallWin: string;
  drifting: string;
  improveTomorrow: string;
  avoiding: string;
  whatMatters: string;
  letGo: string;
  savedAt: string;
}

export interface MentorChat {
  date: string; // YYYY-MM-DD
  messages: { role: 'user' | 'assistant'; content: string }[];
  savedAt: string;
}

export interface WeeklyReview {
  id: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  patterns: string;
  virtue: string;
  carryForward: string;
  proudOf: string;
  savedAt: string;
}
