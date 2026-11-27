# Line cutters at the true arrow size (30 Oct 2026, Nathe chose option A: "Score line-cutters using the shoot's chosen arrow size ...
# This applies to NEW shoots only: past/saved scores must never be recalculated or changed").
# Throwaway test profile in a test browser only (no network). Checks:
#  - a borderline arrow, just outside the reach of a 23's true radius (4.56 mm) but inside the old 7 mm 3-spot allowance,
#    scores the lower ring (9) when tapped on a NEW shoot's scoring face; one inside true reach still gets the line cutter (10);
#  - the same arrow on an OLD saved shoot (scored 10 with the old allowance) keeps its stored 10: after a reload, after a new
#    shoot is scored, and after opening it in Past sessions, the saved record is byte-for-byte the same and gains no arrow size;
#  - the old shoot's card still draws that arrow at the old size, so its edge touches the 10 line it scored.
import subprocess,sys,time,os,json,math
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH=os.environ.get('SHOTS','/tmp/shots-linecut');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
PORT=int(os.environ.get("PORT","8974"))
BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get('BASE') else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
IN=25.4;r23=23/64*IN/2/200;OLD=0.035          # spot units, 1 = full 40cm face radius = 200 mm
DB=0.1+(r23+OLD)/2                             # borderline: outside true 23 reach of the 10 line, inside the old allowance
DI=0.1+r23*0.4                                 # inside true reach: still a line cutter
RD='Australian Indoor 18m'
SEED=r"""([db])=>{S.sessions=(S.sessions||[]).filter(s=>!/^lc/.test(s.id));const c=BUGC[1],F=face3R(faceR(ROUNDS['%s'],0),{face3:'vert'});
 const pos=[{x:+(c[0]+0.6*db).toFixed(6),y:c[1]},{x:c[0],y:c[1]},{x:BUGC[0][0],y:+(BUGC[0][1]+0.6*0.15).toFixed(6)}];
 S.sessions.push({id:'lcold',date:'2026-10-15',round:'%s',face3:'vert',ends:[pos.map(p=>plotScore(p.x,p.y,F))],pos:[pos],finished:true,note:''});save()}"""%(RD,RD)
