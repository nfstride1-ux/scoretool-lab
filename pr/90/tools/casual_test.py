# Casual shoot (casual.js): setup choice (Just me / Casual / League), discipline faces and keys from the app's own round helpers,
# 1 to 10 people, freeform names, host-confirmed links (under-16s by nickname), linked archer scores on own phone, host scores a
# name-only friend, this shoot's scores only (no ranking), league table untouched, offline queue then sync, match play on/off
# (setup and after finishing), 'Do match play?' prompt, ladder seeded from the shoot's scores (finishers only, CS_SEED_FINISHED_ONLY), host scores the name-only friend
# in match play. Relay mocked in memory (no real ntfy traffic). TEST data only, never posted anywhere.
import subprocess,sys,time,os,json
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n,flush=True)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'screenshots');os.makedirs(OUT,exist_ok=True)
srv=subprocess.Popen([sys.executable,'-m','http.server','8786'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
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
NAMES={'logan':'Lee Archer','joseph':'Jo Archer','tahuri':'Tai Archer','nathe':'Nathaniel Stride'}
errs=[];DLG=[]
def phone(b,tid):
  ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);ctx.route('https://ntfy.sh/**',mk(tid))
  ctx.add_init_script("for(const id of %s)if(id!='%s')localStorage.removeItem('scoretool.dname.'+id)"%(json.dumps(nm_seed.IDS),tid));pg=ctx.new_page()
  pg.on('pageerror',lambda e:errs.append(f'{tid}: {e}'));pg.on('dialog',lambda d:(DLG.append(d.message),d.accept()))
  pg.goto(f'http://localhost:8786/?tester={tid}');pg.wait_for_timeout(1200)
  pg.evaluate("n=>{S.unlocked=true;if(!S.profile)S.profile=n;save()}",NAMES[tid]);pg.reload();pg.wait_for_timeout(2000);return ctx,pg
CT="(async()=>{while(csBusy)await new Promise(r=>setTimeout(r,40));await csTick(true)})()"
def ct(*P):
  for _ in range(2):
    for pg in P:pg.evaluate(CT);pg.wait_for_timeout(100)
def ht(*P):
  for _ in range(2):
    for pg in P:pg.evaluate("(async()=>{while(h2hBusy)await new Promise(r=>setTimeout(r,40));await h2hTick(true)})()");pg.wait_for_timeout(150)
def shot(pg,name,full=False):
  # the app scrolls inside #scroller, so a 'full' shot grows the phone-width window to the content height for the capture
  if full:
    h=pg.evaluate("(()=>{const s=document.getElementById('scroller');return Math.ceil(s.scrollHeight+(document.querySelector('header.top')||{offsetHeight:0}).offsetHeight+(document.getElementById('tabs')||{offsetHeight:0}).offsetHeight)})()")
    pg.set_viewport_size({'width':390,'height':max(844,min(h,6000))});pg.wait_for_timeout(150)
  pg.screenshot(path=os.path.join(OUT,'casual-'+name+'.png'))
  if full:pg.set_viewport_size({'width':390,'height':844});pg.wait_for_timeout(100)
def to_score(pg):pg.evaluate("cur=null;sv='sheet';window._csv=null;nav('score')");pg.wait_for_timeout(300)
def fill(pg,code,pid,arr):  # real key function, one arrow at a time
  return pg.evaluate("([c,p,A])=>A.map(k=>csKey(c,p,k)).every(Boolean)",[code,pid,arr])
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  cL,L=phone(b,'logan');cJ,J=phone(b,'joseph');cT,T=phone(b,'tahuri')
  # ---------- a league exists first, so we can prove the casual shoot never touches it ----------
  lgc=L.evaluate("(()=>{const lg=lgCreate('Onion Shed Challenge TEST',['joseph','tahuri'],[]);lg.sc={logan:{1:{e:Array(10).fill(['X','10','9']),u:Date.now(),by:'logan',f:'vert'}}};save();return lg.code})()")
  LGT=f"JSON.stringify(lgTable(lgGet('{lgc}')).map(r=>[r.id,r.t,r.x,r.rk,r.W]))"
  lg0=L.evaluate(LGT);lgs0=L.evaluate(f"JSON.stringify(lgGet('{lgc}').sc)")
  L.evaluate(f"lgView('{lgc}')");L.wait_for_timeout(200)
  # ---------- Score tab: the shoot-type choice ----------
  to_score(L)
  chk('Score tab asks what you are shooting: Just me / Casual shoot / League shoot',L.evaluate("[...document.querySelectorAll('[data-cstp]')].map(b=>b.textContent.replace('✓','').trim())")==['Just me','Casual shoot','League shoot'])
  chk('Just me is the default and keeps the normal Start button',L.locator('[data-cstp="solo"].on').count()==1 and L.locator('#st').count()==1)
  shot(L,'01-score-type')
  L.click('[data-cstp="league"]');L.wait_for_timeout(300)
  chk('League shoot points to the league card',L.locator('#csleague').count()==1 and L.locator('#lgcard').count()==1)
  L.click('[data-cstp="casual"]');L.wait_for_timeout(300)
  chk('Casual shoot shows the casual setup',L.locator('#cssetup').count()==1)
  # ---------- disciplines: rounds and faces from the app's own helpers ----------
  R=L.evaluate("({t:csRounds('target'),i:csRounds('indoor'),f:csRounds('field')})")
  print('ROUNDS',json.dumps(R))
  chk('Indoor = Indoor WA rounds + Vegas 300 + Lancaster (league 300 left out)',R['i']==['Indoor WA 18m','Australian Indoor 18m','Indoor WA 25m','Indoor WA Combined 25m + 18m','Vegas 300','Lancaster 660'])
  chk('Field = the 3 WA field rounds',R['f']==['WA Field 24 Marked','WA Field 24 Unmarked','WA Field 12 Unmarked + 12 Marked'])
  chk('Target = the outdoor and practice rounds, no indoor/field/league',all(r not in R['t'] for r in R['i']+R['f']+['Vegas 300 (18 m)']) and 'WA 720 (70m)' in R['t'] and 'WA 70/1440 (70/60/50/30m)' in R['t'])
  L.click('[data-csdisc="indoor"]');L.wait_for_timeout(200)
  chk('Indoor faces: only Vertical 3-spot and Vegas 3-spot',L.evaluate("[...document.querySelectorAll('[data-csf3]')].map(b=>b.dataset.csf3)")==['vert','vegas'])
  chk('Indoor WA 18m keys 10 9 8 7 6 M, no X (vertical)','keys 10 9 8 7 6 M' in L.inner_text('#csfacetxt') and 'X' not in L.inner_text('#csfacetxt').split('keys')[-1] and 'Vertical 3-spot' in L.inner_text('#csfacetxt'))
  L.click('[data-csf3="vegas"]');L.wait_for_timeout(200)
  chk('Indoor WA 18m keys 10 9 8 7 6 M, no X (Vegas layout)','keys 10 9 8 7 6 M' in L.inner_text('#csfacetxt') and 'X' not in L.inner_text('#csfacetxt').split('keys')[-1] and 'Vegas 3-spot' in L.inner_text('#csfacetxt'))
  L.click('[data-csf3="vert"]');L.wait_for_timeout(100)
  L.click('[data-csdisc="field"]');L.wait_for_timeout(200)
  chk('Field keys 6 5 4 3 2 1 M, gold 6/5, black 4-1, no blue or red',L.evaluate("csKeys({round:'WA Field 24 Marked'},0).join(' ')")=='6 5 4 3 2 1 M' and L.evaluate("['6','5','4','3','2','1','M'].map(k=>csKcol({disc:'field',round:'WA Field 24 Marked'},k)).join(' ')")=='k-y k-y k-k k-k k-k k-k k-m')
  shot(L,'02-setup-field')
  L.click('[data-csdisc="target"]');L.wait_for_timeout(200)
  chk('Target faces per distance block (1440: 122cm / 80cm)',L.evaluate("csFaceTxt({round:'WA 70/1440 (70/60/50/30m)'})")=='122cm full / 80cm full' and L.evaluate("csKeys({round:'WA 720 (50m Compound)'},0).join(' ')")=='X 10 9 8 7 6 5 M')
  L.click('[data-csdisc="indoor"]');L.wait_for_timeout(200);L.select_option('#csrd','Indoor WA 18m');L.wait_for_timeout(200)
  # ---------- people: freeform + host-confirmed links, under-16 by nickname ----------
  L.fill('#csname','TEST casual night');L.fill('#cstype','Joe');L.dispatch_event('#cstype','input');L.wait_for_timeout(200)
  sug=L.inner_text('#cssug')
  chk('typing Joe offers to link Joseph by his nickname only (under 16)','Link Joey' in sug and 'Archer' not in sug and 'Joseph' not in sug)
  chk('nothing links until the host taps the chip',L.evaluate("csDraft().ppl.length")==0)
  L.evaluate("document.getElementById('cssug').scrollIntoView({block:'center'})");L.wait_for_timeout(100);shot(L,'03-setup-suggestion')
  L.click('[data-cslink="joseph"]');L.wait_for_timeout(200)
  chk('host tapped: Joey linked',L.evaluate("csDraft().ppl")==[{'tid':'joseph'}])
  L.fill('#cstype','Jo Archer');L.click('#csaddn');L.wait_for_timeout(200)
  chk('a tester full name can\'t be added as a name only (privacy)','app member' in L.inner_text('#csmsg') and len(L.evaluate("csDraft().ppl"))==1)
  L.fill('#cstype','Sam');L.click('#csaddn');L.wait_for_timeout(200)
  chk('Sam added as a name-only friend (no account)',L.evaluate("csDraft().ppl")[1]=={'n':'Sam'} and 'name only' in L.inner_text('#cssetup'))
  shot(L,'04-setup-people',True)
  L.fill('#cstype','sam');L.click('#csaddn');L.wait_for_timeout(200);chk('duplicate typed names refused','already in' in L.inner_text('#csmsg'))
  L.fill('#cstype','');L.click('[data-csmp="off"]');L.wait_for_timeout(100)
  chk('match play toggle at setup (Off by default)',L.locator('[data-csmp="off"].on').count()==1)
  L.click('#csgo');L.wait_for_timeout(500)
  code=L.evaluate("S.casual[S.casual.length-1].code")
  chk('shoot created and opened',L.locator('#csview').count()==1)
  ct(L);ht(J);to_score(J)
  chk('Joseph sees the invite on his Score tab (Join / Not me)',J.locator(f'[data-csacc="{code}"]').count()==1 and J.locator(f'[data-csno="{code}"]').count()==1)
  shot(J,'05-linked-invite')
  J.click(f'[data-csacc="{code}"]');J.wait_for_timeout(500);ct(J,L)
  chk('Joseph\'s phone has the shoot with 3 people',J.evaluate(f"csGet('{code}').ppl.length")==3)
  vt=J.inner_text('#csview')
  chk('Joseph\'s view: nicknames, no real surnames, no ranking words','Archer' not in vt and 'Archer' not in vt and 'Zap' in vt and 'Sam' in vt and not any(w in vt.lower() for w in ['rank','leaderboard','1st']))
  chk('Joseph can only score himself',J.evaluate("[...document.querySelectorAll('#csentry [data-csid]')].length")==0 and J.evaluate(f"csKey('{code}',csGet('{code}').ppl.find(p=>!p.tid).id,'X')")==False and J.evaluate(f"csKey('{code}','logan','X')")==False)
  # ---------- scoring: host for himself and Sam, Joseph on his own phone ----------
  L.evaluate(f"csView('{code}')");L.wait_for_timeout(200)
  chk('after Joey joins, the host no longer sees him as invited','invited' not in L.inner_text('#csview'))
  chk('host score card has chips for himself and Sam only (not Joey)',L.evaluate("[...document.querySelectorAll('#csentry [data-csid]')].map(b=>b.dataset.csid)").__len__()==2 and L.locator('#csentry [data-csid="joseph"]').count()==0)
  chk('indoor keys on the card 10 9 8 7 6 M',L.evaluate("[...document.querySelectorAll('#csentry [data-csk]')].map(b=>b.dataset.csk)")==['10','9','8','7','6','M'])
  sam=L.evaluate(f"csGet('{code}').ppl.find(p=>!p.tid).id")
  L.click(f'#csentry [data-csid="{sam}"]');L.wait_for_timeout(100)
  for k in ['10','9','9']:L.click(f'#csentry [data-csk="{k}"]');L.wait_for_timeout(80)
  chk('host enters an end for Sam by tapping',L.evaluate(f"csEnds(csGet('{code}'),'{sam}')")==[['10','9','9']])
  L.click(f'#csentry [data-csid="{sam}"]');L.wait_for_timeout(80);L.click('#csundo');L.wait_for_timeout(80)
  chk('host edits Sam (Undo last arrow)',L.evaluate(f"csEnds(csGet('{code}'),'{sam}')")==[['10','9']])
  L.click(f'#csentry [data-csid="{sam}"]');L.click('#csentry [data-csk="8"]');L.wait_for_timeout(80)
  shot(L,'06-host-scores-name-only',True)
  # fill: logan 20 ends of 10 10 9 (580), sam already 10 9 8 + 19 x 9 9 9 (27+513=540), joseph 20 x 10 10 9 (580). Ties are 10s then 9s.
  chk('host fills his own 20 ends',fill(L,code,'logan',['10','10','9']*20))
  chk('host fills Sam\'s remaining ends',fill(L,code,sam,['9','9','9']*19))
  chk('Sam can\'t go past 20 ends',L.evaluate(f"csKey('{code}','{sam}','9')")==False)
  ct(L,J)
  # ---------- offline: Joseph scores with no signal, then syncs ----------
  OFF.add('joseph')
  chk('Joseph scores 10 ends offline',fill(J,code,'joseph',['10','10','9']*10))
  J.evaluate(CT);J.wait_for_timeout(200)
  chk('offline: saved on the phone and queued',J.evaluate(f"csGet('{code}').qfail")==1 and 'Offline' in J.inner_text('#csq'))
  ct(L);chk('host has not seen the offline ends yet',len(L.evaluate(f"csEnds(csGet('{code}'),'joseph')"))==0)
  shot(J,'07-offline-queued',True)
  OFF.discard('joseph');J.evaluate("dispatchEvent(new Event('online'))");J.wait_for_timeout(600);ct(J,L)
  chk('back online: Joseph\'s ends reach the host',len(L.evaluate(f"csEnds(csGet('{code}'),'joseph')"))==10 and J.evaluate(f"csGet('{code}').qfail")==0)
  chk('Joseph finishes his 20 ends',fill(J,code,'joseph',['10','10','9']*10));ct(J,L,J,L)
  # ---------- the shoot's scores ----------
  L.evaluate(f"csView('{code}')");L.wait_for_timeout(200)
  rows=L.evaluate(f"(()=>{{const cs=csGet('{code}');return cs.ppl.map(p=>[csNm(cs,p.id),csRow(cs,p.id).tot,csRow(cs,p.id).x])}})()")
  print('ROWS',rows)
  chk('scores correct: Zap 580 (20 nines), Joey 580 (20 nines), Sam 540 (58 nines)',sorted(rows)==sorted([['Zap',580,20],['Joey',580,20],['Sam',540,58]]))
  chk('indoor tie columns are 10s then 9s','9s' in L.inner_text('#csview') and 'X' not in L.inner_text('thead'))
  chk('scores list in the order added, no ranks, no leaderboard labels',[r[0] for r in rows]==['Zap','Joey','Sam'] and not any(w in L.inner_text('#csview').lower() for w in ['rank','leaderboard','1st','2nd']))
  chk('shoot finished when everyone is done',L.evaluate(f"csFin(csGet('{code}'))"))
  chk('own finished score also saved with my sessions (tagged)',L.evaluate(f"S.sessions.some(s=>s.casual=='{code}'&&s.ends.length==20)"))
  chk('"Do match play?" prompt for the host',L.locator('#csask').count()==1 and 'Do match play?' in L.text_content('#csask'))
  chk('Joseph (not host) gets no prompt or toggle',(J.evaluate(f"csView('{code}')") or True) and J.locator('#csask').count()==0 and J.locator('[data-csmpt]').count()==0)
  shot(L,'08-finished-prompt',True)
  L.click('#csnot');L.wait_for_timeout(200)
  chk('prompt dismissed, match play stays off, toggle still there',L.locator('#csask').count()==0 and L.locator('[data-csmpt="off"].on').count()==1)
  # ---------- league untouched ----------
  chk('league table unchanged by the casual shoot',L.evaluate(LGT)==lg0 and L.evaluate(f"JSON.stringify(lgGet('{lgc}').sc)")==lgs0)
  chk('no casual ids in the league, no league in the casual shoot',L.evaluate(f"!lgArchers(lgGet('{lgc}')).includes('{sam}')&&!JSON.stringify(lgGet('{lgc}')).includes('{code}')"))
  # ---------- match play switched on after the shoot ----------
  L.click('[data-csmpt="on"]');L.wait_for_timeout(300)
  seeds=L.evaluate(f"csGet('{code}').mp.seeds")
  chk('match play on after finishing: seeded from this shoot\'s scores (Zap 580 20X, Joey 580, Sam 540)',seeds==['logan','joseph',sam])
  chk('scores locked once match play is seeded',L.evaluate(f"csKey('{code}','{sam}','X')")==False)
  m=L.evaluate(f"(()=>{{const m=h2hGet('{code}M');return{{cs:m.cs,lg:m.lg||null,ends:m.sur.ends,keys:m.sur.keys}}}})()")
  chk('match play reuses the shoot-up ladder, tied to this shoot only (not the league)',m['cs']==code and m['lg'] is None and m['ends']==3 and m['keys']==['10','9','8','7','6','M'])
  chk('casual match play is not listed with head-to-head matches',L.evaluate("h2hCard()").count(code+'M')==0)
  L.click('#csmpopen');L.wait_for_timeout(300)
  lv=L.text_content('#suview')
  chk('ladder: Match play labels, seeds, match 1 = Sam v Joey','Match play ladder' in lv and 'Shoot-up' not in lv and L.evaluate(f"suLadder(h2hGet('{code}M'))[0].A")==sam and L.evaluate(f"suLadder(h2hGet('{code}M'))[0].B")=='joseph')
  shot(L,'09-match-play-ladder',True)
  ct(L,J);ht(J,L)
  chk('Joseph\'s phone has the same ladder',J.evaluate(f"!!h2hGet('{code}M')&&JSON.stringify(h2hGet('{code}M').su.seeds)")==json.dumps(seeds,separators=(',',':')))
  L.evaluate(f"suMatchView('{code}M',0)");L.wait_for_timeout(200)
  chk('host can score Sam (name only) in match 1, not Joey',L.locator('[data-suact]').count()<=1 and L.evaluate(f"suKey('{code}M',0,'10','{sam}')") and not L.evaluate(f"suKey('{code}M',0,'10','joseph')"))
  for k in ['10','10','9','9','9','9','9','9']:L.evaluate(f"suKey('{code}M',0,'{k}','{sam}')")
  for k in ['10','10','10','10','10','10','10','10','10']:J.evaluate(f"suKey('{code}M',0,'{k}','joseph')")
  ht(L,J,L,J)
  r0=L.evaluate(f"suLadder(h2hGet('{code}M'))[0].res")
  chk('match 1 result synced on both phones: Joey 90 beats Sam 84',r0['winner']=='joseph' and r0['ta']==84 and r0['tb']==90)
  print('R0',r0)
  for k in ['10','10','10','10','10','10','10','10','10']:L.evaluate(f"suKey('{code}M',1,'{k}','logan')")
  for k in ['9']*9:J.evaluate(f"suKey('{code}M',1,'{k}','joseph')")
  ht(L,J,L,J)
  fin=L.evaluate(f"suLadder(h2hGet('{code}M'))[1].res.winner")
  chk('final: Zap wins match play',fin=='logan' and J.evaluate(f"suLadder(h2hGet('{code}M'))[1].res.winner")=='logan')
  L.evaluate(f"suLadderView('{code}M')");L.wait_for_timeout(200)
  chk('result shown as Match play result','Match play result' in L.text_content('#suview') and 'wins' in L.inner_text('#suview'))
  shot(L,'10-match-play-result',True)
  L.click('#suback');L.wait_for_timeout(200);chk('Back to the shoot returns to the casual shoot',L.locator('#csview').count()==1)
  chk('league still unchanged after match play',L.evaluate(LGT)==lg0)
  # ---------- switch match play off again, then on ----------
  L.click('[data-csmpt="off"]');L.wait_for_timeout(200)
  chk('match play switched off: ladder removed from this shoot',L.evaluate(f"!h2hGet('{code}M')&&!csGet('{code}').mp.on"))
  ct(L,J);chk('off reaches Joseph too',J.evaluate(f"!csGet('{code}').mp.on&&!h2hGet('{code}M')"))
  # ---------- 1-person shoot; match play hidden ----------
  to_score(T);T.click('[data-cstp="casual"]');T.wait_for_timeout(200)
  chk('1 person (just the host): start allowed, match play hidden',T.locator('#csgo:not([disabled])').count()==1 and T.locator('[data-csmp]').count()==0 and T.locator('#csmpna').count()==1)
  T.click('[data-csdisc="field"]');T.wait_for_timeout(150);T.click('#csgo');T.wait_for_timeout(400)
  c1=T.evaluate("S.casual[S.casual.length-1].code")
  chk('1-person field shoot: keys 6-1 M on the card',T.evaluate("[...document.querySelectorAll('#csentry [data-csk]')].map(b=>b.dataset.csk)")==['6','5','4','3','2','1','M'] and T.evaluate("[...document.querySelectorAll('#csentry [data-csk]')].map(b=>b.className)")==['k-y','k-y','k-k','k-k','k-k','k-k','k-m'])
  shot(T,'11-one-person-field',True)
  chk('field shoot: score card says field face, tie columns are 6s and 5s','field face' in T.inner_text('#csentry') and '6s' in T.inner_text('.cs-tab') and '5s' in T.inner_text('.cs-tab'))
  chk('1-person shoot: match play can\'t be switched on',T.locator('[data-csmpt]').count()==0 and T.evaluate(f"csMpSetup('{c1}',true)")==False)
  chk('1-person shoot scores and finishes',fill(T,c1,'tahuri',['6','5','5']*24) and T.evaluate(f"csFin(csGet('{c1}'))") and T.evaluate(f"csRow(csGet('{c1}'),'tahuri').tot")==384)
  T.evaluate(f"csView('{c1}')");T.wait_for_timeout(150);chk('no match play prompt with one archer',T.locator('#csask').count()==0)
  # ---------- min 1 / max 10 ----------
  to_score(T);T.click('[data-cstp="casual"]');T.wait_for_timeout(200);T.uncheck('#csself');T.wait_for_timeout(200)
  chk('0 people: Start disabled',T.locator('#csgo[disabled]').count()==1)
  for k in range(10):T.fill('#cstype',f'Friend {chr(65+k)}');T.click('#csaddn');T.wait_for_timeout(60)
  chk('10 name-only people allowed, no more boxes',T.evaluate("csDraft().ppl.length")==10 and T.locator('#cstype').count()==0)
  T.click('#csself');T.wait_for_timeout(150)
  chk('11th (ticking I\'m shooting) refused',T.evaluate("csDraft().self")==False and '10' in T.inner_text('#csmsg'))
  chk('csCreate caps at 10',T.evaluate("(()=>{const cs=csCreate({round:'Vegas 300',self:true,ppl:Array.from({length:12},(_,k)=>({n:'Pal '+String.fromCharCode(65+k)}))});const n=cs.ppl.length;S.casual=S.casual.filter(x=>x.code!=cs.code);save();return n})()")==10)
  T.evaluate("window._csD=null;window._csMode=null")
  # ---------- match play on at setup -> starts by itself when finished ----------
  to_score(L);L.click('[data-cstp="casual"]');L.wait_for_timeout(200);L.click('[data-csdisc="target"]');L.select_option('#csrd','Practice 10 ends × 3');L.wait_for_timeout(150)
  L.fill('#cstype','Kai');L.click('#csaddn');L.wait_for_timeout(100);L.click('[data-csmp="on"]');L.wait_for_timeout(100);L.click('#csgo');L.wait_for_timeout(300)
  c2=L.evaluate("S.casual[S.casual.length-1].code");kai=L.evaluate(f"csGet('{c2}').ppl[1].id")
  fill(L,c2,'logan',['9','9','9']*10);fill(L,c2,kai,['10','10','10']*10)
  chk('match play on at setup starts by itself when the shoot finishes, Kai (300) is seed 1',L.evaluate(f"csGet('{c2}').mp.seeds")==[kai,'logan'] and L.evaluate(f"!!h2hGet('{c2}M')"))
  chk('target practice keys X 10-1 M',L.evaluate(f"csKeys(csGet('{c2}'),0).join(' ')")=='X 10 9 8 7 6 5 4 3 2 1 M')
  # ---------- seeding: only archers who finished the round (CS_SEED_FINISHED_ONLY) ----------
  chk('seeding rule is one named setting, on',L.evaluate("typeof CS_SEED_FINISHED_ONLY!='undefined'&&CS_SEED_FINISHED_ONLY===true") and 'const CS_SEED_FINISHED_ONLY=true;' in open(os.path.join(ROOT,'casual.js'),encoding='utf-8').read())
  c5=L.evaluate("csCreate({round:'Vegas 300',self:true,ppl:[{n:'Ann'},{n:'Ben'}]}).code");a5=L.evaluate(f"csGet('{c5}').ppl[1].id")
  fill(L,c5,a5,['10','10','10']*10);fill(L,c5,'logan',['X','X','X']*5)
  L.evaluate(f"csFinish('{c5}')");L.evaluate(f"csView('{c5}')");L.wait_for_timeout(200)
  chk('host finishes early: only Ann finished, Zap (5 of 10 ends) and Ben (no arrows) not seeded',L.evaluate(f"csSeeds(csGet('{c5}'))")==[a5])
  chk('one finished archer: no match play prompt, match play can\'t start',L.locator('#csask').count()==0 and L.evaluate(f"csMpStart('{c5}',true)")==False and not L.evaluate(f"!!h2hGet('{c5}M')"))
  c4=L.evaluate("csCreate({round:'Vegas 300',self:true,ppl:[{n:'Ann'},{n:'Ben'}]}).code");ann=L.evaluate(f"csGet('{c4}').ppl[1].id");ben=L.evaluate(f"csGet('{c4}').ppl[2].id")
  fill(L,c4,ann,['10','10','10']*10);fill(L,c4,ben,['9','9','9']*10);fill(L,c4,'logan',['X','X','X']*5)
  L.evaluate(f"csFinish('{c4}')");L.evaluate(f"csView('{c4}')");L.wait_for_timeout(200)
  chk('two finishers: prompt shows and says finished archers only',L.locator('#csask').count()==1 and 'only archers who finished every end' in L.text_content('#csask'))
  L.click('[data-csmpt="on"]');L.wait_for_timeout(300)
  chk('seeds = finishers only (Ann 300, Ben 270); Zap\'s unfinished 150 left out',L.evaluate(f"csGet('{c4}').mp.seeds")==[ann,ben] and L.evaluate(f"JSON.stringify(h2hGet('{c4}M').su.seeds)")==json.dumps([ann,ben],separators=(',',':')))
  chk('match play uses the league final format (shoot-up ladder, 3 ends)',L.evaluate(f"h2hGet('{c4}M').sur.ends")==3)
  # ---------- Not me: a linked person declines -> becomes name only on the host ----------
  c3=L.evaluate("csCreate({round:'Vegas 300',self:true,ppl:[{tid:'tahuri'}]}).code");ct(L);ht(T);to_score(T)
  chk('Tahuri gets the invite',T.locator(f'[data-csno="{c3}"]').count()==1)
  T.click(f'[data-csno="{c3}"]');T.wait_for_timeout(600);ct(L)
  chk('Not me: host keeps Tahuri as a name only (nickname shown), and Tahuri\'s phone drops it',L.evaluate(f"csGet('{c3}').ppl[1].tid")==None and L.evaluate(f"csNm(csGet('{c3}'),'tahuri')")=='Taz' and T.evaluate(f"!csGet('{c3}')"))
  # ---------- relay payload privacy ----------
  allmsg=json.dumps(RELAY)
  chk('relay never carries tester real surnames',all(s not in allmsg for s in ['Archer','Archer','Archer','Stride']))
  chk('no page errors',not errs)
  if errs:print(errs[:5])
  b.close()
finally:
  srv.terminate()
print(f'\n{len(ok)} passed, {len(bad)} failed');[print(' FAIL',x) for x in bad];sys.exit(1 if bad else 0)
