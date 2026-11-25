# Import sight marks (Setups & sight marks > Import sight marks): paste text, CSV/text file, PDF (read on the phone,
# offline). Preview before saving; default only fills empty marks (keeps the archer's own); "Replace existing marks" asks first.
# Fixture: tools/fixtures/ace-sightmarks-sheet.pdf (Nathe's sheet, same values as tools/nathe_ace_sightmarks.json).
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-sightimport');os.makedirs(SH,exist_ok=True)
EXP=json.load(open(os.path.join(ROOT,'tools','nathe_ace_sightmarks.json')));PDF=os.path.join(ROOT,'tools','fixtures','ace-sightmarks-sheet.pdf')
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);
srv=subprocess.Popen([sys.executable,'-m','http.server','8812'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
PREP="""()=>{const me=S.profile;localStorage.setItem('scoretool.seed.nathe.ace-sightmarks-20261023','1');
 S.bows=[{id:'bi',archer:me,name:'Indoor',extra:[],marks:{'18m':{v:'5.5'}}},{id:'bt',archer:me,name:'Target bow',extra:[],marks:{'30m':{v:'1.00'}},setMarks:{'as-x':{'18m':{v:'30.00'},'20m':{v:'26.90'},'25m':{h:'2'}}}}];
 S.bowSel={};S.bowSel[me]='bt';S.arrowSets=[{id:'arrows1',archer:me,name:'Old arrows'},{id:'as-x',archer:me,name:'X sheet'}];S.arrowSel={};S.arrowSel[me]='as-x';S.setup=[];save();
 localStorage.setItem('scoretool.v1.phill','{"profile":"Coach P"}')}"""
def nathe(pg):
  d=json.loads(pg.evaluate("localStorage.getItem('scoretool.v1')"))
  for k in ('diary','casual'):d[k]=d.get(k) or []  # the diary screen itself turns a missing list into []
  for k in ('leagues','matches'):d.pop(k,None)  # live league/match sync, not this screen
  return d
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and 'INTERNET_DISCONNECTED' not in m.text and errs.append(m.text))
  pg.goto('http://localhost:8812/');pg.wait_for_timeout(1000);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
  pg.evaluate(PREP);pg.reload();pg.wait_for_timeout(1500)
  # parser
  P=lambda t:pg.evaluate("t=>sightImportParse(t).rows",t)
  chk('text forms',P("18m 32.35\n20 m: 33.10\n30, 38.15, 1.5\n40m\t44.25\n50yd 40.00\n")=={'18m':{'v':'32.35','h':''},'20m':{'v':'33.10','h':''},'30m':{'v':'38.15','h':'1.5'},'40m':{'v':'44.25','h':''},'50yd':{'v':'40.00','h':''}})
  chk('headings, spec rows and words skipped',P("Range (m)   Sight Mark\nMark 1             38.15\nSight-In Range 1   30m\nSight Height 3.93in\n2   66.50   46   48.15   90   80.75\n")=={'2m':{'v':'66.50','h':''},'46m':{'v':'48.15','h':''},'90m':{'v':'80.75','h':''}})
  chk('CSV with header and empty vertical',P('Distance,Vertical,Horizontal\n18m,32.35,\n"20m","33.10","0.5"\n25,,1.5\n')=={'18m':{'v':'32.35','h':''},'20m':{'v':'33.10','h':'0.5'},'25m':{'v':'','h':'1.5'}})
  chk('semicolon CSV with decimal commas (spreadsheet in a comma-decimal region)',P('Distance;Vertical;Horizontal\n18m;32,35;\n20m;33,10;0,5\n30\t38,15\t1,5\n')=={'18m':{'v':'32.35','h':''},'20m':{'v':'33.10','h':'0.5'},'30m':{'v':'38.15','h':'1.5'}})
  chk('comma CSV with quoted decimal commas',P('20,"18,5","0,5"\n30,"21,25",\n')=={'20m':{'v':'18.5','h':'0.5'},'30m':{'v':'21.25','h':''}})
  chk('comma CSV with dots unchanged',P('40,44.25,1\n50,48.10,\n')=={'40m':{'v':'44.25','h':'1'},'50m':{'v':'48.10','h':''}})
  chk('values kept exactly (no rounding)',P("13 100.050\n")=={'13m':{'v':'100.050','h':''}})
  # PDF read in the page, offline
  ctx.set_offline(True)
  import base64;B=base64.b64encode(open(PDF,'rb').read()).decode()
  got=pg.evaluate("async b=>{const u=Uint8Array.from(atob(b),c=>c.charCodeAt(0));const t=await sightImportPdfText(u.buffer);return [t,sightImportParse(t).rows]}",B)
  rows={d:v['v'] for d,v in got[1].items()};chk('Sheet PDF offline: all 119 rows exact',rows==EXP)
  chk('PDF: no horizontal values',not any(v['h'] for v in got[1].values()))
  chk('PDF text has title',('Target Sight Marks' in got[0]) and ('Ace' in got[0]))
  if os.path.exists('/workspace/nathe-ace-sightmarks.pdf'):  # his other sheet (not committed): 119 rows + spec block skipped
    B2=base64.b64encode(open('/workspace/nathe-ace-sightmarks.pdf','rb').read()).decode()
    r2=pg.evaluate("async b=>{const u=Uint8Array.from(atob(b),c=>c.charCodeAt(0));return sightImportParse(await sightImportPdfText(u.buffer)).rows}",B2)
    chk('second sheet layout (with spec table): 119 rows, 2..120',sorted(int(d[:-1]) for d in r2)==list(range(2,121)) and r2['30m']['v']=='38.15' and r2['2m']['v']=='66.50')
  pg.evaluate("nav('lab_gear')");pg.wait_for_timeout(500)  # opening the screen once (diary fills its empty lists)
  S0=nathe(pg);other0=pg.evaluate("localStorage.getItem('scoretool.v1.phill')")
  # UI: open import from the sight marks screen
  for dark in [False,True]:
    tag='dark' if dark else 'light'
    if dark:pg.evaluate("document.documentElement.setAttribute('data-theme','dark')")
    pg.evaluate("nav('lab_gear')");pg.wait_for_timeout(600)
    chk(tag+' button says Load PDF or CSV',pg.inner_text('#simpopen').strip()=='Load PDF or CSV')
    pg.click('#simpopen');pg.wait_for_timeout(300)
    chk(tag+' no third-party app name on the import screen','precision' not in pg.inner_text('#simpov').lower() and pg.locator('label[for=simpfile]').inner_text().strip()=='Load PDF or CSV')
    chk(tag+' import screen with back button',pg.locator('#simpov #simpback').is_visible())
    chk(tag+' bow and set default to current',pg.input_value('#simpbow')=='bt' and pg.input_value('#simpset')=='as-x')
    pg.set_input_files('#simpfile',PDF);pg.wait_for_timeout(1500)
    chk(tag+' preview 119 rows',pg.locator('#simptab tbody tr').count()==119)
    res=dict(pg.evaluate("[...document.querySelectorAll('#simptab tbody tr')].map(r=>[r.dataset.d,r.dataset.res])"))
    chk(tag+' preview: 18m keep yours, 20m same, rest new',res['18m']=='Keep yours' and res['20m']=='Same' and res['25m']=='New' and list(res.values()).count('New')==117)
    _n=nathe(pg);chk(tag+' nothing saved before Save',_n==S0)
    chk(tag+' no emoji',not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in pg.inner_text('#simpov')))
    pg.screenshot(path=os.path.join(SH,f'01-preview-{tag}.png'))
    pg.evaluate("document.getElementById('simpsum').scrollIntoView()");pg.wait_for_timeout(150);pg.screenshot(path=os.path.join(SH,f'01b-preview-table-{tag}.png'))
    if not dark:
      pg.click('#simpback');pg.wait_for_timeout(300);chk('back closes, nothing saved',pg.locator('#simpov').count()==0 and nathe(pg)==S0)
  # save (default keep mine)
  pg.click('#simpsave');pg.wait_for_timeout(400)
  S1=nathe(pg);M=[x for x in S1['bows'] if x['id']=='bt'][0]['setMarks']['as-x']
  chk('18m kept as mine',M['18m']=={'v':'30.00'})
  chk('25m filled, horizontal kept',M['25m']=={'h':'2','v':EXP['25m']})
  chk('all others exact',all(M[d]['v']==EXP[d] for d in EXP if d!='18m') and len(M)==119)
  chk('Old arrows marks and other bow untouched',[x for x in S1['bows'] if x['id']=='bt'][0]['marks']=={'30m':{'v':'1.00'}} and [x for x in S1['bows'] if x['id']=='bi']==[x for x in S0['bows'] if x['id']=='bi'])
  chk('one diary log entry',len(S1['setup'])==1 and 'imported 117' in S1['setup'][0]['change'] and '1 of mine kept' in S1['setup'][0]['change'])
  d0={k:v for k,v in S0.items() if k not in ('bows','setup','leagues','matches')};d1={k:v for k,v in S1.items() if k not in ('bows','setup','leagues','matches')}
  chk('rest of data identical',d0==d1)
  chk('other tester byte-identical',pg.evaluate("localStorage.getItem('scoretool.v1.phill')")==other0)
  # replace: paste, choose replace, cancel the confirm -> nothing; accept -> replaced
  pg.fill('#simptxt','18m 31.00\n20m 26.90\n');pg.click('#simpread');pg.wait_for_timeout(200)
  chk('paste preview: 18m keep yours by default',pg.get_attribute('#simptab tr[data-d="18m"]','data-res')=='Keep yours' and pg.locator('#simpsave').is_disabled())
  pg.check('[name=simpmode][value=replace]');pg.wait_for_timeout(200)
  chk('replace shows Replace',pg.get_attribute('#simptab tr[data-d="18m"]','data-res')=='Replace')
  pg.once('dialog',lambda d:d.dismiss());pg.click('#simpsave');pg.wait_for_timeout(300)
  chk('cancel confirm -> nothing replaced',[x for x in nathe(pg)['bows'] if x['id']=='bt'][0]['setMarks']['as-x']['18m']=={'v':'30.00'})
  msgs=[];pg.once('dialog',lambda d:(msgs.append(d.message),d.accept()));pg.click('#simpsave');pg.wait_for_timeout(300)
  chk('confirm text names the count',msgs and 'Replace 1 mark' in msgs[0])
  chk('accepted -> 18m replaced',[x for x in nathe(pg)['bows'] if x['id']=='bt'][0]['setMarks']['as-x']['18m']=={'v':'31.00'})
  # CSV file into a new arrow set on the other bow
  csv='/tmp/sightimport-test.csv';open(csv,'w').write('Distance,Vertical,Horizontal\n18m,4.40,\n70m,9.10,1\n')
  pg.select_option('#simpbow','bi');pg.wait_for_timeout(200);pg.once('dialog',lambda d:d.accept('Indoor set'));pg.select_option('#simpset','__new');pg.wait_for_timeout(300)
  pg.set_input_files('#simpfile',csv);pg.wait_for_timeout(500);pg.click('#simpsave');pg.wait_for_timeout(300)
  S2=nathe(pg);bi=[x for x in S2['bows'] if x['id']=='bi'][0];ns=[a for a in S2['arrowSets'] if a['name']=='Indoor set'][0]
  chk('CSV into new set',bi['setMarks'][ns['id']]=={'18m':{'v':'4.40'},'70m':{'v':'9.10','h':'1'}} and bi['marks']=={'18m':{'v':'5.5'}})
  pg.screenshot(path=os.path.join(SH,'02-saved-dark.png'))
  pg.click('#simpback');pg.wait_for_timeout(400)
  chk('back to sight marks showing the imported set',pg.input_value('#bsel')=='bi' and pg.input_value('.smk[data-d="70m"][data-k=v]')=='9.10' and pg.locator('.labback').count()>=1)
  pg.evaluate("document.documentElement.setAttribute('data-theme','light')");pg.evaluate("document.getElementById('simpopen').scrollIntoView({block:'center'})");pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,'00-button-light.png'))
  chk('no console errors',not errs)
  if errs:print(errs[:5])
  b.close()
srv.terminate()
print('ok',len(ok));print('bad',bad)
