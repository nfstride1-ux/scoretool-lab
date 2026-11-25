/* Line icons (22 Oct 2026): no emoji in the app. Every emoji the app draws (and any in names or notes) is swapped on screen for a
   simple navy/ink line icon with a gold accent. Stored data is never touched: this only changes what is drawn. */
(function(){
const P={
target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle class="gf" cx="12" cy="12" r="2.2"/>',
home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path class="g" d="M10 20v-5h4v5"/>',
book:'<path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h11"/><path class="g" d="M9 8h5"/>',
people:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle class="g" cx="17" cy="9" r="2.5"/><path class="g" d="M16 14c2.8 0 5 2.2 5 5"/>',
wrench:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3.6 17a1.4 1.4 0 0 0 2 2l5.6-5.7a4 4 0 0 0 5.1-5.4l-2.4 2.4-2-.5-.5-2z"/>',
calendar:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path class="g" d="M8 14h3"/>',
search:'<circle cx="10.5" cy="10.5" r="6"/><path class="g" d="M15 15l5.5 5.5"/>',
star:'<path class="g" d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
trend:'<path d="M4 19h16"/><path class="g" d="M5 15l4-4 3 3 6-7"/><path class="g" d="M14 7h4v4"/>',
bars:'<path d="M4 20h16"/><path d="M7 20v-6M12 20V8"/><path class="g" d="M17 20V4"/>',
plus:'<circle cx="12" cy="12" r="9"/><path class="g" d="M12 8v8M8 12h8"/>',
pen:'<path d="M4 20l1-4L16 5l3 3L8 19z"/><path class="g" d="M14 7l3 3"/>',
bow:'<path d="M6 3c6 3 6 15 0 18"/><path d="M6 3v18"/><path class="g" d="M4 12h16M17 9l3 3-3 3"/>',
medal:'<path d="M8 3l4 6 4-6"/><circle class="g" cx="12" cy="15" r="5.5"/><path d="M12 12.5v5"/>',
trophy:'<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path class="g" d="M12 14v3M8 20h8M9.5 17h5"/>',
shield:'<path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path class="g" d="M9 12l2 2 4-4"/>',
flag:'<path d="M5 21V4"/><path class="g" d="M5 4h12l-2 4 2 4H5"/>',
swords:'<path d="M4 4l10 10M14 4L4 14"/><path class="g" d="M14 14l5 5M4 14l-1 4 4-1M10 14l-6 5"/>',
arrow:'<path d="M5 19L19 5"/><path d="M13.5 5H19v5.5"/><path class="g" d="M5 19l1-4M5 19l4-1M8 16l1-4M8 16l4-1"/>',
clip:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path class="g" d="M8.5 12h7M8.5 16h5"/>',
follow:'<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c0-3.6 2.9-6.5 6.5-6.5"/><path class="g" d="M15 15h6M18 12v6"/>',
card:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.5 16c.6-1.6 1.9-2.4 3.5-2.4s2.9.8 3.5 2.4"/><path class="g" d="M14.5 10h4M14.5 14h3"/>',
coach:'<circle cx="8" cy="7" r="3"/><path d="M2.5 20c0-3.3 2.4-6 5.5-6s5.5 2.7 5.5 6"/><rect class="g" x="13" y="4" width="8" height="6" rx="1"/><path class="g" d="M15 12l2-2"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
sun:'<circle class="g" cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
moon:'<path class="g" d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><rect class="g" x="8" y="6" width="8" height="3.5" rx=".5"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 17h.01M12 17h.01M15.5 17h.01"/>',
three:'<circle cx="12" cy="12" r="8.5"/><ellipse cx="12" cy="12" rx="5" ry="3.5"/><circle class="gf" cx="12" cy="12" r="1.6"/>',
trash:'<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/><path class="g" d="M10 11v6M14 11v6"/>',
tick:'<path d="M5 12.5l4.5 4.5L19 7.5" style="stroke-width:2.4"/>',
x:'<path d="M6 6l12 12M18 6L6 18" style="stroke-width:2.4"/>',
starf:'<path class="gf" d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
warn:'<path d="M12 3.5l9.5 16.5h-19z"/><path class="g" d="M12 10v4.5M12 17.5h.01"/>',
check:'<circle cx="12" cy="12" r="9"/><path class="g" d="M8 12.5l2.7 2.7L16.5 9.5"/>',
cross:'<circle cx="12" cy="12" r="9"/><path class="g" d="M9 9l6 6M15 9l-6 6"/>',
flame:'<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4.5 2.5-7 1.5 1.5 2 3 2 3S12 7 12 3z"/><path class="g" d="M12 20a2.5 2.5 0 0 1-2.5-2.5c0-1.8 2.5-3.5 2.5-3.5s2.5 1.7 2.5 3.5A2.5 2.5 0 0 1 12 20z"/>',
up:'<path d="M12 20V5"/><path class="g" d="M6 11l6-6 6 6"/>',
bulb:'<path d="M9 17h6M10 20.5h4"/><path class="g" d="M8.5 14.5A6 6 0 1 1 15.5 14.5c-.7.6-1 1.4-1 2.5h-5c0-1.1-.3-1.9-1-2.5z"/>',
chat:'<path d="M4 5h16v11H9l-5 4z"/><path class="g" d="M8 9.5h8M8 12.5h5"/>',
hundred:'<rect x="3" y="6" width="18" height="12" rx="2"/><path class="g" d="M7 9.5v5M10.5 9.5h2v5h-2zM15.5 9.5h2v5h-2z"/>',
camera:'<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle class="g" cx="12" cy="13" r="3.5"/>',
party:'<path d="M4 20l4.5-12L16 15.5z"/><path class="g" d="M14 3v2M19 5l-1.5 1.5M21 10h-2M15 9l3-3"/>',
dot:'<circle class="gf" cx="12" cy="12" r="6"/>',
ghost:'<path d="M5 20V11a7 7 0 0 1 14 0v9l-2.3-1.7L14.3 20 12 18.3 9.7 20l-2.4-1.7z"/><path class="g" d="M9.5 11h.01M14.5 11h.01"/>',
bolt:'<path class="g" d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path class="g" d="M12 3c2.5 2.7 3.5 5.7 3.5 9s-1 6.3-3.5 9c-2.5-2.7-3.5-5.7-3.5-9S9.5 5.7 12 3z"/>',
lock:'<rect x="5" y="10.5" width="14" height="10" rx="2"/><path class="g" d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path class="g" d="M10 20.5a2 2 0 0 0 4 0"/>',
gem:'<path d="M7 4h10l4 5-9 11L3 9z"/><path class="g" d="M3 9h18M12 20L9 9l3-5 3 5z"/>',
hat:'<path d="M8 15V6h8v9"/><path class="g" d="M3.5 15.5h17"/><path d="M8 11.5h8"/>',
shp1:'<circle class="g" cx="12" cy="12" r="8"/>',shp2:'<path class="g" d="M12 4l8 15H4z"/>',shp3:'<rect class="g" x="5" y="5" width="14" height="14" rx="2"/>',shp4:'<path class="g" d="M12 3l9 9-9 9-9-9z"/>',
shp5:'<path class="g" d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/>',shp6:'<path class="g" d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',shp7:'<path class="g" d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',shp8:'<path class="g" d="M4 12h16M12 4v16"/><circle cx="12" cy="12" r="8"/>'};
const M={'🎯':'target','🏠':'home','📓':'book','👥':'people','🔧':'wrench','📅':'calendar','🔬':'search','⭐':'star','🌟':'star','📈':'trend','📊':'bars','➕':'plus','📝':'pen','✍':'pen',
'🏹':'bow','🏅':'medal','🎖':'medal','🥇':'medal','🥈':'medal','🥉':'medal','🏆':'trophy','🛡':'shield','🏁':'flag','⚔':'swords','📋':'clip','👣':'follow','🪪':'card','🧑\u200d🏫':'coach','🧑':'coach',
'⚙':'gear','☀':'sun','🌙':'moon','🧮':'calc','🦌':'three','🗑':'trash','⚠':'warn','✅':'check','❌':'cross','✓':'tick','✔':'tick','✕':'x','✖':'x','✗':'x','✘':'x','★':'starf','☆':'star','🔥':'flame','🌋':'flame','💪':'up','👍':'check','💡':'bulb','💬':'chat','💯':'hundred',
'📷':'camera','🎉':'party','🌈':'party','🎩':'hat','🟡':'dot','👻':'ghost','⚡':'bolt','🌐':'globe','🔒':'lock','🔔':'bell','💎':'gem',
'🦊':'shp1','🐨':'shp2','🦘':'shp3','🐧':'shp4','🦉':'shp5','🐢':'shp6','🐬':'shp7','🦅':'shp8'};
const svg=n=>`<svg class="ic${n=='starf'?' icf':''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[n]}</svg>`;
window.icon=n=>P[n]?svg(n):'';
const keys=Object.keys(M).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
/* any listed emoji (with or without the emoji variation selector), or any other pictographic emoji (shown as a small gold dot) */
const RX=new RegExp('(?:'+keys.join('|')+')\\uFE0F?|(?![\\u00A9\\u00AE\\u2122\\u2605\\u2606\\u2713\\u2715\\u2122\\u2194-\\u21FF])\\p{Extended_Pictographic}\\uFE0F?(?:\\u200D\\p{Extended_Pictographic}\\uFE0F?)*','gu');
const SKIP=/^(SCRIPT|STYLE|TEXTAREA|INPUT|NOSCRIPT|CODE)$/;
function fixText(t){const p=t.parentNode;if(!p||SKIP.test(p.nodeName))return;const s=t.nodeValue;RX.lastIndex=0;if(!s||!RX.test(s))return;RX.lastIndex=0;
 /* places that can't hold an icon (dropdown options, SVG text, page title): the emoji is simply left out (the chart's PB star is drawn as a shape, not text) */
 if(p.nodeName=='OPTION'||p.nodeName=='TITLE'||p.namespaceURI=='http://www.w3.org/2000/svg'){t.nodeValue=s.replace(RX,'').replace(/^\s+/,'');return}
 const f=document.createDocumentFragment();let i=0;s.replace(RX,(m,o)=>{if(o>i)f.appendChild(document.createTextNode(s.slice(i,o)));const k=m.replace(/\uFE0F/g,''),n=M[k]||M[m]||'dot';
  const sp=document.createElement('span');sp.className='ici';sp.setAttribute('aria-hidden','true');sp.innerHTML=svg(n);f.appendChild(sp);i=o+m.length;return m});
 if(i<s.length)f.appendChild(document.createTextNode(s.slice(i)));p.replaceChild(f,t)}
function walk(n){if(n.nodeType==3)return fixText(n);if(n.nodeType!=1||SKIP.test(n.nodeName))return;const w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),L=[];let x;while(x=w.nextNode())L.push(x);L.forEach(fixText)}
window.stripEmoji=t=>String(t??'').replace(RX,'').replace(/\s{2,}/g,' ').trim();
const go=()=>{walk(document.body);new MutationObserver(ms=>{for(const m of ms){if(m.type=='characterData')fixText(m.target);else m.addedNodes.forEach(walk)}}).observe(document.body,{childList:true,subtree:true,characterData:true})};
if(document.body)go();else addEventListener('DOMContentLoaded',go);
})();
