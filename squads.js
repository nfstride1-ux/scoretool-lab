/* ScoreTool demo: Squads. Closed, chat-free groups. Local-only simulation (no server).
   No free text between members: the only interaction is one preset cheer per item. */
const AVATARS=['🦊','🐨','🦘','🐧','🦉','🐢','🐬','🦅'];
const who=m=>window.initDisc?initDisc(m):`<span style="font-size:22px">${m.avatar||''}</span>`;
/* testers show by their chosen display name only (names.js); others keep 'First L.' */
const shortName=n=>{const d=window.dispName?dispName(n):n;if(d!==n)return d;const p=(n||'').trim().split(/\s+/);return p[0]+(p[1]?' '+p[1][0]+'.':'')};
/* Preset squad: every tester (20 Oct 2026, Nathe: all testers in ScoreTool Testers). Same code and members on every tester profile; data is still per phone (no server).
   Names are the tester profile names (testers.js) so each member's real data and points line up. */
const PRESET_SQ={preset:'st-testers-1',name:'ScoreTool Testers',code:'STRIDE-3T7',admin:'Nathaniel Stride',rawRank:false,
 members:(typeof TESTERS!='undefined'?TESTERS:[{id:'nathe',name:'Nathaniel Stride'},{id:'phill',name:'Phill Arthur'},{id:'logan',name:'Logan Wolfe'}]).filter(t=>!t.guest).map(t=>({id:{nathe:'mN',phill:'mP',logan:'mL'}[t.id]||'m_'+t.id,name:t.name,status:'active'})),
 adults:[{id:'aN',name:'Nathaniel Stride',role:'Admin'}]};
/* an already-seeded tester squad gets any tester it is missing, once (cheers and settings kept; a later admin removal sticks) */
/* 'all-testers-2' (20 Oct 2026): Estiaan joined after phones were topped up, so they get him once too (other removals still stick) */
function presetTopUp(){if(S.presetTop=='all-testers-2')return;const only=S.presetTop=='all-testers'?['m_estiaan']:null;S.presetTop='all-testers-2';const M=S.squad.members=S.squad.members||[];let n=0;PRESET_SQ.members.filter(m=>!only||only.includes(m.id)).forEach(m=>{if(!M.some(x=>x.name==m.name||x.id==m.id)){M.push({...m});n++}});save()}
function seedPreset(){if(S.squad&&S.squad.preset==PRESET_SQ.preset){S.presetSeeded=PRESET_SQ.preset;presetTopUp();return}if(S.presetSeeded==PRESET_SQ.preset)return;S.presetSeeded=PRESET_SQ.preset;if(S.squad&&S.squad.members&&S.squad.members.length)S.squadBefore=S.squad;
 S.squad=JSON.parse(JSON.stringify(PRESET_SQ));S.squad.cheers={};save()}
/* Invite codes: 3 letters + 4 digits (e.g. KTR-4827), no look-alike letters (I, O). Made on the creator's phone; no server. */
function newCode(){const L='ABCDEFGHJKLMNPQRSTUVWXYZ',r=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n};let c='';for(let i=0;i<3;i++)c+=L[r(L.length)];return c+'-'+String(1000+r(9000))}
function createCard(){return`<div class="card"><span class="kicker">New squad</span><h2>Create a squad</h2><p class="small">You become the admin. You'll get an invite code to share with your archers.</p><label for="cn">Squad name</label><input id="cn" placeholder="e.g. Tuesday juniors" autocomplete="off" maxlength="40"><button class="btn" id="cb" style="margin-top:8px">Create squad</button><div id="co"></div></div>`}
function bindCreate(){if(!$('#cb'))return;$('#cb').onclick=()=>{const n=$('#cn').value.trim();if(!n){$('#co').innerHTML='<p class="small">Give your squad a name.</p>';return}
 if(S.squad&&S.squad.members&&S.squad.members.length)S.squadBefore=S.squad;const code=newCode();
 S.squad={name:n,code,admin:S.profile,rawRank:false,members:[{id:'m'+Date.now(),name:S.profile,status:'active'}],adults:[{id:'a'+Date.now(),name:S.profile,role:'Admin'}],cheers:{},created:today()};save();
 $('#co').innerHTML=`<div class="card dark" style="margin-top:10px"><span class="kicker">Squad created</span><h3>${esc(n)}</h3><p>Invite code</p><p style="font-size:28px;font-weight:800;letter-spacing:2px;margin:4px 0">${code}</p><button class="btn ghost" id="cc">Copy code</button> <button class="btn" id="cgo">Open squad</button><p class="small muted">Share it with your archers. They enter it in Squads → Join a squad.</p></div>`;
 $('#cc').onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(code);$('#cc').textContent='Copied'};$('#cgo').onclick=()=>squad()}}
