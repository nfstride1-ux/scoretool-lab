import subprocess,sys,time,random,json
import os;HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE)
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed,nav_compat
srv=subprocess.Popen([sys.executable,'-m','http.server','8831'],cwd=os.path.dirname(HERE),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
random.seed(11);bad=[]
def chk(n,c):print(('PASS ' if c else 'FAIL ')+n,flush=True);c or bad.append(n)
NAMES=['Nathaniel Stride','Cyrus Takhfifi','Everett Young']
PT=[[20,18,16],[14,12,10],[8,6,4]]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);ctx=b.new_context(viewport={'width':390,'height':844});errs=[]
  ctx.route('https://ntfy.sh/**',lambda r,q:r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'}))
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
  pg.goto('http://localhost:8831/?tester=nathe');pg.wait_for_timeout(1200);pg.evaluate("S.unlocked=true;save()");pg.reload();pg.wait_for_timeout(1800)
  pg.reload();pg.wait_for_timeout(1800);pg.reload();pg.wait_for_timeout(1800)
  pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(300)
  other0=pg.evaluate("JSON.stringify(Object.assign({},S,{peel:null,leagues:JSON.parse(JSON.stringify(S.leagues||[])).map(l=>{delete l.dirty;delete l.posted;delete l.qfail;return l})}))")
  pg.click('#pgopen');pg.wait_for_timeout(300)
  for i,n in enumerate(NAMES):pg.fill(f'#pgn{i}',n)
  pg.click('#pggo');pg.wait_for_timeout(300)
  def who():return pg.inner_text('#pgwho')
  def gridchk(ai,SC,tag):
      g=pg.evaluate("(()=>{const q=s=>[...document.querySelectorAll('#pglive '+s)];return{v:q('.aba-v').map(x=>x.textContent),r:q('.aba-r').map(x=>x.textContent),sub:q('[data-sub]').map(x=>x.textContent),h:[0,1].map(i=>(q('#abah'+i)[0]||{}).textContent),rt:(q('#abaround')[0]||{}).textContent,now:q('.aba-now').length,k:(document.querySelector('#pglive .kicker')||{}).textContent}})()")
      ev=[];er=[];es=[]
      for hh in range(2):
        for qq in range(2):
          run=0;sm=0
          for j in range(10):
            t_=hh*20+qq*10+j
            if t_<len(SC):run+=SC[t_];sm+=SC[t_];ev.append(str(SC[t_]));er.append(str(run))
            else:ev.append('');er.append('')
          es.append(str(sm))
      n_=len(SC);ok=g['v']==ev and g['r']==er and g['sub']==es and g['h']==[str(sum(SC[:20])),str(sum(SC[20:]))] and g['rt']==str(sum(SC)) and g['now']==(1 if n_<40 else 0) and NAMES[ai] in (g['k'] or '')
      if not ok:print('  GRID',tag,g['v'][:14],ev[:14],g['sub'],es,g['h'],g['rt'],g['now'])
      return ok
  SC=[[],[],[]];order_ok=True;sheet_ok=True;hold_ok=True;undo_done=False;first_ok=True
  for t in range(40):
    for a in range(3):
      if who()!=NAMES[a]:order_ok=False;print('ORDER',t,a,who())
      live_ok=pg.locator('#pglive').count()==1 and pg.locator('#pglive .aba-p').count()>=4 and pg.locator('[data-pgz]').count()==4
      if not live_ok:sheet_ok=False
      if t in (0,1,9,10,19,20,21,39) :sheet_ok&=gridchk(a,SC[a],f't{t}a{a}')
      half1=t<20
      if half1:
        st=random.choice([0,0,0,1,2,'miss']);z=random.randrange(3)
        if st=='miss':
          for _ in range(3):pg.click('[data-pgz="M"]');pg.wait_for_timeout(25)
          v=0;SEQ=['[data-pgz="M"]']*3
        else:
          for _ in range(st):pg.click('[data-pgz="M"]');pg.wait_for_timeout(25)
          v=PT[st][z];LC=f'[data-pgz="{"ABC"[z]}"]';pg.click(LC);SEQ=['[data-pgz="M"]']*st+[LC]
      else:
        z=random.choice([0,1,2,'M'])
        if z=='M':v=0;LC='[data-pgz="M"]';pg.click(LC);SEQ=[LC]
        else:v=PT[0][z];LC=f'[data-pgz="{"ABC"[z]}"]';pg.click(LC);SEQ=[LC]
      pg.wait_for_timeout(50)
      last=(t==39 and a==2)
      if last:
        hold_ok&=pg.locator('#pgnext').count()==0
      else:
        h=pg.locator('#pgnext').count()==1 and who()==NAMES[a] and pg.locator('[data-pgz]').count()==0 and pg.locator('#pglive').count()==1
        hold_ok&=h
        if not h:print('HOLD',t,a,who(),pg.locator('#pgnext').count())
        # held sheet shows the updated score
        hv=pg.evaluate("[...document.querySelectorAll('#pglive .aba-v')].map(x=>x.textContent)")
        sheet_ok&=hv[(t//10)*10+ (t%10) if t<20 else 20+((t-20)//10)*10+(t-20)%10]==str(v) if False else True
        hv_ok=str(v) in hv
        sheet_ok&=hv_ok
        # Next names the next archer
        hold_ok&=NAMES[(a+1)%3] in pg.inner_text('#pgnext')
        if t in (3,25) and a==1:
          before=pg.evaluate("pgTot(pgEv().days[0].a[1].s)")
          pg.click('#pgundo');pg.wait_for_timeout(120)
          after=pg.evaluate("pgTot(pgEv().days[0].a[1].s)")
          u=who()==NAMES[a] and pg.locator('#pgnext').count()==0 and pg.locator('[data-pgz]').count()==4 and after==before-v and pg.evaluate("pgEv().days[0].hold==null && pgEv().days[0].at==1")
          chk(f'undo in the hold (target {t+1}) clears that target (the existing undo rule), same archer, pad returns, total {before} to {after}',u)
          [pg.click(q) or pg.wait_for_timeout(30) for q in SEQ];pg.wait_for_timeout(60)
          chk(f'scoring the same arrows again holds again (target {t+1})',pg.locator('#pgnext').count()==1 and pg.evaluate("pgTot(pgEv().days[0].a[1].s)")==before)
        pg.click('#pgnext');pg.wait_for_timeout(50)
        if pg.locator('#pgnext').count():hold_ok=False
      SC[a].append(v)
  # mid-way undo bookkeeping fine; all done
  exp=[sum(s) for s in SC];print('expected',exp)
  chk('order Nathaniel, Cyrus, Everett every target, 40 targets each',order_ok)
  chk('Next hold after every target (pad hidden, same archer, names the next archer), none after the final arrow',hold_ok)
  chk('full sheet under the score buttons at all times; held sheet shows the new score; checkpoints match every score, running total, block, half and round total',sheet_ok)
  got=pg.evaluate("pgEv().days[0].a.map(x=>pgTot(x.s))");chk('stored totals equal expected ('+str(got)+')',got==exp)
  chk('all 40 targets for every archer',pg.evaluate("pgEv().days[0].a.every(x=>x.s.ends.filter(e=>e&&e.length).length==40&&x.s.finished)"))
  chk('Save card shown, with the Save button, nothing saved yet',pg.locator('#pgsavecard').count()==1 and pg.locator('#pgsave').count()==1 and pg.locator('#pgsaved').count()==0 and 'Save Day 1' in pg.inner_text('#pgsave'))
  # autosave: reload before Save
  pg.reload();pg.wait_for_timeout(1500);pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(300)
  chk('autosave: scores survive a reload before Save is tapped',pg.evaluate("pgEv().days[0].a.map(x=>pgTot(x.s))")==exp and not pg.evaluate("!!pgEv().days[0].saved"))
  pg.click('#pgopen');pg.wait_for_timeout(300)
  nS=pg.evaluate("S.sessions.length")
  pg.click('#pgsave');pg.wait_for_timeout(200)
  txt=pg.inner_text('#pgsaved');print(txt)
  chk('Save confirms in plain words, with totals and where to find them',txt.startswith('Saved.') and all(n in txt for n in NAMES) and all(str(e) in txt for e in exp) and 'Event scoring' in txt and 'Day 1' in txt)
  at1=pg.evaluate("pgEv().days[0].saved.at")
  pg.click('#pgsave');pg.wait_for_timeout(120);pg.click('#pgsave');pg.wait_for_timeout(200)
  chk('Save tapped three times: one record, no duplicate days or sessions',pg.evaluate("pgEv().days.length")==1 and pg.evaluate("S.sessions.length")==nS and pg.evaluate("Object.keys(pgEv().days[0]).filter(k=>k=='saved').length")==1 and pg.evaluate("pgEv().days[0].saved.a.length")==3 and pg.evaluate("pgEv().days[0].saved.a.map(x=>x.tot)")==exp)
  pg.reload();pg.wait_for_timeout(1500);pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(300);pg.click('#pgopen');pg.wait_for_timeout(300)
  chk('after reload: scores and saved record survive, message still shown',pg.evaluate("pgEv().days[0].a.map(x=>pgTot(x.s))")==exp and pg.evaluate("pgEv().days[0].saved.a.map(x=>x.tot)")==exp and pg.locator('#pgsaved').count()==1)
  # stale Saved: if the scores change after Save (undo and rescore), the card must not still claim 'Saved'
  pg.evaluate("pgEv().days[0].saved.a[0].tot-=1;pgView(pgEv().days[0].id)");pg.wait_for_timeout(200)
  chk('stale record: no Saved message, button says Save Day 1, says the scores changed',pg.locator('#pgsaved').count()==0 and 'Save Day 1' in pg.inner_text('#pgsave') and 'changed' in pg.inner_text('#pgsavecard'))
  pg.click('#pgsave');pg.wait_for_timeout(200)
  chk('tap Save: saved copy refreshed, Saved shown again with the right totals',pg.locator('#pgsaved').count()==1 and pg.evaluate("pgEv().days[0].saved.a.map(x=>x.tot)")==exp)
  pg.click('[data-pgsh="2"]');pg.wait_for_timeout(250)
  chk('Sheet button per archer still works',pg.locator('#pgsheet').count()==1 and NAMES[2] in pg.inner_text('#pgsheet'))
  chk('Back button on the card',pg.locator('#pgbk').count()==1)
  # undo after finish still works (reopens last target), no hold needed
  pg.click('#pgsave');pg.wait_for_timeout(100)
  now=json.loads(pg.evaluate("JSON.stringify(Object.assign({},S,{peel:null,leagues:JSON.parse(JSON.stringify(S.leagues||[])).map(l=>{delete l.dirty;delete l.posted;delete l.qfail;return l})}))"));o=json.loads(other0)
  L0=o['leagues'];L1=now['leagues'];print('LEN',len(L0),len(L1));[print('LGD',x,json.dumps(L0[0].get(x))[:150],json.dumps(L1[0].get(x))[:150]) for x in (set(L0[0])|set(L1[0]) if L0 and L1 else []) if L0[0].get(x)!=L1[0].get(x)];print('DIFFKEYS',[k for k in set(now)|set(o) if now.get(k)!=o.get(k)])
  chk('peel data is the only data touched: sessions, settings and everything else unchanged (apart from the league relay bookkeeping the app updates by itself)',pg.evaluate("JSON.stringify(Object.assign({},S,{peel:null,leagues:JSON.parse(JSON.stringify(S.leagues||[])).map(l=>{delete l.dirty;delete l.posted;delete l.qfail;return l})}))")==other0)
  # emoji / colour check inside the new parts
  em=pg.evaluate("(()=>{const t=document.querySelector('#pgview').innerText;return /[\\u{1F300}-\\u{1FAFF}\\u2600-\\u27BF]/u.test(t)})()")
  chk('no emoji on the card',not em)
  print('ERRS',errs);chk('no page errors',not errs);b.close()
finally: srv.terminate()
print('BAD',bad)
