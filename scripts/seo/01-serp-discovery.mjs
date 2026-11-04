// Step 1 — competitor discovery. Pulls the Google US top 10 for queries an
// indie EdTech product developer would want to show up for, then counts which
// domains recur across them. Output: docs/seo/research/01-serp-discovery.json
//
// Usage: node scripts/seo/01-serp-discovery.mjs --cap 2.00

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCaller, serpPricing, ledgerSpent, SpendCapExceeded } from './yepapi-client.mjs';

const OUT = resolve(new URL('../../docs/seo/research', import.meta.url).pathname);
const capUsd = Number(process.argv[process.argv.indexOf('--cap') + 1]);
if (!capUsd) throw new Error('pass --cap <usd>');

// Grouped by the side of the positioning they probe.
const QUERIES = {
  build: [
    'how to build a language learning app',
    'build an app like duolingo',
    'language learning app development',
    'spaced repetition app development',
    'flutter language learning app',
    'gamification in language learning apps',
  ],
  hire: [
    'edtech app developer',
    'edtech app development company',
    'educational app development',
    'edtech mvp development',
    'hire edtech developer',
    'freelance edtech developer',
  ],
  indie: [
    'indie language learning app',
    'indie edtech founder',
    'solo developer language app',
  ],
  products: [
    'learn hebrew alphabet app',
    'learn hangul app',
    'estonian verbs app',
    'learn estonian app',
    'korean alphabet learning app',
  ],
};

const caller = createCaller({ capUsd, spentUsd: await ledgerSpent() });
const results = [];
for (const [group, queries] of Object.entries(QUERIES)) {
  for (const query of queries) {
    const body = { query, location: 'us', language: 'en', depth: 10 };
    let data, cached;
    try {
      ({ data, cached } = await caller.call('/v1/serp/google', body, {
        note: `discovery ${group}`, paramsSummary: `serp "${query}" us/en d10`, estimateCost: serpPricing(10),
      }));
    } catch (err) {
      if (err instanceof SpendCapExceeded) throw err;
      console.log(`fail  ${query}: ${err.message.slice(0, 80)}`);
      continue;
    }
    const all = data.results ?? [];
    const organic = all.filter((r) => r.type === 'organic')
      .map(({ position, domain, url, title }) => ({ position, domain: domain.replace(/^www\./, ''), url, title }));
    // Related searches and People Also Ask are free real queries for the core.
    const related = all.filter((r) => r.type === 'relatedSearches').flatMap((r) => r.data?.items ?? []).map((i) => i.title ?? i);
    const paa = all.filter((r) => r.type === 'peopleAlsoAsk').flatMap((r) => r.data?.items ?? []).map((i) => i.title);
    results.push({ group, query, itemTypes: data.itemTypes, organic, related, paa });
    console.log(`${cached ? 'cache' : 'paid '} ${query}`);
  }
}
await writeFile(resolve(OUT, '01-serp-discovery.json'), JSON.stringify(results, null, 1) + '\n');
console.log(`spent this run: $${caller.spent.toFixed(4)} (cumulative ledger)`);
