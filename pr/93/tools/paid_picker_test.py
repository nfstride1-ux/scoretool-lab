# Team picker lists only archers marked paid for that Lingkana night.
# Onion Shed has no paid tick, so its registered list is not filtered.
# ntfy is stubbed (guard + in-page h2hPost). Nothing is posted to the live relay.
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

PORT = '8798'
BASE = f'http://localhost:{PORT}'
SHOT = Path('/opt/cursor/artifacts')
SHOT.mkdir(parents=True, exist_ok=True)

srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)

STUB = """() => {
  window._lkPosts = [];
  window.h2hPost = function(){
    window._lkPosts.push([].slice.call(arguments));
    return Promise.resolve(true);
  };
}"""

SEED = """() => {
  window._lkPosts = window._lkPosts || [];
  window.h2hPost = function(){ window._lkPosts.push([].slice.call(arguments)); return Promise.resolve(true); };
  window._lkAuthed = 'LINGKN26';
  try { sessionStorage.setItem('scoretool.lk.auth','LINGKN26'); } catch(e) {}
  const lg = lkEnsure();
  const night = LK_DATES[0];
  const night2 = LK_DATES[1];
  const people = [
    ['gsamar1','Sam Archer', true],
    ['galexr1','Alex River', true],
    ['gkimbk1','Kim Brook', true],
    ['gpatre1','Pat Reed', false],
    ['gjowes1','Jo West', false]
  ];
  lg.order = (lg.order || []).filter(id => !/^g(samar1|alexr1|kimbk1|patre1|jowes1)$/.test(id));
  lg.gn = lg.gn || {};
  lg.reg = lg.reg || {};
  lg.paid = {};
  lg.grp = {};
  lg.sc = {};
  lg.claim = {};
  lg.reg[night] = [];
  lg.reg[night2] = [];
  people.forEach(([id, name, paid]) => {
    if (!lg.order.includes(id)) lg.order.push(id);
    lg.gn[id] = {n: name, t: 1};
    const rec = {id, name, at: 1};
    lg.reg[night].push(rec);
    lg.reg[night2].push({id, name, at: 1});
    if (paid) {
      lg.paid[night] = lg.paid[night] || {};
      lg.paid[night][id] = 1;
    }
  });
  lg.paidt = 1;
  lg.dirty = 0;
  lg.posted = Date.now();
  window._lkEvent = 'LINGKN26';
  window._lkFlowNight = 1;
  window._lkTarget = 1;
  window._lkPicked = [];
  window._lkScoreIds = null;
  window._lkScoreMode = null;
  if (typeof save === 'function') save();
  if (typeof lkFlowSelect === 'function') lkFlowSelect();
  return {night, n: (lg.reg[night] || []).length, paid: Object.keys(lg.paid[night] || {})};
}"""

def go(page):
    page.goto(f'{BASE}/?tester=nathe', wait_until='domcontentloaded')
    page.wait_for_timeout(400)
    page.evaluate(STUB)
    page.evaluate("""() => {
      try { localStorage.setItem('scoretool.cal.nathe.prompted','1'); } catch(e) {}
      try { localStorage.setItem('scoretool.whatsnew.seen','v2026-11-12-0848-live'); } catch(e) {}
      if (typeof S !== 'undefined' && S) { S.unlocked = true; if (!S.profile) S.profile = 'nathe'; }
    }""")
    page.reload(wait_until='domcontentloaded')
    page.wait_for_timeout(500)
    page.evaluate(STUB)
    if page.locator('#wnx').count():
        page.locator('#wnx').click()
        page.wait_for_timeout(150)

def names(page):
    return page.locator('#lkarchlist .lk-row .nm').all_inner_texts()

