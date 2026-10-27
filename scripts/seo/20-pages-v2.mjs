// Plan v2 — page map for hanguledu.com. Every core keyword (semantic-core-v2.csv)
// is routed to a page through ordered rules on its SERP cluster head (or, for
// groups below the R5 cut, its own variant head). Pages are learning
// infrastructure — tools, trainers, word sets, reference data — not articles.
// Output: docs/seo/research/hangulhero/pages-v2.csv, url-map-v2.csv
//
// Usage: node scripts/seo/20-pages-v2.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DIR = resolve(new URL('../../docs/seo/research/hangulhero', import.meta.url).pathname);

// type: what the page *is*. module: the shared engine that renders it.
// app: the Hangul Hero feature the page hands off to ('' = traffic page, no app feature yet).
const P = (url, type, module, app, wave) => ({ url, type, module, app, wave });
const PAGES = {
  home: P('/', 'landing', 'landing', 'Install', 1),
  apps: P('/best-apps-to-learn-korean/', 'comparison', 'comparison', 'Install', 2),
  roadmap: P('/learn-korean/', 'tool', 'roadmap', 'Alphabet lessons', 1),
  course: P('/learn-hangul/', 'course', 'course', 'Alphabet lessons', 1),
  alphabet: P('/korean-alphabet/', 'reference', 'alphabet', 'Alphabet lessons', 1),
  chart: P('/korean-alphabet/chart/', 'tool', 'alphabet', 'Alphabet lessons', 1),
  vowels: P('/korean-alphabet/vowels/', 'reference', 'alphabet', 'Alphabet lessons', 1),
  consonants: P('/korean-alphabet/consonants/', 'reference', 'alphabet', 'Alphabet lessons', 1),
  batchim: P('/korean-alphabet/batchim/', 'reference', 'alphabet', 'Alphabet lessons', 2),
  blocks: P('/korean-alphabet/syllable-blocks/', 'trainer', 'reader', 'Sori', 2),
  history: P('/korean-alphabet/hangul-day/', 'reference', 'alphabet', '', 3),
  letter: P('/korean-alphabet/{letter}/', 'reference', 'letter', 'Alphabet lessons', 2), // ×40, one engine
  read: P('/how-to-read-korean/', 'trainer', 'reader', 'Sori', 1),
  pron: P('/korean-pronunciation/', 'tool', 'xray', 'Phrase X-Ray', 2),
  writing: P('/hangul-writing-practice/', 'tool', 'writing', '', 2),
  keyboard: P('/korean-keyboard/', 'tool', 'keyboard', '', 1),
  layout: P('/korean-keyboard/layout/', 'reference', 'keyboard', '', 1),
  typing: P('/korean-keyboard/typing-practice/', 'trainer', 'keyboard', '', 2),
  reader: P('/tools/hangul-reader/', 'tool', 'reader', 'Sori', 2),
  nameConv: P('/korean-name/', 'tool', 'names', '', 1),
  names: P('/korean-names/', 'reference', 'names', '', 2),
  nicknames: P('/korean-nicknames/', 'reference', 'names', 'Phrase X-Ray: love', 1),
  numbers: P('/korean-numbers/', 'tool', 'numbers', '', 1),
  age: P('/tools/korean-age-calculator/', 'tool', 'numbers', '', 3),
  games: P('/play/', 'hub', 'games', 'Quizzes', 2),
  phrases: P('/phrases/', 'hub', 'phrases', 'Phrase X-Ray', 1),
  basic: P('/phrases/basic-korean-phrases/', 'hub', 'phrases', 'Phrase X-Ray: greetings', 1),
  kdrama: P('/phrases/k-drama/', 'hub', 'phrases', 'Phrase X-Ray: K-Drama Hits', 1),
  love: P('/phrases/love/', 'hub', 'phrases', 'Phrase X-Ray: Love & Dating', 1),
  slang: P('/phrases/slang/', 'hub', 'phrases', 'Phrase X-Ray: Feelings & Reactions', 2),
  swear: P('/phrases/korean-swear-words/', 'wordset', 'phrases', '', 2),
  titles: P('/korean-honorifics/', 'tool', 'titles', 'Phrase X-Ray: K-Drama Hits', 1),
  words: P('/korean-words/', 'hub', 'wordsets', '', 2),
  family: P('/korean-words/family/', 'wordset', 'wordsets', '', 1),
  days: P('/korean-words/days-of-the-week/', 'wordset', 'wordsets', '', 2),
  weather: P('/korean-words/weather/', 'wordset', 'wordsets', '', 2),
  colors: P('/korean-words/colors/', 'wordset', 'wordsets', '', 2),
  food: P('/korean-words/food/', 'wordset', 'wordsets', 'Phrase X-Ray: Food & Café', 2),
  animals: P('/korean-words/animals/', 'wordset', 'wordsets', '', 2),
  school: P('/korean-words/school/', 'wordset', 'wordsets', 'Phrase X-Ray: At Work', 3),
  body: P('/korean-words/body/', 'wordset', 'wordsets', 'Phrase X-Ray: Health & Emergencies', 3),
  function: P('/korean-words/basic-words/', 'wordset', 'wordsets', '', 2),
  holidays: P('/phrases/holiday-greetings/', 'wordset', 'phrases', '', 3),
};
// Honorific / K-culture terms: one page each, rendered by the titles engine.
// Titles (who you call what) live under the honorifics tool; expressions get a /meaning/ page.
const TITLES = ['oppa', 'unnie', 'noona', 'nuna', 'hyung', 'sunbae', 'maknae', 'chingu'];
const EXPRESSIONS = ['aegyo', 'daebak', 'aigoo', 'babo'];
const TERMS = [...TITLES, ...EXPRESSIONS, 'saranghae', 'hwaiting'];
const TERM_ALIAS = { nuna: 'noona' };
// Terms whose meaning is a phrase page that already exists.
const TERM_PHRASE = { saranghae: '/phrases/i-love-you-in-korean/', hwaiting: '/phrases/fighting-in-korean/' };
const termPage = (t) => {
  if (TERM_PHRASE[t]) return P(TERM_PHRASE[t], 'phrase', 'phrases', 'Phrase X-Ray', 1);
  const wave = ['oppa', 'unnie', 'noona', 'hyung', 'aegyo'].includes(t) ? 1 : 2;
  return TITLES.includes(t)
    ? P(`/korean-honorifics/${t}/`, 'reference', 'titles', 'Phrase X-Ray: K-Drama Hits', wave)
    : P(`/meaning/${t}/`, 'reference', 'titles', 'Phrase X-Ray: Feelings & Reactions', wave);
};
// Phrase slugs: synonyms collapse onto one page.
const PHRASE_ALIAS = {
  hi: 'hello', bye: 'goodbye', cheer: 'cheers', tasty: 'delicious', pretty: 'beautiful', goodnight: 'good-night', 'good night': 'good-night',
  'love you': 'i-love-you', saranghae: 'i-love-you', saranghaeyo: 'i-love-you', loving: 'love', lover: 'love', okay: 'okay', ok: 'okay',
  'korean you\'re welcome': 'welcome', "you're welcome": 'welcome', hwaiting: 'fighting', paiting: 'fighting', congrats: 'congratulations',
  congratulation: 'congratulations', 'i miss u': 'i-miss-you', 'i like u': 'i-like-you', "i'm sorry": 'sorry', 'how do i say sorry': 'sorry',
  'stop it': 'stop', 'my loves': 'my love', 'how are you': 'how-are-you', 'hello how are you': 'how-are-you', 'hi how are you': 'how-are-you',
};

