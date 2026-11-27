# Ghost match panel: an end that ties the ghost must be readable (it was drawn white-on-white in the light theme, so the
# end looked blank and the total looked 30 short). Also checks that going Back/Next/Undo/Add Scores never drops, skips or
# moves an end on Vegas 300 and that the stored session is what was shot. 390x844 headless Chrome.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT=8890
subprocess.run(['pkill','-f',f'http.server {PORT}']);time.sleep(.3)
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
GH=[['X','10','10'],['10','9','9'],['X','X','10'],['10','10','9'],['X','10','10']]+[['10','9','9']]*5   # ghost ends 30 28 30 29 30 ...
errs=[]
def run_theme(b,theme):
  ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(f'http://localhost:{PORT}/?tester=nathe');pg.wait_for_timeout(1200)
  pg.evaluate("n=>{S.unlocked=true;if(!S.profile)S.profile=n;save()}",'Nathaniel Stride');pg.reload();pg.wait_for_timeout(1800)
  pg.evaluate("t=>document.documentElement.setAttribute('data-theme',t)",theme)
  # a finished past Vegas 300 to race as My best
  pg.evaluate("g=>{S.sessions.push({id:'past1',date:'2026-09-01',round:'Vegas 300',ends:g,pos:g.map(()=>[]),note:''});save()}",GH)
  pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(500)
  pg.select_option('#rd','Vegas 300');pg.wait_for_timeout(500);pg.check('#ghon');pg.click('[data-gm=best]');pg.click('#st');pg.wait_for_timeout(600)
  chk(f'[{theme}] ghost chosen: My best',pg.evaluate("cur.ghost&&cur.ghost.mode")=='best' and pg.evaluate("cur.ghost.ends.slice(0,5)")==[30,28,30,29,30])
  def shoot(keys):
    for k in keys:pg.click(f'.ad-pad [data-k="{k}"]');pg.wait_for_timeout(60)
    if pg.locator('#fpy').count():pg.click('#fpy');pg.wait_for_timeout(100)   # fair-play nudge: the test shoots faster than a human
  def sums():return pg.evaluate("cur.ends.map(endSum)")
  # end 1 (29) and 2 (30) in order, going through the sheet each time (Next)
  shoot(['10','10','9']);pg.click('#enext');pg.wait_for_timeout(300);pg.click('#addsc');pg.wait_for_timeout(300)
  shoot(['10','10','10']);pg.click('#enext');pg.wait_for_timeout(300);pg.click('#addsc');pg.wait_for_timeout(300)
  # end 3: 30, a tie with the ghost's 30. Then Back (to the sheet), Add Scores, Undo one arrow of the NEXT end and re-shoot
  shoot(['10','10','10']);pg.click('#enext');pg.wait_for_timeout(300);pg.click('#addsc');pg.wait_for_timeout(300)
  chk(f'[{theme}] after three ends the next empty end is End 4 and End box 0, Prog 89',pg.inner_text('#endno')=='End 4 of 10' and pg.locator('.ad-num b').nth(0).inner_text()=='0' and pg.locator('.ad-num b').nth(1).inner_text()=='89')
  shoot(['9','9']);pg.click('#undo');pg.wait_for_timeout(100);shoot(['10','9']);pg.click('#enext');pg.wait_for_timeout(300);pg.click('#addsc');pg.wait_for_timeout(300)   # end 4 = 9,10,9 = 28
  shoot(['9','9','9']);pg.click('#enext');pg.wait_for_timeout(300)                                                                     # end 5 = 27
  chk(f'[{theme}] stored ends 29 30 30 28 27 in order, no gap, total 144',sums()==[29,30,30,28,27] and pg.evaluate("total(cur)")==144)
  chk(f'[{theme}] every end has 3 arrows',pg.evaluate("cur.ends.every(e=>e.length==3)"))
  # sheet with the ghost panel
  tie=pg.locator('.gh-tab tr:nth-child(2) td').nth(3)   # You row, End 3
  chk(f'[{theme}] the You row shows all five ends: 29 30 30 28 27',[pg.locator('.gh-tab tr:nth-child(2) td').nth(i).text_content().strip() for i in range(1,6)]==['29','30','30','28','27'])
  col=tie.evaluate("e=>getComputedStyle(e).color");bg=pg.locator('.gh-res').evaluate("e=>getComputedStyle(e).backgroundColor")
  chk(f'[{theme}] the tied end (30 vs 30) is readable: text colour {col} is not the card colour {bg}',col!=bg)
  chk(f'[{theme}] tie text colour is the normal ink colour (same as the Ghost row)',col==pg.locator('.gh-tab tr:nth-child(3) td').nth(3).evaluate("e=>getComputedStyle(e).color"))
  gap=pg.locator('#ghbar .gh-mid b').evaluate("e=>getComputedStyle(e).color");bgb=pg.locator('#ghbar').evaluate("e=>getComputedStyle(e).backgroundColor")
  chk(f'[{theme}] the gap figure is readable (it is -3 here)',gap!=bgb)
  # back one end then forward: Add Scores -> End 6, End box 0, Prog 144, back to End 5 shows 27
  pg.click('#addsc');pg.wait_for_timeout(300)
  chk(f'[{theme}] End 6 empty: End box 0, Prog 144 (the running total through the end on screen)',pg.inner_text('#endno')=='End 6 of 10' and pg.locator('.ad-num b').nth(0).inner_text()=='0' and pg.locator('.ad-num b').nth(1).inner_text()=='144')
  pg.click('#prevend');pg.wait_for_timeout(300)
  chk(f'[{theme}] back to End 5: End box 27, Prog 144',pg.inner_text('#endno')=='End 5 of 10' and pg.locator('.ad-num b').nth(0).inner_text()=='27' and pg.locator('.ad-num b').nth(1).inner_text()=='144')
  pg.click('#eback');pg.wait_for_timeout(300);pg.click('#addsc');pg.wait_for_timeout(300)
  chk(f'[{theme}] Back to the sheet and Add Scores again changes nothing stored',sums()==[29,30,30,28,27])
  # a tie in the finished panel (Dead heat figure) stays readable too
  ctx.close()
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for th in ('light','dark'):run_theme(b,th)
    chk('no page errors',not errs)
finally:
  srv.terminate()
print(len(ok),'passed,',len(bad),'failed')
sys.exit(1 if bad else 0)
