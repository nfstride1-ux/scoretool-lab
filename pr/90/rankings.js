// Rankings card. data/rankings.json is a saved copy: national lists and a list per state (WA and the others).
// The old shape, archers[name] = rows, is still read. Nothing here contacts Archer's Diary.
(function(){
const D={outdoor:'Outdoor (target)',indoor:'Indoor',field:'Field',clout:'Clout'};
const ORDER=['outdoor','indoor','field','clout'];
const STATE_CODE={'western australia':'WA','wa':'WA','australian capital territory':'ACT','act':'ACT','new south wales':'NSW','nsw':'NSW','tasmania':'TAS','tas':'TAS','south australia':'SA','sa':'SA','victoria':'VIC','vic':'VIC','queensland north':'NQ','nq':'NQ','south queensland':'SQ','sq':'SQ','queensland':'SQ'};
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function asOfLabel(iso){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso||'');if(!m)return '';const months='Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');return (+m[3])+' '+months[+m[2]-1]+' '+m[1]}
const ord=n=>{const s=n%100;return n+((s>10&&s<14)?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th'))};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let R=null;
function paint(){if(document.getElementById('rank-slot')&&typeof render==='function')render()}
fetch('data/rankings.json',{cache:'no-store'}).then(r=>r.json()).then(j=>{R=j;paint()}).catch(()=>{R={}});
/* Rows for one archer, new format first, then the old archers map. */
window.ranksForName=function(j,name){if(!j)return [];const n=norm(name);
 if(j.national){const out=[];ORDER.forEach(d=>{(j.national[d]||[]).forEach(row=>{if(norm(row.name)===n)out.push(Object.assign({discipline:d},row))})});if(out.length)return out}
 if(j.archers){const key=Object.keys(j.archers).find(k=>norm(k)===n);if(key)return j.archers[key].slice()}
 return []};
function stateCode(rows){const named=rows.map(r=>STATE_CODE[norm(r.state)]).find(Boolean);return named||'WA'}
function stateList(j,code,name){const block=j&&j.states&&j.states[code];if(!block)return [];const n=norm(name),out=[];
 ORDER.forEach(d=>{(block[d]||[]).forEach(row=>{if(norm(row.name)===n)out.push(Object.assign({discipline:d},row))})});return out}
function bestOf(list){const m={};list.forEach(x=>{const k=(x.discipline||'')+'|'+(x.division||'');if(!m[k]||+x.rating>+m[k].rating)m[k]=x});return m}
window.aaRankCard=function(name){
 const src='https://www.archersdiary.com/NationalRankings.aspx';
 if(!R)return'<div class="card" id="rank-slot"><span class="kicker">Rankings</span><p class="muted small">Loading…</p></div>';
 const nat=window.ranksForName(R,name),code=stateCode(nat),st=stateList(R,code,name);
 const NB=bestOf(nat),SB=bestOf(st);
 const keys=Object.keys(NB).sort((a,b)=>ORDER.indexOf(a.split('|')[0])-ORDER.indexOf(b.split('|')[0]));
 const asof=asOfLabel(R.as_of);
 let h=`<div class="card" id="rank-slot"><span class="kicker">Rankings</span><h2>Archery Australia</h2>`;
 if(!keys.length)h+=`<p><b>Not currently ranked.</b></p><p class="small muted">To appear, shoot a round at an AA or World Archery registered tournament or an Archery Australia ranking event. Club shoots don't count.</p>`;
 else h+=keys.map(k=>{const x=NB[k],s=SB[k];
  const stateLine=s?`<div>${esc(code)} <b>${ord(s.class_rank)}</b> of ${s.class_size}</div>`:`<div class="small muted">${esc(code)} rank is not in this saved list.</div>`;
  return `<div style="padding:8px 0;border-bottom:1px solid #0001"><b>${esc(D[x.discipline]||x.discipline)}</b><div class="small muted">${esc(x.division)} · ${esc(x.age_class)} ${esc(x.gender)}</div><div>National <b>${ord(x.class_rank)}</b> of ${x.class_size}</div>${stateLine}<div class="small muted">rating ${esc(x.rating)}</div></div>`}).join('');
 h+=`<p class="small muted">Rank within class, as of ${esc(asof||'the saved date')}. ${esc(code)} is your state list. Ratings drop 2 points a month (5 for field and clout), so ranks change without new scores. This is a saved copy. Source: <a href="${src}" target="_blank" rel="noopener">official AA National Rankings</a>.</p></div>`;
 return h};
})();
