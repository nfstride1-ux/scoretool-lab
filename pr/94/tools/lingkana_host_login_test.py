# Nathaniel Stride registered on lk-register at 10:39 Perth 17 Nov and did not appear on the login list.
# Replays the real ntfy topic (tools/fixtures/lingkn26-live2-2026-11-17.jsonl, email and phone removed).
# Does not post to the live topic.
import json, os, sys, time, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import guard
from playwright.sync_api import sync_playwright

ok, bad = [], []
def chk(n, c, extra=''):
    (ok if c else bad).append(n)
    print(('PASS ' if c else 'FAIL ') + n + (('  ' + extra) if extra and not c else ''))

PORT = '8817'
BASE = f'http://localhost:{PORT}'
SHOT = Path('/opt/cursor/artifacts')
SHOT.mkdir(parents=True, exist_ok=True)
FIX = ROOT / 'tools' / 'fixtures' / 'lingkn26-live2-2026-11-17.jsonl'
NEW_HASH = 'c67256dbccd4b9b2538a2dc29f2510a29efbfd56f810bb76ddd626c9f6bbc141'
OLD_HASH = '8277ebe292f1cb19053b5c2683d787ba76bcc8d2fc8980c1a94857af5a82b1d2'
NIGHTS = ['2026-11-18','2026-12-02','2026-12-16','2026-12-30','2027-01-13','2027-01-27']

msgs = []
for line in FIX.read_text().splitlines():
    if not line.strip():
        continue
    j = json.loads(line)
    if j.get('event') != 'message':
        continue
    d = json.loads(j['message'])
    d['_id'] = j['id']
    msgs.append(d)

srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)

