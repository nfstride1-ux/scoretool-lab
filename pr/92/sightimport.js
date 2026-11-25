/* Import sight marks (23 Oct 2026, Nathe). Setups & sight marks > Import sight marks: paste text (one distance and mark per
   line), or load a PDF, CSV or text file with range and mark columns. Everything is read on the phone (works offline, nothing is
   uploaded). A preview shows every row before anything is saved, into the bow setup and arrow set picked on the import screen.
   Default: only empty marks are filled and the archer's own marks are kept. "Replace existing marks" is a separate choice and
   asks before it overwrites anything. Marks are stored exactly as written (text, no rounding). */
(function(){
const NUM=/^[+-]?\d+(?:\.\d+)?$/;
/* ---------- text / CSV ---------- */
function unitOf(u){u=(u||'').toLowerCase();return /^(y|yd|yds|yard|yards)$/.test(u)?'yd':'m'}
function distKey(n,u){const v=parseFloat(n);if(!(v>0)||v>300)return null;return String(+v)+unitOf(u)}
/* CSV cells. A line with ; or a tab is split on those only, so a comma there is a decimal comma (18,5 = 18.5, as spreadsheets set to a
   comma-decimal region save it). A comma line splits on commas outside quotes; a quoted "18,5" is a decimal comma too. */
function splitCSV(line){const semi=/[;\t]/.test(line),out=[];let cur='',q=false,wq=false;
 const push=()=>{let x=cur.trim();if((semi||wq)&&/^[+-]?\d+,\d+$/.test(x))x=x.replace(',','.');out.push(x);cur='';wq=false};
 for(const ch of line){if(ch=='"'){q=!q;wq=true;continue}if(!q&&(semi?(ch==';'||ch=='\t'):ch==',')){push();continue}cur+=ch}
 push();return out}
/* one line -> [[dist,v,h?],...]. Lines that start with a word (headings, "Sight Height 3.93in", "Mark 1 38.15") are skipped. */
function parseLine(line){
 line=line.replace(/\u00a0/g,' ').trim();if(!line)return[];
 if(/[,;\t]/.test(line)){ /* CSV / spreadsheet: distance, vertical, horizontal (empty cells kept in place) */
  const c=splitCSV(line);
  const m0=c[0].match(/^(\d+(?:\.\d+)?)\s*(m|y|yd|yds|yards?|metres?|meters?)?$/i);if(!m0)return[];
  if(c.length>=4&&c.every((x,i)=>i%2?NUM.test(x):/^\d+(?:\.\d+)?\s*(m|yd)?$/i.test(x)))return pairs(c); /* several columns of pairs */
  const v=c[1]||'',h=c[2]||'';if(v&&!NUM.test(v))return[];if(h&&!NUM.test(h))return[];if(!v&&!h)return[];
  return[[distKey(m0[1],m0[2]),v,h]]}
 /* text: leading run of numbers; "18m", "18 m" and "18:" all mean the distance */
 const t=line.replace(/(\d)\s*(m|yd|yds|y|metres?|meters?|yards?)\b\.?/gi,'$1$2').split(/[\s:=|]+/).filter(Boolean),run=[];
 for(const x of t){if(/^\d+(?:\.\d+)?(m|yd|yds|y|metres?|meters?|yards?)?$/i.test(x)||NUM.test(x))run.push(x);else break}
 if(run.length<2)return[];
 if(run.length==3&&!/[a-z]/i.test(run[1])&&!/[a-z]/i.test(run[2]))return[[dk(run[0]),run[1],run[2]]];
 return pairs(run)}
function dk(x){const m=String(x).match(/^(\d+(?:\.\d+)?)([a-z]*)$/i);return m?distKey(m[1],m[2]):null}
function pairs(a){const o=[];for(let i=0;i+1<a.length;i+=2){if(!NUM.test(a[i+1]))break;o.push([dk(a[i]),a[i+1],''])}return o}
function parseText(txt){const rows={},notes=[];let skipped=0;
 for(const line of String(txt||'').split(/\r?\n/)){const r=parseLine(line);if(!r.length){if(/\d/.test(line)&&!/^[^\d]*$/.test(line))skipped++;continue}
  for(const [d,v,h] of r){if(!d){skipped++;continue}if(rows[d])notes.push(`${d} was listed twice; the last one is used.`);rows[d]={v:v||'',h:h||''}}}
 return{rows,notes,skipped}}
/* ---------- PDF (small offline text reader: enough for sight mark sheets made on a phone: range and mark columns) ---------- */
async function inflate(bytes){const ds=new DecompressionStream('deflate');const s=new Blob([bytes]).stream().pipeThrough(ds);return new Uint8Array(await new Response(s).arrayBuffer())}
const L1=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return s};
async function pdfObjects(buf){const u=new Uint8Array(buf),s=L1(u),objs={},re=/(\d+)\s+0\s+obj\b/g;let m;const starts=[];
 while((m=re.exec(s)))starts.push([+m[1],m.index+m[0].length]);
 for(let i=0;i<starts.length;i++){const [n,st]=starts[i],end=s.indexOf('endobj',st);if(end<0)continue;const body=s.slice(st,end);
  const k=body.search(/stream\r?\n/);let dict=body,data=null;
  if(k>=0){dict=body.slice(0,k);const ds=st+k+body.slice(k).match(/stream\r?\n/)[0].length,de=s.lastIndexOf('endstream',end);let raw=u.subarray(ds,de);
   if(/\/FlateDecode/.test(dict)){try{raw=await inflate(raw)}catch(e){try{raw=await inflate(raw.subarray(0,raw.length-1))}catch(e2){raw=null}}}else if(/\/Filter/.test(dict))raw=null;
   data=raw?L1(raw):null}
  objs[n]={dict,data}}
 return objs}
const ref=(d,k)=>{const m=d.match(new RegExp('/'+k+'\\s+(\\d+)\\s+0\\s+R'));return m?+m[1]:null};
function subDict(d,k,objs){const r=ref(d,k);if(r!=null&&objs[r])return objs[r].dict;const i=d.indexOf('/'+k);if(i<0)return'';const j=d.indexOf('<<',i);if(j<0)return'';let depth=0;for(let p=j;p<d.length-1;p++){if(d.substr(p,2)=='<<'){depth++;p++}else if(d.substr(p,2)=='>>'){depth--;p++;if(!depth)return d.slice(j,p+1)}}return''}
function names(d){const o={},re=/\/([\w.+-]+)\s+(\d+)\s+0\s+R/g;let m;while((m=re.exec(d)))o[m[1]]=+m[2];return o}
function cmap(txt){const map={};let bytes=1;const cs=txt.match(/begincodespacerange\s*<([0-9a-f]+)>/i);if(cs)bytes=cs[1].length/2;
 const hx=h=>{let s='';for(let i=0;i<h.length;i+=4)s+=String.fromCharCode(parseInt(h.substr(i,4),16));return s};
 for(const blk of txt.split('beginbfchar').slice(1)){const b=blk.split('endbfchar')[0],re=/<([0-9a-f]+)>\s*<([0-9a-f]+)>/gi;let m;while((m=re.exec(b)))map[parseInt(m[1],16)]=hx(m[2])}
 for(const blk of txt.split('beginbfrange').slice(1)){const b=blk.split('endbfrange')[0],re=/<([0-9a-f]+)>\s*<([0-9a-f]+)>\s*(<([0-9a-f]+)>|\[([^\]]*)\])/gi;let m;
  while((m=re.exec(b))){const a=parseInt(m[1],16),z=parseInt(m[2],16);if(m[4]){const base=parseInt(m[4],16);for(let c=a;c<=z;c++)map[c]=String.fromCharCode(base+c-a)}else{const L=m[5].match(/<([0-9a-f]+)>/gi)||[];for(let c=a;c<=z;c++)if(L[c-a])map[c]=hx(L[c-a].slice(1,-1))}}}
 return{map,bytes}}
