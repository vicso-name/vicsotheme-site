// Step R6 (plan v2) — markets. (1) The top core keywords measured in other
// English-speaking countries: US-only content, or global English? (2) Size of
// the biggest non-English markets via keyword ideas on a native seed — the
// order of future localisation.
// Output: docs/seo/research/hangulhero/16-markets.json
//
// Usage: node scripts/seo/16-markets.mjs --cap 0.90

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCaller, perKeywordPricing, ledgerSpent, balanceUsd, SpendCapExceeded } from './yepapi-client.mjs';

const DIR = resolve(new URL('../../docs/seo/research/hangulhero', import.meta.url).pathname);
const stepCap = Number(process.argv[process.argv.indexOf('--cap') + 1]);
if (!stepCap) throw new Error('pass --cap <usd>');
const TOP = 200;
const COUNTRIES = ['gb', 'ca', 'au', 'ph', 'in', 'sg', 'id'];
// [market, location_code, language, native seed]
const LANGUAGES = [
  ['es (Mexico)', 2484, 'es', 'alfabeto coreano'],
  ['pt (Brazil)', 2076, 'pt', 'alfabeto coreano'],
  ['id (Indonesia)', 2360, 'id', 'huruf korea'],
  ['fr (France)', 2250, 'fr', 'alphabet coréen'],
];
const IDEAS_LIMIT = 50;

const parse = (text) => {
  const [head, ...lines] = text.trim().split('\n');
  const cols = head.split(',');
  return lines.map((line) => {
    const vals = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((v) => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
    return Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
  });
};
// One keyword per variant group (close variants share a volume), biggest first.
const core = parse(await readFile(resolve(DIR, 'semantic-core-v2-raw.csv'), 'utf8')).filter((r) => r.status === 'core' && r.keyword === r.variant_head);
const top = core.map((r) => ({ keyword: r.keyword, us: Number(r.volume) })).sort((a, b) => b.us - a.us).slice(0, TOP);

const balance = await balanceUsd();
const capUsd = Math.min(stepCap, balance);
console.log(`balance $${balance.toFixed(2)}, step cap $${capUsd.toFixed(2)}`);
const caller = createCaller({ capUsd, spentUsd: await ledgerSpent(undefined, { notePrefix: 'R6' }) });

const out = { top: top.map((t) => t.keyword), countries: {}, languages: {} };
for (const country of COUNTRIES) {
  try {
    const { data, cached, cost } = await caller.call('/v1/seo/keywords/overview', { keywords: out.top, location: country, language: 'en' },
      { note: `R6 overview ${country}`, paramsSummary: `overview ${out.top.length} kw ${country}/en`, estimateCost: perKeywordPricing(out.top.length) });
    out.countries[country] = Object.fromEntries((data.keywords ?? []).map((k) => [k.keyword, k.volume]));
    console.log(`${cached ? 'cache' : 'paid '} ${country}: ${data.keywords?.length ?? 0} with data ($${cost.toFixed(2)})`);
  } catch (err) {
    if (err instanceof SpendCapExceeded) throw err;
    console.log(`fail  ${country}: ${err.message.slice(0, 160)}`);
  }
}
for (const [market, location_code, language, seed] of LANGUAGES) {
  try {
    const { data, cached, cost } = await caller.call('/v1/seo/keywords/ideas',
      { keyword: seed, limit: IDEAS_LIMIT, location_code, language, filters: [{ field: 'volume', op: '>=', value: 10 }], sort: ['volume:desc'] },
      { note: `R6 ideas ${market}`, paramsSummary: `ideas "${seed}" ${location_code}/${language} limit ${IDEAS_LIMIT}`, estimateCost: perKeywordPricing(IDEAS_LIMIT) });
    out.languages[market] = (data.keywords ?? []).map((k) => ({ keyword: k.keyword, volume: k.volume, kd: k.difficulty }));
    console.log(`${cached ? 'cache' : 'paid '} ${market}: ${data.keywords?.length ?? 0} ideas ($${cost.toFixed(2)})`);
  } catch (err) {
    if (err instanceof SpendCapExceeded) throw err;
    console.log(`fail  ${market}: ${err.message.slice(0, 160)}`);
  }
}
await writeFile(resolve(DIR, '16-markets.json'), JSON.stringify(out, null, 1));

const usTotal = top.reduce((s, t) => s + t.us, 0);
console.log(`\nEnglish markets, top ${TOP} keywords (US = ${usTotal}):`);
for (const [c, vols] of Object.entries(out.countries)) {
  const total = Object.values(vols).reduce((s, v) => s + (v ?? 0), 0);
  console.log(c.padEnd(4), String(total).padStart(8), `${Math.round((total / usTotal) * 100)}% of US`);
}
console.log('\nNon-English markets (ideas on a native seed):');
for (const [m, list] of Object.entries(out.languages)) {
  console.log(m.padEnd(16), String(list.reduce((s, k) => s + k.volume, 0)).padStart(8), list.slice(0, 6).map((k) => `${k.keyword} ${k.volume}`).join(' · '));
}
console.log(`spent this step $${caller.spent.toFixed(2)}`);
