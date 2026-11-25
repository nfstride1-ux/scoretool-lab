/* Casual shoot (21 Oct 2026, spec from Nathe via Archery Coach). A one-off group shoot, separate from the league: never counted in
   the league table, no leaderboard and nothing added up across shoots. It just keeps that shoot's scores.
   Setup (Score tab, 'Casual shoot'): pick Target, Indoor, Field or 3D (see CS3D below), then a round from the app's own ROUNDS list:
     Target = every standard outdoor round (faces from faceR: 122 cm, 80 cm, 80 cm 6-ring per distance block; practice rounds any face)
     Indoor = rounds where indoor3() is true, plus Vegas 300; face is the vertical 3-spot or Vegas 3-spot only (face3R, keys X 10-6 M); Australian Indoor 18m can also be the single 40cm face (keys X 10-1 M)
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
const csStd=()=>Object.keys(ROUNDS).filter(r=>{const R=ROUNDS[r];return R&&!R.custom&&!R.legacy&&!R.aba&&!R.league&&!R.ifaa});
/* discipline of a round, from the app's own face helpers */
function csDisc(r){const R=ROUNDS[r];if(!R)return null;const c=(S.customRounds||[]).find(x=>x&&x.name===r);if(c){const d=c.kind==='3d'?'3d':(c.disc||'target');return CS_DISC[d]?d:'target'}if(R.retired&&R.disc&&CS_DISC[R.disc])return R.disc;if(R.d3||R.aba||R.kind==='3d')return'3d';if(R.clout||/clout/i.test(r))return'clout';const F=faceR(R,0);if(isFld(F))return'field';if(R.vegas||indoor3(R,F))return'indoor';return'target'}
const CS_DISC={target:'Target',indoor:'Indoor',field:'Field',clout:'Clout','3d':'3D'};
const csRounds=d=>csStd().filter(r=>csDisc(r)==d);
/* ---------- 3D (23 Oct 2026, Nathe via Archery Coach). Points from the app's own Rules page (lab.js RULES):
   ABA National 3D: 1st arrow A/B/C 20/18/16, 2nd 14/12/10, 3rd 8/6/4; only the first arrow to score counts; 3-, 2- or 1-arrow round
   (the WA Interclub sheet is a 3-arrow half then a 1-arrow half). IBO: 11/10/8/5/0. ASA: 12/10/8/5/0 (the 14 ring is special events
   only, left out). One score a target; the archer sets the number of targets. Keys: gold top, blue middle, navy low, M grey. */
const CS3D={aba3:{l:'ABA 3-arrow',o:'ABA',k:['20','18','16','14','12','10','8','6','4','M'],c:'gggbbbnnn'},aba2:{l:'ABA 2-arrow',o:'ABA',k:['20','18','16','14','12','10','M'],c:'gggbbb'},
 aba1:{l:'ABA 1-arrow',o:'ABA',k:['20','18','16','M'],c:'ggg'},aba31:{l:'ABA 3-arrow + 1-arrow',o:'ABA',k:['20','18','16','14','12','10','8','6','4','M'],c:'gggbbbnnn',half:1},
 ibo:{l:'IBO',o:'IBO',k:['11','10','8','5','M'],c:'ggbn'},asa:{l:'ASA',o:'ASA',k:['12','10','8','5','M'],c:'ggbn'}};
const CS3D_MAX=60,cs3dName=(t,n)=>{const T=CS3D[t]||CS3D.aba3;n=Math.max(1,Math.min(CS3D_MAX,Math.round(+n)||20));return'3D '+T.l+' ('+(T.half?'2 x ':'')+n+' targets)'};
/* rounds are named by type and count, and made on the fly (also on other phones and after a reload); hidden from the Just me picker */
function cs3dReg(name){if(typeof name!='string')return false;if(ROUNDS[name])return!!ROUNDS[name].d3;const m=name.match(/^3D (.+) \((2 x )?(\d+) targets\)$/);if(!m)return false;
 const t=Object.keys(CS3D).find(k=>CS3D[k].l==m[1]),n=+m[3];if(!t||!!CS3D[t].half!=!!m[2]||n<1||n>CS3D_MAX||cs3dName(t,n)!=name)return false;const T=CS3D[t],top=+T.k[0];
 ROUNDS[name]={ends:T.half?2*n:n,ape:1,face:T.o+' 3D animal',max:top*(T.half?2*n:n),d3:t,d3n:n,practice:true,legacy:true};return true}
/* arrows a target, for the picker label: ABA n-arrow types, IBO and ASA one arrow */
const cs3dPer=k=>({aba3:3,aba2:2,aba1:1}[k]||1);
const cs3d=cs=>{const R=ROUNDS[cs.round];return R&&R.d3?CS3D[R.d3]:null};
const cs3dK=(cs,ei)=>{const R=ROUNDS[cs.round],T=CS3D[R.d3];return T.half&&ei>=R.d3n?CS3D.aba1.k:T.k};
const cs3dCol=(cs,k)=>{const T=cs3d(cs),i=T.k.indexOf(k),c=k=='M'||i<0?'m':T.c[i];return{g:'k-y',b:'k-b',n:'k-n',m:'k-m'}[c]};
/* ABA scoring flow, as in the Just me ABA scorer: arrow 1 buttons first (20/18/16); only Miss brings up arrow 2 (14/12/10), then arrow 3 (8/6/4);
   a hit records that target's score. Display only: a target is still stored as the one score it earned, so totals, relay and saved data are unchanged. */
const csAbaN=(cs,ei)=>{const R=ROUNDS[cs.round],T=R&&R.d3?CS3D[R.d3]:null;if(!T||T.o!='ABA')return 0;return T.half?(ei<R.d3n?3:1):cs3dPer(R.d3)};
const csStgKey=(cs,id,ei)=>cs.code+'|'+id+'|'+ei,csStg=(cs,id,ei)=>window._csStg&&window._csStg.k==csStgKey(cs,id,ei)?window._csStg.s:0;
const csAbaHalf=(cs,ei)=>{const R=ROUNDS[cs.round],T=CS3D[R.d3];return T.half?(ei<R.d3n?'First half':'Second half')+' \u00b7 target '+(ei<R.d3n?ei+1:ei-R.d3n+1)+' of '+R.d3n:'Target '+(ei+1)+' of '+R.ends};
/* Same running totals as the Just me ABA scorer: per half, per 10-target block, and the most still possible (20 a target). Display only. */
function csAbaSum(cs,id){const R=ROUNDS[cs.round],E=csEnds(cs,id),sz=R.d3&&CS3D[R.d3].half?[R.d3n,R.ends-R.d3n]:[R.ends],V=E.map(e=>e.length?csV(e[0]):null);let i0=0;
 const H=sz.map(t=>{const v=[...Array(t)].map((_,j)=>V[i0+j]===undefined?null:V[i0+j]);i0+=t;let run=0;const rn=v.map((x,j)=>{if(j%10==0)run=0;return x==null?null:(run+=x)});
  const sub=[];for(let b=0;b<t;b+=10)sub.push({from:b+1,to:Math.min(t,b+10),s:v.slice(b,b+10).reduce((a,x)=>a+(x||0),0)});return{t,v,rn,sub,tot:v.reduce((a,x)=>a+(x||0),0)}});
 const done=V.filter(x=>x!=null).length,tot=H.reduce((a,o)=>a+o.tot,0);return{H,tot,max:tot+(R.ends-done)*20,done,li:V.map((x,j)=>x==null?-1:j).filter(j=>j>=0).pop()}}
function csAbaTotHtml(cs,id){const R=ROUNDS[cs.round],S3=csAbaSum(cs,id),two=S3.H.length>1,nm=h=>two?(h?'Second half':'First half'):'Round';let last='';
 if(S3.li!=null){let h=0,j=S3.li;while(h<S3.H.length-1&&j>=S3.H[h].t){j-=S3.H[h].t;h++}const o=S3.H[h],b=Math.floor(j/10),v=o.v[j];last=`<div class="list-item" id="csabalast" style="margin:4px 0">Last: ${nm(h).toLowerCase()} target ${j+1} scored <b>${v}</b>${v?'':' (no score)'} \u00b7 running total for targets ${o.sub[b].from}-${o.sub[b].to} <b>${o.rn[j]}</b></div>`}
 return`<p class="small" style="margin:4px 0" id="csabatot">Total <b>${S3.tot}</b> \u00b7 most still possible <b>${S3.max}</b> of ${R.ends*20}</p><div class="small muted" id="csabahalves">${S3.H.map((o,h)=>`${nm(h)}: <b>${o.tot}</b> (${o.sub.map(b=>b.from+'-'+b.to+': '+b.s).join(', ')})`).join(' \u00b7 ')}</div>${last}`}
try{for(const x of[...(S.casual||[]),...(S.sessions||[]),...(S.matches||[])])cs3dReg(x&&x.round)}catch(e){}
/* face for end ei: the same faceR / face3R the main scorer uses (indoor always on a 3-spot) */
/* Mixed faces (28 Oct 2026, Nathe): on Indoor WA 18m / 25m / Combined and Australian Indoor 18m each archer picks their own face, Three spot or Single face.
   cs.fa = {archerId:'three'|'single'} is set by the host (setup, or the Face buttons while that archer has no arrows); a linked archer on their own phone sets cs.sc[id].f instead.
   Nothing stored = the shoot's own face (cs.face3), so shoots made before this behave exactly as they did. Vegas 300 stays a 3-spot game for everyone. */
const csSplitR=(round,disc)=>disc=='indoor'&&!!ROUNDS[round]&&(round==AUSI||f3One(round));
const csSplit=cs=>csSplitR(cs.round,cs.disc);
const csBase=cs=>cs.face3=='single'&&cs.round==AUSI?'single':cs.face3=='vegas'?'vegas':'vert';
/* one archer's face: 'single', 'vegas' or 'vert' (the three-spot layout comes from the shoot) */
function csAF(cs,id){const b=csBase(cs);if(id==null||!csSplit(cs))return b;const v=((cs.sc||{})[id]||{}).f||(cs.fa||{})[id];return v=='single'?'single':v=='three'&&b=='single'?'vert':b}
const csMixed=cs=>{try{return csSplit(cs)&&(cs.ppl||[]).length>1&&new Set(cs.ppl.map(p=>csAF(cs,p.id)=='single')).size>1}catch(e){return false}};
function csFace(cs,ei,id){const R=ROUNDS[cs.round];if(!R)return{face:''};const F0=faceR(R,ei);let F;if(isFld(F0))F=F0;else if(R.vegas)F=face3R(F0,{face3:'vegas'});else if(indoor3(R,F0)){const a=csAF(cs,id);F=a=='single'?F0:face3R(F0,{face3:a=='vegas'?'vegas':'vert'})}else F=F0;if(R.wa18||R.ausi){if(F===R)F={...F}}if(R.wa18){F.wa18=true;F.inner10=typeof sightedCompound==='function'&&sightedCompound()}if(R.ausi)F.ausi=true;return F}
/* score keys: the main scorer's rule (app.js faceKeys), highest first. Indoor WA 18 m is 10 to 6 and M, with no X. */
function csKeys(cs,ei,id){const R=ROUNDS[cs.round]||{};if(R.d3)return cs3dK(cs,ei||0);const FR=csFace(cs,ei||0,id);if(typeof faceKeys==='function')return faceKeys(R,FR);if(R.wa18)return['10','9','8','7','6','M'];if(R.ausi)return['X','10','9','8','7','6','M'];if(isFld(FR))return['6','5','4','3','2','1','M'];const xk=R.xs===false?[]:['X'];
 return[...xk,...(isSpot(FR)?['10','9','8','7','6']:isSix(FR)?['10','9','8','7','6','5']:['10','9','8','7','6','5','4','3','2','1']),'M']}
const csKcol=(cs,k)=>cs3d(cs)?cs3dCol(cs,k):cs.disc=='field'||isFld(csFace(cs,0))?(k=='M'?'k-m':+k>=5?'k-y':'k-k'):col(k);
const csFaceTxt=cs=>{const R=ROUNDS[cs.round];if(!R)return'';if(R.d3){const T=CS3D[R.d3];return T.o+' 3D animal'+(T.half?', '+R.d3n+' targets 3-arrow then '+R.d3n+' targets 1-arrow':'')+(T.o=='ABA'?', first arrow to score counts':'')}if(R.vegas)return'Vegas 3-spot';const F=faceR(R,0);if(isFld(F))return'Field face, gold 6 and 5, black 4 to 1';if(indoor3(R,F)){if(cs.round==AUSI&&!(cs.ppl||[]).length)return f3Name(AUSI,cs.face3);const A=csSplit(cs)&&(cs.ppl||[]).length?[...new Set(cs.ppl.map(p=>csAF(cs,p.id)))]:[csBase(cs)];return A.map(a=>f3Name(cs.round,a)).join(' + ')}
 const L=[...new Set((R.blocks||[{}]).map((b,k)=>{let e=0;for(let j=0;j<k;j++)e+=+R.blocks[j].ends;return faceR(R,e).face}))].filter(Boolean);return L.length?L.join(' / '):R.face}
