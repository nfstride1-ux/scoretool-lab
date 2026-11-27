/* Finished rounds -> the archer's My events on Archery Calendar (22 Oct 2026).
   Link once: Me › Settings › Archery Calendar (or the one-time prompt) opens archerycalendars.com/#/scoretool, where the archer signs in
   and taps Link. The calendar hands back a secret that can ONLY add/update this archer's own ScoreTool scores (supabase/scoretool_scores.sql
   in the calendar repo). Stored data: NEW keys only (scoretool.cal.<tester>.*). Scores already finished before this update are never sent,
   and no score, session or other stored record is changed. Never blocks scoring: everything is async and silent on failure. */
(function(){
const SB='https://sllsqpfqwckwtljzjxli.supabase.co',KEY_PUB='sb_publishable_t2g3KYdoGeTtcXTO-URK9g_Nf69SEFq',CAL='https://archerycalendars.com/';
const WHO=()=>typeof TESTER!='undefined'&&TESTER&&TESTER.id||null;
const K=n=>'scoretool.cal.'+WHO()+'.'+n,get=n=>{try{return JSON.parse(localStorage.getItem(K(n))||'null')}catch(e){return null}},put=(n,v)=>localStorage.setItem(K(n),JSON.stringify(v));
const TARGET=/scoretool-lab/.test(location.pathname)?'lab':'demo';
const linkUrl=()=>CAL+'#/scoretool?to='+TARGET;
const okTok=t=>/^[0-9a-f]{48}$/.test(t||'');
let state={err:'',live:null,busy:false};
/* the calendar sends the secret back as #stcal=... (never sent to any server); keep it, then tidy the address */
function takeHash(){const m=/^#stcal=([0-9a-f]{48})$/.exec(location.hash||'');if(!m)return;
 if(WHO()){put('link',m[1]);put('prompted',1);state.err='';setTimeout(()=>{toast2('Linked to your Archery Calendar. Finished rounds will show in My events.');tick()},300)}else sessionStorage.setItem('scoretool.cal.pending',m[1]);
 history.replaceState(history.state,'',location.pathname+location.search)}
takeHash();addEventListener('hashchange',takeHash);
function adoptPending(){const p=sessionStorage.getItem('scoretool.cal.pending');if(p&&WHO()&&okTok(p)){put('link',p);put('prompted',1);sessionStorage.removeItem('scoretool.cal.pending')}}
/* Event ties (23 Oct 2026): a score can be tied to an Archery Calendar event. Kept under the NEW key scoretool.cal.<tester>.events
   ({sessionId:{id,name,club,date,fun,official,send}}); the score record itself is never changed. A tie made by the archer ('send')
   also sends that score to My events, even if it was shot before the link or isn't finished (the total so far, marked partial). */
const evs=()=>get('events')||{};
window.calEvOf=s=>{if(!WHO()||!s||!s.id)return null;try{seedNathe()}catch(e){}return evs()[s.id]||null};
window.calSetEv=(id,o)=>{if(!WHO()||!id)return;const E=evs();if(o)E[id]=o;else delete E[id];put('events',E);setTimeout(tick,50)};
/* Nathe asked (23 Oct) for his 18 Oct 2026 score to show on that day's Melville 3D in My events: tie it once, his own score only */
function seedNathe(){} /* 25 Nov 2026: per-person seed removed */
const forced=s=>{const e=s&&s.id&&evs()[s.id];return !!(e&&e.send&&!s.sample&&Array.isArray(s.ends)&&ROUNDS[s.round]&&arrowsIn(s)>0)};
const tiedRound=s=>{const e=evs()[s.id];if(!e)return null;const R=ROUNDS[s.round],n=s.ends.filter(x=>x&&x.length).length;
 return (e.name+(R.aba?' · ABA scoring':'')+(e.full&&e.res&&e.res.pos==1?' · 1st '+e.res.div:'')+(e.full||isFull(s)?'':' (partial: '+n+' of '+R.ends+(R.aba?' targets)':' ends)'))).slice(0,120)};
const finished=s=>s&&!s.sample&&Array.isArray(s.ends)&&ROUNDS[s.round]&&(isDone(s)||(!!s.finished&&arrowsIn(s)>0));
const maxOf=s=>{const R=ROUNDS[s.round];if(!isFull(s))return null;const m=bugsOn(s)?R.ends*R.ape*6:R.max;return m>0&&m<=5000?m:null};
/* C1 (6 Nov 2026, Nathe): a finished full round that is the Personal bests card's PB for that round is sent with " (PB)" on the round string.
   Same comparison as that card (window.bsCurrentPb). No new column. The tag is kept inside the existing 120-character round. */
const PBTAG=' (PB)';
function withPb(label,on){const s=String(label||'');if(!on)return s.slice(0,120);return s.slice(0,120-PBTAG.length)+PBTAG}
function sessionIsPb(s){if(!s||s.sample||typeof isFull!='function'||!isFull(s)||!(total(s)>0)||typeof window.bsCurrentPb!='function')return false;
 const b=window.bsCurrentPb(s.round);return !!(b&&b.date==s.date&&+b.score==total(s))}
function roundOut(s){return withPb(tiedRound(s)||s.round,sessionIsPb(s))}
function locOf(s){const t=tiedRound(s),c=t&&evs()[s.id]?evs()[s.id].club:s.loc;return c?String(c).slice(0,120):null}
const sig=s=>JSON.stringify([s.date,roundOut(s),total(s),maxOf(s),locOf(s)]);
/* The first run still records which rounds were already finished. C2 (6 Nov 2026, Nathe) sends those too:
   practice and club alike. A round is sent once per source id, and again only when the payload changed. */
function baseline(){if(get('base'))return;put('base',(S.sessions||[]).filter(finished).map(s=>s.id))}
/* 'force' (23 Oct 2026): ids of past finished rounds the archer chose to send untied (Send to Archery Calendar) */
const forceSet=()=>new Set(get('force')||[]);
function todo(){const gone=new Set(get('discarded')||[]),sent=get('sent')||{};return (S.sessions||[]).filter(s=>(forced(s)||finished(s))&&!gone.has(s.id)&&sent[s.id]!==sig(s))}
window.calDiscard=id=>{if(!WHO()||!id)return;const d=get('discarded')||[];if(!d.includes(id)){d.push(id);put('discarded',d.slice(-500))}};
async function postScore(body){const r=await fetch(SB+'/rest/v1/rpc/scoretool_save_score',{method:'POST',headers:{apikey:KEY_PUB,Authorization:'Bearer '+KEY_PUB,'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(r.ok)return 'ok';const j=await r.json().catch(()=>({}));if(r.status==404||/PGRST202/.test(j.code||''))return 'off';if(/not linked/i.test(j.message||''))return 'unlinked';return 'err'}
async function send(s,tok){return postScore({p_token:tok,p_source_id:WHO()+':'+s.id,p_shot_date:s.date,p_round:roundOut(s),p_score:total(s),p_max:maxOf(s),p_location:locOf(s)})}
/* C3 (6 Nov 2026, Nathe): official scoresheets (sheet-), competition results that are not a scoresheet (diary-), and My results
   imports (imp-) are queued too, once each. A row that matches an already-sent score on date + round + score is skipped.
   A diary note with no round or score is not a score, so it is not sent. The (PB) rule is the same one. */
function slugId(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,32)}
function srcId(prefix,date,round,score,event,given){if(given){let g=String(given);if(g.indexOf(prefix)==0)return g.slice(0,80);if(prefix=='imp-'&&g.indexOf('imp')==0)g=g.slice(3).replace(/^-/,'');return (prefix+g).slice(0,80)}
 return (prefix+date+'-'+score+'-'+slugId(round)+'-'+slugId(event)).slice(0,80)}
function dayOf(d){return typeof normDate=='function'?normDate(d):d}
function maxKnown(round){const R=typeof ROUNDS!='undefined'&&ROUNDS[round];if(!R||R.aba)return null;const m=R.max;return m>0&&m<=5000?m:null}
function recPb(round,date,score){if(!(score>0)||typeof window.bsCurrentPb!='function')return false;const b=window.bsCurrentPb(round);return !!(b&&b.date==date&&+b.score==+score)}
function sameSent(date,round,score){const sent=get('sent')||{};
 if((S.sessions||[]).some(s=>s&&!s.sample&&sent[s.id]&&s.date==date&&String(s.round)==String(round)&&total(s)==+score))return true;
 return Object.keys(sent).some(id=>{try{const a=JSON.parse(sent[id]);if(!a)return false;return a[0]==date&&String(a[1]||'').replace(/ \(PB\)$/,'')==String(round)&&+a[2]==+score}catch(e){return false}})}
function extraRows(){const rows=[],seen=new Set();
 const add=x=>{if(!x||x.incomplete||!x.date||!x.round||!(+x.score>0))return;const k=x.date+'|'+x.round+'|'+x.score;if(seen.has(k))return;seen.add(k);rows.push(x)};
 if(typeof findReal=='function')findReal(S.profile||'').forEach(r=>{const date=dayOf(r.date);add({id:srcId(r.sheet?'sheet-':'diary-',date,r.round,r.score,r.event||''),date,round:String(r.round),score:+r.score,max:maxKnown(r.round),loc:r.club?String(r.club).slice(0,120):null,incomplete:!!r.incomplete})});
 if(window.importedShoots)window.importedShoots().forEach(s=>add({id:srcId('imp-',s.date,s.round,s.score,s.event||'',s.id),date:s.date,round:String(s.round),score:+s.score,max:maxKnown(s.round),loc:null}));
 if(window.officialAdded)window.officialAdded().forEach(s=>add({id:srcId('off-',s.date,s.round,s.score,s.event||'',s.id),date:s.date,round:String(s.round),score:+s.score,max:s.max>0?+s.max:maxKnown(s.round),loc:null}));
 return rows}
function extraTodo(){const gone=new Set(get('discarded')||[]),sent=get('sent')||{};
 return extraRows().filter(x=>{if(gone.has(x.id)||sameSent(x.date,x.round,x.score))return false;const label=withPb(x.round,recPb(x.round,x.date,x.score));x._round=label;x._sig=JSON.stringify([x.date,label,x.score,x.max,x.loc||null]);return sent[x.id]!==x._sig})}
async function sendExtra(x,tok){return postScore({p_token:tok,p_source_id:WHO()+':'+x.id,p_shot_date:x.date,p_round:x._round,p_score:x.score,p_max:x.max,p_location:x.loc})}
async function tick(){if(window.ADMIN_VIEW){window.avSkip&&avSkip('calendar');return 0}let k=0;try{if(!WHO()||typeof S=='undefined'||!S.unlocked||state.busy)return 0;adoptPending();baseline();seedNathe();const L=todo(),X=extraTodo();if(!L.length&&!X.length)return 0;
 const tok=get('link');if(!okTok(tok)){maybePrompt();return 0}
 if(!navigator.onLine)return 0;state.busy=true;const sent=get('sent')||{};
 const take=async(id,sg,run)=>{const r=await run();if(r=='ok'){sent[id]=sg;put('sent',sent);state.live=true;state.err='';k++;return 'ok'}
  if(r=='off'){state.live=false;return 'stop'}if(r=='unlinked'){localStorage.removeItem(K('link'));state.err='The link was removed on Archery Calendar. Link again to keep adding scores.';return 'stop'}
  state.err='Couldn’t reach Archery Calendar. Will try again.';return 'stop'};
 for(const s of L){if(await take(s.id,sig(s),()=>send(s,tok))=='stop')return k}
 for(const x of extraTodo()){if(await take(x.id,x._sig,()=>sendExtra(x,tok))=='stop')break}
}catch(e){}finally{state.busy=false}return k}
setInterval(tick,4000);addEventListener('online',tick);setTimeout(tick,1500);
/* once only, never in the way: a small card after a round is finished, if not linked */
function scoringNow(){try{if(document.querySelector('#cspface,#csentry,[data-csk],[data-lgk]'))return true;return typeof cur!='undefined'&&!!cur&&typeof isDone=='function'&&!isDone(cur)&&view=='score'}catch(e){return false}}
setInterval(()=>{const d=document.getElementById('calPrompt');if(d&&scoringNow())d.remove()},500);
function maybePrompt(force){if(!force&&get('prompted')||scoringNow()||document.getElementById('calPrompt')||document.getElementById('leaveov')||(!force&&document.querySelector('[role=dialog],[aria-modal=true]')))return;put('prompted',1);
 const d=document.createElement('div');d.id='calPrompt';d.className='calprompt';d.setAttribute('role','status');
 d.innerHTML='<b>'+(window.icon?icon('calendar'):'')+' Add finished scores to your Archery Calendar?</b><span>They show in My events on the day you shot them. Only you can see them.</span><span style="font-size:1rem;line-height:1.5">How: 1. Tap Add to my Archery Calendar. 2. Sign in on archerycalendars.com, then tap Link ScoreTool. 3. Tap Back to ScoreTool.</span><div><a class="btn alt" id="calGo" href="'+linkUrl()+'">Add to my Archery Calendar</a> <button class="btn ghost" id="calNo">Not now</button></div>';
 document.body.appendChild(d);d.querySelector('#calNo').onclick=()=>d.remove();d.querySelector('#calGo').onclick=()=>d.remove();setTimeout(()=>d.remove(),20000)}
function toast2(t){const d=document.createElement('div');d.className='calprompt';d.setAttribute('role','status');d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),4000)}
/* Send past rounds (23 Oct 2026): rounds finished before linking are never sent on their own (baseline). The archer can send any finished,
   non-sample round from Past sessions or Me › Settings › Archery Calendar. Each is tied to an Archery Calendar event that covers its date
   (picked by the archer) or, if none / offline, sent untied via the NEW key scoretool.cal.<tester>.force. No score record is changed. */
const escC=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const IC=n=>window.icon?icon(n):'';
let EVP=null;
function dayKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function loadEvents(){if(EVP)return EVP;if(!navigator.onLine)return Promise.resolve(null);
 const ac=typeof AbortController!='undefined'?new AbortController():null,to=setTimeout(()=>ac&&ac.abort(),9000);
 EVP=fetch(CAL+'data/events.json',{cache:'no-cache',signal:ac?ac.signal:undefined}).then(r=>r.ok?r.json():Promise.reject()).then(j=>{const A=Array.isArray(j)?j:(j.events||[]),on={};
  A.filter(x=>x&&x.id&&x.name&&/^\d{4}-\d{2}-\d{2}$/.test(x.start_date||'')).forEach(x=>{const a=new Date(x.start_date+'T00:00'),b=new Date((x.end_date||x.start_date)+'T00:00');if(!(b>=a)||b-a>40*864e5)return;
   for(let d=new Date(a);d<=b;d.setDate(d.getDate()+1))(on[dayKey(d)]=on[dayKey(d)]||[]).push(x)});return on})
  .catch(()=>{EVP=null;return null}).finally(()=>clearTimeout(to));return EVP}
/* events whose date range covers the round's date; a match on the round's own location/club comes first, then the same kind of shoot, then WA */
const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function placeHit(s,x){const mine=[s.loc,s.club,s.venue].map(norm).filter(v=>v.length>2);if(!mine.length)return 0;
 const theirs=[x.host,x.org,x.location,x.name,String(x.club_id||'').replace(/-/g,' ')].map(norm).filter(Boolean);
 return mine.some(m=>theirs.some(t=>t.includes(m)||m.includes(t)&&t.length>3))?1:0}
function kindHit(s,x){const R=ROUNDS[s.round]||{},d=String(x.discipline||''),n=s.round||'';
 const want=R.aba?/3D/i:/Field/i.test(n)?/Field/i:/Indoor|Vegas|18 ?m|25 ?m/i.test(n)?/Indoor/i:/Target|Clout/i;return want.test(d)?1:0}
function matches(s,on){const L=(on&&on[s.date])||[];return L.map(x=>({x,p:placeHit(s,x),k:kindHit(s,x),w:x.state=='WA'?1:0}))
 .sort((a,b)=>b.p-a.p||b.k-a.k||b.w-a.w||String(a.x.name).localeCompare(b.x.name)).map(o=>Object.assign({},o.x,{_place:o.p}))}
/* official unless the calendar lists it as a fun / club / come-and-try shoot (then 'Fun shoot - not official', as on the Melville tie) */
const funEv=x=>(x.category&&x.category!='competition')||/\bfun\b/i.test((x.name||'')+' '+(x.notes||''));
const tieOf=(s,x)=>Object.assign({id:x.id,name:String(x.name).replace(/\s+–\s+/g,' - '),club:x.host||x.org||'',date:s.date,send:1},funEv(x)?{fun:1,official:0}:{official:1});
function forceAdd(id){const f=get('force')||[];if(!f.includes(id)){f.push(id);put('force',f.slice(-2000))}}
/* status for Past sessions: 'sent' | 'queued' (chosen, waiting for a connection) | 'can' (finished, not sent) | null */
window.calStatus=s=>{if(!WHO()||!s||!s.id||s.sample)return null;const sent=get('sent')||{};if(sent[s.id]&&sent[s.id]===sig(s))return 'sent';
 if(!finished(s)&&!forced(s))return null;if(!okTok(get('link')))return 'can';
 const gone=new Set(get('discarded')||[]);if(gone.has(s.id))return 'can';
 return 'queued'};
window.calRowHtml=s=>{const st=window.calStatus(s);if(!st)return'';
 if(st=='sent')return`<div class="small calst calst-on" data-calst="sent">${IC('check')} On Archery Calendar</div>`;
 if(st=='queued')return`<div class="small calst" data-calst="queued">${IC('calendar')} Waiting to send to Archery Calendar</div>`;
 return`<button class="btn ghost calsend" data-calsend="${escC(s.id)}">${IC('calendar')} Send to Archery Calendar</button>`};
function rerender(){try{if(typeof render=='function')render()}catch(e){}}
/* full-screen panel with a Back button (any new screen must have one) */
function panel(html){return new Promise(res=>{const old=document.getElementById('calov');if(old)old.remove();const d=document.createElement('div');d.id='calov';d.className='calov';
 d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.innerHTML=`<div class="calov-in"><button class="btn ghost labback calback" data-calv="back">‹ Back</button>${html}</div>`;
 document.body.appendChild(d);const done=v=>{d.remove();removeEventListener('keydown',esc);res(v)},esc=e=>{if(e.key=='Escape')done('back')};addEventListener('keydown',esc);
 d.addEventListener('click',e=>{const b=e.target.closest('[data-calv]');if(b)done(b.dataset.calv)});d._done=done})}
const rowLine=s=>`${escC(s.round)} · ${escC(s.date)} · ${total(s)}`;
const evBtn=x=>`<button class="btn ghost full calevb" data-calv="ev:${escC(x.id)}"><b>${escC(String(x.name).replace(/\s+–\s+/g,' - '))}</b><span class="small muted">${escC([x.host||x.org,x.state,x.discipline].filter(Boolean).join(' · '))}${x._place?' · matches this round’s location':''}</span></button>`;
/* ask how to send one round; returns 'tied' | 'untied' | 'back' */
async function chooseFor(s,on,step){const M=on?matches(s,on):[],pre=step?`<p class="small muted" style="margin:0 0 4px">${escC(step)}</p>`:'';
 if(!on){forceAdd(s.id);return 'untied'}
 if(!M.length){forceAdd(s.id);return 'untied'}
 if(M.length==1){const x=M[0];const v=await panel(`${pre}<span class="kicker">Archery Calendar</span><h2>Add to ${escC(String(x.name).replace(/\s+–\s+/g,' - '))}?</h2><p class="small">${rowLine(s)}</p><p class="small muted">${escC([x.host||x.org,x.location].filter(Boolean).join(' · '))}</p>
   <div class="calov-act"><button class="btn" data-calv="yes">${IC('check')} Yes, add to this event</button><button class="btn ghost" data-calv="none">No, send without an event</button></div>`);
  if(v=='yes'){window.calSetEv(s.id,tieOf(s,x));return 'tied'}if(v=='none'){forceAdd(s.id);return 'untied'}return 'back'}
 const v=await panel(`${pre}<span class="kicker">Archery Calendar</span><h2>Which event was this?</h2><p class="small">${rowLine(s)}</p>${M.map(evBtn).join('')}<button class="btn ghost full" data-calv="none">None of these</button>`);
 if(v&&v.startsWith('ev:')){const x=M.find(y=>y.id==v.slice(3));if(x){window.calSetEv(s.id,tieOf(s,x));return 'tied'}}
 if(v=='none'){forceAdd(s.id);return 'untied'}return 'back'}
async function sendList(L){if(!WHO()||!L.length)return;
 if(!okTok(get('link'))){maybePrompt(1);return}
 const on=await loadEvents();let n=0;
 for(let i=0;i<L.length;i++){const r=await chooseFor(L[i],on,L.length>1?`Round ${i+1} of ${L.length}`:'');if(r=='back'&&L.length==1)return;if(r!='back')n++}
 if(!n){rerender();return}
 if(navigator.onLine){for(let i=0;i<60&&state.busy;i++)await new Promise(r=>setTimeout(r,150));await tick();for(let i=0;i<60&&state.busy;i++)await new Promise(r=>setTimeout(r,150))}
 const k=L.filter(s=>window.calStatus(s)=='sent').length;rerender();
 toast2(k?(k==1?'Sent to Archery Calendar. It shows in My events.':k+' rounds sent to Archery Calendar.'):(navigator.onLine?'Queued for Archery Calendar. It will go shortly.':'You’re offline. It will go to Archery Calendar when you’re back online.')+(on?'':' (Events couldn’t be loaded, so it was sent without an event.)'))}
window.calSendPast=id=>{const s=(S.sessions||[]).find(x=>x.id==id);if(s)return sendList([s])};
window.calRowBind=root=>{(root||document).querySelectorAll('[data-calsend]').forEach(b=>b.onclick=e=>{e.stopPropagation();window.calSendPast(b.dataset.calsend)})};
/* Me › Settings › Archery Calendar: 'Send all past finished rounds' (checkbox list, newest first) */
const pastCan=()=>{const gone=new Set(get('discarded')||[]);return (S.sessions||[]).filter(s=>window.calStatus(s)=='can'&&finished(s)&&!gone.has(s.id)).sort((a,b)=>(b.date||'').localeCompare(a.date||''))};
async function bulk(){if(!okTok(get('link'))){maybePrompt(1);return}const L=pastCan();
 const html=`<span class="kicker">Archery Calendar</span><h2>Send past finished rounds</h2>${L.length?`<p class="small">Tick the rounds to add to My events. Each one is matched to an Archery Calendar event on its date if there is one.</p>
  <button class="btn ghost" id="calAll" type="button">Select all</button><div class="callist">${L.map(s=>`<label class="calrow"><input type="checkbox" value="${escC(s.id)}"><span>${rowLine(s)}</span></label>`).join('')}</div>
  <button class="btn" id="calGoSel" type="button" disabled>Send selected</button>`:'<p class="small">Every finished round is already on Archery Calendar.</p>'}`;
 const p=panel(html),d=document.getElementById('calov'),go=d.querySelector('#calGoSel'),boxes=[...d.querySelectorAll('.callist input')];
 const upd=()=>{const c=boxes.filter(b=>b.checked).length;if(go){go.disabled=!c;go.textContent=c?'Send selected ('+c+')':'Send selected'}};boxes.forEach(b=>b.onchange=upd);
 const all=d.querySelector('#calAll');if(all)all.onclick=()=>{const on=!boxes.every(b=>b.checked);boxes.forEach(b=>b.checked=on);all.textContent=on?'Clear all':'Select all';upd()};
 if(go)go.onclick=()=>{const ids=boxes.filter(b=>b.checked).map(b=>b.value);d._done('go:'+ids.join('\n'))};
 const v=await p;if(!v||!v.startsWith('go:'))return;const ids=new Set(v.slice(3).split('\n'));await sendList(L.filter(s=>ids.has(s.id)))}
/* Me › Settings & help: link status */
window.calCard=function(){if(!WHO())return'';const tok=get('link'),n=Object.keys(get('sent')||{}).length;
 return`<div class="card" id="calcard"><span class="kicker">Archery Calendar</span><h2>Scores in My events</h2>
 ${okTok(tok)?`<p class="small" style="margin:0 0 8px">${(window.icon?icon('check'):'')} Linked. Finished rounds are added to My events on archerycalendars.com on the day you shot them, practice and club alike, including rounds you finished before you linked. Official scoresheets, competition results and scores you imported are added too${n?` (${n} so far)`:''}.${state.live===false?' Waiting for Archery Calendar to switch this on; nothing is lost, they’ll go when it’s ready.':''}</p>${(c=>`<button class="btn ghost" id="calPast" style="margin:0 6px 6px 0">${IC('calendar')} Send all past finished rounds${c?' ('+c+')':''}</button>`)(pastCan().length)}<button class="btn ghost" id="calUn">Unlink</button>`
 :`<p class="small" style="margin:0 0 8px">Link once and every finished round shows in your Archery Calendar's My events, practice and club alike, including rounds you finished before you linked. Only you can see them.</p><a class="btn alt" href="${linkUrl()}">Add to my Archery Calendar</a>
 <div style="margin-top:12px;font-size:1.05rem;line-height:1.55"><b>How to link</b><ol style="margin:6px 0 6px 1.3em;padding:0"><li>Tap <b>Add to my Archery Calendar</b>.</li><li>On archerycalendars.com, sign in (or make a free account), then tap <b>Link ScoreTool</b>.</li><li>Tap <b>Back to ScoreTool</b>. This card will say <b>Linked</b>.</li></ol><p style="margin:4px 0">Finished rounds then show in My events on the day you shot them, including ones you shot before you linked. Only you can see them.</p><p style="margin:4px 0">Using ScoreTool from your home screen? Copy the code shown on the link page and paste it below.</p></div>
 <details style="margin-top:10px"><summary class="small">Using ScoreTool as an installed app? Paste the code instead</summary><label for="calCode">Link code from Archery Calendar</label><input id="calCode" autocomplete="off" inputmode="latin" placeholder="48 letters and numbers"><button class="btn ghost" id="calPaste" style="margin-top:8px">Link</button></details>`}
 ${state.err?`<p class="small" role="alert" style="margin:8px 0 0">${state.err}</p>`:''}</div>`};
window.calBind=function(){const pb=document.getElementById('calPast');if(pb)pb.onclick=()=>bulk();const u=document.getElementById('calUn');if(u)u.onclick=async()=>{if(!confirm('Unlink Archery Calendar? Scores already added stay there.'))return;const tok=get('link');localStorage.removeItem(K('link'));
  try{await fetch(SB+'/rest/v1/rpc/scoretool_unlink',{method:'POST',headers:{apikey:KEY_PUB,Authorization:'Bearer '+KEY_PUB,'Content-Type':'application/json'},body:JSON.stringify({p_token:tok})})}catch(e){}render()};
 const p=document.getElementById('calPaste');if(p)p.onclick=()=>{const v=(document.getElementById('calCode').value||'').trim().toLowerCase();if(!okTok(v)){alert('That code doesn’t look right. It is 48 letters and numbers.');return}put('link',v);put('prompted',1);state.err='';render();tick()}};
})();
