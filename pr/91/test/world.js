/* C15: practice Category + searchable body-grouped Round picker, and confirmed world rounds.
   Official / event-tied flows are not changed. Catalogue is WORLD_ROUNDS (221 confirmed). */
(function(){
window.WORLD_APPLY_UP_TO=Math.max(window.WORLD_APPLY_UP_TO||0,6);

const CATS=['Indoor','Outdoor Target','Field','3D','Clout'];
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const L=()=>window.WORLD_ROUNDS||[];
const unconf=()=>window.WORLD_UNCONFIRMED||[];

function bodyGroup(r){
  if(r.hist)return 'Historical — '+(r.body.replace(/\s*\(historical[^)]*\)/i,'').trim()||'Archery Australia');
  const b=r.body||'Other';
  return b.replace(/\s*\(historical[^)]*\)/i,'').trim();
}
function blob(r){
  return [r.name,r.key,r.body,r.cat,...(r.aliases||[]),r.note||''].join(' ').toLowerCase();
}
function inRounds(key){return !!(typeof ROUNDS==='object'&&ROUNDS[key]&&!ROUNDS[key].legacy)}

function worldRows(cat,q){
  const words=String(q||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
  return L().filter(r=>{
    if(cat&&r.cat!==cat)return false;
    if(!inRounds(r.key)&&r.wave!==0)return false; /* only list rounds already registered */
    if(r.wave===0&&!inRounds(r.key))return false;
    if(!words.length)return true;
    const b=blob(r);
    return words.every(w=>b.includes(w));
  });
}

/* Official rounds that are not in the 11 Nov 2026 world catalogue (for example Lancaster 660). */
function officialExtras(cat,q){
  if(typeof ROUNDS!=='object')return[];
  const words=String(q||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
  return Object.keys(ROUNDS).filter(k=>{
    const R=ROUNDS[k];if(!R||R.legacy||R.custom||R.worldNew)return false;
    if(!R.lancaster)return false;
    const c=R.worldCat||'Indoor';
    if(cat&&c!==cat)return false;
    if(!words.length)return true;
    const b=[k,'Lancaster','Classic','660'].join(' ').toLowerCase();
    return words.every(w=>b.includes(w));
  });
}
/* Existing unofficial templates stay available, not part of the 221. */
function templates(cat){
  const T=[['Practice 10 ends × 3','Indoor'],['Practice 6 ends × 6','Outdoor Target']];
  return T.filter(([,c])=>!cat||c===cat).map(([k])=>k).filter(inRounds);
}

function groupsOf(rows){
  const order=['World Archery','Archery Australia','Archery GB','IFAA','NFAA','ASA','IBO','ABA','Archery Canada'];
  const G={};
  rows.forEach(r=>{const g=bodyGroup(r);(G[g]=G[g]||[]).push(r)});
  const names=Object.keys(G).sort((a,b)=>{
    const ha=a.startsWith('Historical'),hb=b.startsWith('Historical');
    if(ha!==hb)return ha?1:-1;
    const ia=order.indexOf(a),ib=order.indexOf(b);
    if(ia>=0||ib>=0)return(ia<0?99:ia)-(ib<0?99:ib);
    return a<b?-1:a>b?1:0;
  });
  return names.map(n=>[n,G[n]]);
}

function defaultCat(){
  const last=typeof S!=='undefined'&&S.lastRound, row=L().find(r=>r.key===last||r.name===last);
  if(row)return row.cat;
  if(last&&/indoor|vegas/i.test(last))return'Indoor';
  if(last&&/field|ifaa/i.test(last))return'Field';
  if(last&&/3d|aba/i.test(last))return'3D';
  if(last&&/clout/i.test(last))return'Clout';
  return'Outdoor Target';
}

function optsFor(cat,q,selected){
  const rows=worldRows(cat,q);
  const seen=new Set();
  let html='';
  groupsOf(rows).forEach(([g,rs])=>{
    const unique=rs.filter(r=>{if(seen.has(r.key+'|'+r.name))return false;seen.add(r.key+'|'+r.name);return true});
    if(!unique.length)return;
    html+=`<optgroup label="${h(g)}">${unique.map(r=>`<option value="${h(r.key)}" ${r.key===selected?'selected':''}>${h(r.name)}</option>`).join('')}</optgroup>`;
  });
  const tmpl=templates(cat).filter(k=>!q||k.toLowerCase().includes(String(q).toLowerCase()));
  if(tmpl.length)html+=`<optgroup label="Practice templates">${tmpl.map(k=>`<option value="${h(k)}" ${k===selected?'selected':''}>${h(k)}</option>`).join('')}</optgroup>`;
  const mine=(typeof S!=='undefined'&&S.customRounds||[]).map(c=>c.name).filter(n=>!q||n.toLowerCase().includes(String(q).toLowerCase()));
  if(mine.length)html+=`<optgroup label="My rounds">${mine.map(n=>`<option value="${h(n)}" ${n===selected?'selected':''}>${h(n)}</option>`).join('')}</optgroup>`;
  html+=`<option value="__new">+ Create my own practice round</option>`;
  return html;
}

function labelFor(key,name){
  const R=typeof ROUNDS==='object'&&ROUNDS[key],n=name||key;
  if(!R)return n;
  const arrows=R.ends&&R.ape?R.ends*R.ape:(Array.isArray(R.apes)?R.apes.reduce((a,b)=>a+b,0):0);
  const unit=R.aba||R.ifaa||R.scheme&&/field|3d|animal|foresters|special/i.test(R.scheme)?'targets':'ends';
  const bits=[];
  if(R.ends&&R.ape&&!R.apes)bits.push(`${R.ends} ${unit} × ${R.ape}`);
  else if(arrows)bits.push(arrows+' arrows');
  if(R.max!=null)bits.push('max '+R.max);
  else if(R.config)bits.push('target count set by you');
  return bits.length?`${n} (${bits.join(' · ')})`:n;
}

function allRdOpts(selected){
  const rows=L().filter(r=>inRounds(r.key));
  const seen=new Set();
  let html='';
  groupsOf(rows).forEach(([g,rs])=>{
    const unique=rs.filter(r=>{if(seen.has(r.key+'|'+r.name))return false;seen.add(r.key+'|'+r.name);return true});
    if(!unique.length)return;
    html+=`<optgroup label="${h(g)}">${unique.map(r=>`<option value="${h(r.key)}" ${r.key===selected?'selected':''}>${h(r.name)}</option>`).join('')}</optgroup>`;
  });
  const extra=officialExtras(null,'');
  if(extra.length)html+=`<optgroup label="Lancaster Archery">${extra.map(k=>`<option value="${h(k)}" ${k===selected?'selected':''}>${h(k)}</option>`).join('')}</optgroup>`;
  const tmpl=templates(null);
  if(tmpl.length)html+=`<optgroup label="Practice templates">${tmpl.map(k=>`<option value="${h(k)}" ${k===selected?'selected':''}>${h(k)}</option>`).join('')}</optgroup>`;
  const mine=(typeof S!=='undefined'&&S.customRounds||[]).map(c=>c.name);
  if(mine.length)html+=`<optgroup label="My rounds">${mine.map(n=>`<option value="${h(n)}" ${n===selected?'selected':''}>${h(n)}</option>`).join('')}</optgroup>`;
  html+=`<option value="__new">+ Create my own practice round</option>`;
  return html;
}

function catOfKey(key){
  const row=L().find(r=>r.key===key||r.name===key);
  if(row)return row.cat;
  if(key==='Lancaster 660'||(typeof ROUNDS==='object'&&ROUNDS[key]&&ROUNDS[key].lancaster))return'Indoor';
  if(key==='Practice 10 ends × 3')return'Indoor';
  if(key==='Practice 6 ends × 6')return'Outdoor Target';
  if(key&&/indoor|vegas/i.test(key))return'Indoor';
  if(key&&/field|ifaa/i.test(key))return'Field';
  if(key&&/3d|aba/i.test(key))return'3D';
  if(key&&/clout/i.test(key))return'Clout';
  return null;
}

function listHTML(cat,q,selected){
  const rows=worldRows(cat,q);
  const grouped=groupsOf(rows);
  const list=grouped.map(([g,rs])=>{
    const items=rs.map(r=>{
      const extra=labelFor(r.key,r.name).replace(r.name,'').replace(/^\s*/,'');
      const als=(r.aliases||[]).filter(a=>a!==r.name);
      return`<button type="button" class="wrd-item${r.key===selected?' on':''}" data-wrd="${h(r.key)}" data-wrdn="${h(r.name)}"><b>${h(r.name)}</b><small>${h(extra)}${als.length?' · also '+h(als.join(', ')):''}</small></button>`;
    }).join('');
    return`<div class="wrd-g"><div class="wrd-gh">${h(g)}</div>${items}</div>`;
  }).join('')||(q?`<p class="small muted" id="wrdempty">No confirmed rounds in this category match that search.</p>`:`<p class="small muted" id="wrdempty">No confirmed rounds in this category are available yet.</p>`);
  const extra=officialExtras(cat,q);
  const extraH=extra.length?`<div class="wrd-g"><div class="wrd-gh">Lancaster Archery</div>${extra.map(k=>`<button type="button" class="wrd-item${k===selected?' on':''}" data-wrd="${h(k)}"><b>${h(k)}</b><small>${h(labelFor(k,k).replace(k,'').replace(/^\s*/,''))}</small></button>`).join('')}</div>`:'';
  const tmpl=templates(cat).filter(k=>!q||k.toLowerCase().includes(String(q).toLowerCase()));
  const tmplH=tmpl.length?`<div class="wrd-g"><div class="wrd-gh">Practice templates</div>${tmpl.map(k=>`<button type="button" class="wrd-item${k===selected?' on':''}" data-wrd="${h(k)}"><b>${h(k)}</b></button>`).join('')}</div>`:'';
  return list+extraH+tmplH+` <button type="button" class="wrd-item wrd-custom" data-wrd="__new"><b>+ Create my own practice round</b></button>`;
}

function worldPickerHTML(){
  const last=(typeof S!=='undefined'&&S.lastRound)||'';
  let cat=window._rdCat&&CATS.includes(window._rdCat)?window._rdCat:(catOfKey(last)||defaultCat());
  window._rdCat=cat;
  const q=window._rdQ||'';
  const rows=worldRows(cat,q);
  const selected=inRounds(last)||last==='__new'||((typeof S!=='undefined'&&S.customRounds||[]).some(c=>c.name===last))?last:(rows[0]&&rows[0].key)||templates(cat)[0]||'__new';
  return`<label for="rdcat">Category</label>
<select id="rdcat">${CATS.map(c=>`<option${c===cat?' selected':''}>${c}</option>`).join('')}</select>
<label for="rdq">Find a round</label>
<input id="rdq" type="search" placeholder="Name, alias or body" value="${h(q)}" autocomplete="off">
<label for="rd">Round</label>
<div id="wrdlist" class="wrd-list" role="listbox" aria-label="Rounds in this category">${listHTML(cat,q,selected)}</div>
<select id="rd" class="wrd-select" aria-label="Round">${allRdOpts(selected)}</select>
<div id="wrdcfg"></div>`;
}

function worldBindPicker(){
  const catEl=$('#rdcat'),qEl=$('#rdq'),rd=$('#rd');
  if(!catEl||!rd)return;
  const prev=rd.onchange;
  function paintList(){
    const list=$('#wrdlist');if(!list)return;
    list.innerHTML=listHTML(window._rdCat,window._rdQ||'',rd.value);
    wireList();cfgBox();
  }
  function wireList(){
    app.querySelectorAll('#wrdlist [data-wrd]').forEach(b=>b.onclick=()=>{
      const v=b.dataset.wrd;
      if(![...rd.options].some(o=>o.value===v)){
        const o=document.createElement('option');o.value=v;o.textContent=v;rd.appendChild(o);
      }
      rd.value=v;window._rdPick=v;
      if(rd.onchange)rd.onchange({target:rd,fromList:true});
    });
  }
  function cfgBox(){
    const box=$('#wrdcfg');if(!box)return;
    const R=ROUNDS[rd.value];
    if(!R){box.innerHTML='';return}
    let html='';
    if(R.config||R.scheme==='config3d'){
      const n=window._wrdTargets||R.ends||20;
      html+=`<label for="wrdtgt">Number of targets</label><input id="wrdtgt" type="number" inputmode="numeric" min="${R.minTargets||2}" max="200" step="1" value="${n}">
       <p class="small muted">${h(R.hint||'Organiser-set target count. Maximum is computed from the scoring; there is no single official maximum.')}</p>`;
    }
    if(R.scheme==='portsmouth'){
      const z=window._wrdPort|| (typeof cur!=='undefined'&&cur&&cur.portZone)||'10';
      html+=`<p class="small" style="margin:8px 0 0">Portsmouth scoring</p><div class="labseg" role="group"><button type="button" data-port="10" aria-pressed="${z!='5'}">10-zone (max 600)</button><button type="button" data-port="5" aria-pressed="${z=='5'}">5-zone (max 540)</button></div>`;
    }
    if(R.scheme==='nfaa-animal'||R.bonus){
      const on=window._wrdBonus!=null?window._wrdBonus:true;
      html+=`<p class="small" style="margin:8px 0 0">NFAA Animal bonus dot</p><div class="labseg" role="group"><button type="button" data-bonus="1" aria-pressed="${!!on}">Bonus on (max 588)</button><button type="button" data-bonus="0" aria-pressed="${!on}">Bonus off (max 560)</button></div>`;
    }
    if(R.note)html+=`<p class="small muted" style="margin:8px 0 0">${h(R.note)}</p>`;
    box.innerHTML=html;
    const t=$('#wrdtgt');if(t)t.onchange=t.oninput=()=>{const v=Math.round(+t.value);if(!Number.isFinite(v)||v<=0)return;window._wrdTargets=Math.max(+(R.minTargets||1),Math.min(200,v))};
    box.querySelectorAll('[data-port]').forEach(b=>b.onclick=()=>{window._wrdPort=b.dataset.port;cfgBox()});
    box.querySelectorAll('[data-bonus]').forEach(b=>b.onclick=()=>{window._wrdBonus=b.dataset.bonus==='1';cfgBox()});
  }
  catEl.onchange=()=>{
    window._rdCat=catEl.value;window._rdQ='';if(qEl)qEl.value='';
    const rows=worldRows(window._rdCat,''),tmpl=templates(window._rdCat),extra=officialExtras(window._rdCat,'');
    const keep=rd.value, inCat=rows.some(r=>r.key===keep)||tmpl.includes(keep)||extra.includes(keep);
    if(!inCat){rd.value=(rows[0]&&rows[0].key)||tmpl[0]||keep}
    paintList();
    if(prev)try{prev({target:rd})}catch(e){}
    else if(typeof pegRow==='function')try{pegRow()}catch(e){}
  };
  if(qEl){qEl.oninput=()=>{window._rdQ=qEl.value;paintList()}}
  rd.onchange=e=>{
    const v=rd.value;
    const c=catOfKey(v);
    if(c&&c!==window._rdCat){window._rdCat=c;catEl.value=c;window._rdQ='';if(qEl)qEl.value=''}
    paintList();
    if(prev&&!(e&&e.fromList&&e._wired)) {const ev=e||{target:rd};ev._wired=1;try{prev(ev)}catch(err){}}
    else if(v!=='__new'&&typeof pegRow==='function')try{pegRow()}catch(err){}
  };
  paintList();
}

/* ---------- keys / scoring helpers ---------- */
const KEYS={
  wa10:['X','10','9','8','7','6','5','4','3','2','1','M'],
  imperial5:['9','7','5','3','1','M'],
  ifaa53:['5','4','3','M'],
  ifaa51:['5','4','3','2','1','M'],
  worcester:['5','4','3','2','1','M'],
  'nfaa-indoor':['X','5','4','3','2','1','M'],
  'nfaa-field':['X','5','4','3','M'],
  'aa-field':['X','5','4','3','2','1','M'],
  clout:['10','9','8','7','6','5','4','3','2','1','M'],
  foresters:['15','10','5','M'],
  natanimal:['10','5','M'],
  special1:['20','10','-5'],
  asa:['12','10','8','5','M'],
  ibo:['11','10','8','5','M'],
  wa3d:['11','10','8','5','M'],
  'ifaa-3d-hunt':['20','16','10','M'],
  'ifaa-3d-std':['10','8','5','M'],
  'nfaa-marked3d':['11','10','8','M'],
  'nfaa-unmarked3d':['12','10','8','5','M'],
  portsmouth:['X','10','9','8','7','6','5','4','3','2','1','M'],
  'portsmouth5':['9','7','5','3','1','M'],
  'ifaa-animal':['20','18','16','14','12','10','M'],
  'nfaa-animal':['21','20','18','17','16','14','13','12','10','M'],
  'nfaa-animal-off':['20','18','16','14','12','10','M'],
  'big-game':['20','16','14','10','8','4','M']
};
function worldScheme(R,s){
  if(!R)return null;
  if(R.scheme==='portsmouth'){
    const z=(s&&s.portZone)||window._wrdPort||'10';
    return z==='5'?'portsmouth5':'portsmouth';
  }
  if(R.scheme==='nfaa-animal'){
    const on=s&&s.bonus!=null?!!s.bonus:(window._wrdBonus!=null?window._wrdBonus:true);
    return on?'nfaa-animal':'nfaa-animal-off';
  }
  return R.scheme||null;
}
function worldKeys(R,FR,s){
  const sch=worldScheme(R,s|| (typeof cur!=='undefined'?cur:null));
  if(sch&&KEYS[sch])return KEYS[sch];
  return null;
}
function worldAccept(R,k,s){
  const keys=worldKeys(R,null,s);
  if(!keys)return true;
  return keys.indexOf(k)>=0;
}
function apeOf(R,i){
  if(R&&Array.isArray(R.apes)&&R.apes[i]!=null)return R.apes[i];
  return(R&&R.ape)||1;
}
function worldValX(a,s){
  if(a==='5X'||(a==='X'&&s&&ROUNDS[s.round]&&ROUNDS[s.round].scheme==='aa-field'))return 5;
  return null;
}

function applyWave(n){
  if(typeof ROUNDS!=='object')return;
  L().forEach(r=>{
    if(r.already||r.wave!==n)return;
    if(ROUNDS[r.key]&&!ROUNDS[r.key].worldNew)return; /* never overwrite a pre-existing official card */
    const rec={ends:r.ends||0,ape:r.ape||1,max:r.max,face:r.face,scheme:r.scheme,worldNew:true,worldCat:r.cat,worldBody:r.body};
    if(r.blocks)rec.blocks=r.blocks;
    if(r.apes)rec.apes=r.apes;
    if(r.config){rec.config=true;rec.minTargets=r.minTargets||1;rec.hint=r.hint;rec.ends=rec.ends||20;rec.max=null}
    if(r.stop)rec.stopOnHit=true;
    if(r.bonus)rec.bonus=true;
    if(r.portsmouth)rec.scheme='portsmouth';
    if(r.note)rec.note=r.note;
    if(r.scheme==='ifaa53'&&(r.ape||0)===4)rec.ifaa=true;
    if(r.hist)rec.hist=true;
    ROUNDS[r.key]=rec;
  });
}

function applyAll(){for(let i=2;i<=6;i++)applyWave(i)}

function worldNoFace(R){
  const sch=R&&R.scheme;
  if(!sch||sch==='wa10'||sch==='portsmouth')return false;
  return true;
}
function worldUsesTargets(R){
  if(!R)return false;
  if(R.ifaa||R.aba||R.config||R.scheme==='config3d')return true;
  const sch=R.scheme||'';
  return /field|3d|animal|foresters|special|clout|asa|ibo|natanimal|big-game/i.test(sch);
}
function worldPrepareStart(r){/* session fields are applied in worldAfterStart; do not mutate the shared ROUNDS card */}

function maxPer(R){
  const k=worldKeys(R)||[];
  const nums=k.map(x=>x==='X'?10:x==='M'?0:+x).filter(x=>x>0);
  return nums.length?Math.max(...nums):null;
}

function worldAfterStart(s){
  const R=ROUNDS[s.round];if(!R)return;
  if(R.scheme==='portsmouth'){s.portZone=window._wrdPort||'10';s.max=s.portZone==='5'?540:600}
  if(R.scheme==='nfaa-animal'){s.bonus=window._wrdBonus!=null?!!window._wrdBonus:true;s.max=s.bonus?588:560}
  if(R.config||R.scheme==='config3d'){
    const box=typeof document!=='undefined'&&document.querySelector('#wrdtgt');
    const raw=(box&&box.value!==''&&box.value!=null)?+box.value:window._wrdTargets;
    const n=Math.max(R.minTargets||1,Math.min(200,Math.round(+raw||R.ends||20)));
    s.targets=n;const per=maxPer(R);s.max=per?per*n*(R.ape||1):undefined;
  }
}

/* Full-round regression keeps the pre-C15 set, so adding 171 cards does not multiply that run. */
function worldFullroundKeys(){
  return Object.keys(ROUNDS).filter(k=>{const R=ROUNDS[k];return R&&!R.legacy&&!R.custom&&!R.worldNew&&!R.lancaster});
}

function worldConfirmedCount(){return L().length}
function worldHasUnconfirmed(){
  const names=new Set(L().map(r=>r.name)),keys=new Set(Object.keys(ROUNDS||{}));
  return unconf().filter(n=>names.has(n)||keys.has(n));
}

function worldAlreadyUnchanged(){
  return L().filter(r=>r.already).map(r=>({name:r.name,key:r.key,ends:ROUNDS[r.key]&&ROUNDS[r.key].ends,ape:ROUNDS[r.key]&&ROUNDS[r.key].ape,max:ROUNDS[r.key]&&ROUNDS[r.key].max}));
}

Object.assign(window,{
  worldPickerHTML,worldBindPicker,worldRows,officialExtras,worldKeys,worldAccept,apeOf,worldScheme,
  worldApplyWave:applyWave,worldApplyAll:applyAll,worldPrepareStart,worldAfterStart,
  worldFullroundKeys,worldConfirmedCount,worldHasUnconfirmed,worldAlreadyUnchanged,
  worldValX,worldNoFace,worldUsesTargets,WORLD_CATS:CATS
});

function worldBoot(){
  const n=window.WORLD_APPLY_UP_TO||0;
  if(typeof ROUNDS==='object'){for(let i=2;i<=n;i++)applyWave(i)}
}
if(typeof ROUNDS==='object')worldBoot();
else document.addEventListener('DOMContentLoaded',worldBoot);
})();

