/* Casual shoot (21 Oct 2026, spec from Nathe via Archery Coach). A one-off group shoot, separate from the league: never counted in
   the league table, no leaderboard and nothing added up across shoots. It just keeps that shoot's scores.
   Setup (Score tab, 'Casual shoot'): pick Target, Indoor or Field, then a round from the app's own ROUNDS list:
     Target = every standard outdoor round (faces from faceR: 122 cm, 80 cm, 80 cm 6-ring per distance block; practice rounds any face)
     Indoor = rounds where indoor3() is true, plus Vegas 300; face is the vertical 3-spot or Vegas 3-spot only (face3R, keys X 10-6 M)
     Field  = rounds where isFld() is true; keys 6 5 (gold) 4 3 2 1 (black) and M, the same as the main field scorer
   (the league round 'Vegas 300 (18 m)', custom/3D practice rounds and legacy rounds are left out).
   People: 1 to 10. The host is in by default ('I'm shooting too'). Others are typed freely. When a typed name matches someone
   who has the app, a chip offers to link them; nothing links unless the host taps it. Under-16 testers show by nickname in the
   chip and everywhere others can see. A linked person gets the shoot on their Score tab ('Join' or 'Not me') and scores their own
   arrows; a name-only friend needs no account and the host scores and edits their arrows.
   Match play (optional, on/off): the existing shoot-up ladder (shootup.js) seeded from this shoot's scores (highest score = top
   seed, ties on 10s then Xs; only archers who finished every end, see CS_SEED_FINISHED_ONLY). It can be set at setup or switched on or off by the host after the shoot; when the shoot finishes the
   host is asked 'Do match play?'. Needs 2 or more archers. Its results stay with this shoot only.
   Sync: like the league. Each phone keeps the shoot in S.casual and posts a snapshot to its own ntfy topic when it changes, when it
   opens and every 6 hours; phones merge by newest entry per archer. Offline: everything is saved on the phone and sent later.
   Relay payload: tester ids, nicknames, the names the host typed for name-only friends (tester real names are swapped for the
   nickname), round, arrow scores. */
const CS_MAX=10,CS_SNAP=6*36e5,CS_MP_ENDS=3;
/* Match play seeding (Nathe, 21 Oct 2026): true = only archers who finished the round (every end shot) are seeded;
   false = everyone who has shot at least one arrow. Flip this one value to change the rule. */
const CS_SEED_FINISHED_ONLY=true;
const csAll=()=>S.casual=S.casual||[],csGet=c=>csAll().find(x=>x.code==c);
const csTopic=c=>H2H_NS+'-cs-'+String(c).toLowerCase().replace(/[^a-z0-9]/g,'');
const csStd=()=>Object.keys(ROUNDS).filter(r=>{const R=ROUNDS[r];return R&&!R.custom&&!R.legacy&&!R.aba&&!R.league});
/* discipline of a round, from the app's own face helpers */
function csDisc(r){const R=ROUNDS[r];if(!R)return null;const F=faceR(R,0);if(isFld(F))return'field';if(R.vegas||indoor3(R,F))return'indoor';return'target'}
const CS_DISC={target:'Target',indoor:'Indoor',field:'Field'};
const csRounds=d=>csStd().filter(r=>csDisc(r)==d);
/* face for end ei: the same faceR / face3R the main scorer uses (indoor always on a 3-spot) */
function csFace(cs,ei){const R=ROUNDS[cs.round];if(!R)return{face:''};const F=faceR(R,ei);if(isFld(F))return F;if(R.vegas)return face3R(F,{face3:'vegas'});if(indoor3(R,F))return face3R(F,{face3:cs.face3=='vegas'?'vegas':'vert'});return F}
/* score keys: the main scorer's rule (app.js score()), highest first */
function csKeys(cs,ei){const R=ROUNDS[cs.round]||{},FR=csFace(cs,ei||0);if(isFld(FR))return['6','5','4','3','2','1','M'];const xk=R.xs===false?[]:['X'];
 return[...xk,...(isSpot(FR)?['10','9','8','7','6']:isSix(FR)?['10','9','8','7','6','5']:['10','9','8','7','6','5','4','3','2','1']),'M']}
const csKcol=(cs,k)=>cs.disc=='field'||isFld(csFace(cs,0))?(k=='M'?'k-m':+k>=5?'k-y':'k-k'):col(k);
const csFaceTxt=cs=>{const R=ROUNDS[cs.round];if(!R)return'';if(R.vegas)return'Vegas 3-spot';const F=faceR(R,0);if(isFld(F))return'Field face, gold 6 and 5, black 4 to 1';if(indoor3(R,F))return cs.face3=='vegas'?'Vegas 3-spot':'Vertical 3-spot';
 const L=[...new Set((R.blocks||[{}]).map((b,k)=>{let e=0;for(let j=0;j<k;j++)e+=+R.blocks[j].ends;return faceR(R,e).face}))].filter(Boolean);return L.length?L.join(' / '):R.face}
const csR=cs=>ROUNDS[cs.round]||{ends:10,ape:3};
const csEndFace=(cs,ei)=>{const R=ROUNDS[cs.round]||{},F=faceR(R,ei),sz=(String(F.face||'').match(/^\d+(-\d+)?/)||[''])[0];if(isFld(F))return sz+'cm field face';if(R.vegas||indoor3(R,F))return(sz?sz+'cm ':'')+(R.vegas||cs.face3=='vegas'?'Vegas 3-spot':'Vertical 3-spot');return F.face||''};
const csP=(cs,id)=>(cs.ppl||[]).find(p=>p.id==id);
const csNameOnly=(cs,id)=>{const p=csP(cs,id);return!!(p&&!p.tid)};
/* names: social views use the nickname for app users; name-only friends show the name the host typed (tester real names swapped) */
const csNm=(cs,id)=>{const p=csP(cs,id);if(!p)return testerName(id);return p.tid?testerName(p.tid):(window.nmScrub?nmScrub(p.n):p.n)};
/* in setup (host's own phone) adults show their real name, under-16s their nickname */
const csSetupNm=tid=>{const t=TESTERS.find(x=>x.id==tid);return!t?tid:t.junior?testerName(tid):t.name};
const csV=a=>a=='X'?10:a=='M'?0:(+a||0);
const csEnt=(cs,id)=>((cs.sc||{})[id])||null;
const csEnds=(cs,id)=>((csEnt(cs,id)||{}).e||[]).filter(e=>e&&e.length);
const csDoneP=(cs,id)=>{const R=csR(cs),E=csEnds(cs,id);return E.length>=R.ends&&E.every(e=>e.length==R.ape)};
const csTotal=E=>E.flat().reduce((t,a)=>t+csV(a),0);
/* t10/x = the tie-break counts: 10s (incl. X) and Xs; on a field face 6s and 5s */
const csFldS=cs=>cs.disc=='field'||isFld(csFace(cs,0));
const csRow=(cs,id)=>{const E=csEnds(cs,id),R=csR(cs),A=E.flat(),f=csFldS(cs);return{id,nm:csNm(cs,id),E,tot:csTotal(E),n:E.filter(e=>e.length==R.ape).length,arrows:A.length,t10:A.filter(a=>f?a=='6':(a=='X'||a=='10')).length,x:A.filter(a=>f?a=='5':a=='X').length,done:csDoneP(cs,id)}};
const csAllDone=cs=>(cs.ppl||[]).length>=1&&cs.ppl.every(p=>csDoneP(cs,p.id));
const csFin=cs=>!!(cs.fin||csAllDone(cs));
/* match play seeds: archers who finished the round (CS_SEED_FINISHED_ONLY; otherwise everyone who has shot), highest score first,
   ties on 10s then Xs, then the order they were added */
