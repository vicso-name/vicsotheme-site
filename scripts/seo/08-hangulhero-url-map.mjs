// Step 8 — site structure for the Hangul Hero marketing site. Maps every
// keyword in the semantic core to a URL (or to backlog/excluded), then rolls
// keywords up into a page list with a primary keyword and a launch wave.
// Output: docs/seo/research/hangulhero/url-map.csv, pages.csv
//
// Usage: node scripts/seo/08-hangulhero-url-map.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DIR = resolve(new URL('../../docs/seo/research/hangulhero', import.meta.url).pathname);

// cluster -> [url, wave]. Several clusters may share a page.
const PAGES = {
  'app/korean-learning-app': ['/', 1],
  'alphabet/hangul-alphabet': ['/korean-alphabet/', 1],
  'alphabet/korean-alphabet-order-names': ['/korean-alphabet/', 1],
  'alphabet/korean-alphabet-chart': ['/korean-alphabet/chart/', 1],
  'alphabet/consonants-and-vowels': ['/korean-alphabet/chart/', 1],
  'alphabet/korean-vowels': ['/korean-alphabet/vowels/', 1],
  'alphabet/korean-consonants': ['/korean-alphabet/consonants/', 1],
  'alphabet/batchim': ['/korean-alphabet/batchim/', 2],
  'alphabet/syllable-blocks': ['/korean-alphabet/syllable-blocks/', 2],
  'alphabet/hangul-history': ['/korean-alphabet/history/', 3],
  'learn/learn-hangul': ['/learn-hangul/', 1],
  'learn/learn-korean': ['/learn-korean/', 3],
  'reading/how-to-read-korean': ['/how-to-read-korean/', 1],
  'pronunciation/korean-pronunciation': ['/korean-pronunciation/', 2],
  'writing/hangul-writing': ['/hangul-writing-practice/', 2],
  'practice/hangul-quiz-games': ['/hangul-quiz/', 2],
  'tools/romanization': ['/tools/hangul-reader/', 2],
  'tools/korean-keyboard': ['/tools/korean-keyboard/', 'backlog'],
  'tools/korean-name-converter': ['/tools/korean-name/', 'backlog'],
  'tools/korean-dictionary': [null, 'backlog'],
  'phrases/korean-phrases': ['/phrases/', 1],
  'phrases/common-korean-words': ['/korean-words/', 2],
  'phrases/korean-family-words': ['/korean-words/', 2],
  'phrases/korean-slang': ['/phrases/slang/', 2],
  'phrases/kdrama-phrases': ['/phrases/k-drama/', 1],
  'phrases/korean-love-words': ['/phrases/love/', 1],
  'phrases/korean-phrases-travel': ['/phrases/travel/', 2],
  'phrases/korean-food-words': ['/phrases/food/', 2],
  'practice/topik': [null, 'excluded'],
};
// Phrase pack -> hub that hosts its small phrases and links to its phrase pages.
const PACK_HUB = {
  greetings: ['/phrases/basic-korean-phrases/', 1],
  'love-dating': ['/phrases/love/', 1],
  'kdrama-hits': ['/phrases/k-drama/', 1],
  feelings: ['/phrases/feelings/', 2],
  'food-cafe': ['/phrases/food/', 2],
  'getting-around': ['/phrases/travel/', 2],
  'at-work': ['/phrases/work/', 2],
  family: ['/korean-words/', 2],
};
const OWN_PAGE_MIN = 300; // phrase head volume that earns its own page
const WAVE1_PHRASES = 20; // top phrases by volume launch first
// Generic "korean phrases"-style heads that define the basic-phrases hub.
const BASIC_HUB_RE = /^basic korean phrases|korean phrases for beginners|korean phrases to know|korean words greetings/;
const COMPARISON_RE = /\b(best|good|top)\b/;

