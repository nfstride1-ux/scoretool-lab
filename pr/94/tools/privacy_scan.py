#!/usr/bin/env python3
"""Scan public files for a plaintext passcode constant, personal scoresheets,
sight-mark files, or one email address.

Prints paths and categories only. It never prints a secret value.

Pull request 72 is on main and removed the known personal files and the
plaintext passcode constant. This scan has no allow-list. A hit fails the run.
The salted PBKDF2 verifier that replaced the constant is not a passcode and is
not flagged.
"""
import os, re, sys, tempfile, pathlib

EMAIL = 'nfstride1' + '@' + 'gmail.com'
SKIP_DIR = {'.git', 'node_modules', '.github'}
SKIP_EXT = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.wasm', '.woff', '.woff2', '.ico', '.zip', '.mp4'}
# A named passcode/password constant assigned a quoted string. Hex verifiers
# (salt, derived key) are not this pattern.
PASS_CONST = re.compile(
    r"""(?:const|let|var)\s+[A-Za-z0-9_]*(?:PASSCODE|PASSWORD)[A-Za-z0-9_]*\s*=\s*(['"])[^'"]+\1"""
)
LK_CONST = re.compile(r"""\bLK_PASSCODE\s*=\s*(['"])[^'"]+\1""")


def hits(root: pathlib.Path):
    found = []
    root = root.resolve()
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIR and not d.startswith('shots')]
        for name in filenames:
            path = pathlib.Path(dirpath) / name
            rel = path.relative_to(root).as_posix()
            if name.startswith('sheets_') and name.endswith('.json') and '/data/' in ('/' + rel):
                found.append('sheets:' + rel)
            if name.startswith('sightseed_') and path.suffix in {'.js', '.json'}:
                found.append('sight:' + rel)
            if path.suffix.lower() in SKIP_EXT:
                continue
            try:
                if path.stat().st_size > 2_000_000:
                    continue
                text = path.read_text(encoding='utf-8', errors='ignore')
            except OSError:
                continue
            if EMAIL in text.lower():
                found.append('email:' + rel)
            if PASS_CONST.search(text) or LK_CONST.search(text):
                found.append('passcode:' + rel)
    return sorted(set(found))


def label(hit):
    kind, _, path = hit.partition(':')
    names = {
        'passcode': 'plaintext passcode constant',
        'sheets': 'personal scoresheet',
        'sight': 'personal sight-mark file',
        'email': 'listed email address',
    }
    return f'{names.get(kind, kind)} in {path}'


def write_summary(lines):
    dest = os.environ.get('GITHUB_STEP_SUMMARY')
    if not dest:
        return
    with open(dest, 'a', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')


def self_test():
    with tempfile.TemporaryDirectory() as tmp:
        root = pathlib.Path(tmp)
        (root / 'ok.js').write_text('const title = "ScoreTool";\n', encoding='utf-8')
        (root / 'data').mkdir()
        if hits(root):
            print('FAIL self-test: a clean tree was flagged')
            return 1
        (root / 'bad.js').write_text('const ' + 'LK_PASSCODE' + " = 'sample';\n", encoding='utf-8')
        (root / 'data' / 'sheets_sample.json').write_text('{}\n', encoding='utf-8')
        (root / 'sightseed_sample.js').write_text('// sample\n', encoding='utf-8')
        (root / 'note.txt').write_text('write to ' + EMAIL + '\n', encoding='utf-8')
        got = hits(root)
        need = {'passcode:bad.js', 'sheets:data/sheets_sample.json', 'sight:sightseed_sample.js', 'email:note.txt'}
        if set(got) != need:
            print('FAIL self-test: expected the four sample hits')
            for h in got:
                print(' ', label(h))
            return 1
    print('PASS privacy scan self-test')
    return 0


def main(argv):
    if '--self-test' in argv:
        return self_test()
    root = pathlib.Path(__file__).resolve().parents[1]
    found = hits(root)
    if not found:
        print('PASS privacy scan')
        print('No plaintext passcode constant, no data/sheets_*.json, no sightseed file, no listed email address.')
        write_summary(['### Privacy scan', '', 'Pass. No plaintext passcode constant, scoresheet file, sight-mark file, or listed email address.'])
        return 0
    print('FAIL privacy scan')
    for hit in found:
        print(' ', label(hit))
    write_summary(['### Privacy scan', '', 'Fail.'] + [f'- {label(h)}' for h in found])
    return 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
