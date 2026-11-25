/* My arrows (23 Oct 2026, Nathe via Coach). My archery > My arrows. One list of the archer's arrow sets, added once:
   name, shaft, spine, length, point weight, total weight, fletching, and FOC worked out with the Arrow chooser's
   Easton AMO-standard formula. It is the SAME list as the Arrow set dropdown in Setups & sight marks (mySets() in gear.js),
   so existing sets (for example SuperDrive 23's, SuperDrive mini, ACE) show up without being copied or rewritten.
   Stored data: the fields the sight marks screen already had (name, shaft, spine, len, pt, wt) stay on the S.arrowSets
   record, written only when the archer changes them. Everything new (fletching and the FOC parts) goes under the NEW key
   S.arrowInfo[profile][setId]. Opening the list writes nothing. */
(function(){
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ic=n=>(window.icon&&window.icon(n))||'';
const f1=x=>(Math.round(x*10)/10).toFixed(1);
const BASE=['name','shaft','spine','len','pt','wt'],EXTRA=['fletch','gpi','ins','nock','vanes','vpos','bp'];
const info=id=>((S.arrowInfo||{})[S.profile]||{})[id]||{};
const list=()=>(typeof mySets=='function'?mySets():[]);
/* one merged, read-only view of a set: its record plus the new info; FOC and worked-out weight from the chooser's maths */
function full(a){const o={...a,...info(a.id)};const b=window.arrowBuild?arrowBuild(o):null;
 o.foc=b&&isFinite(b.foc)?+f1(b.foc):null;o.focMeas=!!(b&&b.meas);o.twCalc=b&&isFinite(b.tw)&&!b.missing.length?Math.round(b.tw):null;
 o.weight=o.wt?parseFloat(o.wt):o.twCalc;return o}
window.myArrows=()=>list().map(full);
window.myArrow=id=>{const a=list().find(x=>x.id==id);return a?full(a):null};
const sum=o=>[o.shaft,o.spine?o.spine+' spine':'',o.len?o.len+'"':'',o.pt?o.pt+' gr point':'',o.wt?o.wt+' gr total':o.twCalc?o.twCalc+' gr total (worked out)':'',o.fletch,o.foc!=null?'FOC '+o.foc+'%':''].filter(Boolean).join(' · ');
const marksOn=id=>(S.bows||[]).filter(b=>b.archer==S.profile).map(b=>[b.name,Object.values(typeof peekMarks=='function'?peekMarks(b,{id}):{}).filter(m=>m&&m.v).length]).filter(x=>x[1]).map(([n,c])=>`${h(String(n).trim())}: ${c} sight mark${c==1?'':'s'}`).join(' · ');
let EDIT=null;
function form(){const s=EDIT.s,b=window.arrowBuild?arrowBuild(s):null;
 const F=(k,l,u,ph,txt)=>`<div><label for="ma_${k}">${l}${u?` <span class="muted small">(${u})</span>`:''}</label><input id="ma_${k}" data-f="${k}" ${txt?'':'inputmode="decimal"'} value="${h(s[k]??'')}" placeholder="${h(ph||'')}"></div>`;
 return`<div class="card" id="maform"><span class="kicker">${EDIT.id?'Edit arrow set':'Add an arrow set'}</span>
 ${F('name','Name','','e.g. Outdoor X10s',1)}
 <div class="labgrid2"><div>${F('shaft','Shaft','make and model','e.g. Easton X10',1)}${F('spine','Spine','','e.g. 500',1)}${F('len','Length','inches, nock throat to end','e.g. 28.5')}</div>
 <div>${F('pt','Point weight','grains','e.g. 110')}${F('wt','Total weight','grains, weighed','e.g. 405')}${F('fletch','Fletching','','e.g. 3 x Spin Wing 1.75',1)}</div></div>
 <details class="acmore" id="mafocd"${EDIT.focOpen?' open':''}><summary>Parts for FOC (optional)</summary><div class="labgrid2"><div>
  ${F('gpi','Shaft weight','grains per inch','e.g. 5.7')}${F('ins','Insert, pin or collar','grains','0')}${F('nock','Nock','grains','e.g. 6')}</div><div>
  ${F('vanes','All vanes together','grains','')}${F('vpos','Vane middle from the nock throat','inches','blank = at the nock')}${F('bp','Measured balance point','inches from the nock throat','')}</div></div></details>
 <p id="mafoc" style="margin:10px 0 0">FOC <span class="labout">${b&&isFinite(b.foc)?f1(b.foc)+'%':'-'}</span> <span class="small muted">${b&&isFinite(b.foc)?(b.meas?'from your measured balance point':'worked out from the part weights (an estimate)'):'add length, point and shaft weight, or a measured balance point'}</span>${b&&isFinite(b.tw)&&!b.missing.length?`<br><span class="small">Worked-out total weight <b>${Math.round(b.tw)} gr</b></span>`:''}</p>
 <p class="small muted" style="margin:4px 0 0">Easton's AMO-standard formula, the same as the Arrow chooser: F.O.C. % = 100 x (A - L/2) / L.</p>
 <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn" id="masave">Save</button><button class="btn ghost" id="macancel">Cancel</button>${window.arrowSetup?'<button class="btn ghost" id="mafromac">Fill from Arrow chooser</button>':''}</div>
 <p class="small muted" id="mamsg" aria-live="polite" style="margin:6px 0 0"></p></div>`}
E.lab_myarrows=function(){const L=window.myArrows();
 app.innerHTML=`<div class="labbar"><button class="btn ghost labback" data-go="myarch">‹ My archery</button><h1>My arrows</h1></div>
 ${EDIT?form():''}
 <div class="card" id="malist"><span class="kicker">Saved</span>${L.length?L.map(o=>{const n=marksOn(o.id);return`<div class="marow" data-id="${h(o.id)}" style="display:flex;gap:10px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)"><span class="i" aria-hidden="true">${ic('arrow')}</span><div style="flex:1"><b>${h(o.name)}</b><br><span class="small muted">${h(sum(o))||'no details yet'}</span>${window.arrowCalcLine&&arrowCalcLine(o)?`<br><span class="small macalc">${h(arrowCalcLine(o))}</span>`:''}${n?`<br><span class="small">${n}</span>`:''}</div><button class="btn ghost" data-ed="${h(o.id)}" style="padding:6px 12px">Edit</button></div>`}).join('')
  :'<p class="muted">No arrow sets yet.</p>'}
  ${EDIT?'':'<button class="btn alt full" id="maadd" style="margin-top:10px">Add an arrow set</button>'}
  <p class="small muted" style="margin-top:8px">Add each arrow set once. The same list is the Arrow set choice in Setups &amp; sight marks, and each set keeps its own sight marks for each bow.</p></div>`;
 app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{EDIT=null;nav(b.dataset.go)});
 setTimeout(()=>document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.v=='myarch')),0);
 app.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>{const a=list().find(x=>x.id==b.dataset.ed);if(!a)return;const s={};[...BASE,...EXTRA].forEach(k=>{const v={...a,...info(a.id)}[k];if(v!=null&&v!=='')s[k]=String(v)});EDIT={id:a.id,s};render();window.scrollTo(0,0)});
 const ad=$('#maadd');if(ad)ad.onclick=()=>{EDIT={id:null,s:{}};render();const n=$('#ma_name');if(n)n.focus()};
 if(!EDIT)return;
 const grab=()=>app.querySelectorAll('#maform [data-f]').forEach(i=>EDIT.s[i.dataset.f]=i.value.trim());
 app.querySelectorAll('#maform [data-f]').forEach(i=>i.onchange=()=>{grab();EDIT.focOpen=$('#mafocd').open;const y=window.scrollY;render();window.scrollTo(0,y)});
 $('#macancel').onclick=()=>{EDIT=null;render()};
 const fa=$('#mafromac');if(fa)fa.onclick=()=>{grab();const x=arrowSetup();if(!x){$('#mamsg').textContent='Fill in the Arrow chooser first (Tools, Arrow chooser).';return}
  if(x.model)EDIT.s.shaft=x.model;if(x.spine)EDIT.s.spine=x.spine;EDIT.s.len=String(x.len);EDIT.s.pt=String(x.pt);if(x.tw)EDIT.s.wt=EDIT.s.wt||String(x.tw);render()};
 $('#masave').onclick=()=>{grab();const s=EDIT.s;if(!s.name){$('#mamsg').textContent='Give the arrow set a name.';return}
  S.arrowSets=S.arrowSets||[];let r;
  if(EDIT.id){const a=list().find(x=>x.id==EDIT.id);r=S.arrowSets.find(x=>x.id==EDIT.id&&x.archer==S.profile);
   const changed=BASE.some(k=>String(a[k]??'')!=(s[k]||''));if(!r&&changed)r=setRec(a);
   if(r)BASE.forEach(k=>{const v=s[k]||'';if(String(r[k]??'')==v)return;if(v)r[k]=v;else delete r[k]})}
  else{r={id:'as'+Date.now(),archer:S.profile,name:s.name};BASE.forEach(k=>{if(s[k])r[k]=s[k]});S.arrowSets.push(r)}
  const id=EDIT.id||r.id,old=info(id),ni={};EXTRA.forEach(k=>{if(s[k])ni[k]=s[k]});if(old.calc)ni.calc=old.calc;/* results saved from the Calculators stay */
  if(JSON.stringify(old)!=JSON.stringify(ni)){S.arrowInfo=S.arrowInfo||{};const P=S.arrowInfo[S.profile]=S.arrowInfo[S.profile]||{};if(Object.keys(ni).length)P[id]=ni;else delete P[id]}
  save();EDIT=null;render()}};
