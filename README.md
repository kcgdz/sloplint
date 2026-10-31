# sloplint

Catch the phrases that make writing read like unedited AI output, before your readers do.

![A generated README with highlighted phrases scores 100/100, Pure slop. The rewrite after the sloplint skill scores 0/100, Human.](https://raw.githubusercontent.com/kcgdz/sloplint/main/docs/images/before-after.png)

[![CI](https://github.com/kcgdz/sloplint/actions/workflows/ci.yml/badge.svg)](https://github.com/kcgdz/sloplint/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@kcgdz/sloplint)](https://www.npmjs.com/package/@kcgdz/sloplint)
[![slop score](https://img.shields.io/badge/slop%20score-0%2F100%20Human-brightgreen)](#slop-score)

**Try it in the browser:** [kcgdz.github.io/sloplint](https://kcgdz.github.io/sloplint/)

## Before and after

An excerpt from a typical generated README ([full file](examples/readme/before.md)):

> In today's fast-paced world, developers need tools that keep up. Images are the backbone of the modern web — but optimizing them is often a pain — slow, manual, and error-prone.
>
> Enter **Shrinkray**: a **cutting-edge**, **blazing-fast** CLI that **seamlessly** resizes and compresses your images. It's not just an image resizer, it's a complete optimization powerhouse.

The same README after a rewrite with the sloplint skill ([full file](examples/readme/after.md)):

> Shrinkray resizes and compresses a folder of images from the command line. On a 2021 MacBook Air it turns 1,000 phone photos (4.1 GB) into 1200px-wide JPEGs (310 MB) in about 40 seconds.

```console
$ npx @kcgdz/sloplint examples/readme/before.md
examples/readme/before.md  slop score 100/100 Pure slop
  ...
  5:1     warning  "In today's fast-paced world"  opener/fast-paced-world
                   A stock opener that delays the point and could precede any text about anything.
                   fix: Delete it and open with the concrete problem or the news.
  ...
  43:1    warning  "In conclusion"  closer/in-conclusion
                   An essay-template closer that announces a summary of what the reader just read.
                   fix: End on the last useful sentence, or a concrete next step.
  ...

54 findings (0 errors, 47 warnings, 7 info) in 1 file, 243 words.
Slop score: 100/100 (Pure slop)

$ npx @kcgdz/sloplint examples/readme/after.md
examples/readme/after.md  slop score 0/100 Human
  no findings

No slop found in 1 file (211 words).
Slop score: 0/100 (Human)
```

## Install in 30 seconds

Lint a file, no install needed (Node 22+):

```bash
npx @kcgdz/sloplint README.md
```

Use the [CLI in your project](#integrate-into-your-project) to check existing files, or [install the Claude Code skill](#install-as-a-claude-code-skill) to guide Claude while it writes. They work independently; installing the skill does not install the npm package.

## Integrate into your project

Requires Node.js 22 or newer. Run this in the project that contains your docs:

```bash
npm install --save-dev @kcgdz/sloplint
```

Add a script to your existing `package.json` (keep your other scripts):

```json
{
  "scripts": {
    "lint:prose": "sloplint README.md docs/ --max-score 30 --fail-on warning"
  }
}
```

Replace `README.md docs/` with files or folders that exist in your project. Then run:

```bash
npm run lint:prose
```

The command reports matching phrases, their locations and rewrite advice. With these flags it exits with code 1 if a file scores above 30 or has a warning or error; `info` findings alone do not fail the severity check. Adjust the limits in [Configuration](#configuration), and commit `package.json` and your lockfile so collaborators use the same version.

For pull request checks, use the [GitHub Actions example](#in-ci). To call the engine from your own application, use the [JavaScript API](#programmatic-use).

## Install as a Claude Code skill

The skill gives Claude writing guidance and examples. The CLI checks the resulting text with deterministic rules. Use either on its own, or both together.

### Option 1: Install the plugin

Start Claude Code in your project. Run these commands **inside Claude Code**, not in your terminal:

```text
/plugin marketplace add kcgdz/sloplint
/plugin install sloplint@sloplint
```

In the plugin panel, choose a scope: user for all your projects, project for a shared repository setup, or local for just you in the current repository. Finish the installation and check that sloplint appears in `/plugin`. See the [Claude Code plugin installation guide](https://code.claude.com/docs/en/discover-plugins).

Ask Claude to use the skill, for example:

```text
Use the sloplint skill to rewrite README.md. Keep the facts and examples,
remove stock phrases, then check the result with the sloplint CLI.
```

### Option 2: Copy the skill into your project

Copy the **whole** `skills/sloplint` directory, including `references/`, into `.claude/skills/sloplint` in your project. The resulting structure should be:

```text
your-project/
  .claude/
    skills/
      sloplint/
        SKILL.md
        references/
```

For macOS, Linux or Git Bash, run these commands from your project root. Use a fresh checkout directory if `sloplint-source` already exists:

```bash
git clone --depth 1 https://github.com/kcgdz/sloplint sloplint-source
mkdir -p .claude/skills
cp -R sloplint-source/skills/sloplint .claude/skills/
```

For Windows PowerShell:

```powershell
git clone --depth 1 https://github.com/kcgdz/sloplint sloplint-source
New-Item -ItemType Directory -Force .claude/skills | Out-Null
Copy-Item -Recurse sloplint-source/skills/sloplint .claude/skills/
```

Keep the checkout outside version control, or remove it after copying; only `.claude/skills/sloplint/` belongs in your project commit. For a personal installation across all projects, use `~/.claude/skills/sloplint/` instead (`$HOME/.claude/skills/sloplint/` in PowerShell). Choose the plugin or the copied skill to avoid duplicate installations. See [Claude Code skill locations](https://code.claude.com/docs/en/skills#choose-where-skills-load).

Open Claude Code in the target project and run `/sloplint` for a copied skill. Claude can also load it when the writing task matches its description. For plugin installs, use `/plugin` to inspect the installed skill's command name. Ask it to review a README or draft, keep the facts, and explain the changes.

### Enable the CLI check

The writing guidance works without Node.js. To run the automated check too, install the CLI as shown above or let Claude run this with Node.js 22+ and network access on the first download:

```bash
npx --yes @kcgdz/sloplint README.md
```

Without Node.js or access to the CLI, Claude can still review the draft using the skill's bundled references, but cannot produce a verified CLI score. Skill instructions depend on Claude following them; they are not a mandatory pre-commit check. Use CI when you need an enforced check.

## What it checks

English, Turkish, Spanish, French, German, Portuguese, Italian, Dutch, Russian and Arabic phrases are checked together, including mixed-language documents; no language flag is needed. Each additional language starts with six phrase rules for stock openings, empty hype, emphasis fillers, template endings, engagement bait and assistant leftovers. These findings include explanations and rewrite advice in the phrase's language. English has broader coverage; the additional languages have initial phrase catalogs, not grammar checkers. Score labels and general CLI messages remain in English.

| Language | Example phrase | Rule prefix |
| --- | --- | --- |
| Turkish | Günümüzün dijital çağında | `tr-` |
| Spanish | En la era digital actual | `es-` |
| French | À l'ère numérique actuelle | `fr-` |
| German | In der heutigen schnelllebigen Welt | `de-` |
| Portuguese | No mundo acelerado de hoje | `pt-` |
| Italian | Nel mondo frenetico di oggi | `it-` |
| Dutch | In het huidige digitale tijdperk | `nl-` |
| Russian | В современном быстро меняющемся мире | `ru-` |
| Arabic | في عالم اليوم سريع التغير | `ar-` |

Configure these rules by their full IDs, for example `hedge/es-worth-noting` or `opener/tr-stock-opening`, using the same rule settings as English rules. Accents are significant; apostrophes may be straight or curly. Arabic patterns currently match unvocalized Modern Standard Arabic; dialects, vowel marks and spelling variants are not normalized. Reported columns use UTF-16 source order, including in right-to-left text.

<!-- rules:count -->93<!-- /rules:count --> deterministic rules in seven categories: openers, vocabulary, structure, formatting, hedging, closers and leftovers. Each finding has a rule ID, the exact position, the flagged text, the reason it reads as slop, and a suggested fix. Every rule ships with examples it must flag and examples it must leave alone, and both sets run as tests.

sloplint does not call a model and does not need a network connection. It skips code blocks, inline code, blockquotes, URLs, link targets, HTML and frontmatter, so quoting slop to talk about it is fine.

<!-- rules:start -->
<!-- sloplint-disable -->

| Rule | Default | Catches |
| --- | --- | --- |
| `opener/fast-paced-world` | warning | "In today's fast-paced world" |
| `opener/ever-evolving-landscape` | warning | "The ever-evolving landscape" |
| `opener/imagine-a-world` | warning | "Imagine a world where…" |
| `opener/lets-dive-in` | warning | "Let's dive in" |
| `opener/rhetorical-hook` | warning | "Have you ever wondered…?" |
| `opener/chatbot-preamble` | error | "Certainly! Here's…" |
| `opener/hope-finds-you-well` | warning | "I hope this email finds you well" |
| `opener/tr-stock-opening` | warning | Konudan önce gelen genel giriş |
| `opener/it-stock-opening` | warning | nel mondo frenetico di oggi |
| `opener/nl-stock-opening` | warning | in de snel veranderende wereld van vandaag |
| `opener/ru-stock-opening` | warning | в современном быстро меняющемся мире |
| `opener/ar-stock-opening` | warning | في عالم اليوم سريع التغير |
| `opener/es-stock-opening` | warning | en el vertiginoso mundo actual |
| `opener/fr-stock-opening` | warning | dans le monde en constante évolution d'aujourd'hui |
| `opener/de-stock-opening` | warning | in der heutigen schnelllebigen Welt |
| `opener/pt-stock-opening` | warning | no mundo acelerado de hoje |
| `vocab/delve` | warning | "Delve" |
| `vocab/tapestry` | warning | Ornamental metaphors ("tapestry", "testament") |
| `vocab/hype-adjectives` | warning | Hype adjectives ("seamless", "cutting-edge") |
| `vocab/game-changer` | warning | "Game-changer", "next-level" |
| `vocab/empty-verbs` | warning | Empty verbs ("unlock", "elevate", "empower") |
| `vocab/leverage-utilize` | warning | "Leverage", "utilize", "facilitate" |
| `vocab/journey` | info | "Journey", "embark on" |
| `vocab/gravitas` | info | Gravitas words ("pivotal", "crucial", "meticulous") |
| `vocab/intensifiers` | info | Stacked intensifiers ("truly", "incredibly") |
| `vocab/corporate-speak` | warning | Corporate jargon ("synergy", "actionable insights") |
| `vocab/tr-empty-hype` | warning | Somut bilgi vermeyen pazarlama kalıbı |
| `vocab/it-empty-hype` | warning | sblocca tutto il tuo potenziale |
| `vocab/nl-empty-hype` | warning | ontgrendel je volledige potentieel |
| `vocab/ru-empty-hype` | warning | раскройте весь свой потенциал |
| `vocab/ar-empty-hype` | warning | أطلق العنان لإمكاناتك |
| `vocab/es-empty-hype` | warning | desbloquea todo tu potencial |
| `vocab/fr-empty-hype` | warning | libérez tout votre potentiel |
| `vocab/de-empty-hype` | warning | entfesseln Sie Ihr volles Potenzial |
| `vocab/pt-empty-hype` | warning | desbloqueie todo o seu potencial |
| `structure/not-just-x` | warning | "It's not just X, it's Y" |
| `structure/rule-of-three` | info | Everything in threes |
| `structure/colon-reveal` | warning | "The result? …" |
| `structure/heres-why` | warning | "Here's why:" |
| `structure/whether-youre` | warning | "Whether you're a beginner or an expert" |
| `structure/one-line-paragraphs` | warning | Run of one-sentence paragraphs |
| `structure/question-endings` | warning | Paragraphs ending in questions |
| `structure/bold-label-bullets` | info | "**Label:** description" bullets |
| `format/em-dash-density` | info | Em-dash overuse |
| `format/emoji-headings` | warning | Emoji in headings |
| `format/emoji-bullets` | warning | Emoji as bullet points |
| `format/excessive-bold` | warning | Too much bold |
| `format/exclamation-overuse` | warning | Exclamation marks |
| `format/hashtag-stuffing` | warning | Hashtag stuffing |
| `hedge/stacked` | warning | Stacked hedges ("may potentially") |
| `hedge/worth-noting` | warning | "It's worth noting that" |
| `hedge/qualifier-density` | info | Qualifier pile-up |
| `hedge/tr-worth-noting` | warning | Bilgiyi geciktiren vurgu kalıbı |
| `hedge/it-worth-noting` | warning | è importante sottolineare che |
| `hedge/nl-worth-noting` | warning | het is belangrijk om op te merken dat |
| `hedge/ru-worth-noting` | warning | важно отметить, что |
| `hedge/ar-worth-noting` | warning | من الجدير بالذكر أن |
| `hedge/es-worth-noting` | warning | cabe destacar que |
| `hedge/fr-worth-noting` | warning | il est important de noter que |
| `hedge/de-worth-noting` | warning | es ist wichtig zu beachten, dass |
| `hedge/pt-worth-noting` | warning | é importante ressaltar que |
| `closer/in-conclusion` | warning | "In conclusion" |
| `closer/engagement-bait` | warning | "What do you think? Let me know in the comments" |
| `closer/hope-this-helps` | warning | "Hope this helps! Feel free to reach out" |
| `closer/future-is-bright` | warning | "The future is bright" |
| `closer/tr-template-ending` | warning | İçeriğe katkı yapmayan kapanış |
| `closer/tr-engagement-bait` | warning | Genel etkileşim çağrısı |
| `closer/it-template-ending` | warning | spero che queste informazioni ti siano state utili |
| `closer/it-engagement-bait` | warning | condividi i tuoi pensieri nei commenti |
| `closer/nl-template-ending` | warning | ik hoop dat deze informatie nuttig voor je was |
| `closer/nl-engagement-bait` | warning | deel je gedachten in de reacties |
| `closer/ru-template-ending` | warning | надеюсь, эта информация была вам полезна |
| `closer/ru-engagement-bait` | warning | поделитесь своими мыслями в комментариях |
| `closer/ar-template-ending` | warning | آمل أن تكون هذه المعلومات مفيدة لك |
| `closer/ar-engagement-bait` | warning | شاركنا أفكارك في التعليقات |
| `closer/es-template-ending` | warning | espero que esta información te haya sido útil |
| `closer/es-engagement-bait` | warning | comparte tus pensamientos en los comentarios |
| `closer/fr-template-ending` | warning | j'espère que ces informations vous seront utiles |
| `closer/fr-engagement-bait` | warning | partagez vos réflexions dans les commentaires |
| `closer/de-template-ending` | warning | ich hoffe, diese Informationen waren hilfreich |
| `closer/de-engagement-bait` | warning | teilen Sie Ihre Gedanken in den Kommentaren |
| `closer/pt-template-ending` | warning | espero que estas informações tenham sido úteis |
| `closer/pt-engagement-bait` | warning | compartilhe seus pensamentos nos comentários |
| `filler/ai-self-reference` | error | Leftover assistant text and placeholders |
| `filler/tr-assistant-preamble` | error | Metinde kalmış asistan açıklaması |
| `filler/it-assistant-preamble` | error | come modello linguistico di intelligenza artificiale |
| `filler/nl-assistant-preamble` | error | als AI-taalmodel kan ik |
| `filler/ru-assistant-preamble` | error | как языковая модель искусственного интеллекта |
| `filler/ar-assistant-preamble` | error | بصفتي نموذج لغة للذكاء الاصطناعي |
| `filler/es-assistant-preamble` | error | como modelo de lenguaje de inteligencia artificial |
| `filler/fr-assistant-preamble` | error | en tant que modèle de langage d'intelligence artificielle |
| `filler/de-assistant-preamble` | error | als KI-Sprachmodell |
| `filler/pt-assistant-preamble` | error | como modelo de linguagem de inteligência artificial |

<!-- sloplint-enable -->
<!-- rules:end -->

Rules marked `info` are density checks: they fire only when a pattern is frequent, since one em-dash or one triplet is ordinary writing. The full catalog with examples is in [patterns.md](skills/sloplint/references/patterns.md).

## Usage

```bash
sloplint README.md docs/              # files and directories (.md, .mdx, .markdown, .txt)
sloplint "content/**/*.md"            # globs
git log -1 --format=%B | sloplint     # stdin
sloplint README.md --json             # machine-readable output
sloplint README.md --format github    # GitHub Actions annotations
sloplint README.md --badge            # print a shields.io badge for the score
sloplint --list-rules
```

| Option | Effect |
| --- | --- |
| `-f, --format <name>` | `stylish` (default), `json` or `github` |
| `-c, --config <path>` | Use this config file; `--no-config` ignores config files |
| `--rule <id=level>` | Override a rule for this run, e.g. `--rule vocab/delve=off` |
| `--max-score <n>` | Exit 1 if any file scores above `n` |
| `--fail-on <level>` | Exit 1 on findings at this level or above. Default `error` |
| `--skip-quoted` | Don't lint text inside double quotes |
| `-q, --quiet` | Hide `info` findings (they still count toward the score) |

Exit codes: `0` passed, `1` over a threshold, `2` usage or config error.

### In CI

After adding the dev dependency and `lint:prose` script above, save this as `.github/workflows/prose.yml`. Commit your npm lockfile; `npm ci` installs its recorded versions.

```yaml
# .github/workflows/prose.yml
name: prose
on: [pull_request]
jobs:
  sloplint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint:prose -- --format github
```

Findings show up as annotations on the pull request diff.

## Configuration

sloplint looks for `.sloplintrc` or `.sloplintrc.json` in the current directory and its parents, or a `sloplint` key in `package.json`.

```json
{
  "rules": {
    "format/em-dash-density": "off",
    "vocab/hype-adjectives": ["warning", { "allow": ["robust"] }],
    "vocab/gravitas": ["info", { "minCount": 5, "per100Words": 2 }],
    "closer/*": "error"
  },
  "ignore": ["CHANGELOG.md", "vendor/**"],
  "maxScore": 30,
  "failOn": "warning"
}
```

A rule setting is `"off"`, `"info"`, `"warning"`, `"error"`, or a pair of level and options. Keys can be a rule ID, `category/*`, or a bare category. Phrase rules accept `allow`; density rules accept `minCount` and `per100Words`.

### Ignoring a line

Directives work in any comment syntax, so they also fit commit message templates and code comments.

```markdown
<!-- sloplint-disable-next-line vocab/journey -->
Journey is the name of our onboarding app.

<!-- sloplint-disable format/em-dash-density -- a quoted transcript -->
...
<!-- sloplint-enable -->

<!-- sloplint-disable-file -->
```

IDs can be rule IDs or categories. With no IDs, a directive applies to every rule. Text after ` -- ` is a note for humans.

## Slop score

Every file gets a score from 0 (clean) to 100. Findings add points by severity (error 5, warning 3, info 1), the total is divided by the word count, and the density is mapped onto a curve:

```text
density = points / max(words, 50) × 100
score   = round(100 × (1 − e^(−density / 10)))
```

Length is normalized, so a long document isn't punished for being long and a one-line commit message isn't maxed out by a single phrase. The bands:

| Score | Label |
| --- | --- |
| 0 to 14 | Human |
| 15 to 39 | Light seasoning |
| 40 to 69 | Sloppy |
| 70 to 100 | Pure slop |

`sloplint --badge` prints a badge you can paste into your README, like the one at the top of this file.

## Examples

Five generated texts and their rewrites live in [`examples/`](examples). CI checks that every "before" scores at least 70 and every "after" scores under 15 with no warnings.

| Text | Before | After |
| --- | --- | --- |
| [README](examples/readme) | 100 | 0 |
| [Landing page](examples/landing-page) | 99 | 0 |
| [LinkedIn post](examples/linkedin-post) | 97 | 0 |
| [Tweet thread](examples/tweet-thread) | 99 | 0 |
| [Cold email](examples/cold-email) | 99 | 0 |

## Programmatic use

For a Node.js application that calls sloplint at runtime, install it as a regular dependency:

```bash
npm install @kcgdz/sloplint
```

In an ES module (`.mjs`, or a project with `"type": "module"`):

```ts
import { lint } from '@kcgdz/sloplint';

const text = 'Your draft goes here.';
const { score, label, findings } = lint(text, {
  rules: { 'vocab/delve': 'error' },
});

console.log({ score, label, findings });
```

The API returns findings; it does not rewrite your text. Pass rule overrides directly to `lint()`; the core does not automatically read `.sloplintrc` files. The core has no Node dependencies and runs in the browser through a bundler; the [playground](https://kcgdz.github.io/sloplint/) uses the same engine.

## Contributing

New patterns are the most useful contribution. If you keep seeing a phrase in generated text, [open a pattern proposal](https://github.com/kcgdz/sloplint/issues/new?template=new-slop-pattern.yml) with a few real examples and a few look-alikes that should not be flagged. False-positive reports matter just as much: a linter people turn off helps nobody.

[CONTRIBUTING.md](CONTRIBUTING.md) walks through adding a rule, from the metadata to the tests.

## License

MIT
