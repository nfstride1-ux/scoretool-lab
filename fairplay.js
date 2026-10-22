/* ScoreTool demo: fair-play nudge for self-logged practice arrows only.
   Official Archer's Diary scores are never checked or held.
   Thresholds (generous on purpose, so normal shooting never trips them):
   - Scored ends: an end finished less than (arrows per end x 10 s) after the previous end
     (6-arrow end: under 60 s; 3-arrow end: under 30 s). Shooting, walking and scoring an end takes minutes.
     The first end of a session isn't timed. Editing a past arrow isn't timed.
   - Added arrows (+6/+12/+36/+72 or "set today's total"): more than 150 arrows added within 10 minutes.
   Nothing is blocked: the arrows are saved and shown. Only the flagged burst is left out of XP, league,
   streaks and badges until the archer taps "Yes, I shot these". */
const FP_END_SEC_PER_ARROW=10,FP_VOL_WINDOW_MIN=10,FP_VOL_MAX=150;
const fpHolds=()=>(S.fpHold=S.fpHold||[]);
const fpOpen=()=>fpHolds().filter(h=>!h.ok);
function fpHeldByDay(){const m={};fpOpen().forEach(h=>m[h.date]=(m[h.date]||0)+h.n);return m}
function fpHeldEnd(sid,i){return fpOpen().some(h=>h.kind=='end'&&h.sid==sid&&h.ei==i)}
/* Arrows that count for rewards = all arrows minus unconfirmed bursts. */
function rewardDayArrows(){const m={...dayArrows()},H=fpHeldByDay();Object.entries(H).forEach(([d,n])=>{m[d]=Math.max(0,(m[d]||0)-n);if(!m[d])delete m[d]});return m}
function fpModal(h){document.querySelector('#fpm')?.remove();const d=document.createElement('div');d.id='fpm';
 d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','fpt');
 d.style.cssText='position:fixed;inset:0;background:rgba(2,6,23,.72);display:flex;align-items:center;justify-content:center;z-index:9999;padding:18px';
 d.innerHTML=`<div class="card dark" style="max-width:380px;width:100%;margin:0;border:1px solid var(--gold,#f5b301)"><span class="kicker">Fair play</span><h2 id="fpt" style="margin:4px 0 8px">Whoa, that was quick! ⚡</h2>
 <p style="margin:0 0 8px">Only log arrows you actually shot. The only person you'd be cheating is yourself.</p>
 <p class="small muted" style="margin:0 0 12px">${h.kind=='vol'?`${h.n} arrows added in under ${FP_VOL_WINDOW_MIN} minutes.`:`That end went in faster than it could be shot and scored.`} They're saved, but won't count for XP, league or badges until you say so.</p>
 <button class="btn alt full" id="fpy">Yes, I shot these</button><button class="btn ghost full" id="fpn" style="margin-top:8px">${h.kind=='vol'?'Oops, take them off':'Leave them uncounted'}</button></div>`;
 document.body.appendChild(d);
 $('#fpy').onclick=()=>{h.ok=true;save();d.remove();render()};
 $('#fpn').onclick=()=>{if(h.kind=='vol'){S.vol=S.vol||{};S.vol[h.date]=Math.max(0,(S.vol[h.date]||0)-h.n);S.fpHold=fpHolds().filter(x=>x!==h)}save();d.remove();render()}}
function fpCard(){const O=fpOpen();if(!O.length)return'';const n=O.reduce((t,h)=>t+h.n,0);
 return`<div class="card" style="border:1px solid var(--gold,#f5b301)"><span class="kicker">Fair play</span><p style="margin:4px 0">${n} quick-logged arrow${n==1?'':'s'} aren't counting toward XP, league or badges yet.</p><button class="btn" id="fpall">Yes, I shot these</button></div>`}
/* Scored ends */
const _put=putArrow;
putArrow=function(k,xy){const editing=!!fix,s=cur,before=s?s.ends.length+':'+(s.ends[s.ends.length-1]||[]).length:'';_put(k,xy);
 if(editing||!s||s.sample)return;const R=ROUNDS[s.round],i=s.ends.length-1,e=s.ends[i];if(!R||e.length!=R.ape||before==s.ends.length+':'+e.length)return;
 s.et=s.et||[];s.et[i]=Date.now();const p=s.et[i-1];
 if(i>0&&p&&s.et[i]-p<R.ape*FP_END_SEC_PER_ARROW*1000&&!fpHeldEnd(s.id,i)){const h={kind:'end',sid:s.id,ei:i,date:s.date,n:e.length,t:Date.now()};fpHolds().push(h);save();fpModal(h)}};
/* Added arrows */
document.addEventListener('click',ev=>{const b=ev.target.closest&&ev.target.closest('[data-vol],#vsave');if(!b)return;const t=today(),before=(S.vol||{})[t]||0;
 setTimeout(()=>{const add=((S.vol||{})[t]||0)-before;if(add<=0)return;S.volLog=(S.volLog||[]).filter(x=>Date.now()-x.t<FP_VOL_WINDOW_MIN*6e4);S.volLog.push({t:Date.now(),n:add});
  const sum=S.volLog.reduce((a,x)=>a+x.n,0);if(sum>FP_VOL_MAX){const h={kind:'vol',date:t,n:sum,t:Date.now()};
   S.fpHold=fpHolds().filter(x=>!(x.kind=='vol'&&!x.ok&&Date.now()-x.t<FP_VOL_WINDOW_MIN*6e4));fpHolds().push(h);S.volLog=[];save();fpModal(h)}else save()},0)},true);
document.addEventListener('click',ev=>{if(ev.target.id=='fpall'){fpOpen().forEach(h=>h.ok=true);save();render()}});
/* Rewards read only counted arrows */
const _dayMap=dayMap;dayMap=function(name){return name==S.profile?rewardDayArrows():_dayMap(name)};
const _allEnds=allEnds;allEnds=function(name){const E=_allEnds(name);if(name!=S.profile||!fpOpen().length)return E;
 const out=[];(S.sessions||[]).filter(s=>!s.sample).forEach(s=>s.ends.forEach((e,i)=>{if(!fpHeldEnd(s.id,i))out.push({date:s.date,arrows:e.map(String),src:'session'})}));return out.concat(E.filter(x=>x.src!='session'))};
if(window.volBadges){const _vb=volBadges;volBadges=function(mm){return _vb(mm||rewardDayArrows())}}
const _home=home;home=function(){_home.apply(this,arguments);const c=fpCard();if(c)app.insertAdjacentHTML('afterbegin',c)};
