/* Walk back tune: safe distances and verdicts (27 Nov 2026).
   Point-mass arrow flight with quadratic air drag, in the style of James Park's
   published trajectory work. This is not a copy of Park's full shaft-flex or FOC
   model; it is a numerical point-mass integration used only to estimate drop so
   walk-back distances stay on the boss. Every distance and drop is an estimate.
   Sources cited for the method (not copied code):
     Park J.L. (2011) The behaviour of an arrow shot from a compound archery bow.
       Proc IMechE Part P 225(1):8-21. https://doi.org/10.1177/17543371JSET82
     Park J.L. (2013) Arrow behaviour in the lateral plane during and immediately
       following launch from a recurve archery bow. Proc IMechE Part P 227(3):172-183.
       https://doi.org/10.1177/1754337112464844
     Park J.L., "Modelling arrows in flight", Bow International, 5 Apr 2022.
       https://www.bow-international.com/features/modelling-arrows-in-flight/
   Sight is set at 10 m and the archer aims at a dot near the top of the boss.
   Usable drop = target height minus the bottom quarter minus a small top inset
   for the aim dot. Distances with drag are never longer than the same cap
   computed with no drag (drop = g D (D-10) / (2 v^2)). */
(function(root){
const G=9.80665, RHO=1.225, CD=2.0, DIAM=0.006, GRAIN_KG=6.479891e-8*1000;/* 1 grain = 64.79891 mg */
const FPS=0.3048, D0=10, TOP_CM=4, STEP=5, MAX_SCAN=80;
const ON_LINE=3, GROW=2, CURVE_CM=2.5;
function num(v,d){const n=parseFloat(v);return isFinite(n)?n:d}
function grainsToKg(gr){return Math.max(200,num(gr,400))*GRAIN_KG}
function dragC(massKg,diam){const A=Math.PI*Math.pow((diam||DIAM)/2,2);return 0.5*RHO*CD*A/Math.max(0.01,massKg)}
function fpsToMs(fps){return Math.max(40,num(fps,180))*FPS}

/* Recurve / barebow bands (Coach, from published chronograph ranges): 20 lb ~115, 30 lb ~155, 40 lb ~185 fps. */
function recurveFps(dw){
 const pts=[[20,115],[30,155],[40,185]];
 const w=num(dw,30);
 if(w<=pts[0][0])return Math.max(90,pts[0][1]+(w-pts[0][0])*(pts[1][1]-pts[0][1])/10);
 if(w>=pts[pts.length-1][0])return pts[pts.length-1][1]+(w-pts[pts.length-1][0])*(pts[pts.length-1][1]-pts[pts.length-2][1])/10;
 for(let i=0;i<pts.length-1;i++){if(w<=pts[i+1][0]){const t=(w-pts[i][0])/(pts[i+1][0]-pts[i][0]);return pts[i][1]+t*(pts[i+1][1]-pts[i][1])}}
 return 155;
}
/* Compound IBO/ATA rule of thumb: baseline at 70 lb / 30 in / 350 gr; minus ~2 fps per lb under 70, minus ~10 fps per inch under 30; minus 1 fps per 3 gr of arrow over 5 gr/lb. Default baseline 300 fps (no rating) matches the 40/50/60 lb estimates of 230/250/270 fps at 29 in. When a bow rating is known, grain is applied (default 400 gr compound / 350 gr recurve). */
function compoundFps(dw,dl,ibo,arrowGr,hasRating){
 const w=num(dw,50), L=num(dl,29);
 let fps=num(ibo,300);
 if(w<70)fps-=2*(70-w);else if(w>70)fps+=2*(w-70);
 if(L<30)fps-=10*(30-L);else if(L>30)fps+=10*(L-30);
 if(hasRating){const gr=num(arrowGr,400),std=5*w;if(gr>std)fps-=(gr-std)/3;else if(gr<std)fps+=(std-gr)/3}
 return Math.max(160,Math.round(fps));
}
function estimateFps(bow,opts){
 opts=opts||{};
 const kind=opts.kind||bow||'compound';
 const dw=num(opts.dw,kind=='compound'?50:30);
 if(opts.fps!=null&&opts.fps!==''&&isFinite(+opts.fps))return{fps:+(+opts.fps).toFixed(0),src:'measured'};
 if(kind=='compound'){
  const has=opts.ibo!=null&&isFinite(+opts.ibo)&&+opts.ibo>0;
  return{fps:compoundFps(dw,opts.dl,has?+opts.ibo:300,opts.arrowGr,has),src:'estimate'};
 }
 return{fps:Math.round(recurveFps(dw)),src:'estimate'};
}

function usableDropM(heightCm){
 const H=Math.max(40,num(heightCm,120))/100;
 const top=Math.min(TOP_CM,H*100*0.08)/100;
 const bottom=0.25*H;
 return Math.max(0.15,H-top-bottom);
}
function dropNoDrag(D,v,d0){d0=d0==null?D0:d0;if(D<=d0)return 0;return G*D*(D-d0)/(2*v*v)}

/* Integrate a point-mass from the bow to downrange x (m). y is up, launch at the origin. */
function heightAt(v0,alpha,c,xT){
 let x=0,y=0,vx=v0*Math.cos(alpha),vy=v0*Math.sin(alpha);
 const dt=0.0004;
 for(let i=0;i<400000;i++){
  if(x>=xT){
   const over=x-xT,frac=vx!==0?over/vx:0;
   return y-vy*frac;
  }
  const v=Math.hypot(vx,vy);
  const ax=-c*v*vx,ay=-G-c*v*vy;
  vx+=ax*dt;vy+=ay*dt;x+=vx*dt;y+=vy*dt;
  if(vx<=1e-3)return y;
 }
 return y;
}
function findAlpha(v0,c,d0){
 d0=d0==null?D0:d0;
 let lo=-0.25,hi=0.35;
 for(let i=0;i<48;i++){
  const mid=(lo+hi)/2,y=heightAt(v0,mid,c,d0);
  if(y>0)hi=mid;else lo=mid;
 }
 return(lo+hi)/2;
}
const _cache={};
function dropWithDrag(D,v,c,d0){
 d0=d0==null?D0:d0;
 if(D<=d0)return 0;
 const key=[D.toFixed(2),v.toFixed(3),(c||0).toFixed(6),d0].join('|');
 if(_cache[key]!=null)return _cache[key];
 const a=findAlpha(v,c,d0);
 const y=heightAt(v,a,c,D);
 const drop=-y;
 _cache[key]=drop;
 return drop;
}
function massKg(opts){return grainsToKg(opts&&opts.arrowGr!=null?opts.arrowGr:(opts&&opts.kind=='compound'?400:350))}

function maxSafe(fps,heightCm,opts){
 opts=opts||{};
 const v=fpsToMs(fps),c=dragC(massKg(opts),opts.diam),usable=usableDropM(heightCm);
 let maxD=D0,nodragMax=D0;
 for(let D=D0+STEP;D<=MAX_SCAN;D+=STEP){
  if(dropNoDrag(D,v)<=usable)nodragMax=D;else break;
 }
 for(let D=D0+STEP;D<=nodragMax;D+=STEP){
  if(dropWithDrag(D,v,c)<=usable)maxD=D;else break;
 }
 if(maxD>nodragMax)maxD=nodragMax;
 return{maxD,nodragMax,usableM:usable,v,c};
}
function pickThree(maxD){
 if(maxD<=D0)return[D0];
 if(maxD<=D0+STEP)return[D0,maxD];
 let mid=Math.round(((D0+maxD)/2)/STEP)*STEP;
 if(mid<=D0||mid>=maxD)mid=maxD-STEP;
 if(mid<=D0)return[D0,maxD];
 return[D0,mid,maxD];
}
function plan(opts){
 opts=opts||{};
 const kind=opts.kind||'compound';
 const dw=num(opts.dw,kind=='compound'?50:30);
 const height=Math.max(40,num(opts.height,120));
 const est=estimateFps(kind,{dw,dl:opts.dl,ibo:opts.ibo,arrowGr:opts.arrowGr,fps:opts.fps,kind});
 const cap=maxSafe(est.fps,height,{kind,arrowGr:opts.arrowGr,diam:opts.diam});
 const distances=pickThree(cap.maxD);
 const drops=distances.map(D=>({
  D,
  dragCm:Math.round(dropWithDrag(D,cap.v,cap.c)*1000)/10,
  nodragCm:Math.round(dropNoDrag(D,cap.v)*1000)/10
 }));
 return{
  kind,dw,height,fps:est.fps,fpsSrc:est.src,
  distances,drops,maxD:cap.maxD,nodragMax:cap.nodragMax,
  usableCm:Math.round(cap.usableM*1000)/10,
  estimate:true
 };
}

function shotsOf(walk){return(walk&&walk.shots)||[]}
function shotCount(walk){return shotsOf(walk).length}
function byDist(walk,d){return shotsOf(walk).filter(s=>+s.d===+d)}
function meanX(list){if(!list.length)return null;return list.reduce((a,s)=>a+num(s.x,0),0)/list.length}
function meanY(list){if(!list.length)return null;return list.reduce((a,s)=>a+num(s.y,0),0)/list.length}
function inBottomQuarter(y,height){return num(y,0)>=0.75*num(height,120)}
function means(walk){
 const Ds=(walk&&walk.distances)||[];
 return Ds.map(d=>{const L=byDist(walk,d);if(!L.length)return null;return{d:+d,n:L.length,x:meanX(L),y:meanY(L),low:L.some(s=>inBottomQuarter(s.y,walk.height))}});
}
function patternOf(M){
 const L=M.filter(Boolean);
 if(L.length<3)return L.length>=2?'slope':'none';
 const[a,b,c]=L;
 const span=c.d-a.d;if(span<=0)return'slope';
 const expected=a.x+(c.x-a.x)*(b.d-a.d)/span;
 const midOff=b.x-expected;
 const slope=Math.abs(c.x-a.x);
 if(Math.abs(midOff)>=CURVE_CM&&Math.abs(midOff)>0.35*Math.max(slope,CURVE_CM))return'curve';
 return'slope';
}
function drift(M){
 const L=M.filter(Boolean);
 if(L.length<2)return{ok:false};
 const close=L[0],far=L[L.length-1];
 const growing=Math.abs(far.x)>Math.abs(close.x)+GROW;
 const farSide=far.x>ON_LINE?'right':far.x<-ON_LINE?'left':'on';
 const allOn=L.every(m=>Math.abs(m.x)<=ON_LINE);
 const vertical=L.length>=2&&L.every(m=>Math.abs(m.x-close.x)<=ON_LINE);
 const offset=vertical&&Math.abs((L.reduce((a,m)=>a+m.x,0)/L.length))>ON_LINE;
 return{ok:true,close,far,growing,farSide,allOn,vertical,offset,side:farSide,pat:patternOf(M)};
}

/* Verdict copy: no named coaches. Compound: rest / yoke, or 2nd axis / bubble if pre-checks are not done. 3rd axis is not visible on flat ground. Recurve/barebow: sources disagree on sloped vs curved mapping, so both plunger position and spring tension are listed. */
function verdict(walk){
 walk=walk||{};
 const kind=walk.kind||'compound';
 const M=means(walk);
 const ready=M.filter(Boolean);
 const low=ready.some(m=>m.low)||shotsOf(walk).some(s=>inBottomQuarter(s.y,walk.height));
 const base={low,means:M,ready:ready.length};
 if(ready.length<2)return Object.assign({code:'need',text:'Plot at least one group at 10 m and one group at a further distance to see the reading.'},base);
 const d=drift(M);
 const groups='This only works if you can already shoot tight groups.';
 if(kind=='compound'){
  const pre=!!(walk.bubble&&walk.axis2);
  const axis='A walk back on flat ground cannot show a 3rd-axis error; that only shows up shooting up or downhill.';
  if(d.allOn)return Object.assign({code:'on',text:'The groups sit on the vertical line at each distance. The left/right tune looks good. '+axis},base);
  if(d.growing&&d.farSide!=='on'){
   const move=d.farSide==='left'?'right':'left';
   const step='Move the rest '+move+' (opposite the far miss) one small step, about 1/32 in, then shoot the far distance again. If the gap gets wider, go back the other way.';
   if(pre)return Object.assign({code:'rest',side:d.farSide,move,text:'Groups drift to the '+d.farSide+' as you walk back, which usually means the rest is off centre. If your rest is already at true centre, use yoke or cam lean instead. '+step+' '+axis},base);
   return Object.assign({code:'precheck',side:d.farSide,move,text:'Groups drift to the '+d.farSide+' as you walk back. A rest that is off centre, a 2nd axis that is not square, and a tilted bubble all look the same on a flat walk back. Check that your bubble is level at full draw and that the 2nd axis has been set with a level, then come back to the rest or the yoke. '+step+' '+axis},base);
  }
  if(d.vertical&&d.offset)return Object.assign({code:'windage',text:'The groups make a fairly vertical line, but it sits off the centre line. At 10 m, set your windage so the group sits on the line, then walk back again. '+axis},base);
  return Object.assign({code:'unclear',text:'The left/right pattern is not a clear drift that grows with distance. Re-shoot the groups if they are loose. '+groups+' '+axis},base);
 }
 /* recurve / barebow */
 if(d.allOn)return Object.assign({code:'on',text:'The groups sit on the vertical line at each distance. Once the line is vertical and on centre, the left/right tune looks good. '+groups},base);
 if(d.vertical&&d.offset)return Object.assign({code:'windage',text:'The line of arrows is fairly vertical, but it sits off the centre line. Move the sight windage to put the line on the centre, and leave the plunger alone. '+groups},base);
 const pat=d.pat==='curve'?'The groups make a line that bows out and comes back.':'The groups make a fairly straight line that drifts off the centre line.';
 const both='That can be the plunger position or the spring tension — published guides do not all agree on which pattern means which, so treat both as candidates. Change one thing at a time (about 1/8 turn on the spring), then re-shoot. Once the line is vertical, move the sight windage to put it on the centre line. '+groups;
 return Object.assign({code:d.pat==='curve'?'curve':'slope',pat:d.pat,side:d.farSide,text:pat+' '+both},base);
}

function defaultWalk(opts){
 opts=opts||{};
 const p=plan(opts);
 return{
  stage:'setup',
  kind:p.kind,
  dw:p.dw,
  height:p.height,
  fps:p.fps,
  fpsSrc:p.fpsSrc,
  dl:opts.dl!=null?num(opts.dl,null):null,
  ibo:opts.ibo!=null?num(opts.ibo,null):null,
  arrowGr:opts.arrowGr!=null?num(opts.arrowGr,null):null,
  bubble:!!opts.bubble,
  axis2:!!opts.axis2,
  distances:p.distances,
  usableCm:p.usableCm,
  shots:[],
  dist:p.distances[0]
 };
}

const API={G,D0,usableDropM,dropNoDrag,dropWithDrag,dragC,estimateFps,recurveFps,compoundFps,maxSafe,pickThree,plan,shotsOf,shotCount,byDist,inBottomQuarter,means,verdict,patternOf,drift,defaultWalk,fpsToMs,massKg,findAlpha,heightAt,TOP_CM,ON_LINE};
if(typeof module!=='undefined'&&module.exports)module.exports=API;
root.WalkBack=API;
})(typeof window!=='undefined'?window:typeof global!=='undefined'?global:this);
