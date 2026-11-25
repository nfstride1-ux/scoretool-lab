# Test-only release (1 Nov 2026): every test that loads the app imports guard.py, so the ntfy.sh relay is stubbed and the service
# worker blocked in every browser context. Checks: (1) no app-loading test or tool is missing the import; (2) a plain new_context()
# and a plain new_page() both get the relay stubbed (a send never leaves the machine) and no service worker; (3) a test that asks
# for service_workers='allow' keeps it; (4) field_faces_test exits non-zero when a check fails.
import subprocess,sys,os,glob,time
from playwright.sync_api import sync_playwright
import guard,freeport
T=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.dirname(T);ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n,flush=True)
miss=[os.path.basename(f) for f in sorted(glob.glob(T+'/*.py')) if 'goto(' in open(f,encoding='utf-8').read() and not os.path.basename(f).startswith('_') and '\nimport guard' not in open(f,encoding='utf-8').read()]
chk('every app-loading test imports guard (missing: %s)'%(', '.join(miss) or 'none'),not miss)
src=open(T+'/field_faces_test.py',encoding='utf-8').read()
chk('field_faces_test exits non-zero on a failed check',"sys.exit(1 if bad else 0)" in src)
PORT=freeport.get();srv=subprocess.Popen([sys.executable,'-m','http.server',PORT,'--bind','127.0.0.1','--directory',ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
NET=[]
SEND="fetch('https://ntfy.sh/scoretool-guard-check',{method:'POST',body:'x'}).then(r=>r.status).catch(e=>'error')"
REG="navigator.serviceWorker.getRegistration().then(r=>!!r)"
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for how in ('new_context','new_page'):
      if how=='new_context':ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page()
      else:pg=b.new_page(viewport={'width':390,'height':844});ctx=pg.context
      pg.on('request',lambda r:NET.append(r.url))
      pg.goto(f'http://127.0.0.1:{PORT}/?tester=nathe');pg.wait_for_timeout(2500)
      n0=len(guard.STUBBED);st=pg.evaluate(SEND)
      chk(f'{how}: a relay send is answered by the stub (status {st}), not the real relay',st==200 and len(guard.STUBBED)>n0)
      chk(f'{how}: no service worker registered',pg.evaluate(REG) is False)
      ctx.close()
    ctx=b.new_context(viewport={'width':390,'height':844},service_workers='allow');pg=ctx.new_page()
    pg.goto(f'http://127.0.0.1:{PORT}/?tester=nathe')
    pg.wait_for_timeout(1000)
    on=pg.evaluate("Promise.race([navigator.serviceWorker.ready.then(()=>true),new Promise(r=>setTimeout(()=>r(false),8000))])")
    chk("service_workers='allow' is kept (offline_test)",on is True)
    ctx.close();b.close()
finally:srv.terminate()
print(f'TOTAL {len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
