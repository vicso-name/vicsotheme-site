// Step 2 — keywords competitors actually rank for (Google US). Indie analogs
// are pulled whole; agencies only through their EdTech / language-learning
// URLs, since the rest of their sites is unrelated.
// Output: docs/seo/research/02-competitor-keywords.json
//
// Usage: node scripts/seo/02-competitor-keywords.mjs --cap 2.00

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCaller, perKeywordPricing, ledgerSpent, SpendCapExceeded } from './yepapi-client.mjs';

const OUT = resolve(new URL('../../docs/seo/research', import.meta.url).pathname);
const capUsd = Number(process.argv[process.argv.indexOf('--cap') + 1]);
if (!capUsd) throw new Error('pass --cap <usd>');

const INDIE = [
  'latvianapps.com', 'hangl.app', 'letslearnhangul.com', 'learnhebrewalphabet.com',
  'lingrow.io', 'thesponge.app', 'memokat.com',
];
const AGENCIES = {
  'mindinventory.com': ['%education%', '%edtech%', '%e-learning%'],
  'citrusbug.com': ['%education%', '%edtech%', '%learning%'],
  'geniusee.com': ['%edtech%', '%language%', '%education%'],
  'riseapps.co': ['%language%', '%education%', '%edtech%'],
  'sapient.pro': ['%language%', '%edtech%', '%education%'],
  'binariks.com': ['%education%', '%edtech%', '%learning%'],
};

const jobs = [
  ...INDIE.map((domain) => ({
    kind: 'indie', domain, limit: 150,
    body: {
      domain, limit: 150, location_code: 2840, language: 'en',
      filters: [{ field: 'volume', op: '>=', value: 10 }, { field: 'position', op: '<=', value: 30 }],
      match: 'all', sort: ['volume:desc'],
    },
  })),
  ...Object.entries(AGENCIES).map(([domain, paths]) => ({
    kind: 'agency', domain, limit: 100,
    body: {
      domain, limit: 100, location_code: 2840, language: 'en',
      filters: paths.map((value) => ({ field: 'url', op: 'like', value })),
      match: 'any', sort: ['volume:desc'],
    },
  })),
];

const caller = createCaller({ capUsd, spentUsd: await ledgerSpent() });
const results = [];
for (const { kind, domain, limit, body } of jobs) {
  try {
    const { data, cached, cost } = await caller.call('/v1/seo/domain/keywords', body, {
      note: `competitor ${kind}`, paramsSummary: `domain/keywords ${domain} us/en limit ${limit}`,
      estimateCost: perKeywordPricing(limit),
    });
    results.push({ kind, domain, total: data.total, keywords: data.keywords ?? [] });
    console.log(`${cached ? 'cache' : 'paid '} ${domain}: ${data.keywords?.length ?? 0} of ${data.total} ($${cost.toFixed(2)})`);
  } catch (err) {
    if (err instanceof SpendCapExceeded) throw err;
    console.log(`fail  ${domain}: ${err.message.slice(0, 120)}`);
  }
}
await writeFile(resolve(OUT, '02-competitor-keywords.json'), JSON.stringify(results, null, 1) + '\n');
console.log(`ledger total: $${caller.spent.toFixed(4)}`);
