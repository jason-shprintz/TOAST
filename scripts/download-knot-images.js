#!/usr/bin/env node
/**
 * download-knot-images.js
 *
 * Fetches the 9 Wikimedia Commons knot photos and converts them to WebP.
 * Run once from the repo root after cloning or when images need updating:
 *
 *   node scripts/download-knot-images.js
 *
 * Prerequisites:
 *   npm install sharp   (or: yarn add sharp)
 *   Node 18+
 *
 * Output: src/assets/images/reference/knots/<name>.webp
 * After running, commit the generated .webp files.
 */

const { Buffer } = require('buffer');
const fs = require('fs');
const https = require('https');
const path = require('path');

const OUTPUT_DIR = path.resolve(
  __dirname,
  '../src/assets/images/reference/knots',
);

/** Wikimedia Commons source images */
const KNOT_IMAGES = [
  {
    key: 'bowline',
    outFile: 'bowline.webp',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Knot_bowline.jpg',
  },
  {
    key: 'clove_hitch',
    outFile: 'clove_hitch.webp',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Clove_hitch.jpg',
  },
  {
    key: 'sheet_bend',
    outFile: 'sheet_bend.webp',
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Sheet_bend_-_WetCanvas.jpg',
  },
  {
    key: 'square_reef',
    outFile: 'square_reef.webp',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Granny_vs_reef.jpg',
  },
  {
    key: 'overhand_stopper',
    outFile: 'overhand_stopper.webp',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Overhand_knot_retouched.jpg',
  },
  {
    key: 'round_turn_two_half_hitches',
    outFile: 'round_turn_two_half_hitches.webp',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Round_turn_and_two_half-hitches_knot.jpg',
  },
  {
    key: 'taut_line_hitch',
    outFile: 'taut_line_hitch.webp',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Tautline_hitch_knot.jpg',
  },
  {
    key: 'truckers_hitch',
    outFile: 'truckers_hitch.webp',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Truckers_Hitch_Knot.jpg',
  },
  {
    key: 'prusik',
    outFile: 'prusik.webp',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Prusik_knot.jpg',
  },
];

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const get = (u) =>
      https.get(
        u,
        { headers: { 'User-Agent': 'TOAST-knot-downloader/1.0' } },
        (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            return get(res.headers.location);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
          }
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        },
      );
    get(url);
  });
}

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error(
      'sharp is not installed. Run: npm install sharp\n' +
        'Or convert manually: cwebp -q 85 input.jpg -o output.webp',
    );
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const { key, outFile, url } of KNOT_IMAGES) {
    const dest = path.join(OUTPUT_DIR, outFile);
    if (fs.existsSync(dest)) {
      console.log(`  skip  ${outFile}  (already exists)`);
      continue;
    }
    process.stdout.write(`  fetch ${key}...`);
    try {
      const buf = await fetchBuffer(url);
      await sharp(buf)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(dest);
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(` done  →  ${outFile}  (${kb} KB)`);
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
    }
  }

  console.log('\nDone. Commit the .webp files to the repo.');
  console.log('Attribution is required for CC BY-SA images — see CREDITS.md.');
}

main();
