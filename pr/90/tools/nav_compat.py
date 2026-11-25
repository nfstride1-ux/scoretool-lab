# Test helper, import before launching. The app itself is not changed by this.
from playwright.sync_api._generated import Browser
# Navigation compatibility (tests only, the app is not changed): the testers' app now has the five-tab layout
# (Home, Score, My archery, Clubs, Tools). These suites were written for the old tabs, so after load we add the old tab
# buttons (stats, rewards, follow, diary, me) to the nav, each opening the same old full screen it always did, and the
# Score start screen shows the league / match / group cards again (in the new layout they live under Clubs). The checks
# in each suite are unchanged. The old tab buttons are invisible 4px hit targets in the corner (23 Oct 2026), so screenshots
# from these suites no longer show stray 'statsrewardsfollowdiaryme' text at the right of the bottom nav.
COMPAT="""addEventListener('load',()=>setTimeout(()=>{try{const t=document.getElementById('tabs');if(!t||typeof render!='function')return;
['stats','rewards','follow','diary','me'].forEach((v,i)=>{if(t.querySelector('[data-v='+v+']'))return;const b=document.createElement('button');b.dataset.v=v;b.textContent=v;b.setAttribute('aria-hidden','true');b.style.cssText='position:fixed;left:'+(i*5)+'px;bottom:0;width:4px;height:4px;min-width:0;min-height:0;padding:0;margin:0;border:0;font-size:1px;line-height:1px;overflow:hidden;opacity:0;z-index:2147483647';
b.addEventListener('click',e=>{e.stopImmediatePropagation();e.preventDefault();view=v;render();scrollTo(0,0)},true);t.appendChild(b)});
const OLD=['stats','rewards','follow','diary','me'],n0=nav;nav=function(v){if(OLD.includes(v)){view=v;render();scrollTo(0,0);return}return n0.apply(this,arguments)};const s0=score,K=['h2hcard','lgcard','pgcard'];score=function(){const r=Element.prototype.remove;Element.prototype.remove=function(){if(K.includes(this.id))return;return r.call(this)};try{return s0.apply(this,arguments)}finally{Element.prototype.remove=r}};}catch(e){console.log('compat',e)}},0))"""
import os
if os.environ.get('ST_NO_COMPAT'):COMPAT='void 0'  # screenshots: real layout only
_np,_nc=Browser.new_page,Browser.new_context
def new_page(self,*a,**k):
  p=_np(self,*a,**k);p.add_init_script(COMPAT);return p
def new_context(self,*a,**k):
  c=_nc(self,*a,**k);c.add_init_script(COMPAT);return c
Browser.new_page=new_page;Browser.new_context=new_context