/* (c) A 'My arrows' dropdown in the Calculators, the Arrow chooser and the Arrow optimizer. Picking a set fills the same boxes the
   archer types into (it writes only what typing would, plus which set was picked); every box stays editable afterwards.
   Nothing is written until the archer picks a set. Old tuning sessions are never rewritten; a new session gets a snapshot. */
const num=v=>{const x=parseFloat(String(v??'').replace(',','.'));return isFinite(x)?x:NaN};
const sv=x=>String(Math.round(x*100)/100);
const apick=(id,sel,lbl)=>{const L=window.myArrows();if(!L.length)return`<p class="small muted" id="${id}w" style="margin:0 0 8px">Add your arrows in <a href="#" data-myarr="1">My archery › My arrows</a> to fill these in.</p>`;
 return`<div id="${id}w" style="margin:0 0 8px"><label for="${id}">${lbl}</label><select id="${id}"><option value="">None, I'll type them</option>${L.map(o=>`<option value="${h(o.id)}"${o.id==sel?' selected':''}>${h(o.name)}</option>`).join('')}</select></div>`};
const bindA=()=>app.querySelectorAll('[data-myarr]').forEach(a=>a.onclick=e=>{e.preventDefault();EDIT=null;nav('lab_myarrows')});
const note=(id,t)=>{const w=$('#'+id+'w');if(w&&t)w.insertAdjacentHTML('beforeend',`<p class="lab-note" id="${id}note" style="margin:6px 0 0">${h(t)}</p>`)};
/* balance point: the measured one, or (with FOC worked out) the point that gives that FOC, from the same formula */
const bpOf=o=>{const L=num(o.len);if(isFinite(num(o.bp)))return num(o.bp);return isFinite(L)&&o.foc!=null?L*(o.foc/100+.5):NaN};
const said=(o,f,left)=>`From ${o.name}: ${f.length?f.join(', ')+' filled in':'nothing to fill in'}.${left.length?' Not saved for this set: '+left.join(', ')+'.':''} Change any box to override.`;
let NOTE={};
/* Calculators: each card gets its own dropdown */
const _ca=E.lab_calc;if(_ca)E.lab_calc=function(){_ca();const C=S.calc||{};const cards=[...app.querySelectorAll('.labgrid2 > .card')];if(cards.length<3)return;
 const at=(c,id,sel)=>{const k=c.querySelector('#c_myboww')||c.querySelector('.kicker');k.insertAdjacentHTML('afterend',apick(id,sel,'My arrows'))};
 at(cards[0],'c_arrS',C.arrS);at(cards[1],'c_arrK',C.arrK);at(cards[2],'c_arrF',C.arrF);bindA();
 ['c_arrS','c_arrK','c_arrF'].forEach(id=>{note(id,NOTE[id]);delete NOTE[id]});
 const go=(id,key,fill)=>{const p=$('#'+id);if(!p)return;p.onchange=()=>{const o=p.value?window.myArrow(p.value):null;C[key]=p.value;if(o){const f=[],left=[];fill(o,f,left);NOTE[id]=said(o,f,left)}S.calc=C;save();render()}};
 go('c_arrS','arrS',(o,f,l)=>{if(o.weight){C.gr=String(o.weight);C.spdOn=1;f.push('arrow weight '+o.weight+' gr'+(o.wt?'':' (worked out)'))}else l.push('total weight')});
 go('c_arrK','arrK',(o,f,l)=>{if(o.weight){C.grU=String(o.weight);f.push('arrow weight '+o.weight+' gr'+(o.wt?'':' (worked out)'))}else l.push('total weight')});
 go('c_arrF','arrF',(o,f,l)=>{const L=num(o.len),b=bpOf(o);if(isFinite(L)){C.len=sv(L);f.push('length '+sv(L)+'"')}else l.push('length');
  if(isFinite(b)){C.bp=sv(b);f.push('balance point '+sv(b)+'"'+(isFinite(num(o.bp))?'':' (worked out from the part weights)'))}else l.push('balance point or FOC parts')})};
