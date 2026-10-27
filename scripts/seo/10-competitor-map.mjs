// Step R1 (plan v2) — who actually competes for our keywords. Runs
// competitors/serp over the W1–W2 keyword set, split by theme so each list is
// readable, plus competitors/domain for three reference sites to catch domains
// our keyword set misses.
// Output: docs/seo/research/hangulhero/10-competitors.json, competitors.csv
//
// Usage: node scripts/seo/10-competitor-map.mjs --cap 0.60

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCaller, perDomainPricing, ledgerSpent, SpendCapExceeded } from './yepapi-client.mjs';

const DIR = resolve(new URL('../../docs/seo/research/hangulhero', import.meta.url).pathname);
const capUsd = Number(process.argv[process.argv.indexOf('--cap') + 1]);
if (!capUsd) throw new Error('pass --cap <usd>');

const THEMES = {
  alphabet: ['alphabet'],
  learning: ['reading', 'learn', 'pronunciation', 'writing', 'practice', 'tools'],
  phrases: ['phrases'],
  app: ['app'],
};
const REFERENCE = ['letslearnhangul.com', 'lingrow.io', '90daykorean.com'];
const MAX_KEYWORDS = 200; // competitors/serp limit
const LIMIT = 100;

// Rough domain type, for picking R2 targets; reviewed by hand at the checkpoint.
const GIANTS = /(^|\.)(youtube|wikipedia|reddit|quora|pinterest|facebook|instagram|tiktok|amazon|google|apple|duolingo|merriam-webster|cambridge|collinsdictionary|wiktionary|britannica|etsy|medium|linkedin)\./;
const STORES = /(^|\.)(apps\.apple|play\.google)\./;

const parse = (text) => {
  const [head, ...lines] = text.trim().split('\n');
  const cols = head.split(',');
  return lines.map((line) => {
    const vals = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((v) => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
    return Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
  });
};
const map = parse(await readFile(resolve(DIR, 'url-map.csv'), 'utf8'))
  .filter((r) => r.wave === '1' || r.wave === '2')
  .map((r) => ({ ...r, volume: Number(r.volume) }));

const caller = createCaller({ capUsd, spentUsd: await ledgerSpent(undefined, { notePrefix: 'R1' }) });
const out = { serp: {}, domain: {} };

for (const [theme, sections] of Object.entries(THEMES)) {
  const keywords = map.filter((r) => sections.includes(r.section))
    .sort((a, b) => b.volume - a.volume).slice(0, MAX_KEYWORDS).map((r) => r.keyword);
  try {
    const { data, cached, cost } = await caller.call('/v1/seo/competitors/serp',
      { keywords, location_code: 2840, language: 'en', limit: LIMIT },
      { note: `R1 serp ${theme}`, paramsSummary: `competitors/serp ${theme} ${keywords.length} kw us/en limit ${LIMIT}`, estimateCost: perDomainPricing(LIMIT) });
    out.serp[theme] = { keywords: keywords.length, competitors: data.competitors ?? [] };
    console.log(`${cached ? 'cache' : 'paid '} serp ${theme}: ${keywords.length} kw → ${data.competitors?.length ?? 0} domains ($${cost.toFixed(2)})`);
  } catch (err) {
    if (err instanceof SpendCapExceeded) throw err;
    console.log(`fail  serp ${theme}: ${err.message.slice(0, 160)}`);
  }
}

for (const domain of REFERENCE) {
  try {
    const { data, cached, cost } = await caller.call('/v1/seo/competitors/domain',
      { domain, location_code: 2840, language: 'en', limit: LIMIT },
      { note: `R1 domain ${domain}`, paramsSummary: `competitors/domain ${domain} us/en limit ${LIMIT}`, estimateCost: perDomainPricing(LIMIT) });
    out.domain[domain] = data.competitors ?? [];
    console.log(`${cached ? 'cache' : 'paid '} domain ${domain}: ${data.competitors?.length ?? 0} domains ($${cost.toFixed(2)})`);
  } catch (err) {
    if (err instanceof SpendCapExceeded) throw err;
    console.log(`fail  domain ${domain}: ${err.message.slice(0, 160)}`);
  }
}
await writeFile(resolve(DIR, '10-competitors.json'), JSON.stringify(out, null, 1));

// One row per domain: where it shows up across themes, and overlap with the reference sites.
const rows = {};
const row = (raw) => { const d = raw.replace(/^www\./, ''); return (rows[d] ??= { domain: d, themes: 0, keywords: 0, etv: 0, best_avg_pos: 99, ref_overlap: 0, ref_sites: [] }); };
for (const [theme, { competitors }] of Object.entries(out.serp)) {
  for (const c of competitors) {
    const r = row(c.domain);
    r.themes += 1;
    r[`kw_${theme}`] = c.keywordsCount;
    r.keywords += c.keywordsCount;
    r.etv += c.etv ?? 0;
    r.best_avg_pos = Math.min(r.best_avg_pos, Math.round(c.avgPosition * 10) / 10);
  }
}
for (const [ref, competitors] of Object.entries(out.domain)) {
  for (const c of competitors) {
    if (c.domain.replace(/^www\./, '') === ref) continue;
    const r = row(c.domain);
    r.ref_overlap += c.intersections;
    r.ref_sites.push(ref);
    r.organic_count = c.organicCount;
  }
}
const type = (d) => (STORES.test(d) ? 'store' : GIANTS.test(d) ? 'giant/ugc' : 'niche/content');
const list = Object.values(rows).map((r) => ({ ...r, type: type(r.domain), etv: Math.round(r.etv), ref_sites: r.ref_sites.join(' ') }))
  .sort((a, b) => b.keywords - a.keywords || b.ref_overlap - a.ref_overlap);

const cols = ['domain', 'type', 'keywords', 'kw_alphabet', 'kw_learning', 'kw_phrases', 'kw_app', 'themes', 'best_avg_pos', 'etv', 'ref_overlap', 'ref_sites', 'organic_count'];
const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
await writeFile(resolve(DIR, 'competitors.csv'), [cols.join(','), ...list.map((r) => cols.map((c) => esc(r[c] ?? '')).join(','))].join('\n') + '\n');
console.log(`\n${list.length} domains; spent this step $${caller.spent.toFixed(2)}`);
for (const r of list.filter((r) => r.type === 'niche/content').slice(0, 40)) {
  console.log(r.domain.padEnd(32), String(r.keywords).padStart(4), `a${r.kw_alphabet ?? 0} l${r.kw_learning ?? 0} p${r.kw_phrases ?? 0} app${r.kw_app ?? 0}`.padEnd(22), `pos ${r.best_avg_pos}`.padEnd(9), `ref ${r.ref_overlap}`);
}
