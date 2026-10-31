#!/usr/bin/env node
// Renders docs/images/before-after.png (README) and docs/images/social-preview.png
// (GitHub social preview, 1280x640) with a headless Chromium browser.
// Highlights and scores come from the real engine in dist/, so run a build first.
//
//   npm run build && node scripts/render-images.mjs
//
// Set BROWSER_PATH to a Chrome, Chromium or Edge binary if auto-detection fails.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lint } from '../dist/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs', 'images');
mkdirSync(outDir, { recursive: true });

const BROWSERS = [
  process.env.BROWSER_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const browser = BROWSERS.find((p) => existsSync(p));
if (!browser) throw new Error('No Chromium-based browser found. Set BROWSER_PATH.');

// ------------------------------------------------------------------ helpers

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const RANK = { error: 3, warning: 2, info: 1 };

/** Wraps flagged ranges in <mark>, one paragraph per blank-line block. */
function marked(text) {
  const { findings } = lint(text);
  const cuts = new Set([0, text.length]);
  for (const f of findings) cuts.add(f.offset).add(f.offset + f.length);
  const pts = [...cuts].sort((a, b) => a - b);
  let html = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]];
    const cover = findings.filter((f) => f.offset <= a && f.offset + f.length >= b);
    const seg = esc(text.slice(a, b));
    if (!cover.length) html += seg;
    else {
      const top = cover.reduce((m, f) => (RANK[f.severity] > RANK[m.severity] ? f : m));
      html += `<mark class="m-${top.severity}">${seg}</mark>`;
    }
  }
  return html
    .split(/\n{2,}/)
    .map((p) => `<p>${p}</p>`)
    .join('');
}

const scoreOf = (path) => lint(readFileSync(join(root, path), 'utf8'));

const BAND = {
  Human: '#1f7a5c',
  'Light seasoning': '#6a7d12',
  Sloppy: '#b4690e',
  'Pure slop': '#b3245c',
};

