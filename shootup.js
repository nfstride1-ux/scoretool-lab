/* Vegas 300 + shoot-up ladder (20 Oct 2026), approved by Nathe from mock-ups.
   Stage 1, Vegas 300: 10 ends of 3 at 20 yd on the 40 cm Vegas 3-spot, X 10 9 8 7 6 M (X = 10), max 300. Line cutters score the
   higher ring (plotScore). Works solo and as a match-night round; match-night seeding splits ties on X count.
   Stage 2, shoot-up (Lancaster style): when a Vegas 300 match night has finished, the host can start a shoot-up. Seeded by score
   then X. Lowest seed shoots the next lowest, the winner moves up to the next seed, and so on to the final against seed 1.
   Each match: 4 ends of 3, total score. X = 11; the 12 dot (1.5 cm, top spot only, six o'clock on the 8/7 line) counts 12 only when
   'Call 12' was tapped before the shot, once per end. Max 136. Tie: 1-arrow shoot-offs, 12 in play (called) on arrows 1 and 2; still
   tied after the 3rd, the host picks the arrow closest to the X.
   Relay (same match topic as the match night): {k:'su',seeds} from the host, {k:'lm',i,e,c,so} from each archer for ladder match i
   (own arrows only, when they change), {k:'pk',i,w} host pick. Ids and nicknames only. Every phone works out the ladder itself, so it
   advances as results arrive. The shoot-up starts by itself once every archer (and at least the number of shooters the host set)
   has finished the 300; the host can force it with 'Start shoot-up now' (archers who didn't finish are left out of the seeding).
   Only the two archers in the current match can score it. One-phone mode (m.local): the host types 2-10 nicknames and scores
   everyone on this phone, offline; same ladder logic, no relay. */
/* Rule sets: the shoot-up code takes one, nothing is duplicated. Lancaster (standalone Vegas match night): 4x3, X=11, called 12 dot,
   up to 3 shoot-off arrows then host pick. League final (Onion Shed): 3x3, X=10, no 12, one shoot-off arrow each, higher arrow wins,
   same ring -> host picks closest to centre. */
const SU_LANC={ends:4,ape:3,xv:11,t12:true,so:'lanc'},SU_LEAGUE={ends:3,ape:3,xv:10,t12:false,so:'pick1'};
const SU_ENDS=4,SU_APE=3,SU_N=SU_ENDS*SU_APE;
const suR=m=>(m&&m.sur)||(m&&m.lg?SU_LEAGUE:SU_LANC),suMax=R=>R.ends*(R.t12?12+R.xv*(R.ape-1):R.xv*R.ape);
const suVal=(a,R=SU_LANC)=>a=='12'?(R.t12?12:0):a=='X'?R.xv:a=='M'?0:(+a||0);
const suSum=(L,R=SU_LANC)=>L.reduce((t,a)=>t+suVal(a,R),0);
const suIsV=m=>!!(m&&(m.cs||ROUNDS[m.round]&&ROUNDS[m.round].vegas));
/* casual shoot match play (casual.js, 21 Oct 2026): m.cs = the casual shoot code. Same ladder; the host also scores the name-only
   friends (m.nmo) in their matches. Labels say 'Match play'; the back button goes to the casual shoot. */
const suHostFor=(m,id)=>!!(m&&m.cs&&m.host==h2hMe()&&(m.nmo||[]).includes(id));const suLbl=m=>m&&m.cs?'Match play':'Shoot-up';
const suSt=(m,i,id)=>{m.lad=m.lad||{};const L=m.lad[i]=m.lad[i]||{};const s=L[id]=L[id]||{e:[],c:[],so:[]};s.e=s.e||[];s.c=s.c||[];s.so=s.so||[];return s};
const suPeek=(m,i,id)=>(((m.lad||{})[i]||{})[id])||{e:[],c:[],so:[]};
const suFlat=s=>(s.e||[]).flat();
/* one ladder match from both archers' arrows. Pure: used for the live view and the tests. */
function suEval(sa,sb,pick,A,B,R=SU_LANC){const N=R.ends*R.ape,fa=suFlat(sa),fb=suFlat(sb),ta=suSum(fa,R),tb=suSum(fb,R),na=fa.length,nb=fb.length,r={ta,tb,na,nb,winner:null,needPick:false,phase:'ends',soK:0};
 r.live=na+nb+(sa.so||[]).length+(sb.so||[]).length>0;r.endNo=Math.min(R.ends,Math.floor(Math.min(na,nb)/R.ape)+1);
 const ca=na+(sa.so||[]).length,cb=nb+(sb.so||[]).length;r.toShoot=cb<ca?B:A;
 if(na<N||nb<N)return r;if(ta!=tb){r.winner=ta>tb?A:B;r.phase='done';return r}
 const K=R.so=='pick1'?1:3;r.phase='so';for(let k=0;k<K;k++){const a=(sa.so||[])[k],b=(sb.so||[])[k];r.soK=k;if(a==null||b==null)return r;if(suVal(a,R)!=suVal(b,R)){r.winner=suVal(a,R)>suVal(b,R)?A:B;r.phase='done';return r}}
 r.soK=K;if(pick==A||pick==B){r.winner=pick;r.phase='done';return r}r.needPick=true;r.phase='pick';return r}
