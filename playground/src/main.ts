import coldEmail from '../../examples/cold-email/before.md';
import landingPage from '../../examples/landing-page/before.md';
import linkedinPost from '../../examples/linkedin-post/before.md';
import readme from '../../examples/readme/before.md';
import tweetThread from '../../examples/tweet-thread/before.md';
import { CATEGORIES, lint, rules, rulesById } from '../../src/core/index.js';
import type { Finding, LintResult, ScoreLabel, Severity } from '../../src/core/types.js';
import { decodeText, encodeText } from './share.js';

const EXAMPLES: { id: string; label: string; text: string }[] = [
  { id: 'readme', label: 'README', text: readme },
  { id: 'landing-page', label: 'Landing page', text: landingPage },
  { id: 'linkedin-post', label: 'LinkedIn post', text: linkedinPost },
  { id: 'tweet-thread', label: 'Tweet thread', text: tweetThread },
  { id: 'cold-email', label: 'Cold email', text: coldEmail },
];

const PAGE_URL = 'https://kcgdz.github.io/sloplint/';
const STORAGE_KEY = 'sloplint:draft';

const BAND: Record<ScoreLabel, string> = {
  Human: 'human',
  'Light seasoning': 'light',
  Sloppy: 'sloppy',
  'Pure slop': 'pure',
};

const RANK: Record<Severity, number> = { error: 3, warning: 2, info: 1 };

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`#${id} missing`);
  return node as T;
}

const input = el<HTMLTextAreaElement>('input');
const backdrop = el<HTMLDivElement>('backdrop');
const exampleSelect = el<HTMLSelectElement>('example');
const clearButton = el<HTMLButtonElement>('clear');
const scoreBox = el<HTMLDivElement>('score');
const scoreValue = el<HTMLSpanElement>('score-value');
const scoreLabel = el<HTMLParagraphElement>('score-label');
const scoreMeta = el<HTMLParagraphElement>('score-meta');
const bandMarker = el<HTMLSpanElement>('band-marker');
const shareX = el<HTMLAnchorElement>('share-x');
const copyLink = el<HTMLButtonElement>('copy-link');
const list = el<HTMLOListElement>('findings');
const emptyNote = el<HTMLParagraphElement>('findings-empty');
const pill = el<HTMLAnchorElement>('score-pill');
const pillValue = el<HTMLElement>('pill-value');
const pillLabel = el<HTMLElement>('pill-label');
el('rule-count').textContent = String(rules.length);

const categoryTitle = new Map(CATEGORIES.map((c) => [c.id, c.title]));

// The floating score pill (narrow screens only) hides while the real score is on screen.
let scoreVisible = true;
new IntersectionObserver(([entry]) => {
  scoreVisible = entry?.isIntersecting ?? true;
  pill.hidden = scoreVisible || current === null;
}).observe(scoreBox);

let current: LintResult | null = null;
let activeIndex = -1;

// ---------------------------------------------------------------- rendering

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Splits the text at every finding boundary and wraps covered segments in a
 * <mark> styled by the most severe finding that covers it.
 */
function renderBackdrop(text: string, findings: Finding[]): void {
  const cuts = new Set<number>([0, text.length]);
  for (const f of findings) {
    cuts.add(f.offset);
    cuts.add(f.offset + f.length);
  }
  const points = [...cuts].sort((a, b) => a - b);
  let html = '';
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const segment = escapeHtml(text.slice(a, b));
    const covering = findings
      .map((f, idx) => ({ f, idx }))
      .filter(({ f }) => f.offset <= a && f.offset + f.length >= b);
    if (covering.length === 0) {
      html += segment;
      continue;
    }
    const top = covering.reduce((m, c) => (RANK[c.f.severity] > RANK[m.f.severity] ? c : m));
    const active = covering.some((c) => c.idx === activeIndex) ? ' m-active' : '';
    html += `<mark class="m-${top.f.severity}${active}">${segment}</mark>`;
  }
  // A trailing newline in a textarea adds a line; mirror it so heights match.
  backdrop.innerHTML = `${html}\n `;
}

function renderScore(result: LintResult | null, text: string): void {
  if (!result || text.trim() === '') {
    scoreBox.dataset.band = 'empty';
    scoreValue.textContent = '0';
    scoreLabel.textContent = 'Waiting for text';
    scoreMeta.textContent = '';
    shareX.setAttribute('aria-disabled', 'true');
    copyLink.disabled = true;
    pill.hidden = true;
    return;
  }
  scoreBox.dataset.band = BAND[result.label];
  scoreValue.textContent = String(result.score);
  scoreLabel.textContent = result.label;
  pillValue.textContent = String(result.score);
  pillLabel.textContent = result.label;
  pill.hidden = scoreVisible;
  bandMarker.style.left = `${Math.min(100, Math.max(0, result.score))}%`;

  const count = (s: Severity): number => result.findings.filter((f) => f.severity === s).length;
  const parts = [`${result.words} words`, `${result.findings.length} findings`];
  if (count('error')) parts.push(`${count('error')} errors`);
  scoreMeta.textContent = parts.join(', ');

  const message = `My draft scored ${result.score}/100 on sloplint (${result.label}). Paste yours and see which phrases give it away.`;
  shareX.href = `https://x.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(PAGE_URL)}`;
  shareX.removeAttribute('aria-disabled');
  copyLink.disabled = false;
}

