# Queue B3 (31 Oct 2026): the Analytics bow filter always lists every bow type (Compound, Recurve, Barebow, Longbow, plus Other only
# when a shoot has no bow type), has no All bows option, and starts on your own bow. Fresh test browser, tester=steven, practice
# shoots and one official result stub made in this browser only. WebKit 390 x 844, touch, home-screen mode.
import subprocess,sys,time,os,re
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok=[];bad=[]
def chk(n,c,i=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+('' if c else '  '+str(i)[:300]),flush=True)
PORT=int(os.environ.get("PORT","8986"))
BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get("BASE") else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
import atexit;atexit.register(lambda:srv and srv.poll() is None and srv.terminate())
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
STANDALONE="Object.defineProperty(navigator,'standalone',{get:()=>true});"
MK="""([id,date,rd,per])=>{const R=ROUNDS[rd];const ends=[];let left=per;for(let i=0;i<R.ends;i++){const e=[];for(let j=0;j<R.ape;j++){const n=R.ends*R.ape-(i*R.ape+j);const v=Math.min(10,Math.ceil(left/n));e.push(String(v));left-=v}ends.push(e)}
 return{id,date,round:rd,ends,pos:[],finished:true,src:'practice'}}"""
errs=[]
with sync_playwright() as p:
  b=p.webkit.launch();ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='block')
  ctx.add_init_script(STANDALONE);ctx.route('**/ntfy.sh/**',lambda r:r.fulfill(status=200,body='{}'))
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
  pg.goto(BASE+'?tester=steven');pg.wait_for_timeout(2000)
  pg.evaluate("S.unlocked=true;S.profile='Bow Filter Test Archer';S.bow='Recurve';S.sessions=[];save()");pg.reload();pg.wait_for_timeout(1500)
  pg.evaluate("([mk])=>{const M=eval(mk);S.sessions=[M(['bf1','2026-10-20','WA 720 (70m)',600]),M(['bf2','2026-10-21','Vegas 300',270])];delete REAL[S.profile];save();window._af.range='all';window._af.bow='all'}",[MK])
  pg.evaluate("nav('analytics')");pg.wait_for_timeout(1200)
  opts=pg.eval_on_selector_all('#fb option','o=>o.map(x=>x.value)');lab=pg.eval_on_selector_all('#fb option','o=>o.map(x=>x.textContent)')
  chk('bow filter lists every bow type, in order',opts==['Compound','Recurve','Barebow','Longbow'],opts)
  chk('no All bows option','All bows' not in lab and 'all' not in opts,lab)
  chk('starts on your own bow (Recurve)',pg.eval_on_selector('#fb','s=>s.value')=='Recurve')
  t=pg.inner_text('#app')
  chk('your practice shoots show under your bow','nothing matches these filters' not in t.lower() and 'your numbers' in t.lower(),t[:200])
  pg.select_option('#fb','Longbow');pg.wait_for_timeout(800)
  chk('picking a bow with no shoots shows the empty message, nothing breaks','nothing matches these filters' in pg.inner_text('#app').lower() and pg.eval_on_selector('#fb','s=>s.value')=='Longbow',pg.inner_text('#app')[:400])
  chk('the list stays complete after picking',pg.eval_on_selector_all('#fb option','o=>o.map(x=>x.value)')==['Compound','Recurve','Barebow','Longbow'])
  pg.select_option('#fb','Recurve');pg.wait_for_timeout(800)
  chk('back to Recurve shows the shoots again','nothing matches these filters' not in pg.inner_text('#app').lower())
  pg.evaluate("REAL[S.profile]=[{round:'WA 70/720',score:610,date:'2026-09-10',division:'Open Male',event:'Test shoot',club:'Test club'}];window._af.bow='all';nav('analytics')");pg.wait_for_timeout(1000)
  o2=pg.eval_on_selector_all('#fb option','o=>o.map(x=>x.value)')
  chk('a result with no bow type adds Other at the end',o2==['Compound','Recurve','Barebow','Longbow','Other'],o2)
  pg.evaluate("delete REAL[S.profile];S.bow='Barebow';save();window._af.bow='all';nav('analytics')");pg.wait_for_timeout(1000)
  chk('an old All bows choice falls back to your own bow (Barebow)',pg.eval_on_selector('#fb','s=>s.value')=='Barebow')
  pg.screenshot(path='/tmp/bowfilter-390.png')
  pg.evaluate("S.sessions=[];save()")
  chk('no page errors',not errs,errs[:3])
  b.close()
print(f'TOTAL {len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
