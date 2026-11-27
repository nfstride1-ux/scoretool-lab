# One-time sight marks seed for tester nathe (23 Oct 2026): NEW arrow set 'ACE' under his EXISTING bow 'Hoyt concept x', vertical
# marks 2-120 m exactly as printed on his sight mark sheet "Concept x - Ace (85 m density altitude)"
# (tools/nathe_ace_sightmarks.json = pdftotext -layout of that sheet). Fake profile with both of his sets (SuperDrive 23's = the
# renamed default set in b.marks, SuperDrive mini in b.setMarks) plus another bow and another tester: all byte-identical.
# Also: every row exact, no horizontal marks, no bow created, bow missing -> nothing + no flag (retries), flag only after
# success, idempotent, an existing ACE set is never overwritten, other testers never seeded; long list scrolls.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-sightseed');os.makedirs(SH,exist_ok=True)
EXP=json.load(open(os.path.join(ROOT,'tools','nathe_ace_sightmarks.json')))
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n)
srv=subprocess.Popen([sys.executable,'-m','http.server','8811'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
FLAG='scoretool.seed.nathe.ace-sightmarks-20261023'
SD23={'8m':{'v':'22.90'},'12m':{'v':'21.80'},'18m':{'v':'22.60'},'22m':{'v':'25.55'}}
MINI={'18m':{'v':'32.40'},'30m':{'v':'38.15','h':'1'}}
OTHER=json.dumps({'profile':'Coach P','bows':[{'id':'bp','archer':'Coach P','name':'Hoyt concept x','extra':[],'marks':{'18m':{'v':'1.00'}}}]})
def start(b):
  ctx=b.new_context(viewport={'width':390,'height':844});pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto('http://localhost:8811/');pg.wait_for_timeout(1000);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
  for _ in range(3):
    if pg.locator('nav [data-v=home]').is_visible():break
    pg.locator('#app button').first.click();pg.wait_for_timeout(400)
  return pg,errs
# his setup as on his phone: bow 'Hoyt concept x' with SuperDrive 23's (renamed default set = b.marks) and SuperDrive mini; another bow
PREP="""([sd23,mini,other,flag,withBow])=>{const me=S.profile;S.bows=[{id:'bother',archer:me,name:'Indoor recurve',extra:[],marks:{'18m':{v:'5.5'}}}];
 if(withBow)S.bows.unshift({id:'blegacy',archer:me,name:' Hoyt  Concept X ',extra:['8m','12m','22m'],marks:sd23,setMarks:{'as-mini':mini}});
 S.bowSel={};S.bowSel[me]='blegacy';S.arrowSets=[{id:'arrows1',archer:me,name:"SuperDrive 23's",shaft:'SuperDrive 23'},{id:'as-mini',archer:me,name:'SuperDrive mini'}];S.arrowSel={};S.arrowSel[me]='as-mini';save();
 localStorage.setItem('scoretool.v1.phill',other);localStorage.removeItem(flag)}"""
ALL="(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k)}return o})()"
def nathe(pg):return json.loads(pg.evaluate("localStorage.getItem('scoretool.v1')"))
def rest(d):
  d=dict(d);[d.pop(k,None) for k in ('bows','arrowSets','leagues','matches')];return {k:v for k,v in d.items() if v not in (None,[])}
def nolm(s):d=json.loads(s);[d.pop(k,None) for k in ('leagues','matches')];return d
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  pg,errs=start(b)
  # 1) bow not there yet: nothing happens, no flag
  pg.evaluate(PREP,[SD23,MINI,OTHER,FLAG,False]);s0=pg.evaluate("localStorage.getItem('scoretool.v1')")
  pg.reload();pg.wait_for_timeout(1200)
  chk('no bow: nothing changed',nolm(s0)==nolm(pg.evaluate("localStorage.getItem('scoretool.v1')")))
  chk('no bow: flag unset',pg.evaluate(f"localStorage.getItem('{FLAG}')") is None)
  chk('no bow created',not any('hoyt' in x['name'].lower() for x in nathe(pg)['bows']))
  # 2) his real setup: seed on next open
  pg.evaluate(PREP,[SD23,MINI,OTHER,FLAG,True]);before=pg.evaluate(ALL);S0=nathe(pg)
  pg.reload();pg.wait_for_timeout(1500)
  after=pg.evaluate(ALL);S1=nathe(pg)
  chk('other tester key byte-identical',before.get('scoretool.v1.phill')==after.get('scoretool.v1.phill')==OTHER)
  b0=[x for x in S0['bows'] if x['id']=='blegacy'][0];b1=[x for x in S1['bows'] if x['id']=='blegacy'][0]
  chk("SuperDrive 23's marks byte-identical",json.dumps(b0['marks'])==json.dumps(b1['marks']) and b1['marks']==SD23)
  chk('SuperDrive mini marks byte-identical',json.dumps(b0['setMarks']['as-mini'])==json.dumps(b1['setMarks']['as-mini']) and b1['setMarks']['as-mini']==MINI)
  chk('bow otherwise identical',json.dumps({k:v for k,v in b0.items() if k!='setMarks'})==json.dumps({k:v for k,v in b1.items() if k!='setMarks'}))
  chk('other bow identical, no bow created',json.dumps([x for x in S0['bows'] if x['id']!='blegacy'])==json.dumps([x for x in S1['bows'] if x['id']!='blegacy']) and len(S1['bows'])==len(S0['bows']))
  chk('existing set records byte-identical',json.dumps(S0['arrowSets'])==json.dumps(S1['arrowSets'][:len(S0['arrowSets'])]))
  chk('rest of his data identical',rest(S0)==rest(S1))
  chk('selection unchanged',S0['bowSel']==S1['bowSel'] and S0['arrowSel']==S1['arrowSel'])
  new=S1['arrowSets'][len(S0['arrowSets']):];chk('one new set ACE',len(new)==1 and new[0]['name']=='ACE' and new[0]['archer']==S0['profile'])
  st=new[0];M=b1['setMarks'].get(st['id'],{})
  chk('only ACE added to setMarks',sorted(b1['setMarks'])==sorted(['as-mini',st['id']]))
  chk('119 rows 2-120 m',sorted(M,key=lambda d:int(d[:-1]))==[f'{d}m' for d in range(2,121)])
  chk('every mark exact as printed',all(M[d]=={'v':EXP[d]} for d in EXP) and len(EXP)==119)
  KEYR={'8m':'26.80','10m':'25.55','12m':'25.10','18m':'26.15','20m':'26.90','22m':'27.75','30m':'31.90','40m':'38.10','50m':'45.00','60m':'52.50','70m':'60.50','90m':'78.10'}
  chk('key rows',all(M[d]['v']==v for d,v in KEYR.items()))
  chk('no horizontal marks',not any('h' in v for v in M.values()))
  fl=json.loads(after.get(FLAG,'{}'));chk('flag set after success',fl.get('rows')==119 and fl.get('bow')=='blegacy' and fl.get('set')==st['id'])
  s1=pg.evaluate("localStorage.getItem('scoretool.v1')");pg.reload();pg.wait_for_timeout(1200);s2=pg.evaluate("localStorage.getItem('scoretool.v1')")
  chk('second open changes nothing',nolm(s1)==nolm(s2) and pg.evaluate(f"localStorage.getItem('{FLAG}')")==after[FLAG])
  # 3) flag cleared but ACE already has marks (e.g. he edited one): never overwritten, no duplicate
  pg.evaluate("([f,id])=>{const b=S.bows.find(x=>x.id=='blegacy');b.setMarks[id]['18m'].v='99.99';save();localStorage.removeItem(f)}",[FLAG,st['id']]);pg.reload();pg.wait_for_timeout(1200)
  S3=nathe(pg);b3=[x for x in S3['bows'] if x['id']=='blegacy'][0]
  chk('existing ACE never overwritten, no duplicate',b3['setMarks'][st['id']]['18m']['v']=='99.99' and len([a for a in S3['arrowSets'] if a['name']=='ACE'])==1 and len(b3['setMarks'][st['id']])==119)
  pg.evaluate("([id,v])=>{const b=S.bows.find(x=>x.id=='blegacy');b.setMarks[id]['18m'].v=v;save()}",[st['id'],EXP['18m']])
  # screen
  for dark in [False,True]:
    tag='dark' if dark else 'light'
    if dark:pg.evaluate("document.documentElement.setAttribute('data-theme','dark')")
    pg.evaluate("nav('lab_gear')");pg.wait_for_timeout(600)
    pg.select_option('#bsel','blegacy');pg.wait_for_timeout(300);pg.select_option('#asel',st['id']);pg.wait_for_timeout(400)
    got={d:v for d,v in pg.evaluate("[...document.querySelectorAll('.smk[data-k=v]')].map(i=>[i.dataset.d,i.value])") if v}
    chk(tag+' screen shows all 119 marks exactly',got==EXP)
    chk(tag+' list scrolls',pg.evaluate("(()=>{const w=document.querySelector('.smwrap');return !!w&&w.scrollHeight>w.clientHeight+50&&getComputedStyle(w).overflowY=='auto'})()"))
    chk(tag+' back button after changing set',pg.locator('.labback').count()>=1)
    chk(tag+' no emoji',not any(ord(c)>0x1F000 or 0x2600<=ord(c)<0x27C0 for c in pg.inner_text('#gearcard')))
    pg.evaluate("document.getElementById('gearcard').scrollIntoView()");pg.wait_for_timeout(150);pg.screenshot(path=os.path.join(SH,f'01-ace-{tag}.png'))
    pg.evaluate("document.querySelector('.smwrap').scrollIntoView();document.querySelector('.smwrap').scrollTop=99999");pg.wait_for_timeout(150);pg.screenshot(path=os.path.join(SH,f'02-ace-120m-{tag}.png'))
  pg.select_option('#asel','arrows1');pg.wait_for_timeout(300)
  chk("SuperDrive 23's still shows its marks",pg.input_value('.smk[data-d="18m"][data-k=v]')=='22.60')
  pg.select_option('#asel','as-mini');pg.wait_for_timeout(300)
  chk('SuperDrive mini still shows its marks',pg.input_value('.smk[data-d="18m"][data-k=v]')=='32.40' and pg.locator('.smk[data-d="2m"]').count()==0)
  chk('no console errors',not errs)
  if errs:print(errs[:5])
  ctx=b.new_context(viewport={'width':390,'height':844});q=ctx.new_page();q.goto('http://localhost:8811/?tester=phill');q.wait_for_timeout(1500)
  chk('other tester not seeded',q.evaluate(f"!localStorage.getItem('{FLAG}')&&!(S.arrowSets||[]).some(a=>a.name=='ACE')"))
  b.close()
srv.terminate()
print('ok',len(ok));print('bad',bad)
