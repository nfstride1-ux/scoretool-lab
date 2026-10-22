/* Head-to-head: two testers shoot the same indoor round on their own phones and see each other's ends (20 Oct 2026).
   Works between ANY two testers (not tied to the squad). Each phone keeps its own copy of the match in S.matches.
   Relay: ntfy.sh public topics (no account, no server of ours). Only the tester id, the tester's chosen display name (nm, nt = when
   chosen), round, match code and arrow scores are sent, never real names, contact details or notes. Topics use an unguessable match code; relay messages expire after 12 hours.
   Near-live: each phone sends its ends when they change and checks the relay every 8 seconds while the app is open.
   Match night (group, 20 Oct 2026): same relay, one topic per match, up to 10 archers. The host posts a header {k:'hd'} (round,
   host id, optional date/time, display name), each archer posts their own {k:'st'} only when it changes, the host can post {k:'cl'}
   to close. Join from an invite, the match code or a #join=CODE link; an 11th archer is refused. Highest total only (set points is
   a 1v1 format). The order of first appearance on the topic decides who is in when two join at once. */
const H2H_BASE='https://ntfy.sh',H2H_NS='stlab-h2h-q7m4';
const h2hTopic=c=>H2H_NS+'-'+String(c).toLowerCase().replace(/[^a-z0-9]/g,''),h2hInbox=id=>H2H_NS+'-in-'+id;
const H2H_ROUNDS=()=>Object.keys(ROUNDS).filter(r=>(/^Indoor WA/.test(r)||ROUNDS[r].vegas&&!ROUNDS[r].league)&&!ROUNDS[r].custom);
const H2H_MAX=10,H2H_RESET=Date.UTC(2026,9,19,22,36);/* 20 Oct 06:36 Perth: older relay posts (a browser test) are ignored */
const H2H_MODES={total:'Highest total',sets:'Set points (2 for a set win, 1 for a draw, first to 6)'};
const h2hMe=()=>TESTER?TESTER.id:null,h2hShort=id=>testerName(id);
const h2hAll=()=>S.matches=S.matches||[],h2hGet=c=>h2hAll().find(m=>m.code==c);
const h2hSess=m=>m&&m.sid?S.sessions.find(s=>s.id==m.sid):null;
function h2hCode(){const L='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',a=new Uint32Array(8);crypto.getRandomValues(a);return Array.from(a,x=>L[x%L.length]).join('')}
async function h2hPost(topic,o){try{const r=await fetch(H2H_BASE+'/'+topic,{method:'POST',body:JSON.stringify(o)});return r.ok}catch(e){return false}}
async function h2hPoll(topic,since){try{const r=await fetch(H2H_BASE+'/'+topic+'/json?poll=1&since='+(since||'all'),{cache:'no-store'});if(!r.ok)return null;
 return(await r.text()).split('\n').filter(Boolean).map(l=>{try{const j=JSON.parse(l);if(j.event!='message')return null;const d=JSON.parse(j.message);d._id=j.id;return d}catch(e){return null}}).filter(Boolean)}catch(e){return null}}
const h2hNm=()=>{const o=TESTER&&nmOwn(TESTER.id);return o?{nm:o.n,nt:o.nt}:{}};
const h2hMyDone=m=>{const s=h2hSess(m);return!!(s&&(isDone(s)||(s.finished&&arrowsIn(s)>0)))};
const h2hState=m=>{const s=h2hSess(m);return{k:'st',code:m.code,by:h2hMe(),round:m.round,mode:m.mode,...(m.g?{g:1}:{a:m.a,b:m.b}),ends:s?s.ends.filter(e=>e&&e.length):[],done:h2hMyDone(m),...h2hNm(),t:Date.now()}};
/* Score the match from MY side: a = me, b = opponent. Only ends both archers have finished count for sets. */
function h2hCalc(m){const R=ROUNDS[m.round]||{ape:3,ends:20},ape=R.ape,s=h2hSess(m),A=s?s.ends.filter(e=>e&&e.length):[],B=(m.op&&m.op.ends)||[],full=e=>e&&e.length==ape;
 let ta=0,tb=0,sa=0,sb=0,win=null;const rows=[],n=Math.max(A.length,B.length);
 for(let i=0;i<n;i++){const a=A[i]||[],b=B[i]||[],ea=endSum(a),eb=endSum(b);ta+=ea;tb+=eb;let pa=null,pb=null;
  if(m.mode=='sets'&&!win&&full(a)&&full(b)){pa=ea>eb?2:ea==eb?1:0;pb=eb>ea?2:ea==eb?1:0;sa+=pa;sb+=pb;if((sa>=6||sb>=6)&&sa!=sb)win=sa>sb?'a':'b'}
  rows.push({i,a,b,ea,eb,ta,tb,fa:full(a),fb:full(b),pa,pb,sa,sb})}
 const dA=h2hMyDone(m),dB=!!(m.op&&m.op.done),cnt=(E,f)=>E.flat().filter(f).length;let tie='';
 if(m.mode!='sets'&&dA&&dB){if(ta!=tb)win=ta>tb?'a':'b';else{const t1=cnt(A,x=>x=='X'||x=='10'),t2=cnt(B,x=>x=='X'||x=='10');if(t1!=t2){win=t1>t2?'a':'b';tie='Tied on total, decided on 10s (incl. X)'}else{const x1=cnt(A,x=>x=='X'),x2=cnt(B,x=>x=='X');if(x1!=x2){win=x1>x2?'a':'b';tie='Tied on total and 10s, decided on Xs'}else win='draw'}}}
 if(m.mode=='sets'&&!win&&dA&&dB)win=sa==sb?'draw':sa>sb?'a':'b';
 return{rows,ta,tb,sa,sb,win,tie,dA,dB}}
