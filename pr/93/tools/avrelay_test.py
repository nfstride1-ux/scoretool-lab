# Queue C1 (31 Oct 2026): when Nathe views another tester's app (admin view, read only), the relay (ntfy) is skipped quietly:
# nothing is posted for that tester, and the 'this would change ...'s data' notice no longer pops up just because a league or match
# sync ran near a tap. Real local saves in admin view are still blocked with the notice. Back on Nathe's own profile the relay works.
# Fresh test browser, relay mocked (nothing leaves the machine). WebKit 390 x 844, touch, home-screen mode.
import subprocess,sys,time,os
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok=[];bad=[]
def chk(n,c,i=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+('' if c else '  '+str(i)[:300]),flush=True)
PORT=int(os.environ.get("PORT","8987"))
BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get("BASE") else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
import atexit;atexit.register(lambda:srv and srv.poll() is None and srv.terminate())
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
STANDALONE="Object.defineProperty(navigator,'standalone',{get:()=>true});"
errs=[];posts=[]
with sync_playwright() as p:
  b=p.webkit.launch();ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='block')
  ctx.add_init_script(STANDALONE)
  ctx.route('https://ntfy.sh/**',lambda r,q:(posts.append(q.url) if q.method!='GET' else None,r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'}))[1])
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
  pg.goto(BASE+'?tester=nathe');pg.wait_for_timeout(2500)
  pg.evaluate("S.unlocked=true;save()");pg.evaluate("setTester('nate')");pg.wait_for_timeout(3500)
  chk('admin view is on (viewing Nate)',pg.evaluate("!!window.ADMIN_VIEW"))
  posts.clear();pg.evaluate("window.__avBlocked=[]")
  pg.evaluate("nav('score')");pg.wait_for_timeout(800)
  btn=pg.locator('[data-lgopen]').first
  chk('Nate has a league on this phone',pg.evaluate("lgAll().length>0"))
  if btn.count():btn.tap()
  else:pg.locator('#tabs button').first.tap();pg.evaluate("lgView(lgAll()[0].code)")
  pg.evaluate("lgTick(true)");pg.wait_for_timeout(1500)
  on=pg.evaluate("!!(document.getElementById('avtoast')&&document.getElementById('avtoast').classList.contains('on'))")
  chk('opening the league in admin view: no would-change-data notice',not on)
  bl=pg.evaluate("window.__avBlocked.slice()")
  chk('relay skipped quietly (logged as relay-skip, not a blocked POST)',any(x.startswith('relay-skip:') for x in bl) and not any(x.startswith('net-POST:https://ntfy.sh') for x in bl),bl[:6])
  chk('nothing posted to the relay for Nate',not posts,posts[:3])
  chk('league view still draws',pg.locator('#lgview').count()>0 or 'Onion' in pg.inner_text('#app'))
  pg.locator('#tabs button').first.tap();pg.evaluate("localStorage.setItem('scoretool.test.c1','x')");pg.wait_for_timeout(300)
  chk('a real save in admin view is still blocked with the notice',pg.evaluate("document.getElementById('avtoast').classList.contains('on')&&localStorage.getItem('scoretool.test.c1')===null"))
  pg.goto(BASE+'?tester=nathe');pg.wait_for_timeout(2500);posts.clear()
  chk('back on Nathe: admin view off',pg.evaluate("!window.ADMIN_VIEW"))
  pg.evaluate("for(const lg of lgAll())lg.dirty=1;lgTick(true)");pg.wait_for_timeout(2500)
  chk('back on Nathe: the relay works again',len(posts)>0,posts[:2])
  chk('no page errors',not errs,errs[:3])
  b.close()
print(f'TOTAL {len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
