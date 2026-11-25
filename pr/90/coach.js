/* ScoreTool coaching (26 Nov 2026). Plus/Pro archers can send a one-off share link
   (scores, plots, analysis and that day's diary; no coach account) or a coach code
   for an ongoing link. The coach's first code runs one ScoreTool + Archery Calendar
   sign-up, then the add-to-home-screen how-to; later codes go straight into the
   Archers list. The archer can remove the coach at any time. Coach view: Archers
   list, the same analysis with a coach-saved layout, custom charts, and a
   side-by-side compare. Notes on a round, end or diary entry: tuning (archer logs
   the change), blank bale / close target drill (diary tick-off), or form / mental.
   The coach sees everything; the archer can't hide the diary. Goals and training
   plans are not in this build. Live sync uses supabase/scoretool_coaching.sql,
   applied only at go-live. This file uses localStorage and URL hashes so the
   preview works without touching the live database. Colours: royal #1d4ed8 and
   neon #38e1ff / #5ab0ff. No purple. */
(function(){
const SB='https://sllsqpfqwckwtljzjxli.supabase.co';
const KEY_PUB='sb_publishable_t2g3KYdoGeTtcXTO-URK9g_Nf69SEFq';
const CAL='https://archerycalendars.com/';
const ROYAL='#1d4ed8', NEON='#38e1ff', BLUE='#5ab0ff';
const AUTH='scoretool.stripe.auth';
const K={
 links:'scoretool.coach.links',
 notes:'scoretool.coach.notes',
 shares:'scoretool.coach.shares',
 me:'scoretool.coach.me',
 demo:'scoretool.coach.demo',
 role:'scoretool.coach.role'
};
const CHARTS=[
 {id:'group',label:'Group plot'},
 {id:'ends',label:'End by end'},
 {id:'heat',label:'Heatmap'},
 {id:'avgs',label:'Averages'}
];
const NOTE_TYPES=[
 {id:'tuning',label:'Tuning suggestion',hint:'The archer records what they changed.'},
 {id:'drill',label:'Blank bale or close target drill',hint:'Shows in the archer\'s diary as a drill to tick off.'},
 {id:'form',label:'Form or mental',hint:'A general note the archer can read.'}
];
const $=sel=>document.querySelector(sel);
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function load(k,fb){try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?fb:v}catch(e){return fb}}
function store(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function today(){return (typeof window.today==='function'?window.today():new Date().toLocaleDateString('en-CA'))}
function uid(p){return (p||'c')+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function shortCode(){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='ST';for(let i=0;i<6;i++)s+=a[Math.floor(Math.random()*a.length)];return s}
function paid(){return typeof tierHas==='function'&&tierHas('plus')}
function demoOn(){try{return localStorage.getItem(K.demo)==='1'||/(?:^|[?&])coachdemo=1(?:&|$)/.test(location.search)}catch(e){return false}}
function canShare(){return paid()||demoOn()}
function finishedRounds(){return ((typeof S!=='undefined'&&S&&S.sessions)||[]).filter(s=>s&&(s.finished||(typeof isDone==='function'&&isDone(s))))}
function links(){return load(K.links,[])}
function saveLinks(L){store(K.links,L)}
function notes(){return load(K.notes,[])}
function saveNotes(L){store(K.notes,L)}
function shares(){return load(K.shares,{})}
function meCoach(){return load(K.me,null)}
function setMeCoach(x){store(K.me,x)}
function role(){return localStorage.getItem(K.role)||'archer'}
function setRole(r){try{localStorage.setItem(K.role,r)}catch(e){}}
function rowArcher(){return window._chArcher||''}
function coachId(){const m=meCoach();if(m&&m.id)return m.id;const a=load(AUTH,null);return (a&&a.email)||'coach-local'}
function archerId(){return (typeof TESTER!=='undefined'&&TESTER&&TESTER.id)||(typeof S!=='undefined'&&S&&S.profile)||'local'}
function archerName(){return (typeof S!=='undefined'&&S&&S.profile)||(typeof TESTER!=='undefined'&&TESTER&&(TESTER.name||TESTER.short))||'Archer'}
function appBase(){return location.origin+location.pathname+(location.search||'')}
function setHash(h){history.replaceState(null,'',location.pathname+location.search+h)}

function wrap(name,after){const fn=window[name];if(typeof fn!=='function')return;window[name]=function(){const r=fn.apply(this,arguments);try{after()}catch(e){}return r}}

function layoutOf(cid){
 const d=load('scoretool.coach.layout.'+(cid||coachId()),null);
 const order=CHARTS.map(c=>c.id);
 if(!d||typeof d!=='object')return {on:{group:true,ends:true,heat:true,avgs:true},order,round:'all',distance:'all',compareN:5,custom:[]};
 return {on:Object.assign({group:true,ends:true,heat:true,avgs:true},d.on||{}),order:(d.order&&d.order.length?d.order:order).slice(),round:d.round||'all',distance:d.distance||'all',compareN:Math.max(1,Math.min(20,+(d.compareN||5))),custom:Array.isArray(d.custom)?d.custom:[]}
}
function saveLayout(L){store('scoretool.coach.layout.'+coachId(),L)}

/* ---------- pack a finished round for a one-off link ---------- */
function packRound(s){
 if(!s)return null;
 const date=s.date||today(), round=s.round||'', score=(typeof total==='function'?total(s):0);
 const ends=(s.ends||[]).map(e=>(e||[]).map(a=>a));
 const pos=(s.pos||[]).map(e=>(e||[]).map(p=>p&&typeof p==='object'?{x:+(+p.x||0).toFixed(3),y:+(+p.y||0).toFixed(3),s:p.s,g:p.g}:null));
 const diary=dayDiary(date);
 const an=analyse(ends,pos);
 return {n:archerName(),d:date,r:round,sc:score,ends,pos,diary,an,id:s.id||''}
}
function dayDiary(date){
 const L=(typeof S!=='undefined'&&S&&Array.isArray(S.diary)?S.diary:[]);
 const mine=L.filter(x=>x&&x.date===date);
 if(!mine.length)return null;
 return {date,text:mine.map(x=>x.text||'').filter(Boolean).join('\n')}
}
function compactShare(p){
 if(!p)return p;
 return {n:p.n,d:p.d,r:p.r,sc:p.sc,ends:p.ends,pos:(p.pos||[]).map(e=>(e||[]).map(q=>q&&typeof q==='object'?[+q.x,+q.y]:q)),diary:p.diary,an:p.an,id:p.id||''}
}
function expandShare(p){
 if(!p)return p;
 if(p.pos)p.pos=p.pos.map(e=>(e||[]).map(q=>Array.isArray(q)?{x:+q[0],y:+q[1]}:q));
 return p
}
function encodePayload(o){
 try{return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(o)))))}catch(e){return ''}
}
function decodePayload(h){
 try{return expandShare(JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(h))))))}catch(e){try{return expandShare(JSON.parse(decodeURIComponent(escape(atob(h)))))}catch(e2){return null}}
}
function shareUrl(s){
 const p=compactShare(packRound(s));if(!p)return '';
 const tok=uid('sh');
 const bag=shares();bag[tok]=expandShare(JSON.parse(JSON.stringify(p)));store(K.shares,bag);
 const enc=encodePayload(p);
 /* Keep the data in the link so another phone can open it with no account. */
 return appBase().split('#')[0]+'#coachshare='+enc
}
function loadShare(raw){
 if(!raw)return null;
 const bag=shares();
 if(bag&&bag[raw])return expandShare(bag[raw]);
 return decodePayload(raw)
}

