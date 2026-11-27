/* ABA 3D scoring (Australian Bowhunters Association).
   Ground truth: the ABA INTERCLUB Official Score Sheet (Western Australia ABA): 40 targets = a 3-arrow half ('3A', targets 1-20,
   up to 3 arrows, first hit scores) + a 1-arrow half ('1A', targets 1-20, first arrow only). Points: arrow 1 A/B/C 20/18/16,
   arrow 2 14/12/10, arrow 3 8/6/4. Matches ABA National Rules consolidated 1 Jan 2026 v2, National 3D Round rules 7-9 (round = 20 targets;
   3-arrow, 2-arrow and 1-arrow rounds; first arrow to score; grading score = a 3-arrow round + a 1-arrow round). Distances are unmarked. */
(function(){
const PTS=[[20,18,16],[14,12,10],[8,6,4]],ZN=['A','B','C'],ZL={A:'Kill',B:'Vital',C:'Wound'};
/* One ABA round in the picker: the Interclub sheet. First half = 3-arrow half (targets 1-20, first arrow to hit scores),
   second half = 1-arrow half (its own targets 1-20, one arrow, a miss scores 0). Checked against Nathe's sheet photo (3A columns on the left,
   then 1A; '3 Arrow Total' then '1 Arrow total') and ABA rule 7(a)1 ('a 3 arrow and one arrow round'). 20 points max per target, 800 per round. */
const IC='ABA Interclub 3D (40 targets: 3-arrow half, then 1-arrow half)',IC_OLD='ABA Interclub (3A + 1A, 40 targets)';
ROUNDS[IC]={ends:40,ape:1,face:'ABA 3D animal',max:800,aba:3,halves:[{n:3,t:20,l:'3A',name:'3-arrow half',desc:'up to 3 arrows a target: the first arrow to hit scores'},{n:1,t:20,l:'1A',name:'1-arrow half',desc:'one arrow a target: a miss scores 0'}],practice:true};
window.ABA_IC=IC;
/* old names stay defined so any old session still opens, but they are hidden from the round picker */
ROUNDS[IC_OLD]={...ROUNDS[IC],legacy:true};
[[3,'3 arrow'],[2,'2 arrow'],[1,'1 arrow']].forEach(([n,l])=>{ROUNDS['ABA 3D · '+l+' (20 targets)']={ends:20,ape:1,face:'ABA 3D animal',max:400,aba:n,halves:[{n,t:20,l:n+'A',name:n+'-arrow round',desc:n>1?'up to '+n+' arrows a target: the first arrow to hit scores':'one arrow a target: a miss scores 0'}],practice:true,legacy:true}});
const hitCode=a=>a&&a.k?a.k+(a.z||''):'M';window.abaHitCode=hitCode;
function migrate(){let ch=0;(S.sessions||[]).forEach(x=>{if(x.round==IC_OLD){x.round=IC;ch=1}/* 25 Nov 2026 fix: the paper-sheet note text went with the seed in #72; a sheet already on a phone keeps its own note (was a ReferenceError on that phone) */});if(S.lastRound==IC_OLD){S.lastRound=IC;ch=1}if(ch)save()}
const isAba=r=>!!(ROUNDS[r]&&ROUNDS[r].aba);window.isAbaRound=isAba;
const escA=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* which half a round-target index (0-based) is in: {h, n arrows, tn target number in half, start index} */
/* club rule (start-of-round tick): the first half is shot 1-arrow too, so both halves are 1-arrow */
const CLUB={n:1,t:20,l:'1A',name:'1-arrow half (club rule)',desc:'one arrow a target: a miss scores 0'};
function halvesOf(R,x){x=x||(typeof cur!='undefined'?cur:null);if(x&&x.hv)return x.hv;return x&&x.abaClub&&R.halves.length>1?[{...CLUB,t:R.halves[0].t},...R.halves.slice(1)]:R.halves}
/* 10-target blocks of a half: [{q, from, to}] (a half of 15 = 1-10, 11-15) */
const blocks=t=>[...Array(Math.ceil(t/10))].map((_,q)=>({q,from:q*10+1,to:Math.min(t,q*10+10)}));window.abaBlocks=blocks;
window.abaHalvesOf=halvesOf;
function where(R,i,x){const HS=halvesOf(R,x);let s=0;for(let h=0;h<HS.length;h++){const H=HS[h];if(i<s+H.t)return{h,H,n:H.n,tn:i-s+1,s};s+=H.t}const H=HS[HS.length-1];return{h:HS.length-1,H,n:H.n,tn:H.t,s:s-H.t}}
window.abaWhere=where;
const abaPts=(n,k,z)=>k>=1&&k<=n&&ZN.includes(z)?PTS[k-1][ZN.indexOf(z)]:null;window.abaPts=abaPts;
const st=()=>{cur.aba=cur.aba||[];return cur.aba};
function targetIdx(){return cur.ends.length&&cur.ends[cur.ends.length-1].length==0?cur.ends.length-1:cur.ends.length}
/* record zone A/B/C or 'M' for the current target: first arrow to score; arrows 2/3 only after a miss, and only in a 3-arrow half */
function abaHit(z){const R=ROUNDS[cur.round],A=st(),i=targetIdx();if(i>=R.ends||cur.finished)return;const n=where(R,i,cur).n;
 if(!cur.ends[i])cur.ends[i]=[];const t=A[i]=A[i]||{m:0};
 if(z=='M'){t.m++;if(t.m>=n){cur.ends[i]=['M'];t.k=0;t.z=''}}
 else{const k=t.m+1,p=abaPts(n,k,z);if(p==null)return;cur.ends[i]=[String(p)];t.k=k;t.z=z}
 if(cur.ends[i].length&&cur.ends.length<R.ends&&cur.ends.length==i+1)cur.ends.push([]);
 save();abaScore(R)}
window.abaHit=abaHit;
function abaUndo(){const A=st();let i=targetIdx();const t=A[i];
 if(t&&t.m&&!(cur.ends[i]||[]).length){t.m--}
 else{if(cur.ends[i]&&!cur.ends[i].length)cur.ends.pop();i=cur.ends.length-1;if(i<0){cur.ends=[[]];save();return abaScore(ROUNDS[cur.round])}cur.ends[i]=[];if(A[i]){A[i].m=0;delete A[i].k;delete A[i].z}}
 if(!cur.ends.length)cur.ends=[[]];cur.finished=false;save();abaScore(ROUNDS[cur.round])}
function abaStats(ss){const T=[];ss.forEach(s=>s.ends.forEach((e,i)=>{if(!e.length)return;const a=(s.aba||[])[i]||{};T.push({v:val(e[0]),k:a.k||0,z:a.z||''})}));
 const n=T.length,sum=T.reduce((t,x)=>t+x.v,0);return{n,sum,avg:n?sum/n:null,first:n?T.filter(x=>x.k==1).length/n:null,firstN:T.filter(x=>x.k==1).length,kill:T.filter(x=>x.z=='A').length,vital:T.filter(x=>x.z=='B').length,wound:T.filter(x=>x.z=='C').length,miss:T.filter(x=>!x.k).length}}
window.abaStats=abaStats;
/* ---------- 3D analysis for Stats (ABA rounds and custom 3D practice rounds). Only tapped (or paper-typed) target scores: no plotting, no miss direction. ---------- */
const pc=(a,b)=>b?Math.round(100*a/b):0,plA=(n,s,p)=>window.plN?plN(n,s,p):n+' '+(n==1?s:p),av1=v=>v.length?Math.round(10*v.reduce((a,b)=>a+b,0)/v.length)/10:null;
function aba3DFacts(s){const R=ROUNDS[s.round],HS=halves(s),A=s.aba||[],per=HS.map((o,h)=>{const T=o.v.map((v,j)=>v==null?null:{v,a:A[o.i0+j]||{}}).filter(Boolean);
  return{h,n:o.H.n,shot:T.length,a2:T.filter(t=>t.a.k==2).length,a3:T.filter(t=>t.a.k==3).length,miss:T.filter(t=>!t.v).length,blocks:abaBlocks(o.H.t).map(b=>({b,avg:av1(o.v.slice(b.from-1,b.to).filter(x=>x!=null)),n:o.v.slice(b.from-1,b.to).filter(x=>x!=null).length})),avg:av1(T.map(t=>t.v))}});
 const all=s.ends.map((e,i)=>e&&e.length?{v:val(e[0]),a:A[i]||{}}:null).filter(Boolean),first=all.filter(t=>t.a.k==1);
 return{n:all.length,first:first.length,k20:first.filter(t=>t.v==20).length,k18:first.filter(t=>t.v==18).length,k16:first.filter(t=>t.v==16).length,per}}
window.aba3DFacts=aba3DFacts;
/* one plain sentence on the blocks: fading late, starting slow, or steady (1 point a target is the threshold) */
function blockSentence(F){const P=F.per.filter(p=>p.blocks.filter(b=>b.n).length>=2);if(!P.length)return{kind:'none',txt:'Shoot at least 11 targets in a half to compare its blocks.'};
 const d=P.map(p=>{const B=p.blocks.filter(b=>b.n);return B[B.length-1].avg-B[0].avg}),fade=d.filter(x=>x<=-1).length,slow=d.filter(x=>x>=1).length;
 const part=P.map((p,i)=>{const B=p.blocks.filter(b=>b.n);return`${p.h?'second':'first'} half ${B[0].b.from}-${B[0].b.to}: ${B[0].avg}, ${B[B.length-1].b.from}-${B[B.length-1].b.to}: ${B[B.length-1].avg}`}).join('; ');
 if(fade&&!slow)return{kind:'fade',txt:`You fade late: your later targets average less than your early ones (${part} points a target).`};
 if(slow&&!fade)return{kind:'slow',txt:`You start slow: your early targets average less than your later ones (${part} points a target).`};
 if(slow&&fade)return{kind:'mixed',txt:`Mixed: one half fades late and the other starts slow (${part} points a target).`};
 return{kind:'steady',txt:`Steady: your blocks are within 1 point a target of each other (${part}).`}}
window.aba3DBlocks=blockSentence;
function aba3DCards(pool,sel){/* pool: Stats shoots of this round that have target data; sel: the picked shoot */
 const ss=pool.filter(x=>x.s&&x.s.aba&&x.ends.length).map(x=>x.s);if(!sel||!sel.s||!sel.ends.length)return'';const F=aba3DFacts(sel.s),T=ss.map(aba3DFacts),tn=T.reduce((t,f)=>t+f.n,0),tf=T.reduce((t,f)=>t+f.first,0);
 const card=(id,t,b)=>`<div class="card" id="${id}"><span class="kicker">3D</span><h3 style="margin:2px 0 6px">${t}</h3>${b}</div>`;
 let h=card('c3d-first','First arrow and kills',`<p id="c3dfirst">In this round <b>${F.first} of ${plA(F.n,'target','targets')}</b> (${pc(F.first,F.n)}%) scored with your first arrow.${ss.length>1?` Across your ${ss.length} rounds of this: ${pc(tf,tn)}%.`:''}</p>
  <p id="c3dkill">Of those first-arrow hits, <b>${F.k20}</b> ${F.k20==1?'was a 20':'were 20s'} (kill), <b>${F.k18}</b> ${F.k18==1?'an 18':'18s'} and <b>${F.k16}</b> ${F.k16==1?'a 16':'16s'}${F.first?` (${pc(F.k20,F.first)}% kills)`:''}.</p>`);
 const p0=F.per[0],p1=F.per[1];
 h+=card('c3d-arrows','Arrows needed',`<p id="c3darrows">${p0.n==3?`First half: <b>${p0.a2}</b> ${p0.a2==1?'target needed':'targets needed'} arrow 2, <b>${p0.a3}</b> needed arrow 3, and <b>${p0.miss}</b> ${p0.miss==1?'was':'were'} missed with all three.`:`First half (1 arrow, club rule): <b>${p0.miss}</b> ${p0.miss==1?'target was':'targets were'} missed.`}${p1?` Second half (1 arrow): <b>${p1.miss}</b> ${p1.miss==1?'target was':'targets were'} missed (0).`:''}</p>`);
 const bs=blockSentence(F);
 h+=card('c3d-blocks','Halves and blocks',`<p id="c3dhalves">${p1?`First half: <b>${p0.avg??'–'}</b> a target. Second half: <b>${p1.avg??'–'}</b> a target.${p0.n==3?' The second half is 1 arrow only, so it usually scores lower.':''}`:`Average <b>${p0.avg??'–'}</b> a target.`}</p>
  <p class="small muted" style="margin:0 0 6px">${F.per.map(p=>`${p.h?'Second':'First'} half · ${p.blocks.map(b=>`${b.b.from}-${b.b.to}: ${b.avg??'–'}`).join(' · ')}`).join('<br>')}</p><p id="c3dsentence" data-kind="${bs.kind}"><b>${bs.txt}</b></p>`);
 return h}
window.aba3DCards=aba3DCards;
/* half totals: per half, scores by target (null = not shot), running total within the half, subtotals 1-10 and 11-20 */
function halves(s){const R=ROUNDS[s.round];let i0=0;return halvesOf(R,s).map(H=>{const v=[...Array(H.t)].map((_,j)=>{const e=s.ends[i0+j];return e&&e.length?val(e[0]):null});/* running total restarts at the first target of each 10-target block and ends on that block's subtotal (as on the 1A columns of the paper sheet) */let run=0;const rn=v.map((x,j)=>{if(j%10==0)run=0;return x==null?null:(run+=x)});
 const sub=blocks(H.t).map(b=>v.slice(b.from-1,b.to).reduce((t,x)=>t+(x||0),0)),o={H,v,rn,sub,tot:v.reduce((t,x)=>t+(x||0),0),i0};i0+=H.t;return o})}
window.abaHalves=halves;
/* The sheet grid, laid out like the paper ABA Interclub sheet: 4 columns (3A 1-10, 3A 11-20, 1A 1-10, 1A 11-20). Each row = one target:
   its score next to the running total for that half. Subtotal per 10 targets, then each half's total, then the round total.
   Both halves are numbered 1-20, as on the paper. */
const halfTag=(o,HS)=>HS.length>1?(o===HS[0]?'First half':'Second half')+' · ':'';
/* halves are called First half / Second half everywhere; 1A, 2B etc. are only ever score codes */
const hName=(h,n)=>n>1?(h==0?'First half':'Second half'):'Round';window.abaHalfName=hName;
function grid(s,live,nxArg){const HS=halves(s),A=s.aba||[],nx=nxArg!=null?nxArg:live?targetIdx():-1;
 const col=(o,q,h)=>`<table class="aba-p" data-col="${h}-${q}"><tr><th colspan="3" style="line-height:1.15"><span style="font-size:9px;display:block;white-space:nowrap">${hName(h,HS.length)}</span><span style="font-size:12px"> ${q*10+1}-${Math.min(o.H.t,q*10+10)}</span></th></tr>${[...Array(Math.min(10,o.H.t-q*10))].map((_,j)=>{const t=q*10+j,a=A[o.i0+t]||{},v=o.v[t],on=o.i0+t==nx;
  return`<tr${on?' class="aba-now"':''}><td class="aba-t">${t+1}</td><td class="aba-v" data-hit="${v==null?'':v===0?'M':a.k?hitCode(a):''}" title="${v==null?'':v===0?'no score':hitCode(a)}">${v==null?'':v}</td><td class="aba-r">${o.rn[t]==null?'':o.rn[t]}</td></tr>`}).join('')}<tr class="aba-sub"><td colspan="2" class="small">${q*10+1}-${Math.min(o.H.t,q*10+10)}</td><td><b data-sub="${h}-${q}">${o.sub[q]}</b></td></tr></table>`;
 return`<div class="aba-cols4">${HS.map((o,h)=>blocks(o.H.t).map(b=>col(o,b.q,h)).join('')).join('')}</div>
 <div class="aba-tots">${HS.map((o,h)=>`<div class="list-item row"><span>${halfTag(o,HS)}${o.H.n==3?'3 Arrow':o.H.n==1?'1 Arrow':o.H.n+' Arrow'} Total <span class="small muted">(${o.sub.join(' + ')})</span></span><b id="abah${h}">${o.tot}</b></div>`).join('')}
 ${HS.length>1?`<div class="list-item row" style="font-size:18px"><span><b>ROUND TOTAL</b></span><b id="abaround">${HS.reduce((t,o)=>t+o.tot,0)}</b></div>`:''}</div>`}
window.abaGrid=grid;
/* Sheet heading (23 Oct 2026). 'ABA Interclub' is the scoring format, not the event. Tied to a calendar event: the event name is the title,
   'ABA Interclub scoring' the subtitle. 'Official Score Sheet' only for official shoots: the typed paper Interclub sheet, Peel State Titles
   cards, or an event the archer marked official. Anything else says it isn't official. */
const evOf=s=>window.calEvOf?window.calEvOf(s):null;window.abaEvOf=evOf;
const isOfficial=s=>{const e=evOf(s);return e?!!e.official:!!(s.src=='paper'||s.pg)};
function sheetHead(s){const R=ROUNDS[s.round]||{},e=evOf(s);
 if(R.custom&&!e)return`<b>${escA(s.round)}</b><div class="small" style="color:#ff6b6b">3D practice score sheet · ABA scoring</div>`;
 const off=isOfficial(s),title=e?e.name:off?'ABA INTERCLUB':'ABA 3D score sheet',sub=e?(R.custom?escA(s.round)+' · ABA scoring':'ABA Interclub scoring'):off?'':'ABA Interclub scoring';
 return`<b id="abatitle">${escA(title)}</b>${sub?`<div class="small muted" id="abasub">${sub}</div>`:''}<div class="small" id="abaoff" style="color:${off?'#ff6b6b':'inherit'}">${off?'Official Score Sheet':e&&e.fun?'Fun shoot - not official':'Not an official score sheet'}</div>`}
window.abaSheetHead=sheetHead;
function paper(s,noShare){const hd=s.abaHead||{},HS=halves(s);
 return`<div class="card aba-sheet" id="abapaper"><div style="text-align:center">${sheetHead(s)}</div>
 <div class="aba-hd"><div><span class="small muted">Name</span><b>${escA(hd.name||S.profile||'')}</b></div><div><span class="small muted">Date</span><b>${escA(s.date)}</b></div><div><span class="small muted">ABA #</span>${escA(hd.no||'')}</div><div><span class="small muted">Grade</span>${escA(hd.grade||'')}</div><div><span class="small muted">Division</span>${escA(hd.div||'')}</div><div><span class="small muted">Target</span>${escA(hd.target||'')}</div></div>
 <p class="small muted" style="margin:6px 0 0" id="abahow">${HS.map((o,h)=>`${hName(h,HS.length)}: ${o.H.desc}`).join('. ')}. ${HS.every(o=>o.H.t==HS[0].H.t)?(HS.length>1?'Each half is targets 1-':'Targets 1-')+HS[0].H.t:HS.map((o,h)=>hName(h,HS.length)+' targets 1-'+o.H.t).join(', ')}. Points: 1A 20, 1B 18, 1C 16 · 2A 14, 2B 12, 2C 10 · 3A 8, 3B 6, 3C 4.</p>
 <table class="aba-pts"><tr><th>Arrow</th><th>A</th><th>B</th><th>C</th></tr>${PTS.map((r,k)=>`<tr><th>${k+1}</th>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</table>
 ${grid(s,false)}
 ${s.abaNote?`<p class="small muted">${escA(s.abaNote)}</p>`:''}${s.finished&&!noShare&&window.shareSheet?'<button class="btn full" id="shsheet" style="margin-top:8px">Share score sheet</button>':''}${s.finished&&!noShare&&window.shareLink?'<button class="btn ghost full" id="shlink" style="margin-top:8px">Copy link</button>':''}</div>`}
window.abaPaper=paper;
/* Scorer: one target at a time. Arrow 1's buttons (20/18/16/Miss); a score records the target and moves straight on.
   Only a Miss in a 3-arrow half brings up arrow 2 (14/12/10/Miss), then arrow 3 (8/6/4/Miss); three misses = 0 and move on.
   In a 1-arrow half: one tap (20/18/16 or Miss = 0), then the next target. */
function abaScore(R){const A=st(),i=targetIdx(),fin=i>=R.ends||cur.finished,W=fin?null:where(R,i,cur),n=W?W.n:1,t=A[i]||{m:0},k=(t.m||0)+1,tot=total(cur),doneT=cur.ends.filter(e=>e.length).length,maxP=tot+(R.ends-doneT)*20,HS=halves(cur);
 if(fin&&!cur.finished){cur.finished=true;save()}const S3=abaStats([cur]);if(window._abaSid!==cur.id){window._abaSid=cur.id;window._abaView=cur.finished?'sheet':'score'}
 const hd=cur.abaHead=cur.abaHead||{},fresh=!doneT&&!fin;
 const li=[...cur.ends.keys()].filter(j=>cur.ends[j].length).pop(),LW=li!=null?where(R,li,cur):null,LH=LW?HS[LW.h]:null;
 const last=li==null?'':`<div class="list-item" id="abalast" style="margin:4px 0">Last: ${hName(LW.h,HS.length).toLowerCase()} target ${LW.tn} scored <b>${val(cur.ends[li][0])}</b>${(A[li]||{}).k?' ('+hitCode(A[li])+')':' (no score)'} · running total for targets ${(b=>b.from+'-'+b.to)(blocks(LW.H.t)[Math.floor((LW.tn-1)/10)])} <b>${LH.rn[LW.tn-1]}</b></div>`;
 const EV=evOf(cur),top=`<div class="card" id="abacard"><span class="kicker">${EV?escA(EV.name)+' · ABA scoring':R.custom?escA(cur.round)+' · 3D':'ABA 3D · Interclub scoring'}</span>
 <div class="row" style="justify-content:space-between;align-items:flex-end;margin:6px 0"><div><div class="small muted" id="abahalf">${fin?'Round':(W.n>1?'3-arrow half':'1-arrow half')+(cur.abaClub&&W.h==0?' (club rule)':'')+' · target '+(i+1)+' of '+R.ends+' in the round'}</div><b style="font-size:30px" id="abatg">${fin?'Done':`<span style="font-size:17px">${hName(W.h,HS.length)} · </span>Target ${W.tn} of ${W.H.t}`}</b></div><div style="text-align:right"><div class="small muted">Total</div><b style="font-size:30px;color:var(--gold)" id="abatot">${tot}</b>${fin?'':`<div class="small muted" id="abamax">max possible ${maxP}</div>`}</div></div>
 ${fresh?`<label id="abaclubl" class="small muted" style="display:flex;align-items:center;gap:6px;margin:0 0 4px;padding:0;font-size:12px;line-height:1.3;font-weight:400;min-height:0;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"><input type="checkbox" id="abaclub" ${cur.abaClub?'checked':''} style="width:16px;height:16px;min-height:0;min-width:0;margin:0;padding:0;flex:none;accent-color:#ffd84d"> Club rule: first half 1 arrow</label>`:cur.abaClub?'<div class="small muted" id="abaclubon" style="font-size:12px;margin:0 0 4px">Club rule on: both halves 1 arrow.</div>':''}
 ${fin?'':`<div class="list-item" id="abarule" style="margin:4px 0;border-left:4px solid ${W.n>1?'#ffd84d':'#3b82f6'};padding-left:8px">${W.n>1?'Tap the score of your first arrow to hit. A hit moves straight to the next target. Only tap Miss if the arrow missed: then shoot the next arrow at the same target.':'One arrow a target. Tap its score, or Miss (scores 0). Then it moves to the next target.'}${HS.length>1&&W.h==1?` First half done: ${HS[0].tot}.`:''}</div>`}
  <div class="small muted" id="abahalves">${HS.map((o,h)=>`${hName(h,HS.length)}: <b>${o.tot}</b> (${blocks(o.H.t).map(b=>b.from+'-'+b.to+': '+o.sub[b.q]).join(', ')})`).join(' · ')}</div>
 <div class="zbar" style="justify-content:flex-start;margin:8px 0"><button class="zb${window._abaView=='score'?' on':''}" data-abv="score">Score</button><button class="zb${window._abaView=='sheet'?' on':''}" data-abv="sheet">Score sheet</button><button class="zb" id="abaexit" style="margin-left:auto">${fin?'✓ Close':'✕ Exit round'}</button></div>`;
 const pad=fin?`<p><b>Round complete: ${tot}</b> · avg ${S3.avg!=null?S3.avg.toFixed(1):'–'} per target · first-arrow hits ${S3.firstN}/${S3.n} · kills (A) ${S3.kill}</p><button class="btn full" id="abadone">Done</button>`:`
 <p style="margin:4px 0" id="abaarrow"><b>Arrow ${k}</b>${n>1?(k==1?'':` · arrow ${k-1} missed`):''}</p>
 <div class="aba-pad" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${ZN.map(z=>`<button class="aba-z" data-z="${z}" style="min-height:64px;font-size:22px;font-weight:800;border-radius:12px;border:0;background:${z=='A'?'#ffd84d':z=='B'?'#3b82f6':'#334155'};color:${z=='A'?'#111':'#fff'}">${abaPts(n,k,z)}<div style="font-size:11px;font-weight:700">${ZL[z]} ${z}</div></button>`).join('')}<button class="aba-z" data-z="M" style="min-height:64px;font-size:18px;font-weight:800;border-radius:12px;border:0;background:#64748b;color:#fff">Miss<div style="font-size:11px;font-weight:700">${k<n?'arrow '+(k+1):'0 · next'}</div></button></div>
 ${last}`;
 const head=`<details style="margin-top:8px"><summary class="small">Sheet details (name, ABA #, grade, division, target)</summary>${[['name','Name',S.profile||''],['no','ABA #',''],['grade','Grade',''],['div','Division',''],['target','Target','']].map(([k2,l,ph])=>`<label class="small" for="abh-${k2}">${l}</label><input id="abh-${k2}" data-abh="${k2}" value="${escA(hd[k2]||'')}" placeholder="${escA(ph)}">`).join('')}</details>`;
 /* no distance input: ABA 3D distances are unmarked and Nathe doesn't want them estimated. Old sessions may still carry a .d value; it is ignored. */
 app.innerHTML=top+(window._abaView=='sheet'?'</div>'+paper(cur):pad+`<div style="display:flex;gap:8px;margin-top:10px"><button class="btn ghost" id="abaundo" ${doneT||t.m?'':'disabled'}>↶ Undo</button>${fin?'':`<button class="btn ghost" id="abafin" ${doneT?'':'disabled title="Score at least one target first" style="opacity:.45"'}>Finish early</button>`}</div>${!fin&&!doneT?'<p class="small muted" id="abafinnote" style="margin:4px 0 0;font-size:12px">Finish early works once a target is scored. To leave now, tap Exit round.</p>':''}<div></div></div><div class="card" id="abalive"><span class="kicker">Your sheet so far</span>${grid(cur,true)}</div><div class="card">${head}</div>`)+evCard(cur)+
 `<p class="small muted" style="margin:0 4px 12px">ABA National Rules (1 Jan 2026), rule 13: 1A = 20, 1B = 18, 1C = 16, 2A = 14, 2B = 12, 2C = 10, 3A = 8, 3B = 6, 3C = 4. The first arrow to score counts; no more arrows once one scores. Up to 20 a target.</p>`;
 app.querySelectorAll('[data-abv]').forEach(b=>b.onclick=()=>{window._abaView=b.dataset.abv;abaScore(R)});evBind(cur,()=>abaScore(R));
 app.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>abaHit(b.dataset.z));
 app.querySelectorAll('[data-abh]').forEach(x=>x.onchange=()=>{hd[x.dataset.abh]=x.value.trim();if(x.dataset.abh=='no')hd.noTyped=!!hd.no;save()});
 /* the club rule is set per round (off by default) and can be changed until target 1 is scored; changing it restarts target 1's arrows */
 const cb=$('#abaclub');if(cb)cb.onchange=()=>{if(cur.ends.some(e=>e.length))return;cur.abaClub=cb.checked;if(!cb.checked)delete cur.abaClub;const A0=st();if(A0[0]){A0[0].m=0;delete A0[0].k;delete A0[0].z}save();abaScore(R)};
 const u=$('#abaundo');if(u)u.onclick=abaUndo;const f=$('#abafin');if(f)f.onclick=()=>{if(!cur.ends.some(e=>e.length))return;if(!cur.ends[cur.ends.length-1].length)cur.ends.pop();cur.finished=true;save();abaScore(R)};
 const x=$('#abaexit');if(x)x.onclick=()=>{if(cur.finished){cur=null;sv='sheet';window._abaView='score';save();score()}else leaveScoring()};
 const shb=$('#shsheet');if(shb)shb.onclick=()=>shareSheet(cur);
 const shl=$('#shlink');if(shl)shl.onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(shareLink(cur));shl.textContent='Copied ✓'};
 const d=$('#abadone');if(d)d.onclick=()=>{cur=null;sv='sheet';window._abaView='score';score()}}
window.abaScore=abaScore;
/* Event card: tie this score to an Archery Calendar event on its date (list from archerycalendars.com, Australia). Tying it also sends the
   score to My events once linked. Stored under scoretool.cal.<tester>.events only; the score itself is not changed. */
let EVL=null,EVO=false;
function evCard(s){if(!window.calSetEv||typeof TESTER=='undefined'||!TESTER)return'';const e=evOf(s);
 const list=EVO?(EVL==null?'<p class="small muted">Loading events…</p>':EVL.err?`<p class="small">${EVL.err}</p>`:(EVL.on[s.date]||[]).length?(EVL.on[s.date]).map(x=>`<button class="btn ghost full" style="margin:4px 0;text-align:left" data-ev="${escA(x.id)}">${escA(x.name)}<div class="small muted">${escA([x.org,x.state,x.discipline].filter(Boolean).join(' · '))}</div></button>`).join(''):`<p class="small muted">No Australian events on Archery Calendar on ${escA(s.date)}.</p>`):'';
 return`<div class="card" id="abaev"><span class="kicker">Event</span>${e?`<p style="margin:2px 0"><b>${escA(e.name)}</b> · ${escA(e.date||s.date)}</p><p class="small" style="margin:2px 0 6px">${e.official?'Official shoot':'Fun shoot - not official'}</p>
 <label class="small" style="display:flex;align-items:center;gap:6px;margin:0 0 6px"><input type="checkbox" id="abaevoff" ${e.official?'checked':''} style="width:18px;height:18px;min-height:0;margin:0;flex:none"> Official or sanctioned shoot</label>`:'<p class="small" style="margin:2px 0 6px">Not tied to an event. Pick the shoot this was, and the sheet is headed with its name. It is also added to My events on Archery Calendar once linked.</p>'}
 <div class="row" style="gap:6px;justify-content:flex-start"><button class="btn ghost" id="abaevpick">${e?'Change event':'Pick event'}</button>${e?'<button class="btn ghost" id="abaevnone">Not at an event</button>':''}</div>${list}</div>`}
async function evLoad(){try{const r=await fetch('https://archerycalendars.com/data/events.json',{cache:'no-cache'});const j=await r.json(),A=Array.isArray(j)?j:(j.events||[]),on={};
  A.filter(x=>x&&x.start_date&&(x.country_code=='AUS'||x.country=='Australia')).forEach(x=>{const a=new Date(x.start_date+'T00:00'),b=new Date((x.end_date||x.start_date)+'T00:00');if(!(b>=a)||b-a>40*864e5)return;
   for(let d=new Date(a);d<=b;d.setDate(d.getDate()+1)){const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');(on[k]=on[k]||[]).push(x)}});
  Object.values(on).forEach(L=>L.sort((p,q)=>(q.discipline=='3D')-(p.discipline=='3D')||(q.state=='WA')-(p.state=='WA')||String(p.name).localeCompare(q.name)));EVL={on}}
 catch(e){EVL={err:'Couldn’t load events. Check the connection and try again.'}}}
function evBind(s,again){const p=$('#abaevpick');if(p)p.onclick=async()=>{EVO=!EVO;again();if(EVO&&(!EVL||EVL.err)){EVL=null;again();await evLoad();again()}};
 const n=$('#abaevnone');if(n)n.onclick=()=>{window.calSetEv(s.id,null);EVO=false;again()};
 const o=$('#abaevoff');if(o)o.onchange=()=>{const e=evOf(s);if(!e)return;e.official=o.checked?1:0;e.fun=o.checked?0:1;window.calSetEv(s.id,e);again()};
 app.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{const x=((EVL&&EVL.on[s.date])||[]).find(y=>y.id==b.dataset.ev);if(!x)return;
  window.calSetEv(s.id,{id:x.id,name:String(x.name).replace(/\s+–\s+/g,' - '),club:x.org||x.host||'',date:s.date,fun:1,send:1});EVO=false;again()})}
/* 25 Nov 2026: the old one-off seed of one archer's paper sheet is removed (it stays on the phone it was saved to). No-op kept for callers. */
function seed(){migrate()}
window.abaSeed=seed;window.abaMigrate=migrate;try{if(typeof S!='undefined'&&S&&S.sessions)migrate()}catch(e){}
/* Stats: ABA 3D card */
const _st=stats;stats=function(){seed();_st.apply(this,arguments);const ss=done().filter(s=>s.round==window._r||(!window._r&&false));if(!isAba(window._r)||!ss.length||$('#abastats'))return;const X=abaStats(ss),last=ss[ss.length-1],L=abaStats([last]),LH=halves(last);
 app.insertAdjacentHTML('afterbegin',`<div class="card" id="abastats"><span class="kicker">ABA 3D</span><h3 style="margin:2px 0 6px">${ss.length} round${ss.length>1?'s':''} · ${plN(X.n,'target','targets')}</h3>
 <div class="stats" style="grid-template-columns:1fr 1fr 1fr"><div class="stat"><b>${X.avg.toFixed(1)}</b>avg per target</div><div class="stat"><b>${Math.round(100*X.first)}%</b>first-arrow hits</div><div class="stat"><b>${X.kill}</b>kills (A)</div></div>
 <p class="small" style="margin:6px 0 0">Vital (B) ${X.vital} · Wound (C) ${X.wound} · No score ${X.miss}. Last: <b>${total(last)}</b> on ${escA(last.date)}${LH.length>1?` (${LH.map((o,h)=>hName(h,LH.length).toLowerCase()+' '+o.tot).join(' + ')}${last.abaClub?', club rule: both halves 1-arrow':''})`:''}${last.src=='paper'?' · from a paper sheet':''}.</p></div>`)};
const _sc=score;score=function(){if(!cur)seed();return _sc.apply(this,arguments)};
})();
