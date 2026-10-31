# Tweets, threads, and LinkedIn posts

Social feeds are where readers have become most sensitive to generated text, because they scroll past hundreds of posts built from the same template. The template has a recognisable shape: a hook question, a string of one-line paragraphs, a fake reveal, a lesson, and a request to comment. Avoid the shape, not only the words.

## What readers want from a post

- One idea, stated in the first line.
- Something they didn't know: a number, a result, a mistake, a link worth opening.
- Your actual experience. Specific details are what make a post feel written by a person.
- A reason to click if there is a link: what they will find there.

## Patterns that mark a post as generated

- Hook questions: `Have you ever wondered why most startups fail?` or `Tired of slow builds?` (`opener/rhetorical-hook`).
- Broetry: five or more one-sentence paragraphs in a row, each a dramatic beat (`structure/one-line-paragraphs`).
- Drumroll lines: `Here's why:`, `Here's the thing:`, `Here's where it gets interesting.` (`structure/heres-why`).
- Fake reveals: `The result? 3x more signups.` (`structure/colon-reveal`).
- Manufactured contrast: `It's not about the code. It's about the people.` (`structure/not-just-x`).
- Engagement bait at the end: `Thoughts?`, `Agree?`, `What would you add?`, `Repost if this helped`, `Follow me for more` (`closer/engagement-bait`).
- Emoji used as bullets and a wall of hashtags at the bottom (`format/emoji-bullets`, `format/hashtag-stuffing`).
- Paragraphs that each end on a question (`structure/question-endings`).
- `Journey`, `game-changer`, and `unlock` doing the emotional work that a fact should do.

## Instead, do this

- Put the claim or the result in the first line. "We cut our AWS bill from $41k to $12k a month" beats any hook.
- Write normal paragraphs. Two or three sentences together read faster than a column of fragments.
- Give the number and the context in the same sentence.
- If you ask a question, ask a specific one that only your audience can answer: "If you run Postgres on ARM, did you see the same checkpoint stalls?"
- Use zero to two hashtags, and only ones people actually follow.
- In a thread, make each post stand on its own. Number them only if the order matters.
- End when the content ends. A link or a next step is a fine last line.

## Threads

A thread is a list of findings, not a story with cliffhangers. The first post states the conclusion. Each later post adds one piece of evidence or one step. Avoid `1/ A thread 🧵` as the opener; say what the thread is about.

## Before and after

Before:

```text
I got rejected from 47 jobs.

It hurt.

But here's the thing:

Rejection is just data.

The result? I built my own company.

It's not about the destination. It's about the journey.

Agree? ♻️ Repost to help someone in your network.

#career #growth #mindset #startup #leadership
```

After:

```text
I applied to 47 backend jobs in 2023 and got two interviews. The pattern
in the rejections was clear once I tracked them: every role wanted
production Kubernetes experience, and I had none.

I spent three months running my side project on a small cluster, wrote
up what broke, and linked the write-up in my next applications. Four
interviews from the next twelve applications.

Write-up: (link)
```

The second version tells the reader what happened, why, and what they could copy. It has no hook, no reveal, and no request for engagement, and it is more likely to get engagement because it is useful.
