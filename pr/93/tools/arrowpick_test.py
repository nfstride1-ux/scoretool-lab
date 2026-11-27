# My arrows dropdown (23 Oct 2026): Calculators (each card), Arrow chooser and Arrow optimizer can fill their boxes from a
# My arrows set. Checks: opening writes nothing; picking fills only the boxes typing would; boxes stay editable; bows, arrow
# sets, arrow info and old tuning sessions stay byte-identical; a new tuning session gets a snapshot; offline; light/dark.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-arrowpick');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
PORT=8814
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
SD23={'8m':{'v':'22.90'},'12m':{'v':'21.80'}}
PREP="""([sd23])=>{const me=S.profile;S.bows=[{id:'blegacy',archer:me,name:'Hoyt concept x',extra:['8m','12m'],marks:sd23,setMarks:{}}];
 S.bowSel={};S.bowSel[me]='blegacy';S.arrowSets=[{id:'arrows1',archer:me,name:"SuperDrive 23's",shaft:'SuperDrive 23',wt:'402'},{id:'as-mini',archer:me,name:'SuperDrive mini',len:'28',pt:'110',spine:'500',shaft:'Easton SuperDrive 23'}];
 S.arrowInfo={};S.arrowInfo[me]={'as-mini':{gpi:'5.7',nock:'6',vanes:'15',vpos:'1.5',fletch:'3 x Spin Wing 1.75'}};
 S.tune=[{id:'told',archer:me,date:'2026-10-01',name:'Old',change:'Just a group',dist:'18m',face:'40cm',bow:null,bowName:'',before:[[0.1,0.1,'2026-10-01']],after:[],grp:'before'}];S._tuneId=null;
 S.calc={gr:'400',ibo:'340',dl:'29',dw:'60',sg:'0',len:'29',bp:'17'};save();localStorage.removeItem('scoretool.arrowchooser.nathe')}"""
def nathe(pg):
  d=json.loads(pg.evaluate("localStorage.getItem('scoretool.v1')"));[d.pop(k,None) for k in ('leagues','matches')]
  for k in ('diary','casual'):
    if d.get(k) is None:d[k]=[]
  return d
