// Step R2 (plan v2) — full keyword sets of the competitors picked from R1,
// plus the pages that bring the strongest of them their traffic. Korean-only
// sites are pulled whole; multi-language sites only through Korean URLs.
// Output: docs/seo/research/hangulhero/11-competitor-keywords.json, gap.csv
//
// Usage: node scripts/seo/11-competitor-keywords.mjs --cap 4.00

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCaller, perKeywordPricing, ledgerSpent, balanceUsd, SpendCapExceeded } from './yepapi-client.mjs';

const DIR = resolve(new URL('../../docs/seo/research/hangulhero', import.meta.url).pathname);
const stepCap = Number(process.argv[process.argv.indexOf('--cap') + 1]);
if (!stepCap) throw new Error('pass --cap <usd>');

// Small sites first, so a cap hit costs us the big ones, not the niche ones.
const WHOLE = [
  'hangul.fun', 'zkorean.com', 'learning-korean.com', 'mykoreanlesson.com', 'letslearnhangul.com',
  'learnkorean24.com', 'howtostudykorean.com', '90daykorean.com', 'koreanclass101.com',
];
const MULTI = ['languagebird.com', 'flexiclasses.com', 'ling-app.com', 'talkpal.ai', 'blog.lingodeer.com', 'migaku.com'];
const KOREAN_URL = ['%korean%', '%hangul%', '%korea%'];
const PAGES = ['letslearnhangul.com', 'zkorean.com', 'howtostudykorean.com', '90daykorean.com', 'koreanclass101.com'];
const LIMIT = 1000;
const PAGES_LIMIT = 200;

const base = { location_code: 2840, language: 'en', limit: LIMIT, sort: ['volume:desc'] };
const rank = [{ field: 'volume', op: '>=', value: 10 }, { field: 'position', op: '<=', value: 30 }];
const jobs = [
  ...WHOLE.map((domain) => ({ domain, mode: 'whole', body: { ...base, domain, filters: rank, match: 'all' } })),
  // Filters combine with one `match`, so URL masks run one call each would cost
  // more; instead pull Korean URLs (match any) and apply the rank filter locally.
  ...MULTI.map((domain) => ({
    domain, mode: 'korean-urls',
    body: { ...base, domain, filters: KOREAN_URL.map((value) => ({ field: 'url', op: 'like', value })), match: 'any' },
  })),
];

// Never plan past what the account holds.
const balance = await balanceUsd();
const capUsd = Math.min(stepCap, balance);
console.log(`balance $${balance.toFixed(2)}, step cap $${capUsd.toFixed(2)}`);
const caller = createCaller({ capUsd, spentUsd: await ledgerSpent(undefined, { notePrefix: 'R2' }) });

const out = { keywords: {}, pages: {} };
let stopped = null;
for (const { domain, mode, body } of jobs) {
  try {
    const { data, cached, cost } = await caller.call('/v1/seo/domain/keywords', body, {
      note: `R2 keywords ${domain}`, paramsSummary: `domain/keywords ${domain} ${mode} us/en limit ${LIMIT}`,
      estimateCost: perKeywordPricing(LIMIT),
    });
    const keywords = (data.keywords ?? []).filter((k) => k.volume >= 10 && k.position <= 30);
    out.keywords[domain] = { mode, total: data.total, returned: data.keywords?.length ?? 0, keywords };
    console.log(`${cached ? 'cache' : 'paid '} ${domain} (${mode}): ${keywords.length} kept of ${data.total} ($${cost.toFixed(2)})`);
  } catch (err) {
    if (err instanceof SpendCapExceeded) { stopped = err.message; break; }
    console.log(`fail  ${domain}: ${err.message.slice(0, 160)}`);
  }
}
const pagesPricing = {
  worstCase: Math.ceil((0.03 + 0.03 * (PAGES_LIMIT / 100)) * 100) / 100,
  price: (data) => Math.ceil((0.03 + 0.03 * ((data.pages?.length ?? 0) / 100)) * 100) / 100,
};
for (const domain of stopped ? [] : PAGES) {
  try {
    const { data, cached, cost } = await caller.call('/v1/seo/domain/pages',
      { domain, limit: PAGES_LIMIT, location_code: 2840, language: 'en' },
      { note: `R2 pages ${domain}`, paramsSummary: `domain/pages ${domain} us/en limit ${PAGES_LIMIT}`, estimateCost: pagesPricing });
    out.pages[domain] = { total: data.total, pages: data.pages ?? [] };
    console.log(`${cached ? 'cache' : 'paid '} pages ${domain}: ${data.pages?.length ?? 0} of ${data.total} ($${cost.toFixed(2)})`);
  } catch (err) {
    if (err instanceof SpendCapExceeded) { stopped = err.message; break; }
    console.log(`fail  pages ${domain}: ${err.message.slice(0, 160)}`);
  }
}
await writeFile(resolve(DIR, '11-competitor-keywords.json'), JSON.stringify(out, null, 1));

// Gap: competitor keywords that are not in our v1 core, with who ranks and where.
const core = new Set((await readFile(resolve(DIR, 'semantic-core.csv'), 'utf8')).trim().split('\n').slice(1)
  .map((l) => l.match(/^("([^"]|"")*"|[^,]*)/)[0].replace(/^"|"$/g, '').toLowerCase()));
const gap = {};
for (const [domain, { keywords }] of Object.entries(out.keywords)) {
  for (const k of keywords) {
    const kw = k.keyword.toLowerCase();
    if (core.has(kw)) continue;
    const g = (gap[kw] ??= { keyword: kw, volume: k.volume, domains: 0, best_position: 99, best_url: '', ranked_by: [] });
    g.domains += 1;
    g.ranked_by.push(domain);
    if (k.position < g.best_position) [g.best_position, g.best_url] = [k.position, k.url];
  }
}
const rows = Object.values(gap).map((g) => ({ ...g, ranked_by: g.ranked_by.join(' ') }))
  .sort((a, b) => b.domains - a.domains || b.volume - a.volume);
const cols = ['keyword', 'volume', 'domains', 'best_position', 'best_url', 'ranked_by'];
const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
await writeFile(resolve(DIR, 'gap.csv'), [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n');

console.log(`\ngap: ${rows.length} keywords not in v1 core (${rows.filter((r) => r.domains >= 2).length} ranked by 2+ competitors)`);
console.log(`spent this step $${caller.spent.toFixed(2)}`);
if (stopped) console.log(`STOPPED: ${stopped}`);
