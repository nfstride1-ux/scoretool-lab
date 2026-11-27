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
function faceMM(s){const q=window.shotPts&&plotted(s).find(p=>p.mm);if(q)return{mm:q.mm,known:true,size:q.mm/5};const R=ROUNDS[s.round]||{};const ff=(s.ff||[]).find(Boolean);if(ff&&!s.bugs)return{mm:ff.f*5,known:true,size:ff.f};const F=faceR(R,0)||{};const m=String(F.face||R.face||'').match(/(\d+)cm/);return m&&!/field/i.test(F.face||'')?{mm:+m[1]*5,known:true,size:+m[1]}:{mm:610,known:false,size:122}}
/* plotted arrows mapped onto ONE face (23 Oct 2026): 3-spot arrows (Vegas, WA 18 / Aus Indoor triple) become offsets from the spot each
   arrow was shot at, field arrows stay on their field face, multi-face rounds are scaled to the first face's mm. Stored data is untouched;
   the mapping is shotview.js shotPts(), shared with the arrow plot and the end-of-shoot view. Bugs Eyes stays out of group maths. */
function plotted(s){if(window.shotPts){const P=shotPts(s),L=(P.target.length>=P.field.length?P.target:P.field).filter(p=>p.k!='bugs'),ref=(L.find(p=>p.mm)||{}).mm;
  return L.map(p=>ref&&p.mm&&p.mm!=ref?{...p,x:p.x*p.mm/ref,y:p.y*p.mm/ref}:p)}
 if(s.bugs)return[];return(s.pos||[]).flat().filter(p=>p&&isFinite(p.x)&&isFinite(p.y))}
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
 const k=(r.p[0]||{}).k,F1=k=='spot'?{...fr,face:'40cm 3-spot',tri:false,vert:false}:k=='six'?fr:{...fr,col:false},hw=k=='spot'?0.56:k=='six'?0.66:1.05;
 return faceSVG(pts,'gpface',`${-hw} ${-hw} ${2*hw} ${2*hw}`,F1,ex).replace('style="touch-action:none;','style="max-width:300px;margin:auto;')}
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
/* End by end bars (SVG). The lowest end is red/orange AND marked with a triangle and 'low' text, so colour isn't the only cue.
   ref (optional) = dashed blue line: the round average at each end (or one flat average). */
const fmtL=d=>{if(!d)return'';const[y,m,dd]=String(d).split('-');return+dd+' '+'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[m-1]+' '+y};
const TB=()=>typeof TESTER!='undefined'&&TESTER&&TESTER.bow||'';
const lowI=v=>v.reduce((w,x,i)=>x<v[w]?i:w,0),highI=v=>v.reduce((w,x,i)=>x>v[w]?i:w,0);
function endBars(v,ref,o={}){if(!v.length)return'';const W=340,H=132,top=18,bot=16,ph=H-top-bot,all=v.concat(ref||[]),mx=Math.max(...all,1),mn=Math.min(...all),lo=Math.max(0,mn-(mx-mn)*0.25-1),Y=x=>top+ph-(x-lo)/(mx-lo||1)*ph,bw=W/v.length,wk=lowI(v),lab=v.length>18?3:v.length>12?2:1;
 let g=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="End by end scores${ref?' with average line':''}"><defs><linearGradient id="ebg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#1d4ed8"/><stop offset="1" stop-color="${G}"/></linearGradient></defs>`;
 v.forEach((x,i)=>{const X=i*bw+bw*0.12,w=bw*0.76,y=Y(x),isW=i==wk;g+=`<rect x="${X.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(top+ph-y).toFixed(1)}" rx="2" fill="${isW?RD:'url(#ebg)'}"><title>End ${i+1}: ${f1(x)}</title></rect>`;
  if(isW)g+=`<text x="${(X+w/2).toFixed(1)}" y="${(y-4).toFixed(1)}" font-size="10" text-anchor="middle" fill="${RD}" font-weight="700">&#9660;${bw>=22?'low':''}</text>`;
  if(i%lab==0||isW)g+=`<text x="${(X+w/2).toFixed(1)}" y="${H-3}" font-size="9" text-anchor="middle" fill="${isW?RD:M}"${isW?' font-weight="700"':''}>${i+1}</text>`});
 if(ref&&ref.length){const pts=ref.map((r,i)=>[(i*bw).toFixed(1)+','+Y(r).toFixed(1),((i+1)*bw).toFixed(1)+','+Y(r).toFixed(1)].join(' ')).join(' ');g+=`<polyline points="${pts}" fill="none" stroke="${B}" stroke-width="2" stroke-dasharray="5 4"/>`}
 return g+`</svg>`+(ref?`<p class="small muted" style="margin:2px 0 0"><svg width="22" height="8" aria-hidden="true"><line x1="0" y1="4" x2="22" y2="4" stroke="${B}" stroke-width="2" stroke-dasharray="5 4"/></svg> ${o.refLab||'your average'}</p>`:'')}
const endLine=(v,w)=>{const wk=lowI(v),hi=highI(v);return`<p class="small" style="margin:6px 0 0">Lowest end ${w}: <b style="color:${RD}">&#9660; end ${wk+1}</b> (${f1(v[wk])}). Highest: end ${hi+1} (${f1(v[hi])}).</p>`};
/* ---------- This shoot vs your usual (23 Oct 2026, Nathe/Steven) ----------
   On the end-of-shoot screen and Past sessions > Open: this shoot against the archer's EARLIER full shoots of the same round
   (same shoot list and round names as Full analysis). Comparisons are hidden when there is no earlier shoot; the plot only shows
   plotted arrows. Display only: nothing stored changes. */
