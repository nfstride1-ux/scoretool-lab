#!/usr/bin/env python3
"""Tuning sessions, 26 Nov 2026 (Nathe: 'Yes, build the tuning preview'). Phone size 390x844, Pro member, no network to Stripe or Supabase.
Checks: one bow picker + one arrow picker (no 'Use my arrow setup' tick box, no Face choice), the Concept X 40 / 37 mismatch fixed,
paper tune tear keypad (3 x 3, any number of arrows, tear->fix hints), crosshair lines per tune (torque vertical, Dudley horizontal,
group both; Torque has torqued-left and torqued-right groups before and after), What I changed (compound/recurve filter, direction, amount, note, no George marks), Tune helper setup-first compound/recurve order, Arrow setup collapsed by default,
past sessions deleted only after a confirm, an old face session still opens unchanged, bare shaft verdict, Arrow chooser AC1-AC5 still there,
Lingkana keys untouched. BASE env runs it against another copy. Screenshots go to $SHOTS."""
import json, os, subprocess, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import guard  # noqa: F401
import freeport
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.environ.get('SHOTS', '/workspace/st-tuning')
os.makedirs(SHOTS, exist_ok=True)
ok, bad = [], []
def chk(n, c, extra=''):
    (ok if c else bad).append(n); print(('PASS ' if c else 'FAIL ') + n + ('' if c else '  ' + str(extra)[:300]), flush=True)
srv = None
BASE = os.environ.get('BASE')
if not BASE:
    PORT = freeport.get()
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.4); BASE = f'http://127.0.0.1:{PORT}/'
FN = 'https://sllsqpfqwckwtljzjxli.supabase.co/functions/v1/stripe-entitlement'
def exe():
    for c in ('/usr/bin/google-chrome', '/usr/bin/chromium'):
        if os.path.isfile(c): return c
OLD = {'id': 't1700000000000', 'archer': 'Tune Test', 'date': '2026-11-01', 'name': 'Old face session', 'change': 'Group test', 'dist': '18m', 'face': '40cm', 'bow': 'bX40', 'bowName': 'Hoyt concept x 40', 'before': [[0.1, 0.1, '2026-11-01'], [0.2, 0.0, '2026-11-01']], 'after': [], 'grp': 'before'}
DATA = {'profile': 'Tune Test', 'unlocked': True, 'sessions': [], 'best': [], 'plots': [],
        'bows': [{'id': 'bX40', 'archer': 'Tune Test', 'name': 'Hoyt concept x 40', 'extra': [], 'marks': {}}],
        'bowSel': {'Tune Test': 'bX40'},
        'bowSpec': {'bX40': {'type': 'compound', 'make': 'Hoyt', 'model': 'Concept X 37', 'specId': 'hoyt-cx37', 'speed': '330', 'kind': 'ATA', 'dw': '56', 'dl': '30.5', 'bh': '7', 'ata': '37'}},
        'arrowSets': [{'id': 'as-ace', 'archer': 'Tune Test', 'name': 'ACE 470', 'shaft': 'Easton ACE', 'spine': '470', 'len': '29', 'pt': '120'}],
        'tune': [OLD]}
PROFILE = ("localStorage.setItem('scoretool.whatsnew.seen','x');localStorage.setItem('scoretool.names.asked','1');localStorage.setItem('scoretool.paid.early',JSON.stringify({ids:[]}));"
           "localStorage.setItem('scoretool.archers',JSON.stringify([{id:'u_tune',name:'Tune Test',short:'Tune',bow:'Compound'}]));localStorage.setItem('scoretool.tester','u_tune');"
           "localStorage.setItem('scoretool.v1.u_tune'," + json.dumps(json.dumps(DATA)) + ");localStorage.setItem('lingkana.sentinel','keep');localStorage.setItem('scoretool.dname.asked.u_tune','9999999999999');"
           "localStorage.setItem('scoretool.stripe.auth',JSON.stringify({access_token:'" + 'a' * 40 + "',refresh_token:'r1',email:'buyer@example.com'}));"
           "localStorage.setItem('scoretool.stripe.entitlement',JSON.stringify({server:true,valid:true,tier:'pro',status:'active',current_period_end:'2099-01-01T00:00:00Z',customer_id:'cus_x'}));")
