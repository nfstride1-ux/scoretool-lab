#!/usr/bin/env python3
"""ScoreTool regression runner: runs every Playwright suite in tools/ (headless Chrome, 390x844), grouped by area,
and prints PASS/FAIL per area plus a total. Nothing is written to any user's data (each suite uses a fresh browser).

  python3 qa/run_regression.py                 # run against this checkout (local copy served by http.server)
  python3 qa/run_regression.py --live URL      # fetch the files the live site precaches into a temp folder and run the same suites on that copy,
                                               # then smoke-check the live URL itself (ghost picker, version, no page errors)
  python3 qa/run_regression.py --only ghost    # one area (substring of the area name)
  python3 qa/run_regression.py --suite real_test,testers_test   # named suites only

Run it BEFORE every deploy and again on the live URL after. Record the result in CHANGELOG.md.
"""
import subprocess,sys,os,re,time,tempfile,shutil,urllib.request,json
HERE=os.path.dirname(os.path.abspath(__file__));ROOT=os.path.dirname(HERE)
AREAS=[
 ('Solo scoring (Just me, rounds, faces, scorer, PBs)',['redesign_test.py','ausindoor_test.py','singleface_test.py','nav_test.py','real_test.py','pickers_test.py','halfsplit_test.py','shotview_test.py','sidehill_test.py','grouppattern_test.py','todayarrows_test.py','photos_test.py','names_test.py','colourblind_test.py','field_faces_test.py','field_round_test.py','vegas_test.py','h2h_test.py','undozoom_test.py','zoompersist_test.py','plot3spot_test.py','spotgroups_test.py','arrowsize_test.py','linecut_test.py','endview_test.py','scorecards_test.py','savedarrows_test.py']),
 ('Full round (every round type: ends, totals, saved record)',['fullround_test.py']),
 ('Personal best note (same scores as your PB on the card)',['pbnote_test.py']),
 ("Personal bests (practice and official, every round type)",["pbbest_test.py"]),
 ("Analytics bow filter (every bow type, no All bows)",["bowfilter_test.py"]),
 ("Viewing as another tester (no background sync)",["avrelay_test.py"]),
 ("Ghost match X count",["ghostx_test.py"]),
 ("Test guards (relay stubbed, service worker blocked in every test)",["guards_test.py"]),
 ("Slow start (no page error while scripts load)",["slowload_test.py"]),
 ("League auto-advance (Next optional)",["lgauto_test.py"]),
 ("Your data (backup, restore, offline, privacy)",["backup_test.py"]),
 ("Arrow chooser uses your bow",["ac1_test.py"]),
 ("Arrow chooser Easton parts",["ac2_test.py"]),
    ("Arrow chooser shortest cut",["ac3_test.py"]),
    ("Arrow chooser heavy point and FOC",["ac4_test.py"]),
    ("Arrow chooser fletching suggestion",["ac5_test.py"]),
    ("Help: Build an arrow guide",["ac6_test.py"]),
 ("Relay hold (no resend storm on the relay)",["relayhold_test.py"]),
 ('Casual shoot',['casual_test.py','casual_fixes_test.py','mixedface_test.py','casual3d_test.py','custom3d_test.py','mel3d_test.py','chipcolors_test.py']),
 ('League',['league_test.py','nopreset_test.py','onionrestore_test.py','leslie_test.py','lgscroll_test.py','lgpage_test.py','lingkana_live_test.py','lingkana_groups_test.py','lingkana_host_solo_test.py','lk_qr_login_test.py','lk_return_pin_test.py','lk_group_order_test.py','lk_clear_test.py','lk_login_bar_test.py']),
 ('ABA',['aba_test.py']),
 ('Peel group card',['peel_test.py','peel_data_test.py','peel_next_test.py','peel_scroll_test.py','peel_share_test.py','peel_comp_test.py']),
 ('Ghost match (unlock, Race who?, records, top-ranked)',['ghost_test.py','ghost_pick_test.py','ghosttie_test.py']),
 ('Sight marks',['sightest_test.py','sightseed_test.py','sightimport_test.py','arrowsets_test.py']),
 ('Sight card',['sightcard_test.py']),
 ('My arrows / My bows',['myarrows_test.py','mybows_test.py','arrowpick_test.py','todayarrows_test.py']),
 ('Calculators',['arrowcheck_test.py','arrowchooser_test.py','arrowuse_test.py']),
 ('Analysis (stats, coach, testers)',['coach2_test.py','coach3_test.py','testers_test.py','sendpast_test.py']),
 ('App shell, What\'s new, offline, Clarity',['whatsnew_test.py','offline_test.py','clarity_test.py']),
 ('Custom round validation and Lingkana contrast',['round_lk_qa_test.py','entitlement_test.py']),
]
def fetch_live(url,dest):
    base=url.rstrip('/')+'/'
    get=lambda p:urllib.request.urlopen(urllib.request.Request(base+p,headers={'Cache-Control':'no-cache','User-Agent':'scoretool-qa'}),timeout=60).read()
    sw=get('sw.js').decode()
    m=re.search(r'PRE=(\[[^\]]*\])',sw)
    names={x.lstrip('./') for x in json.loads(m.group(1)) if x not in('./',)}|{'index.html','sw.js','version.json'}
    try:  # pages that are not precached (coach page etc.) are still needed by some suites
        tracked=subprocess.run(['git','ls-files'],cwd=ROOT,capture_output=True,text=True).stdout.split()
        names|={t for t in tracked if t.endswith(('.html','.js','.json','.css','.csv','.svg')) and not t.startswith(('shots-','screenshots','tools/','qa/','help/','node_modules'))}
    except Exception:pass
    for n in sorted(names):
        try:d=get(n)
        except Exception as e:
            print('  (not on live site, skipped)',n);continue
        os.makedirs(os.path.dirname(os.path.join(dest,n)) or dest,exist_ok=True);open(os.path.join(dest,n),'wb').write(d)
    shutil.copytree(os.path.join(ROOT,'tools'),os.path.join(dest,'tools'),dirs_exist_ok=True)
    g=os.path.join(ROOT,'.git')  # whatsnew_test checks the notes' commits against git log
    try:
        if os.path.isfile(g):shutil.copy(g,os.path.join(dest,'.git'))
        elif os.path.isdir(g):os.symlink(g,os.path.join(dest,'.git'))
    except Exception:pass
