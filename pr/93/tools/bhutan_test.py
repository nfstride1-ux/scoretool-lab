#!/usr/bin/env python3
"""Run the Bhutan scoring/cancel unit tests."""
import subprocess, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
r = subprocess.run(['node', str(ROOT / 'tools' / 'bhutan_score_test.js')], cwd=str(ROOT))
sys.exit(r.returncode)
