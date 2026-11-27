# Competition complete on the Peel group card. Port 8849. (ROOT=<checkout> to point at another tree.)
import subprocess,sys,time,os,json,re
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nav_compat
ROOT=os.environ.get('ROOT') or os.path.dirname(HERE)
srv=subprocess.Popen([sys.executable,'/tmp/stwork/srv.py','8849',ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
bad=[];n_ok=[0]
def chk(n,c,i=''):
  print(('PASS ' if c else 'FAIL ')+n+('' if c else ' '+str(i)[:400]),flush=True)
  if c:n_ok[0]+=1
  else:bad.append(n)
N1=['Nathaniel Stride','Everett Young','Nate Evans','Estiaan Cronge']
N2=['Nathaniel Stride','Everett Young','Estiaan Cronge','Cyrus Takhfifi']
HOOK="""(()=>{window.__txt=[];const f=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t){window.__txt.push(String(t));return f.apply(this,arguments)};
const tb=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(cb,...a){try{const g=this.getContext('2d'),px=(x,y)=>Array.from(g.getImageData(x,y,1,1).data);window.__px={w:this.width,h:this.height,a:px(5,30),b:px(5,this.height-5),c:px(this.width-5,Math.floor(this.height/2))}}catch(e){window.__px={err:String(e)}}return tb.call(this,cb,...a)};
window.__shared=[];navigator.canShare=()=>true;navigator.share=async d=>{window.__shared.push({n:d.files&&d.files[0]&&d.files[0].name,title:d.title,text:d.text})};
window.__dlg=[];})()"""
FIN="""(args)=>{const [di,seed]=args,d=pgEv().days[di];let r=seed;d.a.forEach((x,j)=>{let g=0;while(!x.s.finished&&g++<3000){r=(r*1103515245+12345)&0x7fffffff;const z=['A','B','C','M','A','M','B','M','M','C'][r%10];pgHit(d,j,z)}});delete d.hold;save()}"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);errs=[]
  ctx.route('https://ntfy.sh/**',lambda r,q:r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'}))
  ctx.add_init_script(HOOK)
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
  dlgs=[];mode={'accept':True}
  def ondlg(d):
    dlgs.append(d.message)
    d.accept() if mode['accept'] else d.dismiss()
  pg.on('dialog',ondlg)
  pg.goto('http://localhost:8849/?tester=nathe');pg.wait_for_timeout(1200);pg.evaluate("S.unlocked=true;save()")
  for _ in range(3):pg.reload();pg.wait_for_timeout(1800)
  pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(300)
  me=pg.evaluate("myName()")
  st=lambda:pg.evaluate("JSON.stringify(Object.assign({},S,{peel:Object.assign({},S.peel,{comp:undefined})}))")
  # ---- no days yet: nothing offered
  chk('no comp button before any day is started',pg.locator('#pgcompb').count()==0)
  chk('entry card says Peel is two days',pg.locator('#pgcard').count()==1 and 'Peel is two days' in pg.inner_text('#pgcard'))
  pg.click('#pgopen');pg.wait_for_timeout(300)
  for i,n in enumerate(N1):pg.fill(f'#pgn{i}',n)
  pg.click('#pggo');pg.wait_for_timeout(300)
  # a few taps in the UI, then finish by code
  for z in ['A','B','M','M','M']:
    if pg.locator(f'[data-pgz="{z}"]').count():pg.click(f'[data-pgz="{z}"]')
    elif pg.locator('#pgnext').count():pg.click('#pgnext')
  pg.evaluate(FIN,[0,7]);pg.evaluate("pgView(pgEv().days[0].id)");pg.wait_for_timeout(300)
  chk('Day 1 card: Competition complete is offered, Start Day 2 (not 3)',pg.locator('#pgcomp').count()==1 and 'Start Day 2' in pg.inner_text('#pgnew'))
  chk('Day 1 card says Peel is two days',pg.locator('#pgcnote').count()==1 and 'two days' in pg.inner_text('#pgcnote'))
  raw0=pg.evaluate("localStorage.getItem(KEY)");days0=pg.evaluate("JSON.stringify(S.peel.days)");rest0=st()
  pg.click('#pgcomp');pg.wait_for_timeout(400)
  chk('finished Day 1: no confirm asked',len(dlgs)==0,dlgs)
  chk('comp screen has a back button',pg.locator('#pgcbk').count()==1 and 'Back' in pg.inner_text('#pgcbk'))
  chk('one day only is stated',pg.locator('#pgcwhen').count()==1 and 'One day only' in pg.inner_text('#pgcwhen'),pg.inner_text('#pgcwhen'))
  chk('saved Day 1 scores byte-identical after completing',pg.evaluate("JSON.stringify(S.peel.days)")==days0)
  chk('everything else in storage unchanged (only S.peel.comp added)',st()==rest0)
  comp=pg.evaluate("S.peel.comp")
  ev=pg.evaluate("pgEvRows().map(r=>[r.nm,r.tot])")
  chk('merged totals equal the event totals (independent route)',[[r['nm'],r['tot']] for r in comp['rows']]==ev,(ev,[[r['nm'],r['tot']] for r in comp['rows']]))
  chk('halves add up to the day total, every archer',all(d and sum(h['tot'] for h in d['h'])==d['tot'] for r in comp['rows'] for d in r['days'] if d))
  chk('record is flagged one day',comp['oneDay'] is True and len(comp['days'])==1)
  raw1=pg.evaluate("localStorage.getItem(KEY)")
  pg.click('#pgcbk');pg.wait_for_timeout(300);pg.click('#pgcomp');pg.wait_for_timeout(300)
  chk('tapping again changes nothing (no write, same record)',pg.evaluate("localStorage.getItem(KEY)")==raw1)
  # ---- shares
  names=[r['nm'] for r in comp['rows']];files=[]
  for i,nm in enumerate(names):
    pg.evaluate("window.__txt=[];window.__shared=[];window.__px=null")
    pg.click(f'[data-pgcsh="{i}"]');pg.wait_for_timeout(700)
    t=pg.evaluate("window.__txt");sh=pg.evaluate("window.__shared");px=pg.evaluate("window.__px")
    chk(f'{nm}: full sheet image has own name and "One day only"',nm in t and 'One day only (Day 1)' in t,t[:14])
    others=[x for x in names if x!=nm]+([me] if me not in names else [])
    chk(f'{nm}: no other archer or owner name on their image',not any(o in t for o in others),[o for o in others if o in t])
    chk(f'{nm}: white background',px and px['a']==[255,255,255,255] and px['b']==[255,255,255,255] and px['c']==[255,255,255,255],px)
    chk(f'{nm}: share text/title/file carry own name',len(sh)==1 and nm in sh[0]['text'] and nm in sh[0]['title'] and ''.join(c for c in nm if c.isalnum()).lower() in ''.join(c for c in sh[0]['n'] if c.isalnum()).lower(),sh)
    files.append(sh[0]['n'] if sh else None)
    chk(f'{nm}: image text has no emoji',not any(re.search('[\U0001F000-\U0001FAFF\u2600-\u27BF]',x) for x in t))
  chk('filenames are distinct',len(set(files))==len(files),files)
  pg.evaluate("window.__txt=[];window.__shared=[];window.__px=null");pg.click('#pgcsum');pg.wait_for_timeout(700)
  t=pg.evaluate("window.__txt");sh=pg.evaluate("window.__shared");px=pg.evaluate("window.__px")
  chk('summary lists every archer on a white image',all(n in t for n in names) and px['a']==[255,255,255,255] and px['b']==[255,255,255,255],t[:20])
  chk('summary text lists every archer with totals',len(sh)==1 and all(n in sh[0]['text'] for n in names) and 'one day only' in sh[0]['text'],sh)
  # ---- Day 2: different third archer, only partly scored -> confirm, merged by name
  pg.click('#pgcbk');pg.wait_for_timeout(300);pg.click('#pgnew');pg.wait_for_timeout(300)
  for i,n in enumerate(N2):pg.fill(f'#pgn{i}',n)
  pg.click('#pggo');pg.wait_for_timeout(300)
  pg.evaluate("(()=>{const d=pgEv().days[1];for(let g=0;g<30;g++)pgHit(d,g%4,['A','B','M','C'][g%4]);delete d.hold;save();pgView(d.id)})()");pg.wait_for_timeout(300)
  chk('Day 2 card: no Start Day 3, Competition complete offered',pg.locator('#pgnew').count()==0 and pg.locator('#pgcomp').count()==1 and 'Start Day 3' not in pg.inner_text('#app'))
  days1=pg.evaluate("JSON.stringify(S.peel.days)");rest1=st()
  pg.click('#pgcbk') if pg.locator('#pgcbk').count() else None
  dlgs.clear();mode['accept']=False;pg.click('#pgcomp');pg.wait_for_timeout(400)
  chk('Day 2 not finished: confirm shown naming Day 2',len(dlgs)==1 and 'Day 2' in dlgs[0],dlgs)
  chk('cancelled: record unchanged (still the Day 1 only record)',pg.evaluate("S.peel.comp.days.length")==1 and pg.locator('#pgcomp').count()==1)
  dlgs.clear();mode['accept']=True;pg.click('#pgcomp');pg.wait_for_timeout(400)
  comp=pg.evaluate("S.peel.comp")
  chk('two-day record: Day 1 + Day 2, not one day',len(comp['days'])==2 and not comp['oneDay'] and 'One day only' not in pg.inner_text('#pgcwhen'))
  chk('archers merged by name (5 distinct), blanks where not on a day',len(comp['rows'])==5 and sum(1 for r in comp['rows'] if None in r['days'])==2,[ (r['nm'],[bool(x) for x in r['days']]) for r in comp['rows']])
  chk('saved Day 1 and Day 2 byte-identical after completing',pg.evaluate("JSON.stringify(S.peel.days)")==days1)
  chk('everything else in storage unchanged',st()==rest1)
  ev=pg.evaluate("pgEvRows().map(r=>[r.nm,r.tot])");chk('two-day totals equal the event totals',[[r['nm'],r['tot']] for r in comp['rows']]==ev)
  pg.evaluate("window.__txt=[];window.__shared=[]");pg.click('[data-pgcsh="1"]');pg.wait_for_timeout(700);t=pg.evaluate("window.__txt")
  chk('two-day sheet shows both days and the competition total',any(x.startswith('Day 1') for x in t) and any(x.startswith('Day 2') for x in t) and 'COMPETITION TOTAL' in t and 'Everett Young' in t,t[:20])
  # stale: change a Day 2 score -> banner, update refreshes only the record
  pg.evaluate("(()=>{const d=pgEv().days[1];pgHit(d,0,'A');delete d.hold;save()})()");pg.evaluate("pgComp()");pg.wait_for_timeout(300)
  chk('changed scores: stale notice with an update button',pg.locator('#pgcstale').count()==1 and pg.locator('#pgcupd').count()==1)
  days2=pg.evaluate("JSON.stringify(S.peel.days)");dlgs.clear();pg.click('#pgcupd');pg.wait_for_timeout(400)
  chk('update refreshes the record and clears the notice, days untouched',pg.locator('#pgcstale').count()==0 and pg.evaluate("JSON.stringify(S.peel.days)")==days2)
  # back goes to the day card; entry card offers results
  pg.click('#pgcbk');pg.wait_for_timeout(300);chk('back returns to the day card',pg.locator('#pgcomp').count()==1)
  pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(300)
  chk('entry card: button opens the competition results',pg.locator('#pgcompb').count()==1 and 'Open competition results' in pg.inner_text('#pgcompb'))
  pg.click('#pgcompb');pg.wait_for_timeout(300);chk('entry card button opens the comp screen',pg.locator('#pgcres').count()==1)
  # under-16 nickname only
  jr=pg.evaluate("(()=>{const t=TESTERS.find(x=>x.junior&&testerName(x.id)!=x.name);return t?{full:t.name,nick:testerName(t.id)}:null})()")
  if jr:
    pg.evaluate("(d=>{const E=pgEv();E.days[0].a[1].nm=d.full;E.days[0].a[1].s.abaHead.name=d.full;E.days[1].a[1].nm=d.full;E.days[1].a[1].s.abaHead.name=d.full;save();S.peel.comp=pgCompBuild();save();pgComp()})",jr);pg.wait_for_timeout(300)
    row=[i for i,r in enumerate(pg.evaluate("S.peel.comp.rows")) if r['nm']==jr['full']][0]
    pg.evaluate("window.__txt=[];window.__shared=[]");pg.click(f'[data-pgcsh="{row}"]');pg.wait_for_timeout(700);t=pg.evaluate("window.__txt");sh=pg.evaluate("window.__shared")
    pg.evaluate("window.__txt=[]");pg.click('#pgcsum');pg.wait_for_timeout(700);t2=pg.evaluate("window.__txt");sh2=pg.evaluate("window.__shared")
    chk('under-16: sheet, summary image and texts use the nickname only',jr['nick'] in t and jr['full'] not in t and jr['nick'] in t2 and jr['full'] not in t2 and jr['full'] not in sh[0]['text']+sh[0]['title']+sh[0]['n'] and jr['full'] not in sh2[-1]['text'],(t[:6],sh,sh2))
  chk('no page errors',not errs,errs)
  b.close()
except Exception as e:
  import traceback;traceback.print_exc();bad.append('exception')
finally:srv.kill()
print(f'\n{n_ok[0]} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
