# AC2 (1 Nov 2026): Easton parts in the Arrow chooser. Picking an Easton shaft fills the point, insert and nock boxes left blank
# from the component weights printed with that shaft in the Easton 2026 catalogue (SuperDrive 27 280: adjustable point 100 gr,
# 10/20/50 gr modules, bushings, nocks; X23 / X27 bushings by size; 4MM and X10 pins, collars and nocks). Typed boxes win and a
# cleared box goes back to the part; bushings, pins and collars count at the nock end; break-off points printed as a range are
# not filled in; the X27 point printed "200 grains" is left out; non-Easton shafts get no parts. Nothing written on opening.
# 390px, no console errors, old data unchanged. Test data only. BASE=<url> runs it against a deployed copy.
import subprocess,sys,time,os,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context
import nm_seed,freeport
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT=os.environ.get('PORT') or freeport.get();BASE=os.environ.get('BASE');URL=BASE or f'http://localhost:{PORT}/'
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
srv=None if BASE else subprocess.Popen([sys.executable,'-m','http.server',PORT,'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
OLD="(()=>{const d=JSON.parse(localStorage.getItem('scoretool.v1')||'{}');return JSON.stringify({b:d.bows,s:d.sessions,t:d.tune,u:d.setup,sel:d.bowSel,spec:d.bowSpec,a:d.arrowInfo})})()"
KEY="localStorage.getItem('scoretool.arrowchooser.nathe')"
# no current bow, so nothing is filled from a bow (AC1) and the figures below are the test's own
SEEDJS="""()=>{const d=JSON.parse(localStorage.getItem('scoretool.v1')||'{}');d.bowSel=d.bowSel||{};delete d.bowSel[d.profile];
 localStorage.setItem('scoretool.v1',JSON.stringify(d));localStorage.removeItem('scoretool.arrowchooser.nathe')}"""
def setR(pg,R):pg.evaluate("R=>localStorage.setItem('scoretool.arrowchooser.nathe',JSON.stringify(R))",R)
def getR(pg):return json.loads(pg.evaluate(KEY) or 'null')
def chooser(pg):pg.evaluate("nav('lab_chooser')");pg.wait_for_timeout(500)
def fill(pg,k,v):pg.fill(f'#ac_{k}',str(v));pg.press(f'#ac_{k}','Tab');pg.wait_for_timeout(300)
def openfoc(pg):
    if not pg.evaluate("document.getElementById('acfoc').open"):pg.click('#acfoc summary');pg.wait_for_timeout(250)
def line(pg):return pg.inner_text('#acpartsline') if pg.locator('#acpartsline').count() else ''
def tw(pg):
    t=pg.inner_text('#acfocres');import re;m=re.search(r'Total arrow weight\s+(\d+) gr',t);return int(m.group(1)) if m else None
def foc(L,g,pt,ins,nk,vn=0,vp=0):
    T=g*L+pt+ins+nk+vn;A=(g*L*L/2+(pt+ins)*L+vn*vp)/T;return T,100*(A-L/2)/L
SOURCED={100,120,8,11,3,2,4,7,6,13,9,12,55,90,40,18,19,14,24,16,18.5,26,22,10}   # printed figures (11, 12 = pin + collar sums)
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new','--no-sandbox'])
  ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto(URL);pg.wait_for_timeout(1500);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
  for _ in range(3):
    if pg.locator('nav [data-v=home]').is_visible():break
    pg.locator('#app button').first.click();pg.wait_for_timeout(400)
  pg.evaluate(SEEDJS);pg.reload();pg.wait_for_timeout(1800)
  before=pg.evaluate(OLD)
  # every fixed weight in the table is a printed figure
  P=pg.evaluate("window.ARROW_PARTS")
  ws=set()
  for m,d in P.items():
    for k in ('pt','ins','end','nock'):
      for o in d.get(k) or []:
        w=o[1]
        if isinstance(w,dict):ws|=set(w.values())
        elif w is not None:ws.add(w)
  chk('only sourced weights',ws<=SOURCED and len(ws)>10);ws<=SOURCED or print('not sourced',ws-SOURCED)
  chk('X27 point left out',P['X27']['pt']==[] and '200 grains' in P['X27']['note'])
  chk('modules 10 20 50 for SD and X23',all(P[m].get('mods') for m in ('SuperDrive 23','SuperDrive 25','SuperDrive 27','X23')))
  # a pick by tapping a listed Easton shaft (indoor compound) shows the parts block; nothing written on opening first
  setR(pg,None);pg.evaluate("localStorage.removeItem('scoretool.arrowchooser.nathe')");chooser(pg)
  chk('opening writes nothing',pg.evaluate(OLD)==before and pg.evaluate(KEY) is None)
  pg.click('[data-seg=bow][data-val=compound]');pg.wait_for_timeout(200);pg.click('[data-seg=use][data-val=indoor]');pg.wait_for_timeout(200)
  fill(pg,'dw',50);fill(pg,'dl',28);fill(pg,'ibo',320)
  r=pg.locator('[data-pick*="SuperDrive"]')
  chk('SuperDrive listed for indoor compound',r.count()>0)
  if r.count():
    lab=json.loads(r.first.get_attribute('data-pick'));r.first.check();pg.wait_for_timeout(500)
    openfoc(pg)
    chk('tapping an Easton shaft shows its parts',pg.locator('#acparts').count()==1 and f"Easton parts for {lab['model']} {lab['spine']}" in pg.text_content('#acparts'))
    chk('tap fills the point from the part',f"point {90 if lab['model']!='SuperDrive 27' else 100} gr" in line(pg) and pg.input_value('#ac_pt')=='')
    chk('tap stores the pick only, no parts yet','parts' not in (getR(pg) or {}))
  # SuperDrive 27 280 at 9.0 gr/in, 29"
  setR(pg,{'bow':'compound','use':'indoor','dw':'50','dl':'29','ibo':'320','pick':{'brand':'Easton','model':'SuperDrive 27','spine':280,'gpi':9.0}});chooser(pg)
  openfoc(pg)
  t=pg.text_content('#acparts') if pg.locator('#acparts').count() else ''
  chk('SD27 parts block',"Easton parts for SuperDrive 27 280" in t and 'Easton 2026 catalogue' in t)
  opts=pg.evaluate("[...document.querySelectorAll('#ac_part_end option')].map(o=>o.textContent)")
  chk('SD27 bushings listed',opts==['None','SD 27 4MM Bushing (18 gr)','SD 27 4MM Kick Out Bushing (26 gr)','SD 27 6.5MM Bushing (19 gr)','SD 27 6.5MM Kick Out Bushing (22 gr)'])
  nk=pg.evaluate("[...document.querySelectorAll('#ac_part_nock option')].map(o=>o.textContent)")
  chk('SD27 nocks listed',nk[1:]==['4MM G Nock (7 gr)','4MM Microlite Nock (6 gr)','6.5MM Super 3D Nock (13 gr)','6.5MM Microlite Super Nock (8 gr)'])
  chk('SD27 point 100',pg.evaluate("[...document.querySelectorAll('#ac_part_pt option')].map(o=>o.textContent)")[1]=='SD 27 Adjustable Point (100 gr)')
  chk('modules 10 20 50 offered',pg.locator('[data-mod]').count()==3)
  ln=line(pg)
  chk('SD27 defaults fill blank boxes','point 100 gr (SD 27 Adjustable Point)' in ln and 'nock end 18 gr (SD 27 4MM Bushing)' in ln and 'nock 7 gr (4MM G Nock)' in ln)
  chk('point box placeholder names the part',pg.get_attribute('#ac_pt','placeholder')=='100 (Easton part)' and pg.input_value('#ac_pt')=='')
  T,F=foc(29,9.0,100,0,18+7)
  chk(f'SD27 total weight {round(T)} gr',tw(pg)==round(T))
  chk(f'SD27 FOC {F:.1f}%',f'{F:.1f}%' in pg.inner_text('#acfocout'))
  chk('point counted in the chart reading','100 gr point' in pg.inner_text('#app'))
  chk('nothing stored for parts until changed','parts' not in getR(pg))
  chk('optimizer has a setup',pg.evaluate("!!window.arrowSetup()"))
  pg.check('[data-mod="20"]');pg.wait_for_timeout(400)
  chk('20 gr module adds to the point','point 120 gr (SD 27 Adjustable Point + 20 gr modules)' in line(pg) and tw(pg)==round(T+20))
  R=getR(pg);chk('module choice stored with the shaft',R['parts']=={'m':'SuperDrive 27','pt':0,'ins':-1,'end':0,'nock':0,'mods':[20]})
  pg.check('[data-mod="50"]');pg.wait_for_timeout(400);chk('two modules',tw(pg)==round(T+70))
  pg.uncheck('[data-mod="50"]');pg.wait_for_timeout(400)
  pg.select_option('#ac_part_end','3');pg.wait_for_timeout(400);pg.select_option('#ac_part_nock','2');pg.wait_for_timeout(400)
  T2,F2=foc(29,9.0,120,0,22+13)
  chk('6.5MM kick out + Super 3D nock',tw(pg)==round(T2) and 'nock end 22 gr (SD 27 6.5MM Kick Out Bushing)' in line(pg) and 'nock 13 gr' in line(pg) and f'{F2:.1f}%' in pg.inner_text('#acfocout'))
  fill(pg,'pt',125)
  chk('typed point wins',tw(pg)==round(T2+5) and 'point' not in line(pg).split('nock end')[0].replace('Easton','') and pg.input_value('#ac_pt')=='125')
  fill(pg,'pt','')
  chk('cleared point goes back to the part',tw(pg)==round(T2) and 'point 120 gr' in line(pg))
  fill(pg,'nock',9);chk('typed nock wins',tw(pg)==round(T2-13+9))
  fill(pg,'nock','')
  pg.select_option('#ac_part_pt','-1');pg.wait_for_timeout(400)
  chk('None point leaves it blank','point weight' in pg.inner_text('#acfocres') and pg.locator('[data-mod]').count()==0)
  chk('parts kept after re-open',(chooser(pg) or True) and getR(pg)['parts']['end']==3)
  # X23 2314 and X27 2712: bushings by size
  setR(pg,{'bow':'recurve','use':'indoor','dw':'38','dl':'28','pick':{'brand':'Easton','model':'X23','spine':'2314','gpi':10.8}});chooser(pg)
  ln=line(pg);chk('X23 2314 bushing 10 gr, point 100, Microlite Super 8','point 100 gr (X23 Adjustable Bullet Point)' in ln and 'nock end 10 gr (6.5MM Super UNI Bushing)' in ln and 'nock 8 gr (6.5MM Microlite Super Nock)' in ln)
  setR(pg,{'bow':'recurve','use':'indoor','dw':'38','dl':'28','pick':{'brand':'Easton','model':'X23','spine':'2312','gpi':9.5}});chooser(pg)
  chk('X23 2312 bushing 11 gr','nock end 11 gr' in line(pg))
  setR(pg,{'bow':'recurve','use':'indoor','dw':'38','dl':'28','pick':{'brand':'Easton','model':'X27','spine':'2712','gpi':11.3}});chooser(pg)
  openfoc(pg)
  chk('X27 2712 bushing 19, no point filled','nock end 19 gr' in line(pg) and 'point' not in line(pg).replace('Easton','') and pg.locator('#ac_part_pt').count()==0 and '200 grains' in pg.inner_text('#acparts'))
  # A/C/E: break-off points are a range, so not filled; no pin by default; Microlite nock
  setR(pg,{'bow':'recurve','use':'target','dw':'38','dl':'28','pick':{'brand':'Easton','model':'A/C/E','spine':620,'gpi':6.1}});chooser(pg)
  ln=line(pg);chk('A/C/E: point range not filled, Microlite 6','point' not in ln.replace('Easton','') and 'nock 6 gr (4MM Microlite Nock)' in ln and 'nock end' not in ln and 'point weight' in pg.inner_text('#acfocres'))
  openfoc(pg)
  chk('A/C/E: range point says type it','(type the weight in Point weight)' in pg.inner_text('#ac_part_pt'))
  pg.select_option('#ac_part_end','0');pg.wait_for_timeout(300);pg.select_option('#ac_part_nock','2');pg.wait_for_timeout(300)
  chk('A/C/E: 4MM Pin 9 + Pin Nock 2','nock end 9 gr (4MM Pin)' in line(pg) and 'nock 2 gr (Pin Nock)' in line(pg))
  # X10 Parallel Pro 3.2mm: X10 Pin 8 with G Pin Nock on a compound, Pin Nock on a recurve
  setR(pg,{'bow':'compound','use':'target','dw':'55','dl':'28','pick':{'brand':'Easton','model':'X10 Parallel Pro 3.2mm','spine':420,'gpi':8.9}});chooser(pg)
  chk('X10 PP compound: X10 Pin + G Pin Nock','nock end 8 gr (X10 Pin)' in line(pg) and 'nock 4 gr (G Pin Nock (compound))' in line(pg))
  setR(pg,{'bow':'recurve','use':'target','dw':'38','dl':'28','pick':{'brand':'Easton','model':'X10','spine':600,'gpi':7.0}});chooser(pg)
  chk('X10 recurve: X10 Pin + Pin Nock, point not chosen','nock end 8 gr (X10 Pin)' in line(pg) and 'nock 2 gr (Pin Nock)' in line(pg) and 'point' not in line(pg).replace('Easton',''))
  fill(pg,'nock',6)
  chk('typed nock (older figures): pin not added, says so','X10 Pin is not added because you typed your own insert or nock' in line(pg) and 'nock end' not in line(pg))
  openfoc(pg);pg.select_option('#ac_part_end','0');pg.wait_for_timeout(400)
  chk('choosing the pin adds it',' nock end 8 gr (X10 Pin)' in line(pg) and getR(pg)['parts']['end']==0)
  setR(pg,{'bow':'recurve','use':'target','dw':'38','dl':'28','pick':{'brand':'Easton','model':'Vector','spine':1000,'gpi':5.4}});chooser(pg)
  chk('Vector: N Nock 7','nock 7 gr (4MM N Nock)' in line(pg))
  # other brands: no parts
  setR(pg,{'bow':'recurve','use':'target','dw':'38','dl':'28','pt':'100','pick':{'brand':'Gold Tip','model':'Triple X','spine':400,'gpi':8.0}});chooser(pg)
  chk('non-Easton shaft: no parts',pg.locator('#acparts').count()==0 and line(pg)=='')
  # SD27 at 390 px
  setR(pg,{'bow':'compound','use':'indoor','dw':'50','dl':'29','pick':{'brand':'Easton','model':'SuperDrive 27','spine':280,'gpi':9.0}});chooser(pg)
  openfoc(pg)
  chk('390px no sideways scroll',pg.evaluate("document.documentElement.scrollWidth")<=392)
  if not BASE:
    os.makedirs(os.path.join(ROOT,'shots_ac2'),exist_ok=True);pg.locator('#acparts').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(ROOT,'shots_ac2','ac2-parts-390.png'))
  t=pg.inner_text('#app');chk('no emoji',not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in t))
  pg.evaluate("localStorage.removeItem('scoretool.arrowchooser.nathe')")
  after=json.loads(pg.evaluate(OLD));bf=json.loads(before)
  chk('old data unchanged',after==bf)
  chk('no console errors',not errs);errs and print(errs[:5])
  ctx.close();b.close()
if srv:srv.terminate()
print(f'{len(ok)} passed, {len(bad)} failed');bad and print('FAIL',bad)
sys.exit(1 if bad else 0)
