# Custom-round validation, ghost guard for a bad saved round, and Lingkana contrast / registration.
# 390px, dark theme. Does not delete stored rounds. Fresh browser only.
import os, subprocess, sys, time
from playwright.sync_api import sync_playwright
import guard
import freeport
ok=[]; bad=[]
def chk(n,c):
    (ok if c else bad).append(n)
    print(('PASS ' if c else 'FAIL ')+n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT=freeport.get()
SHOTS='/opt/cursor/artifacts'
os.makedirs(SHOTS, exist_ok=True)
srv=subprocess.Popen([sys.executable,'-m','http.server',PORT], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.5)
def contrast(page, sel):
    return page.evaluate("""sel=>{
      function lin(c){c=c/255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)}
      function L(rgb){const m=String(rgb).match(/[\\d.]+/g); if(!m)return 0; const n=m.map(Number); return 0.2126*lin(n[0])+0.7152*lin(n[1])+0.0722*lin(n[2])}
      const el=document.querySelector(sel); if(!el)return 0;
      const cs=getComputedStyle(el); let n=el, bg=cs.backgroundColor;
      while(n&&(bg==='rgba(0, 0, 0, 0)'||bg==='transparent')){n=n.parentElement; if(n)bg=getComputedStyle(n).backgroundColor}
      const a=L(cs.color), b=L(bg), hi=Math.max(a,b), lo=Math.min(a,b);
      return (hi+0.05)/(lo+0.05)
    }""", sel)
try:
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox','--disable-dev-shm-usage','--headless=new'])
        pg=b.new_page(viewport={'width':390,'height':844})
        errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'http://127.0.0.1:{PORT}/?tester=nathe')
        pg.wait_for_timeout(1000)
        pg.evaluate("""()=>{
          localStorage.setItem('scoretool.theme','dark');
          localStorage.setItem('scoretool.whatsnew.seen','v2026-11-11-2216-live');
          try{localStorage.setItem('scoretool.cal.nathe.prompted','1')}catch(e){}
          S.unlocked=true; save();
        }""")
        pg.reload(); pg.wait_for_timeout(1200)
        if pg.locator('#wnx').count(): pg.locator('#wnx').click()
        E=pg.evaluate
        E("nav('score')"); pg.wait_for_timeout(250)
        E("cur=null;sv='sheet';crEdit=null;score()"); pg.wait_for_timeout(200)
        before=E("JSON.stringify(S.customRounds||[])")
        pg.select_option('#rd','__new'); pg.wait_for_timeout(200)
        pg.fill('[data-f=ends]','-5'); pg.dispatch_event('[data-f=ends]','input'); pg.wait_for_timeout(80)
        pg.select_option('#cape','c'); pg.fill('#capec','0'); pg.dispatch_event('#capec','input'); pg.wait_for_timeout(80)
        msg=pg.inner_text('#crerrs')
        chk('negative ends stays typed and is named', pg.input_value('[data-f=ends]')=='-5' and 'Ends: -5 is outside the usual range of 1 to 144' in msg and 'left out until it is fixed' in msg)
        chk('custom 0 arrows stays typed and is named', pg.input_value('#capec')=='0' and 'Arrows per end: 0 is outside the usual range of 1 to 12' in msg)
        chk('max score is not the negative total', pg.inner_text('#cmax')=='—')
        chk('save is off while invalid', pg.locator('#csave').is_disabled())
        chk('invalid form does not write a round', E("JSON.stringify(S.customRounds||[])")==before)
        pg.locator('#crerrs').scroll_into_view_if_needed()
        pg.screenshot(path=os.path.join(SHOTS,'round-validation-390.png'))
        pg.fill('[data-f=ends]','145'); pg.dispatch_event('[data-f=ends]','input')
        chk('145 ends is over the upper bound', '145 is outside the usual range of 1 to 144' in pg.inner_text('#crerrs') and pg.locator('#csave').is_disabled())
        pg.fill('[data-f=ends]','144'); pg.dispatch_event('[data-f=ends]','input')
        pg.fill('#capec','12'); pg.dispatch_event('#capec','input'); pg.wait_for_timeout(80)
        chk('144 ends and 12 arrows is inside the range', pg.inner_text('#cmax')=='17280' and not pg.locator('#csave').is_disabled() and pg.inner_text('#crerrs').strip()=='')
        pg.fill('#cn','QA range round'); pg.click('#csave'); pg.wait_for_timeout(300)
        saved=E("S.customRounds.find(c=>c.name=='QA range round')")
        chk('a valid custom round saves the typed numbers', saved and saved['ape']==12 and saved['blocks'][0]['ends']==144)
        # existing bad round is kept and cannot be re-saved until fixed
        E("""()=>{
          S.customRounds.push({name:'Bad neg',ape:0,xs:true,disc:'target',blocks:[{dist:18,unit:'m',size:40,type:'full',ends:-5}]});
          S.sessions.push({id:'sold',date:'2026-11-01',round:'Bad neg',ends:[['10']],pos:[[]],note:'',finished:true});
          S.lastRound='Bad neg'; save(); regCustom();
        }""")
        E("cur=null;crEdit={i:S.customRounds.length-1};score()"); pg.wait_for_timeout(200)
        chk('editing a saved bad round shows both messages and does not delete it',
            'Ends: -5 is outside' in pg.inner_text('#crerrs') and 'Arrows per end: 0 is outside' in pg.inner_text('#crerrs') and pg.locator('#csave').is_disabled())
        E("document.getElementById('csave').onclick()")
        chk('the bad round is still stored with its original numbers', E("(S.customRounds.find(c=>c.name=='Bad neg')||{}).blocks[0].ends")==-5 and E("(S.customRounds.find(c=>c.name=='Bad neg')||{}).ape")==0)
        # score screen and an arrow must not throw
        E("cur=null;sv='sheet';score()"); pg.wait_for_timeout(300)
        chk('score picker with a negative-ends round does not throw', not any('Invalid array length' in e or 'RangeError' in e for e in errs))
        E("""()=>{
          cur={id:'sneg',date:'2026-11-16',round:'Bad neg',ends:[[]],pos:[[]],note:'',lcT:1};
          S.sessions.push(cur); sv='entry'; score();
        }""")
        pg.wait_for_timeout(250)
        hdr=pg.locator('#endno').inner_text() if pg.locator('#endno').count() else ''
        chk('existing bad round still opens the scorer', 'End 1 of -5' in hdr)
        pg.locator('[data-k="10"]').click(); pg.wait_for_timeout(200)
        chk('an arrow on that round is saved and the round is not removed',
            E("(S.sessions.find(s=>s.id=='sneg')||{}).ends")==[['10']] and E("!!S.customRounds.find(c=>c.name=='Bad neg')"))
        chk('no page error while scoring the bad round', not any('Invalid array length' in e or 'RangeError' in e for e in errs))
        # registration contrast, error, success, dedup
        E("""()=>{ localStorage.setItem('scoretool.lk.reg','[]'); document.body.classList.add('lk-flow'); lkRegisterView(); }""")
        pg.wait_for_timeout(200)
        chk('registration heading is readable', contrast(pg,'#lkregpage h1')>=4.5)
        chk('registration label is readable', contrast(pg,'#lkregpage label')>=4.5)
        chk('optional text stays muted and readable', contrast(pg,'#lkregpage .muted')>=4.5)
        pg.screenshot(path=os.path.join(SHOTS,'lingkana-register-390.png'))
        pg.fill('#lkregname','Ada Archer'); pg.fill('#lkregcode','nope'); pg.click('#lkreggo'); pg.wait_for_timeout(150)
        chk('wrong invite code is visible', 'not right' in pg.inner_text('#lkregmsg') and contrast(pg,'#lkregmsg')>=4.5 and not pg.locator('#lkreggo').is_disabled())
        pg.locator('#lkregmsg').scroll_into_view_if_needed()
        pg.screenshot(path=os.path.join(SHOTS,'lingkana-register-error-390.png'))
        pg.locator('#lkregnight').select_option(index=0)
        pg.fill('#lkregcode','lk-onion26'); pg.click('#lkreggo'); pg.wait_for_timeout(250)
        banner=pg.locator('#lkregok').inner_text() if pg.locator('#lkregok').count() else ''
        pg.evaluate("document.getElementById('scroller').scrollTop=0")
        pg.wait_for_timeout(100)
        chk('success banner names Night 1', banner.startswith("You're registered for Night 1") and pg.locator('#lkregok svg').count()==1 and contrast(pg,'#lkregok')>=4.5)
        pg.screenshot(path=os.path.join(SHOTS,'lingkana-success-390.png'))
        chk('first registration is one inbox row', E("JSON.parse(localStorage.getItem('scoretool.lk.reg')).length")==1)
        pg.fill('#lkregname',' ada archer '); pg.click('#lkreggo'); pg.wait_for_timeout(250)
        rows=E("JSON.parse(localStorage.getItem('scoretool.lk.reg'))")
        chk('same name night and league updates in place', len(rows)==1 and rows[0]['name'].strip().lower()=='ada archer')
        E("""()=>{const box=JSON.parse(localStorage.getItem('scoretool.lk.reg')); const c=Object.assign({},box[0],{at:1}); box.push(c); localStorage.setItem('scoretool.lk.reg', JSON.stringify(box));}""")
        pg.fill('#lkregname','Ada Archer'); pg.click('#lkreggo'); pg.wait_for_timeout(250)
        rows=E("JSON.parse(localStorage.getItem('scoretool.lk.reg')).map(x=>x.at)")
        chk('an older duplicate is left in place', len(rows)==2 and 1 in rows)
        E("document.body.classList.add('lk-flow'); lkResultsView(1)"); pg.wait_for_timeout(200)
        pg.evaluate("document.getElementById('scroller').scrollTop=0"); pg.wait_for_timeout(80)
        chk('results heading is readable', contrast(pg,'#lkresults h1')>=4.5)
        chk('results table header is readable', contrast(pg,'#lkresults th')>=4.5)
        chk('results table cell is readable', contrast(pg,'#lkresults td')>=4.5)
        pg.screenshot(path=os.path.join(SHOTS,'lingkana-results-390.png'))
        E("document.body.classList.add('lk-flow'); lkFlowHome('LINGKN26')"); pg.wait_for_timeout(200)
        chk('grey event button text is readable', contrast(pg,'#lkereg')>=4.5)
        E("document.body.classList.remove('lk-flow'); nav('home')"); pg.wait_for_timeout(200)
        chk('home Score button text is readable', contrast(pg,'.hub-score small')>=4.5)
        chk('no page errors', not errs)
        if errs: print(errs[:6])
        b.close()
finally:
    srv.terminate()
print(f'round/lingkana checks: PASS {len(ok)} FAIL {len(bad)}')
[print('FAIL',x) for x in bad]
sys.exit(1 if bad else 0)
