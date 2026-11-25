/* Gear: bow setups with sight marks. Records what the archer sets; gives no gear advice. */
const SIGHT_DISTS=['18m','20m','30m','40m','50m','60m','70m','90m'];
function seedBows(){S.bows=S.bows||[];S.bowSel=S.bowSel||{}}
const myBows=()=>(S.bows||[]).filter(b=>b.archer==S.profile);
function curBow(){const L=myBows();return L.find(b=>b.id==S.bowSel[S.profile])||L[0]}
/* redraw after a change: inside My archery > Setups & sight marks, redraw that screen (keeps its back button and layout),
   otherwise the Diary as before; scroll position kept */
function gearRedraw(){const y=scrollY;if(typeof view!='undefined'&&String(view).startsWith('lab_')&&typeof render=='function')render();else diary();scrollTo(0,y)}
/* rows = the standard list + this bow's own distances + any distance the shown arrow set already has a mark for (a full
   sight mark sheet can store every metre from 2 to 120 m; those rows show without being added one by one) */
function bowDists(b,M){const all=[...new Set([...SIGHT_DISTS,...(b.extra||[]),...Object.keys(M||{}).filter(d=>M[d]&&(M[d].v||M[d].h))])];return all.sort((a,c)=>parseFloat(a)-parseFloat(c)||a.localeCompare(c))}
/* Arrow sets (23 Oct 2026, Nathe: "Need this to also have drop down for arrow type. Everyone has more than a few sets of arrows.")
   Sight marks are kept per bow setup + arrow set. The first set, "Arrows 1", IS the bow's existing b.marks, so marks saved before
   this update are read and written exactly where they always were (an older app version still sees them). Other sets keep their
   marks in the new b.setMarks[setId]. Sets themselves (name, shaft, spine, length, point) are per archer in the new S.arrowSets;
   "Arrows 1" is only written there once it is renamed or given details. */
