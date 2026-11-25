# Admin view (26 Oct 2026, Nathe): after Nathe switches to another tester he can always get back (Viewing-as bar + switcher stay),
# normal testers never see the switcher, and viewing another tester is READ ONLY: every localStorage key and value of the viewed tester
# and of Nathe is identical before and after switching, browsing every screen and switching back (only the admin flag and the tester choice differ).
# Chrome 390x844. ntfy.sh is answered locally.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT='8837'
srv=subprocess.Popen([sys.executable,'-m','http.server',PORT],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
U=f'http://localhost:{PORT}/'
SNAP="()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return o}"
def diff(a,b,skip=('scoretool.adminReturn','scoretool.tester')):
  ks=set(a)|set(b);return sorted(k for k in ks if k not in skip and a.get(k)!=b.get(k))
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  errs=[];posts=[]
  def mk():
    ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    ctx.route('https://ntfy.sh/**',lambda r,q:(posts.append(q.method+' '+q.url) if q.method!='GET' else None,r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'}))[1])
    pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)));return ctx,pg
  def settle(pg,t=2200):
    pg.wait_for_timeout(t)
    for _ in range(3):
      if pg.locator('nav [data-v=score]').is_visible():break
      d=pg.get_by_text('Demo unlock')
      if d.count():d.first.click()
      elif pg.evaluate("typeof S!='undefined'&&!!S&&!S.unlocked"):pg.evaluate("S.unlocked=true;save();render()")
      elif pg.locator('#app button').count():pg.locator('#app button').first.click()
      pg.wait_for_timeout(500)
    pg.wait_for_timeout(500)
  # ---- A. Nate has his own saved data on this phone (opened normally before Nathe's profile exists) ----
  ctx,pg=mk();E=pg.evaluate
  pg.goto(U+'?tester=nate');settle(pg)
  chk('A0 no admin bar, no flag for a plain tester',pg.locator('#adminbar').count()==0 and E("localStorage.getItem('scoretool.adminReturn')")is None)
  E("()=>{S.sessions.push({id:'nate-s1',round:'WA 720 (50m Compound)',date:'2026-10-01',ends:[[10,9,9,8,8,7]],score:51,name:'seed'});S.nateMarker='keep';save();localStorage.setItem('scoretool.dname.nate',JSON.stringify({n:'Navy',nt:1}))}")
  pg.goto(U+'?tester=nathe');settle(pg)
  E("()=>{S.marker='nathe-own';save()}")
  # warm-up: Nathe's own app seeds a few defaults (ABA, league preset, calendar prompt) the first time he opens screens; do that first so the before snapshot is his settled state
  for v in ['home','score','myarch','clubs','tools','lab_me','stats','diary','squad','whatsnew']:
    try:pg.evaluate(f"nav('{v}')");pg.wait_for_timeout(500)
    except Exception:pass
  pg.reload();settle(pg,3000)
  for v in ['home','score','myarch','clubs','tools','lab_me','stats','diary','squad','whatsnew']:
    try:pg.evaluate(f"nav('{v}')");pg.wait_for_timeout(300)
    except Exception:pass
  pg.reload();settle(pg,3000)
  # ---- B. Nathe -> Me -> switch to Nate through the card ----
  pg.reload();settle(pg)
  chk('B0 Nathe sees no viewing bar',pg.locator('#adminbar').count()==0)
  base=E(SNAP)
  nate_keys=sorted(k for k in base if k=='scoretool.v1.nate' or '.nate' in k or k.endswith('nate'))
  chk('B1 Nate has data to protect',len(nate_keys)>=2 and 'nateMarker' in base['scoretool.v1.nate'])
  pg.evaluate("nav('lab_me')");pg.wait_for_timeout(700)
  chk('B2 Nathe sees the switch card in Me',pg.locator('#whocard').count()==1)
  pg.locator('#whocard [data-tester=nate]').click();pg.wait_for_timeout(2500)
  settle(pg)
  chk('B3 flag stored',E("localStorage.getItem('scoretool.adminReturn')")=='nathe' and E("TESTER.id")=='nate')
  posts.clear()
  bar=pg.locator('#adminbar');chk('B4 bar visible on Home',bar.is_visible() and 'Viewing as Nate' in bar.inner_text() and 'Back to my profile' in bar.inner_text())
  bb=bar.bounding_box();tb=pg.locator('header.top').bounding_box()
  chk('B5 bar sits right under the top bar, full width, 44px+ tap target',abs(bb['y']-(tb['y']+tb['height']))<2 and bb['width']>=388 and pg.locator('#avback').bounding_box()['height']>=44)
  pg.screenshot(path='/tmp/st-admin/shots-adminview/01-home-viewing.png')
  # ---- C. browse every screen as Nate ----
  views=['home','score','myarch','clubs','tools','lab_me','stats','diary','squad','whatsnew']
  seen=[]
  for v in views:
    try:
      pg.evaluate(f"nav('{v}')");pg.wait_for_timeout(700)
      seen.append(v);chk(f'C {v}: bar still there',pg.locator('#adminbar').is_visible())
    except Exception as e:errs.append(f'nav {v}: {e}')
  pg.evaluate("nav('lab_me')");pg.wait_for_timeout(700)
  chk('C1 switch card stays in Me while viewing, with a Back button',pg.locator('#whocard').count()==1 and pg.locator('#whoback').count()==1 and 'Back to my profile' in pg.locator('#whoback').inner_text())
  pg.screenshot(path='/tmp/st-admin/shots-adminview/02-me-viewing.png')
  # help screen, ghost entry (Score tab ghost checkbox), start a solo round on the score screen
  pg.locator('.help-btn').first.click();pg.wait_for_timeout(700);chk('C2 help opens while viewing',pg.locator('#adminbar').is_visible() and pg.locator('#app').inner_text().strip()!='')
  pg.evaluate("nav('score')");pg.wait_for_timeout(700);chk('C3 ghost entry (checkbox) is on the Score screen',pg.locator('#ghon').count()==1)
  pg.evaluate("nav('score')")
  # try to change data as Nate: a real tap then save(): must be blocked with a notice
  pg.mouse.click(200,400);E("()=>{S.sessions.push({id:'x-viewing',round:'x',date:'2026-10-26',ends:[],score:0});save();localStorage.setItem('scoretool.whatsnew.seen','zzz')}")
  pg.wait_for_timeout(300)
  toast=pg.locator('#avtoast');chk('C4 notice shown on a save attempt, in plain words',toast.is_visible() and "You are viewing Nate's profile; this would change Nate's data" in toast.inner_text())
  pg.screenshot(path='/tmp/st-admin/shots-adminview/03-blocked-notice.png')
  # posts to the network are blocked too
  r=E("()=>fetch('https://ntfy.sh/x',{method:'POST',body:'hi'}).then(()=>'sent',()=>'blocked')")
  chk('C5 network POST blocked',r=='blocked' and not posts)
  r=E("()=>new Promise(res=>{try{const q=indexedDB.open('scoretool-photos',1);q.onupgradeneeded=()=>{q.result.createObjectStore('photos')};q.onsuccess=()=>{try{q.result.transaction('photos','readwrite').objectStore('photos').put(1,'k');res('wrote')}catch(e){res('blocked')}}}catch(e){res('err')}})")
  chk('C6 IndexedDB write blocked',r=='blocked')
  blocked=E("window.__avBlocked");print('blocked writes while viewing:',sorted(set(blocked)))
  # ---- D. switch back with one tap ----
  during=E(SNAP);dd=diff(base,during);chk('D0 STRICT: at the end of viewing, every key and value (Nate, Nathe, shared) identical to before the switch: '+str(dd),dd==[])
  pg.locator('#avback').click();pg.wait_for_timeout(2500);settle(pg)
  chk('D1 back as Nathe, no bar, flag cleared',E("TESTER.id")=='nathe' and pg.locator('#adminbar').count()==0 and E("localStorage.getItem('scoretool.adminReturn')")is None)
  after=E(SNAP)
  def norm(raw):
    o=json.loads(raw)
    for l in o.get('leagues',[]):l.pop('posted',None)
    return o
  chk("D2a Nathe's own app after he is back only refreshes its normal league sync timestamp (leagues[].posted), nothing else",norm(base['scoretool.v1'])==norm(after['scoretool.v1']))
  base2=dict(base);base2['scoretool.v1']=after['scoretool.v1'] if norm(base['scoretool.v1'])==norm(after['scoretool.v1']) else base['scoretool.v1']
  d=diff(base2,after);chk('D2 every localStorage key and value of Nate AND Nathe identical before and after (except admin flag, tester choice): '+str(d),d==[])
  chk('D3 Nate data byte identical',base['scoretool.v1.nate']==after['scoretool.v1.nate'] and 'x-viewing' not in after['scoretool.v1.nate'])
  chk('D5 key sets equal',sorted(k for k in base if k!='scoretool.adminReturn')==sorted(k for k in after if k!='scoretool.adminReturn'))
  json.dump({'before':base,'after':after,'blocked':sorted(set(blocked))},open('/tmp/st-admin/shots-adminview/localstorage-before-after.json','w'),indent=1)
  # Nathe can still save as himself
  E("()=>{S.marker2='ok';save()}");chk('D6 Nathe saves normally after returning',json.loads(E("localStorage.getItem('scoretool.v1')")).get('marker2')=='ok')
  # solo scoring still works for Nathe (Score tab starts a round)
  pg.evaluate("nav('score')");pg.wait_for_timeout(600);pg.click('#st');pg.wait_for_timeout(700)
  chk('D7 solo round starts for Nathe',bool(E("typeof cur!='undefined'&&!!cur")))
  # ---- E. ?tester=nathe always works as a way back, and clears the flag; second way (URL) ----
  pg.goto(U+'?tester=nate');settle(pg)
  chk('E1 on Nathe phone, ?tester=nate (link) is also read-only with the bar',pg.locator('#adminbar').is_visible() and E("window.ADMIN_VIEW")==True)
  pg.goto(U+'?tester=nathe');settle(pg)
  chk('E2 ?tester=nathe returns and clears flag',E("TESTER.id")=='nathe' and E("localStorage.getItem('scoretool.adminReturn')")is None and pg.locator('#adminbar').count()==0)
  # recovery for a switch made BEFORE this update: tester=nate stored, no flag, Nathe's profile on the phone
  E("()=>{localStorage.removeItem('scoretool.adminReturn');localStorage.setItem('scoretool.tester','nate')}");pg.goto(U);settle(pg)
  chk('E3 already-stuck phone (no flag) still gets the bar',pg.locator('#adminbar').is_visible())
  pg.locator('#avback').click();pg.wait_for_timeout(2500);settle(pg);chk('E4 stuck phone gets back to Nathe',E("TESTER.id")=='nathe')
  # switch through Nate to another tester keeps the flag; Back from there returns to Nathe
  pg.evaluate("nav('lab_me')");pg.wait_for_timeout(500);pg.locator('#whocard [data-tester=phill]').click();pg.wait_for_timeout(2500);settle(pg)
  chk('E5 viewing Phill: bar says Phill, flag kept',E("TESTER.id")=='phill' and 'Viewing as Phill' in pg.locator('#adminbar').inner_text())
  pg.locator('#avback').click();pg.wait_for_timeout(2500);settle(pg);chk('E6 back from Phill',E("TESTER.id")=='nathe')
  ctx.close()
  # ---- F. normal tester on his own phone: never sees the switcher ----
  for tid in ['phill','nate','logan']:
    ctx,pg=mk();E=pg.evaluate;pg.goto(U+f'?tester={tid}');settle(pg)
    pg.evaluate("nav('lab_me')");pg.wait_for_timeout(600)
    chk(f'F {tid}: no bar, no switcher, no flag, can save',pg.locator('#adminbar').count()==0 and pg.locator('#whocard').count()==0 and E("localStorage.getItem('scoretool.adminReturn')")is None and E("(()=>{S.zz=1;save();return JSON.parse(localStorage.getItem(KEY)).zz})()")==1)
    ctx.close()
  chk('G no page errors',not errs)
  if errs:print(errs[:5])
  b.close()
finally:
  srv.terminate()
print('PASS',len(ok),'FAIL',len(bad));[print('  FAIL:',x) for x in bad]
sys.exit(1 if bad else 0)