function csSeeds(cs){const ids=(cs.ppl||[]).map(p=>p.id);return ids.map(id=>csRow(cs,id)).filter(r=>CS_SEED_FINISHED_ONLY?r.done:r.arrows>0).sort((a,b)=>b.tot-a.tot||b.t10-a.t10||b.x-a.x||ids.indexOf(a.id)-ids.indexOf(b.id)).map(r=>r.id)}
const csMe=()=>h2hMe();
const csHost=cs=>cs.host==csMe();
const csCanScore=(cs,id)=>{const me=csMe(),p=csP(cs,id);if(!p||!me)return false;if(csHost(cs))return id==me||!p.tid;return id==me&&p.tid==me};
const csLocked=cs=>!!(cs.mp&&cs.mp.on&&cs.mp.seeds&&cs.mp.seeds.length>=2);
/* ---------- name matching (suggestions only; the host must tap to link) ---------- */
function csMatch(raw,taken){const lo=nmClean(raw).toLowerCase();if(lo.length<2)return[];const me=csMe();
 return TESTERS.filter(t=>t.id!=me&&!(taken||[]).includes(t.id)).filter(t=>{const A=[t.name,t.short,t.ad,t.name.split(' ')[0],testerName(t.id),NM_DEF[t.id],...((typeof NM_VARIANTS!='undefined'&&NM_VARIANTS[t.id])||[])].filter(Boolean).map(x=>String(x).toLowerCase());
  return A.includes(lo)||(lo.length>=3&&t.name.toLowerCase().startsWith(lo))}).slice(0,3)}
function csNameCheck(raw){const n=nmClean(raw);if(n.length<2)return{ok:false,n,msg:'Type at least 2 letters.'};if(n.length>16)return{ok:false,n,msg:'Use 16 characters or fewer.'};
 if(!/^[A-Za-z0-9 _-]+$/.test(n))return{ok:false,n,msg:'Use letters, numbers, spaces, - and _ only.'};if(nmRude(n))return{ok:false,n,msg:'Please type a different name.'};
 const lo=n.toLowerCase(),toks=lo.split(/[\s_-]+/);if(NM_REAL.full.some(([,f])=>f.toLowerCase()==lo)||NM_REAL.sur.some(s=>toks.includes(s)))return{ok:false,n,msg:'That is an app member\'s full name. Tap their name to link them, or type just a first name or nickname.'};
 return{ok:true,n,msg:''}}
/* ---------- create, people, scoring ---------- */
const csNid=()=>'n'+h2hCode().slice(0,6).toLowerCase();
function csCreate(o){const me=csMe();if(!me)return null;const P=[];if(o.self)P.push({id:me,tid:me});for(const p of o.ppl||[]){if(P.length>=CS_MAX)break;if(p.tid){if(!P.some(x=>x.id==p.tid))P.push({id:p.tid,tid:p.tid,n:''})}else{const c=csNameCheck(p.n);if(c.ok&&!P.some(x=>!x.tid&&x.n.toLowerCase()==c.n.toLowerCase()))P.push({id:csNid(),n:c.n})}}
 if(P.length<1||!ROUNDS[o.round])return null;const t=Date.now(),code='C'+h2hCode(),disc=csDisc(o.round);
 const cs={code,name:nmClean(o.name||'').slice(0,40)||'Casual shoot',disc,round:o.round,face3:disc=='indoor'&&!ROUNDS[o.round].vegas?(o.face3=='vegas'?'vegas':'vert'):null,date:o.date||today(),host:me,ppl:P,pt:t,sc:{},fin:0,fint:0,
  mp:{on:!!o.mp&&P.length>=2,ask:0,seeds:null,t},status:'active',created:t,dirty:1,invq:P.filter(p=>p.tid&&p.tid!=me).map(p=>p.tid)};csAll().push(cs);save();csTick(true);return cs}
function csAdd(code,p){const cs=csGet(code);if(!cs||!csHost(cs)||cs.ppl.length>=CS_MAX||csFin(cs))return'This shoot already has 10 people.';
 if(p.tid){if(cs.ppl.some(x=>x.tid==p.tid))return'Already in this shoot.';cs.ppl.push({id:p.tid,tid:p.tid,n:''});cs.invq=[...(cs.invq||[]),p.tid]}
 else{const c=csNameCheck(p.n);if(!c.ok)return c.msg;if(cs.ppl.some(x=>!x.tid&&x.n.toLowerCase()==c.n.toLowerCase()))return'That name is already in this shoot.';cs.ppl.push({id:csNid(),n:c.n})}
 cs.pt=Date.now();cs.dirty=1;save();csTick(true);return''}
