/* C11 (11 Nov 2026): Past Scores — Official and Practice tabs, type filter, and analysis.
   Existing sessions are classified in memory only. Nothing stored is rewritten. */
(function(){
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* Official if a clear competition marker is already on the session; otherwise Practice.
   Missing src (Just me Start) is Practice. Calendar send alone is not official, because practice
   can also be marked On Archery Calendar. Group-card event days (Peel, IFAA with an event id)
   count as official without writing a new field. */
function isOfficialSession(s){
  if(!s)return false;
  const src=String(s.src||'').toLowerCase();
  if(src==='paper'||src==='official'||src==='comp'||src==='imported')return true;
  if(s.official===true||s.pg)return true;
  if(s.calEv){
    try{
      const ev=typeof calEvOf==='function'?calEvOf(s):null;
      if(ev&&ev.official)return true;
    }catch(e){}
    try{
      const days=[].concat((S.ifaa&&S.ifaa.days)||[],(S.peel&&S.peel.days)||[]);
      if(days.some(d=>d&&d.ev&&d.ev===s.calEv&&d.a&&d.a.some(x=>x&&x.sid===s.id)))return true;
    }catch(e){}
  }
  try{
    const days=((S.ifaa&&S.ifaa.days)||[]);
    if(days.some(d=>d&&d.ev&&d.a&&d.a.some(x=>x&&x.sid===s.id)))return true;
    const peel=((S.peel&&S.peel.days)||[]);
    if(peel.some(d=>d&&d.a&&d.a.some(x=>x&&(x.sid===s.id||d===s))))return true;
  }catch(e){}
  return false;
}

function shootTypeOf(round){
  const name=String(round||''),R=(typeof ROUNDS==='object'&&ROUNDS[name])||{};
  if(R.ifaa||/ifaa/i.test(name)||/ifaa/i.test(R.face||''))return'IFAA';
  if(R.aba||/aba/i.test(name))return'ABA';
  if(R.ibo||/ibo/i.test(name))return'IBO';
  if(R.asa||/asa/i.test(name))return'ASA';
  if(R.clout||/clout/i.test(name))return'Clout';
  let F=null;try{F=typeof faceR==='function'?faceR(R,0):null}catch(e){}
  if((F&&typeof isFld==='function'&&isFld(F)&&!(typeof isIfaa==='function'&&isIfaa(R)))||(/field/i.test(name)&&!/ifaa/i.test(name)))return'Field';
  if(/indoor|vegas/i.test(name))return'Indoor';
  try{
    const c=(S.customRounds||[]).find(x=>x.name===name);
    if(c){
      const d=c.kind==='3d'?'3d':c.disc;
      return({target:'Outdoor',indoor:'Indoor',field:'Field',clout:'Clout','3d':'3D'}[d]||'Outdoor');
    }
  }catch(e){}
  if(/3d|3-d/i.test(name))return'3D';
  return'Outdoor';
}

function shootTypesSupported(){
  const set=new Set();
  try{Object.keys(ROUNDS||{}).forEach(r=>{if(ROUNDS[r]&&!ROUNDS[r].legacy)set.add(shootTypeOf(r))})}catch(e){}
  try{(S.customRounds||[]).forEach(c=>set.add(shootTypeOf(c.name)))}catch(e){}
  try{(typeof offRounds==='function'?offRounds():[]).forEach(o=>set.add(shootTypeOf(o.round)))}catch(e){}
  const order=['Indoor','Outdoor','Field','IFAA','Clout','3D','ABA','ASA','IBO'];
  const extra=[...set].filter(x=>!order.includes(x)).sort();
  return['All',...order.filter(x=>set.has(x)),...extra];
}

function allPastSessions(){return(typeof allSessions==='function'?allSessions():(S.sessions||[])).slice()}

function officialResultRows(){
  const have=new Set(allPastSessions().map(s=>[s.date,s.round,typeof total==='function'?total(s):0].join('|')));
  const rows=[];
  const add=(o,src)=>{
    const date=o.date||o.d,round=o.round||o.rd,score=o.score!=null?o.score:o.sc;
    if(!round||score==null)return;
    const k=[date,round,score].join('|');
    if(have.has(k))return;have.add(k);
    rows.push({kind:'result',date,round,score,event:o.event||o.ev||'',src:src||o.src||'official',ends:o.ends||[]});
  };
  try{(typeof offRounds==='function'?offRounds():[]).forEach(o=>add(o,'official'))}catch(e){}
  try{(typeof findReal==='function'?findReal(S.profile||''):[]).forEach(o=>add(o,'official'))}catch(e){}
  return rows.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}

function filterList(tab,typ){
  const sess=allPastSessions().filter(s=>tab==='official'?isOfficialSession(s):!isOfficialSession(s));
  const out=sess.filter(s=>typ==='All'||shootTypeOf(s.round)===typ).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.id).localeCompare(String(a.id||'')));
  const results=(tab==='official'?officialResultRows():[]).filter(r=>typ==='All'||shootTypeOf(r.round)===typ);
  return{sess:out,results};
}

