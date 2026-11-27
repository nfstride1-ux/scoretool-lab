# Estimated sight marks (23 Oct 2026): nothing is estimated until 'Estimate other marks' is tapped; estimates go under the NEW
# key S.sightEst and are shown as est.; real marks are never changed; Clear estimates removes only the estimates and the whole
# saved state is byte-identical again; typing over an estimate makes it a real mark; nothing past 1.5x the longest mark or
# below the shortest; fewer than 3 marks = no estimates; offline; light/dark; the other tester untouched.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-sightest');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
PORT=8815
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
REAL={'8m':{'v':'22.90'},'12m':{'v':'21.80'},'18m':{'v':'22.60','h':'1.5'},'22m':{'v':'25.55'},'30m':{'v':'30.80'},'40m':{'v':'35.70'}}
OTHER=json.dumps({'profile':'Coach P','bows':[{'id':'bp','archer':'Coach P','name':'Hoyt concept x','extra':[],'marks':{'18m':{'v':'1.00'}}}]})
PREP="""([real,other])=>{const me=S.profile;S.bows=[{id:'bt',archer:me,name:'Hoyt concept x',extra:['8m','12m','22m'],marks:{'18m':{v:'30.00'}},setMarks:{'as-t':real}}];
 S.bowSel={};S.bowSel[me]='bt';S.arrowSets=[{id:'arrows1',archer:me,name:"SuperDrive 23's"},{id:'as-t',archer:me,name:'Test set'}];S.arrowSel={};S.arrowSel[me]='as-t';delete S.sightEst;save();
 localStorage.setItem('scoretool.v1.phill',other)}"""
def raw(pg):return pg.evaluate("localStorage.getItem('scoretool.v1')")
def nathe(pg):
  d=json.loads(raw(pg));[d.pop(k,None) for k in ('leagues','matches')]
  for k in ('diary','casual'):
    if d.get(k) is None:d[k]=[]
  return d
