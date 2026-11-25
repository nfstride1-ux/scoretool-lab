/* Tiers (test build, 6 Nov 2026). A switch only. No prices and no payment.
   Free: the score card. Plus: your own shooting. Pro: gear and tuning.
   Current archers who are not guests and not profiles you just made are Founding member: Pro, free for life.
   The choice is saved only when you change the switch (scoretool.tierpreview.<id>). Saved scores are not rewritten. */
(function(){
const RANK={free:0,plus:1,pro:2,founding:3};
function id(){return (typeof TESTER!='undefined'&&TESTER&&TESTER.id)||'guest'}
window.tierOf=function(){let p=null;try{p=localStorage.getItem('scoretool.tierpreview.'+id())}catch(e){}
 if(p==='free'||p==='plus'||p==='pro'||p==='founding')return p;
 if(typeof TESTER!='undefined'&&TESTER&&!TESTER.guest&&!TESTER.custom)return 'founding';
 return 'free'};
window.tierHas=function(need){const n=need==='pro'?'pro':need==='plus'?'plus':'free';return RANK[tierOf()]>=RANK[n]};
window.tierLabel=function(t){return {free:'Free',plus:'Plus',pro:'Pro',founding:'Founding member, free for life'}[t||tierOf()]||'Free'};
const PLUS=new Set(['stats','analytics','lab_analysis','diary','lab_diary','lab_latest','lab_arrows','lab_gear','lab_squad','squad','lab_leagues','lab_group','follow','lab_match']);
const PRO=new Set(['lab_mybows','lab_myarrows','lab_chooser','lab_tune','lab_opt','lab_calc']);
function card(){const t=tierOf();
 return `<div class="card" id="tiercard"><span class="kicker">Plan</span><h2 style="margin:2px 0 6px">${tierLabel(t)}</h2>
 <p class="small" style="margin:0 0 8px">${t==='founding'?'Founding member, free for life. Full access. Prices are not set, and nothing is charged.':'A switch so you can look at each plan. Prices are not set, and nothing is charged.'}</p>
 <label for="tierpick">Preview a plan</label>
 <select id="tierpick"><option value="free"${t==='free'?' selected':''}>Free</option><option value="plus"${t==='plus'?' selected':''}>Plus</option><option value="pro"${t==='pro'?' selected':''}>Pro</option><option value="founding"${t==='founding'?' selected':''}>Founding member</option></select>
 <p class="small muted" style="margin:8px 0 0">Free is the score card. Plus adds your own shooting, analysis, diary, photos and group scoring. Pro adds bows, arrows and the Tune helper.</p></div>`}
function bind(){const s=$('#tierpick');if(!s)return;s.onchange=()=>{try{localStorage.setItem('scoretool.tierpreview.'+id(),s.value)}catch(e){}render()}}
function locked(need){const name=need==='pro'?'Pro':'Plus';
 app.innerHTML=`<div class="card" id="tierlock"><span class="kicker">Plan</span><h2>Available on ${name}</h2><p>This stays on the menu. Your scores on this phone are unchanged.</p></div>${card()}`;bind();
 const b=document.createElement('div');b.className='labbar';b.innerHTML='<button class="btn ghost labback" type="button">‹ Back</button><h1>Available on '+name+'</h1>';
 app.insertAdjacentElement('afterbegin',b);b.querySelector('.labback').onclick=()=>nav('home')}
const _nav=nav;
nav=function(v){const need=PRO.has(v)?'pro':PLUS.has(v)?'plus':null;
 if(need&&!tierHas(need)){view=v;locked(need);scrollTo(0,0);return}return _nav.apply(this,arguments)};
const E=window.EXTRA_VIEWS||{};
const _s=E.lab_settings;if(_s)E.lab_settings=function(){_s();const host=$('#datacard')||$('#settingscard')||app;host.insertAdjacentHTML('afterend',card());bind()};
/* score screen: Ghost match is Plus. Founding members are unchanged. */
const _gh=window.EXTRA_VIEWS;void _gh;
document.addEventListener('click',function(ev){if(tierHas('plus'))return;const b=ev.target.closest&&ev.target.closest('#ghon');if(!b)return;ev.preventDefault();ev.stopPropagation();
 if(!$('#ghlock'))b.insertAdjacentHTML('afterend',' <span class="small" id="ghlock">Available on Plus.</span>')},true);
})();
