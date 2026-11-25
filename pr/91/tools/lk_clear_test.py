# One-time go-live clear. Test registrations, scores, groups, pins, payments, tombstones and
# stale snapshots go. Nathaniel Stride and Nate Evans stay on every shoot night. A second pass
# keeps scores entered after the clear, which is Wednesday's real night.
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

PORT = '8893'
BASE = f'http://localhost:{PORT}'
SHOT = Path('/opt/cursor/artifacts')
SHOT.mkdir(parents=True, exist_ok=True)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)

WIPE = r"""
() => {
  const lg = lkEnsure();
  lg.clear = 0;
  lg.fresh = LK_FRESH;
  lg.sc = {gada:{1:{e:[['10','10','10']], u:1, by:'nathe', f:'vert'}}};
  lg.reg = {'2026-11-18':[{id:'gada', name:'Ada Archer', at:LK_FRESH+5, bow:'Recurve', pinHash:'hh', pinSalt:'ss', pinAt:1}]};
  lg.claim = {gada:{n:'Ada Archer'}};
  lg.claimt = 9;
  lg.gn = {gada:{n:'Ada Archer', t:1}};
  lg.paid = {'2026-11-18':{gada:1}};
  lg.paidt = 9;
  lg.grp = {1:{t:1, g:[['gada']]}};
  lg.inv = ['gone'];
  lg.drop = {gother:{n:'Old Name', t:5}};
  lg.pins = {gada:{pinHash:'hh', pinSalt:'ss', pinAt:1, name:'Ada Archer'}};
  lg.order = ['gada'];
  lg.fin = ['gada'];
  lg.fint = 9;
  lg.since = '99';
  localStorage.setItem('scoretool.lk.reg', JSON.stringify([{name:'Ada Archer', at:1}]));
  localStorage.setItem('scoretool.lk.mine', JSON.stringify(['gada']));
  localStorage.setItem('scoretool.lk.pinlock', JSON.stringify({gada:Date.now()+60000}));
  S.sessions = (S.sessions||[]).filter(s => s && s.id!=='lg-LINGKN26-w1' && s.id!=='keep-me');
  S.sessions.push({id:'lg-LINGKN26-w1', league:'LINGKN26', round:'Lancaster 660', ends:[['10','10','10']]});
  S.sessions.push({id:'keep-me', round:'Vegas 300', ends:[['10']]});
  lkFresh(lg);
  const nights = ['2026-11-18','2026-12-02','2026-12-16','2026-12-30','2027-01-13','2027-01-27'];
  const rows = nights.map(n => (lg.reg[n]||[]).map(r => r && r.name));
  const ids = nights.map(n => (lg.reg[n]||[]).map(r => r && r.id));
  return {
    again: lkClearLive(lg),
    clear: lg.clear, fresh: lg.fresh,
    rows, ids,
    sc: lg.sc, paid: lg.paid, grp: lg.grp, drop: lg.drop, pins: lg.pins, claim: lg.claim, fin: lg.fin, inv: lg.inv,
    regKey: localStorage.getItem('scoretool.lk.reg'),
    mineKey: localStorage.getItem('scoretool.lk.mine'),
    lockKey: localStorage.getItem('scoretool.lk.pinlock'),
    sessions: (S.sessions||[]).map(s => s.id)
  };
}
"""