/* ---------- analysis (group, ends, heatmap, averages) ---------- */
function flattenPos(pos){
 const out=[];(pos||[]).forEach((e,ei)=>(e||[]).forEach((p,ai)=>{if(p&&Number.isFinite(+p.x)&&Number.isFinite(+p.y))out.push({x:+p.x,y:+p.y,e:ei,i:ai})}));
 return out
}
function flattenEnds(ends){return (ends||[]).flat()}
function valOf(a){if(typeof val==='function')return val(a);if(a==='X'||a==='x')return 10;if(a==='M'||a==='m')return 0;const n=+a;return Number.isFinite(n)?n:0}
function analyse(ends,pos){
 const arrows=flattenEnds(ends), pts=flattenPos(pos), n=arrows.length;
 const sum=arrows.reduce((t,a)=>t+valOf(a),0);
 const endSums=(ends||[]).map(e=>(e||[]).reduce((t,a)=>t+valOf(a),0));
 const third=Math.max(1,Math.floor(endSums.length/3));
 const avg=v=>v.length?(v.reduce((a,b)=>a+b,0)/v.length):0;
 const first=avg(endSums.slice(0,third)), last=avg(endSums.slice(-third));
 let cx=0,cy=0,r=0;
 if(pts.length){cx=pts.reduce((t,p)=>t+p.x,0)/pts.length;cy=pts.reduce((t,p)=>t+p.y,0)/pts.length;r=Math.sqrt(pts.reduce((t,p)=>t+(p.x-cx)**2+(p.y-cy)**2,0)/pts.length)}
 const rings={};
 arrows.forEach(a=>{const k=String(a==null?'':a);rings[k]=(rings[k]||0)+1});
 return {n,sum,endSums,first,last,cx,cy,r,rings,avgEnd:avg(endSums)}
}
function ringColour(v){
 if(v==='X'||v>=9)return '#ffc629';
 if(v>=7)return '#d62828';
 if(v>=5)return ROYAL;
 if(v>=3)return '#111';
 return '#e8eef6'
}
function plotSVG(pos,an){
 const pts=flattenPos(pos), W=280,cx=W/2,cy=W/2,R=W/2-8;
 let g=`<svg class="ch-plot" viewBox="0 0 ${W} ${W}" width="100%" role="img" aria-label="Arrow group plot">`;
 [[1,'#f8fafc'],[0.8,'#1d4ed8'],[0.6,'#d62828'],[0.4,'#ffc629'],[0.2,'#ffc629']].forEach(([f,c],i)=>{
  g+=`<circle cx="${cx}" cy="${cy}" r="${R*f}" fill="${i===0?'#f8fafc':(f<=0.4?'#ffc629':c)}" stroke="#243042" stroke-width="1.2" fill-opacity="${f<=0.4?1:0}"/>`;
 });
 g+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#243042"/>`;
 pts.forEach((p,i)=>{
  const x=cx+p.x*R,y=cy-p.y*R;
  g+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${NEON}" stroke="${ROYAL}" stroke-width="1.5"/>`;
 });
 if(pts.length){const gx=cx+(an&&an.cx||0)*R,gy=cy-(an&&an.cy||0)*R;g+=`<circle cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="3" fill="${ROYAL}"/>`}
 g+='</svg>';
 return g
}
function endsChart(endSums){
 const L=endSums||[];if(!L.length)return '<p class="small muted">No ends yet.</p>';
 const mx=Math.max(1,...L);
 let rows=L.map((v,i)=>`<div class="ch-end"><span>End ${i+1}</span><div class="ch-bar"><i style="width:${(100*v/mx).toFixed(1)}%;background:${ROYAL}"></i></div><b>${v}</b></div>`).join('');
 return `<div class="ch-ends">${rows}</div>`
}
function heatChart(rings){
 const order=['X','10','9','8','7','6','5','4','3','2','1','M'];
 const r=rings||{};
 const n=order.reduce((t,k)=>t+(r[k]||0),0)||1;
 return `<div class="ch-heat">${order.map(k=>{const c=r[k]||0;return `<div><b>${esc(k)}</b><span>${c}</span><i style="background:${ROYAL};opacity:${0.2+0.8*(c/n)}"></i></div>`}).join('')}</div>`
}
function avgsCard(an,label){
 if(!an)return '';
 return `<div class="stats" style="grid-template-columns:1fr 1fr 1fr"><div class="stat"><b>${an.sum||0}</b>score</div><div class="stat"><b>${(an.avgEnd||0).toFixed(1)}</b>end avg</div><div class="stat"><b>${an.n||0}</b>arrows</div></div>
 <p class="small muted" style="margin:8px 0 0">${esc(label||'')} First ${pl(an.first)} · last ${pl(an.last)} · group radius ${(an.r||0).toFixed(2)}</p>`
}
function pl(v){return v==null?'—':Number(v).toFixed(1)}

/* ---------- feed of an archer (for the coach) ---------- */
function packFeed(){
 if(typeof S==='undefined'||!S)return {name:archerName(),rounds:[],diary:[],updated:Date.now()};
 const rounds=(S.sessions||[]).filter(s=>s&&(s.finished||(typeof isDone==='function'&&isDone(s)))).map(s=>({
  id:s.id,date:s.date,round:s.round,score:(typeof total==='function'?total(s):0),
  ends:(s.ends||[]).map(e=>(e||[]).slice()),
  pos:(s.pos||[]).map(e=>(e||[]).map(p=>p&&{x:p.x,y:p.y,s:p.s,g:p.g})),
  dist:s.dist||s.peg||''
 }));
 const diary=(S.diary||[]).map(x=>({id:x.id,date:x.date,text:x.text||''}));
 return {name:archerName(),id:archerId(),rounds,diary,updated:Date.now()}
}
function pushFeed(){
 const L=links().filter(x=>x.status==='active'&&x.archerId===archerId());
 if(!L.length&&!demoOn())return;
 store('scoretool.coach.feed.'+archerId(),packFeed());
}
function feedOf(aid){return load('scoretool.coach.feed.'+aid,null)}
function activeArchers(){
 return links().filter(x=>x.status==='active'&&x.coachId===coachId()).map(x=>{
  const f=feedOf(x.archerId)||{name:x.archerName,rounds:[],diary:[],updated:0};
  const last=f.rounds&&f.rounds.length?f.rounds[f.rounds.length-1]:null;
  const scores=(f.rounds||[]).map(r=>r.score);
  const avg=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0;
  const trend=scores.length>=2?scores[scores.length-1]-scores[scores.length-2]:0;
  const seen=load('scoretool.coach.seen.'+coachId(),{})||{};
  const isNew=!!(f.updated&&f.updated>(seen[x.archerId]||0));
  return {...x,feed:f,last,avg,trend,isNew}
 })
}
function markSeen(aid){
 const seen=load('scoretool.coach.seen.'+coachId(),{})||{};seen[aid]=Date.now();store('scoretool.coach.seen.'+coachId(),seen)
}

