/* Layout (22 Oct 2026, tried first in scoretool-lab). Re-groups the existing screens into Home / Score / My archery / Clubs / Tools (+ Me in the top bar)
   and adds the idea-list tools. Every existing screen is reused as-is (same data, same code); this file only picks which cards show where. Nothing here renames, rewrites or deletes stored data: new settings only add their own keys or fields. */
(function(){
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SECTION={home:'home',score:'score',stats:'myarch',analytics:'myarch',diary:'myarch',badges:'myarch',recap:'myarch',rewards:'myarch',squad:'clubs',follow:'clubs',profile:'me',help:'me',suggest:'me',me:'me'};
const secOf=v=>v.startsWith('lab_')?(LABSEC[v]||'home'):(SECTION[v]||v);
const LABSEC={};
const label=e=>((e.querySelector('.kicker,h2,h3,summary')||e).innerText||'').trim().toUpperCase();
function keep(test){[...app.children].forEach((e,i)=>{if(!test(e,label(e),i))e.remove()})}
function bindGo(){app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>nav(b.dataset.go))}
function bar(title,back,backLbl){app.insertAdjacentHTML('afterbegin',`<div class="labbar">${back?`<button class="btn ghost labback" data-go="${back}">‹ ${h(backLbl)}</button>`:''}<h1>${h(title)}</h1></div>`);bindGo()}
const row=(go,i,t,d,soon)=>`<button class="labrow${soon?' soon':''}" data-go="${go}"><span class="i" aria-hidden="true">${i}</span><span><b>${h(t)}</b><small>${h(d)}</small></span><span class="go" aria-hidden="true">›</span></button>`;
function menu(title,rows){app.innerHTML=`<div class="labmenu">${rows.join('')}</div>`;bar(title)}
/* a sub-screen built from an existing view: run it, keep some cards, add a back bar */
function sub(id,sec,title,back,backLbl,base,test,after){LABSEC[id]=sec;E[id]=function(){base();if(test&&!(base.sc&&typeof cur!=='undefined'&&cur))keep(test);if(after)after();bar(title,back,backLbl)}}

/* nav: highlight the section, not the sub-screen */
const _nav=nav;nav=function(v){_nav(v);const s=secOf(view);document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.v==s))};

/* top bar: Me button */
function addMe(){const t=document.querySelector('.top');if(!t||t.querySelector('.labme'))return;const b=document.createElement('button');b.className='labme';b.textContent='Me';b.setAttribute('aria-label','Me and settings');b.onclick=()=>nav('lab_me');const hb=t.querySelector('.help-btn');hb?t.insertBefore(b,hb):t.appendChild(b);const tb=document.createElement('button');tb.className='labtheme';tb.onclick=()=>setTheme(curTheme()=='dark'?'light':'dark');t.insertBefore(tb,b);paintTheme(curTheme())}
function curTheme(){return document.documentElement.getAttribute('data-theme')=='dark'?'dark':'light'}
function setTheme(t){localStorage.setItem('scoretool.theme',t);paintTheme(t)}
function paintTheme(t){document.documentElement.setAttribute('data-theme',t);const m=document.querySelector('meta[name=theme-color]');if(m)m.content=t=='dark'?'#0b0f17':'#ffffff';document.querySelectorAll('.labtheme').forEach(b=>{b.textContent=t=='dark'?'☀️':'🌙';b.title=t=='dark'?'Switch to light mode':'Switch to dark mode';b.setAttribute('aria-label',b.title)})}
setTimeout(addMe,0);setTimeout(addMe,800);

/* ---------- Home: a few big buttons ---------- */
const _home=home;
home=function(){addMe();let last='';try{const L=latestShoot();if(L)last=`Last shoot: ${L.score} on ${h(L.round)}, ${new Date(L.date).toLocaleDateString('en-AU',{day:'numeric',month:'short'})}`}catch(e){}
 const nm=(typeof TESTER!=='undefined'&&TESTER&&TESTER.name)||'';
 app.innerHTML=`<p class="muted" style="margin:0 0 10px">G'day${nm?' '+h(String(nm).split(' ')[0]):''}${last?' · '+last:''}</p>
 <button class="hub-score" data-go="score"><span aria-hidden="true">🎯</span><span>Score<small>Start or carry on a shoot</small></span></button>
 <div class="hub-grid">
  <button class="hub-tile" data-go="myarch"><span class="i" aria-hidden="true">📓</span><b>My archery</b><small>Stats, PBs, diary, setups, sight marks</small></button>
  <button class="hub-tile" data-go="clubs"><span class="i" aria-hidden="true">👥</span><b>Clubs &amp; leagues</b><small>Squads, leagues, match play, following</small></button>
  <button class="hub-tile" data-go="tools"><span class="i" aria-hidden="true">🔧</span><b>Tools</b><small>Arrow optimizer, calculators, 3D rules</small></button>
  <a class="hub-tile" href="https://archerycalendars.com/" target="_blank" rel="noopener"><span class="i" aria-hidden="true">📅</span><b>Calendar</b><small>Events on archerycalendars.com ↗</small></a>
 </div>`;bindGo()};

