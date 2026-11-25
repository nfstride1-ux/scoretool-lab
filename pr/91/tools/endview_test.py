# End by end plot viewer (31 Oct 2026, Nathe via Archery Coach). Throwaway test profile in a test browser only.
# WebKit (the iPhone engine) at 390 x 844 with touch, emulating the installed home-screen app (navigator.standalone, display-mode standalone).
# Checks:
#  - no viewer while scoring, and the scoring-screen HTML at three points (before the first arrow, mid end,
#    end just completed) matches GOLD. Regenerated on purpose when Arrow size became the saved-arrow list.
#  - a new shoot scored by touch to the end: the end-of-shoot summary has the viewer, End 1 of 10, end total, three spots,
#    arrows numbered in shot order (not the saved highest-first order) at the true 23 size;
#  - swipe left / right (touch events), the arrow buttons (real touch taps), keyboard arrows; the edges stop; no jump to the top;
#    a mostly vertical swipe does not change end;
#  - old saved shoots (no arrow size, no shot numbers): viewer shows them at the old size in saved order with a plain note,
#    a keypad arrow is listed as not plotted, the saved record is byte-for-byte the same after viewing, swiping and a reload;
#  - an unfinished shoot reopened from Past sessions has no viewer.
import subprocess,sys,time,os,json,re,hashlib,math
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH=os.environ.get('SHOTS','/tmp/shots-endview');os.makedirs(SH,exist_ok=True)
CAP=os.environ.get('CAPTURE')
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
PORT=int(os.environ.get("PORT","8975"))
BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get('BASE') else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
GOLD={'start':'e2f1a6fb11fb','mid':'f543c263b098','done':'aa8a8dd856d5','sheet':'eed6f37c4820'}
RD='Australian Indoor 18m';IN=25.4;r23=23/64*IN/2/200
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
STANDALONE="""Object.defineProperty(navigator,'standalone',{get:()=>true});(()=>{const m=window.matchMedia.bind(window);window.matchMedia=q=>/display-mode:\\s*standalone/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},onchange:null,dispatchEvent(){return false}}:m(q)})()"""
# old saved shoots: positions and scores the way they were saved before this release (sorted highest first, no sn, no lcT)
SEED=r"""(RD)=>{S.sessions=(S.sessions||[]).filter(s=>!/^ev/.test(s.id));const F=face3R(faceR(ROUNDS[RD],0),{face3:'vert'}),Fs={face:'40cm'};
 const srt=(E,P)=>{const q=E.map((a,k)=>[a,P[k]]).sort((a,b)=>val(b[0])-val(a[0])||(b[0]=='X')-(a[0]=='X'));return[q.map(x=>x[0]),q.map(x=>x[1])]};
 const ends=[],pos=[];for(let i=0;i<10;i++){const P=[0,1,2].map(j=>({x:+(BUGC[j][0]+0.6*(0.02+0.012*((i+j)%5))).toFixed(5),y:+(BUGC[j][1]-0.6*0.01*(i%3)).toFixed(5)}));
  let E=P.map(p=>plotScore(p.x,p.y,F));if(i==1){P[1]=null;E[1]='8'}const r=srt(E,P);ends.push(r[0]);pos.push(r[1])}
 S.sessions.push({id:'evold',date:'2026-10-12',round:RD,face3:'vert',ends,pos,finished:true,note:''});
 const e2=[],p2=[];for(let i=0;i<10;i++){const P=[0,1,2].map(j=>({x:+(0.03*(j-1)+0.01*i).toFixed(4),y:+(0.02*j-0.01*(i%4)).toFixed(4)}));const r=srt(P.map(p=>plotScore(p.x,p.y,Fs)),P);e2.push(r[0]);p2.push(r[1])}
 S.sessions.push({id:'evone',date:'2026-10-13',round:RD,face3:'single',ends:e2,pos:p2,finished:true,note:''});
 S.sessions.push({id:'evpart',date:'2026-10-14',round:RD,face3:'vert',ends:ends.slice(0,3),pos:pos.slice(0,3),note:''});save()}"""
OLDS="JSON.stringify(S.sessions.filter(s=>/^ev/.test(s.id)))"
NORM=lambda h:re.sub(r'\bs\d{10,}\b','sID',h.replace(time.strftime('%Y-%m-%d'),'TODAY'))
def snap(pg):return hashlib.sha1(NORM(pg.evaluate("app.innerHTML")).encode()).hexdigest()[:12]
errs=[]
def tap(pg,x,y):
    q=pg.evaluate("([x,y])=>{const sv=document.querySelector('#pface'),p=sv.createSVGPoint();p.x=x;p.y=y;const r=p.matrixTransform(sv.getScreenCTM());return[r.x,r.y]}",[x,y])
    pg.touchscreen.tap(q[0],q[1]);pg.wait_for_timeout(300)
