# Arrow chooser: 390px and 1366px, no console errors, chart look-ups for a 40# recurve at 28" and a 60# compound at 29",
# FOC, hand-off into Calculators, tuning snapshot + bare-shaft next step; testers' stored data unchanged by the chooser itself.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-fix1022')
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
srv=subprocess.Popen([sys.executable,'-m','http.server','8766'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
# the app's own league sync / match list tidy-up runs on every render (any screen), so those two fields are left out of the comparison
SNAP="(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('scoretool.arrowchooser.'))continue;let v=localStorage.getItem(k);if(k=='scoretool.v1'){const d=JSON.parse(v);delete d.leagues;delete d.matches;v=JSON.stringify(d)}o[k]=v}return o})()"
def start(b,w,h):
  ctx=b.new_context(viewport={'width':w,'height':h});pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto('http://localhost:8766/');pg.wait_for_timeout(1000);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
  for _ in range(3):
    if pg.locator('nav [data-v=home]').is_visible():break
    pg.locator('#app button').first.click();pg.wait_for_timeout(400)
  pg.add_style_tag(content='nav.tabs button:not([data-v=home]):not([data-v=score]):not([data-v=myarch]):not([data-v=clubs]):not([data-v=tools]){display:none!important}')
  return pg,errs
def fill(pg,k,v):pg.fill(f'#ac_{k}',str(v));pg.press(f'#ac_{k}','Tab');pg.wait_for_timeout(250)
def brand(pg,name):return pg.evaluate("n=>{const b=[...document.querySelectorAll('.acres .brand')].find(x=>x.querySelector('h3').textContent.trim().startsWith(n));return b?b.innerText.toLowerCase():''}",name)
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  for w,h in [(390,844),(1366,900)]:
    pg,errs=start(b,w,h);tag=f'{w}px'
    pg.click('nav [data-v=tools]');pg.wait_for_timeout(500);chk(tag+' Tools has Arrow chooser',pg.get_by_text('Arrow chooser').count()>0)
    before=pg.evaluate(SNAP)
    pg.get_by_text('Arrow chooser').first.click();pg.wait_for_timeout(500)
    chk(tag+' back button',pg.locator('.labbar .labback').count()==1)
    chk(tag+' no emoji',not any(ord(c)>0x1F000 for c in pg.inner_text('#app')))
    if w==390:pg.screenshot(path=os.path.join(SH,'arrowchooser-390.png'),full_page=False)
    # 40# recurve, 28", 100 gr
    pg.click('[data-seg=bow][data-val=recurve]');pg.wait_for_timeout(200);fill(pg,'dw',40);fill(pg,'dl',28);fill(pg,'pt',100)
    e=brand(pg,'Easton');g=brand(pg,'Gold Tip');s=brand(pg,'Skylon');v=brand(pg,'Victory')
    chk(tag+' recurve Easton 640-570',('640-570' in e) and ('40-43' in e));chk(tag+' recurve Easton X10 600',('x10 600' in e) and ('a/c/e 620' in e) and ('a/c/e 570' in e))
    chk(tag+' recurve Gold Tip 500',g.split('\n')[1].strip()=='500');chk(tag+' recurve Skylon A5 700-650',('a5' in s) and ('700-650' in s))
    chk(tag+' recurve Victory left out','not shown' in v)
    chk(tag+' starting-point warning',pg.get_by_text('A starting point only').count()==1)
    if w==390:
      pg.locator('.acres').scroll_into_view_if_needed();pg.evaluate("document.querySelector('.acres').scrollIntoView()");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,'arrowchooser-result-390.png'))
    # pick X10 600 and FOC components
    pg.locator('.acshaft',has_text='X10 600').first.click();pg.wait_for_timeout(300)
    pg.click('#acfoc summary');pg.wait_for_timeout(200)
    fill(pg,'ins',0);fill(pg,'nock',6);fill(pg,'vanes',12);fill(pg,'vpos',1.5)
    foc=pg.inner_text('#acfocres');tw=7.0*28+100+6+12
    A=(7.0*28*14+100*28+12*1.5)/tw;F=100*(A-14)/28
    chk(tag+f' FOC worked out {F:.1f}',f'{F:.1f}%' in foc);chk(tag+f' total weight {round(tw)}',f'{round(tw)} gr' in foc)
    if w==390:pg.evaluate("document.getElementById('acfocout').scrollIntoView({block:'center'})");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,'arrowchooser-foc-390.png'))
    after=pg.evaluate(SNAP);chk(tag+' chooser leaves testers data unchanged',before==after)
    # hand-off
    pg.click('#acuse');pg.wait_for_timeout(500)
    chk(tag+' in Calculators',pg.locator('.labbar h1').inner_text().strip().lower()=='calculators')
    chk(tag+' hand-off note',pg.locator('#acfrom').count()==1)
    chk(tag+' calc length 28',pg.input_value('#c_len')=='28');chk(tag+f' calc weight {round(tw)}',pg.input_value('#c_gr')==str(round(tw)) and pg.input_value('#c_grU')==str(round(tw)))
    chk(tag+f' calc FOC {F:.1f}',f'{F:.1f}%' in pg.inner_text('#app'))
    # 60# compound at 29", IBO 310 (Easton/Victory base), 100 gr
    pg.evaluate("nav('lab_chooser')");pg.wait_for_timeout(400)
    pg.click('[data-seg=bow][data-val=compound]');pg.wait_for_timeout(200);fill(pg,'dw',60);fill(pg,'dl',29);fill(pg,'ibo',310)
    e=brand(pg,'Easton');g=brand(pg,'Gold Tip');s=brand(pg,'Skylon');v=brand(pg,'Victory')
    chk(tag+' compound Easton 400-340',('400-340' in e) and ('60-64' in e) and ('superdrive micro 375' in e))
    chk(tag+' compound Gold Tip 340',g.split('\n')[1].strip()=='340');chk(tag+' compound Victory 400',v.split('\n')[1].strip()=='400')
    chk(tag+' compound Skylon A11',('a11' in s))
    pg.locator('.acshaft',has_text='X10 Parallel Pro 3.2mm 380').first.click();pg.wait_for_timeout(300)
    pg.click('#acuse');pg.wait_for_timeout(500)
    chk(tag+' compound calc dw/dl/ibo',pg.input_value('#c_dw')=='60' and pg.input_value('#c_dl')=='29' and pg.input_value('#c_ibo')=='310')
    # tuning: back to recurve setup, bare-shaft session with snapshot
    pg.evaluate("nav('lab_chooser')");pg.wait_for_timeout(300);pg.click('[data-seg=bow][data-val=recurve]');fill(pg,'dw',40);fill(pg,'dl',28)
    pg.locator('.acshaft',has_text='X10 600').first.click();pg.wait_for_timeout(300)
    pg.evaluate("nav('lab_opt')");pg.wait_for_timeout(400)
    chk(tag+' use my arrow setup offered',pg.locator('#tarw').count()==1)
    pg.select_option('#tc','Bare shaft vs fletched');pg.fill('#td','18m');pg.select_option('#tf','122cm');pg.click('#tgo');pg.wait_for_timeout(400)
    face=pg.locator('#tface').bounding_box();cx=face['x']+face['width']/2;cy=face['y']+face['height']/2;u=face['width']/2.1
    for dx,dy in [(-.04,0),(.04,.02),(0,-.03)]:pg.mouse.click(cx+dx*u,cy+dy*u);pg.wait_for_timeout(150)
    pg.click('[data-g=after]');pg.wait_for_timeout(200)
    # the page re-renders after the switch, so measure the face again before plotting
    face=pg.locator('#tface').bounding_box();cx=face['x']+face['width']/2;cy=face['y']+face['height']/2;u=face['width']/2.1
    for dx,dy in [(.35,0),(.38,.02)]:pg.mouse.click(cx+dx*u,cy+dy*u);pg.wait_for_timeout(150)
    t=pg.inner_text('#app').lower()
    chk(tag+' reads weak','reads this as weak' in t and 'next step to try' in t);chk(tag+' next step FOC shown','FOC ' in pg.inner_text('#nextcard'))
    chk(tag+' setup in session','arrow setup' in t and 'x10 600' in t)
    # change point weight, then record After
    pg.evaluate("nav('lab_chooser')");pg.wait_for_timeout(300);fill(pg,'pt',120);pg.evaluate("nav('lab_opt')");pg.wait_for_timeout(400)
    pg.click('#tarwafter');pg.wait_for_timeout(300);t=pg.inner_text('#app')
    chk(tag+' what changed point','100 gr → 120 gr' in t)
    if w==390:pg.evaluate("document.getElementById('barecard').scrollIntoView()");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,'arrowchooser-tuning-390.png'))
    st=pg.evaluate("JSON.stringify(S.tune.slice(-1)[0])");js=json.loads(st);chk(tag+' snapshot fields on new session only','arrow' in js and 'arrowAfter' in js and js.get('hand')=='R')
    old=pg.evaluate("S.tune.slice(0,-1).filter(t=>t&&(t.arrow||t.arrowAfter)).length");chk(tag+' old sessions untouched',old==0)
    chk(tag+' no console errors',not errs)
    if errs:print(errs[:5])
  b.close()
srv.terminate()
print('ok',len(ok));print('bad',bad)