def noemoji(t):return not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in t)
def same(a,b,keys):return all(json.dumps(a.get(k))==json.dumps(b.get(k)) for k in keys)
L,pt,g,nk,vn,vp=28,110,5.7,6,15,1.5;tw=g*L+pt+nk+vn;A=(g*L*L/2+pt*L+vn*vp)/tw;foc=100*(A-L/2)/L
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
    pg.evaluate(PREP,[SD23]);pg.reload();pg.wait_for_timeout(1500)
    if dark:pg.evaluate("document.documentElement.setAttribute('data-theme','dark')")
    S0=nathe(pg);ctx.set_offline(True)
    KEEP=['bows','arrowSets','arrowInfo']
    # Calculators
    pg.evaluate("nav('lab_calc')");pg.wait_for_timeout(500)
    chk(tag+' calc: a My arrows dropdown in each card',all(pg.locator(s).count()==1 for s in ['#c_arrS','#c_arrK','#c_arrF']))
    opts=pg.locator('#c_arrF option').all_inner_texts()
    chk(tag+' calc: the My arrows list',opts[1:]==["SuperDrive 23's",'SuperDrive mini','ACE'] or opts[1:]==["SuperDrive 23's",'SuperDrive mini'])
    chk(tag+' calc: back button',pg.locator('.labbar .labback').count()==1)
    chk(tag+' calc: opening writes nothing',nathe(pg)==S0)
    pg.select_option('#c_arrF','as-mini');pg.wait_for_timeout(400)
    chk(tag+' calc FOC: length 28',pg.input_value('#c_len')=='28')
    chk(tag+f' calc FOC: shows {foc:.1f}%',f'{foc:.1f}%' in pg.inner_text('#app'))
    chk(tag+' calc FOC: note says worked out','worked out from the part weights' in pg.inner_text('#c_arrFw'))
    pg.select_option('#c_arrS','arrows1');pg.wait_for_timeout(400)
    chk(tag+' calc speed: arrow weight 402',pg.input_value('#c_gr')=='402')
    pg.select_option('#c_arrK','as-mini');pg.wait_for_timeout(400)
    chk(tag+f' calc KE: worked-out weight {round(tw)}',pg.input_value('#c_grU')==str(round(tw)) and 'worked out' in pg.inner_text('#c_arrKw'))
    pg.fill('#c_gr','380');pg.dispatch_event('#c_gr','change');pg.wait_for_timeout(300)
    chk(tag+' calc: box stays editable',pg.input_value('#c_gr')=='380')
    S1=nathe(pg);chk(tag+' calc: bows, sets, arrow info identical',same(S0,S1,KEEP+['tune']))
    chk(tag+' calc: only calc boxes changed',{k for k in set(S0)|set(S1) if json.dumps(S0.get(k))!=json.dumps(S1.get(k))}<={'calc','_tuneId','bowSpec'} and S1.get('bowSpec',{})=={})  # bowSpec {} = My bows' empty store, already created in memory on load
    chk(tag+' calc: no emoji',noemoji(pg.inner_text('#app')))
    pg.evaluate("window.scrollTo(0,0)");pg.screenshot(path=os.path.join(SH,f'01-calc-{tag}.png'),full_page=True)
    # Arrow chooser
    pg.evaluate("nav('lab_chooser')");pg.wait_for_timeout(500)
    chk(tag+' chooser: dropdown',pg.locator('#ac_myarr').count()==1)
    chk(tag+' chooser: opening writes nothing',pg.evaluate("localStorage.getItem('scoretool.arrowchooser.nathe')") is None)
    pg.select_option('#ac_myarr','as-mini');pg.wait_for_timeout(500)
    R=json.loads(pg.evaluate("localStorage.getItem('scoretool.arrowchooser.nathe')"))
    chk(tag+' chooser: filled length, point, shaft weight, parts',R.get('len')=='28' and R.get('pt')=='110' and R.get('gpiU')=='5.7' and R.get('nock')=='6' and R.get('vanes')=='15' and R.get('vpos')=='1.5' and R.get('arrowId')=='as-mini')
    chk(tag+' chooser: boxes show it',pg.input_value('#ac_len')=='28' and pg.input_value('#ac_pt')=='110')
    chk(tag+' chooser: note','From SuperDrive mini' in pg.inner_text('#ac_myarrw'))
    pg.fill('#ac_pt','120');pg.dispatch_event('#ac_pt','change');pg.wait_for_timeout(400)
    chk(tag+' chooser: box stays editable',pg.input_value('#ac_pt')=='120')
    chk(tag+' chooser: app data identical',nathe(pg)==S1)
    pg.evaluate("window.scrollTo(0,0)");pg.screenshot(path=os.path.join(SH,f'02-chooser-{tag}.png'),full_page=False)
    # Arrow optimizer
    pg.evaluate("nav('lab_opt')");pg.wait_for_timeout(500)
    chk(tag+' tuning: dropdown',pg.locator('#t_myarr').count()==1)
    chk(tag+' tuning: opening writes nothing',nathe(pg)==S1)
    pg.select_option('#t_myarr','as-mini');pg.wait_for_timeout(300)
    chk(tag+' tuning: chooser setup unticked',pg.locator('#tarw').count()==0 or not pg.is_checked('#tarw'))
    pg.screenshot(path=os.path.join(SH,f'03-tuning-{tag}.png'),full_page=True)
    pg.fill('#tn','Mini group');pg.click('#tgo');pg.wait_for_timeout(500)
    S2=nathe(pg);t=S2['tune'][-1]
    chk(tag+' tuning: new session has the set snapshot',t['name']=='Mini group' and t.get('arrow',{}).get('setId')=='as-mini' and t['arrow']['len']==28 and t['arrow']['pt']==110 and abs(t['arrow']['foc']-round(foc,1))<0.05)
    chk(tag+' tuning: old session identical',json.dumps(S2['tune'][0])==json.dumps(S1['tune'][0]))
    chk(tag+' tuning: bows, sets, arrow info identical',same(S0,S2,KEEP))
    chk(tag+' tuning: card shows it','arrow setup' in pg.inner_text('#app').lower() and 'easton superdrive 23 500' in pg.inner_text('#app').lower())
    chk(tag+' no errors',not errs);errs and print(errs)
    pg.evaluate("S.tune=S.tune.filter(x=>x.id=='told');S._tuneId=null;save()");ctx.close()
  b.close()
srv.terminate()
print('ok',len(ok));print('bad',bad)
