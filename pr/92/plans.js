/* Plans (Stripe), 25 Nov 2026. The secret key stays on the Edge Function. See docs/stripe-entitlement.md.
   Free: the score card (every round, plotting, saving), basic stats (Latest shoot, Practice arrows, Rankings),
   setups and sight marks, and league, match play and Lingkana scoring. Lingkana's own pilot pricing is separate and untouched.
   Plus: Analysis, Diary, photos and Event (group) scoring (Squads was removed from the app, so it is not listed). Pro: My bows, My arrows, Arrow chooser, Tune helper, calculators.
   Nobody is locked out of what they already have:
   - founding profiles (made before testing ended, 19 Nov 2026) are Pro free for life;
   - every profile already on a phone the first time this build loads is kept on full access ("early access");
   - a paid plan is read from the server (Supabase edge function, Stripe webhook), never from a value the phone sets.
   S.unlocked is the app's "profile is set up" flag and is not a plan. */
(function(){
const SB='https://sllsqpfqwckwtljzjxli.supabase.co';
const KEY_PUB='sb_publishable_t2g3KYdoGeTtcXTO-URK9g_Nf69SEFq';
const AUTH='scoretool.stripe.auth',ENT='scoretool.stripe.entitlement';
const FREE_LIST=['Score card: every round, plotting and saving','Basic stats, personal bests and practice arrows','Setups and sight marks','League scoring'];
const PLUS_LIST=['Everything in Free','Analysis','Diary','Photos','Group event scoring'];
const PRO_LIST=['Everything in Plus','My bows and My arrows','Arrow chooser','Tune helper and calculators'];
const PLANS={
 plus:{name:'Plus',month:['scoretool_plus_month','A$4.99 a month'],year:['scoretool_plus_year','A$49 a year'],line:'Analysis, diary, photos and group scoring.'},
 pro:{name:'Pro',month:['scoretool_pro_month','A$7.99 a month'],year:['scoretool_pro_year','A$79 a year'],line:'Bows, arrows and the Tune helper, as well as Plus.'}
};
const PLUS=new Set(['stats','analytics','lab_analysis','diary','lab_diary','lab_squad','squad','lab_group']);
/* never gated: score, lab_latest, lab_arrows, lab_ranks, lab_gear, lab_leagues, lab_match, Lingkana (#lk-*), lab_rounds, lab_rules, lab_mydata, settings */
const PRO=new Set(['lab_mybows','lab_myarrows','lab_chooser','lab_tune','lab_opt','lab_calc']);
const RANK={free:0,plus:1,pro:2,early:2,founding:3};
const EARLY='scoretool.paid.early';
let bill='month';
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const base=()=>String(typeof SCORETOOL_ENTITLEMENT_URL==='string'?SCORETOOL_ENTITLEMENT_URL:'').trim().replace(/\/$/,'');
function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
/* First load of this build on a phone: remember the profiles already here. They keep full access. */
(function(){try{if(localStorage.getItem(EARLY)!==null)return;
 const A=JSON.parse(localStorage.getItem('scoretool.archers')||'[]')||[],ids=(Array.isArray(A)?A:[]).map(a=>a&&a.id).filter(Boolean);
 const cur=localStorage.getItem('scoretool.tester');if(cur&&!ids.includes(cur))ids.push(cur);
 localStorage.setItem(EARLY,JSON.stringify({at:new Date().toISOString(),ids}))}catch(e){}})();
function tid(){return (typeof TESTER!=='undefined'&&TESTER&&TESTER.id)||''}
function founding(){return !!(typeof TESTER!=='undefined'&&TESTER&&TESTER.founding)}
function early(){const e=read(EARLY);return !!(e&&Array.isArray(e.ids)&&tid()&&e.ids.includes(tid()))}
function paidOpen(){
 const e=read(ENT),a=read(AUTH);
 if(!a||!a.access_token)return false; /* a plan is only ever shown for a phone signed in to the server */
 if(!e||e.server!==true||e.valid!==true||(e.tier!=='plus'&&e.tier!=='pro'))return false;
 if(e.status==='canceled'||e.status==='incomplete'||e.status==='incomplete_expired')return false;
 const end=e.current_period_end?Date.parse(e.current_period_end):NaN;
 if(Number.isFinite(end)&&end<=Date.now())return false;
 return true}
window.scoretoolPaidOpen=paidOpen;
window.tierOf=function(){
 if(founding())return 'founding';
 if(paidOpen()){const t=read(ENT).tier;if(t==='pro'||!early())return t}
 if(early())return 'early';
 return 'free'};
window.tierHas=function(need){const n=need==='pro'?'pro':need==='plus'?'plus':'free';return RANK[tierOf()]>=RANK[n]};
window.tierLabel=function(t){return {free:'No plan',plus:'Plus',pro:'Pro',early:'Early access, kept from before Plans',founding:'Founding member, free for life'}[t||tierOf()]||'No plan'};
function storeEnt(j){
 if(!j||j.server!==true)return;
 try{localStorage.setItem(ENT,JSON.stringify({server:true,valid:j.valid===true,tier:j.tier==='pro'?'pro':j.tier==='plus'?'plus':null,status:j.status||'',current_period_end:j.current_period_end||null,customer_id:j.customer_id||null}))}catch(e){}}
function clearEnt(){try{localStorage.removeItem(ENT)}catch(e){}}
function saveAuth(a){try{localStorage.setItem(AUTH,JSON.stringify({access_token:a.access_token||'',refresh_token:a.refresh_token||'',email:a.email||''}))}catch(e){}}
async function refresh(auth){
 const r=await fetch(SB+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY_PUB,Authorization:'Bearer '+KEY_PUB},body:JSON.stringify({refresh_token:auth.refresh_token})});
 if(!r.ok)return '';
 const j=await r.json();
 if(!j.access_token)return '';
 saveAuth({access_token:j.access_token,refresh_token:j.refresh_token||auth.refresh_token,email:auth.email||''});
 return j.access_token}
