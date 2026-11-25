/* ScoreTool service worker __VERSION__ (offline, 20 Oct 2026). Built by tools/build_sw.py: do not edit sw.js by hand.
   Install: precache the app shell, every script and style index.html loads, fonts, icons and all data files, then take over
   (skipWaiting), so the app reopens from scratch with no signal (Peel group card included).
   Fetch (same-origin GET only): network first, so a new deploy always shows; anything that answers is saved to the cache. With no
   signal, or no answer within 3.5 s, the cached copy is used (query strings ignored: ?v=, ?t=, ?tester=). Page loads fall back
   to the cached index.html. version.json and sw.js are never served from the cache, so the update check (update.js) only ever
   sees the real live version. Cross-origin requests (ntfy relay, archerycalendars.com, clarity.ms) are not touched: no cache, straight to the network.
   Activate: delete every older scoretool-* cache except scoretool-test-* (the /test/ app). A new version = a new sw.js, so the browser installs it on the next check. */
const V='__VERSION__',CACHE='scoretool-'+V,PRE=__PRECACHE__,WAIT=3500;
const key=u=>{const x=new URL(u,self.registration.scope);x.search='';x.hash='';return x.href};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRE.map(u=>fetch(new Request(u,{cache:'reload'})).then(r=>{if(r&&r.ok)return c.put(key(u),r)}).catch(()=>{})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(K=>Promise.all(K.filter(k=>k.startsWith('scoretool-')&&!k.startsWith('scoretool-test-')&&k!=CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data&&e.data.type=='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!='GET')return;const u=new URL(q.url);if(/(^|\.)clarity\.ms$/.test(u.hostname))return;if(u.origin!=self.location.origin)return;
 if(/\/(version\.json|sw\.js)$/.test(u.pathname))return;
 const nav=q.mode=='navigate',k=nav?key('index.html'):key(q.url);
 e.respondWith((async()=>{const c=await caches.open(CACHE);
  const net=fetch(q).then(r=>{if(r&&r.ok&&r.type=='basic')c.put(k,r.clone()).catch(()=>{});return r});
  const cached=()=>c.match(k).then(m=>m||(nav?c.match(key('./')):null));
  try{const r=await Promise.race([net,new Promise((_,no)=>setTimeout(()=>no('slow'),WAIT))]);if(r&&(r.ok||!nav))return r;const m=await cached();return m||r}
  catch(err){const m=await cached();if(m)return m;try{return await net}catch(e2){return new Response('Offline',{status:503,headers:{'content-type':'text/plain'}})}}})())});
