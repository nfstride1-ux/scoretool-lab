/* Update prompt: while the app is open, look for a new deploy (version.json, falling back to the sw.js tag;
   plus service-worker updatefound/waiting). Checks on load, every 60s, and on focus/visibility.
   Tap the gold banner -> waiting SW gets SKIP_WAITING -> fast reload -> restore tab, Stats round, scroll and scoring round.
   If the app isn't open nothing happens; the next open just loads fresh. */
(function(){
const SNAP='scoretool.updateRestore';let base=null,shown=false,reg=null;
async function remoteVersion(){
 try{const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});if(r.ok){const j=await r.json();if(j&&j.version)return String(j.version)}}catch(e){}
 try{const r=await fetch('sw.js?t='+Date.now(),{cache:'no-store'});if(r.ok){const m=(await r.text()).match(/\bv\d{4}-\d\d-\d\d[\w-]*/);if(m)return m[0]}}catch(e){}
 return null}
async function check(){if(shown||!navigator.onLine)return;const v=await remoteVersion();if(!v)return;if(base==null){base=v;return}if(v!==base)show()}
function show(){if(shown)return;shown=true;const b=document.createElement('button');b.id='updBanner';b.type='button';b.setAttribute('role','status');
 b.textContent='New version ready \u2014 tap to update';b.style.cssText='position:fixed;left:10px;right:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 76px);z-index:9999;background:#ffd84d;color:#111;border:0;border-radius:12px;padding:12px 14px;font:inherit;font-weight:800;box-shadow:0 6px 20px rgba(0,0,0,.45);cursor:pointer';
 b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();update()};document.body.appendChild(b)}
function snapshot(){try{const s={t:Date.now(),view:typeof view!='undefined'?view:null,y:scrollY,r:window._r??null,o:window._o??null,ps:window._ps??null,oc:window._oc??null,cur:(typeof cur!='undefined'&&cur)?cur.id:null};
 if(typeof save=='function')save();sessionStorage.setItem(SNAP,JSON.stringify(s))}catch(e){}}
/* reload in place: same address (keeps ?tester= and the screen the archer is on), plus a one-off cache buster that restoreAfterUpdate removes */
function go(){const u=new URL(location.href);const v=typeof view!='undefined'?view:null;if(v&&v!='home'&&!(typeof cur!='undefined'&&cur))u.searchParams.set('p',v);else if(v=='home')u.searchParams.delete('p');u.searchParams.set('u',Date.now().toString(36));location.replace(u.toString())}
function update(){snapshot();const w=reg&&reg.waiting;if(w){let done=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!done){done=true;go()}});w.postMessage({type:'SKIP_WAITING'});setTimeout(()=>{if(!done){done=true;go()}},800)}else go()}
window.restoreAfterUpdate=function(){let s;try{s=JSON.parse(sessionStorage.getItem(SNAP)||'null')}catch(e){}
 const u=new URL(location.href);if(u.searchParams.has('u')){u.searchParams.delete('u');history.replaceState(history.state,'',u.toString())}
 if(!s||Date.now()-s.t>5*60e3)return;sessionStorage.removeItem(SNAP);
 if(s.r!=null)window._r=s.r;if(s.o!=null)window._o=s.o;if(s.ps!=null)window._ps=s.ps;if(s.oc!=null)window._oc=s.oc;
 if(s.cur&&typeof S!='undefined'){const c=(S.sessions||[]).find(x=>x.id==s.cur);if(c){cur=c;try{history.pushState({scoring:1},'')}catch(e){}}}
 if(s.view)nav(s.view);[60,300,800].forEach(d=>setTimeout(()=>scrollTo(0,s.y||0),d))};
window.__checkUpdate=check;
check();setInterval(check,60e3);addEventListener('focus',check);document.addEventListener('visibilitychange',()=>{if(document.visibilityState=='visible')check()});
/* 22 Oct 2026: the banner only follows version.json (a real new deploy). The service worker installs and takes over by itself
   (skipWaiting), so its install no longer shows the banner; that was why it came back after a reload. */
if('serviceWorker' in navigator)navigator.serviceWorker.getRegistration().then(r=>{if(!r)return;reg=r;
 r.addEventListener('updatefound',()=>{const n=r.installing;if(n)n.addEventListener('statechange',()=>{if(n.state=='installed')check()})});
 setInterval(()=>r.update().catch(()=>{}),60e3)}).catch(()=>{});
})();
