#!/usr/bin/env python3
"""Coaching (rework, 26 Nov 2026). Phone size 390x844. No live Supabase/Stripe/ntfy writes.
Archer: My archery › Coach has one button, "Share my data with coach" (native share, copy fallback). Plus/Pro only. Stop sharing is a small option.
Coach: opening the link, first time is ScoreTool + Archery Calendar sign-up then add-to-home-screen; later links go straight in. The archer's name is under Tools › Coaching, with analysis, saved layout, custom charts, compare and notes.
No preview-as toggles, no separate Add-my-coach / share-a-round screens, no refund/Stripe/Lingkana wording, no purple.
Screenshots go to $SHOTS (default /workspace/st-coach/v2)."""
import json, os, re, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import guard  # noqa: F401
import freeport
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.environ.get('SHOTS', '/workspace/st-coach/v2')
os.makedirs(SHOTS, exist_ok=True)
ok, bad = [], []
def chk(n, c, extra=''):
    (ok if c else bad).append(n)
    print(('PASS ' if c else 'FAIL ') + n + ('' if c else '  ' + str(extra)[:240]), flush=True)

PORT = freeport.get()
srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.4)
BASE = f'http://127.0.0.1:{PORT}/'
SBU = 'https://sllsqpfqwckwtljzjxli.supabase.co'
PURPLE = re.compile(r'#(?:7c3aed|a855f7|8b5cf6|6d28d9|9333ea|c026d3|d946ef|a21caf|7e22ce)', re.I)
ENT_BODY = '{"valid":true,"server":true,"tier":"plus","status":"active","current_period_end":"2099-01-01T00:00:00Z","customer_id":"cus_x"}'

def exe():
    for c in ('/usr/bin/google-chrome', '/usr/bin/chromium'):
        if os.path.isfile(c):
            return c

PRACTICE = {
    'id': 's_prac1',
    'date': '2026-11-24',
    'round': 'WA 50/720',
    'finished': True,
    'ends': [['9', '8', '8', '7', '9', '8'], ['8', '9', '8', '8', '7', '9']],
    'pos': [
        [{'x': 0.1, 'y': 0.05}, {'x': -0.08, 'y': 0.07}, {'x': 0.03, 'y': -0.1},
         {'x': 0.16, 'y': 0.08}, {'x': -0.04, 'y': -0.03}, {'x': 0.11, 'y': -0.06}],
        [{'x': 0.06, 'y': 0.08}, {'x': -0.06, 'y': 0.02}, {'x': 0.13, 'y': -0.09},
         {'x': -0.1, 'y': 0.12}, {'x': 0.02, 'y': 0.03}, {'x': 0.08, 'y': -0.04}],
    ],
}
TUNE = {
    'id': 't_test1', 'date': '2026-11-25', 'name': 'Paper tune after new rest',
    'change': 'Paper tune', 'dist': '18m', 'face': '40cm', 'note': 'Rest moved in a little.',
    'before': [[0.08, 0.04], [0.10, 0.06], [-0.05, 0.02]],
    'after': [[0.02, 0.01], [0.03, -0.02], [-0.01, 0.02]],
}
SESSION = {
    'id': 's_test1',
    'date': '2026-11-25',
    'round': 'WA 50/720',
    'src': 'paper',
    'finished': True,
    'ends': [['10', '9', '9', '8', '10', '9'], ['9', '9', '8', '10', '10', '8']],
    'pos': [
        [{'x': 0.08, 'y': 0.04}, {'x': -0.1, 'y': 0.06}, {'x': 0.02, 'y': -0.12},
         {'x': 0.2, 'y': 0.1}, {'x': -0.05, 'y': -0.02}, {'x': 0.12, 'y': -0.08}],
        [{'x': 0.05, 'y': 0.09}, {'x': -0.07, 'y': 0.01}, {'x': 0.15, 'y': -0.1},
         {'x': -0.12, 'y': 0.14}, {'x': 0.01, 'y': 0.02}, {'x': 0.09, 'y': -0.05}],
    ],
}
STATE = {
    'profile': 'Preview Archer',
    'unlocked': True,
    'sessions': [SESSION, PRACTICE], 'tune': [TUNE],
    'best': [],
    'plots': [],
    'diary': [{'id': 'd_test1', 'archer': 'Preview Archer', 'date': '2026-11-25', 'text': 'Felt steady. Sight mark at 50 m felt a touch high.'}],
    'setup': [],
    'notes': {},
}

