# Ghost match: unlock rule (any valid past score of the round, any face, part-shot, official results) + Race who? picker + records pace line.
# Regression for the 26 Oct 2026 report: "I can't click ghost" on Australian Indoor 18m. 390x844 Chrome, Nathe's real official data.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=int(os.environ.get('PORT','8766'))
BASE=os.environ.get('BASE')
srv=None if BASE else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
URL=BASE or f'http://localhost:{PORT}/';time.sleep(1)
AUS='Australian Indoor 18m';WA='Indoor WA 18m'
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(URL);pg.wait_for_timeout(1000);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500);pg.evaluate("S.unlocked=true;save();render()");pg.wait_for_timeout(500)
  for _ in range(3):
    if pg.locator('nav [data-v=score]').is_visible():break
    pg.locator('#app button').first.click();pg.wait_for_timeout(400)
  E=pg.evaluate
  def open_round(rd):
    E("cur=null;sv='sheet';window._ghOn=false;window._ghWho=null;window._ghM=null;nav('score')");pg.wait_for_timeout(500);pg.select_option('#rd',rd);pg.wait_for_timeout(900)
  E("S.sessions=(S.sessions||[]).filter(s=>s.round!='%s'&&s.round!='%s');save()"%(AUS,WA))
  # 1. no app scores at all, but competition results exist -> ghost is available
  open_round(AUS)
  chk('Aus Indoor: ghost box enabled from official results alone (no app score)',not E("document.querySelector('#ghon').disabled"))
  pg.check('#ghon');pg.wait_for_timeout(200)
  segs=pg.eval_on_selector_all('[data-gm]','e=>e.map(x=>x.textContent)')
  chk('Best official + Choose who offered',('Best official' in segs) and ('Choose who' in segs))
  pg.click('[data-gm=pick]');pg.wait_for_timeout(200)
  opts=pg.eval_on_selector_all('#ghwho option','e=>e.map(x=>[x.value,x.textContent,x.disabled])')
  chk('picker lists competition scores with date and score',any(o[0].startswith('o:') and 'competition' in o[1] for o in opts))
  chk('picker has My PB/best, My average',any(o[0]=='best' for o in opts) and any(o[0]=='avg' for o in opts))
  chk('picker marks Best on a row',any(' · Best' in o[1] for o in opts))
  chk('picker shows both faces of the competition scores',any('3-spot' in o[1] for o in opts) and any('Single face' in o[1] for o in opts))
  nat=[o for o in opts if o[0].startswith('rec:national')];wld=[o for o in opts if o[0].startswith('rec:world')]
  chk('Aus Indoor: national record = Record not available, disabled, no number',len(nat)==1 and 'Record not available' in nat[0][1] and nat[0][2] and not any(c.isdigit() for c in nat[0][1].replace('18','')))
  chk('Aus Indoor: world record = Record not available (no published record for this round)',len(wld)==1 and 'Record not available' in wld[0][1] and wld[0][2])
  # 2. a part-shot, finished-early score on the single face; a full 3-spot score
  E("""S.sessions.push({id:'gpart',date:'2026-10-20',round:'%s',face3:'single',ends:[['10','9','9'],['10','10','8'],['9','9','9']],pos:[[],[],[]],finished:true,note:''});save()"""%AUS)
  before=E("JSON.stringify(S.sessions)")
  open_round(AUS)
  pg.check('#ghon');pg.click('[data-gm=pick]');pg.wait_for_timeout(200)
  opts=pg.eval_on_selector_all('#ghwho option','e=>e.map(x=>[x.value,x.textContent,x.disabled])')
  row=[o for o in opts if o[0]=='s:gpart']
  chk('part-shot score listed with ends count and face',len(row)==1 and 'after 3 of 10 ends' in row[0][1] and 'Single face' in row[0][1])
  chk('opening the picker did not change stored sessions',E("JSON.stringify(S.sessions)")==before)
  # 3. start a 3-spot round racing the single-face part score -> clear different-face label
  E("S.face3a='vert';save()")
  pg.select_option('#ghwho','s:gpart');pg.wait_for_timeout(100)
  pg.click('#st');pg.wait_for_timeout(700)
  g=E("cur&&cur.ghost")
  chk('ghost attached, mode pick, 3 ends',bool(g) and g['mode']=='pick' and g['ends']==[28,28,27])
  chk('different-face note stored on the ghost',bool(g) and 'Different face' in (g.get('note') or '') and 'single 40cm face' in g['note'] and '3-spot face' in g['note'])
  chk('different face: ghost arrow positions not drawn',bool(g) and not g.get('pos'))
  chk('note shown in the ghost bar',pg.locator('#ghbar .gh-note').count()==1 and 'Different face' in pg.inner_text('#ghbar .gh-note'))
  # 4. same face: no label
  E("cur=null;sv='sheet';window._ghOn=false;nav('score')");pg.wait_for_timeout(300)
  E("S.face3a='single';save()")
  open_round(AUS);pg.check('#ghon');pg.click('[data-gm=pick]');pg.select_option('#ghwho','s:gpart');pg.click('#st');pg.wait_for_timeout(600)
  g=E("cur&&cur.ghost");chk('same face: no different-face note (part-shot note only)',bool(g) and 'Different face' not in (g.get('note') or '') and 'Part-shot' in g['note'])
  E("S.face3a='vert';save()")
  # 5. World Archery 18m: real record rows, pace line
  open_round(WA);pg.check('#ghon');pg.click('[data-gm=pick]');pg.wait_for_timeout(300)
  opts=pg.eval_on_selector_all('#ghwho option','e=>e.map(x=>[x.value,x.textContent,x.disabled])')
  w=[o for o in opts if o[0].startswith('rec:world')];n=[o for o in opts if o[0].startswith('rec:national')]
  chk('WA 18m: world record for my bow/gender listed with number and pace-line label',len(w)==1 and not w[0][2] and '600' in w[0][1] and 'pace line' in w[0][1])
  chk('WA 18m: national record not available',len(n)==1 and n[0][2] and 'Record not available' in n[0][1])
  pg.select_option('#ghwho',w[0][0]);pg.click('#st');pg.wait_for_timeout(600)
  g=E("cur&&cur.ghost")
  chk('record ghost: 20 even ends of 30 = 600, flagged rec',bool(g) and g['ends']==[30]*20 and g.get('rec'))
  chk('record ghost: plainly labelled pace line, with source',bool(g) and 'Pace line, not real ends' in g['note'] and 'World Archery' in g['note'])
  chk('records data: every record carries date and name; source url present',all(x.get('name') and x.get('date') for r in json.load(open(os.path.join(ROOT,'data/records.json')))['world'].values() for x in r['records']) and all(r['url'].startswith('https://') for r in json.load(open(os.path.join(ROOT,'data/records.json')))['world'].values()))
  # 6. 600 pace line maths
  chk('pace line sums to the record total',E("cur.ghost.ends.reduce((a,b)=>a+b,0)")==600)
  chk('no page errors',not errs)
  b.close()
finally:
  if srv:srv.terminate()
print('OK',len(ok),'FAIL',len(bad));[print(' FAIL:',x) for x in bad]
sys.exit(1 if bad else 0)
