/* Onion Shed Challenge league (20 Oct 2026, rules from Nathe).
   Six rounds of 'Vegas 300 (18 m)': 30 arrows, 10 ends of 3, vertical 3-spot only, X 10 9 8 7 6 M, X = 10, max 300 each.
   Weeks 1-5: one 300 per archer per week. Day 6: everyone shoots the 6th 300 together. Ranking: cumulative total (max 1800), ties on X.
   When every archer's day-6 300 is in, the totals seed ONE shoot-up final (shootup.js, league rule set: 3 ends of 3, total, X = 10,
   no 12 dot, tie -> 1 arrow each, same ring -> host picks closest to centre). The host can force the start for drop-outs.
   Scoring groups per week: the host may put archers into shared-phone groups (any member's phone scores the whole group with the chip
   switcher); everyone else scores on their own phone (default). An archer's week is locked to the phone that entered its first end;
   another phone is refused unless it confirms a takeover. Archers can move group only before they start that week.
   Sync (ntfy, messages expire after 12 h, a league runs 6 weeks): every phone keeps the whole league locally and re-posts a full
   snapshot (every archer's weekly ends, totals follow) when it opens, every 6 hours and after scoring; phones merge by the newest entry
   per archer per week, so a phone that's been away catches up from whoever opens next. A post that fails (offline) stays queued and is
   sent when the phone is back online. Payloads: tester ids, nicknames, ends only. Phill is not offered in the league archer list. */
const LG_R='Vegas 300 (18 m)',LG_W=6,LG_SNAP=6*36e5,LG_EXCL=['phill'],LG_KEYS=['X','10','9','8','7','6','M'],LG_FACE='Vertical 3-spot';
/* shown text: the league round is '300 (18 m)', never 'Vegas' (Coach re-test, 20 Oct). The ROUNDS key stays for stored data. */
const LG_RL='300 (18 m)',rdLabel=r=>r==LG_R?LG_RL:r;window.rdLabel=rdLabel;
const LG_FINTXT='Final: 3 ends of 3 arrows, X = 10, no 12 dot. Ties: 1 arrow each, closest to the middle wins (host picks).';
const lgAll=()=>S.leagues=S.leagues||[],lgGet=c=>lgAll().find(l=>l.code==c);
const lgTopic=c=>H2H_NS+'-lg-'+String(c).toLowerCase().replace(/[^a-z0-9]/g,'');
const lgName=id=>h2hShort(id);
const lgV=a=>a=='X'?10:a=='M'?0:(+a||0),lgTot=E=>E.flat().reduce((t,a)=>t+lgV(a),0),lgXs=E=>E.flat().filter(a=>a=='X').length;
const lgEnc=E=>E.map(e=>e.map(a=>a=='10'?'T':a).join('')).join('/'),lgDec=s=>String(s||'').split('/').filter(x=>x!=='').slice(0,10).map(e=>[...e].slice(0,3).map(c=>c=='T'?'10':c).filter(a=>LG_KEYS.includes(a)));
const lgEnt=(lg,id,w)=>((lg.sc||{})[id]||{})[w]||null;
const lgHas=e=>!!(e&&e.e&&e.e.some(x=>x&&x.length));
const lgDoneE=e=>!!(e&&e.e&&e.e.filter(x=>x&&x.length==3).length>=10);
const lgToday=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function lgArchers(lg){return(lg.order||[]).filter(id=>!LG_EXCL.includes(id)).slice(0,H2H_MAX)}
/* current week: by the week dates if set, else the first week not yet shot by everyone (or the host's 'Next week') */
function lgWeek(lg){const W=(lg.weeks||[]).filter(Boolean);if(W.length){const t=lgToday();let n=0;(lg.weeks||[]).forEach((d,k)=>{if(d&&d<=t)n=k+1});return Math.max(1,Math.min(LG_W,n||1))}
 let w=Math.max(1,Math.min(LG_W,lg.cw||1));const A=lgArchers(lg);while(w<LG_W&&A.length&&A.every(id=>lgDoneE(lgEnt(lg,id,w))))w++;return w}
