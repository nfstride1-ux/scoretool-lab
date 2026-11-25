/* Help (23 Oct 2026): themed HTML guides for the new layout (replace the old dark picture posters). Each guide is plain steps plus a
   real screenshot in a light and a dark version, swapped by the app's theme; printing (or the PDF) always uses white pages.
   Rebuild the screenshots and PDF with: python3 tools/build_help_shots.py   Send a suggestion: FormSubmit -> nfshold@gmail.com. */
const HELP_V='20261023b';
/* AC6 (1 Nov 2026): Build an arrow guide. Every fact is from the source linked on its step; each step opens its place in the Arrow chooser. */
const HG_ETG='https://eastonarchery.com/wp-content/uploads/2019/08/TuningGuideEaston.pdf',HG_E26='https://eastonarchery.com/wp-content/uploads/2026/03/Easton-2026.pdf',
 HG_FOC='https://eastonarchery.com/2022/06/the-simple-guidelines-to-correct-arrow-balance-foc/',HG_BIV='https://www.bow-international.com/reviews/equipment/the-essential-guide-to-vanes/',
 HG_BIQ='https://www.bow-international.com/faqs/qa-picking-your-vanes/';
const hgSrc=(u,t)=>`<a class="hgsrc" href="${u}" target="_blank" rel="noopener">${t}</a>`,hgGo=(k,t)=>` <a href="#" class="hggo" data-acgo="${k}">Open ${t} in the Arrow chooser</a>`,
 hgFrom=(...l)=>` <span class="small muted">Source: ${l.join('; ')}.</span>`;
