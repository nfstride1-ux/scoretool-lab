# Stats redesign + Coach's bug list (tester Nathaniel Stride, plus Logan for 'other testers still work'). Chrome, 390x844.
import subprocess,sys,time,os,re,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen([sys.executable,'-m','http.server','8772'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
def login(pg,who):
  pg.goto('http://localhost:8772/');pg.wait_for_timeout(1000);nm_seed.pick(pg,who);pg.wait_for_timeout(500)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
  for _ in range(3):
    if pg.locator('nav [data-v=score]').is_visible():break
    pg.locator('#app button').first.click();pg.wait_for_timeout(400)
  pg.wait_for_timeout(1500)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  login(pg,'Nathaniel Stride');E=pg.evaluate
  T=lambda v:(pg.click(f'nav [data-v={v}]'),pg.wait_for_timeout(900),pg.inner_text('#app'))[2]
  st=lambda:(pg.click('nav [data-v=stats]'),pg.wait_for_timeout(900))
  def rnd(r):pg.select_option('#srd',r);pg.wait_for_timeout(400)
  def more(on=True):
    if E('!!S.statsMore')!=on:pg.click('#moredet');pg.wait_for_timeout(400)
  def sync(lbl):
    rs=pg.eval_on_selector_all('[data-round]','e=>e.map(x=>x.dataset.round)');ns=pg.eval_on_selector_all('[data-n]','e=>e.map(x=>+x.dataset.n)')
    n=int(re.match(r'(\d+) shoot',pg.inner_text('#statcount')).group(1));opts=pg.locator('#ssh option').count();sel=pg.input_value('#srd')
    chk(f'sync {lbl}: every card same round',len(rs)>=4 and set(rs)=={sel})
    chk(f'sync {lbl}: every card same shoot count',set(ns)=={n} and opts==n and f'({n})' in pg.locator('#srd option:checked').inner_text())
  # ---------- layout ----------
  E('S.statsMore=false;S.incInc=false;save()');st()
  chk('one round picker + one shoot picker',pg.locator('#app select').count()==2 and pg.locator('#srd').count()==1 and pg.locator('#ssh').count()==1)
  chk('4 front cards only',[pg.locator(x).is_visible() for x in ['#c-last','#c-trend','#c-pb','#c-hist']]==[True]*4 and pg.locator('#app > .card:visible').count()==5)
  chk('More detail hidden by default',pg.locator('#more').is_hidden() and pg.locator('#moredet').is_visible())
  more(True)
  for x in ['#c-half','#c-spread','#c-pot','#c-early','#c-rating','#c-compare','#coachread','#goan2']:chk('More detail has '+x,pg.locator('#more '+x).count()==1)
  chk('still one round/shoot picker with detail open',pg.locator('#app select').count()==2)
  for r in ['Holt','WA 90/1440','WA Field 24Mk Red','WA 50/720','WA 60/900 (Canberra)']:
    rnd(r);sync(r)
  rnd('WA 90/1440');pg.check('#incinc');pg.wait_for_timeout(400);sync('WA 90/1440 + incomplete');pg.uncheck('#incinc');pg.wait_for_timeout(400)
  rnd('Holt');o=pg.eval_on_selector_all('#ssh option','o=>o.map(x=>x.value)');pg.select_option('#ssh',o[3]);pg.wait_for_timeout(400)
  d=E("statPool().find(s=>s.id==_st2.id).date");sync('Holt, 4th shoot')
  chk('shoot picker drives Last shoot + half split',pg.input_value('#ssh')==o[3] and pg.inner_text('#c-last').startswith('CHOSEN SHOOT') and str(int(d[8:])) in pg.inner_text('#c-half'))
  chk('More detail stays open (coach mode)',pg.locator('#more').is_visible())
  # ---------- plain words ----------
  txt=pg.inner_text('#app')
  for w in ['(SD)','end spread','End spread','rolling average','Rolling average','Potential','Flights','Round phase','Half split','AA rule 4.1','Evidence bank','localStorage','Elite III','8.41']:chk('Stats has no "'+w+'"',w not in txt)
  chk('Stats has no Champion tier',not re.search(r'Champion(?!ship)',txt,re.I))
  chk('no QRE on Stats','QRE' not in txt)
  home=T('home');score=T('score');ranks=T('rewards');me=T('me');fol=T('follow')
  for nm,t in [('Home',home),('Score',score),('Ranks',ranks),('Me',me),('Following',fol)]:
    for w in ['localStorage','Evidence bank','AA rule 4.1','Elite III','Bronze III','Diamond','Platinum','Peak rank']:chk(f'{nm} has no "{w}"',w not in t)
    chk(f'{nm} has no Champion tier',not re.search(r'Champion(?!ship)',t,re.I))
  chk('Score: Ghost match explained','shoot against a past score' in score)
  chk('Ranks: activity points, no XP','activity points' in ranks and not re.search(r'\bXP\b',ranks))
  chk('Ranks: Season stripe explained','banner designs' in ranks)
  chk('Ranks: no QRE (plain words)','QRE' not in ranks and 'Qualifying' not in ranks)
  # ---------- one home each ----------
  T('home');chk('Home: no rank card',pg.locator('#rank-slot,#rankcard,#realrank').count()==0 and 'Grand Master' not in home)
  chk('Home: no badges',pg.locator('.irow').count()==0 and 'BADGES' not in home)
  chk('Home: wins of the day once',home.count('WINS OF THE DAY')<=1)  # new layout: may live in My archery, never twice
  chk('Home: competition scores once',home.count('COMPETITION SCORES')<=1)
  T('rewards');chk('Ranks: no profile card, no badges',pg.locator('.pcard').count()==0 and 'BADGES' not in ranks)
  chk('Ranks: rank shown',pg.locator('#realrank').count()==1 and 'Grand Master Bowman' in ranks)
  T('me');chk('Me: badges, no rank',pg.locator('.pcard').count()==1 and 'BADGES' in me and 'Grand Master' not in me and pg.locator('.pcard .pill').count()==0)
  st();t=pg.inner_text('#app');chk('Stats: no wins, no competition list, no rank pill',('WINS' not in t) and ('COMPETITION SCORES' not in t) and pg.locator('.pill').count()==0)
  chk('Stats: one PB view',pg.locator('#c-pb').count()==1 and pg.locator('#bscard').count()==0 and t.count('PERSONAL BEST')==1)
  # ---------- bugs ----------
  rnd('WA 90/1440');more(True)
  chk('B1 1060 not in shoot picker by default','1060' not in pg.text_content('#ssh'))
  chk('B1 half split not 529/531',(pg.inner_text('#h1'),pg.inner_text('#h2'))!=('529','531'))
  chk('B1 1060 not in history chart',E("statPool().every(s=>s.score!=1060)"))
  chk('B1 Wins of the day not from the 1060','2026-10-11' not in E("document.createElement('div').innerHTML") and E("(()=>{const L=realShoots().filter(x=>!x.incomplete).slice(-1)[0];return L.date!='2026-10-11'||L.score!=1060})()"))
  E("nav('lab_latest')");pg.wait_for_timeout(700)  # new layout: the wins card is in My archery > Latest shoot
  chk('B1 Home wins card not the 1060','2026-10-11' not in pg.inner_text('#winsday'))
  chk('B1 Analytics leaves the 1060 out',E("(()=>{const A=_anShoots();return A.some(s=>s.score==1060&&s.part)})()") and E("S.incInc")==False)
  E("window._af={range:'all',round:'WA 90/1440',bow:'all',kind:'all'}");pg.click('nav [data-v=stats]');pg.wait_for_timeout(400);E("nav('analytics')");pg.wait_for_timeout(700)
  chk('B1 Analytics total excludes 1060','1060' not in pg.inner_text('#app'))
  st();rnd('WA 90/1440');pg.check('#incinc');pg.wait_for_timeout(400)
  chk('B1 Include incomplete brings it back, tagged',any('1060' in x and 'Incomplete' in x for x in pg.eval_on_selector_all('#ssh option','o=>o.map(x=>x.textContent)')))
  pg.select_option('#ssh',[v for v,x in zip(pg.eval_on_selector_all('#ssh option','o=>o.map(x=>x.value)'),pg.eval_on_selector_all('#ssh option','o=>o.map(x=>x.textContent)')) if '1060' in x][0]);pg.wait_for_timeout(400)
  lt=pg.inner_text('#c-last');chk('B8 1060 ends reconciled (22 on sheet = 21 scored + 1 all-miss)','22 ends filled in' in lt and '21 scored' in lt and '21 ends' in lt)
  pg.uncheck('#incinc');pg.wait_for_timeout(300)
  rnd('Holt');sh=pg.text_content('#ssh')
  chk('B2 Holt 823 (1 Aug 2026) in shoot picker','1 Aug 2026 · 823' in sh)
  chk('B2 Holt 823 in official scores',E("findReal(S.profile).some(r=>r.date=='2026-08-01'&&r.score==823)"))
  chk('B2/B3 Holt PB 823',pg.inner_text('#pbscore')=='823')
  pbs=dict(x.rsplit('\t',1) if '\t' in x else (x,'') for x in pg.eval_on_selector_all('#allpbs .list-item','e=>e.map(x=>x.innerText.replace(/\\n/g,"\\t").replace(/\\t[^\\t]*$/,""))'))
  ap={r:E(f"(()=>{{const el=[...document.querySelectorAll('#allpbs .list-item')].find(x=>x.firstElementChild.textContent=={json.dumps(r)});return el?+el.querySelector('b').textContent:null}})()") for r in ['Holt','WA 60/900 (Canberra)','WA 50/720']}
  chk('B3 true PBs 823/865/672',ap=={'Holt':823,'WA 60/900 (Canberra)':865,'WA 50/720':672})
  E("window._af={range:'all',round:'Holt',bow:'all',kind:'all'}");E("nav('analytics')");pg.wait_for_timeout(700)
  chk('B2 Analytics PB progression has 823','823' in pg.inner_text('#app'))
  chk('B6 Analytics bow filter has no Practice',pg.eval_on_selector_all('#fb option','o=>o.map(x=>x.value)')==['Compound','Recurve','Barebow','Longbow'])
  E("window._af.kind='practice'");E("nav('analytics')");pg.wait_for_timeout(500)
  chk('B9 Analytics: the 782 paper sheet is not practice',E("_anShoots().filter(s=>s.kind=='practice').length")==0 and E("_anShoots().some(s=>s.score==782&&s.kind=='comp')"))
  # legend ranges
  def legend_ok():
    zs=pg.eval_on_selector_all('#c-last .zr','e=>e.map(x=>x.textContent)');rng=[]
    for z in zs:
      m=re.search(r'([\d.]+)–([\d.]+)',z)
      if m:rng.append((float(m.group(1)),float(m.group(2))))
    rng.sort();return zs,len(rng)>=2 and all(rng[i][1]<rng[i+1][0] for i in range(len(rng)-1))
  st();rnd('WA 90/1440');zs,good=legend_ok();chk('B4 official legend non-overlapping',good and len(zs)==5 and 'under 3' in zs[-1])
  E("""(()=>{const R='WA 720 (50m Compound)',e=[...Array(12)].map(()=>['X','10','9','9','8','7']);S.sessions.push({id:'t_prac',date:'2026-10-16',round:R,ends:e,pos:[],note:''});save()})()""")
  st();rnd('WA 50/720');pg.select_option('#ssh','t_prac');pg.wait_for_timeout(300);zs,good=legend_ok()
  chk('B4 practice legend non-overlapping',good and 'Practice' in pg.inner_text('#c-last'))
  rnd('WA Field 24Mk Red');zs=pg.eval_on_selector_all('#c-last .zr','e=>e.map(x=>x.textContent)')
  chk('field legend gold/black only',[z.split()[0] for z in zs]==['Gold','Black'])
  chk('B11 WA Field 24Mk Red shows end-by-end',pg.locator('#c-last .ec svg').count()==1 and 'Needs a shoot' not in pg.inner_text('#app'))
  # recurve / longbow
  chk('B5 only compound in his data',E("findReal(S.profile).every(r=>/compound/i.test(r.division))") and E("statShoots().filter(s=>s.r).every(s=>/compound/i.test(s.r.division))"))
  chk('B5 30 Jul 26 Aus Indoor: 283 only',E("statShoots().filter(s=>s.date=='2026-07-30').map(s=>s.score).join()")=='283')
  chk('B5 excluded, not deleted',E("JSON.stringify(window._excluded)")==json.dumps({'Recurve':130,'Longbow':5,'csv Open Male Recurve':6},separators=(',',':')) or (E("window._excluded.Recurve")==130 and E("window._excluded.Longbow")==5))
  # rank title
  T('rewards');lbl=E("aaLabel(rankFor(S.profile))");pills=pg.eval_on_selector_all('.lrow.me .pill','e=>e.map(x=>x.textContent)')
  chk('B7 one rank name (Ranks; league shows no rank)',lbl=='Grand Master Bowman (provisional)' and pills==[] and 'Grand Master Bowman' in pg.inner_text('#realrank'))
  # arrow counts
  E("nav('lab_arrows')");pg.wait_for_timeout(700)  # new layout: the arrows card is in My archery > Practice arrows
  wk=int(pg.inner_text('#wkarrows'));chk('B8 Home week arrows = shared count',wk==E('weekArrows()'))
  chk("B8 Today's arrows = shared count",int(pg.locator('#volring text').first.text_content())==E('arrowDays()[today()]||0'))
  ft=T('follow');m=re.search(r'[A-Z]{1,2} You\s*\n?\s*(\d+)',ft);chk('B8 Following week arrows = Home',m and int(m.group(1))==wk)
  # 782 / compare grammar / season
  st();rnd('ABA Interclub 3D (40 targets: 3-arrow half, then 1-arrow half)');more(True);c=pg.inner_text('#c-compare')
  chk('B9 Compare grammar + season','first shoot of this round was' in c and 'sessions' not in c and 'No complete shoots of this round in 2026' in c)
  chk('B9 782 is a competition (paper sheet)','Competition · paper sheet' in pg.text_content('#c-last') and 'Practice' not in pg.text_content('#c-last'))
  # potential
  rnd('Holt');chk('B10 best-ends total never below its scores',int(pg.inner_text('#potv'))>=823 and '823' in pg.inner_text('#c-pot'))
  chk('B10 coach read uses the same total',pg.inner_text('#potv') in pg.inner_text('#coachread'))
  # unfinished app session
  E("""(()=>{S.sessions.push({id:'t_live',date:today(),round:'WA Field 24 Marked',ends:[['6','6','6'],[]],pos:[],note:'',peg:'red',ff:[]});S.sessions.push({id:'t_early',date:today(),round:'WA 720 (50m Compound)',ends:[['X','10','9','9','8','7']],pos:[],note:'',finished:true});save()})()""")
  st();chk('B12 live unfinished session flagged Incomplete',E("statShoots().filter(s=>s.id=='t_live'||s.id=='t_early').every(s=>s.inc)") and not E("isDone(S.sessions.find(s=>s.id=='t_live'))"))
  chk('B12 left out by default',not any('WA Field 24 Marked' in o for o in pg.eval_on_selector_all('#srd option','o=>o.map(x=>x.textContent)')) and E("statPool().every(s=>s.id!='t_early')"))
  pg.check('#incinc');pg.wait_for_timeout(300);chk('B12 shown when Include incomplete ticked',any(o.startswith('WA Field 24 Marked') for o in pg.eval_on_selector_all('#srd option','o=>o.map(x=>x.textContent)')))
  pg.uncheck('#incinc');T('score');chk('B12 tagged Incomplete in past sessions',pg.locator('.inc-tag').count()>=2)
  chk('no horizontal overflow',E('document.querySelector("#scroller").scrollWidth<=390'))
  chk('no purple colours in new Stats',not re.search(r'#(7c3aed|8b5cf6|a855f7|9333ea|6d28d9|4c1d95|c084fc)',open(os.path.join(ROOT,'stats2.js')).read(),re.I))
  E("S.sessions=S.sessions.filter(s=>!/^t_/.test(s.id));save()")
  # other testers
  pg2=b.new_page(viewport={'width':390,'height':844});pg2.on('pageerror',lambda e:errs.append(str(e)));pg2.on('console',lambda m:m.type=='error' and errs.append(m.text))
  E("localStorage.removeItem('scoretool.tester')");login(pg2,'Lee Archer');pg2.click('nav [data-v=stats]');pg2.wait_for_timeout(900)
  chk('Logan: Stats works, no coach read',pg2.locator('#srd').count()==1 and pg2.locator('#c-last').count()==1 and pg2.locator('#coachread').count()==0)
  pg2.click('#moredet');pg2.wait_for_timeout(400);chk('Logan: More detail works',pg2.locator('#c-compare').count()==1)
  chk('no console errors',not errs)
  if errs:print(errs[:5])
  b.close()
finally:srv.kill()
print(f'redesign checks: PASS {len(ok)} FAIL {len(bad)}');[print('FAIL',x) for x in bad];sys.exit(1 if bad else 0)
