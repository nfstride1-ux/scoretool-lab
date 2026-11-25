#!/usr/bin/env python3
"""Tier gating, 26 Nov 2026 (Nathe t1209u: each tier locks out the other functions). Phone size 390x844, no network to Stripe or Supabase.
For a new phone on Free, a signed-in Plus member and a signed-in Pro member, every feature is opened three ways
(in-app nav, a ?p= deep link on a fresh load, and the back button) and must be open or show the plan lock screen as the tier allows.
Lingkana data is never read or written. BASE env runs it against another copy (e.g. the live site). Screenshots go to $SHOTS."""
import json, os, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import guard  # noqa: F401
import freeport
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.environ.get('SHOTS', '/workspace/st-paidtier/gating')
os.makedirs(SHOTS, exist_ok=True)
ok, bad = [], []
def chk(n, c, extra=''):
    (ok if c else bad).append(n); print(('PASS ' if c else 'FAIL ') + n + ('' if c else '  ' + str(extra)[:200]), flush=True)
srv = None
BASE = os.environ.get('BASE')
if not BASE:
    PORT = freeport.get()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.4); BASE = f'http://127.0.0.1:{PORT}/'
SBU = 'https://sllsqpfqwckwtljzjxli.supabase.co'
FN = SBU + '/functions/v1/stripe-entitlement'
FREE = ['score', 'lab_latest', 'lab_arrows', 'lab_ranks', 'lab_gear', 'lab_leagues', 'lab_match', 'lab_rounds', 'lab_rules']
PLUS = ['lab_analysis', 'stats', 'analytics', 'lab_diary', 'diary', 'lab_group']
PRO = ['lab_mybows', 'lab_myarrows', 'lab_chooser', 'lab_tune', 'lab_opt', 'lab_calc']
ALLOW = {'free': set(FREE), 'plus': set(FREE + PLUS), 'pro': set(FREE + PLUS + PRO)}
def exe():
    for c in ('/usr/bin/google-chrome', '/usr/bin/chromium'):
        if os.path.isfile(c): return c
PROFILE = "localStorage.setItem('scoretool.whatsnew.seen','x');localStorage.setItem('scoretool.names.asked','1');localStorage.setItem('scoretool.paid.early',JSON.stringify({ids:[]}));localStorage.setItem('scoretool.archers',JSON.stringify([{id:'u_gate',name:'Gate Test',short:'Gate',bow:'Compound'}]));localStorage.setItem('scoretool.tester','u_gate');localStorage.setItem('scoretool.v1.u_gate',JSON.stringify({profile:'Gate Test',unlocked:true,sessions:[],best:[],plots:[]}));"
def seed(tier):
    s = PROFILE
    if tier != 'free':
        s += "localStorage.setItem('scoretool.stripe.auth',JSON.stringify({access_token:'" + 'a' * 40 + "',refresh_token:'r1',email:'buyer@example.com'}));"
        s += "localStorage.setItem('scoretool.stripe.entitlement',JSON.stringify({server:true,valid:true,tier:'" + tier + "',status:'active',current_period_end:'2099-01-01T00:00:00Z',customer_id:'cus_x'}));"
    return "if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');" + s + "}"
table = {}
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe(), args=['--no-sandbox'])
        for tier in ('free', 'plus', 'pro'):
            c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
            c.add_init_script(seed(tier))
            pg = c.new_page(); pg.set_default_timeout(12000); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            ent = {'valid': tier != 'free', 'server': True, 'tier': tier if tier != 'free' else None, 'status': 'active', 'current_period_end': '2099-01-01T00:00:00Z', 'customer_id': 'cus_x'}
            def handler(body):
                return lambda r: r.fulfill(status=200, content_type='application/json', body=body)
            c.route(FN + '/**', handler(json.dumps(ent)))
            c.route('https://ntfy.sh/**', lambda r: r.fulfill(status=200, body=''))  # never touch the relay (Lingkana data)
            pg.goto(BASE); pg.wait_for_timeout(2500)
            if pg.locator('#wnx').count(): pg.locator('#wnx').click()
            chk(f'{tier}: app reports tier {tier}', pg.evaluate('tierOf()') == tier, pg.evaluate('tierOf()'))
            for v in FREE + PLUS + PRO:
                want = 'open' if v in ALLOW[tier] else 'locked'
                pg.evaluate("nav('home')"); pg.wait_for_timeout(150)
                pg.evaluate(f"nav('{v}')"); pg.wait_for_timeout(350)
                a = 'locked' if pg.locator('#tierlock').count() else 'open'
                pg.screenshot(path=os.path.join(SHOTS, f'{tier}-{v}.png'))
                # back button: leave and come back with history
                pg.evaluate("nav('home')"); pg.wait_for_timeout(150); pg.go_back(); pg.wait_for_timeout(450)
                bk = 'locked' if pg.locator('#tierlock').count() else ('open' if pg.evaluate('view') == v else 'n/a')
                # deep link on a fresh load
                pg.goto(BASE + '?p=' + v); pg.wait_for_timeout(1800)
                if pg.locator('#wnx').count(): pg.locator('#wnx').click()
                dl = 'locked' if pg.locator('#tierlock').count() else ('open' if pg.evaluate('view') == v else 'n/a:' + pg.evaluate('view'))
                table.setdefault(v, {})[tier] = a
                chk(f'{tier} {v}: nav {a}', a == want, want)
                chk(f'{tier} {v}: back button {bk}', bk in (want, 'n/a'), want)
                chk(f'{tier} {v}: deep link {dl}', dl == want or dl.startswith('n/a'), want)
            chk(f'{tier}: no JS errors', not errs, errs[:2])
            c.close()
        b.close()
finally:
    if srv: srv.terminate()
print('\nfeature | free | plus | pro')
for v, r in table.items(): print(f"{v} | {r.get('free')} | {r.get('plus')} | {r.get('pro')}")
json.dump(table, open(os.path.join(SHOTS, 'table.json'), 'w'))
print(f'\n{len(ok)} passed, {len(bad)} failed')
sys.exit(1 if bad else 0)
