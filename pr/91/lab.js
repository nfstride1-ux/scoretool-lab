/* Layout (22 Oct 2026, tried first in scoretool-lab). Re-groups the existing screens into Home / Score / My archery / Clubs / Tools (+ Me in the top bar)
   and adds the idea-list tools. Every existing screen is reused as-is (same data, same code); this file only picks which cards show where. Nothing here renames, rewrites or deletes stored data: new settings only add their own keys or fields. */
(function(){
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* R1 (3 Nov 2026, Nathe via Archery Coach): sane ranges for the arrow and bow figures typed into the Arrow chooser and the Calculators.
   A figure outside its range (or not a number) is flagged on its own box in plain English and left out of the sums until it is fixed,
   so a slip like 12365 gr can never give a negative speed. The typed text is kept as typed; nothing saved is changed or rewritten. */
const ARROW_LIM={dw:['Draw weight',5,90,'lb'],dl:['Draw length',14,34,'inches'],ibo:['Speed rating',200,400,'fps'],tw:['Arrow weight',100,1000,'gr'],
 len:['Arrow length',14,36,'inches'],pt:['Point weight',10,400,'gr'],gpi:['Shaft weight',2,30,'grains per inch'],ins:['Insert, pin or collar',0,150,'gr'],
 nock:['Nock',0,40,'gr'],vanes:['Vanes',0,100,'gr'],fps:['Arrow speed',100,450,'fps'],sg:['Extra weight on the string',0,100,'gr'],foc:['FOC',0,40,'%'],bp:['Balance point',1,36,'inches']};
/* null if blank or fine; otherwise the message for that box */
window.arrowLim=function(k,v){const L=ARROW_LIM[k];if(!L)return null;const t=String(v??'').trim();if(t==='')return null;const x=parseFloat(t.replace(',','.'));
 const nice=n=>String(n);if(!isFinite(x)||!/^-?\d*[.,]?\d+$/.test(t))return`${L[0]}: "${t}" is not a number. Type the number only, in ${L[3]}. It is left out until it is fixed.`;
 if(x<L[1]||x>L[2])return`${L[0]}: ${nice(x)} ${L[3]} is outside the usual range of ${L[1]} to ${L[2]} ${L[3]}. Check the number. It is left out until it is fixed.`;return null};
window.ARROW_LIM=ARROW_LIM;
/* the speed rule of thumb only where it makes sense: every input in range and a result of at least 100 fps; otherwise NaN, never a negative speed */
window.arrowSpeedEst=function(ibo,dl,dw,tw,sg){const L=window.arrowLim;if([['ibo',ibo],['dl',dl],['dw',dw],['tw',tw]].some(([k,v])=>!isFinite(v)||L(k,v))||(isFinite(sg)&&L('sg',sg)))return NaN;
 const e=ibo-10*(30-dl)-Math.max(0,tw-5*dw)/3-(isFinite(sg)?sg:0)/3;return e>=100?Math.round(e):NaN};
const SECTION={home:'home',score:'score',scorecards:'home',stats:'myarch',analytics:'myarch',diary:'myarch',badges:'myarch',recap:'myarch',rewards:'myarch',squad:'clubs',follow:'clubs',profile:'me',help:'me',suggest:'me',whatsnew:'me',me:'me'};
const secOf=v=>v.startsWith('lab_')?(LABSEC[v]||'home'):(SECTION[v]||v);
const LABSEC={};
const label=e=>((e.querySelector('.kicker,h2,h3,summary')||e).innerText||'').trim().toUpperCase();
function keep(test){[...app.children].forEach((e,i)=>{if(!test(e,label(e),i))e.remove()})}
function bindGo(){app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>nav(b.dataset.go))}
function bar(title,back,backLbl){app.insertAdjacentHTML('afterbegin',`<div class="labbar">${back?`<button class="btn ghost labback" data-go="${back}">‹ ${h(backLbl)}</button>`:''}<h1>${h(title)}</h1></div>`);bindGo();
 /* no doubled headings: a card kicker that just repeats the screen title is hidden */const T=String(title).trim().toLowerCase();[...app.querySelectorAll('.kicker')].slice(0,3).forEach(k=>{if((k.textContent||'').trim().toLowerCase()==T)k.style.display='none'})}
const row=(go,i,t,d,soon)=>`<button class="labrow${soon?' soon':''}" data-go="${go}"><span class="i" aria-hidden="true">${i}</span><span><b>${h(t)}</b><small>${h(d)}</small></span><span class="go" aria-hidden="true">›</span></button>`;
function menu(title,rows){app.innerHTML=`<div class="labmenu">${rows.join('')}</div>`;bar(title)}
/* a sub-screen built from an existing view: run it, keep some cards, add a back bar */
function sub(id,sec,title,back,backLbl,base,test,after){LABSEC[id]=sec;E[id]=function(){base();if(test&&!(base.sc&&typeof cur!=='undefined'&&cur))keep(test);if(after)after();bar(title,back,backLbl)}}

/* nav: highlight the section, not the sub-screen */
const _nav=nav;nav=function(v){_nav(v);const s=secOf(view);document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.v==s))};

/* top bar: Me button */
function addMe(){const t=document.querySelector('.top');if(!t||t.querySelector('.labme'))return;const b=document.createElement('button');b.className='labme';const who=(typeof TESTER!='undefined'&&TESTER)?(typeof testerName=='function'?testerName(TESTER.id):TESTER.short):'';b.textContent=who||'Me';b.title=who?(isAdmin()||window.ADMIN_VIEW?`${who}'s app: Me, settings and switch archer`:`${who}'s app: Me and settings`):'Me and settings';b.setAttribute('aria-label',b.title);b.onclick=()=>nav('lab_me');const hb=t.querySelector('.help-btn');hb?t.insertBefore(b,hb):t.appendChild(b);const tb=document.createElement('button');tb.className='labtheme';tb.onclick=()=>setTheme(curTheme()=='dark'?'light':'dark');t.insertBefore(tb,b);paintTheme(curTheme())}
/* theme button (22 Oct 2026, Nathe): light mode shows a light WA target face, dark mode a dark field face (gold and black only) */
function themeIcon(t){const r=(R,f,st)=>`<circle cx="12" cy="12" r="${R}" fill="${f}" stroke="${st}" stroke-width="0.6"/>`;
 return`<svg class="ic thface" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">${t=='dark'
  ?r(11.2,'#111111','#c9a227')+r(8.4,'#111111','#c9a227')+r(5.6,'#111111','#c9a227')+r(3.3,'#f2c230','#111111')+r(1.4,'#f2c230','#111111')
  :r(11.2,'#ffffff','#333333')+r(9,'#111111','#ffffff')+r(6.8,'#1f6fd1','#ffffff')+r(4.6,'#e2231a','#333333')+r(2.4,'#ffd400','#333333')}</svg>`}
function curTheme(){return document.documentElement.getAttribute('data-theme')=='dark'?'dark':'light'}
function setTheme(t){localStorage.setItem('scoretool.theme',t);paintTheme(t)}
function paintTheme(t){document.documentElement.setAttribute('data-theme',t);const m=document.querySelector('meta[name=theme-color]');if(m)m.content=t=='dark'?'#0b0f17':'#ffffff';document.querySelectorAll('.labtheme').forEach(b=>{b.innerHTML=themeIcon(t);b.title=t=='dark'?'Switch to light mode':'Switch to dark mode';b.setAttribute('aria-label',b.title)})}
setTimeout(addMe,0);setTimeout(addMe,800);
/* Viewing-as bar (26 Oct 2026): while Nathe looks at another tester's profile, a navy and gold bar sits under the top bar on every screen with one tap back to his own profile. */
function adminBar(){if(!window.ADMIN_VIEW||typeof TESTER=='undefined'||!TESTER||document.getElementById('adminbar'))return;const sh=document.getElementById('shell'),sc=document.getElementById('scroller');if(!sh||!sc)return;
 const d=document.createElement('div');d.id='adminbar';d.setAttribute('role','region');d.setAttribute('aria-label','Viewing another profile');
 d.innerHTML=`<span class="avtx"><b>Viewing as ${h(TESTER.short)}</b><small>Read only: nothing here is saved</small></span><button type="button" id="avback">Back to my profile</button>`;
 sh.insertBefore(d,sc);d.querySelector('#avback').onclick=()=>setTester('nathe')}
adminBar();


/* ---------- Home: a few big buttons ---------- */
const _home=home;
home=function(){addMe();let last='';try{const L=latestShoot();if(L)last=`Last shoot: ${L.score} on ${h(L.round)}, ${new Date(L.date).toLocaleDateString('en-AU',{day:'numeric',month:'short'})}`}catch(e){}
 const nm=(typeof TESTER!=='undefined'&&TESTER&&TESTER.name)||'';
 app.innerHTML=`<p class="muted" style="margin:0 0 10px">G'day${nm?' '+h(String(nm).split(' ')[0]):''}${last?' · '+last:''}</p>
 <button class="hub-score" data-go="score"><span aria-hidden="true">🎯</span><span>Score<small>Start or carry on a shoot</small></span></button>
 <button class="hub-score hub-past" id="gocards" data-go="scorecards"><span aria-hidden="true">📋</span><span>Scorecards<small>Practice scores and official personal bests</small></span></button>
 <div class="hub-grid">
  <button class="hub-tile" data-go="myarch"><span class="i" aria-hidden="true">📓</span><b>My archery</b><small>Stats, PBs, diary, setups, sight marks</small></button>
  <button class="hub-tile" data-go="clubs"><span class="i" aria-hidden="true">👥</span><b>Clubs &amp; leagues</b><small>Squads, leagues, match play, following</small></button>
  <button class="hub-tile" data-go="tools"><span class="i" aria-hidden="true">🔧</span><b>Tools</b><small>Arrow optimizer, calculators, 3D rules</small></button>
  <a class="hub-tile" href="https://archerycalendars.com/#/calendar" target="_blank" rel="noopener"><span class="i" aria-hidden="true">📅</span><b>Calendar</b><small>My events on archerycalendars.com ↗</small></a>
 </div>${(typeof stNeedsScoreLoad==='function'&&stNeedsScoreLoad()&&typeof stLoadScoresCard==='function')?stLoadScoresCard():''}`;bindGo();if(typeof stNeedsScoreLoad==='function'&&stNeedsScoreLoad()&&typeof stBindLoadScores==='function')stBindLoadScores()};

/* ---------- Score: just the scoring ---------- */
const _score=score;
score=function(){_score();if((typeof cur!=='undefined'&&cur)||view!='score')return;
 ['#h2hcard','#lgcard','#pgcard','#ifaacard','#ifaagencard'].forEach(s=>{const e=app.querySelector(s);if(e)e.remove()});
 const b=typeof curBow=='function'&&curBow();const first=app.firstElementChild;
 const note=`<p class="small muted" style="margin:6px 0 0">Setup: <b>${b?h(b.name):'none yet'}</b> · <a href="#" data-go="lab_gear">change</a> &nbsp;·&nbsp; Leagues, match play and group cards are in <a href="#" data-go="clubs">Clubs</a></p>`;
 if(first)first.insertAdjacentHTML('beforeend',note);app.querySelectorAll('a[data-go]').forEach(a=>a.onclick=e=>{e.preventDefault();nav(a.dataset.go)})};
/* rounds scored with a setup selected remember it, so setups can be compared */
const PAGE_T=Date.now(),isNew=x=>x&&+String(x.id||'').slice(1)>=PAGE_T;/* only rounds started after this page opened: old records are never touched */
setInterval(()=>{try{if(typeof cur!=='undefined'&&cur&&isNew(cur)&&!cur.bow&&typeof curBow=='function'){const b=curBow();if(b)cur.bow=b.id}}catch(e){}},1000);

/* ---------- My archery ---------- */
LABSEC.myarch='myarch';
E.myarch=()=>menu('My archery',[
 row('lab_analysis','🔬','Analysis','Stats, personal bests, trends and the full read, in one place'),
 row('lab_latest','⭐','Latest shoot','How your last shoot went, wins of the day, notes'),
 row('lab_arrows','➕','Practice arrows','Today\'s arrow count and weekly progress'),
 row('lab_diary','📝','Diary','Shooting diary in your own words'),
 row('lab_gear','🎯','Sight marks','Sight marks by distance, scores per setup'),
 row('lab_ranks','🏅','Rankings & classification','Real AA rankings and classification progress')]);
