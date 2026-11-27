# Arrow chooser by use (23 Oct 2026): fat shafts only for Indoor, Hunting chart, inputs above the result,
# chart-weight working always shown (the "79 lb" report), neighbour sizes, Park notes; testers' data unchanged.
import subprocess,sys,time,os,json,re
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-arrowuse');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
srv=subprocess.Popen([sys.executable,'-m','http.server','8808'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
SNAP="(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('scoretool.arrowchooser.'))continue;let v=localStorage.getItem(k);if(k=='scoretool.v1'){const d=JSON.parse(v);delete d.leagues;delete d.matches;v=JSON.stringify(d)}o[k]=v}return o})()"
def start(b,w,h,dark=False):
  ctx=b.new_context(viewport={'width':w,'height':h},color_scheme='dark' if dark else 'light');pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto('http://localhost:8808/');pg.wait_for_timeout(1000);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
  for _ in range(3):
    if pg.locator('nav [data-v=home]').is_visible():break
    pg.locator('#app button').first.click();pg.wait_for_timeout(400)
  pg.add_style_tag(content='nav.tabs button:not([data-v=home]):not([data-v=score]):not([data-v=myarch]):not([data-v=clubs]):not([data-v=tools]){display:none!important}')
  if dark:pg.evaluate("document.documentElement.setAttribute('data-theme','dark')")
  return pg,errs
def fill(pg,k,v):pg.fill(f'#ac_{k}',str(v));pg.press(f'#ac_{k}','Tab');pg.wait_for_timeout(250)
def brand(pg,name):return pg.evaluate("n=>{const b=[...document.querySelectorAll('.acres .brand')].find(x=>x.querySelector('h3').textContent.trim().startsWith(n));return b?b.innerText:''}",name)
SKINNY=['X10','A/C/E','ACE','Superdrive Micro','SuperDrive Micro','Avance','Vector','ProTour','Parallel Pro']
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  for w,h,dark in [(390,844,False),(390,844,True),(1366,900,False)]:
    pg,errs=start(b,w,h,dark);tag=f'{w}px{" dark" if dark else ""}'
    pg.click('nav [data-v=tools]');pg.wait_for_timeout(500);before=pg.evaluate(SNAP)
    pg.get_by_text('Arrow chooser').first.click();pg.wait_for_timeout(500)
    chk(tag+' back button',pg.locator('.labbar .labback').count()==1)
    # Nathe's setup: Concept X, about 56 lb, 30", ATA 330, indoor, 140 gr
    pg.click('[data-seg=bow][data-val=compound]');pg.wait_for_timeout(200)
    fill(pg,'dw',56);fill(pg,'dl',30);fill(pg,'ibo',330);pg.click('[data-seg=use][data-val=indoor]');pg.wait_for_timeout(250);fill(pg,'pt',140)
    t=pg.inner_text('#app')
    chk(tag+' no emoji',not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in t))
    chk(tag+' five uses incl Hunting',pg.locator('[data-seg=use]').count()==5 and pg.locator('[data-seg=use][data-val=hunting]').count()==1)
    dia=pg.inner_text('#acdia');chk(tag+' diameter class shown','Large-diameter' in dia or 'large-diameter' in dia)
    e=brand(pg,'Easton')
    chk(tag+' working 65.8 shown','65.8' in e and '330 fps' in e and '140 gr' in e)
    chk(tag+' row 65-69','65-69' in e)
    chk(tag+' SD23 325 in range','SuperDrive 23 325' in e)
    chk(tag+' SD23 375 listed as neighbour','SuperDrive 23 375' in pg.inner_text('.acres .acnear'))
    chk(tag+' X27 2712','2712' in e)
    shafts=' '.join(pg.locator('.acres .acshaft').all_inner_texts())
    chk(tag+' no skinny shafts on Indoor',not any(k in shafts for k in SKINNY))
    chk(tag+' Gold Tip large-diameter list','30X' in brand(pg,'Gold Tip') and 'Triple X' in brand(pg,'Gold Tip'))
    chk(tag+' Park notes block',pg.locator('#acpark').count()==1 and 'Park' in pg.inner_text('#acpark'))
    # result below every input
    ys=pg.evaluate("(()=>{const r=document.querySelector('.acres').getBoundingClientRect().top+scrollY;const m=Math.max(...[...document.querySelectorAll('.acf input,.acf select,.acf [data-seg]')].filter(x=>x.checkVisibility()).map(x=>x.getBoundingClientRect().bottom+scrollY));return [r,m]})()")
    chk(tag+' result below all inputs',ys[0]>ys[1])
    order=pg.evaluate("['ac_dw','ac_dl','ac_ibo','ac_len','ac_pt'].map(i=>document.getElementById(i).getBoundingClientRect().top)")
    chk(tag+' input order dw,dl,ibo,(use),len,pt',order==sorted(order))
    if w==390:
      pg.screenshot(path=os.path.join(SH,f'01-inputs-{"dark" if dark else "light"}.png'))
      pg.evaluate("document.querySelector('.acres').scrollIntoView()");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,f'02-result-indoor-{"dark" if dark else "light"}.png'))
    # 31": SD25/SD27 in range
    fill(pg,'dl',31);e=brand(pg,'Easton');chk(tag+' 31in SD25 290 in range','SuperDrive 25 290' in e and 'SuperDrive 27 280' in e)
    # Outdoor target: skinny only
    fill(pg,'dl',30);pg.click('[data-seg=use][data-val=target]');pg.wait_for_timeout(250)
    shafts=' '.join(pg.locator('.acres .acshaft').all_inner_texts())
    chk(tag+' target has no fat shafts','SuperDrive 2' not in shafts and '2712' not in shafts and 'X10' in shafts)
    # Hunting
    pg.click('[data-seg=use][data-val=hunting]');pg.wait_for_timeout(250);e=brand(pg,'Easton')
    chk(tag+' hunting chart',('Axis' in e or 'FMJ' in e) and 'X10' not in e)
    chk(tag+' hunting working shown','Chart weight' in e)
    if w==390:pg.evaluate("document.querySelector('.acres').scrollIntoView()");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,f'03-result-hunting-{"dark" if dark else "light"}.png'))
    # off the chart: working still shown
    pg.click('[data-seg=use][data-val=target]');fill(pg,'dw',70);fill(pg,'ibo',360);fill(pg,'pt',140);e=brand(pg,'Easton')
    chk(tag+' off chart shows working','Not shown' in e and 'Chart weight' in e and 'top row' in e)
    after=pg.evaluate(SNAP);chk(tag+' testers data unchanged',before==after)
    chk(tag+' no console errors',not errs)
    if errs:print(errs[:5])
  b.close()
srv.terminate()
print('ok',len(ok));print('bad',bad)
