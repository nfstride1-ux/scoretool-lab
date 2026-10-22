/* Display names (20 Oct 2026). Each tester picks their own nickname. Testers are all friends, so real names show in personal
   places (sign-in, home, Me, score sheets, coach summary, parent/coach links, suggestions); the NICKNAME is what social and
   competitive views show (head-to-head, match night, squad, league, badges, share images) and the only name on the relay.
   A tester with no name yet shows as 'Tester 1', 'Tester 2'... (position in TESTERS), never the real name.
   Sync (no server): each phone posts {k:'nm',id,n,nt} (id + name + time chosen, nothing else) to the public ntfy.sh topic
   H2H_NS+'-names' and polls it at the head-to-head invite cadence (every 4th 8 s tick, ~32 s, while open). Names are cached
   on the phone. ntfy keeps messages 12 h, so a phone re-posts its own name when its last post is over 6 h old.
   Invites and match state also carry the sender's name (nm, nt), so a match works even if the directory poll lags.
   Uniqueness: checked against the cache when picking, then re-checked on every poll; on a clash the earlier pick keeps the
   name, the later picker is asked to choose another and shows as 'Tester N' on other phones until they do.
   Safety net, social views only (NM_SOCIAL): a tester real name that reaches them is swapped for the nickname. */
const NM_DIR='scoretool.names',NM_SINCE='scoretool.names.since',nmOwnKey=id=>'scoretool.dname.'+id,nmAskKey=id=>'scoretool.dname.asked.'+id,nmPostKey=id=>'scoretool.dname.posted.'+id;
/* Reset point (20 Oct 2026, 06:36 Perth): a browser test posted 'NatheTest' for nathe and match-night invites from it to every
   tester's inbox at 06:33-06:34. Anything older than this (relay posts, cached names, own picks, pending invites) is ignored, so
   it can't show on any phone; the relay copies expire by themselves within 12 hours. */
const NM_RESET=H2H_RESET;
const NM_HINT='Pick a nickname, not your full real name.';
const NM_VARIANTS={phill:['Phil Arthur'],joseph:['Joe Snook'],dana:['Dana Matete'],tahuri:['Tahuri Engelen-Burney','Tahuri Burney','Tahuri Engelen']};
/* small built-in rude list. SUB: blocked anywhere in the name. WORD: blocked as a whole word (so Cassie, Grape, Hitchcock are fine). */
const NM_SUB=['fuck','fuk','fck','shit','cunt','bitch','wank','twat','slut','whore','nigg','faggot','bastard','bollock','asshole','arsehole','penis','vagina','porn','dildo','retard','spastic','motherf','jizz','boner'];
const NM_WORD=['ass','arse','asses','dick','dicks','cock','cocks','tit','tits','piss','rape','sex','sexy','hoe','hoes','nazi','crap','kys','poo','fag','fags','cum','prick','knob','bum'];
const nmClean=s=>String(s==null?'':s).trim().replace(/\s+/g,' ');
const nmFold=s=>String(s).toLowerCase().replace(/0/g,'o').replace(/[1!|]/g,'i').replace(/3/g,'e').replace(/[@4]/g,'a').replace(/[$5]/g,'s').replace(/7/g,'t');
function nmRude(s){const f=nmFold(s),flat=f.replace(/[^a-z]/g,''),squash=flat.replace(/(.)\1+/g,'$1'),toks=f.split(/[^a-z]+/).filter(Boolean);
 /* also treat a lone 1/l as either letter: 'sh1t' and 'shlt' */
 const flatI=flat.replace(/l/g,'i');
 return NM_SUB.some(w=>flat.includes(w)||squash.includes(w)||flatI.includes(w))||toks.some(t=>NM_WORD.includes(t)||NM_WORD.includes(t.replace(/(.)\1+/g,'$1')))||NM_WORD.includes(flat)}