/* the whole ladder: match i = (i==0 ? lowest seed : winner of match i-1) v the next seed up. Final = last match, against seed 1. */
function suLadder(m){const S0=((m.su||{}).seeds)||[],n=S0.length,M=[];if(n<2)return M;
 for(let i=0;i<n-1;i++){const A=i==0?S0[n-1]:(M[i-1].res.winner||null),B=S0[n-2-i];
  const res=A?suEval(suPeek(m,i,A),suPeek(m,i,B),(m.pk||{})[i],A,B,suR(m)):{winner:null,live:false,phase:'wait',ta:0,tb:0,na:0,nb:0,endNo:1};M.push({i,A,B,res,fin:i==n-2})}
 return M}
const suDone=m=>{const L=suLadder(m);return!!(L.length&&L[L.length-1].res.winner)};
window.suKeepPolling=m=>suIsV(m)&&!m.closed&&!(m.su&&suDone(m));
window.suApply=function(m,d){if(!suIsV(m)||d.code!=m.code)return false;const me=h2hMe();
 if(d.k=='su'&&d.by==m.host&&Array.isArray(d.seeds)){const sd=d.seeds.filter(x=>typeof x=='string').slice(0,H2H_MAX);/* the host's seeding wins */if(JSON.stringify(sd)!=JSON.stringify((m.su||{}).seeds)){m.su={seeds:sd,t:d.t};return true}return false}
 if(d.k=='sm'&&Number.isInteger(d.i)&&d.i>=0&&d.i<H2H_MAX){const L=suLadder(m)[d.i];if(!L||!(d.by==m.host||d.by==L.A||d.by==L.B))return false;m.smt=m.smt||{};if((m.smt[d.i]||0)>=(d.t||0))return false;
  m.smt[d.i]=d.t||0;m.sm=m.sm||{};const v=typeof d.s=='string'&&(d.s==L.A||d.s==L.B)?d.s:null;if(v)m.sm[d.i]=v;else delete m.sm[d.i];return true}
 if(d.k=='lm'&&d.by&&d.by!=me&&Number.isInteger(d.i)&&d.i>=0&&d.i<H2H_MAX){if(d.nm)nmLearn(d.by,d.nm,d.nt,d.t);const cl=a=>Array.isArray(a)?a:[];
  /* one-phone scoring for this match: only the chosen scorer may post the other archer's arrows */
  const tg=typeof d.for=='string'?d.for:d.by,sc=(m.sm||{})[d.i],hf=!!(m.cs&&d.by==m.host&&(m.nmo||[]).includes(tg)&&!sc);if(tg!=d.by&&sc!=d.by&&!hf)return false;if(tg==d.by&&sc&&sc!=d.by)return false;
  m.lad=m.lad||{};m.lad[d.i]=m.lad[d.i]||{};m.lad[d.i][tg]={e:cl(d.e).slice(0,SU_ENDS).map(x=>cl(x).slice(0,SU_APE).map(String)),c:cl(d.c).slice(0,SU_ENDS),so:cl(d.so).slice(0,3).map(String)};return true}
 if(d.k=='pk'&&d.by==m.host&&Number.isInteger(d.i)&&typeof d.w=='string'){m.pk=m.pk||{};if(m.pk[d.i]!=d.w){m.pk[d.i]=d.w;return true}}
 return false};
const suMsg=(m,i,id)=>{id=id||h2hMe();const s=suPeek(m,i,id);return{k:'lm',code:m.code,i,by:h2hMe(),for:id,e:s.e,c:s.c,so:s.so,...h2hNm(),t:Date.now()}};
async function suPost(m,i,id){if(m.local)return;id=id||h2hMe();const o=suMsg(m,i,id),sig=JSON.stringify([o.e,o.c,o.so]),key=i+'|'+id;m.suSent=m.suSent||{};if(m.suSent[key]==sig)return;if(await h2hPost(h2hTopic(m.code),o)){m.suSent[key]=sig;save()}}
window.suSend=async function(m){if(!m.su||!m.lad)return;const me=h2hMe();for(const i in m.lad){const sc=(m.sm||{})[i];for(const id in m.lad[i])if(sc?sc==me:(id==me||suHostFor(m,id)))await suPost(m,+i,id)}};
/* seeded by 300 score then X (h2hBoard already sorts Vegas that way); only archers who finished */
const suSeedsNow=m=>h2hBoard(m).rows.filter(r=>r.done).map(r=>r.id);
function suBegin(m,seeds){m.su={seeds,t:Date.now()};save();if(!m.local&&m.host==h2hMe())h2hPost(h2hTopic(m.code),{k:'su',code:m.code,by:h2hMe(),seeds,t:Date.now()})}
/* automatic: every archer has finished (and at least the number of shooters set) */
function suAuto(m){if(!suIsV(m)||m.su||m.closed)return false;const b=h2hBoard(m),need=m.local?b.rows.length:Math.max(2,m.need||0);
 if(b.rows.length<need||b.rows.length<2||!b.rows.every(r=>r.done))return false;suBegin(m,b.rows.map(r=>r.id));return true}
