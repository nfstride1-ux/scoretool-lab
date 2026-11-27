# ScoreTool combined QA defect list

Compiled 26 Oct 2026 (Australia/Perth) from QA audit A, QA audit B (24-25 Oct 2026), the regression runs of 26 Oct 2026 and the ghost fix. De-duplicated. Status is as of main 068b45c (v2026-10-26-1756-ghostpick) from the live regression and a read of the current code. Another release may have changed an item since: re-check anything marked open before the release.

P0 = must fix or decide before release. P1 = should fix. P2 = nice to have. One line per item: area, evidence, status.

## P0 Must fix or decide before release
- G1 Ghost match locked on Australian Indoor 18m (cannot tick it although the round was scored before). Area: Score, ghost. Evidence: Nathe's screenshot; root cause 3a1ec58 (no GHOST_MAP entry for the new round); repro and 22 new checks in tools/ghost_pick_test.py. Status: FIXED in 068b45c.
- G2 No way to choose who to race, and no record scores. Area: Score, ghost. Evidence: Nathe's request. Status: FIXED in 068b45c (Choose who list; World Archery 18 m records; national shows Record not available).
- H1 Under-16s' real names in the public first-open tester picker and public data files (rule: under-16s by nickname only). Area: testers.js, data files. Evidence: audit B H1; testers.js lines 10, 12, 16 still hold full names with junior:true. Status: OPEN, needs Nathe's decision (remove from picker, or show nickname only).
- R1 No confirmed Australian national record figures for the ghost picker. Area: data/records.json. Evidence: archersdiary.com records page unreachable from the test machine; only an undated list found. Status: OPEN, shows Record not available. Add figures only from the Archery Australia records page.

## P1 Should fix
- T1 vegas_test 2 failures ("header with the round info and End 4 of 10", "nothing sent to the relay (fully offline)"). Area: tests, Vegas. Evidence: also fails on 4348def, same assertions; test looks for #vghead that no longer exists and counts the Onion Shed ntfy POST. Status: OPEN (stale tests, not an app fault as far as seen; the relay assertion needs a real look).
- T2 league_test 2 failures (new user sees no leagues; weekly one-phone/own-phone card). Area: tests, League. Evidence: fails on 4348def; leagues moved from Score to Clubs. Status: OPEN, another executor is working on league scoring.
- T3 Live-copy regression run missed pages that are not precached (real_test needs the coach page). Area: qa/run_regression.py. Evidence: real_test failed in 6 s on the live copy only. Status: FIXED in the runner (fetches every tracked page); re-run noted in CHANGELOG.
- Z1 Zoom button sits over the top-right corner of the 3-spot faces; a tap there zooms instead of plotting. Area: scorer. Evidence: audit A item 3. Status: OPEN.
- F1 Field 20 cm 3-spot column: hint line wraps and the face moves down about 20 px when the third arrow is plotted (possible mis-plot). Area: field scoring. Evidence: audit A item 4, audit B M4; field_faces_test now 54/0. Status: OPEN (layout shift only, no wrong score seen).
- P1 PB is defined two ways: the finish compare card counts official past results, the Personal best line is practice-only. Area: scoring analysis. Evidence: audit A. Status: OPEN, needs Nathe's decision.
- PG1 Delete Day 1 renumbers Day 2 to Day 1 on the Peel group card. Area: Peel. Evidence: audit A segment 2 (peel.js delete confirm uses position). Status: OPEN, needs Nathe's decision.
- M2 My bows and My arrows have no Delete. Area: bows.js, arrows.js. Evidence: audit B M2. Status: OPEN (new feature; linked marks and sessions need a rule).
- M3 My arrows form has no diameter field and no spine / gr-per-inch dropdowns. Area: arrows.js. Evidence: audit B M3. Status: OPEN (feature gap).
- L1 SuperDrive 23 375 shows 7.3 gr/in; Nathe quoted 6.9. Area: arrowchooser.js line 60. Evidence: audit B L1 (Easton 2026 catalogue says 7.3). Status: OPEN, needs Nathe to confirm.
- L2 Draw length "30-31" accepted as free text; the first number is used silently. Area: bows, calculators. Evidence: audit B L2. Status: OPEN.
- L6 "Is this arrow right?" uses a default 340 fps rating, not the bow's, so Nathe's SD23 375 reads Spine too weak. Area: arrow chooser. Evidence: audit B L6. Status: OPEN.
- N1 About one ntfy POST per arrow scored in a league (rate-limit risk for big leagues). Area: league sync. Evidence: audit A item 8. Status: OPEN (another executor is in this code).

## P2 Nice to have
- U1 Tie wording on the finish analysis ("Lowest end ... end 1 (30.0). Highest: end 1 (30.0)"). Area: insights.js. Evidence: audit A item 5. Status: OPEN.
- U2 Update banner never appears if the app is first loaded offline. Area: app shell. Evidence: audit A item 7. Status: OPEN.
- L3 A bow with speed kind ATA fills the "IBO speed rating" box. Area: calculators. Evidence: audit B L3. Status: OPEN.
- L4 Choosing a catalogue bow wipes a typed let-off, make or model; let-off not shown in the My bows summary. Area: bows.js. Evidence: audit B L4. Status: OPEN.
- L5 Source line cites a named author (George Tekmitchov, June 2022) in the Arrow chooser and Calculators. Area: arrowchooser.js. Evidence: audit A and B. Status: OPEN, Nathe to decide whether it is a quote to remove.
- L7 A My arrows row can show two FOC figures. Area: arrows. Evidence: audit B L7. Status: OPEN.
- L8 Comma decimals typed by hand give whole-number estimates (sightest.js). Area: sight marks. Evidence: audit B L8 (from code). Status: OPEN.
- L9 Tuning page says it gives no tuning advice, then shows a Next step to try card. Area: lab.js line 146. Evidence: audit B L9. Status: OPEN.
- L10 First-open picker says "You can change this later in Me", wrong for testers with no switch card. Area: testers.js. Evidence: audit B L10. Status: OPEN.
- L11 Legacy views rewards, diary and me have no back button (not shown to be reachable). Area: navigation. Evidence: audit B L11. Status: OPEN, unverified.
- L12 The help PDF does not mention Print sight card. Area: help. Evidence: audit B L12. Status: OPEN (rebuild with tools/build_help_shots.py).
- W1 help.js line 48 shows Past competition results in bold as if it were a menu entry. Area: help. Evidence: audit A segment 2 (c). Status: OPEN.
- W2 help.js line 21 and the in-app note "Carry on later from Score or Home" are short (Open then Add Scores). Area: help. Evidence: audit A segment 2 (d). Status: OPEN.
- W3 h2h.js lines 58 and 77 say invites show on "their Score tab"; not checked by eye. Area: matches. Evidence: audit A segment 2. Status: OPEN, unconfirmed.
- E1 Plain text symbols (tick, star) still shown in a few places (3 tick characters in app.js). Area: UI. Evidence: audit A and B. Status: OPEN; another executor is working on emoji and symbols.

## Fixed earlier (for the record, verified in audits and the live regression)
- Calendar card over the target while scoring casual or league alone (f61bc38).
- Squad activity feed named another archery site (f61bc38).
- Peel card said Saved after an undo and rescore; wording said Score tab instead of Clubs (9cedf4a).
- Analytics round list differed from Stats (9cedf4a).
- Sight marks CSV with semicolons and decimal commas loaded wrong marks (a0b07ac).
- offline_test and field_faces_test were stale (f61bc38); both pass in the 26 Oct regression.
