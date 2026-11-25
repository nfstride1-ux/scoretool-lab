/* Archery Australia Target Rounds, Schedule 9A, effective January 2017.
   + is the 122 cm face and * is the 80 cm face. Each number is the arrows at that distance.
   Ends are 6 arrows, the same as the outdoor rounds already in the app.
   40/1440 is 36 at 40 m on the 122 cm face, 36 at 30 m on the 122 cm face and 36 at 30 m on the 80 cm face, then 36 at 20 m on the 80 cm face.
   The columns for 55 m, 45 m, 35 m and 25 m are empty on every row.
   "app" is the name already used in ScoreTool when that differs from the table. A row with no "app" is added under the table name.
   WA 50/720 in the table is the full 80 cm face. It is not WA 720 (50m Compound), which is the 80 cm 6-ring face and stays as it is.
   Other Short and Junior rounds can be made by cutting distances 10 m and 20 m. That note is not a list of extra named rounds. */
window.AA_CITE='Archery Australia Target Rounds, Schedule 9A, effective January 2017';
window.AA_NOTE='Other Short and Junior rounds may be created by reducing distances by 10 m and 20 m.';
window.AA_TARGET=[
 {id:'WA 90/1440',arrows:144,max:1440,app:'WA 90/1440 (90/70/50/30m)',dist:[[90,36,122],[70,36,122],[50,36,80],[30,36,80]]},
 {id:'WA 70/1440',arrows:144,max:1440,app:'WA 70/1440 (70/60/50/30m)',dist:[[70,36,122],[60,36,122],[50,36,80],[30,36,80]]},
 {id:'WA 60/1440',arrows:144,max:1440,aka:['Fremantle Round'],app:'WA 60/1440 (60/50/40/30m)',dist:[[60,36,122],[50,36,122],[40,36,80],[30,36,80]]},
 {id:'50/1440',arrows:144,max:1440,app:'AA 50/1440 (50/40/30/20m)',dist:[[50,36,122],[40,36,122],[30,36,80],[20,36,80]]},
 {id:'40/1440',arrows:144,max:1440,dist:[[40,36,122],[30,36,122],[30,36,80],[20,36,80]]},
 {id:'Long Sydney',arrows:120,max:1200,dist:[[90,30,122],[70,30,122],[60,30,122],[50,30,122]]},
 {id:'Sydney',arrows:120,max:1200,dist:[[70,30,122],[60,30,122],[50,30,122],[40,30,122]]},
 {id:'Long Brisbane',arrows:120,max:1200,dist:[[90,30,122],[70,30,122],[60,30,80],[50,30,80]]},
 {id:'Brisbane',arrows:120,max:1200,dist:[[70,30,122],[60,30,122],[50,30,80],[40,30,80]]},
 {id:'Adelaide',arrows:120,max:1200,dist:[[60,30,122],[50,30,122],[40,30,80],[30,30,80]]},
 {id:'Short Adelaide',arrows:120,max:1200,dist:[[50,30,122],[40,30,122],[30,30,80],[20,30,80]]},
 {id:'Hobart',arrows:90,max:900,dist:[[90,30,122],[70,30,122],[50,30,122]]},
 {id:'Perth',arrows:90,max:900,dist:[[70,30,122],[60,30,122],[50,30,122]]},
 {id:'WA 60/900',arrows:90,max:900,aka:['FITA 900','Canberra Round'],app:'WA 60/900 (60/50/40m)',dist:[[60,30,122],[50,30,122],[40,30,122]]},
 {id:'Short Canberra',arrows:90,max:900,app:'Short Canberra (50/40/30m)',dist:[[50,30,122],[40,30,122],[30,30,122]]},
 {id:'Junior Canberra',arrows:90,max:900,app:'Junior Canberra (40/30/20m)',dist:[[40,30,122],[30,30,122],[20,30,122]]},
 {id:'Grange',arrows:90,max:900,dist:[[60,90,122]]},
 {id:'Melbourne',arrows:90,max:900,dist:[[50,90,122]]},
 {id:'Darwin',arrows:90,max:900,dist:[[40,90,122]]},
 {id:'Geelong',arrows:90,max:900,dist:[[30,90,122]]},
 {id:'Newcastle',arrows:90,max:900,dist:[[20,90,122]]},
 {id:'Holt',arrows:90,max:900,dist:[[50,90,80]]},
 {id:'Samford',arrows:90,max:900,dist:[[40,90,80]]},
 {id:'Drake',arrows:90,max:900,dist:[[30,90,80]]},
 {id:'Wollongong',arrows:72,max:720,dist:[[90,36,122],[70,36,122]]},
 {id:'Townsville',arrows:72,max:720,dist:[[70,36,122],[60,36,122]]},
 {id:'Launceston',arrows:72,max:720,dist:[[50,36,80],[30,36,80]]},
 {id:'WA 70/720',arrows:72,max:720,app:'WA 720 (70m)',dist:[[70,72,122]]},
 {id:'WA 60/720',arrows:72,max:720,app:'WA 720 (60m)',dist:[[60,72,122]]},
 {id:'WA 50/720',arrows:72,max:720,app:'WA 50/720 (80 cm)',note:'Full 80 cm face, all ten rings. WA 720 (50m Compound) is a different round: the 80 cm face scored to the 6-ring.',dist:[[50,72,80]]},
 {id:'50/720',arrows:72,max:720,dist:[[50,72,122]]},
 {id:'40/720',arrows:72,max:720,dist:[[40,72,122]]},
 {id:'30/720',arrows:72,max:720,dist:[[30,72,122]]}];
