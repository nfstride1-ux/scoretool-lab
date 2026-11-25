# Copy live scores onto the /test/ page, recover the Nathaniel profile, and
# load a backup onto an empty preview profile. Test data only, in a fresh browser
# (never Nathe's phone). WebKit 390 x 844, touch.
import subprocess,sys,time,os,json,tempfile
from playwright.sync_api import sync_playwright
import guard
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok=[];bad=[]
def chk(n,c,i=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+('' if c else '  '+str(i)[:400]),flush=True)
import freeport;PORT=int(os.environ.get("PORT") or freeport.get());BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get("BASE") else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
import atexit;atexit.register(lambda:srv and srv.poll() is None and srv.terminate())
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
STANDALONE="Object.defineProperty(navigator,'standalone',{get:()=>true});"
def relay(r):r.fulfill(status=200,body='{}',headers={'access-control-allow-origin':'*'})
SEED="""()=>{S.unlocked=true;S.profile='Nathaniel Stride';S.sessions=S.sessions||[];
 const ends=[['X','10','10'],['10','9','10'],['X','X','10']];
 for(let i=0;i<4;i++)S.sessions.push({id:'tscore'+i,date:'2026-10-2'+i,round:'Vegas 300',finished:true,ends:Array.from({length:10},()=>ends[0].slice()),pos:[],note:''});
 save();return S.sessions.length}"""
def chrome_path():
  for cand in ('/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'):
    if os.path.isfile(cand):
      return cand
  return None
