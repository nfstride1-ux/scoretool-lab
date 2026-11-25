/* Archer profiles on this phone (25 Nov 2026). Every archer is an ordinary user: there is no built-in list of people, no
   preloaded results and no special accounts. Each profile's scores live in this phone's localStorage
   (scoretool.v1.<id>; the first profile ever made on older phones keeps the original key scoretool.v1).
   Profiles are created on this phone (scoretool.archers). A phone that was already using a profile from the old built-in list keeps it:
   it is turned into a normal profile here, named from that profile's own saved data, so nobody loses their scores. */
const TESTERS=[];
(function(){try{
 let A=JSON.parse(localStorage.getItem('scoretool.archers')||'[]')||[];if(!Array.isArray(A))A=[];
 /* a phone left in the old read-only "viewing as" mode goes back to its owner's own profile */
 if(localStorage.getItem('scoretool.adminReturn')=='nathe')localStorage.setItem('scoretool.tester','nathe');
 const cur=localStorage.getItem('scoretool.tester');
 /* 25 Nov 2026 (fix): the name for a profile from before testing ended comes ONLY from what this phone already saved for that id:
    its own score file's profile name, then its own display-name pick, then the name cache. Last resort: the id itself, capitalised. */
 const idCap=id=>String(id).charAt(0).toUpperCase()+String(id).slice(1);
 const phoneName=id=>{const J=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
  const d=J(id=='nathe'?'scoretool.v1':'scoretool.v1.'+id),o=J('scoretool.dname.'+id),D=J('scoretool.names')||{};
  const c=[d&&typeof d.profile=='string'?d.profile:'',o&&typeof o.n=='string'?o.n:'',D[id]&&typeof D[id].n=='string'?D[id].n:''].map(x=>String(x||'').trim()).find(x=>x.length>=2&&!/^(tester|archer)\s*\d*$/i.test(x));
  return String(c||idCap(id)).slice(0,40)};
 if(cur&&!A.some(a=>a&&a.id===cur)){
  const nm=phoneName(cur);
  A.push({id:cur,name:nm,short:nm.split(/\s+/)[0],bow:'Compound',founding:true}); /* an archer from before testing ended: keeps the free-for-life promise (19 Nov 2026) */localStorage.setItem('scoretool.archers',JSON.stringify(A));
 }
 /* a profile the first clean-up build already turned into just the capitalised id gets its own saved name, if the phone has one */
 let up=false;A.forEach(a=>{if(a&&a.founding&&a.id&&a.name===idCap(a.id)){const nm=phoneName(a.id);if(nm!==a.name){a.name=nm;a.short=nm.split(/\s+/)[0];up=true}}});if(up)localStorage.setItem('scoretool.archers',JSON.stringify(A));
 A.forEach(a=>{if(!a||!a.id||TESTERS.some(t=>t.id===a.id))return;
  const name=String(a.name||'Archer').slice(0,40);
  TESTERS.push({id:String(a.id),name,short:String(a.short||name).split(/\s+/)[0],bow:a.bow||'Compound',data:false,custom:!a.founding,founding:!!a.founding,junior:!!a.junior})});
 /* the old read-only "viewing as" mode is gone */
 localStorage.removeItem('scoretool.adminReturn');
}catch(e){}})();
window.ADMIN_VIEW=false;
const isGuest=t=>!!(t&&t.guest);window.isGuest=isGuest;
const TESTER=(function(){const q=new URLSearchParams(location.search).get('tester');let id=(q||'').toLowerCase();
 if(TESTERS.some(t=>t.id==id))localStorage.setItem('scoretool.tester',id);else{id=localStorage.getItem('scoretool.tester');
  /* an old ?tester= link for a profile that isn't on this phone: drop it from the address and carry on as usual (own profile or sign-up) */
  if(q)try{const u=new URL(location.href);u.searchParams.delete('tester');history.replaceState(history.state,'',u.toString())}catch(e){}}
 return TESTERS.find(t=>t.id==id)||null})();
function setTester(id){localStorage.setItem('scoretool.tester',id);const u=new URL(location.href);u.searchParams.delete('tester');u.hash='';location.href=u.toString()}
function testerLink(id){return location.origin+location.pathname+'?tester='+id}
function pickerLabel(t){if(t.junior){const D=window.NM_DEF;if(D&&D[t.id])return D[t.id];return t.short}return t.name}
function testerPicker(){return`<div class="card dark" id="whopick"><span class="kicker">Your profile</span><h1>Who's shooting?</h1><p>Scores stay on this phone. Create your profile to get started.</p>
${TESTERS.length?`<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start;margin-bottom:8px">${TESTERS.map(t=>`<button class="btn ghost" data-tester="${t.id}">${pickerLabel(t).replace(/[&<>"]/g,'')}</button>`).join('')}</div>`:''}
<div class="card" id="newprofile"><span class="kicker">New archer</span><h2>Create my profile</h2>
<label for="npname">Your name</label><input id="npname" maxlength="40" autocomplete="name">
<label class="small" style="display:flex;gap:8px;align-items:center;margin-top:8px"><input id="npjun" type="checkbox" style="width:auto"> Under 16. The list shows a nickname, not a full name.</label>
<p class="small" id="npmsg"></p><button class="btn alt full" id="npc" type="button">Create my profile</button></div>
<p class="small muted">You can change this later in Me.</p></div>`}
function bindTesterPicker(root){(root||document).querySelectorAll('[data-tester]').forEach(b=>b.onclick=()=>setTester(b.dataset.tester));
 const c=document.getElementById('npc');if(!c)return;
 c.onclick=()=>{const n=(document.getElementById('npname').value||'').trim();const msg=document.getElementById('npmsg');
  if(n.length<2){msg.textContent='Use at least 2 characters.';return}
  const id='u'+Math.random().toString(36).slice(2,8),junior=!!(document.getElementById('npjun')&&document.getElementById('npjun').checked);
  let A=[];try{A=JSON.parse(localStorage.getItem('scoretool.archers')||'[]')||[]}catch(e){A=[]}
  A.push({id,name:n,short:n.split(/\s+/)[0],bow:'Compound',junior});
  localStorage.setItem('scoretool.archers',JSON.stringify(A));
  setTester(id)}}
function testerCard(){return`<div class="card" id="archercard"><span class="kicker">Profile</span><h2>${TESTER?String(TESTER.name).replace(/[&<>"]/g,''):'No profile yet'}</h2><p class="small muted">Scores stay on this phone, separate for each archer.</p>
<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start">${TESTER?TESTERS.filter(t=>t.id!=TESTER.id).map(t=>`<button class="btn ghost" data-tester="${t.id}">Switch to ${pickerLabel(t).replace(/[&<>"]/g,'')}</button>`).join(''):''}</div></div>`}