async function scoretoolEntitlementVerify(){
 const root=base();
 if(!root)return {ok:false,reason:'no-server'};
 const auth=read(AUTH);
 if(!auth||!auth.access_token){clearEnt();return {ok:false,reason:'signed-out'}}
 const call=token=>fetch(root+'/entitlement',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json',apikey:KEY_PUB,Authorization:'Bearer '+token},body:'{}'});
 try{
  let r=await call(auth.access_token);
  if(r.status===401&&auth.refresh_token){const t=await refresh(auth);if(!t){clearEnt();return {ok:false,reason:'signed-out'}};r=await call(t)}
  if(r.status===401){clearEnt();return {ok:false,reason:'signed-out'}}
  if(!r.ok)return {ok:false,reason:'rejected'};
  const j=await r.json();
  if(!j||j.server!==true)return {ok:false,reason:'rejected'};
  storeEnt(j);
  return j.valid===true?{ok:true,tier:j.tier}:{ok:false,reason:'inactive'}}
 catch(e){return paidOpen()?{ok:true,tier:read(ENT).tier,reason:'offline-cache'}:{ok:false,reason:'unreachable'}}}
window.scoretoolEntitlementVerify=scoretoolEntitlementVerify;
function planMsg(t){const n=document.getElementById('planmsg');if(n)n.textContent=t||''}
async function startCheckout(lookup){
 const root=base();
 if(!root){planMsg('Not available.');return}
 const here=location.origin+location.pathname+location.search;
 const email=((read(AUTH)||{}).email)||'';
 planMsg('Opening…');
 try{
  const r=await fetch(root+'/checkout',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json',apikey:KEY_PUB,Authorization:'Bearer '+KEY_PUB},body:JSON.stringify({lookup_key:lookup,success_url:here,cancel_url:here,email})});
  const j=await r.json();
  if(j&&j.url){location.href=j.url;return}
  planMsg('Try again.')}
 catch(e){planMsg('Try again.')}}
/* Paid sign-in is Google or Apple only (Nathe, 25 Nov 2026). Supabase OAuth, implicit flow: the session comes back in the
   address fragment (#access_token=...), so the return address uses ?plans=1, not #plans. */
async function oauth(provider){
 const name=provider==='apple'?'Apple':'Google';
 planMsg('Opening…');
 try{
  const r=await fetch(SB+'/auth/v1/settings',{headers:{apikey:KEY_PUB}});
  const j=r.ok?await r.json():null;
  if(!j||!j.external||j.external[provider]!==true){planMsg(name+' sign-in isn’t available yet.');return}
 }catch(e){planMsg('Try again.');return}
 const back=location.origin+location.pathname+'?plans=1';
 location.href=SB+'/auth/v1/authorize?provider='+provider+'&redirect_to='+encodeURIComponent(back)}
window.scoretoolOAuth=oauth;
async function authUserEmail(token){try{const r=await fetch(SB+'/auth/v1/user',{headers:{apikey:KEY_PUB,Authorization:'Bearer '+token}});if(!r.ok)return '';const u=await r.json();return String(u&&u.email||'')}catch(e){return ''}}
async function openPortal(){
 const root=base(),auth=read(AUTH);
 if(!root||!auth||!auth.access_token){planMsg('Tap Restore first.');const rb=document.getElementById('planrest'),rs=document.getElementById('planrestore');if(rb)rb.hidden=false;if(rs)rs.setAttribute('aria-expanded','true');return}
 try{
  const r=await fetch(root+'/portal',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json',apikey:KEY_PUB,Authorization:'Bearer '+auth.access_token},body:JSON.stringify({return_url:location.origin+location.pathname+location.search})});
  const j=await r.json();
  if(j&&j.url){location.href=j.url;return}
  planMsg('Try again.')}
 catch(e){planMsg('Try again.')}}
function paintPrices(){
 const k=bill==='year'?'year':'month';
 const p=document.getElementById('plusprice'),r=document.getElementById('proprice');
 if(p)p.textContent=PLANS.plus[k][1];
 if(r)r.textContent=PLANS.pro[k][1];
 const bp=document.getElementById('buyplus'),br=document.getElementById('buypro');
 if(bp)bp.dataset.lookup=PLANS.plus[k][0];
 if(br)br.dataset.lookup=PLANS.pro[k][0];
 const m=document.getElementById('billmonth'),y=document.getElementById('billyear');
 if(m)m.setAttribute('aria-pressed',k==='month'?'true':'false');
 if(y)y.setAttribute('aria-pressed',k==='year'?'true':'false')}
function canManage(){const e=read(ENT)||{},a=read(AUTH);return !!(a&&a.access_token&&e.server===true&&e.customer_id&&e.status!=='canceled')}
window.scoretoolCanManage=canManage;
function plansInner(){
 const e=read(ENT)||{},cur=paidOpen()?e.tier:'';
 /* signed-in paid member: show their plan and one clear way to manage or cancel it (opens the billing portal) */
 const mine=canManage()?`<div class="card" id="planmine"><span class="kicker">Your plan</span><h2 style="margin:2px 0 8px">${esc(cur==='pro'?'Pro':cur==='plus'?'Plus':tierLabel())}</h2><button class="btn full" id="planmanage" type="button">Manage or cancel subscription</button></div>`:'';
 const buy=(t,id,cls,label,lk)=>cur===t?`<button class="btn ${cls} full" id="${id}" type="button" data-lookup="${lk}" disabled>Your plan</button>`:`<button class="btn ${cls} full" id="${id}" type="button" data-lookup="${lk}">${label}</button>`;
 const li=a=>'<ul class="planlist">'+a.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
 return `<div class="card dark" id="plans"><h1>Plans</h1>${mine}
 <div class="labseg" role="group" aria-label="Billing period"><button type="button" id="billmonth" aria-pressed="true">Monthly</button><button type="button" id="billyear" aria-pressed="false">Yearly</button></div>
 <div class="card" id="planfree"><h2 style="margin:0">Free</h2><p class="planprice">A$0</p>${li(FREE_LIST)}</div>
 <div class="card" id="planplus"><h2 style="margin:0">Plus</h2><p class="planprice" id="plusprice">A$4.99 a month</p>${li(PLUS_LIST)}${buy('plus','buyplus','','Get Plus','scoretool_plus_month')}</div>
 <div class="card" id="planpro"><h2 style="margin:0">Pro</h2><p class="planprice" id="proprice">A$7.99 a month</p>${li(PRO_LIST)}${buy('pro','buypro','alt','Get Pro','scoretool_pro_month')}</div>
 <p id="planmsg" role="status">${window._planNotice&&window._planNotice!=='1'?esc(window._planNotice):''}</p>
 <div class="row" id="planctl" style="gap:8px;justify-content:flex-start"><button class="btn ghost" id="planrestore" type="button" aria-expanded="false">Restore</button></div>
 <div id="planrest" hidden><button class="btn ghost full" id="plangoogle" type="button">Continue with Google</button>
 <button class="btn ghost full" id="planapple" type="button">Continue with Apple</button></div><p class="small" style="margin:10px 0 0"><a href="privacy.html">Privacy</a> · <a href="privacy.html#terms">Terms</a></p></div>`}
function plansGateHTML(){return '<div id="gate">'+plansInner()+'</div>'}
window.plansGateHTML=plansGateHTML;
function plansBind(){
 paintPrices();
 const m=document.getElementById('billmonth'),y=document.getElementById('billyear');
 if(m)m.onclick=()=>{bill='month';paintPrices()};
 if(y)y.onclick=()=>{bill='year';paintPrices()};
 const bp=document.getElementById('buyplus'),br=document.getElementById('buypro');
 if(bp)bp.onclick=()=>startCheckout(bp.dataset.lookup);
 if(br)br.onclick=()=>startCheckout(br.dataset.lookup);
 const s=document.getElementById('plangoogle'),c=document.getElementById('planapple'),g=document.getElementById('planmanage'),rs=document.getElementById('planrestore'),rb=document.getElementById('planrest');
 if(rs&&rb)rs.onclick=()=>{rb.hidden=!rb.hidden;rs.setAttribute('aria-expanded',String(!rb.hidden))};
 if(rb&&window._planRestOpen){rb.hidden=false;if(rs)rs.setAttribute('aria-expanded','true')}
 if(s)s.onclick=()=>oauth('google');if(c)c.onclick=()=>oauth('apple');if(g)g.onclick=openPortal}
window.plansBind=plansBind;
function planHomeHTML(){
 const e=read(ENT)||{};
 const manage=canManage()?'<button class="btn ghost" id="planmanage" type="button">Manage or cancel subscription</button> ':'';
 return `<div class="card" id="planhome"><span class="kicker">Plan</span><h2 style="margin:2px 0 6px">${esc(tierLabel(e.tier))}</h2>${manage}<button class="btn ghost" id="plansee" type="button">See plans</button></div>`}
function bindHomePlan(){
 const m=document.getElementById('planmanage'),s=document.getElementById('plansee');
 if(m)m.onclick=openPortal;if(s)s.onclick=()=>nav('plans')}
if(typeof home==='function'){const _home=home;home=function(){_home.apply(this,arguments);if(!paidOpen()||document.getElementById('planhome'))return;const html=planHomeHTML();if(app.firstElementChild)app.firstElementChild.insertAdjacentHTML('beforebegin',html);else app.insertAdjacentHTML('beforeend',html);bindHomePlan()}}
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
let _plansChk=0;
function plansRecheck(){const a=read(AUTH);if(!a||!a.access_token||Date.now()-_plansChk<15000)return;_plansChk=Date.now();
 const before=JSON.stringify(read(ENT));scoretoolEntitlementVerify().then(function(){if(JSON.stringify(read(ENT))!==before&&document.getElementById('plans')&&typeof render==='function')render()})}
E.plans=function(){plansRecheck();app.innerHTML='<button class="btn ghost" id="planback" type="button">Back</button>'+plansInner();plansBind();document.getElementById('planback').onclick=()=>nav('home')};
if(E.lab_me){const baseMe=E.lab_me;E.lab_me=function(){baseMe.apply(this,arguments);const menu=app.querySelector('.labmenu');if(!menu||document.getElementById('planrow'))return;menu.insertAdjacentHTML('beforeend','<button class="labrow" id="planrow" type="button"><span><b>Plans</b><small>Free, Plus and Pro</small></span><span class="go" aria-hidden="true">›</span></button>');document.getElementById('planrow').onclick=()=>nav('plans')}}
if(E.lab_settings){const baseSet=E.lab_settings;E.lab_settings=function(){baseSet.apply(this,arguments);if(document.getElementById('plancard'))return;const host=document.getElementById('themecard')||document.getElementById('settingscard');if(!host)return;host.insertAdjacentHTML('beforebegin','<div class="card" id="plancard"><span class="kicker">Plan</span><h2 style="margin:2px 0 6px">'+esc(tierLabel())+'</h2><button class="btn" id="plansee" type="button">See plans</button><p class="small" style="margin:8px 0 0"><a href="privacy.html">Privacy</a> · <a href="privacy.html#terms">Terms</a></p></div>');document.getElementById('plansee').onclick=()=>nav('plans')}}
/* #plans opens Plans straight away (the link from archerycalendars.com), with or without a profile on this phone. */
if(typeof render==='function'){const _render=render;render=function(){
 if(location.hash==='#plans'||window._plansHash){window._plansHash=1;const t=document.getElementById('tabs');if(t)t.hidden=!(typeof TESTER!=='undefined'&&TESTER&&S&&S.profile);
  plansRecheck();app.innerHTML='<button class="btn ghost" id="planback" type="button">Back</button>'+plansInner();plansBind();
  document.getElementById('planback').onclick=()=>{window._plansHash=0;history.replaceState(null,'',location.pathname+location.search);_render()};return}
 return _render.apply(this,arguments)}}
window.addEventListener('hashchange',()=>{if(location.hash==='#plans'&&typeof render==='function')render()});
window._plansBoot=location.hash==='#plans'; /* the app's first nav after load shows Plans and keeps #plans */
const _nav=nav;
nav=function(v){
 if(window._plansBoot){window._plansBoot=0;return _nav.apply(this,arguments)}
 if(window._plansHash&&v!=='plans'){window._plansHash=0;if(location.hash==='#plans')history.replaceState(null,'',location.pathname+location.search)}
 const need=PRO.has(v)?'pro':PLUS.has(v)?'plus':null;
 if(need&&!tierHas(need)){
  view=v;$('#tabs').hidden=false;
  const sec={stats:'myarch',analytics:'myarch',lab_analysis:'myarch',diary:'myarch',lab_diary:'myarch',lab_squad:'clubs',squad:'clubs',lab_group:'clubs',lab_mybows:'myarch',lab_myarrows:'myarch',lab_chooser:'tools',lab_tune:'tools',lab_opt:'tools',lab_calc:'tools'}[v]||'home';
  document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.v===sec?'true':'false'));
  app.innerHTML=`<div class="card" id="tierlock"><span class="kicker">Plan</span><h2>Available on ${need==='pro'?'Pro':'Plus'}</h2><button class="btn" id="tierplans" type="button">See plans</button></div><button class="btn ghost" id="tierback" type="button">Back</button>`;
  document.getElementById('tierplans').onclick=()=>nav('plans');
  document.getElementById('tierback').onclick=()=>nav('home');
  scrollTo(0,0);return}
 return _nav.apply(this,arguments)};
document.addEventListener('click',function(ev){
 if(tierHas('plus'))return;
 const photo=ev.target.closest&&ev.target.closest('[data-phact="add"]');
 if(photo){ev.preventDefault();ev.stopPropagation();if(!document.getElementById('phlock'))photo.insertAdjacentHTML('afterend',' <span class="small" id="phlock">Photos are on Plus. <button type="button" class="btn ghost" data-plans="1">See plans</button></span>');return}
},true);
document.addEventListener('click',function(ev){const b=ev.target.closest&&ev.target.closest('[data-plans]');if(!b)return;ev.preventDefault();nav('plans')});
(function boot(){
 const q=new URLSearchParams(location.search);
 window._planNotice='';
 const h=new URLSearchParams((location.hash||'').replace(/^#/,''));
 const co=q.get('checkout');
 if((co==='success'||co==='cancel')&&!h.get('access_token')){
  const u=new URL(location.href);u.searchParams.delete('checkout');u.searchParams.delete('plans');
  history.replaceState(null,'',u.pathname+u.search+'#plans');window._plansBoot=1;
  const signed=!!((read(AUTH)||{}).access_token);
  if(co==='success'&&!signed){window._planNotice='Sign in to finish.';window._planRestOpen=1}
  if(co==='success'&&signed){window._planNotice='Checking your plan…';let n=0;
   const tick=function(){scoretoolEntitlementVerify().then(function(v){n++;
    if(v&&v.ok){window._planNotice='';try{localStorage.setItem('scoretool.stripe.checked',String(Date.now()))}catch(e){}if(typeof render==='function')render();return}
    if(n<10){setTimeout(tick,2000);return}
    window._planNotice='Your plan will show shortly. Open Plans again in a minute.';if(typeof render==='function')render()})};
   tick()}
  return}
 if(q.get('plans')==='1'||q.get('error')||h.get('error')){
  /* back from Google/Apple: open Plans; a refused or failed sign-in gets one short line */
  if(q.get('error')||h.get('error')){window._planNotice='Sign-in didn’t work. Try again.';window._planRestOpen=1}
  const tok=h.get('access_token'),rt=h.get('refresh_token')||'';
  if(tok)saveAuth({access_token:tok,refresh_token:rt,email:''});
  const u=new URL(location.href);['plans','error','error_code','error_description'].forEach(k=>u.searchParams.delete(k));
  history.replaceState(null,'',u.pathname+u.search+'#plans');window._plansBoot=1;
  if(tok)authUserEmail(tok).then(function(em){saveAuth({access_token:tok,refresh_token:rt,email:em});return scoretoolEntitlementVerify()}).then(function(){if(typeof render==='function')render()});
  return}
 if(!h.get('access_token')){
  /* signed-in phone: re-check the plan with the server on open (at most every 10 minutes), so a cancel or a lapse relocks */
  const a=read(AUTH),last=+(localStorage.getItem('scoretool.stripe.checked')||0);
  if(a&&a.access_token&&Date.now()-last>600000){const before=tierOf();
   scoretoolEntitlementVerify().then(function(v){if(v&&v.reason!=='unreachable'&&v.reason!=='offline-cache')try{localStorage.setItem('scoretool.stripe.checked',String(Date.now()))}catch(e){}
    if(tierOf()!==before&&typeof render==='function')render()})}
  return}
 saveAuth({access_token:h.get('access_token'),refresh_token:h.get('refresh_token')||'',email:''});
 const u=new URL(location.href);u.hash='';history.replaceState(null,'',u.pathname+u.search);
 scoretoolEntitlementVerify().then(function(){if(typeof render==='function')render()})})();
})();