window.suTick=async function(m){if(!suIsV(m))return false;const ch=suAuto(m);if(m.su)await suSend(m);return ch};window.suAuto=suAuto;
/* host: force it now (drop-outs who didn't finish are left out) */
function suStart(m){if(m.host!=h2hMe()||m.su)return;const seeds=suSeedsNow(m);if(seeds.length<2)return;suBegin(m,seeds);suLadderView(m.code)}
/* ---------- scoring my own ladder match ---------- */
/* the current match = the first one without a result. Only its two archers can score it (on one phone, the host scores both). */
const suCurI=L=>{const k=L.findIndex(x=>!x.res.winner);return k<0?null:k};
function suMine(m,i,id){const LL=suLadder(m),L=LL[i];id=id||h2hMe();return L&&L.A&&suCurI(LL)==i&&(L.A==id||L.B==id)&&(m.local||((m.sm||{})[i]?m.sm[i]==h2hMe():(id==h2hMe()||suHostFor(m,id))))&&!L.res.winner&&!L.res.needPick?L:null}
function suCur(s,R=SU_LANC){const n=suFlat(s).length;return n<R.ends*R.ape?Math.floor(n/R.ape):-1}
function suCanKey(m,i,k,id){const L=suMine(m,i,id);if(!L)return false;const me=id||h2hMe(),R=suR(m),s=suPeek(m,i,me),e=suCur(s,R);if(k=='12'&&!R.t12)return false;
 if(e>=0)return k!='12'||s.c[e]===-1;
 if(L.res.phase!='so')return false;if(R.so=='pick1')return s.so.length==0;const o=suPeek(m,i,me==L.A?L.B:L.A),kk=s.so.length;if(kk>2||kk>L.res.soK)return false;if(kk>0&&o.so[kk-1]==null)return false;return k!='12'||kk<2}
function suKey(code,i,k,id){const m=h2hGet(code);id=id||h2hMe();if(!m||!suCanKey(m,i,k,id))return false;const s=suSt(m,i,id),e=suCur(s,suR(m));
 if(e>=0){const E=s.e[e]=s.e[e]||[];E.push(k);if(s.c[e]===-1)s.c[e]=E.length-1}else s.so.push(k);save();suPost(m,i,id);if(window._suAct)delete window._suAct[code+'|'+i];suMatchView(code,i);return true}
function suCall(code,i,id){const m=h2hGet(code);id=id||h2hMe();if(!m||!suMine(m,i,id)||!suR(m).t12)return false;const s=suSt(m,i,id),e=suCur(s,suR(m));if(e<0||s.c[e]!=null)return false;s.c[e]=-1;save();suPost(m,i,id);suMatchView(code,i);return true}
function suUndo(code,i,id){const m=h2hGet(code);id=id||h2hMe();if(!m||!suMine(m,i,id))return;const s=suSt(m,i,id);if(s.so.length)s.so.pop();else{let e=s.e.length-1;while(e>=0&&!(s.e[e]||[]).length)e--;if(e<0){if(s.c[0]===-1)delete s.c[0];return}
 const E=s.e[e];E.pop();if(s.c[e]===E.length)s.c[e]=-1;if(!E.length)s.e.length=e}save();suPost(m,i,id);suMatchView(code,i)}
function suPick(code,i,w){const m=h2hGet(code);if(!m||m.host!=h2hMe())return;m.pk=m.pk||{};m.pk[i]=w;save();h2hPost(h2hTopic(code),{k:'pk',code,i,by:h2hMe(),w,t:Date.now()});suMatchView(code,i)}
/* how the current match is scored: both archers on one phone (the chooser's) or each on their own phone. Host or either archer
   chooses, before the first arrow of that match. */
function suSetMode(code,i,mode){const m=h2hGet(code);if(!m||m.local)return false;const LL=suLadder(m),L=LL[i],me=h2hMe();if(!L||!L.A||suCurI(LL)!=i||L.res.live)return false;
 if(!(me==m.host||me==L.A||me==L.B))return false;m.sm=m.sm||{};m.smt=m.smt||{};if(mode=='one')m.sm[i]=me==L.A||me==L.B||(m.cs&&me==m.host)?me:L.A;else delete m.sm[i];
 const t=Date.now();m.smt[i]=t;save();h2hPost(h2hTopic(code),{k:'sm',code,i,by:me,s:m.sm[i]||'',t});if($('#suview'))suMatchView(code,i);return true}
