/* Score photos (23 Oct 2026): after finishing a round (Just me, Casual, League) an optional "Add a photo" (score sheet, target, the
   day), easy to skip; Past sessions can add / replace / remove. The phone shrinks it first (long edge about 640px, JPEG about 40 KB,
   plus a 96px thumb). Stored on this phone in IndexedDB (NEW database scoretool-photos, key <tester>:<session id>). Score records are
   never changed. When linked to Archery Calendar and online, the photo uploads through the token-checked RPC scoretool_save_photo
   (calendar repo supabase/score_photos.sql): only that archer's link secret can write, only the archer can read. Offline = queued.
   Before that SQL is run the RPC is missing, and uploads quietly do nothing. NEW localStorage keys: scoretool.cal.<tester>.phsent,
   .phdel, .phskip. */
(function(){
const SB='https://sllsqpfqwckwtljzjxli.supabase.co',KEY_PUB='sb_publishable_t2g3KYdoGeTtcXTO-URK9g_Nf69SEFq';
const WHO=()=>typeof TESTER!='undefined'&&TESTER&&TESTER.id||null;
const K=n=>'scoretool.cal.'+WHO()+'.'+n,get=n=>{try{return JSON.parse(localStorage.getItem(K(n))||'null')}catch(e){return null}},put=(n,v)=>localStorage.setItem(K(n),JSON.stringify(v));
const okTok=t=>/^[0-9a-f]{48}$/.test(t||'');
const IC=n=>window.icon?icon(n):'';
const esc2=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LONG=640,THUMB=96,TARGET_B=40*1024;
/* ---- IndexedDB ---- */
let DBP=null;
function db(){if(DBP)return DBP;DBP=new Promise((res,rej)=>{try{const r=indexedDB.open('scoretool-photos',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('photos'))r.result.createObjectStore('photos')};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}});DBP.catch(()=>{DBP=null});return DBP}
const tx=(mode,fn)=>db().then(d=>new Promise((res,rej)=>{const t=d.transaction('photos',mode),st=t.objectStore('photos');const r=fn(st);t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error)}));
const key=id=>WHO()+':'+id;
const idbGet=id=>tx('readonly',st=>st.get(key(id)));
const idbPut=(id,v)=>tx('readwrite',st=>st.put(v,key(id)));
const idbDel=id=>tx('readwrite',st=>st.delete(key(id)));
/* thumbs for this tester, in memory so lists render at once: {sessionId:{thumb,at}} */
const TH={};let loaded=false;
function loadAll(){if(!WHO()||!window.indexedDB)return Promise.resolve();const pre=WHO()+':';
 return tx('readonly',st=>{const out=[];const r=st.openCursor(IDBKeyRange.bound(pre,pre+'\uffff'));r.onsuccess=()=>{const c=r.result;if(c){out.push([String(c.key).slice(pre.length),c.value]);c.continue()}};return{get result(){return out}}})
  .then(L=>{(L||[]).forEach(([id,v])=>{if(v&&v.thumb)TH[id]={thumb:v.thumb,at:v.at||0}});loaded=true;refresh()}).catch(()=>{loaded=true})}
window.phHas=id=>!!TH[id];
/* ---- shrink ---- */
function loadImg(file){if(window.createImageBitmap)return createImageBitmap(file,{imageOrientation:'from-image'}).catch(()=>createImageBitmap(file)).catch(()=>viaImg(file));return viaImg(file)}
function viaImg(file){return new Promise((res,rej)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{res(im);setTimeout(()=>URL.revokeObjectURL(u),1000)};im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('That file is not a photo this phone can open.'))};im.src=u})}
const b64=c=>c.split(',')[1]||'';
const bytes=s=>Math.floor(s.length*3/4);
function draw(img,w,h,sx,sy,sw,sh){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,w,h);g.imageSmoothingQuality='high';g.drawImage(img,sx,sy,sw,sh,0,0,w,h);return c}
async function shrink(file){const img=await loadImg(file);const W0=img.width||img.naturalWidth,H0=img.height||img.naturalHeight;if(!W0||!H0)throw new Error('That photo could not be read.');
 let sc=Math.min(1,LONG/Math.max(W0,H0)),out=null,w=0,h=0;
 for(let pass=0;pass<5&&!out;pass++){w=Math.max(1,Math.round(W0*sc));h=Math.max(1,Math.round(H0*sc));const c=draw(img,w,h,0,0,W0,H0);
  for(let q=0.8;q>=0.34;q-=0.08){const d=b64(c.toDataURL('image/jpeg',q));if(bytes(d)<=TARGET_B){out=d;break}}
  if(!out)sc*=0.8}
 if(!out)throw new Error('That photo could not be made small enough.');
 const m=Math.min(W0,H0),t=draw(img,THUMB,THUMB,(W0-m)/2,(H0-m)/2,m,m);let thumb=b64(t.toDataURL('image/jpeg',0.72));if(bytes(thumb)>16000)thumb=b64(t.toDataURL('image/jpeg',0.5));
 try{img.close&&img.close()}catch(e){}
 return{photo:out,thumb,w,h,at:Date.now()}}
