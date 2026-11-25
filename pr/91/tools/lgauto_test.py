# Queue item 4 (31 Oct 2026): League scoring on a shared phone auto-advances to the next archer by default, only after the 3rd arrow is
# saved, keeping the page where it is; a line confirms the end just saved. "Stay on each archer ... tap Next" is an option (S.lgNextBtn).
# TEST league with a test-only code, tester nathe, this browser only. WebKit 390 x 844, touch, home-screen mode. Relay mocked.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.environ.get('ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok=[];bad=[]
def chk(n,c,i=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+('' if c else '  '+str(i)[:300]),flush=True)
import freeport;PORT=int(os.environ.get("PORT") or freeport.get());BASE=os.environ.get('BASE') or f"http://localhost:{PORT}/"
srv=None if os.environ.get("BASE") else subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
import atexit;atexit.register(lambda:srv and srv.poll() is None and srv.terminate())
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
STANDALONE="Object.defineProperty(navigator,'standalone',{get:()=>true});"
errs=[]
with sync_playwright() as p:
  b=p.webkit.launch();ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,user_agent=UA,service_workers='block')
  ctx.add_init_script(STANDALONE);ctx.route('**/ntfy.sh/**',lambda r:r.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'}))
  H=ctx.new_page();H.on('pageerror',lambda e:errs.append(str(e)[:200]));H.on('dialog',lambda d:d.accept())
  H.goto(BASE+'?tester=nathe');H.wait_for_timeout(1500);H.evaluate("()=>{S.unlocked=true;if(!S.profile)S.profile='Test';delete S.lgNextBtn;save()}");H.reload();H.wait_for_timeout(2000)
  code=H.evaluate("(()=>lgCreate('Auto test',['logan','steven','joseph','michael'],[]).code)()")
  chk('test league has its own test code',code!='ONIONSHD' and len(code)==8)
  H.evaluate(f"(()=>{{lgSetGroups('{code}',1,[['nathe','logan','steven'],['joseph','michael']]);window._csMode='league';lgView('{code}')}})()");H.wait_for_timeout(500)
  H.evaluate("document.querySelector('[data-lgsg=\"0\"]').click()");H.wait_for_timeout(500)
  on=lambda:H.evaluate("document.querySelector('#lgentry .lc-chip.on').dataset.lgid")
  chk('the Next option is shown and off by default',H.locator('#lgnextpref').count()==1 and not H.locator('#lgnextpref').is_checked())
  first=on()
  H.evaluate("()=>{const sc=__scroller;sc.scrollTop=Math.min(80,Math.max(0,sc.scrollHeight-sc.clientHeight-5))}");H.wait_for_timeout(200);y0=H.evaluate("__scroller.scrollTop")
  # watch: the active archer must not change until the 3rd arrow is in storage
  H.evaluate(f"""()=>{{window.__adv=[];const o=window.lgNextArcher;window.lgNextArcher=o;const ob=new MutationObserver(()=>{{const c=document.querySelector('#lgentry .lc-chip.on');if(c&&c.dataset.lgid!='{first}'){{const s=JSON.parse(localStorage.getItem(KEY));const lg=(s.leagues||[]).find(l=>l.code=='{code}');const e=lg&&lg.sc&&lg.sc['{first}']&&lg.sc['{first}'][1];window.__adv.push(e?e.e[0].length:-1);ob.disconnect()}}}});ob.observe(document.getElementById('app'),{{subtree:true,childList:true}})}}""")
  for k in ['X','9']:H.click(f'#lgentry [data-lgk="{k}"]');H.wait_for_timeout(120)
  chk('after 2 arrows the card stays on the same archer',on()==first)
  H.click('#lgentry [data-lgk="8"]');H.wait_for_timeout(250)
  second=on()
  chk('after the 3rd arrow the card moves to the next archer by itself',second!=first and H.locator('#lgnextarcher').count()==0 and H.locator('#lgentry [data-lgk]').count()==7,(first,second))
  chk('the move happens only once the 3rd arrow is saved (3 arrows in storage at that moment)',H.evaluate("window.__adv")==[3],H.evaluate("window.__adv"))
  chk('first archer end kept as X,9,8',H.evaluate(f"lgEnt(lgGet('{code}'),'{first}',1).e[0].join()")=='X,9,8')
  t=H.inner_text('#lglast') if H.locator('#lglast').count() else ''
  chk('a line confirms the end just saved: Saved: name, end 1: X 9 8.','end 1: X 9 8.' in t and t.startswith('Saved:'),t)
  y1=H.evaluate("__scroller.scrollTop")
  chk('no jump to the top when it moves on',y0>0 and abs(y1-y0)<=3,(y0,y1))
  for k in ['10','9','9']:H.click(f'#lgentry [data-lgk="{k}"]');H.wait_for_timeout(120)
  third=on();chk('the next archer after that, same order',third not in (first,second),(first,second,third))
  for k in ['9','9','9']:H.click(f'#lgentry [data-lgk="{k}"]');H.wait_for_timeout(120)
  chk('after the last archer it goes back to the first archer for end 2',on()==first)
  H.click('#lgentry [data-lgk="X"]');H.wait_for_timeout(120);H.click('#lgundo');H.wait_for_timeout(150)
  chk('Undo still works on the current archer and clears the saved line',on()==first and H.evaluate(f"lgEnt(lgGet('{code}'),'{first}',1).e.length")==1 and H.locator('#lglast').count()==0)
  # option on: stays with Next
  H.click('#lgnextpref');H.wait_for_timeout(250)
  chk('ticking the option is kept on this phone',H.evaluate("JSON.parse(localStorage.getItem(KEY)).lgNextBtn")==1 and H.locator('#lgnextpref').is_checked())
  for k in ['10','10','10']:H.click(f'#lgentry [data-lgk="{k}"]');H.wait_for_timeout(120)
  chk('with the option on: stays on the archer with Next, keys hidden',on()==first and H.locator('#lgnextarcher').count()==1 and H.locator('#lgentry [data-lgk]').count()==0)
  H.click('#lgnextpref');H.wait_for_timeout(250)
  chk('turning the option off while held moves on to the next archer',on()!=first and H.locator('#lgnextarcher').count()==0 and H.evaluate("JSON.parse(localStorage.getItem(KEY)).lgNextBtn")==0)
  H.reload();H.wait_for_timeout(1500)
  chk('scores kept after reload',H.evaluate(f"lgEnt(lgGet('{code}'),'{first}',1).e.map(e=>e.join()).join('|')")=='X,9,8|10,10,10')
  H.evaluate(f"(()=>{{S.leagues=lgAll().filter(l=>l.code!='{code}');delete S.lgNextBtn;save()}})()")
  chk('no page errors',not errs,errs[:3])
  b.close()
print(f'TOTAL {len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
