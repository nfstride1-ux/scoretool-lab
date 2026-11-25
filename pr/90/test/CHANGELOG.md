# ScoreTool changelog

Newest first. Each entry names the version tag shown in Settings.

## Test build 2026-11-06 (NOT LIVE — do not deploy, do not merge until Nathe says so)

### Lingkana League test URL (v2026-11-11-1305-c16)
- The Lingkana League is served at a separate test URL, https://nfstride1-ux.github.io/scoretool-demo/test/ , so the live root app and its tester data stay untouched. PR #1 is not merged: C9 and the other on-hold work on this branch stay off the live root.
- Storage on the test URL is isolated (`sttest.` prefix), so opening it on a phone that already has the live app does not read or write live tester data.
- Poster invite code is LK-TEST26 (no longer the LK-PREVIEW placeholder). League record code is LINGKN26.
- A default scoring password is set. The host can change it on the host screen; the new hash is sent to other scorers on the existing ntfy relay. The typed secret is never stored on the league record.
- Sign-ups from the register page are posted to the same league relay topic and merged as a union, so every scorer's phone sees them. Paid ticks and the password hash travel in the league snapshot.
- Night 7 copy now says a 150 warm-up (not scored) comes before the top-12 ladder shoot-up.
- Nothing was posted or announced.


### Rounds page — distances and faces (v2026-11-10-rounds)
- Tools has Rounds next to Rules. It is a searchable list of the Schedule 9A target rounds. Tapping a name shows the distances, arrows at each distance, face size, total arrows, maximum, and the other names (FITA 900, Canberra Round, Fremantle Round).
- The page cites Archery Australia Target Rounds, Schedule 9A, effective January 2017. Nothing on the page is saved.

