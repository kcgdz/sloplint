# Contributing to sloplint

Thanks for helping. The most valuable contributions are new patterns and reports of false positives, and both start with an issue:

- [Propose a new pattern](https://github.com/kcgdz/sloplint/issues/new?template=new-slop-pattern.yml)
- [Report a false positive](https://github.com/kcgdz/sloplint/issues/new?template=false-positive.yml)

You don't need to write code to propose a pattern. A good proposal with real examples is often turned into a rule by someone else.

## Ground rules for rules

sloplint is only useful if people leave it on. A rule that flags ordinary writing gets disabled, and then it catches nothing. So when in doubt, we choose precision over coverage.

- A phrase belongs in a rule when it is much more common in generated text than in careful human writing, and when removing it improves the sentence. Being a cliché is not enough on its own.
- Every rule needs look-alikes that must not be flagged. If you can't think of any, ask a friend to try.
- Words with a legitimate technical meaning get exclusions: `elevated privileges`, `robust regression`, `test harness`, `leverage ratio`, `customer journey`.
- If a pattern is only a problem when it repeats (dashes, triplets, intensifiers), make it a density rule at `info` level.

Default severities:

| Level | Use for |
| --- | --- |
| `error` | Text nobody should publish: assistant disclaimers, unfilled placeholders, chat preambles |
| `warning` | A specific phrase or shape that almost always reads as slop |
| `info` | Patterns that are fine in moderation and only fire above a density threshold |

## Setup

You need Node 22 or later.

```bash
git clone https://github.com/kcgdz/sloplint
cd sloplint
npm install
npm test
```

Other scripts:

```bash
npm run build          # bundle dist/ with tsup
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm run format         # prettier --write
npm run gen-docs       # rebuild, then regenerate the README rule table and patterns.md
npm run dogfood        # lint our own docs with sloplint
npm run build:playground
```

## Adding a rule

Rules live in `src/core/rules/`, one file per category. The core must stay free of Node APIs because the playground runs it in the browser.

### 1. Pick a helper

Most rules are a list of patterns. Use `phraseRule` for patterns that are wrong every time, and `densityRule` for patterns that are only wrong in bulk:

```ts
phraseRule({
  id: 'vocab/delve',
  category: 'vocab',
  severity: 'warning',
  title: '"Delve"',
  why: 'Rare in human writing, extremely common in model output. Readers now treat it as a tell.',
  suggestion: 'Use "look at", "cover", "explain", or just start explaining.',
  patterns: [/\bdelv(?:e|es|ed|ing)\b/iu],
  examples: {
    bad: ["Let's delve into the details.", 'This guide delves into caching.'],
    good: ['The developer dug into the logs.', 'Delaware is a state.', 'We covered caching in depth.'],
  },
}),
```

Patterns can be plain strings or regular expressions. In a string, spaces match any whitespace including one line break, `'` matches both straight and curly apostrophes, and hyphens are optional. Strings match whole words only. Regular expressions are used as written, so add `\b` and the `i` and `u` flags yourself.

A regex can narrow the flagged range with a named group: in `/\b(?<hit>leverage)\s+the\b/iu` only "leverage" is highlighted. Add `replacements` when the fix is a single word swap.

For anything structural (paragraph runs, list shapes, headings), use `customRule` and write a `check(doc, options)` function. `doc.text` is the masked text, `doc.blocks` holds headings, paragraphs, list items and tables, and `sentencesOf(block)` splits a block into sentences. Return `{ start, end }` offsets into `doc.text`. See `structure.ts` for examples.

### 2. Write examples

The `examples` field is documentation and a test at the same time. `test/rules.examples.test.ts` checks that each `bad` string triggers the rule and each `good` string does not, with every other rule turned off. Rules need at least two bad and three good examples. The good ones should be hard: same words, different meaning.

### 3. Add edge-case tests

If the rule has thresholds or exclusions, add cases to `test/rules/heuristics.test.ts`. If you fixed a false positive, add the text that triggered it to `test/false-positives.test.ts` so it stays fixed.

### 4. Regenerate the docs

```bash
npm run gen-docs
```

This updates the rule table in `README.md` and the checklist in `skills/sloplint/references/patterns.md`. CI fails if you forget.

### 5. Check the examples

`test/examples.test.ts` makes sure every rewritten example in `examples/` still scores under 15. If your rule flags one of them, either the rule is too broad or the example needs a better rewrite. Say which in the pull request.

## Changing the skill

The skill in `skills/sloplint/` is prose, so it must pass its own linter. `npm run dogfood` runs sloplint over the README, this file and the skill with `--fail-on warning --max-score 15`. To show a slop phrase as an example, put it in inline code or a blockquote; sloplint skips both.

Keep `SKILL.md` short. It stays in the model's context for the whole task, so every line costs tokens on every turn. Detail goes in the type-specific guides under `references/`.

## Pull requests

- One rule or one fix per pull request is easiest to review.
- Run `npm test`, `npm run lint` and `npm run gen-docs` before pushing.
- Describe where you saw the pattern. Links to real examples help.
- Commit messages follow the advice in [`commit.md`](skills/sloplint/references/commit.md).

## Code of conduct

Be kind and assume good faith. Critique writing, not writers.
