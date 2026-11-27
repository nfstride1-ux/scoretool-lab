/* Scorecards (13 Nov 2026, Nathe). Practice scores grouped as Target, Indoor, Field, Clout and 3D,
   with official personal bests on the same page. Tapping a shoot opens the finished scorecard.
   Classification is in memory only. Opening a card does not rewrite the session. Delete removes that saved score when the archer confirms. */
(function(){
const CATS=['Target','Indoor','Field','Clout','3D'];
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const catFromDisc=d=>({Outdoor:'Target',Target:'Target',Indoor:'Indoor',Field:'Field',Clout:'Clout','3D':'3D'}[d]||'Target');

/* A session already marked as a competition result stays out of the practice groups.
   A calendar send on its own is not official: practice rounds can be on the calendar too.
   Group-card days (s.pg) stay on their own card and are not listed here. */
function isOfficialSession(s){
 if(!s||s.pg)return !!s&&!!s.pg;
 const src=String(s.src||'').toLowerCase();
 return src==='paper'||src==='official'||src==='comp'||src==='imported'||s.official===true;
}

function practiceCat(round){
 const name=String(round||''),R=(typeof ROUNDS==='object'&&ROUNDS[name])||{};
 try{
  const c=(S.customRounds||[]).find(x=>x&&x.name===name);
  if(c){const d=c.kind==='3d'?'3d':(c.disc||'target');return {target:'Target',indoor:'Indoor',field:'Field',clout:'Clout','3d':'3D'}[d]||'Target'}
  const ret=(S.retiredRounds||{})[name];
  if(ret){const d=ret.kind==='3d'?'3d':(ret.disc||'target');return {target:'Target',indoor:'Indoor',field:'Field',clout:'Clout','3d':'3D'}[d]||'Target'}
 }catch(e){}
 if(R.aba||R.kind==='3d'||/\b3d\b|3-d/i.test(name))return '3D';
 if(R.clout||/clout/i.test(name))return 'Clout';
 if(R.ifaa||(typeof isIfaa==='function'&&isIfaa(R)))return 'Field';
 let F=null;try{F=typeof faceR==='function'?faceR(R,0):null}catch(e){}
 if((F&&typeof isFld==='function'&&isFld(F))||(/field/i.test(name)&&!/ifaa/i.test(name)))return 'Field';
 if(R.vegas||R.lancaster||/indoor|vegas/i.test(name))return 'Indoor';
 return 'Target';
}

function shootTotal(s){try{return total(s)}catch(e){return 0}}
function hasArrows(s){try{return arrowsIn(s)>0}catch(e){return !!(s.ends||[]).some(e=>e&&e.length)}}

function practiceShoots(){
 return (typeof allSessions==='function'?allSessions():(S.sessions||[]).slice()).filter(s=>{
  if(!s||s.pg)return false;
  return hasArrows(s)||!!s.finished||(typeof isDone==='function'&&isDone(s));
 }).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.id).localeCompare(String(a.id||'')));
}

function groups(){
 const g={Target:[],Indoor:[],Field:[],Clout:[],'3D':[]};
 practiceShoots().forEach(s=>{const c=practiceCat(s.round);(g[c]||(g[c]=[])).push(s)});
 return g;
}