function sessionRow(s){
  return`<div class="list-item row" style="align-items:flex-start"><div style="flex:1;min-width:0"><b>${total(s)}</b> · ${h(s.round)}<div class="small muted">${h(s.date)} ${s.sample?'<span class="sample">sample data</span>':''}${s.src=='paper'?' <span class="real">competition · paper sheet</span>':''}${typeof isIncS==='function'&&isIncS(s)?' <span class="sample inc-tag">Incomplete</span>'+(typeof incProg==='function'?incProg(s):''):''}</div>${typeof noteBox==='function'?noteBox(s):''}${window.calRowHtml?calRowHtml(s):''}${window.phBoxHtml&&s.id?phBoxHtml(s.id,'row'):''}</div>${s.sample?'':`<span class="sess-act">${ROUNDS[s.round]?`<button class="btn ghost" data-open="${h(s.id)}">Open</button>`:''}<button class="btn ghost" data-del="${h(s.id)}" aria-label="delete">🗑</button></span>`}</div>`;
}

function resultRow(r){
  return`<div class="list-item row" style="align-items:flex-start"><div style="flex:1;min-width:0"><b>${h(r.score)}</b> · ${h(r.round)}<div class="small muted">${h(r.date)}${r.event?' · '+h(r.event):''} <span class="real">official result</span></div><p class="small muted" style="margin:6px 0 0">Stored with your past competition results. Open, delete, notes, calendar and photos apply to scores saved on this phone.</p></div></div>`;
}

function pastAnalysisHTML(sess){
  const doneS=sess.filter(s=>typeof isDone==='function'?isDone(s):(s.ends&&s.ends.length));
  if(!doneS.length){
    const any=sess.length;
    return`<div class="card" id="pastan"><span class="kicker">Analysis</span><h2 style="margin:2px 0 6px">For this filter</h2><p class="small muted">${any?'Finished rounds in this filter will show a PB, average, trend and score per end or target.':'No scores in this filter yet.'}</p></div>`;
  }
  const tot=doneS.map(s=>total(s)),avg=tot.reduce((a,b)=>a+b,0)/tot.length,pb=Math.max(...tot);
  const roll=tot.map((_,i)=>{const w=tot.slice(Math.max(0,i-2),i+1);return w.reduce((a,b)=>a+b)/w.length});
  const pbLine=tot.map((_,i)=>Math.max(...tot.slice(0,i+1)));
  const labels=doneS.map(s=>String(s.date||'').slice(5));
  const unit=doneS.some(s=>{const R=ROUNDS[s.round];return R&&(R.aba||R.ifaa)})?'target':'end';
  const nE=Math.max(...doneS.map(s=>(s.ends||[]).length),1);
  const endAvg=[...Array(nE)].map((_,i)=>{const v=doneS.map(s=>s.ends&&s.ends[i]&&s.ends[i].length?endSum(s.ends[i]):null).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:0});
  const last=doneS[doneS.length-1],lastEnds=(last.ends||[]).map(e=>endSum(e||[]));
  const trend=typeof lineChart==='function'?lineChart([{name:'Score',data:tot,c:'#1d4ed8'},{name:'3-session average',data:roll,c:'#e0a800',dash:1},{name:'PB',data:pbLine,c:typeof CBC==='function'?CBC('#16a34a','#ffffff'):'#16a34a',w:1.5,dash:1}],{labels,markers:typeof setupMarkers==='function'?setupMarkers(doneS.map(s=>s.date)):[]}):'';
  const per=typeof endChart==='function'?endChart(lastEnds,(last.ends||[]).map(e=>(e||[]).length),null):'';
  const avgEnds=typeof endChart==='function'?endChart(endAvg.map(x=>Math.round(x*10)/10),endAvg.map(()=>1),null):'';
  return`<div class="card" id="pastan"><span class="kicker">Analysis</span><h2 style="margin:2px 0 6px">For this filter</h2>
   <div class="stats" style="grid-template-columns:1fr 1fr 1fr"><div class="stat"><b>${pb}</b>PB</div><div class="stat"><b>${Math.round(avg)}</b>Average</div><div class="stat"><b>${doneS.length}</b>Finished ${doneS.length===1?'round':'rounds'}</div></div>
   <h3 style="margin:14px 0 6px">Trend over time</h3>${trend||'<p class="small muted">Trend uses the existing practice stats chart.</p>'}
   <h3 style="margin:14px 0 6px">Score per ${unit} · ${h(last.date)} · ${h(last.round)}</h3>${per||'<p class="small muted">End or target scores show when a finished round in this filter has arrows.</p>'}
   ${doneS.length>1?`<h3 style="margin:14px 0 6px">Average per ${unit} across these rounds</h3>${avgEnds}`:''}
  </div>`;
}