### Schedule 9A — target rounds can be scored (v2026-11-10-aa9a)
- Every round in Archery Australia Target Rounds, Schedule 9A, effective January 2017, can be scored. Ends are 6 arrows, the same as the outdoor rounds already in the app. + is the 122 cm face and * is the 80 cm face. The maximum is the arrow count times 10.
- Rounds already in the app were checked against the table and kept under their existing names: WA 90/1440, WA 70/1440, WA 60/1440 (also the Fremantle Round), AA 50/1440 (the table's 50/1440), WA 60/900 (also FITA 900 and the Canberra Round), WA 720 (70m) and WA 720 (60m). Their distances, faces and arrow counts already matched.
- Short Canberra and Junior Canberra already had the right total, face and maximum, with the distances only in the name. Each distance is now its own block of 30 arrows on the 122 cm face, so the sheet shows 50 m, 40 m and 30 m (and 40 m, 30 m and 20 m).
- 40/1440 is 36 arrows at 40 m on the 122 cm face, then 36 at 30 m on the 122 cm face and 36 at 30 m on the 80 cm face, then 36 at 20 m on the 80 cm face. Nothing in the table is shot at 55 m, 45 m, 35 m or 25 m.
- WA 50/720 in the table is 72 arrows at 50 m on the full 80 cm face. It is scored as WA 50/720 (80 cm). WA 720 (50m Compound) is left as the 80 cm 6-ring round. Official results already use the name WA 50/720 for that compound round, so the two are not the same list entry.
- The note about other Short and Junior rounds is a way to make a round by cutting distances 10 m and 20 m. Those are not added as extra named rounds.

Full `qa/run_regression.py` after `65c88c1`: **98 passed, 0 failed, 4183s**. `fullround` scored every new round: 777 passed, 0 failed. `endview` still prints two screenshot comparisons and exits 0.

Full `qa/run_regression.py` after `66d08e5` (the Rounds page): **99 passed, 0 failed, 5333s**. `aa9a_test` and `rounds_page_test` passed. Same `endview` screenshot note.

### C9 — IFAA rules tab (v2026-11-09-c9)
- Tools > Rules has an IFAA tab beside WA, AA, ABA, IBO and ASA.
- Text is the Schedule summary from the 4 April 2021 Book of Rules and the 1 June 2026 clarifications. Citations and source links are kept.
- The page says the Field Captain may set an outdoor time limit, that junior and cub distances are a summary, that course layout is left out, and that a Western Australian ABA variant is not confirmed.
- IFAA's Book of Rules page, read 9 November 2026, calls 4 April 2021 the current revision. The words "18th edition" were not re-read from the PDF cover, so they are not stated as fact.

D1–D4 tree `bfd09ab` (before C9), full `qa/run_regression.py`: **96 passed, 0 failed, 7755s**. `endview` still prints two screenshot comparisons and exits 0, the same as before.

### D4 — a photo fills in an official result (v2026-11-09-d4)
- A photo of a paper scorecard, or a screenshot of a results page, is read into Add an official result (the C4 form, on top of C5). The score, date, round, event, maximum, 10s and Xs are filled in when the picture says them clearly.
- Nothing is saved, counted, or treated as a personal best until the archer presses Save. The form says how many points the score is above or below the personal best. After a confirmed save, a new best is on the Personal bests list and can be chosen as a Ghost match opponent (a total with no ends is a pace line, not invented arrows).
- The picture is deleted once it has been read. It is not kept on the phone and it is not sent. A picture with no readable score does not fill the form and does not save.

### D3 — a blank custom round names itself (v2026-11-09-d3)
- Saving a custom round with no name names it from the type and the distance: Target 70m, Indoor 18m, Field 50m, Clout 180m, 3D 20 targets. Yards stay in the name. With no distance it uses the face and the number of ends. A name you type is kept. A repeat gets a number.

### D2 — plotting moves to the next target (v2026-11-09-d2)
- Reproduced on a phone-sized screen, Just me, Vegas 300, target showing: open Spot 3, enter X and 10, then tap 1px inside the bottom edge of the picture. That point sits in the gap around the face and was saved as M, the end locked, and Undo was the way back. Hiding the target left the score keys, which is why the last arrow only worked after hiding the target. A tap in that gap is no longer saved as a miss.
- After the arrows on a target face are plotted, the next target opens. On a 3-spot that is the next spot. After Spot 3, and after the last end of a single face or field round, the screen stays until Next.

### D1 — edit a finished score sheet (v2026-11-09-d1)
- A finished or past score sheet is edited in place. Deleting an arrow leaves a hole in that end, and the next score fills the hole. It no longer tries to open an end past the end of the round, which is what stopped an X being put back on a finished Vegas 300 (the sheet sat on 287/290 from 29 arrows).
- When the hole is filled and the round is whole again, the total, X count, 10s count and personal-best line are worked out again from the arrows. No second copy of the sheet is kept.



### C6 — Sync now, flag off (v2026-11-06-1959-c6)
- Plus and Pro see Sync now on My results source. The flag `scoretool.flag.waSync` defaults off.
- Off: "Coming once your national body approves" and a way to paste or CSV. Nothing is fetched. Switching the flag on still does not call an organisation.

### C5 — screenshot on the official result form (v2026-11-06-1959-c5)
- Attach a screenshot to look at while you type. The picture is not read. After save it is deleted unless Keep the photo is ticked. A kept photo stays in IndexedDB on this phone and is not sent.
- On-device reading of an iScoredToday or score-card picture is not reliable, so this is attach-and-type.

### C4 — add an official result (v2026-11-06-1959-c4)
- Tools, My results source: date, event, round, score, and optional maximum, 10s, Xs and ends.
- Saved on this phone as a finished official result (`official`, `finished`). It counts for personal bests and is queued to the calendar with the C3 path (`off-`).
- A round already scored, or the same official result again, is left as it is. Tests stub the RPC.

### C3 — official and imported scores (v2026-11-06-1957-c3)
- Official scoresheets (`sheet-`), competition results that are not a scoresheet (`diary-`) and My results imports (`imp-`) are queued to the same calendar call, once each.
- A row that matches an already-sent score on date, round and total is skipped. The personal-best `(PB)` rule is the same one.
- A diary note with no round or score is not sent. Tests stub the RPC and use a fake link token.

### C2 — every finished round is sent (v2026-11-06-1957-c2)
- Practice and club rounds that were already finished are sent as well. The first-run list no longer blocks them.
- A round is sent once for its source id. It is sent again only when the payload changed. Sample rounds and discarded rounds stay out.
- Tests stub the RPC and use a fake link token.

### C1 — personal best on the calendar round name (v2026-11-06-1957-c1)
- A finished full round that is the Personal bests card's best for that round is sent with ` (PB)` on the end of the round string. No new column. Scores stored on the phone are not changed.
- The comparison is the card's own one (`bsCurrentPb`: highest full score, earlier date if the score is the same, practice and official and imported together).
- Tests stub `scoretool_save_score`. They use a fake link token. Nothing is posted to the live calendar.
Branch cursor/scoretool-test-build-2026-11-06-52a5 off a7ea130. Nothing here is on GitHub Pages. Saved data on https://nfstride1-ux.github.io/scoretool-demo/ is not touched.

### R1, R2, R3
Looked for existing R1/R2/R3 work to merge: origin has only main at a7ea130, no other branches, tags, pull requests or dangling commits. Those changes are not in this repository, so they were not invented.

### IBO/ATA 327 for Hoyt Concept X 40
- data/bow_specs.json: hoyt-cx40 speed stays 327; speedKind is IBO/ATA (was ATA).
- My bows, the Arrow chooser and Calculators label the speed field IBO/ATA. Other bows keep IBO, ATA, not stated or measured.
- Tests: mybows_test 62 passed, 0 failed (PORT 8791). ac1_test 23 passed, 0 failed (PORT 8792). arrowchooser_test "starting-point warning" also fails on main a7ea130 with this Playwright, so it is not from this change.


### Badges, rewards and season removed
- Season, badge collection, monthly recap and the badge card editor are no longer shown. Rankings and AA classification stay.
- Names, diary, score photos and the score-sheet share image stay.
- Tests: redesign_test 142 passed, 0 failed.


### Rest of the test build (not live)
- Badges, rewards, season, monthly recap and the badge card editor are removed. Rankings and classification stay. Names, diary, score photos and the score-sheet share image stay.
- The shared tester squad starts blank off the live site. A squad you create is kept. The live host is not cleared.
- Fair play shows once per round.
- One Analysis screen. One Tune helper (paper, torque, draw weight/spine, cut length, bare shaft, node, creep, Dudley). Head-to-head and match night open from Casual.
- A new archer can create a profile. Under-16s show nicknames only.
- No tester or demo wording on screen.
- Plan is a switch: Free (score card), Plus (your shooting), Pro (gear and tuning). Current archers are Founding member, free for life, until the switch is moved. No payment. Locked items say Available on Plus or Pro.
- Photo to score was not built.
- mybows_test 62/0 after the Tune helper. redesign_test 142/0 after badges were removed. ac1_test 23/0. Full regression is recorded when it finishes. Do not deploy.


### My results source
- Tools > My results source: country or body (Archery Australia, Archery WA, World Archery, Archery GB, USA Archery, Other) with that body's home page filled in. Other leaves the website blank for you to type.
- Member / archer ID and the website stay in localStorage (`scoretool.resultsSource.<archer>`). They are not sent anywhere. Open my results only opens the saved address.
- Paste a table or choose a CSV, map round, date, score and event, preview, then confirm. Nothing is saved before confirm. A round already scored is left as it is. Saved rows live in `scoretool.imported.<archer>`, tagged imported, left out of ratings, and shown on personal bests with an imported badge.
- Plus. A Free plan sees Available on Plus. No fetch and no scrape.
- Tests: results_test 20 passed, 0 failed. redesign_test 141 passed, 0 failed after the activity league was taken off rankings.


### Regression on this test branch (not deployed)
- Full run: 68 passed, 15 failed, 2304s. The 15 were: WebKit not installed yet (11 suites), Peel share/comp servers not started (2), pdftotext missing (sight card), and the activity-league check on rankings.
- After WebKit, pdftotext and the Peel server helper were available, those suites passed, including fullround 409/0, results source 20/0, coach2 178/0, backup 24/0, names 105/0, redesign 141/0.
- endview still prints 2 screenshot comparisons against commit 7b8b2ed. The runner treats the suite as passed (exit 0). The shell has changed since that baseline.
- arrowchooser "starting-point warning" also fails on main a7ea130 with this Playwright.
- Not run against the live URL. Do not deploy.

One entry per release, newest first. Every release records: what changed, the files touched, and the tests run (before the deploy, and again on the live URL after).
Process (agreed 26 Oct 2026): do not change anything that already works while fixing something else. Before every deploy run `python3 qa/run_regression.py` (all areas, see `qa/regression.md`), then run `python3 qa/run_regression.py --live https://nfstride1-ux.github.io/scoretool-demo/` after it is live. Any suite that fails is either fixed (if the change caused it) or listed here as a known failure. Earlier releases are in `git log`; user-facing notes are in `whatsnew.js`.

## v2026-11-03-0640-r3 (2026-11-03)
### What changed
- R3 (Nathe via Archery Coach, bot meeting 3 Nov 2026 6:25am AWST): in a Fletched vs Bare session the "X% tighter / wider" line is replaced with a plain tuning verdict (bareVerdict in lab.js). Other change types keep the % line.
- Side to side, using the same spread rule as the Bare shaft reading card (offset bigger than the fletched group's average spread): right-handed archer, bare shafts right = acting weak, left = acting stiff (Easton Bare Shaft Planing Test). Left-handed archer (session bow hand): mirrored, and the verdict says so. No bow hand on the session: it gives the offset and asks for the bow hand, no guess.
- High or low: points to the nocking point (move up for high, down for low), then tiller on a recurve or barebow. Tiller is not mentioned on a compound session.
- Usual next step, labelled general tuning guidance: weak = a lighter point, more plunger tension, slightly less draw weight, or a shorter arrow; stiff = a heavier point, less plunger tension, slightly more draw weight, or a weaker spine. This follows Easton's guide (weak: decrease bow weight), not "more draw weight" for weak.
- Compound session (arrow setup bow = compound, or bow name says compound): note that Easton writes the test for finger release and paper tuning is the usual first step with a release aid.
- Bare shaft reading card: left-handed archers now get the mirrored reading (it used to say right-handed only), and the high/low line mentions tiller on recurve or barebow as general guidance.
- A Bow hand select on Fletched vs Bare sessions; changing it saves T.hand on that session only. Viewing a session writes nothing.
### Files
lab.js (bareVerdict, bareCard, #tvhand), tools/r3_test.py (new), qa/run_regression.py, qa/regression.md, whatsnew.js (also R2 commit hash), CHANGELOG.md, version.json, sw.js, index.html.
### Tests
- Before (baseline): R1 branch full regression (see the R1 entry)
- Single runs: r3_test 21 passed, 0 failed
- After: RESULT_AFTER
- Live: not deployed yet (waiting for Nathe's OK, after R1 and R2).

## v2026-11-03-0636-r2 (2026-11-03)
### What changed
- R2 (Nathe via Archery Coach, bot meeting 3 Nov 2026 6:25am AWST): the tuning session's Arrow setup card was read-only and copied whatever the Arrow chooser had, including impossible figures, which blocked bare shaft vs fletched testing.
- Every Before and After box on the card (shaft, spine, length, point, FOC, total weight, speed) is now a box you can type in. "Just a group" sessions have one Arrow column. Sessions without a saved setup show empty boxes (and "Use my current arrow setup for Before" when the chooser has one).
- Same range check as R1 (window.arrowLim, FOC 0-40% added). A figure outside its range, or not a number, is kept in the box as typed, flagged under it in plain English, and not saved. A figure saved before that is out of range (for example 12365 gr or -3643 fps copied from the chooser before R1) is flagged when shown and left as it is until it is typed over.
- Edits save to that session only (t.arrow, t.arrowAfter). The Arrow chooser, My bows, My arrows and the Calculators are never written. The first edit to an After box starts After as a copy of Before. A typed speed is marked as your figure, not an estimate. Shaft and spine are free text (up to 30 characters), not range-checked.
- Showing the card writes nothing; old sessions are not rewritten.
### Files
lab.js (arwCard, arwWire, TA_F, FOC range), lab.css (.tarwtbl), tools/r2_test.py (new), qa/run_regression.py, qa/regression.md, whatsnew.js (also R1 commit hash), CHANGELOG.md, version.json, sw.js, index.html.
### Tests
- Before (baseline): R1 branch full regression (see the R1 entry)
- Single runs: r2_test 24 passed, 0 failed; arrowchooser_test tuning-session checks (setup in session, what changed point, snapshot fields, old sessions untouched) all pass. arrowchooser_test also reports "starting-point warning" at 390 and 1366px: it expects one "A starting point only" text and main (a7ea130) already shows two; the regression counts it as a pass because that test always exits 0. Not caused by this change.
- After: RESULT_AFTER
- Live: not deployed yet (waiting for Nathe's OK, after R1).
## v2026-11-03-0630-r1 (2026-11-03)
### What changed
- R1 (Nathe via Archery Coach, bot meeting 3 Nov 2026 6:25am AWST): input checks on the arrow and bow figures. 12365 gr was accepted and the Calculators speed estimate showed -3643 fps.
- Usual ranges, one table in lab.js (ARROW_LIM, window.arrowLim): draw weight 5-90 lb, draw length 14-34 in, speed rating (IBO or ATA) 200-400 fps (379, the Concept X 40 prefill, is in range and left as it is), arrow weight 100-1000 gr, arrow length 14-36 in, point 10-400 gr, shaft 2-30 gr/in, insert/pin/collar 0-150 gr, nock 0-40 gr, vanes 0-100 gr, arrow speed 100-450 fps, string weight 0-100 gr, balance point 1-36 in.
- A figure outside its range, or text that is not a number, is flagged under its own box in plain English (gold edge, no red, no icon; aria-invalid on the box), kept as typed and left out of every sum until it is fixed.
- Speed estimate (window.arrowSpeedEst, used by the Calculators speed card, the Arrow chooser and Is this arrow right): worked out only when every figure is in range and the result is at least 100 fps; otherwise it shows - with the reason. It is never negative.
- Arrow chooser: a worked-out total arrow weight over 1000 gr (or under 100) is flagged under the total and is not copied into a tuning session (arrowSetup) or sent by Use this arrow. Is this arrow right does not save a weight or speed from a flagged box.
- No saved data is changed or rewritten: figures saved before stay as they were and are only flagged when shown.
### Files
lab.js (ranges, check, speed rule, Calculators boxes), arrowchooser.js (box notes, total weight note, speed, arrowSetup, Use this arrow), arrowcheck.js (speed and weight), lab.css (.labbad), tools/r1_test.py (new), qa/run_regression.py, qa/regression.md, whatsnew.js (also relayhold commit hash), CHANGELOG.md (also fills in the relayhold after and live lines), version.json, sw.js, index.html.
### Tests
- Before (baseline): full regression 81 passed, 0 failed (relayhold, a7ea130)
- Single runs: r1_test 32 passed, 0 failed; whatsnew_test 33 passed, 0 failed.
- After: RESULT_AFTER
- Live: not deployed yet (waiting for Nathe's OK).
## v2026-11-01-1446-relayhold (2026-11-01)
### What changed
- Relay fix for ntfy.sh 429 throttling (Level 1 report item N1: about one relay message per league arrow; parked since 1 Nov 03:20 as 329c66e + 76604ee, never pushed). The slow-start half of that work already shipped alone as squadfix (7d171df), so it is not repeated here.
- h2h.js: after a failed send (network error, 429 or 5xx) that topic waits 15 seconds before the next try. Any send or poll that gets through clears every hold, and so does the online event. Scores stay marked to send.
- league.js and casual.js: the full snapshot is still re-sent when the app opens, so an away phone can catch up if the relay lost it, but at most once every 30 minutes per league or group (a send of new scores does not count towards the 30 minutes).
- The time of the last re-send on open is kept in its own storage key, scoretool.opost.<archer>.<league or group code>, and a re-send on open writes nothing to the saved record. No saved data changed.
- Test change (Nathe's choice from the Command Centre, 1 Nov 2026 2:43pm: "Exclude from the test"): whatsnew_test's "testers' data unchanged" check leaves out only keys matching scoretool.opost.<archer>.<CODE>; every other new key still fails it. peel_data_test needed no change (it compares the saved record only, which this release no longer touches). tools/clarity_test.py stubs ntfy.sh.
- Not verified: how long ntfy.sh actually keeps messages. The 30 minute re-send on open does not depend on it.
### Files
h2h.js, league.js, casual.js, tools/relayhold_test.py (new), tools/whatsnew_test.py, tools/clarity_test.py, qa/run_regression.py, qa/regression.md, whatsnew.js (also AC6 commit hash), CHANGELOG.md (also AC6 live line), version.json, sw.js, index.html.
### Tests
- Before (baseline): full regression 81 passed, 0 failed (AC6 after-run, b58d178)
- Single runs: relayhold_test 10 passed, 0 failed; peel_data_test 2/0 (unchanged); whatsnew_test 33 passed, 0 failed (with the unchanged test it fails only "testers' data unchanged", 32/1, which is the new key).
- After: full regression 81 passed, 0 failed (recorded in /workspace/scoretool-queue-log.md at the relayhold release)
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-11-01-1446-relayhold): live since 1 Nov 2026, commit a7ea130.
## v2026-11-01-1349-ac6 (2026-11-01)
### What changed
- AC6, new Help guide "Build an arrow" (after Tools), eight steps in order: bow details; spine from the chart; shortest safe cut; point weight and FOC (Easton 7-16% range, indoor target 7-15%, outdoor target 10-15%); bushings and nocks; fletching (sourced, not from Dr Park); cutting, gluing and squaring; bare-shaft or paper tune.
- Every step names its source with a link: Easton Arrow Tuning and Maintenance Guide (pp. 1, 4-7, 10, 13, 15-17 Fig. 21, 19, 26-27), Easton 2026 catalogue (Target Arrow Size Selection chart pp. 56-57; component lists), Easton "The Simple Guidelines to Correct Arrow Balance (FOC)" (2022), and A. Tippins' Bow International vane guides (2018, 2020).
- Each step has an "Open ... in the Arrow chooser" link that opens the chooser at that field (draw weight, result, Shortest safe cut, point weight, Easton parts, Fletching suggestion, arrow length), opening its section and putting the cursor in the box. The links only move the screen; nothing is saved.
- The printable PDF of the guides (help/ScoreTool-help-guides.pdf, last built 23 Oct) is not rebuilt in this release; Print the guides in Help includes the new guide.
### Files
help.js (new guide), arrowchooser.js (acGo: open the chooser at a field), index.html (?v= bump), tools/ac6_test.py (new), tools/whatsnew_test.py (Help now has 11 guides), qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md (also fills in the ac5 live line), version.json, sw.js.
### Tests
- Before (baseline): full regression 80 passed, 0 failed (AC5 after-run, 96361f8)
- Single runs: ac6_test 24 passed, 0 failed
- After: full regression 81 passed, 0 failed, 3228s (python3 qa/run_regression.py, 1 Nov 2026 AWST)
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-11-01-1349-ac6, commit b58d178, pushed 1 Nov 2026 18:30 AWST): ac6_test 24 passed, 0 failed on the live URL; sw.js version matches; noindex present; What's new shows this entry on top.

## v2026-11-01-1343-ac5 (2026-11-01)
### What changed
- AC5, sourced fletching suggestion in the Arrow chooser ("Fletching suggestion", under the result). Marked "Not from Dr Park"; every line names its source.
- Indoor: largest and longest vane that clears; Bow International: 3.00" recurve and 4.00" compound vanes are "not uncommon", indoor vanes often 3-4" with a high profile; helical or offset adds stability (drag and rotation). Outdoor (Target, Field): compound typically 1.87"-2.00" and just over 1/4" high, recurve plastic about 1.75" and taller, outdoor vanes usually 1.75"-2.25"; longer arrows may need longer vanes (1.75" on 28" vs 31"); Easton p. 9: reduce fletching size or angle to cut drag on light arrows. 3D: no 3D-only figure in these sources, both lists shown for reference. Hunting: not covered by these sources.
- Launcher rest (compound): Easton p. 3: support arm narrow enough for the two lower vanes to pass without contact, narrower blade for small-diameter shafts; p. 6: shoot-through arm width, shoot-around nock indexing. Clearance check for every bow: Easton p. 5 dry powder spray; p. 6 turn the nock 1/32 turn, then a lower-profile fletching; recurve adds Bow International's note that clearance is especially a problem for recurve.
- Sources: Easton Arrow Tuning and Maintenance Guide (pp. 3, 5, 6, 9); A. Tippins, "The essential guide to vanes", Bow International, 22 Jul 2020; A. Tippins, "Q&A: Picking your vanes", Bow International, 3 Mar 2018 (research copies in /workspace/research).
- Reads only; nothing saved and no saved data changed.
### Files
arrowchooser.js, help.js (Tools: Fletching suggestion step), index.html (?v= bump), tools/ac5_test.py (new), qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md (also fills in the ac4 live line), version.json, sw.js.
### Tests
- Before (baseline): full regression 79 passed, 0 failed (AC4 after-run, 6bd55e3)
- Single runs: ac5_test 22 passed, 0 failed; ac4_test 22/0; whatsnew_test 33/0
- After: full regression 80 passed, 0 failed, 3318s (python3 qa/run_regression.py, 1 Nov 2026 16:39-17:34 AWST)
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-11-01-1343-ac5, commit 96361f8, pushed 1 Nov 2026 17:34 AWST): ac5_test 22 passed, 0 failed on the live URL (17:35 AWST); sw.js version matches; noindex present; What's new shows this entry on top.

## v2026-11-01-1342-ac4 (2026-11-01)
### What changed
- AC4, heavy point and FOC warnings in the Arrow chooser.
- Easton target and hunting charts: when the point-weight step (Easton: 3 lb of bow weight per 25 gr over 100 gr) is what takes the reading past the top row, the Easton box shows a "Heavy point" note with the extra pounds and the heaviest point that still reads inside the top row (worked out with the same sum, 1 gr at a time), and quotes Easton: "If your arrow is too weak, go to a lighter insert/point." If the bow is over the top row even at 100 gr, there is no point note (the existing "above the chart" line stays).
- Gold Tip: a note when the front weight is over its heaviest column (150 gr): the reading is the 150 gr column and a heavier point acts weaker.
- FOC: a note under the FOC result when it is over 16% (top of Easton's 7-16% point-weight tuning range, Tuning Guide p. 10), and for Indoor when it is over 15% (Easton 2022 indoor target 7-15%). Uses the FOC shown (measured balance point when given, otherwise the estimate), rounded as shown.
- Reads only; nothing saved and no saved data changed.
### Files
arrowchooser.js, help.js (Tools: Heavy point and FOC warnings step), index.html (?v= bump), tools/ac4_test.py (new), qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md (also fills in the ac3 live line), version.json, sw.js.
### Tests
- Before (baseline): full regression 78 passed, 0 failed (AC3 after-run, dd19439)
- Single runs: ac4_test 22 passed, 0 failed; ac3_test 29/0; ac2_test 45/0; whatsnew_test 33/0
- After: full regression 79 passed, 0 failed, 3530s (python3 qa/run_regression.py, 1 Nov 2026 15:37-16:36 AWST)
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-11-01-1342-ac4, commit 6bd55e3, pushed 1 Nov 2026 16:37 AWST): ac4_test 22 passed, 0 failed on the live URL (16:38 AWST); sw.js version matches; noindex present; What's new shows this entry on top.

## v2026-11-01-1334-ac3 (2026-11-01)
### What changed
- AC3, shortest safe cut helper in the Arrow chooser (under Arrow length, "Shortest safe cut (helper)"). Source: Easton Arrow Tuning and Maintenance Guide, Measuring Correct Arrow Length (pp. 15-16, Fig. 21) and Determining Shaft Cut Length (p. 17), research copy /workspace/research/TuningGuideEaston.pdf.
- Plain steps: draw an extra-long arrow, have someone mark it where it touches the most forward point of the launcher or rest, measure from the bottom of the nock groove to the mark, type it in. The chooser adds Easton's "about 1 inch" and shows that as the shortest safe Correct Arrow Length (point not included).
- At that length it shows the spine from each chart (same chart reading as the Result card) and the FOC and total weight (component estimate, or a measured balance point moved by the length change, the same way as the point-weight lines). "Use ... as my arrow length" writes it to Arrow length. A warning shows when the arrow length typed is shorter than the shortest safe cut.
- Notes from the same pages: the 1 inch is for target, field and 3D arrows from any bow and hunting arrows from bows with a cutout sight window; broadheads without a cutout and overdraws use other clearances (Figs. 22-26), not covered; recurve beginners may add 1/2-1 inch (shown for recurve and barebow); the bare shaft is cut slightly shorter than Correct Arrow Length (nock base).
- The measurement is saved in the chooser record only when typed. Nothing is written when the page opens. No saved data changed.
### Files
arrowchooser.js, help.js (Tools: Shortest safe cut step), index.html (?v= bump), tools/ac3_test.py (new), qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md (also fills in the ac2 live line), version.json, sw.js.
### Tests
- Before (baseline): full regression 77 passed, 0 failed (AC2 after-run, 8496ebc)
- Single runs: ac3_test 29 passed, 0 failed (exits with an error on a failed check); ac2_test 45/0; whatsnew_test 33/0
- After: full regression 78 passed, 0 failed, 3185 s (includes ac3_test)
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-11-01-1334-ac3): ac3_test (BASE=live) 29 passed, 0 failed (1 Nov 2026, about 15:37 AWST); version.json, newest What's new, sw.js version and noindex checked.

## v2026-11-01-0941-ac2 (2026-11-01)
### What changed
- AC2, Easton parts in the Arrow chooser. Component weights copied from the parts list printed with each shaft in the Easton 2026 catalogue (research copy /workspace/research/easton2026.txt). Only printed figures are used; nothing estimated.
- Picking an Easton shaft shows "Easton parts for <shaft>" under Arrow parts for FOC: point, point-end insert, bushing/pin/collar (nock end) and nock, each with a None choice, plus 10/20/50 gr weight modules for adjustable points. The chosen parts fill the point, insert and nock boxes left blank; a typed figure wins and a cleared box goes back to the part. A line under the total weight says which parts were used.
- SuperDrive 27 280 (9.0 gr/in): SD 27 Adjustable Point 100 gr, modules 10/20/50 gr, 4MM Bushing 18, 4MM Kick Out 26, 6.5MM Bushing 19, 6.5MM Kick Out 22, 4MM G Nock 7, 4MM Microlite 6, 6.5MM Super 3D 13, 6.5MM Microlite Super 8. Also SuperDrive 23 and 25, X23 and X27 (Super UNI bushing by size: 2312 11, 2314 10, 2315 11, 2318 11, 2712 19), X10, X10 Parallel Pro 3.2mm, X10 4MM Parallel Pro, A/C/E, Superdrive Micro, Avance and Vector (pins, collars, nocks, half-out). Pin + collar choices are the sum of the two printed figures.
- Points printed as a range (break-off and ML points) are listed but not filled in; the archer types the weight. The X27 Adjustable Bullet Point is printed "200 grains" and is left out until checked. The nock page lists the 4MM G Nock as 6 gr while the shaft pages say 7 gr; the shaft-page 7 gr is used.
- Bushings, pins and collars are counted at the nock end in the FOC estimate (before, the Insert box hint suggested entering a pin there, which counted it at the point). To keep older saved figures the same, a nock-end part is not added when the archer had typed their own insert or nock, unless they choose a part; the line says so.
- Defaults (first listed, changeable): SuperDrive and X23 adjustable point with no modules, first bushing, first nock; X10 lines X10 Pin with Pin Nock (G Pin Nock for compound); 4MM shafts no pin and a 4MM Microlite nock; Vector N Nock. Hunting shafts are not covered.
- Part choices are saved in the chooser record only when changed. Nothing is written when the page opens. No saved data changed.
### Files
arrowchooser.js, help.js (Tools: Easton parts step), index.html (?v= bump), tools/ac2_test.py (new), tools/ac1_test.py (exits with an error on a failed check), qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md (also fills in the ac1 live line), version.json, sw.js.
### Tests
- Before (baseline): full regression 76 passed, 0 failed (AC1 after-run, 2eb62ef)
- Single runs: ac2_test 45 passed, 0 failed; ac1_test 23/0; whatsnew_test 33/0; arrowchooser, arrowcheck, arrowuse and mybows tests pass. ac1_test and ac2_test now exit with an error when a check fails (before, the runner could only see failures in their output); both re-run after that change: 23/0 and 45/0
- After: full regression 77 passed, 0 failed, 3531 s (includes ac2_test 45/0)
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-11-01-0941-ac2): ac2_test (BASE=live) 45 passed, 0 failed (1 Nov 2026, about 14:38 AWST); version.json, newest What's new v, sw.js version and noindex checked.
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-11-01-0941-ac2): ac2_test (BASE=live) 45 passed, 0 failed (1 Nov 2026, about 14:38 AWST); version.json, newest What's new, sw.js version and noindex checked.

