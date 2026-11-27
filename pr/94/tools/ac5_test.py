# AC5 (1 Nov 2026): sourced fletching suggestion in the Arrow chooser, marked "Not from Dr Park". Indoor / outdoor (target, field) /
# 3D / hunting lines by use, launcher-rest clearance for compound, clearance check for all; figures as printed by Bow International
# (A. Tippins 2018, 2020) and Easton's Tuning Guide, each line linked to its source. Reads only, 390px, no console errors,
# old data unchanged. Test data only. BASE=<url> runs it against a deployed copy.
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
def openx(pg,id):
    if not pg.evaluate(f"document.getElementById('{id}').open"):pg.click(f'#{id} summary');pg.wait_for_timeout(250)
def has(pg,id):return pg.locator('#'+id).count()==1
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
  chk('fletching section present and closed',has(pg,'acfletch') and not pg.evaluate("document.getElementById('acfletch').open"))
  def show(R):
    setR(pg,R);chooser(pg);openx(pg,'acfletch');return pg.inner_text('#acfletch')
  t=show({'bow':'recurve','use':'indoor','dw':'38','dl':'28'})
  chk('marked not from Park','Not from Dr Park' in t)
  chk('recurve indoor: indoor line, no outdoor, no launcher',has(pg,'acfl_in') and not has(pg,'acfl_out') and not has(pg,'acfl_launch'))
  chk('indoor figures as printed','3.00" vanes on recurve arrows and 4.00" on compound' in t and '3-4" long with a high profile' in t)
  chk('recurve clearance note','especially a problem for recurve' in t)
  hrefs=pg.evaluate("[...document.querySelectorAll('#acfletch a')].map(a=>a.href)")
  chk('sources linked',any('the-essential-guide-to-vanes' in x for x in hrefs) and any('qa-picking-your-vanes' in x for x in hrefs) and any('TuningGuideEaston.pdf' in x for x in hrefs))
  chk('every item has a source',pg.evaluate("[...document.querySelectorAll('#acfletch li')].filter(l=>!/^3D/.test(l.innerText)).every(l=>l.querySelector('a'))"))
  t=show({'bow':'compound','use':'target','dw':'55','dl':'28'})
  chk('compound target: outdoor + launcher',has(pg,'acfl_out') and has(pg,'acfl_launch') and not has(pg,'acfl_in'))
  chk('outdoor figures as printed','1.87"-2.00"' in t and 'just over 1/4" high' in t and '1.75"-2.25"' in t and 'two lower vanes' in t)
  chk('no recurve note for compound','especially a problem for recurve' not in t)
  t=show({'bow':'barebow','use':'field','dw':'35','dl':'28'})
  chk('barebow field: outdoor, no launcher',has(pg,'acfl_out') and not has(pg,'acfl_launch'))
  t=show({'bow':'compound','use':'3d','dw':'55','dl':'28'})
  chk('3D: says no 3D figure, shows both',has(pg,'acfl_3d') and has(pg,'acfl_in') and has(pg,'acfl_out') and 'no 3D-only' in t)
  t=show({'bow':'compound','use':'hunting','dw':'60','dl':'28'})
  chk('hunting: not covered',has(pg,'acfl_hunt') and 'do not cover hunting' in t)
  t=show({'bow':'recurve','use':'target','dw':'38','dl':'28'})
  chk('stays open after a change',(fill(pg,'dw',39) or True) and pg.evaluate("document.getElementById('acfletch').open"))
  chk('reads only',getR(pg) is None or 'fletch' not in json.dumps(getR(pg)))
  chk('390px no sideways scroll',pg.evaluate("document.documentElement.scrollWidth")<=392)
  t=pg.inner_text('#app');chk('no emoji',not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in t))
  pg.evaluate("nav('help')");pg.wait_for_timeout(600)
  chk('help has the step','Fletching suggestion' in pg.content())
  wn=pg.evaluate("JSON.stringify((window.WHATSNEW||[])[0]||'')")
  V=pg.evaluate("fetch('version.json',{cache:'no-store'}).then(r=>r.json()).then(j=>j.version)")
  allwn=pg.evaluate("JSON.stringify(window.WHATSNEW||[])").lower()
  chk('release note present (on top while this is the newest release)',('fletching' in wn.lower()) if V.endswith('-ac5') else ('fletching' in allwn))
  pg.evaluate("localStorage.removeItem('scoretool.arrowchooser.nathe')")
  chk('old data unchanged',json.loads(pg.evaluate(OLD))==json.loads(before))
  chk('no console errors',not errs);errs and print(errs[:5])
  ctx.close();b.close()
if srv:srv.terminate()
print(f'{len(ok)} passed, {len(bad)} failed');bad and print('FAIL',bad)
sys.exit(1 if bad else 0)
