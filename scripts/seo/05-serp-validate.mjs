// Step 5 — SERP check for cluster heads: who holds the Google US top 10
// (big brands vs small sites we can outrank) and which heads share results
// (shared URLs => one page, not two).
// Output: docs/seo/research/05-serp-validation.json
//
// Usage: node scripts/seo/05-serp-validate.mjs --cap 2.00

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCaller, serpPricing, ledgerSpent, SpendCapExceeded } from './yepapi-client.mjs';

const OUT = resolve(new URL('../../docs/seo/research', import.meta.url).pathname);
const capUsd = Number(process.argv[process.argv.indexOf('--cap') + 1]);
if (!capUsd) throw new Error('pass --cap <usd>');

// cluster -> head queries to check (highest-volume or most representative).
const HEADS = {
  'ko/hangul-alphabet': ['korean alphabet', 'hangul alphabet', 'learn hangul'],
  'ko/korean-alphabet-chart': ['korean alphabet chart'],
  'ko/how-to-read-korean': ['how to read korean'],
  'ko/hangul-pronunciation': ['hangul pronunciation'],
  'ko/hangul-writing-practice': ['korean writing practice'],
  'ko/hangul-quiz-games': ['hangul quiz', 'korean language learning games'],
  'ko/korean-learning-apps': ['best apps to learn korean'],
  'ko/learn-korean': ['learn korean'],
  'ko/topik-practice-test': ['topik practice test'],
  'ko/korean-keyboard': ['korean keyboard'],
  'ko/korean-name-converter': ['my name in korean'],
  'et/estonian-language': ['estonian language'],
  'et/learn-estonian': ['learn estonian'],
  'et/estonian-grammar': ['estonian grammar'],
  'et/is-estonian-hard': ['is estonian hard to learn'],
  'dev/edtech-app-development-company': ['education app development company', 'educational app development'],
  'dev/how-to-build-educational-app': ['how to make an educational app'],
  'dev/edtech-app-development-cost': ['education app development cost'],
  'dev/educational-app-ideas': ['educational app ideas'],
  'lang-apps/best-language-learning-app': ['best language learning app'],
  'topic/gamification-in-education': ['gamification in education'],
  'topic/ai-in-education': ['ai in language learning'],
};

const caller = createCaller({ capUsd, spentUsd: await ledgerSpent() });
const results = [];
for (const [cluster, queries] of Object.entries(HEADS)) {
  for (const query of queries) {
    const body = { query, location: 'us', language: 'en', depth: 10 };
    try {
      const { data, cached } = await caller.call('/v1/serp/google', body, {
        note: `validate ${cluster}`, paramsSummary: `serp "${query}" us/en d10`, estimateCost: serpPricing(10),
      });
      const all = data.results ?? [];
      const organic = all.filter((r) => r.type === 'organic')
        .map(({ position, domain, url, title }) => ({ position, domain: domain.replace(/^www\./, ''), url, title }));
      results.push({ cluster, query, itemTypes: data.itemTypes, organic });
      console.log(`${cached ? 'cache' : 'paid '} ${query}`);
    } catch (err) {
      if (err instanceof SpendCapExceeded) throw err;
      console.log(`fail  ${query}: ${err.message.slice(0, 100)}`);
    }
  }
}
await writeFile(resolve(OUT, '05-serp-validation.json'), JSON.stringify(results, null, 1) + '\n');
console.log(`ledger total: $${caller.spent.toFixed(4)}`);
