/* C16: Lingkana League format (11 Nov 2026, Nathe).
   Separate from the Onion Shed Challenge. Do not retune Onion Shed scoring, table or final.
   Name: Lingkana League. No field cap (80+). Shoot-up is the top 12. Host defaults to Nathe pending Q11. */
(function(){
/* TEST SANDBOX (/test/ only): a different code than the live LINGKN26 league, so this sandbox's
   registrations, groups and scores land on their own relay topic and never touch the real league's. */
const LK_CODE='LINGKNTEST';
const LK_NAME='Lingkana League (TEST)';
const LK_VENUE='Lingkana Archery range, 107 Robinson Ave, Belmont WA 6104';
const LK_HOURS='6:00 pm induction, shooting 6:30 pm to about 9:00 pm';
const LK_R='Lancaster 660';
const LK_DATES=['2026-11-18','2026-12-02','2026-12-16','2026-12-30','2027-01-13','2027-01-27','2027-02-10'];
const LK_NIGHTS=7;
const LK_CAP=0; /* no hard cap on entries; shoot-up stays the top 12 */
const LK_LANES=13; /* shooting targets on the range */
const LK_REG_CAP=LK_LANES*4; /* test phase: 52 archers in the whole league, not per night */
const LK_HOST='nathe';
/* Co-host for this trial. Same passcode as scorers. Not stripped from the archer list. */
const LK_COHOST_NAME='Nate Evans';
const LK_COHOST_ID='lkhost:nate';
const LK_COHOST_KEY='scoretool.lk.cohost';
/* Test URL on GitHub Pages. The live root app at /scoretool-demo/ is unchanged. */
const LK_PUBLIC_BASE='https://nfstride1-ux.github.io/scoretool-demo/test/';
const LK_REGISTER_HASH='#lk-register';
const LK_HOME_HASH='#lk-home';
/* Kept so older event QR codes that contain this text still open Lingkana. It does not gate registration. */
const LK_POSTER_CODE='lk-onion26';
/* Shared scoring passcode (25 Nov 2026). The passcode itself is not in this file. Login checks a salted PBKDF2-SHA-256 key
   (600,000 rounds, WebCrypto). Make new values with tools/lk_passhash.py. */
const LK_PASS_SALT='5090b49045ff5d44ba03cc0339b764d5';
const LK_PASS_DK='856ab847da18a7d3f82ed1603a2a2f7bb3d54bdf1d61cabafa24715653a27cdc';
const LK_PASS_ITER=600000;
/* Default scoring password hash (SHA-256 of salt + NUL + the default). Left on the record for older phones. Login does not read it. */
const LK_PW_SALT='c16go1a2';
const LK_PW_HASH='0b2b4ba61065596219e55c1d32631b22f19943d13a8f23ade80336cce4aacee1';
const LK_REG_KEY='scoretool.lk.reg';
const LK_MINE_KEY='scoretool.lk.mine'; /* reg ids this phone has registered or logged in as */
const LK_LOCK_KEY='scoretool.lk.pinlock'; /* wrong-PIN lockout, this phone only, never synced */
const LK_PIN_MAX=5;
const LK_PIN_LOCK_MS=60*1000;
const LK_FEE=10; /* entry fee used later by the pot display; the $25 range fee is separate and excluded */
/* One-time live wipe: drop test sign-ups and claims from before this moment so all 660 nights start empty for 18 Nov. Do not bump — other archers' later registrations must be kept. */
const LK_FRESH=1794881040000; /* 2026-11-17 10:04 Australia/Perth: wipe Ada Archer and the other test sign-ups. Do not bump again. */
/* One-time go-live clear for the first real night (Wed 18 Nov). A new key, so phones that already ran LK_FRESH run this once and then never again. Do not bump. */
const LK_CLEAR=1794903600000; /* 2026-11-17 16:20 Australia/Perth. Do not bump. A later key would drop sign-ups made after this version loads. */
const LK_HOST_REG_ID='lkhost:nathe';
const LK_HOST_REG_NAME='Nathaniel Stride';

/* Locked by Nathe 12 Nov 2026. Do not invent extras. Shown on the Lingkana rules page only. */
const LK_RULES=[
  'Name: Lingkana League. Venue: Lingkana Archery range, 107 Robinson Ave, Belmont WA 6104. Invite only.',
  'Dates: Wed 18 Nov, 2, 16 and 30 Dec, 13 and 27 Jan, shoot-up 10 Feb. Start 6:30pm, induction 6pm.',
  'Six nights of a 660 (60 arrows, 20 ends of 3, 18 m, 40 cm triangular 3-spot, X=11, max 660). Ranked on best 4 of 6, no minimum if a night is missed. Ties on 11s then 10s.',
  '$25 range plus $10 pot each night including night 7; pot paid 60/30/10.',
  'Groups of up to 4, one scorer. Value entry only. Scoring password for host and scorers only, not on the poster or share link.',
  'Night 7: 150 warm-up is not scored, then a ladder shoot-up for the top 12 (#12 v #11, winner moves up).'
];
function lkRulesHTML(){
  return`<p class="small muted">${h(LK_VENUE)}</p><ul>${LK_RULES.map(x=>`<li>${h(x)}</li>`).join('')}</ul>`;
}



const h=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const lkIs=lg=>!!(lg&&(lg.format==='lingkana'||lg.code===LK_CODE));
const lkNights=lg=>lkIs(lg)?LK_NIGHTS:6;
const lkRound=(lg,w)=>lkIs(lg)&&(+w||0)>=1&&(+w||0)<=6?LK_R:null;
const lkNight7=w=>+w===7;
const lkDate=(lg,w)=>(lg&&lg.weeks&&lg.weeks[w-1])||LK_DATES[w-1]||'';
const lkLabel=w=>w===7?'Shoot-up (top 12)':'Lancaster 660';
const lkFmtD=d=>{if(!d)return'';const x=new Date(d+'T00:00:00');return x.toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'Australia/Perth'})};

function lkRecord(){
  return{code:LK_CODE,name:LK_NAME,format:'lingkana',host:LK_HOST,venue:LK_VENUE,hours:LK_HOURS,
    order:[],weeks:LK_DATES.slice(),wt:Date.now(),cw:1,cwt:0,grp:{},gn:{},sc:{},reg:{},status:'active',
    created:Date.now(),preset:1,inviteOnly:true,
    pwSalt:LK_PW_SALT,pwHash:LK_PW_HASH,pwt:1};
}

function lkEnsure(){
  if(typeof S==='undefined'||!S)return null;
  const L=S.leagues=S.leagues||[];
  let lg=L.find(lkIs);
  if(!lg){lg=lkRecord();L.push(lg);if(typeof save==='function')save()}
  if(lg.name==='Lingkana Indoor League')lg.name=LK_NAME;
  if('cap' in lg)delete lg.cap;
  if(!lg.pwHash){lg.pwSalt=LK_PW_SALT;lg.pwHash=LK_PW_HASH;lg.pwt=lg.pwt||1}
  lkFresh(lg);
  if(typeof lkPullReg==='function')lkPullReg(lg);
  lkStripHostEntries(lg);
  lkDropHostIfUnregistered(lg);
  return lg;
}
/* A phone that has already cleared ignores a sign-up whose own time is before the cut.
   A message sent after the cut still counts when the registration itself was made after the cut.
   A row with no time is left for the message-time check. */
function lkRegKept(lg, at){
  if(!lg||(+lg.clear||0)<LK_CLEAR)return true;
  if(!(+at))return true;
  return +at>=LK_CLEAR;
}
function lkClearLive(lg){
  if(!lg||!lkIs(lg)||(+lg.clear||0)>=LK_CLEAR)return false;
  lg.sc={};lg.reg={};lg.claim={};lg.claimt=0;lg.gn={};lg.paid={};lg.paidt=0;lg.grp={};lg.inv=[];
  lg.drop={};lg.pins={};lg.order=[];lg.fin=null;lg.fint=0;
  lg.clear=LK_CLEAR;lg.fresh=Math.max(+lg.fresh||0,LK_CLEAR);lg.dirty=1;lg.since=null;lg.posted=0;lg.wt=Date.now();
  try{
    localStorage.removeItem(LK_REG_KEY);
    localStorage.removeItem(LK_MINE_KEY);
    localStorage.removeItem(LK_LOCK_KEY);
  }catch(e){}
  try{
    if(typeof S!=='undefined'&&S&&Array.isArray(S.sessions)){
      S.sessions=S.sessions.filter(s=>!(s&&(s.league===LK_CODE||String(s.id||'').indexOf('lg-'+LK_CODE)===0)));
    }
  }catch(e){}
  if(typeof save==='function')save();
  return true;
}
function lkFresh(lg){
  if(!lg||!lkIs(lg))return lg;
  lkClearLive(lg);
  if((lg.fresh||0)<LK_FRESH){
    /* Test sign-ups from before the cutoff go. A registration made after it stays, including the host signing himself up. */
    const keep={};
    for(const night of Object.keys(lg.reg||{})){
      const rows=(lg.reg[night]||[]).filter(r=>r&&(+r.at||0)>=LK_FRESH&&!lkIsHostAccount(r.id));
      if(rows.length)keep[night]=rows;
    }
    const ids=new Set();
    Object.values(keep).forEach(list=>list.forEach(r=>{if(r&&r.id)ids.add(r.id)}));
    const gn={};
    ids.forEach(id=>{if(lg.gn&&lg.gn[id])gn[id]=lg.gn[id]});
    lg.sc={};lg.reg=keep;lg.claim={};lg.claimt=0;lg.gn=gn;lg.paid={};lg.paidt=0;lg.grp={};lg.inv=[];
    lg.order=(lg.order||[]).filter(id=>ids.has(id));
    lg.drop={};
    lg.fresh=LK_FRESH;lg.dirty=1;lg.since=null;lg.posted=0;
    try{
      const box=lkRegInbox().filter(r=>r&&(+r.at||0)>=LK_FRESH&&!lkIsHostAccount(r.id));
      if(box.length)localStorage.setItem(LK_REG_KEY,JSON.stringify(box));
      else localStorage.removeItem(LK_REG_KEY);
    }catch(e){}
    if(typeof save==='function')save();
  }
  lkSeedHost(lg);
  lkSeedCoHost(lg);
  lkDropHostIfUnregistered(lg);
  return lg;
}
function lkIsHostRegName(name){
  const n=lkCleanName(name||'').toLowerCase();
  return n==='nathaniel stride'||n==='nathe';
}
function lkHostRegRow(r){
  if(!r||lkIsHostAccount(r.id))return false;
  if(String(r.id||'')===LK_HOST_REG_ID)return true;
  return lkIsHostRegName(r.name||'');
}
/* Nathaniel Stride stays on every shoot night, the same way Nate Evans does. The go-live clear cannot drop him. */
function lkSeedHost(lg){
  if(!lg||!lkIs(lg))return false;
  let ch=false;
  lg.reg=lg.reg||{};lg.gn=lg.gn||{};lg.order=lg.order||[];lg.drop=lg.drop||{};
  const nights=LK_DATES.slice(0,6);
  for(const id of Object.keys(lg.drop)){
    const n=(lg.drop[id]&&lg.drop[id].n)||'';
    if(id===LK_HOST_REG_ID||lkIsHostRegName(n)){delete lg.drop[id];ch=true}
  }
  const seen=[];
  nights.forEach(night=>{(lg.reg[night]||[]).forEach(r=>{if(lkHostRegRow(r))seen.push(r)})});
  let canon=LK_HOST_REG_ID, at=LK_CLEAR, bow='', email='', phone='';
  const self=seen.filter(r=>r.id&&String(r.id)!==LK_HOST_REG_ID&&lkIsHostRegName(r.name||''));
  const pick=self.slice().sort((a,b)=>(+b.at||0)-(+a.at||0))[0]||seen.slice().sort((a,b)=>(+b.at||0)-(+a.at||0))[0];
  if(pick&&pick.id&&lkIsHostRegName(pick.name||'')&&!lkIsHostAccount(pick.id))canon=String(pick.id);
  if(pick){at=+pick.at||at;bow=pick.bow||'';email=pick.email||'';phone=pick.phone||''}
  if(lkIsHostAccount(canon))canon=LK_HOST_REG_ID;
  if(!lg.order.includes(canon)){lg.order.push(canon);ch=true}
  const dropIds=new Set(seen.map(r=>String(r.id||'')).filter(id=>id&&id!==canon));
  dropIds.forEach(id=>{
    if(lg.order.includes(id)){lg.order=lg.order.filter(x=>x!==id);ch=true}
    if(lg.gn[id]){delete lg.gn[id];ch=true}
  });
  if(!lg.gn[canon]||lg.gn[canon].n!==LK_HOST_REG_NAME){
    const prev=lg.gn[canon]||{};
    lg.gn[canon]={n:LK_HOST_REG_NAME,j:prev.j?1:0,t:prev.t||at,by:prev.by||'organiser'};
    ch=true;
  }
  nights.forEach(night=>{
    const rows=(lg.reg[night]||[]).slice();
    const mine=rows.filter(lkHostRegRow);
    const rest=rows.filter(r=>!lkHostRegRow(r));
    const keep=mine.find(r=>String(r.id)===canon)||mine[0]||null;
    if(mine.length===1&&keep&&String(keep.id)===canon&&keep.name===LK_HOST_REG_NAME){
      if(!keep.organiser){keep.organiser=1;ch=true}
      return;
    }
    const row={id:canon,name:LK_HOST_REG_NAME,at:(keep&&+keep.at)||at||LK_CLEAR,bow:(keep&&keep.bow)||bow||'',email:(keep&&keep.email)||email||'',phone:(keep&&keep.phone)||phone||'',organiser:1};
    lg.reg[night]=rest.concat([row]);
    ch=true;
  });
  if(ch){lg.dirty=1;if(typeof save==='function')save()}
  return ch;
}
/* Nathe (account id nathe, or the archer registered as Nathaniel Stride) and co-host Nate Evans.
   The minimum of two archers does not apply when the paid list is only these organisers. */
