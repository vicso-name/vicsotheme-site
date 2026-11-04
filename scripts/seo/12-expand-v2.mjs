// Step R3 (plan v2) — expansion beyond the v1 core. Paid: related searches
// for every W1 phrase head and Phrase X-Ray pack, keyword ideas for K-Pop /
// K-Drama vocabulary and word topics (both come back already measured).
// Free: letter-name candidates for all 40 jamo, iOS app-intent candidates and
// Google autocomplete for the new heads — those are measured in R4.
// Output: docs/seo/research/hangulhero/12-expansion.json
//
// Usage: node scripts/seo/12-expand-v2.mjs --cap 2.50

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCaller, perKeywordPricing, ledgerSpent, balanceUsd, SpendCapExceeded } from './yepapi-client.mjs';

const RESEARCH = resolve(new URL('../../docs/seo/research', import.meta.url).pathname);
const DIR = resolve(RESEARCH, 'hangulhero');
const AC_CACHE = resolve(RESEARCH, 'responses/autocomplete');
const stepCap = Number(process.argv[process.argv.indexOf('--cap') + 1]);
if (!stepCap) throw new Error('pass --cap <usd>');

// W1 phrase heads (pages.csv) and one seed per Phrase X-Ray pack.
const PACK_SEEDS = [
  'korean phrases from kdrama', 'korean food words', 'korean phrases for travel', 'korean shopping phrases',
  'korean expressions', 'korean love words', 'korean emergency phrases', 'korean phrases for work',
];
const RELATED_LIMIT = 100;
// Vocabulary and word topics the app or the site could cover.
const IDEA_SEEDS = [
  'korean slang words', 'kdrama words', 'korean nicknames', 'korean honorifics', 'korean swear words',
  'korean numbers', 'days of the week in korean', 'colors in korean', 'family members in korean',
  'korean food names', 'korean alphabet letters', 'korean alphabet app',
];
const IDEAS_LIMIT = 150;

// All 40 jamo: [letter, romanized name].
const CONSONANTS = [
  ['ㄱ', 'giyeok'], ['ㄴ', 'nieun'], ['ㄷ', 'digeut'], ['ㄹ', 'rieul'], ['ㅁ', 'mieum'], ['ㅂ', 'bieup'], ['ㅅ', 'siot'],
  ['ㅇ', 'ieung'], ['ㅈ', 'jieut'], ['ㅊ', 'chieut'], ['ㅋ', 'kieuk'], ['ㅌ', 'tieut'], ['ㅍ', 'pieup'], ['ㅎ', 'hieut'],
  ['ㄲ', 'ssang giyeok'], ['ㄸ', 'ssang digeut'], ['ㅃ', 'ssang bieup'], ['ㅆ', 'ssang siot'], ['ㅉ', 'ssang jieut'],
];
const VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ', 'ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'];
const JAMO_CANDIDATES = [
  ...CONSONANTS.flatMap(([j, name]) => [name, `${name} korean`, `korean letter ${name}`, `${j} in korean`, `${j} pronunciation`, `how to pronounce ${j}`, `korean letter ${j}`]),
  ...VOWELS.flatMap((j) => [`${j} pronunciation`, `korean vowel ${j}`, `korean letter ${j}`, `how to pronounce ${j}`]),
  ...'abcdefghijklmnopqrstuvwxyz'.split('').map((l) => `how to say ${l} in korean`),
];
const IOS_CANDIDATES = [
  'korean alphabet app iphone', 'korean alphabet app ios', 'learn hangul app ios', 'hangul app iphone', 'korean app for iphone',
  'learn korean app iphone', 'learn korean app ios', 'best korean app for iphone', 'korean alphabet app ipad',
  'offline korean app', 'korean learning app offline', 'learn korean offline app', 'korean app offline free',
  'korean alphabet app android', 'hangul app android', 'korean phrase app', 'korean phrases app', 'kdrama korean app',
];
const IOS_AC_SEEDS = ['korean app for iphone', 'learn korean app ios', 'korean alphabet app', 'hangul app', 'offline korean app', 'korean phrases app'];

const KOREAN = /korean|korea|hangul|hangeul|kpop|k-pop|kdrama|k-drama|batchim|jamo|oppa|unnie|noona|hyung|sunbae|maknae|aegyo|saranghae|hwaiting|fighting|chingu|daebak|aigoo|jinjja|[ㄱ-ㆎ가-힣]/;
const NAMES = new RegExp(`^(${CONSONANTS.map(([, n]) => n).join('|')})\\b`);
// Same exclusions as step 06: other brands, other languages, translators.
const OFF = /duolingo|talk to me in korean|ttmik|lingodeer|rosetta|babbel|memrise|anki|busuu|koreanclass101|90 ?day ?korean|howtostudykorean|pimsleur|drops|\bjapanese|chinese|spanish|french|hindi|tagalog|vietnamese|thai|indonesian|arabic|sign language|translator|translate|google|chatgpt|reddit|pdf free download/;
const JUNK = /\s[a-z]$|unicode|filler|invisible|jewelry|quilt|stickers|necklace|tattoo|shirt|kaise|bangla|nepali|urdu|kashmir|stag|deer|wiki|font download|korean air|korea(n)? (war|news|time|weather forecast|stock)|north korea|kim jong|samsung|hyundai|kia\b/;
const norm = (k) => k.toLowerCase().replace(/\s+/g, ' ').trim();
const onTopic = (k) => (KOREAN.test(k) || NAMES.test(k)) && !OFF.test(k) && !JUNK.test(k) && k.split(' ').length <= 9;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function autocomplete(q) {
  await mkdir(AC_CACHE, { recursive: true });
  const path = resolve(AC_CACHE, `${createHash('sha256').update(q).digest('hex').slice(0, 16)}.json`);
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { /* miss */ }
  const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`autocomplete ${res.status} for "${q}"`);
  const [, suggestions] = await res.json();
  await writeFile(path, JSON.stringify(suggestions));
  await sleep(300);
  return suggestions;
}

