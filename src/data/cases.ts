export type Platform = 'android' | 'ios' | 'flutter' | 'web';

export interface CaseCard {
  /** Anchor id on /cases/ (cards without a detail page link to it). */
  id: string;
  title: string;
  desc: string;
  tags: string[];
  cats: Platform[];
  metric: string;
  metricLabel: string;
  /** Detail page, when one exists. */
  href?: string;
}

export const filters: { id: 'all' | Platform; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'android', label: 'Android' },
  { id: 'ios', label: 'iOS' },
  { id: 'flutter', label: 'Flutter' },
  { id: 'web', label: 'Web' },
];

/** The flagship card is shown for these filters only. */
export const featuredCats: Platform[] = ['android', 'ios'];

export const cases: CaseCard[] = [
  { id: 'hebrew-ios', title: 'Learn Hebrew – Read & Speak (iOS)', desc: 'Native SwiftUI port of the Android app: 106 tasks in 5 phases, StoreKit subscriptions, shared API.', tags: ['iOS', 'SwiftUI'], cats: ['ios'], metric: '7.41%', metricLabel: 'day-7 download-to-paid', href: '/cases/hebrew-app/' },
  { id: 'hangul', title: 'Korean Alphabet: Hangul', desc: 'Hangul course with Phrase X-Ray breakdowns, stroke-order practice and a learning path. Now on iOS too.', tags: ['Android', 'iOS'], cats: ['android', 'ios'], metric: '10K+', metricLabel: 'downloads on Google Play' },
  { id: 'poker', title: 'Learn Poker: Lessons & Trainer', desc: "Texas Hold'em trainer: five drills, SM-2 daily review, hand simulator, localized to Brazilian Portuguese.", tags: ['Android', 'Compose'], cats: ['android'], metric: '~20', metricLabel: 'downloads to first paid subscriber' },
  { id: 'verbs', title: 'Estonian Verbs: Conjugation', desc: 'Flutter app on my own language-app framework: Bloc, spaced repetition, offline audio, EN/RU interface.', tags: ['Flutter'], cats: ['flutter'], metric: '50', metricLabel: 'verbs × 7 practice blocks' },
  { id: 'hebrewedu', title: 'hebrewedu.com', desc: 'Astro content site with browser games, an alphabet course and a French version, built to send search traffic into the apps.', tags: ['Web', 'Astro', 'SEO'], cats: ['web'], metric: 'EN + FR', metricLabel: 'mirrored content' },
];