const HELP_GUIDES=[
 {id:'start',i:'home',t:'Getting started',shot:'start',steps:[
  'Open the link Nathe sent you. It has your name in it.',
  'The tabs along the bottom are <b>Home</b>, <b>Score</b>, <b>My archery</b>, <b>Clubs</b> and <b>Tools</b>.',
  'Your name at the top opens <b>Me</b>: profile, coaches and parents, settings and help.',
  'Every inner screen has a <b>Back</b> button at the top left.',
  'Your scores are saved on this phone. The app works offline.']},
 {id:'score',i:'target',t:'Score a round',shot:'score',steps:[
  'Tap <b>Score</b>, then <b>Just me</b>.',
  'Pick your round. The list shows how many arrows each round has.',
  'For Indoor WA 18m, 25m and the combined indoor round, a <b>Face</b> choice appears: <b>Three spot</b> (the default) or <b>Single face</b> for archers who shoot one full target per end. Single face scores X, 10 to 1 and M. The choice is remembered, and you can swap it with the Face button until you plot your first arrow. Australian Indoor 18m has its own choice of traffic light, triangular or single. In a Casual shoot and on match nights you can pick Single face too (see Casual shoot). Leagues keep their own faces.',
  'Tick <b>Ghost match</b> to shoot against a past score, end by end. It unlocks as soon as you have any past score of that round, on any face (3-spot or single), including part-shot rounds and your competition results.',
  'Tap <b>Choose who</b> to pick exactly who to race: any past score (date, score, PB and best marked), your PB, your average, or a world or national record. A record only has a total, so it races as an even pace line, labelled as one. If a record is not confirmed it says Record not available.',
  'Tap <b>Start</b>.']},
 {id:'scoring',i:'pen',t:'Plot your arrows',shot:'scoring',steps:[
  'Tap the target where each arrow landed, or tap a score key.',
  'Tap the small <b>Z1</b> button to zoom, <b>Z2</b> for more, then <b>Reset</b>. Pinch works too. On an indoor 3-spot face your zoom stays as you set it, across spots and ends, until you change it. Each new end starts on Spot 1.',
  'Tap an arrow to fix it. <b>Undo</b> takes back the last one.',
  '<b>Finish later</b> keeps the round. Carry on from Score or Home.',
  'Check each end total, then finish the round to save it.']},
 {id:'casual',i:'people',t:'Casual shoot and 3D',shot:'casual',steps:[
  'Tap <b>Score</b>, then <b>Casual shoot</b>.',
  'On Indoor WA 18m, 25m, the combined indoor round and Australian Indoor 18m, each archer picks their <b>own face</b>: <b>Three spot</b> or <b>Single face</b>, beside their name when you set up the shoot, or on the score card until they shoot their first arrow. You can shoot a Vegas or vertical 3-spot and a friend a single 40 cm face in the same shoot. Everyone is still scored against each other on the same X, 10 to M scale. Vegas 300 stays a 3-spot game.',
  'Pick the discipline: Target, Indoor, Field or <b>3D</b>.',
  'For 3D, pick ABA, IBO or ASA scoring and how many targets.',
  'In ABA 3D, tap the score of the first arrow to hit. Tap <b>Miss</b> only if it missed, then score the next arrow. The card shows each half, each 10 targets, and the most you can still score.',
  'Under the score buttons, <b>Your sheet so far</b> lists every target with its score and the running total for its 10 targets, then each block total, each half, the round total, and how many 20s and 18s you have. It is the same sheet as Just me ABA, and it stays on screen all through the shoot.',
  'Add 1 to 10 people. Linked archers score on their own phone.',
  'When you are the only archer on the card (casual shoot or league), the <b>target face</b> shows, just like Just me: tap where each arrow landed, or hold to aim with the magnifier. The score buttons still work, and the arrow positions are kept for your groups and heatmap. League weeks and Casual indoor rounds score like Just me: each arrow is measured from its own spot, a full end is put in order, tap an arrow to fix or delete it, Undo works, and the analysis shows under your score when you finish. With 2 or more archers on one phone it stays buttons only.',
  'Match play is optional, at the start or after the shoot.']},
 {id:'past',i:'camera',t:'Scorecards, photos and Archery Calendar',shot:null,steps:[
  '<b>Scorecards</b> is on Home, the button under Score. Practice scores are grouped as Target, Indoor, Field, Clout and 3D. Tap a shoot to open the scorecard.',
  'Official personal bests are on that same Scorecards page.',
  'An unfinished round shows <b>Incomplete</b> and how far it got, like 6 of 12 ends.',
  'After you finish, tap <b>Add a photo</b> if you like, or <b>Skip</b>. Change or remove it later on Scorecards.',
  'At the end of a round, under the score, you see how this shoot compares with your earlier shoots of the same round: score vs your average and PB, score by end, Xs and 10s, and your arrow plot vs your usual group. Opening the scorecard shows the same view.',
  'Tap <b>Finish session</b> when you are done, then <b>Open this scorecard</b> to see it again. Your arrows are already saved as you go, so Finish session only closes the round.',
  'Linked to Archery Calendar? Finished rounds show in your My events. Older rounds have a <b>Send</b> button on Scorecards: pick the event, or <b>None of these</b>. The one-time card that offers to link your calendar waits until you are not scoring, so it never covers the target.']},
 {id:'stats',i:'bars',t:'Stats and analysis',shot:'stats',steps:[
  'Tap <b>My archery</b>, then <b>Stats &amp; PBs</b>.',
  'Pick a round to see your last shoot, trend and personal bests.',
  'Tap <b>More detail</b> for the full picture.',
  '<b>Full analysis</b> has end by end and half split for the shoot you picked.',
  '<b>Arrow plot</b> in Analytics and at the end of a shoot shows each plotted arrow at the size that scored it, so an arrow that scored a 9 touches the 9 ring. New shoots that draw a target use your real shaft size: pick the <b>Arrow size</b> beside the target face before the first arrow. The list is only the arrows saved in My arrows, each with its name and diameter (for example a SuperDrive 23 is 9.13 mm wide). It starts on the set chosen for your bow, or the set you used last, and it is fixed once the first arrow is plotted. With no saved arrows it links to My arrows and draws at the usual 23 size. The shaft sizes in My arrows, where a set is added, are unchanged. Line cutters on those shoots are scored at that size: the real edge of the arrow has to touch the line (a 23 within 4.56 mm of it). Shoots saved before this change keep their scores and are drawn at the older line-cutter size that scored them (7 mm on 3-spot faces, 5.6 mm on others); they are never recalculated. On 3-spot faces every arrow is measured from its own spot and shown together on one spot, and a second picture shows the three spots as they sit on the target (Vegas triangle or vertical row) with each arrow on its own spot. The group centre is measured in mm from the exact centre of the X, with a ± for how far it can be out by chance with the arrows you plotted. The sight guide gives a direction and the amount on the target only when the offset is bigger than that ±. On 3-spot faces each spot also gets its own centre and spread, and spots that land in different places are flagged as a form or setup check (head and body position, bow cant, level bubble), not a sight move.',
  '<b>End by end</b> on a finished shoot (the end-of-shoot card, or the opened scorecard) shows one end at a time on its target face, each arrow numbered in the order you shot it, with the end total. Swipe left or right on the face, or use the arrow buttons. Shoots saved before 31 Oct did not keep the shot order, so their numbers follow the saved order.']},
 {id:'myarch',i:'bow',t:'Diary, setups and bows',shot:'myarch',steps:[
  '<b>My archery</b> holds your Diary, Practice arrows, Setups &amp; sight marks, My bows and My arrows.',
  '<b>Past competition results</b>: your official scores from past competitions show in Stats, My best scores and Rankings. They are kept separate from rounds you score in ScoreTool.',
  '<b>Practice arrows</b> counts today\'s arrows toward your daily goal.',
  '<b>Sight marks</b>: pick the bow setup, then the <b>Arrow set</b>. Each set of arrows has its own marks for that bow. <b>+ New arrow set</b> adds one; your marks from before are under <b>Arrows 1</b>.',
  '<b>Load PDF or CSV</b> (in Sight marks): load a PDF or CSV with range and mark columns, or paste marks, then pick the bow setup and arrow set. Check the preview, then tap <b>Save</b>. Your own marks are kept unless you choose <b>Replace existing marks</b>. A CSV saved with semicolons and decimal commas (like 18,5) loads correctly too.',
  '<b>Estimate other marks</b> (in Sight marks, once you have 3 or more marks): fills the empty distances with estimates, shown as <i>est.</i> in grey. Your own marks are never changed. Confirm each estimate on the range, then type it in to make it your mark. Past your longest mark the estimates are less sure, and they stop at 1.5 times your longest mark. Tap <b>Clear estimates</b> to remove them.',
  '<b>Print sight card</b> (in Sight marks): pick From and To distances, or <b>Marked distances only</b>, then tap <b>Make PDF</b>. Page 1 is the marks side, page 2 the bow settings side, two cards per page. Print at <b>100% (Actual size)</b>, <b>double-sided</b>, cut on the corner marks and laminate. On iPhone, open the PDF, tap Share, then Print.',
  'A full sight mark sheet shows every distance it has, in a list you can scroll. <b>Arrow details</b> also hold total weight, speed, sight height, sight radius and the distances you sighted in at.',
  '<b>My bows</b> adds make, model and specs from the maker\'s own page.',
  '<b>My arrows</b> lists each arrow set once: shaft, spine, length, point and total weight, fletching and FOC. Tap <b>Edit</b> to add details. It is the same list as the Arrow set choice in Sight marks.',
  'Rankings &amp; classification and Season, badges &amp; recap are here too.']},
 {id:'clubs',i:'shield',t:'Clubs and leagues',shot:'clubs',steps:[
  '<b>Squads</b>: join with a code and cheer your squad.',
  '<b>Leagues</b>: join with a code or start one. Tap <b>Score my week</b> or <b>Score group</b> and scoring opens on its own page, laid out like Casual, with <b>Back to league</b> at the top and bottom. The league screen, including the one phone or own phones choice, stays as you left it. Scoring only yourself, you get the target face to plot your arrows, or hide it and just tap the scores. When several archers share a phone, after the third arrow the card stays on that archer so you can check the three arrows, then tap <b>Next</b> to move to the next archer (<b>Undo</b> still takes back the last arrow). The <b>Onion Shed Challenge</b> is in the Leagues list for its members, with its rules at the top of the league screen.',
  '<b>Match play</b>: head-to-head on two phones, and shoot-ups.',
  '<b>Event scoring</b>: score your whole group on one phone, for an ABA 3D card or an IFAA Field or Hunter card.',
  'On the State Titles group card, the full sheet of the archer you are scoring sits under the score buttons, and the big <b>Next</b> button sits at the bottom of that sheet. After each tap you see the buttons and the updated sheet together. After the last arrow of a target the card stays on that archer so you can check the sheet, then tap <b>Next</b> to move on to the next archer (the card goes back to the top). To share, open an archer\'s sheet and tap the blue <b>Share sheet</b> button: each archer\'s own name is on their own sheet and message. Peel is two days: after Day 1 or after Day 2 tap <b>Competition complete</b> to merge the days into a separate results record (your saved days are not changed) and share each archer\'s full competition sheet or a combined results summary. With one day scored it says one day only. <b>Undo</b> still takes the last target back. When every target is scored, tap <b>Save</b> to keep the day. It is kept on this phone: Clubs, Event scoring, ABA State Titles at Peel, Day 1 or Day 2, <b>Open</b>.',
  '<b>IFAA group cards</b>: on the same Event scoring page, start an IFAA Field or Hunter card for any club, or for the Peel IFAA WA State Titles days. Tap 5, 4, 3 or M for each archer, four arrows a target. <b>Save</b> keeps the day on this phone the same way as ABA.',
  '<b>Following</b>: archers you follow and their feed.']},
 {id:'tools',i:'wrench',t:'Tools',shot:'tools',steps:[
  '<b>Arrow optimizer &amp; tuning</b>: plot groups before and after a change.',
  '<b>Arrow chooser</b>: fill in from the top down (bow, draw weight, draw length, speed rating, what it\'s for, arrow length, point weight). The result is at the bottom: a starting spine and cut length from the makers\' charts, with the working shown.',
  '<b>Shortest safe cut</b> (Arrow chooser, under Arrow length): at full draw, have someone mark an extra-long arrow where it touches the front of your launcher or rest, then measure from the bottom of the nock groove to the mark and type it in. Easton adds about 1" for safety; the chooser shows that length with the chart spine and FOC worked out at it. Tap <b>Use</b> to make it your arrow length. From the Easton Tuning Guide.',
  '<b>Easton parts</b> (Arrow chooser, under Arrow parts for FOC): pick an Easton shaft and its point, insert, bushing or pin, and nock fill in from the weights printed in Easton\'s 2026 catalogue (for a SuperDrive 27 280: the 100 gr adjustable point, with 10, 20 or 50 gr weight modules). Change any part there, or choose None. A figure you type in Point weight, Insert or Nock still wins. Points sold as a weight range are listed but not filled in: type your own weight.',
  '<b>Heavy point and FOC warnings</b> (Arrow chooser): if your point weight pushes Easton\'s chart reading past its top row, the Easton box says so and gives the heaviest point that still reads on the chart; Gold Tip says when your front weight is over its 150 gr column. Under FOC, a note shows when FOC is over Easton\'s 16% tuning limit, or over 15% for indoor. A lighter point or insert brings FOC down.',
  '<b>Fletching suggestion</b> (Arrow chooser, under the result): vane length and profile for what the arrow is for (indoor or outdoor), launcher rest clearance for a compound, and how to check clearance. Each line shows its source: Easton\'s Tuning Guide or Bow International\'s vane guides. Not from Dr Park.',
  '<b>What it\'s for</b>: Indoor lists fat shafts only (like SuperDrive 23 and X23), Target and Field list thin outdoor shafts, and Hunting uses Easton\'s hunting chart.',
  '<b>Calculators</b>: arrow speed, kinetic energy, momentum, FOC. Pick an arrow from My arrows in the speed or FOC card and tap <b>Save to this arrow</b> to keep the FOC, total weight, speed, bow and date on it (shown in My arrows). Your shaft, spine, length and points only change if you changed them in the calculator and confirm.',
  '<b>Is this arrow right?</b> (under the calculators): says if the FOC is too low, good or high for what the arrow is for, from Easton\'s published FOC ranges, and if the spine is too stiff, about right or too weak, from the maker\'s chart (the same chart and adjustments as the Arrow chooser). It shows the range it used. A guide only: confirm by bare-shaft or paper tuning.',
  '<b>My arrows</b> dropdown (Calculators, Arrow chooser and Arrow optimizer): pick a saved arrow set to fill in its length, weights and balance point. You can still change any box.',
  '<b>Rules</b>: World Archery, Archery Australia, ABA, IBO, ASA and IFAA.']},
 {id:'arrowbuild',i:'wrench',t:'Build an arrow',shot:null,steps:[
  `<b>Bow details.</b> Easton: before you start tuning, install everything you will shoot with (bowstring, sight, stabilisers, rest, cushion plunger), and change only one thing at a time. In the Arrow chooser pick Recurve, Barebow or Compound and what the arrow is for, then type your draw weight and draw length.${hgGo('dw','draw weight')}${hgFrom(hgSrc(HG_ETG,'Easton Arrow Tuning and Maintenance Guide p. 1'))}`,
  `<b>Spine from the chart.</b> Easton: successful tuning can only be achieved with a properly spined shaft. The result shows a starting spine from each maker's own chart, with the working. The charts differ, so use the chart for the brand you buy. It is a starting point only: check it with step 8 before buying a full set.${hgGo('res','the result')}${hgFrom(hgSrc(HG_ETG,'Easton Tuning Guide p. 1'),hgSrc(HG_E26,'Easton 2026 catalogue, Target Arrow Size Selection chart pp. 56-57'))}`,
  `<b>Shortest safe cut.</b> At full draw, have someone mark an extra-long arrow where it touches the most forward point of your rest or launcher. Easton's Correct Arrow Length is about 1" in front of that point, measured from the bottom of the nock groove, so the shaft itself is cut slightly shorter. Type your measurement in the Shortest safe cut helper.${hgGo('cut','Shortest safe cut')}${hgFrom(hgSrc(HG_ETG,'Easton Tuning Guide pp. 15-17, Fig. 21'))}`,
  `<b>Point weight and FOC.</b> Easton: if your arrow is too weak, go to a lighter insert or point; if it is too stiff, try a heavier one, within 7-16% FOC. Easton's FOC guidelines give 7-15% for indoor target and 10-15% for outdoor target. Type your point weight, then open Arrow parts for FOC to see the FOC and any heavy-point warning.${hgGo('pt','point weight')}${hgFrom(hgSrc(HG_ETG,'Easton Tuning Guide p. 10'),hgSrc(HG_FOC,'Easton, The Simple Guidelines to Correct Arrow Balance (FOC), 2022'))}`,
  `<b>Bushings and nocks.</b> Tap an Easton shaft in the result, then open Arrow parts for FOC: Easton parts fills in the bushing or pin and the nock printed with that shaft in Easton's 2026 catalogue (for example 4MM Microlite nock 6 gr, G Nock 7 gr, pin nock 2 gr). Easton uses three nock systems: taper fit, internal fit (UNI and ICS) and external fit. Carbon UNI bushings go in with 24-hour flexible epoxy, not hot melt.${hgGo('parts','Easton parts')}${hgFrom(hgSrc(HG_E26,'Easton 2026 catalogue, component lists with each target shaft'),hgSrc(HG_ETG,'Easton Tuning Guide pp. 26-27'))}`,
  `<b>Fletching.</b> The Fletching suggestion under the result gives vane sizes for what the arrow is for, from Bow International's vane guides and Easton: indoor vanes are often 3-4" long with a high profile; outdoor compound vanes are typically 1.87-2.00" and just over 1/4" high, recurve about 1.75". Check the vanes clear the rest with dry powder spray. These are not from Dr Park.${hgGo('fletch','Fletching suggestion')}${hgFrom(hgSrc(HG_BIV,'Tippins, The essential guide to vanes, Bow International 2020'),hgSrc(HG_BIQ,'Tippins, Q&amp;A: Picking your vanes, Bow International 2018'),hgSrc(HG_ETG,'Easton Tuning Guide p. 5'))}`,
  `<b>Cutting, gluing and squaring.</b> Easton: never cut with a rotary tube cutter or hacksaw, and wear a dust mask and safety glasses. With a cut-off tool, cut about 1/3 through the shaft while you turn it, then turn it two more times for a square cut, Then deburr as the guide shows for your shaft type. Square ends give a strong bond: clean inside with 91% isopropyl alcohol, then glue carbon inserts with 24-hour flexible epoxy (fast-drying epoxies are often brittle). Where Easton says hot melt, coat the whole shank. A buzz when you tap the point on a table means it is loose.${hgGo('len','arrow length')}${hgFrom(hgSrc(HG_ETG,'Easton Tuning Guide pp. 13, 17 and 19'))}`,
  `<b>Bare-shaft or paper tune.</b> Bare shaft: from 15 to 20 yards (or metres), shoot at least three fletched arrows, then two bare shafts aimed the same. Fix the nocking point first, until both hit at the same height; then, for a right-handed archer, bare shafts left are stiff and right are weak. Paper: shoot through paper from about 4 to 6 feet; Easton says it is the test most used by compound archers with release aids. You are basically tuned when bare and fletched shafts hit at or very near the same place.${hgGo('res','the result')}${hgFrom(hgSrc(HG_ETG,'Easton Tuning Guide pp. 4-7'))}`]},
 {id:'settings',i:'gear',t:'Settings, light or dark, and help',shot:'settings',steps:[
  'Tap your name at the top, then <b>Settings &amp; help</b>.',
  'Pick <b>Light</b> or <b>Dark</b>. The target-face button at the top switches too.',
  '<b>Add to my Archery Calendar</b> links your scores to your My events.',
  'The <b>Calendar</b> tile on Home opens your My events on archerycalendars.com.',
  'A tick turns on colour-blind safe colours.',
  'Ticks, stars and crosses in the app are small line icons in navy and gold, so they look the same in light and dark. They are only for looks and never change your scores.',
  '<b>What\'s new</b> lists each update. <b>Send a suggestion</b> goes straight to Nathe.']}];
