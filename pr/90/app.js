/* ScoreTool. Static, scores kept on this phone. No payments. */
const $=s=>document.querySelector(s), app=$('#app');
/* one plural rule app-wide: '1 adult', '2 adults', '1.0 points' */
const plN=(n,s,p)=>n+' '+(String(n)==='1'?s:p);window.plN=plN;
const ROUNDS={ // AA/WA round templates (arrows per end, distances)
 'WA 720 (70m)':{ends:12,ape:6,face:'122cm',max:720},
 'WA 720 (60m)':{ends:12,ape:6,face:'122cm',max:720},
 'WA 720 (50m Compound)':{ends:12,ape:6,face:'80cm 6-ring',max:720},
 'Short Canberra (50/40/30m)':{ends:15,ape:6,face:'122cm',max:900,blocks:[{dist:50,unit:'m',size:122,type:'full',ends:5},{dist:40,unit:'m',size:122,type:'full',ends:5},{dist:30,unit:'m',size:122,type:'full',ends:5}]},
 'Junior Canberra (40/30/20m)':{ends:15,ape:6,face:'122cm',max:900,blocks:[{dist:40,unit:'m',size:122,type:'full',ends:5},{dist:30,unit:'m',size:122,type:'full',ends:5},{dist:20,unit:'m',size:122,type:'full',ends:5}]},/* Schedule 9A: 30 arrows at each distance, all on the 122 cm face */
 'Indoor WA 18m':{ends:20,ape:3,face:'40cm',max:600,wa18:true,xs:false},/* WA indoor: no X. Keys 10–6 and M. Recurve 10 is the whole 10 ring; sighted compound 10 is only the inner ring (Book 2 7.2.2, Book 3 12.5.1). Same rule on 25 m and the combined round. */
 'Australian Indoor 18m':{ends:10,ape:3,face:'40cm',max:300,ausi:true,blocks:[{dist:18,unit:'m',size:40,type:'full',ends:10}]},/* AA 30-arrow indoor: single or triangle, keys X 10–6 M on every face. X scores 10 and is only the second tie-break. Vertical is still offered and is outside the AA face list. */
 /* Added 2026-10-16. Sources (real specs, not copied from any app):
    - World Archery Rulebook Book 2 (Events), 2026-01-27 version: 5.3.1.1 (1440 Round 4x36 arrows, 25 m and 18 m 60 arrows), 7.2.2 (122/80/60/40cm faces),
      4.5.2 (Field Round = 24 targets x 3 arrows; marked, unmarked or one marked + one unmarked 12-target unit; faces 20/40/60/80cm),
      8.2.1 (field face: yellow 6 and 5, black/teal 4-1; zone diameters 1/10, 2/10, 4/10, 6/10, 8/10, 10/10 of the face; no X ring).
      https://extranet.worldarchery.sport/documents/index.php/Rules/Rule_Book_versions/2026-01-27/EN-Book_2_-_2026-01-27_Version.pdf
    - Archery Australia Schedule 9A via Archery SA "Rounds Explained" (https://archerysa.org.au/wp-content/uploads/2024/04/Rounds-Explained.pdf)
      and Brisbane Archery "Know Your Shoots 2024": WA 90/1440 90,70 (122cm) 50,30 (80cm); WA 70/1440 70,60 (122) 50,30 (80);
      WA 60/1440 (Fremantle) 60,50 (122) 40,30 (80); WA 60/900 60,50,40 x30 on 122cm; 25m Round WA 60 arrows on 60cm.
    Note: 1440s are entered as 6-arrow ends throughout (WA events often shoot the 50/30 m in 3-arrow ends; totals and max are the same). */
 'WA 90/1440 (90/70/50/30m)':{ends:24,ape:6,face:'122cm / 80cm',max:1440,blocks:[{dist:90,unit:'m',size:122,type:'full',ends:6},{dist:70,unit:'m',size:122,type:'full',ends:6},{dist:50,unit:'m',size:80,type:'full',ends:6},{dist:30,unit:'m',size:80,type:'full',ends:6}]},
 'WA 70/1440 (70/60/50/30m)':{ends:24,ape:6,face:'122cm / 80cm',max:1440,blocks:[{dist:70,unit:'m',size:122,type:'full',ends:6},{dist:60,unit:'m',size:122,type:'full',ends:6},{dist:50,unit:'m',size:80,type:'full',ends:6},{dist:30,unit:'m',size:80,type:'full',ends:6}]},
 'WA 60/1440 (60/50/40/30m)':{ends:24,ape:6,face:'122cm / 80cm',max:1440,blocks:[{dist:60,unit:'m',size:122,type:'full',ends:6},{dist:50,unit:'m',size:122,type:'full',ends:6},{dist:40,unit:'m',size:80,type:'full',ends:6},{dist:30,unit:'m',size:80,type:'full',ends:6}]},
 'AA 50/1440 (50/40/30/20m)':{ends:24,ape:6,face:'122cm / 80cm',max:1440,blocks:[{dist:50,unit:'m',size:122,type:'full',ends:6},{dist:40,unit:'m',size:122,type:'full',ends:6},{dist:30,unit:'m',size:80,type:'full',ends:6},{dist:20,unit:'m',size:80,type:'full',ends:6}]},
 'WA 60/900 (60/50/40m)':{ends:15,ape:6,face:'122cm',max:900,blocks:[{dist:60,unit:'m',size:122,type:'full',ends:5},{dist:50,unit:'m',size:122,type:'full',ends:5},{dist:40,unit:'m',size:122,type:'full',ends:5}]},
 'Indoor WA 25m':{ends:20,ape:3,face:'60cm',max:600,wa18:true,xs:false,blocks:[{dist:25,unit:'m',size:60,type:'full',ends:20}]},
 'Indoor WA Combined 25m + 18m':{ends:40,ape:3,face:'60cm / 40cm',max:1200,wa18:true,xs:false,blocks:[{dist:25,unit:'m',size:60,type:'full',ends:20},{dist:18,unit:'m',size:40,type:'full',ends:20}]},
 'WA Field 24 Marked':{ends:24,ape:3,face:'field 20-80cm',max:432,blocks:[{dist:'Marked',unit:'',size:'20-80',type:'field',ends:24}]},
 'WA Field 24 Unmarked':{ends:24,ape:3,face:'field 20-80cm',max:432,blocks:[{dist:'Unmarked',unit:'',size:'20-80',type:'field',ends:24}]},
 'WA Field 12 Unmarked + 12 Marked':{ends:24,ape:3,face:'field 20-80cm',max:432,blocks:[{dist:'Unmarked',unit:'',size:'20-80',type:'field',ends:12},{dist:'Marked',unit:'',size:'20-80',type:'field',ends:12}]},
 /* Vegas 300 (20 Oct 2026): 30 arrows, 10 ends of 3 at 20 yd on the 40 cm Vegas 3-spot, X 10-6 + M with X = 10, no 12 dot. Shoot-up: shootup.js */
 'Vegas 300':{ends:10,ape:3,face:'40cm',max:300,vegas:true,blocks:[{dist:20,unit:'yd',size:40,type:'full',ends:10}]},
 /* Onion Shed Challenge league round: the same Vegas 300 shot at 18 m (league.js). Not offered for match nights. */
 'Vegas 300 (18 m)':{ends:10,ape:3,face:'40cm',max:300,vegas:true,league:true,blocks:[{dist:18,unit:'m',size:40,type:'full',ends:10}]},
 /* C16 L1: official Lancaster Archery Classic 660 (2025 Format & Rules 4.1-4.2). 60 arrows, 20 ends of 3, 18 m, triangular 40 cm 3-spot locked. Inner X scores 11. Maximum 660. No 12-dot. League scoring is values only. */
 'Lancaster 660':{ends:20,ape:3,face:'40cm 3-spot',max:660,lancaster:true,xv:11,face3:'vegas',halfEnds:10,note:'Official Lancaster Classic 660: 20 ends of 3 at 18 m on a triangular 40 cm 3-spot. The inner X scores 11 (2025 Classic rules 4.1–4.2). Maximum 660. There is no 12-dot on this round. Shot as two halves of 10 ends (330 max each) with a break between them, as on the paper scoresheet: the running total resets at end 11, and the final score is the two halves added together. Lingkana locks this face; scoring is values only.',blocks:[{dist:18,unit:'m',size:40,type:'full',ends:20}]},
 'Practice 10 ends × 3':{ends:10,ape:3,face:'any',max:300},
 'Practice 6 ends × 6':{ends:6,ape:6,face:'any',max:360}};
/* Schedule 9A rounds (rounds_aa.js): fill any round the table names that is not already here, and mark the ones that are. */
if(window.aaApply)aaApply(ROUNDS);
const KEY=TESTER&&TESTER.id!='nathe'?'scoretool.v1.'+TESTER.id:'scoretool.v1';
let S=JSON.parse(localStorage.getItem(KEY)||'null')||{profile:null,unlocked:false,sessions:[],best:[],plots:[]};
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
/* Colour-blind safe mode (red-green): on by default for Nate, a tick in Me > Settings for anyone. Nothing relies on red vs green alone:
   face marks go white with a dark outline, plotted arrows are white dots with their score inside, up/down uses arrows and blue/orange. */
const CB=()=>S.cb!=null?!!S.cb:!!(TESTER&&TESTER.id=='nate');
const CBC=(n,c)=>({toString:()=>CB()?c:n});/* a colour that switches in colour-blind mode; works inside template strings */
const cbSync=()=>{if(document.body)document.body.classList.toggle('cb',CB())};cbSync();
/* One-time cleanup: remove only items the old demo seeded (flagged sample:true, ids 'sample0-9', notes starting 'SAMPLE', the '(SAMPLE)' squad). Real scores and imports are untouched. */
(function(){if(S.sampleCleaned)return;const isS=x=>x&&(x.sample===true||/^sample\d+$/.test(x.id||''));
 S.sessions=(S.sessions||[]).filter(x=>!isS(x));S.best=(S.best||[]).filter(x=>!isS(x));S.plots=S.plots||[];
 if(S.notes)for(const k in S.notes)if(/^sample\d+$/.test(k)||/^SAMPLE/i.test(S.notes[k]||''))delete S.notes[k];
 ['diary','setup','bows'].forEach(k=>{if(S[k])S[k]=S[k].filter(x=>!isS(x)&&!/^SAMPLE/i.test(x.text||'')&&!/\(SAMPLE\)/.test(x.name||''))});
 if(S.squad){if(/\(SAMPLE\)/.test(S.squad.name||''))delete S.squad;else{S.squad.members=(S.squad.members||[]).filter(m=>!m.sample);S.squad.adults=(S.squad.adults||[]).filter(a=>!a.sample)}}
 delete S.diarySeeded;delete S.bowsSeeded;S.sampleCleaned=1;save()})();
/* S.unlocked means "this profile is set up" (calendar sync, photos, names and others wait for it). It is not a plan:
   Free, Plus and Pro come from plans.js (founding profiles, early access, or a server-checked Stripe plan). */
if(TESTER&&!S.profile){S.profile=TESTER.name;S.unlocked=true;save()}
let REAL={}; // name -> [{date,event,round,score,division,club,url}]
let csvState='loading';

/* ---------- importer for /data/archer_scores.csv (official competition results) ---------- */
function parseCSV(t){const rows=[];let r=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];
 if(q){if(c=='"'&&t[i+1]=='"'){f+='"';i++}else if(c=='"')q=false;else f+=c}
 else if(c=='"')q=true;else if(c==','){r.push(f);f=''}else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;r.push(f);rows.push(r);r=[];f=''}else f+=c}
 if(f||r.length){r.push(f);rows.push(r)}return rows.filter(x=>x.some(v=>v.trim()))}
function pick(h,names){for(const n of names){const i=h.findIndex(x=>x.toLowerCase().replace(/[^a-z]/g,'')==n);if(i>=0)return i}return -1}
let OFF={}; // name -> [{key,date,event,round,url,ends:[{dist,arrows,flag}]}]
async function loadArrows(){try{const r=await fetch('data/arrows.csv',{cache:'no-store'});if(!r.ok)return;const rows=parseCSV(await r.text()),h=rows[0];
 const I=n=>h.indexOf(n);for(const row of rows.slice(1)){const g=n=>(row[I(n)]||'').trim(),nm=g('archer'),key=g('date')+'|'+g('round')+'|'+g('event');
  const L=(OFF[nm]=OFF[nm]||[]);let o=L.find(x=>x.key==key);if(!o){o={key,date:g('date'),event:g('event'),round:g('round'),url:g('results_url'),ends:[]};L.push(o)}
  const ar=g('arrows').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);o.ends.push({dist:g('distance'),arrows:ar,flag:ar.length>0&&ar.every(a=>a=='M')})}
 for(const k in OFF)OFF[k].sort((a,b)=>a.date<b.date?1:-1)}catch(e){}}
async function loadReal(){await _loadReal();if(TESTER&&TESTER.id!='nathe'){const is=(k,n)=>{const a=k.toLowerCase(),[f,l]=n.toLowerCase().split(' ');return a.includes(l)&&a.includes(f.slice(0,4))},mine=k=>(typeof TESTERS!='undefined'?TESTERS:[TESTER]).some(t=>t&&t.name&&is(k,t.name));/* keep the 3 testers' data: they share the preset squad */for(const k in REAL)if(!mine(k))delete REAL[k];for(const k in OFF)if(!mine(k))delete OFF[k];csvState=Object.keys(REAL).length?'ok':'empty'}}
/* Nathe's official scores come from ONE source: his official scoresheets (data/my_scoresheets.json), compound only.
   His official results also list entries in the Recurve (2020-26) and Longbow (2023-25) divisions under his name; those are
   kept in the file but left out here (see window._excluded). Sheet round names are mapped to the AA names the app's rating tables use. */
const SHEET_ALIAS={'2014 AWA Field Course Red':'WA Field 24Mk Red','Field 24Mk Red':'WA Field 24Mk Red','Field Red 24t MK':'WA Field 24Mk Red','AWA Unmarked Field Course Red':'WA Field 24Umk Red','BBMC C3 50/300 50m (80cm, 6 Ring) (3 x 10)':'BBMC C3 50/300 50m (80cm, 6 Ring)',
 '2014 AWA Field Course Blue':'WA Field 24Mk Blue','Field 24Mk Blue':'WA Field 24Mk Blue','Field Blue 24t MK':'WA Field 24Mk Blue','WA Field 24T Mkd Blue':'WA Field 24Mk Blue',
 '2014 AWA Field Course Yellow':'WA Field 24Mk Yellow','Field Yellow 24t MK':'WA Field 24Mk Yellow','WA Field 24T Mkd Yellow':'WA Field 24Mk Yellow','AWA Unmarked Field Course Yellow':'WA Field 24Umk Yellow'};
const isNatheName=n=>{n=String(n||'').toLowerCase();return n.includes('stride')&&n.includes('nath')};
/* Every tester with data loads his own sheets the same way (data/sheets_<id>.json, built from scores.db); only his main bow feeds stats. */
const sheetFile=id=>id=='nathe'?'data/my_scoresheets.json':'data/sheets_'+id+'.json';
async function loadSheets(){const T=TESTER;if(!T||!T.data)return;let j;try{const r=await fetch(sheetFile(T.id),{cache:'no-store'});if(!r.ok)return;j=await r.json()}catch(e){return}
 const adn=j.archer||T.ad||T.name,nm=T.id=='nathe'?(Object.keys(REAL).find(isNatheName)||'Nathaniel Stride'):(Object.keys(REAL).find(k=>k.toLowerCase()==adn.toLowerCase())||adn),csv=REAL[nm]||[],ex={};const bw=new RegExp('^'+(T.bow||'Compound')+'$','i'),okBow=d=>bw.test(String(d||'').replace(/^.*\b(Male|Female)\s+/i,'').trim())||bw.test(d||'');
 csv.filter(r=>!okBow(r.division)).forEach(r=>{ex['csv '+(r.division||'?')]=(ex['csv '+(r.division||'?')]||0)+1});
 const RL=[],OL=[];(j.sheets||[]).forEach(x=>{if(!okBow(x.div)){ex[x.div]=(ex[x.div]||0)+1;return}if(!(x.sc>0))return;
  const round=SHEET_ALIAS[x.rd]||x.rd,c=csv.find(r=>okBow(r.division)&&normDate(r.date)==x.d&&r.score==x.sc);
  const ends=[];(x.ds||[]).forEach(d=>d.e.forEach(e=>{if(!e.some(Boolean))return;const ar=e.map(a=>String(a||'M').toUpperCase());ends.push({dist:d.dist||'',arrows:ar,flag:ar.every(a=>a=='M')})}));
  const rt=parseFloat(x.rt);RL.push({date:x.d,event:x.ev,round,score:x.sc,division:(x.cls||'Open')+' '+(x.g||'Male')+' '+x.div,club:x.club,url:x.url,tens:c?c.tens:'',xs:c?c.xs:'',subs:c?c.subs:'',notes:c?c.notes:'',rating:isFinite(rt)&&rt>0?rt:null,incomplete:!!x.part||!!(c&&c.incomplete),sheet:1});
  if(ends.length)OL.push({key:x.d+'|'+round+'|'+x.ev,date:x.d,event:x.ev,round,url:x.url,ends,score:x.sc,club:x.club,division:(x.cls||'Open')+' '+(x.g||'Male')+' '+x.div})});
 /* keep any compound csv result the sheets don't have */
 csv.filter(r=>okBow(r.division)&&!RL.some(x=>x.date==normDate(r.date)&&x.score==r.score)).forEach(r=>RL.push(r));
 RL.sort((a,b)=>normDate(a.date)<normDate(b.date)?-1:1);OL.sort((a,b)=>a.date<b.date?1:-1);
 REAL[nm]=RL;const ok=T.id=='nathe'?Object.keys(OFF).find(isNatheName):aliasKey(OFF,T.name)||aliasKey(OFF,adn);if(ok)delete OFF[ok];OFF[nm]=OL;window._excluded=ex;window._sheetsFor=nm;csvState=RL.length?'ok':csvState}
async function _loadReal(){await __loadReal();await loadSheets()}
async function __loadReal(){await loadArrows();
 /* 25 Nov 2026: no results file is shipped any more; this address is answered from the archer's own imported file (mydata.js), else 404 */
 try{const r=await fetch('data/archer_scores.csv',{cache:'no-store'});if(!r.ok)throw 0;
  const rows=parseCSV(await r.text());if(rows.length<2){csvState='empty';return}
  const h=rows[0],ix={name:pick(h,['archer','name','archername']),date:pick(h,['date','eventdate']),event:pick(h,['event','eventname','shoot','tournament']),
   round:pick(h,['round','roundname']),score:pick(h,['score','total','totalscore']),division:pick(h,['division','bowclass','bowtype','class','category']),notes:pick(h,['notes']),
   club:pick(h,['club']),url:pick(h,['url','resultsurl','source','sourceurl','link']),tens:pick(h,['tens','10s','tensxcount']),xs:pick(h,['xs','x','xcount']),subs:pick(h,['distancesubtotals','subtotals'])};
  for(const row of rows.slice(1)){const g=k=>ix[k]>=0?(row[ix[k]]||'').trim():'';const sc=parseInt(g('score'));if(!g('name')||isNaN(sc)||sc<=0)continue; /* skip not-entered/0 rows */
   (REAL[g('name')]=REAL[g('name')]||[]).push({date:g('date'),event:g('event'),round:g('round')||'Unknown round',score:sc,division:g('division'),club:g('club'),url:g('url'),tens:g('tens'),xs:g('xs'),subs:g('subs'),notes:g('notes'),incomplete:/incomplete|partial|not shot/i.test(g('notes'))})}
  for(const k in REAL)REAL[k].sort((a,b)=>normDate(a.date)<normDate(b.date)?-1:1);
  csvState=Object.keys(REAL).length?'ok':'empty';
 }catch(e){csvState='missing'}}
function normDate(d){const m=d.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:d}
const ARCHERS=TESTER?[TESTER.name]:[];
/* a name that doesn't match is retried with the archer's other names (names.js NM_VARIANTS) */
const nmAlts=n=>{const l=String(n||'').trim().toLowerCase();if(!l||typeof TESTERS=='undefined')return[];const V=typeof NM_VARIANTS!='undefined'?NM_VARIANTS:{};
 const all=t=>[t.name,t.ad,...(V[t.id]||[])].filter(Boolean),t=TESTERS.find(t=>all(t).some(x=>x.toLowerCase()==l));return t?all(t).filter(x=>x.toLowerCase()!=l):[]};
const aliasKey=(O,n)=>{const k=aliasKey1(O,n);if(k)return k;for(const a of nmAlts(n)){const x=aliasKey1(O,a);if(x)return x}return undefined};
const aliasKey1=(O,n)=>{if(O[n])return n;const[f,...r]=String(n||'').toLowerCase().split(' '),l=r.pop()||'';return l?Object.keys(O).find(x=>{x=x.toLowerCase();return x.includes(l)&&x.includes(f.slice(0,4))}):undefined};const offFor=n=>OFF[aliasKey(OFF,n)]||[];
const findReal=n=>{const r=findReal1(n);if(r.length)return r;for(const a of nmAlts(n)){const x=findReal1(a);if(x.length)return x}return r};
const findReal1=n=>{n=String(n||'');if(!n.split(' ')[1])return REAL[n]||[];/* one-word names have no surname to match */const k=Object.keys(REAL).find(x=>x.toLowerCase().includes(n.split(' ')[1].toLowerCase())&&x.toLowerCase().includes(n.split(' ')[0].slice(0,4).toLowerCase()));return k?REAL[k]:[]};



/* ---------- scoring helpers ---------- */
function xValOf(s){const R=s&&s.round&&typeof ROUNDS==='object'?ROUNDS[s.round]:s;if(R&&R.xv!=null)return +R.xv;if(R&&R.lancaster)return 11;return 10}window.xValOf=xValOf;
const val=(a,s)=>{if(a=='M'||a==null||a==='')return 0;const sess=s||(typeof cur!=='undefined'?cur:null);if(typeof worldValX==='function'){const v=worldValX(a,sess);if(v!=null)return v}if(a=='X')return xValOf(sess);return +a};
const endSum=(e,s)=>(e||[]).reduce((t,a)=>t+val(a,s),0);
const total=s=>s.ends.reduce((t,e)=>t+endSum(e,s),0);
const arrows=s=>s.ends.flat();
const avgArrow=s=>{const a=arrows(s);return a.length?total(s)/a.length:0};
const sd=xs=>{if(xs.length<2)return 0;const m=xs.reduce((a,b)=>a+b)/xs.length;return Math.sqrt(xs.reduce((t,x)=>t+(x-m)**2,0)/(xs.length-1))};
const col=a=>{const v=val(a);if(typeof cur!='undefined'&&cur&&(cur.bugs||/field/.test((ROUNDS[cur.round]||{}).face||'')))return a=='M'?'k-m':v>=5?'k-y':'k-k';return v>=9?'k-y':v>=7?'k-r':v>=5?'k-b':v>=3?'k-k':v>=1?'k-w':'k-m'};
const allSessions=()=>[...S.sessions].sort((a,b)=>a.date<b.date?-1:1);
/* A session counts only when every end of its round is shot. Fewer ends (finished early or still going) = Incomplete: left out of stats unless 'Include incomplete' is ticked. */
function endLen(R,i){return typeof apeOf==='function'?apeOf(R,i):(R&&R.ape)||1}
function endComplete(R,e,i){if(!e)return false;if(R&&R.stopOnHit&&e.some(a=>a!=null&&a!=='M'))return true;return e.length>=endLen(R,i)}
function roundEnds(R,s){return(s&&s.targets)||(R&&R.ends)||0}
const isFull=s=>{const R=ROUNDS[s.round];if(!R)return false;const need=roundEnds(R,s);const E=s.ends.filter(e=>e&&e.length);return E.length>=need&&s.ends.slice(0,need).every((e,i)=>R.aba||endComplete(R,e,i))};
const isDone=s=>isFull(s);
const isIncS=s=>!isFull(s)&&arrowsIn(s)>0;
const done=()=>allSessions().filter(isDone);

/* ---------- PBs, streaks, badges, wins ---------- */
function pbs(){const m={};for(const s of done()){const t=total(s);if(!m[s.round]||t>m[s.round].score)m[s.round]={score:t,date:s.date,sample:s.sample}}
 for(const r of findReal(S.profile||'')){if(r.incomplete)continue;const k='🏆 '+r.round+(r.division?' · '+r.division.replace(/^(Under \d+|Open) (Male|Female) /,''):'');if(!m[k]||r.score>m[k].score)m[k]={score:r.score,date:r.date,real:true}}return m}
function streak(){const wk=d=>Math.floor((new Date(d)-new Date('2024-01-01'))/6048e5);const w=[...new Set(allSessions().map(s=>wk(s.date)))].sort((a,b)=>b-a);if(!w.length)return 0;
 let n=1;for(let i=1;i<w.length;i++){if(w[i-1]-w[i]==1)n++;else break}return n} // weeks-with-practice style streak
function endLabel(s,i){if(s.dists&&s.dists[i]){const d=s.dists[i];return`end ${s.dists.slice(0,i+1).filter(x=>x==d).length} at ${d}`}const m=(s.round||'').match(/(\d+m)/);return`end ${i+1}${m?' at '+m[1]:''}`}
function winsFor(s){if(!s||!s.ends||!s.ends.length||!s.ends.some(e=>e&&e.length))return[];const W=[],prev=done().filter(x=>x.round==s.round&&x.id!=s.id&&x.date<=s.date);const t=total(s);
 const ends=s.ends.map(endSum),best=Math.max(...ends),bi=ends.indexOf(best);
 W.push(['⭐',`Your best end was ${endLabel(s,bi)}: ${plN(best,'point','points')} (${s.ends[bi].join(' ')}).`]);
 const gold=arrows(s).filter(a=>val(a)>=9).length;if(gold)W.push(['🟡',`${plN(gold,'arrow','arrows')} in the gold. That's ${Math.round(gold/arrows(s).length*100)}% of your shots.`]);
 if(prev.length){const avg=prev.reduce((a,x)=>a+total(x),0)/prev.length;if(t>avg)W.push(['📈',`${plN(Math.round(t-avg),'point','points')} above your usual for this round.`]);
  const p=Math.max(...prev.map(total));if(t>p)W.push(['🏆',`NEW personal best! ${t} beats your old best of ${p}.`]);
  const half=Math.ceil(ends.length/2),late=ends.slice(half);if(late.length&&late.reduce((a,b)=>a+b)/late.length>=ends.slice(0,half).reduce((a,b)=>a+b)/half)W.push(['💪',`You finished as strong as you started: your last ends (${endLabel(s,half)} to ${endLabel(s,ends.length-1)}) held up. Great stamina and focus.`])}
 if(sd(ends)<2.5)W.push(['🎯','Super consistent: your ends were all close together.']);
 W.push(['🏹',`You shot ${plN(arrows(s).length,'arrow','arrows')}. Every arrow is practice banked.`]);return W.slice(0,3)}
function badges(){const d=done(),p=pbs(),st=streak(),arr=d.reduce((t,s)=>t+arrows(s).length,0),xs=d.reduce((t,s)=>t+arrows(s).filter(a=>a=='X').length,0);
 return[['🏹','First session',d.length>=1],['💯','100 arrows',arr>=100],['🔥','3-week streak',st>=3],['❌','10 X\'s',xs>=10],['🏆','Beat a PB',d.some(s=>winsFor(s).some(w=>w[0]=='🏆'))],
 ['🎯','Tight group',S.plots.length>=6&&groupStats(S.plots).r<0.25],['🌈','Clean end (no misses)',d.some(s=>s.ends.some(e=>e.every(a=>a!='M')))],['📓','My best moments',S.best.length>=1]]}

