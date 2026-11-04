// Step R9 (plan v2) — ASO research for the Hangul Hero store listings. Free:
// App Store search hints and Google Play web suggest (both ordered by
// popularity), then the app search results for the top terms — who ranks, and
// where Hangul Hero ranks on Play today.
// Responses are cached in docs/seo/research/responses/aso/ (gitignored).
// Output: docs/seo/research/hangulhero/aso-suggestions.csv, aso-serp.csv, 19-aso.json
//
// Usage: node scripts/seo/19-aso-suggest.mjs [--no-serp]

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('../../docs/seo/research', import.meta.url).pathname);
const DIR = resolve(ROOT, 'hangulhero');
const CACHE = resolve(ROOT, 'responses/aso');
const OUR_PLAY_ID = 'com.vicsothemes.hangulhero';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const SERP_TERMS = 40; // top suggestions (by combined rank) to pull app results for
const PLAY_SERP_DEPTH = 30;

const SEEDS = [
  'korean', 'korean alphabet', 'hangul', 'learn korean', 'korean letters', 'korean reading',
  'korean writing', 'korean pronunciation', 'korean phrases', 'korean words', 'korean vocabulary',
  'korean for beginners', 'korean quiz', 'korean game', 'korean app', 'korean offline',
  'korean travel', 'korean slang', 'kdrama', 'kpop korean', 'korean flashcards', 'korean audio',
  'korean conversation', 'speak korean', 'korean language', 'hangeul', 'learn hangul', 'korean course',
  'korean study', 'korean lessons', 'korean translator', 'korean dictionary', 'topik',
  'korean consonants', 'korean vowels', 'korean handwriting', 'korean listening', 'korean kids',
  'language learning', 'learn languages',
];
// Seeds worth a full a–z sweep: the heads our listing should own.
const DEEP = ['korean', 'korean alphabet', 'hangul', 'learn korean', 'korean phrases', 'korean words'];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

await mkdir(CACHE, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function cached(kind, key, fetcher) {
  const path = resolve(CACHE, `${kind}-${createHash('sha256').update(key).digest('hex').slice(0, 16)}.json`);
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { /* miss */ }
  await sleep(350);
  const data = await fetcher();
  await writeFile(path, JSON.stringify({ key, data }));
  return { key, data };
}

const appleHints = (term) => cached('apple-hints', term, async () => {
  const res = await fetch(`https://search.itunes.apple.com/WebObjects/MZSearchHints.woa/wa/hints?clientApplication=Software&f=json&term=${encodeURIComponent(term)}`,
    { headers: { 'User-Agent': UA, 'X-Apple-Store-Front': '143441-1,29' } }); // US storefront
  if (!res.ok) throw new Error(`apple hints ${res.status}`);
  return (await res.json()).map((h) => h.searchTerm);
}).then((r) => r.data);

const playSuggest = (term) => cached('play-suggest', term, async () => {
  const q = JSON.stringify([[['IJ4APc', JSON.stringify([[null, [term], [10], [2], 4]]), null, 'generic']]]);
  const res = await fetch('https://play.google.com/_/PlayStoreUi/data/batchexecute?rpcids=IJ4APc&hl=en&gl=US', {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: `f.req=${encodeURIComponent(q)}`,
  });
  if (!res.ok) throw new Error(`play suggest ${res.status}`);
  const outer = JSON.parse((await res.text()).replace(/^\)\]\}'\s*/, ''));
  const inner = outer[0]?.[2] ? JSON.parse(outer[0][2]) : null;
  return (inner?.[0]?.[0] ?? []).map((s) => s[0]);
}).then((r) => r.data);

const appleSearch = (term) => cached('apple-search', term, async () => {
  const res = await fetch(`https://itunes.apple.com/search?entity=software&country=us&limit=25&term=${encodeURIComponent(term)}`);
  if (!res.ok) throw new Error(`itunes search ${res.status}`);
  return (await res.json()).results.map((a) => ({
    id: a.trackId, name: a.trackName, seller: a.sellerName, ratings: a.userRatingCount, rating: a.averageUserRating,
    price: a.price, genre: a.primaryGenreName, released: a.releaseDate?.slice(0, 10), updated: a.currentVersionReleaseDate?.slice(0, 10),
  }));
}).then((r) => r.data);

