# Queue (31 Oct 2026): the ghost match finish shows the X count for you and the ghost over the same ends, and says Level on points
# on a points tie. Display only: result, streak and stored shoots unchanged; no X line when the ghost has no arrow values or nobody
# shot an X. Fresh test browser, tester=steven, test shoots made in this browser only. WebKit 390 x 844, touch, home-screen mode.
import subprocess,sys,time,os,re
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok=[];bad=[]
def chk(n,c,i=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+('' if c else '  '+str(i)[:300]),flush=True)
PORT=int(os.environ.get("PORT","8988"))
BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get("BASE") else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
import atexit;atexit.register(lambda:srv and srv.poll() is None and srv.terminate())
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
STANDALONE="Object.defineProperty(navigator,'standalone',{get:()=>true});"
def txt(h):return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',h or '')).strip()
errs=[]
with sync_playwright() as p:
  b=p.webkit.launch();ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='block')
  ctx.add_init_script(STANDALONE);ctx.route('**/ntfy.sh/**',lambda r:r.fulfill(status=200,body='{}'))
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
  pg.goto(BASE+'?tester=steven');pg.wait_for_timeout(2000)
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Steven';S.sessions=[];save()");pg.reload();pg.wait_for_timeout(1500)
  # 12 ends x 6 on WA 720 (70m); me: end 1 = X X 10 10 10 10 (60), rest 9s; ghost arrow values given separately
  SET="""([meX,ghX,ghPts,withAr])=>{const txt0=h=>h.replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').trim();const R=ROUNDS['WA 720 (70m)'];const me=[...Array(R.ends)].map((_,i)=>i==0?[...Array(6)].map((_,j)=>j<meX?'X':'10'):Array(6).fill('9'));
   const gar=[...Array(R.ends)].map((_,i)=>i==0?[...Array(6)].map((_,j)=>j<ghX?'X':'10'):Array(6).fill(i==R.ends-1&&ghPts?String(9+ghPts>10?10:9):'9'));
   if(ghPts==-1)gar[R.ends-1][0]='8';
   const s={id:'gx1',date:'2026-10-25',round:'WA 720 (70m)',ends:me,pos:[],finished:true,src:'practice',ghost:{mode:'off',src:'off',ends:gar.map(e=>e.reduce((t,a)=>t+(a=='X'?10:+a),0)),ar:withAr?gar:null,pos:null,date:'1 Oct 2026',rev:12}};
   S.sessions=[s];cur=s;save();window.__b4=JSON.stringify(S.sessions);score();const el=document.querySelector('.gh-res');return el?txt0(el.innerHTML):'NO GHOST CARD'}"""
  t=pg.evaluate(SET,[3,1,0,True])
  chk('tie on points: Dead heat is unchanged','Dead heat' in t,t[:200])
  chk('tie on points: Level on points. X count: you 3, ghost 1.','Level on points. X count: you 3 , ghost 1 .' in t,t)
  chk('stored shoot unchanged by the card',pg.evaluate("JSON.stringify(S.sessions)==window.__b4"))
  chk('streak shown as before (draw keeps it)',re.search(r'\d+ win streak',t) is not None,t)
  t=pg.evaluate(SET,[2,0,-1,True])
  chk('win: You beat your ghost! and X count you 2, ghost 0','You beat your ghost!' in t and 'X count: you 2 , ghost 0 .' in t and 'Level on points' not in t,t)
  t=pg.evaluate(SET,[2,0,0,False])
  chk('ghost with no arrow values: no X line','X count' not in t,t)
  t=pg.evaluate(SET,[0,0,0,True])
  chk('nobody shot an X: no X line','X count' not in t,t)
  t=pg.evaluate(SET,[3,1,0,True]);pg.evaluate("nav('score')");pg.wait_for_timeout(800)
  pg.screenshot(path='/tmp/ghostx-390.png')
  pg.evaluate("cur=null;S.sessions=[];save()")
  chk('no page errors',not errs,errs[:3])
  b.close()
print(f'TOTAL {len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
