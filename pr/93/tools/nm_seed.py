# Test helper (import before launching): every page these tests open starts with each tester's display name already picked
# (test nicknames, not real names), so the first-open name screen is skipped. All ntfy.sh traffic is answered locally with an
# empty reply, so tests never post to (or read from) the real public relay. A test that mocks the relay itself (h2h) adds
# its own route later, which takes priority.
import json
from playwright.sync_api._generated import Browser,BrowserContext
SEED={'nathe':'Bullseye','phill':'Coach P','logan':'Zap','steven':'Steady','joseph':'Joey','michael':'Mick','dana':'Dee','tahuri':'Taz','nate':'Navy','estiaan':'Ezzy'}
IDS=list(SEED)
JS="(()=>{const S=%s;for(const id in S)if(!localStorage.getItem('scoretool.dname.'+id))localStorage.setItem('scoretool.dname.'+id,JSON.stringify({n:S[id],nt:Date.now()}))})()"%json.dumps(SEED)
import nav_compat  # old-tab navigation for these suites (see nav_compat.py)
def quiet(route,req):route.fulfill(status=200,body='',headers={'access-control-allow-origin':'*'})
_np,_nc=Browser.new_page,Browser.new_context
def new_page(self,*a,**k):
  p=_np(self,*a,**k);p.add_init_script(JS);p.route('https://ntfy.sh/**',quiet);return p
def new_context(self,*a,**k):
  c=_nc(self,*a,**k);c.add_init_script(JS);c.route('https://ntfy.sh/**',quiet);return c
Browser.new_page=new_page;Browser.new_context=new_context
def pick(pg,who):
  """click a tester on the sign-in picker by real name / first name / id (the picker itself shows display names only).
  The Unlock button is not in the app. Tests that used to tap it still get in here, which only writes the existing unlocked flag in the test browser."""
  w=who.lower();tid=next((i for i in IDS if i==w or w.startswith(i) or (i=='nathe' and 'nath' in w)),None)
  pg.locator(f'[data-tester="{tid}"]').first.click()
  pg.wait_for_timeout(700)
  pg.evaluate("""()=>{ if (typeof S!=='undefined' && S && !S.unlocked){ S.unlocked=true; if (typeof save==='function') save(); if (typeof render==='function') render(); } }""")
