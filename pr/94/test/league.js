/* Leagues (20 Oct 2026).
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
   sent when the phone is back online. Payloads: archer ids, nicknames, ends only. */
const LG_R='Vegas 300 (18 m)',LG_W=6,LG_SNAP=6*36e5,LG_EXCL=[],LG_KEYS=['X','10','9','8','7','6','M'],LG_FACE='Vertical 3-spot';
/* shown text: the league round is '300 (18 m)', never 'Vegas' (Coach re-test, 20 Oct). The ROUNDS key stays for stored data. */
const LG_RL='300 (18 m)',rdLabel=r=>r==LG_R?LG_RL:r;window.rdLabel=rdLabel;
const LG_FINTXT='Final: 3 ends of 3 arrows, X = 10, no 12 dot. Ties: 1 arrow each, closest to the middle wins (host picks).';
const lgAll=()=>S.leagues=S.leagues||[],lgGet=c=>lgAll().find(l=>l.code==c);
const lgTopic=c=>{const code=String(c).toLowerCase().replace(/[^a-z0-9]/g,'');return code==='lingkn26'?H2H_NS+'-lg-lingkn26-live2':H2H_NS+'-lg-'+code};
/* Added shooters (22 Oct 2026, Nathe): people who won't score themselves (no app). The host, or Nathe as admin, adds them by name
   (under-16s by nickname only) and enters and edits their weekly 300s. Stored in lg.gn {id:{n,j,t,by}} (ids 'g' + 6 characters, never
   a tester id) and in lg.order like anyone else, so they're in the table, the 10-archer max and the day-6 shoot-up seeding. They sync
   in the league snapshot (gn), accepted only from the host or the admin. Nothing existing is changed: they are only added. */
