# Handoff

Read this file first, then [PROJECT_RULES.md](PROJECT_RULES.md).

Before you stop, add a signed entry in Australia/Perth time. Say who you are, what is done, what is half-done, what is next, and any decision. Sign with one tag: `[Claude]` `[ChatGPT]` `[OpenAI]` `[Jarvis]` `[Grok Bot]` `[Cursor]`.

## 27 Nov 2026, 08:52 AWST — [Jarvis]

- Who: Jarvis.
- Done: PR #93 CI `safety-smoke` failed on the known display-name prompt race (passed 15/15 locally). Brought across the wait-for `#nmlater` or casual button, then Not now, from the later smoke test. App code unchanged. Preview already at https://nfstride1-ux.github.io/scoretool-lab/pr/93/bhutan.html
- Half-done: PR only, not merged. Needs Nathe's "go". Waiting on CI after this commit.

## 27 Nov 2026, 08:43 AWST — [Jarvis]

- Who: Jarvis.
- Done: Branch `cursor/bhutan-scoring` (cache `v2026-11-27-0840-bhutan`). Nathe (27 Nov, via Grok Bot): standalone Bhutan scoring TEST page. New `bhutan.html` / `bhutan.js` / `bhutan_score.js`, linked from Tools as "Bhutan scoring (test)". Modes: Datse bamboo, Datse compound (same scoring; finger release, no magnifier or release aid), Khuru, Degor. Two teams, end-to-end, two arrows or stones each per turn. Datse buttons: Karey 2, bullseye 3, Sa-Karey 1 (cancels 1 Kuu of an opponent Karey), bounce-off 2 or cancels 1 opponent Karey Kuu, Daya 1 only if closer. Cancels apply at the end of the round and are listed on screen. Settings: team size 11+2, 6, or custom; Datse win by first to 25, 11 rounds, or custom (21, 23…); best of 3 or 5 sets. Khuru: hit 2, bull 3, near-miss within a stick 1, best of 3 sets to 15. Degor: closest stone scores, best of 3 games to 15. Undo last tap. Royal and neon blue only. No George references.
- Tests: `python3 tools/bhutan_test.py` 23/23. safety-smoke 15/15. privacy-scan pass.
- Half-done: PR only, not merged. Needs Nathe's "go". Lab preview to be published by hand after the PR number is known.
- Decision: official school Khuru scoring is almost the same as Datse (including Sa-Karey cancels). This test page uses the simpler table Nathe asked for. A full adult BIGSA or Yangphel rule sheet was not available, so adult win totals follow reported practice (first to 25, or 21/23, sets of 3 or 5).

## 26 Nov 2026, 05:00 AWST — [Jarvis]

