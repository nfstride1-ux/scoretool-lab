# Unlock is not a button. A phone that already has unlocked:true still opens.
# A phone that does not is not granted access, and entitlementVerify does nothing without a server.
# Lingkana Register: the Register button is green when it can be used, and dull when it is disabled. 390px.
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
time.sleep(0.4)
def css(page, sel):
    return page.evaluate("""sel=>{
      const el=document.querySelector(sel); if(!el) return null;
      const cs=getComputedStyle(el);
      return {bg:cs.backgroundColor, color:cs.color, op:cs.opacity, dis:!!el.disabled};
    }""", sel)
try:
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox','--headless=new'])
        pg=b.new_page(viewport={'width':390,'height':844})
        pg.goto(f'http://127.0.0.1:{PORT}/?tester=nathe')
        pg.wait_for_timeout(1200)
        pg.evaluate("""()=>{ localStorage.setItem('scoretool.whatsnew.seen','x'); localStorage.setItem('scoretool.cal.nathe.prompted','1'); localStorage.setItem('scoretool.theme','dark'); }""")
        # fresh record, unlocked left false
        pg.evaluate("""()=>{ const k='scoretool.v1'; const d=JSON.parse(localStorage.getItem(k)||'{}'); d.unlocked=false; d.profile=d.profile||'Nathaniel Stride'; localStorage.setItem(k, JSON.stringify(d)); }""")
        pg.reload(); pg.wait_for_timeout(1200)
        chk('no unlock button', pg.locator('#unlock').count()==0 and pg.get_by_text('Demo unlock').count()==0)
        chk('locked phone is not granted access', pg.locator('#gate').count()==1 and pg.evaluate('S.unlocked')==False)
        before=pg.evaluate("localStorage.getItem('scoretool.v1')")
        r=pg.evaluate("entitlementVerify()")
        after=pg.evaluate("localStorage.getItem('scoretool.v1')")
        chk('verify grants nothing and does not rewrite storage', r.get('ok')==False and r.get('reason')=='no-server' and before==after and pg.evaluate('S.unlocked')==False)
        # someone already unlocked keeps that flag and the app
        pg.evaluate("""()=>{ S.unlocked=true; S.profile='Nathaniel Stride'; S.sessions=(S.sessions||[]).filter(s=>s.id!='keepme'); S.sessions.push({id:'keepme',round:'x',ends:[['10']],date:'2026-11-01',pos:[],note:''}); save(); }""")
        pg.reload(); pg.wait_for_timeout(1200)
        chk('an already unlocked phone still opens', pg.locator('#gate').count()==0 and pg.locator('#tabs').is_visible() and pg.evaluate('S.unlocked')==True)
        chk('their saved session is still there', pg.evaluate("(S.sessions||[]).some(s=>s.id=='keepme')")==True)
        # register buttons
        pg.evaluate("document.body.classList.add('lk-flow'); lkRegisterView()")
        pg.wait_for_timeout(250)
        on=css(pg,'#lkreggo')
        back=css(pg,'#lkregback')
        chk('Register is green and enabled', on and on['dis']==False and on['bg']=='rgb(46, 125, 50)' and on['color']=='rgb(255, 255, 255)')
        chk('Back is a light button, not a dull grey', back and back['bg']=='rgb(255, 255, 255)' and back['color']=='rgb(17, 24, 39)')
        pg.evaluate("document.getElementById('lkreggo').scrollIntoView({block:'center'})")
        pg.wait_for_timeout(100)
        pg.screenshot(path=os.path.join(SHOTS,'lk-register-active-390.png'))
        pg.evaluate("document.getElementById('lkreggo').disabled=true")
        pg.wait_for_timeout(80)
        off=css(pg,'#lkreggo')
        chk('disabled Register is not green', off and off['dis']==True and off['bg']!='rgb(46, 125, 50)' and off['bg']=='rgb(55, 65, 81)')
        pg.screenshot(path=os.path.join(SHOTS,'lk-register-disabled-390.png'))
        b.close()
finally:
    srv.terminate()
print(f'entitlement checks: PASS {len(ok)} FAIL {len(bad)}')
[print('FAIL',x) for x in bad]
sys.exit(1 if bad else 0)
