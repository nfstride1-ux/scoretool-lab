# 3-spot arrow plot (28 Oct 2026, Nathe: "I only hit the 9 four times, this looks like it hit all over the place. Line the 3 spot targets properly").
# Seeds a throwaway local profile in a test browser only (no network). Checks, on Vegas triangle and vertical 3-spot sessions:
#  - every plotted arrow is drawn at its real place (distance from its own spot centre) with its own radius, so the ring its edge touches is the ring it scored
#    (a shoot of 16 X, 10 tens and 4 nines shows exactly four arrows whose edge reaches the 9 ring and none further out);
#  - a second view shows the three spots in their layout, each arrow on its own spot (counts per spot add up, arrow inside its spot);
#  - old sessions (no face3, plotted on the full face) and single-face sessions are unchanged: no spots view, same dots.
import subprocess,sys,time,os,json,re
os.environ['ST_NO_COMPAT']='1'
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH=os.environ.get('SHOTS','/tmp/shots-plot3spot');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
BASE=os.environ.get('BASE') or f"http://localhost:{os.environ.get('PORT','8963')}/"
PORT=int(os.environ.get("PORT","8963"))
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
SEED=r"""(()=>{let r=11;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647};
 /* want: 16 X, 10 tens, 4 nines, spread over the three spots; radius is distance from spot centre in single-face units */
 const mk=(id,date,round,face3,want)=>{const R=ROUNDS[round],s={id,date,round,ends:[],pos:[],face3,finished:true,note:''},F=face3R(faceR(R,0),{face3}),C=spots3(F),bag=[];
  want.forEach(([v,lo,hi,n])=>{for(let i=0;i<n;i++){let t=0;for(;;t++){const rr=lo+(hi-lo)*rnd(),a=rnd()*6.283,c=C[bag.length%3],x=+(c[0]+rr*0.6*Math.cos(a)).toFixed(3),y=+(c[1]+rr*0.6*Math.sin(a)).toFixed(3);if(plotScore(x,y,F)==v){bag.push({x,y,v});break}}}});
  for(let e=0;e<10;e++){const E=bag.slice(e*3,e*3+3);s.ends.push(E.map(b=>b.v));s.pos.push(E.map(b=>({x:b.x,y:b.y,...(face3=='vegas'?{g:1}:{})})))}return s};
 const W=[['X',0,0.08,16],['10',0.1,0.13,10],['9',0.14,0.23,4]];
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 S.sessions=(S.sessions||[]).filter(s=>!/^p3/.test(s.id));
 const v1=mk('p3a','2026-10-20','Vegas 300','vegas',W),v2=mk('p3b','2026-10-22','Vegas 300','vegas',W),v3=mk('p3c',today(),'Vegas 300','vegas',W);
 const vt=mk('p3v',today(),'Australian Indoor 18m','vert',W);vt.ends=vt.ends.concat(vt.ends);vt.pos=vt.pos.concat(vt.pos);
 /* old session plotted on the full 40cm face (no face3) and a single-face session: must be untouched */
 const old={id:'p3old',date:'2026-09-01',round:'Indoor WA 18m',ends:[['10','9','9']],pos:[[{x:0.05,y:0.02},{x:0.12,y:0.1},{x:-0.15,y:0.05}]],finished:true,note:''};
 const sf={id:'p3sf',date:'2026-09-02',round:'Australian Indoor 18m',ends:[['X','10','9']],pos:[[{x:0.01,y:0.0},{x:0.08,y:0.04},{x:-0.17,y:0.05}]],face3:'single',finished:true,note:''};
 S.sessions.push(v1,v2,v3,vt,old,sf);save()})()"""
def top(pg,sel):
  pg.evaluate(f"(()=>{{const e=document.querySelector({json.dumps(sel)});e.scrollIntoView({{block:'start'}});scrollBy(0,-80)}})()");pg.wait_for_timeout(200)
