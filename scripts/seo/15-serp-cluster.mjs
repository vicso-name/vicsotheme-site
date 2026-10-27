// Step R5 (plan v2) — SERP clustering. Top-10 Google US for the head of every
// variant group (by volume), then hard clustering: a group joins the first
// (bigger) cluster that shares ≥ 2 organic URLs with it (after merging lexical
// synonyms), else it starts its own. From the same SERPs, for free: PAA questions (FAQ blocks), SERP
// features, AI Overview cited domains (stands in for R7), and how many top-10
// slots are held by forums/UGC or small sites ("weak slots").
// Output: docs/seo/research/hangulhero/15-serp.json, clusters-v2.json,
//         semantic-core-v2.csv (raw core + cluster)
//
// Usage: node scripts/seo/15-serp-cluster.mjs --cap 5.45 [--groups 550] [--cluster-only] [--min-shared 2]

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCaller, serpPricing, ledgerSpent, balanceUsd, SpendCapExceeded } from './yepapi-client.mjs';

const DIR = resolve(new URL('../../docs/seo/research/hangulhero', import.meta.url).pathname);
const arg = (name, dflt) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : dflt);
const stepCap = Number(arg('--cap', 0));
const GROUPS = Number(arg('--groups', 550));
const CLUSTER_ONLY = process.argv.includes('--cluster-only');
if (!stepCap && !CLUSTER_ONLY) throw new Error('pass --cap <usd>');
const MIN_SHARED = Number(arg('--min-shared', 2));
const CONCURRENCY = 4; // cap check runs per call, so overshoot is at most CONCURRENCY − 1 cents

const UGC = /(^|\.)(reddit|quora|youtube|tiktok|facebook|instagram|pinterest|hinative|medium|tumblr|x|twitter|stackexchange|wattpad|amino(apps)?|fandom)\.com$|(^|\.)(italki|tandem)\.(com|net)$/;
const DICT = /(^|\.)(wordhippo|collinsdictionary|cambridge|merriam-webster|wiktionary|dictionary|translate|glosbe|reverso|bab)\.(com|org|net|la)$/;