function h2hLine(m){if(m.g){const b=h2hBoard(m),r=b.rows.find(x=>x.me);return`${r?(r.tie?'=':'')+h2hOrd(r.rank)+' · '+r.tot+' · ':''}${b.rows.length} of ${H2H_MAX} archers`}const c=h2hCalc(m),o=h2hShort(m.opp);return m.mode=='sets'?`You ${c.sa} – ${c.sb} ${o} (set points)`:`You ${c.ta} – ${c.tb} ${o}`}
function h2hResult(m,c){if(m.g)return h2hGResult(m);const o=h2hShort(m.opp);if(!c.win)return'';return c.win=='draw'?'Draw':c.win=='a'?'▲ You win':`▲ ${esc(o)} wins`}
window.h2hChip=function(s){const m=h2hGet(s.h2h);if(!m)return'';const c=m.g?null:h2hCalc(m),r=h2hResult(m,c);
 return`<button class="ad-small h2hchip" id="h2hchip" onclick="h2hView('${m.code}')" aria-label="Open head-to-head match">⚔ ${m.g?'Match night · ':''}${esc(h2hLine(m))}${r?' · '+r:''}</button>`};
/* Start a session for a match (same as Score > Start, tagged with the match code) */
function h2hStart(m){const r=m.round;S.lastRound=r;sv='entry';justDone=false;fix=null;if(typeof PZ!='undefined'){PZ.k=1;PZ.cx=PZ.cy=0}
 cur={id:'s'+Date.now(),date:today(),round:r,ends:[[]],pos:[[]],note:'',h2h:m.code};if(indoor3(ROUNDS[r],faceR(ROUNDS[r],0)))cur.face3=S.face3||'vert';
 S.sessions.push(cur);m.sid=cur.id;m.status='active';save();h2hPost(h2hTopic(m.code),h2hState(m));m.sent=JSON.stringify(h2hState(m).ends)+h2hMyDone(m);save();history.pushState({scoring:1},'');score();scrollTo(0,0)}