function csRemove(code,id){const cs=csGet(code);if(!cs||!csHost(cs)||id==cs.host)return false;if(csEnds(cs,id).length)return false;cs.ppl=cs.ppl.filter(p=>p.id!=id);if(cs.sc)delete cs.sc[id];cs.pt=Date.now();cs.dirty=1;save();csTick(true);return true}
/* host: stop waiting for a linked person and score them as a name-only friend */
function csUnlink(code,id){const cs=csGet(code);const p=cs&&csP(cs,id);if(!p||!p.tid||!csHost(cs)||id==cs.host)return false;p.n=testerName(p.tid);p.tid=null;cs.pt=Date.now();cs.dirty=1;save();csTick(true);return true}
function csKey(code,id,k){const cs=csGet(code);if(!cs||!csCanScore(cs,id)||csLocked(cs)||cs.fin)return false;const R=csR(cs);cs.sc=cs.sc||{};const e=cs.sc[id]=cs.sc[id]||{e:[]};
 let E=e.e[e.e.length-1];const nw=!E||E.length>=R.ape;if(nw&&e.e.filter(x=>x&&x.length).length>=R.ends)return false;if(!csKeys(cs,nw?e.e.length:e.e.length-1).includes(k))return false;if(nw){E=[];e.e.push(E)}E.push(k);
 E.sort((a,b)=>csV(b)-csV(a)||(b=='X')-(a=='X'));e.u=Date.now();e.by=csMe();cs.dirty=1;
 if(E.length==R.ape){const ids=cs.ppl.map(p=>p.id).filter(x=>csCanScore(cs,x)),s=ids.indexOf(id);window._csAct=null;for(let j=1;j<=ids.length;j++){const n=ids[(s+j)%ids.length];if(!csDoneP(cs,n)){window._csAct=n;break}}}
 csAfter(cs);return true}
function csUndo(code,id){const cs=csGet(code);if(!cs||!csCanScore(cs,id)||csLocked(cs)||cs.fin)return false;const e=csEnt(cs,id);if(!e||!e.e.length)return false;let E=e.e[e.e.length-1];if(E&&!E.length){e.e.pop();E=e.e[e.e.length-1]}if(!E)return false;E.pop();if(!E.length)e.e.pop();
 e.u=Date.now();e.by=csMe();cs.dirty=1;csAfter(cs);return true}
/* my own finished score is also kept with my other sessions (tagged with the shoot) */
function csOwnSession(cs){const me=csMe();if(!csP(cs,me)||!csDoneP(cs,me))return;const id='cs-'+cs.code;let s=S.sessions.find(x=>x.id==id);const E=csEnds(cs,me).map(e=>e.slice());
 if(!s){s={id,date:cs.date||today(),round:cs.round,ends:E,pos:E.map(()=>[]),note:'Casual shoot: '+cs.name,casual:cs.code};if(cs.face3)s.face3=cs.face3;if(ROUNDS[cs.round].vegas)s.face3='vegas';S.sessions.push(s)}else s.ends=E}
function csAfter(cs){csOwnSession(cs);if(csFin(cs)&&cs.mp&&cs.mp.on&&!cs.mp.seeds&&csHost(cs))csMpStart(cs.code,true);save();csMatchSync(cs);if($('#csview')&&window._csv==cs.code)csView(cs.code);csTick(true)}
function csFinish(code){const cs=csGet(code);if(!cs||!csHost(cs)||cs.fin)return;cs.fin=1;cs.fint=Date.now();cs.dirty=1;csAfter(cs)}
/* ---------- match play (shootup.js ladder) ---------- */
const csMpCode=cs=>cs.code+'M';
const csRule=cs=>({ends:CS_MP_ENDS,ape:3,xv:10,t12:false,so:'pick1',keys:csKeys(cs,0),fld:isFld(csFace(cs,0))});
function csMatchSync(cs){const on=cs.mp&&cs.mp.on&&cs.mp.seeds&&cs.mp.seeds.length>=2,code=csMpCode(cs);let m=h2hGet(code);
 if(!on){if(m){S.matches=h2hAll().filter(x=>x.code!=code);save()}return null}
 const seeds=cs.mp.seeds.filter(id=>csP(cs,id)),ops={},names={};for(const id of seeds){ops[id]={ends:csEnds(cs,id),done:true};names[id]=csNm(cs,id)}
 const nmo=seeds.filter(id=>csNameOnly(cs,id));
 if(!m){m={code,g:1,cs:cs.code,round:cs.round,mode:'total',host:cs.host,a:cs.host,opp:cs.host,order:seeds.slice(),ops,names,nmo,inv:[],created:Date.now(),status:'active',su:{seeds:seeds.slice(),t:cs.mp.t||Date.now()},sur:csRule(cs)};h2hAll().push(m)}
 else{Object.assign(m,{ops,names,nmo,host:cs.host,sur:csRule(cs)});if(JSON.stringify(m.su.seeds)!=JSON.stringify(seeds)){m.su={seeds:seeds.slice(),t:cs.mp.t||Date.now()};m.order=seeds.slice();m.lad={};m.pk={};m.sm={}}}
 save();return m}
function csMpStart(code,quiet){const cs=csGet(code);if(!cs||!csHost(cs))return false;const seeds=csSeeds(cs);if(seeds.length<2)return false;cs.fin=cs.fin||1;cs.fint=cs.fint||Date.now();cs.mp={on:true,ask:1,seeds,t:Date.now()};cs.dirty=1;save();csMatchSync(cs);csTick(true);return true}
function csMpOff(code){const cs=csGet(code);if(!cs||!csHost(cs))return false;cs.mp={on:false,ask:1,seeds:null,t:Date.now()};cs.dirty=1;save();csMatchSync(cs);csTick(true);return true}
function csMpSetup(code,on){const cs=csGet(code);if(!cs||!csHost(cs))return false;if(!on)return csMpOff(code);if(cs.ppl.length<2)return false;if(csFin(cs))return csMpStart(code);cs.mp={on:true,ask:0,seeds:null,t:Date.now()};cs.dirty=1;save();csTick(true);return true}
function csMpDismiss(code){const cs=csGet(code);if(!cs||!csHost(cs))return;cs.mp=Object.assign({},cs.mp,{ask:1,t:Date.now()});cs.dirty=1;save();csTick(true)}
/* ---------- relay ---------- */
const csEnc=E=>E.map(e=>e.map(a=>a=='10'?'T':a).join('')).join('/');
const CS_OK=['X','10','9','8','7','6','5','4','3','2','1','M'];
const csDec=(s,R)=>String(s||'').split('/').filter(x=>x!=='').slice(0,R.ends).map(e=>[...e].slice(0,R.ape).map(c=>c=='T'?'10':c).filter(a=>CS_OK.includes(a)));
function csSnapParts(cs){const me=csMe(),host=csHost(cs),head={k:'cs',code:cs.code,by:me,...h2hNm()};
 if(host)Object.assign(head,{name:cs.name,disc:cs.disc,round:cs.round,face3:cs.face3||'',date:cs.date,host:cs.host,ppl:cs.ppl.map(p=>p.tid?{id:p.id,tid:p.tid}:{id:p.id,n:csNm(cs,p.id)}),pt:cs.pt||0,fin:cs.fin||0,fint:cs.fint||0,mp:cs.mp||{}});
 const items=[];for(const id in cs.sc||{}){const e=cs.sc[id];if(e&&e.e&&e.e.length)items.push([id,{e:csEnc(e.e),u:e.u||0,by:e.by||''}])}
 const parts=[];let cur0={};const size=o=>JSON.stringify(o).length;
 for(const [id,v] of items){const c2={...cur0,[id]:v};if(Object.keys(cur0).length&&size({...head,sc:c2})>3300){parts.push(cur0);cur0={[id]:v}}else cur0=c2}
 parts.push(cur0);const t=Date.now();return parts.map((sc,k)=>({...head,sc,part:k+1,np:parts.length,t}))}