/* ---------- routes ---------- */
function isCoachHash(){
 const h=location.hash||'';
 return h.startsWith('#coachshare=')||h.startsWith('#coachcode=')||h==='#coach'||h.startsWith('#coach?')||h==='#coachdesk'||h.startsWith('#coacher=')
}
function coachRoute(){
 try{if(bootDemo())return true}catch(e){}
 const q=new URLSearchParams(location.search);
 if(q.get('coachjoin')){claimFromQuery(q.get('coachjoin'));return true}
 if(!isCoachHash())return false;
 const h=location.hash||'';
 if(h.startsWith('#coachshare=')){renderShareView(h.slice(12));return true}
 if(h.startsWith('#coachcode=')){renderCodeLink(decodeURIComponent(h.slice(11)));return true}
 if(h.startsWith('#coacher=')){renderCoachArcher(decodeURIComponent(h.slice(9)));return true}
 renderCoachDesk();return true
}
window.coachRoute=coachRoute;

function claimFromQuery(code){
 const u=new URL(location.href);
 ['coachjoin','error','error_code','error_description'].forEach(k=>u.searchParams.delete(k));
 history.replaceState(null,'',u.pathname+u.search+'#coachcode='+encodeURIComponent(code));
 renderCodeLink(code);
}

/* ---------- one-off share view ---------- */
function renderShareView(raw){
 const D=loadShare(raw);
 const tabs=document.getElementById('tabs');if(tabs)tabs.hidden=true;
 if(!D||!D.n){app.innerHTML='<div class="card" id="coachshare"><span class="kicker">Coach share</span><h1>This link is invalid</h1><p>Ask the archer to send a new one.</p></div>';return}
 const an=D.an||analyse(D.ends,D.pos);
 app.innerHTML=`${demoBanner()}<div class="card dark" id="coachshare"><span class="kicker">One-off share · no account needed</span><h1>${esc(D.n)}</h1>
 <p class="small">${esc(D.r||'')} · ${esc(D.d||'')} · <b>${D.sc||0}</b></p></div>
 <div class="card"><span class="kicker">Scores</span><h2>The card</h2>${scoreTable(D.ends)}</div>
 <div class="card"><span class="kicker">Plots</span><h2>Group</h2>${plotSVG(D.pos,an)}</div>
 <div class="card"><span class="kicker">Analysis</span><h2>How it went</h2>${avgsCard(an,D.r||'')} ${endsChart(an.endSums)} ${heatChart(an.rings)}</div>
 <div class="card"><span class="kicker">Diary</span><h2>That day's diary</h2>${D.diary&&D.diary.text?`<p>${esc(D.diary.text)}</p>`:'<p class="small muted">No diary entry for this day.</p>'}</div>
 <a class="btn full" href="${esc(location.pathname)}">Open my own ScoreTool</a>`;
}
function scoreTable(ends){
 if(!ends||!ends.length)return '<p class="small muted">No arrows.</p>';
 return `<table class="ends"><thead><tr><th>End</th><th>Arrows</th><th>Tot</th></tr></thead><tbody>${ends.map((e,i)=>`<tr><td>${i+1}</td><td>${(e||[]).map(a=>esc(a)).join(' ')}</td><td>${(e||[]).reduce((t,a)=>t+valOf(a),0)}</td></tr>`).join('')}</tbody></table>`
}

/* ---------- archer: share + add a coach ---------- */
function lockHTML(what){
 return `<div class="card" id="coachlock"><span class="kicker">Coach</span><h2>Available on Plus</h2>
 <p>${esc(what)} is on Plus and Pro. League scoring stays free.</p>
 <button class="btn alt full" type="button" data-plans="1">See plans</button></div>`
}
function coachArcherCard(){
 if(role()==='coach'&&meCoach()){
  return `<div class="card" id="coachdeskcard"><span class="kicker">Coach</span><h2>Your archers</h2>
   <p class="small muted">Open your Archers list to follow scores, plots, analysis and diary, and to leave notes.</p>
   <button class="btn alt full" id="chdesk" type="button">Open Archers list</button></div>`
 }
 const L=links().filter(x=>x.archerId===archerId()&&x.status!=='removed');
 const active=L.filter(x=>x.status==='active');
 const pending=L.filter(x=>x.status==='pending');
 if(!canShare())return `<div class="card" id="coachcard">${lockHTML('Sharing with a coach').replace('<div class="card" id="coachlock">','').replace('</div>','')}</div>`;
 return `<div class="card" id="coachcard"><span class="kicker">Coach</span><h2>My coach</h2>
  ${active.length?active.map(c=>`<div class="list-item row"><span><b>${esc(c.coachName||c.coachEmail||'Coach')}</b><br><span class="small muted">Linked ${esc(c.claimedAt||c.created||'')}</span></span>
   <button class="btn ghost" data-chrm="${esc(c.code)}" style="padding:6px 12px;min-height:36px">Remove</button></div>`).join(''):'<p class="small muted" id="nocoach">No coach yet.</p>'}
  ${pending.length?`<p class="small">Waiting for the coach to open this code: <b id="chcode">${esc(pending[0].code)}</b></p>`:''}
  <button class="btn alt full" id="chadd" type="button" style="margin-top:8px">Add my coach</button>
  <h3 style="margin-top:14px">Share a round</h3>
  ${finishedRounds().length?finishedRounds().map(s=>`<div class="list-item row"><span>${esc(s.round||'')} · ${esc(s.date||'')}</span>
    <button class="btn ghost" data-chsh="${esc(s.id)}" type="button" style="padding:6px 12px;min-height:36px">Share with a coach</button></div>`).join(''):'<p class="small muted">Finish a round, then share it here.</p>'}
  <p class="small muted" style="margin:8px 0 0">They will see your scores, plots, analysis and diary. You can remove them at any time.</p>
 </div>`
}
window.coachArcherCard=coachArcherCard;

window.bindArcherCard=bindArcherCard;
function bindArcherCard(){
 const add=$('#chadd');if(add)add.onclick=()=>startAddCoach();
 const desk=$('#chdesk');if(desk)desk.onclick=()=>{setHash('#coach');renderCoachDesk()};
 app.querySelectorAll('[data-chrm]').forEach(b=>b.onclick=()=>removeCoach(b.dataset.chrm));
 app.querySelectorAll('[data-chsh]').forEach(b=>b.onclick=()=>{const s=finishedRounds().find(x=>String(x.id)===String(b.dataset.chsh));if(s&&window.coachShareRound)coachShareRound(s)});
}
function startAddCoach(){
 if(!canShare()){nav('plans');return}
 let L=links();
 let row=L.find(x=>x.archerId===archerId()&&x.status==='pending');
 if(!row){
  row={code:shortCode(),archerId:archerId(),archerName:archerName(),coachId:null,coachName:'',coachEmail:'',status:'pending',created:today(),claimedAt:''};
  L.push(row);saveLinks(L);pushFeed();
 }
 const url=appBase().split('#')[0]+'#coachcode='+encodeURIComponent(row.code);
 app.innerHTML=`${demoBanner()}<div class="card" id="chaddcard"><span class="kicker">Add my coach</span><h2>Send this code</h2>
  <p>Share the code or the link. The first time your coach opens it they sign in once (ScoreTool and Archery Calendar together), then see how to add it to their home screen. After that, each new archer goes straight into their Archers list.</p>
  <p class="ch-code" id="chcodeshow">${esc(row.code)}</p>
  <input readonly value="${esc(url)}" id="chlink" aria-label="Coach code link">
  <div class="row" style="gap:8px;margin-top:8px"><button class="btn alt" id="chcp" type="button">Copy link</button>
  <button class="btn ghost" id="chback" type="button">Back</button></div></div>`;
 const tabs=document.getElementById('tabs');if(tabs)tabs.hidden=false;
 $('#chcp').onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(url);$('#chcp').textContent='Copied ✓'};
 $('#chback').onclick=()=>{if(typeof nav==='function')nav('lab_coach');else renderCoachArcherHome()};
}
function removeCoach(code){
 const L=links();const i=L.findIndex(x=>x.code===code&&x.archerId===archerId());
 if(i<0)return;
 if(!confirm('Remove this coach? They will stop seeing your scores straight away.'))return;
 L[i].status='removed';L[i].removedAt=today();saveLinks(L);
 if(typeof nav==='function')nav('lab_coach');else renderCoachArcherHome();
}