function suModeBind(m,i){if(m.local)return;const LL=suLadder(m),L=LL[i],me=h2hMe();if(!L||!L.A||L.res.winner)return;const sc=(m.sm||{})[i],box=document.querySelector('#suview .card:not(.dark)');if(!box)return;
 const can=suCurI(LL)==i&&!L.res.live&&(me==m.host||me==L.A||me==L.B);
 box.insertAdjacentHTML('afterbegin',`<div id="sumode"><p class="small" style="margin:0 0 6px">${sc?'Scored on one phone: <b>'+suName(sc)+'</b>\'s phone, both archers.':'Each archer scores on their own phone.'}</p>${can?`<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-start;margin-bottom:8px"><button class="btn ghost${sc?' on':''}" data-sumode="one">Both on this phone</button><button class="btn ghost${sc?'':' on'}" data-sumode="own">Each on own phone</button></div>`:''}</div>`);
 box.querySelectorAll('[data-sumode]').forEach(b=>b.onclick=()=>suSetMode(m.code,i,b.dataset.sumode))}
window.suSetMode=suSetMode;window.suKey=suKey;window.suCall=suCall;window.suUndo=suUndo;window.suPick=suPick;window.suStart=suStart;window.suLadder=suLadder;window.suEval=suEval;
/* ---------- views ---------- */
let suM=null;const suName=id=>id?esc((suM&&suM.names&&suM.names[id])||h2hShort(id)):'';
const suSeedOf=(m,id)=>((m.su||{}).seeds||[]).indexOf(id)+1;
const suTitle=(L,n)=>L.fin?'Final':'Match '+(L.i+1);
/* the shoot-up face, to scale in cm: 40 cm Vegas 3-spot, spots 20 cm across (rings 2 cm apart, X 2 cm), 12 dot 1.5 cm on the top spot */
/* vert: the league final is shot on the vertical 3-spot (spots in a column, no 12 dot) */
function suFace(dot=true,vert=false){const sp=vert?[[11,11,0],[11,32,0],[11,53,0]]:[[20,10.5,1],[9.5,29.5,0],[30.5,29.5,0]],C=['#1e5bb8','#d62828','#d62828','#f5c518','#f5c518'];
 return`<svg class="su-face${vert?' su-vert':''}" viewBox="${vert?'0 0 22 64':'0 0 40 40'}" role="img" aria-label="${vert?'Vertical 3-spot':'Vegas 3-spot with the 12 dot on the top spot'}">${sp.map(([x,y,t])=>[10,8,6,4,2].map((r,j)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${C[j]}" stroke="#0b1530" stroke-width="0.08"/>`).join('')+`<circle cx="${x}" cy="${y}" r="1" fill="none" stroke="#0b1530" stroke-width="0.08"/>`+(t&&dot?`<circle id="su12" cx="${x}" cy="${y+6}" r="0.75" fill="#fff" stroke="#0b1530" stroke-width="0.1"/>`:'')).join('')}</svg>`}
function suLadderView(code){const m=h2hGet(code);if(!m||!m.su)return;suM=m;const RS=suR(m);window._suBoard=null;window._suv={code,i:null};const L=suLadder(m),b=h2hBoard(m),rows=b.rows.slice().sort((x,y)=>suSeedOf(m,x.id)-suSeedOf(m,y.id)),done=suDone(m),fin=L[L.length-1];
const cI=suCurI(L);
 const card=x=>{const r=x.res,tag=x.i===cI?`<span class="su-now">${r.live?'Now shooting':'Next'}</span> `:'',st=r.winner?`<b class="su-res">▲ ${suName(r.winner)} ${x.fin?(m.cs?'wins match play':'wins the shoot-up'):'wins, moves up'}</b>`:x.A&&r.needPick?'<span class="su-live">LIVE</span> host to judge closest to X':x.A&&r.live?`<span class="su-live">LIVE</span> ${r.phase=='so'?'Shoot-off':'End '+r.endNo+' of '+RS.ends}`:'<span class="muted">waiting</span>';
  const who=(id,t,alt)=>`<div class="row su-who"><span>${id?suName(id):`<span class="muted">${alt}</span>`} <span class="small muted">${id?'seed '+suSeedOf(m,id):''}</span></span><b>${x.A&&(x.res.na+x.res.nb)?t:''}</b></div>`;
  return`<button class="su-card${x.i===cI?' live':''}${r.winner?' done':''}" data-sui="${x.i}"><span class="kicker">${suTitle(x,L.length)}</span>${who(x.B,r.tb,'')}${who(x.A,r.ta,'Winner of match '+x.i)}<div class="small">${tag}${st}</div></button>`};
 app.innerHTML=`<div id="suview"><div class="card dark"><span class="kicker">${suLbl(m)} · ${esc(window.rdLabel?rdLabel(m.round):m.round)}</span><h1>${done?suLbl(m)+' result':suLbl(m)+' ladder'}</h1>
 <p class="small" style="margin:0">${m.lg?'Final shoot-up. ':''}Each match: ${RS.ends} ends of ${RS.ape}, total score.${RS.keys&&!RS.keys.includes('X')?'':' X scores '+RS.xv+'.'}${RS.t12?' The 12 dot counts only when called, once per end.':' No 12 dot.'}</p>${done?`<p style="font-size:22px;font-weight:800;margin:6px 0 0">▲ ${suName(fin.res.winner)} wins</p>`:''}</div>
 <div class="card"><h3>Seeding</h3><table class="ad-tab su-seed" style="width:100%"><thead><tr><th>Seed</th><th>Archer</th><th>${m.lg||m.cs?'Total':'300'}</th><th>X</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${suSeedOf(m,r.id)}</td><td>${esc(r.nm)}${r.me?' (you)':''}</td><td>${r.tot}</td><td>${r.x}</td></tr>`).join('')}</tbody></table></div>
 <div class="card"><h3>${suLbl(m)} order</h3><p class="small muted" style="margin:0 0 6px">Lowest seed starts at the bottom; each winner moves up to the next seed, final at the top.</p><div class="su-ladder">${L.slice().reverse().map(card).join('<div class="su-up small">↑ winner moves up</div>')}</div>
 <p class="small muted">Tap a match to watch it, or to score if you're in it.</p><div class="row" style="gap:6px;justify-content:flex-start;flex-wrap:wrap"><button class="btn ghost" id="surf">Refresh now</button><button class="btn ghost" id="suback">${m.cs?'Back to the shoot':'Leaderboard'}</button></div></div></div>`;
 app.querySelectorAll('[data-sui]').forEach(x=>x.onclick=()=>suMatchView(code,+x.dataset.sui));$('#surf').onclick=()=>h2hTick(true);if(m.local)$('#surf').remove();$('#suback').onclick=()=>{if(m.cs&&window.csView)return csView(m.cs);if(m.lg&&window.lgView)return lgView(m.lg);window._suBoard=code;h2hView(code)}}