OLDS="JSON.stringify(S.sessions.find(s=>s.id=='lcold'))"
errs=[]
def tap(pg,x,y):
    q=pg.evaluate("([x,y])=>{const sv=document.querySelector('#pface'),p=sv.createSVGPoint();p.x=x;p.y=y;const r=p.matrixTransform(sv.getScreenCTM());return[r.x,r.y]}",[x,y])
    pg.mouse.click(q[0],q[1]);pg.wait_for_timeout(350)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
  if not os.environ.get('BASE'):ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(f'http://localhost:{PORT}') else r.abort())
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(BASE+'?tester=steven');pg.wait_for_timeout(1200)
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Steven';save()");pg.evaluate(SEED,[DB]);pg.reload();pg.wait_for_timeout(1800)
  o0=pg.evaluate(OLDS);O=json.loads(o0)
  chk(f'old shoot scored with the old 7 mm allowance: borderline arrow stored as 10 ({O["ends"][0]})',O['ends'][0][0]=='10' and 'lcT' not in O and 'arrowD' not in O)
  # the scoring function itself, both faces
  F3="face3R(faceR(ROUNDS['%s'],0),{face3:'vert'})"%RD;NEW="{lcT:1,arrowD:{k:'s23',mm:9.128}}"
  chk('3-spot borderline: old allowance 10, true 23 radius 9',pg.evaluate(f"(()=>{{const F={F3},c=BUGC[1],x=c[0]+0.6*{DB},y=c[1];return[plotScore(x,y,F),plotScore(x,y,F,arrowLC(F,{NEW}))]}})()")==['10','9'])
  chk('3-spot no lcT: arrowLC is null, so old shoots keep the old allowance',pg.evaluate(f"arrowLC({F3},{{arrowD:{{mm:9.128}}}})") is None and pg.evaluate(f"arrowLC({F3},null)") is None)
  d40=0.1+(r23+0.028)/2
  chk('40cm full face borderline: old 5.6 mm allowance 10, true 23 radius 9',pg.evaluate(f"(()=>{{const F={{face:'40cm'}};return[plotScore({d40},0,F),plotScore({d40},0,F,arrowLC(F,{NEW}))]}})()")==['10','9'])
  # a NEW shoot, tapped on the real scoring face (zoomed 3x for a precise tap)
  pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(500);pg.select_option('#rd',RD);pg.wait_for_timeout(300)
  if pg.locator('#f3row [data-f3=vert]').count():pg.click('#f3row [data-f3=vert]')
  pg.click('#st');pg.wait_for_timeout(800)
  chk('new shoot is scored at the true size (lcT=1, 23 mm locked)',pg.evaluate("cur.lcT===1&&Math.abs(cur.arrowD.mm-9.128)<0.001"))
  pg.click('#zcycle');pg.wait_for_timeout(200);pg.click('#zcycle');pg.wait_for_timeout(400)
  c=pg.evaluate("BUGC[1]")
  tap(pg,c[0]+0.6*DB,c[1]);tap(pg,c[0]+0.6*DI,c[1])
  E=pg.evaluate("[cur.ends[0],cur.pos[0]]");print('new shoot end',E)
  dd=[math.hypot(q['x']-c[0],q['y']-c[1])/0.6 for q in E[1]] if len(E[1])>=2 else [0,0]
  chk(f'tapped borderline arrow landed between the true and old reach ({dd[0]:.4f} in ({0.1+r23:.4f}, {0.1+OLD:.4f}))',0.1+r23<dd[0]<0.1+OLD)
  chk('new shoot: borderline arrow just outside true 23 reach scores the lower ring (9)',len(E[0])>=1 and E[0][0]=='9')
  chk(f'new shoot: arrow inside true reach ({dd[1]:.4f}) still cuts the line (10)',len(E[0])>=2 and E[0][1]=='10' and dd[1]<0.1+r23)
  pg.locator('#fwrap').screenshot(path=f'{SH}/linecut-new-shoot-9-and-10.png')
  chk('scoring a new shoot did not touch the old one',pg.evaluate(OLDS)==o0)
  pg.evaluate("S.sessions=S.sessions.filter(s=>s!==cur);cur=null;save()");pg.reload();pg.wait_for_timeout(1800)
  chk('after reload the old shoot is unchanged (no recalculation on load)',pg.evaluate(OLDS)==o0)
  pg.evaluate("cur=null;nav('score')");pg.wait_for_timeout(500)
  pg.locator('[data-open=lcold]').scroll_into_view_if_needed();pg.locator('[data-open=lcold]').tap();pg.wait_for_timeout(900)
  chk('old shoot opened in Past sessions keeps its stored 10 and total',pg.evaluate("cur&&cur.id=='lcold'&&cur.ends[0][0]=='10'") and pg.evaluate(OLDS)==o0)
  rr=pg.evaluate("[...document.querySelectorAll('.shcard .shclean circle[fill-opacity]')].map(e=>[+e.getAttribute('cx'),+e.getAttribute('r')])")
  bl=[q for q in rr if abs(q[0]-DB)<1e-3]
  chk(f'old shoot card draws the borderline arrow at the old size, edge touching the 10 line {bl}',len(bl)==1 and bl[0][1]==OLD and DB-bl[0][1]<0.1)
  pg.locator('.shcard').first.scroll_into_view_if_needed();pg.locator('.shcard').first.screenshot(path=f'{SH}/linecut-old-shoot-card.png')
  pg.evaluate("cur=null;nav('score')");pg.wait_for_timeout(400)
  chk('after viewing, the old shoot is still byte-for-byte the same',pg.evaluate(OLDS)==o0)
  pg.evaluate("S.sessions=S.sessions.filter(s=>!/^lc/.test(s.id));save()")
  b.close()
finally:
  srv and srv.terminate()
chk('no page errors',not errs);errs and print(errs)
print(f'{len(ok)} passed, {len(bad)} failed')
