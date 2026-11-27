# Archery Coach re-test fixes (v2026-10-18): rank in one place, tips from one labelled set, trend follows the tick,
# early/late text from its numbers, per-value tables add up, plain words, end labels on every end chart. Chrome 390x844.
import subprocess,sys,time,os,re
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen([sys.executable,'-m','http.server','8773'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ROUNDS=['WA 90/1440','Holt','WA 60/900 (Canberra)','WA 50/720','WA Field 24Mk Red']
# recompute a tip's numbers in the page from the set it names (picker pool, shoots with end-by-end scores)
RECALC='''()=>{const P=statPool(),W=P.filter(s=>s.ends.length),A=W.flatMap(s=>s.ends.flat()),fld=W.length&&W[0].field;
 const D=distAvgs(W).sort((a,b)=>a.pa-b.pa);const fl=W.filter(s=>s.ends.length>=2).map(s=>{const t=Math.max(1,Math.floor(s.ends.length/3));const m=v=>v.reduce((a,b)=>a+b,0)/v.length;return[m(s.ends.slice(0,t).map(endSum)),m(s.ends.slice(-t).map(endSum))]});
 const m=v=>v.reduce((a,b)=>a+b,0)/v.length;return{nP:P.length,nW:W.length,D,late:fl.length?[m(fl.map(f=>f[0])),m(fl.map(f=>f[1]))]:null,low:A.length?Math.round(100*A.filter(a=>(val(a)||0)<=(fld?4:8)).length/A.length):null}}'''
def login(pg,who):
  pg.goto('http://localhost:8773/');pg.wait_for_timeout(1000);nm_seed.pick(pg,who);pg.wait_for_timeout(500)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
  for _ in range(3):
    if pg.locator('nav [data-v=score]').is_visible():break
    pg.locator('#app button').first.click();pg.wait_for_timeout(400)
  pg.wait_for_timeout(1500)
r1=lambda v:f'{round(v*10)/10:.1f}'
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  login(pg,'Nathaniel Stride');E=pg.evaluate
  T=lambda v:(pg.click(f'nav [data-v={v}]'),pg.wait_for_timeout(900),pg.inner_text('#app'))[2]
  def st():pg.click('nav [data-v=stats]');pg.wait_for_timeout(900)
  def rnd(r):pg.select_option('#srd',r);pg.wait_for_timeout(400)
  def inc(on):
    if pg.is_checked('#incinc')!=on:pg.click('#incinc');pg.wait_for_timeout(400)
  E('S.statsMore=true;S.incInc=false;save()');st()
  # 1 rank in one place
  chk('1 Stats has no AA classification card',pg.locator('#c-class').count()==0 and 'AA classification progress' not in pg.text_content('#app'))
  tabs={v:(T(v),pg.text_content('#app'))[1] for v in ['home','score','rewards','follow','me','diary']}
  T('rewards');chk('1 Ranks shows AA classification progress',pg.locator('#c-class').count()==1 and 'AA classification progress' in pg.text_content('#c-class'))
  chk('1 only Ranks has it',[v for v,t in tabs.items() if 'AA classification progress' in t]==['rewards'])
  # 7 plain words
  league=pg.locator('.card:has-text("This week\'s league")').inner_text()
  chk('7 league: no Placement',not re.search('placement',league,re.I))
  chk('7 league: no Elite Gold',('Elite Gold' not in league))
  chk('7 league: no rank pills',pg.locator('.card:has-text("This week\'s league") .pill').count()==0)
  rk=tabs['rewards'];chk('7 Ranks: no Placement',not re.search(r'\bplacement\b',rk,re.I))
  chk('7 Ranks: Elite Gold only with AA context',all('AA' in c or 'Archery Australia' in c for c in pg.locator('#app .card').all_inner_texts() if 'Elite Gold' in c))
  for v,t in tabs.items():
    for w in ["Coach's read",'Best-ends','standard deviation','Placement']:chk(f'7 {v}: no "{w}"',w not in t)
  st()
  for r in ROUNDS:
    rnd(r);t=pg.inner_text('#app')
    for w in ["Coach's read",'Best-ends','standard deviation']:chk(f'7 Stats {r}: no "{w}"',w not in t)
  E("Object.assign(window._af,{range:'all',round:'WA 90/1440',bow:'all',kind:'all'})");E("nav('analytics')");pg.wait_for_timeout(1200);an=pg.text_content('#app')
  chk('7 Analytics: no "standard deviation"','standard deviation' not in an and 'Standard deviation' not in an)
  chk('7 Analytics: consistency explained in plain words','usually land from your average' in an)
  # 2 + 5 + general: every tip names its set and its numbers come from that set
  st()
  for r in ROUNDS:
    for on in (False,True):
      rnd(r);inc(on);tip=pg.inner_text('#tip');kind=pg.get_attribute('#tip','data-kind');n=int(pg.get_attribute('#tip','data-set'));X=E(RECALC)
      lbl=f'{r}{" +inc" if on else ""}'
      chk(f'tips {lbl}: labelled set',re.search(rf'Across your {X["nW"]} shoots? of',tip) is not None and n==X['nW'])
      chk(f'tips {lbl}: set follows the picker and tick',X['nP']==int(re.match(r'(\d+)',pg.inner_text('#statcount')).group(1)))
      if kind=='dist':
        w=X['D'][0];bb=X['D'][1];chk(f'tips {lbl}: weakest distance + numbers from the set',w['d'] in tip and r1(w['pe']) in tip and f"{w['pa']:.2f}" in tip and r1(bb['pe']) in tip and f"{bb['pa']:.2f}" in tip and 'drop the most points' in tip)
      elif kind=='late':chk(f'tips {lbl}: late numbers from the set',r1(X['late'][0]) in tip and r1(X['late'][1]) in tip)
      elif kind=='low':chk(f'tips {lbl}: low-arrow % from the set',f"{X['low']}%" in tip)
      else:chk(f'tips {lbl}: kind known',kind=='ok')
  rnd('WA 90/1440');inc(False);tip=pg.inner_text('#tip');cr=pg.inner_text('#coachread')
  m=re.search(r'Weakest at (\S+) \(([\d.]+) an end\)',cr)
  chk('2 90/1440 tip blames the scores-read weakest distance',m and pg.get_attribute('#tip','data-kind')=='dist' and f'at {m.group(1)}:' in tip and m.group(2) in tip)
  chk('2 90/1440 tip says where points are lost','drop the most points at 90m' in tip and re.search(r'about \d+ points? short of perfect',tip))
  chk('2 90/1440 tip names 90m',m and m.group(1)=='90m')
  E("Object.assign(window._af,{range:'all',round:'WA 90/1440',bow:'all',kind:'all'})");E("nav('analytics')");pg.wait_for_timeout(1200);an=pg.text_content('#app');st()
  i=an.find('at each distance');ad=dict(re.findall(r'(\d+m)(\d+\.\d\d)',an[i:i+400])) if i>=0 else {};print('analytics by distance',ad,'| read:',m.groups() if m else None)
  chk('2 Analytics agrees on weakest distance',ad and min(ad,key=lambda k:float(ad[k]))==m.group(1))
  rnd('WA 50/720');inc(False);tip=pg.inner_text('#tip')
  chk('5 50/720 tip is labelled with its set','Across your' in tip)
  # 3 trend follows the tick
  rnd('WA 90/1440');inc(False);t0=pg.inner_text('#c-trend');l0=pg.inner_text('#lastscore');inc(True);t1=pg.inner_text('#c-trend');l1=pg.inner_text('#lastscore')
  P=E("statPool().map(s=>s.score)");a=round(sum(P[-3:])/len(P[-3:]))
  chk('3 tick switches shoot card to the 1060',l1=='1060' and l0!='1060')
  chk('3 trend changes with the tick',t0!=t1 and f'averaged {a}' in t1 and 'incomplete' in t1)
  inc(False);P=E("statPool().map(s=>s.score)");chk('3 trend without tick uses complete shoots',f'averaged {round(sum(P[-3:])/3)}' in pg.inner_text('#c-trend'))
  # polish (d): best-ends card explains why the tick changes nothing, like the PB card
  rnd('Holt');inc(True);chk('d best-ends note with tick',"doesn't change this card" in pg.inner_text('#potnote') and "doesn't change this card" in pg.inner_text('#pbnote'))
  inc(False);chk('d no tick wording without tick',"doesn't change" not in pg.inner_text('#potnote'))
  # 4 early/late text from its numbers (every 90/1440 shoot, plus others)
  def late_ok(lbl):
    e1=float(pg.inner_text('#e1'));e2=float(pg.inner_text('#e2'));tx=pg.inner_text('#latetxt');d=e2-e1
    want='held up' if abs(d)<1 else 'lower' if d<0 else 'higher'
    chk(f'4 {lbl}: text matches {e1} vs {e2}',want in tx and all(w not in tx for w in {'held up','lower','higher'}-{want}))
  for r in ROUNDS:
    rnd(r);ids=pg.eval_on_selector_all('#ssh option','o=>o.map(x=>x.value)')
    for i in ids[:6]:
      pg.select_option('#ssh',i);pg.wait_for_timeout(250)
      if pg.locator('#e1').count():late_ok(f'{r} {pg.inner_text("#lastscore")}')
  rnd('WA 90/1440');sid=E("statPool().find(s=>s.date=='2026-09-26'&&s.score==1303)?.id")
  if sid:pg.select_option('#ssh',sid);pg.wait_for_timeout(300)
  chk('4 26 Sep 2026 1303: 52.8 vs 57.8 says higher',sid and pg.inner_text('#e1')=='52.8' and pg.inner_text('#e2')=='57.8' and 'higher' in pg.inner_text('#latetxt'))
  # 6 per-value tables add up
  for r in ROUNDS:
    rnd(r);ids=pg.eval_on_selector_all('#ssh option','o=>o.map(x=>x.value)')
    for i in ids[:5]:
      pg.select_option('#ssh',i);pg.wait_for_timeout(250);lbl=f'{r} {pg.inner_text("#lastscore")}'
      if pg.locator('.arrtab').count():
        na=int(re.search(r'(\d+) arrows',pg.inner_text('#c-last')).group(1));c=[int(x) for x in pg.locator('.arrtab tr').nth(1).locator('td').all_inner_texts()]
        chk(f'6 {lbl}: arrow table adds to {na}',sum(c)==na)
      if pg.locator('.halftab').count():
        rows=E("[...document.querySelectorAll('.halftab tr')].slice(1).map(r=>[...r.cells].slice(1).map(c=>+c.textContent))")
        k=E("(()=>{const s=statPool().find(x=>x.id==_st2.id);const k=Math.floor(s.ends.length/2);return[s.ends.slice(0,k).flat().length,s.ends.slice(s.ends.length-k).flat().length]})()")
        chk(f'6 {lbl}: half table rows add up',[sum(x[:-1]) for x in rows]==[x[-1] for x in rows]==k)
  rnd('WA Field 24Mk Red');hd=pg.locator('.halftab tr').first.inner_text()
  chk('6 field half table has 3, 2, 1 and M',all(q in hd.split() for q in ['6','5','4','3','2','1','M']))
  chk('6 field half each 36 arrows',E("[...document.querySelectorAll('.halftab tr')].slice(1).map(r=>+r.cells[r.cells.length-1].textContent)")==[36,36])
  # 8 end labels on every end chart
  for r in ROUNDS:
    rnd(r);ne=int(re.search(r'(\d+) ends',pg.inner_text('#c-last')).group(1)) if re.search(r'(\d+) ends',pg.inner_text('#c-last')) else 0
    lab=pg.eval_on_selector_all('#c-last text.evl','e=>e.map(x=>+x.textContent)');sm=E("statPool().find(x=>x.id==_st2.id).ends.map(endSum)")
    chk(f'8 {r}: every end bar has its score',ne>0 and lab==sm)
  pg.screenshot(path='/tmp/coach2.png')
  # other tester still fine
  pg2=b.new_page(viewport={'width':390,'height':844});pg2.on('pageerror',lambda e:errs.append(str(e)));login(pg2,'Logan')
  pg2.click('nav [data-v=stats]');pg2.wait_for_timeout(900);chk('Logan: Stats works',pg2.locator('#srd').count()+pg2.locator('#incinc').count()>=1)
  pg2.click('nav [data-v=rewards]');pg2.wait_for_timeout(900);chk('Logan: Ranks works',pg2.locator('#app .card').count()>=2)
  chk('no console errors',not errs)
  if errs:print(errs[:5])
finally:srv.kill()
print('coach2 checks: PASS',len(ok),'FAIL',len(bad));[print(' FAIL',x) for x in bad]
