/* Stats → Analysis, Group patterns, and Ghost match. Real data only: this phone's scored rounds plus official results already loaded.
   Describes numbers. Group-pattern "possible causes" are general, factual archery knowledge written in our own words; shown to 16+ only,
   under-16s see "Pattern shared with your coach" and the full pattern goes in the coach data. */
(function(){
const G='#ffc629',B='#5ab0ff',P='#5ab0ff'/* ghost accent: blue (was purple) */,PF=CBC('#39ff14','#ffffff')/* group-centre marker drawn on the target face: bright green, dark outline */,M='#9aa7ba',GR=CBC('#6ee7a0','#5ab0ff'),RD=CBC('#ff4d5e','#ff9f1a');/* colour-blind mode: blue up, orange down, always with a sign or arrow */
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0,f1=x=>(Math.round(x*10)/10).toFixed(1),f2=x=>x.toFixed(2),sg=x=>(x>0?'+':x<0?'−':'±')+Math.abs(Math.round(x*10)/10);
const card=(k,t,b)=>`<div class="card st-card"><span class="kicker" style="color:${G}">${k}</span>${t?`<h3 style="margin:2px 0 8px">${t}</h3>`:''}${b}</div>`;
const stat=(v,l,c)=>`<div class="stat"><b${c?` style="color:${c}"`:''}>${v}</b>${l}</div>`;
const empty=t=>`<p class="small muted" style="margin:0">${t}</p>`;
/* ---------- profile: birth year + handedness ---------- */
const age=()=>S.birthYear?new Date().getFullYear()-S.birthYear:(juniorDiv()?15:null);
const juniorDiv=()=>{try{return findReal(S.profile||'').some(r=>/under\s*(1[0-5]|[0-9])\b|\bU(1[0-5]|[0-9])\b|cub|junior/i.test(r.division||'')&&!/under\s*(1[6-9]|2\d)/i.test(r.division||''))}catch(e){return false}};
const adult=()=>age()!=null?age()>=16:false;
const hand=()=>S.hand=='L'?'L':'R';
window.profileExtraCard=function(){const y=new Date().getFullYear(),ys=[];for(let i=y-5;i>=y-90;i--)ys.push(i);
 return`<div class="card" id="pxcard"><span class="kicker">My details</span><h2>Age and hand</h2><p class="small muted">Used for Group patterns. Under 16s see their pattern, and the possible causes go to their coach in the coach data.</p>
 <div class="row" style="gap:8px"><label style="flex:1">Birth year<select id="pxby"><option value="">Not set</option>${ys.map(v=>`<option ${v==S.birthYear?'selected':''}>${v}</option>`).join('')}</select></label>
 <label style="flex:1">I shoot<select id="pxh"><option value="R" ${hand()=='R'?'selected':''}>Right-handed</option><option value="L" ${hand()=='L'?'selected':''}>Left-handed</option></select></label></div></div>`};
window.bindProfileExtra=function(after){const a=$('#pxby'),h=$('#pxh');if(a)a.onchange=()=>{S.birthYear=a.value?+a.value:null;save();after&&after()};if(h)h.onchange=()=>{S.hand=h.value;save();after&&after()}};
const _me=me;me=function(){_me.apply(this,arguments);const c=$('#coachcard');if(c&&!$('#pxcard')){c.insertAdjacentHTML('beforebegin',profileExtraCard());bindProfileExtra()}};
/* ---------- shared helpers ---------- */
const keysFor=r=>/field|bugs/i.test(r)?['6','5','4','3']:['X','10','9','8','7'];
function faceMM(s){const R=ROUNDS[s.round]||{};const ff=(s.ff||[]).find(Boolean);if(ff&&!s.bugs)return{mm:ff.f*5,known:true,size:ff.f};const F=faceR(R,0)||{};const m=String(F.face||R.face||'').match(/(\d+)cm/);return m&&!/field/i.test(F.face||'')?{mm:+m[1]*5,known:true,size:+m[1]}:{mm:610,known:false,size:122}}
function plotted(s){if(s.bugs)return[];return(s.pos||[]).flat().filter(p=>p&&isFinite(p.x)&&isFinite(p.y))}
function ellipse(p){const c=groupStats(p);let xx=0,yy=0,xy=0;p.forEach(q=>{const dx=q.x-c.cx,dy=q.y-c.cy;xx+=dx*dx;yy+=dy*dy;xy+=dx*dy});const n=Math.max(1,p.length-1);xx/=n;yy/=n;xy/=n;
 const tr=xx+yy,dt=xx*yy-xy*xy,l1=tr/2+Math.sqrt(Math.max(0,tr*tr/4-dt)),l2=tr/2-Math.sqrt(Math.max(0,tr*tr/4-dt)),ang=Math.atan2(l1-xx,xy||1e-9)*180/Math.PI;
 return{...c,a:Math.sqrt(Math.max(l1,0))*2,b:Math.sqrt(Math.max(l2,0))*2,ang:Math.abs(xy)<1e-9?(xx>=yy?0:90):ang,w:Math.sqrt(xx)*4,h:Math.sqrt(yy)*4}}
function dirOf(e){const off=Math.hypot(e.cx,e.cy);if(off<Math.max(0.03,e.r*0.35))return e.r>0.22?'loose':'centre';
 const a=Math.atan2(-e.cy,e.cx)*180/Math.PI,s=Math.round(((a+360)%360)/45)%8;return['right','highright','high','highleft','left','lowleft','low','lowright'][s]}
const DIRNAME={right:'right of centre',highright:'high-right',high:'high',highleft:'high-left',left:'left of centre',lowleft:'low-left',low:'low',lowright:'low-right',centre:'centred and tight',loose:'centred but spread out'};
/* Causes for a right-handed archer, our own wording. Left-handed: mirror the direction, then swap left/right in the text. */
const CZ={
 left:{f:['The bow arm moving or swinging left as the arrow leaves.','Gripping or twisting the bow handle, which turns the bow at the shot.','Leaning the head or upper body away from the string.','Lining the string up differently from shot to shot (the string sitting further left of the sight or riser).'],
  t:['<b>Arrow spine:</b> arrows that are too stiff tend to land left.','<b>Rest / plunger:</b> plunger tension or centre-shot setting moves arrows left or right.','<b>Sight / windage:</b> if the group is tight and steady but left, the sight pin may need moving left (the pin follows the group).']},
 right:{f:['Pulling the drawing hand away from the face at release (plucking).','Collapsing or letting the draw shorten at release instead of finishing through the shot.','Tilting (canting) the bow to one side.','An anchor that sits in a different spot from shot to shot.'],
  t:['<b>Arrow spine:</b> arrows that are too weak tend to land right.','<b>Poundage:</b> a heavier draw weight makes a given arrow act weaker.','<b>Rest / plunger:</b> a plunger that is too soft can let arrows go right.','<b>Sight / windage:</b> a tight, steady group to the right can mean the pin needs moving right.']},
 high:{f:['Lifting the bow arm or the head to watch the arrow before it has gone.','Pushing low on the grip (heeling the bow hand).','Anchoring lower on the face than usual.','Drawing past the normal draw length, or over-expanding.'],
  t:['<b>Nocking point:</b> a nocking point set too low can cause high or erratic arrows.','<b>Tiller:</b> uneven limb balance can shift where the bow sits at full draw.','<b>Sight / elevation:</b> a tight, steady high group can mean the sight needs moving up.']},
 low:{f:['The bow arm dropping or moving before the arrow has gone.','Letting the draw shorten (creeping forward) just before release.','Releasing early, before the aim has settled.','Tiredness: groups that drop later in a round often line up with fatigue.'],
  t:['<b>Poundage:</b> a draw weight that is too heavy to hold well can lead to creeping and a dropping bow arm.','<b>Nocking point:</b> a nocking point set too high can cause low or erratic arrows.','<b>Sight / elevation:</b> a tight, steady low group can mean the sight needs moving down.']},
 centre:{f:['The group is centred and tight. Nothing in the pattern points to a form or timing change.'],t:['Bow and sight look matched to this distance on this round.']},
 loose:{f:['The group is centred but spread out. Shot-to-shot changes such as anchor, grip, timing or aiming time can widen a group without moving its centre.','Tiredness late in a session can spread groups.'],
  t:['<b>Arrows:</b> arrows that are not matched (spine, weight, straightness) or have loose points, nocks or fletching spread groups.','<b>Overall tune:</b> a bow that is out of tune across several settings tends to scatter arrows in all directions.']}};
const mir=d=>d.replace('left','#').replace('right','left').replace('#','right');
const swapLR=t=>t.replace(/left|right/g,m=>m=='left'?'right':'left');
function causes(dir){const h=hand(),d=h=='L'?mir(dir):dir;const parts=d=='centre'||d=='loose'?[d]:[...['high','low'].filter(v=>d.includes(v)),...['left','right'].filter(v=>d.includes(v))];
 const f=[],t=[];parts.forEach(p=>{f.push(...CZ[p].f);t.push(...CZ[p].t)});const fx=h=='L'?swapLR:x=>x;return{f:f.map(fx),t:t.map(fx)}}
window.STCauses=causes;
/* ---------- Group patterns ---------- */
function patternData(){const ses=done().filter(s=>plotted(s).length>=6);if(!ses.length)return null;
 const rows=ses.map(s=>{const p=plotted(s),e=ellipse(p),fm=faceMM(s);return{s,p,e,fm,dir:dirOf(e),off:Math.hypot(e.cx,e.cy)*fm.mm}});return rows}
function patternSVG(r){const e=r.e,R=ROUNDS[r.s.round]||{},fr=faceR(R,0);
 const pts=r.p.map(q=>({x:q.x,y:q.y}));const ex=`<ellipse cx="${e.cx}" cy="${e.cy}" rx="${Math.max(e.a,0.03)}" ry="${Math.max(e.b,0.03)}" transform="rotate(${-e.ang} ${e.cx} ${e.cy})" fill="${G}33" stroke="${G}" stroke-width="0.012" stroke-dasharray="0.03 0.02"/><path d="M0 0L${e.cx} ${e.cy}" stroke="#0b0f17" stroke-width="0.026"/><path d="M0 0L${e.cx} ${e.cy}" stroke="${PF}" stroke-width="0.012"/><circle cx="${e.cx}" cy="${e.cy}" r="0.03" fill="${PF}" stroke="#0b0f17" stroke-width="0.012"/>`;
 return faceSVG(pts,'gpface','-1.05 -1.05 2.1 2.1',fr,ex).replace('style="touch-action:none;','style="max-width:300px;margin:auto;')}
function patternCard(opt={}){const rows=patternData();
 if(!rows)return card('Group pattern','Where your group sits',empty('Plot at least 6 arrows on the target in a practice round to see your group pattern. Official results don\'t include arrow positions.'));
 const L=rows[rows.length-1],e=L.e,u=L.fm.known?'mm':'mm (122cm face assumed)',mm=v=>Math.round(v*L.fm.mm);
 const lr=e.cx<-0.005?'Left':e.cx>0.005?'Right':'Level',ud=e.cy>0.005?'Low':e.cy<-0.005?'High':'Level';
 const tr=rows.slice(-7),shape=e.w>e.h*1.25?'Wider than tall':e.h>e.w*1.25?'Taller than wide':'Round';
 let h=`<div class="card st-card"><span class="kicker" style="color:${G}">Group pattern</span><h3 style="margin:2px 0 8px">Group centre ${L.dir=='centre'||L.dir=='loose'?'is '+DIRNAME[L.dir]:`${Math.round(L.off)}mm ${DIRNAME[L.dir]}`}</h3>
 ${patternSVG(L)}<p class="small muted" style="margin:6px 0">${esc(L.s.date)} · ${esc(L.s.round)} · ${L.p.length} plotted arrows</p>
 <div class="gp-pills"><span>${lr} ${mm(Math.abs(e.cx))}mm</span><span>${ud} ${mm(Math.abs(e.cy))}mm</span><span>Spread ${mm(e.w)} × ${mm(e.h)}mm</span></div>
 <div class="list-item row"><span>Group shape</span><b>${shape}</b></div><div class="list-item row"><span>Handedness</span><b>${hand()=='L'?'Left':'Right'}-handed <a href="#" id="gpch" style="color:${B}">Change</a></b></div>
 <p class="small muted" style="margin:6px 0 0">Distances in ${u}, from the middle of the face to the centre of the group.</p></div>`;
 h+=card('Trend over rounds','',tr.length>1?mini(tr.map(r=>Math.round(r.off)),tr.map(r=>r.s.date.slice(5)),{fmt:v=>v+'mm'})+`<p class="small muted" style="margin:0">Distance of the group centre from the middle, last ${tr.length} plotted rounds. ${tr.map(r=>DIRNAME[r.dir]).slice(-3).join(' → ')}.</p>`:empty('Needs 2 or more plotted rounds.'));
 const show=opt.coach||adult();
 if(!show)h+=card('Possible causes','',`<p style="margin:0"><b>Pattern shared with your coach</b></p><p class="small muted" style="margin:4px 0 0">${age()==null?'Set your birth year in Me. ':''}Archers under 16 see where their group sits. The possible causes go to your coach when you send your coach data.</p>`);
 else{const c=causes(L.dir),same=rows.filter(r=>r.dir==L.dir&&(S.notes||{})[noteKey(r.s)]).slice(-3).reverse();
  h+=`<div class="card st-card"><span class="kicker" style="color:${G}">Possible causes · ${esc(DIRNAME[L.dir])}</span><p class="small muted" style="margin:2px 0 8px">For a ${hand()=='L'?'left':'right'}-handed archer. General facts linked to this pattern, not instructions.${opt.coach?'':' Hidden for archers under 16.'}</p>
  <h3 style="margin:6px 0 4px;font-size:16px">Form and timing</h3><ul class="gp-ul">${c.f.map(x=>`<li>${x}</li>`).join('')}</ul><h3 style="margin:10px 0 4px;font-size:16px">Bow tuning</h3><ul class="gp-ul">${c.t.map(x=>`<li>${x}</li>`).join('')}</ul>
  <div class="gp-notes"><b>Your notes that match</b>${same.length?same.map(r=>`<div class="small"><b style="color:${G}">${esc(r.s.date)}:</b> "${esc((S.notes||{})[noteKey(r.s)])}"</div>`).join(''):'<div class="small muted">No notes on rounds with this pattern yet. Add a note after a round to see it here.</div>'}</div>
  <p class="small" style="margin:10px 0 0;color:${B}">Check with your coach before changing form or gear.</p></div>`}
 return h}
window.patternCard=patternCard;
function mini(vals,labs,o={}){if(!vals.length)return'';const W=340,H=110,Pd=30,all=vals.concat(o.target!=null?[o.target]:[]),mn=Math.min(...all),mx=Math.max(...all),sp=mx-mn||1,X=i=>Pd+(vals.length<2?(W-2*Pd)/2:i*(W-2*Pd)/(vals.length-1)),Y=v=>H-22-(v-mn)/sp*(H-40),fm=o.fmt||(v=>v);
 let g=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${o.label||'trend'}"><text x="0" y="${Y(mx)+3}" font-size="9" fill="${M}">${fm(mx)}</text><text x="0" y="${Y(mn)+3}" font-size="9" fill="${M}">${fm(mn)}</text>`;
 if(o.target!=null)g+=`<line x1="${Pd}" x2="${W-6}" y1="${Y(o.target)}" y2="${Y(o.target)}" stroke="${GR}" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W-6}" y="${Y(o.target)-4}" font-size="9" text-anchor="end" fill="${GR}">target ${o.target}</text>`;
 if(vals.length>1)g+=`<polyline fill="none" stroke="${G}" stroke-width="2.4" points="${vals.map((v,i)=>X(i)+','+Y(v)).join(' ')}"/>`;
 vals.forEach((v,i)=>g+=`<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="${G}"/>`);
 return g+`<text x="${Pd}" y="${H-6}" font-size="9" fill="${M}">${labs[0]||''}</text><text x="${W-Pd}" y="${H-6}" font-size="9" text-anchor="end" fill="${M}">${labs[labs.length-1]||''}</text></svg>`}
/* ---------- Analysis ---------- */
function analysis(){const all=(window._anShoots?_anShoots():[]).filter(s=>s.ends&&s.ends.length||s.score);
 if(!all.length)return card('Analysis','',empty('Score a round or link your official results to see your analysis.'));
 const cnt={};all.forEach(s=>cnt[s.round]=(cnt[s.round]||0)+1);const rounds=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]),rd=rounds.includes(S.anRound)?S.anRound:rounds[0];
 const L=all.filter(s=>s.round==rd),F=L.filter(s=>!s.part),E=L.filter(s=>s.ends&&s.ends.length),last=E[E.length-1],prev=E[E.length-2];S.targets=S.targets||{};const tg=S.targets[rd];
 let h=`<div class="card st-card st-hero"><span class="kicker" style="color:${G}">Analysis</span><h2 style="margin:0 0 6px">Your round, broken down</h2><label for="anr" class="small muted">Round</label><select id="anr">${rounds.map(r=>`<option ${r==rd?'selected':''}>${esc(r)} (${cnt[r]})</option>`).join('')}</select>
 <p class="small muted" style="margin:6px 0 0">${L.length} shoot${L.length==1?'':'s'} of this round (competition and practice, ghost matches included). Numbers only, no advice.</p></div>`;
 // 1 half split
 if(last){const half=s=>{const n=s.ends.length,k=Math.ceil(n/2);return[s.ends.slice(0,k),s.ends.slice(k)].map(x=>x.reduce((t,e)=>t+endSum(e.arrows),0))},a=half(last),b=prev?half(prev):null,tot=a[0]+a[1],pt=b?b[0]+b[1]:null;
  const keys=keysFor(rd),rc=s=>{const n=s.ends.length,k=Math.ceil(n/2);return[s.ends.slice(0,k),s.ends.slice(k)].map(x=>keys.map(q=>x.flatMap(e=>e.arrows).filter(v=>v==q).length))},R=rc(last);
  h+=card('Half split',`${esc(last.date)} · ${tot}${pt!=null?` <span style="color:${tot>=pt?GR:RD}">${sg(tot-pt)} vs last</span>`:''}`,`<div class="stats" style="grid-template-columns:1fr 1fr">${stat(a[0],'1st half'+(b?` <span class="small" style="color:${a[0]>=b[0]?GR:RD}">${sg(a[0]-b[0])}</span>`:''))}${stat(a[1],'2nd half'+(b?` <span class="small" style="color:${a[1]>=b[1]?GR:RD}">${sg(a[1]-b[1])}</span>`:''))}</div>
  <table class="st-tab"><tr><th></th>${keys.map(k=>`<th>${k}</th>`).join('')}</tr><tr><td>1st half</td>${R[0].map(v=>`<td>${v}</td>`).join('')}</tr><tr><td>2nd half</td>${R[1].map(v=>`<td>${v}</td>`).join('')}</tr></table>
  <p class="small muted" style="margin:6px 0 0">${b?`Change is against your previous shoot on ${esc(prev.date)} (${pt}).`:'Shoot this round again to see the change from last time.'}</p>`)}
 else h+=card('Half split','',empty('Needs a shoot with end-by-end scores.'));
 // 2 averages
 const sc=F.map(s=>s.score),six=new Date(Date.now()-182*864e5).toLocaleDateString('en-CA'),m6=F.filter(s=>s.date>=six).map(s=>s.score),arr=F.filter(s=>s.na);
 const apa=arr.reduce((t,s)=>t+s.pts,0)/(arr.reduce((t,s)=>t+s.na,0)||1),lpa=last&&last.na?last.pts/last.na:null;
 h+=card('Averages','',sc.length?`<div class="stats" style="grid-template-columns:1fr 1fr 1fr">${stat(sc.length>=3?f1(mean(sc.slice(-3))):'–','last 3')}${stat(sc.length>=5?f1(mean(sc.slice(-5))):'–','last 5')}${stat(m6.length?f1(mean(m6)):'–','6 months')}${stat(arr.length?f2(apa):'–','avg arrow')}${stat(lpa!=null?f2(lpa):'–','last round')}${stat(Math.max(...sc),'best')}</div>
  ${mini(sc.slice(-10),F.slice(-10).map(s=>s.date.slice(5)),{target:tg,label:'Scores with target line'})}<p class="small muted" style="margin:0">Gold = full-round totals (last 10)${tg?', '+(CB()?'blue':'green')+' dashes = your target':''}. ${sc.length<5?'Rolling averages fill in after 3 and 5 full rounds.':''}</p>`:empty('Needs a full round of this round.'));
 // 3 per-end averages
 const n=E.length?Math.max(...E.map(s=>s.ends.length)):0,ea=[...Array(n)].map((_,i)=>{const v=E.filter(s=>s.ends[i]).map(s=>endSum(s.ends[i].arrows));return{m:mean(v),best:v.length?Math.max(...v):0,n:v.length}});
 if(E.length>=2&&n){const wk=ea.reduce((w,x,i)=>x.m<ea[w].m?i:w,0),mx=Math.max(...ea.map(x=>x.m),1),mnv=Math.min(...ea.map(x=>x.m)),pot=Math.round(ea.reduce((t,x)=>t+x.best,0));
  h+=card('End by end',`Average of each end across ${plN(E.length,'shoot','shoots')}`,`<div class="st-bars">${ea.map((x,i)=>`<div class="st-bar${i==wk?' wk':''}" title="End ${i+1}: ${f1(x.m)}"><i style="height:${Math.max(6,(x.m-mnv*0.9)/(mx-mnv*0.9||1)*100)}%"></i><span>${i+1}</span></div>`).join('')}</div>
  <p class="small" style="margin:6px 0 0">Lowest end on average: <b style="color:${RD}">end ${wk+1}</b> (${f1(ea[wk].m)}). Highest: end ${ea.reduce((w,x,i)=>x.m>ea[w].m?i:w,0)+1} (${f1(Math.max(...ea.map(x=>x.m)))}).</p>
  <div class="stats" style="grid-template-columns:1fr 1fr;margin-top:8px">${stat(pot,'potential score',G)}${stat(Math.round(ea.reduce((t,x)=>t+x.m,0)),'sum of end averages')}</div><p class="small muted" style="margin:4px 0 0">Potential score adds your best score at each end number across these shoots.</p>`)}
 else h+=card('End by end','',empty('Needs 2 or more shoots of this round with end-by-end scores.'));
 // 4 target + ways to reach it
 const R0=ROUNDS[rd],nE=n||(R0&&R0.ends)||0,mxs=(R0&&R0.max)||null;
 let tb=`<div class="row" style="gap:8px;align-items:flex-end"><label style="flex:1">My target for this round<input id="antg" type="number" inputmode="numeric" min="1" ${mxs?`max="${mxs}"`:''} value="${tg||''}" placeholder="e.g. ${sc.length?Math.max(...sc)+5:600}"></label><button class="btn ghost" id="antgs" style="min-height:44px">Set</button></div>`;
 if(tg&&nE){const lo=Math.floor(tg/nE),k=tg-lo*nE,base=sc.length?mean(sc.slice(-3)):null,gap=base!=null?tg-base:null;
  tb+=`<div class="stats" style="grid-template-columns:1fr 1fr;margin-top:8px">${stat(f1(tg/nE),'avg per end needed')}${stat(gap!=null?sg(gap):'–','vs your last-3 avg')}</div><h3 style="margin:10px 0 4px;font-size:16px">Ways to reach ${tg}</h3><ul class="gp-ul">
  <li>${k?`${k} end${k>1?'s':''} of ${lo+1} and ${nE-k} of ${lo}`:`${nE} ends of ${lo}`} (${plN(nE,'end','ends')}).</li>${E.length>=2?`<li>Your end averages plus ${f1(Math.max(0,(tg-ea.reduce((t,x)=>t+x.m,0))/nE))} a end.</li>`:''}${E.length>=2&&n?`<li>Keep your average everywhere and lift end ${ea.reduce((w,x,i)=>x.m<ea[w].m?i:w,0)+1} by ${Math.max(0,Math.round(tg-ea.reduce((t,x)=>t+x.m,0)))}.</li>`:''}</ul>`}
 h+=card('Target line','You set it',tb);
 // 5 group size trend
 const gs=done().filter(s=>s.round==rd&&plotted(s).length>=3).map(s=>({d:s.date,v:Math.round(groupStats(plotted(s)).r*faceMM(s).mm)})).slice(-10);
 h+=card('Group size','Average distance of arrows from the group centre',gs.length>1?mini(gs.map(x=>x.v),gs.map(x=>x.d.slice(5)),{fmt:v=>v+'mm',label:'Group size trend'})+`<p class="small muted" style="margin:0">Lower = tighter group. ${gs.length} plotted rounds of ${esc(rd)}.</p>`:empty('Plot arrows in 2 or more practice rounds of this round to see your group size trend.'));
 return h}
