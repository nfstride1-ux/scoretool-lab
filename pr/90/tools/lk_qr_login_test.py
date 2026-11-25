# Login with QR Code when the phone has no BarcodeDetector (iOS Safari).
# Sample photos live in tools/fixtures. The ntfy relay is stubbed. Nothing is posted.
import os, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import guard
from playwright.sync_api import sync_playwright

ok, bad = [], []
def chk(n, c, extra=''):
    (ok if c else bad).append(n)
    print(('PASS ' if c else 'FAIL ') + n + (('  ' + extra) if extra and not c else ''), flush=True)

PORT = '8827'
BASE = f'http://127.0.0.1:{PORT}'
SHOT = Path('/opt/cursor/artifacts')
SHOT.mkdir(parents=True, exist_ok=True)
FIX = ROOT / 'tools' / 'fixtures'
UPRIGHT = FIX / 'lingkana-event-qr.png'
TURNED = FIX / 'lingkana-event-qr-turned.png'
HOME = 'https://nfstride1-ux.github.io/scoretool-demo/#lk-home'
NO_DETECTOR = """
(() => {
  try { Object.defineProperty(window, 'BarcodeDetector', {configurable:true, writable:true, value:undefined}); }
  catch (e) { try { window.BarcodeDetector = undefined; } catch (e2) {} }
})();
"""

import subprocess, time
srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--bind', '127.0.0.1'], cwd=str(ROOT),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.4)

def open_home(page):
    page.goto(f'{BASE}/#lk-home', wait_until='networkidle')
    page.wait_for_selector('#lkhome', timeout=8000)
    if page.locator('#wnx').count():
        page.locator('#wnx').click()
        page.wait_for_timeout(150)

def open_qr(page):
    open_home(page)
    page.locator('#lkqr').click()
    page.wait_for_selector('#lkqrpage', timeout=5000)

try:
    sw = (ROOT / 'sw.js').read_text()
    html = (ROOT / 'index.html').read_text()
    chk('service worker cache is newer than v2026-11-17-1045-live and lists jsQR',
        "const V='v2026-11-17-2405-loginfit'" in sw and 'vendor/jsQR.js' in sw and 'v2026-11-17-1830-live' not in sw.split('PRE=',1)[0])
    chk('index.html loads the vendored jsQR with the new cache query',
        'vendor/jsQR.js?v=202611172405' in html and '202611171830' not in html and 'https://' not in html.split('vendor/jsQR.js',1)[0][-80:])
    chk('sample QR photos are in the repo', UPRIGHT.is_file() and TURNED.is_file() and UPRIGHT.stat().st_size > 1000)

    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome',
                              args=['--no-sandbox', '--disable-dev-shm-usage', '--headless=new'])
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        ctx.add_init_script(NO_DETECTOR)
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        open_qr(page)
        caps = page.evaluate("() => ({jsQR: typeof jsQR, det: typeof window.BarcodeDetector, file: !!document.querySelector('#lkqrfile')})")
        chk('this phone has jsQR and no BarcodeDetector', caps['jsQR']=='function' and caps['det']!='function', str(caps))
        label = page.locator('label[for="lkqrpaste"]').inner_text().strip()
        chk('the QR screen has a Paste event link or code field',
            label=='Paste event link or code' and page.locator('#lkqrpaste').count()==1
            and page.locator('#lkqrfile').count()==1)
        page.screenshot(path=str(SHOT / 'lingkana-qr-login-390.png'), scale='css')

        page.locator('#lkqrfile').set_input_files(str(UPRIGHT))
        page.wait_for_selector('#lkhome', timeout=15000)
        ev = page.get_attribute('#lkhome', 'data-ev') or ''
        chk('an upright photo of the event QR opens the Lingkana home',
            ev=='LINGKN26' and 'cannot read a QR' not in (page.locator('body').inner_text() or ''),
            ev)

        open_qr(page)
        page.locator('#lkqrfile').set_input_files(str(TURNED))
        page.wait_for_selector('#lkhome', timeout=15000)
        ev = page.get_attribute('#lkhome', 'data-ev') or ''
        chk('a large sideways photo of the event QR still opens the Lingkana home', ev=='LINGKN26', ev)

        open_qr(page)
        page.fill('#lkqrpaste', 'not-an-event')
        page.locator('#lkqrpaste').press('Enter')
        page.wait_for_timeout(200)
        msg = page.locator('#lkqrmsg').inner_text()
        chk('a code that is not for this event stays on the QR screen',
            page.locator('#lkqrpage').count()==1 and msg=='That code is not for this event.', msg)
        page.fill('#lkqrpaste', 'LINGKN26')
        page.locator('#lkqrgo').click()
        page.wait_for_selector('#lkhome', timeout=5000)
        chk('Continue with a pasted event code opens the Lingkana home',
            (page.get_attribute('#lkhome', 'data-ev') or '')=='LINGKN26')

        open_qr(page)
        page.fill('#lkqrpaste', HOME)
        page.locator('#lkqrpaste').press('Enter')
        page.wait_for_selector('#lkhome', timeout=5000)
        chk('Enter on a pasted event link opens the Lingkana home',
            (page.get_attribute('#lkhome', 'data-ev') or '')=='LINGKN26')

        open_home(page)
        armed = page.evaluate("""async () => {
          const img = new Image();
          img.src = 'tools/fixtures/lingkana-event-qr.png';
          await img.decode();
          const c = document.createElement('canvas');
          c.width = 640; c.height = 480;
          const g = c.getContext('2d');
          g.fillStyle = '#fff';
          g.fillRect(0, 0, 640, 480);
          g.save();
          g.translate(320, 240);
          g.rotate(Math.PI / 2);
          g.drawImage(img, -180, -180, 360, 360);
          g.restore();
          const stream = c.captureStream(8);
          navigator.mediaDevices.getUserMedia = async () => stream;
          return stream.getVideoTracks().length;
        }""")
        page.locator('#lkqr').click()
        page.wait_for_selector('#lkhome', timeout=12000)
        chk('the camera fallback reads a QR frame when BarcodeDetector is missing',
            armed==1 and (page.get_attribute('#lkhome', 'data-ev') or '')=='LINGKN26')
        chk('no page errors', not errs, ' | '.join(errs[:3]))
        b.close()
finally:
    srv.terminate()

print(f'\n{len(ok)} passed, {len(bad)} failed')
if bad:
    print('FAILED:')
    for n in bad:
        print(' ', n)
    sys.exit(1)