window.coachShareRound=function(s){
 if(!s)return;
 if(!canShare()){if(typeof nav==='function')nav('plans');return}
 const url=shareUrl(s);
 const tabs=document.getElementById('tabs');if(tabs)tabs.hidden=false;
 app.innerHTML=`${demoBanner()}<div class="card" id="chsharesheet"><span class="kicker">Share with a coach</span><h2>One-off link</h2>
  <p>This link sends the scores, arrow plots, analysis and that day's diary together. The coach can open it without an account.</p>
  <p class="small muted">${esc(s.round||'')} · ${esc(s.date||'')} · ${typeof total==='function'?total(s):''}</p>
  <input readonly value="${esc(url)}" id="chshurl" aria-label="One-off coach share link">
  <div class="row" style="gap:8px;margin-top:8px"><button class="btn alt" id="chshcp" type="button">Copy link</button>
  <a class="btn ghost" id="chshprev" href="${esc(url)}">Preview</a>
  <button class="btn ghost" id="chshback" type="button">Back</button></div></div>`;
 $('#chshcp').onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(url);$('#chshcp').textContent='Copied ✓'};
 $('#chshback').onclick=()=>{if(typeof score==='function'){if(typeof nav==='function')nav('score')}};
};

/* ---------- coach code landing ---------- */
function renderCodeLink(code){
 const tabs=document.getElementById('tabs');if(tabs)tabs.hidden=true;
 const row=links().find(x=>x.code===code);
 if(!row||row.status==='removed'){app.innerHTML=`<div class="card" id="chcodebad"><span class="kicker">Coach code</span><h1>This code is not active</h1><p>The archer may have removed it. Ask them to send a new one.</p></div>`;return}
 const m=meCoach();
 const first=!m||!m.signedIn||!m.homescreen;
 if(first){renderFirstJoin(row);return}
 claimArcher(row);
 renderCoachDesk();
}
function renderFirstJoin(row){
 const demo=demoOn();
 app.innerHTML=`${demoBanner()}<div class="card" id="chjoin"><span class="kicker">Coach sign-up</span><h1>One sign-up for ScoreTool and Archery Calendar</h1>
  <p>${esc(row.archerName||'An archer')} sent you a coach code. Sign in once. That same sign-in works on ScoreTool and on Archery Calendar (${esc(CAL.replace(/^https:\/\//,'').replace(/\/$/,''))}).</p>
  ${demo?`<button class="btn alt full" id="chdemoin" type="button">Continue as demo coach</button>`:
  `<button class="btn alt full" id="chgoauth" type="button">Continue with Google</button>
   <p class="small muted" id="chjoinmsg">Apple sign-in is added once Apple activates the developer account.</p>`}
 </div>`;
 const go=$('#chdemoin');if(go)go.onclick=()=>{finishFirstJoin(row,{id:'demo-coach',email:'',name:'Demo coach',signedIn:true,homescreen:false,demo:true})};
 const g=$('#chgoauth');if(g)g.onclick=()=>startCoachOAuth(row.code);
}
function startCoachOAuth(code){
 const msg=$('#chjoinmsg');
 try{
  fetch(SB+'/auth/v1/settings',{headers:{apikey:KEY_PUB}}).then(r=>r.json()).then(j=>{
   if(!j||!j.external||j.external.google!==true){if(msg)msg.textContent='Google sign-in isn’t available yet.';return}
   const back=location.origin+location.pathname+'?coachjoin='+encodeURIComponent(code);
   location.href=SB+'/auth/v1/authorize?provider=google&redirect_to='+encodeURIComponent(back);
  }).catch(()=>{if(msg)msg.textContent='Try again.'});
 }catch(e){if(msg)msg.textContent='Try again.'}
}
function finishFirstJoin(row,me){
 setMeCoach(me);setRole('coach');
 renderHomeHowTo(row);
}
function renderHomeHowTo(row){
 app.innerHTML=`${demoBanner()}<div class="card" id="chhomehow"><span class="kicker">Add to Home Screen</span><h1>Keep ScoreTool on your phone</h1>
  <p>Add ScoreTool to your home screen so your Archers list is one tap away.</p>
  <ol class="ch-steps">
   <li>Tap the <b>Share</b> button at the bottom of Safari (the square with the arrow).</li>
   <li>Scroll and tap <b>Add to Home Screen</b>.</li>
   <li>Tap <b>Add</b>. The ScoreTool icon then sits on your home screen.</li>
  </ol>
  <p class="small muted">On Android: open the browser menu and tap Add to Home screen.</p>
  <p>Archery Calendar uses the same sign-in. You can add that app the same way at <a href="${CAL}" target="_blank" rel="noopener">archerycalendars.com</a>.</p>
  <button class="btn alt full" id="chhomedone" type="button">I've added it, show my Archers</button>
 </div>`;
 $('#chhomedone').onclick=()=>{
  const m=meCoach()||{};m.homescreen=true;m.signedIn=true;setMeCoach(m);
  claimArcher(row);setHash('#coach');renderCoachDesk();
 };
}
function claimArcher(row){
 const m=meCoach()||{};
 const L=links();
 const i=L.findIndex(x=>x.code===row.code);
 if(i<0)return;
 if(L[i].status==='removed')return;
 L[i].status='active';
 L[i].coachId=m.id||coachId();
 L[i].coachName=m.name||'Coach';
 L[i].coachEmail=m.email||'';
 L[i].claimedAt=today();
 saveLinks(L);
 /* If the archer's feed is not on this phone, keep the name so the list still shows. */
 if(!feedOf(L[i].archerId))store('scoretool.coach.feed.'+L[i].archerId(),{name:L[i].archerName,id:L[i].archerId,rounds:[],diary:[],updated:Date.now(),pending:true});
}

