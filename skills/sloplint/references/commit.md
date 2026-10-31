# Commit messages, PR descriptions, and changelogs

These texts are read later, under pressure, by someone running `git log`, `git blame`, or a release diff. They want to know what changed and why, fast. Generated versions describe the diff in grand terms and leave out the reason, which is the only part the diff can't show.

## Commit messages

### Format

```text
Short imperative subject, 50 characters or so

Body wrapped at 72 columns. Explain why the change was needed and what
the reader should know that the diff doesn't show: the bug, the trade-off,
the alternative you rejected.

Refs #123
```

- The subject is an imperative verb phrase: "Fix", "Add", "Remove", "Rename". It completes the sentence "If applied, this commit will...".
- If the project uses Conventional Commits, keep the prefix: `fix(parser): handle CRLF in front matter`.
- No period at the end of the subject.
- The body answers "why". The diff already answers "what".

### Patterns to avoid

- Narrating the commit: `This commit enhances the user experience by...`, `This PR introduces a robust solution`.
- Hype words: `seamless`, `robust`, `comprehensive`, `significantly improves` without a number (`vocab/hype-adjectives`, `vocab/gravitas`).
- `Leverage`, `utilize`, `facilitate` where "use" and "help" fit (`vocab/leverage-utilize`).
- Listing every file touched. Git already records that.
- Bullet lists of bold labels: `**Performance:** improved`, `**Reliability:** enhanced` (`structure/bold-label-bullets`).
- Emoji prefixes, unless the project has an agreed gitmoji convention.

## PR descriptions

A reviewer needs four things, roughly in this order:

1. What problem this solves, with a link to the issue.
2. The approach, and why it beats the obvious alternative if there is one.
3. How you tested it. Commands, cases, screenshots for UI.
4. What to look at closely, and what is out of scope.

Skip a `Summary` section that restates the title, and skip any closing like `Let me know if you have any questions!` (`closer/hope-this-helps`). Reviewers will ask in review comments.

## Changelogs

Changelog readers are deciding whether to upgrade. Write for them.

- Group by Added, Changed, Fixed, Removed, Deprecated, Security.
- Lead every breaking change with what the user must do.
- One line per change, phrased from the user's side: "`--json` output now includes `endColumn`", not "Refactored the formatter module".
- Link the PR or issue.
- No celebration. `We're thrilled to announce` and `This is just the beginning` (`closer/future-is-bright`) belong in a blog post, if anywhere.

## Before and after

Before:

```text
✨ Enhance caching mechanism for improved performance

This commit introduces a robust and comprehensive enhancement to the
caching layer, leveraging an LRU strategy to seamlessly optimize
performance across the application. It's worth noting that this is a
game-changing improvement.
```

After:

```text
Cap the template cache at 500 entries

The cache had no limit, and long-running workers grew to 3 GB after a
day because every tenant's templates stayed resident. An LRU with 500
entries keeps the hit rate at 97% in the staging replay and holds memory
under 200 MB.

Refs #812
```