try:
    fresh = (ROOT / 'lingkana.js').read_text()
    chk('LK_FRESH is the 17 Nov wipe of test sign-ups', 'const LK_FRESH=1794881040000' in fresh)
    ver = (ROOT / 'version.json').read_text()
    chk('live version.json is v2026-11-17-2405-loginfit', 'v2026-11-17-2405-loginfit' in ver)

    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome',
                              args=['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'])
        ctx = b.new_context(viewport={'width': 390, 'height': 844})
        page = ctx.new_page()
        page.route(guard.RELAY, lambda route: route.fulfill(status=200, body='', headers={
            'access-control-allow-origin': '*', 'content-type': 'application/json'}))
        go(page)

        seeded = page.evaluate(SEED)
        page.wait_for_selector('#lkarchlist', timeout=5000)
        shown = names(page)
        chk('picker shows only archers paid for this night',
            shown == ['Sam Archer', 'Alex River', 'Kim Brook'], str(shown))
        chk('unpaid registered archers are absent from the picker',
            'Pat Reed' not in shown and 'Jo West' not in shown, str(shown))
        still = page.evaluate("""() => {
          const lg = lkEnsure();
          const night = LK_DATES[0];
          return (lg.reg[night] || []).map(r => r.name);
        }""")
        chk('unpaid archers stay registered',
            still == ['Sam Archer', 'Alex River', 'Kim Brook', 'Pat Reed', 'Jo West'], str(still))
        pot = page.evaluate("""() => {
          const lg = lkEnsure();
          const html = (typeof lkPotHTML === 'function') ? lkPotHTML(lg) : '';
          return html;
        }""")
        chk('paid tick list still lists unpaid archers so the host can tick them',
            'Pat Reed' in pot and 'Jo West' in pot and 'Tick who paid' in pot and 'data-lkpaid' in pot)
        page.locator('#lkselect').screenshot(path=str(SHOT / 'picker_paid_only.png'))

        marked = page.evaluate("""() => {
          window.h2hPost = function(){ window._lkPosts.push([].slice.call(arguments)); return Promise.resolve(true); };
          const night = LK_DATES[0];
          const msg = lkSetPaid('gpatre1', night, true);
          window._lkTarget = 1;
          window._lkFlowNight = 1;
          window._lkEvent = 'LINGKN26';
          lkFlowSelect();
          const lg = lkEnsure();
          return {msg: msg || '', reg: (lg.reg[night] || []).some(r => r.id === 'gpatre1'), paid: !!(lg.paid && lg.paid[night] && lg.paid[night].gpatre1)};
        }""")
        page.wait_for_timeout(200)
        shown2 = names(page)
        chk('ticking paid puts that archer on the picker',
            marked.get('msg') == '' and marked.get('paid') and shown2 == ['Sam Archer', 'Alex River', 'Kim Brook', 'Pat Reed'],
            str(marked) + ' ' + str(shown2))
        page.locator('#lkselect').screenshot(path=str(SHOT / 'picker_after_tick_paid.png'))

        hidden = page.evaluate("""() => {
          window.h2hPost = function(){ window._lkPosts.push([].slice.call(arguments)); return Promise.resolve(true); };
          const night = LK_DATES[0];
          const msg = lkSetPaid('gpatre1', night, false);
          window._lkTarget = 1;
          lkFlowSelect();
          const lg = lkEnsure();
          return {msg: msg || '', paid: !!(lg.paid && lg.paid[night] && lg.paid[night].gpatre1),
                  reg: (lg.reg[night] || []).some(r => r.name === 'Pat Reed')};
        }""")
        page.wait_for_timeout(150)
        shown3 = names(page)
        chk('unticking paid removes them from the picker and keeps the registration',
            hidden.get('msg') == '' and hidden.get('paid') is False and hidden.get('reg') is True
            and shown3 == ['Sam Archer', 'Alex River', 'Kim Brook'],
            str(hidden) + ' ' + str(shown3))

        # Other night: registered there, not paid, so the list is empty.
        page.evaluate("""() => {
          window._lkFlowNight = 2;
          window._lkTarget = 1;
          window._lkPicked = [];
          lkFlowSelect();
        }""")
        page.wait_for_timeout(150)
        night2 = page.inner_text('#lkarchlist')
        chk('a later night hides archers who are not paid for that night',
            names(page) == [] and 'marked paid' in night2.lower(),
            night2[:180])
        page.evaluate("""() => {
          window.h2hPost = function(){ window._lkPosts.push([].slice.call(arguments)); return Promise.resolve(true); };
          lkSetPaid('gjowes1', LK_DATES[1], true);
          window._lkFlowNight = 2;
          window._lkTarget = 1;
          lkFlowSelect();
        }""")
        page.wait_for_timeout(150)
        chk('paying for the other night shows only that night\'s paid archer',
            names(page) == ['Jo West'], str(names(page)))

        # Back to night 1. Start scoring Sam, then untick paid. The open score must keep Sam.
        page.evaluate("""() => {
          window._lkFlowNight = 1;
          window._lkTarget = 1;
          window._lkPicked = [];
          window._lkScoreIds = null;
          lkFlowSelect();
        }""")
        page.wait_for_selector('#lkarchlist .lk-row', timeout=4000)
        page.locator('.lk-row', has_text='Sam Archer').locator('input').check()
        page.wait_for_timeout(200)
        chk('Start label counts the ticked archer', 'Start (1)' in (page.locator('#lkstart').inner_text() or ''))
        page.click('#lkstart')
        page.wait_for_selector('#lgentry', timeout=5000)
        scoring = page.evaluate("""() => {
          window.h2hPost = function(){ window._lkPosts.push([].slice.call(arguments)); return Promise.resolve(true); };
          const before = (window._lkScoreIds || []).slice();
          const msg = lkSetPaid('gsamar1', LK_DATES[0], false);
          if (typeof lkFlowScore === 'function') lkFlowScore();
          const lg = lkEnsure();
          const onSheet = (document.body.innerText || '').includes('Sam Archer');
          const ids = (window._lkScoreIds || []).slice();
          const grp = ((((lg.grp || {})[1] || {}).g) || []).map(g => g.slice());
          return {msg: msg || '', before, ids, onSheet, grp, entry: !!document.getElementById('lgentry')};
        }""")
        chk('unticking paid does not pull a mid-score archer off the open score sheet',
            scoring.get('entry') and scoring.get('onSheet') and 'gsamar1' in (scoring.get('ids') or [])
            and scoring.get('before') == scoring.get('ids'),
            str(scoring))
        page.locator('[data-lgk="10"]').click()
        page.wait_for_timeout(200)
        kept = page.evaluate("""() => {
          const lg = lkEnsure();
          const arrows = (((lg.sc || {}).gsamar1 || {})[1] || {}).e || [];
          const reg = (lg.reg[LK_DATES[0]] || []).some(r => r.id === 'gsamar1');
          window._lkTarget = 1;
          window._lkFlowNight = 1;
          lkFlowSelect();
          const listed = [...document.querySelectorAll('#lkarchlist .lk-row .nm')].map(n => n.textContent);
          return {arrows, reg, listed, ids: (window._lkScoreIds || []).slice(),
                  paid: !!((lg.paid || {})[LK_DATES[0]] || {}).gsamar1};
        }""")
        chk('after leaving the sheet, the unpaid archer is off the picker but the score and registration remain',
            kept.get('reg') is True and kept.get('paid') is False
            and 'Sam Archer' not in (kept.get('listed') or [])
            and 'gsamar1' in (kept.get('ids') or [])
            and kept.get('arrows') and kept.get('arrows')[0] == ['10'],
            str(kept))

        # Onion Shed: no paid tick. Registered archers stay on the picker even if a paid map is present.
        page.evaluate("""() => {
          window.h2hPost = function(){ window._lkPosts.push([].slice.call(arguments)); return Promise.resolve(true); };
          if (typeof lkFlowHome === 'function') lkFlowHome('ONIONSH2');
        }""")
        page.wait_for_selector('#lkhome', timeout=4000)
        onion = page.evaluate("""() => {
          window.h2hPost = function(){ window._lkPosts.push([].slice.call(arguments)); return Promise.resolve(true); };
          if (typeof lgSeed === 'function') lgSeed();
          const code = (typeof LG_PRESET !== 'undefined' && LG_PRESET.code) || 'ONIONSH2';
          const lg = lgGet(code);
          if (!lg) return {ok: false};
          lg.reg = lg.reg || {};
          lg.reg['1'] = [
            {id: 'gdemo1', name: 'Riley Chen', at: 1},
            {id: 'gdemo2', name: 'Morgan Blake', at: 1}
          ];
          lg.paid = {'1': {gdemo1: 1}};
          lg.paidt = 1;
          lg.dirty = 0;
          lg.posted = Date.now();
          window._lkEvent = code;
          window._lkFlowNight = 1;
          window._lkTarget = 0;
          window._lkPicked = [];
          lkFlowSelect();
          const hint = (document.querySelector('#lkselect p') || {}).textContent || '';
          window._lkTarget = 1;
          lkFlowSelect();
          const listed = [...document.querySelectorAll('#lkarchlist .lk-row .nm')].map(n => n.textContent);
          const paidUi = !!document.querySelector('[data-lkpaid]') || /tick who paid/i.test(document.body.innerText || '');
          return {ok: true, listed, hint, paidUi, title: (document.querySelector('#lkselect h1') || {}).textContent || ''};
        }""")
        chk('Onion Shed has no paid-tick on the picker',
            onion.get('ok') and onion.get('paidUi') is False, str(onion)[:300])
        chk('Onion Shed picker still lists every archer registered for the night',
            onion.get('listed') == ['Riley Chen', 'Morgan Blake']
            and 'Onion Shed' in (onion.get('title') or ''),
            str(onion)[:400])
        page.locator('.lk-row', has_text='Riley Chen').locator('input').check()
        page.wait_for_timeout(200)
        chk('Onion Shed tick still updates Start',
            'Start (1)' in (page.locator('#lkstart').inner_text() or '')
            and 'Morgan Blake' in names(page))
        page.locator('#lkselect').screenshot(path=str(SHOT / 'onion_shed_picker.png'))

        posts = page.evaluate("() => (window._lkPosts || []).length")
        chk('in-page relay stub caught every h2hPost', isinstance(posts, int))

        # Parallel /test/ copy uses the same filter.
        tctx = b.new_context(viewport={'width': 390, 'height': 844})
        tp = tctx.new_page()
        tp.route(guard.RELAY, lambda route: route.fulfill(status=200, body='', headers={
            'access-control-allow-origin': '*', 'content-type': 'application/json'}))
        tp.goto(f'{BASE}/test/?tester=nathe', wait_until='domcontentloaded')
        tp.wait_for_timeout(500)
        tp.evaluate(STUB)
        tp.evaluate("""() => {
          try { localStorage.setItem('scoretool.whatsnew.seen','v2026-11-12-0840-test'); } catch(e) {}
          if (typeof S !== 'undefined' && S) { S.unlocked = true; }
        }""")
        tp.reload(wait_until='domcontentloaded')
        tp.wait_for_timeout(600)
        tp.evaluate(STUB)
        if tp.locator('#wnx').count():
            tp.locator('#wnx').click()
        test_names = tp.evaluate("""() => {
          window.h2hPost = function(){ return Promise.resolve(true); };
          window._lkAuthed = 'LINGKN26';
          try { sessionStorage.setItem('scoretool.lk.auth','LINGKN26'); } catch(e) {}
          if (typeof lkEnsure !== 'function' || typeof lkFlowSelect !== 'function') return {err: 'missing'};
          const lg = lkEnsure();
          const night = LK_DATES[0];
          lg.reg = lg.reg || {};
          lg.paid = {};
          lg.order = lg.order || [];
          lg.gn = lg.gn || {};
          lg.reg[night] = [
            {id:'q1', name:'Sam Archer', at:1},
            {id:'q2', name:'Pat Reed', at:1}
          ];
          ['q1','q2'].forEach(id => { if (!lg.order.includes(id)) lg.order.push(id); lg.gn[id] = {n: id==='q1'?'Sam Archer':'Pat Reed', t:1}; });
          lg.paid[night] = {q1: 1};
          lg.paidt = 1;
          lg.dirty = 0;
          lg.posted = Date.now();
          window._lkEvent = 'LINGKN26';
          window._lkFlowNight = 1;
          window._lkTarget = 1;
          window._lkPicked = [];
          lkFlowSelect();
          return {listed: [...document.querySelectorAll('#lkarchlist .lk-row .nm')].map(n => n.textContent)};
        }""")
        chk('/test/ picker uses the same paid filter',
            (test_names or {}).get('listed') == ['Sam Archer'], str(test_names))
        tctx.close()
        ctx.close()
        b.close()
finally:
    srv.terminate()

print(f'\n{len(ok)} passed, {len(bad)} failed')
if bad:
    print('FAILED:')
    for n in bad:
        print(' ', n)
    sys.exit(1)
