# Queue B1 (31 Oct 2026): the Personal best note at the finish uses the same earlier shoots as the 'your PB' / 'previous PB' figure in
# This shoot vs your usual (practice and official results, full rounds only), so the two never disagree. Throwaway test profile
# (tester=steven) in a test browser; the official result is a stub inside this browser only. WebKit 390 x 844, touch, home-screen mode.
import subprocess,sys,time,os,re
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok=[];bad=[]
def chk(n,c,i=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+('' if c else '  '+str(i)[:300]),flush=True)
PORT=int(os.environ.get("PORT","8984"))
BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get('BASE') else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
STANDALONE="Object.defineProperty(navigator,'standalone',{get:()=>true});"
RD='WA 720 (70m)'
MK="""([id,date,per])=>{const R=ROUNDS['%s'];const ends=[];let left=per;for(let i=0;i<R.ends;i++){const e=[];for(let j=0;j<R.ape;j++){const n=R.ends*R.ape-(i*R.ape+j);const v=Math.min(10,Math.ceil(left/n));e.push(String(v));left-=v}ends.push(e)}
 return{id,date,round:'%s',ends,pos:[],finished:true,src:'practice'}}"""%(RD,RD)
def txt(h):return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',h or '')).strip()
errs=[]
with sync_playwright() as p:
  b=p.webkit.launch();ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='block')
  ctx.add_init_script(STANDALONE);ctx.route('**/ntfy.sh/**',lambda r:r.fulfill(status=200,body='{}'))
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
  pg.goto(BASE+'?tester=steven');pg.wait_for_timeout(2000)
  pg.evaluate("S.unlocked=true;S.profile='PB Note Test Archer';S.sessions=[];save()");pg.reload();pg.wait_for_timeout(1500)
  def run(prev,cur,official=None):
    pg.evaluate("([mk,prev,cur,off])=>{const M=eval(mk);S.sessions=prev.map(x=>M(x));const s=M(cur);S.sessions.push(s);window.__pbS=s;if(off)REAL[S.profile]=off;else delete REAL[S.profile]}",[MK,prev,cur,official])
    s=pg.evaluate("()=>{const s=window.__pbS;return{tot:total(s),sum:roundSummary(s),cmp:shootCompareHTML(s)}}")
    return s['tot'],txt(s['sum']),txt(s['cmp'])
  t,sm,cp=run([],['c1','2026-10-20',600])
  chk('600 scored as set up',t==600,t)
  chk('no earlier shoot: First time you have scored this round here.','First time you have scored this round here.' in sm,sm[-200:])
  t,sm,cp=run([['p1','2026-10-01',590]],['c1','2026-10-20',600])
  chk('beats an earlier practice 590: New PB for this round, beating 590.','New PB for this round, beating 590.' in sm,sm[-200:])
  import unicodedata;ln=[l for l in sm.split('\n') if 'New PB' in l]
  chk('the PB message has no emoji (plain text)',bool(ln) and not any(unicodedata.category(c)=='So' or ord(c)>0x2FFF for c in ln[0]),ln)
  chk('compare card agrees (previous PB 590)',re.search(r'590 previous PB',cp) is not None,cp[:300])
  chk('the note says what it counts','counts your practice and official scores' in sm,sm[-200:])
  chk('the word practice PB is gone','practice PB' not in sm and 'practice best' not in sm,sm[-200:])
  off=[{'round':RD,'score':640,'date':'2026-09-10','division':'Open Male Recurve','event':'Test shoot','club':'Test club'}]
  t,sm,cp=run([['p1','2026-10-01',590]],['c1','2026-10-20',600],off)
  chk('an official 640 counts: no New PB note at 600',('New PB' not in sm) and ('beating' not in sm),sm[-200:])
  chk('compare card agrees (your PB 640)',re.search(r'640 your PB',cp) is not None,cp[:300])
  t,sm,cp=run([['p1','2026-10-01',590]],['c1','2026-10-20',640],off)
  chk('equal to the official 640: Equal to your PB for this round.','Equal to your PB for this round.' in sm,sm[-200:])
  t,sm,cp=run([['p1','2026-10-01',590]],['c1','2026-10-20',650],off)
  chk('beats the official 640: beating 640',' beating 640.' in sm,sm[-200:])
  chk('compare card agrees (previous PB 640)',re.search(r'640 previous PB',cp) is not None,cp[:300])
  t,sm,cp=run([['p1','2026-10-01',590],['p2','2026-10-25',660]],['c1','2026-10-20',650])
  chk('a later-dated shoot does not count as an earlier PB (same as the card)',' beating 590.' in sm and re.search(r'590 previous PB',cp) is not None,(sm[-120:],cp[:200]))
  pg.evaluate("S.sessions=[];delete REAL[S.profile];save()");pg.reload();pg.wait_for_timeout(1200)
  chk('no page errors',not errs,errs[:3])
  b.close()
if srv:srv.terminate()
print(f'TOTAL {len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
