# AC6 (1 Nov 2026): Help > Build an arrow. 8 steps in order (bow details, spine from chart, shortest safe cut, point weight and FOC,
# bushings and nocks, fletching, cutting/gluing/squaring, bare-shaft or paper tune), each citing its source and opening its place in
# the Arrow chooser (shown, section open, cursor in the box). Links write nothing; 390px; no emoji; no console errors; old data
# unchanged. Test data only. BASE=<url> runs it against a deployed copy.
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
TITLES=['Bow details','Spine from the chart','Shortest safe cut','Point weight and FOC','Bushings and nocks','Fletching','Cutting, gluing and squaring','Bare-shaft or paper tune']
TARGET={'dw':'#ac_dw','res':'.acres','cut':'#accut','pt':'#ac_pt','parts':'#acfoc','fletch':'#acfletch','len':'#ac_len'}
def helpguide(pg):
  pg.evaluate("nav('help')");pg.wait_for_timeout(600)
  if not pg.evaluate("document.getElementById('hg-arrowbuild').open"):pg.click('#hg-arrowbuild summary');pg.wait_for_timeout(250)
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
  helpguide(pg)
  chk('guide present after Tools',pg.evaluate("[...document.querySelectorAll('details.hg')].map(d=>d.dataset.hg).join(',')").find('tools,arrowbuild')>=0)
  steps=pg.evaluate("[...document.querySelectorAll('#hg-arrowbuild li')].map(l=>({t:l.innerText,src:[...l.querySelectorAll('a.hgsrc')].map(a=>a.href),go:[...l.querySelectorAll('[data-acgo]')].map(a=>a.dataset.acgo)}))")
  chk('8 steps in order',[s['t'].split('.')[0] for s in steps]==TITLES);print([s['t'][:30] for s in steps])
  chk('every step cites a source',all(s['src'] for s in steps))
  chk('sources are the real documents',all(any(k in u for k in ('TuningGuideEaston.pdf','Easton-2026.pdf','correct-arrow-balance-foc','bow-international.com')) for s in steps for u in s['src']))
  chk('every step links to the chooser',all(len(s['go'])==1 and s['go'][0] in TARGET for s in steps))
  t=' '.join(s['t'] for s in steps)
  chk('key figures as printed',all(x in t for x in ['7-16% FOC','7-15% for indoor','about 1" in front','1/3 through','24-hour flexible epoxy','15 to 20 yards','4 to 6 feet','1.87-2.00"','3-4" long']))
  chk('not from Park note on fletching','not from Dr Park' in steps[5]['t'])
  t=pg.inner_text('#app');chk('no emoji',not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in t))
  chk('390px no sideways scroll',pg.evaluate("document.documentElement.scrollWidth")<=392)
  for i,s in enumerate(steps):
    k=s['go'][0];helpguide(pg)
    pg.locator('#hg-arrowbuild li').nth(i).locator('[data-acgo]').click();pg.wait_for_timeout(700)
    sel=TARGET[k];ok1=pg.locator('h1',has_text='Arrow chooser').count()>0 and pg.locator(sel).count()>0
    vis=ok1 and pg.evaluate("s=>{const e=document.querySelector(s);const r=e.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&e.offsetParent!==null}",sel)
    op=pg.evaluate("s=>{const e=document.querySelector(s);const d=e.tagName=='DETAILS'?e:e.closest('details');return !d||d.open}",sel) if ok1 else False
    foc=pg.evaluate("s=>!document.querySelector(s).matches('input,select')||document.activeElement===document.querySelector(s)",sel) if ok1 else False
    chk(f'step {i+1} opens {k}: shown, open and focused',ok1 and vis and op and foc)
  # with an Easton shaft picked, the Easton parts link lands on the parts box itself
  setR(pg,{'bow':'compound','use':'indoor','dw':'50','dl':'29','ibo':'320','pick':{'brand':'Easton','model':'SuperDrive 27','spine':280,'gpi':9.0}})
  R1=getR(pg);helpguide(pg);pg.locator('#hg-arrowbuild li').nth(4).locator('[data-acgo]').click();pg.wait_for_timeout(700)
  chk('with an Easton shaft picked, step 5 lands on Easton parts (open, shown)',pg.locator('#acparts').count()==1 and pg.evaluate("document.getElementById('acfoc').open") and pg.evaluate("(()=>{const r=document.getElementById('acparts').getBoundingClientRect();return r.bottom>0&&r.top<innerHeight})()"))
  chk('the link changes nothing saved',getR(pg)==R1)
  pg.evaluate("localStorage.removeItem('scoretool.arrowchooser.nathe')")
  chk('links write nothing',pg.evaluate(KEY) is None and pg.evaluate(OLD)==before)
  pg.evaluate("nav('help')");pg.wait_for_timeout(500)
  chk('Tools guide still there',pg.locator('#hg-tools').count()==1 and 'Fletching suggestion' in pg.inner_text('#hg-tools') if pg.evaluate("document.getElementById('hg-tools').open=true") or True else False)
  wn=pg.evaluate("JSON.stringify((window.WHATSNEW||[])[0]||'')")
  V=pg.evaluate("fetch('version.json',{cache:'no-store'}).then(r=>r.json()).then(j=>j.version)")
  allwn=pg.evaluate("JSON.stringify(window.WHATSNEW||[])").lower()
  chk('release note present (on top while this is the newest release)',('build an arrow' in wn.lower()) if V.endswith('-ac6') else ('build an arrow' in allwn))
  chk('old data unchanged',json.loads(pg.evaluate(OLD))==json.loads(before))
  chk('no console errors',not errs);errs and print(errs[:5])
  ctx.close();b.close()
if srv:srv.terminate()
print(f'{len(ok)} passed, {len(bad)} failed');bad and print('FAIL',bad)
sys.exit(1 if bad else 0)