/* ---------- Score: just the scoring ---------- */
const _score=score;
score=function(){_score();if((typeof cur!=='undefined'&&cur)||view!='score')return;
 (window._csMode=='league'?['#h2hcard','#pgcard']:['#h2hcard','#lgcard','#pgcard']).forEach(s=>{const e=app.querySelector(s);if(e)e.remove()});
 const b=typeof curBow=='function'&&curBow();const first=app.firstElementChild;
 const note=`<p class="small muted" style="margin:6px 0 0">Setup: <b>${b?h(b.name):'none yet'}</b> · <a href="#" data-go="lab_gear">change</a> &nbsp;·&nbsp; Leagues, match play and group cards are in <a href="#" data-go="clubs">Clubs</a></p>`;
 if(first)first.insertAdjacentHTML('beforeend',note);app.querySelectorAll('a[data-go]').forEach(a=>a.onclick=e=>{e.preventDefault();nav(a.dataset.go)})};
/* rounds scored with a setup selected remember it, so setups can be compared */
const PAGE_T=Date.now(),isNew=x=>x&&+String(x.id||'').slice(1)>=PAGE_T;/* only rounds started after this page opened: old records are never touched */
setInterval(()=>{try{if(typeof cur!=='undefined'&&cur&&isNew(cur)&&!cur.bow&&typeof curBow=='function'){const b=curBow();if(b)cur.bow=b.id}}catch(e){}},1000);

/* ---------- My archery ---------- */
LABSEC.myarch='myarch';
E.myarch=()=>menu('My archery',[
 row('lab_analysis','🔬','Full analysis','Analysis read, group patterns, best scores, stats detail and trends'),
 row('lab_latest','⭐','Latest shoot','How your last shoot went, wins of the day, notes'),
 row('stats','📈','Stats & PBs','Pick a round: last shoot, trend, personal bests, history'),
 row('analytics','📊','Analytics','Trends across shoots, distances, 10+X rate'),
 row('lab_arrows','➕','Practice arrows','Today\'s arrow count and weekly progress'),
 row('lab_diary','📝','Diary','Shooting diary in your own words'),
 row('lab_gear','🏹','Setups & sight marks','Bow setups, sight marks by distance, scores per setup'),
 row('lab_ranks','🏅','Rankings & classification','Real AA rankings and classification progress'),
 row('lab_season','🏆','Season, badges & recap','Season points, badge collection, monthly recap')]);
