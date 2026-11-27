/* Arrow plots and round analysis (23 Oct 2026, Steven: the stats heatmap was blocky squares that didn't match where arrows landed).
   - shotPts(s): every PLOTTED arrow of a session, put on one face per family: 'target' (WA 10-zone, 3-spot arrows moved onto one
     spot, units of the full face: 0.1 = one ring) or 'field' (WA field 6-1, 20cm column arrows already per spot: 1 = face edge).
     Keypad arrows have no position and are never drawn or guessed.
   - plotCard(list): real dots at real positions, soft density shading (the face is dimmed where no arrows landed), the group
     centre, the average offset in rings (and mm when every arrow's face size is known) and a windage / elevation sight guide.
   - shotPlotCard(s,prev): this shoot's plot with its group centre against the archer's usual group (earlier shoots of the same round),
     used on the end-of-shoot screen and Past sessions > Open (insights.js shootCompareHTML). Read only: never changes a session.
   - Session finished (EXTRA_VIEWS.shotdone): the done state after Finish session. The round is already saved; nothing is written. */
(function(){
const H=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const IC=n=>(window.icon&&icon(n))||'';
/* WA face colours (Book 2 / Book 4): white, black, light blue, red, gold. Field faces are black with a gold centre. */
const WA={w:'#ffffff',k:'#111111',b:'#00a3e0',r:'#e4002b',g:'#ffe552'};
const NAVY='#0b1f4d',GOLD='#ffc629',BLUE='#5ab0ff';
const fin=v=>typeof v=='number'&&isFinite(v);
function shotPts(s){const R0=s&&ROUNDS[s.round];const out={target:[],field:[]};if(!R0||R0.aba)return out;const AD=s.lcT&&window.arrowMM?arrowMM(s):0;
 (s.pos||[]).forEach((E,i)=>(E||[]).forEach((p,j)=>{if(!p||!fin(p.x)||!fin(p.y))return;const F=faceR(R0,i);let x=p.x,y=p.y,mm=null,k;
  let r=0.028,sp,lay,rx,ry;/* r = the arrow's own radius on the face, the same radius its score used, so the drawn edge touches the ring it scored.
   Shoots scored at the true arrow size (s.lcT, from 30 Oct 2026): the shaft radius (arrowMM) on the real face size.
   Older shoots: the old fixed line-cutter allowance they were scored with. Scores are never recomputed from it. */
  if(bugsOn(s)){const c=BUGC.reduce((b,q)=>Math.hypot(p.x-q[0],p.y-q[1])<Math.hypot(p.x-b[0],p.y-b[1])?q:b,BUGC[0]);x=(p.x-c[0])/0.3;y=(p.y-c[1])/0.3;k='bugs';r=0.023/0.3}
  else if(isFld(F)){const e=(s.ff||[])[i];mm=e&&e.f?e.f*5:null;k='field'}/* 20cm column: stored per spot already */
  else{if(use3(s,R0,F)){const L=s.face3=='vegas'?TRIC:BUGC,q=to1spot(p,L);x=q.x;y=q.y;k='spot';r=0.035;lay=s.face3=='vegas'?'vegas':'vert';sp=L.reduce((b,c,n)=>Math.hypot(p.x-c[0],p.y-c[1])<Math.hypot(p.x-L[b][0],p.y-L[b][1])?n:b,0);rx=p.x;ry=p.y}else k=isSix(F)?'six':isSpot(F)?'spot':'full';
   const cm=+(((F.face||'').match(/^(\d+)cm/)||[])[1]||0);mm=cm?cm*5:null}
  let t=0;if(mm&&AD>0&&k!='bugs'){r=AD/2/mm;t=1}out[k=='field'||k=='bugs'?'field':'target'].push({x,y,mm,k,r,t,sp,lay,rx,ry,e:i,j,sn:p.sn,a:(s.ends[i]||[])[j]})}));
 return out}
let uid=0;
function faceSvg(fam,P,zR){const ks=new Set(P.map(p=>p.k));let g='',hw;
 if(fam=='field'){hw=1.06;if(ks.size==1&&ks.has('bugs'))[6,5,4,3,2,1].forEach(z=>{const y=z<=2;g+=`<circle r="${(z/6).toFixed(4)}" fill="${y?WA.g:WA.k}" stroke="${y?WA.k:WA.w}" stroke-width="0.006"/>`});
  else[1,.8,.6,.4,.2,.1].forEach((r,i)=>{const y=i>3;g+=`<circle r="${r}" fill="${y?WA.g:WA.k}" stroke="${y?WA.k:WA.w}" stroke-width="0.006"/>`})}
 else{let lo=ks.has('full')?0:ks.has('six')?4:5;hw=lo==0?1.06:lo==4?0.64:0.54;
  if(zR){const z=Math.max(lo,Math.min(7,Math.round((1-zR.R)*10)));if(z>lo){lo=z;hw=Math.max(1-lo*0.1,zR.ext)*1.08}}/* zoomed: only the scoring rings the arrows reach (never fewer than 8 to 10) */
  const C=[WA.w,WA.w,WA.k,WA.k,WA.b,WA.b,WA.r,WA.r,WA.g,WA.g],L=[WA.k,WA.k,WA.w,WA.w,WA.k,WA.k,WA.k,WA.k,WA.k,WA.k];
  for(let i=lo;i<10;i++)g+=`<circle r="${(1-i*0.1).toFixed(2)}" fill="${C[i]}" stroke="${L[i]}" stroke-width="0.005"/>`;g+=`<circle r="0.05" fill="none" stroke="${WA.k}" stroke-width="0.004"/>`}
 const s=hw/1.06;return{g,hw,s}}
/* average offset and spread, measured from the exact centre of the X (0,0); ring = 0.1 face units on target faces, 0.2 (one outer zone) on field faces.
   30 Oct 2026, Nathe: "The point is to try get all arrows center of the X." No "centred" tolerance: every offset is shown in mm from the X centre,
   with its standard error (SE = SD / sqrt(n), per axis). An offset is "measurable" when it is bigger than its SE; smaller ones are shown but not acted on.
   3-spot shoots also get a group per spot (p.sp), and spots whose centres differ by more than chance flag a form or setup problem, not a sight problem. */
function group(P,fam,noSpots){const n=P.length;if(!n)return null;const cx=P.reduce((t,p)=>t+p.x,0)/n,cy=P.reduce((t,p)=>t+p.y,0)/n,ring=fam=='field'?0.2:0.1;
 const allMM=P.every(p=>p.mm),mx=allMM?P.reduce((t,p)=>t+p.x*p.mm,0)/n:null,my=allMM?P.reduce((t,p)=>t+p.y*p.mm,0)/n:null,u=allMM?P.reduce((t,p)=>t+p.mm,0)/n:null;
 const sp=P.reduce((t,p)=>t+Math.hypot(p.x-cx,p.y-cy),0)/n,spm=allMM?P.reduce((t,p)=>t+Math.hypot((p.x-cx)*p.mm,(p.y-cy)*p.mm),0)/n:null;
 const sdx=n>1?Math.sqrt(P.reduce((t,p)=>t+(p.x-cx)**2,0)/(n-1)):0,sdy=n>1?Math.sqrt(P.reduce((t,p)=>t+(p.y-cy)**2,0)/(n-1)):0;
 const G={n,cx,cy,ring,mx,my,u,sp,spm,sdx,sdy,sex:sdx/Math.sqrt(n),sey:sdy/Math.sqrt(n)};
 const lay=P[0].lay;if(!noSpots&&lay&&P.every(p=>p.lay==lay&&p.sp!=null)){G.spots=[0,1,2].map(i=>group(P.filter(p=>p.sp===i),fam,true));G.lay=lay}
 return G}
const rs=(v,ring,unit)=>{const r=Math.abs(v)/ring;return(r<0.95?r.toFixed(1):r<9.5?(Math.round(r*10)/10).toFixed(1):Math.round(r))+' '+unit};
/* one axis of a group: v = offset in face units, se = its standard error. Whole mm when the face size is known, else tenths of a ring. */
const MIN=G=>G.ring*0.05;/* plotting is not finer than about a twentieth of a ring (1 mm on a 40cm face) */
const meas=(v,se,G)=>Math.abs(v)>Math.max(se,MIN(G));
const amt=(v,G,unit)=>G.u?Math.round(Math.abs(v)*G.u)+' mm':rs(v,G.ring,unit);
const pm=(se,G,unit)=>'±'+(G.u?Math.max(1,Math.round(se*G.u))+' mm':rs(Math.max(se,MIN(G)),G.ring,unit));
const axTxt=(v,se,G,unit,neg,pos,short)=>{const d=v<0?neg:pos,a=amt(v,G,unit);
 if(G.u&&Math.round(Math.abs(v)*G.u)==0)return short?`0 mm ${pos=='right'?'left / right':'up / down'}`:`0 mm (${pm(se,G,unit)})`;
 return meas(v,se,G)?`${a} ${d}${short?'':` (${pm(se,G,unit)})`}`:`${a} ${d} (not measurable${short?'':`, ${pm(se,G,unit)}`})`};
const ctr=fam=>fam=='field'?'the centre':'the X';
/* spot-to-spot check: two spots differ when their centres are further apart than a quarter ring and twice their combined SE, on either axis */
function spotShift(G,unit){const S=(G.spots||[]).map((g,i)=>g&&g.n>=3?{g,i}:null).filter(Boolean);if(S.length<2)return null;const out=[];let top=null;
 for(let a=0;a<S.length;a++)for(let b=a+1;b<S.length;b++){const A=S[a].g,B=S[b].g;
  [['cx','sex','left','right'],['cy','sey','higher','lower']].forEach(([c,e,neg,pos])=>{const d=B[c]-A[c],lim=Math.max(G.ring*0.25,2*Math.hypot(A[e],B[e]));
   const o={d,lim,k:Math.abs(d)/lim,txt:`Spot ${S[b].i+1} lands ${amt(d,G,unit)} ${d<0?neg:pos} than Spot ${S[a].i+1}`};if(o.k>1)out.push(o);if(!top||o.k>top.k)top=o})}
 return{S,out,top}}
function guide(G,fam){if(!G||G.n<3)return`<p class="small muted shg-note">Plot at least 3 arrows to see the group centre and a sight guide.</p>`;
 const unit=fam=='field'?'zones':'rings',X=ctr(fam),mmT=v=>v==null?'':` (${Math.round(Math.abs(v))} mm)`;
 const lr=meas(G.cx,G.sex,G)?(G.cx<0?'left':'right'):null,ud=meas(G.cy,G.sey,G)?(G.cy<0?'high':'low'):null;
 const off=`<div class="shg-row"><span>Left / right of ${X}</span><b>${axTxt(G.cx,G.sex,G,unit,'left','right')}</b></div><div class="shg-row"><span>Up / down from ${X}</span><b>${axTxt(G.cy,G.sey,G,unit,'high','low')}</b></div><div class="shg-row"><span>Average spread</span><b>${rs(G.sp,G.ring,unit)}${mmT(G.spm)} from the group centre</b></div>`;
 const SS=spotShift(G,unit);let spots='';
 if(SS){spots=`<div class="shg-tab shg-spots" style="margin-top:8px"><div class="shg-row"><span><b>Each spot</b></span><b>from ${X} · spread</b></div>${SS.S.map(({g,i})=>`<div class="shg-row"><span>Spot ${i+1} · ${plN(g.n,'arrow','arrows')}</span><b>${axTxt(g.cx,g.sex,g,unit,'left','right',1)}, ${axTxt(g.cy,g.sey,g,unit,'high','low',1)} · ${g.spm!=null?Math.round(g.spm)+' mm':rs(g.sp,g.ring,unit)}</b></div>`).join('')}</div>`;
  spots+=SS.out.length?`<div class="shg-guide shg-flag"><span class="kicker">The spots land in different places</span><p>${SS.out.map(o=>o.txt).join('.<br>')}.</p><p class="small muted" style="margin:0">The sight is the same for every spot, so a sight move cannot fix this. Different landing places for different spots point to form or setup: head and body position as you move between spots, bow cant (check the level bubble on each spot) and your anchor. Fix this first; a sight move shifts all three spots together.</p></div>`
   :`<p class="small muted" style="margin:6px 0 0">No clear spot-to-spot difference yet. ${G.u&&Math.round(Math.abs(SS.top.d)*G.u)==0?'All spots land within 1 mm of each other.':`The biggest: ${SS.top.txt}, but with this many arrows per spot it would need to be more than ${amt(SS.top.lim,G,unit)} to be more than chance.`}</p>`}
 const big=(v)=>Math.abs(v)<G.ring?' a little':'',on=v=>G.u&&Math.round(Math.abs(v)*G.u)==0;
 const w=lr?`Windage: move the sight${big(G.cx)} <b>${lr}</b>. The group centre is ${amt(G.cx,G,unit)} ${lr} of ${X}.`:on(G.cx)?`Windage: no change. The group centre is on ${X} left to right, to the nearest mm (${pm(G.sex,G,unit)}).`:`Windage: no change yet. The group centre is ${amt(G.cx,G,unit)} ${G.cx<0?'left':'right'} of ${X}, inside ${pm(G.sex,G,unit)}, so ${plN(G.n,'arrow','arrows')} cannot show a real offset.`;
 const e=ud?`Elevation: move the sight${big(G.cy)} <b>${ud=='high'?'up':'down'}</b>. The group centre is ${amt(G.cy,G,unit)} ${ud=='high'?'above':'below'} ${X}.`:on(G.cy)?`Elevation: no change. The group centre is on ${X} up and down, to the nearest mm (${pm(G.sey,G,unit)}).`:`Elevation: no change yet. The group centre is ${amt(G.cy,G,unit)} ${G.cy<0?'above':'below'} ${X}, inside ${pm(G.sey,G,unit)}, so ${plN(G.n,'arrow','arrows')} cannot show a real offset.`;
 return`<div class="shg-tab">${off}</div>${spots}<div class="shg-guide"><span class="kicker">Sight move guide</span><p>${w}<br>${e}</p><p class="small muted" style="margin:0">Measured from the exact centre of ${X}. Move the sight towards the group. ± is how far the group centre can be out by chance with ${plN(G.n,'plotted arrow','plotted arrows')}; offsets inside it are not measurable yet. The amount is the shift on the target; change marks a little at a time and check again.</p></div>`}
function plotSvg(fam,P,label,U,o){if(o&&o.clean)return cleanSvg(fam,P,label,U);const F=faceSvg(fam,P.concat(U||[])),hw=F.hw,s=F.s,G=group(P,fam),UG=U&&U.length>=3?group(U,fam):null,id='shm'+(++uid);
 let g=`<svg class="shplot" viewBox="${-hw} ${-hw} ${2*hw} ${2*hw}" role="img" aria-label="${H(label)}"><defs><radialGradient id="${id}g"><stop offset="0" stop-color="#000" stop-opacity=".9"/><stop offset=".55" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
 <mask id="${id}"><rect x="${-hw}" y="${-hw}" width="${2*hw}" height="${2*hw}" fill="#fff"/>${P.map(p=>`<circle cx="${p.x.toFixed(3)}" cy="${p.y.toFixed(3)}" r="${(0.16*s).toFixed(3)}" fill="url(#${id}g)"/>`).join('')}</mask></defs>${F.g}
 <rect x="${-hw}" y="${-hw}" width="${2*hw}" height="${2*hw}" fill="${NAVY}" opacity=".5" mask="url(#${id})"/>`;
 P.forEach(p=>{const x=p.x.toFixed(3),y=p.y.toFixed(3);/* the arrow itself (its edge is what touches a ring line when it is scored), with its centre dot */
  const r=p.r||0.028,w=p.t?Math.min(0.006*s,r*0.3):0.006*s,d=p.t?Math.min(0.014*s,r*0.35):0.014*s;/* true-size shoots: outer edge of the stroke = the shaft edge; older shoots draw exactly as before */
  g+=`<circle cx="${x}" cy="${y}" r="${(p.t?r-w/2:r).toFixed(4)}" fill="#fefefe" fill-opacity=".3" stroke="${NAVY}" stroke-opacity=".55" stroke-width="${w.toFixed(4)}"/><circle cx="${x}" cy="${y}" r="${d.toFixed(4)}" fill="#fff" stroke="${NAVY}" stroke-width="${(p.t?d*0.57:0.008*s).toFixed(4)}"/>`});
 if(UG){const x=UG.cx.toFixed(3),y=UG.cy.toFixed(3),r=Math.max(UG.sp,0.02).toFixed(3);/* usual group: blue dashed ring + hollow centre */
  g+=`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${NAVY}" stroke-width="${(0.02*s).toFixed(3)}"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${BLUE}" stroke-width="${(0.009*s).toFixed(3)}" stroke-dasharray="${0.02*s} ${0.025*s}"/><circle cx="${x}" cy="${y}" r="${(0.045*s).toFixed(3)}" fill="none" stroke="${NAVY}" stroke-width="${(0.03*s).toFixed(3)}"/><circle cx="${x}" cy="${y}" r="${(0.045*s).toFixed(3)}" fill="none" stroke="${BLUE}" stroke-width="${(0.014*s).toFixed(3)}"/>`}
 if(G&&G.n>=3){const c=0.075*s,x=G.cx.toFixed(3),y=G.cy.toFixed(3),d=`M${G.cx-c} ${G.cy}H${G.cx+c}M${G.cx} ${G.cy-c}V${G.cy+c}`;
  g+=`<circle cx="${x}" cy="${y}" r="${Math.max(G.sp,0.02).toFixed(3)}" fill="none" stroke="${NAVY}" stroke-width="${(0.02*s).toFixed(3)}"/><circle cx="${x}" cy="${y}" r="${Math.max(G.sp,0.02).toFixed(3)}" fill="none" stroke="${GOLD}" stroke-width="${(0.009*s).toFixed(3)}" stroke-dasharray="${0.04*s} ${0.03*s}"/>
  <path d="${d}" stroke="${NAVY}" stroke-width="${(0.04*s).toFixed(3)}" stroke-linecap="round"/><path d="${d}" stroke="${GOLD}" stroke-width="${(0.018*s).toFixed(3)}" stroke-linecap="round"/>`}
 return{svg:g+'</svg>',G,UG}}
/* 'Where this shoot landed' face (30 Oct 2026, Nathe: "the single face looks shit ... it doesn't look correct"): clean WA colours like the three-spot view,
   no dimming or glow over the rings, zoomed to the scoring rings the arrows reach, the group and usual-group rings drawn under the arrows,
   and an open centre cross (gap in the middle) plus a small usual-group ring on top, so no arrow is covered. Same points, same group maths. */
function cleanSvg(fam,P,label,U){const G=group(P,fam),UG=U&&U.length>=3?group(U,fam):null;let zR=null;
 if(fam=='target'){let ext=0;P.forEach(p=>{ext=Math.max(ext,Math.hypot(p.x,p.y)+(p.r||0.028))});
  [G&&G.n>=3?G:null,UG].forEach(q=>{if(q)ext=Math.max(ext,Math.hypot(q.cx,q.cy)+Math.max(q.sp,0.02))});
  zR={ext,R:Math.min(1,Math.ceil((ext+0.004)*10-1e-9)/10)}}
 const F=faceSvg(fam,P.concat(U||[]),zR),hw=F.hw,s=F.s,K='#0b1f4d';
 let g=`<svg class="shplot shclean" viewBox="${-hw} ${-hw} ${2*hw} ${2*hw}" role="img" aria-label="${H(label)}">${F.g}`;
 if(UG)g+=`<circle cx="${UG.cx.toFixed(3)}" cy="${UG.cy.toFixed(3)}" r="${Math.max(UG.sp,0.02).toFixed(3)}" fill="none" stroke="${BLUE}" stroke-width="${(0.011*s).toFixed(4)}" stroke-dasharray="${(0.03*s).toFixed(4)} ${(0.022*s).toFixed(4)}"/>`;
 if(G&&G.n>=3)g+=`<circle cx="${G.cx.toFixed(3)}" cy="${G.cy.toFixed(3)}" r="${Math.max(G.sp,0.02).toFixed(3)}" fill="none" stroke="${K}" stroke-width="${(0.011*s).toFixed(4)}" stroke-dasharray="${(0.03*s).toFixed(4)} ${(0.022*s).toFixed(4)}"/>`;
 P.forEach(p=>{const x=p.x.toFixed(3),y=p.y.toFixed(3);
  const r=p.r||0.028,w=p.t?Math.min(0.005*s,r*0.3):0.005*s,d=p.t?Math.min(0.0125*s,r*0.35):0.0125*s;
  g+=`<circle cx="${x}" cy="${y}" r="${(p.t?r-w/2:r).toFixed(4)}" fill="#fefefe" fill-opacity=".3" stroke="${K}" stroke-opacity=".6" stroke-width="${w.toFixed(4)}"/><circle cx="${x}" cy="${y}" r="${d.toFixed(4)}" fill="#fff" stroke="${K}" stroke-width="${(p.t?d*0.6:0.0075*s).toFixed(4)}"/>`});
 if(UG)g+=`<circle cx="${UG.cx.toFixed(3)}" cy="${UG.cy.toFixed(3)}" r="${(0.02*s).toFixed(4)}" fill="none" stroke="${K}" stroke-width="${(0.02*s).toFixed(4)}"/><circle cx="${UG.cx.toFixed(3)}" cy="${UG.cy.toFixed(3)}" r="${(0.02*s).toFixed(4)}" fill="none" stroke="${BLUE}" stroke-width="${(0.011*s).toFixed(4)}"/>`;
 if(G&&G.n>=3){const a=0.032*s,c=0.12*s,X=G.cx,Y=G.cy,d=`M${(X-c).toFixed(4)} ${Y.toFixed(4)}H${(X-a).toFixed(4)}M${(X+a).toFixed(4)} ${Y.toFixed(4)}H${(X+c).toFixed(4)}M${X.toFixed(4)} ${(Y-c).toFixed(4)}V${(Y-a).toFixed(4)}M${X.toFixed(4)} ${(Y+a).toFixed(4)}V${(Y+c).toFixed(4)}`;
  g+=`<path d="${d}" stroke="${K}" stroke-width="${(0.032*s).toFixed(4)}" stroke-linecap="round"/><path d="${d}" stroke="${GOLD}" stroke-width="${(0.017*s).toFixed(4)}" stroke-linecap="round"/>`}
 return{svg:g+'</svg>',G,UG}}
/* The three spots as they are on the target (Vegas triangle) or side by side (vertical 3-spot), each arrow on the spot it was shot at, own rings, same ring colours.
   Each arrow is drawn at its true place with its own radius, so the ring it scored is the ring its edge touches. Read only. */
const SPW={vegas:[[-0.34,-0.2],[0.34,-0.2],[0,0.39]],vert:[[-0.66,0],[0,0],[0.66,0]]};
function spotsSvg(P){const S=P.filter(p=>p.sp!=null&&p.lay);if(!S.length||S.some(p=>p.lay!=S[0].lay))return'';const lay=S[0].lay,C=SPW[lay],vb=lay=='vegas'?'-0.66 -0.56 1.32 1.3':'-0.99 -0.34 1.98 0.68';
 const Cc=[WA.w,WA.w,WA.k,WA.k,WA.b,WA.b,WA.r,WA.r,WA.g,WA.g],L=[WA.k,WA.k,WA.w,WA.w,WA.k,WA.k,WA.k,WA.k,WA.k,WA.k],orig=lay=='vegas'?TRIC:BUGC;let g='';
 C.forEach((c,n)=>{for(let i=5;i<10;i++)g+=`<circle cx="${c[0]}" cy="${c[1]}" r="${((1-i*0.1)*0.6).toFixed(3)}" fill="${Cc[i]}" stroke="${L[i]}" stroke-width="0.004"/>`;
  g+=`<text x="${c[0]}" y="${(c[1]-0.315).toFixed(3)}" text-anchor="middle" font-size="0.07" font-weight="700" fill="#cfe0ff">Spot ${n+1}</text>`});
 S.forEach(p=>{const c=C[p.sp],o=orig[p.sp],x=(c[0]+p.rx-o[0]).toFixed(3),y=(c[1]+p.ry-o[1]).toFixed(3);
  const r=p.r*0.6,w=p.t?Math.min(0.003,r*0.3):0.003,d=p.t?Math.min(0.0075,r*0.35):0.0075;
  g+=`<circle cx="${x}" cy="${y}" r="${(p.t?r-w/2:r).toFixed(4)}" fill="#fefefe" fill-opacity=".3" stroke="${NAVY}" stroke-opacity=".6" stroke-width="${w.toFixed(4)}"/><circle cx="${x}" cy="${y}" r="${d.toFixed(4)}" fill="#fff" stroke="${NAVY}" stroke-width="${(p.t?d*0.6:0.0045).toFixed(4)}"/>`});
 const n=[0,0,0];S.forEach(p=>n[p.sp]++);
 return`<div class="shwrap shspots"><svg class="shspotsvg" viewBox="${vb}" role="img" aria-label="${S.length} plotted arrows on the three spots (${n.join(', ')})">${g}</svg></div><p class="small muted shkey">The three spots${lay=='vegas'?' as on the Vegas target':' side by side, Spot 1 at the top of the target'} · arrows per spot: ${n.join(', ')}</p>`}
const famName={target:'target face',field:'field face'};
/* one card per face family that has plotted arrows */
function plotCards(sessions,o={}){const A={target:[],field:[]};sessions.forEach(s=>{const q=shotPts(s);A.target.push(...q.target);A.field.push(...q.field)});
 const fams=['target','field'].filter(f=>A[f].length);if(!fams.length)return'';
 return fams.map(f=>{const P=A[f],{svg,G}=plotSvg(f,P,`${P.length} plotted arrows on a ${famName[f]}`),spot=f=='target'&&!P.some(p=>p.k=='full');
  return`<div class="card shcard"><span class="kicker">${plN(P.length,'plotted arrow','plotted arrows')}${fams.length>1?' · '+famName[f]:''}</span><h3>${H(o.title||'Where your arrows landed')}</h3>
  <div class="shwrap">${svg}</div><p class="small muted shkey"><span class="shk-dot"></span> each arrow <span class="shk-x"></span> group centre · darker face = no arrows there${spot?' · 3-spot arrows shown on one spot':''}${f=='field'&&P.some(p=>p.k=='bugs')?' · Bugs Eyes arrows shown on one spot':''}</p>
  ${f=='target'?spotsSvg(P):''}${guide(G,f)}${o.multi&&sessions.length>1?`<p class="small muted" style="margin:6px 0 0">From ${plN(sessions.length,'shoot','shoots')}. Sight marks change with distance, so check one round and distance at a time for sight moves.</p>`:''}</div>`}).join('')}
window.shotPts=shotPts;window.shotPlotCards=plotCards;
/* end-of-shoot / Past sessions: this shoot's plot, its group centre and sight guide, and the usual group from earlier plotted shoots of the same round */
const offTxt=(G,fam)=>{const unit=fam=='field'?'zones':'rings';return axTxt(G.cx,G.sex,G,unit,'left','right',1)+', '+axTxt(G.cy,G.sey,G,unit,'high','low',1)};
const PREV={};/* usual-group sessions per card, so the arrow size picker can redraw the card in place */
function shotPlotRedraw(w,s){const t=document.createElement('div');t.innerHTML=shotPlotCard(s,PREV[s.id]||[]);const n=t.firstElementChild;if(n)w.replaceWith(n)}
window.shotPlotRedraw=shotPlotRedraw;
function shotPlotCard(sess,prev){const q=shotPts(sess),fams=['target','field'].filter(f=>q[f].length);if(!fams.length)return'';PREV[sess.id]=prev;
 return`<div class="shpc">`+fams.map(f=>{const U=[];let nU=0;(prev||[]).forEach(p=>{const x=shotPts(p)[f];if(x.length){U.push(...x);nU++}});
  const P=q[f],{svg,G,UG}=plotSvg(f,P,`${P.length} plotted arrows on a ${famName[f]}`,U,{clean:true}),spot=f=='target'&&!P.concat(U).some(p=>p.k=='full');
  return`<div class="card shcard"><span class="kicker">Where this shoot landed</span><h3>${plN(P.length,'plotted arrow','plotted arrows')}</h3><div class="shwrap">${svg}</div>
  <p class="small muted shkey"><span class="shk-dot"></span> this shoot <span class="shk-x"></span> its group centre${UG?' <span class="shk-u"></span> your usual group':''}${spot?' · 3-spot arrows shown on one spot':''}</p>
  ${window.arrowSizeLab&&P.some(p=>p.k!='bugs')?`<div class="shsz">${sess.lcT?`<span class="small arrowsz">Arrow size ${arrowSizeLab(sess)}</span><span class="small muted">Arrows are drawn and scored at this size.</span>`:`<span class="small muted">Scored before arrow sizes were used, so arrows are drawn at the line-cutter size that scored them.</span>`}</div>`:''}
  ${f=='target'?spotsSvg(P):''}${guide(G,f)}${UG&&G&&G.n>=3?`<div class="shg-tab" style="margin-top:8px"><div class="shg-row"><span>Your usual group</span><b>${offTxt(UG,f)}</b></div><div class="shg-row"><span>Usual spread</span><b>${rs(UG.sp,UG.ring,f=='field'?'zones':'rings')}</b></div></div><p class="small muted" style="margin:4px 0 0">Usual = ${plN(UG.n,'plotted arrow','plotted arrows')} from ${plN(nU,'earlier shoot','earlier shoots')} of this round.</p>`:''}</div>`}).join('')+`</div>`}
window.shotPlotCard=shotPlotCard;

/* End by end (31 Oct 2026, Nathe via Archery Coach): a finished shoot's ends one at a time, each end's face with its arrows numbered in shot order,
   at the same radius shotPts gives them (true shaft size on lcT shoots, the old line-cutter size on older ones). 3-spot shoots show the three spots.
   Swipe left / right on the face, or the arrow buttons / keyboard arrows. Shown only on a finished shoot's sheet (end-of-shoot summary and
   Past sessions > Open), never on the live scoring screen. Read only: nothing is written. */
const EVS={};
function evNum(x,y,r,n,s,o){/* number badge just above and right of the arrow, kept inside the view box */
 const b=0.03*s,a=Math.PI/4,d=r+b*0.9;let bx=x+d*Math.cos(a),by=y-d*Math.sin(a);if(o){bx=Math.min(o[2]-b,Math.max(o[0]+b,bx));by=Math.min(o[3]-b,Math.max(o[1]+b,by))}
 return`<circle cx="${bx.toFixed(4)}" cy="${by.toFixed(4)}" r="${b.toFixed(4)}" fill="${NAVY}" stroke="${GOLD}" stroke-width="${(b*0.16).toFixed(4)}"/><text x="${bx.toFixed(4)}" y="${(by+b*0.42).toFixed(4)}" text-anchor="middle" font-size="${(b*1.2).toFixed(4)}" font-weight="700" fill="#fff">${n}</text>`}
function evArrow(x,y,p,r,w,d,K){return`<circle cx="${x.toFixed(4)}" cy="${y.toFixed(4)}" r="${(p.t?r-w/2:r).toFixed(4)}" fill="#fefefe" fill-opacity=".3" stroke="${K}" stroke-opacity=".6" stroke-width="${w.toFixed(4)}"/><circle cx="${x.toFixed(4)}" cy="${y.toFixed(4)}" r="${d.toFixed(4)}" fill="#fff" stroke="${K}" stroke-width="${(p.t?d*0.6:0.0075).toFixed(4)}"/>`}
function evSpots(P,lay,lab){const C=SPW[lay],orig=lay=='vegas'?TRIC:BUGC,V=lay=='vegas'?[-0.66,-0.64,0.66,0.74]:[-0.99,-0.41,0.99,0.34];/* a little taller than the shot plot, so the spot labels are not cut off */
 const Cc=[WA.w,WA.w,WA.k,WA.k,WA.b,WA.b,WA.r,WA.r,WA.g,WA.g],L=[WA.k,WA.k,WA.w,WA.w,WA.k,WA.k,WA.k,WA.k,WA.k,WA.k];let g='',n='';
 C.forEach((c,k)=>{for(let i=5;i<10;i++)g+=`<circle cx="${c[0]}" cy="${c[1]}" r="${((1-i*0.1)*0.6).toFixed(3)}" fill="${Cc[i]}" stroke="${L[i]}" stroke-width="0.004"/>`;
  g+=`<text x="${c[0]}" y="${(c[1]-0.315).toFixed(3)}" text-anchor="middle" font-size="0.07" font-weight="700" fill="#cfe0ff">Spot ${k+1}</text>`});
 P.forEach(p=>{const c=C[p.sp],o=orig[p.sp],x=c[0]+p.rx-o[0],y=c[1]+p.ry-o[1],r=p.r*0.6,w=p.t?Math.min(0.003,r*0.3):0.003,d=p.t?Math.min(0.0075,r*0.35):0.0075;
  g+=evArrow(x,y,p,r,w,d,NAVY);n+=evNum(x,y,r,p.n,1.1,V)});
 return`<svg class="shspotsvg evsvg" data-ev-lay="${lay}" viewBox="${V[0]} ${V[1]} ${V[2]-V[0]} ${V[3]-V[1]}" role="img" aria-label="${H(lab)}">${g}${n}</svg>`}
function evFace(fam,P,All,lab){let zR=null;/* zoom from the whole shoot, so the face keeps one size from end to end */
 if(fam=='target'){let ext=0;All.forEach(p=>{ext=Math.max(ext,Math.hypot(p.x,p.y)+(p.r||0.028))});zR={ext,R:Math.min(1,Math.ceil((ext+0.004)*10-1e-9)/10)}}
 const F=faceSvg(fam,All,zR),hw=F.hw,s=F.s,K=NAVY,V=[-hw,-hw,hw,hw];let g='',n='';
 P.forEach(p=>{const r=p.r||0.028,w=p.t?Math.min(0.005*s,r*0.3):0.005*s,d=p.t?Math.min(0.0125*s,r*0.35):0.0125*s;g+=evArrow(p.x,p.y,p,r,w,d,K);n+=evNum(p.x,p.y,r,p.n,s,V)});
 return`<svg class="shplot shclean evsvg" viewBox="${-hw} ${-hw} ${2*hw} ${2*hw}" role="img" aria-label="${H(lab)}">${F.g}${g}${n}</svg>`}
function evEnds(s){return(s.ends||[]).map((e,i)=>e&&e.length?i:null).filter(i=>i!=null)}
function evBody(s,k){const E=evEnds(s),i=E[k],q=shotPts(s),A=s.ends[i]||[];let run=0;for(let m=0;m<=k;m++)run+=endSum(s.ends[E[m]]);
 const lab=`End ${k+1} of ${E.length}`,pl=[];let face='';
 /* shot order: new shoots keep a shot number (sn) on each plotted arrow; ends saved without it (older shoots, keypad arrows) use the saved order */
 const Pp=(s.pos||[])[i]||[],known=A.every((_,j)=>Pp[j]&&Pp[j].sn>0)&&new Set(A.map((_,j)=>Pp[j].sn)).size==A.length,num=j=>known?Pp[j].sn:j+1;
 const ord=A.map((_,j)=>j).sort((a,b)=>num(a)-num(b));
 ['target','field'].forEach(f=>{const All=q[f];if(!All.length)return;const P=All.filter(p=>p.e==i).map(p=>Object.assign({},p,{n:num(p.j)})).sort((a,b)=>a.n-b.n);pl.push(...P);
  const al=`${lab}: ${plN(P.length,'plotted arrow','plotted arrows')} on the ${famName[f]}`;
  const lay=All[0].lay;if(f=='target'&&lay&&All.every(p=>p.lay==lay&&p.sp!=null))face+=`<div class="shwrap shspots evwrap">${evSpots(P,lay,al)}</div>`;
  else face+=`<div class="shwrap evwrap">${evFace(f,P,All,al)}</div>`});
 const on=new Set(pl.map(p=>p.j));
 return`<div class="ev-bar"><button type="button" class="btn ghost ev-go" data-ev-go="-1" aria-label="Previous end"${k<=0?' disabled':''}>‹</button>
 <div class="ev-t" aria-live="polite" aria-atomic="true"><b class="ev-n">${lab}</b><span class="ev-sum"><span class="ev-nw">End total <b>${endSum(A)}</b></span> · <span class="ev-nw">running total ${run}</span></span></div>
 <button type="button" class="btn ghost ev-go" data-ev-go="1" aria-label="Next end"${k>=E.length-1?' disabled':''}>›</button></div>
 <div class="ev-face" data-ev-swipe="1">${face}</div>
 <ol class="ev-list small" data-ev-order="${known?'shot':'saved'}" aria-label="${known?'Arrows in shot order':'Arrows in saved order'}">${ord.map(j=>`<li><span class="ev-b">${num(j)}</span> <b>${H(A[j])}</b>${on.has(j)?'':' <span class="muted">(not plotted)</span>'}</li>`).join('')}</ol>
 ${pl.length?(known?'<p class="small muted ev-ord">Numbers are the order the arrows were shot.</p>':'<p class="small muted ev-ord">The shot order was not saved for this end (older shoots were saved highest score first), so the numbers follow the saved order.</p>'):'<p class="small muted ev-none">No arrows were plotted in this end (scored on the keypad).</p>'}`}
function endViewHTML(s){try{if(!s||!s.ends)return'';const q=shotPts(s);if(!q.target.length&&!q.field.length)return'';const E=evEnds(s);if(!E.length)return'';
 const sid=String(s.id||'cur');EVS[sid]=s;
 return`<div class="card evcard" data-ev="${H(sid)}" data-ev-k="0" tabindex="0" role="group" aria-roledescription="end viewer" aria-label="End by end plot. Swipe or use the arrow buttons to move between ends."><span class="kicker">End by end</span><h3>Each end as you shot it</h3>
 <div class="ev-in">${evBody(s,0)}</div><p class="small muted shkey">Swipe left or right on the face, or use the arrow buttons, to move between ends.</p></div>`}catch(e){console.warn('endView',e);return''}}
function endViewBind(root){(root||document).querySelectorAll('[data-ev]').forEach(c=>{const s=EVS[c.dataset.ev];if(!s||c._ev)return;c._ev=1;const n=evEnds(s).length;
 const go=d=>{const k=Math.max(0,Math.min(n-1,(+c.dataset.evK||0)+d));if(k==+c.dataset.evK)return;c.dataset.evK=k;const IN=c.querySelector('.ev-in');IN.innerHTML=evBody(s,k)};
 c.addEventListener('click',ev=>{const b=ev.target.closest('[data-ev-go]');if(!b||b.disabled)return;go(+b.dataset.evGo);const f=c.querySelector(`[data-ev-go="${b.dataset.evGo}"]`);if(f&&!f.disabled)f.focus();else{const o=c.querySelector(`[data-ev-go="${-b.dataset.evGo}"]`);if(o)o.focus()}});
 c.addEventListener('keydown',ev=>{if(ev.key=='ArrowLeft'){ev.preventDefault();go(-1)}else if(ev.key=='ArrowRight'){ev.preventDefault();go(1)}});
 let x0=null,y0=0;c.addEventListener('touchstart',ev=>{const t=ev.changedTouches[0];x0=ev.target.closest('[data-ev-swipe]')&&t?t.clientX:null;y0=t?t.clientY:0},{passive:true});
 c.addEventListener('touchend',ev=>{const t=ev.changedTouches[0];if(x0==null||!t)return;const dx=t.clientX-x0,dy=t.clientY-y0;x0=null;if(Math.abs(dx)>40&&Math.abs(dx)>1.5*Math.abs(dy))go(dx<0?1:-1)},{passive:true});
 c.addEventListener('touchcancel',()=>{x0=null},{passive:true})})}
window.endViewHTML=endViewHTML;window.endViewBind=endViewBind;

/* done state after Finish session: the round is already saved; this screen only says so and offers next steps */
const KEY='scoretool.doneId';
function shotDone(id){try{sessionStorage.setItem(KEY,id)}catch(e){}window._doneId=id;nav('shotdone')}
window.shotDone=shotDone;
function bindBack(){const b=$('#shback');if(b)b.onclick=()=>nav(b.dataset.go)}
function doneView(){let id=window._doneId;try{id=id||sessionStorage.getItem(KEY)}catch(e){}const s=(S.sessions||[]).find(x=>x.id==id);
 app.innerHTML=`<div class="labbar"><button class="btn ghost labback" id="shback" data-go="score">‹ Score</button><h1>Session finished</h1></div>
 <div class="card shdone"><div class="shdone-ic" aria-hidden="true">${IC('check')}</div><h2>All done</h2>${s?`<p><b>${H(s.round)}</b> · ${total(s)} · ${H(fmtD(s.date))}</p>`:''}<p class="small muted">Saved on this phone. You'll find it in Past sessions.</p>
 <div class="shdone-act"><button class="btn full" id="shwins">See my wins</button><button class="btn ghost full" id="shnew">Score another round</button></div></div>`;
 bindBack();$('#shwins').onclick=()=>nav('home');$('#shnew').onclick=()=>nav('score')}
window.EXTRA_VIEWS=Object.assign(window.EXTRA_VIEWS||{},{shotdone:doneView});
})();