/* ---------- charts (inline SVG) ---------- */
function lineChart(series,{h=170,labels=[],markers=[]}={}){const W=340,P=30;const all=series.flatMap(s=>s.data).filter(v=>v!=null);if(!all.length)return'<p class="muted">Not enough data yet.</p>';
 let mn=Math.min(...all),mx=Math.max(...all);if(mn==mx){mn-=1;mx+=1}const n=Math.max(...series.map(s=>s.data.length));
 const X=i=>P+(n<2?0:i*(W-P-10)/(n-1)),Y=v=>h-22-(v-mn)/(mx-mn)*(h-40);
 let g=`<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="chart" width="100%"><line x1="${P}" y1="${h-22}" x2="${W}" y2="${h-22}" stroke="#94a3b8"/>`+
 `<text x="2" y="${Y(mx)+4}" font-size="11" fill="var(--muted)">${Math.round(mx)}</text><text x="2" y="${Y(mn)+4}" font-size="11" fill="var(--muted)">${Math.round(mn)}</text>`;
 for(const s of series){const pts=s.data.map((v,i)=>v==null?null:`${X(i)},${Y(v)}`).filter(Boolean);g+=`<polyline fill="none" stroke="${s.c}" stroke-width="${s.w||2.5}" ${s.dash?'stroke-dasharray="5 4"':''} points="${pts.join(' ')}"/>`;
  if(!s.dash)s.data.forEach((v,i)=>{if(v!=null)g+=`<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" fill="${s.c}"/>`})}
markers.forEach(m=>{g+=`<line x1="${X(m.i)}" x2="${X(m.i)}" y1="8" y2="${h-22}" stroke="#3b82f6" stroke-dasharray="3 3"/><text x="${X(m.i)}" y="10" font-size="12" text-anchor="middle">◆</text><title>${m.t}</title>`});
 labels.forEach((l,i)=>{if(n<=12||i%Math.ceil(n/6)==0)g+=`<text x="${X(i)}" y="${h-6}" font-size="10" text-anchor="middle" fill="var(--muted)">${l}</text>`});
 return g+'</svg>'+`<div class="small">${series.map(s=>`<span style="color:${s.c};font-weight:800">━</span> ${s.name}`).join(' &nbsp; ')}${markers.length?' &nbsp; ⚙️ setup change':''}</div>${markers.length?`<ul class="small" style="margin:4px 0 0;padding-left:18px">${markers.map(m=>`<li>${m.t}</li>`).join('')}</ul>`:''}`}
function bars(vals,labels,c='#1d4ed8',groups){const W=340,h=groups?165:150,mx=Math.max(...vals,1),bw=(W-20)/vals.length;
 return`<svg viewBox="0 0 ${W} ${h}" width="100%" role="img" aria-label="bar chart">${vals.map((v,i)=>`<rect x="${10+i*bw+2}" y="${h-20-v/mx*(h-40)}" width="${bw-4}" height="${v/mx*(h-40)}" rx="3" fill="${c}"/><text x="${10+i*bw+bw/2}" y="${h-24-v/mx*(h-40)}" font-size="10" text-anchor="middle" fill="var(--ink)">${Math.round(v*10)/10}</text><text x="${10+i*bw+bw/2}" y="${h-6}" font-size="10" text-anchor="middle" fill="var(--muted)">${labels[i]}</text>${groups&&(i==0||groups[i]!=groups[i-1])?`${i?`<line x1="${10+i*bw}" x2="${10+i*bw}" y1="2" y2="${h-4}" stroke="#94a3b8" stroke-dasharray="3 3"/>`:''}<text x="${10+i*bw+3}" y="11" font-size="11" font-weight="700" fill="var(--ink)">${groups[i]}</text>`:''}`).join('')}</svg>`}


/* End chart coloured by WA ring zone of the end's average arrow (end total / arrows in the end):
   gold >=9, red 7 to <9, blue 5 to <7, black 3 to <5, white <3. For 6 arrows: gold 54+, red 42-53, blue 30-41, black 18-29, white <18. */
const ZONES0=[[9,'#ffd84d','#b58900','Gold'],[7,'#d62828','#d62828','Red'],[5,'#2563eb','#2563eb','Blue'],[3,'#111','#111','Black'],[0,'#fff','#64748b','White']];
const zoneOf=a=>ZONES0.find(z=>a>=z[0]);
/* field rounds: gold (6-5) and black (4-1) only */
const FZONES=[[5,'#ffd84d','#b58900','Gold'],[0,'#111','#94a3b8','Black']];
function endChart(sums,apes,dists,title,flagD,fld){const ZONES=fld?FZONES:ZONES0,zoneOf=a=>ZONES.find(z=>a>=z[0]);const W=340,top=dists?20:4,h=top+110,n=sums.length,gap=n>24?1:2,bw=(W-4)/n,mx=Math.max(...apes)*(fld?6:10),showV=n<=40,vfs=bw>=16?8:bw>=12?7:6;
 let g=`<svg viewBox="0 0 ${W} ${h+16}" width="100%" role="img" aria-label="${title||'End by end'} chart">`;
 const grp=[];if(dists){let st=0;for(let i=1;i<=n;i++){if(i==n||dists[i]!=dists[st]){grp.push([st,i,dists[st]]);st=i}}}
 grp.forEach(([a,b,d])=>{const x0=2+a*bw,x1=2+b*bw,w=x1-x0,sub=sums.slice(a,b).reduce((t,v)=>t+v,0),fl=(flagD||[]).includes(d),txt=`${d} · ${sub}${fl?'*':''}`,fs=w>=70?10:w>=44?9:8,t=w>=txt.length*fs*0.58?txt:(w>=String(sub).length*fs*0.6+4?String(sub)+(fl?'*':''):'');
  g+=`<rect x="${x0+0.5}" y="1" width="${w-1}" height="15" rx="3" fill="#1e3a8a" stroke="#93c5fd" stroke-width="0.6"/>${t?`<text x="${(x0+x1)/2}" y="12" font-size="${fs}" font-weight="700" text-anchor="middle" fill="#fff">${t}</text>`:''}<title>${d}: ${sub}${fl?' (flagged end left out)':''}</title>`});
 sums.forEach((v,i)=>{const a=v/(apes[i]||1),z=zoneOf(a),bh=Math.max(2,v/mx*(h-top-14)),x=2+i*bw+gap/2,y=h-bh;const lbl=dists?`end ${dists.slice(0,i+1).filter(d=>d==dists[i]).length} at ${dists[i]}`:`end ${i+1}`;
  g+=`<rect x="${x}" y="${y}" width="${Math.max(1,bw-gap)}" height="${bh}" rx="1.5" fill="${z[1]}" stroke="${z[2]}" stroke-width="${z[3]=='White'||(fld&&z[3]=='Black')?1:0}" style="cursor:pointer" data-t="${lbl}: ${v} (avg ${a.toFixed(1)} per arrow, ${z[3]})" onclick="this.closest('.ec').querySelector('.ecap').textContent=this.dataset.t"><title>${lbl}: ${v}</title></rect>`;
  if(showV)g+=`<text class="evl" x="${x+(bw-gap)/2}" y="${y-3}" font-size="${vfs}" text-anchor="middle" fill="var(--muted)">${v}</text>`});
 g+=grp.length?grp.map(([a,b,d])=>{const x0=2+a*bw,x1=2+b*bw;return`${a?`<line x1="${x0}" x2="${x0}" y1="${top}" y2="${h+14}" stroke="#94a3b8" stroke-dasharray="2 2"/>`:''}<text x="${(x0+x1)/2}" y="${h+12}" font-size="10" font-weight="700" text-anchor="middle" fill="#64748b">${d}</text>`}).join('')+'</svg>':`<text x="2" y="${h+12}" font-size="9" fill="#64748b">1</text><text x="${W-2}" y="${h+12}" font-size="9" text-anchor="end" fill="#64748b">${n}</text></svg>`;
 return`<div class="ec">${g}<p class="small ecap" style="margin:2px 0;min-height:1.2em">${showV?'':'Tap a bar to see its score.'}</p><div class="small" style="display:flex;flex-wrap:wrap;gap:4px 10px">${ZONES.map(z=>`<span><i style="display:inline-block;width:10px;height:10px;background:${z[1]};border:1px solid ${z[2]};vertical-align:middle"></i> <span class="zr">${z[3]}${fld?(z[0]?' 5–6':' 1–4.9'):z[0]==9?' 9–10':z[0]?` ${z[0]}–${(ZONES[ZONES.indexOf(z)-1][0]-0.1).toFixed(1)}`:' under 3'}</span></span>`).join('')}</div><p class="small muted" style="margin:2px 0 0">Colour = ring of the end's average arrow (end total ÷ arrows), each range stops just below the next.${fld?' Field: gold 6 and 5, black 4 to 1.':Math.max(...apes)==6?' For 6 arrows: gold 54–60, red 42–53, blue 30–41, black 18–29, white under 18.':''}</p></div>`}
/* ---------- target plotting ---------- */
function groupStats(p){if(!p.length)return{cx:0,cy:0,r:0};const cx=p.reduce((a,b)=>a+b.x,0)/p.length,cy=p.reduce((a,b)=>a+b.y,0)/p.length;
 return{cx,cy,r:p.reduce((a,b)=>a+Math.hypot(b.x-cx,b.y-cy),0)/p.length}}
function ringScore(x,y){const d=Math.hypot(x,y);if(d>1)return'M';if(d<=0.05)return'X';return String(10-Math.floor(d*10))}
function targetSVG(pts){const rings=[['#fff','#333'],['#fff','#333'],['#111','#fff'],['#111','#fff'],['#2563eb','#111'],['#2563eb','#111'],['#d62828','#111'],['#d62828','#111'],['#ffd84d','#111'],['#ffd84d','#111']];
 let g=`<svg id="tface" viewBox="-1.1 -1.1 2.2 2.2" width="100%" role="img" aria-label="Target face, tap where each arrow landed">`;
 rings.forEach((c,i)=>g+=`<circle r="${1-i*0.1}" fill="${c[0]}" stroke="${c[1]}" stroke-width="0.006"/>`);g+=`<circle r="0.05" fill="none" stroke="#111" stroke-width="0.005"/>`;
 pts.forEach((p,i)=>g+=CB()?`<circle cx="${p.x}" cy="${p.y}" r="0.05" fill="#fff" stroke="#000" stroke-width="0.01"/>`+cbLab(p.x,p.y,0.05,p.k||ringScore(p.x,p.y)):`<circle cx="${p.x}" cy="${p.y}" r="0.035" fill="#22c55e" stroke="#000" stroke-width="0.01"/>`);
 if(pts.length>=3){const s=groupStats(pts);g+=faceHi(`<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="none" stroke="#39ff14" stroke-width="0.015" stroke-dasharray="0.04 0.03"/><path d="M${s.cx-0.06} ${s.cy}h0.12M${s.cx} ${s.cy-0.06}v0.12" stroke="#39ff14" stroke-width="0.02"/>`)}
 return g+'</svg>'}

/* ---------- views ---------- */
let view=/^#plot/.test(location.hash)?'score':'home',cur=null;
function nav(v){if(v=='plot')v='score';view=v;document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.v==v));render();scrollTo(0,0)}
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>nav(b.dataset.v));
/* Stripe Checkout, the webhook and the entitlement table live on the Archery Calendar Supabase project
   (edge function stripe-entitlement). This URL is public; no secret is in this file. See docs/stripe-entitlement.md.
   entitlementVerify asks the server for the signed-in email's plan (plans.js). It does not read or write S.unlocked. */
const SCORETOOL_ENTITLEMENT_URL='https://sllsqpfqwckwtljzjxli.supabase.co/functions/v1/stripe-entitlement';
async function entitlementVerify(){
 if(typeof scoretoolEntitlementVerify==='function')return scoretoolEntitlementVerify();
 return {ok:false,reason:'no-server'}}
window.entitlementVerify=entitlementVerify;
function pickProfile(){return`<div class="card"><span class="kicker">Welcome</span><h1>Who's shooting?</h1><p class="muted">Pick an archer to load their past competition results.</p>
${ARCHERS.map(n=>`<button class="btn ghost full" style="margin:6px 0" data-p="${n}">${n}</button>`).join('')}${csvNote()}</div>`}
function csvNote(){if(TESTER&&TESTER.id!='nathe'&&csvState!='ok')return`<p class="small muted">No scores yet. Score a round or log practice and it will show here.</p>`;return csvState=='ok'?`<p class="small"><span class="real">Official</span> competition results loaded.</p>`:
 `<p class="small"><span class="sample">No scores yet</span> No official results imported yet. The past competition results are still being collected, so official results will appear here once it's added.</p>`}
function render(){cbSync();seedNotes();regCustom();
 if(typeof coachRoute==='function'&&coachRoute()) return;
 if(location.hash.startsWith('#share=')) return renderShare();
 if(COACH_ON&&location.hash.startsWith('#coach=')) return renderCoachLanding();
 if(location.hash.startsWith('#sheet=')) return renderSheetLink();
 if(!TESTER){$('#tabs').hidden=true;app.innerHTML=testerPicker();bindTesterPicker(app);return}
 $('#tabs').hidden=false;
 if(!S.profile){app.innerHTML=pickProfile();app.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{S.profile=b.dataset.p;save();nav('home')});return}
 if(typeof ifaaFromHash=='function'&&/^#score(\?|$)/.test(location.hash)){if(ifaaFromHash())return}
 if(view=='plot'){view='score'}({home,score,stats,diary,me,squad,...(window.EXTRA_VIEWS||{})})[view]()}

/* ---------- latest real shoot ---------- */
const ld=d=>new Date(d).toLocaleDateString('en-CA');const today=()=>new Date().toLocaleDateString('en-CA');
function realShoots(withInc){const off=findReal(S.profile||'').map(r=>({kind:'official',date:normDate(r.date),round:r.round,score:r.score,incomplete:!!r.incomplete,r}));
 const pr=(withInc?S.sessions.filter(s=>arrowsIn(s)>0):done()).filter(s=>!s.sample).map(s=>({kind:s.src=='paper'?'competition':'practice',date:s.date,round:s.round,score:total(s),incomplete:!isDone(s),s}));return[...off,...pr].sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0)}
function latestShoot(){const L=realShoots();if(!L.length)return null;const x=L[L.length-1],prior=L.slice(0,-1).filter(y=>y.round==x.round&&!y.incomplete);
 const pb=prior.length?Math.max(...prior.map(y=>y.score)):null,u=prior.slice(-5),usual=u.length?u.reduce((a,y)=>a+y.score,0)/u.length:null;
 let cat=x.incomplete?'incomplete':!prior.length?'first':x.score>pb?'pb':x.score>=pb*0.98?'great':x.score<usual*0.95?'tough':'solid';
 const diff=cat=='pb'?x.score-pb:cat=='great'?pb-x.score:Math.abs(Math.round((usual||x.score)-x.score));return{...x,cat,pb,usual:usual&&Math.round(usual),diff}}
