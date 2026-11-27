/* C14 (11 Nov 2026): server-side account backups for signed-in users (preview stub / same adapter as C12).
   Restore points and the recycle bin live under scoretool.acct.backup, never inside tester scoretool.v1 data.
   Nothing in the app can wipe that store, including Reset my scores or localStorage.clear. */
(function(){
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BK_K='scoretool.acct.backup';
const KEEP_DAYS=30;
window.ACCT_BACKUP_SETUP=[
  'Add acct_backups (id uuid, user_id uuid, made_at timestamptz, label text, payload jsonb) for dated restore points, with row level security so a user can only read and insert their own rows. Nothing in the app should delete these rows.',
  'Add acct_recycle (id uuid, user_id uuid, deleted_at timestamptz, kind text, payload jsonb) for the 30-day soft-delete bin, same RLS.',
  'A scheduled job (daily) deletes restore points and recycle-bin rows older than 30 days, and deletes both when the Auth user is removed. Keep at least the last 30 days until then.',
  'When ACCT_LIVE is true, the client should write a restore point after each signed-in change (or at least once a day) and read them for Restore my data. This preview keeps points in the scoretool.acct.backup stub instead.'
];

function read(k,d){try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(e){return d}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function slotId(){if(typeof TESTER!=='undefined'&&TESTER&&TESTER.id)return TESTER.id;const u=typeof acctUser==='function'&&acctUser();return(u&&(u.id||u.email))||'local'}
function bkAll(){const o=read(BK_K,{slots:{}});o.slots=o.slots||{};return o}
function bkSlot(){const all=bkAll(),id=slotId();all.slots[id]=all.slots[id]||{points:[],bin:[]};return{all,id,slot:all.slots[id]}}
function bkSave(all){write(BK_K,all)}
function snapshotData(){
  return{
    sessions:JSON.parse(JSON.stringify(S.sessions||[])),
    best:JSON.parse(JSON.stringify(S.best||[])),
    plots:JSON.parse(JSON.stringify(S.plots||[])),
    diary:JSON.parse(JSON.stringify(S.diary||[])),
    notes:JSON.parse(JSON.stringify(S.notes||{})),
    setup:JSON.parse(JSON.stringify(S.setup||[])),
    bows:JSON.parse(JSON.stringify(S.bows||[])),
    customRounds:JSON.parse(JSON.stringify(S.customRounds||[])),
    arrowSets:JSON.parse(JSON.stringify(S.arrowSets||[])),
    arrowSel:S.arrowSel||null,
    bowSel:S.bowSel||null,
    profile:S.profile||null
  };
}
function countSnap(d){
  const marks=()=>{let n=0;(d.bows||[]).forEach(b=>{n+=Object.keys(b.marks||{}).length;Object.values(b.setMarks||{}).forEach(m=>n+=Object.keys(m||{}).length)});return n};
  return{sessions:(d.sessions||[]).length,pbs:(d.best||[]).length,diary:(d.diary||[]).length,setups:(d.setup||[]).length,marks:marks(),notes:Object.keys(d.notes||{}).length};
}
function prune(slot){
  const cut=Date.now()-KEEP_DAYS*864e5;
  slot.points=(slot.points||[]).filter(p=>+new Date(p.at)>=cut);
  slot.bin=(slot.bin||[]).filter(p=>+new Date(p.at)>=cut);
}
function signed(){return typeof acctIsSignedIn==='function'&&acctIsSignedIn()}
function acctTakePoint(label){
  if(!signed())return null;
  const {all,slot}=bkSlot();
  const data=snapshotData(),sig=JSON.stringify(data);
  const last=slot.points[slot.points.length-1];
  if(last&&last.sig===sig)return last;
  const pt={id:'p'+Date.now(),at:new Date().toISOString(),label:label||'Auto',data,sig,counts:countSnap(data)};
  slot.points.push(pt);prune(slot);bkSave(all);return pt;
}
function acctSoftDelete(kind,item){
  if(!item)return;
  const {all,slot}=bkSlot();
  slot.bin.push({id:'d'+Date.now(),at:new Date().toISOString(),kind:kind||'item',item:JSON.parse(JSON.stringify(item))});
  prune(slot);bkSave(all);
}
function acctRestore(id){
  const {slot}=bkSlot();
  const pt=(slot.points||[]).find(p=>p.id===id);if(!pt||!pt.data)return{ok:false,msg:'That restore point is not on this phone.'};
  const d=JSON.parse(JSON.stringify(pt.data));
  S.sessions=d.sessions||[];S.best=d.best||[];S.plots=d.plots||[];S.diary=d.diary||[];S.notes=d.notes||{};
  S.setup=d.setup||[];S.bows=d.bows||[];S.customRounds=d.customRounds||[];
  if('arrowSets'in d)S.arrowSets=d.arrowSets;if('arrowSel'in d)S.arrowSel=d.arrowSel;if('bowSel'in d)S.bowSel=d.bowSel;
  if(d.profile&&!S.profile)S.profile=d.profile;
  save();
  return{ok:true,counts:countSnap(d),at:pt.at,label:pt.label};
}
function acctPoints(){return bkSlot().slot.points.slice().reverse()}
function acctBin(){return bkSlot().slot.bin.slice().reverse()}
let _bkTimer=null;
function acctOnSave(){
  if(!signed())return;
  clearTimeout(_bkTimer);
  _bkTimer=setTimeout(()=>acctTakePoint('Auto'),400);
}
(function protect(){
  const keep=k=>/^scoretool\.acct(\.|$)/.test(k||'');
  const rm=localStorage.removeItem.bind(localStorage);
  localStorage.removeItem=function(k){if(keep(k))return;return rm(k)};
  const cl=localStorage.clear.bind(localStorage);
  localStorage.clear=function(){const hold={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(keep(k))hold[k]=localStorage.getItem(k)}
    cl();Object.keys(hold).forEach(k=>localStorage.setItem(k,hold[k]))};
})();
(function hookSave(){
  const set=localStorage.setItem.bind(localStorage);
  localStorage.setItem=function(k,v){
    const r=set(k,v);
    try{if(k&&k.indexOf('scoretool.v1')===0)acctOnSave()}catch(e){}
    return r;
  };
})();
function fmt(iso){try{return new Date(iso).toLocaleString('en-AU',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'})}catch(e){return iso}}
function restoreCard(){
  const on=signed();
  const pts=on?acctPoints():[];
  const bin=on?acctBin():[];
  const pick=window._acctPt||(pts[0]&&pts[0].id)||'';
  const pt=pts.find(p=>p.id===pick);
  const c=pt&&pt.counts||null;
  const preview=c?`This point has ${c.sessions} session${c.sessions===1?'':'s'}, ${c.pbs} PB${c.pbs===1?'':'s'}, ${c.diary} diary ${c.diary===1?'entry':'entries'}, ${c.setups} setup${c.setups===1?'':'s'} and ${c.marks} sight mark${c.marks===1?'':'s'}. Confirming puts that data back on this phone. Account backups are not deleted.`:'Pick a restore point to see what will come back.';
  return`<div class="card" id="acctrestore"><span class="kicker">Your data</span><h2 style="margin:2px 0 6px">Restore my data</h2>
   <p class="small muted">${on?'Signed-in backups are kept as dated restore points for at least the last 30 days. Deletes go to a 30-day recycle bin. Nothing in the app wipes these backups, including Reset my scores. The file backup above still works.':'Sign in to keep automatic account backups of your scores, sessions, sight marks, setups, diary and PBs.'}</p>
   ${on?`<label for="acctpt">Restore point</label><select id="acctpt">${pts.length?pts.map(p=>`<option value="${h(p.id)}" ${p.id===pick?'selected':''}>${h(fmt(p.at))}${p.label?' · '+h(p.label):''}</option>`).join(''):'<option value="">No restore points yet</option>'}</select>
     <p class="small" id="acctprev" style="margin:8px 0">${h(preview)}</p>
     <button class="btn" type="button" id="acctgo" ${pt?'':'disabled'}>Restore this point</button>
     ${bin.length?`<p class="small muted" style="margin:10px 0 0">Recycle bin (last 30 days): ${bin.length} deleted item${bin.length===1?'':'s'}.</p>`:''}`:''}
   <h2 style="margin-top:14px">Privacy of account backups</h2>
   <p class="small" id="acctprivacy">When you are signed in, ScoreTool keeps restore points of your scores, sessions, sight marks, setups, diary and personal bests. In this preview they are stored in a separate account-backup store on this phone, standing in for the account server. Once accounts go live they are stored with your signed-in account on the app's server (the same backend as sign-in). Points are kept for at least the last 30 days, and soft-deleted items stay in a recycle bin for 30 days. They are deleted when the account is closed. These backups are not inside the Reset my scores data, and the app cannot wipe them. A file backup you save yourself is separate and still works.</p>
  </div>`;
}
function bakMount(){
  const data=document.getElementById('datacard')||document.getElementById('settingscard');
  if(!document.getElementById('acctrestore')&&data)data.insertAdjacentHTML('afterend',restoreCard());
  else if(document.getElementById('acctrestore'))document.getElementById('acctrestore').outerHTML=restoreCard();
  const root=document.getElementById('app');
  const $id=id=>(root||document).querySelector('#'+id);
  if($id('acctpt'))$id('acctpt').onchange=()=>{window._acctPt=$id('acctpt').value;bakMount()};
  if($id('acctgo'))$id('acctgo').onclick=()=>{
    const id=$id('acctpt')&&$id('acctpt').value;if(!id)return;
    const pt=acctPoints().find(p=>p.id===id);const c=pt&&pt.counts||{};
    if(!confirm(`Restore the point from ${pt?fmt(pt.at):id}? This puts ${c.sessions||0} sessions, ${c.pbs||0} PBs, ${c.diary||0} diary entries, ${c.setups||0} setups and ${c.marks||0} sight marks back on this phone. Your account backups are kept.`))return;
    const r=acctRestore(id);if($id('acctprev'))$id('acctprev').textContent=r.ok?'Restored. Your account backups are still there.':(r.msg||'Could not restore.');
    if(r.ok&&typeof nav==='function')setTimeout(()=>nav('lab_settings'),50);
  };
}
const base=E.lab_settings;
if(base){const w=function(){base.apply(this,arguments);bakMount()};Object.assign(w,base);E.lab_settings=w}
document.addEventListener('click',e=>{
  const b=e.target&&e.target.closest&&e.target.closest('#rs');
  if(!b||b.id!=='rs')return;
  try{if(signed())acctTakePoint('Before reset')}catch(err){}
},true);
Object.assign(window,{acctTakePoint,acctSoftDelete,acctRestore,acctPoints,acctBin,acctOnSave,acctSnapshot:snapshotData});
})();
