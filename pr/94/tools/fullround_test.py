# Full-round data integrity check (item 1 of the paid-ready programme, 31 Oct 2026, Nathe). Throwaway test profile in a test browser only.
# WebKit (the iPhone engine) at 390 x 844 with touch, emulating the installed home-screen app. Every round type is scored start to
# finish by real touch taps on the keypad (or the ABA zone pad), with a fixed but varied set of arrows (X, 10s, misses...). Checks:
#  - after every end: each end on the score sheet shows the right arrows (highest first), the End box and the running total (Prog);
#  - at the finish: every end again, X count, 10s+X count (field: 6s and 5s), hits (arrows that are not M) and the total;
#  - the saved record after a reload is byte-for-byte what was saved at the finish and matches every arrow shot;
#  - Past sessions shows the right total, and Open shows every end and running total again;
#  - no page errors. Every failure is printed (the run does not stop at the first one).
# Round types: indoor (WA 18 m, 25 m, combined, Australian Indoor), outdoor (720s, Canberras, 1440s, 900), field (24 marked /
# unmarked / mixed, gold and black faces), Vegas 300 and Vegas 300 (18 m, the league round), practice rounds, a custom
# distance-block round, ABA Interclub 3D and a custom ABA 3D round. Clout is not a round in the app (nothing to score).
import subprocess,sys,time,os,json,random
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok=[];bad=[]
def chk(n,c,i=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+('' if c else '  '+str(i)[:300]),flush=True)
PORT=int(os.environ.get("PORT","8983"))
BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get('BASE') else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
ONLY=os.environ.get('ONLY')
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
STANDALONE="""Object.defineProperty(navigator,'standalone',{get:()=>true});(()=>{const m=window.matchMedia.bind(window);window.matchMedia=q=>/display-mode:\\s*standalone/.test(q)?{matches:true,media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},onchange:null,dispatchEvent(){return false}}:m(q)})()"""
VAL=lambda a:10 if a=='X' else 0 if a=='M' else int(a)
def srt(e):return sorted(e,key=lambda a:(-VAL(a),a!='X'))
SHEET="""(()=>{const T=[...document.querySelectorAll('.ad-tab tbody tr')].map(r=>{const c=r.querySelectorAll('td');return{n:+c[0].textContent,a:[...c[1].querySelectorAll('.adb')].map(x=>x.textContent),e:+c[2].textContent,p:+c[3].textContent}});
 const sm=document.querySelectorAll('.ad-sum');const last=sm[sm.length-1];return{rows:T,sum:last?last.textContent.replace(/\\s+/g,' ').trim():'',big:last&&last.querySelector('b.big')?+last.querySelector('b.big').textContent:null}})()"""
CUSTOM={'kind':'blocks','name':'FR test 30/20 m','ape':3,'blocks':[{'dist':30,'unit':'m','size':80,'type':'full','ends':2},{'dist':20,'unit':'m','size':60,'type':'6-ring','ends':2}]}
errs=[]
def taps(pg,sel):
    pg.locator(sel).first.tap(timeout=8000)
def fp(pg):pg.evaluate("document.querySelector('#fpm')?.remove()")
def rows_ok(tag,rows,exp):
    run=0;want=[]
    for i,e in enumerate(exp):run+=sum(VAL(a) for a in e);want.append({'n':i+1,'a':srt(e),'e':sum(VAL(a) for a in e),'p':run})
    bad_=[(w,r) for w,r in zip(want,rows) if w!=r]
    chk(f'{tag}: {len(exp)} ends, every end, End box and running total right',len(rows)==len(want) and not bad_,(len(rows),len(want),bad_[:2]))
