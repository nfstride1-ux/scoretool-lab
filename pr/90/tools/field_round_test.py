# Field scorer only (WA Field 24). Bugs Eyes uses the indoor spot tabs and zoom (Spot 1/2/3, up to 3x).
# Plotting an end stays on that end until Next, which returns to one continuous scorecard.
# The sheet has one End column (no face/distance groups, no per-group subtotals).
# Opening end 1 stays on end 1. The field arrow list is whole millimetres 4mm to 9mm.
import os,sys,subprocess,time,freeport
from playwright.sync_api import sync_playwright
import guard
import nm_seed
PORT=os.environ.get('ST_PORT') or freeport.get()
srv=None
if not os.environ.get('ST_PORT'):
    ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    srv=subprocess.Popen([sys.executable,'-m','http.server',PORT,'--directory',ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    time.sleep(0.6)
SH=os.environ.get('SHOTS','/tmp/field-round-shots');os.makedirs(SH,exist_ok=True)
ok=[];bad=[]
def chk(n,c):
    (ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n,flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2)
    pg.add_init_script("try{localStorage.setItem('scoretool.cal.nathe.prompted','1');localStorage.setItem('scoretool.whatsnew.seen','v2026-11-12-0804-live')}catch(e){}")
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://127.0.0.1:'+str(PORT)+'/');pg.wait_for_timeout(1200)
    nm_seed.pick(pg,'nathe');pg.wait_for_timeout(400)
    if pg.locator('text=Demo unlock').count():
        pg.get_by_text('Demo unlock').first.click();pg.wait_for_timeout(500)
    E=pg.evaluate
    def start(name):
        E("cur=null;sv='sheet';fldHold=null;fldHoldId=null;if(view!='score')nav('score');else score()");pg.wait_for_timeout(250)
        pg.select_option('#rd',name);pg.wait_for_timeout(100)
        if pg.locator('[data-peg=red]').count():pg.click('[data-peg=red]')
        pg.click('#st');pg.wait_for_timeout(450)
    # indoor chooser is unchanged
    start('Australian Indoor 18m')
    indoor=pg.locator('select[data-arrowsz] option').all_inner_texts()
    def generic(opts):
        return any('/64' in t or 'spine' in t or t.startswith('Custom') or t in [f'{n} mm' for n in range(4,10)] for t in opts)
    chk('indoor chooser lists saved arrows only',bool(indoor) and not generic(indoor) and all('(' in t and t.endswith('mm)') for t in indoor))
    chk('indoor still has one End line',pg.locator('#endno').count()==1 and pg.locator('#endno').inner_text().startswith('End 1 of'))
    # field
    start('WA Field 24 Marked')
    opts=pg.locator('select[data-arrowsz] option').all_inner_texts()
    chk('field chooser is the same saved arrows, not 4mm to 9mm',opts==indoor and not generic(opts))
    chk('catalogue sizes and the field millimetre cap stay in the app',E('arrowFldMaxMM')==9 and E('arrowFldOpts().length')==6 and E("arrowOpts().some(o=>o[0]=='s27')") and E("arrowOpts().some(o=>String(o[1]).indexOf('X10 Parallel Pro')==0)"))
    en=pg.locator('#endno')
    top=E("""()=>{const e=document.querySelector('#endno'),h=document.querySelector('header.top');return {e:e.getBoundingClientRect().top,h:h.getBoundingClientRect().bottom,t:document.querySelector('.ad-title').getBoundingClientRect().top,n:document.querySelectorAll('#endno').length}}""")
    chk('one End number on the field entry header',top['n']==1 and en.inner_text()=='End 1 of 24')
    pg.evaluate('scrollTo(0,0)');pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'field-end-header.png'),clip={'x':0,'y':0,'width':390,'height':280})
    # expand the same select so the phone screenshot shows every size
    pg.evaluate("""()=>{const s=document.querySelector('select[data-arrowsz]');s.size=6;s.style.height='auto';s.style.width='160px'}""")
    pg.locator('select[data-arrowsz]').scroll_into_view_if_needed();pg.wait_for_timeout(100)
    pg.screenshot(path=os.path.join(SH,'field-arrow-chooser.png'),clip={'x':0,'y':80,'width':390,'height':420})
    pg.evaluate("""()=>{const s=document.querySelector('select[data-arrowsz]');s.size=0;s.style.height='';s.style.width=''}""")
    # Bugs Eyes: indoor spot tabs and zoom to 3x, kept across spots
    pg.click('#bugface');pg.wait_for_timeout(350)
    spots=pg.locator('[data-spot]').all_inner_texts()
    chk('bugs eye spot tabs match indoor',spots==['All spots','Spot 1','Spot 2','Spot 3'])
    chk('bugs eye keeps zoom like indoor',E('window._zkOn')==True)
    pg.click('[data-spot="1"]');pg.wait_for_timeout(200)
    pg.click('#zcycle');pg.wait_for_timeout(80);pg.click('#zcycle');pg.wait_for_timeout(120)
    vw=E("""()=>{const v=document.querySelector('#pface').viewBox.baseVal;return {w:v.width,k:PZ.k,lab:document.querySelector('#zcycle').textContent,spot:cur.spot}}""")
    chk('spot 1 zoomed to 3x',abs(vw['k']-3)<0.01 and vw['lab']=='Z3' and abs(vw['w']-0.62/3)<0.02 and vw['spot']==1)
    pg.click('[data-spot="2"]');pg.wait_for_timeout(200)
    vw2=E("""()=>{const v=document.querySelector('#pface').viewBox.baseVal;return {w:v.width,k:PZ.k,spot:cur.spot}}""")
    chk('spot 2 keeps 3x',vw2['spot']==2 and abs(vw2['k']-3)<0.01 and abs(vw2['w']-0.62/3)<0.02)
    pg.locator('[data-spot="1"]').scroll_into_view_if_needed();pg.wait_for_timeout(150)
    pg.screenshot(path=os.path.join(SH,'field-bugs-plot-zoom.png'),clip={'x':0,'y':0,'width':390,'height':844})
    # plotted end does not skip to the next end; Next returns to the sheet
    E("""()=>{cur.spot=1;putArrow('6',{x:0,y:-0.62})}""");pg.wait_for_timeout(200)
    chk('first plotted arrow advances to spot 2',E('cur.spot')==2 and E('cur.ends.length')==1 and pg.locator('#endno').inner_text()=='End 1 of 24')
    E("""()=>{putArrow('5',{x:0,y:0});putArrow('4',{x:0,y:0.62})}""");pg.wait_for_timeout(250)
    chk('bugs end stays on end 1 after three plotted arrows',E("cur.ends.length")==1 and E("justDone")==True and E("sv")=='entry' and pg.locator('#endno').inner_text()=='End 1 of 24')
    pg.click('#enext');pg.wait_for_timeout(400)
    chk('Next returns to the scorecard',pg.locator('.ad-title').inner_text().strip().endswith('Score Sheet') and E('sv')=='sheet')
    # single field face (not bugs) also stays until Next
    E("""()=>{cur.bugs=false;cur.ends=[['6','5']];cur.pos=[[null,null]];cur.ff=[{p:'red',f:80,d:50}];justDone=false;fix=null;fldHold=null;sv='entry';score()}""");pg.wait_for_timeout(250)
    E("""()=>{putArrow('4',{x:0.2,y:0.1})}""");pg.wait_for_timeout(200)
    chk('field face does not skip to the next end',E("cur.ends.length")==1 and pg.locator('#endno').inner_text()=='End 1 of 24' and E('sv')=='entry')
    pg.click('#enext');pg.wait_for_timeout(300)
    # continuous sheet across different faces and distances
    E("""()=>{
      cur.bugs=false;cur.peg='red';cur.ends=[];cur.pos=[];cur.ff=[];
      const faces=[[20,10],[40,20],[40,25],[80,50]];
      for(let i=0;i<4;i++){cur.ends.push(['6','6','5']);cur.pos.push([null,null,null]);cur.ff.push({p:'red',f:faces[i][0],d:faces[i][1]})}
      justDone=false;fix=null;fldHold=null;sv='sheet';save();score();
    }""");pg.wait_for_timeout(300)
    heads=pg.locator('.ad-tab thead').all_inner_texts()
    rows=E("""()=>[...document.querySelectorAll('.ad-tab tbody tr')].map(r=>+r.cells[0].textContent)""")
    body=pg.locator('#app').inner_text()
    chk('one table and one End column',pg.locator('.ad-tab').count()==1 and len(heads)==1 and heads[0].count('End')==1)
    chk('ends run 1,2,3,4 with no face-group headers',rows==[1,2,3,4] and 'field face' not in heads[0] and 'Red peg' not in heads[0])
    chk('no per-section subtotals; footer keeps 6s and the total',body.count("6's:")==1 and pg.locator('.ad-sum .big').inner_text().strip()=='68')
    pg.evaluate('scrollTo(0,0)');pg.wait_for_timeout(80)
    pg.screenshot(path=os.path.join(SH,'field-scorecard.png'),clip={'x':0,'y':0,'width':390,'height':640})
    # end 1 must not open as end 18
    E("""()=>{
      cur.ends=[];cur.pos=[];cur.ff=[];
      for(let i=0;i<17;i++){cur.ends.push(['6','6','6']);cur.pos.push([null,null,null]);cur.ff.push({p:'red',f:80,d:50})}
      justDone=false;fix=null;fldHold=null;fldHoldId=null;sv='sheet';save();score();
    }""");pg.wait_for_timeout(250)
    before=E("""()=>{const s=cur;return JSON.stringify({ends:s.ends,ff:s.ff,peg:s.peg,arrowD:s.arrowD,bugs:!!s.bugs})}""")
    pg.locator('[data-fix="0,0"]').click();pg.wait_for_timeout(300)
    chk('tapping end 1 opens end 1',pg.locator('#endno').inner_text()=='End 1 of 24' and E('fix[0]')==0)
    pg.screenshot(path=os.path.join(SH,'field-open-end-1.png'),clip={'x':0,'y':0,'width':390,'height':240})
    pg.click('#fixcancel');pg.wait_for_timeout(300)
    chk('Done from end 1 returns to the sheet, not end 18',E('sv')=='sheet' and pg.locator('#endno').count()==0 and 'End 18' not in pg.locator('.ad-title').inner_text())
    pg.click('#addsc');pg.wait_for_timeout(300)
    chk('Add Scores continues at the next empty end',pg.locator('#endno').inner_text()=='End 18 of 24')
    seen=[]
    for _ in range(20):
        if not pg.locator('#prevend').count():break
        pg.click('#prevend');pg.wait_for_timeout(60)
        seen.append(pg.locator('#endno').inner_text())
    chk('back from end 18 reaches end 1 and stays there',seen[-1]=='End 1 of 24' and seen[0]=='End 17 of 24' and 'End 18 of 24' not in seen)
    # a saved field session still opens, and its stored shape is not rewritten
    pg.click('#eback');pg.wait_for_timeout(200)
    E("cur=null;sv='sheet';score()");pg.wait_for_timeout(150)
    pg.reload();pg.wait_for_timeout(1200)
    after=E("""()=>{const s=S.sessions[S.sessions.length-1];cur=s;sv='sheet';fix=null;justDone=false;score();return JSON.stringify({ends:s.ends,ff:s.ff,peg:s.peg,arrowD:s.arrowD,bugs:!!s.bugs})}""")
    pg.wait_for_timeout(200)
    chk('saved field session reopens with the same ends, faces and arrow size',before==after and pg.locator('.ad-tab').count()==1)
    chk('no page errors',not errs)
    if errs:print('ERR',errs)
    b.close()
print('PASS',len(ok),'FAIL',len(bad))
for n in bad:print(' -',n)
if srv:srv.terminate()
sys.exit(1 if bad else 0)
