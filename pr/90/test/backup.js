/* Your data (paid-ready basics, 31 Oct 2026). Adds a "Your data" card to Me > Settings & help: save a backup file of this archer's
   ScoreTool data, restore it from a file, see whether the phone keeps the data, and a plain privacy note. Also shows a small
   "Offline · saved on this phone" line while the phone has no connection. Nothing here changes saved data except a restore the
   archer confirms, and before a restore the current data is kept on this phone under its own key. No account, login or payment. */
(function(){
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tid=()=>(typeof TESTER!='undefined'&&TESTER&&TESTER.id)||'nathe';
const tname=()=>(typeof TESTER!='undefined'&&TESTER&&(TESTER.short||TESTER.name))||'you';
const LASTK=()=>'scoretool.lastbackup.'+tid(),PREK=()=>'scoretool.prerestore.'+tid();
/* this archer's keys: the main record plus any scoretool.* key carrying this archer's id as one of its parts */
function myKeys(){const id=tid(),out=[KEY];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k||k==KEY||!/^scoretool\./.test(k))continue;
 if(k==PREK()||k==LASTK()||/^scoretool\.acct(\.|$)/.test(k))continue;const p=k.split('.');if(id!='nathe'?p.includes(id):p.includes('nathe'))out.push(k)}return out}
function shoots(o){return o&&Array.isArray(o.sessions)?o.sessions.length:0}
function makeBackup(){const keys={};myKeys().forEach(k=>{const v=localStorage.getItem(k);if(v!=null)keys[k]=v});
 return{app:'ScoreTool',kind:'backup',format:1,tester:tid(),name:tname(),made:new Date().toISOString(),main:KEY,keys}}
