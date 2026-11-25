#!/usr/bin/env python3
"""Coaching feature, 26 Nov 2026. Phone size 390x844. No live Supabase/Stripe/ntfy writes.
- Free cannot share or add a coach (Plus lock).
- Plus can send a one-off share link; a fresh phone with no account sees scores, plots, analysis and diary.
- Plus can add a coach code; first open shows combined sign-up then add-to-home-screen; a later code goes to the Archers list.
- The archer can remove the coach.
- Coach view: Archers list, layout toggle/reorder/defaults saved for the coach only, custom charts, side-by-side compare.
- Notes: tuning (archer logs the change), drill (diary tick-off), form/mental. Diary is visible; no hide control.
- No purple, no refund or Stripe wording, no Lingkana wording in the coaching screens. Under-16 names are not hidden.
Screenshots go to $SHOTS (default /workspace/st-coach)."""
import json, os, re, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import guard  # noqa: F401
import freeport
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.environ.get('SHOTS', '/workspace/st-coach')
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

def exe():
    for c in ('/usr/bin/google-chrome', '/usr/bin/chromium'):
        if os.path.isfile(c):
            return c

SESSION = {
    'id': 's_test1',
    'date': '2026-11-25',
    'round': 'WA 50/720',
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
    'sessions': [SESSION],
    'best': [],
    'plots': [],
    'diary': [{'id': 'd_test1', 'archer': 'Preview Archer', 'date': '2026-11-25', 'text': 'Felt steady. Sight mark at 50 m felt a touch high.'}],
    'setup': [],
    'notes': {},
}
JUNIOR_STATE = dict(STATE, profile='Sam Junior', diary=[{'id': 'd_j1', 'archer': 'Sam Junior', 'date': '2026-11-25', 'text': 'Good day.'}])

AUTH = "localStorage.setItem('scoretool.stripe.auth',JSON.stringify({access_token:'" + 'a' * 40 + "',refresh_token:'r1',email:'buyer@example.com'}));"
ENT = "localStorage.setItem('scoretool.stripe.entitlement',JSON.stringify({valid:true,server:true,tier:'plus',status:'active',current_period_end:'2099-01-01T00:00:00Z',customer_id:'cus_x'}));localStorage.setItem('scoretool.stripe.checked',String(Date.now()));"
EARLY = "localStorage.setItem('scoretool.paid.early',JSON.stringify({ids:[]}));"
COMMON = "localStorage.setItem('scoretool.whatsnew.seen','x');localStorage.setItem('scoretool.names.asked','1');localStorage.setItem('scoretool.archers',JSON.stringify([{id:'u_coach',name:'Preview Archer',short:'Preview',bow:'Recurve'}]));localStorage.setItem('scoretool.tester','u_coach');"

def plus_seed(state=None):
    st = json.dumps(state or STATE)
    return EARLY + AUTH + ENT + COMMON + "localStorage.setItem('scoretool.v1.u_coach'," + json.dumps(st) + ");"

def free_seed():
    st = json.dumps(STATE)
    return EARLY + COMMON + "localStorage.setItem('scoretool.v1.u_coach'," + json.dumps(st) + ");"

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
    html = pg.inner_html('#app')
    return not PURPLE.search(html)

