# The Lingkana login PIN and passcode stay above the fixed Back/Login bar.
# 390x844 and 375x667, with 12 or more names. A sign-up made before the clear
# is not applied again when its message time is later. A sign-up made after the cut stays.
import os, sys, time, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import guard
from playwright.sync_api import sync_playwright

ok, bad = [], []
def chk(n, c, extra=''):
    (ok if c else bad).append(n)
    print(('PASS ' if c else 'FAIL ') + n + (('  ' + extra) if extra and not c else ''))

PORT = '8896'
BASE = f'http://127.0.0.1:{PORT}'
SHOT = Path('/opt/cursor/artifacts')
SHOT.mkdir(parents=True, exist_ok=True)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.5)

NAMES = ['Alex River','Casey Ng','Dana Chapman','Eli Archer','Jordan Lee','Jo Archer',
         'Lou Archer','Lee Archer','Mik Archer','Riley Chen','Sam Archer','Sporty',
         'Tai Archer','Xavier Clark']

SEED = """(names) => {
  const lg = lkEnsure();
  names.forEach((name, i) => lkApplyReg({name, at: Date.now() + i, bow: 'Recurve'}, lg));
  return (lkNightSignups(lg, 1) || []).map(r => r && r.name);
}"""

def visible(page, sel):
    return page.evaluate("""(sel) => {
      const el = document.querySelector(sel);
      const bar = document.querySelector('#lkloginpage .lk-bar');
      if (!el || !bar || el.offsetParent === null && getComputedStyle(el).position !== 'fixed') {
        const box = document.querySelector(sel === '#lkpw' ? '#lkpassbox' : '#lkpinbox');
        if (box && box.hidden) return {ok:false, hidden:true};
      }
      if (!el || !bar) return {ok:false, missing:true};
      const r = el.getBoundingClientRect();
      const b = bar.getBoundingClientRect();
      const view = window.visualViewport;
      const bottom = view ? view.offsetTop + view.height : window.innerHeight;
      const limit = Math.min(b.top, bottom);
      return {ok: r.height > 20 && r.top >= 0 && r.bottom <= limit - 2, top: Math.round(r.top), bottom: Math.round(r.bottom), bar: Math.round(b.top), h: Math.round(r.height)};
    }""", sel)

def open_login(page, url):
    page.goto(BASE + url, wait_until='domcontentloaded')
    page.wait_for_selector('#lklogin, #lkloginpage', timeout=8000)
    if page.locator('#wnx').count():
        page.locator('#wnx').click()
        page.wait_for_timeout(150)
    if page.locator('#lklogin').count():
        page.locator('#lklogin').click()
    page.wait_for_selector('#lkloginpage', timeout=5000)

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome',
                              args=['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'])
        for width, height, tag in ((390, 844, '390'), (375, 667, '375')):
            ctx = b.new_context(viewport={'width': width, 'height': height}, device_scale_factor=2, is_mobile=True, has_touch=True)
            page = ctx.new_page()
            errs = []
            page.on('pageerror', lambda e: errs.append(str(e)))
            open_login(page, '/?tester=nathe#lk-home')
            listed = page.evaluate(SEED, NAMES)
            page.evaluate("() => { window._lkNamesOpen = 1; window._lkFlowNight = 1; lkFlowHome('LINGKN26'); }")
            page.locator('#lklogin').click()
            page.wait_for_selector('#lkscorernames .lk-namebtn', timeout=5000)
            count = page.locator('#lkscorernames .lk-namebtn').count()
            chk(f'{tag}: the login lists 12 or more names', count >= 12, str(count)+' '+str(listed[:4]))
            page.wait_for_selector('#lkpw', timeout=5000)
            page.locator('#lkpw').scroll_into_view_if_needed()
            page.wait_for_timeout(100)
            box = visible(page, '#lkpw')
            chk(f'{tag}: the passcode input sits fully above the Back/Login bar', box.get('ok') is True, str(box))
            page.screenshot(path=str(SHOT / f'lingkana-login-passcode-{tag}.png'))
            page.evaluate("() => { const s=document.getElementById('scroller'); if(s) s.scrollTop=s.scrollHeight; }")
            page.locator('#lkpw').focus()
            page.wait_for_timeout(400)
            lifted = visible(page, '#lkpw')
            chk(f'{tag}: focusing the passcode keeps it above the bar', lifted.get('ok') is True, str(lifted))
            page.screenshot(path=str(SHOT / f'lingkana-login-passcode-focus-{tag}.png'))
            chk(f'{tag}: no page errors', not errs, str(errs[:2]))
            ctx.close()

        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        page = ctx.new_page()
        open_login(page, '/#lk-home')
        page.evaluate(SEED, NAMES)
        page.evaluate("() => { window._lkNamesOpen = 0; lkFlowHome('LINGKN26'); }")
        page.locator('#lklogin').click()
        page.wait_for_selector('#lkshowall', timeout=5000)
        page.locator('#lkshowall').click()
        page.locator('#lkscorernames .lk-namebtn', has_text='Sam Archer').click()
        page.wait_for_selector('#lkpin', timeout=4000)
        for sel, label in (('#lkpin', 'PIN'), ('#lkpin2', 'PIN again'), ('#lkpw', 'passcode')):
            page.locator(sel).scroll_into_view_if_needed()
            box = visible(page, sel)
            chk(f'a new PIN and the passcode are above the bar ({label})', box.get('ok') is True, str(box))
        page.screenshot(path=str(SHOT / 'lingkana-login-pin-390.png'))
        ctx.close()

        ctx = b.new_context(viewport={'width': 390, 'height': 844})
        page = ctx.new_page()
        page.goto(BASE + '/?tester=nathe#lk-home', wait_until='domcontentloaded')
        page.wait_for_timeout(400)
        kept = page.evaluate("""() => {
          const lg = lkEnsure();
          const born = lkApplyReg({name:'Wednesday Archer', at: Date.now(), bow:'Recurve'}, lg);
          const oldMsg = {k:'lkreg', code:'LINGKN26', t: Date.now(), rec:{name:'Ada Archer', id:'gada', at: LK_FRESH + 20}};
          const replay = (!(lg.fresh) || +oldMsg.t >= lg.fresh) && lkRegKept(lg, oldMsg.rec.at);
          if (replay) lkApplyReg(oldMsg.rec, lg);
          const live = lkRegKept(lg, Date.now());
          lgMerge(lg, {
            k:'ls', code:'LINGKN26', by:'nathe', host:'nathe', format:'lingkana',
            fresh: LK_CLEAR, clear: LK_CLEAR, wt: Date.now(), t: Date.now(),
            reg: {'2026-11-18': [
              {id:'gada', name:'Ada Archer', at: LK_FRESH + 50},
              {id: born.id, name:'Wednesday Archer', at: Date.now()}
            ]}
          });
          lkFresh(lg);
          const names = (lg.reg['2026-11-18'] || []).map(r => r.name);
          return {replay, live, ada: names.includes('Ada Archer'), wednesday: names.includes('Wednesday Archer'), names};
        }""")
        chk('a registration made before the cut is not kept when it is sent again',
            kept['replay'] is False and kept['ada'] is False, str(kept))
        chk('a registration made after the cut stays through a later reset',
            kept['live'] is True and kept['wednesday'] is True, str(kept))
        b.close()
finally:
    srv.terminate()

print(f'\n{len(ok)} passed, {len(bad)} failed')
sys.exit(1 if bad else 0)
