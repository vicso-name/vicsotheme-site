// Step 6 — semantic core for a Hangul Hero marketing site. Mines free Google
// autocomplete for seeds that mirror the app's features (alphabet, sounds,
// Phrase X-Ray packs, quizzes, Sori reader, app-intent), adds templated phrase
// queries, then measures only the keywords phase 1 hasn't already measured —
// one overview call, which returns (and bills) only keywords that have data.
// Output: docs/seo/research/hangulhero/06-candidates.json
//
// Usage: node scripts/seo/06-hangulhero-expand.mjs --cap 2.00

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCaller, perKeywordPricing, ledgerSpent, SpendCapExceeded } from './yepapi-client.mjs';

const RESEARCH = resolve(new URL('../../docs/seo/research', import.meta.url).pathname);
const OUT = resolve(RESEARCH, 'hangulhero');
const AC_CACHE = resolve(RESEARCH, 'responses/autocomplete');
const capUsd = Number(process.argv[process.argv.indexOf('--cap') + 1]);
if (!capUsd) throw new Error('pass --cap <usd>');

// Seeds expanded with " a".." z" — the heads of each app feature.
const EXPAND = [
  'hangul', 'korean alphabet', 'korean letters', 'korean consonants', 'korean vowels',
  'korean pronunciation', 'korean phrases', 'korean words', 'learn korean', 'korean app',
  'how to read korean', 'korean slang',
];
// Seeds queried once.
const SINGLE = [
  'hangul chart', 'learn hangul', 'how to write korean', 'korean syllable blocks', 'batchim',
  'hangul pronunciation', 'korean romanization', 'jamo korean', 'double consonants korean',
  'korean alphabet app', 'hangul app', 'app to learn korean', 'learn korean app', 'best app to learn korean',
  'korean learning app', 'learn korean offline', 'learn korean for beginners', 'learn korean for free',
  'basic korean phrases', 'kdrama korean phrases', 'korean phrases for travel', 'korean food words',
  'korean words for love', 'korean phrases for work', 'korean lyrics romanized', 'read korean lyrics',
  'korean quiz', 'hangul quiz', 'korean alphabet game', 'korean alphabet practice',
];
// Phrase X-Ray packs: K-Drama, Food & Café, Getting Around, Shopping & Money,
// Feelings & Reactions, Love & Dating, Health & Emergencies, At Work.
const PHRASES = [
  'hello', 'thank you', 'i love you', 'sorry', 'good morning', 'good night', 'goodbye', 'yes', 'no',
  'how are you', 'i miss you', 'happy birthday', 'cheers', 'delicious', 'beautiful', 'cute', 'fighting',
  'oppa', 'unnie', 'hyung', 'noona', 'aigoo', 'jinjja', 'daebak', 'saranghae', 'omo',
  'excuse me', 'how much', 'where is the bathroom', 'water', 'coffee', 'help', 'hospital',
  'boyfriend', 'girlfriend', 'i like you', 'friend', 'love', 'happy', 'sad', 'angry', 'tired',
  'boss', 'work hard', 'welcome', 'nice to meet you', 'my name is', 'what is your name',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function autocomplete(q) {
  await mkdir(AC_CACHE, { recursive: true });
  const path = resolve(AC_CACHE, `${createHash('sha256').update(q).digest('hex').slice(0, 16)}.json`);
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { /* miss */ }
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`autocomplete ${res.status} for "${q}"`);
  const [, suggestions] = await res.json();
  await writeFile(path, JSON.stringify(suggestions));
  await sleep(300);
  return suggestions;
}

const KOREAN = /korean|korea|hangul|hangeul|kpop|k-pop|kdrama|k-drama|batchim|jamo/;
// Other learning brands and other languages are not ours to target.
const OFF = /duolingo|talk to me in korean|ttmik|lingodeer|rosetta|babbel|memrise|anki|busuu|koreanclass101|90 ?day ?korean|howtostudykorean|pimsleur|drops|\bjapanese|chinese|spanish|french|hindi|tagalog|vietnamese|thai|indonesian|arabic|sign language|translator|translate|google|chatgpt|reddit|pdf free download/;
// Autocomplete noise: dangling one-letter suffixes, unicode/dev queries, merch,
// non-English learners, bands and unrelated senses of "hangul" (Kashmir stag).
const JUNK = /\s[a-z]$|unicode|filler|invisible|character range|jewelry|quilt|beads|stickers|necklace|tattoo|shirt|kaise|bangla|nepali|hindi|urdu|africa|xdinary|xodiac|kashmir|stag|deer|yahoo|wiki|juice|zeichen|deformity|planet|emoticons|calligraphy font|font download/;
const norm = (k) => k.toLowerCase().replace(/\s+/g, ' ').trim();