function lkIsNatheArcher(id,name){
  if(lkIsHostAccount(id))return true;
  const n=lkCleanName(name||'').toLowerCase();
  return n==='nathaniel stride'||n==='nathe';
}
function lkIsOrganiser(id,name){
  if(lkIsNatheArcher(id,name))return true;
  if(id&&(String(id)===LK_COHOST_ID||String(id)==='lkhost:nate'))return true;
  return lkIsCoHostName(name||'');
}
function lkArcherName(lg,id){
  const who=String(id||'');
  if(!who)return '';
  const gn=lg&&lg.gn&&lg.gn[who]&&lg.gn[who].n;
  if(gn)return gn;
  if(lg&&lg.reg){
    for(const night of Object.keys(lg.reg)){
      const row=(lg.reg[night]||[]).find(r=>r&&String(r.id)===who);
      if(row&&row.name)return row.name;
    }
  }
  if(who===LK_COHOST_ID||who==='lkhost:nate')return LK_COHOST_NAME;
  if(typeof lgName==='function'){
    const n=lgName(who);
    if(n&&n!==who)return n;
  }
  return '';
}
function lkGroupAllOrganisers(lg,ids){
  const g=(ids||[]).filter(Boolean);
  return !!g.length&&g.every(id=>lkIsOrganiser(id,lkArcherName(lg,id)));
}
function lkCoHostRow(r){
  if(!r)return false;
  if(r.id&&(String(r.id)===LK_COHOST_ID||String(r.id)==='lkhost:nate'))return true;
  return lkIsCoHostName(r.name||'');
}
/* Nate Evans is an organiser on every shoot night. The 17 Nov wipe and a later snapshot cannot drop him.
   A registration he makes himself under the same name is the one row: this does not add a second. */
function lkSeedCoHost(lg){
  if(!lg||!lkIs(lg))return false;
  let ch=false;
  lg.reg=lg.reg||{};lg.gn=lg.gn||{};lg.order=lg.order||[];lg.drop=lg.drop||{};
  const nights=LK_DATES.slice(0,6);
  for(const id of Object.keys(lg.drop)){
    const n=(lg.drop[id]&&lg.drop[id].n)||(lg.gn[id]&&lg.gn[id].n)||'';
    if(id===LK_COHOST_ID||id==='lkhost:nate'||lkIsCoHostName(n)){delete lg.drop[id];ch=true}
  }
  const seen=[];
  nights.forEach(night=>{(lg.reg[night]||[]).forEach(r=>{if(lkCoHostRow(r))seen.push(r)})});
  let canon=LK_COHOST_ID, at=LK_FRESH, bow='', email='', phone='';
  const self=seen.filter(r=>r.id&&String(r.id)!==LK_COHOST_ID&&String(r.id)!=='lkhost:nate'&&lkIsCoHostName(r.name||''));
  const pick=self.slice().sort((a,b)=>(+b.at||0)-(+a.at||0))[0]||seen.slice().sort((a,b)=>(+b.at||0)-(+a.at||0))[0];
  if(pick&&pick.id&&lkIsCoHostName(pick.name||''))canon=String(pick.id);
  if(pick){at=+pick.at||at;bow=pick.bow||'';email=pick.email||'';phone=pick.phone||''}
  if(!lg.order.includes(canon)){lg.order.push(canon);ch=true}
  const dropIds=new Set(seen.map(r=>String(r.id||'')).filter(id=>id&&id!==canon));
  dropIds.forEach(id=>{
    if(!(id===LK_COHOST_ID||id==='lkhost:nate'||lkIsCoHostName((lg.gn[id]&&lg.gn[id].n)||'')))return;
    if(lg.order.includes(id)){lg.order=lg.order.filter(x=>x!==id);ch=true}
    if(lg.gn[id]){delete lg.gn[id];ch=true}
  });
  if(!lg.gn[canon]||lg.gn[canon].n!==LK_COHOST_NAME){
    const prev=lg.gn[canon]||{};
    lg.gn[canon]={n:LK_COHOST_NAME,j:prev.j?1:0,t:prev.t||at,by:prev.by||'organiser'};
    ch=true;
  }
  nights.forEach(night=>{
    const rows=(lg.reg[night]||[]).slice();
    const mine=rows.filter(lkCoHostRow);
    const rest=rows.filter(r=>!lkCoHostRow(r));
    const keep=mine.find(r=>String(r.id)===canon)||mine[0]||null;
    if(mine.length===1&&keep&&String(keep.id)===canon&&keep.name===LK_COHOST_NAME){
      if(!keep.organiser){keep.organiser=1;ch=true}
      return;
    }
    const row={id:canon,name:LK_COHOST_NAME,at:(keep&&+keep.at)||at||LK_FRESH,bow:(keep&&keep.bow)||bow||'',email:(keep&&keep.email)||email||'',phone:(keep&&keep.phone)||phone||'',organiser:1};
    lg.reg[night]=rest.concat([row]);
    ch=true;
  });
  if(lg.paid){
    for(const night of Object.keys(lg.paid)){
      const bag=lg.paid[night]||{};
      dropIds.forEach(id=>{if(bag[id]){if(!bag[canon])bag[canon]=bag[id];delete bag[id];ch=true}});
    }
  }
  if(ch){lg.dirty=1;if(typeof save==='function')save()}
  return ch;
}
/* The host account id is not an archer row. The name Nathaniel Stride is a real registration when he signs himself up. */
function lkIsHostAccount(id){
  return !!(id&&(id===LK_HOST||id==='nathe'));
}
function lkIsHostPerson(id,name){
  return lkIsHostAccount(id);
}
/* The host stays host (password, host tools) even when not on the registered list. Drop them from order unless they have a non-host sign-up or a score. */
function lkDropHostIfUnregistered(lg){
  if(!lg||!lkIs(lg))return lg;
  const host=lg.host||LK_HOST;
  const hasReg=Object.values(lg.reg||{}).some(list=>Array.isArray(list)&&list.some(r=>r&&!lkIsHostPerson(r.id,r.name)&&(r.id===host)));
  const hasSc=!!(lg.sc&&lg.sc[host]&&Object.keys(lg.sc[host]).length);
  if(hasReg||hasSc)return lg;
  const next=(lg.order||[]).filter(id=>id!==host&&id!=='nathe');
  if(next.length!==(lg.order||[]).length){
    lg.order=next;
    if(typeof save==='function')save();
  }
  return lg;
}
/* Clear the host's personal/test identity from the event-league register and known-name list only. Does not bump LK_FRESH or wipe other archers. */
function lkStripHostEntries(lg){
  if(!lg||!lkIs(lg))return lg;
  let ch=false;
  const next=(lg.order||[]).filter(id=>{
    const n=(lg.gn&&lg.gn[id]&&lg.gn[id].n)||'';
    return !lkIsHostPerson(id,n);
  });
  if(next.length!==(lg.order||[]).length){lg.order=next;ch=true}
  if(lg.gn){
    for(const id of Object.keys(lg.gn)){
      if(lkIsHostPerson(id,(lg.gn[id]&&lg.gn[id].n)||'')){delete lg.gn[id];ch=true}
    }
  }
  if(lg.reg){
    for(const night of Object.keys(lg.reg)){
      const L=(lg.reg[night]||[]).filter(r=>r&&!lkIsHostPerson(r.id,r.name));
      if(L.length!==(lg.reg[night]||[]).length){lg.reg[night]=L;ch=true}
    }
  }
  if(lg.claim){
    for(const night of Object.keys(lg.claim)){
      const bag=lg.claim[night]||{};
      for(const id of Object.keys(bag)){
        if(lkIsHostPerson(id,(bag[id]&&bag[id].name)||'')){delete bag[id];ch=true}
      }
    }
  }
  if(ch&&typeof save==='function')save();
  return lg;
}
function lkSeed(){/* do not auto-insert a league record into existing tester lists; the card offers Open */return}

function lkDecorateCard(){
  /* 12 Nov 2026: Lingkana is already one flyer card in the league list. Do not add a second row. */
  return;
}

function lkGet(){return (typeof lgGet==='function'&&lgGet(LK_CODE))||((typeof S!=='undefined'&&S.leagues)||[]).find(lkIs)||null}


function lkIsMember(lg,id){return!!(lg&&id&&((lg.order||[]).includes(id)||(lg.inv||[]).includes(id)))}
function lkJoinGuard(code,me){
  const c=String(code||'').toUpperCase();
  const lg=(typeof lgGet==='function'&&lgGet(c))||(c===LK_CODE?lkGet():null);
  const isLk=c===LK_CODE||(lg&&lkIs(lg))||(lg&&lg.inviteOnly);
  if(!isLk)return null;
  if(lkIsMember(lg,me))return null; /* already invited or in; existing join flow may open the view */
  return 'This league is invite only. Ask the host to invite you, or use the register page with the invite code printed on the poster.';
}
function lkIsCoHostName(name){
  return lkCleanName(name).toLowerCase()===LK_COHOST_NAME.toLowerCase();
}
function lkCoHostOn(){
  try{return sessionStorage.getItem(LK_COHOST_KEY)==='nate'}catch(e){return false}
}
function lkMarkCoHost(on){
  try{if(on)sessionStorage.setItem(LK_COHOST_KEY,'nate');else sessionStorage.removeItem(LK_COHOST_KEY)}catch(e){}
}
function lkCanHost(lg){
  if(lg&&lkCoHostOn())return true;
  const me=typeof h2hMe==='function'?h2hMe():'';
  return!!(lg&&(lg.host===me||me==='nathe'||(typeof lgCanEd==='function'&&lgCanEd(lg))));
}
function lkInvite(id){
  const lg=lkEnsure();if(!lg)return 'The league is not on this phone yet.';
  if(!lkCanHost(lg))return 'Only the host can invite archers.';
  const who=String(id||'').trim();if(!who)return 'Pick someone to invite.';
  if((lg.order||[]).includes(who))return lgName?lgName(who)+' is already in this league.': 'Already in this league.';
  lg.inv=lg.inv||[];
  if(!lg.inv.includes(who))lg.inv.push(who);
  if(typeof save==='function')save();
  if(typeof h2hPost==='function'&&typeof h2hInbox==='function'&&typeof h2hNm==='function'){
    try{h2hPost(h2hInbox(who),{k:'lginv',code:lg.code,name:lg.name,from:h2hMe(),to:who,...h2hNm(),t:Date.now(),inviteOnly:1})}catch(e){}
  }
  return '';
}
function lkAccept(){
  const lg=lkEnsure(),me=typeof h2hMe==='function'?h2hMe():'';if(!lg||!me)return 'No league on this phone.';
  if(!((lg.inv||[]).includes(me)))return 'You have not been invited to this league.';
  lg.order=lg.order||[];
  if(!lg.order.includes(me))lg.order.push(me);
  lg.inv=(lg.inv||[]).filter(x=>x!==me);
  if(typeof save==='function')save();
  return '';
}
function lkAddGuest(name,jr){
  const lg=lkEnsure();if(!lg)return 'The league is not on this phone yet.';
  if(typeof lgAddGuest==='function')return lgAddGuest(lg.code,name,jr);
  return 'Cannot add a guest on this phone.';
}

function lkView(code){
  const lg=(typeof lgGet==='function'&&lgGet(code))||lkGet();
  if(!lg||!lkIs(lg))return;
  window._lgv=code||lg.code;cur=null;
  if($('#tabs'))$('#tabs').hidden=false;
  const me=typeof h2hMe==='function'?h2hMe():'';
  const w=lgWeek(lg),n=lkNights(lg);
  const days=LK_DATES.map((d,i)=>{
    const nite=i+1,on=w===nite,rd=lkLabel(nite);
    return`<li class="lk-night${on?' on':''}" data-lkn="${nite}"><b>Night ${nite}</b> · ${h(lkFmtD(d))} · ${h(rd)}${on?' <span class="lk-now">Current</span>':''}</li>`;
  }).join('');
  const closed660=w>=7;
  const n7=w===7?`<div class="card" id="lkn7"><span class="kicker">Night 7 · ${h(lkFmtD(LK_DATES[6]))}</span><h3>Shoot-up · top 12</h3>
    <p>The sixth Lancaster 660 was on ${h(lkFmtD(LK_DATES[5]))}. Night 7 starts with a 150 warm-up (not scored), then the ladder shoot-up for the top 12 (#12 v #11, the winner v #10, and so on to #1). The ladder will open closer to 10 Feb and is not built yet.</p></div>`:'';
  const score660=!closed660?`<p class="small muted">Night ${w} is a Lancaster 660 (20 ends of 3, X = 11, max 660) on a triangular 40 cm 3-spot. Values only: no plot face.</p>
    <p class="small muted">${h(LK_HOURS)}.</p>`:`<p class="small muted">The 660 nights are finished. Night 7 is the top-12 shoot-up (ladder not open yet).</p>`;
  const inList=(lg.order||[]).includes(me), invited=(lg.inv||[]).includes(me);
  const acceptUI=(!inList&&invited)?`<div class="card" id="lkaccept"><p>You have been invited to this league.</p><button class="btn alt" id="lkacc">Join this league</button><p class="small" id="lkaccmsg" role="alert"></p></div>`:'';
  const testers=(typeof TESTERS!=='undefined'?TESTERS:[]).filter(t=>t.id!==me&&t.id!==lg.host&&!(lg.order||[]).includes(t.id));
  const hostUI=lkCanHost(lg)?`<div class="card" id="lkhost"><span class="kicker">Host</span><h3>Invite or add a shooter</h3>
    <p class="small muted">Invite someone who uses ScoreTool, or add a name-only shooter you will score on this phone. Nobody can join with the league code alone.</p>
    <label for="lkivid">Invite an archer</label>
    <div class="row" style="gap:6px"><select id="lkivid" style="flex:1">${testers.map(t=>`<option value="${h(t.id)}">${h(t.name||t.id)}</option>`).join('')||'<option value="">No one left to invite</option>'}</select>
    <button class="btn alt" id="lkivgo">Invite</button></div>
    <p class="small" id="lkivmsg" role="alert"></p>
    <label for="lkgname" style="margin-top:8px">Add a name-only shooter</label>
    <input id="lkgname" maxlength="24" autocomplete="off" placeholder="Name">
    <label class="h2htk" style="margin-top:6px"><input type="checkbox" id="lkgjr"> Under 16 (nickname only)</label>
    <button class="btn alt" id="lkgadd" style="margin-top:6px">Add</button>
    <p class="small" id="lkgmsg" role="alert"></p>
    <p class="small muted">In the league: ${(lg.order||[]).length} archer${(lg.order||[]).length===1?'':'s'}.</p>
    <p class="small muted" style="margin-top:8px">Registration link: <a id="lkregurl" href="${h(lkRegisterUrl())}">${h(lkRegisterUrl())}</a>. The QR on that page is the one to print.</p>
    </div>`:'';
  app.innerHTML=`<div class="card" id="lgview" data-lk="1"><span class="kicker">Invite-only league</span>
    <h1>${h(lg.name)}</h1>
    <p class="small" style="margin:0">${h(LK_VENUE)}</p>
    <p class="small muted" style="margin:4px 0 0">${h(LK_HOURS)}</p>
    <p class="small muted" style="margin:4px 0 0">No field cap · shoot-up is the top 12 · off-bow scores, no age or bow-type divisions in this first pot.</p>
    <ol class="lk-dates" style="padding-left:1.2em;margin:10px 0 0">${days}</ol>
    ${score660}</div>${n7}
    ${lkTableHTML(lg)}${lkPotHTML(lg)}${lkPwHTML(lg)}${lkGroupHTML(lg)}
    <p class="row" style="gap:6px;flex-wrap:wrap"><button class="btn alt" id="lkregopen">Register for a shoot night</button>
    <button class="btn alt" id="lkresultsgo">Print or share results</button></p>
    ${hostUI}${acceptUI}
    <p class="small muted" style="margin:8px 4px">This league is invite only. The eight-character code does not let someone join unless they have already been invited. Onion Shed Challenge stays a separate six-300 league, and its code-join is unchanged.</p>
    <p><button class="btn ghost" id="lgback">Back to leagues</button></p>`;
  if($('#lgback'))$('#lgback').onclick=()=>{window._lgv=null;nav(view==='lab_leagues'?'lab_leagues':'score')};
  if($('#lkregopen'))$('#lkregopen').onclick=()=>{try{history.replaceState(null,'',location.pathname+location.search+LK_REGISTER_HASH)}catch(e){}lkRegisterView()};
  if($('#lkacc'))$('#lkacc').onclick=()=>{const m=lkAccept();if(m){const e=$('#lkaccmsg');if(e)e.textContent=m;return}lkView(lg.code)};
  if($('#lkivgo'))$('#lkivgo').onclick=()=>{const m=lkInvite(($('#lkivid')||{}).value);const e=$('#lkivmsg');if(e)e.textContent=m||'Invited.';if(!m)lkView(lg.code)};
  if($('#lkgadd'))$('#lkgadd').onclick=()=>{const m=lkAddGuest(($('#lkgname')||{}).value,!!(($('#lkgjr')||{}).checked));const e=$('#lkgmsg');if(e)e.textContent=m||'Added.';if(!m)lkView(lg.code)};
  if($('#lkpotnight'))$('#lkpotnight').onchange=()=>{window._lkPotNight=+$('#lkpotnight').value;lkView(lg.code)};
  document.querySelectorAll('[data-lkpaid]').forEach(box=>box.onchange=()=>{const nw=+(window._lkPotNight||Math.min(LK_NIGHTS,lgWeek(lg)||1));const m=lkSetPaid(box.getAttribute('data-lkpaid'),lkNightKey(lg,nw),box.checked);if(m){box.checked=!box.checked;return}lkView(lg.code)});
  if($('#lkpwsave'))$('#lkpwsave').onclick=()=>{lkSetPassword(($('#lkpwnew')||{}).value).then(m=>{const e=$('#lkpwsetmsg');if(e)e.textContent=m||'Password saved.';if(!m){const i=$('#lkpwnew');if(i)i.value=''}})};
  if($('#lkaddg'))$('#lkaddg').onclick=()=>{const m=lkAddToGroup(Math.min(6,lgWeek(lg)),+(($('#lkpickg')||{}).value||0),(($('#lkpick')||{}).value||''));const e=$('#lkgrpmsg');if(e)e.textContent=m||'Added.';if(!m)lkView(lg.code)};
  document.querySelectorAll('[data-lkscore]').forEach(b=>b.onclick=()=>{const m=lkScoreGroup(Math.min(6,lgWeek(lg)),+b.getAttribute('data-lkscore'));const e=$('#lkgrpmsg');if(e&&m)e.textContent=m});
  if($('#lkpickq'))$('#lkpickq').oninput=()=>{const q=(($('#lkpickq')||{}).value||'').toLowerCase();document.querySelectorAll('#lkpick option').forEach(o=>{o.hidden=!!q&&!o.textContent.toLowerCase().includes(q)})};
  if($('#lkresultsgo'))$('#lkresultsgo').onclick=()=>{const w=Math.min(6,typeof lgWeek==='function'?lgWeek(lg):1);window._lkResNight=w;try{history.replaceState(null,'',location.pathname+location.search+'#lk-results&n='+w)}catch(e){}lkResultsView(w)};
  lkBindStandUI(lg);

}