/* league table: cumulative total, ties on X; missing weeks '-' */
function lgTable(lg){const rows=lgArchers(lg).map(id=>{const W=[];let t=0,x=0;for(let w=1;w<=LG_W;w++){const e=lgEnt(lg,id,w);if(lgHas(e)){const s=lgTot(e.e),xx=lgXs(e.e);W.push({s,x:xx,d:lgDoneE(e)});t+=s;x+=xx}else W.push(null)}return{id,nm:lgName(id),W,t,x}});
 rows.sort((a,b)=>b.t-a.t||b.x-a.x||a.nm.localeCompare(b.nm));rows.forEach((r,k)=>{r.rk=k&&rows[k-1].t==r.t&&rows[k-1].x==r.x?rows[k-1].rk:k+1});rows.forEach(r=>r.tie=rows.filter(o=>o.rk==r.rk).length>1);return rows}
/* ---------- groups ---------- */
const lgGroups=(lg,w)=>(((lg.grp||{})[w]||{}).g||[]).map(g=>g.filter(id=>lgArchers(lg).includes(id)));
const lgGroupOf=(lg,w,id)=>{const G=lgGroups(lg,w);const k=G.findIndex(g=>g.includes(id));return k<0?null:k};
/* host: set week w's groups; archers who already started this week can't move */
function lgSetGroups(code,w,G){const lg=lgGet(code),me=h2hMe();if(!lg||lg.host!=me)return false;const old=lgGroups(lg,w),started=id=>lgHas(lgEnt(lg,id,w));
 const where=(GG,id)=>GG.findIndex(g=>g.includes(id));let ok=true;const N=G.map(g=>g.filter(id=>lgArchers(lg).includes(id)));
 for(const id of lgArchers(lg))if(started(id)&&where(old,id)!=where(N,id))ok=false;if(!ok)return false;
 lg.grp=lg.grp||{};lg.grp[w]={t:Date.now(),g:N.filter(g=>g.length)};lg.dirty=1;save();lgTick(true);return true}
/* ---------- scoring ---------- */
function lgLockedBy(lg,w,id){const e=lgEnt(lg,id,w),me=h2hMe();return lgHas(e)&&e.by&&e.by!=me?e.by:null}
function lgKey(code,w,id,k){const lg=lgGet(code);if(!lg||!LG_KEYS.includes(k)||w!=lgWeek(lg)||lg.fin)return false;if(lgLockedBy(lg,w,id))return false;
 lg.sc=lg.sc||{};lg.sc[id]=lg.sc[id]||{};const e=lg.sc[id][w]=lg.sc[id][w]||{e:[]};if(lgDoneE(e))return false;let E=e.e[e.e.length-1];if(!E||E.length>=3){E=[];e.e.push(E)}E.push(k);
 Object.assign(e,{by:h2hMe(),u:Date.now(),f:'vert'});lg.dirty=1;save();
 if(E.length==3){const G=window._lgE&&window._lgE.ids||[id],s=G.indexOf(id);window._lgAct=null;for(let j=1;j<=G.length;j++){const n=G[(s+j)%G.length];if(!lgDoneE(lgEnt(lg,n,w))){window._lgAct=n;break}}}
 lgAfter(lg);return true}
function lgUndo(code,w,id){const lg=lgGet(code);if(!lg||lgLockedBy(lg,w,id)||lg.fin)return;const e=lgEnt(lg,id,w);if(!lgHas(e))return;const E=e.e[e.e.length-1];E.pop();if(!E.length)e.e.pop();e.u=Date.now();lg.dirty=1;save();lgAfter(lg)}
/* a second phone for the same archer and week: refused unless it confirms a takeover */
function lgTake(code,w,id,ask=true){const lg=lgGet(code);const by=lg&&lgLockedBy(lg,w,id);if(!by)return true;if(ask&&!confirm(`${lgName(id)}'s week ${w} is being scored on ${lgName(by)}'s phone. Take over scoring here?`))return false;
 const e=lgEnt(lg,id,w);e.by=h2hMe();e.u=Date.now();lg.dirty=1;save();lgAfter(lg);return true}