## v2026-11-01-0810-ac1 (2026-11-01)
### What changed
- AC1, the Arrow chooser and your bow. Concept X 40 was already in the bow list (data/bow_specs.json), so nothing was added there.
- The Arrow chooser now starts from the bow you are using (the one picked in Setups & sight marks, or your first bow). Its bow type, draw weight, draw length and (compound) speed fill the empty boxes each time the page opens, so a change in My bows shows up straight away. Nothing is written when the page opens.
- A line under the picker says which bow is being used and which figures came from it, and for an ATA speed that ATA reads lower than IBO. Typing in a box wins; clearing it goes back to the bow's figure. Choosing "None, I'll type them" keeps the figures and stops following the bow.
- Every bow is listed in the picker, including bows only in Setups & sight marks, marked "(no specs yet)"; picking one says to add its specs in My bows.
- The speed box hint now says which rating each chart uses: Gold Tip's compound charts, IBO; Easton's hunting chart, ATA (301-340 fps ATA, Easton 2026 catalogue); Easton's target chart and Victory's chart, a bow speed rating without saying which. An ATA figure is used as it is.
- Defect L6 fixed: "Is this arrow right?" used 340 fps unless the speed card was filled in. It now uses your saved bow (type, draw weight, draw length, speed) and says so, until you fill in the speed card or pick a bow there.
- No saved data changed.
### Files
arrowchooser.js, bows.js, arrowcheck.js, index.html (?v= bump), tools/ac1_test.py (new), qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md (also fills in the yourdata live line), version.json, sw.js.
### Tests
- Before (baseline): full regression 75 passed, 0 failed (yourdata after-run, 33f94c0); live diagnostic on 33f94c0 76 passed, 0 failed
- Single runs: ac1_test 23 passed, 0 failed; whatsnew_test 33/0; mybows, arrowcheck, arrowchooser, arrowuse and arrowpick tests pass
- After: full regression 76 passed, 0 failed, 3300 s (includes ac1_test 23/0)
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-11-01-0810-ac1): ac1_test (BASE=live) 23 passed, 0 failed (1 Nov 2026, about 09:26 AWST); version.json, newest What's new v and noindex checked.

## v2026-11-01-0611-yourdata (2026-11-01)
### What changed
- Item 5, paid-user basics. New backup.js (loaded after lab.js) adds a Your data card to Me > Settings & help, after the Settings card:
- Save a backup file: a JSON file of this archer's ScoreTool data (the main record plus this archer's other scoretool.* keys), named scoretool-backup-<archer>-<date>.json; the card shows when the last one was saved. Photos are not included (said on the card).
- Restore from a backup file: checks it is a ScoreTool backup for this archer and not damaged, asks first (naming both shoot counts), keeps a copy of the current data on the phone (scoretool.prerestore.<archer>), then reloads and says how many shoots were restored. Blocked in admin view.
- Keeping data: the app asks the phone to keep its storage (navigator.storage.persist; home-screen apps get this without a prompt) and the card says whether the phone agreed.
- Offline: a line under the top bar, "Offline · saved on this phone. Shared scores send when you are back online.", shows while there is no signal.
- Privacy note on the card (wording per Nathe, 1 Nov): scores, sight marks and settings are kept on this phone; no account, login or payment details; league, match and group scores (with the display name) are shared through a relay (ntfy.sh); linked Archery Calendar rounds and their photos go to that account; anonymous usage (taps and scrolling, typed details hidden) is recorded by Microsoft Clarity.
- No accounts, login or payments added. No saved data changed.
### Files
backup.js (new), index.html (script tag, ?v= bump), tools/backup_test.py (new), qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md, version.json, sw.js.
### Tests
- Before (baseline): full regression 74 passed, 0 failed (lgauto after-run, 7d97baa; pushed as 768812d with the CHANGELOG line only)
- Single runs: backup_test 24 passed, 0 failed (its offline-worker check now sets service_workers='allow', which guard.py keeps; the first single run, without it, failed that one check); whatsnew_test 33/0; peel_data_test 2/0; guards_test 7/0; clarity_test 16/0; nav_test 99/0
- After: full regression 75 passed, 0 failed, 3131 s (d1089cc)
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-11-01-0611-yourdata): backup_test (BASE=live) 24 passed, 0 failed (1 Nov 2026, 07:07 AWST); version.json, newest whatsnew v and noindex checked.

## v2026-11-01-0418-lgauto (2026-11-01)
### What changed
- Item 4, League Next setting. Shared-phone league scoring now moves to the next archer by itself once the 3rd arrow of the end is saved (never before), with no jump to the top. A line shows "Saved: Name, end N: X 9 8." Undo clears it.
- New setting on the shared-phone league screen: "Stay on each archer after the 3rd arrow and tap Next to move on" (saved as lgNextBtn); unticking it while held moves on.
- Tests updated for the new default: lgpage_test sets the Next setting, league_test expects the auto-advance, lgscroll only taps Next when it is there.
- No saved scores changed.
### Files
league.js, tools/lgauto_test.py (new), tools/lgpage_test.py, tools/league_test.py, tools/lgscroll_test.py, qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md, version.json, sw.js, index.html.
### Tests
- Before (baseline): full regression 73 passed, 0 failed (squadfix after-run, 7d171df)
- First full run (bd972e0, not pushed): 73 passed, 1 failed; lgpage_test stopped after 4 s because this release's edit to it left the 2 second wait after the reload inside a comment, so under load the page was not ready. Fixed (the wait is back), then run again.
- Single runs: lgauto_test 16 passed, 0 failed; lgpage_test 40/0; league_test 60/0 (61 before: the two Next-button checks are now one auto-advance check, approved with item 4); lgscroll_test 19/0; whatsnew_test 33/0; peel_data_test 2/0; guards_test 7/0; casual3d_test 26/0
- After: full regression 74 passed, 0 failed, 3129 s (7d97baa)
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-11-01-0418-lgauto): lgauto_test (BASE=live) 16 passed, 0 failed (1 Nov 2026, 06:09 AWST); version.json, newest whatsnew v and noindex checked.

## v2026-11-01-0320-squadfix (2026-11-01)
### What changed
- Extra release (Nathe, 31 Oct; shipped alone per Nathe's option C, 1 Nov): the live page error "Can't find variable: squad". Cause: app.js drew the first screen as soon as the results fetch finished, which on a slow connection could be before later scripts (squads.js and others) had loaded. The first draw now also waits for DOMContentLoaded (every script has run).
- The relay hold change planned with it (relayhold, option A) is parked and not in this release: with the re-send time kept in its own storage key, whatsnew_test's check that testers' data is unchanged fails on the new key, and keeping it in the saved record fails peel_data_test.
- No saved data changed.
### Files
app.js, tools/slowload_test.py (new), qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md, version.json, sw.js, index.html.
### Tests
- Before (baseline): full regression 72 passed, 0 failed (stubtests after-run, 0f41815)
- Single runs: slowload_test 6 passed, 0 failed; clarity_test 16/0; whatsnew_test 33/0; guards_test 7/0; peel_data_test 2/0
- After: full regression 73 passed, 0 failed, 3127 s (c2083a1)
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-11-01-0320-squadfix): slowload_test (BASE=live) 6 passed, 0 failed (1 Nov 2026, 04:16 AWST); version.json, newest whatsnew v and noindex checked.

