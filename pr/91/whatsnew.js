/* What's new (23 Oct 2026). Release notes people can see: Me > Settings & help > What's new, plus a small one-time card on Home
   after an update. Newest first. Every note comes from a real commit (c = the commit it describes).
   To add a release: put a new entry at the TOP with v = the version written to version.json by tools/build_sw.py.
   The Home card shows once when WHATSNEW[0].v is newer than the one this phone has seen (key scoretool.whatsnew.seen). */
window.WHATSNEW=[
  {v:'v2026-11-25-1515-practicefp',d:'2026-11-25',items:[
   ['target',"Practice arrows counts every arrow you add","My archery, Practice arrows, no longer shows the Fair Play card. Arrows you add there count in today's total and your daily goal straight away. A negative from-rounds figure was a display bug and is fixed. Fair Play can still ask you to confirm a very quick burst before it counts toward XP or badges, on Latest shoot."]]},
  {v:'v2026-11-25-1410-noresultsrc',d:'2026-11-25',items:[
   ['trophy',"Import my data replaces My results source","Tools no longer has My results source. To add your official results, use Tools, Import my data. Results you already pasted or typed in there stay on this phone and still count in your personal bests and stats."]]},
  {v:'v2026-11-25-1025-audit2',d:'2026-11-25',items:[
   ['lock',"ScoreTool is out of testing","Testing is finished and everyone now uses ScoreTool the same way, free. Your scores stay on your phone exactly as before. The app is now just called ScoreTool. The coach option is hidden for now.",'audit']]},
  {v:'v2026-11-17-2405-loginfit',d:'2026-11-17',items:[
   ['lock',"The passcode stays above the buttons","On the Lingkana login, the PIN and the passcode sit above the name list. The Back and Login bar no longer covers the box, including on a short phone and when the keyboard is open.",'35a2571']]},
  {v:'v2026-11-17-2350-clearnight',d:'2026-11-17',items:[
   ['target',"Casual scores with buttons","Casual scoring no longer draws a target face. There is no spot picker, Hide target or zoom. Tap X, 10, 9 and the rest. Just me still plots on the face, and a one-archer league card still does too.",'308c56a'],
   ['target',"Lancaster X scores 11","In a casual Lancaster 660, an X scores 11 on the end, the running total and the saved score. A normal practice Vegas round still scores an X as 10. The league Lancaster already used 11.",'308c56a'],
   ['people',"Each discipline lists its own rounds","Just me asks for the discipline first. Target, Indoor, Field, Clout and 3D each show only the rounds for that discipline.",'308c56a'],
   ['people',"Lingkana is clear for Wednesday","Loading this version clears the test sign-ups, scores, groups, PINs, payment ticks and removals once. Nathaniel Stride and Nate Evans stay registered for every shoot night. Scores entered after that stay, including the first real night.",'308c56a']]},
  {v:'v2026-11-17-2230-pinorder',d:'2026-11-17',items:[
   ['lock',"Your PIN is enough to log back in","After your Lingkana PIN is set, logging in is the night, your name and your PIN. The event passcode is not asked again. On a new phone, search for your name or tap Show all names, then enter your PIN. A name with no PIN still uses the passcode once, to set one. Five wrong PINs still lock that name for a minute.",'67837b7'],
   ['people',"Each end starts with the first archer","On a group score card, every end starts with the first archer on the card, then the next, in that same order. The archer who finished the previous end does not jump to the front of the next one.",'67837b7']]},
  {v:'v2026-11-17-2115-spot1',d:'2026-11-17',items:[
   ['target',"Spot 1 is the top spot","On the triangular indoor 3-spot, Spot 1 is the single spot on top, Spot 2 is the bottom left and Spot 3 is the bottom right. An arrow saved earlier stays on the same spot. The vertical 3-spot is unchanged.",'514bdcc']]},
  {v:'v2026-11-17-2030-triangle',d:'2026-11-17',items:[
   ['target',"Triangular 3-spot, one spot on top","The triangular indoor 3-spot (Vegas, Indoor WA, Australian Indoor and Lancaster) now has one spot on top and two below. Spot 1 is still the left spot, Spot 2 the right spot and Spot 3 the single spot. The vertical 3-spot and the single face are unchanged, and the score for each ring is the same. A plot saved earlier is drawn on the same spot.",'1e4e410']]},
  {v:'v2026-11-17-1900-live',d:'2026-11-17',items:[
   ['target',"A host can score on his own","If Nathaniel Stride or Nate Evans is the only archer paid for a Lingkana night, he still gets a target and can open the scoring screen. Any other archer still needs at least two people in the group.",'3d8d1c2'],
   ['people',"Nate Evans stays registered","Nate Evans is registered for every Lingkana night. A reset or an older saved copy of the league cannot take him off the paid list. Registering that same name does not add a second row. He is a host, so the paid list does not ask him for a PIN.",'3d8d1c2']]},
  {v:'v2026-11-17-1830-live',d:'2026-11-17',items:[
   ['lock',"Back to ScoreTool, and a PIN on your name","Lingkana league home has Back to ScoreTool, which opens the app home and leaves your league and login as they are. The light and dark control uses the same setting as the rest of ScoreTool. If you are already logged in to a night that is not finished, Resume scoring opens that score screen, and opening the league from the app does the same. Login lists only the archers this phone has registered or logged in, until you enter the event passcode and tap Show all names. A host phone still sees every name. Registering asks for a 4-digit PIN, saved only as a salted hash. Login asks for that PIN. Five wrong tries lock the name on this phone for a minute. A host can reset a forgotten PIN.",'2b2d830']]},
  {v:'v2026-11-17-1645-savedarrows',d:'2026-11-17',items:[
   ['target',"Arrow size lists your saved arrows","On Score End, wherever a target is drawn, Arrow size lists only the arrows you saved in My arrows, with the name and the diameter. The dot and a line cutter use that diameter. It starts on the set for the bow you have chosen, or the set you used last. If none are saved, it says to add one in My arrows and still draws at the usual 23 size. The sizes where you add an arrow are unchanged.",'bf911a8']]},
  {v:'v2026-11-17-1130-live',d:'2026-11-17',items:[
   ['people',"Your name stays on the Lingkana login list","Registering for the Lingkana League puts your name on the login list for every shoot night, including when the host registers himself. An older saved copy of the league cannot wipe a newer sign-up.",'a2320ba']]},
  {v:'v2026-11-17-1030-live',d:'2026-11-17',items:[
   ['target',"Indoor scores 10 to 6","Indoor WA 18 m, 25 m and the combined round use 10, 9, 8, 7, 6 and M. There is no X. On a compound, only the small inner ring is a 10, and the face labels that ring 10 and the rest of the gold 9. Australian Indoor still has an X, which scores 10.",'e12b9a2']]},
  {v:'v2026-11-11-2216-live',d:'2026-11-11',items:[
   ['people',"Tick-box group picker is back","On the Lingkana league, Pick a group opens the earlier tick-box list: tonight's sign-ups first, then the rest of the league, full names, up to 4 ticks, and a lock on anyone already in another group. Start opens scoring.",'941ee0d']]},
  {v:'v2026-11-11-2208-live',d:'2026-11-11',items:[
   ['people',"Get ScoreTool from the register page","The Lingkana register page now has a Get ScoreTool button that opens the app in your browser, with a short note on how to keep it on your phone.",'5fb0084']]},
  {v:'v2026-11-11-2054-live',d:'2026-11-11',items:[
   ['people',"Lingkana League list cleared for a fresh sign-up","The registered archer list on the live Lingkana League is empty again. The test slime sign-up is gone, and Nathe is host only until he signs up on the register page. Host tools and the scoring password still work.",'858c12b']]},
  {v:'v2026-11-11-1908-live',d:'2026-11-11',items:[
   ['people',"Lingkana League, ready for 18 Nov","The poster register link is now the live register page, with a Share button. The host has a Registered archers page to tick who has paid for each 660 night (a record only — the app does not take payment). Standings, Share and Print show each archer's full name, with no email or phone. A small Beta label sits on the league screen. Test scores have been cleared so the nights start empty.",'d330bf1']]},
  {v:'v2026-11-11-1824-live',d:'2026-11-11',items:[
   ['target',"Lingkana League","The Lingkana League is now in the app. After each end the Score Sheet shows everyone in the group, the same as a solo round. Standings list every archer, slide sideways for the nights, and have Share and Print.",'0555f4f'],
   ['book',"Archery Australia target rounds","Score now includes the target rounds from Archery Australia Schedule 9A. Tools, Rounds, lists the distances and faces when a club names the round.",'0555f4f']]},
  {v:'v2026-11-01-1446-relayhold',d:'2026-11-01',items:[
   ['check',"Fewer sends to the score relay","The app re-sends your whole league or group card when it opens at most once every half hour, and if the relay is busy it waits 15 seconds before trying that again. Your scores still send as you shoot, and anything waiting sends as soon as the relay or your signal is back.",'a7ea130']]},
  {v:'v2026-11-01-1349-ac6',d:'2026-11-01',items:[
   ['arrow',"Build an arrow: a new Help guide","Help has a new guide, Build an arrow: eight steps from your bow details and the spine chart to cutting, gluing and a bare-shaft or paper tune. Each step shows where it comes from (Easton's guides and Bow International) and has a link that opens the right box in the Arrow chooser.",'b58d178']]},
  {v:'v2026-11-01-1343-ac5',d:'2026-11-01',items:[
   ['arrow',"Fletching suggestion in the Arrow chooser","Under the Arrow chooser result there is now a fletching suggestion for what the arrow is for: bigger, longer vanes indoors, short low-profile vanes outdoors, and how to keep vanes clear of a launcher rest on a compound. Each line shows where it comes from: Easton's Tuning Guide or Bow International's vane guides. These suggestions are not from Dr Park.",'96361f8']]},
  {v:'v2026-11-01-1342-ac4',d:'2026-11-01',items:[
   ['arrow',"Heavy point and FOC warnings","The Arrow chooser now warns when a heavy point takes Easton's chart past its top row, and tells you the heaviest point that still reads on it. Gold Tip says when your front weight is over its 150 gr column. Under FOC, a note shows when FOC is over Easton's 16% tuning limit, or over 15% for indoor.",'6bd55e3']]},
  {v:'v2026-11-01-1334-ac3',d:'2026-11-01',items:[
   ['arrow',"Shortest safe cut in the Arrow chooser","Under Arrow length there is a new helper for the shortest safe length. At full draw, have someone mark an extra-long arrow where it touches the front of your rest, measure from the bottom of the nock groove to the mark, and type it in. The chooser adds Easton's 1 inch for safety and shows the chart spine and FOC at that length. Tap Use to make it your arrow length. If your arrow is shorter than that, it says so.",'dd19439']]},
  {v:'v2026-11-01-0941-ac2',d:'2026-11-01',items:[
   ['arrow',"Easton parts in the Arrow chooser","Pick an Easton shaft in the Arrow chooser and its parts fill in from Easton's 2026 catalogue: for a SuperDrive 27 280, the 100 gr adjustable point with 10, 20 or 50 gr weights, the bushing and the nock. X10, A/C/E, Avance, Vector, Superdrive Micro, SuperDrive 23 and 25, X23 and X27 have their pins, bushings and nocks too. Change them under Arrow parts for FOC. A figure you type still wins.",'8496ebc']]},
  {v:'v2026-11-01-0810-ac1',d:'2026-11-01',items:[
   ['bow',"Arrow chooser uses your bow","The Arrow chooser now starts from the bow you are using, filling in its draw weight, draw length and speed, and follows any change you make in My bows. Bows that are only in Setups & sight marks are listed too. Type in a box to use a different figure. The speed box says which charts use IBO and which use ATA. Is this arrow right? now uses your bow's speed instead of 340 fps.",'2eb62ef']]},
  {v:'v2026-11-01-0611-yourdata',d:'2026-11-01',items:[
   ['lock',"Back up your scores","Me > Settings & help has a new Your data card. Save a backup file of your scores, sight marks and settings, and restore it on a new phone or after a reset. When there is no signal a line at the top says the app is offline and saving on this phone. There is also a short privacy note: your scores are kept on this phone, league, match and group scores are shared through a relay, and anonymous usage is recorded by Microsoft Clarity. No account, no login, no payment details.",'33f94c0']]},
  {v:'v2026-11-01-0418-lgauto',d:'2026-11-01',items:[
   ['people',"League scoring moves on by itself","On a shared phone at league, once an archer's 3rd arrow is saved the next archer opens straight away, without jumping to the top of the page, and a line shows whose end was just saved. If you prefer, tick Stay on each archer after the 3rd arrow and tap Next to move on.",'768812d']]},
  {v:'v2026-11-01-0320-squadfix',d:'2026-11-01',items:[
   ['check',"Steadier start on a slow connection","On a slow connection the app could stop with an error while it was still loading. It now waits for all of itself to arrive before showing the first screen.",'7d171df']]},
  {v:'v2026-11-01-0058-stubtests',d:'2026-11-01',items:[
   ['check',"Behind the scenes: safer checks","Behind the scenes only: every automatic check now uses a stand-in for the score relay and switches off offline caching, so a check can never send to the real relay or test an old copy of the app. Nothing in the app changed.",'0f41815']]},
  {v:'v2026-10-31-2302-testfix',d:'2026-10-31',items:[
   ['check',"Behind the scenes: checks fixed","Behind the scenes only: six automatic checks that failed for test reasons, not app faults, now run cleanly. Each check now starts its own local server on a free port, so another program on the test computer can no longer break them. Nothing in the app changed.",'ae27e5e']]},
  {v:'v2026-10-31-2206-ghostx',d:'2026-10-31',items:[
   ['ghost',"Ghost match shows the X count","When you shoot against a ghost, the result card now shows the X count for you and the ghost, so a draw on points shows who had more Xs.",'df2537f']]},
  {v:'v2026-10-31-2113-pbplain',d:'2026-10-31',items:[
   ['trophy',"Plain personal best message","The New PB message at the end of a shoot is now plain text, with no picture symbol.",'8791f05']]},
  {v:'v2026-10-31-1922-bowfilter',d:'2026-10-31',items:[
   ['bars',"Analysis bow filter shows every bow","The bow filter in My archery > Analysis now always lists Compound, Recurve, Barebow and Longbow, and starts on your own bow. All bows is gone, so scores from different bows are never mixed in one chart.",'4c2a6a7']]},
  {v:'v2026-10-31-1828-pbbest',d:'2026-10-31',items:[
   ['trophy',"Personal bests include your practice","My archery > Personal bests now counts the shoots you finish on this phone as well as your official results, for every round type: outdoor, indoor, field, Vegas, practice, your own rounds and 3D. Each score is labelled practice or official, so you can see where your best came from.",'e38c1b6']]},
  {v:'v2026-10-31-1646-pbnote',d:'2026-10-31',items:[
   ['trophy',"Personal best note matches your PB","At the end of a shoot, the Personal best line now counts the same scores as your PB in This shoot vs your usual: your practice and your official results for that round, full rounds only. Before, it only counted practice, so it could say New PB while the card showed a higher official score. A short line under it says what it counts.",'caa964f']]},
  {v:'v2026-10-31-1642-fullround',d:'2026-10-31',items:[
   ['check',"Every round type checked start to finish","Behind the scenes: every round in the app is now scored start to finish by an automatic check before each update (outdoor, indoor, field, Vegas 300, practice, your own rounds, ABA 3D, league nights and the group score card). It checks every end, the running total, the X and 10 counts and that the saved shoot is the same after reopening the app and in Past sessions. All passed. Nothing about how you score has changed.",'8c8bfb8']]},
  {v:'v2026-10-31-1409-clarity',d:'2026-10-31',items:[
   ['lock',"Privacy: how the app is used","We use Microsoft Clarity to see how the app is used (taps and scrolling) so we can improve it; typed details are hidden. Names, emails, notes and anything else you type are masked and never sent. The line is in Me > Settings & help. The app works the same with no signal.",'99bc9de']]},
  {v:'v2026-10-31-1345-endviewer',d:'2026-10-31',items:[
   ['target',"See each end on its own target face","When a shoot is finished, the end-of-shoot card (and Open in Past sessions) now has End by end: one end at a time on its target face, with each plotted arrow numbered in the order you shot it, at the same true size as the rest of the card. It shows End 3 of 10 style, the end total and the running total. On 3-spot faces you see the three spots for that end. Swipe left or right on the face to move between ends, or use the arrow buttons. Arrows scored on the keypad are listed as not plotted. Shoots saved before this update did not keep the shot order (ends were saved highest score first), so their numbers follow the saved order and the card says so. Nothing changes on the scoring screen, and no saved scores change.",'0f46036']]},
  {v:'v2026-10-30-2036-arrowsize',d:'2026-10-30',items:[
   ['target',"Arrows drawn and line cutters scored at their real size","Plotted arrows on new Just me shoots are now drawn at the true width of your shaft on the real face, so a 23 that sits on the 10 line from inside no longer looks like it touches the X, a 27 does, and a thin shaft sits inside the lines with a gap. Pick the Arrow size beside the target face before your first arrow: 27 down to 19 in 64ths of an inch, thin shafts by their outside diameter, or Custom mm. It starts on the arrows ticked in My arrows, and it is fixed once the first arrow is plotted. Scoring change: on new Just me shoots a line cutter now counts only if the edge of your real arrow size touches the line, so a 23 needs to be within 4.56 mm of the line (it used to be 7 mm on 3-spot faces and 5.6 mm on other faces). An arrow just outside that now scores the lower ring. Shoots you have already saved keep their scores exactly as they are; they are never recalculated, and they are still drawn at the size that scored them.",'7b8b2ed']]},
  {v:'v2026-10-30-1840-spotgroups',d:'2026-10-30',items:[
   ['target',"Arrow plot now measures from the centre of the X","The sight guide measures each group from the exact centre of the X, in millimetres on the real face size, and shows how sure it is (plus or minus). It gives a sight move with a direction and amount only when the offset is bigger than the arrows can show by chance, so there is no more 'centred'. On 3-spot faces it also shows where each spot lands. When the spots land in clearly different places it says so: that points to form or setup (head and body position, bow cant, level bubble), not the sight.",'4369eee']]},
  {v:'v2026-10-30-1657-landedface',d:'2026-10-30',items:[
   ['target',"A clearer picture of where your shoot landed","On the card at the end of a shoot (and in Past sessions), the big target under Where this shoot landed now uses the same clean target colours as the three spots under it. It zooms in to just the rings your arrows are in, the shaded glow over the rings is gone, and the group centre cross and your usual group circle sit on top of the arrows without hiding them. The three spots picture, the Analytics Arrow plot and your saved shoots are unchanged.",'6c5bed7']]},
  {v:'v2026-10-28-2103-plot3spot',d:'2026-10-28',items:[
   ['target',"Arrow plots show the real arrows, and the three spots","The Arrow plot used to draw each arrow as a tiny dot, but an arrow scores by its edge touching a ring, so a 9 could look like it was out in the 8 and a tight group looked scattered. Each arrow is now drawn at its true size, so a 9 touches the 9 ring. On a 3-spot target (Vegas or the vertical indoor face) there is also a new picture of the three spots as they sit on the target, with each arrow on its own spot and a count per spot. Your saved shoots are unchanged, they just plot better.",'5d9c7cd']]},
  {v:'v2026-10-28-1948-zoompersist',d:'2026-10-28',items:[
   ['target',"Your zoom now stays put","On the indoor 3-spot target, the zoom you choose (Z1, Z2 or Reset) now stays exactly as you set it. It no longer drops back when you change spots or start a new end, and it is the same in Just me (including against a ghost), Casual, match nights and leagues. Each new end still starts on Spot 1, so you only change the zoom when you want to. If you shoot a single face, it works as before.",'a2179d1']]},
  {v:'v2026-10-28-1356-auto',d:'2026-10-28',items:[
   ['people',"Everyone picks their own target face","In a Casual indoor shoot, each archer can now choose their own face: Three spot or Single face. You set it beside each name when you start the shoot (it starts on the shoot's face), and it can still be changed on the score card until that archer shoots their first arrow. So one person can shoot a Vegas 3-spot while a friend shoots one big single face on the same phone, and you are all still scored against each other with the same X, 10 down to M. Each archer sees their own face, the right score buttons and, if they are the only one on the phone, the plotting. On match nights you can choose Single face too, and a small note tells you when the faces differ. Vegas 300 and leagues are unchanged, and your saved scores and shoots already started are not changed.",'ec1e13e']]},
  {v:'v2026-10-28-0747-auto',d:'2026-10-28',items:[
   ['target',"Single face for indoor rounds","If you can't shoot the three spot, you can now score indoor rounds on one single face. Tap Score, then Just me, pick Indoor WA 18m, Indoor WA 25m or the combined indoor round, and choose Three spot or Single face under Face. Single face is one full target per end, scored X, 10 down to 1 and M, and you can tap where each arrow landed just like any other single face target. It remembers your choice. You can still change the face from the Face button while scoring, until you have plotted an arrow. Three spot is still what you get unless you change it, and your saved scores, totals, leagues and match nights are unchanged.",'9e73f2b']]},
  {v:'v2026-10-27-1045-lgnext',d:'2026-10-27',items:[
   ['people',"League scoring: you press Next","On the league scoring page, when a group shares one phone, the card no longer jumps to the next archer the moment you tap the third arrow. It stays on that archer with their three arrows showing and a big Next button. Check the arrows, then tap Next to move to the next archer, in the same order as before. After the last archer, Next goes round to the first archer for the next end. Undo still takes back the last arrow, including the third. Also fixed: with the target hidden on your own phone, the page no longer jumps when you tap the first arrow of an end or Undo, so it stays where you are, as it does with the target showing. Casual, league scoring rules and saved scores are unchanged.",'e9285cf']]},
  {v:'v2026-10-27-0815-lgpage',d:'2026-10-27',items:[
   ['people',"League scoring opens on its own page","In a league week, tap Score my week or Score group and the scoring now opens on its own page, laid out like Casual scoring: the archer chips, the score buttons, Undo and a Scores table for the group. Tap Back to league (at the top or the bottom) to return to the league screen, which stays as you left it, including the one phone or own phones choice. If you are scoring only yourself you can still plot your arrows on the target face, or hide it and tap the scores. Archers still move on to the next one after three arrows. League scoring rules, the 10 archer limit and saved scores are unchanged.",'e08c3cf']]},
  {v:'v2026-10-26-2235-lgscroll',d:'2026-10-26',items:[
   ['people',"League scoring no longer jumps to the top","When you score a group on one phone in a league week, the page used to jump back to the top after every arrow. It now stays where you are, so the score buttons and the sheet stay on screen. Only choosing a different archer (or opening or leaving the week) starts at the top. Scoring and saved scores are unchanged.",'ea09434']]},
  {v:'v2026-10-26-2145-leslie',d:'2026-10-26',items:[
   ['people',"Move an archer between phones any time","In a league week the host can now move an archer who has already started between Own phone and Phone 1, 2 or 3, and back. The ends already scored stay exactly as they are and scoring carries on from the next end. Before, a started archer's buttons were greyed out.",'a3cd686']]},
  {v:'v2026-10-26-2027-chipcolors',d:'2026-10-26',items:[
   ['target',"Light theme: score chips and archer names are readable","On Casual and League score cards, and on Vegas match play, the arrows you have just shot (X 10 9 8 7) were dark navy with dark text in the light theme, so you could not read the scores. They are now light chips with dark text, and the archer name pills are light too. The dark theme looks the same as before. Nothing saved has changed.",'1c75ce3']]},
  {v:'v2026-10-26-1955-ghosttie',d:'2026-10-26',items:[
   ['target',"Ghost match: a tied end is readable again","On the Ghost match panel, an end where you tied the ghost (for example 30 against 30 on Vegas 300) was drawn in white text on a white card in the light theme, so it looked like an empty end. It now shows in the normal text colour, the same as the Ghost row, and the gap figure on the ghost bar does the same when you are level. Your scores were never missing and nothing saved has changed.",'c1072bd']]},
  {v:'v2026-10-26-1946-vgtab',d:'2026-10-26',items:[
   ['target',"Vegas 300: the Ends so far card is gone","The Ends so far card that sat under Back and Next while you scored Vegas 300 and Vegas 300 (18 m) has been removed. Nothing else on the Vegas scoring screen changed, and the scorecard screen still shows every end. Your saved scores are not changed.",'f0f9d07']]},
  {v:'v2026-10-26-1843-undozoom',d:'2026-10-26',items:[
   ['target',"Indoor faces: Undo, zoom and the End box fixed","On an indoor round with the 3-spot face (Just me, League and Casual), Undo now takes back the arrow you just shot, with its plotted marker, even after the end has sorted itself high to low. Before, a finished end put its arrows in score order, so Undo could remove the lowest score instead of the arrow you had just shot and leave a marker on the target that no longer matched the arrow list. Zoom now clears when the next end opens, when you come back from the sheet, and when you change spot, so you always start on the full face and zoom in only if you want to. The End box on the right shows the running total of the end on screen (0 on a new empty end), and Prog is the total through that end. Your saved scores and positions are not changed.",'c2a35af']]},
  {v:'v2026-10-26-1756-ghostpick',d:'2026-10-26',items:[
   ['ghost',"Ghost match: pick who to race, and it works again on Australian Indoor 18m","The ghost box was greyed out on Australian Indoor 18m even when you had scored it before. It now unlocks whenever you have any past score of that round: part-shot rounds, rounds on a different face (3-spot or single) and your competition results all count. If the ghost was shot on a different face from yours, a note says so. There is a new Choose who list: any past score with its date and score (your PB and best marked), your PB, your average, and the world or national record for that round. A record only has a total, so it races as an even pace line and says so. Where no record is confirmed it says Record not available (the World Archery 18 m records are listed; no Australian record figures could be confirmed yet). The records live in one small file, data/records.json, with sources. Your saved scores are not changed.",'068b45c']]},
  {v:'v2026-10-26-1732-indoorparity',d:'2026-10-26',items:[
   ['target',"League and Casual indoor scoring now work like Just me","League weeks and Casual shoots on an indoor round (Vegas 300 and Australian Indoor 18m) now score exactly like Just me when you are the only archer on the phone. The 3-spot face is plotted with each arrow measured from its own spot, the X 10 9 8 7 6 M buttons give the same values, and a full end of 3 is put in order (X first, then highest). You get the End and Prog boxes, your arrows as tappable chips (tap one to fix it, or delete it), Undo, and the table of ends with a total each end. The face and the score buttons fit on the phone screen together and stay put after each tap. Your League scores are saved as a session with the plotted arrows, so your groups and heatmaps include them, and the analysis (round summary, where the shoot landed, sight move guide) shows straight under your score when you finish. Old scores load as before: nothing saved was changed, and only plot positions are added. Scores sent to other phones in the league are still the end scores only, no plot positions. Fixing or deleting an arrow works on the end you are shooting; an earlier end is changed with Undo. Fair play checks still only apply to Just me practice.",'c1a513a']]},
  {v:'v2026-10-25-1451-pgcomp',d:'2026-10-25',items:[
   ['clip',"Peel group card: Competition complete","Peel is two days. After Day 1 or after Day 2, tap Competition complete on the group card. It merges Day 1 and Day 2 for each archer (each half, each day total and the overall total) into a separate results record, shows the results table, and lets you share each archer's full competition sheet with their own name on it, plus one combined results summary. If only one day has been scored it says one day only. Your saved Day 1 and Day 2 scores are not changed. The Start Day 3 button is gone once two days exist.",'4348def']]},
  {v:'v2026-10-25-1440-pgshare',d:'2026-10-25',items:[
   ['check',"Peel group card: each archer's own name when sharing","Sharing an archer's sheet from the group card now puts that archer's own name on the picture, in the share title and message, and in the file name. It used to show the name of the phone's owner on every archer's sheet. A junior named on the card still shows by nickname only. The sheet view also showed the share button twice: the gold Share score sheet button inside the sheet is gone and the blue Share sheet button below it is the one to use. Scores, saved days and names are exactly as they were.",'77b7262']]},
  {v:'v2026-10-25-1434-pgscroll',d:'2026-10-25',items:[
   ['clip','Peel group card: score buttons and sheet stay together',"After you tap a score the card no longer jumps back to the top. The archer's name, the score buttons and the updated sheet now stay in view together, and the big Next button sits at the bottom of the sheet (below the grid, above the totals). Tap Next to move on to the next archer. The card lines up the same way after every tap, so nothing flicks between taps. Scores, saved days and names are exactly as they were.",'d1d963d']]},
  {v:'v2026-10-25-0559-glyphicons',d:'2026-10-25',items:[
   ['check','Ticks, stars and crosses are now line icons',"The plain text tick, star and cross marks in the app (for example Saved, Copied, verified, new PB, Exit round, Delete arrow and the selected option on the Score tab) are now drawn as the same small navy and gold line icons as the rest of the app, in light and dark. This only changes how they look. Your scores, saved rounds and names are exactly as they were.",'33af300']]},
  {v:'v2026-10-25-0048-peelsave',d:'2026-10-25',items:[
   ['clip','Peel group card: Saved only when it is true',"If you tap Save on a day and then undo a target and score it again with a different result, the card used to keep saying Saved with the old totals. It now says the scores changed and the Save button comes back, so you tap it to update the saved copy. If the scores are the same as when you saved, it still says Saved. It also now says where to find a saved day: under Clubs, Group score card (it said the Score tab before).",'9cedf4a'],
   ['bars','Analytics round list matches Stats',"The round list in Analytics now sits in the same order as the Stats round picker, and shows the same label for results entered under the event's own round name (Field Red). Nothing about your scores changed.",'9cedf4a']]},
 {v:'v2026-10-25-0006-calfix',d:'2026-10-25',items:[
  ['calendar','Calendar card no longer covers the target',"The small card asking to add your finished scores to your Archery Calendar could pop up over the target face while you were scoring a casual shoot or a league week. It now waits until you are not scoring. It still shows only once, and you can ignore it.",'f61bc38'],
  ['check','Squad activity wording',"Under a squad member's official result it now says verified, official result (it named another website before). Nothing else about the result changed.",'f61bc38']]},
 {v:'v2026-10-24-2351-csvcomma',d:'2026-10-24',items:[
  ['bow','Load CSV: decimal commas',"Load PDF or CSV now reads a spreadsheet CSV that uses semicolons between columns and a comma as the decimal point, which is how a spreadsheet saves it in many countries. Before, a mark like 18,5 was split in two and loaded as 18 and 5. Now it loads as 18.5. A comma-separated CSV with the mark in quotes, like \"18,5\", works too. Files that already worked load exactly as before.",'a0b07ac']]},
 {v:'v2026-10-24-1917-abanext',d:'2026-10-24',items:[
  ['clip','Peel group card: sheet and Next button',"On the State Titles group card, the full score sheet of the archer you are scoring now sits under the score buttons, the same sheet as the ABA scorer: every target with its score and running total, the block totals, both halves and the round total. After the last arrow of a target the card stays on that archer, showing their updated sheet, until you tap the big Next button, which names the archer who is up next. Undo still works while it is waiting and takes the last target back, and the Sheet button for each archer is still there. If you close the app while it is waiting, it is still waiting when you come back.",'50bc2a6'],
  ['clip','Peel group card: Save the day',"When every target is scored for every archer, a Save button appears. Tap it to keep a final copy of that day's scores for the whole group. It tells you in plain words that the scores are saved and where to find them: on this phone, under Clubs, Group score card, ABA State Titles at Peel, Day 1 or Day 2, Open. Tapping Save again just refreshes the same record, so nothing is doubled. Scores were already saved after every target, so nothing is lost if you never tap it. Nothing is added to anyone's own rounds or stats.",'50bc2a6']]},
 {v:'v2026-10-24-1024-facecard',d:'2026-10-24',items:[
  ['target','Target face when you score only yourself',"In a casual shoot or a league, if you are the only archer you are scoring on your phone, you now get the same target face as Just me. Tap where each arrow landed (or hold to aim with the magnifier), use the zoom, and pick a spot on 3-spot faces. Indoor, outdoor and field faces all work, and the score buttons are still there. Where your arrows landed is saved with your session, so your groups and heatmap pick them up. When two or more archers are scored on one phone, 3D and ABA stay buttons only. Your saved scores are not changed.",'9f5f225']]},
 {v:'v2026-10-24-1019-abasheet',d:'2026-10-24',items:[
  ['target','ABA sheet so far, target by target',"The casual 3D ABA card now shows the same full sheet as the Just me ABA scorer, under the score buttons and on screen the whole shoot. Every target has its own row with the score and the running total for its 10 targets, with the block total under each 10, both half totals, the round total, and your count of 20s and 18s. The target you are on is marked. When the shoot is finished the Totals card shows the same sheet for each archer. It is display only, so your saved scores and totals are not changed.",'4665ec5']]},
 {v:'v2026-10-24-0946-abatotals',d:'2026-10-24',items:[
  ['target','ABA totals on the card',"The casual 3D ABA card now shows the same running totals as the Just me ABA scorer: your total, the most you can still score, each half with its 10-target blocks, and your last target with the running total for its block. When the shoot is done the same totals show under the scores. Your saved scores are not changed.",'b6bf74e']]},
 {v:'v2026-10-24-0939-abafix',d:'2026-10-24',items:[
  ['target','3D ABA scoring, one arrow at a time',"In a casual 3D shoot with the ABA 3-arrow and 1-arrow rounds (for example State Titles day one: 40 targets 3-arrow, then 40 targets 1-arrow), the card now works like the Just me ABA scorer. It shows the half and the target number, then Arrow 1 with 20, 18, 16 and Miss. Tap Miss and it moves to arrow 2 (14, 12, 10), then arrow 3 (8, 6, 4). The first arrow to score counts. Undo steps back one arrow, then one target. Totals and the 20s and 18s counts are the same as before, and your saved scores are not changed.",'6ab79ad']]},
 {v:'v2026-10-24-0815-sightcard2',d:'2026-10-24',items:[
  ['card','New sight card design',"The printed sight card now looks like a business card: the Archery Calendar header with a gold line, then your marks on the front and your bow settings on the back. Same size, same printing: 100% (Actual size), double-sided.",'6951fa1']]},
 {v:'v2026-10-24-0750-sightcard',d:'2026-10-24',items:[
  ['card','Print a sight card',"In Sight marks, tap Print sight card. Pick the distances (5 to 60 m to start) and get an A4 PDF with two credit-card-size cards: your marks on the front, your bow and arrow settings on the back. Print at 100% (Actual size), double-sided, cut on the corner marks and laminate.",'2fd0b42']]},
 {v:'v2026-10-24-0545-calmine',d:'2026-10-24',items:[
  ['calendar','Calendar opens My events',"The Calendar tile on Home now opens your My events on archerycalendars.com, so you see your own calendar straight away. Sign in there if it asks.",'8eb05bd']]},
 {v:'v2026-10-23-1735-arrowcheck',d:'2026-10-23',items:[
  ['arrow','Save calculator results to an arrow',"Pick an arrow in the speed or FOC calculator and tap Save to this arrow. It keeps the FOC, total weight, speed, the bow and the date on that arrow, and My arrows shows them. Your shaft, spine, length and points are only changed if you changed them in the calculator and say yes.",'54ca35c'],
  ['check','Is this arrow right?',"After the calculators, a plain-words check: FOC too low, good or high for indoor, outdoor target, field, 3D or hunting, and spine too stiff, about right or too weak from the maker's chart for your bow. It shows the range it used and the source. It is a guide: confirm it by bare-shaft or paper tuning.",'54ca35c']]},
 {v:'v2026-10-23-1533-ausindoor',d:'2026-10-23',items:[
  ['target','Australian Indoor 18m',"The 30-arrow Australian Indoor round is in the round list. Pick the face before you start: vertical 3-spot (the traffic light), triangular 3-spot or the single 40cm face. It is the same round whichever face you shoot, so your PBs and averages stay together. Works in Just me, Casual shoots and head-to-head.",'3a1ec58'],
  ['check','Plotting on the traffic light',"Arrows plotted on the vertical 3-spot are measured from the spot they hit, so the plot, group patterns and your scores all agree. Older sessions are not changed.",'3a1ec58']]},
 {v:'v2026-10-23-1447-sweep',d:'2026-10-23',items:[
  ['target','3-spot groups fixed',"Group patterns, the arrow plot and the end-of-shoot view now measure every 3-spot arrow from the spot it was shot at, then overlay them on one spot. A tight Vegas round now shows as a tight group in the gold. Your arrows are not changed.",'148a6a6'],
  ['target','Arrow plot',"Analytics shows a real dot for each plotted arrow on the right face, with soft shading, your group centre and a sight guide in mm.",'ea202d1'],
  ['bars','This shoot vs your usual',"Under your score at the end of a round: score vs your average and PB, score by end, Xs and 10s, and your plot vs your usual group for the same round. Open in Past sessions shows the same view.",'9e65b26'],
  ['check','Finish session',"A clear Finish session button closes the round. Your arrows were already saved as you went, so nothing is saved twice.",'9e65b26'],
  ['arrow',"Today's arrows","Tap the number to edit it in place. Set, +/- and Reset no longer jump to Home.",'8c18895'],
  ['check','Small fixes',"Parent view Preview has a back button, and saving your display name keeps the Profile back button.",'91821d0']]},
 {v:'v2026-10-23-1341-brand',d:'2026-10-23',items:[
  ['check','Plainer wording',"Screens now call your official scores past competition results. Your scores and settings are not changed.",'36c0212'],
  ['globe','Apps I use',"Apps I use no longer suggests example apps. Add the links you use with Paste link or Find in store.",'36c0212']]},
 {v:'v2026-10-23-1333-sightest',d:'2026-10-23',items:[
  ['target','Estimate other marks',"In Setups & sight marks, tap Estimate other marks once you have 3 or more marks. Empty distances show an estimate marked est. Confirm each one on the range.",'957373b'],
  ['check','Your marks stay yours',"Estimates never change a mark you typed. Type over an estimate to make it your own mark, or tap Clear estimates to remove them all.",'957373b']]},
 {v:'v2026-10-23-1324-arrowpick',d:'2026-10-23',items:[
  ['arrow','Pick from My arrows',"The Calculators, the Arrow chooser and the Arrow optimizer each have a My arrows choice. Pick a set to fill in its length, weights and balance point. You can still change any box.",'f81fa58'],
  ['target','Arrow set in tuning sessions',"A new tuning session can save the arrow set you pick, so you can see later what you shot. Old sessions are not changed.",'f81fa58']]},
 {v:'v2026-10-23-1316-myarrows',d:'2026-10-23',items:[
  ['arrow','My arrows',"My archery now has My arrows. Add each arrow set once: shaft, spine, length, point and total weight, and fletching. Your sets with sight marks are already there.",'88b86f9'],
  ['calc','FOC for each arrow set',"Add the part weights, or a measured balance point, and My arrows works out FOC with the same Easton formula as the Arrow chooser.",'88b86f9'],
  ['target','One list for sight marks',"The Arrow set choice in Setups & sight marks is the same list as My arrows.",'88b86f9']]},
 {v:'v2026-10-23-1312-loadpdf',d:'2026-10-23',items:[
  ['clip','Load PDF or CSV',"The sight marks button is now Load PDF or CSV. It reads any sheet with a column of ranges and a column of marks, and you can still paste marks.",'952cb79']]},
 {v:'v2026-10-23-1222-sightimport',d:'2026-10-23',items:[
  ['clip','Import sight marks',"In Setups & sight marks, tap Load PDF or CSV. Load a PDF or CSV with range and mark columns, or paste your marks. It works offline.",'52c7493'],
  ['check','Check before saving',"A preview shows every distance first. Your own marks are kept unless you choose Replace existing marks, and it asks before replacing.",'52c7493']]},
 {v:'v2026-10-23-1216-aceseed',d:'2026-10-23',items:[
  ['bow','Full sight mark sheets',"Sight marks now show every distance you have a mark for, even 2 m to 120 m. Long lists scroll, with the headings kept at the top.",'0485eec'],
  ['gear','More arrow set details',"Arrow details also hold total weight, speed, sight height, sight radius and the distances you sighted in at.",'0485eec'],
  ['check','Setup screen keeps its place',"Changing the bow setup or arrow set in Setups & sight marks stays on that screen, with the back button.",'0485eec']]},
 {v:'v2026-10-23-1145-arrowsets',d:'2026-10-23',items:[
  ['bow','Sight marks for each arrow set',"In Sight marks, pick an Arrow set as well as the bow setup. Each set has its own marks. Your marks from before are under Arrows 1, unchanged.",'cd136d5'],
  ['gear','Arrow set details',"Save the shaft, spine, length and point for each set, or fill them from the Arrow chooser.",'cd136d5']]},
 {v:'v2026-10-23-1140-arrowuse',d:'2026-10-23',items:[
  ['bow','Arrow chooser by use',"Pick Target, Indoor, Field, 3D or Hunting. Indoor lists fat shafts only, like SuperDrive 23 and X23. Hunting uses Easton's hunting chart.",'f8ef253'],
  ['search','Result at the bottom',"Fill in from the top down. The result sits under everything it uses, and shows how the chart weight was worked out.",'f8ef253'],
  ['book','Dr James Park notes',"What his research says about spine and shaft choice, with sources. The spine numbers still come from the makers' charts.",'f8ef253']]},
 {v:'v2026-10-23-1000-whatsnew',d:'2026-10-23',items:[
  ['bell',"What's new","This page. After each update a short note shows once on Home.",'8463cdd'],
  ['book','Help guides rebuilt',"New guides for the new layout. They follow light or dark mode and print on white.",'8463cdd']]},
 {v:'v2026-10-23-0915-photos',d:'2026-10-23',items:[
  ['camera','Score photos',"After you finish a round you can add a photo, or tap Skip. Change or remove it later in Past sessions. Photos are made small and kept on your phone.",'959ac11'],
  ['calendar','Send past rounds to Archery Calendar',"Rounds finished before you linked now have a Send button in Past sessions. Pick the right event, or None of these.",'3465077'],
  ['target','Arrow counts in round lists',"Round pickers show how many arrows each round has, like 72 arrows.",'4948a08'],
  ['bars','How far an unfinished round got',"Past sessions shows progress beside Incomplete, like 6 of 12 ends.",'4948a08'],
  ['ghost','Ghost match icon',"Ghost match has its own line icon.",'4948a08'],
  ['check','My rounds buttons fixed',"Start, Edit and Delete in My rounds always work, and the card only shows under Just me.",'9afb505 6050980'],
  ['bow','Casual shoot: 3D',"Casual shoot has a 3D choice: ABA, IBO and ASA scoring, with the number of targets you pick.",'3ba9958'],
  ['flag','Events on score sheets',"Tie a score to an Archery Calendar event. The event name heads the score sheet.",'31af716']]},
 {v:'v2026-10-22-2215-mybows-all',d:'2026-10-22',items:[
  ['home','New layout',"Home, Score, My archery, Clubs and Tools. Me is at the top. Finish later keeps a round for another time.",'edd2d9a'],
  ['check','Back buttons',"Every inner screen has a Back button, and the phone's own back works too.",'edd2d9a'],
  ['sun','Light or dark',"Switch in Me > Settings & help, or with the target-face button at the top.",'edd2d9a 010ddb2'],
  ['star','Line icons',"Simple navy and gold icons replace emoji.",'65c1109'],
  ['bow','My bows',"Add your bow's make, model and specs from a list of 245 bows from the makers' own pages.",'6550cbf 9696d94'],
  ['search','Arrow chooser',"Tools > Arrow chooser gives a starting spine and cut length from the makers' charts.",'e2a5cbe'],
  ['book','Rules',"Tools > Rules has World Archery, Archery Australia, ABA, IBO and ASA, with sources.",'733638d'],
  ['trend','Full analysis follows your pick',"End by end and Half split use the shoot you pick in Personal bests.",'0b77a71 3781099'],
  ['clip','Peel State Titles: Day 1 and Day 2',"The group score card shows both days and an event total.",'358890c'],
  ['target','Tuning arrows count',"Arrows plotted in the Arrow optimizer count toward the day's arrows.",'b8c67e0'],
  ['check','iPhone tab bar',"The tab bar sits right at the bottom in the iPhone home-screen app.",'010ddb2 9e6d102']]},
 {v:'v2026-10-21-1735-casual-shoot',d:'2026-10-21',items:[
  ['people','Casual shoot',"Score tab: Just me, Casual shoot or League shoot. A casual shoot is a one-off group shoot for 1 to 10 people, with match play if you want it.",'8fa9cc2']]},
 {v:'v2026-10-20-1830-offline',d:'2026-10-20',items:[
  ['globe','Works offline',"The app opens and scores with no signal. It catches up when you are back online.",'a0aaf00'],
  ['trophy','Leagues and shoot-ups',"Leagues: weekly rounds, then a shoot-up final.",'971b79b 37c3276'],
  ['swords','Match night',"Head-to-head with up to 10 archers, each on their own phone.",'0e6ea9b df27f5a'],
  ['clip','Group score card',"Score your whole group on one phone at the Peel State Titles.",'e5eea68'],
  ['card','Display names',"Pick a nickname. It shows in squads, leagues and matches.",'adf7a84']]},
 {v:'v2026-10-18-1936-colourblind',d:'2026-10-18',items:[
  ['gear','Colour-blind safe mode',"A Settings tick for red-green safe colours: white marks, numbered arrow dots, blue and orange.",'81b7c78'],
  ['bulb','Side hill tip',"A tip card for field and 3D rounds on the Score screen.",'b956191'],
  ['up','Share your score sheet',"Share a score sheet as a picture.",'f06ab36'],
  ['bars','Stats redesign',"One round picker, four main cards and More detail, in plain words.",'cd86e07']]},
 {v:'v2026-10-17',d:'2026-10-17',items:[
  ['search','Zoom button',"One small button on the target: Z1, Z2, then Reset. Pinch still works.",'43dba93'],
  ['medal','My best scores',"Your best full round for each round, end by end, from your past competition results.",'7c03766'],
  ['ghost','Ghost match',"Shoot against a past score, end by end, or against top-ranked archers.",'be54eb3 c46826e']]}
];
(function(){
const KEY='scoretool.whatsnew.seen';
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ic=n=>(window.icon&&icon(n))||(window.icon&&icon('dot'))||'';
const fmt=d=>{const [y,m,x]=d.split('-').map(Number);return new Date(y,m-1,x).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short',year:'numeric'})};
const L=()=>window.WHATSNEW||[];
const seen=()=>{try{return localStorage.getItem(KEY)||''}catch(e){return''}};
const markSeen=()=>{try{if(L()[0])localStorage.setItem(KEY,L()[0].v)}catch(e){}};
window.wnMarkSeen=markSeen;
function wnView(){markSeen();shownNow=false;const days=[];L().forEach(e=>{const g=days.find(x=>x.d==e.d);if(g)g.items.push(...e.items);else days.push({d:e.d,items:[...e.items]})});
 app.innerHTML=`<div class="card wnhead"><span class="kicker">Release notes</span><h2>What's new in ScoreTool</h2><p class="small muted" style="margin:0">Newest first. Short notes on each update.</p></div>
 ${days.map(g=>`<section class="card wnday"><h3 class="wndate">${h(fmt(g.d))}</h3><ul class="wnlist">${g.items.map(([i,t,s])=>`<li><span class="wnic" aria-hidden="true">${ic(i)}</span><span><b>${h(t)}</b><small>${h(s)}</small></span></li>`).join('')}</ul></section>`).join('')}
 <div class="card"><button class="btn ghost full" data-go="help">${ic('book')} Help guides</button></div>`;
 app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>nav(b.dataset.go))}
window.EXTRA_VIEWS=Object.assign(window.EXTRA_VIEWS||{},{whatsnew:wnView});
/* one-time card on Home after an update; never while a round is being scored */
let shownNow=false;
function maybeCard(){try{
 if(typeof TESTER=='undefined'||!TESTER||typeof S=='undefined'||!S.unlocked||!S.profile)return;
 if(/^#(share|coach)=/.test(location.hash))return;const tabs=document.getElementById('tabs');if(tabs&&tabs.hidden)return;
 if(typeof cur!='undefined'&&cur)return;if(currentView()!='home')return;
 const top=L()[0];if(!top||(!shownNow&&seen()==top.v))return;if(document.getElementById('wncard'))return;
 if(!shownNow){shownNow=true;markSeen()}
 const items=top.items.slice(0,3).map(x=>x[1]);
 app.insertAdjacentHTML('afterbegin',`<div class="card wncard" id="wncard" role="status"><span class="wnic" aria-hidden="true">${ic('bell')}</span><div class="wntx"><b>Updated: what's new</b><small>${h(items.join(' · '))}</small><button class="btn ghost" id="wnopen">See what's new</button></div><button class="wnx" id="wnx" aria-label="Dismiss what's new">${ic('cross')}</button></div>`);
 document.getElementById('wnopen').onclick=()=>{shownNow=false;nav('whatsnew')};
 document.getElementById('wnx').onclick=()=>{shownNow=false;const c=document.getElementById('wncard');if(c)c.remove()};
}catch(e){}}
function currentView(){try{return view}catch(e){return null}}
window.wnMaybeCard=maybeCard;
let q=false;const watch=()=>{const a=document.getElementById('app');if(!a)return;new MutationObserver(()=>{if(q)return;q=true;queueMicrotask(()=>{q=false;maybeCard()})}).observe(a,{childList:true})};
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',()=>{watch();maybeCard()});else{watch();setTimeout(maybeCard,0)}
})();