function csMerge(cs,d){if(!d||d.code!=cs.code||(d.t||0)<H2H_RESET)return false;let ch=false;const fromHost=!cs.host||d.by==cs.host,me=csMe();
 if(d.nm&&nmLearn(d.by,d.nm,d.nt,d.t))ch=true;
 if(d.by!=me&&csP(cs,d.by)&&!(cs.seen||{})[d.by]){(cs.seen=cs.seen||{})[d.by]=1;ch=true}
 if(d.k=='csno'){if(csHost(cs)){const p=csP(cs,d.by);if(p&&p.tid==d.by){p.n=testerName(p.tid);p.tid=null;cs.pt=Date.now();cs.dirty=1;ch=true}}return ch}
 if(d.k!='cs')return false;
 if(fromHost&&typeof d.round=='string'&&ROUNDS[d.round]){if(!cs.host&&typeof d.host=='string'){cs.host=d.host;ch=true}
  if(Array.isArray(d.ppl)&&(d.pt||0)>(cs.pt||0)){cs.ppl=d.ppl.slice(0,CS_MAX).filter(p=>p&&typeof p.id=='string'&&p.id.length<=16).map(p=>typeof p.tid=='string'&&nmIdx(p.tid)>=0?{id:p.tid,tid:p.tid,n:''}:{id:p.id,n:nmClean(String(p.n||'')).slice(0,16)||'Archer'});cs.pt=d.pt;ch=true}
  for(const k of['name','round','disc','date'])if(typeof d[k]=='string'&&d[k]&&cs[k]!=d[k]){cs[k]=k=='name'?nmClean(d[k]).slice(0,40):d[k];ch=true}
  const f3=d.face3=='vegas'?'vegas':d.face3=='vert'?'vert':null;if(cs.face3!=f3){cs.face3=f3;ch=true}
  if((d.fint||0)>(cs.fint||0)){cs.fin=d.fin?1:0;cs.fint=d.fint;ch=true}
  if(d.mp&&typeof d.mp=='object'&&(d.mp.t||0)>((cs.mp||{}).t||0)){cs.mp={on:!!d.mp.on,ask:d.mp.ask?1:0,seeds:Array.isArray(d.mp.seeds)?d.mp.seeds.filter(x=>typeof x=='string').slice(0,CS_MAX):null,t:d.mp.t};ch=true}}
 const R=csR(cs);cs.sc=cs.sc||{};for(const id in d.sc||{}){const p=csP(cs,id);if(!p)continue;/* only the host (for themselves and name-only friends) or the linked archer themselves */
  const v=d.sc[id];if(!v||typeof v!='object')continue;/* who scored it: the host (themselves or a name-only friend) or the linked archer themselves; any phone may pass it on */
  const by=typeof v.by=='string'?v.by:'',ok=(by==cs.host&&(id==cs.host||!p.tid))||(p.tid&&id==by);if(!ok)continue;const mine=csEnt(cs,id);if(mine&&(mine.u||0)>=(+v.u||0))continue;
  if(id==me&&by!=me)continue;cs.sc[id]={e:csDec(v.e,R),u:+v.u||0,by};ch=true}
 if(ch){csOwnSession(cs);csMatchSync(cs)}return ch}
let csBusy=false;const csOpened={};
async function csTick(force){if(csBusy||!TESTER)return;csBusy=true;let ch=false;const me=csMe();try{for(const cs of csAll()){if(cs.status=='invite')continue;
  if(csHost(cs)&&cs.invq&&cs.invq.length){const left=[];for(const to of cs.invq){if(!csP(cs,to))continue;if(!await h2hPost(h2hInbox(to),{k:'csinv',code:cs.code,name:cs.name,round:cs.round,from:me,to,...h2hNm(),t:Date.now()}))left.push(to)}cs.invq=left;save()}
  if(cs.nosend){if(await h2hPost(csTopic(cs.code),{k:'csno',code:cs.code,by:me,t:Date.now()}))cs.nosend=0;save();continue}
  const L=await h2hPoll(csTopic(cs.code),cs.since);if(L&&L.length){for(const d of L){cs.since=d._id;if(csMerge(cs,d))ch=true}save()}
  if(cs.dirty||!csOpened[cs.code]||Date.now()-(cs.posted||0)>CS_SNAP){let ok=true;for(const o of csSnapParts(cs))if(!await h2hPost(csTopic(cs.code),o)){ok=false;break}
   if(ok){cs.posted=Date.now();cs.dirty=0;cs.qfail=0;csOpened[cs.code]=1}else cs.qfail=1;save()}}}
 finally{csBusy=false}
 if($('#csview')&&window._csv){const q=$('#csq');if(ch)csView(window._csv);else if(q){const cs=csGet(window._csv);if(cs)q.textContent=csQTxt(cs)}}else if(ch&&$('#cscard')&&!cur&&view=='score'&&!window._csMode)score()}
setInterval(()=>{if(!document.hidden)csTick()},20000);setTimeout(()=>csTick(true),3000);addEventListener('online',()=>csTick(true));
window.csInvite=function(d){const me=csMe();if(d.to!=me||d.from==me||!d.code||csGet(d.code)||(d.t||0)<H2H_RESET||!ROUNDS[d.round])return false;if(d.nm)nmLearn(d.from,d.nm,d.nt,d.t);
 csAll().push({code:d.code,name:nmClean(String(d.name||'Casual shoot')).slice(0,40),round:d.round,disc:csDisc(d.round),host:d.from,ppl:[{id:d.from,tid:d.from},{id:me,tid:me}],pt:0,sc:{},mp:{},status:'invite',created:d.t||Date.now()});save();return true};
