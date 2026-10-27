// Step R7 (plan v2) — which sources Google AI Mode cites for our head
// keywords: who we compete with for AI answers, not just blue links.
// Output: docs/seo/research/hangulhero/17-ai-mode.json
//
// Usage: node scripts/seo/17-ai-mode.mjs --cap 0.30

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCaller, ledgerSpent, SpendCapExceeded } from './yepapi-client.mjs';

const DIR = resolve(new URL('../../docs/seo/research/hangulhero', import.meta.url).pathname);
const capUsd = Number(process.argv[process.argv.indexOf('--cap') + 1]);
if (!capUsd) throw new Error('pass --cap <usd>');

const QUERIES = [
  'korean alphabet', 'hangul', 'korean alphabet chart', 'korean vowels', 'korean consonants',
  'learn hangul', 'how to read korean', 'how to learn korean alphabet fast', 'korean pronunciation', 'batchim',
  'best app to learn korean', 'learn korean app', 'korean phrases', 'basic korean phrases', 'korean slang',
  'hello in korean', 'thank you in korean', 'i love you in korean', 'goodbye in korean', 'oppa meaning',
];
const flat = { worstCase: 0.01, price: () => 0.01 };

const caller = createCaller({ capUsd, spentUsd: await ledgerSpent(undefined, { notePrefix: 'R7' }) });
const out = {};
for (const query of QUERIES) {
  try {
    const { data, cached } = await caller.call('/v1/serp/google-ai-mode', { query, depth: 20, location_code: 2840, language: 'en' },
      { note: `R7 ai-mode ${query}`, paramsSummary: `ai-mode "${query}" us/en`, estimateCost: flat });
    out[query] = data.results ?? [];
    const cited = out[query].filter((r) => r.domain).map((r) => r.domain.replace(/^www\./, ''));
    console.log(`${cached ? 'cache' : 'paid '} ${query.padEnd(36)} ${cited.slice(0, 8).join(', ')}`);
  } catch (err) {
    if (err instanceof SpendCapExceeded) throw err;
    console.log(`fail  ${query}: ${err.message.slice(0, 160)}`);
  }
}
await writeFile(resolve(DIR, '17-ai-mode.json'), JSON.stringify(out, null, 1));

const counts = {};
for (const results of Object.values(out)) {
  for (const d of new Set(results.filter((r) => r.domain).map((r) => r.domain.replace(/^www\./, '')))) counts[d] = (counts[d] ?? 0) + 1;
}
console.log('\ncited in N of', Object.keys(out).length, 'queries:');
for (const [d, n] of Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(String(n).padStart(3), d);
console.log(`spent this step $${caller.spent.toFixed(2)}`);
