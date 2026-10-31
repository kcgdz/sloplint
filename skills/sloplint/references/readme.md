# READMEs and documentation

A README has one job per reader. A visitor wants to know in ten seconds whether the project solves their problem. A new user wants to get it running. A returning user wants a flag or an option they half remember. Slop fails all of them because it spends the top of the page on mood instead of facts.

## What readers need, in order

1. One sentence that says what the project does and for whom. Put the noun first: "A CLI that lints Markdown for broken links", not `Elevate your docs`.
2. Proof that it works: a short code sample, a screenshot, or real output.
3. Install and first run, copy-pasteable, with the minimum supported version.
4. Usage and configuration reference.
5. Limits, known issues, and how to get help.
6. License and how to contribute.

Everything that isn't one of these is a candidate for deletion.

## Patterns that show up in generated READMEs

- A title followed by a tagline such as `Unlock the full potential of your workflow` (`vocab/empty-verbs`). Replace it with the one-sentence description.
- An emoji on every heading: `## 🚀 Features`, `## 📦 Installation`, `## 🤝 Contributing` (`format/emoji-headings`). Headings are navigation. Keep them plain.
- A features list where every bullet opens with a bold label and a colon, often four to eight in a row (`structure/bold-label-bullets`). Write plain bullets, or a table with real columns.
- Feature bullets made of adjectives: `Seamless integration`, `Robust error handling`, `Blazing-fast performance` (`vocab/hype-adjectives`). Each one should state a capability or a measurement instead.
- `Why choose X?` sections that answer with `It's not just a library, it's a complete solution` (`structure/not-just-x`).
- A `Conclusion` section, or a closing line like `Happy coding!` (`closer/in-conclusion`, `closer/hope-this-helps`).
- `Leverage the power of TypeScript to...` (`vocab/leverage-utilize`). Say which TypeScript feature and what it buys.
- Placeholders left in: `[Your Name]`, `[project-name]`, `your-username/repo` in the clone URL (`filler/ai-self-reference`).

## Instead, do this

- Write the description sentence last, after you know what the project really does, then move it to the top.
- Show the command and its output before explaining options. A reader believes output more than adjectives.
- Give numbers where you would have written an adjective: startup time, bundle size, supported versions, how many rules or formats.
- Put requirements next to the install command, not in a separate section further down.
- Prefer a table for options: flag, default, what it does.
- Link to deeper docs instead of growing the README past what fits on two screens.
- Keep the contributing section short and point to `CONTRIBUTING.md`.
- When a feature has a caveat, state it in the same bullet. Hidden caveats become issues.

## Headings that work

`Install`, `Usage`, `Configuration`, `Options`, `Examples`, `FAQ`, `Limitations`, `Contributing`, `License`. Readers know these words and jump to them. Creative headings slow them down.

## Before and after

Before:

```markdown
# 🚀 FastCache

Unlock blazing-fast performance with FastCache, the next-generation caching
solution that seamlessly integrates into your workflow!

## ✨ Features

- **Lightning Fast:** Experience unparalleled speed.
- **Robust:** Built for reliability.
- **Easy to Use:** Get started in seconds.
- **Flexible:** Adapts to your needs.

In conclusion, FastCache is more than just a cache, it's a game-changer.
Happy coding! 🎉
```

After:

```markdown
# FastCache

An in-process LRU cache for Node.js with TTLs and size limits. Reads take
about 80 ns on a 2021 laptop; there are no dependencies.

## Install

    npm install fastcache    # Node 20+

## Usage

    import { Cache } from 'fastcache';
    const cache = new Cache({ maxEntries: 10_000, ttl: '5m' });
    cache.set('user:42', user);

## Limits

Entries live in one process. For a cache shared between servers, use Redis.
```

The second version is shorter and answers the three questions a visitor brings: what is it, does it fit my stack, how do I start.