function fill(t,v){return t.replace(/\{(\w+)\}/g,(_,k)=>v[k]??'')}
function rot(key,list,n=1){S.rot=S.rot||{};const r=S.rot[key]||{shoot:null,i:-1};const sk=S._shootKey;if(r.shoot!==sk){r.i=(r.i+n)%list.length;r.shoot=sk;S.rot[key]=r;save()}return[...Array(n)].map((_,k)=>list[(r.i+k)%list.length])}
function coachCard(L){const cat=L.cat=='first'?'solid':L.cat,M=(window.COACH_MSG||{})[cat];if(!M)return'';S._shootKey=L.date+'|'+L.round+'|'+L.score;
 const msg=rot('m_'+cat,M.messages)[0],nud=M.nudges.length?rot('n_'+cat,M.nudges,1):[];
 const fact=L.cat=='pb'?`${L.score} on ${L.round}, up from ${L.pb}.`:L.cat=='great'?`${L.score} on ${L.round}, just ${L.diff} off your PB of ${L.pb}.`:L.cat=='tough'?`${L.score} on ${L.round}, ${L.diff} below your usual of ${L.usual}.`:L.cat=='incomplete'?`${L.round}: round not finished, so it isn't counted in PBs or charts.`:L.cat=='first'?`${L.score} on ${L.round}. Your first score on this round, so it's the PB to beat.`:`${L.score} on ${L.round}, around your usual of ${L.usual}.`;
 const border=L.cat=='tough'?'border:3px solid var(--gold)':(L.cat=='pb'||L.cat=='great')?`border:3px solid ${CB()?'#5ab0ff':'#16a34a'}`:'';
 return`<div class="card" style="${border}"><span class="kicker">${M.kicker} · ${L.date} <span class="real">${L.kind}</span></span><h2>${msg}</h2><p class="small muted">${fact}</p>
 ${L.cat=='tough'&&L.pb?`<p>Your best on this round is <b>${L.pb}</b>. You've done it before.</p>`:''}${nud.length?`<h3>Think about it</h3><ul>${nud.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}${L.cat=='tough'?'<p class="small"><b>Your coach can help you plan your next session.</b></p>':''}${L.cat=='pb'||L.cat=='great'?'<div style="font-size:28px;text-align:center">🎉🏹🎯</div>':''}</div>`}
function latestWins(L){if(L.kind=='practice')return{s:L.s,label:L.s.round};const o=offRounds().find(x=>normDate(x.date)==L.date&&x.round==L.round&&(x.score==null||x.score==L.score))||offRounds().find(x=>normDate(x.date)==L.date&&x.round==L.round);
 if(o){const ge=o.ends.filter(e=>!e.flag);return{s:{id:'off',date:L.date,round:o.round,ends:ge.map(e=>e.arrows),dists:ge.map(e=>e.dist)},label:o.round}}return null}
/* ---------- arrow volume (300-a-day idea from George Ryles notes; not shown) ---------- */
function dayArrows(){const m={};const add=(d,n)=>{if(n>0)m[d]=(m[d]||0)+n};S.sessions.filter(s=>!s.sample).forEach(s=>add(s.date,arrows(s).length));
 offRounds().forEach(o=>add(normDate(o.date),o.ends.filter(e=>!e.flag).reduce((t,e)=>t+e.arrows.length,0)));Object.entries(S.vol||{}).forEach(([d,n])=>add(d,n));
 /* 22 Oct 2026 (Nathe): every arrow plotted in an Arrow optimizer tuning session counts too (all session types, before and after groups),
    on the day it was plotted (p[2], new arrows only) or the session's date. Read at display time; undo/clear/delete takes it back off. */
 (S.tune||[]).forEach(t=>{if(!t)return;[...(t.before||[]),...(t.after||[])].forEach(p=>{if(Array.isArray(p))add(typeof p[2]=='string'?p[2]:t.date,1)})});return m}
/* ONE definition of arrow counts, used by Home, Today's arrows, Ranks (XP) and Following: arrows from app sessions + official scoresheets
   (ends that are all misses on a sheet are treated as sheet errors and not counted) + arrows added by hand. A week starts on Monday. */
function arrowDays(name){if(!name||name==S.profile)return(window.rewardDayArrows||dayArrows)();const m={};offFor(name).forEach(o=>{const d=normDate(o.date),n=o.ends.filter(e=>!e.flag).reduce((t,e)=>t+e.arrows.length,0);if(n)m[d]=(m[d]||0)+n});return m}
const weekStart=()=>{const d=new Date(today()+'T00:00');d.setDate(d.getDate()-(d.getDay()+6)%7);return d.toLocaleDateString('en-CA')};
function weekArrows(name){const m=arrowDays(name),w=weekStart(),t=today();return Object.entries(m).filter(([d])=>d>=w&&d<=t).reduce((a,[,n])=>a+n,0)}
function weekArrowsLogged(){const m=dayArrows(),w=weekStart(),t=today();return Object.entries(m).filter(([d])=>d>=w&&d<=t).reduce((a,[,n])=>a+n,0)}
function volBadges(mm){const m=mm||dayArrows(),days=Object.keys(m).sort(),mx=Math.max(0,...Object.values(m)),B=window.VOL_BADGES;
 let best=0,run=0,prev=null;days.forEach(d=>{if(m[d]>=300){run=prev&&Math.round((new Date(d)-new Date(prev))/864e5)==1&&m[prev]>=300?run+1:1;best=Math.max(best,run)}prev=d});
 let wk=0;days.forEach(d=>{let t=0;for(let i=0;i<7;i++){t+=m[ld(new Date(d).getTime()-i*864e5)]||0}wk=Math.max(wk,t)});
 return[...B.daily.map(b=>[b[1],b[2],mx>=b[0],b[3]]),...B.streak.map(b=>[b[1],b[2],best>=b[0],b[3]]),...B.weekly.map(b=>[b[1],b[2],wk>=b[0],b[3]])]}
function volCard(){const ad=(S.vol||{})[today()]||0,g=(S.daily_goal??S.goal)||(/logan/i.test(S.profile||'')?300:0),n=dayArrows()[today()]||0,p=g?Math.min(1,n/g):0,C=2*Math.PI*42;S._shootKey=S._shootKey||today();const nd=rot('vol',window.VOL_NUDGES)[0];
 return`<div class="card"><span class="kicker">Today's arrows</span><div class="row" style="gap:12px;align-items:center"><button id="ringbtn" aria-label="${plN(n,'arrow','arrows')} today${g?" of "+g:""}. Tap to edit added arrows" style="background:none;border:0;padding:0;cursor:pointer"><svg id="volring" viewBox="0 0 100 100" width="110" height="110" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="none" stroke="var(--line)" stroke-width="10"/><circle cx="50" cy="50" r="42" fill="none" stroke="var(--gold,#e0a800)" stroke-width="10" stroke-linecap="round" id="volarc" stroke-dasharray="${C*p} ${C}" transform="rotate(-90 50 50)"/><text x="50" y="50" text-anchor="middle" font-size="22" font-weight="700" fill="var(--ink)">${n}</text><text x="50" y="66" text-anchor="middle" font-size="10" fill="var(--muted)" id="volof">${g?"of "+g:"arrows"}</text></svg></button>
 <div style="flex:1;min-width:0"><label class="small" for="goal" style="display:block">Daily goal (set by you or your coach)</label><div style="display:flex;align-items:center;gap:6px;margin-top:2px"><input id="goal" type="number" inputmode="numeric" min="0" max="1000" step="10" value="${g||""}" placeholder="–" style="width:90px;padding:8px;font-size:16px"><span class="small">arrows a day</span></div><p class="small" style="margin:6px 0">Shot some without scoring? Add them:</p><div style="display:flex;flex-wrap:wrap;gap:6px">${[6,12,36,72].map(k=>`<button class="btn ghost" data-vol="${k}" style="padding:6px 10px">+${k}</button>`).join('')}<button class="btn ghost" data-vol="-6" style="padding:6px 10px" aria-label="remove 6">−6</button></div></div></div><p class="small muted" style="margin:6px 0 0">${n-ad} from rounds + <button type="button" id="vadnum" class="vadnum" aria-label="${ad} added today, tap to edit">${ad}</button> added today. Tap the number to edit.</p><div id="vedit" hidden style="margin-top:6px"><label for="vset" class="small">Arrows added today</label><div style="display:flex;gap:6px"><input id="vset" type="number" min="0" max="2000" inputmode="numeric" value="${ad}" style="flex:1"><button class="btn" id="vsave">Set</button></div></div><button class="btn ghost" id="vreset" style="margin-top:6px;padding:6px 10px">Reset today</button><p class="small muted" style="margin:8px 0 0">💡 ${nd}</p></div>`}
function iconRow(b,size=26){return`<div class="irow" style="position:relative"><div role="list" style="display:flex;gap:6px;overflow-x:auto;white-space:nowrap;padding:4px 2px;scrollbar-width:thin">${b.map(x=>{const nm=x[1]+(x[2]?'':' (locked)');return`<span role="listitem" tabindex="0" aria-label="${nm}" title="${nm}" data-tip="${nm}" onclick="badgeTip(this)" onkeydown="if(event.key=='Enter')badgeTip(this)" style="flex:0 0 auto;font-size:${size}px;line-height:1;cursor:pointer;${x[2]?'':'filter:grayscale(1);opacity:.35'}">${x[0]}</span>`}).join('')}</div><span class="btip" hidden style="position:absolute;z-index:5;background:#0f172a;color:#fff;font-size:12px;padding:3px 8px;border-radius:6px;white-space:nowrap;pointer-events:none"></span></div>`}
function badgeTip(el){const w=el.closest('.irow'),t=w.querySelector('.btip'),r=el.getBoundingClientRect(),q=w.getBoundingClientRect();t.textContent=el.dataset.tip;t.hidden=false;t.style.top=(r.bottom-q.top+4)+'px';t.style.left=Math.max(0,Math.min(q.width-t.offsetWidth,r.left-q.left+r.width/2-t.offsetWidth/2))+'px';clearTimeout(w._t);w._t=setTimeout(()=>t.hidden=true,1800)}
function shelf(){const b=[...volBadges(),...badges()];return`<div class="card"><span class="kicker">Badges shelf</span>${iconRow(b)}</div>`}
function home(){const d=done(),real=findReal(S.profile),L=latestShoot();
 let h=`<div class="card dark"><span class="kicker">G'day ${S.profile.split(' ')[0]}</span><h1>Your progress zone</h1>
 <div class="stats"><div class="stat"><b id="wkshoots">${realShoots(true).filter(x=>x.date>=weekStart()&&x.date<=today()).length}</b>shoots this week</div><div class="stat"><b>${streak()}</b>wk streak</div><div class="stat"><b id="wkarrows">${weekArrowsLogged()}</b>arrows this week</div></div>
 <p class="small muted" style="margin:10px 0 0">You're compared with <b>your own past self</b>, not with anyone else.</p>${kidLine()}</div>`;
 if(L)h+=coachCard(L);
 /* Wins of the day: latest COMPLETE shoot only (incomplete rounds never feed stats) */
 const LC=realShoots().filter(x=>!x.incomplete).slice(-1)[0],W=LC&&latestWins(LC);
 if(W){h+=`<div class="card" id="winsday"><span class="kicker">Wins of the day · ${LC.date} <span class="real">${LC.kind}</span></span><h2>${W.label}</h2>${winsFor(W.s).map(w=>`<div class="win"><i>${w[0]}</i><div>${w[1]}</div></div>`).join('')}<button class="btn ghost" id="bank" style="margin-top:8px">⭐ Save to my best moments</button></div>`}
 else if(LC){h+=`<div class="card" id="winsday"><span class="kicker">Wins of the day · ${LC.date} <span class="real">${LC.kind}</span></span><h2>${LC.round}: ${LC.score}</h2><p class="small muted">No arrow-by-arrow data for this shoot yet, so end-by-end wins aren't available.</p></div>`}
 else{const last=d[d.length-1];if(last)h+=`<div class="card"><span class="kicker">Wins of the day · ${last.date}</span><h2>3 things you did well</h2>${winsFor(last).map(w=>`<div class="win"><i>${w[0]}</i><div>${w[1]}</div></div>`).join('')}</div>`}
 const dr=S.sessions.filter(x=>!x.sample&&ROUNDS[x.round]&&!isDone(x)&&!x.finished&&arrowsIn(x)>0);if(dr.length)h+=`<div class="card" style="border:2px solid #2563eb"><span class="kicker">Unfinished rounds</span>${dr.map(x=>`<div class="list-item row"><span><b>${esc(x.round)}</b><span class="small muted"> · ${fmtD(x.date)} · ${total(x)} so far (${arrowsIn(x)} arrows)</span></span><span class="sess-act"><button class="btn" data-resume="${x.id}" style="padding:4px 10px">Resume</button><button class="btn ghost" data-drop="${x.id}" style="padding:4px 10px">Delete</button></span></div>`).join('')}</div>`;h+=volCard();
 h+=`<div class="card"><span class="kicker">Official results · Past competitions</span><h2>Competition scores</h2>${real.length?real.slice(-6).reverse().map(r=>`<div class="list-item"><div class="row"><b>${r.score}</b><span class="real">official</span></div><div class="small">${r.round} · ${r.event} · ${r.date}${r.division?' · '+r.division:''}${r.incomplete?' <span class="sample">incomplete, not counted</span>':''}</div>${r.url?`<a class="small" href="${r.url}" target="_blank" rel="noopener">Source</a>`:''}${noteBox(r)}</div>`).join(''):csvNote()}</div>`;
 h+=noteInsights();h+=`<button class="btn alt full" id="go">✍️ Start a new session</button>`;app.innerHTML=h;
 $('#go').onclick=()=>nav('score');
 if($('#bank'))$('#bank').onclick=()=>{S.best.push({date:LC.date,text:winsFor(W.s).map(w=>w[1]).join(' '),total:LC.score,round:LC.round});save();$('#bank').textContent='Saved ✓'};

 if($('#goal')){const gi=$('#goal'),upd=()=>{const v=Math.max(0,Math.min(1000,Math.round(+gi.value||0)));S.daily_goal=v;S.goal=v;save();const n=dayArrows()[today()]||0,C=2*Math.PI*42,pp=v?Math.min(1,n/v):0;$('#volarc').setAttribute('stroke-dasharray',`${C*pp} ${C}`);$('#volof').textContent=v?'of '+v:'arrows'};gi.oninput=upd;gi.onchange=upd;gi.onkeydown=e=>{if(e.key=='Enter'){e.preventDefault();gi.blur()}};gi.onclick=e=>e.stopPropagation()}/* Today's arrows (23 Oct 2026, Nathe): the card is also shown on My archery > Practice arrows, so every change re-draws the
    screen the archer is on (render), never the Home hub. Tapping the ring or the added number opens the inline edit. */
 const vOpen=e=>{if(e){e.preventDefault();e.stopPropagation()}const v=$('#vedit');if(!v)return;v.hidden=!v.hidden;if(!v.hidden){const i=$('#vset');i.focus();try{i.select()}catch(_){}}};
 if($('#ringbtn'))$('#ringbtn').onclick=vOpen;if($('#vadnum'))$('#vadnum').onclick=vOpen;
 if($('#vset'))$('#vset').onkeydown=e=>{if(e.key=='Enter'){e.preventDefault();$('#vsave').click()}};
 if($('#vsave'))$('#vsave').onclick=e=>{if(e)e.preventDefault();S.vol=S.vol||{};S.vol[today()]=Math.max(0,Math.min(2000,Math.round(+$('#vset').value||0)));save();render()};
 if($('#vreset'))$('#vreset').onclick=()=>{if(!confirm("Reset today's added arrows?"))return;S.vol=S.vol||{};delete S.vol[today()];save();render()};app.querySelectorAll('[data-resume]').forEach(b=>b.onclick=()=>{cur=S.sessions.find(x=>x.id==b.dataset.resume);history.pushState({scoring:1},'');nav('score')});app.querySelectorAll('[data-drop]').forEach(b=>b.onclick=()=>{if(dropScore(b.dataset.drop))refreshAfterDrop()});app.querySelectorAll('[data-vol]').forEach(b=>b.onclick=()=>{S.vol=S.vol||{};const t=today();S.vol[t]=Math.max(0,(S.vol[t]||0)+ +b.dataset.vol);save();render()});bindNotes()}


/* Source refs (George Ryles notes) are kept in code only, never shown. Wording is our own. */
function cite(c){return''}
function tip(t,c){return`<div class="list-item">${t}${cite(c)}</div>`}
const KID=[['Every arrow you shoot is part of your story. Nice work showing up!',''],['What was your favourite shot today?',''],['Look back a few months and see how far you\'ve come.',''],['Tricky days still count. You kept going!','']];
function kidLine(){const k=KID[Math.floor(Date.now()/864e5)%KID.length];return`<p style="margin:10px 0 0">💬 ${k[0]}${cite(k[1]+', in simple words')}</p>`}
function roundFacts(sums,good,all,dists,fe,le,EL){const T=[],av=a=>a.reduce((x,y)=>x+y,0)/(a.length||1),m=av(sums),f1=x=>x.toFixed(1);
 if(le.length&&av(fe)-av(le)>=1)T.push(`Your last ${plN(le.length,'end','ends')} (${EL(sums.length-le.length)} to ${EL(sums.length-1)}) averaged ${plN(f1(av(fe)-av(le)),'point','points')} lower than your first ${fe.length} (${f1(av(le))} vs ${f1(av(fe))}).`);
 else if(le.length)T.push(`Your last ${plN(le.length,'end','ends')} averaged ${f1(av(le))}, compared with ${f1(av(fe))} for your first ${fe.length}.`);
 if(sums.length>1)T.push(`Your best end was ${EL(sums.indexOf(Math.max(...sums)))} with ${Math.max(...sums)}. Your lowest was ${EL(sums.indexOf(Math.min(...sums)))} with ${Math.min(...sums)}.`);
 const dv=dists.map(d=>{const a=good.filter(e=>e.dist==d).flatMap(e=>e.arrows);return{d,n:parseFloat(d)||0,v:a.reduce((t,x)=>t+val(x),0)/(a.length||1)}}).sort((a,b)=>b.n-a.n);
 if(dv.length>1)T.push(`Average per arrow: ${dv.map(x=>`${x.d} ${x.v.toFixed(2)}`).join(', ')}.`);
 const ms=all.filter(a=>a=='M').length;if(ms)T.push(`${ms} miss${ms>1?'es':''} this round.`);
 return T}
function ryTips(sums,good,all,dists,fe,le,EL){const T=roundFacts(sums,good,all,dists,fe,le,EL);
 return`<h3 style="margin-top:12px">Your round in numbers</h3>${T.map(t=>`<div class="list-item">${t}</div>`).join('')}`}

const TAGS=window.NOTE_TAGS.map(x=>[x[2],x[1],x[3]]);
function seedNotes(){S.notes=S.notes||{}}
const noteKey=r=>r.id||('o:'+normDate(r.date)+'|'+r.round);
const tagsOf=t=>{const n=window.noteTagsOf(t).map(x=>x[1]);return TAGS.filter(x=>n.includes(x[1]))};
function chips(t){return tagsOf(t).map(x=>`<span class="sample" style="background:#eef2ff;color:#1e3a8a;margin-right:4px;display:inline-flex;align-items:center;gap:4px">${x[0]} ${x[1]}</span>`).join('')}
function noteBox(r){const k=noteKey(r),t=(S.notes||{})[k]||'';return`<label class="small muted" style="display:block;margin-top:6px">How did you shoot? <textarea data-n="${k.replace(/"/g,'&quot;')}" rows="2" style="width:100%;box-sizing:border-box;font:inherit" placeholder="e.g. felt tired, windy, new arrows, didn't finish">${t.replace(/</g,'&lt;')}</textarea></label><div class="chips">${chips(t)}</div>`}
function bindNotes(){app.querySelectorAll('[data-n]').forEach(el=>el.oninput=()=>{S.notes=S.notes||{};S.notes[el.dataset.n]=el.value;save();el.closest('label').nextElementSibling.innerHTML=chips(el.value)})}
function noteInsights(){const items=[];const rel=(list,sc)=>{const g={};list.forEach(x=>(g[x.round]=g[x.round]||[]).push(x));for(const r in g){const a=g[r],m=a.reduce((t,x)=>t+sc(x),0)/a.length;if(m)a.forEach(x=>items.push({pct:(sc(x)/m-1)*100,t:(S.notes||{})[noteKey(x)]}))}};
 rel(done(),total);rel(findReal(S.profile||'').filter(r=>!r.incomplete),r=>r.score);
 const out=TAGS.map(([e,n])=>{const w=items.filter(i=>tagsOf(i.t).some(x=>x[1]==n)),o=items.filter(i=>!tagsOf(i.t).some(x=>x[1]==n));if(w.length<2||!o.length)return'';const d=w.reduce((a,b)=>a+b.pct,0)/w.length-o.reduce((a,b)=>a+b.pct,0)/o.length;
  return`<div class="list-item">${e} On <b>${n.toLowerCase()}</b> days you score <b>${Math.abs(d).toFixed(1)}% ${d<0?'less':'more'}</b> than your usual for that round (${w.length} sessions).</div>`}).filter(Boolean);
 return`<div class="card"><span class="kicker">From your notes</span><h3>What your notes show</h3>${out.length?out.join('')+'<p class="small muted">Compared with your own average for the same round.</p>':'<p>Add a note under each score (tired, windy, nerves, new gear, sore, didn\'t finish). Once 2 sessions share a tag, you\'ll see how it affects your scores.</p>'}</div>`}

let fix=null;
const isBug=R=>!!(R&&R.bugs);const BUGC=[[0,-0.62],[0,0],[0,0.62]];
/* WA indoor 3-spot faces (40cm 18m / 60cm 25m): vertical column (same spot centres as the old Bugs Eyes layout, so old plotted arrows still land on a spot) or the triangular face.
   Triangular face (Vegas, WA indoor, Australian Indoor, Lancaster): one spot on top, two below.
   Spot 1 is the top spot, Spot 2 the bottom left, Spot 3 the bottom right (TRIC index 0, 1, 2).
   TRIC0 is the older two-on-top layout (index 0 left, 1 right, 2 the single spot below). TRIC1 is the one-on-top layout with the previous numbers
   (0 bottom left, 1 bottom right, 2 top). A saved point is never rewritten. Drawing maps it onto TRIC:
   no g is still in TRIC0 and moves onto the same physical spot (old 0 -> Spot 2, old 1 -> Spot 3, old 2 -> Spot 1);
   g:1 is already on that physical spot in TRIC1, so its coordinates stay and the nearest TRIC centre supplies the new number;
   g:2 was saved with these numbers and is already in TRIC. Vertical 3-spot and single faces are not part of this.
   10-zone faces scored X,10-6 + M: gold 10/9, red 8/7, blue 6. Bugs Eyes is field-only (20 Oct 2026). */
const TRIC0=[[-0.34,-0.2],[0.34,-0.2],[0,0.39]];
const TRIC1=[[-0.34,0.2],[0.34,0.2],[0,-0.39]];
const TRIC=[[0,-0.39],[-0.34,0.2],[0.34,0.2]];
const TRI_OLD=[1,2,0];
const triNear=(p,L)=>L.reduce((b,c,n)=>Math.hypot(p.x-c[0],p.y-c[1])<Math.hypot(p.x-L[b][0],p.y-L[b][1])?n:b,0);
function triPt(p){if(!p||p.g===1||p.g===2||!isFinite(p.x)||!isFinite(p.y))return p;const i=triNear(p,TRIC0),o=TRIC0[i],n=TRIC[TRI_OLD[i]];return {...p,x:n[0]+(p.x-o[0]),y:n[1]+(p.y-o[1])}}
window.triPt=triPt;
const spots3=R=>R&&R.tri?TRIC:R&&R.vert?BUGC:null;
const indoor3=(R,F)=>!!(R&&F&&R.ape==3&&!R.aba&&!/field/.test(F.face||'')&&/^(40|60)cm( full| 3-spot)?$/.test(F.face||''));
const bugsOn=s=>!!(s&&s.bugs&&ROUNDS[s.round]&&/field/.test(faceR(ROUNDS[s.round],0).face||''));
/* a session is on a 3-spot if it chose one (face3), used the old Bugs Eyes column (same layout), or has no plotted arrows yet; older plotted sessions keep the full 40cm face they were plotted on */
const use3=(s,R,F)=>indoor3(R,F)&&s.face3!='single'&&!!(s.face3||s.bugs||!(s.pos||[]).some(e=>(e||[]).some(Boolean)));
/* Bugs Eyes is the field 3-spot: same spot tabs, zoom and next-spot advance as the indoor 3-spot (Spot 1, Spot 2, Spot 3). */
const bug3=(s,R,i)=>!!(s&&s.bugs&&R&&isFld(faceR(R,i)));
const to1spot=(p,L)=>{const c=L.reduce((b,q)=>Math.hypot(p.x-q[0],p.y-q[1])<Math.hypot(p.x-b[0],p.y-b[1])?q:b,L[0]);return{...p,x:(p.x-c[0])/0.6,y:(p.y-c[1])/0.6}};
const face3R=(F,c)=>({...F,face:((F.face||'').match(/^\d+/)||['40'])[0]+'cm 3-spot',[(c&&c.face3)=='vegas'?'tri':'vert']:true});const isSix=R=>!isBug(R)&&/6-ring/.test(R.face||'');const isSpot=R=>/3-spot/.test(R.face||'');const isIfaa=R=>!!(R&&(R.ifaa||/ifaa/i.test((R.face||'')+(R.type||''))));window.isIfaa=isIfaa;const isFld=R=>!isBug(R)&&!isIfaa(R)&&/field/.test((R&&R.face)||'')&&!(R&&R.scheme&&R.scheme!=='wa10');
/* Australian Indoor 18m faces (23 Oct 2026, Nathe): face3 'vert' = vertical 3-spot, the "traffic light"; 'vegas' = triangular 3-spot; 'single' = the single 40cm face
   (plotted and scored on the full face). Other indoor rounds keep vertical / Vegas only. The pick is remembered in S.face3a so S.face3 never holds 'single'. */
const AUSI='Australian Indoor 18m',F3AUS=[['vert','Vertical 3-spot (traffic light)'],['vegas','Triangular 3-spot'],['single','Single 40cm face']];
const f3Pref=r=>r==AUSI?(F3AUS.some(o=>o[0]==S.face3a)?S.face3a:'vert'):(S.face3||'vert');
const f3Name=(r,f)=>r==AUSI?(F3AUS.find(o=>o[0]==f)||F3AUS[0])[1]:f=='single'?'Single face':f=='vegas'?'Vegas 3-spot':'Vertical 3-spot';
/* Single face for the other 40cm / 60cm indoor rounds in Just me (28 Oct 2026, Nathe): archers who can't shoot the 3-spot score on one full face, one target per end, X 10-1 M.
   Offered on Indoor WA 18m / 25m / Combined only (not Vegas 300, whose game is the 3-spot, not custom or ABA rounds, and not Casual, where each archer has their own Face buttons in casual.js; match nights do offer it, each archer on their own phone). The pick is remembered in S.face1
   (true = single); S.face3 keeps holding only the 3-spot layout (vert / vegas), so default behaviour for everyone who never picks it is unchanged. */
const f3One=r=>{const R=ROUNDS[r];return!!R&&r!=AUSI&&!R.vegas&&!R.custom&&!R.aba&&!R.league&&!R.lancaster&&indoor3(R,faceR(R,0))};
const f3Start=r=>f3One(r)&&S.face1?'single':f3Pref(r);
const f3Can=(c,R,F)=>!!(c&&indoor3(R,F)&&(c.round==AUSI||(f3One(c.round)&&!c.casual&&!c.league)));
const f3Row=(r,solo)=>{if(r!=AUSI){if(!solo||!f3One(r))return'';const v=S.face1?'single':'three';return`<label>Face</label><div class="zbar f3bar" role="group" aria-label="Face" style="justify-content:flex-start;flex-wrap:wrap;gap:6px;margin:4px 0">${[['three','Three spot'],['single','Single face']].map(([k,l])=>`<button type="button" class="zb${k==v?' on':''}" data-f1="${k}" aria-pressed="${k==v}">${l}</button>`).join('')}</div>`}const v=f3Pref(r);return`<label>Face</label><div class="zbar f3bar" role="group" aria-label="Face" style="justify-content:flex-start;flex-wrap:wrap;gap:6px;margin:4px 0">${F3AUS.map(([k,l])=>`<button type="button" class="zb${k==v?' on':''}" data-f3="${k}" aria-pressed="${k==v}">${l}</button>`).join('')}</div>`};
const f3Bind=(w,again)=>{w.querySelectorAll('[data-f3]').forEach(b=>b.onclick=()=>{S.face3a=b.dataset.f3;save();again()});w.querySelectorAll('[data-f1]').forEach(b=>b.onclick=()=>{S.face1=b.dataset.f1=='single';save();again()})};
/* WA indoor 18 m, 25 m and combined (Book 2 7.2.2, Book 3 12.5.1; AA 10.1): keys 10, 9, 8, 7, 6, M. No X.
   Sighted compound: only the 2 cm inner ring scores 10; the rest of that gold scores 9.
   Recurve, Barebow, Barebow Compound and W1: the whole 4 cm ring scores 10.
   Australian Indoor, on the single face and on a 3-spot, keeps X and 10 down to 6, then M. X scores 10 and is only the second tie-break. */
function sightedCompound(){let b='';try{if(typeof myBow==='function')b=myBow();else{const r=findReal(S.profile||'').filter(x=>x.division).slice(-1)[0];b=(r&&r.division)||S.bow||'Compound'}}catch(e){}
 const t=String(b||'');if(/barebow|longbow|\bw1\b/i.test(t))return false;return /compound/i.test(t)}
window.sightedCompound=sightedCompound;
function faceKeys(R,FR){if(R&&R.wa18)return['10','9','8','7','6','M'];if(R&&R.ausi)return['X','10','9','8','7','6','M'];if(R&&R.lancaster)return['X','10','9','8','7','6','M'];if(isIfaa(R)||isIfaa(FR))return['5','4','3','M'];if(isBug(FR)||isFld(FR))return['6','5','4','3','2','1','M'];const xk=R&&R.xs===false?[]:['X'];const nums=isSpot(FR)?['10','9','8','7','6']:isSix(FR)?['10','9','8','7','6','5']:['10','9','8','7','6','5','4','3','2','1'];return[...xk,...nums,'M']}
window.faceKeys=faceKeys;
/* d is in full-face units (1 = the 40 cm radius). 0.05 is the 2 cm ring, 0.1 the 4 cm ring, 0.5 the 6 ring. */
function wa18Score(d,inner){if(d>0.5)return'M';if(inner){if(d<=0.05)return'10';return String(Math.min(9,10-Math.floor(Math.max(0,d)*10)))}if(d<=0.1)return'10';return String(Math.min(9,10-Math.floor(Math.max(0,d)*10)))}
window.wa18Score=wa18Score;
/* Field pegs, faces and distances: World Archery Book 2 art. 4.5.2.2 (2026-01-27). [marked distances],[unmarked min,max] in metres. Archery Australia Doc 26 matches. */
const FLD={red:{80:[[50,55,60],[35,55]],60:[[35,40,45],[20,35]],40:[[20,25,30],[15,25]],20:[[10,15,20],[10,15]]},blue:{80:[[40,45,50],[30,45]],60:[[30,35,40],[15,30]],40:[[15,20,25],[10,20]],20:[[5,10,15],[5,10]]},yellow:{80:[[30,35,40],[20,35]],60:[[20,25,30],[15,25]],40:[[10,15,20],[10,15]],20:[[5,10,15],[5,10]]}};
const PEGS=['red','blue','yellow'],PEGN={red:'Red',blue:'Blue',yellow:'Yellow'},COL20=[[0,-0.62],[0,0],[0,0.62]];
const fldDists=(peg,f,marked)=>{const t=(FLD[peg]||FLD.red)[f]||FLD.red[80];if(marked)return t[0].slice();const o=[];for(let m=t[1][0];m<=t[1][1];m++)o.push(m);return o};
const snapDist=(L,d)=>d==null||!isFinite(d)?L[0]:L.reduce((b,x)=>Math.abs(x-d)<Math.abs(b-d)?x:b,L[0]);
/* default peg from division and age: adult recurve/compound red; barebow, traditional and U18 recurve/compound blue; U18 barebow and longbow yellow */
function pegForDivision(d){d=String(d||'');const u18=/under\s*(1[0-8]|[0-9])\b|\bu\s?(1[0-8]|[0-9])\b|cub|junior|cadet/i.test(d);if(/longbow/i.test(d))return'yellow';if(/barebow/i.test(d))return u18?'yellow':'blue';if(/traditional/i.test(d))return'blue';return u18?'blue':'red'}
function defaultPeg(){let d=S.division||'';if(!d)try{const off=findReal(S.profile||'').filter(r=>r.division).slice(-1)[0];d=(off&&off.division)||''}catch(e){}return pegForDivision(d)}
const fldMarked=F=>!/unmarked/i.test((F&&F.dist)||'');
/* face + distance for end ei of a field session: carries over from the previous end until changed */
function fldFor(s,ei,F0){if(!s.peg)s.peg=defaultPeg();s.ff=s.ff||[];let e=s.ff[ei];const L0=b=>fldDists(s.peg,b.f,fldMarked(F0));if(!e){let pv=null;for(let j=ei-1;j>=0;j--)if(s.ff[j]){pv=s.ff[j];break}const f=pv?pv.f:80;e={p:s.peg,f,d:snapDist(L0({f}),pv?pv.d:null)};s.ff[ei]=e}else{const L=L0(e);if(!L.includes(e.d))e.d=snapDist(L,e.d)}return e}
const fldFR=e=>({face:`${e.f}cm field`,dist:e.d+'m',fld:e.f,col:e.f==20});
/* score a tap on the face; the 20 cm column stores each arrow relative to its own spot, in face units */
function tapScore(q,FR,R,lc){if(FR&&FR.col){let i=0,b=9;COL20.forEach(([cx,cy],k)=>{const d=Math.hypot(q.x-cx,q.y-cy);if(d<b){b=d;i=k}});const x=(q.x-COL20[i][0])/0.3,y=(q.y-COL20[i][1])/0.3;return{k:plotScore(x,y,FR,lc),xy:{x:+x.toFixed(3),y:+y.toFixed(3),s:i}}}const xy={x:+q.x.toFixed(3),y:+q.y.toFixed(3)};if(FR&&FR.tri)xy.g=2;return{k:plotScore(q.x,q.y,Object.assign({xs:R&&R.xs},FR),lc),xy}}
const faceVB=R=>R&&R.col?'-0.33 -0.95 0.66 1.9':R&&R.tri?'-0.67 -0.72 1.34 1.25':isBug(R)||(R&&R.vert)?'-0.31 -0.93 0.62 1.86':isSpot(R)?'-0.54 -0.54 1.08 1.08':isSix(R)?'-0.64 -0.64 1.28 1.28':'-1.04 -1.04 2.08 2.08';
/* face for a given end: custom rounds have distance blocks, each with its own face */
function faceR(R,ei){if(!R.blocks)return R;let k=0;for(const b of R.blocks){k+=+b.ends;if(ei<k)return{face:`${b.size}cm ${b.type}`,dist:b.dist+b.unit}}const b=R.blocks[R.blocks.length-1];return{face:`${b.size}cm ${b.type}`,dist:b.dist+b.unit}}
/* custom practice rounds (practice only, never counted for classification) */
/* a 3D practice round: ABA scoring (3-arrow half then 1-arrow half, 20 a target); odd counts put the extra target in the first half */
function abaCustom(c){const n=Math.max(2,Math.round(+c.targets||20)),h1=Math.ceil(n/2),h2=n-h1;return{ends:n,ape:1,face:'ABA 3D animal',max:20*n,aba:3,halves:[{n:3,t:h1,l:'3A',name:'3-arrow half',desc:'up to 3 arrows a target: the first arrow to hit scores'},{n:1,t:h2,l:'1A',name:'1-arrow half',desc:'one arrow a target: a miss scores 0'}],custom:true,practice:true,kind:'3d',targets:n}}
window.abaCustom=abaCustom;
function regCustom(){(S.customRounds||[]).forEach(c=>{if(c.kind=='3d'){ROUNDS[c.name]=abaCustom(c);return}const ends=c.blocks.reduce((t,b)=>t+ +b.ends,0);ROUNDS[c.name]={ends,ape:+c.ape,face:c.blocks.map(b=>`${b.size}cm ${b.type}`).join(' / '),max:ends*c.ape*10,custom:true,practice:true,blocks:c.blocks,xs:c.xs}});
 /* a deleted custom shoot stays out of the picker, but its definition stays so scores already shot still open under the saved name */
 const ret=S.retiredRounds||{};Object.keys(ret).forEach(n=>{if((S.customRounds||[]).some(c=>c.name===n)){delete ret[n];return}const snap=JSON.parse(JSON.stringify(ret[n]||{}));if(!ROUNDS[n])ROUNDS[n]=snap;ROUNDS[n].custom=true;ROUNDS[n].retired=true})}
/* Marks drawn ON the target face (selected arrow, magnifier crosshair, group circle): bright green with a dark outline so they show on every ring colour. */
const FM=CBC('#39ff14','#ffffff'),FMO='#0b0f17';
const faceHi=frag=>{const o=frag.replace(/stroke="#39ff14" stroke-width="([0-9.e-]+)"/g,(m,w)=>`stroke="${FMO}" stroke-width="${(+w*2.2).toFixed(4)}"`)+frag;return CB()?o.replace(/#39ff14/g,'#ffffff'):o};/* dark copy underneath, green on top (white in colour-blind mode) */
const cbLab=(x,y,r,lab)=>lab?`<text x="${x}" y="${y}" font-size="${(r*(String(lab).length>1?1.25:1.55)).toFixed(4)}" font-weight="800" font-family="Arial,sans-serif" text-anchor="middle" dominant-baseline="central" fill="#000" pointer-events="none">${lab}</text>`:'';
/* colour-blind mode: plotted arrows are white dots with a black outline and the score inside, readable on every ring */
/* Arrow size (30 Oct 2026, Nathe: "We need to choose arrow size. Because I'm shooting 23s and the target should not be touching X from outside of the 10").
   Plotted arrows are drawn at the true shaft diameter, to scale on the real face.
   Line cutters (Nathe chose this, 30 Oct 2026): a NEW shoot (s.lcT=1, set by startRound with s.arrowD locked from My arrows) is scored with the
   true arrow radius too, so the drawn edge and the score agree. Shoots without lcT (everything saved before) keep the old fixed allowance
   (7 mm on 3-spot, 5.6 mm elsewhere) for scoring AND drawing; their stored scores are never recalculated. The scoring dropdown lists only the
   archer's saved arrows (name and diameter). The diameter still comes from the shaft name via setArrowMM (64ths, or Easton's published O.D.).
   Per session in s.arrowD {k,mm}: k is the saved arrow id (older shoots keep a catalogue key such as s23). Written when a new shoot starts
   from the arrow set on the current bow, else the last shoot, else 23/64", and changeable only before its first plotted arrow. */
const X10PP4=[[250,.245],[300,.236],[340,.231],[380,.227],[420,.224],[470,.220],[520,.217],[570,.215],[610,.218],[660,.215],[710,.213],[810,.209],[880,.207],[1000,.204],[1150,.208]];
const A64=[27,26,25,24,23,22,20,19],IN=25.4;
window.arrowOpts=()=>[...A64.map(n=>['s'+n,n+'/64 in ('+(n/64*IN).toFixed(1)+' mm)',n/64*IN,'Standard sizes']),
 ...X10PP4.map(([sp,od])=>['x4-'+sp,'X10 Parallel Pro 4mm, '+sp+' spine ('+(od*IN).toFixed(2)+' mm)',od*IN,'Thin shafts (Easton O.D.)']),
 ['x32-600','X10 Parallel Pro 3.2mm, 600 spine ('+(.194*IN).toFixed(2)+' mm)',.194*IN,'Thin shafts (Easton O.D.)']];
/* size from an arrow set's shaft / name: "SuperDrive 23", "X23s", "X10 Parallel Pro" + spine; null when it can't tell */
window.setArrowMM=a=>{if(!a)return null;const t=((a.shaft||'')+' '+(a.name||'')).toLowerCase(),sp=parseInt(a.spine)||0;
 if(/parallel\s*pro|x10\s*4\s*mm|4\s*mm\s*x10/.test(t)){if(/3\.2/.test(t))return .194*IN;const r=sp?X10PP4.reduce((b,q)=>Math.abs(q[0]-sp)<Math.abs(b[0]-sp)?q:b):null;return r?r[1]*IN:null}
 const m=t.match(/(?:^|[^\d.])(19|20|22|23|24|25|26|27)(?:'?s)?(?![\d.])/);return m?+m[1]/64*IN:null};
window.arrowMM=s=>{const d=s&&s.arrowD;if(d&&+d.mm>0)return+d.mm;const a=typeof curSet=='function'?curSet():null;return setArrowMM(a)||23/64*IN};
/* Saved arrows for the scoring dropdown (Nathe: only the list from My arrows, on every screen that plots).
   arrowOpts / setArrowMM stay: My arrows still stores a shaft name, and that name is read as a diameter the same way.
   Shoots already saved with a catalogue key (s23, x4-610, …) keep that key and that millimetre value. */
const arrowMmLab=mm=>((+mm)>0?(+mm).toFixed(2)+' mm':'');
window.arrowSaved=()=>{let L=[];try{L=typeof myArrows==='function'?myArrows():(typeof mySets==='function'?mySets():[])}catch(e){L=[]}
 const def=23/64*IN;return (L||[]).filter(a=>a&&a.id).map(a=>{const known=setArrowMM(a),mm=known>0?known:def;return {id:String(a.id),name:String(a.name||'Arrow').trim()||'Arrow',mm,known:!!(known>0)}})}
window.arrowById=id=>arrowSaved().find(a=>a.id==id)||null;
/* the arrow already on this shoot, else the set chosen with the current bow (S.arrowSel), else the set last used on a shoot, else the first saved set */
window.arrowPref=s=>{const L=arrowSaved();if(!L.length)return null;const k=s&&s.arrowD&&s.arrowD.k;if(k&&L.some(a=>a.id==k))return L.find(a=>a.id==k);
 const sel=S.arrowSel&&S.arrowSel[S.profile];if(sel&&L.some(a=>a.id==sel))return L.find(a=>a.id==sel);
 const prev=[...(S.sessions||[])].reverse().find(x=>x&&x!==s&&x.arrowD&&L.some(a=>a.id==x.arrowD.k));return prev?L.find(a=>a.id==prev.arrowD.k):L[0]};
window.arrowSess=sid=>{if(sid=='cur')return cur;const s=(S.sessions||[]).find(x=>String(x.id)==sid);if(s)return s;const p=String(sid||'').split('|');
 if(p[0]=='lg'&&typeof lgGet==='function'&&typeof lgEnt==='function'){const lg=lgGet(p[1]);return lg?lgEnt(lg,p[3],+p[2]):null}
 if(p[0]=='cs'&&typeof csGet==='function'&&typeof csEnt==='function'){const cs=csGet(p[1]);return cs?csEnt(cs,p[2]):null}return null};
const arrowPlotted=s=>!!(s&&(s.pos||s.p||[]).some(E=>(E||[]).some(Boolean)));
/* the size the next plot will use. Read only. A shoot that already has plots keeps the size it was scored with. */
window.arrowNow=function(s,sid){if(arrowPlotted(s))return s;const pend=sid&&window._arrowPend&&window._arrowPend[sid];if(pend&&+pend.mm>0)return {lcT:1,arrowD:pend};
 if(s&&s.arrowD&&+s.arrowD.mm>0&&(arrowById(s.arrowD.k)||!arrowSaved().length))return {lcT:s.lcT||1,arrowD:s.arrowD};
 const p=arrowPref(s),mm=p?p.mm:23/64*IN,k=p?p.id:'s23';return {lcT:1,arrowD:{k,mm:+(+mm).toFixed(3)}}};
/* write that size onto a new shoot, before the first plotted arrow. An older shoot (plots, no lcT) is left exactly as stored. */
window.arrowApply=function(s,sid){if(!s||(arrowPlotted(s)&&!s.lcT))return s&&s.arrowD||null;if(arrowPlotted(s)&&s.lcT&&s.arrowD&&+s.arrowD.mm>0)return s.arrowD;
 const n=arrowNow(s,sid);s.arrowD={k:n.arrowD.k,mm:+(+n.arrowD.mm).toFixed(3)};s.lcT=1;return s.arrowD};
window.arrowKey=s=>{const d=s&&s.arrowD;if(d&&d.k)return d.k;const p=arrowPref(s);if(p)return p.id;const mm=arrowMM(s),o=arrowOpts().find(x=>Math.abs(x[2]-mm)<0.005);return o?o[0]:'mm'};
/* radius in the face drawing's own units (faceSVG coordinates): 1 = full-face radius = cm*5 mm; 3-spot spots are drawn at 0.6, the 20cm field column at 0.3 */
/* line-cutter radius for plotScore, in its own units (3-spot: per-spot units, 1 = full-face radius; 20cm field column: 100 mm). null = old allowance */
window.arrowLC=(R,s,cm)=>{if(!s||!s.lcT||!R||isBug(R))return null;const D=arrowMM(s);if(!(D>0))return null;if(isFld(R)&&R.col)return D/2/100;const c=cm||+(((R.face||'').match(/^(\d+)cm/)||[])[1]||0);return c?D/2/(c*5):null};
window.arrowRU=(R,D,cm)=>{if(!R||!(D>0)||isBug(R))return null;if(isFld(R)&&R.col)return D/2/100*0.3;const c=cm||+(((R.face||'').match(/^(\d+)cm/)||[])[1]||0);if(!c)return null;const r=D/2/(c*5);return spots3(R)?r*0.6:r};
/* WA Book 4 Art. 19.1.7 (2026-03-13 and 2026-08-15; Archery Australia field uses the same limit) caps a field shaft at 9.3 mm.
   arrowFldOpts keeps that whole-millimetre list (4 mm through 9 mm). The scoring dropdown does not offer it: every plotting screen, field included,
   lists the saved arrows only, and the plot uses that arrow's diameter. */
window.arrowIsFld=s=>{const R=s&&s.round&&ROUNDS[s.round];return !!(R&&isFld(faceR(R,0)))};
window.arrowFldMaxMM=9;
window.arrowFldOpts=()=>{const o=[];for(let mm=4;mm<=arrowFldMaxMM;mm++)o.push(['f'+mm,mm+' mm',mm]);return o};
const arrowHit=k=>arrowOpts().find(o=>o[0]==k)||arrowFldOpts().find(o=>o[0]==k);
/* the picker, one select. sid = session id, 'cur' for the shoot being scored, or lg|code|week|archer / cs|code|archer.
   Options are only that archer's saved arrows (name and diameter). No catalogue list and no custom millimetre box.
   With none saved, one disabled option and a link to My arrows; plotting stays on the usual 23 (9.13 mm). */
window.arrowSizeLab=s=>{const k=arrowKey(s),a=arrowById(k),mm=+((s&&s.arrowD&&+s.arrowD.mm>0)?s.arrowD.mm:(a?a.mm:arrowMM(s)));
 if(a)return esc(a.name)+' ('+arrowMmLab(mm)+')';const o=arrowHit(k);return o?o[1]:(+mm).toFixed(2)+' mm'};
window.arrowSizeTxt=s=>`<span class="small arrowsz">Arrow size ${arrowSizeLab(s)}</span>`;
window.arrowPick=(s,sid)=>{const safe=String(sid).replace(/"/g,''),L=arrowSaved();
 if(!L.length)return `<label class="small arrowsz"><span>Arrow size</span> <select data-arrowsz="${safe}" aria-label="Arrow size, drawn to scale on the face" disabled><option value="">No saved arrows - add one in My arrows</option></select> <a href="#" data-myarrows="1">My arrows</a></label>`;
 const now=arrowNow(s,sid),k=now&&now.arrowD&&now.arrowD.k,sel=L.some(a=>a.id==k)?k:L[0].id;
 return `<label class="small arrowsz"><span>Arrow size</span> <select data-arrowsz="${safe}" aria-label="Arrow size, drawn to scale on the face">${L.map(a=>`<option value="${esc(a.id)}"${a.id==sel?' selected':''}>${esc(a.name)} (${arrowMmLab(a.mm)})</option>`).join('')}</select></label>`};
document.addEventListener('change',ev=>{const el=ev.target;if(!el||!el.matches||!el.matches('select[data-arrowsz]'))return;const sid=el.dataset.arrowsz,s=arrowSess(sid);
 if(s&&s.lcT&&arrowPlotted(s)){el.value=arrowKey(s);return}/* size is fixed once an arrow is plotted with it */
 const a=arrowById(el.value);if(!a){const n=arrowNow(s,sid);if(n&&n.arrowD)el.value=n.arrowD.k;return}
 const rec={k:a.id,mm:+(+a.mm).toFixed(3)};window._arrowPend=window._arrowPend||{};window._arrowPend[sid]=rec;
 if(S.profile){S.arrowSel=S.arrowSel||{};S.arrowSel[S.profile]=a.id}/* last used, and the set on the current bow */
 if(s&&!arrowPlotted(s)){s.arrowD=rec;s.lcT=1}save();
 const w=el.closest('.shpc');if(w&&s&&window.shotPlotRedraw)shotPlotRedraw(w,s);else if(sid=='cur')score();
 else if(sid.slice(0,3)=='lg|'&&window._lgv&&typeof lgView==='function'){window._lgKeep=1;lgView(window._lgv)}
 else if(sid.slice(0,3)=='cs|'&&window._csv&&typeof csView==='function')csView(window._csv)});
document.addEventListener('click',ev=>{const a=ev.target&&ev.target.closest&&ev.target.closest('[data-myarrows]');if(!a)return;ev.preventDefault();if(typeof nav==='function')nav('lab_myarrows')});
let _AR=null;/* true arrow radius for the face being drawn (faceSVG sets it); null = old fixed size */
const arrowDot=(p,r,sw,lab)=>{const T=_AR||r,W=_AR?Math.min(sw,_AR*0.3):sw;return CB()?(p.sel?`<circle cx="${p.x}" cy="${p.y}" r="${r*3.3}" fill="none" stroke="${FMO}" stroke-width="${sw*2.4}"/><circle cx="${p.x}" cy="${p.y}" r="${r*3.3}" fill="none" stroke="#fff" stroke-width="${sw*1.2}"/>`:'')+`<circle cx="${p.x}" cy="${p.y}" r="${r*2.3}" fill="#fff" stroke="#000" stroke-width="${sw*(p.sel?1.6:1)}"/>`+cbLab(p.x,p.y,r*2.3,lab):p.sel?`<circle cx="${p.x}" cy="${p.y}" r="${T*2.3}" fill="none" stroke="${FMO}" stroke-width="${sw*2.4}"/><circle cx="${p.x}" cy="${p.y}" r="${T*2.3}" fill="none" stroke="${FM}" stroke-width="${sw*1.2}"/><circle cx="${p.x}" cy="${p.y}" r="${(T-W*0.65).toFixed(4)}" fill="${FM}" stroke="${FMO}" stroke-width="${(W*1.3).toFixed(4)}"/>`:`<circle cx="${p.x}" cy="${p.y}" r="${(T-W/2).toFixed(4)}" fill="#22c55e" stroke="#000" stroke-width="${W.toFixed(4)}"/>`};
const ptLab=(p,R)=>CB()?(p.k!=null?p.k:plotScore(p.x,p.y,R||{})):'';
function faceSVG(pts,id,vb,R,extra='',A){_AR=A&&A.d>0?arrowRU(R,A.d,A.cm):null;if(isFld(R)&&R.col){let g=`<svg id="${id}" viewBox="${vb}" width="100%" style="touch-action:none;display:block;background:#fff" role="img" aria-label="20 cm field faces, column of 3 spots, one arrow per spot">`;COL20.forEach(([cx,cy])=>{[1,.8,.6,.4,.2,.1].forEach((r,i)=>{const y=i>3;g+=`<circle cx="${cx}" cy="${cy}" r="${r*0.3}" fill="${y?'#ffd84d':'#111'}" stroke="${y?'#111':'#fff'}" stroke-width="0.004"/>`});g+=`<path d="M${cx-.008} ${cy}H${cx+.008}M${cx} ${cy-.008}V${cy+.008}" stroke="#111" stroke-width="0.002"/>`});pts.forEach(p=>{const c=COL20[p.s||0]||COL20[1];g+=arrowDot({...p,x:c[0]+p.x*0.3,y:c[1]+p.y*0.3},0.018,0.005,ptLab(p,R))});return g+extra+'</svg>'}if(isFld(R)){/* WA field face, Book 2 8.2.1: zone diameters 10/8/6/4/2/1 tenths */let g=`<svg id="${id}" viewBox="${vb}" width="100%" style="touch-action:none;display:block;background:#fff" role="img" aria-label="WA field face, tap where the arrow landed">`;[1,.8,.6,.4,.2,.1].forEach((r,i)=>{const y=i>3;g+=`<circle r="${r}" fill="${y?'#ffd84d':'#111'}" stroke="${y?'#111':'#fff'}" stroke-width="0.006"/>`});g+=`<path d="M-.02 0H.02M0 -.02V.02" stroke="#111" stroke-width="0.004"/>`;pts.forEach(p=>g+=arrowDot(p,0.025,0.008,ptLab(p,R)));return g+extra+'</svg>'}if(isBug(R)){let g=`<svg id="${id}" viewBox="${vb}" width="100%" style="touch-action:none;display:block;background:#fff" role="img" aria-label="Bugs Eyes field 3-spot face, tap where the arrow landed">`;BUGC.forEach(([cx,cy])=>{for(let i=0;i<6;i++){const blk=i<4;g+=`<circle cx="${cx}" cy="${cy}" r="${0.3-i*0.05}" fill="${blk?'#111':'#ffd84d'}" stroke="${blk?'#fff':'#111'}" stroke-width="0.005"/>`}});pts.forEach(p=>g+=arrowDot(p,0.02,0.006,ptLab(p,R)));return g+extra+'</svg>'}const rings=[['#fff','#333'],['#fff','#333'],['#111','#fff'],['#111','#fff'],['#2563eb','#111'],['#2563eb','#111'],['#d62828','#111'],['#d62828','#111'],['#ffd84d','#111'],['#ffd84d','#111']];
 if(spots3(R)){let g=`<svg id="${id}" viewBox="${vb}" width="100%" style="touch-action:none;display:block;background:#fff" role="img" aria-label="${R.tri?'Vegas':'Vertical'} 3-spot face, tap where the arrow landed">`;spots3(R).forEach(([cx,cy])=>{for(let i=5;i<10;i++)g+=`<circle cx="${cx}" cy="${cy}" r="${((1-i*0.1)*0.6).toFixed(3)}" fill="${rings[i][0]}" stroke="${rings[i][1]}" stroke-width="0.004"/>`;g+=`<circle cx="${cx}" cy="${cy}" r="0.03" fill="none" stroke="#111" stroke-width="${R&&R.inner10?'0.006':'0.003'}"/>`;if(R&&R.wa18&&R.inner10)g+=`<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="0.026" font-weight="700" fill="#111">10</text><text x="${+(cx+0.046).toFixed(3)}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="0.02" font-weight="700" fill="#111">9</text>`});pts.forEach(p=>{const q=R.tri?triPt(p):p;g+=arrowDot(q,0.02,0.006,ptLab(q,R))});return g+extra+'</svg>'}
 let g=`<svg id="${id}" viewBox="${vb}" width="100%" style="touch-action:none;display:block" role="img" aria-label="Target face, tap where the arrow landed">`;
 rings.forEach((c,i)=>{if(R&&isSix(R)&&i<4)return;if(R&&isSpot(R)&&i<5)return;g+=`<circle r="${1-i*0.1}" fill="${c[0]}" stroke="${c[1]}" stroke-width="0.006"/>`});g+=`<circle r="0.05" fill="none" stroke="#111" stroke-width="${R&&R.inner10?'0.012':'0.005'}"/>`;if(R&&R.wa18&&R.inner10)g+=`<text x="0" y="0" text-anchor="middle" dominant-baseline="central" font-size="0.045" font-weight="700" fill="#111">10</text><text x="0.075" y="0" text-anchor="middle" dominant-baseline="central" font-size="0.04" font-weight="700" fill="#111">9</text>`;
 pts.forEach(p=>g+=arrowDot(p,0.025,0.008,ptLab(p,R)));return g+extra+'</svg>'}
function plotScore(x,y,R,lc){const L=a=>lc>0?lc:a;if(isFld(R)){const d=Math.hypot(x,y)-L(0.028);/* line cutter */if(d>1)return'M';return d<=.1?'6':d<=.2?'5':d<=.4?'4':d<=.6?'3':d<=.8?'2':'1'}if(isBug(R)){const d=Math.min(...BUGC.map(([cx,cy])=>Math.hypot(x-cx,y-cy)))-0.023;/* dot r 0.02 + half line */if(d>0.3)return'M';return String(Math.min(6,6-Math.floor(Math.max(0,d)/0.05)))}if(spots3(R)){/* spot radius 0.3 = 6-ring edge; local units match the single 3-spot (edge 0.5) */const d=Math.min(...spots3(R).map(([cx,cy])=>Math.hypot(x-cx,y-cy)))/0.6-L(0.035);if(R&&R.wa18)return wa18Score(d,R.inner10);if(d>0.5)return'M';if(d<=0.05)return R.xs===false?'10':'X';return String(Math.min(10,10-Math.floor(Math.max(0,d)*10)))}const d=Math.hypot(x,y)-L(0.028);/* line cutter: arrow edge touching a line scores higher */if(R&&R.wa18)return wa18Score(d,R.inner10);if(R&&R.ausi){if(d>0.5)return'M';if(d<=0.05)return'X';return String(Math.min(10,10-Math.floor(Math.max(0,d)*10)))}const lim=R&&isSpot(R)?0.5:R&&isSix(R)?0.6:1;if(d>lim)return'M';if(d<=0.05)return R&&R.xs===false?'10':'X';return String(Math.min(10,10-Math.floor(Math.max(0,d)*10)))}
/* Shot order: a complete end is sorted (highest first), so Undo would take the lowest arrow, not the one just shot, and a plot on another spot could stay behind.
   The shot order is kept in memory only (never saved) while the sorted end is unchanged; Undo then takes the arrow just shot together with its plot. */
window.stOrd=window.stOrd||(()=>{const M={},j=(E,P)=>JSON.stringify([E,E.map((_,x)=>(P||[])[x]||null)]);return{set:(k,i,preE,preP,E,P)=>{M[k+'|'+i]={E:[...preE],P:preE.map((_,x)=>(preP||[])[x]||null),s:j(E,P)}},take:(k,i,E,P)=>{const r=M[k+'|'+i];delete M[k+'|'+i];return r&&r.s===j(E,P)?{E:r.E.slice(0,-1),P:r.P.slice(0,-1)}:null}}})();
function sortEnd(i){const E=cur.ends[i],P=(cur.pos=cur.pos||[])[i]||[];const pr=E.map((a,k)=>[a,P[k]||null]).sort((a,b)=>val(b[0])-val(a[0])||(b[0]=='X')-(a[0]=='X'));cur.ends[i]=pr.map(x=>x[0]);cur.pos[i]=pr.map(x=>x[1])}
/* earliest end that is still short an arrow; -1 when every end already stored is full */
function shortEnd(R){for(let n=0;n<cur.ends.length;n++)if(!endComplete(R,cur.ends[n]||[],n))return n;return -1}
function putArrow(k,xy){if(cur&&cur.lcT&&!arrowPlotted(cur))arrowApply(cur,'cur');const R=ROUNDS[cur.round];if(typeof worldAccept==='function'&&typeof worldKeys==='function'&&worldKeys(R,null,cur)){if(!worldAccept(R,k,cur))return}else if(isIfaa(R)&&['5','4','3','M'].indexOf(k)<0)return;cur.pos=cur.pos||[];
 if(fix){const[i,j]=fix;cur.ends[i][j]=k;const o0=(cur.pos[i]||[])[j];if(xy&&o0&&o0.sn)xy.sn=o0.sn;(cur.pos[i]=cur.pos[i]||[])[j]=xy||null;if(endComplete(R,cur.ends[i],i))sortEnd(i);fix=null;if(fixRet)sv='sheet';fixRet=false;save();score();return}
 /* a finished or historical sheet is edited in place: a deleted arrow leaves a hole, and the next score fills that hole
    instead of starting an end past the end of the round (which used to be refused, so the arrow could not be put back) */
 let i=shortEnd(R);const later=i>=0&&cur.ends.slice(i+1).some(e=>e&&e.length);
 if(i<0){if(cur.ends.length>=roundEnds(R,cur))return;cur.ends.push([]);cur.pos.push([]);i=cur.ends.length-1}
 const e=cur.ends[i];e.push(k);if(xy)xy.sn=e.length;/* shot number in the end, kept with the arrow when the end is sorted (end by end viewer) */(cur.pos[i]=cur.pos[i]||[])[e.length-1]=xy||null;
 if(endComplete(R,e,i)){const pe=[...e],pq=[...(cur.pos[i]||[])];sortEnd(i);stOrd.set(cur.id,i,pe,pq,cur.ends[i],cur.pos[i]);if(i==cur.ends.length-1)justDone=true;
  if(later&&isFull(cur)){justDone=false;sv='sheet';fix=null;fixRet=false}
  /* one target face (single face, outdoor): once its arrows are plotted, open the next end. The last end stays until Next. A 3-spot end stays too: its targets are the spots, and the last spot waits for Next. Field stays on the end until Next, which returns to the scorecard. */
  else if(xy&&justDone&&i==cur.ends.length-1&&cur.ends.length<roundEnds(R,cur)&&!use3(cur,R,faceR(R,i))&&!isFld(faceR(R,i)))justDone=false}
 /* a numbered spot is one target. After its arrow is plotted, show the next spot. Spot 3 is the last target on this face, so it stays. Indoor 3-spot and Bugs Eyes. */
 if(xy&&!later&&R.ape==3&&cur.spot>=1&&cur.spot<3&&(use3(cur,R,faceR(R,Math.max(0,i)))||bug3(cur,R,Math.max(0,i))))cur.spot++;
 if(window.plotAfterFlag)plotAfterFlag(!!justDone);
 save();score()}
const SIDEHILL=`<details class="tipcard" id="sidehill"><summary>Tip: side hill shots</summary><b>Side hill shots: keep the bow level</b><ol><li>If the bubble is off at full draw, let down and start again. Twisting the bow level at full draw sets the shot up to miss the other way.</li><li>Before you draw, tip the top of the bow a little into the hill, slightly more than feels right.</li><li>Draw with the bow still tipped, then let it relax back to level by itself.</li><li>Pause just short of anchor and check the bubble is level and still.</li><li>Then come to anchor and shoot. You don't need to watch the bubble for the rest of the shot.</li></ol></details>`;
let crEdit=null,sv='sheet',justDone=false,fixRet=false,fldHold=null,fldHoldId=null;
function score(){regCustom();if(!cur){if(crEdit)return roundForm();const mine=(S.customRounds||[]).map(c=>c.name),std=Object.keys(ROUNDS).filter(r=>!ROUNDS[r].custom&&!ROUNDS[r].legacy&&!ROUNDS[r].ifaa);
 const rdBlock=typeof jmPickerHTML==='function'?jmPickerHTML():typeof worldPickerHTML==='function'?worldPickerHTML():`<label for="rd">Round</label><select id="rd"><optgroup label="Standard rounds">${std.map(r=>`<option value="${esc(r)}" ${r==S.lastRound?'selected':''}>${esc(rdPick(r))}</option>`).join('')}</optgroup>${mine.length?`<optgroup label="My rounds">${mine.map(r=>`<option value="${esc(r)}" ${r==S.lastRound?'selected':''}>${esc(rdPick(r))}</option>`).join('')}</optgroup>`:''}<option value="__new">+ Create my own practice round</option></select>`;
 app.innerHTML=`<div class="card"><span class="kicker">New session</span><h1>Score it</h1>${rdBlock}
 <div id="pegrow"></div><div id="f3row"></div><div id="tiprow"></div><label for="dt">Date</label><input id="dt" type="date" value="${today()}"><button class="btn alt full" style="margin-top:14px" id="st">Start</button>
 <p class="small muted">Saved on this phone as you go.</p></div>${window.h2hCard?h2hCard():''}${mine.length?`<div class="card" id="myrcard"><h3>My rounds</h3>${(S.customRounds||[]).map((c,i)=>`<div class="list-item myr"><b>${esc(c.name)}</b><div class="small muted">${c.kind=='3d'?(R=>`${plN(R.ends,'target','targets')} (${R.halves.map(h=>h.t).join(' + ')})`)(ROUNDS[c.name]):`${plN(ROUNDS[c.name].ends,'end','ends')} × ${c.ape}`} · max ${ROUNDS[c.name].max} · practice</div><div class="myr-act"><button class="btn alt" data-cs="${i}" aria-label="Start ${esc(c.name)}">Start</button><button class="btn ghost" data-ce="${i}">Edit</button><button class="btn ghost" data-cd="${i}">Delete</button></div></div>`).join('')}</div>`:''}`+sessionList();
 let selPeg=defaultPeg();const pegRow=()=>{const R0=ROUNDS[$('#rd').value],w=$('#pegrow');if(!w)return;w.innerHTML=R0&&isFld(faceR(R0,0))?`<label>Peg <span class="small muted">(set from your division, tap to change)</span></label><div class="zbar pegbar" role="group" aria-label="Peg" style="justify-content:flex-start;margin:4px 0">${PEGS.map(k=>`<button type="button" class="zb peg-${k}${k==selPeg?' on':''}" data-peg="${k}" aria-pressed="${k==selPeg}">${PEGN[k]}</button>`).join('')}</div>`:'';w.querySelectorAll('[data-peg]').forEach(b=>b.onclick=()=>{selPeg=b.dataset.peg;pegRow()});/* side hill tip: field and 3D (ABA) rounds only, closed by default */const fw=$('#f3row');if(fw){fw.innerHTML=R0?f3Row($('#rd').value,true):'';f3Bind(fw,pegRow)}const tw=$('#tiprow');if(tw)tw.innerHTML=R0&&(R0.aba||isFld(faceR(R0,0)))?SIDEHILL:''};try{pegRow()}catch(err){console.error('pegRow',err)};
 try{if(window.h2hBind)h2hBind()}catch(err){console.error('h2hBind',err)};$('#rd').onchange=e=>{if(e.target.value=='__new'){crEdit={i:-1};score()}else pegRow()};if(window.worldBindPicker)worldBindPicker();
 app.querySelectorAll('[data-ce]').forEach(b=>b.onclick=()=>{window._csMode=null;crEdit={i:+b.dataset.ce};score()});
 app.querySelectorAll('[data-cd]').forEach(b=>b.onclick=()=>{if(retireCustom(+b.dataset.cd))score()});
 const startRound=r=>{if(!ROUNDS[r]||ROUNDS[r].retired)return;if(window.worldPrepareStart)worldPrepareStart(r);S.lastRound=r;if(typeof csDisc==='function'){const d=csDisc(r);if(d)S.lastDisc=d}sv='entry';justDone=false;fix=null;fldHold=null;fldHoldId=null;PZ.k=1;PZ.cx=PZ.cy=0;const p0=arrowPref(null),ad=p0?{k:p0.id,mm:+(+p0.mm).toFixed(3)}:{k:'s23',mm:+(+(23/64*IN)).toFixed(3)};if(window._arrowPend)delete window._arrowPend.cur;cur={id:'s'+Date.now(),date:($('#dt')||{}).value||today(),round:r,ends:[[]],pos:[[]],note:'',lcT:1,arrowD:ad};if(ROUNDS[r]&&ROUNDS[r].wa18)cur.inner10=sightedCompound();if(ROUNDS[r]&&ROUNDS[r].lancaster)cur.face3='vegas';else if(indoor3(ROUNDS[r],faceR(ROUNDS[r],0)))cur.face3=f3Start(r);if(isFld(faceR(ROUNDS[r],0))){cur.peg=selPeg;cur.ff=[]}if(window.worldAfterStart)worldAfterStart(cur);S.sessions.push(cur);save();history.pushState({scoring:1},'');score();scrollTo(0,0)};
 $('#st').onclick=()=>{if($('#rd').value=='__new'||!$('#rd').value)return;startRound($('#rd').value)};if(window.jmBindDisc)jmBindDisc();
 /* Start straight from a saved round in My rounds */app.querySelectorAll('[data-cs]').forEach(b=>b.onclick=()=>{const c=(S.customRounds||[])[+b.dataset.cs];if(c){window._csMode=null;startRound(c.name)}});bindList();return}
 const R=ROUNDS[cur.round],last=cur.ends[cur.ends.length-1],fin=isDone(cur)||(!!cur.finished&&arrowsIn(cur)>0),P=cur.pos||[];
 if(R.aba&&window.abaScore)return abaScore(R);if(sv=='sheet'&&!fix){window._pzEnd=null;return scoreSheet(R,fin)}/* coming back reopens the end with the kept zoom (zkOpen) */
 const full=endComplete(R,last,cur.ends.length-1),hole=shortEnd(R),showingDone=full&&(justDone||fin)&&(hole<0||hole==cur.ends.length-1),fldRound=isFld(faceR(R,0)),held=fldRound&&fldHoldId==cur.id&&fldHold!=null&&fldHold>=0&&fldHold<cur.ends.length&&!showingDone?fldHold:null,ei=fix?fix[0]:held!=null?held:showingDone?cur.ends.length-1:hole>=0?hole:full?cur.ends.length:cur.ends.length-1,e=cur.ends[ei]||[];
 {const zk=cur.id+'|'+ei,k3=use3(cur,R,faceR(R,ei))||bug3(cur,R,ei);if(window._pzSE!==zk){window._pzSE=zk;if(k3&&cur.spot>0)cur.spot=1}if(window._pzEnd!==zk){window._pzEnd=zk;zkOpen(k3)}window._zkOn=k3}/* indoor 3-spot and Bugs Eyes: a new end opens on Spot 1 and keeps the zoom the archer set (zkOpen); any other face opens on the full face */
 const FR0=faceR(R,ei),BG=!!cur.bugs&&isFld(FR0),I3=use3(cur,R,FR0),FF=isFld(FR0)&&!BG?fldFor(cur,ei,FR0):null,FR=BG?{face:'Bugs Eyes field 3-spot',bugs:true,dist:FR0.dist}:FF?fldFR(FF):I3?face3R(FR0,cur):{...FR0},FL=FF?fldDists(cur.peg,FF.f,fldMarked(FR0)):null,SC=isBug(FR)?BUGC:spots3(FR),SP=SC&&cur.spot?SC[cur.spot-1]:null,vb=SP?`${SP[0]-0.31} ${SP[1]-0.31} 0.62 0.62`:faceVB(FR),bcol=k=>isIfaa(R)||isIfaa(FR)||isBug(FR)||isFld(FR)?(k=='M'?'k-m':+k>=5?'k-y':'k-k'):col(k),d=distOf(FR,cur.round);
 if(R.wa18){if(cur.inner10==null)cur.inner10=sightedCompound();FR.wa18=true;FR.inner10=!!cur.inner10}/* 2 cm 10 for a sighted compound, 4 cm 10 otherwise. No X. */
 if(R.ausi)FR.ausi=true;/* Australian Indoor: X and 10 down to 6, then M, on the single face as well as a 3-spot. */
 const shown=fix?[...(P[fix[0]]||[])].map((p,j)=>p&&j<(cur.ends[fix[0]]||[]).length&&{...p,k:(cur.ends[fix[0]]||[])[j],sel:j==fix[1]}).filter(Boolean):(P[ei]||[]).map((p,j)=>p&&j<e.length&&{...p,k:e[j]}).filter(Boolean);
 const endDone=endComplete(R,e,ei),prog=cur.ends.slice(0,ei+1).reduce((t,y)=>t+endSum(y,cur),0),locked=endDone&&!fix;
 /* score keys in one or two compact rows, highest first. Indoor WA 18 m is 10 9 8 7 6 M, with no X. Australian Indoor is X 10 9 8 7 6 M. */const wk=(R.wa18||R.ausi)?null:(typeof worldKeys==='function'?worldKeys(R,FR,cur):null),keys=wk||faceKeys(R,FR),kcols=keys.length>8?Math.ceil(keys.length/2):keys.length;
 const sm=typeof sightFor=='function'&&d?sightFor(d):'';
 const y0=scrollY;app.innerHTML=`<div class="ad"><div class="ad-title">Score End${R.custom?' · practice':''}</div>
 <div class="ad-head"><div class="ad-left"><div class="ad-box ad-line" title="${esc(S.profile)}"><b id="endno">${(isIfaa(R)||(typeof worldUsesTargets==='function'&&worldUsesTargets(R)))?`Target ${ei+1}`:`End ${ei+1}`}${roundEnds(R,cur)?` of ${roundEnds(R,cur)}`:''}</b> · <span id="roundname">${esc(cur.round.replace(/\s*\([^)]*\)\s*$/,''))}</span>${d?` · <b id="enddist">${esc(d)}</b>`:''} · <span id="facesize">${esc(faceSize(FR))}</span>${d?` · <span id="sighttag">Sight ${sm?esc(sm):'not set'}</span>`:''}</div></div>
 <div class="ad-right"><div class="ad-num"><span>End</span><b>${endSum(e)}</b></div><div class="ad-num"><span>Prog</span><b>${prog}</b></div></div></div>${isIfaa(R)&&window.ifaaRun?(u=>{const r=ifaaRun(cur.ends,R);return `<div class="small muted" id="ifaaunits" style="margin:2px 12px 0">This target ${endSum(e)}/20 · Unit ${ei<(R.unit||14)?1:2}: ${ei<(R.unit||14)?r.u1:r.u2}/${r.uMax}${r.two?` · Day ${r.day}/${r.dayMax}`:''}</div>`})():''}
 <div class="ad-chips" aria-label="Arrows this end">${Array.from({length:endLen(R,ei)},(_,j)=>e[j]!=null?`<span class="adb ${bcol(e[j])}" role="button" tabindex="0" data-fix="${ei},${j}" aria-label="fix arrow ${e[j]}"${fix&&fix[0]==ei&&fix[1]==j?' style="outline:3px solid #3b82f6;outline-offset:2px"':''}>${e[j]}</span>`:'<span class="adb adb-empty"></span>').join('')}
 <button class="ad-small" id="undo" ${cur.ends.some(x=>x.length)&&!fix?'':'disabled'}>↶ Undo</button>${ei>0&&!fix?`<button class="ad-small" id="prevend">‹ End ${ei}</button>`:''}${fix?`<button class="ad-small" id="delarrow">✕ Delete arrow</button><button class="ad-small" id="fixcancel">Done</button>`:''}${isFld(FR0)?`<button class="ad-small" id="bugface" aria-pressed="${BG}">${BG?'Face: Bugs Eyes':'Face: Field'}</button>`:!R.lancaster&&(I3||f3Can(cur,R,FR0))?`<button class="ad-small" id="face3"${f3Can(cur,R,FR0)&&!I3&&cur.pos.some(e=>(e||[]).some(Boolean))?' disabled':''}>Face: ${f3Name(cur.round,I3?(FR.tri?'vegas':'vert'):'single')}</button>`:''}${cur.h2h&&window.h2hChip?h2hChip(cur):''}${S.hideFace||!cur.lcT?'':cur.pos&&cur.pos.some(E=>(E||[]).some(Boolean))?arrowSizeTxt(cur):arrowPick(cur,'cur')}${(isIfaa(R)||(typeof worldNoFace==='function'&&worldNoFace(R)))?'':`<button class="ad-small" id="hideface" aria-pressed="${!!S.hideFace}">${S.hideFace?'Show target':'Hide target'}</button>`}</div>
 ${FF?`<div class="fldpick" role="group" aria-label="Field face and distance" style="margin:4px 12px;text-align:left"><div class="small muted" id="pegtag">${PEGN[cur.peg]} peg · ${fldMarked(FR0)?'marked':'unmarked'}</div><div class="small fl-lab" id="flab-face" style="font-weight:700;margin:4px 0 2px">Face</div><div class="zbar" id="fl-faces" style="margin:0;justify-content:flex-start;flex-wrap:wrap">${[80,60,40,20].map(f=>`<button type="button" class="zb${FF.f==f?' on':''}" data-fface="${f}" aria-pressed="${FF.f==f}">${f} cm</button>`).join('')}</div><label class="small fl-lab" id="flab-dist" for="fdist" style="display:block;font-weight:700;margin:6px 0 2px">Distance</label><select id="fdist" style="display:block;width:auto;min-width:96px;margin:0">${FL.map(m=>`<option value="${m}"${m==FF.d?' selected':''}>${m} m</option>`).join('')}</select></div>${FF.f==20?'<p class="small muted" style="margin:0 12px">20 cm: one arrow in each spot of your column.</p>':''}`:''}<p class="small muted" style="margin:2px 12px">${isIfaa(R)?(fix?'Tap a score to fix this arrow.':locked?'Target complete. Tap an arrow to fix it, or press Next.':'Tap 5, 4, 3 or M. Four arrows a target. No X.'):fix?'Tap the face or a score to fix this arrow.':locked?'End complete. Tap an arrow to fix it, or press Next.':'Tap the face or a score. Tap an arrow to fix it.'}</p>
 ${S.hideFace||isIfaa(R)||(typeof worldNoFace==='function'&&worldNoFace(R))?'':`${SC?`<div class="zbar" role="group" aria-label="Spot">${[0,1,2,3].map(n=>`<button class="zb${(cur.spot||0)==n?' on':''}" data-spot="${n}">${n?'Spot '+n:'All spots'}</button>`).join('')}</div>`:''}<div id="fwrap" style="position:relative;width:100%;height:${plotBaseH(SP,FR)};margin:0 auto;overflow:visible;touch-action:none;border-radius:8px">${faceSVG(shown,'pface',vb,FR,'',{d:cur.lcT?arrowMM(arrowNow(cur,'cur')):0,cm:FF&&FF.f}).replace('width="100%"','width="100%" height="100%"')}<button type="button" class="zcyc" id="zcycle"></button><div id="loupe" hidden style="position:absolute;z-index:3;width:110px;height:110px;border-radius:50%;overflow:hidden;border:3px solid #111;box-shadow:0 2px 8px #0006;pointer-events:none;background:#fff"></div></div>`}
 <div class="ad-pad" style="--cols:${kcols}">${keys.map(k=>`<button class="${bcol(k)}" data-k="${k}" aria-label="score ${k}" ${locked?'disabled':''}>${k}</button>`).join('')}</div>
 <div class="ad-foot"><button class="ad-back" id="eback">‹ Back</button><button class="ad-go" id="enext" ${endDone&&!fix?'':'disabled'}>Next ›</button></div></div>`;
 scrollTo(0,y0);{const pd=app.querySelector('.ad-pad'),nv=document.querySelector('nav'),ak=cur.date+'|'+cur.round+'|'+ei+'|'+(cur.spot||0)+'|'+!!cur.bugs+'|'+(cur.face3||'');
  /* shrink against the compact 1x height, then grow again if zoomed, so a re-render (new spot, plotted arrow) does not undo zoom room */
  const fit=fw=>{if(!fw||!pd)return;const ch=app.querySelector('.ad-chips'),hd=(document.querySelector('header.top')||{getBoundingClientRect:()=>({bottom:0})}).getBoundingClientRect().bottom+4,lim=innerHeight-(nv?nv.getBoundingClientRect().height:0)-8;
   if(fw.dataset.z0h)fw.style.height=fw.dataset.z0h;
   const need=pd.getBoundingClientRect().bottom-(ch||fw).getBoundingClientRect().top,av=lim-hd;
   if(need>av)fw.style.height=Math.max(180,fw.getBoundingClientRect().height-(need-av))+'px';
   if(window.plotZoomBase)plotZoomBase(fw,fw.getBoundingClientRect().height)};
  if(pd)fit($('#fwrap'));
  if(pd&&window._adk!==ak)window._adk=ak,requestAnimationFrame(()=>{const fw=$('#fwrap');fit(fw);if(!(window.PZ&&PZ.k>1)){const ch=app.querySelector('.ad-chips'),hd=(document.querySelector('header.top')||{getBoundingClientRect:()=>({bottom:0})}).getBoundingClientRect().bottom+4,lim=innerHeight-(nv?nv.getBoundingClientRect().height:0)-8,over=ch?Math.min(pd.getBoundingClientRect().bottom-lim,ch.getBoundingClientRect().top-hd):0;if(over>0)scrollBy(0,over)}})}
 app.querySelectorAll('[data-spot]').forEach(x=>x.onclick=()=>{cur.spot=+x.dataset.spot;PZ.cx=PZ.cy=0;if(!window._zkOn)PZ.k=1;score()}/* zoom level kept on indoor 3-spot, re-centred on the spot */);
 if($('#bugface'))$('#bugface').onclick=()=>{cur.bugs=!cur.bugs;save();score()};if($('#face3'))$('#face3').onclick=()=>{if(f3Can(cur,R,FR0)){/* cycle traffic light > triangular > single; once arrows are plotted only swap between the two 3-spots */const pl=cur.pos.some(e=>(e||[]).some(Boolean)),o=pl?['vert','vegas']:F3AUS.map(x=>x[0]),c=I3?(FR.tri?'vegas':'vert'):'single';if(!o.includes(c))return;const nf=o[(o.indexOf(c)+1)%o.length];cur.face3=nf;if(cur.round==AUSI)S.face3a=nf;else{S.face1=nf=='single';if(nf!='single')S.face3=nf}}else cur.face3=S.face3=FR.tri?'vert':'vegas';cur.spot=0;PZ.k=1;PZ.cx=PZ.cy=0;save();score()};
 app.querySelectorAll('[data-fface]').forEach(b=>b.onclick=()=>{if(!FF)return;FF.f=+b.dataset.fface;FF.p=cur.peg;FF.d=snapDist(fldDists(cur.peg,FF.f,fldMarked(FR0)),FF.d);PZ.k=1;PZ.cx=PZ.cy=0;save();score()});
 {const fd=$('#fdist');if(fd)fd.onchange=()=>{FF.d=+fd.value;save();score()}}
 if($('#hideface'))$('#hideface').onclick=()=>{S.hideFace=!S.hideFace;save();score()};
 app.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>putArrow(b.dataset.k,null));
 const f=$('#pface');if(f){const L=$('#loupe'),W=$('#fwrap');const B=vb.split(/[ ,]+/).map(Number),bc=[B[0]+B[2]/2,B[1]+B[3]/2];
  const clampZ=()=>{PZ.k=Math.min(ZLV[ZLV.length-1],Math.max(1,PZ.k));const fr=f.getBoundingClientRect(),ar=(fr.width||1)/(fr.height||1),Ew=Math.max(B[2],B[3]*ar),Eh=Math.max(B[3],B[2]/ar);const m=Ew/2*(1-1/PZ.k);PZ.cx=Math.min(m,Math.max(-m,PZ.cx));const my=Eh/2*(1-1/PZ.k);PZ.cy=Math.min(my,Math.max(-my,PZ.cy));if(PZ.k==1)PZ.cx=PZ.cy=0};
  const applyZ=()=>{plotZoomRoom(W,PZ.k);clampZ();const w=B[2]/PZ.k,h=B[3]/PZ.k;f.setAttribute('viewBox',`${bc[0]+PZ.cx-w/2} ${bc[1]+PZ.cy-h/2} ${w} ${h}`);const zc=$('#zcycle');if(zc){const st=zStep(PZ.k);zc.textContent=ZLABELS[st];zc.setAttribute('aria-label',ZARIA[st]);zc.classList.toggle('on',st>0)}if(window._zkOn)zkSet(PZ.k)};
  f.style.touchAction='none';W.style.touchAction='none';W.style.overscrollBehavior='contain';let pan=null;applyZ();
  /* one small button cycles Z1 (2x) -> Z2 (3x) -> Z3 (4x) -> Z4 (5x) -> Reset (1x); its label is what the next tap does. Pinch still works. */$('#zcycle').onclick=ev=>{ev.stopPropagation();const st=zStep(PZ.k);PZ.k=ZLV[(st+1)%ZLV.length];if(PZ.k==1)PZ.cx=PZ.cy=0;applyZ()};
  const pt=ev=>{const q=f.createSVGPoint();q.x=ev.clientX;q.y=ev.clientY;return q.matrixTransform(f.getScreenCTM().inverse())};
  const show=ev=>{const q=pt(ev);placeLoupe(L,ev);const lw=0.24/PZ.k;
   L.innerHTML=faceSVG(shown,'lf',`${q.x-lw/2} ${q.y-lw/2} ${lw} ${lw}`,FR,faceHi(`<path d="M${q.x-lw/6} ${q.y}h${lw/3}M${q.x} ${q.y-lw/6}v${lw/3}" stroke="#39ff14" stroke-width="${0.006/PZ.k}"/><circle cx="${q.x}" cy="${q.y}" r="${0.012/PZ.k}" fill="none" stroke="#39ff14" stroke-width="${0.004/PZ.k}"/>`),{d:cur.lcT?arrowMM(arrowNow(cur,'cur')):0,cm:FF&&FF.f})+`<b style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:13px;background:#fffc">${tapScore(q,FR,R,cur.lcT?arrowLC(FR,arrowNow(cur,'cur'),FF&&FF.f):undefined).k}</b>`};
  const P=new Map();let pin=null;
  const pinchStart=()=>{const [a,b]=[...P.values()];const q1=pt(a),q2=pt(b);pin={d:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)||1,k:PZ.k,m:{x:(q1.x+q2.x)/2,y:(q1.y+q2.y)/2}}};
  /* Gestures: a real tap (moved <10px, under 300ms, one finger) plots. Holding still 300ms opens the loupe to aim; lifting then plots.
     A drag before that scrolls the page (or pans when zoomed); a pinch zooms. Drags and pinches never plot. */
  const TAP_PX=10,TAP_MS=300;let hold=null;const clrHold=()=>{if(hold){clearTimeout(hold);hold=null}};
  const plotAt=ev=>{L.hidden=true;const q=pt(ev);const t=tapScore(q,FR,R,arrowLC(FR,arrowNow(cur,'cur'),FF&&FF.f));const outside=q.x<B[0]||q.y<B[1]||q.x>B[0]+B[2]||q.y>B[1]+B[3];if(outside&&t.k=='M')return;/* the gap around the picture is not a miss */putArrow(t.k,t.xy)};
  f.onpointerdown=ev=>{try{f.setPointerCapture(ev.pointerId)}catch(e){}P.set(ev.pointerId,ev);if(P.size>=2){clrHold();L.hidden=true;if(pan)pan.multi=true;if(P.size==2)pinchStart();return}
   pan={x0:ev.clientX,y0:ev.clientY,x:ev.clientX,y:ev.clientY,t:performance.now(),mode:null,multi:false,last:ev};
   clrHold();if(!locked)hold=setTimeout(()=>{hold=null;if(pan&&!pan.mode&&!pan.multi&&P.size==1){pan.mode='aim';show(pan.last)}},TAP_MS)};
  f.onpointermove=ev=>{if(!P.has(ev.pointerId))return;P.set(ev.pointerId,ev);if(pin&&P.size==2){const [a,b]=[...P.values()];PZ.k=pin.k*Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/pin.d;applyZ();
     /* keep the SVG point that was under the fingers' midpoint under the new midpoint (zoom + pan) */
     const mx=(a.clientX+b.clientX)/2,my=(a.clientY+b.clientY)/2,q=f.createSVGPoint();q.x=mx;q.y=my;const n=q.matrixTransform(f.getScreenCTM().inverse());PZ.cx+=pin.m.x-n.x;PZ.cy+=pin.m.y-n.y;applyZ();return}
   if(!pan||P.size!=1)return;pan.last=ev;
   if(!pan.mode&&Math.hypot(ev.clientX-pan.x0,ev.clientY-pan.y0)>TAP_PX){clrHold();pan.mode=PZ.k>1?'pan':'scroll'}
   if(pan.mode=='pan'){const dx=ev.clientX-pan.x,dy=ev.clientY-pan.y,s2=1/f.getScreenCTM().a;PZ.cx-=dx*s2;PZ.cy-=dy*s2;applyZ()}
   else if(pan.mode=='scroll'){scrollBy(0,pan.y-ev.clientY)}
   else if(pan.mode=='aim')show(ev);
   pan.x=ev.clientX;pan.y=ev.clientY};
  const end=ev=>{P.delete(ev.pointerId);if(pin){if(P.size<2)pin=null;L.hidden=true;return true}return false};
  f.onpointercancel=ev=>{clrHold();end(ev);L.hidden=true;if(!P.size)pan=null};
  f.onpointerup=ev=>{clrHold();const pinched=end(ev);if(P.size)return;const g=pan;pan=null;L.hidden=true;if(pinched||!g||g.multi||locked)return;
   if(g.mode=='aim')return plotAt(ev);
   if(!g.mode&&performance.now()-g.t<TAP_MS&&Math.hypot(ev.clientX-g.x0,ev.clientY-g.y0)<TAP_PX)plotAt(ev)}}
 app.querySelectorAll('[data-fix]').forEach(el=>el.onclick=el.onkeydown=ev=>{if(ev.type=='keydown'&&ev.key!='Enter'&&ev.key!=' ')return;const [i,j]=el.dataset.fix.split(',').map(Number);fix=fix&&fix[0]==i&&fix[1]==j?null:[i,j];score()});
 $('#undo').onclick=()=>{while(cur.ends.length>1&&!cur.ends[cur.ends.length-1].length)cur.ends.pop();const n=cur.ends.length-1,l=cur.ends[n];if(!l||!l.length)return;const pp=(cur.pos||[])[n],r=stOrd.take(cur.id,n,l,pp);if(r){cur.ends[n]=r.E;if(pp)cur.pos[n]=r.P}else{l.pop();if(pp)pp.length=l.length}justDone=false;save();score()};
 if($('#prevend'))$('#prevend').onclick=()=>{if(fldRound){fldHold=ei-1;fldHoldId=cur.id;fix=null;fixRet=false;justDone=false;score();return}const pe=cur.ends[ei-1]||[];fix=[ei-1,Math.max(0,pe.length-1)];score()};
 if($('#fixcancel'))$('#fixcancel').onclick=()=>{if(fldRound){const back=fixRet,stay=fix?fix[0]:fldHold;fix=null;fixRet=false;if(back){fldHold=null;fldHoldId=null;justDone=false;sv='sheet';score();return}if(stay!=null){fldHold=stay;fldHoldId=cur.id}score();return}fix=null;score()};
 if($('#delarrow'))$('#delarrow').onclick=()=>{const[i,j]=fix;cur.ends[i].splice(j,1);if(cur.pos&&cur.pos[i])cur.pos[i].splice(j,1);fix=null;if(i==cur.ends.length-1)justDone=false;if(fldRound){fldHold=i;fldHoldId=cur.id}save();score()};
 $('#eback').onclick=()=>{fix=null;fixRet=false;justDone=false;fldHold=null;fldHoldId=null;sv='sheet';score()};
 $('#enext').onclick=()=>{justDone=false;fldHold=null;fldHoldId=null;sv='sheet';score()};if(window.plotAfterApply)plotAfterApply()}
const faceName=F=>F.bugs?'Bugs Eyes field 3-spot (6-1)':isIfaa(F)||/ifaa/i.test(F.face||'')?'IFAA face 20-65cm (5-3)':/field/.test(F.face||'')?'WA field face 20-80cm (6-1)':F.face=='any'?'Full 10-ring face':`${/^\d/.test(F.face)?'WA ':''}${F.face.replace(/ full$/,'').replace(/ (6-ring|3-spot)/,' ($1)')}`;
const ZLV=[1,2,3,4,5],ZLABELS=['Z1','Z2','Z3','Z4','Reset'],ZARIA=['Zoom in to 2x','Zoom in to 3x','Zoom in to 4x','Zoom in to 5x','Reset zoom'];
/* nearest ZLV stop to the current (possibly pinch-set) k; its label is what the next tap does (Z1..Z4 step up, Reset back to 1x) */
function zStep(k){let b=0,bd=Infinity;ZLV.forEach((v,i)=>{const d=Math.abs(k-v);if(d<bd){bd=d;b=i}});return b}
const faceSize=F=>F.bugs?'Bugs Eyes 3-spot':isIfaa(F)||/ifaa/i.test(F.face||'')?'IFAA 20-65cm face':isFld(F)?(((F.face||'').match(/(\d+(?:-\d+)?)cm/)||[])[1]||'')+'cm field face':F.face=='any'?'Full face':(m=>m?m[1]+'cm '+(isSix(F)?'6-ring':isSpot(F)?'3-spot':'face'):'Full face')((F.face||'').match(/(\d+)cm/));
const distOf=(F,round)=>F.dist||((round.match(/(\d+(?:m|yd))/)||[])[1])||'';
function sheetSections(s){const R=ROUNDS[s.round],out=[];
 /* Field (marked or unmarked, any peg) is one continuous sheet: ends 1, 2, 3… with one End column. Face and distance stay on the end for scoring and plotting, not as section headers. */
 if(R&&isFld(faceR(R,0)))return[{k:'',ends:s.ends.map((_,i)=>i),plain:true}];
 s.ends.forEach((x,i)=>{const F=faceR(R,i),e=isFld(F)&&!s.bugs&&s.ff&&s.ff[i],k=isFld(F)&&!s.bugs?(e?`${e.f}cm field face (6-1) @ ${e.d}m · ${PEGN[e.p||s.peg]||''} peg`:faceName(F)+' · face not set'):faceName(F)+(distOf(F,s.round)?' @ '+distOf(F,s.round):'');if(!out.length||out[out.length-1].k!=k)out.push({k,ends:[]});out[out.length-1].ends.push(i)});return out}
var PZ=window.PZ||(window.PZ={k:1,cx:0,cy:0});
/* Zoom kept on the indoor 3-spot faces (Just me, Casual, match nights, Vegas, League): the level the archer sets (Z1/Z2/Reset or a pinch) stays across spots, ends, archers and an app reload until they change it. One shared place (also used by casual.js). Other faces open each end on the full face. */
window.zkLoad=()=>{if(!window._zkL){window._zkL=1;try{const v=+localStorage.getItem('scoretool.zoomk');if(v>=1&&v<=5)window._zk=v}catch(e){}}return window._zk||1};
window.zkSet=k=>{if(!(k>=1&&k<=5))return;try{if(k==zkLoad()&&localStorage.getItem('scoretool.zoomk')==null)return}catch(e){}/* nothing chosen yet and still Z1: do not create the key */window._zk=k;window._zkL=1;try{localStorage.setItem('scoretool.zoomk',String(Math.round(k*100)/100))}catch(e){}};
window.zkOpen=keep=>{PZ.k=keep?zkLoad():1;PZ.cx=PZ.cy=0};
/* Compact face box sizes (Just me, Casual, match nights and League share these). The vertical 3-spot and field columns are tall, so they get the taller box. */
window.plotBaseH=(SP,FR)=>SP?'min(340px,40vh,40dvh)':(FR&&(isBug(FR)||FR.col||FR.vert))?'min(320px,calc(100vh - 530px),calc(100dvh - 530px))':'min(290px,36vh,36dvh)';
/* When zoomed, grow the plotting box toward most of the viewport so the zoomed face has more room around it and the magnifier can sit near the top and bottom. At 1x the box stays the compact size it settled at (including the shrink that keeps the score keys on screen). Score keys and Back/Next stay in the page and can be reached by scrolling. */
window.plotZoomRoom=(W,k)=>{if(!W)return;if(!W.dataset.z0h)W.dataset.z0h=Math.max(160,Math.round(W.getBoundingClientRect().height||0))+'px';
 const z0=parseFloat(W.dataset.z0h)||W.getBoundingClientRect().height||270;
 if(!(k>1)){W.style.height=W.dataset.z0h;return}
 const nv=document.querySelector('nav'),navH=nv&&nv.getBoundingClientRect().top>0?nv.getBoundingClientRect().height:0;
 const maxH=Math.max(z0,Math.floor(innerHeight-navH-8));
 W.style.height=Math.round(maxH)+'px';W.style.overflow='visible'};
window.plotZoomBase=(W,px)=>{if(!W)return;W.dataset.z0h=Math.max(160,Math.round(px))+'px';if(window.PZ&&PZ.k>1)plotZoomRoom(W,PZ.k);else W.style.height=W.dataset.z0h};
/* Magnifier: keep it on screen and not under the finger. Prefer above the aim point; flip below, or to the side, if there is no room. position:fixed so the scoring card's overflow does not clip it. */
window.placeLoupe=(L,ev)=>{if(!L||!ev)return;const S=110,pad=8,gap=18,prefer=150;let left=ev.clientX-S/2,top=ev.clientY-prefer;
 if(top<pad){if(ev.clientY+gap+S<=innerHeight-pad)top=ev.clientY+gap;else{top=Math.max(pad,Math.min(innerHeight-S-pad,ev.clientY-S/2));left=ev.clientX>(innerWidth/2)?ev.clientX-S-gap:ev.clientX+gap}}
 left=Math.max(pad,Math.min(innerWidth-S-pad,left));top=Math.max(pad,Math.min(innerHeight-S-pad,top));
 L.style.position='fixed';L.style.left=left+'px';L.style.top=top+'px';L.style.zIndex='40';L.hidden=false};

/* After a plot: the last arrow of an end scrolls the page to Back/Next. Any earlier arrow, when zoomed, re-centres the pan on the active target (or the next spot, if the end just advanced) and scrolls so the plotting box and the row above it (Arrow size, spot tabs) sit fully in view. Shared by Just me (practice and vs ghost too), Casual, match nights and League. */
window.plotAfterFlag=endDone=>{if(endDone)window._plotGo='next';else if(window.PZ&&PZ.k>1){PZ.cx=PZ.cy=0;window._plotGo='centre'}else window._plotGo=null};
window.plotScrollNext=()=>{const foot=document.querySelector('.ad-foot')||document.querySelector('#enext,#csentnext,#lgnextarcher');if(!foot)return;const nv=document.querySelector('nav'),navH=nv&&nv.getBoundingClientRect().top>0?nv.getBoundingClientRect().height:0,hd=(document.querySelector('header.top')||{getBoundingClientRect:()=>({bottom:0})}).getBoundingClientRect().bottom,r=foot.getBoundingClientRect();scrollBy(0,r.bottom-(innerHeight-navH-10));const r2=foot.getBoundingClientRect();if(r2.top<hd+6)scrollBy(0,r2.top-hd-6)};
window.plotScrollBox=W=>{W=W||document.querySelector('#fwrap,#csfwrap');if(!W)return;const hd=(document.querySelector('header.top')||{getBoundingClientRect:()=>({bottom:0})}).getBoundingClientRect().bottom,nv=document.querySelector('nav'),navH=nv&&nv.getBoundingClientRect().top>0?nv.getBoundingClientRect().height:0,chips=document.querySelector('.ad-chips'),sz=document.querySelector('.arrowsz'),lead=(chips&&chips.getBoundingClientRect().height>0)?chips:(sz&&sz.getBoundingClientRect().height>0)?sz:((W.previousElementSibling&&W.previousElementSibling.classList&&W.previousElementSibling.classList.contains('zbar'))?W.previousElementSibling:W);scrollBy(0,lead.getBoundingClientRect().top-(hd+6));if(W.getBoundingClientRect().top<hd+6)scrollBy(0,W.getBoundingClientRect().top-hd-6);/* with the row above the face (Arrow size, spots) on screen, shrink the zoomed box to the space left above the tab bar so the target centre sits in the visible face, not below it */const room=Math.floor(innerHeight-navH-8-W.getBoundingClientRect().top);if(window.PZ&&PZ.k>1&&room>=160){W.style.height=room+'px';W.style.overflow='visible'}};
window.plotAfterApply=()=>{const go=window._plotGo;if(!go)return;window._plotGo=null;const run=()=>{const next=document.querySelector('#enext,#csentnext,#lgnextarcher'),on=next&&!next.disabled&&next.getAttribute('disabled')==null;if(go==='next'&&on)plotScrollNext();else if(window.PZ&&PZ.k>1){PZ.cx=PZ.cy=0;plotScrollBox()}};requestAnimationFrame(()=>requestAnimationFrame(run))};


/* Rounds with R.halfEnds (e.g. Lancaster 660: 20 ends, two 10-end halves with a break, as on the
   paper scoresheet) restart the running/progressive total at the start of each half, instead of it
   counting straight through every end. The saved/synced total for the round is unaffected -- it is
   already a flat sum over every end (lgTot, csTotal, total()), and a flat sum equals the two
   halves added together either way. This only changes what the running total displays as you score,
   end by end, to match the paper. Every scoring screen that shows a per-end running total (League's
   oneSheet/entryScreen, Casual's csOneSheet/csEntryScreen, and Just me's own scoreSheet/score here)
   uses this instead of carrying one running total across the whole round. */
function halfRunStart(i,half){return half?Math.floor(i/half)*half:0}
/* const ROUNDS is a top-level script binding, not a window property, so a sibling script with its
   own local ROUNDS (lkflow.js has one, an unrelated array of night-type labels) cannot reach this
   real one through window.ROUNDS -- only this explicit export lets it. */
window.APP_ROUNDS=ROUNDS;
function hiStats(A,s){const R0=ROUNDS[s.round]||{};if(R0.aba)return'';if(R0.wa18)return`10's: <b>${A.filter(a=>a=='10').length}</b>&nbsp; 9's: <b>${A.filter(a=>a=='9').length}</b>`;if(s.round===AUSI)return`10's: <b>${A.filter(a=>a=='X'||a=='10').length}</b>&nbsp; X's: <b>${A.filter(a=>a=='X').length}</b>`;if(R0.lancaster||R0.xv==11)return`11's: <b>${A.filter(a=>a=='X').length}</b>&nbsp; 10's: <b>${A.filter(a=>a=='10').length}</b>`;if(R0.scheme==='aa-field')return`X's: <b>${A.filter(a=>a=='X').length}</b>&nbsp; 5's: <b>${A.filter(a=>a=='X'||a=='5').length}</b>`;if(R0.scheme&&R0.scheme!=='wa10'&&R0.scheme!=='portsmouth'){const top=(typeof worldKeys==='function'&&worldKeys(R0,null,s)||[]).filter(k=>k!=='M').slice(0,3);if(top.length)return top.map(k=>`${k}'s: <b>${A.filter(a=>a==k).length}</b>`).join('&nbsp; ')}if(R0.ifaa||(typeof isIfaa=='function'&&isIfaa(R0)))return`5's: <b>${A.filter(a=>a=='5').length}</b>&nbsp; 4's: <b>${A.filter(a=>a=='4').length}</b>&nbsp; 3's: <b>${A.filter(a=>a=='3').length}</b>`;if(typeof isFld=='function'&&typeof faceR=='function'&&isFld(faceR(R0,0))||(/field/i.test(s.round||'')&&!(R0.scheme&&R0.scheme!=='wa10')))return`6's: <b>${A.filter(a=>a=='6').length}</b>&nbsp; 5's: <b>${A.filter(a=>a=='5').length}</b>`;const isB=bugsOn(s)||A.some(a=>a=='6')&&!A.some(a=>a=='X'||+a>6);if(isB)return`6's: <b>${A.filter(a=>a=='6').length}</b>&nbsp; 5's: <b>${A.filter(a=>a=='5').length}</b>`;return`X's: <b>${A.filter(a=>a=='X').length}</b>&nbsp; 10's/X's: <b>${A.filter(a=>a=='X'||a=='10').length}</b>`}
function scoreSheet(R,fin){const s=cur,secs=sheetSections(s);let run=0;
 const arrowsAll=s.ends.flat(),nEnds=roundEnds(R,s),nArr=typeof apeOf==="function"&&R.apes?R.apes.reduce((a,b)=>a+b,0):nEnds*(R.ape||1),fullMax=bugsOn(s)?nArr*6:(s.max!=null?s.max:R.max),per=fullMax&&nArr?fullMax/nArr:0,early=!isFull(s);
 app.innerHTML=`<div class="ad"><div class="ad-title">Score Sheet</div><div class="ad-sheet"><div class="ad-name">${esc(S.profile)}</div><div class="ad-band">${esc(s.round)}${R.custom?' · practice':''}</div>${s.h2h&&window.h2hChip?`<div style="padding:6px 8px">${h2hChip(s)}</div>`:''}
 ${secs.map(sec=>{const A=sec.ends.flatMap(i=>s.ends[i]);return`<table class="ad-tab"><thead><tr><th>#</th><th>Scores${sec.plain?'':`<div style="font-weight:400">${esc(bugsOn(s)?'Bugs Eyes field 3-spot (6-1)'+((/@.*/.exec(sec.k)||[''])[0]?' '+(/@.*/.exec(sec.k)||[''])[0]:''):sec.k)}</div>`}</th><th>End</th><th>Prog</th></tr></thead><tbody>
 ${sec.ends.map(i=>{run+=endSum(s.ends[i]);return`<tr><td>${i+1}</td><td>${s.ends[i].map((a,j)=>`<span class="adb ${col(a)}" role="button" tabindex="0" data-fix="${i},${j}" aria-label="fix end ${i+1} arrow ${a}">${a}</span>`).join('')}</td><td>${endSum(s.ends[i])}</td><td>${run}</td></tr>`}).join('')}</tbody></table>
 ${!sec.plain&&secs.length>1?`<div class="ad-sum small">${hiStats(A,s)} <b>${A.reduce((t,a)=>t+val(a),0)}</b></div>`:''}`}).join('')}
 <div class="ad-sum">${hiStats(arrowsAll,s)}&nbsp; <b class="big">${total(s)}</b><span class="small muted">&nbsp;/ ${early?arrowsIn(s)*per+' <span class="small">('+arrowsIn(s)+' arrows shot)</span>':fullMax}</span></div></div>
 ${fin?roundSummary(s)+(window.shootCompareHTML?shootCompareHTML(s):'')+(window.endViewHTML?endViewHTML(s):'')+`<div class="ad-sheet" style="padding:10px">${window.phBoxHtml&&s.id?phBoxHtml(s.id,'fin'):''}${noteBox(s)}<button class="btn alt full" id="finsess" style="margin-top:10px">${window.icon?icon('check'):''} Finish session</button><button class="btn ghost full" id="fin" style="margin-top:8px">See my wins</button></div>`:''}
 <div class="ad-foot"><button class="ad-back" id="sback">‹ Back</button>${s.sample?'':`<button class="ad-fin" id="delscore" type="button">Delete score</button>`}${fin?(early?`<button class="ad-fin" id="unfin">Keep scoring</button>`:'')+(window.shareSheet?`<button class="ad-fin" id="shsheet">Share</button>`:'')+(window.shareLink?`<button class="ad-fin" id="shlink">Copy link</button>`:''):`${arrowsIn(s)?`<button class="ad-fin" id="finnow">Finished</button>`:''}<button class="ad-go" id="addsc">Add Scores</button>`}</div></div>`;
 bindNotes();if(fin&&window.endViewBind)endViewBind(app);/* end by end viewer: finished shoots only */
 app.querySelectorAll('[data-fix]').forEach(el=>el.onclick=el.onkeydown=ev=>{if(ev.type=='keydown'&&ev.key!='Enter'&&ev.key!=' ')return;fix=el.dataset.fix.split(',').map(Number);fixRet=true;sv='entry';if(isFld(faceR(R,0))){fldHold=fix[0];fldHoldId=s.id}score()});
 if($('#addsc'))$('#addsc').onclick=()=>{fldHold=null;fldHoldId=null;sv='entry';score()};
 if($('#finnow'))$('#finnow').onclick=()=>{if(!confirm(`Finish round now? ${arrowsIn(s)} arrows, ${total(s)} points.`))return;while(s.ends.length>1&&!s.ends[s.ends.length-1].length){s.ends.pop();if(s.pos)s.pos.length=Math.min(s.pos.length,s.ends.length)}s.finished=true;fix=null;justDone=false;sv='sheet';save();score()};
 if($('#shsheet'))$('#shsheet').onclick=()=>shareSheet(s);if($('#shlink'))$('#shlink').onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(shareLink(s));$('#shlink').textContent='Copied ✓'};if($('#unfin'))$('#unfin').onclick=()=>{delete s.finished;save();sv='entry';score()};
 if($('#fin'))$('#fin').onclick=()=>{cur=null;sv='sheet';nav('home')};
 if($('#delscore'))$('#delscore').onclick=()=>{const id=s.id,back=window._sheetBack;if(!dropScore(id))return;window._sheetBack=null;if(back&&back!=='score')nav(back);else score()};
 /* Finish session (23 Oct 2026, Steven): the round is already saved arrow by arrow, so this only closes the sheet and shows the done state (no save, no second copy) */
 if($('#finsess'))$('#finsess').onclick=()=>{const id=s.id;cur=null;sv='sheet';fix=null;justDone=false;if(window.shotDone&&id)shotDone(id);else nav('score')};
 $('#sback').onclick=()=>{if(!fin)return leaveScoring();const back=window._sheetBack;window._sheetBack=null;cur=null;save();if(back)nav(back);else score()}}
const AA_MAP={'WA 720 (70m)':'WA 70/720','WA 720 (60m)':'WA 60/720','WA 720 (50m Compound)':'WA 50/720','Short Canberra (50/40/30m)':'Short Canberra','Junior Canberra (40/30/20m)':'Junior Canberra','Indoor WA 18m':'WA Indoor 18m','Australian Indoor 18m':'Australian Indoor 18m','WA 90/1440 (90/70/50/30m)':'WA 90/1440','WA 60/900 (60/50/40m)':'WA 60/900 (Canberra)','AA 50/1440 (50/40/30/20m)':'AA 50/1440'};
function pbPrev(s){if(!window._anShoots)return null;try{const all=_anShoots(),me=all.find(o=>o.s===s),rd=me?me.round:s.round,ord=o=>o.date+(o.s&&o.s.id?'|'+o.s.id:''),meK=s.date+'|'+(s.id||'');
 const ps=all.filter(o=>o.round==rd&&!o.part&&o.s!==s&&ord(o)<meK&&(o.ends&&o.ends.length||o.score)).map(o=>o.score);return ps.length?{pb:Math.max(...ps),n:ps.length}:{pb:null,n:0}}catch(e){return null}}
function roundSummary(s){const sc=total(s),prev=done().filter(x=>x.round==s.round&&x!==s),best=prev.length?prev.reduce((a,b)=>total(b)>total(a)?b:a):null;
 const off=findReal(S.profile||'').filter(r=>r.division).slice(-1)[0],div=off&&off.division,R0=ROUNDS[s.round],aa=R0&&s.ends.length==R0.ends&&s.ends.every(e=>e.length==R0.ape)?AA_MAP[s.round]:null;/* no AA rating for a round finished early */
 const rt=aa&&typeof aaRating=='function'&&AA_ROUNDS[aa]?aaRating(sc,aa,/compound/i.test(div||'')):null,lv=rt!=null&&div?aaLevel(rt,div):null;
 const row=(k,v,x='')=>`<tr><th>${k}</th><td>${v}</td><td class="small muted">${x}</td></tr>`;
 /* 31 Oct 2026 (queue B1): the Personal best note uses the same earlier shoots as the 'your PB' figure in This shoot vs your usual (practice and official results, full rounds only), so the two always agree. */
 const pp=pbPrev(s),pbv=pp?pp.pb:best?total(best):null,pbn=pp?pp.n:best?1:0;
 const pb=pbn?(sc>pbv?`New PB for this round, beating ${pbv}.`:sc==pbv?'Equal to your PB for this round.':''):'First time you have scored this round here.';
 const pbx=pbn&&pb?'<span class="small muted" style="display:block;margin-top:2px">Your PB counts your practice and official scores for this round, full rounds only.</span>':'';
 return`<div class="ad-sheet"><div class="ad-name">${esc(S.profile)}</div><table class="ad-kv">${div?row('Division',esc(div),'from your official results'):''}${row('Round Name',esc(s.round))}${row('Score',sc)}
 ${best?row('Best Score',Math.max(total(best),sc),total(best)>=sc?fmtD(best.date):fmtD(s.date)):''}${rt!=null?row('AA Rating',rt.toFixed(1)):''}${lv?row('Classification',esc(lv.name),'level for this rating · practice isn\'t counted'):''}</table>
 ${pb?`<div class="ad-band" style="margin:0">Personal best</div><p style="margin:8px 12px">${pb}${pbx}</p>`:''}</div>`}
function arrowsIn(s){return s.ends.reduce((t,e)=>t+e.length,0)}
function leaveScoring(after){if(!cur)return;fix=null;const go=()=>{cur=null;sv='sheet';save();if(after)after();else score()};
 if(!arrowsIn(cur)){S.sessions=S.sessions.filter(x=>x!==cur);return go()}
 const ov=document.createElement('div');ov.id='leaveov';ov.style.cssText='position:fixed;inset:0;background:#0008;z-index:50;display:flex;align-items:flex-end;justify-content:center';
 ov.innerHTML=`<div class="card" role="dialog" aria-modal="true" aria-label="Leave this round?" style="width:100%;max-width:480px;margin:0;border-radius:16px 16px 0 0;padding-bottom:calc(16px + env(safe-area-inset-bottom))"><h2>Leave this round?</h2><p class="small muted">${ROUNDS[cur.round]&&ROUNDS[cur.round].aba?(n=>n+(n==1?' target':' targets')+' scored so far.')(cur.ends.filter(e=>e.length).length):arrowsIn(cur)+' arrows entered so far.'} Keep it to finish later, or discard it.</p>
 <button class="btn full" id="lkeep">Keep this round for later</button><button class="btn full" id="ldisc" style="margin-top:8px;background:#dc2626;color:#fff">Discard round</button><button class="btn ghost full" id="lstay" style="margin-top:8px">Keep scoring</button></div>`;
 document.body.appendChild(ov);const close=()=>ov.remove();
 $('#lkeep').onclick=()=>{close();go()};$('#lstay').onclick=()=>{close();history.pushState({scoring:1},'')};
 $('#ldisc').onclick=()=>{if(!confirm('Discard this round? Its arrows will be deleted.'))return;close();S.sessions=S.sessions.filter(x=>x!==cur);go()}}
addEventListener('popstate',()=>{if(cur&&view=='score'&&!document.getElementById('leaveov')){history.pushState({scoring:1},'');leaveScoring()}});


/* a blank custom-round name is filled from the round type and distance: 'Target 70m'. No distance: the face and the ends. */
function roundAutoName(c){const disc=c.kind=='3d'?'3d':(c.disc||'target'),label={target:'Target',indoor:'Indoor',field:'Field',clout:'Clout','3d':'3D'}[disc]||'Target';
 if(disc=='3d')return '3D '+Math.max(2,Math.round(+c.targets||20))+' targets';
 const blocks=c.blocks||[],dists=[...new Set(blocks.map(b=>{const n=+b.dist;return n>0?String(n)+(b.unit||'m'):''}).filter(Boolean))];
 if(dists.length)return label+' '+dists.join('/');
 const b=blocks[0]||{},ends=blocks.reduce((t,x)=>t+(+x.ends||0),0);
 return [label,b.size?b.size+'cm':'',b.type&&b.type!='full'?b.type:'',ends?ends+(ends==1?' end':' ends'):''].filter(Boolean).join(' ')}
function freeRoundName(n,old){let name=n||'Target',i=2;while(ROUNDS[name]&&name!==old){name=(n||'Target')+' '+i;i++}return name}
const DISC_OPT=[['target','Target'],['indoor','Indoor'],['field','Field'],['clout','Clout'],['3d','3D']];
function discDefaults(disc){if(disc=='indoor')return [{dist:18,unit:'m',size:40,type:'3-spot',ends:10}];if(disc=='field')return [{dist:50,unit:'m',size:80,type:'field',ends:12}];if(disc=='clout')return [{dist:180,unit:'m',size:122,type:'full',ends:6}];return [{dist:70,unit:'m',size:122,type:'full',ends:6}]}
/* Ends and a custom arrows-per-end must be whole numbers in range. A bad figure stays on screen,
   is named in the same way as the Arrow chooser, and is left out of the max and the save until it is fixed.
   Save stays off while any of those boxes is invalid. Nothing already stored is deleted or rewritten. */
const CR_ENDS=[1,144],CR_APE=[1,12];
function crRangeMsg(label,raw,lo,hi){const t=String(raw??'').trim();
 if(t==='')return `${label}: type a whole number from ${lo} to ${hi}. It is left out until it is fixed.`;
 if(!/^-?\d+$/.test(t))return `${label}: "${t}" is not a whole number. Type the number only. It is left out until it is fixed.`;
 const x=+t;if(!Number.isFinite(x)||x<lo||x>hi)return `${label}: ${x} is outside the usual range of ${lo} to ${hi}. Check the number. It is left out until it is fixed.`;
 return ''}
function crSyncRaw(){const c=crEdit.d;if(!crEdit.raw)crEdit.raw={ape:String(c.ape??6),ends:(c.blocks||[]).map(b=>String(b.ends??'')),apeCustom:![3,6].includes(+c.ape)};
 const raw=crEdit.raw,n=(c.blocks||[]).length;while(raw.ends.length<n)raw.ends.push(String((c.blocks[raw.ends.length]||{}).ends??''));if(raw.ends.length>n)raw.ends.length=n;return raw}
function crProblems(){const raw=crSyncRaw(),out=[];raw.ends.forEach((v,i)=>{const m=crRangeMsg(raw.ends.length>1?`Ends (block ${i+1})`:'Ends',v,CR_ENDS[0],CR_ENDS[1]);if(m)out.push({id:'crend'+i,m,sel:'[data-b="'+i+'"] [data-f="ends"]'})});
 if(raw.apeCustom){const m=crRangeMsg('Arrows per end',raw.ape,CR_APE[0],CR_APE[1]);if(m)out.push({id:'crapem',m,sel:'#capec'})}return out}
function crApplyValid(){const c=crEdit.d,raw=crSyncRaw();raw.ends.forEach((v,i)=>{if(!crRangeMsg('Ends',v,CR_ENDS[0],CR_ENDS[1])&&c.blocks[i])c.blocks[i].ends=+v});
 if(!raw.apeCustom){if([3,6].includes(+raw.ape))c.ape=+raw.ape}else if(!crRangeMsg('Arrows per end',raw.ape,CR_APE[0],CR_APE[1]))c.ape=+raw.ape}
function roundForm(){const c=crEdit.d||(crEdit.i>=0?JSON.parse(JSON.stringify(S.customRounds[crEdit.i])):{name:'',ape:6,xs:true,disc:'target',blocks:[{dist:70,unit:'m',size:122,type:'full',ends:6}]});crEdit.d=c;if(!c.disc)c.disc=c.kind=='3d'?'3d':'target';
 if(c.kind=='3d')return roundForm3D(c);
 const raw=crSyncRaw();
 const tot=()=>{crApplyValid();return crProblems().length?'—':c.blocks.reduce((t,b)=>t+(+b.ends||0),0)*(+c.ape||0)*10};
 app.innerHTML=`<div class="card"><span class="kicker">${crEdit.i>=0?'Edit':'Create'} my practice round</span><label for="cdisc">Round type</label><select id="cdisc">${DISC_OPT.map(([v,l])=>`<option value="${v}" ${c.disc==v?'selected':''}>${l}</option>`).join('')}</select><label for="cn">Name</label><input id="cn" value="${esc(c.name)}" placeholder="Leave blank to name it from the type and distance">
 <label for="cape">Arrows per end</label><div style="display:flex;gap:6px"><select id="cape" style="flex:1">${[3,6].map(n=>`<option value="${n}" ${!raw.apeCustom&&+c.ape==n?'selected':''}>${n}</option>`).join('')}<option value="c" ${raw.apeCustom?'selected':''}>Custom</option></select><input id="capec" type="number" inputmode="numeric" value="${esc(raw.ape)}" style="flex:1" ${raw.apeCustom?'':'hidden'} aria-label="Custom arrows per end"></div>
 <label style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" id="cxs" style="width:auto" ${c.xs!==false?'checked':''}> Count Xs</label>
 <h3 style="margin-top:10px">Distance blocks</h3>${c.blocks.map((b,i)=>`<div class="list-item" data-b="${i}"><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
  <label>Distance<div style="display:flex;gap:4px"><input data-f="dist" type="number" min="1" value="${b.dist}" style="min-width:0"><select data-f="unit" style="width:64px">${['m','yd'].map(u=>`<option ${b.unit==u?'selected':''}>${u}</option>`).join('')}</select></div></label>
  <label>Ends<input data-f="ends" type="number" inputmode="numeric" value="${esc(raw.ends[i])}" aria-label="Ends"></label>
  <label>Face size<select data-f="size">${[122,80,60,40].map(z=>`<option value="${z}" ${b.size==z?'selected':''}>${z}cm</option>`).join('')}</select></label>
  <label>Face type<select data-f="type">${[['full','Full 10-ring'],['6-ring','6-ring'],['3-spot','3-spot'],['field','Field'],['3d','3D']].map(([v,l])=>`<option value="${v}" ${b.type==v?'selected':''}>${l}</option>`).join('')}</select></label></div>
  ${c.blocks.length>1?`<button class="btn ghost" data-rb="${i}" style="margin-top:6px;padding:4px 10px">Remove block</button>`:''}</div>`).join('')}
 <button class="btn ghost" id="addb" style="margin-top:6px">+ Add distance</button>
 <p style="margin:10px 0 0"><b>Max score: <span id="cmax">${tot()}</span></b> <span class="small muted">· practice only, never counted for classification</span></p>
 <div id="crerrs"></div>
 <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap"><button class="btn" id="csave">Save round</button><button class="btn ghost" id="ccancel">Cancel</button>${crEdit.i>=0?'<button class="btn ghost" id="cdel" type="button">Delete</button>':''}</div></div>`;
 const paintCr=()=>{const probs=crProblems(),box=$('#crerrs');if(box)box.innerHTML=probs.map(p=>`<p class="labbad" id="${p.id}" role="alert">${esc(p.m)}</p>`).join('');
  app.querySelectorAll('[data-f=ends],#capec').forEach(el=>{el.removeAttribute('aria-invalid');el.removeAttribute('aria-describedby')});
  probs.forEach(p=>{const el=app.querySelector(p.sel);if(!el)return;el.setAttribute('aria-invalid','true');el.setAttribute('aria-describedby',p.id)});
  const sv=$('#csave');if(sv)sv.disabled=probs.length>0;const mx=$('#cmax');if(mx)mx.textContent=tot()};
 app.querySelectorAll('[data-b] [data-f]').forEach(el=>el.oninput=el.onchange=()=>{if(el.dataset.f=='type'&&el.value=='3d'){c.kind='3d';c.targets=c.targets||20;return roundForm()}const b=c.blocks[+el.closest('[data-b]').dataset.b];
  if(el.dataset.f=='ends'){crSyncRaw().ends[+el.closest('[data-b]').dataset.b]=el.value;paintCr();return}
  b[el.dataset.f]=el.dataset.f=='dist'||el.dataset.f=='size'?+el.value:el.value;paintCr()});
 $('#cape').onchange=e=>{const r=crSyncRaw();if(e.target.value=='c'){r.apeCustom=true;$('#capec').hidden=false}else{r.apeCustom=false;r.ape=e.target.value;c.ape=+e.target.value;$('#capec').hidden=true}paintCr()};
 $('#capec').oninput=e=>{const r=crSyncRaw();r.apeCustom=true;r.ape=e.target.value;paintCr()};
 $('#cn').oninput=e=>c.name=e.target.value;$('#cxs').onchange=e=>c.xs=e.target.checked;
 $('#cdisc').onchange=e=>{c.disc=e.target.value;if(c.disc=='3d'){c.kind='3d';c.targets=c.targets||20;return roundForm()}delete c.kind;c.blocks=discDefaults(c.disc);if(c.disc=='indoor')c.ape=3;crEdit.raw=null;roundForm()};
 $('#addb').onclick=()=>{const l=c.blocks[c.blocks.length-1];c.blocks.push({...l});roundForm()};
 app.querySelectorAll('[data-rb]').forEach(b=>b.onclick=()=>{const i=+b.dataset.rb;c.blocks.splice(i,1);if(crEdit.raw&&crEdit.raw.ends)crEdit.raw.ends.splice(i,1);roundForm()});
 $('#ccancel').onclick=()=>{crEdit=null;score()};
 if($('#cdel'))$('#cdel').onclick=()=>{const i=crEdit.i;if(retireCustom(i)){crEdit=null;score()}};
 paintCr();
 $('#csave').onclick=()=>{if(crProblems().length){paintCr();return}crApplyValid();const old=crEdit.i>=0?S.customRounds[crEdit.i].name:'';let n=(c.name||'').trim();if(!n)n=freeRoundName(roundAutoName(c),old);if(ROUNDS[n]&&n!==old&&(!ROUNDS[n].custom||(crEdit.i>=0?S.customRounds[crEdit.i].name!=n:true)))return alert('That name is already used. Pick another.');
  c.name=n;if(!c.disc)c.disc='target';S.customRounds=S.customRounds||[];if(crEdit.i>=0){if(old!=n){delete ROUNDS[old];S.sessions.forEach(x=>{if(x.round==old)x.round=n})}S.customRounds[crEdit.i]=c}else S.customRounds.push(c);S.lastRound=n;crEdit=null;save();regCustom();score()}}
/* 3D practice round form: the only setting is the number of targets */
/* the builder's split line: halves are intended (3-arrow half, then 1-arrow half; odd extra goes first) */
function split3d(n){const a=Math.ceil(n/2),b=n-a;return`<b id="ctgsplith">Split into a 3-arrow half and a 1-arrow half (${a} + ${b})</b><br>First half (3-arrow): <b>${plN(a,'target','targets')}</b> · Second half (1-arrow): <b>${plN(b,'target','targets')}</b>${n%2?'<br><span class="muted" id="ctgodd">Odd number, so the extra target goes in the first half.</span>':''}`}
function roundForm3D(c){const n=Math.max(2,Math.round(+c.targets||20)),h1=Math.ceil(n/2),h2=n-h1;
 app.innerHTML=`<div class="card" id="cform3d"><span class="kicker">${crEdit.i>=0?'Edit':'Create'} my practice round</span><label for="cdisc">Round type</label><select id="cdisc">${DISC_OPT.map(([v,l])=>`<option value="${v}" ${v=='3d'?'selected':''}>${l}</option>`).join('')}</select><label for="cn">Name</label><input id="cn" value="${esc(c.name)}" placeholder="Leave blank to name it from the type and distance">
 <label for="cface">Face type</label><select id="cface">${[['full','Full 10-ring'],['6-ring','6-ring'],['3-spot','3-spot'],['3d','3D']].map(([v,l])=>`<option value="${v}" ${v=='3d'?'selected':''}>${l}</option>`).join('')}</select>
 <label for="ctg">Number of targets</label><input id="ctg" type="number" inputmode="numeric" min="2" max="100" step="1" value="${n}">
 <p class="small" id="ctgsplit" style="margin:6px 0 0">${split3d(n)}</p>
 <p class="small muted" style="margin:6px 0 0">ABA 3D scoring: in the 3-arrow half the first arrow to hit scores (20/18/16, then 14/12/10, then 8/6/4); in the 1-arrow half a miss scores 0. The club-rule option (first half 1 arrow too) is on the scoring screen.</p>
 <p style="margin:10px 0 0"><b>Max score: <span id="cmax">${20*n}</span></b> <span class="small muted">· 20 a target · practice only, never counted for classification</span></p>
 <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap"><button class="btn" id="csave">Save round</button><button class="btn ghost" id="ccancel">Cancel</button>${crEdit.i>=0?'<button class="btn ghost" id="cdel" type="button">Delete</button>':''}</div></div>`;
 $('#cn').oninput=e=>c.name=e.target.value;
 $('#cdisc').onchange=e=>{if(e.target.value=='3d')return;delete c.kind;c.disc=e.target.value;c.blocks=discDefaults(c.disc);c.ape=c.disc=='indoor'?3:(c.ape||6);roundForm()};
 /* update the split and max in place (no re-render, so typing and tapping Save never fight a redraw) */
 const sp=()=>{const v=Math.max(2,Math.min(100,Math.round(+$('#ctg').value||2))),a=Math.ceil(v/2),b2=v-a;c.targets=v;$('#ctgsplit').innerHTML=split3d(v);$('#cmax').textContent=20*v};
 $('#ctg').oninput=$('#ctg').onchange=sp;
 $('#cface').onchange=e=>{delete c.kind;c.blocks=c.blocks&&c.blocks.length?c.blocks:[{dist:18,unit:'m',size:40,type:'full',ends:10}];c.blocks.forEach(b=>b.type=e.target.value);c.ape=c.ape||6;roundForm()};
 $('#ccancel').onclick=()=>{crEdit=null;score()};
 if($('#cdel'))$('#cdel').onclick=()=>{const i=crEdit.i;if(retireCustom(i)){crEdit=null;score()}};
 $('#csave').onclick=()=>{const v=+$('#ctg').value;if(v!==Math.round(v)||v<2)return alert('Enter a whole number of targets, 2 or more.');c.targets=Math.min(100,v);const old=crEdit.i>=0?S.customRounds[crEdit.i].name:'';let nm=(c.name||'').trim();if(!nm)nm=freeRoundName(roundAutoName(c),old);if(ROUNDS[nm]&&nm!==old&&(!ROUNDS[nm].custom||(crEdit.i>=0?S.customRounds[crEdit.i].name!=nm:true)))return alert('That name is already used. Pick another.');
  const o={name:nm,kind:'3d',targets:c.targets};S.customRounds=S.customRounds||[];if(crEdit.i>=0){const old=S.customRounds[crEdit.i].name;if(old!=nm){delete ROUNDS[old];S.sessions.forEach(x=>{if(x.round==old)x.round=nm})}S.customRounds[crEdit.i]=o}else S.customRounds.push(o);S.lastRound=nm;crEdit=null;save();regCustom();score()}}
function plottedCard(s){if(!s||!(s.pos||[]).some(e=>(e||[]).some(Boolean)))return'<p class="small muted" style="margin:0 4px 12px">No arrows were plotted in this session.</p>';const R0=ROUNDS[s.round]||{},S3=use3(s,R0,faceR(R0,0)),pts=s.pos.flat().filter(Boolean).map(p=>S3?to1spot(s.face3=='vegas'?triPt(p):p,s.face3=='vegas'?TRIC:BUGC):p),g=groupStats(pts),R=S3?{face:'40cm 3-spot',xs:R0.xs,wa18:!!R0.wa18,inner10:!!s.inner10}:R0;
 return`<div class="card"><h3>Group plot · ${s.date}</h3><p class="small muted">${pts.length} plotted arrows from ${s.round}. Keypad arrows have no position, so they aren't shown.</p><div style="max-width:300px;margin:0 auto">${faceSVG(pts,'gplot',isSpot(R)?'-0.54 -0.54 1.08 1.08':isSix(R)?'-0.64 -0.64 1.28 1.28':'-1.04 -1.04 2.08 2.08',R,pts.length>=3?faceHi(`<circle cx="${g.cx}" cy="${g.cy}" r="${g.r}" fill="none" stroke="#39ff14" stroke-width="0.012" stroke-dasharray="0.04 0.03"/><path d="M${g.cx-0.06} ${g.cy}h0.12M${g.cx} ${g.cy-0.06}v0.12" stroke="#39ff14" stroke-width="0.018"/>`):'')}</div>${pts.length>=3?`<p class="small">Centre of group: ${Math.abs(g.cy)<0.04?'level':g.cy<0?'high':'low'}, ${Math.abs(g.cx)<0.04?'centred':g.cx<0?'left':'right'}. Spread ${(g.r*10).toFixed(1)} rings.</p>`:''}</div>`}
/* round pickers show the arrow count after the name (display only: option values stay the stored round names).
   Target rounds: ends x arrows an end. 3D rounds: targets x arrows a target, per half. */
const rdArrows=r=>{const R=ROUNDS[r];if(!R||!R.ends)return'';if(R.halves&&R.halves.length)return`(${R.halves.map(h=>h.t+' × '+h.n).join(' + ')} arrows)`;
 if(R.d3)return'';const n=R.ends*R.ape;return n>0?`(${n} arrows)`:''};
const rdPick=r=>{const a=rdArrows(r),n=window.rdLabel?window.rdLabel(r):r;return a?n+' '+a:n};window.rdPick=rdPick;
/* progress beside Incomplete: '10 of 20 ends' (ends with arrows / ends in the round); ABA/3D rounds count targets */
const incProg=s=>{const R=ROUNDS[s.round];if(!R||!R.ends)return'';const n=(s.ends||[]).filter(e=>e&&e.length).length,u=R.aba?'targets':'ends';return` <span class="inc-prog">${n} of ${R.ends} ${u}</span>`};
function sessionList(){return`<div class="card"><h3>Past sessions</h3>${allSessions().filter(s=>s&&(s.pg||!isDone(s))).slice().reverse().map(s=>`<div class="list-item row" style="align-items:flex-start"><div style="flex:1;min-width:0"><b>${total(s)}</b> · ${s.round}<div class="small muted">${s.date} ${s.sample?'<span class="sample">sample data</span>':''}${s.src=='paper'?' <span class="real">competition · paper sheet</span>':''}${isIncS(s)?' <span class="sample inc-tag">Incomplete</span>'+incProg(s):''}</div>${noteBox(s)}${window.calRowHtml?calRowHtml(s):''}${window.phBoxHtml&&s.id?phBoxHtml(s.id,'row'):''}</div>${s.sample?'':`<span class="sess-act">${ROUNDS[s.round]?`<button class="btn ghost" data-open="${s.id}">Open</button>`:''}<button class="btn ghost" data-del="${s.id}">Delete</button></span>`}</div>`).join('')||'<p class="small muted">No sessions yet. Tap Start on a round to score your first one.</p>'}</div>`}
function dropScore(id){const s=(S.sessions||[]).find(x=>String(x.id)===String(id));if(!s||s.sample)return false;if(!confirm("Delete this score? This can't be undone."))return false;S.sessions=S.sessions.filter(x=>x!==s);if(S.notes)delete S.notes[noteKey(s)];if(cur&&String(cur.id)===String(s.id)){cur=null;sv='sheet';fix=null;justDone=false}save();return true}
function refreshAfterDrop(){if(view==='scorecards'&&window.scorecardsView){scorecardsView();return}if(view==='home'){render();return}if(view==='score'){score();return}render()}
window.dropScore=dropScore;window.refreshAfterDrop=refreshAfterDrop;
function retireCustom(i){const c=(S.customRounds||[])[i];if(!c)return false;if(!confirm('Delete "'+c.name+'"? Scores already shot stay under this name. This can\'t be undone.'))return false;S.retiredRounds=S.retiredRounds||{};const snap=ROUNDS[c.name]?JSON.parse(JSON.stringify(ROUNDS[c.name])):{custom:true};snap.retired=true;snap.custom=true;snap.disc=c.kind==='3d'?'3d':(c.disc||snap.disc||'target');if(c.kind)snap.kind=c.kind;S.retiredRounds[c.name]=snap;S.customRounds.splice(i,1);if(S.lastRound===c.name)delete S.lastRound;save();regCustom();return true}
function bindList(){bindNotes();if(window.calRowBind)calRowBind(app);/* Open a past session to view or fix it (practice rounds stay editable) */app.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{const x=S.sessions.find(s=>s.id==b.dataset.open);if(!x)return;cur=x;sv='sheet';fix=null;justDone=false;history.pushState({scoring:1},'');score();scrollTo(0,0)});app.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{if(dropScore(b.dataset.del))refreshAfterDrop()})}

function stats(){const d=done();if(!d.length){app.innerHTML=officialCard()+'<div class="card">Score a practice session to see practice stats.</div>';bindNotes();if($('#os'))$('#os').onchange=e=>{window._o=+e.target.value;stats()};return}
 const byRound={};d.forEach(s=>(byRound[s.round]=byRound[s.round]||[]).push(s));const rounds=Object.keys(byRound);
 const sel=window._r&&byRound[window._r]?window._r:rounds.sort((a,b)=>byRound[b].length-byRound[a].length)[0],ss=byRound[sel];
 const tot=ss.map(total),roll=tot.map((_,i)=>{const w=tot.slice(Math.max(0,i-2),i+1);return w.reduce((a,b)=>a+b)/w.length});
 const pb=tot.map((_,i)=>Math.max(...tot.slice(0,i+1))),last=ss[window._ps!=null&&ss[window._ps]?window._ps:ss.length-1],ends=last.ends.map(endSum);
 const nE=Math.max(...ss.map(s=>s.ends.length)),endAvg=[...Array(nE)].map((_,i)=>{const v=ss.map(s=>s.ends[i]?endSum(s.ends[i]):null).filter(x=>x!=null);return v.reduce((a,b)=>a+b,0)/v.length});
 const third=Math.max(1,Math.floor(nE/3)),early=endAvg.slice(0,third).reduce((a,b)=>a+b)/third,late=endAvg.slice(-third).reduce((a,b)=>a+b)/third;
 const cons=ss.map(s=>sd(s.ends.map(endSum)));const real=findReal(S.profile);
 app.innerHTML=`<h2 class="sec" style="margin:22px 4px 6px;border-bottom:3px solid #166534;padding-bottom:4px">This official round</h2><p class="small muted" style="margin:0 4px 10px">Only this round’s own arrows from the scoresheet.</p>`+officialCard()+'<p class="small muted" style="margin:-4px 4px 12px">Plots are only for practice sessions. Arrows can’t be plotted at official shoots.</p>'+`<h2 class="sec" style="margin:22px 4px 6px;border-bottom:3px solid #166534;padding-bottom:4px">This practice session</h2><p class="small muted" style="margin:0 4px 10px">Pick a practice session. The plot and end-by-end chart use only that session’s arrows.</p><div class="card"><h2>Practice</h2><label for="rs">Round</label><select id="rs">${rounds.map(r=>`<option ${r==sel?'selected':''}>${r}</option>`).join('')}</select><label for="ps">Session</label><select id="ps">${ss.map((x,j)=>[x,j]).reverse().map(([x,j])=>`<option value="${j}" ${x==last?'selected':''}>${x.date} · ${total(x)}${x.sample?' (sample)':''}</option>`).join('')}</select>${ss.some(s=>s.sample)?'<p class="small"><span class="sample">Includes sample data</span> Sample practice sessions, not real scores.</p>':''}</div>`+plottedCard(last)+`<div class="card"><h3>End by end · ${last.date}${(last.round.match(/(\d+m)/)||[])[1]?' at '+last.round.match(/(\d+m)/)[1]:''}</h3>${endChart(ends,last.ends.map(e=>e.length),null)}</div><h2 class="sec" style="margin:22px 4px 6px;border-bottom:3px solid #166534;padding-bottom:4px">All your practice</h2><p class="small muted" style="margin:0 4px 10px">Trends across every practice session of the chosen round.</p>`+noteInsights()+`<div class="card"><h3>Score trend</h3>${lineChart([{name:'Score',data:tot,c:'#1d4ed8'},{name:'3-session average',data:roll,c:'#e0a800',dash:1},{name:'PB',data:pb,c:CBC('#16a34a','#ffffff'),w:1.5,dash:1}],{labels:ss.map(s=>s.date.slice(5)),markers:typeof setupMarkers=='function'?setupMarkers(ss.map(s=>s.date)):[]})}</div>
 <div class="card"><h3>Consistency</h3><p class="small muted">How spread out your end scores were. Lower means steadier.</p>${lineChart([{name:'End spread (SD)',data:cons.map(x=>Math.round(x*10)/10),c:'#3b82f6'}],{labels:ss.map(s=>s.date.slice(5))})}</div>
 <div class="card"><h3>Early vs late ends</h3><div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat"><b>${early.toFixed(1)}</b>first ${plN(third,'end','ends')}</div><div class="stat"><b>${late.toFixed(1)}</b>last ${plN(third,'end','ends')}</div></div>
 <p>${late>=early-0.3?'💪 Your last ends held up with your first ends.':`Your last ${third} ends averaged ${(early-late).toFixed(1)} points lower than your first ${third}.`}</p></div>
 <div class="card"><h3>Personal bests</h3>${Object.entries(pbs()).map(([r,v])=>`<div class="list-item row"><span>${r}</span><span><b>${v.score}</b> ${v.real?'<span class="real">official</span>':v.sample?'<span class="sample">sample</span>':''}</span></div>`).join('')}</div>
 <h2 class="sec" style="margin:22px 4px 6px;border-bottom:3px solid #166534;padding-bottom:4px">All your official scores</h2><p class="small muted" style="margin:0 4px 10px">Every official result, across all events.</p>${officialCharts(real)}
 ${estRating(real)}
 <div class="card"><h3>Compare</h3><p>Default: <b>you vs. you</b>. This season's average is ${(tot.reduce((a,b)=>a+b)/tot.length).toFixed(0)}, and your first ${plN(Math.min(3,tot.length),'session','sessions')} averaged ${(tot.slice(0,3).reduce((a,b)=>a+b)/Math.min(3,tot.length)).toFixed(0)}.</p><label><input type="checkbox" id="club" style="width:auto"> Show club & division averages (opt-in)</label><div id="clubout"></div></div>`;
 app.querySelectorAll('[data-ev]').forEach(b=>b.onchange=()=>{S.evOver=S.evOver||{};S.evOver[b.dataset.ev]=b.checked?'open':'club';save();const y=scrollY;stats();scrollTo(0,y)});app.querySelectorAll('[data-oc]').forEach(b=>b.onclick=()=>{window._oc=b.dataset.oc;const y=scrollY;stats();scrollTo(0,y)});bindNotes();$('#rs').onchange=e=>{window._r=e.target.value;window._ps=null;stats()};$('#ps').onchange=e=>{window._ps=+e.target.value;stats()};if($('#os'))$('#os').onchange=e=>{window._o=+e.target.value;stats()};
 $('#club').onchange=e=>{$('#clubout').innerHTML=e.target.checked?'<p class="small muted">Coming soon: club and division averages worked out from the public Archer\'s Diary results already on archerycalendars.com. Off by default for juniors.</p>':''}}
function offRounds(){const me=(S.profile||'').toLowerCase(),nm=x=>{x=x.toLowerCase();if(x==me)return true;const[f,...r]=me.split(' '),l=r.pop()||'';return !!l&&x.includes(l)&&x.includes(f.slice(0,4))},k=Object.keys(OFF).find(nm),rk=Object.keys(REAL).find(nm);
 const L=(k?OFF[k]:[]).map(o=>Object.assign({},o)),yr=String(new Date().getFullYear());
 (rk?REAL[rk]:[]).filter(r=>normDate(r.date).startsWith(yr)).forEach(r=>{const m=L.find(o=>o.date==r.date&&o.round==r.round&&!o.score);
  if(m){Object.assign(m,{score:r.score,division:r.division,subs:r.subs,notes:r.notes,url:m.url||r.url})}
  else L.push({key:r.date+'|'+r.round+'|'+r.division,date:r.date,event:r.event,round:r.round,url:r.url,ends:[],score:r.score,division:r.division,subs:r.subs,notes:r.notes,tens:r.tens,xs:r.xs})});
 if(window.applySheets)applySheets(L);
 return L.sort((a,b)=>normDate(a.date)<normDate(b.date)?1:normDate(a.date)>normDate(b.date)?-1:0)}
/* Arrow counts per round: from the AA rating tables where present, else the standard round definition. */
const ARROWS_STD={'Perth':90,'Grange':90,'Newcastle':90,'Geelong':90,'Drake':90,'Samford':90,'Launceston':72,'WA 70/720':72,'WA 60/720':72,'WA 50/720':72,'WABB 50/720 (AA 50/720)':72,'AA 40/720':72,'AA 30/720':72,'AA 20/720':72,'Sydney':120,'Double Aus Indoor 18m':60,'Australian Indoor 18m':30,'WA Field 24Mk Red':72,'WA Field 24Mk Blue':72,'WA Field 24Mk Yellow':72,'WA Field 24Umk Red':72,'Aus Clout 180m':36,'WA Field 24Umk Blue':72,'WA Field 24Umk Yellow':72,'WA Field 24Umk Red + WA Field 24Mk Red':144};
function roundArrows(r){const d=typeof AA_ROUNDS!='undefined'&&AA_ROUNDS[r];if(d&&d.r)return d.r.reduce((t,p)=>t+p[0],0);return ARROWS_STD[r]||null}
function trendSVG(pts,hi){const W=340,H=110,P=26,v=pts.map(p=>p.s),mn=Math.min(...v),mx=Math.max(...v),sp=mx-mn||1,X=i=>P+(pts.length<2?(W-2*P)/2:i*(W-2*P)/(pts.length-1)),Y=s=>H-22-(s-mn)/sp*(H-44);
 let g=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Totals on this round over time">`;
 if(pts.length>1)g+=`<polyline fill="none" stroke="#64748b" stroke-width="1.5" points="${pts.map((p,i)=>X(i)+','+Y(p.s)).join(' ')}"/>`;
 pts.forEach((p,i)=>{const h=i==hi;g+=`<circle cx="${X(i)}" cy="${Y(p.s)}" r="${h?6:3.5}" fill="${p.part?'none':h?'#ffd84d':'#60a5fa'}" stroke="${h?'#ffd84d':p.part?'#94a3b8':'#60a5fa'}" stroke-width="${p.part?1.5:1}"><title>${p.d}: ${p.s}${p.part?' (partial)':''}</title></circle>`;
  if(h||pts.length<=8)g+=`<text x="${X(i)}" y="${Y(p.s)-9}" font-size="9" text-anchor="middle" fill="${h?'#ffd84d':'var(--muted)'}" font-weight="${h?800:400}">${p.s}</text>`});
 g+=`<text x="${P}" y="${H-6}" font-size="9" fill="#64748b">${pts[0].d.slice(2)}</text><text x="${W-P}" y="${H-6}" font-size="9" text-anchor="end" fill="#64748b">${pts[pts.length-1].d.slice(2)}</text></svg>`;return g}
function summaryCard(L,i,o){const subs=(o.subs||'').split(';').map(x=>x.split(':')).filter(x=>x.length==2&&x[1]);
 const part=/incomplete|partial|not shot|didn.?t finish/i.test(o.notes||''),na=roundArrows(o.round),t10=parseInt(o.tens)||0,tx=parseInt(o.xs)||0;
 const bow=d=>(String(d||'').match(/Compound|Barebow|Recurve|Longbow/i)||[''])[0];
 const mine=findReal(S.profile||'').filter(r=>r.round==o.round&&bow(r.division)==bow(o.division)).map(r=>({d:normDate(r.date),s:r.score,part:!!r.incomplete})).sort((a,b)=>a.d<b.d?-1:1);
 const hi=mine.findIndex(p=>p.d==normDate(o.date)&&p.s==o.score),full=mine.filter(p=>!p.part),pb=full.length?Math.max(...full.map(p=>p.s)):null,pbD=pb!=null?full.find(p=>p.s==pb).d:'';
 const rank=part?null:full.slice().sort((a,b)=>b.s-a.s).findIndex(p=>p.s==o.score)+1;
 const st=(v,l)=>`<div class="stat"><b>${v}</b>${l}</div>`,cells=[st(o.score,'total')];
 if(na&&!part)cells.push(st((o.score/na).toFixed(2),`avg arrow (${na})`));
 if(t10&&na&&!part)cells.push(st(Math.round(t10/na*100)+'%',`10s (${t10})`));else if(t10)cells.push(st(t10,'10s'));
 if(tx&&na&&!part)cells.push(st(Math.round(tx/na*100)+'%',`Xs (${tx})`));else if(tx)cells.push(st(tx,'Xs'));
 if(!part&&pb!=null)cells.push(st(o.score>=pb?'PB':'−'+(pb-o.score),o.score>=pb?'best on round':'vs PB '+pb));
 if(rank)cells.push(st(rank+'/'+full.length,'on this round'));
 return`<div class="card"><span class="kicker">Official round · result <span class="real">official</span></span><label for="os">Pick a round</label><select id="os">${L.map((x,j)=>`<option value="${j}" ${j==i?'selected':''}>${x.date} · ${x.round}${x.ends.length?'':' · '+x.score}${/Recurve/.test(x.division||'')?' (Recurve)':''}</option>`).join('')}</select>
 <p class="small muted">${esc(o.event)} · ${esc(o.division||'')} · <a href="${o.url}" target="_blank" rel="noopener">Scoresheet</a></p>
 ${part?'<p class="small"><span class="sample">Partial round</span> Not a full round, so it isn\'t averaged, ranked or compared with your PB.</p>':''}
 <div class="stats" style="grid-template-columns:1fr 1fr 1fr">${cells.join('')}</div>
 ${!part&&pb!=null&&o.score<pb?`<p class="small muted" style="margin:4px 0 0">PB ${pb} on ${pbD}.</p>`:''}
 ${subs.length?`<h3 style="margin-top:12px">By distance</h3>${subs.map(([d,v])=>`<div class="list-item row"><span>${esc(d)}</span><b>${esc(v)}</b></div>`).join('')}`:''}
 ${mine.length>1?`<h3 style="margin-top:12px">Your ${esc(o.round)} totals</h3>${trendSVG(mine,hi)}<p class="small muted" style="margin:0">Gold = this shoot.${mine.some(p=>p.part)?' Hollow = partial round.':''} ${full.length} full round${full.length==1?'':'s'}.</p>`:''}
 ${o.notes?`<p class="small muted">${esc(o.notes)}</p>`:''}<p class="small muted">Only the total score was published for this shoot.</p>${window.openSheet?`<button class="btn ghost full" style="margin:6px 0" data-sheet="${esc(JSON.stringify({date:normDate(o.date),round:o.round,event:o.event||'',score:o.score,division:o.division||''}))}">📷 Photo scoresheet · add end by end</button>`:''}${noteBox({date:o.date,round:o.round})}</div>`}
function officialCard(){const L=offRounds();if(!L.length)return'';const i=Math.min(window._o||0,L.length-1),o=L[i];if(!o.ends.length)return summaryCard(L,i,o);const good=o.ends.filter(e=>!e.flag),flagged=o.ends.filter(e=>e.flag);
 const sums=good.map(e=>endSum(e.arrows)),all=good.flatMap(e=>e.arrows),n=all.length||1,pc=f=>Math.round(all.filter(f).length/n*100);
 const dists=[...new Set(good.map(e=>e.dist))],third=Math.max(1,Math.floor(sums.length/3)),fe=sums.slice(0,third),le=sums.slice(-third),av=a=>a.reduce((x,y)=>x+y,0)/a.length;
 const fake={id:'off',date:o.date,round:o.round,ends:good.map(e=>e.arrows),dists:good.map(e=>e.dist)};const gl=sums.map((_,j)=>endLabel(fake,j).match(/end (\d+)/)[1]);
 return`<div class="card"><span class="kicker">Official round · real arrows <span class="real">official</span></span><label for="os">Pick a round</label><select id="os">${L.map((x,j)=>`<option value="${j}" ${j==i?'selected':''}>${x.date} · ${x.round}${x.ends.length?'':' · '+x.score}${/Recurve/.test(x.division||'')?' (Recurve)':''}</option>`).join('')}</select>
 <p class="small muted">${o.event} · ${plN(good.length,'end','ends')} · ${plN(all.length,'arrow','arrows')} · total ${sums.reduce((a,b)=>a+b,0)} · <a href="${o.url}" target="_blank" rel="noopener">Scoresheet</a></p>
 ${flagged.length?`<p class="small"><span class="sample">Flagged</span> ${flagged.map(e=>e.dist).join(', ')}: ${flagged.length} end(s) with every arrow a miss. That's most likely a scoresheet error, so it's left out of these stats and isn't treated as real form.</p>`:''}
 <h3>End by end${dists.length>1?' (by distance)':' at '+dists[0]}</h3>${endChart(sums,good.map(e=>e.arrows.length),dists.length>1?fake.dists:null,'',flagged.map(e=>e.dist))}${dists.length>1&&flagged.length?`<p class="small muted" style="margin:2px 0">* Subtotal of the ends shown. ${flagged.length} flagged end(s) at ${[...new Set(flagged.map(e=>e.dist))].join(', ')} left out.</p>`:''}
 <h3>Arrow values</h3><div class="stats"><div class="stat"><b>${pc(a=>a=='X')}%</b>X</div><div class="stat"><b>${pc(a=>a=='10')}%</b>10</div><div class="stat"><b>${pc(a=>a=='9')}%</b>9</div></div>
 <h3 style="margin-top:12px">Per distance (avg per arrow)</h3>${dists.map(d=>{const a=good.filter(e=>e.dist==d).flatMap(e=>e.arrows);return`<div class="list-item row"><span>${d}</span><b>${(a.reduce((t,x)=>t+val(x),0)/a.length).toFixed(2)}</b></div>`}).join('')}
 <div class="stats" style="grid-template-columns:1fr 1fr 1fr;margin-top:10px"><div class="stat"><b>${av(fe).toFixed(1)}</b>first ${plN(third,'end','ends')}</div><div class="stat"><b>${av(le).toFixed(1)}</b>last ${plN(third,'end','ends')}</div><div class="stat"><b>${sd(sums).toFixed(1)}</b>end spread</div></div>
 ${ryTips(sums,good,all,dists,fe,le,j=>endLabel(fake,j))}${noteBox({date:o.date,round:o.round})}<h3 style="margin-top:12px">Wins from this round</h3>${winsFor(fake).map(w=>`<div class="win"><i>${w[0]}</i><div>${w[1]}</div></div>`).join('')}</div>`}

/* Official scores: one chart per round + bow type (chips), plus AA rating over time. */
const fmtD=d=>{const x=new Date(normDate(d));return isNaN(x)?d:x.getDate()+' '+x.toLocaleString('en-AU',{month:'short'})};
function ptChart(P,{mn,mx,id}){const W=340,h=170,L=34,R=10,T=14,B=24,n=P.length,X=i=>L+(n<2?(W-L-R)/2:i*(W-L-R)/(n-1)),Y=v=>T+(1-(v-mn)/(mx-mn||1))*(h-T-B);
 let g=`<svg viewBox="0 0 ${W} ${h}" width="100%" role="img" aria-label="chart"><line x1="${L}" y1="${h-B}" x2="${W-R}" y2="${h-B}" stroke="#94a3b8"/>`;
 [mn,(mn+mx)/2,mx].forEach(v=>g+=`<text x="${L-4}" y="${Y(v)+4}" font-size="10" text-anchor="end" fill="var(--muted)">${Math.round(v)}</text><line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e2e8f0"/>`);
 g+=`<polyline fill="none" stroke="#166534" stroke-width="2" points="${P.map((p,i)=>`${X(i)},${Y(p.v)}`).join(' ')}"/>`;
 const step=Math.ceil(n/5);P.forEach((p,i)=>{if((i%step==0&&(n-1-i>=step*0.6||i==0))||i==n-1)g+=`<text x="${X(i)}" y="${h-8}" font-size="10" text-anchor="${i==0&&n>1?'start':i==n-1&&n>1?'end':'middle'}" fill="var(--muted)">${p.label}</text>`;
  g+=p.star?`<path transform="translate(${X(i)-8} ${Y(p.v)-8}) scale(.667)" fill="#ffc629" d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>`:`<circle cx="${X(i)}" cy="${Y(p.v)}" r="4" fill="#166534"/>`;
  g+=`<circle cx="${X(i)}" cy="${Y(p.v)}" r="12" fill="transparent" style="cursor:pointer" data-t="${esc(p.tip)}" onclick="this.closest('.pc').querySelector('.pcap').textContent=this.dataset.t"><title>${esc(p.tip)}</title></circle>`});
 return`<div class="pc">${g}</svg><p class="small pcap" style="margin:2px 0;min-height:1.2em">Tap a point for details.</p></div>`}
function officialCharts(real){const ok=real.filter(r=>!r.incomplete&&r.score>0);if(!ok.length)return'';const G={};
 ok.forEach(r=>{const c=aaCategory(r.division),k=r.round+' · '+(c?c.bow:(r.division||'').split(' ').pop());(G[k]=G[k]||[]).push(r)});
 const keys=Object.keys(G).sort((a,b)=>G[b].length-G[a].length);const k=window._oc&&G[window._oc]?window._oc:keys[0],L=G[k].slice().sort((a,b)=>normDate(a.date)<normDate(b.date)?-1:1);
 const rd=L[0].round,def=AA_ROUNDS&&AA_ROUNDS[rd],max=def?def.r.reduce((t,p)=>t+p[0]*p[3][0][1],0):null,best=Math.max(...L.map(r=>r.score)),bi=L.findIndex(r=>r.score==best);
 const lo=Math.min(...L.map(r=>r.score)),pad=Math.max(2,(best-lo)*0.15);
 const chart=ptChart(L.map((r,i)=>({v:r.score,label:fmtD(r.date),star:i==bi,tip:`${fmtD(r.date)} ${normDate(r.date).slice(0,4)} · ${r.event} · ${r.score}${max?' / '+max:''}${i==bi?' ⭐ PB':''}`})),{mn:Math.floor(lo-pad),mx:Math.min(max||1e9,Math.ceil(best+pad))});
 const rt=ok.map(r=>{const c=aaCategory(r.division);return{r,v:c?aaRating(r.score,r.round,c.bow=='Compound'&&r.round=='WA Indoor 18m'):null}}).filter(x=>x.v!=null).sort((a,b)=>normDate(a.r.date)<normDate(b.r.date)?-1:1);
 const rb=rt.length?Math.max(...rt.map(x=>x.v)):0,rl=rt.length?Math.min(...rt.map(x=>x.v)):0;
 return`<div class="card"><h3>Official scores by round</h3><div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">${keys.map(x=>`<button class="btn ${x==k?'':'ghost'}" data-oc="${esc(x)}" style="padding:5px 10px;font-size:13px">${esc(x)} (${G[x].length})</button>`).join('')}</div>
 <p class="small muted" style="margin:0">${esc(k)}${max?` · out of ${max}`:''} · best ${best} ⭐</p>${chart}</div>
 ${rt.length>1?`<div class="card"><h3>Rating over time</h3><p class="small muted" style="margin:0">Rating lets you compare different rounds.</p>${ptChart(rt.map(x=>({v:x.v,label:fmtD(x.r.date),star:x==rt.find(y=>y.v==rb),tip:`${fmtD(x.r.date)} ${normDate(x.r.date).slice(0,4)} · ${x.r.event} · ${x.r.round} ${x.r.score} · rating ${x.v.toFixed(1)}`})),{mn:Math.floor(rl-2),mx:Math.ceil(rb+2)})}</div>`:''}`}
/* Ratings: Archery Australia rating scheme (Park 2014) + Schedule 4A.1 classification levels; see ratings.js for sources. */
/* Event requirements: AA Shooting Rules v7.2 (July 2026), 4.2.3 Outdoor Target and 4.2.4 Indoor Target:
   White-Gold: open tournament, QRE or club-calendar shoot (outdoor: Schedule 9A round, min 72 arrows).
   Master & Grand Master: at least 1 of the 3 rounds at an open tournament or QRE.
   Elite Bronze/Silver/Gold: all 3 rounds at an open tournament or QRE.
   Outdoor only: each open tournament/QRE round is 72+ arrows with at least 30 arrows at the listed minimum distance or longer.
   The rules make no distinction between state and national ranking events for classifications (both count as open tournament/QRE). */
const EV_NEED=[3,3,3,1,1,0,0,0,0,0];
const LV_COL={'Elite Gold':'#d4af37','Elite Silver':'#c0c7d1','Elite Bronze':'#cd7f32','Grand Master':'#1e3a8a','Master':'#0369a1','Gold':'#ffd84d','Red':'#d62828','Blue':'#2563eb','Black':'#111','White':'#fff'};
const EV_LABEL={club:'Club shoot',open:'Open/registered tournament',state:'State ranking/championship',national:'National ranking event'};
function evType(r){const k='e:'+normDate(r.date)+'|'+r.round,o=(S.evOver||{})[k];if(o)return o;const n=r.event||'';
 return/\bQRE\b|world record status|national/i.test(n)?'national':/state\b.*(championship|titles|ranking)|state ranking/i.test(n)?'state':/\bopen\b|tournament|\bcup\b|classic|trophy/i.test(n)?'open':'club'}
function minDistOK(r,c){const def=AA_ROUNDS[r.round];if(!def)return null;const P=def.r,tot=P.reduce((t,p)=>t+p[0],0);if(tot<72)return false;
 const age=(c.key.match(/Under (1[46])/)||[])[1],need=age=='16'?40:age=='14'?30:60;const face=p=>p[3][p[3].length-1][0];
 return P.filter(p=>p[1]>=need&&face(p)>=1.2||(!age&&c.bow=='Compound'&&p[1]>=50&&face(p)>=0.79)).reduce((t,p)=>t+p[0],0)>=30}
let NEXT=null;function loadNext(){if(NEXT)return;NEXT=[];fetch('https://archerycalendars.com/data/events.json').then(r=>r.json()).then(d=>{const t=today();
 NEXT=(d.events||[]).filter(x=>/Registered tournament|QRE|State Championship|^National|^State$/.test(x.level||'')&&/target|indoor/i.test(x.discipline||'')&&(x.start_date||'')>=t).sort((a,b)=>((b.state=='WA')-(a.state=='WA'))||(a.start_date<b.start_date?-1:1)).slice(0,4);if(view=='stats')stats()}).catch(()=>{})}
/* ONE classification check, used by the Ranks card, 'Where you stand' and the AA progress card: a level needs 3 rounds this year rated at or
   above it, and Master Bowman and up also need some of them at an open tournament or Archery Australia ranking event (EV_NEED). */
function aaQualOf(r,c){const d=AA_ROUNDS[r.round],ind=!!(d&&d.r.every(p=>p[2]));return evType(r)!='club'&&(ind||minDistOK(r,c)!==false)}
function aaLevelStatus(list,lv,i){const at=list.filter(x=>x.rt>=lv[i]),n=at.length,qn=at.filter(x=>x.q).length,need=Math.min(EV_NEED[i],3),ok=n>=3&&qn>=need;return{n,qn,need,ok,missing:ok||n<3?0:need-qn}}
const aaNeedTxt=m=>`needs ${plN(m,'more round','more rounds')} at an open tournament or Archery Australia ranking event`;
window.aaQualOf=aaQualOf;window.aaLevelStatus=aaLevelStatus;window.aaNeedTxt=aaNeedTxt;
function estRating(real){if(typeof aaRating!='function')return'';loadNext();const yr=today().slice(0,4),groups={};
 real.filter(r=>!r.incomplete).forEach(r=>{const c=aaCategory(r.division);if(!c)return;const rt=aaRating(r.score,r.round,c.bow=='Compound'&&r.round=='WA Indoor 18m');if(rt==null)return;
  const ind=AA_ROUNDS[r.round].r.every(p=>p[2])?'Indoor':'Outdoor',gk=c.bow+'|'+ind,ev=evType(r),q=aaQualOf(r,c);
  (groups[gk]=groups[gk]||{div:r.division,list:[]}).list.push({r,rt,ev,q,date:normDate(r.date)});groups[gk].div=r.division});
 const body=Object.entries(groups).map(([gk,G])=>{const[bow,disc]=gk.split('|'),c=aaCategory(G.div),lv=AA_CLASS[c.bow][c.key]||[],L=G.list,last=L[L.length-1],thisYr=L.filter(x=>x.date.slice(0,4)==yr);
  const tiles=AA_LEVELS.map((nm,i)=>{const L0=aaLevelStatus(thisYr,lv,i),n=L0.n,qn=L0.qn,need=EV_NEED[i],ok=L0.ok;
   const st=ok?'✅ Achieved':n>=3?`⚠️ Scores reached; provisional: ${aaNeedTxt(L0.missing)}`:`${n}/3 rounds`;
   const fg=['Black','Blue','Red','Grand Master','Master'].includes(nm)?'#fff':'#0f172a';
   return`<div style="border-radius:10px;padding:8px;background:${LV_COL[nm]};color:${fg};border:1px solid #cbd5e1;${n?'':'opacity:.55'}"><b style="font-size:13px">${({'Master':'Master Bowman','Grand Master':'Grand Master Bowman'})[nm]||nm}</b> <span style="font-size:11px">${lv[i]}+</span><div style="font-size:12px">Rounds at this level: ${Math.min(n,3)}/3${need?`<br>At qualifying events: ${Math.min(qn,need)}/${need}`:''}</div><div style="font-size:12px;margin-top:2px">${st}</div></div>`}).reverse();
  return`<details ${disc=='Outdoor'?'open':''} style="margin-top:8px"><summary><b>${disc} · ${bow} · ${c.key}</b> · latest ${last.rt.toFixed(1)}</summary>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">${tiles.join('')}</div>
  <details style="margin-top:6px"><summary class="small">This year's rounds and event type (${thisYr.length})</summary>${thisYr.slice().reverse().map(x=>{const k='e:'+x.date+'|'+x.r.round;return`<div class="list-item small"><b>${x.r.score}</b> ${x.r.round} · ${fmtD(x.date)} · rating ${x.rt.toFixed(1)}<br>${esc(x.r.event)}<br>${EV_LABEL[x.ev]}${x.q?' ✓ qualifying':''}${x.ev!='club'&&disc=='Outdoor'&&minDistOK(x.r,c)===false?' (round too short or too close to qualify)':''}
   <label style="display:flex;gap:6px;align-items:center;margin-top:2px"><input type="checkbox" data-ev="${esc(k)}" style="width:auto" ${x.ev!='club'?'checked':''}> This was a ranking shoot (open tournament, state/national ranking or Archery Australia ranking event)</label></div>`}).join('')}</details></details>`}).join('');
 const nx=(NEXT||[]).map(x=>`<li><a href="https://archerycalendars.com/#/shoot/${encodeURIComponent(x.id)}" target="_blank" rel="noopener">${esc(x.name)}</a> · ${fmtD(x.start_date)} · ${x.state||'AUS'}</li>`).join('');
 return`<div class="card"><h3>AA classification progress</h3><p class="small muted" style="margin:0">Archery Australia rating and levels · ${yr}. Rating = a number that puts every round on the same scale, so different rounds can be compared.</p>${body||'<p class="small muted">No supported rounds yet.</p>'}
 ${nx?`<h3 style="margin-top:10px">Next chance</h3><p class="small muted" style="margin:0">Upcoming registered tournaments, state/national events and Archery Australia ranking events (WA first) from archerycalendars.com.</p><ul class="small" style="padding-left:18px">${nx}</ul>`:''}
 <details style="margin-top:8px"><summary class="small"><b>How this works</b></summary><p class="small">Ratings use the Archery Australia rating model (J. Park), the one used for official AA ratings, calculated on this phone from round, score and bow type. They're within about 0.3 of the official ratings outdoors; indoor can read up to 1.5 higher.</p>
 <p class="small">Levels and event rules: AA Shooting Rules v7.2, Schedule 4A.1 and rules 4.2.3 (outdoor) and 4.2.4 (indoor). You need 3 rounds at the level in the calendar year. White to Gold can be shot at a club-calendar shoot, open tournament or Archery Australia ranking event. Master and Grand Master need at least 1 of the 3 at an open tournament or Archery Australia ranking event. Elite Bronze, Silver and Gold need all 3 at an open tournament or Archery Australia ranking event. Outdoors, those rounds need 72+ arrows with at least 30 at the minimum distance for your class. The rules don't separate state and national ranking events here; both count. Three AA members must take part in shooting and scoring. Event types are guessed from the event name, so tick the box if it's wrong. Official claims go through your club.</p>
 <p class="small"><a href="https://www.archersdiary.com/RatingCalculator.aspx" target="_blank" rel="noopener">Online rating calculator</a> · <a href="https://archery.org.au/wp-content/uploads/2026/07/SHOOTINGRULES-AA-2026-07-01.pdf" target="_blank" rel="noopener">AA Shooting Rules</a></p></details></div>`}

function me(){const url=location.href.split('#')[0]+'#share='+encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(shareData())))));
 app.innerHTML=`${window.meTop?meTop():''}<div class="card"><span class="kicker">My best moments</span><h2>My best moments</h2><p class="small muted">Read these before a big shoot. You've done it before!</p>
 ${S.best.length?S.best.map(e=>`<div class="list-item"><b>${e.total}</b> · ${e.round} · ${e.date} ${e.sample?'<span class="sample">sample</span>':''}<div class="small">${e.text}</div></div>`).join(''):'<p>Nothing saved yet. Tap "Save to my best moments" on a good day.</p>'}
 <label for="bm">Add a moment in your own words</label><textarea id="bm" rows="2" placeholder="e.g. Stayed calm in the shoot-off at Kalamunda"></textarea><button class="btn ghost" id="bmadd" style="margin-top:6px">Add</button></div>
 ${coachCards(url)}
 ${window.helpCards?helpCards():''}${window.otherAppsCard?otherAppsCard():''}<div class="card" id="settingscard"><span class="kicker">Settings</span><h2>Settings</h2><label for="sbside">Scroll bar side</label><select id="sbside"><option value="right" ${S.sbarSide!='left'?'selected':''}>Right (default)</option><option value="left" ${S.sbarSide=='left'?'selected':''}>Left</option></select><p class="small muted">Where the slim scroll bar sits on the scoring screen, so you can scroll without touching the target.</p><label class="small" style="display:flex;gap:6px;align-items:center;margin-top:10px;font-weight:600"><input type="checkbox" id="cbsafe" style="width:auto;margin:0" ${CB()?'checked':''}> Colour-blind safe colours</label><p class="small muted" id="privnote" style="margin-top:10px">We use Microsoft Clarity to see how the app is used (taps and scrolling) so we can improve it; typed details are hidden.</p></div>${testerCard()}<div class="card"><button class="btn ghost" id="rs">Reset my scores on this phone</button></div>`;bindTesterPicker(app);
 $('#bmadd').onclick=()=>{const t=$('#bm').value.trim();if(t){S.best.push({date:new Date().toISOString().slice(0,10),text:t,total:'⭐',round:'My note'});save();me()}};
 $('#cp').onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(url);$('#cp').textContent='Copied ✓'};
 bindCoachCards();
 {const cb=$('#cbsafe');if(cb)cb.onchange=()=>{S.cb=cb.checked;save();cbSync()}}
 $('#sbside').onchange=e=>{S.sbarSide=e.target.value=='left'?'left':'right';save();sbarSync()};
 if(window.bindOtherApps)bindOtherApps();$('#rs').onclick=()=>{if(confirm('Clear all of '+(TESTER?TESTER.short:'this')+'\'s scores on this phone?')){localStorage.removeItem(KEY);location.reload()}}}