function lgAfter(lg){lgFinal(lg);if($('#lgview')&&window._lgv==lg.code)lgView(lg.code);lgTick(true)}
/* ---------- final ---------- */
const lgFinCode=lg=>lg.code+'F';
function lgAllDone6(lg){const A=lgArchers(lg);return A.length>=2&&A.every(id=>lgDoneE(lgEnt(lg,id,LG_W)))}
function lgFinal(lg){let seeds=lg.fin&&lg.fin.length>=2?lg.fin:null;if(!seeds&&lgAllDone6(lg)){seeds=lgTable(lg).map(r=>r.id);if(lg.host==h2hMe()){lg.fin=seeds;lg.fint=Date.now();lg.dirty=1}}
 if(!seeds)return null;const code=lgFinCode(lg);let m=h2hGet(code);
 const ops={};for(const id of seeds){const E=[];for(let w=1;w<=LG_W;w++){const e=lgEnt(lg,id,w);if(lgHas(e))E.push(...e.e)}ops[id]={ends:E,done:true}}
 if(!m){m={code,g:1,lg:lg.code,round:LG_R,mode:'total',host:lg.host,opp:lg.host,a:lg.host,order:seeds.slice(),ops,inv:[],created:Date.now(),status:'active',su:{seeds:seeds.slice(),t:Date.now()}};h2hAll().push(m);save();
  if(lg.host==h2hMe())h2hPost(h2hTopic(code),{k:'su',code,by:h2hMe(),seeds,t:Date.now()})}
 else{m.ops=ops;if(JSON.stringify(m.su.seeds)!=JSON.stringify(seeds)&&!m.lad){m.su={seeds:seeds.slice(),t:Date.now()};m.order=seeds.slice()}save()}
 return m}
function lgForce(code){const lg=lgGet(code);if(!lg||lg.host!=h2hMe()||lg.fin)return false;const seeds=lgTable(lg).filter(r=>lgDoneE(lgEnt(lg,r.id,LG_W))).map(r=>r.id);if(seeds.length<2)return false;
 lg.fin=seeds;lg.fint=Date.now();lg.dirty=1;save();lgFinal(lg);lgTick(true);return true}
/* ---------- relay: snapshots, merge, offline queue ---------- */
function lgSnapParts(lg){const me=h2hMe(),head={k:'ls',code:lg.code,by:me,name:lg.name,host:lg.host,weeks:lg.weeks||[],wt:lg.wt||0,order:lgArchers(lg),cw:lg.cw||1,cwt:lg.cwt||0,grp:lg.grp||{},fin:lg.fin||null,fint:lg.fint||0,...h2hNm()};
 const items=[];for(const id in lg.sc||{})for(const w in lg.sc[id]){const e=lg.sc[id][w];if(e&&e.e)items.push([id,w,{e:lgEnc(e.e),u:e.u||0,by:e.by||'',f:e.f||'vert'}])}
 const parts=[];let cur={};const size=o=>JSON.stringify(o).length;
 for(const [id,w,v] of items){const c2=JSON.parse(JSON.stringify(cur));(c2[id]=c2[id]||{})[w]=v;if(Object.keys(cur).length&&size({...head,sc:c2})>3400){parts.push(cur);cur={};(cur[id]={})[w]=v}else cur=c2}
 parts.push(cur);const t=Date.now();return parts.map((sc,k)=>({...head,sc,part:k+1,np:parts.length,t}))}
function lgMerge(lg,d){if(!d||d.k!='ls'||d.code!=lg.code||(d.t||0)<H2H_RESET)return false;let ch=false;const fromHost=!lg.host||d.by==lg.host;
 if(d.nm&&nmLearn(d.by,d.nm,d.nt,d.t))ch=true;
 if(fromHost){if(!lg.host&&typeof d.host=='string'){lg.host=d.host;ch=true}if(typeof d.name=='string'&&d.name&&d.name!=lg.name){lg.name=nmClean(d.name).slice(0,40);ch=true}
  if(Array.isArray(d.weeks)&&(d.wt||0)>(lg.wt||0)){lg.weeks=d.weeks.slice(0,LG_W).map(x=>/^\d{4}-\d\d-\d\d$/.test(x)?x:'');lg.wt=d.wt;ch=true}
  if(d.grp&&typeof d.grp=='object'){lg.grp=lg.grp||{};for(const w in d.grp){const g=d.grp[w];if(+w>=1&&+w<=LG_W&&g&&Array.isArray(g.g)&&(g.t||0)>((lg.grp[w]||{}).t||0)){lg.grp[w]={t:g.t,g:g.g.map(x=>Array.isArray(x)?x.filter(i=>typeof i=='string'):[])};ch=true}}}
  if(Array.isArray(d.fin)&&(d.fint||0)>(lg.fint||0)){lg.fin=d.fin.filter(x=>typeof x=='string');lg.fint=d.fint;ch=true}
  if((d.cwt||0)>(lg.cwt||0)){lg.cw=Math.max(1,Math.min(LG_W,+d.cw||1));lg.cwt=d.cwt;ch=true}}
 lg.order=lg.order||[];for(const id of [...(Array.isArray(d.order)&&fromHost?d.order:[]),d.by])if(typeof id=='string'&&!LG_EXCL.includes(id)&&!lg.order.includes(id)&&lg.order.length<H2H_MAX){lg.order.push(id);ch=true}
 lg.sc=lg.sc||{};for(const id in d.sc||{}){if(typeof id!='string'||id.length>16)continue;for(const w in d.sc[id]){if(!(+w>=1&&+w<=LG_W))continue;const v=d.sc[id][w],mine=lgEnt(lg,id,w);
  if(!v||(mine&&(mine.u||0)>=(v.u||0)))continue;(lg.sc[id]=lg.sc[id]||{})[w]={e:lgDec(v.e),u:+v.u||0,by:typeof v.by=='string'?v.by:'',f:v.f=='vert'?'vert':'vert'};ch=true}}
 return ch}