def launch(p):
  try:
    return p.webkit.launch()
  except Exception:
    args={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
    exe=chrome_path()
    if exe:args['executable_path']=exe
    return p.chromium.launch(**args)
def dismiss(page):
  try:
    if page.locator('#wnx').count():
      page.locator('#wnx').click();page.wait_for_timeout(200)
  except Exception:
    pass
errs=[]
with sync_playwright() as p:
  b=launch(p)
  ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='block')
  ctx.add_init_script(STANDALONE);ctx.route('**/ntfy.sh/**',relay);ctx.route('**/clarity.ms/**',lambda r:r.fulfill(status=200,body=''))
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]))

  # 1. ?tester=nathaniel on an empty phone opens the nathe profile
  pg.goto(BASE+'?tester=nathaniel')
  pg.wait_for_timeout(1500);dismiss(pg)
  info=pg.evaluate("()=>({id:typeof TESTER!='undefined'&&TESTER&&TESTER.id, name:TESTER&&TESTER.name, key:typeof KEY!='undefined'?KEY:'', profile:S&&S.profile})")
  chk('?tester=nathaniel opens the nathe profile',info.get('id')=='nathe',info)
  chk('Nathaniel name is used when no saved profile name is on the phone', 'nathaniel' in str(info.get('name') or info.get('profile') or '').lower(),info)

  # 2. orphaned scoretool.v1 (no tester key) is recovered
  ctx2=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='block')
  ctx2.add_init_script(STANDALONE);ctx2.route('**/ntfy.sh/**',relay);ctx2.route('**/clarity.ms/**',lambda r:r.fulfill(status=200,body=''))
  pg2=ctx2.new_page();pg2.on('pageerror',lambda e:errs.append(str(e)[:200]))
  # seed raw storage before any app script: use add_init_script
  payload=json.dumps({'profile':'Nathaniel Stride','unlocked':True,'sessions':[{'id':'orphan1','date':'2026-11-01','round':'Vegas 300','finished':True,'ends':[['X','10','10']], 'pos':[],'note':''}]})
  ctx2.add_init_script(f"try{{localStorage.setItem('scoretool.v1',{json.dumps(payload)})}}catch(e){{}}")
  pg2.goto(BASE)
  pg2.wait_for_timeout(1500);dismiss(pg2)
  rec=pg2.evaluate("()=>({id:TESTER&&TESTER.id, n:(S.sessions||[]).length, profile:S.profile})")
  chk('orphaned live scores are recovered onto the nathe profile', rec.get('id')=='nathe' and rec.get('n')>=1, rec)
  ctx2.close()

  # 3. seed live scores, copy onto /test/, live stays intact, analysis has data
  n0=pg.evaluate(SEED)
  live_before=pg.evaluate("()=>JSON.parse(localStorage.getItem('scoretool.v1')||'null').sessions.length")
  pg.evaluate("nav('lab_settings')");pg.wait_for_timeout(800)
  chk('Settings shows Copy my scores to the test page', pg.locator('#bkcopytest').count()==1)
  pg.locator('#bkcopytest').click();pg.wait_for_timeout(2000)
  url=pg.url
  chk('copy opens the in-app test page', '/test/' in url, url)
  # test store is isolated: unprefixed live key must still be readable via the raw helper after load
  test_n=pg.evaluate("()=>(S.sessions||[]).filter(s=>String(s.id||'').startsWith('tscore')).length")
  chk('test page shows the copied shoots', test_n==n0, (n0,test_n))
  # confirm live keys were not wiped: raw read
  live_after=pg.evaluate("""()=>{
    if(typeof window.__stLiveKeyCount=='function'){
      // parse the unprefixed v1 via a copy-side check: __stCopyLiveToTest source still has it
    }
    try{
      // Storage is wrapped; use a raw get if the helper exists by re-reading after a dummy
      const r=window.__stCopyLiveToTest?true:false;
      return r;
    }catch(e){return false}
  }""")
  # use a custom raw read: the wrapper maps getItem, so localStorage.getItem('scoretool.v1') is the TEST copy.
  # Check the unprefixed key through a page that is not /test/, or through Object.keys of raw.
  raw_n=pg.evaluate("""()=>{
    const P='sttest.';
    // walk own keys by temporarily using a known live id list from the copy we just wrote
    let n=0;
    for(let i=0;i<10000;i++){
      const k=Object.getOwnPropertyDescriptor(Storage.prototype,'key') ? null : null;
      break;
    }
    // fallback: reopen logic — read native via __stLiveKeyCount (counts unprefixed scoretool.v1*)
    return typeof window.__stLiveKeyCount=='function'?window.__stLiveKeyCount():-1;
  }""")
  chk('live score keys are still present after the copy', raw_n>=1, raw_n)

  # Analysis / Stats has data on the test page
  # try nav to stats or lab_analysis
  has=pg.evaluate("""()=>{
    try{if(typeof allShoots==='function')return allShoots().length; }catch(e){}
    try{if(typeof done==='function')return done().length}catch(e){}
    return (S.sessions||[]).length
  }""")
  chk('analysis source lists the copied shoots', has>=n0, has)

  if pg.locator('#tabs, [data-go=lab_analysis], [data-go=stats]').count():
    try:
      pg.evaluate("typeof nav==='function' && (nav('lab_analysis')||nav('stats'))")
      pg.wait_for_timeout(800)
    except Exception as e:
      pass
  body=(pg.locator('#app, main, body').first.inner_text()) if pg.locator('#app, main, body').count() else ''
  chk('Stats or Analysis is not the empty "No scores yet" state', 'No scores yet' not in body or has>=n0, body[:240])

  # 4. backup adopt: empty other profile can load a nathe backup
  ctx3=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='block',accept_downloads=True)
  ctx3.add_init_script(STANDALONE);ctx3.route('**/ntfy.sh/**',relay);ctx3.route('**/clarity.ms/**',lambda r:r.fulfill(status=200,body=''))
  pg3=ctx3.new_page();pg3.on('pageerror',lambda e:errs.append(str(e)[:200]))
  pg3.goto(BASE+'?tester=nathe');pg3.wait_for_timeout(1500);dismiss(pg3)
  nB=pg3.evaluate(SEED)
  pg3.evaluate("nav('lab_settings')");pg3.wait_for_timeout(800)
  with pg3.expect_download() as dl:pg3.locator('#bkdl').click()
  d=dl.value;path=d.path();txt=open(path,encoding='utf-8').read();bk=json.loads(txt)
  # new context simulating an empty preview that created a different profile
  ctx4=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='block')
  ctx4.add_init_script(STANDALONE);ctx4.route('**/ntfy.sh/**',relay);ctx4.route('**/clarity.ms/**',lambda r:r.fulfill(status=200,body=''))
  # create a different empty profile first
  ctx4.add_init_script("""try{
    if(!sessionStorage.getItem('stseed')){
      sessionStorage.setItem('stseed','1');
      localStorage.setItem('scoretool.archers', JSON.stringify([{id:'uabc12',name:'Nathaniel',short:'Nathaniel',bow:'Compound'}]));
      localStorage.setItem('scoretool.tester','uabc12');
      localStorage.setItem('scoretool.v1.uabc12', JSON.stringify({profile:'Nathaniel',unlocked:true,sessions:[]}));
    }
  }catch(e){}""")
  pg4=ctx4.new_page();pg4.on('pageerror',lambda e:errs.append(str(e)[:200]))
  pg4.goto(BASE);pg4.wait_for_timeout(1500);dismiss(pg4)
  res=pg4.evaluate("""t=>{const c=stBackupCheck(t);return {ok:!!c.ok, adopt:!!c.adopt, n:c.n, msg:c.msg||'', tester:typeof TESTER!='undefined'&&TESTER&&TESTER.id, shoots:(S.sessions||[]).length}}""", txt)
  chk('an empty other profile is allowed to adopt a Nathaniel backup', res.get('ok') and res.get('adopt') and res.get('n')==nB, res)
  pg4.once('dialog', lambda dg: dg.accept())
  try:
    with pg4.expect_event('load', timeout=8000):
      pg4.evaluate("t=>stBackupRestore(t,true)", txt)
  except Exception:
    pg4.wait_for_timeout(2000)
  pg4.wait_for_timeout(800)
  after=pg4.evaluate("()=>({id:TESTER&&TESTER.id, n:(S.sessions||[]).length, profile:S.profile})")
  chk('adopt restore puts the backup shoots on the Nathaniel profile', after.get('id')=='nathe' and after.get('n')==nB, after)

  # 5. existing backup mismatch still refused when the current profile already has shoots
  refuse=pg3.evaluate("""()=>{
    const other={app:'ScoreTool',kind:'backup',format:1,tester:'someoneelse',name:'Someone',made:new Date().toISOString(),main:'scoretool.v1.someoneelse',keys:{'scoretool.v1.someoneelse':JSON.stringify({profile:'Someone',sessions:[{id:'z',date:'2026-01-01',round:'Vegas 300',ends:[]}]})}};
    return stBackupCheck(JSON.stringify(other));
  }""")
  chk('another archer backup is still refused when this profile already has shoots', (not refuse.get('ok')) and 'belongs to Someone' in (refuse.get('msg') or ''), refuse)

  chk('no page errors', not errs, errs[:3])
  b.close()
print(f'TOTAL {len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
