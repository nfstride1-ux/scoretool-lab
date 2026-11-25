# 18 Oct 2026 Melville 3D: sheet heading from the tied event (fun shoot, not official), the score sent to My events once, paper sheet still official. 390x844.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('ok  ' if c else 'BAD ')+n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-mel3d')
srv=subprocess.Popen([sys.executable,'-m','http.server','8772'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
IC='ABA Interclub 3D (40 targets: 3-arrow half, then 1-arrow half)'
H1=[20,20,20,20,18,18,20,18,20,16, 16,20,18,16,20,20,20,18,18,18];H2=[18,20,18,20]
Z={20:'A',18:'B',16:'C'}
sess={'id':'s1760745600000','date':'2026-10-18','round':IC,'ends':[[str(v)] for v in H1+H2],'pos':[],'note':'','aba':[{'m':0,'k':1,'z':Z[v]} for v in H1+H2],'abaHead':{'name':'Nathaniel Stride'}}
sent=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':844})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  def rpc(route):sent.append(json.loads(route.request.post_data));route.fulfill(status=200,content_type='application/json',body='{"ok":true}')
  pg.route('**/rest/v1/rpc/scoretool_save_score',rpc)
  pg.goto('http://localhost:8772/');pg.wait_for_timeout(1000);nm_seed.pick(pg,'nathe');pg.wait_for_timeout(500);pg.evaluate("S.unlocked=true;save();render()");pg.wait_for_timeout(500)
  for _ in range(3):
    if pg.locator('nav [data-v=score]').is_visible():break
    pg.locator('#app button').first.click();pg.wait_for_timeout(400)
  E=pg.evaluate
  pg.click('nav [data-v=score]');pg.wait_for_timeout(500)
  E("x=>{localStorage.setItem('scoretool.cal.nathe.link',JSON.stringify('ab'.repeat(24)));S.sessions.push(x);save()}",sess)
  before=E("JSON.stringify(S.sessions.find(s=>s.id=='s1760745600000'))")
  E("cur=S.sessions.find(s=>s.id=='s1760745600000');window._abaSid=cur.id;window._abaView='sheet';score()");pg.wait_for_timeout(5500)
  E("score()");pg.wait_for_timeout(400)
  t=pg.inner_text('#abapaper')
  chk('title is the event',pg.inner_text('#abatitle')=='3D - Bowmen of Melville')
  chk('subtitle ABA Interclub scoring',pg.inner_text('#abasub')=='ABA Interclub scoring')
  chk('fun shoot - not official',pg.inner_text('#abaoff')=='Fun shoot - not official' and 'Official Score Sheet' not in t and 'ABA INTERCLUB' not in t)
  chk('kicker names the event','3D - Bowmen of Melville' in pg.text_content('#abacard .kicker'))
  chk('event card',  'Fun shoot - not official' in pg.inner_text('#abaev'))
  chk('score record unchanged',E("JSON.stringify(S.sessions.find(s=>s.id=='s1760745600000'))")==before)
  chk('sent once to My events',len(sent)==1 and sent[0]['p_shot_date']=='2026-10-18' and sent[0]['p_score']==450 and sent[0]['p_round']=='3D - Bowmen of Melville · ABA scoring · 1st Compound' and sent[0]['p_location']=='Bowmen of Melville' and sent[0]['p_max'] is None and sent[0]['p_source_id']=='nathe:s1760745600000')
  print(sent)
  pg.locator('#abapaper').scroll_into_view_if_needed();E("scrollTo(0,0)");pg.screenshot(path=SH+'/mel-sheet-top.png')
  pg.locator('#abaev').scroll_into_view_if_needed();pg.screenshot(path=SH+'/mel-event-card.png')
  pg.click('#abaevpick');pg.wait_for_timeout(4000)
  chk('event list for 18 Oct has Melville',pg.locator('[data-ev="ad-melville-3d-2026-10-18"]').count()==1)
  pg.locator('#abaev').scroll_into_view_if_needed();pg.screenshot(path=SH+'/mel-pick-list.png')
  pg.click('#abaevpick');pg.wait_for_timeout(300)
  # official toggle round-trip
  pg.check('#abaevoff');pg.wait_for_timeout(300);chk('marked official shows Official Score Sheet',pg.inner_text('#abaoff')=='Official Score Sheet')
  pg.uncheck('#abaevoff');pg.wait_for_timeout(300);chk('back to fun',pg.inner_text('#abaoff')=='Fun shoot - not official')
  # paper 17 May 2025 stays official Interclub
  E("cur=S.sessions.find(s=>s.id=='aba20250517');window._abaSid=null;score()");pg.wait_for_timeout(400)
  chk('paper sheet still ABA INTERCLUB Official',pg.inner_text('#abatitle')=='ABA INTERCLUB' and pg.inner_text('#abaoff')=='Official Score Sheet')
  # an untied new round is not called official
  x=dict(sess,id='s9',date='2026-10-20');E("x=>{S.sessions.push(x);cur=S.sessions.find(s=>s.id=='s9');window._abaSid=cur.id;window._abaView='sheet';score()}",x);pg.wait_for_timeout(400)
  chk('untied round: not official',pg.inner_text('#abatitle')=='ABA 3D score sheet' and pg.inner_text('#abaoff')=='Not an official score sheet')
  E("S.sessions=S.sessions.filter(s=>s.id!='s9');save()")
  chk('no page errors',not errs);print(errs)
  b.close()
finally:srv.kill()
print(len(ok),'ok',len(bad),'bad',bad)