function suMatchView(code,i){const m=h2hGet(code);if(!m||!m.su)return;suM=m;const LL=suLadder(m),L=LL[i];if(!L)return suLadderView(code);window._suv={code,i};const r=L.res,me=h2hMe(),host=m.host==me,RS=suR(m),sc=(m.sm||{})[i],one=!!(m.local||(sc&&sc==me)||(!sc&&(suHostFor(m,L.A)||suHostFor(m,L.B))));
 const ctrl=one?[L.A,L.B].filter(x=>x&&suMine(m,i,x)):(suMine(m,i)?[me]:[]),A0=(window._suAct||{})[code+'|'+i],act=ctrl.includes(A0)?A0:ctrl.includes(r.toShoot)?r.toShoot:ctrl[0],mine=!!act;
 const callFor=id=>{if(!RS.t12)return'';const s=suPeek(m,i,id),e=suCur(s,RS);if(e<0)return'';const c=s.c[e];return`<p class="small su-call" data-sucs="${esc(id)}">${c==null?'12 call: available this end':c===-1?'12 call: called for the next arrow':'12 call: used'}</p><button class="btn ghost full su-callb" data-sucall="${esc(id)}" ${c!=null?'disabled':''}>Call 12</button>`};
 const panel=(id,t,alt)=>{if(!id)return`<div class="su-panel"><b class="muted">${alt}</b><p class="small muted">Waiting for the match below.</p></div>`;const s=suPeek(m,i,id),lead=r.winner?r.winner==id:(L.A&&t>(id==L.A?r.tb:r.ta));
  return`<div class="su-panel${!r.winner&&L.A&&(one&&act?act==id:r.toShoot==id)?' shoot':''}${r.winner==id?' win':''}" data-suid="${esc(id)}"><div class="row"><b>${lead?'▲ ':''}${suName(id)}${id==me?' (you)':''}</b><span class="small">seed ${suSeedOf(m,id)}</span></div>
  <table class="su-ends">${Array.from({length:RS.ends},(_,e)=>e).map(e=>{const E=(s.e||[])[e]||[];return`<tr><td class="small">End ${e+1}</td><td>${E.map(a=>`<span class="su-a">${esc(a)}</span>`).join('')}${s.c&&s.c[e]!=null&&s.c[e]>=0?' <span class="small">(12 called)</span>':''}</td><td><b>${E.length?suSum(E,RS):''}</b></td></tr>`}).join('')}
  ${(s.so||[]).length?`<tr><td class="small">Shoot-off</td><td>${s.so.map(a=>`<span class="su-a">${esc(a)}</span>`).join('')}</td><td></td></tr>`:''}</table><div class="row"><span class="small">Total</span><b class="su-tot">${t}</b></div>${!r.winner&&L.A&&r.toShoot==id?'<div class="small su-next">To shoot</div>':''}${ctrl.includes(id)?callFor(id):''}</div>`};
 let ctl='';if(r.winner)ctl=`<p class="su-res" style="font-size:20px;font-weight:800">▲ ${suName(r.winner)} ${L.fin?(m.cs?'wins match play':'wins the shoot-up'):'wins, moves up'}</p>`;
 else if(r.needPick)ctl=host?`<p>${RS.so=='pick1'?'Still tied after the shoot-off arrow. Tap whose arrow was closest to centre:':'Still tied after 3 shoot-off arrows. Pick the arrow closest to the X:'}</p><div class="row" style="gap:6px"><button class="btn" data-supk="${esc(L.A)}">${suName(L.A)}</button><button class="btn" data-supk="${esc(L.B)}">${suName(L.B)}</button></div>`:'<p>Still tied after the shoot-off. Waiting for the host to judge closest to centre.</p>';
 else if(mine){const s=suPeek(m,i,act),e=suCur(s,RS),so=e<0,keys=RS.keys||(RS.t12?['12']:[]).concat(['X','10','9','8','7','6','M']);
  ctl=`${m.cs?'':suFace(RS.t12,!!m.lg)}${one?`<div class="row lc-chips" style="gap:6px;justify-content:center">${ctrl.map(id=>`<button class="lc-chip${id==act?' on':''}" data-suact="${esc(id)}">${suName(id)}</button>`).join('')}</div>`:''}
  <p class="small" id="sucs" style="text-align:center;margin:6px 0">${one?'Scoring <b>'+suName(act)+'</b>. ':''}${so?(RS.so=='pick1'?'Shoot-off: one arrow each. Higher arrow wins; same ring, the host picks closest to centre.':s.so.length<2?'Shoot-off arrow '+(s.so.length+1)+': 12 in play (called).':'Shoot-off arrow 3: no 12.'):`End ${e+1} of ${RS.ends}, arrow ${(s.e[e]||[]).length+1}.${RS.t12?' A 12-dot hit without a call scores the ring it lies in.':''}`}${so&&r.phase!='so'?' Waiting for the other archer.':''}</p>
  <div class="ad-pad su-pad" style="--cols:${keys.length}">${keys.map(k=>`<button class="${k=='12'?'su-k12':RS.fld?(k=='M'?'k-m':+k>=5?'k-y':'k-k'):col(k)}" data-suk="${k}" aria-label="score ${k}" ${suCanKey(m,i,k,act)?'':'disabled'}>${k}</button>`).join('')}</div><button class="btn ghost" id="suundo" style="margin-top:6px">Undo</button>`}
 else ctl=L.A&&suCurI(LL)==i?'<p class="small muted">Watching live. Only the two archers in this match can score it.</p>':L.A?'<p class="small muted">Result in.</p>':'<p class="small muted">Waiting for the match below to finish.</p>';
 if(r.winner&&suCurI(LL)!=null)ctl+=`<button class="btn alt" id="sunext" style="margin-top:6px">Next match</button>`;
 app.innerHTML=`<div id="suview" data-sui="${i}"><div class="card dark"><span class="kicker">${suLbl(m)} · ${suTitle(L)}</span><h1>${L.A?`${suName(L.A)} v ${suName(L.B)}`:suTitle(L)}</h1>
 <p class="small" style="margin:0">${r.phase=='so'||r.needPick?'Shoot-off':r.winner?'Result':'End '+r.endNo+' of '+RS.ends} · total score · X ${RS.xv}${RS.t12?' · 12 when called':''} · max ${suMax(RS)}</p></div>
 <div class="su-panels">${panel(L.A,r.ta,'Winner of match '+i)}${panel(L.B,r.tb,'')}</div><div class="card">${ctl}
 <div class="row" style="gap:6px;justify-content:flex-start;flex-wrap:wrap;margin-top:8px"><button class="btn ghost" id="sulad">Ladder</button><button class="btn ghost" id="surf">Refresh now</button></div></div></div>`;
 app.querySelectorAll('[data-suk]').forEach(b=>b.onclick=()=>suKey(code,i,b.dataset.suk,act));app.querySelectorAll('[data-sucall]').forEach(b=>b.onclick=()=>suCall(code,i,b.dataset.sucall));const u=$('#suundo');if(u)u.onclick=()=>suUndo(code,i,act);
 app.querySelectorAll('[data-suact]').forEach(b=>b.onclick=()=>{window._suAct=window._suAct||{};window._suAct[code+'|'+i]=b.dataset.suact;suMatchView(code,i)});
 const nx=$('#sunext');if(nx)nx.onclick=()=>suMatchView(code,suCurI(suLadder(m)));
 app.querySelectorAll('[data-supk]').forEach(b=>b.onclick=()=>suPick(code,i,b.dataset.supk));$('#sulad').onclick=()=>suLadderView(code);$('#surf').onclick=()=>h2hTick(true);if(m.local)$('#surf').remove();suModeBind(m,i)}
