# Group patterns / arrow plot face mapping (23 Oct 2026, steven's Vegas 300 299/20X looked 'centred but spread out', 223 x 221mm).
# Every arrow on a multi-spot face is now an offset from its own spot, all overlaid on ONE spot. Throwaway local test profile only,
# no network. Also audits every round in ROUNDS: plotted value on the mapped face == the scored value; stored data unchanged.
import subprocess,sys,time,os,json,re
os.environ['ST_NO_COMPAT']='1'
from playwright.sync_api import sync_playwright
import guard   # stubs the ntfy.sh relay and blocks the service worker in every browser context (1 Nov 2026)
ROOT=os.path.abspath(sys.argv[1]) if len(sys.argv)>1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),'shots-grouppattern');os.makedirs(SH,exist_ok=True)
WHO=sys.argv[2] if len(sys.argv)>2 else 'after'
ok=[];bad=[]
def chk(n,c):(ok if c else bad).append(n);None if c else print('FAIL',n)
PORT=8833
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT)],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
SEED=r"""(()=>{const R=ROUNDS['Vegas 300'];let r=11;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647};
 /* a tight group like steven's (299, 20 X): 20 arrows in the X, 9 in the 10, 1 in the 9, shot on all three spots */
 const s={id:'gp1',date:'2026-10-23',round:'Vegas 300',ends:[],pos:[],face3:'vegas',finished:true,note:''},F=face3R(faceR(R,0),s);
 const band=[...Array(20).fill([0,0.075]),...Array(9).fill([0.09,0.125]),[0.14,0.2]].map(v=>({v,o:rnd()})).sort((a,b)=>a.o-b.o).map(x=>x.v);
 for(let e=0;e<10;e++){const E=[],P=[];for(let j=0;j<3;j++){const[a0,a1]=band[e*3+j],d=a0+rnd()*(a1-a0),t=rnd()*6.283,c=TRIC[j],x=+(c[0]+Math.cos(t)*d*0.6).toFixed(4),y=+(c[1]+Math.sin(t)*d*0.6).toFixed(4);E.push(plotScore(x,y,F));P.push({x,y,g:1})}
  s.ends.push(E);s.pos.push(P)}
 S.sessions=(S.sessions||[]).filter(x=>!/^gp/.test(x.id));S.sessions.push(s);save();return[total(s),s.ends.flat().filter(a=>a=='X').length]})()"""