sub('lab_latest','myarch','Latest shoot','myarch','My archery',()=>_home(),(e,t,i)=>i<3||/FROM YOUR NOTES/.test(t));
sub('lab_arrows','myarch','Practice arrows','myarch','My archery',()=>_home(),(e,t,i)=>i==0||/TODAY'S ARROWS/.test(t));
sub('lab_diary','myarch','Diary','myarch','My archery',()=>diary(),(e,t)=>/SHOOTING DIARY|TIMELINE/.test(t));
sub('lab_ranks','myarch','Rankings & classification','myarch','My archery',()=>E.rewards(),e=>e.id=='realrank'||e.id=='c-class');
sub('lab_season','myarch','Season, badges & recap','myarch','My archery',()=>E.rewards(),(e,t)=>/SEASON|RECAP/.test(t),()=>{app.insertAdjacentHTML('beforeend',`<button class="btn ghost full" data-go="badges">🎖️ Badge collection</button>`)});
sub('lab_gear','myarch','Setups & sight marks','myarch','My archery',()=>diary(),(e,t)=>e.id=='gearcard'||/BOW & SETUP DIARY|CURRENT SETUP/.test(t),()=>{app.insertAdjacentHTML('beforeend',setupScores())});
function setupScores(){const L=(typeof myBows=='function'?myBows():[]);if(!L.length)return'';
 const ss=(S.sessions||[]).filter(s=>s.bow&&!s.sample&&typeof isDone=='function'&&isDone(s));
 const rows=L.map(b=>{const m=ss.filter(s=>s.bow==b.id);if(!m.length)return`<tr><th>${h(b.name)}</th><td colspan="3" class="muted">No rounds scored with this setup yet</td></tr>`;
  const by={};m.forEach(s=>{(by[s.round]=by[s.round]||[]).push(total(s))});
  return Object.entries(by).map(([r,v],k)=>`<tr><th>${k?'':h(b.name)}</th><td>${h(r)}</td><td>${v.length}</td><td>${Math.max(...v)} best · ${Math.round(v.reduce((a,x)=>a+x,0)/v.length)} avg</td></tr>`).join('')}).join('');
 return`<div class="card"><span class="kicker">Scores per setup</span><h2>Which setup scores best</h2><table class="labtbl"><thead><tr><th>Setup</th><th>Round</th><th>Rounds</th><th>Scores</th></tr></thead><tbody>${rows}</tbody></table><p class="small muted">Rounds you score in ScoreTool remember the setup picked here. Official Archer's Diary results don't record a setup, so they aren't in this table.</p></div>`}

/* ---------- Clubs & leagues ---------- */
const SC=()=>_score();SC.sc=1;
LABSEC.clubs='clubs';
E.clubs=()=>menu('Clubs & leagues',[
 row('lab_squad','🛡️','Squads','Your private squad: board, activity, people'),
 row('lab_leagues','🏁','Leagues','Leagues you belong to. Join with a code or start one'),
 row('lab_match','⚔️','Match play','Head-to-head on two phones, shoot-ups'),
 row('lab_group','📋','Group score card','Score your whole group on one phone'),
 row('follow','👣','Following','Archers you follow and your feed')]);
sub('lab_leagues','clubs','Leagues','clubs','Clubs',SC,e=>e.id=='lgcard');
sub('lab_match','clubs','Match play','clubs','Clubs',SC,e=>e.id=='h2hcard');
sub('lab_group','clubs','Group score card','clubs','Clubs',SC,e=>e.id=='pgcard');
LABSEC.lab_squad='clubs';
const SQT=[['board','Board',t=>/WEEKLY LEAGUE|MORE BOARDS/.test(t)],['activity','Activity',t=>/ACTIVITY/.test(t)],['people','People',t=>/COACHES & PARENTS|ME IN THIS SQUAD|ADMIN ONLY/.test(t)],['manage','Create / join',t=>/CREATE ANOTHER SQUAD|SAFE SQUADS/.test(t)]];
E.lab_squad=function(){squad();const n=app.children.length,tab=S._labsq||'board',T=SQT.find(x=>x[0]==tab)||SQT[0];
 if(n>3)keep((e,t,i)=>i==0||T[2](t));
 app.firstElementChild&&app.firstElementChild.insertAdjacentHTML('afterend',`<div class="labseg" role="group" aria-label="Squad sections">${SQT.map(x=>`<button aria-pressed="${x[0]==tab}" data-sq="${x[0]}">${x[1]}</button>`).join('')}</div>`);
 app.querySelectorAll('[data-sq]').forEach(b=>b.onclick=()=>{S._labsq=b.dataset.sq;render()});bar('Squads','clubs','Clubs')};

/* ---------- Me (top bar) ---------- */
LABSEC.lab_me='me';
E.lab_me=()=>menu('Me',[
 row('lab_profile','🪪','Profile & card','Display name, archer card, badges, best moments'),
 row('lab_people','🧑‍🏫','Coaches & parents','Your details, coach access, parent link'),
 row('lab_settings','⚙️','Settings & help','Settings, linked apps, help guides')]);
sub('lab_profile','me','Profile & card','lab_me','Me',()=>me(),(e,t)=>['nmcard'].includes(e.id)||e.classList.contains('pcard')||/^BADGES|MY BEST MOMENTS/.test(t));
sub('lab_people','me','Coaches & parents','lab_me','Me',()=>me(),e=>['pxcard','coachcard','parentcard'].includes(e.id));
sub('lab_settings','me','Settings & help','lab_me','Me',()=>me(),(e,t)=>['settingscard','oapps'].includes(e.id)||/^HELP|^TESTER|RESET MY TEST DATA/.test(t),()=>{const t=curTheme();app.insertAdjacentHTML('afterbegin',`<div class="card" id="themecard"><span class="kicker">Appearance</span><h2>Light or dark</h2><div class="labseg" role="group" aria-label="Theme"><button data-th="light" aria-pressed="${t=='light'}">☀️ Light</button><button data-th="dark" aria-pressed="${t=='dark'}">🌙 Dark</button></div><p class="small muted" style="margin:0">Also on the sun/moon button at the top. Target faces keep their real colours in both.</p></div>`);app.querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{setTheme(b.dataset.th);render()});if(window.calCard){$('#themecard').insertAdjacentHTML('afterend',calCard());calBind()}});

