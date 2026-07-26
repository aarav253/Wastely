// Generates the PWA icon set from an inline SVG. Re-run with `npm run icons:generate`
// after changing the icon design below.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "client", "public", "icons");
mkdirSync(outDir, { recursive: true });

function iconSvg({ size, padding, rounded }) {
  const r = rounded ? size * 0.22 : 0;
  const leafScale = (size - padding * 2) / 100;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#145c3f" />
      <stop offset="100%" stop-color="#9bdc4d" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)" />
  <g transform="translate(${padding}, ${padding}) scale(${leafScale})">
    <path
      d="M50 8C25 8 8 28 8 55c0 20 14 35 34 37 2-16 8-30 18-40 -12 8-20 20-24 34C50 84 92 70 92 30 92 16 74 8 50 8Z"
      fill="#ffffff"
    />
    <path d="M40 92C40 68 48 50 62 36" stroke="#145c3f" stroke-width="4" fill="none" stroke-linecap="round" />
  </g>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, padding: 24, rounded: true },
  { file: "icon-512.png", size: 512, padding: 64, rounded: true },
  { file: "maskable-512.png", size: 512, padding: 100, rounded: false },
  { file: "apple-touch-icon.png", size: 180, padding: 22, rounded: true },
];

for (const t of targets) {
  const svg = Buffer.from(iconSvg(t));
  await sharp(svg).png().toFile(path.join(outDir, t.file));
  console.log(`wrote ${t.file}`);
}