/* surnames (and full names) of every tester: a nickname must not contain them */
const NM_REAL=(()=>{const S1=new Set(),F=[];TESTERS.forEach(t=>{[t.name,t.ad,...(NM_VARIANTS[t.id]||[])].filter(Boolean).forEach(n=>{F.push([t.id,n]);n.split(/\s+/).slice(1).join(' ').split(/[\s-]+/).filter(x=>x.length>2).forEach(x=>S1.add(x.toLowerCase()))})});return{sur:[...S1],full:F}})();
function nmDir(){let D;try{D=JSON.parse(localStorage.getItem(NM_DIR)||'{}')||{}}catch(e){D={}}for(const id in D){const e=D[id];if(!e||(e.u||e.nt||0)<NM_RESET||/^tester\s*\d*$/i.test(String(e.n||'').trim()))delete D[id]}return D}
function nmSaveDir(D){try{localStorage.setItem(NM_DIR,JSON.stringify(D))}catch(e){}}
const nmOwnRaw=id=>{try{const j=JSON.parse(localStorage.getItem(nmOwnKey(id))||'null');return j&&j.n?j:null}catch(e){return null}};
const nmOwn=id=>{const j=nmOwnRaw(id);return j&&(j.nt||0)>=NM_RESET?j:null};
const nmIdx=id=>TESTERS.findIndex(t=>t.id==id);
/* Default nicknames (Nathe, 20 Oct 2026): pre-set on every phone, so no 'Tester N' shows anywhere. A tester can still pick their
   own in Me; a real pick (own phone or relay, after NM_RESET) wins over the default. 'Tester N' stays only as a last resort for an
   id with no default. */
const NM_DEF={nathe:'Nathe',phill:'Phill',logan:'Logan',steven:'Snookie',joseph:'Joe',michael:'Choongy',dana:'Dana',tahuri:'Tahuri',estiaan:'Estiaan',nate:'Nate',darnie:'Darnie'};
const nmDef=id=>NM_DEF[id]||null;
const nmNeutral=id=>{if(NM_DEF[id])return NM_DEF[id];const i=nmIdx(id);return i<0?'Tester':'Tester '+(i+1)};
window.NM_DEF=NM_DEF;
/* Rule check. Returns {ok,n,msg}. selfId is skipped for the uniqueness check; pass uniq=false to check format/rude only. */
function nmCheck(raw,selfId,uniq=true){const n=nmClean(raw);
 if(n.length<2)return{ok:false,n,msg:'Use at least 2 characters.'};
 if(n.length>16)return{ok:false,n,msg:'Use 16 characters or fewer.'};
 if(!/^[A-Za-z0-9 _-]+$/.test(n))return{ok:false,n,msg:'Use letters, numbers, spaces, - and _ only.'};
 if(nmRude(n))return{ok:false,n,msg:'Please pick a different name.'};
 const lo=n.toLowerCase(),toks=lo.split(/[\s_-]+/);
 if(selfId&&NM_DEF[selfId]&&NM_DEF[selfId].toLowerCase()==lo)return{ok:true,n,msg:''};
 if(Object.entries(NM_DEF).some(([id,d])=>id!=selfId&&d.toLowerCase()==lo))return{ok:false,n,msg:'That is another tester\'s name.'};
 if(NM_REAL.sur.some(s=>toks.includes(s)||lo.replace(/[\s_-]/g,'').includes(s.replace(/[\s_-]/g,'')))||NM_REAL.full.some(([,f])=>f.toLowerCase()==lo))return{ok:false,n,msg:NM_HINT};
 if(/^tester\s*\d*$/i.test(n))return{ok:false,n,msg:'Pick a name of your own.'};
 if(uniq){const D=nmDir();if(Object.entries(D).some(([id,e])=>id!=selfId&&e&&String(e.n).toLowerCase()==lo))return{ok:false,n,msg:'Another tester already has that name.'}}
 return{ok:true,n,msg:''}}