SEED = "if(!sessionStorage.getItem('s')){sessionStorage.setItem('s','1');" + PROFILE + "}"
LK = "JSON.stringify(Object.keys(localStorage).filter(k=>/lingkana|^lk/i.test(k)).sort().map(k=>[k,localStorage.getItem(k)]))"
def shot(pg, n): pg.screenshot(path=os.path.join(SHOTS, n), full_page=False)
def opt(pg): pg.evaluate("S._tuneId=null;save();nav('lab_opt')"); pg.wait_for_timeout(400)
def start(pg, tune, name=''):
    opt(pg); pg.select_option('#tc', tune)
    if name: pg.fill('#tn', name)
    pg.click('#tgo'); pg.wait_for_timeout(400)
def tap(pg, fx, fy):
    pg.locator('#tface').scroll_into_view_if_needed(); bx = pg.locator('#tface').bounding_box(); pg.mouse.click(bx['x'] + bx['width'] * fx, bx['y'] + bx['height'] * fy); pg.wait_for_timeout(200)
def cur(pg): return pg.evaluate("JSON.parse(JSON.stringify(S.tune.find(t=>t.id==S._tuneId)||null))")
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe(), args=['--no-sandbox'])
        c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        c.add_init_script(SEED)
        ent = {'valid': True, 'server': True, 'tier': 'pro', 'status': 'active', 'current_period_end': '2099-01-01T00:00:00Z', 'customer_id': 'cus_x'}
        c.route(FN + '/**', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(ent)))
        c.route('https://ntfy.sh/**', lambda r: r.fulfill(status=200, body=''))
        pg = c.new_page(); pg.set_default_timeout(12000); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(BASE); pg.wait_for_timeout(2500)
        if pg.locator('#wnx').count(): pg.locator('#wnx').click()
        lk0 = pg.evaluate(LK)
        chk('pro member', pg.evaluate('tierOf()') == 'pro')
        opt(pg); t = pg.inner_text('#app')
        chk('no Use my arrow setup tick box', pg.locator('#tarw').count() == 0 and 'Use my arrow setup' not in t)
        chk('no Face choice', pg.locator('#tf').count() == 0 and not pg.evaluate("[...document.querySelectorAll('#app label')].some(l=>l.textContent.trim()=='Face')"))
        chk('one bow picker, one arrow picker', pg.locator('#app select#t_mybow').count() == 1 and pg.locator('#app select#t_myarr').count() == 1 and pg.locator('#app select').count() == 4, pg.locator('#app select').count())
        bl = pg.inner_text('#t_bowline')
        chk('bow line is Concept X 40, 327 fps (mismatch fixed)', 'Concept X 40' in bl and '327' in bl and '37' not in bl.replace('7.25', ''), bl)
        chk('bow picker label has no Concept X 37', 'Concept X 37' not in pg.inner_text('#t_mybow'))
        tunes = pg.evaluate("[...document.querySelectorAll('#tc option')].map(o=>o.value)")
        chk('tune list', tunes[:6] == ['Paper tune', 'Bare shaft vs fletched', 'Torque tune', 'Dudley / yoke tune', 'Group tune', 'Walk-back'], tunes)
        chk('390px no sideways scroll (form)', pg.evaluate("document.documentElement.scrollWidth") <= 392)
        shot(pg, '01-new-session.png')
        # paper tune
        start(pg, 'Paper tune', 'Paper test')
        chk('paper: no target face', pg.locator('#tface').count() == 0)
        chk('paper: 3x3 tear keypad', pg.locator('#tpad [data-tear]').count() == 9 and pg.evaluate("[...document.querySelectorAll('#tpad [data-tear]')].map(b=>b.dataset.tear).join()") == 'ul,u,ur,l,b,r,dl,d,dr')
        for code in ['u', 'u', 'u', 'b', 'ur', 'u', 'l']: pg.click(f'[data-tear={code}]'); pg.wait_for_timeout(120)
        T = cur(pg)
        chk('paper: any number of arrows, one per tap', T['paper']['before'] == ['u', 'u', 'u', 'b', 'ur', 'u', 'l'], T.get('paper'))
        chk('paper: tear list', '7 arrows' in pg.inner_text('#tearlist'))
        ht = pg.inner_text('#tearhint')
        chk('paper: tear->fix hint (nock high)', 'Most common tear: Nock high' in ht and 'lower the nocking point or raise the rest' in ht and 'George' not in ht and 'Ryles' not in ht, ht)
        chk('paper: arrow setup collapsed', pg.evaluate("document.querySelector('#tarwcard').tagName=='DETAILS'&&!document.querySelector('#tarwcard').open"))
        wi = pg.evaluate("[...document.querySelectorAll('#wi option')].map(o=>o.textContent)")
        chk('paper compound list', 'Rest up/down' in wi and 'Yoke twists (cam lean)' in wi and 'Plunger in/out (centre shot)' not in wi, wi)
        shot(pg, '02-paper-keypad.png')
        pg.click('#tun'); pg.wait_for_timeout(200)
        chk('paper: undo', cur(pg)['paper']['before'][-1] == 'u')
        pg.click('[data-bt=r]'); pg.wait_for_timeout(300)
        wi = pg.evaluate("[...document.querySelectorAll('#wi option')].map(o=>o.textContent)")
        chk('paper recurve list', 'Plunger in/out (centre shot)' in wi and 'Tiller' in wi and 'Rest up/down' not in wi, wi)
        pg.select_option('#wi', label='Plunger spring tension'); pg.wait_for_timeout(100)
        chk('direction follows item', pg.evaluate("[...document.querySelectorAll('#wd option')].map(o=>o.textContent)") == ['More tension', 'Less tension'])
        pg.select_option('#wd', 'Less tension'); pg.fill('#wa', '1/8 turn'); pg.fill('#wn', 'after nock-left tears'); pg.click('#wadd'); pg.wait_for_timeout(300)
        ch = cur(pg)['changes']
        chk('change saved', len(ch) == 1 and ch[0]['item'] == 'Plunger spring tension' and ch[0]['dir'] == 'Less tension' and ch[0]['amt'] == '1/8 turn' and ch[0]['note'] == 'after nock-left tears' and ch[0]['bt'] == 'r', ch)
        pg.locator('#whatcard').scroll_into_view_if_needed(); shot(pg, '03-what-i-changed.png')
        pg.click('[data-bt=c]'); pg.wait_for_timeout(200)
        [pg.click('[data-tear=r]') for _ in range(6)]; pg.wait_for_timeout(200)
        ht = pg.inner_text('#tearhint')
        chk('compound nock-right hint: rest left (Easton) or yoke', 'Nock right' in ht and 'move the rest to the left' in ht and 'yoke' in ht.lower(), ht)
        # torque: left end + right end, What I changed, then both ends again
        start(pg, 'Torque tune')
        chk('Torque tune: vertical line', pg.get_attribute('#tface', 'data-lines') == 'v' and pg.get_attribute('#tface', 'data-sides') == '1')
        chk('Torque tune: Torqued left and Torqued right', pg.locator('[data-side=L]').count() == 1 and pg.locator('[data-side=R]').count() == 1 and 'Torqued left' in pg.inner_text('#app') and 'Torqued right' in pg.inner_text('#app'))
        chk('Torque tune: Before and After', pg.locator('[data-g=before]').count() == 1 and pg.locator('[data-g=after]').count() == 1)
        chk('Torque tune: What I changed sits between the plot and the left-vs-right stats', pg.evaluate("(() => {const a=document.querySelector('#tface'),b=document.querySelector('#whatcard'),c=document.querySelector('#tqafter');return !!(a&&b&&c) && !!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING) && !!(b.compareDocumentPosition(c)&Node.DOCUMENT_POSITION_FOLLOWING)})()"))
        for fx, fy in [(0.35, 0.45), (0.33, 0.50), (0.36, 0.52)]: tap(pg, fx, fy)
        Tq = cur(pg)
        chk('torque: 3 before left', (((Tq.get('torque') or {}).get('before') or {}).get('L') or []).__len__() == 3, Tq.get('torque'))
        pg.click('[data-side=R]'); pg.wait_for_timeout(200)
        for fx, fy in [(0.65, 0.45), (0.67, 0.50), (0.64, 0.52)]: tap(pg, fx, fy)
        Tq = cur(pg)
        chk('torque: 3 before right, left kept', len(Tq['torque']['before']['L']) == 3 and len(Tq['torque']['before']['R']) == 3, Tq['torque'])
        st = pg.inner_text('#tqstats')
        chk('torque: four stats rows', 'Before · Torqued left' in st and 'Before · Torqued right' in st and 'After · Torqued left' in st and 'After · Torqued right' in st, st)
        v = pg.inner_text('#torqueverdict')
        chk('torque: before verdict asks for change then After', 'Log what you changed' in v and 'George' not in v and 'Ryles' not in v, v)
        pg.locator('#whatcard').scroll_into_view_if_needed(); pg.click('#wadd'); pg.wait_for_timeout(200)
        chk('torque: a change can be logged between Before and After', len(cur(pg).get('changes') or []) >= 1)
        pg.click('[data-g=after]'); pg.wait_for_timeout(200)
        pg.click('[data-side=L]'); pg.wait_for_timeout(150)
        for fx, fy in [(0.47, 0.45), (0.48, 0.50), (0.46, 0.52)]: tap(pg, fx, fy)
        pg.click('[data-side=R]'); pg.wait_for_timeout(150)
        for fx, fy in [(0.53, 0.45), (0.54, 0.50), (0.52, 0.52)]: tap(pg, fx, fy)
        Tq = cur(pg)
        chk('torque: after both sides plotted', len(Tq['torque']['after']['L']) == 3 and len(Tq['torque']['after']['R']) == 3, Tq['torque'])
        chk('torque: points are not stored on the old before/after lists', Tq.get('before') == [] and Tq.get('after') == [], Tq)
        v = pg.inner_text('#torqueverdict')
        chk('torque: after verdict closer together or on the line', ('closer together' in v or 'sit on the line' in v) and 'George' not in v and 'Ryles' not in v, v)
        chk('torque: hint has no George', 'George' not in pg.inner_text('#app') and 'Ryles' not in pg.inner_text('#app') and 'torqued left' in pg.inner_text('#app').lower())
        pg.locator('#tface').scroll_into_view_if_needed(); shot(pg, '04-torque.png')
        for tune, lines, fn in [('Dudley / yoke tune', 'h', '05-dudley.png'), ('Group tune', 'vh', '06-group.png')]:
            start(pg, tune); chk(f'{tune}: crosshair lines={lines}', pg.get_attribute('#tface', 'data-lines') == lines)
            tap(pg, 0.6, 0.45); tap(pg, 0.55, 0.5); tap(pg, 0.62, 0.52)
            chk(f'{tune}: plotted 3', len(cur(pg)['before']) == 3)
            if tune == 'Dudley / yoke tune':
                wi = pg.evaluate("[...document.querySelectorAll('#wi option')].map(o=>o.textContent)")
                chk('Dudley list: sight, rest, yoke; no George marks', wi[0].startswith('Sight left/right') and wi[1].startswith('Arrow rest left/right') and any('Yoke twists' in x for x in wi) and not any('George' in x or 'Ryles' in x for x in wi), wi)
            shot(pg, fn)
        # walk-back
        start(pg, 'Walk-back')
        wt = pg.inner_text('#walkeaston')
        chk('walk-back: Easton plunger note', 'no walk-back test' in wt and 'p. 12' in wt and 'spring tension only' in wt, wt)
        pg.locator('#walkeaston').scroll_into_view_if_needed(); shot(pg, '07-walkback.png')
        # bare shaft verdict
        start(pg, 'Bare shaft vs fletched')
        for fx, fy in [(0.5, 0.5), (0.52, 0.49), (0.49, 0.52)]: tap(pg, fx, fy)
        pg.click('[data-g=after]'); pg.wait_for_timeout(200)
        for fx, fy in [(0.75, 0.5), (0.77, 0.52)]: tap(pg, fx, fy)
        v = pg.inner_text('#bareverdict')
        chk('bare: plain verdict + next step', 'Verdict:' in v and 'weak' in v and 'Usual next step' in v, v)
        chk('bare: crosshair both lines', pg.get_attribute('#tface', 'data-lines') == 'vh')
        shot(pg, '08-bare-verdict.png')
        # old face session opens and is unchanged
        pg.evaluate("S._tuneId='t1700000000000';save();nav('lab_opt')"); pg.wait_for_timeout(400)
        chk('old face session opens on the crosshair', pg.locator('#tface').count() == 1 and '40cm' in pg.inner_text('#app'))
        o = pg.evaluate("JSON.parse(JSON.stringify(S.tune.find(t=>t.id=='t1700000000000')))")
        chk('old session not rewritten', o == OLD, o)
        # delete with confirm
        opt(pg); n0 = pg.evaluate("S.tune.length")
        chk('past sessions have delete', pg.locator('[data-tdel]').count() == n0)
        pg.locator('#tpast').scroll_into_view_if_needed(); shot(pg, '09-past-sessions.png')
        pg.once('dialog', lambda d: d.dismiss()); pg.locator('[data-tdel]').first.click(); pg.wait_for_timeout(300)
        chk('cancel keeps it', pg.evaluate("S.tune.length") == n0)
        msg = []
        pg.once('dialog', lambda d: (msg.append(d.message), d.accept())); pg.locator('[data-tdel=t1700000000000]').click(); pg.wait_for_timeout(300)
        chk('confirm deletes only that one', pg.evaluate("S.tune.length") == n0 - 1 and not pg.evaluate("S.tune.some(t=>t.id=='t1700000000000')") and 'Old face session' in (msg[0] if msg else ''), msg)
        # Arrow chooser AC1-AC5 still present, bow fixed there too
        pg.evaluate("nav('lab_chooser')"); pg.wait_for_timeout(800); t = pg.inner_text('#app')
        chk('AC1: chooser uses the saved bow (Concept X 40)', 'Concept X 40' in pg.inner_text('#ac_mybow') and 'Concept X 37' not in pg.inner_text('#ac_mybow'))
        chk('AC3: shortest safe cut helper', 'Shortest safe cut' in t)
        ft = pg.evaluate("(document.querySelector('#acfletch')||{}).textContent||''")
        chk('AC5: fletching suggestion, not from Park', 'Fletching suggestion' in ft and 'Not from Dr Park' in ft, ft[:120])
        chk('AC2: Easton parts listed', 'Easton' in t)
        # Tune helper: setup first, then steps in Coach's order, compound / recurve toggle
        pg.evaluate("nav('lab_tune')"); pg.wait_for_timeout(400)
        th = pg.inner_text('#tunehelper')
        chk('helper: compound default', pg.locator('[data-thbt=c][aria-pressed=true]').count() == 1)
        steps = pg.evaluate("[...document.querySelectorAll('#thsteps b')].map(b=>b.textContent)")
        chk('helper: compound order', steps == ['1. Bow setup', '2. Draw weight / spine', '3. Cut length', '4. Paper', '5. Node / nocking point', '6. Bare shaft', '7. Creep', '8. Torque', '9. Dudley'], steps)
        chk('helper: compound has no George', 'George' not in th and 'Ryles' not in th)
        pg.locator('#tunehelper').scroll_into_view_if_needed(); shot(pg, '10-tunehelper-compound.png')
        pg.click('[data-tn=paper]'); pg.wait_for_timeout(400)
        chk('helper: Paper opens the Paper tune form', pg.locator('#tc').count() == 1 and pg.input_value('#tc') == 'Paper tune')
        pg.evaluate("nav('lab_tune')"); pg.wait_for_timeout(300)
        pg.click('[data-thbt=r]'); pg.wait_for_timeout(300)
        steps = pg.evaluate("[...document.querySelectorAll('#thsteps b')].map(b=>b.textContent)")
        chk('helper: recurve order', steps == ['1. Bow setup', '2. Draw weight / spine', '3. Cut length', '4. Paper (optional)', '5. Bare shaft', '6. Node / nocking point', '7. Walk-back', '8. Plunger spring / group tune'], steps)
        th = pg.inner_text('#tunehelper')
        chk('helper: recurve steps omit Torque and Dudley; creep is a form note', all('Torque' not in s and 'Dudley' not in s for s in steps) and 'form note' in th.lower() and 'George' not in th and 'Ryles' not in th, steps)
        pg.locator('#tunehelper').scroll_into_view_if_needed(); shot(pg, '11-tunehelper-recurve.png')
        pg.click('[data-tn=walk]'); pg.wait_for_timeout(400)
        chk('helper: Walk-back opens the Walk-back form', pg.locator('#tc').count() == 1 and pg.input_value('#tc') == 'Walk-back')
        pg.evaluate("nav('lab_tune')"); pg.wait_for_timeout(300)
        chk('helper: recurve toggle remembered', pg.locator('[data-thbt=r][aria-pressed=true]').count() == 1)
        chk('Lingkana keys untouched', pg.evaluate(LK) == lk0)
        for fn in ('lab.js','lab.css','tune.js','arrowchooser.js'):
            txt=open(os.path.join(ROOT,fn),encoding='utf-8').read().lower()
            chk(fn+': no George/Ryles', 'george' not in txt and 'ryles' not in txt)

        chk('no page errors', not errs, errs)
        b.close()
finally:
    if srv: srv.terminate()
print(f'\n{len(ok)} passed, {len(bad)} failed')
sys.exit(1 if bad else 0)