const csvFirstCol = async (file) => (await readFile(resolve(DIR, file), 'utf8')).trim().split('\n').slice(1)
  .map((l) => norm(l.match(/^("([^"]|"")*"|[^,]*)/)[0].replace(/^"|"$/g, '')));
const known = new Set([...(await csvFirstCol('semantic-core.csv')), ...(await csvFirstCol('gap.csv'))]);
const phraseHeads = (await readFile(resolve(DIR, 'pages.csv'), 'utf8')).trim().split('\n').slice(1)
  .map((l) => l.split(',')).filter((c) => c[1] === '1' && c[2] === 'programmatic').map((c) => c[5]);

const balance = await balanceUsd();
const capUsd = Math.min(stepCap, balance);
console.log(`balance $${balance.toFixed(2)}, step cap $${capUsd.toFixed(2)}`);
const caller = createCaller({ capUsd, spentUsd: await ledgerSpent(undefined, { notePrefix: 'R3' }) });

// keyword -> overview-shaped row (volume, difficulty, intent, trend…) + sources
const measured = new Map();
const keep = (k, source) => {
  const kw = norm(k.keyword);
  if (!onTopic(kw) || !(k.volume >= 10)) return;
  const row = measured.get(kw) ?? { ...k, keyword: kw, sources: [] };
  row.sources.push(source);
  measured.set(kw, row);
};
const jobs = [
  ...[...phraseHeads, ...PACK_SEEDS].map((seed) => ({ endpoint: '/v1/seo/keywords/related', seed, limit: RELATED_LIMIT, kind: 'related' })),
  ...IDEA_SEEDS.map((seed) => ({ endpoint: '/v1/seo/keywords/ideas', seed, limit: IDEAS_LIMIT, kind: 'ideas' })),
];
let stopped = null;
for (const { endpoint, seed, limit, kind } of jobs) {
  const body = { keyword: seed, limit, location_code: 2840, language: 'en' };
  if (kind === 'ideas') Object.assign(body, { filters: [{ field: 'volume', op: '>=', value: 10 }], sort: ['volume:desc'] });
  try {
    const { data, cached, cost } = await caller.call(endpoint, body, {
      note: `R3 ${kind} ${seed}`, paramsSummary: `${kind} "${seed}" us/en limit ${limit}`, estimateCost: perKeywordPricing(limit),
    });
    const before = measured.size;
    for (const k of data.keywords ?? []) keep(k, `${kind}:${seed}`);
    console.log(`${cached ? 'cache' : 'paid '} ${kind} "${seed}": ${data.keywords?.length ?? 0} → +${measured.size - before} on-topic ($${cost.toFixed(2)})`);
  } catch (err) {
    if (err instanceof SpendCapExceeded) { stopped = err.message; break; }
    console.log(`fail  ${kind} "${seed}": ${err.message.slice(0, 160)}`);
  }
}

// Free layer: autocomplete for new heads (measured here, ≥ 500/mo, not in v1
// core or the gap list) and for app-intent seeds.
const newHeads = [...measured.values()].filter((k) => !known.has(k.keyword) && k.volume >= 500)
  .sort((a, b) => b.volume - a.volume).slice(0, 60).map((k) => k.keyword);
const unmeasured = new Map();
const cand = (k, source) => {
  k = norm(k);
  if (!onTopic(k) || known.has(k) || measured.has(k)) return;
  (unmeasured.get(k) ?? unmeasured.set(k, new Set()).get(k)).add(source);
};
JAMO_CANDIDATES.forEach((k) => cand(k, 'jamo'));
IOS_CANDIDATES.forEach((k) => cand(k, 'ios'));
let acCalls = 0;
for (const q of [...newHeads, ...IOS_AC_SEEDS]) {
  try { (await autocomplete(q)).forEach((s) => cand(s, `ac:${q}`)); acCalls++; } catch (err) { console.log(`fail  ${err.message}`); }
}

const out = {
  measured: [...measured.values()].sort((a, b) => b.volume - a.volume),
  new_heads: newHeads,
  unmeasured: [...unmeasured].map(([keyword, s]) => ({ keyword, sources: [...s] })),
};
await writeFile(resolve(DIR, '12-expansion.json'), JSON.stringify(out, null, 1));

const fresh = out.measured.filter((k) => !known.has(k.keyword));
console.log(`\nmeasured on-topic: ${out.measured.length} (${fresh.length} not in v1 core / gap, ${fresh.reduce((s, k) => s + k.volume, 0)} searches/mo)`);
console.log(`autocomplete: ${acCalls} queries (free); unmeasured candidates for R4: ${out.unmeasured.length}`);
console.log(`spent this step $${caller.spent.toFixed(2)}`);
if (stopped) console.log(`STOPPED: ${stopped}`);
console.log('\ntop new keywords:');
for (const k of fresh.slice(0, 40)) console.log(String(k.volume).padStart(7), String(k.difficulty ?? '-').padStart(3), k.keyword);