/* Arrow chooser: writes only its own inputs (scoretool.arrowchooser.<tester>), the same boxes the archer types into */
const _ch=E.lab_chooser;if(_ch)E.lab_chooser=function(){_ch();const K='scoretool.arrowchooser.'+((typeof TESTER!='undefined'&&TESTER&&TESTER.id)||'guest');
 let R={};try{R=JSON.parse(localStorage.getItem(K)||'{}')||{}}catch(e){}
 const card=app.querySelector('.acf');if(!card)return;const k=card.querySelector('#ac_myboww')||card.querySelector('h2');if(!k)return;
 k.insertAdjacentHTML('afterend',apick('ac_myarr',R.arrowId,'My arrows'));bindA();note('ac_myarr',NOTE.ac_myarr);delete NOTE.ac_myarr;
 const p=$('#ac_myarr');if(p)p.onchange=()=>{const o=p.value?window.myArrow(p.value):null;R.arrowId=p.value;
  if(o){const f=[],l=[];[['len','length','"'],['pt','point weight',' gr'],['gpi','shaft weight',' gr/in','gpiU'],['ins','insert',' gr'],['nock','nock',' gr'],['vanes','vanes',' gr'],['vpos','vane position','"'],['bp','balance point','"']].forEach(([s,n,u,t])=>{const x=num(o[s]);if(isFinite(x)){R[t||s]=sv(x);f.push(n+' '+sv(x)+u)}else if(['len','pt','gpi'].includes(s))l.push(n)});
   NOTE.ac_myarr=said(o,f,l)}
  localStorage.setItem(K,JSON.stringify(R));render()}};
