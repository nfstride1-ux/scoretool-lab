"""Lingkana Registered Archers (host): blue box = registered for that night, not paid; tap = paid tick (25 Nov 2026).
Needs LK_SNAPSHOT: a private copy of the live league (not in the repo). Relay posts are caught and never sent."""
import json,os,subprocess,sys,time
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
snap=json.load(open(os.environ['LK_SNAPSHOT']))['data']['lg']
SHOT=os.environ.get('LK_SHOT','')
ok=[];bad=[]
def chk(n,c,x=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+(('  '+str(x)[:200]) if x and not c else ''),flush=True)
srv=subprocess.Popen([sys.executable,'-m','http.server','8994'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(0.6)
try:
 with sync_playwright() as p:
  exe=os.environ.get('CHROME','/usr/bin/google-chrome')
  b=p.chromium.launch(**({'executable_path':exe} if os.path.exists(exe) else {}),args=['--headless=new'])
  c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,service_workers='block')
  c.add_init_script("(()=>{if(localStorage.getItem('rp_init'))return;localStorage.setItem('rp_init','1');localStorage.setItem('scoretool.tester','nathe');localStorage.setItem('scoretool.v1',JSON.stringify({profile:'Host Phone',unlocked:true,sessions:[]}))})()")
  def rt(r):
    u=r.request.url
    if 'ntfy.sh' in u:return r.fulfill(status=200,body='')
    if any(h in u for h in ['supabase','clarity','formsubmit']):return r.fulfill(status=200,body='{}')
    return r.continue_()
  c.route('**/*',rt)
  pg=c.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
  pg.goto('http://127.0.0.1:8994/#lk-home');pg.wait_for_timeout(2500)
  pg.evaluate("s=>{const lg=lkEnsure();for(const k of ['reg','sc','grp','paid','pins','order','gn','weeks','drop','claim','fin'])if(k in s)lg[k]=JSON.parse(JSON.stringify(s[k]));save()}",snap)
  N=pg.evaluate("lkShootDates(lkEnsure())")
  paid0=pg.evaluate("JSON.stringify(lkEnsure().paid||{})")
  chk('this phone is a host phone',pg.evaluate("lkCanHost(lkEnsure())"))
  # a new archer signs up for night 3 only
  pg.evaluate("n=>lkApplyReg({name:'Testy Blue',at:Date.now(),nights:[n]},lkEnsure())",N[2])
  tid=pg.evaluate("lkFindArcher(lkEnsure(),'Testy Blue')")
  # two archers from the old every-night list: A signed up for night 2 today (row taken in before the nr flag existed),
  # B only updated their PIN (pin-only record listing all their nights) - that is not a sign-up
  A,B=pg.evaluate("()=>{const lg=lkEnsure();const L=lkKnownRegistrants(lg).filter(a=>!lkIsHostRegName(a.name));return [L[0],L[1]].map(a=>({id:a.id,name:a.name}))}")
  pg.evaluate("([n,id])=>{const r=(lkEnsure().reg[n]||[]).find(x=>x.id===id);r.at=Date.now();delete r.nr;save()}",[N[1],A['id']])
  pg.evaluate("([b,N])=>lkApplyReg({name:b.name,id:b.id,at:Date.now(),pinHash:'h',pinSalt:'s',pinAt:Date.now(),nights:N,pinOnly:1},lkEnsure())",[B,N])
  # wait out the boot sync so the roster is not redrawn under the test
  pg.wait_for_timeout(1500);pg.evaluate("window.lkSyncOnce=async()=>0;window.lkSyncStart=()=>0")
  pg.evaluate("lkFlowHome(LK_CODE)");pg.wait_for_timeout(300)
  btn=pg.locator('#lkhome button, #lkhome a').filter(has_text='Registered Archers')
  btn.first.click();pg.wait_for_timeout(1500)
  chk('Registered Archers opens with paid boxes (host)',pg.locator('#lkrosterpage').count()==1 and pg.locator('[data-lkpaid]').count()>0)
  chk('key explains blue = registered, not paid',"Blue = registered for that night" in pg.inner_text('#lkrosterpage'))
  sel=lambda n:f'[data-lkpaid="{tid}"][data-lknight="{n}"]'
  bg=lambda s_:pg.eval_on_selector(s_,"e=>getComputedStyle(e).backgroundColor")
  chk('registered for night 3, not paid: box is blue',pg.eval_on_selector(sel(N[2]),"e=>e.classList.contains('lk-regd')&&!e.checked") and bg(sel(N[2]))=='rgb(59, 130, 246)',bg(sel(N[2])))
  chk('not registered for night 4: plain white box',pg.eval_on_selector(sel(N[3]),"e=>!e.classList.contains('lk-regd')&&!e.checked") and bg(sel(N[3]))=='rgb(255, 255, 255)',bg(sel(N[3])))
  blues=pg.evaluate("[...document.querySelectorAll('.lk-regd')].map(x=>x.getAttribute('data-lkpaid')+'|'+x.getAttribute('data-lknight'))")
  chk('archer who signed up for night 2 today: blue on night 2 only',(A['id']+'|'+N[1]) in blues and not any(x.startswith(A['id']+'|') and x!=A['id']+'|'+N[1] for x in blues),blues)
  chk('PIN-only update is not a sign-up: no blue',not any(x.startswith(B['id']+'|') for x in blues),blues)
  # sign-ups already in the copied league (rows from after night-by-night sign-up went live at 2026-11-25 03:07:58 UTC), unpaid
  CUT=1795576078000;P=json.loads(paid0);listed0=set(pg.evaluate("[...new Set([...document.querySelectorAll('[data-lkpaid]')].map(x=>x.getAttribute('data-lkpaid')))]"))
  pre={r['id']+'|'+n for n,rows in (snap.get('reg') or {}).items() for r in rows if r and r.get('id') in listed0 and (r.get('nr') or (r.get('at') or 0)>=CUT) and not (P.get(n) or {}).get(r['id'])}
  hosts=[i for i in sorted(listed0) if i in ('lkhost:nate','lkhost:nathe','nathe')]
  hexp={h+'|'+n for h in hosts for n in N if not (P.get(n) or {}).get(h)}
  chk('hosts (Nathe, Nate) are on every night: blue on each unpaid night',hexp<=set(blues),(hosts,sorted(hexp-set(blues))))
  exp=pre|hexp|{A['id']+'|'+N[1],tid+'|'+N[2]}
  chk(f'old every-night registrations stay plain (blue only for the {len(exp)} night sign-ups)',sorted(blues)==sorted(exp),(blues,sorted(exp)))
  # existing night-1 paid ticks show as ticked, unchanged
  P1=json.loads(paid0).get(N[0],{})
  shown=pg.evaluate("n=>[...document.querySelectorAll('[data-lknight=\"'+n+'\"]')].filter(x=>x.checked).map(x=>x.getAttribute('data-lkpaid'))",N[0])
  listed=pg.evaluate("[...new Set([...document.querySelectorAll('[data-lkpaid]')].map(x=>x.getAttribute('data-lkpaid')))]")
  want=[i for i in listed if P1.get(i)]
  chk('existing night-1 paid ticks shown ticked (green), none lost',sorted(shown)==sorted(want) and len(want)>0,(len(shown),len(want)))
  chk('opening the list changes no paid ticks',pg.evaluate("JSON.stringify(lkEnsure().paid||{})")==paid0)
  if SHOT:
    pg.evaluate("s=>document.querySelector(s).scrollIntoView({block:'center',inline:'nearest'})",sel(N[2]));pg.wait_for_timeout(200);pg.screenshot(path=SHOT,full_page=True)
  pg.locator(sel(N[2])).tap();pg.wait_for_timeout(400)
  chk('tap blue box: ticked paid, turns green',pg.eval_on_selector(sel(N[2]),"e=>e.checked&&!e.classList.contains('lk-regd')") and bg(sel(N[2]))=='rgb(22, 163, 74)',bg(sel(N[2])))
  chk('paid tick stored the same way (lg.paid[night][id])',pg.evaluate("([n,i])=>!!((lkEnsure().paid||{})[n]||{})[i]",[N[2],tid]))
  if SHOT:pg.screenshot(path=SHOT.replace('.png','_paid.png'))
  pg.locator(sel(N[2])).tap();pg.wait_for_timeout(400)
  chk('untick: back to blue, paid cleared',pg.eval_on_selector(sel(N[2]),"e=>!e.checked&&e.classList.contains('lk-regd')") and not pg.evaluate("([n,i])=>!!((lkEnsure().paid||{})[n]||{})[i]",[N[2],tid]))
  after=json.loads(pg.evaluate("JSON.stringify(lkEnsure().paid||{})"));before=json.loads(paid0)
  chk('other paid ticks untouched',all({k:v for k,v in after.get(n,{}).items() if v}=={k:v for k,v in before.get(n,{}).items() if v} for n in set(before)|set(after)))
  # the per-night pot paid list (Club pot card) uses the same blue
  pot=pg.evaluate("([a])=>{window._lkPotNight=2;const d=document.createElement('div');d.innerHTML=lkPotHTML(lkEnsure());const box=[...d.querySelectorAll('[data-lkpaid]')].find(x=>x.getAttribute('data-lkpaid')===a);const blue=[...d.querySelectorAll('.lk-regd')].length;const all=[...d.querySelectorAll('[data-lkpaid]')].length;window._lkPotNight=0;return {a:box?box.className:null,blue,all,key:d.textContent.includes('Blue = registered for this night')}}",[A['id']])
  chk('Club pot paid list (night 2): same blue for the night-2 sign-up',bool(pot['a']) and 'lk-regd' in pot['a'] and pot['key'],pot)
  q=c.new_page();q.goto('http://127.0.0.1:8994/#lk-register');q.wait_for_timeout(2000)
  chk('#lk-register still opens',q.locator('#lkregform').count()==1 and q.locator('#lkretform').count()==1)
  chk('no page errors',not errs,errs)
  b.close()
finally:srv.terminate()
print(f'\n{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