/* last 10 sessions = the same complete shoots Stats uses (official results + app sessions), newest last */
function shareData(){const L=window.statShoots?statShoots().filter(x=>!x.inc):done().map(s=>({date:s.date,round:s.round,score:total(s),ends:s.ends}));return{n:S.profile,s:L.slice(-10).map(x=>[x.date,x.round,x.score,x.ends&&x.ends.length?x.ends.flat().length:(typeof roundArrows=='function'&&roundArrows(x.round))||0,0]),b:badges().filter(x=>x[2]).map(x=>x[1]),st:streak()}}
function renderShare(){$('#tabs').hidden=true;let D;try{D=JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(location.hash.slice(7))))))}catch(e){app.innerHTML='<div class="card">This share link is invalid.</div>';return}
 const real=findReal(D.n);
 let pv=null;try{pv=sessionStorage.getItem('scoretool.shprev')}catch(e){}app.innerHTML=`${pv?'<button class="btn ghost labback" id="shpvback" style="margin:0 0 8px">‹ Back</button>':''}<div class="card dark"><span class="kicker">Parent view · read only</span><h1>${D.n}</h1><div class="stats"><div class="stat"><b>${D.s.length}</b>sessions</div><div class="stat"><b>${D.st}</b>wk streak</div><div class="stat"><b>${D.s.reduce((t,x)=>t+x[3],0)}</b>arrows</div></div></div>
 <div class="card"><h3>Progress</h3>${lineChart([{name:'Session score',data:D.s.map(x=>x[2]),c:'#1d4ed8'}],{labels:D.s.map(x=>x[0].slice(5))})}${D.s.some(x=>x[4])?'<p class="small"><span class="sample">Includes sample data</span></p>':''}</div>
 <div class="card" id="sharelist"><h3>Last ${plN(D.s.length,'session','sessions')}</h3>${D.s.slice().reverse().map(x=>`<div class="list-item row"><span>${esc(x[1])}<br><span class="small muted">${esc(x[0])}</span></span><b>${x[2]}</b></div>`).join('')||'<p class="small muted">No sessions yet.</p>'}</div>
 ${real.length?`<div class="card"><h3>Official results</h3>${real.slice(-5).reverse().map(r=>`<div class="list-item"><b>${r.score}</b> · ${r.round} · ${r.date}</div>`).join('')}</div>`:''}
 
 <a class="btn full" href="${location.href.split('#')[0]}">Open my own ScoreTool</a>`
 /* the tester's own Preview gets a way back to where they came from (sweep 23 Oct); a parent opening the link sees no back */
 const bk=$('#shpvback');if(bk)bk.onclick=()=>{try{sessionStorage.removeItem('scoretool.shprev')}catch(e){}history.replaceState(null,'',location.href.split('#')[0]);$('#tabs').hidden=false;nav(pv)}}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href*="#share="]');if(a&&typeof view!='undefined'&&!location.hash.startsWith('#share=')){try{sessionStorage.setItem('scoretool.shprev',view)}catch(e){}}},true);
