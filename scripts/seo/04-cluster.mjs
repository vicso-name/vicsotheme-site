// Step 4 — rule-based clustering of the measured pool (no API calls).
// Each keyword gets a segment (which side of the site it serves), a cluster
// (one future page) and a fit (what to do with it). First matching rule wins.
// Output: docs/seo/research/semantic-core.csv, docs/seo/research/04-clusters.json
//
// Usage: node scripts/seo/04-cluster.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const OUT = resolve(new URL('../../docs/seo/research', import.meta.url).pathname);

const EDU = '(education|educational|e-?learning|elearning|edtech|learning)';
// [segment, cluster, pattern] — order matters.
const RULES = [
  ['exclude', 'off-topic', /disease|fraud|\bllm\b|homework|^create a language$|edu-api/],
  ['exclude', 'brand', /duolingo|babbel|app inventor|speakly|keeleklikk|language curry|indilingo|learndesk|educosys|lexilogos|branah|jump ?speak|langua(talk)? reviews?|rosetta stone|\bspeak (vs|better)|vs speak|pingo/],
  ['exclude', 'translation', /estonian.*translat|translat.*estonian|estonian language to english|english to estonian/],
  ['exclude', 'other-language', /\b(spanish|french|japan|japanese|german|russian|china|chinese|english language)\b/],
  ['hebrew', 'hebrew', /hebrew|hébraïque|aleph|alef|dalet/],

  ['ko', 'korean-keyboard', /chunjiin|(korean|hangul).*(keyboard|typing|copy)|(keyboard|typing|type|copy).*(korean|hangul)/],
  ['ko', 'korean-name-converter', /^convert name$|(korean|korea|hangul).*(name|converter|romaniz)|(name|converter|romaniz).*(korean|korea|hangul)|english to hangul|hangul to romanized|(john|michael|james) in korean/],
  ['ko', 'korean-dictionary', /(korean|korea).*(dictionary|definitions|word for)|dictionary korea/],
  ['ko', 'topik-practice-test', /topik|korean (language )?test|korean level|level korean|korean module/],
  ['ko', 'korean-learning-apps', /(korean|hangul).*\b(apps?|site|website)\b|\b(apps?)\b.*(korean|hangul)/],
  ['ko', 'hangul-pronunciation', /(korean|hangul).*pronunc|pronunc.*(korean|hangul)/],
  ['ko', 'hangul-writing-practice', /(korean|hangul).*(writ|handwriting|worksheet|practice|order)|(write|writing).*(korean|hangul)/],
  ['ko', 'hangul-quiz-games', /(korean|hangul).*(quiz|game|flashcard)|quiz hangul/],
  ['ko', 'how-to-read-korean', /read.*korean|korean.*read/],
  ['ko', 'learn-korean', /learn.*korean|korean.*learn|korean language how/],
  ['ko', 'korean-alphabet-chart', /(korean|hangul|korea).*(chart|a to z|abc|a b c|english|names?\b)|(abc|a b c|letters? names?|names of).*(korean|korea)/],
  ['ko', 'hangul-alphabet', /korean|hangul|korea/],

  ['et', 'estonian-learning-apps', /estonian.*\bapp\b/],
  ['et', 'estonian-grammar', /estonian.*(grammar|cases?|verbs?)|(grammar|cases?|verbs?).*estonian/],
  ['et', 'is-estonian-hard', /estonian.*(hard|difficult|how long)|(hard|difficult|how long).*estonian/],
  ['et', 'learn-estonian', /estonian.*(learn|course|online|textbook|book|pdf|podcast|audio)|(learn|speak|course).*estonian/],
  ['et', 'estonian-phrases', /estonian.*phrases|good morning in estonian/],
  ['et', 'estonian-language', /estonian/],

  ['dev', 'edtech-app-development-cost', new RegExp(`${EDU}.*(app|software).*cost`)],
  ['dev', 'how-to-build-educational-app', /how to (build|create|make)|creat(e|ing) (an |a )?(educational|education|teaching)|create (a|your own) language|what is (an )?educational app/],
  ['dev', 'educational-app-ideas', /app ideas|apps ideas|app topics/],
  ['dev', 'language-learning-app-development', /language (learning )?app development|flutter/],
  ['dev', 'edtech-app-development-company', new RegExp(`${EDU}.*(app|application|software|mobile app).*(develop|compan|service|solution|builder)|${EDU}.*(app|software) (developers?|compan)|digital education company|app maker for education|e-learning designer|learning platform for teachers`)],

  ['topic', 'ai-in-education', /\bai\b|artificial intelligence|chatbot/],
  ['topic', 'gamification-in-education', /gamif/],
  ['topic', 'personalized-learning', /personali[sz]ed/],
  ['topic', 'edtech-trends', /trend|latest technology|edtech update/],
  ['topic', 'what-is-edtech', /ed ?tech|edu ?-?tech|educational technolog|education technolog|technology (in |of )?education|tech ed|it in education|information technology|education and software|education it|technology education|information education|technology definition in education/],

  ['lang-apps', 'best-language-learning-app', /(best|good|free).*\bapp\b|\bapp\b.*(best|free)/],
  ['lang-apps', 'language-learning-app', /language.*\bapp\b|\bapp\b.*language|create a language/],
];

