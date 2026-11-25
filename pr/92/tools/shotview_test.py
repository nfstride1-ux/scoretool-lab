# Arrow plot, this shoot vs usual, Finish session (23 Oct 2026, Sam Archer, iPhone 14, dark mode).
# Seeds a throwaway local copy of steven with 3 earlier Vegas 300s and today's (plotted on the Vegas 3-spot) in a test browser only;
# no network (relay, ntfy) so nothing leaves this machine. Checks: dots at real places on one WA spot (no grid squares), group centre,
# sight guide direction, comparisons vs earlier shoots, Past sessions Open shows the same view, Finish session saves nothing.
import subprocess,sys,time,os,json,re
os.environ['ST_NO_COMPAT']='1'
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-shotview');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);None if c else print('FAIL',n)
PORT=8827
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
SEED=r"""(()=>{let r=7;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647},gs=()=>{let u=0;for(let i=0;i<6;i++)u+=rnd();return u-3};
 const mk=(id,date,cx,cy,sd)=>{const R=ROUNDS['Vegas 300'],s={id,date,round:'Vegas 300',ends:[],pos:[],face3:'vegas',finished:true,note:''},F=face3R(faceR(R,0),s);
  for(let e=0;e<10;e++){const E=[],P=[];for(let j=0;j<3;j++){const lx=cx+gs()*sd*0.6,ly=cy+gs()*sd*0.6,c=TRIC[j],x=+(c[0]+lx*0.6).toFixed(3),y=+(c[1]+ly*0.6).toFixed(3);E.push(plotScore(x,y,F));P.push({x,y,g:1})}
   const pr=E.map((a,k)=>[a,P[k]]).sort((a,b)=>val(b[0])-val(a[0]));s.ends.push(pr.map(x=>x[0]));s.pos.push(pr.map(x=>x[1]))}return s};
 S.sessions=(S.sessions||[]).filter(s=>!/^sv/.test(s.id));
 S.sessions.push(mk('sv1','2026-10-02',0.02,0.0,0.2),mk('sv2','2026-10-09',-0.01,0.03,0.18),mk('sv3','2026-10-16',0.03,0.01,0.19),mk('sv4',today(),0.1,0.07,0.15));save()})()"""
def top(pg,sel):
  pg.evaluate(f"(()=>{{const e=document.querySelector({json.dumps(sel)});e.scrollIntoView({{block:'start'}});scrollBy(0,-80)}})()");pg.wait_for_timeout(200)