/* Arrow optimizer: a new session can carry a snapshot of a My arrows set (t.arrow, the same shape the Arrow setup card shows) */
const snapOf=o=>({bow:'',name:o.name,setId:o.id,spine:o.spine?String(o.spine):'',model:o.shaft||'',len:isFinite(num(o.len))?num(o.len):null,pt:isFinite(num(o.pt))?num(o.pt):null,foc:o.foc,tw:o.weight||null,fps:isFinite(num(o.fps))?Math.round(num(o.fps)):null,fpsSrc:isFinite(num(o.fps))?'measured':''});
const _op=E.lab_opt;if(_op)E.lab_opt=function(){_op();const g=$('#tgo');if(!g)return;
 g.insertAdjacentHTML('beforebegin',apick('t_myarr','','Arrow set for this session'));bindA();
 const p=$('#t_myarr'),aw=$('#tarw');if(p)p.onchange=()=>{const w=$('#t_myarrnote');if(w)w.remove();const o=p.value?window.myArrow(p.value):null;if(o){if(aw)aw.checked=false;note('t_myarr','This session will save '+o.name+': '+(sum(o)||'no details yet')+'.')}};
 if(aw)aw.addEventListener('change',()=>{if(aw.checked&&p)p.value=''});
 const o0=g.onclick;g.onclick=function(){const o=p&&p.value?window.myArrow(p.value):null;const n0=(S.tune||[]).length;o0.apply(this,arguments);
  if(o&&(S.tune||[]).length>n0){const t=S.tune[S.tune.length-1];if(t&&t.id==S._tuneId&&!t.arrow){t.arrow=snapOf(o);save();render()}}}};
/* My archery menu: a My arrows row after My bows */
const _ma=E.myarch;if(_ma)E.myarch=function(){_ma();const g=app.querySelector('[data-go=lab_mybows]')||app.querySelector('[data-go=lab_gear]');if(g&&!app.querySelector('[data-go=lab_myarrows]')){
 g.insertAdjacentHTML('afterend',`<button class="labrow" data-go="lab_myarrows"><span class="i" aria-hidden="true">${ic('arrow')}</span><span><b>My arrows</b><small>Each arrow set once: shaft, spine, length, weights, fletching and FOC</small></span><span class="go" aria-hidden="true">›</span></button>`);
 app.querySelector('[data-go=lab_myarrows]').onclick=()=>nav('lab_myarrows')}};
})();