function seedSquad(){seedPreset();if(S.squad){S.squad.members=S.squad.members||[];S.squad.adults=S.squad.adults||[];S.squad.cheers=S.squad.cheers||{}}}
const isAdmin=()=>S.squad&&S.squad.admin==S.profile;
const myAdult=()=>((S.squad&&S.squad.adults)||[]).find(a=>a.name==S.profile);
const ROLE_TAG=r=>`<span class="sample" style="background:${r=='Admin'?'#fef3c7':r=='Coach'?'#dcfce7':'#e0e7ff'};color:#0f172a">${r}</span>`;
/* Logan's numbers come from his real data; sample kids use fixed numbers. */
function memberStats(m){if(m.sample)return m;const real=realFor(m.name).filter(r=>!r.incomplete);
 const wk=weekArrows(m.name);
 const rts=real.map(r=>{const c=aaCategory(r.division);return c?aaRating(r.score,r.round,c.bow=='Compound'&&r.round=='WA Indoor 18m'):null}).filter(x=>x!=null);
 const lastR=rts[rts.length-1],prev=rts.slice(-11,-1),avg=prev.length?prev.reduce((a,b)=>a+b,0)/prev.length:null;
 const last=real[real.length-1];const dm=arrowDays(m.name);const goal=(m.name==S.profile&&S.goal)||300;let st=0;for(let k=0;k<400;k++){const d=new Date(Date.now()-k*864e5).toLocaleDateString('en-CA');if((dm[d]||0)>=goal)st++;else if(k>0)break}
 const vbl=earnedBadges(m.name).map(b=>[hexIcon(b,1),b.name,b.on]),vb=vbl.filter(x=>x[2]).length;
 return{...m,wk,streak:st,badges:vb,blist:vbl,impr:avg?+((lastR-avg)/avg*100).toFixed(1):0,last:last?normDate(last.date):null,raw:last?[[normDate(last.date),last.round,last.score,'official']]:[]}}
const VER={official:'<span class="real">✓ verified · Archer\'s Diary</span>',plot:'<span class="real">✓ verified · plotted</span>',keypad:'<span class="sample">self-logged</span>'};
function feed(Ms){const F=[];Ms.forEach(m=>{const n=shortName(m.name),R=realFor(m.name).filter(r=>!r.incomplete);
 const last=R[R.length-1];if(last){const prev=R.slice(0,-1).filter(r=>r.round==last.round&&r.division==last.division),pb=prev.length&&last.score>Math.max(...prev.map(r=>r.score));
  F.push({id:m.id+'s'+normDate(last.date)+last.round,date:normDate(last.date),who:m,pb,html:pb?`<b>${esc(n)}</b> set a <b style="color:var(--gold)">NEW CEILING</b> · ${last.score} PB`:`<b>${esc(n)}</b> shot <b>${last.score}</b>`,sub:`${esc(last.round)} · official`,ver:'official'})}
 /* badge news is dated when the badge was really earned; badges without a known date stay out of the feed */
 const B=earnedBadges(m.name).filter(b=>b.on&&b.when).sort((a,b)=>a.when<b.when?-1:1),top=B.slice(-2);top.forEach(b=>F.push({id:m.id+'b'+b.id,date:b.when,who:m,html:`<b>${esc(n)}</b> unlocked <b class="rt-${b.rarity}">${b.name.toUpperCase()}</b> <span class="pill" style="background:var(--night2);color:var(--r-${b.rarity=='legendary'?'leg':b.rarity=='mythic'?'myth':b.rarity})">${RARITY[b.rarity]}</span>`,sub:esc(b.how)}));
 if(window.rankFeed)rankFeed(m,n).forEach(x=>F.push(x));
 if(m.impr>3)F.push({id:m.id+'i',date:m.last||today(),who:m,html:`<b>${esc(n)}</b> is <b class="up">+${m.impr}%</b> on their own average`,sub:'vs own last 10 rounds'})});return F.sort((a,b)=>a.date<b.date?1:-1).slice(0,12)}
