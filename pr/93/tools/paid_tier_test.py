#!/usr/bin/env python3
"""Paid tier (Stripe Plans), 25 Nov 2026. Phone size 390x844, no network to Stripe or Supabase.
- a founding profile and a profile already on the phone before this build keep full access;
- a new profile gets the free score card, league and Lingkana scoring; Plus and Pro screens show a plan card;
- Plans shows A$4.99/A$49 Plus and A$7.99/A$79 Pro;
- a plan only opens from a server reply while signed in; a hand-written cache without sign-in opens nothing;
- Plus opens Analysis but not Tune; signing out relocks; saved scores are never rewritten.
Screenshots go to $SHOTS (default /workspace/st-paidtier)."""
import json, os, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import guard  # noqa: F401
import freeport
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.environ.get('SHOTS', '/workspace/st-paidtier')
os.makedirs(SHOTS, exist_ok=True)
ok, bad = [], []
def chk(n, c, extra=''):
    (ok if c else bad).append(n); print(('PASS ' if c else 'FAIL ') + n + ('' if c else '  ' + str(extra)[:200]), flush=True)
PORT = freeport.get()
srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.4)
BASE = f'http://127.0.0.1:{PORT}/'
FN = 'https://sllsqpfqwckwtljzjxli.supabase.co/functions/v1/stripe-entitlement'
def exe():
    for c in ('/usr/bin/google-chrome', '/usr/bin/chromium'):
        if os.path.isfile(c): return c
def welcome(pg):
    end = time.time() + 8
    while time.time() < end:
        if pg.locator('#wnx').count(): pg.locator('#wnx').click()
        if pg.locator('#nmlater').count(): pg.click('#nmlater'); pg.wait_for_timeout(200); continue
        if pg.locator('#nmin').count(): pg.fill('#nmin', 'Tester'); pg.click('#nmingo'); pg.wait_for_timeout(200); continue
        try:
            if pg.evaluate("()=>{const t=document.querySelector('#tabs');return !!t&&!t.hidden&&typeof tierOf=='function'}"): return True
        except Exception: pass
        pg.wait_for_timeout(200)
    return False
