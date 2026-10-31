# Blog posts and long-form articles

Long-form slop is harder to spot sentence by sentence and easier to spot overall. Every paragraph is grammatical, but the post never commits to a claim, the sections all have the same rhythm, and the ending summarises what you just read. Readers leave around the second paragraph that tells them nothing new.

## What a reader of a post wants

- A claim or a finding they can repeat to someone else.
- Evidence that you did the thing: code, data, screenshots, mistakes.
- Your judgement. A post that weighs both sides and picks neither is a search result, not an article.
- The ability to skim: headings that name the content of each section.

## Patterns that make a post read as generated

- Scene-setting intros: `In today's ever-evolving landscape of software development` (`opener/fast-paced-world`, `opener/ever-evolving-landscape`).
- Announcement sentences: `Let's dive in`, `Without further ado`, `In this article, we will explore` (`opener/lets-dive-in`).
- Ornamental metaphors: `a rich tapestry of tools`, `a testament to`, `navigating the complexities` (`vocab/tapestry`).
- Weight words in every paragraph: `crucial`, `pivotal`, `paramount`, `meticulous`, `comprehensive` (`vocab/gravitas`).
- Qualifiers on every claim: `generally`, `arguably`, `to some extent`, `in many cases` (`hedge/qualifier-density`).
- Lead-ins: `It's important to note that`, `It's worth mentioning that` (`hedge/worth-noting`).
- Lists of three, again and again (`structure/rule-of-three`), and dash-heavy sentences (`format/em-dash-density`).
- A conclusion section that begins `In conclusion` or `Ultimately,` and repeats the headings (`closer/in-conclusion`).
- An upbeat ending with no content: `The future is bright`, `The possibilities are endless` (`closer/future-is-bright`).

## Instead, do this

- State your conclusion in the first paragraph. People who only read that paragraph should still leave with it.
- Use headings that carry information: "Connection pooling halved our p99" beats "Performance Considerations".
- Show the evidence where you make the claim. A code block or a chart next to the sentence is worth more than a paragraph of description.
- Include what didn't work. Failed approaches are the part readers can't get from documentation.
- Commit. If the answer depends on something, say what it depends on and pick a side for the common case.
- Vary sentence and paragraph length on purpose. Uniform rhythm is a strong signal of generated text.
- End with the next step, an open question you are actually working on, or the last useful fact. Don't summarise.

## Editing pass

After the draft, cut the first paragraph and see if the post still works. It usually does, because first paragraphs tend to be warm-up. Then search the draft for `crucial`, `important`, `key`, and `essential`, and delete each one that isn't load-bearing.

## Before and after

Before:

```text
In today's fast-paced world of web development, performance is more
crucial than ever. In this article, we'll delve into the intricate
landscape of database optimization and explore some key strategies.
Let's dive in!

It's worth noting that indexing is a pivotal part of any comprehensive
optimization strategy. Generally speaking, indexes can potentially
improve query speed in many cases.

In conclusion, by leveraging these strategies, you can unlock the full
potential of your database. The possibilities are endless!
```

After:

```text
Our orders page took 4.2 seconds to load. One composite index brought it
to 180 ms, and finding which index took longer than adding it.

The slow query filtered by customer_id and sorted by created_at. We had
an index on each column separately, and Postgres picked the one on
created_at, scanning 2 million rows. EXPLAIN ANALYZE showed it in the
first line of output.

    CREATE INDEX CONCURRENTLY orders_customer_created
      ON orders (customer_id, created_at DESC);

The next problem is the same pattern on invoices, which has three times
the rows.
```
