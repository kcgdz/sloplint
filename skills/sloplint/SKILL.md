---
name: sloplint
description: Avoid AI-slop patterns whenever you draft or rewrite prose that people will read, including READMEs, docs, landing pages, tweets and threads, LinkedIn posts, commit messages, PR descriptions, changelogs, blog posts and emails. Use it for any user-facing text, even short text, and check the result with the sloplint CLI when a shell is available.
license: MIT
---

# Writing without slop

Readers now recognise the habits of unedited model output, and once they spot one they stop trusting the rest. These rules apply to every piece of prose you write for the rest of this task, not only the current paragraph.

## Standing rules

1. Open with the point. The first sentence says what the thing is or what you want from the reader. Never warm up with a scene-setter like `In today's fast-paced world`, `Imagine a world where`, `Have you ever wondered...?` or `Let's dive in`.
2. Prefer plain words. Write "use" for `utilize` and `leverage`, "help" for `facilitate`. Drop `delve`, `tapestry`, `testament to`, `realm of` and `journey` entirely.
3. Replace praise with facts. Instead of `seamless`, `robust`, `cutting-edge`, `blazing-fast`, `game-changer` or `next-level`, give a number or a comparison ("builds in 4 s on a 2020 laptop").
4. Use concrete verbs. Not `unlock`, `elevate`, `empower`, `supercharge` or `unleash`, but the action the reader takes: search, export, run in CI.
5. Say Y directly. Skip the fake contrast `It's not just X, it's Y` and the drumrolls `Here's why:` and `The result?`.
6. Vary list length. Two items or five items are fine. Don't default to three adjectives or three verbs in a row.
7. Hedge once, where it is true. Never stack hedges (`may potentially`), and delete lead-ins such as `It's worth noting that` and `It is important to note`.
8. Keep punctuation calm. A dash now and then is fine, but most of them should be periods or commas. One exclamation mark per piece at most.
9. Format for scanning, not decoration. No emoji in headings, no emoji as bullet markers, no bold on every other phrase, and no long runs of `**Label:** text` bullets.
10. Write paragraphs. Group related sentences instead of posting one sentence per paragraph, and don't end paragraphs on rhetorical questions.
11. Stop when you are done. No `In conclusion`, `Hope this helps`, `Feel free to reach out`, `The future is bright` or `What do you think? Let me know in the comments`.
12. Ship no leftovers. Delete assistant phrasing (`Certainly! Here's...`, `As an AI language model`) and fill or remove every placeholder like `[Your Name]` before you hand text over.

When the user's own draft breaks these rules, point out the specific phrases and rewrite them. Keep their facts and voice; change only the slop.

## Type-specific guides

Read the guide for the kind of text you are writing before you draft it. Load only the one you need.

| If you are writing | Read |
| --- | --- |
| A README or documentation page | [references/readme.md](references/readme.md) |
| A landing page or product copy | [references/marketing.md](references/marketing.md) |
| A post for X or LinkedIn, including threads | [references/social.md](references/social.md) |
| A cold email or a reply | [references/email.md](references/email.md) |
| A commit message or PR description (also changelogs) | [references/commit.md](references/commit.md) |
| A blog post or long-form article | [references/blog.md](references/blog.md) |
| Anything, as a final checklist | [references/patterns.md](references/patterns.md) |

`patterns.md` lists every rule the linter checks, with its ID and examples.

## Check your draft

If you have a shell, lint the file after writing it:

```bash
npx -y @kcgdz/sloplint path/to/file.md
```

For text that isn't in a file yet (a commit message or a post), pipe it in:

```bash
printf '%s\n' "$DRAFT" | npx -y @kcgdz/sloplint --stdin
```

Fix every `error` and `warning`. Treat `info` findings as prompts to reread the sentence; keep the wording when it is the right word. Aim for a slop score under 15. Rerun until it passes, then tell the user the final score.

If the CLI is unavailable (no network, no Node), walk through [references/patterns.md](references/patterns.md) against your draft instead.

## Intentional exceptions

Sometimes a flagged phrase belongs in the text, for example when you quote slop to discuss it or a product is literally named `Journey`. Put examples in inline code or a blockquote; the linter skips both, as well as code blocks. For anything else, silence one line on purpose:

```markdown
<!-- sloplint-disable-next-line vocab/journey -->
Journey is the name of our onboarding app.
```

Use the directive only for deliberate cases, never to make a score pass.
