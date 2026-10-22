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
function head(g,s,y,band,bandInk,sub){box(g,0,0,W,y+0,BG);txt(g,'🎯 ScoreTool',PAD,46,{s:30,w:800,c:GOLD});txt(g,'Score sheet',W-PAD,46,{s:26,c:MUT,a:'right'});
 box(g,PAD,84,W-2*PAD,64,band);txt(g,s.round.length>58?s.round.slice(0,56)+'…':s.round,PAD+20,116,{s:28,w:800,c:bandInk});
 txt(g,myName(),PAD,184,{s:34,w:800});txt(g,s.date||'',W-PAD,184,{s:28,c:MUT,a:'right'});if(sub)txt(g,sub,PAD,226,{s:24,c:MUT});return sub?256:216}
/* ABA: 4 columns like the paper sheet, running total restarting each 10-target block */
function drawABA(s){const R=ROUNDS[s.round]||{},HS=abaHalves(s),A=s.aba||[],hd=s.abaHead||{},rowH=54;
 const meta=[hd.noTyped&&hd.no?'ABA # '+hd.no:'',hd.grade?'Grade '+hd.grade:'',hd.div&&hd.div!='TBA'?'Division '+hd.div:'',s.abaClub?'Club rule: both halves 1 arrow':''].filter(Boolean).join(' · ');
 /* one column per 10-target block, 4 to a row, like the paper sheet */
 const cols=HS.flatMap((o,h)=>abaBlocks(o.H.t).map(bk=>({o,h,bk}))),rows=[];for(let i=0;i<cols.length;i+=4)rows.push(cols.slice(i,i+4));
 const rowHt=r=>60+rowH*(Math.max(...r.map(c=>c.bk.to-c.bk.from+1))+1)+24;
 const H=256+rows.reduce((t,r)=>t+rowHt(r),0)+40+64*(HS.length+1)+80,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');box(g,0,0,W,H,BG);
 let y=head(g,{...s,round:R.custom?s.round+' · 3D':'ABA Interclub 3D'},0,GOLD,BLK,meta||null);const cw=(W-2*PAD-3*12)/4;
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
const fname=s=>('scoretool-'+(s.date||'')+'-'+String(s.round||'sheet').replace(/[^A-Za-z0-9]+/g,'-').replace(/-+$/,'')).slice(0,80)+'.png';
async function shareSheet(s){const c=sheetCanvas(s),blob=await new Promise(r=>c.toBlob(r,'image/png'));if(!blob)return'error';const name=fname(s);let file=null;try{file=new File([blob],name,{type:'image/png'})}catch(e){}
 window._lastShare={size:blob.size,name};
 if(file&&navigator.canShare&&navigator.share&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'Score sheet',text:`${s.round} · ${total(s)}`});return(window._lastShare.how='shared')}catch(e){if(e&&e.name=='AbortError')return(window._lastShare.how='cancelled')}}
 const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(u);a.remove()},4000);return(window._lastShare.how='downloaded')}
window.shareSheet=shareSheet;
})();
