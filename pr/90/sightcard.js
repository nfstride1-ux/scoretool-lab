/* Sight card (24 Oct 2026; business-card design with the Archery Calendar header, 24 Oct 2026, Nathe via Archery Coach: "Add this feature to the score app"). In Sight marks, 'Print sight card'
   makes an A4 PDF for a laminated, credit-card-size card (85.6 x 54 mm) for the chosen bow setup + arrow set.
   Page 1: the sight marks side, page 2: the bow settings side. Two identical cards per page, centred across the page and
   placed the same distance above and below the page centre, so the front and back line up whichever edge the printer flips on.
   White background, black text, navy title. Made on the phone with the bundled jsPDF (vendor/, precached, works offline).
   Reads the marks only. The one thing it can save is the optional 'Sight' name, to this bow setup (b.sight), and only when
   the archer types it. */
(function(){
const W=85.6,H=54,PW=210,PH=297,X0=(PW-W)/2,YS=[PH/2-8-H,PH/2+8],NAVY=[13,27,42];
const metres=d=>{const m=String(d).trim().match(/^(\d+(?:\.\d+)?)\s*(m|yd|y)$/i);return m?{n:+m[1],u:m[2].toLowerCase()=='m'?'m':'yd'}:null};
const num=v=>{const x=parseFloat(String(v??'').replace(',','.'));return isFinite(x)?x:NaN};
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const nice=s=>{const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${+m[3]} ${MON[+m[2]-1]} ${m[1]}`:String(s||'')};
let st=null;
function unitOf(M){let m=0,y=0;for(const d in M){const p=metres(d);if(p&&M[d]&&M[d].v)p.u=='m'?m++:y++}return y>m?'yd':'m'}
/* rows for the card: [label, mark, est] in the chosen unit and range */
function rows(b,a,o){const M=peekMarks(b,a),u=o.u,E=((((S.sightEst||{})[b.id])||{})[a.id]||{}).marks||{},out=[];
 const real={},est={};for(const d in M){const p=metres(d);if(p&&p.u==u&&String((M[d]||{}).v||'').trim())real[p.n]=String(M[d].v).trim()}
 if(o.est){for(const d in E){const p=metres(d);if(p&&p.u==u&&real[p.n]==null)est[p.n]=E[d]}
  /* gaps with no saved estimate: the same fit and limits as 'Estimate other marks' (shortest real mark to 1.5 x the longest) */
  const P=Object.keys(real).map(n=>[u=='m'?+n:n*0.9144,num(real[n])]).filter(r=>isFinite(r[1]));const f=window.sightFit&&P.length>=3?sightFit(P):null;
  if(f&&!o.only){const lo=Math.min(...P.map(r=>r[0])),hi=Math.max(...P.map(r=>r[0]));const dp=Math.min(2,Math.max(...Object.values(real).map(v=>(v.split('.')[1]||'').length)));
   for(let n=o.from;n<=o.to;n++){if(real[n]!=null||est[n]!=null)continue;const x=u=='m'?n:n*0.9144;if(x<lo||x>hi*1.5+1e-9)continue;const v=f(x);if(isFinite(v))est[n]=v.toFixed(dp)}}}
 const L=o.only?[...new Set([...Object.keys(real),...Object.keys(est)].map(Number))].filter(n=>n>=o.from&&n<=o.to).sort((x,y)=>x-y):[...Array(Math.max(0,o.to-o.from+1))].map((_,i)=>o.from+i);
 for(const n of L)out.push(real[n]!=null?[n,real[n],0]:est[n]!=null?[n,est[n],1]:[n,'',0]);return out}
function updated(b,a){const L=(S.setup||[]).filter(x=>x.archer==S.profile&&x.cat=='Sight'&&x.bow==b.name&&(a.id=='arrows1'?!x.arrows:x.arrows==a.name)).map(x=>x.date).sort();
 if(L.length)return nice(L[L.length-1]);const m=String(typeof srcText=='function'?srcText(a):a.src||'').match(/\b(\d{1,2} [A-Z][a-z]{2} \d{4})\b/);return m?m[1]:''}
function settings(b,a){const sp=((S.bowSpec||{})[b.id])||{},o=(window.myArrow&&myArrow(a.id))||a,R=[];const add=(k,v)=>{v=String(v??'').trim();if(v)R.push([k,v])};
 const mm=[sp.make,sp.model].filter(Boolean).join(' ');add('Bow',mm||b.name);add('Sight',b.sight);
 add('Draw weight',sp.dw?sp.dw+' lb':'');add('Draw length',sp.dl?sp.dl+' in':'');
 add('Sight height',o.sh?o.sh+' in':'');add('Sight radius',o.sr?o.sr+' in':'');
 add('Arrows',[o.name,o.shaft].filter((x,i,A)=>x&&A.indexOf(x)==i).join(', '));
 add('Spine / length',[o.spine,o.len?o.len+'"':''].filter(Boolean).join(' / '));add('Points',o.pt?o.pt+' gr':'');
 add('Total weight',o.wt?o.wt+' gr':o.twCalc?o.twCalc+' gr':'');add('FOC',o.foc!=null&&o.foc!==''?o.foc+'%':'');add('Speed',o.fps?o.fps+' fps':'');
 add('Sighted in at',o.si);return R}
function fit(doc,t,max,size,min){let s=size;doc.setFontSize(s);while(s>min&&doc.getTextWidth(t)>max){s-=0.25;doc.setFontSize(s)}return s}
function crop(doc,x,y){doc.setLineWidth(0.1);doc.setDrawColor(128);for(const cx of[x,x+W])for(const cy of[y,y+H]){const dx=cx==x?-1:1,dy=cy==y?-1:1;doc.line(cx+dx*2,cy,cx+dx*7,cy);doc.line(cx,cy+dy*2,cx,cy+dy*7)}}
const GOLD=[255,198,41],HB=11;let LOGO=null;
/* business-card header (24 Oct 2026, Nathe: "Love it add to score app replace other one"): Archery Calendar icon, name and
   web address on the left, the card's title and one line under it on the right, gold rule under an 11 mm band */
function head(doc,x,y,title,sub){doc.setDrawColor(...NAVY);doc.setLineWidth(0.21);doc.roundedRect(x,y,W,H,3,3,'S');
 if(LOGO)doc.addImage(LOGO,'PNG',x+3.5,y+(HB-8.5)/2,8.5,8.5,'aclogo','FAST');
 doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.text('ARCHERY CALENDAR',x+14,y+5.2);
 doc.setFont('helvetica','normal');doc.setFontSize(5.6);doc.setTextColor(77);doc.text('archerycalendars.com',x+14,y+8.4);
 doc.setTextColor(...NAVY);doc.setFont('helvetica','bold');doc.setFontSize(7);doc.text(title,x+W-3.5,y+5.2,{align:'right'});
 if(sub){doc.setFont('helvetica','normal');doc.setTextColor(77);fit(doc,sub,W-50,5.6,4);doc.text(sub,x+W-3.5,y+8.4,{align:'right'})}
 doc.setDrawColor(...GOLD);doc.setLineWidth(0.49);doc.line(x+3.5,y+HB,x+W-3.5,y+HB)}
/* one 3.5 mm side margin for the logo, gold rule, tables and shading; both tables centred in the body under the header */
const MG=3.5,BODY=H-1.8-HB;
function marksCard(doc,x,y,R,sub){head(doc,x,y,'SIGHT MARKS',sub);const n=R.length;if(!n)return;
 const cols=Math.min(6,Math.max(1,Math.ceil(n/14))),rpc=Math.ceil(n/cols),cw=(W-2*MG)/cols,rh=Math.min(2.78,BODY/rpc),k=rh/2.78,fs=Math.max(4.2,Math.min(6.8,6.8*k)),th=rpc*rh,top=y+HB+(BODY-th)/2;
 R.forEach(([d,m,e],i)=>{const c=Math.floor(i/rpc),r=i%rpc,cx=x+MG+c*cw,rt=top+r*rh,base=rt+rh-0.85*k;
  if(r%2==0){doc.setFillColor(230,230,230);doc.rect(cx+0.5,rt,cw-1,rh,'F')}
  doc.setTextColor(0);doc.setFontSize(fs);doc.setFont('helvetica','bold');doc.text(String(d),cx+cw*0.36,base,{align:'right'});
  doc.setFont('helvetica',e?'italic':'normal');if(e)doc.setTextColor(70);doc.text(m||'-',cx+cw*0.86,base,{align:'right'})});
 doc.setDrawColor(153);doc.setLineWidth(0.106);for(let c=1;c<cols;c++)doc.line(x+MG+c*cw,top,x+MG+c*cw,top+th);
 if(R.some(r=>r[2])){doc.setFont('helvetica','italic');doc.setFontSize(4.5);doc.setTextColor(90);doc.text('italic = est.',x+W-MG,y+H-0.7,{align:'right'})}}
function setCard(doc,x,y,R,upd){head(doc,x,y,'BOW SETTINGS',upd?'Marks updated '+upd:'');const n=R.length,rh=Math.min(3.75,BODY/Math.max(1,n)),k=rh/3.75,fs=Math.max(5,Math.min(7,7*k)),top=y+HB+(BODY-n*rh)/2;
 R.forEach(([lb,v],i)=>{const rt=top+i*rh,base=rt+rh-1.1*k;if(i%2==0){doc.setFillColor(230,230,230);doc.rect(x+MG,rt,W-2*MG,rh,'F')}
  doc.setTextColor(0);doc.setFont('helvetica','bold');doc.setFontSize(fs);doc.text(lb,x+MG+2,base);const kw=doc.getTextWidth(lb);
  doc.setFont('helvetica','normal');fit(doc,v,W-2*MG-6-kw,fs,4.5);doc.text(v,x+W-MG-2,base,{align:'right'})})}
function foot(doc){doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(100);doc.text('Print at 100% (Actual size), double-sided. Cut on the corner marks, then laminate.',PW/2,PH-12,{align:'center'})}
function build(b,a,o){const J=window.jspdf;const doc=new J.jsPDF({unit:'mm',format:'a4',orientation:'portrait'});
 const R=rows(b,a,o),nm=String(b.name).trim(),set=a.id=='arrows1'&&a.name=='Arrows 1'?'':' · '+String(a.name).trim();
 const T1=`${nm}${set}  ${o.only&&R.length?R[0][0]+'-'+R[R.length-1][0]:o.from+'-'+o.to} ${o.u}`,ST=settings(b,a),up=updated(b,a);
 doc.setProperties({title:'Sight card '+nm+set});
 for(const y of YS){marksCard(doc,X0,y,R,T1);crop(doc,X0,y)}foot(doc);doc.addPage();
 for(const y of YS){setCard(doc,X0,y,ST,up);crop(doc,X0,y)}foot(doc);return{doc,n:R.length,name:('sight-card-'+nm+set).replace(/[^\w-]+/g,'-').replace(/-+/g,'-')+'.pdf'}}
window.sightCardLogo=logo;window.sightCardPDF=(o)=>{const b=curBow(),a=curSet();return build(b,a,o)};
function logo(){return LOGO?Promise.resolve():fetch('vendor/ac-icon.png').then(r=>r.ok?r.blob():Promise.reject()).then(b=>new Promise(ok=>{const f=new FileReader();f.onload=()=>{LOGO=f.result;ok()};f.readAsDataURL(b)})).catch(()=>{})}
function lib(){return window.jspdf?logo():logo().then(()=>new Promise((ok,no)=>{const s=document.createElement('script');s.src='vendor/jspdf.umd.min.js';s.onload=ok;s.onerror=()=>no(new Error('PDF maker not loaded'));document.head.appendChild(s)}))}
function close(){const d=document.getElementById('scardov');if(d)d.remove();removeEventListener('keydown',onKey);if(st&&st.url)URL.revokeObjectURL(st.url);st=null}
function onKey(e){if(e.key=='Escape')close()}
function draw(){const d=document.getElementById('scardov');if(!d)return;const b=curBow(),a=curSet();
 d.querySelector('.calov-in').innerHTML=`<button class="btn ghost labback calback" id="scback" type="button">\u2039 Sight marks</button>
 <span class="kicker">Gear</span><h2>Print sight card</h2>
 <p class="small muted" style="margin:0 0 8px">A credit-card-size card for <b>${esc(b.name)}</b>, <b>${esc(a.name)}</b>: marks on the front, bow settings on the back. Two cards per A4 page.</p>
 <div class="row" style="gap:6px"><label style="flex:1;margin:0">From (${st.u})<input id="scfrom" inputmode="numeric" value="${st.from}" style="min-height:48px"></label><label style="flex:1;margin:0">To (${st.u})<input id="scto" inputmode="numeric" value="${st.to}" style="min-height:48px"></label></div>
 <label style="display:flex;gap:10px;align-items:center;font-weight:400;margin:10px 0 4px;text-align:left"><input type="checkbox" id="sconly" style="width:22px;height:22px;min-height:0;flex:0 0 auto;margin:0" ${st.only?'checked':''}> Marked distances only</label>
 <label style="display:flex;gap:10px;align-items:center;font-weight:400;margin:4px 0;text-align:left"><input type="checkbox" id="scest" style="width:22px;height:22px;min-height:0;flex:0 0 auto;margin:0" ${st.est?'checked':''}> Fill gaps with estimates (printed in italic, est.)</label>
 <label for="scsight" style="margin-top:8px">Sight <span class="small muted">(optional, printed on the back)</span></label><input id="scsight" value="${esc(b.sight||'')}" placeholder="e.g. sight make and model" style="min-height:48px">
 <div class="calov-act"><button class="btn" id="scmake" type="button">Make PDF</button></div>
 <p class="small" id="scmsg" role="status" style="margin:8px 0 0">${st.msg?esc(st.msg):''}</p>
 ${st.url?`<div class="calov-act"><a class="btn" id="scopen" href="${st.url}" download="${esc(st.file)}" target="_blank" rel="noopener">Open or download PDF</a>${navigator.canShare?'<button class="btn ghost" id="scshare" type="button">Share or print</button>':''}</div>`:''}
 <p class="small muted" style="margin:8px 0 0">Print at 100% (Actual size), double-sided, on A4. Cut on the corner marks, then laminate. On iPhone: open the PDF, tap Share, then Print.</p>`;
 const g=()=>{st.from=parseInt($('#scfrom').value)||0;st.to=parseInt($('#scto').value)||0;st.only=$('#sconly').checked;st.est=$('#scest').checked};
 $('#scback').onclick=close;
 ['#scfrom','#scto','#sconly','#scest'].forEach(s=>$(s).onchange=()=>{g();if(st.url){URL.revokeObjectURL(st.url);st.url=null;st.msg='Settings changed: tap Make PDF again.';draw()}});
 $('#scsight').onchange=e=>{const v=e.target.value.trim();if((b.sight||'')==v)return;if(v)b.sight=v;else delete b.sight;save()};
 $('#scmake').onclick=async()=>{g();if(!(st.from>0&&st.to>=st.from)){st.msg='Pick a From and To distance (From no more than To).';draw();return}
  if(st.to-st.from>179){st.msg='That is too many distances for one card. Pick a shorter range.';draw();return}
  try{await lib()}catch(e){st.msg='Could not load the PDF maker. Open the app once while online, then try again.';draw();return}
  const r=build(b,a,{from:st.from,to:st.to,u:st.u,only:st.only,est:st.est});if(!r.n){st.msg='No marks in that range.';draw();return}
  st.blob=r.doc.output('blob');if(st.url)URL.revokeObjectURL(st.url);st.url=URL.createObjectURL(st.blob);st.file=r.name;st.msg=`Ready: ${r.n} distance${r.n==1?'':'s'}.`;draw()};
 const sh=$('#scshare');if(sh)sh.onclick=async()=>{const f=new File([st.blob],st.file,{type:'application/pdf'});if(navigator.canShare({files:[f]})){try{await navigator.share({files:[f],title:'Sight card'})}catch(e){}}else window.open(st.url,'_blank')}}
window.openSightCard=function(){const b=curBow();if(!b)return;const a=curSet(),M=peekMarks(b,a),u=unitOf(M);
 st={u,from:5,to:60,only:false,est:true,msg:''};
 const d=document.createElement('div');d.className='calov';d.id='scardov';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-label','Print sight card');
 d.innerHTML='<div class="calov-in"></div>';document.body.appendChild(d);addEventListener('keydown',onKey);draw();lib().catch(()=>{})};
const _rg=window.renderGear;if(typeof _rg!='function')return;
window.renderGear=renderGear=function(){_rg();const el=document.getElementById('gearcard'),b=curBow();if(!el||!b)return;const M=peekMarks(b,curSet());
 if(!Object.values(M).some(m=>m&&String(m.v||'').trim()))return;const at=el.querySelector('#simpopen')||el.querySelector('#ndist')&&el.querySelector('#ndist').closest('.row');if(!at)return;
 at.insertAdjacentHTML('afterend',`<button class="btn ghost" id="scprint" type="button" style="margin-top:8px;width:100%;display:flex;align-items:center;justify-content:center;gap:6px">${(window.icon&&icon('card'))||''}Print sight card</button>`);
 el.querySelector('#scprint').onclick=()=>openSightCard()};
})();
