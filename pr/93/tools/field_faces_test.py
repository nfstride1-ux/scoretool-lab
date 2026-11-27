from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
import json,os,sys,subprocess,time,freeport
# Uses the server on ST_PORT if run_regression started one; otherwise starts its own on a free port.
PORT=os.environ.get('ST_PORT');srv=None
if not PORT:
    PORT=freeport.get();srv=subprocess.Popen([sys.executable,'-m','http.server',PORT,'--directory',os.path.dirname(os.path.dirname(os.path.abspath(__file__)))],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1.5)
ok=[];bad=[]
def chk(name,cond):
    (ok if cond else bad).append(name)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=b.new_page(viewport={'width':390,'height':844})
    errs=[]; pg.on('console',lambda m: m.type=='error' and errs.append(m.text)); pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://localhost:'+PORT+'/'); pg.wait_for_timeout(1200)
    nm_seed.pick(pg,'nathe'); pg.wait_for_timeout(800)
    if pg.get_by_text('Demo unlock').count():
        pg.get_by_text('Demo unlock').first.click(); pg.wait_for_timeout(800)
    for _ in range(3):
        if pg.locator('nav [data-v=score]').is_visible(): break
        print('APP:',pg.inner_text('#app')[:200]); pg.locator('#app button').first.click(); pg.wait_for_timeout(600)
    E=pg.evaluate
    # pure rule checks
    exp={'red':{80:([50,55,60],(35,55)),60:([35,40,45],(20,35)),40:([20,25,30],(15,25)),20:([10,15,20],(10,15))},'blue':{80:([40,45,50],(30,45)),60:([30,35,40],(15,30)),40:([15,20,25],(10,20)),20:([5,10,15],(5,10))},'yellow':{80:([30,35,40],(20,35)),60:([20,25,30],(15,25)),40:([10,15,20],(10,15)),20:([5,10,15],(5,10))}}
    for peg,fs in exp.items():
        for f,(m,(lo,hi)) in fs.items():
            chk(f'marked {peg} {f}',E(f'fldDists("{peg}",{f},true)')==m)
            chk(f'unmarked {peg} {f}',E(f'fldDists("{peg}",{f},false)')==list(range(lo,hi+1)))
    chk('snap 35->20cm red marked =20',E('snapDist(fldDists("red",20,true),35)')==20)
    chk('snap 50->60 blue unmarked =30',E('snapDist(fldDists("blue",60,false),50)')==30)
    chk('snap 12 -> 40 red unmarked 15',E('snapDist(fldDists("red",40,false),12)')==15)
    for d,pgx in [('Open Male Compound','red'),('Under 21 Female Recurve','red'),('Open Male Barebow','blue'),('Under 16 Male Compound','blue'),('Under 18 Female Recurve','blue'),('Under 14 Male Barebow','yellow'),('Open Male Longbow','yellow'),('','red')]:
        chk(f'peg {d or "blank"}',E(f'pegForDivision({json.dumps(d)})')==pgx)
    # UI flow
    pg.click('nav [data-v=score]'); pg.wait_for_timeout(500)
    pg.select_option('#rd','WA Field 24 Marked'); pg.wait_for_timeout(200)
    chk('start menu peg row',pg.locator('[data-peg]').count()==3)
    chk('no peg row on target round',(pg.select_option('#rd',index=0) or True) and pg.locator('[data-peg]').count()==0)
    pg.select_option('#rd','WA Field 24 Marked'); pg.click('[data-peg=blue]'); pg.click('#st'); pg.wait_for_timeout(500)
    chk('session peg blue',E('cur.peg')=='blue')
    chk('default face 80, 40m',E('JSON.stringify(cur.ff[0])')=='{"p":"blue","f":80,"d":40}')
    chk('drop-down options blue 80 marked',pg.eval_on_selector_all('#fdist option','o=>o.map(x=>x.value)')==['40','45','50'])
    pg.click('[data-fface="60"]'); pg.wait_for_timeout(200)
    chk('face change snaps 40->40 blue 60',E('cur.ff[0].d')==40 and pg.eval_on_selector_all('#fdist option','o=>o.map(x=>x.value)')==['30','35','40'])
    pg.select_option('#fdist','35'); pg.wait_for_timeout(200)
    chk('distance set 35',E('cur.ff[0].d')==35 and '35m' in pg.inner_text('#enddist'))
    for k in ['6','5','4']: pg.click(f'.ad-pad [data-k="{k}"]'); pg.wait_for_timeout(80)
    pg.click('#enext'); pg.wait_for_timeout(300)
    # go to next end via sheet - find button to continue
    E('sv="entry";justDone=false;score()'); pg.wait_for_timeout(300)
    chk('sticky end 2 = 60cm 35m',E('JSON.stringify([cur.ends.length,cur.ff[1]])')=='[1,{"p":"blue","f":60,"d":35}]' or E('JSON.stringify(cur.ff[1])')=='{"p":"blue","f":60,"d":35}')
    chk('end 2 face button shows 60',pg.locator('[data-fface="60"].on').count()==1)
    # 20cm column
    pg.click('[data-fface="20"]'); pg.wait_for_timeout(200)
    chk('20cm snaps 35->15 blue marked',E('cur.ff[1].d')==15)
    chk('20cm column has 3 spots',pg.evaluate('document.querySelectorAll("#pface circle").length')>=18)
    vb=E('(()=>{const v=document.querySelector("#pface").viewBox.baseVal;return {x:v.x,y:v.y,width:v.width,height:v.height}})()')
    def tap(x,y):
        # convert face coords to screen with preserveAspectRatio meet
        box=pg.locator('#pface').bounding_box()  # re-measured each tap: the hint line above the face can wrap and move it a few px
        sc=min(box['width']/vb['width'],box['height']/vb['height']); ox=box['x']+(box['width']-vb['width']*sc)/2; oy=box['y']+(box['height']-vb['height']*sc)/2
        pg.mouse.click(ox+(x-vb['x'])*sc, oy+(y-vb['y'])*sc); pg.wait_for_timeout(150)
    tap(0,-0.62); tap(0.045,0.0); tap(0,0.62+0.3*0.5)
    e1=E('JSON.stringify([cur.ends[1],cur.pos[1]])'); print(e1)
    chk('20cm spot plotting scores 6,5,3 with spot index',E('cur.ends[1].join()')=='6,5,3' and sorted(E('cur.pos[1].map(p=>p.s)'))==[0,1,2])
    # reload persistence
    pg.reload(); pg.wait_for_timeout(1200)
    sess=E('JSON.stringify(S.sessions.slice(-1)[0].ff)'); print(sess)
    chk('saved per end after reload',sess=='[{"p":"blue","f":60,"d":35},{"p":"blue","f":20,"d":15}]')
    # old score: inject old field session without ff
    E('S.sessions.push({id:"sold",date:"2026-01-01",round:"WA Field 24 Marked",ends:[["6","5","4"]],pos:[[]],note:"",finished:true});localStorage.setItem(KEY,JSON.stringify(S))')
    pg.reload(); pg.wait_for_timeout(1200)
    E("nav('scorecards')"); pg.wait_for_timeout(400)
    pg.locator('[data-open="sold"]').scroll_into_view_if_needed()
    pg.click('[data-open="sold"]'); pg.wait_for_timeout(400)
    chk('old score opens on one sheet, no face-group header',pg.locator('.ad-tab').count()==1 and 'face not set' not in pg.inner_text('#app') and '6' in pg.locator('.ad-tab').inner_text())
    chk('old score has no ff/peg added on view',E('JSON.stringify([cur.ff||null,cur.peg||null])')=='[null,null]')
    # target round untouched
    E('cur=null;sv="sheet";score()'); pg.wait_for_timeout(300)
    pg.select_option('#rd',E('Object.keys(ROUNDS).find(r=>/720/.test(r)&&!isFld(faceR(ROUNDS[r],0))&&!ROUNDS[r].custom)')); pg.click('#st'); pg.wait_for_timeout(400)
    chk('target round: no field picker',pg.locator('.fldpick').count()==0 and E('cur.peg===undefined && cur.ff===undefined'))
    chk('target keys unchanged',pg.locator('.ad-pad [data-k="X"]').count()==1)
    chk('no horizontal overflow at 390',E('document.documentElement.scrollWidth')<=390)
    E('cur=null;sv="sheet"')
    for v in ['stats','home','diary','me']:
        pg.click(f'nav [data-v={v}]'); pg.wait_for_timeout(700)
    chk('no console errors',not errs)
    print('ERR',errs)
    b.close()
print('PASS',len(ok),'FAIL',len(bad),bad)
if srv:srv.terminate()
sys.exit(1 if bad else 0)   # a failed check now fails the run (1 Nov 2026)
