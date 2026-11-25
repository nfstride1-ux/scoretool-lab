# Send past rounds to Archery Calendar (calsync.js): Past sessions button / status, event matching (one match = confirm, several = pick
# with 'None of these', none or offline = sent untied via scoretool.cal.<tester>.force), not linked = link prompt, Settings bulk list.
# Tester 'steven' on a fresh 390px phone, seeded TEST sessions only; archerycalendars.com events and the Supabase RPC are mocked.
import subprocess,sys,time,os,json,re
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import nm_seed
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SH=os.path.join(ROOT,'shots-sendpast');os.makedirs(SH,exist_ok=True)
PORT='8798';ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n,flush=True)
srv=subprocess.Popen([sys.executable,'-m','http.server',PORT],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
EMO=re.compile('[\U0001F300-\U0001FAFF\u2600-\u27BF]')
EVS={'generated':'test','events':[
 {'id':'t-one','name':'Test Indoor – Club A','start_date':'2026-09-05','end_date':'2026-09-05','state':'WA','discipline':'Indoor','category':'competition','host':'Club A','location':'Hall A'},
 {'id':'t-two-a','name':'Test Target Shoot','start_date':'2026-09-11','end_date':'2026-09-13','state':'WA','discipline':'Target','category':'competition','host':'Club B'},
 {'id':'t-two-b','name':'Test Club Day','start_date':'2026-09-12','end_date':'2026-09-12','state':'VIC','discipline':'Indoor','category':'club','host':'Club C'},
 {'id':'t-bulk','name':'Test Bulk Shoot','start_date':'2026-08-01','end_date':'2026-08-01','state':'WA','discipline':'Indoor','category':'competition','host':'Club D'}]}
SENT=[]
def rpc(route):
  if 'scoretool_save_score' in route.request.url:SENT.append(json.loads(route.request.post_data or '{}'))
  route.fulfill(status=200,content_type='application/json',body='null')
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--headless=new'])
  ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2);pg=ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  ctx.route('https://archerycalendars.com/data/events.json*',lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps(EVS),headers={'access-control-allow-origin':'*'}))
  ctx.route('https://sllsqpfqwckwtljzjxli.supabase.co/**',rpc)
  pg.goto(f'http://localhost:{PORT}/?tester=steven');pg.wait_for_timeout(1200)
  E=pg.evaluate
  E("""()=>{S.unlocked=true;if(!S.profile)S.profile='Steven Test';const e=n=>[...Array(n)].map(()=>['10','9','8']);
   S.sessions=S.sessions.filter(s=>!/^sp/.test(s.id));
   [['sp1','2026-09-05'],['sp2','2026-09-12'],['sp3','2026-09-19'],['sp7','2026-08-01'],['sp8','2026-08-02']].forEach(([id,d])=>S.sessions.push({id,date:d,round:'Indoor WA 18m',ends:e(20),pos:[],src:'practice'}));
   S.sessions.push({id:'sp4',date:'2026-09-20',round:'Indoor WA 18m',ends:e(5),pos:[],src:'practice'});save();
   Object.keys(localStorage).filter(k=>k.startsWith('scoretool.cal.steven.')).forEach(k=>localStorage.removeItem(k));
   localStorage.setItem('scoretool.cal.steven.prompted','1')}""")
  OTHER=E("()=>JSON.stringify(Object.keys(localStorage).filter(k=>!k.startsWith('scoretool.cal.steven.')&&!/^scoretool\\.(v|state|steven|dname)/.test(k)).sort().map(k=>[k,localStorage.getItem(k)]))")
  pg.reload();pg.wait_for_timeout(2500)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(400)
  SN="JSON.stringify(S.sessions)";s0=E(SN)
  base=E("JSON.parse(localStorage.getItem('scoretool.cal.steven.base')||'null')")
  chk('past rounds are in the baseline (never sent on their own)',isinstance(base,list) and 'sp1' in base)
  def past():
    E("()=>{cur=null;sv='sheet';nav('score')}");pg.wait_for_timeout(700)
  past()
  chk('Send button on finished unsent rounds',all(pg.locator(f'[data-calsend="{i}"]').count()==1 for i in ['sp1','sp2','sp3']))
  chk('no button on an unfinished round',pg.locator('[data-calsend="sp4"]').count()==0)
  chk('button uses a line icon, no emoji',pg.locator('[data-calsend="sp1"] svg').count()==1 and not EMO.search(pg.locator('[data-calsend="sp1"]').inner_text()))
  # not linked: the link prompt shows even though it was shown before
  pg.click('[data-calsend="sp1"]');pg.wait_for_timeout(600)
  chk('not linked: shows the link prompt',pg.locator('#calPrompt').count()==1 and pg.locator('#calov').count()==0 and not SENT)
  pg.locator('#calPrompt').screenshot(path=os.path.join(SH,'01-not-linked-prompt.png')) if pg.locator('#calPrompt').count() else None
  E("()=>{const d=document.getElementById('calPrompt');if(d)d.remove();localStorage.setItem('scoretool.cal.steven.link',JSON.stringify('ab'.repeat(24)))}")
  past();pg.locator('[data-calsend="sp1"]').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'02-past-sessions.png'))
  # one match: confirm, Back cancels
  pg.click('[data-calsend="sp1"]');pg.wait_for_selector('#calov',timeout=5000);pg.wait_for_timeout(300)
  t=pg.locator('#calov').inner_text()
  chk('one match: asks Add to <event>?','add to test indoor - club a?' in t.lower())
  chk('new screen has a Back button',pg.locator('#calov [data-calv=back]').count()==1)
  pg.screenshot(path=os.path.join(SH,'03-one-match-confirm.png'))
  pg.click('#calov [data-calv=back]');pg.wait_for_timeout(600)
  chk('Back closes it and sends nothing',pg.locator('#calov').count()==0 and not SENT and pg.locator('[data-calsend="sp1"]').count()==1)
  pg.click('[data-calsend="sp1"]');pg.wait_for_selector('#calov');pg.click('#calov [data-calv=yes]');pg.wait_for_timeout(2500)
  ev=E("JSON.parse(localStorage.getItem('scoretool.cal.steven.events')||'{}')").get('sp1') or {}
  chk('tied with calSetEv (official, send)',ev.get('id')=='t-one' and ev.get('official')==1 and ev.get('send')==1 and ev.get('date')=='2026-09-05')
  s1=[x for x in SENT if x.get('p_source_id')=='steven:sp1']
  chk('sent with the event name',bool(s1) and s1[-1]['p_round'].startswith('Test Indoor - Club A') and s1[-1]['p_score']==540 and s1[-1]['p_shot_date']=='2026-09-05')
  past()
  chk('sent round shows On Archery Calendar (no button)',pg.locator('[data-calsend="sp1"]').count()==0 and 'On Archery Calendar' in pg.locator('[data-calst=sent]').first.inner_text())
  # several matches: pick, 'None of these' sends untied
  pg.click('[data-calsend="sp2"]');pg.wait_for_selector('#calov');pg.wait_for_timeout(300)
  n=pg.locator('#calov .calevb').count();t=pg.locator('#calov').inner_text()
  chk('several matches: lists both (date range covers the day)',n==2 and 'Test Target Shoot' in t and 'Test Club Day' in t and 'None of these' in t)
  pg.screenshot(path=os.path.join(SH,'04-several-matches.png'))
  pg.click('#calov [data-calv=none]');pg.wait_for_timeout(2500)
  s2=[x for x in SENT if x.get('p_source_id')=='steven:sp2']
  chk('None of these: sent untied under the round name',bool(s2) and s2[-1]['p_round']=='Indoor WA 18m')
  chk('untied goes via the force list',E("(JSON.parse(localStorage.getItem('scoretool.cal.steven.force')||'[]')).includes('sp2')") and not E("!!(JSON.parse(localStorage.getItem('scoretool.cal.steven.events')||'{}')).sp2"))
  # no match while offline: queued, then sent when back online
  past();ctx.set_offline(True);pg.wait_for_timeout(300)
  pg.click('[data-calsend="sp3"]');pg.wait_for_timeout(1500)
  chk('offline: no picker, queued untied',pg.locator('#calov').count()==0 and E("(JSON.parse(localStorage.getItem('scoretool.cal.steven.force')||'[]')).includes('sp3')") and not [x for x in SENT if x.get('p_source_id')=='steven:sp3'])
  past();chk('offline: shows Waiting to send',pg.locator('[data-calst=queued]').count()>=1 and pg.locator('[data-calsend="sp3"]').count()==0)
  pg.locator('[data-calst=queued]').first.scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'05-offline-waiting.png'))
  ctx.set_offline(False);pg.wait_for_timeout(6000)
  chk('back online: queued round is sent',bool([x for x in SENT if x.get('p_source_id')=='steven:sp3']))
  # Settings bulk list
  E("()=>{cur=null;nav('lab_settings')}");pg.wait_for_timeout(900)
  chk('Settings has Send all past finished rounds',pg.locator('#calPast').count()==1 and '(2)' in pg.locator('#calPast').inner_text())
  pg.locator('#calcard').scroll_into_view_if_needed();pg.screenshot(path=os.path.join(SH,'06-settings-card.png'))
  pg.click('#calPast');pg.wait_for_selector('#calov');pg.wait_for_timeout(300)
  ids=pg.eval_on_selector_all('#calov .callist input','a=>a.map(x=>x.value)')
  chk('bulk lists only unsent finished rounds, with checkboxes',sorted(ids)==['sp7','sp8'])
  chk('bulk screen has Back and no emoji',pg.locator('#calov [data-calv=back]').count()==1 and not EMO.search(pg.locator('#calov').inner_text()))
  pg.click('#calAll');pg.wait_for_timeout(200);pg.screenshot(path=os.path.join(SH,'07-bulk-list.png'))
  pg.click('#calGoSel');pg.wait_for_selector('#calov h2:has-text("Add to")',timeout=5000);pg.wait_for_timeout(300)
  chk('bulk: sp8 (no match) goes untied, sp7 (one match) asks to confirm','add to test bulk shoot?' in pg.locator('#calov').inner_text().lower() and 'round 2 of 2' in pg.locator('#calov').inner_text().lower())
  pg.click('#calov [data-calv=yes]');pg.wait_for_timeout(3000)
  s7=[x for x in SENT if x.get('p_source_id')=='steven:sp7'];s8=[x for x in SENT if x.get('p_source_id')=='steven:sp8']
  chk('bulk: both sent (sp7 tied, sp8 no match so untied)',bool(s7) and s7[-1]['p_round'].startswith('Test Bulk Shoot') and bool(s8) and s8[-1]['p_round']=='Indoor WA 18m')
  E("()=>{nav('lab_settings')}");pg.wait_for_timeout(600)
  chk('Settings count drops to none left','(' not in pg.locator('#calPast').inner_text())
  # nothing else changed
  chk('session records unchanged',E(SN)==s0)
  NOW=E("()=>JSON.stringify(Object.keys(localStorage).filter(k=>!k.startsWith('scoretool.cal.steven.')&&!/^scoretool\\.(v|state|steven|dname)/.test(k)).sort().map(k=>[k,localStorage.getItem(k)]))")
  if NOW!=OTHER:print(' key diff:',sorted(set(map(tuple,json.loads(NOW)))^set(map(tuple,json.loads(OTHER))))[:6])
  chk('only scoretool.cal.steven.* keys written',NOW==OTHER)
  css=open(os.path.join(ROOT,'lab.css')).read();blk=css[css.find('/* Send past rounds'):]
  chk('no purple in the new styles',not re.search(r'purple|#(7c3aed|8b5cf6|a855f7|9333ea|6d28d9)',blk,re.I))
  chk('no page errors',not [e for e in errs if 'favicon' not in e and 'net::' not in e]);print(' errors:',errs[:5])
  b.close()
srv.terminate();print(f'\n{len(ok)} passed, {len(bad)} failed');sys.exit(1 if bad else 0)
