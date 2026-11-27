# Casual scores with buttons only. Lancaster 660 counts X as 11. Just me lists one discipline at a time.
# League one-archer cards still draw the target face. Phone-sized browser. Relay stubbed.
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

PORT = '8891'
BASE = f'http://localhost:{PORT}'
SHOT = Path('/opt/cursor/artifacts')
SHOT.mkdir(parents=True, exist_ok=True)
srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.6)

def dismiss(pg):
    pg.wait_for_timeout(400)
    if pg.locator('#wnx').count():
        pg.locator('#wnx').click()
        pg.wait_for_timeout(200)

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome',
                              args=['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'])
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        pg = ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'{BASE}/?tester=nathe', wait_until='networkidle')
        pg.wait_for_timeout(600)
        dismiss(pg)
        pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Nathaniel Stride';save();nav('score')")
        pg.wait_for_timeout(400)
        if pg.locator('[data-cstp="casual"]').count():
            pg.click('[data-cstp="casual"]')
            pg.wait_for_timeout(200)
        code = pg.evaluate("csCreate({name:'Lancaster buttons',round:'Lancaster 660',self:true,ppl:[]}).code")
        pg.evaluate(f"csView('{code}')")
        pg.wait_for_timeout(500)
        chk('casual Lancaster has score buttons and no target face',
            pg.locator('#cspface').count()==0 and pg.locator('[data-csspot]').count()==0
            and pg.locator('#cshide').count()==0 and pg.locator('#cszcycle').count()==0
            and pg.locator('#csentry [data-csk="X"]').count()==1,
            pg.locator('#csentry').inner_text()[:180] if pg.locator('#csentry').count() else 'no card')
        pg.screenshot(path=str(SHOT / 'casual-no-face-390.png'))
        def tap(k, n=1):
            for _ in range(n):
                pg.click(f'#csentry [data-csk="{k}"]')
                pg.wait_for_timeout(40)
        tap('X')
        chk('one Lancaster X is 11 on the end and the running total',
            pg.locator('#csendtot').inner_text()=='11' and pg.locator('#csrun').inner_text()=='11')
        tap('X', 2)
        chk('a finished Lancaster end of XXX is 33',
            pg.locator('#csrun').inner_text()=='33' and pg.locator('#csendtot').inner_text()=='0')
        tap('X', 3)
        chk('end 2 of Lancaster XXX takes the running total to 66',
            pg.locator('#csrun').inner_text()=='66')
        tap('X', 3)
        chk('end 3 of Lancaster XXX takes the running total to 99',
            pg.locator('#csrun').inner_text()=='99' and pg.locator('#csendtot').inner_text()=='0')
        detail = pg.evaluate(f"""() => {{
          const cs = csGet('{code}');
          const row = csRow(cs, csMe());
          document.querySelector('#csends').open = true;
          return {{tot: row.tot, ends: row.E, line: document.querySelector('#csends').textContent}};
        }}""")
        chk('the saved Lancaster ends and the score table use X as 11',
            detail['tot']==99 and detail['ends']==[['X','X','X']]*3
            and 'E1 X X X (33)' in detail['line'] and 'E3 X X X (33)' in detail['line']
            and pg.locator('.cs-tab tbody tr td:nth-child(3)').inner_text()=='99',
            str(detail))
        pg.locator('#cstots').scroll_into_view_if_needed()
        pg.screenshot(path=str(SHOT / 'casual-lancaster-x11-390.png'))
        vegas = pg.evaluate("csCreate({name:'Vegas buttons',round:'Vegas 300',self:true,ppl:[]}).code")
        pg.evaluate(f"csView('{vegas}')")
        pg.wait_for_timeout(400)
        tap('X')
        chk('a practice Vegas X still scores 10',
            pg.locator('#csendtot').inner_text()=='10' and pg.locator('#csrun').inner_text()=='10'
            and pg.evaluate(f"csTotal([['X','X','X']], csGet('{vegas}'))")==30)
        face = pg.evaluate("""() => {
          const me = h2hMe();
          const lg = {code:'FACEKEEP', name:'Face keep', host:me, order:[me], gn:{}, sc:{}, grp:{}, weeks:['2026-11-18'], wt:1, cw:1, cwt:0};
          let html = '', err = '';
          try { html = lgEntryCard(lg, 1, [me]); }
          catch (e) { err = String(e && e.message || e); }
          return {face: html.indexOf('id="cspface"')>=0, hide: html.indexOf('id="cshide"')>=0, zoom: html.indexOf('id="cszcycle"')>=0, err};
        }""")
        chk('a one-archer league card still draws the target face',
            face['face'] and face['hide'] and face['zoom'], str(face))

        pg.evaluate("""() => {
          S.unlocked=true; save();
          cur=null; window._csv=null; window._csMode=null;
          nav('score');
        }""")
        pg.wait_for_selector('#jmdisc [data-jdisc="target"]', timeout=5000)
        discs = ['target', 'indoor', 'field', 'clout', '3d']
        listed = {}
        for d in discs:
            pg.click(f'[data-jdisc="{d}"]')
            pg.wait_for_timeout(150)
            opts = pg.eval_on_selector_all('#rd option', 'o=>o.map(x=>x.value).filter(v=>v && v!=="__new")')
            bad_disc = pg.evaluate("(arg) => arg.opts.filter(r => csDisc(r)!==arg.d)", {'opts': opts, 'd': d})
            listed[d] = opts
            chk(f'{d} lists only that discipline', bad_disc==[] , str(bad_disc[:6])+' of '+str(len(opts)))
        chk('indoor and 3D do not list each other\'s rounds',
            'Indoor WA 18m' in listed['indoor'] and 'Indoor WA 18m' not in listed['3d']
            and 'WA 720 (70m)' not in listed['indoor'] and 'WA 720 (70m)' in listed['target']
            and all(n not in listed['indoor'] for n in listed['3d']))
        pg.click('[data-jdisc="indoor"]')
        pg.wait_for_timeout(150)
        pg.evaluate("document.querySelector('#rd').size=Math.min(8, document.querySelector('#rd').options.length)")
        pg.locator('#jmpick').screenshot(path=str(SHOT / 'discipline-indoor-390.png'))
        pg.click('[data-jdisc="3d"]')
        pg.wait_for_timeout(150)
        pg.evaluate("document.querySelector('#rd').size=Math.min(8, document.querySelector('#rd').options.length)")
        pg.locator('#jmpick').screenshot(path=str(SHOT / 'discipline-3d-390.png'))
        pg.evaluate("document.querySelector('#rd').size=0")
        pg.select_option('#rd', 'Australian Indoor 18m')
        pg.wait_for_timeout(200)
        if pg.locator('#f3row [data-f3=vert]').count():
            pg.click('#f3row [data-f3=vert]')
            pg.wait_for_timeout(150)
        pg.click('#st')
        pg.wait_for_timeout(600)
        chk('Just me still draws the plotting face', pg.locator('#pface').count()==1 and pg.locator('#zcycle').count()==1)
        chk('no page errors', not errs, str(errs[:3]))
        b.close()
finally:
    srv.terminate()

print(f'\n{len(ok)} passed, {len(bad)} failed')
sys.exit(1 if bad else 0)