window.suLadderView=suLadderView;window.suMatchView=suMatchView;
window.suRefresh=()=>{const v=window._suv;if(!v)return;if(v.i==null)suLadderView(v.code);else suMatchView(v.code,v.i)};
/* match-night leaderboard: Start shoot-up / Close for the host once everyone has finished a Vegas 300 */
const _suVG=h2hViewG;window._suShown=window._suShown||{};h2hViewG=function(m){if(suIsV(m)){suAuto(m);if(m.su&&window._suBoard!=m.code)return suLadderView(m.code)}_suVG(m);if(m.su){const h=document.querySelector('#h2hview h1');if(h&&h.textContent=='Final results')h.textContent='300 results'}if(m.local&&window.lcDecorate)lcDecorate(m);if(!suIsV(m))return;const row=$('#h2hout')&&$('#h2hout').parentNode;if(!row)return;const b=h2hBoard(m),fins=b.rows.filter(r=>r.done).length,host=m.host==h2hMe();
 let h='';if(m.su)h=`<button class="btn alt" id="suopen">${suDone(m)?'Shoot-up result':'Open shoot-up ladder'}</button>`;else if(!m.closed&&host&&fins>=2)h='<button class="btn ghost" id="sustart">Start shoot-up now</button>'+($('#h2hclose')?'':'<button class="btn ghost" id="suclose">Close match</button>');
 row.insertAdjacentHTML('afterbegin',h);if(!m.closed&&!m.su)row.insertAdjacentHTML('beforebegin',`<p class="small" id="suwait">The shoot-up starts by itself when every archer${m.need&&!m.local?' ('+m.need+' shooters)':''} has finished.${host&&!m.local?' Start it now if someone drops out; anyone not finished is left out.':''}</p>`);
 const o=$('#suopen');if(o)o.onclick=()=>suLadderView(m.code);const st=$('#sustart');if(st)st.onclick=()=>{if(b.rows.some(r=>!r.done)&&!confirm('Start the shoot-up now? Archers who haven\'t finished are left out.'))return;suStart(m)};
 const cl=$('#suclose');if(cl)cl.onclick=()=>{if(!confirm('Close the match without a shoot-up?'))return;m.closed=true;save();h2hPost(h2hTopic(m.code),{k:'cl',code:m.code,by:h2hMe(),t:Date.now()});h2hView(m.code)}};