let lgBusy=false;const lgOpened={};
async function lgTick(force){if(lgBusy||!TESTER)return;lgBusy=true;let ch=false;try{for(const lg of lgAll()){if(lg.status=='invite')continue;
  const L=await h2hPoll(lgTopic(lg.code),lg.since);if(L&&L.length){for(const d of L){lg.since=d._id;if(lgMerge(lg,d))ch=true}save()}
  if(lgFinal(lg))ch=ch||false;
  if(lg.dirty||!lgOpened[lg.code]||Date.now()-(lg.posted||0)>LG_SNAP){let ok=true;for(const o of lgSnapParts(lg))if(!await h2hPost(lgTopic(lg.code),o)){ok=false;break}
   if(ok){lg.posted=Date.now();lg.dirty=0;lg.qfail=0;lgOpened[lg.code]=1}else lg.qfail=1;save()}}}
 finally{lgBusy=false}if(ch){if($('#lgview')&&window._lgv)lgView(window._lgv);else if($('#lgcard')&&!cur&&view=='score'&&!($('#lgnew')||{}).open&&!($('#h2hnew')||{}).open)score()}}
setInterval(()=>{if(!document.hidden)lgTick()},30000);setTimeout(()=>lgTick(true),2500);addEventListener('online',()=>lgTick(true));
/* invites + join */
window.lgInvite=function(d){const me=h2hMe();if(d.to!=me||d.from==me||!d.code||lgGet(d.code)||(d.t||0)<H2H_RESET||LG_EXCL.includes(me))return false;if(d.nm)nmLearn(d.from,d.nm,d.nt,d.t);
 lgAll().push({code:d.code,name:nmClean(String(d.name||'League')).slice(0,40),host:d.from,order:[d.from,me],sc:{},status:'invite',created:d.t||Date.now()});save();return true};
function lgCreate(name,T,weeks){const me=h2hMe();if(!me)return null;const code=h2hCode(),lg={code,name:nmClean(name||'').slice(0,40)||'Onion Shed Challenge',host:me,order:[me,...T.filter(id=>id!=me&&!LG_EXCL.includes(id))].slice(0,H2H_MAX),
 weeks:(weeks||[]).slice(0,LG_W),wt:Date.now(),cw:1,cwt:0,grp:{},sc:{},status:'active',created:Date.now(),dirty:1};lgAll().push(lg);save();
 for(const to of lg.order.slice(1))h2hPost(h2hInbox(to),{k:'lginv',code,name:lg.name,from:me,to,...h2hNm(),t:Date.now()});lgTick(true);return lg}
async function lgJoin(raw){const code=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');const me=h2hMe();if(code.length!=8)return'Type the 8-character league code.';if(lgGet(code)){lgView(code);return''}
 const L=await h2hPoll(lgTopic(code));const s=(L||[]).filter(d=>d.k=='ls'&&d.code==code);if(!s.length)return'No league found with that code yet. Ask the host to open the league, then try again.';
 const lg={code,name:'League',host:null,order:[],sc:{},status:'active',created:Date.now(),dirty:1};s.forEach(d=>{lg.since=d._id;lgMerge(lg,d)});if(!lg.order.includes(me)&&lg.order.length<H2H_MAX)lg.order.push(me);
 lgAll().push(lg);save();lgTick(true);lgView(code);return''}