## v2026-11-01-0058-stubtests (2026-11-01)
### What changed
- Test-only release (Nathe, 1 Nov): every test that loads the app must stub ntfy and block the service worker, including nav_test and ghost_pick_test, and field_faces must exit non-zero on failure.
- New tools/guard.py, imported by every tool that loads the app (74 files, including nav_test, ghost_pick_test and build_help_shots). It gives every browser context and page an ntfy.sh stub and service_workers='block'. A test's own ntfy.sh route still takes priority (h2h, league, casual and others use their own relay mock), and a test that sets service_workers itself keeps it (offline_test needs 'allow').
- field_faces_test now exits non-zero when a check fails (before, it printed the failures but still exited 0).
- New tools/guards_test.py checks all of this.
- App code unchanged.
### Files
tools/guard.py (new), tools/guards_test.py (new), 74 tools/*.py files (one import line each), tools/field_faces_test.py, qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md, version.json, sw.js, index.html.
### Tests
- Before (baseline): ae27e5e testfix after-run 71 passed / 0 failed.
- guards_test: 7 passed / 0 failed (it loads the app on 127.0.0.1, the only local address where the app registers its service worker, so the blocking check is real). Single runs: nav 99/0, ghost_pick 22/0, field_faces 54/0, offline 12/0 (service worker still allowed), league 61/0, casual3d 26/0, clarity 16/0, whatsnew 33/0.
- After: full regression 72 passed, 0 failed (3084 s, guards_test included), commit 332d105 tree.
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-11-01-0058-stubtests): ghost_pick_test (BASE=live, guarded) 22 passed, 0 failed; guards_test on a fetched live copy 7 passed, 0 failed (1 Nov 2026, 01:58 AWST); version.json, newest whatsnew v and noindex checked.

## v2026-10-31-2302-testfix (2026-10-31)
### What changed
- Queue: check the failing tests. The six long-standing failures were test problems, not app faults:
- nav, real, ghost and field_faces used fixed port 8765 and photos_test used fixed port 8799. Other local servers hold those ports on the test machine, so the tests loaded the wrong page ("waiting for [data-tester=nathe]") or could not start. New tools/freeport.py gives each test a free port chosen by the system, or ST_PORT if set. run_regression starts the field_faces server on a free port and passes it as ST_PORT; run on its own, field_faces starts its own server. No other server is stopped or touched.
- photos_test now stubs the ntfy relay, so it never sends to the real relay.
- vegas_test had two stale checks: the round header (now "20yd · 40cm 3-spot" with End 4 of 10) and a one-phone relay check that counted other matches' sends; it now counts only this match.
- App code unchanged.
### Files
tools/freeport.py (new), tools/nav_test.py, tools/real_test.py, tools/ghost_test.py, tools/field_faces_test.py, tools/photos_test.py, tools/vegas_test.py, qa/run_regression.py, whatsnew.js, CHANGELOG.md, version.json, sw.js, index.html.
### Tests
- Before (baseline): df2537f ghostx after-run 65 passed / 6 failed (nav, real, field_faces, ghost on port 8765; vegas 58/2; photos_test on port 8799).
- Single runs: with ports 8765 and 8799 still held by other local servers: nav 99/0, real 250/0, ghost 92/0, field_faces 54/0, photos 29/0, vegas 60/0.
- After: full regression 71 passed / 0 failed (3090s), with ports 8765 and 8799 still held by the other local servers. photos_test now passes inside the regression, so no separate free-port run is needed.
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-10-31-2302-testfix): on a fetched copy of the live site at 23:59 AWST, photos_test 29 passed / 0 failed and field_faces 54 passed / 0 failed; noindex present. (nav_test cannot point at a live URL, so these two were run instead.)

## v2026-10-31-2206-ghostx (2026-10-31)
### What changed
- Queue: ghost match X count. The ghost result card now shows "X count: you N, ghost M." (with "Level on points. " first on a draw) when the ghost has arrow values, is not a total-only ghost, and either of you shot an X.
- Display only; who wins is unchanged and no saved data changed.
### Files
insights.js, tools/ghostx_test.py (new), qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md, version.json, sw.js, index.html.
### Tests
- Before (baseline): the pbplain after-run on identical app code apart from this change (8791f05): 64 passed / 6 failed, the known five (nav, real, field_faces, ghost need port 8765, held by another local server; vegas 58/2) plus photos_test (its port 8799 is held by an unrelated local server; 29/0 on a free port).
- ghostx_test: 8 passed / 0 failed (old code: 6 passed / 2 failed).
- After: full regression 65 passed / 6 failed (3082s). The 6 failures are the same known environmental ones as before: nav, real, field_faces and ghost (port 8765 held by another server), vegas 58/2, photos_test (port 8799 held). photos_test run on free port 8981 with ntfy stubbed: 29 passed / 0 failed. ghostx_test 8/0 in the regression.
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-10-31-2206-ghostx): ghostx_test 8 passed / 0 failed on the live URL at 23:00 AWST; noindex present.

## v2026-10-31-2113-pbplain (2026-10-31)
### What changed
- Queue C2: removed the party emoji from the New PB message at the end of a shoot (app.js). The wording is unchanged.
- tools/pbnote_test.py gains a check that the PB message has no emoji.
- Not changed (outside this item): the win streak line in the ghost match card still has its flame symbol.
### Files
app.js, tools/pbnote_test.py (new check), whatsnew.js, CHANGELOG.md, version.json, sw.js, index.html.
### Tests
- Before (baseline): the avrelay after-run on identical app code apart from this change (e67fa0e): 64 passed / 6 failed, the known five (nav, real, field_faces, ghost need port 8765, held by another local server; vegas 58/2) plus photos_test (its port 8799 is held by an unrelated local server; 29/0 on a free port).
- pbnote_test: 14 passed / 0 failed (the new check fails on the old code).
- After: 64 passed / 6 failed, the same six as before (known five plus photos_test on its held port 8799); photos_test on a free port with the relay stubbed: 29 passed / 0 failed. pbnote_test 14/0 in the run.
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-10-31-2113-pbplain): pbnote_test 14 passed / 0 failed (31 Oct 22:06 AWST, relay stubbed); version.json, the top whatsnew note and noindex checked.

## v2026-10-31-2016-avrelay (2026-10-31)
### What changed
- Queue C1: in admin view (Nathe viewing another tester's app, read only) the background sync loops still ran; every send was blocked, but each try was logged and could raise the read-only notice. Now the league, casual, match, name, calendar and photo background sync does not run at all in admin view, quietly (logged once each as relay-skip in window.__avBlocked).
- Normal use is unchanged; no saved data changed.
### Files
h2h.js, league.js, casual.js, names.js, calsync.js, photos.js, tools/avrelay_test.py (new), qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md, version.json, sw.js, index.html.
### Tests
- Before (baseline): the bowfilter after-run on identical app code apart from this change (4c2a6a7): 64 passed / 5 failed, only the known five (nav, real, field_faces, ghost need port 8765, held by another local server; vegas 58/2).
- avrelay_test: 10 passed / 0 failed (old code: 8 passed / 2 failed).
- After: 64 passed / 6 failed: the known five (nav, real, field_faces, ghost need port 8765, held by another local server; vegas 58/2) plus photos_test, because its fixed port 8799 was taken from 19:54 by an unrelated local server (it failed the same way on the previous release's code). photos_test run on a free port: 29 passed / 0 failed on this release and on 4c2a6a7. avrelay_test 10/0 in the run.
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-10-31-2016-avrelay): avrelay_test 10 passed / 0 failed (31 Oct 21:12 AWST, relay stubbed); version.json, the top whatsnew note and noindex checked.

## v2026-10-31-1922-bowfilter (2026-10-31)
### What changed
- Queue B3: the Analysis bow filter only listed bows found in your results, plus All bows. It now always lists Compound, Recurve, Barebow and Longbow (Other only appears when a shoot has no bow type), with no All bows, and starts on the archer's own bow.
- Bow names from results are matched without caring about capitals.
- Display only; no saved data changed.
- tools/redesign_test.py: its bow-filter check now expects the four bow types instead of the old list.
### Files
analytics.js, tools/bowfilter_test.py (new), tools/redesign_test.py (expected bow list), qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md, version.json, sw.js, index.html.
### Tests
- Before (baseline): the pbbest after-run on identical app code apart from this change (e38c1b6): 63 passed / 5 failed, only the known five (nav, real, field_faces, ghost need port 8765, held by another local server; vegas 58/2).
- bowfilter_test: 10 passed / 0 failed.
- After: 64 passed / 5 failed, only the known five (nav, real, field_faces, ghost need port 8765, held by another local server; vegas 58/2), bowfilter_test 10/0 and redesign_test 142/0 in the run.
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-10-31-1922-bowfilter): bowfilter_test 10 passed / 0 failed (31 Oct 20:15 AWST); version.json, the top whatsnew note and noindex checked.

## v2026-10-31-1828-pbbest (2026-10-31)
### What changed
- Queue B2: Personal bests listed official results only. They now also count this phone's finished practice shoots, every round type (outdoor, indoor, field, Vegas, practice and own rounds, and a new 3D group). A practice shoot joins the official round with the same name, or gets its own row.
- Each score is labelled practice or official; the card heading reads "My best scores, practice and official".
- Display only: nothing is stored, the official ghost lists are unchanged, no saved data changed.
### Files
best.js, tools/pbbest_test.py (new), qa/run_regression.py and qa/regression.md (new Personal bests area), whatsnew.js, CHANGELOG.md, version.json, sw.js, index.html (?v= bump).
### Tests
- Before (baseline): the pbnote after-run on identical app code (caa964f): 62 passed / 5 failed, only the known five (nav, real, field_faces, ghost on port 8765; vegas 58/2).
- pbbest_test: 17 passed / 0 failed.
- After: 63 passed / 5 failed, only the known five (nav, real, field_faces, ghost need port 8765, held by another local server; vegas 58/2), pbbest_test 17/0 in the run.
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-10-31-1828-pbbest): pbbest_test 17 passed / 0 failed (31 Oct 19:21 AWST); version.json, the top whatsnew note and noindex checked.

## v2026-10-31-1646-pbnote (2026-10-31)
### What changed
- Queue B1, PB note (Needs Nathe's decision in QA audit A: "your PB" in the finish compare card counted official results while the Personal best line at the finish was practice-only). Fixed so both use the same scores: the Personal best note at the end of a shoot now counts the same earlier shoots as "your PB" / "previous PB" in This shoot vs your usual (practice and official results for the round, full rounds only, earlier dates), so the two can never disagree.
- Wording: "New PB for this round, beating N." / "Equal to your PB for this round." (the word practice is gone, as it now counts official results too), and a small line under it: "Your PB counts your practice and official scores for this round, full rounds only." "First time you have scored this round here." is unchanged. The party emoji in the message is left for its own release (queue C2).
- If the analysis code is not loaded, the note falls back to the old practice-only best, so nothing breaks.
- The Best Score row and everything else on the card are unchanged; no saved data changed.
- What's new: one plain-text note; the fullround note now names its commit 8c8bfb8.
### Files
app.js (pbPrev helper + roundSummary note), tools/pbnote_test.py (new), qa/run_regression.py and qa/regression.md (new PB note area), whatsnew.js, CHANGELOG.md, version.json, sw.js (rebuilt with tools/build_sw.py), index.html (?v= bump).
### Tests
- pbnote_test (new): 13 passed / 0 failed. On the old code (8c8bfb8) 6 passed / 7 failed, so the test catches the old behaviour (practice-only note, "beating 590" while the card shows an official 640).
- whatsnew_test 33/0.
- Before (baseline): the fullround after-run (8c8bfb8): 61 passed / 5 failed, only the known five: nav, real, field_faces, ghost ("waiting for [data-tester=nathe]": these four use port 8765, which another local app's server already holds on the test machine, so they load the wrong page; fixed in the failing-tests release) and vegas 58/2 (two stale checks, same release).
- After: 62 passed / 5 failed (3041 s), the same known five only (nav, real, field_faces, ghost on port 8765; vegas 58/2). pbnote_test 13 passed / 0 failed.
- Live (version.json v2026-10-31-1646-pbnote, confirmed 31 Oct 18:27 AWST, commit caa964f): pbnote_test 13 passed / 0 failed.

## v2026-10-31-1642-fullround (2026-10-31)
### What changed
- Data integrity check (paid-ready programme item 1). The Vegas 300 report (End 3 blank in the ghost table, End box 0 while Prog 144) was root-caused on 26 Oct: End 3 was saved (30) and the total 144 was right; the tied 30-30 end was drawn white on white in the light theme, fixed in v2026-10-26-1955-ghosttie (c1072bd). End box 0 on a new, empty end is by design (the box shows the end being shot). Re-checked today: no data fault.
- New automated full-round check, tools/fullround_test.py (WebKit, 390 px, touch, installed iPhone app emulated). Every round offered in Score is scored start to finish by real taps on the keys with seeded random arrows: WA 720 x3, Short and Junior Canberra, Indoor WA 18 m, Australian Indoor 18 m, WA 90/70/60/1440, AA 50/1440, WA 60/900, Indoor WA 25 m and Combined, the three WA Field rounds (gold/black), Vegas 300 and Vegas 300 (18 m), both practice rounds, ABA Interclub 3D, a custom block round (full face then 6-ring) and a custom 3D round, plus a League 300 week (Onion Shed, Vegas 300 18 m, relay mocked) and a Peel group card two-day competition (three test archers, Day 1, Day 2, Competition complete).
- Checked for each: every end on the sheet (arrows highest first, End box, running total), the finish (round finishes by itself when full, the X/10 or 6/5 counts and total), the Score row, the saved record (every arrow, hits, total, counted as a finished shoot), the record unchanged after reloading the app, the Past sessions row total, and Open from Past sessions showing the same ends and total. League: the league record and the copy in my sessions. Peel: every target per archer, archer chips, days unchanged after reload, event and Competition complete totals equal Day 1 + Day 2, nothing written into the archer's own sessions. No page errors.
- Clout is not a scored round in the app (it only appears in the official results arrow table), so there is no clout check.
- App code unchanged. What's new: one plain-text note; the clarity note now names its commit 99bc9de.
### Files
tools/fullround_test.py (new), qa/run_regression.py and qa/regression.md (new Full round area), whatsnew.js, version.json, sw.js (rebuilt with tools/build_sw.py), index.html (?v= bump).
### Tests
- Before (baseline): the clarity after-run on identical app code (99bc9de): 60 passed / 5 failed, the known nav, real, field_faces, ghost ("waiting for [data-tester=nathe]") and vegas 58/2.
- fullround_test: 409 passed / 0 failed. Every failure found: none in the app. (Test-side fixes while writing it: keys re-read each end for block rounds; League sheet read from its own table; Nathe's 17 May 2025 paper-sheet ABA seed, added by aba.js by design, excluded from the Peel "own sessions" check.)
- After: 61 passed / 5 failed, the same known five. (league_test failed once in that run because I ran a changed copy of it on the same port at the same time; rerun alone on 8c8bfb8: 61 passed / 0 failed.)
- Live (https://nfstride1-ux.github.io/scoretool-demo/, version.json v2026-10-31-1642-fullround): fullround_test 408 passed / 1 failed. Every score check passed (all ends, totals, counts, saved records, reloads). The one failure is a page error during the league part: "Can't find variable: squad", seen only on the live site, not locally, and app code is unchanged in this release, so it is older than this release. Likely cause: on a slow load a screen draw runs before squads.js has arrived. Noted for the Level 1 live diagnostic; not fixed here.

## v2026-10-31-1409-clarity (2026-10-31)
### What changed
- Microsoft Clarity (Nathe, 31 Oct, approved: project z660yw0kiw, to see how the app is used). New clarity.js, loaded from the page head: the official Clarity snippet, which adds https://www.clarity.ms/tag/z660yw0kiw as an async script.
- Masking: every typed field (text, search, email, phone, number, textarea, select and the like) gets data-clarity-mask="true" as soon as it is drawn, including fields drawn later on any screen (a MutationObserver), so names, emails, notes and messages are never sent. Tick boxes, radio buttons and buttons are left alone. Strict masking is also set in the Clarity dashboard.
- Privacy line, plain text, in Me > Settings & help (Settings card): "We use Microsoft Clarity to see how the app is used (taps and scrolling) so we can improve it; typed details are hidden."
- Service worker: clarity.ms requests are passed straight through (an explicit hostname check before the existing cross-origin rule); nothing from clarity.ms is cached.
- Offline: if clarity.ms cannot be reached the script just fails to load and the app carries on; the app still reopens from the cache with no signal.
- Automated test browsers (navigator.webdriver) load nothing, so test runs are not recorded and every other suite sees the app exactly as before.
- analytics.js (the in-app Analytics) is unchanged. There is no GoatCounter in this app, so there was nothing there to change.
- What's new: one plain-text note; the endviewer note now names its commit 0f46036.
### Files
clarity.js (new), index.html (one script tag in the head), app.js (the privacy line in the Settings card), tools/sw_template.js and sw.js (clarity.ms pass-through, rebuilt with tools/build_sw.py so clarity.js is precached), whatsnew.js, version.json, tools/clarity_test.py (new), qa/run_regression.py and qa/regression.md (clarity_test in App shell).
### Tests
- Before (baseline): full regression on code identical to origin/main 0f46036: 59 passed / 5 failed, the known nav, real, field_faces, ghost ("waiting for [data-tester=nathe]") and vegas 58/2.
- New clarity_test (WebKit, 390 px, touch, installed iPhone app emulated; then Chromium with the service worker): 16 passed / 0 failed. Snippet once, async, right project; 17 typed fields masked across Me, Settings, Send a suggestion and Following, and fields drawn later; privacy line word for word; nothing loaded in test browsers; clarity.ms unreachable: every tab draws, no page errors; no clarity.ms entry in the service worker cache; offline reopen works.
- whatsnew_test after the bump: 33 passed / 0 failed.
- After: full regression 60 passed / 5 failed out of 65 suites (the new clarity suite passed, 16 / 0). Same known nav, real, field_faces, ghost and vegas 58/2 as before; nothing new failed.

## v2026-10-31-1345-endviewer (2026-10-31)
### What changed
- End by end plot viewer (Nathe via Archery Coach, 31 Oct: each end's target face with that end's arrows plotted arrow by arrow, numbered in shot order, at the true size already used; swipe left and right between ends, plus arrow buttons; "End 3 of 10" and the end total; three spots on 3-spot faces). Clarification from Nathe the same day: only after a shoot is finished, so the end-of-shoot summary and Open on a finished shoot in Past sessions, and nothing on the live scoring screen changes.
- New card "End by end" on a finished shoot's sheet (`scoreSheet` with `fin`), under the shoot comparison. One end at a time: End k of N, the end total and the running total, the face with only that end's arrows (three spots for that end on 3-spot faces, else the face the shoot was plotted on), each arrow drawn exactly as on the rest of the card (true shaft size on new shoots, the old line-cutter size on old ones) with a numbered badge, and a list of the end's arrows with their scores (keypad arrows listed as not plotted). The face keeps one zoom for the whole shoot so it does not jump between ends.
- Moving between ends: swipe left or right on the face (touch, mostly sideways, more than 40 px; a vertical swipe still scrolls the page), the Previous end / Next end buttons (48 px, stop at the first and last end), or the left and right arrow keys. The page does not jump.
- Shot order: completed ends have always been saved highest score first (`sortEnd`), and the shot order was only kept in memory for undo, so it was never saved. New plotted arrows now carry their shot number in the end (`sn` on the plotted point, set in `putArrow` and kept on a fix, carried with the arrow when the end is sorted). Nothing else about the save changes and the scoring screen shows exactly the same thing. Older shoots, and ends with a keypad arrow, have no shot numbers, so the viewer numbers them in the saved order and says so on the card. No saved shoot is changed or recalculated.
- Not included: casual and league shoots (they have their own screens and their own analysis card); the League Next tap is not touched (on hold).
### Files touched
shotview.js (new `endViewHTML`, `endViewBind` and helpers; `shotPts` passes `sn` through), app.js (`scoreSheet` adds the card and binds it on finished shoots only; `putArrow` records `sn`), style.css (`.evcard`), help.js (End by end line under Arrow plot), tools/endview_test.py (new), qa/run_regression.py and qa/regression.md (endview_test added to Solo scoring), whatsnew.js, CHANGELOG.md, sw.js, index.html, version.json.
### Tests run
- Before (baseline): full regression on code identical to origin/main 7b8b2ed: 58 passed / 5 failed, the known nav, real, field_faces, ghost ("waiting for [data-tester=nathe]") and vegas 58/2.
- Targeted on this change: endview 40/0 (new; WebKit, the iPhone engine, at 390 px with touch, emulating the installed home-screen app), plot3spot all pass, arrowsize 59/0, linecut 14/0, shotview all pass, spotgroups 81/0, colourblind 20/0, ausindoor all pass.
- Live scoring screen unchanged: endview_test compares the scoring screen HTML at four points (before the first arrow, mid end, end just completed, score sheet during the shoot) with the 7b8b2ed snapshot, all four identical, and checks that no viewer appears there.
- After: full regression 58 passed / 6 failed out of 64 suites (the new endview suite passed, 40 / 0). The failures were the same known nav, real, field_faces, ghost and vegas 58/2, plus whatsnew_test, which was run before the version bump while the newest note still had a placeholder version.
- whatsnew_test after the bump (the arrowsize note now names its commit 7b8b2ed): 33 passed / 0 failed.

## v2026-10-30-2036-arrowsize (2026-10-30)
### What changed
- Arrow size (Nathe, 30 Oct: "We need to choose arrow size. Because I'm shooting 23s and the target should not be touching X from outside of the 10. If someone was shooting 27s it would. And if someone was shooting thin arrows it would be inside the lines with gaps between lines."). Cause: every arrow marker was drawn at the line-cutter scoring radius or a fixed dot, not the shaft: on a 40 cm 3-spot the scoring-face dot was 13.3 mm wide, the plot card 14 mm, the single face 10 mm. A 23 shaft is 9.1 mm.
- On new Just me shoots, arrows are now drawn at the true shaft diameter on the real face size everywhere they appear: the scoring face and loupe, the end-of-shoot card ("Where this shoot landed" and the three spots strip), Past sessions, the Analytics Arrow plot and the ghost face. The marker's outer edge is the shaft edge.
- New Arrow size picker per shoot, beside the target face while scoring, shown only until the first arrow is plotted (then the size is shown as text and is fixed; the Past sessions card shows it as text): 27, 26, 25, 24, 23, 22, 20, 19 (64ths of an inch, so 23 = 23/64 in = 9.13 mm, the WA shaft-size convention), thin shafts at Easton's published outside diameter (X10 Parallel Pro 4MM by spine, e.g. 610 = .218 in = 5.54 mm; 3.2MM 600 = .194 in), and Custom mm (3 to 12 mm). It starts on the arrow set ticked in My arrows (SuperDrive 23 -> 23/64 in); with no set, 23/64 in. A new shoot (`startRound`) is saved with `lcT:1` and `arrowD` {k, mm} locked from that default; the picker can change it only before the first plotted arrow.
- Geometry check (40 cm face, 10 ring radius 20 mm, X radius 10 mm): a 23 sitting just inside the 10 line reaches 0.87 mm short of the X line; a 27 in the same place crosses it by 0.72 mm; a thin 610 centred between the lines leaves 2.2 mm each side.
- Scoring change (Nathe chose option A, 30 Oct): line cutters on new Just me shoots (`lcT:1`) are scored with the shoot's true arrow radius (`arrowLC`, passed to `plotScore` through `tapScore`), so the drawn edge and the score agree. A 23 now cuts the line only within 4.56 mm, instead of the old fixed 7 mm on 3-spot faces and 5.6 mm on other faces; a borderline arrow just outside that scores the lower ring. Bug faces keep their own rule.
- Old shoots are never recalculated: sessions without `lcT` keep their stored ends untouched and are still drawn at the old line-cutter size that scored them (byte-identical SVG to before), so plot3spot's promise (each arrow touches the ring it scored) holds for old and new shoots. Casual and league shoots are not started by `startRound`, so they keep the old allowance for now.
- Colour-blind mode keeps its larger labelled markers. The tuning lab dots are unchanged.
- Not added: a Pandora 600 size (no maker outside diameter found); use Custom mm.
- Release (2) v2026-10-30-1840-spotgroups after deploy, recorded here: live version.json confirmed; live spotgroups_test 81 passed / 0 failed; live regression (Solo scoring area, `--live`): 18 passed / 4 failed, the known nav, real, field_faces ("waiting for [data-tester=nathe]") and vegas 58/2 failures, spotgroups_test 81/0 and plot3spot pass; LIVE smoke 22 ok / 0 fail; live screenshots /workspace/shots-spotgroups/live/.
### Files touched
app.js (arrow size options, parsing, `arrowMM`, `arrowRU`, `arrowPick`, picker change handler, `arrowLC`, `plotScore` and `tapScore` line-cutter radius, `startRound` sets `lcT`/`arrowD`, picker only before the first arrow, `arrowDot` and `faceSVG` draw at shaft size), shotview.js (`shotPts` shaft radius for `lcT` shoots only, `plotSvg`/`cleanSvg`/`spotsSvg` shaft edge, size text on the card), insights.js (ghost face), style.css (`.shsz`, `.arrowsz`), help.js (Arrow plot), tools/arrowsize_test.py (new), tools/linecut_test.py (new: borderline arrow scores 9 on a new shoot, old saved shoot keeps its 10 byte-for-byte), tools/ausindoor_test.py (its plotted == scored check now uses the shoot's own line-cutter rule, `arrowLC` for new shoots, 0.035 for old ones), qa/run_regression.py and qa/regression.md (arrowsize_test and linecut_test added to Solo scoring), whatsnew.js, CHANGELOG.md, sw.js, index.html, version.json.
### Tests run
- Before (baseline): full regression on code identical to origin/main 4369eee (release 2 after run): 55 passed / 6 failed, the known nav, real, field_faces, ghost ("waiting for [data-tester=nathe]"), vegas 58/2 and custom3d (passes on rerun).
- Targeted on this change: plot3spot 18/0, arrowsize 59/0, linecut 14/0, shotview 38/0, spotgroups 81/0, colourblind 20/0 (baseline 20/0).
- After: full regression 55 passed / 8 failed (2 more suites than before: arrowsize, linecut). Same known nav, real, field_faces, ghost, vegas 58/2, custom3d failures, plus ausindoor (its check hard-coded the old 0.035 allowance; under option A the new shoot correctly scored 10 where the old rule said X; check updated to the shoot's own rule) and sightseed (255 s box timeout). Rerun alone: ausindoor all pass (33 ok), sightseed 32/0, custom3d 55/0.

## v2026-10-30-1840-spotgroups (2026-10-30)
### What changed
- Arrow plot sight guide (Nathe, 30 Oct, 30-arrow vertical 3-spot shoot: "Each target has different landing locations for each target, that clearly means something is not correct either with form or bow. Windage could move over to the right slightly. You need to do better with this analysis." and "The point is to try get all arrows center of the X.").
- Every group is now measured against the exact centre of the X (the centre of the face on field faces), in mm on the true face size (40 cm face: 200 mm per face radius unit). The "centred" tolerance is gone.
- Each offset shows its standard error (SD / sqrt(n), at least 1 mm). A sight move with direction and amount is given only when the offset is bigger than that (and at least half a ring step of 0.05 rings); otherwise "no change yet" with the reason. A move under one ring says "a little". Still "move the sight towards the group".
- 3-spot faces: new "Each spot" table (arrows, left/right, up/down, spread in mm per spot). Spot pairs are compared; a difference bigger than both a quarter ring and twice the combined standard error raises a flag: the spots land in different places, the sight is the same for every spot, so look at head and body position, bow cant (level bubble on each spot) and anchor first. Otherwise it shows the biggest difference and how big it would need to be.
- Unchanged: the 3-spot strip, the plotted data, the drawing, scores, saved data (nothing is written).
- Job 1 (v2026-10-30-1657-landedface) after deploy, recorded here: live regression 7 passed / 1 failed (field_faces, the known "waiting for [data-tester=nathe]" box timeout); LIVE smoke 22 ok / 0 fail; live card screenshots in /workspace/shots-landed-face/live-*.png.
### Files touched
shotview.js (`group` per-spot stats and mm, `guide`, `spotShift`, usual group text), style.css (`.shg-flag`), help.js (Arrow plot), tools/shotview_test.py (sight guide checks use the standard error), tools/spotgroups_test.py (new), qa/run_regression.py, qa/regression.md, whatsnew.js, CHANGELOG.md, sw.js, index.html, version.json.
### Tests run
Baseline, untouched origin/main d76beb7 (full `python3 qa/run_regression.py`, 2565 s): 54 passed / 6 failed, all known box issues: nav_test, real_test, field_faces_test, ghost_test ("waiting for [data-tester=nathe]"), vegas_test 58/2 (stale), sightest_test (waiting for #smest).
After (this build, full run, 2785 s, 63 suites with spotgroups_test added): 55 passed / 6 failed: the same nav, real, field_faces, ghost and vegas failures; sightest_test passed; custom3d_test failed once (the Archery Calendar prompt covered a button) and passed 55/0 on a rerun, also 55/0 on the base. tools/spotgroups_test.py 81 passed / 0 failed, shotview_test all pass, plot3spot_test pass.
Logs on the build box: /workspace/spotgroups-baseline-regression.log, /workspace/spotgroups-after-regression.log. Screenshots (test data only, 390 px and desktop, light and dark, before and after): /workspace/shots-spotgroups/. Live results: recorded in the next release.

## v2026-10-30-1657-landedface (2026-10-30)
### What changed
- "Where this shoot landed" single face (Nathe, 30 Oct, 30-arrow vertical 3-spot shoot: "I like the 3 spot idea under. But the single face looks shit", "It doesn't look correct"). Cause: the card's big face used the Analytics plot drawing, which lays a navy layer at 50% through a radial mask over the face (the "darker face = no arrows there" shading). That darkened every ring (teal blue, maroon red, dull gold) and smeared a glow over the rings; and it always showed rings 6 to 10, so a group inside the 9 ring was small and the arrows, the gold group-centre cross and the usual-group circle piled on top of each other.
- Now the card draws a clean face (`cleanSvg` in shotview.js, used only by `shotPlotCard`): the same WA colours as the 3-spot faces, no glow or shading, zoomed to only the scoring rings the arrows (at their real size) and group circles reach (never fewer than rings 8 to 10). Draw order: rings, usual group (dashed blue), this shoot's group (dashed navy), arrows, then a small usual-group centre ring and an open gold cross with a navy outline and a gap in the middle so the arrows under it stay visible. The legend drops "darker face = no arrows there" because that shading is gone.
- Unchanged on purpose: the three spots strip, the Analytics Arrow plot (`plotCards` still uses the old drawing), the rest of the legend, the plotted positions, field faces (gold and black, full face, no zoom), saved data (nothing written).
### Files touched
shotview.js (`cleanSvg` new, `faceSvg` optional zoom, `plotSvg` clean option, `shotPlotCard`), whatsnew.js, CHANGELOG.md, sw.js, index.html, version.json.
### Tests run
Baseline, untouched origin/main 07197e1 (`python3 qa/run_regression.py`, run in two parts because the box cleared /tmp mid-run): 57 passed / 5 failed. vegas_test 58/2 (the known stale failure); nav_test and real_test could not find the `nathe` tester ("waiting for [data-tester=nathe]"), the known box issue; field_faces_test failed the same way in part 1 and passed (54/0) in part 2; whatsnew_test 32/1 because on origin/main the newest What's new entry (v2026-10-28-2103-plot3spot) does not match version.json (v2026-10-28-2112-auto, the pre-commit hook relabelled the follow-up commit).
After (this build, full `python3 qa/run_regression.py`, 2530 s): 56 passed / 4 failed. vegas_test 58/2 (same stale failure); ghost_test "waiting for [data-tester=nathe]" (the known box issue, it also failed this way before); h2h_test timed out on one click and passed 90/0 when re-run alone (it does not touch this card); whatsnew_test 32/1 for the same version.json mismatch, fixed in this release by bumping sw.js in the same commit as the What's new entry (re-run below). nav_test, real_test and field_faces_test passed this time. Targeted: shotview 38/0, plot3spot 18/0, casual_indoor 36/0, league_indoor 35/1 (the same "analysis directly under the score card" failure on untouched origin/main, not caused by this change).
Screenshots before and after (30-arrow vertical 3-spot test shoot, Australian Indoor 18m, test data only, 390 px and desktop, light and dark): /workspace/shots-landed-face/ on the build box.

## v2026-10-28-2103-plot3spot (2026-10-28)
### What changed
- Arrow plot on 3-spot shoots (Nathe, 28 Oct, Vegas 300, 30 plotted arrows: "I only hit the 9 4 times, this looks like it hit all over the place. Line the 3 spot targets properly"). Investigated first: positions are NOT wrong. Tap, score and plotted position agree on the Vegas triangle and the vertical face, at Z1 and Z2, Vegas 300 solo and Indoor 18m (probe tapping known offsets per spot, then comparing `shotPts` with the intended offset: all within rounding). Cause is visual: every arrow was drawn as a tiny dot at its centre, but scoring lets the arrow's edge (3-spot 0.035, other faces 0.028) touch a ring, so X, 10 and 9 arrows sat visibly outside the ring they scored in and the group looked wider than the score. With 16 X, 10 tens and 4 nines the dots were all inside the 9 ring but looked loose.
- Now each arrow is drawn as a translucent circle at its real size (the same radius scoring uses) plus a centre dot, so a scored 9 touches the 9 ring and nothing outside it. Applies to the end-of-shoot card, Past sessions Open and the Analytics Arrow plot (all use `plotSvg`).
- New "three spots as on the target" picture under the combined plot: Vegas shows the real triangle (Spot 1 top left, Spot 2 top right, Spot 3 bottom), the vertical face a row of three, each with rings 6 to 10, its own arrows at real size, and a count per spot. The combined one-spot plot and sight guide are kept as they were.
- Old saved sessions: no data written or changed. Sessions without `face3` that were plotted on the full face still plot on the full face (no spots view); single-face sessions unchanged; 3-spot sessions replot from the same stored positions, so past Vegas and vertical shoots get the new picture too.
- Help (Arrow plot) and What's new updated.
### Files touched
shotview.js (`shotPts` carries arrow radius and spot, `plotSvg` arrows at real size, new `spotsSvg` in `plotCards` and `shotPlotCard`), style.css, help.js, whatsnew.js, qa/run_regression.py and qa/regression.md (plot3spot_test added to Solo scoring), tools/plot3spot_test.py (new), sw.js, index.html, version.json.
### Tests run
tools/plot3spot_test.py 18 checks, all pass (16 X / 10 tens / 4 nines Vegas shoot: exactly four 9s, each arrow scores the ring its edge touches, 10 per spot, triangle and vertical layouts, old full-face and single-face sessions untouched, nothing rewritten, no page errors). Full regression `python3 qa/run_regression.py` 54 passed / 6 failed (2270 s) on the pre-rebase build: vegas_test 58/2 is the known stale failure; nav_test, real_test, field_faces_test and ghost_test could not find the `nathe` tester in this box ("waiting for [data-tester=nathe]"), and fail the same way on untouched origin/main 6a3bf5c, so not caused by this change; whatsnew_test failed only because the new note had no commit hash yet (33/0 after). After rebase on 6a3bf5c re-ran plot3spot 18/0, shotview 38/0, zoompersist 59/0, whatsnew 33/0, offline 12/0.
After deploy: live at v2026-10-28-2103-plot3spot (5d9c7cd). `qa/run_regression.py --live` on plot3spot, shotview, zoompersist, whatsnew, offline: all pass; LIVE smoke 22 ok / 0 fail. plot3spot_test also run against the live URL (BASE env): 18/0, 390 px light screenshots taken.

## v2026-10-28-1948-zoompersist (2026-10-28)
### What changed
- Zoom now persists on the indoor 3-spot face (Nathe, 28 Oct, Just me vs ghost on Australian Indoor 18m vertical 3-spot: "keep the zoom as I set it, no reset every end, restart back to target 1 but keep the zoom unless I change it"). Root cause: release c2a35af (undozoom, 26 Oct) deliberately reset the shared zoom `PZ` on a spot tab tap, on a new end (`window._pzEnd`), on return from the sheet and, in Casual and League, on a new end (`window._csZk`); and `cur.spot` / `window._csSpot` were never reset at a new end, so the last spot (Spot 3) carried into the next end.
- Now one shared set of helpers in app.js (`zkLoad`, `zkSet`, `zkOpen`) keeps the zoom level the archer chose (Z1, Z2, Reset 3x) across spot tabs, ends and the sheet until the archer changes it, and stores it on the device (`scoretool.zoomk`, additive, so an app reload keeps it). Each new end starts on Spot 1 (only when the archer was on a specific spot; "All spots" is left as chosen). The spot tab tap re-centres the pan only.
- Covers every indoor 3-spot mode through the same code: Just me (including vs ghost), match nights (they use the Just me screen), Casual and League (casual.js `csFaceBind` / `csFaceHtml`). In Casual with mixed faces each archer's own face decides: a 3-spot archer keeps the zoom, a single-face archer still opens each end on the full face.
- Unchanged on purpose: single face and the field / bug faces still open every end on the full face; pinch and the pill behave as before; saved scores, plots and history untouched.
- Help (Plot your arrows) and What's new updated; undozoom_test's old "opens on the full face" checks now assert the kept zoom.
### Files touched
app.js (zkLoad / zkSet / zkOpen, new-end and spot tab handling, sheet return, applyZ), casual.js (csFaceHtml new-end spot, csFaceBind, spot tab, applyZ, keepZ), help.js, whatsnew.js, qa/run_regression.py and qa/regression.md (zoompersist_test added to Solo scoring), tools/undozoom_test.py (updated), tools/zoompersist_test.py (new), sw.js, index.html, version.json.
### Tests run
Baseline: origin/main 008ee14. New tools/zoompersist_test.py: 59 checks, all pass (Just me, Just me vs ghost, Australian Indoor triangular face, match night, Casual and League: Z2 set on Spot 3, Spot 2 keeps Z2, next end opens on Spot 1 at Z2, third end the same, change to Z1 and Z1 stays; reload read-back; single face unchanged). undozoom_test 46/0 after updating. Full regression `python3 qa/run_regression.py` 54 passed / 5 failed (2175 s) on the pre-fix build: vegas_test 58/2 is the known stale failure (unchanged); photos_test caught that the first build wrote the new `scoretool.zoomk` key just by opening a face (fixed: the key is only written once the archer picks a zoom other than Z1; photos_test now 29/0); peel_share_test, peel_comp_test and ghost_test could not reach the app because the box's /tmp/stwork/srv.py helper was missing, and passed when re-run alone (peel_share 26/0, peel_comp 52/0, ghost 92/0). After the fix re-ran photos, undozoom 46/0, zoompersist 59/0, casual 82/0, mixedface 59/0, whatsnew 33/0, offline.
After deploy (live v2026-10-28-1948-zoompersist, a2179d1): `--live` zoompersist_test 59/0, undozoom_test 46/0, casual 82/0, mixedface 59/0, photos 29/0, whatsnew 33/0, offline 12/0 and the live smoke (ghost picker) all passed. The live version.json showed v2026-10-28-1948-zoompersist.

## v2026-10-28-1314-mixedface (2026-10-28)
### What changed
- Per-archer target face in a Casual indoor shoot (Nathe, 28 Oct, shooting with Logan and Ema: "me and Logan shoot against each other, he on a Vegas face, I on a single 40 cm"; Ema is scored on Logan's phone). On Indoor WA 18m, Indoor WA 25m, Indoor WA Combined 25m + 18m and Australian Indoor 18m, every archer in the shoot now has their own Face: Three spot or Single face. At setup it sits beside each name (self, name-only friends and linked archers) and starts on the shoot's face; changing one archer never changes the others. On the score card a Face row shows for the archer being scored and can be changed until that archer's first arrow (it locks, and unlocks again if they Undo back to zero arrows, same idea as the Just me Face button).
- "Three spot" keeps the shoot's 3-spot layout (vertical or Vegas), so Logan stays on Vegas 3-spot. A single face is one 40 cm face at 18 m (60 cm at 25 m), keys X 10 9 8 7 6 5 4 3 2 1 M, and tap plotting + zoom when that archer is alone on the phone (several archers on one phone stay button-only, as before). Every archer sees only their own face's keys and ring values. Totals use the one X/10..1/M scale, so mixed faces compare directly; the Scores table tags each archer's face, the header names both faces, and a small "Different faces" note appears when they differ (like the ghost "Different face" note).
- Storage: host choices in `cs.fa{id:'single'|'three'}` (only written when someone actually chose); a linked archer's own change is `cs.sc[id].f`. Both travel in the relay snapshot (`csSnapParts` / `csMerge`), same permission rules as scores (host for self and name-only people, the linked person for themselves; the host's own phone ignores stale relay copies of `fa`). A saved own-session gets `face3:'single'` for a single-face archer (the field Just me single face already uses), `vegas`/`vert` otherwise. Shoots and sessions without per-archer data load and behave exactly as before; nothing already saved is rewritten.
- Match play on a mixed shoot uses the widest key set so nobody is blocked.
- Match nights (head-to-head and match night): Single face is now offered on the start screen (the same Three spot / Single face row as Just me), each archer on their own phone; the face rides in the shared state (`sf`), and a small "Different faces" note shows when the other archer is on a different face. `f3Can` now allows the in-scoring Face button for match-night sessions.
- Scope on purpose: Vegas 300 and Vegas 300 (18 m) are NOT in the per-archer choice (they stay 3-spot games so the Vegas analytics stay clean). Leagues are unchanged. League scoring rules, saved scores and history are untouched.
- Help (Casual shoot, Score steps) and What's new updated.
### Files touched
casual.js (csSplit/csAF/csMixed/csSetFace, csFace/csKeys/csEndFace per archer, setup and score-card Face rows, Scores table tags and note, relay), app.js (f3Can), h2h.js (start uses the remembered face, Face row, `sf` flag, note), help.js, whatsnew.js, tools/mixedface_test.py (new, added to the Casual shoot area of qa/run_regression.py and qa/regression.md), CHANGELOG.md, sw.js, index.html, version.json.

### Tests run
Baseline: origin/main 064db47 (singleface follow-up). New tools/mixedface_test.py: 59 checks (setup defaults and independent per-archer choice, Vegas 300 excluded, keys per archer, face lock and Undo, relay round-trip for a linked archer, mixed totals and note, old shoots unchanged, solo plotting on a single face, Australian Indoor, match play keys, match night face and note). This release: full regression `python3 qa/run_regression.py` 57 passed / 1 failed (2145 s). The one failure is vegas_test 58/2, the known stale one-phone relay checks (unchanged). casual_test 82/0, h2h_test 90/0, singleface 44/0, mixedface 59/0, whatsnew 33/0, league suites all pass.
After deploy (live v2026-10-28-1314-mixedface, ec1e13e): `--live --suite mixedface_test,whatsnew_test,casual_test` all passed (mixedface 59/0, casual 82/0, whatsnew 33/0) plus the live smoke 22/0 (ghost picker on the live site). The live version.json showed v2026-10-28-1314-mixedface. Suites run on fresh browser profiles with the relay stubbed; no real data written.

## v2026-10-28-0640-singleface (2026-10-28)
### What changed
- Single face for indoor rounds (Nathe via Coach, 28 Oct: "They just me scoring for indoor it has the three spot or the Vegas style face. Can you add the single face for those that can't shoot the three spot?"). On the Score start screen, Just me, Indoor WA 18m, Indoor WA 25m and Indoor WA Combined 25m + 18m now show a Face choice: Three spot (the default, exactly as before) or Single face. Single face is one full face per end (40 cm at 18 m, 60 cm at 25 m), scored X, 10 down to 1 and M with the same ring values as every other single-face target; plotting an arrow and zoom (Z1, Z2, Reset) work as on other single faces. Indoor keeps its normal colours (no purple).
- The choice is remembered in a new flag `S.face1` (independent of the vertical or Vegas 3-spot layout in `S.face3` and of Australian Indoor's own pick `S.face3a`); anyone who never picks Single face sees no change. The session stores `face3:'single'` (the field Australian Indoor 18m already used), so saved scores, totals, history, ghost match and the plotted-arrow views read it the same way. Existing saved sessions are not rewritten.
- Inside scoring, the Face button now cycles vertical 3-spot, Vegas 3-spot and single face on these rounds until the first arrow is plotted (same rule as Australian Indoor; positions are per face so the button locks after plotting).
- Ghost match says "Different face" when a past score was on the 3-spot and today is on the single face (or the reverse), the existing note, now for these rounds too.
- Scope on purpose: Just me only. NOT offered on Vegas 300 and Vegas 300 (18 m), on Casual, head-to-head match nights or leagues, on custom or ABA rounds, or on field and target rounds. League scoring is unchanged. Australian Indoor 18m keeps its own three-way pick (traffic light, triangular, single).
- Help (Score steps) and What's new updated; ausindoor_test's stale check "WA 18m: no extra face row" now checks the new Three spot / Single face row.
### Files touched
app.js (f3Name, f3One, f3Start, f3Can, f3Row, f3Bind, start-screen call, startRound, scoring Face button), insights.js (faceCls, faceLong, curCls, faceDiff call), help.js, whatsnew.js, tools/singleface_test.py (new, 44 checks, added to the Solo scoring area of qa/run_regression.py and qa/regression.md), tools/ausindoor_test.py (one stale check), CHANGELOG.md, sw.js, index.html, version.json.

### Tests run
Baseline: origin/main 23c3e1f (onion). New tools/singleface_test.py: 44 checks, all pass: default stays Three spot and a default start is unchanged; the choice only appears on Indoor WA 18m, 25m and Combined (not Vegas 300, Vegas 300 18 m, Australian Indoor, field, target); Single face gives keys X 10 9 8 7 6 5 4 3 2 1 M on one 40 cm face (60 cm at 25 m); plotted arrows score with the app's own ring values (full-face mapping, plotted == scored); zoom Z1/Z2/Reset; Face button cycles and locks after plotting; the choice is remembered across reload; saved session stores face3 single with positions and the same totals; ghost shows the Different face note; match nights (f3Pref) and Casual unchanged; existing saved sessions byte-identical; no page errors.
This release: full regression `python3 qa/run_regression.py` 51 passed / 6 failed (3177 s). vegas_test 58/2 is the known stale failure (unchanged). The other five were not code failures: nav_test, real_test, field_faces_test and ghost_test could not reach the app because a stray server from another job (/workspace/map-mockup) held port 8765 on the test box; re-run on a free port they pass (nav 99/0, real 250/0, field_faces 54/0, ghost 92/0). aba_test timed out once on the Archery Calendars prompt while the box was busy and passes on its own re-run (79/0). ausindoor_test: its stale check 'WA 18m: no extra face row' was updated to the new row and now passes. whatsnew_test 33/0, league 61/0, h2h 90/0, casual 82/0, offline 12/0.
After deploy (live v2026-10-28-0640-singleface, 9e73f2b): live copy of redesign 142/0, ausindoor, singleface (44 checks), pickers, whatsnew 33/0, offline 12/0, plus the live smoke (ghost picker on the live site); all passed. The live version.json shows v2026-10-28-0640-singleface. Suites run on fresh browser profiles; no real data written.

## v2026-10-27-1834-onion (2026-10-27)
### What changed
- Onion Shed Challenge restored (Nathe via Coach, 27 Oct, league starts Wed 28 Oct: "Re-create the onion shed challenge with the same rules as before. Add all the people that were there before plus the one person without the app. Keep the league scorer the same. Show the rules on the league page."). The removal was commit a639320 (v2026-10-26-2106-nopreset, 26 Oct 21:39 +0800; Nathe asked for it at 8:52 pm, that is the time of the request, not of the commit). Restored from the pre-removal code in a639320^ (lgPresetFix, lgSeed and the seed call, originally from 971b79b, 010ddb2 and 42ab94d) with the same name, host, members and added shooter.
- It is a NEW league record with the NEW code ONIONSH2. The old record (code ONIONSHD) is kept in storage byte-for-byte, stays hidden (not listed, not joinable, not invited, not counted toward the 3-league host limit) and nothing is read from or written to it, so the 26 Oct test scores can never leak into the real league, and the old relay topic's leftover posts are never used. Its saved scores are not deleted or changed.
- Members (same as the preset before it was removed): Nathe (host), Logan, Steven, Joseph, Michael, Dana, Tahuri, Estiaan, Nate, Danie (each scores on their own phone or a phone group), plus Lou Archer, who has no app and is scored by the host (guest id gleslie, "scored by host"). Phill stays excluded (LG_EXCL). "Anderson" (Nathe's one-word answer for the person without the app): Leslie is the only Anderson in the old preset, git history and the tester list. 11 archers, so ONIONSH2 is added to H2H_NOCAP like ONIONSHD was; every other league keeps the 10-archer cap.
- Seeding is additive and idempotent: on a member's phone the league is ADDED once when missing; if the phone already holds ONIONSH2 only missing members or the added shooter are appended to the end of the order (nothing removed, reordered or overwritten; weeks, current week and scores untouched). It is skipped if the user already has a visible league with the same name (no second Onion Shed) and is not re-added after the user removes it. People who are not members (Phill, anyone else) are never given it.
- Leslie: she is a guest of a fresh league, so she cannot be locked on Own phone; the host can still move her between Own phone and Phone 1-3 at any time after she has started (the existing reassign logic is unchanged) and her scores (keyed by archer and week) stay byte-identical (tested).
- Rules shown on the league screen (card at the top, plain text, no emoji, no purple, phone width). Wording: Nathe's 20 Oct 2026 rules (from memory) plus the app's own final text (LG_FINTXT): "Six 300s at 18 m on the vertical 3-spot." / "Each week for 5 weeks everyone shoots a 300 round, in person or over FaceTime." / "On the 6th day they all shoot another 300 together in person in the Onion Shed." / "The running total of all six 300s (maximum 1800, ties split on X count) sets the league table." / "Shoot-up match play happens on day 6 only, starting once everyone's day-6 300 is in. Final: 3 ends of 3 arrows, X = 10, no 12 dot. Ties: 1 arrow each, closest to the middle wins (host picks)." / "Entry is $10 each night, winner takes all, minus a jokey 75%." The old preset code itself contained no rules text; the $10, FaceTime and winner-takes-all lines exist only in Nathe's 20 Oct wording, which ends "minus a jokey 75%" (the 75% line needs Nathe to confirm). Only the Onion Shed league shows the card.
- Not touched: league scoring page (lgpage, lgnext), scoring, relay, snapshot merge (except the `since` cut-off is now a per-code table), the 10-archer cap for other leagues, saved scores, New league and Use the usual group.

### Files touched
league.js (LG_OLD, LG_PRESET with new code, LG_SINCE, lgIsPresetCode, lgPresetFix, lgSeed, lgCard seeding call, LG_RULES and lgRulesCard, join/invite/merge use the code check), h2h.js (H2H_NOCAP), help.js, whatsnew.js, tools/onionrestore_test.py (new, 52 checks, added to the League area of qa/run_regression.py), tools/nopreset_test.py (stale-by-design checks updated: a fresh phone now holds the restored league; the old ONIONSHD record checks are kept), sw.js, index.html, version.json.

### Tests run
Baseline (b262737, League area before changes): 5/5 (league_test 61/0, nopreset 29/0, leslie 17/0, lgscroll 19/0, lgpage 40/0). Full-suite baseline is the recorded e9285cf run (53 passed / 2 failed: vegas_test 58/2 known, custom3d load flake).
This release: full regression 53 passed / 3 failed (2051 s) on the final league.js: vegas_test 58/2 (known, same two checks as the baseline, unrelated) plus two stale-by-design failures found and fixed: league_test 'go-live: new user sees no leagues, no Onion Shed shown' (no longer true on purpose, updated: a new member sees only the restored ONIONSH2) and whatsnew_test 'every older note names its real commit' (lgnext's note said 'this release', now e9285cf). Re-run after those fixes: League area 6/6 (league_test 61/0, nopreset 29/0 with its stale 'fresh phone is not given the preset' checks updated, onionrestore 52/0, leslie 17/0, lgscroll 19/0, lgpage 40/0), whatsnew_test 33/0, offline_test 12/0. Everything else in the full run passed (incl. h2h 90/0, undozoom 46/0, casual 5/5, testers 189/0).
New onionrestore_test (52 checks): every member's fresh phone gets exactly one Onion Shed Challenge with identical record (no duplicate after reload); 10 testers then Leslie, 11 archers with no cap, other leagues still capped at 10, Phill not a member; Leslie scored by the host and the only Anderson; rules card present with the exact wording, no emoji, no purple, no overflow at 390 px; Leslie moved Own phone to Phone 1 and back with scores byte-identical; a phone holding the hidden 26 Oct record with scores keeps it byte-for-byte and gets the new league; a phone that already holds ONIONSH2 with saved scores gets no duplicate, missing members appended, week and scores untouched, re-run changes nothing; a same-name user league is left alone; Phill gets nothing; other leagues show no rules card.
After deploy (live v2026-10-27-1834-onion, e60ba0a): `--live --only league` League 6/6 (league 61/0, nopreset 29/0, onionrestore, leslie 17/0, lgscroll 19/0, lgpage 40/0), live smoke 22/0. Suites run on fresh browser profiles with the relay stubbed; no real relay submits and no tester's saved data touched.

## v2026-10-27-1045-lgnext (2026-10-27)
### What changed
- League scoring page (Nathe, 27 Oct: "The instant I click the 3rd score it changes to the next person. I don't want that. I want to push next."): when several archers share a phone, the card no longer moves to the next archer after the third arrow. It stays on that archer with the three arrows shown (score keys hidden) and a large Next button; Next moves on in the same order the old auto-advance used (skipping finished archers; after the last archer it goes round to the first archer still to shoot). Undo still takes back the last arrow, including the third (the keys come back and Next goes away until the third arrow is in again). After a finished 300 (10th end) the card also stays with a Next button.
- A single archer on their own phone (target face plotting) has nothing to move on to, so no Next button; unchanged.
- Display only. Casual, league scoring rules, the relay, the 10-archer cap and saved scores are untouched (a `lgNextArcher` helper replaces the advance loop that sat in `lgKey`; `lgKey` still saves exactly the same data).
- Last archer of the league: when the final arrow finishes the league the final shoot-up screen opens as before.
- Next hold is cleared when a scoring page is opened or left (a hold left over from earlier scoring made Leslie's card show Next instead of the keys in leslie_test; found by the full regression).
- Page jump fix (Nathe, 27 Oct: "I don't like the page flicking up. It doesn't do it when the targets are showing. Only when they are hidden."): on the league scoring page with Hide target on, the first arrow of each end scrolled the page so the Score card sat at the top of the screen (the target-fit placement `csAdFit` ran on every re-render even though there is no face to fit), and Undo did the same. `lgView` now keeps the current scroll position on those re-renders when the target is hidden, exactly as it does for the shared-phone keys, and Next keeps position too. With the target showing the fit placement is unchanged. Opening the page and Hide/Show target behave as before.

### Files touched
league.js (lgView scroll rule with hidden target, lgKey, new lgNextArcher, lgEntryCard hold state and Next button, Next handler), help.js, whatsnew.js, tools/lgpage_test.py (now also: hidden target, scrollY unchanged after the first arrow, later arrows, next end and Undo, and on a shared phone after the first arrow and Next; 40 checks), tools/league_test.py, tools/lgscroll_test.py (the only tests that assumed auto-advance; each now taps Next), CHANGELOG.md, sw.js, index.html, version.json (bump).

### Tests run
Baseline (e08c3cf, previous release): full suite 51/4 as recorded for lgpage; the only real failure was vegas_test 58/2 (known); the other three were the two tests that assumed the old layout (since fixed) and a load timeout.
This release: full regression 53 passed / 2 failed (4240 s): vegas_test 58/2 (known, unrelated); custom3d_test failed once from a calendar-prompt overlay intercepting a click under load and passes alone 55/0. All League suites 5/5 (lgpage 40/0 incl. new hidden-target and shared-phone scroll checks; lgscroll 19/0; league; leslie 17/0 after the hold-clear fix; ). Casual 5/5 except that overlay flake.
After deploy (live v2026-10-27-1045-lgnext, e9285cf): `--live --only league` League 5/5 (league 61/0, nopreset 29/0, leslie 17/0, lgscroll 19/0, lgpage 40/0), live smoke 22/0; custom3d_test alone on the new code 55/0 (the one full-run failure was a load flake).

## v2026-10-27-0815-lgpage (2026-10-27)
### What changed
- League scoring page (Nathe, 27 Oct, league starts Wed 28 Oct): tapping Score my week, Score group (Phone 1/2/3) or the added shooters now opens the scoring on its OWN page, laid out like Casual scoring: header card with a Back to league button, the Score card (archer chips, slots, X 10 9 8 7 6 M keys, Undo), a Scores table for the group (with an "Ends for each archer" list), the analysis card, and Refresh now plus a second Back to league at the bottom. The league screen is not changed: "One phone or own phones" (and the group buttons) stay where they were, "How it's scored" stays there, and Back to league returns to the same scroll position.
- A single archer scoring on their own phone still gets the target face to plot arrows (with Hide target), the same as Just me. Several archers on one phone use the buttons only, as Casual does. Archers still move on to the next one after the third arrow. The 10-archer cap is unchanged.
- Leaving by a tab or any other screen closes the scoring page, so reopening the league starts on the league screen. The in-app header back arrow on the scoring page also goes to the league screen.
- Display only. League scoring rules, relay, and saved scores (keyed by archer and week) are untouched; Back to league leaves the stored scores byte-identical (checked by the test).
- Also: lgscroll "After deploy" line filled in, and its What's new entry now points at ea09434.

### Files touched
league.js (lgView scoring page, Back to league, nav reset), lab.js (inner back arrow), help.js, whatsnew.js, tools/lgpage_test.py (new, 28 checks, port 8899, test-only league codes, relay stubbed so nothing is posted to a real topic), qa/run_regression.py (lgpage_test added to the League area), CHANGELOG.md, sw.js, index.html, version.json (bump).

### Tests run
Baseline (ea09434): lgpage_test fails the page checks (scoring does not open on its own page, no Back to league, no Scores card).
This release, full suite (56 suites, sequential, 2816 s): all pass except: vegas_test 58/2 (the same 2 stale checks as the previous releases, vegas.js untouched); leslie_test and lgscroll_test failed on the first run because they assumed the old inline scoring card (they clicked the league group buttons while scoring, and needed the page scrolled to find the keys); both tests were updated (go Back to league first; scroll down a little in setup) and now pass, leslie_test 17/0, lgscroll_test 19/0, league_test 60/0, nopreset_test 29/0, lgpage_test 28/0 (re-run of the League area 5/5). peel_scroll_test timed out under load while other tests ran; re-run alone 15/0.
After deploy (live URL, v2026-10-27-0815-lgpage, commit e08c3cf): version.json matched; League area 5/5 (league_test 60/0, nopreset 29/0, leslie 17/0, lgscroll 19/0, lgpage 28/0); live smoke 22/0; Casual area live pass.

## v2026-10-26-2235-lgscroll (2026-10-26)
### What changed
- League multi-archer scoring (several archers on one phone, e.g. Vegas 300 18m 3-spot, 7 archers on Phone 1): the page no longer jumps to the top after every arrow, Undo, face plot or background refresh. Reproduced with the new test on the previous deploy (a3cd686): the first score tap, Undo and a relay refresh all returned the page to y=0. Cause: `lgView` ended with `scrollTo(0,0)` on every render except the single-archer card, and every score tap, Undo and `lgTick` refresh re-rendered it. Fix (same kind as the Peel `pgscroll` fix d1d963d): `lgView` keeps the scroll position when the render was caused by a score tap, face plot, arrow delete, Undo or refresh (`window._lgKeep`), then nudges the keys fully clear of the nav and header. Choosing a different archer chip, opening a week and leaving it still start at the top.
- The active archer still moves to the next unfinished archer after the third arrow, as before; it just no longer scrolls the page.
- Display only. Scoring, saved scores and the relay are unchanged. Peel, Casual and Just me code is untouched (their tests were run).
- Casual "only 5 of 6 arrows" (WA 720 50m Compound): looked at a second time, still not reproduced and no code change. Checked: 1, 2, 4 and 10 archers; buttons and face taps (touch and mouse); 6th arrow as every key; widths 320, 360, 375, 390, 412 px; light and dark; a random run of 12 ends per archer with chip switching, Undo and relay refreshes mid-end (every complete end held 6 arrows); encode/decode for the relay (6 characters per end); merge rules. Nothing drops or caps an arrow at 5. Needs Nathe's screen recording or the exact steps.

### Files touched
league.js (lgView, score/plot/delete/Undo handlers, lgTick refresh), tools/lgscroll_test.py (new, 19 checks, port 8898), qa/run_regression.py, whatsnew.js, CHANGELOG.md, sw.js, index.html, version.json (bump).

### Tests run
Baseline (a3cd686, after the Leslie release): full suite as recorded for the Leslie release; lgscroll_test fails 6 of 19 on this code (page jumps to y=0 on the first tap, on Undo and on a refresh).
This release, full suite: all 56 suites run (parallel run a11). Passing: everything including lgscroll_test 19/0, league_test 60/0, nopreset_test 29/0, leslie_test 17/0, h2h, names, casual, just-me, peel suites. Six suites failed only from the parallel runner (shifted ports and load) and were re-run on their normal ports: offline 12/0, peel_comp 52/0, peel_share 26/0, field_faces pass, sightimport 43 ok/0 bad. vegas_test 58 passed, 2 failed: the same 2 checks fail on the previous release (a3cd686) and on earlier ones, in vegas.js code this release does not touch; they are on the failing-test investigation list. peel_test exit 2 is its known name bug; peel_scroll 15/0, peel_data 2/0, peel_next pass.
After deploy (live URL, v2026-10-26-2235-lgscroll, commit ea09434): version.json matched; league_test 60/0, nopreset_test 29/0, leslie_test 17/0, lgscroll_test 19/0; live smoke 22/0.

## v2026-10-26-2145-leslie (2026-10-26)
### What changed
- League weekly screen: the host can now move an archer who has already started this week between Own phone and Phone 1/2/3 (and back). Before, a started archer's buttons were greyed (the Lou Archer "(started)" case Nathe reported) because `lgSetGroups` refused to move anyone with scores, the buttons were disabled, and the hint said "Archers can move only before they start". The refusal is removed; that is all.
- Why it is data-safe: a week's scores are keyed by archer and week (`lg.sc[id][w]`), never by group, so moving an archer does not touch his ends. Scoring carries on from the next end on the phone that now scores him. The cross-phone sync (`lgMerge`) never had the check. The existing take-over rule still protects a real member who is being scored on another phone (a "Take over scoring here" button is shown); guests like Leslie are never locked for the host.
- Also changed, same lock: the Everyone on own phones / Everyone on one phone buttons used to leave started archers where they were; they now move everyone. Only the host can change groups (unchanged).
- League scoring rules were NOT changed.
- Stale league_test check fixed (test only, no app change): "weekly screen: the one-phone / own-phone choice is a visible card near the top (not folded away)" asserted the card is one of the first 3 cards; the host's "Add a shooter" card was later put above it, so it is the 4th card. The check still requires it visible, not folded away, with the same heading, and within the first 4 cards (`<=3`).
- Tests: league_test line 104 asserted the old rule ("a started archer can't move"). It is replaced by 3 checks of the new behaviour (a started archer can be moved with the scores identical by JSON compare; moved back; only the host can change groups).

### Files touched
league.js (lgSetGroups, group buttons, hint text), tools/leslie_test.py (new, 17 checks), tools/league_test.py (one stale assertion replaced), qa/run_regression.py, whatsnew.js, CHANGELOG.md, sw.js, index.html, version.json (bump).

### Tests run
Baseline (1c75ce3 plus preset removal, a639320): leslie_test fails "started archer buttons are not disabled" on the old code.
This release, full suite (parallel run a10, all areas): every area passed except vegas_test (the known 58 pass / 2 fail, unchanged) and runner artefacts (shifted ports and CPU load) in field_faces, offline, peel_comp, peel_share, peel_scroll, sightimport; each of those passed when re-run alone and unshifted (peel_scroll 15/0, peel_data 2/0, peel_next exit 0, offline 12/0, field_faces exit 0, peel_comp 52/0, peel_share 26/0, sightimport 43 ok). league_test 60/0 (after the two stale-check fixes above), leslie_test 17/0.
After deploy (live URL, v2026-10-26-2145-leslie, commit a3cd686): version.json matched; league_test 60/0, nopreset_test 29/0, leslie_test 17/0; live smoke 22/0.

## v2026-10-26-2106-nopreset (2026-10-26)
### What changed
- The preset Onion Shed Challenge league (LG_PRESET, code ONIONSHD) is no longer shown to anyone. `lgSeed` / `lgPresetFix` (which added the league to every member's phone on load and appended members to an existing copy) are removed, so nothing adds or edits it. A copy already in a phone's storage is simply not listed in "Your leagues" (`lgPresetHidden`); it is not deleted and its scores, weeks and linked sessions are untouched. It also no longer counts toward the 3-leagues-per-host limit, its code can't be joined again, and an invite for it is ignored.
- Template kept for new leagues (Nathe, 26 Oct): LG_PRESET stays in the code; New league has a "Use the usual group" button that ticks the same members. Creating a league, weekly scoring, groups, relay and the shoot-up are unchanged. League scoring rules were NOT changed (a new method is to come from Nathe).
- Tests: league_indoor_test and undozoom_test used to get the preset league by opening the Score tab; they now add the old record themselves (`lgPresetRecord`). This is the only edit to existing tests. The stale league_test check "go-live: new user sees no leagues, no Onion Shed shown" now passes (it failed only because the preset was being seeded).
- Housekeeping: the previous commit (1c75ce3) accidentally included test screenshot folders (shots-3d, shots-arrowcheck, shots-ausindoor, two shots-fix1022 files); they are removed from git here. No app code is affected.

### Files touched
league.js, tools/nopreset_test.py (new, 29 checks), tools/league_indoor_test.py, tools/undozoom_test.py, qa/run_regression.py, whatsnew.js, CHANGELOG.md, sw.js, index.html, version.json (bump).

### Tests run
Baseline = previous deploy 1c75ce3: the new nopreset_test fails 12 of 18 before it can finish (preset seeded for every member); full suite as a8 (only vegas_test 58/2 and league_test 56/2 plus runner artefacts).
This release, full suite: every test passes except the same known failures as before (vegas_test 58/2) and league_test (57 of 58). league_test's 'go-live: new user sees no leagues, no Onion Shed shown' now PASSES (it was the stale failure); the one left, 'weekly screen: one-phone / own-phone card near the top', failed before this release too and is investigated in the next release. New nopreset_test 29/29. peel_next_test had a stale debug line that indexed leagues[0] (now guarded; its checks are unchanged). Runner-load artefacts (names, offline, peel_comp, peel_share, field_faces, h2h, sightimport) all pass when run alone.
After deploy (live URL, v2026-10-26-2106-nopreset, commit a639320): version.json matched; nopreset_test 29/0; live smoke 22/0; league_test 57/1 (the known weekly-screen check).

## v2026-10-26-2027-chipcolors (2026-10-26)

### What changed
- Light theme only: on the Casual score card (and League, and Vegas match play, which use the same classes) the chips for the end being scored (`.vg-slot.on`, background #13294b) and the archer pills (`.lc-chip`, background #0b1f4d) were navy. The chip text takes the theme's dark ink colour, so X 10 9 8 7 were unreadable. Added 4 light-theme rules in lab.css: light chips with dark text (#e3ecff / #0f172a), light archer pills, the selected archer pill stays blue with white text. The dark theme is unchanged (style.css untouched).
- Report "only 5 arrows register on Casual" (WA 720 (50m Compound), 80cm 6-ring, 12 ends of 6, host + 9 name-only archers): not reproduced. No code change. In a phone-viewport run on Casual (10 archers, WA 720 Compound) all 6 arrows register for every key as the 6th arrow (X 10 9 8 7 6 5 M), in light and dark, with clicks and with touch taps and a slow relay; 8 ends in a row each hold 6 arrows, and after the 6th arrow the card moves on to the next archer. The screenshot shows 5 shot and the 6th slot still empty (score 44 = the 5 arrows, 0 of 12 ends complete); the 6th slot is waiting for the next tap. Just me on the same round also takes 6. Locked in by tests so a real cap would be caught. If it happens again on his phone I need the steps and the version shown in Settings.
- Saved data is not changed.

### Files touched
lab.css (4 light-theme rules), tools/chipcolors_test.py (new, 53 checks), qa/run_regression.py (added to the Casual shoot area), whatsnew.js, CHANGELOG.md, sw.js, index.html, version.json (bump).

### Tests run
Baseline = previous deploy c1072bd (v2026-10-26-1955-ghosttie): the new test fails 3 of 53 (light theme: the filled chips on the Casual card and the shared League/Vegas chips are below contrast 4.5; the other archers' pills are navy); the 6-arrow checks pass.
This release, full suite: all `tools/*_test.py` (parallel runner) - chipcolors_test 53/0; every file exits 0 except the known stale vegas_test 58/2 and league_test 56/2 (same checks as the baseline), and offline, peel_comp, peel_share, field_faces, h2h (timed out under load) and sightimport (port clash), which fail only because of the runner's shifted ports/load; re-run alone: offline 12/0, peel_comp 52/0, peel_share 26/0, field_faces 0, h2h 90/0, sightimport 43 ok / 0 bad.
After deploy (live URL, v2026-10-26-2027-chipcolors, commit 1c75ce3): version.json matched; casual live 6/0.

## v2026-10-26-1955-ghosttie (2026-10-26)

### What changed
- Ghost match panel (`ghostSheet`) and the ghost bar (`ghostBar`) in insights.js: a tie with the ghost was drawn in `#fff`. On the light theme (default) the panel card is `#fff`, so a tied end looked blank. Example from Nathe's Vegas 300 session: You 29, 30, (30), 28, 27 against ghost 30 28 30 29 30. End 3 was a 30-30 tie. The tie colour is now `var(--ink)`, the same as the Ghost row. Nothing else changed.
- Investigation finding (full write-up in /workspace/end3-findings.md): end 3 was saved with 3 arrows worth 30, the saved total of 144 is correct (29+30+30+28+27), and no scoring code drops, skips or mis-indexes an end (checked on Vegas 300 with Back/Next, undo then re-shoot, the End N back button, Add Scores, ghost "My best"). The End box showing 0 on a new empty end is by design (it is the total of the end on screen; Prog keeps the running total). The End box logic is the same before and after indoorparity.
- Saved data is not changed.

### Files touched
insights.js (two colour values), tools/ghosttie_test.py (new, 23 checks, light and dark), qa/run_regression.py (ghosttie_test.py added to the Ghost match area), whatsnew.js, CHANGELOG.md, sw.js, index.html, version.json (bump).

### Tests run
Baseline = previous deploy f0f9d07 (v2026-10-26-1946-vgtab): the new test fails 3 of 23 (tie colour: light theme white on white, and tie not the ink colour in both themes); the data checks pass; the rest of the suite is as before: only vegas_test 58/2 and league_test 56/2 fail (the known stale checks).
This release, full suite: all `tools/*_test.py` (parallel runner, shifted ports) - every file exits 0 except the known stale vegas_test 58/2 and league_test 56/2 (the same two checks each as the baseline), and offline, peel_comp, peel_share, which fail only because the runner shifts their fixed ports; re-run unshifted: offline 12/0, peel_comp 52/0, peel_share 26/0, field_faces and peel_scroll/peel_data pass. New ghosttie_test 23/0. No previously passing check failed.
After deploy (live URL, v2026-10-26-1955-ghosttie, Ghost match area): ghost_test 92/0, ghost_pick_test and ghosttie_test pass, live smoke passes (3/3 suites + smoke, 66 s).

## v2026-10-26-1946-vgtab (2026-10-26)

### What changed
- Vegas 300 and Vegas 300 (18 m) scoring: the "Ends so far" card (`#vgtab`, the table under Back/Next added by `vgExtras`) is removed. Nathe chose to remove it entirely. Nothing else on the Vegas scoring screen changed (header, End box, face, Back/Next, ad pad, scorecard screen), and no other round or screen builds this card.
- Saved data is not changed.

### Files touched
shootup.js (`vgExtras` no longer builds or inserts the card), tools/vegas_test.py (the old check that the card showed the ends is replaced by a check that the card is gone while the header, End count and score pad are still there), whatsnew.js, CHANGELOG.md, index.html, sw.js, version.json.

### Tests run
Before deploy (local copy, headless Chrome 390x844). Baseline = previous deploy c2a35af (v2026-10-26-1843-undozoom).
- Baseline: only vegas_test 58/2 and league_test 56/2 fail (the known stale checks).
- This release, full suite (all `tools/*_test.py`): same. vegas_test 58/2 (the same two stale checks: header "End 4 of 10" in `#vghead`, relay silence counting the Onion Shed snapshot POST; the changed card check passes), league_test 56/2 (same two stale checks). Every other suite passes, with peel_comp 52/0, peel_share 26/0, offline 12/0, field_faces 54/0 and the Peel scroll/data/next suites run unshifted on port 8765/their own ports (the parallel runner's port shift makes those four fail falsely).
After deploy: see the live-run result recorded below.

## v2026-10-26-1843-undozoom (2026-10-26)

### What changed
- Undo on indoor faces (Just me, League, Casual) now removes the arrow just shot and its plotted marker. Reproduced on the previous deploy (v2026-10-26-1756-ghostpick) with the new test: shoot a full end in order spot 1, 2, 3 where the spot 3 arrow is not the lowest, tap Undo: the lowest arrow was removed instead of the spot 3 arrow, the spot 3 marker stayed on the zoomed face and the arrow list and plots disagreed. Cause: a completed end is sorted high to low (`sortEnd`, `csKey`, `lgKey`) and Undo then popped the last (lowest) arrow of the sorted end. Fix: the order the arrows were shot in is kept in memory only (`window.stOrd`, never saved) when an end sorts, and Undo restores that order before removing the last shot, only if the end is still exactly as sorted. If it is not (for example after a fix or a reload), Undo behaves as before. Markers are also only drawn for arrows that exist, so a stray plot cannot show.
- Zoom clears on a new end, on Next, on coming back from the sheet, and on changing spot (Just me, League, Casual). The face opens at full size unless you zoom.
- End box: no regression and no logic change. In Just me, `app.js` is unchanged between 6b32f31 and c1a513a. The End box is, and was before indoorparity, the running total of the end on screen: 0 on an empty end, the total of the arrows so far on a part-filled end. Prog is the total through that end. After the last arrow of an end the screen stays on that end until Next, which opens the next empty end (End box 0, Prog unchanged). League and Casual show the same. The new test locks this in for all three.
- Saved data is not changed or migrated; the shot order is memory only.

### Files touched
app.js (`stOrd`, `putArrow`, `#undo`, marker filter, zoom key), casual.js (`csKey`, `csUndo`, `csAdCard`, `csFaceBind`), league.js (`lgKey`, `lgUndo`), tools/undozoom_test.py (new, 46 checks, headless 390x844), qa/run_regression.py (adds undozoom_test), whatsnew.js, index.html (?v=), sw.js, version.json, CHANGELOG.md.

### Tests run
Before deploy (local copy, headless Chrome 390x844). Baseline = previous deploy 068b45c (v2026-10-26-1756-ghostpick), run the same way.
- New tools/undozoom_test.py: 46 passed, 0 failed on this release. Run against the previous deploy's files it fails 8 of 46 (Undo leaves the spot 3 plot and arrow lists disagree in Just me, Casual and League; zoom stays on after Next, after coming back from the sheet, and in Casual and League after the end completes), which reproduces the bug.
- Full suite (all `tools/*_test.py`, 51 suites, run in parallel): same result as the baseline. Only league_test 56/2 and vegas_test 58/2 fail, the same two checks each as on the previous deploy (stale tests, not caused by this release). Every other suite passes, including casual 82/0, casual_indoor, league_indoor, ausindoor, redesign, real, nav, h2h, offline 12/0 (run on its own port), field_faces (run with the server on 8765), peel_test 37/0, peel_data 2/0, peel_next, peel_scroll 15/0, peel_comp 52/0, peel_share 26/0, whatsnew 33/0. peel_scroll timed out once under parallel load and passed 15/0 when run alone (flaky under load, not a change). Peel scoring files are untouched.
After deploy: see the live-run result recorded below.

## v2026-10-26-1756-ghostpick (2026-10-26)

### What changed
- Ghost match unlocks on Australian Indoor 18m. Cause: the 23 Oct 2026 commit 3a1ec58 that added the Australian Indoor 18m round did not add it to `GHOST_MAP` in best.js, so none of Nathe's competition scoresheets for that round could be raced (Best official was never offered), and the practice ghost sources only counted full, not-finished Just-me sessions of that exact round. A part-shot, finished-early or casual score never unlocked the box. No later commit made the unlock rule stricter; the practice rule (`ghostFor`, from be54eb3) is unchanged for the existing buttons.
- The unlock rule now: any valid past score of the round counts (a different face of the same round, part-shot sessions, competition results with end-by-end sheets). Stored scores are only read.
- New Choose who list on the ghost box: any past score (date, score, PB and Best marked, face, part-shot noted, competition results), My PB, My best ever, My average, and the world and national record for that round.
- Records race as an even pace line, labelled "Pace line, not real ends". A record that is not confirmed shows "Record not available" with no number.
- If the ghost was shot on a different face from the one being shot (3-spot vs single), a note says so and the ghost's arrow positions are not drawn. The same note applies to Last round / My best.
- Records are kept in `data/records.json` with sources and check dates. World Archery 18 m records are listed; no Australian national record could be confirmed for any round (see the file's `national._status`).
- Added this change log, `qa/regression.md` and `qa/run_regression.py` (runs every suite by area; `--live URL` re-runs on the deployed files).

### Files touched
best.js (GHOST_MAP entry, `offGhosts`, `ghostBowNow`), insights.js (Race who? picker, unlock, face note), style.css (`.gh-note`), data/records.json (new), help.js, whatsnew.js, index.html (?v= busters), sw.js, version.json (cache name v2026-10-26-1756-ghostpick, 106 files precached), tools/ghost_pick_test.py (new), qa/ (new), CHANGELOG.md (new).

### Tests run
See the result block appended below after the run.

Before deploy (local copy, headless Chrome 390x844). Other releases landed on main while this one was being tested, so the work was rebased three times. Full run of `python3 qa/run_regression.py` (48 suites) on the first rebase base (after v2026-10-26-1720-adminback): 45 pass, 3 fail, and all three also fail on the previous deploy with the same assertions, so they are not caused by this release:
- vegas_test 58/2: "header with the round info and End 4 of 10" looks for an element the Vegas solo view no longer has; "nothing sent to the relay (fully offline)" counts the Onion Shed ntfy snapshot POST. Stale tests.
- league_test 56/2: "new user sees no leagues, no Onion Shed shown" and the weekly one-phone/own-phone card check (leagues moved from Score to Clubs). Stale tests (being handled with the league work).
- field_faces_test needs a server already running on port 8765; the runner now starts one. It passes 54/0.
- whatsnew_test needed older notes to name their commit; fixed (33/0).
After the final rebase onto c1a513a (v2026-10-26-1732-indoorparity) the quick set was re-run: ghost_pick 22/0, ghost 92/0, whatsnew 33/0, ausindoor all pass, offline 12/0, aba 79/0, redesign 142/0. The full set is re-run on the live copy after the deploy (below). One aba_test run timed out on a locator once and passed on the re-run (flaky, not a change).
Also passing in the full run: nav 99/0, real 250/0, casual 82/0, custom3d 55/0, peel suites, h2h 90/0, names 104/0, sight marks, sight card, My arrows/bows, calculators, analysis suites.

After deploy (live copy of https://nfstride1-ux.github.io/scoretool-demo/, version v2026-10-26-1756-ghostpick confirmed): full run 44 pass, 5 fail on the first run; three of the five (real_test, testers_test, whatsnew_test) failed only because the live-copy runner did not fetch non-precached pages or the git log. After fixing the runner they pass (real 250/0, testers 189/0, whatsnew 33/0). Remaining failures: vegas_test (2) and league_test (2), the same stale assertions as before this release. Live ghost smoke: OK 22, FAIL 0. Combined defect list: qa/defects.md.

## v2026-10-26-1732-indoorparity (2026-10-26)

League and Casual indoor scoring now match Just me (single archer on the phone). ABA and 3D, the Peel group card and shared-phone multi-archer cards are untouched.

Differences found against Just me and fixed (league.js, casual.js; Just me code reused: faceSVG/plot helpers, sortEnd order, endSum, roundSummary, shootCompareHTML):
- A complete end was saved in tap order (league). It is now put in order like Just me (X, 10, 9 ... M), with plots kept in step.
- No End and Prog boxes, no tappable arrow chips (fix, delete arrow), no table of ends with a total each end. All added, same look as Just me.
- The face was too tall and the score keys fell off the phone screen, and the page jumped to the top after every tap. The face now uses Just me's heights and the face, End/Prog and keys fit on the phone screen together, staying put after each tap.
- League did not save the arrows as a session, so groups and heatmaps ignored league. It now writes `lg-<code>-w<week>` into your own sessions (ends, plot positions, vertical 3-spot tag). Casual already wrote `cs-<code>`.
- No analysis on finishing. Round summary plus where-this-shoot-landed and sight move guide now show directly under the score in both.
- Ends sent to other phones are now in order (still end scores only, no plot positions).
- Saved data: old league and casual scores load unchanged; only plot positions (`p`) are added. Nothing is migrated and past league weeks are not backfilled into sessions.

Left as is on purpose:
- A finished end moves on automatically in league and casual (Just me waits for Next). Undo or the arrow chips on the current end change mistakes; an earlier end is changed with Undo.
- Fair-play quick-end prompt stays on Just me practice only (league and casual scores are not held for XP).
- League relay still sends end scores to the public relay, as before (tester Nate included).

Tests: new league_indoor_test.py and casual_indoor_test.py (phone viewport, tester profile, relay mocked) score a full 10-end indoor round on the vertical 3-spot with plotted arrows, undo, fix, delete and finishing, and compare against Just me for the same 30 arrow positions.

## v2026-10-26-1727-adminback2 (2026-10-26)

Follow-up to adminback.

- Recovery check tightened: the bar is only auto-enabled on a phone whose `scoretool.v1` has a sessions list and a profile starting "Nathaniel Stride" (case-sensitive).
- Fixed the What's new test: earlier notes (adminback and pgcomp) now name their real commits (e0a11de, 4348def).
- league_test: the same 2 checks fail on 4348def and on e0a11de ("go-live: new user sees no leagues, no Onion Shed shown", "weekly screen: the one-phone / own-phone choice is a visible card near the top"). Not caused by adminback.
- Tests: whatsnew, adminview, testers re-run (see commit message).

## v2026-10-26-1720-adminback (2026-10-26)

Admin return bar and read-only profile viewing.

- When Nathe switches to another tester from Me, a navy and gold bar sits under the top bar on every screen: "Viewing as <name>" with a "Back to my profile" button. One tap returns to his own profile.
- Works retroactively: a phone that holds Nathe's own data (`scoretool.v1`, profile "Nathaniel Stride") but is on another tester gets the bar and the switch card with no flag needed. Normal testers' phones never show it.
- The flag `scoretool.adminReturn` is written only by the admin's switch (or the recovery check) and removed on return. `?tester=nathe` always works and clears it.
- Viewing is read only. Writes to localStorage (except `scoretool.adminReturn`, `scoretool.tester`, `scoretool.theme`), network POSTs and IndexedDB writes are blocked while viewing, with a "not saved" notice when the user taps something that would save. Forced name prompt skipped while viewing.
- Audit of the old code: merely viewing Nate rewrote `scoretool.v1.nate` fields setup, leagues, bowSel, squad, peel, bows, casual, diary, presetSeeded, removed `scoretool.dname.nate`, and posted a league sync as Nate.
- Tests (tools/): adminview 41/41, testers 189/189, names 104/104, nav 99/99, ghost 92/92, offline 12/12, h2h 90/90, casual 82/82, redesign 142/142, sightcard 12 ok, mybows 60 ok. league 56 passed, 2 failed (compared with the previous build separately).