function fontsOf(res,objs){const F={},fd=subDict(res,'Font',objs);for(const [k,n] of Object.entries(names(fd))){const o=objs[n];if(!o)continue;const tu=ref(o.dict,'ToUnicode');
 const fc=+((o.dict.match(/\/FirstChar\s+(\d+)/)||[])[1]||0),w=((o.dict.match(/\/Widths\s*\[([^\]]*)\]/)||[])[1]||'').trim().split(/\s+/).map(Number);
 F[k]={cm:tu!=null&&objs[tu]&&objs[tu].data?cmap(objs[tu].data):null,fc,w}}return F}
function lex(s){const T=[];let i=0;const n=s.length;
 while(i<n){const c=s[i];
  if(/\s/.test(c)){i++;continue}
  if(c=='%'){while(i<n&&s[i]!='\n'&&s[i]!='\r')i++;continue}
  if(c=='('){let d=1,o='';i++;while(i<n&&d){let ch=s[i];if(ch=='\\'){const e=s[i+1];i+=2;if(/[0-7]/.test(e)){let oc=e;while(oc.length<3&&/[0-7]/.test(s[i]))oc+=s[i++];o+=String.fromCharCode(parseInt(oc,8))}else if(e=='\r'||e=='\n'){if(e=='\r'&&s[i]=='\n')i++}else o+=({n:'\n',r:'\r',t:'\t',b:'\b',f:'\f'})[e]||e;continue}
   if(ch=='(')d++;else if(ch==')'){d--;if(!d){i++;break}}o+=ch;i++}T.push({s:o});continue}
  if(c=='<'&&s[i+1]!='<'){const j=s.indexOf('>',i);let h=s.slice(i+1,j).replace(/\s/g,'');if(h.length%2)h+='0';let o='';for(let k=0;k<h.length;k+=2)o+=String.fromCharCode(parseInt(h.substr(k,2),16));T.push({s:o});i=j+1;continue}
  if(c=='['||c==']'){T.push({op:c});i++;continue}
  if(c=='<'||c=='>'){T.push({op:s.substr(i,2)});i+=2;continue}
  if(c=='/'){let j=i+1;while(j<n&&!/[\s\/\[\]()<>{}%]/.test(s[j]))j++;T.push({name:s.slice(i+1,j)});i=j;continue}
  let j=i;while(j<n&&!/[\s\/\[\]()<>{}%]/.test(s[j]))j++;if(j==i)j++;const w=s.slice(i,j);i=j;
  if(/^[+-]?(\d+\.?\d*|\.\d+)$/.test(w))T.push({n:+w});else T.push({op:w})}
 return T}
