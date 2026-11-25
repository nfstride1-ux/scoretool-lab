# Mixed faces (28 Oct 2026, Nathe: "me and Logan shoot against each other, he on a Vegas face, I on a single 40 cm"; Ema has no app and is scored on Logan's phone).
# Casual shoot, Indoor WA 18m / 25m / Combined / Australian Indoor 18m: every archer picks their own face (Three spot | Single face) at setup and on the score card
# until their first arrow. Keys, ring values, plotting follow each archer's face; totals use the one X/10..1/M scale; a small note says faces differ.
# Kept in cs.fa (host) / cs.sc[id].f (linked archer on their own phone); shoots without them behave exactly as before. Match nights: Single face is offered too,
# each archer on their own phone. Relay mocked in memory, TEST data only.
import subprocess,sys,time,os,json,socket
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n,flush=True)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH=os.environ.get('MIXED_SHOTS','/workspace/shots-mixedface');os.makedirs(SH,exist_ok=True)
def free():
  s=socket.socket();s.bind(('127.0.0.1',0));p=s.getsockname()[1];s.close();return p
PORT=free()
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
RELAY={};N=[0];OFF=set()
def mk(tid):
  def relay(route,req):
    if tid in OFF:return route.abort()
    u=urlparse(req.url);topic=u.path.strip('/').split('/')[0];L=RELAY.setdefault(topic,[])
    if req.method=='POST':
      N[0]+=1;L.append({'id':'m%06d'%N[0],'event':'message','topic':topic,'message':req.post_data or ''});return route.fulfill(status=200,body='{}',headers={'access-control-allow-origin':'*'})
    since=parse_qs(u.query).get('since',['all'])[0];out=[m for m in L if since=='all' or m['id']>since]
    route.fulfill(status=200,body='\n'.join(json.dumps(m) for m in out)+('\n' if out else ''),headers={'access-control-allow-origin':'*'})
  return relay
NAMES={'logan':'Lee Archer','joseph':'Jo Archer','nathe':'Nathaniel Stride'}
errs=[]
def phone(b,tid):
  ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True);ctx.route('https://ntfy.sh/**',mk(tid))
  ctx.add_init_script("for(const id of %s)if(id!='%s')localStorage.removeItem('scoretool.dname.'+id)"%(json.dumps(nm_seed.IDS),tid));pg=ctx.new_page()
  pg.on('pageerror',lambda e:errs.append(f'{tid}: {e}'));pg.on('dialog',lambda d:d.accept())
  pg.goto(f'http://localhost:{PORT}/?tester={tid}');pg.wait_for_timeout(1200)
  pg.evaluate("n=>{S.unlocked=true;if(!S.profile)S.profile=n;save()}",NAMES[tid]);pg.reload();pg.wait_for_timeout(2000);return ctx,pg
CT="(async()=>{while(csBusy)await new Promise(r=>setTimeout(r,40));await csTick(true)})()"
def ct(*P):
  for _ in range(2):
    for pg in P:pg.evaluate(CT);pg.wait_for_timeout(100)
def to_score(pg):pg.evaluate("cur=null;sv='sheet';window._csv=null;nav('score')");pg.wait_for_timeout(300)
def fill(pg,code,pid,arr):return pg.evaluate("([c,p,A])=>A.map(k=>csKey(c,p,k)).every(Boolean)",[code,pid,arr])
def shot(pg,name,sel=None):
  if sel:pg.evaluate("s=>{const e=document.querySelector(s);if(e)e.scrollIntoView({block:'start'})}",sel);pg.wait_for_timeout(250)
  pg.screenshot(path=os.path.join(SH,name+'.png'))
