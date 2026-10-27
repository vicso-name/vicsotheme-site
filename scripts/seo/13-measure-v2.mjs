// Step R4 (plan v2) — measure everything that has no data yet. Order is by
// value, so a cap hit drops only the tail:
//   1. clickstream for the top 100 W1 keywords (real searches vs ad estimate —
//      the answer to "does the Translate box eat phrase clicks?")
//   2. R3 candidates without data (jamo names, iOS intent, autocomplete)
//   3. v1 autocomplete backlog (backlog-unmeasured.txt)
//   4. gap keywords (volume known from R2) — for difficulty, intent and trend
// Overview returns, and bills, only keywords that have data.
// Output: docs/seo/research/hangulhero/13-measured.json
//
// Usage: node scripts/seo/13-measure-v2.mjs --cap 1.50

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCaller, perKeywordPricing, ledgerSpent, balanceUsd, SpendCapExceeded } from './yepapi-client.mjs';

const DIR = resolve(new URL('../../docs/seo/research/hangulhero', import.meta.url).pathname);
const stepCap = Number(process.argv[process.argv.indexOf('--cap') + 1]);
if (!stepCap) throw new Error('pass --cap <usd>');
const BATCH = 700; // overview max
const CLICKSTREAM_HEADS = 100;
const GAP_MIN_VOLUME = 100;

// Same topic filter as R3.
const KOREAN = /korean|korea|hangul|hangeul|kpop|k-pop|kdrama|k-drama|batchim|jamo|oppa|unnie|noona|hyung|sunbae|maknae|aegyo|saranghae|hwaiting|fighting|chingu|daebak|aigoo|jinjja|[ㄱ-ㆎ가-힣]/;
const OFF = /duolingo|talk to me in korean|ttmik|lingodeer|rosetta|babbel|memrise|anki|busuu|koreanclass101|90 ?day ?korean|howtostudykorean|pimsleur|drops|\bjapanese|chinese|spanish|french|hindi|tagalog|vietnamese|thai|indonesian|arabic|sign language|translator|translate|google|chatgpt|reddit|pdf free download/;
const JUNK = /unicode|filler|invisible|jewelry|quilt|stickers|necklace|tattoo|shirt|kashmir|stag|deer|wiki|font download|korean air|korea(n)? (war|news|time|weather forecast|stock)|north korea|kim jong|samsung|hyundai|kia\b/;
const norm = (k) => k.toLowerCase().replace(/\s+/g, ' ').trim();

const parse = (text) => {
  const [head, ...lines] = text.trim().split('\n');
  const cols = head.split(',');
  return lines.map((line) => {
    const vals = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((v) => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
    return Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
  });
};
const urlMap = parse(await readFile(resolve(DIR, 'url-map.csv'), 'utf8'));
const gap = parse(await readFile(resolve(DIR, 'gap.csv'), 'utf8'));
const expansion = JSON.parse(await readFile(resolve(DIR, '12-expansion.json'), 'utf8'));
const backlog = (await readFile(resolve(DIR, 'backlog-unmeasured.txt'), 'utf8')).trim().split('\n').map(norm);

const heads = urlMap.filter((r) => r.wave === '1').sort((a, b) => b.volume - a.volume).slice(0, CLICKSTREAM_HEADS).map((r) => r.keyword);
const seen = new Set([...urlMap.map((r) => norm(r.keyword)), ...expansion.measured.map((k) => k.keyword)]);
const queue = (list) => {
  const out = [];
  for (const k of list.map(norm)) if (!seen.has(k)) { seen.add(k); out.push(k); }
  return out;
};
const candidates = queue(expansion.unmeasured.map((c) => c.keyword));
const backlogQ = queue(backlog);
const gapQ = queue(gap.filter((g) => Number(g.volume) >= GAP_MIN_VOLUME && KOREAN.test(g.keyword) && !OFF.test(g.keyword) && !JUNK.test(g.keyword))
  .sort((a, b) => b.volume - a.volume).map((g) => g.keyword));
console.log(`queue: clickstream ${heads.length}, R3 candidates ${candidates.length}, backlog ${backlogQ.length}, gap ${gapQ.length}`);

const balance = await balanceUsd();
const capUsd = Math.min(stepCap, balance);
console.log(`balance $${balance.toFixed(2)}, step cap $${capUsd.toFixed(2)}`);
const caller = createCaller({ capUsd, spentUsd: await ledgerSpent(undefined, { notePrefix: 'R4' }) });

const chunk = (a) => Array.from({ length: Math.ceil(a.length / BATCH) }, (_, i) => a.slice(i * BATCH, (i + 1) * BATCH));
const jobs = [
  { group: 'clickstream', batch: heads, clickstream: true },
  ...chunk(candidates).map((batch) => ({ group: 'r3-candidates', batch })),
  ...chunk(backlogQ).map((batch) => ({ group: 'backlog', batch })),
  ...chunk(gapQ).map((batch) => ({ group: 'gap', batch })),
];
const out = {};
let stopped = null;
for (const [i, { group, batch, clickstream }] of jobs.entries()) {
  const body = { keywords: batch, location: 'us', language: 'en', ...(clickstream && { include_clickstream: true }) };
  const pricing = perKeywordPricing(batch.length);
  const estimateCost = clickstream ? { worstCase: pricing.worstCase * 2, price: (d) => pricing.price(d) * 2 } : pricing;
  try {
    const { data, cached, cost } = await caller.call('/v1/seo/keywords/overview', body, {
      note: `R4 overview ${group}`, paramsSummary: `overview ${batch.length} kw us/en${clickstream ? ' +clickstream' : ''} #${i}`, estimateCost,
    });
    (out[group] ??= []).push(...(data.keywords ?? []));
    console.log(`${cached ? 'cache' : 'paid '} ${group}: ${data.keywords?.length ?? 0} of ${batch.length} have data ($${cost.toFixed(2)})`);
  } catch (err) {
    if (err instanceof SpendCapExceeded) { stopped = err.message; break; }
    console.log(`fail  ${group}: ${err.message.slice(0, 160)}`);
  }
}
await writeFile(resolve(DIR, '13-measured.json'), JSON.stringify(out, null, 1));

console.log(`\nspent this step $${caller.spent.toFixed(2)}`);
if (stopped) console.log(`STOPPED: ${stopped}`);
if (out.clickstream) {
  console.log('\nclickstream / volume (W1 heads):');
  for (const k of out.clickstream.sort((a, b) => b.volume - a.volume).slice(0, 40)) {
    const ratio = k.clickstreamVolume != null ? Math.round((k.clickstreamVolume / (k.volume || 1)) * 100) : '-';
    console.log(String(k.volume).padStart(7), String(k.clickstreamVolume ?? '-').padStart(7), `${ratio}%`.padStart(5), k.keyword);
  }
}
for (const g of ['r3-candidates', 'backlog', 'gap']) {
  const top = (out[g] ?? []).filter((k) => k.volume >= 10).sort((a, b) => b.volume - a.volume);
  console.log(`\n${g}: ${top.length} with volume ≥ 10; top:`, top.slice(0, 12).map((k) => `${k.keyword} ${k.volume}`).join(' · '));
}