const FORM_URL='https://formsubmit.co/nfshold@gmail.com';
let lastTab='home';
const hIc=n=>(window.icon&&icon(n))||'';
const hgGuest=()=>typeof TESTER!='undefined'&&!!TESTER&&!!TESTER.guest;
(function(){const top=document.querySelector('.top');if(top){const b=document.createElement('button');b.className='help-btn';b.setAttribute('aria-label','Help');b.textContent='?';b.onclick=()=>nav('help');top.appendChild(b)}
 const o=window.nav;window.nav=function(v){if(v!='help'&&v!='suggest')lastTab=v;return o(v)}})();
function helpCards(){return`<div class="card" id="helpcard"><span class="kicker">Help</span><h2>How to use ScoreTool</h2><p class="small">Short guides for every part of the app, and notes on each update.</p><div class="row" style="gap:8px;flex-wrap:wrap;justify-content:flex-start"><button class="btn" data-hgo="help">${hIc('book')} Help guides</button><button class="btn ghost" data-hgo="whatsnew" id="wnbtn">${hIc('bell')} What's new</button>${hgGuest()?'':`<button class="btn ghost" data-hgo="suggest">${hIc('chat')} Send a suggestion</button>`}</div></div>`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-hgo]');if(b){e.preventDefault();nav(b.dataset.hgo)}});
const hgShot=g=>g.shot?`<figure class="hg-fig"><img class="hg-l" loading="lazy" src="help/g/${g.shot}-light.webp" alt="${g.t} screen, light mode" width="390" height="700"><img class="hg-d" loading="lazy" src="help/g/${g.shot}-dark.webp" alt="${g.t} screen, dark mode" width="390" height="700"></figure>`:'';
function helpView(){const open=window._hgOpen||'start';
 app.innerHTML=`<div class="card hghead"><span class="kicker">Help</span><h2>How to use ScoreTool</h2><p class="small muted">Tap a guide to open it. Guides follow light or dark mode and print on white paper.</p>
 <div class="row hgtools" style="gap:8px;flex-wrap:wrap;justify-content:flex-start"><button class="btn ghost" data-hgo="whatsnew">${hIc('bell')} What's new</button><button class="btn ghost" id="hgprint">${hIc('clip')} Print the guides</button><a class="btn ghost" id="hgpdf" href="help/ScoreTool-help-guides.pdf?v=${HELP_V}" target="_blank" rel="noopener">${hIc('book')} PDF to print</a></div></div>
 ${HELP_GUIDES.map((g,n)=>`<details class="card hg" id="hg-${g.id}" data-hg="${g.id}"${g.id==open?' open':''}><summary><span class="hgic" aria-hidden="true">${hIc(g.i)}</span><span class="hgt"><small>Guide ${n+1} of ${HELP_GUIDES.length}</small><b>${g.t}</b></span><span class="go" aria-hidden="true">›</span></summary>
 <div class="hgbody"><ol class="hgsteps">${g.steps.map(s=>`<li>${s}</li>`).join('')}</ol>${hgShot(g)}</div></details>`).join('')}
 ${hgGuest()?'':`<div class="card hgsug"><h2>Got an idea or found a bug?</h2><button class="btn full" data-hgo="suggest">Send a suggestion</button></div>`}`;
 app.querySelectorAll('details.hg').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)window._hgOpen=d.dataset.hg}));
 const pr=document.getElementById('hgprint');if(pr)pr.onclick=()=>window.print()}
