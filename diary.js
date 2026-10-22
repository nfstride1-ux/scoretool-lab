/* ScoreTool demo: Shooting diary + Bow & setup diary. Tracker only: records the archer's own words, adds no advice. */
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const mine=a=>(a||[]).filter(x=>x.archer==S.profile);
const SETUP_CATS=['Arrows','Points','Nocks','Fletching','Bow/limbs','Draw length','Draw weight','String/cables','Peep','Sight','Rest','Release','Stabilisers','Other'];
/* order = priority: the most specific part wins when a clause mentions several */
const CAT_RX=[['Points',/\bpoints?\b|\bfield ?tips?\b|\bpoint weight|\bgrains? (up|down) front/i],['Nocks',/\bnocks?\b/i],['Fletching',/fletch|\bvanes?\b|\bfeathers?\b/i],
 ['Draw length',/draw ?length|\bdl\b|\bmodule\b/i],['Draw weight',/draw ?weight|poundage|\bpoundage\b|\blimb bolts?\b|\bcranked\b/i],['String/cables',/\bstring\b|\bcables?\b|\bserving\b|\btwists?\b/i],
 ['Peep',/\bpeep\b/i],['Sight',/\bsight\b|\bscope\b|\blens\b|\bpins?\b|\baperture\b/i],['Rest',/\brest\b|\bplunger\b|\bbutton\b|\bcentre ?shot\b|\bcenter ?shot\b/i],
 ['Release',/\brelease\b|\btrigger\b|\bhinge\b|\bback[- ]tension\b|\bclicker\b|\btab\b/i],['Stabilisers',/stabili[sz]er|\bback ?bar\b|\bside ?rod\b|\blong ?rod\b|\bv-?bar\b|\bweights? on\b/i],
 ['Bow/limbs',/\blimbs?\b|\briser\b|\bbrace height\b|\btiller\b|\bcams?\b|\bbow\b/i],['Arrows',/\barrows?\b|\bshafts?\b|\bspine\b/i]];
