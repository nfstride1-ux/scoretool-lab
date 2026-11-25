# Lingkana registration link, shared passcode, and automatic groups of 4.
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

PORT = '8803'
BASE = f'http://localhost:{PORT}'
SHOT = Path('/opt/cursor/artifacts')
SHOT.mkdir(parents=True, exist_ok=True)
REG = 'https://nfstride1-ux.github.io/scoretool-demo/lk-register.html'

srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome',
                              args=['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'])
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        page = ctx.new_page()
        page.goto(f'{BASE}/#lk-register', wait_until='networkidle')
        page.wait_for_selector('#lkregpage', timeout=8000)
        reg = page.inner_text('#lkregpage')
        chk('register page has name and optional bow, email and phone, and no shoot night',
            page.locator('#lkregname').count()==1 and page.locator('#lkregnight').count()==0
            and page.locator('#lkregbow').count()==1 and page.locator('#lkregemail').count()==1
            and page.locator('#lkregphone').count()==1
            and 'register for the lingkana league' in reg.lower(),
            reg[:180])
        chk('register page has no invite-code field',
            page.locator('#lkregcode').count()==0 and 'invite code' not in reg.lower() and 'poster' not in reg.lower(),
            reg[:240])
        qr = page.evaluate("""(url) => {
          const box = document.getElementById('lkregqr');
          const live = document.querySelector('#lkqrsvg svg path');
          const qr = qrcode(0, 'M');
          qr.addData(url);
          qr.make();
          const hold = document.createElement('div');
          hold.innerHTML = qr.createSvgTag({cellSize:4, margin:2, scalable:true});
          const again = hold.querySelector('path');
          const imgs = [...document.querySelectorAll('#lkregqr img')].map(i => i.getAttribute('src')||'');
          const d = live && live.getAttribute('d') || '';
          return {data: box && box.getAttribute('data-url'), same: !!d && d===(again && again.getAttribute('d')),
                  svg: d.length>100, external: imgs.some(s => /^https?:/i.test(s))};
        }""", REG)
        chk('QR is drawn on this phone for the registration link',
            qr.get('data')==REG and qr.get('same') and qr.get('svg') and not qr.get('external'), str(qr))
        chk('the registration link text is unchanged',
            (page.locator('#lkreglink').inner_text() or '').strip()==REG
            and (page.get_attribute('#lkreglink','href') or '')==REG)
        chk('Print QR is gone and Share link is on the card',
            page.locator('#lkqrprint').count()==0 and page.locator('#lkqrshare').count()==1
            and (page.locator('#lkqrshare').inner_text() or '').strip()=='Share link'
            and 'Print QR' not in page.inner_text('#lkregqr'))
        page.locator('#lkregqr').screenshot(path=str(SHOT / 'lingkana-share-link-390.png'))
        page.evaluate("""(url) => {
          window.__shares = [];
          window.__copies = [];
          window.__printed = 0;
          window.print = () => { window.__printed += 1; };
          const share = async (d) => { window.__shares.push({title:d.title, text:d.text, url:d.url}); };
          const writeText = async (t) => { window.__copies.push(t); };
          try { Object.defineProperty(navigator, 'share', {configurable:true, writable:true, value:share}); }
          catch(e) { navigator.share = share; }
          try { Object.defineProperty(navigator, 'clipboard', {configurable:true, writable:true, value:{writeText}}); }
          catch(e) { navigator.clipboard = {writeText}; }
        }""", REG)
        page.locator('#lkqrshare').click()
        page.wait_for_timeout(150)
        shared = page.evaluate("() => ({shares:window.__shares, copies:window.__copies.slice(), msg:(document.querySelector('#lkqrsharemsg')||{}).textContent||'', printed:window.__printed})")
        chk('Share link calls navigator.share with the register link',
            shared['shares']==[{'title':'Register for the Lingkana League','text':'Register for the Lingkana League','url':REG}]
            and shared['copies']==[] and shared['msg']!='Link copied' and shared['printed']==0,
            str(shared))
        page.evaluate("""() => {
          window.__shares = [];
          window.__copies = [];
          const fail = async () => { const e = new Error('cancelled'); e.name = 'AbortError'; throw e; };
          try { Object.defineProperty(navigator, 'share', {configurable:true, writable:true, value:fail}); }
          catch(e) { navigator.share = fail; }
          const msg = document.querySelector('#lkqrsharemsg'); if (msg) msg.textContent = '';
        }""")
        page.locator('#lkqrshare').click()
        page.wait_for_function("() => (document.querySelector('#lkqrsharemsg')||{}).textContent==='Link copied'")
        cancelled = page.evaluate("() => ({copies:window.__copies.slice(), msg:document.querySelector('#lkqrsharemsg').textContent, shown:document.querySelector('#lkqrsharemsg').getClientRects().length>0})")
        chk('a cancelled share copies the link and shows Link copied',
            cancelled['copies']==[REG] and cancelled['msg']=='Link copied' and cancelled['shown'],
            str(cancelled))
        page.evaluate("""() => {
          window.__copies = [];
          try { Object.defineProperty(navigator, 'share', {configurable:true, writable:true, value:undefined}); }
          catch(e) { navigator.share = undefined; }
          const msg = document.querySelector('#lkqrsharemsg'); if (msg) msg.textContent = '';
        }""")
        page.locator('#lkqrshare').click()
        page.wait_for_function("() => (document.querySelector('#lkqrsharemsg')||{}).textContent==='Link copied'")
        missing = page.evaluate("() => ({copies:window.__copies.slice(), msg:document.querySelector('#lkqrsharemsg').textContent, shown:document.querySelector('#lkqrsharemsg').getClientRects().length>0})")
        chk('without share the link is copied and Link copied is visible',
            missing['copies']==[REG] and missing['msg']=='Link copied' and missing['shown'],
            str(missing))
        page.locator('#lkregpage').screenshot(path=str(SHOT / 'lingkana-register-390.png'))
        page.fill('#lkregname', 'Sam Archer')
        page.fill('#lkregbow', 'Recurve')
        page.fill('#lkregemail', 'sam@example.com')
        page.fill('#lkregphone', '0400111222')
        page.fill('#lkregpin', '1234')
        page.fill('#lkregpin2', '1234')
        page.locator('#lkreggo').click()
        page.wait_for_selector('#lkregok', timeout=4000)
        saved = page.evaluate("""() => {
          const lg = lkEnsure();
          const row = ((lg.reg||{})['2026-11-18']||[]).find(r => r && r.name==='Sam Archer');
          const dec = ((lg.reg||{})['2026-12-02']||[]).some(r => r && r.name==='Sam Archer');
          const jan = ((lg.reg||{})['2027-01-27']||[]).some(r => r && r.name==='Sam Archer');
          return {msg: (document.querySelector('#lkregok')||{}).textContent||'',
                  id: row && row.id, bow: row && row.bow, email: row && row.email, dec, jan};
        }""")
        chk('a name can be registered once for every shoot night, with no invite code',
            'Lingkana League' in saved['msg'] and saved.get('id') and saved.get('bow')=='Recurve'
            and saved.get('email')=='sam@example.com' and saved['dec'] and saved['jan'],
            str(saved))

        seeded = page.evaluate("""() => {
          const lg = lkEnsure();
          const night = '2026-11-18';
          const names = ['Alex River','Casey Ng','Jordan Lee','Riley Chen','Morgan Blake'];
          const ids = {sam: ((lg.reg[night]||[]).find(r => r.name==='Sam Archer')||{}).id};
          names.forEach(name => {
            const r = lkApplyReg({name, night, at: Date.now()}, lg);
            ids[name] = r && r.id;
          });
          lg.paid = lg.paid || {};
          lg.paid[night] = {};
          ['sam','Alex River','Casey Ng','Jordan Lee','Riley Chen'].forEach(k => { lg.paid[night][ids[k]] = 1; });
          window._lkFlowNight = 1;
          window._lkAuthed = null;
          try { sessionStorage.removeItem('scoretool.lk.auth'); sessionStorage.removeItem('scoretool.lk.scorerId'); } catch(e) {}
          const built = lkAssignGroups(lg, 1);
          const flat = (built.groups||[]).map(g => g.names);
          return {ids, mode: built.mode, flat, waiting: (built.waiting||[]).map(p => p.name), remainder: built.remainder};
        }""")
        chk('night 1 with 5 paid archers is a group of 3 then a group of 2',
            seeded['mode']=='alpha'
            and seeded['flat']==[['Alex River','Casey Ng','Jordan Lee'],['Riley Chen','Sam Archer']]
            and seeded['waiting']==[],
            str(seeded['flat']))
        chk('an unpaid registrant is not in a group',
            'Morgan Blake' not in [n for g in seeded['flat'] for n in g])

        page.evaluate("() => lkFlowHome('LINGKN26')")
        page.wait_for_selector('#lklogin', timeout=5000)
        page.locator('#lklogin').click()
        page.wait_for_selector('#lkscorernames', timeout=5000)
        labels = page.locator('#lkscorernames .lk-namebtn').all_inner_texts()
        chk('login lists only the archer registered on this phone',
            page.locator('input#lkscorer').count()==0
            and page.locator('#lknight option').count()==6
            and labels==['Sam Archer']
            and page.locator('#lkshowall').count()==1,
            str(labels)+' nights='+str(page.locator('#lknight option').count()))
        page.screenshot(path=str(SHOT / 'lingkana-login-names-390.png'), full_page=False)
        chk('Sam already has a PIN, so the return login does not ask for the event passcode',
            page.locator('#lkpin').is_visible() and not page.locator('#lkpassbox').is_visible())
        page.fill('#lkfind', 'Alex')
        page.wait_for_timeout(80)
        found = page.locator('#lkscorernames .lk-namebtn').all_inner_texts()
        chk('a name search finds another archer without the event passcode',
            found==['Alex River'], str(found))
        page.fill('#lkfind', '')
        page.locator('#lkshowall').click()
        page.locator('#lkscorernames .lk-namebtn', has_text='Alex River').wait_for(timeout=8000)
        labels = page.locator('#lkscorernames .lk-namebtn').all_inner_texts()
        chk('Show all names lists every registered archer without the event passcode',
            labels==['Alex River','Casey Ng','Jordan Lee','Morgan Blake','Nate Evans','Nathaniel Stride','Riley Chen','Sam Archer'],
            str(labels))
        page.locator('#lkscorernames .lk-namebtn', has_text='Alex River').click()
        page.fill('#lkpin', '4321')
        page.fill('#lkpin2', '4321')
        page.fill('#lkpw', os.environ['LK_TEST_PASSCODE'].lower())
        page.locator('#lkpwgo').click()
        page.wait_for_timeout(400)
        chk('a passcode other than the real one is refused',
            'not right' in (page.inner_text('#lkpwmsg') or '').lower() and page.locator('#lkassigned').count()==0)
        page.fill('#lkpin', '4321')
        page.fill('#lkpw', os.environ['LK_TEST_PASSCODE'])
        page.locator('#lkpwgo').click()
        page.wait_for_selector('#lkassigned', timeout=5000)
        group = page.inner_text('#lkassigned')
        chk('login opens Alex River on target 1 with the first three names',
            page.locator('#lktargets').count()==0
            and page.get_attribute('#lkassigned','data-target')=='1'
            and 'target 1' in group.lower() and 'Alex River (you)' in group
            and 'Casey Ng' in group and 'Jordan Lee' in group
            and 'Riley Chen' not in group and 'Sam Archer' not in group
            and 'This target has 3 archers.' in group,
            group[:300])
        page.screenshot(path=str(SHOT / 'lingkana-assigned-group-390.png'), full_page=False)

        page.evaluate("""() => {
          try { sessionStorage.setItem('scoretool.lk.scorerId', (lkEnsure().reg['2026-11-18'].find(r=>r.name==='Morgan Blake')||{}).id); } catch(e) {}
          window._lkAuthed = 'LINGKN26';
          lkFlowAssigned();
        }""")
        page.wait_for_timeout(200)
        unpaid = page.inner_text('#lkassigned')
        chk('an unpaid name is told they are not in a group',
            page.get_attribute('#lkassigned','data-target')=='0' and 'paid list' in unpaid.lower(),
            unpaid[:200])

        page.evaluate("""() => { if (typeof lkMarkCoHost==='function') lkMarkCoHost(false); lkFlowHome('LINGKN26'); }""")
        page.wait_for_selector('#lklogin', timeout=4000)
        chk('before Nate logs in, this phone cannot tick paid',
            page.evaluate("() => lkCanHost(lkEnsure())") is False)
        page.locator('#lklogin').click()
        page.wait_for_selector('#lkscorernames', timeout=4000)
        page.locator('#lkshowall').click()
        page.locator('#lkscorernames .lk-namebtn', has_text='Nate Evans').wait_for(timeout=4000)
        page.locator('#lkscorernames .lk-namebtn', has_text='Nate Evans').click()
        if page.locator('#lkpin2').count():
            page.fill('#lkpin', '2580')
            page.fill('#lkpin2', '2580')
        elif page.locator('#lkpin').count():
            page.fill('#lkpin', '2580')
        page.fill('#lkpw', os.environ['LK_TEST_PASSCODE'])
        page.locator('#lkpwgo').click()
        page.wait_for_selector('#lkpaidlist input[data-lkpaid]', timeout=5000)
        nate = page.inner_text('#lkpot')
        chk('Nate Evans login opens the host paid list',
            page.locator('#lkpot').count()==1 and page.locator('#lkpaidlist').count()==1)
        chk('Nate sees who is registered and can tick paid',
            page.locator('#lkpaidlist .lk-paidrow').count()>=5
            and page.locator('#lkpaidlist input[data-lkpaid]').count()>=5
            and 'Tick who paid' in nate
            and 'Morgan Blake' in page.inner_text('#lkpaidlist'),
            nate[:240])
        page.locator('#lkpaidlist .lk-paidrow', has_text='Morgan Blake').locator('input').check()
        page.wait_for_selector('#lkpaidlist input[data-lkpaid]', timeout=4000)
        ticked = page.evaluate("""() => {
          const lg = lkEnsure();
          const night = '2026-11-18';
          const id = ((lg.reg[night]||[]).find(r => r.name==='Morgan Blake')||{}).id;
          return {id, on: !!(lg.paid && lg.paid[night] && lg.paid[night][id]), host: lkCanHost(lg)};
        }""")
        chk('Nate ticking paid saves on the same paid list',
            ticked['host'] is True and ticked['on'] is True and bool(ticked['id']),
            str(ticked))
        chk('the host paid list has a Remove button', page.locator('#lkpaidlist .lk-remove').count()>=5)
        page.wait_for_timeout(400)
        page.evaluate("() => { const el=document.getElementById('lkpaidlist'); if(el) el.scrollIntoView({block:'center'}); }")
        page.wait_for_timeout(200)
        page.screenshot(path=str(SHOT / 'lingkana-nate-paid-390.png'), full_page=False)
        page.locator('#lkpaidlist .lk-paidrow', has_text='Morgan Blake').locator('.lk-remove').click()
        page.wait_for_selector('.lk-dropask', timeout=4000)
        chk('Remove asks before it deletes', 'Morgan Blake' in (page.inner_text('.lk-dropask') or ''))
        page.locator('.lk-dropask .lk-remove').click()
        page.wait_for_timeout(500)
        gone=page.evaluate("""() => {
          const lg=lkEnsure();
          const names=[];
          for (const night of Object.keys(lg.reg||{})) for (const r of (lg.reg[night]||[])) names.push(r.name);
          return {listed: (document.getElementById('lkpaidlist')||{}).innerText||'', names, drop: Object.keys(lg.drop||{})};
        }""")
        chk('confirmed Remove drops that archer from the league',
            'Morgan Blake' not in gone['listed'] and 'Morgan Blake' not in gone['names'] and len(gone['drop'])>=1,
            str(gone)[:300])
        page.evaluate("() => { lkMarkCoHost(false); }")
        chk('clearing Nate Evans login removes the paid-tick permission on this phone',
            page.evaluate("() => lkCanHost(lkEnsure())") is False)

        ranked = page.evaluate("""() => {
          const lg = lkEnsure();
          const n1 = '2026-11-18', n2 = '2026-12-02';
          const end = (v) => ({e:[[v,v,v]], u:1});
          const scores = {'Alex River':'5','Casey Ng':'X','Jordan Lee':'9','Riley Chen':'1','Sam Archer':'10'};
          const ids = {};
          (lg.reg[n1]||[]).forEach(r => { ids[r.name]=r.id; });
          lg.sc = lg.sc || {};
          Object.entries(scores).forEach(([name,v]) => { lg.sc[ids[name]] = {1: end(v)}; });
          ['Alex River','Casey Ng','Jordan Lee','Riley Chen','Sam Archer'].forEach(name => {
            lkApplyReg({name, night:n2, at:Date.now(), id:ids[name]}, lg);
          });
          lg.paid[n2] = {};
          Object.values(ids).forEach(id => { if(id) lg.paid[n2][id]=1; });
          delete lg.paid[n2][ids['Morgan Blake']];
          delete lg.paid[n2][ids['Nate Evans']];
          delete lg.paid[n2][ids['Nathaniel Stride']];
          const built = lkAssignGroups(lg, 2);
          return {mode: built.mode, flat: (built.groups||[]).map(g => g.names), prior: lkHasPriorResult(lg, 2)};
        }""")
        chk('a later night groups by best-4 so far, not by name',
            ranked['prior'] is True and ranked['mode']=='rank'
            and ranked['flat']==[['Casey Ng','Sam Archer','Jordan Lee'],['Alex River','Riley Chen']],
            str(ranked))

        sizes = page.evaluate("""() => {
          const out = [];
          for (let n=1;n<=52;n++) out.push({n, sizes: lkGroupSizes(n)});
          const one = lkChunkFour([{id:'only', name:'Only One'}]);
          return {out, solo: (one.solo||[]).map(p=>p.name), oneGroups: one.groups.length};
        }""")
        want = {5:[3,2], 6:[3,3], 7:[4,3], 9:[3,3,3], 10:[4,3,3], 13:[4,3,3,3], 52:[4]*13}
        bad_sizes = []
        for row in sizes['out']:
            n, got = row['n'], row['sizes']
            if n==1:
                if got is not None: bad_sizes.append('1 should not be grouped')
                continue
            if not got or sum(got)!=n or any(s not in (2,3,4) for s in got):
                bad_sizes.append(f'{n}:{got}')
                continue
            if n not in (2,5) and 2 in got:
                bad_sizes.append(f'{n} has a 2:{got}')
            if n in want and got!=want[n]:
                bad_sizes.append(f'{n} expected {want[n]} got {got}')
            if len(got)>13:
                bad_sizes.append(f'{n} uses more than 13 targets')
        chk('group sizes for 1 to 52 prefer 4, then 3, then 2, and never a lone 1',
            bad_sizes==[] and sizes['oneGroups']==0 and sizes['solo']==['Only One'],
            str(bad_sizes[:8]))

        cap = page.evaluate("""() => {
          try { localStorage.removeItem('scoretool.lk.reg'); } catch(e) {}
          const lg = lkEnsure();
          lg.order=[]; lg.gn={}; lg.reg={}; lg.paid={}; lg.sc={};
          const night='2026-11-18';
          let failed=null;
          for (let i=1;i<=52;i++){
            const name='P'+String(i).padStart(2,'0');
            const r=lkApplyReg({name, night, at:1}, lg);
            if(!r.ok){failed=r.msg; break}
          }
          const extra=lkApplyReg({name:'Past Cap', night, at:1}, lg);
          const again=lkApplyReg({name:'P01', night:'2026-12-02', at:2}, lg);
          return {count: lkKnownRegistrants(lg).length, failed, extraOk: !!(extra&&extra.ok), extraMsg: extra&&extra.msg,
                  again: !!(again&&again.ok), onNight2: ((lg.reg['2026-12-02']||[]).some(r=>r.name==='P01'))};
        }""")
        chk('the league closes at 52 registered archers, and an existing name can still add a night',
            cap['count']==52 and cap['failed'] is None and cap['extraOk'] is False
            and cap['extraMsg']=='This league already has 52 archers. Registration is closed.'
            and cap['again'] is True and cap['onNight2'] is True,
            str(cap))

        wiped = page.evaluate("""() => {
          const lg = lkEnsure();
          lg.fresh = 1;
          lg.order = ['gvv8rr3'];
          lg.gn = {gvv8rr3:{n:'Ada Archer', t:1}};
          lg.reg = {'2026-11-18':[{id:'gvv8rr3', name:'Ada Archer', at:1}]};
          lg.paid = {'2026-11-18':{gvv8rr3:1}};
          lg.grp = {1:{t:1,g:[['gvv8rr3']]}};
          try { localStorage.setItem('scoretool.lk.reg', JSON.stringify([{name:'Ada Archer', at:1}])); } catch(e) {}
          lkFresh(lg);
          const after = {
            names: ((lg.reg||{})['2026-11-18']||[]).map(r=>r.name),
            order: (lg.order||[]).slice(),
            fresh: lg.fresh,
            inbox: localStorage.getItem('scoretool.lk.reg')
          };
          const oldSnap = lgMerge(lg, {k:'ls', code:lg.code, by:'steven', fresh:1794401520000, t:Date.now(), format:'lingkana',
            reg:{'2026-11-18':[{id:'gvv8rr3', name:'Ada Archer', at:1}]},
            order:['gvv8rr3'], gn:{gvv8rr3:{n:'Ada Archer', t:1}}});
          const kept = ((lg.reg||{})['2026-11-18']||[]).some(r=>r.name==='Ada Archer');
          const r = lkApplyReg({name:'Ada Archer', id:'gvv8rr3', at:Date.now()}, lg);
          const id = r && r.id;
          lkMarkCoHost(true);
          const msg = lkDropArcher(id);
          const snap = lgMerge(lg, {k:'ls', code:lg.code, by:'nathe', fresh:LK_FRESH, t:Date.now()+5, format:'lingkana',
            reg:{'2026-11-18':[{id:id, name:'Ada Archer', at:1}]}, order:[id]});
          const back = ((lg.reg||{})['2026-11-18']||[]).some(r=>r&&r.name==='Ada Archer');
          return {after, oldSnap, kept, msg, snap, back, fresh: lg.fresh};
        }""")
        chk('the fresh cut wipes Ada Archer and an older snapshot cannot put the name back',
            wiped['after']['names']==['Nathaniel Stride','Nate Evans'] and wiped['after']['order']==['lkhost:nathe','lkhost:nate']
            and 'Ada Archer' not in wiped['after']['names']
            and wiped['after']['inbox'] in (None,'null','[]')
            and wiped['after']['fresh']==1794881040000 and wiped['oldSnap'] is False and wiped['kept'] is False,
            str(wiped)[:400])
        chk('a host Remove tombstone survives a later snapshot that still lists the archer',
            wiped['msg']=='' and wiped['back'] is False,
            str(wiped)[:400])

        onion = page.evaluate("""() => {
          if (typeof lkFlowHome==='function') lkFlowHome('ONIONSH2');
          return true;
        }""")
        page.wait_for_selector('#lklogin', timeout=4000)
        page.locator('#lklogin').click()
        page.wait_for_selector('#lkloginpage', timeout=4000)
        chk('Onion Shed login still has a typed name',
            onion and page.locator('input#lkscorer').count()==1 and page.locator('#lkscorernames').count()==0)

        # Cross-phone sync on a local stand-in for ntfy. Nothing is posted to the live topic.
        import json as _json, threading
        from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
        box={'msgs':[], 'n':0}
        class Relay(BaseHTTPRequestHandler):
            def log_message(self, *a):
                pass
            def do_POST(self):
                n=int(self.headers.get('Content-Length') or 0)
                body=self.rfile.read(n)
                box['n']+=1
                box['msgs'].append(('s%d'%box['n'], body.decode()))
                self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
            def do_GET(self):
                q=self.path.split('since=',1)[-1] if 'since=' in self.path else 'all'
                since=q.split('&')[0]
                use=list(box['msgs'])
                if since not in ('all','','None'):
                    seen=False; use=[]
                    for mid,body in box['msgs']:
                        if seen: use.append((mid,body))
                        if mid==since: seen=True
                    if not seen: use=list(box['msgs'])
                data=''.join(_json.dumps({'id':mid,'event':'message','message':body})+'\n' for mid,body in use).encode()
                self.send_response(200)
                self.send_header('content-type','application/x-ndjson')
                self.send_header('access-control-allow-origin','*')
                self.end_headers(); self.wfile.write(data)
        relay=ThreadingHTTPServer(('127.0.0.1', 8821), Relay)
        threading.Thread(target=relay.serve_forever, daemon=True).start()
        def arm(ctx):
            def handle(route):
                import urllib.request
                url=route.request.url.replace('https://ntfy.sh','http://127.0.0.1:8821')
                req=urllib.request.Request(url, data=(route.request.post_data or '').encode() if route.request.method=='POST' else None, method=route.request.method)
                try:
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        route.fulfill(status=resp.status, body=resp.read(), headers={'content-type':'application/x-ndjson','access-control-allow-origin':'*'})
                except Exception as e:
                    route.fulfill(status=599, body=str(e))
            ctx.route('https://ntfy.sh/**', handle)
        def phone(url):
            ctx=b.new_context(viewport={'width':390,'height':844})
            arm(ctx)
            pg=ctx.new_page()
            pg.goto(BASE+url, wait_until='domcontentloaded')
            return ctx, pg
        A, pa = phone('/#lk-register')
        pa.wait_for_selector('#lkregname', timeout=8000)
        for nm, pin in (('Sync Ada','1357'),('Sync Bea','2468')):
            pa.fill('#lkregname', nm)
            pa.fill('#lkregpin', pin)
            pa.fill('#lkregpin2', pin)
            pa.click('#lkreggo')
            pa.wait_for_selector('#lkregok', timeout=4000)
            pa.wait_for_timeout(300)
        for _ in range(40):
            if sum('Sync Bea' in body for _,body in box['msgs']):
                break
            time.sleep(0.1)
        B, pb = phone('/#lk-home')
        pb.wait_for_selector('#lklogin', timeout=8000)
        pb.click('#lklogin')
        pb.wait_for_selector('#lkloginpage', timeout=8000)
        bnames=pb.locator('#lkscorernames .lk-namebtn').all_inner_texts()
        stored=pb.evaluate('''() => {
          const rows=((lkEnsure().reg||{})["2026-11-18"]||[]).map(r=>r.name);
          return {rows, tester:(typeof TESTER!=="undefined" && TESTER && TESTER.id) || null};
        }''')
        chk('a registration on phone A is stored on phone B, and the login list stays on this phone until Show all names',
            'Sync Ada' in stored['rows'] and 'Sync Bea' in stored['rows']
            and 'Sync Ada' not in bnames and 'Sync Bea' not in bnames
            and stored['tester'] is None
            and 'no saved archer' in pb.inner_text('#lkloginpage').lower(),
            str(bnames)+' '+str(stored))
        pb.locator('#lkshowall').click()
        pb.locator('#lkscorernames .lk-namebtn', has_text='Nate Evans').wait_for(timeout=4000)
        pb.locator('#lkscorernames .lk-namebtn', has_text='Nate Evans').click()
        chk('Nate Evans is a host, so a scorer phone does not ask him for a PIN before the paid list',
            pb.locator('#lkpin').count()==0 and pb.locator('#lkpin2').count()==0)
        if pb.locator('#lkpin2').count():
            pb.fill('#lkpin', '1111')
            pb.fill('#lkpin2', '1111')
        pb.fill('#lkpw', os.environ['LK_TEST_PASSCODE'])
        pb.click('#lkpwgo')
        pb.wait_for_selector('#lkpaidlist', timeout=8000)
        for nm in ('Sync Ada','Sync Bea'):
            pb.locator('#lkpaidlist .lk-paidrow', has_text=nm).locator('input').check()
            pb.wait_for_selector('#lkpaidlist', timeout=4000)
        for _ in range(40):
            if any('"cohost":"nate"' in body or '"by":"nate"' in body for _,body in box['msgs']):
                break
            time.sleep(0.1)
        N, pn = phone('/?tester=nathe')
        pn.wait_for_timeout(800)
        nathe=pn.evaluate('''async () => {
          lkEnsure(); await lkSyncOnce();
          const lg=lkEnsure();
          const rows=((lg.reg||{})["2026-11-18"]||[]);
          const paid=lg.paid&&lg.paid["2026-11-18"]||{};
          return {names: rows.map(r=>r.name), ada: rows.filter(r=>r.name==="Sync Ada"||r.name==="Sync Bea").every(r=>!!paid[r.id])};
        }''')
        chk("Nate's paid ticks show on Nathe's phone",
            nathe.get('ada') is True and 'Sync Ada' in nathe.get('names') and 'Sync Bea' in nathe.get('names'),
            str(nathe))
        C, pc = phone('/#lk-home')
        pc.wait_for_selector('#lklogin', timeout=8000)
        pc.click('#lklogin')
        pc.wait_for_selector('#lkloginpage', timeout=8000)
        pc.locator('#lknight').select_option('1')
        pc.locator('#lkshowall').click()
        pc.locator('#lkscorernames .lk-namebtn', has_text='Sync Ada').wait_for(timeout=4000)
        pc.locator('#lkscorernames .lk-namebtn', has_text='Sync Ada').click()
        chk('an archer with a PIN on a new phone logs in with the PIN and no event passcode',
            pc.locator('#lkpin').is_visible() and pc.locator('#lkpin2').count()==0 and not pc.locator('#lkpassbox').is_visible())
        pc.fill('#lkpin', '1357')
        pc.click('#lkpwgo')
        pc.wait_for_selector('#lkassigned', timeout=8000)
        cgroup=pc.inner_text('#lkassigned')
        chk('a scorer phone with no profile sees the paid group',
            pc.get_attribute('#lkassigned','data-target')=='1'
            and 'Sync Ada' in cgroup and 'Sync Bea' in cgroup
            and pc.locator('#lkpaidlist input').count()==0,
            cgroup[:240])
        chk('a scorer login cannot tick paid',
            pc.evaluate('() => lkCanHost(lkEnsure())') is False)
        for ctx in (A,B,N,C):
            ctx.close()
        relay.shutdown()
        b.close()
finally:
    srv.terminate()

print(f'\n{len(ok)} passed, {len(bad)} failed')
if bad:
    print('FAILED:')
    for n in bad:
        print(' ', n)
    sys.exit(1)
