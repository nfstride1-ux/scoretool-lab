/* Tune helper (26 Nov 2026). Setup first, then the tuning steps in a row.
   Compound and Recurve lists from Archery Coach; steps 1-3 are shared.
   Each step opens the screen that already does that job, where one exists. */
(function(){
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='scoretool.tunehelper.bt';
const COMPOUND=[
 ['setup','Bow setup','Set draw length, draw weight, cam timing and a level nock, with the rest centred.','bows',null],
 ['spine','Draw weight / spine','Pick the spine from the maker\'s chart at your final draw weight, length and point weight.','chooser','res'],
 ['cut','Cut length','Cut to the shortest safe length, about 1 in past the rest at full draw.','chooser','cut'],
 ['paper','Paper','Shoot through paper at about 4-6 ft and fix gross tears.','opt','Paper tune'],
 ['bare','Bare shaft','Compare bare and fletched arrows left and right, and fine-tune the rest, yoke or spine.','opt','Bare shaft vs fletched'],
 ['creep','Creep','Shoot a group at full draw and a group with a shortened draw. If the crept group drops, adjust cam timing only.','opt','Creep tune'],
 ['torque','Torque','Shoot one end torqued left and one end torqued right against the vertical line, then adjust the sight.','opt','Torque tune'],
 ['dudley','Walk back tune','Enter poundage and target size first. The app gives up to three safe distances. Draw a dot at the top with a line down, set windage at 10 m, then walk back without touching the sight.','opt','Walk back tune'],
 ['group','Group tune','Shoot long-range groups and keep the change that tightens the group.','opt','Group tune']
];
const RECURVE=[
 ['setup','Bow setup','Set brace height, tiller, limb-bolt weight, a starting nocking point, and centre shot with the plunger.','bows',null],
 ['spine','Draw weight / spine','Use the chart for the weight at your draw length, not the limb marking, plus point weight.','chooser','res'],
 ['cut','Cut length','Leave about 1 in past the plunger at full draw, or cut to suit the clicker.','chooser','cut'],
 ['paper','Paper (optional)','A quick flight check at about 4-6 ft, before bare shaft. Less reliable with fingers than bare shaft.','opt','Paper tune'],
 ['bare','Bare shaft','The main recurve tune: height first, then left and right with point weight, plunger spring or limb bolts.','opt','Bare shaft vs fletched'],
 ['walk','Walk back tune','Enter poundage and target size first. The app gives up to three safe distances. A sloped or curved line points to the plunger; change position or spring one at a time.','opt','Walk back tune'],
 ['group','Group tune','Shoot long-range groups and adjust spring, tiller or brace for the tightest group.','opt','Group tune']
];
/* Walk back tune is back in the helper (Nathe 27 Nov, go on the new method). "Just a group" stays off the new-session list. Old Walk back / Dudley sessions still open. */
function liveSteps(bt){return bt=='r'?RECURVE:COMPOUND}
function curBt(){
 try{const s=localStorage.getItem(KEY);if(s=='r'||s=='c')return s}catch(e){}
 const cb=typeof curBow=='function'&&curBow(),snap=cb&&window.bowSnap&&bowSnap(cb.id);
 return(snap&&snap.type&&snap.type!='compound')?'r':'c';
}
function setBt(bt){try{localStorage.setItem(KEY,bt)}catch(e){}}
function go(s){
 if(!s)return;
 if(s[3]=='opt'){window._tunePref=s[4];window._tuneBt=curBt();nav('lab_opt')}
 else if(s[3]=='bows'){window._tuneSetup=curBt();nav('lab_mybows')}
 else if(s[3]=='chooser'){if(window.acGo&&s[4])acGo(s[4]);else nav('lab_chooser')}
 else if(s[3]=='calc')nav('lab_calc');
 else if(window.acGo)acGo('cut');else nav('lab_chooser');
}
E.lab_tune=function(){
 const bt=curBt(),steps=liveSteps(bt);
 const note=bt=='r'
  ?'Setup first, then the recurve tuning steps in order. Creep is a form note (clicker timing), not a tuning step.'
  :'Setup first, then the compound tuning steps in order. Each step opens the screen that already does that job.';
 app.innerHTML=`<div class="card" id="tunehelper"><span class="kicker">Tune helper</span><h2 style="margin:2px 0 8px">Setup, then tune</h2>
 <div class="labseg" role="group" aria-label="Bow type" id="thbt"><button type="button" data-thbt="c" aria-pressed="${bt=='c'}">Compound</button><button type="button" data-thbt="r" aria-pressed="${bt=='r'}">Recurve</button></div>
 <p class="small" style="margin:0 0 8px">${note}</p>
 <ol id="thsteps" style="margin:0;padding-left:0;list-style:none">${steps.map((s,i)=>`<li style="margin:0 0 8px"><button type="button" class="btn ghost" data-tn="${s[0]}" style="width:100%;text-align:left"><b>${i+1}. ${h(s[1])}</b><br><span class="small">${h(s[2])}</span></button></li>`).join('')}</ol>
 ${bt=='r'?`<p class="small muted" id="thcreep" style="margin:10px 0 0">Creep (a shortened draw before the shot) is a form note for recurve, not a tuning step.</p>`:''}
 <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
  <button type="button" class="btn ghost" id="tnopt">Arrow optimizer</button>
  <button type="button" class="btn ghost" id="tncalc">Calculators</button>
 </div></div>`;
 const bar=document.createElement('div');bar.className='labbar';bar.innerHTML=`<button class="btn ghost labback" type="button">‹ Tools</button><h1>Tune helper</h1>`;
 app.insertAdjacentElement('afterbegin',bar);
 bar.querySelector('.labback').onclick=()=>nav('tools');
 app.querySelectorAll('[data-thbt]').forEach(b=>b.onclick=()=>{setBt(b.dataset.thbt);E.lab_tune()});
 app.querySelectorAll('[data-tn]').forEach(b=>b.onclick=()=>go(liveSteps(bt).find(x=>x[0]==b.dataset.tn)));
 $('#tnopt').onclick=()=>{window._tunePref=null;window._tuneBt=null;window._tuneOffer=null;if(typeof S!='undefined'){S._tuneId=null;if(typeof save=='function')save()}nav('lab_opt')};
 $('#tncalc').onclick=()=>nav('lab_calc')};
if(window.LABSEC)LABSEC.lab_tune='tools';
})();
