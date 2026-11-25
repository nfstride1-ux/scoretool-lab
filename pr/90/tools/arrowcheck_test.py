# Calculators 'Save to this arrow' + 'Is this arrow right?' (23 Oct 2026, Nathe). Fake profile like Nathe's: Hoyt Concept X 37
# (330 ATA) at 56 lb, 30.5" draw; SuperDrive 23 375 with 140 gr points, cut length unknown so 29.5" is tried. Checks: opening
# writes nothing; Save is greyed out with a reason until a set is picked; the verdict reads Easton's chart (chart weight 66 lb,
# 340-300, so 375 is too weak) and Easton's FOC range; 'Save results only' writes ONLY S.arrowInfo[..].calc (set records, other
# info, bows, other tester byte-identical); changed spine/length need the confirmation; saved values show in My arrows and survive
# an Edit; old entries still load; no emoji; offline; light/dark. Only local browser storage; every non-localhost request is blocked.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-arrowcheck');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);c or print('FAIL',n)
PORT=8851
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
OTHER=json.dumps({'profile':'Coach P','arrowSets':[{'id':'arrows1','archer':'Coach P','name':'X10','spine':'500'}]})
PREP="""([other])=>{const me=S.profile;S.bows=[{id:'bcx',archer:me,name:'Hoyt concept x',extra:[],marks:{'18m':{v:'22.60'}}}];S.bowSel={};S.bowSel[me]='bcx';
 S.bowSpec={bcx:{type:'compound',make:'Hoyt',model:'Concept X 37',specId:'hoyt-cx37',speed:'330',kind:'ATA',dw:'56',dl:'30.5'}};
 S.arrowSets=[{id:'arrows1',archer:me,name:"SuperDrive 23's",shaft:'SuperDrive 23',spine:'375',pt:'140'},{id:'as-mini',archer:me,name:'SuperDrive mini',len:'28',pt:'110'}];
 S.arrowInfo={};S.arrowInfo[me]={'as-mini':{fletch:'3 x Spin Wing 1.75',gpi:'5.7',nock:'6',vanes:'15',vpos:'1.5'}};delete S.calc;save();
 localStorage.setItem('scoretool.v1.phill',other);localStorage.setItem('scoretool.seed.nathe.ace-sightmarks-20261023','1')}"""
def nathe(pg):
  # leagues/matches/casual/diary are filled in by the app's own start-up code, not by this feature (same as myarrows_test)
  d=json.loads(pg.evaluate("localStorage.getItem('scoretool.v1')"));[d.pop(k,None) for k in ('leagues','matches')]
  for k in ('diary','casual'):
    if d.get(k) is None:d[k]=[]
  return d
def noemoji(t):return not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in t)
def block(route,req):
  u=req.url
  if u.startswith(f'http://localhost:{PORT}/') or u.startswith('data:') or u.startswith('blob:'):route.continue_()
  else:route.abort()