window.h2hCard=function(){if(!TESTER)return`<div class="card"><span class="kicker">Head-to-head</span><h3>Shoot against another tester</h3><p class="small muted">Pick your tester name in Me first.</p></div>`;
 const L=h2hAll().filter(m=>!m.lg&&!m.cs).slice().reverse(),inv=L.filter(m=>m.status=='invite'),act=L.filter(m=>m.status!='invite'&&m.status!='declined').slice(0,6),me=h2hMe();
 return`<div class="card" id="h2hcard"><span class="kicker">Head-to-head</span><h3>Shoot an indoor round against other testers</h3><p class="small muted" style="margin:2px 0 8px">You both score on your own phones and see each other's ends as you go.</p>
 ${inv.map(m=>`<div class="list-item" data-inv="${m.code}"><b>${esc(h2hShort(m.opp))} ${m.g?'invited you to a match night':'challenged you'}</b><div class="small muted">${esc(m.round)} · ${esc(m.mode=='sets'?'Set points':'Highest total')}${m.when?' · '+esc(h2hWhen(m.when)):''}</div><div class="row" style="gap:6px;justify-content:flex-start;margin-top:6px"><button class="btn alt" data-h2hacc="${m.code}">Accept and start</button><button class="btn ghost" data-h2hno="${m.code}">Not now</button></div></div>`).join('')}
 ${act.map(m=>{if(m.g){const r=h2hResult(m);return`<div class="list-item row"><span><b>Match night · ${esc(m.round)}</b><div class="small muted">${esc(h2hLine(m))}${m.when?' · '+esc(h2hWhen(m.when)):''}${r?' · <b>'+r+'</b>':m.status=='full'?' · match full':''}</div></span>${h2hDelBtn(m)}<button class="btn ghost" data-h2hopen="${m.code}">Open</button></div>`}const c=h2hCalc(m),r=h2hResult(m,c);return`<div class="list-item row"><span><b>vs ${esc(h2hShort(m.opp))}</b><div class="small muted">${esc(m.round)} · ${esc(h2hLine(m))}${r?' · <b>'+r+'</b>':m.status=='declined-by-opp'?' · they said not now':!m.op?' · waiting for them to accept':''}</div></span>${h2hDelBtn(m)}<button class="btn ghost" data-h2hopen="${m.code}">Open</button></div>`}).join('')}
 <details id="h2hnew"><summary class="btn full" style="list-style:none;text-align:center;margin-top:6px">Start a match</summary>
 <label for="h2hrd">Round</label><select id="h2hrd">${H2H_ROUNDS().map(r=>`<option ${r=='Indoor WA 18m'?'selected':''}>${esc(r)}</option>`).join('')}</select>
 <fieldset class="h2hpm"><legend>Scoring</legend><label class="h2htk"><input type="radio" name="h2hpm" value="multi" checked> Each archer scores on their own phone</label><label class="h2htk"><input type="radio" name="h2hpm" value="one"> Score everyone on one phone</label></fieldset>
 <div id="h2hnw"><label for="h2hneed">Shooters</label><input type="number" id="h2hneed" min="2" max="${H2H_MAX}" value="2" inputmode="numeric"></div><div id="h2hnames" hidden></div><p class="small" id="h2hnerr" role="alert" style="margin:4px 0;font-weight:600"></p>
 <fieldset class="h2hops nm-real"><legend>Who's in</legend>${TESTERS.filter(t=>t.id!=me).map(t=>`<label class="h2htk"><input type="checkbox" data-h2hop="${t.id}"> ${esc(t.name)}</label>`).join('')}</fieldset>
 <p class="small muted" id="h2hophint">You plus up to ${H2H_MAX-1} others (${H2H_MAX} archers max). Tick 1 for a head-to-head. Others can join with the code.</p>
 <div id="h2hmdw" hidden><label for="h2hmd">Scoring</label><select id="h2hmd">${Object.entries(H2H_MODES).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('')}</select></div>
 <div id="h2hwhw"><label for="h2hwhen">When (optional)</label><input type="datetime-local" id="h2hwhen"></div>
 <button class="btn alt full" id="h2hgo" style="margin-top:10px">Create match night</button><p class="small muted">They see it on their Score tab and tap Accept. Only your display name, the round and your arrow scores are shared, just for this match.</p></details>
 <div class="row" style="gap:6px;margin-top:8px"><input id="h2hjc" maxlength="12" autocomplete="off" autocapitalize="characters" placeholder="Match code" aria-label="Match code" style="flex:1"><button class="btn ghost" id="h2hjgo">Join</button></div><p class="small" id="h2hjmsg" role="alert" style="margin:4px 0">${esc(window._h2hJmsg||'')}</p></div>`};