def target_round(pg,rd,seed):
    R=pg.evaluate("r=>{const R=ROUNDS[r];return{ends:R.ends,ape:R.ape}}",rd);rng=random.Random(seed)
    pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(300);pg.select_option('#rd',rd);pg.wait_for_timeout(200)
    taps(pg,'#st');pg.wait_for_timeout(600)
    keys=pg.evaluate("[...document.querySelectorAll('[data-k]')].map(b=>b.dataset.k)")
    exp=[];tag=rd
    for i in range(R['ends']):
        e=[];keys=pg.evaluate("[...document.querySelectorAll('[data-k]')].map(b=>b.dataset.k)")
        for j in range(R['ape']):
            fp(pg);k=rng.choice(keys[:4]) if rng.random()<0.6 else rng.choice(keys)
            pg.locator(f'[data-k="{k}"]:not([disabled])').first.tap(timeout=5000);e.append(k);pg.wait_for_timeout(40)
        exp.append(e);fp(pg)
        pg.wait_for_timeout(200);fp(pg);taps(pg,"#enext");pg.wait_for_timeout(300)
        sh=pg.evaluate(SHEET);rows_ok(f'{tag} after end {i+1}',sh['rows'],exp) if (i<3 or i==R['ends']-1 or i%5==4) else None
        if i<R['ends']-1:taps(pg,'#addsc');pg.wait_for_timeout(250)
    tot=sum(VAL(a) for e in exp for a in e);fl=[a for e in exp for a in e]
    chk(f'{tag}: a full round finishes by itself (no Finished button, summary shown)',pg.locator('#finnow').count()==0 and pg.locator('#finsess').count()==1)
    if pg.locator('#finnow').count():taps(pg,'#finnow');pg.wait_for_timeout(700)
    fp(pg)
    sh=pg.evaluate(SHEET);rows_ok(f'{tag} finished sheet',sh['rows'],exp)
    field='6' in keys and 'X' not in keys and '10' not in keys
    wa18=pg.evaluate("r=>!!(ROUNDS[r]&&ROUNDS[r].wa18)",rd)
    aus=rd=='Australian Indoor 18m'
    if field:want=f"6's: {fl.count('6')} 5's: {fl.count('5')}"
    elif wa18:want=f"10's: {fl.count('10')} 9's: {fl.count('9')}"
    elif aus:want=f"10's: {fl.count('X')+fl.count('10')} X's: {fl.count('X')}"
    else:want=f"X's: {fl.count('X')} 10's/X's: {fl.count('X')+fl.count('10')}"
    chk(f'{tag} finished: {want} and total {tot}',sh['sum'].startswith(want) and sh['big']==tot,sh['sum'])
    sc=pg.evaluate("(()=>{const r=[...document.querySelectorAll('.ad-kv tr')].find(t=>t.querySelector('th')?.textContent=='Score');return r?+r.querySelector('td').textContent:null})()")
    chk(f'{tag} finish summary Score row = {tot}',sc==tot,sc)
    sid=pg.evaluate("cur.id");raw=pg.evaluate("JSON.stringify(S.sessions.find(s=>s.id==cur.id))")
    taps(pg,'#finsess');pg.wait_for_timeout(500);check_saved(pg,tag,sid,raw,exp,tot,len([a for a in fl if a!='M']))
def check_saved(pg,tag,sid,raw,exp,tot,hits,aba=False):
    pg.reload();pg.wait_for_timeout(1300)
    s=pg.evaluate("id=>{const s=S.sessions.find(x=>x.id==id);return s?{raw:JSON.stringify(s),ends:s.ends,fin:isDone(s)&&done().includes(s),t:total(s)}:null}",sid)
    chk(f'{tag} saved record unchanged after reload',s is not None and s['raw']==raw,(s or {}).get('raw','none')[:200])
    if not s:return
    se=s['ends'];want=exp if aba else [srt(e) for e in exp]
    chk(f'{tag} saved record has every arrow, hits {hits}, total {tot}, counted as a finished shoot',se==want and s['fin'] and s['t']==tot and sum(1 for e in se for a in e if a!='M')==hits,([ (w,g) for w,g in zip(want,se) if w!=g][:2],len(se),len(want),s['t'],s['fin']))
    pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(400)
    row=pg.evaluate("id=>{const b=document.querySelector(`[data-open=\"${id}\"]`);if(!b)return null;const r=b.closest('.list-item');return r.querySelector('b').textContent}",sid)
    chk(f'{tag} Past sessions row shows {tot}',row==str(tot),row)
    if row is None:return
    pg.locator(f'[data-open="{sid}"]').scroll_into_view_if_needed();pg.locator(f'[data-open="{sid}"]').tap();pg.wait_for_timeout(600)
    if aba:
        t=pg.inner_text('#app');chk(f'{tag} opened from Past sessions: shows the total {tot}',str(tot) in t,t[:200])
    else:
        sh=pg.evaluate(SHEET);rows_ok(f'{tag} opened from Past sessions',sh['rows'],exp);chk(f'{tag} opened: total {tot}',sh['big']==tot,sh['big'])
    pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(300)