def ev(pg):return pg.evaluate("(()=>{const c=document.querySelector('.evcard');if(!c)return null;return{n:c.querySelector('.ev-n').textContent,sum:c.querySelector('.ev-sum').textContent,lay:(c.querySelector('[data-ev-lay]')||{}).dataset?.evLay||null,order:c.querySelector('.ev-list').dataset.evOrder,list:[...c.querySelectorAll('.ev-list li')].map(l=>l.textContent.trim()),nums:[...c.querySelectorAll('.evsvg text[fill=\"#fff\"]')].map(t=>t.textContent),prev:c.querySelector('[data-ev-go=\"-1\"]').disabled,next:c.querySelector('[data-ev-go=\"1\"]').disabled,note:/not saved/.test((c.querySelector('.ev-ord')||{}).textContent||''),none:!!c.querySelector('.ev-none')}})()")
def swipe(pg,x0,x1,dy=0):
    f=pg.locator('.evcard .ev-face')
    f.dispatch_event('touchstart',{'touches':[{'identifier':1,'clientX':x0,'clientY':400}],'changedTouches':[{'identifier':1,'clientX':x0,'clientY':400}]})
    f.dispatch_event('touchend',{'touches':[],'changedTouches':[{'identifier':1,'clientX':x1,'clientY':400+dy}]});pg.wait_for_timeout(200)
def btn(pg,d):
    bb=pg.locator(f'.evcard [data-ev-go="{d}"]').bounding_box();pg.touchscreen.tap(bb['x']+bb['width']/2,bb['y']+bb['height']/2);pg.wait_for_timeout(250)
