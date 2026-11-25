/* C12 / C14 (11 Nov 2026): account sign-in (preview stub) and account backups.
   ACCT_LIVE stays false until Nathe enables Auth on the existing project. No payment, no new keys, no OAuth client.
   Plan and backup state live under scoretool.acct* keys, never inside a tester's scoretool.v1 data. */
(function(){
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ACCT_LIVE=false; /* set true only after email, password and Google Auth are enabled for this app */
const ACCT_K='scoretool.acct';
const KEEP_DAYS=30;
window.ST_PRICES={currency:'AUD',plus:{month:5,year:49},pro:{month:12,year:99}};
window.ACCT_LIVE=ACCT_LIVE;
window.ACCT_SETUP=[
  'Use the existing Supabase project already referenced by calendar and photo sync (do not create a new project or publishable key for this preview).',
  'In that project, turn on Auth: Email (magic link and email/password) and Google. Create the Google OAuth client in Google Cloud and add the authorised redirect URLs Supabase shows. Do not send the client secret to the app.',
  'Add a table for account profiles, for example acct_profiles (user_id uuid primary key, email text, plan text check (plan in (\'Free\',\'Plus\',\'Pro\')), lifetime boolean default false, created_at timestamptz). Mark every current tester Pro with lifetime true in that table, without rewriting their ScoreTool data.',
  'When ACCT_LIVE is true, point the client at this Auth and the profile table. Payments stay off; Lemon Squeezy is not wired in this preview.'
];

function read(k,d){try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch(e){return d}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function slotId(){if(typeof TESTER!=='undefined'&&TESTER&&TESTER.id)return TESTER.id;const u=acctUser();return(u&&(u.id||u.email))||'local'}
function acctState(){const s=read(ACCT_K,{users:{}});s.users=s.users||{};return s}
function acctUser(){const s=acctState(),id=slotId(),u=s.users[id]||s.current&&s.users[s.current];return u&&u.signedIn?u:null}
function putUser(u){const s=acctState(),id=slotId();s.users[id]=u;s.current=id;write(ACCT_K,s)}

/* Testers are Pro free for life in memory only. Their scoretool.v1 data is not written to. */
function acctPlan(){
  if(typeof TESTER!=='undefined'&&TESTER)return{plan:'Pro',lifetime:true,source:'tester'};
  const u=acctUser();
  if(u)return{plan:u.plan||'Free',lifetime:!!u.lifetime,source:'account'};
  return{plan:'Free',lifetime:false,source:'none'};
}
function acctSignedIn(){return!!acctUser()||(typeof TESTER!=='undefined'&&!!TESTER&&!!acctUser())}
function acctIsSignedIn(){return!!acctUser()}
function acctPaid(){const p=acctPlan().plan;return p==='Plus'||p==='Pro'}
/* Paid features unlock only when there is a signed-in account (or a current tester, who is Pro for life). No redeem codes. */
function acctUnlocked(feature){if(typeof TESTER!=='undefined'&&TESTER)return true;if(!acctIsSignedIn())return false;return acctPaid()}

function money(n){return'$'+n}
function priceLine(){const P=window.ST_PRICES;return`Plus is ${money(P.plus.month)} a month or ${money(P.plus.year)} a year, and Pro is ${money(P.pro.month)} a month or ${money(P.pro.year)} a year, in ${P.currency}.`}

function localHasData(){
  try{return!((S.sessions||[]).length===0&&!(S.best||[]).length&&!(S.diary||[]).length&&!(S.setup||[]).length&&!(S.bows||[]).length)}catch(e){return false}
}

function signInStub(kind,email){
  const prev=acctUser();
  const u={signedIn:true,kind:kind||'email',email:email||'preview@example.com',id:'stub-'+(email||kind||'user'),plan:(typeof TESTER!=='undefined'&&TESTER)?'Pro':'Free',lifetime:!!(typeof TESTER!=='undefined'&&TESTER),since:new Date().toISOString(),preview:true,moved:prev&&prev.moved};
  const needOffer=!prev&&localHasData();
  putUser(u);
  if(needOffer)u.needOffer=true,putUser(u);
  if(window.acctTakePoint)acctTakePoint(needOffer?'Before first sign-in':'Signed in');
  return u;
}
function signOutStub(){const u=acctUser();if(!u)return;u.signedIn=false;putUser(u)}

function acceptMove(){
  const u=acctUser();if(!u)return;
  u.moved=true;u.movedAt=new Date().toISOString();u.needOffer=false;putUser(u);
  if(window.acctTakePoint)acctTakePoint('Moved local data into the account');
}
function declineMove(){
  const u=acctUser();if(!u)return;
  u.moved=false;u.needOffer=false;putUser(u);
}

function planCard(){
  const P=window.ST_PRICES,pl=acctPlan(),u=acctUser();
  const signed=!!u;
  return`<div class="card" id="acctcard"><span class="kicker">Account</span><h2 style="margin:2px 0 6px">${signed?'Signed in':'Sign in'}</h2>
   <p class="small muted" style="margin:0 0 8px">${signed?h(u.email)+' · '+(u.kind==='google'?'Google':u.kind==='password'?'Email and password':'Email magic link')+(u.preview?' · preview stub':''):'A signed-in account carries your plan to a new phone. Sign in with email or Google. There are no redeem codes, and payments are not taken in this preview.'}</p>
   <p class="small"><b>Plan: ${h(pl.plan)}</b>${pl.lifetime?' · free for life':''}${pl.source==='tester'?' · current testers are Pro free for life (this is not written into your saved scores).':''}</p>
   <div class="small" id="acctprices" style="margin:8px 0"><b>Plus</b> ${money(P.plus.month)} a month or ${money(P.plus.year)} a year · <b>Pro</b> ${money(P.pro.month)} a month or ${money(P.pro.year)} a year · ${P.currency}. First release is web only.</div>
   ${signed?'':`<label for="acctem">Email</label><input id="acctem" type="email" autocomplete="email" placeholder="you@example.com">
     <label for="acctpw">Password (optional)</label><input id="acctpw" type="password" autocomplete="current-password" placeholder="For email and password">
     <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">
      <button class="btn" type="button" id="acctmagic">Email me a magic link</button>
      <button class="btn ghost" type="button" id="acctpass">Sign in with password</button>
      <button class="btn ghost" type="button" id="acctgoogle">Continue with Google</button>
     </div>
     <p class="small muted" id="acctmsg" style="margin:8px 0 0">${ACCT_LIVE?'':'Preview: nothing is sent to a server. A tap signs you in on this phone only, so the rest of the account screens can be tried.'}</p>`}
   ${signed?`<p style="margin:10px 0 0"><button class="btn ghost" type="button" id="acctout">Sign out</button></p>`:''}
   ${u&&u.needOffer?`<div id="acctoffer" style="margin-top:12px;padding:10px;border:1px solid var(--line,#d6dde8);border-radius:10px"><p class="small" style="margin:0 0 8px">This phone already has scores, sight marks, setups, diary entries or PBs. Move that data into this account? It stays on this phone either way. Nothing is wiped.</p><button class="btn" type="button" id="acctmove">Move data into my account</button> <button class="btn ghost" type="button" id="acctkeep">Keep it on this phone only</button></div>`:''}
  </div>`;
}

function bindAcct(root){
  const $id=id=>(root||document).querySelector('#'+id);
  const go=()=>{if(typeof render==='function'){if(typeof nav==='function'&&typeof view!=='undefined')nav(view);else render()}else acctMountSettings()};
  const em=()=>(($id('acctem')||{}).value||'').trim()||'preview@example.com';
  if($id('acctmagic'))$id('acctmagic').onclick=()=>{signInStub('magic',em());go()};
  if($id('acctpass'))$id('acctpass').onclick=()=>{const pw=($id('acctpw')||{}).value||'';if(!pw){if($id('acctmsg'))$id('acctmsg').textContent='Type a password, or use the magic link or Google.';return}signInStub('password',em());go()};
  if($id('acctgoogle'))$id('acctgoogle').onclick=()=>{signInStub('google','google.preview@example.com');go()};
  if($id('acctout'))$id('acctout').onclick=()=>{signOutStub();go()};
  if($id('acctmove'))$id('acctmove').onclick=()=>{acceptMove();go()};
  if($id('acctkeep'))$id('acctkeep').onclick=()=>{declineMove();go()};
}

function acctMountSettings(){
  const theme=document.getElementById('themecard')||document.getElementById('settingscard');
  if(!document.getElementById('acctcard')&&theme)theme.insertAdjacentHTML('beforebegin',planCard());
  else if(document.getElementById('acctcard'))document.getElementById('acctcard').outerHTML=planCard();
  const root=document.getElementById('app');bindAcct(root);
}

const _base=E.lab_settings;
if(_base){const w=function(){_base.apply(this,arguments);acctMountSettings()};Object.assign(w,_base);E.lab_settings=w}
else{E.lab_settings=function(){acctMountSettings()}}


Object.assign(window,{acctPlan,acctIsSignedIn,acctUnlocked,acctPaid,acctSignIn:signInStub,acctSignOut:signOutStub,acctAcceptMove:acceptMove,acctDeclineMove:declineMove,acctMountSettings,acctUser});
})();
