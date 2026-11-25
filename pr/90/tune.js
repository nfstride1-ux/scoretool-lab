/* Tune helper (test build, 6 Nov 2026). One screen, George's order:
   paper, torque, draw weight/spine, cut length, bare shaft, node, creep, Dudley.
   Tuning sessions, the arrow check and the calculators stay; this screen is how you reach them. */
(function(){
const E=window.EXTRA_VIEWS=window.EXTRA_VIEWS||{};
const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const STEPS=[
 ['paper','Paper','Shoot through paper from about 4 to 6 feet. Easton calls this the test most used by compound archers with a release aid.','opt','Paper tune'],
 ['torque','Torque','See whether the group sits left or right of where you aimed. Plot it on the tuning face before you change the bow.','opt','Group test'],
 ['spine','Draw weight / spine','The spine check uses your draw weight and the maker\'s chart. It is a guide. Confirm it with paper or a bare shaft.','calc',null],
 ['cut','Cut length','Shortest safe cut: mark the arrow where it touches the rest at full draw, measure from the bottom of the nock groove, then add Easton\'s inch.','cut',null],
 ['bare','Bare shaft','Shoot fletched arrows, then bare shafts at the same aim. Easton: get them to the same height before you read left and right.','opt','Bare shaft vs fletched'],
 ['node','Node','The node step is the nocking point. Bare shafts and fletched arrows should hit at the same height first.','opt','Bare shaft vs fletched'],
 ['creep','Creep','Creep is the draw shortening just before you loose. If the group drops later in a round, note it here before you change the bow.','opt','Group test'],
 ['dudley','Dudley','Last in this order. Shoot the group again after the earlier steps and record where it lands. This is a record, not a new answer.','opt','Group test']
];
E.lab_tune=function(){
 app.innerHTML=`<div class="card" id="tunehelper"><span class="kicker">Tune helper</span><h2 style="margin:2px 0 8px">One order</h2>
 <p class="small" style="margin:0 0 8px">Paper, torque, draw weight and spine, cut length, bare shaft, node, creep, then Dudley. Each step opens the screen that already does that job.</p>
 <ol style="margin:0;padding-left:0;list-style:none">${STEPS.map((s,i)=>`<li style="margin:0 0 8px"><button type="button" class="btn ghost" data-tn="${s[0]}" style="width:100%;text-align:left"><b>${i+1}. ${h(s[1])}</b><br><span class="small">${h(s[2])}</span></button></li>`).join('')}</ol>
 <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
  <button type="button" class="btn ghost" id="tnopt">Arrow optimizer</button>
  <button type="button" class="btn ghost" id="tncalc">Calculators</button>
 </div></div>`;
 const bar=document.createElement('div');bar.className='labbar';bar.innerHTML=`<button class="btn ghost labback" type="button">‹ Tools</button><h1>Tune helper</h1>`;
 app.insertAdjacentElement('afterbegin',bar);
 bar.querySelector('.labback').onclick=()=>nav('tools');
 const go=id=>{const s=STEPS.find(x=>x[0]==id);if(!s)return;
  if(s[3]=='opt'){window._tunePref=s[4];nav('lab_opt')}
  else if(s[3]=='calc')nav('lab_calc');
  else if(window.acGo)acGo('cut');else nav('lab_chooser')};
 app.querySelectorAll('[data-tn]').forEach(b=>b.onclick=()=>go(b.dataset.tn));
 $('#tnopt').onclick=()=>{window._tunePref=null;nav('lab_opt')};
 $('#tncalc').onclick=()=>nav('lab_calc')};
if(window.LABSEC)LABSEC.lab_tune='tools';
const _o=E.lab_opt;if(_o)E.lab_opt=function(){_o();const pref=window._tunePref;window._tunePref=null;const s=$('#tc');if(s&&pref){s.value=pref;if(s.onchange)s.onchange()}};
})();
