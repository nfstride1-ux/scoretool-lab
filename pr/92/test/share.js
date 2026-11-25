/* Share the official score sheet as a PNG. Drawn on a canvas here (no html2canvas, no CDN), so it needs no network.
   navigator.share with the file when the phone supports sharing files; otherwise the PNG downloads.
   The image carries name, date, round and scores only: never contact details, and the ABA # only if the archer typed it in.
   Colours follow the app: dark night background, gold/blue/red/black/white target rings, field faces gold and black, no purple. */
(function(){
const BG='#0b111b',PANEL='#121a27',LINE='#2b3a52',INK='#f1f5f9',MUT='#9aa7ba',GOLD='#ffc629',BLUE='#3b82f6',RED='#d62828',BLK='#111111',WHT='#ffffff';
const isFldRound=s=>{const R=ROUNDS[s.round]||{};return!!s.bugs||(typeof isFld=='function'&&typeof faceR=='function'&&isFld(faceR(R,0)))||/field/i.test(s.round||'')};
function chip(a,fld){const v=val(a);if(a=='M')return['#475569',WHT];if(fld)return v>=5?[GOLD,BLK]:[BLK,WHT];
 return v>=9?[GOLD,BLK]:v>=7?[RED,WHT]:v>=5?[BLUE,WHT]:v>=3?[BLK,WHT]:[WHT,BLK]}
function txt(g,t,x,y,o={}){g.font=`${o.w||400} ${o.s||28}px system-ui,-apple-system,Segoe UI,Roboto,sans-serif`;g.fillStyle=o.c||INK;g.textAlign=o.a||'left';g.textBaseline='middle';g.fillText(String(t),x,y)}
function box(g,x,y,w,h,f,st){if(f){g.fillStyle=f;g.fillRect(x,y,w,h)}if(st){g.strokeStyle=st;g.lineWidth=2;g.strokeRect(x+1,y+1,w-2,h-2)}}
const W=1080,PAD=40;
/* Group card (Peel): each archer's sheet carries that archer's own typed name, never the phone owner's. An under-16 who matches a
   tester by real name goes by the nickname only (names.js); anyone else is shown as typed. Every other sheet is the phone owner's. */
function whoName(s){if(!s||!s.pg)return myName();const n=String((s.abaHead&&s.abaHead.name)||'').trim();if(!n)return'Archer';
 try{const sc=window.nmScrub?nmScrub(n):n;if(sc!==n&&typeof TESTERS!='undefined'&&window.testerName&&TESTERS.some(t=>t.junior&&testerName(t.id)===sc))return sc}catch(e){}return n}
window.shareWho=whoName;
function head(g,s,y,band,bandInk,sub){box(g,0,0,W,y+0,BG);txt(g,'ScoreTool',PAD,46,{s:30,w:800,c:GOLD});txt(g,'Score sheet',W-PAD,46,{s:26,c:MUT,a:'right'});
 box(g,PAD,84,W-2*PAD,64,band);txt(g,s.round.length>58?s.round.slice(0,56)+'…':s.round,PAD+20,116,{s:28,w:800,c:bandInk});
 txt(g,whoName(s),PAD,184,{s:34,w:800});txt(g,s.date||'',W-PAD,184,{s:28,c:MUT,a:'right'});if(sub)txt(g,sub,PAD,226,{s:24,c:MUT});return sub?256:216}
/* ABA: 4 columns like the paper sheet, running total restarting each 10-target block */
function drawABA(s){const R=ROUNDS[s.round]||{},HS=abaHalves(s),A=s.aba||[],hd=s.abaHead||{},rowH=54;
 const meta=[hd.noTyped&&hd.no?'ABA # '+hd.no:'',hd.grade?'Grade '+hd.grade:'',hd.div&&hd.div!='TBA'?'Division '+hd.div:'',s.abaClub?'Club rule: both halves 1 arrow':''].filter(Boolean).join(' · ');
 /* one column per 10-target block, 4 to a row, like the paper sheet */
 const cols=HS.flatMap((o,h)=>abaBlocks(o.H.t).map(bk=>({o,h,bk}))),rows=[];for(let i=0;i<cols.length;i+=4)rows.push(cols.slice(i,i+4));
 const rowHt=r=>60+rowH*(Math.max(...r.map(c=>c.bk.to-c.bk.from+1))+1)+24;
 const H=256+rows.reduce((t,r)=>t+rowHt(r),0)+40+64*(HS.length+1)+80,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');box(g,0,0,W,H,BG);
 const EV=window.abaEvOf?abaEvOf(s):null,OFF=EV?!!EV.official:!!(s.src=='paper'||s.pg);let y=head(g,{...s,round:EV?EV.name+' · ABA scoring':R.custom?s.round+' · 3D':'ABA 3D · Interclub scoring'},0,GOLD,BLK,[meta,OFF?'':'Not official'+(EV&&EV.fun?' (fun shoot)':'')].filter(Boolean).join(' · ')||null);const cw=(W-2*PAD-3*12)/4;
 rows.forEach(r=>{r.forEach(({o,h,bk},ci)=>{const x=PAD+ci*(cw+12),q=bk.q,n=bk.to-bk.from+1;box(g,x,y,cw,60,PANEL,LINE);txt(g,(HS.length>1?(h?'Second half ':'First half '):'')+bk.from+'-'+bk.to,x+cw/2,y+30,{s:22,w:800,a:'center'});
  for(let j=0;j<n;j++){const t=q*10+j,v=o.v[t],yy=y+60+j*rowH,a=A[o.i0+t]||{};box(g,x,yy,cw,rowH,null,LINE);txt(g,t+1,x+16,yy+rowH/2,{s:20,c:MUT});
   if(v!=null){txt(g,v,x+cw*0.5,yy+rowH/2,{s:28,w:800,a:'center',c:v>=20?GOLD:v?INK:MUT});txt(g,o.rn[t],x+cw-14,yy+rowH/2,{s:22,c:MUT,a:'right'});if(a.k)txt(g,hitCodeS(a),x+cw*0.5+34,yy+rowH/2-12,{s:14,c:MUT})}}
  const ys=y+60+n*rowH;box(g,x,ys,cw,rowH,PANEL,LINE);txt(g,bk.from+'-'+bk.to,x+16,ys+rowH/2,{s:20,c:MUT});txt(g,o.sub[q],x+cw-14,ys+rowH/2,{s:28,w:800,a:'right',c:GOLD})});y+=rowHt(r)});
 y+=16;HS.forEach((o,h)=>{txt(g,(h?'Second half':'First half')+' · '+(o.H.n==3?'3 Arrow':'1 Arrow')+' Total ('+o.sub.join(' + ')+')',PAD,y+30,{s:28});txt(g,o.tot,W-PAD,y+30,{s:32,w:800,a:'right'});y+=64});
 box(g,PAD,y,W-2*PAD,2,LINE);txt(g,'ROUND TOTAL',PAD,y+40,{s:34,w:800});txt(g,HS.reduce((t,o)=>t+o.tot,0),W-PAD,y+40,{s:44,w:800,a:'right',c:GOLD});return c}
const hitCodeS=a=>window.abaHitCode?abaHitCode(a):'';
/* every other round: one row per end, arrow chips, end total and running total */
function drawEnds(s){const R=ROUNDS[s.round]||{},fld=isFldRound(s),E=s.ends.filter(e=>e&&e.length),ape=Math.max(1,...E.map(e=>e.length)),rowH=60;
 const H=256+50+rowH*E.length+150,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');box(g,0,0,W,H,BG);
 let y=head(g,s,0,fld?GOLD:BLUE,fld?BLK:WHT,fld?'Field face (6-1)':null);
 const cs=Math.min(84,(W-2*PAD-60-240)/ape);txt(g,'#',PAD+8,y+24,{s:20,c:MUT});txt(g,'End',W-PAD-140,y+24,{s:20,c:MUT,a:'right'});txt(g,'Prog',W-PAD,y+24,{s:20,c:MUT,a:'right'});y+=50;let run=0;
 E.forEach((e,i)=>{const yy=y+i*rowH,es=endSum(e);run+=es;box(g,PAD,yy,W-2*PAD,rowH,i%2?null:PANEL);txt(g,i+1,PAD+8,yy+rowH/2,{s:22,c:MUT});
  e.forEach((a,j)=>{const[b,f]=chip(a,fld),x=PAD+60+j*cs;g.fillStyle=b;g.beginPath();g.arc(x+cs/2,yy+rowH/2,Math.min(cs,rowH)/2-6,0,7);g.fill();if(b==BLK||b==WHT){g.strokeStyle='#64748b';g.lineWidth=2;g.stroke()}txt(g,a,x+cs/2,yy+rowH/2+1,{s:22,w:800,c:f,a:'center'})});
  txt(g,es,W-PAD-140,yy+rowH/2,{s:26,w:800,a:'right'});txt(g,run,W-PAD,yy+rowH/2,{s:24,c:MUT,a:'right'})});
 y+=E.length*rowH+30;const A=E.flat(),cnt=fld?`6s: ${A.filter(a=>a=='6').length}   5s: ${A.filter(a=>a=='5').length}`:`Xs: ${A.filter(a=>a=='X').length}   10s + Xs: ${A.filter(a=>a=='X'||a=='10').length}`;
 txt(g,cnt,PAD,y+40,{s:26,c:MUT});txt(g,'TOTAL',W-PAD-200,y+40,{s:30,w:800,a:'right'});txt(g,total(s),W-PAD,y+40,{s:44,w:800,a:'right',c:GOLD});return c}
function sheetCanvas(s){return(ROUNDS[s.round]||{}).aba?drawABA(s):drawEnds(s)}
window.sheetCanvas=sheetCanvas;
const slug=t=>String(t||'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const fname=s=>('scoretool-'+(s.date||'')+(s.pg?'-'+slug(whoName(s)):'')+'-'+String(s.round||'sheet').replace(/[^A-Za-z0-9]+/g,'-').replace(/-+$/,'')).slice(0,80)+'.png';
/* share or download one canvas as a PNG (the sheet share, and the group card's competition shares, all go through here) */
async function shareCanvas(c,name,title,text){const blob=await new Promise(r=>c.toBlob(r,'image/png'));if(!blob)return'error';let file=null;try{file=new File([blob],name,{type:'image/png'})}catch(e){}
 window._lastShare={size:blob.size,name,title,text};
 if(file&&navigator.canShare&&navigator.share&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title,text});return(window._lastShare.how='shared')}catch(e){if(e&&e.name=='AbortError')return(window._lastShare.how='cancelled')}}
 const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},4000);return(window._lastShare.how='downloaded')}
