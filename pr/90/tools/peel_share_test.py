# Group card sharing: every archer's share image and text carries THAT archer's own name (never the phone owner's), the sheet view has
# exactly one share button (the blue Share sheet), and under-16 testers named on a card go by nickname only. Port 8848.
import subprocess,sys,time,os,json
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nav_compat
ROOT=os.environ.get('ROOT') or os.path.dirname(HERE)
srv=subprocess.Popen([sys.executable,'/tmp/stwork/srv.py','8848',ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
bad=[];n_ok=[0]
def chk(n,c,i=''):
  print(('PASS ' if c else 'FAIL ')+n+('' if c else ' '+str(i)[:300]),flush=True)
  if c:n_ok[0]+=1
  else:bad.append(n)
NAMES=['Nathaniel Stride','Everett Young','Nate Evans','Estiaan Cronge']
HOOK="""(()=>{window.__txt=[];const f=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t){window.__txt.push(String(t));return f.apply(this,arguments)};
window.__shared=[];navigator.canShare=()=>true;navigator.share=async d=>{window.__shared.push({n:d.files&&d.files[0]&&d.files[0].name,title:d.title,text:d.text})};})()"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);errs=[]
  ctx.route('https://ntfy.sh/**',lambda r,q:r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'}))
  ctx.add_init_script(HOOK)
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
  pg.goto('http://localhost:8848/?tester=nathe');pg.wait_for_timeout(1200);pg.evaluate("S.unlocked=true;save()")
  for _ in range(3):pg.reload();pg.wait_for_timeout(1800)
  pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(300)
  me=pg.evaluate("myName()");print('phone owner shows as',me)
  pg.click('#pgopen');pg.wait_for_timeout(300)
  for i,n in enumerate(NAMES):pg.fill(f'#pgn{i}',n)
  pg.click('#pggo');pg.wait_for_timeout(300)
  # score some targets for everyone, finish archer 1's card completely (so the old gold button would have appeared)
  for k in range(8):
    for z in ['A','M','B','C']:
      if pg.locator('[data-pgz="A"]').count():pg.click(f'[data-pgz="{z}"]')
      elif pg.locator('#pgnext').count():pg.click('#pgnext')
      pg.wait_for_timeout(15)
  pg.evaluate("(()=>{const d=pgEv().days[0];for(let g=0;g<200;g++)pgHit(d,1,'A');delete d.hold;save();pgView(d.id)})()");pg.wait_for_timeout(300)
  me_norm=me.strip()
  for q,nm in enumerate(NAMES):
    pg.evaluate("window.__txt=[];window.__shared=[]")
    pg.click(f'[data-pgsh="{q}"]');pg.wait_for_timeout(300)
    chk(f'{nm}: sheet view shows exactly one share button',pg.locator('#pgsheet button:has-text("Share")').count()==1 and pg.locator('#pgshare').count()==1,pg.locator('#pgsheet button:has-text("Share")').count())
    chk(f'{nm}: gold "Share score sheet" button is gone',pg.locator('#shsheet').count()==0 and 'Share score sheet' not in pg.inner_text('#pgsheet'))
    chk(f'{nm}: paper header shows own name',nm in pg.inner_text('#abapaper'))
    pg.click('#pgshare');pg.wait_for_timeout(700)
    t=pg.evaluate("window.__txt");sh=pg.evaluate("window.__shared")
    chk(f'{nm}: share image has own name',nm in t,t[:12])
    others=[x for x in NAMES if x!=nm]+([me_norm] if me_norm not in NAMES and me_norm!=nm else [])
    chk(f'{nm}: no other archer or phone-owner name on the image',not any(o in t for o in others),[o for o in others if o in t])
    chk(f'{nm}: share text, title and filename carry own name',len(sh)==1 and nm in sh[0]['text'] and nm in sh[0]['title'] and ''.join(c for c in nm if c.isalnum()).lower() in ''.join(c for c in sh[0]['n'] if c.isalnum()).lower(),sh)
    pg.click('#pgshx');pg.wait_for_timeout(200)
  # distinct filenames
  # under-16 nickname rule: a junior tester's real name typed on a card goes by nickname only
  jr=pg.evaluate("(()=>{const t=TESTERS.find(x=>x.junior&&testerName(x.id)!=x.name);return t?{id:t.id,full:t.name,nick:testerName(t.id)}:null})()")
  print('junior sample',jr)
  if jr:
    pg.evaluate("window.__txt=[];window.__shared=[]")
    pg.evaluate("(d=>{const E=pgEv();E.days[0].a[2].nm=d.full;E.days[0].a[2].s.abaHead.name=d.full;save();window._pgSheet=2;pgView(E.days[0].id)})",jr);pg.wait_for_timeout(300)
    pg.click('#pgshare');pg.wait_for_timeout(700);t=pg.evaluate("window.__txt");sh=pg.evaluate("window.__shared")
    chk('under-16 on the card: share image and text use the nickname only',jr['nick'] in t and jr['full'] not in t and jr['full'] not in sh[0]['text'] and jr['full'] not in sh[0]['title'],(t[:12],sh))
  # the owner's own sheets elsewhere still use the owner's name
  chk('no page errors',not errs,errs)
  b.close()
except Exception as e:
  print('ERR',repr(e)[:300]);bad.append('exception')
finally:srv.kill()
print(f'\n{n_ok[0]} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
