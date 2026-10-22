/* Tester profiles. Each tester's data lives in its own localStorage key so testing never mixes.
   Nathe keeps the original key. Every tester with data:true gets his own real Archer's Diary history (data/sheets_<id>.json,
   data/ad_<id>.json, built from scores.db); bow = the only bow that feeds his stats (other bows are kept in the file, left out).
   ad = the archer's name on Archer's Diary when it differs. data:false = no confirmed Archer's Diary match yet, so the profile starts empty.
   Names only, no contact details. Real names show in personal places (sign-in, home, Me, score sheets, coach summary, parent and
   coach links, suggestions); social and competitive views (h2h, match night, squad, league, badges, share images) show the
   tester's chosen nickname instead (names.js). junior:true = under 16. */
const TESTERS=[{id:'nathe',name:'Nathaniel Stride',short:'Nathe',bow:'Compound',data:true},
 {id:'phill',name:'Phill Arthur',short:'Phill',ad:'George Philip Arthur',bow:'Compound',data:true},
 {id:'logan',name:'Logan Wolfe',short:'Logan',bow:'Compound',data:true,junior:true},
 {id:'steven',name:'Steven Snook',short:'Steven',bow:'Compound',data:true},
 {id:'joseph',name:'Joseph Snook',short:'Joseph',bow:'Compound',data:true,junior:true},
 {id:'michael',name:'Michael Choong',short:'Michael',bow:'Compound',data:true},
 /* Dana: listed as 'Dana Matete' in Phil's group; Archer's Diary has him as Dana Chapman-Bureny (Gosnells, male, compound, member 32545), the only Dana at Gosnells. */
 {id:'dana',name:'Dana Chapman-Bureny',short:'Dana',bow:'Compound',data:true},
 {id:'tahuri',name:'Tahuri Burney',short:'Tahuri',ad:'Tahuri Engelen-Burney',bow:'Compound',data:true,junior:true},
 /* Estiaan Cronje (Gosnells, AD member 19190, Open compound): added 20 Oct 2026. He stopped shooting; history = the 6 months before his last recorded shoot (16 Feb to 16 Aug 2025). */
 {id:'estiaan',name:'Estiaan Cronje',short:'Estiaan',bow:'Compound',data:true},
 /* Nate Evans (Kalamunda, AD member 20536): confirmed tester 18 Oct 2026. His scores were removed from scores.db at his earlier request, so his profile stays empty until they are pulled again. */
 {id:'nate',name:'Nate Evans',short:'Nate',bow:'Compound',data:false},
 /* Darnie (20 Oct 2026, Nathe): an archer who is NOT a tester. He can be scored, picked in matches, match nights, leagues and groups,
    and has his own link (?tester=darnie), but he isn't in the testers squad and gets no tester suggestion prompts.
    21 Oct 2026: Archer's Diary has him as Danie Oosthuizen (Whiteman Park Archers WA, AD member 8704, compound, Open and 50+), NOT
    Danie-Louis Oosthuizen (same club). History = his full Archer's Diary compound history, 2015 to 2026 (501 scoresheets, same load
    as Estiaan, Nathe 21 Oct 2026). His crawl stays paused in the scores database; this file is a one-off load. Nickname stays Darnie (names.js). */
 {id:'darnie',name:'Danie Oosthuizen',short:'Darnie',bow:'Compound',data:true,guest:true}];
const isGuest=t=>!!(t&&t.guest);window.isGuest=isGuest;
const TESTER=(function(){const q=new URLSearchParams(location.search).get('tester');let id=(q||'').toLowerCase();
 if(id=='nathan'||id=='nathaniel')id='nathe';if(id=='phil')id='phill';
 if(TESTERS.some(t=>t.id==id))localStorage.setItem('scoretool.tester',id);else id=localStorage.getItem('scoretool.tester');
 return TESTERS.find(t=>t.id==id)||null})();
function setTester(id){localStorage.setItem('scoretool.tester',id);const u=new URL(location.href);u.searchParams.delete('tester');u.hash='';location.href=u.toString()}
function testerLink(id){return location.origin+location.pathname+'?tester='+id}
function testerPicker(){return`<div class="card dark"><span class="kicker">Tester sign-in</span><h1>Who's testing?</h1><p>Pick your name. Your scores are saved on this phone, separate from the other testers.</p>
${TESTERS.map(t=>`<button class="btn full" style="margin:8px 0" data-tester="${t.id}">${t.name}</button>`).join('')}<p class="small muted">You can change this later in Me.</p></div>`}
function bindTesterPicker(root){(root||document).querySelectorAll('[data-tester]').forEach(b=>b.onclick=()=>setTester(b.dataset.tester))}
function testerCard(){return`<div class="card"><span class="kicker">Tester</span><h2>Testing as ${TESTER?TESTER.name:'nobody'}</h2><p class="small muted">Each tester's data is kept separate on this phone.</p>
<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start">${TESTERS.filter(t=>!TESTER||t.id!=TESTER.id).map(t=>`<button class="btn ghost" data-tester="${t.id}">Switch to ${t.short}</button>`).join('')}</div></div>`}