KEEP = r"""
() => {
  const lg = lkEnsure();
  const nights = ['2026-11-18','2026-12-02','2026-12-16','2026-12-30','2027-01-13','2027-01-27'];
  const nat = (lg.reg[nights[0]]||[]).find(r => r && r.name==='Nathaniel Stride');
  const added = lkApplyReg({name:'Wednesday Archer', at:Date.now(), bow:'Recurve'}, lg);
  const wid = added && added.id;
  lg.sc[nat.id] = {1:{e:[['X','X','X'],['X','10','9']], u:Date.now(), by:'nathe', f:'vert'}};
  lg.paid[nights[0]] = {};
  lg.paid[nights[0]][nat.id] = 1;
  lg.paid[nights[0]][wid] = 1;
  lg.grp[1] = {t:Date.now(), g:[[nat.id, wid]]};
  lg.pins[wid] = {pinHash:'abc', pinSalt:'salt', pinAt:Date.now(), name:'Wednesday Archer'};
  const stamp = {sc: JSON.stringify(lg.sc[nat.id]), paid: lg.paid[nights[0]][wid], grp: lg.grp[1].g[0].slice(), pin: lg.pins[wid].pinHash};
  lkFresh(lg);
  lkFresh(lg);
  const still = nights.every(n => (lg.reg[n]||[]).some(r => r && r.name==='Wednesday Archer'));
  const organisers = nights.every(n => {
    const names = (lg.reg[n]||[]).map(r => r && r.name);
    return names.filter(x => x==='Nathaniel Stride').length===1 && names.filter(x => x==='Nate Evans').length===1;
  });
  const old = lgMerge(lg, {
    k:'ls', code:'LINGKN26', by:'nathe', host:'nathe', format:'lingkana',
    fresh:LK_FRESH, wt:Date.now()+5000, t:Date.now(),
    reg:{'2026-11-18':[{id:'gada', name:'Ada Archer', at:LK_FRESH+20}]},
    sc:{gada:{1:{e:[['10','10','10']], u:Date.now()}}},
    drop:{[wid]:{n:'Wednesday Archer', t:Date.now()}},
    paid:{'2026-11-18':{gada:1}}, paidt:Date.now()
  });
  const names = (lg.reg[nights[0]]||[]).map(r => r.name);
  return {
    still, organisers, old,
    ada: names.includes('Ada Archer'),
    wednesday: names.includes('Wednesday Archer'),
    score: JSON.stringify((lg.sc[nat.id]||{})),
    pin: lg.pins[wid] && lg.pins[wid].pinHash,
    paid: !!(lg.paid[nights[0]] && lg.paid[nights[0]][wid]),
    grp: ((lg.grp[1]||{}).g||[[]])[0],
    stamp, clear: lg.clear
  };
}
"""

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome',
                              args=['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'])
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'{BASE}/?tester=nathe#lk-home', wait_until='networkidle')
        pg.wait_for_timeout(500)
        if pg.locator('#wnx').count():
            pg.locator('#wnx').click()
            pg.wait_for_timeout(150)
        w = pg.evaluate(WIPE)
        only = all(sorted(row)==['Nate Evans','Nathaniel Stride'] for row in w['rows'])
        chk('after the reset every shoot night has only Nathaniel Stride and Nate Evans',
            only and len(w['rows'])==6, str(w['rows']))
        chk('Nathe is the host registration and Nate Evans keeps the organiser id',
            all(ids==['lkhost:nate','lkhost:nathe'] or ids==['lkhost:nathe','lkhost:nate'] for ids in w['ids']),
            str(w['ids']))
        chk('scores, groups, payments, pins, tombstones and claims are gone',
            w['sc']=={} and w['paid']=={} and w['grp']=={} and w['drop']=={} and w['pins']=={}
            and w['claim']=={} and not w['fin'] and w['inv']==[],
            str({k:w[k] for k in ('sc','paid','grp','drop','pins','claim','fin','inv')}))
        chk('the saved registration, this phone\'s names and the PIN lock are cleared',
            w['regKey'] is None and w['mineKey'] is None and w['lockKey'] is None)
        chk('a league snapshot session is removed and a practice round is kept',
            'lg-LINGKN26-w1' not in w['sessions'] and 'keep-me' in w['sessions'], str(w['sessions']))
        chk('the reset does not run a second time',
            w['again'] is False and w['clear']==1794903600000 and w['fresh']>=1794903600000,
            str(w['clear'])+' '+str(w['fresh']))
        pg.evaluate("() => { window._lkFlowNight = 1; window._lkNamesOpen = 0; lkFlowHome('LINGKN26'); }")
        pg.wait_for_selector('#lklogin', timeout=5000)
        pg.locator('#lklogin').click()
        pg.wait_for_selector('#lkscorernames', timeout=5000)
        nights = []
        for i in range(6):
            pg.locator('#lknight').select_option(str(i+1))
            pg.wait_for_timeout(80)
            nights.append(pg.locator('#lkscorernames .lk-namebtn').all_inner_texts())
        chk('the host phone lists Nathaniel and Nate on every night, with no PIN',
            nights==[['Nate Evans','Nathaniel Stride']]*6
            and pg.locator('#lkpin').count()==0 and pg.locator('#lkpinbox').inner_text()==''
            and pg.locator('#lkpassbox').is_visible() and pg.locator('#lkpinreset').count()==1,
            str(nights))
        pg.locator('#lknight').select_option('1')
        pg.wait_for_timeout(80)
        pg.screenshot(path=str(SHOT / 'lingkana-clear-login-390.png'))
        k = pg.evaluate(KEEP)
        chk('Wednesday\'s archer is still registered after the reset runs again',
            k['still'] and k['wednesday'] and k['organisers'] and not k['ada'], str(k))
        chk('Wednesday\'s score, payment, group and PIN survive the second reset',
            k['score']==k['stamp']['sc'] and k['pin']=='abc' and k['paid'] is True
            and k['stamp']['grp'][0] in k['grp'] and k['stamp']['grp'][1] in k['grp'],
            str(k))
        chk('a snapshot from before the clear does not come back',
            k['old'] is False and k['clear']==1794903600000, str(k['old']))

        sc = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        sp = sc.new_page()
        sp.goto(f'{BASE}/#lk-home', wait_until='domcontentloaded')
        sp.wait_for_selector('#lklogin', timeout=8000)
        sp.locator('#lklogin').click()
        sp.wait_for_selector('#lkshowall', timeout=5000)
        sp.locator('#lkshowall').click()
        sp.wait_for_selector('#lkscorernames .lk-namebtn', timeout=5000)
        shown = sp.locator('#lkscorernames .lk-namebtn').all_inner_texts()
        chk('a scorer phone can find both organisers',
            shown==['Nate Evans','Nathaniel Stride'], str(shown))
        sp.locator('#lkscorernames .lk-namebtn', has_text='Nate Evans').click()
        chk('Nate Evans still skips the PIN and uses the passcode',
            sp.locator('#lkpin').count()==0 and sp.locator('#lkpassbox').is_visible())
        sp.locator('#lkscorernames .lk-namebtn', has_text='Nathaniel Stride').click()
        chk('Nathaniel on a scorer phone still sets a PIN with the passcode',
            sp.locator('#lkpin').count()==1 and sp.locator('#lkpin2').count()==1 and sp.locator('#lkpassbox').is_visible())
        chk('no page errors', not errs, str(errs[:3]))
        b.close()
finally:
    srv.terminate()

print(f'\n{len(ok)} passed, {len(bad)} failed')
sys.exit(1 if bad else 0)