const mul=(a,b)=>[a[0]*b[0]+a[1]*b[2],a[0]*b[1]+a[1]*b[3],a[2]*b[0]+a[3]*b[2],a[2]*b[1]+a[3]*b[3],a[4]*b[0]+a[5]*b[2]+b[4],a[4]*b[1]+a[5]*b[3]+b[5]];
function runContent(src,res,objs,ctm0,out,depth){if(depth>6)return;const F=fontsOf(res,objs),X=names(subDict(res,'XObject',objs));
 const T=lex(src);let st=[],ctm=ctm0.slice(),tm=[1,0,0,1,0,0],tlm=tm,font=null,fs=1,tl=0,args=[],arr=null;
 const show=items=>{let txt='',adv=0;const f=F[font]||{};const start=mul([fs,0,0,fs,0,0],mul(tm,ctm));
  for(const it of items){if(typeof it=='number'){if(it<-250)txt+=' ';adv-=it/1000*fs;continue}
   const by=f.cm?f.cm.bytes:1;for(let k=0;k<it.length;k+=by){let code=it.charCodeAt(k);if(by==2)code=code*256+it.charCodeAt(k+1);
    txt+=f.cm&&f.cm.map[code]!=null?f.cm.map[code]:String.fromCharCode(code);const w=f.w&&f.w[code-f.fc];adv+=((w||500)/1000)*fs}}
  out.push({x:start[4],y:start[5],h:Math.hypot(start[2],start[3])||1,t:txt});tm=mul([1,0,0,1,adv,0],tm)};
 for(const t of T){
  if(t.op=='['){arr=[];continue}if(t.op==']'){args.push(arr);arr=null;continue}
  if(arr){if(t.s!=null)arr.push(t.s);else if(t.n!=null)arr.push(t.n);continue}
  if(t.op==null||t.op=='<<'||t.op=='>>'){args.push(t.s??t.n??t.name);continue}
  const a=args;args=[];
  switch(t.op){
   case'q':st.push(ctm);break;case'Q':ctm=st.pop()||ctm0.slice();break;
   case'cm':if(a.length>=6)ctm=mul(a.slice(-6),ctm);break;
   case'BT':tm=tlm=[1,0,0,1,0,0];break;
   case'Tm':if(a.length>=6)tm=tlm=a.slice(-6);break;
   case'Td':tm=tlm=mul([1,0,0,1,a[0]||0,a[1]||0],tlm);break;
   case'TD':tl=-(a[1]||0);tm=tlm=mul([1,0,0,1,a[0]||0,a[1]||0],tlm);break;
   case'TL':tl=a[0]||0;break;
   case'T*':tm=tlm=mul([1,0,0,1,0,-tl],tlm);break;
   case'Tf':font=a[0];fs=a[1]||1;break;
   case'Tj':if(a[0]!=null)show([a[0]]);break;
   case"'":tm=tlm=mul([1,0,0,1,0,-tl],tlm);show([a[0]]);break;
   case'"':tm=tlm=mul([1,0,0,1,0,-tl],tlm);show([a[2]]);break;
   case'TJ':if(Array.isArray(a[0]))show(a[0]);break;
   case'Do':{const o=objs[X[a[0]]];if(o&&o.data&&/\/Subtype\s*\/Form/.test(o.dict)){const mm=o.dict.match(/\/Matrix\s*\[([^\]]*)\]/);const M=mm?mm[1].trim().split(/\s+/).map(Number):[1,0,0,1,0,0];
     runContent(o.data,subDict(o.dict,'Resources',objs)||res,objs,mul(M,ctm),out,depth+1)}break}
  }}}