/* Real link-based sharing (23 Nov 2026): '#sheet=' opens a read-only view of one score sheet, redrawn by the
   same sheetCanvas() the PNG share uses, from data carried in the URL hash alone (no account, no server). */
function renderSheetLink(){$('#tabs').hidden=true;let D;try{D=JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(location.hash.slice(7))))))}catch(e){app.innerHTML='<div class="card">This link is invalid.</div>';return}
 let img='';try{const c=window.sheetCanvas(D);img=`<img src="${c.toDataURL('image/png')}" alt="Score sheet" style="width:100%;border-radius:12px;display:block">`}catch(e){img='<div class="card">This score sheet could not be shown.</div>'}
 app.innerHTML=`<div class="card dark"><span class="kicker">Score sheet · read only</span></div>${img}<a class="btn full" href="${location.href.split('#')[0]}" style="margin-top:10px">Open my own ScoreTool</a>`}

/* 31 Oct 2026: wait until every script on the page has run before the first draw. On a slow connection the results fetch could
   finish while later scripts (squads.js, lab.js...) were still loading, and the draw then failed with "Can't find variable: squad". */
Promise.all([loadReal(),document.readyState=='loading'?new Promise(r=>addEventListener('DOMContentLoaded',r,{once:true})):null]).then(()=>{nav(view);if(window.restoreAfterUpdate)restoreAfterUpdate()});
addEventListener('hashchange',()=>{const h=location.hash||'';if(h.startsWith('#share=')||h.startsWith('#coach')||h.startsWith('#sheet='))render();else nav(h=='#plot'?'score':'home')});