const UNIT=u=>{u=(u||'').toLowerCase();return/^(gn|grains?)$/.test(u)?'gn':/^(lbs?|pounds?|#)$/.test(u)?'lb':/^(in|inch|inches|")$/.test(u)?'in':u=='mm'?'mm':u=='spine'?'spine':u};
const NUM=w=>({half:0.5,quarter:0.25,a:1,an:1,one:1,two:2,three:3}[String(w).toLowerCase()]??parseFloat(w));
const U='(gn|grains?|lbs?|pounds?|inch(?:es)?|in\\b|"|mm|spine)';
function parseChange(c){let m=c.match(new RegExp(`from\\s+([\\d.]+)\\s*${U}?\\s*(?:to|->|→)\\s*([\\d.]+)\\s*${U}?`,'i'));
 if(m){const u=UNIT(m[2]||m[4]);return`${m[1]}${u&&u!='spine'?u:''} → ${m[3]}${u&&u!='spine'?u:''}${u=='spine'?' spine':''}`}
 m=c.match(new RegExp(`(?:to|now)\\s+([\\d.]+)\\s*${U}`,'i'));const dir=/shorten|lower|decreas|reduc|drop|less|backed off|down/i.test(c)?'−':/lengthen|rais|increas|add|more|up\b|cranked/i.test(c)?'+':'';
 const amt=c.match(new RegExp(`(\\d+(?:\\.\\d+)?|half|quarter|an?|one|two|three)\\s+(?:an?\\s+)?${U}`,'i'));
 const verb=(c.match(/\b(shortened|lengthened|lowered|raised|increased|decreased|reduced|added|dropped|changed|swapped|switched|replaced|moved|tested|tried|put on|fitted|cranked)\b/i)||[])[1];
 if(amt&&!m){const v=NUM(amt[1]);return verb?`${verb.toLowerCase()} by ${v}${UNIT(amt[2])}`:`${dir}${v}${UNIT(amt[2])}`}
 if(m)return`→ ${m[1]}${UNIT(m[2])}`;
 const sw=c.match(/\b(?:to|for|with)\s+(?:a|an|the|new)?\s*([^,]+?)$/i);return verb?`${verb.toLowerCase()}${sw&&!/see|test|check/i.test(sw[0])?' to '+sw[1]:''}`:''}
const RESULT_RX=/\b(noticed|found|felt|seemed|tightened|grouped|groups?|drift(ed)?|better|worse|improved|smoother|cleaner|higher|lower|left|right)\b/i;
function parseSetup(text,date){const items=[];const sentences=(text||'').split(/[.;!?\n]+/).map(x=>x.trim()).filter(Boolean);
 for(const sen of sentences){const parts=sen.split(/,\s*|\s+and\s+(?=i\b|my\b|they\b|it\b|the\b|groups?\b)/i).map(x=>x.trim()).filter(Boolean);
  for(const c of parts){const cat=(CAT_RX.find(([k,rx])=>rx.test(c))||[])[0];
   const isNotice=/^(?:i\s+)?(?:noticed|found|saw|felt)\b/i.test(c)||(!cat&&RESULT_RX.test(c))||(/^(my\s+)?groups?\b/i.test(c));
   if(isNotice&&items.length){const n=c.replace(/^(?:i\s+)?(?:noticed|found|saw|felt)\s+(?:that\s+)?/i,'').replace(/^(they|it)\s+/i,'').replace(/^my\s+/i,'');const it=items[items.length-1];it.noticed=it.noticed?it.noticed+'; '+n:n;continue}
   if(!cat&&!/\b(changed|swapped|switched|replaced|shortened|lengthened|raised|lowered|added|tested|tried|fitted|cranked|moved)\b/i.test(c)){if(items.length&&/^(to see|to test|because|so|for)\b/i.test(c))items[items.length-1].reason=c;continue}
   const rs=c.match(/\b(?:to see\s+(?:how|if|whether)?|to test|to check|because|since|so that|for)\s+(.+)$/i);
   let reason=rs?rs[1].replace(/^(they|it)\s+(shot|go|went|fly|flew)\s+/i,'').trim():'';if(rs&&/\bwind/i.test(rs[1]))reason='testing in the wind';
   const body=rs?c.slice(0,rs.index):c;items.push({id:'su'+Date.now()+Math.random().toString(36).slice(2,6),archer:S.profile,date,cat:cat||'Other',change:parseChange(body)||body.replace(/^(today\s+)?i\s+/i,''),reason,noticed:'',raw:c})}}
 return items}
function setupLine(x){return`<b>${esc(x.cat)}:</b> ${esc(x.change)}${x.reason?` (${esc(x.reason)})`:''}.${x.noticed?` Noticed: ${esc(x.noticed)}.`:''}`}
function seedDiary(){S.setup=S.setup||[];S.diary=S.diary||[]}
function setupMarkers(dates){const L=mine(S.setup).slice().sort((a,b)=>a.date<b.date?-1:1),M=[];
 L.forEach(x=>{const i=dates.findIndex(d=>d>=x.date);if(i>=0)M.push({i,t:`⚙️ ${x.date} ${x.cat}: ${x.change}${x.sample?' (sample)':''}`})});return M}
function currentSetup(){const m={};mine(S.setup).slice().sort((a,b)=>a.date<b.date?-1:1).forEach(x=>m[x.cat]=x);return Object.values(m)}
let draft=[];
function diary(){seedDiary();const d0=new Date(Date.now()-30*864e5).toLocaleDateString('en-CA'),t=today();
 const entries=[...mine(S.diary).map(x=>({date:x.date,kind:'Diary',text:x.text,sample:x.sample})),
  ...realShoots().map(x=>({date:x.date,kind:`${x.round} · ${x.score}${x.incomplete?' (incomplete)':''}`,text:(S.notes||{})[x.kind=='official'?'o:'+x.date+'|'+x.round:x.s.id]||''})).filter(x=>x.text),
  ...mine(S.setup).map(x=>({date:x.date,kind:'Setup',html:setupLine(x),sample:x.sample}))].sort((a,b)=>a.date<b.date?1:-1);
 app.innerHTML=`<div class="card"><span class="kicker">Shooting diary</span><h2>Today's entry</h2><label for="dd">Date</label><input id="dd" type="date" value="${t}">
 <label for="dt2">How did it go?</label><textarea id="dt2" rows="3" placeholder="Anything you want to remember about today"></textarea><button class="btn" id="dsave" style="margin-top:8px">Save entry</button></div>
 <div class="card"><span class="kicker">Bow & setup diary</span><h2>What did you change?</h2><p class="small muted">Write it how you'd say it. We'll sort it into a list you can check before saving.</p>
 <label for="sd">Date</label><input id="sd" type="date" value="${t}"><textarea id="stxt" rows="4" aria-label="Describe your setup changes" placeholder="e.g. changed my points from 120gn to 140gn to see how they shot in the wind, i noticed they drifted less"></textarea>
 <button class="btn ghost" id="sparse" style="margin-top:8px">Sort it out</button><div id="sprev"></div></div>
 <div class="card"><span class="kicker">Current setup</span><h3>Latest change per part</h3>${currentSetup().map(x=>`<div class="list-item">${setupLine(x)} <span class="small muted">${x.date}</span>${x.sample?' <span class="sample">sample</span>':''}</div>`).join('')||'<p class="small muted">No setup changes logged yet.</p>'}</div>
 <div class="card"><span class="kicker">Timeline</span><h3>Your diary</h3>${entries.map(e=>`<div class="list-item"><div class="small muted">${e.date} · ${esc(e.kind)} ${e.sample?'<span class="sample">sample</span>':''}</div><div>${e.html||esc(e.text)}</div>${e.text&&e.kind!='Diary'?chips(e.text):''}</div>`).join('')||'<p class="small muted">Nothing yet.</p>'}</div>`;
 $('#dsave').onclick=()=>{const v=$('#dt2').value.trim();if(!v)return;S.diary.push({id:'d'+Date.now(),archer:S.profile,date:$('#dd').value,text:v});save();diary()};
 $('#sparse').onclick=()=>{draft=parseSetup($('#stxt').value,$('#sd').value);renderDraft()}}
function renderDraft(){const P=$('#sprev');if(!draft.length){P.innerHTML='<p class="small">Couldn\'t spot a setup change. Try naming the part, e.g. points, sight, draw length.</p>';return}
 P.innerHTML=`<h3 style="margin-top:12px">Check before saving (${draft.length})</h3>${draft.map((x,i)=>`<div class="list-item" data-i="${i}"><p class="small muted" style="margin:0">${setupLine(x)}</p>
 <label>Part<select data-f="cat">${SETUP_CATS.map(c=>`<option ${c==x.cat?'selected':''}>${c}</option>`).join('')}</select></label>
 <label>Change<input data-f="change" value="${esc(x.change)}"></label><label>Why<input data-f="reason" value="${esc(x.reason)}"></label><label>Noticed<input data-f="noticed" value="${esc(x.noticed)}"></label>
 <button class="btn ghost" data-rm="${i}" style="margin-top:6px">Remove</button></div>`).join('')}<button class="btn" id="ssave" style="margin-top:8px">Save ${draft.length} change${draft.length>1?'s':''}</button>`;
 P.querySelectorAll('[data-f]').forEach(el=>el.oninput=el.onchange=()=>{const i=+el.closest('[data-i]').dataset.i;draft[i][el.dataset.f]=el.value;el.closest('[data-i]').querySelector('p').innerHTML=setupLine(draft[i])});
 P.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{draft.splice(+b.dataset.rm,1);renderDraft()});
 $('#ssave').onclick=()=>{S.setup.push(...draft.map(x=>({...x,date:$('#sd').value})));draft=[];save();diary()}}
function coachText(from,to){const inR=d=>d>=from&&d<=to,L=[];L.push(`${S.profile}: shooting summary ${from} to ${to}`,'');
 const sh=realShoots().filter(x=>inR(x.date));L.push('SCORES');if(!sh.length)L.push('- none in this range');
 sh.forEach(x=>{const n=(S.notes||{})[x.kind=='official'?'o:'+x.date+'|'+x.round:x.s.id]||'',tg=tagsOf(n).map(t=>t[1]);L.push(`- ${x.date} ${x.round}: ${x.score}${x.incomplete?' (incomplete, not counted)':''} [${x.kind}]`);if(tg.length)L.push(`  Tags: ${tg.join(', ')}`);if(n)L.push(`  My notes: ${n}`);
  if(x.kind=='official'){const o=offRounds().find(r=>normDate(r.date)==x.date);if(o){const good=o.ends.filter(e=>!e.flag),sums=good.map(e=>endSum(e.arrows)),third=Math.max(1,Math.floor(sums.length/3)),fake={dists:good.map(e=>e.dist)};
   roundFacts(sums,good,good.flatMap(e=>e.arrows),[...new Set(fake.dists)],sums.slice(0,third),sums.slice(-third),j=>endLabel(fake,j)).forEach(f=>L.push('  • '+f))}}});
 const su=mine(S.setup).filter(x=>inR(x.date));L.push('','SETUP CHANGES');if(!su.length)L.push('- none in this range');su.forEach(x=>L.push(`- ${x.date} ${x.cat}: ${x.change}${x.reason?' ('+x.reason+')':''}${x.noticed?'. Noticed: '+x.noticed:''}${x.sample?' [sample]':''}`));
 const di=mine(S.diary).filter(x=>inR(x.date));L.push('','DIARY (my own words)');if(!di.length)L.push('- none in this range');di.forEach(x=>L.push(`- ${x.date}: ${x.text}`));
 L.push('','Made with ScoreTool. These are my own records.');return L.join('\n')}
async function sendCoach(from,to){const txt=coachText(from,to),O=$('#cout');
 if(navigator.share){try{await navigator.share({title:`${S.profile} shooting summary`,text:txt});O.innerHTML='<p class="small">Shared ✓</p>';return}catch(e){if(e&&e.name=='AbortError')return}}
 O.innerHTML=`<textarea id="ctxt" rows="12" readonly style="margin-top:8px;font-size:13px">${esc(txt)}</textarea><div style="display:flex;gap:6px;margin-top:6px"><button class="btn ghost" id="ccopy">Copy text</button><button class="btn ghost" id="cprint">Print / save PDF</button></div>`;
 $('#ccopy').onclick=()=>{(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>$('#ccopy').textContent='Copied ✓',()=>{$('#ctxt').select();document.execCommand('copy');$('#ccopy').textContent='Copied ✓'})};
 $('#cprint').onclick=()=>{const w=open('','_blank');if(!w)return;w.document.write(`<title>${esc(S.profile)} summary</title><pre style="font:14px/1.5 system-ui;white-space:pre-wrap">${esc(txt)}</pre>`);w.document.close();w.focus();w.print()}}
