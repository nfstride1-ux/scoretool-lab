/* My bows (22 Oct 2026, Nathe). My archery > My bows. Each bow setup (the existing Setups & sight marks list, S.bows) can carry
   its make, model, year and specs. Specs come from the maker's own page or document (data/bow_specs.json: compounds, risers and limbs, cited per entry;
   a retailer or press table only where the maker no longer lists it, and labelled so);
   anything not published is left blank for the archer to type. Stored data: specs go under the NEW key S.bowSpec[setupId];
   existing setups, sessions and sight marks are never rewritten (a new bow adds a new setup, as '+ New bow setup' does).
   Picking a saved bow fills IBO, draw weight and draw length in the Arrow chooser and Calculators (the archer can still
   override them), and new tuning sessions save a snapshot of the chosen bow (t.bowSpec). Old sessions are untouched. */
(function(){
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ic=n=>(window.icon&&window.icon(n))||'';
let LIST=null,ALL=[],SKIP=[];
fetch('data/bow_specs.json').then(r=>r.json()).then(j=>{ALL=j.bows||[];LIST=ALL.filter(x=>(x.kind||'compound')=='compound');SKIP=j.skipped||[];if(typeof view!='undefined'&&view=='lab_mybows')render()}).catch(()=>{LIST=[]});
const specs=()=>(S.bowSpec=S.bowSpec||{});
const mine=()=>(typeof myBows=='function'?myBows():[]);
const withSpec=()=>mine().filter(b=>specs()[b.id]);
const bname=(b,s)=>s&&(s.make||s.model)?[s.make,s.model].filter(Boolean).join(' '):b.name;
const fnum=v=>{const x=parseFloat(String(v??'').replace(',','.'));return isFinite(x)?x:NaN};
const KL=k=>k=='ATA'?'ATA':k=='IBO/ATA'?'IBO/ATA':k=='actual'?'Measured':k===''?'Speed':'IBO';
const sum=s=>[s.type=='recurve'?[s.riserLen?s.riserLen+'" riser':'',s.limbLb?s.limbLb+' lb limbs':''].filter(Boolean).join(' · '):(s.speed?KL(s.kind??'IBO')+' '+s.speed+' fps':''),s.dw?s.dw+' lb':'',s.dl?s.dl+'"':''].filter(Boolean).join(' · ')||'no figures yet';
window.bowSnap=id=>{const b=mine().find(x=>x.id==id),s=b&&specs()[id];if(!s)return null;
 return{setup:id,name:bname(b,s),type:s.type||'compound',make:s.make||'',model:s.model||'',year:s.year||'',speed:s.speed||'',kind:s.kind??'IBO',bh:s.bh||'',ata:s.ata||'',dw:s.dw||'',dl:s.dl||'',lo:s.lo||'',limbLb:s.limbLb||'',limbLen:s.limbLen||'',riser:s.riser||'',limbs:s.limbs||'',riserLen:s.riserLen||'',fit:s.fit||'',url:s.url||''}};
/* bows the archer has already named (setup names, setup diary, tuning sessions) that are on the list and have no specs yet */
function named(){if(!LIST)return[];const me=S.profile,txt=[...mine().filter(b=>!specs()[b.id]).map(b=>b.name),...(S.setup||[]).filter(x=>x.archer==me).map(x=>x.bow),...(S.tune||[]).filter(x=>x.archer==me).map(x=>x.bowName)].filter(Boolean).map(x=>String(x).toLowerCase());
 const fams={};LIST.forEach(x=>{const f=x.fam.toLowerCase();if(txt.some(t=>t.includes(f)))(fams[x.make+' '+x.fam]=fams[x.make+' '+x.fam]||[]).push(x)});
 return Object.entries(fams).filter(([k,L])=>!withSpec().some(b=>L.some(x=>x.id==specs()[b.id].specId)))}
const fromList=x=>({type:'compound',make:x.make,model:x.model,year:x.year||'',specId:x.id,speed:x.speed?String(x.speed):'',kind:x.speedKind??'IBO',speedNote:x.speedNote||'',srcType:x.srcType||'',bh:x.bh?String(x.bh):'',ata:x.ata?String(x.ata):'',lo:x.lo||'',dw:'',dl:'',src:x.src,url:x.url,dlRange:x.dlRange||'',dwRange:x.dwRange||''});
function addBow(s,famName){S.bowSel=S.bowSel||{};/* attach to the setup that already names this bow if it has no specs, else add a new setup */
 const f=(famName||'').toLowerCase();let b=f&&mine().find(x=>!specs()[x.id]&&String(x.name).toLowerCase().includes(f));
 if(!b){b={id:'b'+Date.now(),archer:S.profile,name:[s.make,s.model].filter(Boolean).join(' ')||'My bow',extra:[],marks:{}};S.bows=S.bows||[];S.bows.push(b);if(!S.bowSel[S.profile])S.bowSel[S.profile]=b.id}
 specs()[b.id]=s;save();return b.id}
let EDIT=null;/* form state in memory: {id|null, s} */
const TXT=['make','model','lo','riser','limbs','fit','limbLen','year'];
const F=(k,l,u,ph)=>`<label for="mb_${k}">${l}${u?` <span class="muted small">(${u})</span>`:''}</label><input id="mb_${k}" data-f="${k}" ${TXT.includes(k)?'':'inputmode="decimal"'} value="${h(EDIT.s[k]??'')}" placeholder="${h(ph||'')}">`;
const ST={maker:"the maker's page",'maker-pdf':"a maker's document",retailer:"a retailer's spec table",press:"a press release of the maker's figures"};
const srcLine=(src,url,ty)=>url?`<p class="small muted mbsrc" style="margin:6px 0">From <a href="${h(url)}" target="_blank" rel="noopener">${h(src||'the maker')}</a>${ty=='retailer'||ty=='press'?`. <b>Not the maker's own page</b>: the maker no longer lists this bow, so this is ${ST[ty]}.`:''}</p>`:'';
const norm=t=>String(t||'').toLowerCase().replace(/[^a-z0-9.]+/g,' ').trim();
const pool=k=>k=='compound'?(LIST||[]):ALL.filter(x=>x.kind==k);
/* search-as-you-type over one part of the list (compounds, risers or limbs), results grouped by maker */
function finder(k,lbl){const L=pool(k);const mk=[...new Set(L.map(x=>x.make))];
 return`<div class="mbfind" data-k="${k}"><label for="mb_q_${k}">${lbl} <span class="muted small">(${L.length} on the list)</span></label>
 <input id="mb_q_${k}" type="search" autocomplete="off" placeholder="Type a make or model, e.g. ${k=='compound'?'Title 38':k=='riser'?'Xceed':'Astonix'}">
 <div class="mbmk small" style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">${mk.map(m=>`<button type="button" class="btn ghost" style="padding:4px 10px;font-size:13px;min-height:0" data-mk="${h(m)}">${h(m)}</button>`).join('')}</div>
 <div class="mbres" id="mb_res_${k}" role="listbox" aria-label="${h(lbl)} results"></div></div>`}
function results(k,q){const L=pool(k),w=norm(q).split(' ').filter(Boolean);if(!w.length)return'';
 const M=L.filter(x=>{const t=norm(x.make+' '+x.model+' '+(x.year||''));return w.every(z=>t.includes(z))});
 if(!M.length)return`<p class="small muted" style="margin:6px 0">Nothing on the list matches. Type the details in below.</p>`;
 const show=M.slice(0,60),mk=[...new Set(show.map(x=>x.make))];
 return mk.map(m=>`<div class="mbgrp"><div class="kicker" style="margin:8px 0 2px">${h(m)}</div>${show.filter(x=>x.make==m).map(x=>`<button type="button" class="mbopt" role="option" data-pk="${x.id}" style="display:block;width:100%;text-align:left;padding:8px 10px;margin:2px 0;border:1px solid var(--line);border-radius:10px;background:none;color:inherit"><b>${h(x.model)}</b>${x.year?` <span class="muted small">${h(x.year)}</span>`:''}<br><span class="small muted">${h(optSum(x))}</span></button>`).join('')}</div>`).join('')
  +(M.length>show.length?`<p class="small muted">${M.length-show.length} more: keep typing to narrow it down.</p>`:'')}
const optSum=x=>x.kind=='riser'?[x.len?x.len+'" riser':'',x.fit,x.weight].filter(Boolean).join(' · '):x.kind=='limbs'?[x.sizes,x.lbRange,x.fit].filter(Boolean).join(' · '):[x.speed?KL(x.speedKind)+' '+x.speed+' fps':'',x.ata?x.ata+'" axle-to-axle':'',x.bh?x.bh+'" brace':''].filter(Boolean).join(' · ');
const KIND_HINT={'IBO/ATA':'This speed field is labelled IBO/ATA. The published figure is used as it is in the Arrow chooser and Calculators.',
 ATA:'Hoyt publish ATA speed (350 gr, 70 lb, 30"), which reads lower than IBO. It is used as the IBO figure in the Arrow chooser and Calculators.',
 '':"The maker gives a speed but doesn't say whether it is IBO or ATA. It is used as the IBO figure in the Arrow chooser and Calculators.",
 actual:"Darton publish a measured ('actual') speed rather than IBO or ATA. It is used as the IBO figure in the Arrow chooser and Calculators."};
function form(){const s=EDIT.s,rec=s.type=='recurve',k=s.kind??'IBO';
 const fitClash=rec&&s.riserFit&&s.limbFit&&!s.limbFit.includes(s.riserFit.split(' ')[0])&&!s.riserFit.includes(s.limbFit.split(' ')[0]);
 return`<div class="card" id="mbform"><span class="kicker">${EDIT.id?'Edit bow':'Add a bow'}</span>
 <div class="labseg" role="group" aria-label="Bow type"><button type="button" data-ty="compound" aria-pressed="${!rec}">Compound</button><button type="button" data-ty="recurve" aria-pressed="${rec}">Recurve or barebow</button></div>
 ${rec?`${finder('riser','Find your riser')}${srcLine(s.riserSrc,s.riserUrl,s.riserSrcType)}
  ${F('riser','Riser','make and model','e.g. Hoyt Xceed 2 25')}${F('riserLen','Riser length','inches','e.g. 25')}${F('fit','Limb fitting','ILF or Formula','e.g. ILF')}
  ${finder('limbs','Find your limbs')}${srcLine(s.limbSrc,s.limbUrl,s.limbSrcType)}
  ${F('limbs','Limbs','make and model','e.g. Uukha Sigma')}${fitClash?`<p class="hint">The riser is listed as ${h(s.riserFit)} and these limbs as ${h(s.limbFit)}. Check they fit each other.</p>`:''}
  ${F('limbLen','Limb length','short, medium, long or bow length',s.limbSizes?'published: '+s.limbSizes:'e.g. long, or 70"')}${F('limbLb','Limb poundage','lb on the limbs',s.limbLbRange?'published: '+s.limbLbRange:'e.g. 38')}${s.bowLen?`<p class="small muted" style="margin:4px 0">Bow length with this riser: ${h(s.bowLen)}.</p>`:''}
  ${F('dw','Draw weight on your fingers','lb','e.g. 40')}${F('dl','Draw length','inches','e.g. 28')}`
 :`${finder('compound','Find your bow')}${srcLine(s.src,s.url,s.srcType)}${s.url?`<p class="small muted" style="margin:0 0 6px">Blank boxes weren't published there: type your own.${s.speedNote?' Speed: '+h(s.speedNote)+'.':''}</p>`:''}
  ${F('make','Make','','e.g. Hoyt')+F('model','Model','','e.g. Concept X 40')+F('year','Year','','e.g. 2025')}
  <label for="mb_speed">IBO/ATA <span class="muted small">(fps)</span></label><div class="row" style="gap:6px"><input id="mb_speed" data-f="speed" inputmode="decimal" value="${h(s.speed||'')}" style="flex:1"><select id="mb_kind" aria-label="IBO/ATA" style="width:150px"><option value="IBO/ATA"${k=='IBO/ATA'?' selected':''}>IBO/ATA</option><option value="IBO"${k=='IBO'?' selected':''}>IBO</option><option value="ATA"${k=='ATA'?' selected':''}>ATA</option><option value=""${k===''?' selected':''}>Not stated</option><option value="actual"${k=='actual'?' selected':''}>Measured</option></select></div>${KIND_HINT[k]?`<p class="hint">${KIND_HINT[k]}</p>`:''}
  ${F('bh','Brace height','inches')+F('ata','Axle-to-axle','inches')+F('dw','Your draw weight','lb',s.dwRange?'published: '+s.dwRange:'e.g. 60')+F('dl','Your draw length','inches',s.dlRange?'published: '+s.dlRange:'e.g. 29')+F('lo','Let-off','%',s.lo?'':'')}`}
 <div class="row" style="gap:8px;margin-top:10px"><button class="btn" id="mbsave">Save bow</button><button class="btn ghost" id="mbcancel">Cancel</button></div></div>`}
E.lab_mybows=function(){const L=withSpec(),N=named();
 app.innerHTML=`<div class="labbar"><button class="btn ghost labback" data-go="myarch">‹ My archery</button><h1>My bows</h1></div>
 ${N.map(([k,V])=>`<div class="card mbsug"><span class="kicker">From your setups</span><h2 style="margin:2px 0 8px">Add your ${h(k)}</h2><div class="row" style="gap:8px;flex-wrap:wrap">${V.map(x=>`<button class="btn" data-sug="${x.id}" data-fam="${h(x.fam)}">${V.length>1?h(x.model):'Add your '+h(k)}</button>`).join('')}</div><p class="small muted" style="margin:8px 0 0">One tap adds its published specs. You then add your own draw weight and length.</p></div>`).join('')}
 ${EDIT?form():''}
 <div class="card"><span class="kicker">Saved</span>${L.length?L.map(b=>{const s=specs()[b.id];return`<div class="mbrow" style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)"><span class="i" aria-hidden="true">${ic('bow')}</span><div style="flex:1"><b>${h(bname(b,s))}</b>${s.year?` <span class="muted small">${h(s.year)}</span>`:''}<br><span class="small muted">${h(sum(s))}</span>${[[s.url,'Specs source'],[s.riserUrl,'Riser specs'],[s.limbUrl,'Limb specs']].filter(([u])=>u).map(([u,l])=>`<br><a class="small" href="${h(u)}" target="_blank" rel="noopener">${l}</a>`).join('')}</div><button class="btn ghost" data-ed="${b.id}" style="padding:6px 12px">Edit</button></div>`}).join('')
  :'<p class="muted">No bows yet.</p>'}
  ${EDIT?'':'<button class="btn alt full" id="mbadd" style="margin-top:10px">Add a bow</button>'}
  <p class="small muted" style="margin-top:8px">Each bow is one of your setups, so its sight marks stay in Setups &amp; sight marks. Pick it in the Arrow chooser, Calculators or a new tuning session to fill in its speed, draw weight and draw length.</p></div>
 ${SKIP.length?`<details class="small muted"><summary>Not on the list yet</summary><ul>${SKIP.map(x=>`<li>${h(x)}</li>`).join('')}</ul></details>`:''}`;
 app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{EDIT=null;nav(b.dataset.go)});
 setTimeout(()=>document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.v=='myarch')),0);
 app.querySelectorAll('[data-sug]').forEach(b=>b.onclick=()=>{const x=LIST.find(y=>y.id==b.dataset.sug);const id=addBow(fromList(x),b.dataset.fam);EDIT={id,s:{...specs()[id]}};render();const f=$('#mb_dw');if(f)f.focus()});
 app.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>{EDIT={id:b.dataset.ed,s:{...specs()[b.dataset.ed]}};render()});
 const ad=$('#mbadd');if(ad)ad.onclick=()=>{EDIT={id:null,s:{type:'compound'}};render()};
 if(!EDIT)return;
 const grab=()=>app.querySelectorAll('[data-f]').forEach(i=>EDIT.s[i.dataset.f]=i.value.trim());
 app.querySelectorAll('[data-ty]').forEach(b=>b.onclick=()=>{grab();EDIT.s.type=b.dataset.ty;render()});
 const pick=id=>{grab();const x=ALL.find(y=>y.id==id);if(!x)return;const o=EDIT.s;
  if(x.kind=='riser')Object.assign(o,{riser:x.make+' '+x.model,riserId:x.id,riserLen:x.len||'',fit:x.fit||'',riserFit:x.fit||'',bowLen:x.bowLen||'',riserSrc:x.src,riserUrl:x.url,riserSrcType:x.srcType||''});
  else if(x.kind=='limbs')Object.assign(o,{limbs:x.make+' '+x.model,limbsId:x.id,limbSizes:x.sizes||'',limbLbRange:x.lbRange||'',limbFit:x.fit||'',fit:o.fit||x.fit||'',limbSrc:x.src,limbUrl:x.url,limbSrcType:x.srcType||''});
  else EDIT.s={...fromList(x),dw:o.dw,dl:o.dl};
  render();const f=$(x.kind=='limbs'?'#mb_limbLen':x.kind=='riser'?'#mb_q_limbs':'#mb_dw');if(f)f.focus()};
 app.querySelectorAll('.mbfind').forEach(w=>{const k=w.dataset.k,q=w.querySelector('input'),r=w.querySelector('.mbres');
  const upd=()=>{r.innerHTML=results(k,q.value);w.querySelector('.mbmk').style.display=q.value.trim()?'none':'flex';r.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>pick(b.dataset.pk))};
  q.oninput=upd;w.querySelectorAll('[data-mk]').forEach(b=>b.onclick=()=>{q.value=b.dataset.mk;upd();q.focus()})});
 const kd=$('#mb_kind');if(kd)kd.onchange=()=>{grab();EDIT.s.kind=kd.value;render()};
 $('#mbcancel').onclick=()=>{EDIT=null;render()};
 $('#mbsave').onclick=()=>{grab();const s=EDIT.s;if(s.type=='recurve'){s.make=s.riser||'';s.model=s.limbs||'';s.limbLen=s.limbLen||''}
  if(EDIT.id){specs()[EDIT.id]=s;save()}else addBow(s,'');EDIT=null;render()}};

/* My archery menu: a My bows row after Setups & sight marks */
const _ma=E.myarch;if(_ma)E.myarch=function(){_ma();const g=app.querySelector('[data-go=lab_gear]');if(g&&!app.querySelector('[data-go=lab_mybows]')){
 g.insertAdjacentHTML('afterend',`<button class="labrow" data-go="lab_mybows"><span class="i" aria-hidden="true">${ic('bow')}</span><span><b>My bows</b><small>Make, model and specs for each bow, from the maker's page</small></span><span class="go" aria-hidden="true">›</span></button>`);
 app.querySelector('[data-go=lab_mybows]').onclick=()=>nav('lab_mybows')}};

