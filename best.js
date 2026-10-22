/* My best scores: every Archer's Diary scoresheet for Nathe (data/my_scoresheets.json, end by end, real data only)
   merged with the official results already in the app (archer_scores.csv). One drop-down, grouped by discipline,
   best full round per round name; opening it shows the ends. Can be used as the ghost in a Ghost match. */
(function(){
let BS=null;
const isMe=()=>{const p=String(S.profile||'').toLowerCase();return p.includes('stride')&&p.includes('nath')};
fetch('data/my_scoresheets.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{BS=j;if(typeof view!='undefined'&&view=='stats'&&$('#bscard'))stats()}).catch(()=>{});
const BOW=d=>(String(d||'').match(/Compound|Recurve|Longbow|Barebow/i)||['Other'])[0].replace(/^./,c=>c.toUpperCase());
const DISC=['Outdoor','Indoor','Field','Clout'],DN={Outdoor:'Outdoor target',Indoor:'Indoor',Field:'Field',Clout:'Clout'};
/* Archer's Diary round -> ScoreTool round with the same ends (for Ghost match). 1440s shot in 3-arrow ends at 50/30 m are paired into 6s. */
const GHOST_MAP={'WA 90/1440':'WA 90/1440 (90/70/50/30m)','WA 70/1440':'WA 70/1440 (70/60/50/30m)','WA 60/1440':'WA 60/1440 (60/50/40/30m)',
 'WA 70/720':'WA 720 (70m)','WA 60/720':'WA 720 (60m)','WA 50/720':'WA 720 (50m Compound)','WA 60/900 (Canberra)':'WA 60/900 (60/50/40m)',
 'Short Canberra':'Short Canberra (50/40/30m)','Junior Canberra':'Junior Canberra (40/30/20m)','WA Indoor 18m':'Indoor WA 18m','WA Indoor 25m':'Indoor WA 25m',
 'Field 24Mk Red':'WA Field 24 Marked','Field Red 24t MK':'WA Field 24 Marked','2014 AWA Field Course Red':'WA Field 24 Marked','AWA Unmarked Field Course Red':'WA Field 24 Unmarked'};
const v=a=>a=='X'?10:a=='M'||!a?0:+a;
const fmt=d=>{const x=new Date(d+'T00:00');return isNaN(x)?d:x.getDate()+' '+x.toLocaleString('en-AU',{month:'short'})+' '+x.getFullYear()};
function entries(){if(!BS||!isMe())return[];const L=BS.sheets.map(s=>({...s,bow:BOW(s.div),src:'ad'}));
 /* keep results already in the app that Archer's Diary MyEvents doesn't list (same date + score = same shoot) */
 const seen=new Set(L.map(s=>s.d+'|'+s.sc));
 (typeof findReal=='function'?findReal(S.profile||''):[]).forEach(r=>{const d=normDate(r.date);if(seen.has(d+'|'+r.score))return;seen.add(d+'|'+r.score);
  const ind=/indoor/i.test(r.round),fld=/field/i.test(r.round),cl=/clout/i.test(r.round);
  L.push({d,ev:r.event,club:r.club,disc:cl?'Clout':fld?'Field':ind?'Indoor':'Outdoor',div:r.division,cls:'',rd:r.round,sc:r.score,rt:'',url:r.url,ds:[],ok:false,part:!!r.incomplete,bow:BOW(r.division),src:'csv'})});
 return L}
const arrowsOf=s=>s.ds.flatMap(d=>d.e).filter(e=>e.some(Boolean));
const nArrows=s=>arrowsOf(s).reduce((t,e)=>t+e.length,0);
const maxOf=s=>{const n=s.ds.reduce((t,d)=>t+d.e.reduce((k,e)=>k+e.length,0),0);return n?n*(s.disc=='Field'?6:10):null};
function groups(bow){const G={};entries().filter(s=>s.bow==bow&&s.sc>0).forEach(s=>{(G[s.rd]=G[s.rd]||{rd:s.rd,disc:s.disc,all:[]}).all.push(s)});
 Object.values(G).forEach(g=>{const full=g.all.filter(s=>!s.part);g.full=full.slice().sort((a,b)=>b.sc-a.sc||(a.d<b.d?-1:1));g.best=g.full[0]||null});
 return Object.values(G).filter(g=>g.best).sort((a,b)=>b.all.length-a.all.length||(a.rd<b.rd?-1:1))}
function chip(a,disc){const k=disc=='Field'?(a=='M'?'k-m':v(a)>=5?'k-y':'k-k'):disc=='Clout'?(a=='M'?'k-m':'k-u'):(a=='M'?'k-m':v(a)>=9?'k-y':v(a)>=7?'k-r':v(a)>=5?'k-b':v(a)>=3?'k-k':'k-w');return`<span class="adb ${k} bs-a">${esc(a||'·')}</span>`}
function endsHTML(s){if(!s.ds.length)return`<p class="small bs-na"><span class="sample">Ends unavailable</span> Only the total was published for this shoot, so there's no end-by-end breakdown.</p>`;
 let run=0,k=0;return s.ds.map(d=>{const sub=d.e.reduce((t,e)=>t+e.reduce((x,a)=>x+v(a),0),0);
  return`<div class="bs-dist"><div class="bs-dh"><b>${esc(d.dist||(s.disc=='Field'?'Field course':''))}</b><span>${esc(s.disc=='Field'?d.e.length+' targets × '+((d.e[0]||[]).length||3)+' arrows':d.face||'')}</span><b class="bs-sub">${sub}</b></div>
  <table class="bs-tab"><tr><th>${s.disc=='Field'?'Tgt':'End'}</th><th class="bs-ar">Arrows</th><th>End</th><th>Total</th></tr>${d.e.map((e,i)=>{k++;const t=e.reduce((x,a)=>x+v(a),0),shot=e.some(Boolean);run+=t;
   return`<tr${shot?'':' class="bs-blank"'}><td>${esc(d.tg?d.tg[i]:String(k))}</td><td class="bs-ar">${shot?e.map(a=>chip(a,s.disc)).join(''):'<span class="small muted">not shot</span>'}</td><td><b>${shot?t:'–'}</b></td><td>${shot?run:'–'}</td></tr>`}).join('')}</table></div>`}).join('')}
function statsRow(s){const A=arrowsOf(s).flat(),n=A.length,c=x=>A.filter(a=>a==x).length,st=(a,b)=>`<div class="stat"><b>${a}</b>${b}</div>`;if(!n)return'';
 const top=s.disc=='Field'?st(c('6'),"6's")+st(c('5'),"5's"):s.disc=='Clout'?st(c('10'),"10's")+st(c('9'),"9's"):st(c('10')+c('X'),"10's+X")+st(c('X'),"X's");
 return`<div class="stats" style="grid-template-columns:repeat(4,1fr)">${st((s.sc/n).toFixed(2),'avg arrow')}${top}${st(n,'arrows')}</div>`}
/* ghost: ends in the shape of the matching ScoreTool round, or null */
function ghostEnds(s,appRound){const R=ROUNDS[appRound];if(!R||!s.ds.length||s.part)return null;let E=[];
 for(const d of s.ds){if(d.e.length&&d.e[0].length==R.ape)E.push(...d.e);else if(d.e.length&&d.e[0].length*2==R.ape&&d.e.length%2==0){for(let i=0;i<d.e.length;i+=2)E.push(d.e[i].concat(d.e[i+1]))}else return null}
 return E.length==R.ends&&E.every(e=>e.length==R.ape)?E:null}
function bestForApp(appRound,bow){const L=entries().filter(s=>GHOST_MAP[s.rd]==appRound&&!s.part&&(!bow||s.bow==bow)).sort((a,b)=>b.sc-a.sc);for(const s of L){const E=ghostEnds(s,appRound);if(E)return{s,E}}return null}
window.offGhost=function(appRound){const b=bestForApp(appRound,window._bsBow||curBow());if(!b)return null;const E=b.E;
 return{mode:'off',src:'off',ends:E.map(e=>e.reduce((t,a)=>t+v(a),0)),ar:E.map(e=>e.slice()),pos:null,date:fmt(b.s.d),ev:b.s.ev}};
function bows(){const c={};entries().forEach(s=>c[s.bow]=(c[s.bow]||0)+1);return Object.entries(c).sort((a,b)=>b[1]-a[1])}
function curBow(){const B=bows();if(!B.length)return null;if(window._bsBow&&B.some(b=>b[0]==window._bsBow))return window._bsBow;const L=entries().sort((a,b)=>a.d<b.d?1:-1);return L[0]?L[0].bow:B[0][0]}
window.bestCard=function(){if(!BS||!isMe())return'';const bow=curBow();if(!bow)return'';const G=groups(bow);if(!G.length)return'';
 let g=G.find(x=>x.rd==window._bsRd)||G[0];const pick=g.full.find(s=>s.d+'|'+s.sc==window._bsPick)||g.best,s=pick,isBest=s===g.best,B=bows();
 const mx=maxOf(s),gm=GHOST_MAP[s.rd],ge=gm&&ghostEnds(s,gm);
 const opts=DISC.map(d=>{const L=G.filter(x=>x.disc==d);return L.length?`<optgroup label="${DN[d]}">${L.map(x=>`<option value="${esc(x.rd)}" ${x===g?'selected':''}>${esc(x.rd)} · ${x.best.sc} · ${fmt(x.best.d)}</option>`).join('')}</optgroup>`:''}).join('');
 return`<div class="card bs-card" id="bscard"><span class="kicker">🏆 My best scores <span class="real">official</span></span><h2 style="margin:2px 0 8px">Personal bests</h2>
 ${B.length>1?`<div class="bs-bows">${B.map(([b,n])=>`<button type="button" data-bsb="${esc(b)}" class="${b==bow?'on':''}">${esc(b)} <span>${n}</span></button>`).join('')}</div>`:''}
 <label for="bssel" class="small">Pick a round (${plN(G.length,'round','rounds')}, best full score each)</label><select id="bssel">${opts}</select>
 <div class="bs-hero"><div class="bs-big">${s.sc}${mx?`<small>/${mx}</small>`:''}</div><div class="bs-meta"><span class="pill" style="background:${isBest?'var(--gold)':'var(--blue)'}">${isBest?'⭐ PB':'#'+(g.full.indexOf(s)+1)+' on this round'}</span>
  <b>${fmt(s.d)}</b><span>${esc(s.ev)}</span><span class="muted">${esc(s.club||'')}${s.rt&&s.rt!='0'?' · rating '+esc(s.rt):''}</span></div></div>
 <p class="small muted" style="margin:6px 0">${esc(s.rd)} · ${esc(s.div||bow)} · best of ${g.full.length} full round${g.full.length==1?'':'s'}${g.all.length>g.full.length?` (${g.all.length-g.full.length} partial not counted)`:''}${s.url?` · <a href="${esc(s.url)}" target="_blank" rel="noopener">Scoresheet ↗</a>`:''}</p>
 ${statsRow(s)}
 ${ge?`<button class="btn full bs-ghost" id="bsgh">👻 Shoot against this score</button>`:''}
 <h3 style="margin:12px 0 6px">End by end</h3>${endsHTML(s)}
 ${g.full.length>1?`<h3 style="margin:12px 0 6px">My top ${Math.min(5,g.full.length)} on ${esc(s.rd)}</h3>${g.full.slice(0,5).map((x,i)=>`<button type="button" class="bs-row ${x===s?'on':''}" data-bsp="${esc(x.d+'|'+x.sc)}"><span class="bs-rk">${i+1}</span><span class="bs-rs"><b>${x.sc}</b> · ${fmt(x.d)}<br><span class="small muted">${esc(x.ev)}</span></span><span class="small muted">${x.ds.length?'ends ›':'total only'}</span></button>`).join('')}`:''}
 </div>`};
window.bindBest=function(){const c=$('#bscard');if(!c)return;const re=()=>{const y=c.getBoundingClientRect().top;stats();const n=$('#bscard');if(n)scrollBy(0,n.getBoundingClientRect().top-y)};
 const sel=$('#bssel');if(sel)sel.onchange=()=>{window._bsRd=sel.value;window._bsPick=null;re()};
 c.querySelectorAll('[data-bsb]').forEach(b=>b.onclick=()=>{window._bsBow=b.dataset.bsb;window._bsRd=null;window._bsPick=null;re()});
 c.querySelectorAll('[data-bsp]').forEach(b=>b.onclick=()=>{window._bsPick=b.dataset.bsp;re()});
 const gh=$('#bsgh');if(gh)gh.onclick=()=>{const bow=curBow(),G=groups(bow),g=G.find(x=>x.rd==window._bsRd)||G[0],s=g.full.find(x=>x.d+'|'+x.sc==window._bsPick)||g.best;
  window._bsGhost={rd:GHOST_MAP[s.rd],key:s.d+'|'+s.sc};S.lastRound=GHOST_MAP[s.rd];save();window._ghOn=true;window._ghM='off';nav('score')}};
/* pick a specific sheet as the ghost when started from this card */
const _og=window.offGhost;window.offGhost=function(appRound){const p=window._bsGhost;if(p&&p.rd==appRound){const s=entries().find(x=>x.d+'|'+x.sc==p.key&&GHOST_MAP[x.rd]==appRound),E=s&&ghostEnds(s,appRound);
  if(E)return{mode:'off',src:'off',ends:E.map(e=>e.reduce((t,a)=>t+v(a),0)),ar:E.map(e=>e.slice()),pos:null,date:fmt(s.d),ev:s.ev}}return _og(appRound)};
const _st=stats;stats=function(){_st.apply(this,arguments);if($('#bscard'))return;const h=bestCard();if(!h)return;const go=$('#goan');if(go)go.insertAdjacentHTML('afterend',h);else app.insertAdjacentHTML('afterbegin',h);bindBest()};
})();