const csR=cs=>ROUNDS[cs.round]||{ends:10,ape:3};
const csEndFace=(cs,ei,id)=>{const R0=ROUNDS[cs.round]||{};if(R0.d3){const T=CS3D[R0.d3];return T.half?(ei<R0.d3n?'3-arrow half':'1-arrow half'):T.l}const R=R0,F=faceR(R,ei),sz=(String(F.face||'').match(/^\d+(-\d+)?/)||[''])[0];if(isFld(F))return sz+'cm field face';if(R.vegas||indoor3(R,F))return(sz?sz+'cm ':'')+(R.vegas?'Vegas 3-spot':cs.round==AUSI?f3Name(AUSI,csAF(cs,id)).replace(/^Single 40cm/,'single'):csAF(cs,id)=='single'?'single face':csAF(cs,id)=='vegas'?'Vegas 3-spot':'Vertical 3-spot');return F.face||''};
const csP=(cs,id)=>(cs.ppl||[]).find(p=>p.id==id);
const csNameOnly=(cs,id)=>{const p=csP(cs,id);return!!(p&&!p.tid)};
/* names: social views use the nickname for app users; name-only friends show the name the host typed (tester real names swapped) */
const csNm=(cs,id)=>{const p=csP(cs,id);if(!p)return testerName(id);return p.tid?testerName(p.tid):(window.nmScrub?nmScrub(p.n):p.n)};
/* in setup (host's own phone) adults show their real name, under-16s their nickname */
const csSetupNm=tid=>{const t=TESTERS.find(x=>x.id==tid);return!t?tid:t.junior?testerName(tid):t.name};
/* Lancaster 660 scores the inner X as 11. Vegas and every other casual round keep X as 10. */
function csXV(cs){const R=ROUNDS[(cs&&cs.round)||'']||{};return R.xv!=null?+R.xv:(R.lancaster?11:10)}
function csArrow(a,xv){return a=='X'?(xv==null?10:+xv):a=='M'||a==null||a===''?0:(+a||0)}
const csV=(a,cs)=>csArrow(a,cs&&cs.round?csXV(cs):10);
const csEnt=(cs,id)=>((cs.sc||{})[id])||null;
const csEnds=(cs,id)=>((csEnt(cs,id)||{}).e||[]).filter(e=>e&&e.length);
const csDoneP=(cs,id)=>{const R=csR(cs),E=csEnds(cs,id);return E.length>=R.ends&&E.every(e=>e.length==R.ape)};
const csTotal=(E,cs)=>{const xv=cs?csXV(cs):10;return (E||[]).flat().reduce((t,a)=>t+csArrow(a,xv),0)};
/* t10/x = the tie-break counts: 10s (incl. X) and Xs; on a field face 6s and 5s */
const csFldS=cs=>cs.disc=='field'||isFld(csFace(cs,0));
const csTB=cs=>cs3d(cs)?cs3d(cs).k.slice(0,2):csFldS(cs)?['6','5']:ROUNDS[cs.round]&&ROUNDS[cs.round].wa18?['10','9']:['10','X'];
const csRow=(cs,id)=>{const E=csEnds(cs,id),R=csR(cs),A=E.flat(),f=csFldS(cs),d=cs3d(cs)&&cs3d(cs).k,w=ROUNDS[cs.round]&&ROUNDS[cs.round].wa18;return{id,nm:csNm(cs,id),E,tot:csTotal(E,cs),n:E.filter(e=>e.length==R.ape).length,arrows:A.length,t10:A.filter(a=>d?a==d[0]:f?a=='6':w?a=='10':(a=='X'||a=='10')).length,x:A.filter(a=>d?a==d[1]:f?a=='5':w?a=='9':a=='X').length,done:csDoneP(cs,id)}};
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
function csCreate(o){const me=csMe();if(!me)return null;const P=[],FA={},cap=CS_MAX-(o.self?1:0);
 for(const p of o.ppl||[]){if(P.length>=cap)break;if(p.tid){if(!P.some(x=>x.id==p.tid)){P.push({id:p.tid,tid:p.tid,n:''});FA[p.tid]=p.f}}else{const c=csNameCheck(p.n);if(c.ok&&!P.some(x=>!x.tid&&x.n.toLowerCase()==c.n.toLowerCase())){const nid=csNid();P.push({id:nid,n:c.n});FA[nid]=p.f}}}
 /* self's position in the shooting order, as set in setup (default 0 = first, the old behaviour) */
 if(o.self){const pos=Math.max(0,Math.min(P.length,+o.selfPos||0));P.splice(pos,0,{id:me,tid:me});FA[me]=o.selfF}
 if(P.length<1||!ROUNDS[o.round])return null;const t=Date.now(),code='C'+h2hCode(),disc=csDisc(o.round);
 const cs={code,name:nmClean(o.name||'').slice(0,40)||'Casual shoot',disc,round:o.round,face3:disc=='indoor'&&!ROUNDS[o.round].vegas?(o.face3=='vegas'?'vegas':o.face3=='single'&&o.round==AUSI?'single':'vert'):null,date:o.date||today(),host:me,ppl:P,pt:t,sc:{},fin:0,fint:0,
  mp:{on:!!o.mp&&P.length>=2,ask:0,seeds:null,t},status:'active',created:t,dirty:1,invq:P.filter(p=>p.tid&&p.tid!=me).map(p=>p.tid)};
 if(csSplit(cs)){const fa={};for(const id in FA)if(FA[id]=='single'||FA[id]=='three')fa[id]=FA[id];if(Object.keys(fa).length)cs.fa=fa}csAll().push(cs);save();csTick(true);return cs}
function csAdd(code,p){const cs=csGet(code);if(!cs||!csHost(cs)||cs.ppl.length>=CS_MAX||csFin(cs))return'This shoot already has 10 people.';
 if(p.tid){if(cs.ppl.some(x=>x.tid==p.tid))return'Already in this shoot.';cs.ppl.push({id:p.tid,tid:p.tid,n:''});cs.invq=[...(cs.invq||[]),p.tid]}
 else{const c=csNameCheck(p.n);if(!c.ok)return c.msg;if(cs.ppl.some(x=>!x.tid&&x.n.toLowerCase()==c.n.toLowerCase()))return'That name is already in this shoot.';cs.ppl.push({id:csNid(),n:c.n})}
 cs.pt=Date.now();cs.dirty=1;save();csTick(true);return''}
function csRemove(code,id){const cs=csGet(code);if(!cs||!csHost(cs)||id==cs.host)return false;if(csEnds(cs,id).length)return false;cs.ppl=cs.ppl.filter(p=>p.id!=id);if(cs.sc)delete cs.sc[id];cs.pt=Date.now();cs.dirty=1;save();csTick(true);return true}
/* host: stop waiting for a linked person and score them as a name-only friend */
function csUnlink(code,id){const cs=csGet(code);const p=cs&&csP(cs,id);if(!p||!p.tid||!csHost(cs)||id==cs.host)return false;p.n=testerName(p.tid);p.tid=null;cs.pt=Date.now();cs.dirty=1;save();csTick(true);return true}
function csKey(code,id,k,xy){const cs=csGet(code);if(!cs||!csCanScore(cs,id)||csLocked(cs)||cs.fin)return false;const R=csR(cs);cs.sc=cs.sc||{};const e=cs.sc[id]=cs.sc[id]||{e:[]};
 if(window.arrowApply)arrowApply(e,'cs|'+cs.code+'|'+id);
 const fxs=csFxFor('cs|'+cs.code+'|'+id);if(fxs){/* fixing one arrow (as Just me) */window._csFx=null;if(!e.e[fxs.i]||!csKeys(cs,fxs.i,id).includes(k)||!csFxPut(e,R.ape,fxs,k,xy))return false;e.u=Date.now();e.by=csMe();cs.dirty=1;csAfter(cs);return true}
 let E=e.e[e.e.length-1];const nw=!E||E.length>=R.ape;if(nw&&e.e.filter(x=>x&&x.length).length>=R.ends)return false;if(!csKeys(cs,nw?e.e.length:e.e.length-1,id).includes(k))return false;if(nw){E=[];e.e.push(E)}E.push(k);
 if(xy||e.p){/* plotted arrows (single archer only): positions kept in e.p beside the ends, sorted only when the end is complete, as in Just me */
  const ix=e.e.indexOf(E);e.p=e.p||[];while(e.p.length<=ix)e.p.push([]);const P=e.p[ix];while(P.length<E.length-1)P.push(null);P.push(xy||null);
  if(E.length==R.ape){const xv=csXV(cs),pre=[...E],preP=[...P],o=E.map((_,j)=>j).sort((a,b)=>csArrow(E[b],xv)-csArrow(E[a],xv)||(E[b]=='X')-(E[a]=='X')||a-b),E2=o.map(j=>E[j]),P2=o.map(j=>P[j]||null);E.splice(0,E.length,...E2);P.splice(0,P.length,...P2);if(window.stOrd)stOrd.set('cs|'+cs.code+'|'+id,ix,pre,preP,E,P)}}
 else {const xv=csXV(cs);E.sort((a,b)=>csArrow(b,xv)-csArrow(a,xv)||(b=='X')-(a=='X'))}e.u=Date.now();e.by=csMe();cs.dirty=1;
 if(E.length==R.ape){const ids=cs.ppl.map(p=>p.id).filter(x=>csCanScore(cs,x)),s=ids.indexOf(id);window._csAct=null;const mine=csEnds(cs,id).filter(e=>e.length==R.ape).length;for(let j=1;j<=ids.length;j++){const n=ids[(s+j)%ids.length];if(csDoneP(cs,n))continue;const en=csEnt(cs,n)||{e:[]},last=(en.e||[])[en.e.length-1],part=!!(last&&last.length&&last.length<R.ape),nEnds=csEnds(cs,n).filter(e=>e.length==R.ape).length;if(part||nEnds<mine){window._csAct=n;break}}if(!window._csAct)window._csAct=csWavePick(cs,ids)}
 if(window.plotAfterFlag)plotAfterFlag(E.length==R.ape);
 csAfter(cs);return true}
function csFxDelete(code,id){const cs=csGet(code),fx=csFxFor('cs|'+code+'|'+id);window._csFx=null;if(!cs||!fx||!csCanScore(cs,id)||csLocked(cs)||cs.fin)return false;const e=csEnt(cs,id);if(!e||!csFxDel(e,fx))return false;e.u=Date.now();e.by=csMe();cs.dirty=1;csAfter(cs);return true}
/* one archer's face: only before their first arrow. The host sets it for themselves and name-only friends (cs.fa); a linked archer sets their own (cs.sc[id].f) */
function csSetFace(code,id,v){const cs=csGet(code);if(!cs||!csSplit(cs)||!csCanScore(cs,id)||csLocked(cs)||cs.fin||csEnds(cs,id).length||(v!='single'&&v!='three'))return false;window._csFx=null;
 if(csHost(cs)){cs.fa=cs.fa||{};cs.fa[id]=v;const en=csEnt(cs,id);if(en)delete en.f}else{cs.sc=cs.sc||{};const e=cs.sc[id]=cs.sc[id]||{e:[]};e.f=v;e.u=Date.now();e.by=csMe()}
 cs.dirty=1;csAfter(cs);return true}
function csUndo(code,id){window._csFx=null;const cs=csGet(code);if(!cs||!csCanScore(cs,id)||csLocked(cs)||cs.fin)return false;const e=csEnt(cs,id);if(!e||!e.e.length)return false;let E=e.e[e.e.length-1];if(E&&!E.length){e.e.pop();E=e.e[e.e.length-1]}if(!E)return false;const ux=e.e.length-1,r=window.stOrd&&stOrd.take('cs|'+cs.code+'|'+id,ux,E,e.p&&e.p[ux]);if(r){E.splice(0,E.length,...r.E);if(e.p&&e.p[ux])e.p[ux].splice(0,e.p[ux].length,...r.P)}else E.pop();if(!E.length)e.e.pop();
 if(e.p){if(e.p[ux])e.p[ux].length=Math.min(e.p[ux].length,E.length);e.p.length=Math.min(e.p.length,e.e.length)}
 e.u=Date.now();e.by=csMe();cs.dirty=1;csAfter(cs);return true}
/* my own finished score is also kept with my other sessions (tagged with the shoot) */
function csOwnSession(cs){const me=csMe();if(!csP(cs,me)||!csDoneP(cs,me))return;const id='cs-'+cs.code;let s=S.sessions.find(x=>x.id==id);const E=csEnds(cs,me).map(e=>e.slice()),en=csEnt(cs,me)||{},PO=en.p&&en.e?en.e.map((x,i)=>x&&x.length?(en.p[i]||[]).map(q=>q||null):null).filter(Boolean):null,POS=PO&&PO.some(l=>l.some(Boolean))?E.map((x,i)=>x.map((_,j)=>(PO[i]||[])[j]||null)):null;
 if(!s){s={id,date:cs.date||today(),round:cs.round,ends:E,pos:POS||E.map(()=>[]),note:'Casual shoot: '+cs.name,casual:cs.code};if(cs.face3)s.face3=cs.face3;if(csSplit(cs)&&csAF(cs,me)!=csBase(cs))s.face3=csAF(cs,me);if(ROUNDS[cs.round].vegas)s.face3='vegas';S.sessions.push(s)}else{s.ends=E;if(POS)s.pos=POS}
 if(en.lcT&&en.arrowD){s.lcT=1;s.arrowD=en.arrowD}}
function csAfter(cs){csOwnSession(cs);if(csFin(cs)&&cs.mp&&cs.mp.on&&!cs.mp.seeds&&csHost(cs))csMpStart(cs.code,true);save();csMatchSync(cs);if($('#csview')&&window._csv==cs.code)csView(cs.code);csTick(true)}
function csFinish(code){const cs=csGet(code);if(!cs||!csHost(cs)||cs.fin)return;cs.fin=1;cs.fint=Date.now();cs.dirty=1;csAfter(cs)}
/* ---------- match play (shootup.js ladder) ---------- */
const csMpCode=cs=>cs.code+'M';
const csRule=cs=>{const T=cs3d(cs);if(T){const K=csKeys(cs,0);return{ends:CS_MP_ENDS,ape:1,xv:+K[0],t12:false,so:'pick1',keys:K,d3:1,kc:Object.fromEntries(K.map(k=>[k,cs3dCol(cs,k)]))}}return{ends:CS_MP_ENDS,ape:3,xv:csXV(cs),t12:false,so:'pick1',keys:csKeys(cs,0,(cs.ppl||[]).map(p=>p.id).find(i=>csAF(cs,i)=='single')),fld:isFld(csFace(cs,0))}};
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
const csEnc=(E,R)=>R&&R.d3?E.map(e=>e.join('.')).join('/'):E.map(e=>e.map(a=>a=='10'?'T':a).join('')).join('/');
const CS_OK=['X','10','9','8','7','6','5','4','3','2','1','M'];
const CS_OK3=[...new Set(Object.values(CS3D).flatMap(T=>T.k))];
const csDec=(s,R)=>String(s||'').split('/').filter(x=>x!=='').slice(0,R.ends).map(e=>R.d3?e.split('.').slice(0,R.ape).filter(a=>CS_OK3.includes(a)):[...e].slice(0,R.ape).map(c=>c=='T'?'10':c).filter(a=>CS_OK.includes(a)));
function csSnapParts(cs){const me=csMe(),host=csHost(cs),head={k:'cs',code:cs.code,by:me,...h2hNm()};
 if(host)Object.assign(head,{name:cs.name,disc:cs.disc,round:cs.round,face3:cs.face3||'',date:cs.date,host:cs.host,ppl:cs.ppl.map(p=>p.tid?{id:p.id,tid:p.tid}:{id:p.id,n:csNm(cs,p.id)}),pt:cs.pt||0,fin:cs.fin||0,fint:cs.fint||0,mp:cs.mp||{}});if(host&&cs.fa&&Object.keys(cs.fa).length)head.fa=cs.fa;
 const items=[];for(const id in cs.sc||{}){const e=cs.sc[id];if(e&&e.e&&(e.e.length||e.f))items.push([id,{e:csEnc(e.e,csR(cs)),u:e.u||0,by:e.by||'',...(e.f?{f:e.f}:{})}])}
 const parts=[];let cur0={};const size=o=>JSON.stringify(o).length;
 for(const [id,v] of items){const c2={...cur0,[id]:v};if(Object.keys(cur0).length&&size({...head,sc:c2})>3300){parts.push(cur0);cur0={[id]:v}}else cur0=c2}
 parts.push(cur0);const t=Date.now();return parts.map((sc,k)=>({...head,sc,part:k+1,np:parts.length,t}))}