async function shareSheet(s){const who=s.pg?whoName(s):'';return shareCanvas(sheetCanvas(s),fname(s),who?'Score sheet · '+who:'Score sheet',(who?who+' · ':'')+`${s.round} · ${s.pg&&window.pgTot?pgTot(s):total(s)}`)}
window.shareCanvas=shareCanvas;window.shareSlug=slug;

/* Competition complete (group card): white-background images (they are printed and posted), black text, gold bars, no emoji.
   Drawn from the stored competition record only (S.peel.comp), so the saved days are never read or changed here. Each archer's sheet
   carries that archer's own name (an under-16 by nickname only); the summary lists everyone, highest total first. */
const ctxt=(g,t,x,y,o={})=>txt(g,t,x,y,{c:'#111111',...o});
const CLINE='#cbd5e1',CMUT='#475569',CINK='#111111';
function cCanvas(H){const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');box(g,0,0,W,H,WHT);box(g,0,0,W,10,GOLD);ctxt(g,'ScoreTool',PAD,52,{s:30,w:800,c:CINK});return[c,g]}
function cDayTxt(c){return c.days.length==1?'One day only (Day '+c.days[0].no+')':'Day '+c.days.map(d=>d.no).join(' + Day ')}
function compSheetCanvas(c,ri){const r=c.rows[ri],nm=whoName({pg:1,abaHead:{name:r.nm}}),rowH=44,B=window.abaBlocks;
 const cols=d=>d.h.flatMap((o,h)=>B(o.t).map(bk=>({o,h,bk}))),rws=d=>{const cs=cols(d),R=[];for(let i=0;i<cs.length;i+=4)R.push(cs.slice(i,i+4));return R};
 const rowHt=rw=>60+rowH*(Math.max(...rw.map(x=>x.bk.to-x.bk.from+1))+1)+20,dayHt=d=>64+rws(d).reduce((t,rw)=>t+rowHt(rw),0)+16;
 const shot=r.days.filter(Boolean),top=290,H=top+56+56*c.days.length+90+shot.reduce((t,d)=>t+dayHt(d),0)+50,[cv,g]=cCanvas(H);
 ctxt(g,'Competition sheet',W-PAD,52,{s:26,c:CMUT,a:'right'});box(g,PAD,84,W-2*PAD,64,GOLD);ctxt(g,c.name,PAD+20,116,{s:28,w:800,c:BLK});
 ctxt(g,nm,PAD,184,{s:36,w:800,c:CINK});ctxt(g,cDayTxt(c),W-PAD,184,{s:26,c:CMUT,a:'right'});
 let y=top-40;box(g,PAD,y,W-2*PAD,56,'#f1f5f9',CLINE);ctxt(g,'Day',PAD+16,y+28,{s:22,w:800});ctxt(g,'First half',600,y+28,{s:22,w:800,a:'right'});ctxt(g,'Second half',810,y+28,{s:22,w:800,a:'right'});ctxt(g,'Day total',W-PAD-16,y+28,{s:22,w:800,a:'right'});y+=56;
 c.days.forEach((dd,q)=>{const d=r.days[q];box(g,PAD,y,W-2*PAD,56,null,CLINE);ctxt(g,'Day '+dd.no+(dd.date?' · '+dd.date:''),PAD+16,y+28,{s:24});
  if(d){ctxt(g,d.h[0]?d.h[0].tot:'',600,y+28,{s:26,a:'right'});ctxt(g,d.h[1]?d.h[1].tot:'',810,y+28,{s:26,a:'right'});ctxt(g,d.tot+(d.done?'':' (not finished: '+d.n+' targets)'),W-PAD-16,y+28,{s:d.done?28:22,w:800,a:'right'})}else ctxt(g,'not scored',W-PAD-16,y+28,{s:24,c:CMUT,a:'right'});y+=56});
 y+=14;ctxt(g,'COMPETITION TOTAL',PAD,y+34,{s:30,w:800});ctxt(g,r.tot,W-PAD,y+34,{s:48,w:800,a:'right'});y+=56;box(g,PAD,y,W-2*PAD,3,GOLD);y+=34;
 shot.forEach(d=>{const dd=c.days.find(x=>x.no==d.no);box(g,PAD,y,W-2*PAD,48,GOLD);ctxt(g,'Day '+d.no+(dd&&dd.date?' · '+dd.date:'')+' · '+d.tot,PAD+16,y+24,{s:26,w:800,c:BLK});y+=64;
  rws(d).forEach(rw=>{const cw=(W-2*PAD-3*12)/4;rw.forEach(({o,h,bk},ci)=>{const x=PAD+ci*(cw+12),q=bk.q,n=bk.to-bk.from+1;box(g,x,y,cw,60,'#f1f5f9',CLINE);ctxt(g,(d.h.length>1?(h?'Second half ':'First half '):'')+bk.from+'-'+bk.to,x+cw/2,y+30,{s:22,w:800,a:'center'});
    for(let j=0;j<n;j++){const t=q*10+j,v=o.v[t],yy=y+60+j*rowH;box(g,x,yy,cw,rowH,null,CLINE);ctxt(g,t+1,x+14,yy+rowH/2,{s:18,c:CMUT});if(v!=null)ctxt(g,v,x+cw-16,yy+rowH/2,{s:26,w:800,a:'right',c:CINK})}
    const ys=y+60+n*rowH;box(g,x,ys,cw,rowH,'#f1f5f9',CLINE);ctxt(g,bk.from+'-'+bk.to,x+14,ys+rowH/2,{s:18,c:CMUT});ctxt(g,o.sub[q],x+cw-16,ys+rowH/2,{s:26,w:800,a:'right'})});y+=rowHt(rw)});y+=16});
 return cv}
function compSummaryCanvas(c){const rows=c.rows.map((r,i)=>({r,i})).sort((a,b)=>b.r.tot-a.r.tot||a.i-b.i),n=c.days.length,rowH=60,H=300+rowH*(rows.length+1)+110,[cv,g]=cCanvas(H);
 ctxt(g,'Competition results',W-PAD,52,{s:26,c:CMUT,a:'right'});box(g,PAD,84,W-2*PAD,64,GOLD);ctxt(g,c.name,PAD+20,116,{s:28,w:800,c:BLK});ctxt(g,cDayTxt(c),PAD,184,{s:30,w:800,c:CINK});ctxt(g,'Group of '+rows.length,W-PAD,184,{s:26,c:CMUT,a:'right'});
 const dx=q=>480+(q+1)*Math.floor(360/n);let y=226;box(g,PAD,y,W-2*PAD,rowH,'#f1f5f9',CLINE);ctxt(g,'#',PAD+16,y+30,{s:22,w:800});ctxt(g,'Archer',PAD+70,y+30,{s:22,w:800});c.days.forEach((d,q)=>ctxt(g,'Day '+d.no,dx(q),y+30,{s:22,w:800,a:'right'}));ctxt(g,'Total',W-PAD-16,y+30,{s:22,w:800,a:'right'});y+=rowH;let pos=0,last=null;
 rows.forEach(({r},k)=>{if(r.tot!==last){pos=k+1;last=r.tot}box(g,PAD,y,W-2*PAD,rowH,null,CLINE);ctxt(g,pos,PAD+16,y+30,{s:24,c:CMUT});ctxt(g,whoName({pg:1,abaHead:{name:r.nm}}),PAD+70,y+30,{s:28,w:800});
  c.days.forEach((d,q)=>ctxt(g,r.days[q]?r.days[q].tot:'-',dx(q),y+30,{s:26,a:'right'}));ctxt(g,r.tot,W-PAD-16,y+30,{s:30,w:800,a:'right'});y+=rowH});
 box(g,PAD,y+18,W-2*PAD,3,GOLD);ctxt(g,'Scores for the group scored on this phone. Day totals are the ABA Interclub 3D round totals.',PAD,y+56,{s:20,c:CMUT});return cv}
window.compSheetCanvas=compSheetCanvas;window.compSummaryCanvas=compSummaryCanvas;
window.shareSheet=shareSheet;
})();