window.phShrink=shrink;
/* ---- UI ---- */
const skips=()=>get('phskip')||[];
function boxInner(id,ctx){const t=TH[id];
 if(t)return`<div class="phrow"><button type="button" class="phthumb" data-phact="view" data-phid="${esc2(id)}" aria-label="Open the photo"><img alt="Photo for this round" src="data:image/jpeg;base64,${t.thumb}"></button>
  <div class="phmeta"><span class="small">${IC('camera')} Photo saved${stTxt(id)}</span><div class="phbtns"><button type="button" class="btn ghost phbtn" data-phact="add" data-phid="${esc2(id)}">Replace photo</button><button type="button" class="btn ghost phbtn" data-phact="del" data-phid="${esc2(id)}">${IC('trash')} Remove</button></div></div></div>`;
 if(ctx=='fin'){if(skips().includes(id))return'';
  return`<div class="phfin"><button type="button" class="btn phadd" data-phact="add" data-phid="${esc2(id)}">${IC('camera')} Add a photo</button><button type="button" class="btn ghost phskip" data-phact="skip" data-phid="${esc2(id)}">Skip</button>
  <p class="small muted" style="margin:6px 0 0">Optional: your score sheet, target or the day. Kept small.</p></div>`}
 return`<button type="button" class="btn ghost phbtn phaddrow" data-phact="add" data-phid="${esc2(id)}">${IC('camera')} Add photo</button>`}
function stTxt(id){const tok=get('link');if(!okTok(tok))return'';const s=get('phsent')||{};if(state.off)return'';return TH[id]&&s[id]===TH[id].at?' · on Archery Calendar':' · waiting to upload'}
window.phBoxHtml=(id,ctx)=>{if(!WHO()||!id||!window.indexedDB)return'';ctx=ctx=='fin'?'fin':'row';return`<div class="phbox phbox-${ctx}" data-phbox="${esc2(id)}" data-phctx="${ctx}">${boxInner(id,ctx)}</div>`};
function refresh(id){document.querySelectorAll('[data-phbox]').forEach(el=>{if(id&&el.dataset.phbox!=id)return;el.innerHTML=boxInner(el.dataset.phbox,el.dataset.phctx)})}
window.phRefresh=refresh;
function say(m){if(window.toast2)toast2(m);else if(window.toast)toast(m)}
let pick=null;
function picker(){let f=document.getElementById('phfile');if(!f){f=document.createElement('input');f.type='file';f.accept='image/*';f.id='phfile';f.hidden=true;f.setAttribute('aria-hidden','true');document.body.appendChild(f);
  f.addEventListener('change',async()=>{const file=f.files&&f.files[0],id=pick;f.value='';if(!file||!id)return;
   document.querySelectorAll(`[data-phbox="${CSS.escape(id)}"]`).forEach(el=>el.innerHTML='<p class="small muted" style="margin:4px 0">Shrinking photo...</p>');
   try{const v=await shrink(file);await idbPut(id,v);TH[id]={thumb:v.thumb,at:v.at};const d=get('phdel')||[];if(d.includes(id))put('phdel',d.filter(x=>x!=id));refresh(id);say('Photo saved.');setTimeout(tick,50)}
   catch(e){refresh(id);say(e&&e.message||'That photo could not be saved.')}})}
 return f}
