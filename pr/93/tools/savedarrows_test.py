# Arrow size is the archer's saved arrows only (17 Nov 2026, Nathe: "Only show the list of saved arrows").
# Just me, a custom round, a field round, a one-archer league week and a one-archer casual shoot.
# The dropdown is the arrow name plus its diameter. The bow's chosen set is preselected, else the last shoot.
# With none saved, one note links to My arrows and plotting stays on the usual 23. The shaft tables stay for My arrows.
import os,sys,subprocess,time,shutil
from playwright.sync_api import sync_playwright
import guard
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH=os.environ.get('SHOTS','/tmp/shots-savedarrows');os.makedirs(SH,exist_ok=True)
ART='/opt/cursor/artifacts';os.makedirs(ART,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n,flush=True)
PORT=os.environ.get('PORT','8981')
srv=subprocess.Popen([sys.executable,'-m','http.server',PORT],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.8)
IN=25.4;D23=23/64*IN;DT=.218*IN
SEED=r"""()=>{const me=S.profile;
 S.arrowGone=S.arrowGone||{};S.arrowGone[me]={arrows1:1};
 S.arrowSets=(S.arrowSets||[]).filter(a=>a.archer!=me);
 S.arrowSets.push({id:'azA',archer:me,name:'Indoor 23s',shaft:'Easton SuperDrive 23',spine:'375'},{id:'azB',archer:me,name:'Outdoor X10',shaft:'Easton X10 Parallel Pro',spine:'610'});
 S.arrowSel={};delete S.arrowSel[me];
 S.sessions=(S.sessions||[]).filter(s=>s.id!='azprev');
 S.sessions.push({id:'azprev',date:'2026-11-01',round:'Australian Indoor 18m',face3:'vert',ends:[['X']],pos:[[{x:0,y:0}]],finished:true,note:'',lcT:1,arrowD:{k:'azA',mm:9.128}});
 S.customRounds=[{name:'Shed 18',disc:'indoor',ape:3,xs:true,blocks:[{dist:18,unit:'m',size:40,type:'3-spot',ends:4}]}];
 save()}"""
def opts(pg):
    return pg.locator('select[data-arrowsz] option').all_inner_texts()
def generic(rows):
    return any('/64' in t or 'spine' in t or t.startswith('Custom') or t in [f'{n} mm' for n in range(4,10)] for t in rows)
