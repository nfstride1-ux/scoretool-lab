#!/usr/bin/env python3
"""Plans: manage or cancel a subscription, 26 Nov 2026. Phone size 390x844, no network to Stripe or Supabase.
- a signed-in paid member sees "Your plan" and a "Manage or cancel subscription" button that opens the billing portal;
- their current tier's button says "Your plan"; no refund or Stripe wording;
- back from checkout, Plans keeps asking the server until the plan shows (the webhook can land after the return);
- Plans copy lists no removed feature (Squads was removed) and does not name Lingkana (Free says League scoring);
- a cancelled plan shows no manage button and relocks; a free phone sees no manage button.
Screenshots go to $SHOTS (default /workspace/st-paidtier/manage)."""
import json, os, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import guard  # noqa: F401
import freeport
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.environ.get('SHOTS', '/workspace/st-paidtier/manage')
os.makedirs(SHOTS, exist_ok=True)
ok, bad = [], []
def chk(n, c, extra=''):
    (ok if c else bad).append(n); print(('PASS ' if c else 'FAIL ') + n + ('' if c else '  ' + str(extra)[:200]), flush=True)
PORT = freeport.get()
srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.4)
BASE = f'http://127.0.0.1:{PORT}/'
SBU = 'https://sllsqpfqwckwtljzjxli.supabase.co'
FN = SBU + '/functions/v1/stripe-entitlement'
def exe():
    for c in ('/usr/bin/google-chrome', '/usr/bin/chromium'):
        if os.path.isfile(c): return c