// What each segment means for vicsotheme.com.
const FIT = {
  dev: 'target',          // client-work side: hire / build intent
  ko: 'target',           // Hangul Hero landing + supporting pages
  et: 'target',           // Estonian Verbs / Eesti Sõned — check eestisoned.com overlap
  topic: 'park',          // EdTech thought-leadership; only where a case backs it
  'lang-apps': 'park',    // mass market dominated by big brands
  hebrew: 'hebrewedu',    // owned by hebrewedu.com — do not cannibalize
  exclude: 'exclude',
};
// Korean utilities are tools, not content — a separate build decision.
const TOOL_CLUSTERS = new Set(['korean-keyboard', 'korean-name-converter', 'korean-dictionary']);

const { measured } = JSON.parse(await readFile(resolve(OUT, '03-candidates.json'), 'utf8'));
const seen = new Set();
const rows = [];
for (const k of measured) {
  const keyword = k.keyword.toLowerCase().trim();
  if (seen.has(keyword)) continue;
  seen.add(keyword);
  const [segment, cluster] = RULES.find(([, , re]) => re.test(keyword)) ?? ['unclassified', 'unclassified'];
  const fit = TOOL_CLUSTERS.has(cluster) ? 'tool-idea' : FIT[segment] ?? 'review';
  const competitors = [...new Set(k.sources.filter((s) => !/^(ideas|related|paa|discovery)/.test(s)).map((s) => s.split('/')[0]))];
  rows.push({
    keyword, volume: k.volume ?? 0, kd: k.difficulty ?? '', intent: k.intent ?? '', cpc: k.cpc ?? '',
    segment, cluster, fit, competitors: competitors.join(' '),
    source: k.sources.some((s) => /^(related|paa|discovery)/.test(s)) ? 'serp' : k.sources.some((s) => s.startsWith('ideas')) ? 'ideas' : 'competitor',
  });
}
rows.sort((a, b) => a.segment.localeCompare(b.segment) || a.cluster.localeCompare(b.cluster) || b.volume - a.volume);

const cols = ['keyword', 'volume', 'kd', 'intent', 'cpc', 'segment', 'cluster', 'fit', 'competitors', 'source'];
const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
await writeFile(resolve(OUT, 'semantic-core.csv'), [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n');

const clusters = {};
for (const r of rows) {
  const c = (clusters[`${r.segment}/${r.cluster}`] ??= { segment: r.segment, cluster: r.cluster, fit: r.fit, keywords: 0, volume: 0, kdSum: 0, head: r.keyword, headVolume: r.volume, competitors: new Set() });
  c.keywords++; c.volume += r.volume; c.kdSum += Number(r.kd) || 0;
  if (r.volume > c.headVolume) { c.head = r.keyword; c.headVolume = r.volume; }
  r.competitors.split(' ').filter(Boolean).forEach((d) => c.competitors.add(d));
}
const summary = Object.values(clusters)
  .map(({ kdSum, competitors, ...c }) => ({ ...c, avgKd: Math.round(kdSum / c.keywords), competitors: [...competitors] }))
  .sort((a, b) => b.volume - a.volume);
await writeFile(resolve(OUT, '04-clusters.json'), JSON.stringify(summary, null, 1) + '\n');

for (const c of summary) {
  console.log(`${c.fit.padEnd(9)} ${`${c.segment}/${c.cluster}`.padEnd(42)} ${String(c.keywords).padStart(3)} kw ${String(c.volume).padStart(7)} vol KD${String(c.avgKd).padStart(3)}  head: ${c.head} (${c.headVolume})`);
}
