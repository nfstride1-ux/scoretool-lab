"""Lingkana #lk-register: 'Already registered' name suggestions (25 Nov 2026).
Needs LK_SNAPSHOT: a private copy of the live league (not in the repo). Nothing is posted to the relay."""
import json,os,subprocess,sys,time
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
snap=json.load(open(os.environ['LK_SNAPSHOT']))['data']['lg']
SHOT=os.environ.get('LK_SHOT','')
ok=[];bad=[]
def chk(n,c,x=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+(('  '+str(x)[:200]) if x and not c else ''),flush=True)
srv=subprocess.Popen([sys.executable,'-m','http.server','8993'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.6)
posts=[]
try:
 with sync_playwright() as p:
  exe=os.environ.get('CHROME','/usr/bin/google-chrome')
  b=p.chromium.launch(**({'executable_path':exe} if os.path.exists(exe) else {}),args=['--headless=new'])
  c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,service_workers='block',
    user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')
  def rt(r):
    u=r.request.url
    if 'ntfy.sh' in u:
      if r.request.method=='POST':posts.append(u)
      return r.fulfill(status=200,body='')
    if any(h in u for h in ['supabase','clarity','formsubmit']):return r.fulfill(status=200,body='{}')
    return r.continue_()
  c.route('**/*',rt)
  pg=c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
  pg.goto('http://127.0.0.1:8993/#lk-register');pg.wait_for_timeout(2500)
  pg.evaluate("s=>{const lg=lkEnsure();for(const k of ['reg','sc','grp','paid','pins','order','gn','weeks','drop','claim','fin'])if(k in s)lg[k]=JSON.parse(JSON.stringify(s[k]));save()}",snap)
  pg.evaluate("lkRegisterView()");pg.wait_for_timeout(400)
  names=pg.evaluate("lkKnownRegistrants(lkEnsure()).map(a=>a.name)")
  two=[n for n in names if ' ' in n]
  target=two[0] if two else names[0]
  first,last=target.split(' ')[0],target.split(' ')[-1]
  def typed(t):
    pg.fill('#lkretname','');pg.locator('#lkretname').press_sequentially(t,delay=30);pg.wait_for_timeout(200)
    return pg.evaluate("[...document.querySelectorAll('#lkretsugg [data-retname]')].map(b=>b.textContent)"),pg.evaluate("!document.getElementById('lkretsugg').hidden")
  s1,v1=typed(first[:1])
  chk('one letter: no list yet',s1==[] and not v1,s1)
  s2,v2=typed(first[:3].lower())
  chk('first 3 letters (any case) list the matching registered names',v2 and target in s2 and all(any(w.lower().startswith(first[:3].lower()) for w in [n]+n.split()) for n in s2),s2)
  if SHOT:pg.screenshot(path=SHOT,full_page=False)
  s3,v3=typed(last[:3])
  chk('start of a later word (surname) also matches',v3 and target in s3,s3)
  s4,v4=typed('zzq')
  chk('no match: no list',s4==[] and not v4,s4)
  typed(first[:3])
  pg.locator(f'#lkretsugg [data-retname="{target}"]').tap();pg.wait_for_timeout(300)
  chk('tap fills the exact registered name and closes the list',pg.input_value('#lkretname')==target and pg.evaluate("document.getElementById('lkretsugg').hidden"),pg.input_value('#lkretname'))
  chk('tap moves on to the PIN box',pg.evaluate("document.activeElement&&document.activeElement.id")=='lkretpin')
  pg.fill('#lkretpin','0000');pg.click('#lkretgo');pg.wait_for_timeout(1200)
  chk('then the PIN step runs for that name (wrong PIN refused here)','not right' in pg.inner_text('#lkretmsg') or 'Too many' in pg.inner_text('#lkretmsg') or 'No PIN' in pg.inner_text('#lkretmsg'),pg.inner_text('#lkretmsg'))
  chk('no page errors',not errs,errs)
  chk('nothing posted to the relay',not posts,posts)
  b.close()
finally:srv.terminate()
print(f'\n{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
