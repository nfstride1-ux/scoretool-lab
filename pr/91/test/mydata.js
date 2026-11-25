/* Import my data (25 Nov 2026, Nathe: option (b)). An archer's own official scoresheets, results, ABA sheets and sight marks are
   no longer shipped with the app. Nathe sends each archer their own file directly; the archer picks it here (Tools > Import my data).
   The file is read on this phone only (no upload, no network) and kept in this phone's storage under scoretool.mydata.<profile id>.
   The screens that used to read the shipped files (Scorecards, Best, Ranks, sight marks) read the same shapes from here instead.
   Importing again never wipes or duplicates anything already on the phone. Nothing in this file names or describes any person. */
(function(){
const PID=()=>(typeof TESTER!='undefined'&&TESTER)?TESTER.id:null;
const MKEY=id=>'scoretool.mydata.'+id,LKEY=id=>'scoretool.mydata.last.'+id;
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
let MD=PID()?read(MKEY(PID())):null;
window.myData=()=>MD;
/* Results already saved on this phone by the old Tools > My results source page (removed 25 Nov 2026, Nathe t1165u):
   pasted or CSV rows (scoretool.imported.<profile>) and typed official results (scoretool.official.<profile>).
   Nothing new is written to these keys; they are only read so those results keep showing in PBs, Stats and the calendar. */
const OWHO=()=>(typeof TESTER!='undefined'&&TESTER&&TESTER.id)||'guest';
const IKEY=()=>'scoretool.imported.'+OWHO(),OKEY=()=>'scoretool.official.'+OWHO();
function imports(){const a=read(IKEY());return Array.isArray(a)?a:[]}
window.importedShoots=function(){return imports().filter(r=>r&&r.imported&&r.date&&r.round&&r.score>0).map(r=>({
 id:r.id,date:r.date,round:r.round,score:+r.score,ends:[],dists:[],flagged:0,src:'imported',inc:false,
 event:r.event||'',club:'',rating:null,url:'',field:/field/i.test(r.round)||/field/i.test(r.discipline||''),imported:true,
 division:r.division||'',discipline:r.discipline||'',diary:!!r.diary}))};
function officials(){const a=read(OKEY());return Array.isArray(a)?a:[]}
/* C4: a finished official round the archer typed in. Not a scored session, so it cannot replace one. */
window.officialAdded=function(){return officials().filter(r=>r&&r.official&&r.finished&&r.date&&r.round&&r.score>0).map(r=>({
 id:r.id,date:r.date,round:r.round,score:+r.score,max:r.max>0?+r.max:null,tens:r.tens===0||r.tens>0?+r.tens:null,xs:r.xs===0||r.xs>0?+r.xs:null,
 ends:Array.isArray(r.ends)?r.ends:[],event:r.event||'',official:true,finished:true,src:'official'}))};

window.myDataHas=k=>!!(MD&&MD[k]&&(k!='sheets'||(Array.isArray(MD.sheets.sheets)&&MD.sheets.sheets.length)));
/* a profile with imported sheets loads them like the old built-in profiles did */
if(MD&&typeof TESTER!='undefined'&&TESTER&&myDataHas('sheets')){TESTER.data=true;if(MD.bow)TESTER.bow=MD.bow}
/* the old file addresses are answered from this phone's own copy; without one they are simply not there (no network request) */
const _fetch=window.fetch.bind(window);
const local=p=>{if(/\/data\/(my_scoresheets|sheets_[\w-]+)\.json$/.test(p))return myDataHas('sheets')?['application/json',JSON.stringify(MD.sheets)]:null;
 if(/\/data\/(nathe_ad|ad_[\w-]+)\.json$/.test(p))return myDataHas('ad')?['application/json',JSON.stringify(MD.ad)]:null;
 if(/\/data\/archer_scores\.csv$/.test(p))return MD&&typeof MD.scoresCsv=='string'&&MD.scoresCsv?['text/csv',MD.scoresCsv]:null;
 return undefined};
window.fetch=function(input,init){try{const u=new URL(typeof input=='string'?input:input.url,location.href);
  if(u.origin==location.origin){const r=local(u.pathname);if(r!==undefined)return Promise.resolve(r?new Response(r[1],{status:200,headers:{'content-type':r[0]}}):new Response('',{status:404}))}}catch(e){}
 return _fetch(input,init)};

/* ---------- validate + merge ---------- */
const MAX=4e6;
function check(j){if(!j||typeof j!='object')return'That file is not a ScoreTool data file.';
 if(j.app!=='ScoreTool'||j.kind!=='mydata')return'That file is not a ScoreTool "my data" file.';
 if(j.format!==1)return'This file was made for a newer ScoreTool. Update the app and try again.';
 if(j.sheets!=null&&!(typeof j.sheets=='object'&&Array.isArray(j.sheets.sheets)))return'The scoresheets in this file look damaged.';
 if(j.ad!=null&&typeof j.ad!='object')return'The official results in this file look damaged.';
 if(j.scoresCsv!=null&&typeof j.scoresCsv!='string')return'The results list in this file looks damaged.';
 if(j.sessions!=null&&!Array.isArray(j.sessions))return'The saved shoots in this file look damaged.';
 if(j.sight!=null&&!(typeof j.sight=='object'&&j.sight.marks&&typeof j.sight.marks=='object'))return'The sight marks in this file look damaged.';
 if(!j.sheets&&!j.ad&&!j.scoresCsv&&!j.sessions&&!j.sight)return'This file has nothing to import.';
 return''}
const shKey=s=>[s.d,s.rd,s.ev,s.sc,s.div,s.url].join('|');
function merge(old,j){const M=old?JSON.parse(JSON.stringify(old)):{},R={sheets:[0,0],ad:'',rows:[0,0],sessions:[0,0],sight:''};
 if(j.sheets){const cur=M.sheets&&Array.isArray(M.sheets.sheets)?M.sheets:{...j.sheets,sheets:[]};const have=new Set(cur.sheets.map(shKey));
  j.sheets.sheets.forEach(s=>{if(!s||typeof s!='object')return;const k=shKey(s);if(have.has(k)){R.sheets[1]++;return}have.add(k);cur.sheets.push(s);R.sheets[0]++});
  ['archer','source','fetched'].forEach(k=>{if(j.sheets[k]!=null&&(!cur.fetched||String(j.sheets.fetched||'')>=String(cur.fetched||'')))cur[k]=j.sheets[k]});M.sheets=cur}
 if(j.ad){if(!M.ad||String(j.ad.generated||'')>String(M.ad.generated||'')){R.ad=M.ad?'updated':'added';M.ad=j.ad}else R.ad='already there'}
 if(j.scoresCsv){const L=j.scoresCsv.split(/\r?\n/).filter(Boolean);const O=(M.scoresCsv||'').split(/\r?\n/).filter(Boolean);
  const head=O[0]||L[0],have=new Set(O.slice(1));const out=[head,...O.slice(1)];L.slice(1).forEach(l=>{if(have.has(l)){R.rows[1]++;return}have.add(l);out.push(l);R.rows[0]++});M.scoresCsv=out.join('\n')}
 if(j.sessions)M.sessions=j.sessions;
 if(j.sight)M.sight=j.sight;
 ['bow','name'].forEach(k=>{if(j[k])M[k]=j[k]});M.imported=new Date().toISOString();return{M,R}}
/* shoots: added to this profile's own list by id, never replacing one already there */
function addSessions(L,R){if(!Array.isArray(L)||typeof S=='undefined'||!S)return;S.sessions=S.sessions||[];
 L.forEach(x=>{if(!x||!x.id||!Array.isArray(x.ends))return;if(S.sessions.some(y=>y.id==x.id)){R.sessions[1]++;return}S.sessions.push(JSON.parse(JSON.stringify(x)));R.sessions[0]++})}
/* sight marks: onto the archer's EXISTING bow of that name (never creates a bow), as a new arrow set; a set that already has marks is left alone */
const norm=x=>String(x||'').toLowerCase().replace(/\s+/g,'');
function addSight(G,R){if(!G||typeof S=='undefined'||!S||!S.profile){if(R)R.sight='waiting for a profile';return false}
 const me=S.profile,b=(S.bows||[]).find(x=>x.archer==me&&norm(x.name)==norm(G.bow));
 if(!b){if(R)R.sight='bow "'+G.bow+'" not found on this phone yet (add it in My archery, then open Import my data again)';return false}
 const sets=S.arrowSets||[],ex=sets.find(a=>a.archer==me&&norm(a.name)==norm(G.set));
 const has=a=>{const m=a.id=='arrows1'?(b.marks||{}):((b.setMarks||{})[a.id]||{});return Object.keys(m).some(d=>m[d]&&(m[d].v||m[d].h))};
 if(ex&&(ex.id=='arrows1'||has(ex))){if(R)R.sight='already there';return true}
 let a=ex;if(!a){a={id:(typeof G.id=='string'&&G.id)||'as-imp-'+norm(G.set).replace(/[^a-z0-9]/g,'')+'-'+Date.now().toString(36),archer:me,name:G.set,src:G.src||'Imported'};S.arrowSets=sets;sets.push(a)}
 const m={};for(const d in G.marks){const v=G.marks[d];m[d]=typeof v=='object'?v:{v:String(v)}}b.setMarks=b.setMarks||{};b.setMarks[a.id]=m;if(R)R.sight=Object.keys(m).length+' marks added to '+G.set+' on '+b.name;return true}
/* a file imported before the bow existed: try the sight marks again on the next opens */
function retrySight(){try{if(!MD||!MD.sight||MD.sightDone||typeof S=='undefined'||!S)return;if(addSight(MD.sight,null)){save();MD.sightDone=1;localStorage.setItem(MKEY(PID()),JSON.stringify(MD))}}catch(e){}}
addEventListener('load',()=>setTimeout(retrySight,500));

/* ---------- screen (Tools > Import my data) ---------- */
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function summary(R){const p=[];if(R.sheets[0]||R.sheets[1])p.push(`Official scoresheets: ${R.sheets[0]} added${R.sheets[1]?`, ${R.sheets[1]} already there`:''}`);
 if(R.ad)p.push('Official results and rankings: '+R.ad);if(R.rows[0]||R.rows[1])p.push(`Results list: ${R.rows[0]} added${R.rows[1]?`, ${R.rows[1]} already there`:''}`);
 if(R.sessions[0]||R.sessions[1])p.push(`Saved shoots: ${R.sessions[0]} added${R.sessions[1]?`, ${R.sessions[1]} already there`:''}`);if(R.sight)p.push('Sight marks: '+R.sight);return p}
/* registered by lab.js (rewards.js replaces the views object after this file runs) */
window.MYDATA_VIEW=function(){const id=PID(),last=id?read(LKEY(id)):null;
 app.innerHTML=`<div class="labbar"><button class="btn ghost labback" data-go="tools">‹ Tools</button><h1>Import my data</h1></div>
 <div class="card" id="mydatacard"><p class="small">Open the file you were sent (it ends in <b>.json</b>). It brings back your own official scoresheets, results, PBs and sight marks on this phone.</p>
 <p class="small muted">The file is read on this phone only. It isn't uploaded anywhere. Scores already on this phone are kept, and importing the same file again adds nothing twice.</p>
 ${id?`<input type="file" id="mdfile" accept=".json,application/json" aria-label="Choose your data file"><p class="small" id="mdmsg" role="status" style="font-weight:600"></p>`:`<p class="small">Create your profile first, then come back here.</p>`}
 ${last?`<div class="card" id="mdlast"><span class="kicker">Last import</span><p class="small muted">${h(new Date(last.at).toLocaleString())}</p><ul class="small">${last.lines.map(l=>`<li>${h(l)}</li>`).join('')}</ul></div>`:''}</div>`;
 app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>nav(b.dataset.go));
 const f=document.getElementById('mdfile');if(!f)return;const msg=document.getElementById('mdmsg');
 f.onchange=()=>{const file=f.files&&f.files[0];if(!file)return;if(file.size>MAX){msg.textContent='That file is too big to be a ScoreTool data file.';return}
  const rd=new FileReader();rd.onerror=()=>{msg.textContent='Could not read that file.'};
  rd.onload=()=>{let j;try{j=JSON.parse(rd.result)}catch(e){msg.textContent='That file is not a ScoreTool data file.';return}
   const bad=check(j);if(bad){msg.textContent=bad;return}
   const {M,R}=merge(MD,j);
   try{addSessions(j.sessions,R);if(j.sight&&addSight(j.sight,R))M.sightDone=1;if(typeof save=='function')save();
    localStorage.setItem(MKEY(id),JSON.stringify(M))}catch(e){msg.textContent='There is not enough room on this phone to import that file. Nothing was changed.';return}
   MD=M;const lines=summary(R);localStorage.setItem(LKEY(id),JSON.stringify({at:new Date().toISOString(),lines}));
   msg.textContent='Imported. Opening it now…';setTimeout(()=>{const u=new URL(location.href);u.searchParams.set('p','lab_mydata');location.replace(u.toString())},900)};
  rd.readAsText(file)}};
})();
