# Imported by every test that loads the app (1 Nov 2026). Every browser context and page then has the ntfy.sh relay stubbed and the
# service worker blocked, so no test can reach the real relay or be served an old cached copy of the app.
# A test's own ntfy.sh route (added later) still wins, and a test that sets service_workers itself (offline_test needs 'allow') keeps it.
import os, re
from playwright.sync_api import Browser, Locator, Page
RELAY=re.compile(r'^https?://([^/]*\.)?ntfy\.sh(/|$)')
STUBBED=[]
def _stub(route):
    STUBBED.append(route.request.url)
    route.fulfill(status=200,body='',headers={'access-control-allow-origin':'*','content-type':'application/json'})
def _arm(ctx):
    ctx.route(RELAY,_stub);return ctx
def _round_name(value, label=None):
    raw=value
    if isinstance(raw,dict):raw=raw.get('value') or raw.get('label')
    if isinstance(raw,(list,tuple)):raw=raw[0] if raw else None
    if not isinstance(raw,str) or raw in ('__new',''):
        raw=label if isinstance(label,str) else None
    return raw if isinstance(raw,str) and raw not in ('__new','') else None
def _prep_round(page, name):
    if not name:return
    try:page.evaluate("(n)=>{if(typeof jmSelectRound==='function')jmSelectRound(n)}",name)
    except Exception:pass
if not getattr(Page,'_st_round',False):
    _ps=Page.select_option
    def _page_select(self, selector, value=None, **kwargs):
        if isinstance(selector,str) and selector.strip() in ('#rd','select#rd') and os.environ.get('ST_NO_ROUND')!='1':
            _prep_round(self, _round_name(value, kwargs.get('label')))
        return _ps(self, selector, value, **kwargs)
    Page.select_option=_page_select
    Page._st_round=True
if not getattr(Locator,'_st_round',False):
    _ls=Locator.select_option
    def _loc_select(self, value=None, **kwargs):
        sel=''
        try:sel=self._impl_obj._selector or ''
        except Exception:sel=''
        if '#rd' in sel or str(sel).endswith('#rd'):
            _prep_round(self.page, _round_name(value, kwargs.get('label')))
        return _ls(self, value, **kwargs)
    Locator.select_option=_loc_select
    Locator._st_round=True
if not getattr(Browser,'_st_guard',False):
    _nc=Browser.new_context;_np=Browser.new_page
    def _new_context(self,*a,**k):
        k.setdefault('service_workers','block');return _arm(_nc(self,*a,**k))
    def _new_page(self,*a,**k):
        k.setdefault('service_workers','block');pg=_np(self,*a,**k);_arm(pg.context);return pg
    Browser.new_context=_new_context;Browser.new_page=_new_page;Browser._st_guard=True