errs=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
  pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(f'http://127.0.0.1:{PORT}/?tester=steven');pg.wait_for_timeout(1200)
  pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Steven';save()")
  pg.evaluate(SEED);pg.reload();pg.wait_for_timeout(1500)
  def start(name):
    pg.evaluate("cur=null;sv='sheet';fldHold=null;if(view!='score')nav('score');else score()");pg.wait_for_timeout(400)
    pg.select_option('#rd',name);pg.click('#st');pg.wait_for_timeout(700)
  start('Australian Indoor 18m')
  rows=opts(pg)
  chk('no bow choice yet: last shoot\'s arrow is selected',pg.locator('select[data-arrowsz=cur]').input_value()=='azA')
  chk('dropdown is only the two saved arrows, name and diameter',rows==['Indoor 23s (9.13 mm)','Outdoor X10 (5.54 mm)'])
  chk('no catalogue sizes and no custom millimetres',not generic(rows))
  pg.evaluate("S.arrowSel[S.profile]='azB';save()")
  start('Australian Indoor 18m')
  chk('bow\'s chosen set is preselected over the last shoot',pg.locator('select[data-arrowsz=cur]').input_value()=='azB' and abs(pg.evaluate('cur.arrowD.mm')-DT)<0.001 and pg.evaluate('cur.arrowD.k')=='azB')
  pg.evaluate("""()=>{const s=document.querySelector('select[data-arrowsz]');s.size=s.options.length;s.style.height='auto';s.style.width='100%';s.style.maxWidth='100%'}""")
  pg.locator('select[data-arrowsz]').scroll_into_view_if_needed();pg.wait_for_timeout(200)
  box=pg.locator('select[data-arrowsz]').bounding_box()
  pg.screenshot(path=os.path.join(SH,'dropdown-390.png'),clip={'x':0,'y':0,'width':390,'height':844})
  if box:
    top=max(0,box['y']-36);h=min(844-top,box['height']+80)
    pg.screenshot(path=os.path.join(ART,'arrow-size-dropdown-390.png'),clip={'x':0,'y':top,'width':390,'height':h})
  else:
    shutil.copy(os.path.join(SH,'dropdown-390.png'),os.path.join(ART,'arrow-size-dropdown-390.png'))
  pg.evaluate("""()=>{const s=document.querySelector('select[data-arrowsz]');s.size=0;s.style.height='';s.style.width='';s.style.maxWidth=''}""")
  pg.locator('select[data-arrowsz=cur]').select_option('azA');pg.wait_for_timeout(400)
  chk('picking Indoor 23s stores its diameter',pg.evaluate("cur.arrowD.k=='azA'&&Math.abs(cur.arrowD.mm-9.128)<0.001"))
  pg.evaluate("putArrow('X',{x:BUGC[1][0],y:BUGC[1][1]})");pg.wait_for_timeout(400)
  r23=D23/2/200*0.6
  fr=pg.evaluate("[...document.querySelectorAll('#pface circle[fill=\"#22c55e\"]')].map(e=>+e.getAttribute('r')+ +e.getAttribute('stroke-width')/2)")
  chk(f'plot dot uses that diameter ({r23:.5f}) {fr}',len(fr)>=1 and all(abs(x-r23)<2e-4 for x in fr))
  chk('after the first plot the list is fixed as text',pg.locator('select[data-arrowsz]').count()==0 and 'Indoor 23s' in pg.locator('.arrowsz').first.inner_text())
  start('Shed 18')
  chk('custom round lists the same saved arrows',opts(pg)==rows and pg.locator('select[data-arrowsz=cur]').input_value()=='azA')
  start('WA Field 24 Marked')
  chk('field round lists the same saved arrows, not 4 mm to 9 mm',opts(pg)==rows)
  pg.evaluate("""()=>{const cs=csCreate({name:'Group plot',round:'Australian Indoor 18m',face3:'vert',self:true,selfF:'three',ppl:[],date:'2026-11-17'});csView(cs.code)}""")
  pg.wait_for_timeout(700)
  chk('one-archer group lists the same saved arrows',pg.locator('select[data-arrowsz]').count()==1 and opts(pg)==rows)
  pg.evaluate("""()=>{const lg=lgCreate('Size league',[],[]);window._lgE={code:lg.code,w:1,ids:[h2hMe()]};window._lgAct=h2hMe();lgView(lg.code)}""")
  pg.wait_for_timeout(800)
  chk('one-archer league lists the same saved arrows',pg.locator('#lgentry select[data-arrowsz]').count()==1 and opts(pg)==rows)
  pg.evaluate("""()=>{S.arrowSets=S.arrowSets.filter(a=>a.archer!=S.profile);S.arrowGone[S.profile]={arrows1:1};S.arrowSel={};save();cur=null;score()}""")
  pg.wait_for_timeout(300)
  start('Australian Indoor 18m')
  chk('no saved arrows: one note',pg.locator('select[data-arrowsz] option').inner_text()=='No saved arrows - add one in My arrows' and pg.locator('select[data-arrowsz]').is_disabled())
  chk('the note links to My arrows',pg.locator('a[data-myarrows]').count()==1 and pg.locator('a[data-myarrows]').inner_text()=='My arrows')
  chk('plotting uses the usual 23',abs(pg.evaluate('cur.arrowD.mm')-D23)<0.001 and pg.evaluate('cur.arrowD.k')=='s23')
  pg.evaluate("document.querySelector('a[data-myarrows]').click()");pg.wait_for_timeout(600)
  opened=pg.evaluate("()=>({v:view,h:(document.querySelector('#app h1')||{}).textContent||''})")
  chk('the link opens My arrows',opened['v']=='lab_myarrows' and opened['h'].strip()=='My arrows')
  if pg.locator('#maadd').count():pg.click('#maadd');pg.wait_for_timeout(300)
  chk('My arrows editor still has a shaft field',pg.locator('#ma_shaft').count()==1)
  chk('catalogue diameters are still in the app',pg.evaluate("arrowOpts().some(o=>o[0]=='s27')&&arrowOpts().some(o=>o[0]=='x4-610')&&arrowFldOpts().length==6"))
  chk('no page errors',not errs)
  if errs:print(errs)
  b.close()
finally:
  srv.terminate()
print(f'{len(ok)} passed, {len(bad)} failed')
sys.exit(1 if bad else 0)