function bindAnalysis(){const r=$('#anr');if(r)r.onchange=()=>{S.anRound=r.value.replace(/ \(\d+\)$/,'');save();rerender()};
 const b=$('#antgs');if(b)b.onclick=()=>{const v=parseInt($('#antg').value);const rd=$('#anr').value.replace(/ \(\d+\)$/,'');S.targets=S.targets||{};if(v>0)S.targets[rd]=v;else delete S.targets[rd];save();rerender()};
 const c=$('#gpch');if(c)c.onclick=ev=>{ev.preventDefault();S.hand=hand()=='L'?'R':'L';save();rerender()}}
function rerender(){const y=scrollY;stats();scrollTo(0,y)}
const _st=stats;stats=function(){_st.apply(this,arguments);if($('#ansec'))return;const go=$('#goan'),html=`<div id="ansec"><h2 class="sec" style="margin:18px 4px 6px;border-bottom:3px solid ${G};padding-bottom:4px">Analysis</h2>${analysis()}<h2 class="sec" style="margin:22px 4px 6px;border-bottom:3px solid ${G};padding-bottom:4px">Group patterns</h2>${patternCard()}</div>`;
 if(go)go.insertAdjacentHTML('afterend',html);else app.insertAdjacentHTML('afterbegin',html);bindAnalysis()};
