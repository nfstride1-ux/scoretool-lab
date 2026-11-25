# Half split + Averages follow the Personal bests pick (Coach recheck). nathe, steven, joseph at 390px; no console errors.
import subprocess,sys,time,os,re
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-fix1022')
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
srv=subprocess.Popen([sys.executable,'-m','http.server','8768'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
CASES={'nathe':('WA Indoor 18','559'),'joseph':('50/720','654'),'steven':(None,None)}
SNAP="(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return JSON.stringify(o)})()"
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  for who,(rs,sc) in CASES.items():
    ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    pg.goto('http://localhost:8768/');pg.wait_for_timeout(1200);nm_seed.pick(pg,who);pg.wait_for_timeout(500)
    if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
    for _ in range(3):
      if pg.locator('nav [data-v=home]').is_visible():break
      pg.locator('#app button').first.click();pg.wait_for_timeout(400)
    pg.add_style_tag(content='nav.tabs button:not([data-v=home]):not([data-v=score]):not([data-v=myarch]):not([data-v=clubs]):not([data-v=tools]){display:none!important}')
    pg.click('nav [data-v=myarch]');pg.wait_for_timeout(300);pg.click('[data-go=lab_analysis]');pg.wait_for_timeout(2500)
    s0=pg.evaluate(SNAP)
    if rs:
      v=pg.evaluate("rs=>{const o=[...document.querySelectorAll('#bssel option')].find(o=>o.value.includes(rs));return o?o.value:null}",rs)
      if v:pg.select_option('#bssel',v);pg.wait_for_timeout(1200)
      bt=pg.locator(f'[data-bsp$="|{sc}"]')
      if bt.count():bt.first.click();pg.wait_for_timeout(1200)
    else:
      bt=pg.locator('[data-bsp]')
      if bt.count()>1:bt.nth(1).click();pg.wait_for_timeout(1200)
    a=pg.evaluate("window._anSel")
    hs=pg.evaluate("(()=>{const c=[...document.querySelectorAll('.st-card')].find(x=>/half split/i.test(x.querySelector('.kicker').textContent));return c?c.innerText:''})()")
    av=pg.evaluate("(()=>{const c=[...document.querySelectorAll('.st-card')].find(x=>/^averages/i.test(x.querySelector('.kicker').textContent.trim()));return c?c.innerText:''})()")
    print(who,a);print(' HALF:',hs.replace('\n',' | ')[:260]);print(' AVG:',av.split('\n')[1] if av else '')
    d=a and a['d'];chk(who+' half split is the picked shoot',bool(d) and (d in hs or 'total only' in hs or 'partial' in hs))
    chk(who+' half split score',bool(a) and str(a['sc']) in hs or 'total only' in hs)
    chk(who+' averages label selected',bool(a) and str(a['sc']) in av)
    chk(who+' data unchanged',pg.evaluate(SNAP)==s0)
    c=pg.locator('.st-card',has_text='Half split').first
    if c.count():c.scroll_into_view_if_needed();pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(SH,f'halfsplit-{who}-390.png'))
    chk(who+' no console errors',not errs);errs and print(errs[:3])
    ctx.close()
  b.close()
srv.terminate();print('OK',len(ok));print('FAIL',bad)
