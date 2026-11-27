/* Estimated sight marks (23 Oct 2026, Nathe). Nothing is filled in by itself: estimates appear only when the archer taps
   'Estimate other marks' for the chosen bow and arrow set, and 'Clear estimates' removes only the estimates.
   Real (typed or loaded) marks are never changed by estimating or clearing. Estimates live under the NEW key
   S.sightEst[bowId][setId] = {marks:{dist:'24.32'}, at, n, far}, never in b.marks or b.setMarks. Typing a mark over an
   estimate makes it a real mark and drops that one estimate.
   The maths is our own generic smooth fit: least squares on mark = a + b*x + c*x^2 + e/x (x = metres / 30). The e/x term
   follows the dip at short range, the x^2 term the rise at long range; if the fit asks for a falling long range (c < 0) or
   there are only 3 marks, the x^2 term is left out. Estimates are shown from the shortest real mark out to 1.5 times the
   longest; never below the shortest or past 1.5 times. */
(function(){
const MIN=3,FAR=1.5;
const metres=d=>{const m=String(d).trim().match(/^(\d+(?:\.\d+)?)\s*(m|yd|y)$/i);if(!m)return NaN;return m[2].toLowerCase()=='m'?+m[1]:+m[1]*0.9144};
const num=v=>{const x=parseFloat(String(v??'').replace(',','.'));return isFinite(x)?x:NaN};
function solve(A,b){const n=b.length;A=A.map((r,i)=>[...r,b[i]]);for(let i=0;i<n;i++){let p=i;for(let r=i+1;r<n;r++)if(Math.abs(A[r][i])>Math.abs(A[p][i]))p=r;[A[i],A[p]]=[A[p],A[i]];if(Math.abs(A[i][i])<1e-12)return null;
 for(let r=0;r<n;r++)if(r!=i){const f=A[r][i]/A[i][i];for(let c=i;c<=n;c++)A[r][c]-=f*A[i][c]}}return A.map((r,i)=>r[n]/r[i])}
/* P = [[metres, mark], ...]; returns a function metres -> mark, or null */
function fit(P){if(P.length<MIN)return null;const B4=[x=>1,x=>x,x=>x*x,x=>1/x],B3=[x=>1,x=>x,x=>1/x];
 const run=B=>{const k=B.length,M=[...Array(k)].map(()=>Array(k).fill(0)),y=Array(k).fill(0);
  for(const[d,v]of P){const x=d/30,r=B.map(f=>f(x));for(let i=0;i<k;i++){y[i]+=r[i]*v;for(let j=0;j<k;j++)M[i][j]+=r[i]*r[j]}}
  for(let i=1;i<k;i++)M[i][i]+=1e-6;return solve(M,y)};
 let B=B3,c=null;if(P.length>=4){c=run(B4);if(c&&c[2]>=0)B=B4;else c=null}if(!c)c=run(B3);if(!c||c.some(x=>!isFinite(x)))return null;
 return d=>B.reduce((s,f,i)=>s+c[i]*f(d/30),0)}
window.sightFit=fit;
const real=M=>Object.entries(M||{}).map(([d,m])=>[d,metres(d),num(m&&m.v)]).filter(([,x,v])=>isFinite(x)&&isFinite(v));
const store=(b,a,make)=>{if(make){S.sightEst=S.sightEst||{};const B=S.sightEst[b.id]=S.sightEst[b.id]||{};return B}return((S.sightEst||{})[b.id])};
const estOf=(b,a)=>{const B=store(b,a);return B&&B[a.id]||null};
function clearEst(b,a){const B=store(b,a);if(!B||!B[a.id])return;delete B[a.id];if(!Object.keys(B).length)delete S.sightEst[b.id];if(!Object.keys(S.sightEst).length)delete S.sightEst}
/* work out estimates for every empty distance in the table, within range; returns {marks, n, far} or a reason */
function estimate(b,a){const M=peekMarks(b,a),R=real(M);if(R.length<MIN)return{err:`Add at least ${MIN} real marks first (you have ${R.length}).`};
 const f=fit(R.map(([,x,v])=>[x,v]));if(!f)return{err:'These marks could not be fitted. Check them for typing errors.'};
 const lo=Math.min(...R.map(r=>r[1])),hi=Math.max(...R.map(r=>r[1]));
 const dp=Math.min(2,Math.max(...R.map(([d])=>((String(M[d].v).split('.')[1]||'').length))));
 const out={},far=[];bowDists(b,M).forEach(d=>{const m=M[d];if(m&&String(m.v||'').trim())return;const x=metres(d);if(!isFinite(x)||x<lo||x>hi*FAR+1e-9)return;
  const v=f(x);if(!isFinite(v))return;out[d]=v.toFixed(dp);if(x>hi)far.push(d)});
 return{marks:out,n:R.length,far,hi:R.find(r=>r[1]==hi)[0],at:new Date().toLocaleDateString('en-CA')}}
window.sightEstimate=estimate;
/* B1 (11 Nov 2026): typing a mark saves it and flashes green, but the estimate bar was only built when the
   screen last drew, so the button stayed disabled and the count stayed at 0. Re-count from saved marks and
   the live boxes (without redrawing the table, so the keyboard stays put), and flush the boxes before a tap. */
function liveMarks(b,a){const M={};const src=peekMarks(b,a)||{};for(const d of Object.keys(src))M[d]={...src[d]};
 const el=document.getElementById('gearcard');if(el)el.querySelectorAll('.smk[data-k=v]').forEach(i=>{const d=i.dataset.d,nv=i.value.trim();if(!d)return;M[d]=Object.assign({},M[d],{v:nv})});
 return M}
function flushMarkInputs(b,a){const el=document.getElementById('gearcard');if(!el||!b||typeof marksOf!='function')return;
 let ch=false;el.querySelectorAll('.smk').forEach(i=>{const d=i.dataset.d,k=i.dataset.k;if(!d||!k)return;const nv=i.value.trim(),MM=marksOf(b,a),cur=(MM[d]&&MM[d][k])||'';if(cur===nv)return;if(!nv&&!MM[d])return;const m=MM[d]=MM[d]||{};m[k]=nv;ch=true});
 if(ch)save()}
function syncEstBar(b,a){const se=document.getElementById('smest'),msg=document.getElementById('smestmsg');if(!se||!msg)return;
 const n=real(liveMarks(b,a)).length,E=estOf(b,a);se.disabled=n<MIN;
 if(n<MIN)msg.textContent=`Add at least ${MIN} real marks to estimate the others (you have ${n}).`;
 else if(!E)msg.textContent='Fills only the empty distances, shown as est. Your own marks are never changed. Estimates are only as good as the marks you shot: confirm each one on the range.'}
let MSG='';
if(!document.getElementById('smeststyle'))document.head.insertAdjacentHTML('beforeend','<style id="smeststyle">.smk.smest::placeholder{font-style:italic;color:var(--muted);opacity:.85}.smk.smest{font-style:italic;font-size:15px!important;padding-left:4px;padding-right:4px}.smestl{display:block;font:italic 600 12px var(--body,inherit);color:var(--muted)}</style>');
const _rg=window.renderGear;if(typeof _rg!='function')return;
window.renderGear=renderGear=function(){_rg();const el=document.getElementById('gearcard');const b=typeof curBow=='function'&&curBow();if(!el||!b)return;const a=curSet(),M=peekMarks(b,a),E=estOf(b,a),R=real(M);
 const em=E&&E.marks||{},farSet=new Set(E&&E.far||[]);let shown=0;
 el.querySelectorAll('.smk[data-k=v]').forEach(i=>{const d=i.dataset.d,v=em[d];if(v==null||String(i.value).trim())return;shown++;
  i.classList.add('smest');i.placeholder='est. '+v;i.setAttribute('aria-label',`${d} vertical mark, estimate ${v}. Type to save a real mark.`);
  const th=i.closest('tr')&&i.closest('tr').querySelector('th');if(th)th.insertAdjacentHTML('beforeend',`<span class="smestl">${farSet.has(d)?'est., past your marks':'est.'}</span>`);
  i.addEventListener('change',()=>{if(!i.value.trim())return;const X=estOf(b,a);if(X&&X.marks&&X.marks[d]!=null){delete X.marks[d];X.far=(X.far||[]).filter(x=>x!=d);if(!Object.keys(X.marks).length)clearEst(b,a);save()}
   i.classList.remove('smest');i.placeholder='–';const l=th&&th.querySelector('.smestl');if(l)l.remove()})});
 const anchor=el.querySelector('#ndist');const row=anchor&&anchor.closest('.row');if(!row)return;
 row.insertAdjacentHTML('beforebegin',`<div id="smestw" style="margin-top:8px"><div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn ghost" id="smest" type="button"${R.length<MIN?' disabled':''}>${E?'Estimate again':'Estimate other marks'}</button>${E?'<button class="btn ghost" id="smclr" type="button">Clear estimates</button>':''}</div>
  <p class="small muted" id="smestmsg" aria-live="polite" style="margin:6px 0 0">${MSG?esc(MSG)+' ':''}${R.length<MIN?`Add at least ${MIN} real marks to estimate the others (you have ${R.length}).`:E?`${shown} estimate${shown==1?'':'s'} (shown as est.) from ${E.n} real marks on ${esc(E.at)}. Tap Estimate again after adding marks.${(E.far||[]).length?` Past your longest mark (${esc(E.hi)}) they are less sure.`:''}`:'Fills only the empty distances, shown as est. Your own marks are never changed.'}
  ${R.length>=MIN||E?' Estimates are only as good as the marks you shot: confirm each one on the range.':''}</p></div>`);MSG='';
 el.querySelectorAll('.smk').forEach(i=>{i.addEventListener('input',()=>syncEstBar(b,a));i.addEventListener('change',()=>syncEstBar(b,a))});
 syncEstBar(b,a);
 const se=el.querySelector('#smest');if(se)se.onclick=()=>{flushMarkInputs(b,a);const r=estimate(b,a);if(r.err){MSG=r.err;gearRedraw();return}
  clearEst(b,a);if(Object.keys(r.marks).length){const B=store(b,a,1);B[a.id]={marks:r.marks,n:r.n,far:r.far,hi:r.hi,at:r.at}}else MSG='Every distance in range already has a real mark.';save();gearRedraw()};
 const sc=el.querySelector('#smclr');if(sc)sc.onclick=()=>{clearEst(b,a);MSG='Estimates cleared. Your own marks are unchanged.';save();gearRedraw()}};
})();
