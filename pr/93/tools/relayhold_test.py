# Queue (1 Nov 2026, Nathe's option A): a topic the relay turns away (429 Too Many Requests, as ntfy.sh does) is held for 15 seconds,
# then tried once more (polls are turned away too while the relay is busy); any send or poll that gets through, or coming back online, clears the hold; reopening the app re-sends the league
# snapshot at most once every 30 minutes (so catch-up still works but repeated opens do not flood the relay). Test tester nathe, test league in this browser only. WebKit 390 x 844, touch, home-screen mode.
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
MODE={'v':'ok'};POSTS=[]
def relay(r):
  q=r.request
  if q.method=='POST':
    POSTS.append(q.url)
    if MODE['v']=='429':return r.fulfill(status=429,body='{"code":42901,"error":"limit reached"}')
    return r.fulfill(status=200,body='{}',headers={'access-control-allow-origin':'*'})
  if MODE['v']=='429':return r.fulfill(status=429,body='{"code":42901,"error":"limit reached"}')
  r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'})
errs=[]
with sync_playwright() as p:
  b=p.webkit.launch();ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='block')
  ctx.add_init_script(STANDALONE);ctx.route('**/ntfy.sh/**',relay)
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
  pg.goto(BASE+'?tester=nathe');pg.wait_for_timeout(2000)
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Nathaniel Stride';save()")
  code=pg.evaluate("()=>{const L=lgAll();return L.length?L[0].code:null}")
  chk('test phone has a league to sync',bool(code),code)
  LG=lambda:len([u for u in POSTS if '-lg-' in u])
  pg.wait_for_timeout(4000)
  chk('first open sends the league snapshot',LG()>0,POSTS)
  pg.reload();pg.wait_for_timeout(5000);n=LG();pg.reload();pg.wait_for_timeout(5000)
  chk('reopening again within 30 minutes does not resend the snapshot',LG()==n,(n,LG()))
  pg.evaluate("c=>localStorage.setItem('scoretool.opost.nathe.'+c,String(Date.now()-31*6e4))",code);pg.reload();pg.wait_for_timeout(5000)
  chk('reopening after 30 minutes re-sends it once (catch-up)',LG()>n,(n,LG()))
  # turned away: one try, then a 15 second hold for that topic
  MODE['v']='429';POSTS.clear()
  pg.evaluate("c=>{const lg=lgGet(c);lg.dirty=1;save()}",code);pg.evaluate("lgTick(true)");pg.wait_for_timeout(1500)
  a=len(POSTS)
  for i in range(3):pg.evaluate("lgTick(true)");pg.wait_for_timeout(700)
  chk('after a 429 the phone holds further sends (no hammering)',a>=1 and len(POSTS)==a,(a,len(POSTS)))
  chk('the score is kept to send later (still marked to send)',pg.evaluate("c=>!!lgGet(c).dirty",code))
  pg.wait_for_timeout(13500);pg.evaluate("lgTick(true)");pg.wait_for_timeout(1500)
  chk('after 15 seconds it tries once more',len(POSTS)==a+1,(a,len(POSTS)))
  MODE['v']='ok';pg.evaluate("h2hPost('scoretool-h2h-q7m4-guardcheck',{k:'x'})");pg.wait_for_timeout(500);pg.evaluate("lgTick(true)");pg.wait_for_timeout(2500)
  chk('a send that gets through clears the hold and the score sends',not pg.evaluate("c=>!!lgGet(c).dirty",code),POSTS[-3:])
  MODE['v']='429';pg.evaluate("c=>{const lg=lgGet(c);lg.dirty=1;save()}",code);pg.evaluate("lgTick(true)");pg.wait_for_timeout(1500);a=len(POSTS)
  MODE['v']='ok';pg.evaluate("dispatchEvent(new Event('online'))");pg.wait_for_timeout(2500)
  chk('coming back online clears the hold and sends',len(POSTS)>a and not pg.evaluate("c=>!!lgGet(c).dirty",code),(a,len(POSTS)))
  chk('no page errors',not errs,errs[:3])
  b.close()
print(f'TOTAL {len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
