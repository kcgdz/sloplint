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
    <footer><span><b><span class="hl">slop</span>lint</b>&nbsp;&nbsp;scores are for the full files in examples/readme</span><span>npx @kcgdz/sloplint README.md</span></footer>`,
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
    body { padding: 42px 56px; background: #12161c; color: #e6eaf0; }
    header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 38px; }
    .wordmark { font-size: 36px; font-weight: 800; letter-spacing: -0.02em; }
    .wordmark .hl { color: #18202b; background: linear-gradient(transparent 18%, #e8c62e 18%, #e8c62e 88%, transparent 88%); }
    .url { font-size: 22px; color: #9aa4b1; }
    main { display: grid; grid-template-columns: 740px 1fr; gap: 48px; }
    h1 { margin: 0 0 26px; font-size: 49px; line-height: 1.08; font-weight: 800; letter-spacing: -0.03em; max-width: 24ch; }
    .draft { background: #1a2029; border: 1px solid #2c3540; border-radius: 6px; padding: 26px 30px; }
    .text { font-size: 29px; line-height: 1.52; }
    mark.m-warning { background: none; box-shadow: inset 0 -0.22em 0 #e8c62e80; }
    .result { padding-top: 7px; }
    .score { line-height: 0.95; color: #ff6b9e; }
    .num { font-size: 136px; font-weight: 800; letter-spacing: -0.04em; }
    .max { font-size: 32px; font-weight: 600; color: #9aa4b1; margin-left: 4px; }
    .label { display: block; margin: 14px 0 28px; font-size: 30px; font-weight: 600; }
    .scale { display: grid; grid-template-columns: 15fr 25fr 30fr 30fr; gap: 3px; height: 8px; }
    .scale span:nth-child(1) { background: #4cc69c55; }
    .scale span:nth-child(2) { background: #b5c94a55; }
    .scale span:nth-child(3) { background: #f0a43c55; }
    .scale span:nth-child(4) { background: #ff6b9e; }
    .details { color: #9aa4b1; font-size: 22px; margin: 18px 0; }
    footer { position: absolute; bottom: 38px; left: 56px; right: 56px; display: flex; justify-content: space-between; border-top: 1px solid #2c3540; padding-top: 20px; font-size: 20px; color: #9aa4b1; }
    footer code { font-size: 19px; }
  `,
    `<header><div class="wordmark"><span class="hl">slop</span>lint</div><span class="url">kcgdz.github.io/sloplint</span></header>
    <main>
      <section><h1>Paste a draft. See what reads like AI slop.</h1><div class="draft text">${marked(sample)}</div></section>
      <section class="result"><div class="score"><span class="num">${sampleResult.score}</span><span class="max">/100</span><span class="label">${sampleResult.label}</span></div><div class="scale"><span></span><span></span><span></span><span></span></div><p class="details">${sampleResult.words} words, ${sampleResult.findings.length} findings</p></section>
    </main>
    <footer><span>Runs in your browser. Your text stays with you.</span><code>npx @kcgdz/sloplint README.md</code></footer>`,
  ),
);
