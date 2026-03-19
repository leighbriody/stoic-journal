export interface Quote {
  text: string;
  author: string;
  source: string;
}

export const QUOTES: Quote[] = [
  // Seneca — Letters from a Stoic
  { text: 'Retire into yourself as much as you can.', author: 'Seneca', source: 'Letters from a Stoic' },
  { text: 'We suffer more in imagination than in reality.', author: 'Seneca', source: 'Letters from a Stoic' },
  { text: 'Omnia aliena sunt, tempus tantum nostrum est. All things are alien; time alone is ours.', author: 'Seneca', source: 'Letters from a Stoic' },
  { text: 'Begin at once to live, and count each separate day as a separate life.', author: 'Seneca', source: 'Letters from a Stoic' },
  { text: 'No man is free who is not master of himself.', author: 'Seneca', source: 'Letters from a Stoic' },
  { text: 'It is not that I am brave, but that I know what is not worth fearing.', author: 'Seneca', source: 'Letters from a Stoic' },
  { text: 'Associate with those who will make a better man of you.', author: 'Seneca', source: 'Letters from a Stoic' },
  { text: 'The wise man does not subject himself to chance.', author: 'Seneca', source: 'Letters from a Stoic' },
  { text: 'Vindica te tibi. Claim yourself for yourself.', author: 'Seneca', source: 'Letters from a Stoic' },
  { text: 'While we are postponing, life speeds by.', author: 'Seneca', source: 'Letters from a Stoic' },
  { text: 'Recede in te ipse. Withdraw into yourself.', author: 'Seneca', source: 'Letters from a Stoic' },
  { text: 'The day which we fear as our last is but the birthday of eternity.', author: 'Seneca', source: 'Letters from a Stoic' },
  { text: 'Hang on to your youthful enthusiasms — you will be able to use them better when you are older.', author: 'Seneca', source: 'Letters from a Stoic' },
  // Epictetus — Discourses
  { text: 'Make the best use of what is in your power, and take the rest as it happens.', author: 'Epictetus', source: 'Discourses' },
  { text: 'He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.', author: 'Epictetus', source: 'Discourses' },
  { text: 'Men are disturbed not by things, but by the opinions about things.', author: 'Epictetus', source: 'Discourses' },
  { text: 'First say to yourself what you would be, and then do what you have to do.', author: 'Epictetus', source: 'Discourses' },
  { text: 'Seek not the good in external things; seek it in yourself.', author: 'Epictetus', source: 'Discourses' },
  { text: 'No man is free who is not master of himself.', author: 'Epictetus', source: 'Discourses' },
  { text: 'It is impossible for a man to learn what he thinks he already knows.', author: 'Epictetus', source: 'Discourses' },
  { text: 'Don\'t explain your philosophy. Embody it.', author: 'Epictetus', source: 'Discourses' },
  { text: 'We cannot choose our external circumstances, but we can always choose how we respond to them.', author: 'Epictetus', source: 'Discourses' },
  { text: 'The key is to keep company only with people who uplift you, whose presence calls forth your best.', author: 'Epictetus', source: 'Discourses' },
  { text: 'Wealth consists not in having great possessions, but in having few wants.', author: 'Epictetus', source: 'Discourses' },
  { text: 'If you want to improve, be content to be thought foolish and stupid.', author: 'Epictetus', source: 'Discourses' },
  // Marcus Aurelius — Meditations
  { text: 'You have power over your mind, not outside events. Realise this, and you will find strength.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'The impediment to action advances action. What stands in the way becomes the way.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'Accept the things to which fate binds you, and love the people with whom fate brings you together.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'Do not indulge in dreams of what you have not, but count the blessings actually present.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'Confine yourself to the present.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'It is not death that a man should fear, but he should fear never beginning to live.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'Waste no more time arguing what a good man should be. Be one.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'If it is not right, do not do it; if it is not true, do not say it.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'The best revenge is to be unlike him who performed the injury.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'When you wake up in the morning, tell yourself: the people I deal with today will be meddling, ungrateful, arrogant, dishonest, jealous, and surly. They are this way because they cannot tell good from evil.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'Dwell on the beauty of life. Watch the stars, and see yourself running with them.', author: 'Marcus Aurelius', source: 'Meditations' },
  { text: 'Never let the future disturb you. You will meet it, if you have to, with the same weapons of reason which today arm you against the present.', author: 'Marcus Aurelius', source: 'Meditations' },
];

/** Returns a consistent quote for a given date */
export function getQuoteForDate(dateStr: string): Quote {
  const seed = dateStr.replace(/-/g, '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return QUOTES[seed % QUOTES.length];
}

export const MEMENTO_MORI: string[] = [
  'You could leave life right now. Let that determine what you do and say and think.',
  'Think of yourself as dead. You have lived your life. Now take what\'s left and live it properly.',
  'How long are you going to wait before you demand the best for yourself?',
  'It is not that we have a short time to live, but that we waste a great deal of it.',
  'The whole future lies in uncertainty: live immediately.',
];

export function getMementoForDate(dateStr: string): string {
  const seed = dateStr.replace(/-/g, '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  // Only show every ~3rd night based on date sum
  return seed % 3 === 0 ? MEMENTO_MORI[seed % MEMENTO_MORI.length] : '';
}
