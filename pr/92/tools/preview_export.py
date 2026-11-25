#!/usr/bin/env python3
"""Copy the app into a pull-request preview folder.

Personal scoresheets, sight-mark files, and shot folders are left out so a
second public host does not receive them. The app files themselves are copied
unchanged.
"""
import shutil, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
SKIP_DIRS = {'.git', '.github', 'node_modules', 'c-7q4m9x2k'}
SKIP_FILES = {
    'my_scoresheets.json', 'nathe_ad.json', 'archer_scores.csv',
    'nathe_ace_sightmarks.json', 'testers_source.json',
}


def ignore(dirpath, names):
    skip = []
    base = pathlib.Path(dirpath).name
    for name in names:
        if name in SKIP_DIRS or name.startswith('shots'):
            skip.append(name)
            continue
        if name.startswith('.') and name != '.nojekyll':
            skip.append(name)
            continue
        if name.startswith('sheets_') and name.endswith('.json'):
            skip.append(name)
            continue
        if name.startswith('sightseed_'):
            skip.append(name)
            continue
        if name in SKIP_FILES:
            skip.append(name)
            continue
        if base == 'data' and name.startswith('ad_') and name.endswith('.json'):
            skip.append(name)
    return skip


def export(dest: pathlib.Path):
    dest = dest.resolve()
    if dest == ROOT or ROOT in dest.parents:
        print('FAIL preview destination must sit outside the repo')
        return 1
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(ROOT, dest, ignore=ignore)
    (dest / '.nojekyll').write_text('', encoding='utf-8')
    (dest / 'PREVIEW.txt').write_text(
        'This folder is a pull-request preview of ScoreTool.\n'
        'It is not the live app at scoretool-demo.\n'
        'Personal scoresheets and sight-mark files are not copied here.\n',
        encoding='utf-8',
    )
    bad = []
    for path in dest.rglob('*'):
        if not path.is_file():
            continue
        rel = path.relative_to(dest).as_posix()
        name = path.name
        if name.startswith('sheets_') and name.endswith('.json') and '/data/' in ('/' + rel):
            bad.append(rel)
        elif name.startswith('sightseed_'):
            bad.append(rel)
        elif name in SKIP_FILES:
            bad.append(rel)
    if bad:
        print('FAIL preview export kept personal files')
        for rel in bad:
            print(' ', rel)
        return 1
    if not (dest / 'index.html').is_file() or not (dest / 'app.js').is_file():
        print('FAIL preview export is missing index.html or app.js')
        return 1
    print('PASS preview export', dest)
    return 0


def main(argv):
    if len(argv) != 1:
        print('usage: preview_export.py DEST')
        return 2
    return export(pathlib.Path(argv[0]).resolve())


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
