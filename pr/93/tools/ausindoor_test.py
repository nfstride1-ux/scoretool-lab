# Australian Indoor 18m (30 arrows) faces (23 Oct 2026, Nathe): single 40cm, triangular 3-spot or vertical 3-spot ("traffic light"),
# picked in Just me, Casual and head-to-head; one round key, so PBs and averages are shared. Per-spot plotting (148a6a6): plotted value
# == scored value on every face. Throwaway local test profile only, no network; existing sessions untouched.
import subprocess,sys,time,os,json,re
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.path.abspath(sys.argv[1]) if len(sys.argv)>1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'shots-ausindoor');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);None if c else print('FAIL',n)
PORT=8841;AUS='Australian Indoor 18m'
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
def to_score(pg):pg.evaluate("cur=null;sv='sheet';window._csv=null;nav('score')");pg.wait_for_timeout(400)
def plot(pg,pts):  # tap the face at face coordinates (x,y), via the svg's own transform
  for x,y in pts:
    q=pg.evaluate("([x,y])=>{const sv=document.querySelector('#pface'),p=sv.createSVGPoint();p.x=x;p.y=y;const r=p.matrixTransform(sv.getScreenCTM());return[r.x,r.y]}",[x,y])
    pg.mouse.click(q[0],q[1]);pg.wait_for_timeout(250)