// Ordered rules: first match wins. Tested against the cluster head, then the keyword.
const RULES = [
  [/\b(app|apps|application)\b/, (k) => (/\b(best|good|top)\b/.test(k) ? PAGES.apps : PAGES.home)],
  [/swear|curse|cursing|bad words?|vulgar|dirty words|offensive words|rude words|shibal|shibaloma|f you|shut up|saekki/, PAGES.swear],
  [/keyboard layout|layout/, PAGES.layout],
  [/typing|type korean/, PAGES.typing],
  [/keyboard|hangul on keyboard/, PAGES.keyboard],
  [/name (in korean )?generator|generate korean name|my name in korean|name in korean|names? converter|reedsy/, PAGES.nameConv],
  [/nickname|endearment|jagiya/, PAGES.nicknames],
  [/family names|surname|female (korean )?names|male names|names for (guys|girls)|popular korean names|korean names|first name|last names?|how do korean names work|names and meanings|^name korea$/, PAGES.names],
  [/korea(n)? age|aging/, PAGES.age],
  [/number|count|counting|\bone\b in korean|\b\d+\b in korean|^\d+ in korean/, PAGES.numbers],
  [/\b(mom|mommy|mother|dad|daddy|father|appa|grandma|grandmother|grandfather|halmoni|aunt|auntie|uncle|brother|sister|sis|siblings?|family)\b/, PAGES.family],
  [/day of the week|days of the week|weekdays|months?\b|calendar/, PAGES.days],
  [/weather|seasons?\b/, PAGES.weather],
  [/colou?rs?\b|korea color/, PAGES.colors],
  [/\b(dog|cat|animal|animals|chick|chicken|wildlife)\b/, PAGES.animals],
  [/food|fruit|seafood|sushi|carrot|\btea\b|alcohol|drinking/, PAGES.food],
  [/teacher|teach|homework|school|\bbook\b|test in korean|\bnotes\b|journal/, PAGES.school],
  [/\bface\b|dental|dentist|height|body/, PAGES.body],
  [/new year|christmas|holiday greeting/, PAGES.holidays],
  [/hangul day|alphabet day|proclamation day|korea day|history of hangul|who invented/, PAGES.history],
  [/handwriting|cursive|calligraphy|penmanship|handwrite|vertical writing|stroke order|korean writing|written korean|write korean|writing practice/, PAGES.writing],
  [/pronunciation|pronounce|sound change|tongue twister/, PAGES.pron],
  [/romaniz|romanis|korean text\b|hangul reader|english korean|korean to english|korea in english/, PAGES.reader],
  [/syllable block|syllable/, PAGES.blocks],
  [/batchim|final consonant/, PAGES.batchim],
  [/vowel/, PAGES.vowels],
  [/consonant/, PAGES.consonants],
  [/^how to say [a-z] in korean$|^[a-z] in korean$|chart|letters a to z|a-z|alphabet letters|alphabet korean letters|all korean alphabet/, PAGES.chart],
  [/how to read|read korean|reading/, PAGES.read],
  [/games?|quiz/, PAGES.games],
  [/honorific|sunbae|maknae|oppa|unnie|noona|nuna|hyung|aegyo|daebak|aigoo|babo|saranghae|hwaiting|chingu|k oppa/, null], // → term pages below
  [/slang|texting|text messages|abbreviation|laugh|korean really|korean han\b|hallyu/, PAGES.slang],
  [/kdrama|k-drama|drama/, PAGES.kdrama],
  [/love|girlfriend|boyfriend|lover|honey|handsome|beautiful woman/, null], // love phrases → phrase pages, else love hub
  [/basic korean (phrases|expressions)|korean easy phrases|korean phrases common|greeting/, PAGES.basic],
  [/^(how to say|how do you say|korean) (the|and|is|from|in|what|why|where|very)( in korean)?$|^(and|the|is|from|what|why|where|very|good|future|success|high) in korean|^korean (and|where|in korean)$|^what in korean$|^why in hangul$/, PAGES.function],
  [/korean phrases|korean expression|korean sentences|korean sentence|how do you say in korean|how to say in korean|speak(ing)? korean|korean words basic|korean basics/, PAGES.phrases],
  [/korean words|hangul vocabulary|vocabulary/, PAGES.words],
  [/hangul learning|learn hangul|hangul korean language|korean hangul$/, PAGES.course],
  [/how to (learn|study) korean|learn(ing)? korean|korean (language )?(course|class|classes|lessons|learning classes|language learning)|learn korea|learn in korean|study korean|best way to learn|online korean|is korean (hard|easy)|korea easy to learn|resources|korean language$/, PAGES.roadmap],
  [/hangul|alphabet|letters|script|korean characters|korean symbol|how to spell/, PAGES.alphabet],
];
// Out of scope: country facts, culture, celebrities, money — not language learning.
const OUT = /what languages? (are|do|does)|languages? (in|of|spoken)|south korea'?s? languages|korean in us|korea province|cost of living|living expenses|salary|price of living|conscription|draft|ethnic|are koreans|official name|national (song|flower)|aegukga|anthem|flower korea|cherry blossom|kpop|k-pop|bangtan|idol|group|band|artists|wiki|music|songs?|singing|karaoke|beauty|style|hair|jewel|princess|folklore|creature|legend|traditions|beliefs|faith|christian|catholic|temple|architecture|gown|fan death|coins|bank|email|liberation|independence|how big|korea questions|question about korea|tv series|cartoon|poetry|quotes book|books? pages|calligraphy paper|my korean notes|female$|south korean female|korea in korean|korea dates|economic|places in korean|dance|korea ok|korean china|korean male|happy birthday song|birthday korea|koreans birthday|^l korean$|nega|korean language sign|white day|black day|traditional (korean )?(clothes|clothing|dress)|writers|koreatown|official language|^in korea$|bathroom/;

