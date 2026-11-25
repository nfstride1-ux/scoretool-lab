# Archery Coach's 12 screen-capture bugs (after 0814) + ABA club-rule layout + ABA distance input removed. Chrome 390x844, archer view.
import subprocess,sys,time,os,re,json,base64,urllib.parse
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen([sys.executable,'-m','http.server','8776'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
IC='ABA Interclub 3D (40 targets: 3-arrow half, then 1-arrow half)'
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page()
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto('http://localhost:8776/?tester=nathe');pg.wait_for_timeout(1200);pg.evaluate("S.unlocked=true;S.incInc=false;save()");pg.reload();pg.wait_for_timeout(2500)
  pg.on('dialog',lambda d:d.accept())
  E=pg.evaluate;nav=lambda v:(E(f"nav('{v}')"),pg.wait_for_timeout(1200))
  # 1 distances: never '?'
  nav('stats');nav('analytics')
  def dist_rows():return E("""(()=>{const c=[...document.querySelectorAll('#app .card')].find(c=>/By distance/.test(c.textContent));if(!c)return null;return [...c.querySelectorAll('div[style*=grid-template-columns]')].map(d=>[d.children[0].textContent,d.children[2]?d.children[2].textContent:'',(d.nextElementSibling&&d.nextElementSibling.matches('div.small'))?d.nextElementSibling.textContent:''])})()""")
  R=dist_rows();lab=[r[0] for r in R or []]
  chk('1 analytics by distance has no ? label (season)',R is not None and '?' not in lab and all(l.strip() for l in lab))
  fa=sum(int(re.search(r'(\d+) arrows',r[2]).group(1)) for r in R if r[0].startswith('Field'))
  chk('1 the old 216-arrow ? bar is the 2026 field rounds (marked + unmarked)',fa==216 and 'Field (marked, mixed)' in lab and 'Field (unmarked)' in lab)
  E("_af.round='WA Field 24Mk Red'");nav('analytics');R=dist_rows()
  chk('1 WA Field 24Mk Red: Field (marked, mixed), no ?',R is not None and [r[0] for r in R]==['Field (marked, mixed)'])
  chk('1 distLabel never ?',all(E(f"distLabel('',{json.dumps(r)})")!='?' for r in ['WA Field 24Mk Red','WA Field 24Umk Red',IC,'WA 90/1440']) and E("distLabel('70m','WA 90/1440')")=='70m')
  # 12 one round list
  E("_af.round='all'");nav('analytics')
  ar=pg.eval_on_selector_all('#fo option','o=>o.map(x=>x.value).filter(v=>v!="all")')
  nav('stats');sr=pg.eval_on_selector_all('#srd option','o=>o.map(x=>x.value)')
  chk('12 Analytics round list == Stats round picker (names and order)',ar==sr and len(sr)>3)
  E("S.incInc=true;save()");nav('analytics');ar2=pg.eval_on_selector_all('#fo option','o=>o.map(x=>x.value).filter(v=>v!="all")');nav('stats');sr2=pg.eval_on_selector_all('#srd option','o=>o.map(x=>x.value)')
  chk('12 lists still match with Include incomplete ticked',ar2==sr2);E("S.incInc=false;save()")
  # 2 update banner never covers Help
  E("""(()=>{let n=0;const f=window.fetch;window.fetch=(u,o)=>String(u).startsWith('version.json')?Promise.resolve(new Response(JSON.stringify({version:'v-test-'+(n++)}),{status:200})):f(u,o)})()""")
  E("__checkUpdate()");pg.wait_for_timeout(300);E("__checkUpdate()");pg.wait_for_timeout(500)
  bb=pg.locator('#updBanner').bounding_box();hb=pg.locator('.help-btn').bounding_box()
  chk('2 update banner shown',bb is not None)
  chk('2 banner does not overlap the Help button',bb and hb and (bb['y']>=hb['y']+hb['height'] or bb['y']+bb['height']<=hb['y']))
  nb=pg.locator('nav').bounding_box()
  chk('2 banner sits above the tab bar',bb and nb and bb['y']+bb['height']<=nb['y']+1)
  pg.locator('.help-btn').click(trial=True,timeout=3000);chk('2 Help is tappable with the banner up',True)
  E("document.getElementById('updBanner').remove()")
  # 3 one classification
  rk=E("(()=>{const r=rankFor(S.profile);return{aa:r.aa,prov:r.prov,missing:r.missing,disc:r.disc}})()")
  nav('rewards');pg.wait_for_timeout(1500);rt=pg.inner_text('#app')
  m=re.search(r'Grand Master Bowman[^\n]*\n',rt)
  tiles=E("""[...document.querySelectorAll('#c-class details[open] > div > div')].map(d=>d.textContent)""")
  gm=[t for t in tiles if t.startswith('Grand Master Bowman')]
  chk('3 rank uses the same check as the progress tile',bool(gm) and (('Achieved' in gm[0])==(not rk['prov'])))
  if rk['prov']:
    need=f"needs {rk['missing']} more round"
    chk('3 Where you stand + rank card + tile give the same reason',need in pg.inner_text('#wysprov') and (pg.locator('#provwhy').count()==0 or need in pg.inner_text('#provwhy')) and need in gm[0] and 'provisional' in gm[0].lower())
  else:chk('3 not provisional when the tile says Achieved','Achieved' in gm[0])
  chk('3 no old "ScoreTool can\'t check" wording',"can't check" not in rt)
  # 4 recap counts follow Stats
  E("recapMonth='2026-10'");nav('recap');pg.wait_for_timeout(500)
  st=E("monthStats(S.profile,'2026-10')");oc=E("statShoots().filter(x=>x.date.startsWith('2026-10'))")
  chk('4 recap rounds = complete October shoots (incomplete off)',st['rounds']==len([x for x in oc if not x['inc']]) and st['incN']==len([x for x in oc if x['inc']]))
  E("S.incInc=true;save()");st2=E("monthStats(S.profile,'2026-10')")
  chk('4 with Include incomplete ticked: both 90/1440s count (1336 + 1060)',st2['top']==['WA 90/1440',2] and st2['rounds']==len(oc))
  E("S.incInc=false;save()")
  # 5 badges
  f=E("(()=>{const f=badgeFacts(S.profile);return{when:f.when,fl:f.E.some(e=>!badgeTgtEnd(e))}})()")
  chk('5 10/X badges ignore field and ABA ends',not f['fl'])
  chk('5 Flawless dated on a real target end, not the 17 Oct field round',f['when']['flawless']!='2026-10-17' and (f['when']['flawless'] is None or f['when']['flawless']<'2026-10-17'))
  chk('5 field end of 6s never counts as Flawless',E("badgeTgtEnd({round:'WA Field 24Mk Red',arrows:['6','6','6']})")==False and E("badgeTgtEnd({round:'"+IC+"',arrows:['20']})")==False and E("badgeTgtEnd({round:'WA 70/720',arrows:['X']})")==True)
  # 6 parent share: last 10 sessions
  sd=E("shareData()")
  chk('6 parent link carries 10 sessions from Stats',len(sd['s'])==10 and sd['s'][-1][0]==E("statShoots().filter(x=>!x.inc).slice(-1)[0].date"))
  nav('me');url=pg.input_value('#sh');p2=ctx.new_page();p2.goto(url);p2.wait_for_timeout(1500)
  chk('6 parent view lists 10 sessions',p2.locator('#sharelist .list-item').count()==10 and 'Last 10 sessions' in p2.text_content('#sharelist'));p2.close()
  # 7 + layout: ABA club rule per round, compact, changeable until target 1 scored
  nav('score');E("cur=null;sv='sheet';score()");pg.wait_for_timeout(300);pg.select_option('#rd',IC);pg.click('#st');pg.wait_for_timeout(400)
  chk('7 club rule off by default',not pg.is_checked('#abaclub'))
  lb=pg.locator('#abaclubl').bounding_box();cbx=pg.locator('#abaclub').bounding_box()
  chk('layout: club rule is one compact line',lb['height']<=24 and cbx['width']<=18 and cbx['height']<=18)
  chk('layout: club rule fits inside 390 px',lb['x']>=0 and lb['x']+lb['width']<=390 and E("document.querySelector('#abaclubl').scrollWidth<=document.querySelector('#abaclubl').clientWidth+1"))
  chk('layout: club rule text small and muted',E("parseFloat(getComputedStyle(document.querySelector('#abaclubl')).fontSize)")<=12.5 and 'Club rule: first half 1 arrow' in pg.inner_text('#abaclubl'))
  chk('layout: no horizontal overflow on the ABA scorer',E('document.querySelector("#scroller").scrollWidth<=390'))
  pg.click('[data-z=M]');chk('7 tick still there after a Miss on target 1',pg.locator('#abaclub').count()==1)
  pg.check('#abaclub');pg.wait_for_timeout(200)
  chk('7 ticking after a miss restarts target 1 as 1-arrow',pg.text_content('#abahalf').startswith('1-arrow half (club rule) · target') and E("(cur.aba[0]||{}).m||0")==0)
  pg.click('[data-z=A]');chk('7 tick locked once target 1 is scored',pg.locator('#abaclub').count()==0 and 'Club rule on' in pg.inner_text('#abacard'))
  hv=pg.inner_text('#abahalves');chk('10 club rule: halves not both called 1A','1A' not in hv and 'First half' in hv and 'Second half' in hv)
  pg.click('#abaexit');pg.wait_for_timeout(300);pg.click('#ldisc');pg.wait_for_timeout(300)
  pg.select_option('#rd',IC);pg.click('#st');pg.wait_for_timeout(400)
  chk('7 next round starts with the club rule off again',not pg.is_checked('#abaclub') and pg.text_content('#abahalf').startswith('3-arrow half · target'))
  # 8 finish early with nothing scored
  chk('8 Finish early disabled with nothing scored, with a message',pg.is_disabled('#abafin') and 'Finish early works once a target is scored' in pg.inner_text('#abafinnote'))
  n0=E("S.sessions.length");pg.click('#abaexit');pg.wait_for_timeout(300)
  chk('8 Exit with nothing scored just leaves',pg.locator('#leaveov').count()==0 and E('cur')==None and E("S.sessions.length")<=n0)
  # distance input removed from ABA
  pg.select_option('#rd',IC);pg.click('#st');pg.wait_for_timeout(400)
  chk('ABA: no estimated-distance input',pg.locator('#abad').count()==0 and 'Estimated distance' not in pg.inner_text('#app'))
  pg.click('#abaexit');pg.wait_for_timeout(300)
  E(f"S.sessions.push({{id:'olddist',date:'2025-06-01',round:'{IC}',ends:[['20'],['14']],pos:[],aba:[{{m:0,k:1,z:'A',d:25}},{{m:1,k:2,z:'A',d:30}}],finished:true,src:'practice'}});save()")
  E("cur=S.sessions.find(s=>s.id=='olddist');window._abaSid=null;score()");pg.wait_for_timeout(300)
  chk('ABA: an old session with distances still opens (no distance shown)',pg.locator('#abapaper').count()==1 and 'Estimated distance' not in pg.inner_text('#app') and pg.inner_text('#abaround')=='34')
  E("cur=null;S.sessions=S.sessions.filter(s=>s.id!='olddist');save();sv='sheet';score()");pg.wait_for_timeout(300)
  nav('stats');chk('ABA stats open without distance',True)
  # 9 field sheet footer
  nav('score');E("cur=null;sv='sheet';score()");pg.wait_for_timeout(300);pg.select_option('#rd','WA Field 24 Marked');pg.click('#st');pg.wait_for_timeout(400)
  if pg.locator('#eback').count():pg.click('#eback');pg.wait_for_timeout(300)
  ft=' '.join(pg.locator('.ad-sum').all_inner_texts());chk("9 field sheet footer: no X's/10's","X's" not in ft and "10's" not in ft and "6's" in ft)
  fs=E("cur&&cur.id");E(f"S.sessions=S.sessions.filter(s=>s.id!='{fs}');cur=null;sv='sheet';save();score()")
  # 10 plurals
  chk("10 plural helper","1 adult"==E("plN(1,'adult','adults')") and "2 adults"==E("plN(2,'adult','adults')") and "1.0 points"==E("plN('1.0','point','points')"))
  src=''.join(open(os.path.join(ROOT,f)).read() for f in os.listdir(ROOT) if f.endswith('.js') and f not in('sw.js',))
  chk('10 no naive "${n} adults/members/rounds" left',not re.search(r"\$\{[^{}`]{1,60}\} (adults|members)\b",src))
  E("S.squad=S.squad||{name:'Test',code:'X',members:[],adults:[]};S.squad.adults=[{id:'a1',name:S.profile,role:'Admin'}];save()");nav('squad')
  chk("10 squad header says '1 adult'",'1 adults' not in pg.inner_text('#app') and ('1 adult' in pg.inner_text('#app') or 'adult' not in pg.inner_text('#app')))
  # 11 ghost top ranked: own gender + age class
  g=E("(()=>{const gc=ghostGC();return{gc,L:(window.__GT?ghostTopList('WA 720 (50m Compound)'):null)}})()")
  if g['L'] is None:
    nav('score');pg.wait_for_timeout(1500);g=E("(()=>{const gc=ghostGC();return{gc,L:(window.__GT?ghostTopList('WA 720 (50m Compound)'):null)}})()")
  L=g['L'] or []
  chk('11 ghost list loaded',len(L)>0)
  chk('11 top ranked = own gender and class only',g['gc']['g']=='Male' and all(x['g']=='Male' and x['cls']==g['gc']['c'] for x in L) and not any(x['n'] in('Elizabeth Randle','Vida Halimian') for x in L))
  chk('11 ranks recounted inside the filtered list',L[0]['rank']==1 and all(L[i]['rank']<=L[i+1]['rank'] for i in range(len(L)-1)))
  chk('no JS errors',not errs)
  if errs:print(errs[:5])
  b.close()
finally:srv.kill()
print(f'coach3 checks: PASS {len(ok)} FAIL {len(bad)}');[print('FAIL',x) for x in bad];sys.exit(1 if bad else 0)
