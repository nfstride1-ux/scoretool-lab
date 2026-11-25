# AC3 (1 Nov 2026): shortest safe cut helper in the Arrow chooser (Easton Tuning Guide pp. 15-17, Fig. 21). Plain steps, the
# archer types nock groove to rest contact at full draw, the chooser adds Easton's 1" and shows the chart spine and FOC worked out
# at that length; Use writes it as the arrow length; warning when the arrow length is shorter. Nothing written on opening.
# 390px, no console errors, old data unchanged. Test data only. BASE=<url> runs it against a deployed copy.
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

def openx(pg,id):
    if not pg.evaluate(f"document.getElementById('{id}').open"):pg.click(f'#{id} summary');pg.wait_for_timeout(250)
def spines(pg):return pg.evaluate("[...document.querySelectorAll('.brand[data-brand]')].map(b=>b.dataset.brand+' '+b.querySelector('.spn').textContent)")
def calc(pg):return pg.inner_text('#accutcalc') if pg.locator('#accutcalc').count() else ''
import re
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
  chooser(pg)
  chk('helper present and closed',pg.locator('#accut').count()==1 and not pg.evaluate("document.getElementById('accut').open"))
  chk('opening writes nothing',pg.evaluate(OLD)==before and pg.evaluate(KEY) is None)
  openx(pg,'accut');t=pg.inner_text('#accut')
  chk('plain steps in order',all(x in t for x in ['extra-long arrow','most forward point of your launcher or rest','bottom of the nock groove','about 1"']) and t.index('extra-long')<t.index('nock groove')<t.index('about 1"'))
  chk('point not included','point is not included' in t)
  chk('Easton cited',pg.locator('#accut a[href*="TuningGuideEaston.pdf"]').count()>0 and 'Measuring Correct Arrow Length' in t)
  chk('no result until a length',pg.locator('#accutout').count()==0)
  for v in ('0','-2','abc'):
    fill(pg,'contact',v);chk(f'no result for {v}',pg.locator('#accutout').count()==0)
  # recurve 38 lb, 28" draw, target
  setR(pg,{'bow':'recurve','use':'target','dw':'38','dl':'28','contact':'26.5'});OPEN=None
  chooser(pg);openx(pg,'accut')
  chk('cut = contact + 1','27.5"' in pg.inner_text('#accutout') and '26.5" + 1"' in pg.inner_text('#accutout'))
  chk('beginner recurve note',"beginners with recurve bows may want to add an extra 1/2\"-1\"" in pg.inner_text('#accut'))
  c=calc(pg)
  setR(pg,{'bow':'recurve','use':'target','dw':'38','dl':'28','len':'27.5'});chooser(pg);sp=spines(pg)
  chk('spine at the cut matches the charts at 27.5"',len(sp)>0 and all(re.sub(r'\s+',' ',s) in c.replace('·',' ').replace('  ',' ') or s.split(' ',1)[1] in c for s in sp));print('spines',sp,'|',c)
  setR(pg,{'bow':'recurve','use':'target','dw':'38','dl':'28','len':'28'});chooser(pg);sp28=spines(pg)
  chk('different length can change the spine (sanity: charts read)',len(sp28)>0)
  # FOC at the cut: same as the page shows after Use
  base={'bow':'compound','use':'indoor','dw':'50','dl':'29','ibo':'320','pt':'100','ins':'0','nock':'7','pick':{'brand':'Easton','model':'SuperDrive 27','spine':280,'gpi':9.0},'contact':'27.25'}
  setR(pg,base);chooser(pg);openx(pg,'accut')
  chk('no recurve note for compound','beginners with recurve' not in pg.inner_text('#accut'))
  c=calc(pg);m=re.search(r'FOC ([\d.]+)%',c);mw=re.search(r'total arrow weight (\d+) gr',c)
  chk('FOC shown at the cut',bool(m and mw))
  chk('no warning (length from draw)',pg.locator('#accutshort').count()==0)
  pg.click('#accutuse');pg.wait_for_timeout(500)
  chk('Use writes the arrow length',getR(pg).get('len')=='28.25')
  chk('FOC at the cut equals FOC after Use',m and f"{m.group(1)}%" in pg.inner_text('#acfocout') and mw and tw(pg)==int(mw.group(1)))
  chk('cut length line uses it','28.25" (your measured length)' in pg.inner_text('#app'))
  chk('button says it is your length',pg.locator('#accutuse').is_disabled() and 'is your arrow length' in pg.inner_text('#accutuse'))
  fill(pg,'len','27.5');openx(pg,'accut')
  chk('warning when arrow shorter than the cut',pg.locator('#accutshort').count()==1 and 'shorter than this' in pg.inner_text('#accutshort'))
  fill(pg,'len','29');openx(pg,'accut')
  chk('no warning when longer',pg.locator('#accutshort').count()==0)
  # measured balance point: FOC moves with the length
  setR(pg,dict(base,len='29',bp='16.5'));chooser(pg);openx(pg,'accut')
  chk('measured balance point moved',bool(re.search(r'FOC [\d.]+% \(moved from your measured balance point\)',calc(pg))))
  chk('390px no sideways scroll',pg.evaluate("document.documentElement.scrollWidth")<=392)
  t=pg.inner_text('#app');chk('no emoji',not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in t))
  # help step and release note
  pg.evaluate("nav('help')");pg.wait_for_timeout(600)
  chk('help has the step','Shortest safe cut' in pg.inner_text('#app') or 'Shortest safe cut' in pg.content())
  wn=pg.evaluate("JSON.stringify((window.WHATSNEW||[])[0]||'')")
  V=pg.evaluate("fetch('version.json',{cache:'no-store'}).then(r=>r.json()).then(j=>j.version)")
  allwn=pg.evaluate("JSON.stringify(window.WHATSNEW||[])").lower()
  chk('release note present (on top while this is the newest release)',('shortest' in wn.lower()) if V.endswith('-ac3') else ('shortest' in allwn))
  pg.evaluate("localStorage.removeItem('scoretool.arrowchooser.nathe')")
  after=json.loads(pg.evaluate(OLD));bf=json.loads(before)
  chk('old data unchanged',after==bf)
  chk('no console errors',not errs);errs and print(errs[:5])
  ctx.close();b.close()
if srv:srv.terminate()
print(f'{len(ok)} passed, {len(bad)} failed');bad and print('FAIL',bad)
sys.exit(1 if bad else 0)