/* ---------- scoring screen scroll bar (custom, so it shows on iOS too) ----------
   Small blue square thumb on a thin track, inset from the screen edge. Its only job: scroll past the target without touching it.
   No feedback loop: geometry is read once at pointerdown; pointermove only stores the finger's Y; one requestAnimationFrame
   sets the page scroll and the thumb position from the same number. The scroll listener leaves the thumb alone while dragging. */
const SB={drag:null,raf:0,praf:0,TH:30};
function sbFrame(){SB.raf=0;const d=SB.drag;if(!d)return;const f=Math.max(0,Math.min(1,(d.y-d.off-d.top)/d.span)),y=Math.round(f*d.max);
 if(y!==d.last){d.last=y;scrollTo(0,y)}d.th.style.transform=`translateY(${(f*d.span).toFixed(1)}px)`}
function sbarSync(){let b=document.getElementById('sbar');const on=!!app.querySelector('.ad-pad');
 if(!b){b=document.createElement('div');b.id='sbar';b.setAttribute('role','scrollbar');b.setAttribute('aria-label','Scroll the scoring screen');b.setAttribute('aria-orientation','vertical');b.innerHTML='<div class="sb-track"></div><div class="sb-thumb"></div>';document.body.appendChild(b);
  const th=b.querySelector('.sb-thumb');
  b.onpointerdown=ev=>{ev.preventDefault();try{b.setPointerCapture(ev.pointerId)}catch(e){}
   const r=b.getBoundingClientRect(),max=Math.max(0,(window.__scroller?__scroller.scrollHeight-__scroller.clientHeight:document.documentElement.scrollHeight-innerHeight)),span=Math.max(1,r.height-SB.TH),thTop=r.top+(max?scrollY/max:0)*span;
   /* on the thumb: keep the grab point; on the track: centre the thumb under the finger (one jump) */
   const off=ev.clientY>=thTop&&ev.clientY<=thTop+SB.TH?ev.clientY-thTop:SB.TH/2;
   SB.drag={id:ev.pointerId,top:r.top,span,max,off,y:ev.clientY,th,last:Math.round(scrollY)};b.classList.add('on');if(!SB.raf)SB.raf=requestAnimationFrame(sbFrame)};
  b.onpointermove=ev=>{const d=SB.drag;if(!d||ev.pointerId!==d.id)return;ev.preventDefault();d.y=ev.clientY;if(!SB.raf)SB.raf=requestAnimationFrame(sbFrame)};
  b.onpointerup=b.onpointercancel=b.onlostpointercapture=ev=>{if(!SB.drag||ev.pointerId!==SB.drag.id)return;SB.drag=null;b.classList.remove('on');sbarPos()};
  addEventListener('scroll',sbarPos,{passive:true});addEventListener('resize',sbarSync);new MutationObserver(()=>sbarSync()).observe(app,{childList:true})}
 const left=S&&S.sbarSide=='left';b.hidden=!on;b.classList.toggle('left',left);document.body.classList.toggle('sbar-l',on&&left);document.body.classList.toggle('sbar-r',on&&!left);
 if(on&&!SB.drag){const hd=document.querySelector('header.top'),nv=document.querySelector('nav.tabs');b.style.top=((hd?hd.getBoundingClientRect().bottom:0)+10)+'px';b.style.bottom=((nv&&!nv.hidden?nv.getBoundingClientRect().height:0)+10)+'px';sbarPos()}}
