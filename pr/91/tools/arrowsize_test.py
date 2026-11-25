# Arrow size drawn to scale (30 Oct 2026, Nathe: "We need to choose arrow size. Because I'm shooting 23s and the target should not be touching X
# from outside of the 10. If someone was shooting 27s it would. And if someone was shooting thin arrows it would be inside the lines with gaps").
# Throwaway test profile in a test browser only (no network). Checks:
#  - WA 40cm face geometry: 10 ring 4 cm across (radius 20 mm), X 2 cm (radius 10 mm), 200 mm per face radius unit;
#  - a 23 (23/64 in = 9.13 mm) touching the 10 line from inside leaves a gap to the X line; a 27 (10.72 mm) in the same place crosses it;
#    a thin shaft (X10 Parallel Pro 4mm 610, Easton O.D. .218 in = 5.54 mm) centred in the 10 band has gaps both sides;
#  - the drawn circles (plot card, three-spot strip, scoring face) have exactly that radius;
#  - the default comes from the arrow set chosen in My arrows (SuperDrive 23); a new shoot locks it in s.arrowD with s.lcT=1;
#  - the size is picked on the scoring screen before the first arrow only, then shown as text; the Past sessions card shows it as text;
#  - older shoots (no lcT) have no picker and draw at the old line-cutter size; nothing about them is saved or changed.
import subprocess,sys,time,os,json,re,math
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH=os.environ.get('SHOTS','/tmp/shots-arrowsize');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
PORT=int(os.environ.get("PORT","8973"))
BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get('BASE') else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
IN=25.4;D23=23/64*IN;D27=27/64*IN;DT=.218*IN
r23=D23/2/200;r27=D27/2/200;rT=DT/2/200
# spot-unit positions (1 = full face radius = 200 mm): 23 touching the 10 line from inside, the X centre, 27 touching the 10 line from inside, thin centred in the band
POS=[(0.1-r23,0),(0,0),(0.1-r27,0),(0.075,0),(-0.03,0.02),(0.0,-0.06),(0.02,0.03),(-0.05,-0.02),(0.04,0.0)]
SEED=r"""(P)=>{const L=BUGC;S.sessions=(S.sessions||[]).filter(s=>!/^az/.test(s.id));
 S.arrowSets=(S.arrowSets||[]).filter(a=>!/^aztest/.test(a.id));S.arrowSets.push({id:'aztest23',archer:S.profile,name:'Indoor 23s',shaft:'Easton SuperDrive 23',spine:'375'},{id:'aztestx10',archer:S.profile,name:'Outdoor',shaft:'Easton X10 Parallel Pro',spine:'610'});
 S.arrowSel=S.arrowSel||{};S.arrowSel[S.profile]='aztest23';
 const R=ROUNDS['Australian Indoor 18m'],F=face3R(faceR(R,0),{face3:'vert'}),Q=P.map((p,i)=>{const c=L[i%3];return{x:+(c[0]+0.6*p[0]).toFixed(6),y:+(c[1]+0.6*p[1]).toFixed(6)}});
 const mk=(id,D,date)=>{const s={id,date,round:'Australian Indoor 18m',face3:'vert',ends:[],pos:[],finished:true,note:''};if(D)Object.assign(s,{lcT:1,arrowD:D});
  for(let e=0;e<3;e++){const E=Q.slice(e*3,e*3+3);s.pos.push(E);s.ends.push(E.map(p=>plotScore(p.x,p.y,F,arrowLC(F,s))))}S.sessions.push(s)};
 mk('az0',null,'2026-10-20');mk('az23',{k:'s23',mm:9.128},'2026-10-29');mk('az27',{k:'s27',mm:10.716},'2026-10-28');mk('azthin',{k:'x4-610',mm:5.537},'2026-10-27');save()}"""