window.lgCreate=lgCreate;window.lgJoin=lgJoin;window.lgKey=lgKey;window.lgUndo=lgUndo;window.lgTake=lgTake;window.lgSetGroups=lgSetGroups;window.lgForce=lgForce;window.lgTick=lgTick;window.lgTable=lgTable;window.lgMerge=lgMerge;window.lgWeek=lgWeek;window.lgSnapParts=lgSnapParts;
/* ---------- screens ---------- */
function lgCard(){if(!TESTER)return'';const me=h2hMe(),L=lgAll().slice().reverse();
 return`<div class="card" id="lgcard"><span class="kicker">Leagues</span><h3>Your leagues</h3>${L.length?'':'<p class="small muted" style="margin:2px 0 8px">You are not in any leagues yet. Join one with the code from its host, or start your own.</p>'}
 ${L.map(lg=>lg.status=='invite'?`<div class="list-item"><b>${esc(lgName(lg.host))} invited you to ${esc(lg.name)}</b><div class="row" style="gap:6px;justify-content:flex-start;margin-top:6px"><button class="btn alt" data-lgacc="${lg.code}">Join league</button><button class="btn ghost" data-lgno="${lg.code}">Not now</button></div></div>`
  :`<div class="list-item row"><span><b>${esc(lg.name)}</b><div class="small muted">${lg.fin?'Final shoot-up':'Week '+lgWeek(lg)+' of 6'} · ${lgArchers(lg).length} archers</div></span><button class="btn ghost" data-lgopen="${lg.code}">Open</button></div>`).join('')}
 <details id="lgnew"><summary>New league</summary><label for="lgname">League name</label><input id="lgname" maxlength="40" placeholder="League name"><p class="small muted" style="margin:6px 0">Format: six 300s at 18 m on the vertical 3-spot, cumulative total, then one shoot-up final. <span id="lgrules">${LG_FINTXT}</span></p>
 <fieldset class="h2hops nm-real"><legend>Who's in</legend>${TESTERS.filter(t=>t.id!=me&&!LG_EXCL.includes(t.id)).map(t=>`<label class="h2htk"><input type="checkbox" data-lgop="${t.id}"> ${esc(t.name)}</label>`).join('')}</fieldset>
 <p class="small muted" style="margin:4px 0">You plus up to 9 others (10 archers max). Others can also join with the league code.</p>
 <details><summary class="small">Week dates (optional)</summary>${[1,2,3,4,5,6].map(w=>`<label for="lgd${w}">${w<6?'Week '+w:'Day 6 (together)'}</label><input type="date" id="lgd${w}">`).join('')}</details>
 <button class="btn alt full" id="lggo" style="margin-top:8px">Create league</button></details>
 <div class="row" style="gap:6px;margin-top:8px"><input id="lgjc" placeholder="League code" maxlength="8" autocapitalize="characters" style="flex:1"><button class="btn ghost" id="lgjgo">Join</button></div><p class="small" id="lgjmsg" role="alert"></p></div>`}
function lgBindCard(){const c=$('#lgcard');if(!c)return;
 c.querySelectorAll('[data-lgopen]').forEach(b=>b.onclick=()=>lgView(b.dataset.lgopen));
 c.querySelectorAll('[data-lgacc]').forEach(b=>b.onclick=()=>{const lg=lgGet(b.dataset.lgacc);lg.status='active';lg.dirty=1;save();lgTick(true);lgView(lg.code)});
 c.querySelectorAll('[data-lgno]').forEach(b=>b.onclick=()=>{S.leagues=lgAll().filter(l=>l.code!=b.dataset.lgno);save();score()});
 const g=$('#lggo');if(g)g.onclick=()=>{if(lgAll().filter(l=>l.host==h2hMe()&&!lgFinDone(l)).length>=3)return;const T=[...c.querySelectorAll('[data-lgop]:checked')].map(x=>x.dataset.lgop);if(T.length>H2H_MAX-1)return;
  const lg=lgCreate($('#lgname').value,T,[1,2,3,4,5,6].map(w=>($('#lgd'+w)||{}).value||''));if(lg)lgView(lg.code)};
 const j=$('#lgjgo');if(j)j.onclick=async()=>{const msg=await lgJoin($('#lgjc').value);const e=$('#lgjmsg');if(e&&msg)e.textContent='⚠ '+msg}}
