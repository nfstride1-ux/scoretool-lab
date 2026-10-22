// National ranking card. Data: data/rankings.json (snapshot of Archer's Diary official AA National Rankings).
(function(){
let R=null;fetch('data/rankings.json').then(r=>r.json()).then(j=>{R=j;if(typeof render==='function'&&document.querySelector('#rank-slot'))render()}).catch(()=>{});
const D={outdoor:'Outdoor (target)',indoor:'Indoor',field:'Field',clout:'Clout'};
const ord=n=>{const s=n%100;return n+((s>10&&s<14)?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th'))};
window.rankCard=function(name){
 const src='https://www.archersdiary.com/NationalRankings.aspx';
 if(!R)return'<div class="card" id="rank-slot"><span class="kicker">National ranking</span><p class="muted small">Loading…</p></div>';
 const L=(R.archers[name]||[]);
 // one row per discipline+division: keep the archer's highest-rated class entry (older age-class entries can linger)
 const best={};L.forEach(x=>{const k=x.discipline+'|'+x.division;if(!best[k]||+x.rating>+best[k].rating)best[k]=x});
 const rows=Object.values(best).sort((a,b)=>Object.keys(D).indexOf(a.discipline)-Object.keys(D).indexOf(b.discipline));
 const asof=new Date(R.as_of).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});
 let h=`<div class="card" id="rank-slot"><span class="kicker">National ranking</span><h2>Archery Australia</h2>`;
 if(!rows.length)h+=`<p><b>Not currently ranked.</b></p><p class="small muted">To appear, shoot a round at an AA or World Archery registered tournament or an Archery Australia ranking event. Club shoots don't count.</p>`;
 else h+=rows.map(x=>`<div class="row" style="padding:6px 0;border-bottom:1px solid #0001"><span><b>${D[x.discipline]}</b><br><span class="small muted">${x.division} · ${x.age_class} ${x.gender}</span></span><span style="text-align:right"><b>${ord(x.class_rank)}</b> of ${x.class_size}<br><span class="small muted">rating ${x.rating}</span></span></div>`).join('');
 h+=`<p class="small muted">Rank within class, as of ${asof}. Ratings drop 2 points a month (5 for field and clout), so ranks change without new scores. Source: <a href="${src}" target="_blank" rel="noopener">Archer's Diary official AA rankings</a>.</p></div>`;
 return h};
})();