const LG_ADMIN='nathe',lgIsG=id=>/^g[a-z0-9]{6}$/.test(String(id||'')),lgCanEd=lg=>!!lg&&(lg.host==h2hMe()||h2hMe()==LG_ADMIN);
const lgGuest=id=>{if(!lgIsG(id)||typeof S=='undefined'||!S)return null;for(const l of S.leagues||[]){const g=(l.gn||{})[id];if(g&&g.n)return g}return null};
const lgName=id=>{const g=lgGuest(id);return g?g.n:h2hShort(id)};
/* shoot-up and other views name archers through testerName: an added shooter shows by the name the host gave */
{const _tn=testerName;testerName=function(id){const g=lgGuest(id);return g?g.n:_tn(id)}}
function lgAddGuest(code,raw,jr){const lg=lgGet(code);if(!lgCanEd(lg)||lg.fin)return'Only the host can add shooters.';const n=nmClean(raw).slice(0,40);
 if(n.length<2)return'Type a name (at least 2 characters).';if(!/^[A-Za-z0-9 '_-]+$/.test(n))return'Use letters, numbers, spaces, \' - and _ only.';if(nmRude(n))return'Please use a different name.';
 if(jr&&/\s/.test(n))return'Under-16s go by nickname only: one word, no surname.';
 if(lgArchers(lg).length>=h2hCap(lg))return'This league is full ('+h2hCap(lg)+' archers).';
 if(lgArchers(lg).some(id=>lgName(id).toLowerCase()==n.toLowerCase()))return'Someone in this league already has that name.';
 const L='abcdefghjkmnpqrstuvwxyz23456789';let id;do{id='g'+Array.from(crypto.getRandomValues(new Uint32Array(6)),x=>L[x%L.length]).join('')}while((lg.order||[]).includes(id));
 lg.gn=lg.gn||{};lg.gn[id]={n,j:jr?1:0,t:Date.now(),by:h2hMe()};lg.order=lg.order||[];lg.order.push(id);lg.dirty=1;save();lgTick(true);return''}
window.lgAddGuest=lgAddGuest;
const lgXV=e=>e&&(e.xv==11||e.lancaster||e.round=='Lancaster 660')?11:10;
const lgV=(a,e)=>a=='X'?lgXV(e):a=='M'?0:(+a||0),lgTot=(E,e)=>E.flat().reduce((t,a)=>t+lgV(a,e),0),lgXs=E=>E.flat().filter(a=>a=='X').length;
const lgEnc=E=>E.map(e=>e.map(a=>a=='10'?'T':a).join('')).join('/'),lgDec=(s,n)=>String(s||'').split('/').filter(x=>x!=='').slice(0,n||20).map(e=>[...e].slice(0,3).map(c=>c=='T'?'10':c).filter(a=>LG_KEYS.includes(a)));
const lgEnt=(lg,id,w)=>((lg.sc||{})[id]||{})[w]||null;
const lgHas=e=>!!(e&&e.e&&e.e.some(x=>x&&x.length));
const lgDoneE=e=>!!(e&&e.e&&e.e.filter(x=>x&&x.length==3).length>=(e.nEnds||10));
const lgToday=()=>{if(window._lgToday)return window._lgToday;const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function lgInfo(lg,w){if(typeof lkIs==='function'&&lkIs(lg)&&!(+w>=7))return{ends:20,keys:LG_KEYS,face:'triangular 40 cm 3-spot',dist:'18 m',done:'660 finished',title:'Lancaster 660',kicker:'Night'};return{ends:10,keys:LG_KEYS,face:LG_FACE,dist:'18 m',done:'300 finished',title:LG_RL,kicker:'Week'}}
function lgArchers(lg){return(lg.order||[]).filter(id=>!LG_EXCL.includes(id)).slice(0,h2hCap(lg))}
/* current week: by the week dates if set, else the first week not yet shot by everyone (or the host's 'Next week') */
function lgWeek(lg){const cap=(typeof lkNights==='function'?lkNights(lg):LG_W);const W=(lg.weeks||[]).filter(Boolean);if(W.length){const t=lgToday();let n=0;(lg.weeks||[]).forEach((d,k)=>{if(d&&d<=t)n=k+1});return Math.max(1,Math.min(cap,n||1))}
 let w=Math.max(1,Math.min(cap,lg.cw||1));const A=lgArchers(lg);while(w<cap&&A.length&&A.every(id=>lgDoneE(lgEnt(lg,id,w))))w++;return w}
/* league table: cumulative total, ties on X; missing weeks '-' */
function lgTable(lg){const rows=lgArchers(lg).map(id=>{const W=[];let t=0,x=0;for(let w=1;w<=LG_W;w++){const e=lgEnt(lg,id,w);if(lgHas(e)){const s=lgTot(e.e,e),xx=lgXs(e.e);W.push({s,x:xx,d:lgDoneE(e)});t+=s;x+=xx}else W.push(null)}return{id,nm:lgName(id),W,t,x}});
 rows.sort((a,b)=>b.t-a.t||b.x-a.x||a.nm.localeCompare(b.nm));rows.forEach((r,k)=>{r.rk=k&&rows[k-1].t==r.t&&rows[k-1].x==r.x?rows[k-1].rk:k+1});rows.forEach(r=>r.tie=rows.filter(o=>o.rk==r.rk).length>1);return rows}
/* ---------- groups ---------- */
const lgGroups=(lg,w)=>(((lg.grp||{})[w]||{}).g||[]).map(g=>g.filter(id=>lgArchers(lg).includes(id)));
const lgGroupOf=(lg,w,id)=>{const G=lgGroups(lg,w);const k=G.findIndex(g=>g.includes(id));return k<0?null:k};
/* host: set week w's groups. 26 Oct 2026: an archer who has already started can be moved too (ends already scored stay with them: scores are keyed by archer and week, never by group); only the host may change groups */
function lgSetGroups(code,w,G){const lg=lgGet(code),me=h2hMe();if(!lg||lg.host!=me)return false;const N=G.map(g=>g.filter(id=>lgArchers(lg).includes(id)));
 if(typeof lkIs==='function'&&lkIs(lg)&&N.some(g=>g.length>4))return false;
 lg.grp=lg.grp||{};lg.grp[w]={t:Date.now(),g:N.filter(g=>g.length)};lg.dirty=1;save();lgTick(true);return true}
/* ---------- scoring ---------- */
function lgLockedBy(lg,w,id){const e=lgEnt(lg,id,w),me=h2hMe();if(lgIsG(id)&&lgCanEd(lg))return null;return lgHas(e)&&e.by&&e.by!=me?e.by:null}
function lgKey(code,w,id,k,xy){const lg=lgGet(code);if(!lg||!LG_KEYS.includes(k)||w!=lgWeek(lg)||lg.fin)return false;if(lgLockedBy(lg,w,id))return false;
 lg.sc=lg.sc||{};lg.sc[id]=lg.sc[id]||{};const e=lg.sc[id][w]=lg.sc[id][w]||{e:[]};
 if(typeof lkIs==='function'&&lkIs(lg)){e.nEnds=20;e.xv=11;e.lancaster=true;e.round='Lancaster 660'}
 const lkVals=typeof lkIs==='function'&&lkIs(lg);
 if(!lkVals&&window.arrowApply)arrowApply(e,'lg|'+code+'|'+w+'|'+id);
 /* Lingkana is values only (no plots). Other leagues still store a plot when the archer taps the face. */
 const fxs=window.csFxFor&&csFxFor('lg|'+code+'|'+w+'|'+id);if(fxs){window._csFx=null;if(!csFxPut(e,3,fxs,k,lkVals?null:xy))return false;Object.assign(e,{by:h2hMe(),u:Date.now(),f:'vert'});lg.dirty=1;lgOwn(lg,w,id);save();lgAfter(lg);return true}
 if(lgDoneE(e))return false;let E=e.e[e.e.length-1];if(!E||E.length>=3){E=[];e.e.push(E)}E.push(k);
 if(!lkVals&&(xy||e.p)){const ix=e.e.length-1;e.p=e.p||[];while(e.p.length<=ix)e.p.push([]);const P=e.p[ix];while(P.length<E.length-1)P.push(null);P.push(xy||null)}
 /* a complete end is put in order (highest first, X before 10), with plots on non-Lingkana leagues */
 if(E.length==3&&window.csSorted){const ix=e.e.length-1,pre=[...E],preP=[...((!lkVals&&e.p&&e.p[ix])||[])];if(lkVals){const[E2]=csSorted(E);E.splice(0,3,...E2);if(window.stOrd)stOrd.set('lg|'+code+'|'+w+'|'+id,ix,pre,[],E,[])}else{const[E2,P2]=csSorted(E,e.p&&e.p[ix]);E.splice(0,3,...E2);if(e.p)e.p[ix]=P2;if(window.stOrd)stOrd.set('lg|'+code+'|'+w+'|'+id,ix,pre,preP,E,e.p&&e.p[ix])}}
 Object.assign(e,{by:h2hMe(),u:Date.now(),f:'vert'});lg.dirty=1;lgOwn(lg,w,id);save();
 /* 31 Oct 2026 (queue): auto-advance is the default again. Only once the third arrow is saved (save() above) does the card move to the
    next archer, in the same order as before, keeping the page where it is. The 27 Oct Next button stays as an option (S.lgNextBtn):
    the card then stays on this archer showing the three arrows until Next is tapped. Display only. */
 if(E.length==3){if(S.lgNextBtn){window._lgAct=id;window._lgHold={id,n:e.e.length};window._lgLast=null}else{window._lgLast={code,w,id,n:e.e.length,E:[...E]};lgNextArcher(code,w,id)}}
 if(typeof lkIs==='function'&&lkIs(lg))window._lkHoldRelay=E.length!=3;else window._lkHoldRelay=false;
 lgAfter(lg);return true}
/* the archer after `id` in this phone's group (same order the old auto-advance used), skipping finished archers; null when everyone is finished */
/* the line that confirms the end just saved when the card has moved on by itself */
function lgLastLine(lg,w,ids){const L=window._lgLast;if(S.lgNextBtn||!L||L.code!=lg.code||L.w!=w||!ids.includes(L.id)||ids.length<2)return'';return`<p class="small" id="lglast" style="margin:0 0 4px">Saved: ${esc(lgName(L.id))}, end ${L.n}: ${L.E.map(esc).join(' ')}.</p>`}
const lgNextPref=(lg,ids)=>ids.length>1?`<label class="small" style="display:flex;gap:8px;align-items:center;margin:8px 0 0"><input type="checkbox" id="lgnextpref" ${S.lgNextBtn?'checked':''}> Stay on each archer after the 3rd arrow and tap Next to move on</label>`:'';
function lgNextArcher(code,w,id){const lg=lgGet(code);window._lgHold=null;if(!lg)return;const G=window._lgE&&window._lgE.ids||[id],s=G.indexOf(id);window._lgAct=null;
 /* Move to the next archer who still has fewer complete ends (the rest of this end). When this end is finished for everyone, start the next end at archer 1 in the scorecard order. */
 const mine=((lgEnt(lg,id,w)||{e:[]}).e||[]).filter(z=>z&&z.length==3).length;
 for(let j=1;j<=G.length;j++){const n=G[(s+j)%G.length];const e=lgEnt(lg,n,w)||{e:[]};if(lgDoneE(e))continue;const last=(e.e||[])[e.e.length-1],part=!!(last&&last.length&&last.length<3),nEnds=(e.e||[]).filter(z=>z&&z.length==3).length;if(part||nEnds<mine){window._lgAct=n;return}}
 window._lgAct=lgWavePick(lg,w,G)}
/* Who is up when no archer is held on screen: a partial end first, otherwise the first scorecard archer with the fewest complete ends. */
function lgWavePick(lg,w,ids){
 const part=(ids||[]).find(id=>{if(lgLockedBy(lg,w,id))return false;const e=lgEnt(lg,id,w)||{e:[]};if(lgDoneE(e))return false;const last=(e.e||[])[e.e.length-1];return !!(last&&last.length&&last.length<3)});
 if(part)return part;let best=null,bn=1e9;(ids||[]).forEach(id=>{if(lgLockedBy(lg,w,id))return;const e=lgEnt(lg,id,w)||{e:[]};if(lgDoneE(e))return;const n=(e.e||[]).filter(z=>z&&z.length==3).length;if(n<bn){bn=n;best=id}});return best||(ids&&ids[0])||null}
function lgUndo(code,w,id){window._csFx=null;const lg=lgGet(code);if(!lg||lgLockedBy(lg,w,id)||lg.fin)return;const e=lgEnt(lg,id,w);if(!lgHas(e))return;const E=e.e[e.e.length-1],ux=e.e.length-1,r=window.stOrd&&stOrd.take('lg|'+code+'|'+w+'|'+id,ux,E,e.p&&e.p[ux]);if(r){E.splice(0,E.length,...r.E);if(e.p&&e.p[ux])e.p[ux].splice(0,e.p[ux].length,...r.P)}else E.pop();if(!E.length)e.e.pop();if(e.p){const n=e.e.length;e.p.length=Math.min(e.p.length,n);if(E.length&&e.p[n-1])e.p[n-1].length=Math.min(e.p[n-1].length,E.length)}e.u=Date.now();lg.dirty=1;lgOwn(lg,w,id);save();if(typeof lkIs==='function'&&lkIs(lg)){const last=e.e[e.e.length-1];window._lkHoldRelay=!!(last&&last.length&&last.length<3)}lgAfter(lg)}
/* delete one arrow of the end being shot (fix mode) */
function lgFxDel(code,w,id){const lg=lgGet(code),fx=window._csFx;window._csFx=null;if(!lg||!fx||lg.fin||lgLockedBy(lg,w,id)||w!=lgWeek(lg))return false;const e=lgEnt(lg,id,w);if(!lgHas(e)||!csFxDel(e,fx))return false;Object.assign(e,{by:h2hMe(),u:Date.now()});lg.dirty=1;lgOwn(lg,w,id);save();lgAfter(lg);return true}
/* my own week is also kept with my other sessions (plots on non-Lingkana leagues, so groups and analysis work like Just me). Only a week I score
   on this phone is written, and only once it is finished (or already written); the league record itself is unchanged. */
function lgOwn(lg,w,id){try{if(id!=h2hMe())return;const e=lgEnt(lg,id,w),sid='lg-'+lg.code+'-w'+w;let s=S.sessions.find(x=>x.id==sid);if(!s&&!lgDoneE(e))return;
 const E=((e&&e.e)||[]).filter(x=>x&&x.length).map(x=>x.slice()),P=(e&&e.p)||[],has=P.some(l=>(l||[]).some(Boolean)),POS=E.map((x,i)=>x.map((_,j)=>((P[i]||[])[j])||null));
 if(!s){const rd=(typeof lkRound==='function'&&lkRound(lg,w))||LG_R;s={id:sid,date:lgToday(),round:rd,ends:E,pos:has?POS:E.map(()=>[]),note:'League: '+lg.name+', week '+w,league:lg.code};if(rd==='Lancaster 660')s.face3='vegas';else s.face3='vert';S.sessions.push(s)}else if(E.length){s.ends=E;if(has)s.pos=POS}else{s.ends=[[]];s.pos=[[]]}
 if(e&&e.lcT&&e.arrowD){s.lcT=1;s.arrowD=e.arrowD}}catch(x){console.error(x)}}
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
function lgSnapParts(lg){
 const me=h2hMe(),LIM=3400,size=o=>JSON.stringify(o).length;
 const order=typeof lgArchers==='function'?lgArchers(lg):(lg.order||[]).slice();
 const meta={k:'ls',code:lg.code,by:me,name:lg.name,host:lg.host,weeks:lg.weeks||[],wt:lg.wt||0,cw:lg.cw||1,cwt:lg.cwt||0,fin:lg.fin||null,fint:lg.fint||0,...h2hNm()};
 if(typeof lkIs==='function'&&lkIs(lg)){
  meta.format='lingkana';meta.inviteOnly=!!lg.inviteOnly;
  if(lg.pwHash){meta.pwHash=lg.pwHash;meta.pwSalt=lg.pwSalt||'';meta.pwt=lg.pwt||0}
  if(lg.paidt)meta.paidt=lg.paidt;
  if(lg.claimt)meta.claimt=lg.claimt;
  if(lg.fresh)meta.fresh=lg.fresh;
  if(lg.clear)meta.clear=lg.clear;
 }
 const roster={order,grp:lg.grp||{},gn:lg.gn||{}};
 const fat={...meta,...roster};
 const items=[];for(const id in lg.sc||{})for(const w in lg.sc[id]){const e=lg.sc[id][w];if(e&&e.e)items.push([id,w,{e:lgEnc(e.e),u:e.u||0,by:e.by||'',f:e.f||'vert'}])}
 const useSlim=size({...fat,sc:{},part:99,np:99,t:1})>LIM;
 const parts=[];
 const stamp=o=>({...o,part:99,np:99,t:1});
 if(useSlim){
  let chunk=[];
  for(const id of order){const next=chunk.concat([id]);if(chunk.length&&size(stamp({...meta,order:next}))>LIM){parts.push({...meta,order:chunk});chunk=[id]}else chunk=next}
  if(chunk.length)parts.push({...meta,order:chunk});
  const grp=lg.grp||{};
  if(Object.keys(grp).length){if(size(stamp({...meta,grp}))<=LIM)parts.push({...meta,grp});else for(const w of Object.keys(grp))parts.push({...meta,grp:{[w]:grp[w]}})}
  const gn=lg.gn||{};let bag={};
  for(const id of Object.keys(gn)){const c2=Object.assign({},bag);c2[id]=gn[id];if(Object.keys(bag).length&&size(stamp({...meta,gn:c2}))>LIM){parts.push({...meta,gn:bag});bag={};bag[id]=gn[id]}else bag=c2}
  if(Object.keys(bag).length)parts.push({...meta,gn:bag});
 }
 const head=useSlim?meta:fat;
 let cur={};
 for(const [id,w,v] of items){const c2=JSON.parse(JSON.stringify(cur));(c2[id]=c2[id]||{})[w]=v;if(Object.keys(cur).length&&size(stamp({...head,sc:c2}))>LIM){parts.push({...head,sc:cur});cur={};(cur[id]={})[w]=v}else cur=c2}
 if(Object.keys(cur).length||!useSlim&&!parts.length)parts.push(useSlim?{...head,sc:cur}:{...head,sc:cur});
 if(!parts.length)parts.push({...fat,sc:{}});
 if(typeof lkIs==='function'&&lkIs(lg)){
  const emit=(key,obj)=>{if(obj&&Object.keys(obj).length)parts.push({...meta,[key]:obj})}
  const pack=(key,obj)=>{if(!obj||!Object.keys(obj).length)return;
   if(size(stamp({...meta,[key]:obj}))<=LIM){emit(key,obj);return}
   let bag={};
   const flush=()=>{if(Object.keys(bag).length){emit(key,bag);bag={}}};
   const take=(k,v)=>{const c2=Object.assign({},bag);c2[k]=v;if(Object.keys(bag).length&&size(stamp({...meta,[key]:c2}))>LIM){flush();bag[k]=v}else bag=c2};
   for(const k of Object.keys(obj)){
    const v=obj[k];
    if(Array.isArray(v)&&size(stamp({...meta,[key]:{[k]:v}}))>LIM){
     let chunk=[];
     for(const rec of v){const next=chunk.concat([rec]);if(chunk.length&&size(stamp({...meta,[key]:{[k]:next}}))>LIM){take(k,chunk);flush();chunk=[rec]}else chunk=next}
     if(chunk.length)take(k,chunk);
    }else if(v&&typeof v==='object'&&!Array.isArray(v)&&size(stamp({...meta,[key]:{[k]:v}}))>LIM){
     let sub={};const keys=Object.keys(v);
     for(const id of keys){const s2=Object.assign({},sub);s2[id]=v[id];if(Object.keys(sub).length&&size(stamp({...meta,[key]:{[k]:s2}}))>LIM){take(k,sub);flush();sub={[id]:v[id]}}else sub=s2}
     if(Object.keys(sub).length)take(k,sub);
    }else take(k,v);
   }
   flush()}
  pack('reg',(typeof lkPublicReg==='function'?lkPublicReg(lg.reg||{}):(lg.reg||{})));pack('paid',lg.paid||{});pack('claim',lg.claim||{});
  if(lg.pins&&Object.keys(lg.pins).length)parts.push({...meta,pins:lg.pins});
  if(lg.claimt)meta.claimt=lg.claimt;
 }
 const t=Date.now();return parts.map((p,k)=>({...p,part:k+1,np:parts.length,t}))
}
function lgMerge(lg,d){if(!d||d.k!='ls'||d.code!=lg.code||(d.t||0)<H2H_RESET)return false;if(LG_SINCE[lg.code]&&(d.t||0)<LG_SINCE[lg.code])return false;let ch=false;const fromHost=!lg.host||d.by==lg.host;
 const lkFreshCut=(typeof lkIs==='function'&&(lkIs(lg)||lkIs(d)))||d.format==='lingkana'||lg.format==='lingkana'||d.code==='LINGKN26'||lg.code==='LINGKN26';
 const freshCut=lkFreshCut?+((typeof LK_FRESH!=='undefined'&&LK_FRESH)||(typeof window!=='undefined'&&window.LK_FRESH)||0):0;
 if(freshCut&&+(d.fresh||0)<freshCut)return false;
 const clearCut=lkFreshCut?+((typeof LK_CLEAR!=='undefined'&&LK_CLEAR)||(typeof window!=='undefined'&&window.LK_CLEAR)||0):0;
 if(clearCut&&+(lg.clear||0)>=clearCut&&+(lg.fresh||0)>=clearCut&&+(d.clear||d.fresh||0)<clearCut)return false;
 const incFresh=lkFreshCut?+(d.fresh||0):0, locFresh=lkFreshCut?+(lg.fresh||0):0;
 /* A cached snapshot can carry the new fresh stamp and an older weeks time. That copy must not replace newer sign-ups. */
 const incomingWt=+(d.wt||0), localWt=+(lg.wt||0);
 const staleWt=!!(localWt&&incomingWt&&incomingWt<localWt);
 if(lkFreshCut&&fromHost&&incFresh>locFresh){
  lg.fresh=incFresh;ch=true;
  if(!staleWt){
  lg.order=[];lg.gn={};lg.sc={};lg.reg={};lg.claim={};lg.claimt=0;lg.paid={};lg.paidt=0;
  if(Array.isArray(d.order))lg.order=d.order.filter(id=>typeof id=='string'&&!LG_EXCL.includes(id)).slice(0,h2hCap(lg));
  if(d.gn&&typeof d.gn=='object'){lg.gn={};for(const id in d.gn){const g=d.gn[id];if(lgIsG(id)&&g&&typeof g.n=='string')lg.gn[id]={n:nmClean(g.n).slice(0,40),j:g.j?1:0,t:+g.t||0,by:typeof g.by=='string'?g.by:''}}}
  if(d.sc&&typeof d.sc=='object'){lg.sc={};for(const id in d.sc){if(typeof id!='string'||id.length>16)continue;for(const w in d.sc[id]){if(!(+w>=1&&+w<=(typeof lkNights==='function'?lkNights(lg):LG_W)))continue;const v=d.sc[id][w];if(!v)continue;(lg.sc[id]=lg.sc[id]||{})[w]={e:lgDec(v.e),u:+v.u||0,by:typeof v.by=='string'?v.by:'',f:'vert'}}}}
  if(d.reg&&typeof d.reg==='object')lg.reg=d.reg;
  if(d.claim&&typeof d.claim==='object')lg.claim=d.claim;
  if(d.paid&&typeof d.paid==='object'){lg.paid=d.paid;lg.paidt=d.paidt||0}
  }
 }
 const staleFresh=lkFreshCut&&locFresh&&incFresh<locFresh;
 if(d.nm&&nmLearn(d.by,d.nm,d.nt,d.t))ch=true;
 /* Group/target picks come from any scorer now (the self-service picker, not just the host's
    auto-chunker), so d.grp is merged unconditionally -- arbitrated by its own per-week timestamp
    check right here, same as .reg/.drop already are below. Every other field in the fromHost
    block below is still host-only, unchanged. */
 if(d.grp&&typeof d.grp=='object'){lg.grp=lg.grp||{};for(const w in d.grp){const g=d.grp[w];if(+w>=1&&+w<=((typeof lkNights==='function'?lkNights(lg):LG_W))&&g&&Array.isArray(g.g)&&(g.t||0)>((lg.grp[w]||{}).t||0)){lg.grp[w]={t:g.t,g:g.g.map(x=>Array.isArray(x)?x.filter(i=>typeof i=='string'):[])};ch=true}}}
 if(fromHost){if(!lg.host&&typeof d.host=='string'){lg.host=d.host;ch=true}if(typeof d.name=='string'&&d.name&&d.name!=lg.name){lg.name=nmClean(d.name).slice(0,40);ch=true}
  if(Array.isArray(d.weeks)&&(d.wt||0)>(lg.wt||0)){const cap=(typeof lkIs==='function'&&(lkIs(lg)||lkIs(d))||d.code==='LINGKN26'||lg.code==='LINGKN26')?7:LG_W;lg.weeks=d.weeks.slice(0,cap).map(x=>/^\d{4}-\d\d-\d\d$/.test(x)?x:'');lg.wt=d.wt;ch=true}
  if(Array.isArray(d.fin)&&(d.fint||0)>(lg.fint||0)){lg.fin=d.fin.filter(x=>typeof x=='string');lg.fint=d.fint;ch=true}
  if((d.cwt||0)>(lg.cwt||0)){const cap=(typeof lkNights==='function'?lkNights(lg):LG_W);lg.cw=Math.max(1,Math.min(cap,+d.cw||1));lg.cwt=d.cwt;ch=true}
  if(d.format==='lingkana'&&lg.format!=='lingkana'){lg.format='lingkana';ch=true}
  if(d.inviteOnly!=null&&!!d.inviteOnly!==!!lg.inviteOnly){lg.inviteOnly=!!d.inviteOnly;ch=true}
  if(d.pwHash&&(d.pwt||0)>=(lg.pwt||0)&&(d.pwHash!==lg.pwHash||d.pwSalt!==lg.pwSalt)){lg.pwHash=d.pwHash;lg.pwSalt=d.pwSalt||'';lg.pwt=d.pwt||0;ch=true}
  if(!staleFresh&&d.paid&&typeof d.paid==='object'&&(d.paidt||0)>=(lg.paidt||0)){lg.paid=d.paid;lg.paidt=d.paidt||0;ch=true}}
 /* Nate Evans uses the same passcode and publishes paid ticks with by/cohost nate. Scorer phones do not. */
 const lkPaidByNate=d&&(d.by==='nate'||d.cohost==='nate');
 if(!staleFresh&&lkPaidByNate&&d.paid&&typeof d.paid==='object'&&(d.paidt||0)>=(lg.paidt||0)){lg.paid=d.paid;lg.paidt=d.paidt||0;ch=true}
 if(!staleFresh&&(fromHost||d.by==LG_ADMIN)&&d.gn&&typeof d.gn=='object'){lg.gn=lg.gn||{};lg.order=lg.order||[];for(const id in d.gn){const g=d.gn[id];if(!lgIsG(id)||!g||typeof g.n!='string')continue;const o=lg.gn[id];
  if(!o||(+g.t||0)>(o.t||0)){lg.gn[id]={n:nmClean(g.n).slice(0,40),j:g.j?1:0,t:+g.t||0,by:typeof g.by=='string'?g.by:''};ch=true}if(!lg.order.includes(id)&&lg.order.length<h2hCap(lg)){lg.order.push(id);ch=true}}}
 if(!staleFresh){lg.order=lg.order||[];const alsoBy=lkFreshCut?[]:[d.by];for(const id of [...(Array.isArray(d.order)&&fromHost?d.order:[]),...alsoBy])if(typeof id=='string'&&!LG_EXCL.includes(id)&&!(lg.drop&&lg.drop[id])&&!lg.order.includes(id)&&lg.order.length<h2hCap(lg)){lg.order.push(id);ch=true}}
 if(!staleFresh){lg.sc=lg.sc||{};for(const id in d.sc||{}){if(typeof id!='string'||id.length>16)continue;for(const w in d.sc[id]){if(!(+w>=1&&+w<=(typeof lkNights==='function'?lkNights(lg):LG_W)))continue;const v=d.sc[id][w],mine=lgEnt(lg,id,w);
  if(!v||(mine&&(mine.u||0)>=(v.u||0)))continue;(lg.sc[id]=lg.sc[id]||{})[w]={e:lgDec(v.e),u:+v.u||0,by:typeof v.by=='string'?v.by:'',f:v.f=='vert'?'vert':'vert'};ch=true}}}
 /* Lingkana sign-ups: union by night and archer, so a register on another phone is not dropped. */
 if(!staleFresh&&((typeof lkIs==='function'&&(lkIs(lg)||lkIs(d)))||d.format==='lingkana'||lg.format==='lingkana'||d.code==='LINGKN26'||lg.code==='LINGKN26')){
  if(d.drop&&typeof d.drop==='object'){lg.drop=lg.drop||{};for(const id in d.drop){const v=d.drop[id]||{};const t=+v.t||0;if(!lg.drop[id]||t>(lg.drop[id].t||0)){lg.drop[id]={n:typeof v.n==='string'?v.n:'',t};ch=true}}}
  if(d.reg&&typeof d.reg==='object'){lg.reg=lg.reg||{};for(const night in d.reg){const list=d.reg[night];if(!Array.isArray(list))continue;lg.reg[night]=lg.reg[night]||[];
   for(const rec of list){if(!rec||!(rec.id||rec.name))continue;if(staleWt&&freshCut&&(+rec.at||0)<freshCut)continue;if(typeof lkRegKept==='function'&&!lkRegKept(lg, rec.at))continue;if(lg.drop&&lg.drop[rec.id]&&(lg.drop[rec.id].t||0)>=(rec.at||0))continue;
    const rk=String(rec.name||'').trim().replace(/\s+/g,' ').toLowerCase();
    const i=lg.reg[night].findIndex(r=>r&&((rec.id&&r.id===rec.id)||(rk&&String(r.name||'').trim().replace(/\s+/g,' ').toLowerCase()===rk)));
    if(rec.pin)delete rec.pin;
    if(i<0){lg.reg[night].push(rec);ch=true}
    else if((rec.at||0)>(lg.reg[night][i].at||0)){const prev=lg.reg[night][i];const next=Object.assign({},prev,rec,{id:prev.id||rec.id});if(next.pin)delete next.pin;lg.reg[night][i]=next;ch=true}
    else if((rec.pinAt||0)>((lg.reg[night][i].pinAt)||0)){const prev=lg.reg[night][i];if(rec.pinHash){prev.pinHash=rec.pinHash;prev.pinSalt=rec.pinSalt||''}else{delete prev.pinHash;delete prev.pinSalt}prev.pinAt=rec.pinAt;if(prev.pin)delete prev.pin;ch=true}}}}
  if(d.pins&&typeof d.pins==='object'){lg.pins=lg.pins||{};for(const id in d.pins){const p=d.pins[id]||{};const cur=lg.pins[id];if(!cur||(+p.pinAt||0)>(+cur.pinAt||0)){const pinHash=p.pinHash?String(p.pinHash):'';lg.pins[id]={pinHash,pinSalt:pinHash?String(p.pinSalt||''):'',pinAt:+p.pinAt||0,name:typeof p.name==='string'?p.name:''};ch=true}}}
  if(typeof lkStripDropped==='function'&&lkStripDropped(lg))ch=true;
  if(d.claim&&typeof d.claim==='object'&&typeof lkMergeClaims==='function'){if(lkMergeClaims(lg,d.claim))ch=true}}
 /* The co-host row belongs on this phone. A snapshot replace or a tombstone cannot wipe it. */
 if(((typeof lkIs==='function'&&lkIs(lg))||lg.format==='lingkana'||lg.code==='LINGKN26'||d.format==='lingkana'||d.code==='LINGKN26')){if(typeof lkSeedHost==='function'&&lkSeedHost(lg))ch=true;if(typeof lkSeedCoHost==='function'&&lkSeedCoHost(lg))ch=true}
 return ch}
let lgBusy=false;const lgOpened={},LG_REOPEN=30*6e4;
/* the time of the last re-send on open is kept in its own key (scoretool.opost.<archer>.<code>), not in the saved record */
const LG_RSOK=k=>'scoretool.opost.'+((typeof TESTER!='undefined'&&TESTER&&TESTER.id)||'nathe')+'.'+k;function lgOpGet(k){try{return +localStorage.getItem(LG_RSOK(k))||0}catch(e){return 0}}function lgOpSet(k){try{localStorage.setItem(LG_RSOK(k),String(Date.now()))}catch(e){}}

function lgRelayReady(lg){
  /* L11: Lingkana holds relay posts mid-end (flag set from lgKey / lgUndo), so a 12-archer night does not post on every arrow. Other leagues are unchanged. */
  if(typeof lkIs!=='function'||!lkIs(lg))return true;
  return !window._lkHoldRelay}
async function lgTick(force){if(window.ADMIN_VIEW){window.avSkip&&avSkip('league');return}if(lgBusy||!TESTER)return;lgBusy=true;let ch=false;try{for(const lg of lgAll()){if(lg.status=='invite')continue;
  if(typeof lkFresh==='function'&&typeof lkIs==='function'&&lkIs(lg))lkFresh(lg);
  const L=await h2hPoll(lgTopic(lg.code),lg.since);if(L&&L.length){for(const d of L){lg.since=d._id;if(lgMerge(lg,d))ch=true;else if(d&&d.k==='lkreg'&&d.code===lg.code&&typeof lkApplyReg==='function'&&(!(lg.fresh)||+(d.t||(d.rec&&d.rec.at)||0)>=lg.fresh)&&(typeof lkRegKept!=='function'||lkRegKept(lg,(d.rec&&d.rec.at)||0))){const r=lkApplyReg(d.rec||d,lg);if(r&&r.ok)ch=true}else if(d&&d.k==='lkdrop'&&d.code===lg.code&&typeof lkApplyDrop==='function'&&(!(lg.fresh)||+(d.at||d.t||0)>=lg.fresh)){if(lkApplyDrop(lg,d.id,d.name,d.at||d.t))ch=true}else if(d&&d.k==='lkclaim'&&d.code===lg.code&&typeof lkApplyClaim==='function'&&(!(lg.fresh)||+(d.t||d.at||0)>=lg.fresh)){if(lkApplyClaim(d,lg))ch=true}}save()}
  if(typeof lkDropHostIfUnregistered==='function'&&typeof lkIs==='function'&&lkIs(lg))lkDropHostIfUnregistered(lg);
  if(lgFinal(lg))ch=ch||false;
  /* 1 Nov 2026 (queue): the full snapshot is still re-sent when the app opens (so an away phone can catch up if the relay lost it),
     but at most once every 30 minutes per league (a send of new scores does not count), so opening the app again and again no longer floods the relay. */
  const dty=lg.dirty,reo=!dty&&!lgOpened[lg.code]&&Date.now()-lgOpGet(lg.code)>=LG_REOPEN;if(!lgOpened[lg.code]&&!reo&&!dty)lgOpened[lg.code]=1;
  if(lg.dirty||reo||Date.now()-(lg.posted||0)>LG_SNAP){if(!lgRelayReady(lg)){if(window._lgRelayNote)window._lgRelayNote('hold',lg.code);continue}if(window._lgRelayNote)window._lgRelayNote('post',lg.code);let ok=true;for(const o of lgSnapParts(lg))if(!await window.h2hPost(lgTopic(lg.code),o)){ok=false;break}
   /* a re-send on open only stamps its own key and leaves the saved record untouched */
   if(ok&&reo&&!dty&&!lg.qfail){lgOpSet(lg.code);lgOpened[lg.code]=1}else{if(ok){if(reo&&!dty)lgOpSet(lg.code);lg.posted=Date.now();lg.dirty=0;lg.qfail=0;lgOpened[lg.code]=1}else lg.qfail=1;save()}}}}
 finally{lgBusy=false}if(ch){if($('#lkselect')&&typeof lkFlowSelect==='function'){lkFlowSelect()}else if(($('#lgentry')||$('#lksheet'))&&typeof lkFlowScore==='function'&&window._lkScoreIds){lkFlowScore()}else if($('#lgview')&&window._lgv){window._lgKeep=1;lgView(window._lgv)}else if($('#lgcard')&&!cur&&view=='score'&&!($('#lgnew')||{}).open&&!($('#h2hnew')||{}).open)score()}}
setInterval(()=>{if(!document.hidden)lgTick()},30000);setTimeout(()=>lgTick(true),2500);addEventListener('online',()=>lgTick(true));
/* invites + join */
window.lgInvite=function(d){const me=h2hMe();if(d.to!=me||d.from==me||!d.code||lgIsPresetCode(d.code)||lgGet(d.code)||(d.t||0)<H2H_RESET||LG_EXCL.includes(me))return false;if(d.nm)nmLearn(d.from,d.nm,d.nt,d.t);
 lgAll().push({code:d.code,name:nmClean(String(d.name||'League')).slice(0,40),host:d.from,order:[d.from,me],sc:{},status:'invite',created:d.t||Date.now()});save();return true};
function lgCreate(name,T,weeks){const me=h2hMe();if(!me)return null;const code=h2hCode(),lg={code,name:nmClean(name||'').slice(0,40)||'My league',host:me,order:[me,...T.filter(id=>id!=me&&!LG_EXCL.includes(id))].slice(0,H2H_MAX),
 weeks:(weeks||[]).slice(0,LG_W),wt:Date.now(),cw:1,cwt:0,grp:{},sc:{},status:'active',created:Date.now(),dirty:1};lgAll().push(lg);save();
 for(const to of lg.order.slice(1))h2hPost(h2hInbox(to),{k:'lginv',code,name:lg.name,from:me,to,...h2hNm(),t:Date.now()});lgTick(true);return lg}
async function lgJoin(raw){const code=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');const me=h2hMe();if(typeof lkJoinGuard==='function'){const block=lkJoinGuard(code,me);if(block)return block}if(code.length!=8)return'Type the 8-character league code.';if(lgIsPresetCode(code))return'No league found with that code yet. Ask the host to open the league, then try again.';if(lgGet(code)){lgView(code);return''}
 const L=await h2hPoll(lgTopic(code));const s=(L||[]).filter(d=>d.k=='ls'&&d.code==code);if(!s.length)return'No league found with that code yet. Ask the host to open the league, then try again.';
 const lg={code,name:'League',host:null,order:[],sc:{},status:'active',created:Date.now(),dirty:1};s.forEach(d=>{lg.since=d._id;lgMerge(lg,d)});if(!lg.order.includes(me)&&lg.order.length<h2hCap(lg))lg.order.push(me);
 lgAll().push(lg);save();lgTick(true);lgView(code);return''}
window.lgCreate=lgCreate;window.lgJoin=lgJoin;window.lgKey=lgKey;window.lgUndo=lgUndo;window.lgTake=lgTake;window.lgSetGroups=lgSetGroups;window.lgForce=lgForce;window.lgTick=lgTick;window.lgTable=lgTable;window.lgMerge=lgMerge;window.lgWeek=lgWeek;window.lgSnapParts=lgSnapParts;
/* 25 Nov 2026: the old preset league and its member list are removed. Its two old codes stay hidden on any phone that still holds
   a copy (kept in storage as saved, never listed, never re-joined). */
const LG_OLD=['ONIONSHD','ONIONSH2'];
const LG_PRESET={code:'',name:'',host:'',members:[],gn:{},since:0};
const LG_SINCE={ONIONSHD:Date.UTC(2026,9,22,12,52),ONIONSH2:Date.UTC(2026,9,27,10,0)};
const lgIsPresetCode=c=>LG_OLD.includes(c);
const lgPresetHidden=lg=>!!lg&&LG_OLD.includes(lg.code);
function lgPresetRecord(){return null}
function lgPresetFix(){return false}
function lgSeed(){}
window.lgSeed=lgSeed;window.lgPresetRecord=lgPresetRecord;window.LG_PRESET=LG_PRESET;
const LG_RULES=[];
const lgRulesCard=lg=>'';
/* ---------- screens ---------- */
/* Known venue events: each appears once, with its flyer as the card background. Opening goes to the event home. */
function lgEventCode(kind){
  if(kind==='lingkana')return (typeof LK_CODE==='string'&&LK_CODE)||'LINGKN26';
  return'';
}
function lgEventKnown(){
  const lk=lgEventCode('lingkana');
  /* Onion Shed Challenge hidden from the Leagues list for now (19 Nov 2026, Nathe) - it needs major
     changes before it's shown again. Not deleted: the card is just left out of this list. */
  return[
    {code:lk,kind:'lingkana',name:(typeof LK_NAME==='string'&&LK_NAME)||'Lingkana League',flyer:'img/lingkana-flyer.jpg',sub:'Invite only'}
  ];
}
function lgEventCardHTML(ev){
  const escFn=typeof esc==='function'?esc:(typeof h==='function'?h:t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])));
  return`<button type="button" class="st-evcard" data-evopen="${escFn(ev.code)}" data-evkind="${escFn(ev.kind)}" style="background-image:url('${escFn(ev.flyer)}')"><span class="st-evcard-shade"></span><span class="st-evcard-body"><b>${escFn(ev.name)}</b><span class="st-evsub">${escFn(ev.sub)}</span></span></button>`;
}
function lgEventCardsHTML(){
  const seen=new Set();
  const bits=[];
  for(const ev of lgEventKnown()){
    if(!ev.code||seen.has(ev.code))continue;
    seen.add(ev.code);
    bits.push(lgEventCardHTML(ev));
  }
  return`<div class="st-evlist">${bits.join('')}</div>`;
}
function lgEventCodes(){return new Set(lgEventKnown().map(e=>e.code).filter(Boolean))}
window.lgEventKnown=lgEventKnown;window.lgEventCardsHTML=lgEventCardsHTML;window.lgEventCardHTML=lgEventCardHTML;window.lgEventCodes=lgEventCodes;
function lgCard(){if(!TESTER)return'';lgSeed();const me=h2hMe(),L=lgAll().filter(l=>!lgPresetHidden(l)).reverse();
 const used=lgEventCodes();
 const extras=L.filter(l=>!used.has(l.code));
 return`<div class="card" id="lgcard"><span class="kicker">Leagues</span><h3 class="st-evh">Leagues</h3>
 ${lgEventCardsHTML()}
 ${extras.map(lg=>lg.status=='invite'?`<div class="list-item"><b>${esc(lgName(lg.host))} invited you to ${esc(lg.name)}</b><div class="row" style="gap:6px;justify-content:flex-start;margin-top:6px"><button class="btn alt" data-lgacc="${lg.code}">Join league</button><button class="btn ghost" data-lgno="${lg.code}">Not now</button></div></div>`
  :`<div class="list-item row"><span><b>${esc(lg.name)}</b><div class="small muted">${lg.fin?'Final shoot-up':'Week '+lgWeek(lg)+' of 6'} · ${lgArchers(lg).length} archers</div></span><button class="btn ghost" data-lgopen="${lg.code}">Open</button></div>`).join('')}
 <details id="lgnew"><summary>New league</summary><label for="lgname">League name</label><input id="lgname" maxlength="40" placeholder="League name"><p class="small muted" style="margin:6px 0">Format: six 300s at 18 m on the vertical 3-spot, cumulative total, then one shoot-up final. <span id="lgrules">${LG_FINTXT}</span></p>
 <fieldset class="h2hops nm-real"><legend>Who's in</legend><button type="button" class="btn ghost" id="lgtpl" style="margin:0 0 6px">Use the usual group</button>${TESTERS.filter(t=>t.id!=me&&!LG_EXCL.includes(t.id)).map(t=>`<label class="h2htk"><input type="checkbox" data-lgop="${t.id}"> ${esc(t.name)}</label>`).join('')}</fieldset>
 <p class="small muted" style="margin:4px 0">You plus up to 9 others (10 archers max). Others can also join with the league code.</p>
 <details><summary class="small">Week dates (optional)</summary>${[1,2,3,4,5,6].map(w=>`<label for="lgd${w}">${w<6?'Week '+w:'Day 6 (together)'}</label><input type="date" id="lgd${w}">`).join('')}</details>
 <button class="btn alt full" id="lggo" style="margin-top:8px">Create league</button></details>
 <div class="row" style="gap:6px;margin-top:8px"><input id="lgjc" placeholder="League code" maxlength="8" autocapitalize="characters" style="flex:1"><button class="btn ghost" id="lgjgo">Join</button></div><p class="small" id="lgjmsg" role="alert"></p></div>`}