function pastScores(){
  if(window.LABSEC)LABSEC.lab_past='home';
  const tab=window._pastTab==='practice'?'practice':'official';
  const types=shootTypesSupported();
  const typ=types.includes(window._pastType)?window._pastType:'All';
  const {sess,results}=filterList(tab,typ);
  const empty=tab==='official'
    ?'No official scores in this filter. Paper sheets, imported or official results, and group-card event days show here. Just me rounds without those markers stay under Practice.'
    :'No practice scores in this filter. Rounds you start under Just me, and your own practice rounds, show here unless they have a competition marker.';
  const list=[...sess.map(sessionRow),...results.map(resultRow)].join('')||`<p class="small muted">${empty}</p>`;
  const typeOpts=types.map(t=>`<option value="${h(t)}" ${t===typ?'selected':''}>${h(t==='Outdoor'?'Outdoor / Target':t)}</option>`).join('');
  app.innerHTML=`<div class="card" id="pastcard"><span class="kicker">Past Scores</span><h2 style="margin:2px 0 10px">Past Scores</h2>
   <div class="labseg" role="tablist" aria-label="Official or practice"><button type="button" data-pasttab="official" aria-pressed="${tab==='official'}">Official</button><button type="button" data-pasttab="practice" aria-pressed="${tab==='practice'}">Practice</button></div>
   <label for="pasttype" class="small" style="display:block;margin:10px 0 4px">Shoot type</label>
   <select id="pasttype">${typeOpts}</select>
   <p class="small muted" style="margin:8px 0 0">${sess.length?sess.length+' score'+(sess.length===1?'':'s')+' on this phone':''}${results.length?(sess.length?' · ':'')+results.length+' official result'+(results.length===1?'':'s'):''}${!sess.length&&!results.length?'Filtered list':''}.</p>
  </div>
  ${pastAnalysisHTML(sess)}
  <div class="card" id="pastlist"><h3>${tab==='official'?'Official':'Practice'} scores</h3>${list}</div>`;
  if(typeof bar==='function')bar('Past Scores','home','Home');
  app.querySelectorAll('[data-pasttab]').forEach(b=>b.onclick=()=>{window._pastTab=b.dataset.pasttab;pastScores()});
  const sel=$('#pasttype');if(sel)sel.onchange=()=>{window._pastType=sel.value;pastScores()};
  if(typeof bindNotes==='function')bindNotes();
  if(window.calRowBind)calRowBind(app);
  app.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{const x=S.sessions.find(s=>s.id==b.dataset.open);if(!x)return;cur=x;sv='sheet';fix=null;justDone=false;history.pushState({scoring:1},'');score();scrollTo(0,0)});
  app.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.del,item=S.sessions.find(s=>s.id==id);
    if(item&&window.acctSoftDelete)acctSoftDelete('session',item);
    S.sessions=S.sessions.filter(s=>s.id!=id);save();pastScores()});
}

E.lab_past=pastScores;
Object.assign(window,{pastScores,pastIsOfficial:isOfficialSession,pastShootType:shootTypeOf,pastTypes:shootTypesSupported,pastFilter:filterList});
})();
