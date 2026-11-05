/** HebrewEdu browser games, in release order (shown on /cases/hebrewedu-games/). */
export const gamesBase = 'https://hebrewedu.com/play/';

export interface Game {
  name: string;
  slug: string;
  /** Brief → live dates. */
  date: string;
  mechanic: string;
  teaches: string;
}

export const games: Game[] = [
  { name: 'Alef Bet Rush', slug: 'alef-bet-rush', date: 'Oct 3 → live Oct 5', mechanic: 'Galaxy of 8 planets: learn, recognise, then race against the clock.', teaches: '22 letters, incl. look-alikes' },
  { name: 'Hebrew Mahjong', slug: 'hebrew-mahjong', date: 'Oct 6 → live Oct 8', mechanic: 'Mahjong solitaire: match each letter tile to its name.', teaches: 'letters ↔ names, with audio' },
  { name: 'Word Search', slug: 'hebrew-word-search', date: 'Oct 8 → live Oct 13', mechanic: 'Drag across a right-to-left letter grid to find words.', teaches: 'written nouns, final forms' },
  { name: 'Word Builder', slug: 'hebrew-word-builder', date: 'Oct 23, same day', mechanic: 'Hear an English word, spell it in Hebrew from tiles.', teaches: 'spelling' },
  { name: 'Hebrew Crossword', slug: 'hebrew-crossword', date: 'Oct 23, same day', mechanic: 'Mini crosswords with audio clues, typed right to left.', teaches: 'recall and spelling' },
  { name: 'Numbers Quest', slug: 'hebrew-numbers-quest', date: 'Oct 24 → live Oct 25', mechanic: 'Side-scrolling platformer with question gates.', teaches: 'numbers 0–20' },
  { name: 'Falafel Stand', slug: 'hebrew-falafel-stand', date: 'Nov 1, same day', mechanic: 'Customers order aloud: listen, build the order, ring the bell.', teaches: 'listening, food words' },
  { name: 'Shalom City', slug: 'hebrew-shalom-city', date: 'Nov 2 → live Nov 3', mechanic: 'Walk a city and handle 14 everyday conversations.', teaches: 'dialogues, gender forms' },
];

export const gameHref = (g: Game) => `${gamesBase}${g.slug}/`;
