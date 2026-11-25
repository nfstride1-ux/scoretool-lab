# Organisers can score alone. Nate Evans stays registered after a wipe or a snapshot.
# A normal archer who is the only one paid still has no target. Group sizes 4/3/2 are unchanged.
# Stubs the ntfy relay. Does not post to the live topic.
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

PORT = '8823'
BASE = f'http://localhost:{PORT}'
SHOT = Path('/opt/cursor/artifacts')
SHOT.mkdir(parents=True, exist_ok=True)
NIGHTS = ['2026-11-18','2026-12-02','2026-12-16','2026-12-30','2027-01-13','2027-01-27']

srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)

RULES = r"""() => {
  const nights = ['2026-11-18','2026-12-02','2026-12-16','2026-12-30','2027-01-13','2027-01-27'];
  const nateRows = (lg) => nights.map(n => (lg.reg[n]||[]).filter(r => r && r.name==='Nate Evans').map(r => r.id));
  try { localStorage.removeItem('scoretool.lk.reg'); } catch (e) {}
  const lg = lkEnsure();
  lg.order = []; lg.gn = {}; lg.reg = {}; lg.paid = {}; lg.sc = {}; lg.grp = {}; lg.drop = {}; lg.claim = {};
  lg.fresh = LK_FRESH; lg.wt = Date.now();
  lkSeedCoHost(lg);
  const seeded = nateRows(lg);

  const fresh = lkEnsure();
  fresh.fresh = 1;
  fresh.reg = {'2026-11-18':[
    {id:'lkhost:nate', name:'Nate Evans', at:100},
    {id:'gadaada', name:'Ada Archer', at:100},
    {id:'g7wbux6', name:'Nathaniel Stride', at:LK_FRESH + 10}
  ]};
  fresh.order = ['lkhost:nate','gadaada','g7wbux6'];
  fresh.gn = {gadaada:{n:'Ada Archer', t:100}, g7wbux6:{n:'Nathaniel Stride', t:LK_FRESH+10}};
  fresh.drop = {'lkhost:nate':{n:'Nate Evans', t:200}};
  lkFresh(fresh);
  const afterFresh = {
    nate: nateRows(fresh),
    ada: nights.some(n => (fresh.reg[n]||[]).some(r => r && r.name==='Ada Archer')),
    nat: (fresh.reg['2026-11-18']||[]).some(r => r && r.id==='g7wbux6'),
    drop: Object.keys(fresh.drop||{})
  };

  const snap = lkRecord();
  snap.fresh = LK_FRESH;
  snap.wt = 1000;
  snap.host = 'nathe';
  snap.reg = {'2026-11-18':[{id:'g7wbux6', name:'Nathaniel Stride', at:LK_FRESH+5}]};
  snap.order = ['g7wbux6'];
  snap.gn = {g7wbux6:{n:'Nathaniel Stride', t:LK_FRESH+5}};
  const snapRet = lgMerge(snap, {
    k:'ls', code:'LINGKN26', by:'nathe', host:'nathe', format:'lingkana',
    fresh: LK_FRESH + 1, wt: 5000, t: Date.now(),
    reg: {'2026-11-18':[{id:'gsam1234', name:'Sam Archer', at:LK_FRESH+50}]},
    drop: {'lkhost:nate':{n:'Nate Evans', t:Date.now()}}
  });
  const afterSnap = {
    ret: snapRet, fresh: snap.fresh,
    nate: nateRows(snap),
    sam: (snap.reg['2026-11-18']||[]).some(r => r && r.name==='Sam Archer'),
    drop: Object.keys(snap.drop||{})
  };

  const dup = lkEnsure();
  nights.forEach(n => { dup.reg[n] = (dup.reg[n]||[]).filter(r => !(r && r.name==='Nate Evans')); });
  dup.order = (dup.order||[]).filter(id => id!=='lkhost:nate' && id!=='gnat99x');
  delete dup.gn['lkhost:nate']; delete dup.gn['gnat99x'];
  const own = lkApplyReg({name:'Nate Evans', id:'gnat99x', at:LK_FRESH+30, bow:'Compound'}, dup);
  lkSeedCoHost(dup);
  const dupRows = nateRows(dup);

  const again = lkApplyReg({name:'Nate Evans', at:Date.now(), bow:'Recurve'}, dup);
  const dupAfter = nateRows(dup);

  const sizes = [];
  for (let n=1;n<=13;n++) sizes.push(lkGroupSizes(n));
  const plain = lkChunkFour([{id:'gsam1234', name:'Sam Archer'}]);
  const hostOne = lkChunkFour([{id:'g7wbux6', name:'Nathaniel Stride'}]);
  const nateOne = lkChunkFour([{id:'lkhost:nate', name:'Nate Evans'}]);
  const both = lkChunkFour([{id:'lkhost:nate', name:'Nate Evans'},{id:'g7wbux6', name:'Nathaniel Stride'}]);

  const scoreLg = lkEnsure();
  scoreLg.paid = {}; scoreLg.grp = {}; scoreLg.sc = {};
  const night = '2026-11-18';
  if (!scoreLg.order.includes('g7wbux6')) scoreLg.order.push('g7wbux6');
  scoreLg.gn.g7wbux6 = {n:'Nathaniel Stride', t:LK_FRESH+10, by:'register'};
  nights.forEach(n => {
    scoreLg.reg[n] = scoreLg.reg[n] || [];
    if (!scoreLg.reg[n].some(r => r && r.id==='g7wbux6')) scoreLg.reg[n].push({id:'g7wbux6', name:'Nathaniel Stride', at:LK_FRESH+10, bow:'Compound'});
    if (!scoreLg.reg[n].some(r => r && r.id==='gsam1234')) scoreLg.reg[n].push({id:'gsam1234', name:'Sam Archer', at:LK_FRESH+11});
  });
  scoreLg.gn.gsam1234 = {n:'Sam Archer', t:LK_FRESH+11};
  scoreLg.paid[night] = {g7wbux6:1};
  const natBuilt = lkAssignGroups(scoreLg, 1);
  const natSet = lkSetGroups(1, [['g7wbux6']]);
  scoreLg.paid[night] = {gsam1234:1};
  scoreLg.grp = {};
  const samBuilt = lkAssignGroups(scoreLg, 1);
  const samSet = lkSetGroups(1, [['gsam1234']]);
  scoreLg.paid[night] = {g7wbux6:1, 'lkhost:nate':1};
  const nateId = ((scoreLg.reg[night]||[]).find(r => r && r.name==='Nate Evans')||{}).id;
  if (nateId && nateId!=='lkhost:nate') scoreLg.paid[night] = {g7wbux6:1, [nateId]:1};
  scoreLg.grp = {};
  const pairBuilt = lkAssignGroups(scoreLg, 1);
  const five = ['Alex River','Casey Ng','Jordan Lee','Riley Chen','Sam Archer'];
  five.forEach(name => lkApplyReg({name, at:LK_FRESH+40}, scoreLg));
  scoreLg.paid[night] = {};
  (scoreLg.reg[night]||[]).forEach(r => { if (r && five.includes(r.name)) scoreLg.paid[night][r.id] = 1; });
  scoreLg.grp = {};
  const fiveBuilt = lkAssignGroups(scoreLg, 1);
  const refused = lkDropArcher(nateId || 'lkhost:nate');
  const still = (scoreLg.reg[night]||[]).filter(r => r && r.name==='Nate Evans').length;

  return {
    seeded, afterFresh, afterSnap, ownOk: !!(own&&own.ok), ownId: own&&own.id, dupRows, dupAfter,
    againOk: !!(again&&again.ok), againId: again&&again.id,
    sizes, plainGroups: plain.groups.length, plainSolo: (plain.solo||[]).map(p=>p.name),
    hostOne: (hostOne.groups||[]).map(g => g.map(p=>p.name)), hostSolo: hostOne.solo,
    nateOne: (nateOne.groups||[]).map(g => g.map(p=>p.name)),
    both: (both.groups||[]).map(g => g.map(p=>p.name)),
    natBuilt: {ok: natBuilt.ok, names:(natBuilt.groups||[]).map(g=>g.names), targets:(natBuilt.groups||[]).map(g=>g.target), solo:(natBuilt.solo||[]).map(p=>p.name), set:natSet},
    samBuilt: {ok: samBuilt.ok!==false, names:(samBuilt.groups||[]).map(g=>g.names), solo:(samBuilt.solo||[]).map(p=>p.name), msg:samBuilt.msg||'', set:samSet},
    pairBuilt: {names:(pairBuilt.groups||[]).map(g=>g.names), targets:(pairBuilt.groups||[]).map(g=>g.target)},
    fiveBuilt: (fiveBuilt.groups||[]).map(g=>g.names),
    refused, still, nateId
  };
}"""

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome',
                              args=['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'])
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        page = ctx.new_page()
        page.goto(f'{BASE}/?tester=nathe#lk-home', wait_until='networkidle')
        page.wait_for_timeout(600)
        if page.locator('#wnx').count():
            page.locator('#wnx').click()
            page.wait_for_timeout(200)
        r = page.evaluate(RULES)
        chk('Nate Evans is seeded once on every shoot night',
            len(r['seeded'])==6 and all(ids==['lkhost:nate'] for ids in r['seeded']),
            str(r['seeded']))
        chk('LK_FRESH keeps Nathaniel and puts Nate back, and Ada stays wiped',
            r['afterFresh']['ada'] is False and r['afterFresh']['nat'] is True
            and all(ids==['lkhost:nate'] for ids in r['afterFresh']['nate'])
            and 'lkhost:nate' not in r['afterFresh']['drop'],
            str(r['afterFresh']))
        chk('a snapshot that replaces the register and drops Nate still leaves him on every night',
            r['afterSnap']['ret'] is True and r['afterSnap']['sam'] is True
            and all(len(ids)==1 for ids in r['afterSnap']['nate'])
            and 'lkhost:nate' not in r['afterSnap']['drop'] and 'Nate Evans' not in str(r['afterSnap']['drop']),
            str(r['afterSnap']))
        chk('Nate registering himself does not create a second row',
            r['ownOk'] is True and r['ownId']=='gnat99x'
            and all(ids==['gnat99x'] for ids in r['dupRows'])
            and r['againOk'] is True and all(ids==['gnat99x'] for ids in r['dupAfter']),
            str({'own':r['ownId'], 'again':r['againId'], 'rows':r['dupAfter']}))
        chk('group sizes for 1 to 13 are unchanged, and a normal lone archer is not grouped',
            r['sizes'][0] is None and r['sizes'][1]==[2] and r['sizes'][4]==[3,2]
            and r['sizes'][5]==[3,3] and r['sizes'][6]==[4,3]
            and r['plainGroups']==0 and r['plainSolo']==['Sam Archer'],
            str(r['sizes'][:7]))
        chk('one organiser is a group of 1, and the two organisers are a group of 2',
            r['hostOne']==[['Nathaniel Stride']] and r['hostSolo']==[]
            and r['nateOne']==[['Nate Evans']]
            and r['both']==[['Nate Evans','Nathaniel Stride']],
            str({'host':r['hostOne'], 'nate':r['nateOne'], 'both':r['both']}))
        chk('assigning the paid list gives Nathaniel a target and refuses a lone other archer',
            r['natBuilt']['set']=='' and r['natBuilt']['names']==[['Nathaniel Stride']]
            and r['natBuilt']['targets']==[1] and r['natBuilt']['solo']==[]
            and r['samBuilt']['names']==[] and r['samBuilt']['solo']==['Sam Archer']
            and r['samBuilt']['set']=='A group needs at least two archers.',
            str({'nat':r['natBuilt'], 'sam':r['samBuilt']}))
        chk('just the two organisers share one target, and five other archers stay 3 then 2',
            r['pairBuilt']['names']==[['Nate Evans','Nathaniel Stride']] and r['pairBuilt']['targets']==[1]
            and r['fiveBuilt']==[['Alex River','Casey Ng','Jordan Lee'],['Riley Chen','Sam Archer']],
            str({'pair':r['pairBuilt'], 'five':r['fiveBuilt']}))
        chk('Remove cannot take Nate Evans off the register',
            r['refused']=='Nate Evans is an organiser for every night, so he stays on the list.' and r['still']==1,
            str(r['refused']))

        page.evaluate("""() => {
          const lg = lkEnsure();
          const night = '2026-11-18';
          const nights = ['2026-11-18','2026-12-02','2026-12-16','2026-12-30','2027-01-13','2027-01-27'];
          lg.paid = {}; lg.grp = {}; lg.sc = {};
          nights.forEach(n => {
            lg.reg[n] = (lg.reg[n]||[]).filter(r => r && (r.name==='Nate Evans' || r.id==='g7wbux6'));
            if (!lg.reg[n].some(r => r.id==='g7wbux6')) lg.reg[n].push({id:'g7wbux6', name:'Nathaniel Stride', at:LK_FRESH+10, bow:'Compound'});
          });
          lg.gn.g7wbux6 = {n:'Nathaniel Stride', t:LK_FRESH+10, by:'register'};
          lg.paid[night] = {g7wbux6:1};
          lg.grp = {};
          window._lkFlowNight = 1;
          window._lkAuthed = null;
          try {
            sessionStorage.removeItem('scoretool.lk.auth');
            sessionStorage.removeItem('scoretool.lk.cohost');
            sessionStorage.setItem('scoretool.lk.scorerId','g7wbux6');
            sessionStorage.setItem('scoretool.lk.scorer','Nathaniel Stride');
          } catch (e) {}
        }""")
        page.evaluate("() => lkFlowHome('LINGKN26')")
        page.wait_for_selector('#lklogin', timeout=5000)
        page.locator('#lklogin').click()
        page.wait_for_selector('#lkscorernames', timeout=5000)
        labels = page.locator('#lkscorernames .lk-namebtn').all_inner_texts()
        chk('login lists Nathaniel and Nate once each',
            labels==['Nate Evans','Nathaniel Stride'], str(labels))
        page.locator('#lkscorernames .lk-namebtn', has_text='Nathaniel Stride').click()
        page.fill('#lkpw', os.environ['LK_TEST_PASSCODE'])
        page.locator('#lkpwgo').click()
        page.wait_for_selector('#lkassigned', timeout=5000)
        assigned = page.inner_text('#lkassigned')
        chk('Nathaniel Stride alone is on target 1',
            page.get_attribute('#lkassigned','data-target')=='1'
            and page.locator('#lkassigned[data-solo="1"]').count()==0
            and 'target 1' in assigned.lower() and 'Nathaniel Stride (you)' in assigned
            and 'only archer' not in assigned.lower() and '1 archer' in assigned.lower()
            and page.locator('#lkstart').count()==1,
            assigned[:400])
        page.screenshot(path=str(SHOT / 'lingkana-nathaniel-solo-target-390.png'), scale='css')
        page.locator('#lkstart').click()
        page.wait_for_selector('#lgentry', timeout=5000)
        scoring = page.inner_text('#lgentry')
        chk('Start scoring opens the scoring screen for Nathaniel Stride',
            'Nathaniel Stride' in scoring and 'End 1 of 20' in scoring
            and page.locator('#lgentry [data-lgk="X"]').count()==1,
            scoring[:300])
        page.locator('#lgentry [data-lgk="X"]').click()
        page.wait_for_timeout(300)
        shot = page.evaluate("""() => {
          const lg = lkEnsure();
          const e = (lg.sc && lg.sc.g7wbux6 && lg.sc.g7wbux6[1]) || {};
          return {chip: (document.querySelector('#lgentry .ad-chips')||{}).innerText||'', end: e.e||[]};
        }""")
        chk('an arrow can be scored on that screen',
            'X' in shot['chip'] and shot['end'] and shot['end'][0] and shot['end'][0][0]=='X',
            str(shot))
        page.screenshot(path=str(SHOT / 'lingkana-nathaniel-solo-score-390.png'), scale='css')

        page.evaluate("""() => {
          const lg = lkEnsure();
          const night = '2026-11-18';
          lg.paid = {}; lg.paid[night] = {};
          lg.grp = {}; lg.sc = {};
          window._lkFlowNight = 1;
          try { sessionStorage.removeItem('scoretool.lk.cohost'); sessionStorage.removeItem('scoretool.lk.auth'); } catch (e) {}
          window._lkAuthed = null;
        }""")
        page.evaluate("() => lkFlowLogin()")
        page.wait_for_selector('#lkscorernames', timeout=5000)
        page.locator('#lkscorernames .lk-namebtn', has_text='Nate Evans').click()
        page.fill('#lkpw', os.environ['LK_TEST_PASSCODE'])
        page.locator('#lkpwgo').click()
        page.wait_for_selector('#lkpaidlist', timeout=5000)
        paid_names = page.locator('#lkpaidlist .lk-paidrow .nm').all_inner_texts()
        nate_row = page.locator('#lkpaidlist .lk-paidrow', has_text='Nate Evans')
        chk('Nate Evans is on the paid tick list and has no Remove button',
            'Nate Evans' in paid_names and paid_names.count('Nate Evans')==1
            and nate_row.locator('input[data-lkpaid]').count()==1
            and nate_row.locator('.lk-remove').count()==0,
            str(paid_names))
        nate_row.locator('input[data-lkpaid]').check()
        page.wait_for_selector('#lkpaidlist input[data-lkpaid]', timeout=4000)
        nate_on = page.evaluate("""() => {
          const lg = lkEnsure();
          const id = ((lg.reg['2026-11-18']||[]).find(r => r && r.name==='Nate Evans')||{}).id;
          const built = lkAssignGroups(lg, 1);
          return {id, on: !!(lg.paid && lg.paid['2026-11-18'] && lg.paid['2026-11-18'][id]),
                  names: (built.groups||[]).map(g => g.names), target: (built.groups[0]||{}).target};
        }""")
        chk('ticking Nate Evans paid gives him a target when he is the only one paid',
            nate_on['on'] is True and nate_on['names']==[['Nate Evans']] and nate_on['target']==1,
            str(nate_on))
        b.close()
finally:
    srv.terminate()

print(f'\n{len(ok)} passed, {len(bad)} failed')
sys.exit(1 if bad else 0)