/* ---------- Tools ---------- */
LABSEC.tools='tools';
E.tools=()=>menu('Tools',[
 row('lab_opt','🎯','Arrow optimizer & tuning','Plot practice groups. Compare before and after a change'),
 row('lab_calc','🧮','Calculators','Arrow speed, kinetic energy, momentum, FOC'),
 row('lab_rules','🦌','3D scoring & rules','Scoring rings for ABA, IBO and ASA, with sources')]);

/* Arrow optimizer: groups on a plain tuning face. Before = blue circles, After = black squares (shape and colour both differ). */
LABSEC.lab_opt='tools';
const CHANGES=['Just a group','Paper tune','Walk-back','Group test','Rest or nock height','Cam timing or shims','Other'];
const FACES={'40cm':20,'60cm':30,'80cm':40,'122cm':61};
function gstats(P,rcm){if(!P.length)return null;const cx=P.reduce((a,p)=>a+p[0],0)/P.length,cy=P.reduce((a,p)=>a+p[1],0)/P.length;
 const mr=P.reduce((a,p)=>a+Math.hypot(p[0]-cx,p[1]-cy),0)/P.length;let es=0;P.forEach(a=>P.forEach(b=>{es=Math.max(es,Math.hypot(a[0]-b[0],a[1]-b[1]))}));
 return{n:P.length,cx:cx*rcm,cy:cy*rcm,mr:mr*rcm,es:es*rcm}}
