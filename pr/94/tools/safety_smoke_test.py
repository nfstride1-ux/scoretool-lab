#!/usr/bin/env python3
"""Fast phone-sized smoke of the live app tree.

Uses the same Playwright setup as the other tools (headless Chrome, 390x844,
tools/guard.py stubs the relay and blocks the service worker). The full
qa/run_regression.py suite stays the manual pre-deploy check. This file is the
one that runs on every pull request, and it stays under a few minutes.

Nothing here reads or prints a passcode. A wrong value is typed on purpose.
"""
import os, socket, subprocess, sys, time, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import guard  # noqa: E402  patches Playwright before launch
from playwright.sync_api import sync_playwright

ok, bad = [], []

def chk(name, cond, extra=''):
    (ok if cond else bad).append(name)
    line = ('PASS ' if cond else 'FAIL ') + name
    if extra and not cond:
        line += '  ' + extra[:240]
    print(line, flush=True)

def free_port():
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port

def chrome_path():
    for cand in ('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'):
        if os.path.isfile(cand):
            return cand
    return None

def launch(p):
    args = {'headless': True, 'args': ['--no-sandbox', '--disable-dev-shm-usage']}
    exe = chrome_path()
    if exe:
        args['executable_path'] = exe
    return p.chromium.launch(**args)

def track(page, sink):
    page.on('pageerror', lambda e: sink.append(str(e)))
    page.on('dialog', lambda d: d.accept())

def dismiss(page):
    if page.locator('#wnx').count():
        page.locator('#wnx').click()