function renderFindings(result: LintResult | null, text: string): void {
  list.textContent = '';
  if (!result || text.trim() === '') {
    emptyNote.hidden = false;
    emptyNote.textContent = 'Paste a draft, or load an example to see how it works.';
    return;
  }
  if (result.findings.length === 0) {
    emptyNote.hidden = false;
    emptyNote.textContent = 'Nothing flagged. This reads like a person wrote it.';
    return;
  }
  emptyNote.hidden = true;

  result.findings.forEach((f, idx) => {
    const rule = rulesById.get(f.ruleId);
    const li = document.createElement('li');
    li.className = `finding${idx === activeIndex ? ' is-active' : ''}`;
    li.dataset.severity = f.severity;
    li.dataset.index = String(idx);

    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-expanded', String(idx === activeIndex));

    const swatch = document.createElement('span');
    swatch.className = 'finding-swatch';
    swatch.setAttribute('aria-hidden', 'true');

    const match = document.createElement('span');
    match.className = 'finding-match';
    match.textContent = `“${f.match}”`;

    const title = document.createElement('span');
    title.className = 'finding-title';
    // When the rule title just repeats the flagged phrase, name the category instead.
    const ruleTitle = rule?.title ?? f.ruleId;
    const repeats = ruleTitle.toLowerCase().includes(f.match.toLowerCase());
    const label = repeats ? (categoryTitle.get(f.category) ?? ruleTitle) : ruleTitle;
    title.textContent = `${label}, line ${f.line}`;

    const detail = document.createElement('span');
    detail.className = 'finding-detail';
    const why = document.createElement('p');
    why.textContent = f.message;
    const fix = document.createElement('p');
    fix.className = 'finding-fix';
    fix.textContent = f.suggestion;
    const id = document.createElement('p');
    id.className = 'finding-rule';
    id.textContent = `${f.ruleId} (${f.severity})`;
    detail.append(why, fix, id);

    button.append(swatch, match, title, detail);
    button.addEventListener('click', () => selectFinding(idx, true));
    li.append(button);
    list.append(li);
  });
}

function update(): void {
  const text = input.value;
  current = text.trim() ? lint(text) : null;
  activeIndex = -1;
  renderBackdrop(text, current?.findings ?? []);
  renderScore(current, text);
  renderFindings(current, text);
  save(text);
}

function selectFinding(idx: number, moveCaret: boolean): void {
  if (!current) return;
  const f = current.findings[idx];
  if (!f) return;
  activeIndex = activeIndex === idx && moveCaret ? -1 : idx;
  renderBackdrop(input.value, current.findings);
  for (const li of list.querySelectorAll<HTMLLIElement>('.finding')) {
    const on = Number(li.dataset.index) === activeIndex;
    li.classList.toggle('is-active', on);
    li.querySelector('button')?.setAttribute('aria-expanded', String(on));
    if (on && !moveCaret) li.scrollIntoView({ block: 'nearest' });
  }
  if (moveCaret && activeIndex !== -1) {
    input.focus({ preventScroll: true });
    input.setSelectionRange(f.offset, f.offset + f.length);
    const mark = backdrop.querySelector('.m-active');
    mark?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }
}

/** When the caret lands inside a flagged phrase, open its explanation. */
function syncCaret(): void {
  if (!current) return;
  const pos = input.selectionStart;
  const idx = current.findings.findIndex((f) => pos >= f.offset && pos <= f.offset + f.length);
  if (idx !== -1 && idx !== activeIndex) selectFinding(idx, false);
}

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- persistence

function save(text: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, text);
  } catch {
    // Storage can be unavailable (private mode); the page works without it.
  }
}

function loadSaved(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- events

let timer: number | undefined;
input.addEventListener('input', () => {
  // Render the plain backdrop immediately so the layers never drift apart.
  backdrop.textContent = `${input.value}\n `;
  window.clearTimeout(timer);
  timer = window.setTimeout(update, 120);
  if (location.hash) history.replaceState(null, '', location.pathname);
});
input.addEventListener('click', syncCaret);
input.addEventListener('keyup', syncCaret);

for (const ex of EXAMPLES) {
  const option = document.createElement('option');
  option.value = ex.id;
  option.textContent = ex.label;
  exampleSelect.append(option);
}
exampleSelect.addEventListener('change', () => {
  const ex = EXAMPLES.find((e) => e.id === exampleSelect.value);
  if (!ex) return;
  input.value = ex.text;
  history.replaceState(null, '', location.pathname);
  update();
});

clearButton.addEventListener('click', () => {
  input.value = '';
  exampleSelect.value = '';
  history.replaceState(null, '', location.pathname);
  update();
  input.focus();
});

copyLink.addEventListener('click', async () => {
  const hash = await encodeText(input.value);
  const url = `${location.origin}${location.pathname}#${hash}`;
  history.replaceState(null, '', `#${hash}`);
  const original = 'Copy link to this text';
  try {
    await navigator.clipboard.writeText(url);
    copyLink.textContent = 'Link copied';
  } catch {
    copyLink.textContent = 'Copy the address bar';
  }
  window.setTimeout(() => (copyLink.textContent = original), 2000);
});

// ---------------------------------------------------------------- start

async function start(): Promise<void> {
  const fromHash = location.hash.length > 1 ? await decodeText(location.hash.slice(1)) : null;
  const saved = loadSaved();
  if (fromHash !== null) input.value = fromHash;
  else if (saved) input.value = saved;
  else {
    input.value = EXAMPLES[0]!.text;
    exampleSelect.value = EXAMPLES[0]!.id;
  }
  update();
}

void start();