const playSearch = (term) => cached('play-search', term, async () => {
  const res = await fetch(`https://play.google.com/store/search?c=apps&hl=en&gl=US&q=${encodeURIComponent(term)}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`play search ${res.status}`);
  // App ids in page order; the first occurrence of each is its result position.
  return [...new Set([...(await res.text()).matchAll(/details\?id=([A-Za-z0-9._]+)/g)].map((m) => m[1]))];
}).then((r) => r.data);

// 1. Suggestions: every seed, plus "seed a".."seed z" for the deep seeds.
const queries = [...SEEDS.map((s) => ({ seed: s, q: s })), ...DEEP.flatMap((s) => LETTERS.map((l) => ({ seed: s, q: `${s} ${l}` })))];
const terms = {};
for (const { seed, q } of queries) {
  for (const [store, fn] of [['apple', appleHints], ['play', playSuggest]]) {
    let list = [];
    try { list = await fn(q); } catch (err) { console.log(`fail  ${store} "${q}": ${err.message}`); }
    list.forEach((term, i) => {
      const t = (terms[term.toLowerCase()] ??= { term: term.toLowerCase(), apple_best: '', play_best: '', apple_hits: 0, play_hits: 0, seeds: new Set() });
      t[`${store}_hits`] += 1;
      t[`${store}_best`] = Math.min(t[`${store}_best`] || 99, i + 1);
      t.seeds.add(seed);
    });
  }
}
// Rank: seen in both stores first, then by how often and how high it was suggested.
const score = (t) => (t.apple_hits && t.play_hits ? 100 : 0) + t.apple_hits + t.play_hits - ((t.apple_best || 11) + (t.play_best || 11)) / 10;
const rows = Object.values(terms).map((t) => ({ ...t, both: t.apple_hits && t.play_hits ? 'yes' : '', score: Math.round(score(t) * 10) / 10, seeds: [...t.seeds].join('; ') }))
  .sort((a, b) => b.score - a.score);

const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const toCsv = (list, cols) => [cols.join(','), ...list.map((r) => cols.map((c) => esc(r[c] ?? '')).join(','))].join('\n') + '\n';
await writeFile(resolve(DIR, 'aso-suggestions.csv'), toCsv(rows, ['term', 'both', 'score', 'apple_best', 'apple_hits', 'play_best', 'play_hits', 'seeds']));
console.log(`${queries.length} suggest queries × 2 stores → ${rows.length} terms (${rows.filter((r) => r.both).length} in both stores)`);

// 2. App results for the top terms (Korean-related only).
const serp = {};
if (!process.argv.includes('--no-serp')) {
  for (const { term } of rows.filter((r) => /korea|hangul|hangeul|kdrama|kpop|topik/.test(r.term)).slice(0, SERP_TERMS)) {
    try {
      const [apple, play] = [await appleSearch(term), await playSearch(term)];
      serp[term] = { apple, play: play.slice(0, PLAY_SERP_DEPTH) };
    } catch (err) { console.log(`fail  serp "${term}": ${err.message}`); }
  }
}
await writeFile(resolve(DIR, '19-aso.json'), JSON.stringify({ suggestions: rows, serp }, null, 1));

const serpRows = Object.entries(serp).map(([term, { apple, play }]) => {
  const pos = play.indexOf(OUR_PLAY_ID);
  return {
    term, our_play_position: pos >= 0 ? pos + 1 : '', play_top5: play.slice(0, 5).join(' '),
    apple_top5: apple.slice(0, 5).map((a) => `${a.name} (${a.ratings ?? 0})`).join(' | '),
    apple_top10_median_ratings: [...apple.slice(0, 10).map((a) => a.ratings ?? 0)].sort((a, b) => a - b)[Math.min(4, apple.length - 1)] ?? '',
  };
});
await writeFile(resolve(DIR, 'aso-serp.csv'), toCsv(serpRows, ['term', 'our_play_position', 'apple_top10_median_ratings', 'play_top5', 'apple_top5']));

console.log('\ntop terms:');
for (const r of rows.slice(0, 40)) console.log(r.both.padEnd(4), String(r.score).padStart(6), `A${r.apple_best || '-'}/${r.apple_hits}`.padEnd(7), `P${r.play_best || '-'}/${r.play_hits}`.padEnd(7), r.term);
console.log('\nHangul Hero on Play (position in top', PLAY_SERP_DEPTH, '):');
for (const r of serpRows) console.log(String(r.our_play_position || '—').padStart(3), String(r.apple_top10_median_ratings).padStart(7), r.term);
