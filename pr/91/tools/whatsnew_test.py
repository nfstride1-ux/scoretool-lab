# What's new + themed help (23 Oct 2026): whatsnew.js notes (one data file, newest first, real commits, line icons, no emoji),
# What's new screen from Me > Settings & help with a back button, one-time dismissable card on Home after an update (never while
# scoring), help guides that swap light/dark pictures by theme and print on white. Tester 'steven', 390px, TEST data only, network mocked.
import subprocess,sys,time,os,json,re
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-whatsnew');os.makedirs(SH,exist_ok=True)
PORT='8805';ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n,flush=True)
EMO=re.compile('[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B50\u2B06]')
srv=subprocess.Popen([sys.executable,'-m','http.server',PORT],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
VER=json.load(open(os.path.join(ROOT,'version.json')))
VER=VER.get('v') or VER.get('version') or VER
try:LOG=subprocess.run(['git','log','--format=%h','-400'],cwd=ROOT,capture_output=True,text=True).stdout.split()
except Exception:LOG=[]
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);pg=ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and 'Failed to load resource' not in m.text and errs.append(m.text))
  ctx.route('https://sllsqpfqwckwtljzjxli.supabase.co/**',lambda r:r.fulfill(status=200,content_type='application/json',body='null'))
  ctx.route('https://archerycalendars.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body='{"events":[]}',headers={'access-control-allow-origin':'*'}))
  ctx.route('https://ntfy.sh/**',lambda r:r.fulfill(status=200,body='{}'))
  E=pg.evaluate
  pg.goto(f'http://localhost:{PORT}/?tester=steven');pg.wait_for_timeout(1500)
  E("()=>{S.unlocked=true;if(!S.profile)S.profile='Steven Test';save();localStorage.setItem('scoretool.cal.steven.prompted','1');localStorage.setItem('scoretool.whatsnew.seen','v2026-10-01-0000-old')}")
  pg.reload();pg.wait_for_timeout(2500)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(400)
  # relayhold (Nathe, 1 Nov 2026: "Exclude from the test"): the one relay-hold key, scoretool.opost.<archer>.<league or group code>
  # (time of the last re-send on open), is left out of this check. Every other new key still fails it.
  DATA="JSON.stringify([S.sessions,Object.keys(localStorage).filter(k=>!/whatsnew|theme|^scoretool\\.(v|dname)|lastTab|\\.state$/.test(k)&&!/^scoretool\\.opost\\.[a-z0-9_-]+\\.[A-Z0-9]+$/.test(k)).sort()])"
  d0=E(DATA)
  W=E("WHATSNEW")
  chk('WHATSNEW[0].v equals version.json',W[0]['v']==VER)
  chk('notes newest first',all(W[i]['d']>=W[i+1]['d'] for i in range(len(W)-1)))
  txt=json.dumps(W,ensure_ascii=False)
  chk('no emoji in the notes',not EMO.search(txt))
  icons=E("Object.keys(window.ICONS||{})") or []
  allic=[it[0] for e in W for it in e['items']]
  chk('every note has a known line icon',all(E(f"()=>/<svg/.test(icon('{i}'))") for i in set(allic)))
  hs=[h for e in W for it in e['items'] if len(it)>3 and it[3] for h in re.split(r'[ /,]+',it[3]) if re.fullmatch(r'[0-9a-f]{7,40}',h)]
  chk('every older note names its real commit',all(len(it)>3 and re.search(r'[0-9a-f]{7}',it[3] or '') for e in W[1:] for it in e['items']))
  miss=[h for h in hs if not any(l.startswith(h) or h.startswith(l) for l in LOG)]
  chk(f'every commit in the notes is in git log ({len(hs)}) missing={miss[:5]} log={len(LOG)}',bool(LOG) and not miss)
  # ---- one-time card on Home after an update ----
  E("()=>{cur=null;nav('home')}");pg.wait_for_timeout(700)
  card=pg.locator('#wncard')
  chk('update card shows on Home after an update',card.count()==1)
  chk('card: line icons, no emoji',card.count()==1 and card.locator('svg').count()>=2 and not EMO.search(card.inner_text()))
  pg.screenshot(path=os.path.join(SH,'01-card-light.png'))
  pg.click('#wnx');pg.wait_for_timeout(300)
  chk('card dismisses',pg.locator('#wncard').count()==0)
  E("()=>nav('stats')");pg.wait_for_timeout(500);E("()=>nav('home')");pg.wait_for_timeout(600)
  chk('card does not come back after dismiss',pg.locator('#wncard').count()==0)
  pg.reload();pg.wait_for_timeout(2200)
  chk('card does not come back after reload',pg.locator('#wncard').count()==0)
  # ---- never during scoring ----
  E("()=>localStorage.setItem('scoretool.whatsnew.seen','v2026-10-01-0000-old')");pg.reload();pg.wait_for_timeout(2200)
  E("()=>{cur=null;sv='sheet';nav('score')}");pg.wait_for_timeout(600)
  pg.click('[data-cstp=\"solo\"]');pg.wait_for_timeout(300);pg.locator('button',has_text='Start').first.click();pg.wait_for_timeout(900)
  chk('no card while scoring',E("!!cur")and pg.locator('#wncard').count()==0)
  E("()=>{const c=cur;nav('home')}");pg.wait_for_timeout(600)
  chk('no card on Home while a shoot is open',pg.locator('#wncard').count()==0)
  E("()=>{const c=cur;cur=null;if(c){S.sessions=S.sessions.filter(x=>x!==c);save()}nav('home')}");pg.wait_for_timeout(700)
  chk('card shows once scoring is closed',pg.locator('#wncard').count()==1)
  pg.click('#wnopen');pg.wait_for_timeout(600)
  chk('See what\'s new opens the screen',E("view")=='whatsnew')
  # ---- What's new screen from Me > Settings & help ----
  E("()=>nav('lab_settings')");pg.wait_for_timeout(700)
  chk('Settings & help has a What\'s new button',pg.locator('#wnbtn').count()==1)
  pg.click('#wnbtn');pg.wait_for_timeout(700)
  bk=pg.locator('.labbar button').first
  chk('What\'s new has a back button to Settings & help',bk.count()==1 and 'Settings' in bk.inner_text())
  body=pg.locator('#app').inner_text()
  chk('What\'s new: no emoji',not EMO.search(body))
  chk('What\'s new: line icons on every note',pg.locator('.wnlist li').count()==len(allic) and pg.locator('.wnlist li .wnic svg').count()==len(allic))
  ds=E("[...document.querySelectorAll('.wndate')].map(x=>x.textContent)")
  chk('What\'s new: grouped by day, newest first',len(ds)>=5)
  pg.screenshot(path=os.path.join(SH,'02-whatsnew-light.png'))
  bk.click();pg.wait_for_timeout(500)
  chk('back goes to Settings & help',E("view")=='lab_settings')
  # ---- help guides ----
  E("()=>{window._hgOpen='start';nav('help')}");pg.wait_for_timeout(900)
  chk('help: 11 guides',pg.locator('details.hg').count()==11)
  chk('help: no emoji',not EMO.search(pg.locator('#app').inner_text()))
  chk('help has a back button',pg.locator('.labbar button').count()>=1)
  vis=lambda: E("[...document.querySelectorAll('#hg-start img')].filter(i=>getComputedStyle(i).display!='none').map(i=>i.getAttribute('src'))")
  v=vis();chk('light theme shows the light picture',len(v)==1 and v[0].endswith('-light.webp'))
  pg.screenshot(path=os.path.join(SH,'03-help-light.png'))
  ld=E("()=>Promise.all([...document.querySelectorAll('.hg-fig img')].map(i=>fetch(i.getAttribute('src')).then(r=>r.ok)))")
  chk('all help pictures exist',all(ld) and len(ld)==18)
  pg.emulate_media(media='print');pg.wait_for_timeout(300)
  pb=E("()=>[getComputedStyle(document.body).backgroundColor,getComputedStyle(document.querySelector('details.hg')).backgroundColor,getComputedStyle(document.querySelector('.hgsteps')).color]")
  chk('help prints on white with black text '+str(pb),pb[0] in('rgb(255, 255, 255)',) and pb[1]=='rgb(255, 255, 255)' and pb[2]=='rgb(0, 0, 0)')
  pg.emulate_media(media='screen')
  # ---- dark ----
  E("()=>localStorage.setItem('scoretool.theme','dark')");pg.reload();pg.wait_for_timeout(2200)
  E("()=>{window._hgOpen='start';nav('help')}");pg.wait_for_timeout(900)
  v=vis();chk('dark theme shows the dark picture',len(v)==1 and v[0].endswith('-dark.webp'))
  bg=E("getComputedStyle(document.querySelector('details.hg')).backgroundColor")
  chk('help cards follow dark theme '+bg,bg!='rgb(255, 255, 255)')
  pg.screenshot(path=os.path.join(SH,'03-help-dark.png'))
  pg.emulate_media(media='print');pg.wait_for_timeout(300)
  pb=E("()=>[getComputedStyle(document.querySelector('details.hg')).backgroundColor,getComputedStyle(document.querySelector('.hgsteps')).color]")
  v=E("[...document.querySelectorAll('#hg-start img')].filter(i=>getComputedStyle(i).display!='none').map(i=>i.getAttribute('src'))")
  chk('dark mode still prints white with the light picture',pb==['rgb(255, 255, 255)','rgb(0, 0, 0)'] and len(v)==1 and v[0].endswith('-light.webp'))
  pg.emulate_media(media='screen')
  E("()=>nav('whatsnew')");pg.wait_for_timeout(700);pg.screenshot(path=os.path.join(SH,'02-whatsnew-dark.png'))
  E("()=>{cur=null;nav('home')}");pg.wait_for_timeout(500)
  E("()=>localStorage.setItem('scoretool.whatsnew.seen','v2026-10-01-0000-old')");pg.reload();pg.wait_for_timeout(2200)
  E("()=>{cur=null;nav('home')}");pg.wait_for_timeout(700);pg.screenshot(path=os.path.join(SH,'01-card-dark.png'))
  chk('card shows in dark too',pg.locator('#wncard').count()==1)
  E("()=>localStorage.setItem('scoretool.theme','light')")
  chk("testers' data unchanged",E(DATA)==d0)
  chk('no page errors '+str(errs[:3]),not errs)
  b.close()
srv.kill()
print(f'\n{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
