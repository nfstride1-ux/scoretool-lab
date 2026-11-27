# Paid-ready basics (31 Oct 2026): backup file and restore, data kept through an app update and a cleared app cache, a clear
# offline line, and the privacy note. Test data only, in a fresh browser (never Nathe's phone). WebKit 390 x 844, touch, home-screen mode.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok=[];bad=[]
def chk(n,c,i=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+('' if c else '  '+str(i)[:300]),flush=True)
import freeport;PORT=int(os.environ.get("PORT") or freeport.get());BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get("BASE") else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
import atexit;atexit.register(lambda:srv and srv.poll() is None and srv.terminate())
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
STANDALONE="Object.defineProperty(navigator,'standalone',{get:()=>true});"
def relay(r):r.fulfill(status=200,body='{}',headers={'access-control-allow-origin':'*'})
SEED="""()=>{S.unlocked=true;S.profile=S.profile||'Test Archer';S.sessions=S.sessions||[];
 for(let i=0;i<3;i++)S.sessions.push({id:'bktest'+i,date:'2026-10-2'+i,round:'Practice 10 ends × 3',total:250+i,ends:[],test:1});save();return S.sessions.length}"""
errs=[]
with sync_playwright() as p:
  b=p.webkit.launch()
  ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='block',accept_downloads=True)
  ctx.add_init_script(STANDALONE);ctx.route('**/ntfy.sh/**',relay);ctx.route('**/clarity.ms/**',lambda r:r.fulfill(status=200,body=''))
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
  pg.goto(BASE+'?tester=nathe');pg.wait_for_timeout(2000)
  n0=pg.evaluate(SEED)
  pg.evaluate("nav('lab_settings')");pg.wait_for_timeout(800)
  chk('Settings & help shows a Your data card',pg.locator('#datacard').count()==1)
  chk('the card sits after the Settings card',pg.evaluate("()=>{const s=document.getElementById('settingscard');return !!s&&s.nextElementSibling&&s.nextElementSibling.id=='datacard'}"))
  t=pg.locator('#datacard').inner_text()
  chk('card says data is saved on this phone and kept through updates','saved on this phone' in t and 'app updates' in t,t[:300])
  chk('privacy note: no account, no login, no payment details','no account, no login and no payment details' in pg.locator('#privacy').inner_text())
  pv=pg.locator('#privacy').inner_text()
  chk('privacy note: scores kept on this phone, shared scores via the relay, anonymous usage via Microsoft Clarity','kept on this phone' in pv and 'league, match and group scores' in pv and 'relay' in pv and 'anonymous usage' in pv and 'Microsoft Clarity' in pv,pv)
  chk('no emoji in the card',not any(ord(c)>0x2600 and c not in '\u00b7\u2019' for c in t),[c for c in t if ord(c)>0x2600])
  with pg.expect_download() as dl:pg.locator('#bkdl').click()
  d=dl.value;path=d.path();txt=open(path,encoding='utf-8').read();bk=json.loads(txt)
  chk('backup file name names the archer and date',d.suggested_filename.startswith('scoretool-backup-nathe-') and d.suggested_filename.endswith('.json'),d.suggested_filename)
  chk('backup holds every shoot',len(json.loads(bk['keys'][bk['main']])['sessions'])==n0,(n0,))
  chk('backup holds only ScoreTool keys',all(k.startswith('scoretool.') for k in bk['keys']))
  chk('card shows the last backup time','Last backup file:' in pg.locator('#bklast').inner_text())
  # damage then restore
  pg.evaluate("()=>{S.sessions=[];save()}")
  chk('a non-backup file is refused',not pg.evaluate("t=>stBackupCheck(t).ok",'{"hello":1}'))
  chk('a damaged backup is refused',not pg.evaluate("t=>stBackupCheck(t).ok",txt[:len(txt)//2]))
  other=dict(bk);other['tester']='someoneelse';other['name']='Someone'
  chk('another archer\u2019s backup is refused with a plain reason','belongs to Someone' in pg.evaluate("t=>stBackupCheck(t).msg",json.dumps(other)))
  pg.once('dialog',lambda dg:(chk('restore asks first, naming both counts','0 shoots' in dg.message and f'({n0} shoots)' in dg.message,dg.message),dg.accept()))
  pg.locator('#bkfile').set_input_files(path);pg.wait_for_timeout(2500)
  n1=pg.evaluate("S.sessions.length")
  chk('restore brings every shoot back after the reload',n1==n0,(n0,n1))
  chk('the data from before the restore is kept as a copy',pg.evaluate("()=>{const c=JSON.parse(localStorage.getItem('scoretool.prerestore.nathe')||'null');return !!c&&JSON.parse(c.keys[c.main]).sessions.length==0}"))
  pg.evaluate("nav('lab_settings')");pg.wait_for_timeout(800)
  chk('restore result is shown in plain words',('Backup restored: %d shoots.'%n0) in pg.locator('#bkmsg').inner_text(),pg.locator('#bkmsg').inner_text())
  # offline line
  ctx.set_offline(True);pg.wait_for_timeout(600)
  chk('offline line appears when the phone loses signal',pg.locator('#offline').is_visible() and 'saved on this phone' in pg.locator('#offline').inner_text())
  pg.evaluate("()=>{S.sessions.push({id:'bkoff',date:'2026-10-31',round:'Practice 10 ends × 3',total:244,ends:[],test:1});save()}")
  ctx.set_offline(False);pg.wait_for_timeout(600)
  chk('offline line goes away when back online',not pg.locator('#offline').is_visible())
  chk('a shoot saved offline is still there',pg.evaluate("S.sessions.some(s=>s.id=='bkoff')"))
  b.close()
  # app update and cleared app cache: service worker on
  b=p.webkit.launch()
  ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='allow')   # this check needs the offline worker; guard.py keeps a test's own choice
  ctx.add_init_script(STANDALONE);ctx.route('**/ntfy.sh/**',relay);ctx.route('**/clarity.ms/**',lambda r:r.fulfill(status=200,body=''))
  # with the offline worker running, WebKit sends page requests past the test's network mock, so the relay is stubbed in the page
  # itself: nothing from this test reaches the real relay
  ctx.add_init_script("(()=>{const f=window.fetch;window.__relayStub=0;window.fetch=function(u,o){if(String(u&&u.url||u).includes('ntfy.sh')){window.__relayStub++;return Promise.resolve(new Response('{}',{status:200}))}return f.apply(this,arguments)}})();")
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
  B2=BASE.replace('localhost','127.0.0.1')  # the app registers its offline worker on https or 127.0.0.1 only
  pg.goto(B2+'?tester=nathe');pg.wait_for_timeout(2500);n0=pg.evaluate(SEED)
  sw=pg.evaluate("async()=>{if(!navigator.serviceWorker)return 'none';const r=await Promise.race([navigator.serviceWorker.ready,new Promise(z=>setTimeout(()=>z(null),6000))]);return r?!!r.active:'not ready'}")
  pg.reload();pg.wait_for_timeout(2000)
  chk('offline app (service worker) is installed for this check',sw is True,sw)
  chk('shoots kept after reopening with the offline app installed',pg.evaluate("S.sessions.length")==n0,sw)
  pg.evaluate("async()=>{for(const k of await caches.keys())await caches.delete(k);if(navigator.serviceWorker)for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister()}")
  pg.reload();pg.wait_for_timeout(2500)
  chk('shoots kept after the app cache is cleared and the app updates',pg.evaluate("S.sessions.length")==n0)
  chk('no page errors',not errs,errs[:3])
  b.close()
print(f'TOTAL {len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