REPLAY = """
(msgs) => {
  const nights = ['2026-11-18','2026-12-02','2026-12-16','2026-12-30','2027-01-13','2027-01-27'];
  const blank = () => {
    const lg = lkRecord();
    lg.fresh = LK_FRESH;
    lg.wt = Date.now();
    lg.reg = {}; lg.order = []; lg.gn = {}; lg.sc = {}; lg.claim = {}; lg.paid = {}; lg.drop = {};
    return lg;
  };
  const replay = (lg, list) => {
    for (const d of list) {
      if (!d) continue;
      if (typeof lgMerge === 'function' && lgMerge(lg, d)) continue;
      if (d.k === 'lkreg' && d.code === lg.code && (!(lg.fresh) || +(d.t || (d.rec && d.rec.at) || 0) >= lg.fresh)) {
        lkApplyReg(d.rec || d, lg);
      } else if (d.k === 'lkdrop' && d.code === lg.code && (!(lg.fresh) || +(d.at || d.t || 0) >= lg.fresh)) {
        lkApplyDrop(lg, d.id, d.name, d.at || d.t);
      }
    }
    if (typeof lkStripHostEntries === 'function') lkStripHostEntries(lg);
    return lg;
  };
  const namesFor = (lg) => nights.map((night, i) => ({
    night,
    names: (lkNightSignups(lg, i + 1) || []).map(r => r && r.name),
    ids: (lkNightSignups(lg, i + 1) || []).map(r => r && r.id)
  }));
  const phone = replay(blank(), msgs);
  const listed = namesFor(phone);
  const hostId = lkApplyReg({name:'Nathaniel Stride', id:'nathe', at:1794883149744, bow:'Compound'}, blank());

  const kept = blank();
  kept.wt = 1794870130003;
  kept.fresh = LK_FRESH;
  kept.pwHash = '""" + NEW_HASH + """';
  kept.pwt = 1794873011673;
  kept.reg = {'2026-11-18':[
    {id:'g7wbux6', name:'Nathaniel Stride', at:1794883149744, bow:'Compound'},
    {id:'gsam1234', name:'Sam Archer', at:1794884000000, bow:'Recurve'}
  ]};
  kept.order = ['g7wbux6','gsam1234'];
  kept.gn = {g7wbux6:{n:'Nathaniel Stride', t:1794883149744}, gsam1234:{n:'Sam Archer', t:1794884000000}};
  const stale = {
    k:'ls', code:'LINGKN26', by:'nathe', host:'nathe', format:'lingkana',
    fresh:LK_FRESH, wt:1794454130383, t:1794883284988,
    pwHash:'""" + OLD_HASH + """', pwSalt:'c16go1a2', pwt:1794393551016,
    reg:{'2026-11-18':[{id:'grhk7g9', name:'Nathaniel Stride', at:1794883149744, bow:'Compound'}]},
    order:['grhk7g9'], gn:{grhk7g9:{n:'Nathaniel Stride', t:1794883149744, by:'register'}}
  };
  const staleRet = lgMerge(kept, stale);
  const afterStale = (kept.reg['2026-11-18'] || []).map(r => r.name);
  const oldFresh = lgMerge(kept, {k:'ls', code:'LINGKN26', by:'nathe', format:'lingkana', fresh:1794401520000, wt:1794999999999, t:Date.now(), reg:{'2026-11-18':[]}});

  const bumped = blank();
  bumped.fresh = 1794401520000;
  bumped.wt = 1794870130003;
  bumped.reg = {'2026-11-18':[{id:'g7wbux6', name:'Nathaniel Stride', at:1794883149744}, {id:'gsam1234', name:'Sam Archer', at:1794884000000}]};
  bumped.order = ['g7wbux6','gsam1234'];
  const wipeRet = lgMerge(bumped, stale);
  const afterWipe = (bumped.reg['2026-11-18'] || []).map(r => r.name);

  try { localStorage.removeItem('scoretool.lk.reg'); } catch (e) {}
  const mine = lkEnsure();
  mine.order = []; mine.gn = {}; mine.reg = {}; mine.drop = {}; mine.sc = {};
  mine.fresh = LK_FRESH;
  const localErr = lkRegister({name:'Nathaniel Stride', bow:'Compound', email:'a@b.c', phone:'0400000000'});
  lkEnsure();
  const localNights = namesFor(mine).map(x => x.names.includes('Nathaniel Stride'));

  mine.reg = {}; mine.order = []; mine.gn = {};
  try {
    localStorage.setItem('scoretool.lk.reg', JSON.stringify([{name:'Nathaniel Stride', at:1794883149744, bow:'Compound', id:'g7wbux6', allNights:1, league:'LINGKN26', _applied:1}]));
  } catch (e) {}
  lkPullReg(mine);
  const pulled = namesFor(mine).every(x => x.names.includes('Nathaniel Stride'));

  const blocked = blank();
  blocked.drop = {g7wbux6:{n:'Nathaniel Stride', t:1794883149744 + 1000}};
  const blockedReg = lkApplyReg({name:'Nathaniel Stride', id:'g7wbux6', at:1794883149744, bow:'Compound'}, blocked);
  const olderDrop = blank();
  olderDrop.drop = {nathe:{n:'Nathaniel Stride', t:1794883149744 - 1000}};
  const olderReg = lkApplyReg({name:'Nathaniel Stride', id:'g7wbux6', at:1794883149744, bow:'Compound'}, olderDrop);

  try { localStorage.removeItem('scoretool.lk.reg'); } catch (e) {}
  const show = lkEnsure();
  show.order = []; show.gn = {}; show.reg = {}; show.drop = {}; show.sc = {}; show.claim = {}; show.paid = {};
  show.fresh = LK_FRESH; show.wt = Date.now(); show.pwHash = (typeof LK_PW_HASH==='string'?LK_PW_HASH:''); show.pwt = 1;
  replay(show, msgs);
  lkEnsure();
  window._lkFlowNight = 1;
  return {
    listed, hash: phone.pwHash, hostId: hostId && hostId.id, hostOk: !!(hostId && hostId.ok),
    staleRet, afterStale, hashAfter: kept.pwHash, oldFresh,
    wipeRet, afterWipe, wipeFresh: bumped.fresh,
    localErr: localErr || '', localNights, pulled,
    blockedOk: !!(blockedReg && blockedReg.ok), blockedMsg: blockedReg && blockedReg.msg,
    olderOk: !!(olderReg && olderReg.ok),
    show: namesFor(show), showHash: show.pwHash
  };
}
"""

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome',
                              args=['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'])
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        page = ctx.new_page()
        page.goto(f'{BASE}/?tester=nathe#lk-home', wait_until='networkidle')
        page.wait_for_timeout(600)
        if page.locator('#wnx').count():
            page.locator('#wnx').click()
            page.wait_for_timeout(200)
        result = page.evaluate(REPLAY, msgs)
        listed = result['listed']
        chk('real topic puts Nathaniel Stride on every shoot night, once, and keeps organiser Nate Evans',
            len(listed)==6 and all(
                row['names'].count('Nathaniel Stride')==1 and row['ids'].count('g7wbux6')==1
                and row['names'].count('Nate Evans')==1 and len(row['names'])==2
                for row in listed),
            str(listed))
        chk('Ada Archer from before the fresh cut is not on the login register',
            all('Ada Archer' not in row['names'] for row in listed))
        chk('replay ends on the newer passcode hash, not the stale 8277eb copy',
            result['hash']==NEW_HASH, result['hash'])
        chk('registering as the host account still returns an archer id',
            result['hostOk'] and result['hostId'] and result['hostId']!='nathe', str(result['hostId']))
        chk('an older-wt snapshot does not remove a newer name or roll back the passcode hash',
            'Sam Archer' in result['afterStale'] and 'Nathaniel Stride' in result['afterStale'] and result['hashAfter']==NEW_HASH,
            str(result['afterStale'])+' '+str(result['hashAfter']))
        chk('a snapshot older than LK_FRESH is ignored',
            result['oldFresh'] is False)
        chk('a higher fresh stamp with an older wt does not wipe newer sign-ups',
            'Sam Archer' in result['afterWipe'] and 'Nathaniel Stride' in result['afterWipe'] and result['wipeFresh']==1794881040000,
            str(result['afterWipe']))
        chk('the host registering on this phone stays on every night after ensure',
            result['localErr']=='' and result['localNights']==[True]*6,
            str(result['localErr'])+' '+str(result['localNights']))
        chk('a sign-up already marked applied is put back when the register row is missing',
            result['pulled'] is True)
        chk('a newer Remove tombstone still blocks that archer',
            result['blockedOk'] is False and result['blockedMsg']=='That archer was removed from the league.',
            str(result['blockedMsg']))
        chk('an older tombstone for the host account does not block a later registration',
            result['olderOk'] is True)
        show = result['show']
        chk('the phone that draws the login list kept Nathaniel and organiser Nate Evans on every night',
            len(show)==6 and all(
                row['names'].count('Nathaniel Stride')==1 and row['names'].count('Nate Evans')==1 and len(row['names'])==2
                for row in show),
            str(show))

        page.evaluate("() => { window._lkFlowNight = 1; lkFlowHome('LINGKN26'); }")
        page.wait_for_selector('#lklogin', timeout=5000)
        page.locator('#lklogin').click()
        page.wait_for_selector('#lkscorernames', timeout=5000)
        night_labels = []
        for i in range(6):
            page.locator('#lknight').select_option(str(i+1))
            page.wait_for_selector('#lkscorernames', timeout=4000)
            night_labels.append(page.locator('#lkscorernames .lk-namebtn').all_inner_texts())
        chk('login name list shows Nathaniel Stride and Nate Evans on every night',
            night_labels==[['Nate Evans','Nathaniel Stride']]*6,
            str(night_labels))
        page.locator('#lknight').select_option('1')
        page.wait_for_selector('#lkscorernames', timeout=4000)
        page.locator('#lkscorernames').scroll_into_view_if_needed()
        page.screenshot(path=str(SHOT / 'lingkana-login-nathaniel-390.png'), full_page=False)
        page.locator('#lkloginpage').screenshot(path=str(SHOT / 'lingkana-login-nathaniel-page-390.png'))
        b.close()
finally:
    srv.terminate()

print(f'\n{len(ok)} passed, {len(bad)} failed')
sys.exit(1 if bad else 0)