AUTH = "localStorage.setItem('scoretool.stripe.auth',JSON.stringify({access_token:'" + 'a' * 40 + "',refresh_token:'r1',email:'buyer@example.com'}));"
ENT = "localStorage.setItem('scoretool.stripe.entitlement'," + json.dumps(ENT_BODY) + ");localStorage.setItem('scoretool.stripe.checked',String(Date.now()));"
EARLY = "localStorage.setItem('scoretool.paid.early',JSON.stringify({ids:['u_coach']}));"
FREE_EARLY = "localStorage.setItem('scoretool.paid.early',JSON.stringify({ids:[]}));"
COMMON = "localStorage.setItem('scoretool.whatsnew.seen','x');localStorage.setItem('scoretool.names.asked','1');localStorage.setItem('scoretool.dname.asked.u_coach',String(Date.now()));localStorage.setItem('scoretool.archers',JSON.stringify([{id:'u_coach',name:'Preview Archer',short:'Preview',bow:'Recurve'}]));localStorage.setItem('scoretool.tester','u_coach');"

def plus_seed(state=None):
    st = json.dumps(state or STATE)
    return EARLY + AUTH + ENT + COMMON + "localStorage.setItem('scoretool.v1.u_coach'," + json.dumps(st) + ");"

def free_seed():
    st = json.dumps(STATE)
    return FREE_EARLY + COMMON + "localStorage.setItem('scoretool.v1.u_coach'," + json.dumps(st) + ");"

def welcome(pg):
    end = time.time() + 8
    while time.time() < end:
        if pg.locator('#wnx').count():
            pg.locator('#wnx').click()
        if pg.locator('#nmlater').count():
            pg.click('#nmlater'); pg.wait_for_timeout(200); continue
        if pg.locator('#nmin').count():
            pg.fill('#nmin', 'Tester'); pg.click('#nmingo'); pg.wait_for_timeout(200); continue
        try:
            if pg.evaluate("()=>{const t=document.querySelector('#tabs');return !!t&&!t.hidden}"):
                return True
        except Exception:
            pass
        pg.wait_for_timeout(200)
    return False

def no_purple(pg):
    return not PURPLE.search(pg.inner_html('#app'))