/* ---------- coach desk ---------- */
function renderCoachDesk(){
 const tabs=document.getElementById('tabs');if(tabs)tabs.hidden=false;
 const m=meCoach();
 if(!m||!m.signedIn){app.innerHTML=`${demoBanner()}<div class="card" id="chdeskneed"><span class="kicker">Coach</span><h2>Sign in to see your archers</h2><p>Open a coach code from an archer to create your coach account.</p></div>`;return}
 const A=activeArchers();
 window._chView='desk';
 app.innerHTML=`${demoBanner()}<div class="card dark" id="chdesk"><span class="kicker">Coach</span><h1>Archers</h1>
  <p class="small">Every archer who sent you a code. You see their scores, plots, analysis and diary. They can't hide the diary.</p></div>
 ${A.length?A.map(a=>`<div class="card list-item" data-cha="${esc(a.archerId)}" id="cha-${esc(a.archerId)}" style="cursor:pointer">
   <div class="row" style="justify-content:space-between;align-items:center"><span><b>${esc((a.feed&&a.feed.name)||a.archerName||'Archer')}</b>
    ${a.isNew?'<span class="ch-new">New</span>':''}<br>
    <span class="small muted">${a.last?`${esc(a.last.round)} · ${esc(a.last.date)} · ${a.last.score}`:'No rounds yet'}</span></span>
    <span class="stat" style="min-width:72px"><b>${a.avg?a.avg.toFixed(0):'—'}</b><span class="small muted">${trendLabel(a.trend)}</span></span>
   </div></div>`).join(''):'<div class="card"><p class="small muted" id="chaempty">No archers yet. When an archer sends you a code, they show up here.</p></div>'}
 <div class="card"><button class="btn ghost full" id="chswitch" type="button">Back to my own ScoreTool</button></div>`;
 app.querySelectorAll('[data-cha]').forEach(b=>b.onclick=()=>{setHash('#coacher='+encodeURIComponent(b.dataset.cha));renderCoachArcher(b.dataset.cha)});
 const sw=$('#chswitch');if(sw)sw.onclick=()=>{setRole('archer');setHash('');if(typeof nav==='function')nav('home')};
}
function trendLabel(t){if(!t)return 'even';return t>0?('up '+Math.round(t)):'down '+Math.round(Math.abs(t))}

