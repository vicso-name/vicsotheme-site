// Step 7 — cluster the Hangul Hero pool into site sections and pages (no API
// calls). Every keyword gets: section (site area), cluster (one page), page type,
// the app feature it leads to, and its role in getting installs.
// Output: docs/seo/research/hangulhero/semantic-core.csv, 07-clusters.json
//
// Usage: node scripts/seo/07-hangulhero-cluster.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const OUT = resolve(new URL('../../docs/seo/research/hangulhero', import.meta.url).pathname);

// Phrase X-Ray packs. Phrase -> [pack, page slug]; variants share a page.
const PACK = {
  greetings: ['hello', 'goodbye', 'good morning', 'good night', 'how are you', 'nice to meet you', 'welcome',
    'my name is', 'what is your name', 'excuse me', 'sorry', 'thank you', 'yes', 'no', 'happy birthday'],
  'love-dating': ['i love you', 'saranghae', 'i like you', 'i miss you', 'love', 'my love', 'boyfriend', 'girlfriend'],
  'kdrama-hits': ['oppa', 'unnie', 'noona', 'hyung', 'aigoo', 'daebak', 'jinjja', 'omo', 'fighting', 'cute'],
  feelings: ['happy', 'sad', 'angry', 'tired', 'beautiful', 'pretty', 'sleep'],
  'food-cafe': ['delicious', 'cheers', 'coffee', 'water'],
  'getting-around': ['where is the bathroom', 'how much', 'help', 'help me', 'hospital'],
  'at-work': ['boss', 'work hard'],
  family: ['sister', 'friend'],
};
const PAGE_ALIAS = { saranghae: 'i love you', 'help me': 'help', pretty: 'beautiful' };
const PHRASE_PACK = new Map(Object.entries(PACK).flatMap(([pack, list]) => list.map((p) => [p, pack])));
const PHRASE_RE = /^(?:how to (?:say|pronounce) |what does |what is )?(.+?) (?:mean )?in korean(?: language| formal| informal| politely| casual| when drinking)?$|^korean words? (hello|pretty|cute|love)$/;

// [section, cluster, pageType, appFeature, pattern] — first match wins.
const RULES = [
  ['exclude', 'off-topic', '-', '-', /appetizer|apple|vinegar|korean air|hyundai|app store|magnets|\bjung\b|korean app (photo|chat|drama)|app drama|discord|nyc|near me|in korea$|classes|lore|bts|tinytan|quizlet|hakkyo|hangul hakkyo|korean module|homework/],
  ['exclude', 'translation-tool', '-', '-', /translat|to english$|english to korean|korean to english/],

  ['tools', 'korean-keyboard', 'tool', 'Sori', /keyboard|typing|type korean|copy|chunjiin/],
  ['tools', 'korean-name-converter', 'tool', '-', /\bname\b.*(korean|korea|hangul)|(korean|korea|hangul).*\bnames?\b(?!.*letter)|converter|convert name|(john|michael|james) in korean/],
  ['tools', 'korean-dictionary', 'tool', '-', /dictionary(?!.*slang)|definitions|word for/],
  ['tools', 'romanization', 'tool', 'Sori', /romaniz|romanized|hangul to english|to hangul$|translate to hangul/],

  ['practice', 'topik', 'park', '-', /topik|korean test|level korean|korean level|test sample/],

  ['app', 'korean-learning-app', 'landing', 'install', /\bapps?\b/],

  ['phrases', 'korean-slang', 'hub', 'Phrase X-Ray', /slang/],
  ['phrases', 'kdrama-phrases', 'hub', 'Phrase X-Ray: K-Drama Hits', /kdrama|k-drama|drama/],
  ['phrases', 'korean-phrases-travel', 'hub', 'Phrase X-Ray: Getting Around', /travel|restaurant/],
  ['phrases', 'korean-love-words', 'hub', 'Phrase X-Ray: Love & Dating', /words? (for |of )?(love|lovers|endearment)|phrases (about |for )?love|love phrases/],
  ['phrases', 'korean-food-words', 'hub', 'Phrase X-Ray: Food & Café', /food (words|vocabulary)/],
  ['phrases', 'korean-family-words', 'hub', 'Phrase X-Ray', /family/],
  ['phrases', 'korean-phrases', 'hub', 'Phrase X-Ray', /phrases/],
  ['phrases', 'common-korean-words', 'hub', 'Phrase X-Ray', /korean words|words to know|korean vocabulary|learn korean vocabulary/],

  // Script-level heads share the alphabet's volume — they belong to the hub, not to writing/history.
  ['alphabet', 'hangul-alphabet', 'hub', 'Alphabet lessons', /writing alphabet|alphabet writing|language alphabet$|\bscript\b|hangul in korean letters|korean letters hangul|hangul in hangul/],
  ['alphabet', 'batchim', 'article', 'Alphabet lessons', /batchim|final consonant/],
  ['alphabet', 'syllable-blocks', 'article', 'Sori', /syllable|blocks|jamo/],
  ['alphabet', 'consonants-and-vowels', 'article', 'Alphabet lessons', /consonants? (and |&)?vowels?|vowels? (and |&)?consonants?/],
  ['alphabet', 'korean-vowels', 'article', 'Alphabet lessons', /vowel/],
  ['alphabet', 'korean-consonants', 'article', 'Alphabet lessons', /consonant/],
  ['pronunciation', 'korean-pronunciation', 'article', 'Native audio + Phrase X-Ray', /pronunc|sounds?\b|audio|mouth shape/],
  ['reading', 'how-to-read-korean', 'article', 'Sori', /read/],
  ['writing', 'hangul-writing', 'article', 'Alphabet lessons', /writ|handwriting|calligraph|stroke|worksheet|practice sheet/],
  ['practice', 'hangul-quiz-games', 'tool', 'Quizzes & games', /quiz|game|\btest\b|flashcard|song|practice/],
  ['alphabet', 'hangul-history', 'article', '-', /history|origin|invent|sejong|hangul day|alphabet day|definition|meaning|hanja|hangul vs|vs english|writing system|\bscript\b|or hangeul|what is (the )?(korean alphabet|hangul)|alphabet called|hangul language/],
  ['alphabet', 'korean-alphabet-chart', 'tool', 'Alphabet lessons', /chart|pdf|a ?to ?z|a-z|a b c|\babc\b|in english|english|letters list|graph|cheat sheet/],
  ['alphabet', 'korean-alphabet-order-names', 'article', 'Alphabet lessons', /order|names?\b/],
  ['learn', 'learn-hangul', 'hub', 'install', /learn (hangul|korean hangul|korean alphabet|alphabet)|hangul (guide|101|online)|how to learn the korean alphabet/],
  ['learn', 'learn-korean', 'article', 'install', /learn|korean learning|learning korean|how to (study|learn)/],
  ['alphabet', 'hangul-alphabet', 'hub', 'Alphabet lessons', /korean|hangul|korea/],
];

