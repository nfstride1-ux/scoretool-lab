# Colour-blind safe mode: on by default for ?tester=nate, off for Nathe; Settings tick switches it; face marks white (not green),
# plotted arrows show their score, trend indicators carry arrows/signs. Saves 390x844 screenshots to /workspace/nate-colourblind if it exists.
import subprocess,sys,time,os
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT='/workspace/nate-colourblind';SHOT=os.path.isdir(OUT)
srv=subprocess.Popen([sys.executable,'-m','http.server','8779'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
SEED="""(()=>{if(!S.profile)S.profile='Nate Evans';S.unlocked=true;const R='WA 720 (70m)';let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 S.sessions=S.sessions.filter(x=>!/^cbt/.test(x.id));
 for(let n=0;n<6;n++){const sp=0.42-n*0.05,ends=[],pos=[];for(let e=0;e<12;e++){const E=[],P=[];for(let a=0;a<6;a++){const r=Math.sqrt(rnd())*sp,t=rnd()*6.283,xy={x:+(r*Math.cos(t)).toFixed(3),y:+(r*Math.sin(t)).toFixed(3)};E.push(plotScore(xy.x,xy.y,{}));P.push(xy)}ends.push(E);pos.push(P)}
  S.sessions.push({id:'cbt'+n,date:'2026-0'+(4+n)+'-1'+n,round:R,ends,pos,note:'',finished:true})}save()})()"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  errs=[]
  def open_as(tid):
    ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(f'{tid}: {e}'));pg.on('console',lambda m:m.type=='error' and errs.append(f'{tid}: {m.text}'));pg.on('dialog',lambda d:d.accept())
    pg.goto(f'http://localhost:8779/?tester={tid}');pg.wait_for_timeout(1200);pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Tester';save()");pg.reload();pg.wait_for_timeout(2500);return ctx,pg
  # Nathe: unchanged
  ctx,pg=open_as('nathe');E=pg.evaluate
  chk('Nathe: mode off by default',E("CB()")==False and not E("document.body.classList.contains('cb')"))
  E("nav('me')");pg.wait_for_timeout(400)
  chk('Settings has the colour-blind tick, unticked for Nathe',pg.locator('#cbsafe').count()==1 and not pg.is_checked('#cbsafe') and 'Colour-blind safe colours' in pg.inner_text('#settingscard'))
  chk('Nathe: arrow dots stay green, no numbers',E("faceSVG([{x:.1,y:.1}],'t','-1 -1 2 2',{face:'122cm full'})").count('#22c55e')==1 and '<text' not in E("faceSVG([{x:.1,y:.1}],'t','-1 -1 2 2',{face:'122cm full'})"))
  chk('Nathe: face marks stay bright green',E("faceHi('<path stroke=\"#39ff14\" stroke-width=\"0.01\"/>')").count('#39ff14')==1)
  pg.check('#cbsafe');pg.wait_for_timeout(200)
  chk('tick turns it on for anyone and saves',E("CB()&&S.cb===true&&document.body.classList.contains('cb')"))
  pg.uncheck('#cbsafe');pg.wait_for_timeout(200)
  chk('untick turns it back off',E("!CB()&&S.cb===false&&!document.body.classList.contains('cb')"))
  E("delete S.cb;save()");ctx.close()
  # Nate: on by default
  ctx,pg=open_as('nate');E=pg.evaluate;E(SEED);pg.reload();pg.wait_for_timeout(2500)
  chk('Nate: mode on by default',E("CB()") and E("document.body.classList.contains('cb')") and E("S.cb")==None)
  E("nav('me')");pg.wait_for_timeout(400);chk('Nate: Settings tick shows ticked',pg.is_checked('#cbsafe'))
  svg=E("faceSVG([{x:0,y:0.02,k:'X'},{x:.25,y:.1},{x:.62,y:0},{x:.9,y:0,sel:1}],'t','-1 -1 2 2',{face:'122cm full'})")
  chk('Nate: arrow dots white with black outline and score number',('#22c55e' not in svg) and svg.count('<text')==4 and '>X</text>' in svg and '>8</text>' in svg and '>5</text>' in svg and '>2</text>' in svg)
  fs=E("faceSVG([{x:.05,y:0},{x:.5,y:0}],'t','-1 -1 2 2',{face:'80cm field'})")
  chk('Nate: field face arrows numbered, face still gold and black only',('>6</text>' in fs or '>5</text>' in fs) and '>3</text>' in fs and set(__import__('re').findall(r'circle r="[^"]*" fill="([^"]*)"',fs))<={'#ffd84d','#111'})
  hi=E("faceHi('<path stroke=\"#39ff14\" stroke-width=\"0.01\"/>')")
  chk('Nate: face marks not green (white with dark outline)','#39ff14' not in hi and '#ffffff' in hi and '#0b0f17' in hi)
  chk('Nate: face mark colour and up/down CSS not green/red',E("String(FM)")=='#ffffff' and E("(()=>{const a=document.createElement('b');a.className='up';document.body.append(a);const c=getComputedStyle(a).color;a.className='dn';const d=getComputedStyle(a).color;a.remove();return c+'|'+d})()")=='rgb(90, 176, 255)|rgb(255, 159, 26)')
  # Score screen with plotted arrows
  E("nav('score')");pg.wait_for_timeout(400);E("cur=null;sv='sheet';score()");pg.wait_for_timeout(300)
  if SHOT:pg.screenshot(path=OUT+'/1-score-start.png')
  pg.select_option('#rd','WA 720 (70m)');pg.click('#st');pg.wait_for_timeout(500)
  bx=pg.locator('#pface').bounding_box();cx=bx['x']+bx['width']/2;cy=bx['y']+bx['height']/2;u=bx['height']/2.08
  for dx,dy in [(0.03,0),(0.33,-0.1),(-0.55,0.25),(0.1,0.75),(-0.2,-0.42),(0.05,0.15)]:
    pg.mouse.click(cx+dx*u,cy+dy*u);pg.wait_for_timeout(250)
  E("sv='entry';score()");pg.wait_for_timeout(400)
  t=[x.text_content() for x in pg.locator('#pface text').all()];chips=[x.strip() for x in pg.locator('.ad-chips .adb').all_inner_texts()]
  chk('Nate scorer: each plotted arrow shows its score, matching the chips '+str(t)+str(chips),len(t)==6 and sorted(t)==sorted(chips))
  chk('Nate scorer: no green on the face',('#22c55e' not in pg.inner_html('#fwrap')) and ('#39ff14' not in pg.inner_html('#fwrap')))
  pg.locator('.ad-chips .adb').first.click();pg.wait_for_timeout(300)
  chk('Nate scorer: selected arrow ring is white, not green','stroke="#fff"' in pg.inner_html('#pface') and '#39ff14' not in pg.inner_html('#pface'))
  if SHOT:pg.screenshot(path=OUT+'/2-target-face-plotted.png')
  chk('keypad still fully on screen',pg.locator('.ad-pad').bounding_box()['y']+pg.locator('.ad-pad').bounding_box()['height']<=844)
  E("fix=null;cur=null;sv='sheet';S.sessions=S.sessions.filter(x=>x.ends.flat().length>6||/^cbt/.test(x.id));save()")
  # Stats
  E("nav('stats')");pg.wait_for_timeout(1500)
  if pg.locator('select').count():
    try:pg.select_option('select >> nth=0','WA 720 (70m)');pg.wait_for_timeout(800)
    except Exception:pass
  tr=pg.inner_text('#c-trend')
  chk('Nate Stats: trend shows an arrow/sign ('+tr.replace(chr(10),' ')[:60]+')',any(a in tr for a in ['▲ Going up.','▼ Dipping.','● Steady.']))
  if SHOT:pg.screenshot(path=OUT+'/3-stats-top.png');pg.locator('#c-trend').scroll_into_view_if_needed();E("document.querySelector('#c-trend').scrollIntoView({block:'start'})");pg.wait_for_timeout(300);pg.screenshot(path=OUT+'/4-stats-trend.png');E("document.querySelector('#c-hist').scrollIntoView({block:'start'})");pg.wait_for_timeout(300);pg.screenshot(path=OUT+'/5-stats-history-pb-line.png')
  chk('Nate Stats: PB line drawn white, not green',('#16a34a' not in pg.inner_html('#c-hist')) and ('#ffffff' in pg.inner_html('#c-hist').lower()))
  ctx.close()
  # Nathe again: Stats trend has no arrow
  ctx,pg=open_as('nathe');E=pg.evaluate;E("nav('stats')");pg.wait_for_timeout(1500)
  chk('Nathe Stats unchanged: no CB arrows in trend',pg.locator('#c-trend').count()==1 and not any(a in pg.inner_text('#c-trend') for a in ['▲ Going up.','▼ Dipping.','● Steady.']))
  ctx.close()
  chk('no page errors '+str(errs[:3]),not errs)
  b.close()
finally:srv.terminate()
for n in ok:print('PASS',n)
for n in bad:print('FAIL',n)
print(f'colourblind checks: PASS {len(ok)} FAIL {len(bad)}');sys.exit(1 if bad else 0)