window.h2hBind=function(){const g=$('#h2hgo'),ticked=()=>[...app.querySelectorAll('[data-h2hop]:checked')].map(x=>x.dataset.h2hop);
 const one=()=>!!app.querySelector('[name=h2hpm][value=one]:checked'),need=()=>Math.max(2,Math.min(H2H_MAX,parseInt(($('#h2hneed')||{}).value)||2));
 const names=()=>{const w=$('#h2hnames');if(!w)return;const old=[...w.querySelectorAll('input')].map(x=>x.value);w.innerHTML=Array.from({length:need()},(_,k)=>`<label for="h2hnm${k}">Shooter ${k+1}</label><input id="h2hnm${k}" data-h2hnm maxlength="16" autocomplete="off" value="${esc(old[k]||'')}">`).join('')};
 const sync=()=>{const o=one(),v=!!(ROUNDS[$('#h2hrd').value]||{}).vegas,n=o?0:ticked().length;$('#h2hnames').hidden=!o;$('.h2hops').hidden=o;$('#h2hophint').hidden=o;$('#h2hnw').hidden=!(o||v);if(o)names();
  $('#h2hmdw').hidden=n!=1;$('#h2hwhw').hidden=n==1;if(n!=1)$('#h2hmd').value='total';g.textContent=o?'Start one-phone match':n==1?'Send challenge and start scoring':'Create match night';
  app.querySelectorAll('[data-h2hop]').forEach(x=>{if(!x.checked)x.disabled=n>=H2H_MAX-1})};
 if(g){app.querySelectorAll('[data-h2hop],[name=h2hpm],#h2hrd').forEach(x=>x.onchange=sync);$('#h2hneed').oninput=sync;sync()}
 const jg=$('#h2hjgo');if(jg)jg.onclick=()=>h2hJoin($('#h2hjc').value);
 app.querySelectorAll('[data-h2hacc]').forEach(b=>{const m=h2hGet(b.dataset.h2hacc);if(m&&m.g)b.onclick=()=>h2hJoin(m.code)});
 if(g)g.onclick=()=>{const T=ticked(),me=h2hMe();if(!me)return;if(one())return window.lcCreate&&lcCreate([...app.querySelectorAll('[data-h2hnm]')].map(x=>x.value));if(T.length!=1)return h2hCreateG(T);const opp=T[0];
  const m={code:h2hCode(),round:$('#h2hrd').value,mode:$('#h2hmd').value,a:me,b:opp,opp,created:Date.now(),status:'active'};h2hAll().push(m);
  h2hPost(h2hInbox(opp),{k:'inv',code:m.code,round:m.round,mode:m.mode,from:me,to:opp,...h2hNm(),t:Date.now()});h2hStart(m)};
 app.querySelectorAll('[data-h2hacc]').forEach(b=>{if(!b.onclick)b.onclick=()=>{const m=h2hGet(b.dataset.h2hacc);if(m)h2hStart(m)}});
 app.querySelectorAll('[data-h2hno]').forEach(b=>b.onclick=()=>{const m=h2hGet(b.dataset.h2hno);if(!m)return;m.status='declined';save();if(!m.g)h2hPost(h2hTopic(m.code),{k:'no',code:m.code,by:h2hMe(),t:Date.now()});score()});
 app.querySelectorAll('[data-h2hopen]').forEach(b=>b.onclick=()=>h2hView(b.dataset.h2hopen));h2hBindDel()};
window.h2hView=function(code){const m=h2hGet(code);if(!m)return;if(m.g)return h2hViewG(m);const c=h2hCalc(m),o=esc(h2hShort(m.opp)),s=h2hSess(m),R=ROUNDS[m.round]||{},sets=m.mode=='sets',r=h2hResult(m,c);
 const ago=m.seen?Math.max(0,Math.round((Date.now()-m.seen)/1000)):null,mk=(x,y,ok)=>ok&&x>y?' ▲':'';
 const st=r?`<p style="font-size:22px;font-weight:800;margin:6px 0">${r}</p>${c.tie?`<p class="small">${esc(c.tie)}</p>`:''}`:m.status=='declined-by-opp'?`<p>${o} said not now.</p>`:!m.op?`<p>Waiting for ${o} to accept. They'll see it on their Score tab.</p>`:`<p>${o} has shot ${plN(c.rows.filter(x=>x.fb).length,'end','ends')}${m.op.done?' and finished':''}.</p>`;
 app.innerHTML=`<div id="h2hview"><div class="card dark"><span class="kicker">Head-to-head · ${esc(sets?'Set points':'Highest total')}</span><h1>You vs ${o}</h1><p class="small" style="margin:0">${esc(m.round)} · ${plN(R.ends,'end','ends')} of ${R.ape}${sets?' · 2 for a set win, 1 for a draw, first to 6':''}</p>
 <p style="font-size:28px;font-weight:800;margin:8px 0 0">${sets?`${c.sa} – ${c.sb}`:`${c.ta} – ${c.tb}`}</p><p class="small" style="margin:0">You – ${o}${sets?' · set points':''}</p>${st}</div>
 <div class="card"><table class="ad-tab h2htab" style="width:100%"><thead><tr><th>End</th><th>You</th><th>${o}${!m.op?' <span class="small muted h2hinvl">invited</span>':''}</th><th>${sets?'Sets':'Totals'}</th></tr></thead><tbody>
 ${c.rows.map(x=>{const both=x.fa&&x.fb;return`<tr><td>${x.i+1}</td><td${both&&x.ea>x.eb?' class="h2hwin"':''}>${x.a.length?`${esc(x.a.join(' '))} <b>${x.ea}</b>${mk(x.ea,x.eb,both)}`:'–'}</td><td${both&&x.eb>x.ea?' class="h2hwin"':''}>${x.b.length?`${esc(x.b.join(' '))} <b>${x.eb}</b>${mk(x.eb,x.ea,both)}`:'–'}</td><td>${sets?(x.pa!=null?`${x.sa} – ${x.sb}${x.pa==1?' (draw)':''}`:'–'):`${x.ta} – ${x.tb}`}</td></tr>`}).join('')||'<tr><td colspan="4" class="small muted">No ends yet.</td></tr>'}</tbody></table>
 <p class="small muted">▲ marks the higher end.${ago!=null?` Last update from ${o} ${ago<60?ago+'s':Math.round(ago/60)+' min'} ago.`:''} Updates every few seconds while the app is open.</p>
 <div class="row" style="gap:6px;justify-content:flex-start;flex-wrap:wrap">${s&&!h2hMyDone(m)?`<button class="btn alt" id="h2hback">Back to scoring</button>`:''}<button class="btn ghost" id="h2hrf">Refresh now</button><button class="btn ghost" id="h2hout">All matches</button></div></div></div>`;
 const b=$('#h2hback');if(b)b.onclick=()=>{cur=s;sv='entry';fix=null;score()};$('#h2hrf').onclick=()=>h2hTick(true);$('#h2hout').onclick=()=>{cur=null;sv='sheet';if(view!='score')nav('score');else score()}};