const phraseSlug = (k) => {
  // Register variants (formal / informal) belong on the phrase page's forms table.
  k = k.replace(/^(formal|informal|polite|casual) /, '').replace(/ (formal|informal|polite|casual)$/, '').replace(/^how to write /, '');
  let m = k.match(/^(?:how (?:to|do you|do i) say )?(.+?) in (?:korean|korea|hangul)(?: language)?$/) || k.match(/^korean (?:word )?(?:for |of )?(.+)$/) || k.match(/^(.+?) korean$/);
  if (!m) return null;
  let p = m[1].replace(/^(a|the) /, '').trim();
  // Not a phrase: single letters, grammar, media, religion, self-reference.
  if (!p || p.length < 2 || p.split(' ').length > 4 || /korean|korea|hangul|words?|language|alphabet|letters?|phrases?|grammar|pictures?|play(ing)?|mein|prayer|hanbok|^me$|myself/.test(p)) return null;
  p = PHRASE_ALIAS[p] ?? p;
  return p.replace(/[^a-z0-9 -]/g, '').trim().replace(/\s+/g, '-');
};
const termOf = (k) => TERMS.find((t) => new RegExp(`\\b${t}`).test(k));

const parse = (text) => {
  const [head, ...lines] = text.trim().split('\n');
  const cols = head.split(',');
  return lines.map((line) => {
    const vals = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((v) => v.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));
    return Object.fromEntries(cols.map((c, i) => [c, vals[i]]));
  });
};
const core = parse(await readFile(resolve(DIR, 'semantic-core-v2.csv'), 'utf8')).map((r) => ({ ...r, volume: Number(r.volume), clickstream: Number(r.clickstream) || 0 }));
// Phrase X-Ray pack per v1 phrase page, so phrase pages hand off to the right pack.
const v1Pack = {};
for (const r of parse(await readFile(resolve(DIR, 'url-map.csv'), 'utf8'))) if (r.pack && r.url.startsWith('/phrases/')) v1Pack[r.url] = r.pack;
const PACK_NAME = { greetings: 'greetings', 'love-dating': 'Love & Dating', 'kdrama-hits': 'K-Drama Hits', feelings: 'Feelings & Reactions', 'food-cafe': 'Food & Café', 'getting-around': 'Getting Around', 'at-work': 'At Work', family: 'family' };