sub('lab_latest','myarch','Latest shoot','myarch','My archery',()=>_home(),(e,t,i)=>i<3||/FROM YOUR NOTES/.test(t));
sub('lab_arrows','myarch','Practice arrows','myarch','My archery',()=>_home(),(e,t,i)=>i==0||/TODAY'S ARROWS/.test(t));
sub('lab_diary','myarch','Diary','myarch','My archery',()=>diary(),(e,t)=>/SHOOTING DIARY|TIMELINE/.test(t));
sub('lab_ranks','myarch','Rankings & classification','myarch','My archery',()=>E.rewards(),e=>e.id=='realrank'||e.id=='c-class'||e.id=='rankcard'||e.id=='rank-slot',()=>{
 if(typeof aaRankCard!='function'||document.getElementById('rank-slot'))return;
 const html=aaRankCard((typeof S!='undefined'&&S&&S.profile)||'');
 const anchor=document.getElementById('realrank')||document.getElementById('c-class')||document.getElementById('rankcard');
 if(anchor)anchor.insertAdjacentHTML('afterend',html);else app.insertAdjacentHTML('afterbegin',html)});
sub('lab_gear','myarch','Sight marks','myarch','My archery',()=>diary(),(e,t)=>e.id=='gearcard'||/BOW & SETUP DIARY|CURRENT SETUP/.test(t),()=>{app.insertAdjacentHTML('beforeend',setupScores())});
function setupScores(){const L=(typeof myBows=='function'?myBows():[]);if(!L.length)return'';
 const ss=(S.sessions||[]).filter(s=>s.bow&&!s.sample&&typeof isDone=='function'&&isDone(s));
 const rows=L.map(b=>{const m=ss.filter(s=>s.bow==b.id);if(!m.length)return`<tr><th>${h(b.name)}</th><td colspan="3" class="muted">No rounds scored with this setup yet</td></tr>`;
  const by={};m.forEach(s=>{(by[s.round]=by[s.round]||[]).push(total(s))});
  return Object.entries(by).map(([r,v],k)=>`<tr><th>${k?'':h(b.name)}</th><td>${h(r)}</td><td>${v.length}</td><td>${Math.max(...v)} best · ${Math.round(v.reduce((a,x)=>a+x,0)/v.length)} avg</td></tr>`).join('')}).join('');
 return`<div class="card"><span class="kicker">Scores per setup</span><h2>Which setup scores best</h2><table class="labtbl"><thead><tr><th>Setup</th><th>Round</th><th>Rounds</th><th>Scores</th></tr></thead><tbody>${rows}</tbody></table><p class="small muted">Rounds you score in ScoreTool remember the setup picked here. Official competition results don't record a setup, so they aren't in this table.</p></div>`}

/* ---------- Clubs & leagues ---------- */
const SC=()=>_score();SC.sc=1;
LABSEC.clubs='clubs';
E.clubs=()=>menu('Clubs & leagues',[
 row('lab_leagues','🏁','Leagues','Leagues you belong to. Join with a code or start one'),
 row('lab_group','📋','Event scoring','Score your whole group on one phone: ABA 3D or IFAA Field/Hunter')]);
sub('lab_leagues','clubs','Leagues','clubs','Clubs',SC,e=>e.id=='lgcard');
sub('lab_match','clubs','Match play','clubs','Clubs',SC,e=>e.id=='h2hcard');
sub('lab_group','clubs','Event scoring','clubs','Clubs',SC,e=>e.id=='pgcard'||e.id=='ifaacard'||e.id=='ifaagencard');
LABSEC.lab_squad='clubs';
const SQT=[['board','Board',t=>/WEEKLY LEAGUE|MORE BOARDS/.test(t)],['activity','Activity',t=>/ACTIVITY/.test(t)],['people','People',t=>/COACHES & PARENTS|ME IN THIS SQUAD|ADMIN ONLY/.test(t)],['manage','Create / join',t=>/CREATE ANOTHER SQUAD|SAFE SQUADS/.test(t)]];
E.lab_squad=function(){squad();const n=app.children.length,tab=S._labsq||'board',T=SQT.find(x=>x[0]==tab)||SQT[0];
 if(n>3)keep((e,t,i)=>i==0||T[2](t));
 app.firstElementChild&&app.firstElementChild.insertAdjacentHTML('afterend',`<div class="labseg" role="group" aria-label="Squad sections">${SQT.map(x=>`<button aria-pressed="${x[0]==tab}" data-sq="${x[0]}">${x[1]}</button>`).join('')}</div>`);
 app.querySelectorAll('[data-sq]').forEach(b=>b.onclick=()=>{S._labsq=b.dataset.sq;render()});bar('Squads','clubs','Clubs')};

/* ---------- Me (top bar) ---------- */
LABSEC.lab_me='me';
/* 22 Oct 2026 (Nathe): the switch-archer card is for the admin (Nathe, tester id 'nathe') only. Other archers never see it or any switch. */
const isAdmin=()=>typeof TESTER!='undefined'&&!!TESTER&&TESTER.id=='nathe';
const whoCard=()=>{if(typeof TESTER=='undefined'||!TESTER||typeof TESTERS=='undefined'||TESTERS.length<2)return'';const nm=t=>typeof testerName=='function'?testerName(t.id):t.short;
 return`<div class="card" id="whocard"><span class="kicker">Whose app</span><h2 style="margin:2px 0 6px">This is ${h(nm(TESTER))}'s app</h2><p class="small muted" style="margin:0 0 8px">On a shared phone, switch to your own name. Each archer's scores stay separate.</p>${window.ADMIN_VIEW?`<button class="btn full" id="whoback" data-tester="nathe" style="margin:0 0 8px">Back to my profile</button>`:''}<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start">${TESTERS.filter(t=>t.id!=TESTER.id&&!(window.ADMIN_VIEW&&t.id=='nathe')).map(t=>`<button class="btn ghost" data-tester="${t.id}">${h(nm(t))}</button>`).join('')}</div></div>`};
E.lab_me=()=>{menuMe();const w=whoCard();if(w){app.querySelector('.labbar').insertAdjacentHTML('afterend',w);if(typeof bindTesterPicker=='function')bindTesterPicker(app)}};
const menuMe=()=>menu('Me',[
 row('lab_profile','🪪','Profile','Display name and best moments'),
 row('lab_people','🧑‍🏫',(typeof COACH_ON!='undefined'&&COACH_ON?'Coaches & parents':'Parents'),(typeof COACH_ON!='undefined'&&COACH_ON?'Your details, coach access, parent link':'Your details, parent link')),
 row('lab_settings','⚙️','Settings & help','Settings, linked apps, help guides')]);
sub('lab_profile','me','Profile & card','lab_me','Me',()=>me(),(e,t)=>['nmcard'].includes(e.id)||e.classList.contains('pcard')||/^BADGES|MY BEST MOMENTS/.test(t));
sub('lab_people','me',(typeof COACH_ON!='undefined'&&COACH_ON?'Coaches & parents':'Parents'),'lab_me','Me',()=>me(),e=>['pxcard','coachcard','parentcard'].includes(e.id));
sub('lab_settings','me','Settings & help','lab_me','Me',()=>me(),(e,t)=>['settingscard','oapps'].includes(e.id)||/^HELP|^TESTER|RESET MY TEST DATA/.test(t),()=>{const t=curTheme();app.insertAdjacentHTML('afterbegin',`<div class="card" id="themecard"><span class="kicker">Appearance</span><h2>Light or dark</h2><div class="labseg" role="group" aria-label="Theme"><button data-th="light" aria-pressed="${t=='light'}">${themeIcon('light')} Light</button><button data-th="dark" aria-pressed="${t=='dark'}">${themeIcon('dark')} Dark</button></div><p class="small muted" style="margin:0">Also on the target-face button at the top. Target faces keep their real colours in both.</p></div>`);app.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{setTheme(b.dataset.th);render()});if(window.calCard){$('#themecard').insertAdjacentHTML('afterend',calCard());calBind()}});

/* ---------- Tools ---------- */
LABSEC.tools='tools';
E.tools=()=>menu('Tools',[
 row('lab_mybows','🏹','Add bow','Save a bow and its specs, then pick it when you tune'),
 row('lab_myarrows','➡️','Add arrows','Save each arrow set once: shaft, spine, length, weights, fletching and FOC'),
 row('lab_tune','🎯','Tune helper','Setup first, then the tuning steps in order (compound or recurve)'),
 row('lab_chooser','🏹','Arrow chooser','Starting spine and cut length from the makers\' charts, FOC and point weight'),
 row('lab_rounds','◎','Rounds','Distances and faces when a club names the round'),
 row('lab_rules','📓','Rules','World Archery, Archery Australia, ABA, IBO, ASA and IFAA, with sources'),
 row('lab_mydata','📥','Import my data','Your own scoresheets, results and sight marks, from the file you were sent')]);
LABSEC.lab_mydata='tools';if(window.MYDATA_VIEW)E.lab_mydata=window.MYDATA_VIEW;

/* Arrow optimizer: groups on a plain tuning face. Before = blue circles, After = black squares (shape and colour both differ). */
LABSEC.lab_opt='tools';LABSEC.lab_chooser='tools';LABSEC.lab_tune='tools';LABSEC.lab_rounds='tools';
LABSEC.lab_mybows='tools';LABSEC.lab_myarrows='tools';
/* Schedule 9A reference: searchable list, tap a name for the distances and faces. Nothing here is saved. */
E.lab_rounds=function(){const esc=h;app.innerHTML=`<p class="small" id="aaintro">Clubs often name the round and leave out the distances and the face. Tap a name to see them.</p><label class="small" for="aaq">Find a round</label><input id="aaq" type="search" enterkeyhint="search" autocomplete="off" placeholder="Name, distance or face" value="${esc(window._aaQ||'')}"><div id="aalist"></div><p class="small muted" id="aacite">${esc(window.AA_CITE||'')}. In that table, + is the 122 cm face and * is the 80 cm face.</p><p class="small muted">${esc(window.AA_NOTE||'')} Those are not listed here until a club names them.</p>`;
 bar('Rounds','tools','Tools');
 const paint=()=>{const box=$('#aalist');if(box&&window.aaRoundsList)box.innerHTML=aaRoundsList();app.querySelectorAll('[data-aa]').forEach(b=>b.onclick=()=>{window._aaOpen=window._aaOpen===b.dataset.aa?'':b.dataset.aa;paint()})};
 const q=$('#aaq');if(q)q.oninput=()=>{window._aaQ=q.value;paint()};paint()};
/* Tuning sessions (26 Nov 2026, Nathe via Grok Bot, "Yes, build the tuning preview"):
   - one bow picker and one arrow picker on a new session (the 'Use my arrow setup' tick box and the Face choice are gone);
   - Paper tune is a keypad of tear shapes laid out like the scoring pad, one tap per arrow, any number of arrows;
   - every other tune plots on a crosshair: Torque = vertical line only, compound Walk back tune (close/far) = horizontal line only, the rest both lines;
   - 'What I changed' per tune: item + direction + amount + note, filtered by a Compound / Recurve switch (lists from Archery Coach,
     26 Nov ~6:13am Perth), with tear-to-fix hints on Paper tune;
   - the Arrow setup table is an optional, closed section; past sessions can be deleted (with a confirm).
   Stored data: new sessions add their own fields (bt, span, paper, changes, bowSpec, arrow). Old sessions keep their face and plots
   and are shown on the crosshair at their old face's scale; nothing old is rewritten. Lingkana data is never read or written here. */
const TUNES=['Paper tune','Bare shaft vs fletched','Torque tune','Walk back tune','Group tune','Just a group','Other'];
const FACES={'40cm':20,'60cm':30,'80cm':40,'122cm':61};/* old sessions only: the face they were plotted on */
const SPAN=20;/* new crosshair: centre to edge = 20 cm, grid every 5 cm */
function gstats(P,rcm){if(!P.length)return null;const cx=P.reduce((a,p)=>a+p[0],0)/P.length,cy=P.reduce((a,p)=>a+p[1],0)/P.length;
 const mr=P.reduce((a,p)=>a+Math.hypot(p[0]-cx,p[1]-cy),0)/P.length;let es=0;P.forEach(a=>P.forEach(b=>{es=Math.max(es,Math.hypot(a[0]-b[0],a[1]-b[1]))}));
 return{n:P.length,cx:cx*rcm,cy:cy*rcm,mr:mr*rcm,es:es*rcm}}
