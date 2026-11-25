# Checks for real rankings + Coach's read (Nathe only). Serves the repo on a free port (or ST_PORT) and drives Chrome at 390 px.
import json,subprocess,time,sys,os
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
import freeport;PORT=freeport.get()   # ST_PORT or a free port, never a fixed one
srv=subprocess.Popen([sys.executable,'-m','http.server',PORT],cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
KEYS="""(F,P)=>JSON.stringify({n:F.rs.length,sum:F.sum,pd:F.dls.map(d=>[d,F.perDist[d][0]]),cons:F.cons.map(c=>[c.n,c.esd,c.asd]),ph:F.ph.map(p=>p.h),f:P?[P.avgF,P.pot]:null,E:F.E.length})"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  # playground reference numbers
  pg=b.new_page();pg.add_init_script('window.__NORENDER=true');pg.goto('http://localhost:'+PORT+'/c-7q4m9x2k/');pg.wait_for_timeout(800)
  ap=b.new_page(viewport={'width':390,'height':844});errs=[];ap.on('console',lambda m:m.type=='error' and errs.append(m.text));ap.on('pageerror',lambda e:errs.append(str(e)))
  ap.goto('http://localhost:'+PORT+'/');ap.wait_for_timeout(1000);nm_seed.pick(ap,'nathe');ap.wait_for_timeout(600)
  ap.evaluate("S.unlocked=true;save();render()");ap.wait_for_timeout(600)
  for _ in range(3):
   if ap.locator('nav [data-v=stats]').is_visible():break
   ap.locator('#app button').first.click();ap.wait_for_timeout(500)
  ap.evaluate('window.__REAL.load()');ap.wait_for_timeout(300)
  rounds=ap.evaluate('[...new Set(window.__REAL.R.map(r=>r.r))]')
  n=0
  for rd in rounds:
   for per in ['6','12','all']:
    for inc in [False,True]:
     a=ap.evaluate(f"(()=>{{const X=window.__REAL.readFig({{r:{json.dumps(rd)},p:'{per}',inc:{json.dumps(inc)}}});return ({KEYS})(X.F,X.P)}})()")
     q=pg.evaluate(f"(()=>{{const C=window.__CC,from='{per}'==='all'?'':C.ago(+'{per}'),s={{a:[18568],r:[{json.dumps(rd)}],from,to:'',dist:[],end:[],split:true,metric:'t',inc:{json.dumps(inc)}}};C.setS(s);const F=C.figures(s);return ({KEYS})(F,F.phil[0])}})()")
     n+=1;chk(f'match {rd} {per} {inc}',a==q)
  chk('trend matches playground',ap.evaluate('JSON.stringify(window.__REAL.trendOf(window.__REAL.R))')==pg.evaluate('JSON.stringify(window.__CC.squadFig(18568).trend)'))
  chk('incomplete flags match playground',ap.evaluate('JSON.stringify(window.__REAL.R.filter(window.__REAL.isInc).map(r=>r.a))')==pg.evaluate('JSON.stringify(window.__CC.R.filter(r=>r.m===18568&&window.__CC.isInc(r)).map(r=>r.a))'))
  chk('1060 on 11 Oct 26 is incomplete',ap.evaluate("window.__REAL.R.some(r=>r.dt=='2026-10-11'&&r.t==1060&&window.__REAL.isInc(r))"))
  # rankings: standard competition ranking, '=' only on real ties, list = playground's official Open list best
  rr=ap.evaluate("fetch('data/nathe_ad.json').then(r=>r.json()).then(j=>Object.keys(j.rank).map(k=>[k,window.__REAL.rankRows(k).map(r=>[r.n,r.s,r.rank,r.eq])]))")
  for k,rows in rr:
   good=all(r[2]==1+sum(1 for x in rows if x[1]>r[1]) and r[3]==(sum(1 for x in rows if x[1]==r[1])>1) for r in rows) and [r[1] for r in rows]==sorted([r[1] for r in rows],reverse=True)
   ref=pg.evaluate(f"window.__COACH_REF||(window.COACH_DATA.ranked.filter(a=>a.lists.includes('top10_open')&&a.best[{json.dumps(k)}]).map(a=>[a.name,a.best[{json.dumps(k)}].s]).sort((x,y)=>y[1]-x[1]))")
   chk(f'rank logic {k}',good and sorted(map(tuple,ref))==sorted((r[0],r[1]) for r in rows))
  # UI: Ranks
  ap.click('nav [data-v=rewards]');ap.wait_for_timeout(900)
  chk('real rank card shown',ap.locator('#realrank').count()==1 and ap.locator('#rankcard').count()==0)
  chk('AA top-10 list position shown','#9' in ap.inner_text('#realrank') and 'Clout' in ap.inner_text('#realrank'))
  chk('no Champion tier on profile',not ap.locator('.pcard .pill',has_text='Champion').count())
  opts=ap.eval_on_selector_all('#rrsel option','o=>o.map(x=>x.value)');ap.select_option('#rrsel','WA 90/1440');ap.wait_for_timeout(300)
  t=ap.inner_text('#realrank');chk('round switch shows WA 90/1440 and you',"WA 90/1440" in t and 'you' in t and len(opts)>=10)
  # gap lines: every rank between shown rows is covered by a 'not shown' line
  rows=ap.eval_on_selector_all('#realrank tr','t=>t.map(x=>x.innerText)')
  chk('gap lines present when ranks skipped',all(('not shown' in r) or r.split('\t')[0].lstrip('=').isdigit() for r in rows[1:]))
  # UI: Stats (Coach's read now lives behind More detail and follows the one Stats round/shoot picker)
  ap.click('nav [data-v=stats]');ap.wait_for_timeout(1200)
  if not ap.evaluate('!!S.statsMore'):ap.click('#moredet');ap.wait_for_timeout(500)
  ap.select_option('#srd','WA 90/1440');ap.wait_for_timeout(500)
  chk('coach read on stats, behind More detail',ap.locator('#more #coachread').count()==1 and ap.locator('#adlist').count()==0)
  chk('coach read follows the round picker',ap.get_attribute('#coachread','data-round')=='WA 90/1440')
  b4=ap.inner_text('#coachread');ap.check('#incinc');ap.wait_for_timeout(500);chk('incomplete tick changes count',ap.inner_text('#coachread')!=b4)
  chk('incomplete tagged in shoot picker','Incomplete' in ap.text_content('#ssh'))
  ap.uncheck('#incinc');ap.wait_for_timeout(300)
  chk('no horizontal overflow',ap.evaluate('document.documentElement.scrollWidth')<=390)
  # another tester sees none of it
  ap.evaluate("S.profile='Lee Archer'");ap.click('nav [data-v=rewards]');ap.wait_for_timeout(600);ap.click('nav [data-v=stats]');ap.wait_for_timeout(600)
  chk('other tester: no real rank / coach read',ap.locator('#realrank,#coachread').count()==0)
  chk('no console errors',not errs);print('ERR',errs[:3])
  b.close()
finally: srv.terminate()
print('real checks: PASS',len(ok),'FAIL',len(bad),bad[:10])
sys.exit(1 if bad else 0)
