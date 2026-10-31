1/ Five Git commands I use every week that most people I pair with have never tried. Each one replaced a habit that was costing me time.

2/ git rebase -i

Before opening a PR I squash my "wip" and "fix typo" commits into two or three that each make sense alone. Reviewers read the history one commit at a time, and it shows.

3/ git worktree

Check out a second branch in a separate folder. I keep one for main so I can review a teammate's PR without stashing my half-done work.

4/ git bisect

Mark one good commit and one bad one, and Git binary-searches the rest. Last month it found the commit that broke our build out of 340 in nine steps.

5/ Aliases

Mine: `git lg` for a one-line graph log and `git undo` for `reset --soft HEAD~1`. Small, but I type them dozens of times a day.

6/ git reflog

Every position HEAD has been in for the last 90 days. If a rebase goes wrong or you delete a branch by mistake, the old commit is almost always in here.

7/ My aliases and a short explanation of each are in this gist. If you have a Git command that saved you real time, I'd like to hear which one.