const cm=v=>(Math.round(v*10)/10).toFixed(1);
const dir=(x,y)=>`${cm(Math.abs(x))} cm ${x>=0?'right':'left'}, ${cm(Math.abs(y))} cm ${y>=0?'low':'high'}`;
function tKind(T){if(T.face)return'legacy';const c=T.change;if(c=='Walk back tune')return(T.bt&&T.bt!='c')?'walk':'dudley';return({'Paper tune':'paper','Bare shaft vs fletched':'bare','Torque tune':'torque','Dudley / yoke tune':'dudley','Group tune':'group','Group test':'group','Walk-back':'walk'})[c]||'group'}
function tName(T){const c=typeof T=='string'?T:(T&&T.change)||'';return(c=='Dudley / yoke tune'||c=='Walk-back'||c=='Walk back tune')?'Walk back tune':c}
const tScale=T=>T.face?(FACES[T.face]||20):(T.span||SPAN);
function torqueInit(){return{before:{L:[],R:[]},after:{L:[],R:[]}}}
function torqueEnsure(T){if(tKind(T)!='torque')return false;if(T.torque)return false;T.torque=torqueInit();if((T.before||[]).length)T.torque.before.L=T.before.slice();if((T.after||[]).length)T.torque.after.L=T.after.slice();if(!T.side)T.side='L';return true}
function torqueOn(T){return tKind(T)=='torque'}
function tuneEmpty(t){const pn=t.paper?(t.paper.before||[]).length+(t.paper.after||[]).length:0;const tn=t.torque?['before','after'].flatMap(g=>['L','R'].map(s=>((t.torque[g]||{})[s]||[]).length)).reduce((a,b)=>a+b,0):0;return!(t.before||[]).length&&!(t.after||[]).length&&!pn&&!tn&&!(t.changes||[]).length&&!t.note&&!((t.name||'').trim())}
function tuneStart(change,opt){opt=opt||{};if(typeof seedBows=='function')seedBows();const bows=typeof myBows=='function'?myBows():[],cb=typeof curBow=='function'&&curBow();const sets=window.myArrows?myArrows():[],acs=window.arrowSetup&&arrowSetup();const bid=opt.bow!=null?opt.bow:(cb&&cb.id)||'';const b=bows.find(x=>x.id==bid);const snap0=(b||cb)&&window.bowSnap&&bowSnap((b||cb).id);const nbt=opt.bt||(snap0&&snap0.type!='compound'?'r':'c');
 const t={id:'t'+Date.now(),archer:S.profile,date:new Date().toLocaleDateString('en-CA'),name:opt.name||'',change,dist:opt.dist||'',span:SPAN,bt:nbt,bow:b?b.id:null,bowName:b?b.name:'',before:[],after:[],grp:'before',changes:[]};
 if(change=='Paper tune')t.paper={before:[],after:[]};
 if(change=='Torque tune'){t.torque=torqueInit();t.side='L'}
 if(snap0)t.bowSpec=snap0;
 const asel=(S.arrowSel||{})[S.profile];
 const sdef=acs?'ac':(sets.find(a=>a.id==asel&&(a.shaft||a.spine||a.len))||sets.find(a=>a.shaft||a.spine||a.len)||{}).id||'';
 const av=opt.arrow!=null?opt.arrow:sdef;
 if(av=='ac'&&acs)t.arrow=acs;else if(av&&window.arrowSnapOf&&window.myArrow){const o=myArrow(av);if(o)t.arrow=arrowSnapOf(o)}
 if(['Bare shaft vs fletched','Paper tune'].includes(change))t.hand=opt.hand||'R';
 S.tune=S.tune||[];S.tune.push(t);S._tuneId=t.id;save();return t}
function torquePts(T,g,side){return(((T.torque||{})[g]||{})[side])||[]}
function torqueGap(T,g,rcm){const L=gstats(torquePts(T,g,'L'),rcm),R=gstats(torquePts(T,g,'R'),rcm);if(!L||!R)return null;return{L,R,gap:Math.abs(L.cx-R.cx),on:Math.abs(L.cx)<2&&Math.abs(R.cx)<2}}
function torqueMark(kind,x,y,fill){const sw='0.01';
 if(kind=='circ')return`<circle cx="${x}" cy="${y}" r="0.035" fill="${fill}" stroke="#fff" stroke-width="${sw}"/>`;
 if(kind=='sq')return`<rect x="${x-.032}" y="${y-.032}" width="0.064" height="0.064" fill="${fill}" stroke="#0b1f4d" stroke-width="${sw}"/>`;
 if(kind=='tri')return`<polygon points="${x},${y-0.042} ${x+0.038},${y+0.032} ${x-0.038},${y+0.032}" fill="${fill}" stroke="#fff" stroke-width="${sw}"/>`;
 return`<polygon points="${x},${y-0.04} ${x+0.04},${y} ${x},${y+0.04} ${x-0.04},${y}" fill="${fill}" stroke="#0b1f4d" stroke-width="${sw}"/>`}
function torqueVerdict(T,rcm){const B=torqueGap(T,'before',rcm),A=torqueGap(T,'after',rcm);
 if(!B)return`<p class="lab-note" id="torqueverdict">Shoot one end torqued left and one end torqued right, then log what you changed, then shoot the same two ends again.</p>`;
 if(!A)return`<p class="lab-note" id="torqueverdict">Before the change the two groups are <b>${cm(B.gap)} cm</b> apart${B.on?', and both sit on the line':''}. Log what you changed, then tap After and shoot a torqued-left end and a torqued-right end again.</p>`;
 if(A.on)return`<p class="lab-note" id="torqueverdict">After the change, both groups sit on the line (${cm(B.gap)} cm apart → ${cm(A.gap)} cm). The setup is forgiving of torque.</p>`;
 const d=A.gap-B.gap,closer=d<=-0.15,wider=d>=0.15;
 if(closer)return`<p class="lab-note" id="torqueverdict">After the change the torqued-left and torqued-right groups are <b>closer together</b> (${cm(B.gap)} cm → ${cm(A.gap)} cm). Closer together, or both on the line, means the setup is more forgiving.</p>`;
 if(wider)return`<p class="lab-note" id="torqueverdict">After the change the groups are <b>farther apart</b> (${cm(B.gap)} cm → ${cm(A.gap)} cm). Confusing results usually mean you torqued too hard.</p>`;
 return`<p class="lab-note" id="torqueverdict">The gap between the two groups is about the same (${cm(B.gap)} cm → ${cm(A.gap)} cm).</p>`}
/* 'What I changed' lists: Archery Coach, 26 Nov 2026 ~6:13am Perth. [label, directions, bow c/r/b] */
const DIRS={ud:['Up','Down'],lr:['Left','Right'],io:['In (toward the bow)','Out (away from the bow)'],sp:['More tension','Less tension'],tw:['Add twists','Take out twists'],hl:['Higher','Lower'],id:['Increase','Decrease'],ar:['Heavier point','Lighter point','Stiffer spine','Weaker spine','Cut shorter'],pt:['Heavier','Lighter'],len:['Shorter','Longer'],et:['Earlier','Later'],any:['Changed']};
const WHAT={
 paper:[['Rest up/down','ud','c'],['Rest left/right (centre shot)','lr','c'],['Nocking point / D-loop up/down','ud','c'],['Yoke twists (cam lean)','lr','c'],['Cam timing (cable/string twists)','tw','c'],['Drop-away timing','et','c'],['Spine / point weight / cut length','ar','c'],['Grip / hand pressure (torque)','any','c'],
  ['Nocking point up/down','ud','r'],['Plunger in/out (centre shot)','io','r'],['Plunger spring tension','sp','r'],['Brace height','hl','r'],['Tiller','id','r'],['Point weight / spine / length','ar','r'],['Draw weight (limb bolts)','ud','r']],
 bare:[['Nocking point up/down','ud','b'],['Rest height','ud','c'],['Rest left/right','lr','c'],['Yoke twists (no rest move)','lr','c'],['Plunger in/out','io','r'],['Plunger spring tension','sp','r'],['Point weight','pt','b'],['Cut length','len','b'],['Draw weight','ud','b']],
 torque:[['Sight one click left/right','lr','b'],['Yoke / cam lean','lr','c'],['Grip','any','b']],
 dudley:[['Sight left/right (close, about 2.5 yd, 60 yd pin)','lr','c'],['Arrow rest left/right (far, 60 yd)','lr','c'],['Yoke twists (no rest move)','lr','c']],
 group:[['Nocking point (small steps)','ud','b'],['Rest height','ud','b'],['Point weight','pt','b'],['Draw weight','ud','b'],['Brace height','hl','b'],['Tiller','id','r'],['Plunger spring','sp','r'],['Yoke twists','lr','c'],['Cam timing','tw','c']],
 walk:[['Plunger in/out (centre shot)','io','r'],['Plunger spring tension','sp','r'],['Nocking point (only if the vertical spread is bad)','ud','r']]};
const tWhat=k=>(WHAT[k]||WHAT.group).concat([['Other','any','b']]);
function eastonLink(p){const S2=window.ARROW_SRC||{},t=S2.eastonTM;return t?`<a href="${t[1]}" target="_blank" rel="noopener">Easton Arrow Tuning and Maintenance Guide</a>${p?', '+p:''}`:`Easton Arrow Tuning and Maintenance Guide${p?', '+p:''}`}
/* How to read each tune: Coach's lines; Easton cited where it is Easton */
function readNote(k){const W={
 paper:`Stand about 5 ft from the paper. Errors show from 0 to 12 ft before the vanes correct them, and a bullet hole means straight flight, not accuracy.`,
 torque:`Shoot one end torqued left and one end torqued right, against the vertical line. Log what you changed, then shoot the same two ends again. If both groups sit on the line, the setup is forgiving. Confusing results usually mean you torqued too hard.`,
 dudley:`Close miss = move the sight. Far miss = move the rest and leave the sight alone. Near and far both on the line = done. If the rest would end up well off centre, use yoke twists instead.`,
 group:`Keep whichever change gives the tightest group. Works best if you can group at about 60 m, and you can bias it slightly so the setup forgives some human variation.`,
 walk:`Arrows at every distance on one vertical line = done. Arrows spread left and right at the same distance = spring tension. Use plunger in/out and spring to get all distances on a vertical line.</p><p class="small" id="walkeaston" style="margin:6px 0 0"><b>Which way to move the plunger:</b> Easton's guide has no walk-back test, so ScoreTool does not say which way to move the plunger from a walk-back line. Easton's only in/out rule is for broadheads (right-handed archer): a group to the left acts stiff, move the rest or plunger <b>in toward the bow</b>; to the right acts weak, move it <b>out away from the bow</b>, 1/32" at a time (p. 12). For recurve tuning past the setup stage Easton says to change plunger spring tension only, not the in/out position (pp. 8 and 14).<span class="labsrc" style="display:block">${eastonLink('pp. 8, 12, 14')}</span>`};return W[k]?`<p class="small tread" style="margin:6px 0 0">${W[k]}</p>`:''}
/* Paper tune keypad: laid out like the scoring pad, 3 x 3. Tear = where the nock end tore, from the point hole. */
const TEAR=[['ul','Nock high-left'],['u','Nock high'],['ur','Nock high-right'],['l','Nock left'],['b','Bullet hole'],['r','Nock right'],['dl','Nock low-left'],['d','Nock low'],['dr','Nock low-right']];
const tearName=c=>(TEAR.find(x=>x[0]==c)||[0,c])[1];
function tearSvg(c){const v={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0],ul:[-.7,-.7],ur:[.7,-.7],dl:[-.7,.7],dr:[.7,.7]}[c];
 if(!v)return`<svg viewBox="-20 -20 40 40" aria-hidden="true"><circle r="6" fill="currentColor"/><path d="M0 -11v-5M9.5 5.5l4.3 2.5M-9.5 5.5l-4.3 2.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`;
 const[x,y]=v,ex=x*13,ey=y*13,px=-y,py=x;
 return`<svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="M0 0L${ex} ${ey}" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M${ex} ${ey}l${(x*4+px*5).toFixed(1)} ${(y*4+py*5).toFixed(1)}M${ex} ${ey}l${(x*4-px*5).toFixed(1)} ${(y*4-py*5).toFixed(1)}M${ex} ${ey}l${(x*6).toFixed(1)} ${(y*6).toFixed(1)}" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle r="5" fill="currentColor"/></svg>`}
