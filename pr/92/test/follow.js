/* ScoreTool demo: Follow (follow other archers). No backend yet, so the directory is empty: NO sample people.
   Data model, ready for sync (S.social, saved locally now, mirrored to the server later):
   profile.isSubscriber: only active ScoreTool subscribers appear in search and can be followed.
   S.social={privacy:'public'|'friends', following:[{id,name,since,status:'active'|'requested'}],
             followers:[{id,name,since}], requests:[{id,name,at}]}  (requests = people waiting for my OK when Friends only)
   Feed items reuse feed() (rank, PBs, badges, verified results) plus arrow counts. Preset cheers only, no chat. */
function soc(){const s=S.social=S.social||{};s.privacy=s.privacy||(S.u18?'friends':'public');['following','followers','requests'].forEach(k=>s[k]=s[k]||[]);return s}
/* Only archers with an active ScoreTool subscription (profile.isSubscriber) can be found or followed. */
const DIRECTORY=()=>[].filter(a=>a.isSubscriber); // filled by the server once live; never seeded with fake archers
let fq='';
function followView(){const s=soc(),me={id:'me',name:S.profile},q=fq.trim().toLowerCase();
 const hits=q?DIRECTORY().filter(a=>a.name.toLowerCase().includes(q)):[],meHit=q&&(S.profile||'').toLowerCase().includes(q);
 const F=s.following.filter(f=>f.status=='active'),items=window.feed?feed(F.map(f=>({...f,name:f.name}))):[];
 app.innerHTML=`<div class="card dark"><span class="kicker">Following</span><h1>Your feed</h1><p class="small muted" style="margin:0">${F.length} following · ${s.followers.length} followers · preset cheers only, no chat</p></div>${window.squadMini?squadMini():''}
 <div class="card"><label for="fs">Find archers by name</label><input id="fs" type="search" placeholder="e.g. first and last name" value="${esc(fq)}" autocomplete="off">
 <div id="fr" style="margin-top:8px">${!q?'<p class="small muted">Search anyone on the app, including pro archers, and follow their progress.</p>':
  (meHit?`<div class="list-item row"><span>${initDisc(me,32)} <b>${esc(myName())}</b> <span class="small muted">(you · ${s.privacy=='public'?'Public':'Friends only'})</span></span><button class="btn ghost" onclick="nav('profile')" style="padding:4px 10px">View</button></div>`:'')+
  (hits.length?hits.map(a=>`<div class="list-item row"><span>${initDisc(a,32)} <b>${esc(a.name)}</b></span><button class="btn" data-fo="${a.id}" style="padding:4px 10px">${a.privacy=='friends'?'Request':'Follow'}</button></div>`).join(''):'<p class="small muted">No archers found yet, follows work once the app is live.</p>')}</div></div>
 ${s.requests.length?`<div class="card"><span class="kicker">Follow requests</span>${s.requests.map(r=>`<div class="list-item row"><b>${esc(r.name)}</b><span><button class="btn" data-ok="${r.id}" style="padding:4px 10px">OK</button> <button class="btn ghost" data-no="${r.id}" style="padding:4px 10px">No</button></span></div>`).join('')}</div>`:''}
 <div class="card"><span class="kicker">Feed</span>${items.length?items.map(f=>`<div class="feed">${who(f.who)}<div style="flex:1"><div>${f.html}</div><div class="small muted">${f.sub||''}${f.ver?' · '+VER[f.ver]:''} · ${f.date}</div>${cheerRow(f,(soc().cheers=soc().cheers||{})[f.id]||{})}</div></div>`).join(''):'<p class="small muted">Follow archers to see their ranks, PBs, badges, arrow counts and verified results here.</p>'}</div>`;
 const i=$('#fs');i.oninput=()=>{fq=i.value;const p=i.selectionStart;followView();const n=$('#fs');n.focus();n.setSelectionRange(p,p)};
 app.querySelectorAll('[data-fo]').forEach(b=>b.onclick=()=>{const a=DIRECTORY().find(x=>x.id==b.dataset.fo);if(!a||!a.isSubscriber)return;s.following.push({id:a.id,name:a.name,since:today(),status:a.privacy=='friends'?'requested':'active'});save();followView()});
 app.querySelectorAll('[data-ok],[data-no]').forEach(b=>b.onclick=()=>{const id=b.dataset.ok||b.dataset.no,r=s.requests.find(x=>x.id==id);s.requests=s.requests.filter(x=>x.id!=id);if(b.dataset.ok)s.followers.push({id:r.id,name:r.name,since:today()});save();followView()});
 app.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const C=s.cheers=s.cheers||{},c=C[b.dataset.c]=C[b.dataset.c]||{};if(c.mine)c[c.mine]--;if(c.mine==b.dataset.e)c.mine=null;else{c.mine=b.dataset.e;c[b.dataset.e]=(c[b.dataset.e]||0)+1}save();followView()})}
const _pc=profileCard;profileCard=function(name,link){const h=_pc(name,link);if(name!=S.profile)return h;const s=soc();
 return h.replace(/<\/div><\/div>$/,`<div class="small" style="margin-top:8px"><b>${s.followers.length}</b> followers · <b>${s.following.filter(f=>f.status=='active').length}</b> following · ${s.privacy=='public'?'🌐 Public':'🔒 Friends only'}</div></div></div>`)};
const _pv=profileView;profileView=function(){_pv.apply(this,arguments);const s=soc();
 app.insertAdjacentHTML('beforeend',`<div class="card"><span class="kicker">Privacy</span><label style="display:flex;gap:8px;align-items:center"><input type="radio" name="pv" value="public" style="width:auto" ${s.privacy=='public'?'checked':''}> <span><b>Public</b><br><span class="small muted">Anyone can find and follow you.</span></span></label><label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="radio" name="pv" value="friends" style="width:auto" ${s.privacy=='friends'?'checked':''}> <span><b>Friends only</b><br><span class="small muted">Follows need your OK.</span></span></label></div>`);
 app.querySelectorAll('[name=pv]').forEach(r=>r.onchange=()=>{s.privacy=r.value;save();profileView()})};
const _rn=render;render=function(){if(view=='follow'&&S.unlocked&&!location.hash.startsWith('#share=')){$('#tabs').hidden=false;return followView()}return _rn.apply(this,arguments)};
