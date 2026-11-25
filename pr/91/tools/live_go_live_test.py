# Live-root event home after the 12 Nov go-live (event-home QR, lk-onion26).
# Stubs the ntfy relay. Does not post to the live topic.
import json, os, sys, time, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import guard
from playwright.sync_api import sync_playwright

ok, bad = [], []
def chk(n, c, extra=''):
    (ok if c else bad).append(n)
    print(('PASS ' if c else 'FAIL ') + n + (('  ' + extra) if extra and not c else ''))

PORT = '8797'
BASE = f'http://localhost:{PORT}'
SHOT = Path('/workspace/scoretool/test-ui')
SHOT.mkdir(parents=True, exist_ok=True)
LIVE_VER = 'v2026-11-17-2405-loginfit'
TEST_VER = 'v2026-11-12-0840-test'
QR_URL = 'https://nfstride1-ux.github.io/scoretool-demo/#lk-home'

srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)
HOME_BTNS = ['Login to Event', 'Login with QR Code', 'Event Registration', 'Review Scoresheet', 'Rules']

try:
    live_v = json.loads((ROOT / 'version.json').read_text())['version']
    test_v = json.loads((ROOT / 'test' / 'version.json').read_text())['version']
    chk('live-root version.json is v2026-11-17-2405-loginfit', live_v == LIVE_VER, live_v)
    chk('/test/ version.json is still v2026-11-12-0840-test', test_v == TEST_VER, test_v)
    chk('live lgTopic still uses the live2 Lingkana relay',
        "lingkn26-live2" in (ROOT / 'league.js').read_text())
    chk('live invite code is lk-onion26',
        "LK_POSTER_CODE='lk-onion26'" in (ROOT / 'lingkana.js').read_text())
    chk('LK_FRESH is the 17 Nov wipe of test sign-ups',
        'const LK_FRESH=1794881040000' in (ROOT / 'lingkana.js').read_text())
    chk('lkEventHomeUrl target is the live event-home',
        "LK_PUBLIC_BASE='https://nfstride1-ux.github.io/scoretool-demo/'" in (ROOT / 'lingkana.js').read_text()
        and "LK_HOME_HASH='#lk-home'" in (ROOT / 'lingkana.js').read_text())

    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome',
                              args=['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'])
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        if hasattr(guard, 'attach'):
            guard.attach(ctx)
        page = ctx.new_page()
        page.route(guard.RELAY, lambda route: route.fulfill(status=200, body='', headers={
            'access-control-allow-origin': '*', 'content-type': 'application/json'}))

        # Bare live root stays the normal app (not an automatic event list)
        page.goto(f'{BASE}/', wait_until='networkidle')
        page.wait_for_timeout(900)
        chk('live root without a hash is not taken over by the event home',
            page.locator('#lkhome').count()==0,
            page.inner_text('body')[:200])

        # QR / share target
        page.goto(f'{BASE}/#lk-home', wait_until='networkidle')
        page.wait_for_timeout(800)
        page.wait_for_selector('#lkhome', timeout=8000)
        htxt = page.inner_text('#lkhome')
        chk('live #lk-home opens the Lingkana event home',
            page.locator('#lkhome').count()==1 and all(lab in htxt for lab in HOME_BTNS),
            htxt[:240])
        chk('Get ScoreTool is reachable on the live event-home',
            page.locator('#lkgetapp, #lkgetbox').count()>=1 and 'get scoretool' in htxt.lower(),
            htxt[:240])
        ev_url = page.evaluate("() => (typeof lkEventHomeUrl==='function'&&lkEventHomeUrl())||''")
        chk('lkEventHomeUrl is the live event-home URL', ev_url == QR_URL, ev_url)
        page.screenshot(path=str(SHOT / 'live-event-home.png'), full_page=False)

        # registration link opens the form, not the event home
        page.goto(f'{BASE}/lk-register.html', wait_until='networkidle')
        page.wait_for_timeout(800)
        page.wait_for_selector('#lkregpage', timeout=8000)
        chk('live lk-register.html opens the register form',
            page.locator('#lkregpage').count()==1 and page.locator('#lkhome').count()==0
            and page.locator('#lkregcode').count()==0,
            page.evaluate('() => location.href'))

        # Event Registration without Nathe
        rtxt = page.inner_text('#lkregpage')
        chk('live register form is name and optional bow, email and phone, with no invite code or shoot night',
            page.locator('#lkregname, #lkregbow, #lkregemail, #lkregphone').count()==4
            and page.locator('#lkregnight').count()==0
            and page.locator('#lkregcode').count()==0
            and 'register for the lingkana league' in rtxt.lower()
            and 'nathe' not in rtxt.lower() and 'nathaniel' not in rtxt.lower()
            and 'get scoretool' in rtxt.lower()
            and page.locator('#lkqrsvg svg').count()==1,
            rtxt[:300])
        page.screenshot(path=str(SHOT / 'live-register-without-nathe.png'), full_page=False)
        page.fill('#lkregname', 'Sam Archer')
        if page.locator('#lkregemail').count():
            page.fill('#lkregemail', 'sam@example.com')
        if page.locator('#lkregpin').count():
            page.fill('#lkregpin', '1234')
            page.fill('#lkregpin2', '1234')
        page.locator('#lkreggo').click()
        page.wait_for_timeout(800)
        page.wait_for_selector('#lkregok', timeout=4000)
        chk('live register saves with no invite code and keeps the same fields',
            'registered' in (page.inner_text('#lkregok') or '').lower()
            and page.locator('#lkregcode').count()==0
            and page.locator('#lkregemail').count()==1,
            page.inner_text('#lkregpage')[:240] if page.locator('#lkregpage').count() else '')
        page.screenshot(path=str(SHOT / 'live-register-tap-name.png'), full_page=False)

        # Paid archers are grouped. There is no 13-bubble target picker.
        placed = page.evaluate("""() => {
          try { sessionStorage.setItem('scoretool.lk.auth','LINGKN26'); } catch(e) {}
          window._lkAuthed = 'LINGKN26';
          const lg = (typeof lkEnsure==='function'&&lkEnsure())||null;
          if (!lg) return {err:'no league'};
          const night = (typeof LK_DATES!=='undefined'&&LK_DATES[0]) || '2026-11-18';
          const names = ['Sam Archer','Alex River','Kim Brook','Pat Reed','Jo West'];
          lg.reg = lg.reg || {}; lg.order = lg.order || []; lg.gn = lg.gn || {}; lg.paid = lg.paid || {};
          lg.reg[night] = names.map((name,i) => {
            const id = 'demo'+(i+1);
            if (!lg.order.includes(id)) lg.order.push(id);
            lg.gn[id] = {n:name, t:Date.now()};
            return {id, name, at:Date.now()};
          });
          lg.paid[night] = {};
          names.forEach((name,i)=>{ lg.paid[night]['demo'+(i+1)] = 1; });
          if (typeof save==='function') save();
          try { sessionStorage.setItem('scoretool.lk.scorerId','demo1'); sessionStorage.setItem('scoretool.lk.scorer','Sam Archer'); } catch(e) {}
          window._lkFlowNight = 1;
          window._lkTarget = 0; window._lkPicked = [];
          if (typeof lkFlowAssigned==='function') lkFlowAssigned();
          const built = (typeof lkAssignGroups==='function') ? lkAssignGroups(lg, 1) : null;
          return {bubbles: document.querySelectorAll('#lktargets .lk-tbtn, button[data-lktgt]').length,
                  target: (document.getElementById('lkassigned')||{}).getAttribute&&document.getElementById('lkassigned').getAttribute('data-target'),
                  groups: built && built.groups && built.groups.length,
                  first: built && built.groups && built.groups[0] && built.groups[0].names};
        }""")
        page.wait_for_selector('#lkassigned', timeout=5000)
        chk('live scoring opens the assigned group and does not show target bubbles',
            placed.get('bubbles')==0 and page.locator('#lktargets').count()==0
            and page.locator('#lkassigned').count()==1
            and placed.get('groups')==2
            and placed.get('first')==['Alex River','Jo West','Kim Brook'],
            str(placed))
        page.screenshot(path=str(SHOT / 'live-thirteen-targets.png'), full_page=False)

        # Onion Shed blank login
        page.evaluate("() => { if (typeof lkFlowHome==='function') lkFlowHome('ONIONSH2'); }")
        page.wait_for_selector('#lkhome', timeout=4000)
        page.locator('#lklogin').click()
        page.wait_for_selector('#lkloginpage', timeout=4000)
        scorer = page.locator('#lkscorer').input_value() if page.locator('#lkscorer').count() else 'MISSING'
        codev = page.locator('#lkcode').input_value() if page.locator('#lkcode').count() else 'MISSING'
        pwv = page.locator('#lkpw').input_value() if page.locator('#lkpw').count() else ''
        chk('live Onion Shed login and password fields are blank',
            scorer=='' and codev=='' and pwv==''
            and 'no code or scoring password is required' in page.inner_text('#lkloginpage').lower(),
            page.inner_text('#lkloginpage')[:200])
        page.screenshot(path=str(SHOT / 'live-onion-shed-login-blank.png'), full_page=False)
        page.locator('#lkpwgo').click()
        page.wait_for_timeout(500)
        chk('live Onion Shed login proceeds without a code or password',
            page.locator('#lktargets, #lkselect, #lkhome, #lkloginpage').count()>=1,
            page.inner_text('body')[:200])

        # /test/ still boots
        tpage = ctx.new_page()
        tpage.route(guard.RELAY, lambda route: route.fulfill(status=200, body='', headers={
            'access-control-allow-origin': '*', 'content-type': 'application/json'}))
        tpage.goto(f'{BASE}/test/', wait_until='networkidle')
        tpage.wait_for_timeout(800)
        tpage.wait_for_selector('#lkevlist, .st-evcard, #lkhome', timeout=8000)
        chk('/test/ still opens the event list or event home',
            tpage.locator('#lkevlist, .st-evcard, #lkhome').count()>=1,
            tpage.inner_text('body')[:200])
        tpage.goto(f'{BASE}/test/version.json')
        tv = json.loads(tpage.inner_text('body'))
        chk('HTTP /test/version.json is still the test build', tv.get('version')==TEST_VER, str(tv))
        tpage.goto(f'{BASE}/version.json')
        lv = json.loads(tpage.inner_text('body'))
        chk('HTTP /version.json is the new live build', lv.get('version')==LIVE_VER, str(lv))
        tpage.close()
        b.close()
finally:
    srv.terminate()

# poster file checks (not published, not in the repo)
poster = Path('/workspace/scoretool/lingkana-league-poster-2026-11-12.png')
chk('new poster PNG exists outside the repo', poster.is_file() and poster.stat().st_size>10000, str(poster))
try:
    import cv2
    img = cv2.imread(str(poster))
    val, pts, _ = cv2.QRCodeDetector().detectAndDecode(img)
    chk('new poster QR decodes to the live event-home URL', val==QR_URL, repr(val))
except Exception as e:
    chk('new poster QR decodes to the live event-home URL', False, str(e))

print(f'\n{len(ok)} passed, {len(bad)} failed')
if bad:
    print('FAILED:')
    for n in bad:
        print(' ', n)
    sys.exit(1)