/* a 'Saved bow' picker that fills boxes; the archer can still change any of them afterwards */
const picker=(id,sel,lbl)=>{const L=withSpec();if(!L.length)return`<p class="small muted" id="${id}w" style="margin:0 0 8px">Save your bow in <a href="#" data-mb="1">My archery › My bows</a> to fill these in.</p>`;
 return`<div id="${id}w" style="margin:0 0 8px"><label for="${id}">${lbl}</label><select id="${id}"><option value="">None, I'll type them</option>${L.map(b=>`<option value="${b.id}"${b.id==sel?' selected':''}>${h(bname(b,specs()[b.id]))}</option>`).join('')}</select></div>`};
/* AC1: the bow the Arrow chooser uses. bowId undefined = follow the current saved bow (the one picked in Setups & sight marks);
   '' = none (the archer types); an id = that bow. Blank boxes come from the bow each time; typed boxes win. */
const curId=()=>{const L=mine(),sel=(S.bowSel||{})[S.profile],b=L.find(x=>x.id==sel)||L[0];return b?b.id:''};
const acId=R=>R.bowId===undefined?curId():R.bowId;
const blank=v=>v==null||String(v).trim()==='';
window.acBowFill=R=>{const id=acId(R),s=id?bowSnap(id):null,o=Object.assign({},R);if(!s)return o;
 const comp=s.type=='compound',fits=blank(R.bow)||(comp?R.bow=='compound':R.bow!='compound');if(!fits)return o;
 if(blank(R.bow))o.bow=comp?'compound':'recurve';const got=[];
 [['dw','draw weight'],['dl','draw length']].concat(comp?[['speed','speed rating']]:[]).forEach(([k,l])=>{const t=k=='speed'?'ibo':k;if(blank(R[t])&&!blank(s[k])){o[t]=String(s[k]);got.push(l)}});
 o._bow={id,name:s.name,got,kind:s.kind,speed:s.speed,auto:R.bowId===undefined};return o};
