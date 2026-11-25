# Casual shoot 3D (23 Oct 2026): 3D in the discipline row, ABA / IBO / ASA rounds with their keys (from the Rules page),
# chosen number of targets, scores relay between phones (2-digit scores), totals, match play seeded from 3D totals, offline queue,
# testers' existing data untouched. Relay mocked in memory (TEST data only, never posted).
import subprocess,sys,time,os,json
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n,flush=True)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'shots-3d');os.makedirs(OUT,exist_ok=True)
srv=subprocess.Popen([sys.executable,'-m','http.server','8787'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
RELAY={};N=[0];OFF=set()
def mk(tid):
  def relay(route,req):
    if tid in OFF:return route.abort()
    u=urlparse(req.url);topic=u.path.strip('/').split('/')[0];L=RELAY.setdefault(topic,[])
    if req.method=='POST':
      N[0]+=1;L.append({'id':'m%06d'%N[0],'event':'message','topic':topic,'message':req.post_data or ''});return route.fulfill(status=200,body='{}',headers={'access-control-allow-origin':'*'})
    since=parse_qs(u.query).get('since',['all'])[0];out=[m for m in L if since=='all' or m['id']>since]
    route.fulfill(status=200,body='\n'.join(json.dumps(m) for m in out)+('\n' if out else ''),headers={'access-control-allow-origin':'*'})
  return relay
NAMES={'logan':'Lee Archer','joseph':'Jo Archer'}
errs=[]
def phone(b,tid):
  ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);ctx.route('https://ntfy.sh/**',mk(tid))
  ctx.add_init_script("for(const id of %s)if(id!='%s')localStorage.removeItem('scoretool.dname.'+id)"%(json.dumps(nm_seed.IDS),tid));pg=ctx.new_page()
  pg.on('pageerror',lambda e:errs.append(f'{tid}: {e}'));pg.on('dialog',lambda d:d.accept())
  pg.goto(f'http://localhost:8787/?tester={tid}');pg.wait_for_timeout(1200)
  pg.evaluate("n=>{S.unlocked=true;if(!S.profile)S.profile=n;save()}",NAMES[tid]);pg.reload();pg.wait_for_timeout(2000);return ctx,pg
CT="(async()=>{while(csBusy)await new Promise(r=>setTimeout(r,40));await csTick(true)})()"
def ct(*P):
  for _ in range(2):
    for pg in P:pg.evaluate(CT);pg.wait_for_timeout(100)
def shot(pg,name,full=False):
  if full:
    h=pg.evaluate("(()=>{const s=document.getElementById('scroller');return Math.ceil(s.scrollHeight+(document.querySelector('header.top')||{offsetHeight:0}).offsetHeight+(document.getElementById('tabs')||{offsetHeight:0}).offsetHeight)})()")
    pg.set_viewport_size({'width':390,'height':max(844,min(h,6000))});pg.wait_for_timeout(150)
  pg.screenshot(path=os.path.join(OUT,name+'.png'))
  if full:pg.set_viewport_size({'width':390,'height':844});pg.wait_for_timeout(100)
def to_score(pg):pg.evaluate("cur=null;sv='sheet';window._csv=null;nav('score')");pg.wait_for_timeout(300)
def fill(pg,code,pid,arr):return pg.evaluate("([c,p,A])=>A.map(k=>csKey(c,p,k)).every(Boolean)",[code,pid,arr])
def keys(pg):return pg.evaluate("[...document.querySelectorAll('[data-csk]')].map(b=>b.dataset.csk+':'+b.className)")
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  cL,L=phone(b,'logan');cJ,J=phone(b,'joseph')
  # existing tester data: an old session and an old casual shoot must not change
  L.evaluate("(()=>{S.sessions.push({id:'old1',date:'2026-10-01',round:'WA 720 (70m)',ends:[['X','10','9']],pos:[[]]});save()})()")
  before=L.evaluate("JSON.stringify(S.sessions.filter(s=>s.id=='old1'))")
  to_score(L);L.click('[data-cstp="casual"]');L.wait_for_timeout(300)
  chk('Discipline row: Target, Indoor, Field, Clout, 3D',L.evaluate("[...document.querySelectorAll('[data-csdisc]')].map(b=>b.textContent.replace('✓','').trim())")==['Target','Indoor','Field','Clout','3D'])
  L.click('[data-csdisc="3d"]');L.wait_for_timeout(250)
  chk('3D rounds: ABA 3/2/1-arrow, ABA 3+1, IBO, ASA',L.evaluate("[...document.querySelectorAll('#cs3t option')].map(o=>o.textContent.replace(/ \(.*a target\)$/,''))")==['ABA 3-arrow','ABA 2-arrow','ABA 1-arrow','ABA 3-arrow + 1-arrow','IBO','ASA'])
  chk('ABA 3-arrow keys 20 18 16 14 12 10 8 6 4 M','keys 20 18 16 14 12 10 8 6 4 M' in L.inner_text('#csfacetxt'))
  L.fill('#cstype','Sam');L.click('#csaddn');L.wait_for_timeout(150)
  L.fill('#cstype','Joseph');L.wait_for_timeout(150);L.click('[data-cslink="joseph"]');L.wait_for_timeout(150)
  shot(L,'3d-01-picker',True)
  for t,kk in [('aba2','20 18 16 14 12 10 M'),('aba1','20 18 16 M'),('ibo','11 10 8 5 M'),('asa','12 10 8 5 M')]:
    L.select_option('#cs3t',t);L.wait_for_timeout(200);chk(f'{t} keys {kk}','keys '+kk+' ' in L.inner_text('#csfacetxt')+' ')
  shot(L,'3d-02-picker-asa')
  chk('Just me picker has no casual 3D rounds',L.evaluate("(()=>Object.keys(ROUNDS).filter(r=>ROUNDS[r].d3&&!ROUNDS[r].legacy).length)()")==0)
  results={}
  for t,n,arr in [('aba3',4,['20','14','M','6']),('ibo',3,['11','8','5']),('asa',3,['12','10','M'])]:
    to_score(L);L.click('[data-cstp="casual"]');L.wait_for_timeout(200);L.click('[data-csdisc="3d"]');L.wait_for_timeout(200)
    L.select_option('#cs3t',t);L.wait_for_timeout(150);L.fill('#cs3n',str(n));L.dispatch_event('#cs3n','change');L.wait_for_timeout(150)
    if t!='aba3':
      L.fill('#cstype','Sam');L.click('#csaddn');L.wait_for_timeout(150)
      if t=='asa':L.fill('#cstype','Joseph');L.wait_for_timeout(150);L.click('[data-cslink="joseph"]');L.wait_for_timeout(150)
    L.fill('#csname',f'Melville 3D {t} TEST');L.click('#csgo');L.wait_for_timeout(400)
    code=L.evaluate("window._csv");cs=L.evaluate(f"(c=>{{const s=csGet(c);return{{r:s.round,d:s.disc,e:ROUNDS[s.round].ends}}}})('{code}')")
    chk(f'{t}: {n} targets, disc 3d ({cs["r"]})',cs['d']=='3d' and cs['e']==n)
    sam=L.evaluate(f"csGet('{code}').ppl.find(p=>!p.tid).id")
    k=keys(L);chk(f'{t}: keys gold/blue/navy/grey only',all(x.split(':')[1] in('k-y','k-b','k-n','k-m') for x in k))
    L.click(f'[data-csk="{arr[0]}"]');L.wait_for_timeout(150)
    shot(L,f'3d-03-enter-{t}')
    fill(L,code,'logan',arr[1:])
    fill(L,code,sam,[arr[-1]]*n)
    results[t]=(code,sam,arr)
  # Joseph joins the ASA shoot on his phone and scores himself; scores cross phones (2-digit values)
  code,sam,arr=results['asa'];ct(L);[J.evaluate("(async()=>{while(h2hBusy)await new Promise(r=>setTimeout(r,40));await h2hTick(true)})()") for _ in range(2)];to_score(J)
  chk('Joseph sees the 3D invite',J.locator(f'[data-csacc="{code}"]').count()==1);J.click(f'[data-csacc="{code}"]');J.wait_for_timeout(500);ct(J,L)
  chk('Joseph got the ASA shoot',J.evaluate(f"!!csGet('{code}')&&!!ROUNDS[csGet('{code}').round]"))
  OFF.add('joseph');fill(J,code,'joseph',['12','12','8']);J.evaluate(CT);J.wait_for_timeout(300)
  chk('offline: saved on the phone',J.evaluate(f"csGet('{code}').qfail")==1);OFF.discard('joseph');ct(J,L,J,L)
  rowsL=L.evaluate(f"csSeeds(csGet('{code}')).map(id=>[id,csRow(csGet('{code}'),id).tot])")
  chk(f'ASA totals synced: {rowsL}',dict(rowsL)=={'logan':22,'joseph':32,sam:0})
  L.evaluate(f"csView('{code}')");L.wait_for_timeout(300);shot(L,'3d-04-totals-asa',True)
  chk('table headings 12s / 10s',L.evaluate("[...document.querySelectorAll('.cs-tab th')].map(x=>x.textContent)")==['Archer','Targets','Score','12s','10s'])
  # match play from 3D totals
  L.evaluate(f"csMpSetup('{code}',true)");L.wait_for_timeout(200)
  m=L.evaluate(f"(c=>{{const m=h2hGet(c+'M');return{{s:m.su.seeds,r:m.sur}}}})('{code}')")
  chk(f'match play seeded from 3D totals {m["s"]}',m['s']==['joseph','logan',sam] and m['r']['ape']==1 and m['r']['d3']==1)
  L.evaluate(f"csView('{code}')");L.wait_for_timeout(200);L.click('#csmpopen');L.wait_for_timeout(300);shot(L,'3d-05-matchplay-asa',True)
  chk('match play: 12 counts in 3D',L.evaluate(f"suKey('{code}M',0,'12','{sam}')") and L.evaluate(f"suSum(['12','10'],h2hGet('{code}M').sur)")==22)
  # IBO and ABA totals
  for t,tot in [('aba3',40+6*0+0),('ibo',24)]:
    c,s,a=results[t];L.evaluate(f"csView('{c}')");L.wait_for_timeout(250);shot(L,f'3d-04-totals-{t}',True)
    tt=L.evaluate(f"csRow(csGet('{c}'),'logan').tot");chk(f'{t} total {tt}',tt==sum(int(x) if x!='M' else 0 for x in a))
  chk('own session kept with 3D round, reloads',L.evaluate(f"!!S.sessions.find(s=>s.id=='cs-{results['ibo'][0]}')"))
  L.reload();L.wait_for_timeout(2000)
  chk('after reload the 3D rounds still exist',L.evaluate(f"!!ROUNDS[csGet('{results['ibo'][0]}').round]"))
  for v in ['home','score','stats','diary','me','squad']:
    try:L.evaluate(f"nav('{v}')");L.wait_for_timeout(300)
    except Exception as e:errs.append(f'nav {v}: {e}')
  chk('old session unchanged',L.evaluate("JSON.stringify(S.sessions.filter(s=>s.id=='old1'))")==before)
  b.close()
finally:
  srv.terminate()
print('ERRORS',errs);print(f'{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad or errs else 0)