def main():
    a=sys.argv[1:];live=a[a.index('--live')+1] if '--live' in a else None;only=a[a.index('--only')+1].lower() if '--only' in a else None;suite=a[a.index('--suite')+1].split(',') if '--suite' in a else None
    root=ROOT;tmp=None
    if live:
        tmp=tempfile.mkdtemp(prefix='stlive_');print('Fetching live copy of',live,'into',tmp);fetch_live(live,tmp);root=tmp
    tools=os.path.join(root,'tools');res=[];t0=time.time()
    for area,files in AREAS:
        if only and only not in area.lower():continue
        for f in files:
            if suite and f not in suite and f[:-3] not in suite:continue
            if not os.path.exists(os.path.join(tools,f)):res.append((area,f,None,'missing'));continue
            srv=None
            if f=='field_faces_test.py':  # this suite uses a server we start on a free port, passed as ST_PORT (the others start their own on free ports)
                sys.path.insert(0,tools);import freeport;fp=freeport.get();env=dict(os.environ,ST_PORT=fp)
                srv=subprocess.Popen([sys.executable,'-m','http.server',fp,'--directory',root],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1.5)
            t=time.time();p=subprocess.run([sys.executable,f],cwd=tools,capture_output=True,text=True,timeout=1500,env=env if srv else None)
            if srv:srv.terminate()
            out=(p.stdout+p.stderr).strip().splitlines();last=out[-1] if out else ''
            res.append((area,f,p.returncode==0,last[:160]));print(('PASS' if p.returncode==0 else 'FAIL'),f,f'{time.time()-t:.0f}s',last[:120],flush=True)
            if p.returncode!=0:print('\n'.join('    '+x for x in out[-12:]),flush=True)
    if live:
        env=dict(os.environ,BASE=live.rstrip('/')+'/');p=subprocess.run([sys.executable,'ghost_pick_test.py'],cwd=tools,capture_output=True,text=True,env=env,timeout=900)
        res.append(('LIVE URL smoke: ghost picker on the live site','ghost_pick_test.py (BASE=live)',p.returncode==0,(p.stdout.strip().splitlines() or [''])[-1]))
        print('LIVE smoke',('PASS' if p.returncode==0 else 'FAIL'),(p.stdout+p.stderr).strip()[-300:])
    print('\n==== By area ====')
    seen=[]
    for area,f,ok,_ in res:
        if area not in seen:seen.append(area)
    for area in seen:
        rs=[r for r in res if r[0]==area];bad=[r[1] for r in rs if r[2] is not True]
        print(('PASS' if not bad else 'FAIL'),'-',area,f'({len(rs)-len(bad)}/{len(rs)} suites)',('  failing: '+', '.join(bad)) if bad else '')
    nb=sum(1 for r in res if r[2] is not True);print(f'\nTOTAL: {len(res)-nb} passed, {nb} failed, {time.time()-t0:.0f}s');
    if tmp:shutil.rmtree(tmp,ignore_errors=True)
    sys.exit(1 if nb else 0)
if __name__=='__main__':main()