window.curSavedBow=()=>{const id=curId();return id?bowSnap(id):null};
const acPicker=sel=>{const A=mine();if(!A.length)return picker('ac_mybow',sel,'Saved bow');
 return`<div id="ac_myboww" style="margin:0 0 8px"><label for="ac_mybow">Saved bow</label><select id="ac_mybow"><option value=""${sel===''?' selected':''}>None, I'll type them</option>${A.map(b=>{const s=specs()[b.id];return`<option value="${b.id}"${b.id==sel?' selected':''}>${h(bname(b,s))}${s?'':' (no specs yet)'}</option>`}).join('')}</select></div>`};
const KN={IBO:'IBO','IBO/ATA':'IBO/ATA',ATA:'ATA',actual:'measured','':'standard not stated'};
const bindMb=()=>app.querySelectorAll('[data-mb]').forEach(a=>a.onclick=e=>{e.preventDefault();nav('lab_mybows')});
const filled=(s,keys)=>keys.filter(([k])=>s[k]).map(([,l])=>l);

/* Arrow chooser: writes only its own inputs (scoretool.arrowchooser.<tester>), the same boxes the archer types into */
const _ch=E.lab_chooser;if(_ch)E.lab_chooser=function(){_ch();const K='scoretool.arrowchooser.'+((typeof TESTER!='undefined'&&TESTER&&TESTER.id)||'guest');
 let R={};try{R=JSON.parse(localStorage.getItem(K)||'{}')||{}}catch(e){}
 const card=app.querySelector('.acf');if(!card)return;const k=card.querySelector('h2');
 const sel=acId(R),F=acBowFill(R)._bow,b0=sel&&mine().find(x=>x.id==sel);
 const line=F?`${F.auto?'Using your current bow':'Using'}, ${h(F.name)}${F.got.length?': '+F.got.join(', ')+' filled in':''}${F.got.includes('speed rating')?` (${h(KN[F.kind]??'IBO')} ${h(F.speed)} fps${F.kind=='ATA'?', which reads lower than IBO':''})`:''}. Type in a box to change it; clear the box to go back to the bow's figure.`
  :b0&&!specs()[sel]?`No specs saved for ${h(b0.name)} yet. Add them in <a href="#" data-mb="1">My archery › My bows</a> to fill these in.`:'';
 k.insertAdjacentHTML('afterend',acPicker(sel)+(window._mbNote?`<p class="lab-note" id="mbnote">${h(window._mbNote)}</p>`:'')+(line?`<p class="small muted" id="acbowline" style="margin:0 0 8px">${line}</p>`:''));window._mbNote=null;bindMb();
 const p=$('#ac_mybow');if(p)p.onchange=()=>{const s=bowSnap(p.value);
  if(!p.value){const C=acBowFill(R);['bow','dw','dl','ibo'].forEach(x=>{if(blank(R[x])&&!blank(C[x]))R[x]=C[x]})}
  R.bowId=p.value;if(p.value)['dw','dl','ibo'].forEach(x=>delete R[x]);
  if(s){R.bow=s.type=='compound'?'compound':(R.bow=='barebow'?'barebow':'recurve');
   const f=filled(s,s.type=='compound'?[['speed','IBO speed'],['dw','draw weight'],['dl','draw length']]:[['dw','draw weight'],['dl','draw length']]);
   const kn={ATA:' (ATA rating used as IBO)','':" (the maker doesn't say IBO or ATA; used as IBO)",actual:' (measured speed used as IBO)'}[s.kind];
   window._mbNote=`From your ${s.name}: ${f.join(', ')||'nothing'} filled in${s.type=='compound'&&s.speed&&kn?kn:''}. Change any box to override.`}
  localStorage.setItem(K,JSON.stringify(R));render()}};

