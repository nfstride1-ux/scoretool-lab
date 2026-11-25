# Microsoft Clarity (31 Oct 2026, project z660yw0kiw). WebKit, 390 px, touch, installed iPhone app (standalone) emulated.
# Checks: official snippet loads async from clarity.ms with the right project; every typed field (name, email, notes, search,
# selects) carries data-clarity-mask="true", including fields drawn later; tick boxes and buttons are left alone; the one
# privacy line sits in Settings; analytics.js is untouched; automated test browsers load nothing (so other suites are
# unaffected); with clarity.ms unreachable the app works with no page errors. Then Chromium with the service worker on
# 127.0.0.1: clarity.ms is never cached and the app still reopens offline. Ports 8977 (WebKit) and 8979 (service worker).
# BASE=<url> runs the WebKit part against a live copy (clarity.ms is stubbed so no test session is recorded).
import subprocess,sys,time,os,json,hashlib,shutil,tempfile
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH=os.environ.get('SHOTS','/tmp/shots-clarity');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
PORT=8977;BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get('BASE') else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
STANDALONE="""Object.defineProperty(navigator,'standalone',{get:()=>true});(()=>{const m=window.matchMedia.bind(window);window.matchMedia=q=>/display-mode:\\s*standalone/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}:m(q)})();"""
REAL="Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false,configurable:true});"
LINE='We use Microsoft Clarity to see how the app is used (taps and scrolling) so we can improve it; typed details are hidden.'
STUB='window.__clarityStub=(window.__clarityStub||0)+1;'
UNMASKED="""(()=>{const L=[...document.querySelectorAll('input,textarea,select')].filter(e=>!(e.tagName=='INPUT'&&/^(checkbox|radio|button|submit|reset|range|color|image|hidden|file)$/i.test(e.type)));return{n:L.length,bad:L.filter(e=>e.getAttribute('data-clarity-mask')!=='true').map(e=>e.outerHTML.slice(0,80))}})()"""
errs=[];hits=[]
def local(r):
    u=r.request.url
    if 'clarity.ms' in u:hits.append(u);return r.fulfill(status=200,body=STUB,headers={'content-type':'application/javascript'})
    if 'ntfy.sh' in u:return r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'})   # the relay is stubbed in live runs too (31 Oct 2026)
    if os.environ.get('BASE') or u.startswith(f'http://localhost:{PORT}'):return r.continue_()
    return r.abort()
def page(b,real=True,block=False):
    ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=3,user_agent=UA)
    ctx.add_init_script(STANDALONE)
    if real:ctx.add_init_script(REAL)
    if block:ctx.route('**/*',lambda r:r.abort() if 'clarity.ms' in r.request.url else r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'}) if 'ntfy.sh' in r.request.url else (r.continue_() if os.environ.get('BASE') or r.request.url.startswith(f'http://localhost:{PORT}') else r.abort()))
    else:ctx.route('**/*',local)
    pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)));return ctx,pg