async function pdfText(buf){const objs=await pdfObjects(buf),pages=Object.entries(objs).filter(([n,o])=>/\/Type\s*\/Page\b/.test(o.dict)&&!/\/Type\s*\/Pages/.test(o.dict));if(!pages.length)throw new Error('no pages');
 const lines=[];
 for(const [n,pg] of pages.sort((a,b)=>a[0]-b[0])){const res=subDict(pg.dict,'Resources',objs);const cm=pg.dict.match(/\/Contents\s*(\[[^\]]*\]|\d+\s+0\s+R)/);if(!cm)continue;
  const ids=[...cm[1].matchAll(/(\d+)\s+0\s+R/g)].map(m=>+m[1]);const src=ids.map(i=>(objs[i]&&objs[i].data)||'').join('\n');const out=[];runContent(src,res,objs,[1,0,0,1,0,0],out,0);
  const R=out.filter(r=>r.t.trim()).sort((a,b)=>b.y-a.y||a.x-b.x),G=[];
  for(const r of R){const g=G.find(g=>Math.abs(g.y-r.y)<Math.max(2,r.h*0.4));if(g)g.r.push(r);else G.push({y:r.y,r:[r]})}
  G.sort((a,b)=>b.y-a.y).forEach(g=>lines.push(g.r.sort((a,b)=>a.x-b.x).map(r=>r.t.trim()).join('   ')))}
 return lines.join('\n')}
window.sightImportParse=parseText;window.sightImportPdfText=pdfText;
/* ---------- screen ---------- */
let st=null;
function close(){const d=document.getElementById('simpov');if(d)d.remove();removeEventListener('keydown',onKey);if(typeof gearRedraw=='function')gearRedraw()}
function onKey(e){if(e.key=='Escape')close()}
function marksFor(b,a){return typeof peekMarks=='function'?peekMarks(b,a):{}}
function sortD(L){return L.sort((a,c)=>parseFloat(a)-parseFloat(c)||a.localeCompare(c))}
function plan(){const b=myBows().find(x=>x.id==st.bow),a=mySets().find(x=>x.id==st.set),M=b?marksFor(b,a):{},rows=[];let fill=0,rep=0,same=0,kept=0;
 for(const d of sortD(Object.keys(st.rows))){const n=st.rows[d],o=M[d]||{};const r={d,ov:o.v||'',oh:o.h||'',nv:n.v,nh:n.h,act:[]};
  for(const k of['v','h']){const nv=n[k],ov=o[k]||'';if(!nv)continue;if(!ov){r.act.push([k,'fill']);fill++}else if(ov==nv){same++}else if(st.replace){r.act.push([k,'replace']);rep++}else kept++}
  rows.push(r)}
 return{b,a,rows,fill,rep,same,kept}}