/* Calculators: fills the speed card's IBO, draw length and draw weight (S.calc, as typing would) */
const _ca=E.lab_calc;if(_ca)E.lab_calc=function(){_ca();const C=S.calc||{};const first=app.querySelector('.labgrid2 .card .kicker');if(!first)return;
 first.insertAdjacentHTML('afterend',picker('c_mybow',C.bowId,'Saved bow'));bindMb();
 const p=$('#c_mybow');if(p)p.onchange=()=>{const s=bowSnap(p.value);C.bowId=p.value;if(s){if(s.type=='compound'&&s.speed)C.ibo=s.speed;if(s.dw)C.dw=s.dw;if(s.dl)C.dl=s.dl;C.spdOn=1}S.calc=C;save();render()}};

/* Tuning: new sessions only get a snapshot of the chosen bow */
const _op=E.lab_opt;if(_op)E.lab_opt=function(){if(typeof seedBows=='function')seedBows();_op();const go=$('#tgo');if(!go)return;const cb=typeof curBow=='function'&&curBow();
 go.insertAdjacentHTML('beforebegin',picker('t_mybow',cb&&specs()[cb.id]?cb.id:'','Bow specs for this session'));bindMb();
 const o=go.onclick;go.onclick=function(){const p=$('#t_mybow'),snap=p&&p.value?bowSnap(p.value):null;const n0=(S.tune||[]).length;o.apply(this,arguments);
  if(snap&&(S.tune||[]).length>n0){const t=S.tune[S.tune.length-1];if(t&&t.id==S._tuneId&&!t.bowSpec){t.bowSpec=snap;save();render()}}}};
})();
