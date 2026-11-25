# AC1 (1 Nov 2026): the Arrow chooser uses the current saved bow without being asked (blank boxes read from it each time, nothing
# written on opening), lists bows that are only in Setups & sight marks, follows the saved bow when it changes, typed boxes win and a
# cleared box goes back to the bow's figure, 'None' keeps the figures; says which speed rating each chart uses (IBO / ATA);
# "Is this arrow right?" uses the saved bow's speed instead of the 340 fps default (defect L6). 390px, no console errors, old data unchanged.
# Test data only (a test bow added to the tester's own browser copy). BASE=<url> runs it against a deployed copy.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT=os.environ.get('PORT','8781');BASE=os.environ.get('BASE');URL=BASE or f'http://localhost:{PORT}/'
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
srv=None if BASE else subprocess.Popen([sys.executable,'-m','http.server',PORT],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
OLD="(()=>{const d=JSON.parse(localStorage.getItem('scoretool.v1')||'{}');return JSON.stringify({b:d.bows,s:d.sessions,t:d.tune,u:d.setup,sel:d.bowSel,spec:d.bowSpec,a:d.arrowInfo})})()"
KEY="localStorage.getItem('scoretool.arrowchooser.nathe')"
SEEDJS="""()=>{const d=JSON.parse(localStorage.getItem('scoretool.v1')||'{}');d.bows=(d.bows||[]).filter(x=>!['bAC1','bAC2'].includes(x.id));
 d.bows.push({id:'bAC1',archer:d.profile,name:'Test compound',extra:[],marks:{}},{id:'bAC2',archer:d.profile,name:'Test club recurve',extra:[],marks:{}});
 d.bowSpec=d.bowSpec||{};d.bowSpec.bAC1={type:'compound',make:'Hoyt',model:'Concept X 40',specId:'hoyt-cx40',speed:'327',kind:'ATA',dw:'58',dl:'29.5',bh:'7.25',ata:'40'};
 d.bowSel=d.bowSel||{};d.bowSel[d.profile]='bAC1';delete d.calc;localStorage.setItem('scoretool.v1',JSON.stringify(d));localStorage.removeItem('scoretool.arrowchooser.nathe')}"""
def setsel(pg,id):pg.evaluate("id=>{S.bowSel=S.bowSel||{};S.bowSel[S.profile]=id;save()}",id)
def chooser(pg):pg.evaluate("nav('lab_chooser')");pg.wait_for_timeout(500)
def fill(pg,k,v):pg.fill(f'#ac_{k}',str(v));pg.press(f'#ac_{k}','Tab');pg.wait_for_timeout(300)
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
  chk('opening writes nothing',pg.evaluate(OLD)==before and pg.evaluate(KEY) is None)
  chk('current bow preselected',pg.input_value('#ac_mybow')=='bAC1')
  chk('compound chosen from the bow',pg.locator('[data-seg=bow][data-val=compound][aria-pressed=true]').count()==1)
  chk('boxes filled from the bow',pg.input_value('#ac_ibo')=='327' and pg.input_value('#ac_dw')=='58' and pg.input_value('#ac_dl')=='29.5')
  ln=pg.inner_text('#acbowline') if pg.locator('#acbowline').count() else ''
  chk('says which bow and that ATA reads lower',ln.startswith('Using your current bow, Hoyt Concept X 40') and 'ATA 327 fps' in ln and 'lower than IBO' in ln)
  chk('chart results drawn',"Easton" in pg.inner_text('#app') and 'speed rating 327 fps' in pg.inner_text('#app'))
  t=pg.inner_text('#app')
  chk('which rating each chart uses',"Gold Tip's compound charts, IBO" in t and "Easton's hunting chart, ATA" in t)
  opts=pg.evaluate("[...document.querySelectorAll('#ac_mybow option')].map(o=>[o.value,o.textContent])")
  chk('setup-only bow listed',['bAC2','Test club recurve (no specs yet)'] in opts and opts[0][0]=='')
  chk('390px no sideways scroll',pg.evaluate("document.documentElement.scrollWidth")<=392)
  chk('no emoji',not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in t))
  # the saved bow changes (My bows edit) -> follows it
  pg.evaluate("()=>{S.bowSpec.bAC1.dw='60';save()}");chooser(pg)
  chk('follows a My bows change',pg.input_value('#ac_dw')=='60')
  setsel(pg,'bAC2');chooser(pg)
  chk('follows the current bow (setup only)',pg.input_value('#ac_mybow')=='bAC2' and pg.input_value('#ac_dw')=='' and 'No specs saved for Test club recurve' in pg.inner_text('#app'))
  setsel(pg,'bAC1');chooser(pg)
  fill(pg,'dw','62')
  chk('typed box wins',pg.input_value('#ac_dw')=='62' and pg.input_value('#ac_ibo')=='327')
  chk('only the typed box is stored',json.loads(pg.evaluate(KEY))=={'dw':'62'})
  fill(pg,'dw','')
  chk('cleared box goes back to the bow',pg.input_value('#ac_dw')=='60')
  pg.select_option('#ac_mybow','');pg.wait_for_timeout(500)
  chk('None keeps the figures',pg.input_value('#ac_mybow')=='' and pg.input_value('#ac_dw')=='60' and pg.input_value('#ac_ibo')=='327' and pg.locator('#acbowline').count()==0)
  pg.evaluate("()=>{S.bowSpec.bAC1.dw='64';save()}");chooser(pg)
  chk('None stops following',pg.input_value('#ac_dw')=='60')
  pg.select_option('#ac_mybow','bAC1');pg.wait_for_timeout(500)
  chk('picking the bow again fills from it',pg.input_value('#ac_dw')=='64' and pg.locator('#mbnote').count()==1)
  # L6: Is this arrow right? uses the saved bow's speed, not 340
  pg.evaluate("()=>{delete S.calc;save()}");pg.evaluate("nav('lab_calc')");pg.wait_for_timeout(600)
  ck=pg.inner_text('#ackcard') if pg.locator('#ackcard').count() else ''
  chk('L6: check uses the saved bow',"come from your saved bow, Hoyt Concept X 40 (327 fps)" in ck)
  pg.fill('#ack_spine','400');pg.dispatch_event('#ack_spine','change');pg.wait_for_timeout(300);pg.fill('#ack_pt','100');pg.dispatch_event('#ack_pt','change');pg.wait_for_timeout(400)
  v=pg.inner_text('#ackv')
  chk('L6: spine reading uses 327 fps',('327 fps' in v) and ('340 fps' not in v))
  pg.select_option('#c_mybow','bAC1');pg.wait_for_timeout(400)
  chk('picking a bow in Calculators: speed card wording',"come from the speed card" in pg.inner_text('#ackcard'))
  after=json.loads(pg.evaluate(OLD));bf=json.loads(before)
  chk('old data unchanged',all(after.get(k)==bf.get(k) for k in ('b','s','u','sel','a')) and (after.get('t') or [])==(bf.get('t') or []))
  chk('no console errors',not errs);errs and print(errs[:5])
  ctx.close();b.close()
if srv:srv.terminate()
print(f'{len(ok)} passed, {len(bad)} failed');bad and print('FAIL',bad)
sys.exit(1 if bad else 0)
