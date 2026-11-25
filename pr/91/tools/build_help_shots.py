# Help guide screenshots + printable PDF (23 Oct 2026). Real app screens at 390px in light AND dark, saved as
# help/g/<shot>-light.webp / -dark.webp (help.js swaps them by theme). The PDF (help/ScoreTool-help-guides.pdf) is the Help
# screen printed by Chrome: white pages, light screenshots (Nathe's print rule). Uses Nathe's own test profile in a throwaway
# browser profile (nothing is saved anywhere); network to Supabase / Archery Calendar / ntfy is answered locally.
# Run:  python3 tools/build_help_shots.py   (then rebuild sw.js so the new files are precached)
import subprocess,sys,time,os,io
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));OUT=os.path.join(ROOT,'help','g');os.makedirs(OUT,exist_ok=True)
PORT=os.environ.get('HELP_PORT','8803')
srv=subprocess.Popen([sys.executable,'-m','http.server',PORT],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
PREP="""()=>{localStorage.setItem('scoretool.dname.nathe',JSON.stringify({n:'Nathe',nt:Date.now()}));localStorage.setItem('scoretool.cal.nathe.prompted','1');
 if(window.WHATSNEW)localStorage.setItem('scoretool.whatsnew.seen',WHATSNEW[0].v)}"""
def shots(pg,th):
  def go(js,wait=800):pg.evaluate(js);pg.wait_for_timeout(wait);pg.evaluate("document.getElementById('scroller')&&document.getElementById('scroller').scrollTo(0,0)");pg.wait_for_timeout(150)
  def snap(name):
    png=pg.screenshot();im=Image.open(io.BytesIO(png)).convert('RGB');im.save(os.path.join(OUT,f'{name}-{th}.webp'),'WEBP',quality=62,method=6)
  go("()=>{cur=null;nav('home')}");snap('start')
  go("()=>{cur=null;sv='sheet';window._csv=null;nav('score')}");snap('score')
  go("()=>{cur=null;sv='sheet';window._csv=null;nav('score')}");pg.click('[data-cstp="casual"]');pg.wait_for_timeout(300);pg.click('[data-csdisc="3d"]');pg.wait_for_timeout(300);snap('casual')
  go("()=>{cur=null;sv='sheet';window._csv=null;nav('score')}");pg.click('[data-cstp="solo"]');pg.wait_for_timeout(300);pg.locator('button',has_text='Start').first.click();pg.wait_for_timeout(900);snap('scoring')
  go("()=>{const c=cur;cur=null;if(c)S.sessions=S.sessions.filter(x=>x!==c);nav('stats')}",1200);snap('stats')
  go("()=>nav('myarch')");snap('myarch')
  go("()=>nav('clubs')");snap('clubs')
  go("()=>nav('tools')");snap('tools')
  go("()=>nav('lab_settings')");snap('settings')
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  for th in ['light','dark']:
    c=b.new_context(viewport={'width':390,'height':700},device_scale_factor=1.5);pg=c.new_page()
    c.route('https://ntfy.sh/**',lambda r:r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'}))
    c.route('https://**.supabase.co/**',lambda r:r.fulfill(status=200,body='null',content_type='application/json'))
    c.route('https://archerycalendars.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body='{"events":[]}',headers={'access-control-allow-origin':'*'}))
    pg.goto(f'http://localhost:{PORT}/?tester=nathe');pg.wait_for_timeout(1500)
    pg.evaluate(PREP);pg.evaluate(f"()=>{{S.unlocked=true;save();localStorage.setItem('scoretool.theme','{th}')}}");pg.reload();pg.wait_for_timeout(2200)
    shots(pg,th)
    if th=='light':
      pg.evaluate("()=>{window._hgOpen=null;nav('help')}");pg.wait_for_timeout(500)
      pg.evaluate("()=>{document.querySelectorAll('details.hg').forEach(d=>{d.open=true;d.querySelectorAll('img').forEach(i=>i.loading='eager')})}");pg.wait_for_timeout(2500)
      pg.emulate_media(media='print')
      pg.pdf(path=os.path.join(ROOT,'help','ScoreTool-help-guides.pdf'),format='A4',print_background=True,margin={'top':'12mm','bottom':'12mm','left':'12mm','right':'12mm'})
    c.close()
  b.close()
srv.kill()
for f in sorted(os.listdir(OUT)):print(f,os.path.getsize(os.path.join(OUT,f)))
print('pdf',os.path.getsize(os.path.join(ROOT,'help','ScoreTool-help-guides.pdf')))
