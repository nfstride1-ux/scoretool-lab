# Round pickers show arrow counts (display only), Past sessions shows 'x of y ends/targets' beside Incomplete, Ghost match uses a
# line icon (no emoji). Test tester 'steven' on a fresh 390px phone; seeded TEST sessions only. Screenshots in shots-pickers/.
import subprocess,sys,time,os,json,re
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-pickers');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n,flush=True)
srv=subprocess.Popen([sys.executable,'-m','http.server','8797'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
EMO=re.compile('[\U0001F300-\U0001FAFF\u2600-\u27BF]')
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);pg=ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto('http://localhost:8797/?tester=steven');pg.wait_for_timeout(1200)
  E=pg.evaluate
  E("""()=>{S.unlocked=true;if(!S.profile)S.profile='Steven Test';const e=n=>[...Array(n)].map(()=>['10','9','8']);
   S.sessions=S.sessions.filter(s=>!/^pk/.test(s.id));
   S.sessions.push({id:'pkinc',date:'2026-10-22',round:'Indoor WA 18m',ends:e(10),pos:[],src:'practice'});
   S.sessions.push({id:'pkfull',date:'2026-10-21',round:'Practice 10 ends × 3',ends:e(10),pos:[],src:'practice'});
   S.sessions.push({id:'pkaba',date:'2026-10-20',round:ABA_IC,ends:[['20'],['18'],['16'],['14'],['12']],pos:[],aba:[...Array(5)].map(()=>({m:0,k:1,z:'A'})),src:'practice'});save()}""")
  pg.reload();pg.wait_for_timeout(2000)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(400)
  SN="JSON.stringify(S.sessions)";s0=E(SN)
  E("()=>{cur=null;sv='sheet';go('score')}") if E("typeof go=='function'") else pg.click('nav [data-v=score]')
  pg.wait_for_timeout(800)
  if not pg.locator('#rd').count():pg.click('nav [data-v=score]');pg.wait_for_timeout(800)
  if pg.locator('[data-cstp="solo"]').count():pg.click('[data-cstp="solo"]');pg.wait_for_timeout(300)
  def rounds():
    return [o for o in pg.eval_on_selector_all('#rd option','o=>o.map(x=>[x.value,x.textContent])') if o[0] not in ('__new','')]
  std=rounds()
  chk('every Just me round on screen shows its arrow count',bool(std) and all(re.search(r'arrows\)$',t) for v,t in std))
  chk('values stay the stored round names',all(E(f"!!ROUNDS[{json.dumps(v)}]") for v,t in std))
  chk('count = ends x arrows for the rounds on screen',all(t.endswith(f"({E('r=>ROUNDS[r].ends*ROUNDS[r].ape',v)} arrows)") for v,t in std if not E('r=>!!ROUNDS[r].halves',v)))
  chk('no new rounds',not any('half, 10' in v for v,t in std))
  pg.click('[data-jdisc="indoor"]');pg.wait_for_timeout(200)
  d=dict(rounds());print(' indoor:',d.get('Indoor WA 18m'),'|',d.get('Vegas 300'))
  chk('Indoor WA 18m (60 arrows)',d.get('Indoor WA 18m')=='Indoor WA 18m (60 arrows)')
  pg.click('[data-jdisc="3d"]');pg.wait_for_timeout(200)
  d3=dict(rounds())
  chk('3D shows targets x arrows',d3.get(E('ABA_IC'),'').endswith('(20 × 3 + 20 × 1 arrows)'))
  pg.click('[data-jdisc="indoor"]');pg.wait_for_timeout(200)
  pg.select_option('#rd','Indoor WA 18m');pg.wait_for_timeout(500)
  gh=E("(document.getElementById('ghwrap')||{}).innerHTML||''")
  chk('Ghost match label has a line icon, no emoji',('Ghost match' in gh) and '<svg' in gh and not EMO.search(gh))
  pg.locator('#rd').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'picker-justme-390.png'))
  # Past sessions
  txt=pg.locator('.card',has_text='Past sessions').first.inner_text()
  chk('10 of 20 ends beside Incomplete','10 of 20 ends' in txt)
  chk('3D counts targets','5 of 40 targets' in txt)
  chk('finished round has no progress or badge',E("(()=>{const b=[...document.querySelectorAll('[data-open=pkfull]')][0].closest('.list-item');return !/Incomplete|of \\d+ ends/i.test(b.innerText)})()"))
  pg.locator('.card',has_text='Past sessions').first.scroll_into_view_if_needed();pg.wait_for_timeout(200)
  pg.screenshot(path=os.path.join(SH,'past-sessions-progress-390.png'))
  chk('Start uses the stored round name',(pg.select_option('#rd','Indoor WA 18m') or True) and (pg.click('#st') or True) and E("cur&&cur.round")=='Indoor WA 18m')
  E("()=>{S.sessions=S.sessions.filter(s=>s!==cur||s.ends.some(e=>e.length));cur=null;sv='sheet';save();score()}");pg.wait_for_timeout(400)
  # Casual
  if pg.locator('[data-cstp="casual"]').count():
    pg.click('[data-cstp="casual"]');pg.wait_for_timeout(300);pg.click('[data-csdisc="indoor"]');pg.wait_for_timeout(300)
    C=pg.eval_on_selector_all('#csrd option','o=>o.map(x=>[x.value,x.textContent])')
    chk('Casual rounds show arrow counts',bool(C) and all(re.search(r'arrows\)$',t) for v,t in C))
    pg.select_option('#csrd','Indoor WA 18m');pg.wait_for_timeout(300)
    chk('Casual keeps stored name',E("csDraft().round")=='Indoor WA 18m')
    pg.locator('#csrd').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'picker-casual-390.png'))
    pg.click('[data-csdisc="3d"]');pg.wait_for_timeout(300)
    T=pg.eval_on_selector_all('#cs3t option','o=>o.map(x=>x.textContent)');print(' 3D:',T)
    chk('Casual 3D types show arrows a target',bool(T) and all('a target)' in t for t in T))
    pg.locator('#cs3t').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'picker-casual3d-390.png'))
  else:chk('Casual setup reachable',False)
  chk('stored sessions untouched',json.loads(E(SN))==json.loads(s0))
  chk('no console errors',not errs);errs and print(errs[:4])
  ctx.close();b.close()
srv.terminate();print('OK',len(ok));print('FAIL',bad)
