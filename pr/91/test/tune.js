/* Tune helper (26 Nov 2026). Setup first, then the tuning steps in a row.
   Compound and Recurve lists from Archery Coach; steps 1-3 are shared.
   Each step opens the screen that already does that job, where one exists. */
(function(){
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='scoretool.tunehelper.bt';
const COMPOUND=[
 ['setup','Bow setup','Set draw length, draw weight, cam timing and a level nock, with the rest centred.','bows',null],
 ['spine','Draw weight / spine','Pick the spine from the maker\'s chart at your final draw weight, length and point weight.','calc',null],
 ['cut','Cut length','Cut to the shortest safe length, about 1 in past the rest at full draw.','cut',null],
 ['paper','Paper','Shoot through paper at about 4-6 ft and fix gross tears.','opt','Paper tune'],
 ['node','Node / nocking point','Get bare and fletched arrows to the same height.','opt','Bare shaft vs fletched'],
 ['bare','Bare shaft','Compare bare and fletched arrows left and right, and fine-tune the rest, yoke or spine.','opt','Bare shaft vs fletched'],
 ['creep','Creep','Check whether a shortened draw drops the group, and adjust timing if needed.','opt','Group tune'],
 ['torque','Torque','Shoot one end torqued left and one end torqued right against the vertical line, then adjust the sight.','opt','Torque tune'],
 ['dudley','Dudley','Use the sight for left/right up close and the rest for left/right at long range.','opt','Dudley / yoke tune']
];
const RECURVE=[
 ['setup','Bow setup','Set brace height, tiller, limb-bolt weight, a starting nocking point, and centre shot with the plunger.','bows',null],
 ['spine','Draw weight / spine','Use the chart for the weight at your draw length, not the limb marking, plus point weight.','calc',null],
 ['cut','Cut length','Leave about 1 in past the plunger at full draw, or cut to suit the clicker.','cut',null],
 ['paper','Paper (optional)','A quick flight check at about 4-6 ft, before bare shaft. Less reliable with fingers than bare shaft.','opt','Paper tune'],
 ['bare','Bare shaft','The main recurve tune: height first, then left and right with point weight, plunger spring or limb bolts.','opt','Bare shaft vs fletched'],
 ['node','Node / nocking point','Fine-tune until bare and fletched arrows land at the same height.','opt','Bare shaft vs fletched'],
 ['walk','Walk-back','Shoot one vertical line at several distances and adjust the plunger.','opt','Walk-back'],
 ['group','Plunger spring / group tune','Shoot long-range groups and adjust spring, tiller or brace for the tightest group.','opt','Group tune']
];
function curBt(){
 try{const s=localStorage.getItem(KEY);if(s=='r'||s=='c')return s}catch(e){}
 const cb=typeof curBow=='function'&&curBow(),snap=cb&&window.bowSnap&&bowSnap(cb.id);
 return(snap&&snap.type&&snap.type!='compound')?'r':'c';
}
function setBt(bt){try{localStorage.setItem(KEY,bt)}catch(e){}}
function go(s){
 if(s[3]=='opt'){window._tunePref=s[4];nav('lab_opt')}
 else if(s[3]=='calc')nav('lab_calc');
 else if(s[3]=='bows')nav('lab_mybows');
 else if(window.acGo)acGo('cut');else nav('lab_chooser');
}
E.lab_tune=function(){
 const bt=curBt(),steps=bt=='r'?RECURVE:COMPOUND;
 const note=bt=='r'
  ?'Setup first, then the recurve tuning steps in order. Recurve has no Torque or Dudley. Creep is a form note (clicker timing), not a tuning step.'
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
 app.querySelectorAll('[data-tn]').forEach(b=>b.onclick=()=>go((bt=='r'?RECURVE:COMPOUND).find(x=>x[0]==b.dataset.tn)));
 $('#tnopt').onclick=()=>{window._tunePref=null;nav('lab_opt')};
 $('#tncalc').onclick=()=>nav('lab_calc')};
if(window.LABSEC)LABSEC.lab_tune='tools';
const _o=E.lab_opt;if(_o)E.lab_opt=function(){_o();const pref=window._tunePref;window._tunePref=null;const s=$('#tc');if(s&&pref){s.value=pref;if(s.onchange)s.onchange()}};
})();
