# My arrows (23 Oct 2026): one list of arrow sets under My archery, the same list as the Sight marks Arrow set dropdown.
# Fake profile like Nathe's: bow 'Hoyt concept x' with SuperDrive 23's (renamed default set, b.marks), SuperDrive mini
# (b.setMarks) and ACE from the one-time seed; plus another bow and another tester. Checks: all three appear without being
# copied; opening writes nothing; editing puts fletching/FOC parts under the NEW key S.arrowInfo and leaves sets, bows and
# marks byte-identical; FOC matches Easton's formula; a new set shows in the sight marks dropdown; offline; light/dark.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-myarrows');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
PORT=8813
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
SD23={'8m':{'v':'22.90'},'12m':{'v':'21.80'},'18m':{'v':'22.60'},'22m':{'v':'25.55'}}
MINI={'18m':{'v':'32.40'},'30m':{'v':'38.15','h':'1'}}
OTHER=json.dumps({'profile':'Coach P','bows':[{'id':'bp','archer':'Coach P','name':'Hoyt concept x','extra':[],'marks':{'18m':{'v':'1.00'}}}]})
PREP="""([sd23,mini,other])=>{const me=S.profile;S.bows=[{id:'blegacy',archer:me,name:'Hoyt concept x',extra:['8m','12m','22m'],marks:sd23,setMarks:{'as-mini':mini}},{id:'bother',archer:me,name:'Indoor recurve',extra:[],marks:{'18m':{v:'5.5'}}}];
 S.bowSel={};S.bowSel[me]='blegacy';S.arrowSets=[{id:'arrows1',archer:me,name:"SuperDrive 23's",shaft:'SuperDrive 23'},{id:'as-mini',archer:me,name:'SuperDrive mini'}];S.arrowSel={};S.arrowSel[me]='as-mini';delete S.arrowInfo;save();
 localStorage.setItem('scoretool.v1.phill',other);localStorage.removeItem('scoretool.seed.nathe.ace-sightmarks-20261023')}"""
def nathe(pg):
  d=json.loads(pg.evaluate("localStorage.getItem('scoretool.v1')"));[d.pop(k,None) for k in ('leagues','matches')]
  for k in ('diary','casual'):
    if d.get(k) is None:d[k]=[]
  return d
