# Field picker layout + top-ranked ghosts (real scoresheets) + existing ghosts. 390x844 Chrome.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import freeport;PORT=freeport.get()   # ST_PORT or a free port, never a fixed one
srv=subprocess.Popen([sys.executable,'-m','http.server',PORT],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
GT=json.load(open(os.path.join(ROOT,'data/ghost_top.json')))
v=lambda a:10 if a=='X' else 0 if a=='M' else int(a)
# data integrity: every end-by-end ghost adds up to its published total; arrows add up to each end
for rd,o in GT['rounds'].items():
  for x in o['list']:
    if 'ends' in x:
      chk(f'sheet sums {rd} {x["n"]}',sum(x['ends'])==x['s'] and (('ar' not in x) or all(sum(map(v,a))==t for a,t in zip(x['ar'],x['ends']))))
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto('http://localhost:'+PORT+'/');pg.wait_for_timeout(1000);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500);pg.evaluate("S.unlocked=true;save();render()");pg.wait_for_timeout(500)
  for _ in range(3):
    if pg.locator('nav [data-v=score]').is_visible():break
    pg.locator('#app button').first.click();pg.wait_for_timeout(400)
  E=pg.evaluate
  # 1. field picker layout
  pg.click('nav [data-v=score]');pg.wait_for_timeout(500);pg.select_option('#rd','WA Field 24 Marked');pg.wait_for_timeout(300);pg.click('#st');pg.wait_for_timeout(600)
  bb=lambda s:pg.locator(s).bounding_box()
  lf,fc,ld,fd=bb('#flab-face'),bb('#fl-faces'),bb('#flab-dist'),bb('#fdist')
  chk('Face label above chips',lf['y']+lf['height']<=fc['y']+1)
  chk('Distance label under chips',ld['y']>=fc['y']+fc['height']-1)
  chk('drop-down directly under Distance label',fd['y']>=ld['y']+ld['height']-1 and fd['y']-(ld['y']+ld['height'])<12)
  chk('left aligned',max(lf['x'],fc['x'],ld['x'],fd['x'])-min(lf['x'],fc['x'],ld['x'],fd['x'])<=2)
  chk('field face button says Field',pg.inner_text('#bugface').strip()=='Face: Field')
  E('cur=null;sv="sheet";score()');pg.wait_for_timeout(300)
  tr=E("Object.keys(ROUNDS).find(r=>/720 \\(70m\\)/.test(r))");pg.select_option('#rd',tr);pg.click('#st');pg.wait_for_timeout(500)
  chk('target round: no Bugs Eyes face button (field only since 20 Oct 2026), no field picker',pg.locator('#bugface').count()==0 and pg.locator('.fldpick').count()==0)
  E('cur=null;sv="sheet";score()');pg.wait_for_timeout(500)
  # 2. top-ranked ghost
  RD='WA 720 (50m Compound)';L=[x for x in GT['rounds'][RD]['list'] if x.get('g','Male')=='Male' and x.get('cls','Open')=='Open']  # Nathe: Open Male, same as rankings
  pg.select_option('#rd',RD);pg.wait_for_timeout(800);pg.check('#ghon')
  modes=pg.eval_on_selector_all('[data-gm]','b=>b.map(x=>x.dataset.gm)')
  chk('existing ghost modes kept + top',('off' in modes) and ('top' in modes))
  pg.click('[data-gm=top]');pg.wait_for_timeout(100)
  opts=pg.eval_on_selector_all('#ghtop option','o=>o.map(x=>x.textContent)')
  chk('picker lists the top-ranked Open Male archers with club/score/date',len(opts)==len(L) and L[0]['n'] in opts[0] and str(L[0]['s']) in opts[0] and L[0]['c'] in opts[0])
  pg.select_option('#ghtop','2');pg.click('#st');pg.wait_for_timeout(700)
  g=E('cur.ghost');x=L[2]
  chk('ghost ends = scoresheet ends',g['ends']==x['ends'] and g['ar']==x['ar'] and g['mode']=='top')
  chk('ghost label',x['n'] in pg.text_content('#ghbar') and g['label']==f"Ghost: {x['n']} {x['s']} ({g['date']})")
  for _ in range(6):pg.click('.ad-pad [data-k="10"]');pg.wait_for_timeout(40)
  pg.click('#enext');pg.wait_for_timeout(300);E('sv="entry";justDone=false;score()');pg.wait_for_timeout(300)
  chk('ghost end 1 revealed from sheet',f"Ghost end 1: {x['ends'][0]}" in pg.text_content('#ghbar'))
  # total-only ghost
  E('cur=null;sv="sheet";score()');pg.wait_for_timeout(300)
  E(f"window.__GT.rounds[{json.dumps(RD)}].list.unshift({{n:'Test Totalonly',c:'Test club',s:650,dt:'2026-05-01',rank:1,eq:false}})")
  E('const w=document.getElementById("ghwrap");if(w)w.remove();cur=null;score()');pg.wait_for_timeout(300)
  pg.select_option('#rd',RD);pg.wait_for_timeout(200);pg.check('#ghon');pg.click('[data-gm=top]');pg.select_option('#ghtop','0')
  chk('total-only flagged in picker','total only' in pg.eval_on_selector_all('#ghtop option','o=>o[0].textContent'))
  pg.click('#st');pg.wait_for_timeout(500)
  chk('total-only ghost has no made-up ends',E('cur.ghost.totalOnly===true&&cur.ghost.ends.length===0'))
  chk('total-only bar says compared at end','total only' in pg.text_content('#ghbar'))
  E("cur.ends=[...Array(12)].map(()=>['10','10','10','10','10','9']);cur.pos=[];save();sv='sheet';score()");pg.wait_for_timeout(400)
  r=E('ghostResult(cur)');chk('total-only compared at the end',r['gh']==650 and r['me']==708 and r['res']=='win')
  # existing 'off' ghost unchanged
  E('cur=null;sv="sheet";score()');pg.wait_for_timeout(300);E('const w=document.getElementById("ghwrap");if(w)w.remove();score()')
  pg.select_option('#rd',RD);pg.wait_for_timeout(200);pg.check('#ghon');pg.click('[data-gm=off]');pg.click('#st');pg.wait_for_timeout(500)
  chk('official-best ghost unchanged',E(f'JSON.stringify(cur.ghost.ends)==JSON.stringify(window.offGhost({json.dumps(RD)}).ends)&&cur.ghost.mode=="off"&&!cur.ghost.label'))
  chk('no horizontal overflow',E('document.documentElement.scrollWidth')<=390)
  chk('no console errors',not errs);errs and print(errs[:3])
  b.close()
finally:srv.terminate()
print('ghost checks: PASS',len(ok),'FAIL',len(bad),bad[:10]);sys.exit(1 if bad else 0)
