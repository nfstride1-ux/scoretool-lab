/* Stats → Analytics. Real data only (official competition results + arrows, and this phone's scored practice). Describes numbers, never advises.
   Lightweight inline SVG. Total-only shoots count wherever a total is enough and are left out of arrow-level charts. */
(function(){
const AF=window._af=window._af||{range:'season',round:'all',bow:'all',kind:'all'};
const bowOf=d=>{const b=(String(d||'').match(/Compound|Barebow|Recurve|Longbow/i)||['Other'])[0];return b[0].toUpperCase()+b.slice(1).toLowerCase()};
/* 31 Oct 2026 (queue B3): the bow filter always lists every bow type, with no All bows; it starts on your own bow (Other only when a shoot has no bow type). */
const BOWS=['Compound','Recurve','Barebow','Longbow'];
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0,f1=x=>(Math.round(x*10)/10).toFixed(1),f2=x=>x.toFixed(2);
const GOLD='#ffc629',BLUE='#60a5fa',MUT='#9aa7ba';
const myBow=()=>{const r=findReal(S.profile||'').filter(x=>x.division).slice(-1)[0];return r?bowOf(r.division):(S.bow||'Compound')};
/* One list of shoots, shared with Stats (same rounds, same names, same incomplete rule). ABA 3D arrows (0-20 points) stay out of the per-arrow charts. */
function shoots(){const mb=myBow();return(window.statShoots?statShoots():[]).map(x=>{const r=x.r||{},ends=x.ends.length&&!x.aba?x.ends.map((a,i)=>({dist:distLabel((x.dists||[])[i],x.round),arrows:a.map(String)})):null;
 const o={s:x.s||null,date:x.date,round:x.round,bow:r.division?bowOf(r.division):bowOf(mb),kind:x.src=='practice'?'practice':'comp',score:x.score,part:!!x.inc,ends,club:x.club||'',event:x.event||'',tens:parseInt(r.tens)||0,xs:parseInt(r.xs)||0,pos:x.s?(x.s.pos||[]).flat().filter(Boolean):[],aba:!!x.aba};
 o.field=!!x.field||/field/i.test(x.round);o.na=ends?ends.reduce((t,e)=>t+e.arrows.length,0):(o.part||o.aba?null:roundArrows(x.round));o.pts=ends?ends.reduce((t,e)=>t+endSum(e.arrows),0):o.score;return o})}
function filt(all){const now=today(),yr=now.slice(0,4),d90=new Date(Date.now()-90*864e5).toLocaleDateString('en-CA');
 return all.filter(s=>(S.incInc||!s.part)&&(AF.range=='all'||(AF.range=='season'?s.date.startsWith(yr):s.date>=d90))&&(AF.round=='all'||s.round==AF.round)&&(AF.bow=='all'||s.bow==AF.bow)&&(AF.kind=='all'||s.kind==AF.kind))}
/* PB flags per round+bow, chronological, full rounds only */
function markPB(all){const best={};all.forEach(s=>{s.pb=false;if(s.part)return;const k=s.round+'|'+s.bow;if(best[k]==null||s.score>best[k]){s.pb=best[k]!=null;s.first=best[k]==null;s.prev=best[k];best[k]=s.score}})}
function line(pts,o={}){if(!pts.length)return'';const W=340,H=o.h||130,P=28,ys=pts.map(p=>p.y).concat((o.y2||[]).filter(v=>v!=null)),mn=Math.min(...ys),mx=Math.max(...ys),sp=mx-mn||1,
 X=i=>P+(pts.length<2?(W-2*P)/2:i*(W-2*P)/(pts.length-1)),Y=v=>H-20-(v-mn)/sp*(H-40);
 let g=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${o.label||'chart'}"><text x="2" y="${Y(mx)+3}" font-size="9" fill="${MUT}">${o.fmt?o.fmt(mx):mx}</text><text x="2" y="${Y(mn)+3}" font-size="9" fill="${MUT}">${o.fmt?o.fmt(mn):mn}</text>`;
 if(pts.length>1)g+=`<polyline fill="none" stroke="${BLUE}" stroke-width="1.6" points="${pts.map((p,i)=>X(i)+','+Y(p.y)).join(' ')}"/>`;
 if(o.y2){const q=o.y2.map((v,i)=>v==null?null:X(i)+','+Y(v)).filter(Boolean);if(q.length>1)g+=`<polyline fill="none" stroke="${GOLD}" stroke-width="2" stroke-dasharray="4 3" points="${q.join(' ')}"/>`}
 pts.forEach((p,i)=>{g+=p.pb?`<path d="M${X(i)} ${Y(p.y)-7}l2 4.5 5 .5-3.8 3.3 1.2 4.9-4.4-2.6-4.4 2.6 1.2-4.9-3.8-3.3 5-.5z" fill="${GOLD}"><title>${p.t||''}</title></path>`:`<circle cx="${X(i)}" cy="${Y(p.y)}" r="${p.hollow?3:3.2}" fill="${p.hollow?'none':BLUE}" stroke="${p.hollow?MUT:BLUE}"><title>${p.t||''}</title></circle>`});
 return g+`<text x="${P}" y="${H-5}" font-size="9" fill="${MUT}">${pts[0].d||''}</text><text x="${W-P}" y="${H-5}" font-size="9" text-anchor="end" fill="${MUT}">${pts[pts.length-1].d||''}</text></svg>`}
function hbars(rows,fmt){const mx=Math.max(...rows.map(r=>r[1]),1);return rows.map(([l,v,sub])=>`<div style="display:grid;grid-template-columns:92px 1fr 56px;gap:8px;align-items:center;margin:5px 0"><span class="small" title="${esc(l)}" style="overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.2;overflow-wrap:anywhere">${esc(l)}</span><span style="background:var(--night2);border-radius:6px;height:14px;overflow:hidden"><i style="display:block;height:100%;width:${Math.max(2,v/mx*100)}%;background:linear-gradient(90deg,#1d4ed8,${GOLD})"></i></span><b class="small" style="text-align:right">${fmt?fmt(v):v}</b></div>${sub?`<div class="small muted" style="margin:-3px 0 4px 100px">${sub}</div>`:''}`).join('')}
const card=(k,t,b,dark)=>`<div class="card${dark?' dark':''}"><span class="kicker" style="color:${GOLD}">${k}</span>${t?`<h3 style="margin:2px 0 8px">${t}</h3>`:''}${b}</div>`;
const stat=(v,l)=>`<div class="stat"><b>${v}</b>${l}</div>`;
function view(){const all=shoots();markPB(all);const bl=BOWS.concat(all.some(s=>s.bow=='Other')?['Other']:[]);if(!bl.includes(AF.bow)){const m=bowOf(myBow());AF.bow=bl.includes(m)?m:'Compound'}const L=filt(all);
 let rounds=(window.statRounds?statRounds().map(o=>o.r):[...new Set(all.map(s=>s.round))]);if(window.FRD)rounds=FRD(rounds);const rlab=r=>window.FRL?FRL(r,rounds):r,bows=[...new Set(all.map(s=>s.bow))],sel=(id,v,opts)=>`<select id="${id}" style="padding:8px;font-size:14px">${opts.map(([k,l])=>`<option value="${esc(k)}" ${k==v?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
 let h=`<div class="card dark" style="background:linear-gradient(135deg,#0b1a3a,#070a10)"><span class="kicker" style="color:${GOLD}">Stats · analytics</span><h1 style="margin:0">Your numbers</h1><p class="small muted" style="margin:4px 0 10px">Real results only. Describes what happened; no advice.</p>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px">${sel('fr',AF.range,[['season',new Date().getFullYear()+' season'],['90','Last 90 days'],['all','All time']])}${sel('fk',AF.kind,[['all','Comp + practice'],['comp','Competition'],['practice','Practice']])}${sel('fo',AF.round,[['all','All rounds'],...rounds.map(r=>[r,rlab(r)])])}${sel('fb',AF.bow,bl.map(b=>[b,b]))}</div></div>`;
 if(!L.length){h+=card('No shoots','Nothing matches these filters','<p class="small muted">Change a filter above.</p>');return h}
 const full=L.filter(s=>!s.part),allF=L.every(s=>s.field),known=full.filter(s=>s.na&&(allF?s.field&&s.pts/s.na<=6:!s.field&&s.pts/s.na<=10)),arr=L.reduce((t,s)=>t+(s.na||0),0),avg=known.reduce((t,s)=>t+s.pts,0)/(known.reduce((t,s)=>t+s.na,0)||1);
 const byAvg=known.map(s=>({...s,a:s.pts/s.na})).sort((a,b)=>b.a-a.a),pbs=L.filter(s=>s.pb);
 // 1 overview
 h+=card((AF.range=='season'?new Date().getFullYear()+' season':AF.range=='90'?'Last 90 days':'All time')+' overview','',`<div class="stats" style="grid-template-columns:1fr 1fr 1fr">${stat(L.length,'shoots')}${stat(arr,'arrows')}${stat(known.length?f2(avg):'–','avg arrow')}${stat(pbs.length,'PBs beaten')}${stat(byAvg[0]?f2(byAvg[0].a):'–','best avg')}${stat(byAvg.length?f2(byAvg[byAvg.length-1].a):'–','lowest avg')}</div>
  ${byAvg[0]?`<p class="small muted" style="margin:6px 0 0">Best: ${byAvg[0].score} ${esc(byAvg[0].round)} on ${byAvg[0].date}. Lowest: ${byAvg[byAvg.length-1].score} ${esc(byAvg[byAvg.length-1].round)} on ${byAvg[byAvg.length-1].date}. ${pbs.length?'':`No earlier PB was beaten in this period${L.filter(x=>x.first).length?` (${L.filter(x=>x.first).length} round${L.filter(x=>x.first).length>1?'s':''} shot for the first time)`:''}; your best here: ${Math.max(...full.map(x=>x.score))} ${esc((full.slice().sort((a,b)=>b.score-a.score)[0]||{}).round||'')}. `}Averages use full rounds with a known arrow count${L.length-known.length?` (${L.length-known.length} shoot${L.length-known.length>1?'s':''} left out: partial, unknown round length${allF?'':', or field rounds, which score 1–6; pick a field round above to see field averages'})`:''}.</p>`:''}`,true);
 // 2 trend per round
 const cnt={};full.forEach(s=>cnt[s.round+'|'+s.bow]=(cnt[s.round+'|'+s.bow]||0)+1);const tk=AF.round!='all'?Object.keys(cnt).filter(k=>k.startsWith(AF.round+'|')).sort((a,b)=>cnt[b]-cnt[a])[0]:Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
 if(tk){const T=L.filter(s=>s.round+'|'+s.bow==tk),fullT=T.filter(s=>!s.part),roll=T.map((s,i)=>{const w=T.slice(0,i+1).filter(x=>!x.part).slice(-3);return s.part||w.length<2?null:mean(w.map(x=>x.score))});
  h+=card('Trend',`${esc(tk.replace('|',' · '))}`,`${line(T.map(s=>({y:s.score,d:s.date.slice(2),pb:s.pb,hollow:s.part,t:`${s.date}: ${s.score}${s.part?' (partial)':''}`})),{y2:roll,label:'Totals over time'})}
  <p class="small muted" style="margin:0">Blue = total, gold dashes = average of your last 3 full rounds, ★ = new PB, hollow = partial. ${fullT.length} full round${fullT.length==1?'':'s'}, best ${Math.max(...fullT.map(s=>s.score),0)}.${AF.round=='all'?' Showing your most-shot round; pick a round above to change it.':''}</p>`)}
 // 3 PB timeline
 const firsts=L.filter(s=>s.first),ups=L.filter(s=>s.pb);
 h+=card('PB progression','',ups.length||firsts.length?`<div>${ups.map(s=>`<div class="list-item row"><span><b style="color:${GOLD}">★ ${s.score}</b> ${esc(s.round)} <span class="small muted">${s.bow}</span></span><span class="small">+${s.score-s.prev} · ${s.date.slice(5)}</span></div>`).reverse().join('')||'<p class="small muted">No PB was beaten in this period.</p>'}</div><p class="small muted" style="margin:6px 0 0">${firsts.length} round${firsts.length==1?'':'s'} shot for the first time in this period (first score sets the mark).</p>`:'<p class="small muted">No full rounds in this period.</p>');
 // 4 consistency
 const grp={};full.forEach(s=>(grp[s.round+'|'+s.bow]=grp[s.round+'|'+s.bow]||[]).push(s.score));const cons=Object.entries(grp).filter(([,v])=>v.length>=2);
 const EA=L.filter(s=>s.ends).flatMap(s=>s.ends.filter(e=>e.arrows.length).map(e=>endSum(e.arrows)/e.arrows.length));
 h+=card('Consistency','',`${cons.length?hbars(cons.map(([k,v])=>[k.split('|')[0]+(new Set(cons.map(c=>c[0].split('|')[0])).size<cons.length?' · '+k.split('|')[1].slice(0,4):''),sd(v),`${v.length} rounds · spread ${Math.max(...v)-Math.min(...v)} (${Math.min(...v)}–${Math.max(...v)})`]),f1):'<p class="small muted">Needs 2+ full rounds of the same round.</p>'}
  <p class="small muted" style="margin:4px 0 0">Bars = how far your totals usually land from your average on each round (shorter = more even).</p>${EA.length>1?`<div class="stats" style="grid-template-columns:1fr 1fr;margin-top:8px">${stat(f2(sd(EA)),'spread of ends, per arrow')}${stat(EA.length,'ends with arrows')}</div><p class="small muted" style="margin:4px 0 0">Spread = how far your ends usually are from your average end, worked out per arrow so 3- and 6-arrow ends compare fairly. Smaller means steadier.</p>`:''}`);
 // arrow-level
 const AL=L.filter(s=>s.ends),skip=L.length-AL.length,note=skip?`<p class="small muted" style="margin:6px 0 0">${skip} total-only shoot${skip>1?'s':''} left out (no end-by-end arrows).</p>`:'';
 if(AL.length){
  // 5 distance
  const dm={};AL.forEach(s=>s.ends.forEach(e=>{const d=distLabel(e.dist,s.round);(dm[d]=dm[d]||[]).push(...e.arrows)}));const ds=Object.keys(dm).sort((a,b)=>parseFloat(b)-parseFloat(a));
  h+=card('By distance','Average arrow at each distance',hbars(ds.map(d=>[d,mean(dm[d].map(val)),`${plN(dm[d].length,'arrow','arrows')}`]),f2)+note);
  // 6 round phase
  const ph=[[],[],[]];AL.filter(s=>s.ends.length>=6).forEach(s=>{const n=s.ends.length,t=Math.floor(n/3);s.ends.forEach((e,i)=>{const k=i<t?0:i>=n-t?2:1;ph[k].push(...e.arrows.map(val))})});
  if(ph[0].length){const m=ph.map(mean),dl=m[2]-m[0];h+=card('Early, middle and late ends','Average per arrow in each third of the round',hbars([['First third',m[0]],['Middle third',m[1]],['Last third',m[2]]],f2)+`<p class="small" style="margin:6px 0 0">Your last third averages <b>${f2(Math.abs(dl))} ${dl<0?'lower':'higher'}</b> per arrow than your first third (${plN(ph[0].length+ph[1].length+ph[2].length,'arrow','arrows')}, rounds of 6+ ends).</p>`+note)}
  // 7 distribution
  const keys=['X','10','9','8','7','6','5','4','3','2','1','M'],A=AL.flatMap(s=>s.ends.flatMap(e=>e.arrows)),c=keys.map(k=>A.filter(a=>a==k).length),sh=keys.map((k,i)=>[k,c[i]]).filter(x=>x[1]);
  const rate=L.filter(s=>s.ends||(s.tens&&s.na)).map(s=>{const a=s.ends?s.ends.flatMap(e=>e.arrows):null;return{y:Math.round((a?a.filter(x=>x=='X'||x=='10').length/a.length:s.tens/s.na)*100),d:s.date.slice(2),t:`${s.date} ${s.round}`}});
  h+=card('Score distribution',`${plN(A.length,'arrow','arrows')}`,bars(sh.map(x=>x[1]),sh.map(x=>x[0]),'#1d4ed8')+`<p class="small muted" style="margin:0">How many times each value was hit.</p>${rate.length>1?`<h3 style="margin:10px 0 2px">10 + X rate per shoot</h3>${line(rate,{label:'10 and X rate',fmt:v=>v+'%',h:110})}<p class="small muted" style="margin:0">Uses arrows where recorded, or the published 10s count for total-only full rounds.</p>`:''}`+note);
 }else h+=card('Arrow-level charts','','<p class="small muted">Distance, round-phase and score-distribution charts need end-by-end arrows. None of the shoots in this filter have them.</p>');
 // 8 comp vs practice
 const cp=['comp','practice'].map(k=>{const s=known.filter(x=>x.kind==k);return[k,s.length,s.length?s.reduce((t,x)=>t+x.pts,0)/s.reduce((t,x)=>t+x.na,0):null]});
 h+=card('Competition vs practice','',`<div class="stats" style="grid-template-columns:1fr 1fr">${cp.map(([k,n,a])=>stat(a?f2(a):'–',`${k=='comp'?'competition':'practice'} avg (${n})`)).join('')}</div><p class="small muted" style="margin:4px 0 0">${cp[1][1]?'Average arrow over full rounds of each kind.':'No completed practice rounds scored on this phone yet.'}</p>`);
 // 9 club
 const cl={};known.filter(s=>s.kind=='comp').forEach(s=>{const k=(s.club||'Unknown').replace(/ (Archery Club|Archers?|Club)? ?Inc$/,'').replace(/ Archery Club$/,'');(cl[k]=cl[k]||[]).push(s)});
 const cr=Object.entries(cl).sort((a,b)=>b[1].length-a[1].length);
 if(cr.length)h+=card('By club','Club listed on each result',hbars(cr.map(([k,v])=>[k,v.reduce((t,s)=>t+s.pts,0)/v.reduce((t,s)=>t+s.na,0),`${v.length} shoot${v.length>1?'s':''}`]),f2)+'<p class="small muted" style="margin:4px 0 0">Average arrow, full rounds with a known length.</p>');
 // 10 arrow plot (23 Oct 2026, Steven): every plotted arrow as a dot at its real place on the right face (3-spot arrows on one spot,
 // field arrows on a gold and black field face), soft shading, group centre and a sight move guide. Plotted arrows only.
 const PS=[...new Set(L.map(s=>s.s).filter(x=>x&&(x.pos||[]).some(e=>(e||[]).some(Boolean))))],pc=window.shotPlotCards&&PS.length?shotPlotCards(PS,{title:'Arrow plot',multi:true}):'';
 h+=pc||card('Arrow plot','','<p class="small muted">Plot arrows on the target when scoring practice to see where they land. Official results don\'t include arrow positions.</p>');
 // 11 notes
 h+=noteInsights();
 return h}
function render(){app.innerHTML=view();window.scrollTo&&0;const b=$('#back');if(b)b.onclick=()=>nav('stats');
 [['fr','range'],['fk','kind'],['fo','round'],['fb','bow']].forEach(([id,k])=>{const e=$('#'+id);if(e)e.onchange=()=>{AF[k]=e.value;const y=scrollY;render();scrollTo(0,y)}});
 document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.v=='stats'))}
window._anShoots=shoots;window.EXTRA_VIEWS=Object.assign(window.EXTRA_VIEWS||{},{analytics:render});
const _st=stats;stats=function(){_st.apply(this,arguments);if(!document.getElementById('goan'))app.insertAdjacentHTML('afterbegin',`<button class="btn full" id="goan" style="margin:10px 0 4px;background:linear-gradient(90deg,#ffc629,#ffdd73)" onclick="nav('analytics')">📊 Analytics · trends, PBs, consistency</button>`)};
})();