/* Preset cheers only (no free text). Bullseye is a gold cheer that only appears on personal-best posts. */
const CHEER_SET=[['dialled','Dialled',ICON.flawless],['clutch','Clutch','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>'],['onfire','On fire','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4 3 7 7 7z"/></svg>'],['goat','GOAT','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>'],['respect','Respect','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7 6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 15"/></svg>']];
const BULLSEYE=['bullseye','Bullseye','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>'];
function cheerRow(f,c){const set=f.pb?[BULLSEYE,...CHEER_SET]:CHEER_SET;return`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px" role="group" aria-label="Cheer">${set.map(([k,l,ic])=>`<button class="cheer ${k=='bullseye'?'gold':''}" data-c="${f.id}" data-e="${k}" aria-pressed="${c.mine==k}">${ic} ${l}${c[k]?' '+c[k]:''}</button>`).join('')}</div>`}
let sqTab='wk';
function squad(){seedSquad();const Q=S.squad;
 if(!Q||!Q.members.some(m=>m.name==S.profile)&&!myAdult()){app.innerHTML=`<div class="card"><span class="kicker">Squads</span><h2>Join a squad</h2><p class="small">Got an invite code from your coach or squad mate? Enter it to join.</p><label for="jc">Invite code</label><input id="jc" placeholder="ABC-1234" autocapitalize="characters" autocomplete="off"><button class="btn" id="jb" style="margin-top:8px">Join squad</button><div id="jo"></div></div>${createCard()}${safe()}`;bindCreate();
  $('#jb').onclick=()=>{const c=$('#jc').value.trim().toUpperCase();if(c.length<4){$('#jo').innerHTML='<p class="small">Enter the full invite code.</p>';return}
   if(c==PRESET_SQ.code){delete S.squad;seedPreset()}else if(!S.squad||S.squad.code!=c)S.squad={name:'Squad '+c,code:c,admin:null,members:[],adults:[],cheers:{}};
   S.squad.members.push({id:'m'+Date.now(),name:S.profile,status:'active'});save();squad()};return}
 const act=Q.members.filter(m=>m.status!='pending').map(memberStats);
 const metrics={wk:['This week\'s arrows',m=>m.wk,v=>v],streak:['Goal streak (days)',m=>m.streak,v=>v],badges:['Badges earned',m=>m.badges,v=>v],impr:['Improvement vs own average',m=>m.impr,v=>(v>0?'+':'')+v+'%']};
 if(Q.rawRank)metrics.raw=['Latest score (admin on)',m=>m.raw&&m.raw[0]?m.raw[0][2]:0,v=>v];
 const M=metrics[sqTab]||metrics.wk,rows=act.slice().sort((a,b)=>M[1](b)-M[1](a));
 const me=act.find(m=>m.name==S.profile);
 let h=`<div class="card dark"><span class="kicker">Squad · private</span><h1>${esc(Q.name)}</h1><p class="small" style="margin:0">${plN(act.length,'member','members')} · ${plN((Q.adults||[]).length,'adult','adults')} · no chat, cheers only · invite code <b>${esc(Q.code)}</b>${myAdult()?' · you are '+(myAdult().role=='Admin'?'the admin':'a '+myAdult().role.toLowerCase()):''}</p></div>
 ${window.leagueCard?leagueCard():''}<div class="card"><span class="kicker">More boards</span><div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">${Object.entries(metrics).map(([k,v])=>`<button class="btn ${k==sqTab?'':'ghost'}" data-m="${k}" style="padding:6px 10px;font-size:13px">${v[0]}</button>`).join('')}</div>
 ${rows.map((m,i)=>`<div class="list-item row"><span>${i+1}. ${who(m)} <b>${shortName(m.name)}</b>${m.sample?' <span class="sample">sample</span>':''}</span>${sqTab=='badges'?`<div style="max-width:55%">${iconRow(m.blist||[],20)}</div>`:`<b>${M[2](M[1](m))}</b>`}</div>`).join('')}
 <p class="small muted">${sqTab=='impr'?'Each archer is compared with their own last 10 rounds, so it\'s fair across ability.':'Ranks effort and badges, not raw scores.'}</p></div>
 <div class="card"><span class="kicker">Activity</span>${(()=>{const F=feed(act);return F.length?F.map(f=>{const c=Q.cheers[f.id]||{};return`<div class="feed${f.pb?' pbpost':''}">${who(f.who)}<div style="flex:1;min-width:0"><div>${f.html}</div><div class="small muted">${f.sub||''}${f.ver?' · '+VER[f.ver]:''} · ${f.date}</div>${cheerRow(f,c)}</div></div>`}).join(''):'<p class="small muted">Nothing yet. Shoot a round and it shows up here.</p>'})()}<p class="small muted">Preset cheers only, one per post. No chat or comments.</p></div>`;
 const AD=Q.adults||[],kid=id=>{const m=Q.members.find(x=>x.id==id);return m?shortName(m.name):'?'};
 h+=`<div class="card"><span class="kicker">Coaches & parents</span><p class="small muted" style="margin:2px 0 6px">They can see the feed, leaderboards and badges, and send the same cheers.</p>${AD.map(a=>`<div class="list-item row"><span><b>${a.display||shortName(a.name)}</b> ${ROLE_TAG(a.role)}${a.tag?' '+ROLE_TAG(a.tag):''}${a.child&&!a.display?` <span class="small muted">parent of ${kid(a.child)}</span>`:''}${a.sample?' <span class="sample">sample</span>':''}</span>${isAdmin()&&a.role!='Admin'?`<button class="btn ghost" data-ra="${a.id}" style="padding:4px 10px">Remove</button>`:''}</div>`).join('')}
 ${isAdmin()?`<details style="margin-top:8px"><summary class="small"><b>Add a coach or parent</b></summary><label for="an">First and last name</label><input id="an" autocomplete="off"><label for="ar">Role</label><select id="ar"><option>Coach</option><option>Parent</option></select><label for="ac">Parent of (parents only)</label><select id="ac"><option value="">–</option>${act.map(m=>`<option value="${m.id}">${shortName(m.name)}</option>`).join('')}</select><button class="btn" id="aadd" style="margin-top:6px">Add</button><p class="small muted">They get an invite to an adult account. Parents are linked to their own child only.</p></details>`:''}</div>`;
 if(isAdmin()){const quiet=act.filter(m=>!m.last||(new Date(today())-new Date(m.last))/864e5>=5);
  h+=`<div class="card" style="border:2px dashed #94a3b8"><span class="kicker">Admin only</span><h3>Squad settings</h3><p>Invite code: <b>${Q.code}</b> <span class="small muted">(private; squads can't be searched)</span></p>
  ${quiet.map(m=>`<p class="small">🔔 ${shortName(m.name)} hasn't logged for 5+ days. Only you can see this.</p>`).join('')}
  <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="rr" style="width:auto" ${Q.rawRank?'checked':''}> Show a raw-score leaderboard</label>
  <h3>Members</h3>${act.map(m=>`<div class="list-item row"><span>${who(m)} ${shortName(m.name)}</span>${m.name==S.profile?'':`<button class="btn ghost" data-rm="${m.id}" style="padding:4px 10px">Remove</button>`}</div>`).join('')}</div>`}
 if(me){h+=`<div class="card"><h3>Me in this squad</h3><p class="small muted">Squad mates see your player card: initials, ${shortName(me.name)}, rank, title and badges. No photo, club or contact details.</p><button class="btn ghost" onclick="nav('profile')">Edit my card</button> <button class="btn ghost" id="lv">Leave squad</button></div>`}
 h+=`<details class="card" id="sqcd" ${window._sqCreate?'open':''}><summary><b>Create another squad</b></summary>${createCard()}</details>`+safe();app.innerHTML=h;bindCreate();if(window._sqCreate){window._sqCreate=0;setTimeout(()=>{const d=$('#sqcd');if(d)d.scrollIntoView({block:'start'})},50)}
 app.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{sqTab=b.dataset.m;squad()});
 app.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const c=Q.cheers[b.dataset.c]=Q.cheers[b.dataset.c]||{};if(c.mine){c[c.mine]--;}if(c.mine==b.dataset.e){c.mine=null}else{c.mine=b.dataset.e;c[b.dataset.e]=(c[b.dataset.e]||0)+1}save();squad()});
 app.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{const id=b.dataset.rm;if(!confirm('Remove this member from the squad?'))return;Q.members=Q.members.filter(m=>m.id!=id);save();squad()});
 app.querySelectorAll('[data-ra]').forEach(b=>b.onclick=()=>{if(!confirm('Remove this adult from the squad?'))return;Q.adults=Q.adults.filter(x=>x.id!=b.dataset.ra);save();squad()});
 if($('#aadd'))$('#aadd').onclick=()=>{const n=$('#an').value.trim(),r=$('#ar').value,c=$('#ac').value;if(!n||(r=='Parent'&&!c))return alert(r=='Parent'?'Pick which child this parent is linked to.':'Enter a name.');Q.adults.push({id:'a'+Date.now(),name:n,role:r,child:r=='Parent'?c:null});save();squad()};
 if($('#rr'))$('#rr').onchange=e=>{Q.rawRank=e.target.checked;if(!Q.rawRank&&sqTab=='raw')sqTab='wk';save();squad()};
  if($('#lv'))$('#lv').onclick=()=>{if(!confirm('Leave this squad?'))return;Q.members=Q.members.filter(m=>m.name!=S.profile);save();squad()}}
function safe(){return`<div class="card"><span class="kicker">Safe squads</span><ul class="small" style="padding-left:18px;margin:6px 0">
 <li>Private and invite-only. Squads can't be searched. Anyone with the invite code joins straight away.</li><li>Roles: Admin (the coach or parent who made it), Coach, Parent and Archer. Only the admin adds coaches and parents.</li>
 <li>No chat, comments or photos. Only preset cheers (Dialled, Clutch, On fire, GOAT, Respect, and Bullseye on PB posts).</li><li>Only first name, last initial and a player card (initials, rank, badges) are shown. No photo, club or contact details.</li>
 <li>Leaderboards rank effort and badges, and improvement against your own average. Raw scores stay hidden unless the admin turns them on.</li>
 <li>"Hasn't logged lately" reminders go only to the admin, never to the squad.</li><li>Anyone can leave at any time. Admins can remove members.</li>
 <li>✓ verified means the score came from Archer's Diary or was plotted arrow by arrow; keypad-only practice shows as self-logged.</li></ul></div>`}

/* Squads section for the Following tab: squad card(s) with a mini top 3 (this week's arrows, effort not scores). */
window.squadMini=function(){seedSquad();const Q=S.squad,ins=Q&&(Q.members.some(m=>m.name==S.profile)||myAdult());
 let h=`<div class="card"><span class="kicker">Squads</span>`;
 if(ins){const act=Q.members.filter(m=>m.status!='pending').map(memberStats).sort((a,b)=>b.wk-a.wk).slice(0,3);
  h+=`<div class="list-item" style="display:block"><div class="row"><b>${esc(Q.name)}</b><span class="small muted">${plN(Q.members.filter(m=>m.status!='pending').length,'member','members')}</span></div>
  <div class="small muted" style="margin:4px 0 2px">Top 3 · this week's arrows</div>${act.map((m,i)=>`<div class="row small"><span>${i+1}. ${who(m)} ${m.name==S.profile?'<b>You</b>':esc(shortName(m.name))}</span><b>${m.wk}</b></div>`).join('')}
  <button class="btn ghost" style="margin-top:8px;padding:6px 12px" onclick="nav('squad')">Open squad ›</button></div>`}
 else h+=`<p class="small muted">You're not in a squad yet.</p>`;
 return h+`<button class="btn ghost full" style="margin-top:8px" onclick="window._sqCreate=1;nav('squad')">Create or join a squad</button></div>`};