# plotted (per-spot mapped by shotPts) re-scored on one spot / full face must equal the stored score
CHECK=r"""(()=>{const s=cur||S.sessions.find(x=>x.id==window._aid),R=ROUNDS[s.round],P=shotPts(s);return P.target.map(p=>{const Fi=faceR(R,p.e),lc=arrowLC(Fi,s);let v;
 if(p.k=='spot'){const d=Math.hypot(p.x,p.y)-(lc>0?lc:0.035);v=d>0.5?'M':d<=0.05?'X':String(Math.min(10,10-Math.floor(Math.max(0,d)*10)))}else v=plotScore(p.x,p.y,{...Fi,col:false,ausi:!!R.ausi},lc);return[p.k,p.a,v]})})()"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
  ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(f'http://localhost:{PORT}') else r.abort())
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(f'http://localhost:{PORT}/?tester=steven');pg.wait_for_timeout(1200)
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Steven';save()");pg.reload();pg.wait_for_timeout(1800)
  S0=json.loads(pg.evaluate("localStorage.getItem(KEY)"));old=S0.get('sessions') or [];f30=S0.get('face3')
  chk('round exists: 10 ends of 3, 40cm, max 300',pg.evaluate(f"(R=>R.ends==10&&R.ape==3&&R.face=='40cm'&&R.max==300&&indoor3(R,faceR(R,0)))(ROUNDS['{AUS}'])"))
  chk('AA rating uses the same round',pg.evaluate(f"AA_MAP['{AUS}']=='{AUS}'&&!!AA_ROUNDS['{AUS}']"))
  # ---------- Just me picker ----------
  to_score(pg);pg.select_option('#rd',AUS);pg.wait_for_timeout(300)
  lab=pg.evaluate("[...document.querySelectorAll('#f3row [data-f3]')].map(b=>b.dataset.f3+'='+b.textContent)")
  print('picker faces',lab)
  chk('Just me: three faces for Aus Indoor',lab==['vert=Vertical 3-spot (traffic light)','vegas=Triangular 3-spot','single=Single 40cm face'])
  chk('Just me: vertical (traffic light) is the default',pg.locator('#f3row [data-f3=vert].on').count()==1)
  pg.select_option('#rd','Indoor WA 18m');pg.wait_for_timeout(200);chk('WA 18m: the Three spot / Single face choice (single face release), default Three spot',pg.evaluate("[...document.querySelectorAll('#f3row [data-f1]')].map(b=>b.dataset.f1+'='+b.textContent)")==['three=Three spot','single=Single face'] and pg.locator('#f3row [data-f1=three].on').count()==1)
  pg.select_option('#rd',AUS);pg.wait_for_timeout(200)
  pg.click('#f3row [data-f3=vegas]');pg.wait_for_timeout(200);chk('pick triangular sticks',pg.locator('#f3row [data-f3=vegas].on').count()==1)
  pg.click('#f3row [data-f3=vert]');pg.wait_for_timeout(200)
  pg.evaluate("document.querySelector('#rd').closest('.card').scrollIntoView({block:'start'})");pg.wait_for_timeout(200)
  pg.screenshot(path=f'{SH}/picker-justme.png')
  # ---------- vertical (traffic light): plot an end ----------
  pg.click('#st');pg.wait_for_timeout(800)
  chk('session on the vertical face',pg.evaluate("cur.round==AUSI&&cur.face3=='vert'"))
  chk('face button names the traffic light',pg.inner_text('#face3').strip()=='Face: Vertical 3-spot (traffic light)')
  chk('three spots drawn in a column',pg.evaluate("JSON.stringify(spots3(face3R(faceR(ROUNDS[cur.round],0),cur)))==JSON.stringify(BUGC)"))
  plot(pg,[(0.0,-0.62),(0.06,0.03),(-0.02,0.62+0.11)])   # top spot X, middle a 10/9, bottom an 8-ish
  e0=pg.evaluate("cur.ends[0]");print('vertical end',e0)
  chk('three arrows scored on the vertical face',len(e0)==3 and e0[0]=='X')
  rows=pg.evaluate(CHECK);print('plotted vs scored',rows)
  chk('vertical: every arrow mapped per spot',all(r[0]=='spot' for r in rows) and len(rows)==3)
  chk('vertical: plotted == scored',all(r[1]==r[2] for r in rows))
  chk('after plotting, the face button no longer offers single',pg.evaluate("(()=>{document.querySelector('#face3').click();return cur.face3})()")=='vegas')
  pg.wait_for_timeout(300);pg.evaluate("document.querySelector('#face3').click()");pg.wait_for_timeout(300)
  chk('and back to traffic light',pg.evaluate("cur.face3")=='vert')
  pg.evaluate("scrollTo(0,0)");pg.wait_for_timeout(200)
  pg.screenshot(path=f'{SH}/plotted-end-vertical.png')
  vid=pg.evaluate("cur.id");pg.evaluate("window._aid=cur.id");to_score(pg)
  rows=pg.evaluate(CHECK);chk('saved session: plotted == scored still',all(r[1]==r[2] for r in rows) and len(rows)==3)
  pg.evaluate(f"(()=>{{const s=S.sessions.find(x=>x.id=='{vid}');return 1}})()")
  # ---------- triangular and single ----------
  for f,want,spot in [('vegas','Face: Triangular 3-spot',True),('single','Face: Single 40cm face',False)]:
    to_score(pg);pg.select_option('#rd',AUS);pg.wait_for_timeout(200);pg.click(f'#f3row [data-f3={f}]');pg.wait_for_timeout(200);pg.click('#st');pg.wait_for_timeout(800)
    chk(f'{f}: session face',pg.evaluate("cur.face3")==f);chk(f'{f}: button label',pg.inner_text('#face3').strip()==want)
    chk(f'{f}: keys X 10 9 8 7 6 M',pg.evaluate("[...document.querySelectorAll('.ad-pad [data-k]')].map(b=>b.dataset.k)")==['X','10','9','8','7','6','M'])
    pts=[(-0.34,0.2),(0.34+0.05,0.2),(0,-0.39+0.1)] if spot else [(0,0),(0.1,0.05),(-0.55,0.4)]
    plot(pg,pts);rows=pg.evaluate(CHECK);print(f,pg.evaluate("cur.ends[0]"),rows)
    chk(f'{f}: mapped as {"spot" if spot else "full face"}',all(r[0]==('spot' if spot else 'full') for r in rows) and len(rows)==3)
    chk(f'{f}: plotted == scored',all(r[1]==r[2] for r in rows))
    if not spot:chk('single: X in the middle, outside the 6 is M, no ring below 6',pg.evaluate("cur.ends[0][0]")=='X' and 'M' in pg.evaluate("cur.ends[0]") and not any(a in list('12345') for a in pg.evaluate("cur.ends[0]")))
    pg.screenshot(path=f'{SH}/plotted-end-{f}.png');to_score(pg)
  chk('single pick did not leak into WA 18m',pg.evaluate("S.face3||null")==f30 and pg.evaluate("f3Pref('Indoor WA 18m')")==(f30 or 'vert'))
  chk('all three are the same round (PBs/averages)',pg.evaluate(f"S.sessions.filter(s=>s.round=='{AUS}').length")==3)
  # ---------- Casual ----------
  pg.click('[data-cstp="casual"]');pg.wait_for_timeout(300);pg.click('[data-csdisc="indoor"]');pg.wait_for_timeout(200)
  pg.select_option('#csrd',AUS);pg.wait_for_timeout(300)
  cl=pg.evaluate("[...document.querySelectorAll('[data-csf3]')].map(b=>b.dataset.csf3+'='+b.textContent.replace('✓','').trim())");print('casual faces',cl)
  chk('Casual: three faces for Aus Indoor',cl==['vert=Vertical 3-spot (traffic light)','vegas=Triangular 3-spot','single=Single 40cm face'])
  pg.evaluate("document.querySelector('#csrd').scrollIntoView({block:'start'})");pg.wait_for_timeout(200);pg.screenshot(path=f'{SH}/picker-casual.png')
  chk('Casual face text and keys follow the face',pg.evaluate(f"""[['vert','Vertical 3-spot (traffic light)','X 10 9 8 7 6 M'],['vegas','Triangular 3-spot','X 10 9 8 7 6 M'],['single','Single 40cm face','X 10 9 8 7 6 M']].every(([f,t,k])=>{{const c={{round:'{AUS}',face3:f,disc:'indoor'}};return csFaceTxt(c)==t&&csKeys(c,0).join(' ')==k}})"""))
  chk('Casual WA 18m unchanged: vertical / Vegas only',pg.evaluate("(()=>{document.querySelector('#csrd').value='Indoor WA 18m';document.querySelector('#csrd').dispatchEvent(new Event('change'));return [...document.querySelectorAll('[data-csf3]')].map(b=>b.dataset.csf3).join(',')})()")=='vert,vegas')
  # ---------- head-to-head ----------
  pg.evaluate("cur=null;nav('lab_match')");pg.wait_for_timeout(500);pg.click('#h2hnew summary');pg.select_option('#h2hrd',AUS);pg.wait_for_timeout(300)
  hl=pg.evaluate("[...document.querySelectorAll('#h2hf3 [data-f3]')].map(b=>b.textContent)");print('h2h faces',hl)
  chk('head-to-head: three faces for Aus Indoor',hl==['Vertical 3-spot (traffic light)','Triangular 3-spot','Single 40cm face'])
  pg.click('#h2hf3 [data-f3=vegas]');pg.wait_for_timeout(200);chk('h2h pick sticks',pg.locator('#h2hf3 [data-f3=vegas].on').count()==1)
  pg.click('#h2hf3 [data-f3=vert]');pg.wait_for_timeout(200)
  pg.evaluate("document.querySelector('#h2hrd').scrollIntoView({block:'start'})");pg.wait_for_timeout(200);pg.screenshot(path=f'{SH}/picker-h2h.png')
  # ---------- existing sessions untouched ----------
  S1=json.loads(pg.evaluate("localStorage.getItem(KEY)"));ids={s['id'] for s in old}
  chk('existing sessions unchanged',[s for s in S1['sessions'] if s['id'] in ids]==old)
  chk('no errors',not errs);errs and print(errs)
  b.close()
finally:srv.terminate()
print(len(ok),'ok');print('FAIL',bad[:30],len(bad)) if bad else print('all pass');sys.exit(1 if bad else 0)