try:
 with sync_playwright() as p:
  b=p.webkit.launch()
  ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=3,user_agent=UA)
  ctx.add_init_script(STANDALONE)
  if not os.environ.get('BASE'):ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(f'http://localhost:{PORT}') else r.abort())
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(BASE+'?tester=steven');pg.wait_for_timeout(1500)
  chk('WebKit, 390 px, touch, installed app (standalone) emulated',pg.evaluate("navigator.standalone===true&&matchMedia('(display-mode: standalone)').matches&&innerWidth==390&&'ontouchstart' in window"))
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Steven';save()");pg.evaluate(SEED,RD);pg.reload();pg.wait_for_timeout(1800)
  o0=pg.evaluate(OLDS)
  # ---------- a new shoot scored by touch: the live scoring screen ----------
  pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(500);pg.select_option('#rd',RD);pg.wait_for_timeout(300)
  if pg.locator('#f3row [data-f3=vert]').count():pg.locator('#f3row [data-f3=vert]').tap();pg.wait_for_timeout(200)
  pg.locator('#st').tap();pg.wait_for_timeout(900)
  H={'start':snap(pg)}
  C=pg.evaluate("BUGC");D=[0.092,0.015,0.062]   # shot order in each end: a 9, then an X, then a 10
  shot=[];hm=[]
  for i in range(10):
    for j in range(3):
      c=C[j];tap(pg,c[0]+D[j],c[1]+0.004*(i%3))
      if i==0 and j==1:H['mid']=snap(pg);chk('scoring screen mid end: no end viewer',pg.locator('.evcard').count()==0)
    if i==0:H['done']=snap(pg);chk('scoring screen after the end: no end viewer',pg.locator('.evcard').count()==0)
    pg.evaluate("document.querySelector('#fpm')?.remove()");pg.locator('#enext').tap();pg.wait_for_timeout(400)
    if i==0:H['sheet']=snap(pg);chk('score sheet during the shoot: no end viewer',pg.locator('.evcard').count()==0)
    if i<9:pg.locator('#addsc').tap();pg.wait_for_timeout(400)
  print('scoring screen snapshots',H)
  if CAP:print('CAPTURE',json.dumps(H));raise SystemExit
  for k in GOLD:chk(f'live scoring screen matches the saved-arrow snapshot ({k}: {H.get(k)})',H.get(k)==GOLD[k])
  s=pg.evaluate("JSON.stringify({id:cur.id,ends:cur.ends,pos:cur.pos,lcT:cur.lcT,k:cur.arrowD&&cur.arrowD.k,mm:cur.arrowD&&cur.arrowD.mm})");s=json.loads(s);print('new shoot ends',s['ends'][:2])
  chk('new shoot finished with 10 ends of 3 at the true 23 size',len(s['ends'])==10 and all(len(e)==3 for e in s['ends']) and s['lcT']==1 and abs((s.get('mm') or 0)-9.128)<0.001)
  chk('saved order is highest first (X, 10, 9), each plotted arrow keeps its shot number',s['ends'][0]==['X','10','9'] and [q['sn'] for q in s['pos'][0]]==[2,3,1])
  # ---------- end-of-shoot summary ----------
  if pg.locator('.evcard').count()==0 and pg.locator('#sheet,#finsess').count()==0:pg.evaluate("sv='sheet';score()");pg.wait_for_timeout(700)
  chk('end-of-shoot summary has the end by end viewer',pg.locator('.evcard').count()==1)
  pg.locator('.evcard').scroll_into_view_if_needed();pg.wait_for_timeout(300)
  V=ev(pg);print('end 1',V)
  chk('End 1 of 10, end total and running total',V['n']=='End 1 of 10' and V['sum']=='End total 29 · running total 29')
  chk('3-spot shoot shows the three spots for the end',V['lay']=='vert')
  chk('arrows numbered in shot order on the face (1 2 3) and listed 1 9, 2 X, 3 10',sorted(V['nums'])==['1','2','3'] and V['list']==['1 9','2 X','3 10'] and V['order']=='shot')
  # number 1 sits by the 9 (spot 1 arrow); compare badge positions to arrows
  pr=pg.evaluate("(()=>{const sv=document.querySelector('.evcard .evsvg');const A=[...sv.querySelectorAll('circle[fill-opacity]')].map(c=>[+c.getAttribute('cx'),+c.getAttribute('cy'),+c.getAttribute('r'),+c.getAttribute('stroke-width')]),T=[...sv.querySelectorAll('text[fill=\"#fff\"]')].map(t=>[t.textContent,+t.getAttribute('x'),+t.getAttribute('y')]);return{A,T}})()")
  near=lambda t:min(range(len(pr['A'])),key=lambda k:math.hypot(pr['A'][k][0]-t[1],pr['A'][k][1]-t[2]))
  sp=lambda x:min(range(3),key=lambda k:abs([-0.66,0,0.66][k]-x))
  chk('badge 1 by the spot 1 arrow (the 9), 2 by spot 2 (X), 3 by spot 3 (10)',[sp(pr['A'][near(t)][0]) for t in sorted(pr['T'])]==[0,1,2])
  chk(f'arrows drawn at the true 23 size (outer edge {r23*0.6:.4f})',len(pr['A'])==3 and all(abs(a[2]+a[3]/2-r23*0.6)<2e-4 for a in pr['A']))
  pg.locator('.evcard').screenshot(path=f'{SH}/endview-new-end1.png')
  y0=pg.evaluate("scrollY")
  swipe(pg,320,90);V=ev(pg);chk('swipe left: End 2 of 10',V['n']=='End 2 of 10' and not V['prev'])
  chk('no jump to the top after a swipe',abs(pg.evaluate("scrollY")-y0)<2 and y0>100)
  pg.locator('.evcard').screenshot(path=f'{SH}/endview-new-end2-after-swipe.png')
  swipe(pg,90,320);chk('swipe right: back to End 1 of 10, previous disabled',ev(pg)['n']=='End 1 of 10' and ev(pg)['prev'])
  swipe(pg,90,320);chk('swipe right on End 1 stays on End 1',ev(pg)['n']=='End 1 of 10')
  swipe(pg,300,240,dy=160);chk('a mostly vertical swipe does not change end',ev(pg)['n']=='End 1 of 10')
  for _ in range(9):btn(pg,1)
  V=ev(pg);chk('next button (touch) x9: End 10 of 10, next disabled',V['n']=='End 10 of 10' and V['next'])
  chk('no jump to the top after the buttons',abs(pg.evaluate("scrollY")-y0)<40)
  btn(pg,-1);chk('previous button: End 9 of 10',ev(pg)['n']=='End 9 of 10')
  pg.locator('.evcard').focus();pg.keyboard.press('ArrowLeft');pg.keyboard.press('ArrowLeft');chk('keyboard left arrow x2: End 7 of 10',ev(pg)['n']=='End 7 of 10')
  pg.keyboard.press('ArrowRight');chk('keyboard right arrow: End 8 of 10',ev(pg)['n']=='End 8 of 10')
  tot=pg.evaluate("total(cur)");chk(f'running total on End 10 equals the shoot total ({tot})',(btn(pg,1),btn(pg,1),ev(pg)['sum'].endswith(f'running total {tot}'))[2])
  chk('buttons have names for screen readers',pg.evaluate("[...document.querySelectorAll('.evcard [data-ev-go]')].map(b=>b.getAttribute('aria-label'))")==['Previous end','Next end'])
  pg.locator('#finsess').tap();pg.wait_for_timeout(800)
  chk('Finish session still works',pg.evaluate("location.hash||''")!=None and pg.locator('#shwins').count()==1)
  nid=s['id']
  # ---------- old saved shoots from Past sessions ----------
  pg.evaluate("cur=null;nav('score')");pg.wait_for_timeout(500)
  pg.locator('[data-open=evold]').scroll_into_view_if_needed();pg.locator('[data-open=evold]').tap();pg.wait_for_timeout(900)
  chk('old 3-spot shoot reopened: viewer shown',pg.locator('.evcard').count()==1)
  pg.locator('.evcard').scroll_into_view_if_needed();V=ev(pg);print('old end 1',V)
  O=json.loads(o0);E0=[e for e in O if e['id']=='evold'][0]
  chk('old shoot: saved order with the plain note (shot order was not saved)',V['order']=='saved' and V['note'] and V['list']==[f'{k+1} {a}' for k,a in enumerate(E0['ends'][0])])
  chk('old shoot: end total matches the saved end',V['sum'].startswith('End total '+str(pg.evaluate(f"endSum({json.dumps(E0['ends'][0])})"))))
  rr=pg.evaluate("[...document.querySelectorAll('.evcard .evsvg circle[fill-opacity]')].map(c=>+c.getAttribute('r'))")
  chk(f'old shoot drawn at the old line-cutter size it was scored with ({rr})',len(rr)==3 and all(abs(r-0.035*0.6)<1e-4 for r in rr))
  pg.locator('.evcard').screenshot(path=f'{SH}/endview-old-3spot-end1.png')
  swipe(pg,320,90);V=ev(pg);print('old end 2',V)
  chk('old shoot end 2: keypad arrow listed as not plotted, two arrows on the face',any('not plotted' in l for l in V['list']) and len(V['nums'])==2)
  pg.locator('.evcard').screenshot(path=f'{SH}/endview-old-3spot-end2-keypad.png')
  for _ in range(8):swipe(pg,320,90)
  chk('old shoot: swipe to End 10 of 10',ev(pg)['n']=='End 10 of 10')
  chk('old shoot record byte-for-byte the same after viewing and swiping',pg.evaluate(OLDS)==o0)
  pg.evaluate("cur=null;nav('score')");pg.wait_for_timeout(500)
  pg.locator('[data-open=evone]').scroll_into_view_if_needed();pg.locator('[data-open=evone]').tap();pg.wait_for_timeout(900)
  pg.locator('.evcard').scroll_into_view_if_needed();V=ev(pg)
  chk('old single-face shoot: full face (no spots), End 1 of 10, 3 numbered arrows',V and V['lay'] is None and V['n']=='End 1 of 10' and len(V['nums'])==3 and pg.locator('.evcard .shplot').count()==1)
  pg.locator('.evcard').screenshot(path=f'{SH}/endview-old-single-end1.png')
  pg.evaluate("cur=null;nav('score')");pg.wait_for_timeout(500)
  pg.locator('[data-open=evpart]').scroll_into_view_if_needed();pg.locator('[data-open=evpart]').tap();pg.wait_for_timeout(900)
  chk('unfinished shoot reopened: no viewer',pg.locator('.evcard').count()==0)
  pg.evaluate("cur=null;nav('score')");pg.wait_for_timeout(400);pg.reload();pg.wait_for_timeout(1500)
  chk('after reload the old shoots are still byte-for-byte the same',pg.evaluate(OLDS)==o0)
  pg.evaluate(f"S.sessions=S.sessions.filter(s=>!/^ev/.test(s.id)&&s.id!='{nid}');save()")
  b.close()
finally:
  srv and srv.terminate()
if not CAP:
  chk('no page errors',not errs);errs and print(errs)
  print(f'{len(ok)} passed, {len(bad)} failed')
