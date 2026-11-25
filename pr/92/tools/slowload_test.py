# 31 Oct 2026: the first draw waits for every script. Live, a slow squads.js made the first draw fail with
# "Can't find variable: squad". Here each later script is held back, the app still opens Home with no page errors.
# Test data only, fresh browser. WebKit 390 x 844, touch, home-screen mode.
import subprocess,sys,time,os
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
with sync_playwright() as p:
  b=p.webkit.launch()
  for slow in ['squads.js','lab.js','update.js']:
    ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='block')
    ctx.add_init_script(STANDALONE)
    ctx.route('**/ntfy.sh/**',lambda r:r.fulfill(status=200,body='{}',headers={'access-control-allow-origin':'*'}))
    ctx.route('**/clarity.ms/**',lambda r:r.fulfill(status=200,body=''))
    def hold(r,slow=slow):
      time.sleep(2.5);r.continue_()
    ctx.route('**/'+slow+'*',hold)
    errs=[];pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    pg.goto(BASE+'?tester=nathe',wait_until='commit');pg.wait_for_timeout(7000)
    pg.evaluate("()=>{S.unlocked=true;S.profile=S.profile||'Test Archer';save()}");pg.reload();pg.wait_for_timeout(7000)
    chk(f'{slow} slow: no page errors',not errs,errs[:3])
    chk(f'{slow} slow: the app opens a screen',pg.evaluate("()=>document.getElementById('app')&&document.getElementById('app').children.length>0"))
    ctx.close()
  b.close()
print(f'TOTAL {len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
