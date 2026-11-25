# Single face for indoor rounds (28 Oct 2026, Nathe: "can you add the single face for those that can't shoot the three spot?").
# Just me, Indoor WA 18m / 25m / Combined: Face choice 'Three spot' (default) or 'Single face' (one full face per end, X 10-1 M, plotted and scored on the full face).
# Remembered in S.face1. Vegas 300, match nights, Casual and leagues are unchanged; saved sessions untouched. Throwaway local profile, no network.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.path.abspath(sys.argv[1]) if len(sys.argv)>1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'shots-singleface');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n,flush=True)
PORT=8957;W18='Indoor WA 18m';W25='Indoor WA 25m';AUS='Australian Indoor 18m'
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
def to_score(pg):pg.evaluate("cur=null;sv='sheet';window._csv=null;nav('score')");pg.wait_for_timeout(400)
def plot(pg,pts):
  for x,y in pts:
    q=pg.evaluate("([x,y])=>{const sv=document.querySelector('#pface'),p=sv.createSVGPoint();p.x=x;p.y=y;const r=p.matrixTransform(sv.getScreenCTM());return[r.x,r.y]}",[x,y])
    pg.mouse.click(q[0],q[1]);pg.wait_for_timeout(250)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
  ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(f'http://localhost:{PORT}') else r.abort())
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(f'http://localhost:{PORT}/?tester=steven');pg.wait_for_timeout(1200)
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Steven';save()");pg.reload();pg.wait_for_timeout(1800)
  S0=json.loads(pg.evaluate("localStorage.getItem(KEY)"));old=S0.get('sessions') or []
  chk('default: nobody has the single face flag, light theme',not S0.get('face1') and pg.evaluate("document.documentElement.getAttribute('data-theme')")=='light')
  # ---------- rounds that offer it ----------
  offer=pg.evaluate("Object.keys(ROUNDS).filter(r=>f3One(r))");print('offered on',offer)
  chk('offered on Indoor WA 18m, 25m and Combined only',sorted(offer)==sorted([W18,W25,'Indoor WA Combined 25m + 18m']))
  chk('not on Vegas 300, Vegas 300 (18 m), Australian Indoor (own 3-way pick), field, target',not any(pg.evaluate(f"f3One('{r}')") for r in ['Vegas 300','Vegas 300 (18 m)',AUS,'WA Field 24 Marked','WA 720 (70m)']))
  # ---------- Just me start screen ----------
  to_score(pg);pg.select_option('#rd',W18);pg.wait_for_timeout(300)
  lab=pg.evaluate("[...document.querySelectorAll('#f3row [data-f1]')].map(b=>b.dataset.f1+'='+b.textContent)");print('picker',lab)
  chk('WA 18m: Face = Three spot | Single face',lab==['three=Three spot','single=Single face'])
  chk('default stays Three spot',pg.locator('#f3row [data-f1=three].on').count()==1 and pg.locator('#f3row [data-f1=single].on').count()==0)
  pg.evaluate("document.querySelector('#rd').closest('.card').scrollIntoView({block:'start'})");pg.wait_for_timeout(200)
  pg.screenshot(path=f'{SH}/picker-default-390.png')
  pg.select_option('#rd','Vegas 300');pg.wait_for_timeout(200);chk('Vegas 300: no face choice',pg.inner_html('#f3row')=='')
  pg.select_option('#rd','WA Field 24 Marked');pg.wait_for_timeout(200);chk('Field: no face choice',pg.locator('#f3row [data-f1]').count()==0)
  pg.select_option('#rd',AUS);pg.wait_for_timeout(200);chk('Australian Indoor keeps its own 3-way pick',pg.locator('#f3row [data-f3]').count()==3 and pg.locator('#f3row [data-f1]').count()==0)
  pg.select_option('#rd',W18);pg.wait_for_timeout(200)
  # default start still three-spot
  pg.click('#st');pg.wait_for_timeout(800)
  chk('default start: three-spot session (as before)',pg.evaluate("cur.face3")=='vert' and pg.evaluate("use3(cur,ROUNDS[cur.round],faceR(ROUNDS[cur.round],0))"))
  chk('default start: Indoor WA 18m keys 10 9 8 7 6 M, no X',pg.evaluate("[...document.querySelectorAll('.ad-pad [data-k]')].map(b=>b.dataset.k).join(' ')")=='10 9 8 7 6 M')
  chk('default start: face button says Vertical 3-spot',pg.inner_text('#face3').strip()=='Face: Vertical 3-spot')
  # before plotting the button cycles vert > vegas > single > vert
  seq=[]
  for i in range(4):
    pg.click('#face3');pg.wait_for_timeout(250);seq.append(pg.evaluate("cur.face3"))
  print('cycle',seq);chk('in-scoring Face button cycles vegas, single, vert, vegas',seq==['vegas','single','vert','vegas'])
  chk('cycling did not store single as the 3-spot layout',pg.evaluate("S.face3")=='vegas' and pg.evaluate("S.face1")==False)
  pg.click('#face3');pg.wait_for_timeout(250);pg.click('#face3');pg.wait_for_timeout(250)  # single, vert
  pg.click('#face3');pg.wait_for_timeout(250)  # vegas
  pg.evaluate("S.face3='vert';S.face1=false;save()")
  # drop this empty practice session so it does not clutter
  pg.evaluate("S.sessions=S.sessions.filter(x=>x.id!=cur.id);cur=null;save()")
  # ---------- pick Single face ----------
  to_score(pg);pg.select_option('#rd',W18);pg.wait_for_timeout(300)
  pg.click('#f3row [data-f1=single]');pg.wait_for_timeout(250)
  chk('Single face picked and remembered',pg.locator('#f3row [data-f1=single].on').count()==1 and pg.evaluate("S.face1")==True)
  pg.evaluate("document.querySelector('#rd').closest('.card').scrollIntoView({block:'start'})");pg.wait_for_timeout(200)
  pg.screenshot(path=f'{SH}/picker-single-390.png')
  pg.click('#st');pg.wait_for_timeout(800)
  chk('session is on the single face',pg.evaluate("cur.face3")=='single' and not pg.evaluate("use3(cur,ROUNDS[cur.round],faceR(ROUNDS[cur.round],0))"))
  chk('face button names it',pg.inner_text('#face3').strip()=='Face: Single face')
  chk('single face keys are still 10 9 8 7 6 M, no X and no 5 to 1',pg.evaluate("[...document.querySelectorAll('.ad-pad [data-k]')].map(b=>b.dataset.k).join(' ')")=='10 9 8 7 6 M')
  chk('one face drawn (no spot buttons, one circle set, 40cm face)',pg.locator('[data-spot]').count()==0 and pg.evaluate("faceR(ROUNDS[cur.round],0).face")=='40cm' and not pg.evaluate("indoor3(ROUNDS[cur.round],faceR(ROUNDS[cur.round],0))&&use3(cur,ROUNDS[cur.round],faceR(ROUNDS[cur.round],0))"))
  chk('face size text says 40cm',pg.inner_text('#facesize').strip().startswith('40cm'))
  # plot three arrows on the one face: centre, 10-ish ring, outer
  pts=[(0,0),(0.12,0.05),(-0.6,0.45)]
  plot(pg,pts);e0=pg.evaluate("cur.ends[0]");print('single end',e0)
  want=pg.evaluate("pts=>pts.map(([x,y])=>plotScore(x,y,Object.assign({},faceR(ROUNDS[cur.round],0),{wa18:true,inner10:!!cur.inner10})))",[list(q) for q in pts])
  chk('three arrows scored with the Indoor WA 18 m ring values',len(e0)==3 and e0==want)
  chk('no X is scored, and outside the 6 is M', 'X' not in e0 and 'M' in e0)
  chk('plotted positions are on the full face (not per spot)',pg.evaluate("shotPts(cur).target.every(p=>p.k=='full')"))
  chk('face button locks once an arrow is plotted',pg.evaluate("document.querySelector('#face3').disabled"))
  chk('end total matches the end on screen',pg.evaluate("""()=>{const shown=document.querySelector('.ad-num b').textContent.trim();const m=document.querySelector('#endno').textContent.match(/End (\\d+)/);const ei=m?+m[1]-1:0;return shown===String(endSum(cur.ends[ei]||[]))}"""))
  # zoom as other single faces
  pg.evaluate("scrollTo(0,0)");pg.wait_for_timeout(200)
  zc=pg.locator('#zcycle');chk('zoom button present',zc.count()==1)
  zc.click();pg.wait_for_timeout(250);k1=pg.evaluate("PZ.k");zc.click();pg.wait_for_timeout(250);k2=pg.evaluate("PZ.k")
  chk('zoom steps up on the single face (Z1, Z2)',k1>1 and k2>k1)
  zc.click();pg.wait_for_timeout(250);chk('zoom resets',pg.evaluate("PZ.k")==1)
  pg.evaluate("scrollTo(0,0)");pg.wait_for_timeout(200);pg.screenshot(path=f'{SH}/scoring-single-390.png')
  # finish the 10... play 2 more ends with keys, then save/history
  sid=pg.evaluate("cur.id")
  if pg.locator('#enext').is_enabled():
    pg.click('#enext');pg.wait_for_timeout(400);pg.click('text=Add Scores');pg.wait_for_timeout(400)
  for k in ['10','9','6']:pg.click(f'.ad-pad [data-k="{k}"]');pg.wait_for_timeout(120)
  e1=pg.evaluate("cur.ends.filter(e=>e.length).slice(-1)[0]");chk('keys score 10, 9 and 6, with no X',e1==['10','9','6'])
  tot=pg.evaluate("cur.ends.reduce((t,e)=>t+endSum(e),0)")
  want_tot=sum(({'X':10,'M':0}.get(str(v),None) if str(v) in 'XM' else int(v)) for e in pg.evaluate("cur.ends") for v in e)
  chk('total = sum of ring values (X = 10)',tot==want_tot)
  # saved session and history
  to_score(pg)
  sess=pg.evaluate(f"S.sessions.find(x=>x.id=='{sid}')")
  chk('saved: session stores face3 single and plotted positions',sess['face3']=='single' and any(sess['pos'][0]))
  chk('saved: totals unchanged after reload',pg.evaluate(f"(()=>{{const s=S.sessions.find(x=>x.id=='{sid}');return s.ends.reduce((t,e)=>t+endSum(e),0)}})()")==tot)
  pg.reload();pg.wait_for_timeout(1500)
  chk('remembered after reload',pg.evaluate("S.face1")==True)
  to_score(pg);pg.select_option('#rd',W18);pg.wait_for_timeout(300)
  chk('picker opens on Single face next time',pg.locator('#f3row [data-f1=single].on').count()==1)
  # ---------- ghost: a 3-spot past score vs a single face today ----------
  pg.evaluate("S.sessions.push({id:'sghost3',date:'2026-10-01',round:'Indoor WA 18m',ends:Array.from({length:10},()=>['10','9','9']),pos:Array.from({length:10},()=>[]),note:'',face3:'vert',finished:true});S.face1=true;save()")
  to_score(pg);pg.select_option('#rd',W18);pg.wait_for_timeout(300)
  pg.check('#ghon');pg.click('[data-gm=pick]');pg.wait_for_timeout(200);pg.select_option('#ghwho','s:sghost3');pg.wait_for_timeout(100)
  pg.click('#st');pg.wait_for_timeout(700);g=pg.evaluate("cur&&cur.ghost");print('ghost',g and g.get('note'))
  chk('ghost note: past 3-spot vs single face today',bool(g) and 'Different face: shot on the 3-spot face, you are on the single face.' in (g.get('note') or '') and not g.get('pos'))
  pg.evaluate("S.sessions=S.sessions.filter(x=>x.id!=cur.id&&x.id!='sghost3');cur=null;save()")
  # ---------- back to Three spot ----------
  to_score(pg);pg.select_option('#rd',W18);pg.wait_for_timeout(300);pg.click('#f3row [data-f1=three]');pg.wait_for_timeout(250)
  chk('Three spot picked again',pg.evaluate("S.face1")==False and pg.locator('#f3row [data-f1=three].on').count()==1)
  pg.click('#st');pg.wait_for_timeout(800);chk('three-spot session again',pg.evaluate("cur.face3")=='vert');pg.evaluate("S.sessions=S.sessions.filter(x=>x.id!=cur.id);cur=null;save()")
  # ---------- 25 m uses the 60 cm face ----------
  to_score(pg);pg.select_option('#rd',W25);pg.wait_for_timeout(300);pg.click('#f3row [data-f1=single]');pg.wait_for_timeout(250);pg.click('#st');pg.wait_for_timeout(800)
  chk('25 m single face is the 60cm full face',pg.evaluate("cur.face3")=='single' and pg.inner_text('#facesize').strip().startswith('60cm'))
  plot(pg,[(0,0),(0.3,0.3),(0.7,-0.2)]);e=pg.evaluate("cur.ends[0]");chk('25 m single face scores 3 arrows, centre 10, no X',len(e)==3 and e[0]=='10' and 'X' not in e)
  pg.evaluate("S.sessions=S.sessions.filter(x=>x.id!=cur.id);cur=null;S.face1=false;save()")
  # ---------- Vegas 300 and match nights unchanged ----------
  to_score(pg);pg.select_option('#rd','Vegas 300');pg.wait_for_timeout(300);pg.click('#st');pg.wait_for_timeout(800)
  chk('Vegas 300 stays on the Vegas 3-spot',pg.evaluate("cur.face3")=='vegas')
  pg.evaluate("S.sessions=S.sessions.filter(x=>x.id!=cur.id);cur=null;save()")
  chk('match-night / head-to-head rows do not offer it',pg.evaluate("f3Row('Indoor WA 18m')")=='' and pg.evaluate("f3Pref('Indoor WA 18m')")!='single')
  pg.evaluate("S.face1=true;save()")
  chk('even with single remembered, f3Pref (used by match nights) stays a 3-spot',pg.evaluate("f3Pref('Indoor WA 18m')")!='single')
  # ---------- existing sessions untouched ----------
  S1=json.loads(pg.evaluate("localStorage.getItem(KEY)"));ids={s['id'] for s in old}
  chk('existing sessions unchanged',[s for s in S1['sessions'] if s['id'] in ids]==old)
  chk('no purple in the new row',pg.evaluate("!/purple|#[89a-f][0-9a-f]00[bcdef][0-9a-f]/i.test(document.querySelector('#app').innerHTML)"))
  chk('no page errors',not errs);errs and print(errs)
  b.close()
finally:srv.terminate()
print(len(ok),'ok');print('FAIL',bad[:30],len(bad)) if bad else print('all pass');sys.exit(1 if bad else 0)
