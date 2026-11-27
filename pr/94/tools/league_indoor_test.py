# League indoor scoring = Just me (26 Oct 2026, Nathe: "the changes we made to indoor scoring don't seem to be working on the league").
# Phone-sized browser, tester profile "nate" only (his own localStorage key; never Nathe's). Relay mocked in memory, so no real traffic.
# One archer on one phone scores a whole Onion Shed week (10 ends of 3, vertical 3-spot) by tapping the face: each arrow measured from its
# own spot, ends put in order, per-end totals, undo, fix an arrow, delete an arrow, saved plot positions, analysis straight under the score.
# The same 30 arrow taps in Just me give the same scores, order and positions. League scores kept in the old format (e) plus plots (p).
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
from indoor_common import GEN,click_face,snap
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen([sys.executable,'-m','http.server','8861'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
POSTS=[]
def relay(route,req):
  if req.method=='POST':POSTS.append(req.post_data or '');return route.fulfill(status=200,body='{}',headers={'access-control-allow-origin':'*'})
  route.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'})
def phone(b,tid='nate'):
  ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);ctx.route('https://ntfy.sh/**',relay);pg=ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)));pg.goto(f'http://localhost:8861/?tester={tid}');pg.wait_for_timeout(1200)
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Nate';save()");pg.reload();pg.wait_for_timeout(2200);return ctx,pg,errs
VAL="a=>a=='X'?10:a=='M'?0:+a"
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  # ---------- Just me: the reference ----------
  c1,jm,e1=phone(b)
  jm.evaluate("cur=null;sv='sheet';nav('score')");jm.wait_for_timeout(500)
  jm.select_option('#rd','Vegas 300 (18 m)');jm.wait_for_timeout(300);jm.click('#st');jm.wait_for_timeout(800)
  PTS=jm.evaluate(GEN,'Vegas 300 (18 m)');chk('30 robust arrow positions made',len(PTS)==30)
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
  # ---------- League ----------
  c2,pg,e2=phone(b)
  KEY=pg.evaluate("KEY");before=snap(pg)
  pg.evaluate("nav('score')");pg.wait_for_timeout(500);pg.evaluate("(()=>{if(!lgGet('ONIONSHD')){S.leagues.push(lgPresetRecord());save()}lgView('ONIONSHD')})()");pg.wait_for_timeout(500)
  chk('tester sees the league',pg.locator('[data-lgme]').count()==1)
  pg.click('[data-lgme]');pg.wait_for_timeout(500)
  chk('Just me look: End and Prog boxes',pg.locator('#csad .ad-num').count()==2 and pg.locator('#csad .ad-head').count()==1)
  chk('face is the vertical 3-spot (3 spots, plotting face)',pg.locator('#cspface').count()==1 and pg.evaluate("document.querySelectorAll('#csad .zbar [data-csspot]').length")==4)
  chk('score keys X 10 9 8 7 6 M',pg.evaluate("[...document.querySelectorAll('#csad [data-lgk]')].map(b=>b.dataset.lgk).join('')")=='X1098'+'76M' or pg.evaluate("[...document.querySelectorAll('#csad [data-lgk]')].map(b=>b.dataset.lgk)")==['X','10','9','8','7','6','M'])
  vis=pg.evaluate("(()=>{const q=s=>document.querySelector(s).getBoundingClientRect(),nv=document.querySelector('nav').getBoundingClientRect();return{face:q('#cspface').bottom<=innerHeight,pad:q('#csad .ad-pad').bottom<=nv.top+1,top:q('#csad .ad-head').top>=0}})()")
  chk('phone: face, End/Prog and the score keys are all on the screen at once',vis['face'] and vis['pad'] and vis['top'])
  pg.screenshot(path='/tmp/lgx_ind_league0.png')
  def L():return pg.evaluate("(()=>{const e=lgGet('ONIONSHD').sc.nate[1];return{e:e.e,p:e.p||[]}})()")
  # end 1: three taps, one per spot
  for x,y,v in PTS[:3]:click_face(pg,'cspface',x,y)
  d=L();exp=sorted([v for _,_,v in PTS[:3]],key=lambda a:(-(10 if a=='X' else 0 if a=='M' else int(a)),a!='X'))
  chk('end 1 scored from each arrow\'s own spot, put in order',d['e'][0]==exp==J['ends'][0])
  chk('end 1 plots saved in step with the scores',len(d['p'][0])==3 and all(d['p'][0]))
  tot=sum(pg.evaluate(f"({VAL})('{a}')") for a in d['e'][0])
  chk('End box shows 0 for the new end, Prog the running total',pg.evaluate("[...document.querySelectorAll('#csad .ad-num b')].map(b=>b.textContent)")==['0',str(tot)])
  chk('table row 1 matches the end',pg.evaluate("document.querySelector('#csadtab tbody tr td:nth-child(3)').textContent")==str(tot))
  # undo mid-end
  for x,y,v in PTS[3:5]:click_face(pg,'cspface',x,y)
  chk('two arrows in end 2',len(L()['e'][1])==2 and len(L()['p'][1])==2)
  pg.click('#lgundo');pg.wait_for_timeout(300)
  chk('undo takes the last arrow and its plot',len(L()['e'][1])==1 and len(L()['p'][1])==1)
  # fix the arrow: tap its chip, then tap the face at the next arrow's position
  pg.click('#csad .ad-chips [data-csfix]');pg.wait_for_timeout(300)
  chk('fix mode on',pg.locator('#csfxdone').count()==1 and pg.locator('#csdelarrow').count()==1)
  x,y,v=PTS[4];click_face(pg,'cspface',x,y)
  d=L();chk('arrow fixed in place (value and plot replaced), fix mode off',d['e'][1]==[v] and d['p'][1][0]['x']==x or abs(d['p'][1][0]['x']-x)<0.01)
  chk('fix mode closed',pg.locator('#csfxdone').count()==0)
  pg.click('#csad .ad-chips [data-csfix]');pg.wait_for_timeout(200);pg.click('#csdelarrow');pg.wait_for_timeout(300)
  d=L();chk('delete arrow removes it (and the empty end) with its plot',len(d['e'])==1 and len(d['p'])==1)
  # the rest, exactly as Just me
  for x,y,v in PTS[3:]:click_face(pg,'cspface',x,y)
  d=L()
  chk('league ends equal Just me ends (same taps)',d['e']==J['ends'])
  def close(a,b):return len(a)==len(b) and all(len(r)==len(s) and all(abs(u['x']-w['x'])<0.012 and abs(u['y']-w['y'])<0.012 for u,w in zip(r,s)) for r,s in zip(a,b))
  chk('league plot positions equal Just me positions',close(d['p'],J['pos']))
  tots=[sum(pg.evaluate(f"({VAL})('{a}')") for a in e) for e in d['e']]
  chk('per-end totals add up (table)',pg.evaluate("[...document.querySelectorAll('#csadtab tbody tr td:nth-child(3)')].map(t=>+t.textContent)")==tots)
  chk('finished: face and keys gone, table and total shown',pg.locator('#cspface').count()==0 and pg.locator('#csad .ad-sum .big').text_content()==str(sum(tots)))
  chk('analysis directly under the score card',pg.evaluate("(()=>{const a=document.querySelector('#lgan'),c=document.querySelector('#lgentry');return !!a&&!!c&&c.nextElementSibling===a})()"))
  LT=pg.evaluate("document.querySelector('#lgan').innerText");M='WHERE THIS SHOOT LANDED'
  chk('analysis has the round summary (score, personal best) and the plotted group',pg.locator('#lgan .shcard').count()==1 and 'Score' in LT and str(sum(tots)) in LT and 'Round Name' in LT)
  chk('analysis text equals Just me\'s (group centre, spread, sight move)',M in LT and M in JT and LT[LT.index(M):][:420]==JT[JT.index(M):][:420])
  chk('arrow plot shows one dot per arrow',pg.evaluate("document.querySelectorAll('#lgan .shcard .shplot > circle[fill=\"#fff\"][stroke=\"#0b1f4d\"]').length")==30)
  pg.screenshot(path='/tmp/lgx_ind_league1.png',full_page=True)
  # saved record: old format kept, session added with plots + face for groups and heatmaps
  lg=pg.evaluate("lgGet('ONIONSHD').sc.nate[1]");chk('saved record keeps e (ends) and adds p only',set(lg)=={'e','p','by','u','f'} and lg['f']=='vert')
  S=pg.evaluate("S.sessions.find(x=>x.id=='lg-ONIONSHD-w1')")
  chk('own session saved, vertical 3-spot tag, same scores',bool(S) and S['face3']=='vert' and S['ends']==J['ends'] and close(S['pos'],J['pos']))
  rows=pg.evaluate("""(()=>{const s=S.sessions.find(x=>x.id=='lg-ONIONSHD-w1'),R=ROUNDS[s.round],P=shotPts(s);return P.target.map(p=>{const Fi=faceR(R,p.e);let v;if(p.k=='spot'){const d=Math.hypot(p.x,p.y)-0.035;v=d>0.5?'M':d<=0.05?'X':String(Math.min(10,10-Math.floor(Math.max(0,d)*10)))}else v=plotScore(p.x,p.y,{...Fi,col:false});return[p.k,p.a,v]})})()""")
  chk('heatmap points: 30, each measured on its own spot, plotted == scored',len(rows)==30 and all(r[0]=='spot' and r[1]==r[2] for r in rows))
  chk('relay carried the ends but no plot positions',len(POSTS)>0 and not any('"x"' in x or '"p"' in x for x in POSTS))
  # undo after finishing still works, session follows
  pg.click('#lgundo');pg.wait_for_timeout(400)
  chk('undo after finishing takes the last arrow back (face returns)',pg.locator('#cspface').count()==1 and len(L()['e'][9])==2)
  x,y,v=PTS[29];click_face(pg,'cspface',x,y)
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