const parse = (text) => {
  const [head, ...lines] = text.trim().split('\n');
  const cols = head.split(',');
  return lines.map((line) => {
    const vals = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((v) => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
    return Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
  });
};
const raw = parse(await readFile(resolve(DIR, 'semantic-core-v2-raw.csv'), 'utf8')).map((r) => ({ ...r, volume: Number(r.volume) }));
const core = raw.filter((r) => r.status === 'core');

// Groups by variant; SERP the head of the biggest GROUPS groups.
const groups = {};
for (const r of core) (groups[r.variant] ??= { variant: r.variant, head: r.variant_head, volume: 0, members: [] }).members.push(r);
for (const g of Object.values(groups)) g.volume = Math.max(...g.members.map((m) => m.volume));
const ranked = Object.values(groups).sort((a, b) => b.volume - a.volume);
const picked = ranked.slice(0, GROUPS);
console.log(`groups ${ranked.length}; SERP for top ${picked.length} (volume ≥ ${picked.at(-1).volume})`);

// R1 competitors with the widest reach count as strong; everyone else in a top-10 is a beatable slot.
const strong = new Set(parse(await readFile(resolve(DIR, 'competitors.csv'), 'utf8'))
  .filter((c) => c.type === 'niche/content').slice(0, 25).map((c) => c.domain));
const bare = (d) => (d ?? '').replace(/^www\./, '').toLowerCase();
// Keep the query string (youtube.com/watch?v=… is a different video each time); drop tracking and anchors.
const normUrl = (u) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/#.*$/, '').replace(/[?&]utm_[^&]*/g, '').replace(/\/$/, '').toLowerCase();

const serps = {};
if (!CLUSTER_ONLY) {
  const balance = await balanceUsd();
  const capUsd = Math.min(stepCap, balance);
  console.log(`balance $${balance.toFixed(2)}, step cap $${capUsd.toFixed(2)}`);
  const caller = createCaller({ capUsd, spentUsd: await ledgerSpent(undefined, { notePrefix: 'R5' }) });
  let next = 0, done = 0, stopped = null;
  const worker = async () => {
    while (!stopped && next < picked.length) {
      const g = picked[next++];
      try {
        const { data } = await caller.call('/v1/serp/google', { query: g.head, location: 'us', language: 'en', depth: 10 },
          { note: `R5 serp ${g.variant}`, paramsSummary: `serp "${g.head}" us/en d10`, estimateCost: serpPricing(10) });
        serps[g.head] = data;
      } catch (err) {
        if (err instanceof SpendCapExceeded) { stopped = err.message; break; }
        console.log(`fail  "${g.head}": ${err.message.slice(0, 120)}`);
      }
      if (++done % 50 === 0) console.log(`${done}/${picked.length} spent $${caller.spent.toFixed(2)}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`serp done: ${Object.keys(serps).length}; spent this step $${caller.spent.toFixed(2)}${stopped ? `; STOPPED: ${stopped}` : ''}`);
} else {
  // Re-cluster from saved SERPs without any calls.
  Object.assign(serps, Object.fromEntries(JSON.parse(await readFile(resolve(DIR, '15-serp.json'), 'utf8')).map((s) => [s.head, s.raw])));
}

// Parse each SERP once.
const parsed = {};
for (const [head, data] of Object.entries(serps)) {
  const results = data?.results ?? [];
  const organic = results.filter((r) => r.type === 'organic').slice(0, 10).map((r) => ({ url: r.url, domain: bare(r.domain), position: r.position }));
  const paa = results.filter((r) => r.type === 'peopleAlsoAsk').flatMap((r) => r.data?.items ?? []).map((i) => i.title).filter(Boolean);
  const related = results.filter((r) => r.type === 'relatedSearches').flatMap((r) => r.data?.items ?? []).filter((x) => typeof x === 'string');
  const ai = results.filter((r) => r.type === 'aiOverview');
  const aiDomains = [...new Set(ai.flatMap((r) => [
    ...(r.data?.references ?? []).map((x) => x.domain ?? x.url),
    ...[...JSON.stringify(r.data?.items ?? []).matchAll(/https?:\/\/([^/)\]"\s]+)/g)].map((m) => m[1]),
  ]).filter(Boolean).map(bare))];
  parsed[head] = {
    head, features: data?.itemTypes ?? [], organic, urls: new Set(organic.map((o) => normUrl(o.url))), paa, related, aiDomains,
    weak: organic.filter((o) => UGC.test(o.domain) || (!strong.has(o.domain) && !DICT.test(o.domain))).length,
    ugc: organic.filter((o) => UGC.test(o.domain)).length,
    dict: organic.filter((o) => DICT.test(o.domain)).length,
  };
}
if (!CLUSTER_ONLY) {
  await writeFile(resolve(DIR, '15-serp.json'), JSON.stringify(picked.filter((g) => serps[g.head]).map((g) => ({ head: g.head, raw: serps[g.head] }))));
}

// Pass 1 — lexical: variant keys equal after plural/repeat stripping and
// synonyms that need one page ("dad" / "father" both answer 아빠 / 아버지).
// These SERPs are volatile (AI Overview + PAA leave ~8 organic results, most of
// them UGC threads), so URL overlap alone splits obvious synonyms.
const SYNONYMS = {
  father: 'dad', daddy: 'dad', mother: 'mom', mommy: 'mom', mum: 'mom', grandmother: 'grandma', grandfather: 'grandpa',
  hi: 'hello', bye: 'goodbye', nickname: 'nickname', cursing: 'swear', curse: 'swear', vulgar: 'swear', swearing: 'swear',
  bad: 'swear', offensive: 'swear', cuss: 'swear', characters: 'letter', letters: 'letter', alphabets: 'alphabet',
};
const lexKey = (variant) => [...new Set(variant.split(' ').map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
  .map((w) => SYNONYMS[w] ?? w))].sort().join(' ');
const clusters = [];
const groupCluster = {};
const byLex = {};
for (const g of picked.filter((g) => parsed[g.head])) {
  const key = lexKey(g.variant);
  const home = byLex[key];
  if (home) { home.groups.push(g); continue; }
  const c = { head: g.head, groups: [g] };
  byLex[key] = c;
  clusters.push(c);
}
// Pass 2 — SERP: a lexical cluster joins the first (bigger) cluster whose head
// shares ≥ MIN_SHARED organic URLs with its own head. Head-to-head only:
// comparing any members chains unrelated topics together.
const shared = (a, b) => [...parsed[a].urls].filter((u) => parsed[b].urls.has(u)).length;
const merged = [];
for (const c of clusters) {
  const home = merged.find((h) => shared(h.head, c.head) >= MIN_SHARED);
  if (home) home.groups.push(...c.groups);
  else merged.push(c);
}
clusters.splice(0, clusters.length, ...merged);
clusters.forEach((c, i) => {
  c.id = `c${String(i + 1).padStart(3, '0')}`;
  for (const g of c.groups) groupCluster[g.variant] = c.id;
});

const out = clusters.map((c) => {
  const members = c.groups.flatMap((g) => g.members);
  const heads = c.groups.map((g) => parsed[g.head]);
  const p = parsed[c.head];
  const v1Urls = [...new Set(members.map((m) => m.v1_url).filter(Boolean))];
  return {
    id: c.id, head: c.head,
    volume: c.groups.reduce((s, g) => s + g.volume, 0), // sum of group heads — close variants share one number
    clickstream: members.reduce((s, m) => s + (Number(m.clickstream) || 0), 0) || null,
    kd: Number(members.find((m) => m.keyword === c.head)?.kd) || null,
    groups: c.groups.length, keywords: members.length,
    group_heads: c.groups.map((g) => `${g.head} (${g.volume})`),
    v1_urls: v1Urls, is_new: v1Urls.length === 0,
    features: p.features, weak_slots: p.weak, ugc_slots: p.ugc, dict_slots: p.dict,
    top10: p.organic.map((o) => `${o.position}. ${o.url}`),
    paa: [...new Set(heads.flatMap((h) => h.paa))].slice(0, 12),
    related: [...new Set(heads.flatMap((h) => h.related))].slice(0, 12),
    ai_cited: p.aiDomains,
  };
}).sort((a, b) => b.volume - a.volume);
await writeFile(resolve(DIR, 'clusters-v2.json'), JSON.stringify(out, null, 1));

// Core v2: every core keyword with its cluster (groups past the SERP cut stay unclustered).
const cols = ['keyword', 'volume', 'clickstream', 'kd', 'intent', 'yoy', 'cluster', 'cluster_head', 'variant_head', 'sources', 'v1_url', 'v1_wave', 'competitors', 'competitor_best_pos', 'competitor_url'];
const byId = Object.fromEntries(out.map((c) => [c.id, c]));
const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const coreRows = core.map((r) => ({ ...r, cluster: groupCluster[r.variant] ?? '', cluster_head: byId[groupCluster[r.variant]]?.head ?? '' }));
await writeFile(resolve(DIR, 'semantic-core-v2.csv'), [cols.join(','), ...coreRows.map((r) => cols.map((c) => esc(r[c] ?? '')).join(','))].join('\n') + '\n');

// v1 diff: v1 pages split across clusters, and clusters that merge several v1 pages.
const splits = {};
for (const c of out) for (const u of c.v1_urls) (splits[u] ??= []).push(c.id);
const featureCount = out.reduce((a, c) => { for (const f of c.features) a[f] = (a[f] ?? 0) + 1; return a; }, {});
console.log(`\nclusters: ${out.length} (${out.filter((c) => c.is_new).length} new vs v1); clustered keywords ${coreRows.filter((r) => r.cluster).length} of ${coreRows.length}`);
console.log('SERP features across clusters:', featureCount);
console.log(`v1 pages split over 2+ clusters: ${Object.values(splits).filter((s) => s.length > 1).length}; clusters merging 2+ v1 pages: ${out.filter((c) => c.v1_urls.length > 1).length}`);
console.log('\ntop clusters:');
for (const c of out.slice(0, 60)) {
  console.log(c.id, String(c.volume).padStart(7), String(c.clickstream ?? '-').padStart(6), `kd${c.kd ?? '-'}`.padEnd(5), `weak${c.weak_slots}`.padEnd(7), c.is_new ? 'NEW ' : '    ', c.head.slice(0, 40).padEnd(40), c.v1_urls.join(' ').slice(0, 60));
}
