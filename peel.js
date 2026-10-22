/* ABA State Titles at Peel: a one-phone group score card (20 Oct 2026, from Nathe). Nathe scores his whole group on his phone
   because they don't have the app. Several days, each with its own card and its own group. Scoring is the ABA Interclub 3D round
   from aba.js, unchanged: first half up to 3 arrows a target (arrows 2 and 3 only after a miss), second half 1 arrow, a running
   total that restarts each 10-target block, and the small club-rule tick (first half 1 arrow). Fully offline: stored on this
   phone only (S.peel), nothing is posted to the relay, and nothing goes into the archer's own rounds or stats. */
(function(){
const PG_NAME='ABA State Titles at Peel',PG_DEF=4,PG_MAX=6;
const pgEsc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pgEv=()=>{S.peel=S.peel||{name:PG_NAME,days:[]};return S.peel};
const pgToday=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const pgKey=n=>String(n||'').trim().toLowerCase().replace(/\s+/g,' ');
const pgR=()=>ROUNDS[window.ABA_IC];
const pgTot=s=>s.ends.reduce((t,e)=>t+(e&&e.length?val(e[0]):0),0);
const pgN=s=>s.ends.filter(e=>e&&e.length).length;
const pgIdx=s=>s.ends.length&&s.ends[s.ends.length-1].length==0?s.ends.length-1:s.ends.length;
const pgDone=s=>s.finished||pgN(s)>=pgR().ends;
function pgSess(nm,date,club,k){const s={id:'pg'+Date.now().toString(36)+k,date,round:window.ABA_IC,ends:[[]],aba:[],pos:[],note:'',abaHead:{name:nm},pg:1};if(club)s.abaClub=true;return s}
/* a new day: names typed by Nathe; blank slots are dropped */
function pgNewDay(names,club,date){const E=pgEv(),nm=(names||[]).map(n=>String(n||'').trim().slice(0,40)).filter(Boolean).slice(0,PG_MAX);if(!nm.length)return null;
 date=date||pgToday();const d={id:'d'+Date.now().toString(36),date,a:nm.map((n,k)=>({nm:n,s:pgSess(n,date,club,k)})),at:0};E.days.push(d);E.open=d.id;save();return d}
const pgDay=id=>pgEv().days.find(d=>d.id==id);
/* the club rule is for the whole group and can change only before anyone scores */
function pgClub(d,on){if(d.a.some(x=>pgN(x.s)||(x.s.aba[0]||{}).m))return false;d.a.forEach(x=>{if(on)x.s.abaClub=true;else delete x.s.abaClub;x.s.aba=[]});save();return true}
/* the same rules as abaHit in aba.js, on this archer's own card */
function pgHit(d,j,z){const x=d.a[j];if(!x)return false;const s=x.s,R=pgR(),A=s.aba=s.aba||[],i=pgIdx(s);if(i>=R.ends||s.finished)return false;const n=abaWhere(R,i,s).n;
 if(!s.ends[i])s.ends[i]=[];const t=A[i]=A[i]||{m:0};
 if(z=='M'){t.m++;if(t.m>=n){s.ends[i]=['M'];t.k=0;t.z=''}}
 else{const k=t.m+1,p=abaPts(n,k,z);if(p==null)return false;s.ends[i]=[String(p)];t.k=k;t.z=z}
 const fin=s.ends[i].length>0;if(fin&&s.ends.length<R.ends&&s.ends.length==i+1)s.ends.push([]);
 if(pgN(s)>=R.ends){s.finished=true;if(!s.ends[s.ends.length-1].length)s.ends.pop()}
 if(fin)d.at=pgNext(d,j);save();return fin}
/* after a target is scored, the card moves to the next archer still on the lowest target (group order), like a chip switcher */
function pgNext(d,j){const L=d.a.length;let best=j,bn=Infinity;for(let k=1;k<=L;k++){const q=(j+k)%L,s=d.a[q].s;if(pgDone(s))continue;const n=pgN(s);if(n<bn){bn=n;best=q}}return best}
function pgUndo(d,j){const s=d.a[j].s,A=s.aba=s.aba||[];let i=pgIdx(s);const t=A[i];s.finished=false;
 if(t&&t.m&&!(s.ends[i]||[]).length)t.m--;
 else{if(s.ends[i]&&!s.ends[i].length)s.ends.pop();i=s.ends.length-1;if(i<0){s.ends=[[]];save();return}s.ends[i]=[];if(A[i]){A[i].m=0;delete A[i].k;delete A[i].z}}
 if(!s.ends.length)s.ends=[[]];save()}
/* event total for an archer, across days, matched by the typed name */
function pgEvent(nm){const k=pgKey(nm);return pgEv().days.reduce((t,d)=>t+d.a.filter(x=>pgKey(x.nm)==k).reduce((u,x)=>u+pgTot(x.s),0),0)}
function pgDaysOf(nm){const k=pgKey(nm);return pgEv().days.filter(d=>d.a.some(x=>pgKey(x.nm)==k)).length}
/* block running total for the archer's last scored target (restarts each 10-target block, as on the paper sheet) */
function pgRun(s){const R=pgR(),li=[...s.ends.keys()].filter(j=>s.ends[j]&&s.ends[j].length).pop();if(li==null)return null;const W=abaWhere(R,li,s),HS=abaHalves(s),bk=abaBlocks(W.H.t)[Math.floor((W.tn-1)/10)];
 return{h:W.h,tn:W.tn,from:bk.from,to:bk.to,run:HS[W.h].rn[W.tn-1],hn:abaHalfName(W.h,HS.length)}}
const pgDate=d=>d?new Date(d+'T00:00').toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'}):'';
const pgDayNo=d=>pgEv().days.indexOf(d)+1;
/* ---------- entry card (Score tab, testers) ---------- */
function pgCard(){if(typeof TESTER=='undefined'||!TESTER)return'';const E=pgEv(),n=E.days.length;
 return`<div class="card" id="pgcard"><span class="kicker">Group score card · ABA 3D</span><h3 style="margin:2px 0 4px">${PG_NAME}</h3><p class="small muted" style="margin:0 0 8px">Score your whole group on this phone, one card a day. Works offline; saved on this phone only.</p><button class="btn alt" id="pgopen">${n?'Open ('+n+' day'+(n>1?'s':'')+')':'Start day 1'}</button></div>`}
const _pgH2H=window.h2hCard;window.h2hCard=function(){return(_pgH2H?_pgH2H.apply(this,arguments):'')+pgCard()};
/* ---------- setup: a new day's group ---------- */
function pgSetup(prev){cur=null;window._pgv='setup';const E=pgEv(),n=E.days.length+1,P=prev?pgDay(prev):null,k=Math.max(PG_DEF,P?P.a.length:0);
 const slots=window._pgSlots=window._pgSlots||k;
 app.innerHTML=`<div id="pgview" class="pg-setup"><div class="card dark"><span class="kicker">${PG_NAME}</span><h1>Day ${n}</h1><p class="small" style="margin:4px 0 0">Type the names of the archers in your group today. You score them all on this phone.</p></div>
 <div class="card"><label for="pgdate">Date</label><input id="pgdate" type="date" value="${pgToday()}">
 ${[...Array(slots)].map((_,i)=>`<label for="pgn${i}">Archer ${i+1}</label><input id="pgn${i}" data-pgn="${i}" maxlength="40" autocomplete="off" autocapitalize="words" value="${P&&P.a[i]?pgEsc(P.a[i].nm):''}" placeholder="Name">`).join('')}
 <div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start;margin:8px 0">${slots<PG_MAX?'<button class="btn ghost" id="pgadd">Add archer</button>':''}${slots>1?'<button class="btn ghost" id="pgrem">Remove last</button>':''}${E.days.length&&!P?`<button class="btn ghost" id="pgsame">Same group as day ${E.days.length}</button>`:''}</div>
 <label class="small muted" id="pgclubl" style="display:flex;align-items:center;gap:6px;margin:4px 0;padding:0;font-size:12px;font-weight:400;min-height:0"><input type="checkbox" id="pgclub" style="width:16px;height:16px;min-height:0;min-width:0;margin:0;padding:0;flex:none;accent-color:#ffd84d"> Club rule: first half 1 arrow</label>
 <p class="small" id="pgerr" style="margin:6px 0 0" hidden></p>
 <button class="btn full" id="pggo" style="margin-top:8px">Start day ${n}</button>${E.days.length?'<button class="btn ghost full" id="pgback" style="margin-top:6px">Back to the days</button>':''}</div></div>`;
 const keep=()=>[...document.querySelectorAll('[data-pgn]')].map(x=>x.value);
 const re=(cnt,vals)=>{window._pgSlots=cnt;pgSetup(prev);vals.forEach((v,i)=>{const x=$('#pgn'+i);if(x)x.value=v})};
 const a=$('#pgadd');if(a)a.onclick=()=>re(slots+1,keep());const r=$('#pgrem');if(r)r.onclick=()=>re(slots-1,keep().slice(0,slots-1));
 const sm=$('#pgsame');if(sm)sm.onclick=()=>{window._pgSlots=null;pgSetup(E.days[E.days.length-1].id)};
 $('#pggo').onclick=()=>{const d=pgNewDay(keep(),$('#pgclub').checked,$('#pgdate').value||pgToday());if(!d){const e=$('#pgerr');e.hidden=false;e.textContent='Type at least one name.';return}window._pgSlots=null;pgView(d.id)};
 const b=$('#pgback');if(b)b.onclick=()=>{window._pgSlots=null;pgView(E.open)}}
/* ---------- a day's card ---------- */
function pgView(id){const E=pgEv();if(!E.days.length)return pgSetup();const d=pgDay(id)||E.days[E.days.length-1];E.open=d.id;cur=null;window._pgv=d.id;const tb=$('#tabs');if(tb)tb.hidden=false;
 const R=pgR(),j=Math.min(d.at||0,d.a.length-1),x=d.a[j],s=x.s,i=pgIdx(s),fin=pgDone(s),W=fin?null:abaWhere(R,i,s),n=W?W.n:1,t=(s.aba||[])[i]||{m:0},k=(t.m||0)+1,HS=abaHalves(s),run=pgRun(s),started=d.a.some(y=>pgN(y.s)||(y.s.aba[0]||{}).m);
 const view=window._pgSheet;
 const chips=`<div class="row pg-chips" style="gap:6px;flex-wrap:wrap;justify-content:flex-start;margin:6px 0 8px">${d.a.map((y,q)=>`<button class="lc-chip pg-chip${q==j?' on':''}" data-pga="${q}" aria-pressed="${q==j}">${pgEsc(y.nm)} <span class="small">${pgDone(y.s)?'done ':'T'+(pgN(y.s)+1)+' · '}${pgTot(y.s)}</span></button>`).join('')}</div>`;
 const ZN=['A','B','C'],ZL={A:'Kill',B:'Vital',C:'Wound'};
 const pad=fin?`<p id="pgfin" style="margin:6px 0"><b>${pgEsc(x.nm)}: round complete, ${pgTot(s)}</b> (${HS.map((o,h)=>abaHalfName(h,HS.length).toLowerCase()+' '+o.tot).join(' + ')}).</p>`:`
 <div class="small muted" id="pghalf">${W.n>1?'3-arrow half':'1-arrow half'}${s.abaClub&&W.h==0?' (club rule)':''} · target ${i+1} of ${R.ends} in the round</div>
 <div class="row" style="justify-content:space-between;align-items:flex-end;margin:2px 0 6px"><b style="font-size:24px" id="pgtg"><span style="font-size:15px">${abaHalfName(W.h,HS.length)} · </span>Target ${W.tn} of ${W.H.t}</b><b id="pgarrow">Arrow ${k}${n>1&&k>1?` <span class="small muted">(arrow ${k-1} missed)</span>`:''}</b></div>
 <div class="aba-pad" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${ZN.map(z=>`<button class="aba-z" data-pgz="${z}" style="min-height:60px;font-size:22px;font-weight:800;border-radius:12px;border:0;background:${z=='A'?'#ffd84d':z=='B'?'#3b82f6':'#334155'};color:${z=='A'?'#111':'#fff'}">${abaPts(n,k,z)}<div style="font-size:11px;font-weight:700">${ZL[z]} ${z}</div></button>`).join('')}<button class="aba-z" data-pgz="M" style="min-height:60px;font-size:18px;font-weight:800;border-radius:12px;border:0;background:#64748b;color:#fff">Miss<div style="font-size:11px;font-weight:700">${n>1&&k<n?'next arrow':'0'}</div></button></div>`;
 const runL=run?`<div class="list-item" id="pgrun" style="margin:6px 0 0;border-left:4px solid #ffd84d;padding-left:8px">${pgEsc(x.nm)} · ${run.hn.toLowerCase()} target ${run.tn} scored <b>${val(s.ends[[...s.ends.keys()].filter(q=>s.ends[q]&&s.ends[q].length).pop()][0])}</b> · running total ${run.from}-${run.to}: <b>${run.run}</b></div>`:'';
 const rows=d.a.map((y,q)=>{const r=pgRun(y.s);return`<tr data-pgrow="${q}"${q==j?' class="lead"':''}><td>${pgEsc(y.nm)}</td><td>${pgDone(y.s)?'Done':pgN(y.s)+'/'+R.ends}</td><td>${r?r.run:'-'}</td><td><b>${pgTot(y.s)}</b></td><td>${pgEvent(y.nm)}${pgDaysOf(y.nm)>1?'':''}</td><td><button class="btn ghost pg-sh" data-pgsh="${q}" aria-label="Score sheet for ${pgEsc(y.nm)}">Sheet</button></td></tr>`}).join('');
 const dayTabs=E.days.length>1?`<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start;margin:8px 0 0">${E.days.map((y,q)=>`<button class="zb${y.id==d.id?' on':''}" data-pgday="${y.id}">Day ${q+1}</button>`).join('')}</div>`:'';
 const sheet=view!=null&&d.a[view]?`<div class="card" id="pgsheet"><span class="kicker">Score sheet · day ${pgDayNo(d)}</span><h3 style="margin:2px 0 6px">${pgEsc(d.a[view].nm)}</h3>${abaPaper(d.a[view].s)}<div class="row" style="gap:6px;justify-content:flex-start;margin-top:8px"><button class="btn alt" id="pgshare">Share sheet</button><button class="btn ghost" id="pgshx">Close sheet</button></div></div>`:'';
 app.innerHTML=`<div id="pgview"><div class="card dark"><span class="kicker">${PG_NAME} · ABA Interclub 3D</span><h1 style="margin:2px 0">Day ${pgDayNo(d)}</h1><p class="small" style="margin:2px 0 0">${pgEsc(pgDate(d.date))} · ${d.a.length} archer${d.a.length>1?'s':''} on this phone · saved offline</p>${dayTabs}</div>
 <div class="card" id="pgcardx"><span class="kicker">Scoring</span>${chips}
 <div class="row" style="justify-content:space-between;align-items:center"><b style="font-size:20px" id="pgwho">${pgEsc(x.nm)}</b><div style="text-align:right"><span class="small muted">Day total</span> <b style="font-size:24px;color:var(--gold)" id="pgdaytot">${pgTot(s)}</b></div></div>
 ${!started?`<label class="small muted" id="pgclubl" style="display:flex;align-items:center;gap:6px;margin:2px 0 4px;padding:0;font-size:12px;font-weight:400;min-height:0"><input type="checkbox" id="pgclub" ${s.abaClub?'checked':''} style="width:16px;height:16px;min-height:0;min-width:0;margin:0;padding:0;flex:none;accent-color:#ffd84d"> Club rule: first half 1 arrow (whole group)</label>`:s.abaClub?'<div class="small muted" id="pgclubon" style="font-size:12px;margin:0 0 4px">Club rule on: both halves 1 arrow.</div>':''}
 ${pad}${runL}
 <div class="small muted" id="pghalves" style="margin-top:6px">${HS.map((o,h)=>`${abaHalfName(h,HS.length)}: <b>${o.tot}</b> (${abaBlocks(o.H.t).map(b=>b.from+'-'+b.to+': '+o.sub[b.q]).join(', ')})`).join(' · ')}</div>
 <div class="row" style="gap:8px;justify-content:flex-start;margin-top:10px"><button class="btn ghost" id="pgundo" ${pgN(s)||t.m?'':'disabled'}>Undo</button></div></div>
 <div class="card" id="pgtotals"><span class="kicker">Totals</span><table class="pg-tab"><thead><tr><th>Archer</th><th>Targets</th><th>Block</th><th>Day</th><th>Event</th><th></th></tr></thead><tbody>${rows}</tbody></table>
 <p class="small muted" style="margin:6px 0 0">Block = running total for the 10-target block in progress. Event = all days so far (matched by name).</p></div>
 ${sheet}
 <div class="card"><div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start"><button class="btn" id="pgnew">New day</button><button class="btn ghost" id="pgdel">Delete day ${pgDayNo(d)}</button></div></div></div>`;
 const rr=()=>pgView(d.id);
 app.querySelectorAll('[data-pga]').forEach(b=>b.onclick=()=>{d.at=+b.dataset.pga;save();rr()});
 app.querySelectorAll('[data-pgz]').forEach(b=>b.onclick=()=>{pgHit(d,j,b.dataset.pgz);rr()});
 app.querySelectorAll('[data-pgday]').forEach(b=>b.onclick=()=>{window._pgSheet=null;pgView(b.dataset.pgday)});
 app.querySelectorAll('[data-pgsh]').forEach(b=>b.onclick=()=>{window._pgSheet=+b.dataset.pgsh;rr();const e=$('#pgsheet');if(e&&e.scrollIntoView)e.scrollIntoView()});
 const cb=$('#pgclub');if(cb)cb.onchange=()=>{pgClub(d,cb.checked);rr()};
 const u=$('#pgundo');if(u)u.onclick=()=>{pgUndo(d,j);rr()};
 const sh=$('#pgshare');if(sh)sh.onclick=()=>{if(window.shareSheet)shareSheet(d.a[view].s)};
 const sx=$('#pgshx');if(sx)sx.onclick=()=>{window._pgSheet=null;rr()};
 $('#pgnew').onclick=()=>{window._pgSheet=null;window._pgSlots=null;pgSetup()};
 $('#pgdel').onclick=()=>{if(!confirm(`Delete day ${pgDayNo(d)} of ${PG_NAME}? Its scores are removed from this phone.`))return;E.days=E.days.filter(y=>y!==d);E.open=E.days.length?E.days[E.days.length-1].id:null;window._pgSheet=null;save();E.days.length?pgView(E.open):pgSetup()}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#pgopen');if(!b)return;window._pgSheet=null;window._pgSlots=null;const E=pgEv();E.days.length?pgView(E.open):pgSetup()});
Object.assign(window,{pgEv,pgNewDay,pgHit,pgUndo,pgNext,pgEvent,pgTot,pgRun,pgView,pgSetup,pgClub,pgCard,PG_NAME});
})();