function viewer(id){idbGet(id).then(v=>{if(!v||!v.photo)return;const ov=document.createElement('div');ov.className='phov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Photo');
 ov.innerHTML=`<div class="phov-bar"><button type="button" class="btn ghost calback" data-phv="back">&lsaquo; Back</button></div><img alt="Photo for this round" src="data:image/jpeg;base64,${v.photo}">`;
 const close=()=>{ov.remove();removeEventListener('keydown',kd)},kd=e=>{if(e.key=='Escape')close()};
 ov.addEventListener('click',e=>{if(e.target.closest('[data-phv]')||e.target===ov)close()});addEventListener('keydown',kd);document.body.appendChild(ov);ov.querySelector('[data-phv]').focus()}).catch(()=>{})}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-phact]');if(!b)return;const id=b.dataset.phid,a=b.dataset.phact;e.preventDefault();
 if(a=='add'){pick=id;picker().click()}
 else if(a=='skip'){const L=skips();if(!L.includes(id)){L.push(id);put('phskip',L.slice(-300))}refresh(id)}
 else if(a=='view')viewer(id);
 else if(a=='del'){if(!confirm('Remove this photo? The score stays.'))return;idbDel(id).catch(()=>{});delete TH[id];const s=get('phsent')||{};if(id in s){delete s[id];put('phsent',s);const d=get('phdel')||[];if(!d.includes(id)){d.push(id);put('phdel',d)}}refresh(id);say('Photo removed.');setTimeout(tick,50)}});
/* ---- upload (linked + online); missing RPC (SQL not run yet) = quietly off ---- */
const state={busy:false,off:false,offAt:0};
async function rpc(fn,body){const r=await fetch(SB+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:KEY_PUB,Authorization:'Bearer '+KEY_PUB,'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(r.ok)return'ok';let j=null;try{j=await r.json()}catch(e){}const c=j&&j.code||'';if(r.status==404||c=='PGRST202'||c=='42P01'||c=='42883')return'off';if(c=='28000'||/not linked/i.test(j&&j.message||''))return'unlinked';return'err'}
async function tick(force){if(window.ADMIN_VIEW){window.avSkip&&avSkip('photos');return}if(state.off&&!force&&Date.now()-state.offAt<600000)return;if(state.busy||!WHO()||typeof S=='undefined'||!S.unlocked)return;const tok=get('link');if(!okTok(tok)||navigator.onLine===false)return;if(!loaded)return;
 state.busy=true;let changed=false;
 try{const D=(get('phdel')||[]).slice();for(const id of D){const r=await rpc('scoretool_remove_photo',{p_token:tok,p_source_id:WHO()+':'+id});if(r=='off'){state.off=true;state.offAt=Date.now();return}if(r!='ok')return;put('phdel',(get('phdel')||[]).filter(x=>x!=id))}
  const sent=get('phsent')||{};
  for(const id of Object.keys(TH)){if(sent[id]===TH[id].at)continue;const v=await idbGet(id).catch(()=>null);if(!v)continue;
   const r=await rpc('scoretool_save_photo',{p_token:tok,p_source_id:WHO()+':'+id,p_photo:v.photo,p_thumb:v.thumb,p_width:v.w||null,p_height:v.h||null});
   if(r=='off'){state.off=true;state.offAt=Date.now();return}if(r!='ok')return;const s2=get('phsent')||{};s2[id]=v.at;put('phsent',s2);changed=true}
  state.off=false}
 catch(e){}finally{state.busy=false;if(changed)refresh()}}
window.phTick=()=>tick(1);
/* Casual and League finish screens: add the photo card once my round is done (wraps the views; their code is unchanged) */
function after(el,html){if(el&&!document.querySelector('#phx')){el.insertAdjacentHTML('afterend',`<div class="card" id="phx">${html}</div>`)}}
function wrap(){
 if(typeof csView=='function'&&!csView._ph){const o=csView;csView=function(code){const r=o.apply(this,arguments);try{const cs=csGet(code),me=csMe();if(cs&&csDoneP(cs,me)){const v=document.querySelector('#csview');after(v&&v.firstElementChild,phBoxHtml('cs-'+cs.code,'fin'))}}catch(e){}return r};csView._ph=1;window.csView=csView}
 if(typeof lgView=='function'&&!lgView._ph){const o=lgView;lgView=function(code){const r=o.apply(this,arguments);try{const lg=lgGet(code),me=h2hMe(),W=lgWeek(lg);let w=0;for(let k=Math.min(6,W);k>=1;k--)if(lgDoneE(lgEnt(lg,me,k))){w=k;break}
   if(lg&&w)after(document.querySelector('#lgmine'),`<span class="kicker">Week ${w}</span>`+phBoxHtml('lg-'+lg.code+'-w'+w,'fin'))}catch(e){}return r};lgView._ph=1;window.lgView=lgView}}
function boot(){wrap();loadAll().then(tick)}
if(document.readyState=='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
addEventListener('online',()=>tick());setInterval(tick,20000);
})();
