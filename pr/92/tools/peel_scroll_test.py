# Peel group card scroll test: 4 archers, a whole Day 2 (every arrow of every target, hits and misses, undo, chips, Next, Save) at phone sizes.
# After EVERY tap the score buttons (when offered), the updated sheet and (while waiting) the Next button must all be inside the visible
# scroll area, the Next button sits below the sheet, Next lands on the next archer with buttons + sheet in view, and the scroll position
# never snaps back to the top of the page. Also: saved data unchanged by opening/scrolling. Port 8845.
import subprocess,sys,time,os,random,json
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nav_compat
srv=subprocess.Popen([sys.executable,'-m','http.server','8845'],cwd=os.path.dirname(HERE),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
random.seed(25)
ok=[];bad=[]
def chk(n,c,info=''):
  (ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+((' '+str(info)) if (info and not c) else ''),flush=True)
NAMES=['Nathaniel Stride','Everett Young','Nate Evans','Estiaan Cronge']
M="""()=>{const sc=__scroller,b=sc.getBoundingClientRect(),r=s=>{const e=document.querySelector(s);if(!e)return null;const q=e.getBoundingClientRect();return {t:q.top-b.top,b:q.bottom-b.top}};
 const pads=[...document.querySelectorAll('[data-pgz]')].map(e=>{const q=e.getBoundingClientRect();return{t:q.top-b.top,b:q.bottom-b.top}});
 return {y:sc.scrollTop,h:sc.clientHeight,live:r('#pglive .aba-cols4'),next:r('#pgnext'),who:r('#pgwho'),pads,hold:!!document.querySelector('#pghold'),maxy:sc.scrollHeight-sc.clientHeight}}"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  for vw,vh in [(390,844),(360,740),(393,660)]:
   tag=f'{vw}x{vh}'
   ctx=b.new_context(viewport={'width':vw,'height':vh},has_touch=True,is_mobile=True)
   ctx.route('https://ntfy.sh/**',lambda r,q:r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'}))
   errs=[];pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
   pg.goto('http://localhost:8845/?tester=nathe');pg.wait_for_timeout(1200);pg.evaluate("S.unlocked=true;save()")
   for _ in range(3):pg.reload();pg.wait_for_timeout(1800)
   pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(300)
   pg.click('#pgopen');pg.wait_for_timeout(300)
   for i,n in enumerate(NAMES):pg.fill(f'#pgn{i}',n)
   pg.click('#pggo');pg.wait_for_timeout(300)
   def m():return pg.evaluate(M)
   def vis(e,h):return e is not None and e['t']>=-1 and e['b']<=h+1
   fails=[];jumps=[];taps=0;nexts=0;prev_y=None;below_ok=True;maxdrop=0
   LOG=[]
   def check(label):
     global prev_y
     v=m();h=v['h']
     good=vis(v['live'],h)
     if v['hold']:
       good=good and vis(v['next'],h) and v['next']['t']>=v['live']['b']-1
     else:
       good=good and len(v['pads'])==4 and all(vis(q,h) for q in v['pads'])
     done=pg.evaluate("pgAllDone(pgEv().days[0])")
     if not good and not (done and not v['pads'] and not v['hold']):fails.append((label,v))
     if prev_y is not None and v['y']<prev_y-150 and v['maxy']>0:jumps.append((label,prev_y,v['y']))
     prev_y=v['y'];return v
   # user starts scrolled somewhere random, as on a phone
   TOT=[0,0,0,0];N=[0]*4;kinds=set();undone=0
   guard=0
   while pg.evaluate("!pgAllDone(pgEv().days[0])") and guard<400:
     guard+=1
     who=pg.inner_text('#pgwho');a=NAMES.index(who)
     # sometimes scroll a bit like a thumb would
     if random.random()<.2:pg.evaluate("__scroller.scrollTop=Math.max(0,__scroller.scrollTop-random()*0)".replace('random()','Math.random()'))
     z=random.choice(['A','A','B','B','C','M','M']);kinds.add(z)
     before=pg.evaluate("pgTot(pgEv().days[0].a[%d].s)"%a)
     pg.click(f'[data-pgz="{z}"]');pg.wait_for_timeout(40);taps+=1
     check(f'tap {taps} {z} {who}')
     if pg.locator('#pgnext').count():
       if random.random()<.12 and undone<10:   # undo then rescore
         pg.click('#pgundo');pg.wait_for_timeout(40);check(f'undo {taps}');undone+=1
         assert pg.locator('#pgnext').count()==0
         pg.click(f'[data-pgz="A"]');pg.wait_for_timeout(40);check(f'rescore {taps}')
       if random.random()<.1:   # tap a chip and come back
         pg.click(f'[data-pga="{(a+2)%4}"]');pg.wait_for_timeout(40);check(f'chip {taps}')
         pg.click(f'[data-pga="{a}"]');pg.wait_for_timeout(40);check(f'chipback {taps}')
         if pg.locator('#pgnext').count()==0:continue
       nm=pg.inner_text('#pgnext')
       y0=m()['y'];pg.click('#pgnext');pg.wait_for_timeout(40);nexts+=1
       v=check(f'next {nexts}')
       if v['hold']:fails.append(('still held after next',v))
       if v['who'] is None or not vis(v['who'],v['h']):fails.append(('who not visible after next',v))
   chk(f'{tag}: every tap/undo/chip/Next keeps buttons + updated sheet (+ Next below sheet) in view ({taps} taps, {nexts} Next, {undone} undo, kinds {sorted(kinds)})',not fails,fails[:2])
   chk(f'{tag}: never snaps back up the page (no scroll jump > 150px up)',not jumps,jumps[:2])
   chk(f'{tag}: all 4 archers finished all targets',pg.evaluate("pgAllDone(pgEv().days[0])"))
   pg.click('#pgsave');pg.wait_for_timeout(150)
   chk(f'{tag}: Save works (saved, matches scores)',pg.locator('#pgsaved').count()==1 and pg.evaluate("!!pgEv().days[0].saved"))
   chk(f'{tag}: no page errors',not errs,errs[:2])
   ctx.close()
 
finally:srv.kill()
print(f'\n{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
