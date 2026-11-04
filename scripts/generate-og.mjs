// One-off: renders public/og-default.png (1200×630) from an SVG with sharp.
// Run with `node scripts/generate-og.mjs`; the PNG is committed.
import sharp from 'sharp';

const ink = '#16181D';
const white = '#FFFFFF';
const muted = '#A9ACB4';
const accent = '#2449D8';
const sans = "'Schibsted Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const mono = "'JetBrains Mono', Menlo, 'Courier New', monospace";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${ink}"/>
  <rect x="80" y="80" width="64" height="8" fill="${accent}"/>
  <text x="80" y="300" fill="${white}" font-family="${sans}" font-size="84" font-weight="700" letter-spacing="-2.5">
    <tspan x="80">Viktor Sokoliuk —</tspan>
    <tspan x="80" dy="100">product engineer, EU</tspan>
  </text>
  <text x="80" y="550" fill="${muted}" font-family="${mono}" font-size="28">vicsotheme.com</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile('public/og-default.png');
console.log('✓ public/og-default.png');