function lgBindCard(){const c=$('#lgcard');if(!c)return;
 c.querySelectorAll('[data-evopen]').forEach(b=>b.onclick=()=>{const code=b.getAttribute('data-evopen');if(typeof lkFlowEnter==='function')lkFlowEnter(code);else if(typeof lkFlowHome==='function')lkFlowHome(code);else lgView(code)});
 c.querySelectorAll('[data-lgopen]').forEach(b=>b.onclick=()=>lgView(b.dataset.lgopen));
 c.querySelectorAll('[data-lgacc]').forEach(b=>b.onclick=()=>{const lg=lgGet(b.dataset.lgacc);lg.status='active';lg.dirty=1;save();lgTick(true);lgView(lg.code)});
 c.querySelectorAll('[data-lgno]').forEach(b=>b.onclick=()=>{S.leagues=lgAll().filter(l=>l.code!=b.dataset.lgno);save();score()});
 
 const g=$('#lggo');if(g)g.onclick=()=>{if(lgAll().filter(l=>!lgPresetHidden(l)&&l.host==h2hMe()&&!lgFinDone(l)).length>=3)return;const T=[...c.querySelectorAll('[data-lgop]:checked')].map(x=>x.dataset.lgop);if(T.length>H2H_MAX-1)return;
  const lg=lgCreate($('#lgname').value,T,[1,2,3,4,5,6].map(w=>($('#lgd'+w)||{}).value||''));if(lg)lgView(lg.code)};
 const j=$('#lgjgo');if(j)j.onclick=async()=>{const msg=await lgJoin($('#lgjc').value);const e=$('#lgjmsg');if(e&&msg)e.textContent='⚠ '+msg}}
