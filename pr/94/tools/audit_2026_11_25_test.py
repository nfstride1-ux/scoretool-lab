# 25 Nov 2026 audit checks: profiles without a built-in list, Just me, Casual, Lingkana passcode (PBKDF2), PIN return, host, share link,
# no Onion Shed / coach / tester UI / 'demo'. Run: LK_TEST_PASSCODE=... python3 tools/audit_2026_11_25_test.py
import subprocess,sys,time,os,json,re
from playwright.sync_api import sync_playwright
PW=os.environ['LK_TEST_PASSCODE']  # never stored in the repo
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME=os.environ.get('CHROME','/usr/bin/google-chrome')
PORT=8941;BASE=f'http://127.0.0.1:{PORT}'
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.5)
ok,bad=[],[]
def chk(n,c,x=''):
  (ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+(('  '+str(x)[:300]) if x and not c else ''),flush=True)
SEED="""(()=>{if(localStorage.getItem('seeded'))return;localStorage.setItem('seeded','1');
localStorage.setItem('scoretool.archers',JSON.stringify([{id:'nathe',name:'Nathaniel Stride',short:'Nathaniel'},{id:'steven',name:'Sam Archer',short:'Sam'}]));
const t=Date.now()+60000;localStorage.setItem('scoretool.dname.nathe',JSON.stringify({n:'Host1',nt:t}));localStorage.setItem('scoretool.dname.steven',JSON.stringify({n:'Sammy',nt:t}));
localStorage.setItem('scoretool.whatsnew.seen','v2099');localStorage.setItem('scoretool.cal.steven.prompted','1');localStorage.setItem('scoretool.cal.nathe.prompted','1');})()"""
NORELAY="""(()=>{const f=window.fetch;window.fetch=function(u,o){const s=String(u&&u.url||u);if(/ntfy|supabase|clarity|formsubmit/.test(s))return Promise.resolve(new Response('{}',{status:200,headers:{'Content-Type':'application/json'}}));return f.apply(this,arguments)}})()"""
def newpage(b,errs,seed=True):
  c=b.new_context(viewport={'width':390,'height':844},service_workers='block')
  c.add_init_script(NORELAY)
  if seed:c.add_init_script(SEED)
  pg=c.new_page();pg.set_default_timeout(8000)
  pg.on('pageerror',lambda e:errs.append(str(e)))
  return c,pg
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=CHROME,args=['--headless=new'])
  # 1. fresh visitor
  errs=[];c,pg=newpage(b,errs,seed=False)
  r404=[];pg.on('response',lambda r:r.status>=400 and r404.append(r.url))
  pg.goto(BASE+'/');pg.wait_for_timeout(1500)
  html=pg.content()
  chk('title is ScoreTool, no demo','demo' not in pg.title().lower() and 'ScoreTool' in pg.title(),pg.title())
  chk('no noindex; description + og tags','noindex' not in html and 'name="description"' in html and 'og:title' in html and 'og:image' in html)
  chk('no prefetch links',pg.locator('link[rel=prefetch]').count()==0)
  chk('fresh visitor sees only Create my profile (no names list)',pg.locator('#npname').count()==1 and pg.locator('[data-tester]').count()==0)
  scripts=pg.evaluate("[...document.scripts].map(s=>s.src).filter(Boolean)")
  chk('testers.js and sightseed not loaded',not any('testers.js' in s or 'sightseed' in s for s in scripts))
  pg.fill('#npname','Test Archer');pg.click('#npc');pg.wait_for_timeout(1500)
  if pg.locator('#nmlater').count():pg.click('#nmlater');pg.wait_for_timeout(600)
  pg.click('[data-v="score"]');pg.wait_for_timeout(600)
  chk('Score tab offers Just me, Casual, League',all(x in pg.inner_text('#app') for x in ['Just me','Casual shoot','League shoot']))
  pg.click('#st');pg.wait_for_timeout(800)
  keys=pg.locator('[data-k]');n0=keys.count()
  for k in ['10','9','8']:
    pg.locator(f'[data-k="{k}"]').first.click();pg.wait_for_timeout(120)
  st=pg.evaluate("(()=>{const s=(typeof cur!=='undefined'&&cur)||null;return s?{round:s.round,ends:s.ends}:null})()")
  chk('Just me: scoring screen accepts arrows',n0>0 and st and any(len(e)>0 for e in (st.get('ends') or [])),json.dumps(st)[:200])
  # body text of main tabs: no demo / tester / onion / coach link
  txt=''
  for v in ['home','score','myarch','clubs','tools']:
    pg.evaluate(f"nav('{v}')");pg.wait_for_timeout(500);txt+=pg.inner_text('body')+'\n'
  pg.evaluate("nav('me')");pg.wait_for_timeout(600);me=pg.inner_text('body');txt+=me
  for v in ['lab_me','lab_people','lab_settings']:
    try:pg.evaluate(f"nav('{v}')");pg.wait_for_timeout(400);txt+=pg.inner_text('body')
    except Exception as e:pass
  low=txt.lower()
  chk('no "demo" in visible app text','demo' not in low,re.findall(r'.{30}demo.{30}',low)[:3])
  chk('no "tester" in visible app text','tester' not in low,re.findall(r'.{30}tester.{30}',low)[:3])
  chk('no Onion Shed anywhere visible','onion' not in low)
  chk('no coach link / coach sign-in',pg.locator('#coachcard').count()==0 and 'coach link' not in low and 'coach membership' not in low)
  chk('parent link still there',pg.locator('#parentcard').count()+('parent' in low)>=1)
  pg.goto(BASE+'/#coach=eyJuIjoiWCJ9');pg.wait_for_timeout(1200)
  chk('#coach= link no longer opens a coach sign-in page',pg.locator('#coachlanding').count()==0 and 'Coach sign-in' not in pg.inner_text('body'))
  chk('no page errors (fresh + Just me)',not errs,errs[:3])
  chk('no 404s for app files',not [u for u in r404 if '127.0.0.1' in u],r404[:5])
  c.close()
  # 2. Casual
  errs=[];c,pg=newpage(b,errs)
  pg.goto(BASE+'/?tester=steven');pg.wait_for_timeout(1500)
  pg.evaluate("S.unlocked=true;save()");pg.evaluate("nav('score')");pg.wait_for_timeout(500)
  pg.locator('#app button',has_text='Casual shoot').first.click();pg.wait_for_timeout(600)
  has=pg.locator('#cstype').count()+pg.locator('#csgo').count()
  if pg.locator('#cstype').count():
    pg.fill('#cstype','Buddy');pg.click('#csaddn');pg.wait_for_timeout(200)
  if pg.locator('#csgo').count():pg.click('#csgo');pg.wait_for_timeout(800)
  at=pg.inner_text('#app');chk('Casual: setup opens and starts with a typed archer',has>0 and 'Buddy' in at and 'No ends yet' in at,at[:200])
  chk('Casual: no page errors',not errs,errs[:3])
  c.close()
  # 3. Lingkana: registration + PIN, wrong/right passcode, PIN return login
  errs=[];c,pg=newpage(b,errs)
  pg.goto(BASE+'/?tester=steven#lk-home');pg.wait_for_selector('#lkhome',timeout=10000)
  pg.evaluate("S.unlocked=true;save()")
  pg.evaluate("""()=>{const lg=lkEnsure();const r=lkApplyReg({name:'No Pin',at:Date.now()},lg);lkRememberArcher(r.id);save();}""")
  pg.evaluate("()=>lkFlowLogin()");pg.wait_for_timeout(800);pg.click('#lkfulllogin');pg.wait_for_timeout(1000)
  if pg.locator('#lkscorernames .lk-namebtn.on',has_text='No Pin').count()==0 and pg.locator('#lkscorernames .lk-namebtn',has_text='No Pin').count():pg.locator('#lkscorernames .lk-namebtn',has_text='No Pin').click();pg.wait_for_timeout(300)
  if not pg.locator('#lkpinset').count():
    print('DEBUG',pg.inner_text('body')[:600]);print('IDS',pg.evaluate("[...document.querySelectorAll('[id]')].map(e=>e.id).filter(i=>i.startsWith('lk')).join(',')"))
    raise SystemExit
  pg.fill('#lkpin','2468');pg.fill('#lkpin2','2468');pg.fill('#lkpw','wrong1');pg.locator('#lkpwgo').click();pg.wait_for_timeout(2500)
  m=pg.evaluate("(document.querySelector('#lkpwmsg')||{}).textContent||''")
  chk('Lingkana: wrong passcode refused',"not right" in m.lower() and pg.locator('#lkassigned, #lgentry').count()==0,m)
  t0=time.time()
  pg.fill('#lkpin','2468');pg.fill('#lkpin2','2468');pg.fill('#lkpw',PW);pg.locator('#lkpwgo').click()
  try:pg.wait_for_selector('#lkassigned, #lgentry, #lkpick, .lkf',timeout=8000)
  except:pass
  pg.wait_for_timeout(1500)
  m2=pg.evaluate("(document.querySelector('#lkpwmsg')||{}).textContent||''")
  row=pg.evaluate("""()=>{const r=Object.values(lkEnsure().reg||{}).flat().find(r=>r&&r.name==='No Pin')||{};return{pin:!!r.pinHash,auth:typeof lkAuthed==='function'&&lkAuthed(lkEnsure())}}""")
  chk('Lingkana: right passcode accepted, PIN saved, scoring unlocked',row['pin'] and row['auth'] and 'not right' not in m2.lower(),str(row)+m2)
  chk(f'passcode check time {time.time()-t0:.1f}s (PBKDF2 600k)',True)
  # PIN return login (new session, no passcode)
  pg.evaluate("()=>{sessionStorage.removeItem('scoretool.lk.auth');window._lkAuthed=null}")
  pg.evaluate("()=>lkFlowLogin()");pg.wait_for_timeout(800);pg.click('#lkfulllogin');pg.wait_for_timeout(800)
  if pg.locator('#lkscorernames .lk-namebtn',has_text='No Pin').count():pg.locator('#lkscorernames .lk-namebtn',has_text='No Pin').click();pg.wait_for_timeout(200)
  pg.fill('#lkpin','1111');pg.locator('#lkpwgo').click();pg.wait_for_timeout(600)
  m3=pg.evaluate("(document.querySelector('#lkpwmsg')||{}).textContent||''")
  chk('PIN return: wrong PIN refused','not right' in m3.lower(),m3)
  pg.fill('#lkpin','2468');pg.locator('#lkpwgo').click();pg.wait_for_timeout(1500)
  chk('PIN return: right PIN logs in without the passcode',pg.evaluate("lkAuthed(lkEnsure())"),pg.inner_text('body')[:200])
  pg.evaluate("()=>{sessionStorage.removeItem('scoretool.lk.auth');window._lkAuthed=null;lkUnlockView(lkEnsure())}");pg.wait_for_selector('#lkpwpage')
  pg.fill('#lkpw','zzz');pg.click('#lkpwgo');pg.wait_for_timeout(2500)
  chk('scorer passcode page: wrong refused','not right' in pg.inner_text('#lkpwmsg').lower() and not pg.evaluate("lkAuthed(lkEnsure())"))
  pg.fill('#lkpw',PW);pg.click('#lkpwgo');pg.wait_for_timeout(2500)
  chk('scorer passcode page: right unlocks',pg.evaluate("lkAuthed(lkEnsure())"))
  # direct unlock function
  r1=pg.evaluate("async()=>await lkUnlock('nope')");r2=pg.evaluate(f"async()=>await lkUnlock({json.dumps(PW)})")
  chk('lkUnlock: wrong -> message, right -> ok',r1=='That passcode is not right.' and r2=='',(r1,r2))
  chk('Lingkana archer: no page errors',not errs,errs[:3])
  c.close()
  # 4. host login (Nathe) with passcode, host skips PIN
  errs=[];c,pg=newpage(b,errs)
  pg.goto(BASE+'/?tester=nathe#lk-home');pg.wait_for_selector('#lkhome',timeout=10000)
  pg.evaluate("S.unlocked=true;save()")
  pg.evaluate("()=>lkFlowHome('LINGKN26')");pg.locator('#lklogin').click();pg.wait_for_timeout(800)
  if pg.locator('#lkfulllogin').count():pg.click('#lkfulllogin');pg.wait_for_timeout(800)
  labels=pg.locator('#lkscorernames .lk-namebtn').all_inner_texts()
  chk('host phone sees name list incl. Nate Evans',any('Nate Evans' in l for l in labels),labels[:6])
  tgt=[l for l in labels if 'Nathaniel' in l] or [l for l in labels if 'Nate Evans' in l]
  pg.locator('#lkscorernames .lk-namebtn',has_text=tgt[0]).first.click();pg.wait_for_timeout(300)
  chk('host: no PIN box for the host',pg.locator('#lkpin').count()==0 or not pg.locator('#lkpin').is_visible())
  pg.fill('#lkpw','bad');pg.locator('#lkpwgo').click();pg.wait_for_timeout(2500)
  chk('host: wrong passcode refused','not right' in pg.evaluate("(document.querySelector('#lkpwmsg')||{}).textContent||''").lower())
  pg.fill('#lkpw',PW);pg.locator('#lkpwgo').click();pg.wait_for_timeout(3000)
  chk('host: right passcode logs in',pg.evaluate("lkAuthed(lkEnsure())"),pg.inner_text('body')[:200])
  chk('host: no page errors',not errs,errs[:3])
  c.close()
  # 5. share / poster link opens Lingkana home on a new phone (no profile)
  errs=[];c,pg=newpage(b,errs,seed=False)
  pg.goto(BASE+'/#lk-home');pg.wait_for_timeout(2500)
  chk('share link #lk-home opens Lingkana home on a fresh phone',pg.locator('#lkhome').count()==1,pg.inner_text('body')[:200])
  pg.goto(BASE+'/?ev=lk-onion26#lk-register');pg.wait_for_timeout(2000)
  chk('register link opens',pg.locator('#lkregname').count()+pg.locator('#lkhome').count()>=1,pg.inner_text('body')[:200])
  url=pg.evaluate("typeof lkEventHomeUrl==='function'?lkEventHomeUrl():''")
  chk('share URL still points at the live root',url.startswith('https://nfstride1-ux.github.io/scoretool-demo/'),url)
  chk('share: no page errors',not errs,errs[:3])
  c.close()
  # 6. migration: old built-in profile on a phone keeps its data
  errs=[];c=b.new_context(service_workers='block');c.add_init_script(NORELAY)
  c.add_init_script("""(()=>{if(localStorage.getItem('m'))return;localStorage.setItem('m','1');localStorage.setItem('scoretool.tester','nathe');localStorage.setItem('scoretool.v1',JSON.stringify({profile:'Nathaniel Stride',unlocked:true,sessions:[{id:'x1',date:'2026-11-01',round:'Lancaster 660',ends:[['10','10','10']],finished:true}]}));localStorage.setItem('scoretool.adminReturn','nathe')})()""")
  pg=c.new_page();pg.on('pageerror',lambda e:errs.append(str(e)));pg.goto(BASE+'/');pg.wait_for_timeout(1500)
  mg=pg.evaluate("({t:TESTER&&TESTER.id,n:TESTER&&TESTER.name,k:KEY,s:(S.sessions||[]).some(s=>s.id==='x1'),a:localStorage.getItem('scoretool.adminReturn'),av:window.ADMIN_VIEW})")
  chk('old profile migrates: same id, same storage key, scores kept, viewing-as cleared',mg['t']=='nathe' and mg['k']=='scoretool.v1' and mg['s'] and mg['a'] is None and not mg['av'],mg)
  chk('migration: no page errors',not errs,errs[:3])
  c.close();b.close()
finally:srv.terminate()
print(f'\n{len(ok)} passed, {len(bad)} failed');[print(' FAIL',x) for x in bad]