- Who: Jarvis.
- Done: Branch `cursor/plans-manage-subscription` (cache `v2026-11-26-0458-plansmanage`). Nathe t1206u–t1209u after the live A$4.99 test: (1) "Manage or cancel subscription" button for signed-in paid members on Plans and the home plan card (billing portal via the stripe-entitlement function's /portal); before this the small "Manage" button only showed if the cached plan had a customer id, and the return from checkout could check the server before the webhook landed and then wait 10 minutes, so it never appeared. Now the return from checkout retries for ~20 s and opening Plans re-checks. (2) Plus copy drops Squads (removed feature). (3) Free copy says "League scoring", no Lingkana. (4) New tools/tier_gate_test.py: Free/Plus/Pro x 21 features x (nav, back button, ?p= deep link): 195/195 on this branch. New tools/plans_manage_test.py 18/18. paid_tier_test 59/59 unchanged.
- Live A$4.99 test (Nathe's Apple Pay, 26 Nov ~04:38): paid, webhook delivered, entitlement row went active plus, then refunded in full and subscription cancelled; row now canceled.
- Half-done: PR only, not merged. Needs Nathe's "go".
- Decision: the hidden Squads view (lab_squad) stays gated as Plus; it has no menu entry.

## 25 Nov 2026, 19:05 AWST — [Jarvis]

- Who: Jarvis.
- Done: Branch `cursor/stripe-paid-tier` (cache `v2026-11-25-1855-privacy`). Nathe t1200u: new `privacy.html` (Privacy, with Terms at `#terms`), the page Google's OAuth branding will point at. It covers data on the phone, the ntfy.sh relay for leagues and match play, optional Archery Calendar sync (Supabase), Google or Apple sign-in for paid plans (email only, to match the plan), payments by the payment processor (no card details stored), Microsoft Clarity analytics (typing hidden), Help feedback through FormSubmit, contact nfshold@gmail.com, and owner Nathaniel Stride (Archery Calendar), Western Australia. Terms: free features, subscriptions incl. GST that renew until cancelled through Manage, fair use, as is, WA law and Australian Consumer Law. No refund wording. Small "Privacy · Terms" links on Plans and on the Settings plan card. The Your data note now says the free app has no account or payment details, that paid plans add Google or Apple sign-in, and links the page (backup_test's phrase is kept).
- Half-done: PR only, not merged.

## 25 Nov 2026, 18:33 AWST — [Jarvis]

- Who: Jarvis.
- Done: Branch `cursor/stripe-paid-tier` (cache `v2026-11-25-1833-oauth`). Nathe (via t1196u answer): paid sign-in is Sign in with Google or Apple. Plans > Restore now shows only "Continue with Google" and "Continue with Apple"; the emailed code/magic-link restore is removed from the app. Supabase OAuth (implicit flow): the app checks `/auth/v1/settings` first and says "Google/Apple sign-in isn't available yet." if a provider is off, otherwise goes to `/auth/v1/authorize?provider=...&redirect_to=<app>/?plans=1`. On return the session in the fragment is saved, the account email is read from `/auth/v1/user`, the plan is checked with the edge function, and Plans opens. A refused sign-in shows "Sign-in didn't work. Try again." Get Plus/Pro passes the signed-in email to Checkout so the plan matches the account.
- Half-done: PR only, not merged. Google and Apple providers are off in Supabase (checked via the public settings endpoint); enabling them is a dashboard step. Apple "Hide my email" gives a relay address, which only matches a plan bought while signed in with that Apple account.
- Decision: return address uses `?plans=1`, not `#plans`, because the OAuth session comes back in the `#` fragment.

## 25 Nov 2026, 18:27 AWST — [Jarvis]

- Who: Jarvis.
- Done: Branch `cursor/stripe-paid-tier` (cache `v2026-11-25-1827-plans2`). Nathe t1193u: the Plans screen shows only each tier (Free, Plus, Pro), its price (monthly/yearly) and what it offers, with Get Plus / Get Pro, plus small Restore (email + code) and Manage buttons. No refund, Stripe or sign-in wording; the locked-screen, Settings and home plan cards lost their explanation lines. Stripe: the four existing live prices were set to tax_behavior=inclusive (same price ids, so the deployed edge function needs no change); Checkout now shows A$4.99 per month for Plus and A$79 per year for Pro.
- Half-done: PR only, not merged. Supabase sign-in email templates still need `{{ .Token }}` (token on the box expired).
- Decision: grandfathering unchanged; Checkout name stays PropGuard for now.

## 25 Nov 2026, 17:22 AWST — [Jarvis]

- Who: Jarvis.
- Done: Branch `cursor/stripe-paid-tier` (cache `v2026-11-25-1722-plans`). Nathe t1191u: real Stripe payment flow for the general ScoreTool paid tier, Plans screen in the live app, and `#plans` link target for archerycalendars.com. Built on PR #9 (`cursor/stripe-entitlement-6bd3`, 17 Nov): `plans.js`, `supabase/functions/stripe-entitlement/` and `supabase/scoretool_entitlements.sql` brought over; `test/tiers.js` used as the reference for which screens are Plus and Pro. `entitlementVerify()` now asks the deployed edge function for the signed-in email's plan (it used to grant nothing).
- Tiers: Free = Score tab (every round, plotting, saving), Latest shoot, Practice arrows, Rankings, Setups & sight marks, Leagues, Match play, Lingkana (#lk-*), Rounds, Rules, Import my data, Settings. Plus = Analysis, Diary, Squads, Event scoring, adding photos. Pro = My bows, My arrows, Arrow chooser, Tune helper, Arrow optimiser, Calculators.
- Nobody loses access: founding profiles are Pro for life; every profile already on a phone when this build first loads is kept on full access (`scoretool.paid.early`); only profiles made after that are Free until they pay. Saved data is never rewritten. Lingkana scoring, relay data and Lingkana's own pilot pricing are untouched.
- Verified: `tools/paid_tier_test.py` 49/49 at 390x844; safety smoke 15/15; privacy scan pass; edge core unit tests 13/13. Live-mode end-to-end at A$0 (100%-off one-use coupon, no card, nothing charged): subscription -> webhook -> `scoretool_entitlements` row -> email-link sign-in on a fresh profile -> Analysis opens, Tune stays Pro -> portal opens -> cancel -> webhook -> relocked.
- Half-done: PR only, not merged; waits for Nathe's "go live". Blockers before go-live are in the PR body (tax-exclusive prices show A$5.49 at Stripe, PropGuard name on Checkout, sign-in email has no code, Supabase token expired).
- Decision: no What's new entry and no announcement until Nathe confirms a real paid purchase.

## 25 Nov 2026, 16:19 AWST — [Grok Bot]

- Who: Grok Bot.
- Done: Branch `cursor/plot-autoscroll` (cache `v2026-11-25-1619-autoscroll`). Nathe t1183u and t1184u. After the last arrow of an end is plotted, the page scrolls to Back/Next. After any earlier plot, when the face is zoomed, the pan re-centres on the active target (or the next spot if the end auto-advances) and the page scrolls so Arrow size, the spot tabs and the plotting box sit fully on screen; the zoomed box is fitted to the space left above the tab bar so the target centre is in the visible face, not below it. Shared helpers (`plotAfterFlag`, `plotAfterApply`, `plotScrollNext`, `plotScrollBox`) in `app.js`, hooked from Just me `putArrow`/`score()` (practice and vs ghost included), Casual `csKey`/`csView`/`csEntryScreen`, and League `lgKey`/`lgView`. No existing test was edited. Lingkana was not written to. This PR removes nothing.
- Half-done: PR only, not merged; waits for Nathe's "go live". Verified at 390x844: after a mid-end plot at Z2 (3x) the pan offset returns to 0, Arrow size is fully visible, the face top is on screen and the target centre sits in the visible box; after the last arrow of a triangle Vegas end, Back and Next are on screen above the tab bar. Same centre-after-plot on a 122 cm full face, and on Spot 1 auto-advancing to Spot 2.
- Decision: one pull request covering both follow-ups, not merged from here.

## 25 Nov 2026, 15:39 AWST — [Jarvis]

- Who: Jarvis.
- Done: Branch `cursor/plot-zoom-room` (cache `v2026-11-25-1539-zoomroom`). When the plotting zoom goes above 1x, the face box grows to most of the viewport so the zoomed face has more room around it. The magnifier stays on screen near the top and bottom edges (it flips below or to the side if there is no room, and is `position:fixed` so the scoring card does not clip it). At 1x the box stays the compact size it has now, including the shrink that keeps the score keys on screen. Score keys and Back/Next stay in the page and can be reached by scrolling. Shared helpers (`plotBaseH`, `plotZoomRoom`, `placeLoupe`) in `app.js`, used by Just me (`score()`), Casual and League plotting (`csFaceHtml` / `csFaceBind` / `csAdFit`), match nights / H2H (they use the Just me screen), and Just me vs ghost (insights no longer undoes the grown box). Covers single faces (40/60/80/122 cm), triangle and vertical 3-spot, WA field, Bugs Eyes, and clout-size 122 cm. Casual stays buttons-only where it already is (no plot face). Lingkana is still values-only and was not written to. Practice Arrows is a count page with no zoom/magnifier, and the Arrow optimizer tuning face has no zoom, so those were left as they are. No existing test was edited. This PR removes nothing.
- Half-done: PR only, not merged; waits for Nathe's "go live". Verified at 390x844 with touch: at 1x the box stays 290–338 px; at 5x it grows to 836 px; zoom-out restores the compact height; the magnifier stays fully on screen at the top and bottom edges.
- Decision: one pull request, not merged from here.

## 25 Nov 2026, 15:08 AWST — [Jarvis]

- Who: Jarvis.
- Done: branch `cursor/practice-no-fairplay` (cache `v2026-11-25-1515-practicefp`). Nathe (t1176u): the Fair Play card is gone from My archery > Practice arrows. Today's arrow tally and daily goal on that page count every arrow logged today, including quick-logged ones still held back from XP and badges. The "-3 from rounds + 6 added today" figure was a display bug: unconfirmed added arrows were taken out of the total, then subtracted again when splitting "from rounds" vs "added today". It now shows 0 from rounds + 6 added today when only added arrows are logged. Fair Play still gates XP, streaks and badges. League scoring is untouched: added practice arrows never go into league scores, and `league.js` was not changed. The Fair Play card stays on My archery > Latest shoot. The one-time "Whoa, that was quick!" modal still appears for a too-fast Just me end, and for a 150-in-10-min added burst when that is not on Practice arrows. New test `tools/practicefp_test.py`. No existing test was edited. Lingkana was not written to.
- Removed (Practice arrows page only): the Fair Play card ("N quick-logged arrows aren't counting toward XP, league or badges yet" and the "Yes, I shot these" button). Fair Play is not removed from the app.
- Half-done: PR only, not merged; waits for Nathe's "go live". Branch updated onto current main after PR #81 (Score tab) merged; this change did not edit the Score tab.
- Decision: Practice arrows is unaffected (no card, full tally). XP and badges still wait for confirmation, with the card left on Latest shoot. League left untouched.

## 25 Nov 2026, 15:05 AWST — [Jarvis]

- Who: Jarvis.
- Done: Updated `cursor/score-tab-no-league` (PR #81) onto current main (merged #79 name suggestions and #82 My results source; no force push). Cache `v2026-11-25-1505-noleaguetab`, newer than live `v2026-11-25-1420-suggest2`. Score tab is still Just me and Casual shoot only. Clubs → Leagues → Lingkana, the scoring gate, and name suggestions are kept from main. Relay data was not written to.
- Half-done: Nathe said go live on PR #81; merge follows once required checks are green.
- Decision: this PR still removes only the Score-tab League shoot option and its helper. Nothing else is merged with it.

## 25 Nov 2026, 14:20 AWST — [Jarvis]

- Who: Jarvis.
- Done: PR #79 (`cursor/lk-reg-suggest`) updated onto current main (merged main, including the live #80 score gate and #82; no force push). Cache `v2026-11-25-1420-suggest2`. The same 2+ letter name suggestions now also run on the Score tonight / Login to Event name box (`#lkscorer`): up to 8 tap buttons (start of the name or of any word, any case, iPhone-safe plain buttons). A tap fills the exact name and moves to the PIN on the existing login screen. Suggestions include registered names already on the phone plus Nathe (Nathaniel Stride) and Nate Evans. Blue (registered tonight, unpaid) and green (paid) tick boxes on the host Registered Archers and Club pot lists are unchanged. New test `tools/lk_score_suggest_test.py` (relay posts are caught, never sent). No existing test changed. Lingkana league data was not written to. This PR removes nothing.
- Half-done: PR only, not merged; waits for Nathe's "go live".
- Decision: viewing stays open; scoring still needs a name+PIN, the passcode, or the host phone.

## 25 Nov 2026, 13:59 AWST — [Jarvis]

- Who: Jarvis.
- Done: PR branch `cursor/score-tab-no-league` (cache `v2026-11-25-1359-noleaguetab`). Removed the Score tab "League shoot" option and its helper text ("League shoots are scored inside your league, below. Open your league and tap Score my week."). Just me and Casual shoot stay. The hint "Leagues, match play and group cards are in Clubs" stays. If `_csMode` is still `'league'` (in-memory only; it was never saved to localStorage), the tab falls back to Just me with no error. Clubs → Leagues → Lingkana League and Score my week were not changed. Relay, pot, members, scores, paid ticks and groups were not touched. `/test/` staging was left as it is. No tests were edited. This branch was later updated to include main after PR #80 (Lingkana score gate) merged.
- Half-done: not merged; Nathe approves go-live. These tests still assert the old Score-tab League shoot button or `#lgcard` on Score when `_csMode` is `'league'`, and will fail if run: `tools/casual_test.py` (the type-picker checks), `tools/audit_2026_11_25_test.py` ("Score tab offers Just me, Casual, League"), and `tools/nopreset_test.py` (`card()` reads `#lgcard` after setting `_csMode='league'` and `nav('score')`). None of those are in the pull-request CI gate (`safety-smoke` + `privacy-scan`).
- Decision: one pull request, not merged from here.

## 25 Nov 2026, 13:58 AWST — [Jarvis]

- Who: Jarvis.
- Done: branch `cursor/lk-score-gate` (cache `v2026-11-25-1358-scoregate`). Lingkana scoring is gated. Anyone can still open the event home, registered list, scoresheets, ladder and pot with no profile. Before "Pick a target", ticks, group changes, scoring, or a league snapshot post, the app now asks for a registered name plus that archer's PIN, or the shared scoring passcode (same salted PBKDF2 verifier; the passcode itself is not in the repo). The host phone (`h2hMe()==='nathe'`) skips that check. Nate Evans skips only when already host-capable (`lkCoHostOn()`). "Score tonight" and `#lkfulllogin` stay, so `safety_smoke` still has its login path. New test: `tools/lk_score_gate_test.py` (needs `LK_TEST_PASSCODE`). Relay topic and live league data were not changed. Night default is still the last started night (18 Nov today): switching the picker to 2 Dec while `lgWeek()` stays on night 1 would silently refuse night-2 scores, so that was left alone.
- Half-done: PR only; not merged. Nothing goes live until Nathe says so, and only after this is verified on a real phone if he wants that too.
- Decision: viewing stays open; entering the scoring system does not. No features were removed. The Score-tab "League shoot" removal is a separate branch and was not touched here.


## 25 Nov 2026, 11:26 AWST — [Grok Bot]

- Who: Grok Bot.
- Done: Updated the shipping rule. Jarvis stays the lead and default builder. Claude, OpenAI, and Grok Bot may also ship code, as long as the change goes through a pull request, `safety-smoke` and `privacy-scan` pass, and a signed entry is added to this file. Nothing goes live without Nathe's own OK. No app code was changed.
- Half-done: Branch protection is still not switched on. Nathe has the steps in `PROJECT_RULES.md`.
- Next: Other AIs can pick up work after a credit drop, using this rule.
- Decision: Nathe approved this on 25 Nov 2026 at 11:20 Perth: any of these AIs may ship under the checks above. He also approved merging this pull request.

## 25 Nov 2026, 10:55 AWST — [Cursor]

- Who: Cursor.
- Done: Added `PROJECT_RULES.md`, this handoff, `AGENTS.md`, `CLAUDE.md`, and `IDEAS.md`. Added the `safety-smoke` and `privacy-scan` GitHub Actions checks, and a pull-request preview that publishes to `scoretool-lab` and comments the URL. Local smoke passed 15 of 15 in about 2 seconds. The privacy scan passed on current main. No app behaviour was changed.
- Half-done: Branch protection is written in `PROJECT_RULES.md` and is not switched on, because other open pull requests would wait for checks that are not on main yet. The preview workflow is in place. This session cannot add a deploy key on scoretool-lab, so `SCORETOOL_LAB_KEY` is not saved. The preview check stays green and comments the clicks. The address, once Nathe saves the key and re-runs the workflow, is `https://nfstride1-ux.github.io/scoretool-lab/pr/<number>/`.
- Next: Nathe reviews this pull request and merges it when he wants the checks on main. After that, he turns on the branch protection steps in `PROJECT_RULES.md`. Ideas in `IDEAS.md` stay queued. One at a time, and only when he asks.
- Decisions: One pull request, and it is not merged from here. Pull request 72 was open when this task started and was already on main (`dc6937d`) when this branch was cut, so this work sits on top of it and does not revert it. The privacy scan is strict, with no allow-list, because those personal files are already gone. The full `qa/run_regression.py` suite stays the manual pre-deploy check because it is too long for the pull-request gate. Previews go to `https://nfstride1-ux.github.io/scoretool-lab/pr/<number>/` and do not copy personal scoresheets or sight marks.

## 25 Nov 2026, 11:03 AWST — [Jarvis]

- Who: Jarvis.
- Done: PR #74 (`cursor/lk-night-pin`, cache `v2026-11-25-1103-nightpin4`). Lingkana sign-up is now per night: a registered archer ticks the night and enters name + own PIN (no passcode); a brand-new archer registers from the link with name, bow and a new PIN for the ticked nights (no passcode). Per-night records post as relay kind `lkreg2` (old app versions ignore it); old all-nights registrations still cover every night, so nobody already registered loses a night. Night login, group and paid lists show that night's sign-ups plus Nathe and Nate and anyone already paid or grouped. No PIN is reset; passcode unchanged and still checked at scoring login. Test: `tools/lk_night_pin_test.py` (needs `LK_TEST_PASSCODE` and `LK_SNAPSHOT`, a private copy of the live league).
- Half-done: not merged; Nathe approves go-live. `/test/` staging still has the old registration. Older scripts `lingkana_groups_test.py`, `live_go_live_test.py`, `lingkana_live_test.py` fill the old register form.
- Decision: a name already on the list without a PIN can't be claimed from the open link; that archer sets the PIN at login on the night (passcode).

## 25 Nov 2026, 12:45 AWST — [Jarvis]

- Who: Jarvis.
- Done: branch `fix/returning-tester-profiles` (cache `v2026-11-25-1215-profilefix`). Fixes phones that had a tester profile from before PR #72: `profiles.js` names the kept profile only from what that phone already saved (its own score file's profile name, own display-name pick, name cache; last resort the id); `names.js` shows that profile's own first name instead of "Archer N", skips the forced display-name screen for kept profiles (tab bar stays), and no longer builds an empty name pattern when a phone has no profiles; an old `?tester=<id>` link for a profile not on the phone is dropped from the address. `aba.js`: removed a leftover reference to the paper-sheet note text deleted in #72 (ReferenceError "NOTE is not defined" on the phone that has that sheet). No names list, scoresheets or sight marks added; no tests edited.
- Half-done: not a PR yet and not merged; Nathe reviews the Step 1 evidence first. Step 2 (giving people their own data back) not started.
- Note: headless Chrome hangs on reopening the page while an old service worker hands over; the same hang happens with a plain version bump of the pre-#72 build, so it is not from #72/#74 and is not changed here.

## 25 Nov 2026, 13:20 AWST — [Jarvis]

- Who: Jarvis.
- Done: branch `feat/import-my-data` (cache `v2026-11-25-1345-mydata`), Stage 2 option (b). New `mydata.js` plus Tools > Import my data. An archer picks the file Nathe sent them. It is read on the phone only (no upload or fetch) and kept under `scoretool.mydata.<profile id>`. The old `data/...` addresses (scoresheets, official results, results list) are answered from that copy, so Scorecards, Best, Ranks and Coach's read work again. Without a file they return 404 with no network request. It also adds the archer's paper ABA sheet by id and sight marks onto their existing bow. The merge never wipes or duplicates anything, and a bad file is refused. `app.js` fetches the results list again. `real.js`/`stats2.js` `isMe` now means "has imported official results".
- Not in the repo: no personal data. The export files are kept outside every repo. `privacy_scan` passes.
- Half-done: no PR yet; Nathe reviews the evidence first. Only Nathe's file is built.
- Note: `safety_smoke` fails about 1 run in 8 at the casual Score-tab wait, on main too (pre-existing flake).

## 25 Nov 2026, 13:29 AWST — [Jarvis]

- Who: Jarvis.
- Done: Lingkana `#lk-register` "Already registered": typing 2+ letters lists matching registered names (start of the name or of any word, any case, up to 8) as tap buttons; a tap fills the exact name and moves to the PIN. Names come from the league already on the phone (`lkKnownRegistrants`), no new public file. Plain buttons, not `<datalist>`, so it works on iPhone Safari. Cache `v2026-11-25-1329-regsuggest`. New test `tools/lk_reg_suggest_test.py` (needs `LK_SNAPSHOT`, a private league copy; posts nothing to the relay). No existing test changed.
- Half-done: PR open, not merged; Nathe approves go-live.

## 25 Nov 2026, 13:39 AWST — [Jarvis]

- Who: Jarvis.
- Done (same PR #79, Nathe's ask): host "Registered Archers" list and the Club pot "Tick who paid" list show a night's paid box BLUE when that archer signed up for that night and is not ticked paid yet. Tapping it ticks paid exactly as before (`lkSetPaid`, host phone only, `lg.paid[night][id]`); paid boxes show a green tick; boxes for nights the archer is not on stay plain white. Who counts as signed up for a night: `lkNightRegd` in `lingkana.js` — rows from a night-by-night sign-up now carry `nr`; rows already on phones count if their sign-up time is after PR #74 went live (2026-11-25 03:07:58 UTC); the old "every night" registrations do not; a PIN-only update is not a sign-up and no longer moves the row's sign-up time; Nathe and Nate count on every night. Existing paid ticks are read and stored unchanged. Cache `v2026-11-25-1339-paidblue`. New test `tools/lk_roster_paid_test.py` (needs `LK_SNAPSHOT`; relay posts are caught, never sent). No existing test changed.
- Half-done: PR open, not merged; Nathe approves go-live.
- Next: after go-live, a host phone that synced before shows blue for today's night-2 sign-ups from their sign-up time; nothing to migrate.

## 25 Nov 2026, 14:02 AWST — [Jarvis]

- Who: Jarvis.
- Done: branch `cursor/remove-myresults-source` (cache `v2026-11-25-1410-noresultsrc`). Nathe (t1160u, t1165u): Tools > My results source removed from the live app and from `/test/`, with all its tools: results region + member number + Open my results, Archer's Diary "Paste my results", "Paste a table or a CSV", "Add an official result" with photo/screenshot reading (Tesseract OCR), and the switched-off Sync now card. Deleted `results.js`, `diarypaste.js`, `vendor/ocr/`, `test/results.js`, `test/vendor/ocr/`, `tools/diary_paste_test.py`; removed the Tools row/section in `lab.js` and `test/lab.js`, `lab_results` in `test/tiers.js`, the script tags, the `test/sw.js` entry, and the What's new notes about the page. `window.importedShoots`/`window.officialAdded` moved into `mydata.js` (read only), so results already saved on a phone by that page still show in PBs, Stats and calendar sync. `tools/rankings_card_test.py`: only its My results source steps changed (it seeds the saved rows instead of pasting). Import my data unchanged.
- Not in the repo: a copy of the removed page (live and `/test/`) is kept in the private backup on Jarvis's box, not published.
- Half-done: PR only, not merged; waits for Nathe's "go live". The Archer's Diary Export (.xlsx) import is not built.
