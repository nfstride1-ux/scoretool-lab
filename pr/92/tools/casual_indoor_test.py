# Casual indoor scoring = Just me (26 Oct 2026, same fix as the league: indoor scoring changes must work in Casual too).
# Phone-sized browser, tester profile "nate" only (his own localStorage key; never Nathe's). Relay mocked in memory, so no real traffic.
# One archer on one phone scores a whole Australian Indoor 18m casual shoot (10 ends of 3, vertical 3-spot) by tapping the face: each arrow measured from its
# own spot, ends put in order, per-end totals, undo, fix an arrow, delete an arrow, saved plot positions, analysis straight under the score.
# The same 30 arrow taps in Just me give the same scores, order and positions. Casual scores kept in the old format (e) plus plots (p).
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
from indoor_common import GEN,click_face,snap
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen([sys.executable,'-m','http.server','8862'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
POSTS=[]
def relay(route,req):
  if req.method=='POST':POSTS.append(req.post_data or '');return route.fulfill(status=200,body='{}',headers={'access-control-allow-origin':'*'})
  route.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'})
def phone(b,tid='nate'):
  ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);ctx.route('https://ntfy.sh/**',relay);pg=ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)));pg.goto(f'http://localhost:8862/?tester={tid}');pg.wait_for_timeout(1200)
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Nate';save()");pg.reload();pg.wait_for_timeout(2200);return ctx,pg,errs
VAL="a=>a=='X'?10:a=='M'?0:+a"
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  # ---------- Just me: the reference ----------
  c1,jm,e1=phone(b)
  jm.evaluate("cur=null;sv='sheet';nav('score')");jm.wait_for_timeout(500)
  jm.select_option('#rd','Australian Indoor 18m');jm.wait_for_timeout(300);jm.click('#f3row [data-f3=vert]');jm.wait_for_timeout(200);jm.click('#st');jm.wait_for_timeout(800)
  PTS=jm.evaluate(GEN,'Australian Indoor 18m');chk('30 robust arrow positions made',len(PTS)==30)
  chk('Just me is on the vertical 3-spot',jm.evaluate("cur.face3")=='vert')
  for i,(x,y,v) in enumerate(PTS):
    click_face(jm,'pface',x,y)
    if i%3==2:
      jm.evaluate("document.querySelector('#fpm')?.remove()");jm.click('#enext');jm.wait_for_timeout(300)
      if i<29:jm.click('#addsc');jm.wait_for_timeout(300)
  JT=jm.evaluate("document.body.innerText");JSUM=jm.evaluate("(()=>{const a=document.querySelector('#finsess');return !!a&&!!document.querySelector('.ad-sum')&&!!document.querySelector('.shcard')})()")
  chk('Just me finishing shows the summary and the plotted group',JSUM)
  jm.screenshot(path='/tmp/lgx_ind_just.png',full_page=True)
  J=jm.evaluate("(()=>{const s=S.sessions[S.sessions.length-1];return{ends:s.ends,pos:s.pos,face3:s.face3}})()")
  chk('Just me scored all 30 arrows',sum(len(e) for e in J['ends'])==30)
  # ---------- Casual: same arrow values, buttons only, no face ----------
  c2,pg,e2=phone(b)
  KEY=pg.evaluate("KEY");before=snap(pg)
  pg.evaluate("nav('score')");pg.wait_for_timeout(500)
  CODE=pg.evaluate("csCreate({name:'Indoor test',round:'Australian Indoor 18m',face3:'vert',self:true,ppl:[]}).code");ME=pg.evaluate('csMe()')
  pg.evaluate(f"csView('{CODE}')");pg.wait_for_timeout(600)
  chk('casual is on the vertical 3-spot setting',pg.evaluate(f"csGet('{CODE}').face3")=='vert')
  chk('casual has End and Running totals and no plotting face',pg.locator('#csendtot').count()==1 and pg.locator('#csrun').count()==1 and pg.locator('#cspface').count()==0 and pg.locator('#cshide').count()==0 and pg.locator('[data-csspot]').count()==0)
  chk('score keys X 10 9 8 7 6 M',pg.evaluate("[...document.querySelectorAll('#csentry [data-csk]')].map(b=>b.dataset.csk)")==['X','10','9','8','7','6','M'])
  pg.screenshot(path='/tmp/lgx_ind_casual0.png')
  def tap(a):pg.click(f'#csentry [data-csk="{a}"]');pg.wait_for_timeout(30)
  def L():return pg.evaluate(f"(()=>{{const e=csGet('{CODE}').sc[csMe()];return{{e:e.e,p:e.p||null}}}})()")
  for a in J['ends'][0]:tap(a)
  d=L()
  chk('end 1 matches the Just me values and stores no plot',d['e'][0]==J['ends'][0] and not d['p'])
  tot=sum(pg.evaluate(f"({VAL})('{a}')") for a in d['e'][0])
  chk('running total moves on and the next end starts at 0',pg.locator('#csrun').inner_text()==str(tot) and pg.locator('#csendtot').inner_text()=='0')
  for a in J['ends'][1][:2]:tap(a)
  chk('two arrows in end 2',len(L()['e'][1])==2)
  pg.click('#csundo');pg.wait_for_timeout(200)
  chk('undo takes the last button score',len(L()['e'][1])==1)
  for end in J['ends'][1:]:
    have=len((L()['e']+[None])[len(L()['e'])-1] or []) if L()['e'] else 0
    # finish whatever is open, then the rest of this end and later ends
  # score every remaining arrow from the Just me card
  flat=[a for end in J['ends'] for a in end]
  got=[a for end in L()['e'] for a in end]
  for a in flat[len(got):]:tap(a)
  d=L()
  chk('casual ends equal Just me ends',d['e']==J['ends'] and not d['p'])
  tots=[sum(pg.evaluate(f"({VAL})('{a}')") for a in e) for e in d['e']]
  exp_ends=' · '.join(f"E{i+1} {' '.join(e)} ({tots[i]})" for i,e in enumerate(d['e']))
  pg.evaluate("document.querySelector('#csends').open=true")
  chk('per-end totals and the score add up',exp_ends in pg.evaluate("document.querySelector('#csends').textContent") and pg.evaluate("document.querySelector('.cs-tab tbody tr td:nth-child(3)').textContent")==str(sum(tots)))
  chk('finished: still no face, table and total shown',pg.locator('#cspface').count()==0 and pg.locator('#csentry [data-csk]').count()==0)
  chk('analysis is the score, with no plotted group',pg.locator('#csan').count()==1 and str(sum(tots)) in pg.inner_text('#csan') and pg.locator('#csan .shplot').count()==0)
  lg=pg.evaluate(f"csGet('{CODE}').sc[csMe()]");chk('saved record keeps the ends and has no plots', 'e' in lg and not lg.get('p'))
  S=pg.evaluate(f"S.sessions.find(x=>x.id=='cs-{CODE}')")
  chk('own session saved with the same scores and no plot positions',bool(S) and S['ends']==J['ends'] and not any((S.get('pos') or [])))
  chk('nothing sent to the relay carries plot positions',not any('"p":' in x for x in POSTS))
  pg.evaluate("document.querySelector('#csfix').open=true");pg.click('#csundo');pg.wait_for_timeout(300)
  chk('undo after finishing takes the last arrow back and the face stays hidden',pg.locator('#cspface').count()==0 and len(L()['e'][-1])==2)
  tap(J['ends'][-1][-1])
  chk('re-scored, finished again',L()['e']==J['ends'])
  # only this tester's own key was written
  after=snap(pg);chg=sorted(k for k in set(before)|set(after) if before.get(k)!=after.get(k))
  print('keys changed while scoring:',chg)
  chk('only the tester\'s own keys changed (scoretool.v1.nate)',chg==['scoretool.v1.nate'] and KEY=='scoretool.v1.nate')
  chk('no data under Nathe\'s or the shared key',not any(k in after for k in ('scoretool.v1','scoretool.v1.nathe')))
  chk('no page errors',not e1 and not e2)
  b.close()
finally: srv.kill()
print(f'\n{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
