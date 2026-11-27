# Head-to-head matches between testers on separate phones (separate browser contexts = separate localStorage), relay mocked in memory
# (no real ntfy traffic, no real score data: every context starts empty and is thrown away). Pairs: Joseph vs Logan (highest total)
# and Nate (colour-blind mode) vs Dana (set points). Also checks the indoor 3-spot faces (no Bugs Eyes off field rounds) and the
# 9-member ScoreTool Testers squad. Match night (group): 3 archers (invite + code box, ties, finish), 10 archers (#join= link,
# 2 simulated archers on the relay), the 11th refused, host close. Saves 390x844 screenshots to /workspace/h2h if it exists.
import subprocess,sys,time,os,json,re
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT='/workspace/h2h';SHOT=os.path.isdir(OUT)
srv=subprocess.Popen([sys.executable,'-m','http.server','8781'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
RELAY={};N=[0]
def relay(route,req):
  u=urlparse(req.url);parts=u.path.strip('/').split('/');topic=parts[0];L=RELAY.setdefault(topic,[])
  if req.method=='POST':
    N[0]+=1;L.append({'id':'m%06d'%N[0],'event':'message','topic':topic,'message':req.post_data or ''});return route.fulfill(status=200,body='{}',headers={'access-control-allow-origin':'*'})
  since=parse_qs(u.query).get('since',['all'])[0];out=[m for m in L if since=='all' or m['id']>since]
  route.fulfill(status=200,body='\n'.join(json.dumps(m) for m in out)+('\n' if out else ''),headers={'access-control-allow-origin':'*'})
NAMES={'joseph':'Jo Archer','logan':'Lee Archer','nate':'Nate Evans','dana':'Dee Archer','nathe':'Nathaniel Stride','phill':'Pat Archer','steven':'Sam Archer','michael':'Mik Archer','tahuri':'Tai Archer'}  # internal profile keys only, never shown
errs=[];DLG=[]
def phone(b,tid):
  ctx=b.new_context(viewport={'width':390,'height':844});ctx.route('https://ntfy.sh/**',relay)
  # each phone only knows its OWN display name; the others must arrive through the (mocked) relay
  ctx.add_init_script("for(const id of %s)if(id!='%s')localStorage.removeItem('scoretool.dname.'+id)"%(json.dumps(nm_seed.IDS),tid));pg=ctx.new_page()
  pg.on('pageerror',lambda e:errs.append(f'{tid}: {e}'));pg.on('dialog',lambda d:(DLG.append(d.message),d.accept()))
  pg.goto(f'http://localhost:8781/?tester={tid}');pg.wait_for_timeout(1200)
  pg.evaluate("n=>{S.unlocked=true;if(!S.profile)S.profile=n;save()}",NAMES[tid]);pg.reload();pg.wait_for_timeout(2200);return ctx,pg
def tick(pg):pg.evaluate("h2hTick(true)");pg.wait_for_timeout(500)
def keys(pg,E):
  if pg.locator('#addsc').count():pg.click('#addsc');pg.wait_for_timeout(250)
  for k in E:pg.click(f'.ad-pad [data-k="{k}"]');pg.wait_for_timeout(120)
  pg.evaluate("document.querySelector('#fpm')?.remove()");pg.click('#enext');pg.wait_for_timeout(250)
def challenge(pg,opp,mode):
  pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(400)
  pg.click('#h2hnew summary');pg.select_option('#h2hrd','Indoor WA 18m');pg.check(f'#h2hnew [data-h2hop="{opp}"]');pg.select_option('#h2hmd',mode)
  return pg
FILL="([E,fin])=>{const m=S.matches[S.matches.length-1],s=S.sessions.find(x=>x.id==m.sid);s.ends=E.map(e=>e.slice());s.pos=E.map(()=>[]);if(fin)s.finished=true;save()}"
# Labelled TEST ends (not real scores): deterministic pattern so each side's total is known
def ends(seed,n=20):
  P=['X','10','9','8','7','6'];out=[];x=seed
  for i in range(n):
    e=[];
    for a in range(3):x=(x*1103515245+12345)%2147483648;e.append(P[(x>>16)%4])
    out.append(sorted(e,key=lambda k:-(10.5 if k=='X' else int(k))))
  return out
val=lambda k:10 if k=='X' else int(k)
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  # ---------- Pair 1: Joseph vs Logan, highest total ----------
  cj,J=phone(b,'joseph');cl,L=phone(b,'logan')
  challenge(J,'logan','total')
  if SHOT:J.screenshot(path=OUT+'/1-start-match.png')
  chk('opponent list has every other archer (10: testers plus Darnie), not just the squad',J.locator('[data-h2hop]').count()==10 and J.locator('#h2hmdw').is_visible())
  chk('round list is the indoor rounds',J.eval_on_selector_all('#h2hrd option','o=>o.map(x=>x.value)')==['Indoor WA 18m','Australian Indoor 18m','Indoor WA 25m','Indoor WA Combined 25m + 18m','Vegas 300'])
  J.click('#h2hgo');J.wait_for_timeout(500)
  chk('Joseph: scorer opens with the match chip',J.locator('#h2hchip').count()==1 and 'vs' not in J.inner_text('#h2hchip').lower() or 'Zap' in J.inner_text('#h2hchip'))
  chk('invite sent to Logan\'s inbox',any('-in-logan' in t for t in RELAY))
  J.evaluate("h2hView(S.matches[S.matches.length-1].code)");J.wait_for_timeout(200)
  chk('1v1 waiting: opponent shown as invited',J.locator('#h2hview .h2hinvl').count()==1 and 'Waiting for Zap' not in J.inner_text('#h2hview') or J.locator('#h2hview .h2hinvl').count()==1)
  chk('1v1 waiting: no Remove while the match is open',J.locator('[data-h2hdel]').count()==0)
  J.evaluate("{const m=S.matches[S.matches.length-1];cur=S.sessions.find(s=>s.id==m.sid);sv='entry';score()}");J.wait_for_timeout(300)
  tick(L);L.evaluate("cur=null;sv='sheet';nav('score')");L.wait_for_timeout(400)
  chk('Logan sees "Joseph challenged you"','Joey challenged you' in L.inner_text('#h2hcard'))
  if SHOT:L.screenshot(path=OUT+'/2-invite.png')
  L.click('[data-h2hacc]');L.wait_for_timeout(500)
  chk('Logan: accepting starts his scorer on the same round','Indoor WA 18m' in L.inner_text('#roundname') and L.locator('#h2hchip').count()==1)
  keys(J,['10','10','9']);keys(L,['10','10','9'])
  tick(J);tick(L);tick(J)
  chk('Joseph sees Logan\'s end 1 live: chip 29 - 29','29 – 29' in J.inner_text('#h2hchip'))
  keys(J,['10','9','9']);tick(J);tick(L)
  chk('Logan sees Joseph ahead after end 2 (28 vs end not shot yet)','You 29 – 57 Joey' in L.inner_text('#h2hchip'))
  if SHOT:L.screenshot(path=OUT+'/3-scoring-live-chip.png')
  L.click('#h2hchip');L.wait_for_timeout(300)
  t=L.inner_text('#h2hview')
  chk('1v1: invited label goes once the opponent posts',J.locator('#h2hview .h2hinvl').count()==0)
  chk('match view shows end by end and running totals',"10 10 9" in t and '29 – 57' in t and "Joey has shot 2 ends" in t)
  if SHOT:L.screenshot(path=OUT+'/4-match-view-live.png')
  EJ=ends(11);EL=ends(23);EJ[0]=['X','10','9'];EJ[1]=['10','9','9'];EL[0]=['10','10','9']
  J.evaluate(FILL,[EJ,True]);L.evaluate(FILL,[EL,True])
  for _ in range(2):tick(J);tick(L)
  tj=sum(val(k) for e in EJ for k in e);tl=sum(val(k) for e in EL for k in e)
  J.evaluate("h2hView(S.matches[S.matches.length-1].code)");L.evaluate("h2hView(S.matches[S.matches.length-1].code)");J.wait_for_timeout(300)
  vj=J.inner_text('#h2hview');vl=L.inner_text('#h2hview')
  print('test totals',tj,tl)
  chk('both phones show the same final totals',f'{tj} – {tl}' in vj and f'{tl} – {tj}' in vl)
  w='J' if tj>tl else 'L' if tl>tj else 'D'
  chk('both agree on the winner',(w=='J' and '▲ You win' in vj and '▲ Joey wins' in vl) or (w=='L' and '▲ Zap wins' in vj and '▲ You win' in vl) or (w=='D' and ('Draw' in vj or 'decided' in vj)))
  if SHOT:J.screenshot(path=OUT+'/5-final-joseph.png',full_page=True);L.screenshot(path=OUT+'/6-final-logan.png')
  # ---------- indoor 3-spot faces (Joseph's phone) ----------
  J.evaluate("cur=null;sv='sheet';nav('score')");J.wait_for_timeout(300);J.select_option('#rd','Indoor WA 18m');J.click('#st');J.wait_for_timeout(400)
  body=J.inner_text('.ad')
  chk('Indoor 18m: no Bugs Eyes anywhere','Bugs' not in body and 'Bugs' not in J.inner_html('#fwrap'))
  chk('Indoor 18m: face button says Vertical 3-spot',J.inner_text('#face3')=='Face: Vertical 3-spot' and 'Vertical 3-spot' in J.get_attribute('#pface','aria-label'))
  chk('Indoor 18m: keys 10 9 8 7 6 M, no X',J.locator('.ad-pad button').all_inner_texts()==['10','9','8','7','6','M'])
  fills=set(re.findall(r'fill="(#[0-9a-f]+)"',J.inner_html('#pface')))
  chk('3-spot face is gold/red/blue only (no 5-1 zones) '+str(fills),fills<={'#ffd84d','#d62828','#2563eb','#fff'} and '#111' not in fills)
  chk('3 spots drawn',J.inner_html('#pface').count('r="0.030"')+J.inner_html('#pface').count('r="0.03"')==3)
  if SHOT:J.screenshot(path=OUT+'/7-indoor-vertical.png')
  J.click('#face3');J.wait_for_timeout(300)
  chk('tap switches to Vegas 3-spot',J.inner_text('#face3')=='Face: Vegas 3-spot' and 'Vegas' in J.get_attribute('#pface','aria-label'))
  chk('plot scoring on Vegas: spot centre X, edge 6, outside M',J.evaluate("[plotScore(-0.34,0.2,{tri:1}),plotScore(0.34,0.2+0.27,{tri:1}),plotScore(0,0,{tri:1}),plotScore(0,0.39,{vert:1})]")==['X','6','M','10'] or J.evaluate("[plotScore(-0.34,0.2,{tri:1}),plotScore(0.34,0.2+0.27,{tri:1}),plotScore(0,0,{tri:1})]")[:3]==['X','6','M'])
  bx=J.locator('#pface').bounding_box();J.mouse.click(bx['x']+bx['width']/2-0.34/1.34*bx['width'],bx['y']+bx['height']*((0.2+0.72)/1.25));J.wait_for_timeout(300)
  chk('tapping a Vegas spot centre on Indoor WA 18m scores 10, not X',J.locator('.ad-chips .adb').first.inner_text().strip()=='10')
  if SHOT:J.screenshot(path=OUT+'/8-indoor-vegas.png')
  chk('face choice remembered for the next indoor session',J.evaluate("S.face3")=='vegas')
  # old data: indoor session saved with the old Bugs Eyes flag + bug-layout positions -> vertical WA 3-spot, scores untouched
  J.evaluate("""cur=null;S.sessions.push({id:'h2htest-old1',date:'2026-10-01',round:'Indoor WA 18m',bugs:true,ends:[['6','5','4']],pos:[[{x:0,y:-0.62},{x:0.06,y:0},{x:0,y:0.75}]],note:'TEST'});
   S.sessions.push({id:'h2htest-old2',date:'2026-10-02',round:'Indoor WA 18m',ends:[['10','9','8']],pos:[[{x:0.05,y:0},{x:0.15,y:0},{x:0.25,y:0}]],note:'TEST'});save()""")
  J.evaluate("cur=S.sessions.find(s=>s.id=='h2htest-old1');sv='entry';score()");J.wait_for_timeout(300)
  chk('old Bugs-flag indoor session now shows the WA vertical 3-spot, scores kept','Vertical' in J.get_attribute('#pface','aria-label') and 'Bugs' not in J.inner_text('.ad') and J.evaluate("cur.ends[0].join()")=='6,5,4')
  J.evaluate("sv='sheet';score()");J.wait_for_timeout(200);chk('old Bugs-flag indoor sheet header not Bugs Eyes','Bugs' not in J.inner_text('.ad'))
  J.evaluate("cur=S.sessions.find(s=>s.id=='h2htest-old2');sv='entry';score()");J.wait_for_timeout(300)
  chk('old full-face plotted indoor session keeps its full 40cm face',J.get_attribute('#pface','aria-label')=='Target face, tap where the arrow landed')
  chk('group plot of a 3-spot session draws one spot',J.evaluate("plottedCard(S.sessions.find(s=>s.id=='h2htest-old1'))").count('<circle r=')>=5)
  J.evaluate("cur=null;S.sessions=S.sessions.filter(s=>!/^h2htest/.test(s.id));save()")
  # other non-field rounds: no Bugs Eyes; field rounds keep it, gold and black only
  J.evaluate("cur=null;sv='sheet';score()");J.select_option('#rd','WA 720 (70m)');J.click('#st');J.wait_for_timeout(300)
  chk('WA 720: no face toggle, no Bugs Eyes',J.locator('#bugface').count()==0 and J.locator('#face3').count()==0 and 'Bugs' not in J.inner_text('.ad'))
  J.evaluate("S.sessions=S.sessions.filter(s=>s!==cur);cur=null;sv='sheet';score()");J.select_option('#rd','WA Field 24 Marked');J.click('#st');J.wait_for_timeout(300)
  chk('field round still offers Bugs Eyes',J.inner_text('#bugface')=='Face: Field');J.click('#bugface');J.wait_for_timeout(300)
  ff=set(re.findall(r'fill="(#[0-9a-f]+)"',J.inner_html('#pface')))
  chk('field Bugs Eyes is gold and black only '+str(ff),J.inner_text('#bugface')=='Face: Bugs Eyes' and ff<={'#ffd84d','#111','#fff'})
  J.evaluate("S.sessions=S.sessions.filter(s=>s!==cur);cur=null;save()")
  # squad: all 10 testers (Darnie is not a tester)
  J.evaluate("nav('squad')");J.wait_for_timeout(500)
  chk('squad has all 10 testers',J.evaluate("S.squad.members.length")==10 and '10 members' in J.inner_text('.card.dark'))
  chk('weekly league lists 10',J.evaluate("leagueTable().length")==10)
  if SHOT:J.screenshot(path=OUT+'/9-squad-9-members.png')
  J.evaluate("S.squad.members=S.squad.members.slice(0,3);delete S.presetTop;save()");J.reload();J.wait_for_timeout(2200);J.evaluate("nav('squad')");J.wait_for_timeout(400)
  chk('an old 3-member tester squad is topped up to 10 once',J.evaluate("S.squad.members.length")==10 and J.evaluate("S.squad.code")=='STRIDE-3T7')
  J.evaluate("S.squad.members=S.squad.members.filter(m=>m.id!='m_estiaan'&&m.id!='m_steven');S.presetTop='all-testers';save()");J.reload();J.wait_for_timeout(2200);J.evaluate("nav('squad')");J.wait_for_timeout(400)
  mm=J.evaluate("S.squad.members.map(m=>m.id)");chk('a phone topped up before Estiaan joined gets him once; an admin removal still sticks','m_estiaan' in mm and 'm_steven' not in mm and len(mm)==9)
  # ---------- display names through the relay ----------
  REALN=['Nathaniel','Stride','Archer','Archer','Archer','Archer','Chapman','Archer','Archer','Archer','Evans','Archer','George Philip']
  msgs=[json.loads(m['message']) for L_ in RELAY.values() for m in L_]
  chk('relay never carries a real name',not any(n.lower() in json.dumps(msgs).lower() for n in REALN))
  inv=[m for m in msgs if m.get('k')=='inv'];st=[m for m in msgs if m.get('k')=='st']
  chk('invite carries only id, round, code, mode, display name',inv and all(set(m)<= {'k','code','round','mode','from','to','nm','nt','t'} for m in inv) and inv[0].get('nm')=='Joey')
  chk('match state carries only id, code, round, scores and display name',st and all(set(m)<= {'k','code','by','round','mode','a','b','ends','done','nm','nt','t'} for m in st))
  dirm=RELAY.get('scoretool-h2h-q7m4-names',[]);dm=[json.loads(m['message']) for m in dirm]
  chk('names directory topic: id + display name only',dm and all(set(m)<={'k','id','n','nt','t'} for m in dm) and {m['id']:m['n'] for m in dm}.get('joseph')=='Joey')
  chk('Logan learned Joey from the relay (not a real name)',L.evaluate("testerName('joseph')")=='Joey' and L.evaluate("testerName('steven')")=='Sporty')
  J.evaluate("cur=null;nav('home')");J.wait_for_timeout(300);chk("personal: Joseph's home greets him by real name","G'day Joseph" in J.text_content('#app'))
  for nm_,pg_ in (('Joseph',J),('Logan',L)):
    for v,sel in (('score','#h2hcard'),('squad','#app'),('rewards','#leaguecard')):
      pg_.evaluate(f"cur=null;nav('{v}')");pg_.wait_for_timeout(350)
      txt=pg_.evaluate("sel=>[...document.querySelectorAll(sel)].map(r=>r.innerText+' '+[...r.querySelectorAll('[value],[title],[aria-label],[placeholder]')].map(e=>[e.getAttribute('value'),e.title,e.getAttribute('aria-label'),e.placeholder].join(' ')).join(' ')).join(' ')",sel)
      bad_=[n for n in REALN if re.search(r'\b'+n+r'\b',txt)]
      chk(f'{nm_} {v}: no real names in the social view',not bad_)
      if bad_:print('   found',bad_)
  cj.close();cl.close()
  # ---------- Pair 2: Nate (colour-blind) vs Dana, set points ----------
  cn,Nt=phone(b,'nate');cd,D=phone(b,'dana')
  chk('Nate in colour-blind mode',Nt.evaluate("CB()"))
  challenge(Nt,'dana','sets');Nt.click('#h2hgo');Nt.wait_for_timeout(400)
  fills=set(re.findall(r'fill="(#[0-9a-f]+)"',Nt.inner_html('#pface')))
  bx=Nt.locator('#pface').bounding_box();Nt.mouse.click(bx['x']+bx['width']/2,bx['y']+bx['height']*0.5);Nt.wait_for_timeout(300)
  chk('Nate: indoor 3-spot plotted arrow shows its number (colour-blind)',Nt.locator('#pface text').count()==1)
  Nt.evaluate("cur.ends=[[]];cur.pos=[[]];save();score()")
  tick(D);D.evaluate("cur=null;sv='sheet';nav('score')");D.wait_for_timeout(300);D.click('[data-h2hacc]');D.wait_for_timeout(400)
  # sets: Nate 30,29,27,28 ; Dana 29,29,28,27 -> 2-0,3-1,3-3,5-3 then Nate 30 v 26 -> 7-3 Nate wins
  EN=[['X','10','10'],['10','10','9'],['9','9','9'],['10','9','9'],['X','X','10']];ED=[['10','10','9'],['10','10','9'],['10','9','9'],['9','9','9'],['9','9','8']]
  Nt.evaluate(FILL,[EN,False]);D.evaluate(FILL,[ED,False])
  for _ in range(2):tick(Nt);tick(D)
  Nt.evaluate("h2hView(S.matches[S.matches.length-1].code)");D.evaluate("h2hView(S.matches[S.matches.length-1].code)");Nt.wait_for_timeout(300)
  vn=Nt.inner_text('#h2hview');vd=D.inner_text('#h2hview')
  chk('set points: Nate 7 - 3, Nate wins on both phones','7 – 3' in vn and '▲ You win' in vn and '3 – 7' in vd and '▲ Navy wins' in vd)
  chk('draw set gives 1 each','3 – 1 (draw)' in vn)
  html=Nt.inner_html('#h2hview')
  chk('colour-blind safe: winner marked with ▲ and words, no red/green/purple in the match view',('▲' in vn) and not re.search(r'#(22c55e|16a34a|39ff14|d62828|dc2626|ef4444|7c3aed|8b5cf6|a855f7)',html))
  if SHOT:Nt.screenshot(path=OUT+'/10-nate-sets-final.png',full_page=True)
  cn.close();cd.close()
  # ---------- Match night: 3 archers ----------
  def post(topic,obj):N[0]+=1;RELAY.setdefault(topic,[]).append({'id':'m%06d'%N[0],'event':'message','topic':topic,'message':json.dumps(obj)})
  FG0="c=>{const m=h2hGet(c);if(m.sid)return false;h2hStart(m);return true}"
  def fg(pg,c,E,fin):
    if pg.evaluate(FG0,c):pg.wait_for_timeout(500)
    pg.evaluate(FG,[c,E,fin])
  FG="([c,E,fin])=>{const m=h2hGet(c);const s=S.sessions.find(x=>x.id==m.sid);s.ends=E.map(e=>e.slice());s.pos=E.map(()=>[]);if(fin)s.finished=true;save();cur=null;h2hView(c)}"
  def gv(pg,c):pg.evaluate(f"cur=null;h2hView('{c}')");pg.wait_for_timeout(250);return pg.inner_text('#h2hview')
  def ranks(pg):return pg.evaluate("[...document.querySelectorAll('.h2hrow')].map(d=>[d.querySelector('.rk').textContent,d.querySelector('.nm').textContent.replace(/\\s*\\(you\\)/,''),+d.querySelector('.tt').textContent,d.classList.contains('lead')])")
  GKEYS={'k','code','by','round','mode','g','ends','done','nm','nt','t','host','when','from','to','inv','need'}
  ch_,H=phone(b,'nathe');cp_,P=phone(b,'phill');cs_,St=phone(b,'steven')
  H.evaluate("cur=null;sv='sheet';nav('score')");H.wait_for_timeout(300);H.click('#h2hnew summary');H.select_option('#h2hrd','Indoor WA 18m')
  H.check('[data-h2hop="phill"]');H.check('[data-h2hop="steven"]')
  chk('group: scoring choice hidden with more than 1 opponent (highest total only)',not H.locator('#h2hmdw').is_visible() and H.inner_text('#h2hgo')=='Create match night')
  H.fill('#h2hwhen','2026-10-24T19:00');H.click('#h2hgo');H.wait_for_timeout(500)
  code=H.text_content('#h2hcode').strip();chk('group: host gets a match code and join link',len(code)==8 and H.input_value('#h2hlink').endswith('#join='+code))
  chk('group: date and time shown','24 Oct' in H.inner_text('#h2hview') and '7:00' in H.inner_text('#h2hview') and 'Live leaderboard' in H.text_content('#h2hview'))
  chk('wording: hint says You plus up to 9 others (10 archers max)','You plus up to 9 others (10 archers max).' in H.evaluate("h2hCard()"))
  chk('wording: leaderboard count "1 of 10 archers"','1 of 10 archers' in H.inner_text('#h2hview'))
  inv=H.evaluate("[...document.querySelectorAll('.h2hrow.inv')].map(d=>[d.querySelector('.rk').textContent,d.textContent])")
  chk('invited archers listed before they join: muted, no rank',len(inv)==2 and all(r[0]=='' and 'invited' in r[1] for r in inv))
  if SHOT:H.screenshot(path=OUT+'/11-group-created.png')
  tick(P);P.evaluate("cur=null;sv='sheet';nav('score')");P.wait_for_timeout(300)
  chk('group: invitee sees the host display name','Bullseye invited you to a match night' in P.inner_text('#h2hcard'))
  P.click('[data-h2hacc]');P.wait_for_timeout(800);chk('group: accept opens the leaderboard',P.locator('#h2hview').count()==1)
  tick(H);gv(H,code);chk('an invited archer becomes a normal row once they post',H.locator('.h2hrow.inv').count()==1 and H.locator('.h2hrow[data-h2hid="phill"]:not(.inv) .rk').count()==1)
  chk('the joiner sees the still-invited archer too',gv(P,code) and P.locator('.h2hrow.inv[data-h2hid="steven"]').count()==1)
  St.evaluate("cur=null;sv='sheet';nav('score')");St.wait_for_timeout(300);St.fill('#h2hjc',code.lower());St.click('#h2hjgo');St.wait_for_timeout(900)
  chk('group: join by typing the code',St.locator('#h2hview').count()==1 and St.evaluate(f"!!h2hGet('{code}')&&h2hGet('{code}').g==1"))
  fg(H,code,*[[['X','10','9'],['10','10','10']],False]);fg(P,code,*[[['10','10','9'],['9','9','9']],False]);fg(St,code,*[[['10','9','9'],['10','9','9']],False])
  for _ in range(2):
    for x in (H,P,St):tick(x)
  gv(H,code);rk=ranks(H);print('   ranks',rk)
  chk('group: live leaderboard rank, display name, total',rk[0][:3]==['1','▲ Bullseye',59] and sorted(r[1] for r in rk[1:])==['Coach P','Steady'] and all(r[2]==56 for r in rk[1:]))
  chk('group: ranking tie shown as =2',[r[0] for r in rk[1:]]==['=2','=2'])
  chk('group: leader marked ▲ plus blue',rk[0][3] and not any(r[3] for r in rk[1:]) and 'dbeafe' in open(os.path.join(ROOT,'style.css')).read())
  chk('group: ends done shown','2/20 ends' in H.inner_text('#h2hview'))
  H.locator('.h2hrow[data-h2hid="steven"] summary').click();H.wait_for_timeout(200)
  chk('group: tap a name to see their ends','End 1: 10 9 9' in H.inner_text('.h2hrow[data-h2hid="steven"]'))
  if SHOT:H.screenshot(path=OUT+'/12-group-live.png')
  fg(St,code,*[[['10','10','10'],['9','9','8']],False]);tick(St);tick(H);gv(H,code);rk=ranks(H)
  chk('group: equal totals split on 10s (Steady 3 tens beats Coach P 2)',[r[1] for r in rk]==['▲ Bullseye','Steady','Coach P'] and [r[0] for r in rk]==['1','2','3'])
  E20=lambda e:[e]*20
  fg(H,code,*[E20(['10','10','9']),True]);fg(P,code,*[E20(['10','10','10']),True]);fg(St,code,*[E20(['9','9','9']),True])
  for _ in range(2):
    for x in (H,P,St):tick(x)
  vh,vp=gv(H,code),gv(P,code)
  chk('group: final results once everyone has finished (no close needed)','Final results' in H.text_content('#h2hview') and '▲ Coach P wins' in vh and '▲ You win' in vp)
  chk('group: Close match button gone after the finish',H.locator('#h2hclose').count()==0)
  chk('wording: final count "3 of 10 archers"','3 of 10 archers' in vh and '3 of 10 archers' in H.evaluate("h2hCard()"))
  nS=H.evaluate("S.sessions.length");nd=len(DLG);H.click('[data-h2hdel]');H.wait_for_timeout(400)
  chk('remove: asks first, then removes the match from this phone only',len(DLG)==nd+1 and 'this phone' in DLG[-1] and H.evaluate(f"!h2hGet('{code}')") and P.evaluate(f"!!h2hGet('{code}')"))
  chk('remove: scoring session kept',H.evaluate("S.sessions.length")==nS and H.evaluate(f"S.sessions.some(s=>s.h2h=='{code}')"))
  P.evaluate("cur=null;sv='sheet';nav('score')");P.wait_for_timeout(300)
  chk('remove: quiet Remove button on a finished match in All matches',P.locator(f'#h2hcard [data-h2hdel="{code}"]').count()==1)
  P.click(f'#h2hcard [data-h2hdel="{code}"]');P.wait_for_timeout(400);chk('remove from the list works',P.evaluate(f"!h2hGet('{code}')") and P.locator(f'[data-h2hopen="{code}"]').count()==0)
  if SHOT:H.screenshot(path=OUT+'/13-group-final.png',full_page=True)
  gm=[json.loads(m['message']) for m in RELAY.get('scoretool-h2h-q7m4-'+code.lower(),[])]
  chk('group payloads: id, display name, round, code and scores only',gm and all(set(m)<=GKEYS for m in gm) and not any(n.lower() in json.dumps(gm).lower() for n in REALN))
  chk('group: no real names in any invite',not any(n.lower() in json.dumps([json.loads(m['message']) for t,L_ in RELAY.items() if '-in-' in t for m in L_]).lower() for n in REALN))
  ch_.close();cp_.close();cs_.close()
  # ---------- Match night: 10 archers, #join link, 11th refused, host close ----------
  ch_,H=phone(b,'logan');H.evaluate("cur=null;sv='sheet';nav('score')");H.wait_for_timeout(300);H.click('#h2hnew summary');H.click('#h2hgo');H.wait_for_timeout(500)
  code=H.text_content('#h2hcode').strip();link=H.input_value('#h2hlink');chk('group: code-only match (no ticks) is a match night',H.locator('#h2hview').count()==1 and len(code)==8)
  PH=[]
  for tid in ('joseph','michael','dana','tahuri','nate','phill','steven'):
    c_,g_=phone(b,tid);g_.goto(link.replace('http://localhost:8781/','http://localhost:8781/?tester=%s'%tid));g_.wait_for_timeout(1500)
    if not g_.locator('#h2hview').count():g_.reload();g_.wait_for_timeout(2500)
    PH.append((tid,c_,g_))
  print('   joined',[(t,g_.locator('#h2hview').count(),g_.url[-30:]) for t,_,g_ in PH]);chk('group: 7 archers joined from the #join link',all(g_.locator('#h2hview').count()==1 for _,_,g_ in PH))
  chk('group: join link cleared from the address bar',all('#join' not in g_.url for _,_,g_ in PH))
  topic='scoretool-h2h-q7m4-'+code.lower()
  for gid in ('guest1','guest2'):post(topic,{'k':'st','code':code,'by':gid,'round':'Indoor WA 18m','mode':'total','g':1,'ends':[['10','10','9']],'done':False,'t':1})
  cx,X=phone(b,'nathe');X.evaluate("cur=null;sv='sheet';nav('score')");X.wait_for_timeout(300);X.fill('#h2hjc',code);X.click('#h2hjgo');X.wait_for_timeout(900)
  chk('group: the 11th archer is refused','This match is full (10 archers).' in X.inner_text('#h2hjmsg') and X.locator('#h2hview').count()==0)
  chk('group: the refused archer posts nothing',not any(json.loads(m['message']).get('by')=='nathe' for m in RELAY.get(topic,[])))
  for i,(tid,_,g_) in enumerate(PH):fg(g_,code,*[[['10','9',str(9-i%3)]],False])
  for _ in range(2):
    for x in [H]+[g_ for _,_,g_ in PH]:tick(x)
  gv(H,code);rk=ranks(H);print('   ranks10',rk)
  chk('group: 10 archers on the host leaderboard',len(rk)==10)
  gr=[r[0] for r in rk if r[1].strip('▲ ')=='Tester'];chk('group: simulated archers with equal ends share a place',len(gr)==2 and gr[0]==gr[1] and gr[0].startswith('='))
  chk('group: no real names on the 10-archer board',not any(n.lower() in H.inner_text('#h2hview').lower() for n in REALN))
  if SHOT:H.screenshot(path=OUT+'/14-group-10.png',full_page=True)
  H.click('#h2hclose');H.wait_for_timeout(400);gv(H,code);chk('group: host close shows final results','Final results' in H.text_content('#h2hview') and 'closed by the host' in H.inner_text('#h2hview'))
  g_=PH[0][2];tick(g_);v=gv(g_,code);chk('group: other phones see the close and final results','Final results' in g_.text_content('#h2hview') and 'closed by the host' in v and g_.locator('#h2hback').count()==0)
  chk('group: Close match is host-only',g_.locator('#h2hclose').count()==0)
  chk('remove offered once the host closes',g_.locator('[data-h2hdel]').count()==1)
  for _,c_,_ in PH:c_.close()
  ch_.close();cx.close()
  chk('no page errors '+str(errs[:3]),not errs)
finally:
 srv.terminate()
print(f'h2h checks: PASS {len(ok)} FAIL {len(bad)}');[print(' FAIL',x) for x in bad];sys.exit(1 if bad else 0)