AUDIT=r"""(()=>{let r=5;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647};const out=[];
 for(const name of Object.keys(ROUNDS)){const R=ROUNDS[name];if(R.aba||R.custom)continue;
  for(const f3 of [null,'vegas','vert','bugs','single']){if(f3=='single'&&name!=AUSI)continue;/* Australian Indoor single 40cm face */const s={id:'au',round:name,date:'2026-10-23',ends:[],pos:[],ff:[]};const F0=faceR(R,0);
   if(f3=='bugs'){if(!/field/.test(F0.face||''))continue;s.bugs=true}else if(f3){if(!indoor3(R,F0))continue;s.face3=f3}
   const n=R.ends||(R.blocks||[]).reduce((t,b)=>t+(b.ends||0),0)||1;let bad=0,cnt=0,mmBad=0;
   for(let i=0;i<Math.min(n,40);i++){let F=faceR(R,i);if(!F)break;if(use3({...s,pos:f3?[]:[[{x:0,y:0}]]},R,F))F=face3R(F,s);if(bugsOn(s))F={...F,bugs:true};if(R.wa18)F={...F,wa18:true,xs:false,inner10:!!sightedCompound()};if(R.ausi)F={...F,ausi:true};const fs=isFld(F)?[80,60,40,20][i%4]:0;s.ff[i]=fs?{f:fs}:null;
    const L=spots3(F)||(isBug(F)?BUGC:null),E=[],P=[];for(let j=0;j<(R.ape||3);j++){const c=L?L[j%L.length]:[0,0],sc=L?(isBug(F)?0.3:0.6):1,a=rnd()*6.283,d=rnd()*(L?0.5:1)*0.98;
     const x=c[0]+Math.cos(a)*d*sc,y=c[1]+Math.sin(a)*d*sc;E.push(plotScore(x,y,F));P.push(F.tri?{x,y,g:1}:{x,y})}s.ends.push(E);s.pos.push(P)}
   const before=JSON.stringify(s);const P=shotPts(s);[...P.target,...P.field].forEach(p=>{cnt++;
    const Fi=faceR(R,p.e),one=p.k=='spot'?{...Fi,face:(Fi.face.match(/^\d+/)||['40'])[0]+'cm 3-spot',tri:false,vert:false}:p.k=='bugs'?null:{...Fi,col:false,ausi:!!R.ausi,wa18:!!R.wa18,inner10:!!(R.wa18&&sightedCompound()),xs:R.xs};
    let v;if(p.k=='spot'){const d=Math.hypot(p.x,p.y)-0.035;/* 3-spot line cutter, as plotScore */v=R.wa18?wa18Score(d,!!sightedCompound()):d>0.5?'M':d<=0.05?(Fi.xs===false||R.xs===false?'10':'X'):String(Math.min(10,10-Math.floor(Math.max(0,d)*10)))}else if(p.k=='bugs'){const d=Math.hypot(p.x,p.y)*0.3-0.023;v=d>0.3?'M':String(Math.min(6,6-Math.floor(Math.max(0,d)/0.05)))}else v=plotScore(p.x,p.y,one);
    if(v!=p.a){bad++;if(!window._mm)window._mm=[name,f3,p.k,p.x,p.y,v,p.a,JSON.stringify(s.pos[p.e][p.j])]}if(p.k!='bugs'&&!p.mm&&/\d+cm/.test(Fi.face||''))mmBad++});
   if(JSON.stringify(s)!=before)bad+=1000;out.push([name+(f3?' ['+f3+']':''),cnt,bad,mmBad,[...new Set([...P.target,...P.field].map(p=>p.k))].join('/')])}}
 return out})()"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
  ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(f'http://localhost:{PORT}') else r.abort())
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(f'http://localhost:{PORT}/?tester=steven');pg.wait_for_timeout(1200)
  pg.evaluate("S.unlocked=true;save()");pg.evaluate("localStorage.setItem('scoretool.theme','dark')")
  tot=pg.evaluate(SEED);print('seeded',tot);pg.reload();pg.wait_for_timeout(1800)
  chk('seed is 299 with 20 X (like steven)',tot==[299,20])
  S0=pg.evaluate("localStorage.getItem(KEY)")
  pg.evaluate("nav('lab_analysis')");pg.wait_for_timeout(900)
  pg.evaluate("(()=>{const h=[...document.querySelectorAll('h2.sec')].find(x=>/Group patterns/.test(x.textContent));h.scrollIntoView({block:'start'});scrollBy(0,-70)})()");pg.wait_for_timeout(300)
  pg.screenshot(path=f'{SH}/steven-dark-390-{WHO}.png')
  t=pg.evaluate("(()=>{const h=[...document.querySelectorAll('h2.sec')].find(x=>/Group patterns/.test(x.textContent));return h.nextElementSibling.innerText})()")
  print(re.sub(r'\s+',' ',t)[:400])
  if WHO=='after':
    m=re.search(r'Spread (\d+) × (\d+)mm',t);chk(f'tight spread on one spot {m and m.groups()}',m and int(m[1])<60 and int(m[2])<60)
    chk('every arrow in the gold on the one spot',pg.evaluate("(()=>{const p=shotPts(S.sessions.find(s=>s.id=='gp1')).target;return p.length==30&&p.every(q=>Math.hypot(q.x,q.y)<0.2)})()"))
    chk('not "spread out"','spread out' not in t)
    chk('one spot drawn',pg.evaluate("document.querySelector('#gpface').getAttribute('viewBox').startsWith('-0.56')"))
    au=pg.evaluate(AUDIT)
    for row in au:chk(f'audit {row[0]} ({row[1]} arrows, {row[4]}) plotted==scored, mm known',row[1]>0 and row[2]==0 and row[3]==0)
    print('first mismatch',pg.evaluate('window._mm'));[print(r) for r in au if r[2] or r[3]];print('audited',len(au),'round/face combos;',', '.join(sorted(set(r[4] for r in au))))
    S1=pg.evaluate("localStorage.getItem(KEY)");a,b2=json.loads(S0),json.loads(S1);dk=[k for k in set(a)|set(b2) if a.get(k)!=b2.get(k)];print('changed keys',dk)
    chk('stored sessions unchanged',a.get('sessions')==b2.get('sessions'))
    chk('no errors',not errs);errs and print(errs)
  b.close()
finally:srv.terminate()
print(len(ok),'ok');print('FAIL',bad[:30],len(bad)) if bad else print('all pass');sys.exit(1 if bad else 0)