const lgFinDone=lg=>{const m=lg.fin&&h2hGet(lgFinCode(lg));return!!(m&&window.suLadder&&suLadder(m).length&&suLadder(m).slice(-1)[0].res.winner)};
const _lgH2H=window.h2hCard;window.h2hCard=function(){return _lgH2H.apply(this,arguments)+lgCard()};
const _lgScore=score;score=function(){const o=_lgScore.apply(this,arguments);try{lgBindCard()}catch(e){console.error(e)}return o};
function lgEntryCard(lg,w,ids){const me=h2hMe(),act0=window._lgAct&&ids.includes(window._lgAct)?window._lgAct:null;
 const open=ids.filter(id=>!lgDoneE(lgEnt(lg,id,w))&&!lgLockedBy(lg,w,id)),a=act0&&!lgDoneE(lgEnt(lg,act0,w))?act0:open[0]||ids[0];
 const e=lgEnt(lg,a,w)||{e:[]},last=e.e[e.e.length-1],cur3=last&&last.length<3?last:[],en=Math.min(10,e.e.length+(last&&last.length<3?0:1)),lock=lgLockedBy(lg,w,a),done=lgDoneE(e);
 return`<div class="card" id="lgentry"><span class="kicker">Score card · week ${w}</span><div class="row lc-chips" style="gap:6px;flex-wrap:wrap;justify-content:flex-start">${ids.map(id=>{const x=lgEnt(lg,id,w),n=x&&x.e?x.e.filter(z=>z.length==3).length:0,lb=lgLockedBy(lg,w,id);
  return`<button class="lc-chip${id==a?' on':''}" data-lgid="${esc(id)}">${esc(lgName(id))} <span class="small">${lgDoneE(x)?'finished':lb?'on '+esc(lgName(lb))+'\'s phone':n+'/10'}</span></button>`}).join('')}</div>
 <p style="margin:8px 0 4px"><b>${esc(lgName(a))}</b> · ${done?'300 finished':'End '+en+' of 10'} · ${LG_FACE} · 18 m</p>
 ${lock?`<p class="small" id="lglock">Being scored on ${esc(lgName(lock))}'s phone. Only one phone can score an archer's week.</p><button class="btn ghost" id="lgtake" data-lgtk="${esc(a)}">Take over scoring here</button>`:done?'':`<div class="vg-slots">${[0,1,2].map(j=>`<span class="vg-slot${cur3[j]?' on':''}">${cur3[j]?esc(cur3[j]):''}</span>`).join('')}</div>
 <div class="ad-pad lc-pad" style="--cols:7;margin-top:8px">${LG_KEYS.map(k=>`<button class="${col(k)}" data-lgk="${k}" aria-label="score ${k}">${k}</button>`).join('')}</div>`}<button class="btn ghost" id="lgundo" style="margin-top:6px" ${lock?'disabled':''}>Undo</button>
 <p class="small muted" id="lgq">${lg.qfail?'Offline: results are saved here and will send when you are back online.':lg.dirty?'Sending…':'Saved and sent to the league.'}</p></div>`}
