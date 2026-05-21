import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jpeg from 'jpeg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'images');
fs.mkdirSync(outDir, { recursive: true });

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

const width = 800;
const height = 1200;

for (let i = 1; i <= 10; i++) {
  const [r, g, b] = hslToRgb(26 + i * 16, 0.2, 0.34 + (i % 4) * 0.03);
  const data = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x / width - 0.5;
      const ny = y / height - 0.5;
      const vignette = 1 - (nx * nx + ny * ny) * 0.45;
      const grain = ((x * 17 + y * 31 + i * 7) % 11) / 11 - 0.5;
      const idx = (y * width + x) * 4;
      data[idx] = Math.min(255, Math.max(0, Math.round(r * vignette + grain * 6)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.round(g * vignette + grain * 5)));
      data[idx + 2] = Math.min(255, Math.max(0, Math.round(b * vignette + grain * 4)));
      data[idx + 3] = 255;
    }
  }

  const encoded = jpeg.encode({ data, width, height }, 88);
  fs.writeFileSync(path.join(outDir, `img${i}.jpg`), encoded.data);
}

console.log('Generated img1.jpg … img10.jpg');