const csQTxt=cs=>cs.qfail?'Offline: saved on this phone, it will send when you are back online.':cs.dirty?'Sending...':'Saved and sent.';
window.csCreate=csCreate;window.csAdd=csAdd;window.csRemove=csRemove;window.csUnlink=csUnlink;window.csKey=csKey;window.csUndo=csUndo;window.csFinish=csFinish;window.csSeeds=csSeeds;window.csMatch=csMatch;window.csNameCheck=csNameCheck;
window.csMpStart=csMpStart;window.csMpOff=csMpOff;window.csMpSetup=csMpSetup;window.csTick=csTick;window.csMerge=csMerge;window.csSnapParts=csSnapParts;window.csKeys=csKeys;window.csRounds=csRounds;window.csDisc=csDisc;window.csFaceTxt=csFaceTxt;
/* ---------- screens ---------- */
const csSeg=(name,opts,val,dis)=>`<span class="lg-segs cs-segs" role="group">${opts.map(([v,l])=>`<button type="button" class="lg-seg${v==val?' on':''}" data-${name}="${v}" aria-pressed="${v==val}" ${dis?'disabled':''}>${v==val?'&#10003; ':''}${l}</button>`).join('')}</span>`;
/* setup draft survives re-renders (relay ticks redraw the Score tab) */
const csDraft=()=>window._csD=window._csD||{disc:'target',round:null,face3:'vert',self:true,ppl:[],mp:false,name:'',typed:'',msg:''};
function csSetupHtml(){const D=csDraft(),R0=csRounds(D.disc);if(!R0.includes(D.round))D.round=R0.includes(S.lastRound)?S.lastRound:R0[0];
 const n=(D.self?1:0)+D.ppl.length,tmp={round:D.round,face3:D.face3,disc:D.disc},ind=D.disc=='indoor'&&!(ROUNDS[D.round]||{}).vegas,taken=D.ppl.filter(p=>p.tid).map(p=>p.tid),sug=n<CS_MAX?csMatch(D.typed,taken):[];
 return`<div id="cssetup"><h2 style="margin:6px 0 2px">Casual shoot</h2><p class="small muted" style="margin:0 0 8px">A one-off shoot with friends. Not part of any league. 1 to ${CS_MAX} people.</p>
 <label for="csname">Name (optional)</label><input id="csname" maxlength="40" placeholder="Casual shoot" value="${esc(D.name)}">
 <label>Discipline</label>${csSeg('csdisc',Object.entries(CS_DISC),D.disc)}
 <label for="csrd">Round</label><select id="csrd">${R0.map(r=>`<option ${r==D.round?'selected':''}>${esc(r)}</option>`).join('')}</select>
 ${ind?`<label>Face</label>${csSeg('csf3',[['vert','Vertical 3-spot'],['vegas','Vegas 3-spot']],D.face3)}`:''}
 <p class="small" id="csfacetxt" style="margin:6px 0">${esc(csFaceTxt(tmp))} · keys ${csKeys(tmp,0).join(' ')}</p>
 <label for="csdt">Date</label><input id="csdt" type="date" value="${esc(D.date||today())}">
 <fieldset class="h2hops"><legend>Who's shooting (${n} of ${CS_MAX})</legend>
 <label class="h2htk"><input type="checkbox" id="csself" ${D.self?'checked':''}> I'm shooting too</label>
 ${D.ppl.map((p,k)=>`<div class="list-item row cs-person"><span><b>${esc(p.tid?csSetupNm(p.tid):p.n)}</b> <span class="small">${p.tid?'has the app, linked':'name only, you score for them'}</span></span><button type="button" class="btn ghost" data-csdel="${k}" aria-label="Remove">Remove</button></div>`).join('')}
 ${n<CS_MAX?`<div class="row" style="gap:6px;margin-top:6px"><input id="cstype" maxlength="40" autocomplete="off" placeholder="Type a name" value="${esc(D.typed)}" style="flex:1"><button type="button" class="btn ghost" id="csaddn">Add</button></div>
 <div id="cssug">${sug.map(t=>`<button type="button" class="lc-chip cs-sug" data-cslink="${t.id}">Link ${esc(csSetupNm(t.id))} <span class="small">· has the app</span></button>`).join('')}${sug.length?`<p class="small muted" style="margin:4px 0">Is that them? Tap to link, so they can see the shoot and score themselves. Or tap Add to keep it as a name only.</p>`:''}</div>`:`<p class="small">That's the maximum of ${CS_MAX} people.</p>`}
 <p class="small" id="csmsg" role="alert" style="font-weight:600;margin:4px 0">${esc(D.msg||'')}</p></fieldset>
 <label>Match play after the shoot</label>${n>=2?csSeg('csmp',[['off','Off'],['on','On']],D.mp?'on':'off'):`<p class="small muted" id="csmpna" style="margin:2px 0">Needs 2 or more people.</p>`}
 <p class="small muted" style="margin:4px 0">You can switch match play on or off later too.</p>
 <button class="btn alt full" id="csgo" style="margin-top:10px" ${n<1?'disabled':''}>Start casual shoot</button></div>`}
function csBindSetup(root){const D=csDraft(),q=s=>root.querySelector(s),re=()=>score();
 const keep=()=>{const a=q('#csname'),b=q('#csdt'),c=q('#cstype');if(a)D.name=a.value;if(b)D.date=b.value;if(c)D.typed=c.value};
 root.querySelectorAll('[data-csdisc]').forEach(b=>b.onclick=()=>{keep();D.disc=b.dataset.csdisc;D.round=null;re()});
 root.querySelectorAll('[data-csf3]').forEach(b=>b.onclick=()=>{keep();D.face3=b.dataset.csf3;re()});
 root.querySelectorAll('[data-csmp]').forEach(b=>b.onclick=()=>{keep();D.mp=b.dataset.csmp=='on';re()});
 const rd=q('#csrd');if(rd)rd.onchange=()=>{keep();D.round=rd.value;re()};
 const sf=q('#csself');if(sf)sf.onchange=()=>{keep();if(sf.checked&&D.ppl.length>=CS_MAX){D.msg='That\'s already 10 people.';re();return}D.self=sf.checked;re()};
 root.querySelectorAll('[data-csdel]').forEach(b=>b.onclick=()=>{keep();D.ppl.splice(+b.dataset.csdel,1);D.msg='';re()});
 const ty=q('#cstype');if(ty){ty.oninput=()=>{D.typed=ty.value;const taken=D.ppl.filter(p=>p.tid).map(p=>p.tid),sg=csMatch(ty.value,taken),w=q('#cssug');if(w){w.innerHTML=sg.map(t=>`<button type="button" class="lc-chip cs-sug" data-cslink="${t.id}">Link ${esc(csSetupNm(t.id))} <span class="small">· has the app</span></button>`).join('')+(sg.length?`<p class="small muted" style="margin:4px 0">Is that them? Tap to link, so they can see the shoot and score themselves. Or tap Add to keep it as a name only.</p>`:'');bindLink()}};
  ty.onkeydown=e=>{if(e.key=='Enter'){e.preventDefault();q('#csaddn').click()}}}
 const full=()=>(D.self?1:0)+D.ppl.length>=CS_MAX;
 const bindLink=()=>root.querySelectorAll('[data-cslink]').forEach(b=>b.onclick=()=>{keep();if(full()){D.msg='That\'s the maximum of 10 people.';return re()}D.ppl.push({tid:b.dataset.cslink});D.typed='';D.msg='';re()});bindLink();
 const ad=q('#csaddn');if(ad)ad.onclick=()=>{keep();if(full()){D.msg='That\'s the maximum of 10 people.';return re()}const c=csNameCheck(D.typed);if(!c.ok){D.msg=c.msg;return re()}
  if(D.ppl.some(p=>!p.tid&&p.n.toLowerCase()==c.n.toLowerCase())){D.msg='That name is already in.';return re()}D.ppl.push({n:c.n});D.typed='';D.msg='';re();const t=$('#cstype');if(t)t.focus()};
 const go=q('#csgo');if(go)go.onclick=()=>{keep();const n=(D.self?1:0)+D.ppl.length;if(n<1){D.msg='Add at least 1 person.';return re()}if(n>CS_MAX){D.msg='10 people at most.';return re()}
  const cs=csCreate({name:D.name,round:D.round,face3:D.face3,date:D.date,self:D.self,ppl:D.ppl,mp:D.mp&&n>=2});if(!cs){D.msg='Could not start. Check the names.';return re()}window._csD=null;window._csMode=null;S.lastRound=cs.round;save();csView(cs.code)}}
function csListCard(){if(!TESTER)return'';const L=csAll().filter(x=>x.status!='declined').slice().reverse();if(!L.length)return'';
 return`<div class="card" id="cscard"><span class="kicker">Casual shoots</span>${L.map(cs=>cs.status=='invite'?`<div class="list-item"><b>${esc(testerName(cs.host))} added you to a casual shoot: ${esc(cs.name)}</b><div class="small muted">${esc(cs.round)}</div><div class="row" style="gap:6px;justify-content:flex-start;margin-top:6px"><button class="btn alt" data-csacc="${cs.code}">Join</button><button class="btn ghost" data-csno="${cs.code}">Not me</button></div></div>`
  :`<div class="list-item row"><span><b>${esc(cs.name)}</b><div class="small muted">${esc(cs.round)} · ${plN(cs.ppl.length,'person','people')} · ${csFin(cs)?'finished':'shooting'}${cs.mp&&cs.mp.on?' · match play':''}</div></span><button class="btn ghost" data-csopen="${cs.code}">Open</button></div>`).join('')}</div>`}
function csBindList(){const c=$('#cscard');if(!c)return;c.querySelectorAll('[data-csopen]').forEach(b=>b.onclick=()=>csView(b.dataset.csopen));
 c.querySelectorAll('[data-csacc]').forEach(b=>b.onclick=()=>{const cs=csGet(b.dataset.csacc);cs.status='active';cs.dirty=1;save();csTick(true).then(()=>{if(window._csv==cs.code)csView(cs.code)});csView(cs.code)});
 c.querySelectorAll('[data-csno]').forEach(b=>b.onclick=()=>{const cs=csGet(b.dataset.csno);if(!cs)return;cs.status='declined';cs.nosend=1;save();(async()=>{await h2hPost(csTopic(cs.code),{k:'csno',code:cs.code,by:csMe(),t:Date.now()});S.casual=csAll().filter(x=>x.code!=cs.code);save()})();S.casual=csAll().filter(x=>x.code!=cs.code||x.nosend);save();score()})}
/* the Score tab: choose the kind of shoot first */
const CS_TYPES=[['solo','Just me'],['casual','Casual shoot'],['league','League shoot']];
const _csScore=score;score=function(){const o=_csScore.apply(this,arguments);try{csDecorate()}catch(e){console.error(e)}return o};
function csDecorate(){if(cur||!TESTER||!$('#rd')||$('#csview'))return;const first=$('#rd').closest('.card');if(!first)return;const mode=window._csMode||'solo';
 first.insertAdjacentHTML('afterbegin',`<div id="cstype0"><label>What are you shooting?</label>${csSeg('cstp',CS_TYPES,mode)}</div>`);
 if(mode=='casual'){[...first.children].forEach(x=>{if(x.id!='cstype0')x.remove()});first.insertAdjacentHTML('beforeend',csSetupHtml());csBindSetup(first)}
 else if(mode=='league'){[...first.children].forEach(x=>{if(x.id!='cstype0')x.remove()});first.insertAdjacentHTML('beforeend',`<p class="small" id="csleague" style="margin:8px 0 0">League shoots are scored inside your league, below. Open your league and tap Score my week.</p>`)}
 const lc=$('#lgcard');if(mode=='league'&&lc){const p=lc.parentNode;p.insertBefore(lc,first.nextSibling)}
 first.insertAdjacentHTML('afterend',csListCard());csBindList();
 first.querySelectorAll('[data-cstp]').forEach(b=>b.onclick=()=>{window._csMode=b.dataset.cstp=='solo'?null:b.dataset.cstp;score();if(b.dataset.cstp=='league'){const l=$('#lgcard');if(l)l.scrollIntoView({block:'start'})}})}
function csEntryCard(cs){const R=csR(cs),ids=cs.ppl.map(p=>p.id).filter(id=>csCanScore(cs,id));if(!ids.length||csLocked(cs)||cs.fin)return'';
 const a0=window._csAct&&ids.includes(window._csAct)?window._csAct:null,a=a0||ids.find(id=>!csDoneP(cs,id))||ids[0],e=csEnt(cs,a)||{e:[]},last=e.e[e.e.length-1],cur3=last&&last.length<R.ape?last:[],done=csDoneP(cs,a);
 const en=Math.min(R.ends,e.e.length+(last&&last.length<R.ape?0:1)),K=csKeys(cs,en-1),F=csFace(cs,en-1);
 return`<div class="card" id="csentry"><span class="kicker">Score card</span>${ids.length>1?`<div class="row lc-chips" style="gap:6px;flex-wrap:wrap;justify-content:flex-start">${ids.map(id=>{const r=csRow(cs,id);return`<button class="lc-chip${id==a?' on':''}" data-csid="${esc(id)}">${esc(r.nm)} <span class="small">${r.done?'finished':r.n+'/'+R.ends}</span></button>`}).join('')}</div>`:''}
 <p style="margin:8px 0 4px"><b>${esc(csNm(cs,a))}</b>${a==csMe()?' (you)':''} · ${done?'finished':'End '+en+' of '+R.ends} · ${esc(csEndFace(cs,en-1))}${F.dist&&!/undefined/.test(F.dist)?' · '+esc(F.dist):''}</p>
 ${done?'':`<div class="vg-slots">${Array.from({length:R.ape},(_,j)=>`<span class="vg-slot${cur3[j]?' on':''}">${cur3[j]?esc(cur3[j]):''}</span>`).join('')}</div>
 <div class="ad-pad lc-pad" style="--cols:${K.length>8?Math.ceil(K.length/2):K.length};margin-top:8px">${K.map(k=>`<button class="${csKcol(cs,k)}" data-csk="${k}" aria-label="score ${k}">${k}</button>`).join('')}</div>`}
 <button class="btn ghost" id="csundo" style="margin-top:6px" ${csEnds(cs,a).length?'':'disabled'}>Undo last arrow</button></div>`}
function csView(code){const cs=csGet(code);if(!cs)return;window._csv=code;cur=null;$('#tabs').hidden=false;const me=csMe(),host=csHost(cs),R=csR(cs),fin=csFin(cs),rows=cs.ppl.map(p=>csRow(cs,p.id)),m=cs.mp&&cs.mp.on&&cs.mp.seeds?csMatchSync(cs):null;
 if(cs.status=='invite'){app.innerHTML=`<div id="csview"><div class="card dark"><span class="kicker">Casual shoot</span><h1>${esc(cs.name)}</h1><p class="small">${esc(testerName(cs.host))} added you. Tap Join on your Score tab.</p></div></div>`;return}
 const mpOk=cs.ppl.length>=2,seedsN=csSeeds(cs).length,lad=m&&window.suLadder?suLadder(m):[],mpDone=lad.length&&lad[lad.length-1].res.winner;
 const ask=host&&fin&&mpOk&&!(cs.mp&&cs.mp.on)&&!(cs.mp&&cs.mp.ask)&&seedsN>=2;
 const tab=`<table class="ad-tab cs-tab" style="width:100%"><thead><tr><th>Archer</th><th>Ends</th><th>Score</th><th>${csFldS(cs)?'6s':'10s'}</th><th>${csFldS(cs)?'5s':'X'}</th></tr></thead><tbody>${rows.map(r=>{const p=csP(cs,r.id);return`<tr data-csrow="${esc(r.id)}"><td>${esc(r.nm)}${r.id==me?' (you)':''}${p&&!p.tid?' <span class="small muted">name only</span>':''}${p&&p.tid&&p.tid!=cs.host&&!(cs.seen||{})[p.tid]&&!csEnds(cs,r.id).length&&host?' <span class="small muted">invited</span>':''}</td><td>${r.n}/${R.ends}</td><td><b>${r.tot}</b></td><td>${r.t10}</td><td>${r.x}</td></tr>`}).join('')}</tbody></table>
 <p class="small muted" style="margin:4px 0 0">This shoot's scores only, in the order people were added. Not counted in any league.</p>`;
 const ends=`<details id="csends"><summary class="small">Ends for each archer</summary>${rows.map(r=>`<div class="small" style="margin:6px 0"><b>${esc(r.nm)}</b>: ${r.E.length?r.E.map((e,i)=>`E${i+1} ${esc(e.join(' '))} (${csTotal(e)})`).join(' · '):'no ends yet'}</div>`).join('')}</details>`;
 const mpCard=!mpOk?`<div class="card" id="csmp"><p class="small muted" style="margin:0">Match play needs 2 or more archers.</p></div>`
  :`<div class="card" id="csmp"><span class="kicker">Match play</span>${ask?`<div id="csask"><h3 style="margin:2px 0 4px">Do match play?</h3><p class="small" style="margin:0 0 8px">Seeded from this shoot's scores, highest score is seed 1${CS_SEED_FINISHED_ONLY?' (only archers who finished every end)':''}. ${CS_MP_ENDS} ends of 3 a match, winner moves up.</p><div class="row" style="gap:6px;justify-content:flex-start"><button class="btn alt" id="csyes">Yes, start match play</button><button class="btn ghost" id="csnot">No thanks</button></div></div>`:''}
  ${host?`<div class="row" style="gap:8px;justify-content:flex-start;align-items:center;margin-top:${ask?'10':'0'}px"><span class="small">Match play</span>${csSeg('csmpt',[['off','Off'],['on','On']],cs.mp&&cs.mp.on?'on':'off')}</div>`:`<p class="small" style="margin:0">Match play is ${cs.mp&&cs.mp.on?'on':'off'}.</p>`}
  <p class="small muted" style="margin:6px 0 0">${cs.mp&&cs.mp.on?(m?'Seeded from this shoot\'s scores. Results stay with this shoot.':'Starts when the shoot is finished, seeded from the scores.'):'Off. '+(host?'Switch it on any time, even after the shoot.':'')}</p>
  ${m?`<button class="btn alt full" id="csmpopen" style="margin-top:8px">${mpDone?'Match play result':'Open match play'}</button>`:''}<p class="small" id="csmpmsg" role="alert"></p></div>`;
 const addBox=host&&!fin&&cs.ppl.length<CS_MAX?`<details id="csmore"><summary class="small">Add someone (${cs.ppl.length} of ${CS_MAX})</summary><div class="row" style="gap:6px;margin-top:6px"><input id="csvtype" maxlength="40" autocomplete="off" placeholder="Type a name" style="flex:1"><button class="btn ghost" id="csvadd">Add</button></div><div id="csvsug"></div><p class="small" id="csvmsg" role="alert"></p></details>`:'';
 const ppl=host&&!fin?`<details id="cspeople"><summary class="small">People</summary>${cs.ppl.map(p=>`<div class="list-item row"><span>${esc(p.tid?(p.tid==me?testerName(me)+' (you)':csSetupNm(p.tid)):p.n)} <span class="small muted">${p.tid?(p.tid==me?'host':'has the app, scores themselves'):'name only, you score for them'}</span></span><span>${p.tid&&p.tid!=me&&!csEnds(cs,p.id).length?`<button class="btn ghost" data-csunl="${esc(p.id)}">Score for them</button>`:''}${p.id!=cs.host&&!csEnds(cs,p.id).length?`<button class="btn ghost" data-csrm="${esc(p.id)}">Remove</button>`:''}</span></div>`).join('')}</details>`:'';
 app.innerHTML=`<div id="csview"><div class="card dark"><span class="kicker">Casual shoot · ${esc(CS_DISC[cs.disc]||'')}</span><h1>${esc(cs.name)}</h1>
 <p class="small" style="margin:0">${esc(cs.round)} · ${esc(csFaceTxt(cs))} · ${plN(R.ends,'end','ends')} of ${R.ape} · ${esc(cs.date||'')}</p><p class="small" style="margin:4px 0 0">${fin?'Finished.':'Shooting now.'} Hosted by ${host?'you':esc(testerName(cs.host))}.</p></div>
 ${csAllDone(cs)?'':csEntryCard(cs)}
 <div class="card"><h3>Scores</h3>${tab}${ends}</div>
 ${csAllDone(cs)&&csEntryCard(cs)?`<details class="card" id="csfix" ${window._csFix?'open':''}><summary class="small">Fix a score</summary>${csEntryCard(cs).replace('<div class="card" id="csentry">','<div id="csentry">')}</details>`:''}
 ${mpCard}
 <div class="card">${addBox}${ppl}${host&&!fin?`<button class="btn ghost" id="csfin" style="margin-top:8px">Finish shoot</button>`:''}
 <p class="small muted" id="csq" style="margin:8px 0 4px">${csQTxt(cs)}</p><div class="row" style="gap:6px;justify-content:flex-start;flex-wrap:wrap"><button class="btn ghost" id="csrf">Refresh now</button><button class="btn ghost" id="csback">Back to Score</button>${fin?`<button class="btn ghost" id="csdel">Remove from this phone</button>`:''}</div></div></div>`;
 const q=s=>app.querySelector(s);if(q('#csfix'))q('#csfix').ontoggle=()=>{window._csFix=q('#csfix').open};
 app.querySelectorAll('[data-csid]').forEach(b=>b.onclick=()=>{window._csAct=b.dataset.csid;csView(code)});
 const act=q('#csentry .lc-chip.on')?q('#csentry .lc-chip.on').dataset.csid:(cs.ppl.map(p=>p.id).filter(id=>csCanScore(cs,id))[0]);
 app.querySelectorAll('[data-csk]').forEach(b=>b.onclick=()=>{window._csAct=act;csKey(code,act,b.dataset.csk)});
 if(q('#csundo'))q('#csundo').onclick=()=>{window._csAct=act;csUndo(code,act)};
 if(q('#csyes'))q('#csyes').onclick=()=>{if(!csMpStart(code))q('#csmpmsg').textContent='Needs 2 or more archers with scores.';csView(code)};
 if(q('#csnot'))q('#csnot').onclick=()=>{csMpDismiss(code);csView(code)};
 app.querySelectorAll('[data-csmpt]').forEach(b=>b.onclick=()=>{const on=b.dataset.csmpt=='on';if(!on&&m&&lad.some(x=>x.res.live)&&!confirm('Switch match play off? Its scores are cleared.'))return;if(!csMpSetup(code,on)){q('#csmpmsg').textContent='Needs 2 or more archers with scores.';return}csView(code)});
 if(q('#csmpopen'))q('#csmpopen').onclick=()=>suLadderView(csMpCode(cs));
 if(q('#csfin'))q('#csfin').onclick=()=>{if(!csAllDone(cs)&&!confirm('Finish the shoot now? Unfinished scores stay as they are.'))return;csFinish(code)};
 app.querySelectorAll('[data-csrm]').forEach(b=>b.onclick=()=>{csRemove(code,b.dataset.csrm);csView(code)});
 app.querySelectorAll('[data-csunl]').forEach(b=>b.onclick=()=>{csUnlink(code,b.dataset.csunl);csView(code)});
 const vt=q('#csvtype');if(vt){const sug=()=>{const sg=csMatch(vt.value,cs.ppl.filter(p=>p.tid).map(p=>p.tid));q('#csvsug').innerHTML=sg.map(t=>`<button type="button" class="lc-chip cs-sug" data-csvlink="${t.id}">Link ${esc(csSetupNm(t.id))} <span class="small">· has the app</span></button>`).join('');
  app.querySelectorAll('[data-csvlink]').forEach(b=>b.onclick=()=>{const e=csAdd(code,{tid:b.dataset.csvlink});if(e){q('#csvmsg').textContent=e;return}window._csMore=1;csView(code)})};vt.oninput=sug;
  q('#csvadd').onclick=()=>{const e=csAdd(code,{n:vt.value});if(e){q('#csvmsg').textContent=e;return}window._csMore=1;csView(code)};if(window._csMore){q('#csmore').open=true;window._csMore=0}}
 q('#csrf').onclick=()=>csTick(true);q('#csback').onclick=()=>{window._csv=null;nav('score')};
 if(q('#csdel'))q('#csdel').onclick=()=>{if(!confirm('Remove this casual shoot from this phone? Other phones keep it.'))return;S.casual=csAll().filter(x=>x.code!=code);S.matches=h2hAll().filter(x=>x.code!=csMpCode(cs));save();window._csv=null;nav('score')};
 scrollTo(0,0)}
window.csView=csView;
/* leaving the shoot view by the tabs clears it */
const _csNav=nav;nav=function(v){if(v!='score')window._csMode=null;window._csv=null;return _csNav.apply(this,arguments)};