/* who owns each name: earliest pick wins (tie: TESTERS order) */
function nmOwners(D){const O={};Object.entries(D).forEach(([id,e])=>{if(!e||!e.n)return;const k=String(e.n).toLowerCase(),o=O[k];
 if(!o||e.nt<o.nt||(e.nt==o.nt&&nmIdx(id)<nmIdx(o.id)))O[k]={id,nt:e.nt}});return O}
function nmClash(id){const D=nmDir(),e=D[id];if(!e||!e.n)return false;const o=nmOwners(D)[String(e.n).toLowerCase()];return!!(o&&o.id!=id)}
/* learn a name from the relay (directory, invite or match state). u = when it was posted: the newest post from an id always
   replaces that id's older one (one entry per id, so an id's own past names can never clash with it). nt = when it was picked,
   which decides clashes BETWEEN ids. */
function nmLearn(id,n,nt,u){if(!id||nmIdx(id)<0||typeof n!='string')return false;const me=TESTER&&TESTER.id;if(id==me)return false;
 u=+u||0;if(u<NM_RESET)return false;const c=nmCheck(n,id,false);if(!c.ok)return false;const D=nmDir(),e=D[id];
 if(e&&(e.u||e.nt||0)>u)return false;const ch=!e||e.n!=c.n;D[id]={n:c.n,nt:+nt||u,u};nmSaveDir(D);return ch}
/* a clear entry {k:'nm',id,clr:1} newer than the cached name removes it */
function nmForget(id,u){u=+u||0;if(u<NM_RESET||(TESTER&&TESTER.id==id))return false;const D=nmDir(),e=D[id];if(!e||(e.u||e.nt||0)>u)return false;delete D[id];nmSaveDir(D);return true}
/* --- what the app shows --- */
function testerName(id){const me=TESTER&&TESTER.id,o=id?nmOwn(id):null;if(id&&id==me)return o?o.n:nmNeutral(id);
 const e=nmDir()[id];if(e&&e.n&&nmCheck(e.n,id,false).ok&&!nmClash(id))return e.n;
 /* a name picked on this same phone (another tester profile) */if(o&&nmCheck(o.n,id,false).ok&&!(e&&e.n))return o.n;return nmNeutral(id)}
const myName=()=>TESTER?testerName(TESTER.id):'You';
const nmEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
/* every real-name variant -> tester id, longest first so 'Tahuri Engelen-Burney' beats 'Tahuri Engelen' */
const NM_VAR=(()=>{const L=[];NM_REAL.full.forEach(([id,n])=>{L.push([id,n]);const p=n.split(/\s+/);if(p.length>1){L.push([id,p[0]+' '+p[p.length-1][0]+'.']);L.push([id,p[0]+' '+p[1][0]+'.'])}});
 const seen=new Set();return L.filter(([i,n])=>{const k=n.toLowerCase();if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>b[1].length-a[1].length)})();
const NM_RX=new RegExp('('+NM_VAR.map(([,n])=>nmEsc(n)).join('|')+')(?![A-Za-z])','gi');
const nmIdOf=s=>{const k=String(s||'').trim().toLowerCase();const v=NM_VAR.find(([,n])=>n.toLowerCase()==k);return v?v[0]:null};
/* map a stored name (S.profile, squad member, coach...) to the name to show */
function dispName(s){if(s==null)return s;const id=nmIdOf(s);if(id)return testerName(id);if(typeof S!='undefined'&&S&&s==S.profile)return myName();return s}
function nmScrub(t){if(!t||typeof t!='string')return t;NM_RX.lastIndex=0;if(!NM_RX.test(t))return t;NM_RX.lastIndex=0;return t.replace(NM_RX,m=>testerName(nmIdOf(m)))}
window.dispName=dispName;window.testerName=testerName;window.myName=myName;window.nmScrub=nmScrub;window.nmCheck=nmCheck;
/* --- relay sync --- */
const NM_TOPIC=()=>H2H_NS+'-names';
async function nmPublish(force){if(!TESTER)return;const o=nmOwn(TESTER.id);if(!o)return;const last=+localStorage.getItem(nmPostKey(TESTER.id))||0;
 if(!force&&last>=NM_RESET&&Date.now()-last<6*36e5)return;if(await h2hPost(NM_TOPIC(),{k:'nm',id:TESTER.id,n:o.n,nt:o.nt,t:Date.now()}))localStorage.setItem(nmPostKey(TESTER.id),String(Date.now()))}
let nmBusy=false;
async function nmSync(){if(nmBusy)return false;nmBusy=true;let ch=false;try{const before=TESTER&&nmClash(TESTER.id);
 const L=await h2hPoll(NM_TOPIC(),localStorage.getItem(NM_SINCE));if(L&&L.length){L.forEach(d=>{localStorage.setItem(NM_SINCE,d._id);if(d.k=='nm'&&(d.clr?nmForget(d.id,d.t):nmLearn(d.id,d.n,d.nt,d.t)))ch=true})}
 await nmPublish(false);if(TESTER&&nmClash(TESTER.id)&&!before)ch=true}finally{nmBusy=false}
 if(ch&&typeof render=='function'&&!(document.activeElement&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName))&&!(typeof cur!='undefined'&&cur&&typeof view!='undefined'&&view=='score')){if(document.getElementById('h2hview')&&window._h2hv)h2hView(window._h2hv);else render()}return ch}