PTS=[[20,18,16],[14,12,10],[8,6,4]]
PEEL_NAMES=['Test Archer One','Test Archer Two','Test Archer Three']
def peel_day(pg,dn,seed):
    rng=random.Random(seed);tag=f'ABA multi-day (Peel group card) Day {dn}'
    ns=[3]*20+[1]*20;st={j:{'t':0,'m':0,'e':[]} for j in range(len(PEEL_NAMES))};taps_=0
    while any(v['t']<40 for v in st.values()) and taps_<3000:
        taps_+=1
        if pg.locator('#pgnext').count():pg.locator('#pgnext').tap();pg.wait_for_timeout(60);continue
        j=int(pg.evaluate("document.querySelector('.pg-chip.on').dataset.pga"));v=st[j];n=ns[v['t']];k=v['m']+1
        if rng.random()<0.35:
            pg.locator('[data-pgz="M"]').tap(timeout=5000);v['m']+=1
            if v['m']>=n:v['e'].append(['M']);v['t']+=1;v['m']=0
        else:
            z=rng.choice('ABC');pg.locator(f'[data-pgz="{z}"]').tap(timeout=5000);v['e'].append([str(PTS[k-1]['ABC'.index(z)])]);v['t']+=1;v['m']=0
        pg.wait_for_timeout(50)
    if pg.locator('#pgnext').count():pg.locator('#pgnext').tap();pg.wait_for_timeout(200)
    got=pg.evaluate("dn=>pgEv().days[dn-1].a.map(x=>({nm:x.nm,e:x.s.ends.filter(e=>e.length),t:pgTot(x.s)}))",dn)
    for j,g in enumerate(got):
        exp=st[j]['e'];tot=sum(VAL(a) for e in exp for a in e)
        chk(f'{tag}: {g["nm"]} all 40 targets right, total {tot}',g['e']==exp and g['t']==tot,(len(g['e']),[ (a,b) for a,b in zip(exp,g['e']) if a!=b][:2],g['t'],tot))
    chips=pg.evaluate("[...document.querySelectorAll('.pg-chip')].map(c=>c.textContent.replace(/\\s+/g,' ').trim())")
    want=[f"{n} done {sum(VAL(a) for e in st[j]['e'] for a in e)}" for j,n in enumerate(PEEL_NAMES)]
    chk(f'{tag}: archer chips show done and each total',chips==want,(chips,want))
    raw=pg.evaluate("JSON.stringify(pgEv().days)");pg.reload();pg.wait_for_timeout(1500)
    chk(f'{tag}: saved days unchanged after reload',pg.evaluate("JSON.stringify(pgEv().days)")==raw)
    return {n:sum(VAL(a) for e in st[j]['e'] for a in e) for j,n in enumerate(PEEL_NAMES)}
def peel_round(pg):
    tag='ABA multi-day (Peel group card)'
    pg.reload();pg.wait_for_timeout(1500);ss0=pg.evaluate("JSON.stringify(S.sessions)")
    pg.evaluate("cur=null;sv='sheet';nav('lab_group')");pg.wait_for_timeout(600)
    pg.locator('#pgopen').tap();pg.wait_for_timeout(300)
    for i,n in enumerate(PEEL_NAMES):pg.fill(f'#pgn{i}',n)
    pg.locator('#pggo').tap();pg.wait_for_timeout(400)
    T1=peel_day(pg,1,101)
    pg.evaluate("cur=null;sv='sheet';nav('lab_group')");pg.wait_for_timeout(600)
    pg.evaluate("pgView(pgEv().days[0].id)");pg.wait_for_timeout(400)
    pg.locator('#pgnew').tap();pg.wait_for_timeout(400)
    for i,n in enumerate(PEEL_NAMES):
        if pg.locator(f'#pgn{i}').count():pg.fill(f'#pgn{i}',n)
    pg.locator('#pggo').tap();pg.wait_for_timeout(400)
    chk(f'{tag}: Day 2 started as a second day',pg.evaluate("pgEv().days.length")==2)
    T2=peel_day(pg,2,202)
    ev=pg.evaluate("pgEvRows().map(r=>[r.nm,r.tot])");want=[[n,T1[n]+T2[n]] for n in PEEL_NAMES]
    chk(f'{tag}: event totals = Day 1 + Day 2 for every archer',sorted(ev)==sorted(want),(ev,want))
    pg.evaluate("pgView(pgEv().days[1].id)");pg.wait_for_timeout(400);pg.locator('#pgcomp').tap();pg.wait_for_timeout(500)
    c=pg.evaluate("S.peel.comp&&S.peel.comp.rows.map(r=>[r.nm,r.tot])")
    chk(f'{tag}: Competition complete totals = Day 1 + Day 2',c is not None and sorted(c)==sorted(want),(c,want))
    t=pg.inner_text('#app');chk(f'{tag}: results screen shows every total',all(str(w[1]) in t for w in want),t[:300])
    pg.reload();pg.wait_for_timeout(1500)
    chk(f'{tag}: results record unchanged after reload',pg.evaluate("S.peel.comp&&S.peel.comp.rows.map(r=>[r.nm,r.tot])")==c)
    SEEDF="JSON.stringify(S.sessions.filter(x=>x.id!='aba20250517'))";ss1=pg.evaluate(SEEDF);ss0=json.dumps([x for x in json.loads(ss0) if x['id']!='aba20250517'],separators=(',',':'),ensure_ascii=False);ss1=json.dumps(json.loads(ss1),separators=(',',':'),ensure_ascii=False);a0={x['id']:x for x in json.loads(ss0)};a1={x['id']:x for x in json.loads(ss1)}
    chk(f'{tag}: nothing written into the archer\'s own sessions (his paper-sheet seed aside)',ss1==ss0,([ (k,a1[k].get('round'),a1[k].get('peel')) for k in a1 if k not in a0][:3],[k for k in a0 if k not in a1][:3],[k for k in a1 if k in a0 and a0[k]!=a1[k]][:3],len(a0),len(a1)))