function shootButton(s){
 const open=!!(typeof ROUNDS==='object'&&ROUNDS[s.round]);
 const bits=[esc(typeof fmtD==='function'?fmtD(s.date):s.date)];
 if(s.sample)bits.push('<span class="sample">sample data</span>');
 if(String(s.src||'').toLowerCase()==='paper')bits.push('<span class="real">competition · paper sheet</span>');
 if(typeof isIncS==='function'&&isIncS(s))bits.push('<span class="sample inc-tag">Incomplete</span>'+(typeof incProg==='function'?incProg(s):''));
 const line=`<b>${shootTotal(s)}</b> · ${esc(s.round)}<span class="small muted" style="display:block;font-weight:600">${bits.join(' ')}</span>`;
 const btn=open?`<button type="button" class="btn ghost sc-open" data-open="${esc(s.id)}">${line}</button>`:`<div class="sc-open">${line}<p class="small muted" style="margin:4px 0 0">This round is kept under ${esc(s.round)}.</p></div>`;
 const del=s.sample?'':`<button type="button" class="btn ghost" data-drop="${esc(s.id)}" style="margin-top:6px">Delete</button>`;
 const extra=`${typeof noteBox==='function'?noteBox(s):''}${window.calRowHtml?calRowHtml(s):''}${window.phBoxHtml&&s.id?phBoxHtml(s.id,'row'):''}`;
 const more=extra.trim()?`<details class="sc-more"><summary class="small">Notes, photo and calendar</summary>${extra}</details>`:'';
 return `<div class="list-item" data-scrow="${esc(s.id)}">${btn}${del}${more}</div>`;
}

function practiceHTML(){
 const g=groups();
 return `<p class="small muted" id="scintro" style="margin:0 0 10px">Practice scores, grouped by the round. Tap a shoot to open the scorecard.</p>`+
  CATS.map(c=>{const L=g[c]||[];
   return `<div class="card" id="sccat-${c.replace(/\s/g,'').toLowerCase()}" data-sccat="${c}"><h2 style="margin:0 0 4px">${c}</h2>`+
    (L.length?L.map(shootButton).join(''):`<p class="small muted" style="margin:6px 0 0">No shoots in ${c} yet.</p>`)+`</div>`}).join('');
}

/* Casual shoots (22 Nov 2026). A finished casual shoot is its own record in S.casual, not a session in
   S.sessions -- it can include guests who have no ScoreTool account at all, scored by the host. The
   Score tab's Casual board only ever shows shoots still being scored (by design, since 21 Nov), so once
   a shoot is finished this card is the only way back into it: its full combined scorecard (csView, with
   every archer, guest or not), not the single-archer session view the practice groups above use. */
function casualShoots(){
 if(typeof csAll!=='function'||typeof csFin!=='function')return [];
 return csAll().filter(cs=>cs&&cs.status!=='declined'&&cs.status!=='invite'&&csFin(cs))
  .sort((a,b)=>(b.fint||b.pt||0)-(a.fint||a.pt||0));
}
function casualButton(cs){
 const n=(cs.ppl||[]).length,guests=(cs.ppl||[]).filter(p=>p&&!p.tid).length;
 const bits=[esc(typeof fmtD==='function'?fmtD(cs.date):cs.date),esc(typeof plN==='function'?plN(n,'person','people'):n+' people')];
 if(guests)bits.push(esc(typeof plN==='function'?plN(guests,'guest','guests'):guests+' guests'));
 if(cs.mp&&cs.mp.on)bits.push('match play');
 const line=`<b>${esc(cs.name||'Casual shoot')}</b><span class="small muted" style="display:block;font-weight:600">${esc(cs.round)}<br>${bits.join(' &middot; ')}</span>`;
 return `<div class="list-item" data-cscrow="${esc(cs.code)}"><button type="button" class="btn ghost sc-open" data-csopen2="${esc(cs.code)}">${line}</button></div>`;
}
function casualHTML(){
 const L=casualShoots();
 if(!L.length)return '';
 return `<div class="card" id="sccat-casual" data-sccat="Casual shoots"><h2 style="margin:0 0 4px">Casual shoots</h2><p class="small muted" style="margin:0 0 8px">Every finished casual shoot on this phone, with everyone's score, including guests who don't have the app. Tap to open the full scorecard.</p>${L.map(casualButton).join('')}</div>`;
}