/* tear -> fix hints: Archery Coach's list (right-handed); the rest direction for left/right tears is Easton's (pp. 7-8) */
function tearHint(c,bt,lh){if(c=='b')return`<li><b>Bullet hole:</b> no change. Log it as your baseline. Paper after setup so you know your normal tear.</li>`;
 const v=c[0]=='u'||c[0]=='d'?c[0]:'',hz=/[lr]$/.test(c)?c.slice(-1):'',comp=bt!='r',out=[];
 if(v&&hz)out.push(`<li>Two things at once: fix the up/down part first, then the left/right (Easton: correct the vertical pattern, the nocking point, first, then the horizontal).</li>`);
 if(v=='u')out.push(`<li><b>Nock high:</b> lower the nocking point or raise the rest.${comp?` Also check the drop-away isn't lifting late. A blade rest that's too stiff can tear high.`:''}</li>`);
 if(v=='d')out.push(`<li><b>Nock low:</b> raise the nocking point or lower the rest. Check vane clearance${comp?' and drop-away timing':''}.${comp?` A blade that's too weak can tear low or vary vertically.`:''}</li>`);
 if(hz){const L=hz=='l',rh=lh?!L:L;/* rh = reads as a right-handed nock-left tear */
  out.push(comp?`<li><b>Nock ${L?'left':'right'}:</b> move the rest to the <b>${(L?!lh:lh)?'right':'left'}</b> (Easton, release aid${lh?', mirrored for a left-handed archer':', right-handed'}), or use yoke twists instead (yoke alone is fine, the rest can stay at centre), then spine / point weight, then grip torque.</li>`
   :`<li><b>Nock ${L?'left':'right'}:</b> spine first: this reads <b>${rh?'stiff':'weak'}</b>${lh?' (left-handed, so mirrored)':''}. Then plunger spring or position, point weight, draw weight.</li>`)}
 return out.join('')}
function paperBlock(T,g){const P=T.paper=T.paper||{before:[],after:[]},L=P[g]||[],cnt={};L.forEach(c=>cnt[c]=(cnt[c]||0)+1);
 const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0],last=L[L.length-1];
 const pad=`<div class="tpad" id="tpad" role="group" aria-label="Tear shapes. Tap one per arrow.">${TEAR.map(([c,n])=>`<button type="button" data-tear="${c}" aria-label="${n}">${tearSvg(c)}<span>${n.replace('Nock ','')}${cnt[c]?` <b class="tpc">${cnt[c]}</b>`:''}</span></button>`).join('')}</div>`;
 const list=L.length?`<p class="small" id="tearlist" style="margin:8px 0 0">${L.length} arrow${L.length==1?'':'s'}: ${Object.entries(cnt).map(([c,n])=>`${h(tearName(c))} ×${n}`).join(', ')}</p>`:`<p class="small muted" id="tearlist" style="margin:8px 0 0">Tap the tear shape for each arrow.</p>`;
 return{pad,list,top:top?top[0]:null,last}}