window.nmSync=nmSync;
/* my own name: save locally, put me in my own cache (so uniqueness is checked the same way everywhere), post it */
function nmSetMine(n){const id=TESTER.id,o={n,nt:Date.now()};localStorage.setItem(nmOwnKey(id),JSON.stringify(o));localStorage.setItem(nmAskKey(id),String(Date.now()));
 const D=nmDir();D[id]={...o,u:o.nt};nmSaveDir(D);nmPublish(true)}
(function(){if(!TESTER)return;const o=nmOwn(TESTER.id);if(o){const D=nmDir();if(!D[TESTER.id]||D[TESTER.id].n!=o.n){D[TESTER.id]={...o,u:o.nt};nmSaveDir(D)}}})();
/* --- screens --- */
function nmForm(id,cta){const o=TESTER&&nmOwn(TESTER.id);return`<label for="${id}">Display name</label><input id="${id}" maxlength="16" autocomplete="off" autocapitalize="words" value="${o?esc(o.n):''}" placeholder="${TESTER&&nmDef(TESTER.id)?esc(nmDef(TESTER.id))+' (default)':'e.g. Arrowhead_7'}">
 <p class="small muted" style="margin:4px 0">${NM_HINT} 2 to 16 letters, numbers, spaces, - or _. Other testers see only this name.</p><p class="small" id="${id}err" role="alert" style="margin:4px 0;font-weight:600"></p><button class="btn alt full" id="${id}go">${cta}</button>`}
function nmBindForm(id,done){const go=$('#'+id+'go'),inp=$('#'+id);if(!go)return;const sub=()=>{const c=nmCheck(inp.value,TESTER.id);if(!c.ok){$('#'+id+'err').textContent='⚠ '+c.msg;return}nmSetMine(c.n);done()};
 go.onclick=sub;inp.onkeydown=e=>{if(e.key=='Enter')sub()}}
/* 'Not now' is remembered per tester as a timestamp (scoretool.dname.asked.<id>). A skip or own pick from before the relay reset point
   (NM_RESET) doesn't count, so a stale test name asks once more; after that 'Not now' sticks. Bug fixed 20 Oct: a stale pre-reset own
   name used to force the prompt forever, so 'Not now' did nothing. Also kept in memory in case storage is blocked. */
