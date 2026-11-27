# Lingkana: Back to ScoreTool, shared theme, resume, phone name list, and a per-archer PIN.
# 390px. Stubs the relay. Does not post to the live topic.
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
srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.4)

PREP = """() => {
  localStorage.setItem('scoretool.whatsnew.seen','v2026-11-17-1830-live');
  try{localStorage.setItem('scoretool.cal.steven.prompted','1')}catch(e){}
  try{localStorage.setItem('scoretool.cal.nathe.prompted','1')}catch(e){}
  if(typeof S!=='undefined' && S){S.unlocked=true; if(!S.profile)S.profile='Sam Archer'; save()}
}"""

def contrast(page, sel):
    return page.evaluate("""sel => {
      function lin(c){c=c/255; return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)}
      function L(rgb){const m=String(rgb).match(/[\\d.]+/g); if(!m)return 0; const n=m.map(Number);
        return 0.2126*lin(n[0])+0.7152*lin(n[1])+0.0722*lin(n[2])}
      const el=document.querySelector(sel); if(!el)return 0;
      let n=el, bg=getComputedStyle(n).backgroundColor;
      while(n && (bg==='rgba(0, 0, 0, 0)'||bg==='transparent')){n=n.parentElement; if(n)bg=getComputedStyle(n).backgroundColor}
      const a=L(getComputedStyle(el).color), b=L(bg);
      return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
    }""", sel)

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome',
                              args=['--no-sandbox','--disable-dev-shm-usage','--headless=new'])
        ctx = b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2)
        ctx.add_init_script("localStorage.setItem('scoretool.theme','light')")
        page = ctx.new_page()
        page.goto(f'{BASE}/?tester=steven#lk-home', wait_until='domcontentloaded')
        page.wait_for_selector('#lkhome', timeout=8000)
        page.evaluate(PREP)
        page.wait_for_selector('#lkhomeapp', timeout=4000)
        chk('league home has Back to ScoreTool', page.locator('#lkhomeapp').inner_text().strip()=='Back to ScoreTool')
        chk('league home has the shared theme control', page.locator('#lktheme').count()==1 and page.locator('#lktheme').is_visible())
        chk('no resume button before a scoring session', page.locator('#lkresume').count()==0)
        light = page.evaluate("() => document.documentElement.getAttribute('data-theme')")
        chk('league home opens in the stored light theme', light=='light', light)
        chk('light home heading is readable', contrast(page, '#lkhome h1, #lkhome .lk-evname')>=4.5 or contrast(page, '.lk-evname')>=3)
        page.evaluate("() => { const s=document.getElementById('scroller'); if(s)s.scrollTop=0 }")
        page.screenshot(path=str(SHOT/'lingkana-home-light-390.png'))
        page.locator('#lktheme').click()
        page.wait_for_timeout(150)
        chk('theme control writes the same scoretool.theme key',
            page.evaluate("() => localStorage.getItem('scoretool.theme')")=='dark'
            and page.evaluate("() => document.documentElement.getAttribute('data-theme')")=='dark')
        page.screenshot(path=str(SHOT/'lingkana-home-dark-390.png'))
        chk('dark Back to ScoreTool text is readable', contrast(page, '#lkhomeapp')>=4.5, str(contrast(page, '#lkhomeapp')))
        page.locator('#lktheme').click()
        chk('switching back to light updates the same key',
            page.evaluate("() => localStorage.getItem('scoretool.theme')")=='light')

        page.locator('#lkhomeapp').click()
        page.wait_for_selector('.hub-score', timeout=5000)
        back = page.evaluate("""() => ({
          hash: location.hash,
          href: location.href,
          theme: localStorage.getItem('scoretool.theme'),
          flow: document.body.classList.contains('lk-flow')
        })""")
        chk('Back to ScoreTool opens the app home from the league link',
            back['hash']=='' and not back['flow'] and page.locator('.hub-score').count()>=1
            and 'lk-home' not in back['href'],
            str(back)+' hubs='+str(page.locator('.hub-score').count()))
        chk('the app home still uses the theme chosen on the league screen',
            page.evaluate("() => document.documentElement.getAttribute('data-theme')")=='light')
        page.locator('.labtheme').first.click()
        chk('the main app theme control writes the same key',
            page.evaluate("() => localStorage.getItem('scoretool.theme')")=='dark')

        seeded = page.evaluate("""async () => {
          const lg = lkEnsure();
          const sam = lkApplyReg({name:'Sam Archer', at:Date.now()}, lg);
          const alex = lkApplyReg({name:'Alex River', at:Date.now()}, lg);
          lkRememberArcher(sam.id);
          const salt = lkPinSalt();
          const hash = await lkPinHash('Sam Archer','1234',salt);
          lkSetPin(lg, sam.id, 'Sam Archer', hash, salt);
          const night = '2026-11-18';
          lg.paid = lg.paid||{}; lg.paid[night] = {};
          lg.paid[night][sam.id] = 1; lg.paid[night][alex.id] = 1;
          lg.grp = lg.grp||{}; lg.grp[1] = {t:Date.now(), g:[[sam.id, alex.id]]};
          lg.sc = lg.sc||{}; lg.sc[sam.id] = {1:{e:[['10']], nEnds:20, xv:11, lancaster:true, round:'Lancaster 660', u:Date.now(), by:'steven'}};
          lg.dirty = 1; save();
          sessionStorage.setItem('scoretool.lk.auth','LINGKN26');
          sessionStorage.setItem('scoretool.lk.scorerId', sam.id);
          sessionStorage.setItem('scoretool.lk.scorer','Sam Archer');
          sessionStorage.setItem('scoretool.lk.night','1');
          window._lkAuthed = 'LINGKN26';
          const raw = JSON.stringify(lg);
          return {sam:sam.id, alex:alex.id, plain: raw.includes('"pin"'), hash: !!((lg.reg[night]||[]).find(r=>r.id===sam.id)||{}).pinHash};
        }""")
        chk('the saved registration keeps a PIN hash and not a plain PIN',
            seeded.get('hash') and not seeded.get('plain'), str(seeded))
        page.evaluate("() => { window._lkLeftHome=0; lkFlowHome('LINGKN26'); }")
        page.wait_for_selector('#lkhome', timeout=5000)
        chk('a deep link with an open night stays on league home and shows Resume scoring',
            page.locator('#lkresume').count()==1 and page.locator('#lgentry').count()==0
            and 'Resume scoring' in page.locator('#lkresume').inner_text())
        page.locator('#lkresume').click()
        page.wait_for_selector('#lgentry', timeout=5000)
        chk('Resume scoring opens Score End for the open night',
            'Score End' in page.inner_text('#lgentry') and 'Sam Archer' in page.inner_text('#lgentry'))
        kept = page.evaluate("""() => {
          const lg = lkEnsure();
          const id = sessionStorage.getItem('scoretool.lk.scorerId');
          const ends = (((lg.sc||{})[id]||{})[1]||{}).e;
          return {auth: sessionStorage.getItem('scoretool.lk.auth'), ends};
        }""")
        chk('resume leaves the login and the saved arrow in place',
            kept.get('auth')=='LINGKN26' and kept.get('ends')==[['10']], str(kept))
        page.locator('#lkswitch').click()
        page.wait_for_selector('#lkloginpage', timeout=4000)
        cleared = page.evaluate("""() => ({
          auth: sessionStorage.getItem('scoretool.lk.auth'),
          id: sessionStorage.getItem('scoretool.lk.scorerId'),
          ends: ((((lkEnsure().sc||{})[%r]||{})[1]||{}).e)
        })""" % seeded['sam'])
        chk('Switch archer clears the session and keeps the score',
            not cleared.get('auth') and not cleared.get('id') and cleared.get('ends')==[['10']], str(cleared))
        names = page.locator('#lkscorernames .lk-namebtn').all_inner_texts()
        chk('login lists only the archer this phone remembers', names==['Sam Archer'], str(names))
        chk('a return login is night, name and PIN, with no event passcode',
            page.locator('#lknight').is_visible() and page.locator('#lkpin').is_visible()
            and not page.locator('#lkpassbox').is_visible()
            and 'Enter the Passcode' not in page.locator('#lkloginpage').inner_text())
        page.evaluate("""() => {
          localStorage.setItem('scoretool.theme','light');
          document.documentElement.setAttribute('data-theme','light');
          const b=document.getElementById('lktheme');
          if(b){b.textContent='Dark'; b.title='Switch to dark mode';}
          const s=document.getElementById('scroller'); if(s)s.scrollTop=0;
        }""")
        page.screenshot(path=str(SHOT/'lingkana-return-login-390.png'))
        page.screenshot(path=str(SHOT/'lingkana-login-pin-390.png'))
        page.fill('#lkfind', 'Alex')
        page.wait_for_timeout(80)
        chk('a name search finds an archer this phone has not saved, without the passcode',
            page.locator('#lkscorernames .lk-namebtn').all_inner_texts()==['Alex River'])
        page.fill('#lkfind', '')
        page.locator('#lkshowall').click()
        page.locator('#lkscorernames .lk-namebtn', has_text='Alex River').wait_for(timeout=4000)
        shown = page.locator('#lkscorernames .lk-namebtn').all_inner_texts()
        chk('Show all names lists the other archers without the event passcode', 'Alex River' in shown and 'Sam Archer' in shown, str(shown))
        page.locator('#lkscorernames .lk-namebtn', has_text='Sam Archer').click()
        page.wait_for_selector('#lkpin', timeout=3000)
        chk('choosing the saved archer again hides the passcode', not page.locator('#lkpassbox').is_visible())
        page.fill('#lkpin', '0000')
        page.locator('#lkpwgo').click()
        page.wait_for_timeout(250)
        chk('a wrong PIN is refused', 'not right' in (page.inner_text('#lkpwmsg') or '').lower() and page.locator('#lgentry').count()==0)
        for _ in range(4):
            page.fill('#lkpin', '0000')
            page.locator('#lkpwgo').click()
            page.wait_for_timeout(120)
        chk('five wrong PINs lock that name on this phone',
            'locked' in (page.inner_text('#lkloginpage') or '').lower())
        page.evaluate("""() => { const b=JSON.parse(localStorage.getItem('scoretool.lk.pinlock')||'{}'); const id=Object.keys(b)[0]; if(id){b[id].until=Date.now()-1000; localStorage.setItem('scoretool.lk.pinlock', JSON.stringify(b));} }""")
        page.locator('#lkscorernames .lk-namebtn', has_text='Sam Archer').click()
        page.fill('#lkpin', '1234')
        page.locator('#lkpwgo').click()
        page.wait_for_selector('#lkassigned, #lgentry', timeout=5000)
        chk('the right PIN after the lock opens scoring again',
            page.locator('#lkassigned').count()+page.locator('#lgentry').count()>=1)

        page.evaluate("() => lkFlowHome('LINGKN26')")
        page.wait_for_selector('#lkereg', timeout=4000)
        page.locator('#lkereg').click()
        page.wait_for_selector('#lkregpin', timeout=4000)
        page.locator('#lkregpin').scroll_into_view_if_needed()
        page.screenshot(path=str(SHOT/'lingkana-register-pin-390.png'))
        page.fill('#lkregname', 'Casey Ng')
        page.fill('#lkregpin', '1234')
        page.fill('#lkregpin2', '9999')
        page.locator('#lkreggo').click()
        page.wait_for_timeout(200)
        chk('a PIN that does not match is refused', 'do not match' in (page.inner_text('#lkregmsg') or '').lower())
        page.fill('#lkregpin2', '1234')
        page.locator('#lkreggo').click()
        page.wait_for_selector('#lkregok', timeout=4000)
        posted = page.evaluate("""() => {
          const raw = localStorage.getItem('scoretool.lk.reg')||'';
          const box = JSON.parse(raw||'[]');
          const row = box.find(r => r && r.name==='Casey Ng')||{};
          return {pin: 'pin' in row, hash: !!row.pinHash, salt: !!row.pinSalt, mine: lkMineIds().includes(row.id)};
        }""")
        chk('registration stores only the salted hash and remembers the id',
            posted.get('hash') and posted.get('salt') and not posted.get('pin') and posted.get('mine'), str(posted))

        diag = page.evaluate("""(sam) => {
          sessionStorage.setItem('scoretool.lk.auth','LINGKN26');
          sessionStorage.setItem('scoretool.lk.scorerId', sam);
          sessionStorage.setItem('scoretool.lk.scorer','Sam Archer');
          sessionStorage.setItem('scoretool.lk.night','1');
          window._lkAuthed='LINGKN26';
          window._lkLeftHome=1;
          try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
          const lg=lkEnsure();
          const g=(((lg.grp||{})[1]||{}).g)||[];
          return {sam, g, authed: lkAuthed(lg), hasEnter: typeof lkFlowEnter==='function'};
        }""", seeded['sam'])
        chk('the open group is still stored for resume', diag.get('hasEnter') and diag.get('authed') and any(seeded['sam'] in (row or []) for row in diag.get('g') or []), str(diag))
        page.evaluate("() => { if(typeof nav==='function')nav('home'); }")
        page.wait_for_selector('.hub-score', timeout=5000)
        landed = page.evaluate("""() => {
          let err='', src='';
          try{ src=String(lkFlowEnter).slice(0,180); lkFlowEnter('LINGKN26'); }catch(e){ err=String(e&&e.stack||e); }
          return {err, src, entry:!!document.getElementById('lgentry'), home:!!document.getElementById('lkhome'),
            assigned:!!document.getElementById('lkassigned'), sheet:!!document.getElementById('lksheet'),
            id:sessionStorage.getItem('scoretool.lk.scorerId'), auth:sessionStorage.getItem('scoretool.lk.auth'),
            text:(document.getElementById('app')||{}).innerText||''};
        }""")
        chk('opening the league from the app resumes Score End',
            landed.get('entry') and 'Score End' in landed.get('text','') and not landed.get('err'),
            str(landed.get('src'))+' '+str({k:landed.get(k) for k in ('err','entry','home','assigned','sheet')})+' '+landed.get('text','')[:120])

        hctx = b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2)
        hp = hctx.new_page()
        hp.goto(f'{BASE}/?tester=nathe#lk-home', wait_until='domcontentloaded')
        hp.wait_for_selector('#lkhome', timeout=8000)
        hp.evaluate(PREP)
        hp.evaluate("""async () => {
          const lg = lkEnsure();
          const sam = lkApplyReg({name:'Sam Archer', at:Date.now()}, lg);
          const salt = lkPinSalt();
          const hash = await lkPinHash('Sam Archer','1234',salt);
          lkSetPin(lg, sam.id, 'Sam Archer', hash, salt);
          save();
        }""")
        hp.evaluate("() => lkFlowHome('LINGKN26')")
        hp.locator('#lklogin').click()
        hp.wait_for_selector('#lkpinreset', timeout=5000)
        labels = hp.locator('#lkscorernames .lk-namebtn').all_inner_texts()
        chk('a host phone sees every name and Reset PIN, with no Show all names gate',
            'Sam Archer' in labels and 'Nate Evans' in labels and hp.locator('#lkshowall').count()==0
            and hp.locator('#lkpin').count()==0, str(labels))
        hp.locator('#lkscorernames .lk-namebtn', has_text='Sam Archer').click()
        hp.locator('#lkpinreset').scroll_into_view_if_needed()
        hp.screenshot(path=str(SHOT/'lingkana-reset-pin-390.png'))
        hp.locator('#lkpinreset').click()
        hp.wait_for_timeout(200)
        reset = hp.evaluate("""() => {
          const lg = lkEnsure();
          const row = ((lg.reg||{})['2026-11-18']||[]).find(r => r && r.name==='Sam Archer')||{};
          return {hash: row.pinHash||'', msg: (document.querySelector('#lkpwmsg')||{}).textContent||''};
        }""")
        chk('Reset PIN clears the hash and says to set a new one',
            not reset.get('hash') and 'set a new one' in reset.get('msg','').lower(), str(reset))
        hp.locator('#lkloginback').click()
        hp.wait_for_selector('#lkhome', timeout=4000)
        # a non-host view of the same data is the other context; here just confirm the prompt text by opening login as if the hash is gone
        hp.evaluate("() => { sessionStorage.removeItem('scoretool.lk.auth'); window._lkAuthed=null; }")
        # Host still skips PIN. The set-PIN prompt is covered on the steven context below.
        ctx.close()
        # Re-open steven quickly for the no-PIN prompt using the existing browser.
        ctx2 = b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2)
        pg = ctx2.new_page()
        pg.goto(f'{BASE}/?tester=steven#lk-home', wait_until='domcontentloaded')
        pg.wait_for_selector('#lkhome', timeout=8000)
        pg.evaluate(PREP)
        pg.evaluate("""() => {
          const lg = lkEnsure();
          const r = lkApplyReg({name:'No Pin', at:Date.now()}, lg);
          lkRememberArcher(r.id); save();
        }""")
        pg.evaluate("() => lkFlowLogin()")
        pg.wait_for_selector('#lkpinset', timeout=4000)
        chk('a registration with no PIN asks for one at the next login',
            'no PIN yet' in pg.inner_text('#lkpinset'))
        chk('setting that first PIN still asks for the event passcode once',
            pg.locator('#lkpassbox').is_visible() and pg.locator('#lkpin2').is_visible())
        pg.fill('#lkpin', '2468')
        pg.fill('#lkpin2', '2468')
        pg.fill('#lkpw', 'nope')
        pg.locator('#lkpwgo').click()
        pg.wait_for_timeout(200)
        still = pg.evaluate("""() => {
          const row = Object.values(lkEnsure().reg||{}).flat().find(r => r && r.name==='No Pin')||{};
          return {hash: !!row.pinHash, msg: (document.querySelector('#lkpwmsg')||{}).textContent||''};
        }""")
        chk('a wrong passcode does not save the new PIN',
            not still.get('hash') and 'not right' in still.get('msg','').lower(), str(still))
        pg.fill('#lkpin', '2468')
        pg.fill('#lkpin2', '2468')
        pg.fill('#lkpw', os.environ['LK_TEST_PASSCODE'])
        pg.locator('#lkpwgo').click()
        pg.wait_for_selector('#lkassigned, #lgentry', timeout=5000)
        chk('the right passcode sets the PIN and logs in',
            pg.locator('#lkassigned').count()+pg.locator('#lgentry').count()>=1)
        b.close()
finally:
    srv.terminate()

print(f'\n{len(ok)} passed, {len(bad)} failed')
if bad:
    print('FAILED:')
    for n in bad:
        print(' ', n)
    sys.exit(1)
