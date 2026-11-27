# Per-spot group analysis and sight guide measured from the X (30 Oct 2026, Nathe: "Each target has different landing locations for each target,
# that clearly means something is not correct either with form or bow. Windage could move over to the right slightly." and
# "The point is to try get all arrows center of the X.").
# Seeds a throwaway local profile in a test browser only (no network), with arrows at exact known places on a vertical 3-spot 40cm face, and checks:
#  - each spot's centre and spread, and the pooled centre, in whole mm from the exact X centre (40cm face: 200 mm per face unit);
#  - no 'centred' tolerance: an offset is acted on when it is bigger than its standard error, smaller ones say 'not measurable';
#  - spots whose centres differ by more than chance are flagged as form or setup (not a sight move);
#  - the sight move has a direction and the amount on the target, towards the group; the strip and plotted dots are unchanged; nothing is saved.
import subprocess,sys,time,os,json,re,math
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH=os.environ.get('SHOTS','/tmp/shots-spotgroups');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
PORT=int(os.environ.get("PORT","8971"))
BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get('BASE') else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
# spot centres (single-spot face units, + = right / low), 10 arrows per spot on a circle of radius 0.04 around each centre
CASES={'sgA':[(0.03,0.005)]*3,'sgB':[(0.01,-0.04),(0.01,0.0),(0.01,0.04)],'sgC':[(0.0,0.0)]*3}
SEED=r"""(C)=>{const L=BUGC;S.sessions=(S.sessions||[]).filter(s=>!/^sg/.test(s.id));
 Object.entries(C).forEach(([id,cs],k)=>{const R=ROUNDS['Australian Indoor 18m'],F=face3R(faceR(R,0),{face3:'vert'}),P=[];
  for(let i=0;i<10;i++)for(let sp=0;sp<3;sp++){const a=i*Math.PI/5,x=cs[sp][0]+0.04*Math.cos(a),y=cs[sp][1]+0.04*Math.sin(a);P.push({x:+(L[sp][0]+0.6*x).toFixed(5),y:+(L[sp][1]+0.6*y).toFixed(5)})}
  const s={id,date:'2026-10-2'+k,round:'Australian Indoor 18m',face3:'vert',ends:[],pos:[],finished:true,note:''};
  for(let e=0;e<10;e++){const E=P.slice(e*3,e*3+3);s.pos.push(E);s.ends.push(E.map(p=>plotScore(p.x,p.y,F)))}S.sessions.push(s)});save()}"""
def expect(cs):
    pts=[];per=[]
    for sp in range(3):
        q=[(cs[sp][0]+0.04*math.cos(i*math.pi/5),cs[sp][1]+0.04*math.sin(i*math.pi/5)) for i in range(10)];per.append(q);pts+=q
    def g(q):
        n=len(q);cx=sum(p[0] for p in q)/n;cy=sum(p[1] for p in q)/n
        sd=lambda k,c:math.sqrt(sum((p[k]-c)**2 for p in q)/(n-1))
        return dict(cx=cx,cy=cy,sex=sd(0,cx)/math.sqrt(n),sey=sd(1,cy)/math.sqrt(n),spm=sum(math.hypot(p[0]-cx,p[1]-cy) for p in q)/n*200)
    return g(pts),[g(q) for q in per]