// keyword -> { sources, rank }; lower rank = measured first. Autocomplete order
// tracks popularity; suggestions from a bare seed beat those from "seed + letter".
const pool = new Map();
const add = (k, source, rank = 50) => {
  k = norm(k);
  if (!KOREAN.test(k) || OFF.test(k) || JUNK.test(k) || k.split(' ').length > 9) return;
  if (!pool.has(k)) pool.set(k, { sources: new Set(), rank });
  const e = pool.get(k);
  e.sources.add(source);
  e.rank = Math.min(e.rank, rank);
};

let acCalls = 0;
for (const seed of EXPAND) {
  for (const q of [seed, ...'abcdefghijklmnopqrstuvwxyz'.split('').map((c) => `${seed} ${c}`)]) {
    const bonus = q === seed ? 0 : 4;
    (await autocomplete(q)).forEach((s, i) => add(s, `ac:${seed}`, i + bonus));
    acCalls++;
  }
}
for (const seed of SINGLE) { (await autocomplete(seed)).forEach((s, i) => add(s, `ac:${seed}`, i)); acCalls++; }
for (const p of PHRASES) {
  add(`${p} in korean`, 'phrase-template', -1);
  add(`how to say ${p} in korean`, 'phrase-template', -1);
  (await autocomplete(`how to say ${p} in korean`)).forEach((s, i) => add(s, `ac:phrase:${p}`, i + 2));
  acCalls++;
}
console.log(`autocomplete: ${acCalls} queries (free), pool ${pool.size}`);

// Phase 1 already measured these — reuse, don't pay again.
const { measured: phase1 } = JSON.parse(await readFile(resolve(RESEARCH, '03-candidates.json'), 'utf8'));
const known = new Map(phase1.filter((k) => KOREAN.test(norm(k.keyword))).map((k) => [norm(k.keyword), k]));
for (const [k, v] of known) add(k, `phase1:${v.sources[0] ?? ''}`);

const fresh = [...pool.keys()].filter((k) => !known.has(k)).sort((a, b) => pool.get(a).rank - pool.get(b).rank);
console.log(`phase-1 korean rows reused: ${known.size}; new to measure: ${fresh.length}`);
if (process.argv.includes('--dry')) {
  await mkdir(OUT, { recursive: true });
  await writeFile(resolve(OUT, '06-pool-dry.txt'), fresh.map((k) => `${pool.get(k).rank}\t${k}`).join('\n') + '\n');
  process.exit(0);
}

// First batch is the overview max (700); the second takes whatever the
// remaining cap can cover at worst case ($0.03 + $0.03 per 100 keywords).
const caller = createCaller({ capUsd, spentUsd: await ledgerSpent() });
const measuredNew = [];
let offset = 0;
for (let i = 0; i < 2 && offset < fresh.length; i++) {
  const room = Math.floor(((capUsd - caller.spent - 0.03) * 100) / 0.03 / 100) * 100;
  const size = Math.min(700, room, fresh.length - offset);
  if (size < 100) break;
  const batch = fresh.slice(offset, offset + size);
  offset += size;
  try {
    const { data, cost } = await caller.call('/v1/seo/keywords/overview', { keywords: batch, location: 'us', language: 'en' }, {
      note: 'hangulhero overview', paramsSummary: `overview ${batch.length} kw us/en`, estimateCost: perKeywordPricing(batch.length),
    });
    measuredNew.push(...(data.keywords ?? []));
    console.log(`overview: ${data.keywords?.length ?? 0} of ${batch.length} have data ($${cost.toFixed(2)})`);
  } catch (err) {
    if (!(err instanceof SpendCapExceeded)) throw err;
    console.log(err.message);
    break;
  }
}
console.log(`left unmeasured: ${fresh.length - offset}`);

const rows = [...known.values(), ...measuredNew]
  .map((k) => ({ ...k, keyword: norm(k.keyword), sources: [...(pool.get(norm(k.keyword))?.sources ?? [])] }));
await mkdir(OUT, { recursive: true });
await writeFile(resolve(OUT, '06-candidates.json'), JSON.stringify(rows, null, 1) + '\n');
console.log(`measured total: ${rows.length}; ledger total: $${caller.spent.toFixed(4)}`);