/* printing: every guide opens, light screenshots only, white pages (lab.css @media print) */
let _hgWas=null;
addEventListener('beforeprint',()=>{const L=[...document.querySelectorAll('details.hg')];if(!L.length)return;_hgWas=L.map(d=>d.open);L.forEach(d=>{d.open=true;d.querySelectorAll('img').forEach(i=>i.loading='eager')})});
addEventListener('afterprint',()=>{const L=[...document.querySelectorAll('details.hg')];if(_hgWas)L.forEach((d,i)=>d.open=_hgWas[i]);_hgWas=null});
function suggestView(){const who=TESTER?TESTER.name:'',tabs=['Home','Score','My archery','Clubs','Tools','Me','Help','Other'],SEC={home:'Home',score:'Score',myarch:'My archery',stats:'My archery',analytics:'My archery',diary:'My archery',badges:'My archery',recap:'My archery',rewards:'My archery',clubs:'Clubs',squad:'Clubs',follow:'Clubs',tools:'Tools',me:'Me',profile:'Me',whatsnew:'Help'},lt=lastTab||'home',cur=SEC[lt]||(/^lab_(opt|chooser|calc|rules)/.test(lt)?'Tools':/^lab_(squad|leagues|match|group)/.test(lt)?'Clubs':/^lab_(me|profile|people|settings)/.test(lt)?'Me':/^lab_/.test(lt)?'My archery':'Other');
 app.innerHTML=`<div class="card"><span class="kicker">Suggestions</span><h1>Send a suggestion</h1><p class="small muted">Goes straight to Nathe by email.</p>
 <form id="sgForm" method="POST" enctype="multipart/form-data" action="${FORM_URL}" target="sgFrame">
 <input type="hidden" name="_subject" value="[ScoreTool] suggestion from ${who}"><input type="hidden" name="_template" value="table"><input type="hidden" name="_captcha" value="false">
 <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
 <label>Your name<input name="archer" required value="${who}"></label>
 <label>Which part of the app?<select name="page">${tabs.map(t=>`<option${t==cur?' selected':''}>${t}</option>`).join('')}</select></label>
 <label>Your suggestion or problem<textarea name="message" rows="5" required placeholder="What would make it better? What went wrong?"></textarea></label>
 <label>Screenshot (optional)<input type="file" name="attachment" accept="image/*"></label>
 <input type="hidden" name="app_version" value="${(window.WHATSNEW&&WHATSNEW[0]?WHATSNEW[0].v:'scoretool')}"><input type="hidden" name="device" value="${navigator.userAgent.replace(/"/g,'')}">
 <button class="btn full" id="sgSend" style="margin-top:10px">Send suggestion</button></form><iframe name="sgFrame" style="display:none"></iframe><div id="sgOut"></div></div>`;
 const f=$('#sgForm');f.onsubmit=e=>{if(!f.message.value.trim()){e.preventDefault();f.message.focus();return}
  f._subject.value='[ScoreTool] suggestion from '+(f.archer.value.trim()||'an archer');
  if(!navigator.onLine){e.preventDefault();location.href=`mailto:nfshold@gmail.com?subject=${encodeURIComponent(f._subject.value)}&body=${encodeURIComponent('Page: '+f.page.value+'\n\n'+f.message.value)}`;return}
  $('#sgSend').textContent='Sending…';$('#sgSend').disabled=true;
  setTimeout(()=>{f.hidden=true;$('#sgOut').innerHTML='<h2>Thanks!</h2><p>Your suggestion has been sent to Nathe.</p><button class="btn ghost" onclick="nav(\'suggest\')">Send another</button>'},1500)}}
window.EXTRA_VIEWS=Object.assign(window.EXTRA_VIEWS||{},{help:helpView,suggest:suggestView});
