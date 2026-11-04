// Step 3 — expand where competitors gave no data (Estonian, the build/dev side),
// pool every candidate (competitor keywords, ideas, related searches, PAA),
// drop off-topic rows, and measure the pool in one overview call. Overview only
// returns keywords that have data, so zero-demand queries fall out here.
// Output: docs/seo/research/03-candidates.json
//
// Usage: node scripts/seo/03-expand-and-measure.mjs --cap 2.00

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCaller, perKeywordPricing, ledgerSpent, SpendCapExceeded } from './yepapi-client.mjs';

const OUT = resolve(new URL('../../docs/seo/research', import.meta.url).pathname);
const capUsd = Number(process.argv[process.argv.indexOf('--cap') + 1]);
if (!capUsd) throw new Error('pass --cap <usd>');

const SEEDS = {
  estonian: ['learn estonian', 'estonian verbs', 'estonian grammar', 'estonian language'],
  build: ['language learning app development', 'educational app development', 'how to make a language learning app'],
  product: ['language learning app'],
};

// Off-topic for an indie EdTech developer: generic ML/data content agencies rank
// with, Spanish-language pages, and third-party app brand reviews.
const OFF_TOPIC = [
  /machine learning|\bml\b|neural|python|programming language|nlp|natural language|big data|internet of things|\biot\b|inventory|cloud computing/,
  /\b(letra|letras|alfabeto|abecedario|hebreo|hebrea|español|significado)\b/,
  /jumpspeak|pingo|lingotok|sponge|\bhangl\b|chinese/,
];
const norm = (k) => k.toLowerCase().replace(/\s+/g, ' ').trim();
const onTopic = (k) => !OFF_TOPIC.some((re) => re.test(k));

const caller = createCaller({ capUsd, spentUsd: await ledgerSpent() });

const ideas = [];
for (const [group, seeds] of Object.entries(SEEDS)) {
  for (const seed of seeds) {
    const body = {
      keyword: seed, limit: 50, location_code: 2840, language: 'en',
      filters: [{ field: 'volume', op: '>=', value: 10 }], sort: ['volume:desc'],
    };
    try {
      const { data, cached, cost } = await caller.call('/v1/seo/keywords/ideas', body, {
        note: `ideas ${group}`, paramsSummary: `ideas "${seed}" us/en limit 50`, estimateCost: perKeywordPricing(50),
      });
      for (const k of data.keywords ?? []) ideas.push({ group, seed, keyword: norm(k.keyword) });
      console.log(`${cached ? 'cache' : 'paid '} ideas "${seed}": ${data.keywords?.length ?? 0} ($${cost.toFixed(2)})`);
    } catch (err) {
      if (err instanceof SpendCapExceeded) throw err;
      console.log(`fail  ideas "${seed}": ${err.message.slice(0, 120)}`);
    }
  }
}

// Pool: keyword -> where it came from (competitor URL, seed, or SERP feature).
const pool = new Map();
const add = (keyword, source) => {
  const k = norm(keyword);
  if (!k || !onTopic(k) || k.split(' ').length > 10) return;
  if (!pool.has(k)) pool.set(k, new Set());
  pool.get(k).add(source);
};
const competitors = JSON.parse(await readFile(resolve(OUT, '02-competitor-keywords.json'), 'utf8'));
for (const { domain, keywords } of competitors) {
  for (const k of keywords) add(k.keyword, `${domain}${new URL(k.url).pathname}#${k.position}`);
}
for (const { group, seed, keyword } of ideas) add(keyword, `ideas:${group}:${seed}`);
const discovery = JSON.parse(await readFile(resolve(OUT, '01-serp-discovery.json'), 'utf8'));
for (const { query, related, paa } of discovery) {
  add(query, 'discovery');
  for (const r of related) add(r, `related:${query}`);
  for (const q of paa) add(q, `paa:${query}`);
}
console.log(`pool: ${pool.size} on-topic candidates`);

// Overview takes at most 700 keywords per call. The overflow (mostly related
// searches and PAA) gets a stricter filter — job listings and trivia questions
// surfaced there; the first batch is left as sent so it stays a cache hit.
const OVERFLOW_OFF_TOPIC = /\bjobs?\b|salary|\bceo\b|india|gta|nasa|c\+\+|coding|kahoot|lithuanian|founder|indie hackers|15\/30\/15|14 year old/;
const all = [...pool.keys()];
const batches = [all.slice(0, 700), all.slice(700).filter((k) => !OVERFLOW_OFF_TOPIC.test(k))];
const rows = [];
for (const keywords of batches) {
  const { data, cost } = await caller.call('/v1/seo/keywords/overview', { keywords, location: 'us', language: 'en' }, {
    note: 'overview pool', paramsSummary: `overview ${keywords.length} kw us/en`, estimateCost: perKeywordPricing(keywords.length),
  });
  rows.push(...(data.keywords ?? []));
  console.log(`overview: ${data.keywords?.length ?? 0} of ${keywords.length} have data ($${cost.toFixed(2)})`);
}

const measured = rows.map((k) => ({ ...k, sources: [...(pool.get(norm(k.keyword)) ?? [])] }));
await writeFile(resolve(OUT, '03-candidates.json'), JSON.stringify({ ideas, measured }, null, 1) + '\n');
console.log(`ledger total: $${caller.spent.toFixed(4)}`);
