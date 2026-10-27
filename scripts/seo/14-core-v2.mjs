// Plan v2 merge (free) — one keyword table from v1 (url-map.csv), R2 gap,
// R3 expansion and R4 measurements. Drops what isn't language learning, and
// groups close variants ("hello in korean language", "korean hello") under a
// variant key so R5 pays for one SERP per group, not per spelling.
// Output: docs/seo/research/hangulhero/semantic-core-v2-raw.csv
//
// Usage: node scripts/seo/14-core-v2.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DIR = resolve(new URL('../../docs/seo/research/hangulhero', import.meta.url).pathname);

const KOREAN = /korean|korea|hangul|hangeul|kpop|k-pop|kdrama|k-drama|batchim|jamo|oppa|unnie|noona|hyung|sunbae|maknae|aegyo|saranghae|hwaiting|fighting|chingu|daebak|aigoo|jinjja|shibal|[ㄱ-ㆎ가-힣]/;
const JAMO_NAMES = /^(giyeok|nieun|digeut|rieul|mieum|bieup|siot|ieung|jieut|chieut|kieuk|tieut|pieup|hieut|ssang \w+)\b/;
// Not language learning: travel/country facts, culture events, celebrities,
// other brands and tools, exams. Kept out of the core (listed as excluded).
const NOT_LEARNING = new RegExp([
  '\\btimes?\\b', 'timer', 'north', 'currency', '\\bwon\\b', 'money', 'countr', 'president', 'cit(y|ies)', 'chuseok', 'thanksgiving', 'holiday',
  'idol', 'actor', 'actress', 'celebrit', 'universit', 'yonsei', 'kpop music', 'pop music', 'what is kpop', 'traditional (wear|clothes|dress)',
  'drinking age', 'snack', 'recipe', 'restaurant', 'bbq', 'near me', 'exam', 'test paper', 'topik', 'papago', 'translat', 'dictionary',
  'weather forecast', 'news', 'war\\b', 'north korea', 'kim jong', 'samsung', 'hyundai', '\\bkia\\b', 'korean air', 'visa', 'flight',
  'duolingo', 'talk to me in korean', 'ttmik', 'lingodeer', 'rosetta', 'babbel', 'memrise', 'busuu', 'koreanclass101', '90 ?day ?korean',
  'howtostudykorean', 'pimsleur', 'japanese', 'chinese', 'spanish', 'french', 'hindi', 'tagalog', 'vietnamese', 'thai', 'arabic',
  'chatgpt', 'reddit', 'google', 'unicode', 'font', 'tattoo', 'shirt', 'jewelry', 'sticker', 'movie', 'netflix', 'drama list', 'best kdrama',
  'religio', 'instrument', '\\bfacts?\\b', 'legend', 'myth', 'demon', '\\bstars?\\b', 'singer', 'films?\\b', 'webtoon', 'phone number', 'cell phone',
  'book page', 'history of korea', 'culture', 'surgery', 'skincare', 'skin care', 'hair salon', 'makeup', 'fashion', 'stock', 'population', 'map\\b', 'flag', 'anthem', 'army', 'military',
].join('|'));
const BAD_EXACT = new Set(['korean', 'korean kr', 'south in korean', 'food korean', 'korean vs', 'korean language and', 'south korea korean']);
const onTopic = (k) => (KOREAN.test(k) || JAMO_NAMES.test(k)) && !NOT_LEARNING.test(k) && !BAD_EXACT.has(k) && k.split(' ').length <= 9;

// Variant key: content words only, sorted. Words that don't change the intent are dropped.
const FILLER = new Set(['in', 'of', 'the', 'a', 'an', 'to', 'how', 'do', 'you', 'say', 'language', 'word', 'words', 'korean', 'korea', 'south',
  'is', 'what', 'for', 'and', 'with', 'hangul', 'meaning', 'means', 'mean', 'english', 'translation', 'learn', 'learning']);
const variantKey = (k) => {
  const words = k.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w && !FILLER.has(w));
  // "how to say you" keeps its only word; "i love you" keeps "i love".
  return (words.length ? words : k.split(/\s+/)).sort().join(' ');
};

