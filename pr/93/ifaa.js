/* C10: IFAA Field and Hunter scorers (11 Nov 2026). Official rounds are reusable.
   The Peel event package is named after the live listing: IFAA WA State Titles – Peel Archers
   (event id peel-ifaa-2026-12-05). Preview only: no merge, no GitHub Pages, no live calendar button.
   Distances, faces and scores are from the IFAA Book of Rules, 4 April 2021, Art. V A and V B, plus Annexure 04/1. */
(function(){
const EV_ID='peel-ifaa-2026-12-05';
const EV_NAME='IFAA WA State Titles – Peel Archers';
const KEYS=['5','4','3','M'];
const STYLES=['BB','FU','FS','BH','BU','BL','TR'];
const AGES=['Adult','Young Adult','Veteran','Senior','Junior','Cub'];
const DAYS=[
  {date:'2026-12-05',label:'Saturday – IFAA Field Round',round:'IFAA Field Round',kind:'field'},
  {date:'2026-12-06',label:'Sunday – IFAA Hunter Round',round:'IFAA Hunter Round',kind:'hunter'}
];
/* Official 14-target unit tables (Art. V A 1 / V B 1). Reference only; clubs set course order. */
const UNIT={
 field:[
  {face:65,n:4,shot:'walk-up',adult:'80-70-60-50 yd',junior:'50 yd',cub:'30-25-20-15 yd',metric:'73.15-64.00-54.85-45.70 m; J 45.70 m; C 27.45-22.85-18.30-13.70 m'},
  {face:65,n:1,shot:'straight',adult:'65 yd',junior:'50 yd',cub:'30 yd',metric:'59.45 / 45.70 / 27.45 m'},
  {face:65,n:1,shot:'straight',adult:'60 yd',junior:'45 yd',cub:'25 yd',metric:'54.85 / 41.15 / 22.85 m'},
  {face:65,n:1,shot:'straight',adult:'55 yd',junior:'40 yd',cub:'20 yd',metric:'50.30 / 36.60 / 18.30 m'},
  {face:50,n:4,shot:'walk-up',adult:'45-40-35-30 yd',junior:'as adult',cub:'20 yd',metric:'41.15-36.60-32.00-27.45 m; C 18.30 m'},
  {face:50,n:4,shot:'fan',adult:'35-35-35-35 yd',junior:'as adult',cub:'20 yd',metric:'32.00 m four times; C 18.30 m'},
  {face:50,n:1,shot:'straight',adult:'50 yd',junior:'as adult',cub:'20 yd',metric:'45.70 m; C 18.30 m'},
  {face:50,n:1,shot:'straight',adult:'45 yd',junior:'as adult',cub:'15 yd',metric:'41.15 m; C 13.70 m'},
  {face:50,n:1,shot:'straight',adult:'40 yd',junior:'as adult',cub:'15-15-15-15 yd',metric:'36.60 m; C 13.70 m four times'},
  {face:35,n:1,shot:'straight',adult:'30 yd',junior:'as adult',cub:'10 yd',metric:'27.45 m; C 9.15 m'},
  {face:35,n:1,shot:'straight',adult:'25 yd',junior:'as adult',cub:'10 yd',metric:'22.85 m; C 9.15 m'},
  {face:35,n:1,shot:'straight',adult:'20 yd',junior:'as adult',cub:'10 yd',metric:'18.30 m; C 9.15 m'},
  {face:35,n:1,shot:'straight',adult:'15 yd',junior:'as adult',cub:'10 yd',metric:'13.70 m; C 9.15 m'},
  {face:20,n:4,shot:'walk-up',adult:'35-30-25-20 ft',junior:'as adult',cub:'20 ft',metric:'10.65-9.15-7.60-6.10 m; C 6.10 m'}
 ],
 hunter:[
  {face:65,n:4,shot:'walk-up',adult:'70-65-61-58 yd',junior:'50 yd',cub:'30-25-20-15 yd',metric:'64.00-59.45-55.80-53.05 m; J 45.70 m; C 27.45-22.85-18.30-13.70 m'},
  {face:65,n:4,shot:'walk-up',adult:'64-59-55-52 yd',junior:'50 yd',cub:'30 yd',metric:'58.50-53.95-50.30-47.55 m; C 27.45 m'},
  {face:65,n:4,shot:'walk-up',adult:'58-53-48-45 yd',junior:'45 yd',cub:'25 yd',metric:'53.05-48.45-43.90-41.15 m; J 41.15 m; C 22.85 m'},
  {face:50,n:4,shot:'walk-up',adult:'53-48-44-41 yd',junior:'41 yd',cub:'20 yd',metric:'48.45-43.90-40.25-37.50 m; J 37.50 m; C 18.30 m'},
  {face:50,n:1,shot:'straight',adult:'48 yd',junior:'as adult',cub:'20 yd',metric:'43.90 m; C 18.30 m'},
  {face:50,n:1,shot:'straight',adult:'44 yd',junior:'as adult',cub:'20 yd',metric:'40.23 m; C 18.30 m'},
  {face:50,n:1,shot:'straight',adult:'40 yd',junior:'as adult',cub:'20 yd',metric:'36.60 m; C 18.30 m'},
  {face:50,n:4,shot:'fan',adult:'36-36-36-36 yd',junior:'as adult',cub:'15 yd',metric:'32.90 m four times; C 13.70 m'},
  {face:35,n:4,shot:'fan',adult:'32-32-32-32 yd',junior:'as adult',cub:'15-15-15-15 yd',metric:'29.25 m four times; C 13.70 m four times'},
  {face:35,n:4,shot:'fan',adult:'28-28-28-28 yd',junior:'as adult',cub:'10 yd',metric:'25.60 m four times; C 9.15 m'},
  {face:35,n:2,shot:'walk-up',adult:'23-20 yd',junior:'as adult',cub:'10 yd',metric:'21.05-18.30 m; C 9.15 m'},
  {face:35,n:2,shot:'walk-up',adult:'19-17 yd',junior:'as adult',cub:'10 yd',metric:'17.35-15.55 m; C 9.15 m'},
  {face:35,n:2,shot:'walk-up',adult:'15-14 yd',junior:'as adult',cub:'10 yd',metric:'13.70-12.80 m; C 9.15 m'},
  {face:20,n:1,shot:'straight',adult:'11 yd',junior:'as adult',cub:'20 ft',metric:'10.05 m; C 6.10 m'}
 ]
};
const IFAA_ROUNDS={
 'IFAA Field Round':{ends:28,ape:4,face:'IFAA 20-65cm',max:560,ifaa:'field',unit:14,xs:false,blocks:[{dist:'Unit 1',unit:'',size:'20-65',type:'ifaa',ends:14},{dist:'Unit 2',unit:'',size:'20-65',type:'ifaa',ends:14}]},
 'IFAA Hunter Round':{ends:28,ape:4,face:'IFAA 20-65cm',max:560,ifaa:'hunter',unit:14,xs:false,blocks:[{dist:'Unit 1',unit:'',size:'20-65',type:'ifaa',ends:14},{dist:'Unit 2',unit:'',size:'20-65',type:'ifaa',ends:14}]},
 'IFAA Field unit (14 targets)':{ends:14,ape:4,face:'IFAA 20-65cm',max:280,ifaa:'field',unit:14,xs:false,blocks:[{dist:'Unit 1',unit:'',size:'20-65',type:'ifaa',ends:14}]},
 'IFAA Hunter unit (14 targets)':{ends:14,ape:4,face:'IFAA 20-65cm',max:280,ifaa:'hunter',unit:14,xs:false,blocks:[{dist:'Unit 1',unit:'',size:'20-65',type:'ifaa',ends:14}]}
};
if(typeof ROUNDS=='object')Object.keys(IFAA_ROUNDS).forEach(k=>{if(!ROUNDS[k])ROUNDS[k]=IFAA_ROUNDS[k]});
const isIfaaR=r=>{const R=typeof r=='string'?ROUNDS[r]:r;return!!(R&&R.ifaa)};
const pegOf=k=>k=='hunter'?'red':'white';
const ifaaEsc=t=>String(t??'').replace(/[&<>"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const ifaaNk=n=>String(n||'').trim().toLowerCase().replace(/\s+/g,' ');
function ifaaRun(ends,R){R=R||{ends:28,ape:4,max:560,unit:14};const u=R.unit||14,e=ends||[];
 const tot=i=>{const x=e[i]||[];return x.length===(R.ape||4)?x.reduce((t,a)=>t+(a=='M'||a==''?0:+a),0):null};
 let u1=0,u2=0,day=0,n1=0,n2=0,n=0;
 for(let i=0;i<e.length;i++){const t=tot(i);if(t==null)continue;n++;day+=t;if(i<u){u1+=t;n1++}else{u2+=t;n2++}}
 const two=R.ends>u;return{n,u1,u2,day,n1,n2,uMax:u*(R.ape||4)*5,dayMax:R.max,two,tgt:i=>tot(i)}}
function ifaaLine(k){return k=='hunter'?'Hunter: the line belongs to the lower zone; the arrow must cut through the line for the higher value.':'Field: there is no painted line; the arrow must cut into the higher scoring area.'}
function ifaaRef(k,age){const rows=UNIT[k]||UNIT.field,peg=pegOf(k),adult=!age||!/junior|cub/i.test(age);
 return`<details class="ifaa-ref" style="margin:6px 0 0"><summary class="small">Official ${k=='hunter'?'Hunter':'Field'} unit (reference, not course order)</summary>
 <p class="small muted" style="margin:4px 0">Adult markers are ${peg}. Junior (blue) and cub (black) distances are in the table. The course at a club is marked in its own order; score targets 1–${rows.length==14?'14 or 1–28':rows.length} as you walk it.</p>
 <div style="overflow:auto"><table class="pg-tab" style="font-size:12px"><thead><tr><th>#</th><th>Face</th><th>Shot</th><th>Adult (${peg})</th><th>Junior</th><th>Cub</th></tr></thead><tbody>
 ${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${r.face} cm</td><td>${ifaaEsc(r.shot)}${r.n>1?' · '+r.n+' markers':''}</td><td>${ifaaEsc(r.adult)}</td><td>${ifaaEsc(r.junior)}</td><td>${ifaaEsc(r.cub)}</td></tr>`).join('')}
 </tbody></table></div></details>`}

/* ---------- known profiles on this phone (guests stay on the group card only) ---------- */
function ifaaKnown(nm){const k=ifaaNk(nm);if(!k)return null;
 if(typeof S!='undefined'&&ifaaNk(S.profile)===k)return{me:true,name:S.profile,key:typeof KEY!='undefined'?KEY:'scoretool.v1'};
 const testers=typeof TESTERS!='undefined'?TESTERS:[];
 const all=t=>{const L=[t.name,t.ad];if(typeof NM_VARIANTS!='undefined'&&NM_VARIANTS[t.id])L.push(...NM_VARIANTS[t.id]);return L.filter(Boolean).map(ifaaNk)};
 const t=testers.find(x=>all(x).includes(k));if(!t)return null;
 const key=t.id=='nathe'?'scoretool.v1':'scoretool.v1.'+t.id;
 return{me:typeof KEY!='undefined'&&key===KEY,id:t.id,name:t.name,key}}
function ifaaWriteSess(prof,sess){if(!prof||!sess)return;
 if(prof.me){S.sessions=S.sessions||[];const i=S.sessions.findIndex(s=>s.id==sess.id);if(i>=0)S.sessions[i]=sess;else S.sessions.push(sess);save();return}
 let o=null;try{o=JSON.parse(localStorage.getItem(prof.key)||'null')}catch(e){o=null}if(!o||typeof o!='object')return;/* do not invent a profile */
 o.sessions=o.sessions||[];const i=o.sessions.findIndex(s=>s.id==sess.id);if(i>=0)o.sessions[i]=sess;else o.sessions.push(sess);
 try{localStorage.setItem(prof.key,JSON.stringify(o))}catch(e){}}
function ifaaSessOf(x,d){const R=ROUNDS[d.round]||IFAA_ROUNDS[d.round],ends=(x.ends||[]).map(e=>(e||[]).slice());
 while(ends.length&&!(ends[ends.length-1]||[]).length)ends.pop();
 const s={id:x.sid,date:d.date,round:d.round,ends,pos:ends.map(()=>[]),note:'',finished:true,ifaa:R&&R.ifaa,max:R&&R.max};
 if(d.ev)s.calEv=d.ev;return s}
function ifaaPbLine(prof,round,score){if(!prof)return'';
 const prev=[];
 const read=obj=>{for(const s of(obj.sessions||[])){if(s.round==round&&s.finished&&s.id){const R=ROUNDS[round];if(!R||!s.ends||s.ends.filter(e=>e&&e.length).length<R.ends)continue;prev.push(s.ends.reduce((t,e)=>t+(e||[]).reduce((u,a)=>u+(a=='M'?0:+a),0),0))}}};
 if(prof.me)read(S);else{try{read(JSON.parse(localStorage.getItem(prof.key)||'null')||{})}catch(e){}}
 if(!prev.length)return`First ${round} on this phone.`;
 const pb=Math.max(...prev);return score>pb?`New PB for this round, beating ${pb}.`:score==pb?'Equal to your PB for this round.':''}

/* ---------- event store (S.ifaa), separate from the Peel ABA 3D card (S.peel) ---------- */
const DEF_N=4,MAX_N=5;
function ifaaEv(){S.ifaa=S.ifaa||{days:[]};return S.ifaa}
const ifaaDay=id=>(ifaaEv().days||[]).find(d=>d.id==id);
function ifaaTot(x){return ifaaRun(x.ends,ROUNDS[x.round]||IFAA_ROUNDS[x.round]||{ends:28,ape:4,max:560,unit:14}).day}
function ifaaDone(x,R){R=R||ROUNDS[x.round]||IFAA_ROUNDS[x.round];const E=x.ends||[];return!!R&&E.length>=R.ends&&E.slice(0,R.ends).every(e=>e&&e.length==R.ape)}
function ifaaN(x){return(x.ends||[]).filter(e=>e&&e.length==4).length}
function ifaaEventTot(nm,ev){const k=ifaaNk(nm);return ifaaEv().days.filter(d=>!ev||d.ev==ev).reduce((t,d)=>t+d.a.filter(x=>ifaaNk(x.nm)==k).reduce((u,x)=>u+ifaaTot(x),0),0)}
function ifaaNewDay(o){const names=(o.names||[]).map(n=>String(n||'').trim().slice(0,40)).filter(Boolean).slice(0,MAX_N);
 if(!names.length)return null;const round=o.round,R=ROUNDS[round];if(!R||!R.ifaa)return null;
 const d={id:'if'+Date.now().toString(36),date:o.date||(typeof today=='function'?today():''),round,ev:o.ev||'',a:names.map((n,i)=>({nm:n,style:o.styles&&o.styles[i]||'',age:o.ages&&o.ages[i]||'Adult',ends:[[]],sid:'ifs'+Date.now().toString(36)+i})),at:0,scorer:o.scorer||'',counter:o.counter||'',tick1:false,tick2:false};
 ifaaEv().days.push(d);ifaaEv().open=d.id;save();return d}

/* four arrows, then the next archer still on this target (or the next target). No skip. */
function ifaaHit(d,j,k){if(KEYS.indexOf(k)<0)return false;const x=d.a[j];if(!x||ifaaDone(x,ROUNDS[d.round]))return false;
 let i=(x.ends||[]).findIndex(e=>(e||[]).length<4);if(i<0){if((x.ends||[]).length>=(ROUNDS[d.round].ends||28))return false;x.ends.push([]);i=x.ends.length-1}
 x.ends[i].push(k);if(x.ends[i].length==4){d.at=ifaaNext(d,j)}save();return true}
function ifaaNext(d,j){const R=ROUNDS[d.round],L=d.a.length,need=i=>ifaaN(d.a[i]);
 const low=Math.min(...d.a.map((x,i)=>ifaaDone(x,R)?1e9:need(i)));if(low>=(R&&R.ends||28))return j;
 for(let s=1;s<=L;s++){const q=(j+s)%L;if(!ifaaDone(d.a[q],R)&&need(q)==low)return q}return j}
function ifaaUndo(d,j){const x=d.a[j];if(!x||!x.ends)return;let i=x.ends.length-1;while(i>=0&&!(x.ends[i]||[]).length){x.ends.pop();i--}if(i<0){x.ends=[[]];d.at=j;save();return}
 x.ends[i].pop();if(!x.ends[i].length&&x.ends.length>1)x.ends.pop();if(!x.ends.length)x.ends=[[]];d.at=j;save()}
function ifaaAllDone(d){return d.a.length>0&&d.a.every(x=>ifaaDone(x,ROUNDS[d.round]))}
function ifaaSave(d){if(!ifaaAllDone(d))return false;
 const pb=[];d.a.forEach(x=>{const R=ROUNDS[d.round],run=ifaaRun(x.ends,R),sess=ifaaSessOf(x,d),prof=ifaaKnown(x.nm);
  if(prof){const line=ifaaPbLine(prof,d.round,run.day);ifaaWriteSess(prof,sess);if(line)pb.push({nm:x.nm,line,score:run.day})}
  /* guests stay on this card only; no fake profile */});
 d.saved={at:Date.now(),a:d.a.map(x=>({nm:x.nm,tot:ifaaTot(x),n:ifaaN(x),sid:x.sid})),pb};save();return true}
function ifaaEdit(d,j,ti,ai,k){if(KEYS.indexOf(k)<0)return false;const x=d.a[j];if(!x||!x.ends[ti]||x.ends[ti][ai]==null)return false;
 x.ends[ti][ai]=k;if(d.saved){const prof=ifaaKnown(x.nm);if(prof)ifaaWriteSess(prof,ifaaSessOf(x,d));
  const rec=d.saved.a.find(r=>r.sid==x.sid||ifaaNk(r.nm)==ifaaNk(x.nm));if(rec){rec.tot=ifaaTot(x);rec.n=ifaaN(x)}}
 save();return true}

/* ---------- UI ---------- */
const ifaaHome=()=>nav(typeof(window.EXTRA_VIEWS||{}).lab_group=='function'?'lab_group':'score');
const ifaaBack=()=>`<button class="btn ghost labback" id="ifaabk" style="margin:0 0 8px">&lsaquo; Back</button>`;
const ifaaDate=d=>d?new Date(d+'T00:00').toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'}):'';
function ifaaCard(){const E=ifaaEv(),peel=E.days.filter(d=>d.ev==EV_ID),n=Math.max(2,peel.length?Math.max(2,peel.length):2);
 const dayBtn=(q,list,ev)=>{const d=list[q],can=q<=list.length,dt=d?d.date:(ev==EV_ID?DAYS[q]&&DAYS[q].date:'');
  const lab=ev==EV_ID&&DAYS[q]?DAYS[q].label.replace(' – IFAA',' · '):(d?d.round:'IFAA Field or Hunter');
  return`<div class="list-item row ifaa-dayrow" style="align-items:center"><span><b>${ev==EV_ID?'Day '+(q+1):'Card '+(q+1)}</b> <span class="small muted">${ifaaEsc(ifaaDate(dt)||'')}${lab?' · '+ifaaEsc(lab):''}${d?' · '+d.a.length+' archer'+(d.a.length>1?'s':''):''}</span></span>${d?`<button class="btn ghost" style="white-space:nowrap" data-ifaad="${d.id}">Open</button>`:can?`<button class="btn alt" style="white-space:nowrap" data-ifaenew="${ev||''}" data-ifaq="${q}">Start</button>`:`<span class="small muted">after the first card</span>`}</div>`};
 return`<div class="card" id="ifaacard"><span class="kicker">Group score card · IFAA Field / Hunter</span><h3 style="margin:2px 0 2px">${ifaaEsc(EV_NAME)}</h3>
 <p class="small" style="margin:0 0 4px">Sat 5 Dec 2026 · IFAA Field Round (112 arrows, max 560). Sun 6 Dec 2026 · IFAA Hunter Round (112 arrows, max 560). Event total after both days is out of 1120.</p>
 <p class="small muted" style="margin:0 0 8px">Score up to 5 people on this phone. IFAA sanctioned marked rounds use groups of 3–4. Works offline.</p>
 ${[0,1].map(q=>dayBtn(q,peel,EV_ID)).join('')}
 ${peel.length?`<details style="margin-top:6px"><summary class="small">Event totals (out of 1120)</summary>${ifaaEvTable(EV_ID)}</details>`:''}</div>
 <div class="card" id="ifaagencard"><span class="kicker">IFAA group card</span><h3 style="margin:2px 0 2px">IFAA Field or Hunter</h3>
 <p class="small muted" style="margin:0 0 8px">A group card for any club, without the Peel event wrapper. Official round names are used for personal bests.</p>
 <button class="btn alt" data-ifaenew="" data-ifaq="0">Start an IFAA group card</button></div>`}
function ifaaEvTable(ev){const days=ifaaEv().days.filter(d=>!ev||d.ev==ev),M=new Map();
 days.forEach((d,q)=>d.a.forEach(x=>{const k=ifaaNk(x.nm);if(!M.has(k))M.set(k,{nm:x.nm,day:[]});M.get(k).day[q]=(M.get(k).day[q]||0)+ifaaTot(x)}));
 const R=[...M.values()].map(r=>({...r,tot:r.day.reduce((t,v)=>t+(v||0),0)}));if(!R.length)return'';
 const n=Math.max(2,days.length);
 return`<table class="pg-tab"><thead><tr><th>Archer</th>${[...Array(n)].map((_,q)=>`<th>${days[q]?(days[q].round||'').replace('IFAA ','').replace(' Round',''):'Day '+(q+1)}</th>`).join('')}<th>Event /1120</th></tr></thead><tbody>${R.map(r=>`<tr><td>${ifaaEsc(r.nm)}</td>${[...Array(n)].map((_,q)=>`<td>${r.day[q]!=null?r.day[q]:'-'}</td>`).join('')}<td><b>${r.tot}</b></td></tr>`).join('')}</tbody></table>`}

function ifaaSetup(opts){opts=opts||{};cur=null;window._ifaav='setup';
 const ev=opts.ev||'',q=+opts.q||0,round0=opts.round||(ev==EV_ID&&DAYS[q]?DAYS[q].round:'IFAA Field Round'),date0=opts.date||(ev==EV_ID&&DAYS[q]?DAYS[q].date:(typeof today=='function'?today():''));
 const title=ev==EV_ID?EV_NAME:'IFAA Field or Hunter';
 const slots=window._ifaaSlots=window._ifaaSlots||DEF_N;
 const rounds=['IFAA Field Round','IFAA Hunter Round','IFAA Field unit (14 targets)','IFAA Hunter unit (14 targets)'];
 if(opts.round&&rounds.indexOf(opts.round)<0){ifaaSetupForm(title,'',date0,slots,'That link did not name an IFAA Field or Hunter round, so nothing was started. Pick a round below.',ev,q);return}
 ifaaSetupForm(title,opts.round&&rounds.indexOf(opts.round)>=0?opts.round:round0,date0,slots,null,ev,q)}
function ifaaSetupForm(title,round,date,slots,err,ev,q){
 const dayLab=ev==EV_ID&&DAYS[q]?DAYS[q].label:'';
 app.innerHTML=`<div id="ifaaview">${ifaaBack()}<div class="card dark"><span class="kicker">${ifaaEsc(title)}</span><h1>${dayLab?ifaaEsc(dayLab):'New IFAA card'}</h1>
 <p class="small" style="margin:4px 0 0">Type the names of the archers in your group. You score them all on this phone. 1 to 5 names. IFAA sanctioned marked rounds use groups of 3–4.</p></div>
 <div class="card"><label for="ifaadate">Date</label><input id="ifaadate" type="date" value="${ifaaEsc(date||'')}">
 <label for="ifaard">Official round</label><select id="ifaard">${['IFAA Field Round','IFAA Hunter Round','IFAA Field unit (14 targets)','IFAA Hunter unit (14 targets)'].map(r=>`<option value="${ifaaEsc(r)}"${r==round?' selected':''}>${ifaaEsc(r)}</option>`).join('')}</select>
 ${[...Array(slots)].map((_,i)=>`<label for="ifaan${i}">Archer ${i+1}</label><input id="ifaan${i}" data-ifaan="${i}" maxlength="40" autocomplete="off" autocapitalize="words" placeholder="Name">
  <div class="row" style="gap:6px;flex-wrap:wrap"><label class="small" style="flex:1">Style (optional)<select data-ifaast="${i}"><option value=""></option>${STYLES.map(s=>`<option>${s}</option>`).join('')}</select></label>
  <label class="small" style="flex:1">Division (optional)<select data-ifaaag="${i}">${AGES.map(s=>`<option${s=='Adult'?' selected':''}>${s}</option>`).join('')}</select></label></div>`).join('')}
 <div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start;margin:8px 0">${slots<MAX_N?'<button class="btn ghost" id="ifaaadd">Add archer</button>':''}${slots>1?'<button class="btn ghost" id="ifaarem">Remove last</button>':''}</div>
 <p class="small muted">A sixth name is not allowed.</p>
 <label for="ifaasc">Scorer (optional)</label><input id="ifaasc" maxlength="40" placeholder="First scorer">
 <label for="ifaact">Counter-scorer (optional)</label><input id="ifaact" maxlength="40" placeholder="Second scorer">
 <p class="small" id="ifaaerr" style="margin:6px 0 0"${err?'':' hidden'}>${ifaaEsc(err||'Type at least one name.')}</p>
 <button class="btn full" id="ifaago" style="margin-top:8px">Start</button></div></div>`;
 const keep=()=>({n:[...document.querySelectorAll('[data-ifaan]')].map(x=>x.value),s:[...document.querySelectorAll('[data-ifaast]')].map(x=>x.value),a:[...document.querySelectorAll('[data-ifaaag]')].map(x=>x.value),sc:$('#ifaasc').value,ct:$('#ifaact').value,rd:$('#ifaard').value,dt:$('#ifaadate').value});
 const re=(cnt,st)=>{window._ifaaSlots=cnt;ifaaSetupForm(title,st.rd,st.dt,cnt,null,ev,q);st.n.forEach((v,i)=>{const x=$('#ifaan'+i);if(x)x.value=v});st.s.forEach((v,i)=>{const x=document.querySelector(`[data-ifaast="${i}"]`);if(x)x.value=v});st.a.forEach((v,i)=>{const x=document.querySelector(`[data-ifaaag="${i}"]`);if(x)x.value=v});$('#ifaasc').value=st.sc;$('#ifaact').value=st.ct};
 const a=$('#ifaaadd');if(a)a.onclick=()=>{const st=keep();if(st.n.length>=MAX_N)return;re(Math.min(MAX_N,slots+1),st)};
 const r=$('#ifaarem');if(r)r.onclick=()=>re(Math.max(1,slots-1),keep());
 $('#ifaago').onclick=()=>{const st=keep(),d=ifaaNewDay({names:st.n,styles:st.s,ages:st.a,round:st.rd,date:st.dt,ev,scorer:st.sc,counter:st.ct});if(!d){$('#ifaaerr').hidden=false;return}window._ifaaSlots=null;ifaaView(d.id)};
 $('#ifaabk').onclick=()=>{window._ifaaSlots=null;ifaaHome()};scrollTo(0,0)}

function ifaaView(id){const E=ifaaEv();if(!E.days.length)return ifaaSetup();const d=ifaaDay(id)||E.days[E.days.length-1];E.open=d.id;cur=null;window._ifaav=d.id;
 const R=ROUNDS[d.round]||IFAA_ROUNDS[d.round],j=Math.min(d.at||0,d.a.length-1),x=d.a[j],run=ifaaRun(x.ends,R),fin=ifaaDone(x,R);
 let ti=(x.ends||[]).findIndex(e=>(e||[]).length<4);if(ti<0)ti=Math.min((x.ends||[]).length,R.ends-1);const e=(x.ends[ti]||[]),kind=R.ifaa||'field';
 const title=d.ev==EV_ID?EV_NAME:'IFAA group card';
 const chips=`<div class="row ifaa-chips" style="gap:6px;flex-wrap:wrap;justify-content:flex-start;margin:6px 0 8px">${d.a.map((y,q)=>{const r=ifaaRun(y.ends,R);return`<button class="lc-chip ifaa-chip${q==j?' on':''}" data-ifaaa="${q}" aria-pressed="${q==j}">${ifaaEsc(y.nm)} <span class="small">${ifaaDone(y,R)?'done ':'T'+(ifaaN(y)+1)+' · '}${r.day}</span></button>`}).join('')}</div>`;
 const tgt=`<div class="small muted">Target ${ti+1} of ${R.ends}${R.ends>14?` · Unit ${ti<14?1:2}`:''} · 4 arrows · ${kind=='hunter'?'Hunter · red peg':'Field · white peg'} · marked</div>
 <div class="row" style="justify-content:space-between;align-items:flex-end;margin:2px 0 6px"><b style="font-size:22px">Target ${ti+1}</b><b>Arrow ${Math.min(e.length+1,4)} of 4</b></div>
 <div class="aba-pad ifaa-pad" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${KEYS.map(k=>`<button class="aba-z" data-ifaak="${k}" style="min-height:60px;font-size:22px;font-weight:800;border-radius:12px;border:0;background:${k=='5'?'#ffd84d':k=='M'?'#64748b':k=='4'?'#334155':'#1e293b'};color:${k=='5'?'#111':'#fff'}" ${fin||e.length>=4?'disabled':''}>${k}</button>`).join('')}</div>
 <div class="row" style="gap:6px;margin-top:8px">${(e||[]).map((v,i)=>`<span class="adb" data-ifaaed="${ti},${i}" style="min-width:36px;text-align:center;font-weight:800">${v}</span>`).join('')}${(e||[]).length<4?`<span class="small muted">Need ${4-(e||[]).length} more</span>`:''}</div>`;
 const rows=d.a.map((y,q)=>{const r=ifaaRun(y.ends,R),t=r.tgt(ti);return`<tr data-ifaarow="${q}"${q==j?' class="lead"':''}><td>${ifaaEsc(y.nm)}</td><td>${t==null?'-':t}/20</td><td>${r.u1}/${r.uMax}</td>${r.two?`<td>${r.u2}/${r.uMax}</td>`:''}<td><b>${r.day}/${r.dayMax}</b></td><td>${d.ev==EV_ID?ifaaEventTot(y.nm,EV_ID)+'/1120':'-'}</td></tr>`}).join('');
 const ticks=`<div class="row" style="gap:10px;flex-wrap:wrap;margin-top:8px"><label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="ifaat1" ${d.tick1?'checked':''}> Scorer confirms${d.scorer?' ('+ifaaEsc(d.scorer)+')':''}</label>
 <label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="ifaat2" ${d.tick2?'checked':''}> Counter-scorer confirms${d.counter?' ('+ifaaEsc(d.counter)+')':''}</label></div>
 <p class="small muted">Optional. A day can be saved without ticks. Clearing a tick does not delete scores.</p>`;
 app.innerHTML=`<div id="ifaaview">${ifaaBack()}<div class="card dark"><span class="kicker">${ifaaEsc(title)}</span><h1 style="margin:2px 0">${ifaaEsc(d.round)}</h1>
 <p class="small" style="margin:2px 0 0">${ifaaEsc(ifaaDate(d.date))} · ${d.a.length} archer${d.a.length>1?'s':''} · ${R.ends} targets · ${R.ends*R.ape} arrows · max ${R.max}</p></div>
 <div class="card" id="ifaascore"><span class="kicker">Scoring</span>${chips}
 <div class="row" style="justify-content:space-between;align-items:center"><b style="font-size:20px" id="ifaawho">${ifaaEsc(x.nm)}</b><div style="text-align:right"><span class="small muted">Day total</span> <b style="font-size:24px;color:var(--gold)">${run.day}</b><span class="small muted"> / ${run.dayMax}</span></div></div>
 ${fin?`<p><b>${ifaaEsc(x.nm)}: round complete, ${run.day} / ${run.dayMax}</b></p>`:tgt}
 <p class="small muted" style="margin:8px 0 0">${ifaaLine(kind)}</p>
 ${ifaaRef(kind,x.age)}
 <div class="row" style="gap:8px;justify-content:flex-start;margin-top:10px"><button class="btn ghost" id="ifaaundo" ${ifaaN(x)||(e&&e.length)?'':'disabled'}>Undo</button></div></div>
 <div class="card"><span class="kicker">Totals</span>
 <table class="pg-tab"><thead><tr><th>Archer</th><th>This target /20</th><th>Unit 1 /${run.uMax}</th>${run.two?`<th>Unit 2 /${run.uMax}</th>`:''}<th>Day /${run.dayMax}</th><th>Event /1120</th></tr></thead><tbody>${rows}</tbody></table>
 <p class="small muted" style="margin:6px 0 0">Event total is Field + Hunter for this archer, matched by the typed name, once both Peel days exist. A 14-target unit has no second lap.</p></div>
 ${d.ev==EV_ID?`<div class="card"><span class="kicker">Event total · ${ifaaEsc(EV_NAME)}</span>${ifaaEvTable(EV_ID)}</div>`:''}
 ${ifaaAllDone(d)?`<div class="card" id="ifaasavecard"><span class="kicker">Day complete</span><h3 style="margin:2px 0 6px">All targets are scored</h3>
 ${d.saved?`<div class="list-item" style="border-left:4px solid #ffd84d;padding-left:8px"><b>Saved.</b> ${d.saved.a.map(y=>ifaaEsc(y.nm)+' '+y.tot).join(', ')} on this phone.${(d.saved.pb||[]).map(p=>`<div class="small">${ifaaEsc(p.nm)}: ${ifaaEsc(p.line)}</div>`).join('')}</div>`:`<p class="small">Scores are kept on this phone as you go. Tap Save to confirm the day. A personal best is only offered after you save, and only for a name that already has a profile on this phone.</p>`}
 ${ticks}
 <button class="btn${d.saved?' ghost':''} full" id="ifaasave" style="margin-top:8px;min-height:52px">${d.saved?'Saved. Tap to save again':'Save this day'}</button></div>`:`<div class="card">${ticks}</div>`}
 <div class="card"><button class="btn ghost" id="ifaadel">Delete this card</button></div></div>`;
 const rr=()=>ifaaView(d.id);
 app.querySelectorAll('[data-ifaaa]').forEach(b=>b.onclick=()=>{d.at=+b.dataset.ifaaa;save();rr()});
 app.querySelectorAll('[data-ifaak]').forEach(b=>b.onclick=()=>{ifaaHit(d,j,b.dataset.ifaak);rr()});
 app.querySelectorAll('[data-ifaaed]').forEach(b=>b.onclick=()=>{const [ti,ai]=b.dataset.ifaaed.split(',').map(Number);const nv=prompt('Change this arrow (5, 4, 3 or M)',(d.a[j].ends[ti]||[])[ai]||'');if(nv==null)return;const k=String(nv).trim().toUpperCase();if(KEYS.indexOf(k)<0)return;ifaaEdit(d,j,ti,ai,k);rr()});
 const u=$('#ifaaundo');if(u)u.onclick=()=>{ifaaUndo(d,j);rr()};
 const t1=$('#ifaat1');if(t1)t1.onchange=()=>{d.tick1=t1.checked;save()};
 const t2=$('#ifaat2');if(t2)t2.onchange=()=>{d.tick2=t2.checked;save()};
 const sv=$('#ifaasave');if(sv)sv.onclick=()=>{ifaaSave(d);rr()};
 $('#ifaabk').onclick=ifaaHome;
 $('#ifaadel').onclick=()=>{if(!confirm('Delete this IFAA card? Its scores are removed from this group card. Saved personal sessions stay in Past sessions.'))return;E.days=E.days.filter(y=>y!==d);E.open=E.days.length?E.days[E.days.length-1].id:null;save();E.days.length?ifaaView(E.open):ifaaHome()}}

/* ---------- deep link: #score?event=...&date=...&round=... (unknown params ignored; no redirects) ---------- */
function ifaaParseHash(){const h=String(location.hash||'');if(!/^#score(\?|$)/.test(h))return null;
 const q=new URLSearchParams(h.split('?')[1]||'');const ev=q.get('event')||'',date=q.get('date')||'',round=q.get('round')||'';
 return{ev,date,round}}
function ifaaClearHash(){try{if(/^#score(\?|$)/.test(location.hash))history.replaceState(null,'',location.pathname+location.search)}catch(e){}}
function ifaaFromHash(){const p=ifaaParseHash();if(!p)return false;
 if(p.ev&&p.ev!==EV_ID&&!isIfaaR(p.round))return false;/* ignore unknown events without an IFAA round */
 ifaaClearHash();
 const ev=p.ev==EV_ID?EV_ID:'';
 let date=p.date,round=p.round,q=0;
 if(ev){if(date==DAYS[1].date)q=1;else if(date==DAYS[0].date)q=0;else{date='';q=0}/* any other day: pick the day, do not guess the official round */
  if(round&&!isIfaaR(round)){ifaaSetup({ev,date:p.date,round:p.round,q});return true}
  if(!round){if(date==DAYS[0].date)round=DAYS[0].round;else if(date==DAYS[1].date)round=DAYS[1].round;else round=''}
  if(round==DAYS[1].round)q=1;if(round==DAYS[0].round)q=0}
 else if(round&&!isIfaaR(round)){ifaaSetup({ev:'',date,round,q:0});return true}
 ifaaSetup({ev,date:date||p.date,round,q});return true}
function ifaaStartSolo(round,date){if(!isIfaaR(round)||typeof ROUNDS=='undefined'||!ROUNDS[round])return false;
 S.lastRound=round;const s={id:'s'+Date.now(),date:date||(typeof today=='function'?today():''),round,ends:[[]],pos:[[]],note:'',lcT:1};
 if(typeof cur!='undefined')cur=s;S.sessions=S.sessions||[];S.sessions.push(s);if(typeof save=='function')save();
 if(typeof sv!='undefined')sv='entry';if(typeof score=='function'){score();scrollTo(0,0)}return true}

/* hook the group cards and hash without changing Peel 3D */
const _h2h=window.h2hCard;window.h2hCard=function(){return(_h2h?_h2h.apply(this,arguments):'')+ifaaCard()};
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#ifaacard [data-ifaad],#ifaacard [data-ifaenew],#ifaagencard [data-ifaenew]');if(!b)return;
 if(b.dataset.ifaad)return ifaaView(b.dataset.ifaad);ifaaSetup({ev:b.dataset.ifaenew||'',q:+b.dataset.ifaq||0})});
const _render=window.render;if(typeof _render=='function'){/* render is not on window; hook hash at the bottom */}
addEventListener('hashchange',()=>{if(ifaaFromHash()){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}}});
/* initial hash after unlock: handled from a patched render in app.js via window.ifaaFromHash */

Object.assign(window,{
 IFAA_KEYS:KEYS,IFAA_EV_ID:EV_ID,IFAA_EV_NAME:EV_NAME,IFAA_DAYS:DAYS,IFAA_ROUNDS,IFAA_UNIT:UNIT,
 isIfaaRound:isIfaaR,ifaaRun,ifaaKnown,ifaaWriteSess,ifaaNewDay,ifaaHit,ifaaUndo,ifaaNext,ifaaSave,ifaaEdit,ifaaAllDone,ifaaTot,ifaaN,ifaaDone,ifaaEventTot,ifaaEv,ifaaView,ifaaSetup,ifaaCard,ifaaFromHash,ifaaStartSolo,ifaaLine,ifaaRef,ifaaPbLine
});
})();
