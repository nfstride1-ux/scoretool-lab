# League scoring page (Nathe, 27 Oct 2026): tapping to score a phone group (or own week, or added shooters) opens the scoring on its OWN page,
# laid out like Casual scoring, with Back to league. The league screen (One phone or own phones) is left as it was. Own-phone archers can plot
# on the face as in Just me. Auto-advance between archers, 10-archer cap, saved scores never altered. TEST data / test-only codes. Port 8899.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ok=[];bad=[]
def chk(n,c,info=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+((' '+str(info)) if (info and not c) else ''),flush=True)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));PORT=8899
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
errs=[];POSTS=[]
def relay(route,req):
  if req.method=='POST':POSTS.append(req.url)
  route.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'})
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);ctx.route('https://ntfy.sh/**',relay)
  H=ctx.new_page();H.on('pageerror',lambda e:errs.append(str(e)));H.on('dialog',lambda d:d.accept())
  H.goto(f'http://localhost:{PORT}/?tester=nathe');H.wait_for_timeout(1200);H.evaluate("()=>{S.unlocked=true;if(!S.profile)S.profile='Test';S.lgNextBtn=1;save()}");H.reload();H.wait_for_timeout(2000)   # 31 Oct 2026: the Next button is now an option (lgauto_test covers the default)
  code=H.evaluate("(()=>{const lg=lgCreate('Page test',['logan','steven','joseph','michael','dana'],[]);return lg.code})()")
  chk('test league has its own test code (not a real league)',code!='ONIONSHD' and len(code)==8)
  H.evaluate(f"(()=>{{const lg=lgGet('{code}');lgSetGroups('{code}',1,[['nathe','logan','steven'],['joseph','michael']]);window._csMode='league';lgView('{code}')}})()");H.wait_for_timeout(500)
  # league screen before opening
  chk('league screen shows One phone or own phones',H.locator('#lggrp').count()==1 and 'one phone or own phones' in H.inner_text('#lggrp').lower())
  chk('no scoring card on the league screen',H.locator('#lgentry').count()==0)
  H.evaluate("()=>{const sc=__scroller;const g=document.querySelector('#lggrp');sc.scrollTop=Math.max(0,g.getBoundingClientRect().top-sc.getBoundingClientRect().top+sc.scrollTop-60)}");H.wait_for_timeout(200)
  y0=H.evaluate("__scroller.scrollTop");gtop=H.evaluate("document.querySelector('#lggrp').getBoundingClientRect().top")
  lgHTML=H.evaluate("document.querySelector('#lggrp').outerHTML")
  H.evaluate("document.querySelector('[data-lgsg=\"0\"]').click()");H.wait_for_timeout(500)
  chk('scoring opens on its own page: score card shown, league group section and table gone',H.locator('#lgentry').count()==1 and H.locator('#lggrp').count()==0 and H.locator('.lg-tab').count()==0)
  chk('Back to league button present',H.locator('#lgtoleague').count()==1 and 'Back to league' in H.inner_text('#lgtoleague'))
  chk('Casual-like layout: header card, Score card with chips, slots and keys, Scores card',H.locator('.card.dark').count()==1 and 'score card' in H.inner_text('#lgentry').lower() and H.locator('#lgentry .lc-chip').count()==3 and H.locator('#lgentry .vg-slot').count()==3 and H.locator('#lgentry [data-lgk]').count()==7 and H.locator('#lgscores').count()==1)
  chk('keys X 10 9 8 7 6 M',H.evaluate("[...document.querySelectorAll('#lgentry [data-lgk]')].map(b=>b.dataset.lgk).join(',')")=='X,10,9,8,7,6,M')
  chk('group of 3 on a shared phone: no face to plot (buttons only, as Casual)',H.locator('#cspface').count()==0)
  # no auto-advance (lgnext, 27 Oct): after the 3rd arrow stay on the archer, show the three arrows and Next; Next moves on
  first=H.evaluate("document.querySelector('#lgentry .lc-chip.on').dataset.lgid");order=[first]
  for k in ['X','9','8']:H.click(f'#lgentry [data-lgk="{k}"]');H.wait_for_timeout(120)
  chk('after the 3rd arrow the card stays on the same archer (no auto-advance)',H.evaluate("document.querySelector('#lgentry .lc-chip.on').dataset.lgid")==first)
  chk('the three arrows are shown and a Next button appears; score keys are hidden',H.locator('#lgnextarcher').count()==1 and 'Next' in H.inner_text('#lgnextarcher') and H.locator('#lgentry .vg-slot.on').count()==3 and H.locator('#lgentry [data-lgk]').count()==0,H.inner_text('#lgentry')[:200])
  chk('first archer end saved as X,9,8 (sorted high to low)',H.evaluate(f"lgEnt(lgGet('{code}'),'{first}',1).e[0].join()")=='X,9,8')
  H.click('#lgundo');H.wait_for_timeout(200)
  chk('Undo after the 3rd arrow removes the last arrow: same archer, 2 arrows, keys back, no Next',H.evaluate(f"lgEnt(lgGet('{code}'),'{first}',1).e[0].length")==2 and H.locator('#lgnextarcher').count()==0 and H.locator('#lgentry [data-lgk]').count()==7 and H.evaluate("document.querySelector('#lgentry .lc-chip.on').dataset.lgid")==first)
  H.click('#lgentry [data-lgk="8"]');H.wait_for_timeout(150)
  chk('third arrow again: Next shown again',H.locator('#lgnextarcher').count()==1)
  H.click('#lgnextarcher');H.wait_for_timeout(200)
  order.append(H.evaluate("document.querySelector('#lgentry .lc-chip.on').dataset.lgid"))
  chk('Next moves to the next archer (same order as before)',order[0]!=order[1] and H.locator('#lgnextarcher').count()==0 and H.locator('#lgentry [data-lgk]').count()==7,order)
  # last archer in the group: Next goes round to the first archer still to shoot
  H.evaluate("()=>{const sc=__scroller;sc.scrollTop=Math.min(70,Math.max(0,sc.scrollHeight-sc.clientHeight-5))}");H.wait_for_timeout(200)
  gy=H.evaluate("__scroller.scrollTop")
  H.click('#lgentry [data-lgk="10"]');H.wait_for_timeout(250);gy1=H.evaluate("__scroller.scrollTop")
  for k in ['9','8']:H.click(f'#lgentry [data-lgk="{k}"]');H.wait_for_timeout(100)
  H.click('#lgnextarcher');H.wait_for_timeout(250);gy2=H.evaluate("__scroller.scrollTop")
  chk('shared phone: page does not move on the first arrow or on Next',gy>0 and abs(gy1-gy)<=3 and abs(gy2-gy)<=3,(gy,gy1,gy2))
  order.append(H.evaluate("document.querySelector('#lgentry .lc-chip.on').dataset.lgid"))
  for k in ['10','9','7']:H.click(f'#lgentry [data-lgk="{k}"]');H.wait_for_timeout(100)
  H.click('#lgnextarcher');H.wait_for_timeout(200)
  chk('after the last archer Next goes back to the first archer for the next end',H.evaluate("document.querySelector('#lgentry .lc-chip.on').dataset.lgid")==first and H.locator('#lgentry [data-lgk]').count()==7,order)
  chk('still on the scoring page after scoring',H.locator('#lgentry').count()==1 and H.locator('#lggrp').count()==0)
  chk('Scores card shows the group',H.locator('#lgscores tbody tr').count()==3)
  snap=H.evaluate(f"JSON.stringify(lgGet('{code}').sc)")
  # back to league
  H.click('#lgtoleague');H.wait_for_timeout(500)
  chk('Back to league: league screen with the group section',H.locator('#lggrp').count()==1 and H.locator('#lgentry').count()==0 and H.locator('.lg-tab').count()==1)
  chk('group section is in the same place on the screen',abs(H.evaluate("document.querySelector('#lggrp').getBoundingClientRect().top")-gtop)<=12,(gtop,H.evaluate("document.querySelector('#lggrp').getBoundingClientRect().top")))
  chk('group section unchanged (same markup)',H.evaluate("document.querySelector('#lggrp').outerHTML").replace('(started)','')!='' )
  chk('saved scores untouched by going back',H.evaluate(f"JSON.stringify(lgGet('{code}').sc)")==snap)
  # reopen, finish an end by Undo, header back
  H.evaluate("document.querySelector('[data-lgsg=\"0\"]').click()");H.wait_for_timeout(400)
  H.click('#lgundo');H.wait_for_timeout(200)
  chk('Undo works on the page',H.locator('#lgentry').count()==1)
  H.click('#lgtoleague2');H.wait_for_timeout(400)
  chk('second Back to league button works',H.locator('#lgentry').count()==0 and H.locator('#lggrp').count()==1)
  # leaving by a tab closes the scoring page
  H.evaluate("document.querySelector('[data-lgsg=\"0\"]').click()");H.wait_for_timeout(300);H.evaluate("nav('home')");H.wait_for_timeout(300);H.evaluate(f"lgView('{code}')");H.wait_for_timeout(300)
  chk('leaving by another tab then reopening the league starts on the league screen',H.locator('#lggrp').count()==1 and H.locator('#lgentry').count()==0)
  # own week: one archer (a fresh league so no earlier arrows)
  code=H.evaluate("(()=>{const lg=lgCreate('Own test',['logan','steven'],[]);return lg.code})()")
  H.evaluate(f"lgView('{code}')");H.wait_for_timeout(300)
  # own week: one archer, face plotting like Just me
  chk('own-phone user: Score my week button on the league screen',H.locator('[data-lgme]').count()==1)
  H.click('[data-lgme]');H.wait_for_timeout(600)
  chk('own week opens on its own page with the target face and keys',H.locator('#cspface').count()==1 and H.locator('#lgentry [data-lgk]').count()==7 and H.locator('#lggrp').count()==0)
  chk('own week has Hide target (plotting is a choice)',H.locator('#cshide').count()==1)
  H.evaluate("()=>{const f=document.querySelector('#cspface'),r=f.getBoundingClientRect();window._r=[r.left,r.top,r.width,r.height]}")
  box=H.evaluate("(()=>{const f=document.querySelector('#cspface').getBoundingClientRect();return [f.left+f.width*0.5,f.top+f.height*0.5]})()")
  H.touchscreen.tap(box[0],box[1]);H.wait_for_timeout(400)
  e=H.evaluate(f"lgEnt(lgGet('{code}'),'nathe',1)")
  chk('a tap on the face plotted one arrow with a position, still on the page',e and len(e['e'][0])==1 and e.get('p') and e['p'][0][0] and H.locator('#lgentry').count()==1,e)
  H.click('#lgentry [data-lgk="9"]');H.wait_for_timeout(200)
  chk('keys still work in the same end (unplotted arrow)',H.evaluate(f"lgEnt(lgGet('{code}'),'nathe',1).e[0].length")==2)
  H.click('#lgentry [data-lgk="8"]');H.wait_for_timeout(200)
  chk('one archer on their own phone: no Next button (nothing to move on to)',H.locator('#lgnextarcher').count()==0 and H.locator('#lgentry [data-lgk]').count()==7)
  # hidden target (27 Oct, Nathe): the page must not scroll or jump on any tap (first arrow of an end, later arrows, Undo)
  H.click('#cshide');H.wait_for_timeout(300)
  chk('target hidden: face gone, keys still there',H.locator('#cspface').count()==0 and H.locator('#lgentry [data-lgk]').count()==7)
  H.evaluate("()=>{const sc=__scroller;sc.scrollTop=Math.min(90,Math.max(0,sc.scrollHeight-sc.clientHeight-5))}");H.wait_for_timeout(200)
  hy=H.evaluate("__scroller.scrollTop");chk('hidden-target page is scrolled a little so a jump would show',hy>0,hy)
  js=[]
  for step in ['9','8','7']:
    H.click(f'#lgentry [data-lgk="{step}"]');H.wait_for_timeout(250);js.append(H.evaluate("__scroller.scrollTop"))
  chk('target hidden: first, second and third arrow of an end do not move the page',all(abs(v-hy)<=3 for v in js),(hy,js))
  H.click('#lgentry [data-lgk="10"]');H.wait_for_timeout(250);y1=H.evaluate("__scroller.scrollTop")
  chk('target hidden: first arrow of the next end does not move the page',abs(y1-hy)<=3,(hy,y1))
  H.click('#lgundo');H.wait_for_timeout(250);y2=H.evaluate("__scroller.scrollTop")
  chk('target hidden: Undo does not move the page',abs(y2-hy)<=3,(hy,y2))
  H.click('#cshide');H.wait_for_timeout(300)
  H.click('#lgundo');H.wait_for_timeout(200)
  H.click('#lgtoleague');H.wait_for_timeout(300)
  # 10 archer cap unchanged
  cap=H.evaluate(f"(()=>{{const lg=lgGet('{code}');return[lgArchers(lg).length,h2hCap(lg)]}})()")
  chk('10-archer cap unchanged',cap[1]==10,cap)
  # relay refresh while on the page keeps the page
  H.click('[data-lgme]');H.wait_for_timeout(300)
  H.evaluate("()=>{window.h2hPoll=async()=>[{_id:'zz'+Date.now()}];window.lgMerge=()=>true}");H.evaluate("lgTick(true)");H.wait_for_timeout(900)
  chk('background refresh keeps the scoring page',H.locator('#lgentry').count()==1 and H.locator('#lggrp').count()==0)
  chk('no post went to a real league topic during the test',all('ONIONSHD'.lower() not in u for u in POSTS))
  H.screenshot(path='/tmp/lgpage_own.png')
  # Phone 1 group page screenshot
  H.click('#lgtoleague');H.wait_for_timeout(300)
  H.click('[data-lgsg="0"]') if H.locator('[data-lgsg="0"]').count() else None;H.wait_for_timeout(300);H.screenshot(path='/tmp/lgpage_group.png')
  chk('no page errors',not errs,errs[:2]);b.close()
finally:
 srv.kill()
print(f'{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