let h2hN=0,h2hBusy=false;
async function h2hTick(force){if(h2hBusy||(document.hidden&&!force)||!TESTER)return;h2hBusy=true;try{const me=h2hMe();let ch=false;
 if(force||h2hN++%4==0){if(window.nmSync)nmSync();const L=await h2hPoll(h2hInbox(me),S.h2hIn);if(L&&L.length){L.forEach(d=>{S.h2hIn=d._id;if(d.k=='lginv'&&window.lgInvite&&lgInvite(d))ch=true;if(d.k=='csinv'&&window.csInvite&&csInvite(d))ch=true;if(d.k=='inv'&&d.to==me&&d.nm&&nmLearn(d.from,d.nm,d.nt,d.t))ch=true;if(d.k=='inv'&&d.to==me&&d.from!=me&&d.code&&ROUNDS[d.round]&&!h2hGet(d.code)&&(d.t||0)>=H2H_RESET){h2hAll().push(d.g?{code:d.code,round:d.round,mode:'total',g:1,host:d.from,opp:d.from,when:d.when||'',order:[],ops:{},created:d.t||Date.now(),status:'invite'}:{code:d.code,round:d.round,mode:d.mode=='sets'?'sets':'total',a:d.from,b:me,opp:d.from,created:d.t||Date.now(),status:'invite'});ch=true}});save()}}
 const live=h2hAll().filter(m=>!m.local&&m.status!='declined'&&m.status!='invite'&&m.status!='full'&&Date.now()-(m.created||0)<2*864e5&&!(m.g?(m.closed||h2hBoard(m).fin)&&(!m.sid||m.sentDone)&&m.finSeen&&!(window.suKeepPolling&&suKeepPolling(m)):(m.op&&m.op.done&&h2hMyDone(m)&&m.sentDone)));
 for(const m of live){if(m.sid){const st=h2hState(m),sig=JSON.stringify(st.ends)+st.done;if(sig!=m.sent){if(await h2hPost(h2hTopic(m.code),st)){m.sent=sig;if(st.done)m.sentDone=true;save()}}}
  const L=await h2hPoll(h2hTopic(m.code),m.since);if(L&&L.length){L.forEach(d=>{m.since=d._id;if(m.g){if(h2hApplyG(m,d))ch=true;return}if(d.code!=m.code||d.by!=m.opp)return;if(d.nm&&nmLearn(d.by,d.nm,d.nt,d.t))ch=true;if(d.k=='st'){m.op={ends:(d.ends||[]).slice(0,60),done:!!d.done,t:d.t};m.seen=Date.now();if(m.status=='declined-by-opp')m.status='active'}if(d.k=='no'&&!m.op)m.status='declined-by-opp';ch=true});save()}if(m.g&&(m.closed||h2hBoard(m).fin))m.finSeen=true;if(m.g&&window.suTick&&await suTick(m))ch=true}
 if(ch&&window.suRefresh&&$('#suview'))suRefresh();else if(ch){const v=$("#h2hview"),chip=$("#h2hchip"),card=$("#h2hcard");if(v)h2hView(window._h2hv);else if(chip&&cur&&cur.h2h)chip.outerHTML=h2hChip(cur);else if(card&&!cur&&view=='score'&&!($('#h2hnew')||{}).open)score()}}finally{h2hBusy=false}}