function draw(){const d=document.getElementById('simpov');if(!d)return;const B=myBows(),A=mySets(),P=st.rows?plan():null;
 d.querySelector('.calov-in').innerHTML=`<button class="btn ghost labback calback" id="simpback" type="button">\u2039 Sight marks</button>
 <span class="kicker">Gear</span><h2>Import sight marks</h2>
 <p class="small muted" style="margin:0 0 8px">Paste your marks, or load a PDF or CSV with range and mark columns. It is read on this phone and works offline. Nothing is saved until you check the preview and tap Save.</p>
 <label for="simpbow">Bow setup</label><select id="simpbow">${B.map(x=>`<option value="${esc(x.id)}" ${x.id==st.bow?'selected':''}>${esc(x.name)}</option>`).join('')}</select>
 <label for="simpset" style="margin-top:8px">Arrow set</label><select id="simpset">${A.map(x=>`<option value="${esc(x.id)}" ${x.id==st.set?'selected':''}>${esc(x.name)}</option>`).join('')}<option value="__new">+ New arrow set</option></select>
 <label for="simptxt" style="margin-top:10px">Paste marks</label>
 <textarea id="simptxt" rows="6" style="width:100%;font:inherit;box-sizing:border-box" placeholder="One per line: distance, vertical mark (horizontal optional)&#10;18m 32.35&#10;20, 33.10, 1.5">${esc(st.text||'')}</textarea>
 <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn" id="simpread" type="button">Read pasted marks</button>
 <label class="btn ghost" for="simpfile" style="margin:0;cursor:pointer">Load PDF or CSV</label><input id="simpfile" type="file" accept=".csv,.txt,.pdf,text/csv,text/plain,application/pdf" style="position:absolute;opacity:0;width:1px;height:1px"></div>
 ${st.msg?`<p class="small" id="simpmsg" role="status" style="margin:8px 0 0;font-weight:700">${esc(st.msg)}</p>`:''}
 ${P?`<h3 style="margin:14px 0 4px">Preview: ${P.rows.length} distance${P.rows.length==1?'':'s'}${st.src?` from ${esc(st.src)}`:''}</h3>
 <fieldset style="border:1px solid var(--line);border-radius:10px;padding:6px 10px;margin:6px 0"><legend class="small" style="font-weight:700">Marks you already have</legend>
 <label style="display:flex;gap:10px;align-items:center;font-weight:400;margin:6px 0;text-align:left"><input type="radio" name="simpmode" value="keep" style="width:22px;height:22px;min-height:0;flex:0 0 auto;margin:0;accent-color:var(--blue)" ${st.replace?'':'checked'}> Keep mine, only fill empty marks</label>
 <label style="display:flex;gap:10px;align-items:center;font-weight:400;margin:6px 0;text-align:left"><input type="radio" name="simpmode" value="replace" style="width:22px;height:22px;min-height:0;flex:0 0 auto;margin:0;accent-color:var(--blue)" ${st.replace?'checked':''}> Replace existing marks</label></fieldset>
 <p class="small" id="simpsum" style="margin:4px 0">${P.fill} new, ${P.same} the same${st.replace?`, ${P.rep} replaced`:`, ${P.kept} kept as yours`}.</p>
 <div id="simpwrap" style="max-height:50vh;overflow-y:auto;border:1px solid var(--line);border-radius:10px"><table id="simptab" style="width:100%;border-collapse:collapse"><thead style="position:sticky;top:0;background:var(--card)"><tr><th style="text-align:left">Distance</th><th>Now</th><th>Import</th><th>Result</th></tr></thead><tbody>
 ${P.rows.map(r=>{const f=(v,h)=>esc(v||'\u2013')+(h?' / '+esc(h):'');const act=r.act.map(x=>x[1]);const res=act.includes('replace')?'Replace':act.includes('fill')?'New':(r.ov&&r.nv&&r.ov!=r.nv)||(r.oh&&r.nh&&r.oh!=r.nh)?'Keep yours':'Same';
  return`<tr data-d="${esc(r.d)}" data-res="${res}"><th scope="row" style="text-align:left">${esc(r.d)}</th><td style="text-align:center">${f(r.ov,r.oh)}</td><td style="text-align:center">${f(r.nv,r.nh)}</td><td style="text-align:center;font-weight:700;color:${res=='Replace'?'var(--gold)':res=='New'?'var(--blue)':'inherit'}">${res}</td></tr>`}).join('')}
 </tbody></table></div>
 <div class="row" style="gap:6px;margin-top:10px"><button class="btn" id="simpsave" type="button" ${P.fill+P.rep?'':'disabled'}>Save ${P.fill+P.rep} mark${P.fill+P.rep==1?'':'s'}</button><button class="btn ghost" id="simpclear" type="button">Start again</button></div>`:''}`;
 bind()}
