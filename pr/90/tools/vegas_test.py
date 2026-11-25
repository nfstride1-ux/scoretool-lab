# Vegas 300 + shoot-up ladder (Lancaster style) + one-phone mode. Relay mocked in memory (no real ntfy traffic); every browser
# context starts empty and is thrown away; all scores are labelled TEST ends. Saves 390x844 screenshots to /workspace/h2h if it exists.
import subprocess,sys,time,os,json,re
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT='/workspace/h2h';SHOT=os.path.isdir(OUT)
srv=subprocess.Popen([sys.executable,'-m','http.server','8784'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
RELAY={};N=[0];NET=[]
def relay(route,req):
  NET.append(req.url)
  u=urlparse(req.url);topic=u.path.strip('/').split('/')[0];L=RELAY.setdefault(topic,[])
  if req.method=='POST':
    N[0]+=1;L.append({'id':'m%06d'%N[0],'event':'message','topic':topic,'message':req.post_data or ''});return route.fulfill(status=200,body='{}',headers={'access-control-allow-origin':'*'})
  since=parse_qs(u.query).get('since',['all'])[0];out=[m for m in L if since=='all' or m['id']>since]
  route.fulfill(status=200,body='\n'.join(json.dumps(m) for m in out)+('\n' if out else ''),headers={'access-control-allow-origin':'*'})
NAMES={'joseph':'Jo Archer','logan':'Lee Archer','nate':'Nate Evans','dana':'Dee Archer','nathe':'Nathaniel Stride','phill':'Pat Archer','steven':'Sam Archer','michael':'Mik Archer','tahuri':'Tai Archer'}
REALN=['Archer','Archer','Evans','Chapman','Stride','Archer','Archer','Archer','Nathaniel','Joseph','Tahuri']
errs=[];DLG=[]
def phone(b,tid,offline=False):
  ctx=b.new_context(viewport={'width':390,'height':844});ctx.route('https://ntfy.sh/**',relay)
  ctx.add_init_script("for(const id of %s)if(id!='%s')localStorage.removeItem('scoretool.dname.'+id)"%(json.dumps(nm_seed.IDS),tid));pg=ctx.new_page()
  pg.on('pageerror',lambda e:errs.append(f'{tid}: {e}'));pg.on('dialog',lambda d:(DLG.append(d.message),d.accept()))
  pg.goto(f'http://localhost:8784/?tester={tid}');pg.wait_for_timeout(1200)
  pg.evaluate("n=>{S.unlocked=true;if(!S.profile)S.profile=n;save()}",NAMES[tid]);pg.reload();pg.wait_for_timeout(2000)
  if offline:ctx.set_offline(True)
  return ctx,pg
def tick(pg):pg.evaluate("h2hTick(true)");pg.wait_for_timeout(450)
def newform(pg,rd):
  pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(350);pg.click('#h2hnew summary');pg.select_option('#h2hrd',rd);pg.wait_for_timeout(100)
LAD="""([n,res])=>{/* pure ladder: n seeds s1..sn (s1 best); res[i] = winner side 'A' or 'B' for match i (scores filled in) */
 const seeds=Array.from({length:n},(_,k)=>'s'+(k+1)),m={round:'Vegas 300',su:{seeds},lad:{}},W=Array(12).fill('10'),L=Array(12).fill('9');const out=[];
 for(let i=0;i<n-1;i++){const x=suLadder(m)[i];out.push([x.A,x.B]);if(i<res.length){m.lad[i]={[x.A]:{e:[W.slice(0,3),W.slice(3,6),W.slice(6,9),W.slice(9)].map((e,j)=>(res[i]=='A'?W:L).slice(j*3,j*3+3)),c:[],so:[]},[x.B]:{e:[0,1,2,3].map(j=>(res[i]=='B'?W:L).slice(j*3,j*3+3)),c:[],so:[]}}}}
 const LL=suLadder(m);return{pairs:out,fin:LL[LL.length-1].fin,winner:LL[LL.length-1].res.winner,done:suDone(m)}}"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  # ---------- Stage 1: Vegas 300 solo ----------
  c0,P0=phone(b,'nathe')
  R=P0.evaluate("ROUNDS['Vegas 300']")
  chk('Vegas 300: 10 ends of 3 at 20 yd on 40 cm, max 300',R['ends']==10 and R['ape']==3 and R['max']==300 and R['blocks'][0]['dist']==20 and R['blocks'][0]['unit']=='yd' and R['blocks'][0]['size']==40)
  chk('Vegas 300: X scores 10, 30 Xs = 300',P0.evaluate("endSum(['X','X','X'])")==30 and P0.evaluate("Array(10).fill(['X','X','X']).reduce((t,e)=>t+endSum(e),0)")==300 and P0.evaluate("endSum(['10','9','M'])")==19)
  P0.evaluate("S.lastRound='Vegas 300';cur={id:'svtest',date:today(),round:'Vegas 300',ends:[[]],pos:[[]],note:''};sv='entry';fix=null;nav('score')");P0.wait_for_timeout(500)
  pk=P0.evaluate("[...document.querySelectorAll('.ad-pad [data-k]')].map(b=>b.dataset.k)")
  chk('Vegas 300 solo: keys X 10 9 8 7 6 M (no 12)',pk==['X','10','9','8','7','6','M'])
  P0.evaluate("cur.ends=[['X','10','9'],['10','10','9'],['X','X','8'],[]];cur.pos=cur.ends.map(()=>[]);score()");P0.wait_for_timeout(300)
  P0.evaluate("document.querySelector(`.ad-pad [data-k='9']`).click()");P0.wait_for_timeout(200)
  t=P0.inner_text('#app')
  chk('Vegas 300 solo: header with the round info and "End 4 of 10"',all(x in P0.inner_text('.ad-head') for x in ('Vegas 300','20yd','40cm 3-spot')) and 'End 4 of 10' in P0.inner_text('#endno'))
  chk('Vegas 300 solo: the Ends so far card is gone (removed 26 Oct 2026), scoring pad and header still there',P0.locator('#vgtab').count()==0 and 'Ends so far' not in P0.text_content('#app') and P0.locator('.ad-pad').count()>=1 and 'End 4 of 10' in P0.text_content('#app').replace('\n',' '))
  chk('Vegas 300 solo: one triangle face, no Bonus 12 dot toggle','12 dot' not in t and P0.locator('#face3').count()==0)
  if SHOT:P0.screenshot(path=OUT+'/v1-vegas300-end.png')
  # seeding: score then X count
  sd=P0.evaluate("""()=>{const E=(x,n)=>Array.from({length:10},(_,k)=>k<n?['X','10','9']:['10','10','9']);const m={g:1,round:'Vegas 300',host:'nathe',order:['a','b','c'],ops:{a:{ends:E(0,1),done:true},b:{ends:E(0,4),done:true},c:{ends:Array(10).fill(['X','X','X']),done:true}},inv:[]};
   return h2hBoard(m).rows.map(r=>[r.id,r.tot])}""")
  chk('seeding: by 300 score, then X count (b with 4 Xs beats a with 1 X on 290)',[r[0] for r in sd]==['c','b','a'] and sd[1][1]==sd[2][1]==290)
  # ---------- shoot-up rules (pure) ----------
  ev=lambda a,b_,pick=None,ca=[],cb=[]:P0.evaluate("([a,b,p,ca,cb])=>suEval({e:a,c:ca,so:[]},{e:b,c:cb,so:[]},p,'A','B')",[a,b_,pick,ca,cb])
  chk('shoot-up: X scores 11, max 136 (12+11+11 per end)',P0.evaluate("suSum(['12','X','X'])*4")==136 and P0.evaluate("suVal('X')")==11)
  lad={n:P0.evaluate(LAD,[n,['A']*(n-1)]) for n in (2,3,6,10)}
  chk('ladder, 2 archers: just the final, seed 2 v seed 1',lad[2]['pairs']==[['s2','s1']] and lad[2]['done'])
  chk('ladder, 3 archers: s3 v s2, winner v s1',lad[3]['pairs']==[['s3','s2'],['s3','s1']] and lad[3]['winner']=='s3')
  chk('ladder, 6 archers: lowest seed climbs (5 matches, final v s1)',lad[6]['pairs']==[['s6','s5'],['s6','s4'],['s6','s3'],['s6','s2'],['s6','s1']])
  l10=P0.evaluate(LAD,[10,['B','A','B','A','B','A','B','A','B']])
  chk('ladder, 10 archers: 9 matches, winners move up, final against seed 1',len(l10['pairs'])==9 and l10['pairs'][0]==['s10','s9'] and l10['pairs'][1]==['s9','s8'] and l10['pairs'][2]==['s9','s7'] and l10['pairs'][8][1]=='s1' and l10['winner']=='s1')
  # ---------- Stage 2 multi-phone: 3 archers, own phones ----------
  ch,H=phone(b,'nathe');cp,P=phone(b,'phill');cs,St=phone(b,'steven')
  newform(H,'Vegas 300')
  chk('create: choice of own phones or one phone',H.locator('[name=h2hpm]').count()==2 and 'Each archer scores on their own phone' in H.inner_text('#h2hnew') and 'Score everyone on one phone' in H.inner_text('#h2hnew'))
  chk('create: Vegas shows the shooters count',H.locator('#h2hnw').is_visible())
  H.fill('#h2hneed','3');H.check('[data-h2hop="phill"]');H.check('[data-h2hop="steven"]');H.click('#h2hgo');H.wait_for_timeout(500)
  code=H.text_content('#h2hcode').strip()
  for x in (P,St):
    tick(x);x.evaluate("cur=null;sv='sheet';nav('score')");x.wait_for_timeout(300);x.click('[data-h2hacc]');x.wait_for_timeout(600)
  FG0="c=>{const m=h2hGet(c);if(m.sid)return false;h2hStart(m);return true}"
  FG="([c,E,fin])=>{const m=h2hGet(c);const s=S.sessions.find(x=>x.id==m.sid);s.ends=E.map(e=>e.slice());s.pos=E.map(()=>[]);if(fin)s.finished=true;save();cur=null;h2hView(c)}"
  def fg(pg,E,fin=True):
    if pg.evaluate(FG0,code):pg.wait_for_timeout(400)
    pg.evaluate(FG,[code,E,fin])
  E10=lambda a,n:[a]*n+[['10','10','9']]*(10-n)
  fg(H,E10(['X','X','X'],10));fg(P,E10(['X','10','9'],2),False)
  for _ in range(2):
    for x in (H,P,St):tick(x)
  chk('shoot-up waits until every archer has finished',not H.evaluate(f"!!h2hGet('{code}').su") and 'starts by itself' in H.inner_text('#h2hview'))
  chk('host can force the shoot-up (Start shoot-up now)',H.locator('#sustart').count()==1 and P.locator('#sustart').count()==0)
  chk('leaderboard status: finished / shooting',' · finished' in H.inner_text('#h2hview') and ' · shooting' in H.inner_text('#h2hview'))
  fg(P,E10(['X','10','9'],2));fg(St,E10(['10','X','9'],5))
  for _ in range(2):
    for x in (H,P,St):tick(x)
  m=H.evaluate(f"h2hGet('{code}').su")
  chk('auto-advance: shoot-up starts once all 3 finished, seeded by score then X',m and m['seeds']==['nathe','steven','phill'])
  chk('every phone has the same seeding',all(x.evaluate(f"(h2hGet('{code}').su||{{}}).seeds")==m['seeds'] for x in (P,St)))
  for x in (H,P,St):x.evaluate(f"h2hView('{code}')");x.wait_for_timeout(250)
  chk('ladder opens: seeding table and Final at top',H.locator('#suview').count()==1 and 'Final' in H.text_content('#suview') and 'Shoot-up order' in H.text_content('#suview'))
  if SHOT:H.screenshot(path=OUT+'/v2-ladder.png',full_page=True)
  # match 1: phill (seed 3) v steven (seed 2)
  chk('only the two archers in the current match can score it',P.evaluate(f"!!suMine(h2hGet('{code}'),0)") is not False and St.evaluate(f"suCanKey(h2hGet('{code}'),0,'10')") and not H.evaluate(f"suCanKey(h2hGet('{code}'),0,'10')"))
  P.evaluate(f"suMatchView('{code}',0)");P.wait_for_timeout(200)
  chk('match keys labelled 12 X 10 9 8 7 6 M',[P.locator(f'[data-suk="{k}"]').inner_text() for k in ['12','X','10','9','8','7','6','M']]==['12','X','10','9','8','7','6','M'])
  chk('match: 12 key off until Call 12',P.locator('[data-suk="12"]').is_disabled() and '12 call: available this end' in P.inner_text('#suview'))
  P.click('[data-sucall]');P.wait_for_timeout(200)
  chk('match: Call 12 enables the 12, once per end',not P.locator('[data-suk="12"]').is_disabled())
  P.click('[data-suk="12"]');P.wait_for_timeout(150)
  chk('match: call used for the rest of the end','12 call: used' in P.inner_text('#suview') and P.locator('[data-suk="12"]').is_disabled() and P.locator('[data-sucall]').is_disabled())
  for k in ['X','X']:P.click(f'[data-suk="{k}"]');P.wait_for_timeout(120)
  chk('match: next end the call is available again','12 call: available this end' in P.inner_text('#suview'))
  for k in ['10','10','10']*3:P.click(f'[data-suk="{k}"]');P.wait_for_timeout(80)
  chk('match: uncalled dot hit enters the ring (34+90=124)',P.evaluate(f"suSum(suFlat(suPeek(h2hGet('{code}'),0,'phill')))")==124)
  for k in ['10','10','9']*4:St.evaluate(f"suKey('{code}',0,'{k}')")
  for _ in range(2):
    for x in (H,P,St):tick(x)
  L=H.evaluate(f"suLadder(h2hGet('{code}')).map(x=>[x.A,x.B,x.res.winner])")
  chk('ladder advances: phill wins match 1 and moves up to face seed 1',L[0][2]=='phill' and L[1][:2]==['phill','nathe'])
  # final: tie into shoot-off then host pick
  for k in ['10']*12:H.evaluate(f"suKey('{code}',1,'{k}')");P.evaluate(f"suKey('{code}',1,'{k}')")
  for _ in range(2):
    for x in (H,P):tick(x)
  r=H.evaluate(f"suLadder(h2hGet('{code}'))[1].res")
  chk('tie goes to a shoot-off',r['phase']=='so')
  chk('shoot-off arrow 1: 12 in play (called)',H.evaluate(f"suCanKey(h2hGet('{code}'),1,'12')"))
  for k in ['12','X','10']:
    H.evaluate(f"suKey('{code}',1,'{k}')");tick(H);tick(P);P.evaluate(f"suKey('{code}',1,'{k}')");tick(P);tick(H)
    if k=='X':chk('shoot-off arrow 3: no 12',not H.evaluate(f"suCanKey(h2hGet('{code}'),1,'12')"))
  r=H.evaluate(f"suLadder(h2hGet('{code}'))[1].res")
  chk('still tied after 3 shoot-off arrows: host to judge closest to X',r['needPick'])
  H.evaluate(f"suMatchView('{code}',1)");H.wait_for_timeout(200)
  if SHOT:H.screenshot(path=OUT+'/v3-match.png',full_page=True)
  chk('host gets the pick buttons, others do not',H.locator('[data-supk]').count()==2 and (P.evaluate(f"suMatchView('{code}',1)") or P.locator('[data-supk]').count()==0))
  H.click('[data-supk="phill"]');H.wait_for_timeout(200);tick(H);tick(P);tick(St)
  chk('host pick decides the final, everyone sees it',all(x.evaluate(f"suDone(h2hGet('{code}'))") for x in (H,P,St)) and H.evaluate(f"suLadder(h2hGet('{code}'))[1].res.winner")=='phill')
  msgs=[json.loads(x['message']) for x in RELAY.get(H.evaluate(f"h2hTopic('{code}')"),[])]
  chk('relay: nicknames only, no real names',msgs and not any(n.lower() in json.dumps(msgs).lower() for n in REALN))
  chk('colour-blind safe: winner ▲, no purple in the shoot-up view','▲' in H.inner_text('#suview') and not re.search(r'#(7c3aed|8b5cf6|a855f7|9333ea)',H.inner_html('#suview')))
  for x in (ch,cp,cs):x.close()
  # ---------- One-phone Vegas: 4 shooters, offline ----------
  NET.clear();co,O=phone(b,'nathe',offline=True);n0=len(NET)
  newform(O,'Vegas 300');O.check('[name=h2hpm][value=one]');O.wait_for_timeout(100)
  chk('one-phone: invites hidden, name boxes shown',not O.locator('#h2hnew .h2hops').is_visible() and O.locator('[data-h2hnm]').count()==2 and O.inner_text('#h2hgo')=='Start one-phone match')
  O.fill('#h2hneed','4');O.dispatch_event('#h2hneed','input');O.wait_for_timeout(100)
  def names(L):
    for k,v in enumerate(L):O.fill(f'#h2hnm{k}',v)
    O.click('#h2hgo');O.wait_for_timeout(300);return O.evaluate("(document.querySelector('#h2hnerr')||{}).textContent||''")
  chk('one-phone: 4 name boxes',O.locator('[data-h2hnm]').count()==4)
  chk('one-phone: names must be unique within the match','already in this match' in names(['Robin','Ace','robin','Zed']))
  chk('one-phone: rude-word filter applies',names(['Robin','Ace','sh1t','Zed'])!='' and O.locator('#h2hview').count()==0)
  chk('one-phone: length rule applies','at least 2' in names(['Robin','A','Kit','Zed']))
  names(['Robin','Ace','Kit','Zed']);code=O.evaluate("S.matches[S.matches.length-1].code")
  chk('one-phone: match opens with the score card and switcher',O.locator('#lccard').count()==1 and O.locator('[data-lcid]').count()==4 and O.locator('#h2hcode').count()==0)
  def card(k3):
    for k in k3:O.click(f'#lccard [data-lck="{k}"]');O.wait_for_timeout(60)
  card(['X','10','9'])
  chk('one-phone: card goes round the line (next archer after an end)',O.evaluate(f"lcActive(h2hGet('{code}'))")=='p2' and 'Ace' in O.inner_text('#lccard b'))
  O.click('[data-lcid="p4"]');O.wait_for_timeout(150);card(['10']);O.click('#lcundo');O.wait_for_timeout(100)
  chk('one-phone: tap a chip to switch archer; undo',O.evaluate(f"h2hGet('{code}').ops.p4.ends.flat().length")==0)
  O.evaluate(f"""()=>{{const m=h2hGet('{code}'),F=(a,n)=>Array.from({{length:10}},(_,k)=>k<n?a:['10','10','9']);m.ops.p1.ends=F(['X','10','9'],10).slice(0,9);m.ops.p2.ends=F(['X','X','X'],10).slice(0,9);m.ops.p3.ends=F(['X','10','9'],3).slice(0,9);m.ops.p4.ends=F(['X','10','9'],3).slice(0,9);save();window._lcAct={{}};h2hView('{code}')}}""");O.wait_for_timeout(200)
  for _ in range(3):card(['10','10','9'])
  t=O.inner_text('#h2hview')
  chk('one-phone 300: status shows who has finished',t.count('finished')>=3 and O.evaluate(f"h2hGet('{code}').ops.p1.done") and not O.evaluate(f"!!h2hGet('{code}').su"))
  if SHOT:O.screenshot(path=OUT+'/v4-onephone-300.png',full_page=True)
  card(['10','10','9'])
  su=O.evaluate(f"(h2hGet('{code}').su||{{}}).seeds")
  chk('one-phone: auto-advance to the shoot-up when all finished, same seeding (score then X)',su==['p2','p1','p3','p4'] or su==['p2','p1','p4','p3'])
  chk('one-phone: ladder shows typed nicknames',O.locator('#suview').count()==1 and all(n in O.inner_text('#suview') for n in ['Robin','Ace','Kit','Zed']))
  lo,hi=su[3],su[2]
  O.evaluate(f"suMatchView('{code}',0)");O.wait_for_timeout(200)
  chk('one-phone match: both archers on one screen, each with their own Call 12',O.locator('.su-panel').count()==2 and O.locator('[data-sucall]').count()==2)
  O.click(f'[data-sucall="{lo}"]');O.wait_for_timeout(100);O.click(f'[data-sucall="{hi}"]');O.wait_for_timeout(100)
  chk('one-phone match: both calls registered separately',O.locator(f'[data-sucall="{lo}"]').is_disabled() and O.locator(f'[data-sucall="{hi}"]').is_disabled() and O.inner_text('#suview').count('12 call: called for the next arrow')==2)
  O.click('[data-suk="12"]');O.wait_for_timeout(100)   # to-shoot = lower seed first
  O.click(f'[data-suact="{hi}"]');O.wait_for_timeout(100);O.click('[data-suk="12"]');O.wait_for_timeout(100)
  s1=O.evaluate(f"[suPeek(h2hGet('{code}'),0,'{lo}').e[0],suPeek(h2hGet('{code}'),0,'{hi}').e[0]]")
  chk('one-phone match: each archer scored a called 12',s1==[['12'],['12']])
  chk('one-phone match: second 12 in the same end refused',not O.evaluate(f"suCanKey(h2hGet('{code}'),0,'12','{lo}')"))
  if SHOT:O.screenshot(path=OUT+'/v5-onephone-match.png',full_page=True)
  for k in ['X','X']+['10','9','9']*3:O.evaluate(f"suKey('{code}',0,'{k}','{lo}')")
  for k in ['9','9']+['9','9','9']*3:O.evaluate(f"suKey('{code}',0,'{k}','{hi}')")
  L=O.evaluate(f"suLadder(h2hGet('{code}')).map(x=>[x.A,x.B,x.res.winner])")
  chk('one-phone: ladder auto-advances (lowest seed wins, moves up)',L[0][2]==lo and L[1][:2]==[lo,su[1]])
  for i in (1,2):
    A,B=O.evaluate(f"[suLadder(h2hGet('{code}'))[{i}].A,suLadder(h2hGet('{code}'))[{i}].B]")
    for k in ['10']*12:O.evaluate(f"suKey('{code}',{i},'{k}','{A}')");O.evaluate(f"suKey('{code}',{i},'9','{B}')")
  chk('one-phone: shoot-up result after the final',O.evaluate(f"suDone(h2hGet('{code}'))") and O.evaluate(f"suLadder(h2hGet('{code}'))[2].res.winner")==lo)
  chk('one-phone: nothing sent to the relay (fully offline)',not any(code in u for u in NET[n0:]) and not any(code in t for t in RELAY))   # only this match counts; the phone's own league sync is separate
  # ---------- One-phone regular match night ----------
  newform(O,'Indoor WA 18m');O.check('[name=h2hpm][value=one]');O.wait_for_timeout(100)
  chk('one-phone match night: no shooters box needed beyond names',O.locator('[data-h2hnm]').count()==2)
  O.fill('#h2hneed','3');O.dispatch_event('#h2hneed','input');O.wait_for_timeout(100)
  for k,v in enumerate(['Robin','Ace','Kit']):O.fill(f'#h2hnm{k}',v)
  O.click('#h2hgo');O.wait_for_timeout(300);code=O.evaluate("S.matches[S.matches.length-1].code")
  chk('one-phone match night: full-face keys X to 1 and M',O.evaluate("[...document.querySelectorAll('#lccard [data-lck]')].map(b=>b.dataset.lck)")==['X','10','9','8','7','6','5','4','3','2','1','M'])
  card(['X','10','9']);card(['10','10','9']);card(['9','9','9'])
  rk=O.evaluate("[...document.querySelectorAll('.h2hrow')].map(d=>[d.querySelector('.rk').textContent,d.querySelector('.nm').textContent,+d.querySelector('.tt').textContent])")
  chk('one-phone match night: leaderboard ranks the typed names',[r[1].strip('▲ ') for r in rk]==['Robin','Ace','Kit'] and rk[0][0]=='1' and rk[0][2]==29)
  if SHOT:O.screenshot(path=OUT+'/v6-onephone-night.png',full_page=True)
  O.evaluate(f"""()=>{{const m=h2hGet('{code}');for(const id of m.order){{m.ops[id].ends=Array(20).fill(id=='p3'?['X','X','X']:['9','9','9']);m.ops[id].done=true}}save();h2hView('{code}')}}""");O.wait_for_timeout(200)
  chk('one-phone match night: final results once all finished','Final results' in O.text_content('#h2hview') and '▲ Kit wins' in O.inner_text('#h2hview'))
  chk('one-phone match night: removable once finished',O.locator('[data-h2hdel]').count()>=1)
  co.close();c0.close()
  chk('no page errors',not errs)
  if errs:print(errs[:5])
finally:
  srv.terminate()
print(f'\n{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