function filterRounds(rounds,L){
 let R=(rounds||[]).slice();
 if(L.round&&L.round!=='all')R=R.filter(r=>r.round===L.round);
 if(L.distance&&L.distance!=='all')R=R.filter(r=>String(r.dist||'')===String(L.distance));
 const n=L.compareN||5;
 return R.slice(-n)
}
function renderCoachArcher(aid){
 window._chArcher=aid;
 const row=activeArchers().find(x=>x.archerId===aid);
 const tabs=document.getElementById('tabs');if(tabs)tabs.hidden=false;
 if(!row){app.innerHTML=`${demoBanner()}<div class="card"><h2>That archer is not in your list</h2><button class="btn ghost" id="chbackd" type="button">Back to Archers</button></div>`;const b=$('#chbackd');if(b)b.onclick=()=>{setHash('#coach');renderCoachDesk()};return}
 markSeen(aid);
 const L=layoutOf();
 const rounds=filterRounds(row.feed.rounds||[],L);
 const pick=window._chRound||(rounds[rounds.length-1]&&rounds[rounds.length-1].id)||'';
 const ses=rounds.find(r=>r.id===pick)||rounds[rounds.length-1];
 const allRounds=[...new Set((row.feed.rounds||[]).map(r=>r.round).filter(Boolean))];
 const dists=[...new Set((row.feed.rounds||[]).map(r=>r.dist).filter(Boolean))];
 const an=ses?analyse(ses.ends,ses.pos):null;
 const name=(row.feed&&row.feed.name)||row.archerName||'Archer';
 const chartHtml=drawLayout(L,ses,an,row,rounds);
 const diary=(row.feed.diary||[]).slice().sort((a,b)=>a.date<b.date?1:-1);
 app.innerHTML=`${demoBanner()}<div class="card dark" id="charcher"><button class="btn ghost labback" id="chbackd" type="button">‹ Archers</button>
  <span class="kicker">Coach view</span><h1>${esc(name)}</h1>
  <p class="small muted">You see everything they record, including the diary. They can't hide it. Your layout never changes their screen.</p></div>
 <div class="card" id="chfilters"><span class="kicker">Layout</span>
  <label for="chrd">Round</label><select id="chrd"><option value="all">All rounds</option>${allRounds.map(r=>`<option value="${esc(r)}" ${L.round===r?'selected':''}>${esc(r)}</option>`).join('')}</select>
  <label for="chdi">Distance</label><select id="chdi"><option value="all">All distances</option>${dists.map(r=>`<option value="${esc(r)}" ${String(L.distance)===String(r)?'selected':''}>${esc(r)}</option>`).join('')}</select>
  <label for="chn">How many rounds</label><input id="chn" type="number" min="1" max="20" value="${L.compareN}">
  <div class="ch-tog" id="chtogs">${CHARTS.map(c=>`<label><input type="checkbox" data-chtog="${c.id}" ${L.on[c.id]?'checked':''}> ${esc(c.label)}</label>`).join('')}</div>
  <p class="small muted">Drag the order buttons to move a chart up or down. These defaults are saved for you only.</p>
  <div id="chorder">${L.order.map((id,i)=>`<div class="row" style="gap:6px;align-items:center;margin:4px 0"><b>${esc((CHARTS.find(c=>c.id===id)||{}).label||id)}</b>
    <button class="btn ghost" data-chup="${i}" type="button" ${i===0?'disabled':''}>Up</button>
    <button class="btn ghost" data-chdn="${i}" type="button" ${i===L.order.length-1?'disabled':''}>Down</button></div>`).join('')}</div>
 </div>
 <div class="card"><span class="kicker">Round</span><label for="chpick">Open a round</label>
  <select id="chpick">${rounds.map(r=>`<option value="${esc(r.id)}" ${r.id===pick?'selected':''}>${esc(r.date)} · ${esc(r.round)} · ${r.score}</option>`).join('')||'<option>No rounds yet</option>'}</select></div>
 ${chartHtml}
 <div class="card" id="chcustom"><span class="kicker">Custom charts</span><h2>Build your own</h2>
  ${ (L.custom||[]).map((c,i)=>`<div class="list-item"><b>${esc(c.name||'Chart')}</b><div class="small muted">${esc(c.metric)} by ${esc(c.group)}</div>${customDraw(c,row.feed.rounds||[])}
   <button class="btn ghost" data-chcudel="${i}" type="button">Remove</button></div>`).join('') }
  <label for="chcuname">Name</label><input id="chcuname" placeholder="e.g. 50m average">
  <label for="chcumet">What to plot</label><select id="chcumet"><option value="score">Score</option><option value="avgEnd">End average</option><option value="group">Group radius</option></select>
  <label for="chcugrp">Group by</label><select id="chcugrp"><option value="round">Each round</option><option value="date">Date</option><option value="distance">Distance</option></select>
  <button class="btn ghost" id="chcuadd" type="button" style="margin-top:8px">Add chart</button>
 </div>
 <div class="card" id="chcompare"><span class="kicker">Compare</span><h2>Side by side</h2>
  <label for="chcA">Left</label><select id="chcA">${compareOptions(row,Aother())}</select>
  <label for="chcB">Right</label><select id="chcB">${compareOptions(row,Aother())}</select>
  <button class="btn alt" id="chcrun" type="button" style="margin-top:8px">Compare</button>
  <div id="chcbox"></div>
 </div>
 <div class="card" id="chnotes"><span class="kicker">Coach notes</span><h2>Pin a note</h2>
  ${ses?noteForm('round',ses.id,name):'<p class="small muted">Open a round to pin a note on it.</p>'}
  ${ses&&ses.ends&&ses.ends.length?`<label for="chend">Or on an end</label><select id="chend">${ses.ends.map((_,i)=>`<option value="${i}">End ${i+1}</option>`).join('')}</select>
   <button class="btn ghost" id="chnend" type="button">Note this end</button>`:''}
 </div>
 <div class="card" id="chdiary"><span class="kicker">Diary</span><h2>${esc(name)}'s diary</h2>
  <p class="small muted">The coach sees everything. There is no way for the archer to hide the diary.</p>
  ${diary.length?diary.map(d=>`<div class="list-item" id="chd-${esc(d.id||d.date)}"><div class="small muted">${esc(d.date)}</div><div>${esc(d.text||'')}</div>
    <button class="btn ghost" data-chndiary="${esc(d.id||d.date)}" type="button" style="margin-top:6px">Note this entry</button>
    ${notesFor('diary',d.id||d.date).map(noteHTML).join('')}
   </div>`).join(''):'<p class="small muted">No diary entries yet.</p>'}
 </div>
 ${ses?`<div class="card"><h3>Notes on this round</h3>${notesFor('round',ses.id).map(noteHTML).join('')||'<p class="small muted">None yet.</p>'}</div>`:''}`;
 const back=$('#chbackd');if(back)back.onclick=()=>{setHash('#coach');renderCoachDesk()};
 bindLayout(aid,L);
 const pickEl=$('#chpick');if(pickEl)pickEl.onchange=()=>{window._chRound=pickEl.value;renderCoachArcher(aid)};
 const cu=$('#chcuadd');if(cu)cu.onclick=()=>{
  const name=$('#chcuname').value.trim()||'Custom chart';
  L.custom=L.custom||[];L.custom.push({name,metric:$('#chcumet').value,group:$('#chcugrp').value});saveLayout(L);renderCoachArcher(aid);
 };
 app.querySelectorAll('[data-chcudel]').forEach(b=>b.onclick=()=>{L.custom.splice(+b.dataset.chcudel,1);saveLayout(L);renderCoachArcher(aid)});
 const run=$('#chcrun');if(run)run.onclick=()=>runCompare();
 const nf=$('#chnsave');if(nf)nf.onclick=()=>saveNoteFromForm('round',ses&&ses.id);
 const ne=$('#chnend');if(ne)ne.onclick=()=>saveNoteFromForm('end',(ses&&ses.id)+':'+($('#chend')?$('#chend').value:'0'));
 app.querySelectorAll('[data-chndiary]').forEach(b=>b.onclick=()=>{window._chNoteTarget={kind:'diary',id:b.dataset.chndiary};paintInlineNote(b)});
 bindNoteReplies();
}
function Aother(){return activeArchers()}
function compareOptions(row,others){
 const list=[];
 (row.feed.rounds||[]).forEach(r=>list.push({v:'r:'+row.archerId+':'+r.id,l:`${row.feed.name||row.archerName} · ${r.date} · ${r.round} · ${r.score}`}));
 others.filter(o=>o.archerId!==row.archerId).forEach(o=>{
  const last=(o.feed.rounds||[])[(o.feed.rounds||[]).length-1];
  if(last)list.push({v:'r:'+o.archerId+':'+last.id,l:`${o.feed.name||o.archerName} · ${last.date} · ${last.round} · ${last.score}`});
 });
 return list.map((x,i)=>`<option value="${esc(x.v)}" ${i===1?'selected':''}>${esc(x.l)}</option>`).join('')
}
function findCompare(val){
 const p=String(val||'').split(':');
 if(p[0]!=='r')return null;
 const a=activeArchers().find(x=>x.archerId===p[1]);if(!a)return null;
 const r=(a.feed.rounds||[]).find(x=>x.id===p.slice(2).join(':'));if(!r)return null;
 return {name:(a.feed.name||a.archerName),round:r}
}
function runCompare(){
 const A=findCompare($('#chcA')&&$('#chcA').value),B=findCompare($('#chcB')&&$('#chcB').value);
 const box=$('#chcbox');if(!box)return;
 if(!A||!B){box.innerHTML='<p class="small muted">Pick two rounds or two archers.</p>';return}
 const aA=analyse(A.round.ends,A.round.pos),aB=analyse(B.round.ends,B.round.pos);
 box.innerHTML=`<div class="ch-cmp" id="chcmpout"><div><h3>${esc(A.name)}</h3><p class="small muted">${esc(A.round.date)} · ${esc(A.round.round)}</p>${avgsCard(aA,A.round.round)}${plotSVG(A.round.pos,aA)}</div>
  <div><h3>${esc(B.name)}</h3><p class="small muted">${esc(B.round.date)} · ${esc(B.round.round)}</p>${avgsCard(aB,B.round.round)}${plotSVG(B.round.pos,aB)}</div></div>`;
}
function drawLayout(L,ses,an,row,rounds){
 const bits=[];
 (L.order||[]).forEach(id=>{
  if(!L.on[id])return;
  if(!ses){bits.push(`<div class="card"><span class="kicker">${esc((CHARTS.find(c=>c.id===id)||{}).label||id)}</span><p class="small muted">No rounds in this filter.</p></div>`);return}
  if(id==='group')bits.push(`<div class="card" id="chc-group"><span class="kicker">Group plot</span>${plotSVG(ses.pos,an)}</div>`);
  if(id==='ends')bits.push(`<div class="card" id="chc-ends"><span class="kicker">End by end</span>${endsChart(an&&an.endSums)}</div>`);
  if(id==='heat')bits.push(`<div class="card" id="chc-heat"><span class="kicker">Heatmap</span>${heatChart(an&&an.rings)}</div>`);
  if(id==='avgs')bits.push(`<div class="card" id="chc-avgs"><span class="kicker">Averages</span>${avgsCard(an,ses.round||'')}</div>`);
 });
 return bits.join('')
}
function customDraw(c,rounds){
 const groups={};
 (rounds||[]).forEach(r=>{
  const an=analyse(r.ends,r.pos);
  const key=c.group==='date'?r.date:c.group==='distance'?(r.dist||'—'):r.round;
  const v=c.metric==='avgEnd'?an.avgEnd:c.metric==='group'?an.r:r.score;
  (groups[key]=groups[key]||[]).push(v);
 });
 const rows=Object.keys(groups).map(k=>{const L=groups[k],avg=L.reduce((a,b)=>a+b,0)/L.length;return {k,avg}});
 if(!rows.length)return '<p class="small muted">No data yet.</p>';
 const mx=Math.max(1,...rows.map(r=>r.avg));
 return `<div class="ch-ends">${rows.map(r=>`<div class="ch-end"><span>${esc(r.k)}</span><div class="ch-bar"><i style="width:${(100*r.avg/mx).toFixed(1)}%;background:${BLUE}"></i></div><b>${r.avg.toFixed(1)}</b></div>`).join('')}</div>`
}
function bindLayout(aid,L){
 const rd=$('#chrd'),di=$('#chdi'),n=$('#chn');
 const save=()=>{L.round=rd?rd.value:'all';L.distance=di?di.value:'all';L.compareN=n?+(n.value||5):5;saveLayout(L);renderCoachArcher(aid)};
 if(rd)rd.onchange=save;if(di)di.onchange=save;if(n)n.onchange=save;
 app.querySelectorAll('[data-chtog]').forEach(cb=>cb.onchange=()=>{L.on[cb.dataset.chtog]=cb.checked;saveLayout(L);renderCoachArcher(aid)});
 app.querySelectorAll('[data-chup]').forEach(b=>b.onclick=()=>{const i=+b.dataset.chup;if(i>0){[L.order[i-1],L.order[i]]=[L.order[i],L.order[i-1]];saveLayout(L);renderCoachArcher(aid)}});
 app.querySelectorAll('[data-chdn]').forEach(b=>b.onclick=()=>{const i=+b.dataset.chdn;if(i<L.order.length-1){[L.order[i+1],L.order[i]]=[L.order[i],L.order[i+1]];saveLayout(L);renderCoachArcher(aid)}});
}