function route(text) {
  if (OUT.test(text)) return { page: null, why: 'out-of-scope' };
  for (const [re, page] of RULES) {
    if (!re.test(text)) continue;
    if (page) return { page: typeof page === 'function' ? page(text) : page };
    const t = termOf(text);
    if (t) return { page: termPage(TERM_ALIAS[t] ?? t) };
    if (/honorific/.test(text)) return { page: PAGES.titles };
    break; // love / term fall-through → try phrase page
  }
  const slug = phraseSlug(text);
  if (slug) {
    const url = `/phrases/${slug}-in-korean/`;
    return { page: P(url, 'phrase', 'phrases', v1Pack[url] ? `Phrase X-Ray: ${PACK_NAME[v1Pack[url]] ?? v1Pack[url]}` : 'Phrase X-Ray', 2), phrase: true };
  }
  if (/love|girlfriend|boyfriend/.test(text)) return { page: PAGES.love };
  return { page: null, why: 'unassigned' };
}

// Route by cluster head when SERP-clustered (pages follow the SERP), else by the keyword itself.
const map = core.map((r) => {
  let routed = route(r.cluster_head || r.variant_head || r.keyword);
  if (!routed.page && routed.why === 'unassigned') routed = route(r.keyword);
  const { page, why, phrase } = routed;
  return { ...r, url: page?.url ?? '', type: page?.type ?? '', module: page?.module ?? '', app: page?.app ?? '', wave: page?.wave ?? why, phrase: Boolean(phrase), _page: page };
});

