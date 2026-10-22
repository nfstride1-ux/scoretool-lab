/* Help (?) posters + Send a suggestion (FormSubmit -> nfshold@gmail.com, same pattern as archerycalendars.com forms). */
const HELP_POSTERS=[['01-getting-started','Getting started & picking your tester'],['02-scoring','Scoring a round: plot arrows, zoom'],['03-practice-goal','Practice arrows & daily goal'],
 ['04-stats','Stats: pick a round'],['05-ranks','Ranks, badges, XP & fair play'],['06-squads','Squads: join with a code, cheers'],['07-following','Following other archers'],
 ['08-other-apps','Apps I use: Precision Cut, Garmin & more'],['09-diary','Diary'],['10-suggestion','Sending a suggestion']];
const FORM_URL='https://formsubmit.co/nfshold@gmail.com';
let lastTab='home';
(function(){const top=document.querySelector('.top');if(top){const b=document.createElement('button');b.className='help-btn';b.setAttribute('aria-label','Help');b.textContent='?';b.onclick=()=>nav('help');top.appendChild(b)}
 const o=window.nav;window.nav=function(v){if(v!='help'&&v!='suggest')lastTab=v;return o(v)}})();
function helpCards(){return`<div class="card"><span class="kicker">Help</span><h2>How to use ScoreTool</h2><p class="small">Quick picture guides for every part of the app.</p><button class="btn" onclick="nav('help')">Open Help</button>${typeof TESTER!='undefined'&&TESTER&&TESTER.guest?'':' <button class="btn ghost" onclick="nav(\'suggest\')">Send a suggestion</button>'}</div>`}
function helpView(){app.innerHTML=`<div class="card dark"><span class="kicker">Help</span><h1>How to use ScoreTool</h1><p>Tap a guide to see it full screen.</p></div>
<div class="poster-grid">${HELP_POSTERS.map(([f,t])=>`<button class="poster" data-f="${f}"><img loading="lazy" src="help/${f}.png?v=20261017a" alt="${t}"><span>${t}</span></button>`).join('')}</div>
${typeof TESTER!='undefined'&&TESTER&&TESTER.guest?'':`<div class="card"><h2>Got an idea or found a bug?</h2><button class="btn full" onclick="nav('suggest')">Send a suggestion</button></div>`}`;
 app.querySelectorAll('.poster').forEach(b=>b.onclick=()=>{const d=document.createElement('div');d.className='poster-full';d.innerHTML=`<img src="help/${b.dataset.f}.png?v=20261017a" alt=""><button class="btn" aria-label="Close">Close ✕</button>`;d.onclick=()=>d.remove();document.body.appendChild(d)})}
function suggestView(){const who=TESTER?TESTER.name:'',tabs=['Home','Score','Stats','Ranks','Following','Diary','Me','Squads','Help','Other'],cur=(lastTab||'home');
 app.innerHTML=`<div class="card"><span class="kicker">Testers</span><h1>Send a suggestion</h1><p class="small muted">Goes straight to Nathe by email.</p>
 <form id="sgForm" method="POST" enctype="multipart/form-data" action="${FORM_URL}" target="sgFrame">
 <input type="hidden" name="_subject" value="[ScoreTool tester] suggestion from ${who}"><input type="hidden" name="_template" value="table"><input type="hidden" name="_captcha" value="false">
 <input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
 <label>Your name<input name="tester" required value="${who}"></label>
 <label>Which part of the app?<select name="page">${tabs.map(t=>`<option${t.toLowerCase()==cur||(t=='Ranks'&&cur=='rewards')||(t=='Squads'&&cur=='squad')?' selected':''}>${t}</option>`).join('')}</select></label>
 <label>Your suggestion or problem<textarea name="message" rows="5" required placeholder="What would make it better? What went wrong?"></textarea></label>
 <label>Screenshot (optional)<input type="file" name="attachment" accept="image/*"></label>
 <input type="hidden" name="app_version" value="scoretool-lab TEST VERSION"><input type="hidden" name="device" value="${navigator.userAgent.replace(/"/g,'')}">
 <button class="btn full" id="sgSend" style="margin-top:10px">Send suggestion</button></form><iframe name="sgFrame" style="display:none"></iframe><div id="sgOut"></div></div>`;
 const f=$('#sgForm');f.onsubmit=e=>{if(!f.message.value.trim()){e.preventDefault();f.message.focus();return}
  f._subject.value='[ScoreTool tester] suggestion from '+(f.tester.value.trim()||'a tester');
  if(!navigator.onLine){e.preventDefault();location.href=`mailto:nfshold@gmail.com?subject=${encodeURIComponent(f._subject.value)}&body=${encodeURIComponent('Page: '+f.page.value+'\n\n'+f.message.value)}`;return}
  $('#sgSend').textContent='Sending…';$('#sgSend').disabled=true;
  setTimeout(()=>{f.hidden=true;$('#sgOut').innerHTML='<h2>Thanks!</h2><p>Your suggestion has been sent to Nathe.</p><button class="btn ghost" onclick="nav(\'suggest\')">Send another</button>'},1500)}}
window.EXTRA_VIEWS=Object.assign(window.EXTRA_VIEWS||{},{help:helpView,suggest:suggestView});