function lgView(code){const lg=lgGet(code);if(!lg)return;window._lgv=code;cur=null;$('#tabs').hidden=false;const me=h2hMe(),host=lg.host==me,w=lgWeek(lg),rows=lgTable(lg),G=lgGroups(lg,w),gk=lgGroupOf(lg,w,me),fm=lg.fin&&h2hGet(lgFinCode(lg));
 const wk=d=>d?new Date(d+'T00:00').toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'}):'';
 const E=window._lgE&&window._lgE.code==code&&window._lgE.w==w?window._lgE:null;
 const mine=gk==null?`<p class="small" style="margin:0 0 6px">You score on your own phone this week.</p><button class="btn alt" data-lgme="1">${lgDoneE(lgEnt(lg,me,w))?'View my week '+w:'Score my week '+w}</button>`
  :`<p class="small" style="margin:0 0 6px">Shared phone, group ${gk+1}: ${G[gk].map(id=>esc(lgName(id))).join(', ')}. Any member's phone can score the group.</p><button class="btn alt" data-lgsg="${gk}">Score group ${gk+1} on this phone</button>`;
 const tab=`<div class="lg-wrap"><table class="ad-tab lg-tab"><thead><tr><th></th><th>Archer</th>${[1,2,3,4,5,6].map(k=>`<th>W${k}</th>`).join('')}<th>Total</th><th>X</th></tr></thead><tbody>${rows.map((r,k)=>`<tr class="${k==0&&r.t>0&&!r.tie?'lead':''}" data-lgrow="${esc(r.id)}"><td>${r.tie?'=':''}${r.rk}</td><td>${k==0&&r.t>0&&!r.tie?'▲ ':''}${esc(r.nm)}${r.id==me?' (you)':''}</td>${r.W.map(c=>`<td>${c?(c.d?c.s:`<i class="muted">${c.s}</i>`):'-'}</td>`).join('')}<td><b>${r.t}</b></td><td>${r.x}</td></tr>`).join('')}</tbody></table></div>
 <p class="small muted" style="margin:4px 0 0">Max 1800. Ties split on X count. '-' = not shot; italics = still shooting. Every week: ${LG_RL}, ${LG_FACE.toLowerCase()}.</p>`;
 /* how this week is scored (host): a clear choice per archer, own phone or a shared phone for the group. Saved on tap. (Coach re-test, 20 Oct) */
 const GA=lgGroups(lg,w),seg=(id,g,lab,on,dis)=>`<button type="button" class="lg-seg${on?' on':''}" data-lggb="${esc(id)}" data-g="${g}" aria-pressed="${on}" ${dis?'disabled':''}>${lab}</button>`;
 const grpEd=host&&!lg.fin?`<div class="card" id="lggrp"><span class="kicker">Week ${w} · how it's scored</span><h3 style="margin:2px 0 4px">One phone or own phones?</h3>
  <p class="small muted" style="margin:0 0 8px">Tap for each archer. <b>Own phone</b>: they score themselves. <b>Phone 1, 2 or 3</b>: one phone scores that whole group. Archers can move only before they start.</p>
  <div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start;margin:0 0 8px"><button type="button" class="btn ghost" id="lgallown">Everyone on own phone</button><button type="button" class="btn ghost" id="lgallone">Everyone on one phone</button></div>
  ${lgArchers(lg).map(id=>{const k=lgGroupOf(lg,w,id),st=lgHas(lgEnt(lg,id,w));return`<div class="lg-grow"><span class="lg-gname">${esc(lgName(id))}${st?' <span class="small muted">(started)</span>':''}</span><span class="lg-segs" role="group" aria-label="How ${esc(lgName(id))} is scored">${seg(id,'',k==null?'&#10003; Own phone':'Own phone',k==null,st)}${[0,1,2].map(g=>seg(id,g,k===g?'&#10003; Phone '+(g+1):'Phone '+(g+1),k===g,st)).join('')}</span></div>`}).join('')}
  <p class="small" id="lggmsg" role="alert" style="margin:6px 0 0"></p></div>`:'';
 const done6=lgArchers(lg).filter(id=>lgDoneE(lgEnt(lg,id,LG_W))).length;
 app.innerHTML=`<div id="lgview"><div class="card dark"><span class="kicker">League · ${esc(LG_RL)} · ${LG_FACE}</span><h1>${esc(lg.name)}</h1>
 <p class="small" style="margin:0">${lg.fin?'All six 300s are in. Final shoot-up.':w<6?`Week ${w} of 6 is current${lg.weeks&&lg.weeks[w-1]?' · '+wk(lg.weeks[w-1]):''}. One 300 each, at home or together.`:`Day 6${lg.weeks&&lg.weeks[5]?' · '+wk(lg.weeks[5]):''}: everyone shoots the 6th 300 together. Then the shoot-up final.`}</p></div>
 ${fm?`<div class="card"><button class="btn alt" id="lgfin">${lgFinDone(lg)?'Final result':'Open the final shoot-up'}</button></div>`:`<div class="card" id="lgmine">${mine}</div>`}
 ${grpEd}${E&&!fm?lgEntryCard(lg,w,E.ids):''}
 <div class="card"><h3>League table</h3>${tab}</div>
 ${host&&!lg.fin?`<div class="card"><div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start">${!(lg.weeks||[]).some(Boolean)&&w<6?`<button class="btn ghost" id="lgnext">Move to week ${w+1}</button>`:''}${w==6&&done6>=2?`<button class="btn ghost" id="lgforce">Start shoot-up now</button>`:''}</div>${w==6?`<p class="small muted">The final starts by itself when every archer's day-6 300 is in (${done6} of ${lgArchers(lg).length}).</p>`:''}</div>`:''}
 <div class="card"><p class="small" style="margin:0">League code <b id="lgcode">${esc(code)}</b>. Share it so others can join.</p>${lg.qfail?'<p class="small" id="lgoff">Offline: results waiting to send.</p>':''}
 <div class="row" style="gap:6px;justify-content:flex-start;margin-top:6px"><button class="btn ghost" id="lgrf">Refresh now</button><button class="btn ghost" id="lgback">All leagues</button>${lgFinDone(lg)?`<button class="btn ghost" id="lgdel">Remove</button>`:''}</div></div></div>`;
 const q=s=>app.querySelector(s);
 if(q('[data-lgme]'))q('[data-lgme]').onclick=()=>{window._lgE={code,w,ids:[me]};window._lgAct=me;lgView(code)};
 if(q('[data-lgsg]'))q('[data-lgsg]').onclick=()=>{window._lgE={code,w,ids:G[gk].slice()};window._lgAct=null;lgView(code)};
 app.querySelectorAll('[data-lgid]').forEach(b=>b.onclick=()=>{window._lgAct=b.dataset.lgid;lgView(code)});
 const act=q('#lgentry .lc-chip.on')&&q('#lgentry .lc-chip.on').dataset.lgid;
 app.querySelectorAll('[data-lgk]').forEach(b=>b.onclick=()=>{window._lgAct=act;lgKey(code,w,act,b.dataset.lgk)});
 if(q('#lgundo'))q('#lgundo').onclick=()=>{window._lgAct=act;lgUndo(code,w,act)};
 if(q('#lgtake'))q('#lgtake').onclick=()=>{window._lgAct=act;lgTake(code,w,act)};
 const setG=G2=>{const ok=lgSetGroups(code,w,G2);if(!ok){q('#lggmsg').textContent='An archer who has started this week can\'t move group.';return}lgView(code)};
 app.querySelectorAll('[data-lggb]').forEach(b=>b.onclick=()=>{const id=b.dataset.lggb,g=b.dataset.g,G2=[0,1,2,3].map(k=>(GA[k]||[]).filter(x=>x!=id));if(g!=='')G2[+g].push(id);setG(G2)});
 if(q('#lgallown'))q('#lgallown').onclick=()=>{const S0=lgArchers(lg).filter(id=>lgHas(lgEnt(lg,id,w)));setG([0,1,2,3].map(k=>(GA[k]||[]).filter(x=>S0.includes(x))))};
 if(q('#lgallone'))q('#lgallone').onclick=()=>{const S0=lgArchers(lg).filter(id=>lgHas(lgEnt(lg,id,w))&&lgGroupOf(lg,w,id)!==0);const G2=[0,1,2,3].map(k=>(GA[k]||[]).filter(x=>S0.includes(x)));G2[0]=lgArchers(lg).filter(id=>!S0.includes(id));setG(G2)};
 if(q('#lgnext'))q('#lgnext').onclick=()=>{lg.cw=w+1;lg.cwt=Date.now();lg.dirty=1;save();lgTick(true);lgView(code)};
 if(q('#lgforce'))q('#lgforce').onclick=()=>{if(done6<lgArchers(lg).length&&!confirm('Start the shoot-up now? Archers without a day-6 300 are left out.'))return;if(lgForce(code))suLadderView(lgFinCode(lg))};
 if(q('#lgfin'))q('#lgfin').onclick=()=>suLadderView(lgFinCode(lg));
 q('#lgrf').onclick=()=>lgTick(true);q('#lgback').onclick=()=>{window._lgv=null;window._lgE=null;nav(view=='lab_leagues'?'lab_leagues':'score')};
 if(q('#lgdel'))q('#lgdel').onclick=()=>{if(!confirm('Remove this league from this phone? Other phones keep it.'))return;S.leagues=lgAll().filter(l=>l.code!=code);S.matches=h2hAll().filter(m=>m.code!=lgFinCode(lg));save();window._lgv=null;nav('score')};
 scrollTo(0,0)}
window.lgView=lgView;window.lgEntryCard=lgEntryCard;