/* ---------- notes ---------- */
function notesFor(kind,id){return notes().filter(n=>n.kind===kind&&String(n.target)===String(id)&&n.status!=='removed')}
function noteHTML(n){
 const typ=NOTE_TYPES.find(t=>t.id===n.type)||{label:n.type};
 return `<div class="list-item ch-note" data-chnid="${esc(n.id)}"><div class="small muted">${esc(typ.label)} · ${esc(n.at||'')}</div>
  <div>${esc(n.body||'')}</div>
  ${n.type==='tuning'?`<label>What I changed</label><textarea data-chreply="${esc(n.id)}" rows="2" placeholder="The archer logs the change here">${esc(n.reply||'')}</textarea>
    <button class="btn ghost" data-chrsave="${esc(n.id)}" type="button">Save change</button>`:''}
  ${n.type==='drill'?`<label class="small" style="display:flex;gap:6px;align-items:center;margin-top:6px"><input type="checkbox" data-chdrill="${esc(n.id)}" ${n.done?'checked':''} style="width:auto;margin:0"> Drill done</label>`:''}
 </div>`
}
function noteForm(kind,id,who){
 return `<div id="chnform"><label for="chntype">Type</label>
  <select id="chntype">${NOTE_TYPES.map(t=>`<option value="${t.id}">${esc(t.label)}</option>`).join('')}</select>
  <p class="small muted" id="chnhint">${esc(NOTE_TYPES[0].hint)}</p>
  <label for="chnbody">Note</label><textarea id="chnbody" rows="3" placeholder="Write a note ${who?'for '+who:''}"></textarea>
  <button class="btn alt" id="chnsave" type="button" style="margin-top:8px">Pin note</button></div>`
}
function saveNoteFromForm(kind,id){
 const body=($('#chnbody')&&$('#chnbody').value||'').trim();
 if(!body||!id)return;
 const type=($('#chntype')&&$('#chntype').value)||'form';
 const L=notes();
 L.push({id:uid('n'),coachId:coachId(),archerId:(window._chArcher||(rowArcher())||(activeArchers()[0]||{}).archerId),kind,target:id,type,body,reply:'',done:false,at:today(),status:'active'});
 saveNotes(L);
 const h=location.hash||'';
 if(h.startsWith('#coacher='))renderCoachArcher(decodeURIComponent(h.slice(9)));
}
function paintInlineNote(btn){
 const t=window._chNoteTarget;if(!t)return;
 const wrap=document.createElement('div');
 wrap.innerHTML=noteForm(t.kind,t.id,'');
 btn.after(wrap);
 const typ=wrap.querySelector('#chntype'),hint=wrap.querySelector('#chnhint'),sv=wrap.querySelector('#chnsave');
 if(typ&&hint)typ.onchange=()=>{const x=NOTE_TYPES.find(z=>z.id===typ.value);if(x)hint.textContent=x.hint};
 if(sv)sv.onclick=()=>saveNoteFromForm(t.kind,t.id);
}
function bindNoteReplies(){
 app.querySelectorAll('[data-chrsave]').forEach(b=>b.onclick=()=>{
  const id=b.dataset.chrsave, ta=app.querySelector(`[data-chreply="${id}"]`);
  const L=notes();const n=L.find(x=>x.id===id);if(!n)return;n.reply=ta?ta.value:'';saveNotes(L);b.textContent='Saved';
 });
 app.querySelectorAll('[data-chdrill]').forEach(cb=>cb.onchange=()=>{
  const L=notes();const n=L.find(x=>x.id===cb.dataset.chdrill);if(!n)return;n.done=cb.checked;saveNotes(L);
 });
 const typ=$('#chntype'),hint=$('#chnhint');
 if(typ&&hint)typ.onchange=()=>{const x=NOTE_TYPES.find(z=>z.id===typ.value);if(x)hint.textContent=x.hint};
}

/* ---------- archer-side notes and drills in diary / score ---------- */
function archerNotes(){return notes().filter(n=>n.archerId===archerId()&&n.status!=='removed')}
function paintDiary(){
 const host=app;if(!host)return;
 const drills=archerNotes().filter(n=>n.type==='drill');
 const other=archerNotes().filter(n=>n.kind==='diary'||n.type==='tuning'||n.type==='form');
 if($('#chdrills'))$('#chdrills').remove();
 if(drills.length){
  const card=document.createElement('div');card.className='card';card.id='chdrills';
  card.innerHTML=`<span class="kicker">Coach drills</span><h2>Tick these off</h2>${drills.map(n=>`<label class="list-item" style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" data-chdrill="${esc(n.id)}" ${n.done?'checked':''} style="width:auto;margin:4px 0 0"> <span><b>${esc(n.body)}</b><div class="small muted">${esc(n.at||'')}</div></span></label>`).join('')}`;
  const timeline=[...host.querySelectorAll('.card')].find(c=>/Your diary|Timeline/i.test(c.textContent||''));
  if(timeline)timeline.parentNode.insertBefore(card,timeline);else host.appendChild(card);
 }
 const notesBox=document.createElement('div');
 const list=other.filter(n=>n.kind==='diary'||n.type==='tuning'||n.type==='form');
 if(list.length){
  notesBox.className='card';notesBox.id='chnotesmine';
  notesBox.innerHTML=`<span class="kicker">Coach notes</span><h2>From your coach</h2>${list.map(noteHTML).join('')}`;
  host.appendChild(notesBox);
 }
 bindNoteReplies();
}
function paintScore(){
 const s=typeof cur!=='undefined'?cur:null;
 if(!s||!s.finished){
  const btn=$('#shcoach');if(btn)return;
 }
 const foot=document.querySelector('.ad-foot');
 if(foot&&!$('#shcoach')){
  const b=document.createElement('button');
  b.className='ad-fin';b.id='shcoach';b.type='button';b.textContent='Share with a coach';
  foot.appendChild(b);b.onclick=()=>{
   const sess=typeof cur!=='undefined'?cur:null;
   if(!canShare()){if(typeof nav==='function')nav('plans');return}
   if(sess&&window.coachShareRound)coachShareRound(sess);
  };
 }
 if(!s||!s.id)return;
 if($('#chnotescore'))$('#chnotescore').remove();
 const list=archerNotes().filter(n=>(n.kind==='round'&&n.target===s.id)||(n.kind==='end'&&String(n.target).startsWith(s.id+':')));
 if(!list.length)return;
 const box=document.createElement('div');box.className='card';box.id='chnotescore';box.style.margin='10px 16px';
 box.innerHTML=`<span class="kicker">Coach notes</span>${list.map(noteHTML).join('')}`;
 const sheet=document.querySelector('.ad-sheet')||app;
 sheet.appendChild(box);bindNoteReplies();
}

/* ---------- archer home (lab_coach) ---------- */
function renderCoachArcherHome(){
 const tabs=document.getElementById('tabs');if(tabs)tabs.hidden=false;
 app.innerHTML=`${demoBanner()}${canShare()?coachArcherCard():lockHTML('Sharing with a coach')}`;
 bindArcherCard();
 const typ=$('#chntype');
}
window.EXTRA_VIEWS=Object.assign(window.EXTRA_VIEWS||{},{
 lab_coach:function(){setRole('archer');renderCoachArcherHome()},
 lab_coachdesk:function(){setRole('coach');setHash('#coach');renderCoachDesk()}
});