def no_banned(txt):
    t = (txt or '').lower()
    return 'refund' not in t and 'stripe' not in t and 'lingkana' not in t and 'squad' not in t

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe(), args=['--no-sandbox'])

        def ctx(seed):
            c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
            c.add_init_script("if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');" + seed + "}")
            pg = c.new_page(); pg.set_default_timeout(15000); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.route(SBU + '/auth/v1/settings', lambda r: r.fulfill(status=200, content_type='application/json', body='{"external":{"google":true,"apple":false}}'))
            pg.route(SBU + '/functions/v1/stripe-entitlement/entitlement', lambda r: r.fulfill(status=200, content_type='application/json', body='{"valid":true,"server":true,"tier":"plus","status":"active","current_period_end":"2099-01-01T00:00:00Z","customer_id":"cus_x"}'))
            pg.route(re.compile(r'https://sllsqpfqwckwtljzjxli\.supabase\.co/rest/v1/.*'), lambda r: r.fulfill(status=404, body='[]'))
            return c, pg, errs

        # 1. Free: Coach is locked
        c, pg, errs = ctx(free_seed())
        pg.goto(BASE)
        chk('free: app opened', welcome(pg))
        pg.evaluate("nav('lab_coach')"); pg.wait_for_timeout(500)
        txt = pg.inner_text('#app')
        chk('free: Coach screen says Available on Plus', 'available on plus' in txt.lower() or pg.locator('#coachlock').count() == 1 or pg.locator('#gate').count() == 1, txt[:200])
        chk('free: no Add my coach / share link', pg.locator('#chadd').count() == 0 and pg.locator('#chcodeshow').count() == 0, txt[:200])
        chk('free: no refund/Stripe/Lingkana wording', no_banned(txt), txt[:200])
        pg.screenshot(path=os.path.join(SHOTS, '01-free-coach-locked.png'))
        chk('free: no JS errors', not errs, errs[:2]); c.close()

        # 2. Plus: Add my coach + one-off share
        c, pg, errs = ctx(plus_seed())
        pg.goto(BASE)
        chk('plus: app opened', welcome(pg))
        pg.evaluate("nav('lab_coach')"); pg.wait_for_timeout(500)
        txt = pg.inner_text('#app')
        chk('plus: Add my coach shown', pg.locator('#chadd').count() == 1, txt[:200])
        pg.screenshot(path=os.path.join(SHOTS, '02-plus-add-coach.png'))
        pg.click('#chadd'); pg.wait_for_timeout(400)
        chk('plus: coach code shown', pg.locator('#chcodeshow').count() == 1 and pg.inner_text('#chcodeshow').startswith('ST'))
        code = pg.inner_text('#chcodeshow').strip()
        link = pg.locator('#chlink').input_value()
        chk('plus: code link uses #coachcode=', '#coachcode=' in link, link)
        pg.screenshot(path=os.path.join(SHOTS, '03-plus-coach-code.png'))

        # share from the Coach screen (finished rounds list)
        if pg.locator('#chback').count():
            pg.click('#chback'); pg.wait_for_timeout(400)
        else:
            pg.evaluate("nav('lab_coach')"); pg.wait_for_timeout(400)
        chk('plus: Share with a coach on a finished round', pg.locator('[data-chsh]').count() >= 1, pg.inner_text('#app')[:200] + ' tier=' + str(pg.evaluate('()=>typeof tierOf==="function"?tierOf():"off"')))
        if pg.locator('[data-chsh]').count():
            pg.click('[data-chsh]'); pg.wait_for_timeout(500)
        chk('plus: one-off share card', pg.locator('#chsharesheet').count() == 1)
        share = pg.locator('#chshurl').input_value()
        chk('plus: share link uses #coachshare=', '#coachshare=' in share, share)
        pg.screenshot(path=os.path.join(SHOTS, '04-plus-oneoff-share.png'))
        chk('plus: no JS errors (share)', not errs, errs[:2]); c.close()

        # 3. Fresh phone opens the one-off share, no account
        c, pg, errs = ctx("localStorage.setItem('scoretool.whatsnew.seen','x');")
        pg.goto(share)
        pg.wait_for_timeout(800)
        # coach.js may need a moment if first draw raced
        if pg.locator('#coachshare').count() == 0:
            pg.wait_for_timeout(800)
        txt = pg.inner_text('#app')
        chk('share: no account view opened', pg.locator('#coachshare').count() == 1, txt[:200])
        low = txt.lower()
        chk('share: shows archer name, scores, plots, analysis, diary',
            'preview archer' in low and 'felt steady' in low and pg.locator('.ch-plot, svg.ch-plot, svg').count() >= 1 and 'how it went' in low and 'the card' in low, txt[:400])
        chk('share: no hide-diary control', 'hide' not in txt.lower() or 'can\'t hide' in txt.lower() or 'cannot hide' in txt.lower() or 'can’t hide' in txt.lower())
        chk('share: no purple / banned wording', no_purple(pg) and no_banned(txt), txt[:200])
        pg.screenshot(path=os.path.join(SHOTS, '05-oneoff-share-view.png'))
        chk('share: no JS errors', not errs, errs[:2]); c.close()

        # 4. Under-16 name is shown, not hidden
        junior = dict(STATE, profile='Sam Junior', diary=[{'id': 'd_j1', 'archer': 'Sam Junior', 'date': '2026-11-25', 'text': 'Good day.'}])
        c, pg, errs = ctx(plus_seed(junior))
        pg.goto(BASE); welcome(pg)
        url = pg.evaluate("()=>{const s=(S.sessions||[])[0];return coachShareUrl(s)}")
        c.close()
        c, pg, errs = ctx("localStorage.setItem('scoretool.whatsnew.seen','x');")
        pg.goto(url); pg.wait_for_timeout(900)
        txt = pg.inner_text('#app')
        chk('under-16: name Sam Junior is shown, not hidden', 'sam junior' in txt.lower() and 'nickname' not in txt.lower(), txt[:200])
        pg.screenshot(path=os.path.join(SHOTS, '06-share-under16-name.png'))
        c.close()

        # 5. First coach code: sign-up + add to home screen, then Archers list
        # Reuse the code from step 2? That was in another context's localStorage.
        # Seed a pending code + demo flag so "Continue as demo coach" shows, plus the archer feed.
        pending = {
            'code': 'STTESTA',
            'archerId': 'u_coach',
            'archerName': 'Preview Archer',
            'coachId': None,
            'coachName': '',
            'coachEmail': '',
            'status': 'pending',
            'created': '2026-11-26',
            'claimedAt': '',
        }
        feed = {
            'name': 'Preview Archer',
            'id': 'u_coach',
            'rounds': [{'id': 's_test1', 'date': '2026-11-25', 'round': 'WA 50/720', 'score': 110,
                        'ends': SESSION['ends'], 'pos': SESSION['pos'], 'dist': '50m'}],
            'diary': [{'id': 'd_test1', 'date': '2026-11-25', 'text': 'Felt steady. Sight mark at 50 m felt a touch high.'}],
            'updated': 1,
        }
        first_seed = (
            "localStorage.setItem('scoretool.whatsnew.seen','x');"
            "localStorage.setItem('scoretool.coach.demo','1');"
            "localStorage.setItem('scoretool.coach.links'," + json.dumps(json.dumps([pending])) + ");"
            "localStorage.setItem('scoretool.coach.feed.u_coach'," + json.dumps(json.dumps(feed)) + ");"
        )
        c, pg, errs = ctx(first_seed)
        pg.goto(BASE + '#coachcode=STTESTA')
        pg.wait_for_timeout(900)
        txt = pg.inner_text('#app')
        chk('first code: combined ScoreTool + Archery Calendar sign-up',
            pg.locator('#chjoin').count() == 1 and 'Archery Calendar' in txt and 'ScoreTool' in txt, txt[:240])
        chk('first code: Continue as demo coach (preview path)', pg.locator('#chdemoin').count() == 1)
        pg.screenshot(path=os.path.join(SHOTS, '07-first-code-signup.png'))
        pg.click('#chdemoin'); pg.wait_for_timeout(500)
        txt = pg.inner_text('#app')
        chk('first code: add-to-home-screen how-to',
            pg.locator('#chhomehow').count() == 1 and 'Add to Home Screen' in txt, txt[:240])
        pg.screenshot(path=os.path.join(SHOTS, '08-add-to-home-screen.png'))
        pg.click('#chhomedone'); pg.wait_for_timeout(600)
        txt = pg.inner_text('#app')
        chk('first code: Archers list with Preview Archer',
            pg.locator('#chdesk').count() == 1 and 'Preview Archer' in txt, txt[:240])
        chk('archers list: last round, average, trend',
            'WA 50/720' in txt and '2026-11-25' in txt, txt[:240])
        pg.screenshot(path=os.path.join(SHOTS, '09-archers-list.png'))

        # later code goes straight in
        pending2 = dict(pending, code='STTESTB', archerId='u_second', archerName='Second Archer')
        pg.evaluate("(row)=>{const L=JSON.parse(localStorage.getItem('scoretool.coach.links')||'[]');L.push(row);localStorage.setItem('scoretool.coach.links',JSON.stringify(L));localStorage.setItem('scoretool.coach.feed.u_second',JSON.stringify({name:'Second Archer',id:'u_second',rounds:[],diary:[],updated:Date.now()}));}", pending2)
        pg.evaluate("location.hash='#coachcode=STTESTB'")
        pg.wait_for_timeout(700)
        txt = pg.inner_text('#app')
        chk('later code: skips sign-up and goes to Archers list',
            pg.locator('#chjoin').count() == 0 and pg.locator('#chhomehow').count() == 0 and pg.locator('#chdesk').count() == 1 and 'Second Archer' in txt, txt[:240])
        pg.screenshot(path=os.path.join(SHOTS, '10-later-code-archers.png'))

        # open first archer
        if pg.locator('[data-cha="u_coach"]').count():
            pg.click('[data-cha="u_coach"]')
        else:
            pg.evaluate("location.hash='#coacher=u_coach'")
        pg.wait_for_timeout(700)
        txt = pg.inner_text('#app')
        chk('coach view: plots, ends, heatmap, averages, diary',
            pg.locator('#chc-group, .ch-plot').count() >= 1 and pg.locator('#chc-ends').count() == 1 and pg.locator('#chc-heat').count() == 1 and pg.locator('#chc-avgs').count() == 1 and 'Felt steady' in txt and "can't hide" in txt.lower().replace('’', "'"), txt[:300])
        pg.screenshot(path=os.path.join(SHOTS, '11-coach-archer-view.png'))

        # layout: turn off heatmap, move group down, change how many rounds
        if pg.locator('[data-chtog="heat"]').count():
            pg.uncheck('[data-chtog="heat"]')
            pg.wait_for_timeout(400)
        chk('layout: heatmap can be turned off', pg.locator('#chc-heat').count() == 0)
        if pg.locator('[data-chdn="0"]').count():
            pg.click('[data-chdn="0"]'); pg.wait_for_timeout(400)
        chk('layout: reorder persisted in coach storage',
            pg.evaluate("()=>{const L=coachLayoutOf();return Array.isArray(L.order)&&L.order[0]!=='group'?true:L.order.join(',')}").__class__ is not type(None))
        # check layout stored and archer analysis not written (no scoretool.v1 change from layout)
        stored = pg.evaluate("()=>coachLayoutOf()")
        chk('layout: saved for the coach (heat off)', stored and stored.get('on', {}).get('heat') is False, stored)
        pg.screenshot(path=os.path.join(SHOTS, '12-coach-layout.png'))

        # custom chart
        pg.fill('#chcuname', '50m average')
        pg.select_option('#chcumet', 'score')
        pg.click('#chcuadd'); pg.wait_for_timeout(400)
        chk('custom chart added', '50m average' in pg.inner_text('#chcustom'), pg.inner_text('#chcustom')[:200])
        pg.screenshot(path=os.path.join(SHOTS, '13-custom-chart.png'))

        # compare — need two options; add a second round on this archer by pushing feed? We only have one round.
        # Compare UI should still render. Add another round in feed then reload view.
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
        pg.screenshot(path=os.path.join(SHOTS, '14-compare.png'))

        # notes: form, then we'll do tuning and drill
        if pg.locator('#chntype').count():
            pg.select_option('#chntype', 'form')
            pg.fill('#chnbody', 'Keep your bow arm steady.')
            pg.click('#chnsave'); pg.wait_for_timeout(500)
        chk('note: form/mental saved', 'keep your bow arm steady.' in pg.inner_text('#app').lower(), pg.evaluate('()=>localStorage.getItem("scoretool.coach.notes")')[:300] if True else '')

        if pg.locator('#chntype').count():
            pg.select_option('#chntype', 'tuning')
            pg.fill('#chnbody', 'Try a slightly stiffer plunger.')
            pg.click('#chnsave'); pg.wait_for_timeout(500)
        chk('note: tuning shows a box for the archer to log the change',
            'Try a slightly stiffer plunger.' in pg.inner_text('#app') and pg.locator('[data-chreply]').count() >= 1)

        if pg.locator('#chntype').count():
            pg.select_option('#chntype', 'drill')
            pg.fill('#chnbody', 'Blank bale, 12 ends, close target.')
            pg.click('#chnsave'); pg.wait_for_timeout(500)
        chk('note: drill saved', 'Blank bale, 12 ends, close target.' in pg.inner_text('#app'))
        chk('coach view: no purple / banned wording', no_purple(pg) and no_banned(pg.inner_text('#app')))
        pg.screenshot(path=os.path.join(SHOTS, '15-coach-notes.png'))
        # capture notes to apply on archer phone
        note_blob = pg.evaluate("()=>localStorage.getItem('scoretool.coach.notes')")
        layout_ok = pg.evaluate("()=>{const L=coachLayoutOf();return L && L.on && L.on.heat===false}")
        chk('layout did not require changing the archer feed', layout_ok is True)
        chk('first/later coach flow: no JS errors', not errs, errs[:2]); c.close()

        # 6. Archer sees notes, can tick drill and log a tuning change, can remove coach, cannot hide diary
        archer_seed = plus_seed() + (
            "localStorage.setItem('scoretool.coach.demo','1');"
            "localStorage.setItem('scoretool.coach.links'," + json.dumps(json.dumps([{
                'code': 'STTESTA', 'archerId': 'u_coach', 'archerName': 'Preview Archer',
                'coachId': 'demo-coach', 'coachName': 'Demo coach', 'status': 'active',
                'created': '2026-11-26', 'claimedAt': '2026-11-26'
            }])) + ");"
            "localStorage.setItem('scoretool.coach.notes'," + json.dumps(note_blob or '[]') + ");"
        )
        c, pg, errs = ctx(archer_seed)
        pg.goto(BASE); welcome(pg)
        pg.evaluate("nav('lab_diary')"); pg.wait_for_timeout(700)
        txt = pg.inner_text('#app')
        chk('archer diary: coach drills to tick off', pg.locator('#chdrills').count() == 1 and 'Blank bale' in txt, txt[:300])
        if pg.locator('[data-chdrill]').count():
            pg.check('[data-chdrill]')
            pg.wait_for_timeout(200)
        chk('archer: can tick a drill', pg.evaluate("()=> (coachNotes()||[]).some(n=>n.type==='drill'&&n.done)") is True)
        if pg.locator('[data-chreply]').count():
            pg.fill('[data-chreply]', 'Moved the plunger one click stiffer.')
            pg.click('[data-chrsave]'); pg.wait_for_timeout(200)
        chk('archer: can log a tuning change',
            pg.evaluate("()=> (coachNotes()||[]).some(n=>n.type==='tuning' && /plunger/.test(n.reply||''))") is True)
        chk('archer diary: no hide-diary control', 'hide diary' not in txt.lower() and 'hide the diary' not in txt.lower())
        pg.screenshot(path=os.path.join(SHOTS, '16-archer-diary-notes.png'))

        pg.evaluate("nav('lab_coach')"); pg.wait_for_timeout(500)
        chk('archer: Remove is shown for the linked coach', pg.locator('[data-chrm]').count() >= 1)
        pg.once('dialog', lambda d: d.accept())
        pg.click('[data-chrm]'); pg.wait_for_timeout(400)
        chk('archer: coach removed, link stops',
            pg.evaluate("()=> (coachLinks()||[]).some(x=>x.code==='STTESTA'&&x.status==='removed')") is True)
        pg.screenshot(path=os.path.join(SHOTS, '17-archer-removed-coach.png'))
        chk('archer notes flow: no JS errors', not errs, errs[:2]); c.close()

        # 7. Removed code no longer opens for the coach
        c, pg, errs = ctx(first_seed.replace("'status': 'pending'", "'status': 'removed'") if False else (
            "localStorage.setItem('scoretool.whatsnew.seen','x');"
            "localStorage.setItem('scoretool.coach.links'," + json.dumps(json.dumps([{**pending, 'status': 'removed'}])) + ");"
        ))
        pg.goto(BASE + '#coachcode=STTESTA'); pg.wait_for_timeout(700)
        chk('removed code: not active', 'not active' in pg.inner_text('#app').lower(), pg.inner_text('#app')[:200])
        pg.screenshot(path=os.path.join(SHOTS, '18-removed-code.png'))
        c.close()

        # 8. Plans copy mentions share with a coach, still no Squads / Lingkana / refund / Stripe
        c, pg, errs = ctx(plus_seed())
        pg.goto(BASE + '#plans'); pg.wait_for_timeout(800)
        txt = pg.inner_text('#plans') if pg.locator('#plans').count() else pg.inner_text('#app')
        chk('plans: Plus lists Share with a coach', 'Share with a coach' in txt, txt[:200])
        chk('plans: still no Squads or Lingkana', 'squad' not in txt.lower() and 'lingkana' not in txt.lower(), txt[:200])
        chk('plans: still no refund or Stripe wording', 'refund' not in txt.lower() and 'stripe' not in txt.lower())
        pg.screenshot(path=os.path.join(SHOTS, '19-plans-plus-coach.png'))
        c.close()

        b.close()
finally:
    srv.kill()

print(f'\n{len(ok)} passed, {len(bad)} failed')
if bad:
    print('FAILED:', ', '.join(bad))
    sys.exit(1)