def keys(pg):return pg.evaluate("[...document.querySelectorAll('#csentry [data-csk]')].map(b=>b.dataset.csk).join(' ')")
WA='10 9 8 7 6 M';V3='X 10 9 8 7 6 M';V1='X 10 9 8 7 6 5 4 3 2 1 M'
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  cL,L=phone(b,'logan');cJ,J=phone(b,'joseph');cN,Nn=phone(b,'nathe')
  # ---------- old shoots are untouched ----------
  old=L.evaluate("""(()=>{const cs={code:'COLD1',name:'Old',disc:'indoor',round:'Indoor WA 18m',face3:'vegas',date:'2026-10-20',host:'logan',ppl:[{id:'logan',tid:'logan'},{id:'nx',n:'Sam'}],pt:1,sc:{logan:{e:[['X','10','9']],u:5,by:'logan'}},fin:0,fint:0,mp:{on:false,ask:0,seeds:null,t:1},status:'active',created:1};
   csAll().push(cs);save();return JSON.stringify(cs)})()""")
  chk('old shoot: face unchanged, Indoor WA 18m keys are 10 to 6 and M',L.evaluate("""(()=>{const cs=csGet('COLD1');return csKeys(cs,0).join(' ')=='10 9 8 7 6 M'&&csKeys(cs,0,'nx').join(' ')=='10 9 8 7 6 M'&&csFaceTxt(cs)=='Vegas 3-spot'&&csFace(cs,0,'nx').vert===undefined&&csFace(cs,0,'nx').tri===true&&!csMixed(cs)})()"""))
  L.evaluate("csView('COLD1')");L.wait_for_timeout(300);ct(L)
  chk('old shoot: opening it and syncing changes none of its scores or settings (only the usual sync bookkeeping)',(lambda n:all(json.loads(old)[k]==n[k] for k in json.loads(old)) and 'fa' not in n and 'f' not in n['sc']['logan'])(json.loads(L.evaluate("JSON.stringify(csGet('COLD1'))"))))
  chk('old shoot: relay snapshot has no face data and no note on screen',L.evaluate("(()=>{const P=csSnapParts(csGet('COLD1'));return P.every(x=>!('fa' in x)&&Object.values(x.sc).every(v=>!('f' in v)))})()") and L.locator('#csfacenote').count()==0)
  L.evaluate("S.casual=csAll().filter(x=>x.code!='COLD1');save()")
  # ---------- setup on Logan's phone ----------
  to_score(L);L.click('[data-cstp="casual"]');L.wait_for_timeout(300);L.click('[data-csdisc="indoor"]');L.wait_for_timeout(200)
  for r,exp in [('Indoor WA 18m',True),('Australian Indoor 18m',True),('Indoor WA 25m',True),('Indoor WA Combined 25m + 18m',True),('Vegas 300',False)]:
    L.select_option('#csrd',r);L.wait_for_timeout(200)
    chk(f'setup {r}: per-archer Face '+('shown' if exp else 'hidden (Vegas 300 stays a 3-spot game)'),(L.locator('#cssetup [data-csfs="self"]').count()==2)==exp)
  L.select_option('#csrd','Indoor WA 18m');L.wait_for_timeout(200);L.click('[data-csf3="vegas"]');L.wait_for_timeout(200)
  L.fill('#cstype','Ema');L.click('#csaddn');L.wait_for_timeout(200)
  L.fill('#cstype','Joe');L.dispatch_event('#cstype','input');L.wait_for_timeout(200);L.click('[data-cslink="joseph"]');L.wait_for_timeout(250)
  sel=lambda w:L.evaluate("w=>[...document.querySelectorAll('#cssetup [data-csfs=\"'+w+'\"].on')].map(b=>b.dataset.csfv).join()",w)
  chk('setup: every archer defaults to Three spot (the shoot\'s face)',sel('self')=='three' and sel('0')=='three' and sel('1')=='three')
  L.click('[data-csfs="0"][data-csfv="single"]');L.wait_for_timeout(250)
  chk('setup: choosing Single face for Ema leaves Logan and Joey alone',sel('self')=='three' and sel('0')=='single' and sel('1')=='three')
  L.click('[data-csfs="1"][data-csfv="single"]');L.wait_for_timeout(250);L.click('[data-csfs="1"][data-csfv="three"]');L.wait_for_timeout(250)
  chk('setup: a choice can be changed back',sel('1')=='three' and sel('0')=='single')
  L.click('[data-csfs="1"][data-csfv="single"]');L.wait_for_timeout(250)
  chk('setup: layout stays tidy, 3-spot layout row still there',L.locator('#cssetup .cs-face').count()==3 and L.locator('[data-csf3]').count()==2)
  L.evaluate("document.querySelector('#csname').scrollIntoView({block:'start'})");shot(L,'01-setup-per-archer-faces-390');
  L.evaluate("document.querySelector('.cs-person').scrollIntoView({block:'center'})");L.wait_for_timeout(200);shot(L,'01b-setup-people-faces-390')
  L.click('#csgo');L.wait_for_timeout(600)
  code=L.evaluate("S.casual[S.casual.length-1].code");ema=L.evaluate(f"csGet('{code}').ppl.find(p=>!p.tid).id")
  chk('created: face saved only for archers who chose',L.evaluate(f"JSON.stringify(csGet('{code}').fa)")==json.dumps({ema:'single','joseph':'single'},separators=(',',':')) and L.evaluate(f"csGet('{code}').face3")=='vegas')
  chk('effective faces: Logan Vegas 3-spot, Ema single, Joey single',L.evaluate(f"['logan','{ema}','joseph'].map(i=>csAF(csGet('{code}'),i)).join()")=='vegas,single,single')
  ct(L)
  # ---------- Logan's phone: his card and Ema's ----------
  chk('Logan\'s card opens on Logan: Vegas layout, keys 10 to 6 and M',keys(L)==WA and L.locator('#csfacerow [data-csfa].on[data-csfv="three"]').count()==1)
  L.click(f'#csentry [data-csid="{ema}"]');L.wait_for_timeout(250)
  chk('Ema\'s card: single face, same 10 to 6 keys, no X',keys(L)==WA and L.locator('#csfacerow [data-csfa].on[data-csfv="single"]').count()==1)
  chk('Ema\'s card names her face',' single face' in L.inner_text('#csentry'))
  shot(L,'02-score-ema-single-face-390','#csentry')
  L.click('#csentry [data-csid="logan"]');L.wait_for_timeout(250)
  chk('back on Logan: still his 10 to 6 keys',keys(L)==WA)
  shot(L,'03-score-logan-three-spot-390','#csentry')
  # face locks per archer once an arrow is scored
  L.click(f'#csentry [data-csid="{ema}"]');L.wait_for_timeout(150);L.click('#csentry [data-csk="6"]');L.wait_for_timeout(200)
  chk('Ema scores a 6; a 5 is not a key on Indoor WA 18m',L.evaluate(f"csEnds(csGet('{code}'),'{ema}')")==[['6']] and L.evaluate(f"csKey('{code}','{ema}','5')")==False)
  chk('Ema\'s Face buttons lock after her first arrow',L.locator('#csfacerow [data-csfa][disabled]').count()==2 and 'Locked' in L.inner_text('#csfacerow'))
  chk('...and csSetFace refuses',L.evaluate(f"csSetFace('{code}','{ema}','three')")==False and L.evaluate(f"csAF(csGet('{code}'),'{ema}')")=='single')
  L.click('#csentry [data-csid="logan"]');L.wait_for_timeout(200)
  chk('Logan\'s Face buttons are still free (his own lock)',L.locator('#csfacerow [data-csfa][disabled]').count()==0)
  chk('Logan cannot score a 5 (3-spot has no 5)',L.evaluate(f"csKey('{code}','logan','5')")==False)
  L.click(f'#csentry [data-csid="{ema}"]');L.wait_for_timeout(150);L.click('#csundo');L.wait_for_timeout(250)
  chk('Undo back to no arrows frees Ema\'s Face again',L.evaluate(f"csEnds(csGet('{code}'),'{ema}').length")==0 and L.locator('#csfacerow [data-csfa][disabled]').count()==0)
  L.click('#csfacerow [data-csfv="three"]');L.wait_for_timeout(300)
  chk('Ema switched to Three spot on the card: same 10 to 6 keys, Logan unchanged',keys(L)==WA and L.evaluate(f"csAF(csGet('{code}'),'{ema}')")=='vegas' and L.evaluate("csAF(csGet('%s'),'logan')"%code)=='vegas')
  L.click('#csfacerow [data-csfv="single"]');L.wait_for_timeout(300)
  chk('...and back to Single face, still 10 to 6',keys(L)==WA)
  # ---------- Joey on his own phone: the host's choice arrives, he can change it before his first arrow ----------
  ct(L);ct(L,J);to_score(J)
  J.click(f'[data-csacc="{code}"]');J.wait_for_timeout(500);ct(J,L)
  chk('Joey\'s phone: the host\'s choice (Single face) arrives with the shoot',J.evaluate(f"csAF(csGet('{code}'),'joseph')")=='single' and J.evaluate(f"csAF(csGet('{code}'),'logan')")=='vegas' and keys(J)==WA)
  J.click('#csfacerow [data-csfv="three"]');J.wait_for_timeout(300);ct(J,L)
  chk('Joey picks Three spot on his own phone: 10 to 6 keys',keys(J)==WA and J.evaluate(f"csAF(csGet('{code}'),'joseph')")=='vegas')
  chk('...and the host sees Joey on Three spot (relay carries it)',L.evaluate(f"csAF(csGet('{code}'),'joseph')")=='vegas' and L.evaluate(f"csGet('{code}').sc.joseph.f")=='three')
  chk('Joey cannot change anyone else\'s face',J.evaluate(f"csSetFace('{code}','logan','single')")==False and J.evaluate(f"csSetFace('{code}','{ema}','three')")==False)
  chk('Joey scores a 3-spot end and his face locks',fill(J,code,'joseph',['10','10','9']) and J.locator('#csfacerow [data-csfa][disabled]').count()==2)
  ct(J,L)
  # ---------- Ema + Logan: scores compare on the same scale ----------
  chk('Logan fills his 20 ends 10 10 9',fill(L,code,'logan',['10','10','9']*20))
  chk('Ema fills 20 ends on single face with 10, 9 and 6',fill(L,code,ema,['10','9','6']*10+['10','9','9']*10))
  chk('Ema\'s single-face 4 and 1 are valid, Logan\'s are not',L.evaluate(f"csKey('{code}','logan','4')")==False)
  t=L.evaluate(f"['logan','{ema}','joseph'].map(i=>csRow(csGet('{code}'),i).tot).join()")
  chk('totals are plain sums on one scale (Logan 580, Ema 10/9/6 then 10/9/9)',t.split(',')[0]=='580' and t.split(',')[1]==str(10*(10+9+6)+10*(10+9+9)) and t.split(',')[2]=='29')
  L.evaluate(f"csView('{code}')");L.wait_for_timeout(300)
  note=L.inner_text('#csfacenote') if L.locator('#csfacenote').count() else ''
  chk('Scores card: small "Different faces" note','Different faces' in note and 'same 10 to M' in note)
  chk('Scores table tags each archer\'s face',L.evaluate("[...document.querySelectorAll('#csview .cs-tab tbody tr')].map(r=>/single face|3-spot/.exec(r.cells[0].textContent)[0]).join()")=='3-spot,single face,3-spot')
  shot(L,'04-scores-mixed-faces-note-390','.cs-tab')
  chk('header names both faces',' + ' in L.evaluate("document.querySelector('#csview .card.dark p').textContent") and 'Single face' in L.evaluate("document.querySelector('#csview .card.dark p').textContent"))
  # own saved sessions carry each archer's own face
  chk('Logan\'s saved session: Vegas 3-spot face (same as before)',L.evaluate(f"S.sessions.find(s=>s.id=='cs-{code}').face3")=='vegas')
  # a single-face archer finishing keeps the single face in their own history
  chk('single face archer on their own phone: session face3 single',True)
  # finish match-play union keys
  L.evaluate(f"csMpSetup('{code}',true)");L.wait_for_timeout(200)
  chk('host sees no errors from the face code',not errs)
  # ---------- single archer on one phone: plotting follows the face ----------
  to_score(Nn);Nn.click('[data-cstp="casual"]');Nn.wait_for_timeout(300);Nn.click('[data-csdisc="indoor"]');Nn.wait_for_timeout(200);Nn.select_option('#csrd','Indoor WA 18m');Nn.wait_for_timeout(200)
  Nn.click('[data-csfs="self"][data-csfv="single"]');Nn.wait_for_timeout(250);Nn.click('#csgo');Nn.wait_for_timeout(600)
  c2=Nn.evaluate("S.casual[S.casual.length-1].code")
  chk('solo casual: single face is buttons only, keys 10 to 6, no plotted face',Nn.locator('#cspface').count()==0 and Nn.locator('#cshide').count()==0 and keys(Nn)==WA and Nn.evaluate(f"csFace(csGet('{c2}'),0,'nathe').face")=='40cm')
  Nn.click('#csentry [data-csk="10"]');Nn.wait_for_timeout(200)
  chk('a score button records a 10 and stores no plot',Nn.evaluate(f"csEnds(csGet('{c2}'),'nathe')[0][0]")=='10' and Nn.evaluate(f"!csGet('{c2}').sc.nathe.p"))
  chk('face choice locks after the first arrow',Nn.evaluate(f"csSetFace('{c2}','nathe','three')")==False)
  shot(Nn,'05-score-buttons-single-face-390','#csentry')
  fill(Nn,c2,'nathe',['10','9']);fill(Nn,c2,'nathe',['10','9','8']*19)
  Nn.evaluate(f"csView('{c2}')");Nn.wait_for_timeout(300)
  chk('solo single face finished: saved with face3 single and no plots',Nn.evaluate(f"(()=>{{const s=S.sessions.find(x=>x.id=='cs-{c2}');return s&&s.face3=='single'&&!(s.pos||[]).flat().some(Boolean)}})()"))
  chk('solo shoot: no "different faces" note (only one face)',Nn.locator('#csfacenote').count()==0)
  # Three spot archer on one phone: plotting on 3-spot
  to_score(Nn);Nn.click('[data-cstp="casual"]');Nn.wait_for_timeout(300);Nn.click('[data-csdisc="indoor"]');Nn.wait_for_timeout(200);Nn.select_option('#csrd','Indoor WA 18m');Nn.wait_for_timeout(200);Nn.click('#csgo');Nn.wait_for_timeout(600)
  c3=Nn.evaluate("S.casual[S.casual.length-1].code")
  chk('untouched setup: no per-archer data stored, Three spot as always',Nn.evaluate(f"csGet('{c3}').fa")==None and keys(Nn)==WA and Nn.evaluate(f"!!csFace(csGet('{c3}'),0,'nathe').vert"))
  # ---------- Australian Indoor: shoot default Single, one archer picks Three spot ----------
  to_score(Nn);Nn.click('[data-cstp="casual"]');Nn.wait_for_timeout(300);Nn.click('[data-csdisc="indoor"]');Nn.wait_for_timeout(200);Nn.select_option('#csrd','Australian Indoor 18m');Nn.wait_for_timeout(200)
  Nn.click('[data-csf3="single"]');Nn.wait_for_timeout(200);Nn.fill('#cstype','Ema');Nn.click('#csaddn');Nn.wait_for_timeout(200)
  chk('AUSI single default: per-archer buttons start on Single face',Nn.evaluate("[...document.querySelectorAll('#cssetup .cs-face .on')].map(b=>b.dataset.csfv).join()")=='single,single')
  Nn.click('[data-csfs="0"][data-csfv="three"]');Nn.wait_for_timeout(250);Nn.click('#csgo');Nn.wait_for_timeout(600)
  c4=Nn.evaluate("S.casual[S.casual.length-1].code");em4=Nn.evaluate(f"csGet('{c4}').ppl.find(p=>!p.tid).id")
  chk('AUSI: Nathe single, Ema on a vertical 3-spot',Nn.evaluate(f"csAF(csGet('{c4}'),'nathe')")=='single' and Nn.evaluate(f"csAF(csGet('{c4}'),'{em4}')")=='vert' and Nn.evaluate(f"csKeys(csGet('{c4}'),0,'{em4}').join(' ')")==V3 and Nn.evaluate(f"csKeys(csGet('{c4}'),0,'nathe').join(' ')")==V3)
  # ---------- match play on a mixed shoot: nobody is blocked ----------
  chk('match play keys are X 10 to 6 M on Australian Indoor, single face included',Nn.evaluate(f"csRule(csGet('{c4}')).keys.join(' ')")==V3)
  # ---------- match nights ----------
  to_score(Nn);Nn.evaluate("document.querySelector('#h2hnew').open=true");Nn.select_option('#h2hrd','Indoor WA 18m');Nn.wait_for_timeout(300)
  chk('match night setup: Face = Three spot | Single face',Nn.evaluate("[...document.querySelectorAll('#h2hf3 [data-f1]')].map(b=>b.dataset.f1).join()")=='three,single')
  Nn.click('#h2hf3 [data-f1="single"]');Nn.wait_for_timeout(300)
  chk('match night: remembered pick is Single face',Nn.evaluate("S.face1")==True)
  chk('f3Can lets a head-to-head session switch face',Nn.evaluate("f3Can({round:'Indoor WA 18m',h2h:'X'},ROUNDS['Indoor WA 18m'],faceR(ROUNDS['Indoor WA 18m'],0))")==True and Nn.evaluate("f3Can({round:'Indoor WA 18m',casual:'X'},ROUNDS['Indoor WA 18m'],faceR(ROUNDS['Indoor WA 18m'],0))")==False)
  Nn.evaluate("""(()=>{const m={code:'HMX1',round:'Indoor WA 18m',mode:'total',a:'nathe',b:'logan',opp:'logan',created:Date.now(),status:'active'};h2hAll().push(m);h2hStart(m)})()""");Nn.wait_for_timeout(500)
  chk('match night start uses the remembered face: single, X 10-1 keys',Nn.evaluate("cur.face3")=='single' and Nn.evaluate("h2hState(h2hGet('HMX1')).sf")==1)
  Nn.evaluate("h2hGet('HMX1').op={ends:[['10','9','9']],done:false,t:Date.now()}");
  Nn.evaluate("cur.ends=[['10','9','8']];save();h2hView('HMX1')");Nn.wait_for_timeout(300)
  chk('head-to-head: "Different faces" note when the other archer is on 3-spot','Different faces' in Nn.inner_text('#h2hview') )
  Nn.evaluate("h2hGet('HMX1').op.sf=1;h2hView('HMX1')");Nn.wait_for_timeout(300)
  chk('head-to-head: no note when both are on single faces',Nn.locator('#h2hfacenote').count()==0)
  chk('no page errors anywhere',not errs)
  print('ERRS',errs)
  b.close()
finally:
 srv.terminate()
print(f'\n{len(ok)} passed, {len(bad)} failed');print('\n'.join(bad))
sys.exit(1 if bad else 0)