def shot(pg, name): pg.screenshot(path=os.path.join(SHOTS, name + '.png'))
def go(pg, v): pg.evaluate(f"nav('{v}')"); pg.wait_for_timeout(350)
def locked(pg): return pg.locator('#tierlock').count() == 1
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe(), args=['--no-sandbox'])
        def ctx(seed=None):
            c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
            if seed: c.add_init_script(seed)
            pg = c.new_page(); pg.set_default_timeout(12000); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('dialog', lambda d: d.accept())
            return c, pg, errs
        # 1. profile already on this phone before the paid build (made 22 Nov, not founding) -> early access, data unchanged
        seed = """if(!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');
          localStorage.setItem('scoretool.archers',JSON.stringify([{id:'u_old',name:'Old Archer',short:'Old',bow:'Compound'}]));
          localStorage.setItem('scoretool.tester','u_old');
          localStorage.setItem('scoretool.v1.u_old',JSON.stringify({profile:'Old Archer',unlocked:true,sessions:[{id:'keepme',round:'Vegas 300',ends:[['10','10','9']],date:'2026-11-22'}],best:[],plots:[],diary:[{id:'d1',date:'2026-11-22',text:'my diary note'}]}));
          localStorage.setItem('scoretool.whatsnew.seen','x');localStorage.setItem('scoretool.names.asked','1')}"""
        c, pg, errs = ctx(seed)
        pg.goto(BASE); welcome(pg)
        before = pg.evaluate("localStorage.getItem('scoretool.v1.u_old')")
        chk('existing profile is on early access', pg.evaluate('tierOf()') == 'early', pg.evaluate('tierOf()'))
        go(pg, 'lab_diary'); chk('existing profile still opens its Diary', not locked(pg))
        go(pg, 'lab_tune'); chk('existing profile still opens Tune (Pro)', not locked(pg))
        chk('existing scores and diary not rewritten', json.loads(pg.evaluate("localStorage.getItem('scoretool.v1.u_old')")).get('sessions') == json.loads(before).get('sessions'))
        go(pg, 'lab_settings'); pg.wait_for_timeout(300)
        chk('Settings shows the plan card', pg.locator('#plancard').count() == 1)
        pg.locator('#plancard').scroll_into_view_if_needed(); shot(pg, '01-early-access-settings')
        chk('no JS errors (early)', not errs, errs[:2]); c.close()
        # 2. founding profile -> founding
        c, pg, errs = ctx("""localStorage.setItem('scoretool.archers',JSON.stringify([{id:'f1',name:'Found Er',short:'Found',bow:'Compound',founding:true}]));localStorage.setItem('scoretool.tester','f1');localStorage.setItem('scoretool.paid.early',JSON.stringify({ids:[]}));localStorage.setItem('scoretool.whatsnew.seen','x')""")
        pg.goto(BASE); welcome(pg)
        chk('founding profile stays founding (Pro, free for life)', pg.evaluate('tierOf()') == 'founding')
        go(pg, 'lab_mybows'); chk('founding opens My bows', not locked(pg)); c.close()
        # 3. brand new phone, new profile -> Free
        c, pg, errs = ctx("localStorage.setItem('scoretool.whatsnew.seen','x')")
        pg.goto(BASE + '?app=1'); pg.wait_for_selector('#app')
        if pg.locator('#npc').count(): pg.fill('#npname', 'New Archer'); pg.click('#npc')
        chk('new profile gets past welcome', welcome(pg))
        chk('new profile is Free', pg.evaluate('tierOf()') == 'free', pg.evaluate('tierOf()'))
        shot(pg, '02-free-home')
        go(pg, 'score'); chk('Score tab is free', not locked(pg) and pg.locator('[data-cstp="casual"]').count() >= 1)
        shot(pg, '03-free-score')
        for v in ('lab_latest', 'lab_arrows', 'lab_ranks', 'lab_gear', 'lab_leagues', 'lab_match', 'lab_rounds', 'lab_rules', 'lab_mydata', 'lab_settings'):
            go(pg, v); chk(f'{v} is free', not locked(pg))
        for v in ('lab_analysis', 'lab_diary', 'lab_squad', 'lab_group'):
            go(pg, v); chk(f'{v} asks for Plus', locked(pg) and 'PLUS' in pg.inner_text('#tierlock').upper())
        go(pg, 'lab_analysis'); shot(pg, '04-locked-plus-analysis')
        for v in ('lab_mybows', 'lab_myarrows', 'lab_chooser', 'lab_tune', 'lab_opt', 'lab_calc'):
            go(pg, v); chk(f'{v} asks for Pro', locked(pg) and 'PRO' in pg.inner_text('#tierlock').upper())
        go(pg, 'lab_tune'); shot(pg, '05-locked-pro-tune')
        go(pg, 'plans')
        chk('Plans: Plus A$4.99 a month, Pro A$7.99 a month', pg.inner_text('#plusprice') == 'A$4.99 a month' and pg.inner_text('#proprice') == 'A$7.99 a month')
        chk('Plans: monthly buttons use the monthly lookup keys', pg.get_attribute('#buyplus', 'data-lookup') == 'scoretool_plus_month' and pg.get_attribute('#buypro', 'data-lookup') == 'scoretool_pro_month')
        shot(pg, '06-plans-monthly')
        pg.click('#billyear'); pg.wait_for_timeout(100)
        chk('Plans: yearly A$49 and A$79', pg.inner_text('#plusprice') == 'A$49 a year' and pg.inner_text('#proprice') == 'A$79 a year' and pg.get_attribute('#buypro', 'data-lookup') == 'scoretool_pro_year')
        shot(pg, '07-plans-yearly')
        chk('Plans has no refund, Stripe or sign-in wording', not any(w in pg.inner_text('#plans').lower() for w in ('refund','stripe','link','sign in','already paid')))
        chk('Free tier listed with Lingkana', 'Lingkana' in pg.inner_text('#planfree'))
        pg.click('#planrestore'); pg.wait_for_timeout(150); chk('Restore shows Google and Apple only, no email code', pg.locator('#plangoogle').is_visible() and pg.locator('#planapple').is_visible() and pg.locator('#planemail').count() == 0 and pg.locator('#plancode').count() == 0)
        pg.locator('#planrest').scroll_into_view_if_needed(); shot(pg, '08-plans-restore')
        # checkout request goes to the function with the chosen key (stubbed; no Stripe call)
        sent = []
        pg.route(FN + '/checkout', lambda r: (sent.append(r.request.post_data), r.fulfill(status=200, content_type='application/json', body='{"ok":true,"url":"' + BASE + '?checkout=success"}')))
        pg.click('#buyplus'); pg.wait_for_timeout(800)
        d = json.loads(sent[0]) if sent else {}
        chk('Get Plus sends the Plus yearly key and this app as return', d.get('lookup_key') == 'scoretool_plus_year' and d.get('success_url', '').startswith(BASE))
        pg.wait_for_selector('#app'); welcome(pg)
        # hand-written cache, not signed in -> nothing opens
        pg.evaluate("""()=>localStorage.setItem('scoretool.stripe.entitlement',JSON.stringify({server:true,valid:true,tier:'pro',status:'active',current_period_end:'2099-01-01T00:00:00Z'}))""")
        chk('a hand-written plan without sign-in opens nothing', pg.evaluate('tierOf()') == 'free')
        # signed in, server says Plus active
        pg.route(FN + '/entitlement', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps({'valid': True, 'server': True, 'tier': 'plus', 'status': 'active', 'current_period_end': '2099-01-01T00:00:00Z', 'customer_id': 'cus_test'})))
        pg.evaluate("""()=>localStorage.setItem('scoretool.stripe.auth',JSON.stringify({access_token:'x'.repeat(40),refresh_token:'',email:'buyer@example.com'}))""")
        r = pg.evaluate('entitlementVerify()')
        chk('server reply Plus unlocks Plus', r.get('ok') and pg.evaluate('tierOf()') == 'plus', r)
        go(pg, 'lab_analysis'); chk('Plus opens Analysis', not locked(pg))
        go(pg, 'lab_tune'); chk('Plus still asks for Pro on Tune', locked(pg))
        go(pg, 'home'); pg.wait_for_timeout(300)
        chk('home shows the plan with Manage subscription', pg.locator('#planhome').count() == 1 and pg.locator('#planmanage').count() == 1)
        shot(pg, '09-plus-home')
        # cancel: server says canceled -> relock
        pg.unroute(FN + '/entitlement')
        pg.route(FN + '/entitlement', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps({'valid': False, 'server': True, 'tier': 'plus', 'status': 'canceled', 'current_period_end': '2026-11-25T00:00:00Z'})))
        pg.evaluate('entitlementVerify()')
        go(pg, 'lab_analysis'); chk('after cancel the server reply relocks Plus', locked(pg) and pg.evaluate('tierOf()') == 'free')
        # signed out (401) -> cache cleared
        pg.unroute(FN + '/entitlement')
        pg.route(FN + '/entitlement', lambda r: r.fulfill(status=401, content_type='application/json', body='{"ok":false}'))
        pg.evaluate('entitlementVerify()')
        chk('a 401 clears the cached plan', pg.evaluate("localStorage.getItem('scoretool.stripe.entitlement')") is None)
        chk('no JS errors (new profile)', not errs, errs[:2]); c.close()
        # 3b. the archerycalendars.com link (#plans) opens Plans on a phone with no profile yet
        c, pg, errs = ctx("localStorage.setItem('scoretool.whatsnew.seen','x')")
        pg.goto(BASE + '#plans'); pg.wait_for_selector('#plans', timeout=15000)
        chk('#plans opens Plans with no profile', pg.locator('#plusprice').count() == 1 and pg.locator('#whopick').count() == 0)
        shot(pg, '17-plans-from-calendar-link')
        pg.click('#planback'); pg.wait_for_timeout(500)
        chk('Back from #plans goes to the profile picker', pg.locator('#whopick').count() == 1 and '#plans' not in pg.url)
        chk('no JS errors (#plans)', not errs, errs[:2]); c.close()
        # 3c. Google / Apple sign-in
        SBU = 'https://sllsqpfqwckwtljzjxli.supabase.co'
        c, pg, errs = ctx("localStorage.setItem('scoretool.whatsnew.seen','x')")
        pg.route(SBU + '/auth/v1/settings', lambda r: r.fulfill(status=200, content_type='application/json', body='{"external":{"google":false,"apple":false,"email":true}}'))
        pg.goto(BASE + '#plans'); pg.wait_for_selector('#plans', timeout=15000)
        pg.click('#planrestore'); pg.click('#plangoogle'); pg.wait_for_timeout(600)
        chk('Google not switched on: short message, stays on Plans', 'not available' in pg.inner_text('#planmsg').lower() or 'isn’t available' in pg.inner_text('#planmsg'))
        pg.click('#planapple'); pg.wait_for_timeout(600)
        chk('Apple not switched on: short message', 'Apple' in pg.inner_text('#planmsg'))
        shot(pg, '19-restore-google-apple')
        pg.unroute(SBU + '/auth/v1/settings')
        pg.route(SBU + '/auth/v1/settings', lambda r: r.fulfill(status=200, content_type='application/json', body='{"external":{"google":true,"apple":true}}'))
        went = []
        pg.route(SBU + '/auth/v1/authorize**', lambda r: (went.append(r.request.url), r.fulfill(status=200, body='ok')))
        pg.click('#plangoogle'); pg.wait_for_timeout(1200)
        from urllib.parse import urlparse, parse_qs
        qd = parse_qs(urlparse(went[0]).query) if went else {}
        chk('Google on: goes to Supabase authorize with provider google and redirect ?plans=1', qd.get('provider') == ['google'] and qd.get('redirect_to', [''])[0] == BASE + '?plans=1', went[:1])
        c.close()
        c, pg, errs = ctx("localStorage.setItem('scoretool.whatsnew.seen','x')")
        pg.route(SBU + '/auth/v1/user', lambda r: r.fulfill(status=200, content_type='application/json', body='{"email":"buyer@example.com"}'))
        pg.route(FN + '/entitlement', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps({'valid': True, 'server': True, 'tier': 'pro', 'status': 'active', 'current_period_end': '2099-01-01T00:00:00Z', 'customer_id': 'cus_x'})))
        pg.goto(BASE + '?plans=1#access_token=' + 'a' * 40 + '&refresh_token=r1&token_type=bearer'); pg.wait_for_selector('#plans', timeout=15000)
        try: pg.wait_for_function("()=>{const e=JSON.parse(localStorage.getItem('scoretool.stripe.entitlement')||'{}');return e.tier==='pro'&&!!document.querySelector('#planmanage')}", timeout=8000)
        except Exception: pass
        auth = json.loads(pg.evaluate("localStorage.getItem('scoretool.stripe.auth')") or '{}')
        chk('back from Google: session saved with the account email, token removed from the address', auth.get('access_token') == 'a' * 40 and auth.get('email') == 'buyer@example.com' and 'access_token' not in pg.url and pg.locator('#plans').count() == 1, pg.url)
        chk('back from Google: plan read from the server, Manage shown', json.loads(pg.evaluate("localStorage.getItem('scoretool.stripe.entitlement')") or '{}').get('tier') == 'pro' and pg.locator('#planmanage').count() == 1)
        shot(pg, '20-back-from-google-pro')
        pg.goto(BASE + '?plans=1&error=access_denied&error_description=x'); pg.wait_for_selector('#plans', timeout=15000)
        chk('a refused sign-in shows one short line', 'Try again' in pg.inner_text('#planmsg') and 'error' not in pg.url)
        chk('no JS errors (OAuth)', not errs, errs[:2]); c.close()
        # 4. Lingkana is free and unchanged for a new phone
        c, pg, errs = ctx("localStorage.setItem('scoretool.paid.early',JSON.stringify({ids:[]}))")
        pg.goto(BASE + '?v=home#lk-home'); pg.wait_for_selector('#lkhome', timeout=15000)
        chk('Lingkana home opens with no plan', 'Login to Event' in pg.inner_text('#lkhome') and pg.locator('#tierlock').count() == 0)
        shot(pg, '10-lingkana-free')
        pg.goto(BASE + '?v=res#lk-results'); pg.wait_for_selector('#lkresults', timeout=15000)
        chk('Lingkana results open with no plan', pg.locator('#tierlock').count() == 0)
        chk('no JS errors (Lingkana)', not errs, errs[:2]); c.close()
        b.close()
finally:
    srv.terminate()
print(f'\n{len(ok)} passed, {len(bad)} failed')
sys.exit(1 if bad else 0)
