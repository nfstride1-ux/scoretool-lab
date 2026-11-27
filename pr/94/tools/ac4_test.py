# AC4 (1 Nov 2026): heavy point and FOC warnings in the Arrow chooser. Easton (target and hunting charts): when only the point-weight
# step takes the reading past the top row, a warning gives the heaviest point that still reads on the chart. Gold Tip: front weight
# over the 150 gr column. FOC over Easton's 7-16% point-weight tuning range, or over 15% for indoor (Easton 2022). Nothing written on
# opening, 390px, no console errors, old data unchanged. Test data only. BASE=<url> runs it against a deployed copy.
import subprocess,sys,time,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context
import nm_seed,freeport
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT=os.environ.get('PORT') or freeport.get();BASE=os.environ.get('BASE');URL=BASE or f'http://localhost:{PORT}/'
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
srv=None if BASE else subprocess.Popen([sys.executable,'-m','http.server',PORT,'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
OLD="(()=>{const d=JSON.parse(localStorage.getItem('scoretool.v1')||'{}');return JSON.stringify({b:d.bows,s:d.sessions,t:d.tune,u:d.setup,sel:d.bowSel,spec:d.bowSpec,a:d.arrowInfo})})()"
KEY="localStorage.getItem('scoretool.arrowchooser.nathe')"
# no current bow, so nothing is filled from a bow (AC1) and the figures below are the test's own
SEEDJS="""()=>{const d=JSON.parse(localStorage.getItem('scoretool.v1')||'{}');d.bowSel=d.bowSel||{};delete d.bowSel[d.profile];
 localStorage.setItem('scoretool.v1',JSON.stringify(d));localStorage.removeItem('scoretool.arrowchooser.nathe')}"""
def setR(pg,R):pg.evaluate("R=>localStorage.setItem('scoretool.arrowchooser.nathe',JSON.stringify(R))",R)
def getR(pg):return json.loads(pg.evaluate(KEY) or 'null')
def chooser(pg):pg.evaluate("nav('lab_chooser')");pg.wait_for_timeout(500)
def fill(pg,k,v):pg.fill(f'#ac_{k}',str(v));pg.press(f'#ac_{k}','Tab');pg.wait_for_timeout(300)
def openfoc(pg):
    if not pg.evaluate("document.getElementById('acfoc').open"):pg.click('#acfoc summary');pg.wait_for_timeout(250)
def line(pg):return pg.inner_text('#acpartsline') if pg.locator('#acpartsline').count() else ''
def tw(pg):
    t=pg.inner_text('#acfocres');import re;m=re.search(r'Total arrow weight\s+(\d+) gr',t);return int(m.group(1)) if m else None
def foc(L,g,pt,ins,nk,vn=0,vp=0):
    T=g*L+pt+ins+nk+vn;A=(g*L*L/2+(pt+ins)*L+vn*vp)/T;return T,100*(A-L/2)/L

def foc(L,g,pt,ins,nk):
    T=g*L+pt+ins+nk;A=(g*L*L/2+(pt+ins)*L)/T;return 100*(A-L/2)/L
def ptfor(lo,hi,L=29,g=9.0):
    for p in range(100,400):
        F=round(foc(L,g,p,0,7),1)
        if lo<F<=hi:return p,F
def warn(pg,id):return pg.inner_text('#'+id) if pg.locator('#'+id).count() else ''
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new','--no-sandbox'])
  ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto(URL);pg.wait_for_timeout(1500);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
  for _ in range(3):
    if pg.locator('nav [data-v=home]').is_visible():break
    pg.locator('#app button').first.click();pg.wait_for_timeout(400)
  pg.evaluate(SEEDJS);pg.reload();pg.wait_for_timeout(1800)
  before=pg.evaluate(OLD)
  chooser(pg);chk('opening writes nothing',pg.evaluate(OLD)==before and pg.evaluate(KEY) is None)
  # Easton recurve target, top row 68-73 lb: 70 lb on the chart at 100 gr, off the top at 150 gr
  R={'bow':'recurve','use':'target','dw':'70','dl':'28','pt':'100'};setR(pg,R);chooser(pg)
  chk('70 lb at 100 gr on the chart, no warning',pg.locator('.brand[data-brand="Easton"]').count()==1 and pg.locator('#acptoff').count()==0)
  setR(pg,dict(R,pt='150'));chooser(pg);t=warn(pg,'acptoff')
  chk('150 gr point takes it off the top','Heavy point' in t and '150 gr point adds 6 lb' in t and '(73 lb)' in t)
  chk('heaviest point that still reads is 128 gr','128 gr or lighter' in t)
  setR(pg,dict(R,pt='128'));chooser(pg);chk('128 gr is on the chart',pg.locator('.brand[data-brand="Easton"]').count()==1 and pg.locator('#acptoff').count()==0)
  setR(pg,dict(R,pt='129'));chooser(pg);chk('129 gr is off',pg.locator('#acptoff').count()==1)
  setR(pg,dict(R,dw='75',pt='150'));chooser(pg);chk('over the chart without the point: no point warning',pg.locator('#acptoff').count()==0 and 'above the chart' in pg.inner_text('#app'))
  # hunting chart, traditional recurve top row 85-90
  setR(pg,{'bow':'recurve','use':'hunting','dw':'88','dl':'28','pt':'150'});chooser(pg)
  chk('hunting chart heavy point',('(90 lb)' in warn(pg,'acptoff')))
  # Gold Tip: front weight over 150 gr
  setR(pg,{'bow':'recurve','use':'target','dw':'40','dl':'28','pt':'160'});chooser(pg)
  chk('Gold Tip over 150 gr warns','160 gr' in warn(pg,'acgtheavy') and '150 gr reading' in warn(pg,'acgtheavy'))
  setR(pg,{'bow':'recurve','use':'target','dw':'40','dl':'28','pt':'150'});chooser(pg)
  chk('Gold Tip at 150 gr no warning',pg.locator('#acgtheavy').count()==0)
  # FOC limits on SD27 280 at 29", typed insert 0 and nock 7 (no Easton parts added)
  base={'bow':'compound','use':'indoor','dw':'50','dl':'29','ibo':'320','ins':'0','nock':'7','pick':{'brand':'Easton','model':'SuperDrive 27','spine':280,'gpi':9.0}}
  p1,F1=ptfor(14.0,15.0);p2,F2=ptfor(15.0,16.0);p3,F3=ptfor(16.0,17.5)
  setR(pg,dict(base,pt=str(p1)));chooser(pg)
  chk(f'indoor {F1}% no warning',f'{F1}%' in pg.inner_text('#acfocout') and pg.locator('#acfocwarn').count()==0)
  setR(pg,dict(base,pt=str(p2)));chooser(pg);t=warn(pg,'acfocwarn')
  chk(f'indoor {F2}% warns indoor only',f'FOC {F2}% is high' in t and 'indoor target range of 7-15%' in t and '16%' not in t)
  setR(pg,dict(base,pt=str(p3)));chooser(pg);t=warn(pg,'acfocwarn')
  chk(f'indoor {F3}% warns both','7-16%' in t and '7-15%' in t)
  setR(pg,dict(base,use='target',pt=str(p2)));chooser(pg)
  chk(f'target {F2}% no warning',pg.locator('#acfocwarn').count()==0)
  setR(pg,dict(base,use='target',pt=str(p3)));chooser(pg);t=warn(pg,'acfocwarn')
  chk(f'target {F3}% tuning warning only','7-16%' in t and '7-15%' not in t)
  setR(pg,dict(base,use='target',pt=str(p3),bp='19'));chooser(pg)
  chk('measured balance point drives the warning',('from your measured balance point' in pg.inner_text('#acfocout')) == True)
  chk('390px no sideways scroll',pg.evaluate("document.documentElement.scrollWidth")<=392)
  t=pg.inner_text('#app');chk('no emoji',not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in t))
  pg.evaluate("nav('help')");pg.wait_for_timeout(600)
  chk('help has the step','Heavy point and FOC warnings' in pg.content())
  wn=pg.evaluate("JSON.stringify((window.WHATSNEW||[])[0]||'')")
  V=pg.evaluate("fetch('version.json',{cache:'no-store'}).then(r=>r.json()).then(j=>j.version)")
  allwn=pg.evaluate("JSON.stringify(window.WHATSNEW||[])").lower()
  chk('release note present (on top while this is the newest release)',('heavy point' in wn.lower()) if V.endswith('-ac4') else ('heavy point' in allwn))
  pg.evaluate("localStorage.removeItem('scoretool.arrowchooser.nathe')")
  chk('old data unchanged',json.loads(pg.evaluate(OLD))==json.loads(before))
  chk('no console errors',not errs);errs and print(errs[:5])
  ctx.close();b.close()
if srv:srv.terminate()
print(f'{len(ok)} passed, {len(bad)} failed');bad and print('FAIL',bad)
sys.exit(1 if bad else 0)
