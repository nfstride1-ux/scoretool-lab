# Indoor WA 25m and Combined use the same keys as Indoor WA 18m: 10, 9, 8, 7, 6, M. No X.
# A sighted compound's plotting face labels the inner ring 10 and the outer 10 ring 9, and a plot there scores 9.
# Recurve still scores that outer ring as 10, with no those labels. Australian Indoor keeps its vertical face and its X.
# Throwaway local profile only. Nate has no official division, so S.bow is the bow the round uses.
import subprocess,sys,time,os
from playwright.sync_api import sync_playwright
import guard
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
PORT=8963
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
KEYS='10 9 8 7 6 M'
def bow(pg,b):
  pg.evaluate("(b)=>{S.bow=b;save()}",b)
def start(pg,rd,single=False):
  pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(350)
  pg.click('[data-jdisc="indoor"]');pg.wait_for_timeout(150)
  pg.select_option('#rd',rd);pg.wait_for_timeout(200)
  if single and pg.locator('#f3row [data-f1=single]').count():
    pg.click('#f3row [data-f1=single]');pg.wait_for_timeout(150)
  pg.click('#st');pg.wait_for_timeout(700)
def keys(pg):return pg.evaluate("[...document.querySelectorAll('.ad-pad [data-k]')].map(b=>b.dataset.k).join(' ')")
def labels(pg):return pg.evaluate("[...document.querySelectorAll('#pface text')].map(t=>t.textContent)")
def plot(pg,pts):
  for x,y in pts:
    q=pg.evaluate("([x,y])=>{const sv=document.querySelector('#pface'),p=sv.createSVGPoint();p.x=x;p.y=y;const r=p.matrixTransform(sv.getScreenCTM());return[r.x,r.y]}",[x,y])
    pg.mouse.click(q[0],q[1]);pg.wait_for_timeout(250)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
  ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(f'http://localhost:{PORT}') else r.abort())
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(f'http://localhost:{PORT}/?tester=nate');pg.wait_for_timeout(1400)
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Nate';save()");pg.reload();pg.wait_for_timeout(1600)
  chk('rules page lists 10 to 6 and X to 6, not a 5 to 1 score',pg.evaluate("""(()=>{const w=RULES_WAAA.WA.disc.indoor.glance.find(g=>/Scoring/.test(g.t));const a=RULES_WAAA.AA.disc.indoor.glance.find(g=>/Scoring/.test(g.t));const s=JSON.stringify(w)+JSON.stringify(a);return !/5 to 1 \\(only/.test(s)&&/no 5 to 1/.test(s)&&/10, 9, 8, 7, 6, M/.test(s)&&/X, 10, 9, 8, 7, 6, M/.test(s)})()"""))
  bow(pg,'Compound')
  for rd in ['Indoor WA 25m','Indoor WA Combined 25m + 18m','Indoor WA 18m']:
    start(pg,rd,True)
    chk(f'{rd} single: keys {KEYS}',keys(pg)==KEYS and pg.evaluate("cur.inner10") is True)
    lab=labels(pg)
    chk(f'{rd} compound single face labels inner 10 and outer ring 9',lab.count('10')==1 and lab.count('9')==1)
    plot(pg,[(0,0),(0.108,0)])
    e=pg.evaluate("cur.ends[0]")
    chk(f'{rd} compound plot: centre 10, outer 10 ring 9',e==['10','9'] or e==['10','9',] and 'X' not in e)
    pg.evaluate("S.sessions=S.sessions.filter(s=>s.id!=cur.id);cur=null;save()")
  pg.evaluate("S.face1=false;save()");start(pg,'Indoor WA 25m',False)
  chk('25m compound 3-spot: keys and a 10 plus a 9 on each spot',keys(pg)==KEYS and labels(pg).count('10')==3 and labels(pg).count('9')==3)
  pg.evaluate("S.sessions=S.sessions.filter(s=>s.id!=cur.id);cur=null;save()")
  bow(pg,'Recurve')
  start(pg,'Indoor WA 18m',True)
  chk('recurve single: same keys, inner ring is not a separate 10',keys(pg)==KEYS and pg.evaluate("cur.inner10") is False and labels(pg)==[])
  plot(pg,[(0,0),(0.108,0)])
  chk('recurve plot: centre and outer 10 ring are both 10',pg.evaluate("cur.ends[0]")==['10','10'])
  pg.evaluate("S.sessions=S.sessions.filter(s=>s.id!=cur.id);cur=null;save()")
  bow(pg,'Compound')
  pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(300)
  pg.click('[data-jdisc="indoor"]');pg.wait_for_timeout(150)
  pg.select_option('#rd','Australian Indoor 18m');pg.wait_for_timeout(200)
  faces=pg.evaluate("[...document.querySelectorAll('#f3row [data-f3]')].map(b=>b.dataset.f3)")
  chk('Australian Indoor still offers the vertical face',faces==['vert','vegas','single'])
  pg.click('#f3row [data-f3=vert]');pg.wait_for_timeout(100);pg.click('#st');pg.wait_for_timeout(700)
  chk('Australian Indoor vertical keeps X, 10, 9, 8, 7, 6, M',keys(pg)=='X 10 9 8 7 6 M' and '10' not in labels(pg) and '9' not in labels(pg))
  chk('no page errors',not errs, )
  b.close()
finally:
  srv.terminate()
print(f'{len(ok)} passed, {len(bad)} failed')
sys.exit(1 if bad else 0)