/* coach data: full pattern + causes */
const _ct=coachText;coachText=function(){let t=_ct.apply(this,arguments);const rows=patternData();if(!rows)return t;const L=rows[rows.length-1],c=causes(L.dir),strip=x=>x.replace(/<[^>]+>/g,'');
 const add=['','GROUP PATTERN (latest plotted round)',`- ${L.s.date} ${L.s.round}: group centre ${L.dir=='centre'||L.dir=='loose'?DIRNAME[L.dir]:Math.round(L.off)+'mm '+DIRNAME[L.dir]}, ${plN(L.p.length,'arrow','arrows')}, ${hand()=='L'?'left':'right'}-handed${age()!=null&&age()<16?' (under 16: causes shown to coach only)':''}`,'  Possible form and timing causes:',...c.f.map(x=>'  • '+strip(x)),'  Possible tuning causes:',...c.t.map(x=>'  • '+strip(x))];
 return t.replace(/\n\nMade with ScoreTool/,'\n'+add.join('\n')+'\n\nMade with ScoreTool')};
const _sd=shareData;shareData=function(){const d=_sd.apply(this,arguments);const rows=patternData();if(rows){const L=rows[rows.length-1];d.gp={dir:L.dir,off:Math.round(L.off),dt:L.s.date,rd:L.s.round,n:L.p.length,h:hand(),tr:rows.slice(-7).map(r=>Math.round(r.off))}}return d};
const _rs=renderShare;renderShare=function(){_rs.apply(this,arguments);let D;try{D=JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(location.hash.slice(7))))))}catch(e){return}if(!D.gp)return;const g=D.gp,sv=S.hand;S.hand=g.h;const c=causes(g.dir);S.hand=sv;
 const a=app.querySelector('a.btn.full');const html=`<div class="card st-card"><span class="kicker" style="color:${G}">Group pattern · coach view</span><h3>Group centre ${g.dir=='centre'||g.dir=='loose'?DIRNAME[g.dir]:g.off+'mm '+DIRNAME[g.dir]}</h3><p class="small muted">${esc(g.dt)} · ${esc(g.rd)} · ${plN(g.n,'arrow','arrows')} · ${g.h=='L'?'left':'right'}-handed</p>${g.tr.length>1?mini(g.tr,['',''],{fmt:v=>v+'mm'}):''}
 <h3 style="margin:8px 0 4px;font-size:16px">Possible form and timing causes</h3><ul class="gp-ul">${c.f.map(x=>`<li>${x}</li>`).join('')}</ul><h3 style="margin:8px 0 4px;font-size:16px">Possible tuning causes</h3><ul class="gp-ul">${c.t.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
 if(a)a.insertAdjacentHTML('beforebegin',html);else app.insertAdjacentHTML('beforeend',html)};
/* ---------- Ghost match ---------- */
const GM={last:'Last round',best:'My best',avg:'My average',off:'Best official',top:'Top ranked'};
/* Top-ranked ghosts: real end-by-end scoresheets (Archer's Diary) of archers on the official AA Open compound top-10 lists, best score on this round
   since the rankings window. An archer with only a published total is a 'total only' ghost compared at the end; totals are never split into ends. */
let GT=null,GTl=false;const isMeP=()=>{const p=String(S.profile||'').toLowerCase();return p.includes('stride')&&p.includes('nath')};
const fmtD=d=>{if(!d)return'';const[y,m,dd]=d.split('-');return+dd+' '+'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[m-1]+' '+y.slice(2)};
/* only archers of my own gender and age class, the same as the rankings; ranks recounted inside that list (equal scores share) */
const myGC=()=>{const d=(findReal(S.profile||'').filter(x=>x.division).slice(-1)[0]||{}).division||'';return{g:(d.match(/\b(Male|Female)\b/)||[])[1]||null,c:(d.match(/Open|50\+|60\+|70\+|Under \d+/)||['Open'])[0]}};window.ghostGC=myGC;
const topList=r=>{if(!(GT&&isMeP()&&GT.rounds[r]))return[];const m=myGC(),L=GT.rounds[r].list.filter(x=>(!m.g||!x.g||x.g==m.g)&&(!x.cls||x.cls==m.c));return L.map(x=>{const rank=1+L.filter(y=>y.s>x.s).length;return{...x,rank,eq:L.filter(y=>y.s==x.s).length>1}})};window.ghostTopList=topList;
function loadTop(){if(GT||GTl||!isMeP())return;GTl=true;fetch('data/ghost_top.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j)return;GT=j;window.__GT=j;if(typeof cur!='undefined'&&!cur){const w=$('#ghwrap');if(w){w.remove();ghostPick()}}}).catch(()=>{})}
function topGhost(round){const L=topList(round);if(!L.length)return null;const x=L[window._ghTop]||L[0],label=`Ghost: ${x.n} ${x.s} (${fmtD(x.dt)})`;
 return x.ends?{mode:'top',src:'top',ends:x.ends.slice(),ar:x.ar?x.ar.map(a=>a.slice()):null,pos:null,date:fmtD(x.dt),label,who:x.n,total:x.s}:{mode:'top',src:'top',totalOnly:true,total:x.s,ends:[],pos:null,date:fmtD(x.dt),label:label+' · total only',who:x.n}}
window.__topGhost=topGhost;
function ghostFor(round,mode,excl){if(mode=='top')return topGhost(round);if(mode=='off')return window.offGhost?window.offGhost(round):null;const R=ROUNDS[round];const ss=done().filter(s=>s.round==round&&s!==excl&&!s.finished&&s.ends.length);if(!ss.length||!R)return null;
 if(mode=='avg'){const n=R.ends,e=[...Array(n)].map((_,i)=>{const v=ss.filter(s=>s.ends[i]).map(s=>endSum(s.ends[i]));return v.length?Math.round(mean(v)):0});return{mode,src:'avg',n:ss.length,ends:e,pos:null,date:''}}
 const s=mode=='best'?ss.reduce((a,b)=>total(b)>total(a)?b:a):ss[ss.length-1];return{mode,src:s.id,ends:s.ends.map(endSum),pos:(s.pos||[]).map(e=>(e||[]).filter(Boolean)),date:s.date,ar:s.ends.map(e=>e.slice())}}
function gRes(s){const g=s.ghost;if(!g)return null;if(g.totalOnly){const fin=!!(s.finished||isDone(s)),me=s.ends.reduce((t,e)=>t+endSum(e),0),gh=fin?g.total:0;return{n:0,me,gh,w:0,l:0,gap:fin?me-gh:0,res:!fin?'draw':me>gh?'win':me<gh?'loss':'draw',totalOnly:true,fin}}const R=ROUNDS[s.round]||{},full=s.ends.filter(e=>e.length==R.ape).length,n=Math.min(full,g.ends.length,s.finished||isDone(s)?99:(g.rev||0));
 let me=0,gh=0,w=0,l=0;for(let i=0;i<n;i++){const a=endSum(s.ends[i]),b=g.ends[i];me+=a;gh+=b;if(a>b)w++;else if(b>a)l++}return{n,me,gh,w,l,gap:me-gh,res:me>gh?'win':me<gh?'loss':'draw'}}
function gStreak(){let k=0;const L=done().filter(s=>s.ghost).sort((a,b)=>(a.date+a.id)<(b.date+b.id)?-1:1);for(const s of L){const r=gRes(s);if(!r||!r.n)continue;if(r.res=='win')k++;else if(r.res=='loss')k=0}return k}
window.ghostResult=gRes;
function ghostPick(){loadTop();const rd=$('#rd');if(!rd||$('#ghwrap'))return;const r=rd.value,TL=r=='__new'?[]:topList(r);if(!TL[window._ghTop])window._ghTop=0;const av=r=='__new'?[]:Object.keys(GM).filter(k=>ghostFor(r,k)),ok=av.length>0;
 if(ok&&!av.includes(window._ghM))window._ghM=av[0];const og=ok&&av.includes('off')?ghostFor(r,'off'):null;
 rd.insertAdjacentHTML('afterend',`<div id="ghwrap" class="gh-pick"><label style="display:flex;gap:8px;align-items:center;margin:10px 0 0"><input type="checkbox" id="ghon" style="width:auto" ${ok?'':'disabled'} ${ok&&window._ghOn?'checked':''}> <b>👻 Ghost match</b> <span class="small muted">shoot against a past score, end by end</span></label>
 ${ok?`<div id="ghopts" ${window._ghOn?'':'hidden'}><div class="gh-seg">${av.map(k=>`<button type="button" data-gm="${k}" class="${window._ghM==k?'on':''}">${GM[k]}</button>`).join('')}</div>${TL.length?`<div id="ghtopw" ${window._ghM=='top'?'':'hidden'} style="margin-top:6px"><label class="small" for="ghtop">Top-ranked archer on ${esc(r)}</label><select id="ghtop">${TL.map((x,i)=>`<option value="${i}" ${i==window._ghTop?'selected':''}>${x.eq?'=':''}#${x.rank} ${esc(x.n)} · ${esc(x.c)} · ${x.s} (${fmtD(x.dt)})${x.ends?'':' · total only'}</option>`).join('')}</select><p class="small muted" style="margin:2px 0 0">Their real scoresheet, end by end, from Archer's Diary.</p></div>`:''}<p class="small muted" style="margin:4px 0 0">Shoot against your own past ${esc(r)}, or a top-ranked archer. The ghost's end shows after you press Next.${og?` Best official: ${og.ends.reduce((a,b)=>a+b,0)} on ${esc(og.date)} (Archer's Diary).`:''}</p></div>`:'<p class="small muted" style="margin:2px 0 0">Score this round once to unlock a ghost match against yourself.</p>'}</div>`);
 rd.addEventListener('change',()=>{window._ghTop=0;const w=$('#ghwrap');if(w)w.remove();ghostPick()});
 const on=$('#ghon');if(on)on.onchange=()=>{window._ghOn=on.checked;$('#ghopts').hidden=!on.checked};
 app.querySelectorAll('[data-gm]').forEach(b=>b.onclick=()=>{window._ghM=b.dataset.gm;app.querySelectorAll('[data-gm]').forEach(x=>x.classList.toggle('on',x==b));const tw=$('#ghtopw');if(tw)tw.hidden=window._ghM!='top'});const gt=$('#ghtop');if(gt)gt.onchange=()=>{window._ghTop=+gt.value};
 const st=$('#st');if(st)st.addEventListener('click',()=>{window._ghPend=$('#ghon')&&$('#ghon').checked?(window._ghM||'last'):null},true)}