errs=[]
def card_r(pg):
    return pg.evaluate("(()=>{const c=[...document.querySelectorAll('.shcard .shclean circle[fill-opacity]')];return c.map(e=>+e.getAttribute('r')+ +e.getAttribute('stroke-width')/2)})()")
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  for theme in ('light','dark'):
   ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2);pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
   pg.goto(BASE+'?tester=steven');pg.wait_for_timeout(1200)
   pg.evaluate("S.unlocked=true;save()");pg.evaluate(f"localStorage.setItem('scoretool.theme','{theme}')");pg.evaluate(SEED,POS);pg.reload();pg.wait_for_timeout(1800)
   t=theme+' '
   chk(t+'WA 40cm face: 10 ring radius 0.1 = 20 mm, X radius 0.05 = 10 mm',pg.evaluate("arrowRU({face:'40cm'},40,0)")==0.1 and pg.evaluate("arrowRU({face:'40cm'},20,0)")==0.05)
   s0=pg.evaluate("JSON.stringify(S.sessions.filter(s=>/^az/.test(s.id)))")
   # default from My arrows
   chk(t+'default size from My arrows (SuperDrive 23 = 9.13 mm)',abs(pg.evaluate("arrowMM(null)")-D23)<1e-6 and pg.evaluate("arrowKey(null)")=='aztest23')
   chk(t+'X10 Parallel Pro 610 set reads its Easton O.D. (5.54 mm)',abs(pg.evaluate("setArrowMM({shaft:'Easton X10 Parallel Pro',spine:'610'})")-DT)<1e-6)
   chk(t+'X23s / SuperDrive 27 names read as 64ths',abs(pg.evaluate("setArrowMM({name:'Indoor X23s'})")-D23)<1e-6 and abs(pg.evaluate("setArrowMM({shaft:'SuperDrive 27'})")-D27)<1e-6 and pg.evaluate("setArrowMM({name:'Arrows 1',spine:'600'})") is None)
   ops=pg.evaluate("arrowOpts().map(o=>o[0])")
   chk(t+'catalogue sizes stay available for My arrows (27 down to 19, thin shafts)',all('s%d'%n in ops for n in (27,26,25,24,23,22,20,19)) and 'x4-610' in ops and 'x32-600' in ops)
   rs=pg.evaluate("shotPts(S.sessions.find(s=>s.id=='az23')).target.map(p=>p.r)")
   chk(t+f'new shoot: plot radius = true 23 radius ({r23:.5f})',len(rs)==9 and all(abs(r-r23)<1e-3*r23 for r in rs))
   rs=pg.evaluate("shotPts(S.sessions.find(s=>s.id=='az0')).target.map(p=>p.r)")
   chk(t+'older shoot: plot radius = the old 3-spot line-cutter size (0.035) it was scored with',len(rs)==9 and all(r==0.035 for r in rs))
   # geometry: 23 touching the 10 line from inside does not reach the X line; 27 in the same place does; thin centred has gaps
   g23=(0.1-r23)-r23-0.05;g27=(0.1-r27)-r27-0.05;gT=min(0.075-rT-0.05,0.1-(0.075+rT))
   chk(t+f'23 on the 10 line from inside: {g23*200:.2f} mm gap to the X line',g23>0)
   chk(t+f'27 on the 10 line from inside: crosses the X line by {-g27*200:.2f} mm',g27<0)
   chk(t+f'thin shaft centred in the 10: {gT*200:.2f} mm gap each side',gT>0)
   chk(t+'23 just outside the 10 (edge on the line) is far from the X',(0.1+r23)-r23-0.05>0)
   # through the app: Past sessions > Open
   for sid,exp,nm in (('az23',r23,'23'),('az27',r27,'27'),('azthin',rT,'thin-x10-610')):
    pg.evaluate("cur=null;nav('score')");pg.wait_for_timeout(500)
    pg.locator(f'[data-open={sid}]').scroll_into_view_if_needed();pg.locator(f'[data-open={sid}]').tap();pg.wait_for_timeout(800)
    chk(t+f'{nm}: card shows the size as text, no picker',pg.locator('.shcard select').count()==0 and 'Arrow size' in (pg.locator('.shcard .shsz').first.inner_text() or '') and 'drawn and scored at this size' in pg.locator('.shcard .shsz').first.inner_text())
    cr=card_r(pg)
    chk(t+f'{nm}: plot card circles drawn at the true radius',len(cr)==9 and all(abs(x-exp)<2e-4 for x in cr))
    sr=pg.evaluate("[...document.querySelectorAll('.shcard .shspotsvg circle[fill-opacity]')].map(e=>+e.getAttribute('r')+ +e.getAttribute('stroke-width')/2)")
    chk(t+f'{nm}: three-spot strip circles at the true radius',len(sr)==9 and all(abs(x-exp*0.6)<2e-4 for x in sr))
    pg.locator('.shcard .shclean').first.scroll_into_view_if_needed();pg.wait_for_timeout(150)
    pg.locator('.shcard .shclean').first.screenshot(path=f'{SH}/{theme}-{nm}-face.png')
    pg.locator('.shcard .shspotsvg').first.screenshot(path=f'{SH}/{theme}-{nm}-strip.png')
    sv=pg.evaluate("(()=>{const c=document.querySelector('.shcard .shclean').cloneNode(true);c.setAttribute('viewBox','-0.125 -0.125 0.25 0.25');c.setAttribute('width','360');c.setAttribute('height','360');c.setAttribute('style','width:360px;height:360px;display:block');return c.outerHTML})()")
    zp=ctx.new_page();zp.set_content(f'<meta name="viewport" content="width=device-width"><body style="margin:0;background:#fff">{sv}<p style="font:14px sans-serif;margin:4px">{nm}: 10 ring and X, 40cm face, to scale</p></body>');zp.screenshot(path=f'{SH}/{theme}-{nm}-zoom10.png',clip={'x':0,'y':0,'width':360,'height':390});zp.close()
    if theme=='light' and sid=='az23':pg.locator('.shcard').first.screenshot(path=f'{SH}/{theme}-card.png')
   pg.evaluate("cur=null;nav('score')");pg.wait_for_timeout(500)
   pg.locator('[data-open=az0]').scroll_into_view_if_needed();pg.locator('[data-open=az0]').tap();pg.wait_for_timeout(800)
   chk(t+'older shoot card: no picker, says it is drawn at the line-cutter size that scored it',pg.locator('.shcard select').count()==0 and 'line-cutter size that scored them' in pg.locator('.shcard .shsz').first.inner_text())
   cr=pg.evaluate("[...document.querySelectorAll('.shcard .shclean circle[fill-opacity]')].map(e=>+e.getAttribute('r'))")
   chk(t+f'older shoot card circles drawn exactly as before (r 0.035) {cr[:2]}',len(cr)==9 and all(x==0.035 for x in cr))
   if theme=='light':pg.locator('.shcard').first.screenshot(path=f'{SH}/{theme}-card-older.png')
   chk(t+'viewing saved shoots changed nothing in them',pg.evaluate("JSON.stringify(S.sessions.filter(s=>/^az/.test(s.id)))")==s0)
   chk(t+'no overflow',pg.evaluate('document.documentElement.scrollWidth<=innerWidth'))
   # scoring face: a new 3-spot shoot draws its arrows at the true 23 radius, and has the picker
   pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(500);pg.select_option('#rd','Australian Indoor 18m');pg.wait_for_timeout(300)
   if pg.locator('#f3row [data-f3=vert]').count():pg.click('#f3row [data-f3=vert]')
   pg.click('#st');pg.wait_for_timeout(800)
   chk(t+'new shoot: lcT set, size locked from My arrows (23)',pg.evaluate("cur.lcT===1&&cur.arrowD.k=='aztest23'&&Math.abs(cur.arrowD.mm-9.128)<0.001"))
   chk(t+'scoring screen lists the saved arrow, not a catalogue size',pg.locator('select[data-arrowsz=cur]').count()==1 and pg.locator('select[data-arrowsz=cur]').input_value()=='aztest23' and not any('/64' in t or t.startswith('Custom') for t in pg.locator('select[data-arrowsz=cur] option').all_inner_texts()))
   pg.locator('select[data-arrowsz=cur]').select_option('aztestx10');pg.wait_for_timeout(400)
   chk(t+'picking the saved X10 before the first arrow sets this shoot to its outside diameter',pg.evaluate("cur.arrowD.k=='aztestx10'&&Math.abs(cur.arrowD.mm-5.537)<0.001"))
   pg.evaluate("putArrow('X',{x:BUGC[1][0],y:BUGC[1][1]})");pg.wait_for_timeout(400)
   fr=pg.evaluate("[...document.querySelectorAll('#pface circle[fill=\"#22c55e\"]')].map(e=>+e.getAttribute('r')+ +e.getAttribute('stroke-width')/2)")
   chk(t+f'scoring face arrow at the true X10 radius ({rT*0.6:.5f}) {fr}',len(fr)>=1 and all(abs(x-rT*0.6)<2e-4 for x in fr))
   chk(t+'after the first arrow the size is fixed: no picker, shown as text',pg.locator('select[data-arrowsz=cur]').count()==0 and pg.locator('.arrowsz').count()>=1 and 'Outdoor' in pg.locator('.arrowsz').first.inner_text())
   if theme=='light':pg.locator('#fwrap').screenshot(path=f'{SH}/{theme}-scoring-27.png')
   pg.evaluate("cur=null");ctx.close()
  b.close()
finally:
  srv and srv.terminate()
chk('no page errors',not errs);errs and print(errs)
print(f'{len(ok)} passed, {len(bad)} failed')
