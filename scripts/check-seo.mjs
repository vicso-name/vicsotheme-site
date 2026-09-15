import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const site = 'https://vicsotheme.com';
const redirectMap = new Map([
  ['/blog', '/'],
  ['/blog/astro-vs-wordpress-2026', '/services/cms-content-architecture/'],
  ['/blog/how-to-publish-google-play', '/services/mobile-product-engineering/'],
  ['/blog/why-flutter-gets-hate', '/services/mobile-product-engineering/'],
  ['/blog/why-i-build-language-apps', '/services/edtech-learning-systems/'],
]);

const errors = [];

function fail(message) {
  errors.push(message);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(filename) : [filename];
  });
}

function routeToFile(route) {
  const pathname = new URL(route, site).pathname;
  return pathname === '/'
    ? path.join(root, 'index.html')
    : path.join(root, pathname.replace(/^\//, ''), 'index.html');
}

function fileToRoute(filename) {
  const relative = path.relative(root, filename).replaceAll(path.sep, '/');
  if (relative === 'index.html') return '/';
  return `/${relative.replace(/\/index\.html$/, '')}/`;
}

if (!fs.existsSync(root)) {
  fail('dist/ does not exist; run the production build first');
} else {
  const htmlFiles = walk(root).filter((filename) => filename.endsWith('.html'));
  const redirectFiles = new Set();

  for (const [source, target] of redirectMap) {
    const filename = routeToFile(source);
    if (!fs.existsSync(filename)) {
      fail(`Missing redirect page for ${source}`);
      continue;
    }
    redirectFiles.add(filename);
    const html = fs.readFileSync(filename, 'utf8');
    const expectedTarget = new URL(target, site).toString();
    if (!html.includes(expectedTarget) && !html.includes(`url=${target}`)) {
      fail(`Redirect page ${source} does not point to ${target}`);
    }
  }

  const indexableFiles = htmlFiles.filter((filename) =>
    path.basename(filename) !== '404.html' && !redirectFiles.has(filename)
  );

  for (const filename of htmlFiles) {
    const html = fs.readFileSync(filename, 'utf8');
    const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const [, body] of blocks) {
      try {
        JSON.parse(body.trim());
      } catch (error) {
        fail(`Invalid JSON-LD in ${path.relative(process.cwd(), filename)}: ${error.message}`);
      }
    }
  }

  const sitemapFile = path.join(root, 'sitemap.xml');
  if (!fs.existsSync(sitemapFile)) {
    fail('dist/sitemap.xml is missing');
  } else {
    const sitemap = fs.readFileSync(sitemapFile, 'utf8');
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url.trim());
    if (urls.length === 0) fail('dist/sitemap.xml contains no URLs');
    for (const url of urls) {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') fail(`Sitemap URL is not HTTPS: ${url}`);
      if (parsed.pathname !== '/' && !parsed.pathname.endsWith('/')) {
        fail(`Sitemap URL is missing trailing slash: ${url}`);
      }
      const source = parsed.pathname.replace(/\/$/, '') || '/';
      if (source === '/blog' || source.startsWith('/blog/')) {
        fail(`Sitemap contains a blog URL: ${url}`);
      }
      if (redirectMap.has(source)) {
        fail(`Sitemap contains a redirect source: ${url}`);
      }
      const filename = routeToFile(url);
      if (!indexableFiles.includes(filename)) {
        fail(`Sitemap URL does not map to an indexable page: ${url}`);
      }
    }
  }

  for (const filename of indexableFiles) {
    const html = fs.readFileSync(filename, 'utf8');
    const route = fileToRoute(filename);
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
    if (canonical !== `${site}${route}`) {
      fail(`Canonical mismatch in ${path.relative(process.cwd(), filename)}: ${canonical ?? 'missing'} (expected ${site}${route})`);
    }

    for (const [, href] of html.matchAll(/href=["']([^"']+)["']/gi)) {
      if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/_astro')) continue;
      const pathname = new URL(href, site).pathname;
      const source = pathname.replace(/\/$/, '') || '/';
      const targetFile = routeToFile(pathname);
      if (redirectMap.has(source)) {
        fail(`Internal link uses redirect source ${pathname} in ${path.relative(process.cwd(), filename)}`);
      } else if (!fs.existsSync(targetFile)) {
        fail(`Broken internal link ${pathname} in ${path.relative(process.cwd(), filename)}`);
      }
    }

    for (const [metaTag] of html.matchAll(/<meta\b[^>]*>/gi)) {
      const getAttribute = (attribute) =>
        metaTag.match(new RegExp(`\\b${attribute}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
      const property = getAttribute('property');
      const name = getAttribute('name');
      const image = getAttribute('content');
      const imageType = property ?? name;

      if (!image || !['og:image', 'twitter:image'].includes(imageType)) continue;

      const isLocalImage = image.startsWith('/') && !image.startsWith('//');
      const isSameSiteImage = image.startsWith(`${site}/`);
      if (isLocalImage || isSameSiteImage) {
        const assetPath = isLocalImage ? image : new URL(image).pathname;
        const asset = path.join(root, assetPath.replace(/^\//, ''));
        if (!fs.existsSync(asset)) fail(`Missing social image asset: ${image}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`SEO check failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('SEO check passed: JSON-LD, sitemap, canonical URLs, internal links, redirects, and social assets are valid.');
}
