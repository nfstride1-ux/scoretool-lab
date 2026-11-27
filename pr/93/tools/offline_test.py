# Offline: the service worker precaches the app, so a fresh profile that loaded once online reopens from scratch with no signal and
# can score on the Peel group card; data files and other tester links open offline too; the update flow still works (a new deploy
# shows the banner, tap -> new version and a fresh cache, old cache removed). Runs a copy of the app on 127.0.0.1 (the SW only
# registers on https or 127.0.0.1, so the other suites are unaffected). Port 8794.
import subprocess,sys,time,os,json,shutil,tempfile
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nav_compat  # old-tab navigation (tests only)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT='/workspace/h2h';SHOT=os.path.isdir(OUT)
TMP=tempfile.mkdtemp(prefix='stoff-');APP=os.path.join(TMP,'app')
shutil.copytree(ROOT,APP,ignore=shutil.ignore_patterns('.git','shots','tools','c-*','__pycache__'))
os.makedirs(os.path.join(APP,'tools'));[shutil.copy(os.path.join(ROOT,'tools',f),os.path.join(APP,'tools',f)) for f in ('build_sw.py','sw_template.js')]
V0=json.load(open(os.path.join(APP,'version.json')))['version']
srv=subprocess.Popen([sys.executable,'-m','http.server','8794','--bind','127.0.0.1'],cwd=APP,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1.5)
U='http://127.0.0.1:8794/'
errs=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  cx=b.new_context(viewport={'width':390,'height':844},service_workers='allow')
  cx.route('https://ntfy.sh/**',lambda r,q:r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'}))
  P=cx.new_page();P.on('pageerror',lambda e:errs.append(str(e)))
  P.goto(U+'?tester=nathe');P.wait_for_timeout(1500)
  P.evaluate("navigator.serviceWorker.ready");P.wait_for_timeout(2500)
  st=P.evaluate("(async()=>{const r=await navigator.serviceWorker.getRegistration();const K=await caches.keys();const c=K.length?await caches.open(K[0]):null;const n=c?(await c.keys()).length:0;return{active:!!(r&&r.active),ctl:!!navigator.serviceWorker.controller,K,n}})()")
  chk('service worker installed and controlling the page',st['active'] and st['ctl'])
  pre=json.loads(open(os.path.join(APP,'sw.js')).read().split("PRE=",1)[1].split(",WAIT",1)[0])
  chk(f'precache holds the whole app ({len(pre)} files: shell, scripts, styles, fonts, icons, data)',st['K']==['scoretool-'+V0] and st['n']>=len(pre))
  P.evaluate("S.unlocked=true;if(!S.profile)S.profile='Nathaniel Stride';save()");P.reload();P.wait_for_timeout(1500)
  # ---------- no signal: reopen from scratch ----------
  cx.set_offline(True)
  P.close();P=cx.new_page();P.on('pageerror',lambda e:errs.append(str(e)))
  P.goto(U+'?tester=nathe',wait_until='load');P.wait_for_timeout(2500)
  chk('offline: the app reopens from scratch (new tab, no signal)',P.locator('#tabs').is_visible() and P.evaluate("typeof pgView=='function'&&typeof abaHit=='function'&&!!document.querySelector('link[href^=\"style.css\"]')"))
  chk('offline: styles and fonts load from the cache',P.evaluate("getComputedStyle(document.body).backgroundColor")!='rgba(0, 0, 0, 0)' and P.evaluate("document.fonts.check('16px Inter')||[...document.fonts].some(f=>f.status=='loaded')"))
  chk('offline: the update check stays quiet (no banner, no error)',P.locator('#updBanner').count()==0)
  P.evaluate("cur=null;sv='sheet';nav('score')");P.wait_for_timeout(400);P.click('#pgopen');P.wait_for_timeout(300)
  for i,n in enumerate(['Kim','Raj','Lee']):P.fill(f'#pgn{i}',n)
  P.click('#pggo');P.wait_for_timeout(300)
  for z in ['A','M','B','C','M','M','M','A']:
   if P.locator('#pgnext').count():P.click('#pgnext');P.wait_for_timeout(100)  # the card holds on the archer just scored until Next is tapped
   P.click(f'[data-pgz="{z}"]');P.wait_for_timeout(100)
  t=[P.evaluate(f"pgTot(pgEv().days[0].a[{j}].s)") for j in range(3)]
  chk('offline: score a group on the Peel card',t==[20,32,16])
  P.evaluate('window.scrollTo(0,0);document.querySelectorAll("*").forEach(e=>{if(e.scrollTop)e.scrollTop=0})')
  if SHOT:P.screenshot(path=OUT+'/offline-peel.png')
  P.reload(wait_until='load');P.wait_for_timeout(2200);P.evaluate("cur=null;sv='sheet';nav('score')");P.wait_for_timeout(300);P.click('#pgopen');P.wait_for_timeout(300)
  chk('offline: reload keeps the Peel scores',P.evaluate("pgTot(pgEv().days[0].a[1].s)")==32 and P.locator('[data-pga]').count()==3)
  Q=cx.new_page();Q.on('pageerror',lambda e:errs.append('estiaan: '+str(e)));Q.goto(U+'?tester=estiaan',wait_until='load');Q.wait_for_timeout(1500)
  Q.evaluate("S.unlocked=true;if(!S.profile)S.profile='Eli Archer';save()");Q.reload(wait_until='load');Q.wait_for_timeout(3000)
  chk("offline: another tester's link opens, with his data files from the cache",Q.evaluate("TESTER.id")=='estiaan' and Q.evaluate("findReal(S.profile).length")==16)
  Q.close()
  # ---------- back online: a new deploy still updates ----------
  cx.set_offline(False)
  P.reload(wait_until='load');P.wait_for_timeout(2500)  # the page was reloaded while offline, so it has not yet noted the deployed version; a fresh online load does
  V1=V0+'-next';subprocess.run([sys.executable,os.path.join(APP,'tools','build_sw.py'),V1],check=True,stdout=subprocess.DEVNULL)
  P.evaluate("window.__checkUpdate&&window.__checkUpdate()");P.wait_for_timeout(1500)
  P.evaluate("navigator.serviceWorker.getRegistration().then(r=>r&&r.update())");P.wait_for_timeout(3500)
  chk('online again: a new deploy shows the update banner',P.locator('#updBanner').count()==1)
  P.click('#updBanner');P.wait_for_timeout(3500)
  K=P.evaluate("caches.keys()")
  chk('tap to update: new version loads with a fresh cache, the old cache is removed',K==['scoretool-'+V1] and P.evaluate("fetch('version.json',{cache:'no-store'}).then(r=>r.json()).then(j=>j.version)")==V1)
  chk('after the update the Peel scores are still there',P.evaluate("pgTot(pgEv().days[0].a[1].s)")==32)
  ers=[e for e in errs if 'Failed to fetch' not in e and 'NetworkError' not in e]
  chk('no page errors',not ers)
  if ers:print(ers[:5])
finally:
  srv.terminate();shutil.rmtree(TMP,ignore_errors=True)
print(f'\n{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