function setRows(r,src){st.rows=Object.keys(r.rows).length?r.rows:null;st.src=src||'';const n=Object.keys(r.rows).length;
 st.msg=n?`Found ${n} distance${n==1?'':'s'}.${r.notes.length?' '+r.notes[0]:''}`:'No marks found. Each line needs a distance and a mark, like 18m 32.35.';draw()}
function bind(){const d=document.getElementById('simpov');
 d.querySelector('#simpback').onclick=close;
 d.querySelector('#simpbow').onchange=e=>{st.bow=e.target.value;draw()};
 d.querySelector('#simpset').onchange=e=>{if(e.target.value=='__new'){const n=prompt('Name this arrow set (e.g. ACE)');if(n&&n.trim()){const id='as'+Date.now();S.arrowSets=S.arrowSets||[];S.arrowSets.push({id,archer:S.profile,name:n.trim()});save();st.set=id}draw();return}st.set=e.target.value;draw()};
 d.querySelector('#simptxt').oninput=e=>{st.text=e.target.value};
 d.querySelector('#simpread').onclick=()=>{st.text=d.querySelector('#simptxt').value;setRows(parseText(st.text),'pasted text')};
 d.querySelector('#simpfile').onchange=async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;st.msg='Reading '+f.name+' \u2026';draw();
  try{let txt;if(/\.pdf$/i.test(f.name)||f.type=='application/pdf'){if(typeof DecompressionStream=='undefined')throw new Error('This phone cannot read PDFs here. Paste the marks or use a CSV.');txt=await pdfText(await f.arrayBuffer())}else txt=await f.text();
   const r=parseText(txt);setRows(r,f.name);if(!Object.keys(r.rows).length&&/\.pdf$/i.test(f.name)){st.msg='No marks found in this PDF. It needs a column of ranges and a column of marks; otherwise paste the marks or use a CSV.';draw()}}
  catch(err){st.rows=null;st.msg=(err&&/phone/.test(err.message))?err.message:'Could not read this file. Paste the marks or use a CSV.';draw()}};
 d.querySelectorAll('[name=simpmode]').forEach(r=>r.onchange=()=>{st.replace=r.value=='replace'&&r.checked;draw()});
 const c=d.querySelector('#simpclear');if(c)c.onclick=()=>{st.rows=null;st.msg='';st.text='';st.replace=false;draw()};
 const s=d.querySelector('#simpsave');if(s)s.onclick=()=>{const P=plan();if(!P.b||!P.a)return;
  if(P.rep&&!confirm(`Replace ${P.rep} mark${P.rep==1?'':'s'} you already have on ${P.b.name}, ${P.a.name}? This cannot be undone.`))return;
  const MM=marksOf(P.b,P.a);let n=0;
  for(const r of P.rows)for(const [k] of r.act){MM[r.d]=MM[r.d]||{};MM[r.d][k]=k=='v'?r.nv:r.nh;n++}
  S.setup=S.setup||[];S.setup.push({id:'sm'+Date.now(),archer:S.profile,date:today(),cat:'Sight',change:`${P.a.id!='arrows1'?P.a.name+', ':''}imported ${n} sight mark${n==1?'':'s'}${st.src?' from '+st.src:''}${P.fill?`: ${P.fill} new`:''}${P.rep?`, ${P.rep} replaced`:''}${P.kept?`, ${P.kept} of mine kept`:''}`,reason:'',noticed:'',bow:P.b.name,...(P.a.id!='arrows1'?{arrows:P.a.name}:{})});
  S.bowSel=S.bowSel||{};S.bowSel[S.profile]=P.b.id;S.arrowSel=S.arrowSel||{};S.arrowSel[S.profile]=P.a.id;save();
  st.rows=null;st.text='';st.replace=false;st.msg=`Saved ${n} mark${n==1?'':'s'} to ${P.b.name}, ${P.a.name}.`;draw()}}
window.openSightImport=function(){const b=curBow();if(!b){alert('Add a bow setup first.');return}
 st={bow:b.id,set:curSet().id,rows:null,text:'',msg:'',replace:false,src:''};
 const d=document.createElement('div');d.className='calov';d.id='simpov';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','Import sight marks');
 d.innerHTML='<div class="calov-in"></div>';document.body.appendChild(d);addEventListener('keydown',onKey);draw()};
})();
