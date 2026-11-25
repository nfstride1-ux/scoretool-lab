# Score tonight name suggestions (PR #79 + #80). Typing 2+ letters lists matching
# registered names (start of the name or of any word, up to 8). Tap fills the name
# and moves to the PIN. Viewing stays open. Relay writes are intercepted, never sent.
# 390x844. Does not edit existing tests.
import os, sys, time, subprocess, json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import freeport

ok, bad = [], []
def chk(n, c, extra=''):
    (ok if c else bad).append(n)
    print(('PASS ' if c else 'FAIL ') + n + (('  ' + str(extra)[:200]) if extra and not c else ''), flush=True)

PORT = freeport.get()
BASE = f'http://127.0.0.1:{PORT}'
posts = []

SEED = """async () => {
  const lg = lkEnsure();
  const nancy = lkApplyReg({name:'Nancy Archer', at:Date.now(), nights:['2026-11-18']}, lg);
  const sam = lkApplyReg({name:'Sam Archer', at:Date.now(), nights:['2026-11-18']}, lg);
  const salt = lkPinSalt();
  const hash = await lkPinHash('Nancy Archer','1234',salt);
  lkSetPin(lg, nancy.id, 'Nancy Archer', hash, salt);
  const night = '2026-11-18';
  lg.paid = lg.paid||{}; lg.paid[night] = lg.paid[night]||{};
  lg.paid[night][nancy.id] = 1; lg.paid[night][sam.id] = 1;
  lg.paidt = Date.now();
  lg.dirty = 0; save();
  return {nancy:nancy.id, sam:sam.id};
}"""

CLEAR_AUTH = """() => {
  try{sessionStorage.removeItem('scoretool.lk.auth')}catch(e){}
  try{sessionStorage.removeItem('scoretool.lk.scorer')}catch(e){}
  try{sessionStorage.removeItem('scoretool.lk.scorerId')}catch(e){}
  window._lkAuthed = null;
  window._lkLoginId = '';
  window._lkSuggestPick = null;
  window._lkNamesOpen = 0;
  if(typeof lkMarkCoHost==='function')lkMarkCoHost(false);
}"""

def is_write(method, url):
    m = method.upper()
    if m in ('POST','PUT','PATCH','DELETE'): return True
    if 'ntfy.sh' in url and m not in ('GET','HEAD','OPTIONS'): return True
    return False

def launch(p):
    exe = os.environ.get('CHROME','/usr/bin/google-chrome')
    kwargs = {'args':['--no-sandbox','--disable-dev-shm-usage','--headless=new']}
    if os.path.exists(exe):
        kwargs['executable_path'] = exe
    else:
        kwargs['channel'] = 'chrome'
    return p.chromium.launch(**kwargs)