def main():
    port = free_port()
    base = f'http://127.0.0.1:{port}'
    srv = subprocess.Popen(
        [sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1'],
        cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.4)
    t0 = time.time()
    try:
        with sync_playwright() as p:
            browser = launch(p)
            app_errs = []
            ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
            page = ctx.new_page()
            page.set_default_timeout(12000)
            track(page, app_errs)
            page.goto(base + '/?app=1', wait_until='domcontentloaded')
            page.wait_for_selector('#app', timeout=15000)
            dismiss(page)
            chk('app loads', page.locator('#app').count() == 1)
            if page.locator('#npc').count():
                page.fill('#npname', 'Smoke Archer')
                page.click('#npc')
            welcome = time.time() + 8
            ready = False
            while time.time() < welcome:
                if page.locator('#nmlater').count():
                    page.click('#nmlater')
                    page.wait_for_timeout(250)
                    continue
                if page.locator('#nmin').count():
                    page.fill('#nmin', 'Smoke')
                    page.click('#nmingo')
                    page.wait_for_timeout(250)
                    continue
                ready = page.evaluate("""() => {
                  const tabs = document.querySelector('#tabs');
                  const b = document.querySelector('#tabs button[data-v="score"]');
                  if (!tabs || tabs.hidden || !b || document.querySelector('#nmscreen')) return false;
                  return b.getBoundingClientRect().height > 20;
                }""")
                if ready:
                    break
                page.wait_for_timeout(200)
            chk('welcome finished and the Score tab is on screen', ready)
            page.evaluate("() => document.body.classList.remove('kb-open')")
            dismiss(page)
            chk('app loads with no JS errors', not app_errs, ' | '.join(app_errs[:3]))
            page.evaluate("""() => document.querySelector('#tabs button[data-v="score"]').click()""")
            # the display-name prompt can open a moment after the Score tab (race seen in CI, 26 Nov 2026): wait for either, then 'Not now'
            try: page.wait_for_selector('[data-cstp="casual"], #nmlater', state='attached', timeout=8000)
            except Exception: pass
            for _ in range(3):
                if not page.locator('#nmlater').count(): break
                page.click('#nmlater'); page.wait_for_timeout(200)
                page.evaluate("""() => document.querySelector('#tabs button[data-v="score"]').click()""")
                page.wait_for_timeout(300)
            page.wait_for_selector('[data-cstp="casual"]', state='attached', timeout=8000)
            page.locator('[data-cstp="casual"]').evaluate("b => b.click()")
            page.wait_for_selector('[data-csdisc="indoor"]')
            page.click('[data-csdisc="indoor"]')
            page.wait_for_selector('#csrd')
            page.select_option('#csrd', 'Lancaster 660')
            page.click('#csgo')
            page.wait_for_selector('#csaddtop')
            page.click('#csaddtop')
            page.wait_for_selector('#csentryscreen [data-csentk="X"]')
            for _ in range(3):
                page.click('#csentryscreen [data-csentk="X"]')
            page.wait_for_function(
                """() => {
                  const b = document.querySelector('#csentryscreen .ad-num b');
                  return b && b.textContent.trim() === '33';
                }""",
                timeout=8000)
            end = page.locator('#csentryscreen .ad-num b').first.inner_text().strip()
            chk('casual Lancaster end shows the per-end score', end == '33', end)
            math = page.evaluate(
                """() => {
                  const round = 'Lancaster 660';
                  const R = ROUNDS[round];
                  const ends = Array.from({length: R.ends}, () => Array.from({length: R.ape}, () => 'X'));
                  const s = {round, ends};
                  return {
                    xv: xValOf(s),
                    one: endSum(['X','X','X'], s),
                    all: total(s),
                    max: R.max,
                    ends: R.ends,
                    ape: R.ape,
                    vegas: xValOf({round: 'Vegas 300'}),
                    league: lgXV({round, xv: 11, lancaster: true}),
                    casual: csTotal(ends, {round})
                  };
                }""")
            chk('Lancaster X scores 11', math.get('xv') == 11 and math.get('one') == 33 and math.get('league') == 11, str(math))
            chk('Lancaster maximum is 660', math.get('all') == 660 and math.get('max') == 660 and math.get('casual') == 660 and math.get('ends') == 20 and math.get('ape') == 3, str(math))
            chk('a non-Lancaster X still scores 10', math.get('vegas') == 10, str(math))
            chk('scoring ran with no JS errors', not app_errs, ' | '.join(app_errs[:3]))
            ctx.close()

            lk_errs = []
            ctx = browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
            page = ctx.new_page()
            page.set_default_timeout(12000)
            track(page, lk_errs)
            page.goto(base + '/?v=home#lk-home', wait_until='domcontentloaded')
            page.wait_for_selector('#lkhome', timeout=15000)
            chk('#lk-home loads', 'Login to Event' in page.inner_text('#lkhome'))
            page.goto(base + '/?v=reg#lk-register', wait_until='domcontentloaded')
            page.wait_for_selector('#lkregform', timeout=15000)
            chk('#lk-register loads', page.locator('#lkregname').count() == 1)
            page.goto(base + '/?v=res#lk-results', wait_until='domcontentloaded')
            page.wait_for_selector('#lkresults', timeout=15000)
            page.wait_for_selector('#lknightscores')
            chk('leaderboard renders', page.locator('#lknightscores').count() == 1 and 'Archer' in page.inner_text('#lknightscores'))
            page.click('[data-lkmtab="ladder"]')
            page.wait_for_selector('#lkresstand')
            ladder = page.inner_text('#lkmtab-ladder')
            chk('League Ladder renders', page.locator('#lkresstand').is_visible() and 'Best 4' in ladder, ladder[:120])
            page.goto(base + '/?v=pw#lk-home', wait_until='domcontentloaded')
            page.wait_for_selector('#lklogin')
            page.click('#lklogin')
            page.wait_for_selector('#lkfulllogin')
            page.click('#lkfulllogin')
            page.wait_for_selector('#lkloginpage')
            if page.locator('#lkshowall').count():
                page.click('#lkshowall')
            page.wait_for_selector('.lk-namebtn')
            opened = False
            count = page.locator('.lk-namebtn').count()
            for i in range(count):
                page.locator('.lk-namebtn').nth(i).click()
                if page.locator('#lkpassbox').is_visible():
                    opened = True
                    break
            chk('the passcode box is on the login screen', opened)
            if opened:
                page.fill('#lkpw', 'wrong-passcode')
                page.click('#lkpwgo')
                page.wait_for_function(
                    """() => {
                      const m = document.querySelector('#lkpwmsg');
                      return !!(m && m.textContent && m.textContent.indexOf('not right') >= 0);
                    }""",
                    timeout=25000)
                msg = page.locator('#lkpwmsg').inner_text()
                still = page.locator('#lkloginpage').count() == 1
                chk('a wrong passcode is rejected', 'not right' in msg and still, msg)
            chk('Lingkana pages load with no JS errors', not lk_errs, ' | '.join(lk_errs[:3]))
            ctx.close()
            browser.close()
    finally:
        srv.terminate()
        try:
            srv.wait(timeout=3)
        except Exception:
            srv.kill()
    print(f'\n{len(ok)} passed, {len(bad)} failed, {time.time()-t0:.0f}s', flush=True)
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main())