const parse = (text) => {
  const [head, ...lines] = text.trim().split('\n');
  const cols = head.split(',');
  return lines.map((line) => {
    const vals = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((v) => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
    return Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
  });
};
const core = parse(await readFile(resolve(DIR, 'semantic-core.csv'), 'utf8')).map((r) => ({ ...r, volume: Number(r.volume) }));

// Phrase clusters ranked by head volume decide own page vs hub section, and wave.
const phraseHeads = {};
for (const r of core.filter((r) => r.page_type === 'programmatic')) {
  phraseHeads[r.cluster] = Math.max(phraseHeads[r.cluster] ?? 0, r.volume);
}
const phraseRank = Object.entries(phraseHeads).sort((a, b) => b[1] - a[1]).map(([c]) => c);

const map = core.map((r) => {
  const key = `${r.section}/${r.cluster}`;
  let url = null, wave = 'excluded', pageType = r.page_type;
  if (r.section === 'exclude') {
    // stays excluded
  } else if (r.page_type === 'programmatic') {
    const [hub, hubWave] = PACK_HUB[r.pack];
    if (phraseHeads[r.cluster] >= OWN_PAGE_MIN) {
      url = `/phrases/${r.cluster.replace('phrase/', '')}-in-korean/`;
      wave = phraseRank.indexOf(r.cluster) < WAVE1_PHRASES ? 1 : 2;
    } else {
      [url, wave, pageType] = [hub, hubWave, 'hub'];
    }
  } else if (key === 'phrases/korean-phrases' && BASIC_HUB_RE.test(r.keyword)) {
    [url, wave, pageType] = ['/phrases/basic-korean-phrases/', 1, 'hub'];
  } else if (key === 'app/korean-learning-app' && COMPARISON_RE.test(r.keyword)) {
    [url, wave, pageType] = ['/best-apps-to-learn-korean/', 1, 'comparison'];
  } else if (PAGES[key]) {
    [url, wave] = PAGES[key];
  } else {
    throw new Error(`no page for cluster ${key} (${r.keyword})`);
  }
  return { ...r, url: url ?? '', wave, page_type: pageType };
});

const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const toCsv = (rows, cols) => [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c] ?? '')).join(','))].join('\n') + '\n';
map.sort((a, b) => String(a.wave).localeCompare(String(b.wave)) || a.url.localeCompare(b.url) || b.volume - a.volume);
await writeFile(resolve(DIR, 'url-map.csv'), toCsv(map, ['keyword', 'volume', 'kd', 'intent', 'url', 'wave', 'page_type', 'section', 'cluster', 'pack', 'app_feature']));

const pages = {};
for (const r of map.filter((r) => r.url)) {
  const p = (pages[r.url] ??= { url: r.url, wave: r.wave, page_type: r.page_type, section: r.section, app_feature: r.app_feature, rows: [] });
  p.rows.push(r);
  // Pack hubs collect several clusters; the earliest wave wins.
  if (typeof r.wave === 'number' && (typeof p.wave !== 'number' || r.wave < p.wave)) p.wave = r.wave;
}
const pageRows = Object.values(pages).map((p) => {
  const rows = p.rows.sort((a, b) => b.volume - a.volume);
  return {
    url: p.url, wave: p.wave, page_type: p.page_type, section: p.section, app_feature: p.app_feature,
    primary_keyword: rows[0].keyword, primary_volume: rows[0].volume, keywords: rows.length,
    secondary_keywords: [...new Set(rows.slice(1).map((r) => r.keyword))].slice(0, 10).join('; '),
  };
}).sort((a, b) => String(a.wave).localeCompare(String(b.wave)) || b.primary_volume - a.primary_volume);
await writeFile(resolve(DIR, 'pages.csv'), toCsv(pageRows, ['url', 'wave', 'page_type', 'section', 'app_feature', 'primary_keyword', 'primary_volume', 'keywords', 'secondary_keywords']));

const by = (k) => map.reduce((acc, r) => ((acc[r[k]] = (acc[r[k]] ?? 0) + 1), acc), {});
console.log('keywords by wave:', by('wave'));
const pw = pageRows.reduce((acc, p) => ((acc[p.wave] = (acc[p.wave] ?? 0) + 1), acc), {});
console.log('pages by wave:', pw);
for (const p of pageRows) console.log(`W${p.wave}`.padEnd(9), p.page_type.padEnd(12), p.url.padEnd(44), p.primary_volume, p.primary_keyword, `(${p.keywords})`);
