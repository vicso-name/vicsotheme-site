// Post-build SEO gate. Fails the build (exit 1) on any error below.
import fs from 'node:fs';
import path from 'node:path';
import { redirects } from '../src/config/redirects.mjs';

const root = path.resolve('dist');
const site = 'https://vicsotheme.com';
const redirectMap = new Map(Object.entries(redirects));
const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const f = path.join(dir, e.name);
    return e.isDirectory() ? walk(f) : [f];
  });

const routeToFile = (route) => {
  const pathname = new URL(route, site).pathname;
  return pathname === '/'
    ? path.join(root, 'index.html')
    : path.join(root, pathname.replace(/^\//, ''), 'index.html');
};

const fileToRoute = (file) => {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  return rel === 'index.html' ? '/' : `/${rel.replace(/\/index\.html$/, '')}/`;
};

const rel = (f) => path.relative(process.cwd(), f);
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];

if (!fs.existsSync(root)) {
  fail('dist/ does not exist; run the production build first');
} else {
  const htmlFiles = walk(root).filter((f) => f.endsWith('.html'));
  const redirectFiles = new Set();

  // 1. Redirect stubs exist, point at their target, are noindex, and land on a real page.
  for (const [source, target] of redirectMap) {
    const file = routeToFile(source);
    if (!fs.existsSync(file)) { fail(`Missing redirect page for ${source}`); continue; }
    redirectFiles.add(file);
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes(`url=${target}`) && !html.includes(new URL(target, site).toString())) {
      fail(`Redirect page ${source} does not point to ${target}`);
    }
    if (!/<meta name="robots" content="noindex/.test(html)) fail(`Redirect page ${source} is not noindex`);

    let final = target;
    const seen = new Set([source]);
    while (redirectMap.has(final.replace(/\/$/, '') || '/') && !seen.has(final)) {
      seen.add(final);
      final = redirectMap.get(final.replace(/\/$/, '') || '/');
    }
    if (final !== target) warn(`Redirect chain ${source} → ${target} → … → ${final}`);
    if (!fs.existsSync(routeToFile(final))) fail(`Redirect ${source} ends at missing page ${final}`);
  }

  const indexable = htmlFiles.filter((f) => {
    if (path.basename(f) === '404.html' || redirectFiles.has(f)) return false;
    return !/<meta name="robots" content="noindex/.test(fs.readFileSync(f, 'utf8'));
  });

  // 2. JSON-LD parses everywhere.
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    for (const [, body] of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try { JSON.parse(body.trim()); } catch (e) { fail(`Invalid JSON-LD in ${rel(file)}: ${e.message}`); }
    }
  }

  // 3. Sitemap ⇔ indexable pages.
  const indexFile = path.join(root, 'sitemap-index.xml');
  if (!fs.existsSync(indexFile)) {
    fail('dist/sitemap-index.xml is missing');
  } else {
    const parts = [...fs.readFileSync(indexFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, u]) => u.trim());
    const urls = parts.flatMap((u) => {
      const f = path.join(root, new URL(u).pathname);
      if (!fs.existsSync(f)) { fail(`Sitemap part missing: ${u}`); return []; }
      return [...fs.readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, x]) => x.trim());
    });
    if (urls.length === 0) fail('Sitemap contains no URLs');
    const inSitemap = new Set();
    for (const url of urls) {
      const parsed = new URL(url);
      if (parsed.origin !== site) fail(`Sitemap URL on wrong origin: ${url}`);
      if (!parsed.pathname.endsWith('/')) fail(`Sitemap URL is missing trailing slash: ${url}`);
      if (redirectMap.has(parsed.pathname.replace(/\/$/, '') || '/')) fail(`Sitemap contains a redirect source: ${url}`);
      const file = routeToFile(url);
      if (!indexable.includes(file)) fail(`Sitemap URL does not map to an indexable page: ${url}`);
      inSitemap.add(file);
    }
    for (const file of indexable) {
      if (!inSitemap.has(file)) fail(`Indexable page missing from sitemap: ${fileToRoute(file)}`);
    }
  }

  // 4. Per-page head checks + internal links.
  const titles = new Map();
  const descriptions = new Map();
  for (const file of indexable) {
    const html = fs.readFileSync(file, 'utf8');
    const route = fileToRoute(file);

    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
    if (canonical !== `${site}${route}`) fail(`Canonical mismatch in ${rel(file)}: ${canonical ?? 'missing'} (expected ${site}${route})`);

    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim();
    if (!title) fail(`Missing <title> in ${rel(file)}`);
    else if (titles.has(title)) fail(`Duplicate title "${title}" in ${route} and ${titles.get(title)}`);
    else titles.set(title, route);

    const desc = [...html.matchAll(/<meta\b[^>]*>/gi)].map(([t]) => t).find((t) => attr(t, 'name') === 'description');
    const descText = desc && attr(desc, 'content');
    if (!descText) fail(`Missing meta description in ${rel(file)}`);
    else if (descriptions.has(descText)) fail(`Duplicate description in ${route} and ${descriptions.get(descText)}`);
    else descriptions.set(descText, route);

    const h1s = html.match(/<h1\b/gi)?.length ?? 0;
    if (h1s !== 1) fail(`${route} has ${h1s} <h1> elements (expected 1)`);

    if (html.includes('[TBD]')) warn(`${route} still shows [TBD] placeholders`);

    for (const [, href] of html.matchAll(/href=["']([^"']+)["']/gi)) {
      if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/_astro')) continue;
      const pathname = new URL(href, site).pathname;
      if (/\.[a-z0-9]+$/i.test(pathname)) {
        if (!fs.existsSync(path.join(root, pathname))) fail(`Broken asset link ${pathname} in ${route}`);
        continue;
      }
      const source = pathname.replace(/\/$/, '') || '/';
      if (redirectMap.has(source)) fail(`Internal link uses redirect source ${pathname} in ${route}`);
      else if (!pathname.endsWith('/')) fail(`Internal link without trailing slash ${pathname} in ${route}`);
      else if (!fs.existsSync(routeToFile(pathname))) fail(`Broken internal link ${pathname} in ${route}`);
    }

    for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
      const key = attr(tag, 'property') ?? attr(tag, 'name');
      const image = attr(tag, 'content');
      if (!image || !['og:image', 'twitter:image'].includes(key)) continue;
      if (image.startsWith(`${site}/`) || (image.startsWith('/') && !image.startsWith('//'))) {
        const asset = path.join(root, new URL(image, site).pathname);
        if (!fs.existsSync(asset)) fail(`Missing social image asset: ${image} (${route})`);
      }
    }
  }

  // 5. Files that must stay at the root.
  for (const f of ['robots.txt', 'app-ads.txt', 'favicon.ico']) {
    if (!fs.existsSync(path.join(root, f))) fail(`dist/${f} is missing`);
  }
  const robots = fs.existsSync(path.join(root, 'robots.txt')) ? fs.readFileSync(path.join(root, 'robots.txt'), 'utf8') : '';
  if (!robots.includes(`Sitemap: ${site}/sitemap-index.xml`)) fail('robots.txt does not reference sitemap-index.xml');
}

for (const w of warnings) console.warn(`warn: ${w}`);
if (errors.length) {
  console.error(`SEO check failed with ${errors.length} error(s):`);
  for (const e of errors) console.error(`- ${e}`);
  process.exitCode = 1;
} else {
  console.log(`SEO check passed (${warnings.length} warning(s)).`);
}
