# App shell: tab bar on the viewport bottom on every tab after scrolling to the end, last content visible above it,
# plotter and full-screen modal still work. 390x844, Chrome (desktop + touch).
import subprocess,sys,time,os
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
import freeport;PORT=freeport.get()   # ST_PORT or a free port, never a fixed one
srv=subprocess.Popen([sys.executable,'-m','http.server',PORT],cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
GEO="""(()=>{const n=document.getElementById('tabs').getBoundingClientRect(),sc=document.getElementById('scroller'),k=[...sc.querySelectorAll('#app *')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height>0),last=k[k.length-1],foot=sc.lastElementChild.getBoundingClientRect();
return {nb:Math.round(n.bottom),nt:Math.round(n.top),h:innerHeight,disp:getComputedStyle(document.getElementById('tabs')).display,st:sc.scrollTop,max:sc.scrollHeight-sc.clientHeight,lastB:last?Math.round(last.getBoundingClientRect().bottom):0,footB:Math.round(foot.bottom),doc:document.documentElement.scrollTop+document.body.scrollTop,sy:scrollY}})()"""
def run(b,tag,mobile):
  ctx=b.new_context(viewport={'width':390,'height':844},has_touch=mobile,is_mobile=mobile) if mobile else b.new_context(viewport={'width':390,'height':844})
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto('http://localhost:'+PORT+'/');pg.wait_for_timeout(1000);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500);pg.evaluate("S.unlocked=true;save();render()");pg.wait_for_timeout(500)
  for _ in range(3):
    if pg.locator('nav [data-v=home]').is_visible():break
    pg.locator('#app button').first.click();pg.wait_for_timeout(400)
  for v in ['home','score','stats','rewards','follow','diary','me']:
    pg.click(f'nav [data-v={v}]');pg.wait_for_timeout(800)
    g=pg.evaluate(GEO);chk(f'{tag} {v} starts at top',g['st']==0)
    pg.mouse.move(195,400);
    for _ in range(40):pg.mouse.wheel(0,600)
    pg.wait_for_timeout(400);g=pg.evaluate(GEO)
    chk(f'{tag} {v} nav bottom = viewport bottom',g['nb']==g['h'] and g['disp']!='none')
    chk(f'{tag} {v} scrolled to end inside shell',g['max']<=0 or abs(g['st']-g['max'])<=1)
    chk(f'{tag} {v} window never scrolls',g['doc']==0)
    chk(f'{tag} {v} last content above nav',g['lastB']<=g['nt'] and g['footB']<=g['nt'])
    chk(f'{tag} {v} scrollY shim',g['sy']==g['st'])
  # scrollTo shim + scroll listeners
  pg.click('nav [data-v=stats]');pg.wait_for_timeout(600);pg.evaluate("window._sc=0;addEventListener('scroll',()=>window._sc++);scrollTo(0,300)");pg.wait_for_timeout(200)
  chk(f'{tag} scrollTo moves content + fires scroll',pg.evaluate("__scroller.scrollTop>0&&window._sc>0"))
  # plotter: start a round, tap the face, page must not scroll while plotting
  pg.click('nav [data-v=score]');pg.wait_for_timeout(500);pg.select_option('#rd',index=1);pg.click('#st');pg.wait_for_timeout(700)
  g0=pg.evaluate(GEO);bx=pg.locator('#pface').bounding_box()
  chk(f'{tag} plotter face fully above nav',bx and bx['y']+bx['height']<=g0['nt'])
  pg.mouse.click(bx['x']+bx['width']/2,bx['y']+bx['height']/2);pg.wait_for_timeout(300)
  chk(f'{tag} plot adds arrow',pg.evaluate('cur.ends.flat().length')==1)
  chk(f'{tag} keypad above nav',pg.evaluate("(()=>{const p=document.querySelector('.ad-pad').getBoundingClientRect();return p.bottom<=document.getElementById('tabs').getBoundingClientRect().top})()"))
  # help guides (23 Oct 2026: the old full-screen poster images were replaced by themed guide cards)
  pg.evaluate("()=>{window._hgOpen=null;nav('help')}");pg.wait_for_timeout(600);pg.locator('details.hg summary').nth(1).click();pg.wait_for_timeout(400)
  m=pg.evaluate("(()=>{const d=document.querySelectorAll('details.hg')[1],r=d.getBoundingClientRect(),i=[...d.querySelectorAll('img')].find(x=>getComputedStyle(x).display!='none');return [d.open,r.width<=innerWidth+1,!!i]})()")
  chk(f'{tag} help guide opens and fits',m[0] and m[1] and m[2]);pg.locator('details.hg summary').nth(1).click();pg.wait_for_timeout(200)
  chk(f'{tag} help guide closes',not pg.evaluate("document.querySelectorAll('details.hg')[1].open"))
  if mobile:
    pg.click('nav [data-v=follow]');pg.wait_for_timeout(500);inp=pg.locator('#app input[type=text],#app input:not([type]),#app input[type=search]').first
    if inp.count():inp.click();pg.wait_for_timeout(150);hid=pg.evaluate(GEO)['disp']=='none';pg.evaluate('document.activeElement.blur()');pg.wait_for_timeout(200);g=pg.evaluate(GEO);chk(f'{tag} bar hides while typing, back after',hid and g['disp']!='none' and g['nb']==g['h'])
  chk(f'{tag} no console errors',not errs);errs and print(errs[:3])
  ctx.close()
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);run(b,'chrome',False);run(b,'chrome-touch',True);b.close()
finally: srv.terminate()
print('nav checks: PASS',len(ok),'FAIL',len(bad),bad[:10]);sys.exit(1 if bad else 0)