const _h2hV=window.h2hView;window.h2hView=c=>{window._h2hv=c;_h2hV(c)};
setInterval(h2hTick,8000);setTimeout(()=>h2hTick(true),1500);document.addEventListener('visibilitychange',()=>{if(!document.hidden)h2hTick(true)});

/* ---------- match night (group, up to 10) ---------- */
const h2hOrd=n=>n+((n%100>10&&n%100<14)?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th'));
const h2hWhen=w=>{const d=new Date(w);return isNaN(d)?'':d.toLocaleString('en-AU',{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})};
const h2hJoinLink=c=>location.origin+location.pathname+'#join='+c;
const h2hEndsOf=(m,id)=>id==h2hMe()&&!m.lg&&!m.cs?((h2hSess(m)||{ends:[]}).ends.filter(e=>e&&e.length)):((((m.ops||{})[id]||{}).ends)||[]);
const h2hDoneOf=(m,id)=>id==h2hMe()&&!m.lg&&!m.cs?h2hMyDone(m):!!((m.ops||{})[id]||{}).done;
/* rank by total, then 10s (incl. X), then Xs; the same on all three = shared place (shown as =2) */
function h2hBoard(m){const R=ROUNDS[m.round]||{ape:3,ends:20},ids=(m.order||[]).slice(0,H2H_MAX),cnt=(E,f)=>E.flat().filter(f).length;
 const rows=ids.map(id=>{const E=h2hEndsOf(m,id);return{id,nm:(m.names&&m.names[id])||h2hShort(id),E,tot:E.reduce((t,e)=>t+endSum(e),0),n:E.filter(e=>e.length==R.ape).length,done:h2hDoneOf(m,id),t10:cnt(E,x=>x=='X'||x=='10'),x:cnt(E,x=>x=='X'),me:id==h2hMe()}});
 const vx=!!R.vegas;/* Vegas 300 seeding: ties split on X count */rows.sort((a,b)=>b.tot-a.tot||(vx?b.x-a.x||b.t10-a.t10:b.t10-a.t10||b.x-a.x)||ids.indexOf(a.id)-ids.indexOf(b.id));
 rows.forEach((r,i)=>{const p=rows[i-1];r.rank=p&&p.tot==r.tot&&p.t10==r.t10&&p.x==r.x?p.rank:i+1});
 rows.forEach(r=>{r.tie=rows.filter(x=>x.rank==r.rank).length>1;r.lead=r.rank==1&&r.tot>0});
 const wait=(m.inv||[]).filter(id=>!ids.includes(id)).slice(0,Math.max(0,H2H_MAX-ids.length)).map(id=>({id,nm:h2hShort(id),invited:true,me:id==h2hMe()}));
 return{rows,wait,R,fin:!!m.closed||(rows.length>1&&rows.every(r=>r.done))}}
function h2hGResult(m){const b=h2hBoard(m);if(!b.fin)return'';const L=b.rows.filter(r=>r.lead);if(!L.length)return'No scores';
 return L.length==1?(L[0].me?'▲ You win':`▲ ${esc(L[0].nm)} wins`):`▲ Tie for 1st: ${L.map(r=>esc(r.me?'You':r.nm)).join(', ')}`}
function h2hApplyG(m,d){if(d.code!=m.code)return false;if(window.suApply&&suApply(m,d))return true;if(m.lg||m.cs)return false;const me=h2hMe();m.order=m.order||[];m.ops=m.ops||{};
 if(d.k=='hd'){if(d.nm)nmLearn(d.host,d.nm,d.nt,d.t);if(Array.isArray(d.inv))m.inv=d.inv.filter(x=>typeof x=='string').slice(0,H2H_MAX-1);if(d.host&&!m.order.includes(d.host))m.order.unshift(d.host);return true}
 if(d.k=='st'&&d.by&&d.by!=me){if(d.nm)nmLearn(d.by,d.nm,d.nt,d.t);if(!m.order.includes(d.by))m.order.push(d.by);if(m.order.indexOf(d.by)<H2H_MAX){m.ops[d.by]={ends:(d.ends||[]).slice(0,60),done:!!d.done,t:d.t};m.seen=Date.now()}return true}
 if(d.k=='cl'&&d.by==m.host&&!m.closed){m.closed=true;return true}return false}
function h2hCreateG(T){const me=h2hMe();if(T.length>H2H_MAX-1)return;const w=($('#h2hwhen')||{}).value||'',need=(ROUNDS[$('#h2hrd').value]||{}).vegas?Math.max(2,Math.min(H2H_MAX,parseInt(($('#h2hneed')||{}).value)||0)):0;
 const m={code:h2hCode(),round:$('#h2hrd').value,mode:'total',g:1,host:me,a:me,opp:me,order:[me],ops:{},inv:T.slice(),need,when:w,created:Date.now(),status:'active'};h2hAll().push(m);save();
 h2hPost(h2hTopic(m.code),{k:'hd',code:m.code,round:m.round,mode:'total',host:me,when:w,inv:T.slice(),need,...h2hNm(),t:Date.now()}).then(()=>h2hPost(h2hTopic(m.code),h2hState(m)));
 m.sent=JSON.stringify([])+false;T.forEach(id=>h2hPost(h2hInbox(id),{k:'inv',g:1,code:m.code,round:m.round,mode:'total',from:me,to:id,when:w,...h2hNm(),t:Date.now()}));save();h2hView(m.code)}
/* join from an invite, the code box or a #join= link. Reads the whole match topic first so the 10-archer cap holds. */
async function h2hJoin(raw){const code=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,''),me=h2hMe(),msg=t=>{window._h2hJmsg=t;const e=$('#h2hjmsg');if(e)e.textContent=t};
 if(!me)return false;if(code.length<6){msg('Type the match code from the host.');return false}
 let m=h2hGet(code);if(m&&!m.g&&m.status!='invite'){h2hView(code);return true}if(m&&m.g&&m.status=='active'){h2hView(code);return true}
 msg('Finding the match...');const L=await h2hPoll(h2hTopic(code),'all');if(L==null){msg('No connection. Try again in a moment.');return false}
 const hd=L.find(d=>d.k=='hd'&&d.code==code);if(!hd||!ROUNDS[hd.round]){msg('No match found for that code. Check it with the host.');return false}
 const ids=[];if(hd.host)ids.push(hd.host);L.forEach(d=>{if(d.k=='st'&&d.by&&!ids.includes(d.by))ids.push(d.by)});
 if(!ids.includes(me)&&ids.length>=H2H_MAX){if(m){m.status='full';save()}msg(`This match is full (${H2H_MAX} archers).`);return false}
 if(!m){m={code};h2hAll().push(m)}Object.assign(m,{round:hd.round,mode:'total',g:1,host:hd.host,opp:hd.host,when:hd.when||'',need:+hd.need||0,order:[],ops:{},created:hd.t||Date.now(),status:'active'});
 L.forEach(d=>{m.since=d._id;h2hApplyG(m,d)});if(!m.order.includes(me))m.order.push(me);
 await h2hPost(h2hTopic(code),h2hState(m));m.sent=JSON.stringify([])+false;save();msg('');window._h2hJmsg='';h2hView(code);return true}