function csMerge(cs,d){if(!d||d.code!=cs.code||(d.t||0)<H2H_RESET)return false;cs3dReg(d.round);let ch=false;const fromHost=!cs.host||d.by==cs.host,me=csMe();
 if(d.nm&&nmLearn(d.by,d.nm,d.nt,d.t))ch=true;
 if(d.by!=me&&csP(cs,d.by)&&!(cs.seen||{})[d.by]){(cs.seen=cs.seen||{})[d.by]=1;ch=true}
 if(d.k=='csno'){if(csHost(cs)){const p=csP(cs,d.by);if(p&&p.tid==d.by){p.n=testerName(p.tid);p.tid=null;cs.pt=Date.now();cs.dirty=1;ch=true}}return ch}
 if(d.k!='cs')return false;
 if(fromHost&&typeof d.round=='string'&&ROUNDS[d.round]){if(!cs.host&&typeof d.host=='string'){cs.host=d.host;ch=true}
  if(Array.isArray(d.ppl)&&(d.pt||0)>(cs.pt||0)){cs.ppl=d.ppl.slice(0,CS_MAX).filter(p=>p&&typeof p.id=='string'&&p.id.length<=16).map(p=>typeof p.tid=='string'&&nmIdx(p.tid)>=0?{id:p.tid,tid:p.tid,n:''}:{id:p.id,n:nmClean(String(p.n||'')).slice(0,16)||'Archer'});cs.pt=d.pt;ch=true}
  for(const k of['name','round','disc','date'])if(typeof d[k]=='string'&&d[k]&&cs[k]!=d[k]){cs[k]=k=='name'?nmClean(d[k]).slice(0,40):d[k];ch=true}
  if(d.fa&&typeof d.fa=='object'&&!csHost(cs)){/* the host's own phone is the source of truth: its older relay messages must not undo a face it just changed */const fa={};for(const k in d.fa)if(k.length<=16&&(d.fa[k]=='single'||d.fa[k]=='three'))fa[k]=d.fa[k];if(JSON.stringify(fa)!=JSON.stringify(cs.fa||{})){if(Object.keys(fa).length)cs.fa=fa;else delete cs.fa;ch=true}}
  const f3=d.face3=='vegas'?'vegas':d.face3=='vert'?'vert':d.face3=='single'?'single':null;if(cs.face3!=f3){cs.face3=f3;ch=true}
  if((d.fint||0)>(cs.fint||0)){cs.fin=d.fin?1:0;cs.fint=d.fint;ch=true}
  if(d.mp&&typeof d.mp=='object'&&(d.mp.t||0)>((cs.mp||{}).t||0)){cs.mp={on:!!d.mp.on,ask:d.mp.ask?1:0,seeds:Array.isArray(d.mp.seeds)?d.mp.seeds.filter(x=>typeof x=='string').slice(0,CS_MAX):null,t:d.mp.t};ch=true}}
 const R=csR(cs);cs.sc=cs.sc||{};for(const id in d.sc||{}){const p=csP(cs,id);if(!p)continue;/* only the host (for themselves and name-only friends) or the linked archer themselves */
  const v=d.sc[id];if(!v||typeof v!='object')continue;/* who scored it: the host (themselves or a name-only friend) or the linked archer themselves; any phone may pass it on */
  const by=typeof v.by=='string'?v.by:'',ok=(by==cs.host&&(id==cs.host||!p.tid))||(p.tid&&id==by);if(!ok)continue;const mine=csEnt(cs,id);if(mine&&(mine.u||0)>=(+v.u||0))continue;
  if(id==me&&by!=me)continue;cs.sc[id]={e:csDec(v.e,R),u:+v.u||0,by,...(v.f=='single'||v.f=='three'?{f:v.f}:{})};ch=true}
 if(ch){csOwnSession(cs);csMatchSync(cs)}return ch}
let csBusy=false;const csOpened={},CS_REOPEN=30*6e4;
/* the time of the last re-send on open is kept in its own key (scoretool.opost.<archer>.<code>), not in the saved record */
const CS_RSOK=k=>'scoretool.opost.'+((typeof TESTER!='undefined'&&TESTER&&TESTER.id)||'nathe')+'.'+k;function csOpGet(k){try{return +localStorage.getItem(CS_RSOK(k))||0}catch(e){return 0}}function csOpSet(k){try{localStorage.setItem(CS_RSOK(k),String(Date.now()))}catch(e){}}

async function csTick(force){if(window.ADMIN_VIEW){window.avSkip&&avSkip('casual');return}if(csBusy||!TESTER)return;csBusy=true;let ch=false;const me=csMe();try{for(const cs of csAll()){if(cs.status=='invite')continue;
  if(csHost(cs)&&cs.invq&&cs.invq.length){const left=[];for(const to of cs.invq){if(!csP(cs,to))continue;if(!await h2hPost(h2hInbox(to),{k:'csinv',code:cs.code,name:cs.name,round:cs.round,from:me,to,...h2hNm(),t:Date.now()}))left.push(to)}cs.invq=left;save()}
  if(cs.nosend){if(await h2hPost(csTopic(cs.code),{k:'csno',code:cs.code,by:me,t:Date.now()}))cs.nosend=0;save();continue}
  const L=await h2hPoll(csTopic(cs.code),cs.since);if(L&&L.length){for(const d of L){cs.since=d._id;if(csMerge(cs,d))ch=true}save()}
  /* 1 Nov 2026 (queue): same as leagues, the snapshot is re-sent on open at most once every 30 minutes per group */
  const dty=cs.dirty,reo=!dty&&!csOpened[cs.code]&&Date.now()-csOpGet(cs.code)>=CS_REOPEN;if(!csOpened[cs.code]&&!reo&&!dty)csOpened[cs.code]=1;
  if(cs.dirty||reo||Date.now()-(cs.posted||0)>CS_SNAP){let ok=true;for(const o of csSnapParts(cs))if(!await h2hPost(csTopic(cs.code),o)){ok=false;break}
   /* a re-send on open only stamps its own key and leaves the saved record untouched */
   if(ok&&reo&&!dty&&!cs.qfail){csOpSet(cs.code);csOpened[cs.code]=1}else{if(ok){if(reo&&!dty)csOpSet(cs.code);cs.posted=Date.now();cs.dirty=0;cs.qfail=0;csOpened[cs.code]=1}else cs.qfail=1;save()}}}}
 finally{csBusy=false}
 if($('#csview')&&window._csv){const q=$('#csq');if(ch)csView(window._csv);else if(q){const cs=csGet(window._csv);if(cs)q.textContent=csQTxt(cs)}}else if(ch&&$('#cscard')&&!cur&&view=='score'&&!window._csMode)score()}
setInterval(()=>{if(!document.hidden)csTick()},20000);setTimeout(()=>csTick(true),3000);addEventListener('online',()=>csTick(true));
window.csInvite=function(d){const me=csMe();cs3dReg(d.round);if(d.to!=me||d.from==me||!d.code||csGet(d.code)||(d.t||0)<H2H_RESET||!ROUNDS[d.round])return false;if(d.nm)nmLearn(d.from,d.nm,d.nt,d.t);
 csAll().push({code:d.code,name:nmClean(String(d.name||'Casual shoot')).slice(0,40),round:d.round,disc:csDisc(d.round),host:d.from,ppl:[{id:d.from,tid:d.from},{id:me,tid:me}],pt:0,sc:{},mp:{},status:'invite',created:d.t||Date.now()});save();return true};
const csQTxt=cs=>cs.qfail?'Offline: saved on this phone, it will send when you are back online.':cs.dirty?'Sending...':'Saved and sent.';
window.csCreate=csCreate;window.csSetFace=csSetFace;window.csAF=csAF;window.csMixed=csMixed;window.csAdd=csAdd;window.csRemove=csRemove;window.csUnlink=csUnlink;window.csKey=csKey;window.csUndo=csUndo;window.csFinish=csFinish;window.csSeeds=csSeeds;window.csMatch=csMatch;window.csNameCheck=csNameCheck;
window.csMpStart=csMpStart;window.csMpOff=csMpOff;window.csMpSetup=csMpSetup;window.csTick=csTick;window.csMerge=csMerge;window.csSnapParts=csSnapParts;window.csKeys=csKeys;window.cs3dName=cs3dName;window.cs3dReg=cs3dReg;window.csRounds=csRounds;window.csDisc=csDisc;window.csFaceTxt=csFaceTxt;
/* Just me uses this same discipline row and the same round classification. The dropdown lists only the selected discipline.
   Choosing another discipline refills the list. jmSelectRound switches discipline when a test or a stored round names one that is not on screen. The last discipline is remembered. */
function jmDisc(){if(S.lastDisc&&CS_DISC[S.lastDisc])return S.lastDisc;const d=S.lastRound&&csDisc(S.lastRound);return d&&CS_DISC[d]?d:'target'}
function jmRoundNames(disc){return Object.keys(ROUNDS).filter(r=>{const R=ROUNDS[r];return !!(R&&!R.legacy&&!R.retired&&!R.ifaa&&csDisc(r)===disc)})}
function jmRoundInner(disc){const names=jmRoundNames(disc),sel=names.includes(S.lastRound)?S.lastRound:(names[0]||'');
 const empty=names.length?'':`<option value="" selected>No rounds in this list yet</option>`;
 return names.map(r=>`<option value="${esc(r)}" ${r===sel?'selected':''}>${esc(typeof rdPick==='function'?rdPick(r):r)}</option>`).join('')+empty+'<option value="__new">+ Create my own practice round</option>'}
function jmPickerHTML(){const disc=jmDisc();
 return `<div id="jmpick"><label>Discipline</label><div id="jmdisc">${csSeg('jdisc',Object.entries(CS_DISC),disc)}</div><label for="rd">Round</label><select id="rd">${jmRoundInner(disc)}</select></div>`}
