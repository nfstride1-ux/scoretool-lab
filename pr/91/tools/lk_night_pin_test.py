import json,os,subprocess,sys,time
from playwright.sync_api import sync_playwright
PW=os.environ['LK_TEST_PASSCODE'];ROOT=sys.argv[1] if len(sys.argv)>1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
snap=json.load(open(os.environ['LK_SNAPSHOT']))['data']['lg']  # private live copy, not in the repo
ok=[];bad=[]
def chk(n,c,x=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+(('  '+str(x)[:300]) if x and not c else ''),flush=True)
srv=subprocess.Popen([sys.executable,'-m','http.server','8991'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.6)
posts=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  c=b.new_context(viewport={'width':390,'height':900},service_workers='block')
  def rt(r):
    u=r.request.url
    if 'ntfy.sh' in u:
      if r.request.method=='POST':posts.append(r.request.post_data or '');return r.fulfill(status=200,body='{}')
      return r.fulfill(status=200,body='')
    if any(h in u for h in ['supabase','clarity','formsubmit']):return r.fulfill(status=200,body='{}')
    return r.continue_()
  c.route('**/*',rt)
  pg=c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
  pg.goto('http://127.0.0.1:8991/#lk-home');pg.wait_for_timeout(2500)
  chk('#lk-home opens Lingkana home',pg.locator('#lkhome').count()==1)
  # load the live league copy (snapshot taken after #72) into this phone
  pg.evaluate("s=>{const lg=lkEnsure();for(const k of ['reg','sc','grp','paid','pins','order','gn','weeks','claim','drop','fin','cw','wt','status'])if(k in s)lg[k]=JSON.parse(JSON.stringify(s[k]));save()}",snap)
  N=pg.evaluate("lkShootDates(lkEnsure())")
  base=pg.evaluate("()=>{const lg=lkEnsure();return {reg:JSON.parse(JSON.stringify(lg.reg)),sc:JSON.stringify(lg.sc),grp:JSON.stringify(lg.grp),paid:JSON.stringify(lg.paid||{}),pot:JSON.stringify(lkPot(lg)),table:JSON.stringify(lkTable(lg))}}")
  pg.evaluate("location.hash='#lk-register'");pg.wait_for_timeout(300);pg.evaluate("lkRegisterView()");pg.wait_for_timeout(400)
  chk('#lk-register shows night picker, returning form, new-archer form (no passcode box) and the link wording',pg.locator('#lknights input[name=lkregn]').count()==6 and pg.locator('#lkretform').count()==1 and pg.locator('#lkregpass').count()==0 and 'Anyone with this link can register' in pg.inner_text('#lkregpage'))
  def ticks(nights):
    pg.evaluate("ns=>document.querySelectorAll('input[name=lkregn]').forEach(x=>{if(!x.disabled)x.checked=ns.includes(x.value)})",nights)
  def onN(name):return pg.evaluate("n=>Object.keys(lkEnsure().reg).filter(k=>(lkEnsure().reg[k]||[]).some(r=>r&&r.name===n))",name)
  # new archer: wrong passcode refused
  ticks([N[1]]);pg.fill('#lkregname','Testy Newarcher');pg.fill('#lkregbow','Recurve');pg.fill('#lkregpin','4321');pg.fill('#lkregpin2','4322');pg.click('#lkreggo');pg.wait_for_timeout(800)
  chk('new archer: mismatched PINs refused',('do not match' in pg.inner_text('#lkregmsg')) and onN('Testy Newarcher')==[],pg.inner_text('#lkregmsg'))
  pg.fill('#lkregpin2','4321');pg.click('#lkreggo');pg.wait_for_timeout(2000)
  chk('new archer: link + name + PIN (no passcode) registers for the picked night only (night 2)',onN('Testy Newarcher')==[N[1]],onN('Testy Newarcher'))
  chk('new archer: confirmation shown',pg.locator('#lkregok').count()==1 and 'Night 2' in pg.inner_text('#lkregok'),pg.inner_text('body')[:200])
  # returning archer: wrong PIN refused
  ticks([N[2]]);pg.fill('#lkretname','Testy Newarcher');pg.fill('#lkretpin','9999');pg.click('#lkretgo');pg.wait_for_timeout(800)
  chk('returning: wrong PIN refused, no night added',('not right' in pg.inner_text('#lkretmsg')) and onN('Testy Newarcher')==[N[1]],pg.inner_text('#lkretmsg'))
  pg.fill('#lkretpin','4321');pg.click('#lkretgo');pg.wait_for_timeout(1000)
  chk('returning: name + PIN signs up for night 3 (no passcode)',onN('Testy Newarcher')==[N[1],N[2]],onN('Testy Newarcher'))
  # existing registered archer with a PIN can't re-register as new
  withpin=pg.evaluate("()=>{const lg=lkEnsure();for(const id of lg.order){const p=lkPinOf(lg,id);if(p&&p.pinHash&&!lkIsHostPerson(id,p.name))return p.name}return null}")
  if withpin:
    ticks([N[3]]);pg.fill('#lkregname',withpin);pg.fill('#lkregbow','x');pg.fill('#lkregpin','1111');pg.fill('#lkregpin2','1111');pg.click('#lkreggo');pg.wait_for_timeout(800)
    chk('existing archer with a PIN is sent to Already registered',('already registered' in pg.inner_text('#lkregmsg')),pg.inner_text('#lkregmsg'))
  # a PIN change does not sign anyone up for more nights
  pg.evaluate("()=>{const lg=lkEnsure();const id=lkFindArcher(lg,'Testy Newarcher');lkSetPin(lg,id,'Testy Newarcher','ab','cd')}")
  chk('PIN change keeps the same nights',onN('Testy Newarcher')==[N[1],N[2]],onN('Testy Newarcher'))
  pin_posts=[x for x in posts if '"pinOnly":1' in x]
  chk('PIN change relay message lists only that archer\'s nights',bool(pin_posts) and all('lkreg2' in x for x in pin_posts))
  # relay handling: old all-nights record still covers every night; per-night record covers only its nights
  r=pg.evaluate("n=>{const lg=lkEnsure();lkApplyReg({name:'Legacy Relay',at:Date.now(),allNights:1},lg);lkApplyReg({name:'Night Relay',at:Date.now(),nights:[n]},lg);const on=x=>Object.keys(lg.reg).filter(k=>lg.reg[k].some(r=>r&&r.name===x)).length;return [on('Legacy Relay'),on('Night Relay')]}",N[4])
  chk('relay: old all-nights record = 6 nights, per-night record = 1 night',r==[6,1],r)
  # hosts
  h=pg.evaluate("()=>{const lg=lkEnsure();const out=[];for(let w=1;w<=6;w++){const k=lkNightKey(lg,w);const rows=lg.reg[k]||[];out.push([rows.some(r=>r&&lkIsCoHostName&&lkIsCoHostName(r.name)),rows.some(r=>r&&lkIsHostRegName&&lkIsHostRegName(r.name)),lkPickerOrder(lg,w).some(id=>{const n=(lg.gn[id]||{}).n||'';return lkIsCoHostName(n)||id===LK_COHOST_ID||id==='lkhost:nate'})])}return out}")
  chk('Nate Evans on all 6 nights and in every night\'s paid list',all(x[0] and x[2] for x in h),h)
  chk('Nathe (host) registration on all 6 nights',all(x[1] for x in h),h)
  # existing data
  after=pg.evaluate("()=>{const lg=lkEnsure();return {reg:JSON.parse(JSON.stringify(lg.reg)),sc:JSON.stringify(lg.sc),grp:JSON.stringify(lg.grp),paid:JSON.stringify(lg.paid||{}),pot:JSON.stringify(lkPot(lg)),table:JSON.stringify(lkTable(lg))}}")
  kept=all(all(any(json.dumps(a)==json.dumps(r) or (a.get('id')==r.get('id') and a.get('name')==r.get('name')) for r in after['reg'].get(k,[])) for a in v) for k,v in base['reg'].items())
  chk('existing registrations all kept (every night)',kept and all(len(after['reg'][k])>=len(v) for k,v in base['reg'].items()))
  chk('night-1 scores, groups, paid ticks, pot unchanged',after['sc']==base['sc'] and after['grp']==base['grp'] and after['paid']==base['paid'] and after['pot']==base['pot'])
  chk('existing night-1 signups unchanged (only the test legacy relay row added)',json.dumps([r for r in after['reg'][N[0]] if r.get('name')!='Legacy Relay'])==json.dumps(base['reg'][N[0]]))
  # night lists: new archer only on nights 2 and 3
  L=pg.evaluate("()=>{const lg=lkEnsure();return [1,2,3,4].map(w=>lkNightSignups(lg,w).some(r=>r.name==='Testy Newarcher'))}")
  chk('login list per night: only nights signed up for',L==[False,True,True,False],L)
  P=pg.evaluate("()=>{const lg=lkEnsure();const id=lkFindArcher(lg,'Testy Newarcher');return [1,4].map(w=>lkPickerOrder(lg,w).includes(id))}")
  chk('paid/group list: not on nights not signed up for',P==[False,False],P)
  # home -> Event Registration button reaches the register page
  pg.evaluate("lkFlowHome(LK_CODE)");pg.wait_for_timeout(400);pg.click('#lkereg');pg.wait_for_timeout(800)
  chk('home Event Registration button opens the register page',pg.locator('#lkretform').count()==1 and pg.locator('#lkregform').count()==1)
  q=c.new_page();q.goto('http://127.0.0.1:8991/#lk-register');q.wait_for_timeout(2500)
  chk('poster/#lk-register link opens the register page directly',q.locator('#lkregform').count()==1 and q.locator('#lkretform').count()==1)
  nopin=pg.evaluate("()=>{const lg=lkEnsure();for(const id of lg.order){const p=lkPinOf(lg,id);const n=(lg.gn[id]||{}).n;if(n&&!(p&&p.pinHash)&&!lkIsHostPerson(id,n))return n}return null}")
  if nopin:
    pg.evaluate("lkRegisterView()");pg.wait_for_timeout(300);ticks([N[3]]);pg.fill('#lkregname',nopin);pg.fill('#lkregbow','x');pg.fill('#lkregpin','2222');pg.fill('#lkregpin2','2222');pg.click('#lkreggo');pg.wait_for_timeout(800)
    chk('a listed name with no PIN cannot be claimed from the open link',('without a PIN' in pg.inner_text('#lkregmsg')),pg.inner_text('#lkregmsg'))
  # login still checks the event passcode (host/scoring path unchanged)
  r1=pg.evaluate("async pw=>String(await lkUnlock(pw))",PW);r0=pg.evaluate("async()=>String(await lkUnlock('wrong-guess-1'))")
  chk('scoring login: passcode still accepted, wrong one refused',r1=='' and 'not right' in r0,r0)
  chk('no page errors',not errs,errs)
  chk('passcode never posted to relay',not any(PW in x for x in posts))
  b.close()
finally:srv.terminate()
print(f'\n{len(ok)} passed, {len(bad)} failed')
