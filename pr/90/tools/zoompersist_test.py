# Zoom kept on the indoor 3-spot (28 Oct 2026, Nathe: 'keep the zoom as I set it, no reset every end; you restart back at Spot 1').
# Phone-sized browser, tester profile "nate" only (throwaway test profile, never Nathe's). Relay mocked in memory. Saved data is never rewritten.
# In every indoor 3-spot mode (Just me, Just me vs ghost, Casual, match night, League, Vegas) the zoom the archer sets (Z1/Z2/Reset) stays across spots,
# ends and a reload until they change it; a new end opens on Spot 1; the single face still opens every end on the full face.
# Phone-sized browser, tester profile "nate" only (throwaway test profile). Relay mocked in memory. Saved data is never rewritten.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
from indoor_common import click_face
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT=int(os.environ.get('PORT','8877'))
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
def relay(route,req):route.fulfill(status=200,body='{}',headers={'access-control-allow-origin':'*'})
def phone(b,tid='nate'):
  ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);ctx.route('https://ntfy.sh/**',relay);pg=ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)));pg.goto(f'http://localhost:{PORT}/?tester={tid}');pg.wait_for_timeout(1200)
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Nate';save()");pg.reload();pg.wait_for_timeout(2200);return ctx,pg,errs
VW="id=>+document.querySelector('#'+id).getAttribute('viewBox').split(' ')[2]"
TAB="[...document.querySelectorAll('.zbar .zb.on')].map(x=>x.textContent).join()"
def vw(pg,fid,k,w=0.62):return abs(pg.evaluate(VW,fid)-w/k)<0.01
def zlabel(pg,z):return pg.evaluate("s=>document.querySelector(s).textContent",z)
def cycleTo(pg,zsel,label,tries=8):
  # the zoom cycle has more than 3 stops now (Z1..Z4, Reset); click until the wanted label shows rather than assuming a fixed click count
  for _ in range(tries):
    if zlabel(pg,zsel)==label:return
    pg.click(zsel);pg.wait_for_timeout(120)
