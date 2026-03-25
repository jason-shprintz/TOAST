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
 *   Node 18+  (uses built-in fetch)
 *
 * Output: src/assets/images/reference/knots/<name>.webp
 * After running, commit the generated .webp files.
 *
 * How it works:
 *   1. For each knot, calls the Wikipedia pageimages API to get the
 *      URL of the article's lead image (the same photo shown in the
 *      infobox). This avoids hardcoding Wikimedia filenames that can't
 *      be verified at code-write time.
 *   2. Downloads the image and converts it to WebP at ≤800px wide.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const OUTPUT_DIR = path.resolve(
  __dirname,
  '../src/assets/images/reference/knots',
);

/**
 * Knot definitions.
 * `article` is the exact English Wikipedia page title for each knot.
 * The script queries the pageimages API to resolve the actual image URL.
 */
const KNOTS = [
  {
    key: 'bowline',
    outFile: 'bowline.webp',
    article: 'Bowline',
  },
  {
    key: 'clove_hitch',
    outFile: 'clove_hitch.webp',
    article: 'Clove hitch',
  },
  {
    key: 'sheet_bend',
    outFile: 'sheet_bend.webp',
    article: 'Sheet bend',
  },
  {
    key: 'square_reef',
    outFile: 'square_reef.webp',
    article: 'Reef knot',
  },
  {
    key: 'overhand_stopper',
    outFile: 'overhand_stopper.webp',
    article: 'Overhand knot',
  },
  {
    key: 'round_turn_two_half_hitches',
    outFile: 'round_turn_two_half_hitches.webp',
    article: 'Round turn and two half-hitches',
  },
  {
    key: 'taut_line_hitch',
    outFile: 'taut_line_hitch.webp',
    article: 'Taut-line hitch',
  },
  {
    key: 'truckers_hitch',
    outFile: 'truckers_hitch.webp',
    article: "Trucker's hitch",
  },
  {
    key: 'prusik',
    outFile: 'prusik.webp',
    article: 'Prusik knot',
  },
];

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT =
  'TOAST-knot-image-downloader/2.0 (https://github.com/jason-shprintz/TOAST)';

/**
 * Ask the Wikipedia pageimages API for the original lead image URL of
 * a given article. Returns null if no image is found.
 */
async function resolveImageUrl(article) {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'pageimages',
    piprop: 'original',
    format: 'json',
    origin: '*',
    titles: article,
  });
  const url = `${WIKI_API}?${params}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Wikipedia API HTTP ${res.status}`);
  const data = await res.json();
  const pages = data?.query?.pages ?? {};
  const page = Object.values(pages)[0];
  const imageUrl = page?.original?.source ?? null;
  return imageUrl;
}

/**
 * Download a URL, following redirects, and return the raw buffer.
 */
function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const get = (u) =>
      https.get(u, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
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
      });
    get(url);
  });
}

async function main() {
  // Require sharp for WebP conversion
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

  for (const { key, outFile, article } of KNOTS) {
    const dest = path.join(OUTPUT_DIR, outFile);

    if (fs.existsSync(dest)) {
      console.log(`  skip   ${outFile}  (already exists)`);
      continue;
    }

    // Step 1: resolve the image URL from Wikipedia
    process.stdout.write(`  lookup ${key} (${article})...`);
    let imageUrl;
    try {
      imageUrl = await resolveImageUrl(article);
    } catch (err) {
      console.log(` LOOKUP FAILED: ${err.message}`);
      continue;
    }

    if (!imageUrl) {
      console.log(` NO IMAGE FOUND on Wikipedia for "${article}"`);
      continue;
    }
    process.stdout.write(` found\n  fetch  ${imageUrl.split('/').pop()}...`);

    // Step 2: download the image
    let buf;
    try {
      buf = await fetchBuffer(imageUrl);
    } catch (err) {
      console.log(` DOWNLOAD FAILED: ${err.message}`);
      continue;
    }

    // Step 3: convert to WebP at ≤800px wide
    try {
      await sharp(buf)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(dest);
      const kb = Math.round(fs.statSync(dest).size / 1024);
      console.log(` done  →  ${outFile}  (${kb} KB)`);
    } catch (err) {
      console.log(` CONVERT FAILED: ${err.message}`);
    }
  }

  console.log('\nDone. Commit the .webp files to the repo.');
  console.log('Attribution is required for CC BY-SA images — see CREDITS.md.');
}

main();