/* thumb follows normal scrolling (finger, momentum, wheel) once per frame; never while the thumb is being dragged */
function sbarPos(){if(SB.drag||SB.praf)return;SB.praf=requestAnimationFrame(()=>{SB.praf=0;const b=document.getElementById('sbar');if(!b||b.hidden||SB.drag)return;const th=b.querySelector('.sb-thumb'),max=Math.max(0,(window.__scroller?__scroller.scrollHeight-__scroller.clientHeight:document.documentElement.scrollHeight-innerHeight)),span=Math.max(0,b.clientHeight-SB.TH),f=max?Math.min(1,scrollY/max):0;
 th.style.transform=`translateY(${(f*span).toFixed(1)}px)`;b.classList.toggle('idle',!max);b.setAttribute('aria-valuenow',Math.round(f*100))})}
sbarSync();

/* ---------- Coaches and parents (Me tab) ----------
   Demo only, everything lives in this phone's localStorage like the rest of the tester data. There is no server yet, so:
   - coach invites are seeded here for the demo (a real invite would come from the coach's app through a backend),
   - Accept / Decline / Remove only change this phone,
   - the coach view link opens a landing page; the real view needs a coach membership and the coach app (later build).
   No coach invite is seeded. */
const COACH_SEED={id:'none',coach:'',squad:'',sent:'',for:[]}; /* 25 Nov 2026: no seeded coach invite */
function seedCoach(){S.coachInvites=S.coachInvites||[];S.coaches=S.coaches||[];
 if(S.coachSeeded==COACH_SEED.id)return;S.coachSeeded=COACH_SEED.id;
 if(TESTER&&COACH_SEED.for.includes(TESTER.id)&&!S.coaches.some(c=>c.id==COACH_SEED.id))S.coachInvites.push({id:COACH_SEED.id,coach:COACH_SEED.coach,squad:COACH_SEED.squad,sent:COACH_SEED.sent});save()}
