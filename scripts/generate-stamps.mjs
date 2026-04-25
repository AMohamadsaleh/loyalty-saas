import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../public/stamps');

// ─── Colour palette ───────────────────────────────────────────
const FILLED   = '#1E90FF';   // filled stamp
const EMPTY_BG = '#EFF6FF';   // empty stamp background
const EMPTY_BK = '#BFDBFE';   // empty stamp border
const CARD_BG  = '#FFFFFF';
const LABEL    = '#1E3A5F';

function savePng(svgStr, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  const resvg = new Resvg(svgStr, { fitTo: { mode: 'width', value: 400 } });
  const png = resvg.render();
  writeFileSync(outPath, png.asPng());
  console.log('  wrote', outPath.split('stamps/')[1]);
}

// ─── GRID_6  (2 rows × 3 cols, stamp target = 6) ─────────────
function grid6Svg(filled) {
  const W = 400, H = 260;
  const cols = 3, rows = 2;
  const r = 44;
  const xGap = (W - cols * r * 2) / (cols + 1);
  const yStart = 70;
  const yGap = (H - yStart - 30 - rows * r * 2) / (rows + 1) + r;

  let circles = '';
  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = xGap + r + col * (r * 2 + xGap);
      const cy = yStart + r + row * (r * 2 + yGap * 0.6);
      const isFilled = idx < filled;
      circles += isFilled
        ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FILLED}"/>
           <text x="${cx}" y="${cy + 1}" text-anchor="middle" dominant-baseline="middle"
             font-size="28" fill="white" font-family="system-ui">✓</text>`
        : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${EMPTY_BG}" stroke="${EMPTY_BK}" stroke-width="2.5"/>
           <circle cx="${cx}" cy="${cy}" r="${r * 0.35}" fill="${EMPTY_BK}" opacity="0.5"/>`;
      idx++;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="16" fill="${CARD_BG}"/>
  <text x="20" y="38" font-size="17" font-weight="700" fill="${LABEL}" font-family="system-ui">LOYALTY CARD</text>
  <text x="${W-20}" y="38" text-anchor="end" font-size="15" fill="${FILLED}" font-family="system-ui">${filled} / 6</text>
  ${circles}
  <text x="${W/2}" y="${H - 12}" text-anchor="middle" font-size="12" fill="#94A3B8" font-family="system-ui">
    ${6 - filled > 0 ? `${6 - filled} more to go` : '🎉 Reward ready!'}
  </text>
</svg>`;
}

// ─── CIRCLE_5  (5 stamps in a pentagon arc) ──────────────────
function circle5Svg(filled) {
  const W = 400, H = 260;
  const cx = W / 2, cy = H / 2 + 10;
  const orbitR = 100, r = 40;

  let circles = '';
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * (Math.PI / 180);
    const x = cx + orbitR * Math.cos(angle);
    const y = cy + orbitR * Math.sin(angle);
    const isFilled = i < filled;
    circles += isFilled
      ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${FILLED}"/>
         <text x="${x.toFixed(1)}" y="${(y + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
           font-size="22" fill="white" font-family="system-ui">✓</text>`
      : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${EMPTY_BG}" stroke="${EMPTY_BK}" stroke-width="2.5"/>
         <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r * 0.35}" fill="${EMPTY_BK}" opacity="0.5"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="16" fill="${CARD_BG}"/>
  <text x="20" y="38" font-size="17" font-weight="700" fill="${LABEL}" font-family="system-ui">LOYALTY CARD</text>
  <text x="${W-20}" y="38" text-anchor="end" font-size="15" fill="${FILLED}" font-family="system-ui">${filled} / 5</text>
  ${circles}
  <text x="${W/2}" y="${H - 12}" text-anchor="middle" font-size="12" fill="#94A3B8" font-family="system-ui">
    ${5 - filled > 0 ? `${5 - filled} more to go` : '🎉 Reward ready!'}
  </text>
</svg>`;
}

// ─── BAR_10  (10 stamps in two rows of 5, progress bar style) ─
function bar10Svg(filled) {
  const W = 400, H = 220;
  const r = 30;
  const cols = 5, rows = 2;
  const xGap = (W - cols * r * 2) / (cols + 1);
  const yStart = 62;
  const rowGap = 76;

  let circles = '';
  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = xGap + r + col * (r * 2 + xGap);
      const y = yStart + r + row * rowGap;
      const isFilled = idx < filled;
      circles += isFilled
        ? `<circle cx="${x}" cy="${y}" r="${r}" fill="${FILLED}"/>
           <text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="middle"
             font-size="18" fill="white" font-family="system-ui">✓</text>`
        : `<circle cx="${x}" cy="${y}" r="${r}" fill="${EMPTY_BG}" stroke="${EMPTY_BK}" stroke-width="2.5"/>
           <circle cx="${x}" cy="${y}" r="${r * 0.35}" fill="${EMPTY_BK}" opacity="0.5"/>`;
      idx++;
    }
  }

  const pct = (filled / 10) * 100;
  const barW = W - 40;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="16" fill="${CARD_BG}"/>
  <text x="20" y="38" font-size="17" font-weight="700" fill="${LABEL}" font-family="system-ui">LOYALTY CARD</text>
  <text x="${W-20}" y="38" text-anchor="end" font-size="15" fill="${FILLED}" font-family="system-ui">${filled} / 10</text>
  ${circles}
  <!-- progress bar -->
  <rect x="20" y="${H - 28}" width="${barW}" height="8" rx="4" fill="${EMPTY_BG}" stroke="${EMPTY_BK}" stroke-width="1.5"/>
  <rect x="20" y="${H - 28}" width="${(barW * pct / 100).toFixed(1)}" height="8" rx="4" fill="${FILLED}"/>
</svg>`;
}

// ─── Generate all images ──────────────────────────────────────
console.log('\nGenerating grid_6 (0–6)…');
for (let i = 0; i <= 6; i++) savePng(grid6Svg(i), join(OUT, `grid_6/${i}.png`));

console.log('Generating circle_5 (0–5)…');
for (let i = 0; i <= 5; i++) savePng(circle5Svg(i), join(OUT, `circle_5/${i}.png`));

console.log('Generating bar_10 (0–10)…');
for (let i = 0; i <= 10; i++) savePng(bar10Svg(i), join(OUT, `bar_10/${i}.png`));

console.log('\nDone! All images in public/stamps/');
