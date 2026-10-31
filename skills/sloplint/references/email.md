# Cold emails, outreach, and replies

Email readers decide from the preview pane, which shows the subject and roughly the first two lines. Generated emails spend those lines on pleasantries, so they are archived before the point appears. Write the email so the preview alone tells the reader who you are and what you want.

## What the recipient needs

- Why this email is for them specifically.
- What you want, stated as a request they can say yes or no to.
- How much effort saying yes costs them.
- Enough context to judge you: one concrete credential or result.

## Patterns to cut

- Template openers: `I hope this email finds you well`, `Hope you're doing well`, `I wanted to reach out`, `I'm reaching out because` (`opener/hope-finds-you-well`).
- Follow-up filler: `Just circling back`, `Just following up`, `Touching base` (`opener/hope-finds-you-well`).
- Flattery that could apply to anyone: `I've been really impressed by your incredible work`. If you admire something, name the exact thing.
- Product pitches written like landing pages: `our cutting-edge platform empowers teams to unlock actionable insights` (`vocab/hype-adjectives`, `vocab/empty-verbs`, `vocab/corporate-speak`).
- Stacked hedges that make the request hard to find: `I was wondering if you might potentially have time` (`hedge/stacked`).
- Sign-offs that add a paragraph: `Please don't hesitate to reach out if you have any questions`, `Looking forward to hearing from you!` (`closer/hope-this-helps`).
- Placeholders: `Hi [First Name]`, `[Company]`, `[Your Name]` (`filler/ai-self-reference`). One unfilled bracket ends the conversation.

## Instead, do this

- Subject line: the topic plus the ask, under eight words. "Intro call about your Postgres migration?" is better than "Quick question".
- First sentence: who you are and why them. "I run infra at Acme; we moved 3 TB from MySQL to Postgres last spring and you're about to do the same."
- Second sentence: the request, with a size. "Would a 20-minute call next week be useful? I can share our cutover runbook either way."
- Keep the whole email under 120 words. If it needs more, attach or link the detail.
- Make saying yes cheap: offer two time slots or a link, or offer the thing without a meeting.
- Sign off with your name. "Thanks," is enough.

## Follow-ups

A follow-up adds something new: a resource, a date, a simpler ask. Don't write `Just bumping this to the top of your inbox`. Write the useful new sentence instead, and keep the old thread quoted below.

## Replies

Answer the question in the first line, then give the reasoning. Don't restate their question, and don't open with `Great question!` (`opener/chatbot-preamble`).

## Before and after

Before:

```text
Subject: Quick question

Hi [First Name],

I hope this email finds you well! I wanted to reach out because I've been
incredibly impressed by everything your team is doing. At DataFlow, we
empower companies to unlock actionable insights through our cutting-edge,
AI-powered analytics platform.

I'd love to explore potential synergies. Would you be open to a quick call?

Please don't hesitate to reach out if you have any questions!

Best regards,
[Your Name]
```

After:

```text
Subject: Your churn dashboard in Looker

Hi Dana,

Your post about rebuilding the churn dashboard said refreshes take 40
minutes. DataFlow caches Looker queries on the warehouse side; Brightline
went from 35 minutes to under 2 after switching last quarter.

Would a 15-minute screen share be useful? Thursday or Friday afternoon
works, or I can send a recording instead.

Sam Ortiz
DataFlow
```