function shootCompareHTML(sess){try{if(!sess||!sess.ends)return'';const R0=ROUNDS[sess.round]||{};if(R0.aba)return'';
 const all=window._anShoots?_anShoots():[],me=all.find(o=>o.s===sess),rd=me?me.round:sess.round;
 const ord=o=>o.date+(o.s&&o.s.id?'|'+o.s.id:''),meK=sess.date+'|'+(sess.id||'');
 const prev=all.filter(o=>o.round==rd&&!o.part&&o.s!==sess&&ord(o)<meK&&(o.ends&&o.ends.length||o.score));
 const v=sess.ends.filter(e=>e&&e.length).map(endSum),sc=total(sess),A=sess.ends.flat(),keys=keysFor(rd+(bugsOn(sess)||/field/i.test((faceR(R0,0)||{}).face||'')?' field':''));
 let h='';
 if(prev.length){const ps=prev.map(o=>o.score),avg=mean(ps),pb=Math.max(...ps);
  h+=card('This shoot vs your usual',`${esc(rd)} · ${plN(prev.length,'earlier shoot','earlier shoots')}`,`<div class="stats" style="grid-template-columns:1fr 1fr 1fr">${stat(sc,'this shoot',G)}${stat(f1(avg).replace(/\.0$/,''),'your average<span class="small" style="display:block;color:'+(sc>=avg?GR:RD)+'">'+sg(sc-avg)+'</span>')}${stat(pb,(sc>pb?'previous PB':'your PB')+'<span class="small" style="display:block;color:'+(sc>=pb?GR:RD)+'">'+sg(sc-pb)+'</span>')}</div>`);
  /* end by end: earlier full shoots with the same number of ends */
  const E=prev.filter(o=>o.ends&&o.ends.length==sess.ends.length);
  if(E.length&&v.length==sess.ends.length){const ref=v.map((_,i)=>mean(E.map(o=>endSum(o.ends[i].arrows))));
   h+=card('Score by end','vs your average ends',endBars(v,ref,{refLab:`your average at each end (${plN(E.length,'shoot','shoots')})`})+endLine(v,'this shoot'))}
  /* top two scores (X and 10 + X, or 6s and 5s on field): earlier shoots with arrows, or the published counts on target rounds */
  const fld=keys[0]=='6',cnt=a=>fld?[a.filter(x=>x=='6').length,a.filter(x=>x=='5').length]:[a.filter(x=>x=='X').length,a.filter(x=>x=='X'||x=='10').length];
  const P2=prev.map(o=>o.ends&&o.ends.length?cnt(o.ends.flatMap(e=>e.arrows)):(!fld&&(o.tens||o.xs)?[o.xs||0,o.tens||0]:null)).filter(Boolean);
  if(P2.length&&A.length){const me2=cnt(A),av=[0,1].map(i=>mean(P2.map(x=>x[i]))),lab=fld?['6s','5s']:['Xs','10s + Xs'];
   h+=card(fld?'6s and 5s':'Xs and 10s',`vs your average (${plN(P2.length,'shoot','shoots')})`,`<div class="stats" style="grid-template-columns:1fr 1fr">${[0,1].map(i=>stat(me2[i],lab[i]+`<span class="small" style="display:block">average ${f1(av[i]).replace(/\.0$/,'')} <span style="color:${me2[i]>=av[i]?GR:RD}">${sg(me2[i]-av[i])}</span></span>`)).join('')}</div>`)}}
 if(window.shotPlotCard)h+=shotPlotCard(sess,prev.map(o=>o.s).filter(Boolean));
 return h?`<div class="shcmp">${h}</div>`:''}catch(e){console.warn('shootCompare',e);return''}}