const norm = (k) => k.toLowerCase().replace(/\s+/g, ' ').trim();
const parse = (text) => {
  const [head, ...lines] = text.trim().split('\n');
  const cols = head.split(',');
  return lines.map((line) => {
    const vals = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((v) => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
    return Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
  });
};
const yoy = (trend) => {
  if (!trend?.length) return '';
  const t = [...trend].sort((a, b) => a.month.localeCompare(b.month));
  const s = (a) => a.reduce((x, p) => x + p.volume, 0);
  const prev = s(t.slice(-24, -12));
  return prev ? Math.round((s(t.slice(-12)) / prev - 1) * 100) : '';
};

const rows = new Map();
const upsert = (keyword, fields) => {
  const k = norm(keyword);
  const r = rows.get(k) ?? { keyword: k, sources: new Set() };
  for (const [f, v] of Object.entries(fields)) if (v !== undefined && v !== '' && v !== null && (r[f] === undefined || f === 'source')) r[f] = v;
  if (fields.source) r.sources.add(fields.source);
  rows.set(k, r);
};
const fromOverview = (k, source) => ({
  volume: k.volume, kd: k.difficulty, intent: k.intent, cpc: k.cpc, yoy: yoy(k.trend), clickstream: k.clickstreamVolume, source,
});

for (const r of parse(await readFile(resolve(DIR, 'url-map.csv'), 'utf8'))) {
  upsert(r.keyword, { volume: Number(r.volume), kd: r.kd, intent: r.intent, source: 'v1', v1_url: r.url, v1_wave: r.wave, v1_section: r.section, v1_cluster: r.cluster });
}
const measured = JSON.parse(await readFile(resolve(DIR, '13-measured.json'), 'utf8'));
for (const k of measured.clickstream ?? []) upsert(k.keyword, { clickstream: k.clickstreamVolume, yoy: yoy(k.trend) });
for (const k of JSON.parse(await readFile(resolve(DIR, '12-expansion.json'), 'utf8')).measured) upsert(k.keyword, fromOverview(k, 'r3'));
for (const [group, list] of Object.entries(measured)) if (group !== 'clickstream') for (const k of list) upsert(k.keyword, fromOverview(k, `r4-${group}`));
for (const g of parse(await readFile(resolve(DIR, 'gap.csv'), 'utf8'))) {
  upsert(g.keyword, { volume: Number(g.volume), source: 'gap', competitors: Number(g.domains), competitor_best_pos: Number(g.best_position), competitor_url: g.best_url });
}

const list = [...rows.values()].filter((r) => r.volume >= 10).map((r) => ({
  ...r,
  sources: [...r.sources].join(' '),
  status: r.v1_wave === 'excluded' ? 'excluded' : onTopic(r.keyword) ? 'core' : 'excluded',
  variant: variantKey(r.keyword),
}));
// Group volume = the biggest member (Keyword Planner gives close variants one shared number).
const groups = {};
for (const r of list.filter((r) => r.status === 'core')) {
  const g = (groups[r.variant] ??= { volume: 0, head: r.keyword, members: 0 });
  g.members += 1;
  // Ties go to the v1 keyword, then to the shorter spelling.
  const better = r.volume > g.volume || (r.volume === g.volume && (Boolean(r.v1_url) > Boolean(rows.get(g.head)?.v1_url)
    || (Boolean(r.v1_url) === Boolean(rows.get(g.head)?.v1_url) && r.keyword.length < g.head.length)));
  if (better) [g.volume, g.head] = [r.volume, r.keyword];
}
for (const r of list) {
  const g = groups[r.variant];
  r.variant_head = r.status === 'core' && g ? g.head : '';
}
list.sort((a, b) => b.volume - a.volume || a.keyword.localeCompare(b.keyword));

const cols = ['keyword', 'volume', 'clickstream', 'kd', 'intent', 'cpc', 'yoy', 'status', 'variant', 'variant_head', 'sources',
  'v1_url', 'v1_wave', 'v1_section', 'v1_cluster', 'competitors', 'competitor_best_pos', 'competitor_url'];
const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
await writeFile(resolve(DIR, 'semantic-core-v2-raw.csv'), [cols.join(','), ...list.map((r) => cols.map((c) => esc(r[c] ?? '')).join(','))].join('\n') + '\n');

const core = list.filter((r) => r.status === 'core');
const g = Object.values(groups).sort((a, b) => b.volume - a.volume);
console.log(`rows ${list.length}: core ${core.length}, excluded ${list.length - core.length}`);
console.log(`variant groups ${g.length}; ≥ 50/mo: ${g.filter((x) => x.volume >= 50).length}; ≥ 100: ${g.filter((x) => x.volume >= 100).length}; ≥ 200: ${g.filter((x) => x.volume >= 200).length}`);
console.log('new core (not v1) by source:', core.filter((r) => !r.v1_url).reduce((a, r) => ((a[r.sources.split(' ')[0]] = (a[r.sources.split(' ')[0]] ?? 0) + 1), a), {}));
console.log('\ntop excluded:', list.filter((r) => r.status === 'excluded').slice(0, 40).map((r) => r.keyword).join(' | '));
console.log('\ntop groups not in v1:', g.filter((x) => !rows.get(x.head).v1_url).slice(0, 50).map((x) => `${x.head} ${x.volume}(${x.members})`).join(' | '));