/* ---------- Stage 1: Vegas 300 scorer extras (face fixed to the Vegas 3-spot, end counter, Ends so far table) ---------- */
const _suScore=score;score=function(){const R=cur&&ROUNDS[cur.round];if(R&&R.vegas){const f=R.league?'vert':'vegas';/* league 300: vertical 3-spot only */if(cur.face3!=f){cur.face3=f;save()}}const out=_suScore.apply(this,arguments);try{if(R&&R.vegas&&app.querySelector('.ad-pad'))vgExtras(R)}catch(e){}return out};
function vgExtras(R){const f=$('#face3');if(f)f.remove();['vghead','vgtab'].forEach(id=>{const x=document.getElementById(id);if(x)x.remove()});
 const E=cur.ends.filter(e=>e&&e.length),last=cur.ends[cur.ends.length-1]||[],ei=Math.min(R.ends-1,fix?fix[0]:last.length==R.ape?cur.ends.length:cur.ends.length-1),e=cur.ends[ei]||[];
 const top=app.querySelector('.ad')||app.firstElementChild;if(top)top.insertAdjacentHTML('beforebegin',`<div class="card vg-head" id="vghead"><div class="row"><b>${esc(window.rdLabel?rdLabel(cur.round):cur.round)}</b><span class="small">${R.blocks[0].dist} ${R.blocks[0].unit} · 40 cm ${R.league?'vertical':'Vegas'} 3-spot</span></div><div class="row"><span class="small">10 ends of 3 · X scores 10 · max 300</span><b id="vgend">End ${ei+1} of ${R.ends}</b></div>
 <div class="vg-slots" aria-label="arrows this end">${[0,1,2].map(k=>`<span class="vg-slot${e[k]?' on':''}">${e[k]?esc(e[k]):''}</span>`).join('')}</div></div>`);
 let run=0;const rows=E.map((x,k)=>{const s=endSum(x);run+=s;return`<tr><td>${k+1}</td>${[0,1,2].map(j=>`<td>${esc(x[j]||'')}</td>`).join('')}<td><b>${s}</b></td><td>${run}</td><td>${x.filter(a=>a=='X').length}</td></tr>`});
 const pad=app.querySelector('.ad-pad'),host=(pad&&pad.closest('.ad'))||app;host.insertAdjacentHTML('beforeend',`<div class="card" id="vgtab"><h3>Ends so far</h3><table class="ad-tab vg-tab" style="width:100%"><thead><tr><th>End</th><th>1</th><th>2</th><th>3</th><th>Score</th><th>Total</th><th>X</th></tr></thead><tbody>${rows.join('')||'<tr><td colspan="7" class="small muted">No ends yet.</td></tr>'}</tbody></table><p class="small">Total <b id="vgtot">${run}</b> of 300 · X ${E.flat().filter(a=>a=='X').length}</p></div>`)}

/* ---------- one-phone mode: the host scores everyone, offline (no invites, no relay) ---------- */
function lcCreate(raw){const err=t=>{const e=$('#h2hnerr');if(e)e.textContent=t?'⚠ '+t:'';return false},N=raw.map(nmClean);
 if(N.length<2||N.length>H2H_MAX)return err(`Add 2 to ${H2H_MAX} shooters.`);const seen=new Set();
 for(let k=0;k<N.length;k++){const c=nmCheck(N[k],null,false);if(!c.ok)return err(`Shooter ${k+1}: ${c.msg}`);const lo=c.n.toLowerCase();if(seen.has(lo))return err(`Shooter ${k+1}: that name is already in this match.`);seen.add(lo);N[k]=c.n}
 err('');const ids=N.map((_,k)=>'p'+(k+1)),m={code:'L'+h2hCode(),local:1,g:1,round:$('#h2hrd').value,mode:'total',host:h2hMe(),a:h2hMe(),opp:h2hMe(),order:ids,names:{},ops:{},inv:[],created:Date.now(),status:'active'};
 ids.forEach((id,k)=>{m.names[id]=N[k];m.ops[id]={ends:[],done:false}});h2hAll().push(m);save();h2hView(m.code);return true}
