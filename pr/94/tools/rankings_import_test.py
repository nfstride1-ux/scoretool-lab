#!/usr/bin/env python3
"""rankings_import.py reads saved pages only. It must not open a network connection."""
import json, os, subprocess, sys, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOL = os.path.join(ROOT, 'tools', 'rankings_import.py')
FIX = os.path.join(ROOT, 'tools', 'fixtures', 'rankings')
ok, bad = [], []
def chk(n, c):
    (ok if c else bad).append(n)
    print(('PASS ' if c else 'FAIL ') + n)

src = open(TOOL, encoding='utf-8').read()
chk('import tool does not fetch', 'urllib' not in src and 'urlopen' not in src and 'requests' not in src)

out = tempfile.mkdtemp()
dest = os.path.join(out, 'rankings.json')
# start from the old shape so the tool must keep those archers when a new page is added
old = {'as_of': '2026-01-01', 'source': 'old', 'archers': {
    'Lee Archer': [{'class_rank': 4, 'class_size': 28, 'overall_rank': 146, 'age_class': 'Under 16', 'gender': 'Male', 'division': 'Compound', 'rating': '74.0', 'discipline': 'field'}]}}
json.dump(old, open(dest, 'w'))
proc = subprocess.run([sys.executable, TOOL, '--out', dest,
    '--page', 'national', 'outdoor', os.path.join(FIX, 'national-outdoor.html'),
    '--page', 'WA', 'outdoor', os.path.join(FIX, 'wa-outdoor.txt'),
    '--page', 'national', 'indoor', os.path.join(FIX, 'national-indoor.tsv')],
    capture_output=True, text=True)
chk('tool exits 0', proc.returncode==0)
if proc.returncode:
    print(proc.stderr)
    print('rankings import: PASS', len(ok), 'FAIL', len(bad), bad)
    sys.exit(1)
data = json.load(open(dest))
chk('as of from the saved html date', data['as_of']=='2026-10-15')
nat = data['national']['outdoor']
by = {(r['name'], r['division']): r for r in nat}
chk('national outdoor count', len(nat)==5)
stride = by[('Nathaniel Stride', 'Compound')]
chk('class rank uses rating within division age and gender', stride['class_rank']==2 and stride['class_size']==2 and stride['rating']=='44.5')
chk('higher rated man is first in that class', by[('Ben Bowman', 'Compound')]['class_rank']==1)
chk('rating link text is read', by[('Ada Archer', 'Compound')]['rating']=='90.0' and by[('Ada Archer', 'Compound')]['class_rank']==1)
wa = {(r['name'], r['division']): r for r in data['states']['WA']['outdoor']}
chk('WA list is separate', len(wa)==3 and wa[('Nathaniel Stride', 'Compound')]['class_rank']==1 and wa[('Nathaniel Stride', 'Compound')]['class_size']==1)
chk('WA rating from the text file', wa[('Nathaniel Stride', 'Compound')]['rating']=='40.0')
indoor = data['national']['indoor']
chk('tsv indoor', len(indoor)==2 and indoor[0]['name']=='Nathaniel Stride' and indoor[0]['rating']=='52.8')
chk('a discipline that was not in the saved pages is kept', any(r['name']=='Lee Archer' and r['discipline']=='field' for r in data['national']['field']))
chk('replaced discipline is only the saved page', all(r['name']!='Lee Archer' for r in data['national']['outdoor']))
chk('archers map still groups national rows by name', 'Nathaniel Stride' in data['archers'] and any(r['discipline']=='indoor' for r in data['archers']['Nathaniel Stride']))
chk('untouched state disciplines stay empty lists', data['states']['WA']['clout']==[] and data['national']['clout']==[])
print('rankings import: PASS', len(ok), 'FAIL', len(bad), bad[:8])
sys.exit(1 if bad else 0)
