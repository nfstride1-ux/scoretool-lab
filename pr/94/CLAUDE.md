# ScoreTool

Read [HANDOFF.md](HANDOFF.md) first, then [PROJECT_RULES.md](PROJECT_RULES.md).

Those two files are the rules. This file only points at them. Leave the app's behaviour as it is unless the task says to change it. Open a small pull request. Nathe approves go-live.

Jarvis is the lead and the default builder. Claude, OpenAI, and Grok Bot may also ship code, as long as the change goes through a pull request, the `safety-smoke` and `privacy-scan` checks are green, and a signed entry is added to HANDOFF.md (`[Jarvis]`, `[Claude]`, `[OpenAI]`, or `[Grok Bot]`). Nothing goes live without Nathe's own OK.
