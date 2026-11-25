# Casual / League / Vegas score card (26 Oct 2026): (1) all 6 arrows of a WA 720 end register on Casual, with 10 archers, every key as the 6th arrow,
# and the card moves to the next archer; (2) the arrow chips for the end being scored and the archer pills are readable in BOTH themes (text vs its own background,
# contrast >= 4.5) and are not navy in the light theme. League and Vegas match play use the same classes (.vg-slot .lc-chip), checked on the shared CSS.
# Just me chips (.adb) are checked too. Phone viewport, tester "nate", relay answered locally.
import subprocess,sys,time,os
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
import nm_seed
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);print(('PASS ' if c else 'FAIL ')+n)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen([sys.executable,'-m','http.server','8895'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
CON="""sel=>[...document.querySelectorAll(sel)].map(e=>{const P=c=>{const m=c.match(/[\\d.]+/g).map(Number);return{r:m[0],g:m[1],b:m[2],a:m.length>3?m[3]:1}},
 L=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b)},
 s=getComputedStyle(e),t=P(s.color),b=P(s.backgroundColor);let n=e;while(b.a<1&&n.parentElement){n=n.parentElement;b=P(getComputedStyle(n).backgroundColor)}
 const l1=L(t),l2=L(b),hi=Math.max(l1,l2),lo=Math.min(l1,l2);return{txt:e.textContent.trim().slice(0,12),cr:(hi+.05)/(lo+.05),bgL:l2}})"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  for th in ['light','dark']:
   ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);pg=ctx.new_page();errs=[]
   pg.on('pageerror',lambda e:errs.append(str(e)));pg.goto('http://localhost:8895/?tester=nate');pg.wait_for_timeout(1200)
   pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Nate';save()");pg.reload();pg.wait_for_timeout(2200)
   pg.evaluate("t=>document.documentElement.setAttribute('data-theme',t)",th)
   pg.evaluate("nav('score')");pg.wait_for_timeout(400)
   code=pg.evaluate("csCreate({name:'TESTING',round:'WA 720 (50m Compound)',self:true,ppl:Array.from({length:9},(_,i)=>({n:'Test '+(i+2)}))}).code")
   pg.evaluate(f"csView('{code}')");pg.wait_for_timeout(600)
   chk(f'[{th}] 10 archers on the score card, WA 720 end of 6',pg.locator('#csentry .lc-chip').count()==10 and pg.locator('.vg-slot').count()==6)
   # six arrows, the 6th is each key in turn over 8 ends (X 10 9 8 7 6 5 M)
   KEYS=['X','10','9','8','7','6','5','M']
   for n,k6 in enumerate(KEYS[:8]):
     for k in ['X','10','9','8','7']:pg.click(f'#csentry [data-csk="{k}"]');pg.wait_for_timeout(40)
     if n==0:
       pg.screenshot(path=f'/tmp/chip_{th}_5.png')
       cr=pg.evaluate(CON,'.vg-slot.on');chk(f'[{th}] 5 filled chips readable (contrast >= 4.5)',len(cr)==5 and all(c['cr']>=4.5 for c in cr))
       cp=pg.evaluate(CON,'#csentry .lc-chip');chk(f'[{th}] archer pills readable (contrast >= 4.5): min {min(c["cr"] for c in cp):.1f}',len(cp)==10 and all(c['cr']>=4.5 for c in cp))
       if th=='light':
         chk('[light] the other archers\' pills are not navy',all(c['bgL']>0.5 for c in cp if 'Nate' not in c['txt'] and 'Navy' not in c['txt'] and not c['txt'].startswith(pg.evaluate('csNm(csGet("%s"),csMe())'%code)[:4])) or sum(c['bgL']>0.5 for c in cp)>=9)
     got=pg.evaluate(f"csGet('{code}').sc[csMe()].e.length&&csGet('{code}').sc[csMe()].e[csGet('{code}').sc[csMe()].e.length-1].length")
     chk(f'[{th}] 5 arrows in, the 6th is allowed (end {n+1}, 5 arrows stored)',got==5 and pg.locator('.vg-slot.on').count()==5)
     pg.click(f'#csentry [data-csk="{k6}"]');pg.wait_for_timeout(120)
     d=pg.evaluate(f"(()=>{{const e=csGet('{code}').sc[csMe()].e;return{{n:e.length,l:e[e.length-1].length}}}})()")
     chk(f'[{th}] 6th arrow {k6} registers: end {n+1} holds 6 arrows',d['n']==1+0 and d['l']==6 if n==0 else d['l']==6)
     # the next archer comes up (auto-advance), put me back for the next loop
     if n==0:chk(f'[{th}] after the 6th arrow the card moves on to the next archer',pg.evaluate("window._csAct")!=pg.evaluate("csMe()"))
     pg.evaluate(f"window._csAct=csMe();csView('{code}')");pg.wait_for_timeout(150)
     if n==7:break
   tot=pg.evaluate(f"csGet('{code}').sc[csMe()].e.map(e=>e.length)")
   chk(f'[{th}] 8 ends of 6 arrows stored for me, none dropped',tot==[6]*8)
   # shared CSS for League (#lgentry) and Vegas match play (#lccard): same classes
   pg.evaluate("document.querySelector('#app,main,body').insertAdjacentHTML('beforeend','<div id=inj><div class=vg-slots><span class=\"vg-slot on\">X</span><span class=\"vg-slot on\">10</span></div><button class=lc-chip>Joey 0/12</button><button class=\"lc-chip on\">Navy 0/12</button></div>')")
   cr=pg.evaluate(CON,'#inj .vg-slot.on');chk(f'[{th}] League/Vegas chips (.vg-slot.on) readable',len(cr)==2 and all(c['cr']>=4.5 for c in cr))
   cp=pg.evaluate(CON,'#inj .lc-chip');chk(f'[{th}] League/Vegas pills (.lc-chip, .lc-chip.on) readable',len(cp)==2 and all(c['cr']>=4.5 for c in cp))
   chk(f'[{th}] no page errors',not errs)
   ctx.close()
  # Just me chips
  for th in ['light','dark']:
   ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True);pg=ctx.new_page()
   pg.goto('http://localhost:8895/?tester=nate');pg.wait_for_timeout(1200);pg.evaluate("S.unlocked=true;if(!S.profile)S.profile='Nate';save()");pg.reload();pg.wait_for_timeout(2200)
   pg.evaluate("t=>document.documentElement.setAttribute('data-theme',t)",th);pg.evaluate("cur=null;sv='sheet';nav('score')");pg.wait_for_timeout(500)
   pg.select_option('#rd','WA 720 (50m Compound)');pg.wait_for_timeout(300);pg.click('#st');pg.wait_for_timeout(800)
   for k in ['X','10','9','8','7']:pg.click(f'.ad-pad [data-k="{k}"]');pg.wait_for_timeout(60)
   cr=pg.evaluate(CON,'.ad-chips .adb')
   chk(f'[{th}] Just me chips readable ({len(cr)} chips, min {min(c["cr"] for c in cr):.1f})',len(cr)>=5 and all(c['cr']>=4.5 for c in cr))
   pg.click('.ad-pad [data-k="6"]');pg.wait_for_timeout(100)
   chk(f'[{th}] Just me: the 6th arrow registers',pg.evaluate("cur.ends[cur.ends.length-1].length")==6 or pg.evaluate("cur.ends[0].length")==6)
   ctx.close()
finally:srv.terminate()
print(f'{len(ok)} passed, {len(bad)} failed')
sys.exit(1 if bad else 0)