window.shootCompareHTML=shootCompareHTML;
/* ---------- Analysis ---------- */
function analysis(){const all=(window._anShoots?_anShoots():[]).filter(s=>s.ends&&s.ends.length||s.score);
 if(!all.length)return card('Analysis','',empty('Score a round or link your official results to see your analysis.'));
 /* counts match Stats & PBs: full rounds only (partials are listed separately and never compared) */
 const cnt={},pc={};all.forEach(s=>{if(s.part)pc[s.round]=(pc[s.round]||0)+1;else cnt[s.round]=(cnt[s.round]||0)+1});Object.keys(pc).forEach(r=>{if(!(r in cnt))cnt[r]=0});const rounds=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]);let rd=rounds.includes(S.anRound)?S.anRound:rounds[0];
 /* 22 Oct 2026: one shared selection. On Full analysis the shoot shown in Personal bests (window._anSel, best.js) picks the round here,
    and End by end shows that shoot's own ends against the round average. Display only; nothing stored changes. */
 const sel=!window._anFree&&window._anSel||null;let selNote='',pick=null;
 if(sel){if(rounds.includes(sel.round)){rd=sel.round;pick=all.find(s=>s.round==rd&&s.date==sel.d&&s.score==sel.sc)||null;
   if(!pick)selNote=`${esc(sel.rd)}, ${fmtL(sel.d)} isn't in this analysis${sel.bow&&TB()&&sel.bow.toLowerCase()!=TB().toLowerCase()?` (it was shot ${esc(sel.bow)}; Analysis uses your ${esc(TB())} rounds only)`:''}. Showing your ${esc(rd)} averages.`}
  else selNote=`${esc(sel.rd)}, ${fmtL(sel.d)} isn't in this analysis${sel.bow&&TB()&&sel.bow.toLowerCase()!=TB().toLowerCase()?` (it was shot ${esc(sel.bow)}; Analysis uses your ${esc(TB())} rounds only)`:''}. Showing ${esc(rd)} instead.`}
 const L=all.filter(s=>s.round==rd),F=L.filter(s=>!s.part),PT=L.filter(s=>s.part),EF=F.filter(s=>s.ends&&s.ends.length);
 /* end by end and half split only use full rounds with the usual number of ends for this round (odd-length records left out) */
 const ec={};EF.forEach(s=>ec[s.ends.length]=(ec[s.ends.length]||0)+1);const nStd=+(Object.keys(ec).sort((a,b)=>ec[b]-ec[a])[0]||0),E=EF.filter(s=>s.ends.length==nStd),oddN=EF.length-E.length;
 const last=E[E.length-1],prev=E[E.length-2],lastAny=L.filter(s=>s.ends&&s.ends.length).slice(-1)[0];S.targets=S.targets||{};const tg=S.targets[rd];
 const ra=typeof roundArrows=='function'?roundArrows(rd):null,mm=String(rd).match(/\/(720|900|1080|1440)\b/),isF=/field/i.test(rd),RMAX=ra?ra*(isF?6:10):mm?+mm[1]:(nStd&&last?nStd*last.ends[0].arrows.length*(isF?6:10):null);
 let h=`<div class="card st-card st-hero"><span class="kicker" style="color:${G}">Your round, broken down</span><label for="anr" class="small muted">Round</label><select id="anr">${rounds.map(r=>`<option value="${esc(r)}" ${r==rd?'selected':''}>${esc(r)} (${cnt[r]}${pc[r]?` + ${pc[r]} partial`:''})</option>`).join('')}</select>
 ${selNote?`<p class="small" style="margin:6px 0 0"><b>Note:</b> ${selNote}</p>`:''}<p class="small muted" style="margin:6px 0 0">${plN(F.length,'full round','full rounds')} of this round${PT.length?`, plus ${PT.length} partial (left out of comparisons, averages and potential score)`:''}. Competition and practice, ghost matches included. Numbers only, no advice.</p></div>`;
 // 1 half split
 /* 22 Oct 2026 (Coach recheck): Half split follows the shoot picked in Personal bests, compared with the full round of the same
    round shot just before it. Partial and total-only picks say so instead of quietly showing another shoot. */
 let hs=last,hp=prev,hsNote='';
 if(pick){if(pick.part){hs=null;hsNote='This shoot is partial, so it is left out of the half split.'}
  else if(!(pick.ends&&pick.ends.length)){hs=null;hsNote='No end-by-end data for this shoot (total only).'}
  else{hs=pick;const pool=EF.filter(s=>s.ends.length==pick.ends.length),i=pool.indexOf(pick);hp=i>0?pool[i-1]:(i<0?pool.filter(s=>s.date<pick.date).slice(-1)[0]:null)||null}}
 if(hs){const last=hs,prev=hp;const half=s=>{const n=s.ends.length,k=Math.ceil(n/2);return[s.ends.slice(0,k),s.ends.slice(k)].map(x=>x.reduce((t,e)=>t+endSum(e.arrows),0))},a=half(last),b=prev?half(prev):null,tot=a[0]+a[1],pt=b?b[0]+b[1]:null;
  const keys=keysFor(rd),rc=s=>{const n=s.ends.length,k=Math.ceil(n/2);return[s.ends.slice(0,k),s.ends.slice(k)].map(x=>keys.map(q=>x.flatMap(e=>e.arrows).filter(v=>v==q).length))},R=rc(last);
  h+=card('Half split',`${esc(last.date)} · ${tot}${pt!=null?` <span style="color:${tot>=pt?GR:RD}">${sg(tot-pt)} vs last</span>`:''}`,`<div class="stats" style="grid-template-columns:1fr 1fr">${stat(a[0],'1st half'+(b?` <span class="small" style="color:${a[0]>=b[0]?GR:RD}">${sg(a[0]-b[0])}</span>`:''))}${stat(a[1],'2nd half'+(b?` <span class="small" style="color:${a[1]>=b[1]?GR:RD}">${sg(a[1]-b[1])}</span>`:''))}</div>
  <table class="st-tab"><tr><th></th>${keys.map(k=>`<th>${k}</th>`).join('')}</tr><tr><td>1st half</td>${R[0].map(v=>`<td>${v}</td>`).join('')}</tr><tr><td>2nd half</td>${R[1].map(v=>`<td>${v}</td>`).join('')}</tr></table>
  <p class="small muted" style="margin:6px 0 0">${pick&&hs==pick?`Selected shoot: ${esc(rd)}, ${fmtL(pick.date)}. `:''}${b?`Change is against your previous full round on ${esc(prev.date)} (${pt}).`:pick&&hs==pick?'No earlier full round of this round to compare with.':'Shoot this round again to see the change from last time.'}${lastAny&&lastAny.part&&lastAny.date>=last.date?` Your latest shoot (${esc(lastAny.date)}, ${lastAny.score}) was partial, so it isn't compared.`:''}</p>`)}
 else h+=card('Half split',pick?`${esc(rd)}, ${fmtL(pick.date)} · ${pick.score}`:'',empty(hsNote||'Needs a shoot with end-by-end scores.'));
 // 2 averages
 const sc=F.map(s=>s.score),six=new Date(Date.now()-182*864e5).toLocaleDateString('en-CA'),m6=F.filter(s=>s.date>=six).map(s=>s.score),arr=F.filter(s=>s.na);
 const apa=arr.reduce((t,s)=>t+s.pts,0)/(arr.reduce((t,s)=>t+s.na,0)||1),lr=pick&&!pick.part?pick:last,lpa=lr&&lr.na?lr.pts/lr.na:null;
 h+=card('Averages',pick?`All full ${esc(rd)} rounds · selected shoot ${fmtL(pick.date)}, ${pick.score}${pick.part?' (partial, not counted)':''}`:'',sc.length?`<div class="stats" style="grid-template-columns:1fr 1fr 1fr">${stat(sc.length>=3?f1(mean(sc.slice(-3))):'–','last 3')}${stat(sc.length>=5?f1(mean(sc.slice(-5))):'–','last 5')}${stat(m6.length?f1(mean(m6)):'none','6 months'+(m6.length?'':`<span class="small muted" style="display:block">last shot ${esc((F[F.length-1]||{}).date||'')}</span>`))}${stat(arr.length?f2(apa):'–','avg arrow')}${stat(lpa!=null?f2(lpa):'–',lr&&lr==pick?'selected shoot':'last round')}${stat(Math.max(...sc),'best')}</div>
  ${mini(sc.slice(-10),F.slice(-10).map(s=>s.date.slice(5)),{target:tg,label:'Scores with target line'})}<p class="small muted" style="margin:0">Gold = full-round totals (last 10)${tg?', '+(CB()?'blue':'green')+' dashes = your target':''}. ${sc.length<5?'Rolling averages fill in after 3 and 5 full rounds.':''}</p>`:empty('Needs a full round of this round.'));
 // 3 per-end averages
 const n=E.length?Math.max(...E.map(s=>s.ends.length)):0,ea=[...Array(n)].map((_,i)=>{const v=E.filter(s=>s.ends[i]).map(s=>endSum(s.ends[i].arrows));return{m:mean(v),best:v.length?Math.max(...v):0,n:v.length}});
 const avgF=F.length?Math.round(mean(F.map(s=>s.score))):null,endsOf=s=>s.ends.map(e=>endSum(e.arrows));
 if(pick&&pick.ends&&pick.ends.length){const v=endsOf(pick),same=E.length&&pick.ends.length==nStd,ref=same?ea.map(x=>x.m):(E.length?Array(v.length).fill(mean(E.map(s=>s.pts/s.ends.length))):null);
  h+=card('End by end',`${esc(rd)}, ${fmtL(pick.date)}${avgF!=null&&F.length>1?` vs your average of ${avgF}`:''}`,endBars(v,ref,{refLab:same?'your average at each end':'your average end'})+endLine(v,'this shoot')+`<div class="stats" style="grid-template-columns:1fr 1fr 1fr;margin-top:8px">${stat(pick.score,'this shoot',G)}${stat(avgF!=null?avgF:'–','round average')}${stat(avgF!=null?sg(pick.score-avgF):'–','vs average')}</div><p class="small muted" style="margin:4px 0 0">Bars = this shoot's ends. ${ref?`Dashed line = ${same?`your average at each end across ${plN(E.length,'full round','full rounds')}`:'your average end score on this round'}.`:'Shoot this round again to see your average line.'}${pick.part?' This shoot is partial, so it is left out of the averages.':''}</p>`)}
 else if(pick){h+=card('End by end',`${esc(rd)}, ${fmtL(pick.date)}${avgF!=null&&F.length>1?` vs your average of ${avgF}`:''}`,empty('No end-by-end data for this shoot (total only).')+(E.length>=2&&n?`<h3 style="margin:10px 0 4px;font-size:16px">Your average at each end on ${esc(rd)}</h3>`+endBars(ea.map(x=>x.m),null)+endLine(ea.map(x=>x.m),'on average'):''))}
 else if(E.length>=2&&n){const wk=lowI(ea.map(x=>x.m)),pot0=Math.round(ea.reduce((t,x)=>t+x.best,0)),pot=RMAX?Math.min(pot0,RMAX):pot0;
  h+=card('End by end',`Average of each end across ${plN(E.length,'full round','full rounds')}`,endBars(ea.map(x=>x.m),null)+endLine(ea.map(x=>x.m),'on average')+`
  <div class="stats" style="grid-template-columns:1fr 1fr;margin-top:8px">${stat(pot,'potential score',G)}${stat(Math.round(ea.reduce((t,x)=>t+x.m,0)),'sum of end averages')}</div><p class="small muted" style="margin:4px 0 0">Potential score adds your best score at each end number across these shoots${RMAX?`, capped at the round maximum of ${RMAX}`:''}. Full rounds of ${nStd} ends only${PT.length||oddN?` (${[PT.length?PT.length+' partial':'',oddN?oddN+' with a different number of ends':''].filter(Boolean).join(', ')} left out)`:''}.</p>`)}
 else if(lastAny){const v=endsOf(lastAny);h+=card('End by end',`${esc(rd)}, ${fmtL(lastAny.date)}${lastAny.part?' (partial)':''}`,endBars(v,null)+endLine(v,'this shoot')+`<p class="small muted" style="margin:4px 0 0">Only one shoot of ${esc(rd)} has end-by-end scores, so this shows that shoot. Averages need 2 or more.</p>`)}
 else{/* fall back to the busiest round that has 2+ full shoots with ends, with a note, so the graph is never just missing */
  const fb=rounds.map(r=>{const X=all.filter(s=>s.round==r&&!s.part&&s.ends&&s.ends.length),c={};X.forEach(s=>c[s.ends.length]=(c[s.ends.length]||0)+1);const k=+(Object.keys(c).sort((a,b)=>c[b]-c[a])[0]||0);return{r,X:X.filter(s=>s.ends.length==k),k}}).find(x=>x.X.length>=2);
  if(fb){const m=[...Array(fb.k)].map((_,i)=>mean(fb.X.map(s=>endSum(s.ends[i].arrows))));h+=card('End by end',`${esc(fb.r)}: average of each end across ${plN(fb.X.length,'full round','full rounds')}`,`<p class="small" style="margin:0 0 6px"><b>Note:</b> ${esc(rd)} has no end-by-end scores yet, so this shows ${esc(fb.r)}, your busiest round with them.</p>`+endBars(m,null)+endLine(m,'on average'))}
  else h+=card('End by end','',empty('Needs a shoot with end-by-end scores.'))}
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
function bindAnalysis(){const r=$('#anr');if(r)r.onchange=()=>{S.anRound=r.value.replace(/ \(\d+\)$/,'');save();/* shared selection: the PB card follows this round when it has one */if(window.bsFollowRound)bsFollowRound(S.anRound);else window._anFree=true;rerender()};
 const b=$('#antgs');if(b)b.onclick=()=>{const v=parseInt($('#antg').value);const rd=$('#anr').value.replace(/ \(\d+\)$/,'');S.targets=S.targets||{};if(v>0)S.targets[rd]=v;else delete S.targets[rd];save();rerender()};
 const c=$('#gpch');if(c)c.onclick=ev=>{ev.preventDefault();S.hand=hand()=='L'?'R':'L';save();rerender()}}
function rerender(){const y=scrollY;render();scrollTo(0,y)}/* render() redraws whichever screen is open (Stats or Full analysis) */
const _st=stats;stats=function(){_st.apply(this,arguments);if($('#ansec'))return;const go=$('#goan'),html=`<div id="ansec"><h2 class="sec" style="margin:18px 4px 6px;border-bottom:3px solid ${G};padding-bottom:4px">Analysis</h2>${analysis()}<h2 class="sec" style="margin:22px 4px 6px;border-bottom:3px solid ${G};padding-bottom:4px">Group patterns</h2>${patternCard()}</div>`;
 if(go)go.insertAdjacentHTML('afterend',html);else app.insertAdjacentHTML('afterbegin',html);bindAnalysis()};
/* the Stats redesign replaced stats(), so this section stopped showing; Full analysis (lab.js) draws it */
window.labAnalysisHTML=()=>`<h2 class="sec" style="margin:18px 4px 6px;border-bottom:3px solid ${G};padding-bottom:4px">Analysis</h2>${analysis()}<h2 class="sec" style="margin:22px 4px 6px;border-bottom:3px solid ${G};padding-bottom:4px">Group patterns</h2>${patternCard()}`;window.labBindAnalysis=bindAnalysis;
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
const GM={last:'Last round',best:'My best',avg:'My average',off:'Best official',top:'Top ranked',pick:'Choose who'};
/* Top-ranked ghosts: real end-by-end official scoresheets of archers on the official AA Open compound top-10 lists, best score on this round
   since the rankings window. An archer with only a published total is a 'total only' ghost compared at the end; totals are never split into ends. */
let GT=null,GTl=false;const isMeP=()=>true;
const fmtD=d=>{if(!d)return'';const[y,m,dd]=d.split('-');return+dd+' '+'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[m-1]+' '+y.slice(2)};
/* only archers of my own gender and age class, the same as the rankings; ranks recounted inside that list (equal scores share) */
const myGC=()=>{const d=(findReal(S.profile||'').filter(x=>x.division).slice(-1)[0]||{}).division||'';return{g:(d.match(/\b(Male|Female)\b/)||[])[1]||null,c:(d.match(/Open|50\+|60\+|70\+|Under \d+/)||['Open'])[0]}};window.ghostGC=myGC;
const topList=r=>{if(!(GT&&isMeP()&&GT.rounds[r]))return[];const m=myGC(),L=GT.rounds[r].list.filter(x=>(!m.g||!x.g||x.g==m.g)&&(!x.cls||x.cls==m.c));return L.map(x=>{const rank=1+L.filter(y=>y.s>x.s).length;return{...x,rank,eq:L.filter(y=>y.s==x.s).length>1}})};window.ghostTopList=topList;
function loadTop(){if(GT||GTl||!isMeP())return;GTl=true;fetch('data/ghost_top.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j)return;GT=j;window.__GT=j;if(typeof cur!='undefined'&&!cur){const w=$('#ghwrap');if(w){w.remove();ghostPick()}}}).catch(()=>{})}
function topGhost(round){const L=topList(round);if(!L.length)return null;const x=L[window._ghTop]||L[0],label=`Ghost: ${x.n} ${x.s} (${fmtD(x.dt)})`;
 return x.ends?{mode:'top',src:'top',ends:x.ends.slice(),ar:x.ar?x.ar.map(a=>a.slice()):null,pos:null,date:fmtD(x.dt),label,who:x.n,total:x.s}:{mode:'top',src:'top',totalOnly:true,total:x.s,ends:[],pos:null,date:fmtD(x.dt),label:label+' · total only',who:x.n}}
window.__topGhost=topGhost;
/* ---------- Race who? (26 Oct 2026): any past score of this round, my PB / average, and published records ----------
   Sources: every Just-me/casual/league session of this round (full or part-shot, any face), plus the official end-by-end results of the current bow.
   Records come from data/records.json (cited there); a round with no confirmed record shows 'Record not available', never a number. Read only: nothing stored is changed. */
let RECD=null,RECl=false;
function loadRec(){if(RECD||RECl)return;RECl=true;fetch('data/records.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(!j)return;RECD=j;if(typeof cur!='undefined'&&!cur){const w=$('#ghwrap');if(w){w.remove();ghostPick()}}}).catch(()=>{})}
const f3Short={vert:'Vertical 3-spot',vegas:'Triangular 3-spot',single:'Single face'};
const faceCls=(round,s)=>{if(round!=AUSI&&!f3One(round))return'';try{const R0=ROUNDS[round];return use3(s,R0,faceR(R0,0))?'3-spot':'single'}catch(e){return s.face3=='single'?'single':'3-spot'}};
const faceLbl=(cls,s)=>!cls?'':cls=='single'?'Single face':(s&&f3Short[s.face3])||'3-spot';
const faceLong=(c,r)=>c=='single'?(r&&r!=AUSI?'single face':'single 40cm face'):'3-spot face';
const curCls=(round,c)=>round!=AUSI&&!f3One(round)?'':((c&&c.face3)||f3Start(round))=='single'?'single':'3-spot';
function faceDiff(round,cls,excl){const me=curCls(round,excl);return cls&&me&&cls!=me?`Different face: shot on the ${faceLong(cls,round)}, you are on the ${faceLong(me,round)}. Compared end by end; its arrow positions are not shown.`:''}
function gSources(round,excl){const R=ROUNDS[round],app=[],off=[];if(!R||!R.ape||R.aba)return{app,off};
 (typeof allSessions=='function'?allSessions():S.sessions||[]).filter(s=>s&&s.round==round&&s!==excl&&!s.sample&&(s.ends||[]).length).forEach(s=>{const E=[];for(const e of s.ends){if(e&&e.length==R.ape)E.push(e);else break}
  if(!E.length)return;const ends=E.slice(0,R.ends),full=isFull(s)&&ends.length>=R.ends,cls=faceCls(round,s);
  app.push({id:'s:'+s.id,k:'app',date:s.date,sid:s.id,sc:ends.reduce((t,e)=>t+endSum(e),0),n:ends.length,full,cls,fl:faceLbl(cls,s),ends:ends.map(endSum),ar:ends.map(e=>e.slice()),pos:(s.pos||[]).slice(0,ends.length).map(e=>(e||[]).filter(Boolean))})});
 app.sort((a,b)=>(a.date+a.sid)<(b.date+b.sid)?1:-1);
 const O=window.offGhosts?window.offGhosts(round):{list:[]};O.list.forEach((x,i)=>{const cls=round==AUSI?(/3.?spot/i.test(x.face)?'3-spot':'single'):'';off.push({id:'o:'+x.d+'|'+x.sc+'|'+i,k:'off',date:x.d,sc:x.sc,n:x.E.length,full:true,cls,fl:cls?(cls=='single'?'Single face':'3-spot'):'',ev:x.ev,ends:x.sums,ar:x.E.map(e=>e.slice()),pos:null})});
 /* a confirmed official result (photo or typed) of this round can be the ghost. Ends are used when they match the round; a total only is a pace line, never invented arrows. */
 if(window.officialAdded)officialAdded().forEach(s=>{const mapped=(typeof GHOST_MAP!='undefined'&&GHOST_MAP[s.round])||(ROUNDS[s.round]?s.round:'');if(mapped!==round||!(s.score>0))return;
  const have=Array.isArray(s.ends)&&s.ends.length==R.ends&&s.ends.every(e=>e&&e.length==R.ape);
  const ends=have?s.ends.map(e=>e.reduce((t,a)=>t+(a=='X'?10:a=='M'?0:+a),0)):[...Array(R.ends)].map((_,i)=>Math.round(s.score*(i+1)/R.ends)-Math.round(s.score*i/R.ends));
  off.push({id:'off:'+(s.id||s.date+'|'+s.score),k:'off',date:s.date,sc:+s.score,n:R.ends,full:true,cls:'',fl:'',ev:s.event||'Official',ends,ar:have?s.ends.map(e=>e.slice()):null,pos:null,pace:!have})});
 return{app,off}}
const paceLine=(tot,n)=>[...Array(n)].map((_,i)=>Math.round(tot*(i+1)/n)-Math.round(tot*i/n));
function recRows(round){const out=[];if(!RECD)return out;const bow=window.ghostBowNow?window.ghostBowNow():null,gc=myGC(),gl={Male:'men',Female:'women'};
 const mk=(scope,L,src,none)=>{const f=(L||[]).filter(x=>(!bow||String(x.bow).toLowerCase()==String(bow).toLowerCase())&&(!gc.g||x.g==gc.g));
  if(!f.length){out.push({id:'rec:'+scope+':none',scope,text:`${scope=='world'?'World':'National (Australia)'} record · Record not available`,off:true});return}
  f.forEach((x,i)=>out.push({id:'rec:'+scope+':'+x.bow+':'+x.g,scope,rec:x,src,text:`${scope=='world'?'World':'National'} record · ${x.bow} ${gl[x.g]||x.g} · ${x.score} · pace line`}))};
 const W=(RECD.world||{})[round],N=(RECD.national||{})[round];mk('world',W&&W.records,W,true);mk('national',N&&N.records,N,true);return out}
function whoData(round,excl){const R=ROUNDS[round],{app,off}=gSources(round,excl),byId={},groups=[],mine=[];if(!R)return{groups,byId,any:false};
 const all=app.concat(off).sort((a,b)=>(a.date+(a.sid||''))<(b.date+(b.sid||''))?1:-1),fullA=app.filter(x=>x.full),fullAll=all.filter(x=>x.full);
 const top=L=>L.reduce((a,b)=>!a||b.sc>a.sc?b:a,null),pb=top(fullA),best=top(fullAll);
 if(pb)mine.push({id:'pb',text:`My PB · ${pb.sc} (${fmtD(pb.date)})`,it:pb,short:'My PB '+pb.sc});
 if(best&&(!pb||best.sc>pb.sc))mine.push({id:'best',text:`My best ever · ${best.sc} (${fmtD(best.date)}${best.k=='off'?', competition':''})`,it:best,short:'My best '+best.sc});
 if(fullAll.length>1){const n=R.ends,ends=[...Array(n)].map((_,i)=>Math.round(mean(fullAll.map(x=>x.ends[i]||0))));mine.push({id:'avg',text:`My average · ${Math.round(mean(fullAll.map(x=>x.sc)))} (${fullAll.length} scores)`,it:{ends,ar:null,pos:null,date:'',cls:'',sc:ends.reduce((a,b)=>a+b,0),n},short:'My average'})}
 all.slice(0,80).forEach(x=>mine.push({id:x.id,text:`${fmtD(x.date)} · ${x.sc}${x.full?'':' after '+x.n+' of '+R.ends+' ends'}${x===pb?' · PB':''}${x===best?' · Best':''}${x.fl?' · '+x.fl:''}${x.k=='off'?' · competition'+(x.ev?' ('+x.ev+')':''):''}${x.pace?' · pace line':''}`,it:x,short:fmtD(x.date)+' '+x.sc}));
 mine.forEach(m=>byId[m.id]=m);
 if(mine.length)groups.push({label:'My scores',opts:mine});
 const rr=recRows(round);rr.forEach(r=>byId[r.id]=r);if(rr.length)groups.push({label:'Records (pace line)',opts:rr});
 return{groups,byId,any:Object.values(byId).some(o=>!o.off),pbId:pb?'pb':best?'best':null}}
function pickGhost(round,excl){const D=whoData(round,excl);if(!D.any)return null;let id=window._ghWho;if(!id||!D.byId[id]||D.byId[id].off)id=D.pbId||Object.keys(D.byId).find(k=>!D.byId[k].off);const o=D.byId[id];if(!o)return null;
 if(o.rec){const x=o.rec,R=ROUNDS[round],ends=paceLine(x.score,R.ends),who=(o.scope=='world'?'World':'National')+' record '+x.score,sc=o.src||{};
  return{mode:'pick',src:id,ends,ar:null,pos:null,date:fmtD(x.date),label:`Ghost: ${who} (${x.bow} ${x.g=='Male'?'men':'women'}, ${x.name} ${fmtD(x.date)})`,who,rec:true,note:`Pace line, not real ends: ${x.score} spread evenly over ${R.ends} ends (${ends[0]} an end). Record by ${x.name}${x.country?' ('+x.country+')':''}, ${fmtD(x.date)}. Source: ${sc.source||''}, checked ${fmtD(sc.checked)}.`}}
 const it=o.it,note=faceDiff(round,it.cls,excl),part=!it.full?` Part-shot: only its ${it.n} ends are compared.`:'';
 return{mode:'pick',src:id,ends:it.ends.slice(),ar:it.ar?it.ar.map(a=>a.slice()):null,pos:note?null:(it.pos&&it.pos.length?it.pos:null),date:it.date?fmtD(it.date):'',label:`Ghost: ${o.short}`,who:o.short,note:(note+part).trim()||undefined}}
function whoPanel(r){const D=whoData(r,null);if(!D.any)return'';const sel=(window._ghWho&&D.byId[window._ghWho]&&!D.byId[window._ghWho].off)?window._ghWho:D.pbId||Object.keys(D.byId).find(k=>!D.byId[k].off);window._ghWho=sel;
 return`<div id="ghwhow" ${window._ghM=='pick'?'':'hidden'} style="margin-top:6px"><label class="small" for="ghwho">Race who? (${esc(r)})</label><select id="ghwho">${D.groups.map(g=>`<optgroup label="${esc(g.label)}">${g.opts.map(o=>`<option value="${esc(o.id)}" ${o.id==sel?'selected':''} ${o.off?'disabled':''}>${esc(o.text)}</option>`).join('')}</optgroup>`).join('')}</select><p class="small muted" style="margin:2px 0 0">PB is your best round in the app; best ever also counts competition results. A record has only a total, so it races as an even pace line.</p></div>`}
function ghostFor(round,mode,excl){if(mode=='pick')return pickGhost(round,excl);if(mode=='top')return topGhost(round);if(mode=='off')return window.offGhost?window.offGhost(round):null;const R=ROUNDS[round];const ss=done().filter(s=>s.round==round&&s!==excl&&!s.finished&&s.ends.length);if(!ss.length||!R)return null;
 if(mode=='avg'){const n=R.ends,e=[...Array(n)].map((_,i)=>{const v=ss.filter(s=>s.ends[i]).map(s=>endSum(s.ends[i]));return v.length?Math.round(mean(v)):0});return{mode,src:'avg',n:ss.length,ends:e,pos:null,date:''}}
 const s=mode=='best'?ss.reduce((a,b)=>total(b)>total(a)?b:a):ss[ss.length-1];{const fd=faceDiff(round,faceCls(round,s),excl);return{mode,src:s.id,ends:s.ends.map(endSum),pos:fd?null:(s.pos||[]).map(e=>(e||[]).filter(Boolean)),date:s.date,ar:s.ends.map(e=>e.slice()),note:fd||undefined}}}
function gRes(s){const g=s.ghost;if(!g)return null;if(g.totalOnly){const fin=!!(s.finished||isDone(s)),me=s.ends.reduce((t,e)=>t+endSum(e),0),gh=fin?g.total:0;return{n:0,me,gh,w:0,l:0,gap:fin?me-gh:0,res:!fin?'draw':me>gh?'win':me<gh?'loss':'draw',totalOnly:true,fin}}const R=ROUNDS[s.round]||{},full=s.ends.filter(e=>e.length==R.ape).length,n=Math.min(full,g.ends.length,s.finished||isDone(s)?99:(g.rev||0));
 let me=0,gh=0,w=0,l=0;for(let i=0;i<n;i++){const a=endSum(s.ends[i]),b=g.ends[i];me+=a;gh+=b;if(a>b)w++;else if(b>a)l++}return{n,me,gh,w,l,gap:me-gh,res:me>gh?'win':me<gh?'loss':'draw'}}
function gStreak(){let k=0;const L=done().filter(s=>s.ghost).sort((a,b)=>(a.date+a.id)<(b.date+b.id)?-1:1);for(const s of L){const r=gRes(s);if(!r||!r.n)continue;if(r.res=='win')k++;else if(r.res=='loss')k=0}return k}
window.ghostResult=gRes;
function ghostPick(){loadTop();loadRec();const rd=$('#rd');if(!rd||$('#ghwrap'))return;const r=rd.value,TL=r=='__new'?[]:topList(r);if(!TL[window._ghTop])window._ghTop=0;const av=r=='__new'?[]:Object.keys(GM).filter(k=>ghostFor(r,k)),ok=av.length>0;
 if(ok&&!av.includes(window._ghM))window._ghM=av[0];const og=ok&&av.includes('off')?ghostFor(r,'off'):null;
 rd.insertAdjacentHTML('afterend',`<div id="ghwrap" class="gh-pick"><label style="display:flex;gap:8px;align-items:center;margin:10px 0 0"><input type="checkbox" id="ghon" style="width:auto" ${ok?'':'disabled'} ${ok&&window._ghOn?'checked':''}> <b><span class="ici" aria-hidden="true">${window.icon?icon('ghost'):''}</span> Ghost match</b> <span class="small muted">shoot against a past score, end by end</span></label>
 ${ok?`<div id="ghopts" ${window._ghOn?'':'hidden'}><div class="gh-seg">${av.map(k=>`<button type="button" data-gm="${k}" class="${window._ghM==k?'on':''}">${GM[k]}</button>`).join('')}</div>${av.includes('pick')?whoPanel(r):''}${TL.length?`<div id="ghtopw" ${window._ghM=='top'?'':'hidden'} style="margin-top:6px"><label class="small" for="ghtop">Top-ranked archer on ${esc(r)}</label><select id="ghtop">${TL.map((x,i)=>`<option value="${i}" ${i==window._ghTop?'selected':''}>${x.eq?'=':''}#${x.rank} ${esc(x.n)} · ${esc(x.c)} · ${x.s} (${fmtD(x.dt)})${x.ends?'':' · total only'}</option>`).join('')}</select><p class="small muted" style="margin:2px 0 0">Their real scoresheet, end by end, from past competition results.</p></div>`:''}<p class="small muted" style="margin:4px 0 0">Shoot against your own past ${esc(r)} (any past score, on any face), a top-ranked archer, or a record. The ghost's end shows after you press Next.${og?` Best official: ${og.ends.reduce((a,b)=>a+b,0)} on ${esc(og.date)} (competition result).`:''}</p></div>`:'<p class="small muted" style="margin:2px 0 0">Score this round once to unlock a ghost match against yourself.</p>'}</div>`);
 rd.addEventListener('change',()=>{window._ghTop=0;window._ghWho=null;const w=$('#ghwrap');if(w)w.remove();ghostPick()});
 const on=$('#ghon');if(on)on.onchange=()=>{window._ghOn=on.checked;$('#ghopts').hidden=!on.checked};
 app.querySelectorAll('[data-gm]').forEach(b=>b.onclick=()=>{window._ghM=b.dataset.gm;app.querySelectorAll('[data-gm]').forEach(x=>x.classList.toggle('on',x==b));const tw=$('#ghtopw');if(tw)tw.hidden=window._ghM!='top';const ww=$('#ghwhow');if(ww)ww.hidden=window._ghM!='pick'});const gw=$('#ghwho');if(gw)gw.onchange=()=>{window._ghWho=gw.value};const gt=$('#ghtop');if(gt)gt.onchange=()=>{window._ghTop=+gt.value};
 const st=$('#st');if(st)st.addEventListener('click',()=>{window._ghPend=$('#ghon')&&$('#ghon').checked?(window._ghM||'last'):null},true)}
function ghostBar(){const g=cur.ghost,r=gRes(cur),R=ROUNDS[cur.round],rv=Math.min(g.rev||0,g.ends.length),ei=rv-1;
 let face='';if(g.pos&&ei>=0&&g.pos[ei]&&g.pos[ei].length){face=faceSVG(g.pos[ei],'ghface','-1.05 -1.05 2.1 2.1',faceR(R,ei),'',{d:g.lcT?arrowMM(g):0}).replace('style="touch-action:none;','style="')}
 return`<div class="gh-bar" id="ghbar"><div class="gh-sc"><span>You</span><b style="color:${G}">${r.me}</b></div><div class="gh-mid"><b style="color:${r.gap>0?GR:r.gap<0?RD:'var(--ink)'}">${r.gap>0?'+':''}${r.gap}</b><span>${r.totalOnly?(r.fin?'totals compared':'total only · compared at the end'):`${r.n?`after ${r.n} end${r.n>1?'s':''}`:'ghost waiting'} · won ${r.w}–${r.l}`}</span></div><div class="gh-sc"><span>${esc(g.label?g.who||'Ghost':'Ghost · '+GM[g.mode])}</span><b style="color:${P}">${r.gh}</b></div>
 ${rv?`<div class="gh-last">${face?`<div class="gh-face">${face}</div>`:''}<span>Ghost end ${rv}: <b>${g.ends[ei]}</b>${g.ar&&g.ar[ei]?` <span class="small muted">(${g.ar[ei].join(' ')})</span>`:''}</span></div>`:''}${g.note?`<p class="small muted gh-note" style="margin:4px 0 0">${esc(g.note)}</p>`:''}</div>`}
/* 31 Oct 2026 (queue): X count on the ghost finish, you and the ghost over the same ends compared, when the ghost has arrow values.
   Display only: the result, the streak and anything stored are unchanged. */
function ghostX(g,r){if(!g||g.totalOnly||!Array.isArray(g.ar)||!r||!r.n)return'';const xs=E=>E.slice(0,r.n).reduce((t,e)=>t+(e||[]).filter(a=>a==='X'||(a&&a.k==='X')).length,0),me=xs(cur.ends),gh=xs(g.ar);
 if(!me&&!gh)return'';return`<p class="small gh-x" style="margin:6px 0 0">${r.res=='draw'?'Level on points. ':''}X count: you <b>${me}</b>, ghost <b>${gh}</b>.</p>`}
function ghostSheet(){const g=cur.ghost,r=gRes(cur),R=ROUNDS[cur.round],fin=isDone(cur)||cur.finished,n=r.n;
 const row=`<table class="st-tab gh-tab"><tr><th>End</th>${g.ends.slice(0,Math.max(n,Math.min(g.ends.length,(g.rev||0)))).map((_,i)=>`<th>${i+1}</th>`).join('')||'<th>–</th>'}</tr><tr><td>You</td>${[...Array(n)].map((_,i)=>{const a=endSum(cur.ends[i]),b=g.ends[i];return`<td style="color:${a>b?GR:a<b?RD:'var(--ink)'}">${a}${CB()&&a!=b?`<span class="cbar">${a>b?'▲':'▼'}</span>`:''}</td>`}).join('')||'<td>–</td>'}</tr><tr><td>Ghost</td>${g.ends.slice(0,n).map(v=>`<td>${v}</td>`).join('')||'<td>?</td>'}</tr></table>`;
 if(!fin)return`<div class="gh-res"><span class="kicker" style="color:${P}"><span class="ici" aria-hidden="true">${window.icon?icon('ghost'):''}</span> ${esc(g.label||'Ghost match · '+GM[g.mode])}</span>${ghostBar()}${n?row:''}</div>`;
 const k=gStreak(),T={win:['You beat your ghost!',GR],loss:['Ghost wins this time',RD],draw:['Dead heat',G]}[r.res];
 return`<div class="gh-res gh-fin"><span class="kicker" style="color:${P}"><span class="ici" aria-hidden="true">${window.icon?icon('ghost'):''}</span> ${esc(g.label||'Ghost match · '+GM[g.mode]+(g.date?' · '+g.date:''))}</span><h2 style="color:${T[1]};margin:4px 0">${T[0]}</h2>
 <div class="stats" style="grid-template-columns:1fr 1fr 1fr">${stat(r.me,'you',G)}${stat(r.gh,'ghost',P)}${stat((r.gap>0?'+':'')+r.gap,'gap')}${stat(r.w+'–'+r.l,'ends won')}${stat(k,'win streak 🔥')}${stat(r.n,'ends compared')}</div>
 ${ghostX(g,r)}${g.totalOnly?'<p class="small muted">This archer only has a published total for this score, so the totals were compared at the end.</p>':''}${g.note?`<p class="small muted">${esc(g.note)}</p>`:''}${cur.finished&&r.n<g.ends.length?`<p class="small muted">Finished early: compared the ${r.n} full end${r.n==1?'':'s'} you shot.</p>`:''}${row}<p class="small muted" style="margin:4px 0 0">Counts toward your PBs and stats like a normal round. Draws keep your streak.</p></div>`}
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
