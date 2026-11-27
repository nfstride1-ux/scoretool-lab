# Print sight card (24 Oct 2026): Nathe's ACE set (seeded from his 23 Oct sheet) under 'Hoyt concept x'. Button in Sight marks,
# dialog with back button, PDF 2 pages A4, cards 85.6 x 54 mm, mirrored positions, 5-60 m = 56 rows, marks exact, data unchanged.
import subprocess,sys,time,os,json,base64
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));OUT=sys.argv[1] if len(sys.argv)>1 else '/tmp/sightcard'
os.makedirs(OUT,exist_ok=True);EXP=json.load(open(os.path.join(ROOT,'tools','nathe_ace_sightmarks.json')))
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
srv=subprocess.Popen([sys.executable,'-m','http.server','8812'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
FLAG='scoretool.seed.nathe.ace-sightmarks-20261023'
ALL="(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!/whatsnew|scoretool\\.ui/.test(k))o[k]=localStorage.getItem(k)}return o})()"
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  ctx=b.new_context(viewport={'width':390,'height':844},accept_downloads=True);pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('http://localhost:8812/');pg.wait_for_timeout(1000);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
  for _ in range(3):
    if pg.locator('nav [data-v=home]').is_visible():break
    pg.locator('#app button').first.click();pg.wait_for_timeout(400)
  # his bow; the app's own one-time seed adds the ACE set; arrow details as on the reference card (from his 24 Oct sheet via Coach)
  pg.evaluate(f"""()=>{{const me=S.profile;S.bows=[{{id:'blegacy',archer:me,name:'Hoyt concept x',extra:[],marks:{{}}}}];S.bowSel={{}};S.bowSel[me]='blegacy';S.arrowSets=[];save();localStorage.removeItem('{FLAG}')}}""")
  pg.reload();pg.wait_for_timeout(1200)
  pg.evaluate("()=>{const a=S.arrowSets.find(x=>x.name=='ACE');Object.assign(a,{sh:'3.93',sr:'31.3',wt:'398',fps:'293',si:'2-mark, -76 m DA'});S.arrowSel={};S.arrowSel[S.profile]=a.id;save()}")
  pg.evaluate("nav('lab_gear')");pg.wait_for_timeout(800)
  before=pg.evaluate(ALL)
  chk('button shown',pg.locator('#scprint').count()==1)
  pg.locator('#scprint').click();pg.wait_for_timeout(600)
  chk('dialog with back',pg.locator('#scardov #scback').is_visible())
  chk('defaults 5-60',pg.input_value('#scfrom')=='5' and pg.input_value('#scto')=='60')
  pg.screenshot(path=os.path.join(OUT,'dialog-390.png'))
  pg.click('#scmake');pg.wait_for_selector('#scopen',timeout=8000)
  chk('ready msg 56',"56 distances" in pg.inner_text('#scmsg'))
  b64=pg.evaluate("async()=>{const b=await (await fetch(document.querySelector('#scopen').href)).blob();const r=new FileReader();return await new Promise(ok=>{r.onload=()=>ok(r.result.split(',')[1]);r.readAsDataURL(b)})}")
  open(os.path.join(OUT,'sightcard.pdf'),'wb').write(base64.b64decode(b64))
  pg.screenshot(path=os.path.join(OUT,'dialog-ready-390.png'))
  pg.click('#scback');pg.wait_for_timeout(300);chk('back closes',pg.locator('#scardov').count()==0)
  aft=pg.evaluate(ALL)
  def norm(o):
    o=dict(o);d=json.loads(o.pop('scoretool.v1'));[d.pop(k,None) for k in ('leagues','matches')];return o,{k:v for k,v in d.items() if v not in (None,[],{})}
  chk('data unchanged (bows, sets, marks, other keys)',norm(before)==norm(aft))
  # marked only, 2-120: all 119 rows
  r=pg.evaluate("()=>{const x=sightCardPDF({from:2,to:120,u:'m',only:true,est:false});return x.n}");chk('marked only 2-120 = 119',r==119)
  chk('no page errors',not errs)
  b.close()
finally:srv.kill()
txt=subprocess.run(['pdftotext','-layout',os.path.join(OUT,'sightcard.pdf'),'-'],capture_output=True,text=True).stdout
info=subprocess.run(['pdfinfo',os.path.join(OUT,'sightcard.pdf')],capture_output=True,text=True).stdout
chk('2 pages A4','Pages:           2' in info and '595.28 x 841.89' in info)
p1=txt.split('\f')[0]
chk('every mark 5-60 exact x2',all(p1.count(f"{EXP[f'{d}m']}")>=2 for d in range(5,61)))
chk('settings side','BOW SETTINGS' in txt and '3.93 in' in txt and '293 fps' in txt and 'Marks updated 23 Oct 2026' in txt)
chk('foot note both pages',txt.count('Print at 100% (Actual size), double-sided')==2)
print('OK',len(ok),'BAD',bad);sys.exit(1 if bad else 0)