POSTS=[]
def relay(route,req):
    if req.method=='POST':POSTS.append(req.post_data or '');return route.fulfill(status=200,body='{}',headers={'access-control-allow-origin':'*'})
    route.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'})
def league_round(pg):
    tag='League 300 (Onion Shed league night, Vegas 300 18 m)';rng=random.Random(77)
    pg.evaluate("nav('score')");pg.wait_for_timeout(500);pg.evaluate("(()=>{if(!lgGet('ONIONSHD')){S.leagues=S.leagues||[];S.leagues.push(lgPresetRecord());save()}lgView('ONIONSHD')})()");pg.wait_for_timeout(500)
    pg.locator('[data-lgme]').tap();pg.wait_for_timeout(500)
    keys=pg.evaluate("[...document.querySelectorAll('#csad [data-lgk]')].map(b=>b.dataset.lgk)");chk(f'{tag}: keys X 10 9 8 7 6 M',keys==['X','10','9','8','7','6','M'],keys)
    exp=[]
    for i in range(10):
        e=[]
        for j in range(3):
            k=rng.choice(keys[:3]) if rng.random()<0.6 else rng.choice(keys);pg.locator(f'#csad [data-lgk="{k}"]').tap(timeout=5000);e.append(k);pg.wait_for_timeout(120)
        exp.append(e);pg.wait_for_timeout(200)
        if i<3 or i==9:
            sh=pg.evaluate(SHEET.replace('.ad-tab tbody tr','#csadtab tbody tr'));rows_ok(f'{tag} after end {i+1}',sh['rows'],exp)
            nums=pg.evaluate("[...document.querySelectorAll('#csad .ad-num b')].map(b=>b.textContent)")
            run=sum(VAL(a) for x in exp for a in x)
            if i<9:chk(f'{tag} after end {i+1}: End box 0 (new end), Prog {run}',nums==['0',str(run)],nums)
    tot=sum(VAL(a) for x in exp for a in x);fl=[a for x in exp for a in x]
    rec=pg.evaluate("(()=>{const L=lgGet('ONIONSHD'),me=TESTER.id,w=Object.keys(L.sc[me]||{}).pop();return{w,e:(L.sc[me]||{})[w]&&L.sc[me][w].e}})()")
    chk(f'{tag}: league record has every end in order (total {tot})',rec['e']==[srt(x) for x in exp],(rec,))
    s=pg.evaluate("(()=>{const s=S.sessions.filter(s=>s.league=='ONIONSHD').pop();return s?{id:s.id,raw:JSON.stringify(s)}:null})()")
    chk(f'{tag}: saved into my sessions too',s is not None)
    if s:check_saved(pg,tag,s['id'],s['raw'],exp,tot,len([a for a in fl if a!='M']))