function lkEventHomeUrl(){
  const base=String(window.LK_PUBLIC_BASE||LK_PUBLIC_BASE||'').replace(/\/?$/,'/');
  return base+(window.LK_HOME_HASH||LK_HOME_HASH||'#lk-home');
}
function lkRegisterUrl(){
  /* Direct registration link. Sharing this link, and the printed QR of it, is what limits who registers. */
  const base=String(window.LK_PUBLIC_BASE||LK_PUBLIC_BASE||'').replace(/\/?$/,'/');
  return base+'lk-register.html';
}
function lkQrSvg(text){
  try{
    if(typeof qrcode!=='function')return '';
    const qr=qrcode(0,'M');
    qr.addData(String(text||''));
    qr.make();
    return qr.createSvgTag({cellSize:4,margin:2,scalable:true});
  }catch(e){return ''}
}
function lkNormPoster(s){return String(s||'').toUpperCase().replace(/\s+/g,'').replace(/^#/,'')}
function lkPosterOk(code){return lkNormPoster(code)===lkNormPoster(window.LK_POSTER_CODE||LK_POSTER_CODE)}
function lkHashName(){
  return String(location.hash||'').replace(/^#/,'').split('?')[0].split('&')[0];
}
function lkIsRegHash(){
  const raw=lkHashName();
  const q=new URLSearchParams(location.search);
  return raw==='lk-register'||q.get('page')==='lk-register';
}
function lkIsHomeHash(){
  const raw=lkHashName();
  const q=new URLSearchParams(location.search);
  return raw==='lk-home'||raw==='lingkana'||q.get('page')==='lk-home'||q.get('page')==='lingkana';
}
function lkDeviceRegistered(){
  try{return (lkRegInbox()||[]).some(r=>r&&(r.league===LK_CODE||r.poster||r.name))}catch(e){return false}
}
function lkAlreadyRegistered(opts){
  opts=opts||{};
  const id=opts.id||null;
  const name=lkCleanName(opts.name||'');
  if(lkDeviceRegistered()&&(id||name)){
    const box=lkRegInbox()||[];
    if(box.some(r=>r&&((id&&r.id===id)||(name&&lkCleanName(r.name).toLowerCase()===name.toLowerCase()))))return true;
  }
  const lg=lkGet()||(typeof lkEnsure==='function'&&lkEnsure())||null;
  const known=typeof lkKnownRegistrants==='function'?lkKnownRegistrants(lg):[];
  if(known.some(a=>(id&&a.id===id)||(name&&lkCleanName(a.name).toLowerCase()===name.toLowerCase())))return true;
  if(lg&&lg.reg){
    for(const night of Object.keys(lg.reg)){
      const L=lg.reg[night]||[];
      if(L.some(r=>r&&((id&&r.id===id)||(name&&lkCleanName(r.name).toLowerCase()===name.toLowerCase()))))return true;
    }
  }
  return false;
}
function lkRegInbox(){try{const v=JSON.parse(localStorage.getItem(LK_REG_KEY)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
function lkRegSame(a,b){const league=x=>String((x&&x.league)||LK_CODE);
 return !!a&&!!b&&lkCleanName(a.name).toLowerCase()===lkCleanName(b.name).toLowerCase()&&String(a.night||'')===String(b.night||'')&&league(a)===league(b)}
/* Same name (trimmed, case-insensitive) + night + league updates the first match in place.
   Older extra copies of that same key are left in the list. Nothing is deleted. */
function lkRegPush(rec){const box=lkRegInbox();const i=box.findIndex(r=>lkRegSame(r,rec));let stored;
 if(i>=0){const prev=box[i]||{};stored=Object.assign({},prev,rec,{id:rec.id||prev.id,at:rec.at||Date.now()});box[i]=stored}
 else{stored=rec;box.push(rec)}
 try{localStorage.setItem(LK_REG_KEY,JSON.stringify(box))}catch(e){}
 return {box,stored}}
function lkCleanName(raw){
  let n=String(raw||'').trim();
  if(typeof nmClean==='function')n=nmClean(n);
  return n.slice(0,24);
}
function lkFindArcher(lg,name){
  const n=lkCleanName(name).toLowerCase();if(!n||!lg)return null;
  for(const id of (lg.order||[])){
    const nm=(typeof lgName==='function'?lgName(id):((lg.gn||{})[id]&&(lg.gn||{})[id].n)||id);
    if(String(nm||'').toLowerCase()===n)return id;
  }
  return null;
}
function lkNewGuestId(lg){
  const L='abcdefghjkmnpqrstuvwxyz23456789';
  const rnd=()=>{try{return Array.from(crypto.getRandomValues(new Uint32Array(6)),x=>L[x%L.length]).join('')}catch(e){return Math.random().toString(36).slice(2,8)}};
  let id;do{id='g'+rnd()}while(((lg&&lg.order)||[]).includes(id));
  return id;
}
function lkRegClosed(lg,name,id){
  const known=lkKnownRegistrants(lg);
  const key=lkCleanName(name).toLowerCase();
  const exists=known.some(a=>(id&&a.id===id)||lkCleanName(a.name).toLowerCase()===key);
  if(exists||known.length<LK_REG_CAP)return '';
  return 'This league already has 52 archers. Registration is closed.';
}
function lkShootDates(lg){
  const src=(lg&&Array.isArray(lg.weeks)&&lg.weeks.filter(Boolean).length)?lg.weeks:LK_DATES;
  return src.filter(d=>LK_DATES.indexOf(d)>=0&&LK_DATES.indexOf(d)<6).slice(0,6);
}
function lkMineIds(){
  try{
    const v=JSON.parse(localStorage.getItem(LK_MINE_KEY)||'[]');
    if(!Array.isArray(v))return [];
    return [...new Set(v.map(x=>String((x&&x.id)||x||'')).filter(Boolean))];
  }catch(e){return []}
}
function lkRememberArcher(id){
  const who=String(id||'').trim();
  if(!who||who==='nathe')return;
  const ids=lkMineIds();
  if(ids.includes(who))return;
  ids.push(who);
  try{localStorage.setItem(LK_MINE_KEY,JSON.stringify(ids))}catch(e){}
}
function lkHostPhone(lg){
  const me=typeof h2hMe==='function'?h2hMe():'';
  if(me&&(me==='nathe'||me===LK_HOST||(lg&&me===lg.host)))return true;
  if(typeof lkCoHostOn==='function'&&lkCoHostOn())return true;
  return false;
}
function lkPinSalt(){
  const L='abcdefghjkmnpqrstuvwxyz23456789';
  try{return Array.from(crypto.getRandomValues(new Uint8Array(8)),x=>L[x%L.length]).join('')}
  catch(e){return Math.random().toString(36).slice(2,10)}
}
/* Salted hash only. The plain PIN is never written to the registration, the inbox, or the relay. */
async function lkPinHash(name,pin,salt){
  const enc=new TextEncoder();
  const raw=lkCleanName(name).toLowerCase()+'\0'+String(pin)+'\0'+String(salt||'');
  const buf=await crypto.subtle.digest('SHA-256',enc.encode(raw));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function lkPinOk(name,pin,salt,hash){
  if(!hash||!salt||!/^\d{4}$/.test(String(pin||'')))return false;
  return (await lkPinHash(name,pin,salt))===hash;
}
function lkPinLockBag(){
  try{const v=JSON.parse(localStorage.getItem(LK_LOCK_KEY)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch(e){return{}}
}
function lkPinSaveLock(bag){try{localStorage.setItem(LK_LOCK_KEY,JSON.stringify(bag))}catch(e){}}
function lkPinLocked(id){
  const bag=lkPinLockBag(),row=bag[id];
  if(!row||!row.until)return 0;
  const left=+row.until-Date.now();
  if(left<=0){delete bag[id];lkPinSaveLock(bag);return 0}
  return left;
}
function lkPinFail(id){
  const bag=lkPinLockBag();
  const row=bag[id]||{fails:0,until:0};
  if(row.until&&row.until<=Date.now()){row.fails=0;row.until=0}
  row.fails=(+row.fails||0)+1;
  let until=0;
  if(row.fails>=LK_PIN_MAX){until=Date.now()+LK_PIN_LOCK_MS;row.until=until;row.fails=0}
  bag[id]=row;lkPinSaveLock(bag);
  return until;
}
function lkPinClearFails(id){
  const bag=lkPinLockBag();
  if(!bag[id])return;
  delete bag[id];lkPinSaveLock(bag);
}
function lkPinOf(lg,id){
  let best=null;
  const take=(rec,name)=>{
    if(!rec)return;
    const at=+rec.pinAt||0;
    if(best&&at<best.pinAt)return;
    best={pinHash:rec.pinHash||'',pinSalt:rec.pinSalt||'',pinAt:at,name:name||rec.name||''};
  };
  const reg=(lg&&lg.reg)||{};
  for(const night of Object.keys(reg)){
    for(const r of reg[night]||[]){
      if(!r||String(r.id)!==String(id))continue;
      take(r,r.name);
    }
  }
  if(lg&&lg.pins&&lg.pins[id])take(lg.pins[id],(lg.pins[id].name)||'');
  return best;
}
function lkCopyPin(row,rec){
  if(!row||!rec)return;
  if('pin' in row)delete row.pin;
  if(!('pinHash' in rec)&&!rec.pinAt)return;
  const inc=+rec.pinAt||0, cur=+row.pinAt||0;
  if(inc&&inc<cur)return;
  if(!inc&&row.pinHash)return;
  if(rec.pinHash){row.pinHash=String(rec.pinHash);row.pinSalt=String(rec.pinSalt||'');row.pinAt=inc||Date.now()}
  else if(inc){delete row.pinHash;delete row.pinSalt;row.pinAt=inc}
}
function lkPublicReg(reg){
  const out={};
  for(const night of Object.keys(reg||{})){
    out[night]=(reg[night]||[]).map(r=>{
      if(!r||typeof r!=='object')return r;
      const c=Object.assign({},r);
      delete c.pin;
      return c;
    });
  }
  return out;
}
function lkSetPin(lg,id,name,hash,salt){
  lg=lg||(typeof lkEnsure==='function'?lkEnsure():null);
  if(!lg)return 0;
  const at=Date.now();
  const pinHash=hash?String(hash):'';
  const pinSalt=pinHash?String(salt||''):'';
  const who=String(id||'');
  let touched=false;
  for(const night of Object.keys(lg.reg||{})){
    for(const r of lg.reg[night]||[]){
      if(!r)continue;
      const same=who&&String(r.id)===who||(name&&lkCleanName(r.name).toLowerCase()===lkCleanName(name).toLowerCase());
      if(!same)continue;
      if(pinHash){r.pinHash=pinHash;r.pinSalt=pinSalt}else{delete r.pinHash;delete r.pinSalt}
      if('pin' in r)delete r.pin;
      r.pinAt=at;touched=true;
    }
  }
  if(!touched&&who){
    lg.pins=lg.pins||{};
    lg.pins[who]={pinHash,pinSalt,pinAt:at,name:lkCleanName(name)||''};
  }
  lg.dirty=1;
  if(typeof save==='function')save();
  try{
    const box=lkRegInbox();
    let ch=false;
    box.forEach(r=>{
      if(!r)return;
      if((who&&String(r.id)===who)||(name&&lkCleanName(r.name).toLowerCase()===lkCleanName(name).toLowerCase())){
        if(pinHash){r.pinHash=pinHash;r.pinSalt=pinSalt}else{delete r.pinHash;delete r.pinSalt}
        if('pin' in r)delete r.pin;
        r.pinAt=at;ch=true;
      }
    });
    if(ch)localStorage.setItem(LK_REG_KEY,JSON.stringify(box));
  }catch(e){}
  try{
    if(typeof h2hPost==='function'&&typeof lgTopic==='function'){
      const rec={name:lkCleanName(name)||'',id:who||null,at,pinHash,pinSalt,pinAt:at,allNights:1};
      Promise.resolve(h2hPost(lgTopic(lg.code),{k:'lkreg',code:lg.code||LK_CODE,rec,t:at,by:lkPaidAuthority()||(typeof h2hMe==='function'&&h2hMe())||''})).catch(function(){});
    }
  }catch(e){}
  return at;
}
function lkResetPin(id){
  const lg=typeof lkEnsure==='function'?lkEnsure():null;
  if(!lg)return 'The league is not on this phone yet.';
  if(!lkHostPhone(lg))return 'Only a host phone can reset a PIN.';
  const who=String(id||'');
  if(!who)return 'Pick an archer.';
  let name='';
  for(const night of Object.keys(lg.reg||{})){
    const row=(lg.reg[night]||[]).find(r=>r&&String(r.id)===who);
    if(row&&row.name){name=row.name;break}
  }
  if(!name&&lg.gn&&lg.gn[who])name=lg.gn[who].n||'';
  if(!name&&lg.pins&&lg.pins[who])name=lg.pins[who].name||'';
  lkSetPin(lg,who,name,'','');
  return '';
}
function lkApplyReg(rec,lg){
  lg=lg||(typeof lkEnsure==='function'?lkEnsure():null);if(!lg||!rec)return {ok:false,msg:'The league is not on this phone yet.'};
  const name=lkCleanName(rec.name);if(name.length<2)return{ok:false,msg:'Type a name (at least 2 characters).'};
  const nights=lkShootDates(lg);
  if(!nights.length)return{ok:false,msg:'The league has no shoot nights yet.'};
  const closed=lkRegClosed(lg,name,rec.id||lkFindArcher(lg,name));
  if(closed)return{ok:false,msg:closed};
  const dropId=lkDropHit(lg,rec.id,name);
  if(dropId&&(lg.drop[dropId].t||0)>=(+rec.at||0))return{ok:false,msg:'That archer was removed from the league.',dropped:1};
  if(dropId)delete lg.drop[dropId];
  lg.reg=lg.reg||{};lg.gn=lg.gn||{};lg.order=lg.order||[];
  const me=(typeof h2hMe==='function'&&h2hMe())||'';
  let id=rec.id||null;
  if(id&&lkIsHostPerson(id,name))id=null;
  if(!id&&me&&!lkIsHostPerson(me,'')&&(typeof lgName==='function'?lgName(me):me).toLowerCase()===name.toLowerCase())id=me;
  if(!id)id=lkFindArcher(lg,name);
  if(id&&lkIsHostPerson(id,name))id=null;
  const first=!id||!(lg.order||[]).includes(id);
  if(!id){
    if(me&&!(lg.order||[]).includes(me)&&!(lgArchers&&false)){
      /* signed-in archer registering under a new name: still a named guest unless they used their own name */
      id=lkNewGuestId(lg);
    }else id=id||lkNewGuestId(lg);
  }
  if(!(lg.order||[]).includes(id)){
    lg.order.push(id);
    if(!TESTERS||!TESTERS.some(t=>t.id===id)){
      lg.gn[id]={n:name,j:rec.jr?1:0,t:rec.at||Date.now(),by:'register'};
    }
  }
  const nameKey=name.toLowerCase();
  let alreadyAll=true;
  nights.forEach(night=>{
    lg.reg[night]=lg.reg[night]||[];
    const row=lg.reg[night].find(r=>r&&(r.id===id||lkCleanName(r.name).toLowerCase()===nameKey));
    if(row){row.id=row.id||id;row.name=name;row.at=rec.at||row.at||Date.now();if(rec.bow)row.bow=rec.bow;if(rec.email)row.email=rec.email;if(rec.phone)row.phone=rec.phone;lkCopyPin(row,rec);id=row.id||id}
    else{const fresh={id,name,at:rec.at||Date.now(),bow:rec.bow||'',email:rec.email||'',phone:rec.phone||''};lkCopyPin(fresh,rec);lg.reg[night].push(fresh);alreadyAll=false}
  });
  lg.dirty=1;if(typeof save==='function')save();
  return{ok:true,id,first:first&&!alreadyAll?1:0,night:nights[0],nights,already:alreadyAll,name};
}
function lkDropHit(lg,id,name){
  const bag=(lg&&lg.drop)||{};
  if(id&&bag[id])return id;
  const key=lkCleanName(name).toLowerCase();
  if(!key)return '';
  for(const k of Object.keys(bag)){
    if(lkCleanName(bag[k]&&bag[k].n).toLowerCase()===key)return k;
  }
  return '';
}
function lkApplyDrop(lg,id,name,at){
  lg=lg||(typeof lkEnsure==='function'?lkEnsure():null);
  if(!lg)return false;
  const who=String(id||lkDropHit(lg,'',name)||'');
  if(!who)return false;
  const t=+at||Date.now();
  lg.drop=lg.drop||{};
  const prev=lg.drop[who];
  if(prev&&(prev.t||0)>=t)return false;
  lg.drop[who]={n:lkCleanName(name||(prev&&prev.n)||''),t};
  return lkStripDropped(lg)||true;
}
function lkStripDropped(lg){
  if(!lg||!lg.drop)return false;
  let ch=false;
  const gone=id=>!!(lg.drop[id]);
  const order=(lg.order||[]).filter(id=>!gone(id));
  if(order.length!==(lg.order||[]).length){lg.order=order;ch=true}
  if(lg.gn){for(const id of Object.keys(lg.gn)){if(gone(id)){delete lg.gn[id];ch=true}}}
  if(lg.reg){for(const night of Object.keys(lg.reg)){
    const next=(lg.reg[night]||[]).filter(r=>r&&!gone(r.id)&&!(lg.drop[lkDropHit(lg,'',r.name)]&&(lg.drop[lkDropHit(lg,'',r.name)].t||0)>=(r.at||0)));
    if(next.length!==(lg.reg[night]||[]).length){lg.reg[night]=next;ch=true}
  }}
  if(lg.paid){for(const night of Object.keys(lg.paid)){for(const id of Object.keys(lg.paid[night]||{})){if(gone(id)){delete lg.paid[night][id];ch=true}}}}
  if(lg.grp){for(const w of Object.keys(lg.grp)){
    const g=lg.grp[w]&&lg.grp[w].g;
    if(!Array.isArray(g))continue;
    const next=g.map(ids=>(ids||[]).filter(id=>!gone(id))).filter(ids=>ids.length);
    if(JSON.stringify(next)!==JSON.stringify(g)){lg.grp[w].g=next;ch=true}
  }}
  if(lg.claim){for(const night of Object.keys(lg.claim)){for(const id of Object.keys(lg.claim[night]||{})){if(gone(id)){delete lg.claim[night][id];ch=true}}}}
  if(ch){lg.dirty=1;if(typeof save==='function')save()}
  if(lkIs(lg))lkSeedCoHost(lg);
  return ch;
}
function lkDropArcher(id){
  const lg=typeof lkEnsure==='function'?lkEnsure():null;
  if(!lg)return 'The league is not on this phone yet.';
  if(!lkCanHost(lg))return 'Only the host can remove an archer.';
  const who=String(id||'');if(!who)return 'Pick an archer.';
  const name=(lg.gn&&lg.gn[who]&&lg.gn[who].n)||(typeof lgName==='function'&&lgName(who))||'';
  if(who===LK_COHOST_ID||who==='lkhost:nate'||lkIsCoHostName(name))return 'Nate Evans is an organiser for every night, so he stays on the list.';
  if(who===LK_HOST_REG_ID||lkIsHostRegName(name))return 'Nathaniel Stride is the host for every night, so he stays on the list.';
  const at=Date.now();
  lkApplyDrop(lg,who,name,at);
  const whoBy=lkPaidAuthority()||'nathe';
  try{
    if(typeof h2hPost==='function'&&typeof lgTopic==='function'){
      h2hPost(lgTopic(lg.code),{k:'lkdrop',code:lg.code,id:who,name,at,by:whoBy,cohost:whoBy==='nate'?'nate':'',t:at,fresh:lg.fresh||LK_FRESH});
    }
  }catch(e){}
  try{lkPublishPaid(lg)}catch(e){}
  return '';
}
function lkPullReg(lg){
  lg=lg||lkGet();if(!lg)return 0;
  let n=0;const box=lkRegInbox();
  const nights=lkShootDates(lg);
  for(const rec of box){
    if(!rec)continue;
    const name=lkCleanName(rec.name).toLowerCase();
    const onAll=nights.length&&nights.every(night=>((lg.reg||{})[night]||[]).some(r=>r&&((rec.id&&r.id===rec.id)||lkCleanName(r.name).toLowerCase()===name)));
    /* A row marked applied can still be missing after a strip or a stale snapshot. Put it back. */
    if(rec._applied&&onAll)continue;
    const r=lkApplyReg(rec,lg);
    if(r&&r.ok){rec._applied=1;n++}
  }
  if(n){try{localStorage.setItem(LK_REG_KEY,JSON.stringify(box))}catch(e){}}
  return n;
}
function lkRegister(opts){
  opts=opts||{};
  const name=lkCleanName(opts.name);if(name.length<2)return'Type a name (at least 2 characters).';
  if(typeof nmRude==='function'&&nmRude(name))return'Please use a different name.';
  const lgNow=typeof lkEnsure==='function'?lkEnsure():lkGet();
  const closed=lgNow&&lkRegClosed(lgNow,name,opts.id||lkFindArcher(lgNow,name));
  if(closed)return closed;
  /* One registration covers every shoot night. The night is chosen later, on the login page. */
  const rec={name,at:Date.now(),bow:String(opts.bow||'').slice(0,24),email:String(opts.email||'').slice(0,80),phone:String(opts.phone||'').slice(0,24),league:LK_CODE,allNights:1,poster:1};
  if(opts.pinHash){rec.pinHash=String(opts.pinHash);rec.pinSalt=String(opts.pinSalt||'');rec.pinAt=+opts.pinAt||rec.at}
  const put=lkRegPush(rec);
  if(typeof S!=='undefined'&&S){
    const r=lkApplyReg(rec);
    if(!r.ok)return r.msg||'Could not add that registration.';
    put.stored.id=r.id;put.stored._applied=1;rec.id=r.id;
    if(rec.pinHash){put.stored.pinHash=rec.pinHash;put.stored.pinSalt=rec.pinSalt;put.stored.pinAt=rec.pinAt}
    try{localStorage.setItem(LK_REG_KEY,JSON.stringify(put.box))}catch(e){}
    lkRememberArcher(r.id);
  }
  try{
    if(typeof h2hPost==='function'&&typeof lgTopic==='function'){
      const posted={name:rec.name,at:rec.at,bow:rec.bow,email:rec.email,phone:rec.phone,id:rec.id||null,allNights:1,poster:1};
      if(rec.pinHash){posted.pinHash=rec.pinHash;posted.pinSalt=rec.pinSalt||'';posted.pinAt=rec.pinAt||rec.at}
      Promise.resolve(h2hPost(lgTopic(LK_CODE),{k:'lkreg',code:LK_CODE,rec:posted,t:rec.at,by:lkPaidAuthority()||(typeof h2hMe==='function'&&h2hMe())||''})).catch(function(){});
    }
  }catch(e){}
  return '';
}
function lkNightKey(lg,w){return lkDate(lg,w)||LK_DATES[(+w||1)-1]||''}
function lkNightSignups(lg,w){
  const k=lkNightKey(lg,w);
  const rows=((lg&&lg.reg)||{})[k]||[];
  const seen=new Set(),out=[];
  for(const r of rows){
    if(!r||lkIsHostAccount(r.id))continue;
    const key=lkCleanName(r.name).toLowerCase()||r.id;
    if(!key||seen.has(key))continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}
function lkPickerOrder(lg,w){
  const night=lkNightSignups(lg,w).map(r=>r.id);
  const seen=new Set();const out=[];
  for(const id of night){if(!seen.has(id)){seen.add(id);out.push(id)}}
  for(const id of (lg&&lg.order)||[]){if(!seen.has(id)){seen.add(id);out.push(id)}}
  return out;
}
function lkDefaultNight(){
  /* Prefer the current or next listed night; never close a night because of a deadline. */
  const today=(typeof window!=='undefined'&&window._lgToday)||(typeof lgToday==='function'&&lgToday())||new Date().toLocaleDateString('en-CA');
  let pick=LK_DATES[0];
  for(const d of LK_DATES){if(d>=today){pick=d;break}pick=d}
  return pick;
}
function lkBootHome(){
  if(window._lkLeftHome)return false;
  if(!lkIsHomeHash()||lkIsRegHash())return false;
  const homeHash=window.LK_HOME_HASH||LK_HOME_HASH||'#lk-home';
  const stay=()=>{if(window._lkLeftHome)return;try{if(location.hash!==homeHash)history.replaceState(null,'',location.pathname+location.search+homeHash)}catch(e){}};
  stay();
  setTimeout(stay,0);
  try{if($('#tabs'))$('#tabs').hidden=true}catch(e){}
  if(typeof lkFlowHome==='function'){lkFlowHome(LK_CODE);setTimeout(stay,0);return true}
  return false;
}
function lkBootReg(){
  if(!lkIsRegHash())return false;
  const regHash=window.LK_REGISTER_HASH||LK_REGISTER_HASH||'#lk-register';
  try{if(location.hash!==regHash&&!new URLSearchParams(location.search).get('page'))history.replaceState(null,'',location.pathname+location.search+regHash)}catch(e){}
  try{if($('#tabs'))$('#tabs').hidden=true}catch(e){}
  if(typeof lkRegisterView==='function'){lkRegisterView();return true}
  return false;
}
function lkKnownRegistrants(lg){
  lg=lg||lkGet()||(typeof lkEnsure==='function'&&lkEnsure())||null;
  const by=new Map();
  const generic=n=>/^Archer(\s+\d+)?$/i.test(String(n||'').trim());
  const add=(id,name,extra)=>{
    const fromGn=id&&lg&&(lg.gn||{})[id]&&(lg.gn||{})[id].n;
    const fromFn=id&&typeof lgName==='function'?lgName(id):'';
    const n=lkCleanName(name||fromGn||(!generic(fromFn)&&fromFn)||'');
    if(n.length<2)return;
    let rec=id&&[...by.values()].find(x=>x.id===id);
    if(!rec)rec=by.get(n.toLowerCase());
    if(!rec){rec={id:id||null,name:n,email:'',phone:'',bow:'',nights:[]};by.set(n.toLowerCase(),rec)}
    if(id&&!rec.id)rec.id=id;
    if(n&&rec.name!==n&&(generic(rec.name)||n.length>rec.name.length)){
      by.delete(String(rec.name).toLowerCase());
      rec.name=n;
      by.set(n.toLowerCase(),rec);
    }
    if(extra){
      if(extra.email&&!rec.email)rec.email=String(extra.email);
      if(extra.phone&&!rec.phone)rec.phone=String(extra.phone);
      if(extra.bow&&!rec.bow)rec.bow=String(extra.bow);
      if(extra.night&&!rec.nights.includes(extra.night))rec.nights.push(extra.night);
    }
  };
  if(lg){
    const reg=lg.reg||{};
    for(const night in reg){
      (reg[night]||[]).forEach(r=>{if(r)add(r.id,r.name,r)});
    }
    (lg.order||[]).forEach(id=>{
      const n=((lg.gn||{})[id]&&(lg.gn||{})[id].n)||'';
      if(lkIsHostPerson(id,n))return;
      add(id,n);
    });
  }
  try{
    (lkRegInbox()||[]).forEach(r=>{if(r&&!lkIsHostPerson(r.id,r.name))add(r.id,r.name,r)});
  }catch(e){}
  return [...by.values()].filter(a=>!lkIsHostPerson(a.id,a.name)).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
}
function lkRegOkText(nights){
  const ns=(nights||[]).map(d=>LK_DATES.indexOf(d)+1).filter(n=>n>0);
  if(ns.length===1)return `You're registered for Night ${ns[0]} ✓`;
  if(ns.length===2)return `You're registered for Night ${ns[0]} and Night ${ns[1]} ✓`;
  if(ns.length>2)return `You're registered for ${ns.slice(0,-1).map(n=>'Night '+n).join(', ')} and Night ${ns[ns.length-1]} ✓`;
  return `You're registered ✓`;
}
function lkRegisterView(){
  const appEl=typeof app!=='undefined'?app:(typeof $==='function'&&$('#app'));
  if(!appEl)return;
  if(typeof lkEnsure==='function')lkEnsure();
  const lg=lkGet();
  const def=lkDefaultNight();
  const okMsg=window._lkRegOk||'';window._lkRegOk='';
  const qrUrl=lkRegisterUrl();
  const regCount=lkKnownRegistrants(lg).length;
  const leagueFull=regCount>=LK_REG_CAP;
  appEl.innerHTML=`<div class="card" id="lkregpage"><span class="kicker">Lingkana League</span>
    <h1>Register for the Lingkana League</h1>
    ${okMsg?`<p class="lk-ok" id="lkregok" role="status">${h(okMsg)}</p>`:''}
    <p class="small">${h(LK_VENUE)}</p>
    <p class="small muted">${h(LK_HOURS)}</p>
    <p>Put your name down once. It stays on the list for every shoot night. You choose the night when you log in to score.</p>
    ${leagueFull?'<p id="lkregfull">This league already has 52 archers. Registration is closed.</p>':'<p class="small muted">Anyone with this link can register, up to 52 archers. Print the QR for walk-ins at the venue.</p>'}
    <form id="lkregform" autocomplete="on">
      <label for="lkregname">Name</label>
      <input id="lkregname" name="name" required maxlength="24" autocomplete="name" placeholder="Your name">
      <label for="lkregbow">Bow type</label>
      <input id="lkregbow" name="bow" required maxlength="24" placeholder="e.g. Compound">
      <label for="lkregemail">Email <span class="muted">(optional)</span></label>
      <input id="lkregemail" name="email" type="email" maxlength="80" autocomplete="email">
      <label for="lkregphone">Phone <span class="muted">(optional)</span></label>
      <input id="lkregphone" name="phone" maxlength="24" autocomplete="tel">
      <label for="lkregpin">4-digit PIN</label>
      <input id="lkregpin" name="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="4" pattern="[0-9]*">
      <label for="lkregpin2">PIN again</label>
      <input id="lkregpin2" type="password" inputmode="numeric" autocomplete="off" maxlength="4" pattern="[0-9]*">
      <button class="btn lk-go" type="submit" id="lkreggo" style="margin-top:10px">Register</button>
      <p class="small lk-err" id="lkregmsg" role="alert"></p>
    </form>
    <div id="lkregqr" data-url="${h(qrUrl)}">
      <h2>Registration QR</h2>
      <p class="small">This is the same registration link. It is drawn on this phone.</p>
      <div id="lkqrsvg" role="img" aria-label="QR code for the registration link"></div>
      <p class="small"><a id="lkreglink" href="${h(qrUrl)}">${h(qrUrl)}</a></p>
      <button class="btn ghost" type="button" id="lkqrshare">Share link</button>
      <p class="small" id="lkqrsharemsg" role="status"></p>
    </div>
    <p class="small muted">Scoring on the night is separate and uses the shared passcode. This page does not take payments.</p>
    <div id="lkgetbox" style="margin:16px 0 8px">
      <p class="small muted">To keep it: tap Share or the ⋮ menu, then Add to Home Screen.</p>
    </div>
    <p><button class="btn ghost" type="button" id="lkregback">Back</button></p>
    </div>`;
  const nightEl=appEl.querySelector('#lkregnight');if(nightEl)nightEl.value=def;
  const slot=appEl.querySelector('#lkqrsvg');
  if(slot){
    const svg=lkQrSvg(qrUrl);
    slot.innerHTML=svg||'<p class="small">The QR could not be drawn on this phone. Use the link above.</p>';
  }
  const shareBtn=appEl.querySelector('#lkqrshare');
  if(shareBtn)shareBtn.onclick=async()=>{
    const url=qrUrl;
    const msg=appEl.querySelector('#lkqrsharemsg');
    if(msg)msg.textContent='';
    const nav=navigator;
    const copy=async()=>{
      let done=false;
      try{if(nav.clipboard&&nav.clipboard.writeText){await nav.clipboard.writeText(url);done=true}}catch(e){}
      if(!done){
        try{
          const t=document.createElement('textarea');
          t.value=url;t.setAttribute('readonly','');t.style.position='fixed';t.style.left='-9999px';
          document.body.appendChild(t);t.select();done=!!document.execCommand('copy');t.remove();
        }catch(e){}
      }
      if(done&&msg)msg.textContent='Link copied';
    };
    if(typeof nav.share==='function'){
      try{await nav.share({title:'Register for the Lingkana League',text:'Register for the Lingkana League',url});return}catch(e){}
    }
    await copy();
  };
  const form=appEl.querySelector('#lkregform');
  if(form)form.onsubmit=e=>{
    e.preventDefault();
    const box=appEl.querySelector('#lkregmsg');
    const go=appEl.querySelector('#lkreggo');
    if(go)go.disabled=true;
    const fail=t=>{if(box)box.textContent=t;if(go)go.disabled=false};
    const name=(appEl.querySelector('#lkregname')||{}).value;
    const bow=(appEl.querySelector('#lkregbow')||{}).value;
    const email=(appEl.querySelector('#lkregemail')||{}).value;
    const phone=(appEl.querySelector('#lkregphone')||{}).value;
    const pin=(appEl.querySelector('#lkregpin')||{}).value||'';
    const pin2=(appEl.querySelector('#lkregpin2')||{}).value||'';
    if(!String(bow||'').trim()){fail('Enter your bow type.');return}
    if(!/^\d{4}$/.test(pin)){fail('Enter a 4-digit PIN.');return}
    if(pin!==pin2){fail('Those PINs do not match.');return}
    const salt=lkPinSalt();
    lkPinHash(name,pin,salt).then(pinHash=>{
      const last=lkRegister({name,bow,email,phone,pinHash,pinSalt:salt,pinAt:Date.now()});
      if(last){fail(last);return}
      window._lkRetPick=null;
      window._lkRegOk="You're registered for the Lingkana League.";
      lkRegisterView();
    }).catch(()=>{fail('Could not save that PIN on this phone.');});
  };
  const back=appEl.querySelector('#lkregback');
  if(back)back.onclick=()=>{window._lkRetPick=null;try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}if(typeof lkFlowHome==='function')lkFlowHome(LK_CODE);else if(typeof lkView==='function'&&lkGet())lkView(LK_CODE);else if(typeof nav==='function')nav('lab_leagues')};
}


function lkTens(E){return(E||[]).flat().filter(a=>a==='10').length}
function lkPickBest(W){
  /* No minimum nights. Total is the best 4 scores from the nights they shot (or all of them if fewer than four). A miss is —, not a zero. */
  const idx=[];(W||[]).forEach((c,i)=>{if(c)idx.push(i)});
  idx.sort((a,b)=>(W[b].s-W[a].s)||(W[b].x-W[a].x)||((W[b].t10||0)-(W[a].t10||0))||a-b);
  const count=idx.slice(0,4);
  return{
    count,
    t:count.reduce((n,i)=>n+W[i].s,0),
    x:count.reduce((n,i)=>n+W[i].x,0),
    tens:count.reduce((n,i)=>n+(W[i].t10||0),0),
    open:count.some(i=>!W[i].d)
  };
}
function lkNormName(nm){return String(nm||'').trim().replace(/\s+/g,' ').toLowerCase()}
function lkMergeNight(a,b){
  if(!a)return b||null;
  if(!b)return a;
  if(a.d&&!b.d)return a;
  if(b.d&&!a.d)return b;
  if((b.s||0)!==(a.s||0))return (b.s||0)>(a.s||0)?b:a;
  if((b.x||0)!==(a.x||0))return (b.x||0)>(a.x||0)?b:a;
  return a;
}
function lkApplyBest(r){const b=lkPickBest(r.W);r.t=b.t;r.x=b.x;r.tens=b.tens;r.count=b.count;r.open=b.open;return r}
function lkTable(lg){
  const A=(typeof lgArchers==='function'?lgArchers(lg):(lg&&lg.order)||[]);
  const seen=new Set(), ids=[];
  for(const id of A){if(!id||seen.has(id))continue;seen.add(id);ids.push(id)}
  const raw=ids.map(id=>{
    const W=[];
    for(let w=1;w<=6;w++){
      const e=(typeof lgEnt==='function'&&lgEnt(lg,id,w))||((lg.sc||{})[id]||{})[w]||null;
      if(typeof lgHas==='function'?lgHas(e):(e&&e.e&&e.e.some(x=>x&&x.length))){
        const ctx=Object.assign({xv:11,lancaster:true,round:LK_R,nEnds:20},e);
        const s=(typeof lgTot==='function'?lgTot(e.e,ctx):0);
        const x=(typeof lgXs==='function'?lgXs(e.e):0);
        const t10=lkTens(e.e);
        const d=typeof lgDoneE==='function'?lgDoneE(Object.assign({},e,{nEnds:e.nEnds||20})):!!(e.e&&e.e.filter(z=>z&&z.length==3).length>=20);
        W.push({s,x,t10,d});
      }else W.push(null);
    }
    const stored=lg&&lg.gn&&lg.gn[id]&&lg.gn[id].n;
    const nm=stored||(typeof lgName==='function'?lgName(id):id);
    return lkApplyBest({id,nm,W,named:!!stored});

  });
  const byName=new Map(), rows=[];
  for(const r of raw){
    const key=lkNormName(r.nm);
    const generic=!key||key==='archer'||key==='you'||key==='someone';
    const prev=(!generic&&key)?byName.get(key):null;
    if(prev){
      prev.W=prev.W.map((c,i)=>lkMergeNight(c,r.W[i]));
      const nights=row=>(row.W||[]).filter(Boolean).length;
      const ga=/^g[a-z0-9]{6}$/.test(String(prev.id||'')), gb=/^g[a-z0-9]{6}$/.test(String(r.id||''));
      if(nights(r)>nights(prev)||(nights(r)===nights(prev)&&ga&&!gb))prev.id=r.id;
      if(r.named||!prev.named)prev.nm=r.nm;
      lkApplyBest(prev);
    }else{
      if(!generic&&key)byName.set(key,r);
      rows.push(r);
    }
  }
  rows.sort((a,b)=>b.t-a.t||b.x-a.x||(b.tens||0)-(a.tens||0)||String(a.nm).localeCompare(String(b.nm)));
  rows.forEach((r,k)=>{r.rk=k&&rows[k-1].t==r.t&&rows[k-1].x==r.x&&(rows[k-1].tens||0)==(r.tens||0)?rows[k-1].rk:k+1});
  rows.forEach(r=>r.tie=rows.filter(o=>o.rk==r.rk).length>1);
  return rows;
}
function lkLastScoredNight(lg){
  let n=0;
  (lkTable(lg)||[]).forEach(r=>((r&&r.W)||[]).forEach((c,i)=>{if(c)n=Math.max(n,i+1)}));
  return n;
}
function lkStandSubtitle(lg){
  const n=lkLastScoredNight(lg);
  return n?('After Night '+n+' · '+lkFmtD(lkNightKey(lg,n))):'No nights scored yet';
}
function lkTableHTML(lg){
  const me=(typeof h2hMe==='function'&&h2hMe())||'';
  const rows=lkTable(lg);
  const cells=(r,c,i)=>{
    if(!c)return'<td class="lk-miss">—</td>';
    const on=r.count.includes(i);
    const body=c.d?String(c.s):`<i>${c.s}</i>`;
    return`<td class="${on?'lk-keep':'lk-drop'}"${on?' title="Counts in the best 4"':''}>${body}</td>`;
  };
  const tot=r=>r.open?`<i>${r.t}</i>`:String(r.t);
  return`<div class="card" id="lkstand"><h3>Standings · best 4 of 6</h3>
    <div class="lk-printhead"><p class="lk-printbrand">ScoreTool</p><h2>Lingkana Indoor League · Standings</h2><p>${h(lkStandSubtitle(lg))}</p></div>
    <div class="lk-standwrap"><table class="lk-stand" id="lktab"><colgroup><col class="rk"><col class="nm"><col class="n"><col class="n"><col class="n"><col class="n"><col class="n"><col class="n"><col class="best"><col class="xs"><col class="ts"></colgroup>
    <thead><tr><th></th><th class="nm">Archer</th>${[1,2,3,4,5,6].map(k=>`<th>N${k}</th>`).join('')}<th>Best 4</th><th>11s</th><th>10s</th></tr></thead>
    <tbody>${rows.map(r=>`<tr data-lkrow="${h(r.id)}"><td class="rk">${r.tie?'=':''}${r.rk}</td><td class="nm">${h(r.nm)}${r.id==me?' (you)':''}</td>${r.W.map((c,i)=>cells(r,c,i)).join('')}<td class="best">${tot(r)}</td><td class="xs">${r.x}</td><td class="ts">${r.tens||0}</td></tr>`).join('')||'<tr><td colspan="11">No scores yet.</td></tr>'}</tbody></table></div>
    <div class="lk-standbar">
      <button class="btn alt" type="button" id="lkstandshare">Share</button>
      <button class="btn alt" type="button" id="lkstandprint">Print</button>
      <p class="small" id="lkstandsharemsg" role="status"></p>
    </div>
    <p class="small muted" style="margin:4px 0 0">No minimum nights. The total is the best 4 scores from the nights they shot (or all of them if they have fewer than four). Max 2,640. The four that count are marked. A missed night is — and is not a zero. Italics = still shooting. Rank is by highest total, then 11s on the counting scores, then 10s. The shoot-up is the top 12. Night 7 is not in this table.</p>
    </div>`;
}
function lkBindStandUI(lg){
  if($('#lkstandshare'))$('#lkstandshare').onclick=()=>lkShareStandings(lg);
  if($('#lkstandprint'))$('#lkstandprint').onclick=()=>lkPrintStandings();
}
function lkPrintStandings(){
  const b=document.body;
  b.classList.add('lk-print-stand');
  const done=()=>{if(!b.classList.contains('lk-print-stand'))return;b.classList.remove('lk-print-stand');window.removeEventListener('afterprint',done)};
  window.addEventListener('afterprint',done);
  window.print();
  setTimeout(done,60000);
}
function lkLoadLogo(){
  return new Promise(res=>{
    const img=new Image();
    img.onload=()=>res(img);
    img.onerror=()=>res(null);
    img.src='icons/icon-192.png';
  });
}
async function lkStandingsPng(lg){
  const league=lg||lkEnsure();
  const rows=lkTable(league);
  const sub=lkStandSubtitle(league);
  const cols=['','Archer','N1','N2','N3','N4','N5','N6','Best 4','11s','10s'];
  const cw=[36,170,52,52,52,52,52,52,60,44,44];
  const pad=28, rowH=28, headH=26, scale=2;
  const tableW=cw.reduce((a,b)=>a+b,0);
  const W=Math.max(794, tableW+pad*2);
  const top=92;
  const H=top+headH+Math.max(rows.length,1)*rowH+pad+16;
  const c=document.createElement('canvas');c.width=W*scale;c.height=H*scale;
  const g=c.getContext('2d');g.scale(scale,scale);
  g.fillStyle='#fff';g.fillRect(0,0,W,H);
  const logo=await lkLoadLogo();
  if(logo)g.drawImage(logo,pad,16,28,28);
  g.fillStyle='#0f172a';
  g.font='600 15px system-ui,sans-serif';
  g.textBaseline='middle';
  g.textAlign='left';
  g.fillText('ScoreTool',pad+(logo?36:0),30);
  g.textBaseline='alphabetic';
  g.font='bold 22px system-ui,sans-serif';
  g.fillText('Lingkana Indoor League · Standings',pad,66);
  g.font='13px system-ui,sans-serif';
  g.fillStyle='#475569';
  g.fillText(sub,pad,84);
  const xs=[];let acc=pad;for(const w of cw){xs.push(acc);acc+=w}
  const drawCell=(i,yy,h,txt,opts)=>{
    const ox=xs[i], w=cw[i];
    g.fillStyle=(opts&&opts.bg)||'#fff';
    g.fillRect(ox,yy,w,h);
    g.fillStyle=(opts&&opts.color)||'#0f172a';
    g.font=((opts&&opts.bold)?'600 ':'500 ')+'12px system-ui,sans-serif';
    g.textBaseline='middle';
    const left=i<=1;
    g.textAlign=left?'left':'right';
    let t=String(txt);
    if(i===1){while(t.length>1&&g.measureText(t).width>w-16)t=t.slice(0,-2)+'\u2026'}
    g.fillText(t,left?ox+8:ox+w-8,yy+h/2);
    g.strokeStyle='#e5e7eb';g.lineWidth=1;
    g.beginPath();g.moveTo(ox+w+0.5,yy);g.lineTo(ox+w+0.5,yy+h);g.stroke();
  };
  let y=top;
  cols.forEach((t,i)=>drawCell(i,y,headH,t,{bold:true,color:'#475569'}));
  g.strokeStyle='#d1d5db';g.beginPath();g.moveTo(pad,y+headH+0.5);g.lineTo(pad+tableW,y+headH+0.5);g.stroke();
  y+=headH;
  rows.forEach(r=>{
    const line=[(r.tie?'=':'')+r.rk, r.nm];
    (r.W||[]).forEach(c=>line.push(c?String(c.s):'\u2014'));
    while(line.length<8)line.push('\u2014');
    line.push(String(r.t), String(r.x||0), String(r.tens||0));
    line.forEach((t,i)=>{
      const night=i>=2&&i<=7;
      const on=night&&r.count&&r.count.includes(i-2);
      drawCell(i,y,rowH,t,{bg:on?'#edf2f7':'#fff',bold:i===8,color:'#0f172a'});
    });
    g.strokeStyle='#e5e7eb';g.beginPath();g.moveTo(pad,y+rowH+0.5);g.lineTo(pad+tableW,y+rowH+0.5);g.stroke();
    y+=rowH;
  });
  if(!rows.length){
    g.fillStyle='#475569';g.font='13px system-ui,sans-serif';g.textAlign='left';g.textBaseline='alphabetic';
    g.fillText('No scores yet.',pad,y+18);
  }
  return new Promise(res=>c.toBlob(b=>res(b?new File([b],'lingkana-standings.png',{type:'image/png'}):null),'image/png'));
}
async function lkShareStandings(lg){
  const league=lg||lkEnsure();
  const title='Lingkana Indoor League · Standings';
  const text=title+' \u00b7 '+lkStandSubtitle(league);
  const msg=$('#lkstandsharemsg');
  const say=s=>{if(msg)msg.textContent=s};
  let file=null;try{file=await lkStandingsPng(league)}catch(e){file=null}
  const nav=typeof navigator!=='undefined'?navigator:null;
  if(nav&&typeof nav.share==='function'){
    if(file&&(typeof nav.canShare!=='function'||nav.canShare({files:[file]}))){
      try{await nav.share({title,text,files:[file]});say('Shared.');return}catch(e){if(e&&e.name==='AbortError')return}
    }
    try{await nav.share({title,text});say('Shared.');return}catch(e){if(e&&e.name==='AbortError')return}
  }
  if(file){
    try{
      const a=document.createElement('a');
      a.href=URL.createObjectURL(file);
      a.download=file.name;
      a.rel='noopener';
      document.body.appendChild(a);a.click();a.remove();
      say('Saved the standings picture.');
      return;
    }catch(e){}
  }
  say('Could not make a picture to share.');
}


const LK_ENTRY_FEE=10, LK_RANGE_FEE=25, LK_SPLIT=[0.6,0.3,0.1];
function lkPaidMap(lg){return (lg&&lg.paid)||{}}
function lkNightPaid(lg,w){
  const k=lkNightKey(lg,w), bag=(lkPaidMap(lg)[k]||lkPaidMap(lg)[String(w)]||{});
  const paid=Object.keys(bag).filter(id=>bag[id]);
  const sign=lkNightSignups(lg,w).map(r=>r.id);
  const expected=[...new Set(sign.concat(paid))];
  const out=expected.filter(id=>!bag[id]);
  return{w,date:k,paid:paid.length,due:expected.length,out:out.length,total:paid.length*LK_ENTRY_FEE,owed:out.length*LK_ENTRY_FEE,ids:paid,outstanding:out};
}
function lkPaidCount(lg){
  let n=0;for(let w=1;w<=LK_NIGHTS;w++)n+=lkNightPaid(lg,w).paid;
  return n;
}
function lkPot(lg){
  const nights=[];for(let w=1;w<=LK_NIGHTS;w++)nights.push(lkNightPaid(lg,w));
  const entries=nights.reduce((n,x)=>n+x.paid,0), pot=entries*LK_ENTRY_FEE, owed=nights.reduce((n,x)=>n+x.owed,0);
  return {entries,pot,owed,nights,first:Math.round(pot*LK_SPLIT[0]),second:Math.round(pot*LK_SPLIT[1]),third:Math.round(pot*LK_SPLIT[2]),currency:'AUD',whole:true};
}
function lkPaidAuthority(){
  if(typeof lkCoHostOn==='function'&&lkCoHostOn())return 'nate';
  const me=typeof h2hMe==='function'?h2hMe():'';
  const lg=typeof lkGet==='function'?lkGet():null;
  if(me&&(me==='nathe'||(lg&&me===lg.host)))return me;
  return '';
}
function lkPublishPaid(lg){
  lg=lg||(typeof lkEnsure==='function'?lkEnsure():null);
  const who=lkPaidAuthority();
  if(!lg||!who||typeof h2hPost!=='function'||typeof lgTopic!=='function')return Promise.resolve(false);
  return h2hPost(lgTopic(lg.code),{k:'ls',code:lg.code,by:who,cohost:who==='nate'?'nate':'',host:lg.host||LK_HOST,format:'lingkana',paid:lg.paid||{},paidt:lg.paidt||Date.now(),drop:lg.drop||{},fresh:lg.fresh||0,t:Date.now(),part:1,np:1});
}
async function lkSyncOnce(){
  if(window._lkSyncBusy)return false;
  if(typeof h2hPoll!=='function'||typeof lgTopic!=='function')return false;
  window._lkSyncBusy=true;
  let ch=false;
  try{
    const lg=typeof lkEnsure==='function'?lkEnsure():null;
    if(!lg)return false;
    const L=await h2hPoll(lgTopic(lg.code), lg.since);
    if(L&&L.length){
      for(const d of L){
        if(!d)continue;
        lg.since=d._id;
        if(typeof lgMerge==='function'&&lgMerge(lg,d))ch=true;
        else if(d.k==='lkreg'&&(d.code===lg.code||d.code===LK_CODE)&&(!(lg.fresh)||+(d.t||(d.rec&&d.rec.at)||0)>=lg.fresh)&&lkRegKept(lg,(d.rec&&d.rec.at)||0)){
          const r=lkApplyReg(d.rec||d,lg);
          if(r&&r.ok&&!r.already)ch=true;
        }else if(d.k==='lkdrop'&&(d.code===lg.code||d.code===LK_CODE)&&(!(lg.fresh)||+(d.at||d.t||0)>=lg.fresh)){
          if(lkApplyDrop(lg,d.id,d.name,d.at||d.t))ch=true;
        }
      }
      if(typeof save==='function')save();
    }
  }catch(e){}
  finally{window._lkSyncBusy=false}
  if(ch&&!window._lkSyncRedraw){
    window._lkSyncRedraw=1;
    setTimeout(()=>{window._lkSyncRedraw=0},800);
    try{
      if(document.getElementById('lkloginpage')&&typeof window.lkFlowLogin==='function')window.lkFlowLogin();
      else if((document.getElementById('lkpaidlist')||document.getElementById('lkpot'))&&typeof window.lkFlowReview==='function')window.lkFlowReview();
      else if(document.getElementById('lkresults'))lkResultsView(window._lkResNight);
    }catch(e){}
  }
  return ch;
}
function lkSyncStart(){
  if(window._lkSyncTimer)return;
  window._lkSyncTimer=setInterval(()=>{
    if(document.hidden)return;
    const on=document.getElementById('lkregpage')||document.getElementById('lkloginpage')||document.getElementById('lkpaidlist')||document.getElementById('lkhome')||document.getElementById('lkassigned')||document.getElementById('lkresults')||document.body.classList.contains('lk-flow');
    if(on)lkSyncOnce();
  },10000);
}
function lkSetPaid(id,night,on){
  const lg=lkEnsure();if(!lg)return 'The league is not on this phone yet.';
  if(!lkCanHost(lg))return 'Only the host can tick who paid.';
  const who=String(id||'');if(!who)return 'Pick an archer.';
  const k=LK_DATES.includes(night)?night:lkNightKey(lg,night);
  if(!k||!LK_DATES.includes(k))return 'Pick a shoot night.';
  lg.paid=lg.paid||{};lg.paid[k]=lg.paid[k]||{};
  if(on)lg.paid[k][who]=1;else delete lg.paid[k][who];
  lg.paidt=Date.now();lg.dirty=1;if(typeof save==='function')save();
  try{lkPublishPaid(lg)}catch(e){}
  return '';
}
function lkPotHTML(lg){
  const p=lkPot(lg), host=lkCanHost(lg);
  const curW=typeof lgWeek==='function'?Math.min(LK_NIGHTS,lgWeek(lg)||1):1;
  const w=+(window._lkPotNight||curW)||curW;
  const night=lkNightKey(lg,w);
  const paid=(lg.paid&&lg.paid[night])||{};
  const people=lkPickerOrder(lg,w);
  const signups=lkNightSignups(lg,w);
  const rows=people.map(id=>{
    const rec=signups.find(r=>r&&String(r.id)===String(id));
    const nm=h((rec&&rec.name)||(typeof lgName==='function'&&lgName(id))||id);
    const on=!!paid[id];
    const box=host?`<input type="checkbox" data-lkpaid="${h(id)}" ${on?'checked':''}>`:(on?'Paid':'—');
    const ask=host&&window._lkDropAsk===id;
    const cohostRow=String(id)===LK_COHOST_ID||String(id)==='lkhost:nate'||lkIsCoHostName((rec&&rec.name)||lkArcherName(lg,id));
    const drop=host&&!cohostRow?(ask?`<span class="lk-dropask">Remove ${nm}?<button type="button" class="lk-remove" data-lkdrop="${h(id)}" data-go="1">Remove</button><button type="button" class="lk-cancel" data-lkdropcancel="1">Cancel</button></span>`:`<button type="button" class="lk-remove" data-lkdrop="${h(id)}">Remove</button>`):'';
    return`<div class="lk-paidrow"><label><span class="nm">${nm}</span>${box}</label>${drop}</div>`;
  }).join('')||'<p class="small muted">No one on the list yet.</p>';
  const nightRows=p.nights.map(n=>`<tr data-lkpn="${n.w}"${n.w===w?' class="on"':''}><td>N${n.w}</td><td>${h(lkFmtD(n.date))}</td><td>${n.paid}</td><td>$${n.total}</td><td>${n.out?('$'+n.owed):'—'}</td></tr>`).join('');
  return`<div class="card" id="lkpot"><span class="kicker">Club pot · display only</span>
    <h3>$${p.pot} in the pot</h3>
    <p class="small">${p.entries} paid ${p.entries==1?'entry':'entries'} × $${LK_ENTRY_FEE}. ScoreTool does not take this payment.</p>
    <p>Live split 60 / 30 / 10: <b>$${p.first}</b> / <b>$${p.second}</b> / <b>$${p.third}</b> (whole Australian dollars — these pots always divide evenly).</p>
    ${p.owed?`<p class="small">Outstanding: <b>$${p.owed}</b> still unticked across the season.</p>`:''}
    <p class="small muted">The $${LK_RANGE_FEE} range fee is paid to the venue and is not in this pot. Night 7 also puts $${LK_ENTRY_FEE} into the pot.</p>
    <div class="lg-wrap"><table class="ad-tab" id="lkpotnights"><thead><tr><th></th><th>Night</th><th>Paid</th><th>Total</th><th>Outstanding</th></tr></thead><tbody>${nightRows}</tbody></table></div>
    <label for="lkpotnight" style="margin-top:8px">Tick who paid on</label>
    <select id="lkpotnight">${LK_DATES.slice(0,6).map((d,i)=>`<option value="${i+1}" ${i+1===Math.min(w,6)?'selected':''}>${h(lkFmtD(d).replace(/,?\s*\d{4}/,''))}</option>`).join('')}</select>
    <p class="small muted">$${LK_ENTRY_FEE} each. A no-show is not charged until you tick them.</p>
    <div id="lkpaidlist">${rows}</div>
    </div>`;
}


/* Paid archers for this night who also signed up for it. Unpaid sign-ups stay out.
   The tick is the existing host paid list (lg.paid, shown as .lk-paidrow / #lkpaidlist). */
function lkPaidTonight(lg,w){
  const paid=new Set(((lkNightPaid(lg,w)||{}).ids||[]).map(String));
  const seen=new Set();
  const out=[];
  for(const r of lkNightSignups(lg,w)||[]){
    if(!r||!r.id||!paid.has(String(r.id))||seen.has(String(r.id)))continue;
    seen.add(String(r.id));
    const nm=r.name||(typeof lgName==='function'&&lgName(r.id))||r.id;
    out.push({id:String(r.id),name:String(nm)});
  }
  return out;
}
/* Best-4 standings from nights before w. Same tie-break as the league table: total, then 11s, then 10s. */
function lkPriorRows(lg,w){
  const upto=Math.max(0,(+w||1)-1);
  return (lkTable(lg)||[]).map(r=>{
    const W=(r.W||[]).map((c,i)=>i<upto?c:null);
    const row=lkApplyBest({id:r.id,nm:r.nm,W});
    row.shot=W.some(Boolean);
    return row;
  });
}
function lkHasPriorResult(lg,w){
  if((+w||1)<=1)return false;
  return lkPriorRows(lg,w).some(r=>r.shot);
}
function lkRankKey(person,rows){
  const id=String(person.id);
  const nm=lkNormName(person.name);
  const row=(rows||[]).find(r=>String(r.id)===id)||(rows||[]).find(r=>lkNormName(r.nm)===nm);
  if(!row||!row.shot)return {shot:0,t:0,x:0,tens:0,name:person.name||''};
  return {shot:1,t:row.t||0,x:row.x||0,tens:row.tens||0,name:person.name||row.nm||''};
}
function lkOrderPaid(lg,w){
  const people=lkPaidTonight(lg,w);
  const byName=(a,b)=>String(a.name).localeCompare(String(b.name),'en');
  if(!lkHasPriorResult(lg,w))return {mode:'alpha',people:people.slice().sort(byName)};
  const rows=lkPriorRows(lg,w);
  const peopleSorted=people.slice().sort((a,b)=>{
    const A=lkRankKey(a,rows),B=lkRankKey(b,rows);
    if(A.shot!==B.shot)return B.shot-A.shot;
    if(A.shot){
      if(A.t!==B.t)return B.t-A.t;
      if(A.x!==B.x)return B.x-A.x;
      if(A.tens!==B.tens)return B.tens-A.tens;
    }
    return String(A.name).localeCompare(String(B.name),'en');
  });
  return {mode:'rank',people:peopleSorted};
}
/* Prefer 4, then 3. A 2 is only used when 3s would leave a single archer (2 or 5 people).
   One paid archer is not a group. Returns null for that case. */
function lkGroupSizes(n){
  n=+n||0;
  if(n<=0)return [];
  if(n===1)return null;
  if(n===2)return [2];
  if(n===5)return [3,2];
  let fours=Math.floor(n/4), rem=n%4;
  while(fours>0&&rem!==0&&rem%3!==0){fours--;rem+=4}
  const threes=rem/3;
  const sizes=[];
  for(let i=0;i<fours;i++)sizes.push(4);
  for(let i=0;i<threes;i++)sizes.push(3);
  return sizes;
}
function lkChunkFour(people){
  const all=people||[];
  const placed=all.slice(0,LK_REG_CAP);
  const waiting=all.slice(LK_REG_CAP);
  const sizes=lkGroupSizes(placed.length);
  /* One paid archer is not a group, unless that archer is an organiser (Nathe or Nate Evans). */
  if(sizes==null){
    if(placed.length===1&&lkIsOrganiser(placed[0].id,placed[0].name))return {groups:[placed.slice()],waiting,solo:[],sizes:[1]};
    return {groups:[],waiting,solo:placed.slice(),sizes:[]};
  }
  const groups=[];
  let at=0;
  sizes.forEach(sz=>{groups.push(placed.slice(at,at+sz));at+=sz});
  return {groups,waiting,solo:[],sizes};
}
function lkNightStarted(lg,w){
  const sc=(lg&&lg.sc)||{};
  for(const id of Object.keys(sc)){
    const e=sc[id]&&sc[id][w];
    const ends=e&&e.e||[];
    if(ends.some(x=>x&&x.length))return true;
  }
  return false;
}
function lkGroupsFrom(ids,people,mode,locked,waiting){
  const byId=new Map((people||[]).map(p=>[String(p.id),p]));
  const nameOf=id=>{
    const p=byId.get(String(id));
    return p?p.name:(typeof lgName==='function'&&lgName(id))||String(id);
  };
  const groups=(ids||[]).map((g,i)=>({
    target:i+1,
    ids:(g||[]).map(String),
    names:(g||[]).map(nameOf)
  }));
  const wait=(waiting||[]).map(p=>typeof p==='string'?{id:String(p),name:nameOf(p)}:{id:String(p.id),name:p.name||nameOf(p.id)});
  return {ok:true,locked:!!locked,mode:mode||'alpha',lanes:LK_LANES,groups,waiting:wait,sizes:groups.map(g=>g.ids.length)};
}
function lkAssignGroups(lg,w){
  lg=lg||(typeof lkEnsure==='function'?lkEnsure():null);
  if(!lg)return {ok:false,msg:'The league is not on this phone yet.'};
  w=+w||1;
  if(w>=7)return {ok:false,msg:'Night 7 scoring is not open yet.'};
  const existing=(lg.grp||{})[w]||{};
  const paid=lkPaidTonight(lg,w);
  if(lkNightStarted(lg,w)&&Array.isArray(existing.g)&&existing.g.length){
    const inG=new Set(existing.g.flat().map(String));
    const waiting=paid.filter(p=>!inG.has(String(p.id)));
    const lockedOut=lkGroupsFrom(existing.g,paid,existing.mode||'locked',true,waiting);
    lockedOut.solo=[];
    return lockedOut;
  }
  const ordered=lkOrderPaid(lg,w);
  const chunked=lkChunkFour(ordered.people);
  const ids=chunked.groups.map(g=>g.map(p=>p.id));
  const err=lkSetGroups(w,ids);
  if(err)return {ok:false,msg:err};
  lg.grp[w].mode=ordered.mode;
  lg.grp[w].wait=(chunked.waiting||[]).map(p=>p.id);
  const targetOf={};
  ids.forEach((g,i)=>g.forEach(id=>{targetOf[id]=i+1}));
  const k=lkNightKey(lg,w);
  ((lg.reg||{})[k]||[]).forEach(r=>{
    if(!r||!r.id)return;
    if(targetOf[r.id])r.target=targetOf[r.id];
    else delete r.target;
  });
  lg.dirty=1;
  if(typeof save==='function')save();
  const built=lkGroupsFrom(ids,ordered.people,ordered.mode,false,chunked.waiting);
  built.solo=chunked.solo||[];
  return built;
}
function lkSetGroups(w,G){
  const lg=lkEnsure();if(!lg)return 'The league is not on this phone yet.';
  if(+w>=7)return 'Night 7 scoring is not open yet.';
  const N=(G||[]).map(g=>(g||[]).filter(Boolean));
  if(N.some(g=>g.length===1&&!lkGroupAllOrganisers(lg,g)))return 'A group needs at least two archers.';
  if(N.some(g=>g.length>4))return 'A group can have at most 4 archers.';
  if(N.filter(g=>g.length).length>LK_LANES)return 'There are only 13 targets.';
  lg.grp=lg.grp||{};lg.grp[w]={t:Date.now(),g:N.filter(g=>g.length)};
  lg.dirty=1;if(typeof save==='function')save();
  return '';
}
function lkAddToGroup(w,gi,id){
  const lg=lkEnsure();if(!lg)return 'The league is not on this phone yet.';
  const who=String(id||'');if(!who)return 'Pick an archer.';
  const G=(((lg.grp||{})[w]||{}).g||[]).map(g=>g.slice());
  while(G.length<=gi)G.push([]);
  if(G[gi].includes(who))return '';
  if(G[gi].length>=4)return 'A group can have at most 4 archers.';
  G.forEach(g=>{const i=g.indexOf(who);if(i>=0)g.splice(i,1)});
  G[gi].push(who);
  return lkSetGroups(w,G);
}
function lkScoreGroup(w,gi){
  const lg=lkEnsure();if(!lg)return 'The league is not on this phone yet.';
  if(+w>=7)return 'Night 7 scoring is not open yet.';
  const G=(((lg.grp||{})[w]||{}).g||[])[gi]||[];
  if(!G.length)return 'Add archers to the group first.';
  if(G.length>4)return 'A group can have at most 4 archers.';
  if(!lkAuthed(lg)){window._lkWantScore={w:+w,gi:+gi};lkUnlockView(lg);return 'Type the passcode.';}
  window._lgE={code:lg.code,w:+w,ids:G.slice()};window._lgAct=G[0]||null;window._lgHold=null;
  window._lkScoreIds=G.slice();window._lkScoreI=0;window._lkFlowNight=+w;
  if(typeof lkFlowScore==='function'){lkFlowScore();return ''}
  if(typeof lgView==='function')lgView(lg.code);
  return '';
}
function lkGroupHTML(lg){
  const w=Math.min(6,typeof lgWeek==='function'?lgWeek(lg):1);
  if((typeof lgWeek==='function'?lgWeek(lg):1)>=7)return '';
  const pick=lkPickerOrder(lg,w);
  const G=(((lg.grp||{})[w]||{}).g||[]).map(g=>g.slice());
  const show=G.concat([[]]);
  const names=id=>h((typeof lgName==='function'&&lgName(id))||id);
  const gBlocks=`<div class="lg-wrap" style="max-height:320px;overflow:auto"><table class="ad-tab" id="lkgrptab"><thead><tr><th>Group</th><th>Archers</th><th></th></tr></thead><tbody>`+
    show.map((g,i)=>`<tr data-lkgi="${i}"><td>G${i+1} · ${g.length}/4</td><td>${g.length?g.map(names).join(', '):'<span class="muted">empty</span>'}</td><td>${g.length?`<button class="btn alt" data-lkscore="${i}">Score</button>`:''}</td></tr>`).join('')+
    `</tbody></table></div>`;
  const opts=pick.map(id=>`<option value="${h(id)}">${names(id)}</option>`).join('')||'<option value="">No one on the list</option>';
  const gopts=show.map((g,i)=>`<option value="${i}">Group ${i+1}${g.length?' ('+g.length+'/4)':''}</option>`).join('');
  return`<div class="card" id="lkgrp"><span class="kicker">Night ${w} · groups</span>
    <h3>Up to 4 archers, one scorer</h3>
    <p class="small muted">The scorer picks from tonight's sign-ups first, then the rest of the league list. Groups of up to 4, as many groups as needed (20+ on a big night). Scoring is on this phone, with a number pad (no plot face).</p>
    <label for="lkpick">Add an archer</label>
    <input id="lkpickq" maxlength="40" autocomplete="off" placeholder="Filter names">
    <div class="row" style="gap:6px;flex-wrap:wrap"><select id="lkpick" style="flex:1">${opts}</select>
    <select id="lkpickg">${gopts}</select>
    <button class="btn alt" id="lkaddg">Add to group</button></div>
    <p class="small" id="lkgrpmsg" role="alert"></p>
    ${gBlocks}
    </div>`;
}


const LK_PW_SESSION='scoretool.lk.auth';
async function lkHashPw(pw,salt){
  const enc=new TextEncoder();
  const buf=await crypto.subtle.digest('SHA-256',enc.encode(String(salt||'')+'\0'+String(pw||'')));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function lkAuthed(lg){
  if(!lg)return false;
  try{if(sessionStorage.getItem(LK_PW_SESSION)===lg.code)return true}catch(e){}
  return window._lkAuthed===lg.code;
}
function lkMarkAuth(lg){
  window._lkAuthed=lg.code;
  try{sessionStorage.setItem(LK_PW_SESSION,lg.code)}catch(e){}
}
async function lkSetPassword(){
  return 'The scoring passcode is fixed for this league.';
}
async function lkPassOk(pw){
  pw=String(pw||'');if(!pw)return false;
  try{
    const enc=new TextEncoder(),salt=new Uint8Array(LK_PASS_SALT.match(/../g).map(x=>parseInt(x,16)));
    const key=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveBits']);
    const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:LK_PASS_ITER},key,256);
    const hex=[...new Uint8Array(bits)].map(b=>b.toString(16).padStart(2,'0')).join('');
    let d=hex.length^LK_PASS_DK.length;for(let i=0;i<hex.length;i++)d|=hex.charCodeAt(i)^LK_PASS_DK.charCodeAt(i);
    return d===0;
  }catch(e){return false}
}
async function lkUnlock(pw){
  const lg=lkEnsure();if(!lg)return 'The league is not on this phone yet.';
  if(!(await lkPassOk(pw)))return 'That passcode is not right.';
  lkMarkAuth(lg);return '';
}
function lkUnlockView(lg){
  const appEl=typeof app!=='undefined'?app:null;if(!appEl)return;
  appEl.innerHTML=`<div class="card" id="lkpwpage"><span class="kicker">Passcode</span>
    <h1>${h(lg.name)}</h1>
    <p>Type the shared scoring passcode to score tonight.</p>
    <label for="lkpw">Passcode</label>
    <input id="lkpw" type="password" autocomplete="current-password">
    <button class="btn alt" id="lkpwgo" style="margin-top:8px">Unlock scoring</button>
    <p class="small" id="lkpwmsg" role="alert"></p>
    <p><button class="btn ghost" type="button" id="lkpwback">Back to league</button></p>
    </div>`;
  const go=()=>{lkUnlock((document.querySelector('#lkpw')||{}).value).then(m=>{
    const e=document.querySelector('#lkpwmsg');
    if(m){if(e)e.textContent=m;return}
    const want=window._lkWantScore;window._lkWantScore=null;
    if(want)lkScoreGroup(want.w,want.gi);else if(typeof lkFlowSelect==='function')lkFlowSelect();else lkView(lg.code);
  })};
  if($('#lkpwgo'))$('#lkpwgo').onclick=go;
  if($('#lkpw'))$('#lkpw').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}};
  if($('#lkpwback'))$('#lkpwback').onclick=()=>{window._lkWantScore=null;lkView(lg.code)};
}
function lkPwHTML(){
  return '';
}


const LK_RESULTS_HASH='#lk-results';
function lkIsResHash(){const raw=(location.hash||'').replace(/^#/,'');return raw==='lk-results'||raw.startsWith('lk-results')}
function lkResNightFromHash(){
  const raw=(location.hash||'').replace(/^#/,'');
  const m=/n=(\d+)/.exec(raw)||/lk-results-(\d+)/.exec(raw);
  const n=+(m&&m[1]||window._lkResNight||0);
  return n>=1&&n<=6?n:0;
}
function lkResultsUrl(w){
  const base=String(window.LK_PUBLIC_BASE||LK_PUBLIC_BASE||'').replace(/\/?$/,'/');
  return base+LK_RESULTS_HASH+'&n='+(+w||1);
}
function lkNightScores(lg,w){
  const rows=lkTable(lg).map(r=>{
    const c=(r.W||[])[w-1];
    return c?{id:r.id,nm:r.nm,s:c.s,x:c.x,t10:c.t10||0,d:c.d}:null;
  }).filter(Boolean);
  rows.sort((a,b)=>b.s-a.s||b.x-a.x||(b.t10||0)-(a.t10||0)||String(a.nm).localeCompare(String(b.nm)));
  rows.forEach((r,k)=>{r.rk=k&&rows[k-1].s==r.s&&rows[k-1].x==r.x&&(rows[k-1].t10||0)==(r.t10||0)?rows[k-1].rk:k+1});
  return rows;
}
function lkResultsView(w){
  const appEl=typeof app!=='undefined'?app:null;if(!appEl)return;
  const lg=lkEnsure();if(!lg)return;
  /* Public, no login: open straight from a shared link. Starts the same 10s relay poll used
     elsewhere so this redraws live while someone is watching it (lkSyncOnce redraws #lkresults
     on a change); the first poll is kicked off here rather than waited on, so the page still
     paints immediately from whatever is already on this phone. */
  if(typeof lkSyncStart==='function')lkSyncStart();
  if(typeof lkSyncOnce==='function')lkSyncOnce();
  const n=+w||lkResNightFromHash()||Math.min(6,typeof lgWeek==='function'?lgWeek(lg):1);
  const night=n>=1&&n<=6?n:1;
  window._lkResNight=night;
  const scores=lkNightScores(lg,night);
  const stand=lkTable(lg);
  const p=lkPot(lg);
  const d=lkFmtD(lkNightKey(lg,night));
  const scoreRows=scores.map(r=>`<tr><td>${r.rk}</td><td>${h(r.nm)}</td><td>${r.d?r.s:`<i>${r.s}</i>`}</td><td>${r.x}</td><td>${r.t10||0}</td></tr>`).join('')||'<tr><td colspan="5">No scores this night.</td></tr>';
  const standRows=stand.map(r=>`<tr><td>${r.tie?'=':''}${r.rk}</td><td>${h(r.nm)}</td>${r.W.map(c=>`<td>${c?c.s:'—'}</td>`).join('')}<td>${r.t}</td><td>${r.x}</td><td>${r.tens||0}</td></tr>`).join('')||'<tr><td colspan="11">No standings yet.</td></tr>';
  const potRows=(p.nights||[]).map(x=>`<tr><td>N${x.w}</td><td>${x.paid}</td><td>$${x.total}</td><td>${x.out?('$'+x.owed):'—'}</td></tr>`).join('');
  appEl.innerHTML=`<div class="card" id="lkresults" data-lkn="${night}">
    <div class="lk-printbar">
      <button class="btn alt" type="button" id="lkprint">Print A4</button>
      <button class="btn alt" type="button" id="lkshare">Share</button>
      <button class="btn ghost" type="button" id="lkresback">Back to league</button>
      <p class="small" id="lksharemsg" role="status"></p>
    </div>
    <span class="kicker">Results · Night ${night}</span>
    <h1>${h(lg.name)}</h1>
    <p class="small">${h(d)} · ${h(LK_VENUE)}</p>
    <p class="small muted">Lancaster 660 · triangular 40 cm 3-spot · values only. The app does not post these results itself.</p>
    <h3>Tonight's scores</h3>
    <table id="lknightscores"><thead><tr><th></th><th>Archer</th><th>Score</th><th>11s</th><th>10s</th></tr></thead>
    <tbody>${scoreRows}</tbody></table>
    <h3>Standings · best 4 of 6</h3>
    <p class="small muted">No minimum nights. Rank is by highest total, then 11s on the counting scores, then 10s. The shoot-up is the top 12.</p>
    <table id="lkresstand"><thead><tr><th></th><th>Archer</th>${[1,2,3,4,5,6].map(k=>`<th>N${k}</th>`).join('')}<th>Best 4</th><th>11s</th><th>10s</th></tr></thead>
    <tbody>${standRows}</tbody></table>
    <h3>Pot</h3>
    <p>Running pot <b>$${p.pot}</b> from ${p.entries} paid ${p.entries==1?'entry':'entries'} × $${LK_ENTRY_FEE}. Live split 60 / 30 / 10: <b>$${p.first}</b> / <b>$${p.second}</b> / <b>$${p.third}</b>.</p>
    ${p.owed?`<p class="small">Outstanding: $${p.owed} still unticked.</p>`:''}
    <p class="small muted">The $${LK_RANGE_FEE} range fee is not in this pot. Night 7 also costs $${LK_ENTRY_FEE}.</p>
    <table id="lkrespot"><thead><tr><th>Night</th><th>Paid</th><th>Total</th><th>Outstanding</th></tr></thead><tbody>${potRows}</tbody></table>
    </div>`;
  if($('#lkprint'))$('#lkprint').onclick=()=>window.print();
  if($('#lkshare'))$('#lkshare').onclick=()=>lkShareResults(lg,night);
  if($('#lkresback'))$('#lkresback').onclick=()=>{try{history.replaceState(null,'',location.pathname+location.search+(location.hash||'').replace(/#lk-results[^#]*/,''))}catch(e){}lkView(lg.code)};
}
async function lkResultsPng(lg,w){
  const scores=lkNightScores(lg,w), stand=lkTable(lg), p=lkPot(lg);
  const row=16, pad=28, W=794;
  const H=Math.max(1123, pad+90+(scores.length+stand.length+12)*row+120);
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const g=c.getContext('2d');
  g.fillStyle='#fff';g.fillRect(0,0,W,H);
  g.fillStyle='#111';
  let y=pad;
  const line=(txt,size,bold)=>{g.font=`${bold?'bold ':''}${size}px sans-serif`;g.fillText(txt,pad,y);y+=size+8};
  line((lg.name||'Lingkana League')+' — Night '+w+' results',22,true);
  line(lkFmtD(lkNightKey(lg,w))+' · '+LK_VENUE,13,false);
  line("Tonight's scores",16,true);
  g.font='12px sans-serif';
  scores.forEach(r=>{g.fillText(`${r.rk}. ${r.nm}  ${r.s}  ${r.x}×11  ${r.t10||0}×10`,pad,y);y+=row});
  if(!scores.length){g.fillText('No scores this night.',pad,y);y+=row}
  y+=10;line('Standings · best 4 of 6',16,true);
  g.font='12px sans-serif';
  stand.forEach(r=>{g.fillText(`${r.rk}. ${r.nm}  ${r.t}  ${r.x}×11  ${r.tens||0}×10`,pad,y);y+=row});
  y+=10;line('Pot $'+p.pot+' · 60/30/10 $'+p.first+' / $'+p.second+' / $'+p.third,16,true);
  g.font='12px sans-serif';g.fillText((p.entries||0)+' paid entries × $'+LK_ENTRY_FEE+'. Range fee excluded.',pad,y);
  return new Promise(res=>c.toBlob(b=>res(b?new File([b],'lingkana-night-'+w+'-results.png',{type:'image/png'}):null),'image/png'));
}
async function lkShareResults(lg,w){
  const url=lkResultsUrl(w);
  const title=(lg.name||'Lingkana League')+' · Night '+w+' results';
  const text=title+' · '+lkFmtD(lkNightKey(lg,w))+'. Best-4 standings and pot. The app does not post this for you.';
  const msg=$('#lksharemsg');
  const say=s=>{if(msg)msg.textContent=s};
  let file=null;try{file=await lkResultsPng(lg,w)}catch(e){file=null}
  const nav=typeof navigator!=='undefined'?navigator:null;
  if(nav&&typeof nav.share==='function'){
    const payload={title,text,url};
    if(file&&typeof nav.canShare==='function'&&nav.canShare({files:[file]})){
      try{await nav.share({title,text,url,files:[file]});say('Shared.');return}catch(e){if(e&&e.name==='AbortError')return}
    }
    try{await nav.share(payload);say('Shared.');return}catch(e){if(e&&e.name==='AbortError')return}
  }
  try{if(nav&&nav.clipboard)await nav.clipboard.writeText(url)}catch(e){}
  say('Share link ready: '+url+'. The app does not post this itself.');
}
function lkBootResults(){
  if(!lkIsResHash())return false;
  const n=lkResNightFromHash();
  try{lkResultsView(n||undefined)}catch(e){return false}
  return true;
}

const _lkH2H=window.h2hCard;
if(_lkH2H){window.h2hCard=function(){const html=_lkH2H.apply(this,arguments);setTimeout(lkDecorateCard,0);return html}}
const _lkRender=window.render;
if(_lkRender){window.render=function(){if(lkBootReg())return;if(lkBootHome())return;if(lkBootResults())return;return _lkRender.apply(this,arguments)}}
addEventListener('hashchange',()=>{if(lkIsRegHash())lkBootReg();else if(lkIsHomeHash())lkBootHome();else if(lkIsResHash())lkBootResults()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{lkBootReg()||lkBootHome()||lkBootResults()},0));
else setTimeout(()=>{lkBootReg()||lkBootHome()||lkBootResults()},0);

Object.assign(window,{
  LK_CODE,LK_NAME,LK_VENUE,LK_HOURS,LK_R,LK_DATES,LK_NIGHTS,LK_CAP,LK_HOST,
  LK_PUBLIC_BASE,LK_REGISTER_HASH,LK_HOME_HASH,LK_POSTER_CODE,LK_LANES,LK_REG_CAP,LK_COHOST_NAME,LK_COHOST_ID,LK_HOST_REG_ID,LK_HOST_REG_NAME,LK_REG_KEY,LK_FEE,LK_FRESH,LK_CLEAR,lkFresh,lkClearLive,lkSeedHost,lkRegKept,
  lkIs,lkNights,lkRound,lkNight7,lkDate,lkLabel,lkRecord,lkSeed,lkEnsure,lkGet,lkView,lkFmtD,lkDecorateCard,lkJoinGuard,lkInvite,lkAccept,lkAddGuest,lkIsMember,lkIsCoHostName,lkCoHostOn,lkMarkCoHost,lkCanHost,LK_RULES,lkRulesHTML,
  lkEventHomeUrl,lkRegisterUrl,lkQrSvg,lkPosterOk,lkRegister,lkRegClosed,lkAlreadyRegistered,lkDeviceRegistered,lkIsHomeHash,lkBootHome,lkIsHostPerson,lkIsOrganiser,lkSeedCoHost,lkDropHostIfUnregistered,lkStripHostEntries,lkApplyReg,lkApplyDrop,lkDropArcher,lkStripDropped,lkPullReg,lkNightSignups,lkPickerOrder,lkDefaultNight,lkKnownRegistrants,lkRegisterView,lkBootReg,lkIsRegHash,lkRegInbox,lkNormName,lkMergeNight,lkPickBest,lkTable,lkTableHTML,lkLastScoredNight,lkStandSubtitle,lkBindStandUI,lkPrintStandings,lkStandingsPng,lkShareStandings,lkTens,lkNightPaid,lkPot,lkPaidCount,lkSetPaid,lkPublishPaid,lkSyncOnce,lkSyncStart,lkPotHTML,lkPaidTonight,lkPriorRows,lkHasPriorResult,lkOrderPaid,lkGroupSizes,lkChunkFour,lkAssignGroups,lkSetGroups,lkAddToGroup,lkScoreGroup,lkGroupHTML,lkHashPw,lkAuthed,lkMarkAuth,lkSetPassword,lkUnlock,lkUnlockView,lkPwHTML,lkResultsUrl,lkResultsView,lkShareResults,lkBootResults,lkIsResHash,lkNightScores,lkShootDates,lkPaidAuthority,lkMineIds,lkRememberArcher,lkHostPhone,lkPinSalt,lkPinHash,lkPinOk,lkPinOf,lkPinLocked,lkPinFail,lkPinClearFails,lkSetPin,lkResetPin,lkPublicReg,LK_MINE_KEY
});
})();