/* ---------- demo preview ---------- */
function demoBanner(){
 if(!demoOn())return '';
 return `<div class="card" id="chdemobar" style="background:#1a2a44;color:#fff"><span class="kicker" style="color:${NEON}">Preview</span>
  <p style="margin:0 0 8px">This is a test preview. Nothing here is live. Switch below to try the archer and coach screens on this phone. A one-off share link also works on any phone.</p>
  <div class="row" style="gap:8px"><button class="btn alt" id="chrolea" type="button">Preview as archer</button>
  <button class="btn ghost" id="chrolec" type="button">Preview as coach</button></div></div>`
}
function bindDemoBanner(){
 const a=$('#chrolea');if(a)a.onclick=()=>{setRole('archer');setHash('');if(typeof nav==='function')nav('lab_coach')};
 const c=$('#chrolec');if(c)c.onclick=()=>{const m=meCoach()||{id:'demo-coach',name:'Demo coach',signedIn:true,homescreen:true,demo:true};setMeCoach(m);setRole('coach');setHash('#coach');renderCoachDesk()};
}
function seedDemo(){
 if(load('scoretool.coach.demoseed',false))return;
 const aid='u_coachdemo', name='Preview Archer';
 try{
  const A=load('scoretool.archers',[])||[];
  if(!A.some(x=>x&&x.id===aid)){A.push({id:aid,name,short:'Preview',bow:'Recurve'});store('scoretool.archers',A)}
  localStorage.setItem('scoretool.tester',aid);
  localStorage.setItem('scoretool.names.asked','1');
  localStorage.setItem('scoretool.whatsnew.seen','x');
  localStorage.setItem('scoretool.paid.early',JSON.stringify({ids:[]}));
  store('scoretool.stripe.auth',{access_token:'demo-preview',refresh_token:'',email:'preview-coach@example.com'});
  store('scoretool.stripe.entitlement',{valid:true,server:true,tier:'plus',status:'active',current_period_end:'2099-01-01T00:00:00Z',customer_id:'cus_preview'});
 }catch(e){}
 const d1=today();
 const d0=new Date(Date.now()-864e5).toLocaleDateString('en-CA');
 const r1={id:'s_demo1',date:d0,round:'WA 50/720',finished:true,ends:[[10,9,9,8,10,9],[9,9,8,10,10,8]],pos:[[{x:0.08,y:0.04},{x:-0.1,y:0.06},{x:0.02,y:-0.12},{x:0.2,y:0.1},{x:-0.05,y:-0.02},{x:0.12,y:-0.08}],[{x:0.05,y:0.09},{x:-0.07,y:0.01},{x:0.15,y:-0.1},{x:-0.12,y:0.14},{x:0.01,y:0.02},{x:0.09,y:-0.05}]]};
 const r2={id:'s_demo2',date:d1,round:'WA 50/720',finished:true,ends:[[10,10,9,9,10,8],[10,9,9,9,8,10]],pos:[[{x:0.04,y:0.03},{x:-0.06,y:0.05},{x:0.01,y:-0.07},{x:0.1,y:0.08},{x:-0.03,y:-0.01},{x:0.08,y:-0.04}],[{x:0.02,y:0.05},{x:-0.05,y:0.02},{x:0.09,y:-0.06},{x:-0.08,y:0.09},{x:0.0,y:0.01},{x:0.06,y:-0.03}]]};
 const key='scoretool.v1.'+aid;
 const st=load(key,{profile:name,unlocked:true,sessions:[],best:[],plots:[],diary:[],setup:[],notes:{}});
 st.profile=name;st.unlocked=true;
 if(!st.sessions.some(s=>s&&s.id==='s_demo1'))st.sessions.push(r1);
 if(!st.sessions.some(s=>s&&s.id==='s_demo2'))st.sessions.push(r2);
 if(!st.diary.some(x=>x&&x.id==='d_demo1'))st.diary.push({id:'d_demo1',archer:name,date:d1,text:'Felt steady through the first half. Sight mark at 50 m felt a touch high.'});
 store(key,st);
 const code='STDEMO1';
 let L=links();
 if(!L.some(x=>x.code===code)){
  L.push({code,archerId:aid,archerName:name,coachId:null,coachName:'',coachEmail:'',status:'pending',created:d1,claimedAt:''});
  saveLinks(L);
 }
 store('scoretool.coach.feed.'+aid, {name,id:aid,rounds:[packRound(r1),packRound(r2)].map((p,i)=>({id:i?r2.id:r1.id,date:p.d,round:p.r,score:p.sc,ends:p.ends,pos:p.pos,dist:'50m'})),diary:[{id:'d_demo1',date:d1,text:'Felt steady through the first half. Sight mark at 50 m felt a touch high.'}],updated:Date.now()});
 store('scoretool.coach.demoseed',true);
}
function bootDemo(){
 const q=new URLSearchParams(location.search);
 if(q.get('coachdemo')==='1'){
  try{localStorage.setItem(K.demo,'1')}catch(e){}
  if(!load('scoretool.coach.demoseed',false)){seedDemo();location.reload();return true}
 }
}

/* ---------- hooks ---------- */
function afterMe(){const el=$('#coachcard')||$('#coachdeskcard')||$('#coachlock');if(el)return;const settings=$('#settingscard');const html=coachArcherCard();
 if(!html)return;
 const wrap=document.createElement('div');wrap.innerHTML=html;
 const node=wrap.firstElementChild;if(!node)return;
 const moments=app.querySelector('.card');
 if(settings)settings.parentNode.insertBefore(node,settings);
 else app.appendChild(node);
 bindArcherCard();
}
function afterRender(){
 bindDemoBanner();
 if($('#coachcard')||$('#chaddcard')||$('#chdesk')||$('#coachshare')||$('#chjoin')||$('#chhomehow')||$('#chsharesheet'))bindDemoBanner();
}

function hook(){
 wrap('save',pushFeed);
 wrap('me',()=>{afterMe();bindArcherCard();afterRender()});
 wrap('diary',()=>{paintDiary();afterRender()});
 wrap('score',()=>{paintScore();afterRender()});
 const _render=window.render;
 if(typeof _render==='function'){
  window.render=function(){
   try{bootDemo()}catch(e){}
   const q=new URLSearchParams(location.search);
   if(q.get('coachjoin')||isCoachHash()){try{if(coachRoute())return}catch(e){}}
   const r=_render.apply(this,arguments);
   try{afterMe();bindArcherCard();afterRender()}catch(e){}
   return r;
  };
 }
 addEventListener('hashchange',()=>{if(isCoachHash()||new URLSearchParams(location.search).get('coachjoin')){if(typeof render==='function')render()}});
 /* If the first draw already happened before this script, catch share / code hashes now. */
 if(isCoachHash()||new URLSearchParams(location.search).get('coachjoin')||demoOn()){
  if(typeof render==='function')setTimeout(()=>render(),0);
 }
}
hook();
window.coachPackRound=packRound;
window.coachShareUrl=shareUrl;
window.coachLinks=links;
window.coachNotes=notes;
window.coachLayoutOf=layoutOf;
window.coachDemoOn=demoOn;
window.coachBootDemo=bootDemo;
window.coachSeedDemo=seedDemo;
window.coachActiveArchers=activeArchers;
window.coachAnalyse=analyse;
})();
