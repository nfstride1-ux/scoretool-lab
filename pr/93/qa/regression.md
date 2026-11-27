# ScoreTool regression checklist

Run before every deploy, and again on the live URL after it:

    python3 qa/run_regression.py                                   # this checkout, served locally, headless Chrome 390x844
    python3 qa/run_regression.py --live https://nfstride1-ux.github.io/scoretool-demo/
    python3 qa/run_regression.py --only ghost                      # one area while working

It prints PASS/FAIL per area and a total, and exits non-zero on any failure. Record the result in CHANGELOG.md. Rule: do not change anything that already works while fixing something else. If a suite fails, first check whether this change caused it (`git stash` or run it on the previous deploy); fix it if so, otherwise list it as a known failure in CHANGELOG.md.

Each suite uses a fresh browser profile and test data only. Nothing is sent anywhere.

| Area | Suites (tools/) | What must still work |
|---|---|---|
| Solo scoring | redesign, ausindoor, singleface, nav, real, pickers, halfsplit, shotview, sidehill, grouppattern, todayarrows, photos, names, colourblind, field_faces, field_round, vegas, h2h, undozoom, zoompersist, plot3spot, spotgroups, arrowsize, linecut, endview, scorecards, savedarrows | Just me rounds on every face, key entry and tap plotting, undo/fix arrow, PBs, finish analysis, Past sessions, photos, names rules, tab bar. Scorecards: practice scores by Target, Indoor, Field, Clout and 3D, official personal bests, and Open this scorecard after Save and Finish. |
| Full round | fullround | Every round type scored start to finish by real taps (WA outdoor, indoor, field gold/black, Vegas 300, practice, custom block, ABA Interclub 3D, custom 3D, League 300 week, Peel two-day comp): every end, running total, X/10 (field 6/5) counts, hits, total; saved record unchanged after reload; Past sessions row and Open match. Clout is not a scored round in the app |
| PB note | pbnote | Finish Personal best note uses the same earlier shoots as "your PB" in This shoot vs your usual (practice and official, full rounds, earlier dates): first time, beats practice, official higher (no New PB), equal, beats official, later-dated shoot ignored; no page errors. Official result stubbed in the test browser only. |
| Personal bests | pbbest | My archery > Personal bests counts finished practice shoots on this phone as well as official results, every round type (outdoor, indoor, field, Vegas, practice, own rounds, 3D), labelled practice or official; no page errors. |
| Bow filter | bowfilter | My archery > Analysis bow filter lists Compound, Recurve, Barebow, Longbow (plus Other only when a shoot has no bow type), no All bows, starts on your own bow; no page errors. |
| Admin view relay | avrelay | Viewing another tester's app (read only): league, casual, match, name, calendar and photo background sync do not run, nothing is sent, no 'this would change' notice without a tap; normal use still syncs; no page errors. |
| Ghost X count | ghostx | Ghost match result card shows 'X count: you N, ghost M.' when either shot an X, 'Level on points.' first on a draw, nothing on total-only ghosts; no page errors. |
| Test guards | guards | Every test that loads the app imports tools/guard.py: each browser context and page has the ntfy.sh relay stubbed and the service worker blocked (a test that sets service_workers itself, such as offline_test, keeps its choice). field_faces_test exits non-zero on a failed check. |
| Slow start | slowload | squads.js, lab.js or update.js held back 2.5 s: the app still opens Home with no page errors (the first draw waits for every script). |
| League auto-advance | lgauto | Shared-phone league: after the 3rd arrow is saved the next archer opens with no jump to the top, Saved line names the last archer and end, never before the 3rd arrow, undo clears it, the Stay on each archer setting brings back Next; no page errors. |
| Your data | backup | Me > Settings & help Your data card: backup file of every shoot (ScoreTool keys only), restore asks first and keeps a copy, wrong-archer or damaged files refused in plain words, offline line on and off, shoots kept through an app update and a cleared app cache (offline worker on), privacy note; no page errors. |
| Arrow chooser uses your bow | ac1 | Arrow chooser starts from the current saved bow without writing anything, lists setup-only bows, follows My bows changes, typed boxes win and cleared boxes go back, None keeps the figures, says which rating each chart uses; Is this arrow right? uses the saved bow's speed (L6); 390px, no page errors, old data unchanged. |
| Arrow chooser Easton parts | ac2 | Picking an Easton shaft fills blank point, insert and nock boxes from the 2026 catalogue parts (SuperDrive 27 280: 100 gr adjustable point, 10/20/50 gr modules, bushings, nocks; X23/X27 bushings by size; 4MM and X10 pins, collars, nocks); only printed weights; typed boxes win, cleared boxes go back; bushings/pins counted at the nock end, not added over typed older figures; break-off ranges and the X27 point not filled; non-Easton shafts get none; nothing written on opening; 390px, no console errors, old data unchanged |
| Arrow chooser shortest cut | ac3 | Shortest safe cut helper (Easton Tuning Guide pp. 15-17, Fig. 21): plain steps, nock groove to rest contact + 1", chart spine and FOC worked out at that length, Use writes the arrow length, warning when the arrow is shorter. Nothing written on opening, old data unchanged, 390px. |
| Arrow chooser heavy point and FOC | ac4 | Heavy point warning when the point-weight step takes Easton's target or hunting chart past the top row (heaviest point that still reads), Gold Tip front weight over 150 gr, FOC over Easton's 7-16% tuning range or 15% indoor. Nothing written, old data unchanged, 390px. |
| Arrow chooser fletching suggestion | ac5 | Fletching suggestion by use (indoor, outdoor, 3D, hunting) and launcher rest for compound, figures as printed by Bow International and Easton's Tuning Guide, each line sourced, marked Not from Dr Park. Reads only, old data unchanged, 390px. |
| Help: Build an arrow guide | ac6 | Help guide Build an arrow: 8 steps in order, each citing its source and opening its field in the Arrow chooser (shown, section open, cursor in the box); links write nothing; 390px; no emoji. |
| Relay hold | relayhold | Relay turns a topic away (429): one try, then a 15 second hold for that topic, then one more try (polls also turned away while busy); any send or poll that gets through, or coming back online, clears the hold and the score sends; reopening re-sends the league snapshot at most once every 30 minutes (after 30 minutes it re-sends, so catch-up works); the time of that re-send is kept only in its own key scoretool.opost.<archer>.<code>, never in the saved record; no page errors. |
| Casual shoot | casual, mixedface, casual3d, custom3d, mel3d | Setup choice, discipline faces and keys, 3D/ABA, custom rounds |
| League | league, lk_return_pin | Onion Shed 6 x Vegas 300, cumulative ranking, X ties, missing weeks. Lingkana: Back to ScoreTool from #lk-home, shared light/dark, resume an open night, phone-only name list, 4-digit PIN hash, lockout, host reset |
| ABA | aba | ABA Interclub first half 3-arrow, second half 1-arrow, sheet view |
| Peel group card | peel, peel_data, peel_next, peel_scroll, peel_share, peel_comp | Day 1/Day 2, Next hold, Save, Competition complete, share names, saved data untouched |
| Ghost match | ghost, ghost_pick | Unlock on any past score of the round (any face, part-shot, competition result), Race who? list, PB/average, records pace line and Record not available, different-face note, top-ranked ghosts, stored data unchanged |
| Sight marks | sightest, sightseed, sightimport, arrowsets | Typed marks stay, estimates are italic, import CSV/PDF exact, per-setup sets |
| Sight card | sightcard | Print card PDF, 2 per A4, no purple |
| My arrows / My bows | myarrows, mybows, arrowpick, todayarrows | Add/edit lists, dropdowns fill calculators |
| Calculators | arrowcheck, arrowchooser, arrowuse | FOC, speed, spine verdicts, chart look-ups |
| Analysis | coach2, coach3, testers, sendpast | Stats vs Analytics lists, coach read, tester data, send past rounds |
| App shell | whatsnew, offline, clarity | What's new/help rules (no emoji, line icons, newest first), service worker precache, offline reopen; Clarity snippet async, typed fields masked, privacy line, clarity.ms never cached, app fine when clarity.ms is unreachable |
| Custom round and Lingkana | round_lk_qa, entitlement | Ends and custom arrows per end outside 1–144 and 1–12 are named and not saved; Save stays off; a stored negative-ends round still opens and scores without a page error and is not deleted; Lingkana registration and results text meets 4.5:1 in dark mode; a wrong invite code is visible; a successful registration says which night and a repeat of the same name, night and league updates that row. The Unlock button is absent; a phone already unlocked still opens and its flag is not rewritten; with no server, entitlementVerify grants nothing. Register is green when it can be used and dull when disabled. |

## Manual spot checks (2 minutes, on a phone, after the live deploy)
1. Score > Just me > Australian Indoor 18m: Ghost match is tickable; Choose who lists past scores; pick a record row and start.
2. Settings & help > What's new: the top entry matches this release.
3. Settings & help > About (or version.json): the version equals the cache name in sw.js.

## Rules every release must keep
No emoji in the app; no other archery app names in user-facing text; palette navy/blue/gold (no purple); field faces gold and black only; saved user data is read, never rewritten by a fix.