def aba_round(pg,rd,seed,start=None):
    rng=random.Random(seed)
    pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(300)
    if start:pg.locator(start).tap()
    else:pg.select_option('#rd',rd);pg.wait_for_timeout(200);taps(pg,'#st')
    pg.wait_for_timeout(700)
    R=pg.evaluate("()=>{const R=ROUNDS[cur.round];return{ends:R.ends,h:R.halves.map(h=>[h.n,h.t])}}")
    ns=[n for n,t in R['h'] for _ in range(t)];exp=[];tag=rd
    for i,n in enumerate(ns):
        k=1+min(n-1,int(rng.random()*rng.random()*4)) ;miss_all=rng.random()<0.1
        if miss_all:
            for _ in range(n):pg.locator('[data-z="M"]').tap(timeout=5000);pg.wait_for_timeout(40)
            exp.append(['M'])
        else:
            for _ in range(k-1):pg.locator('[data-z="M"]').tap(timeout=5000);pg.wait_for_timeout(40)
            z=rng.choice('ABC');pg.locator(f'[data-z="{z}"]').tap(timeout=5000);pg.wait_for_timeout(40);exp.append([str(PTS[k-1]['ABC'.index(z)])])
        if i<3 or i%10==9 or i==len(ns)-1:
            got=pg.evaluate("cur.ends.filter(e=>e.length)");chk(f'{tag} after target {i+1}: every target score right',got==exp,(got[-3:],exp[-3:]))
            tt=pg.evaluate("total(cur)");chk(f'{tag} after target {i+1}: running total {sum(VAL(a) for e in exp for a in e)}',tt==sum(VAL(a) for e in exp for a in e),tt)
    tot=sum(VAL(a) for e in exp for a in e)
    t=pg.inner_text('#app');chk(f'{tag} finished: Round complete: {tot}',f'Round complete: {tot}' in t,t[:200])
    sid=pg.evaluate("cur.id");raw=None
    pg.locator('#abadone').tap();pg.wait_for_timeout(600)
    raw=pg.evaluate("id=>JSON.stringify(S.sessions.find(s=>s.id==id))",sid)
    check_saved(pg,tag,sid,raw,exp,tot,sum(1 for e in exp if e!=['M']),aba=True)
try:
 with sync_playwright() as p:
  b=p.webkit.launch()
  ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2,user_agent=UA)
  ctx.add_init_script(STANDALONE)
  if not os.environ.get('BASE'):ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(f'http://localhost:{PORT}') else r.abort())
  pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
  pg.goto(BASE+'?tester=steven');pg.wait_for_timeout(1500)
  chk('WebKit, 390 px, touch, installed app (standalone) emulated',pg.evaluate("navigator.standalone===true&&innerWidth==390&&'ontouchstart' in window"))
  pg.evaluate("c=>{S.unlocked=true;if(!S.profile)S.profile='Steven';S.customRounds=[c,{kind:'3d',name:'FR test 3D (10 targets)',targets:10}];save()}",CUSTOM);pg.reload();pg.wait_for_timeout(1500)
  pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(500)
  rds=pg.evaluate("[...document.querySelectorAll('#rd option')].map(o=>o.value).filter(v=>v!='__new')")
  print('rounds offered',rds)
  for n,rd in enumerate(rds):
    if ONLY and ONLY.lower() not in rd.lower():continue
    t0=time.time()
    if pg.evaluate("r=>!!ROUNDS[r].aba",rd):aba_round(pg,rd,n)
    else:target_round(pg,rd,n)
    print(f'--- {rd}: {time.time()-t0:.0f}s',flush=True)
  if not ONLY or ONLY.lower() in 'league':
    c2=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2,user_agent=UA);c2.add_init_script(STANDALONE)
    c2.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE) else (relay(r,r.request) if 'ntfy.sh' in r.request.url else r.abort()))
    p2=c2.new_page();p2.on('pageerror',lambda e:errs.append('league: '+str(e)));p2.on('dialog',lambda d:d.accept())
    p2.goto(BASE+'?tester=nate');p2.wait_for_timeout(1500);p2.evaluate("S.unlocked=true;if(!S.profile)S.profile='Nate';save()");p2.reload();p2.wait_for_timeout(2000)
    t0=time.time();league_round(p2);print(f'--- League: {time.time()-t0:.0f}s',flush=True)
  if not ONLY or ONLY.lower() in 'peel':
    c3=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2,user_agent=UA);c3.add_init_script(STANDALONE)
    c3.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE) else r.abort())
    p3=c3.new_page();p3.on('pageerror',lambda e:errs.append('peel: '+str(e)));p3.on('dialog',lambda d:d.accept())
    p3.goto(BASE+'?tester=nathe');p3.wait_for_timeout(1500);p3.evaluate("S.unlocked=true;save()");p3.reload();p3.wait_for_timeout(1800)
    t0=time.time();peel_round(p3);print(f'--- Peel: {time.time()-t0:.0f}s',flush=True)
  chk('no page errors',not errs,errs[:3])
  b.close()
finally:
  if srv:srv.terminate()
print(f'{len(ok)} passed, {len(bad)} failed')
for x in bad:print('FAILED:',x)
sys.exit(1 if bad else 0)