window.h2hJoin=h2hJoin;
function h2hViewG(m){const b=h2hBoard(m),R=b.R,s=h2hSess(m),me=h2hMe(),res=h2hGResult(m),host=m.host==me,full=m.status=='full';
 const row=r=>`<details class="h2hrow${r.lead?' lead':''}" data-h2hid="${esc(r.id)}"><summary><span class="rk">${r.tie?'=':''}${r.rank}</span><span class="nm">${r.lead?'▲ ':''}${esc(r.nm)}${r.me?' <span class="small muted">(you)</span>':''}</span><b class="tt">${r.tot}</b><span class="small muted en">${r.n}/${R.ends} ends${R.vegas||m.local?(r.done?' · finished':' · shooting'):r.done?' · done':''}</span></summary>
  <div class="small h2hends">${r.E.length?r.E.map((e,i)=>`<div>End ${i+1}: ${esc(e.join(' '))} <b>${endSum(e)}</b></div>`).join(''):'No ends yet.'}</div></details>`;
 app.innerHTML=`<div id="h2hview"><div class="card dark"><span class="kicker">Match night · Highest total</span><h1>${b.fin?'Final results':'Live leaderboard'}</h1>
 <p class="small" style="margin:0">${esc(m.round)} · ${plN(R.ends,'end','ends')} of ${R.ape}${m.when?' · '+esc(h2hWhen(m.when)):''} · ${b.rows.length} of ${H2H_MAX} archers${m.closed?' · closed by the host':''}</p>
 ${res?`<p style="font-size:22px;font-weight:800;margin:6px 0 0">${res}</p>`:''}${full?`<p>This match is full (${H2H_MAX} archers).</p>`:''}</div>
 <div class="card"><div class="h2hlb">${b.rows.map(row).join('')}${b.wait.map(r=>`<div class="h2hrow inv" data-h2hid="${esc(r.id)}"><div class="h2hsum"><span class="rk"></span><span class="nm">${esc(r.nm)}</span><span class="small">invited</span></div></div>`).join('')}</div>
 <p class="small muted">▲ marks the leader. Tap a name to see their ends. Updates every few seconds while the app is open.</p>
 <p class="small" style="margin:8px 0 4px">Match code <b id="h2hcode" style="letter-spacing:1px">${esc(m.code)}</b></p><div class="row" style="gap:6px"><input readonly id="h2hlink" value="${esc(h2hJoinLink(m.code))}" aria-label="Join link" style="flex:1"><button class="btn ghost" id="h2hcp">Copy link</button></div>
 <div class="row" style="gap:6px;justify-content:flex-start;flex-wrap:wrap;margin-top:8px">${!full&&!m.closed&&!h2hMyDone(m)?`<button class="btn alt" id="h2hback">${s?'Back to scoring':'Start scoring'}</button>`:''}<button class="btn ghost" id="h2hrf">Refresh now</button>${host&&!m.closed&&!b.fin?'<button class="btn ghost" id="h2hclose">Close match</button>':''}<button class="btn ghost" id="h2hout">All matches</button>${h2hOver(m)?'<button class="btn ghost h2hdel" data-h2hdel="'+esc(m.code)+'">Remove from this phone</button>':''}</div></div></div>`;
 h2hBindDel();const bk=$('#h2hback');if(bk)bk.onclick=()=>{if(s){cur=s;sv='entry';fix=null;score()}else h2hStart(m)};
 $('#h2hcp').onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(h2hJoinLink(m.code));$('#h2hcp').textContent='Copied'};
 const cl=$('#h2hclose');if(cl)cl.onclick=()=>{if(!confirm('Close the match and show final results?'))return;m.closed=true;save();h2hPost(h2hTopic(m.code),{k:'cl',code:m.code,by:me,t:Date.now()});h2hView(m.code)};
 app.querySelectorAll('.h2hrow').forEach(d=>{if((window._h2hOpen||{})[d.dataset.h2hid])d.open=true;d.ontoggle=()=>{window._h2hOpen=window._h2hOpen||{};window._h2hOpen[d.dataset.h2hid]=d.open}});
 $('#h2hrf').onclick=()=>h2hTick(true);$('#h2hout').onclick=()=>{cur=null;sv='sheet';if(view!='score')nav('score');else score()}}
