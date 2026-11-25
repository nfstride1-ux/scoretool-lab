# Project rules

ScoreTool is a phone-first archery scoring app. It is a progressive web app: it runs in the browser, works on a phone, and keeps scores on that phone.

The Lingkana League 660 round is the working prototype and the template for later club leagues. A Lancaster 660 is 20 ends of 3 arrows at 18 m on a triangular 40 cm 3-spot. X scores 11. The maximum is 660. The league ranks the best 4 of 6 nights.

## Must not break

These already work. A change that breaks one of them is not finished.

- Casual scoring
- League scoring
- Lingkana registration
- Lingkana PIN login
- Lingkana groups
- Lingkana live leaderboard
- Lingkana paid ticks
- Lingkana pot page
- League Ladder
- Scorecard sharing
- The calendar score bridge in `calsync.js`

## Hard rules

- No passcodes or other secrets in the code, in a pull request, or in chat. The Lingkana check stores a salted verifier. It does not store the passcode.
- Never reset or regenerate an existing Lingkana PIN.
- No personal scoresheets and no sight marks in public files. That includes `data/sheets_*.json` and `sightseed_` files.
- The owner's gmail address from the 25 Nov audit stays out of public files. The privacy scan looks for it.
- Onion Shed stays removed. The coach screens stay hidden (`COACH_ON` stays false).
- League scoring stays free for league archers.
- Stripe tiers stay off until Nathe says to turn them on.
- Keep pull requests small. Checks stay green.
- **Who can ship.** Jarvis is the lead and the default builder. Claude, OpenAI, and Grok Bot may also ship code. Every change goes through a pull request that passes `safety-smoke` and `privacy-scan`, and the person who did the work adds a signed entry to [HANDOFF.md](HANDOFF.md) using `[Jarvis]`, `[Claude]`, `[OpenAI]`, or `[Grok Bot]`. Nothing goes live without Nathe's own OK. Do not merge a pull request unless Nathe has approved that merge.

## File map

| File | What it is |
|---|---|
| `app.js` | Phone shell, Just me scoring, and the round maths (X value, end total, round total) |
| `casual.js` | A one-off casual shoot with friends. It is not a league |
| `league.js` | League weeks, groups, and the scoring card |
| `squads.js` | Squads |
| `scorecards.js` | Saved scorecards and sharing |
| `calsync.js` | Bridge that can send a finished score to the archer's Archery Calendar |
| `h2h.js` | Head-to-head matches |
| `shootup.js` | Shoot-up ladder |
| `lingkana.js` | Lingkana data: registration, PIN, passcode check, results, pot, ladder |
| `lkflow.js` | Lingkana screens: home, login, groups, live scoring |
| `lk-register.html` | Short link that opens Lingkana registration |

## Checks on every pull request and on main

GitHub Actions runs two required checks. They use the Python Playwright already used by `tools/guard.py` and `qa/run_regression.py`.

- `safety-smoke` (`tools/safety_smoke_test.py`): headless Chrome at phone size. The app loads with no page errors. A casual Lancaster round can enter one end and show the end score. X is 11 and a full card is 660. A Vegas X stays 10. `#lk-home`, `#lk-register`, and `#lk-results` load. The leaderboard and the League Ladder render. A wrong passcode is rejected.
- `privacy-scan` (`tools/privacy_scan.py`): public files have no plaintext passcode constant, no `data/sheets_*.json`, no `sightseed_` file, and no listed email address. The scan prints paths only.

Run them locally:

```bash
python3 tools/safety_smoke_test.py
python3 tools/privacy_scan.py
```

`python3 qa/run_regression.py` is still the full local check before a real deploy. It is too long for the pull-request gate. The gate is the smoke above, aimed at under 3 minutes once the browser is cached. A cold runner spends extra time installing Chrome the first time.

Pull request 72 is already on main. The privacy scan is strict and has no allow-list. It passes on this main. If a scoresheet, a sight-mark file, or a plaintext passcode constant comes back, the check fails.

## Preview

Each pull request publishes a copy to the existing `nfstride1-ux/scoretool-lab` GitHub Pages site, in `pr/<number>/`, and comments the URL on the pull request.

`https://nfstride1-ux.github.io/scoretool-lab/pr/<number>/`

The preview is not the live app. Personal scoresheets and sight-mark files are left out of the copy. The workflow uses the Actions secret `SCORETOOL_LAB_KEY`, a write deploy key for `scoretool-lab` only. The key is not stored in the repo. If the secret is missing, the check still passes and the comment lists the clicks that save the key.

## Require the checks on main

Do this after this safety pull request is merged, so the check names exist. Turning it on earlier leaves other open pull requests waiting for a check that never starts.

1. Open `https://github.com/nfstride1-ux/scoretool-demo/settings/rules`
2. New ruleset, then New branch ruleset.
3. Name it `Protect main`. Enforcement: Active.
4. Target branches: Include default branch (main).
5. Tick **Require a pull request before merging**.
6. Tick **Require status checks to pass**.
7. Add the checks `safety-smoke` and `privacy-scan`. Add `pr-preview` only after that check has gone green on a pull request.
8. Save.

If that screen is **Branches** instead of **Rules**:

1. Open `https://github.com/nfstride1-ux/scoretool-demo/settings/branches`
2. Add classic branch protection rule. Branch name pattern: `main`.
3. Tick **Require a pull request before merging**.
4. Tick **Require status checks to pass before merging**.
5. Search for `safety-smoke` and `privacy-scan` (they show up after they have run on main) and add them.
6. Save changes.

Nathe still merges when he wants a change live. These checks stop a red pull request from landing. They do not merge it.