const lgFinDone=lg=>{const m=lg.fin&&h2hGet(lgFinCode(lg));return!!(m&&window.suLadder&&suLadder(m).length&&suLadder(m).slice(-1)[0].res.winner)};
const _lgH2H=window.h2hCard;window.h2hCard=function(){return _lgH2H.apply(this,arguments)+lgCard()};
const _lgScore=score;score=function(){const o=_lgScore.apply(this,arguments);try{lgBindCard()}catch(e){console.error(e)}return o};
function lgEntryCard(lg,w,ids){const me=h2hMe(),act0=window._lgAct&&ids.includes(window._lgAct)?window._lgAct:null;
 const hd=window._lgHold,held=!!(ids.length>1&&act0&&hd&&hd.id==act0&&hd.n==((lgEnt(lg,act0,w)||{e:[]}).e||[]).length),
  a=act0&&(!lgDoneE(lgEnt(lg,act0,w))||held)?act0:lgWavePick(lg,w,ids);
 const I=lgInfo(lg,w),NE=I.ends,e=lgEnt(lg,a,w)||{e:[]},last=e.e[e.e.length-1],hold=held&&a==act0&&!!last&&last.length==3,cur3=last&&(last.length<3||hold)?last:[],en=Math.min(NE,e.e.length+(last&&last.length<3?0:1)),lock=lgLockedBy(lg,w,a),done=lgDoneE(e);
 /* Lingkana is values only. Other leagues: one archer on this phone gets the Just me face (Hide target still works). Shared phones stay buttons only. */
 const lkVals=typeof lkIs==='function'&&lkIs(lg),
  PL=!lkVals&&ids.length==1&&!lock&&!!window.csAdCard,NS='lg|'+lg.code+'|'+w+'|'+a,FX=PL?csFxFor(NS):null,LR=ROUNDS[LG_R],
  AD=PL?csAdCard({ns:NS,en:e,ape:3,ends:NE,R:LR,FR:face3R(faceR(LR,0),{face3:'vert'}),round:LG_R,keys:LG_KEYS,kcol:col,kattr:'data-lgk',uid:'lgundo',fx:FX,done,info:(ei,fin)=>`<b>${esc(lgName(a))}</b> · ${fin?I.done:'End '+(ei+1)+' of '+NE}`}):null;
 window._lgPl=AD&&AD.pl?{...AD.pl,code:lg.code,w,id:a}:null;
 return`<div class="card" id="lgentry"><span class="kicker">Score card · ${I.kicker} ${w}</span><div class="row lc-chips" style="gap:6px;flex-wrap:wrap;justify-content:flex-start">${ids.map(id=>{const x=lgEnt(lg,id,w),n=x&&x.e?x.e.filter(z=>z.length==3).length:0,lb=lgLockedBy(lg,w,id);
  return`<button class="lc-chip${id==a?' on':''}" data-lgid="${esc(id)}">${esc(lgName(id))} <span class="small">${lgDoneE(x)?'finished':lb?'on '+esc(lgName(lb))+'\'s phone':n+'/'+NE}</span></button>`}).join('')}</div>
 ${AD?AD.html:`<p style="margin:8px 0 4px"><b>${esc(lgName(a))}</b> · ${hold?(done?I.done:'End '+e.e.length+' of '+NE+' complete'):done?I.done:'End '+en+' of '+NE} · ${I.face} · ${I.dist}</p>${lgLastLine(lg,w,ids)}
 ${lock?`<p class="small" id="lglock">Being scored on ${esc(lgName(lock))}'s phone. Only one phone can score an archer's week.</p><button class="btn ghost" id="lgtake" data-lgtk="${esc(a)}">Take over scoring here</button>`:hold?`<div class="vg-slots">${[0,1,2].map(j=>`<span class="vg-slot on">${esc(last[j]||'')}</span>`).join('')}</div>
 <p class="small" id="lgendmsg" style="margin:6px 0 0">${done?I.done+'.':'End '+e.e.length+' of '+NE+' is in.'} Check the three arrows, then tap Next.</p><button class="btn alt" id="lgnextarcher" style="margin-top:8px;min-height:56px;font-size:18px;width:100%">Next</button>`:done?'':`<div class="vg-slots">${[0,1,2].map(j=>`<span class="vg-slot${cur3[j]?' on':''}">${cur3[j]?esc(cur3[j]):''}</span>`).join('')}</div>
 <div class="ad-pad lc-pad" style="--cols:7;margin-top:8px">${LG_KEYS.map(k=>`<button class="${col(k)}" data-lgk="${k}" aria-label="score ${k}">${k}</button>`).join('')}</div>`}<button class="btn ghost" id="lgundo" style="margin-top:6px" ${lock?'disabled':''}>Undo</button>`}
 ${AD?'':lgNextPref(lg,ids)}
 <p class="small muted" id="lgq">${lg.qfail?'Offline: results are saved here and will send when you are back online.':lg.dirty?'Sending…':'Saved and sent to the league.'}</p></div>`}
