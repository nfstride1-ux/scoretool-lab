#!/usr/bin/env python3
"""Build data/rankings.json from HTML or copied text a person saved by hand.

Nothing in this tool fetches a page. You open the rankings in a browser, save the
page or copy the table, and pass the file here. One file is one scope and one
discipline.

    python3 tools/rankings_import.py --out data/rankings.json --as-of 2026-10-15 \\
        --page national outdoor saved/national-outdoor.html \\
        --page WA outdoor saved/wa-outdoor.txt

Format written:

    {
      "as_of": "YYYY-MM-DD",
      "source": "https://www.archersdiary.com/NationalRankings.aspx",
      "national": { "outdoor": [row], "indoor": [], "field": [], "clout": [] },
      "states": { "WA": { "outdoor": [row], ... }, "NSW": {...} },
      "archers": { "Name": [row, ...] }
    }

`archers` is the same rows grouped by name, so older code that reads that map
still works. A row is:

    rank, name, club, state, division, age_class, gender, rating,
    class_rank, class_size, discipline

rank is the Place column on that page. class_rank is the place among archers
with the same division, age class and gender, by rating. Ties share a place.

Scopes: national, WA, ACT, NSW, TAS, SA, VIC, NQ, SQ.
Disciplines: outdoor, indoor, field, clout.

Passing --page again replaces only that scope and discipline and keeps the rest.
An existing file in the old archers-only shape is kept and folded into national.
"""
import argparse, json, os, re, sys
from html import unescape

DISCIPLINES = ('outdoor', 'indoor', 'field', 'clout')
SCOPES = ('national', 'WA', 'ACT', 'NSW', 'TAS', 'SA', 'VIC', 'NQ', 'SQ')
SOURCE = 'https://www.archersdiary.com/NationalRankings.aspx'
HEADER = {
    'rank': re.compile(r'^(place|rank|#|pos)$', re.I),
    'name': re.compile(r'^(archer|name)$', re.I),
    'age_class': re.compile(r'^(class|age\s*class|age)$', re.I),
    'gender': re.compile(r'^gender$', re.I),
    'division': re.compile(r'^division$', re.I),
    'state': re.compile(r'^state$', re.I),
    'club': re.compile(r'^club$', re.I),
    'rating': re.compile(r'^(current|rating)$', re.I),
}

def clean(s):
    s = unescape(re.sub(r'<[^>]+>', ' ', s or ''))
    s = s.replace('\xa0', ' ')
    return re.sub(r'\s+', ' ', s).strip()

def html_rows(text):
    tables = re.findall(r'<table\b[^>]*>[\s\S]*?</table>', text, re.I)
    src = '\n'.join(tables) if tables else text
    rows = []
    for tr in re.findall(r'<tr\b[^>]*>[\s\S]*?</tr>', src, re.I):
        cells = [clean(c) for c in re.findall(r'<t[dh]\b[^>]*>([\s\S]*?)</t[dh]>', tr, re.I)]
        if any(cells):
            rows.append(cells)
    return rows

def split_line(line):
    if '\t' in line:
        return [c.strip() for c in line.split('\t')]
    if re.search(r'\s{2,}', line):
        return [c.strip() for c in re.split(r'\s{2,}', line.strip())]
    if ',' in line:
        return [c.strip().strip('"') for c in line.split(',')]
    return [line.strip()]

def text_rows(text):
    lines = [ln.strip() for ln in text.replace('\ufeff', '').splitlines()]
    return [split_line(ln) for ln in lines if ln.strip()]

def header_map(cells):
    mapping = {}
    for i, cell in enumerate(cells):
        for key, rx in HEADER.items():
            if key not in mapping and rx.match(cell.strip()):
                mapping[key] = i
    return mapping

def looks_header(cells):
    m = header_map(cells)
    return 'name' in m and ('rating' in m or 'rank' in m)

def page_date(text):
    m = re.search(r'name="ctl00\$mainContent\$txtDate"[^>]*value="(\d{2})/(\d{2})/(\d{4})"', text)
    if not m:
        m = re.search(r'value="(\d{2})/(\d{2})/(\d{4})"[^>]*name="ctl00\$mainContent\$txtDate"', text)
    if m:
        return f'{m.group(3)}-{m.group(2)}-{m.group(1)}'
    return ''

def add_class_ranks(rows):
    groups = {}
    for row in rows:
        groups.setdefault((row['division'], row['age_class'], row['gender']), []).append(row)
    for group in groups.values():
        for row in group:
            rating = float(row['rating'])
            better = sum(1 for other in group if float(other['rating']) > rating)
            row['class_rank'] = better + 1
            row['class_size'] = len(group)
    return rows