window.lcCreate=lcCreate;
const lcR=m=>ROUNDS[m.round]||{ends:10,ape:3};
/* Vegas: 3-spot keys; other indoor rounds: the full 40 cm face */
const lcKeys=m=>lcR(m).vegas?['X','10','9','8','7','6','M']:['X','10','9','8','7','6','5','4','3','2','1','M'];
function lcActive(m){window._lcAct=window._lcAct||{};const a=window._lcAct[m.code];if(a&&m.ops[a]&&!m.ops[a].done)return a;const R=lcR(m),open=m.order.filter(id=>!m.ops[id].done);if(!open.length)return null;
 return open.reduce((b,id)=>m.ops[id].ends.filter(e=>e.length==R.ape).length<m.ops[b].ends.filter(e=>e.length==R.ape).length?id:b,open[0])}
function lcKey(code,id,k){const m=h2hGet(code);if(!m||!m.local||m.closed||m.su)return false;const o=m.ops[id],R=lcR(m);if(!o||o.done||!lcKeys(m).includes(k))return false;
 let E=o.ends[o.ends.length-1];if(!E||E.length>=R.ape){E=[];o.ends.push(E)}E.push(k);
 if(E.length==R.ape){if(o.ends.length>=R.ends)o.done=true;/* card goes round the line: next archer with the fewest ends */window._lcAct=window._lcAct||{};const L=m.order,s=L.indexOf(id);
  window._lcAct[code]=null;for(let j=1;j<=L.length;j++){const n=L[(s+j)%L.length];if(!m.ops[n].done){window._lcAct[code]=n;break}}}
 save();h2hView(code);return true}
function lcUndo(code,id){const m=h2hGet(code);if(!m||!m.local||m.su)return;const o=m.ops[id];if(!o)return;let E=o.ends[o.ends.length-1];if(E&&!E.length){o.ends.pop();E=o.ends[o.ends.length-1]}if(!E)return;E.pop();if(!E.length)o.ends.pop();o.done=false;save();h2hView(code)}
window.lcKey=lcKey;window.lcUndo=lcUndo;
function lcDecorate(m){['#h2hback','#h2hrf'].forEach(q=>{const x=$(q);if(x)x.remove()});const cd=$('#h2hcode');if(cd)cd.closest('p').remove();const ln=$('#h2hlink');if(ln)ln.closest('.row').remove();
 const k=document.querySelector('#h2hview .kicker');if(k)k.textContent=k.textContent.replace('Match night','One phone');
 if(m.closed||m.su||h2hBoard(m).fin)return;const R=lcR(m),a=lcActive(m);if(!a)return;const o=m.ops[a],E=o.ends[o.ends.length-1],cur3=E&&E.length<R.ape?E:[],en=cur3.length||!E?o.ends.length+(E&&E.length<R.ape?0:1):o.ends.length+1;
 const card=`<div class="card" id="lccard"><span class="kicker">Score card</span><div class="row lc-chips" style="gap:6px;flex-wrap:wrap;justify-content:flex-start">${m.order.map(id=>{const x=m.ops[id],n=x.ends.filter(e=>e.length==R.ape).length;return`<button class="lc-chip${id==a?' on':''}" data-lcid="${esc(id)}">${esc(m.names[id])} <span class="small">${x.done?'finished':n+'/'+R.ends}</span></button>`}).join('')}</div>
 <p style="margin:8px 0 4px"><b>${esc(m.names[a])}</b> · End ${Math.min(R.ends,en)} of ${R.ends}</p><div class="vg-slots">${Array.from({length:R.ape},(_,j)=>`<span class="vg-slot${cur3[j]?' on':''}">${cur3[j]?esc(cur3[j]):''}</span>`).join('')}</div>
 <div class="ad-pad lc-pad" style="--cols:${Math.min(7,lcKeys(m).length)};margin-top:8px">${lcKeys(m).map(k=>`<button class="${col(k)}" data-lck="${k}" aria-label="score ${k}">${k}</button>`).join('')}</div><button class="btn ghost" id="lcundo" style="margin-top:6px">Undo</button></div>`;
 const d=document.querySelector('#h2hview .card.dark');if(d)d.insertAdjacentHTML('afterend',card);
 app.querySelectorAll('[data-lcid]').forEach(b=>b.onclick=()=>{window._lcAct=window._lcAct||{};window._lcAct[m.code]=b.dataset.lcid;h2hView(m.code)});
 app.querySelectorAll('[data-lck]').forEach(b=>b.onclick=()=>lcKey(m.code,a,b.dataset.lck));$('#lcundo').onclick=()=>lcUndo(m.code,a)}
window.lcDecorate=lcDecorate;