def setv(pg,sel,v):pg.fill(sel,v);pg.dispatch_event(sel,'change');pg.wait_for_timeout(250)
def pick(pg,sel,v):pg.select_option(sel,v);pg.wait_for_timeout(300)
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new','--no-sandbox'])
  for dark in [False,True]:
    tag='dark' if dark else 'light'
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);ctx.route('**/*',block)
    ctx.add_init_script(f"localStorage.setItem('scoretool.theme','{tag}')")
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and not any(x in m.text for x in ('INTERNET_DISCONNECTED','ERR_FAILED','net::')) and errs.append(m.text))
    pg.goto(f'http://localhost:{PORT}/');pg.wait_for_timeout(1000);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500)
    if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
    for _ in range(3):
      if pg.locator('nav [data-v=home]').is_visible():break
      pg.locator('#app button').first.click();pg.wait_for_timeout(400)
    pg.evaluate(PREP,[OTHER]);pg.reload();pg.wait_for_timeout(1500)
    S0=nathe(pg);oth0=pg.evaluate("localStorage.getItem('scoretool.v1.phill')")
    ctx.set_offline(True)
    # FOC verdict boundaries (Easton 2022: 7-15 indoors, 10-15 outdoors and hunting)
    fv=pg.evaluate("[[6.9,'indoor'],[7,'indoor'],[15,'indoor'],[15.1,'indoor'],[9.9,'target'],[12,'field'],[16,'3d'],[12,'hunting'],[21,'target'],[-1,'target']].map(([f,u])=>EXTRA_VIEWS._ackTest.focVerdict(f,u).k)")
    chk(tag+' FOC verdict ranges',fv==['low','good','good','high','low','good','high','good','high','low'])
    pg.evaluate("nav('lab_calc')");pg.wait_for_timeout(500)
    chk(tag+' back button',pg.locator('.labbar .labback').count()==1)
    chk(tag+' opening writes nothing',nathe(pg)==S0)
    chk(tag+' save greyed out with reason (speed + FOC)',pg.locator('#ack_saveS[disabled]').count()==1 and pg.locator('#ack_saveF[disabled]').count()==1 and 'Pick an arrow' in pg.inner_text('#ack_saveFwhy'))
    pg.screenshot(path=os.path.join(SH,f'01-none-picked-{tag}.png'),full_page=True)
    # Nathe's sample
    pick(pg,'#c_mybow','bcx');pick(pg,'#c_arrS','arrows1');setv(pg,'#c_gr','385')
    pick(pg,'#c_arrF','arrows1');setv(pg,'#c_len','29.5');setv(pg,'#c_bp','17.6')
    pg.click('[data-ackseg=use][data-val=indoor]');pg.wait_for_timeout(300)
    chk(tag+' spine and point filled from the set',pg.input_value('#ack_spine')=='375' and pg.input_value('#ack_pt')=='140')
    v=pg.inner_text('#ackv');print(tag,'VERDICT:',v.replace('\n',' | '))
    chk(tag+' spine too weak vs Easton 340-300 at 66 lb',pg.locator('#ackv [data-v=weak]').count()==1 and '340-300' in v and '66 lb' in v and '30" column' in v)
    foc=(17.6-29.5/2)/29.5*100
    chk(tag+' FOC verdict for indoor',f'{foc:.1f}%' in v and ("7-15%" in v))
    t=pg.inner_text('#ackcard')
    chk(tag+' guide + tuning note + sources',"bare-shaft or paper tuning" in t and pg.locator('#ackcard a[href*="the-simple-guidelines-to-correct-arrow-balance-foc"]').count()==1 and pg.locator('#ackcard a[href*="Easton-2026.pdf"]').count()==1 and pg.locator('#ackcard a[href*="TuningGuideEaston.pdf"]').count()==1)
    chk(tag+' no other names',not any(x in t for x in ('Ryles','Park')))
    chk(tag+' no emoji',noemoji(pg.inner_text('#app')))
    chk(tag+' nothing written before tapping Save',json.dumps(nathe(pg)['arrowSets'])==json.dumps(S0['arrowSets']) and nathe(pg).get('arrowInfo')==S0.get('arrowInfo'))
    pg.locator('#ackcard').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,f'02-verdict-{tag}.png'),full_page=True)
    pg.set_viewport_size({'width':390,'height':3000});pg.wait_for_timeout(600);pg.evaluate("document.querySelectorAll('nav').forEach(n=>n.style.visibility='hidden')");bb=pg.locator('#ackcard').bounding_box();pg.screenshot(path=os.path.join(SH,f'02b-verdict-card-{tag}.png'),clip=bb);pg.evaluate("document.querySelectorAll('nav').forEach(n=>n.style.visibility='')");pg.set_viewport_size({'width':390,'height':844})
    # FOC save: length 29.5 is new for this set -> confirmation; Save results only
    pg.click('#ack_saveF');pg.wait_for_timeout(300)
    chk(tag+' confirmation lists the changed length',pg.locator('.ackcf').count()==1 and 'Length: not set → 29.5"' in pg.inner_text('.ackcf'))
    pg.locator('.ackcf').screenshot(path=os.path.join(SH,f'03-confirm-{tag}.png'))
    pg.click('[data-cf=only]');pg.wait_for_timeout(300);S1=nathe(pg);me=S1['profile']
    c=S1['arrowInfo'][me]['arrows1']['calc']
    chk(tag+' calc saved',c['foc']==round(foc,1) and c['bow']=='Hoyt Concept X 37' and c['use']=='indoor' and len(c['date'])==10 and c['totalGr']==385 and isinstance(c['fps'],int) and c['fpsSrc']=='estimate')
    chk(tag+' set records untouched',json.dumps(S1['arrowSets'])==json.dumps(S0['arrowSets']))
    chk(tag+' other info untouched',S1['arrowInfo'][me]['as-mini']==S0['arrowInfo'][me]['as-mini'] and set(S1['arrowInfo'][me]['arrows1'])=={'calc'})
    rest=lambda d:{k:v for k,v in d.items() if k not in('arrowInfo','calc')}
    chk(tag+' rest of data identical',rest(S0)==rest(S1));rest(S0)==rest(S1) or print([k for k in set(S0)|set(S1) if k not in('arrowInfo','calc') and S0.get(k)!=S1.get(k)])
    chk(tag+' saved note',"Saved to SuperDrive 23's" in pg.inner_text('#ack_saveFmsg') and 'left as they were' in pg.inner_text('#ack_saveFmsg'))
    # speed save merges, keeps FOC
    setv(pg,'#c_gr','390');pg.click('#ack_saveS');pg.wait_for_timeout(300);c2=nathe(pg)['arrowInfo'][me]['arrows1']['calc']
    chk(tag+' speed save merges',c2['totalGr']==390 and c2['foc']==c['foc'] and c2['fps']!=c['fps'])
    pg.set_viewport_size({'width':390,'height':3000});pg.wait_for_timeout(600);pg.evaluate("document.querySelectorAll('nav').forEach(n=>n.style.visibility='hidden')")
    for i,nm in [(0,'speed'),(2,'foc')]:pg.screenshot(path=os.path.join(SH,f'04-saved-{nm}-card-{tag}.png'),clip=pg.locator('.labgrid2 > .card').nth(i).bounding_box())
    pg.evaluate("document.querySelectorAll('nav').forEach(n=>n.style.visibility='')");pg.set_viewport_size({'width':390,'height':844})
    # My arrows shows it; Edit + Save keeps it; old entry still loads
    pg.evaluate("nav('lab_myarrows')");pg.wait_for_timeout(400);lt=pg.inner_text('#malist')
    chk(tag+' My arrows shows saved values',f'FOC {round(foc,1)}%' in lt and '390 gr' in lt and 'Hoyt Concept X 37' in lt and 'Calculators, ' in lt)
    chk(tag+' old entry still loads',"SuperDrive mini" in lt and 'Spin Wing' in lt)
    pg.screenshot(path=os.path.join(SH,f'05-myarrows-{tag}.png'),full_page=True)
    pg.click('[data-ed="arrows1"]');pg.wait_for_timeout(300);setv(pg,'#ma_fletch','3 x AAE');pg.click('#masave');pg.wait_for_timeout(300)
    i3=nathe(pg)['arrowInfo'][me]['arrows1'];chk(tag+' edit keeps calc',i3.get('calc')==c2 and i3.get('fletch')=='3 x AAE')
    # change spine in the calc -> confirm -> Save and change
    pg.evaluate("nav('lab_calc')");pg.wait_for_timeout(400);setv(pg,'#ack_spine','340')
    chk(tag+' 340 about right',pg.locator('#ackv [data-v=right]').count()==1)
    pg.click('#ack_saveF');pg.wait_for_timeout(300);cf=pg.inner_text('.ackcf')
    chk(tag+' confirm lists spine and length',"Spine: 375 → 340" in cf and 'Length' in cf)
    pg.click('[data-cf=no]');pg.wait_for_timeout(200);chk(tag+' cancel writes nothing',nathe(pg)['arrowSets']==S0['arrowSets'])
    pg.click('#ack_saveF');pg.wait_for_timeout(200);pg.click('[data-cf=all]');pg.wait_for_timeout(300);S4=nathe(pg)
    r=[x for x in S4['arrowSets'] if x['id']=='arrows1'][0];r0=[x for x in S0['arrowSets'] if x['id']=='arrows1'][0]
    chk(tag+' confirmed: only spine and length changed',r['spine']=='340' and r['len']=='29.5' and {k:v for k,v in r.items() if k not in('spine','len')}=={k:v for k,v in r0.items() if k not in('spine','len')})
    chk(tag+' other set untouched',[x for x in S4['arrowSets'] if x['id']!='arrows1']==[x for x in S0['arrowSets'] if x['id']!='arrows1'])
    chk(tag+' bows byte-identical',json.dumps(S4['bows'])==json.dumps(S0['bows']) and S4['bowSpec']==S0['bowSpec'])
    chk(tag+' other tester byte-identical',pg.evaluate("localStorage.getItem('scoretool.v1.phill')")==oth0==OTHER)
    chk(tag+' no errors (offline)',not errs);errs and print(errs)
    ctx.close()
  b.close()
srv.terminate()
print('ok',len(ok),'bad',bad)