const cm=v=>(Math.round(v*10)/10).toFixed(1);
const dir=(x,y)=>`${cm(Math.abs(x))} cm ${x>=0?'right':'left'}, ${cm(Math.abs(y))} cm ${y>=0?'low':'high'}`;
E.lab_opt=function(){S.tune=S.tune||[];const mine=S.tune.filter(t=>t.archer==S.profile),T=mine.find(t=>t.id==S._tuneId);
 if(!T){const b=typeof curBow=='function'&&curBow();
  app.innerHTML=`<div class="card"><span class="kicker">New tuning session</span><h2>What are you testing?</h2>
  <div class="labgrid2"><div><label for="tn">Name</label><input id="tn" placeholder="e.g. Paper tune after new rest"></div>
  <div><label for="tc">Change</label><select id="tc">${CHANGES.map(c=>`<option>${c}</option>`).join('')}</select></div>
  <div><label for="td">Distance</label><input id="td" placeholder="e.g. 18m or 20yd"></div>
  <div><label for="tf">Face</label><select id="tf">${Object.keys(FACES).map(f=>`<option ${f=='40cm'?'selected':''}>${f}</option>`).join('')}</select></div></div>
  <p class="small muted">Setup: ${b?h(b.name):'none (add one in My archery › Setups & sight marks)'}</p>
  <button class="btn alt full" id="tgo">Start plotting</button></div>
  ${mine.length?`<div class="card"><span class="kicker">Past sessions</span>${mine.slice().reverse().map(t=>{const B=gstats(t.before,FACES[t.face]),A=gstats(t.after,FACES[t.face]);return row('x" data-tune="'+t.id,'🎯',t.name||t.change,`${t.date} · ${t.change}${t.dist?' · '+t.dist:''} · ${B?B.n:0} before${A?' / '+A.n+' after':''}`)}).join('')}</div>`:''}
  <p class="small muted">Records where your arrows land. It gives no tuning advice; that's your coach's job.</p>`;
  bar('Arrow optimizer','tools','Tools');
  $('#tgo').onclick=()=>{const t={id:'t'+Date.now(),archer:S.profile,date:new Date().toLocaleDateString('en-CA'),name:$('#tn').value.trim(),change:$('#tc').value,dist:$('#td').value.trim(),face:$('#tf').value,bow:b?b.id:null,bowName:b?b.name:'',before:[],after:[],grp:'before'};S.tune.push(t);S._tuneId=t.id;save();render()};
  app.querySelectorAll('[data-tune]').forEach(x=>x.onclick=()=>{S._tuneId=x.dataset.tune;save();render()});return}
 const rcm=FACES[T.face]||20,g=T.grp||'before',B=gstats(T.before,rcm),A=gstats(T.after,rcm),one=T.change=='Just a group';
 const rings=[...Array(10)].map((_,i)=>`<circle cx="0" cy="0" r="${(10-i)/10}" fill="${i>=8?'#ffd84d':'#fff'}" stroke="${i%2?'#94a3b8':'#1e293b'}" stroke-width="0.006"/>`).join('');
 const dots=T.before.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="0.035" fill="#1d4ed8" stroke="#fff" stroke-width="0.01"/>`).join('')+T.after.map(p=>`<rect x="${p[0]-.032}" y="${p[1]-.032}" width="0.064" height="0.064" fill="#111" stroke="#fff" stroke-width="0.01"/>`).join('');
 const cen=(S2,c)=>S2?`<path d="M${S2.cx/rcm-.06} ${S2.cy/rcm}h.12M${S2.cx/rcm} ${S2.cy/rcm-.06}v.12" stroke="${c}" stroke-width="0.012"/>`:'';
 const line=(nm,s)=>s?`<tr><th>${nm}</th><td>${s.n}</td><td>${cm(s.mr*2)} cm</td><td>${cm(s.es)} cm</td><td>${dir(s.cx,s.cy)}</td></tr>`:`<tr><th>${nm}</th><td colspan="4" class="muted">No arrows yet</td></tr>`;
 let cmp='';if(B&&A&&B.n>1&&A.n>1){const d=Math.round((1-A.mr/B.mr)*100);cmp=`<p class="lab-note">After the change the group is <b>${Math.abs(d)}% ${d>=0?'tighter':'wider'}</b> (average spread ${cm(B.mr*2)} → ${cm(A.mr*2)} cm) and its centre moved ${dir(A.cx-B.cx,A.cy-B.cy)}.</p>`}
 app.innerHTML=`<div class="card"><span class="kicker">${h(T.date)} · ${h(T.change)}${T.dist?' · '+h(T.dist):''} · ${h(T.face)} face${T.bowName?' · '+h(T.bowName):''}</span><h2>${h(T.name||T.change)}</h2>
 <div class="labgrid2"><div>
 ${one?'':`<div class="labseg" role="group" aria-label="Which group"><button data-g="before" aria-pressed="${g=='before'}">● Before</button><button data-g="after" aria-pressed="${g=='after'}">■ After</button></div>`}
 <svg class="tface" id="tface" viewBox="-1.05 -1.05 2.1 2.1" role="img" aria-label="Tuning face. Tap where each arrow landed.">${rings}${dots}${cen(B,'#1d4ed8')}${cen(A,'#111')}</svg>
 <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><button class="btn ghost" id="tun">↶ Undo</button><button class="btn ghost" id="tclr">Clear ${one?'group':g}</button><button class="btn ghost" id="tdone">Done</button><button class="btn ghost" id="tdel">🗑 Delete</button></div>
 </div><div>
 <table class="labtbl"><thead><tr><th></th><th>Arrows</th><th>Avg spread</th><th>Widest</th><th>Centre</th></tr></thead><tbody>${line(one?'● Group':'● Before',B)}${one?'':line('■ After',A)}</tbody></table>
 ${cmp}<p class="small muted">Tap where each arrow landed. Avg spread = twice the average distance from the group centre. Widest = the two furthest-apart arrows. Sizes use the ${h(T.face)} face.</p>
 <label for="tnote">Note</label><textarea id="tnote" rows="2">${h(T.note||'')}</textarea></div></div></div>`;
 bar('Tuning session','lab_opt','Arrow optimizer');
 const sv=$('#tface');sv.onclick=e=>{const r=sv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*2.1-1.05,y=(e.clientY-r.top)/r.height*2.1-1.05;(one||g=='before'?T.before:T.after).push([+x.toFixed(3),+y.toFixed(3)]);save();render()};
 app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{T.grp=b.dataset.g;save();render()});
 $('#tun').onclick=()=>{(one||g=='before'?T.before:T.after).pop();save();render()};
 $('#tclr').onclick=()=>{if(confirm('Clear these arrows?')){if(one||g=='before')T.before=[];else T.after=[];save();render()}};
 $('#tdone').onclick=()=>{S._tuneId=null;save();render()};
 $('#tdel').onclick=()=>{if(confirm('Delete this tuning session?')){S.tune=S.tune.filter(x=>x!==T);S._tuneId=null;save();render()}};
 $('#tnote').onchange=e=>{T.note=e.target.value;save()}};

/* Calculators: standard physics. Speed estimate is the common IBO-rating rule of thumb, clearly marked. */
LABSEC.lab_calc='tools';
E.lab_calc=function(){const C=S.calc=S.calc||{gr:'400',fps:'280',ibo:'340',dl:'29',dw:'60',sg:'0',len:'29',bp:'17'};
 const n=k=>parseFloat(C[k]),SL=7000*32.174;
 const gr=n('gr'),v=n('fps');const ke=gr*v*v/(2*SL),mo=gr*v/SL;
 const est=n('ibo')-10*(30-n('dl'))-Math.max(0,gr-5*n('dw'))/3-n('sg')/3;
 const foc=(n('bp')-n('len')/2)/n('len')*100;
 const f=(x,d=1)=>isFinite(x)?x.toFixed(d):'–';
 const inp=(k,l,u)=>`<label for="c_${k}">${l} <span class="muted small">(${u})</span></label><input id="c_${k}" data-c="${k}" inputmode="decimal" value="${h(C[k])}">`;
 app.innerHTML=`<div class="labgrid2">
 <div class="card"><span class="kicker">Kinetic energy &amp; momentum</span>${inp('gr','Arrow weight','grains')}${inp('fps','Arrow speed','feet per second')}
  <p class="small muted">${f(v*0.3048)} m/s · ${f(gr*0.0648)} g</p>
  <p>Kinetic energy <span class="labout">${f(ke)}</span> ft·lb <span class="muted">(${f(ke*1.3558)} J)</span></p>
  <p>Momentum <span class="labout">${f(mo,3)}</span> slug·ft/s <span class="muted">(${f(mo*4.448,2)} kg·m/s)</span></p>
  <p class="labsrc">KE = ½mv², momentum = mv, with m = grains ÷ 7000 ÷ 32.174.</p></div>
 <div class="card"><span class="kicker">FOC (front of centre)</span>${inp('len','Arrow length','inches, nock groove to end of shaft')}${inp('bp','Balance point','inches from the nock groove, point on')}
  <p>FOC <span class="labout">${f(foc)}%</span></p><p class="labsrc">FOC = (balance point − length ÷ 2) ÷ length × 100.</p></div>
 <div class="card"><span class="kicker">Arrow speed estimate · compound</span>${inp('ibo','IBO speed rating','fps')}${inp('dl','Draw length','inches')}${inp('dw','Draw weight','lb')}${inp('sg','Extra weight on the string','grains')}
  <p class="small muted">Arrow weight is taken from the first card (${f(gr,0)} gr).</p>
  <p>About <span class="labout">${f(est,0)}</span> fps <span class="muted">(${f(est*0.3048)} m/s)</span></p>
  <p class="labsrc">Estimate only, using the common rule of thumb from the IBO rating (30" draw, 5 grains per lb): −10 fps per inch under 30", −1 fps per 3 grains of arrow over 5 grains per lb, −1 fps per 3 grains on the string. A chronograph reading is always better.</p>
  <button class="btn ghost" id="cuse">Use this speed above</button></div></div>`;
 bar('Calculators','tools','Tools');
 app.querySelectorAll('[data-c]').forEach(i=>i.onchange=e=>{C[i.dataset.c]=e.target.value;save();render()});
 $('#cuse').onclick=()=>{if(isFinite(est)){C.fps=String(Math.round(est));save();render()}}};

/* 3D rules: only what the official documents say, with links */
LABSEC.lab_rules='tools';
const RULES={
 ABA:{t:'ABA National 3D Round (Australian Bowhunters Association)',rows:[['A zone','20','14','8'],['B zone','18','12','6'],['C zone (hair/hide line)','16','10','4']],head:['Zone','1st arrow','2nd arrow','3rd arrow'],
  notes:['A round is 20 targets, shot as 3-arrow, 2-arrow or 1-arrow rounds. Only the first arrow to score counts.','Grading score = a 3-arrow round + a 1-arrow round (or a 2-arrow + a 1-arrow, or two 1-arrow rounds).','Distances are unmarked: seniors 20 to 50 m, juniors 13 to 40 m, cubs 8 to 25 m.','A and B zone sizes depend on the target group, from 40/80 mm (group 1) to 150/300 mm (group 5).','In ScoreTool, Score › ABA Interclub 3D uses this scoring.'],
  src:[['ABA Rules for National Archery Games, consolidated 1 Jan 2026 v2 (Rule 13 Scoring; National 3D Round)','https://www.bowhunters.org.au/national-rules-of-shoot/'],['ABA: Types of field archery','https://www.bowhunters.org.au/types-of-field-archery/']]},
 IBO:{t:'IBO 3-D (International Bowhunting Organization)',rows:[['11 ring (centred in the 10, about 25% of its size)','11'],['10 ring','10'],['Vital area (8 ring)','8'],['Body','5'],['Miss, or horn not touching body colour','0']],head:['Area','Points'],
  notes:['An arrow touching the line of a higher scoring area gets the higher score. Vanes, feathers and nock collars cannot score.','Distances are unmarked. Maximum by stake: Blue 50 yd, Green 45, Red 40, Yellow 35, Orange 30, White 25, Neon Pink 20.','Two scorekeepers must agree each score before arrows are pulled. Arrows pulled early score 0.'],
  src:[['IBO Rules and Class Definitions 2026 (II. Targets and scoring areas)','https://iboarchery.com/wp-content/uploads/2026-Rules-Doc.pdf'],['IBO Rules and Regulations','https://iboarchery.com/rules-and-regulations']]},
 ASA:{t:'ASA (Archery Shooters Association)',rows:[['12 ring (lower 12 is in play)','12'],['10 ring (5-inch circle inside the 8)','10'],['8 ring','8'],['Body','5'],['Miss','0']],head:['Area','Points'],
  notes:['The upper 12 counts only when the shooter calls it before shooting. Then the lower 12 scores 10 on that target.','The 14 ring (upper rear of the 8) is only used in special events such as pro shoot-downs.','Targets are Delta McKenzie with the ASA Pro 12-ring.'],
  src:[['ASA scoring images','https://asaarchery.com/rules/scoring-images/'],['ASA scoring system','https://asaarchery.com/about-asa/'],['ASA Pro/Am Rules 2026','https://asaarchery.com/rules/asa-pro-am-rules/']]}};
E.lab_rules=function(){const k=S._rules||'ABA',R=RULES[k],F=(window.RULES_DATA||{})[k];
 app.innerHTML=`<div class="labseg" role="group" aria-label="Organisation">${Object.keys(RULES).map(x=>`<button data-r="${x}" aria-pressed="${x==k}">${x}</button>`).join('')}</div>
 <div class="card"><span class="kicker">Scoring at a glance</span><h2>${h(R.t)}</h2>
 <table class="labtbl"><thead><tr>${R.head.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${R.rows.map(r=>`<tr>${r.map((c,i)=>i?`<td><b>${c}</b></td>`:`<th>${h(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>
 ${F?`<div class="card"><span class="kicker">Full rules · plain English</span><h2>${h(F.doc)}</h2>
 ${F.note?`<p class="small muted">${h(F.note)}</p>`:''}
 <label for="rsq">Find a rule</label><input id="rsq" type="search" placeholder="e.g. bounce, line, let down, range finder" autocomplete="off">
 <p class="small muted" id="rscount" aria-live="polite">${F.sections.length} sections. Tap one to open it.</p>
 <div id="rslist">${F.sections.map((x,n)=>`<details class="rsec" data-t="${h((x[0]+' '+x[1]+' '+x[2].join(' ')).toLowerCase())}"><summary><b>${h(x[0])}</b></summary><ul>${x[2].map(t=>`<li>${h(t)}</li>`).join('')}</ul><p class="labsrc">Source: ${h(F.doc)}, ${h(x[1])}</p></details>`).join('')}</div>
 <p class="lab-note">Always check the event's own rules on the day. This is a plain-English summary; the official document wins if anything differs.</p>
 <p class="labsrc">Documents: ${F.links.map(l=>`<a href="${l[1]}" target="_blank" rel="noopener">${h(l[0])}</a>`).join(' · ')}<br>Last checked: ${h(window.RULES_CHECKED||'')}</p></div>`:''}
 <div class="card"><span class="kicker">Coming soon</span><p class="small muted" style="margin:0">Pictures of each target's rings, and links from archerycalendars.com 3D events to these pages.</p></div>`;
 bar('3D scoring & rules','tools','Tools');app.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{S._rules=b.dataset.r;save();render()});
 const q=$('#rsq');if(q)q.oninput=()=>{const v=q.value.trim().toLowerCase(),L=[...app.querySelectorAll('.rsec')];let n=0;
  L.forEach(d=>{const m=!v||v.split(/\s+/).every(w=>d.dataset.t.includes(w));d.hidden=!m;d.open=!!v&&m;if(m)n++});
  $('#rscount').textContent=v?(n?`${n} section${n==1?'':'s'} match "${q.value.trim()}"`:`Nothing matches "${q.value.trim()}". Try another word.`):`${L.length} sections. Tap one to open it.`}};

/* ---------- Full analysis: everything from the testers' Stats in one place ---------- */
LABSEC.lab_analysis='myarch';
E.lab_analysis=function(){let bc='',an='';try{bc=window.labBestCard&&labBestCard()||''}catch(e){}try{an=window.labAnalysisHTML?labAnalysisHTML():''}catch(e){an='<div class="card"><p class="small">The analysis could not be built from this data.</p></div>'}
 app.innerHTML=`<div class="card"><span class="kicker">Everything in one place</span><p class="small" style="margin:0 0 10px">Built from your Archer's Diary results and rounds scored here. Real results only.</p><div class="row" style="gap:8px;flex-wrap:wrap;justify-content:flex-start"><button class="btn ghost" id="anstats">📈 Stats &amp; PBs, with More detail</button><button class="btn ghost" data-go="analytics">📊 Analytics: trends across shoots</button></div></div>${bc}${an}`;
 bar('Full analysis','myarch','My archery');$('#anstats').onclick=()=>{S.statsMore=true;save();nav('stats')};if(window.labBindAnalysis)labBindAnalysis();if(window.bindBest)bindBest()};

/* ---------- Back buttons: every screen below a section names its parent and goes there (works on a direct load) ---------- */
const TOP=new Set(['home','score','myarch','clubs','tools']);
const PAR={stats:['Stats & PBs','myarch','My archery'],analytics:['Analytics','myarch','My archery'],badges:['Badge collection','lab_season','Season & badges'],recap:['Monthly recap','lab_season','Season & badges'],
 follow:['Following','clubs','Clubs'],profile:['Edit my card','lab_profile','Profile & card'],help:['Help','lab_settings','Settings & help'],suggest:['Suggest a change','lab_settings','Settings & help'],lab_me:['Me','home','Home']};
Object.assign(LABSEC,{lab_analysis:'myarch'});
const ALIAS=v=>v=='squad'?'lab_squad':v=='me'?'lab_settings':v=='diary'?'lab_diary':v=='rewards'?(view=='profile'?'lab_profile':'lab_season'):v;
const known=v=>['home','score','stats','diary','me','squad'].includes(v)||typeof (window.EXTRA_VIEWS||{})[v]=='function';
function inner(){if(view=='lab_leagues'&&window._lgv)return['Leagues',()=>{window._lgv=null;window._lgE=null;nav('lab_leagues')}];
 if(view=='lab_opt'&&S._tuneId&&(S.tune||[]).some(t=>t.id==S._tuneId))return['Arrow optimizer',()=>{S._tuneId=null;save();nav('lab_opt')}];return null}
function scoringCtl(){if($('#labfl'))return;const t=app.querySelector('.ad-title');
 const fin=isDone(cur)||(!!cur.finished&&arrowsIn(cur)>0);
 if(!t){/* ABA 3D scorer: card layout, so a normal top bar */const lb=fin?'‹ Score':'Finish later';app.insertAdjacentHTML('afterbegin',`<div class="labbar"><button class="btn ghost labback" id="labfl"${fin?'':' title="Every target is already saved. Carry on later from Score or Home."'}>${lb}</button><h1>${fin?'Score sheet':'Scoring'}</h1></div>`)}else t.insertAdjacentHTML('afterbegin',fin?'<button class="labfl" id="labfl" aria-label="Close this score sheet and go to Score">‹ Score</button>':'<button class="labfl" id="labfl" title="Every arrow is already saved. Carry on later from Score or Home.">Finish later</button>');
 $('#labfl').onclick=()=>{if(!fin&&!arrowsIn(cur)&&isNew(cur))S.sessions=S.sessions.filter(x=>x!==cur);fix=null;sv='sheet';justDone=false;cur=null;save();nav('score')}}
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
