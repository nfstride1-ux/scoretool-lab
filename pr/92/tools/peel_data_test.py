# Saved data safety for the Peel group card: (1) opening the card, scrolling and viewing never writes anything (raw storage byte-identical
# for an existing seeded Day 1 + in-progress Day 2); (2) a fixed tap sequence stores exactly the same scores as the version of peel.js it is
# compared against (run with CMP=<other checkout> to diff two checkouts; without it only (1) runs). Port 8846.
import subprocess,sys,time,os,re,json
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nav_compat
ROOT=os.path.dirname(HERE);CMP=os.environ.get('CMP')
ok=[];bad=[]
def chk(n,c,i=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+(' '+str(i)[:300] if not c else ''),flush=True)
NAMES=['Nathaniel Stride','Everett Young','Nate Evans','Estiaan Cronge']
SEQ=['A','M','B','M','M','C','M','M','M','B','A','A','C','M','B','C']*6
def run(root,port):
  srv=subprocess.Popen([sys.executable,'-m','http.server',str(port)],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
  out={}
  try:
   with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    ctx.route('https://ntfy.sh/**',lambda r,q:r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'}))
    ctx.add_init_script("(()=>{let t=1790000000000;Date.now=()=>(t+=1)})()")
    pg=ctx.new_page();pg.on('dialog',lambda d:d.accept());errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(f'http://localhost:{port}/?tester=nathe');pg.wait_for_timeout(1200);pg.evaluate("S.unlocked=true;save()")
    for _ in range(3):pg.reload();pg.wait_for_timeout(1800)
    pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(300)
    pg.click('#pgopen');pg.wait_for_timeout(300)
    for i,n in enumerate(NAMES):pg.fill(f'#pgn{i}',n)
    pg.click('#pggo');pg.wait_for_timeout(300)
    # existing in-progress data: score 30 taps (leaves a hold mid-way)
    for z in SEQ[:30]:
      pg.click(f'[data-pgz="{z}"]') if pg.locator(f'[data-pgz="{z}"]').count() else pg.click('#pgnext');pg.wait_for_timeout(20)
    raw=lambda:pg.evaluate("localStorage.getItem(KEY)")
    r0=raw()
    # view only: reload, open the card, scroll about, open a sheet and close it, switch day tabs
    pg.reload();pg.wait_for_timeout(1800);pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(300);pg.click('#pgopen');pg.wait_for_timeout(300)
    pg.evaluate("__scroller.scrollTop=400");pg.evaluate("__scroller.scrollTop=0")
    pg.click('[data-pgsh="1"]');pg.wait_for_timeout(100);pg.click('#pgshx');pg.wait_for_timeout(100)
    out['view_same']=(raw()==r0)
    # finish the sequence
    n=0
    while pg.evaluate("!pgAllDone(pgEv().days[0])") and n<500:
      z=SEQ[(30+n)%len(SEQ)];n+=1
      pg.click(f'[data-pgz="{z}"]') if pg.locator(f'[data-pgz="{z}"]').count() else pg.click('#pgnext');pg.wait_for_timeout(15)
    out['peel']=pg.evaluate("JSON.stringify(S.peel.days.map(d=>d.a.map(x=>({nm:x.nm,ends:x.s.ends,aba:x.s.aba,fin:!!x.s.finished}))))")
    out['sessions']=pg.evaluate("JSON.stringify(S.sessions.length)")
    out['errs']=errs;b.close()
  finally:srv.kill()
  return out
a=run(ROOT,8846)
chk('opening the card, scrolling and viewing a sheet writes nothing (raw storage identical)',a['view_same'])
chk('no page errors',not a['errs'],a['errs'])
if CMP:
  c=run(CMP,8847)
  chk('same tap sequence stores identical scores/arrows to the comparison version',a['peel']==c['peel'] and len(a['peel'])>10,(a['peel'][:200],c['peel'][:200]))
  chk('own sessions count same as comparison',a['sessions']==c['sessions'])
print(f'\n{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
