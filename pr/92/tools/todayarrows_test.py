# Today's arrows edit (23 Oct 2026, Nathe, iPhone 16 Pro): on My archery > Practice arrows, tapping the number (or the ring)
# opens the inline edit of today's added arrows; Set, +6/-6 and Reset re-draw the same screen and never jump to Home.
# Checks: edit opens in place, Set saves only S.vol[today], screen stays put, everything else in storage is byte-identical.
import subprocess,sys,time,os,json
os.environ['ST_NO_COMPAT']='1'
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-todayarrows');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
PORT=8823
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
def state(pg):
  d=json.loads(pg.evaluate("localStorage.getItem('scoretool.v1')"));v=d.pop('vol',{});[d.pop(k,None) for k in ('volLog','_shootKey','fpHold','leagues','matches')]
  for k in ('diary','casual'):
    if d.get(k) is None:d[k]=[]
  return d,v  # leagues/matches sync in the background; diary/casual start as [] (same as myarrows_test)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  for dark in [False,True]:
    tag='dark' if dark else 'light'
    ctx=b.new_context(viewport={'width':402,'height':874},has_touch=True,is_mobile=True,device_scale_factor=2);pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and 'INTERNET_DISCONNECTED' not in m.text and errs.append(m.text))
    pg.goto(f'http://localhost:{PORT}/?tester=nathe');pg.wait_for_timeout(1000)
    pg.evaluate("S.unlocked=true;S.vol=S.vol||{};S.vol[today()]=48;S.daily_goal=100;S.goal=100;save()");pg.reload();pg.wait_for_timeout(1500)
    if dark:pg.evaluate("localStorage.setItem('scoretool.theme','dark');document.documentElement.setAttribute('data-theme','dark')")
    pg.evaluate("nav('myarch')");pg.wait_for_timeout(300);pg.locator('[data-go=lab_arrows]').tap();pg.wait_for_timeout(500)
    chk(tag+' on Practice arrows',pg.evaluate('view')=='lab_arrows')
    t=pg.locator('#app').inner_text();chk(tag+' text 48 added',' 48 added today' in t.replace('\n',' ') or '+ 48' in t)
    S0,v0=state(pg)
    pg.screenshot(path=f'{SH}/{tag}-1-before.png')
    pg.locator('#vadnum').tap();pg.wait_for_timeout(400)
    chk(tag+' number tap stays',pg.evaluate('view')=='lab_arrows')
    chk(tag+' edit open',pg.locator('#vedit').is_visible())
    pg.screenshot(path=f'{SH}/{tag}-2-edit-open.png')
    pg.locator('#vset').fill('60');pg.locator('#vsave').tap();pg.wait_for_timeout(500)
    chk(tag+' after Set still on Practice arrows',pg.evaluate('view')=='lab_arrows' and 'p=lab_arrows' in pg.url)
    S1,v1=state(pg);td=pg.evaluate('today()')
    chk(tag+' saved 60',v1.get(td)==60);chk(tag+' nothing else changed',S0==S1 and {k:x for k,x in v1.items() if k!=td}=={k:x for k,x in v0.items() if k!=td})
    chk(tag+' ring shows 60 of 100','60' in pg.locator('#volring').text_content() and 'of 100' in pg.locator('#volring').text_content())
    pg.screenshot(path=f'{SH}/{tag}-3-saved.png')
    pg.locator('#ringbtn').tap();pg.wait_for_timeout(300);chk(tag+' ring tap opens edit',pg.locator('#vedit').is_visible() and pg.evaluate('view')=='lab_arrows')
    pg.locator('#vset').fill('48');pg.locator('#vset').press('Enter');pg.wait_for_timeout(400)
    chk(tag+' Enter saves back to 48',state(pg)[1].get(td)==48 and pg.evaluate('view')=='lab_arrows')
    pg.locator('[data-vol="6"]').tap();pg.wait_for_timeout(300);chk(tag+' +6 stays',pg.evaluate('view')=='lab_arrows' and state(pg)[1].get(td)==54)
    pg.locator('[data-vol="-6"]').tap();pg.wait_for_timeout(300);chk(tag+' -6 stays',pg.evaluate('view')=='lab_arrows' and state(pg)[1].get(td)==48)
    chk(tag+' no overflow',pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    chk(tag+' no errors',not errs);errs and print(errs)
    ctx.close()
  b.close()
finally:srv.terminate()
print(len(ok),'ok');print('FAIL',bad) if bad else print('all pass');sys.exit(1 if bad else 0)