function ghostBar(){const g=cur.ghost,r=gRes(cur),R=ROUNDS[cur.round],rv=Math.min(g.rev||0,g.ends.length),ei=rv-1;
 let face='';if(g.pos&&ei>=0&&g.pos[ei]&&g.pos[ei].length){face=faceSVG(g.pos[ei],'ghface','-1.05 -1.05 2.1 2.1',faceR(R,ei)).replace('style="touch-action:none;','style="')}
 return`<div class="gh-bar" id="ghbar"><div class="gh-sc"><span>You</span><b style="color:${G}">${r.me}</b></div><div class="gh-mid"><b style="color:${r.gap>0?GR:r.gap<0?RD:'#fff'}">${r.gap>0?'+':''}${r.gap}</b><span>${r.totalOnly?(r.fin?'totals compared':'total only · compared at the end'):`${r.n?`after ${r.n} end${r.n>1?'s':''}`:'ghost waiting'} · won ${r.w}–${r.l}`}</span></div><div class="gh-sc"><span>${esc(g.label?g.who||'Ghost':'Ghost · '+GM[g.mode])}</span><b style="color:${P}">${r.gh}</b></div>
 ${rv?`<div class="gh-last">${face?`<div class="gh-face">${face}</div>`:''}<span>Ghost end ${rv}: <b>${g.ends[ei]}</b>${g.ar&&g.ar[ei]?` <span class="small muted">(${g.ar[ei].join(' ')})</span>`:''}</span></div>`:''}</div>`}