function fmt(iso){try{return new Date(iso).toLocaleString('en-AU',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'})}catch(e){return iso}}
window.stBackupDownload=function(){const b=makeBackup(),txt=JSON.stringify(b),d=new Date(),ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const name='scoretool-backup-'+tid()+'-'+ds+'.json';window.__lastBackup={name,txt};
 try{const u=URL.createObjectURL(new Blob([txt],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},1000)}catch(e){}
 if(!window.ADMIN_VIEW){try{localStorage.setItem(LASTK(),b.made)}catch(e){}}
 say('Backup file saved: '+name+' ('+shoots(JSON.parse(b.keys[KEY]||'null'))+' shoots). Keep it somewhere safe, such as Files or your email.');draw()};
/* check a backup file; returns {ok, msg, b} */
window.stBackupCheck=function(txt){let b;try{b=JSON.parse(txt)}catch(e){return{ok:false,msg:'That file is not a ScoreTool backup (it could not be read).'}}
 if(!b||b.app!='ScoreTool'||b.kind!='backup'||!b.keys||typeof b.keys!='object'||typeof b.main!='string'||typeof b.keys[b.main]!='string')return{ok:false,msg:'That file is not a ScoreTool backup.'};
 let m;try{m=JSON.parse(b.keys[b.main])}catch(e){return{ok:false,msg:'That backup file is damaged (the scores part could not be read).'}}
 if(!m||!Array.isArray(m.sessions))return{ok:false,msg:'That backup file is damaged (no list of shoots in it).'};
 if(b.tester!=tid())return{ok:false,msg:'That backup belongs to '+(b.name||b.tester)+'. Switch to that archer first, then restore it there.'};
 if(b.main!=KEY)return{ok:false,msg:'That backup does not match this archer on this phone.'};
 for(const k of Object.keys(b.keys)){if(!/^scoretool\./.test(k)||typeof b.keys[k]!='string')return{ok:false,msg:'That backup file has something in it that is not ScoreTool data, so it was not used.'}}
 return{ok:true,b,n:shoots(m),msg:''}};
window.stBackupRestore=function(txt,noConfirm){const c=stBackupCheck(txt);if(!c.ok){say(c.msg);return false}
 if(window.ADMIN_VIEW){say("You are viewing "+tname()+"'s profile, so nothing was restored. Tap Back to my profile at the top to use your own.");return false}
 const q='Replace the ScoreTool data on this phone for '+tname()+' ('+shoots(S)+' shoots) with the backup from '+fmt(c.b.made)+' ('+c.n+' shoots)? A copy of what is on the phone now is kept here first.';
 if(!noConfirm&&!confirm(q))return false;
 try{localStorage.setItem(PREK(),JSON.stringify(makeBackup()))}catch(e){say('There is not enough space on this phone to keep a copy first, so nothing was restored.');return false}
 try{Object.keys(c.b.keys).forEach(k=>localStorage.setItem(k,c.b.keys[k]))}catch(e){say('The restore could not finish (the phone is out of space). Your previous data is still kept as a copy.');return false}
 try{localStorage.setItem('scoretool.restored.note',JSON.stringify({t:Date.now(),n:c.n}))}catch(e){}
 location.reload();return true};
function say(m){const el=document.getElementById('bkmsg');if(el){el.textContent=m;el.hidden=false}else if(window.toast2)toast2(m)}
let PERS=null;
function storageLine(){if(PERS===true)return'This phone has agreed to keep the app\u2019s data, including when it is low on space.';
 if(PERS===false)return'If this phone gets very low on space it could clear app data, so keep a backup file now and then.';return''}
function card(){const last=localStorage.getItem(LASTK());
 return`<div class="card" id="datacard"><span class="kicker">Your data</span><h2>Back up and restore</h2>
<p class="small">Your scores, sight marks and settings for ${h(tname())} are saved on this phone as you go. They stay through app updates and work with no signal. A backup file lets you move them to a new phone or get them back if this phone is reset. Photos are not in the backup file.</p>
<p class="small" id="bkstore">${h(storageLine())}</p>
<p class="small" id="bklast">${last?'Last backup file: '+h(fmt(last))+'.':'No backup file saved from this phone yet.'}</p>
<button class="btn" id="bkdl" type="button">Save a backup file</button> <button class="btn ghost" id="bkrs" type="button">Restore from a backup file</button>
<input type="file" id="bkfile" accept=".json,application/json" hidden>
<p class="small" id="bkmsg" role="status" hidden></p>
<h2 style="margin-top:14px">Privacy</h2>
<p class="small" id="privacy">Your scores, sight marks and settings are kept on this phone. There is no account, no login and no payment details. Something leaves the phone only in these cases: league, match and group scores (with your display name) are shared with the other archers through a relay (ntfy.sh); if you link Archery Calendar, the rounds you send and their photos go to your Archery Calendar account; and anonymous usage (taps and scrolling, with anything you type hidden) is recorded by Microsoft Clarity so the app can be improved. A backup file is saved only where you choose. If you sign in, account backups are described under Restore my data, and this file backup still works.</p></div>`}
function draw(){const el=document.getElementById('datacard');if(!el)return;el.outerHTML=card();bind()}
function bind(){const d=document.getElementById('bkdl'),r=document.getElementById('bkrs'),f=document.getElementById('bkfile');if(!d)return;
 d.onclick=()=>stBackupDownload();r.onclick=()=>f.click();
 f.onchange=()=>{const file=f.files&&f.files[0];if(!file)return;const rd=new FileReader();rd.onload=()=>{stBackupRestore(String(rd.result||''));f.value=''};rd.onerror=()=>say('That file could not be read.');rd.readAsText(file)}}
function mount(){if(document.getElementById('datacard'))return;const s=document.getElementById('settingscard');if(!s)return;s.insertAdjacentHTML('afterend',card());bind();
 const o=restored();if(o)say('Backup restored: '+o.n+' shoots.')}
/* the restore note shows for a minute after the reload, on the Settings card and once as a toast */
function restored(){const n=localStorage.getItem('scoretool.restored.note');if(!n)return null;let o=null;try{o=JSON.parse(n)}catch(e){}
 if(o&&Date.now()-o.t<60000)return o;if(!window.ADMIN_VIEW)try{localStorage.removeItem('scoretool.restored.note')}catch(e){}return null}
function restoredToast(){const o=restored();if(o&&window.toast2)setTimeout(()=>toast2('Backup restored: '+o.n+' shoots.'),600)}
if(document.readyState=='loading')addEventListener('DOMContentLoaded',restoredToast);else restoredToast();
const base=E.lab_settings;if(base){const w=function(){base.apply(this,arguments);mount()};Object.assign(w,base);E.lab_settings=w}
/* ask the phone to keep the data (Safari home-screen apps and Chrome grant this without a prompt) */
try{if(navigator.storage&&navigator.storage.persisted)navigator.storage.persisted().then(p=>{if(p||!navigator.storage.persist)return p;return navigator.storage.persist()}).then(p=>{PERS=!!p;const el=document.getElementById('bkstore');if(el)el.textContent=storageLine()}).catch(()=>{})}catch(e){}
/* offline line */
try{const st=document.createElement('style');st.textContent='.offline-line{background:var(--night,#111);color:var(--gold,#e8b923);font-size:13px;font-weight:700;padding:6px 12px;text-align:center}.offline-line[hidden]{display:none}';document.head.appendChild(st)}catch(e){}
function off(){let el=document.getElementById('offline');if(navigator.onLine!==false){if(el)el.hidden=true;return}
 if(!el){el=document.createElement('div');el.id='offline';el.setAttribute('role','status');el.className='offline-line';el.textContent='Offline \u00b7 saved on this phone. Shared scores send when you are back online.';const t=document.querySelector('header.top');if(t)t.insertAdjacentElement('afterend',el);else document.body.prepend(el)}
 el.hidden=false}
addEventListener('online',off);addEventListener('offline',off);if(document.readyState=='loading')addEventListener('DOMContentLoaded',off);else off();
})();
