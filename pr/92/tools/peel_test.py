# ABA State Titles at Peel: one-phone group score card. Setup slots (4 blank, up to 6), several days each with its own group,
# ABA 3D scoring exactly as aba.js (3-arrow first half, arrows 2-3 only after a miss; 1-arrow second half; block running total;
# club-rule tick), chip switching, day and event totals, score sheet, offline + local only (no relay), colours. Port 8787.
import subprocess,sys,time,os,json,colorsys,re
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nav_compat  # old-tab navigation (tests only)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT='/workspace/h2h';SHOT=os.path.isdir(OUT)
srv=subprocess.Popen([sys.executable,'-m','http.server','8787'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
errs=[];NET=[]
def nxt(P):
  if P.locator('#pgnext').count():P.click('#pgnext')
  P.wait_for_timeout(120)
def phone(b,tid):
  ctx=b.new_context(viewport={'width':390,'height':844})
  def relay(route,req):NET.append((req.method,req.url,req.post_data or ''));route.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'})
  ctx.route('https://ntfy.sh/**',relay);pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(f'{tid}: {e}'));pg.on('dialog',lambda d:d.accept())
  pg.goto(f'http://localhost:8787/?tester={tid}');pg.wait_for_timeout(1200);pg.evaluate("S.unlocked=true;save()");pg.reload();pg.wait_for_timeout(1800);return ctx,pg
PURPLE="""(()=>{const bad=[];const hue=c=>{const m=c.match(/rgba?\\(([\\d.]+), ([\\d.]+), ([\\d.]+)(?:, ([\\d.]+))?/);if(!m||(m[4]!=null&&+m[4]<.2))return null;let [r,g,b]=[m[1],m[2],m[3]].map(x=>x/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(d<.15)return null;let h=mx==r?((g-b)/d)%6:mx==g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;return h};
 document.querySelectorAll('#pgview *').forEach(e=>{const s=getComputedStyle(e);for(const c of [s.color,s.backgroundColor,s.borderColor]){const h=hue(c);if(h!=null&&h>=255&&h<=320)bad.push(e.tagName+' '+c)}});return bad})()"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  cx,P=phone(b,'nathe');ns=P.evaluate("S.sessions.length")
  P.evaluate("cur=null;sv='sheet';nav('score')");P.wait_for_timeout(300)
  chk('Score tab has the ABA State Titles at Peel card',P.locator('#pgcard').count()==1 and 'ABA State Titles at Peel' in P.text_content('#pgcard'))
  P.click('#pgopen');P.wait_for_timeout(300)
  vals=P.evaluate("[...document.querySelectorAll('[data-pgn]')].map(x=>x.value)")
  chk('setup: 4 archer slots by default, names blank',vals==['','','',''])
  P.click('#pgadd');P.wait_for_timeout(100);P.fill('#pgn4','Keep');P.click('#pgadd');P.wait_for_timeout(100)
  chk('up to 6 slots, then no Add button',P.locator('[data-pgn]').count()==6 and P.locator('#pgadd').count()==0 and P.input_value('#pgn4')=='Keep')
  P.click('#pgrem');P.click('#pgrem');P.wait_for_timeout(100);chk('remove slots back to 4',P.locator('[data-pgn]').count()==4)
  P.click('#pggo');P.wait_for_timeout(200);chk('needs at least one name',P.locator('#pgerr').is_visible() and P.locator('#pgsetup').count()==0)
  for i,n in enumerate(['Kim','Raj','Lee']):P.fill(f'#pgn{i}',n)
  P.click('#pggo');P.wait_for_timeout(300)
  chk('day 1 card: 3 archers (blank slot dropped), first archer up',P.locator('[data-pga]').count()==3 and P.inner_text('#pgwho')=='Kim' and 'Day 1' in P.text_content('#pgview h1'))
  chk('first half: 3-arrow, arrow 1 values 20/18/16',P.evaluate("[...document.querySelectorAll('[data-pgz]')].map(b=>b.innerText.split('\\n')[0])")==['20','18','16','Miss'] and '3-arrow half' in P.inner_text('#pghalf'))
  chk('small, quiet club-rule tick before the first target',P.locator('#pgclub').count()==1 and P.evaluate("parseFloat(getComputedStyle(document.querySelector('#pgclubl')).fontSize)")<=12.5)
  P.click('[data-pgz="A"]');P.wait_for_timeout(150)
  chk('a hit scores and the card HOLDS on that archer until Next is tapped',P.inner_text('#pgwho')=='Kim' and P.locator('#pgnext').count()==1 and P.locator('[data-pgz]').count()==0 and P.evaluate("pgTot(pgEv().days[0].a[0].s)")==20)
  P.click('#pgnext');P.wait_for_timeout(150)
  chk('Next moves the card to the next archer',P.inner_text('#pgwho')=='Raj' and P.locator('#pgnext').count()==0)
  chk('club tick gone once scoring starts',P.locator('#pgclub').count()==0)
  P.click('[data-pgz="M"]');P.wait_for_timeout(150)
  chk('a miss in the first half offers arrow 2 (14/12/10) on the same target',P.inner_text('#pgwho')=='Raj' and 'Arrow 2' in P.inner_text('#pgarrow') and P.evaluate("[...document.querySelectorAll('[data-pgz]')].map(b=>b.innerText.split('\\n')[0])")==['14','12','10','Miss'])
  P.click('[data-pgz="B"]');P.wait_for_timeout(150);P.click('#pgnext');P.wait_for_timeout(150);chk('arrow 2 vital = 12, then Lee',P.evaluate("pgTot(pgEv().days[0].a[1].s)")==12 and P.inner_text('#pgwho')=='Lee')
  P.click('[data-pgz="M"]');P.click('[data-pgz="M"]');P.wait_for_timeout(100)
  chk('arrow 3 after two misses (8/6/4)',P.evaluate("[...document.querySelectorAll('[data-pgz]')].map(b=>b.innerText.split('\\n')[0])")==['8','6','4','Miss'])
  P.click('[data-pgz="M"]');P.wait_for_timeout(150);P.click('#pgnext');P.wait_for_timeout(150)
  chk('three misses score 0 and the card goes back round to Kim, target 2',P.evaluate("pgEv().days[0].a[2].s.ends[0][0]")=='M' and P.inner_text('#pgwho')=='Kim' and 'Target 2 of 20' in P.inner_text('#pgtg'))
  P.click('[data-pga="2"]');P.wait_for_timeout(150);chk('chip switcher: tap an archer to score them',P.inner_text('#pgwho')=='Lee' and P.locator('[data-pga="2"].on').count()==1)
  P.click('[data-pgz="C"]');P.wait_for_timeout(100);P.click('[data-pga="2"]');P.wait_for_timeout(100);P.click('#pgundo');P.wait_for_timeout(150)
  chk('undo takes back the last score for that archer',P.evaluate("pgN(pgEv().days[0].a[2].s)") if False else P.evaluate("pgEv().days[0].a[2].s.ends.filter(e=>e.length).length")==1)
  # same rules as the app's own ABA round: compare pgHit with abaHit on a normal session for a random tap sequence
  seq=['A','M','B','M','M','C','M','M','M','B']*4
  same=P.evaluate("""seq=>{const d=pgNewDay(['Cmp'],false,'2026-10-24');pgEv().days.pop();for(const z of seq)pgHit(d,0,z);
    cur={id:'cmp',date:'2026-10-24',round:ABA_IC,ends:[[]],aba:[],pos:[],note:''};S.sessions.push(cur);for(const z of seq)abaHit(z);const a=JSON.stringify(cur.ends.filter(e=>e.length)),b=JSON.stringify(d.a[0].s.ends.filter(e=>e.length));
    S.sessions.pop();cur=null;save();return [a==b,a,b]}""",seq)
  chk('scoring matches the ABA Interclub 3D round exactly (same taps, same scores)',same[0])
  P.evaluate("pgView(pgEv().open)");P.wait_for_timeout(150)
  # Kim: targets 2-10 all 20 -> block 1-10 = 200; target 11 = 18 -> block 11-20 restarts at 18
  P.evaluate("(()=>{const d=pgEv().days[0];for(let t=0;t<9;t++)pgHit(d,0,'A');pgHit(d,0,'B');d.at=0;save();pgView(d.id)})()");P.wait_for_timeout(150)
  r=P.evaluate("pgRun(pgEv().days[0].a[0].s)")
  chk('running total restarts each 10-target block',r['from']==11 and r['run']==18 and P.evaluate("abaHalves(pgEv().days[0].a[0].s)[0].sub[0]")==200)
  P.evaluate("(()=>{const d=pgEv().days[0];for(let t=0;t<9;t++)pgHit(d,0,'A');d.at=0;save();pgView(d.id)})()");P.wait_for_timeout(150)
  chk('second half: one arrow, values 20/18/16 and Miss = 0',P.inner_text('#pgwho')=='Kim' and '1-arrow half' in P.inner_text('#pghalf') and 'Second half' in P.inner_text('#pgtg'))
  P.click('[data-pgz="M"]');P.wait_for_timeout(150);nxt(P)
  chk('a second-half miss scores 0 and moves on (no arrow 2)',P.evaluate("pgEv().days[0].a[0].s.ends[20][0]")=='M' and P.inner_text('#pgwho')!='Kim')
  chk('totals table: running block, day total and event total for each archer',P.locator('#pgtotals [data-pgrow]').count()==3 and '398' in P.inner_text('#pgtotals [data-pgrow="0"]'))
  P.click('[data-pgsh="0"]');P.wait_for_timeout(250)
  chk('official-style score sheet per archer, with Share',P.locator('#pgsheet').count()==1 and 'Kim' in P.inner_text('#pgsheet') and P.locator('#pgshare').count()==1)
  P.evaluate("(()=>{const d=pgEv().days[0];window._pgSheet=null;d.at=0;save();pgView(d.id)})()");P.wait_for_timeout(200)
  P.evaluate('window.scrollTo(0,0);document.querySelectorAll("*").forEach(e=>{if(e.scrollTop)e.scrollTop=0})');P.wait_for_timeout(100)
  if SHOT:P.screenshot(path=OUT+'/peel-1-scoring.png')
  P.reload();P.wait_for_timeout(1800);P.evaluate("cur=null;sv='sheet';nav('score')");P.wait_for_timeout(200);P.click('#pgopen');P.wait_for_timeout(250)
  chk('saved on the phone: reload reopens day 1 with every score',P.evaluate("pgTot(pgEv().days[0].a[0].s)")==398 and P.locator('[data-pga]').count()==3)
  # day 2: a different group, club rule ticked
  cx.set_offline(True)
  P.click('#pgnew');P.wait_for_timeout(200);chk('new day: blank names again',P.evaluate("[...document.querySelectorAll('[data-pgn]')].map(x=>x.value)")==['','','',''])
  P.fill('#pgn0','kim ');P.fill('#pgn1','Sam');P.check('#pgclub');P.click('#pggo');P.wait_for_timeout(250)
  chk('day 2 has its own group',P.locator('[data-pga]').count()==2 and 'Day 2' in P.text_content('#pgview h1') and P.locator('[data-pgday]').count()==2)
  P.click('[data-pgz="M"]');P.wait_for_timeout(150);nxt(P)
  chk('club rule: first-half miss scores 0 at once (1 arrow)',P.evaluate("pgEv().days[1].a[0].s.ends[0][0]")=='M' and P.inner_text('#pgwho')=='Sam')
  P.click('[data-pgz="A"]');P.wait_for_timeout(120);nxt(P);P.click('[data-pgz="A"]');P.wait_for_timeout(150)
  chk('event total adds the days for the same archer (name match ignores case/spaces)',P.evaluate("pgEvent('Kim')")==398+20 and '418' in P.inner_text('#pgtotals [data-pgrow="0"]'))
  chk('works offline (no network) and keeps the scores',P.evaluate("pgTot(pgEv().days[1].a[1].s)")==20)
  cx.set_offline(False)
  P.click('[data-pgday]>>nth=0');P.wait_for_timeout(200);chk('switch back to day 1',P.locator('[data-pga]').count()==3)
  chk('separate: nothing added to my own rounds or stats',P.evaluate("S.sessions.every(x=>!x.pg&&!(x.abaHead&&/^(Kim|Raj|Lee|Sam|Cmp)$/.test(x.abaHead.name||'')))"))
  chk('local only: nothing about the group card goes to the relay',not any(('Kim' in d or 'Peel' in d or 'pgEv' in d or '"pg"' in d) for _,_,d in NET))
  pr=P.evaluate(PURPLE);chk('no purple anywhere on the card',not pr)
  if pr:print('   ',pr[:5])
  chk('scores never rely on colour alone (every key has its number and Kill/Vital/Wound/Miss)',P.evaluate("[...document.querySelectorAll('[data-pgz]')].every(b=>/\\d|Miss/.test(b.innerText)&&/(Kill|Vital|Wound|Miss|next arrow|0)/.test(b.innerText))"))
  P.evaluate("pgView(pgEv().days[1].id)");P.wait_for_timeout(150);P.click('#pgdel');P.wait_for_timeout(200)
  chk('delete a day (confirmed)',P.evaluate("pgEv().days.length")==1)
  cl,L=phone(b,'logan');L.evaluate("cur=null;sv='sheet';nav('score')");L.wait_for_timeout(300)
  chk('available in every tester app (Logan has it too)',L.locator('#pgcard').count()==1)
  cl.close();cx.close()
  chk('no page errors',not errs)
  if errs:print(errs[:5])
finally:
  srv.terminate()
print(f'\n{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
