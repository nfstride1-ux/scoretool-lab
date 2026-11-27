# Score photos (photos.js): optional Add a photo after finishing (Just me, Casual, League) with an easy Skip; Past sessions add /
# replace / remove; shrink to <=640px long edge, JPEG <=40 KB, 96px thumb; IndexedDB only; upload when linked + online via the
# token-checked RPC, queued offline; missing RPC (SQL not run) = quietly nothing. Tester 'steven', 390px, TEST data only, network mocked.
import subprocess,sys,time,os,json,re,base64,io,random
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-photos');os.makedirs(SH,exist_ok=True)
import freeport;PORT=freeport.get();ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n,flush=True)
srv=subprocess.Popen([sys.executable,'-m','http.server',PORT],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
EMO=re.compile('[\U0001F300-\U0001FAFF\u2600-\u27BF]')
# a big busy photo (4000x3000, noisy) so the shrink has real work to do
random.seed(1);im=Image.new('RGB',(4000,3000))
px=im.load()
for y in range(0,3000,4):
  for x in range(0,4000,4):
    c=(random.randrange(256),(x*7)%256,(y*5)%256)
    for dy in range(4):
      for dx in range(4):px[x+dx,y+dy]=c
BIG='/tmp/photos_test_big.jpg';im.save(BIG,quality=92);print('test photo bytes',os.path.getsize(BIG))
MODE={'photo':'missing'};CALLS=[]
def sb(route):
  u=route.request.url
  if '/rpc/scoretool_save_photo' in u or '/rpc/scoretool_remove_photo' in u:
    CALLS.append((u.rsplit('/',1)[1],json.loads(route.request.post_data or '{}')))
    if MODE['photo']=='missing':return route.fulfill(status=404,content_type='application/json',body=json.dumps({'code':'PGRST202','message':'Could not find the function'}))
    return route.fulfill(status=200,content_type='application/json',body='{"ok":true}')
  route.fulfill(status=200,content_type='application/json',body='null')
PH="(id)=>new Promise(r=>{const o=indexedDB.open('scoretool-photos',1);o.onsuccess=()=>{const g=o.result.transaction('photos').objectStore('photos').get('steven:'+id);g.onsuccess=()=>r(g.result?{n:g.result.photo.length,b:Math.floor(g.result.photo.length*3/4),t:g.result.thumb.length,w:g.result.w,h:g.result.h,p:g.result.photo.slice(0,4),tp:g.result.thumb.slice(0,4)}:null)}})"
TD="(b64)=>new Promise(r=>{const i=new Image();i.onload=()=>r([i.width,i.height]);i.src='data:image/jpeg;base64,'+b64})"
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);pg=ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and 'Failed to load resource' not in m.text and errs.append(m.text))
  pg.on('dialog',lambda d:d.accept())
  ctx.route('https://sllsqpfqwckwtljzjxli.supabase.co/**',sb)
  ctx.route('https://ntfy.sh/**',lambda r:r.fulfill(status=200,content_type='application/json',body='',headers={'access-control-allow-origin':'*'}))   # never the real relay
  ctx.route('https://archerycalendars.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body='{"events":[]}',headers={'access-control-allow-origin':'*'}))
  pg.goto(f'http://localhost:{PORT}/?tester=steven');pg.wait_for_timeout(1200)
  E=pg.evaluate
  E("""()=>{S.unlocked=true;if(!S.profile)S.profile='Steven Test';const e=n=>[...Array(n)].map(()=>['10','9','8']);
   S.sessions=S.sessions.filter(s=>!/^ph/.test(s.id));
   [['ph1','2026-10-20'],['ph2','2026-10-21'],['ph3','2026-10-22']].forEach(([id,d])=>S.sessions.push({id,date:d,round:'Indoor WA 18m',ends:e(20),pos:[],src:'practice',finished:true}));save();
   Object.keys(localStorage).filter(k=>/^scoretool\\.cal\\.steven\\.ph/.test(k)||k=='scoretool.cal.steven.link').forEach(k=>localStorage.removeItem(k));
   localStorage.setItem('scoretool.cal.steven.prompted','1');indexedDB.deleteDatabase('scoretool-photos')}""")
  pg.reload();pg.wait_for_timeout(2500)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(400)
  OTH="JSON.stringify(Object.keys(localStorage).filter(k=>!/^scoretool\\.cal\\.steven\\.(ph|link|base|sent|events|force|prompted)/.test(k)&&!/^scoretool\\.(v|dname)/.test(k)).sort().map(k=>[k,k=='scoretool.state'||/^scoretool\\.steven/.test(k)?'':localStorage.getItem(k)]))"
  o0=E(OTH);SN="JSON.stringify(S.sessions.filter(s=>/^ph/.test(s.id)))";s0=E(SN)
  def fin(id):E(f"()=>{{cur=S.sessions.find(s=>s.id=='{id}');sv='sheet';nav('score')}}");pg.wait_for_timeout(600)
  def past():E("()=>{cur=null;sv='sheet';nav('score')}");pg.wait_for_timeout(700)
  def add(sel):
    with pg.expect_file_chooser() as fc:pg.click(sel)
    fc.value.set_files(BIG);pg.wait_for_timeout(2500)
  # ---- Just me finish screen ----
  fin('ph1')
  bx=pg.locator('.phbox-fin[data-phbox="ph1"]')
  chk('Just me finish: optional Add a photo + Skip',bx.count()==1 and bx.locator('[data-phact=add]').count()==1 and bx.locator('[data-phact=skip]').count()==1)
  chk('camera line icon, no emoji',bx.locator('[data-phact=add] svg').count()==1 and not EMO.search(bx.inner_text()))
  bx.scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'01-justme-finish.png'))
  add('.phbox-fin[data-phbox="ph1"] [data-phact=add]')
  r=E(PH,'ph1');print('stored',r)
  chk('shrunk: JPEG <= 40 KB, long edge <= 640',bool(r) and r['b']<=40*1024 and max(r['w'],r['h'])<=640 and r['p']=='/9j/')
  tw=E(f"async()=>{{const o=await new Promise(r=>{{const q=indexedDB.open('scoretool-photos',1);q.onsuccess=()=>r(q.result)}});return await new Promise(r=>{{const g=o.transaction('photos').objectStore('photos').get('steven:ph1');g.onsuccess=()=>({TD})(g.result.thumb).then(r)}})}}")
  chk('96px thumb',tw==[96,96])
  chk('finish screen now shows thumb + Replace + Remove',pg.locator('.phbox-fin[data-phbox="ph1"] .phthumb img').count()==1 and 'Replace photo' in pg.locator('.phbox-fin[data-phbox="ph1"]').inner_text())
  pg.locator('.phbox-fin[data-phbox="ph1"]').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'02-justme-photo-added.png'))
  chk('not linked: nothing uploaded',not CALLS)
  # ---- viewer ----
  pg.click('.phbox-fin[data-phbox="ph1"] .phthumb');pg.wait_for_selector('.phov',timeout=4000);pg.wait_for_timeout(300)
  chk('full-size viewer with a Back button',pg.locator('.phov [data-phv=back]').count()==1 and pg.locator('.phov img').count()==1)
  pg.screenshot(path=os.path.join(SH,'03-viewer.png'))
  pg.click('.phov [data-phv=back]');pg.wait_for_timeout(200);chk('Back closes the viewer',pg.locator('.phov').count()==0)
  # ---- Skip ----
  fin('ph3');pg.click('.phbox-fin[data-phbox="ph3"] [data-phact=skip]');pg.wait_for_timeout(200)
  chk('Skip hides the card',pg.locator('.phbox-fin[data-phbox="ph3"] [data-phact]').count()==0)
  fin('ph3');chk('Skip is remembered',pg.locator('.phbox-fin[data-phbox="ph3"] [data-phact]').count()==0)
  past();chk('Past sessions still offer Add photo after Skip',pg.locator('.phbox-row[data-phbox="ph3"] [data-phact=add]').count()==1)
  chk('Past sessions: ph1 thumb + Replace + Remove',pg.locator('.phbox-row[data-phbox="ph1"] .phthumb').count()==1 and pg.locator('.phbox-row[data-phbox="ph1"] [data-phact=del]').count()==1)
  pg.locator('.phbox-row[data-phbox="ph1"]').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'04-past-sessions.png'))
  # ---- linked, SQL not run yet: quiet ----
  E("localStorage.setItem('scoretool.cal.steven.link',JSON.stringify('ab'.repeat(24)))");E("phTick()");pg.wait_for_timeout(1200)
  chk('linked, SQL not run: tried once, quietly nothing saved',len(CALLS)>=1 and not E("localStorage.getItem('scoretool.cal.steven.phsent')") and pg.locator('.toast:visible').count()==0)
  # ---- SQL run: uploads ----
  MODE['photo']='ok';CALLS.clear();E("phTick()");pg.wait_for_timeout(1500)
  up=[c for c in CALLS if c[0]=='scoretool_save_photo']
  chk('uploads via scoretool_save_photo with the link token',bool(up) and up[0][1]['p_source_id']=='steven:ph1' and up[0][1]['p_token']=='ab'*24 and up[0][1]['p_photo'].startswith('/9j/') and up[0][1]['p_thumb'].startswith('/9j/'))
  chk('marked uploaded (phsent)','ph1' in (E("JSON.parse(localStorage.getItem('scoretool.cal.steven.phsent')||'{}')") or {}))
  CALLS.clear();E("phTick()");pg.wait_for_timeout(800);chk('not uploaded twice',not CALLS)
  past();chk('status: on Archery Calendar','on Archery Calendar' in pg.locator('.phbox-row[data-phbox="ph1"]').inner_text())
  # ---- offline queue ----
  ctx.set_offline(True);pg.wait_for_timeout(200);add('.phbox-row[data-phbox="ph2"] [data-phact=add]')
  chk('offline: photo saved, nothing sent',E(PH,'ph2') is not None and not CALLS)
  chk('offline: shows waiting to upload','waiting to upload' in pg.locator('.phbox-row[data-phbox="ph2"]').inner_text())
  ctx.set_offline(False);E("dispatchEvent(new Event('online'))");pg.wait_for_timeout(1800)
  chk('back online: queued photo uploads',any(c[0]=='scoretool_save_photo' and c[1]['p_source_id']=='steven:ph2' for c in CALLS))
  # ---- replace ----
  CALLS.clear();past();add('.phbox-row[data-phbox="ph1"] [data-phact=add]');pg.wait_for_timeout(800)
  chk('replace: uploads again for the same score',any(c[0]=='scoretool_save_photo' and c[1]['p_source_id']=='steven:ph1' for c in CALLS))
  # ---- remove ----
  CALLS.clear();past();pg.click('.phbox-row[data-phbox="ph1"] [data-phact=del]');pg.wait_for_timeout(1500)
  chk('remove: gone from the phone',E(PH,'ph1') is None and pg.locator('.phbox-row[data-phbox="ph1"] [data-phact=add]').count()==1)
  chk('remove: removed upstream via scoretool_remove_photo',any(c[0]=='scoretool_remove_photo' and c[1]['p_source_id']=='steven:ph1' for c in CALLS) and not E("JSON.parse(localStorage.getItem('scoretool.cal.steven.phdel')||'[]')").__len__())
  # ---- Casual ----
  code=E("""()=>{const cs=csCreate({self:1,round:'Indoor WA 18m',name:'Photo TEST shoot',ppl:[]});const me=csMe();for(let i=0;i<60;i++)csKey(cs.code,me,'10');return cs.code}""")
  E(f"csView('{code}')");pg.wait_for_timeout(500)
  chk('Casual: my round done shows Add a photo',pg.locator(f'#phx [data-phbox="cs-{code}"] [data-phact=add]').count()==1)
  pg.locator('#phx').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'05-casual-finish.png'))
  code2=E("""()=>{const cs=csCreate({self:1,round:'Indoor WA 18m',name:'Photo TEST shoot 2',ppl:[]});csKey(cs.code,csMe(),'10');return cs.code}""")
  E(f"csView('{code2}')");pg.wait_for_timeout(300);chk('Casual: not done = no photo card',pg.locator('#phx').count()==0)
  # ---- League ----
  lgc=E("""()=>{const lg=lgCreate('Photo TEST league',[],[]);lg.sc={[h2hMe()]:{1:{e:Array(10).fill(['10','9','8']),u:Date.now(),by:h2hMe(),f:'vert'}}};save();return lg.code}""")
  E(f"lgView('{lgc}')");pg.wait_for_timeout(500)
  chk('League: my 300 done shows Add a photo',pg.locator(f'#phx [data-phbox="lg-{lgc}-w1"] [data-phact=add]').count()==1)
  pg.locator('#phx').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'06-league-finish.png'))
  # ---- nothing else changed ----
  E("()=>{S.casual=S.casual.filter(c=>!/Photo TEST/.test(c.name));S.leagues=S.leagues.filter(l=>!/Photo TEST/.test(l.name));save()}")
  chk('score records unchanged',E(SN)==s0)
  o1=E(OTH);chk('no other stored keys changed',o1==o0)
  if o1!=o0:print(set(map(tuple,json.loads(o1)))^set(map(tuple,json.loads(o0))))
  chk('no page errors',not errs)
  if errs:print(errs[:5])
  # tidy test data
  E("()=>{S.sessions=S.sessions.filter(s=>!/^ph/.test(s.id));save();Object.keys(localStorage).filter(k=>/^scoretool\\.cal\\.steven\\./.test(k)).forEach(k=>localStorage.removeItem(k))}")
  b.close()
srv.terminate()
print(f'{len(ok)} passed, {len(bad)} failed',bad)
sys.exit(1 if bad else 0)
