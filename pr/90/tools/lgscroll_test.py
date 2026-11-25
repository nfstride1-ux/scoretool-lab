# League multi-archer scoring must not jump the page to the top while scoring (Nathe, 26 Oct 2026, screen recording).
# 7 archers on Phone 1, Vegas 300 18 m vertical 3-spot, week 1: after EVERY tap (21 arrows, an undo, a background relay refresh) the page
# stays where it was and the score keys stay on screen; the active archer moves to the next after the third arrow. Tapping an archer chip
# (the "next archer" choice) still opens at the top as before. TEST data only. Port 8898.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ok=[];bad=[]
def chk(n,c,info=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+((' '+str(info)) if (info and not c) else ''),flush=True)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8898
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
errs=[]
ST="""()=>{const sc=__scroller,b=sc.getBoundingClientRect(),k=document.querySelector('[data-lgk="X"]'),q=k&&k.getBoundingClientRect(),pad=document.querySelector('#lgentry .lc-pad'),pq=pad&&pad.getBoundingClientRect(),nv=document.querySelector('nav'),nt=nv?nv.getBoundingClientRect().top:innerHeight;
 return {y:sc.scrollTop,max:sc.scrollHeight-sc.clientHeight,keys:!!k,vis:!!pq&&pq.top>=b.top-1&&pq.bottom<=Math.min(b.bottom,nt)+1,act:(document.querySelector('#lgentry .lc-chip.on')||{}).dataset?document.querySelector('#lgentry .lc-chip.on').dataset.lgid:null}}"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  for vw,vh in [(390,844),(360,640)]:
   tag=f'{vw}x{vh}'
   ctx=b.new_context(viewport={'width':vw,'height':vh},has_touch=True,is_mobile=True);ctx.route('https://ntfy.sh/**',lambda r,q:r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'}))
   H=ctx.new_page();H.on('pageerror',lambda e:errs.append(str(e)));H.on('dialog',lambda d:d.accept())
   H.goto(f'http://localhost:{PORT}/?tester=nathe');H.wait_for_timeout(1200);H.evaluate("()=>{S.unlocked=true;if(!S.profile)S.profile='Test';save()}");H.reload();H.wait_for_timeout(2000)
   code=H.evaluate("(()=>{const lg=lgCreate('Scroll test',['logan','steven','joseph','michael','dana','tahuri'],[]);return lg.code})()")
   ids=H.evaluate(f"lgArchers(lgGet('{code}'))");chk(f'{tag} 7 archers in the league',len(ids)==7)
   H.evaluate(f"(()=>{{lgSetGroups('{code}',1,[lgArchers(lgGet('{code}'))]);window._csMode='league';lgView('{code}')}})()");H.wait_for_timeout(500)
   H.click('[data-lgsg="0"]');H.wait_for_timeout(500)
   chk(f'{tag} one-phone card with all 7 chips and the 7 score keys',H.locator('#lgentry .lc-chip').count()==7 and H.locator('#lgentry [data-lgk]').count()==7)
   H.evaluate("()=>{const sc=__scroller;const k=document.querySelector('#lgentry .lc-pad');const nv=document.querySelector('nav'),nt=nv?nv.getBoundingClientRect().top:innerHeight;const d=k.getBoundingClientRect().bottom-(Math.min(sc.getBoundingClientRect().bottom,nt)-8);sc.scrollTop=sc.scrollTop+Math.max(120,d)/* lgpage: the scoring page now fits the keys on screen at the top, so scroll down a little to prove the page stays put */}");H.wait_for_timeout(300)
   s0=H.evaluate(ST);y0=s0['y']
   chk(f'{tag} set-up: page is scrolled down with the keys on screen',y0>0 and s0['vis'],s0)
   order=[]; tot=0; allok=True; badwhy=[]
   keys=['X','10','9','8','7','6','X','9','8']
   for a in range(7):
     for j in range(3):
       s=H.evaluate(ST);who=s['act']
       if j==0:order.append(who)
       H.evaluate(f"document.querySelector('#lgentry [data-lgk=\"{keys[(a+j)%9]}\"]').click()");H.wait_for_timeout(150);tot+=1
       if j==2 and H.locator('#lgnextarcher').count():H.evaluate("document.querySelector('#lgnextarcher').click()");H.wait_for_timeout(150)  # with the Next option on; auto-advance is the default (31 Oct 2026)
       t=H.evaluate(ST)
       if abs(t['y']-y0)>40 or not t['vis'] or not t['keys']:allok=False;badwhy.append((tag,a,j,t))
   chk(f'{tag} 21 arrows (7 archers x 3): page stayed where it was (at most a nudge of a line to keep the keys clear of the bottom bar) and the keys stayed fully on screen',allok,badwhy[:2])
   chk(f'{tag} the active archer moved on after each Next (7 different archers in turn)',len(set(order))==7,order)
   chk(f'{tag} every archer has one complete end saved',H.evaluate(f"lgArchers(lgGet('{code}')).every(id=>{{const e=lgEnt(lgGet('{code}'),id,1);return e&&e.e.length==1&&e.e[0].length==3}})"))
   # undo keeps the page where it is
   H.evaluate("document.querySelector('#lgundo').click()");H.wait_for_timeout(200);t=H.evaluate(ST)
   chk(f'{tag} Undo: page does not move',abs(t['y']-y0)<=40 and t['vis'],t)
   # a background relay refresh (poll brings something new) must not move the page either
   H.evaluate("()=>{window.h2hPoll=async()=>[{_id:'zz'+Date.now()}];window.lgMerge=()=>true}")
   H.evaluate("lgTick(true)");H.wait_for_timeout(900);t=H.evaluate(ST)
   chk(f'{tag} background relay refresh: page does not move',abs(t['y']-y0)<=40 and t['vis'],t)
   # an archer chip is still the "next archer" choice: it opens at the top as before
   H.evaluate("document.querySelector('#lgentry .lc-chip:not(.on)').click()");H.wait_for_timeout(300);t=H.evaluate(ST)
   chk(f'{tag} tapping an archer chip opens at the top (unchanged)',t['y']<=2,t)
   ctx.close()
  chk('no page errors',not errs,errs[:2]);b.close()
finally:
 srv.kill()
print(f'{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