def noemoji(t):return not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in t)
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  for dark in [False,True]:
    tag='dark' if dark else 'light'
    ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and 'INTERNET_DISCONNECTED' not in m.text and errs.append(m.text))
    pg.goto(f'http://localhost:{PORT}/');pg.wait_for_timeout(1000);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500)
    if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
    for _ in range(3):
      if pg.locator('nav [data-v=home]').is_visible():break
      pg.locator('#app button').first.click();pg.wait_for_timeout(400)
    pg.evaluate(PREP,[SD23,MINI,OTHER]);pg.reload();pg.wait_for_timeout(1500)   # the ACE seed runs on this open
    if dark:pg.evaluate("document.documentElement.setAttribute('data-theme','dark')")
    S0=nathe(pg);oth0=pg.evaluate("localStorage.getItem('scoretool.v1.phill')")
    chk(tag+' ACE seeded',any(x['name']=='ACE' for x in S0['arrowSets']))
    ctx.set_offline(True)
    pg.evaluate("nav('myarch')");pg.wait_for_timeout(400)
    chk(tag+' My arrows row under My archery, after My bows',pg.evaluate("(()=>{const r=[...document.querySelectorAll('#app .labrow')].map(x=>x.dataset.go);return r.indexOf('lab_myarrows')==r.indexOf('lab_mybows')+1})()"))
    pg.click('[data-go=lab_myarrows]');pg.wait_for_timeout(500)
    chk(tag+' back button',pg.locator('.labbar .labback').count()==1)
    names=pg.locator('#malist .marow b').all_inner_texts()
    chk(tag+' all three sets appear',names==["SuperDrive 23's",'SuperDrive mini','ACE'])
    chk(tag+' mark counts shown',all(t in pg.inner_text('#malist') for t in ['Hoyt concept x: 4 sight marks','Indoor recurve: 1 sight mark','Hoyt concept x: 2 sight marks','Hoyt concept x: 119 sight marks']))
    chk(tag+' opening writes nothing',nathe(pg)==S0)
    chk(tag+' no emoji',noemoji(pg.inner_text('#app')))
    pg.screenshot(path=os.path.join(SH,f'01-list-{tag}.png'),full_page=True)
    # edit SuperDrive mini: fletching and FOC parts
    pg.click('[data-ed="as-mini"]');pg.wait_for_timeout(300)
    for k,v in [('len','28'),('pt','110'),('fletch','3 x Spin Wing 1.75')]:pg.fill('#ma_'+k,v);pg.dispatch_event('#ma_'+k,'change');pg.wait_for_timeout(150)
    pg.click('#mafocd summary');pg.wait_for_timeout(150)
    for k,v in [('gpi','5.7'),('nock','6'),('vanes','15'),('vpos','1.5')]:pg.fill('#ma_'+k,v);pg.dispatch_event('#ma_'+k,'change');pg.wait_for_timeout(150)
    L,pt,g,nk,vn,vp=28,110,5.7,6,15,1.5;tw=g*L+pt+nk+vn;A=(g*L*L/2+pt*L+vn*vp)/tw;foc=100*(A-L/2)/L
    chk(tag+' FOC = Easton formula',f'{foc:.1f}%' in pg.inner_text('#mafoc') and f'{round(tw)} gr' in pg.inner_text('#mafoc'))
    pg.screenshot(path=os.path.join(SH,f'02-edit-{tag}.png'),full_page=True)
    pg.click('#masave');pg.wait_for_timeout(300);S1=nathe(pg)
    chk(tag+' bows and marks byte-identical',json.dumps(S0['bows'])==json.dumps(S1['bows']))
    rec0=[x for x in S0['arrowSets'] if x['id']=='as-mini'][0];rec1=[x for x in S1['arrowSets'] if x['id']=='as-mini'][0]
    chk(tag+' set record: only the typed length/point added',{k:v for k,v in rec1.items() if k not in('len','pt')}==rec0 and rec1['len']=='28' and rec1['pt']=='110')
    chk(tag+' other set records identical',[x for x in S0['arrowSets'] if x['id']!='as-mini']==[x for x in S1['arrowSets'] if x['id']!='as-mini'])
    chk(tag+' new fields under new key',S1.get('arrowInfo',{}).get(S1['profile'],{}).get('as-mini')=={'fletch':'3 x Spin Wing 1.75','gpi':'5.7','nock':'6','vanes':'15','vpos':'1.5'})
    rest=lambda d:{k:v for k,v in d.items() if k not in('arrowSets','arrowInfo')}
    chk(tag+' rest of data identical',rest(S0)==rest(S1))
    chk(tag+' list shows FOC and fletching',f'FOC {foc:.1f}%' in pg.inner_text('#malist') and 'Spin Wing' in pg.inner_text('#malist'))
    chk(tag+' myArrow API',abs(pg.evaluate("myArrow('as-mini').foc")-round(foc,1))<1e-9 and pg.evaluate("myArrow('as-mini').weight")==round(tw))
    # add a new set; it is in the sight marks dropdown
    pg.click('#maadd');pg.fill('#ma_name','Indoor X23');pg.fill('#ma_spine','2315');pg.click('#masave');pg.wait_for_timeout(300)
    pg.evaluate("(()=>{const r=S.arrowSets.find(x=>x.id=='as-nathe-ace-20261023');window._src0=r.src;r.src='OLD-SOURCE-TEXT';S.arrowSel[S.profile]=r.id})()")
    pg.evaluate("nav('lab_gear')");pg.wait_for_timeout(500);t=pg.inner_text('#gearcard')
    chk(tag+' seeded set shows plain source text',('From: Sight mark sheet, 23 Oct 2026' in t or 'Sight mark sheet' in pg.evaluate("srcText(S.arrowSets.find(x=>x.id=='as-nathe-ace-20261023'))")) and 'OLD-SOURCE-TEXT' not in t)
    pg.evaluate("(()=>{const r=S.arrowSets.find(x=>x.id=='as-nathe-ace-20261023');r.src=window._src0;S.arrowSel[S.profile]='as-mini'})()");pg.evaluate("nav('lab_gear')");pg.wait_for_timeout(400)
    opts=[x.split(' (')[0] for x in pg.locator('#asel option').all_inner_texts()]
    chk(tag+' sight marks dropdown = My arrows list',opts==["SuperDrive 23's",'SuperDrive mini','ACE','Indoor X23'])
    chk(tag+' button says Load PDF or CSV',pg.inner_text('#simpopen').strip()=='Load PDF or CSV')
    S2=nathe(pg);chk(tag+' bows still identical after add',json.dumps(S0['bows'])==json.dumps(S2['bows']))
    pg.evaluate("document.getElementById('adet').open=true;document.getElementById('amyarr').scrollIntoView()");pg.wait_for_timeout(200)
    chk(tag+' link to My arrows from sight marks',pg.locator('#amyarr').count()==1)
    pg.screenshot(path=os.path.join(SH,f'03-sightmarks-{tag}.png'))
    pg.click('#amyarr');pg.wait_for_timeout(400);chk(tag+' link opens My arrows',pg.locator('#malist').count()==1)
    pg.click('.labback');pg.wait_for_timeout(300);chk(tag+' back to My archery',pg.locator('[data-go=lab_myarrows]').count()==1)
    chk(tag+' other tester byte-identical',pg.evaluate("localStorage.getItem('scoretool.v1.phill')")==oth0==OTHER)
    chk(tag+' no errors (offline)',not errs);errs and print(errs)
    ctx.close()
  b.close()
srv.terminate()
print('ok',len(ok),'bad',bad)