try:
 with sync_playwright() as p:
  b=p.webkit.launch()
  # ---------- a real (non-automated) visitor ----------
  ctx,pg=page(b)
  pg.goto(BASE+'?tester=steven');pg.wait_for_timeout(2500)
  chk('WebKit, 390 px, touch, installed app (standalone) emulated',pg.evaluate("navigator.standalone===true&&matchMedia('(display-mode: standalone)').matches&&innerWidth==390&&'ontouchstart' in window"))
  t=pg.evaluate("[...document.scripts].filter(s=>/clarity\\.ms/.test(s.src)).map(s=>({src:s.src,a:s.async}))")
  chk('official Clarity snippet added once: https://www.clarity.ms/tag/z660yw0kiw, async',len(t)==1 and t[0]['src']=='https://www.clarity.ms/tag/z660yw0kiw' and t[0]['a'])
  chk('Clarity script requested from clarity.ms (stubbed in the test) and the clarity() queue exists',any('clarity.ms/tag/z660yw0kiw' in h for h in hits) and pg.evaluate("typeof window.clarity=='function'&&window.__clarityStub==1"))
  chk('analytics.js still loads as before',pg.evaluate("[...document.scripts].some(s=>/analytics\\.js/.test(s.src))"))
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Steven';save()");pg.reload();pg.wait_for_timeout(2000)
  seen=0;allbad=[]
  for name,js in [('Me',"nav('me')"),('Settings & help',"nav('lab_settings')"),('Send a suggestion',"suggestView()"),('Following search',"nav('follow')")]:
    try:pg.evaluate(js);pg.wait_for_timeout(500)
    except Exception as e:allbad.append(f'{name}: {e}');continue
    u=pg.evaluate(UNMASKED);seen+=u['n'];allbad+=[f'{name}: {x}' for x in u['bad']]
  chk(f'every typed field on Me, Settings, Send a suggestion and Following is masked ({seen} fields)',seen>0 and not allbad)
  if allbad:print('   ',allbad[:6])
  pg.evaluate("suggestView()");pg.wait_for_timeout(400)
  chk('Send a suggestion: the name and message fields carry data-clarity-mask="true"',pg.evaluate("document.querySelector('[name=tester]').getAttribute('data-clarity-mask')=='true'&&document.querySelector('[name=message]').getAttribute('data-clarity-mask')=='true'"))
  pg.evaluate("app.insertAdjacentHTML('beforeend','<div id=cxt><input id=cxname><input id=cxmail type=email><input id=cxtel type=tel><textarea id=cxnote></textarea><input id=cxcb type=checkbox><button id=cxb>x</button></div>')");pg.wait_for_timeout(200)
  m=pg.evaluate("['cxname','cxmail','cxtel','cxnote','cxcb','cxb'].map(i=>document.getElementById(i).getAttribute('data-clarity-mask'))")
  chk('fields drawn later (name, email, phone, notes) are masked straight away; tick boxes and buttons are not',m==['true','true','true','true',None,None])
  pg.evaluate("nav('lab_settings')");pg.wait_for_timeout(500)
  if not pg.locator('#privnote').count():pg.evaluate("nav('me')");pg.wait_for_timeout(500)
  chk('Settings shows the one privacy line, word for word',pg.locator('#privnote').count()==1 and pg.inner_text('#privnote').strip()==LINE)
  pg.locator('#privnote').scroll_into_view_if_needed();pg.wait_for_timeout(300);pg.screenshot(path=os.path.join(SH,'clarity-settings-privacy-390.png'))
  chk('the privacy line is plain text (no link, no emoji)',pg.evaluate("document.querySelector('#privnote').children.length==0")and all(ord(c)<0x2000 for c in LINE))
  chk('no page errors (real visitor)',not errs)
  ctx.close()
  # ---------- automated test browser: nothing loads, nothing is added ----------
  hits.clear();ctx,pg=page(b,real=False)
  pg.goto(BASE+'?tester=steven');pg.wait_for_timeout(2000);pg.evaluate("suggestView()");pg.wait_for_timeout(400)
  chk('automated test browsers: no Clarity request and no mask attributes (other suites see the app exactly as before)',not hits and pg.evaluate("!document.querySelector('[data-clarity-mask]')&&!document.querySelector('script[src*=\"clarity.ms\"]')"))
  ctx.close()
  # ---------- clarity.ms unreachable ----------
  e0=len(errs);ctx,pg=page(b,block=True)
  pg.goto(BASE+'?tester=steven');pg.wait_for_timeout(2500)
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Steven';save()");pg.reload();pg.wait_for_timeout(2000)
  okn=True
  for v in ['home','score','myarch','me']:
    pg.evaluate(f"nav('{v}')");pg.wait_for_timeout(400);okn=okn and len(pg.inner_text('#app'))>20
  chk('clarity.ms unreachable: Home, Score, My archery and Me all draw, nothing breaks',okn and pg.locator('#tabs').is_visible())
  chk('clarity.ms unreachable: no page errors',len(errs)==e0)
  pg.evaluate("nav('home')");pg.wait_for_timeout(300);pg.screenshot(path=os.path.join(SH,'clarity-blocked-home-390.png'))
  ctx.close();b.close()
  # ---------- service worker (Chromium, 127.0.0.1): clarity.ms never cached; offline still works ----------
  if not os.environ.get('BASE'):
    TMP=tempfile.mkdtemp(prefix='stclar-');APP=os.path.join(TMP,'app')
    shutil.copytree(ROOT,APP,ignore=shutil.ignore_patterns('.git','shots*','tools','c-*','__pycache__','qa'))
    s2=subprocess.Popen([sys.executable,'-m','http.server','8979','--bind','127.0.0.1'],cwd=APP,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1.5)
    try:
      U='http://127.0.0.1:8979/'
      b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
      cx=b.new_context(viewport={'width':390,'height':844},service_workers='allow');cx.add_init_script(REAL)
      cx.route('https://ntfy.sh/**',lambda r:r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'}))
      cx.route('https://www.clarity.ms/**',lambda r:(hits.append(r.request.url),r.fulfill(status=200,body=STUB,headers={'content-type':'application/javascript'})))
      hits.clear();P=cx.new_page();e1=len(errs);P.on('pageerror',lambda e:errs.append(str(e)))
      P.goto(U+'?tester=steven');P.wait_for_timeout(1500);P.evaluate("navigator.serviceWorker.ready");P.wait_for_timeout(2500)
      P.reload();P.wait_for_timeout(2500)
      st=P.evaluate("(async()=>{const r=await navigator.serviceWorker.getRegistration();const K=await caches.keys();let all=[];for(const k of K){const c=await caches.open(k);all=all.concat((await c.keys()).map(q=>q.url))}return{ctl:!!navigator.serviceWorker.controller,urls:all}})()")
      chk('service worker controls the page and Clarity still loads under it',st['ctl'] and len(hits)>=2)
      chk('service worker cache holds no clarity.ms request (passed straight through)',not any('clarity' in u and 'clarity.js' not in u for u in st['urls']) and any(u.endswith('/clarity.js') for u in st['urls']))
      cx.set_offline(True);P.close();P=cx.new_page();P.on('pageerror',lambda e:errs.append(str(e)))
      P.goto(U+'?tester=steven',wait_until='load');P.wait_for_timeout(2500)
      chk('offline: the app reopens from the cache with Clarity unreachable, no page errors',P.locator('#tabs').is_visible() and len(P.inner_text('#app'))>20 and len(errs)==e1)
      b.close()
    finally:s2.terminate();shutil.rmtree(TMP,ignore_errors=True)
finally:
  if srv:srv.terminate()
print(f"{len(ok)} passed, {len(bad)} failed");sys.exit(1 if bad else 0)
