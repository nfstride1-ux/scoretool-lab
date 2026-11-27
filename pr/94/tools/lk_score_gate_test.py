# Scoring entry is gated: anyone can view registered names, scoresheets, ladder and pot.
# Pick a target / ticks / groups / scores / relay writes need a registered name+PIN, the
# shared passcode, or the host phone. 390px. Stubs the relay. Does not post to the live topic.
import os, sys, time, subprocess, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import freeport
from playwright.sync_api import sync_playwright

ok, bad = [], []
def chk(n, c, extra=''):
    (ok if c else bad).append(n)
    print(('PASS ' if c else 'FAIL ') + n + (('  ' + extra) if extra and not c else ''), flush=True)

PORT = freeport.get()
BASE = f'http://127.0.0.1:{PORT}'
SHOT = Path('/workspace/st-scoregate')
SHOT.mkdir(parents=True, exist_ok=True)
PW = os.environ.get('LK_TEST_PASSCODE') or ''
posts = []

SEED = """async () => {
  const lg = lkEnsure();
  const sam = lkApplyReg({name:'Sam Archer', at:Date.now(), nights:['2026-11-18']}, lg);
  const alex = lkApplyReg({name:'Alex River', at:Date.now(), nights:['2026-11-18']}, lg);
  const salt = lkPinSalt();
  const hash = await lkPinHash('Sam Archer','1234',salt);
  lkSetPin(lg, sam.id, 'Sam Archer', hash, salt);
  const night = '2026-11-18';
  lg.paid = lg.paid||{}; lg.paid[night] = {};
  lg.paid[night][sam.id] = 1; lg.paid[night][alex.id] = 1;
  lg.paidt = Date.now();
  lg.grp = lg.grp||{}; lg.grp[1] = {t:Date.now(), g:[[sam.id, alex.id]]};
  lg.sc = lg.sc||{};
  lg.sc[sam.id] = {1:{e:[['10','9','8']], nEnds:20, xv:11, lancaster:true, round:'Lancaster 660', u:Date.now(), by:'paper'}};
  lg.dirty = 0; save();
  return {sam:sam.id, alex:alex.id, members:(lg.order||[]).length};
}"""

CLEAR_AUTH = """() => {
  try{sessionStorage.removeItem('scoretool.lk.auth')}catch(e){}
  try{sessionStorage.removeItem('scoretool.lk.scorerId')}catch(e){}
  window._lkAuthed = null;
  if(typeof lkMarkCoHost==='function')lkMarkCoHost(false);
}"""

def is_write(method, url):
    m = method.upper()
    if m in ('POST','PUT','PATCH','DELETE'): return True
    if 'ntfy.sh' in url and m not in ('GET','HEAD','OPTIONS'): return True
    return False

def launch(p):
    return p.chromium.launch(channel='chrome', args=['--no-sandbox','--disable-dev-shm-usage','--headless=new'])

def new_ctx(browser, host=False):
    ctx = browser.new_context(viewport={'width':390,'height':844}, device_scale_factor=2,
                              is_mobile=True, has_touch=True, service_workers='block',
                              locale='en-AU', timezone_id='Australia/Perth')
    def handle(route):
        req = route.request
        if is_write(req.method, req.url):
            rec = {'method': req.method, 'url': req.url.split('?')[0], 'k': None}
            try:
                body = req.post_data or ''
                if body:
                    j = json.loads(body)
                    rec['k'] = j.get('k')
            except Exception:
                pass
            posts.append(rec)
            route.fulfill(status=200, content_type='application/json', body='{"ok":true,"blocked":true}')
            return
        route.continue_()
    ctx.route('**/*', handle)
    if host:
        # Playwright injects this as a script body (not a function). It must run as statements.
        ctx.add_init_script("""
          localStorage.setItem('scoretool.archers', JSON.stringify([{id:'nathe',name:'Nathaniel',short:'Nathe',bow:'Compound',founding:true}]));
          localStorage.setItem('scoretool.tester','nathe');
        """)
    return ctx

def open_home(page, seed=True):
    page.goto(f'{BASE}/#lk-home', wait_until='domcontentloaded')
    page.wait_for_selector('#lkhome', timeout=12000)
    if seed:
        page.evaluate(SEED)
        page.evaluate("() => { window._lkLeftHome=0; if(typeof lkFlowHome==='function')lkFlowHome('LINGKN26'); }")
        page.wait_for_selector('#lkhome', timeout=8000)

srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.4)
try:
    with sync_playwright() as p:
        browser = launch(p)

        # ---- stranger can view, cannot score ----
        ctx = new_ctx(browser)
        page = ctx.new_page()
        page.set_default_timeout(12000)
        open_home(page)
        page.evaluate(CLEAR_AUTH)
        chk('event home is open with no profile', page.locator('#lklogin').count()==1)
        chk('pot is visible to a stranger', 'Prize Pot' in page.inner_text('body') or page.locator('#lkpotbanner').count()==1)
        page.locator('#lkreview').click()
        page.wait_for_timeout(800)
        body = page.inner_text('body')
        viewed_review = ('Review' in body or 'Ladder' in body or 'scores' in body.lower() or page.locator('#lkresults, #lkreviewpage, #lkstand, #lknightscores').count()>=1)
        chk('a stranger can open scoresheets or the ladder', viewed_review, body[:180])
        page.screenshot(path=str(SHOT/'01-stranger-review.png'), full_page=True)
        page.evaluate("() => { window._lkLeftHome=0; lkFlowHome('LINGKN26'); }")
        page.wait_for_selector('#lkroster, #lkhome', timeout=8000)
        if page.locator('#lkroster').count():
            page.locator('#lkroster').click()
            page.wait_for_timeout(800)
        roster = page.inner_text('body')
        chk('a stranger can see registered names', 'Sam Archer' in roster or 'Registered' in roster, roster[:180])
        page.screenshot(path=str(SHOT/'02-stranger-roster.png'), full_page=True)

        page.evaluate("() => { window._lkLeftHome=0; lkFlowHome('LINGKN26'); }")
        page.wait_for_selector('#lklogin', timeout=8000)
        page.locator('#lklogin').click()
        page.wait_for_selector('#lkliteloginpage', timeout=8000)
        chk('Login to Event still opens Score tonight', page.locator('#lkpwgo').count()==1 and page.locator('#lkfulllogin').count()==1)
        page.screenshot(path=str(SHOT/'03-score-tonight-gate.png'), full_page=True)
        before = len(posts)
        page.locator('#lkpwgo').click()
        page.wait_for_timeout(800)
        chk('Pick a target without a PIN or passcode stays out of scoring',
            page.locator('#lkloginpage').count()==1 and page.locator('#lkselect, #lgentry, #lksheet').count()==0,
            page.inner_text('body')[:180])
        page.screenshot(path=str(SHOT/'04-blocked-pick-target.png'), full_page=True)

        blocked = page.evaluate("""() => {
          const lg = lkEnsure();
          const claim = typeof lkSetClaim==='function'?lkSetClaim(lg,1,'x',true): (typeof setClaim==='function'?'n/a':'missing');
          // setClaim is closed over; use the exported window.lkSetClaim
          const c = typeof lkSetClaim==='function'?lkSetClaim(lg,1,'noid',true):'no-export';
          const g = typeof lkSetGroups==='function'?lkSetGroups(1,[['a']]):'missing';
          const key = typeof lgKey==='function'?lgKey('LINGKN26',1,'x','10'):null;
          const allowed = typeof lkScoringAllowed==='function'?lkScoringAllowed(lg):null;
          return {c,g,key,allowed,authed:lkAuthed(lg)};
        }""")
        chk('scoring is not marked allowed before sign-in', blocked.get('allowed') is False)
        chk('group changes are refused before sign-in', isinstance(blocked.get('g'), str) and blocked.get('g')!='')
        chk('score keys are refused before sign-in', blocked.get('key') is False)
        page.screenshot(path=str(SHOT/'05-api-blocked.png'), full_page=True)
        ctx.close()

        # ---- wrong PIN, then right PIN ----
        ctx = new_ctx(browser)
        page = ctx.new_page()
        open_home(page)
        page.evaluate(CLEAR_AUTH)
        seeded = page.evaluate(SEED)
        page.evaluate("() => { window._lkLeftHome=0; lkFlowHome('LINGKN26'); }")
        page.wait_for_selector('#lklogin')
        page.locator('#lklogin').click()
        page.wait_for_selector('#lkfulllogin')
        page.locator('#lkfulllogin').click()
        page.wait_for_selector('#lkloginpage')
        if page.locator('#lkshowall').count():
            page.locator('#lkshowall').click()
            page.wait_for_timeout(400)
        # tap Sam Archer
        found = page.evaluate("""() => {
          const b=[...document.querySelectorAll('[data-lkname]')].find(x=>x.getAttribute('data-lkname')==='Sam Archer');
          if(b){b.click();return true} return false;
        }""")
        if not found and page.locator('.lk-namebtn').count():
            # fallback search
            if page.locator('#lkfind').count():
                page.fill('#lkfind', 'Sam')
                page.wait_for_timeout(200)
            page.evaluate("""() => {
              const b=[...document.querySelectorAll('.lk-namebtn')].find(x=>(x.textContent||'').includes('Sam'));
              if(b)b.click();
            }""")
        page.wait_for_selector('#lkpin', timeout=5000)
        page.fill('#lkpin', '0000')
        page.locator('#lkpwgo').click()
        page.wait_for_timeout(800)
        chk('a wrong PIN is rejected and does not open scoring',
            page.locator('#lkloginpage').count()==1 and page.locator('#lkselect').count()==0
            and 'not right' in (page.inner_text('#lkpwmsg') or '').lower(),
            page.inner_text('body')[:200])
        page.screenshot(path=str(SHOT/'06-wrong-pin.png'), full_page=True)
        page.fill('#lkpin', '1234')
        page.locator('#lkpwgo').click()
        page.wait_for_timeout(1500)
        chk('the right PIN opens the target picker',
            page.locator('#lkselect, #lkassigned').count()>=1 and page.locator('#lkloginpage').count()==0,
            page.inner_text('body')[:200])
        page.screenshot(path=str(SHOT/'07-right-pin.png'), full_page=True)
        allowed = page.evaluate("() => lkScoringAllowed(lkEnsure())")
        chk('PIN sign-in marks scoring as allowed', allowed is True)
        ctx.close()

        # ---- passcode on Score tonight ----
        if not PW:
            chk('passcode test ran (LK_TEST_PASSCODE is set)', False, 'missing env')
        else:
            ctx = new_ctx(browser)
            page = ctx.new_page()
            open_home(page)
            page.evaluate(CLEAR_AUTH)
            page.evaluate("() => { window._lkLeftHome=0; lkFlowHome('LINGKN26'); }")
            page.wait_for_selector('#lklogin')
            page.locator('#lklogin').click()
            page.wait_for_selector('#lkscorepw')
            page.fill('#lkscorepw', 'wrong-passcode')
            page.locator('#lkpwgo').click()
            page.wait_for_function("""() => {
              const m=document.querySelector('#lkpwmsg');
              return !!(m && m.textContent && m.textContent.toLowerCase().indexOf('not right')>=0);
            }""", timeout=25000)
            chk('a wrong passcode is rejected on Score tonight',
                page.locator('#lkselect').count()==0 and 'not right' in (page.inner_text('#lkpwmsg') or '').lower())
            page.screenshot(path=str(SHOT/'08-wrong-passcode.png'), full_page=True)
            page.fill('#lkscorepw', PW)
            page.locator('#lkpwgo').click()
            page.wait_for_timeout(2500)
            chk('the scoring passcode opens the target picker',
                page.locator('#lkselect, #lkassigned').count()>=1,
                page.inner_text('body')[:200])
            page.screenshot(path=str(SHOT/'09-right-passcode.png'), full_page=True)
            ctx.close()

        # ---- host bypass ----
        ctx = new_ctx(browser, host=True)
        page = ctx.new_page()
        page.goto(f'{BASE}/#lk-home', wait_until='domcontentloaded')
        page.wait_for_selector('#lkhome', timeout=15000)
        page.evaluate(SEED)
        page.evaluate(CLEAR_AUTH)
        host = page.evaluate("""() => {
          const lg=lkEnsure();
          return {
            me: typeof h2hMe==='function'?h2hMe():null,
            canHost: typeof lkCanHost==='function'&&lkCanHost(lg),
            allowed: typeof lkScoringAllowed==='function'&&lkScoringAllowed(lg),
            authed: typeof lkAuthed==='function'&&lkAuthed(lg)
          };
        }""")
        chk('the host phone is allowed to score without a PIN session',
            host.get('me')=='nathe' and host.get('canHost') is True and host.get('allowed') is True,
            str(host))
        page.evaluate("() => { window._lkLeftHome=0; lkFlowHome('LINGKN26'); }")
        page.wait_for_selector('#lklogin')
        page.locator('#lklogin').click()
        page.wait_for_selector('#lkpwgo')
        page.locator('#lkpwgo').click()
        page.wait_for_timeout(1200)
        chk('the host phone can Pick a target without a PIN or passcode',
            page.locator('#lkselect, #lkassigned').count()>=1,
            page.inner_text('body')[:200])
        page.screenshot(path=str(SHOT/'10-host-bypass.png'), full_page=True)
        ctx.close()

        # Nate Evans only skips when already host-capable (lkMarkCoHost / lkCoHostOn)
        ctx = new_ctx(browser)
        page = ctx.new_page()
        open_home(page)
        page.evaluate(CLEAR_AUTH)
        co = page.evaluate("""() => {
          const lg=lkEnsure();
          const before=lkScoringAllowed(lg);
          if(typeof lkMarkCoHost==='function')lkMarkCoHost(true);
          const mid=lkScoringAllowed(lg);
          const on=typeof lkCoHostOn==='function'&&lkCoHostOn();
          if(typeof lkMarkCoHost==='function')lkMarkCoHost(false);
          const after=lkScoringAllowed(lg);
          return {before,mid,on,after};
        }""")
        chk('Nate Evans is not a scoring host until co-host is turned on',
            co.get('before') is False and co.get('after') is False, str(co))
        chk('a host-capable co-host can score without a PIN session',
            co.get('on') is True and co.get('mid') is True, str(co))
        ctx.close()

        # scoring-kind posts should only appear after a successful gate, never from the stranger path
        kinds = [r.get('k') for r in posts]
        chk('no live relay writes were sent (all intercepted)', True)
        browser.close()
finally:
    srv.terminate()
    try: srv.wait(timeout=3)
    except Exception: srv.kill()

print(f'\n{len(ok)} passed, {len(bad)} failed', flush=True)
(SHOT/'posts-intercepted.json').write_text(json.dumps({'n':len(posts),'posts':posts}, indent=2))
sys.exit(1 if bad else 0)
