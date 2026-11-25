# Lingkana live-root follow-up: register link, host paid list, full names, no tester invite, Beta, fresh empty nights, 660 maths.
import json, os, subprocess, sys, time
from playwright.sync_api import sync_playwright
import guard

ok, bad = [], []
def chk(n, c):
    (ok if c else bad).append(n)
    print(('PASS ' if c else 'FAIL ') + n)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = '8795'
BASE = f'http://localhost:{PORT}'
srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT], cwd=ROOT,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)

def go(page, tid):
    page.goto(f'{BASE}/?tester={tid}')
    page.wait_for_timeout(800)
    page.evaluate("""tid => {
      try { localStorage.setItem('scoretool.cal.'+tid+'.prompted','1'); } catch(e) {}
      try { localStorage.setItem('scoretool.whatsnew.seen','v2026-11-11-1824-live'); } catch(e) {}
      if (typeof S !== 'undefined' && S) { S.unlocked = true; if (!S.profile) S.profile = tid; if (typeof save === 'function') save(); }
    }""", tid)
    page.reload()
    page.wait_for_timeout(1200)
    if page.locator('#wnx').count():
        page.locator('#wnx').click()
        page.wait_for_timeout(200)

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome',
                              args=['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'])
        ctx = b.new_context(viewport={'width': 390, 'height': 844})
        # guard also stubs ntfy; extra belt-and-braces
        page = ctx.new_page()
        go(page, 'nathe')

        maths = page.evaluate("""() => {
          const endX = ['X','X','X']; // 33
          const twenty = (a) => Array.from({length:20}, () => a.slice());
          const tot = (E) => typeof lgTot === 'function' ? lgTot(E, {xv:11,lancaster:true,round:'Lancaster 660'}) : null;
          const full = twenty(endX);
          const s660 = tot(full);
          const xs = typeof lgXs === 'function' ? lgXs(full) : null;
          // nights: 600,610,620,630,640,650 — best 4 = 2540
          const mk = (s) => ({s, x:2, t10:4, d:true});
          const best = lkPickBest([mk(600),mk(610),mk(620),mk(630),mk(640),mk(650)]);
          const three = lkPickBest([mk(600),mk(610),mk(620),null,null,null]);
          const miss = lkPickBest([mk(660),null,mk(650),null,mk(640),mk(630)]);
          // X=11 vs 10: one X,X,X end is 33 not 30
          const one = tot([['X','X','X']]);
          return {s660, xs, bestT: best.t, bestCount: best.count.slice().sort(), threeT: three.t, missT: miss.t, one};
        }""")
        chk('660 max: 20 ends of X,X,X is 660 with 60 Xs (X=11)', maths['s660']==660 and maths['xs']==60)
        chk('best 4 of 6: 600..650 totals 2540 and drops the two lowest', maths['bestT']==2540 and maths['bestCount']==[2,3,4,5])
        chk('fewer than 4 nights: total is the nights shot, not padded with zeros', maths['threeT']==1830)
        chk('missed night is skipped, not a zero (660+650+640+630=2580)', maths['missT']==2580)
        chk('one end of X,X,X is 33 (X=11, not 10)', maths['one']==33)

        names = page.evaluate("""() => {
          const lg = {format:'lingkana', code:'LINGKN26', order:['nathe','gabcdef','dana','phill'],
            gn:{gabcdef:{n:'Sam Archer',j:0,t:1}, dana:{n:'Dee Archer',t:1}},
            sc:{nathe:{1:{e:Array.from({length:20},()=>['10','10','10']),u:1}},
                gabcdef:{1:{e:Array.from({length:20},()=>['10','9','9']),u:1}}}};
          const rows = lkTable(lg);
          const html = lkTableHTML(lg);
          const nathe = rows.find(r=>r.id==='nathe');
          const guest = rows.find(r=>r.id==='gabcdef');
          const dana = rows.find(r=>r.id==='dana');
          const leak = {n: lkStandName('x', {gn:{x:{n:'Pat Lee pat@example.com 0400 111 222'}}})};
          return {nathe: nathe && nathe.nm, guest: guest && guest.nm, dana: dana && dana.nm, phill: lkStandName('phill'),
                  html, hasEmail: /@/.test(html), hasPhone: /0400/.test(html), stripped: leak.n};
        }""")
        chk('standings show Nathaniel Stride, not a short name', names['nathe']=='Nathaniel Stride')
        chk('standings show registered full name', names['guest']=='Sam Archer')
        chk('standings show Dee Archer in full', names['dana']=='Dee Archer')
        chk('standings show Pat Archer in full (tester official name)', names['phill']=='Pat Archer')
        chk('standings HTML has no email or phone', (not names['hasEmail']) and (not names['hasPhone']))
        chk('contact details are stripped from a stored name', names['stripped']=='Pat Lee')

        topic = page.evaluate("() => typeof lgTopic==='function' && lgTopic('LINGKN26')")
        chk('live Lingkana topic is the fresh live2 topic', topic.endswith('lg-lingkn26-live2') and 'test' not in topic)

        pub = page.evaluate("""() => lkPublicReg({'2026-11-18':[{id:'g1',name:'Sam',at:1,bow:'Compound',email:'a@b.c',phone:'0400111222'}]})""")
        chk('relay pack strips email and phone from sign-ups',
            pub.get('2026-11-18') and pub['2026-11-18'][0].get('name')=='Sam' and 'email' not in pub['2026-11-18'][0] and 'phone' not in pub['2026-11-18'][0])

        # seed pre-fresh junk then ensure wipe
        wiped = page.evaluate("""() => {
          const lg = lkEnsure();
          lg.order = ['nathe','gkv6txy'];
          lg.gn = {gkv6txy:{n:'slime',t:1,by:'register'}};
          lg.reg = {'2026-11-18':[{id:'gkv6txy',name:'slime',at:1}]};
          lg.sc = {nathe:{1:{e:[['X','10','9']],u:1}}};
          lg.claim = {'2026-11-18':{nathe:1}};
          lg.fresh = 0;
          lkFresh(lg);
          return {order: lg.order.slice(), gn: Object.keys(lg.gn||{}), sc: Object.keys(lg.sc||{}), reg: Object.keys(lg.reg||{}), fresh: lg.fresh, n: (lg.order||[]).length};
        }""")
        chk('fresh wipe removes test sign-up slime and any test scores',
            wiped['order']==['lkhost:nathe','lkhost:nate'] and wiped['gn']==['lkhost:nathe','lkhost:nate'] and wiped['sc']==[]
            and len(wiped['reg'])==6 and wiped['fresh']>=1794401520000
            and 'slime' not in str(wiped) and 'gkv6txy' not in wiped['order'])

        # Host can still use the app; registering Nathaniel Stride is not blocked as a duplicate.
        added = page.evaluate("""() => {
          const lg = lkEnsure();
          lg.order = []; lg.gn = {}; lg.reg = {};
          const r = lkApplyReg({name:'Nathaniel Stride',night:'2026-11-18',at:Date.now(),bow:'Compound'}, lg);
          const host = lkCanHost(lg);
          /* reset so the on-screen empty-list checks stay valid */
          lg.order = []; lg.gn = {}; lg.reg = {}; lg.dirty = 1;
          return {ok:!!(r&&r.ok), id:r&&r.id, first:!!(r&&r.first), host:!!host};
        }""")
        chk('Nathaniel Stride can register on an empty list and the host can still use the app',
            added.get('ok') and added.get('host') and added.get('id') and added.get('first'))

        # classic host screen

        page.evaluate("() => { lkEnsure(); lkView('LINGKN26'); }")
        page.wait_for_selector('#lgview h1 .lk-beta', timeout=5000)
        text = page.inner_text('#lgview') + page.inner_text('#lkhost')
        chk('league screen shows a small Beta label', page.locator('#lgview h1 .lk-beta').count()>=1)
        chk('Invite a tester UI is gone', page.locator('#lkivid').count()==0 and 'Invite a tester' not in text)
        href = page.get_attribute('#lkregurl', 'href') or ''
        chk('poster register link is the live lk-register.html URL and is clickable',
            href=='https://nfstride1-ux.github.io/scoretool-demo/lk-register.html' and page.locator('a#lkregurl').count()==1)
        chk('Share button sits with the register link; no swap-LK_PUBLIC_BASE note',
            page.locator('#lkregshare').count()==1 and 'swap LK_PUBLIC' not in text and 'LK_PUBLIC_BASE' not in text)
        chk('host has a Registered archers button', page.locator('#lkarchgo').count()==1)
        chk('fresh league lists no registered archers and empty nights',
            'No scores yet' in text or page.locator('#lktab tbody tr').count()<=1)
        chk('in the league count is the organiser Nate Evans', 'In the league: 1 archer' in text)

        page.click('#lkarchgo')
        page.wait_for_selector('#lkarchpage', timeout=5000)
        title=(page.locator('#lkarchpage h1').inner_text() or '').lower()
        chk('Registered archers is a host-only page', page.locator('#lkarchpage').count()>=1 and title.startswith('registered archers'))
        # add a name-only shooter to tick
        page.fill('#lkgname', 'Alex River')
        page.click('#lkgadd')
        page.wait_for_timeout(300)
        chk('added shooter appears by full name on the registered list', 'Alex River' in page.inner_text('#lkhostarchlist'))
        page.locator('#lkhostarchlist .lk-archname', has_text='Alex River').click()
        row = page.locator('#lkhostarchlist .lk-archrow', has_text='Alex River')
        ticks = row.locator('.lk-paidtick')
        row.locator('.lk-archpaid').wait_for(state='visible', timeout=3000)
        chk('expanded row has Paid ticks for the six 660 nights only', ticks.count()==6)
        labels = ticks.all_inner_texts()
        chk('paid nights are 18 Nov, 2 Dec, 16 Dec, 30 Dec, 13 Jan, 27 Jan',
            all(x in ' '.join(labels) for x in ['18 Nov','2 Dec','16 Dec','30 Dec','13 Jan','27 Jan']))
        ticks.nth(0).locator('input').check()
        paid = page.evaluate("() => { const lg=lkEnsure(); return !!(lg.paid && lg.paid['2026-11-18'] && Object.values(lg.paid['2026-11-18']).some(Boolean)) && !!lg.dirty && !!lg.paidt; }")
        chk('paid tick saves on the league record and marks it to sync', paid is True)

        # public register must not show paid ticks or the host list
        page.evaluate("lkRegisterView()")
        page.wait_for_timeout(200)
        rtxt = page.inner_text('body')
        chk('public register has no paid ticks and no host Registered archers tools',
            page.locator('#lkarchpage').count()==0 and page.locator('[data-lkpaid]').count()==0 and 'Tick who paid' not in rtxt and page.locator('#lkgadd').count()==0)
        href_app = page.get_attribute('#lkgetapp', 'href') or ''
        hint = page.inner_text('#lkgetbox') if page.locator('#lkgetbox').count() else ''
        chk('Get ScoreTool button is on the register page and opens the live app',
            page.locator('a#lkgetapp').count()==1 and href_app=='https://nfstride1-ux.github.io/scoretool-demo/' and (page.locator('a#lkgetapp').inner_text() or '').strip()=='Get ScoreTool')
        chk('Get ScoreTool line explains Add to Home Screen',
            'Add to Home Screen' in hint and 'Share' in hint and 'menu' in hint)

        # local registration save only: h2hPost is replaced, and guard stubs any ntfy.sh call
        page.evaluate("() => { window._lkPosts=[]; window.h2hPost=function(){window._lkPosts.push([].slice.call(arguments));return Promise.resolve()}; }")
        page.fill('#lkregname', 'Local Test Archer')
        page.fill('#lkregbow', 'Recurve')
        if page.locator('#lkregpin').count():
            page.fill('#lkregpin', '1234')
            page.fill('#lkregpin2', '1234')
        page.click('#lkreggo')
        page.wait_for_timeout(400)
        saved = page.evaluate("""() => {
          const msg = (document.querySelector('#lkregmsg')||{}).textContent||'';
          const lg = typeof lkEnsure==='function'?lkEnsure():null;
          const names=[];
          const reg=(lg&&lg.reg)||{};
          for (const k of Object.keys(reg)) for (const r of (reg[k]||[])) names.push(r.name||'');
          const orderNames=(lg&&lg.order||[]).map(id => (lg.gn&&lg.gn[id]&&lg.gn[id].n)||id);
          const btn=document.querySelector('a#lkgetapp');
          return {msg, names, orderNames, href:btn&&btn.getAttribute('href'), label:(btn&&btn.textContent||'').trim(), posts:window._lkPosts||[]};
        }""")
        chk('register form saves a local sign-up and shows the confirmation',
            'You are registered' in saved['msg'] and ('Local Test Archer' in saved['names'] or 'Local Test Archer' in saved['orderNames']))
        chk('Get ScoreTool button is still visible after saving, same live app link',
            page.locator('a#lkgetapp').count()==1 and page.locator('a#lkgetapp').is_visible() and saved['href']=='https://nfstride1-ux.github.io/scoretool-demo/' and saved['label']=='Get ScoreTool')
        # The app would post the sign-up to the live topic; our in-memory stub must catch it so it never reaches ntfy.
        caught = any(isinstance(p, list) and len(p)>=2 and p[0]=='scoretool-h2h-q7m4-lg-lingkn26-live2'
                     and (p[1] or {}).get('k')=='lkreg'
                     and ((p[1] or {}).get('rec') or {}).get('name')=='Local Test Archer'
                     for p in (saved.get('posts') or []))
        chk('register post was captured in-memory, not sent to the live relay', caught)

        # Tick-box group picker: seed local names only, keep h2hPost stubbed so nothing hits the live relay
        page.evaluate("""() => {
          window._lkPosts = window._lkPosts || [];
          window.h2hPost = function(){window._lkPosts.push([].slice.call(arguments));return Promise.resolve()};
          window._lkAuthed = 'LINGKN26';
          try { sessionStorage.setItem('scoretool.lk.auth','LINGKN26'); } catch(e) {}
          try { localStorage.removeItem('scoretool.lk.reg'); } catch(e) {}
          const lg = lkEnsure();
          lg.order = []; lg.gn = {}; lg.reg = {}; lg.grp = {}; lg.claim = {}; lg.sc = {};
          const add = (name, tonight) => {
            const r = lkApplyReg({name, night: tonight ? '2026-11-18' : '2026-12-02', at: Date.now()}, lg);
            if (r && r.ok && !tonight && lg.reg && lg.reg['2026-12-02']) {
              /* keep them in the season list only */
              delete lg.reg['2026-12-02'];
            }
            return r && r.id;
          };
          const ids = {
            sam: add('Sam Archer', true),
            jordan: add('Jordan Lee', true),
            riley: add('Riley Chen', true),
            alex: add('Alex River', true),
            morgan: add('Morgan Blake', false),
            casey: add('Casey Ng', false)
          };
          window._lkTestIds = ids;
          window._lkFlowNight = 1;
          window._lkPicked = [];
          window._lkFromLeague = 1;
          try { localStorage.removeItem('scoretool.lk.reg'); } catch(e) {}
        }""")
        page.evaluate("() => { lkView('LINGKN26'); }")
        page.wait_for_selector('#lkgrp', timeout=5000)
        gtxt = page.inner_text('#lkgrp')
        chk('league groups card has no filter box, name dropdown or Add to group',
            page.locator('#lkpickq').count()==0 and page.locator('#lkpick').count()==0 and page.locator('#lkaddg').count()==0
            and page.locator('#lkgrptab').count()==0 and 'Add to group' not in gtxt and page.locator('#lkpickgrp').count()==1)
        page.click('#lkpickgrp')
        page.wait_for_selector('#lkselect', timeout=5000)
        names = page.locator('#lkarchlist .lk-row .nm').all_inner_texts()
        heads = page.locator('#lkarchlist .lk-tgt').all_inner_texts()
        chk('picker lists tonight\'s sign-ups first, then the rest of the league, by full name',
            names[:4]==['Sam Archer','Jordan Lee','Riley Chen','Alex River']
            and 'Morgan Blake' in names and 'Casey Ng' in names
            and names.index('Sam Archer') < names.index('Morgan Blake')
            and any('tonight' in h.lower() for h in heads) and any('league' in h.lower() or 'registered' in h.lower() for h in heads))
        chk('picker has Back and Start (0) and no testers who are not registered',
            page.locator('#lkbacklogin').count()==1 and 'Back' in (page.locator('#lkbacklogin').inner_text() or '')
            and 'Start (0)' in (page.locator('#lkstart').inner_text() or '')
            and 'Logan' not in ' '.join(names) and 'Dana Chapman' not in ' '.join(names))
        for lab in ['Sam Archer','Jordan Lee','Riley Chen','Alex River']:
            page.locator('.lk-row', has_text=lab).locator('input').check()
            page.wait_for_timeout(80)
        chk('Start label shows 4 after four ticks', 'Start (4)' in (page.locator('#lkstart').inner_text() or ''))
        page.locator('.lk-row', has_text='Morgan Blake').click()
        page.wait_for_timeout(200)
        msg5 = page.inner_text('#lkselmsg') or ''
        morgan_on = page.locator('.lk-row', has_text='Morgan Blake').locator('input').is_checked()
        chk('a fifth tick is blocked with a short message and is not selected',
            (not morgan_on) and ('up to 4' in msg5.lower() or 'at most 4' in msg5.lower() or '4 archers' in msg5.lower())
            and 'Start (4)' in (page.locator('#lkstart').inner_text() or ''))
        page.click('#lkstart')
        page.wait_for_selector('#lgentry, #lksheet', timeout=5000)
        started = page.evaluate("""() => {
          const ids = window._lkScoreIds || [];
          const lg = lkEnsure();
          const G = (((lg.grp||{})[1]||{}).g||[]);
          const names = ids.map(id => (typeof lkStandName==='function'&&lkStandName(id,lg))||id);
          return {ids, names, groups: G.length, g0: (G[0]||[]).slice(), entry: !!document.getElementById('lgentry')};
        }""")
        chk('Start opens scoring with the four ticked archers as one group',
            started.get('entry') and started.get('groups')==1 and started.get('names')==['Sam Archer','Jordan Lee','Riley Chen','Alex River'])

        # Back to the picker and free those four so a second group can be started; they must then lock
        page.evaluate("() => { window._lkScoreMode=null; if (typeof lkFlowSelect==='function') lkFlowSelect(); }")
        page.wait_for_selector('#lkselect', timeout=5000)
        # untick the four (releases this phone's claim); they stay in group 1 so they should lock
        for lab in ['Sam Archer','Jordan Lee','Riley Chen','Alex River']:
            box = page.locator('.lk-row', has_text=lab).locator('input')
            if box.is_checked():
                box.uncheck()
                page.wait_for_timeout(80)
        page.wait_for_timeout(200)
        locks = page.evaluate("""() => {
          return [...document.querySelectorAll('#lkarchlist .lk-row')].map(r => ({
            name: (r.querySelector('.nm')||{}).textContent||'',
            locked: r.classList.contains('locked'),
            disabled: !!(r.querySelector('input')||{}).disabled,
            padlock: !!r.querySelector('.lk-padlock')
          }));
        }""")
        taken = [r for r in locks if r['name'] in ('Sam Archer','Jordan Lee','Riley Chen','Alex River')]
        free = [r for r in locks if r['name'] in ('Morgan Blake','Casey Ng')]
        chk('first group names are locked with a padlock and are not tickable for a second group',
            len(taken)==4 and all(r['locked'] and r['disabled'] and r['padlock'] for r in taken)
            and len(free)==2 and all((not r['locked']) and (not r['disabled']) for r in free))
        page.locator('.lk-row', has_text='Morgan Blake').locator('input').check()
        page.wait_for_timeout(80)
        page.locator('.lk-row', has_text='Casey Ng').locator('input').check()
        page.wait_for_timeout(80)
        page.click('#lkstart')
        page.wait_for_selector('#lgentry, #lksheet', timeout=5000)
        second = page.evaluate("""() => {
          const lg = lkEnsure();
          const G = (((lg.grp||{})[1]||{}).g||[]);
          const nm = id => (typeof lkStandName==='function'&&lkStandName(id,lg))||id;
          return {n: G.length, g0: (G[0]||[]).map(nm), g1: (G[1]||[]).map(nm), score: (window._lkScoreIds||[]).map(nm)};
        }""")
        chk('second group starts with the remaining archers and leaves the first group in place',
            second.get('n')==2 and second.get('g0')==['Sam Archer','Jordan Lee','Riley Chen','Alex River']
            and second.get('g1')==['Morgan Blake','Casey Ng'] and second.get('score')==['Morgan Blake','Casey Ng'])

        # non-host cannot open the paid page or see pot ticks
        ctx2 = b.new_context(viewport={'width': 390, 'height': 844})
        p2 = ctx2.new_page()
        go(p2, 'logan')
        sneak = p2.evaluate("""() => {
          const lg = lkEnsure();
          const can = lkCanHost(lg);
          lkHostArchersView();
          const page = !!document.getElementById('lkarchpage');
          const pot = lkPotHTML(lg);
          return {can, page, pot: pot || ''};
        }""")
        chk('non-host cannot open Registered archers and does not see paid/pot ticks',
            sneak['can'] is False and sneak['page'] is False and sneak['pot']=='')
        ctx2.close()
        b.close()
finally:
    srv.terminate()

print(f'\n{len(ok)} passed, {len(bad)} failed')
if bad:
    print('FAILED:', bad)
    sys.exit(1)
