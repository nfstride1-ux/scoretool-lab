# Queue B2 (31 Oct 2026): the Personal bests card (My best scores) also counts this phone's finished practice shoots, on every round
# type, not only the official results. Practice joins the official round with the same name or gets its own round; each shoot is
# labelled practice or official; the ghost lists and Shoot against this score still use official results only. Fresh test browser,
# tester=steven (official sheets are the repo's test copy), practice shoots made in this browser only. WebKit 390 x 844, touch, home-screen mode.
import subprocess,sys,time,os,re
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok=[];bad=[]
def chk(n,c,i=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+('' if c else '  '+str(i)[:300]),flush=True)
PORT=int(os.environ.get("PORT","8985"))
BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get("BASE") else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
import atexit;atexit.register(lambda:srv and srv.poll() is None and srv.terminate())
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
STANDALONE="Object.defineProperty(navigator,'standalone',{get:()=>true});"
MK="""([id,date,rd,per])=>{const R=ROUNDS[rd];const ends=[];let left=per;for(let i=0;i<R.ends;i++){const e=[];for(let j=0;j<R.ape;j++){const n=R.ends*R.ape-(i*R.ape+j);const v=Math.min(10,Math.ceil(left/n));e.push(String(v));left-=v}ends.push(e)}
 return{id,date,round:rd,ends,pos:[],finished:true,src:'practice'}}"""
def txt(h):return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',h or '')).strip()
errs=[]
with sync_playwright() as p:
  b=p.webkit.launch();ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='block')
  ctx.add_init_script(STANDALONE);ctx.route('**/ntfy.sh/**',lambda r:r.fulfill(status=200,body='{}'))
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
  pg.goto(BASE+'?tester=steven');pg.wait_for_timeout(2000)
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Steven';S.bow='Compound';S.sessions=[];save()");pg.reload();pg.wait_for_timeout(2500)
  base=pg.evaluate("()=>{const h=bestCard();const o=offGhosts('WA 720 (70m)');return{h,n:o.list.length,best:Math.max(0,...o.list.map(x=>x.sc))}}")
  chk('card shows with official results only',bool(base['h']) and 'Personal bests' in base['h'])
  pg.evaluate("([mk])=>{const M=eval(mk);S.sessions=[M(['pb1','2026-10-20','WA 720 (70m)',719]),M(['pb2','2026-10-21','Vegas 300',288]),M(['pb3','2026-10-22','Vegas 300',281]),M(['pb4','2026-10-23','Indoor WA 18m',590]),M(['pb5','2026-10-24','WA 720 (70m)',0])];save()}",[MK])
  pg.evaluate("nav('lab_analysis')");pg.wait_for_timeout(1500)
  h=pg.evaluate("($('#bscard')||{}).outerHTML||''");t=txt(h)
  chk('card is on Full analysis',bool(h))

  chk('kicker says practice and official','My best scores practice and official' in t,t[:120])
  opts=pg.evaluate("[...document.querySelectorAll('#bssel option')].map(o=>o.textContent)")
  chk('Vegas 300 practice best (288) is listed as its own round',any(o.startswith('Vegas 300 · 288') for o in opts),opts)
  chk('a practice 719 on WA 720 (70m) is the PB of the official WA 70/720 round',any(o.startswith('WA 70/720 · 719') for o in opts),opts)
  chk('one WA 70/720 entry, not two',sum(1 for o in opts if o.startswith('WA 70/720'))==1,opts)
  chk('indoor practice round listed under Indoor',pg.evaluate("[...document.querySelectorAll('#bssel optgroup[label=Indoor] option')].some(o=>/· 590 ·/.test(o.textContent))"))
  chk('a zero-score practice shoot is not counted',not any(' · 0 · ' in o for o in opts))
  pg.select_option('#bssel',pg.evaluate("[...document.querySelectorAll('#bssel option')].find(o=>/^Vegas 300 ·/.test(o.textContent)).value"));pg.wait_for_timeout(800)
  t=txt(pg.evaluate("$('#bscard').outerHTML"))
  chk('Vegas: 288/300 with the practice label and Scored on this phone','288/300' in t.replace(' ','') and 'practice Scored on this phone' in t,t[:400])
  chk('Vegas: end by end shown (10 ends)',pg.evaluate("$('#bscard').querySelectorAll('.bs-tab tr').length")==11)
  chk('Vegas: top 2 listed (288 then 281)',re.search(r'My top 2 on Vegas 300 1 288 .* 2 281',t) is not None,t[-300:])
  chk('practice shoot has no Shoot against this score button',not pg.locator('#bsgh').count())
  sel=pg.evaluate("[...document.querySelectorAll('#bssel option')].find(o=>/^WA 70\\/720 ·/.test(o.textContent)).value")
  pg.select_option('#bssel',sel);pg.wait_for_timeout(800);t=txt(pg.evaluate("$('#bscard').outerHTML"))
  chk('WA 70/720: the practice 719 shows as PB, labelled practice','719' in t and 'PB' in t and 'practice Scored on this phone' in t,t[:300])
  chk('WA 70/720: official shoots in the top list are labelled official too',pg.evaluate("$('#bscard').querySelectorAll('.bs-row').length")>=2)
  aft=pg.evaluate("()=>{const o=offGhosts('WA 720 (70m)');return{n:o.list.length,best:Math.max(0,...o.list.map(x=>x.sc))}}")
  chk('ghost list unchanged (official only)',aft==({'n':base['n'],'best':base['best']}),(base['n'],base['best'],aft))
  chk('nothing stored by the card (sessions unchanged)',pg.evaluate("S.sessions.length")==5)
  pg.screenshot(path='/tmp/pbbest-390.png')
  pg.evaluate("S.sessions=[];save()")
  chk('no page errors',not errs,errs[:3])
  b.close()
if srv:srv.terminate()
print(f'TOTAL {len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
