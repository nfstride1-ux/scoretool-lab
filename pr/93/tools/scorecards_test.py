# Scorecards (13 Nov 2026, Nathe): Home opens Scorecards at the same size as Score.
# Practice shoots are grouped Target, Indoor, Field, Clout, 3D. Tap opens the finished scorecard.
# Official personal bests sit on the same page. After Finish session, Open this scorecard
# opens that shoot. Classification is display-only: stored sessions are not rewritten.
# Tester nathe, 390x844, throwaway sessions in this browser only. Screenshots in /opt/cursor/artifacts.
import subprocess,sys,time,os,json
from playwright.sync_api import sync_playwright
import guard
import freeport
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART=os.environ.get('ST_ART') or '/opt/cursor/artifacts'
os.makedirs(ART,exist_ok=True)
ok=[];bad=[]
def chk(n,c,i=''):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n+('' if c else '  '+str(i)[:300]),flush=True)
PORT=freeport.get()
srv=subprocess.Popen([sys.executable,'-m','http.server',PORT],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
SEED=r"""()=>{
 S.unlocked=true;if(!S.profile)S.profile=TESTER.name;
 S.customRounds=(S.customRounds||[]).filter(c=>c.name!=='Clout practice 180m');
 S.customRounds.push({name:'Clout practice 180m',disc:'clout',ape:6,xs:true,blocks:[{dist:180,unit:'m',size:122,type:'full',ends:6}]});
 S.sessions=(S.sessions||[]).filter(s=>!/^sc/.test(String(s.id||'')));
 const e=n=>[...Array(n)].map(()=>['9','9','9']);
 S.sessions.push(
  {id:'sctgt',date:'2026-11-13',round:'WA 720 (70m)',ends:[['X','10','10','9','9','8']],pos:[[{x:0.02,y:-0.01},{x:0.05,y:0.02},{x:-0.03,y:0.01},{x:0.08,y:-0.04},{x:-0.02,y:0.06},{x:0.1,y:0.03}]],finished:true,note:''},
  {id:'scind',date:'2026-11-12',round:'Indoor WA 18m',ends:[['X','10','9']],finished:true,note:''},
  {id:'scinc',date:'2026-11-11',round:'Indoor WA 18m',ends:e(10),pos:[],note:''},
  {id:'scfld',date:'2026-11-10',round:'WA Field 24 Marked',ends:[['6','5','4']],finished:true,note:''},
  {id:'sccl',date:'2026-11-09',round:'Clout practice 180m',ends:[['5','5','5','5','5','5']],finished:true,note:''},
  {id:'sc3d',date:'2026-11-08',round:ABA_IC,ends:[['20']],aba:[{m:0,k:1,z:'A'}],finished:true,note:''},
  {id:'scpaper',date:'2026-11-07',round:'WA 720 (70m)',ends:[['10','10','10','10','10','10']],src:'paper',finished:true,note:''}
 );
 if(!S.notes)S.notes={};
 try{if(window.WHATSNEW&&WHATSNEW[0])localStorage.setItem('scoretool.whatsnew.seen',WHATSNEW[0].v)}catch(e){}
 try{localStorage.setItem('scoretool.cal.nathe.prompted','1')}catch(e){}
 save();if(typeof regCustom==='function')regCustom();
 return JSON.stringify(S.sessions);
}"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--headless=new'])
  ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
  pg=ctx.new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.on('console',lambda m:m.type=='error' and 'Failed to load resource' not in m.text and errs.append(m.text))
  pg.goto(f'http://localhost:{PORT}/?tester=nathe');pg.wait_for_timeout(1500)
  raw=pg.evaluate(SEED)
  pg.reload();pg.wait_for_timeout(1800)
  if pg.get_by_text('Demo unlock').count():pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(400)
  snap=pg.evaluate("JSON.stringify(S.sessions)")
  chk('seeded sessions survived reload',snap==raw)
  pg.evaluate("nav('home')");pg.wait_for_timeout(400)
  home=pg.locator('#gocards')
  chk('Home has a Scorecards button',home.count()==1 and 'scorecards' in home.inner_text().lower(),home.inner_text()[:120])
  same=pg.evaluate("""()=>{const a=document.querySelector('[data-go=score]'),b=document.querySelector('#gocards');
   const A=getComputedStyle(a),B=getComputedStyle(b);
   return {h:A.minHeight===B.minHeight,n:parseFloat(A.minHeight),cls:b.className}}""")
  chk('Scorecards is the same weight as Score',same['h'] and same['n']>=100 and 'hub-score' in same['cls'],same)
  pg.screenshot(path=os.path.join(ART,'home-score-and-scorecards.png'))
  home.click();pg.wait_for_timeout(500)
  pg.wait_for_function("()=>document.querySelector('#scpb')&&/Aus Clout|334/.test(document.querySelector('#scpb').innerText)",timeout=8000)
  h1=pg.locator('.labbar h1').inner_text()
  chk('the page is named Scorecards',h1.strip().lower()=='scorecards',h1)
  body=pg.locator('#scorecards').inner_text()
  chk('not named Latest or Past Scores','Latest' not in h1 and 'Past Scores' not in h1 and 'Past sessions' not in h1)
  cats=pg.evaluate("[...document.querySelectorAll('[data-sccat]')].map(e=>e.dataset.sccat)")
  chk('practice groups are Target, Indoor, Field, Clout and 3D',cats==['Target','Indoor','Field','Clout','3D'],cats)
  def cat(name):return pg.locator(f'[data-sccat="{name}"]').inner_text()
  chk('Target holds the WA 720 shoot','WA 720 (70m)' in cat('Target') and '56' in cat('Target'))
  ind=cat('Indoor').lower()
  chk('Indoor holds the indoor shoot and the unfinished round','indoor wa 18m' in ind and '10 of 20 ends' in ind and 'incomplete' in ind,ind[:400])
  chk('Field holds the field shoot','WA Field 24 Marked' in cat('Field'))
  chk('Clout holds the clout shoot','Clout practice 180m' in cat('Clout'))
  chk('3D holds the 3D shoot','3D' in cat('3D') and '20' in cat('3D'))
  chk('a paper competition sheet is not filed under practice',pg.evaluate("!!document.querySelector('[data-sccat] [data-open=scpaper]')")==False)
  chk('that paper sheet can still be opened',pg.locator('#sc-official-shoots [data-open=scpaper]').count()==1)
  chk('Scorecards does not offer delete',pg.locator('#scorecards [data-del]').count()==0)
  pb=pg.locator('#scpb').inner_text()
  chk('official personal bests are on the page','official personal bests' in pb.lower(),pb[:240])
  chk('Target, Indoor, Field, Clout and 3D official lines are on the page',all(pg.locator(f'[data-scpb="{c}"]').count()==1 for c in ['Target','Indoor','Field','Clout','3D']))
  chk('Clout official best is shown','334' in pg.locator('[data-scpb=Clout]').inner_text() or 'Aus Clout' in pg.locator('[data-scpb=Clout]').inner_text())
  chk('3D has no official personal best yet','No official personal best yet' in pg.locator('[data-scpb="3D"]').inner_text())
  chk('a practice round name is not listed as an official personal best','WA 720 (70m)' not in pg.locator('#scpb').inner_text() and 'WA 720 (70m)' not in pg.locator('#scpb-all').inner_text() and 'Clout practice' not in pg.locator('#scpb-all').inner_text())
  chk('notes, photo and calendar stay available on the shoot',pg.locator('[data-scrow=sctgt] .sc-more').count()==1)
  pg.locator('[data-sccat=Target]').scroll_into_view_if_needed();pg.wait_for_timeout(200)
  pg.screenshot(path=os.path.join(ART,'scorecards-categories.png'))
  pg.evaluate("document.getElementById('scpb').scrollIntoView({block:'end'})");pg.wait_for_timeout(250)
  pg.screenshot(path=os.path.join(ART,'scorecards-official-pbs.png'))
  chk('opening the page did not rewrite stored sessions',pg.evaluate("JSON.stringify(S.sessions)")==snap)
  pg.locator('[data-open=sctgt]').click();pg.wait_for_timeout(700)
  sheet=pg.locator('#app').inner_text()
  chk('opened scorecard is the score sheet','Score Sheet' in sheet and '56' in sheet and 'WA 720 (70m)' in sheet)
  chk('opened scorecard has the end and the running total',pg.locator('.ad-tab').count()>=1 and pg.locator('.ad-sum b.big').inner_text().strip()=='56')
  chk('opened scorecard still has end by end when arrows were plotted','End by end' in sheet or pg.locator('.evcard').count()==1)
  chk('opened scorecard still has notes','How did you shoot' in sheet or pg.locator('[data-n]').count()>=1)
  pg.screenshot(path=os.path.join(ART,'scorecard-open.png'))
  chk('back control names Scorecards','Scorecards' in (pg.locator('#labfl').inner_text() or pg.locator('#sback').inner_text()))
  back_id='#labfl' if pg.locator('#labfl').count() else '#sback'
  pg.locator(back_id).click();pg.wait_for_timeout(500)
  chk('back returns to Scorecards',pg.evaluate('view')=='scorecards' and pg.locator('#scorecards').count()==1)
  chk('the shoot is still stored after opening it',pg.evaluate("JSON.stringify(S.sessions)")==snap)
  pg.locator('[data-open=sctgt]').click();pg.wait_for_timeout(600)
  before=pg.evaluate("JSON.stringify(S.sessions)")
  pg.locator('#finsess').scroll_into_view_if_needed();pg.locator('#finsess').click();pg.wait_for_timeout(600)
  done=pg.locator('#app').inner_text()
  chk('after Save and Finish the done screen is shown','all done' in done.lower() and pg.evaluate('view')=='shotdone',done[:240])
  chk('Open this scorecard is on the done screen',pg.locator('#shcard').count()==1 and 'Open this scorecard' in pg.locator('#shcard').inner_text())
  chk('See my wins and Score another round are still there',pg.locator('#shwins').count()==1 and pg.locator('#shnew').count()==1)
  pg.screenshot(path=os.path.join(ART,'save-finish.png'))
  chk('Finish session did not rewrite the stored shoot',pg.evaluate("JSON.stringify(S.sessions)")==before)
  pg.locator('#shcard').click();pg.wait_for_timeout(700)
  chk('Open this scorecard shows that shoot again',pg.locator('.ad-sum b.big').count()==1 and pg.locator('.ad-sum b.big').inner_text().strip()=='56' and 'WA 720 (70m)' in pg.locator('#app').inner_text())
  chk('opening it from the done screen did not rewrite the stored shoot',pg.evaluate("JSON.stringify(S.sessions)")==snap)
  pg.screenshot(path=os.path.join(ART,'scorecard-from-finish.png'))
  pg.evaluate("nav('scorecards')");pg.wait_for_timeout(500)
  if pg.locator('[data-scbow=Longbow]').count():
    pg.locator('[data-scbow=Longbow]').click();pg.wait_for_timeout(300)
    chk('switching the official bow does not rewrite sessions',pg.evaluate("JSON.stringify(S.sessions)")==snap)
    pg.locator('[data-scbow=Compound]').click();pg.wait_for_timeout(300)
  chk('no page errors',not errs,errs[:4])
  b.close()
finally:
 srv.terminate()
print(f'TOTAL {len(ok)} passed, {len(bad)} failed')
if bad:print('FAILED',bad)
sys.exit(1 if bad else 0)