/* analysis straight under the score once my own week is finished: the same summary and group analysis Just me shows */
function lgAnCard(lg,w){try{const me=h2hMe();if(!lgDoneE(lgEnt(lg,me,w))||!window.roundSummary)return'';const s=S.sessions.find(x=>x.id=='lg-'+lg.code+'-w'+w);if(!s)return'';return`<div id="lgan">${roundSummary(s)}${window.shootCompareHTML?shootCompareHTML(s):''}</div>`}catch(e){console.error(e);return''}}
/* Scoring taps, Undo, fixing an arrow and background relay refreshes re-draw this screen; they set window._lgKeep so the page stays exactly where it was (score keys and sheet stay on screen). Opening the screen, an archer chip and Back still start at the top. Display only. */
function lgView(code){const lg=lgGet(code);if(!lg)return;const _lkScore=window._lgE&&window._lgE.code==code;if(typeof lkView==='function'&&typeof lkIs==='function'&&lkIs(lg)&&!_lkScore)return lkView(code);const keepY=window._lgKeep?scrollY:null;window._lgKeep=null;window._lgv=code;cur=null;$('#tabs').hidden=false;const me=h2hMe(),host=lg.host==me,w=lgWeek(lg),rows=lgTable(lg),G=lgGroups(lg,w),gk=lgGroupOf(lg,w,me),fm=lg.fin&&h2hGet(lgFinCode(lg));
 const wk=d=>d?new Date(d+'T00:00').toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'}):'';
 const E=window._lgE&&window._lgE.code==code&&window._lgE.w==w?window._lgE:null;
 const mine=gk==null?`<p class="small" style="margin:0 0 6px">You score on your own phone this week.</p><button class="btn alt" data-lgme="1">${lgDoneE(lgEnt(lg,me,w))?'View my week '+w:'Score my week '+w}</button>`
  :`<p class="small" style="margin:0 0 6px">Shared phone, group ${gk+1}: ${G[gk].map(id=>esc(lgName(id))).join(', ')}. Any member's phone can score the group.</p><button class="btn alt" data-lgsg="${gk}">Score group ${gk+1} on this phone</button>`;
 const GS=lgArchers(lg).filter(lgIsG),ced=lgCanEd(lg)&&!lg.fin,full=lgArchers(lg).length>=h2hCap(lg);
 const addC=ced?`<div class="card" id="lgadd">${GS.length?`<p class="small" style="margin:0 0 6px">Shooters you score for: ${GS.map(id=>esc(lgName(id))).join(', ')}.</p><button class="btn alt" data-lgguests="1">Score added shooters, week ${w}</button>`:''}
  <details id="lgaddd" style="margin-top:${GS.length?8:0}px"><summary class="btn ghost" style="display:inline-block">Add a shooter</summary>${full?'<p class="small muted" style="margin:6px 0 0">This league is full (10 archers).</p>':`<p class="small muted" style="margin:6px 0">For someone without the app. You enter their 300s each week.</p>
  <label for="lggname">Name</label><input id="lggname" maxlength="24" autocomplete="off"><label class="h2htk" style="margin-top:6px"><input type="checkbox" id="lggjr"> Under 16 (nickname only)</label>
  <button class="btn alt" id="lggadd" style="margin-top:6px">Add</button><p class="small" id="lggmsg2" role="alert" style="margin:4px 0 0"></p>`}</details></div>`:'';
 const tab=`<div class="lg-wrap"><table class="ad-tab lg-tab"><thead><tr><th></th><th>Archer</th>${[1,2,3,4,5,6].map(k=>`<th>W${k}</th>`).join('')}<th>Total</th><th>X</th></tr></thead><tbody>${rows.map((r,k)=>`<tr class="${k==0&&r.t>0&&!r.tie?'lead':''}" data-lgrow="${esc(r.id)}"><td>${r.tie?'=':''}${r.rk}</td><td>${k==0&&r.t>0&&!r.tie?'▲ ':''}${esc(r.nm)}${r.id==me?' (you)':''}${lgIsG(r.id)?' <span class="lg-gtag">scored by host</span>':''}</td>${r.W.map(c=>`<td>${c?(c.d?c.s:`<i class="muted">${c.s}</i>`):'-'}</td>`).join('')}<td><b>${r.t}</b></td><td>${r.x}</td></tr>`).join('')}</tbody></table></div>
 <p class="small muted" style="margin:4px 0 0">Max 1800. Ties split on X count. '-' = not shot; italics = still shooting. Every week: ${LG_RL}, ${LG_FACE.toLowerCase()}.</p>`;
 /* how this week is scored (host): a clear choice per archer, own phone or a shared phone for the group. Saved on tap. (Coach re-test, 20 Oct) */
 const GA=lgGroups(lg,w),seg=(id,g,lab,on,dis)=>`<button type="button" class="lg-seg${on?' on':''}" data-lggb="${esc(id)}" data-g="${g}" aria-pressed="${on}" ${dis?'disabled':''}>${lab}</button>`;
 const grpEd=host&&!lg.fin?`<div class="card" id="lggrp"><span class="kicker">Week ${w} · how it's scored</span><h3 style="margin:2px 0 4px">One phone or own phones?</h3>
  <p class="small muted" style="margin:0 0 8px">Tap for each archer. <b>Own phone</b>: they score themselves. <b>Phone 1, 2 or 3</b>: one phone scores that whole group. You can move an archer at any time. Scores already shot stay with them.</p>
  <div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start;margin:0 0 8px"><button type="button" class="btn ghost" id="lgallown">Everyone on own phone</button><button type="button" class="btn ghost" id="lgallone">Everyone on one phone</button></div>
  ${lgArchers(lg).map(id=>{const k=lgGroupOf(lg,w,id),st=lgHas(lgEnt(lg,id,w));return`<div class="lg-grow"><span class="lg-gname">${esc(lgName(id))}${st?' <span class="small muted">(started)</span>':''}</span><span class="lg-segs" role="group" aria-label="How ${esc(lgName(id))} is scored">${seg(id,'',k==null?'&#10003; Own phone':'Own phone',k==null,false)}${[0,1,2].map(g=>seg(id,g,k===g?'&#10003; Phone '+(g+1):'Phone '+(g+1),k===g,false)).join('')}</span></div>`}).join('')}
  <p class="small" id="lggmsg" role="alert" style="margin:6px 0 0"></p></div>`:'';
 const done6=lgArchers(lg).filter(id=>lgDoneE(lgEnt(lg,id,LG_W))).length;
 /* 27 Oct 2026 (Nathe): scoring a phone group (or your own week, or added shooters) opens on its OWN page, laid out like Casual scoring, with Back to league. The league screen (including 'One phone or own phones?') is left exactly as it was. Display only: scoring, saved scores and the relay are unchanged. */
const sp=!!(E&&!fm);
if(sp){const SI=E.ids,rw=SI.map(id=>{const x=lgEnt(lg,id,w),EE=(x&&x.e||[]).filter(z=>z&&z.length);return{id,n:EE.filter(z=>z.length==3).length,t:lgTot(EE),x:lgXs(EE),EE}});
 app.innerHTML=`<div id="lgview" class="lgsp"><div class="card dark"><span class="kicker">League · week ${w} · ${SI.length>1?'shared phone':'scoring'}</span><h1>${esc(lg.name)}</h1>
<p class="small" style="margin:0">${esc((lgInfo(lg,w).title))} · ${esc(lgInfo(lg,w).face)} · ${esc(lgInfo(lg,w).dist)} · ${lgInfo(lg,w).kicker+' '+w}${lg.weeks&&lg.weeks[w-1]?' · '+wk(lg.weeks[w-1]):''}</p><div class="row" style="gap:6px;justify-content:flex-start;margin-top:8px"><button class="btn ghost" id="lgtoleague" data-lgtl="1">Back to league</button></div></div>
${lgEntryCard(lg,w,SI)}
<div class="card" id="lgscores"><h3>Scores</h3><table class="ad-tab cs-tab" style="width:100%"><thead><tr><th>Archer</th><th>Ends</th><th>Score</th><th>X</th></tr></thead><tbody>${rw.map(r=>`<tr data-lgsrow="${esc(r.id)}"><td>${esc(lgName(r.id))}${r.id==me?' (you)':''}</td><td>${r.n}/${lgInfo(lg,w).ends}</td><td><b>${r.t}</b></td><td>${r.x}</td></tr>`).join('')}</tbody></table>
<p class="small muted" style="margin:4px 0 0">This week's scores only. The league table is on the league screen.</p>
<details id="lgsends"><summary class="small">Ends for each archer</summary>${rw.map(r=>`<div class="small" style="margin:6px 0"><b>${esc(lgName(r.id))}</b>: ${r.EE.length?r.EE.map((e,i)=>`E${i+1} ${esc(e.join(' '))} (${lgTot([e])})`).join(' · '):'no ends yet'}</div>`).join('')}</details></div>
${lgAnCard(lg,w)}
<div class="card">${lg.qfail?'<p class="small" id="lgoff">Offline: results waiting to send.</p>':''}<div class="row" style="gap:6px;justify-content:flex-start"><button class="btn ghost" id="lgrf">Refresh now</button><button class="btn alt" id="lgtoleague2" data-lgtl="1">Back to league</button></div></div></div>`}
else app.innerHTML=`<div id="lgview"><div class="card dark"><span class="kicker">League · ${esc(window.rdPick?rdPick(LG_R):LG_RL)} · ${LG_FACE}</span><h1>${esc(lg.name)}</h1>
 <p class="small" style="margin:0">${lg.fin?'All six 300s are in. Final shoot-up.':w<6?`Week ${w} of 6 is current${lg.weeks&&lg.weeks[w-1]?' · '+wk(lg.weeks[w-1]):''}. One 300 each, at home or together.`:`Day 6${lg.weeks&&lg.weeks[5]?' · '+wk(lg.weeks[5]):''}: everyone shoots the 6th 300 together. Then the shoot-up final.`}</p></div>
 ${lgRulesCard(lg)}
 ${fm?`<div class="card"><button class="btn alt" id="lgfin">${lgFinDone(lg)?'Final result':'Open the final shoot-up'}</button></div>`:`<div class="card" id="lgmine">${mine}</div>`}
 ${addC}${grpEd}${lgAnCard(lg,w)}
 <div class="card"><h3>League table</h3>${tab}</div>
 ${host&&!lg.fin?`<div class="card"><div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start">${!(lg.weeks||[]).some(Boolean)&&w<6?`<button class="btn ghost" id="lgnext">Move to week ${w+1}</button>`:''}${w==6&&done6>=2?`<button class="btn ghost" id="lgforce">Start shoot-up now</button>`:''}</div>${w==6?`<p class="small muted">The final starts by itself when every archer's day-6 300 is in (${done6} of ${lgArchers(lg).length}).</p>`:''}</div>`:''}
 <div class="card"><p class="small" style="margin:0">League code <b id="lgcode">${esc(code)}</b>. Share it so others can join.</p>${lg.qfail?'<p class="small" id="lgoff">Offline: results waiting to send.</p>':''}
 <div class="row" style="gap:6px;justify-content:flex-start;margin-top:6px"><button class="btn ghost" id="lgrf">Refresh now</button><button class="btn ghost" id="lgback">All leagues</button>${lgFinDone(lg)?`<button class="btn ghost" id="lgdel">Remove</button>`:''}</div></div></div>`;
 const q=s=>app.querySelector(s);
 if(q('[data-lgme]'))q('[data-lgme]').onclick=()=>{window._lgRet=scrollY;window._lgE={code,w,ids:[me]};window._lgAct=me;window._lgHold=null;lgView(code)};
 if(q('[data-lgsg]'))q('[data-lgsg]').onclick=()=>{window._lgRet=scrollY;window._lgE={code,w,ids:G[gk].slice()};window._lgAct=null;window._lgHold=null;lgView(code)};
 if(q('[data-lgguests]'))q('[data-lgguests]').onclick=()=>{window._lgRet=scrollY;window._lgE={code,w,ids:GS.slice()};window._lgAct=null;window._lgHold=null;lgView(code)};
 if(q('#lggjr'))q('#lggjr').onchange=e=>{q('label[for=lggname]').textContent=e.target.checked?'Nickname':'Name'};
 if(q('#lggadd'))q('#lggadd').onclick=()=>{const m=lgAddGuest(code,q('#lggname').value,q('#lggjr').checked);if(m){q('#lggmsg2').textContent=m;return}lgView(code)};
 app.querySelectorAll('[data-lgid]').forEach(b=>b.onclick=()=>{window._lgAct=b.dataset.lgid;lgView(code)});
 const act=q('#lgentry .lc-chip.on')&&q('#lgentry .lc-chip.on').dataset.lgid;
 if(window._lgPl&&window._lgPl.code==code&&window.csFaceBind)window.csFaceBind(window._lgPl,(k,xy)=>{window._lgAct=act;window._lgKeep=1;lgKey(code,w,act,k,xy);window._lgKeep=null},()=>lgView(code));
 app.querySelectorAll('[data-lgk]').forEach(b=>b.onclick=()=>{window._lgAct=act;window._lgKeep=1;lgKey(code,w,act,b.dataset.lgk);window._lgKeep=null});
 if(window.csAdBind)csAdBind(()=>lgView(code));if(q('#csdelarrow'))q('#csdelarrow').onclick=()=>{window._lgAct=act;window._lgKeep=1;lgFxDel(code,w,act);window._lgKeep=null};
 if(q('#lgnextarcher'))q('#lgnextarcher').onclick=()=>{window._lgKeep=1;lgNextArcher(code,w,act);lgView(code);window._lgKeep=null};
 if(q('#lgundo'))q('#lgundo').onclick=()=>{window._lgAct=act;window._lgLast=null;window._lgKeep=1;lgUndo(code,w,act);window._lgKeep=null};
 if(q('#lgnextpref'))q('#lgnextpref').onchange=e=>{S.lgNextBtn=e.target.checked?1:0;if(!S.lgNextBtn&&window._lgHold){const h=window._lgHold;lgNextArcher(code,w,h.id)}window._lgLast=null;save();window._lgKeep=1;lgView(code);window._lgKeep=null};
 if(q('#lgtake'))q('#lgtake').onclick=()=>{window._lgAct=act;lgTake(code,w,act)};
 const setG=G2=>{const ok=lgSetGroups(code,w,G2);if(!ok){q('#lggmsg').textContent='Only the host can change how the week is scored.';return}lgView(code)};
 app.querySelectorAll('[data-lggb]').forEach(b=>b.onclick=()=>{const id=b.dataset.lggb,g=b.dataset.g,G2=[0,1,2,3].map(k=>(GA[k]||[]).filter(x=>x!=id));if(g!=='')G2[+g].push(id);setG(G2)});
 if(q('#lgallown'))q('#lgallown').onclick=()=>setG([[],[],[],[]]);
 if(q('#lgallone'))q('#lgallone').onclick=()=>setG([lgArchers(lg).slice(),[],[],[]]);
 if(q('#lgnext'))q('#lgnext').onclick=()=>{lg.cw=w+1;lg.cwt=Date.now();lg.dirty=1;save();lgTick(true);lgView(code)};
 if(q('#lgforce'))q('#lgforce').onclick=()=>{if(done6<lgArchers(lg).length&&!confirm('Start the shoot-up now? Archers without a day-6 300 are left out.'))return;if(lgForce(code))suLadderView(lgFinCode(lg))};
 if(q('#lgfin'))q('#lgfin').onclick=()=>suLadderView(lgFinCode(lg));
 app.querySelectorAll('[data-lgtl]').forEach(b=>b.onclick=()=>{const y=window._lgRet||0;window._lgE=null;window._lgRet=null;window._lgAct=null;window._lgHold=null;lgView(code);scrollTo(0,y);requestAnimationFrame(()=>scrollTo(0,y))});
 q('#lgrf').onclick=()=>lgTick(true);if(q('#lgback'))q('#lgback').onclick=()=>{window._lgv=null;window._lgE=null;nav(view=='lab_leagues'?'lab_leagues':'score')};
 if(q('#lgdel'))q('#lgdel').onclick=()=>{if(!confirm('Remove this league from this phone? Other phones keep it.'))return;S.leagues=lgAll().filter(l=>l.code!=code);S.matches=h2hAll().filter(m=>m.code!=lgFinCode(lg));save();window._lgv=null;nav('score')};
 if(!(window.csAdFit&&q('#csad .ad-pad')&&!(keepY!=null&&S.hideFace)&&csAdFit())){if(keepY!=null){const fit=()=>{scrollTo(0,keepY);/* the line above the keys can wrap for a longer name: if that pushed the keys under the bottom bar (or above the top bar), nudge just enough to bring them back */const pd=q('#lgentry .lc-pad'),sc=window.__scroller,nv=document.querySelector('nav'),hd=document.querySelector('header.top,header');if(!pd||!sc)return;const r=pd.getBoundingClientRect(),lo=Math.min(sc.getBoundingClientRect().bottom,nv&&nv.getBoundingClientRect().top>0?nv.getBoundingClientRect().top:1e9)-6,hi=(hd?hd.getBoundingClientRect().bottom:0)+4;if(r.bottom>lo)scrollTo(0,keepY+(r.bottom-lo));else if(r.top<hi)scrollTo(0,Math.max(0,keepY-(hi-r.top)))};fit();requestAnimationFrame(fit)}else scrollTo(0,0)}}
window.lgView=lgView;window.lgEntryCard=lgEntryCard;
/* leaving by a tab or screen change closes the scoring page, so reopening the league starts on the league screen */
const _lgNav=nav;nav=function(){window._lgE=null;window._lgRet=null;return _lgNav.apply(this,arguments)};