const BASE_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    width: var(--w); height: var(--h); overflow: hidden;
    background: #eef1f4; color: #18202b;
    font-family: 'Bricolage Grotesque', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .sheet { background: #fff; border: 1px solid #d5dbe2; border-radius: 8px; }
  .text { font-family: 'Newsreader', Georgia, serif; }
  .text p { margin: 0 0 0.7em; }
  .text p:last-child { margin-bottom: 0; }
  mark { color: inherit; border-radius: 2px; padding: 0.06em 0; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .m-warning { background: #ffe45c; }
  .m-error { background: #ffa3c4; }
  .m-info { background: none; box-shadow: inset 0 -0.32em 0 #b4ecf4; }
  .hl { background: linear-gradient(transparent 16%, #ffe45c 16%, #ffe45c 90%, transparent 90%); padding: 0 0.06em; }
`;

const FONTS =
  '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=block" rel="stylesheet">';

function page(width, height, css, body) {
  return `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>:root{--w:${width}px;--h:${height}px}${BASE_CSS}${css}</style></head><body>${body}</body></html>`;
}

const work = mkdtempSync(join(tmpdir(), 'sloplint-img-'));

function shoot(name, width, height, scale, html) {
  const htmlPath = join(work, `${name}.html`);
  writeFileSync(htmlPath, html);
  const out = join(outDir, `${name}.png`);
  execFileSync(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-color-profile=srgb',
      `--force-device-scale-factor=${scale}`,
      `--window-size=${width},${height}`,
      '--virtual-time-budget=6000',
      `--screenshot=${out}`,
      pathToFileURL(htmlPath).href,
    ],
    { stdio: 'ignore' },
  );
  const png = readFileSync(out);
  console.log(`${name}.png ${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`);
}

// ------------------------------------------------------------------ before/after

const beforeFile = scoreOf('examples/readme/before.md');
const afterFile = scoreOf('examples/readme/after.md');

const beforeExcerpt = `In today's fast-paced world, developers need tools that keep up. Images are the backbone of the modern web — but optimizing them is often a pain — slow, manual, and error-prone.

Enter Shrinkray: a cutting-edge, blazing-fast CLI that seamlessly resizes and compresses your images. It's not just an image resizer, it's a complete optimization powerhouse. Whether you're a solo hacker or a large enterprise, Shrinkray will elevate your workflow and unlock the full potential of your assets.`;

const afterExcerpt = `Shrinkray resizes and compresses a folder of images from the command line. On a 2021 MacBook Air it turns 1,000 phone photos (4.1 GB) into 1200px-wide JPEGs (310 MB) in about 40 seconds.

It reads JPEG, PNG and WebP, and writes the same formats. AVIF support is planned for 0.4.

Shrinkray runs one worker per CPU core. Files that fail to decode are skipped and listed at the end, so one corrupt image won't stop a batch of thousands.`;

function panel(title, result, excerpt) {
  return `
    <section class="sheet panel">
      <header>
        <h2>${title}</h2>
        <div class="score" style="color:${BAND[result.label]}">
          <span class="num">${result.score}</span><span class="max">/100</span>
          <span class="label">${result.label}</span>
        </div>
      </header>
      <div class="text">${marked(excerpt)}</div>
    </section>`;
}

shoot(
  'before-after',
  1200,
  600,
  2,
  page(
    1200,
    600,
    `
    body { padding: 36px 40px 30px; display: flex; flex-direction: column; gap: 18px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; flex: 1; min-height: 0; }
    .panel { padding: 22px 28px 26px; display: flex; flex-direction: column; gap: 16px; overflow: hidden; }
    header { display: flex; justify-content: space-between; align-items: flex-start; }
    h2 { margin: 6px 0 0; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
    .score { text-align: right; line-height: 1; }
    .num { font-size: 64px; font-weight: 800; letter-spacing: -0.05em; }
    .max { font-size: 20px; font-weight: 600; color: #5b6573; margin-left: 4px; }
    .label { display: block; margin-top: 6px; font-size: 18px; font-weight: 600; }
    .text { font-size: 19.5px; line-height: 1.62; }
    footer { display: flex; justify-content: space-between; font-size: 16px; color: #5b6573; }
    footer b { color: #18202b; font-weight: 800; font-size: 18px; }
  `,
    `<div class="grid">
      ${panel('Generated README', beforeFile, beforeExcerpt)}
      ${panel('After the sloplint skill', afterFile, afterExcerpt)}
    </div>
    <footer><span><b><span class="hl">slop</span>lint</b>&nbsp;&nbsp;scores are for the full files in examples/readme</span><span>npx sloplint README.md</span></footer>`,
  ),
);

// ------------------------------------------------------------------ social preview

const sample =
  "In today's fast-paced world, our cutting-edge platform lets you seamlessly unlock the full potential of your data. Let's dive in!";
const sampleResult = lint(sample);

shoot(
  'social-preview',
  1280,
  640,
  1,
  page(
    1280,
    640,
    `
    body { padding: 72px 80px; display: grid; grid-template-columns: 1.05fr 1fr; gap: 64px; align-items: center; }
    .brand h1 { margin: 0; font-size: 132px; font-weight: 800; letter-spacing: -0.055em; line-height: 0.9; }
    .brand h1 .hl { background: linear-gradient(transparent 38%, #ffe45c 38%, #ffe45c 86%, transparent 86%); padding: 0 0.04em; margin-left: -0.04em; }
    .brand p { margin: 28px 0 0; font-size: 34px; line-height: 1.22; font-weight: 600; letter-spacing: -0.015em; max-width: 15ch; }
    .brand code { display: inline-block; margin-top: 34px; font: 600 24px ui-monospace, Consolas, monospace; color: #5b6573; }
    .card { padding: 34px 38px 38px; }
    .card .score { line-height: 0.9; color: ${BAND[sampleResult.label]}; }
    .card .num { font-size: 120px; font-weight: 800; letter-spacing: -0.06em; }
    .card .max { font-size: 30px; font-weight: 600; color: #5b6573; margin-left: 6px; letter-spacing: 0; }
    .card .label { display: block; margin: 10px 0 24px; font-size: 30px; font-weight: 600; }
    .card .text { font-size: 27px; line-height: 1.55; }
  `,
    `<div class="brand">
      <h1><span class="hl">slop</span>lint</h1>
      <p>Catch the phrases that make writing read like AI output.</p>
      <code>npx sloplint README.md</code>
    </div>
    <div class="sheet card">
      <div class="score"><span class="num">${sampleResult.score}</span><span class="max">/100</span><span class="label">${sampleResult.label}</span></div>
      <div class="text">${marked(sample)}</div>
    </div>`,
  ),
);