function officialHTML(){
 const ready=window._bsReady!==false;
 if(!ready)return `<div class="card" id="scpb"><span class="kicker">Official</span><h2 style="margin:2px 0 8px">Official personal bests</h2><p class="small muted">Loading your official scores…</p></div>`;
 const pack=window.officialPbRows?officialPbRows():{bow:'',bows:[],rows:[]};
 const by={Target:[],Indoor:[],Field:[],Clout:[],'3D':[]};
 (pack.rows||[]).forEach(g=>{const c=catFromDisc(g.disc);(by[c]||by.Target).push(g)});
 const bows=(pack.bows||[]).length>1?`<div class="bs-bows" id="scbows">${pack.bows.map(b=>`<button type="button" data-scbow="${esc(b)}" class="${b==pack.bow?'on':''}">${esc(b)}</button>`).join('')}</div>`:'';
 const lines=CATS.map(c=>{const L=by[c]||[];if(!L.length)return `<div class="list-item" data-scpb="${c}"><b>${c}</b><div class="small muted">No official personal best yet.</div></div>`;
  const top=L.slice().sort((a,b)=>b.best.sc-a.best.sc||String(a.best.d).localeCompare(String(b.best.d)))[0];
  return `<div class="list-item" data-scpb="${c}"><b>${c}</b> · ${top.best.sc}<div class="small muted">${esc(top.rd)} · ${esc(top.best.date)}${top.best.ev?' · '+esc(top.best.ev):''} <span class="real">official</span></div></div>`}).join('');
 const all=CATS.map(c=>{const L=(by[c]||[]).slice().sort((a,b)=>b.best.sc-a.best.sc||String(a.rd).localeCompare(String(b.rd)));if(!L.length)return '';
  return `<h3 style="margin:12px 0 4px">${c}</h3>`+L.map(g=>`<div class="list-item" data-scpbr="${esc(g.rd)}"><b>${g.best.sc}</b> · ${esc(g.rd)}<div class="small muted">${esc(g.best.date)}${g.best.ev?' · '+esc(g.best.ev):''} <span class="real">official</span></div></div>`).join('')}).join('');
 return `<div class="card" id="scpb"><span class="kicker">Official</span><h2 style="margin:2px 0 8px">Official personal bests</h2>${pack.bow?`<p class="small muted" style="margin:0 0 8px">${esc(pack.bow)}. Best full official score in each category. Practice scores are not included.</p>`:'<p class="small muted" style="margin:0 0 8px">Best full official score in each category. Practice scores are not included.</p>'}${bows}${lines}</div>
  <div class="card" id="scpb-all"><h2 style="margin:2px 0 8px">Every official round</h2><p class="small muted" style="margin:0 0 8px">Your best full score on each official round.</p>${all||'<p class="small muted">No official scores on this phone yet.</p>'}</div>`;
}

function scorecardsView(){
 app.innerHTML=`<div id="scorecards">${practiceHTML()}${casualHTML()}${officialHTML()}</div>`;
 if(typeof bindNotes==='function')bindNotes();
 if(window.calRowBind)calRowBind(app);
 app.querySelectorAll('[data-scbow]').forEach(b=>b.onclick=()=>{window._scBow=b.dataset.scbow;scorecardsView()});
 app.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openScorecard(b.dataset.open,'scorecards'));
 app.querySelectorAll('[data-csopen2]').forEach(b=>b.onclick=()=>{if(typeof csView==='function')csView(b.dataset.csopen2)});
 app.querySelectorAll('[data-drop]').forEach(b=>b.onclick=()=>{if(typeof dropScore==='function'&&dropScore(b.dataset.drop))scorecardsView()});
}

function openScorecard(id,back){
 const s=(S.sessions||[]).find(x=>x&&String(x.id)===String(id));
 if(!s||typeof ROUNDS!=='object'||!ROUNDS[s.round]){nav('scorecards');return}
 window._sheetBack=back||'scorecards';
 cur=s;sv='sheet';fix=null;justDone=false;
 try{history.pushState({scoring:1},'')}catch(e){}
 nav('score');scrollTo(0,0);
}

window.EXTRA_VIEWS=Object.assign(window.EXTRA_VIEWS||{},{scorecards:scorecardsView});
Object.assign(window,{scorecardsView,openScorecard,scorecardCat:practiceCat,scorecardGroups:groups,scorecardOfficial:isOfficialSession});
})();