def noemoji(t):return not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in t)
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  for dark in [False,True]:
    tag='dark' if dark else 'light'
    ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and 'INTERNET_DISCONNECTED' not in m.text and errs.append(m.text))
    pg.on('dialog',lambda d:d.accept())
    pg.goto(f'http://localhost:{PORT}/');pg.wait_for_timeout(1000);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500)
    if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
    for _ in range(3):
      if pg.locator('nav [data-v=home]').is_visible():break
      pg.locator('#app button').first.click();pg.wait_for_timeout(400)
    pg.evaluate(PREP,[REAL,OTHER]);pg.reload();pg.wait_for_timeout(1500)
    if dark:pg.evaluate("document.documentElement.setAttribute('data-theme','dark')")
    ctx.set_offline(True)
    pg.evaluate("nav('lab_gear')");pg.wait_for_timeout(600)
    # wait for the league background sync to settle (it flips leagues[].dirty/posted on its own)
    try: pg.wait_for_function("!(S.leagues||[]).some(l=>l.dirty)",timeout=15000)
    except Exception: pass
    pg.wait_for_timeout(500)
    pg.evaluate('save()')  # the diary screen creates its empty lists (setup: []) in memory; any save writes them. Baseline after that.
    R0=raw(pg);S0=nathe(pg);oth0=pg.evaluate("localStorage.getItem('scoretool.v1.phill')")
    chk(tag+' back button',pg.locator('.labbar .labback, .labback').count()>=1)
    chk(tag+' no estimates until tapped',pg.locator('.smk.smest').count()==0 and 'sightEst' not in S0)
    chk(tag+' button shown',pg.inner_text('#smest').strip()=='Estimate other marks' and pg.locator('#smclr').count()==0)
    pg.screenshot(path=os.path.join(SH,f'00-before-{tag}.png'),full_page=True)
    pg.click('#smest');pg.wait_for_timeout(500)
    S1=nathe(pg);E=S1.get('sightEst',{}).get('bt',{}).get('as-t',{})
    chk(tag+' estimates under the new key',bool(E.get('marks')))
    chk(tag+' real marks byte-identical after estimating',json.dumps(S1['bows'])==json.dumps(S0['bows']))
    chk(tag+' only the new key changed',{k for k in set(S0)|set(S1) if json.dumps(S0.get(k))!=json.dumps(S1.get(k))}=={'sightEst'})
    em=E.get('marks',{})
    chk(tag+' estimates only for empty distances in range',set(em)=={'20m','50m','60m'})
    chk(tag+' no estimate past 1.5x (70m, 90m)',not any(d in em for d in ('70m','90m')))
    chk(tag+' values from the fit',em.get('20m')=='24.32' and em.get('50m')=='42.83' and em.get('60m')=='49.63')
    chk(tag+' past the longest mark flagged',E.get('far')==['50m','60m'])
    ph=pg.get_attribute('.smk[data-d="20m"][data-k=v]','placeholder');chk(tag+' shown as est., not as a value',ph=='est. 24.32' and pg.input_value('.smk[data-d="20m"][data-k=v]')=='')
    chk(tag+' est. label and italic',pg.locator('.smestl').count()==3 and pg.evaluate("getComputedStyle(document.querySelector('.smk.smest')).fontStyle")=='italic')
    chk(tag+' typed marks unchanged on screen',pg.input_value('.smk[data-d="18m"][data-k=v]')=='22.60' and pg.input_value('.smk[data-d="18m"][data-k=h]')=='1.5')
    chk(tag+' confirm-on-range note','confirm each one on the range' in pg.inner_text('#smestmsg'))
    chk(tag+' less-sure note past 40m','Past your longest mark (40m)' in pg.inner_text('#smestmsg'))
    chk(tag+' no emoji',noemoji(pg.inner_text('#app')))
    pg.screenshot(path=os.path.join(SH,f'01-estimates-{tag}.png'),full_page=True)
    pg.click('#smclr');pg.wait_for_timeout(500)
    chk(tag+' clear: saved state byte-identical',raw(pg)==R0)
    chk(tag+' clear: no est. shown',pg.locator('.smk.smest').count()==0)
    pg.screenshot(path=os.path.join(SH,f'02-cleared-{tag}.png'),full_page=True)
    # estimate again, then type over one estimate
    pg.click('#smest');pg.wait_for_timeout(500)
    pg.fill('.smk[data-d="20m"][data-k=v]','24.40');pg.dispatch_event('.smk[data-d="20m"][data-k=v]','change');pg.wait_for_timeout(300)
    S2=nathe(pg);E2=S2['sightEst']['bt']['as-t']['marks']
    chk(tag+' typed over: now a real mark',S2['bows'][0]['setMarks']['as-t']['20m']['v']=='24.40')
    chk(tag+' typed over: that estimate dropped, others kept','20m' not in E2 and set(E2)=={'50m','60m'})
    pg.evaluate("nav('lab_gear')");pg.wait_for_timeout(400)
    pg.click('#smclr');pg.wait_for_timeout(400);S3=nathe(pg)
    chk(tag+' clear keeps the typed mark',S3['bows'][0]['setMarks']['as-t']['20m']['v']=='24.40' and 'sightEst' not in S3)
    chk(tag+' other real marks still identical',all(json.dumps(S3['bows'][0]['setMarks']['as-t'][d])==json.dumps(REAL[d]) for d in REAL))
    # the other arrow set (only 1 mark): no estimates possible
    pg.select_option('#asel','arrows1');pg.wait_for_timeout(400)
    chk(tag+' under 3 marks: button off, says why',pg.is_disabled('#smest') and 'at least 3 real marks' in pg.inner_text('#smestmsg'))
    chk(tag+' other tester identical',pg.evaluate("localStorage.getItem('scoretool.v1.phill')")==oth0)
    # the fit on its own: Nathe's ACE marks from 5 of them reproduce the other key rows within 0.1 inside the range
    ace=pg.evaluate("""()=>{const f=sightFit([[8,26.80],[12,25.10],[18,26.15],[30,31.90],[50,45.00]]);return [10,20,22,40].map(d=>+f(d).toFixed(2))}""")
    chk(tag+' fit check on ACE key rows',all(abs(x-y)<=0.1 for x,y in zip(ace,[25.55,26.90,27.75,38.10])))
    chk(tag+' no errors',not errs);errs and print(errs)
    ctx.close()
  b.close()
srv.terminate()
print('ok',len(ok));print('bad',bad)