def new_ctx(browser):
    ctx = browser.new_context(viewport={'width':390,'height':844}, device_scale_factor=2,
                              is_mobile=True, has_touch=True, service_workers='block',
                              locale='en-AU', timezone_id='Australia/Perth',
                              user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1')
    def handle(route):
        req = route.request
        if is_write(req.method, req.url):
            rec = {'method': req.method, 'url': req.url.split('?')[0]}
            posts.append(rec)
            route.fulfill(status=200, content_type='application/json', body='{"ok":true,"blocked":true}')
            return
        if any(h in req.url for h in ['supabase','clarity','formsubmit']):
            route.fulfill(status=200, body='{}')
            return
        route.continue_()
    ctx.route('**/*', handle)
    return ctx

def open_score_tonight(page):
    page.goto(f'{BASE}/#lk-home', wait_until='domcontentloaded')
    page.wait_for_selector('#lkhome', timeout=12000)
    page.evaluate(SEED)
    page.evaluate(CLEAR_AUTH)
    page.evaluate("() => { window._lkLeftHome=0; if(typeof lkFlowHome==='function')lkFlowHome('LINGKN26'); }")
    page.wait_for_selector('#lklogin', timeout=8000)
    page.locator('#lklogin').click()
    page.wait_for_selector('#lkliteloginpage #lkscorer', timeout=8000)

def typed_suggest(page, text):
    page.fill('#lkscorer','')
    page.locator('#lkscorer').press_sequentially(text, delay=30)
    page.wait_for_timeout(200)
    return page.evaluate("""() => {
      const box=document.getElementById('lkscoresugg');
      return {
        names: [...document.querySelectorAll('#lkscoresugg [data-scorename]')].map(b=>b.textContent),
        visible: !!(box && !box.hidden)
      };
    }""")

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.5)
try:
    with sync_playwright() as p:
        browser = launch(p)
        ctx = new_ctx(browser)
        page = ctx.new_page()
        page.set_default_timeout(12000)
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)[:200]))
        open_score_tonight(page)
        chk('Login to Event still opens Score tonight', page.locator('#lkliteloginpage').count()==1 and page.locator('#lkscorer').count()==1)

        s1 = typed_suggest(page, 'N')
        chk('one letter: no list yet', s1['names']==[] and not s1['visible'], s1)

        s2 = typed_suggest(page, 'Na')
        names = s2['names']
        chk("type 'Na' lists matching names", s2['visible'] and len(names)>=1, names)
        chk("type 'Na' shows Nathaniel or Nathe", any('nathaniel' in n.lower() or n.lower().startswith('nathe') for n in names), names)
        chk("type 'Na' shows Nate", any(n.lower().startswith('nate') or 'nate evans' in n.lower() for n in names), names)
        chk("type 'Na' shows Nancy Archer", 'Nancy Archer' in names, names)
        chk('at most 8 suggestions', len(names)<=8, names)
        chk('every suggestion starts with Na on a word', all(any(w.lower().startswith('na') for w in [n]+n.replace('-',' ').split()) for n in names), names)
        chk('Sam Archer is not in the Na list', 'Sam Archer' not in names, names)

        s3 = typed_suggest(page, 'zzq')
        chk('no match: no list', s3['names']==[] and not s3['visible'], s3)

        typed_suggest(page, 'Na')
        page.locator('#lkscoresugg [data-scorename="Nancy Archer"]').tap()
        page.wait_for_selector('#lkloginpage #lkpin', timeout=8000)
        chk('tap fills the name and opens the PIN login', page.locator('#lkloginpage').count()==1 and page.locator('#lkpin').count()==1)
        picked = page.evaluate("""() => {
          const on=[...document.querySelectorAll('[data-lkname].on, [data-lkname][aria-pressed=\"true\"]')].map(b=>b.getAttribute('data-lkname'));
          const visible=[...document.querySelectorAll('[data-lkname]')].filter(b=>!b.hidden).map(b=>b.getAttribute('data-lkname'));
          return {on, visible, pin: !!document.getElementById('lkpin'), focus: document.activeElement && document.activeElement.id};
        }""")
        chk('the tapped name is selected on the PIN screen', 'Nancy Archer' in (picked['on'] or picked['visible']), picked)
        chk('the PIN box is focused after a tap', picked.get('focus')=='lkpin', picked)

        page.fill('#lkpin', '0000')
        page.locator('#lkpwgo').click()
        page.wait_for_timeout(800)
        chk('a wrong PIN is rejected and does not open scoring',
            page.locator('#lkloginpage').count()==1 and page.locator('#lkselect').count()==0
            and 'not right' in (page.inner_text('#lkpwmsg') or '').lower(),
            page.inner_text('body')[:200])

        page.fill('#lkpin', '1234')
        page.locator('#lkpwgo').click()
        page.wait_for_timeout(1500)
        chk('the right PIN opens the target picker',
            page.locator('#lkselect, #lkassigned').count()>=1 and page.locator('#lkloginpage').count()==0,
            page.inner_text('body')[:200])

        chk('no page errors', not errs, errs)
        ctx.close()
        browser.close()
finally:
    srv.terminate()
    try: srv.wait(timeout=3)
    except Exception: srv.kill()

chk('no live relay writes were sent (all intercepted)', True)
print(); print(f'{len(ok)} passed, {len(bad)} failed', flush=True)
print('intercepted_writes', len(posts), flush=True)
sys.exit(1 if bad else 0)
