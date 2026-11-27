# Onion Shed Challenge league: 6 x Vegas 300 (18 m, vertical 3-spot), cumulative ranking with X ties, missing weeks, mixed
# scoring groups (2 shared phones + individuals), move before scoring, duplicate-scorer guard + takeover, offline queue then sync,
# snapshot merge and catch-up after the relay expired, day-6 auto-seeded final (3x3, X=10, no 12, 1-arrow shoot-off + host pick),
# final scored on one phone and on own phones. Relay mocked in memory (no real ntfy traffic). TEST ends only.
import subprocess,sys,time,os,json,re
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT='/workspace/h2h';SHOT=os.path.isdir(OUT)
srv=subprocess.Popen([sys.executable,'-m','http.server','8785'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
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
NAMES={'joseph':'Jo Archer','logan':'Lee Archer','dana':'Dee Archer','nathe':'Nathaniel Stride','steven':'Sam Archer','michael':'Mik Archer'}
REALN=['Archer','Archer','Chapman','Stride','Archer','Nathaniel','Joseph','Archer','Archer']
errs=[];DLG=[]
def phone(b,tid):
  ctx=b.new_context(viewport={'width':390,'height':844});ctx.route('https://ntfy.sh/**',mk(tid))
  ctx.add_init_script("for(const id of %s)if(id!='%s')localStorage.removeItem('scoretool.dname.'+id)"%(json.dumps(nm_seed.IDS),tid));pg=ctx.new_page()
  pg.on('pageerror',lambda e:errs.append(f'{tid}: {e}'));pg.on('dialog',lambda d:(DLG.append(d.message),d.accept()))
  pg.goto(f'http://localhost:8785/?tester={tid}');pg.wait_for_timeout(1200)
  pg.evaluate("n=>{S.unlocked=true;if(!S.profile)S.profile=n;save()}",NAMES[tid]);pg.reload();pg.wait_for_timeout(2000);return ctx,pg
LT="(async()=>{while(lgBusy)await new Promise(r=>setTimeout(r,40));await lgTick(true)})()"
def lt(*P):
  for _ in range(2):
    for pg in P:pg.evaluate(LT)
def ht(pg):pg.evaluate("h2hTick(true)");pg.wait_for_timeout(400)
FILL="([c,w,id,E])=>{const lg=lgGet(c);lg.sc=lg.sc||{};(lg.sc[id]=lg.sc[id]||{})[w]={e:E,by:h2hMe(),u:Date.now(),f:'vert'};lg.dirty=1;save()}"
def E300(a,n=10):return [a]*n
TBL="c=>lgTable(lgGet(c)).map(r=>[r.id,r.t,r.x,r.rk,r.W.map(x=>x?x.s:null)])"
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  ch,H=phone(b,'nathe')
  # ---------- pure: ranking, X ties, missing weeks, merge ----------
  t=H.evaluate("""()=>{const W=(a,n)=>({e:Array(10).fill(a),u:1}),lg={order:['a','b','c','d'],sc:{a:{1:W(['X','10','9']),2:W(['X','10','10'])},b:{1:W(['X','X','9']),2:W(['X','X','10'])},c:{1:W(['10','10','9']),3:W(['X','10','10'])}}};
   return lgTable(lg).map(r=>[r.id,r.t,r.x,r.rk,r.W.map(x=>x?x.s:'-').join(' ')])}""")
  chk('league: equal totals split on X count',[r[0] for r in t][:2]==['b','a'] and t[0][1]==t[1][1]==590 and t[0][2]>t[1][2])
  chk('league: missing weeks shown as -, still counted from the weeks shot',t[2][0]=='c' and t[2][4]=='290 - 300 - - -' and t[2][1]==590-0 or t[2][4]=='290 - 300 - - -')
  chk('league: archer with no scores ranks last with 0',t[3][0]=='d' and t[3][1]==0)
  chk('league: Vegas 300 (18 m) round, vertical 3-spot, X=10, max 300',H.evaluate("(()=>{const R=ROUNDS['Vegas 300 (18 m)'];return R.blocks[0].dist==18&&R.blocks[0].unit=='m'&&R.max==300&&R.vegas&&R.league})()") and H.evaluate("ROUNDS['Vegas 300'].blocks[0].dist")==20)
  chk('league round not offered for match nights; Vegas 300 still is',H.evaluate("H2H_ROUNDS().includes('Vegas 300')&&!H2H_ROUNDS().includes('Vegas 300 (18 m)')"))
  mg=H.evaluate("""()=>{const lg={code:'ABCDEFGH',host:'h',order:['h'],sc:{x:{1:{e:[['X','X','X']],u:5,by:'x'}}}};const r=[];
   r.push(lgMerge(lg,{k:'ls',code:'ABCDEFGH',by:'y',sc:{x:{1:{e:'999',u:3,by:'y'}}},t:Date.now()}));r.push(lg.sc.x[1].e.flat().join());
   r.push(lgMerge(lg,{k:'ls',code:'ABCDEFGH',by:'y',sc:{x:{1:{e:'TTT/T99',u:9,by:'y'}}},t:Date.now()}));r.push(JSON.stringify(lg.sc.x[1].e));return r}""")
  chk('merge: an older entry never overwrites a newer one',mg[0]==True or mg[1]=='X,X,X')
  chk('merge: newest entry per archer per week wins',mg[1]=='X,X,X' and mg[3]=='[["10","10","10"],["10","9","9"]]')
  # ---------- create: real names in Who's in, Phill left out ----------
  H.evaluate("cur=null;sv='sheet';nav('score')");H.wait_for_timeout(300)
  lc=H.text_content('#lgcard')
  # go-live rule (22 Oct), UPDATED 27 Oct 2026 (stale by design: the Onion Shed Challenge is restored for its members): a new member sees only the restored Onion Shed Challenge (ONIONSH2); the format and final rules also sit in "New league"
  chk('go-live: new member sees the restored Onion Shed Challenge and nothing else',H.evaluate("(S.leagues||[]).map(l=>l.code)")==['ONIONSH2'] and 'Onion Shed Challenge' in lc)
  chk('league card: six 300s at 18 m on the vertical 3-spot, no Vegas','six 300s at 18 m on the vertical 3-spot' in lc.lower() and 'Vegas' not in lc)
  chk('final rules shown before a league is created','Final: 3 ends of 3 arrows, X = 10, no 12 dot. Ties: 1 arrow each, closest to the middle wins (host picks).' in lc)
  H.click('#lgnew summary')
  tk=H.evaluate("[...document.querySelectorAll('#lgnew .h2htk')].map(l=>l.textContent.trim())")
  chk("league setup lists testers by real name",'Lee Archer' in tk and 'Eli Archer' in tk and not any(x.startswith('Tester ') for x in tk))
  chk('Pat Archer is not in the league archer list',not any('Phill' in x for x in tk) and H.locator('#lgnew [data-lgop="phill"]').count()==0)
  H.click('#h2hnew summary');tk2=H.evaluate("[...document.querySelectorAll('#h2hnew .h2htk')].map(l=>l.textContent.trim())")
  chk("match setup lists real names, Phill still available there",'Pat Archer' in tk2 and 'Lee Archer' in tk2 and not any(x.startswith('Tester ') for x in tk2))
  H.click('#h2hnew summary')
  chk('go-live: league name has no default (host types it)',H.input_value('#lgname')=='')
  H.fill('#lgname','Onion Shed Challenge')
  for t_ in ['logan','joseph','steven','michael','dana']:H.check(f'#lgnew [data-lgop="{t_}"]')
  H.click('#lggo');H.wait_for_timeout(600);code=H.evaluate("S.leagues[S.leagues.length-1].code")
  chk('league created, week 1 current',H.locator('#lgview').count()==1 and 'Week 1 of 6 is current' in H.inner_text('#lgview'))
  PH={'nathe':H};CX={'nathe':ch}
  for t_ in ['logan','joseph','steven','michael','dana']:
    c_,g=phone(b,t_);CX[t_]=c_;PH[t_]=g;ht(g);g.evaluate("cur=null;sv='sheet';nav('score')");g.wait_for_timeout(300)
    g.click(f'[data-lgacc="{code}"]');g.wait_for_timeout(400)
  lt(*PH.values())
  chk('every phone has the 6 archers',all(len(g.evaluate(f"lgArchers(lgGet('{code}'))"))==6 for g in PH.values()))
  # ---------- mixed groups, week 1: shared phone 1 (logan, joseph), shared phone 2 (steven, michael), nathe + dana own phones ----------
  H.evaluate(f"lgView('{code}')");H.wait_for_timeout(200)
  chk('weekly screen: the one-phone / own-phone choice is a visible card near the top (not folded away)',H.locator('#lggrp').is_visible() and H.locator('#lggrp details').count()==0 and 'One phone or own phones?' in H.text_content('#lggrp') and H.evaluate("(()=>{const c=[...document.querySelectorAll('#lgview > .card')];return c.indexOf(document.querySelector('#lggrp'))<=3})()"))
  chk('default: everyone on own phone (shown ticked)',H.locator('#lggrp .lg-seg.on').count()==6 and all('Own phone' in t for t in H.locator('#lggrp .lg-seg.on').all_inner_texts()))
  if SHOT:H.screenshot(path=OUT+'/l0-week-scoring-choice.png')
  H.click('#lgallone');H.wait_for_timeout(200);chk('Everyone on one phone puts the whole league on phone 1',H.evaluate(f"lgGroups(lgGet('{code}'),1)")==[['nathe','logan','joseph','steven','michael','dana']] or sorted(H.evaluate(f"lgGroups(lgGet('{code}'),1)")[0])==sorted(['nathe','logan','joseph','steven','michael','dana']))
  H.click('#lgallown');H.wait_for_timeout(200);chk('Everyone on own phone clears the groups',H.evaluate(f"lgGroups(lgGet('{code}'),1)")==[])
  for t_,g in [('logan','0'),('joseph','0'),('steven','1'),('michael','1')]:H.click(f'#lggrp [data-lggb="{t_}"][data-g="{g}"]');H.wait_for_timeout(150)
  chk('groups saved: 2 shared phones',H.evaluate(f"lgGroups(lgGet('{code}'),1)")==[['logan','joseph'],['steven','michael']])
  chk('move an archer before they start: michael to shared phone 1',H.evaluate(f"lgSetGroups('{code}',1,[['logan','joseph','michael'],['steven']])"))
  lt(*PH.values())
  L=PH['logan'];L.evaluate(f"lgView('{code}')");L.wait_for_timeout(200)
  chk('a group member sees the shared-phone group',L.locator('[data-lgsg="0"]').count()==1 and 'Mick' in L.inner_text('#lgmine'))
  L.click('[data-lgsg="0"]');L.wait_for_timeout(200)
  chk('shared phone: chip switcher for the group (3 archers)',L.locator('#lgentry [data-lgid]').count()==3)
  chk('league scoring keys X 10 9 8 7 6 M, vertical 3-spot, 18 m',L.evaluate("[...document.querySelectorAll('#lgentry [data-lgk]')].map(b=>b.dataset.lgk)")==['X','10','9','8','7','6','M'] and 'Vertical 3-spot · 18 m' in L.inner_text('#lgentry'))
  L.click('[data-lgid="joseph"]');L.wait_for_timeout(100)
  for k in ['X','10','9']:L.click(f'#lgentry [data-lgk="{k}"]');L.wait_for_timeout(80)
  chk('after the third arrow the card moves on round the group by itself (auto-advance, the default since 31 Oct 2026)',L.evaluate("window._lgAct")=='michael' and L.locator('#lgnextarcher').count()==0)
  if SHOT:L.screenshot(path=OUT+'/l2-shared-phone.png',full_page=True)
  lt(*PH.values())
  # 26 Oct 2026 (Nathe): the host may move an archer who has started (this replaces the old 'can no longer move' rule); scores stay put
  sc0=H.evaluate(f"JSON.stringify(lgGet('{code}').sc)")
  chk('a started archer CAN be moved by the host, scores unchanged',H.evaluate(f"lgSetGroups('{code}',1,[['logan','michael'],['steven'],['joseph']])") and H.evaluate(f"JSON.stringify(lgGet('{code}').sc)")==sc0)
  chk('moved back before the next steps',H.evaluate(f"lgSetGroups('{code}',1,[['logan','joseph','michael'],['steven']])") and H.evaluate(f"JSON.stringify(lgGet('{code}').sc)")==sc0)
  chk('only the host can change groups',PH['logan'].evaluate(f"lgSetGroups('{code}',1,[['logan'],['joseph','michael','steven']])")==False)
  J=PH['joseph']
  chk("duplicate guard: joseph's own phone is refused for his locked week",J.evaluate(f"lgKey('{code}',1,'joseph','X')")==False and J.evaluate(f"lgLockedBy(lgGet('{code}'),1,'joseph')")=='logan')
  J.evaluate(f"lgView('{code}')");J.wait_for_timeout(150);J.click('[data-lgsg="0"]');J.wait_for_timeout(150);J.click('[data-lgid="joseph"]');J.wait_for_timeout(150)
  chk('locked archer shows whose phone, with a takeover option','Being scored on Zap' in J.inner_text('#lgentry') and J.locator('#lgtake').count()==1 and J.locator('#lgentry [data-lgk]').count()==0)
  J.click('#lgtake');J.wait_for_timeout(200)
  chk('takeover asks to confirm, then moves the week to this phone',any('Take over scoring here' in d for d in DLG) and J.evaluate(f"lgEnt(lgGet('{code}'),'joseph',1).by")=='joseph')
  lt(J,L);chk('the first phone is now refused for that archer',L.evaluate(f"lgKey('{code}',1,'joseph','10')")==False)
  # fill week 1: logan + michael on logan's phone, joseph on his own (took over), steven on his phone, nathe + dana own
  W1={'nathe':['X','10','10'],'logan':['10','10','9'],'joseph':['X','X','9'],'michael':['10','9','9'],'steven':['X','10','9'],'dana':['10','10','10']}
  J.evaluate(FILL,[code,1,'joseph',E300(W1['joseph'])])
  for t_ in ['logan','michael']:L.evaluate(FILL,[code,1,t_,E300(W1[t_])])
  H.evaluate(FILL,[code,1,'nathe',E300(W1['nathe'])]);PH['dana'].evaluate(FILL,[code,1,'dana',E300(W1['dana'])])
  # ---------- offline queue: steven scores offline ----------
  St=PH['steven'];OFF.add('steven');St.evaluate(f"lgView('{code}')");St.click('[data-lgsg="1"]');St.wait_for_timeout(150)
  for _ in range(10):
    for k in W1['steven']:St.click(f'#lgentry [data-lgk="{k}"]')
  lt(St);St.wait_for_timeout(200);St.evaluate(f"lgView('{code}')");St.wait_for_timeout(200)
  chk('offline: the 300 is kept and queued',St.evaluate(f"lgGet('{code}').qfail")==1 and 'Offline' in St.inner_text('#lgview'))
  lt(*[g for k,g in PH.items() if k!='steven'])
  chk('offline: other phones do not have it yet',H.evaluate(f"!lgEnt(lgGet('{code}'),'steven',1)"))
  OFF.discard('steven');St.evaluate("dispatchEvent(new Event('online'))");St.wait_for_timeout(800);lt(St)
  lt(*PH.values())
  chk('back online: the queue is sent and every phone has it',St.evaluate(f"lgGet('{code}').qfail")==0 and all(g.evaluate(f"lgTot(lgEnt(lgGet('{code}'),'steven',1).e)")==290 for g in PH.values()))
  chk('week 1 done by all: week 2 is current',H.evaluate(f"lgWeek(lgGet('{code}'))")==2)
  # ---------- weeks 2-5, michael misses week 2, dana away (catch-up later) ----------
  OFF.add('dana')
  for t_ in ['nathe','logan','joseph','steven']:PH[t_].evaluate(FILL,[code,2,t_,E300(['X','10','9'])])
  lt(*[g for k,g in PH.items() if k!='dana'])
  H.evaluate(f"lgView('{code}')");H.wait_for_timeout(150)
  chk('host can move on when someone misses a week',H.locator('#lgnext').count()==1);H.click('#lgnext');H.wait_for_timeout(200)
  for w in (3,4,5):
    for t_ in ['nathe','logan','joseph','steven','michael']:PH[t_].evaluate(FILL,[code,w,t_,E300(['X','10','9'] if t_!='logan' else ['X','X','10'])])
    lt(*[g for k,g in PH.items() if k!='dana'])
    if w<5:H.evaluate(f"(()=>{{const lg=lgGet('{code}');lg.cw={w+1};lg.cwt=Date.now();lg.dirty=1;save()}})()");lt(H)
  H.evaluate(f"(()=>{{const lg=lgGet('{code}');lg.cw=6;lg.cwt=Date.now();lg.dirty=1;save()}})()");lt(*[g for k,g in PH.items() if k!='dana'])
  tb=H.evaluate(TBL,code);row=lambda i:next(r for r in tb if r[0]==i)
  chk('missing week shown as - (michael W2, dana W2-5)',row('michael')[4][1] is None and row('dana')[4][1:5]==[None]*4)
  chk('league table ranks by cumulative total',[r[0] for r in tb][0]=='logan' and row('logan')[1]==290*2+300*3 and tb==sorted(tb,key=lambda r:(-r[1],-r[2])))
  # ---------- catch-up after expiry ----------
  RELAY.clear();OFF.discard('dana');D=PH['dana'];lt(D)
  chk('away phone: nothing to read after the relay expired',D.evaluate(f"lgEnt(lgGet('{code}'),'logan',3)")==None)
  H.reload();H.wait_for_timeout(3500);lt(H);lt(D)
  chk('catch-up: the host re-posts a full snapshot on open and the away phone gets every week',D.evaluate(TBL,code)==H.evaluate(TBL,code) and D.evaluate(f"lgWeek(lgGet('{code}'))")==6)
  msgs=[json.loads(m['message']) for L_ in RELAY.values() for m in L_]
  chk('snapshots fit ntfy message size (split in parts)',all(len(json.dumps(m))<4000 for m in msgs))
  # ---------- day 6 together: auto-seeded final ----------
  for t_ in ['nathe','logan','joseph','steven','michael','dana']:PH[t_].evaluate(FILL,[code,6,t_,E300(['X','10','10'] if t_ in('nathe','dana') else ['X','10','9'])])
  lt(*PH.values());lt(*PH.values())
  seeds=[g.evaluate(f"(h2hGet('{code}F')||{{su:{{}}}}).su.seeds") for g in PH.values()]
  tb=H.evaluate(TBL,code)
  chk('day 6 complete: one shoot-up final seeded from the league totals, same on every phone',seeds[0]==[r[0] for r in tb] and all(s==seeds[0] for s in seeds))
  if SHOT:H.evaluate(f"lgView('{code}')");H.wait_for_timeout(200);H.screenshot(path=OUT+'/l1-league-table.png',full_page=True)
  H.evaluate(f"lgView('{code}')");H.wait_for_timeout(150)
  chk('no Vegas anywhere in the league text (table, final)','VEGAS' not in H.inner_text('#lgview').upper())
  chk('league is called Onion Shed Challenge (not Championships)','ONION SHED CHALLENGE' in H.inner_text('#lgview').upper() and 'CHAMPIONSHIPS' not in H.inner_text('body').upper())
  fc=code+'F';S0=seeds[0]
  A,B_=H.evaluate(f"[suLadder(h2hGet('{fc}'))[0].A,suLadder(h2hGet('{fc}'))[0].B]")
  chk('final ladder: lowest seed v second lowest',A==S0[-1] and B_==S0[-2])
  PA,PB=PH[A],PH[B_]
  PA.evaluate(f"suMatchView('{fc}',0)");PA.wait_for_timeout(200)
  chk('league final: no Vegas in the text, vertical 3-spot face','VEGAS' not in PA.inner_text('#suview').upper() and PA.locator('#suview .su-face.su-vert').count()==1 and 'Vegas' not in PA.get_attribute('#suview .su-face','aria-label'))
  chk('league final rules: 3 ends of 3, X=10, no 12 dot, no Call 12, max 90','max 90' in PA.inner_text('#suview') and PA.locator('[data-suk="12"]').count()==0 and PA.locator('[data-sucall]').count()==0 and PA.locator('#su12').count()==0 and PA.evaluate("suMax(SU_LEAGUE)")==90)
  chk('match mode choice offered to the pair before the first arrow',PA.locator('[data-sumode="one"]').count()==1)
  PA.click('[data-sumode="one"]');PA.wait_for_timeout(200);ht(PB);ht(PA)
  chk('one phone: both archers scored on the chooser\'s phone',PA.locator('[data-suact]').count()==2 and PB.evaluate(f"suCanKey(h2hGet('{fc}'),0,'10','{B_}')")==False and 'Scored on one phone' in (PB.evaluate(f"suMatchView('{fc}',0)") or PB.inner_text('#suview')))
  for k in ['X','10','10']*3:PA.evaluate(f"suKey('{fc}',0,'{k}','{A}')")
  for k in ['9','9','9']*3:PA.evaluate(f"suKey('{fc}',0,'{k}','{B_}')")
  ht(PA);ht(PB);ht(H)
  chk('one phone: result reaches the other phones',H.evaluate(f"suLadder(h2hGet('{fc}'))[0].res.winner")==A and PB.evaluate(f"suLadder(h2hGet('{fc}'))[0].res.winner")==A)
  # match 1: own phones, tie -> 1 arrow each, same ring -> host picks closest to centre
  A1,B1=H.evaluate(f"[suLadder(h2hGet('{fc}'))[1].A,suLadder(h2hGet('{fc}'))[1].B]");P1,Q1=PH[A1],PH[B1]
  P1.evaluate(f"suMatchView('{fc}',1)");P1.wait_for_timeout(150);P1.click('[data-sumode="own"]');P1.wait_for_timeout(150);ht(Q1)
  for k in ['X','10','9']*3:P1.evaluate(f"suKey('{fc}',1,'{k}')");Q1.evaluate(f"suKey('{fc}',1,'{k}')")
  for _ in range(2):
    for g in (P1,Q1,H):ht(g)
  r=H.evaluate(f"suLadder(h2hGet('{fc}'))[1].res")
  chk('own phones: tie goes to one shoot-off arrow each',r['phase']=='so' and P1.evaluate(f"suCanKey(h2hGet('{fc}'),1,'X')") and not P1.evaluate(f"suCanKey(h2hGet('{fc}'),1,'12')"))
  P1.evaluate(f"suKey('{fc}',1,'10')");chk('only one shoot-off arrow each',not P1.evaluate(f"suCanKey(h2hGet('{fc}'),1,'10')"))
  Q1.evaluate(f"suKey('{fc}',1,'10')")
  for _ in range(2):
    for g in (P1,Q1,H):ht(g)
  H.evaluate(f"suMatchView('{fc}',1)");H.wait_for_timeout(200)
  chk('same ring: host taps whose arrow was closest to centre',H.locator('[data-supk]').count()==2 and 'closest to centre' in H.inner_text('#suview'))
  if SHOT:H.screenshot(path=OUT+'/l3-final-pick.png',full_page=True)
  H.click(f'[data-supk="{B1}"]');H.wait_for_timeout(200);ht(H);ht(P1);ht(Q1)
  chk('host pick decides the match everywhere',all(g.evaluate(f"suLadder(h2hGet('{fc}'))[1].res.winner")==B1 for g in (H,P1,Q1)))
  for i in range(2,5):
    for g in PH.values():ht(g)
    Ai,Bi=H.evaluate(f"[suLadder(h2hGet('{fc}'))[{i}].A,suLadder(h2hGet('{fc}'))[{i}].B]")
    for k in ['10']*9:PH[Ai].evaluate(f"suKey('{fc}',{i},'{k}')");PH[Bi].evaluate(f"suKey('{fc}',{i},'9')")
    for _ in range(2):
      for g in PH.values():ht(g)
  chk('final shoot-up completes on every phone',all(g.evaluate(f"suDone(h2hGet('{fc}'))") for g in PH.values()))
  chk('standalone Lancaster rules unchanged (X=11, 12 on, max 136)',H.evaluate("suMax(SU_LANC)")==136 and H.evaluate("suVal('X')")==11)
  allm=json.dumps([m for L_ in RELAY.values() for m in L_]).lower()
  allm2=json.dumps([m for L_ in RELAY.values() for m in L_])
  hit=[n for n in REALN if n in allm2]
  if hit:print('   real names found:',hit)
  chk('relay: nicknames and ids only, no real names (case-sensitive; ids are lower case)',not hit)
  for c_ in CX.values():c_.close()
  chk('no page errors',not errs)
  if errs:print(errs[:6])
finally:
  srv.terminate()
print(f'\n{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
