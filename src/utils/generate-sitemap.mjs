import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://vicsotheme.com';
const TODAY = new Date().toISOString().split('T')[0];

// Static pages with priorities
const staticPages = [
  { url: '/',       changefreq: 'weekly',  priority: '1.0' },
  { url: '/apps',   changefreq: 'monthly', priority: '0.8' },
  { url: '/contact',changefreq: 'monthly', priority: '0.8' },
  { url: '/blog',   changefreq: 'weekly',  priority: '0.7' },
];

// Auto-discover service pages from content/services folder
function getServicePages() {
  const servicesDir = path.join(process.cwd(), 'src/content/services');
  if (!fs.existsSync(servicesDir)) return [];
  return fs.readdirSync(servicesDir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      url: `/services/${f.replace('.md', '')}`,
      changefreq: 'monthly',
      priority: '0.9',
    }));
}

// Auto-discover blog posts from content/blog folder
function getBlogPages() {
  const blogDir = path.join(process.cwd(), 'src/content/blog');
  if (!fs.existsSync(blogDir)) return [];
  return fs.readdirSync(blogDir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      url: `/blog/${f.replace('.md', '')}`,
      changefreq: 'monthly',
      priority: '0.6',
    }));
}

function generateSitemap() {
  const allPages = [
    ...staticPages,
    ...getServicePages(),
    ...getBlogPages(),
  ];

  const urls = allPages.map(({ url, changefreq, priority }) => `
  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  const outPath = path.join(process.cwd(), 'public/sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf-8');
  console.log(`✓ sitemap.xml generated with ${allPages.length} URLs → ${outPath}`);
}

generateSitemap();
