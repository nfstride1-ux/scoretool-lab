# Sight marks per bow setup + arrow set (23 Oct 2026). Old marks (b.marks) must show and stay byte-for-byte the same:
# they are "Arrows 1". New sets keep marks in b.setMarks. 390px light/dark screenshots; no emoji; back button.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-arrowsets');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
srv=subprocess.Popen([sys.executable,'-m','http.server','8810'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
# the same legacy shape as Nathe's own setup in his screenshot (a bow setup with marks at 8 m, 18 m, 30 m)
LEG={'8m':{'v':'22.90'},'18m':{'v':'25.0'},'30m':{'v':'29.30'}}
def start(b,dark=False):
  ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto('http://localhost:8810/');pg.wait_for_timeout(1000);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
  for _ in range(3):
    if pg.locator('nav [data-v=home]').is_visible():break
    pg.locator('#app button').first.click();pg.wait_for_timeout(400)
  pg.evaluate("m=>{S.bows=(S.bows||[]).filter(x=>x.id!='blegacy');S.bows.unshift({id:'blegacy',archer:S.profile,name:'Hoyt concept x',extra:['8m','10m'],marks:m});S.bowSel=S.bowSel||{};S.bowSel[S.profile]='blegacy';delete S.arrowSets;delete S.arrowSel;save();localStorage.setItem('scoretool.seed.nathe.ace-sightmarks-20261023','1')}",LEG)  # ACE seed (sightseed_test) marked done here
  pg.reload();pg.wait_for_timeout(1200)
  pg.add_style_tag(content='nav.tabs button:not([data-v=home]):not([data-v=score]):not([data-v=myarch]):not([data-v=clubs]):not([data-v=tools]){display:none!important}')
  if dark:pg.evaluate("document.documentElement.setAttribute('data-theme','dark')")
  return pg,errs
def val(pg,d,k='v'):return pg.input_value(f'.smk[data-d="{d}"][data-k="{k}"]')
def bow(pg):return pg.evaluate("JSON.stringify(S.bows.find(x=>x.id=='blegacy'))")
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  for dark in [False,True]:
    tag='dark' if dark else 'light';pg,errs=start(b,dark)
    other0=pg.evaluate("JSON.stringify({...S,bows:S.bows.filter(x=>x.id!='blegacy'),setup:null,leagues:null,matches:null})")
    pg.evaluate("nav('lab_gear')");pg.wait_for_timeout(600)
    chk(tag+' back button',pg.locator('.labbar .labback,.labback').count()>=1)
    chk(tag+' arrow set dropdown beside bow setup',pg.locator('#bsel').count()==1 and pg.locator('#asel').count()==1)
    chk(tag+' default set is Arrows 1',pg.locator('#asel option').first.inner_text().strip()=='Arrows 1' and pg.locator('#asel option').count()==1)
    chk(tag+' old marks shown unchanged',val(pg,'8m')=='22.90' and val(pg,'18m')=='25.0' and val(pg,'30m')=='29.30' and val(pg,'10m')=='')
    chk(tag+' sightFor reads old mark',pg.evaluate("sightFor('18m')")=='25.0')
    chk(tag+' nothing written by just opening',json.loads(bow(pg))['marks']==LEG and 'setMarks' not in json.loads(bow(pg)) and pg.evaluate("!S.arrowSets"))
    chk(tag+' no emoji',not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in pg.inner_text('#gearcard')))
    pg.evaluate("document.getElementById('gearcard').scrollIntoView()");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,f'01-arrows1-{tag}.png'))
    # new arrow set
    pg.once('dialog',lambda d:d.accept('Indoor X23s'));pg.click('#anew');pg.wait_for_timeout(500)
    chk(tag+' new set selected',pg.locator('#asel option:checked').inner_text().startswith('Indoor X23s'))
    chk(tag+' new set starts empty',val(pg,'18m')=='' and val(pg,'8m')=='')
    pg.fill('.smk[data-d="18m"][data-k="v"]','31.5');pg.press('.smk[data-d="18m"][data-k="v"]','Tab');pg.wait_for_timeout(300)
    bw=json.loads(bow(pg));sid=pg.evaluate("S.arrowSel[S.profile]")
    chk(tag+' new mark saved to the set',bw['setMarks'][sid]['18m']['v']=='31.5')
    chk(tag+' old marks untouched after new set',bw['marks']==LEG)
    chk(tag+' diary entry names the set',pg.evaluate("S.setup.slice(-1)[0].change").startswith('Indoor X23s, 18m: none to 31.5'))
    chk(tag+' sightFor follows the set',pg.evaluate("sightFor('18m')")=='31.5')
    pg.click('#adet summary');pg.wait_for_timeout(200)
    for k,v in [('shaft','Easton X23'),('spine','2314'),('len','30'),('pt','250')]:
      pg.fill(f'.asf[data-k={k}]',v);pg.press(f'.asf[data-k={k}]','Tab');pg.wait_for_timeout(250)
    chk(tag+' set details saved',pg.evaluate("JSON.stringify(S.arrowSets.find(a=>a.id==S.arrowSel[S.profile]))").count('Easton X23')==1 and 'Easton X23 · 2314 · 30" · 250 gr' in pg.locator('#asel').inner_text())
    pg.evaluate("document.getElementById('gearcard').scrollIntoView()");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,f'02-new-set-{tag}.png'))
    # back to Arrows 1 and rename it
    pg.select_option('#asel','arrows1');pg.wait_for_timeout(400)
    chk(tag+' Arrows 1 shows old marks again',val(pg,'18m')=='25.0' and val(pg,'8m')=='22.90')
    pg.once('dialog',lambda d:d.accept('Outdoor X10s'));pg.click('#aren');pg.wait_for_timeout(400)
    chk(tag+' rename keeps marks',val(pg,'18m')=='25.0' and pg.locator('#asel option:checked').inner_text().startswith('Outdoor X10s'))
    bw=json.loads(bow(pg));chk(tag+' old marks still byte-identical',bw['marks']==LEG and json.dumps(bw['marks'])==json.dumps(LEG))
    # an older app version reads only b.marks: simulate it after reload
    pg.reload();pg.wait_for_timeout(1000)
    chk(tag+' older app view (b.marks) unchanged',pg.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('scoretool.v1')).bows.find(x=>x.id=='blegacy').marks)")==json.dumps(LEG,separators=(',',':')))
    other1=pg.evaluate("JSON.stringify({...S,bows:S.bows.filter(x=>x.id!='blegacy'),setup:null,leagues:null,matches:null,arrowSets:undefined,arrowSel:undefined})")
    N=lambda d:{k:v for k,v in d.items() if v not in (None,[])};A,B=N(json.loads(other0)),N(json.loads(other1));  # the diary screen itself starts empty diary/casual lists (same on main)
    chk(tag+' rest of the data unchanged',A==B)
    if A!=B:print('diff',[(k,str(A.get(k))[:150],str(B.get(k))[:150]) for k in set(A)|set(B) if A.get(k)!=B.get(k)])
    chk(tag+' no console errors',not errs)
    if errs:print(errs[:5])
  b.close()
srv.terminate()
print('ok',len(ok));print('bad',bad)
