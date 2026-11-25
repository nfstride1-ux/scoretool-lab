# Group score order: every end starts at archer 1 in the scorecard order.
# Lingkana (2 and 3 archers, 3 ends, including a reload mid-card), the shared-phone league card,
# and a casual group. 390px. Stubs the relay.
import os, sys, time, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import guard
import freeport
from playwright.sync_api import sync_playwright

ok, bad = [], []
def chk(n, c, extra=''):
    (ok if c else bad).append(n)
    print(('PASS ' if c else 'FAIL ') + n + (('  ' + extra) if extra and not c else ''), flush=True)

PORT = freeport.get()
BASE = f'http://127.0.0.1:{PORT}'
SHOT = Path('/opt/cursor/artifacts')
SHOT.mkdir(parents=True, exist_ok=True)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT)], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.4)

def archer(page):
    return page.locator('#lgentry .ad-left .ad-box b').first.inner_text().strip()

def end_label(page):
    return page.locator('#endno').inner_text().strip()

def shoot_lk(page):
    for k in ('10', '9', '8'):
        page.locator('#lgentry [data-lgk="%s"]' % k).click()
        page.wait_for_timeout(40)
    page.locator('#enext').wait_for(state='visible', timeout=4000)
    page.wait_for_function("() => { const b=document.querySelector('#enext'); return b && !b.disabled }")
    page.locator('#enext').click()
    page.wait_for_timeout(120)

def card_name(name):
    # The host's registration is stored as Nathaniel Stride. A score card shows that name.
    return 'Nathaniel Stride' if name == 'Nathe' else name

def expect_turn(page, names, e, i, tag):
    page.wait_for_selector('#endno', timeout=5000)
    got, hdr = archer(page), end_label(page)
    want = card_name(names[i])
    chk('%s end %d archer %d is %s' % (tag, e, i + 1, want),
        got == want and hdr.startswith('End %d ' % e), '%s / %s' % (got, hdr))
    return got, hdr

def seed_lk(page, names):
    return page.evaluate("""async (names) => {
      const lg = lkEnsure();
      const ids = [];
      for (const name of names) {
        const r = lkApplyReg({name, at: Date.now() + ids.length}, lg);
        ids.push(r.id);
        const salt = lkPinSalt();
        const hash = await lkPinHash(name, '1234', salt);
        lkSetPin(lg, r.id, name, hash, salt);
      }
      const night = (typeof LK_DATES !== 'undefined' && LK_DATES[0]) || '2026-11-18';
      lg.paid = lg.paid || {}; lg.paid[night] = {};
      ids.forEach(id => { lg.paid[night][id] = 1 });
      lg.grp = lg.grp || {}; lg.grp[1] = {t: Date.now(), g: [ids.slice()]};
      lg.sc = {};
      lg.dirty = 1; save();
      sessionStorage.setItem('scoretool.lk.auth', 'LINGKN26');
      sessionStorage.setItem('scoretool.lk.scorerId', ids[0]);
      sessionStorage.setItem('scoretool.lk.scorer', names[0]);
      sessionStorage.setItem('scoretool.lk.night', '1');
      window._lkAuthed = 'LINGKN26';
      window._lkFlowNight = 1;
      window._lkScoreIds = ids.slice();
      window._lkPicked = ids.slice();
      window._lgE = {code: lg.code, w: 1, ids: ids.slice()};
      window._lgAct = ids[0];
      window._lgHold = null;
      window._lkScoreMode = null;
      window._csFx = null;
      return {ids, names: ids.map(id => (typeof lgName === 'function' && lgName(id)) || id)};
    }""", names)

def open_lk(page):
    page.evaluate("""() => {
      window._lgHold = null; window._csFx = null; window._lkScoreMode = null;
      lkFlowScore();
    }""")