function ghostSheet(){const g=cur.ghost,r=gRes(cur),R=ROUNDS[cur.round],fin=isDone(cur)||cur.finished,n=r.n;
 const row=`<table class="st-tab gh-tab"><tr><th>End</th>${g.ends.slice(0,Math.max(n,Math.min(g.ends.length,(g.rev||0)))).map((_,i)=>`<th>${i+1}</th>`).join('')||'<th>–</th>'}</tr><tr><td>You</td>${[...Array(n)].map((_,i)=>{const a=endSum(cur.ends[i]),b=g.ends[i];return`<td style="color:${a>b?GR:a<b?RD:'#fff'}">${a}${CB()&&a!=b?`<span class="cbar">${a>b?'▲':'▼'}</span>`:''}</td>`}).join('')||'<td>–</td>'}</tr><tr><td>Ghost</td>${g.ends.slice(0,n).map(v=>`<td>${v}</td>`).join('')||'<td>?</td>'}</tr></table>`;
 if(!fin)return`<div class="gh-res"><span class="kicker" style="color:${P}">👻 ${esc(g.label||'Ghost match · '+GM[g.mode])}</span>${ghostBar()}${n?row:''}</div>`;
 const k=gStreak(),T={win:['You beat your ghost!',GR],loss:['Ghost wins this time',RD],draw:['Dead heat',G]}[r.res];
 return`<div class="gh-res gh-fin"><span class="kicker" style="color:${P}">👻 ${esc(g.label||'Ghost match · '+GM[g.mode]+(g.date?' · '+g.date:''))}</span><h2 style="color:${T[1]};margin:4px 0">${T[0]}</h2>
 <div class="stats" style="grid-template-columns:1fr 1fr 1fr">${stat(r.me,'you',G)}${stat(r.gh,'ghost',P)}${stat((r.gap>0?'+':'')+r.gap,'gap')}${stat(r.w+'–'+r.l,'ends won')}${stat(k,'win streak 🔥')}${stat(r.n,'ends compared')}</div>
 ${g.totalOnly?'<p class="small muted">This archer only has a published total for this score, so the totals were compared at the end.</p>':''}${cur.finished&&r.n<g.ends.length?`<p class="small muted">Finished early: compared the ${r.n} full end${r.n==1?'':'s'} you shot.</p>`:''}${row}<p class="small muted" style="margin:4px 0 0">Counts toward your PBs and stats like a normal round. Draws keep your streak.</p></div>`}