function paperHints(T,code){if(!code)return'';return`<div class="lab-note" id="tearhint"><p style="margin:0"><b>Most common tear: ${h(tearName(code))}</b> <span class="small muted">(${T.bt=='r'?'recurve':'compound'}${T.hand=='L'?', left-handed':', right-handed'})</span></p><ul style="margin:6px 0 0;padding-left:18px">${tearHint(code,T.bt,T.hand=='L')}</ul><p class="small muted" style="margin:6px 0 0">Change one thing at a time, then shoot through the paper again. Easton: release aid archers sometimes need the opposite adjustment.</p><p class="labsrc">${eastonLink('pp. 7-8')}</p></div>`}
function crossSvg(T,rcm,k){const s=rcm/(T.face?rcm:SPAN),lines=k=='torque'?'v':k=='dudley'?'h':'vh',grid=[];
 const step=5/rcm;for(let i=step;i<1.05;i+=step){grid.push(`<path d="M${i} -1.05V1.05M${-i} -1.05V1.05M-1.05 ${i}H1.05M-1.05 ${-i}H1.05" stroke="var(--tgrid,#cbd5e1)" stroke-width="0.004"/>`)}
 const L=(lines.includes('v')?`<path d="M0 -1.05V1.05" stroke="#1d4ed8" stroke-width="0.016"/>`:'')+(lines.includes('h')?`<path d="M-1.05 0H1.05" stroke="#1d4ed8" stroke-width="0.016"/>`:'');
 let dots;
 if(torqueOn(T)){
  const mk=(g,side,kind,fill)=>torquePts(T,g,side).map(p=>torqueMark(kind,p[0],p[1],fill)).join('');
  dots=mk('before','L','circ','#1d4ed8')+mk('before','R','tri','#1d4ed8')+mk('after','L','sq','#00c8ff')+mk('after','R','dia','#00c8ff');
 }else{
  dots=(T.before||[]).map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="0.035" fill="#1d4ed8" stroke="#fff" stroke-width="0.01"/>`).join('')+(T.after||[]).map(p=>`<rect x="${p[0]-.032}" y="${p[1]-.032}" width="0.064" height="0.064" fill="#00c8ff" stroke="#0b1f4d" stroke-width="0.01"/>`).join('');
 }
 const lbl=lines=='v'?'a vertical line':lines=='h'?'a horizontal line':'a crosshair';
 return`<svg class="tface tcross" id="tface" data-lines="${lines}"${torqueOn(T)?' data-sides="1"':''} viewBox="-1.05 -1.05 2.1 2.1" role="img" aria-label="Tuning plot on ${lbl}, grid every 5 cm. Tap where each arrow landed."><rect x="-1.05" y="-1.05" width="2.1" height="2.1" fill="var(--tbg,#fff)"/>${grid.join('')}${L}${dots}</svg>`}
function whatCard(T,k){const bt=T.bt||'c',all=tWhat(k),L=all.filter(x=>x[2]=='b'||x[2]==bt),use=L.length>1?L:all,ch=T.changes||[];
 const other=bt=='c'?'recurve':'compound',none=L.length<=1?`<p class="small muted" style="margin:0 0 6px">Coach's list for this tune is for ${other} bows; showing it anyway.</p>`:'';
 const it=use[0];
 return`<div class="card" id="whatcard"><span class="kicker">What I changed</span>
 <div class="labseg" role="group" aria-label="Bow type" id="wbt"><button data-bt="c" aria-pressed="${bt=='c'}">Compound</button><button data-bt="r" aria-pressed="${bt=='r'}">Recurve</button></div>${none}
 ${ch.length?`<ul class="tchg" id="tchg">${ch.map((c,i)=>`<li><span><b>${h(c.item)}</b>${c.dir&&c.dir!='Changed'?' · '+h(c.dir):''}${c.amt?' · '+h(c.amt):''}${c.note?`<br><span class="small">${h(c.note)}</span>`:''}<br><span class="small muted">${h(c.date||'')}</span></span><button class="btn ghost" data-wdel="${i}" aria-label="Remove ${h(c.item)}">Remove</button></li>`).join('')}</ul>`:`<p class="small muted" style="margin:6px 0">Nothing logged yet.</p>`}
 <div class="labgrid2"><div><label for="wi">What</label><select id="wi">${use.map((x,i)=>`<option value="${i}">${h(x[0])}</option>`).join('')}</select></div>
 <div><label for="wd">Direction</label><select id="wd">${DIRS[it[1]].map(d=>`<option>${h(d)}</option>`).join('')}</select></div>
 <div><label for="wa">Amount</label><input id="wa" maxlength="30" placeholder="e.g. 1/16 in, 1 click, 1/8 turn"></div>
 <div><label for="wn">Note</label><input id="wn" maxlength="200" placeholder="optional"></div></div>
 <button class="btn alt" id="wadd" style="margin-top:8px">Add change</button>
 <p class="small muted" style="margin:6px 0 0">Tuning guidance from Archery Coach's list.</p></div>`}
function whatWire(T,k){const bt=T.bt||'c',all=tWhat(k),L=all.filter(x=>x[2]=='b'||x[2]==bt),use=L.length>1?L:all;
 app.querySelectorAll('[data-bt]').forEach(b=>b.onclick=()=>{T.bt=b.dataset.bt;save();render()});
 const wi=$('#wi');if(wi)wi.onchange=()=>{$('#wd').innerHTML=DIRS[use[+wi.value][1]].map(d=>`<option>${h(d)}</option>`).join('')};
 const wa=$('#wadd');if(wa)wa.onclick=()=>{const x=use[+$('#wi').value];T.changes=T.changes||[];T.changes.push({item:x[0],dir:$('#wd').value,amt:$('#wa').value.trim(),note:$('#wn').value.trim(),bt,date:new Date().toLocaleDateString('en-CA')});save();render()};
 app.querySelectorAll('[data-wdel]').forEach(b=>b.onclick=()=>{if(confirm('Remove this change?')){T.changes.splice(+b.dataset.wdel,1);save();render()}})}
function bowLine(id){const s=id&&window.bowSnap?bowSnap(id):null;if(!s)return'';return[s.name,s.type=='compound'&&s.speed?({ATA:'ATA','IBO/ATA':'IBO/ATA',actual:'Measured','':'Speed'}[s.kind]??'IBO')+' '+s.speed+' fps':'',s.ata?s.ata+'" axle to axle':'',s.bh?s.bh+'" brace':''].filter(Boolean).join(' · ')}
E.lab_opt=function(){S.tune=S.tune||[];
 const pref=window._tunePref;window._tunePref=null;const pbt=window._tuneBt;window._tuneBt=null;
 if(pref){const mine0=S.tune.filter(t=>t.archer==S.profile),cur=mine0.find(t=>t.id==S._tuneId);window._tuneOffer=(cur&&tKind(cur)==tKind({change:pref,bt:pbt||cur.bt||'c'}))?cur.id:null;S._tuneId=null;tuneStart(pref,{bt:pbt})}
 const mine=S.tune.filter(t=>t.archer==S.profile),T=mine.find(t=>t.id==S._tuneId);
 if(!T){window._tuneOffer=null;window._tarwOpen=false;if(typeof seedBows=='function')seedBows();const bows=typeof myBows=='function'?myBows():[],cb=typeof curBow=='function'&&curBow();
  const sets=window.myArrows?myArrows():[],acs=window.arrowSetup&&arrowSetup(),asel=(S.arrowSel||{})[S.profile];
  const bopt=b=>{const s=window.bowSnap&&bowSnap(b.id),nm=String(b.name||'Bow').trim(),low=nm.toLowerCase();return`<option value="${b.id}"${cb&&b.id==cb.id?' selected':''}>${h(nm)}${s&&s.model&&!low.includes(String(s.model).toLowerCase())?' ('+h(s.name)+')':''}</option>`};
  const sdef=acs?'ac':(sets.find(a=>a.id==asel&&(a.shaft||a.spine||a.len))||sets.find(a=>a.shaft||a.spine||a.len)||{}).id||'';
  const snap0=cb&&window.bowSnap&&bowSnap(cb.id);
  app.innerHTML=`<div class="card"><span class="kicker">New tuning session</span><h2>Which tune?</h2>
  <div class="labgrid2"><div><label for="tc">Tune</label><select id="tc">${TUNES.map(c=>`<option>${c}</option>`).join('')}</select></div>
  <div><label for="tn">Name</label><input id="tn" placeholder="e.g. Paper tune after new rest"></div>
  <div><label for="td">Distance</label><input id="td" placeholder="e.g. 18m or 20yd"></div>
  <div><label>Bow type</label><div class="labseg" role="group" aria-label="Bow type" id="tbt"><button data-nbt="c" aria-pressed="${!(snap0&&snap0.type!='compound')}">Compound</button><button data-nbt="r" aria-pressed="${!!(snap0&&snap0.type!='compound')}">Recurve</button></div></div>
  <div><label for="t_mybow">Bow</label>${bows.length?`<select id="t_mybow"><option value="">None</option>${bows.map(bopt).join('')}</select>`:`<p class="small muted" id="t_mybow_none" style="margin:4px 0">No bow saved yet. Add one in Tools › Add bow.</p>`}<p class="small muted" id="t_bowline" style="margin:4px 0 0">${h(bowLine(cb&&cb.id))}</p></div>
  <div><label for="t_myarr">Arrows</label><select id="t_myarr"><option value="">None</option>${acs?`<option value="ac"${sdef=='ac'?' selected':''}>Arrow chooser: ${h(arwSum(acs))}</option>`:''}${sets.map(a=>`<option value="${h(a.id)}"${a.id==sdef?' selected':''}>${h(a.name||'Arrows')}</option>`).join('')}</select></div>
  <div id="thandw"><label for="thand">Bow hand</label><select id="thand"><option value="R">Right-handed archer</option><option value="L">Left-handed archer</option></select></div></div>
  <button class="btn alt full" id="tgo" style="margin-top:8px">Start</button></div>
  ${mine.length?`<div class="card" id="tpast"><span class="kicker">Past sessions</span>${mine.slice().reverse().map(t=>{const k=tKind(t),rc=tScale(t),tq=torqueOn(t);if(tq)torqueEnsure(t);const B=k=='paper'||tq?null:gstats(t.before,rc),A=k=='paper'||tq?null:gstats(t.after,rc),pn=t.paper?(t.paper.before||[]).length+(t.paper.after||[]).length:0,tn=tq?['before','after'].map(g=>['L','R'].map(s=>torquePts(t,g,s).length).reduce((a,b)=>a+b,0)):null;
   return`<div class="tpastrow">${row('x" data-tune="'+t.id,'🎯',t.name||tName(t),`${t.date} · ${tName(t)}${t.dist?' · '+t.dist:''} · ${k=='paper'?pn+' arrow'+(pn==1?'':'s'):tq?(tn[0]+' before / '+tn[1]+' after'):(B?B.n:0)+' before'+(A?' / '+A.n+' after':'')}`)}<button class="btn ghost tpastdel" data-tdel="${t.id}" aria-label="Delete ${h(t.name||tName(t))} from ${h(t.date)}">Delete</button></div>`}).join('')}</div>`:''}
  <p class="small muted">Records where your arrows land and what you changed.</p>`;
  bar('Arrow optimizer','tools','Tools');
  let nbt=snap0&&snap0.type!='compound'?'r':'c';
  app.querySelectorAll('[data-nbt]').forEach(b=>b.onclick=()=>{nbt=b.dataset.nbt;app.querySelectorAll('[data-nbt]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.nbt==nbt))});
  const tcs=()=>{$('#thandw').hidden=!['Bare shaft vs fletched','Paper tune'].includes($('#tc').value)};$('#tc').onchange=tcs;tcs();
  const pb=$('#t_mybow');if(pb)pb.onchange=()=>{$('#t_bowline').textContent=bowLine(pb.value);const s=pb.value&&window.bowSnap&&bowSnap(pb.value);if(s){nbt=s.type=='compound'?'c':'r';app.querySelectorAll('[data-nbt]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.nbt==nbt))}};
  $('#tgo').onclick=()=>{const bid=pb?pb.value:'',c=$('#tc').value,av=$('#t_myarr')?$('#t_myarr').value:'',hand=$('#thand')?$('#thand').value:undefined;
   tuneStart(c,{bt:nbt,bow:bid,name:$('#tn').value.trim(),dist:$('#td').value.trim(),arrow:av,hand:hand});render();scrollTo(0,0)};
  app.querySelectorAll('[data-tune]').forEach(x=>x.onclick=()=>{S._tuneId=x.dataset.tune;save();render();scrollTo(0,0)});
  app.querySelectorAll('[data-tdel]').forEach(x=>x.onclick=e=>{e.stopPropagation();const t=S.tune.find(y=>y.id==x.dataset.tdel&&y.archer==S.profile);if(!t)return;
   if(confirm(`Delete "${t.name||tName(t)}" from ${t.date}? This can't be undone.`)){S.tune=S.tune.filter(y=>y!==t);save();render()}});return}
 if(torqueEnsure(T))save();
 const k=tKind(T),rcm=tScale(T),g=T.grp||'before',paper=k=='paper',one=T.change=='Just a group',bare=k=='bare',tq=torqueOn(T),side=T.side||'L';
 const B=paper||tq?null:gstats(T.before,rcm),A=paper||tq?null:gstats(T.after,rcm);
 const LB=bare?'Fletched':'Before',LA=bare?'Bare':'After';
 const line=(nm,s)=>s?`<tr><th>${nm}</th><td>${s.n}</td><td>${cm(s.mr*2)} cm</td><td>${cm(s.es)} cm</td><td>${dir(s.cx,s.cy)}</td></tr>`:`<tr><th>${nm}</th><td colspan="4" class="muted">No arrows yet</td></tr>`;
 let cmp='';if(tq)cmp=torqueVerdict(T,rcm);else if(bare)cmp=bareVerdict(T,B,A);else if(!paper&&B&&A&&B.n>1&&A.n>1){const d=Math.round((1-A.mr/B.mr)*100);cmp=`<p class="lab-note">After the change the group is <b>${Math.abs(d)}% ${d>=0?'tighter':'wider'}</b> (average spread ${cm(B.mr*2)} → ${cm(A.mr*2)} cm) and its centre moved ${dir(A.cx-B.cx,A.cy-B.cy)}.</p>`}
 const pp=paper?paperBlock(T,g):null;
 const seg=one?'':`<div class="labseg" role="group" aria-label="Which group"><button data-g="before" aria-pressed="${g=='before'}">${paper||tq?'':'● '}${LB}</button><button data-g="after" aria-pressed="${g=='after'}">${paper||tq?'':'■ '}${LA}</button></div>`;
 const sides=tq?`<div class="labseg" role="group" aria-label="Torque direction" id="tsides"><button data-side="L" aria-pressed="${side=='L'}">Torqued left</button><button data-side="R" aria-pressed="${side=='R'}">Torqued right</button></div>
 <p class="tleg small muted" style="margin:0 0 8px"><span class="tleg-l">●</span> Before left &nbsp;<span class="tleg-l">▲</span> Before right &nbsp;<span class="tleg-r">■</span> After left &nbsp;<span class="tleg-r">◆</span> After right</p>`:'';
 const plot=paper?pp.pad+pp.list:crossSvg(T,rcm,k);
 const tqRows=tq?line('● Before · Torqued left',gstats(torquePts(T,'before','L'),rcm))+line('▲ Before · Torqued right',gstats(torquePts(T,'before','R'),rcm))+line('■ After · Torqued left',gstats(torquePts(T,'after','L'),rcm))+line('◆ After · Torqued right',gstats(torquePts(T,'after','R'),rcm)):'';
 const stats=paper?paperHints(T,pp.top):`<table class="labtbl" id="${tq?'tqstats':'tstats'}"><thead><tr><th></th><th>Arrows</th><th>Avg spread</th><th>Widest</th><th>Centre</th></tr></thead><tbody>${tq?tqRows:line(one?'● Group':'● '+LB,B)+(one?'':line('■ '+LA,A))}</tbody></table>`;
 const help=paper?'':`<p class="small muted">Tap where each arrow landed. Grid squares are 5 cm${T.face?` (this older session uses its ${h(T.face)} face's scale)`:''}. Avg spread = twice the average distance from the group centre. Widest = the two furthest-apart arrows.</p>`;
 const clrLbl=tq?h('torqued '+(side=='L'?'left':'right')+' ('+(g=='before'?'before':'after')+')'):one?'group':h((g=='before'?LB:LA).toLowerCase());
 const head=`<div class="card"><span class="kicker">${h(T.date)} · ${h(tName(T))}${T.dist?' · '+h(T.dist):''}${T.bowName?' · '+h(T.bowName):''}</span><h2>${h(T.name||tName(T))}</h2>`;
 const tools=`<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><button class="btn ghost" id="tun">↶ Undo</button><button class="btn ghost" id="tclr">Clear ${clrLbl}</button><button class="btn ghost" id="tdone">Done</button><button class="btn ghost" id="tdel">Delete session</button></div>`;
 const meta=`${bare||paper?`<label for="tvhand">Bow hand</label><select id="tvhand"><option value=""${T.hand?'':' selected'}>Not set</option><option value="R"${T.hand=='R'?' selected':''}>Right-handed archer</option><option value="L"${T.hand=='L'?' selected':''}>Left-handed archer</option></select>`:''}${cmp}${readNote(k)}${help}
 <label for="tnote">Note</label><textarea id="tnote" rows="2">${h(T.note||'')}</textarea>`;
 const offer=window._tuneOffer&&mine.find(x=>x.id==window._tuneOffer&&x.id!=T.id);
 const offerCard=offer?`<div class="card" id="tuneoffer"><p class="small" style="margin:0 0 8px">You have an unfinished ${h(tName(offer))} from ${h(offer.date)}${offer.dist?' · '+h(offer.dist):''}. This screen is a new session.</p><button class="btn ghost" id="tuneofferbtn" type="button">Continue the earlier session</button></div>`:'';
 app.innerHTML=offerCard+(tq
  ?`${head}${seg}${sides}${plot}${tools}</div>${whatCard(T,k)}<div class="card" id="tqafter"><span class="kicker">Left vs right</span>${stats}${meta}</div>${arwCard(T,one)}`
  :`${head}<div class="labgrid2"><div>${seg}${plot}${tools}</div><div>${stats}${meta}</div></div></div>${whatCard(T,k)}${arwCard(T,one)}${bare?bareCard(T,B,A):''}`);
 bar('Tuning session','lab_opt','Arrow optimizer');
 const grp=()=>one||g=='before'?'before':'after';
 const tqPush=(x,y)=>{const box=T.torque[grp()],s=T.side||'L';(box[s]=box[s]||[]).push([+x.toFixed(3),+y.toFixed(3),new Date().toLocaleDateString('en-CA')])};
 if(paper){app.querySelectorAll('[data-tear]').forEach(b=>b.onclick=()=>{T.paper=T.paper||{before:[],after:[]};(T.paper[grp()]=T.paper[grp()]||[]).push(b.dataset.tear);save();render()})}
 else{const sv=$('#tface');sv.onclick=e=>{const r=sv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*2.1-1.05,y=(e.clientY-r.top)/r.height*2.1-1.05;if(tq)tqPush(x,y);else T[grp()].push([+x.toFixed(3),+y.toFixed(3),new Date().toLocaleDateString('en-CA')]);save();render()}}
 app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{T.grp=b.dataset.g;save();render()});
 app.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>{T.side=b.dataset.side;save();render()});
 $('#tun').onclick=()=>{if(paper)(T.paper[grp()]||[]).pop();else if(tq)(T.torque[grp()][T.side||'L']||[]).pop();else T[grp()].pop();save();render()};
 $('#tclr').onclick=()=>{if(confirm('Clear these arrows?')){if(paper)T.paper[grp()]=[];else if(tq)T.torque[grp()][T.side||'L']=[];else T[grp()]=[];save();render()}};
 $('#tdone').onclick=()=>{S._tuneId=null;save();render()};
 $('#tdel').onclick=()=>{if(confirm(`Delete "${T.name||tName(T)}" from ${T.date}? This can't be undone.`)){S.tune=S.tune.filter(x=>x!==T);S._tuneId=null;window._tuneOffer=null;save();render()}};
 const ob=$('#tuneofferbtn');if(ob)ob.onclick=()=>{const id=window._tuneOffer,fresh=T;window._tuneOffer=null;if(fresh&&tuneEmpty(fresh))S.tune=S.tune.filter(x=>x!==fresh);S._tuneId=id;save();render();scrollTo(0,0)};
 $('#tnote').onchange=e=>{T.note=e.target.value;save()};
 const th=$('#tvhand');if(th)th.onchange=()=>{if(th.value)T.hand=th.value;else delete T.hand;save();render()};
 whatWire(T,k);
 const ad=$('#tarwcard');if(ad)ad.addEventListener('toggle',()=>{window._tarwOpen=ad.open});
 const ta=$('#tarwafter');if(ta)ta.onclick=()=>{const a=window.arrowSetup&&arrowSetup();if(a){T.arrowAfter=a;window._tarwOpen=true;save();render()}};arwWire(T);
 app.querySelectorAll('.card [data-go]').forEach(x=>x.onclick=()=>nav(x.dataset.go))};
/* Arrow setup in a tuning session (22 Oct 2026, Nathe): new sessions carry a snapshot of the Arrow chooser setup (t.arrow);
   'Use my current arrow setup for After' adds t.arrowAfter, so the session shows exactly what changed. Old sessions show nothing. */
function arwSum(a){return[a.model&&a.spine?a.model+' '+a.spine:(a.spine?'spine '+a.spine:''),a.len?a.len+'"':'',a.pt!=null?a.pt+' gr point':''].filter(Boolean).join(' · ')}
/* R2 (3 Nov 2026, Nathe via Archery Coach): every Before and After box on the session's Arrow setup card can be typed in, with the same
   range check as the Arrow chooser (arrowLim). Edits save to this session only (t.arrow, t.arrowAfter), never to the Arrow chooser,
   My bows or My arrows. A figure outside its range is kept in the box as typed, flagged, and not saved; a figure already saved that is
   out of range (copied from the chooser before R1) is flagged when shown and left as it is until it is typed over. */
const TA_F=[['model','Shaft','text'],['spine','Spine','text'],['len','Length','in'],['pt','Point','gr'],['foc','FOC','%'],['tw','Total weight','gr'],['fps','Speed','fps']];
const TA_PEND={};/* typed figures that failed the check, this visit only (never saved) */
function arwCard(T,one){const a=T.arrow||null,b=T.arrowAfter||null,L=window.arrowLim||(()=>null);
 const F=[['Spine',x=>x.spine?(x.model?x.model+' ':'')+x.spine:'-'],['Length',x=>x.len!=null?x.len+'"':'-'],['Point',x=>x.pt!=null?x.pt+' gr':'-'],['FOC',x=>x.foc!=null&&isFinite(x.foc)?(+x.foc).toFixed(1)+'%':'-'],['Total weight',x=>x.tw!=null?x.tw+' gr':'-'],['Speed',x=>x.fps!=null?x.fps+' fps'+(x.fpsSrc=='estimate'?' (estimate)':''):'-']];
 const changed=a&&b?F.filter(([n,f])=>f(a)!=f(b)).map(([n,f])=>`${n.toLowerCase()} ${f(a)} → ${f(b)}`):[];
 const cell=(side,o,k,u)=>{const id=`ta_${side}_${k}`,pk=T.id+':'+side+':'+k,pend=TA_PEND[pk];let v=pend!=null?pend:(o&&o[k]!=null?o[k]:'');
  if(k=='foc'&&pend==null&&v!==''&&isFinite(v))v=(+v).toFixed(1);let m=u=='text'?null:L(k,v);if(m)m=m.replace(' It is left out until it is fixed.',pend!=null?' It is not saved. Type the right figure.':' Type the right figure to replace it.');
  return`<td><input id="${id}" class="ta_in" data-ta="${side}:${k}" ${u=='text'?'maxlength="30"':'inputmode="decimal"'} value="${h(String(v))}" aria-label="${side=='b'?(one?'Arrow':'Before'):'After'} ${TA_F.find(x=>x[0]==k)[1]}${u!='text'?' ('+u+')':''}"${m?` aria-invalid="true" aria-describedby="${id}_bad"`:''}>${m?`<p class="labbad" id="${id}_bad" role="alert">${h(m)}</p>`:''}</td>`};
 const rows=TA_F.map(([k,n,u])=>`<tr><th>${n}${u!='text'?` <span class="muted small">(${u})</span>`:''}</th>${cell('b',a,k,u)}${one?'':cell('a',b,k,u)}</tr>`).join('');
 const sum=x=>x?h(arwSum(x)):'';
 return`<details class="card" id="tarwcard"${window._tarwOpen?' open':''}><summary><span class="kicker">Arrow setup (optional)</span> <span class="small muted">${a&&b?'Before and after':'Only if you changed arrows'}</span></summary>${a&&b?`<p style="margin:2px 0 8px">${changed.length?'What changed: <b>'+h(changed.join(', '))+'</b>':'Nothing changed between Before and After.'}</p>`:''}
 ${a&&arwSum(a)?`<p class="small" style="margin:0 0 6px">${one?'Arrow':'Before'}: ${sum(a)}${b&&arwSum(b)?`<br>After: ${sum(b)}`:''}</p>`:''}
 <table class="labtbl tarwtbl"><thead><tr><th></th><th>${one?'Arrow':'Before'}</th>${one?'':'<th>After</th>'}</tr></thead><tbody>${rows}</tbody></table>
 <div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start;margin-top:8px">${!a&&window.arrowSetup&&arrowSetup()?`<button class="btn ghost" id="tarwbefore">Use my current arrow setup for ${one?'this group':'Before'}</button>`:''}${one?'':`<button class="btn ghost" id="tarwafter">${b?'Update After to my current setup':'Use my current arrow setup for After'}</button>`}<button class="btn ghost" data-go="lab_chooser">Arrow chooser</button></div>
 <p class="small muted" style="margin:6px 0 0">Type in any box to correct it. Changes are kept with this session only; your Arrow chooser, My bows and My arrows are not changed. A figure outside the usual range is pointed out and not saved.</p></details>`}
function arwWire(T){app.querySelectorAll('[data-ta]').forEach(x=>x.onchange=()=>{const[side,k]=x.dataset.ta.split(':'),u=TA_F.find(f=>f[0]==k)[2],raw=x.value.trim(),pk=T.id+':'+side+':'+k;
  if(u!='text'&&raw!==''&&window.arrowLim&&arrowLim(k,raw)){TA_PEND[pk]=raw;render();return}
  delete TA_PEND[pk];
  const o=side=='b'?(T.arrow=T.arrow||{}):(T.arrowAfter=T.arrowAfter||Object.assign({},T.arrow||{}));
  if(u=='text')o[k]=raw;else{o[k]=raw===''?null:parseFloat(raw.replace(',','.'));if(k=='fps')o.fpsSrc=raw===''?'':'own'}
  save();render()});
 const tb=$('#tarwbefore');if(tb)tb.onclick=()=>{const a=window.arrowSetup&&arrowSetup();if(a){T.arrow=a;save();render()}}}
/* R3 (3 Nov 2026, Nathe via Archery Coach): for Fletched vs Bare the comparison line is a plain tuning verdict, not "X% tighter".
   Side to side: for a right-handed archer bare shafts right of the fletched group read weak and left read stiff (Easton, Bare Shaft
   Planing Test); mirrored for a left-handed archer (the session's bow hand). High or low points to the nocking point (Easton) or, on a
   recurve or barebow, tiller. With the usual next step, labelled general tuning guidance. Easton writes the test for finger release,
   so a compound (release aid) session gets a note to paper tune first. Uses the same spread rule as the Bare shaft reading card. */
function bareVerdict(T,B,A){if(!B||!A||B.n<3||A.n<2)return`<p class="lab-note" id="bareverdict">Plot at least 3 fletched (●) and 2 bare (■) arrows to see the verdict.</p>`;
 const dx=A.cx-B.cx,dy=A.cy-B.cy,sp=B.mr,hd=T.hand,lh=hd=='L',side=Math.abs(dx)<=sp?'ok':(lh?dx<0:dx>0)?'weak':'stiff',vert=Math.abs(dy)<=sp?'':dy<0?'high':'low';
 const comp=T.bt?T.bt=='c':((T.arrow&&T.arrow.bow=='compound')||/compound/i.test(T.bowName||''));
 const parts=[];let next=[];
 if(!hd&&side!='ok')parts.push(`bare shafts ${cm(Math.abs(dx))} cm ${dx>0?'right':'left'} of the fletched group; choose the bow hand to see weak or stiff`);
 else if(side=='ok')parts.push('side to side the bare shafts are with the fletched group, so spine looks right');
 else{parts.push(`bare shafts ${cm(Math.abs(dx))} cm ${dx>0?'right':'left'} of the fletched group: the arrow is acting <b>${side}</b>${lh?' (left-handed, so the right-handed reading is mirrored)':''}`);
  next.push(side=='weak'?'weak: a lighter point, more plunger tension, slightly less draw weight, or a shorter arrow if it still clears the rest':'stiff: a heavier point, less plunger tension, slightly more draw weight, or a weaker spine (do not cut it shorter)')}
 if(vert){parts.push(`bare shafts ${cm(Math.abs(dy))} cm ${vert} of the fletched group: check the nocking point${comp?'':' or tiller'}`);
  next.push(vert=='high'?`high: move the nocking point up a little at a time${comp?'':', then look at tiller if that does not fix it'}`:`low: move the nocking point down a little at a time${comp?'':', then look at tiller if that does not fix it'}`)}
 const ok=side=='ok'&&!vert&&hd;
 return`<div class="lab-note" id="bareverdict"><p style="margin:0"><b>Verdict:</b> ${ok?'the bare shafts and fletched arrows land together, so the arrow is basically tuned.':parts.join('; ')+'.'}</p>${next.length?`<p style="margin:6px 0 0"><b>Usual next step</b> <span class="small muted">(general tuning guidance)</span>: ${next.join('; ')}. Change one thing at a time, then shoot the test again.</p>`:''}${comp?`<p class="small" style="margin:6px 0 0">Compound with a release aid: Easton writes this test for finger release and says paper tuning is the usual first step with a release, so treat the side-to-side reading as a clue, not an answer.</p>`:''}</div>`}
/* Bare shaft vs fletched: reading and next step, only from Easton's Arrow Tuning and Maintenance Guide (Bare Shaft Planing Test, p. 5;
   Adjustments Within the Bow and Arrow System, p. 10). The guide gives the left/right reading for a right-handed archer only. */
function bareCard(T,B,A){const S2=window.ARROW_SRC||{},tm=S2.eastonTM?`<a href="${S2.eastonTM[1]}" target="_blank" rel="noopener">${h(S2.eastonTM[0])}</a>`:'Easton Arrow Tuning and Maintenance Guide';
 const head=`<div class="card" id="barecard"><span class="kicker">Bare shaft reading</span>`,tail=`<p class="small muted" style="margin:8px 0 0">Easton's Bare Shaft Planing Test: three fletched arrows, then two bare shafts aimed the same, at 15 to 20 yards or metres. It is written for finger release.</p><p class="labsrc">${tm}</p></div>`;
 if(!B||!A||B.n<3||A.n<2)return head+`<p style="margin:2px 0 0">Plot at least 3 fletched (●) and 2 bare (■) arrows to see the reading.</p>`+tail;
 const dx=A.cx-B.cx,dy=A.cy-B.cy,sp=B.mr,out=[];
 if(Math.abs(dy)>sp)out.push(`<p>Bare shafts are <b>${cm(Math.abs(dy))} cm ${dy<0?'higher':'lower'}</b> than the fletched group. Easton: ${dy<0?'move the nocking point <b>up</b>':'move the nocking point <b>down</b>'} until they hit at the same height${dy>0?' (slightly lower is sometimes wanted)':''}. On a recurve or barebow, if moving the nocking point does not bring them level, tiller can also move bare shafts up or down (general tuning guidance, not from Easton's guide).</p>`);
 if(T.hand!='R'&&T.hand!='L'){out.push(`<p>Side to side, bare shafts are ${cm(Math.abs(dx))} cm ${dx>=0?'right':'left'} of the fletched group. Choose the bow hand above to see the weak or stiff reading.</p>`);return head+out.join('')+tail}
 if(Math.abs(dx)<=sp){out.push(`<p>Side to side, the bare shafts are within the fletched group's average spread. Easton: "Your equipment is basically tuned when the bare shafts and fletched shafts impact at the same or very near the same location."</p>`);return head+out.join('')+tail}
 const lh=T.hand=='L',weak=lh?dx<0:dx>0,fw=window.arrowFocWith,pt=fw&&fw({dpt:weak?-25:25}),ct=weak&&fw&&fw({dlen:-0.25});
 const focTxt=r=>r?(r.to.toFixed(1)==r.from.toFixed(1)?`FOC about the same (${r.from.toFixed(1)}% → ${r.to.toFixed(2)}%)`:`FOC ${r.from.toFixed(1)}% → <b>${r.to.toFixed(1)}%</b>`):'FOC: set up your arrow in the Arrow chooser to see this';
 const m=(T.dist||'').match(/(\d+(?:\.\d+)?)\s*(m|yd|y)/i),d=m?+m[1]:NaN,far=isFinite(d)&&d>=18&&d<=20&&Math.abs(dx)>15;
 out.push(lh?`<p>Bare shafts are <b>${cm(Math.abs(dx))} cm ${dx>0?'right':'left'}</b> of the fletched group. For a left-handed archer this reads as <b>${weak?'weak':'stiff'}</b>: Easton's guide gives the reading for right-handed archers, and for a left-handed archer it is mirrored (general tuning guidance).</p>`:`<p>Bare shafts are <b>${cm(Math.abs(dx))} cm ${weak?'right':'left'}</b> of the fletched group. For a right-handed archer Easton reads this as <b>${weak?'weak':'stiff'}</b>.</p>`);
 return head+out.join('')+`</div><div class="card" id="nextcard"><span class="kicker">Next step to try</span><p class="small" style="margin:2px 0 8px">Starting points from Easton's guide. Change one thing at a time, then shoot the test again.</p>
 <table class="labtbl"><tbody>
 <tr><th>${weak?'Lighter':'Heavier'} point or insert</th><td>${weak?'−':'+'}25 gr is a first step to try (Easton's chart counts 25 gr as 3 lb of bow weight)<br><span class="small">${focTxt(pt)}</span></td></tr>
 <tr><th>Cushion plunger</th><td>${weak?'Increase':'Decrease'} spring tension<br><span class="small">FOC unchanged</span></td></tr>
 <tr><th>Draw weight</th><td>${weak?'Decrease':'Increase'} it slightly, if your bow weight is adjustable<br><span class="small">FOC unchanged (the formula has no draw weight in it)</span></td></tr>
 <tr><th>Cut length</th><td>${weak?`Cut 1/4" shorter (Gold Tip's step), only if the arrow still reaches about 1" past the rest (Easton). A shorter arrow acts stiffer: Easton's chart asks for a weaker spine as length drops.<br><span class="small">${focTxt(ct)}</span>`:`Don't cut: a shorter arrow acts stiffer on Easton's chart. If nothing else works, the chart's answer is a weaker spine.`}</td></tr>
 </tbody></table>${far?`<p class="lab-note" style="margin-top:8px">More than 15 cm (6 in) at ${d} ${m[2]}: Easton says the equipment needs changing to get a good tune, which may mean a ${weak?'stiffer':'weaker'} spine.</p>`:''}
 <p class="small muted" style="margin:8px 0 0">These are starting points, not answers. Confirm with another bare-shaft test.</p><p class="labsrc">${tm}${S2.gt?` · <a href="${S2.gt[1]}" target="_blank" rel="noopener">${h(S2.gt[0])}</a>`:''}${S2.easton?` · <a href="${S2.easton[1]}" target="_blank" rel="noopener">${h(S2.easton[0])}</a>`:''}</p></div>`}

/* Calculators: standard physics. Speed estimate is the common IBO-rating rule of thumb, clearly marked. */
LABSEC.lab_calc='tools';
/* Calculators (22 Oct 2026, Nathe): arrow speed first; its worked-out speed and arrow weight feed the KE & momentum card, which the
   archer can override there. KE speed starts blank (KE and momentum '-') until a speed is worked out or typed. The old stored
   'fps' value (the 280 default) is left in storage but no longer read; overrides use new keys fpsU and grU. */
E.lab_calc=function(){const C=S.calc=S.calc||{gr:'400',ibo:'340',dl:'29',dw:'60',sg:'0',len:'29',bp:'17'};
 const n=k=>parseFloat(C[k]),SL=7000*32.174,set=k=>C[k]!=null&&String(C[k]).trim()!=='';
 /* R1: each box is checked against its range (arrowLim); a flagged box is left out, so the speed shows '-' with the reason, never a negative figure */
 const LK={ibo:'ibo',dl:'dl',dw:'dw',gr:'tw',sg:'sg',grU:'tw',fpsU:'fps',len:'len',bp:'bp'},bad=k=>window.arrowLim?arrowLim(LK[k],C[k]):null;
 const nOk=k=>bad(k)?NaN:n(k);
 const gr0=nOk('gr'),sgV=set('sg')?nOk('sg'):0,spdBad=['ibo','dl','dw','gr','sg'].some(k=>bad(k));
 const est=window.arrowSpeedEst?arrowSpeedEst(nOk('ibo'),nOk('dl'),nOk('dw'),gr0,sgV):n('ibo')-10*(30-n('dl'))-Math.max(0,gr0-5*n('dw'))/3-n('sg')/3;
 const estWhy=isFinite(est)?'':spdBad?'Fix the flagged box above to see the speed.':['ibo','dl','dw','gr'].some(k=>!set(k))?'Fill in all four boxes to see the speed.':'No estimate: the rule of thumb gives under 100 fps for these figures, so it does not fit this setup. A chronograph reading is better.';
 const vAuto=C.spdOn&&isFinite(est)&&est>0?Math.round(est):NaN;
 const own=set('fpsU'),v=own?nOk('fpsU'):vAuto,gr=set('grU')?nOk('grU'):gr0,ok=isFinite(v)&&v>0&&isFinite(gr)&&gr>0;
 const ke=ok?gr*v*v/(2*SL):NaN,mo=ok?gr*v/SL:NaN;
 const foc=bad('len')||bad('bp')?NaN:(n('bp')-n('len')/2)/n('len')*100;
 const f=(x,d=1)=>isFinite(x)?x.toFixed(d):'-';
 const inp=(k,l,u,val,ph)=>{const m=bad(k);return`<label for="c_${k}">${l} <span class="muted small">(${u})</span></label><input id="c_${k}" data-c="${k}" inputmode="decimal" value="${h(val!==undefined?val:(C[k]==null?'':C[k]))}"${ph?` placeholder="${ph}"`:''}${m?` aria-invalid="true" aria-describedby="cbad_${k}"`:''}>${m?`<p class="labbad" id="cbad_${k}" role="alert">${h(m)}</p>`:''}`};
 app.innerHTML=`<div class="labgrid2">
 <div class="card"><span class="kicker">Arrow speed estimate · compound</span>${inp('ibo','IBO/ATA','fps')}${inp('dl','Draw length','inches')}${inp('dw','Draw weight','lb')}${inp('gr','Arrow weight','grains')}${inp('sg','Extra weight on the string','grains')}
  <p>About <span class="labout" id="c_est">${f(est,0)}</span> fps <span class="muted">(${f(est*0.3048)} m/s)</span></p>${estWhy?`<p class="small" id="c_estwhy">${h(estWhy)}</p>`:''}
  <p class="small muted">${C.spdOn?'This speed and arrow weight are used in the card below.':'Change any figure here and the speed is used in the card below.'}</p>
  <p class="labsrc">Estimate only, using the common rule of thumb from the IBO rating (30" draw, 5 grains per lb): −10 fps per inch under 30", −1 fps per 3 grains of arrow over 5 grains per lb, −1 fps per 3 grains on the string. A chronograph reading is always better.</p></div>
 <div class="card"><span class="kicker">Kinetic energy &amp; momentum</span>${inp('grU','Arrow weight','grains',set('grU')?C.grU:(isFinite(gr0)?C.gr:''))}${inp('fpsU','Arrow speed','feet per second',own?C.fpsU:(isFinite(vAuto)?String(vAuto):''),'0')}
  <p class="small muted">${own||set('grU')?'Your own figures. Clear a box to use the speed calculator above again.':isFinite(vAuto)?'From the speed calculator above. Type your own (e.g. a chronograph reading) to override.':'Work out a speed above, or type your own.'}</p>
  <p class="small muted">${ok?f(v*0.3048)+' m/s · '+f(gr*0.0648)+' g':'-'}</p>
  <p>Kinetic energy <span class="labout">${f(ke)}</span> ft·lb <span class="muted">(${f(ke*1.3558)} J)</span></p>
  <p>Momentum <span class="labout">${f(mo,3)}</span> slug·ft/s <span class="muted">(${f(mo*4.448,2)} kg·m/s)</span></p>
  <p class="labsrc">KE = ½mv², momentum = mv, with m = grains ÷ 7000 ÷ 32.174.</p></div>
 <div class="card"><span class="kicker">FOC (front of centre)</span>${inp('len','Arrow length','inches, nock groove to end of shaft')}${inp('bp','Balance point','inches from the nock groove, point on')}
  <p>FOC <span class="labout">${f(foc)}%</span></p><p class="labsrc">FOC = (balance point − length ÷ 2) ÷ length × 100.</p></div></div>`;
 bar('Calculators','tools','Tools');
 {const fr=window._acFrom;window._acFrom=null;app.querySelector('.labbar').insertAdjacentHTML('afterend',fr?`<p class="lab-note" id="acfrom">From the Arrow chooser: ${h(fr.sent.join(', '))} filled in.${fr.left.length?' Still to enter yourself: '+h(fr.left.join(', '))+'.':''} <button class="btn ghost" data-go="lab_chooser" style="min-height:32px;padding:4px 10px">Arrow chooser</button></p>`:`<p class="small muted" style="margin:0 0 10px">Choosing a new arrow? <button class="btn ghost" data-go="lab_chooser" style="min-height:32px;padding:4px 10px">Arrow chooser</button></p>`);bindGo()}
 app.querySelectorAll('[data-c]').forEach(i=>i.onchange=e=>{const k=i.dataset.c,val=e.target.value.trim();
  if(k=='fpsU'&&!C.fpsU&&isFinite(vAuto)&&+val==vAuto)return;if(k=='grU'&&!C.grU&&+val==gr0)return;
  C[k]=val;if(['ibo','dl','dw','sg','gr'].includes(k))C.spdOn=1;save();render()})};

/* 3D rules: only what the official documents say, with links */
LABSEC.lab_rules='tools';
const RULES={
 ABA:{t:'ABA National 3D Round (Australian Bowhunters Association)',rows:[['A zone','20','14','8'],['B zone','18','12','6'],['C zone (hair/hide line)','16','10','4'],['Miss, or only the rock or tree section hit','0','0','0']],head:['Zone','1st arrow','2nd arrow','3rd arrow'],
  cap:'3-arrow round: all three columns. 2-arrow round: 1st and 2nd arrow columns. 1-arrow round: 1st arrow column. Only the first arrow to score counts.',
  cases:[['Arrow on a line','Scores the lower zone. It must go into the higher zone, however slightly.'],['Arrow embedded in another arrow','Same score as that arrow'],['Arrow through the face, still in the butt','Pushed back by the Group Captain and scored'],['Skid or glance off the ground, or big deflection, into the target','No score'],['Bounce-out or pass-through the group can\'t agree on','Re-shoot'],['Shot from the wrong peg','Lose your highest-scoring arrow'],['More arrows shot than set','Lose the highest-value arrow or arrows']],
  notes:['A round is 20 targets, shot as 3-arrow, 2-arrow or 1-arrow rounds. Only the first arrow to score counts.','Grading score = a 3-arrow round + a 1-arrow round (or a 2-arrow + a 1-arrow, or two 1-arrow rounds).','Distances are unmarked: seniors 20 to 50 m, juniors 13 to 40 m, cubs 8 to 25 m.','A and B zone sizes depend on the target group, from 40/80 mm (group 1) to 150/300 mm (group 5).','In ScoreTool, Score › ABA Interclub 3D uses this scoring.'],
  src:[['ABA Rules for National Archery Games, consolidated 1 Jan 2026 v2 (Rule 13 Scoring; National 3D Round)','https://www.bowhunters.org.au/national-rules-of-shoot/'],['ABA: Types of field archery','https://www.bowhunters.org.au/types-of-field-archery/']]},
 IBO:{t:'IBO 3-D (International Bowhunting Organization)',rows:[['11 ring (centred in the 10, about 25% of its size)','11'],['10 ring','10'],['Vital area (8 ring)','8'],['Body','5'],['Miss, or horn not touching body colour','0']],head:['Area','Points'],
  cases:[['Arrow touching the line of a higher area','Higher score'],['Legs or hooves in a different colour','Body (5)'],['Extra material around the animal outline','No score'],['Vanes, feathers or nock collar only','Cannot score'],['More than one scoring area visible','The host marks at the stake which counts; if not posted, either can be used'],['Arrow pulled before both scorekeepers record it','0']],
  notes:['An arrow touching the line of a higher scoring area gets the higher score. Vanes, feathers and nock collars cannot score.','Distances are unmarked. Maximum by stake: Blue 50 yd, Green 45, Red 40, Yellow 35, Orange 30, White 25, Neon Pink 20.','Two scorekeepers must agree each score before arrows are pulled. Arrows pulled early score 0.'],
  src:[['IBO Rules and Class Definitions 2026 (II. Targets and scoring areas)','https://iboarchery.com/wp-content/uploads/2026-Rules-Doc.pdf'],['IBO Rules and Regulations','https://iboarchery.com/rules-and-regulations']]},
 ASA:{t:'ASA (Archery Shooters Association)',rows:[['12 ring (lower 12 is in play)','12'],['10 ring (5-inch circle inside the 8)','10'],['8 ring','8'],['Body','5'],['Miss','0']],head:['Area','Points'],
  cases:[['Upper 12, called before shooting','12 (the lower 12 then scores 10 on that target)'],['Shaft touching the next higher line','Higher value'],['14 ring','Special events only, such as pro shoot-downs'],['Number of 12s left blank on the card','Counts as zero'],['Missing or wrong card information or signature','Minus 10 points']],
  notes:['The upper 12 counts only when the shooter calls it before shooting. Then the lower 12 scores 10 on that target.','The 14 ring (upper rear of the 8) is only used in special events such as pro shoot-downs.','Targets are Delta McKenzie with the ASA Pro 12-ring.'],
  src:[['ASA scoring images','https://asaarchery.com/rules/scoring-images/'],['ASA scoring system','https://asaarchery.com/about-asa/'],['ASA Pro/Am Rules 2026','https://asaarchery.com/rules/asa-pro-am-rules/']]},
 IFAA:{t:'IFAA field, animal, 3D and indoor rounds',rows:[['Field','5 spot, 4 inner, 3 outer'],['Hunter','5, 4 and 3'],['Expert Field','5, 4, 3, 2, 1. X is for tie-breaks only'],['International','5, 4 and 3'],['Animal, marked or unmarked','1st arrow 20 kill or 18 wound, 2nd 16 or 14, 3rd 12 or 10'],['3D Hunting, 1 arrow','Kill 20, vital 16, wound 10'],['3D Standard, each arrow','Kill 10, vital 8, wound 5'],['Indoor','5, 4, 3, 2, 1. X is for tie-breaks only. A 5-spot, if used, is white 5 and blue 4']],head:['Round','Score'],
  cap:'Outdoor rounds have no fixed time limit in the Book of Rules. The Field Captain may set one. Indoor ends do: 4 minutes for the IFAA Indoor Round, 3 minutes for the Flint Indoor Round.',
  cases:[['Hunter, Animal, Expert and 3D line','The line is the lower zone. The arrow must cut through it to score higher'],['Field face (no painted line)','The arrow must cut into the higher zone'],['Bounce-out or pass-through on paper or indoor','Shoot another, specially marked arrow'],['3D hit near the hairline that does not stay in','No score, and no re-shoot'],['Arrow embedded in another arrow','Same score as that arrow'],['Arrow deflected by another','Scores where it lands'],['Skid off the ground into the target','No score'],['Wrong marker or wrong face','That arrow is lost, with no re-shoot'],['Two arrows in one spot that cannot be told apart','Lose the higher one (2026 clarification)'],['Drawn four times and not shot','A miss, except for safety'],['Outdoor arrow you can reach with your bow from the marker','You may shoot another'],['Stand, base, horns or antlers','No score. An arrow in the legs does count'],['Two arrows in one indoor 5-spot','Only the lower scores']],
  notes:['Score IFAA Field and Hunter under Score. Marked rounds (Field, Hunter, Expert) are groups of 3–4, unmarked 3–6, at IFAA sanctioned tournaments (Art. IV H 4 a).','Junior and cub distances on this page are a summary. The full tables are in Art. V A-J.','Course layout, championship rounds and mail matches are not on this page.','Whether a Western Australian field tournament uses these IFAA rules or an ABA variant is not confirmed.'],
  src:[['IFAA Book of Rules, revision 4 April 2021 (PDF)','https://www.ifaa-archery.org/download/247/rules/6711/2021-book-of-rules.pdf'],['IFAA Book of Rules page','https://www.ifaa-archery.org/documents/rule-book/book-of-rules/'],['IFAA Executive Clarifications FINAL.01, 1 June 2026 (PDF)','https://www.ifaa-archery.org/download/247/rules/14449/ifaa-executive-clarifications_final-01_20260601.pdf']]}};
/* Rules tabs: WA and AA (rules_wa_aa.js) + the 3D books. The chosen tab and discipline live in memory only, nothing is saved. */
let RTAB=null,RDISC='target';const RORGS=['WA','AA','ABA','IBO','ASA','IFAA'];
E.lab_rules=function(){if(!RTAB)RTAB=RORGS.includes(S._rules)?S._rules:'WA';const k=RTAB,seg=`<div class="labseg" role="group" aria-label="Rule book">${RORGS.map(x=>`<button data-r="${x}" aria-pressed="${x==k}">${x}</button>`).join('')}</div>`;
 if(k=='WA'||k=='AA'){app.innerHTML=seg+(window.rulesWaAaHTML?rulesWaAaHTML(k,RDISC):'<div class="card"><p class="small">Rules could not load. Reload the app.</p></div>');
  bar('Rules','tools','Tools');app.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{RTAB=b.dataset.r;render()});
  app.querySelectorAll('[data-rd]').forEach(b=>b.onclick=()=>{RDISC=b.dataset.rd;render()});rulesFind();return}
 const R=RULES[k],F=(window.RULES_DATA||{})[k];
 app.innerHTML=`${seg}
 <div class="card"><span class="kicker">Scoring at a glance</span><h2>${h(R.t)}</h2>
 <table class="labtbl"><thead><tr>${R.head.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${R.rows.map(r=>`<tr>${r.map((c,i)=>i?`<td><b>${c}</b></td>`:`<th>${h(c)}</th>`).join('')}</tr>`).join('')}</tbody></table>${R.cap?`<p class="small muted" style="margin:6px 0 0">${h(R.cap)}</p>`:''}
 ${R.cases?`<h3 style="margin:12px 0 4px;font-size:16px">Special cases</h3><table class="labtbl"><thead><tr><th>Case</th><th>Score</th></tr></thead><tbody>${R.cases.map(c=>`<tr><th>${h(c[0])}</th><td>${h(c[1])}</td></tr>`).join('')}</tbody></table><p class="small muted" style="margin:6px 0 0">From the rule book sections listed below.</p>`:''}</div>
 ${F?`<div class="card"><span class="kicker">Full rules · plain English</span><h2>${h(F.doc)}</h2>
 ${F.note?`<p class="small muted">${h(F.note)}</p>`:''}
 <label for="rsq">Find a rule</label><input id="rsq" type="search" placeholder="e.g. bounce, line, let down, range finder" autocomplete="off">
 <p class="small muted" id="rscount" aria-live="polite">${F.sections.length} sections. Tap one to open it.</p>
 <div id="rslist">${F.sections.map((x,n)=>`<details class="rsec" data-t="${h((x[0]+' '+x[1]+' '+x[2].join(' ')).toLowerCase())}"><summary><b>${h(x[0])}</b></summary><ul>${x[2].map(t=>`<li>${h(t)}</li>`).join('')}</ul><p class="labsrc">Source: ${h(F.doc)}, ${h(x[1])}</p></details>`).join('')}</div>
 <p class="lab-note">Always check the event's own rules on the day. This is a plain-English summary; the official document wins if anything differs.</p>
 <p class="labsrc">Documents: ${F.links.map(l=>`<a href="${l[1]}" target="_blank" rel="noopener">${h(l[0])}</a>`).join(' · ')}<br>Last checked: ${h(window.RULES_CHECKED||'')}</p></div>`:''}
 <div class="card"><span class="kicker">Coming soon</span><p class="small muted" style="margin:0">Pictures of each target's rings, and links from archerycalendars.com 3D events to these pages.</p></div>`;
 bar('Rules','tools','Tools');app.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{RTAB=b.dataset.r;render()});rulesFind()};
function rulesFind(){
 const q=$('#rsq');if(q)q.oninput=()=>{const v=q.value.trim().toLowerCase(),L=[...app.querySelectorAll('.rsec')];let n=0;
  L.forEach(d=>{const m=!v||v.split(/\s+/).every(w=>d.dataset.t.includes(w));d.hidden=!m;d.open=!!v&&m;if(m)n++});
  $('#rscount').textContent=v?(n?`${n} section${n==1?'':'s'} match "${q.value.trim()}"`:`Nothing matches "${q.value.trim()}". Try another word.`):`${L.length} sections. Tap one to open it.`}};

/* ---------- Full analysis: everything from the testers' Stats in one place ---------- */
LABSEC.lab_analysis='myarch';
E.lab_analysis=function(){let bc='',an='';window._anSel=null;try{bc=window.labBestCard&&labBestCard()||''}catch(e){}try{an=window.labAnalysisHTML?labAnalysisHTML():''}catch(e){an='<div class="card"><p class="small">The analysis could not be built from this data.</p></div>'}
 app.innerHTML=`<div class="card" id="oneanalysis"><span class="kicker">Analysis</span><h2 style="margin:2px 0 8px">One analysis</h2><p class="small" style="margin:0 0 10px">Stats, personal bests and trends are on this screen. Built from your past competition results and rounds scored here.</p><div class="row" style="gap:8px;flex-wrap:wrap;justify-content:flex-start"><button class="btn ghost" id="anstats">Stats and personal bests</button><button class="btn ghost" data-go="analytics">Trends across shoots</button></div></div>${bc}${an}`;
 bar('Analysis','myarch','My archery');$('#anstats').onclick=()=>{S.statsMore=true;save();nav('stats')};if(window.labBindAnalysis)labBindAnalysis();if(window.bindBest)bindBest()};

/* ---------- Back buttons: every screen below a section names its parent and goes there (works on a direct load) ---------- */
const TOP=new Set(['home','score','myarch','clubs','tools']);
const PAR={stats:['Stats & PBs','myarch','My archery'],analytics:['Analytics','myarch','My archery'],badges:['Badge collection','lab_season','Season & badges'],recap:['Monthly recap','lab_season','Season & badges'],
 follow:['Following','clubs','Clubs'],profile:['Edit my card','lab_profile','Profile & card'],help:['Help','lab_settings','Settings & help'],whatsnew:['What\'s new','lab_settings','Settings & help'],suggest:['Suggest a change','lab_settings','Settings & help'],lab_me:['Me','home','Home'],scorecards:['Scorecards','home','Home']};
Object.assign(LABSEC,{lab_analysis:'myarch'});
const ALIAS=v=>v=='squad'?'lab_squad':v=='me'?'lab_settings':v=='diary'?'lab_diary':v=='rewards'?'lab_ranks':v=='lab_season'?'lab_ranks':v;
const known=v=>['home','score','stats','diary','me','squad'].includes(v)||typeof (window.EXTRA_VIEWS||{})[v]=='function';
function inner(){if(view=='lab_leagues'&&window._lgv&&window._lgE&&window._lgE.code==window._lgv)return['League',()=>{const y=window._lgRet||0;window._lgE=null;window._lgRet=null;window._lgAct=null;lgView(window._lgv);scrollTo(0,y);requestAnimationFrame(()=>scrollTo(0,y))}];
 if(view=='lab_leagues'&&window._lgv)return['Leagues',()=>{window._lgv=null;window._lgE=null;nav('lab_leagues')}];
 if(view=='lab_opt'&&S._tuneId&&(S.tune||[]).some(t=>t.id==S._tuneId))return['Arrow optimizer',()=>{S._tuneId=null;save();nav('lab_opt')}];return null}
/* Discard card (22 Oct 2026): throw away the card being scored, after a confirm. It is removed from this phone, and its id is
   listed in scoretool.cal.<tester>.discarded so it can never be sent to Archery Calendar My events. */
function discardCtl(){if($('#labdiscard')||!cur)return;const fin=isDone(cur)||(!!cur.finished&&arrowsIn(cur)>0);if(fin)return;
 const host=app.querySelector('.ad')||app;host.insertAdjacentHTML('beforeend','<button type="button" class="ad-discard" id="labdiscard">Discard card</button>');
 $('#labdiscard').onclick=()=>{if(!confirm('Discard this card? Its arrows are deleted from this phone and it is never sent to Archery Calendar.'))return;const c=cur;
  S.sessions=S.sessions.filter(x=>x!==c);if(window.calDiscard)calDiscard(c.id);fix=null;sv='sheet';justDone=false;cur=null;save();nav('score')}}
function scoringCtl(){discardCtl();if($('#labfl'))return;const t=app.querySelector('.ad-title');
 const fin=isDone(cur)||(!!cur.finished&&arrowsIn(cur)>0);
 const back=window._sheetBack=='scorecards'?'Scorecards':window._sheetBack=='shotdone'?'All done':'Score';
 if(!t){/* ABA 3D scorer: card layout, so a normal top bar */const lb=fin?'‹ '+back:'Finish later';app.insertAdjacentHTML('afterbegin',`<div class="labbar"><button class="btn ghost labback" id="labfl"${fin?'':' title="Every target is already saved. Carry on later from Score or Home."'}>${lb}</button><h1>${fin?'Score sheet':'Scoring'}</h1></div>`)}else t.insertAdjacentHTML('afterbegin',fin?`<button class="labfl" id="labfl" aria-label="Close this score sheet and go to ${back}">‹ ${back}</button>`:'<button class="labfl" id="labfl" title="Every arrow is already saved. Carry on later from Score or Home.">Finish later</button>');
 $('#labfl').onclick=()=>{if(!fin&&!arrowsIn(cur)&&isNew(cur))S.sessions=S.sessions.filter(x=>x!==cur);const go=fin?window._sheetBack:null;window._sheetBack=null;fix=null;sv='sheet';justDone=false;cur=null;save();nav(go||'score')}}
function ensureBack(){try{if(typeof TESTER=='undefined'||!TESTER||!S.unlocked||!S.profile||/^#(share|coach)=/.test(location.hash)||$('#tabs').hidden)return;
 if(view=='score'){if(typeof cur!='undefined'&&cur)scoringCtl();return}
 if(TOP.has(view))return;const inn=inner();let b=app.querySelector(':scope>.labbar');
 if(!b){const p=PAR[view];if(!p)return;bar(p[0],p[1],p[2]);b=app.querySelector(':scope>.labbar')}
 let k=b.querySelector('.labback');
 if(!k){const p=PAR[view]||[0,'home','Home'];b.insertAdjacentHTML('afterbegin',`<button class="btn ghost labback" data-go="${p[1]}">‹ ${h(p[2])}</button>`);k=b.firstElementChild;k.onclick=()=>nav(k.dataset.go)}
 if(inn&&k.dataset.inner!=inn[0]){k.dataset.inner=inn[0];k.textContent='‹ '+inn[0];k.onclick=inn[1]}}catch(e){}}
let _q=false;new MutationObserver(()=>{if(_q)return;_q=true;queueMicrotask(()=>{_q=false;ensureBack()})}).observe(app,{childList:true,subtree:true});
/* browser back/forward: each screen has its own address (?p=screen) */
let popping=false;const _nav3=nav;
nav=function(v){v=ALIAS(v);_nav3(v);if(!popping){const q=new URLSearchParams(location.search);if(view=='home')q.delete('p');else q.set('p',view);const qs=q.toString(),u=location.pathname+(qs?'?'+qs:'');/* keeps ?tester= and any other params */if(location.pathname+location.search!==u||location.hash)history.pushState({lab:view},'',u)}};
addEventListener('popstate',()=>{if(typeof cur!='undefined'&&cur&&view=='score')return;const p=new URLSearchParams(location.search).get('p')||'home';if(p!=view&&known(p)){popping=true;try{nav(p)}finally{popping=false}}});
{const p0=new URLSearchParams(location.search).get('p');if(p0&&p0!='home'&&known(p0)&&!location.hash){popping=true;try{nav(p0)}finally{popping=false}}}
})();
