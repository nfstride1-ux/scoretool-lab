/* Real rankings + Archer's Diary history + Coach's read, for Nathe only (data/nathe_ad.json: his own compound scores from 2024,
   plus best scores on his rounds by archers on the official AA Open compound top-10 lists). The Coach's read maths below is copied
   verbatim from the coach playground (coach.js), so both show the same numbers. */
(function(){
const isMe=()=>{const p=String(S.profile||'').toLowerCase();return p.includes('stride')&&p.includes('nath')};
let AD=null,R=[],EXPECT={},CS=null;const ME=18568,byId={[ME]:{name:'Nathaniel Stride',c:'#3b82f6'}};
const escH=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=d=>{if(!d)return'';const[y,m,dd]=d.split('-');return+dd+' '+'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[m-1]+' '+y.slice(2)};
/* ---- verbatim from coach playground ---- */
const av=v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null,f1=v=>v==null?'–':(Math.round(v*10)/10).toString();
const aval=a=>{a=String(a).trim().toUpperCase();if(a==='X')return 10;if(a==='M'||a==='')return 0;const n=parseInt(a);return isNaN(n)?null:n};
const arrows=s=>String(s||'').split(/[,\s]+/).filter(Boolean);
const distLab=(d,r)=>d.d?d.d:(r.disc==='Field'||r.disc==='3D'?'Field':'')+' D'+d.n;
function trendOf(rs){const v=rs.filter(r=>r.rt!=null).slice(-6);if(v.length<6)return['flat','Not enough'];const a=av(v.slice(0,3).map(r=>r.rt)),b=av(v.slice(3).map(r=>r.rt)),d=b-a;return d>1?['up','▲ Up']:d<-1?['down','▼ Down']:['flat','● Steady']}
let NOW=()=>new Date();const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const ago=m=>{const n=NOW(),d=new Date(n.getFullYear(),n.getMonth()-m,1),last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(n.getDate(),last));return iso(d)};
function endsOf(r,s=CS){const out=[];r.ds.forEach(d=>{const dl=distLab(d,r);if(s.dist.length&&!s.dist.includes(dl))return;d.e.forEach(e=>{if(e[2]==null)return;if(s.end.length&&!s.end.includes(+e[0]))return;out.push({r,dl,n:+e[0],ar:arrows(e[1]),t:e[2]})})});return out}
const nEnds=r=>r.ds.reduce((a,d)=>a+d.e.filter(e=>e[2]!=null).length,0);
const isInc=r=>{const n=nEnds(r);return n>0&&EXPECT[r.r]!=null&&n<EXPECT[r.r]};
function base(s=CS){return R.filter(r=>(!s.a.length||s.a.includes(r.m))&&(!s.from||r.dt>=s.from)&&(!s.to||r.dt<=s.to))}
function sel(s=CS){return base(s).filter(r=>(!s.r.length||s.r.includes(r.r))&&(s.inc||!isInc(r)))}
function groups(rs,s=CS){if(!s.split)return[{k:'all',name:'Combined',c:'#38bdf8',rs}];const ids=[...new Set(rs.map(r=>r.m))];return ids.map(id=>({k:id,name:byId[id].name,c:byId[id].c,rs:rs.filter(r=>r.m===id)}))}
const sdp=v=>{const m=av(v);return Math.sqrt(av(v.map(x=>(x-m)*(x-m))))};
const dsort=(x,y)=>(parseInt(y)||0)-(parseInt(x)||0)||(x<y?-1:x>y?1:0);
const roll3=v=>v.map((x,i)=>i<2||v.slice(i-2,i+1).some(y=>y==null)?null:(v[i-2]+v[i-1]+v[i])/3);
function philShoot(r,s){const E=endsOf(r,s);if(!E.length)return null;const n=E.length,h=Math.floor(n/2);const F1=E.slice(0,h),F2=E.slice(n-h);
 const sumE=L=>L.reduce((a,e)=>a+(e.t||0),0),cnt=(L,f)=>L.reduce((a,e)=>a+e.ar.filter(x=>f(x.toUpperCase())).length,0);
 const fl=L=>!L.length?{sc:null,x:null,t10:null,n9:null,n8:null,n7:null}:({sc:sumE(L),x:cnt(L,x=>x==='X'),t10:cnt(L,x=>x==='10'),n9:cnt(L,x=>x==='9'),n8:cnt(L,x=>x==='8'),n7:cnt(L,x=>x==='7')});
 const ar=E.flatMap(e=>e.ar.map(aval)).filter(x=>x!=null),mx=(r.disc==='Field'||r.disc==='3D'?6:10);
 const blocks=[];[F1,F2].forEach(L=>{for(let i=0;i+3<=L.length;i+=3)blocks.push(sumE(L.slice(i,i+3)))});const bpf=Math.floor(h/3);
 const ec={max:0,m1:0,m2:0,other:0};E.forEach(e=>{if(e.t==null||!e.ar.length)return;const top=e.ar.length*mx;const k=e.t===top?'max':e.t===top-1?'m1':e.t===top-2?'m2':'other';ec[k]++});
 return{r,n,h,bpf,f1:fl(F1),f2:fl(F2),tot:sumE(E),arrAvg:ar.length?ar.reduce((a,b)=>a+b,0)/ar.length:null,nArr:ar.length,blocks,pos1:F1.map(e=>e.t),pos2:F2.map(e=>e.t),ec}}
function philFig(s,G){return G.map(g=>{const sh=g.rs.map(r=>philShoot(r,s)).filter(Boolean);const ser=k=>sh.map(k);
 const f1=ser(x=>x.f1.sc),f2=ser(x=>x.f2.sc),tot=ser(x=>x.tot),aa=ser(x=>x.arrAvg);const dif=v=>v.map((x,i)=>i&&x!=null&&v[i-1]!=null?x-v[i-1]:null);
 const nb=Math.max(0,...sh.map(x=>x.blocks.length)),np=Math.max(0,...sh.map(x=>x.h));
 const blocks=[...Array(nb)].map((_,b)=>ser(x=>x.blocks[b]??null)),p1=[...Array(np)].map((_,i)=>ser(x=>x.pos1[i]??null)),p2=[...Array(np)].map((_,i)=>ser(x=>x.pos2[i]??null));
 const last3=sh.slice(-3),pAvg=(k,i)=>{const v=last3.map(x=>x[k][i]).filter(y=>y!=null);return v.length===3?(v[0]+v[1]+v[2])/3:null};
 const pot1=[...Array(np)].map((_,i)=>pAvg('pos1',i)),pot2=[...Array(np)].map((_,i)=>pAvg('pos2',i));const okP=last3.length===3&&pot1.every(v=>v!=null)&&pot2.every(v=>v!=null);
 const six=ago(6),s6=sh.filter(x=>x.r.dt>=six),m=v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null;
 const ec={max:0,m1:0,m2:0,other:0};sh.forEach(x=>Object.keys(ec).forEach(k=>ec[k]+=x.ec[k]));
 return{g,sh,f1,f2,tot,d1:dif(f1),d2:dif(f2),dt:dif(tot),cnt:{x1:ser(x=>x.f1.x),t1:ser(x=>x.f1.t10),xt1:ser(x=>x.f1.x==null?null:x.f1.x+x.f1.t10),n91:ser(x=>x.f1.n9),x2:ser(x=>x.f2.x),t2:ser(x=>x.f2.t10),xt2:ser(x=>x.f2.x==null?null:x.f2.x+x.f2.t10),n92:ser(x=>x.f2.n9)},
  r1:roll3(f1),r2:roll3(f2),rt:roll3(tot),aa,raa:roll3(aa),blocks,rblocks:blocks.map(roll3),p1,p2,rp1:p1.map(roll3),rp2:p2.map(roll3),
  pot:okP?{f1:pot1.reduce((a,b)=>a+b,0),f2:pot2.reduce((a,b)=>a+b,0)}:null,six:{n:s6.length,f1:m(s6.map(x=>x.f1.sc).filter(v=>v!=null)),f2:m(s6.map(x=>x.f2.sc).filter(v=>v!=null)),tot:m(s6.map(x=>x.tot))},
  avgF:{f1:m(f1.filter(v=>v!=null)),f2:m(f2.filter(v=>v!=null)),tot:m(tot)},ec,rat:g.rs.filter(r=>r.rt!=null).map(r=>({r,y:r.rt}))}})}
function figures(s){const rs=sel(s),sub=!!(s.dist.length||s.end.length),E=rs.flatMap(r=>endsOf(r,s)),G=groups(rs,s);
 const eg=g=>s.split?E.filter(e=>e.r.m===g.k):E;
 const tot=rs.map(r=>r.t).filter(v=>v!=null),ea=E.map(e=>e.t).filter(v=>v!=null),aa=E.flatMap(e=>e.ar.map(aval)).filter(v=>v!=null);
 const sum={avgMain:sub?av(ea):av(tot),bestMain:sub?(ea.length?Math.max(...ea):null):(tot.length?Math.max(...tot):null),avgEnd:av(ea),avgArrow:av(aa)};
 const dls=[...new Set(E.map(e=>e.dl))].sort(dsort),perDist={};
 dls.forEach(dl=>perDist[dl]=G.map(g=>{const v=eg(g).filter(e=>e.dl===dl).map(e=>e.t).filter(x=>x!=null);return{n:v.length,avg:av(v)}}));
 const byDistArrow=G.map(g=>({g,v:dls.map(d=>av(eg(g).filter(e=>e.dl===d).flatMap(e=>e.ar.map(aval)).filter(x=>x!=null)))}));
 const ph=G.map(g=>{const h=[[],[]],t=[[],[],[]],per={};eg(g).forEach(e=>(per[e.r.a]=per[e.r.a]||[]).push(e));
  let s1=0,s2=0,nh=0;Object.values(per).forEach(L=>{const n=L.length,hh=Math.floor(n/2);if(hh){s1+=L.slice(0,hh).reduce((a,e)=>a+e.t,0);s2+=L.slice(n-hh).reduce((a,e)=>a+e.t,0);nh+=hh}L.forEach((e,i)=>t[Math.floor(i*3/n)].push(e.t))});h[0]=nh?[s1/nh]:[];h[1]=nh?[s2/nh]:[];
  const pm={};eg(g).forEach(e=>{if(e.t!=null)(pm[e.n]=pm[e.n]||[]).push(e.t)});
  const we=Object.entries(pm).filter(x=>x[1].length>=2).map(([n,v])=>[+n,av(v)]).sort((a,b)=>a[1]-b[1]||a[0]-b[0])[0];return{g,h:h.map(av),t:t.map(av),we}});
 const cons=G.map(g=>{const et=eg(g).map(e=>e.t).filter(x=>x!=null),aw=eg(g).flatMap(e=>e.ar.map(aval)).filter(x=>x!=null);return{g,n:et.length,esd:et.length>1?sdp(et):null,asd:aw.length>1?sdp(aw):null}});
 const rate=G.map(g=>({g,p:g.rs.map(r=>{const a=endsOf(r,s).flatMap(e=>e.ar.map(x=>x.toUpperCase()));return a.length?{x:+new Date(r.dt),y:100*a.filter(x=>x==='X'||x==='10').length/a.length,r}:null}).filter(Boolean)}));
 const roll={};[3,5,6].forEach(m=>{const f=ago(m);roll[m]=G.map(g=>{const v=g.rs.filter(r=>r.dt>=f).flatMap(r=>endsOf(r,s)).map(e=>e.t).filter(x=>x!=null);return v.length?av(v):null})});
 const pbs=[];G.forEach(g=>{const inSel=new Set(g.rs.map(r=>r.a)),keys=new Set(g.rs.map(r=>r.m+'|'+r.r)),best={};R.forEach(r=>{if(r.t==null)return;const k=r.m+'|'+r.r;if(!keys.has(k))return;if(best[k]!=null&&r.t>best[k]&&inSel.has(r.a))pbs.push({g,r,from:best[k]});if(best[k]==null||r.t>best[k])best[k]=r.t})});
 const rg={};rs.forEach(r=>(rg[r.r]=rg[r.r]||[]).push(r));
 const perRound=Object.entries(rg).map(([k,v])=>{const t=v.map(r=>r.t).filter(x=>x!=null);return{r:k,n:v.length,avg:av(t),best:t.length?Math.max(...t):null}}).sort((a,b)=>b.n-a.n||(a.r<b.r?-1:1));
 return{rs,sub,E,G,tot,ea,aa,sum,dls,perDist,byDistArrow,ph,cons,rate,roll,pbs,perRound,phil:philFig(s,G)}}
/* ---- end verbatim ---- */
/* Ranks data: Nathe from data/nathe_ad.json, every other tester with data from data/ad_<id>.json (built from scores.db).
   Coach's read stays Nathe-only (isMe). Juniors (under 18) see where they sit, never other juniors' names. */
const TID=()=>typeof TESTER!='undefined'&&TESTER?TESTER.id:'nathe';
const hasAD=()=>isMe()||(typeof TESTER!='undefined'&&TESTER&&TESTER.data&&TESTER.id!='nathe');
const adFile=()=>isMe()?'data/nathe_ad.json':'data/ad_'+TID()+'.json';
const load=()=>AD?Promise.resolve(AD):fetch(adFile(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(j){AD=j;AD.rank=AD.rank||{};AD.aa=AD.aa||{pos:[]};R=(j.rounds||[]).map(r=>({...r,m:ME})).sort((a,b)=>a.dt<b.dt?-1:1);EXPECT=j.expect||{}}return AD}).catch(()=>null);
const isFldR=r=>r.disc==='Field'||r.disc==='3D';
/* ---------- Coach's read (Stats) ---------- */
let CR={r:'',p:'12',inc:false};
function readFig(o){const from=o.p==='all'?'':ago(+o.p),s={a:[ME],r:[o.r],from,to:'',dist:[],end:[],split:true,metric:'t',inc:o.inc};
 const F=figures(s),P=F.phil[0]||null,E=F.E,ar=E.flatMap(e=>e.ar.map(x=>String(x).toUpperCase())),fld=F.rs.length>0&&F.rs.every(isFldR);
 const low=ar.filter(x=>{const v=aval(x);return v!=null&&v<=(fld?4:8)}).length,top=ar.filter(x=>x===(fld?'6':'X')).length;
 const pd=F.dls.map(d=>({d,avg:F.perDist[d][0]&&F.perDist[d][0].avg,n:F.perDist[d][0]?F.perDist[d][0].n:0})).filter(x=>x.avg!=null);
 const tr=(()=>{const v=R.filter(r=>r.rt!=null).slice(-6);if(v.length<6)return null;return{a:av(v.slice(0,3).map(r=>r.rt)),b:av(v.slice(3).map(r=>r.rt)),t:trendOf(R)}})();
 return{s,F,P,n:F.rs.length,fld,arrows:ar.length,low,top,pd,best:pd.length>1?pd.reduce((a,b)=>b.avg>a.avg?b:a):null,weak:pd.length>1?pd.reduce((a,b)=>b.avg<a.avg?b:a):null,esd:F.cons[0]&&F.cons[0].esd,tr,inc:F.rs.length?0:0,nInc:base(s).filter(r=>r.r===o.r&&isInc(r)).length}}
function coachRead(){if(!AD)return'';const rc={};R.filter(r=>!isInc(r)).forEach(r=>rc[r.r]=(rc[r.r]||0)+1);const yr=ago(12),rcy={};R.filter(r=>!isInc(r)&&r.dt>=yr).forEach(r=>rcy[r.r]=(rcy[r.r]||0)+1);
 const rounds=Object.keys(rc).sort((a,b)=>(rcy[b]||0)-(rcy[a]||0)||rc[b]-rc[a]||(a<b?-1:1));if(!CR.r||!rc[CR.r])CR.r=rounds[0];
 const X=readFig(CR),P=X.P,f1v=P&&P.avgF.f1,f2v=P&&P.avgF.f2,w=n=>n===1?'':'s',r1=v=>v==null?'–':(Math.round(v*10)/10).toString();
 const lines=[];
 if(X.tr){const d=X.tr.b-X.tr.a;lines.push(['Trend',d>1?`<b>Going up.</b> Your last 3 rated shoots averaged a rating of ${r1(X.tr.b)}, up from ${r1(X.tr.a)}.`:d<-1?`<b>Dipping.</b> Your last 3 rated shoots averaged ${r1(X.tr.b)}, down from ${r1(X.tr.a)}.`:`<b>Steady.</b> Your last 3 rated shoots averaged ${r1(X.tr.b)}, about the same as the 3 before (${r1(X.tr.a)}).`])}
 if(!X.n)lines.push(['Scores','No complete scores on this round in this time.']);else{
 if(f1v!=null&&f2v!=null)lines.push(['Flights',f2v>f1v+0.5?`You <b>finish stronger</b>: 2nd flight ${r1(f2v)} vs 1st ${r1(f1v)}. Your warm-up and first distance are where points go.`:f1v>f2v+0.5?`You <b>start stronger</b>: 1st flight ${r1(f1v)} vs 2nd ${r1(f2v)}. Stamina or focus late in the round is where points go.`:`Your two flights are <b>even</b> (${r1(f1v)} and ${r1(f2v)}).`]);
 if(X.best&&X.weak&&X.best.d!==X.weak.d)lines.push(['Distances',`Best at <b>${escH(X.best.d)}</b> (${r1(X.best.avg)} an end). Weakest at <b>${escH(X.weak.d)}</b> (${r1(X.weak.avg)} an end).`]);
 if(X.esd!=null)lines.push(['Consistency',`Your end scores usually land within about <b>${r1(X.esd)}</b> points of your average end. Smaller means steadier.`]);
 if(X.arrows)lines.push(['Arrows',`<b>${X.low}</b> of ${plN(X.arrows,'arrow','arrows')} (${Math.round(100*X.low/X.arrows)}%) were ${X.fld?'4s':'8s'} or lower. ${X.fld?'6s':'Xs'}: <b>${X.top}</b> (${r1(100*X.top/X.arrows)}%). ${X.low/X.arrows>0.2?'Cutting the low arrows is worth more than chasing '+(X.fld?'6s':'Xs')+'.':''}`]);
 if(P&&P.pot)lines.push(['Potential',`Add up your average for each end over your last 3 shoots and you get <b>${Math.round(P.pot.f1+P.pot.f2)}</b>.`]);else lines.push(['Potential','Needs 3 complete shoots of this round with matching ends.'])}
 return`<div class="card" id="coachread"><span class="kicker">What your scores say · Archer's Diary scores</span><h3 style="margin:2px 0 6px">How you're shooting</h3>
 <label for="crr" class="small">Round</label><select id="crr">${rounds.map(r=>`<option ${r===CR.r?'selected':''}>${escH(r)} (${rc[r]})</option>`).join('')}</select>
 <div class="zbar" style="justify-content:flex-start;margin:8px 0">${[['6','6 months'],['12','12 months'],['all','Since 2024']].map(([k,l])=>`<button class="zb${CR.p===k?' on':''}" data-crp="${k}">${l}</button>`).join('')}</div>
 <p class="small muted" style="margin:0 0 6px">${X.n} score${w(X.n)}${X.nInc&&!CR.inc?` · ${X.nInc} incomplete left out`:''}</p>
 ${lines.map(([k,t])=>`<div class="list-item"><span class="kicker" style="font-size:11px">${k}</span><div>${t}</div></div>`).join('')}
 <label class="small" style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="crinc" ${CR.inc?'checked':''} style="width:18px;height:18px">Include incomplete rounds</label>
 <p class="small muted" style="margin:6px 0 0">Same maths as Phil's coach page. Real scores only, from Archer's Diary.</p></div>`}
function adList(){if(!AD)return'';const L=R.slice().reverse();return`<div class="card" id="adlist"><details><summary><b>All my Archer's Diary scores</b> <span class="small muted">· ${L.length} compound since 2024</span></summary>${L.map(r=>`<div class="list-item row"><span style="flex:1;min-width:0">${escH(r.r)}<div class="small muted">${fmt(r.dt)} · ${escH(r.ev)}</div></span><span><b>${r.t??'–'}</b>${isInc(r)?' <span class="sample">Incomplete</span>':''}</span></div>`).join('')}<p class="small muted">Source: Archer's Diary. Kept separate from scores you shoot in the app.</p></details></div>`}
function bindRead(){const s=$('#crr');if(s)s.onchange=e=>{CR.r=e.target.value.replace(/ \(\d+\)$/,'');redo()};document.querySelectorAll('[data-crp]').forEach(b=>b.onclick=()=>{CR.p=b.dataset.crp;redo()});const c=$('#crinc');if(c)c.onchange=e=>{CR.inc=e.target.checked;redo()}}
function redo(){const el=$('#coachread');if(!el)return;const y=scrollY;el.outerHTML=coachRead();bindRead();scrollTo(0,y)}
const _stats=stats;stats=function(){_stats.apply(this,arguments);if(!isMe())return;load().then(()=>{if(typeof view!='undefined'&&view!='stats'||!AD||$('#coachread'))return;app.insertAdjacentHTML('afterbegin',coachRead()+adList());bindRead()})};
/* Coach's read for the Stats page: same maths, but fed the exact shoots the Stats round/shoot pickers chose (one source,
   so the shoot count matches every other card). Best-ends total replaces the old Potential: it adds your BEST score at each end
   over your last 3 shoots, so it can never come out below any of those scores (the old sum of averages dropped the middle end of odd-length rounds). */
function toAD(x){const ds=[];let c=null,k=0;x.ends.forEach((e,i)=>{const d=x.dists[i]||'';if(!c||c.d!==d){c={n:ds.length+1,d,f:'',t:0,e:[]};ds.push(c);k=0}k++;const t=e.reduce((a,b)=>a+(aval(b)||0),0);c.e.push([k,e.join(','),t]);c.t+=t});
 return{a:x.id,dt:x.date,ev:x.event,r:x.round,disc:x.field?'Field':'Outdoor',cl:'Open',t:x.score,rt:x.rating,m:ME,ds}}
window.coachReadFor=function(round,shoots,pot){const R0=R,E0=EXPECT;R=shoots.map(toAD).sort((a,b)=>a.dt<b.dt?-1:1);EXPECT={};try{
 const X=readFig({r:round,p:'all',inc:true}),P=X.P,f1v=P&&P.avgF.f1,f2v=P&&P.avgF.f2,r1=v=>v==null?'–':(Math.round(v*10)/10).toString(),w=n=>n===1?'':'s',L=[];
 if(X.tr){const d=X.tr.b-X.tr.a;L.push(['Trend (rating)',d>1?`<b>Going up.</b> Your last 3 rated shoots averaged a rating of ${r1(X.tr.b)}, up from ${r1(X.tr.a)}.`:d<-1?`<b>Dipping.</b> Your last 3 rated shoots averaged a rating of ${r1(X.tr.b)}, down from ${r1(X.tr.a)}.`:`<b>Steady.</b> Your last 3 rated shoots averaged a rating of ${r1(X.tr.b)}, about the same as the 3 before (${r1(X.tr.a)}).`])}
 if(f1v!=null&&f2v!=null)L.push(['First half vs second half',f2v>f1v+0.5?`You <b>finish stronger</b>: second half ${r1(f2v)} vs first half ${r1(f1v)} on average.`:f1v>f2v+0.5?`You <b>start stronger</b>: first half ${r1(f1v)} vs second half ${r1(f2v)} on average.`:`Your two halves are <b>even</b> (${r1(f1v)} and ${r1(f2v)} on average).`]);
 if(X.best&&X.weak&&X.best.d!==X.weak.d)L.push(['Distances',`Best at <b>${escH(X.best.d)}</b> (${r1(X.best.avg)} an end). Weakest at <b>${escH(X.weak.d)}</b> (${r1(X.weak.avg)} an end).`]);
 if(X.esd!=null)L.push(['Spread of your ends',`Your end scores usually land within about <b>${r1(X.esd)}</b> points of your average end. Smaller means steadier.`]);
 if(X.arrows)L.push(['Arrows',`<b>${X.low}</b> of ${plN(X.arrows,'arrow','arrows')} (${Math.round(100*X.low/X.arrows)}%) were ${X.fld?'4s':'8s'} or lower. ${X.fld?'6s':'Xs'}: <b>${X.top}</b> (${r1(100*X.top/X.arrows)}%). ${X.low/X.arrows>0.2?'Cutting the low arrows is worth more than chasing '+(X.fld?'6s':'Xs')+'.':''}`]);
 L.push(['Your best ends added up',pot?`<b>${pot.v}</b>: your best score at each end over your last ${plN(pot.n,'shoot','shoots')} (${pot.from.join(', ')}), added up. It's what you've already shot, end by end, on your good ends.`:'Needs 2 or more complete shoots of this round with end-by-end scores.']);
 return`<div class="card" id="coachread" data-round="${escH(round)}" data-n="${shoots.length}"><span class="kicker">What your scores say</span><h3 style="margin:2px 0 6px">How you're shooting · ${escH(round)}</h3><p class="small muted" style="margin:0 0 6px">${shoots.length} shoot${w(shoots.length)}, the same ones as the rest of this page.</p>
 ${L.map(([k,t])=>`<div class="list-item"><span class="kicker" style="font-size:11px">${k}</span><div>${t}</div></div>`).join('')}
 <p class="small muted" style="margin:6px 0 0">Same maths as Phil's coach page.</p></div>`}finally{R=R0;EXPECT=E0}};
/* ---------- Real rankings (Ranks) ---------- */
let RR='';
function rankRows(round){const rows=(AD.rank[round]||[]).slice().sort((a,b)=>b.s-a.s||(a.dt<b.dt?-1:a.dt>b.dt?1:0)||(a.n<b.n?-1:1));rows.forEach(r=>{r.rank=1+rows.filter(x=>x.s>r.s).length;r.eq=rows.filter(x=>x.s===r.s).length>1});return rows}
function gapRow(hid){const a=hid[0].rank,b=hid[hid.length-1].rank;return`<tr><td colspan="3" class="small muted" style="text-align:center">… ${hid.length} more archer${hid.length>1?'s':''} (${a===b?'#'+a:'#'+a+'–#'+b}) not shown</td></tr>`}
function rankTable(round){const all=rankRows(round),show=all.filter(r=>r.rank<=10||r.me);const out=[];let prev=-1;
 show.forEach(r=>{const i=all.indexOf(r),hid=all.slice(prev+1,i);if(hid.length)out.push(gapRow(hid));out.push(`<tr${r.me?' style="background:#13294b"':''}><td>${(r.eq?'=':'')+r.rank}</td><td style="text-align:left">${escH(r.n)}${r.me?' <b style="color:var(--blue)">you</b>':''}<div class="small muted">${escH(r.c||'')} · ${fmt(r.dt)}</div></td><td><b>${r.s}</b>${r.rt!=null?`<div class="small muted">rating ${r.rt}</div>`:''}</td></tr>`);prev=i});
 if(prev<all.length-1)out.push(gapRow(all.slice(prev+1)));return{all,html:out.join('')}}
const DISC={outdoor:'Outdoor target',indoor:'Indoor',field:'Field',clout:'Clout'};
function juniorRankCard(){const A=AD.rankAnon||{},rs=Object.keys(A).sort((a,b)=>A[b].of-A[a].of||(a<b?-1:1)),nat=(AD.nat||[]).filter(x=>/compound/i.test(x.division));
 const pos=(AD.aa.pos||[]).map(p=>{const m=p.match(/^(.*) #(\d+)$/);return m?`<b>#${m[2]}</b> ${escH(m[1])}`:escH(p)});
 return`<div class="card" id="realrank"><span class="kicker">Real rankings · Archery Australia · compound</span><h2 style="margin:4px 0">Where you stand</h2>
 ${pos.length?`<p style="margin:4px 0">Official AA top-30 lists: ${pos.join(', ')}</p>`:''}
 ${nat.length?`<div class="small" style="margin:6px 0 2px"><b>National rankings</b> (Archer's Diary, ${escH(fmt(AD.generated?AD.generated.slice(0,10):''))})</div>${nat.map(x=>`<div class="list-item row"><span>${DISC[x.discipline]||escH(x.discipline)} · ${escH(x.age_class+' '+x.gender)}</span><span><b>#${x.class_rank}</b></span></div>`).join('')}`:''}
 <h3 style="margin:14px 0 4px">Best score per round</h3><p class="small muted" style="margin:0 0 6px">Your best on each round since ${fmt(AD.window_from)}, and where it sits among the ranked junior compound archers who shot that round. Only your own scores are shown.</p>
 ${rs.length?rs.map(r=>`<div class="list-item row"><span>${escH((typeof SHEET_ALIAS!='undefined'&&SHEET_ALIAS[r])||r)}<div class="small muted">${fmt(A[r].dt)}</div></span><span><b>${A[r].best}</b> <span class="small muted">#${A[r].place} of ${A[r].of}</span></span></div>`).join(''):'<p class="small muted">No complete official rounds in this window yet.</p>'}</div>`}
function realRankCard(){if(!AD)return'<div class="card" id="realrank"><p class="small muted">Loading your rankings…</p></div>';
 if(AD.junior)return juniorRankCard();
 const rounds=Object.keys(AD.rank).sort((a,b)=>AD.rank[b].length-AD.rank[a].length||(a<b?-1:1));if(!RR||!AD.rank[RR])RR=rounds[0];
 const T=rankTable(RR),me=T.all.find(r=>r.me),nat=(isMe()?(typeof window._natRank!='undefined'?window._natRank:[]):(AD.nat||[])).filter(x=>/compound/i.test(x.division));
 const pos=(AD.aa.pos||[]).map(p=>{const m=p.match(/^(.*) #(\d+)$/);return m?`<b>#${m[2]}</b> ${escH(m[1])}`:escH(p)});
 return`<div class="card" id="realrank"><span class="kicker">Real rankings · Archery Australia · compound</span><h2 style="margin:4px 0">Where you stand</h2>
 ${pos.length?`<p style="margin:4px 0">Official AA ${isMe()?'top-10 list':'top-30 lists'}: ${pos.join(', ')}</p>`:''}
 ${nat.length?`<div class="small" style="margin:6px 0 2px"><b>National rankings</b> (Archer's Diary, ${escH(isMe()?(window._natAsOf?fmt(window._natAsOf):''):fmt(AD.generated?AD.generated.slice(0,10):''))})</div>${nat.map(x=>`<div class="list-item row"><span>${DISC[x.discipline]||escH(x.discipline)} · ${escH(x.age_class+' '+x.gender)}</span><span><b>#${x.class_rank}</b>${x.class_size?` <span class="small muted">of ${x.class_size}</span>`:''}</span></div>`).join('')}`:''}
 ${(()=>{const rk=typeof rankFor=='function'?rankFor(S.profile):null;return rk&&rk.state=='ranked'?`<div class="list-item row"><span>AA classification ${today().slice(0,4)} · ${escH(rk.disc)}</span><span><b>${escH(rk.aa)}</b>${rk.prov?' <span class="est">provisional</span>':''}</span></div>${rk.prov?`<p class="small muted" style="margin:2px 0 6px" id="wysprov">Provisional: your scores reach ${escH(rk.aa)}, but it ${aaNeedTxt(rk.missing)}.${rk.confirmed?` Confirmed so far: ${escH(rk.confirmed)}.`:''}</p>`:''}`:''})()}<h3 style="margin:14px 0 4px">Best score per round</h3><p class="small muted" style="margin:0 0 6px">Your best on the chosen round since ${fmt(AD.window_from)}, against archers on the official AA Open compound top-10 lists. Equal scores share a rank.</p>
 <select id="rrsel" aria-label="Round">${rounds.map(r=>`<option value="${escH(r)}" ${r===RR?'selected':''}>${escH((typeof SHEET_ALIAS!='undefined'&&SHEET_ALIAS[r])||r)}</option>`).join('')}</select>
 ${me?`<p style="margin:8px 0 4px">You're <b>${me.eq?'=':''}#${me.rank}</b> of ${T.all.length} on ${escH((typeof SHEET_ALIAS!='undefined'&&SHEET_ALIAS[RR])||RR)}.</p>`:''}
 <table class="small" style="width:100%;border-collapse:collapse"><tr><th>#</th><th style="text-align:left">Archer</th><th>Best</th></tr>${T.html}</table></div>`}
const _rw=window.EXTRA_VIEWS.rewards;window.EXTRA_VIEWS.rewards=function(){_rw.apply(this,arguments);if(!hasAD())return;const put=()=>{const old=$('#rankcard'),cur=$('#realrank');const h=realRankCard();if(cur)cur.outerHTML=h;else if(old)old.insertAdjacentHTML('beforebegin',h);else app.insertAdjacentHTML('afterbegin',h);if(old)old.remove();const rk=typeof rankFor=='function'?rankFor(S.profile):null,pl=document.querySelector('.pcard .pill');if(pl&&rk&&rk.state=='ranked'){pl.textContent=rk.aa;pl.className='pill t-none';pl.title='Archery Australia classification '+today().slice(0,4)+(rk.prov?' (provisional)':'')}const s=$('#rrsel');if(s)s.onchange=e=>{RR=e.target.value;put()}};
 Promise.all([load(),window._natRank||!isMe()?null:fetch('data/rankings.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(j){window._natRank=(j.archers||{})['Nathaniel Stride']||[];window._natAsOf=j.as_of}}).catch(()=>{})]).then(()=>{if(typeof view!='undefined'&&view!='rewards'&&view!='lab_ranks')return;put()});put()};
window.__REAL={load,readFig,rankRows,get R(){return R},get EXPECT(){return EXPECT},figures,trendOf,philFig,isInc,setCR:o=>Object.assign(CR,o)};
})();