function jmBindDisc(){const box=$('#jmdisc');if(!box)return;box.querySelectorAll('[data-jdisc]').forEach(b=>b.onclick=()=>{const d=b.dataset.jdisc;if(!CS_DISC[d])return;S.lastDisc=d;const names=jmRoundNames(d);if(!names.includes(S.lastRound))S.lastRound=names[0]||'';save();const rd=$('#rd');if(!rd)return;rd.innerHTML=jmRoundInner(d);box.querySelectorAll('[data-jdisc]').forEach(x=>{const on=x.dataset.jdisc===d;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false');x.innerHTML=(on?'&#10003; ':'')+CS_DISC[x.dataset.jdisc]});rd.dispatchEvent(new Event('change',{bubbles:true}))})}
function jmSelectRound(name){
  const rd=$('#rd');if(!rd||!name)return false;
  if(name==='__new'){rd.value='__new';rd.dispatchEvent(new Event('change',{bubbles:true}));return true}
  const d=csDisc(name);
  if(d&&CS_DISC[d]&&(![...rd.options].some(o=>o.value===name)|| (S.lastDisc&&S.lastDisc!==d))){
    S.lastDisc=d;S.lastRound=name;save();
    rd.innerHTML=jmRoundInner(d);
    const box=$('#jmdisc');
    if(box)box.querySelectorAll('[data-jdisc]').forEach(x=>{const on=x.dataset.jdisc===d;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false');x.innerHTML=(on?'&#10003; ':'')+CS_DISC[x.dataset.jdisc]});
  }
  if(![...rd.options].some(o=>o.value===name))return false;
  rd.value=name;rd.dispatchEvent(new Event('change',{bubbles:true}));return true;
}
window.jmPickerHTML=jmPickerHTML;window.jmBindDisc=jmBindDisc;window.jmDisc=jmDisc;window.jmSelectRound=jmSelectRound;
/* ---------- screens ---------- */
const csSeg=(name,opts,val,dis)=>`<span class="lg-segs cs-segs" role="group">${opts.map(([v,l])=>`<button type="button" class="lg-seg${v==val?' on':''}" data-${name}="${v}" aria-pressed="${v==val}" ${dis?'disabled':''}>${v==val?'&#10003; ':''}${l}</button>`).join('')}</span>`;
/* setup draft survives re-renders (relay ticks redraw the Score tab) */
const csDraft=()=>window._csD=window._csD||{d3t:'aba3',d3n:20,disc:'target',round:null,face3:'vert',self:true,selfPos:0,ppl:[],mp:false,name:'',typed:'',msg:''};
/* Shooting order for setup (22 Nov 2026): self (when shooting) and the typed people, as one combined, movable
   list. D.ppl keeps only the typed people, in order; D.selfPos is self's index within the combined list.
   csCreate() below does the same splice when the shoot is actually created, so this is display/editing only. */
function csOrderRows(D){const rows=D.ppl.map((p,i)=>({kind:'p',i,label:p.tid?csSetupNm(p.tid):p.n,sub:p.tid?'has the app, linked':'name only, you score for them'}));
 if(D.self){const pos=Math.max(0,Math.min(rows.length,D.selfPos||0));rows.splice(pos,0,{kind:'self',label:'You',sub:'shooting too'})}return rows}
function csOrderMove(D,idx,dir){const rows=csOrderRows(D),j=idx+dir;if(idx<0||idx>=rows.length||j<0||j>=rows.length)return;
 const t=rows[idx];rows[idx]=rows[j];rows[j]=t;const ppl=[];let selfPos=0;
 rows.forEach((r,k)=>{if(r.kind=='self')selfPos=k;else ppl.push(D.ppl[r.i])});D.ppl=ppl;D.selfPos=selfPos}
function csSetupHtml(){const D=csDraft(),is3=D.disc=='3d',R0=is3?[]:csRounds(D.disc);if(is3){D.round=cs3dName(D.d3t,D.d3n);cs3dReg(D.round)}else if(!R0.length)D.round='';else if(!R0.includes(D.round))D.round=R0.includes(S.lastRound)?S.lastRound:R0[0];
 const n=(D.self?1:0)+D.ppl.length,tmp={round:D.round,face3:D.face3,disc:D.disc},ind=D.disc=='indoor'&&!(ROUNDS[D.round]||{}).vegas,sp=csSplitR(D.round,D.disc),dfv=D.round==AUSI&&D.face3=='single'?'single':'three',fseg=(w,v)=>`<div class="row cs-face" style="gap:8px;justify-content:flex-start;align-items:center;flex-wrap:wrap;margin:4px 0 6px"><span class="small"><b>Face</b></span>${csFSeg('data-csfs="'+w+'"',v||dfv)}</div>`,taken=D.ppl.filter(p=>p.tid).map(p=>p.tid),sug=n<CS_MAX?csMatch(D.typed,taken):[];
 return`<div id="cssetup"><h2 style="margin:6px 0 2px">Casual shoot</h2><p class="small muted" style="margin:0 0 8px">A one-off shoot with friends. Not part of any league. 1 to ${CS_MAX} people.</p>
 <label for="csname">Name (optional)</label><input id="csname" maxlength="40" placeholder="Casual shoot" value="${esc(D.name)}">
 <label>Discipline</label>${csSeg('csdisc',Object.entries(CS_DISC),D.disc)}
 ${is3?`<label for="cs3t">Round</label><select id="cs3t">${Object.entries(CS3D).map(([k,T])=>`<option value="${k}" ${k==D.d3t?'selected':''}>${esc(T.l+' ('+(T.half?'3 + 1 arrows':plN(cs3dPer(k),'arrow','arrows'))+' a target)')}</option>`).join('')}</select>
 <label for="cs3n">${CS3D[D.d3t].half?'Targets each half':'Number of targets'}</label><input id="cs3n" type="number" inputmode="numeric" min="1" max="${CS3D_MAX}" value="${esc(D.d3n)}" style="max-width:120px">`
 :R0.length?`<label for="csrd">Round</label><select id="csrd">${R0.map(r=>`<option value="${esc(r)}" ${r==D.round?'selected':''}>${esc(window.rdPick?rdPick(r):r)}</option>`).join('')}</select>`:`<p class="small" id="csempty">No rounds in ${esc(CS_DISC[D.disc]||'this list')} yet. A practice round you create under Just me, in this discipline, shows here.</p>`}
 ${ind?`<label>${sp&&D.round!=AUSI?'3-spot layout':'Face'}</label>${D.round==AUSI?csSeg('csf3',F3AUS,D.face3):csSeg('csf3',[['vert','Vertical 3-spot'],['vegas','Vegas 3-spot']],D.face3=='single'?'vert':D.face3)}`:''}
 <p class="small" id="csfacetxt" style="margin:6px 0">${D.round?esc(csFaceTxt(tmp))+' · keys '+csKeys(tmp,0).join(' '):''}</p>
 <label for="csdt">Date</label><input id="csdt" type="date" value="${esc(D.date||today())}">
 <fieldset class="h2hops"><legend>Who's shooting (${n} of ${CS_MAX})</legend>
 <label class="h2htk"><input type="checkbox" id="csself" ${D.self?'checked':''}> I'm shooting too</label>
 ${n>1?`<p class="small muted" style="margin:4px 0 2px">Shooting order (use the arrows to match where everyone's standing):</p>`:''}
 ${csOrderRows(D).map((r,k,arr)=>`<div class="list-item row cs-person"><span><b>${esc(r.label)}</b> <span class="small">${esc(r.sub)}</span>${sp&&r.kind=='self'?fseg('self',D.selfF):sp&&r.kind=='p'?fseg(r.i,D.ppl[r.i].f):''}</span><span class="row" style="gap:4px;flex-wrap:nowrap">${arr.length>1?`<button type="button" class="btn ghost" data-csmv="${k}" data-csmvd="-1" aria-label="Move up" ${k==0?'disabled':''}>&#9650;</button><button type="button" class="btn ghost" data-csmv="${k}" data-csmvd="1" aria-label="Move down" ${k==arr.length-1?'disabled':''}>&#9660;</button>`:''}${r.kind=='p'?`<button type="button" class="btn ghost" data-csdel="${r.i}" aria-label="Remove">Remove</button>`:''}</span></div>`).join('')}
 ${n<CS_MAX?`<div class="row" style="gap:6px;margin-top:6px"><input id="cstype" maxlength="40" autocomplete="off" placeholder="Type a name" value="${esc(D.typed)}" style="flex:1"><button type="button" class="btn ghost" id="csaddn">Add</button></div>
 <div id="cssug">${sug.map(t=>`<button type="button" class="lc-chip cs-sug" data-cslink="${t.id}">Link ${esc(csSetupNm(t.id))} <span class="small">· has the app</span></button>`).join('')}${sug.length?`<p class="small muted" style="margin:4px 0">Is that them? Tap to link, so they can see the shoot and score themselves. Or tap Add to keep it as a name only.</p>`:''}</div>`:`<p class="small">That's the maximum of ${CS_MAX} people.</p>`}
 <p class="small" id="csmsg" role="alert" style="font-weight:600;margin:4px 0">${esc(D.msg||'')}</p></fieldset>
 <label>Match play after the shoot</label>${n>=2?csSeg('csmp',[['off','Off'],['on','On']],D.mp?'on':'off'):`<p class="small muted" id="csmpna" style="margin:2px 0">Needs 2 or more people.</p>`}
 <p class="small muted" style="margin:4px 0">You can switch match play on or off later too.</p>
 <button type="button" class="btn ghost full" id="csh2h" style="margin-top:8px">Head-to-head or match night</button>
 <p class="small muted" style="margin:4px 0 0">Two phones, or a match night, lives here with Casual. Same rounds and the same saved scores.</p>
 <button class="btn alt full" id="csgo" style="margin-top:10px" ${n<1||(!is3&&!D.round)?'disabled':''}>Start casual shoot</button></div>`}
function csBindSetup(root){const D=csDraft(),q=s=>root.querySelector(s),re=()=>score();
 const keep=()=>{const a=q('#csname'),b=q('#csdt'),c=q('#cstype'),n3=q('#cs3n');if(n3)D.d3n=Math.max(1,Math.min(CS3D_MAX,Math.round(+n3.value)||20));if(a)D.name=a.value;if(b)D.date=b.value;if(c)D.typed=c.value};
 root.querySelectorAll('[data-csdisc]').forEach(b=>b.onclick=()=>{keep();D.disc=b.dataset.csdisc;D.round=null;re()});
 root.querySelectorAll('[data-csf3]').forEach(b=>b.onclick=()=>{keep();D.face3=b.dataset.csf3;re()});
 root.querySelectorAll('[data-csfs]').forEach(b=>b.onclick=()=>{keep();const w=b.dataset.csfs;if(w=='self')D.selfF=b.dataset.csfv;else if(D.ppl[+w])D.ppl[+w].f=b.dataset.csfv;re()});
 root.querySelectorAll('[data-csmp]').forEach(b=>b.onclick=()=>{keep();D.mp=b.dataset.csmp=='on';re()});
 const rd=q('#csrd');if(rd)rd.onchange=()=>{keep();D.round=rd.value;re()};
 const t3=q('#cs3t');if(t3)t3.onchange=()=>{keep();D.d3t=t3.value;re()};const n3=q('#cs3n');if(n3)n3.onchange=()=>{keep();re()};
 const sf=q('#csself');if(sf)sf.onchange=()=>{keep();if(sf.checked&&D.ppl.length>=CS_MAX){D.msg='That\'s already 10 people.';re();return}D.self=sf.checked;re()};
 root.querySelectorAll('[data-csdel]').forEach(b=>b.onclick=()=>{keep();D.ppl.splice(+b.dataset.csdel,1);D.msg='';re()});
 root.querySelectorAll('[data-csmv]').forEach(b=>b.onclick=()=>{keep();csOrderMove(D,+b.dataset.csmv,+b.dataset.csmvd);re()});
 const ty=q('#cstype');if(ty){ty.oninput=()=>{D.typed=ty.value;const taken=D.ppl.filter(p=>p.tid).map(p=>p.tid),sg=csMatch(ty.value,taken),w=q('#cssug');if(w){w.innerHTML=sg.map(t=>`<button type="button" class="lc-chip cs-sug" data-cslink="${t.id}">Link ${esc(csSetupNm(t.id))} <span class="small">· has the app</span></button>`).join('')+(sg.length?`<p class="small muted" style="margin:4px 0">Is that them? Tap to link, so they can see the shoot and score themselves. Or tap Add to keep it as a name only.</p>`:'');bindLink()}};
  ty.onkeydown=e=>{if(e.key=='Enter'){e.preventDefault();q('#csaddn').click()}}}
 const full=()=>(D.self?1:0)+D.ppl.length>=CS_MAX;
 const bindLink=()=>root.querySelectorAll('[data-cslink]').forEach(b=>b.onclick=()=>{keep();if(full()){D.msg='That\'s the maximum of 10 people.';return re()}D.ppl.push({tid:b.dataset.cslink});D.typed='';D.msg='';re()});bindLink();
 const ad=q('#csaddn');if(ad)ad.onclick=()=>{keep();if(full()){D.msg='That\'s the maximum of 10 people.';return re()}const c=csNameCheck(D.typed);if(!c.ok){D.msg=c.msg;return re()}
  if(D.ppl.some(p=>!p.tid&&p.n.toLowerCase()==c.n.toLowerCase())){D.msg='That name is already in.';return re()}D.ppl.push({n:c.n});D.typed='';D.msg='';re();const t=$('#cstype');if(t)t.focus()};
 const h2h=q('#csh2h');if(h2h)h2h.onclick=()=>{keep();nav('lab_match')};
 const go=q('#csgo');if(go)go.onclick=()=>{keep();const n=(D.self?1:0)+D.ppl.length;if(n<1){D.msg='Add at least 1 person.';return re()}if(n>CS_MAX){D.msg='10 people at most.';return re()}
  const cs=csCreate({name:D.name,round:D.round,face3:D.face3,date:D.date,self:D.self,selfF:D.selfF,selfPos:D.selfPos,ppl:D.ppl,mp:D.mp&&n>=2});if(!cs){D.msg='Could not start. Check the names.';return re()}window._csD=null;window._csMode=null;S.lastRound=cs.round;save();csView(cs.code)}}
function csListCard(){if(!TESTER)return'';const L=csAll().filter(x=>x.status!='declined'&&(x.status=='invite'||!csFin(x))).slice().reverse();if(!L.length)return'';
 return`<div class="card" id="cscard"><span class="kicker">Casual shoots</span>${L.map(cs=>cs.status=='invite'?`<div class="list-item"><b>${esc(testerName(cs.host))} added you to a casual shoot: ${esc(cs.name)}</b><div class="small muted">${esc(cs.round)}</div><div class="row" style="gap:6px;justify-content:flex-start;margin-top:6px"><button class="btn alt" data-csacc="${cs.code}">Join</button><button class="btn ghost" data-csno="${cs.code}">Not me</button></div></div>`
  :`<div class="list-item row"><span><b>${esc(cs.name)}</b><div class="small muted">${esc(cs.round)} · ${plN(cs.ppl.length,'person','people')} · ${csFin(cs)?'finished':'shooting'}${cs.mp&&cs.mp.on?' · match play':''}</div></span><button class="btn ghost" data-csopen="${cs.code}">Open</button></div>`).join('')}</div>`}
function csBindList(){const c=$('#cscard');if(!c)return;c.querySelectorAll('[data-csopen]').forEach(b=>b.onclick=()=>csView(b.dataset.csopen));
 c.querySelectorAll('[data-csacc]').forEach(b=>b.onclick=()=>{const cs=csGet(b.dataset.csacc);cs.status='active';cs.dirty=1;save();csTick(true).then(()=>{if(window._csv==cs.code)csView(cs.code)});csView(cs.code)});
 c.querySelectorAll('[data-csno]').forEach(b=>b.onclick=()=>{const cs=csGet(b.dataset.csno);if(!cs)return;cs.status='declined';cs.nosend=1;save();(async()=>{await h2hPost(csTopic(cs.code),{k:'csno',code:cs.code,by:csMe(),t:Date.now()});S.casual=csAll().filter(x=>x.code!=cs.code);save()})();S.casual=csAll().filter(x=>x.code!=cs.code||x.nosend);save();score()})}
/* the Score tab: choose the kind of shoot first */
/* League scoring lives in Clubs > Leagues, not on this tab. */
const CS_TYPES=[['solo','Just me'],['casual','Casual shoot']];
const _csScore=score;score=function(){const o=_csScore.apply(this,arguments);try{csDecorate()}catch(e){console.error(e)}return o};
/* Casual shoots you can still score (not finished, not declined/invite-only). Used to resume straight
   into the one obviously-right shoot, rather than the type picker, when you tap Score. */
const csActiveMine=()=>csAll().filter(cs=>cs&&cs.status!='declined'&&cs.status!='invite'&&!csFin(cs)&&(cs.ppl||[]).some(p=>csCanScore(cs,p.id)));
function csDecorate(){if(cur||!TESTER||!$('#rd')||$('#csview'))return;const first=$('#rd').closest('.card');if(!first)return;
 /* leftover League shoot (in-memory _csMode; it was never written to localStorage) falls back to Just me */
 if(window._csMode=='league')window._csMode=null;
 const mode=window._csMode||'solo';
 /* Score button resume (22 Nov 2026): the first time you land on Score this visit (not after you've
    already picked a type here), and there is exactly one casual shoot still being scored, offer to
    jump straight back into it instead of the Just me / Casual picker. One tap either way --
    Resume, or just use the picker below as normal. Doesn't fire again until you leave Score and come back. */
 const seen=window._csSeen;window._csSeen=1;const act=!seen&&mode=='solo'?csActiveMine():[];
 if(act.length==1){const cs=act[0],a=cs.ppl.find(p=>csCanScore(cs,p.id)),r=csRow(cs,a.id);
  first.insertAdjacentHTML('beforebegin',`<div class="card" id="csresume"><span class="kicker">Still scoring</span><p style="margin:4px 0 8px"><b>${esc(cs.name)}</b> &middot; ${esc(cs.round)} &middot; ${r.n}/${csR(cs).ends} ${csR(cs).d3?'targets':'ends'} so far</p><button type="button" class="btn alt full" data-csresume="${esc(cs.code)}">Resume scoring</button></div>`)}
 first.insertAdjacentHTML('afterbegin',`<div id="cstype0"><label>What are you shooting?</label>${csSeg('cstp',CS_TYPES,mode)}</div>`);
 if(mode!='solo'){const mr=$('#myrcard');if(mr)mr.remove()}
 if(mode=='casual'){[...first.children].forEach(x=>{if(x.id!='cstype0')x.remove()});first.insertAdjacentHTML('beforeend',csSetupHtml());csBindSetup(first)}
 first.insertAdjacentHTML('afterend',csListCard());csBindList();
 first.querySelectorAll('[data-cstp]').forEach(b=>b.onclick=()=>{window._csMode=b.dataset.cstp=='solo'?null:b.dataset.cstp;score()});
 const rb=$('#csresume [data-csresume]');if(rb)rb.onclick=()=>csView(rb.dataset.csresume)}
/* The Just me ABA sheet for a casual shoot: the same grid (abaGrid) the Just me scorer draws, one row a target with its score and the running total
   for its 10-target block, block totals, half totals and the round total, built from the casual card on screen. Display only; nothing is stored. */
function csAbaSession(cs,id){const R=ROUNDS[cs.round],T=CS3D[R.d3],n=cs3dPer(R.d3),E=csEnds(cs,id).map(e=>e.slice(0,1)),PT=[[20,18,16],[14,12,10],[8,6,4]];
 const aba=E.map(e=>{const v=csV(e[0]);let k=0,z='';PT.forEach((r,i)=>r.forEach((p,j)=>{if(p==v&&!k){k=i+1;z='ABC'[j]}}));return k?{m:k-1,k,z}:{m:0}});
 const hv=T.half?[{n:3,t:R.d3n,l:'3A',name:'3-arrow half'},{n:1,t:R.d3n,l:'1A',name:'1-arrow half'}]:[{n,t:R.ends,l:n+'A',name:n+'-arrow round'}];
 return{round:cs.round,ends:E,aba,hv,date:cs.date}}
function csAbaCounts(cs,id){const V=csEnds(cs,id).map(e=>csV(e[0])),c=x=>V.filter(v=>v==x).length;return`<div class="small" id="csabacounts" style="margin:6px 0 0">20s <b>${c(20)}</b> \u00b7 18s <b>${c(18)}</b> \u00b7 16s <b>${c(16)}</b> \u00b7 no score <b>${c(0)}</b> \u00b7 targets scored <b>${V.length}</b> of ${ROUNDS[cs.round].ends}</div>`}
function csAbaLive(cs){const ids=cs.ppl.map(p=>p.id).filter(id=>csCanScore(cs,id)),a=window._csAct&&ids.includes(window._csAct)?window._csAct:ids.find(id=>!csDoneP(cs,id))||ids[0];if(!a)return'';return`<div class="card" id="csabalive"><span class="kicker">Your sheet so far${ids.length>1?' · '+esc(csNm(cs,a)):''}</span>${csAbaSheetHtml(cs,a,true)}</div>`}
function csAbaSheetHtml(cs,id,live){if(!window.abaGrid)return'';const s=csAbaSession(cs,id);return window.abaGrid(s,false,live?s.ends.length:-1)+csAbaCounts(cs,id)}

/* ---------- target face with plotting: only when ONE archer is scored on this phone (casual and league), same as Just me ----------
   Uses the Just me face drawing and plot scoring (faceSVG, tapScore). Several archers on one card, 3D and ABA stay button-only. */
const csSpotSC=FR=>isBug(FR)?BUGC:spots3(FR);
const csFaceVB=FR=>{const SC=csSpotSC(FR),SP=SC&&window._csSpot?SC[window._csSpot-1]:null;return SP?`${SP[0]-0.31} ${SP[1]-0.31} 0.62 0.62`:faceVB(FR)};
function csFaceHtml(FR,pts,locked,opt){if(opt&&opt.zk&&window._csSE!==opt.zk){window._csSE=opt.zk;if(spots3(FR)&&!isBug(FR)&&window._csSpot>0)window._csSpot=1}/* a new end (or another archer's turn) opens on Spot 1 */const SC=csSpotSC(FR),vb=csFaceVB(FR),SP=SC&&window._csSpot,o=opt||{};
 /* face height: the same sizes Just me uses (plotBaseH). When zoomed, plotZoomRoom grows the box. */
 const H=plotBaseH(SP,FR);
 return(o.noHide?'':`<div class="row" style="gap:6px;justify-content:flex-start;margin:6px 0 2px"><button class="ad-small" id="cshide" aria-pressed="${!!S.hideFace}">${S.hideFace?'Show target':'Hide target'}</button></div>`)+(S.hideFace?'':`${SC?`<div class="zbar" role="group" aria-label="Spot">${[0,1,2,3].map(n=>`<button class="zb${(window._csSpot||0)==n?' on':''}" data-csspot="${n}">${n?'Spot '+n:'All spots'}</button>`).join('')}</div>`:''}${o.noHide?'':'<p class="small muted" style="margin:2px 0">Tap the face or a score. Hold to aim with the magnifier.</p>'}<div id="csfwrap" style="position:relative;width:100%;height:${H};margin:0 auto;overflow:visible;touch-action:none;border-radius:8px">${faceSVG(pts,'cspface',vb,FR,'',o.d>0?{d:+o.d,cm:o.cm||0}:null).replace('width="100%"','width="100%" height="100%"')}<button type="button" class="zcyc" id="cszcycle"></button><div id="csloupe" hidden style="position:absolute;z-index:3;width:110px;height:110px;border-radius:50%;overflow:hidden;border:3px solid #111;box-shadow:0 2px 8px #0006;pointer-events:none;background:#fff"></div></div>`)}
/* ---------- Just me look-alike scoring card (league and casual, one archer on this phone) ----------
   The same layout and behaviour as the Just me scorer: End / Prog boxes, the arrows of the end as chips (tap one to fix it),
   the face for the end, the score keys, Undo, and the table of every end. League and casual both draw it from here. */
function csSorted(E,P){const o=E.map((_,j)=>j).sort((a,b)=>csV(E[b])-csV(E[a])||(E[b]=='X')-(E[a]=='X')||a-b);return[o.map(j=>E[j]),o.map(j=>(P||[])[j]||null)]}
const csFxFor=ns=>window._csFx&&window._csFx.ns==ns?window._csFx:null;
/* replace one arrow in place (and its plot); a complete end is sorted again */
function csFxPut(en,ape,fx,k,xy){const E=en.e&&en.e[fx.i];if(!E||fx.j>=E.length)return false;E[fx.j]=k;
 if(en.p||xy){en.p=en.p||[];while(en.p.length<=fx.i)en.p.push([]);const P=en.p[fx.i];while(P.length<E.length)P.push(null);P[fx.j]=xy||null}
 if(E.length==ape){const[E2,P2]=csSorted(E,en.p&&en.p[fx.i]);E.splice(0,E.length,...E2);if(en.p)en.p[fx.i]=P2}return true}
/* delete one arrow of the end being shot (the last end only) */
function csFxDel(en,fx){const E=en.e&&en.e[fx.i];if(!E||fx.i!=en.e.length-1)return false;E.splice(fx.j,1);if(en.p&&en.p[fx.i])en.p[fx.i].splice(fx.j,1);if(!E.length){en.e.pop();if(en.p)en.p.length=Math.min(en.p.length,en.e.length)}return true}
function csAdTable(o){const E=(o.en.e||[]),fx=o.fx;let run=0;
 const rows=E.map((x,i)=>{x=x||[];if(!x.length)return'';run+=endSum(x);return`<tr><td>${i+1}</td><td>${x.map((a,j)=>`<span class="adb ${o.kcol(a)}" role="button" tabindex="0" data-csfix="${i},${j}" aria-label="fix arrow ${esc(a)}"${fx&&fx.i==i&&fx.j==j?' style="outline:3px solid #3b82f6;outline-offset:2px"':''}>${esc(a)}</span>`).join('')}</td><td>${endSum(x)}</td><td>${run}</td></tr>`}).join('');
 return rows?`<div class="ad-sheet" id="csadtab"><table class="ad-tab"><thead><tr><th>#</th><th>Scores</th><th>End</th><th>Prog</th></tr></thead><tbody>${rows}</tbody></table></div>`:''}
function csAdCard(o){const{en,ape,ends,FR,R}=o,E=en.e||[],fx=o.fx,last=E[E.length-1],cur=last&&last.length<ape;
 const ei=fx?fx.i:cur?E.length-1:Math.min(E.length,ends-1),e=E[ei]||[],prog=E.slice(0,ei+1).reduce((t,y)=>t+endSum(y||[]),0),total=E.reduce((t,y)=>t+endSum(y||[]),0);
 const attrs=`id="csad" data-ns="${esc(o.ns)}"`;
 if(o.done&&!fx)return{pl:null,html:`<div ${attrs}><p style="margin:8px 0 4px">${o.info(ei,true)}</p>${csAdTable(o)}<div class="ad-sheet"><div class="ad-sum">${hiStats(E.filter(x=>x&&x.length).flat(),{round:o.round})} <b class="big">${total}</b><span class="small muted"> / ${R.max}</span></div></div><div class="row" style="gap:6px;justify-content:flex-start;align-items:center;padding:0 10px"><button class="ad-small" id="${o.uid}" style="margin-left:0">\u21b6 Undo</button><span class="small muted">Tap an arrow in the table to fix it.</span></div></div>`};
 const pts=((en.p||[])[ei]||[]).map((p,j)=>p&&j<e.length&&{...p,k:e[j],sel:!!(fx&&fx.j==j)}).filter(Boolean);
 const chips=Array.from({length:ape},(_,j)=>e[j]!=null?`<span class="adb ${o.kcol(e[j])}" role="button" tabindex="0" data-csfix="${ei},${j}" aria-label="fix arrow ${esc(e[j])}"${fx&&fx.j==j?' style="outline:3px solid #3b82f6;outline-offset:2px"':''}>${esc(e[j])}</span>`:'<span class="adb adb-empty"></span>').join('');
 const canUndo=E.some(x=>x&&x.length);
 const plotted=(en.p||[]).some(x=>(x||[]).some(Boolean)),szNow=window.arrowNow?arrowNow(en,o.ns):null,szHtml=!window.arrowPick||S.hideFace?'':(plotted&&en.lcT?arrowSizeTxt(en):(!plotted?arrowPick(en,o.ns):''));
 const html=`<div ${attrs}><div class="ad-head"><div class="ad-left"><div class="ad-box ad-line">${o.info(ei,false)}</div></div><div class="ad-right"><div class="ad-num"><span>End</span><b>${endSum(e)}</b></div><div class="ad-num"><span>Prog</span><b>${prog}</b></div></div></div>
 <div class="ad-chips">${chips}<button class="ad-small" id="${o.uid}" ${canUndo&&!fx?'':'disabled'}>\u21b6 Undo</button>${fx?`${fx.i==E.length-1?'<button class="ad-small" id="csdelarrow">Delete arrow</button>':''}<button class="ad-small" id="csfxdone">Done</button>`:''}<button class="ad-small" id="cshide" aria-pressed="${!!S.hideFace}">${S.hideFace?'Show target':'Hide target'}</button>${szHtml}</div>
 <p class="small muted" style="margin:4px 10px">${o.sub?esc(o.sub)+'. ':''}${fx?'Fixing arrow '+(fx.j+1)+' of end '+(fx.i+1)+'. Tap the face or a score to replace it.':'Tap the face or a score. Tap an arrow to fix it.'}</p>
 ${csFaceHtml(FR,pts,false,{noHide:1,zk:o.ns+'|'+ei,d:szNow&&szNow.lcT&&window.arrowMM?arrowMM(szNow):0})}
 <div class="ad-pad lc-pad" style="--cols:${o.keys.length}">${o.keys.map(k=>`<button class="${o.kcol(k)}" ${o.kattr}="${k}" aria-label="score ${k}">${k}</button>`).join('')}</div>
 ${csAdTable(o)}</div>`;
 return{html,pl:{FR,R,pts,zk:o.ns+'|'+ei,keepZ:!!spots3(FR)&&!isBug(FR),sess:en,sid:o.ns,d:szNow&&szNow.lcT&&window.arrowMM?arrowMM(szNow):0}}}
/* chips and the fix buttons; the caller binds the keys, the face, Undo and Delete (they write the data) */
function csAdBind(again){const ad=app.querySelector('#csad');if(!ad)return;const ns=ad.dataset.ns;
 ad.querySelectorAll('[data-csfix]').forEach(b=>{const go=()=>{const[i,j]=b.dataset.csfix.split(',').map(Number),f=csFxFor(ns);window._csFx=f&&f.i==i&&f.j==j?null:{ns,i,j};again()};b.onclick=go;b.onkeydown=ev=>{if(ev.key=='Enter'||ev.key==' '){ev.preventDefault();go()}}});
 const d=ad.querySelector('#csfxdone');if(d)d.onclick=()=>{window._csFx=null;again()}}
/* as Just me: bring the End / Prog boxes to the top and shrink the face until the score keys are on the screen too */
function csAdFit(){const ad=app.querySelector('#csad'),pd=ad&&ad.querySelector('.ad-pad');if(!ad||!pd)return false;
 const fw=app.querySelector('#csfwrap'),nv=document.querySelector('nav'),H=document.querySelector('header.top,header'),hd=(H?H.getBoundingClientRect().bottom:0)+4,lim=innerHeight-(nv&&nv.getBoundingClientRect().top>0?nv.getBoundingClientRect().height:0)-8;
 const top=()=>(ad.querySelector('.ad-head')||ad).getBoundingClientRect().top,place=()=>scrollTo(0,Math.max(0,scrollY+top()-hd));
 /* shrink against the compact 1x height, then grow again if zoomed, so zoom room is not undone */
 if(fw&&fw.dataset.z0h)fw.style.height=fw.dataset.z0h;
 place();const need=pd.getBoundingClientRect().bottom-top(),av=lim-hd;
 if(fw&&need>av){fw.style.height=Math.max(170,fw.getBoundingClientRect().height-(need-av))+'px'}
 if(fw&&window.plotZoomBase)plotZoomBase(fw,fw.getBoundingClientRect().height);
 place();return true}
function csFaceBind(C,plot,again){if(!C)return;const q=x=>app.querySelector(x);
 if(q('#cshide'))q('#cshide').onclick=()=>{S.hideFace=!S.hideFace;save();again()};
 app.querySelectorAll('[data-csspot]').forEach(b=>b.onclick=()=>{window._csSpot=+b.dataset.csspot;PZ.cx=PZ.cy=0;if(!window._zkOn)PZ.k=1;again()});
 const f=q('#cspface');if(!f)return;window._zkOn=!!C.keepZ;if(C.zk&&window._csZk!==C.zk){window._csZk=C.zk;zkOpen(!!C.keepZ)}/* another end or archer opens on the kept zoom (indoor 3-spot) or the full face */const FR=C.FR,R=C.R,pts=C.pts,L=q('#csloupe'),W=q('#csfwrap'),B=csFaceVB(FR).split(/[ ,]+/).map(Number),bc=[B[0]+B[2]/2,B[1]+B[3]/2];
 const clampZ=()=>{PZ.k=Math.min(ZLV[ZLV.length-1],Math.max(1,PZ.k));const fr=f.getBoundingClientRect(),ar=(fr.width||1)/(fr.height||1),Ew=Math.max(B[2],B[3]*ar),Eh=Math.max(B[3],B[2]/ar),m=Ew/2*(1-1/PZ.k);PZ.cx=Math.min(m,Math.max(-m,PZ.cx));const my=Eh/2*(1-1/PZ.k);PZ.cy=Math.min(my,Math.max(-my,PZ.cy));if(PZ.k==1)PZ.cx=PZ.cy=0};
 const applyZ=()=>{plotZoomRoom(W,PZ.k);clampZ();const w=B[2]/PZ.k,h=B[3]/PZ.k;f.setAttribute('viewBox',`${bc[0]+PZ.cx-w/2} ${bc[1]+PZ.cy-h/2} ${w} ${h}`);const zc=q('#cszcycle');if(zc){const st=zStep(PZ.k);zc.textContent=ZLABELS[st];zc.classList.toggle('on',st>0)}if(window._zkOn)zkSet(PZ.k)};
 f.style.touchAction='none';let pan=null,hold=null;applyZ();
 q('#cszcycle').onclick=ev=>{ev.stopPropagation();const st=zStep(PZ.k);PZ.k=ZLV[(st+1)%ZLV.length];if(PZ.k==1)PZ.cx=PZ.cy=0;applyZ()};
 const pt=ev=>{const p=f.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;return p.matrixTransform(f.getScreenCTM().inverse())};
 const show=ev=>{const p=pt(ev);placeLoupe(L,ev);const lw=0.24/PZ.k;
  const z=window.arrowNow?arrowNow(C.sess,C.sid):null,ad=z&&z.lcT&&window.arrowMM?arrowMM(z):0,lc=z&&window.arrowLC?arrowLC(FR,z):undefined;
  L.innerHTML=faceSVG(pts,'cslf',`${p.x-lw/2} ${p.y-lw/2} ${lw} ${lw}`,FR,faceHi(`<path d="M${p.x-lw/6} ${p.y}h${lw/3}M${p.x} ${p.y-lw/6}v${lw/3}" stroke="#39ff14" stroke-width="${0.006/PZ.k}"/><circle cx="${p.x}" cy="${p.y}" r="${0.012/PZ.k}" fill="none" stroke="#39ff14" stroke-width="${0.004/PZ.k}"/>`),ad?{d:ad}:null)+`<b style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:13px;background:#fffc">${tapScore(p,FR,R,lc).k}</b>`};
 const clr=()=>{if(hold){clearTimeout(hold);hold=null}},plotAt=ev=>{L.hidden=true;const z=window.arrowNow?arrowNow(C.sess,C.sid):null,lc=z&&window.arrowLC?arrowLC(FR,z):undefined;const t=tapScore(pt(ev),FR,R,lc);plot(t.k,t.xy)};
 f.onpointerdown=ev=>{try{f.setPointerCapture(ev.pointerId)}catch(e){}pan={x0:ev.clientX,y0:ev.clientY,x:ev.clientX,y:ev.clientY,t:performance.now(),mode:null,last:ev};clr();hold=setTimeout(()=>{hold=null;if(pan&&!pan.mode){pan.mode='aim';show(pan.last)}},300)};
 f.onpointermove=ev=>{if(!pan)return;pan.last=ev;if(!pan.mode&&Math.hypot(ev.clientX-pan.x0,ev.clientY-pan.y0)>10){clr();pan.mode=PZ.k>1?'pan':'scroll'}
  if(pan.mode=='pan'){const s2=1/f.getScreenCTM().a;PZ.cx-=(ev.clientX-pan.x)*s2;PZ.cy-=(ev.clientY-pan.y)*s2;applyZ()}else if(pan.mode=='scroll')scrollBy(0,pan.y-ev.clientY);else if(pan.mode=='aim')show(ev);pan.x=ev.clientX;pan.y=ev.clientY};
 f.onpointercancel=()=>{clr();pan=null;L.hidden=true};
 f.onpointerup=ev=>{clr();const g=pan;pan=null;L.hidden=true;if(!g)return;if(g.mode=='aim')return plotAt(ev);if(!g.mode&&performance.now()-g.t<300&&Math.hypot(ev.clientX-g.x0,ev.clientY-g.y0)<10)plotAt(ev)}}
window.csFaceHtml=csFaceHtml;window.csFaceBind=csFaceBind;window.csAdCard=csAdCard;window.csAdBind=csAdBind;window.csAdFit=csAdFit;window.csFxFor=csFxFor;window.csFxPut=csFxPut;window.csFxDel=csFxDel;window.csSorted=csSorted;
/* Face buttons for one archer (Three spot | Single face); fixed once that archer has an arrow */
const csFSeg=(attr,val,dis,extra)=>`<span class="lg-segs cs-segs" role="group" aria-label="Face">${[['three','Three spot'],['single','Single face']].map(([v,l])=>`<button type="button" class="lg-seg${v==val?' on':''}" ${attr} data-csfv="${v}" aria-pressed="${v==val}" ${dis?'disabled':''}>${v==val?'&#10003; ':''}${l}</button>`).join('')}</span>`;
function csFaceRow(cs,a){const lock=csEnds(cs,a).length>0,v=csAF(cs,a)=='single'?'single':'three';
 return`<div class="cs-face" id="csfacerow" style="margin:6px 0 2px"><div class="row" style="gap:8px;justify-content:flex-start;align-items:center;flex-wrap:wrap"><span class="small"><b>Face</b></span>${csFSeg('data-csfa',v,lock)}</div>${lock?'<p class="small muted" style="margin:2px 0 0">Locked once an arrow is scored. Undo back to the start to change it.</p>':''}</div>`}
/* Partial end first, otherwise the first scorecard archer with the fewest complete ends. A new end starts at archer 1. */
function csWavePick(cs,ids){const R=csR(cs);const part=(ids||[]).find(id=>{if(csDoneP(cs,id))return false;const e=csEnt(cs,id)||{e:[]};const last=(e.e||[])[e.e.length-1];return !!(last&&last.length&&last.length<R.ape)});if(part)return part;let best=null,bn=1e9;(ids||[]).forEach(id=>{if(csDoneP(cs,id))return;const n=csEnds(cs,id).filter(e=>e&&e.length==R.ape).length;if(n<bn){bn=n;best=id}});return best||(ids&&ids[0])||null}
/* Group two-screen flow (end-based rounds only -- 3D/ABA keeps csEntryCard below): a Score Sheet
   overview with every archer's card and Add Scores pinned at the top, and a Score End screen that
   cycles one archer at a time through the current end, same pattern as Lingkana's groupSheet()/
   entryScreen() in lkflow.js (built first there; this mirrors it for a casual group, not a shared
   function, since the two data models -- cs.sc/csKey vs lg.sc/lgKey, no per-device archer lock here
   -- differ enough that sharing code risked the already-working League flow for no real gain). */
function csOneSheet(cs,id){
  const R=csR(cs),e=csEnt(cs,id)||{e:[]},ends=(e.e||[]).filter(z=>z&&z.length);
  /* See app.js's halfRunStart comment: a round with R.halfEnds (Lancaster 660) restarts Prog at the
     start of each half; the saved total (r.tot, via csTotal/csRow) is unaffected, a flat sum either
     way. */
  const half=R.halfEnds||0;
  const esOf=i=>csTotal([ends[i]],cs);
  const rows=ends.map((z,i)=>{
    const es=esOf(i);
    const start=typeof halfRunStart==='function'?halfRunStart(i,half):0;
    let run=0;for(let k=start;k<=i;k++)run+=esOf(k);
    return`<tr><td>${i+1}</td><td>${z.map((a,j)=>`<span class="adb ${csKcol(cs,a)}" role="button" tabindex="0" data-cssfix="${esc(id)},${i},${j}" aria-label="fix arrow ${esc(a)}">${esc(a)}</span>`).join('')}</td><td>${es}</td><td>${run}</td></tr>`;
  }).join('');
  let halvesHtml='';
  if(half&&ends.length){
    const nHalves=Math.ceil((R.ends||ends.length)/half),subs=[];
    for(let h=0;h<nHalves;h++){
      const segEnds=ends.slice(h*half,(h+1)*half);
      if(!segEnds.length)break;
      subs.push(segEnds.reduce((t,_,k)=>t+esOf(h*half+k),0));
    }
    if(subs.length>1||(subs.length===1&&ends.length>=half))halvesHtml=`<div class="ad-sum small">${subs.map((v,i)=>`Round ${i+1} score: <b>${v}</b>`).join(' &nbsp; ')}${subs.length>1?` &nbsp; Total: <b>${subs.reduce((a,b)=>a+b,0)}</b>`:''}</div>`;
  }
  const r=csRow(cs,id);
  return`<div class="ad-sheet" data-cssid="${esc(id)}"><div class="ad-name">${esc(r.nm)}${id==csMe()?' (you)':''}</div><div class="ad-band">${esc(cs.round)}${R.custom?' · practice':''}</div>
    <table class="ad-tab"><thead><tr><th>#</th><th>Scores</th><th>End</th><th>Prog</th></tr></thead><tbody>${rows||'<tr><td colspan="4">No ends yet.</td></tr>'}</tbody></table>
    ${halvesHtml}
    <div class="ad-sum">${hiStats(ends.flat(),{round:cs.round})} <b class="big">${r.tot}</b><span class="small muted"> / ${R.max||R.ends*R.ape*11}</span></div></div>`;
}
function csGroupSheet(code){
  const cs=csGet(code);if(!cs)return;
  if(csFin(cs)||csLocked(cs)||csR(cs).d3||!cs.ppl.some(p=>csCanScore(cs,p.id))){csView(code);return}
  window._csv=code;window._csScoreMode='sheet';cur=null;$('#tabs').hidden=false;
  const ids=cs.ppl.map(p=>p.id).filter(id=>csCanScore(cs,id));
  const done=ids.every(id=>csDoneP(cs,id)),shotAny=ids.some(id=>csEnds(cs,id).length||((csEnt(cs,id)||{}).e||[]).some(z=>z&&z.length));
  app.innerHTML=`<div class="ad" id="cssheet"><div class="ad-title">Score Sheet</div>
    ${done?'':`<button type="button" class="ad-go" id="csaddtop" style="position:sticky;top:0;z-index:5;width:100%">Add Scores</button>`}
    ${ids.map(id=>csOneSheet(cs,id)).join('')}
    <div class="ad-foot"><button class="ad-back" id="cssback">‹ Back</button>${shotAny?`<button class="ad-fin" id="cssdel">Delete score</button>`:''}${shotAny?`<button class="ad-fin" id="cssfin">Finished</button>`:''}${done?'':`<button class="ad-go" id="csaddbot">Add Scores</button>`}</div>
    </div>`;
  $('#cssback').onclick=()=>{window._csScoreMode=null;window._csv=null;nav('score')};
  const goAdd=()=>{window._csScoreMode='entry';window._csAct=csWavePick(cs,ids);csEntryScreen(code)};
  if($('#csaddtop'))$('#csaddtop').onclick=goAdd;
  if($('#csaddbot'))$('#csaddbot').onclick=goAdd;
  if($('#cssfin'))$('#cssfin').onclick=()=>{if(!csAllDone(cs)&&!confirm('Finish the shoot now? Unfinished scores stay as they are.'))return;window._csScoreMode=null;csFinish(code);csView(code)};
  if($('#cssdel'))$('#cssdel').onclick=()=>{if(!confirm('Delete this score? It is removed from this phone.'))return;S.casual=csAll().filter(x=>x.code!=code);save();window._csScoreMode=null;window._csv=null;nav('score')};
  app.querySelectorAll('[data-cssfix]').forEach(b=>{
    b.onclick=b.onkeydown=ev=>{if(ev.type==='keydown'&&ev.key!=='Enter'&&ev.key!==' ')return;
      const[id,i,j]=b.getAttribute('data-cssfix').split(',');
      window._csScoreMode='entry';window._csAct=id;window._csFx={ns:'cs|'+code+'|'+id,i:+i,j:+j};
      csEntryScreen(code);
    };
  });
}
function csEntryScreen(code){
  const cs=csGet(code);if(!cs)return;
  const ids=cs.ppl.map(p=>p.id).filter(id=>csCanScore(cs,id));
  if(!ids.length){csGroupSheet(code);return}
  const id=(window._csAct&&ids.includes(window._csAct))?window._csAct:csWavePick(cs,ids);
  window._csAct=id;window._csScoreMode='entry';cur=null;$('#tabs').hidden=false;
  const R=csR(cs),e=csEnt(cs,id)||{e:[]},E=e.e||[],last=E[E.length-1];
  const ns='cs|'+code+'|'+id,fx=window._csFx&&window._csFx.ns===ns?window._csFx:null;
  /* A just-completed end (length R.ape) stays on screen -- Next still needs tapping -- rather than
     silently rolling over into a blank new end, mirroring Lingkana's window._lgHold in lkflow.js. */
  const hold=!!(window._csHold&&window._csHold.id===id&&last&&last.length===R.ape);
  const curEnd=fx&&E[fx.i]?E[fx.i]:(last&&(last.length<R.ape||hold)?last:[]);
  const ei=fx?fx.i:(last&&(last.length<R.ape||hold)?E.length-1:E.length);
  const done=csDoneP(cs,id),endDone=curEnd.length===R.ape||done;
  /* Prog restarts at the start of the current half for rounds with R.halfEnds (Lancaster 660) --
     see app.js's halfRunStart comment. */
  const half=R.halfEnds||0,halfFrom=typeof halfRunStart==='function'?halfRunStart(ei,half):0;
  const endTot=csTotal([curEnd],cs),before=E.filter((z,k)=>z&&z.length===R.ape&&k>=halfFrom&&k<ei),prog=csTotal(before,cs)+endTot;
  const keys=csKeys(cs,ei,id);
  const r=csRow(cs,id);
  const chips=Array.from({length:R.ape},(_,j)=>curEnd[j]!=null?`<span class="adb ${csKcol(cs,curEnd[j])}" role="button" tabindex="0" data-cssfix2="${ei},${j}" aria-label="fix arrow ${esc(curEnd[j])}"${fx&&fx.i===ei&&fx.j===j?' style="outline:3px solid #3b82f6;outline-offset:2px"':''}>${esc(curEnd[j])}</span>`:'<span class="adb adb-empty"></span>').join('');
  app.innerHTML=`<div class="ad" id="csentryscreen">
    <div class="ad-title">Score End</div>
    <div class="ad-head"><div class="ad-left">
      <div class="ad-box ad-line"><b>${esc(r.nm)}</b>${id==csMe()?' (you)':''}</div>
      <div class="ad-box ad-line"><b id="csendno">${done?'Finished':`End ${Math.min(R.ends,ei+1)} of ${R.ends}`}</b> · <span>${esc(cs.round)}</span></div>
    </div>
    <div class="ad-right"><div class="ad-num"><span>End</span><b>${endTot}</b></div><div class="ad-num"><span>Prog</span><b>${prog}</b></div></div></div>
    <div class="ad-chips" aria-label="Arrows this end">${chips}
      <button class="ad-small" id="csentundo" ${(!E.some(x=>x&&x.length)||fx)?'disabled':''}>↶ Undo</button>
      ${fx?`<button class="ad-small" id="csentdelarrow">✕ Delete arrow</button><button class="ad-small" id="csentfixdone">Done</button>`:''}
    </div>
    ${(done&&!fx)?'':`<div class="ad-pad lc-pad" style="--cols:${keys.length}">${keys.map(k=>`<button type="button" class="${csKcol(cs,k)}" data-csentk="${k}" aria-label="score ${k}" ${endDone&&!fx?'disabled':''}>${k}</button>`).join('')}</div>`}
    <div class="ad-foot"><button class="ad-back" id="csentback">‹ Back</button><button class="ad-go" id="csentnext" ${endDone&&!fx?'':'disabled'}>Next ›</button></div>
    </div>`;
  $('#csentback').onclick=()=>{window._csFx=null;window._csHold=null;window._csScoreMode='sheet';csGroupSheet(code)};
  if($('#csentnext'))$('#csentnext').onclick=()=>csGoNext(code,id);
  app.querySelectorAll('[data-csentk]').forEach(b=>b.onclick=()=>{
    window._csAct=id;csKey(code,id,b.getAttribute('data-csentk'));
    const e2=csEnt(cs,id)||{e:[]},L=(e2.e||[])[(e2.e||[]).length-1];
    window._csHold=(L&&L.length===R.ape)?{id,n:(e2.e||[]).length}:null;
    /* csKey() moves window._csAct to the next archer itself once an end completes (its own
       auto-advance, from before this two-screen flow existed) -- that must wait for the explicit
       Next tap here (csGoNext), not fire a render early. */
    window._csAct=id;
    csEntryScreen(code);
  });
  app.querySelectorAll('[data-cssfix2]').forEach(b=>{
    b.onclick=()=>{
      const[i,j]=b.getAttribute('data-cssfix2').split(',').map(Number);
      const curFx=window._csFx;
      window._csFx=(curFx&&curFx.ns===ns&&curFx.i===i&&curFx.j===j)?null:{ns,i,j};
      csEntryScreen(code);
    };
  });
  if($('#csentundo'))$('#csentundo').onclick=()=>{window._csAct=id;window._csFx=null;window._csHold=null;csUndo(code,id);csEntryScreen(code)};
  if($('#csentfixdone'))$('#csentfixdone').onclick=()=>{window._csFx=null;csEntryScreen(code)};
  if($('#csentdelarrow'))$('#csentdelarrow').onclick=()=>{window._csAct=id;csFxDelete(code,id);window._csFx=null;window._csHold=null;csEntryScreen(code)};
  if(window.plotAfterApply)plotAfterApply();
}
/* Next archer who still needs this end (partial, or fewer complete ends than whoever just finished).
   Once nobody is left to catch up, the end is complete for the whole group: push the group's updated
   scores to the relay right then (csTick(true)), rather than waiting for its own periodic timer --
   this is also what the live leaderboard's next poll picks up. */
function csGoNext(code,id){
  const cs=csGet(code);if(!cs)return;
  window._csFx=null;window._csHold=null;
  const ids=cs.ppl.map(p=>p.id).filter(pid=>csCanScore(cs,pid));
  const R=csR(cs),mine=csEnds(cs,id).filter(e=>e&&e.length===R.ape).length;
  const i=ids.indexOf(id);
  for(let j=1;j<ids.length;j++){
    const n=ids[(i+j)%ids.length];
    if(csDoneP(cs,n))continue;
    const e=csEnt(cs,n)||{e:[]},L=(e.e||[])[(e.e||[]).length-1];
    const partial=!!(L&&L.length&&L.length<R.ape);
    const theirs=csEnds(cs,n).filter(x=>x&&x.length===R.ape).length;
    if(partial||theirs<mine){window._csAct=n;csEntryScreen(code);return}
  }
  window._csScoreMode='sheet';
  csTick(true);
  csGroupSheet(code);
}
function csEntryCard(cs){const R=csR(cs),ids=cs.ppl.map(p=>p.id).filter(id=>csCanScore(cs,id));if(!ids.length||csLocked(cs)||cs.fin)return'';
 const a0=window._csAct&&ids.includes(window._csAct)?window._csAct:null,a=a0||csWavePick(cs,ids),e=csEnt(cs,a)||{e:[]},last=e.e[e.e.length-1],cur3=last&&last.length<R.ape?last:[],done=csDoneP(cs,a);
 const en=Math.min(R.ends,e.e.length+(last&&last.length<R.ape?0:1)),F=csFace(cs,en-1,a),nA=csAbaN(cs,en-1),sg=nA>1?Math.min(csStg(cs,a,en-1),nA-1):0,K=nA?[...csKeys(cs,en-1,a).slice(3*sg,3*sg+3),'M']:csKeys(cs,en-1,a);
 /* Casual scores with the buttons only. The target face, spot picker, Hide target and zoom Reset stay on Just me and on a one-archer league card. */
 const PL=false;window._csPl=null;const AD=null;
 const xv=csXV(cs),endsAll=(e.e||[]),openEnd=endsAll.length&&endsAll[endsAll.length-1]&&endsAll[endsAll.length-1].length&&endsAll[endsAll.length-1].length<R.ape?endsAll[endsAll.length-1]:null,closed=openEnd?endsAll.slice(0,-1):endsAll.filter(z=>z&&z.length);
 const add=z=>(z||[]).reduce((t,x)=>t+csArrow(x,xv),0),endTot=openEnd?add(openEnd):(done&&closed.length?add(closed[closed.length-1]):0),run=closed.reduce((t,z)=>t+add(z),0)+(openEnd?endTot:0);
 /* Each end on its own row, with a running (Prog) total, so a group sharing one phone can check
    this against a paper scoresheet end by end instead of only seeing the overall running total.
    ABA rounds (nA) already have their own full sheet (csAbaTotHtml), so this is skipped there. */
 const endHist=nA?'':(()=>{
   const list=closed.map((z,i)=>({n:i+1,z}));
   if(openEnd)list.push({n:closed.length+1,z:openEnd});
   if(!list.length)return'';
   let rt=0;
   const trs=list.map(r=>{rt+=add(r.z);return`<tr><td>${r.n}</td><td>${esc((r.z||[]).join(' '))}</td><td>${add(r.z)}</td><td>${rt}</td></tr>`}).join('');
   return`<div class="ad-sheet" id="csentryends"><table class="ad-tab"><thead><tr><th>#</th><th>Scores</th><th>End</th><th>Prog</th></tr></thead><tbody>${trs}</tbody></table></div>`;
 })();
 return`<div class="card" id="csentry"><span class="kicker">Score card</span>${ids.length>1?`<div class="row lc-chips" style="gap:6px;flex-wrap:wrap;justify-content:flex-start">${ids.map(id=>{const r=csRow(cs,id);return`<button class="lc-chip${id==a?' on':''}" data-csid="${esc(id)}">${esc(r.nm)} <span class="small">${r.done?'finished':r.n+'/'+R.ends}</span></button>`}).join('')}</div>`:''}
 ${csSplit(cs)&&!done&&!nA?csFaceRow(cs,a):''}
 ${AD?AD.html:`<p style="margin:8px 0 4px"><b>${esc(csNm(cs,a))}</b>${a==csMe()?' (you)':''} · ${done?'finished':nA?esc(csAbaHalf(cs,en-1)):(R.d3?'Target ':'End ')+en+' of '+R.ends} · ${esc(csEndFace(cs,en-1,a))}${F.dist&&!/undefined/.test(F.dist)?' · '+esc(F.dist):''}</p>
 ${nA?'':`<p class="small" id="cstots" style="margin:0 0 6px">End <b id="csendtot">${endTot}</b> · Running <b id="csrun">${run}</b></p>${endHist}`}
 ${done||!nA?'':`<p style="margin:4px 0" id="csabaarrow"><b>Arrow ${sg+1}</b>${sg?' \u00b7 arrow '+sg+' missed':''}</p><p class="small muted" style="margin:0 0 4px">${nA>1?'Tap the score of your first arrow to hit. Only tap Miss if the arrow missed: then shoot the next arrow at the same target.':'One arrow a target. Tap its score, or Miss (scores 0).'}</p>`}
 ${nA?csAbaTotHtml(cs,a):''}
 ${PL&&!done?csFaceHtml(F,[],false):''}
 ${done?'':`<div class="vg-slots">${Array.from({length:R.ape},(_,j)=>`<span class="vg-slot${cur3[j]?' on':''}">${cur3[j]?esc(cur3[j]):''}</span>`).join('')}</div>
 <div class="ad-pad lc-pad" style="--cols:${K.length>8?Math.ceil(K.length/2):K.length};margin-top:8px">${K.map(k=>`<button class="${csKcol(cs,k)}" data-csk="${k}" aria-label="score ${k}">${k=='M'&&nA?(sg<nA-1?'Miss':'Miss (0)'):k}</button>`).join('')}</div>`}
 <button class="btn ghost" id="csundo" style="margin-top:6px" ${csEnds(cs,a).length||sg?'':'disabled'}>${nA?'Undo':'Undo last arrow'}</button>`}</div>`}
/* analysis straight under the score once my own card is finished (the same summary and group analysis Just me shows) */
function csAnCard(cs){try{const me=csMe();if(!csP(cs,me)||!csDoneP(cs,me)||!window.roundSummary)return'';const s=S.sessions.find(x=>x.id=='cs-'+cs.code);if(!s)return'';return`<div id="csan">${roundSummary(s)}${window.shootCompareHTML?shootCompareHTML(s):''}</div>`}catch(e){console.error(e);return''}}
function csView(code){const cs=csGet(code);if(!cs)return;
 /* While the shoot is still being scored (not finished, not locked by match play, and someone here
    can still add arrows), the group two-screen flow (csGroupSheet/csEntryScreen) is the page -- not
    this one. This page is the finished-shoot review (and, while not finished but csAllDone, the
    place to Finish or reopen "Fix a score" on csEntryCard, both unchanged below). */
 /* 3D/ABA rounds keep the old single-card flow below (csEntryCard) -- their per-target, per-arrow-group
    UI is different enough that porting it into the new end-based group screens is out of scope here. */
 if(!csFin(cs)&&!csLocked(cs)&&!csR(cs).d3&&cs.ppl.some(p=>csCanScore(cs,p.id))){csGroupSheet(code);return}
 window._csv=code;cur=null;$('#tabs').hidden=false;const me=csMe(),host=csHost(cs),R=csR(cs),fin=csFin(cs),rows=cs.ppl.map(p=>csRow(cs,p.id)),m=cs.mp&&cs.mp.on&&cs.mp.seeds?csMatchSync(cs):null;
 /* Once the shoot is finished, the displayed table ranks highest score to lowest (ties on 10s then Xs, same rule as match play seeding).
    cs.ppl itself keeps the order people were added (shooting order, used for the audit trail and the People list below). */
 const sortedRows=fin?rows.slice().sort((a,b)=>b.tot-a.tot||b.t10-a.t10||b.x-a.x):rows;
 if(cs.status=='invite'){app.innerHTML=`<div id="csview"><div class="card dark"><span class="kicker">Casual shoot</span><h1>${esc(cs.name)}</h1><p class="small">${esc(testerName(cs.host))} added you. Tap Join on your Score tab.</p></div></div>`;return}
 const mpOk=cs.ppl.length>=2,seedsN=csSeeds(cs).length,lad=m&&window.suLadder?suLadder(m):[],mpDone=lad.length&&lad[lad.length-1].res.winner;
 const ask=host&&fin&&mpOk&&!(cs.mp&&cs.mp.on)&&!(cs.mp&&cs.mp.ask)&&seedsN>=2;
 const tab=`<table class="ad-tab cs-tab" style="width:100%"><thead><tr>${fin?'<th>#</th>':''}<th>Archer</th><th>${R.d3?'Targets':'Ends'}</th><th>Score</th><th>${R.d3?csTB(cs)[0]+'s':csFldS(cs)?'6s':'10s'}</th><th>${R.d3?csTB(cs)[1]+'s':csFldS(cs)?'5s':ROUNDS[cs.round]&&ROUNDS[cs.round].wa18?'9s':'X'}</th></tr></thead><tbody>${sortedRows.map((r,ri)=>{const p=csP(cs,r.id);return`<tr data-csrow="${esc(r.id)}">${fin?`<td class="small muted">${ri+1}</td>`:''}<td>${esc(r.nm)}${r.id==me?' (you)':''}${p&&!p.tid?' <span class="small muted">name only</span>':''}${csMixed(cs)?` <span class="small muted">${csAF(cs,r.id)=='single'?'single face':'3-spot'}</span>`:''}${p&&p.tid&&p.tid!=cs.host&&!(cs.seen||{})[p.tid]&&!csEnds(cs,r.id).length&&host?' <span class="small muted">invited</span>':''}</td><td>${r.n}/${R.ends}</td><td><b>${r.tot}</b></td><td>${r.t10}</td><td>${r.x}</td></tr>`}).join('')}</tbody></table>
 ${csMixed(cs)?`<p class="small muted" id="csfacenote" style="margin:4px 0 0">Different faces: each archer shoots their own, scored on the same ${ROUNDS[cs.round]&&ROUNDS[cs.round].wa18?'10 to M':'X, 10 to M'} scale.</p>`:''}
 <p class="small muted" style="margin:4px 0 0">${fin?'This shoot\'s scores only, highest to lowest.':'This shoot\'s scores only, in the order people were added.'} Not counted in any league.</p>`;
 const ends=`<details id="csends"><summary class="small">${R.d3?'Targets':'Ends'} for each archer</summary>${rows.map(r=>`<div class="small" style="margin:6px 0"><b>${esc(r.nm)}</b>: ${r.E.length?r.E.map((e,i)=>`${R.d3?'T':'E'}${i+1} ${esc(e.join(' '))} (${csTotal(e,cs)})`).join(' · '):'no ends yet'}</div>`).join('')}</details>`;
 const mpCard=!mpOk?`<div class="card" id="csmp"><p class="small muted" style="margin:0">Match play needs 2 or more archers.</p></div>`
  :`<div class="card" id="csmp"><span class="kicker">Match play</span>${ask?`<div id="csask"><h3 style="margin:2px 0 4px">Do match play?</h3><p class="small" style="margin:0 0 8px">Seeded from this shoot's scores, highest score is seed 1${CS_SEED_FINISHED_ONLY?' (only archers who finished every end)':''}. ${R.d3?CS_MP_ENDS+' targets, one score each':CS_MP_ENDS+' ends of 3'} a match, winner moves up.</p><div class="row" style="gap:6px;justify-content:flex-start"><button class="btn alt" id="csyes">Yes, start match play</button><button class="btn ghost" id="csnot">No thanks</button></div></div>`:''}
  ${host?`<div class="row" style="gap:8px;justify-content:flex-start;align-items:center;margin-top:${ask?'10':'0'}px"><span class="small">Match play</span>${csSeg('csmpt',[['off','Off'],['on','On']],cs.mp&&cs.mp.on?'on':'off')}</div>`:`<p class="small" style="margin:0">Match play is ${cs.mp&&cs.mp.on?'on':'off'}.</p>`}
  <p class="small muted" style="margin:6px 0 0">${cs.mp&&cs.mp.on?(m?'Seeded from this shoot\'s scores. Results stay with this shoot.':'Starts when the shoot is finished, seeded from the scores.'):'Off. '+(host?'Switch it on any time, even after the shoot.':'')}</p>
  ${m?`<button class="btn alt full" id="csmpopen" style="margin-top:8px">${mpDone?'Match play result':'Open match play'}</button>`:''}<p class="small" id="csmpmsg" role="alert"></p></div>`;
 const addBox=host&&!fin&&cs.ppl.length<CS_MAX?`<details id="csmore"><summary class="small">Add someone (${cs.ppl.length} of ${CS_MAX})</summary><div class="row" style="gap:6px;margin-top:6px"><input id="csvtype" maxlength="40" autocomplete="off" placeholder="Type a name" style="flex:1"><button class="btn ghost" id="csvadd">Add</button></div><div id="csvsug"></div><p class="small" id="csvmsg" role="alert"></p></details>`:'';
 const ppl=host&&!fin?`<details id="cspeople"><summary class="small">People</summary>${cs.ppl.map(p=>`<div class="list-item row"><span>${esc(p.tid?(p.tid==me?testerName(me)+' (you)':csSetupNm(p.tid)):p.n)} <span class="small muted">${p.tid?(p.tid==me?'host':'has the app, scores themselves'):'name only, you score for them'}</span></span><span>${p.tid&&p.tid!=me&&!csEnds(cs,p.id).length?`<button class="btn ghost" data-csunl="${esc(p.id)}">Score for them</button>`:''}${p.id!=cs.host&&!csEnds(cs,p.id).length?`<button class="btn ghost" data-csrm="${esc(p.id)}">Remove</button>`:''}</span></div>`).join('')}</details>`:'';
 app.innerHTML=`<div id="csview"><div class="card dark"><span class="kicker">Casual shoot · ${esc(CS_DISC[cs.disc]||'')}</span><h1>${esc(cs.name)}</h1>
 <p class="small" style="margin:0">${esc(cs.round)} · ${esc(csFaceTxt(cs))} · ${R.d3?plN(R.ends,'target','targets'):plN(R.ends,'end','ends')+' of '+R.ape} · ${esc(cs.date||'')}</p><p class="small" style="margin:4px 0 0">${fin?'Finished.':'Shooting now.'} Hosted by ${host?'you':esc(testerName(cs.host))}.</p></div>
 ${csAllDone(cs)?'':csEntryCard(cs)}
 ${csAllDone(cs)||!csAbaN(cs,0)?'':csAbaLive(cs)}
 ${csAllDone(cs)&&csAbaN(cs,0)?`<div class="card" id="csabasum"><span class="kicker">Totals</span>${cs.ppl.map(p=>`<p style="margin:6px 0 0"><b>${esc(csNm(cs,p.id))}</b></p>${csAbaTotHtml(cs,p.id).replace(/<div class="list-item"[^]*?<\/div>/,'')}${csAbaSheetHtml(cs,p.id,false)}`).join('')}</div>`:''}
 <div class="card"><h3>Scores</h3>${tab}${ends}</div>
 ${csAnCard(cs)}
 ${fin&&rows.length>1?`<div class="card" id="csshare"><h3 style="margin:0 0 6px">Combined scorecard</h3><p class="small muted" style="margin:0 0 8px">Everyone's score from this shoot, to send to the group.</p><button class="btn alt" id="csshareall">Share combined scorecard</button><p class="small" id="cssharemsg" role="status"></p></div>`:''}
 ${csAllDone(cs)&&csEntryCard(cs)?`<details class="card" id="csfix" ${window._csFix?'open':''}><summary class="small">Fix a score</summary>${csEntryCard(cs).replace('<div class="card" id="csentry">','<div id="csentry">')}</details>`:''}
 ${mpCard}
 <div class="card">${addBox}${ppl}${host&&!fin?`<button class="btn ghost" id="csfin" style="margin-top:8px">Finish shoot</button>`:''}
 <p class="small muted" id="csq" style="margin:8px 0 4px">${csQTxt(cs)}</p><div class="row" style="gap:6px;justify-content:flex-start;flex-wrap:wrap"><button class="btn ghost" id="csrf">Refresh now</button><button class="btn ghost" id="csback">Back to Score</button>${fin?`<button class="btn ghost" id="csdel">Remove from this phone</button>`:''}</div></div></div>`;
 const q=s=>app.querySelector(s);if(q('#csfix'))q('#csfix').ontoggle=()=>{window._csFix=q('#csfix').open};
 app.querySelectorAll('[data-csid]').forEach(b=>b.onclick=()=>{window._csAct=b.dataset.csid;csView(code)});
 const act=q('#csentry .lc-chip.on')?q('#csentry .lc-chip.on').dataset.csid:(cs.ppl.map(p=>p.id).filter(id=>csCanScore(cs,id))[0]);
 app.querySelectorAll('[data-csfa]').forEach(b=>b.onclick=()=>{window._csAct=act;csSetFace(code,act,b.dataset.csfv)});
 app.querySelectorAll('[data-csk]').forEach(b=>b.onclick=()=>{window._csAct=act;const E0=csEnds(cs,act),ei=E0.length,nA=csAbaN(cs,ei),sg=nA>1?csStg(cs,act,ei):0;
  if(nA>1&&b.dataset.csk=='M'&&sg<nA-1){window._csStg={k:csStgKey(cs,act,ei),s:sg+1};csView(code);return}
  window._csStg=null;csKey(code,act,b.dataset.csk)});
 if(window._csPl&&window._csPl.code==code)csFaceBind(window._csPl,(k,xy)=>{window._csAct=act;window._csStg=null;csKey(code,act,k,xy)},()=>csView(code));
 if(window.csAdBind)csAdBind(()=>csView(code));if(q('#csdelarrow'))q('#csdelarrow').onclick=()=>{window._csAct=act;csFxDelete(code,act)};
 if(q('#csundo'))q('#csundo').onclick=()=>{window._csAct=act;const ei=csEnds(cs,act).length,sg=csAbaN(cs,ei)>1?csStg(cs,act,ei):0;if(sg){window._csStg={k:csStgKey(cs,act,ei),s:sg-1};csView(code);return}window._csStg=null;csUndo(code,act)};
 if(q('#csyes'))q('#csyes').onclick=()=>{if(!csMpStart(code))q('#csmpmsg').textContent='Needs 2 or more archers with scores.';csView(code)};
 if(q('#csnot'))q('#csnot').onclick=()=>{csMpDismiss(code);csView(code)};
 app.querySelectorAll('[data-csmpt]').forEach(b=>b.onclick=()=>{const on=b.dataset.csmpt=='on';if(!on&&m&&lad.some(x=>x.res.live)&&!confirm('Switch match play off? Its scores are cleared.'))return;if(!csMpSetup(code,on)){q('#csmpmsg').textContent='Needs 2 or more archers with scores.';return}csView(code)});
 if(q('#csmpopen'))q('#csmpopen').onclick=()=>suLadderView(csMpCode(cs));
 if(q('#csfin'))q('#csfin').onclick=()=>{if(!csAllDone(cs)&&!confirm('Finish the shoot now? Unfinished scores stay as they are.'))return;csFinish(code)};
 if(q('#csshareall'))q('#csshareall').onclick=async()=>{
  const msg=q('#cssharemsg'),xLabel=R.d3?csTB(cs)[1]+'s':csFldS(cs)?'5s':(ROUNDS[cs.round]&&ROUNDS[cs.round].wa18?'9s':'X');
  const tLabel=R.d3?csTB(cs)[0]+'s':csFldS(cs)?'6s':'10s';
  const title=cs.name+' - combined scorecard',text=cs.round+(cs.date?' · '+cs.date:'');
  if(window.drawCombined&&window.shareCanvas){
   const name=(cs.name||'scorecard').replace(/[^A-Za-z0-9]+/g,'-')+'-combined.png';
   try{await window.shareCanvas(window.drawCombined(cs,sortedRows,xLabel,tLabel),name,title,text);if(msg)msg.textContent='Shared.';return}catch(e){}
  }
  const lines=sortedRows.map((r,i)=>`${i+1}. ${r.nm} - ${r.tot} (${r.t10} ${tLabel}, ${r.x} ${xLabel})`);
  const fullText=`${cs.name} - ${cs.round}\n${cs.date||''}\n\n${lines.join('\n')}\n\nScoreTool - this shoot's scores only, not counted in any league.`;
  try{
   if(navigator.share){await navigator.share({title,text:fullText});if(msg)msg.textContent='Shared.';return}
  }catch(e){if(e&&e.name=='AbortError')return}
  try{if(navigator.clipboard){await navigator.clipboard.writeText(fullText);if(msg)msg.textContent='Copied to clipboard - paste it to the group.';return}}catch(e){}
  if(msg)msg.textContent=fullText;
 };
 app.querySelectorAll('[data-csrm]').forEach(b=>b.onclick=()=>{csRemove(code,b.dataset.csrm);csView(code)});
 app.querySelectorAll('[data-csunl]').forEach(b=>b.onclick=()=>{csUnlink(code,b.dataset.csunl);csView(code)});
 const vt=q('#csvtype');if(vt){const sug=()=>{const sg=csMatch(vt.value,cs.ppl.filter(p=>p.tid).map(p=>p.tid));q('#csvsug').innerHTML=sg.map(t=>`<button type="button" class="lc-chip cs-sug" data-csvlink="${t.id}">Link ${esc(csSetupNm(t.id))} <span class="small">· has the app</span></button>`).join('');
  app.querySelectorAll('[data-csvlink]').forEach(b=>b.onclick=()=>{const e=csAdd(code,{tid:b.dataset.csvlink});if(e){q('#csvmsg').textContent=e;return}window._csMore=1;csView(code)})};vt.oninput=sug;
  q('#csvadd').onclick=()=>{const e=csAdd(code,{n:vt.value});if(e){q('#csvmsg').textContent=e;return}window._csMore=1;csView(code)};if(window._csMore){q('#csmore').open=true;window._csMore=0}}
 q('#csrf').onclick=()=>csTick(true);q('#csback').onclick=()=>{window._csv=null;nav('score')};
 if(q('#csdel'))q('#csdel').onclick=()=>{if(!confirm('Remove this casual shoot from this phone? Other phones keep it.'))return;S.casual=csAll().filter(x=>x.code!=code);S.matches=h2hAll().filter(x=>x.code!=csMpCode(cs));save();window._csv=null;nav('score')};
 if(!(window.csAdFit&&q('#csad')&&q('#csad .ad-pad')&&csAdFit()))scrollTo(0,0);if(window.plotAfterApply)plotAfterApply()}
window.csView=csView;
/* leaving the shoot view by the tabs clears it */
const _csNav=nav;nav=function(v){if(v!='score'){window._csMode=null;window._csSeen=0}window._csv=null;return _csNav.apply(this,arguments)};