let nmSkipMem=false;
const nmLS={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
const nmSkipped=id=>nmSkipMem||(+nmLS.get(nmAskKey(id))||0)>=NM_RESET;
(function(){if(!TESTER)return;const id=TESTER.id;if(nmOwnRaw(id)&&!nmOwn(id)){nmLS.del(nmOwnKey(id));if(!nmSkipped(id))nmLS.del(nmAskKey(id))}})();
function nmNeedPrompt(){if(!TESTER)return false;if(nmClash(TESTER.id))return true;return!nmDef(TESTER.id)&&!nmOwn(TESTER.id)&&!nmSkipped(TESTER.id)}
function nmScreen(){const clash=nmClash(TESTER.id);$('#tabs').hidden=true;
 app.innerHTML=`<div class="card dark" id="nmscreen"><span class="kicker">Welcome</span><h1>${clash?'Pick another name':'Choose your display name'}</h1>
 <p class="small">${clash?'Another tester picked that name first. Choose a different one.':'This is the name other testers see in matches, squads and leagues.'}</p>${nmForm('nmin','Save name')}
 ${clash?'':'<button class="btn ghost full" id="nmlater" style="margin-top:6px">Not now</button><p class="small muted">Until you pick one you show as '+esc(nmNeutral(TESTER.id))+'. You can set it any time in Me.</p>'}</div>`;
 nmBindForm('nmin',()=>{$('#tabs').hidden=false;nav('home')});const l=$('#nmlater');if(l)l.onclick=()=>{nmSkipMem=true;nmLS.set(nmAskKey(TESTER.id),String(Date.now()));$('#tabs').hidden=false;nav('home')}}
const _nmRender=render;render=function(){if(TESTER&&S.unlocked&&S.profile&&!/^#(share|coach)=/.test(location.hash)&&nmNeedPrompt())return nmScreen();return _nmRender()};
const _nmMe=me;me=function(){_nmMe();const c=document.createElement('div');c.className='card';c.id='nmcard';
 c.innerHTML=`<span class="kicker">Display name</span><h2>${esc(myName())}</h2>${nmForm('nmme','Save display name')}`;app.prepend(c);
 nmBindForm('nmme',()=>me())};
/* safety net, social views only: scrub real names from text and visible attributes (never touches data-* attributes) */
const NM_SOCIAL='#h2hview,#h2hcard,.h2hchip,#leaguecard,#lgview,#lgcard,#suview',NM_SOCIAL_VIEWS=['squad','badges','profile','recap'];
const nmSocial=el=>{if(!el||!el.closest)return false;if(el.closest('.nm-real'))return false;/* setup tick lists show real names (Nathe, 20 Oct) */if(el.closest(NM_SOCIAL))return true;return typeof view!='undefined'&&NM_SOCIAL_VIEWS.includes(view)&&!!el.closest('#app')};
(function(){const A=['value','title','aria-label','placeholder','alt','content'];
 const fix=root=>{if(root.nodeType==3){if(!nmSocial(root.parentElement))return;const v=nmScrub(root.data);if(v!==root.data)root.data=v;return}if(root.nodeType!=1)return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n=root;
  do{if(n.nodeType==3){if(n.parentNode&&/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName))continue;if(!nmSocial(n.parentElement))continue;const v=nmScrub(n.data);if(v!==n.data)n.data=v}
   else if(nmSocial(n))for(const a of A)if(n.hasAttribute&&n.hasAttribute(a)){const o=n.getAttribute(a),v=nmScrub(o);if(v!==o){n.setAttribute(a,v);if(a=='value'&&'value'in n)n.value=v}}}while((n=w.nextNode()))};
 const go=()=>fix(document.body);
 new MutationObserver(M=>{for(const m of M){if(m.type=='characterData')fix(m.target);else if(m.type=='attributes')fix(m.target);else m.addedNodes.forEach(fix)}})
  .observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:A});
 if(document.body)go();else addEventListener('DOMContentLoaded',go)})();
