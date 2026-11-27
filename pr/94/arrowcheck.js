/* Calculators: 'Save to this arrow' and 'Is this arrow right?' (23 Oct 2026, Nathe).
   (a) The speed card and the FOC card each get a 'Save to this arrow' button for the My arrows set picked in that card. Nothing is
   written until it is tapped. It writes ONLY the new key S.arrowInfo[profile][setId].calc = {foc, totalGr, fps, fpsSrc, bow, use, date}
   (merged with what is there). Shaft, spine, length and point weight are never changed, unless the archer changed one of them in the
   Calculators and then taps 'Save and change these' in the confirmation; 'Save results only' leaves the set exactly as it was.
   (b) A plain-words verdict: FOC against Easton's published ranges for the chosen use, and spine against the maker's chart, using
   the Arrow chooser's own chart data and chart-weight adjustments (window.arrowCharts). Always a guide, to confirm by tuning. */
(function(){
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>{const x=parseFloat(String(v??'').replace(',','.'));return isFinite(x)?x:NaN};
const f1=(x,d=1)=>isFinite(x)?(+x).toFixed(d):'-';
const SRC=()=>window.ARROW_SRC||{};
const link=k=>{const s=SRC()[k];return s?`<a href="${s[1]}" target="_blank" rel="noopener">${h(s[0])}</a>`:''};
const USES=[['indoor','Indoor'],['target','Outdoor target'],['field','Field'],['3d','3D'],['hunting','Hunting']];
const UL=u=>(USES.find(x=>x[0]==u)||USES[1])[1];
/* Easton, 'The Simple Guidelines to Correct Arrow Balance (FOC)', 2022: 7-15% indoors, 10-15% outdoors (target), 10-15% hunting.
   Easton gives no separate field or 3D figure, so the outdoor target range is used for both, and the card says so. */
const FOCR={indoor:[7,15,"Easton's 7-15% for target archery indoors"],target:[10,15,"Easton's 10-15% for target archery outdoors"],
 field:[10,15,"Easton's 10-15% for target archery outdoors (Easton gives no separate field figure)"],'3d':[10,15,"Easton's 10-15% for target archery outdoors (Easton gives no separate 3D figure)"],
 hunting:[10,15,"Easton's 10-15% for hunting"]};
function focVerdict(foc,use){if(!isFinite(foc))return null;const[lo,hi,rt]=FOCR[use]||FOCR.target,v=+f1(foc);
 if(v<=0)return{k:'low',head:'FOC too low',txt:`${f1(foc)}% is not positive. Easton: arrows with a negative FOC are unstable in flight. A heavier point or insert raises it.`,rng:rt};
 if(v<lo)return{k:'low',head:'FOC too low',txt:`${f1(foc)}% is under ${rt}.${use=='indoor'?'':' Easton: under 7-10% does not track as well in wind outdoors.'} A heavier point or insert raises it, but also makes the arrow act weaker.`,rng:rt};
 if(v>hi)return{k:'high',head:'FOC high',txt:`${f1(foc)}% is over ${rt}. Easton: well over the range can cause vertical spread at long distance, and extra FOC makes the arrow act weaker.${v>20?' Over 20% also makes a finger release more critical.':''} A lighter point brings it down.`,rng:rt};
 return{k:'good',head:'FOC good',txt:`${f1(foc)}% is inside ${rt}.`,rng:rt}}
/* which maker's chart: the arrow's own brand where we hold its chart, otherwise Easton's */
const brandOf=sh=>/gold ?tip/i.test(sh||'')?'Gold Tip':/victory/i.test(sh||'')?'Victory':/skylon/i.test(sh||'')?'Skylon':'Easton';
function spineVerdict(st,spine,shaft){if(!window.arrowCharts)return null;const S=num(spine);
 if(!isFinite(num(st.dw)))return{k:'off',head:'Spine not checked',txt:'Type the draw weight in the speed card above.'};
 if(!isFinite(num(st.len)))return{k:'off',head:'Spine not checked',txt:'Type the arrow length in the FOC card.'};
 if(!isFinite(S))return{k:'off',head:'Spine not checked',txt:'Type the arrow\'s spine above (or pick a My arrows set that has one).'};
 const all=window.arrowCharts(st)||[],want=brandOf(shaft);let b=all.find(x=>x.brand==want);if(!b||b.off)b=all.find(x=>x.brand=='Easton')||b;
 if(!b)return null;const sk=b.src;
 if(/^\d{4}$/.test(String(spine).trim())&&S%100>=10&&S%100<20)return{k:'off',head:'Spine not checked',txt:`${h(spine)} is an aluminium size, which is read on Easton's aluminium chart. Open the Arrow chooser for that.`,sk:'eastonAL'};
 if(b.off)return{k:'off',head:'Spine not checked',txt:`${b.brand} chart: ${b.off}.`,sk};
 const hi=+b.hi,lo=+b.lo,L=Math.round(num(st.len)),rd=L!=num(st.len)?` (${f1(num(st.len),2).replace(/\.?0+$/,'')}" read at ${L}", the chart has whole-inch columns)`:'';
 const rng=`${b.brand} chart: ${b.spine} spine, ${b.cell}${rd}.${b.work?' Chart weight: '+b.work+'.':''}`;
 const k=S<lo?'stiff':S>hi?'weak':'right';
 const fam=b.shafts&&b.shafts.length?b.shafts.filter(x=>isFinite(+x.spine)).map(x=>+x.spine):[];
 const head={stiff:'Spine too stiff',weak:'Spine too weak',right:'Spine about right'}[k];
 const txt=k=='right'?`${h(spine)} is inside the chart's ${b.spine}.`:k=='weak'?`${h(spine)} is weaker than the chart's ${b.spine} (a higher number is weaker). A stiffer spine, a lighter point or a lower draw weight moves it towards the chart.`
  :`${h(spine)} is stiffer than the chart's ${b.spine} (a lower number is stiffer). A weaker spine, a heavier point or a higher draw weight moves it towards the chart.`;
 return{k,head,txt,rng,sk,fam}}
const CSS=`.ackv{border:1px solid var(--line);border-left:5px solid var(--blue);border-radius:12px;padding:10px 12px;margin:10px 0;background:var(--blue-bg)}
.ackv.warn{border-left-color:var(--gold,#c9a227)}.ackv b.vh{display:block;font:800 18px var(--disp);margin-bottom:2px}.ackv p{margin:4px 0}
.acksave{margin-top:10px}.acksave .btn[disabled]{opacity:.55;cursor:not-allowed}.ackcf{border:1px solid var(--gold,#c9a227);border-radius:12px;padding:10px 12px;margin:10px 0}
.ackcf ul{margin:6px 0;padding-left:20px}.ackcf .row{display:flex;gap:8px;flex-wrap:wrap}.ackmsg{margin:6px 0 0}
#ackcard label{display:block;margin:10px 0 4px;font-weight:700}`;
const css=()=>{if(!document.getElementById('ackcss')){const s=document.createElement('style');s.id='ackcss';s.textContent=CSS;document.head.appendChild(s)}};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const dPretty=s=>{const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(s||'');return m?(+m[3])+' '+MON[+m[2]-1]+' '+m[1]:String(s||'')};
/* the saved results line, shown on the set in My arrows */
window.arrowCalcLine=o=>{const c=o&&o.calc;if(!c||typeof c!='object')return'';
 return['Calculators'+(c.date?', '+dPretty(c.date):''),c.foc!=null&&c.foc!==''?'FOC '+c.foc+'%':'',c.totalGr?c.totalGr+' gr':'',c.fps?c.fps+' fps'+(c.fpsSrc=='estimate'?' (estimate)':c.fpsSrc=='own'?' (your figure)':''):'',c.bow||''].filter(Boolean).join(' · ')};
let MSG={},CF=null;/* in memory only: a note after saving, and the open confirmation {card, id, vals, diffs} */
function bowName(C){const s=C.bowId&&window.bowSnap?bowSnap(C.bowId):null;if(s)return s.name;
 const bits=[isFinite(num(C.ibo))?'IBO '+num(C.ibo)+' fps':'',isFinite(num(C.dw))?num(C.dw)+' lb':'',isFinite(num(C.dl))?num(C.dl)+'" draw':''].filter(Boolean);return bits.length?'Compound, '+bits.join(', '):''}
function bowType(C){if(C.bowT=='recurve'||C.bowT=='compound')return C.bowT;const s=C.bowId&&window.bowSnap?bowSnap(C.bowId):null;return s&&s.type=='recurve'?'recurve':'compound'}
function write(id,vals,base){const sets=typeof mySets=='function'?mySets():[],a=sets.find(x=>x.id==id);if(!a)return false;
 S.arrowInfo=S.arrowInfo||{};const P=S.arrowInfo[S.profile]=S.arrowInfo[S.profile]||{},cur=P[id]||{};
 P[id]=Object.assign({},cur,{calc:Object.assign({},cur.calc&&typeof cur.calc=='object'?cur.calc:{},vals)});
 if(base&&base.length&&typeof setRec=='function'){const r=setRec(a);base.forEach(d=>{r[d.k]=d.to})}
 save();return true}
E._ackTest={focVerdict,spineVerdict,FOCR};
const _ca=E.lab_calc;if(_ca)E.lab_calc=function(){_ca();css();const C=S.calc||{};const grid=app.querySelector('.labgrid2'),cards=grid?[...grid.querySelectorAll(':scope > .card')]:[];if(cards.length<3)return;
 const n=k=>num(C[k]),has=k=>C[k]!=null&&String(C[k]).trim()!=='';
 /* R1: the same range-checked rule of thumb as the speed card, so a slip (12365 gr) never gives or saves a speed */
 const L=window.arrowLim||(()=>null),ok1=(k,l)=>L(l,C[k])?NaN:n(k);
 const est=window.arrowSpeedEst?arrowSpeedEst(ok1('ibo','ibo'),ok1('dl','dl'),ok1('dw','dw'),ok1('gr','tw'),has('sg')?ok1('sg','sg'):0):n('ibo')-10*(30-n('dl'))-Math.max(0,n('gr')-5*n('dw'))/3-n('sg')/3,own=has('fpsU');
 const fps=own?ok1('fpsU','fps'):(C.spdOn&&isFinite(est)&&est>0?Math.round(est):NaN);
 const foc=(n('bp')-n('len')/2)/n('len')*100;
 const oF=C.arrF?window.myArrow&&myArrow(C.arrF):null,oS=C.arrS?window.myArrow&&myArrow(C.arrS):null;
 /* L6 (AC1, 1 Nov 2026): until the speed card is used or a bow is picked there, check with the current saved bow's figures, not the 340 fps default */
 const BF=!C.spdOn&&!C.bowId&&window.curSavedBow?curSavedBow():null;
 const use=USES.some(u=>u[0]==C.use)?C.use:'target',bt=BF&&!C.bowT?(BF.type=='recurve'?'recurve':'compound'):bowType(C);
 const bdw=BF&&BF.dw?BF.dw:C.dw,bdl=BF&&BF.dl?BF.dl:C.dl,bibo=BF&&BF.type=='compound'&&BF.speed?BF.speed:C.ibo;
 const spine=has('spine')?C.spine:(oF&&oF.spine||''),pt=has('pt')?C.pt:(oF&&oF.pt||'');
 /* ---- (b) the verdict card ---- */
 const fv=focVerdict(foc,use);
 const sv=spineVerdict({bow:bt,use,dw:bdw,dl:bdl,len:C.len,pt,ibo:bt=='compound'?bibo:'',ins:oF&&oF.ins},spine,oF&&oF.shaft);
 const box=v=>v?`<div class="ackv${v.k=='good'||v.k=='right'?'':' warn'}" data-v="${v.k}"><b class="vh">${h(v.head)}</b><p>${v.txt}</p>${v.rng?`<p class="small muted">Range used: ${h(v.rng)}</p>`:''}</div>`:'';
 const seg=(k,v,o)=>`<div class="labseg" role="group" aria-label="${k}">${o.map(([val,l])=>`<button type="button" data-ackseg="${k}" data-val="${val}" aria-pressed="${v==val}">${l}</button>`).join('')}</div>`;
 const ip=(k,l,u,val,ph)=>`<label for="ack_${k}">${l} <span class="muted small">(${u})</span></label><input id="ack_${k}" data-ack="${k}" ${k=='spine'?'':'inputmode="decimal"'} value="${h(val)}" placeholder="${h(ph||'')}">`;
 grid.insertAdjacentHTML('beforeend',`<div class="card" id="ackcard"><span class="kicker">Is this arrow right?</span>
  <p class="small muted" style="margin:0 0 8px">${oF?`Checking ${h(oF.name)} (picked in the FOC card).`:'Pick an arrow in the FOC card\'s My arrows list, or type the spine and point weight here.'} ${BF?`Draw weight${bt=='compound'?', speed rating':''} and draw length come from your saved bow, ${h(BF.name)}${bt=='compound'&&BF.speed?' ('+h(BF.speed)+' fps)':''}, until you fill in the speed card or pick a bow there`:`Draw weight${bt=='compound'?', IBO':''} and draw length come from the speed card`}, length from the FOC card.</p>
  <label>What it's for</label>${seg('use',use,USES)}<label>Bow</label>${seg('bowT',bt,[['compound','Compound'],['recurve','Recurve or barebow']])}
  ${ip('spine','Spine','number on the shaft',spine,'e.g. 375')}${ip('pt','Point weight','grains, point and any insert',pt,'e.g. 140')}
  <div id="ackv">${box(fv)}${box(sv)}</div>
  <p class="small" style="margin:8px 0 0"><b>This is a guide, not an answer.</b> Confirm it by bare-shaft or paper tuning.</p>
  <p class="labsrc">FOC: ${link('eastonFOC')}. Spine: ${sv&&sv.sk?link(sv.sk):link('easton')}, with the same chart-weight adjustments as the Arrow chooser${bt=='compound'?' (speed rating, and 3 lb per 25 gr of point over 100 gr)':' (3 lb per 25 gr of point over 100 gr; carbon limbs assumed)'}. Tuning: ${link('eastonTM')}.</p></div>`);
 const card=$('#ackcard');
 card.querySelectorAll('[data-ackseg]').forEach(b=>b.onclick=()=>{C[b.dataset.ackseg]=b.dataset.val;S.calc=C;save();render()});
 card.querySelectorAll('[data-ack]').forEach(i=>i.onchange=()=>{const k=i.dataset.ack,v=i.value.trim(),base=oF?String(oF[k]??''):'';if(v==base)delete C[k];else C[k]=v;S.calc=C;save();render()});
 /* a new arrow in the FOC card starts from its own spine and point */
 const pf=$('#c_arrF');if(pf){const o0=pf.onchange;pf.onchange=function(){delete C.spine;delete C.pt;CF=null;return o0&&o0.apply(this,arguments)}}
 const ps=$('#c_arrS');if(ps){const o1=ps.onchange;ps.onchange=function(){CF=null;return o1&&o1.apply(this,arguments)}}
 /* ---- (a) Save to this arrow ---- */
 const valsS=()=>({totalGr:isFinite(ok1('gr','tw'))?Math.round(n('gr')):'',fps:isFinite(fps)?Math.round(fps):'',fpsSrc:isFinite(fps)?(own?'own':'estimate'):'',bow:bowName(C),date:today()});
 const valsF=()=>{const o=oF||{};const prev=(o.calc||{});const v={foc:isFinite(foc)?+f1(foc):'',bow:bowName(C),use,date:today()};
  if(!prev.totalGr&&o.weight)v.totalGr=Math.round(o.weight);if(C.arrS==C.arrF){const s=valsS();if(s.totalGr)v.totalGr=s.totalGr;if(s.fps){v.fps=s.fps;v.fpsSrc=s.fpsSrc}}return v};
 const diffsF=()=>{if(!oF)return[];const d=[];const add=(k,l,u,to)=>{if(to==null||String(to).trim()==='')return;const from=String(oF[k]??'').trim(),t=String(to).trim();
   const same=isFinite(num(from))&&isFinite(num(t))&&k!='spine'?num(from)==num(t):from==t;if(!same)d.push({k,l,from,to:t,u})};
  add('len','Length','"',C.len);add('spine','Spine','',has('spine')?C.spine:null);add('pt','Point weight',' gr',has('pt')?C.pt:null);return d};
 const put=(ci,key,o,vals,diffs,what)=>{const c=cards[ci];const id='ack_save'+key;
  const btn=o?`<button class="btn" id="${id}">Save to this arrow</button>`:`<button class="btn" id="${id}" disabled aria-describedby="${id}why">Save to this arrow</button><p class="small muted" id="${id}why" style="margin:6px 0 0">Pick an arrow in this card's My arrows list first, then you can save ${what} to it.</p>`;
  const cf=CF&&CF.key==key&&o&&CF.id==o.id?`<div class="ackcf" role="alertdialog" aria-labelledby="${id}cfh"><b id="${id}cfh">You changed ${CF.diffs.length==1?'this':'these'} in the Calculators</b>
   <ul>${CF.diffs.map(d=>`<li>${h(d.l)}: ${h(d.from||'not set')}${d.from?h(d.u):''} → ${h(d.to)}${h(d.u)}</li>`).join('')}</ul><p class="small muted" style="margin:4px 0 8px">Change ${CF.diffs.length==1?'it':'them'} on ${h(o.name)} too, or save the results only and leave the arrow as it is?</p>
   <div class="row"><button class="btn" data-cf="all">Save and change ${CF.diffs.length==1?'it':'these'}</button><button class="btn alt" data-cf="only">Save results only</button><button class="btn ghost" data-cf="no">Cancel</button></div></div>`:'';
  const m=MSG[key]?`<p class="lab-note ackmsg" id="${id}msg" aria-live="polite">${h(MSG[key])}</p>`:'';delete MSG[key];
  c.insertAdjacentHTML('beforeend',`<div class="acksave">${btn}${cf}${m}</div>`);
  const b=$('#'+id);if(b&&o)b.onclick=()=>{const df=diffs();if(df.length){CF={key,id:o.id,diffs:df};render();return}done(key,o,vals(),[])};
  c.querySelectorAll('[data-cf]').forEach(x=>x.onclick=()=>{const k=x.dataset.cf,df=CF?CF.diffs:[];CF=null;if(k=='no'){render();return}done(key,o,vals(),k=='all'?df:[])})};
 const done=(key,o,vals,base)=>{if(write(o.id,vals,base)){const parts=window.arrowCalcLine({calc:vals}).replace(/^Calculators, [^·]*· ?/,'');MSG[key]=`Saved to ${o.name}: ${parts||'the date and bow'}.${base.length?' Also changed: '+base.map(d=>d.l.toLowerCase()+' '+d.to+d.u).join(', ')+'.':' Shaft, spine, length and points left as they were.'}`}render()};
 put(0,'S',oS,valsS,()=>[],'the speed and arrow weight');
 put(2,'F',oF,valsF,diffsF,'the FOC');
};
})();
