/* C13 (11 Nov 2026): Terms and Refund policy, marked DRAFT for Nathe to review.
   Seller is NFS Strategic Holdings Pty Ltd. No home address is shown. */
(function(){
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function prices(){const P=window.ST_PRICES||{currency:'AUD',plus:{month:5,year:49},pro:{month:12,year:99}};
 return P}
function money(n){return'$'+n}
function priceBlock(){
  const P=prices();
  return`<p>Prices are in ${h(P.currency)}. <b>Plus</b> is ${money(P.plus.month)} a month or ${money(P.plus.year)} a year. <b>Pro</b> is ${money(P.pro.month)} a month or ${money(P.pro.year)} a year.</p>`;
}
function draftBanner(){return`<p class="small" id="legal-draft" style="margin:0 0 10px;padding:8px 10px;border-radius:8px;background:var(--amber-bg,#fff1cc);color:var(--amber,#7a4b00)"><b>DRAFT</b> — for Nathe to review. This is not the final legal wording and is not in force yet.</p>`}
function seller(){return'The seller is NFS Strategic Holdings Pty Ltd.'}
function links(){return`<p class="small" style="margin:12px 0 0"><a href="#" data-go="lab_terms">Terms</a> · <a href="#" data-go="lab_refund">Refund policy</a> · <a href="#" data-go="lab_settings">Settings</a></p>`}

function termsHTML(){
  const P=prices();
  return`<div class="card" id="termscard"><span class="kicker">Legal</span><h2 style="margin:2px 0 8px">Terms</h2>
  ${draftBanner()}
  <p>${seller()} These terms apply to ScoreTool when it is offered to customers.</p>
  <p>The first release is web only. Native app stores are not part of this release.</p>
  ${priceBlock()}
  <p>Paid plans (Plus and Pro) are available after you sign in. There are no redeem codes. Payments, when they are turned on, are handled by Lemon Squeezy as merchant of record. This draft does not take payment.</p>
  <p>A signed-in account can carry your plan to a new phone. On first sign-in you may move the data already on the phone into the account; ScoreTool will not wipe that local data as part of sign-in.</p>
  <p>Account backups of scores, sessions, sight marks, setups, diary and personal bests are kept with the account as described on the Restore my data screen, and are deleted when the account is closed.</p>
  <p>Always follow your coach's advice and the rules of the range or event. ScoreTool is a scoring and practice aid.</p>
  ${links()}</div>`;
}
function refundHTML(){
  const P=prices();
  return`<div class="card" id="refundcard"><span class="kicker">Legal</span><h2 style="margin:2px 0 8px">Refund policy</h2>
  ${draftBanner()}
  <p>${seller()} This refund policy applies to paid ScoreTool plans.</p>
  ${priceBlock()}
  <p>Payments are handled by Lemon Squeezy as merchant of record. Refunds are made only when the customer asks for one.</p>
  <p>The first release is web only.</p>
  ${links()}</div>`;
}
function show(html,title){
  app.innerHTML=html;
  if(typeof bar==='function')bar(title,'lab_settings','Settings');
  if(typeof bindGo==='function')bindGo();
  app.querySelectorAll('a[data-go]').forEach(a=>a.onclick=e=>{e.preventDefault();nav(a.dataset.go)});
}
E.lab_terms=()=>show(termsHTML(),'Terms');
E.lab_refund=()=>show(refundHTML(),'Refund policy');
if(window.LABSEC){LABSEC.lab_terms='me';LABSEC.lab_refund='me'}
function legalLinks(){
  if(document.getElementById('legallinks'))return;
  const host=document.getElementById('acctcard')||document.getElementById('settingscard');
  if(!host)return;
  host.insertAdjacentHTML('afterend',`<div class="card" id="legallinks"><span class="kicker">Legal</span><h2 style="margin:2px 0 6px">Terms and refunds</h2><p class="small muted" style="margin:0 0 8px">Draft pages for review. The seller is NFS Strategic Holdings Pty Ltd.</p><p style="margin:0"><a href="#" data-go="lab_terms">Terms (draft)</a> · <a href="#" data-go="lab_refund">Refund policy (draft)</a></p></div>`);
  const root=document.getElementById('legallinks');
  root.querySelectorAll('a[data-go]').forEach(a=>a.onclick=e=>{e.preventDefault();nav(a.dataset.go)});
}
const base=E.lab_settings;
if(base){const w=function(){base.apply(this,arguments);legalLinks()};Object.assign(w,base);E.lab_settings=w}
Object.assign(window,{legalTerms:termsHTML,legalRefund:refundHTML});
})();