// What a section does for installs.
const ROLE = {
  app: 'direct', alphabet: 'feature-match', pronunciation: 'feature-match', reading: 'feature-match',
  writing: 'feature-match', practice: 'feature-match', phrases: 'feature-match', learn: 'awareness',
  tools: 'tool-traffic', exclude: '-',
};

const rows = JSON.parse(await readFile(resolve(OUT, '06-candidates.json'), 'utf8'));
const seen = new Set();
const core = [];
for (const k of rows) {
  const keyword = k.keyword;
  if (seen.has(keyword)) continue;
  seen.add(keyword);
  let section, cluster, pageType, feature, pack = '';
  const m = keyword.match(PHRASE_RE);
  const phrase = m && (m[1] ?? m[2]);
  if (phrase && PHRASE_PACK.has(phrase)) {
    pack = PHRASE_PACK.get(phrase);
    [section, cluster, pageType, feature] = ['phrases', `phrase/${(PAGE_ALIAS[phrase] ?? phrase).replace(/\s+/g, '-')}`, 'programmatic', `Phrase X-Ray: ${pack}`];
  } else {
    [section, cluster, pageType, feature] = RULES.find((r) => r[4].test(keyword)) ?? ['review', 'unclassified', '-', '-'];
  }
  const role = cluster === 'topik' ? 'park' : ROLE[section] ?? 'review';
  core.push({
    keyword, volume: k.volume ?? 0, kd: k.difficulty ?? '', intent: k.intent ?? '', cpc: k.cpc ?? '',
    section, cluster, page_type: pageType, app_feature: feature, pack, role,
    source: k.sources.some((s) => s.startsWith('phase1')) ? 'competitor' : k.sources.includes('phrase-template') ? 'template' : 'autocomplete',
  });
}
core.sort((a, b) => a.section.localeCompare(b.section) || a.cluster.localeCompare(b.cluster) || b.volume - a.volume);

const cols = ['keyword', 'volume', 'kd', 'intent', 'cpc', 'section', 'cluster', 'page_type', 'app_feature', 'pack', 'role', 'source'];
const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
await writeFile(resolve(OUT, 'semantic-core.csv'), [cols.join(','), ...core.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n');

const clusters = {};
for (const r of core) {
  const c = (clusters[r.cluster] ??= { section: r.section, cluster: r.cluster, pageType: r.page_type, appFeature: r.app_feature, role: r.role, keywords: 0, volume: 0, kdMax: 0, head: r.keyword, headVolume: -1 });
  c.keywords++; c.volume += r.volume; c.kdMax = Math.max(c.kdMax, Number(r.kd) || 0);
  if (r.volume > c.headVolume) { c.head = r.keyword; c.headVolume = r.volume; }
}
const summary = Object.values(clusters).sort((a, b) => b.headVolume - a.headVolume);
await writeFile(resolve(OUT, '07-clusters.json'), JSON.stringify(summary, null, 1) + '\n');
for (const c of summary) {
  console.log(`${c.role.padEnd(13)} ${`${c.section}/${c.cluster}`.padEnd(46)} ${String(c.keywords).padStart(3)} kw  head ${String(c.headVolume).padStart(6)} KDmax ${String(c.kdMax).padStart(2)}  ${c.head}`);
}
