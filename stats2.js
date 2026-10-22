/* Stats, rebuilt (Oct 2026): ONE round picker + ONE shoot picker at the top drive every card, from ONE list of shoots
   (official scoresheets + app sessions). Up front: Last shoot, How you're going, PB, Score history. Everything else sits behind
   'More detail'. Incomplete rounds (official sheets marked not finished, or app sessions with fewer ends than the round)
   are left out everywhere unless 'Include incomplete' is ticked. Real data only. */
(function(){
const APP_ALIAS={'WA 90/1440 (90/70/50/30m)':'WA 90/1440','WA 70/1440 (70/60/50/30m)':'WA 70/1440','WA 60/1440 (60/50/40/30m)':'WA 60/1440','AA 50/1440 (50/40/30/20m)':'AA 50/1440',
 'WA 720 (70m)':'WA 70/720','WA 720 (60m)':'WA 60/720','WA 720 (50m Compound)':'WA 50/720','WA 60/900 (60/50/40m)':'WA 60/900 (Canberra)','Short Canberra (50/40/30m)':'Short Canberra',
 'Junior Canberra (40/30/20m)':'Junior Canberra','Indoor WA 18m':'WA Indoor 18m','Indoor WA 25m':'WA Indoor 25m'};
const canon=r=>APP_ALIAS[r]||r;window.canonRound=canon;
const E=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=d=>{const x=new Date(d+'T00:00');return isNaN(x)?d:x.getDate()+' '+x.toLocaleString('en-AU',{month:'short'})+' '+x.getFullYear()};
const avg=v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null,r1=v=>v==null?'–':(Math.round(v*10)/10).toFixed(1),pl=(n,w)=>n+' '+w+(n==1?'':'s');
const isMe=()=>{const p=String(S.profile||'').toLowerCase();return p.includes('stride')&&p.includes('nath')};
function ratingOf(r){if(r.rating)return r.rating;const m=/Rating\s+([\d.]+)/i.exec(r.notes||'');if(m)return+m[1];
 if(typeof aaRating=='function'&&typeof aaCategory=='function'){const c=aaCategory(r.division);if(c){const v=aaRating(r.score,r.round,c.bow=='Compound'&&r.round=='WA Indoor 18m');if(v!=null)return Math.round(v*10)/10}}return null}
/* every shoot, one list */
function allShoots(){const me=S.profile||'',out=[],O=offFor(me).slice(),used=new Set();
 findReal(me).forEach(r=>{const d=normDate(r.date);if(!(r.score>0))return;
  const o=O.find(x=>!used.has(x)&&normDate(x.date)==d&&x.round==r.round&&(x.score==null||x.score==r.score));let EN=[],D=[],fl=0;
  if(o){const ge=o.ends.filter(e=>!e.flag&&e.arrows.length),sum=ge.reduce((t,e)=>t+endSum(e.arrows),0);if(sum==r.score){used.add(o);EN=ge.map(e=>e.arrows);D=ge.map(e=>e.dist);fl=o.ends.length-ge.length}}
  out.push({id:'o|'+d+'|'+r.round+'|'+r.score,date:d,round:canon(r.round),score:r.score,ends:EN,dists:D,flagged:fl,src:'comp',inc:!!r.incomplete,event:r.event||'',club:r.club||'',rating:ratingOf(r),url:r.url||'',field:/field|3d/i.test(r.round),r})});
 S.sessions.filter(s=>!s.sample&&ROUNDS[s.round]&&arrowsIn(s)>0).forEach(s=>{const R=ROUNDS[s.round],EN=s.ends.filter(e=>e&&e.length);
  out.push({id:s.id,date:s.date,round:canon(s.round),score:total(s),ends:EN,dists:EN.map((_,i)=>distOf(faceR(R,i),s.round)),flagged:0,src:s.src=='paper'?'paper':'practice',inc:!isDone(s),
   event:s.src=='paper'?'Paper score sheet (competition)':'Practice',rating:null,field:isFld(faceR(R,0))||!!R.aba,aba:!!R.aba,s})});
 return out.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:(a.id<b.id?-1:1))}
window.statShoots=allShoots;
/* ONE round list for Stats and Analytics: canonical names, rounds with a counted shoot (complete, or any when Include incomplete is ticked), newest first */
function roundList(L){L=L||allShoots();const rc={},last={};L.filter(x=>!!S.incInc||!x.inc).forEach(x=>{rc[x.round]=(rc[x.round]||0)+1;last[x.round]=x.date});
 return Object.keys(rc).sort((a,b)=>last[a]<last[b]?1:last[a]>last[b]?-1:rc[b]-rc[a]).map(r=>({r,n:rc[r]}))}
window.statRounds=roundList;
/* distance label for an end: the real distance, or for field/3D rounds (distances vary target to target) a field label; never '?' */
window.distLabel=(d,round)=>{d=String(d||'').replace(/\s*\(leg.*\)/,'').trim();if(d)return d;const r=String(round||'');return/aba|3d/i.test(r)?'3D (unmarked)':/umk|unmarked/i.test(r)?'Field (unmarked)':/field/i.test(r)?'Field (marked, mixed)':'Not recorded'};
const ST=window._st2=window._st2||{r:null,id:null};
const incOn=()=>!!S.incInc;
const poolOf=(L,r)=>L.filter(x=>x.round==r&&(incOn()||!x.inc));
window.statPool=()=>{const L=allShoots();return poolOf(L,ST.r)};
const SRC={comp:'Competition',paper:'Competition · paper sheet',practice:'Practice'};
const tag=x=>`<span class="real">${SRC[x.src]}</span>${x.inc?' <span class="sample inc-tag">Incomplete</span>':''}`;
/* best score at each end over the last 3 complete shoots with matching ends: never below any of those scores */
function bestEnds(P){const L=P.filter(x=>!x.inc&&x.ends.length);if(!L.length)return null;const n=L[L.length-1].ends.length,M=L.filter(x=>x.ends.length==n).slice(-3);if(M.length<2)return null;
 const v=[...Array(n)].reduce((t,_,i)=>t+Math.max(...M.map(x=>endSum(x.ends[i]))),0);return{v,n:M.length,from:M.map(x=>x.score)}}
window.bestEnds=bestEnds;
function arrowTable(A,field){const keys=field?['6','5','4','3','2','1','M']:['X','10','9','8','7','6','5','4','3','2','1','M'],c=k=>A.filter(a=>String(a).toUpperCase()==k).length;
 const ks=keys.filter(k=>c(k)>0||(!field&&['X','10','9','8'].includes(k)));
 return`<table class="small arrtab" style="width:100%;border-collapse:collapse;text-align:center"><tr>${ks.map(k=>`<th style="padding:2px">${k}</th>`).join('')}</tr><tr>${ks.map(k=>`<td style="padding:2px"><b>${c(k)}</b></td>`).join('')}</tr></table>`}
const card=(id,k,t,b,x,n)=>`<div class="card scard" id="${id}" data-round="${E(ST.r)}" data-n="${n}">${k?`<span class="kicker">${k}</span>`:''}${t?`<h3 style="margin:2px 0 6px">${t}</h3>`:''}${b}</div>`;
/* early vs late, one threshold everywhere: 1 point an end */
const LATE_T=1;
/* under-18 testers: numbers only, no tips or reasons (Coach's read is Nathe-only anyway) */
const junior=()=>typeof TESTER!='undefined'&&!!(TESTER&&TESTER.junior);window.statJunior=junior;
function lateText(e1,e2,t){if(junior()){const d=e2-e1;return Math.abs(d)<LATE_T?`Your last ${pl(t,'end')} were within ${r1(Math.abs(d))} of your first ${pl(t,'end')}.`:`Your last ${pl(t,'end')} averaged ${plN(r1(Math.abs(d)),'point','points')} an end ${d<0?'lower':'higher'} than your first ${pl(t,'end')}.`}const d=e2-e1;return Math.abs(d)<LATE_T?`Your last ${pl(t,'end')} were within ${r1(Math.abs(d))} of your first ${pl(t,'end')}, so they held up.`:d<0?`Your last ${pl(t,'end')} averaged ${plN(r1(-d),'point','points')} an end lower than your first ${pl(t,'end')}. Points slip late in the round.`:`Your last ${pl(t,'end')} averaged ${plN(r1(d),'point','points')} an end higher than your first ${pl(t,'end')}. You finish stronger than you start.`}
window.lateText=lateText;
/* per-distance averages over a set of shoots: every arrow at that distance (same as Analytics and the scores read) */
function distAvgs(W){const pd={};W.forEach(s=>s.ends.forEach((e,i)=>{const d=s.dists[i];if(!d)return;const o=pd[d]=pd[d]||{d,pts:0,arr:0,ends:0};o.pts+=e.reduce((t,a)=>t+(val(a)||0),0);o.arr+=e.length;o.ends++}));
 return Object.values(pd).map(o=>({d:o.d,pa:o.pts/o.arr,pe:o.pts/o.ends,ape:o.arr/o.ends}))}
window.distAvgs=distAvgs;
/* Every tip uses ONE labelled set: all shoots of this round in the picker list that have end-by-end scores
   (follows 'Include incomplete'), the same shoots the scores read and Analytics use. */
function tipFor(P,x){if(x&&x.aba&&x.s&&window.aba3DBlocks){const b=aba3DBlocks(aba3DFacts(x.s));return{set:1,kind:'3d-'+b.kind,txt:'This round: '+b.txt}}const W=P.filter(s=>s.ends.length);if(!W.length)return{set:0,txt:'Shoot this round with end-by-end scores to get a tip.'};
 const lab=`<span class="small muted" id="tipset">Across your ${pl(W.length,'shoot')} of ${E(ST.r)} with end-by-end scores${W.length<P.length?` (${P.length-W.length} with totals only left out)`:''}:</span> `;
 const A=W.flatMap(s=>s.ends.flat()),fld=W[0].field,low=A.filter(a=>(val(a)||0)<=(fld?4:8)).length;
 const D=distAvgs(W).sort((a,b)=>a.pa-b.pa);
 if(D.length>1&&D[1].pa-D[0].pa>=0.1){const w=D[0],nx=D[1],ne=x.dists.filter(d=>d==w.d).length||Math.round(W.reduce((t,s)=>t+s.dists.filter(d=>d==w.d).length,0)/W.length),lost=Math.round((w.ape*(fld?6:10)-w.pe)*ne);
  return{set:W.length,kind:'dist',d:w.d,v:+w.pe.toFixed(1),txt:lab+`You drop the most points at <b>${E(w.d)}</b>: ${r1(w.pe)} an end (${w.pa.toFixed(2)} an arrow), about ${pl(lost,'point')} short of perfect over its ${pl(ne,'end')}. Next weakest is ${E(nx.d)} at ${r1(nx.pe)} an end (${nx.pa.toFixed(2)}). Extra time at ${E(w.d)} pays off most.`}}
 const fl=W.filter(s=>s.ends.length>=2).map(s=>{const t=Math.max(1,Math.floor(s.ends.length/3));return[avg(s.ends.slice(0,t).map(endSum)),avg(s.ends.slice(-t).map(endSum)),t]});
 if(fl.length){const e1=avg(fl.map(f=>f[0])),e2=avg(fl.map(f=>f[1]));if(e1-e2>=LATE_T)return{set:W.length,kind:'late',v:[+e1.toFixed(1),+e2.toFixed(1)],txt:lab+`Your last ends average ${r1(e2)}, against ${r1(e1)} for your first ends (first and last third of each shoot). Points slip late in the round, so plan to keep your energy and focus to the end.`}}
 if(A.length&&low/A.length>0.2)return{set:W.length,kind:'low',v:Math.round(100*low/A.length),txt:lab+`${Math.round(100*low/A.length)}% of your arrows (${low} of ${A.length}) were ${fld?'4s':'8s'} or lower. Cutting those low arrows is worth more than chasing ${fld?'6s':'Xs'}.`};
 return{set:W.length,kind:'ok',txt:lab+'Your ends are close together. Keep doing what you are doing.'}}
function render(){if(window.abaSeed)abaSeed();const L=allShoots(),RL=roundList(L),rc={};RL.forEach(o=>rc[o.r]=o.n);
 const rounds=RL.map(o=>o.r);
 const nInc=L.filter(x=>x.inc).length;
 if(!rounds.length){app.innerHTML=`<div class="card"><span class="kicker">Stats</span><h2>No scores yet</h2><p class="small muted">Score a round in the app, or your official results from Archer's Diary show here once they load.</p>${nInc?`<label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="incinc" style="width:18px;height:18px"> Include incomplete rounds (${nInc})</label>`:''}</div>`;bind();return}
 if(!ST.r||!rc[ST.r])ST.r=rounds[0];const P=poolOf(L,ST.r),newest=P[P.length-1];let x=P.find(s=>s.id==ST.id);if(!x){x=newest;ST.id=x.id}
 const n=P.length,full=P.filter(s=>!s.inc),R=ROUNDS[Object.keys(ROUNDS).find(k=>canon(k)==ST.r)]||{};
 let h=`<div class="card dark" id="statpick"><span class="kicker">Stats</span><h2 style="margin:2px 0 8px">Pick a round and a shoot</h2>
 <label for="srd" class="small">Round</label><select id="srd">${rounds.map(r=>`<option value="${E(r)}" ${r==ST.r?'selected':''}>${E(r)} (${rc[r]})</option>`).join('')}</select>
 <label for="ssh" class="small" style="margin-top:6px;display:block">Shoot</label><select id="ssh">${P.slice().reverse().map(s=>`<option value="${E(s.id)}" ${s.id==x.id?'selected':''}>${fmt(s.date)} · ${s.score} · ${SRC[s.src]}${s.inc?' · Incomplete':''}</option>`).join('')}</select>
 <label class="small" style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="incinc" ${incOn()?'checked':''} style="width:18px;height:18px"> Include incomplete rounds${nInc?` (${nInc})`:''}</label>
 <p class="small muted" style="margin:4px 0 0" id="statcount">${pl(n,'shoot')} of ${E(ST.r)}. Every card below uses these.</p></div>`;
 /* 1 Last shoot */
 const sums=x.ends.map(endSum),A=x.ends.flat(),apes=x.ends.map(e=>e.length);
 const ends=x.ends.length?(x.aba?`<div class="small" style="display:flex;flex-wrap:wrap;gap:4px">${sums.map((v,i)=>`${(h1=>(i==0||i==h1)&&sums.length>h1?`<span class="small muted" style="flex-basis:100%">${i<h1?'First half':'Second half'} · targets 1-${i<h1?h1:sums.length-h1}</span>`:'')(x.s&&ROUNDS[x.s.round]&&ROUNDS[x.s.round].halves?ROUNDS[x.s.round].halves[0].t:20)}<span class="adb ${v>=20?'k-y':v>=16?'k-b':v?'k-k':'k-m'}" title="target ${(h1=>i<h1?i+1:i-h1+1)(x.s&&ROUNDS[x.s.round]&&ROUNDS[x.s.round].halves?ROUNDS[x.s.round].halves[0].t:20)}">${v||'M'}</span>`).join('')}</div>`:endChart(sums,apes,x.dists.some(Boolean)?x.dists:null,'End by end',[],x.field)+`<h3 style="margin:10px 0 4px">Arrow values</h3>`+arrowTable(A,x.field))
  :'<p class="small muted">Only the total was published for this shoot, so there are no end-by-end scores.</p>';
 h+=card('c-last',(x===newest?'Last shoot':'Chosen shoot')+' · '+fmt(x.date),'',`<div class="row" style="align-items:flex-end"><div><b style="font-size:34px;color:var(--gold)" id="lastscore">${x.score}</b>${R.max?`<span class="small muted"> / ${R.max}</span>`:''}<div class="small muted">${E(x.event)}${x.club?' · '+E(x.club):''}</div></div><div style="text-align:right">${tag(x)}${x.rating!=null?`<div class="small muted">rating ${x.rating}</div>`:''}</div></div>
  ${x.ends.length?`<p class="small muted" style="margin:6px 0">${x.aba?pl(x.ends.length,'target'):pl(x.ends.length,'end')+' · '+A.length+' arrows'}${x.flagged?` · the sheet has ${x.ends.length+x.flagged} ends filled in: ${x.ends.length} scored and ${x.flagged} that is all misses (most likely a sheet error, so it's left out)`:''}</p>`:''}${ends}${x.url?`<a class="small" href="${E(x.url)}" target="_blank" rel="noopener">Scoresheet ↗</a>`:''}`,0,n);
 /* 2 How you're going */
 const TP=incOn()?P:full,nI=TP.filter(s=>s.inc).length,T=TP.map(s=>s.score),l3=T.slice(-3),p3=T.slice(-6,-3);let trend;
 if(T.length<2)trend=`<p>${T.length?'One complete shoot of this round so far.':'No complete shoots of this round yet.'} Shoot it again to see a trend.</p>`;
 else{const a=avg(l3),b=p3.length?avg(p3):T[0],d=a-b,sp=Math.max(2,Math.abs(b)*0.005);trend=`<p><b>${CB()?(d>sp?'▲ ':d<-sp?'▼ ':'● '):''}${d>sp?'Going up.':d<-sp?'Dipping.':'Steady.'}</b> Your last ${pl(l3.length,'shoot')} averaged <b>${Math.round(a)}</b>, ${p3.length?`against ${Math.round(b)} for the ${pl(p3.length,'shoot')} before`:`against ${b} on your first`}.${nI?` <span class="small muted">Includes ${pl(nI,'incomplete round')}, because Include incomplete is ticked.</span>`:''}</p>`}
 h+=card('c-trend',"How you're going",'',trend+(junior()?'':(()=>{const tp=tipFor(P,x);return`<div class="list-item" id="tip" data-set="${tp.set}" data-kind="${tp.kind||''}"><span class="kicker" style="font-size:11px">Tip</span><div>${tp.txt}</div></div>`})()),0,n);
 /* 3D: plain-sentence cards from tapped target scores */
 if(x.aba&&window.aba3DCards)h+=aba3DCards(P,x);
 /* 3 PB */
 const best=full.slice().sort((a,b)=>b.score-a.score||(a.date<b.date?-1:1)),pb=best[0];
 const allPB={};L.filter(s=>!s.inc).forEach(s=>{if(!allPB[s.round]||s.score>allPB[s.round].score)allPB[s.round]=s});
 h+=card('c-pb','Personal best · '+E(ST.r),'',`${pb?`<div class="row" style="align-items:flex-end"><b style="font-size:34px;color:var(--gold)" id="pbscore">${pb.score}</b><span class="small muted" style="text-align:right">${fmt(pb.date)}<br>${E(pb.event)}</span></div>
  <h3 style="margin:10px 0 4px">Your top ${Math.min(5,best.length)}</h3>${best.slice(0,5).map((s,i)=>`<div class="list-item row"><span>${i+1}. <b>${s.score}</b></span><span class="small muted">${fmt(s.date)} · ${SRC[s.src]}</span></div>`).join('')}`:'<p>No complete shoot of this round yet, so no PB.</p>'}
  <details style="margin-top:8px" id="allpbs"><summary class="small"><b>All my PBs</b> · every round</summary>${Object.values(allPB).sort((a,b)=>a.round<b.round?-1:1).map(s=>`<div class="list-item row"><span>${E(s.round)}</span><span><b>${s.score}</b> <span class="small muted">${fmt(s.date)}</span></span></div>`).join('')}</details>
  <p class="small muted" style="margin:6px 0 0" id="pbnote">Complete rounds only. Incomplete rounds never count as a PB${incOn()?', so ticking Include incomplete doesn\'t change this card':''}.</p>`,0,n);
 /* 4 Score history */
 const H=P,run=H.map((s,i)=>{const w=H.slice(Math.max(0,i-2),i+1).filter(y=>!y.inc).map(y=>y.score);return w.length?Math.round(avg(w)):null}),pbl=H.map((s,i)=>{const v=H.slice(0,i+1).filter(y=>!y.inc).map(y=>y.score);return v.length?Math.max(...v):null});
 h+=card('c-hist','Score history','',H.length>1?lineChart([{name:'Score',data:H.map(s=>s.score),c:'#3b82f6'},{name:'Average of your last 3',data:run,c:'#ffc629',dash:1},{name:'PB',data:pbl,c:CBC('#16a34a','#ffffff'),w:1.5,dash:1}],{labels:H.map(s=>s.date.slice(2,7))}):'<p class="small muted">Needs 2 or more shoots of this round.</p>',0,n);
 /* More detail */
 const open=!!S.statsMore;
 h+=`<button class="btn ghost full" id="moredet" aria-expanded="${open}" style="margin:6px 0 10px">${open?'Hide detail':'More detail'} <span class="small muted">· for you and your coach</span></button><div id="more" ${open?'':'hidden'}>${open?more(P,x,full,L):''}</div>`;
 app.innerHTML=h;bind()}
function more(P,x,full,L){const n=P.length,sums=x.ends.map(endSum);let h='';
 /* 3D rounds: end splits, spread, best ends and plots don't apply (targets, not ends); the 3D cards sit up front */
 if(x.aba){const yr=today().slice(0,4),Y=full.filter(s=>s.date.startsWith(yr)),F3=full.slice(0,3);
 h+=card('c-compare','Compare: you against you','',full.length?`<p id="cmp">${Y.length?`In ${yr} you averaged <b>${Math.round(avg(Y.map(s=>s.score)))}</b> over ${pl(Y.length,'complete shoot')}.`:`No complete shoots of this round in ${yr} yet.`} Your first ${F3.length==1?'shoot':F3.length+' shoots'} of this round ${F3.length==1?'was':'averaged'} <b>${Math.round(avg(F3.map(s=>s.score)))}</b> (${fmt(F3[0].date)}${F3.length>1?' to '+fmt(F3[F3.length-1].date):''}).</p>`:'<p class="small muted">No complete shoots of this round yet.</p>',0,n);
 return h}
 if(x.ends.length>=2){const k=Math.floor(sums.length/2),a=x.ends.slice(0,k),b=x.ends.slice(sums.length-k),sa=a.reduce((t,e)=>t+endSum(e),0),sb=b.reduce((t,e)=>t+endSum(e),0),odd=sums.length%2;
  const cnt=(L,v)=>L.flat().filter(q=>String(q).toUpperCase()==v).length,ks=x.field?['6','5','4','3','2','1','M']:(['X','10','9','8','7','6','5','4','3','2','1','M']).filter(q=>cnt(x.ends,q)>0||['X','10','9','8','M'].includes(q));const _u=(x.field?['6','5','4','3','2','1','M']:['X','10','9','8','7','6','5','4','3','2','1','M']).filter(q=>cnt(x.ends,q)>0||(x.field?['6','5','4','M']:['X','10','9','8','M']).includes(q));
  h+=card('c-half','First half vs second half',fmt(x.date)+' · '+x.score,`<div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat"><b id="h1">${sa}</b>first ${pl(k,'end')}</div><div class="stat"><b id="h2">${sb}</b>last ${pl(k,'end')}</div></div>
   <table class="small halftab" style="width:100%;text-align:center;margin-top:6px"><tr><th></th>${ks.map(q=>`<th>${q}</th>`).join('')}<th>Arrows</th></tr><tr><td>1st half</td>${ks.map(q=>`<td>${cnt(a,q)}</td>`).join('')}<td><b>${a.flat().length}</b></td></tr><tr><td>2nd half</td>${ks.map(q=>`<td>${cnt(b,q)}</td>`).join('')}<td><b>${b.flat().length}</b></td></tr></table>${odd?'<p class="small muted">Odd number of ends, so the middle end sits in neither half.</p>':''}`,0,n);
  const sd1=sd(sums),SDs=P.filter(s=>s.ends.length>1).map(s=>Math.round(sd(s.ends.map(endSum))*10)/10);
  h+=card('c-spread','Spread of your ends','',`<p>In this shoot your ends were usually within about <b>${r1(sd1)}</b> points of your average end (${r1(avg(sums))}). Smaller means steadier.</p>${SDs.length>1?lineChart([{name:'Spread per shoot',data:SDs,c:'#3b82f6'}],{labels:P.filter(s=>s.ends.length>1).map(s=>s.date.slice(2,7))}):''}`,0,n);
  const t=Math.max(1,Math.floor(sums.length/3)),e1=avg(sums.slice(0,t)),e2=avg(sums.slice(-t));
  h+=card('c-early','Early vs late ends',fmt(x.date)+' · '+x.score,`<div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat"><b id="e1">${r1(e1)}</b>first ${pl(t,'end')}, average</div><div class="stat"><b id="e2">${r1(e2)}</b>last ${pl(t,'end')}, average</div></div><p class="small" id="latetxt">${lateText(e1,e2,t)}</p>`,0,n)}
 const pot=bestEnds(P);
 h+=card('c-pot','Your best ends added up','',pot?`<p><b id="potv" style="font-size:24px">${pot.v}</b></p><p class="small">Your best score at each end over your last ${pl(pot.n,'shoot')} (${pot.from.join(', ')}), added up. It's never below those scores: it shows what you have already shot, end by end, on your good ends.</p><p class="small muted" id="potnote">Complete rounds only. Incomplete rounds never count here${incOn()?', so ticking Include incomplete doesn\'t change this card':''}.</p>`:'<p class="small muted">Needs 2 or more complete shoots of this round with end-by-end scores.</p>',0,n);
 const RT=P.filter(s=>s.rating!=null);
 h+=card('c-rating','Rating over time','',RT.length>1?lineChart([{name:'Rating',data:RT.map(s=>s.rating),c:'#3b82f6'}],{labels:RT.map(s=>s.date.slice(2,7))})+'<p class="small muted">A rating puts every round on the same scale (Archery Australia model), so different rounds can be compared.</p>':'<p class="small muted">Needs 2 or more official shoots of this round with a rating.</p>',0,n);
 const yr=today().slice(0,4),Y=full.filter(s=>s.date.startsWith(yr)),F3=full.slice(0,3);
 h+=card('c-compare','Compare: you against you','',full.length?`<p id="cmp">${Y.length?`In ${yr} you averaged <b>${Math.round(avg(Y.map(s=>s.score)))}</b> over ${pl(Y.length,'complete shoot')}.`:`No complete shoots of this round in ${yr} yet.`} Your first ${F3.length==1?'shoot':F3.length+' shoots'} of this round ${F3.length==1?'was':'averaged'} <b>${Math.round(avg(F3.map(s=>s.score)))}</b> (${fmt(F3[0].date)}${F3.length>1?' to '+fmt(F3[F3.length-1].date):''}).</p>`:'<p class="small muted">No complete shoots of this round yet.</p>',0,n);
 if(x.aba&&window.abaStats){const ss=P.filter(s=>s.s).map(s=>s.s),X=abaStats(ss);h+=card('abastats','ABA 3D','',`<div class="stats" style="grid-template-columns:1fr 1fr 1fr"><div class="stat"><b>${r1(X.avg)}</b>average per target</div><div class="stat"><b>${Math.round(100*X.first)}%</b>first-arrow hits</div><div class="stat"><b>${X.kill}</b>kills (A)</div></div><p class="small">Vital (B) ${X.vital} · Wound (C) ${X.wound} · No score ${X.miss}.</p>`,0,n)}
 if(x.s&&(x.s.pos||[]).some(e=>(e||[]).some(Boolean)))h+=plottedCard(x.s);
 if(isMe()&&window.coachReadFor)h+=coachReadFor(ST.r,P.filter(s=>s.ends.length),pot).replace('data-n="'+P.filter(s=>s.ends.length).length+'"','data-n="'+n+'"').replace(/(\d+) shoots?, the same ones as the rest of this page\./,(m,k)=>+k==n?m:`${k} of these ${plN(n,'shoot','shoots')} have end-by-end scores; the read uses those.`);
 /* AA classification lives on the Ranks tab only */
 h+=`<button class="btn full" id="goan2" style="margin:4px 0 10px;background:linear-gradient(90deg,#ffc629,#ffdd73);color:#111">📊 Analytics for ${E(ST.r)} · trends across shoots</button>`;
 return h}
function bind(){const r=$('#srd');if(r)r.onchange=()=>{ST.r=r.value;ST.id=null;render()};const s=$('#ssh');if(s)s.onchange=()=>{ST.id=s.value;const y=scrollY;render();scrollTo(0,y)};
 const i=$('#incinc');if(i)i.onchange=()=>{S.incInc=i.checked;save();ST.id=null;const y=scrollY;render();scrollTo(0,y)};
 const m=$('#moredet');if(m)m.onclick=()=>{S.statsMore=!S.statsMore;save();const y=scrollY;render();scrollTo(0,y)};
 const g=$('#goan2');if(g)g.onclick=()=>{const A=window._af=window._af||{range:'season',round:'all',bow:'all',kind:'all'};A.round=ST.r;A.range='all';nav('analytics')};
 app.querySelectorAll('[data-ev]').forEach(b=>b.onchange=()=>{S.evOver=S.evOver||{};S.evOver[b.dataset.ev]=b.checked?'open':'club';save();const y=scrollY;render();scrollTo(0,y)});
 if(typeof bindNotes=='function')bindNotes()}
stats=function(){render()};window.statsRender=render;
})();
