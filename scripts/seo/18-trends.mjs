// Step R8 (plan v2) — seasonality and growth for the content calendar, from
// the monthly history (`trend`, up to ~8 years) that keywords/overview already
// returned. Free: reads cached responses only. (YepAPI /v1/seo/trends returned
// empty timelines while still billing, 2026-10-27 — don't use it.)
// Output: docs/seo/research/hangulhero/18-seasonality.json
//
// Usage: node scripts/seo/18-trends.mjs

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(new URL('../../docs/seo/research', import.meta.url).pathname);
const DIR = resolve(ROOT, 'hangulhero');
const CACHE = resolve(ROOT, 'responses');
const YEARS = 3; // month-of-year profile from the last 3 full years
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const history = {};
for (const f of (await readdir(CACHE)).filter((f) => f.endsWith('.json'))) {
  let json;
  try { json = JSON.parse(await readFile(resolve(CACHE, f), 'utf8')); } catch { continue; }
  for (const k of json.data?.keywords ?? []) if (k.keyword && k.trend?.length) history[k.keyword.toLowerCase()] = k.trend;
}

const core = (await readFile(resolve(DIR, 'url-map.csv'), 'utf8')).trim().split('\n').slice(1).map((line) => {
  const v = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((x) => x.replace(/,$/, '').replace(/^"|"$/g, ''));
  return { keyword: v[0], volume: Number(v[1]), url: v[4], wave: v[5] };
});

const sum = (a) => a.reduce((s, x) => s + x, 0);
function profile(trend) {
  const t = [...trend].sort((a, b) => a.month.localeCompare(b.month)).slice(-12 * YEARS);
  const byMonth = Array.from({ length: 12 }, () => []);
  for (const p of t) byMonth[Number(p.month.slice(5, 7)) - 1].push(p.volume);
  const means = byMonth.map((v) => (v.length ? sum(v) / v.length : 0));
  const avg = sum(means) / 12 || 1;
  const last12 = sum(t.slice(-12).map((p) => p.volume));
  const prev12 = sum(t.slice(-24, -12).map((p) => p.volume));
  return { index: means.map((m) => Math.round((m / avg) * 100)), yoy: prev12 ? Math.round((last12 / prev12 - 1) * 100) : null };
}

// Per page: volume-weighted profile of its keywords.
const pages = {};
for (const r of core.filter((r) => r.url && history[r.keyword.toLowerCase()])) {
  const p = (pages[r.url] ??= { url: r.url, wave: r.wave, volume: 0, index: Array(12).fill(0), last12: 0, prev12: 0 });
  const { index } = profile(history[r.keyword.toLowerCase()]);
  index.forEach((v, i) => (p.index[i] += v * r.volume));
  const t = [...history[r.keyword.toLowerCase()]].sort((a, b) => a.month.localeCompare(b.month));
  p.last12 += sum(t.slice(-12).map((x) => x.volume));
  p.prev12 += sum(t.slice(-24, -12).map((x) => x.volume));
  p.volume += r.volume;
}
const rows = Object.values(pages).map((p) => {
  const index = p.index.map((v) => Math.round(v / (p.volume || 1)));
  const peak = index.indexOf(Math.max(...index));
  return { url: p.url, wave: p.wave, volume: p.volume, peak: MONTHS[peak], peak_index: index[peak], yoy: p.prev12 ? Math.round((p.last12 / p.prev12 - 1) * 100) : null, index };
}).sort((a, b) => b.volume - a.volume);

await writeFile(resolve(DIR, '18-seasonality.json'), JSON.stringify({ months: MONTHS, years: YEARS, pages: rows }, null, 1));
console.log('url'.padEnd(44), 'vol'.padStart(7), ' yoy', MONTHS.map((m) => m.padStart(4)).join(''));
for (const r of rows.filter((r) => r.wave === '1' || r.wave === '2' || r.wave === '3')) {
  console.log(r.url.padEnd(44), String(r.volume).padStart(7), String(r.yoy ?? '-').padStart(4) + '%', r.index.map((v) => String(v).padStart(4)).join(''));
}