def parse_page(text, discipline):
    grid = html_rows(text) if re.search(r'<t[dh]\b', text, re.I) else text_rows(text)
    if not grid:
        raise SystemExit('no table rows in the saved page')
    start = 0
    if looks_header(grid[0]):
        mapping = header_map(grid[0])
        start = 1
    else:
        # Place, Archer, Class, Gender, Division, State, Club, Current
        mapping = {'rank': 0, 'name': 1, 'age_class': 2, 'gender': 3, 'division': 4, 'state': 5, 'club': 6, 'rating': 7}
    if 'name' not in mapping or 'rating' not in mapping:
        raise SystemExit('the saved table needs an archer column and a current/rating column')
    rows = []
    for cells in grid[start:]:
        def get(key):
            i = mapping.get(key)
            return cells[i].strip() if i is not None and i < len(cells) else ''
        name, rating = get('name'), get('rating')
        if not name or not re.search(r'\d', rating):
            continue
        place = re.sub(r'[^\d]', '', get('rank'))
        rows.append({
            'rank': int(place) if place else len(rows) + 1,
            'name': name,
            'club': get('club'),
            'state': get('state'),
            'division': get('division'),
            'age_class': get('age_class'),
            'gender': get('gender'),
            'rating': re.sub(r'[^\d.]', '', rating),
            'discipline': discipline,
        })
    if not rows:
        raise SystemExit('no archers were read from that file')
    return add_class_ranks(rows)

def empty_disciplines():
    return {d: [] for d in DISCIPLINES}

def blank():
    return {'as_of': '', 'source': SOURCE, 'national': empty_disciplines(), 'states': {}, 'archers': {}}

def fold_old(data):
    """Old files are {as_of, source, archers:{name:[rows]}} with no national map."""
    if data.get('national'):
        data.setdefault('states', {})
        data.setdefault('archers', {})
        return data
    national = empty_disciplines()
    for name, rows in (data.get('archers') or {}).items():
        for row in rows:
            disc = row.get('discipline') or 'outdoor'
            if disc not in national:
                national[disc] = []
            item = dict(row)
            item.setdefault('name', name)
            item.setdefault('club', '')
            item.setdefault('state', '')
            item.setdefault('rank', row.get('overall_rank') or row.get('rank') or 0)
            national[disc].append(item)
    data['national'] = national
    data.setdefault('states', {})
    return data

def rebuild_archers(data):
    by = {}
    for disc, rows in (data.get('national') or {}).items():
        for row in rows:
            name = row.get('name') or ''
            if not name:
                continue
            item = dict(row)
            item['discipline'] = disc
            by.setdefault(name, []).append(item)
    data['archers'] = by

def scope_name(raw):
    key = raw.strip()
    if key.lower() == 'national':
        return 'national'
    up = key.upper()
    if up not in SCOPES:
        raise SystemExit(f'unknown scope {raw!r}. Use national or one of: ' + ', '.join(SCOPES[1:]))
    return up

def put(data, scope, discipline, rows):
    if discipline not in DISCIPLINES:
        raise SystemExit(f'unknown discipline {discipline!r}')
    if scope == 'national':
        data['national'][discipline] = rows
    else:
        data['states'].setdefault(scope, empty_disciplines())
        data['states'][scope][discipline] = rows

def main(argv=None):
    p = argparse.ArgumentParser(description='Build rankings.json from saved rankings pages. Does not fetch.')
    p.add_argument('--out', required=True, help='rankings.json to write')
    p.add_argument('--as-of', default='', help='YYYY-MM-DD. Otherwise a date in the saved HTML, or the date already in --out.')
    p.add_argument('--page', action='append', nargs=3, metavar=('SCOPE', 'DISCIPLINE', 'FILE'), required=True)
    args = p.parse_args(argv)
    if os.path.exists(args.out):
        data = fold_old(json.load(open(args.out, encoding='utf-8')))
    else:
        data = blank()
    data.setdefault('source', SOURCE)
    found_date = ''
    for scope_raw, discipline, path in args.page:
        text = open(path, encoding='utf-8', errors='replace').read()
        rows = parse_page(text, discipline.strip().lower())
        put(data, scope_name(scope_raw), discipline.strip().lower(), rows)
        found_date = found_date or page_date(text)
        print(f'{scope_name(scope_raw)} {discipline.strip().lower()}: {len(rows)} archers from {path}')
    data['as_of'] = args.as_of or found_date or data.get('as_of') or ''
    if not data['as_of']:
        raise SystemExit('pass --as-of YYYY-MM-DD (no date was in the saved page or the existing file)')
    rebuild_archers(data)
    # keep discipline keys even when a state was only given one of them
    for block in data['states'].values():
        for d in DISCIPLINES:
            block.setdefault(d, [])
    for d in DISCIPLINES:
        data['national'].setdefault(d, [])
    os.makedirs(os.path.dirname(os.path.abspath(args.out)) or '.', exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
        f.write('\n')
    print('wrote', args.out, 'as of', data['as_of'])

if __name__ == '__main__':
    main()