CHK=r"""(id)=>{const s=S.sessions.find(x=>x.id==id),q=shotPts(s).target,out={n:q.length,bad:0,ring9:0,beyond:0};
 const F=face3R(faceR(ROUNDS[s.round],0),{face3:s.face3});
 q.forEach(p=>{const d=Math.hypot(p.x,p.y),edge=d-p.r; /* the arrow edge at distance d-r from centre = the ring it scored */
  const v=edge<=0.05?'X':String(Math.min(10,10-Math.floor(Math.max(0,edge)*10)));const sc=p.a=='X'||p.a=='10'&&v=='X'?p.a:p.a;
  if(!(v==p.a||(p.a=='10'&&v=='X')))out.bad++;if(p.a=='9'){out.ring9++;if(edge>0.2+1e-6)out.beyond++}});return out}"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
  ctx.route('**/*',lambda r:r.continue_() if (r.request.url.startswith(f'http://localhost:{PORT}') or r.request.url.startswith(BASE)) else r.abort())
  pg=ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(BASE+'?tester=steven');pg.wait_for_timeout(1200)
  pg.evaluate("S.unlocked=true;save()");pg.evaluate("localStorage.setItem('scoretool.theme','light')");pg.evaluate(SEED);pg.reload();pg.wait_for_timeout(1800)
  r=pg.evaluate(CHK,'p3c')
  chk(f'Vegas 300: 30 plotted arrows, each one scores the ring its edge touches (bad={r["bad"]})',r['n']==30 and r['bad']==0)
  chk(f'Vegas 300: exactly four 9s, none further out than the 9 ring ({r["ring9"]})',r['ring9']==4 and r['beyond']==0)
  sc=pg.evaluate("S.sessions.find(x=>x.id=='p3c').ends.flat().reduce((m,a)=>(m[a]=(m[a]||0)+1,m),{})");chk(f'seed is 16 X, 10 tens, 4 nines {sc}',sc.get('X')==16 and sc.get('10')==10 and sc.get('9')==4)
  r=pg.evaluate(CHK,'p3v');chk(f'vertical 3-spot (Indoor 18m): arrows score the ring their edge touches (bad={r["bad"]})',r['bad']==0 and r['n']==60)
  pg.evaluate("nav('score')");pg.wait_for_timeout(600)
  pg.locator('[data-open=p3c]').scroll_into_view_if_needed();pg.locator('[data-open=p3c]').tap();pg.wait_for_timeout(900)
  card=pg.locator('.shcmp .shcard').first
  chk('Vegas: main plot card and the three-spot view both there',pg.locator('.shcmp .shplot').count()==1 and pg.locator('.shcmp .shspotsvg').count()==1)
  m=pg.evaluate("""()=>{const sv=document.querySelector('.shcmp .shspotsvg'),vb=sv.getAttribute('viewBox').split(' ').map(Number);
   const rings=[...sv.querySelectorAll('circle')].filter(c=>+c.getAttribute('r')==0.3);const dots=[...sv.querySelectorAll('circle')].filter(c=>c.getAttribute('fill')=='#fff'&&+c.getAttribute('r')==0.0075);
   const cen=rings.map(c=>[+c.getAttribute('cx'),+c.getAttribute('cy')]);const per=[0,0,0];let outside=0;
   dots.forEach(d=>{const x=+d.getAttribute('cx'),y=+d.getAttribute('cy');let b=0,bd=9;cen.forEach((c,i)=>{const dd=Math.hypot(x-c[0],y-c[1]);if(dd<bd){bd=dd;b=i}});per[b]++;if(bd>0.3)outside++});
   return{n:dots.length,cen,per,outside,txt:sv.textContent,w:sv.getBoundingClientRect().width}}""")
  chk(f'Vegas three-spot view: 30 arrows, triangle layout {m["cen"]}',m['n']==30 and m['cen']==[[0,-0.39],[-0.34,0.2],[0.34,0.2]])
  chk(f'Vegas three-spot view: every arrow inside its spot, 10 per spot {m["per"]}',m['outside']==0 and m['per']==[10,10,10])
  chk('Vegas three-spot view: labelled Spot 1, 2, 3',all(f'Spot {i}' in m['txt'] for i in (1,2,3)))
  chk('Vegas three-spot view: Spot 1 is the top spot',m['cen'][0][1]<m['cen'][1][1] and m['cen'][0][0]==0)
  mig=pg.evaluate("""()=>{const sp=p=>{const q=triPt(p);return TRIC.reduce((b,c,n)=>Math.hypot(q.x-c[0],q.y-c[1])<Math.hypot(q.x-TRIC[b][0],q.y-TRIC[b][1])?n:b,0)};
   const top={x:0,y:-0.39,g:1},bl={x:-0.34,y:0.2,g:1},br={x:0.34,y:0.2,g:1},pre={x:-0.34,y:-0.2},q=triPt(pre);
   return {top:sp(top),bl:sp(bl),br:sp(br),pre:[+q.x.toFixed(2),+q.y.toFixed(2)],preSp:sp(pre),g:tapScore({x:0,y:-0.39},{tri:1,face:'40cm 3-spot'},{}).xy.g,same:top.x===0&&bl.x===-0.34}}""")
  chk('older top spot (old Spot 3, g:1) is Spot 1 and is not moved',mig['top']==0 and mig['same'])
  chk('older bottom-left (old Spot 1) is Spot 2, bottom-right (old Spot 2) is Spot 3',mig['bl']==1 and mig['br']==2)
  chk('pre-flip left spot still draws on the bottom left, as Spot 2',mig['pre']==[-0.34,0.2] and mig['preSp']==1)
  chk('a new triangle plot is saved with g:2',mig['g']==2)
  t=pg.locator('#app').inner_text();chk('key line says arrows per spot',re.search(r'arrows per spot: 10, 10, 10',t) is not None)
  chk('no overflow at 390',pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  top(pg,'.shcmp .shcard');pg.screenshot(path=f'{SH}/01-vegas-landed-card.png')
  pg.evaluate("document.querySelector('.shcmp .shspots').scrollIntoView({block:'center'})");pg.wait_for_timeout(250);pg.screenshot(path=f'{SH}/02-vegas-three-spots.png')
  # vertical
  pg.reload();pg.wait_for_timeout(1500);pg.evaluate("nav('score')");pg.wait_for_timeout(600)
  pg.locator('[data-open=p3v]').scroll_into_view_if_needed();pg.locator('[data-open=p3v]').tap();pg.wait_for_timeout(900)
  m=pg.evaluate("()=>{const sv=document.querySelector('.shcmp .shspotsvg');if(!sv)return null;const c=[...sv.querySelectorAll('circle')].filter(c=>+c.getAttribute('r')==0.3).map(c=>[+c.getAttribute('cx'),+c.getAttribute('cy')]);return{c,n:[...sv.querySelectorAll('circle')].filter(c=>+c.getAttribute('r')==0.0075).length}}")
  chk(f'vertical: three spots side by side, 60 arrows {m}',m and m['n']==60 and m['c']==[[-0.66,0],[0,0],[0.66,0]])
  pg.evaluate("document.querySelector('.shcmp .shspots').scrollIntoView({block:'center'})");pg.wait_for_timeout(250);pg.screenshot(path=f'{SH}/03-vertical-three-spots.png')
  # the Analytics arrow plot (several shoots at once) draws the same three spots
  h=pg.evaluate("shotPlotCards(S.sessions.filter(s=>/^p3[abc]$/.test(s.id)),{title:'Arrow plot',multi:true})")
  chk('Analytics arrow plot card carries the three-spot view (90 arrows, 30 per spot)',h.count('class="shspotsvg"')==1 and 'arrows per spot: 30, 30, 30' in h)
  # old and single-face sessions: untouched
  for sid,nm in (('p3old','old full-face session'),('p3sf','single-face session')):
    pg.reload();pg.wait_for_timeout(1500);pg.evaluate("nav('score')");pg.wait_for_timeout(600)
    pg.locator(f'[data-open={sid}]').scroll_into_view_if_needed();pg.locator(f'[data-open={sid}]').tap();pg.wait_for_timeout(800)
    chk(f'{nm}: no three-spot view, plot as before',pg.locator('.shcmp .shspotsvg').count()==0 and pg.locator('.shcmp .shplot').count()==1)
    pts=pg.evaluate("id=>shotPts(S.sessions.find(s=>s.id==id)).target.map(p=>[p.x,p.y])",sid)
    exp={'p3old':[[0.05,0.02],[0.12,0.1],[-0.15,0.05]],'p3sf':[[0.01,0],[0.08,0.04],[-0.17,0.05]]}[sid]
    chk(f'{nm}: plotted positions identical to the saved ones',pts==exp)
  chk('saved sessions not rewritten',pg.evaluate("S.sessions.find(s=>s.id=='p3c').pos.flat().length")==30)
  chk('no page errors',not errs);errs and print(errs)
  b.close()
finally:srv.terminate()
print(len(ok),'ok');print('FAIL',bad) if bad else print('all pass');sys.exit(1 if bad else 0)