const _sc=score;score=function(){
 if(cur&&window._ghPend!==undefined){const m=window._ghPend;window._ghPend=undefined;if(m&&!arrowsIn(cur)){const g=ghostFor(cur.round,m,cur);if(g){g.rev=0;cur.ghost=g;save()}window._bsGhost=null}}
 _sc.apply(this,arguments);
 if(!cur){ghostPick();return}
 if(!cur.ghost)return;const g=cur.ghost,R=ROUNDS[cur.round];
 if(cur.finished||isDone(cur))g.rev=g.ends.length;
 const nx=$('#enext');if(nx)nx.addEventListener('click',()=>{const full=cur.ends.filter(e=>e.length==R.ape).length;g.rev=Math.max(g.rev||0,full);save()},true);
 const fn=$('#finnow');if(fn)fn.addEventListener('click',()=>{},true);
 const chips=app.querySelector('.ad-chips');if(chips&&!$('#ghbar')){chips.insertAdjacentHTML('afterend',ghostBar());const fw=$('#fwrap'),bh=$('#ghbar').offsetHeight;if(fw)fw.style.height=Math.max(160,fw.offsetHeight-bh)+'px'}
 const sh=app.querySelector('.ad-sheet');if(!chips&&sh&&!app.querySelector('.gh-res'))sh.insertAdjacentHTML('afterend',ghostSheet())};
})();