const AS1='arrows1';
function mySets(){const L=(S.arrowSets||[]).filter(a=>a.archer==S.profile);return L.some(a=>a.id==AS1)?L:[{id:AS1,archer:S.profile,name:'Arrows 1'},...L]}
function curSet(){const L=mySets();return L.find(a=>a.id==((S.arrowSel||{})[S.profile]))||L[0]}
function setRec(a){S.arrowSets=S.arrowSets||[];let r=S.arrowSets.find(x=>x.id==a.id&&x.archer==S.profile);if(!r){r={...a};S.arrowSets.push(r)}return r}
function marksOf(b,a){if(!b)return{};if(!a||a.id==AS1)return b.marks=b.marks||{};b.setMarks=b.setMarks||{};return b.setMarks[a.id]=b.setMarks[a.id]||{}}
function peekMarks(b,a){if(!b)return{};if(!a||a.id==AS1)return b.marks||{};return(b.setMarks||{})[a.id]||{}}
/* display text for where a set came from; the one-time seeded set shows a plain description (its stored src is left as it is) */
function srcText(a){return a.id=='as-nathe-ace-20261023'?'Sight mark sheet, 23 Oct 2026 12:10 AWST (Concept x - Ace, 85 m density altitude)':a.src||''}
function setDesc(a){return[a.shaft,a.spine,a.len?a.len+'"':'',a.pt?a.pt+' gr':'',a.wt?a.wt+' gr arrow':''].filter(Boolean).join(' · ')}
window.arrowSets=()=>mySets().map(a=>({...a}));
function sightFor(dist){const b=curBow();if(!b||!dist)return'';const m=peekMarks(b,curSet())[dist];return m&&m.v?m.v+(m.h?' / '+m.h:''):''}
function renderGear(){seedBows();const L=myBows(),b=curBow(),AL=mySets(),a=curSet(),M=peekMarks(b,a),el=document.createElement('div');el.className='card';el.id='gearcard';
 el.innerHTML=`<span class="kicker">Gear</span><h2>Sight marks</h2>
 ${L.length?`<label for="bsel">Bow setup</label><select id="bsel">${L.map(x=>`<option value="${x.id}" ${x==b?'selected':''}>${esc(x.name)}</option>`).join('')}</select>`:'<p class="small muted">Add a bow setup to save its sight marks.</p>'}
 <div class="row" style="gap:6px;margin-top:6px"><button class="btn ghost" id="bnew" style="padding:6px 10px">+ New bow setup</button>${b?'<button class="btn ghost" id="bren" style="padding:6px 10px">Rename</button>':''}</div>
 ${b?`<label for="asel" style="margin-top:10px">Arrow set</label><select id="asel">${AL.map(x=>`<option value="${esc(x.id)}" ${x.id==a.id?'selected':''}>${esc(x.name)}${setDesc(x)?' ('+esc(setDesc(x))+')':''}</option>`).join('')}</select>
 <div class="row" style="gap:6px;margin-top:6px"><button class="btn ghost" id="anew" style="padding:6px 10px">+ New arrow set</button><button class="btn ghost" id="aren" style="padding:6px 10px">Rename</button></div>
 <details id="adet" style="margin-top:8px"><summary style="cursor:pointer;font-weight:700">Arrow details <span class="small muted">(optional)</span></summary>
 <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">${[['shaft','Shaft','e.g. X10','text'],['spine','Spine','e.g. 600','decimal'],['len','Length (in)','e.g. 28','decimal'],['pt','Point (gr)','e.g. 110','decimal'],['wt','Total weight (gr)','e.g. 405','decimal'],['fps','Speed (fps)','e.g. 290','decimal'],['sh','Sight height (in)','e.g. 3.93','decimal'],['sr','Sight radius (in)','e.g. 31.3','decimal'],['si','Sighted in at','e.g. 30m, 90m','text']].map(([k,l,ph,im])=>`<label style="flex:1 1 40%;margin:0">${l}<input class="asf" data-k="${k}" value="${esc(a[k]||'')}" inputmode="${im}" placeholder="${ph}" style="min-height:48px"></label>`).join('')}</div>
 ${a.src?`<p class="small muted" style="margin:6px 0 0">From: ${esc(srcText(a))}</p>`:''}
 <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">${window.arrowSetup?'<button class="btn ghost" id="afromac" style="padding:6px 10px">Fill from Arrow chooser</button>':''}${window.myArrows?'<button class="btn ghost" id="amyarr" style="padding:6px 10px">Fletching and FOC in My arrows</button>':''}</div>
 <p class="small muted" style="margin:6px 0 0">The Arrow chooser and tuning sessions use the same shaft, length and point. Each arrow set has its own sight marks for this bow.</p></details>`:''}
 ${b?`<div class="smwrap"${bowDists(b,M).length>14?' style="max-height:62vh;overflow-y:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--line);border-radius:10px;margin-top:10px"':''}><table style="width:100%;margin-top:${bowDists(b,M).length>14?0:10}px;border-collapse:collapse"><thead style="position:sticky;top:0;background:var(--card,#fff);z-index:1"><tr><th style="text-align:left">Distance</th><th>Vertical</th><th>Horizontal <span class="small muted">(optional)</span></th></tr></thead><tbody>
 ${bowDists(b,M).map(d=>{const m=M[d]||{};return`<tr><th scope="row" style="text-align:left;font-size:18px">${esc(d)}</th>${['v','h'].map(k=>`<td style="padding:4px"><input class="smk" data-d="${esc(d)}" data-k="${k}" value="${esc(m[k]||'')}" inputmode="decimal" aria-label="${esc(d)} ${k=='v'?'vertical':'horizontal'} mark" placeholder="–" style="width:100%;min-height:48px;font-size:18px;text-align:center"></td>`).join('')}</tr>`}).join('')}</tbody></table></div>${bowDists(b,M).length>14?`<p class="small muted" style="margin:4px 0 0">${bowDists(b,M).length} distances. Scroll the list.</p>`:''}
 <div class="row" style="gap:6px;margin-top:8px"><input id="ndist" inputmode="decimal" placeholder="Add distance" aria-label="Add your own distance" style="flex:1;min-height:48px"><select id="nunit" aria-label="Unit" style="width:70px;min-height:48px"><option>m</option><option>yd</option></select><button class="btn" id="nadd">Add</button></div>
 ${window.openSightImport?'<button class="btn ghost" id="simpopen" type="button" style="margin-top:8px;width:100%">Load PDF or CSV</button>':''}
 <p class="small muted">Every change is saved to this bow and arrow set and logged in your setup diary.</p>`:''}`;
 app.prepend(el);
 if($('#bsel'))$('#bsel').onchange=e=>{S.bowSel[S.profile]=e.target.value;save();gearRedraw()};
 $('#bnew').onclick=()=>{const n=prompt('Name this bow setup (e.g. Indoor recurve)');if(!n||!n.trim())return;const id='b'+Date.now();S.bows.push({id,archer:S.profile,name:n.trim(),extra:[],marks:{}});S.bowSel[S.profile]=id;save();gearRedraw()};
 if($('#asel'))$('#asel').onchange=e=>{S.arrowSel=S.arrowSel||{};S.arrowSel[S.profile]=e.target.value;save();gearRedraw()};
 if($('#anew'))$('#anew').onclick=()=>{const n=prompt('Name this arrow set (e.g. Indoor X23s)');if(!n||!n.trim())return;const id='as'+Date.now();S.arrowSets=S.arrowSets||[];S.arrowSets.push({id,archer:S.profile,name:n.trim()});S.arrowSel=S.arrowSel||{};S.arrowSel[S.profile]=id;save();gearRedraw()};
 if($('#aren'))$('#aren').onclick=()=>{const n=prompt('New name',a.name);if(n&&n.trim()){setRec(a).name=n.trim();save();gearRedraw()}};
 el.querySelectorAll('.asf').forEach(i=>i.onchange=()=>{const r=setRec(a),v=i.value.trim();if((r[i.dataset.k]||'')==v)return;if(v)r[i.dataset.k]=v;else delete r[i.dataset.k];save();gearRedraw();const d=$('#adet');if(d)d.open=true});
 if($('#afromac'))$('#afromac').onclick=()=>{const x=window.arrowSetup&&arrowSetup();if(!x){alert('Fill in the Arrow chooser first (Tools > Arrow chooser).');return}const r=setRec(a);if(x.model)r.shaft=x.model;if(x.spine)r.spine=x.spine;r.len=String(x.len);r.pt=String(x.pt);save();gearRedraw();const d=$('#adet');if(d)d.open=true};
 if($('#amyarr'))$('#amyarr').onclick=()=>nav('lab_myarrows');
 if($('#bren'))$('#bren').onclick=()=>{const n=prompt('New name',b.name);if(n&&n.trim()){b.name=n.trim();save();gearRedraw()}};
 el.querySelectorAll('.smk').forEach(i=>i.onchange=()=>{const d=i.dataset.d,k=i.dataset.k,MM=marksOf(b,a),m=MM[d]=MM[d]||{},old=m[k]||'',nv=i.value.trim();if(old==nv)return;m[k]=nv;
  S.setup=S.setup||[];S.setup.push({id:'sm'+Date.now(),archer:S.profile,date:today(),cat:'Sight',change:`${a.id!=AS1?a.name+', ':''}${d}${k=='h'?' horizontal':''}: ${old||'none'} to ${nv||'cleared'}`,reason:'',noticed:'',bow:b.name,...(a.id!=AS1?{arrows:a.name}:{})});save();
  i.style.outline='3px solid '+(CB()?'#5ab0ff':'#16a34a');setTimeout(()=>i.style.outline='',800)});
 if($('#simpopen'))$('#simpopen').onclick=()=>openSightImport();
 if($('#nadd'))$('#nadd').onclick=()=>{const v=parseFloat($('#ndist').value);if(!(v>0))return;const d=v+$('#nunit').value;if(!bowDists(b,M).includes(d))(b.extra=b.extra||[]).push(d);save();gearRedraw()}}
const _diaryBase=diary;diary=function(){_diaryBase();renderGear()};