def run(pg,tag,fid,zsel,tabattr,plotspot3,endnext,w=0.62):
  """Z2 on Spot 3, finish an end: next end must open on Spot 1 at Z2; Z1 then stays"""
  pg.click(f'[{tabattr}="3"]');pg.wait_for_timeout(250);pg.click(zsel);pg.wait_for_timeout(200)
  chk(f'{tag}: Z2 set on Spot 3',zlabel(pg,zsel)=='Z2' and vw(pg,fid,2,w) and pg.evaluate(TAB)=='Spot 3')
  pg.click(f'[{tabattr}="2"]');pg.wait_for_timeout(250)
  chk(f'{tag}: switching to Spot 2 keeps Z2',zlabel(pg,zsel)=='Z2' and vw(pg,fid,2,w) and pg.evaluate(TAB)=='Spot 2')
  pg.click(f'[{tabattr}="3"]');pg.wait_for_timeout(250)
  for i in range(3):plotspot3(i)
  endnext();pg.wait_for_timeout(300)
  chk(f'{tag}: next end opens on Spot 1',pg.evaluate(TAB)=='Spot 1')
  chk(f'{tag}: next end keeps Z2 (label and 2x view)',zlabel(pg,zsel)=='Z2' and vw(pg,fid,2,w))
  chk(f'{tag}: Z2 also saved on the device',pg.evaluate("localStorage.getItem('scoretool.zoomk')")=='2')
  for i in range(3):plotspot3(i)
  endnext();pg.wait_for_timeout(300)
  chk(f'{tag}: third end still Spot 1 at Z2',pg.evaluate(TAB)=='Spot 1' and zlabel(pg,zsel)=='Z2' and vw(pg,fid,2,w))
  cycleTo(pg,zsel,'Z1');pg.wait_for_timeout(200)
  chk(f'{tag}: archer changes to Z1',zlabel(pg,zsel)=='Z1' and vw(pg,fid,1,w))
  pg.click(f'[{tabattr}="3"]');pg.wait_for_timeout(250)
  for i in range(3):plotspot3(i)
  endnext();pg.wait_for_timeout(300)
  chk(f'{tag}: Z1 stays on the next end, Spot 1',zlabel(pg,zsel)=='Z1' and vw(pg,fid,1,w) and pg.evaluate(TAB)=='Spot 1' and pg.evaluate("localStorage.getItem('scoretool.zoomk')")=='1')
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  # ---- Just me ----
  c1,pg,e1=phone(b)
  def jm_start(ghost=False,round_='Australian Indoor 18m',face='vert',h2h=False):
    pg.evaluate("cur=null;sv='sheet';window._ghOn=false;window._ghWho=null;window._ghM=null;nav('score')");pg.wait_for_timeout(500)
    pg.select_option('#rd',round_);pg.wait_for_timeout(300);pg.click(f'#f3row [data-f3={face}]');pg.wait_for_timeout(200)
    if ghost:
      pg.check('#ghon');pg.click('[data-gm=pick]');pg.wait_for_timeout(200);pg.select_option('#ghwho','s:sghost1');pg.wait_for_timeout(100)
    pg.click('#st');pg.wait_for_timeout(800)
  def spy():
    t=pg.evaluate(TAB);n=int(t[-1]) if t.startswith('Spot') else 2
    return pg.evaluate("n=>{const F=face3R(faceR(ROUNDS[cur.round],0),cur);return spots3(F)[n-1]}",n) if pg.evaluate("typeof cur!='undefined'&&!!cur&&!cur.cs")else [0,[-0.62,0,0.62][n-1]]
  def jm_plot(i):xy=spy();click_face(pg,'pface',xy[0],xy[1]);pg.evaluate("document.querySelectorAll('#fpm,.modal').forEach(e=>e.remove())")
  def jm_next():pg.click('#enext');pg.wait_for_timeout(300);pg.click('#addsc');pg.wait_for_timeout(400)
  pg.evaluate("S.sessions.push({id:'sghost1',date:'2026-10-01',round:'Australian Indoor 18m',ends:Array.from({length:10},()=>['10','9','9']),pos:Array.from({length:10},()=>[]),note:'',face3:'single',finished:true});save()")
  jm_start();run(pg,'Just me','pface','#zcycle','data-spot',jm_plot,jm_next)
  pg.evaluate("zkSet(1)")
  jm_start(ghost=True);chk('ghost match is on',pg.evaluate("!!(cur&&cur.ghost)"))
  chk('ghost: a note about a different face is shown (as in the report)',pg.evaluate("document.body.innerText").find('Different face')>=0)
  run(pg,'Just me vs ghost','pface','#zcycle','data-spot',jm_plot,jm_next)
  # Vegas / Indoor WA 18m with the Vegas face
  pg.evaluate("zkSet(1)");pg.evaluate("S.face1=false;save()")
  jm_start(face='vegas')
  run(pg,'Australian Indoor 18m (triangular face)','pface','#zcycle','data-spot',jm_plot,jm_next)
  # reload: the kept zoom comes back
  pg.evaluate("zkSet(2)");pg.reload();pg.wait_for_timeout(2000)
  chk('after an app reload the kept zoom (Z2) is read back',pg.evaluate("(()=>{window._zk=0;window._zkL=0;return zkLoad()})()")==2)
  # single face unchanged: each end opens on the full face
  pg.evaluate("zkSet(2)")
  pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(500);pg.select_option('#rd','Australian Indoor 18m');pg.wait_for_timeout(300)
  pg.click('#f3row [data-f3=single]') if pg.locator('#f3row [data-f3=single]').count() else pg.click('[data-f1=single]')
  pg.click('#st');pg.wait_for_timeout(800)
  pg.click('#zcycle');pg.wait_for_timeout(200)
  chk('single face: zoom works',zlabel(pg,'#zcycle')!='Z1')
  chk('single face: zoom did not overwrite the kept 3-spot zoom',pg.evaluate("window._zk")==2)
  for i in range(3):click_face(pg,'pface',0,0)
  jm_next()
  chk('single face unchanged: next end opens on the full face (Z1)',zlabel(pg,'#zcycle')=='Z1')
  chk('page errors (Just me): none',not e1)
  # ---- match night (head-to-head session) ----
  c4,pg,e4=phone(b)
  pg.evaluate("zkSet(1)")
  pg.evaluate("nav('score')");pg.wait_for_timeout(400)
  pg.evaluate("""(()=>{const m={code:'ZPM1',round:'Australian Indoor 18m',mode:'total',a:'nathe',b:'logan',opp:'logan',created:Date.now(),status:'active'};h2hAll().push(m);h2hStart(m)})()""");pg.wait_for_timeout(700)
  chk('match night: scoring a head-to-head session',pg.evaluate("!!(cur&&cur.h2h)"))
  run(pg,'Match night','pface','#zcycle','data-spot',jm_plot,jm_next)
  chk('page errors (match night): none',not e4)
  # ---- Casual: no plotting face, so no zoom to keep ----
  c2,pg,e2=phone(b)
  pg.evaluate("zkSet(1);nav('score')");pg.wait_for_timeout(500)
  CODE=pg.evaluate("csCreate({name:'Zoom keep',round:'Australian Indoor 18m',face3:'vert',self:true,ppl:[]}).code")
  pg.evaluate(f"csView('{CODE}')");pg.wait_for_timeout(600)
  chk('Casual: score buttons only, no face to zoom',pg.locator('#cspface').count()==0 and pg.locator('#cszcycle').count()==0 and pg.locator('#csentry [data-csk]').count()>=6)
  chk('page errors (Casual): none',not e2)
  def cs_plot(i):click_face(pg,'cspface',0,{'Spot 1':-0.62,'Spot 2':0,'Spot 3':0.62}[pg.evaluate(TAB)])
  # ---- League ----
  c3,pg,e3=phone(b)
  pg.evaluate("zkSet(1);nav('score')");pg.wait_for_timeout(500);pg.evaluate("(()=>{if(!lgGet('ONIONSHD')){S.leagues.push(lgPresetRecord());save()}lgView('ONIONSHD')})()");pg.wait_for_timeout(500)
  pg.click('[data-lgme]');pg.wait_for_timeout(500)
  if pg.locator('#cspface').count()==0 and pg.locator('#cshide').count():pg.click('#cshide')
  run(pg,'League','cspface','#cszcycle','data-csspot',cs_plot,lambda:pg.wait_for_timeout(300))
  chk('page errors (League): none',not e3)
  b.close()
finally:srv.terminate()
print(f'\n{len(ok)} passed, {len(bad)} failed')
for n in bad:print('  FAILED:',n)
sys.exit(1 if bad else 0)