def no_banned(txt):
    t = (txt or '').lower()
    return 'refund' not in t and 'stripe' not in t and 'lingkana' not in t and 'squad' not in t

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe(), args=['--no-sandbox'])

        def ctx(seed, share=False):
            c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
            # Native share is missing in this test browser, so the copy-link fallback is used — unless share=True stubs it.
            if share:
                c.add_init_script("window.__shared=[];navigator.share=u=>{window.__shared.push(u);return Promise.resolve();}")
            c.add_init_script("if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');" + seed + "}")
            pg = c.new_page(); pg.set_default_timeout(15000); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.route(SBU + '/auth/v1/settings', lambda r: r.fulfill(status=200, content_type='application/json', body='{"external":{"google":true,"apple":false}}'))
            pg.route(SBU + '/functions/v1/stripe-entitlement/entitlement', lambda r: r.fulfill(status=200, content_type='application/json', body=ENT_BODY))
            pg.route(re.compile(r'https://sllsqpfqwckwtljzjxli\.supabase\.co/rest/v1/.*'), lambda r: r.fulfill(status=404, body='[]'))
            return c, pg, errs

        # 1. Free: Coach is locked
        c, pg, errs = ctx(free_seed())
        pg.goto(BASE)
        chk('free: app opened', welcome(pg))
        pg.evaluate("nav('lab_coach')"); pg.wait_for_timeout(500)
        txt = pg.inner_text('#app')
        chk('free: Coach says Available on Plus', 'available on plus' in txt.lower() or pg.locator('#coachlock,#gate').count() >= 1, txt[:200])
        chk('free: no Share my data with coach button', pg.locator('#chshare').count() == 0, txt[:200])
        chk('free: no preview-as toggles', pg.locator('#chdemobar,#chrolea,#chrolec').count() == 0)
        chk('free: no refund/Stripe/Lingkana wording', no_banned(txt), txt[:200])
        pg.screenshot(path=os.path.join(SHOTS, '01-free-coach-locked.png'))
        chk('free: no JS errors', not errs, errs[:2]); c.close()

        # 2. Plus: one button, copy fallback
        c, pg, errs = ctx(plus_seed())
        pg.goto(BASE)
        chk('plus: app opened', welcome(pg))
        pg.evaluate("nav('myarch')"); pg.wait_for_timeout(400)
        my = pg.inner_text('#app')
        chk('plus: My archery lists Coach', 'coach' in my.lower(), my[:200])
        pg.screenshot(path=os.path.join(SHOTS, '02-my-archery-coach.png'))
        pg.evaluate("nav('lab_coach')"); pg.wait_for_timeout(500)
        txt = pg.inner_text('#app')
        chk('plus: one Share my data with coach button', pg.locator('#chshare').count() == 1 and pg.locator('#chshare').inner_text().strip() == 'Share my data with coach', txt[:200])
        chk('plus: no Add my coach / share-a-round / preview toggles',
            pg.locator('#chadd,[data-chsh],#chdemobar,#chrolea,#chrolec,#chsharesheet').count() == 0, txt[:200])
        pg.screenshot(path=os.path.join(SHOTS, '03-share-my-data-button.png'))
        if pg.locator('#chshare').count():
            pg.click('#chshare'); pg.wait_for_timeout(500)
        chk('plus: copy-link fallback when the share sheet is not available', pg.locator('#chlink').count() == 1)
        link = pg.locator('#chlink').input_value() if pg.locator('#chlink').count() else ''
        chk('plus: link uses #coachcode=', '#coachcode=' in link, link)
        chk('plus: Stop sharing is available', pg.locator('[data-chrm]').count() >= 1)
        pg.screenshot(path=os.path.join(SHOTS, '04-share-link-fallback.png'))
        chk('plus: no JS errors (share)', not errs, errs[:2])

        # native share path
        c.close()
        c, pg, errs = ctx(plus_seed(), share=True)
        pg.goto(BASE); welcome(pg)
        pg.evaluate("nav('lab_coach')"); pg.wait_for_timeout(400)
        pg.click('#chshare'); pg.wait_for_timeout(400)
        shared = pg.evaluate("()=>window.__shared||[]")
        chk('plus: native share sheet is used when available',
            isinstance(shared, list) and shared and '#coachcode=' in str(shared[0].get('url') if isinstance(shared[0], dict) else shared), shared)
        c.close()

        # 3. First coach open of the link
        pending = {
            'code': 'STTESTA', 'archerId': 'u_coach', 'archerName': 'Preview Archer',
            'coachId': None, 'coachName': '', 'coachEmail': '', 'status': 'pending',
            'created': '2026-11-26', 'claimedAt': '',
        }
        feed = {
            'name': 'Preview Archer', 'id': 'u_coach',
            'rounds': [
                {'id': 's_test1', 'date': '2026-11-25', 'round': 'WA 50/720', 'score': 110,
                 'ends': SESSION['ends'], 'pos': SESSION['pos'], 'dist': '50m', 'kind': 'competition'},
                {'id': 's_prac1', 'date': '2026-11-24', 'round': 'WA 50/720', 'score': 98,
                 'ends': PRACTICE['ends'], 'pos': PRACTICE['pos'], 'dist': '50m', 'kind': 'practice'},
            ],
            'tunes': [TUNE],
            'diary': [{'id': 'd_test1', 'date': '2026-11-25', 'text': 'Felt steady. Sight mark at 50 m felt a touch high.'}],
            'updated': 1,
        }
        first_seed = (
            "localStorage.setItem('scoretool.whatsnew.seen','x');"
            "localStorage.setItem('scoretool.names.asked','1');"
            "localStorage.setItem('scoretool.dname.asked.u_view',String(Date.now()));"
            "localStorage.setItem('scoretool.paid.early',JSON.stringify({ids:[]}));"
            "localStorage.setItem('scoretool.archers',JSON.stringify([{id:'u_view',name:'Coach View',short:'Coach',bow:'Recurve'}]));"
            "localStorage.setItem('scoretool.tester','u_view');"
            "localStorage.setItem('scoretool.v1.u_view',JSON.stringify({profile:'Coach View',unlocked:true,sessions:[],best:[],plots:[]}));"
            "localStorage.setItem('scoretool.coach.demo','1');"
            "localStorage.setItem('scoretool.coach.links'," + json.dumps(json.dumps([pending])) + ");"
            "localStorage.setItem('scoretool.coach.feed.u_coach'," + json.dumps(json.dumps(feed)) + ");"
        )
        c, pg, errs = ctx(first_seed)
        pg.goto(BASE + '#coachcode=STTESTA')
        pg.wait_for_timeout(900)
        txt = pg.inner_text('#app')
        chk('first link: combined ScoreTool + Archery Calendar sign-up',
            pg.locator('#chjoin').count() == 1 and 'archery calendar' in txt.lower() and 'scoretool' in txt.lower(), txt[:240])
        chk('first link: no preview-as toggles', pg.locator('#chdemobar,#chrolea,#chrolec').count() == 0)
        pg.screenshot(path=os.path.join(SHOTS, '05-first-link-signup.png'))
        pg.click('#chdemoin'); pg.wait_for_timeout(500)
        txt = pg.inner_text('#app')
        chk('first link: add-to-home-screen how-to',
            pg.locator('#chhomehow').count() == 1 and 'add to home screen' in txt.lower(), txt[:240])
        pg.screenshot(path=os.path.join(SHOTS, '06-add-to-home-screen.png'))
        pg.click('#chhomedone'); pg.wait_for_timeout(700)
        txt = pg.inner_text('#app')
        chk('first link: opens Tools › Coaching with Preview Archer',
            pg.locator('#chdesk').count() == 1 and 'preview archer' in txt.lower() and 'coaching' in txt.lower(), txt[:240])
        pg.screenshot(path=os.path.join(SHOTS, '07-tools-coaching-list.png'))

        # Tools menu has Coaching
        pg.evaluate("nav('tools')"); pg.wait_for_timeout(400)
        tools = pg.inner_text('#app')
        chk('Tools menu lists Coaching', 'coaching' in tools.lower(), tools[:200])
        pg.screenshot(path=os.path.join(SHOTS, '08-tools-menu-coaching.png'))
        pg.evaluate("nav('lab_coaching')"); pg.wait_for_timeout(400)

        # later code goes straight in
        pending2 = dict(pending, code='STTESTB', archerId='u_second', archerName='Sam Junior')
        pg.evaluate("(row)=>{const L=JSON.parse(localStorage.getItem('scoretool.coach.links')||'[]');L.push(row);localStorage.setItem('scoretool.coach.links',JSON.stringify(L));localStorage.setItem('scoretool.coach.feed.u_second',JSON.stringify({name:'Sam Junior',id:'u_second',rounds:[],diary:[],updated:Date.now()}));}", pending2)
        pg.evaluate("location.hash='#coachcode=STTESTB'")
        pg.wait_for_timeout(700)
        txt = pg.inner_text('#app')
        chk('later link: skips sign-up and goes to Tools › Coaching',
            pg.locator('#chjoin,#chhomehow').count() == 0 and pg.locator('#chdesk').count() == 1 and 'sam junior' in txt.lower(), txt[:240])
        chk('under-16: name Sam Junior is shown, not hidden', 'sam junior' in txt.lower() and 'nickname' not in txt.lower(), txt[:200])
        pg.screenshot(path=os.path.join(SHOTS, '09-later-link-coaching.png'))

        # open first archer
        if pg.locator('[data-cha="u_coach"]').count():
            pg.click('[data-cha="u_coach"]')
        else:
            pg.evaluate("location.hash='#coacher=u_coach'")
        pg.wait_for_timeout(700)
        txt = pg.inner_text('#app')
        chk('coach view: plots, ends, heatmap, averages, diary',
            pg.locator('#chc-group, .ch-plot').count() >= 1 and pg.locator('#chc-ends').count() == 1 and pg.locator('#chc-heat').count() == 1 and pg.locator('#chc-avgs').count() == 1 and 'felt steady' in (pg.locator('#chdiary').text_content() or '').lower() and "can't hide" in txt.lower().replace('’', "'"), txt[:300])
        sess = pg.inner_text('#chsessions') if pg.locator('#chsessions').count() else ''
        tun = pg.inner_text('#chtunes') if pg.locator('#chtunes').count() else ''
        chk('coach view: practice and competition sessions are listed',
            pg.locator('#chsessions').count() == 1 and 'practice' in sess.lower() and 'competition' in sess.lower(), sess[:240])
        chk('coach view: tuning sessions are listed',
            pg.locator('#chtunes').count() == 1 and 'paper tune after new rest' in tun.lower(), tun[:240])
        pg.screenshot(path=os.path.join(SHOTS, '10-coach-archer-view.png'))

        if pg.locator('[data-chtog="heat"]').count():
            pg.uncheck('[data-chtog="heat"]'); pg.wait_for_timeout(400)
        chk('layout: heatmap can be turned off', pg.locator('#chc-heat').count() == 0)
        stored = pg.evaluate("()=>coachLayoutOf()")
        chk('layout: saved for the coach (heat off)', stored and stored.get('on', {}).get('heat') is False, stored)
        pg.screenshot(path=os.path.join(SHOTS, '11-coach-layout.png'))

        pg.fill('#chcuname', '50m average')
        pg.select_option('#chcumet', 'score')
        pg.click('#chcuadd'); pg.wait_for_timeout(400)
        chk('custom chart added', '50m average' in pg.inner_text('#chcustom'), pg.inner_text('#chcustom')[:200])
        pg.screenshot(path=os.path.join(SHOTS, '12-custom-chart.png'))

        pg.evaluate("""()=>{
          const f=JSON.parse(localStorage.getItem('scoretool.coach.feed.u_coach'));
          f.rounds.push({id:'s_test2',date:'2026-11-26',round:'WA 50/720',score:120,ends:[[10,10,9,9,10,8],[10,9,9,9,8,10]],pos:f.rounds[0].pos,dist:'50m'});
          localStorage.setItem('scoretool.coach.feed.u_coach',JSON.stringify(f));
        }""")
        pg.evaluate("location.hash='#coach'"); pg.wait_for_timeout(200)
        pg.evaluate("location.hash='#coacher=u_coach'"); pg.wait_for_timeout(700)
        if pg.locator('#chcA').count() and pg.locator('#chcB option').count() >= 2:
            opts = pg.eval_on_selector_all('#chcB option', 'els => els.map(e=>e.value)')
            pg.select_option('#chcA', opts[0])
            pg.select_option('#chcB', opts[1] if len(opts) > 1 else opts[0])
            pg.click('#chcrun'); pg.wait_for_timeout(400)
        chk('compare: side-by-side output', pg.locator('#chcmpout, .ch-cmp').count() >= 1, pg.inner_text('#chcompare')[:200] if pg.locator('#chcompare').count() else 'no compare')
        pg.screenshot(path=os.path.join(SHOTS, '13-compare.png'))

        if pg.locator('#chntype').count():
            pg.select_option('#chntype', 'form')
            pg.fill('#chnbody', 'Keep your bow arm steady.')
            pg.click('#chnsave'); pg.wait_for_timeout(500)
        notes = pg.evaluate("()=>coachNotes()||[]") or []
        chk('note: form/mental saved', any('keep your bow arm' in (n.get('body') or '').lower() and n.get('type')=='form' for n in notes), notes)
        if pg.locator('#chntype').count():
            pg.select_option('#chntype', 'tuning')
            pg.fill('#chnbody', 'Try a slightly stiffer plunger.')
            pg.click('#chnsave'); pg.wait_for_timeout(500)
        chk('note: tuning shows a box for the archer to log the change',
            any('stiffer plunger' in (n.get('body') or '').lower() and n.get('type')=='tuning' for n in (pg.evaluate("()=>coachNotes()||[]") or [])) and pg.locator('[data-chreply]').count() >= 1)
        if pg.locator('#chntype').count():
            pg.select_option('#chntype', 'drill')
            pg.fill('#chnbody', 'Blank bale, 12 ends, close target.')
            pg.click('#chnsave'); pg.wait_for_timeout(500)
        chk('note: drill saved', any('blank bale' in (n.get('body') or '').lower() and n.get('type')=='drill' for n in (pg.evaluate("()=>coachNotes()||[]") or [])))
        chk('notes are collapsible (open and shut)', pg.locator('details.ch-note, details.ch-fold.ch-note').count() >= 1)
        chk('coach view: no purple / banned wording', no_purple(pg) and no_banned(pg.inner_text('#app')))
        pg.screenshot(path=os.path.join(SHOTS, '14-coach-notes.png'))
        note_blob = pg.evaluate("()=>localStorage.getItem('scoretool.coach.notes')")
        chk('coach flow: no JS errors', not errs, errs[:2]); c.close()

        # 4. Archer sees notes, can stop sharing
        archer_seed = plus_seed() + (
            "localStorage.setItem('scoretool.coach.links'," + json.dumps(json.dumps([{
                'code': 'STTESTA', 'archerId': 'u_coach', 'archerName': 'Preview Archer',
                'coachId': 'demo-coach', 'coachName': 'Demo coach', 'status': 'active',
                'created': '2026-11-26', 'claimedAt': '2026-11-26'
            }])) + ");"
            "localStorage.setItem('scoretool.coach.notes'," + json.dumps(note_blob or '[]') + ");"
        )
        c, pg, errs = ctx(archer_seed)
        pg.goto(BASE); welcome(pg)
        pg.evaluate("nav('lab_coach')"); pg.wait_for_timeout(600)
        txt = pg.inner_text('#app')
        chk('archer coach page: notice that the coach left notes',
            pg.locator('#chnalert').count() == 1 and 'left' in (pg.locator('#chnalert').inner_text().lower()), txt[:300])
        chk('archer coach page: dropdown of all notes, dated',
            pg.locator('#challnotes').count() == 1 and '26 nov' in pg.inner_text('#challnotesbox').lower() and 'blank bale' in pg.inner_text('#challnotesbox').lower(), txt[:400])
        pg.screenshot(path=os.path.join(SHOTS, '14b-archer-notes-dropdown.png'))
        pg.evaluate("nav('myarch')"); pg.wait_for_timeout(400)
        chk('My archery Coach row shows a new-notes badge',
            pg.locator('[data-go="lab_coach"] .ch-new').count() >= 1, pg.inner_text('#app')[:240])
        pg.screenshot(path=os.path.join(SHOTS, '14c-coach-badge.png'))
        pg.evaluate("nav('lab_diary')"); pg.wait_for_timeout(700)
        txt = pg.inner_text('#app')
        chk('archer diary: coach drills to tick off', pg.locator('#chdrills').count() == 1 and 'blank bale' in txt.lower(), txt[:300])
        if pg.locator('[data-chdrill]').count():
            pg.check('[data-chdrill]'); pg.wait_for_timeout(200)
        chk('archer: can tick a drill', pg.evaluate("()=> (coachNotes()||[]).some(n=>n.type==='drill'&&n.done)") is True)
        if pg.locator('[data-chreply]').count():
            pg.fill('[data-chreply]', 'Moved the plunger one click stiffer.')
            pg.click('[data-chrsave]'); pg.wait_for_timeout(200)
        chk('archer: can log a tuning change',
            pg.evaluate("()=> (coachNotes()||[]).some(n=>n.type==='tuning' && /plunger/.test(n.reply||''))") is True)
        chk('archer diary: no hide-diary control', 'hide diary' not in txt.lower() and 'hide the diary' not in txt.lower())
        pg.screenshot(path=os.path.join(SHOTS, '15-archer-diary-notes.png'))

        pg.evaluate("nav('lab_coach')"); pg.wait_for_timeout(500)
        chk('archer: Stop sharing is shown', pg.locator('[data-chrm]').count() >= 1 and 'stop sharing' in pg.inner_text('#app').lower())
        pg.once('dialog', lambda d: d.accept())
        pg.click('[data-chrm]'); pg.wait_for_timeout(400)
        chk('archer: sharing stopped, link ends',
            pg.evaluate("()=> (coachLinks()||[]).some(x=>x.code==='STTESTA'&&x.status==='removed')") is True)
        pg.screenshot(path=os.path.join(SHOTS, '16-stop-sharing.png'))
        chk('archer notes flow: no JS errors', not errs, errs[:2]); c.close()

        # 5. Removed link is not active
        c, pg, errs = ctx(
            "localStorage.setItem('scoretool.whatsnew.seen','x');"
            "localStorage.setItem('scoretool.coach.links'," + json.dumps(json.dumps([{**pending, 'status': 'removed'}])) + ");"
        )
        pg.goto(BASE + '#coachcode=STTESTA'); pg.wait_for_timeout(700)
        chk('removed link: not active', 'not active' in pg.inner_text('#app').lower(), pg.inner_text('#app')[:200])
        pg.screenshot(path=os.path.join(SHOTS, '17-removed-link.png'))
        c.close()

        # 6. Plans copy
        c, pg, errs = ctx(plus_seed())
        pg.goto(BASE + '#plans'); pg.wait_for_timeout(800)
        txt = pg.inner_text('#plans') if pg.locator('#plans').count() else pg.inner_text('#app')
        chk('plans: Plus lists Share my data with a coach', 'share my data with a coach' in txt.lower(), txt[:200])
        chk('plans: still no Squads or Lingkana', 'squad' not in txt.lower() and 'lingkana' not in txt.lower(), txt[:200])
        chk('plans: still no refund or Stripe wording', 'refund' not in txt.lower() and 'stripe' not in txt.lower())
        pg.screenshot(path=os.path.join(SHOTS, '18-plans-plus-coach.png'))
        c.close()

        b.close()
finally:
    srv.kill()

print(f'\n{len(ok)} passed, {len(bad)} failed')
if bad:
    print('FAILED:', ', '.join(bad))
    sys.exit(1)
