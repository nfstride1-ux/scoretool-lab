/* ABA State Titles at Peel: a one-phone group score card (20 Oct 2026, from Nathe). Nathe scores his whole group on his phone
   because they don't have the app. Several days, each with its own card and its own group. Scoring is the ABA Interclub 3D round
   from aba.js, unchanged: first half up to 3 arrows a target (arrows 2 and 3 only after a miss), second half 1 arrow, a running
   total that restarts each 10-target block, and the small club-rule tick (first half 1 arrow). Fully offline: stored on this
   phone only (S.peel), nothing is posted to the relay, and nothing goes into the archer's own rounds or stats. */
(function(){
const PG_NAME='ABA State Titles at Peel',PG_DEF=4,PG_MAX=6;
/* Day 2 (22 Oct 2026, Nathe via Archery Coach): the event is two days. Dates from archerycalendars.com events.json, id aba-2026-097,
   'Branch J ABA State Titles 2026 - Peel Archers', Sat 24 to Sun 25 Oct 2026 (ABA shoot calendar, dates confirmed). Day 1 and Day 2 are
   shown as two cards under the one event; nothing is written until a day is started, and existing days are never changed. */
const PG_DATES=['2026-10-24','2026-10-25'],PG_WHEN='Sat 24 and Sun 25 Oct 2026, Peel Archers';
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
 if(fin){d.at=pgNext(d,j);/* hold on the archer just scored until Next is tapped (the group card moves on only then); no hold when the card stays on the same archer */
  if(d.at!=j)d.hold=j;else delete d.hold}save();return fin}
/* after a target is scored, the card moves to the next archer still on the lowest target (group order), like a chip switcher */
function pgNext(d,j){const L=d.a.length;let best=j,bn=Infinity;for(let k=1;k<=L;k++){const q=(j+k)%L,s=d.a[q].s;if(pgDone(s))continue;const n=pgN(s);if(n<bn){bn=n;best=q}}return best}
function pgUndo(d,j){const s=d.a[j].s,A=s.aba=s.aba||[];let i=pgIdx(s);const t=A[i];s.finished=false;if(d.hold!=null){delete d.hold;d.at=j}
 if(t&&t.m&&!(s.ends[i]||[]).length)t.m--;
 else{if(s.ends[i]&&!s.ends[i].length)s.ends.pop();i=s.ends.length-1;if(i<0){s.ends=[[]];save();return}s.ends[i]=[];if(A[i]){A[i].m=0;delete A[i].k;delete A[i].z}}
 if(!s.ends.length)s.ends=[[]];save()}
/* Save the day: every archer's card for the day is complete. The scores are already stored on this phone as each target is scored (S.peel,
   autosave); Save adds a dated record on the day (d.saved) with each archer's score as saved, and confirms it. Idempotent: it only ever writes
   that one record on the day, so tapping it again just refreshes it. No session is added to anyone's own rounds. */
const pgAllDone=d=>d.a.length>0&&d.a.every(x=>pgDone(x.s));
/* a saved record is only 'Saved' while it still matches the scores (undo and rescore after Save makes it stale) */
const pgSavedCur=d=>!!(d.saved&&d.saved.a&&d.saved.a.length==d.a.length&&d.a.every((x,i)=>d.saved.a[i].nm==x.nm&&d.saved.a[i].tot==pgTot(x.s)&&d.saved.a[i].n==pgN(x.s)));
function pgSave(d){if(!pgAllDone(d))return false;d.saved={at:Date.now(),a:d.a.map(x=>({nm:x.nm,tot:pgTot(x.s),n:pgN(x.s),h:abaHalves(x.s).map(o=>o.tot)}))};save();return true}
/* event total for an archer, across days, matched by the typed name */
function pgEvent(nm){const k=pgKey(nm);return pgEv().days.reduce((t,d)=>t+d.a.filter(x=>pgKey(x.nm)==k).reduce((u,x)=>u+pgTot(x.s),0),0)}
function pgDaysOf(nm){const k=pgKey(nm);return pgEv().days.filter(d=>d.a.some(x=>pgKey(x.nm)==k)).length}
/* ---------- Competition complete (25 Oct 2026, Nathe) ----------
   Peel is two days (Day 1 and Day 2) and the competition can be completed after either one, so Nathe is never stuck. Completing merges the days
   per archer (matched by the typed name) into ONE new record, S.peel.comp: each day's first half, second half and day total, every target's score,
   and the overall total. It only ever reads the days; the saved Day 1 and Day 2 scores are never changed. Tapping it again with nothing changed
   writes nothing; if scores changed it refreshes only this record. One day only is said plainly. */
function pgCompBuild(){const E=pgEv(),M=new Map(),R=pgR(),days=E.days.map((d,q)=>({no:q+1,date:d.date,n:d.a.length,done:pgAllDone(d)}));
 E.days.forEach((d,q)=>{const seen={};d.a.forEach(x=>{const b=pgKey(x.nm);seen[b]=(seen[b]||0)+1;const k=seen[b]>1?b+'#'+seen[b]:b;if(!M.has(k))M.set(k,{nm:x.nm,days:E.days.map(()=>null)});
  M.get(k).days[q]={no:q+1,date:d.date,n:pgN(x.s),of:R.ends,done:!!pgDone(x.s),tot:pgTot(x.s),h:abaHalves(x.s).map(o=>({t:o.H.t,n:o.H.n,tot:o.tot,sub:o.sub.slice(),v:Array.from(o.v,y=>y==null?null:y)}))}})});
 const rows=[...M.values()].map(r=>({...r,tot:r.days.reduce((t,d)=>t+(d?d.tot:0),0)}));
 return{name:PG_NAME,oneDay:days.length==1,days,rows}}
const pgCompSame=(a,b)=>JSON.stringify({...a,at:0})==JSON.stringify({...b,at:0});
function pgComplete(){const E=pgEv();if(!E.days.length)return null;const c=pgCompBuild();if(E.comp&&pgCompSame(E.comp,c))return E.comp;c.at=Date.now();E.comp=c;save();return c}
const pgCompUnfinished=()=>pgEv().days.map((d,q)=>({q,k:d.a.filter(x=>!pgDone(x.s)).length,n:d.a.length})).filter(u=>u.k);
const pgWho=nm=>window.shareWho?shareWho({pg:1,abaHead:{name:nm}}):nm;
function pgCompText(c){const rows=c.rows.map((r,i)=>({r,i})).sort((a,b)=>b.r.tot-a.r.tot||a.i-b.i);let pos=0,last=null;
 return c.name+' - competition results ('+(c.days.length==1?'one day only, Day '+c.days[0].no:'Day '+c.days.map(d=>d.no).join(' + Day '))+')\n'+rows.map(({r},k)=>{if(r.tot!==last){pos=k+1;last=r.tot}return pos+'. '+pgWho(r.nm)+' - '+c.days.map((d,q)=>'Day '+d.no+' '+(r.days[q]?r.days[q].tot:'-')).join(', ')+' = '+r.tot}).join('\n')}
/* block running total for the archer's last scored target (restarts each 10-target block, as on the paper sheet) */
function pgRun(s){const R=pgR(),li=[...s.ends.keys()].filter(j=>s.ends[j]&&s.ends[j].length).pop();if(li==null)return null;const W=abaWhere(R,li,s),HS=abaHalves(s),bk=abaBlocks(W.H.t)[Math.floor((W.tn-1)/10)];
 return{h:W.h,tn:W.tn,from:bk.from,to:bk.to,run:HS[W.h].rn[W.tn-1],hn:abaHalfName(W.h,HS.length)}}
/* every archer typed on any day (first spelling kept), with their score each day and the event total */
function pgEvRows(){const E=pgEv(),M=new Map();E.days.forEach((d,q)=>d.a.forEach(x=>{const k=pgKey(x.nm);if(!M.has(k))M.set(k,{nm:x.nm,day:[]});const r=M.get(k);r.day[q]=(r.day[q]||0)+pgTot(x.s)}));
 return[...M.values()].map(r=>({...r,tot:r.day.reduce((t,v)=>t+(v||0),0)}))}
function pgEvTable(){const E=pgEv(),n=Math.max(2,E.days.length),R=pgEvRows();if(!R.length)return'';
 return`<table class="pg-tab" id="pgevtab"><thead><tr><th>Archer</th>${[...Array(n)].map((_,q)=>`<th>Day ${q+1}</th>`).join('')}<th>Event</th></tr></thead><tbody>${R.map(r=>`<tr><td>${pgEsc(r.nm)}</td>${[...Array(n)].map((_,q)=>`<td>${r.day[q]!=null?r.day[q]:'-'}</td>`).join('')}<td><b>${r.tot}</b></td></tr>`).join('')}</tbody></table>`}
/* back to where the group card lives: Clubs > Group score card (falls back to Score) */
const pgHome=()=>nav(typeof (window.EXTRA_VIEWS||{}).lab_group=='function'?'lab_group':'score');
const pgBack=()=>`<button class="btn ghost labback" id="pgbk" style="margin:0 0 8px">&lsaquo; Back</button>`;
const pgDate=d=>d?new Date(d+'T00:00').toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'}):'';
const pgDayNo=d=>pgEv().days.indexOf(d)+1;
/* ---------- entry card (Score tab, testers) ---------- */
function pgCard(){if(typeof TESTER=='undefined'||!TESTER)return'';const E=pgEv(),n=Math.max(2,E.days.length);
 const day=q=>{const d=E.days[q],can=q<=E.days.length,dt=d?d.date:PG_DATES[q];
  return`<div class="list-item row pg-dayrow" data-pgdrow="${q+1}" style="align-items:center"><span><b>Day ${q+1}</b> <span class="small muted">${pgEsc(pgDate(dt))}${d?' · '+d.a.length+' archer'+(d.a.length>1?'s':''):''}</span></span>${d?`<button class="btn ghost" style="white-space:nowrap" data-pgcday="${d.id}"${q==0?' id="pgopen"':''} aria-label="Open Day ${q+1}">Open</button>`:can?`<button class="btn alt" style="white-space:nowrap" data-pgcnew="${q+1}"${q==0?' id="pgopen"':''}>Start Day ${q+1}</button>`:`<span class="small muted">after Day ${q}</span>`}</div>`};
 return`<div class="card" id="pgcard"><span class="kicker">Group score card · ABA 3D</span><h3 style="margin:2px 0 2px">${PG_NAME}</h3><p class="small" style="margin:0 0 4px">${PG_WHEN}</p><p class="small muted" style="margin:0 0 8px">Peel is two days. Score your whole group on this phone, one card a day. Event total adds Day 1 and Day 2. Works offline; saved on this phone only.</p>
 ${[...Array(n)].map((_,q)=>day(q)).join('')}${E.days.length?`<details id="pgcevt" style="margin-top:6px"><summary class="small">Event totals</summary>${pgEvTable()}</details>`:''}${E.days.length?`<div class="list-item" id="pgcompbox" style="margin-top:8px;border-left:4px solid #ffd84d;padding-left:8px"><b>Competition complete</b><div class="small muted" style="margin:2px 0 6px">Finish after Day 1 or Day 2. Merges the days into one results record; your saved days are not changed.</div><button class="btn${E.comp?' ghost':''} full" data-pgccomp="1" id="pgcompb" style="min-height:48px">${E.comp?'Open competition results':'Competition complete'}</button></div>`:''}</div>`}
const _pgH2H=window.h2hCard;window.h2hCard=function(){return(_pgH2H?_pgH2H.apply(this,arguments):'')+pgCard()};
/* ---------- setup: a new day's group ---------- */
function pgSetup(prev){cur=null;window._pgv='setup';const E=pgEv(),n=E.days.length+1,dflt=PG_DATES[n-1]||pgToday(),P=prev?pgDay(prev):null,k=Math.max(PG_DEF,P?P.a.length:0);
 const slots=window._pgSlots=window._pgSlots||k;
 app.innerHTML=`<div id="pgview" class="pg-setup">${pgBack()}<div class="card dark"><span class="kicker">${PG_NAME}</span><h1>Day ${n}</h1><p class="small" style="margin:2px 0 0">${PG_WHEN}</p><p class="small" style="margin:4px 0 0">Type the names of the archers in your group today. You score them all on this phone.</p></div>
 <div class="card"><label for="pgdate">Date</label><input id="pgdate" type="date" value="${dflt}">
 ${[...Array(slots)].map((_,i)=>`<label for="pgn${i}">Archer ${i+1}</label><input id="pgn${i}" data-pgn="${i}" maxlength="40" autocomplete="off" autocapitalize="words" value="${P&&P.a[i]?pgEsc(P.a[i].nm):''}" placeholder="Name">`).join('')}
 <div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start;margin:8px 0">${slots<PG_MAX?'<button class="btn ghost" id="pgadd">Add archer</button>':''}${slots>1?'<button class="btn ghost" id="pgrem">Remove last</button>':''}${E.days.length&&!P?`<button class="btn ghost" id="pgsame">Same group as Day ${E.days.length}</button>`:''}</div>
 <label class="small muted" id="pgclubl" style="display:flex;align-items:center;gap:6px;margin:4px 0;padding:0;font-size:12px;font-weight:400;min-height:0"><input type="checkbox" id="pgclub" style="width:16px;height:16px;min-height:0;min-width:0;margin:0;padding:0;flex:none;accent-color:#ffd84d"> Club rule: first half 1 arrow</label>
 <p class="small" id="pgerr" style="margin:6px 0 0" hidden></p>
 <button class="btn full" id="pggo" style="margin-top:8px">Start Day ${n}</button>${E.days.length?'<button class="btn ghost full" id="pgback" style="margin-top:6px">Back to the days</button>':''}</div></div>`;
 const keep=()=>[...document.querySelectorAll('[data-pgn]')].map(x=>x.value);
 const re=(cnt,vals)=>{window._pgSlots=cnt;pgSetup(prev);vals.forEach((v,i)=>{const x=$('#pgn'+i);if(x)x.value=v})};
 const a=$('#pgadd');if(a)a.onclick=()=>re(slots+1,keep());const r=$('#pgrem');if(r)r.onclick=()=>re(slots-1,keep().slice(0,slots-1));
 const sm=$('#pgsame');if(sm)sm.onclick=()=>{window._pgSlots=null;pgSetup(E.days[E.days.length-1].id)};
 $('#pggo').onclick=()=>{const d=pgNewDay(keep(),$('#pgclub').checked,$('#pgdate').value||dflt);if(!d){const e=$('#pgerr');e.hidden=false;e.textContent='Type at least one name.';return}window._pgSlots=null;pgView(d.id)};
 const b=$('#pgback');if(b)b.onclick=()=>{window._pgSlots=null;pgView(E.open)};
 $('#pgbk').onclick=()=>{window._pgSlots=null;pgHome()};scrollTo(0,0)}
/* ---------- a day's card ---------- */
/* After every score, Next, Undo or archer chip: put the scoring zone (name, score buttons, updated sheet, Next) in view and keep it there, so the buttons and the sheet are seen together and the card never jumps back to the top of the page. Always anchors on the archer's name just under the top bar, so the position is the same after every tap and Next. Display only. */
function pgAlign(){const sc=window.__scroller;if(!sc)return;const fix=()=>{const w=$('#pgwho');if(!w)return;const bx=sc.getBoundingClientRect();sc.scrollTop=Math.max(0,w.getBoundingClientRect().top-bx.top+sc.scrollTop-4)};fix();requestAnimationFrame(fix)}
/* ---------- the competition results screen ---------- */
function pgCompGo(){const E=pgEv();if(!E.days.length)return;
 if(!E.comp){const u=pgCompUnfinished();if(u.length&&!confirm('Not every archer has finished: '+u.map(x=>'Day '+(x.q+1)+' has '+x.k+' of '+x.n+' archers not finished').join('; ')+'. Complete the competition with the scores so far? Your saved days are not changed.'))return}
 else if(!pgCompSame(E.comp,pgCompBuild())){const u=pgCompUnfinished();if(u.length&&!confirm('Not every archer has finished: '+u.map(x=>'Day '+(x.q+1)+' has '+x.k+' of '+x.n+' archers not finished').join('; ')+'. Update the competition results with the scores so far?'))return}
 pgComplete();pgComp()}
function pgComp(){const E=pgEv(),c=E.comp;if(!c)return pgView(E.open);cur=null;window._pgv='comp';const tb=$('#tabs');if(tb)tb.hidden=false;
 const stale=!pgCompSame(c,pgCompBuild()),rows=c.rows.map((r,i)=>({r,i})).sort((a,b)=>b.r.tot-a.r.tot||a.i-b.i);let pos=0,last=null;
 const dl=(r,q)=>{const d=r.days[q];return d?`Day ${d.no}: first half <b>${d.h[0]?d.h[0].tot:'-'}</b>, second half <b>${d.h[1]?d.h[1].tot:'-'}</b>, day <b>${d.tot}</b>${d.done?'':` <span class="small muted">(not finished, ${d.n} of ${d.of} targets)</span>`}`:`Day ${q+1}: not scored`};
 app.innerHTML=`<div id="pgview" class="pg-comp"><button class="btn ghost labback" id="pgcbk" style="margin:0 0 8px">&lsaquo; Back</button>
 <div class="card dark"><span class="kicker">${PG_NAME}</span><h1 style="margin:2px 0">Competition complete</h1>
 <p class="small" id="pgcwhen" style="margin:2px 0 0">${c.days.length==1?'<b>One day only</b> (Day '+c.days[0].no+'). Peel is two days; this is Day '+c.days[0].no+' on its own. Tap Competition complete again after Day 2 to add it.':'Day '+c.days.map(d=>d.no).join(' + Day ')+' combined, per archer.'}</p>
 <p class="small muted" style="margin:4px 0 0">This is a separate results record. Your saved Day 1 and Day 2 scores are not changed.</p></div>
 ${stale?`<div class="card" id="pgcstale"><div class="list-item" style="border-left:4px solid #ffd84d;padding-left:8px">The day scores have changed since this record was made.</div><button class="btn full" id="pgcupd" style="margin-top:8px">Update the results from the days</button></div>`:''}
 <div class="card" id="pgcres"><span class="kicker">Results</span><table class="pg-tab" id="pgctab"><thead><tr><th>#</th><th>Archer</th>${c.days.map(d=>`<th>Day ${d.no}</th>`).join('')}<th>Total</th></tr></thead><tbody>${rows.map(({r},k)=>{if(r.tot!==last){pos=k+1;last=r.tot}return`<tr><td>${pos}</td><td>${pgEsc(r.nm)}</td>${c.days.map((d,q)=>`<td>${r.days[q]?r.days[q].tot:'-'}</td>`).join('')}<td><b>${r.tot}</b></td></tr>`}).join('')}</tbody></table>
 <button class="btn full" id="pgcsum" style="margin-top:8px;min-height:52px">Share results summary</button></div>
 ${rows.map(({r,i})=>`<div class="card" data-pgcarch="${i}"><b style="font-size:20px">${pgEsc(r.nm)}</b> <span class="small muted">total</span> <b style="font-size:24px;color:var(--gold)">${r.tot}</b>${c.days.map((d,q)=>`<div class="small" style="margin-top:4px">${dl(r,q)}</div>`).join('')}<button class="btn alt full" data-pgcsh="${i}" style="margin-top:8px">Share ${pgEsc(r.nm)}'s full sheet</button></div>`).join('')}
 <div class="card"><button class="btn ghost full" id="pgcback2">Back to the day card</button></div></div>`;
 const back=()=>{pgView(E.open)};$('#pgcbk').onclick=back;$('#pgcback2').onclick=back;
 const up=$('#pgcupd');if(up)up.onclick=()=>pgCompGo();
 const slug=window.shareSlug||(t=>String(t).replace(/[^A-Za-z0-9]+/g,'-'));
 $('#pgcsum').onclick=()=>{if(window.shareCanvas&&window.compSummaryCanvas)shareCanvas(compSummaryCanvas(c),'scoretool-'+slug(c.name)+'-results.png','Competition results',pgCompText(c))};
 app.querySelectorAll('[data-pgcsh]').forEach(b=>b.onclick=()=>{const r=c.rows[+b.dataset.pgcsh],w=pgWho(r.nm);if(window.shareCanvas&&window.compSheetCanvas)shareCanvas(compSheetCanvas(c,+b.dataset.pgcsh),'scoretool-'+slug(c.name)+'-'+slug(w)+'-competition.png','Competition sheet · '+w,w+' · '+c.name+' · total '+r.tot+(c.days.length==1?' (one day only)':''))});
 scrollTo(0,0)}
function pgView(id){const E=pgEv();if(!E.days.length)return pgSetup();const d=pgDay(id)||E.days[E.days.length-1];E.open=d.id;cur=null;window._pgv=d.id;const tb=$('#tabs');if(tb)tb.hidden=false;
 const R=pgR(),hold=d.hold!=null&&d.a[d.hold]&&d.hold!==d.at?d.hold:null,j=hold!=null?hold:Math.min(d.at||0,d.a.length-1),nxj=Math.min(d.at||0,d.a.length-1),x=d.a[j],s=x.s,i=pgIdx(s),fin=pgDone(s),W=fin?null:abaWhere(R,i,s),n=W?W.n:1,t=(s.aba||[])[i]||{m:0},k=(t.m||0)+1,HS=abaHalves(s),run=pgRun(s),started=d.a.some(y=>pgN(y.s)||(y.s.aba[0]||{}).m);
 const view=window._pgSheet;
 const chips=`<div class="row pg-chips" style="gap:6px;flex-wrap:wrap;justify-content:flex-start;margin:6px 0 8px">${d.a.map((y,q)=>`<button class="lc-chip pg-chip${q==j?' on':''}" data-pga="${q}" aria-pressed="${q==j}">${pgEsc(y.nm)} <span class="small">${pgDone(y.s)?'done ':'T'+(pgN(y.s)+1)+' · '}${pgTot(y.s)}</span></button>`).join('')}</div>`;
 const ZN=['A','B','C'],ZL={A:'Kill',B:'Vital',C:'Wound'};
 const tgt=(y)=>{const l=[...y.s.ends.keys()].filter(q=>y.s.ends[q]&&y.s.ends[q].length).pop();return l==null?null:{n:l+1,v:val(y.s.ends[l][0])}};
 const sheetNow=`<div id="pglive" style="margin-top:10px"><span class="kicker">Your sheet so far · ${pgEsc(x.nm)}</span>${window.abaGrid?window.abaGrid(s,false,fin?-1:i):''}</div>`;
 const nextBtn=hold!=null?`<button class="btn full" id="pgnext" style="margin-top:8px;min-height:56px;font-size:18px">Next: ${pgEsc(d.a[nxj].nm)} <span aria-hidden="true">&rsaquo;</span></button>`:'';
 const lt=tgt(x),pad=hold!=null?`<div id="pghold" style="margin:6px 0"><div class="list-item" style="border-left:4px solid #ffd84d;padding-left:8px"><b>${pgEsc(x.nm)}</b>: target ${lt?lt.n:''} scored <b>${lt?lt.v:''}</b>${pgDone(s)?' (round complete)':''}. Tap Next below the sheet.</div></div>`:fin?`<p id="pgfin" style="margin:6px 0"><b>${pgEsc(x.nm)}: round complete, ${pgTot(s)}</b> (${HS.map((o,h)=>abaHalfName(h,HS.length).toLowerCase()+' '+o.tot).join(' + ')}).</p>`:`
 <div class="small muted" id="pghalf">${W.n>1?'3-arrow half':'1-arrow half'}${s.abaClub&&W.h==0?' (club rule)':''} · target ${i+1} of ${R.ends} in the round</div>
 <div class="row" style="justify-content:space-between;align-items:flex-end;margin:2px 0 6px"><b style="font-size:24px" id="pgtg"><span style="font-size:15px">${abaHalfName(W.h,HS.length)} · </span>Target ${W.tn} of ${W.H.t}</b><b id="pgarrow">Arrow ${k}${n>1&&k>1?` <span class="small muted">(arrow ${k-1} missed)</span>`:''}</b></div>
 <div class="aba-pad" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${ZN.map(z=>`<button class="aba-z" data-pgz="${z}" style="min-height:60px;font-size:22px;font-weight:800;border-radius:12px;border:0;background:${z=='A'?'#ffd84d':z=='B'?'#3b82f6':'#334155'};color:${z=='A'?'#111':'#fff'}">${abaPts(n,k,z)}<div style="font-size:11px;font-weight:700">${ZL[z]} ${z}</div></button>`).join('')}<button class="aba-z" data-pgz="M" style="min-height:60px;font-size:18px;font-weight:800;border-radius:12px;border:0;background:#64748b;color:#fff">Miss<div style="font-size:11px;font-weight:700">${n>1&&k<n?'next arrow':'0'}</div></button></div>`;
 const runL=run?`<div class="list-item" id="pgrun" style="margin:6px 0 0;border-left:4px solid #ffd84d;padding-left:8px">${pgEsc(x.nm)} · ${run.hn.toLowerCase()} target ${run.tn} scored <b>${val(s.ends[[...s.ends.keys()].filter(q=>s.ends[q]&&s.ends[q].length).pop()][0])}</b> · running total ${run.from}-${run.to}: <b>${run.run}</b></div>`:'';
 const rows=d.a.map((y,q)=>{const r=pgRun(y.s);return`<tr data-pgrow="${q}"${q==j?' class="lead"':''}><td>${pgEsc(y.nm)}</td><td>${pgDone(y.s)?'Done':pgN(y.s)+'/'+R.ends}</td><td>${r?r.run:'-'}</td><td><b>${pgTot(y.s)}</b></td><td>${pgEvent(y.nm)}${pgDaysOf(y.nm)>1?'':''}</td><td><button class="btn ghost pg-sh" data-pgsh="${q}" aria-label="Score sheet for ${pgEsc(y.nm)}">Sheet</button></td></tr>`}).join('');
 const dayTabs=`<div class="row" id="pgdays" style="gap:6px;flex-wrap:wrap;justify-content:flex-start;margin:8px 0 0">${E.days.map((y,q)=>`<button class="zb${y.id==d.id?' on':''}" data-pgday="${y.id}" aria-pressed="${y.id==d.id}">Day ${q+1}</button>`).join('')}${E.days.length<2?`<button class="zb" id="pgday2">Start Day ${E.days.length+1}</button>`:''}</div>`;
 const sheet=view!=null&&d.a[view]?`<div class="card" id="pgsheet"><span class="kicker">Score sheet · day ${pgDayNo(d)}</span><h3 style="margin:2px 0 6px">${pgEsc(d.a[view].nm)}</h3>${abaPaper(d.a[view].s,true)}<div class="row" style="gap:6px;justify-content:flex-start;margin-top:8px"><button class="btn alt" id="pgshare">Share sheet</button><button class="btn ghost" id="pgshx">Close sheet</button></div></div>`:'';
 app.innerHTML=`<div id="pgview">${pgBack()}<div class="card dark"><span class="kicker">${PG_NAME} · ABA Interclub 3D</span><h1 style="margin:2px 0">Day ${pgDayNo(d)}</h1><p class="small" style="margin:2px 0 0">${pgEsc(pgDate(d.date))} · ${d.a.length} archer${d.a.length>1?'s':''} on this phone · saved offline</p>${dayTabs}</div>
 <div class="card" id="pgcardx"><span class="kicker">Scoring</span>${chips}
 <div class="row" style="justify-content:space-between;align-items:center"><b style="font-size:20px" id="pgwho">${pgEsc(x.nm)}</b><div style="text-align:right"><span class="small muted">Day total</span> <b style="font-size:24px;color:var(--gold)" id="pgdaytot">${pgTot(s)}</b></div></div>
 ${!started?`<label class="small muted" id="pgclubl" style="display:flex;align-items:center;gap:6px;margin:2px 0 4px;padding:0;font-size:12px;font-weight:400;min-height:0"><input type="checkbox" id="pgclub" ${s.abaClub?'checked':''} style="width:16px;height:16px;min-height:0;min-width:0;margin:0;padding:0;flex:none;accent-color:#ffd84d"> Club rule: first half 1 arrow (whole group)</label>`:s.abaClub?'<div class="small muted" id="pgclubon" style="font-size:12px;margin:0 0 4px">Club rule on: both halves 1 arrow.</div>':''}
 ${pad}${hold!=null?sheetNow.replace('<div class="aba-tots">',nextBtn+'<div class="aba-tots">'):sheetNow}${runL}
 <div class="small muted" id="pghalves" style="margin-top:6px">${HS.map((o,h)=>`${abaHalfName(h,HS.length)}: <b>${o.tot}</b> (${abaBlocks(o.H.t).map(b=>b.from+'-'+b.to+': '+o.sub[b.q]).join(', ')})`).join(' · ')}</div>
 <div class="row" style="gap:8px;justify-content:flex-start;margin-top:10px"><button class="btn ghost" id="pgundo" ${pgN(s)||t.m?'':'disabled'}>Undo</button></div></div>
 <div class="card" id="pgtotals"><span class="kicker">Totals</span><table class="pg-tab"><thead><tr><th>Archer</th><th>Targets</th><th>Block</th><th>Day</th><th>Event</th><th></th></tr></thead><tbody>${rows}</tbody></table>
 <p class="small muted" style="margin:6px 0 0">Block = running total for the 10-target block in progress. Event = Day 1 + Day 2 (matched by name).</p></div>
 <div class="card" id="pgevent"><span class="kicker">Event total · all days</span>${pgEvTable()}</div>
 ${pgAllDone(d)?`<div class="card" id="pgsavecard"><span class="kicker">Day ${pgDayNo(d)} complete</span><h3 style="margin:2px 0 6px">All targets are scored</h3>${pgSavedCur(d)?`<div class="list-item" id="pgsaved" style="border-left:4px solid #ffd84d;padding-left:8px"><b>Saved.</b> Day ${pgDayNo(d)} scores for ${d.saved.a.map(y=>pgEsc(y.nm)+' '+y.tot).join(', ')} are saved on this phone (${pgEsc(new Date(d.saved.at).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'}))}). Find them any time under Clubs, Group score card: ${PG_NAME}, Day ${pgDayNo(d)}, Open. Tap Sheet beside an archer for their full score sheet, or Event totals for both days.</div>`:`<p class="small" style="margin:0 0 6px">${d.saved?'The scores changed after you last saved. Tap Save to update the saved copy. ':''}Scores are saved on this phone as you go. Tap Save to keep a final copy of the day for all ${d.a.length} archer${d.a.length>1?'s':''}.</p>`}
 <button class="btn${pgSavedCur(d)?' ghost':''} full" id="pgsave" style="margin-top:8px;min-height:52px;font-size:17px">${pgSavedCur(d)?'Saved. Tap to save again':'Save Day '+pgDayNo(d)}</button></div>`:''}
 ${sheet}
 <div class="card"><div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start">${E.days.length<2?'<button class="btn" id="pgnew">Start Day '+(E.days.length+1)+'</button>':''}<button class="btn${E.days.length<2?' ghost':''}" id="pgcomp">Competition complete</button><button class="btn ghost" id="pgdel">Delete Day ${pgDayNo(d)}</button></div><p class="small muted" style="margin:8px 0 0" id="pgcnote">Peel is two days. Tap Competition complete after Day 1 or after Day 2: it merges the days into a results record and offers Share. Your saved days are not changed.</p></div></div>`;
 const rr=()=>pgView(d.id);
 app.querySelectorAll('[data-pga]').forEach(b=>b.onclick=()=>{d.at=+b.dataset.pga;delete d.hold;save();rr();pgAlign()});
 const nb=$('#pgnext');if(nb)nb.onclick=()=>{delete d.hold;save();rr();pgAlign()};
 app.querySelectorAll('[data-pgz]').forEach(b=>b.onclick=()=>{pgHit(d,j,b.dataset.pgz);rr();pgAlign()});
 app.querySelectorAll('[data-pgday]').forEach(b=>b.onclick=()=>{window._pgSheet=null;pgView(b.dataset.pgday)});
 app.querySelectorAll('[data-pgsh]').forEach(b=>b.onclick=()=>{window._pgSheet=+b.dataset.pgsh;rr();const e=$('#pgsheet');if(e&&e.scrollIntoView)e.scrollIntoView()});
 const cb=$('#pgclub');if(cb)cb.onchange=()=>{pgClub(d,cb.checked);rr()};
 const u=$('#pgundo');if(u)u.onclick=()=>{pgUndo(d,j);rr();pgAlign()};
 const sv=$('#pgsave');if(sv)sv.onclick=()=>{pgSave(d);rr();const e=$('#pgsaved');if(e&&e.scrollIntoView)e.scrollIntoView()};
 const sh=$('#pgshare');if(sh)sh.onclick=()=>{if(window.shareSheet)shareSheet(d.a[view].s)};
 const sx=$('#pgshx');if(sx)sx.onclick=()=>{window._pgSheet=null;rr()};
 const nw=$('#pgnew');if(nw)nw.onclick=()=>{window._pgSheet=null;window._pgSlots=null;pgSetup()};
 $('#pgcomp').onclick=()=>{window._pgSheet=null;pgCompGo()};
 const d2=$('#pgday2');if(d2)d2.onclick=()=>{window._pgSheet=null;window._pgSlots=null;pgSetup()};
 $('#pgbk').onclick=()=>{window._pgSheet=null;pgHome()};
 $('#pgdel').onclick=()=>{if(!confirm(`Delete day ${pgDayNo(d)} of ${PG_NAME}? Its scores are removed from this phone.`))return;E.days=E.days.filter(y=>y!==d);E.open=E.days.length?E.days[E.days.length-1].id:null;window._pgSheet=null;save();E.days.length?pgView(E.open):pgSetup()}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#pgcard [data-pgcday],#pgcard [data-pgcnew],#pgcard [data-pgccomp]');if(!b)return;window._pgSheet=null;window._pgSlots=null;if(b.dataset.pgccomp)return pgCompGo();b.dataset.pgcday?pgView(b.dataset.pgcday):pgSetup()});
Object.assign(window,{pgComp,pgComplete,pgCompBuild,pgCompText,pgSave,pgAllDone,pgEvRows,PG_DATES,pgEv,pgNewDay,pgHit,pgUndo,pgNext,pgEvent,pgTot,pgRun,pgView,pgSetup,pgClub,pgCard,PG_NAME});
})();
