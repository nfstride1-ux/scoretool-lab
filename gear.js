/* Gear: bow setups with sight marks. Records what the archer sets; gives no gear advice. */
const SIGHT_DISTS=['18m','20m','30m','40m','50m','60m','70m','90m'];
function seedBows(){S.bows=S.bows||[];S.bowSel=S.bowSel||{}}
const myBows=()=>(S.bows||[]).filter(b=>b.archer==S.profile);
function curBow(){const L=myBows();return L.find(b=>b.id==S.bowSel[S.profile])||L[0]}
function bowDists(b){const all=[...SIGHT_DISTS,...(b.extra||[])];return all.sort((a,c)=>parseFloat(a)-parseFloat(c)||a.localeCompare(c))}
function sightFor(dist){const b=curBow();if(!b||!dist)return'';const m=(b.marks||{})[dist];return m&&m.v?m.v+(m.h?' / '+m.h:''):''}
function renderGear(){seedBows();const L=myBows(),b=curBow(),el=document.createElement('div');el.className='card';el.id='gearcard';
 el.innerHTML=`<span class="kicker">Gear</span><h2>Sight marks</h2>
 ${L.length?`<label for="bsel">Bow setup</label><select id="bsel">${L.map(x=>`<option value="${x.id}" ${x==b?'selected':''}>${esc(x.name)}</option>`).join('')}</select>`:'<p class="small muted">Add a bow setup to save its sight marks.</p>'}
 <div class="row" style="gap:6px;margin-top:6px"><button class="btn ghost" id="bnew" style="padding:6px 10px">+ New bow setup</button>${b?'<button class="btn ghost" id="bren" style="padding:6px 10px">Rename</button>':''}</div>
 ${b?`<table style="width:100%;margin-top:10px;border-collapse:collapse"><thead><tr><th style="text-align:left">Distance</th><th>Vertical</th><th>Horizontal <span class="small muted">(optional)</span></th></tr></thead><tbody>
 ${bowDists(b).map(d=>{const m=b.marks[d]||{};return`<tr><th scope="row" style="text-align:left;font-size:18px">${esc(d)}</th>${['v','h'].map(k=>`<td style="padding:4px"><input class="smk" data-d="${esc(d)}" data-k="${k}" value="${esc(m[k]||'')}" inputmode="decimal" aria-label="${esc(d)} ${k=='v'?'vertical':'horizontal'} mark" placeholder="–" style="width:100%;min-height:48px;font-size:18px;text-align:center"></td>`).join('')}</tr>`}).join('')}</tbody></table>
 <div class="row" style="gap:6px;margin-top:8px"><input id="ndist" inputmode="decimal" placeholder="Add distance" aria-label="Add your own distance" style="flex:1;min-height:48px"><select id="nunit" aria-label="Unit" style="width:70px;min-height:48px"><option>m</option><option>yd</option></select><button class="btn" id="nadd">Add</button></div>
 <p class="small muted">Every change is saved to this bow and logged in your setup diary.</p>`:''}`;
 app.prepend(el);
 if($('#bsel'))$('#bsel').onchange=e=>{S.bowSel[S.profile]=e.target.value;save();diary()};
 $('#bnew').onclick=()=>{const n=prompt('Name this bow setup (e.g. Indoor recurve)');if(!n||!n.trim())return;const id='b'+Date.now();S.bows.push({id,archer:S.profile,name:n.trim(),extra:[],marks:{}});S.bowSel[S.profile]=id;save();diary()};
 if($('#bren'))$('#bren').onclick=()=>{const n=prompt('New name',b.name);if(n&&n.trim()){b.name=n.trim();save();diary()}};
 el.querySelectorAll('.smk').forEach(i=>i.onchange=()=>{const d=i.dataset.d,k=i.dataset.k,m=b.marks[d]=b.marks[d]||{},old=m[k]||'',nv=i.value.trim();if(old==nv)return;m[k]=nv;
  S.setup=S.setup||[];S.setup.push({id:'sm'+Date.now(),archer:S.profile,date:today(),cat:'Sight',change:`${d}${k=='h'?' horizontal':''}: ${old||'none'} to ${nv||'cleared'}`,reason:'',noticed:'',bow:b.name});save();
  i.style.outline='3px solid '+(CB()?'#5ab0ff':'#16a34a');setTimeout(()=>i.style.outline='',800)});
 if($('#nadd'))$('#nadd').onclick=()=>{const v=parseFloat($('#ndist').value);if(!(v>0))return;const d=v+$('#nunit').value;if(!bowDists(b).includes(d))b.extra.push(d);save();diary()}}
const _diaryBase=diary;diary=function(){_diaryBase();renderGear()};
