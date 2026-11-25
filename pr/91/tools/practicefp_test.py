# Practice arrows without Fair Play (25 Nov 2026, Nathe): the Fair Play card is not shown on
# My archery > Practice arrows; quick-logged arrows count in today's tally and daily goal.
# "-N from rounds" was a display bug (held arrows subtracted from the total but still listed
# as added). XP/badges still use the held count until confirmed. Fair Play stays on Latest shoot.
# League data is not written. No existing test was edited.
import subprocess,sys,time,os,json
os.environ['ST_NO_COMPAT']='1'
from playwright.sync_api import sync_playwright
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import guard
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH=os.path.join(ROOT,'shots-practicefp');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n); (None if c else print('FAIL',n))
PORT=8847
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
INIT="""
localStorage.setItem('scoretool.archers', JSON.stringify([{id:'u_practice',name:'Practice Archer',short:'Practice',bow:'Compound'}]));
localStorage.setItem('scoretool.tester', 'u_practice');
localStorage.setItem('scoretool.whatsnew.seen', 'v2099');
localStorage.setItem('scoretool.dname.asked.u_practice', String(Date.now()));
"""
SEED="""() => {
  S.unlocked=true;
  if(!S.profile) S.profile=TESTER.name;
  S.vol=S.vol||{};
  S.vol[today()]=6;
  S.daily_goal=300; S.goal=300;
  S.fpHold=[{kind:'vol',date:today(),n:3,t:Date.now()}];
  save();
}"""
def kickers(pg):
  return pg.evaluate("[...document.querySelectorAll('.kicker')].map(e=>(e.textContent||'').trim())")
def has_fp(pg):
  return any('fair play' in (k or '').lower() for k in kickers(pg))
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
  pg=ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.on('console',lambda m:m.type=='error' and 'INTERNET_DISCONNECTED' not in m.text and errs.append(m.text))
  pg.add_init_script(INIT)
  pg.goto(f'http://localhost:{PORT}/',wait_until='domcontentloaded')
  pg.wait_for_function("typeof S!=='undefined' && typeof nav==='function' && TESTER")
  pg.evaluate(SEED);pg.reload()
  pg.wait_for_function("typeof S!=='undefined' && typeof nav==='function' && S.profile")
  pg.wait_for_timeout(600)
  pg.evaluate("nav('lab_arrows')")
  pg.wait_for_function("view==='lab_arrows'")
  pg.wait_for_timeout(400)
  t=(pg.locator('#app').inner_text() or '').replace('\n',' ')
  ring=pg.locator('#volring').text_content() if pg.locator('#volring').count() else ''
  counts=pg.evaluate("({raw:(dayArrows()[today()]||0), reward:(rewardDayArrows()[today()]||0), ad:(S.vol||{})[today()]||0, week:weekArrowsLogged(), weekReward:weekArrows()})")
  lg0=pg.evaluate("JSON.stringify(S.leagues||[])")
  chk('on Practice arrows',pg.evaluate('view')=='lab_arrows')
  chk('no Fair Play card on Practice arrows',not has_fp(pg) and "aren't counting toward XP" not in t)
  chk('ring shows 6 of 300','6' in ring and 'of 300' in ring)
  chk('today tally includes quick-logged arrows',counts['raw']==6 and ' 6 added today' in t)
  chk('from rounds is not negative','-3 from rounds' not in t and '0 from rounds' in t)
  chk('XP/badges still hold the 3 unconfirmed',counts['reward']==3)
  chk('week display uses logged arrows',counts['week']==6 and counts['weekReward']==3)
  pg.screenshot(path=f'{SH}/practice-arrows.png')
  # +6 stays on the page and counts immediately
  pg.locator('[data-vol="6"]').tap();pg.wait_for_timeout(400)
  t2=(pg.locator('#app').inner_text() or '').replace('\n',' ')
  ring2=pg.locator('#volring').text_content() if pg.locator('#volring').count() else ''
  counts2=pg.evaluate("({raw:(dayArrows()[today()]||0), reward:(rewardDayArrows()[today()]||0), ad:(S.vol||{})[today()]||0})")
  chk('+6 stays on Practice arrows',pg.evaluate('view')=='lab_arrows' and not has_fp(pg) and not pg.locator('#fpm').count())
  chk('+6 counts in tally',counts2['ad']==12 and counts2['raw']==12 and '12' in ring2 and '12 added today' in t2)
  chk('+6 still held back from XP',counts2['reward']==9)  # only the original 3 stay held; the new +6 did not trip the 150-in-10-min burst
  # Latest shoot still shows Fair Play
  pg.evaluate("nav('lab_latest')")
  pg.wait_for_function("view==='lab_latest'")
  pg.wait_for_timeout(400)
  chk('Fair Play remains on Latest shoot',has_fp(pg) and pg.locator('#fpall').count()==1)
  pg.screenshot(path=f'{SH}/latest-shoot.png')
  # confirm there, then Practice arrows still has no card and XP catches up
  pg.locator('#fpall').tap();pg.wait_for_timeout(400)
  chk('confirm on Latest shoot clears the card',not has_fp(pg))
  rew=pg.evaluate("rewardDayArrows()[today()]||0")
  chk('after confirm, XP counts the logged arrows',rew==12)
  pg.evaluate("nav('lab_arrows')")
  pg.wait_for_function("view==='lab_arrows'")
  pg.wait_for_timeout(300)
  t3=(pg.locator('#app').inner_text() or '').replace('\n',' ')
  chk('Practice arrows still has no Fair Play card',not has_fp(pg) and '12 added today' in t3)
  lg1=pg.evaluate("JSON.stringify(S.leagues||[])")
  chk('league data untouched',lg0==lg1)
  chk('no errors',not errs);errs and print(errs)
  ctx.close();b.close()
finally:srv.terminate()
print(len(ok),'ok');print('FAIL',bad) if bad else print('all pass');sys.exit(1 if bad else 0)
