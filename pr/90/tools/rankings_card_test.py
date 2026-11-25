#!/usr/bin/env python3
"""390px: ranking card (saved list, and a list that includes a WA rank) and results saved by the old results page."""
import json, os, subprocess, sys, time
from playwright.sync_api import sync_playwright
import guard
import freeport
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.environ.get('SHOT_DIR', '/opt/cursor/artifacts')
os.makedirs(ART, exist_ok=True)
ok, bad = [], []
def chk(n, c):
    (ok if c else bad).append(n)
    print(('PASS ' if c else 'FAIL ') + n, flush=True)
PORT = freeport.get()
srv = subprocess.Popen([sys.executable, '-m', 'http.server', PORT], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
WA = {
 "as_of": "2026-10-15",
 "source": "saved",
 "national": {"outdoor": [{"name": "Nathaniel Stride", "club": "Gosnells Archers Inc", "state": "Western Australia", "rank": 1047, "class_rank": 199, "class_size": 331, "age_class": "Open", "gender": "Male", "division": "Compound", "rating": "44.5", "discipline": "outdoor"}], "indoor": [], "field": [], "clout": []},
 "states": {"WA": {"outdoor": [{"name": "Nathaniel Stride", "club": "Gosnells Archers Inc", "state": "Western Australia", "rank": 12, "class_rank": 8, "class_size": 22, "age_class": "Open", "gender": "Male", "division": "Compound", "rating": "44.5", "discipline": "outdoor"}], "indoor": [], "field": [], "clout": []}},
 "archers": {}
}
try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--headless=new'])
        pg = b.new_page(viewport={'width': 390, 'height': 844})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://127.0.0.1:'+PORT+'/?tester=nathe')
        pg.wait_for_timeout(1200)
        pg.evaluate("""()=>{if(typeof S!=='undefined'){S.unlocked=true; if(!S.profile)S.profile='Nathaniel Stride'; save();} }""")
        pg.click('nav [data-v=myarch]')
        pg.wait_for_timeout(400)
        pg.click('[data-go=lab_ranks]')
        pg.wait_for_timeout(800)
        card = pg.locator('#rank-slot')
        chk('saved ranking card is on the rankings screen', card.count()==1)
        text = card.inner_text()
        chk('national class rank from the saved file', '199th' in text and '331' in text and 'National' in text)
        chk('WA line when that state list is empty', 'WA rank is not in this saved list' in text)
        chk('as of date', '15 Oct 2026' in text)
        chk('rank card fits 390px', pg.evaluate('document.documentElement.scrollWidth')<=390)
        pg.locator('#rank-slot').evaluate('e=>e.scrollIntoView({block:"start"})')
        pg.wait_for_timeout(200)
        pg.screenshot(path=os.path.join(ART, 'rankings-saved-390.png'))
        # home must stay free of the card
        pg.click('nav [data-v=home]')
        pg.wait_for_timeout(400)
        chk('home has no ranking card', pg.locator('#rank-slot').count()==0)
        # Tools > My results source was removed (25 Nov 2026, Nathe). Rows it saved earlier stay on the phone and still count:
        # seed them as that page saved them, then check personal bests.
        pg.evaluate("""()=>{localStorage.setItem('scoretool.imported.nathe', JSON.stringify([
          {id:'keep', round:'Holt', date:'2026-01-02', score:800, event:'Typed', imported:true},
          {id:'d1', round:'WA 70/720', date:'2026-03-12', score:650, event:'State Target', imported:true, diary:true, division:'Open Male Compound', discipline:'Outdoor'},
          {id:'d2', round:'Diary Barebow Round', date:'2026-07-04', score:540, event:'Indoor champs', imported:true, diary:true, division:'Barebow', discipline:'Indoor'}]));}""")
        chk('My results source is not in Tools', pg.locator('[data-go=lab_results]').count()==0)
        pg.click('nav [data-v=myarch]')
        pg.wait_for_timeout(300)
        pg.click('[data-go=lab_analysis]')
        pg.wait_for_timeout(900)
        bows = pg.locator('#bscard [data-bsb]').all_inner_texts()
        chk('bow tabs stay separate', any('Compound' in t for t in bows) and any('Barebow' in t for t in bows))
        pg.click('#bscard [data-bsb="Barebow"]')
        pg.wait_for_timeout(500)
        rec = pg.locator('#bscard').inner_text()
        chk('barebow tab shows the barebow import', 'Diary Barebow Round' in rec and 'WA 70/720' not in rec)
        b.close()
    # second page: fixture with a WA rank, so the card can show both numbers
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--headless=new'])
        pg = b.new_page(viewport={'width': 390, 'height': 844})
        pg.route('**/data/rankings.json', lambda r: r.fulfill(status=200, content_type='application/json', body=json.dumps(WA)))
        pg.goto('http://127.0.0.1:'+PORT+'/?tester=nathe')
        pg.wait_for_timeout(1200)
        pg.click('nav [data-v=myarch]')
        pg.wait_for_timeout(300)
        pg.click('[data-go=lab_ranks]')
        pg.wait_for_timeout(800)
        text = pg.locator('#rank-slot').inner_text()
        chk('card shows national and WA class rank', '199th' in text and '331' in text and '8th' in text and '22' in text and 'WA' in text)
        chk('wa card fits 390px', pg.evaluate('document.documentElement.scrollWidth')<=390)
        pg.locator('#rank-slot').evaluate('e=>e.scrollIntoView({block:"start"})')
        pg.wait_for_timeout(200)
        pg.screenshot(path=os.path.join(ART, 'rankings-wa-390.png'))
        b.close()
    chk('no page errors on the first screen', not errs)
finally:
    srv.terminate()
print('rankings card: PASS', len(ok), 'FAIL', len(bad))
if bad:
    print('FAIL', bad)
sys.exit(1 if bad else 0)