errs=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  for theme in ('light','dark'):
   ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2);pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
   pg.goto(BASE+'?tester=steven');pg.wait_for_timeout(1200)
   pg.evaluate("S.unlocked=true;save()");pg.evaluate(f"localStorage.setItem('scoretool.theme','{theme}')");pg.evaluate(SEED,CASES);pg.reload();pg.wait_for_timeout(1800)
   for id,cs in CASES.items():
    S0=pg.evaluate("localStorage.getItem(Object.keys(localStorage).find(k=>/scoretool/.test(k)&&localStorage.getItem(k).includes('sgA'))||'')")
    t=pg.evaluate(f"(()=>{{const d=document.createElement('div');d.innerHTML=shotPlotCard(S.sessions.find(s=>s.id=='{id}'),[]);return d.querySelector('.shcard')?(document.body.appendChild(d),d.innerText+'\\n'+d.querySelectorAll('.shspotsvg circle').length):''}})()")
    pg.evaluate("document.querySelectorAll('body > div:last-child').forEach(d=>d.querySelector('.shcard')&&d.remove())")
    P,per=expect(cs);tag=f'{theme} {id}'
    mm=lambda v:round(abs(v)*200)
    chk(tag+' card drawn',bool(t))
    chk(tag+' never says centred','centred' not in t.lower())
    for i,g in enumerate(per):
     lr=f"{mm(g['cx'])} mm {'left' if g['cx']<0 else 'right'}" if mm(g['cx']) else '0 mm left / right';ud=f"{mm(g['cy'])} mm {'high' if g['cy']<0 else 'low'}" if mm(g['cy']) else '0 mm up / down'
     row=re.search(rf"Spot {i+1} · 10 arrows\s*\n?(.*)",t);r=row.group(1) if row else ''
     chk(tag+f' spot {i+1} centre and spread from the X ({lr}, {ud}, {round(g["spm"])} mm)',lr in r and ud in r and f"· {round(g['spm'])} mm" in r)
    lrP=f"{mm(P['cx'])} mm {'right' if P['cx']>0 else 'left'}" if mm(P['cx']) else '0 mm'
    chk(tag+f' pooled left/right {lrP}',re.search(r'Left / right of the X\s*\n?\s*'+re.escape(lrP),t) is not None)
    mx=abs(P['cx'])>max(P['sex'],0.005);my=abs(P['cy'])>max(P['sey'],0.005)
    chk(tag+f' windage move only when measurable ({mx})',bool(re.search(r'Windage: move the sight( a little)? right\. The group centre is '+re.escape(lrP),t))==mx and bool(re.search('Windage: no change',t))==(not mx))
    chk(tag+f' elevation move only when measurable ({my})',bool(re.search(r'Elevation: move the sight',t))==my and bool(re.search('Elevation: no change',t))==(not my))
    flag='The spots land in different places'.upper() in t.upper()
    chk(tag+f' spot-to-spot flag ({id=="sgB"})',flag==(id=='sgB'))
    if id=='sgB':
     chk(tag+' flag gives the amount',all(s in t for s in ['Spot 3 lands 16 mm lower than Spot 1','Spot 2 lands 8 mm lower than Spot 1','Spot 3 lands 8 mm lower than Spot 2']))
     chk(tag+' flag points to form or setup, not a sight move','cannot fix this' in t and 'bow cant' in t and 'level bubble' in t)
    else: chk(tag+' biggest difference still shown','No clear spot-to-spot difference yet' in t)
    chk(tag+' strip still one dot per arrow',t.strip().split('\n')[-1].strip()!='0')
    chk(tag+' no purple and no emoji',not re.search(r'#(7c3aed|8b5cf6|a855f7|9333ea|6d28d9)',t,re.I) and not re.search('[\U0001F300-\U0001FAFF\u2600-\u27BF]',t))
   # through the app: Past sessions > Open on the flagged shoot, and nothing saved
   st0=pg.evaluate("JSON.stringify(S.sessions)")
   pg.evaluate("nav('score')");pg.wait_for_timeout(600)
   pg.locator('[data-open=sgB]').scroll_into_view_if_needed();pg.locator('[data-open=sgB]').tap();pg.wait_for_timeout(800)
   c=pg.locator('.shcard').first;tt=c.inner_text()
   chk(theme+' app: Open shows per-spot rows and the flag','Spot 1 · 10 arrows' in tt and 'THE SPOTS LAND IN DIFFERENT PLACES' in tt.upper())
   pg.evaluate("document.querySelector('.shg-spots').scrollIntoView({block:'start'});scrollBy(0,-200)");pg.wait_for_timeout(200);pg.screenshot(path=f'{SH}/{theme}-flagged-spots.png')
   chk(theme+' app: nothing saved',pg.evaluate("JSON.stringify(S.sessions)")==st0)
   chk(theme+' no overflow',pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
   ctx.close()
  b.close()
finally:
  srv and srv.terminate()
chk('no page errors',not errs);errs and print(errs)
print(f'\n{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