window.aaDef=function(row){const blocks=row.dist.map(([m,n,cm])=>({dist:m,unit:'m',size:cm,type:'full',ends:n/6}));
 const ends=blocks.reduce((t,b)=>t+b.ends,0),sizes=[...new Set(blocks.map(b=>b.size+'cm'))];
 return {ends,ape:6,face:sizes.join(' / '),max:row.max,blocks,aa9a:row.id,aka:row.aka||[]}};
/* distances and faces a stored round actually scores, so a round already in the list can be checked against the table */
window.aaShape=function(key,R){if(R.blocks&&R.blocks.length)return {max:R.max,arrows:R.ends*R.ape,parts:R.blocks.map(b=>({m:+b.dist,n:b.ends*R.ape,cm:+b.size,type:b.type||'full'}))};
 const m=+(String(key).match(/(\d+)\s*m/)||[])[1],cm=+(String(R.face||'').match(/(\d+)/)||[])[1];
 return {max:R.max,arrows:R.ends*R.ape,parts:[{m,n:R.ends*R.ape,cm,type:/6-ring/.test(R.face||'')?'6-ring':'full'}]}};
window.aaMatches=function(key,R,row){const s=aaShape(key,R);if(!R||R.ape!==6||s.max!==row.max||s.arrows!==row.arrows||s.parts.length!==row.dist.length)return false;
 return row.dist.every((d,i)=>{const p=s.parts[i];return p.m===d[0]&&p.n===d[1]&&p.cm===d[2]&&p.type==='full'})};
window.aaApply=function(R){window.AA_CHANGED=[];const fresh=[];
 window.AA_TARGET.forEach(row=>{const key=row.app||row.id;row.key=key;
  if(R[key]){R[key].aa9a=row.id;R[key].aka=row.aka||[];
   if(!aaMatches(key,R[key],row)){const before=aaShape(key,R[key]),def=aaDef(row);
    R[key].ends=def.ends;R[key].ape=def.ape;R[key].face=def.face;R[key].max=def.max;R[key].blocks=def.blocks;
    window.AA_CHANGED.push({key,before,after:aaShape(key,R[key])})}}
  else fresh.push([key,aaDef(row)])});
 if(!fresh.length)return;const snap=Object.keys(R).map(k=>[k,R[k]]);Object.keys(R).forEach(k=>delete R[k]);let placed=false;
 snap.forEach(([k,v])=>{R[k]=v;if(k==='Junior Canberra (40/30/20m)'){fresh.forEach(([n,d])=>{R[n]=d});placed=true}});
 if(!placed)fresh.forEach(([n,d])=>{R[n]=d})};
/* Tools > Rounds. The list is rebuilt on each search without replacing the search box, so the cursor stays put. */
const aaEsc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
window.aaRoundsList=function(){const words=String(window._aaQ||'').trim().toLowerCase().split(/\s+/).filter(Boolean),open=window._aaOpen||'';
 const rows=AA_TARGET.filter(r=>{const blob=[r.id,...(r.aka||[]),r.note||'',r.key||'',...r.dist.flatMap(d=>[d[0]+' m',d[0]+'m',d[1]+' arrows',d[2]+' cm',d[2]+'cm']),r.arrows+' arrows','max '+r.max].join(' ').toLowerCase();
  return words.every(w=>blob.includes(w))});
 const one=r=>{const on=open===r.id,aka=(r.aka||[]).length?`<small>Also ${aaEsc(r.aka.join(' · '))}</small>`:'';
  const detail=!on?'':(()=>{const key=r.key||r.app||r.id;
   return `<div class="aadetail" id="aadetail"><table class="labtbl"><thead><tr><th>Distance</th><th>Arrows</th><th>Face</th></tr></thead><tbody>${r.dist.map(([m,n,cm])=>`<tr data-aa-d="${m}" data-aa-n="${n}" data-aa-f="${cm}"><td>${m} m</td><td>${n}</td><td>${cm} cm</td></tr>`).join('')}</tbody></table><p id="aatotal"><b>${r.arrows}</b> arrows</p><p id="aamax">Possible score <b>${r.max}</b></p>${(r.aka||[]).length?`<p id="aaaka">Also known as ${aaEsc(r.aka.join(' and '))}.</p>`:''}${key!==r.id?`<p class="small muted">Scored in ScoreTool as ${aaEsc(key)}.</p>`:''}${r.note?`<p class="small muted">${aaEsc(r.note)}</p>`:''}</div>`})();
  return `<button type="button" class="aarow" data-aa="${aaEsc(r.id)}" aria-expanded="${on}"><b>${aaEsc(r.id)}</b><small>${r.arrows} arrows · max ${r.max}</small>${aka}</button>${detail}`};
 return `<p class="small muted" id="aacount">${rows.length} of ${AA_TARGET.length}</p>${rows.length?rows.map(one).join(''):'<p class="small muted" id="aaempty">No round matches that search.</p>'}`};
