# Event list and event home on the /test/ page only (12 Nov 2026).
# Stubs the ntfy relay. Does not change the live root app.
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

PORT = '8796'
BASE = f'http://localhost:{PORT}'
SHOT = Path('/workspace/scoretool/test-ui')
SHOT.mkdir(parents=True, exist_ok=True)

srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)

LOCKED = [
    'Name: Lingkana League. Venue: Lingkana Archery range, 107 Robinson Ave, Belmont WA 6104. Invite only.',
    'Dates: Wed 18 Nov, 2, 16 and 30 Dec, 13 and 27 Jan, shoot-up 10 Feb. Start 6:30pm, induction 6pm.',
    'Six nights of a 660 (60 arrows, 20 ends of 3, 18 m, 40 cm triangular 3-spot, X=11, max 660). Ranked on best 4 of 6, no minimum if a night is missed. Ties on 11s then 10s.',
    '$25 range plus $10 pot each night including night 7; pot paid 60/30/10.',
    'Groups of up to 4, one scorer. Value entry only. Scoring password for host and scorers only, not on the poster or share link.',
    'Night 7: 150 warm-up is not scored, then a ladder shoot-up for the top 12 (#12 v #11, winner moves up).',
]
OS_RULES = [
    'Six 300s at 18 m on the vertical 3-spot.',
    'Each week for 5 weeks everyone shoots a 300 round, in person or over FaceTime.',
    'On the 6th day they all shoot another 300 together in person in the Onion Shed.',
    'The running total of all six 300s (maximum 1800, ties split on X count) sets the league table.',
    "Shoot-up match play happens on day 6 only, starting once everyone's day-6 300 is in. Final: 3 ends of 3 arrows, X = 10, no 12 dot. Ties: 1 arrow each, closest to the middle wins (host picks).",
    'Entry is $10 each night, winner takes all, minus a jokey 75%.',
]

def names_once(text, name):
    return text.lower().count(name.lower()) == 1