def resume_lk(page):
    page.reload(wait_until='domcontentloaded')
    page.wait_for_selector('#lkresume', timeout=8000)
    page.locator('#lkresume').click()
    page.wait_for_selector('#lgentry, #addsc', timeout=5000)

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome',
                              args=['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'])
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        page = ctx.new_page()
        page.on('dialog', lambda d: d.accept())
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)[:200]))
        page.goto(f'{BASE}/?tester=steven#lk-home', wait_until='domcontentloaded')
        page.wait_for_selector('#lkhome', timeout=8000)
        page.evaluate("""() => { S.unlocked=true; if(!S.profile)S.profile='Sam Archer'; save(); localStorage.setItem('scoretool.whatsnew.seen','v2099'); }""")

        two = ['Nate', 'Nathe']
        seeded = seed_lk(page, two)
        chk('scorecard order is Nate then Nathe', seeded['names'] == two, str(seeded))
        open_lk(page)
        # End 1 in order, then reload on the sheet and again mid-arrow and mid-wave.
        for i, name in enumerate(two):
            expect_turn(page, two, 1, i, 'live')
            shoot_lk(page)
        page.wait_for_selector('#addsc', timeout=4000)
        chk('end 1 finishes on the group sheet', page.locator('#lksheet').count() == 1)
        resume_lk(page)
        page.wait_for_selector('#addsc', timeout=4000)
        page.locator('#addsc').click()
        page.wait_for_timeout(150)
        expect_turn(page, two, 2, 0, 'reload between ends')
        page.locator('#lgentry .ad-left').scroll_into_view_if_needed()
        page.screenshot(path=str(SHOT / 'lingkana-group-end2-390.png'))
        page.locator('#lgentry [data-lgk="10"]').click()
        page.wait_for_timeout(80)
        resume_lk(page)
        page.wait_for_selector('#endno', timeout=5000)
        partial = page.evaluate("""() => {
          const lg = lkEnsure();
          const id = (window._lkScoreIds || [])[0];
          const e = ((lg.sc || {})[id] || {})[1] || {e: []};
          const last = (e.e || [])[(e.e || []).length - 1] || [];
          return {who: (document.querySelector('#lgentry .ad-left .ad-box b') || {}).textContent || '',
                  end: (document.querySelector('#endno') || {}).textContent || '',
                  arrows: last.slice()};
        }""")
        chk('reload mid-arrow stays on Nate, end 2, with the arrow kept',
            partial.get('who', '').strip() == 'Nate' and 'End 2' in partial.get('end', '') and partial.get('arrows') == ['10'],
            str(partial))
        for k in ('9', '8'):
            page.locator('#lgentry [data-lgk="%s"]' % k).click()
            page.wait_for_timeout(40)
        page.locator('#enext').click()
        page.wait_for_timeout(150)
        expect_turn(page, two, 2, 1, 'live')
        resume_lk(page)
        page.wait_for_selector('#endno', timeout=5000)
        chk('reload before the second archer of the end opens Nathaniel Stride',
            archer(page) == 'Nathaniel Stride' and end_label(page).startswith('End 2'))
        shoot_lk(page)
        page.wait_for_selector('#addsc', timeout=4000)
        page.locator('#addsc').click()
        page.wait_for_timeout(150)
        expect_turn(page, two, 3, 0, 'live')
        page.locator('#lgentry .ad-left').scroll_into_view_if_needed()
        page.screenshot(path=str(SHOT / 'lingkana-group-end3-390.png'))
        shoot_lk(page)
        expect_turn(page, two, 3, 1, 'live')
        shoot_lk(page)

        three = ['Nate', 'Nathe', 'Ada']
        seeded3 = seed_lk(page, three)
        chk('three-archer scorecard order is kept', seeded3['names'] == three, str(seeded3))
        open_lk(page)
        for e in (1, 2):
            for i in range(3):
                expect_turn(page, three, e, i, '3 live')
                shoot_lk(page)
            page.wait_for_selector('#addsc', timeout=4000)
            if e == 2:
                resume_lk(page)
                page.wait_for_selector('#addsc', timeout=4000)
            page.locator('#addsc').click()
            page.wait_for_timeout(150)
        for i in range(3):
            expect_turn(page, three, 3, i, '3 after reload')
            shoot_lk(page)

        # Shared-phone league card and a casual group, same rule.
        lp = ctx.new_page()
        lp.on('dialog', lambda d: d.accept())
        lp.goto(f'{BASE}/?tester=nathe', wait_until='domcontentloaded')
        lp.wait_for_function("() => typeof lgCreate==='function'", timeout=8000)
        lp.evaluate("""() => { S.unlocked=true; if(!S.profile)S.profile='Nathaniel Stride'; delete S.lgNextBtn; save(); localStorage.setItem('scoretool.whatsnew.seen','v2099'); }""")

        def league_card(extras):
            info = lp.evaluate("""(extras) => {
              const me = h2hMe();
              const lg = lgCreate('Order ' + (extras.length + 1), extras, []);
              const ids = [me].concat(extras);
              const set = lgSetGroups(lg.code, 1, [ids]);
              window._lgE = null; window._lgAct = null; window._lgHold = null;
              lgView(lg.code);
              return {code: lg.code, ids, set, groups: lgGroups(lg, 1)};
            }""", extras)
            chk('league group saved in scorecard order', info.get('set') is True and info.get('groups') == [info.get('ids')], str(info))
            lp.wait_for_selector('[data-lgsg="0"]', timeout=5000)
            lp.locator('[data-lgsg="0"]').click()
            lp.wait_for_selector('#lgentry .lc-chip.on', timeout=5000)
            return info

        def chip(page):
            return page.locator('#lgentry .lc-chip.on').get_attribute('data-lgid')

        def shoot_league(page, nxt):
            for k in ('X', '10', '9'):
                page.locator('#lgentry [data-lgk="%s"]' % k).click()
                page.wait_for_timeout(50)
            page.wait_for_function(
                "(id) => { const c=document.querySelector('#lgentry .lc-chip.on'); return c && c.dataset.lgid===id }",
                arg=nxt, timeout=4000)

        for extras in (['logan'], ['logan', 'steven']):
            info = league_card(extras)
            ids = info['ids']
            tag = '%d league' % len(ids)
            for e in range(3):
                for i, aid in enumerate(ids):
                    chk('%s end %d archer %d' % (tag, e + 1, i + 1), chip(lp) == aid, chip(lp))
                    shoot_league(lp, ids[(i + 1) % len(ids)] if i < len(ids) - 1 or e < 2 else ids[0])
            # Second archer is due for end 4's... we are on archer 1 for end 4. Score archer 1's end, then reload before archer 2.
            shoot_league(lp, ids[1])
            lp.reload(wait_until='domcontentloaded')
            lp.wait_for_selector('#tabs', timeout=8000)
            lp.wait_for_timeout(500)
            lp.evaluate("""(code) => { window._lgAct=null; window._lgHold=null; window._lgE=null; lgView(code); }""", info['code'])
            lp.wait_for_selector('[data-lgsg="0"]', timeout=5000)
            lp.locator('[data-lgsg="0"]').click()
            lp.wait_for_selector('#lgentry .lc-chip.on', timeout=5000)
            chk('%s reload mid-card continues with archer 2' % tag, chip(lp) == ids[1], chip(lp))

        casual = lp.evaluate("""() => {
          const cs = csCreate({round:'Vegas 300', self:true, ppl:[{n:'Bea'},{n:'Cee'}]});
          const ids = cs.ppl.map(p => p.id);
          const show = () => (window._csAct && ids.includes(window._csAct)) ? window._csAct : csWavePick(cs, ids);
          const seq = [];
          for (let end=0; end<3; end++) {
            ids.forEach(id => {
              seq.push(ids.indexOf(show()));
              ['X','10','9'].forEach(k => csKey(cs.code, id, k));
            });
          }
          const after = window._csAct;
          window._csAct = null;
          const re = csWavePick(cs, ids);
          const last = ids[ids.length - 1];
          cs.sc[last].e.pop();
          window._csAct = null;
          const mid = csWavePick(cs, ids);
          return {ids, seq, after, re, mid, last};
        }""")
        seq = casual.get('seq') or []
        chk('casual group of 3 keeps archer order for 3 ends and starts the next at archer 1',
            seq == [0, 1, 2, 0, 1, 2, 0, 1, 2] and casual.get('after') == (casual.get('ids') or [None])[0],
            str(casual))
        chk('casual reload with no archer held stays in scorecard order, including mid-card',
            casual.get('re') == (casual.get('ids') or [None])[0] and casual.get('mid') == casual.get('last'),
            str(casual))
        chk('no page errors', not errs, str(errs[:3]))
        b.close()
finally:
    srv.terminate()

print('\n%d passed, %d failed' % (len(ok), len(bad)))
if bad:
    print('FAILED:')
    for n in bad:
        print(' ', n)
    sys.exit(1)
