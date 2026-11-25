# Writes sw.js: the offline service worker with its precache list (app shell, every script and style index.html loads, fonts,
# icons, all data/ files). Run after adding a file and on every version bump:  python3 tools/build_sw.py v2026-10-20-HHMM-name
import os,re,sys,json
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V=sys.argv[1] if len(sys.argv)>1 else json.load(open(os.path.join(ROOT,'version.json')))['version']
html=open(os.path.join(ROOT,'index.html'),encoding='utf-8').read()
refs=[re.sub(r'\?.*$','',u) for u in re.findall(r'(?:src|href)="([^"#:]+)"',html)]
pre=['./','index.html','version.json']+refs
pre+=['img/lingkana-flyer.jpg','img/lingkana-logo.png','vendor/jspdf.umd.min.js','vendor/ac-icon.png']  # used later (Lingkana event home, sight card PDF): precached by the service worker, no longer prefetched on first load
pre+=['fonts/'+f for f in sorted(os.listdir(os.path.join(ROOT,'fonts'))) if f.endswith('.woff2')]
pre+=['icons/'+f for f in sorted(os.listdir(os.path.join(ROOT,'icons')))]
pre+=['data/'+f for f in sorted(os.listdir(os.path.join(ROOT,'data'))) if re.search(r'\.(json|csv)$',f)]
pre+=['help/g/'+f for f in sorted(os.listdir(os.path.join(ROOT,'help','g'))) if f.endswith('.webp')]  # themed help guide pictures (light + dark)
seen=[];[seen.append(u) for u in pre if u not in seen and (u=='./' or os.path.exists(os.path.join(ROOT,u)))]
missing=[u for u in pre if u!='./' and not os.path.exists(os.path.join(ROOT,u))]
if missing:print('skipped (not found):',missing)
tpl=open(os.path.join(ROOT,'tools','sw_template.js'),encoding='utf-8').read()
open(os.path.join(ROOT,'sw.js'),'w',encoding='utf-8').write(tpl.replace('__VERSION__',V).replace('__PRECACHE__',json.dumps(seen)))
json.dump({'version':V},open(os.path.join(ROOT,'version.json'),'w'))
print(V,len(seen),'files precached')