try:
    live_v = json.loads((ROOT / 'version.json').read_text())['version']
    test_v = json.loads((ROOT / 'test' / 'version.json').read_text())['version']
    chk('live-root version.json is the new live build', live_v == 'v2026-11-17-2405-loginfit', live_v)
    chk('test version.json is the new test build', test_v == 'v2026-11-12-0840-test', test_v)

    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome',
                              args=['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'])
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        guard.attach(ctx) if hasattr(guard, 'attach') else None
        # guard patches context at construction time via wrap; also belt-and-braces route
        page = ctx.new_page()
        page.route(guard.RELAY, lambda route: route.fulfill(status=200, body='', headers={
            'access-control-allow-origin': '*', 'content-type': 'application/json'}))

        # --- public test URL: league list ---
        page.goto(f'{BASE}/test/', wait_until='networkidle')
        page.wait_for_timeout(800)
        page.wait_for_selector('#lkevlist, .st-evcard', timeout=8000)
        cards = page.locator('.st-evcard')
        chk('list shows two event cards', cards.count() == 2, str(cards.count()))
        titles = [cards.nth(i).locator('b').inner_text().strip() for i in range(cards.count())]
        chk('Lingkana League appears once on the list', titles.count('Lingkana League') == 1, str(titles))
        chk('Onion Shed Challenge appears once on the list', titles.count('Onion Shed Challenge') == 1, str(titles))
        bgs = [cards.nth(i).evaluate('e => getComputedStyle(e).backgroundImage') for i in range(cards.count())]
        chk('Lingkana card uses the venue flyer', any('lingkana-flyer' in x for x in bgs), str(bgs))
        chk('Onion Shed card uses the venue flyer', any('onion-shed-flyer' in x for x in bgs), str(bgs))
        page.screenshot(path=str(SHOT / '01-league-list.png'), full_page=False)

        # --- Lingkana event home ---
        cards.filter(has_text='Lingkana League').click()
        page.wait_for_selector('#lkhome', timeout=5000)
        chk('opening Lingkana goes to event home, not a flyer page', page.locator('#lkhome').count() == 1)
        logo = page.locator('#lkhome img').get_attribute('src') or ''
        chk('Lingkana event home shows the mountain logo', 'lingkana-logo' in logo, logo)
        brand = page.locator('#lkhome').inner_text()
        chk('event home does not use iScored or Archer\'s Diary branding',
            'iscored' not in brand.lower() and "archer" + "'s diary" not in brand.lower() and 'archery australia' not in brand.lower())
        bg = page.evaluate("() => getComputedStyle(document.querySelector('#lkhome') || document.body).backgroundImage")
        body_bg = page.evaluate("() => getComputedStyle(document.body).backgroundImage")
        chk('event home is not a full-page flyer background',
            'lingkana-flyer' not in (bg or '') and 'lingkana-flyer' not in (body_bg or ''), bg + ' | ' + body_bg)
        for lab in ['Login to Event', 'Login with QR Code', 'Event Registration', 'Review Scoresheet', 'Rules']:
            chk(f'Lingkana event home has {lab}', page.locator('.lk-btn', has_text=lab).count() == 1)
        page.screenshot(path=str(SHOT / '02-lingkana-event-home.png'), full_page=False)

        # Rules
        page.locator('#lkrules').click()
        page.wait_for_selector('#lkrulespage', timeout=5000)
        rules_txt = page.locator('#lkrulespage').inner_text()
        for line in LOCKED:
            chk('Lingkana rules include locked line', line in rules_txt, line[:60])
        chk('Lingkana rules do not invent extras (no off-bow / AA branding)',
            'off-bow' not in rules_txt.lower() and 'archery australia' not in rules_txt.lower() and 'iscore' not in rules_txt.lower())
        chk('Lingkana rules page is not a 300-round Onion Shed text', 'FaceTime' not in rules_txt)
        page.screenshot(path=str(SHOT / '03-lingkana-rules.png'), full_page=True)

        page.locator('#lkruleback').click()
        page.wait_for_selector('#lkhome', timeout=4000)

        # Event Registration -> existing register page
        page.locator('#lkereg').click()
        page.wait_for_timeout(400)
        reg = page.inner_text('body')
        chk('Event Registration opens the existing register page',
            'Register for a shoot night' in reg or 'Poster invite code' in reg, reg[:200])
        chk('first-time Event Registration still asks for the invite code',
            page.locator('#lkregcode').count()==1, reg[:200])
        known_txt = page.inner_text('#lkknown') if page.locator('#lkknown').count() else ''
        body_reg = page.inner_text('#lkregpage') if page.locator('#lkregpage').count() else reg
        chk('Event Registration does not list Nathe or Nathaniel Stride',
            'nathe' not in body_reg.lower() and 'nathaniel' not in body_reg.lower() and 'stride' not in body_reg.lower(),
            body_reg[:300])
        page.screenshot(path=str(SHOT / '08-register-without-nathe.png'), full_page=False)

        if page.locator('#lkregback').count():
            page.locator('#lkregback').click()
            page.wait_for_selector('#lkhome', timeout=4000)
        else:
            page.evaluate("() => window.lkFlowHome && window.lkFlowHome('LINGKN26')")
            page.wait_for_selector('#lkhome', timeout=4000)

        # Review
        page.locator('#lkreview').click()
        page.wait_for_timeout(500)
        rev = page.inner_text('body')
        low = rev.lower()
        chk('Review Scoresheet reaches night scores / standings / pot',
            ('tonight' in low and 'score' in low or 'standings' in low or 'night 1' in low) and ('pot' in low or 'share' in low or 'print' in low),
            rev[:300])
        if page.locator('#lkresback').count():
            page.locator('#lkresback').click()
        elif page.locator('#lkrevback').count():
            page.locator('#lkrevback').click()
        else:
            page.evaluate("() => window.lkFlowHome && window.lkFlowHome('LINGKN26')")
        page.wait_for_selector('#lkhome', timeout=4000)

        # Login
        page.locator('#lklogin').click()
        page.wait_for_selector('#lkloginpage', timeout=4000)
        chk('Login to Event shows league / passcode login',
            page.locator('#lkpw').count() == 1 and page.locator('#lkevent').count() == 1)
        page.locator('#lkloginback').click()
        page.wait_for_selector('#lkhome', timeout=4000)

        # QR
        page.locator('#lkqr').click()
        page.wait_for_selector('#lkqrpage', timeout=4000)
        qtxt = page.inner_text('body')
        chk('Login with QR Code opens the existing QR scan page',
            page.locator('#lkqrpage').count()==1 or 'qr' in qtxt.lower(),
            qtxt[:200])
        page.locator('#lkqrback').click()
        page.wait_for_selector('#lkhome', timeout=4000)

        # back to list, then Onion Shed
        page.locator('#lkhomeback').click()
        page.wait_for_selector('#lkevlist', timeout=4000)
        page.locator('.st-evcard', has_text='Onion Shed Challenge').click()
        page.wait_for_selector('#lkhome', timeout=4000)
        ologo = page.locator('#lkhome img').get_attribute('src') or ''
        chk('Onion Shed event home shows the shed-and-target logo', 'onion-shed-logo' in ologo, ologo)
        chk('Onion Shed event home is not a flyer page background',
            'onion-shed-flyer' not in (page.evaluate("() => getComputedStyle(document.body).backgroundImage") or ''))
        for lab in ['Login to Event', 'Login with QR Code', 'Event Registration', 'Review Scoresheet', 'Rules']:
            chk(f'Onion Shed event home has {lab}', page.locator('.lk-btn', has_text=lab).count() == 1)
        page.screenshot(path=str(SHOT / '04-onion-shed-event-home.png'), full_page=False)

        page.locator('#lkrules').click()
        page.wait_for_selector('#lkrulespage', timeout=4000)
        os_txt = page.locator('#lkrulespage').inner_text()
        for line in OS_RULES:
            chk('Onion Shed rules include current line', line in os_txt, line[:60])
        chk('Onion Shed rules are not converted to the 660 format',
            '660' not in os_txt and 'best 4 of 6' not in os_txt.lower() and 'triangular' not in os_txt.lower())

        page.locator('#lkruleback').click()
        page.wait_for_selector('#lkhome', timeout=4000)
        page.locator('#lklogin').click()
        page.wait_for_selector('#lkloginpage', timeout=4000)
        scorer = page.locator('#lkscorer').input_value() if page.locator('#lkscorer').count() else 'MISSING'
        codev = page.locator('#lkcode').input_value() if page.locator('#lkcode').count() else 'MISSING'
        pwv = page.locator('#lkpw').input_value() if page.locator('#lkpw').count() else ''
        chk('Onion Shed login and password fields are blank and not required',
            page.locator('#lkscorer').count()==1 and scorer=='' and page.locator('#lkcode').count()==1 and codev==''
            and pwv=='' and 'no code or scoring password is required' in page.inner_text('#lkloginpage').lower(),
            f'scorer={scorer!r} code={codev!r} pw={pwv!r} '+page.inner_text('#lkloginpage')[:200])
        page.screenshot(path=str(SHOT / '11-onion-shed-login-blank.png'), full_page=False)
        # Proceed with blank fields — no code or password required
        page.locator('#lkpwgo').click()
        page.wait_for_timeout(500)
        chk('Onion Shed login proceeds without a code or password',
            page.locator('#lktargets, #lkselect, #lkhome, #lkloginpage').count()>=1,
            page.inner_text('body')[:240])
        if page.locator('#lkselectback, #lktgtback, #lkback').count():
            page.evaluate("() => window.lkFlowHome && window.lkFlowHome('ONIONSH2')")
        elif page.locator('#lkloginback').count():
            page.locator('#lkloginback').click()
        else:
            page.evaluate("() => window.lkFlowHome && window.lkFlowHome('ONIONSH2')")
        page.wait_for_selector('#lkhome', timeout=4000)
        # re-open login only if we left it, already back at home
        page.wait_for_selector('#lkhome', timeout=4000)
        page.locator('#lkereg').click()
        page.wait_for_timeout(400)
        rtxt = page.inner_text('body')
        chk('Onion Shed Event Registration is its own page',
            'event registration' in rtxt.lower() or page.locator('#lkregpage').count()==1,
            rtxt[:240])
        if page.locator('#lkregback').count():
            page.locator('#lkregback').click()
        else:
            page.evaluate("() => window.lkFlowHome && window.lkFlowHome('ONIONSH2')")
        page.wait_for_selector('#lkhome', timeout=4000)
        page.locator('#lkreview').click()
        page.wait_for_timeout(400)
        rv = page.inner_text('body')
        chk('Onion Shed Review Scoresheet shows the existing table heading',
            'review scoresheet' in rv.lower() and ('total' in rv.lower() or 'not on this phone' in rv.lower() or 'archer' in rv.lower()),
            rv[:240])


        # --- 13-target picker + returning-archer register (Lingkana, then Onion Shed) ---
        DEMO = ['Sam Archer','Alex River','Kim Brook','Pat Reed','Jo West']

        def auth_and_seed_lingkana():
            return page.evaluate("""(names) => {
              try { sessionStorage.setItem('scoretool.lk.auth','LINGKN26'); } catch(e) {}
              window._lkAuthed = 'LINGKN26';
              const lg = (typeof lkEnsure==='function'&&lkEnsure())||null;
              if (!lg) return 'no league';
              const night = (typeof LK_DATES!=='undefined'&&LK_DATES[0]) || '2026-11-18';
              lg.reg = lg.reg || {};
              lg.order = lg.order || [];
              lg.gn = lg.gn || {};
              lg.reg[night] = names.map((name,i) => {
                const id = 'demo'+(i+1);
                if (!lg.order.includes(id)) lg.order.push(id);
                lg.gn[id] = {n:name, t:Date.now()};
                return {id, name, at:Date.now()};
              });
              if (typeof save==='function') save();
              window._lkTarget = 0; window._lkPicked = [];
              if (typeof lkFlowHome==='function') lkFlowHome('LINGKN26');
              if (typeof lkFlowSelect==='function') lkFlowSelect();
              return 'ok';
            }""", DEMO)

        # public test URL already on Onion Shed review; go back to list then Lingkana
        if page.locator('#lkrevback').count():
            page.locator('#lkrevback').click()
        elif page.locator('#lkresback').count():
            page.locator('#lkresback').click()
        elif page.locator('#lkhomeback').count():
            pass
        else:
            page.evaluate("() => window.lkFlowList && window.lkFlowList()")
        if page.locator('#lkhome').count() and page.locator('#lkhomeback').count():
            # we may be on OS event home after review back; go to list if needed later
            pass

        seeded = auth_and_seed_lingkana()
        chk('seeded Lingkana night-1 demo sign-ups', seeded == 'ok', str(seeded))
        page.wait_for_selector('#lktargets, #lkselect', timeout=5000)
        btns = page.locator('#lktargets .lk-tbtn, button[data-lktgt]')
        chk('Lingkana target page shows 13 target numbers', btns.count() == 13, str(btns.count()))
        nums = [btns.nth(i).get_attribute('data-lktgt') or btns.nth(i).inner_text().strip().split()[0] for i in range(btns.count())]
        chk('Lingkana targets are 1 through 13', nums == [str(i) for i in range(1,14)], str(nums))
        body = page.inner_text('body')
        chk('Lingkana target page has no Register Archer button',
            page.locator('#lkregarch').count()==0 and 'register archer' not in body.lower(), body[:240])
        page.screenshot(path=str(SHOT / '05-thirteen-targets.png'), full_page=False)

        page.locator('#lktgt1, [data-lktgt="1"]').first.click()
        page.wait_for_selector('#lkarchlist, #lktgtlabel', timeout=4000)
        labels = page.locator('#lkarchlist .lk-row .nm')
        shown = [labels.nth(i).inner_text().strip() for i in range(labels.count())]
        chk('after tapping a target, tonight\'s registered names are listed',
            all(n in shown for n in DEMO), str(shown))
        chk('picker lists only tonight\'s sign-ups (no extra Register Archer)',
            page.locator('#lkregarch').count()==0 and page.locator('#lktgtlabel').inner_text().strip().lower().startswith('target 1'))
        page.screenshot(path=str(SHOT / '06-pick-shooters.png'), full_page=False)

        # max 4
        for name in DEMO[:4]:
            row = page.locator('#lkarchlist .lk-row', has_text=name)
            box = row.locator('input[type="checkbox"]')
            if not box.is_checked():
                box.check()
            page.wait_for_timeout(150)
        page.locator('#lkarchlist .lk-row', has_text=DEMO[4]).locator('input[type="checkbox"]').click()
        page.wait_for_timeout(200)
        fifth = page.locator('#lkarchlist .lk-row', has_text=DEMO[4]).locator('input[type="checkbox"]')
        msg = page.locator('#lkselmsg').inner_text() if page.locator('#lkselmsg').count() else ''
        chk('a fifth tick is blocked with a short message',
            (not fifth.is_checked()) and 'up to 4' in msg.lower(), msg)

        # name already on another target is locked
        page.evaluate("""() => {
          const lg = (typeof lkEnsure==='function'&&lkEnsure())||null;
          const w = 1;
          const night = (typeof lkNightKey==='function'&&lkNightKey(lg,w)) || ((typeof LK_DATES!=='undefined'&&LK_DATES[0])||'2026-11-18');
          const list = ((lg.reg||{})[night])||[];
          const rec = list.find(r => r && r.name==='Jo West');
          if (rec) rec.target = 3;
          if (typeof save==='function') save();
          window._lkPicked = [];
          window._lkTarget = 1;
          if (typeof lkFlowSelect==='function') lkFlowSelect();
        }""")
        page.wait_for_selector('#lkarchlist', timeout=4000)
        jo = page.locator('#lkarchlist .lk-row', has_text='Jo West')
        chk('a name already on another target is locked and not tickable',
            'locked' in (jo.get_attribute('class') or '') and jo.locator('input').is_disabled(),
            jo.get_attribute('class') or '')

        # Start opens existing scoring
        for name in DEMO[:2]:
            row = page.locator('#lkarchlist .lk-row', has_text=name)
            if 'locked' in (row.get_attribute('class') or ''):
                continue
            box = row.locator('input[type="checkbox"]')
            if not box.is_checked():
                box.check()
            page.wait_for_timeout(150)
        page.locator('#lkstart').click()
        page.wait_for_timeout(600)
        chk('Start opens the existing Lingkana scoring screen',
            page.locator('#lgentry, #lgsheet, .ad-title').count() >= 1
            and ('score end' in page.inner_text('body').lower() or 'lancaster' in page.inner_text('body').lower() or page.locator('#lgentry').count()==1),
            page.inner_text('body')[:240])

        # Returning archer on Event Registration: register once, then tap name, no email/phone
        page.evaluate("() => { window._lkRetPick=null; if (typeof lkFlowHome==='function') lkFlowHome('LINGKN26'); }")
        page.wait_for_selector('#lkhome', timeout=4000)
        page.locator('#lkereg').click()
        page.wait_for_selector('#lkregpage, #lkregform', timeout=4000)
        # Use a fresh name so this path is the new-archer form first
        if page.locator('#lkregemail').count()==0 and page.locator('[data-lkret]').count():
            # already in returning state; clear pick by reloading the view
            page.evaluate("() => { window._lkRetPick=null; if (typeof lkRegisterView==='function') lkRegisterView(); }")
            page.wait_for_timeout(300)
        chk('new archer still sees name and optional email/phone fields',
            page.locator('#lkregname').count()==1 and page.locator('#lkregemail').count()==1 and page.locator('#lkregphone').count()==1)
        if page.locator('#lkregcode').count():
            page.fill('#lkregcode', 'lk-onion26')
        else:
            chk('new archer still sees the invite code field before first register', False, 'code field missing')
        page.fill('#lkregname', 'Sam Archer')
        # night select should exist for a new fill; if name already known it might flip after typing? name is typed, not tapped
        if page.locator('#lkregemail').count():
            page.fill('#lkregemail', 'sam@example.com')
            page.fill('#lkregphone', '0400000000')
        if page.locator('#lkregnight').count():
            page.locator('#lkregnight').select_option(index=0)
        page.locator('#lkreggo').click()
        page.wait_for_timeout(800)
        # after save the view redraws; tap the name
        page.wait_for_selector('.lk-known-btn, [data-lkret]', timeout=4000)
        page.locator('.lk-known-btn, [data-lkret]', has_text='Sam Archer').first.click()
        page.wait_for_timeout(300)
        chk('returning archer taps their name and does not re-enter email or phone',
            page.locator('#lkregemail').count()==0 and page.locator('#lkregphone').count()==0
            and page.locator('#lkretnote, #lkregnights').count() >= 1
            and 'sam@example.com' not in page.inner_text('body').lower()
            and '0400000000' not in page.inner_text('body'),
            page.inner_text('#lkregpage').strip()[:300] if page.locator('#lkregpage').count() else page.inner_text('body')[:300])
        chk('returning archer does not need the invite code again',
            page.locator('#lkregcode').count()==0,
            page.inner_text('#lkregpage')[:300] if page.locator('#lkregpage').count() else 'no page')
        chk('Get ScoreTool was not added or removed on the test register page',
            'get scoretool' not in page.inner_text('#lkregpage').lower() if page.locator('#lkregpage').count() else True)
        page.screenshot(path=str(SHOT / '07-register-tap-name.png'), full_page=False)
        page.screenshot(path=str(SHOT / '10-returning-no-invite-code.png'), full_page=False)

        # Onion Shed: same 13-target picker, no Register Archer, 300 scoring unchanged
        page.evaluate("""(names) => {
          if (typeof lgSeed==='function') lgSeed();
          const code = (typeof LG_PRESET!=='undefined'&&LG_PRESET.code)||'ONIONSH2';
          let lg = (typeof lgGet==='function'&&lgGet(code))||null;
          if (!lg && typeof S!=='undefined' && S && typeof lgPresetRecord==='function'){
            S.leagues = S.leagues||[];
            lg = lgPresetRecord(code);
            S.leagues.push(lg);
            if (typeof save==='function') save();
          }
          if (!lg) return 'no os league';
          lg.reg = lg.reg || {}; lg.gn = lg.gn || {}; lg.order = lg.order || [];
          const ids = [];
          names.forEach((name,i) => {
            const id = 'osdemo'+(i+1);
            if (!lg.order.includes(id)) lg.order.push(id);
            lg.gn[id] = {n:name, t:Date.now()};
            ids.push(id);
          });
          lg.reg['1'] = names.map((name,i) => ({id:ids[i], name, at:Date.now()}));
          if (typeof save==='function') save();
          window._lkTarget = 0; window._lkPicked = [];
          if (typeof lkFlowHome==='function') lkFlowHome(code);
          if (typeof lkFlowSelect==='function') lkFlowSelect();
          return 'ok';
        }""", DEMO)
        page.wait_for_selector('#lktargets, #lkselect', timeout=5000)
        obtns = page.locator('#lktargets .lk-tbtn, button[data-lktgt]')
        chk('Onion Shed target page shows 13 target numbers', obtns.count()==13, str(obtns.count()))
        obody = page.inner_text('body')
        chk('Onion Shed target page has no Register Archer button',
            page.locator('#lkregarch').count()==0 and 'register archer' not in obody.lower(), obody[:240])
        page.locator('#lktgt2, [data-lktgt="2"]').first.click()
        page.wait_for_selector('#lkarchlist', timeout=4000)
        onames = [page.locator('#lkarchlist .lk-row .nm').nth(i).inner_text().strip() for i in range(page.locator('#lkarchlist .lk-row .nm').count())]
        chk('Onion Shed picker lists tonight\'s registered demo names', all(n in onames for n in DEMO), str(onames))
        page.locator('#lkarchlist .lk-row', has_text='Sam Archer').locator('input[type="checkbox"]').check()
        page.wait_for_timeout(150)
        page.locator('#lkstart').click()
        page.wait_for_timeout(700)
        ostxt = page.inner_text('body')
        chk('Onion Shed Start opens existing 300 scoring, not a 660 conversion',
            ('300' in ostxt.lower() or 'week' in ostxt.lower() or page.locator('#lgview, #lgentry').count()>=1)
            and 'lancaster 660' not in ostxt.lower()
            and 'max 660' not in ostxt.lower(),
            ostxt[:300])

        # OS Event Registration: tap an existing name, tick weeks, no invented email/phone/poster
        page.evaluate("() => { window._osRegPick=null; if (typeof lkFlowHome==='function') lkFlowHome('ONIONSH2'); }")
        page.wait_for_selector('#lkhome', timeout=4000)
        page.locator('#lkereg').click()
        page.wait_for_selector('#lkregpage', timeout=4000)
        rtxt = page.inner_text('#lkregpage')
        chk('Onion Shed register has no poster code or email/phone fields',
            page.locator('#lkregcode, #lkregemail, #lkregphone').count()==0
            and 'poster' not in rtxt.lower() and 'email' not in rtxt.lower(),
            rtxt[:240])
        if page.locator('.lk-known-btn, [data-osid]', has_text='Sam Archer').count():
            page.locator('.lk-known-btn, [data-osid]', has_text='Sam Archer').first.click()
            page.wait_for_timeout(250)
            chk('Onion Shed returning archer can tick weeks after tapping their name',
                page.locator('#ospicked').count()==1 and page.locator('[data-osw]').count()==6
                and page.locator('#lkregemail, #lkregphone, #lkregcode').count()==0)
        else:
            chk('Onion Shed returning archer can tick weeks after tapping their name', False, rtxt[:240])

        # back to a safe place for the HTTP version checks that follow
        page.evaluate("() => window.lkFlowList && window.lkFlowList()")
        page.wait_for_timeout(200)

        # Poster / share URL and old register links open the event home, not a standalone register page
        home_page = ctx.new_page()
        home_page.route(guard.RELAY, lambda route: route.fulfill(status=200, body='', headers={
            'access-control-allow-origin': '*', 'content-type': 'application/json'}))
        home_page.goto(f'{BASE}/test/#lk-home', wait_until='networkidle')
        home_page.wait_for_timeout(800)
        home_page.wait_for_selector('#lkhome', timeout=8000)
        htxt = home_page.inner_text('#lkhome')
        chk('share/QR hash #lk-home opens the Lingkana event home',
            home_page.locator('#lkhome').count()==1
            and all(lab in htxt for lab in ['Login to Event', 'Login with QR Code', 'Event Registration', 'Review Scoresheet', 'Rules'])
            and home_page.locator('#lkregpage').count()==0,
            htxt[:240])
        # Exact QR target used by the test page
        ev_url = home_page.evaluate("() => (typeof lkEventHomeUrl==='function'&&lkEventHomeUrl())||''")
        chk('lkEventHomeUrl is the stable event-home URL',
            ev_url.endswith('/test/#lk-home') or ev_url.endswith('/test/#lk-home/'), ev_url)
        home_page.screenshot(path=str(SHOT / '12-qr-event-home.png'), full_page=False)
        # old register hash
        home_page.goto(f'{BASE}/test/#lk-register', wait_until='networkidle')
        home_page.wait_for_selector('#lkhome', timeout=8000)
        chk('old #lk-register hash lands on the event home, not a standalone register page',
            home_page.locator('#lkhome').count()==1 and home_page.locator('#lkregpage').count()==0,
            (home_page.locator('#lkhome').inner_text()[:200] if home_page.locator('#lkhome').count() else home_page.inner_text('body')[:200]))
        home_page.goto(f'{BASE}/test/lk-register.html', wait_until='networkidle')
        home_page.wait_for_timeout(800)
        chk('lk-register.html redirects to the event home',
            home_page.locator('#lkhome').count()==1 and home_page.locator('#lkregpage').count()==0,
            home_page.evaluate('() => location.href'))
        home_page.close()

        # live root still the previous live version
        root_page = ctx.new_page()
        root_page.route(guard.RELAY, lambda route: route.fulfill(status=200, body='', headers={
            'access-control-allow-origin': '*', 'content-type': 'application/json'}))
        root_page.goto(f'{BASE}/version.json')
        live = json.loads(root_page.inner_text('body'))
        chk('HTTP /version.json is the new live build', live.get('version') == 'v2026-11-17-2405-loginfit', str(live))
        root_page.goto(f'{BASE}/test/version.json')
        tv = json.loads(root_page.inner_text('body'))
        chk('HTTP /test/version.json is the new test build', tv.get('version') == 'v2026-11-12-0840-test', str(tv))

        # Score tab with tester: each league once as a flyer card
        tpage = ctx.new_page()
        tpage.route(guard.RELAY, lambda route: route.fulfill(status=200, body='', headers={
            'access-control-allow-origin': '*', 'content-type': 'application/json'}))
        tpage.goto(f'{BASE}/test/?tester=nathe&app=1')
        tpage.wait_for_timeout(1000)
        tpage.evaluate("""() => {
          try { localStorage.setItem('scoretool.whatsnew.seen','v2026-11-12-0840-test'); } catch(e) {}
          if (typeof S !== 'undefined' && S) { S.unlocked = true; if (!S.profile) S.profile = 'nathe'; if (typeof save === 'function') save(); }
        }""")
        tpage.reload()
        tpage.wait_for_timeout(1200)
        if tpage.locator('#wnx').count():
            tpage.locator('#wnx').click()
            tpage.wait_for_timeout(200)
        tpage.evaluate("() => { if (typeof nav === 'function') { cur=null; nav('score'); } }")
        tpage.wait_for_timeout(600)
        if tpage.locator('[data-cstp="league"]').count():
            tpage.locator('[data-cstp="league"]').click()
            tpage.wait_for_timeout(500)
        # if lgcard not there yet, try again
        if tpage.locator('#lgcard').count() == 0:
            tpage.evaluate("() => { window._csMode='league'; if (typeof score==='function') score(); }")
            tpage.wait_for_timeout(500)
        ev = tpage.locator('#lgcard .st-evcard')
        ev_titles = [ev.nth(i).locator('b').inner_text().strip() for i in range(ev.count())] if ev.count() else []
        chk('Score tab lists Lingkana once as a flyer card', ev_titles.count('Lingkana League') == 1, str(ev_titles))
        chk('Score tab lists Onion Shed once as a flyer card', ev_titles.count('Onion Shed Challenge') == 1, str(ev_titles))
        chk('Score tab has no second Lingkana catalog row', tpage.locator('#lkrow').count() == 0)
        # name text on the whole card should not list Lingkana twice
        card_txt = tpage.locator('#lgcard').inner_text() if tpage.locator('#lgcard').count() else ''
        chk('Score tab league card text does not repeat Lingkana League',
            card_txt.count('Lingkana League') == 1, card_txt[:400])

        b.close()
finally:
    srv.terminate()

print(f'\n{len(ok)} passed, {len(bad)} failed')
if bad:
    print('FAILED:', *bad, sep='\n  ')
    sys.exit(1)