// Phrase pages need demand of their own; thin ones fold into the phrases hub.
const PHRASE_MIN = 1000;
const phraseVol = {};
for (const r of map.filter((r) => r.phrase)) phraseVol[r.url] = Math.max(phraseVol[r.url] ?? 0, r.volume);
for (const r of map.filter((r) => r.phrase)) {
  if (phraseVol[r.url] < PHRASE_MIN) Object.assign(r, { url: PAGES.phrases.url, type: 'hub', module: 'phrases', app: PAGES.phrases.app, wave: 1 });
}
// Phrase pages: W1 for the 20 biggest (as v1), W2 for the rest.
const phraseRank = Object.entries(phraseVol).filter(([, v]) => v >= PHRASE_MIN).sort((a, b) => b[1] - a[1]).map(([u]) => u);
for (const r of map.filter((r) => r.phrase && r.type === 'phrase')) r.wave = phraseRank.indexOf(r.url) < 20 ? 1 : 2;
// Letter pages are not keyword-routed here: they're the 40-page reference set every alphabet page links into.

const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const toCsv = (rows, cols) => [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c] ?? '')).join(','))].join('\n') + '\n';
map.sort((a, b) => String(a.wave).localeCompare(String(b.wave)) || a.url.localeCompare(b.url) || b.volume - a.volume);
await writeFile(resolve(DIR, 'url-map-v2.csv'), toCsv(map, ['keyword', 'volume', 'clickstream', 'kd', 'url', 'wave', 'type', 'module', 'app', 'cluster', 'cluster_head', 'v1_url']));

const pages = {};
for (const r of map.filter((r) => r.url)) {
  const p = (pages[r.url] ??= { url: r.url, wave: r.wave, type: r.type, module: r.module, app: r.app, rows: [], v1: new Set() });
  p.rows.push(r);
  if (r.v1_url) p.v1.add(r.v1_url);
  if (typeof r.wave === 'number' && r.wave < p.wave) p.wave = r.wave;
}
pages[PAGES.letter.url] = { ...PAGES.letter, rows: map.filter((r) => /^(giyeok|nieun|digeut|rieul|mieum|bieup|siot|ieung|jieut|chieut|kieuk|tieut|pieup|hieut|ssang)/.test(r.keyword)), v1: new Set() };
const pageRows = Object.values(pages).map((p) => {
  // Demand = sum of distinct variant heads (close variants share one Keyword Planner number).
  const heads = new Map();
  for (const r of p.rows) heads.set(r.variant_head || r.keyword, Math.max(heads.get(r.variant_head || r.keyword) ?? 0, r.volume));
  const rows = p.rows.sort((a, b) => b.volume - a.volume);
  return {
    url: p.url, wave: p.wave, type: p.type, module: p.module, app_feature: p.app,
    primary_keyword: rows[0]?.keyword ?? '', primary_volume: rows[0]?.volume ?? 0,
    demand: [...heads.values()].reduce((s, v) => s + v, 0), clickstream: rows.reduce((s, r) => s + r.clickstream, 0) || '',
    keywords: rows.length, kd: rows[0]?.kd ?? '', v1_url: [...p.v1].join(' '),
    secondary_keywords: [...new Set(rows.slice(1).map((r) => r.variant_head || r.keyword))].slice(0, 10).join('; '),
  };
}).sort((a, b) => String(a.wave).localeCompare(String(b.wave)) || b.demand - a.demand);
await writeFile(resolve(DIR, 'pages-v2.csv'), toCsv(pageRows, ['url', 'wave', 'type', 'module', 'app_feature', 'primary_keyword', 'primary_volume', 'demand', 'clickstream', 'keywords', 'kd', 'v1_url', 'secondary_keywords']));

const count = (k) => map.reduce((a, r) => ((a[r[k]] = (a[r[k]] ?? 0) + 1), a), {});
console.log('keywords by wave:', count('wave'));
const pw = {};
for (const p of pageRows) pw[`W${p.wave}`] = (pw[`W${p.wave}`] ?? 0) + 1;
console.log('pages by wave:', pw, '| by type:', pageRows.reduce((a, p) => ((a[p.type] = (a[p.type] ?? 0) + 1), a), {}));
console.log('demand by module:', Object.entries(pageRows.reduce((a, p) => ((a[p.module] = (a[p.module] ?? 0) + p.demand), a), {})).sort((a, b) => b[1] - a[1]).map(([m, v]) => `${m} ${v}`).join(' · '));
for (const p of pageRows.filter((p) => p.type !== 'phrase' || p.wave === 1)) console.log(`W${p.wave}`, p.type.padEnd(10), p.url.padEnd(40), String(p.demand).padStart(7), p.primary_keyword);
const un = map.filter((r) => r.wave === 'unassigned').sort((a, b) => b.volume - a.volume);
console.log(`\nunassigned ${un.length}:`, un.slice(0, 40).map((r) => `${r.keyword} ${r.volume}`).join(' | '));