def store(pg):
  d=json.loads(pg.evaluate("localStorage.getItem(KEY)"));[d.pop(k,None) for k in ('volLog','_shootKey','fpHold','leagues','matches')]
  for k in ('diary','casual'):
    if d.get(k) is None:d[k]=[]
  return d
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  for W,H,theme in [(390,844,'dark'),(402,874,'light')]:
    tag=f'{theme}-{W}'
    ctx=b.new_context(viewport={'width':W,'height':H},has_touch=True,is_mobile=True,device_scale_factor=2)
    ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(f'http://localhost:{PORT}') else r.abort())
    pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and not re.search('INTERNET_DISCONNECTED|ERR_FAILED|Failed to load resource',m.text) and errs.append(m.text))
    pg.goto(f'http://localhost:{PORT}/?tester=steven');pg.wait_for_timeout(1200)
    pg.evaluate("S.unlocked=true;save()");pg.evaluate(f"localStorage.setItem('scoretool.theme','{theme}')");pg.evaluate(SEED);pg.reload();pg.wait_for_timeout(1800)
    # A: analytics arrow plot
    pg.evaluate("nav('analytics')");pg.wait_for_timeout(700)
    c=pg.locator('.shcard').first;c.scroll_into_view_if_needed();pg.wait_for_timeout(200)
    chk(tag+' A plot card',c.count()==1)
    chk(tag+' A no grid squares (only the full-size shading layer)',pg.evaluate("[...document.querySelectorAll('.shcard svg rect')].every(r=>+r.getAttribute('width')>=1)"))
    n=pg.evaluate("document.querySelectorAll('.shcard .shplot > circle[fill=\"#fff\"][stroke=\"#0b1f4d\"]').length")
    chk(tag+f' A one dot per plotted arrow ({n})',n==120)
    chk(tag+' A one spot drawn (3-spot arrows on one spot)',pg.evaluate("document.querySelector('.shcard .shplot').getAttribute('viewBox').startsWith('-0.54')"))
    chk(tag+' A no purple',not re.search(r'#(7c3aed|8b5cf6|a855f7|9333ea|6d28d9)',pg.locator('.shcard').first.inner_html(),re.I))
    t=pg.locator('.shcard').first.inner_text();chk(tag+' A sight guide',re.search('Windage: move the sight( a little)? (left|right)|Windage: no change',t) and 'Elevation' in t)
    chk(tag+' A mm known for 40cm',' mm)' in t)
    top(pg,'.shcard');pg.screenshot(path=f'{SH}/{tag}-A-1-analytics-plot.png');pg.evaluate('scrollBy(0,520)');pg.wait_for_timeout(150);pg.screenshot(path=f'{SH}/{tag}-A-2-sight-guide.png')
    # C via Past sessions Open
    pg.evaluate("nav('score')");pg.wait_for_timeout(600)
    S0=store(pg)
    pg.locator('[data-open=sv4]').scroll_into_view_if_needed();pg.locator('[data-open=sv4]').tap();pg.wait_for_timeout(800)
    t=pg.locator('#app').inner_text()
    chk(tag+' C vs usual card','THIS SHOOT VS YOUR USUAL' in t.upper() and '3 earlier shoots' in t)
    chk(tag+' C score by end vs average','your average at each end (3 shoots)' in t)
    chk(tag+' C Xs and 10s','XS AND 10S' in t.upper())
    chk(tag+' C plot with usual group','your usual group' in t and pg.locator('.shcmp .shplot').count()==1)
    g=pg.evaluate("(()=>{const q=shotPts(S.sessions.find(s=>s.id=='sv4')).target,n=q.length,cx=q.reduce((t,p)=>t+p.x,0)/n,cy=q.reduce((t,p)=>t+p.y,0)/n,se=k=>Math.sqrt(q.reduce((t,p)=>t+(p[k]-(k=='x'?cx:cy))**2,0)/(n-1)/n);return[cx,cy,Math.max(se('x'),0.005),Math.max(se('y'),0.005)]})()")
    # 30 Oct 2026: measured from the exact X centre; a move is given when the offset is bigger than its standard error (no 'centred' tolerance)
    chk(tag+f' C guide matches group {g}',bool(re.search('move the sight( a little)? right',t))==(g[0]>g[2]) and bool(re.search('move the sight( a little)? down',t))==(g[1]>g[3]))
    chk(tag+' C Finish session button',pg.locator('#finsess').is_visible())
    chk(tag+' C no overflow',pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    pg.screenshot(path=f'{SH}/{tag}-C-1-top.png')
    [(top(pg,f'.shcmp > .card:nth-child({i+1})'),pg.screenshot(path=f'{SH}/{tag}-C-{i+2}-compare.png')) for i in range(pg.locator('.shcmp > .card').count())]
    pg.locator('#finsess').scroll_into_view_if_needed();pg.wait_for_timeout(200);pg.screenshot(path=f'{SH}/{tag}-B-1-finish-button.png')
    pg.locator('#finsess').tap();pg.wait_for_timeout(700)
    chk(tag+' B done state',pg.evaluate('view')=='shotdone' and 'ALL DONE' in pg.locator('#app').inner_text().upper() and pg.locator('#shback').is_visible())
    chk(tag+' B nothing saved or doubled',store(pg)==S0 and pg.evaluate("S.sessions.filter(s=>s.id=='sv4').length")==1)
    pg.screenshot(path=f'{SH}/{tag}-B-2-done.png')
    pg.locator('#shback').tap();pg.wait_for_timeout(500);chk(tag+' B back to Score',pg.evaluate('view')=='score' and pg.evaluate('typeof cur=="undefined"||!cur'))
    # first shoot of a round: comparisons hidden, plot still shown
    pg.locator('[data-open=sv1]').scroll_into_view_if_needed();pg.locator('[data-open=sv1]').tap();pg.wait_for_timeout(700)
    t=pg.locator('#app').inner_text();chk(tag+' first shoot: no comparisons','YOUR USUAL' not in t.upper() and 'XS AND 10S' not in t.upper() and pg.locator('.shcmp .shplot').count()==1)
    chk(tag+' no errors',not errs);errs and print(errs)
    ctx.close()
  b.close()
finally:srv.terminate()
print(len(ok),'ok');print('FAIL',bad) if bad else print('all pass');sys.exit(1 if bad else 0)