/* #join=CODE link: wait until a tester is signed in, then join */
const _h2hRender=render;render=function(){const j=/^#join=([A-Za-z0-9-]+)/.exec(location.hash);
 if(j&&TESTER&&S.unlocked&&S.profile){history.replaceState(null,'',location.pathname+location.search);view='score';const r=_h2hRender();h2hJoin(j[1]);return r}return _h2hRender()};

/* finished or closed matches can be removed from this phone (the scoring session stays) */
function h2hOver(m){if(m.g&&window.suKeepPolling&&suKeepPolling(m))return false;if(m.g)return!!(m.closed||m.status=='full'||h2hBoard(m).fin);return!!(h2hCalc(m).win||m.status=='declined-by-opp')}
const h2hDelBtn=m=>h2hOver(m)?`<button class="btn ghost h2hdel" data-h2hdel="${esc(m.code)}" aria-label="Remove this match from this phone">Remove</button>`:'';
function h2hBindDel(){app.querySelectorAll('[data-h2hdel]').forEach(b=>b.onclick=()=>{const c=b.dataset.h2hdel;if(!confirm('Remove this match from this phone? Your scores stay in your sessions.'))return;
 S.matches=h2hAll().filter(m=>m.code!=c);save();if($('#h2hview')){cur=null;sv='sheet';if(view!='score')nav('score');else score()}else score()})}
/* drop invites from before the reset point that are still waiting on this phone */
if(typeof S!='undefined'&&S&&S.matches){const n=S.matches.length;S.matches=S.matches.filter(m=>!(m.status=='invite'&&(m.created||0)<H2H_RESET));if(S.matches.length!=n)save()}