AUTH = "localStorage.setItem('scoretool.stripe.auth',JSON.stringify({access_token:'" + 'a' * 40 + "',refresh_token:'r1',email:'buyer@example.com'}));"
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
def ent(valid, status='active', tier='plus'):
    return json.dumps({'valid': valid, 'server': True, 'tier': tier, 'status': status, 'current_period_end': '2099-01-01T00:00:00Z', **({'customer_id': 'cus_x'} if valid else {})})
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe(), args=['--no-sandbox'])
        def ctx(seed):
            c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
            c.add_init_script("if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');localStorage.setItem('scoretool.whatsnew.seen','x');localStorage.setItem('scoretool.paid.early',JSON.stringify({ids:[]}));" + seed + "}")
            pg = c.new_page(); pg.set_default_timeout(12000); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.route(SBU + '/auth/v1/settings', lambda r: r.fulfill(status=200, content_type='application/json', body='{"external":{"google":true,"apple":false}}'))
            return c, pg, errs
        # 1. signed-in Plus member opens Plans
        c, pg, errs = ctx(AUTH)
        pg.route(FN + '/entitlement', lambda r: r.fulfill(status=200, content_type='application/json', body=ent(True)))
        portal = []
        pg.route(FN + '/portal', lambda r: (portal.append(r.request.headers.get('authorization', '')), r.fulfill(status=200, content_type='application/json', body='{"ok":true,"url":"' + BASE + 'privacy.html?portal=1"}')))
        pg.goto(BASE + '#plans'); pg.wait_for_selector('#plans', timeout=15000)
        try: pg.wait_for_selector('#planmanage', timeout=8000)
        except Exception: pass
        txt = pg.inner_text('#plans')
        chk('paid member: "Your plan" card shows Plus', pg.locator('#planmine').count() == 1 and 'plus' in pg.inner_text('#planmine').lower(), txt[:200])
        chk('paid member: "Manage or cancel subscription" button shown', pg.locator('#planmanage').inner_text().strip() == 'Manage or cancel subscription' if pg.locator('#planmanage').count() else False)
        chk('current tier button says "Your plan" and is disabled; Pro still on offer', pg.locator('#buyplus').inner_text().strip() == 'Your plan' and pg.locator('#buyplus').is_disabled() and pg.locator('#buypro').inner_text().strip() == 'Get Pro')
        chk('Plans lists no removed feature (Squads)', 'squad' not in txt.lower(), txt)
        chk('Free says "League scoring" and no tier names Lingkana', 'League scoring' in pg.inner_text('#planfree') and 'lingkana' not in txt.lower(), txt)
        chk('no refund or Stripe wording', not any(w in txt.lower() for w in ('refund', 'stripe')))
        pg.screenshot(path=os.path.join(SHOTS, '01-plans-paid-manage.png'))
        pg.click('#planmanage'); pg.wait_for_timeout(1500)
        chk('Manage opens the billing portal with the signed-in token', portal and portal[0] == 'Bearer ' + 'a' * 40 and 'portal=1' in pg.url, (portal, pg.url))
        chk('no JS errors (manage)', not errs, errs[:2]); c.close()
        # 2. home card for the paid member
        c, pg, errs = ctx(AUTH + "localStorage.setItem('scoretool.stripe.checked',String(Date.now()));localStorage.setItem('scoretool.names.asked','1');localStorage.setItem('scoretool.archers',JSON.stringify([{id:'u_new',name:'New Archer',short:'New',bow:'Compound'}]));localStorage.setItem('scoretool.tester','u_new');localStorage.setItem('scoretool.v1.u_new',JSON.stringify({profile:'New Archer',unlocked:true,sessions:[],best:[],plots:[]}));")
        pg.route(FN + '/entitlement', lambda r: r.fulfill(status=200, content_type='application/json', body=ent(True)))
        pg.goto(BASE); welcome(pg); pg.evaluate('entitlementVerify()')
        pg.evaluate("nav('lab_analysis')"); pg.wait_for_timeout(400); pg.evaluate("nav('home')"); pg.wait_for_timeout(500)
        chk('home plan card has "Manage or cancel subscription"', pg.locator('#planhome #planmanage').count() == 1 and 'cancel' in pg.inner_text('#planhome #planmanage').lower(), pg.locator('#planhome').count())
        pg.screenshot(path=os.path.join(SHOTS, '02-home-plan-card.png'))
        chk('no JS errors (home)', not errs, errs[:2]); c.close()
        # 3. back from checkout before the webhook lands: first two replies say no plan, the third says Plus
        c, pg, errs = ctx(AUTH + "localStorage.setItem('scoretool.stripe.checked',String(Date.now()));")
        calls = []
        pg.route(FN + '/entitlement', lambda r: (calls.append(1), r.fulfill(status=200, content_type='application/json', body=ent(len(calls) >= 3))))
        pg.goto(BASE + '?checkout=success'); pg.wait_for_selector('#plans', timeout=15000)
        chk('back from checkout: Plans opens and says it is checking', 'Checking your plan' in pg.inner_text('#planmsg') and 'checkout=' not in pg.url, pg.url)
        try: pg.wait_for_selector('#planmanage', timeout=12000)
        except Exception: pass
        chk('back from checkout: plan shows once the server has it (retries)', pg.locator('#planmanage').count() == 1 and len(calls) >= 3 and pg.evaluate("tierOf()") == 'plus', (len(calls), pg.evaluate("tierOf()")))
        chk('back from checkout: notice cleared', pg.inner_text('#planmsg').strip() == '')
        pg.screenshot(path=os.path.join(SHOTS, '03-back-from-checkout.png'))
        chk('no JS errors (checkout return)', not errs, errs[:2]); c.close()
        # 4. back from checkout while not signed in: asks to sign in
        c, pg, errs = ctx('')
        pg.goto(BASE + '?checkout=success'); pg.wait_for_selector('#plans', timeout=15000); pg.wait_for_timeout(500)
        chk('not signed in after checkout: "Sign in to finish." with Google/Apple shown', 'Sign in to finish' in pg.inner_text('#planmsg') and pg.locator('#plangoogle').is_visible())
        chk('free phone: no manage button', pg.locator('#planmanage').count() == 0 and pg.locator('#buyplus').inner_text().strip() == 'Get Plus')
        c.close()
        # 5. cancelled plan: no manage button, relocked
        c, pg, errs = ctx(AUTH + "localStorage.setItem('scoretool.stripe.entitlement','" + ent(True) + "');")
        pg.route(FN + '/entitlement', lambda r: r.fulfill(status=200, content_type='application/json', body=ent(False, 'canceled')))
        pg.goto(BASE + '#plans'); pg.wait_for_selector('#plans', timeout=15000)
        try: pg.wait_for_function("()=>!document.querySelector('#planmanage')", timeout=8000)
        except Exception: pass
        chk('cancelled: no manage button and Plus relocked', pg.locator('#planmanage').count() == 0 and pg.evaluate("tierOf()") == 'free', pg.evaluate("tierOf()"))
        pg.screenshot(path=os.path.join(SHOTS, '04-cancelled.png'))
        chk('no JS errors (cancelled)', not errs, errs[:2]); c.close()
        b.close()
finally:
    srv.terminate()
print(f'\n{len(ok)} passed, {len(bad)} failed')
sys.exit(1 if bad else 0)
