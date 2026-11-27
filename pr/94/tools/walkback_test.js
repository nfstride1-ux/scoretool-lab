#!/usr/bin/env node
/* Unit tests for walk-back distances and verdicts. */
const W=require('../walkback.js');
let ok=0,bad=0;
function chk(n,c,extra){
  if(c){ok++;console.log('PASS '+n)}
  else{bad++;console.log('FAIL '+n+(extra?'  '+String(extra).slice(0,300):''))}
}
function close(a,b,tol){return Math.abs(a-b)<=tol}

/* Coach no-drag table, sight at 10 m, cm. */
const coach={
  115:{20:80,30:240,40:480,50:800},
  155:{20:44,30:132,40:264,50:440},
  185:{20:31,30:93,40:185,50:309},
  230:{20:20,30:60,40:120,50:200},
  250:{20:17,30:51,40:101,50:169},
  270:{20:14,30:43,40:87,50:145}
};
for(const[fps,row] of Object.entries(coach)){
  const v=W.fpsToMs(+fps);
  for(const[D,exp] of Object.entries(row)){
    const got=W.dropNoDrag(+D,v)*100;
    chk('nodrag '+fps+' fps @ '+D+' m',close(got,exp,2),got.toFixed(1)+' vs '+exp);
  }
}

const cases=[
  {name:'compound 60 lb / 120 cm',opts:{kind:'compound',dw:60,height:120,dl:29},fps:270,dists:[10,25,35],max:35},
  {name:'recurve 30 lb / 120 cm',opts:{kind:'recurve',dw:30,height:120},fps:155,dists:[10,20,25],max:25},
  {name:'recurve 20 lb / 80 cm',opts:{kind:'recurve',dw:20,height:80},fps:115,dists:[10,15],max:15}
];
for(const c of cases){
  const p=W.plan(c.opts);
  chk(c.name+' fps',p.fps===c.fps,p.fps);
  chk(c.name+' distances',JSON.stringify(p.distances)===JSON.stringify(c.dists),p.distances);
  chk(c.name+' maxD',p.maxD===c.max,p.maxD);
  chk(c.name+' drag max <= no-drag max',p.maxD<=p.nodragMax,(p.maxD,p.nodragMax));
  chk(c.name+' first is 10 m',p.distances[0]===10);
  chk(c.name+' steps of 5',p.distances.every(d=>d%5===0));
  const v=W.fpsToMs(p.fps),cd=W.dragC(W.massKg(c.opts)),use=p.usableCm;
  p.distances.forEach(D=>{
    const dr=W.dropWithDrag(D,v,cd)*100,nd=W.dropNoDrag(D,v)*100;
    chk(c.name+' '+D+' m drag >= no-drag',dr+0.2>=nd,dr+' vs '+nd);
    chk(c.name+' '+D+' m drop within usable',D===10||dr<=use+0.05,dr+' vs usable '+use);
  });
  if(p.maxD+5<=80){
    const over=W.dropWithDrag(p.maxD+5,v,cd)*100;
    chk(c.name+' next 5 m is over usable or at cap',over>use-0.05||p.maxD===p.nodragMax,over+' usable '+use);
  }
}

chk('compound default 60 lb is 270 fps (29 in, no rating)',W.compoundFps(60,29,300,null,false)===270);
chk('recurve bands',W.recurveFps(20)===115&&W.recurveFps(30)===155&&W.recurveFps(40)===185);
chk('measured fps wins',W.estimateFps('compound',{dw:60,fps:300}).fps===300&&W.estimateFps('compound',{dw:60,fps:300}).src==='measured');
chk('rated 327 ATA 60 lb 29 in 400 gr ~264',W.compoundFps(60,29,327,400,true)===264);

/* Verdicts */
function Wk(kind,extra,shots){return Object.assign({kind,height:120,distances:[10,25,35],bubble:false,axis2:false,shots},extra)}
const left=[{d:10,x:-1,y:20},{d:10,x:0,y:22},{d:25,x:-6,y:40},{d:25,x:-7,y:42},{d:35,x:-14,y:60},{d:35,x:-13,y:62}];
let v=W.verdict(Wk('compound',{bubble:true,axis2:true},left));
chk('compound pre-checked left drift → rest, move right',v.code==='rest'&&v.move==='right'&&/rest is off centre/.test(v.text)&&/1\/32/.test(v.text)&&/yoke or cam lean/.test(v.text)&&/3rd-axis/.test(v.text)&&!/George/i.test(v.text),v);
v=W.verdict(Wk('compound',{bubble:false,axis2:false},left));
chk('compound no pre-check → check bubble and 2nd axis first',v.code==='precheck'&&/bubble is level/.test(v.text)&&/2nd axis/.test(v.text)&&/3rd-axis/.test(v.text),v);
const on=[{d:10,x:0.5,y:20},{d:10,x:-0.5,y:21},{d:25,x:1,y:40},{d:35,x:-1,y:60}];
v=W.verdict(Wk('compound',{bubble:true,axis2:true},on));
chk('compound on the line',v.code==='on'&&/sit on the vertical line/.test(v.text),v);
const slope=[{d:10,x:1,y:15},{d:10,x:0,y:16},{d:20,x:6,y:40},{d:20,x:7,y:42},{d:25,x:12,y:70},{d:25,x:11,y:68}];
v=W.verdict(Wk('recurve',{distances:[10,20,25]},slope));
chk('recurve sloped line lists both candidates',v.code==='slope'&&/plunger position/.test(v.text)&&/spring tension/.test(v.text)&&/do not all agree/.test(v.text)&&/1\/8 turn/.test(v.text)&&/tight groups/.test(v.text),v);
const curve=[{d:10,x:0,y:15},{d:10,x:1,y:16},{d:20,x:10,y:40},{d:20,x:11,y:41},{d:25,x:2,y:70},{d:25,x:1,y:69}];
v=W.verdict(Wk('recurve',{distances:[10,20,25]},curve));
chk('recurve curved line still lists both candidates',v.code==='curve'&&/bows out/.test(v.text)&&/plunger position/.test(v.text)&&/spring tension/.test(v.text),v);
const wind=[{d:10,x:8,y:15},{d:20,x:9,y:40},{d:25,x:8,y:70}];
v=W.verdict(Wk('recurve',{distances:[10,20,25]},wind));
chk('recurve vertical but offset → windage',v.code==='windage'&&/sight windage/.test(v.text),v);
v=W.verdict(Wk('compound',{},[{d:10,x:0,y:20}]));
chk('need two distances',v.code==='need',v);
const low=[{d:10,x:0,y:20},{d:25,x:1,y:100}];
v=W.verdict(Wk('compound',{height:120},low));
chk('bottom-quarter flag',v.low===true,v);

const src=require('fs').readFileSync(__dirname+'/../walkback.js','utf8');
chk('Park 2011 cited',/Park J\.L\. \(2011\)/.test(src));
chk('Park 2013 cited',/Park J\.L\. \(2013\)/.test(src));
chk('results labelled estimates',/estimate/.test(src));
chk('no George in walkback.js',!/george|ryles/i.test(src));

console.log('\n'+ok+' passed, '+bad+' failed');
process.exit(bad?1:0);