const coachLink=()=>location.origin+location.pathname+'#coach='+encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify({n:S.profile,t:TESTER?TESTER.id:''})))));
/* 25 Nov 2026 (Nathe): the coach option is hidden for now (My coaches card, coach link, coach sign-in page). Code kept; set true to bring it back. */
const COACH_ON=false;
function coachCards(url){seedCoach();const I=S.coachInvites,C=S.coaches;
 return`${COACH_ON?`<div class="card" id="coachcard"><span class="kicker">Coach</span><h2>My coaches</h2>
 <h3>Coach invites</h3>${I.length?I.map(x=>`<div class="list-item"><b>${esc(x.coach)}</b> invited you to <b>${esc(x.squad)}</b><div class="small muted">Sent ${esc(x.sent)}. If you accept, they can see your scores and stats. They can't change anything.</div><div style="display:flex;gap:6px;margin-top:6px"><button class="btn" data-ciacc="${esc(x.id)}">Accept</button><button class="btn ghost" data-cidec="${esc(x.id)}">Decline</button></div></div>`).join(''):'<p class="small muted" id="noinv">No invites right now. When a coach invites you to their squad, it shows up here.</p>'}
 <h3 style="margin-top:14px">Coaches who can see my scores</h3>${C.length?C.map(c=>`<div class="list-item row"><span><b>${esc(c.coach)}</b><br><span class="small muted">${esc(c.squad)} · since ${esc(c.since)}</span></span><button class="btn ghost" data-crm="${esc(c.id)}" style="padding:6px 12px;min-height:36px">Remove</button></div>`).join(''):'<p class="small muted" id="nocoach">No coaches yet.</p>'}
 <h3 style="margin-top:14px">Coach view link</h3><p class="small">Coaches with a ScoreTool coach membership can open this link for a view-only look at your scores and stats.</p><input readonly value="${coachLink()}" id="clink" aria-label="coach view link"><button class="btn ghost" id="clcp" style="margin-top:6px">Copy coach link</button></div>`:''}
 <div class="card" id="parentcard"><span class="kicker">Parent</span><h2>Share with a parent</h2><p class="small">A view-only link for a parent. It shows your last 10 sessions, streak and badges as they are right now. They can't change anything. Copy a new link any time to update it.</p><input readonly value="${url}" id="sh" aria-label="parent share link"><button class="btn ghost" id="cp" style="margin-top:6px">Copy link</button> <a class="btn ghost" href="${url}" style="margin-top:6px">Preview</a></div>`}
function bindCoachCards(){const find=(L,id)=>L.findIndex(x=>x.id==id);
 app.querySelectorAll('[data-ciacc]').forEach(b=>b.onclick=()=>{const i=find(S.coachInvites,b.dataset.ciacc);if(i<0)return;const x=S.coachInvites.splice(i,1)[0];S.coaches.push({id:x.id,coach:x.coach,squad:x.squad,since:today()});save();me()});
 app.querySelectorAll('[data-cidec]').forEach(b=>b.onclick=()=>{const i=find(S.coachInvites,b.dataset.cidec);if(i<0)return;S.coachInvites.splice(i,1);save();me()});
 app.querySelectorAll('[data-crm]').forEach(b=>b.onclick=()=>{const i=find(S.coaches,b.dataset.crm);if(i<0)return;if(!confirm(`Remove ${S.coaches[i].coach}? They won't see your scores any more.`))return;S.coaches.splice(i,1);save();me()});
 const cl=$('#clcp');if(cl)cl.onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText($('#clink').value);cl.textContent='Copied'}}
function renderCoachLanding(){$('#tabs').hidden=true;let D=null;try{D=JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(location.hash.slice(7))))))}catch(e){}
 if(!D||!D.n){app.innerHTML='<div class="card">This coach link is invalid.</div>';return}
 app.innerHTML=`<div class="card dark" id="coachlanding"><span class="kicker">Coach view · view only</span><h1>${esc(D.n)}</h1><p>This link is for coaches. It opens a view-only look at ${esc(D.n.split(' ')[0])}'s scores and stats.</p></div>
 <div class="card"><h2>You need a coach membership</h2><p>Sign in with a ScoreTool coach membership to see this archer. Coaches will see full score stats for their squad. They can't change anything.</p><p class="small muted">Coach memberships and the coach view are coming soon. Nothing about this archer is shown until then.</p><button class="btn" disabled>Coach sign-in (coming soon)</button></div>`}

/* Hide the tab bar while a text field has the on-screen keyboard up (touch screens only), so it never sits on top of the keyboard. */
(function(){const touch=matchMedia('(pointer:coarse)').matches;if(!touch)return;const isField=el=>el&&(/^(INPUT|TEXTAREA)$/.test(el.tagName)&&!/^(checkbox|radio|button|submit|range|color|file)$/i.test(el.type||'')||el.isContentEditable);
 document.addEventListener('focusin',e=>{if(isField(e.target))document.body.classList.add('kb-open')});
 document.addEventListener('focusout',()=>setTimeout(()=>{if(!isField(document.activeElement))document.body.classList.remove('kb-open')},60))})();
