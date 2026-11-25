/* Lingkana scoring flow for the /test/ page: one job per screen, like a simple event scorer.
   Data, relay, codes and the scoring password stay in lingkana.js / league.js. */
(function(){
  const CLASSES=['Compound','Recurve','Barebow','Longbow'];
  const DIVS=['Open','Women','Men','Junior'];
  const ROUNDS=['Lancaster 660','150 warm-up (not scored)','Ladder shoot-up'];
  const CLAIM_MS=6*60*60*1000;

  const $id=id=>document.getElementById(id);
  const esc=s=>typeof h==='function'?h(s):String(s==null?'':s).replace(/[&<>"]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  const me=()=>(typeof h2hMe==='function'&&h2hMe())||(typeof TESTER!=='undefined'&&TESTER&&TESTER.id)||'';
  const myName=()=>{try{return sessionStorage.getItem('scoretool.lk.scorer')||''}catch(e){return''}};
  const setMyName=n=>{try{sessionStorage.setItem('scoretool.lk.scorer',n)}catch(e){}};
  const myId=()=>{try{return sessionStorage.getItem('scoretool.lk.scorerId')||''}catch(e){return''}};
  const setMyId=id=>{try{if(id)sessionStorage.setItem('scoretool.lk.scorerId',id);else sessionStorage.removeItem('scoretool.lk.scorerId')}catch(e){}};
  const appEl=()=>typeof app!=='undefined'?app:document.getElementById('app');
  /* Viewing roster/scoresheets/ladder/pot stays open. Scoring (pick a target, tick, enter
     or publish scores) needs a registered name+PIN, the shared passcode, or the host phone. */
  function scoringOk(lg){
    lg=lg||(typeof lkEnsure==='function'&&lkEnsure())||null;
    if(typeof lkScoringAllowed==='function')return lkScoringAllowed(lg);
    if(typeof lkCanHost==='function'&&lkCanHost(lg))return true;
    if(typeof lkHostPhone==='function'&&lkHostPhone(lg))return true;
    return typeof lkAuthed==='function'&&!!lg&&lkAuthed(lg);
  }
  function needScoreLogin(lg){
    if(scoringOk(lg))return false;
    lkFullLogin();
    const msg=document.getElementById('lkpwmsg');
    if(msg&&!String(msg.textContent||'').trim())msg.textContent='Sign in with your name and PIN, or the scoring passcode, to score.';
    return true;
  }

  function hideChrome(on){
    document.body.classList.toggle('lk-flow',!!on);
    window._lkFlow=!!on;
    const tabs=document.getElementById('tabs');
    if(tabs)tabs.hidden=!!on;
    const hd=document.querySelector('header.top');
    if(hd)hd.hidden=!!on;
    if(on)ensureTheme();
    else{const b=document.getElementById('lktheme');if(b)b.hidden=true}
  }
  /* Same control as the main app: scoretool.theme, painted by setTheme / paintTheme. */
  function ensureTheme(){
    let b=document.getElementById('lktheme');
    if(!b){
      b=document.createElement('button');
      b.type='button';
      b.id='lktheme';
      b.className='labtheme';
      b.onclick=()=>{
        const cur=typeof curTheme==='function'?curTheme():(document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light');
        const next=cur==='dark'?'light':'dark';
        if(typeof setTheme==='function')setTheme(next);
        else{
          try{localStorage.setItem('scoretool.theme',next)}catch(e){}
          document.documentElement.setAttribute('data-theme',next);
          if(typeof paintTheme==='function')paintTheme(next);
        }
      };
      document.body.appendChild(b);
    }
    b.hidden=false;
    if(typeof paintTheme==='function'&&typeof curTheme==='function')paintTheme(curTheme());
    else{
      const t=document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';
      b.title=t==='dark'?'Switch to light mode':'Switch to dark mode';
      b.setAttribute('aria-label',b.title);
      b.textContent=t==='dark'?'Light':'Dark';
    }
  }
  function bar(left,right){
    return `<div class="lk-bar">${left||''}${right||''}</div>`;
  }
  function btn(id,lab,kind,extra){
    return `<button type="button" class="lk-btn ${kind||'green'}" id="${id}" ${extra||''}>${lab}</button>`;
  }
  function nightLabel(i){
    const d=LK_DATES[i], n=i+1;
    const rd=n===7?'150 warm-up (not scored), then ladder shoot-up for the top 12':LK_R;
    return `Night ${n} · ${typeof lkFmtD==='function'?lkFmtD(d):d} · ${rd}`;
  }
  function claimKey(lg,w){return (typeof lkNightKey==='function'&&lkNightKey(lg,w))||(LK_DATES[(w||1)-1]||'')}
  function claims(lg,w){
    const k=claimKey(lg,w), bag=((lg.claim||{})[k])||{}, now=Date.now(), out={};
    for(const id in bag){const c=bag[id];if(c&&c.by&&(now-(c.at||0))<CLAIM_MS)out[id]=c}
    return out;
  }
  function claimedByOther(lg,w,id){
    const c=claims(lg,w)[id], who=me();
    if(!c||!c.by||c.by===who)return null;
    return c;
  }
  function applyClaim(d,lg){
    if(!d||!lg||d.code!==lg.code||!d.night||!d.id)return false;
    lg.claim=lg.claim||{};lg.claim[d.night]=lg.claim[d.night]||{};
    const cur=lg.claim[d.night][d.id];
    if(d.on){
      if(cur&&cur.by&&cur.by!==d.by&&(cur.at||0)>=(d.at||0)&&(Date.now()-(cur.at||0))<CLAIM_MS)return false;
      lg.claim[d.night][d.id]={by:d.by,name:d.name||d.by,at:d.at||Date.now()};
      return true;
    }
    if(cur&&cur.by&&cur.by!==d.by&&(Date.now()-(cur.at||0))<CLAIM_MS)return false;
    delete lg.claim[d.night][d.id];
    return true;
  }
  function setClaim(lg,w,id,on){
    if(!scoringOk(lg))return 'Sign in with your name and PIN, or the scoring passcode, to score.';
    const k=claimKey(lg,w), who=me(), name=myName()||(typeof TESTER!=='undefined'&&TESTER&&TESTER.name)||who||'Scorer';
    lg.claim=lg.claim||{};lg.claim[k]=lg.claim[k]||{};
    const cur=lg.claim[k][id];
    if(on){
      if(cur&&cur.by&&cur.by!==who&&(Date.now()-(cur.at||0))<CLAIM_MS)return 'That archer is already selected on another phone.';
      lg.claim[k][id]={by:who,name,at:Date.now()};
    }else{
      if(cur&&cur.by&&cur.by!==who&&(Date.now()-(cur.at||0))<CLAIM_MS)return 'Another scorer has this archer.';
      delete lg.claim[k][id];
    }
    lg.claimt=Date.now();lg.dirty=1;
    if(typeof save==='function')save();
    try{
      if(typeof h2hPost==='function'&&typeof lgTopic==='function'){
        Promise.resolve(h2hPost(lgTopic(lg.code),{k:'lkclaim',code:lg.code,night:k,id,on:on?1:0,by:who,name,at:Date.now(),t:Date.now()})).catch(function(){});
      }
    }catch(e){}
    return '';
  }
  function mergeClaims(lg,d){
    if(!d||!d.claim||typeof d.claim!=='object')return false;
    let ch=false;
    lg.claim=lg.claim||{};
    for(const night in d.claim){
      const bag=d.claim[night];if(!bag||typeof bag!=='object')continue;
      lg.claim[night]=lg.claim[night]||{};
      for(const id in bag){
        const rec=bag[id];
        if(!rec){if(lg.claim[night][id]){delete lg.claim[night][id];ch=true}continue}
        const cur=lg.claim[night][id];
        if(rec.by){
          if(cur&&cur.by&&cur.by!==rec.by&&(cur.at||0)<=CLAIM_MS+Date.now()&&(cur.at||0)<(Date.now())&&(cur.at||0)<=(rec.at||0)&& (Date.now()-(cur.at||0))<CLAIM_MS && (cur.at||0)<=(rec.at||0) && (cur.at||0)<(rec.at||0)===false){
            /* first-claim wins if still fresh */
          }
          if(cur&&cur.by&&cur.by!==rec.by&&(Date.now()-(cur.at||0))<CLAIM_MS&&(cur.at||0)<=(rec.at||0)&& (cur.at||0)<(rec.at||0) ){
            /* incoming is later — keep earlier claim */
            continue;
          }
          if(cur&&cur.by&&cur.by!==rec.by&&(Date.now()-(cur.at||0))<CLAIM_MS&&(cur.at||0)<=(rec.at||0)){
            if((cur.at||0)<(rec.at||0))continue;
          }
          if(cur&&cur.by&&cur.by!==rec.by&&(Date.now()-(cur.at||0))<CLAIM_MS){
            if((cur.at||0)<=(rec.at||0))continue;
          }
          lg.claim[night][id]={by:rec.by,name:rec.name||rec.by,at:rec.at||0};
          ch=true;
        }
      }
    }
    return ch;
  }
  /* Cleaner first-claim-wins merge for a snapshot bag */
  function mergeClaimBag(lg,incoming){
    if(!incoming||typeof incoming!=='object')return false;
    let ch=false;
    lg.claim=lg.claim||{};
    for(const night in incoming){
      const bag=incoming[night];if(!bag||typeof bag!=='object')continue;
      lg.claim[night]=lg.claim[night]||{};
      for(const id in bag){
        const rec=bag[id], cur=lg.claim[night][id];
        if(!rec||!rec.by){
          if(cur&&(!cur.by||cur.by===((rec&&rec.by)||''))){delete lg.claim[night][id];ch=true}
          continue;
        }
        if(cur&&cur.by&&cur.by!==rec.by&&(Date.now()-(cur.at||0))<CLAIM_MS&&(cur.at||0)<=(rec.at||Date.now()))continue;
        if(!cur||(rec.at||0)>(cur.at||0)||cur.by!==rec.by){
          lg.claim[night][id]={by:rec.by,name:rec.name||rec.by,at:rec.at||Date.now()};
          ch=true;
        }
      }
    }
    return ch;
  }

  function signups(lg,w){
    if(typeof lkNightSignups==='function')return lkNightSignups(lg,w)||[];
    const k=claimKey(lg,w);
    return ((lg.reg||{})[k]||[]).slice();
  }
  function targetOf(rec,i){
    if(rec&&rec.target)return String(rec.target);
    return String(Math.floor(i/4)+1);
  }
  function grouped(list){
    const m={};
    list.forEach((rec,i)=>{const t=targetOf(rec,i);(m[t]=m[t]||[]).push(rec)});
    return Object.keys(m).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).map(t=>({t,rows:m[t]}));
  }
  function nightOf(lg){
    const max=isOnion()?6:((typeof LK_NIGHTS==='number'&&LK_NIGHTS)||7);
    const w=+(window._lkFlowNight||0);
    if(w>=1&&w<=max)return w;
    const cur=(typeof lgWeek==='function'?lgWeek(lg):1)||1;
    return Math.min(max, cur);
  }
  function setNight(w){window._lkFlowNight=+w||1;try{sessionStorage.setItem('scoretool.lk.night',String(window._lkFlowNight))}catch(e){}}


  function evCode(code){
    return (typeof LK_CODE==='string'&&LK_CODE)||'LINGKN26';
  }
  /* 25 Nov 2026: the old second league is removed; every event here is Lingkana. */
  function isOnion(){return false}
  function setEv(code){window._lkEvent=evCode(code);return window._lkEvent}
  function evName(code){
    return (typeof LK_NAME==='string'&&LK_NAME)||'Lingkana League';
  }
  function backToList(){
    window._lkEvent=null;
    if(shouldBoot()){list();return}
    hideChrome(false);
    window._lkFlow=false;
    if(typeof nav==='function')nav((typeof view!=='undefined'&&view==='lab_leagues')?'lab_leagues':'score');
    else if(typeof score==='function')score();
  }
  /* Leave the event flow without history.back(): #lk-home can be the only entry. League rows and the scorer session stay. */
  function backToApp(){
    window._lkLeftHome=1;
    try{
      const u=new URL(location.href);
      const page=u.searchParams.get('page');
      if(page==='lk-home'||page==='lingkana'||page==='lk-register')u.searchParams.delete('page');
      if(/\/test(\/|$)/.test(u.pathname))u.searchParams.set('app','1');
      u.hash='';
      history.replaceState(null,'',u.pathname+u.search);
    }catch(e){}
    hideChrome(false);
    window._lkFlow=false;
    if(typeof nav==='function')nav('home');
    else if(typeof render==='function')render();
  }
  function activeSession(){
    if(isOnion())return null;
    const lg=typeof lkEnsure==='function'?lkEnsure():null;
    if(!lg||(typeof lkAuthed==='function'&&!lkAuthed(lg)))return null;
    const id=myId();
    if(!id)return null;
    let w=0;
    try{w=+sessionStorage.getItem('scoretool.lk.night')||0}catch(e){}
    if(!(w>=1&&w<=6))w=+(window._lkFlowNight||0);
    const cur=Math.min(6,(typeof lgWeek==='function'?lgWeek(lg):1)||1);
    if(!(w>=1&&w<=6))w=cur;
    if(w<1||w>6)return null;
    let ids=null,target=0;
    const G=((((lg.grp||{})[w]||{}).g)||[]);
    for(let i=0;i<G.length;i++){
      if((G[i]||[]).map(String).includes(String(id))){ids=(G[i]||[]).map(String);target=i+1;break}
    }
    if(!ids&&window._lgE&&+window._lgE.w===w&&(window._lkScoreIds||[]).map(String).includes(String(id))){
      ids=(window._lkScoreIds||[]).map(String);
      target=+(window._lkTarget||0);
    }
    if(!ids||!ids.length)return null;
    const need=(typeof lgInfo==='function'&&lgInfo(lg,w).ends)||20;
    const done=ids.every(aid=>{
      const e=(typeof lgEnt==='function'&&lgEnt(lg,aid,w))||{e:[]};
      const n=((e.e)||[]).filter(z=>z&&z.length===3).length;
      return n>=(e.nEnds||need);
    });
    if(done)return null;
    return {lg,w,ids,target,id,name:myName()};
  }
  function resumeScoring(){
    const s=activeSession();
    if(!s){home(evCode());return}
    setEv(s.lg.code);
    setNight(s.w);
    window._lkTarget=s.target;
    window._lkScoreIds=s.ids.slice();
    window._lkPicked=s.ids.slice();
    window._lgE={code:s.lg.code,w:+s.w,ids:s.ids.slice()};
    if(!window._lgAct||s.ids.indexOf(window._lgAct)<0)window._lgAct=s.id;
    startScoring(s.lg,s.w,s.ids.slice());
  }
  function enterFromApp(code){
    window._lkLeftHome=0;
    setEv(code);
    if(!isOnion(code)){
      if(typeof lkEnsure==='function')lkEnsure();
      if(activeSession()){resumeScoring();return}
    }
    home(code);
  }

  function list(){
    hideChrome(true);
    window._lkEvent=null;
    const el=appEl();if(!el)return;
    el.innerHTML=`<div class="lkf" id="lkevlist">
      <h1>Leagues</h1>
      <p class="small muted">Open a league to log in, register, review scores or read the rules.</p>
      ${typeof lgEventCardsHTML==='function'?lgEventCardsHTML():''}
    </div>`;
    el.querySelectorAll('[data-evopen]').forEach(b=>b.onclick=()=>home(b.getAttribute('data-evopen')));
  }

  function home(code){
    window._lkLeftHome=0;
    window._lkNamesOpen=0;
    setEv(code);
    if(isOnion()){if(typeof lgSeed==='function')lgSeed()}
    else if(typeof lkEnsure==='function')lkEnsure();
    hideChrome(true);
    if(!isOnion()&&typeof lkSyncStart==='function')lkSyncStart();
    const el=appEl();if(!el)return;
    const onion=isOnion();
    const sess=!onion&&activeSession();
    const logo='img/lingkana-logo.png';
    const alt='Lingkana Indoor Archery';
    const lgp=!onion&&typeof lkGet==='function'?lkGet():null;
    const pot=lgp&&typeof lkPot==='function'?lkPot(lgp):null;
    el.innerHTML=`<div class="lkf" id="lkhome" data-ev="${esc(evCode())}">
      <div class="lk-evhome">
        <div class="lk-evbrand ${onion?'onion':'lingkana'}">
          <img src="${logo}" alt="${esc(alt)}">
          <p class="lk-evname">${esc(evName())}</p>
        </div>
        ${pot?`<button type="button" class="lk-potbanner" id="lkpotbanner"><span class="lk-potbanner-shine"></span><span class="lk-potbanner-icon">🏆</span><span class="lk-potbanner-text"><span class="lk-potbanner-label">Prize Pot</span><span class="lk-potbanner-amt">$${pot.pot}</span></span></button>`:''}
        <div class="lk-home">
          ${sess?btn('lkresume','Resume scoring','green'):''}
          ${btn('lklogin','Login to Event','green')}
          ${btn('lkereg','Event Registration','green')}
          ${btn('lkreview','Review Scoresheets','grey')}
          ${onion?'':btn('lkroster','Registered Archers','grey')}
          ${btn('lkrules','About','grey')}
          ${btn('lkhomeapp','Back to ScoreTool','grey')}
        </div>
        ${bar(btn('lkhomeback','Back to leagues','grey'),'')}
        ${onion?'':`<div id="lkgetbox" style="margin:16px 0 4px;text-align:center">
          <p><a class="lk-btn grey" id="lkgetapp" href="${esc((typeof LK_PUBLIC_BASE==='string'&&LK_PUBLIC_BASE)||'./')}">Get ScoreTool</a></p>
          <p class="small muted">To keep it: tap Share or the ⋮ menu, then Add to Home Screen.</p>
        </div>`}
      </div>
    </div>`;
    if($id('lkresume'))$id('lkresume').onclick=()=>resumeScoring();
    $id('lklogin').onclick=()=>{if(activeSession()){resumeScoring();return}login()};
    $id('lkereg').onclick=()=>regEntry();
    $id('lkreview').onclick=()=>review();
    if($id('lkpotbanner'))$id('lkpotbanner').onclick=()=>{if(typeof lkPotView==='function')lkPotView()};
    if($id('lkroster'))$id('lkroster').onclick=()=>roster();
    $id('lkrules').onclick=()=>rules();
    $id('lkhomeapp').onclick=()=>backToApp();
    $id('lkhomeback').onclick=()=>backToList();
  }


  /* The full name-search + personal PIN + event passcode sign-in. Ordinary scoring uses this
     (or the passcode on the Score tonight screen) before a target can be picked. The host phone
     and a host-capable Nate Evans session skip it. */
  async function lkFullLogin(){
    if(typeof lkSyncStart==='function')lkSyncStart();
    if(typeof lkSyncOnce==='function'){try{await lkSyncOnce()}catch(e){}}
    const lg=typeof lkEnsure==='function'?lkEnsure():null;
    hideChrome(true);
    const el=appEl();if(!el)return;
    let w=nightOf(lg||{});
    if(w>6)w=1;
    const ev=lg?lg.name:(typeof LK_NAME==='string'?LK_NAME:'Lingkana League');
    const rows=(nightSignups(lg,w)||[]).filter(r=>r&&r.id);
    const seen=new Set();
    const names=[];
    rows.forEach(r=>{
      const id=String(r.id);
      if(seen.has(id))return;
      seen.add(id);
      names.push({id,name:r.name||((typeof lgName==='function'&&lgName(r.id))||id)});
    });
    if(typeof lkIsCoHostName!=='function'||!names.some(n=>lkIsCoHostName(n.name))){
      names.push({id:(typeof LK_COHOST_ID==='string'&&LK_COHOST_ID)||'lkhost:nate', name:(typeof LK_COHOST_NAME==='string'&&LK_COHOST_NAME)||'Nate Evans'});
    }
    const suggested=window._lkSuggestPick||null;
    window._lkSuggestPick=null;
    if(suggested&&suggested.name){
      const want=String(suggested.name).trim().toLowerCase();
      const already=names.find(n=>String(n.id)===String(suggested.id||'')||String(n.name||'').trim().toLowerCase()===want);
      if(!already){
        names.push({id:String(suggested.id||('lkpick:'+want)),name:suggested.name});
      }
    }
    names.sort((a,b)=>String(a.name).localeCompare(String(b.name),'en'));
    if(suggested&&suggested.name){
      const want=String(suggested.name).trim().toLowerCase();
      const rec=names.find(n=>String(n.id)===String(suggested.id||'')||String(n.name||'').trim().toLowerCase()===want);
      if(rec)window._lkLoginId=rec.id;
    }
    const hostPhone=typeof lkHostPhone==='function'&&lkHostPhone(lg);
    /* Nate Evans is a host. A scorer phone does not ask him for a PIN before the paid ticks. */
    const cohostRec=rec=>!!rec&&(String(rec.id)===((typeof LK_COHOST_ID==='string'&&LK_COHOST_ID)||'lkhost:nate')||(typeof lkIsCoHostName==='function'&&lkIsCoHostName(rec.name)));
    const showAll=!!window._lkNamesOpen||hostPhone;
    const mine=new Set((typeof lkMineIds==='function'?lkMineIds():[]).map(String));
    const shown=showAll?names:names.filter(n=>mine.has(String(n.id)));
    let pick=String(window._lkLoginId||'');
    if(pick&&!shown.some(n=>n.id===pick))pick='';
    if(!pick&&shown.length===1)pick=shown[0].id;
    window._lkLoginId=pick;
    const shownIds=new Set(shown.map(n=>String(n.id)));
    const nameBtn=n=>{
      const on=String(window._lkLoginId||pick)===String(n.id);
      return `<button type="button" class="lk-namebtn${on?' on':''}" data-lkscorer="${esc(n.id)}" data-lkname="${esc(n.name)}" aria-pressed="${on?'true':'false'}">${esc(n.name)}</button>`;
    };
    const buttons=shown.map(nameBtn).join('');
    const empty=shown.length?'':(showAll
      ?`<p id="lknonames">No one has registered for this night yet.</p>`
      :`<p id="lknonames">This phone has no saved archer yet. Register, search for your name, or tap Show all names.</p>`);
    const reveal=hostPhone?'':`<p><button type="button" class="lk-host" id="lkshowall">Not you? Show all names</button></p>`;
    const reset=hostPhone?`<p><button type="button" class="lk-host" id="lkpinreset">Reset PIN</button></p>`:'';
    /* A name that already has a PIN logs in with the night, the name and that PIN. The event passcode is only for a name that still has no PIN, and for a host phone. */
    const needsPass=id=>{
      if(hostPhone)return true;
      const rec=names.find(n=>String(n.id)===String(id));
      if(!rec||cohostRec(rec))return !!rec;
      const info=typeof lkPinOf==='function'?lkPinOf(lg,rec.id):null;
      return !(info&&info.pinHash);
    };
    el.innerHTML=`<div class="lkf" id="lkloginpage">
      <h1>Login</h1>
      <label for="lkevent">Select Event</label>
      <select id="lkevent"><option value="${esc(typeof LK_CODE==='string'?LK_CODE:'LINGKN26')}" selected>${esc(ev)}</option></select>
      <label for="lknight">Shoot night</label>
      <select id="lknight">${nightChoices(lg,w)}</select>
      <div id="lkcred">
        <div id="lkpinbox"></div>
        <div id="lkpassbox" hidden><label for="lkpw">Event passcode</label><input id="lkpw" type="password" autocomplete="off" value=""></div>
        <p class="lk-msg" id="lkpwmsg" role="alert"></p>
      </div>
      <p class="small" id="lkscorerlabel">Your name</p>
      ${empty}
      <div class="lk-namelist" id="lkscorernames" role="listbox" aria-label="Your name">${buttons}</div>
      <label for="lkfind">Find a name</label>
      <input id="lkfind" type="search" autocomplete="off" placeholder="Search all names">
      <p class="small" id="lkfindnone" hidden>No name matches.</p>
      ${reveal}
      ${reset}
      ${bar(btn('lkloginback','Back','grey'),btn('lkpwgo','Login','green'))}
    </div>`;
    const paintPass=id=>{
      const box=$id('lkpassbox');if(!box)return;
      /* Visible with no name (passcode-only scoring) or when this name still needs the passcode. */
      box.hidden=!!id&&!needsPass(id);
    };
    const paintPin=id=>{
      const box=$id('lkpinbox');if(!box)return;
      const rec=names.find(n=>n.id===id);
      if(hostPhone||cohostRec(rec)||!rec){box.hidden=true;box.innerHTML='';paintPass(id);return}
      const left=typeof lkPinLocked==='function'?lkPinLocked(rec.id):0;
      if(left){
        box.hidden=false;
        box.innerHTML=`<p class="lk-msg" id="lkpinlock">Too many wrong PINs. This name is locked on this phone for a minute.</p>`;
        paintPass(id);
        return;
      }
      const info=typeof lkPinOf==='function'?lkPinOf(lg,rec.id):null;
      box.hidden=false;
      if(info&&info.pinHash){
        box.innerHTML=`<label for="lkpin">Your PIN</label><input id="lkpin" type="password" inputmode="numeric" maxlength="4" autocomplete="off">`;
      }else{
        box.innerHTML=`<p class="small" id="lkpinset">This name has no PIN yet. Set one to log in.</p><label for="lkpin">4-digit PIN</label><input id="lkpin" type="password" inputmode="numeric" maxlength="4" autocomplete="off"><label for="lkpin2">PIN again</label><input id="lkpin2" type="password" inputmode="numeric" maxlength="4" autocomplete="off">`;
      }
      paintPass(id);
      bindEnter();
    };
    let go=async()=>{};
    const liftField=n=>{
      if(!n)return;
      const sc=document.getElementById('scroller');
      const bar=el.querySelector('.lk-bar');
      if(!sc||!bar)return;
      const gap=12;
      const label=n.previousElementSibling&&n.previousElementSibling.tagName==='LABEL'?n.previousElementSibling:n;
      const r=n.getBoundingClientRect();
      const top=label.getBoundingClientRect().top;
      const topLimit=(window.visualViewport?visualViewport.offsetTop:0)+8;
      const botLimit=Math.min(bar.getBoundingClientRect().top, window.visualViewport?visualViewport.offsetTop+visualViewport.height:window.innerHeight)-gap;
      if(r.bottom>botLimit)sc.scrollTop+=r.bottom-botLimit;
      else if(top<topLimit)sc.scrollTop-=topLimit-top;
    };
    const bindEnter=()=>{
      ['lkpin','lkpin2','lkpw'].forEach(i=>{
        const n=$id(i);if(!n)return;
        n.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}};
        n.onfocus=()=>{setTimeout(()=>liftField(n),60);setTimeout(()=>liftField(n),320)};
      });
    };
    if(!window._lkLoginLift){
      window._lkLoginLift=1;
      const again=()=>{
        const n=document.activeElement;
        if(!n||!n.closest||!n.closest('#lkloginpage'))return;
        const sc=document.getElementById('scroller');
        const bar=document.querySelector('#lkloginpage .lk-bar');
        if(!sc||!bar)return;
        const r=n.getBoundingClientRect();
        const bot=Math.min(bar.getBoundingClientRect().top, window.visualViewport?visualViewport.offsetTop+visualViewport.height:window.innerHeight)-12;
        if(r.bottom>bot)sc.scrollTop+=r.bottom-bot;
      };
      if(window.visualViewport)visualViewport.addEventListener('resize',()=>setTimeout(again,40));
    }
    paintPin(pick);
    if($id('lkloginback'))$id('lkloginback').onclick=()=>home(evCode());
    if($id('lknight'))$id('lknight').onchange=()=>{setNight(+$id('lknight').value);lkFullLogin()};
    const wireNames=()=>{
      el.querySelectorAll('[data-lkscorer]').forEach(b=>b.onclick=()=>{
        window._lkLoginId=b.getAttribute('data-lkscorer');
        el.querySelectorAll('[data-lkscorer]').forEach(x=>{
          const on=x===b;
          x.classList.toggle('on',on);
          x.setAttribute('aria-pressed',on?'true':'false');
        });
        paintPin(window._lkLoginId);
        onlyPicked(true);
        fitList();
      });
    };
    /* Once a name is tapped, show only that name. Change name brings the full list back. */
    const onlyPicked=on=>{
      const id=String(window._lkLoginId||'');
      if(!id)on=false;
      el.querySelectorAll('[data-lkscorer]').forEach(x=>{x.hidden=on&&x.getAttribute('data-lkscorer')!==id});
      const find=$id('lkfind'),lab=el.querySelector('label[for="lkfind"]'),all=$id('lkshowall');
      [find,lab,all&&all.parentNode].forEach(n=>{if(n)n.hidden=on});
      let ch=$id('lkchangename');
      if(on&&!ch){
        const box=$id('lkscorernames');
        if(box){const p=document.createElement('p');p.innerHTML='<button type="button" class="lk-host" id="lkchangename">Change name</button>';box.insertAdjacentElement('afterend',p);ch=$id('lkchangename');
          ch.onclick=()=>{onlyPicked(false);if(find){find.value='';drawNames('')}fitList()}}
      }
      if(ch)ch.parentNode.hidden=!on;
    };
    const drawNames=q=>{
      const query=String(q||'').trim().toLowerCase();
      const open=!!window._lkNamesOpen||hostPhone;
      const list=names.filter(n=>query?String(n.name).toLowerCase().includes(query):(open||shownIds.has(String(n.id))));
      const box=$id('lkscorernames');
      if(box)box.innerHTML=list.map(nameBtn).join('');
      wireNames();
      const note=$id('lknonames');if(note)note.hidden=!!list.length;
      const none=$id('lkfindnone');if(none)none.hidden=!query||!!list.length;
    };
    const fitList=()=>{
      const list=$id('lkscorernames');
      const bar=el.querySelector('.lk-bar');
      if(!list||!bar)return;
      const room=bar.getBoundingClientRect().top-list.getBoundingClientRect().top-8;
      if(room>72)list.style.maxHeight=Math.min(320, Math.floor(room))+'px';
    };
    wireNames();
    if(window._lkLoginId&&el.querySelectorAll('[data-lkscorer]').length>1)onlyPicked(true);
    fitList();
    const pinFocus=$id('lkpin');if(pinFocus&&suggested)setTimeout(()=>pinFocus.focus(),0);
    if($id('lkfind')){
      /* A phone keyboard's own autofill/suggestion bar can insert the full name without firing
         input, so this also redraws on change and blur to catch that. */
      const find=$id('lkfind');
      find.oninput=()=>drawNames(find.value);
      find.onchange=()=>drawNames(find.value);
      find.onblur=()=>drawNames(find.value);
    }
    if($id('lkshowall'))$id('lkshowall').onclick=()=>{
      window._lkNamesOpen=1;
      lkFullLogin();
    };
    if($id('lkpinreset'))$id('lkpinreset').onclick=()=>{
      const id=String(window._lkLoginId||'');
      const msg=$id('lkpwmsg');
      if(!id){if(msg)msg.textContent='Tap a name, then Reset PIN.';return}
      const err=typeof lkResetPin==='function'?lkResetPin(id):'PIN reset is not available on this phone.';
      if(err){if(msg)msg.textContent=err;return}
      if(msg)msg.textContent='PIN cleared. They set a new one at the next login.';
      paintPin(id);
    };
    go=async()=>{
      const id=String(window._lkLoginId||'');
      const rec=names.find(n=>n.id===id);
      const pw=($id('lkpw')&&$id('lkpw').value)||'';
      const msg=$id('lkpwmsg');
      if(!rec){
        if(pw){
          const pm=typeof lkUnlock==='function'?await lkUnlock(pw):'Scoring is not available on this phone.';
          if(pm){if(msg)msg.textContent=pm;return}
          setNight(+($id('lknight')&&$id('lknight').value)||w);
          window._lkTarget=0;window._lkPicked=[];
          selectArchersOnion();
          return;
        }
        if(msg)msg.textContent='Tap your name, or enter the scoring passcode.';return
      }
      const skipPin=hostPhone||cohostRec(rec);
      if(!skipPin){
        const left=typeof lkPinLocked==='function'?lkPinLocked(rec.id):0;
        if(left){if(msg)msg.textContent='Too many wrong PINs. This name is locked on this phone for a minute.';return}
        const info=typeof lkPinOf==='function'?lkPinOf(lg,rec.id):null;
        const typed=($id('lkpin')&&$id('lkpin').value)||'';
        if(!(info&&info.pinHash)){
          const again=($id('lkpin2')&&$id('lkpin2').value)||'';
          if(!/^\d{4}$/.test(typed)){if(msg)msg.textContent='Enter a 4-digit PIN.';return}
          if(typed!==again){if(msg)msg.textContent='Those PINs do not match.';return}
          /* 25 Nov 2026: a first PIN is only saved after the event passcode checks out */
          {const pm=typeof lkUnlock==='function'?await lkUnlock(pw):'Scoring is not available on this phone.';if(pm){if(msg)msg.textContent=pm;return}}
          try{
            const salt=lkPinSalt();
            const hash=await lkPinHash(rec.name,typed,salt);
            if(typeof lkSetPin==='function')lkSetPin(lg,rec.id,rec.name,hash,salt);
          }catch(e){if(msg)msg.textContent='Could not save that PIN on this phone.';return}
        }else{
          let ok=false;
          try{ok=await lkPinOk(rec.name,typed,info.pinSalt,info.pinHash)}catch(e){ok=false}
          if(!ok){
            const until=typeof lkPinFail==='function'?lkPinFail(rec.id):0;
            if(msg)msg.textContent=until?'Too many wrong PINs. This name is locked on this phone for a minute.':'That PIN is not right.';
            if(until)paintPin(rec.id);
            return;
          }
          if(typeof lkPinClearFails==='function')lkPinClearFails(rec.id);
        }
        if(typeof lkMarkAuth==='function'&&lg)lkMarkAuth(lg);
      }
      const cohost=rec.id===((typeof LK_COHOST_ID==='string'&&LK_COHOST_ID)||'lkhost:nate')||(typeof lkIsCoHostName==='function'&&lkIsCoHostName(rec.name));
      setMyName(rec.name);
      setMyId(rec.id);
      if(typeof lkRememberArcher==='function')lkRememberArcher(rec.id);
      setNight(+($id('lknight')&&$id('lknight').value)||w);
      const finish=()=>{
        if(typeof lkMarkCoHost==='function')lkMarkCoHost(cohost);
        if(cohost){review();return}
        showAssigned();
      };
      if(skipPin){
        (typeof lkUnlock==='function'?lkUnlock(pw):Promise.resolve('Scoring is not available on this phone.')).then(m=>{
          if(m){if(msg)msg.textContent=m;return}
          finish();
        });
        return;
      }
      finish();
    };
    $id('lkpwgo').onclick=go;
    bindEnter();
  }

  /* First screen from Login to Event. Viewing is already on the home buttons. Pick a target
     (and the passcode box on this page) is the scoring entry: a registered name+PIN or the
     shared passcode is required, unless this is the host phone. */
  async function login(){
    if(typeof lkSyncStart==='function')lkSyncStart();
    if(typeof lkSyncOnce==='function'){try{await lkSyncOnce()}catch(e){}}
    const lg=typeof lkEnsure==='function'?lkEnsure():null;
    hideChrome(true);
    const el=appEl();if(!el)return;
    let w=nightOf(lg||{});
    if(w>6)w=1;
    const ev=lg?lg.name:(typeof LK_NAME==='string'?LK_NAME:'Lingkana League');
    el.innerHTML=`<div class="lkf" id="lkliteloginpage">
      <h1>Score tonight</h1>
      <label for="lkevent">Select Event</label>
      <select id="lkevent"><option value="${esc(typeof LK_CODE==='string'?LK_CODE:'LINGKN26')}" selected>${esc(ev)}</option></select>
      <label for="lknight">Shoot night</label>
      <select id="lknight">${nightChoices(lg,w)}</select>
      <label for="lkscorer">Your name (optional, shown to the group)</label>
      <input id="lkscorer" type="text" maxlength="40" autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" placeholder="Start typing your name" value="${esc(myName()||'')}">
      <div class="lk-search-list" id="lkscoresugg" role="listbox" aria-label="Matching names" hidden></div>
      <p class="small muted">To score, sign in with a registered name and PIN, or the scoring passcode. Anyone can still review scores, the ladder, the pot and who is registered from the event home.</p>
      <label for="lkscorepw">Scoring passcode (or sign in with a PIN)</label>
      <input id="lkscorepw" type="password" autocomplete="current-password">
      <p class="lk-msg" id="lkpwmsg" role="alert"></p>
      <p><button type="button" class="lk-host" id="lkfulllogin">Host or returning archer? Sign in with a PIN</button></p>
      ${bar(btn('lkloginback','Back','grey'),btn('lkpwgo','Pick a target','green'))}
    </div>`;
    $id('lkloginback').onclick=()=>home(evCode());
    $id('lkfulllogin').onclick=()=>lkFullLogin();
    const go=()=>{
      const n=($id('lkscorer')&&$id('lkscorer').value||'').trim();
      if(n)setMyName(n);
      setNight(+($id('lknight')&&$id('lknight').value)||w);
      window._lkTarget=0;window._lkPicked=[];
      const msg=$id('lkpwmsg');
      if(scoringOk(lg)){selectArchersOnion();return}
      const pw=($id('lkscorepw')&&$id('lkscorepw').value)||'';
      if(pw){
        (typeof lkUnlock==='function'?lkUnlock(pw):Promise.resolve('Scoring is not available on this phone.')).then(m=>{
          if(m){if(msg)msg.textContent=m;return}
          selectArchersOnion();
        });
        return;
      }
      needScoreLogin(lg);
    };
    $id('lkpwgo').onclick=go;
    $id('lkscorer').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}};
    if($id('lkscorepw'))$id('lkscorepw').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}};
    if($id('lknight'))$id('lknight').onchange=()=>{setNight(+$id('lknight').value);login()};
    /* Same 2+ letter name suggestions as Already registered: tap a match, then the PIN. */
    (function bindScoreSuggest(){
      const inp=$id('lkscorer'),sugg=$id('lkscoresugg');if(!inp||!sugg)return;
      const people=[];
      const seen=new Set();
      const add=(id,name)=>{
        const n=(typeof lkCleanName==='function'?lkCleanName(name):String(name||'').trim());
        if(n.length<2)return;
        const key=n.toLowerCase();
        if(seen.has(key))return;
        seen.add(key);
        people.push({id:id||null,name:n});
      };
      if(typeof lkKnownRegistrants==='function')(lkKnownRegistrants(lg)||[]).forEach(a=>add(a.id,a.name));
      add((typeof LK_HOST_REG_ID==='string'&&LK_HOST_REG_ID)||'lkhost:nathe',(typeof LK_HOST_REG_NAME==='string'&&LK_HOST_REG_NAME)||'Nathaniel Stride');
      add((typeof LK_COHOST_ID==='string'&&LK_COHOST_ID)||'lkhost:nate',(typeof LK_COHOST_NAME==='string'&&LK_COHOST_NAME)||'Nate Evans');
      (nightSignups(lg,w)||[]).forEach(r=>{if(r)add(r.id,r.name||((typeof lgName==='function'&&lgName(r.id))||''))});
      const draw=()=>{
        const names=people.map(a=>a.name);
        const hit=(typeof lkNameSuggestHits==='function'?lkNameSuggestHits(inp.value,names):[]);
        const q=(typeof lkCleanName==='function'?lkCleanName(inp.value):String(inp.value||'').trim()).toLowerCase();
        if(hit.length===1&&hit[0].toLowerCase()===q){sugg.hidden=true;sugg.innerHTML='';return}
        sugg.innerHTML=hit.map(n=>`<button type="button" data-scorename="${esc(n)}">${esc(n)}</button>`).join('');
        sugg.hidden=!hit.length;
        sugg.querySelectorAll('[data-scorename]').forEach(b=>{
          b.onpointerdown=e=>e.preventDefault();
          b.onclick=()=>{
            const name=b.getAttribute('data-scorename')||'';
            const rec=people.find(a=>a.name===name);
            inp.value=name;
            sugg.hidden=true;sugg.innerHTML='';
            if(name)setMyName(name);
            window._lkSuggestPick={id:rec&&rec.id||null,name};
            if(rec&&rec.id)window._lkLoginId=rec.id;
            window._lkNamesOpen=1;
            Promise.resolve(lkFullLogin()).then(()=>{const pin=$id('lkpin');if(pin)pin.focus()});
          };
        });
      };
      inp.oninput=draw;inp.onchange=draw;inp.onkeyup=draw;
    })();
  }

  function hostPw(){
    const lg=typeof lkEnsure==='function'?lkEnsure():null;
    if(!lg||typeof lkCanHost!=='function'||!lkCanHost(lg)){login();return}
    hideChrome(true);
    const el=appEl();if(!el)return;
    el.innerHTML=`<div class="lkf" id="lkpwset">
      <h1>Scoring password</h1>
      <p>A default password is already set. Change it here and it is sent to the other scorers' phones. It is stored as a hash, never as the typed secret.</p>
      <label for="lkpwnew">Set or change the password</label>
      <input id="lkpwnew" type="password" autocomplete="new-password">
      <p class="lk-msg" id="lkpwsetmsg" role="alert">${lg.pwHash?'A scoring password is set.':''}</p>
      ${bar(btn('lkpwback','Back','grey'),btn('lkpwsave','Save password','green'))}
    </div>`;
    $id('lkpwback').onclick=()=>login();
    $id('lkpwsave').onclick=()=>{
      const pw=$id('lkpwnew').value||'';
      (typeof lkSetPassword==='function'?lkSetPassword(pw):Promise.resolve('Could not save.')).then(m=>{
        const e=$id('lkpwsetmsg');
        if(e)e.textContent=m||'Password saved.';
        if(!m)$id('lkpwnew').value='';
      });
    };
  }


  const LK_TARGETS=13; /* Lingkana: 13 shooting lanes. */
  function eventLg(){
    if(isOnion()){
      if(typeof lgSeed==='function')lgSeed();
      return (typeof lgGet==='function'&&lgGet(evCode()))||null;
    }
    return (typeof lkEnsure==='function'&&lkEnsure())||null;
  }
  function nightKey(lg,w){
    if(isOnion())return String(w);
    return (typeof lkNightKey==='function'&&lkNightKey(lg,w))||((typeof LK_DATES!=='undefined'&&LK_DATES[(w||1)-1])||'');
  }
  function nightSignups(lg,w){
    if(isOnion())return (((lg||{}).reg)||{})[nightKey(lg,w)]||[];
    if(typeof lkNightSignups==='function')return lkNightSignups(lg,w)||[];
    return signups(lg,w);
  }
  function nightChoices(lg,w){
    if(isOnion()){
      return [1,2,3,4,5,6].map(n=>{
        const d=(lg&&lg.weeks&&lg.weeks[n-1])||'';
        const lab=n<6?('Week '+n):'Day 6 (together)';
        return`<option value="${n}" ${n===w?'selected':''}>${esc(lab)}${d?' · '+esc(d):''}</option>`;
      }).join('');
    }
    return (typeof LK_DATES!=='undefined'?LK_DATES:[]).slice(0,6).map((d,i)=>{
      const when=typeof lkFmtD==='function'?lkFmtD(d).replace(/,?\s*\d{4}/,''):d;
      return`<option value="${i+1}" ${i+1===w?'selected':''}>${esc(when)}</option>`;
    }).join('');
  }
  function archerTarget(lg,w,id){
    const rec=(nightSignups(lg,w)||[]).find(r=>r&&r.id===id);
    const t=rec&&rec.target!=null?+rec.target:0;
    if(t>=1&&t<=LK_TARGETS)return t;
    if(!isOnion()){
      const G=((((lg||{}).grp)||{})[w]||{}).g||[];
      for(let i=0;i<G.length;i++){
        if((G[i]||[]).includes(id)){
          /* Prefer an explicit target stored on the group when present; otherwise this is only a scoring group, not a lane. */
          const gt=G[i]&&G[i]._target;
          if(gt>=1&&gt<=LK_TARGETS)return +gt;
        }
      }
    }
    return 0;
  }
  function setTargets(lg,w,target,ids){
    if(!lg)return 'The league is not on this phone yet.';
    if(!isOnion()&&!scoringOk(lg))return 'Sign in with your name and PIN, or the scoring passcode, to score.';
    const k=nightKey(lg,w);
    lg.reg=lg.reg||{};
    const list=lg.reg[k]||[];
    const set=new Set(ids||[]);
    list.forEach(r=>{
      if(!r||!r.id)return;
      if(set.has(r.id))r.target=+target;
      else if(+r.target===+target)delete r.target;
    });
    lg.reg[k]=list;
    lg.dirty=1;
    if(typeof save==='function')save();
    return '';
  }
  function startScoring(lg,w,ids){
    if(!isOnion()&&needScoreLogin(lg))return;
    window._lkScoreIds=ids.slice();
    window._lkScoreI=0;
    window._lkScoreMode=null;
    window._lgE={code:lg.code,w:+w,ids:ids.slice()};
    window._lgAct=ids[0];
    window._lgHold=null;
    window._lkFlowNight=+w;
    if(isOnion()){
      /* lgView scores the current week (lgWeek). With no week dates set, cw is what that uses. Do not change 300 scoring. */
      if(!((lg.weeks||[]).filter(Boolean).length))lg.cw=+w;
      hideChrome(false);
      window._lkFlow=false;
      if(typeof lgView==='function')lgView(lg.code);
      return;
    }
    if(typeof scoreScreen==='function')scoreScreen();
  }

  /* Lingkana picker only. null means "do not filter".
     Filters the list on screen. Does not drop anyone out of a group already being scored. */
  function paidPickerIds(lg,w){
    if(isOnion())return null;
    if(typeof lkNightPaid!=='function')return null;
    const ids=(lkNightPaid(lg,w)||{}).ids;
    return new Set(Array.isArray(ids)?ids.map(String):[]);
  }
  function pickerSignups(lg,w){
    const list=(nightSignups(lg,w)||[]).slice();
    const paid=paidPickerIds(lg,w);
    if(!paid)return list;
    return list.filter(r=>r&&r.id&&paid.has(String(r.id)));
  }

  /* Lingkana target/group assignment is self-service: an archer picks their own lane (the same
     target grid Onion Shed already uses), then ticks who else they are scoring with on it. This
     replaces the old auto-chunk-by-registration-order assignment, which gave no choice of lane or
     scoring group. lkAssignGroups (the old auto-chunker) is left in lingkana.js, unused here, as a
     host convenience that could still be wired to a button later; it is not called automatically
     any more. Existing targets already set tonight (by the old auto-chunk, before this change) are
     read the same way as new self-picked ones, via archerTarget()/rec.target — no migration of
     past registrations, PINs or targets is needed. */
  async function showAssigned(){
    if(typeof lkSyncOnce==='function'){try{await lkSyncOnce()}catch(e){}}
    const lg=eventLg();
    if(!lg){home();return}
    if(isOnion()){selectArchersOnion();return}
    if(!scoringOk(lg)){login();return}
    const id=myId();
    if(!id){selectArchersOnion();return}
    const w=nightOf(lg);
    hideChrome(true);
    const el=appEl();if(!el)return;
    const title=esc(lg.name||evName());
    const backBar=bar(btn('lkbacklogin','Back','grey'),'');
    const wireBack=()=>{if($id('lkbacklogin'))$id('lkbacklogin').onclick=()=>login()};
    if(+w>=7){
      el.innerHTML=`<div class="lkf" id="lkassigned" data-target="0"><h1>${title}</h1><p>Night 7 scoring is not open yet.</p>${backBar}</div>`;
      wireBack();return;
    }
    const signed=(nightSignups(lg,w)||[]).find(r=>r&&String(r.id)===String(id));
    const who=esc((signed&&signed.name)||myName()||'');
    if(!signed){
      el.innerHTML=`<div class="lkf" id="lkassigned" data-target="0"><h1>No target yet</h1><p>Your name is not registered for this night.</p>${backBar}</div>`;
      wireBack();return;
    }
    const paidIds=typeof paidPickerIds==='function'?paidPickerIds(lg,w):null;
    if(paidIds&&!paidIds.has(String(id))){
      el.innerHTML=`<div class="lkf" id="lkassigned" data-target="0">
        <h1>No target yet</h1>
        <p>${who}, you are registered for this night, but you are not on the host's paid list, so you are not in a group.</p>
        <p class="small muted">The host ticks who has paid on the paid list. Unpaid names stay out of the groups. This app does not take the entry fee.</p>
        ${backBar}
      </div>`;
      wireBack();return;
    }
    const already=typeof archerTarget==='function'?archerTarget(lg,w,id):0;
    if(!(already>=1&&already<=LK_TARGETS)){
      /* Not on a target yet tonight: pick a lane and who you are scoring with on it. */
      window._lkTarget=0;window._lkPicked=[];
      selectArchersOnion();
      return;
    }
    const mates=(typeof pickerSignups==='function'?pickerSignups(lg,w):[]).filter(r=>r&&r.id&&(typeof archerTarget==='function'?archerTarget(lg,w,r.id):0)===already);
    const lis=mates.map(r=>{
      const mine=String(r.id)===String(id);
      return`<li class="${mine?'you':''}">${esc(r.name)}${mine?' (you)':''}</li>`;
    }).join('');
    const nArch=mates.length;
    const rem=nArch<4?`<p class="small">This target has ${nArch} ${nArch===1?'archer':'archers'}.</p>`:'';
    el.innerHTML=`<div class="lkf" id="lkassigned" data-target="${already}">
      <h1>${title}</h1>
      <p class="lk-tgt" id="lktgtlabel">Target ${already}</p>
      <p>You are scoring this group.</p>
      <ol class="lk-group" id="lkgroupnames">${lis}</ol>
      ${rem}
      <p><button type="button" class="lk-host" id="lkchangetgt">Change lane</button></p>
      ${bar(btn('lkbacklogin','Back','grey'),btn('lkstart','Start scoring','green'))}
    </div>`;
    wireBack();
    const ids=mates.map(r=>r.id);
    if($id('lkstart'))$id('lkstart').onclick=()=>{
      window._lkTarget=already;
      window._lkScoreIds=ids.slice();
      window._lkPicked=ids.slice();
      startScoring(lg,w,ids);
    };
    if($id('lkchangetgt'))$id('lkchangetgt').onclick=()=>{
      window._lkTarget=0;window._lkPicked=[];
      selectArchersOnion();
    };
  }

  /* selectArchers() is the picker's own "redraw this same screen" self-reference (night change,
     target tap, back, toggling a name) -- it must stay on the picker for Lingkana too, not detour
     into showAssigned(), which needs myId() and is a different, later screen (the PIN sign-in's
     own "you already have a target" confirm step). */
  function selectArchers(){
    selectArchersOnion();
  }
  function selectArchersOnion(){
    const lg=eventLg();
    if(!lg){home();return}
    if(!isOnion()&&needScoreLogin(lg))return;
    hideChrome(true);
    const w=nightOf(lg);
    const target=+(window._lkTarget||0);
    const registered=nightSignups(lg,w)||[];
    const list=pickerSignups(lg,w);
    const rows=list.map(r=>({id:r.id,name:r.name||((typeof lgName==='function'&&lgName(r.id))||r.id),target:archerTarget(lg,w,r.id)}));
    const el=appEl();if(!el)return;
    const title=esc(lg.name||evName());
    const nightSel=`<label for="lknight">Night</label><select id="lknight">${nightChoices(lg,w)}</select>`;
    const hostPwBtn=(!isOnion()&&typeof lkCanHost==='function'&&lkCanHost(lg))?`<button type="button" class="lk-host" id="lkhostpw">Host: change scoring password</button>`:'';

    if(!(target>=1&&target<=LK_TARGETS)){
      const counts={};
      rows.forEach(r=>{if(r.target)counts[r.target]=(counts[r.target]||0)+1});
      const grid=Array.from({length:LK_TARGETS},(_,i)=>{
        const n=i+1, c=counts[n]||0;
        return `<button type="button" class="lk-tbtn" data-lktgt="${n}" id="lktgt${n}">${n}${c?`<span class="lk-tcount">${c}</span>`:''}</button>`;
      }).join('');
      el.innerHTML=`<div class="lkf" id="lkselect" data-ev="${esc(evCode())}">
        <h1>${title}</h1>
        ${nightSel}
        <p class="small muted">${isOnion()?'Tap a target, then tick up to 4 archers already registered for this night. Registration is on the Event Registration page.':'Tap a target, then tick up to 4 archers marked paid for this night. Registered archers who are not ticked paid stay off this list.'}</p>
        <div class="lk-tgrid" id="lktargets">${grid}</div>
        ${hostPwBtn}
        ${bar(btn('lkbacklogin','Back / Login','grey'),'')}
      </div>`;
      $id('lknight').onchange=()=>{setNight(+$id('lknight').value);window._lkTarget=0;window._lkPicked=[];selectArchers()};
      $id('lkbacklogin').onclick=()=>{window._lkTarget=0;window._lkPicked=[];home(evCode())};
      if($id('lkhostpw'))$id('lkhostpw').onclick=()=>hostPw();
      el.querySelectorAll('[data-lktgt]').forEach(b=>b.onclick=()=>{window._lkTarget=+b.getAttribute('data-lktgt');window._lkPicked=[];selectArchers()});
      return;
    }

    const selected=(window._lkPicked||[]).filter(id=>{
      const row=rows.find(r=>r.id===id);
      if(!row)return false;
      if(claimedByOther(lg,w,id))return false;
      const on=archerTarget(lg,w,id);
      return !on||on===target;
    });
    window._lkPicked=selected.slice();
    const selHtml=selected.length?`<div class="lk-selbox" id="lkselections"><h3>Selections</h3><ul>${selected.map(id=>`<li>${esc((rows.find(r=>r.id===id)||{}).name||id)}</li>`).join('')}</ul></div>`:'';
    const takenInfo=id=>{
      const other=claimedByOther(lg,w,id);
      const onT=archerTarget(lg,w,id);
      if(other)return{taken:true,why:(other.name||'Another scorer')+' already has this archer.'};
      if(onT&&onT!==target)return{taken:true,why:'Already on target '+onT};
      return{taken:false,why:''};
    };
    const pickable=rows.filter(r=>!takenInfo(r.id).taken);
    const freeRows=rows.filter(r=>!(archerTarget(lg,w,r.id)&&archerTarget(lg,w,r.id)!==target));
    const lockedRow=r=>{
      const {why}=takenInfo(r.id);
      return `<label class="lk-row locked" data-lkid="${esc(r.id)}">
        <span class="nm">${esc(r.name)}</span>
        <input type="checkbox" data-lkid="${esc(r.id)}" disabled>
        <span class="lk-padlock" title="${esc(why)}">🔒</span>
      </label>`;
    };
    const freeBody=freeRows.map(r=>{
      const {taken,why}=takenInfo(r.id);
      const on=selected.includes(r.id);
      return `<label class="lk-row${taken?' locked':''}" data-lkid="${esc(r.id)}">
        <span class="nm">${esc(r.name)}</span>
        <input type="checkbox" data-lkid="${esc(r.id)}" ${on?'checked':''} ${taken?'disabled':''}>
        ${taken?`<span class="lk-padlock" title="${esc(why)}">🔒</span>`:''}
      </label>`;
    }).join('')||(paidPickerIds(lg,w)&&registered.some(r=>r&&r.id)?'<p>No archers marked paid for this night yet. They stay registered, and show here once the host ticks them paid.</p>':'<p>No archers registered for this night yet. Register them below, or they sign up on the Event Registration page.</p>');
    /* Archers already locked onto another target: grouped by that target instead of scattered
       among the pickable list, so the groups forming tonight are easy to read at a glance. This
       re-groups on every redraw, so it reflects whatever the latest group is. */
    const otherTargets=[...new Set(rows.map(r=>archerTarget(lg,w,r.id)).filter(t=>t&&t!==target))].sort((a,b)=>a-b);
    const groupedBody=otherTargets.map(t=>{
      const members=rows.filter(r=>archerTarget(lg,w,r.id)===t);
      return `<div class="lk-grouphdr">Target ${t}</div>${members.map(lockedRow).join('')}`;
    }).join('');
    const body=freeBody+groupedBody;
    el.innerHTML=`<div class="lkf" id="lkselect" data-ev="${esc(evCode())}" data-target="${target}">
      <h1>${title}</h1>
      ${nightSel}
      <div class="lk-tgt" id="lktgtlabel">Target ${target}</div>
      <p><button type="button" class="lk-host" id="lkregarcher">Register archer</button></p>
      ${selHtml}
      <p class="small muted">Tick who you are scoring on this target. <span class="lk-selcount" id="lkselcount">${selected.length}/4</span> · <button type="button" class="lk-host" id="lkpickall">All</button></p>
      <div id="lkarchlist">${body}</div>
      ${hostPwBtn}
      <p class="lk-msg" id="lkselmsg" role="alert"></p>
      ${bar(btn('lkbacklogin','Back','grey'),btn('lkstart',`Start (${selected.length})`,'green'))}
    </div>`;
    $id('lknight').onchange=()=>{setNight(+$id('lknight').value);window._lkTarget=0;window._lkPicked=[];selectArchers()};
    $id('lkbacklogin').onclick=()=>{window._lkTarget=0;window._lkPicked=[];selectArchers()};
    if($id('lkhostpw'))$id('lkhostpw').onclick=()=>hostPw();
    if($id('lkpickall'))$id('lkpickall').onclick=()=>{
      const msg=$id('lkselmsg');
      const room=4-selected.length;
      if(room<=0){if(msg)msg.textContent='Pick up to 4 archers for this target.';return}
      const add=pickable.filter(r=>!selected.includes(r.id)).slice(0,room).map(r=>r.id);
      if(!add.length){if(msg)msg.textContent='No one else is free to add to this target.';return}
      let failed='';
      for(const id of add){
        if(!isOnion()){const err=setClaim(lg,w,id,true);if(err){failed=err;break}}
        window._lkPicked.push(id);
      }
      if(failed){if(msg)msg.textContent=failed}
      selectArchers();
    };
    if($id('lkregarcher'))$id('lkregarcher').onclick=()=>{
      regEntry();
      const back=$id('lkregback');
      if(back)back.onclick=()=>{try{history.replaceState(null,'',location.pathname+location.search+'#lk-home')}catch(e){}selectArchers()};
    };
    const toggle=id=>{
      const msg=$id('lkselmsg');
      const other=claimedByOther(lg,w,id);
      if(other){if(msg)msg.textContent=(other.name||'Another scorer')+' already has this archer.';return}
      const onT=archerTarget(lg,w,id);
      if(onT&&onT!==target){if(msg)msg.textContent='That archer is already on target '+onT+'.';return}
      const has=window._lkPicked.includes(id);
      if(!has&&window._lkPicked.length>=4){if(msg)msg.textContent='Pick up to 4 archers for this target.';const box=el.querySelector('#lkarchlist input[data-lkid="'+id+'"]');if(box)box.checked=false;return}
      if(!isOnion()){
        const err=setClaim(lg,w,id,!has);
        if(err){if(msg)msg.textContent=err;return}
      }
      if(has)window._lkPicked=window._lkPicked.filter(x=>x!==id);
      else window._lkPicked.push(id);
      selectArchers();
    };
    el.querySelectorAll('#lkarchlist input[data-lkid]').forEach(box=>{
      box.onchange=()=>toggle(box.getAttribute('data-lkid'));
    });
    $id('lkstart').onclick=()=>{
      const ids=window._lkPicked||[];
      const msg=$id('lkselmsg');
      if(!ids.length){if(msg)msg.textContent='Tick the archers you are scoring.';return}
      if(ids.length>4){if(msg)msg.textContent='Pick up to 4 archers for this target.';return}
      const put=setTargets(lg,w,target,ids);
      if(put){if(msg)msg.textContent=put;return}
      if(!isOnion()&&typeof lkSetGroups==='function'){
        /* Update only this target's slot. Every other target's group on lg.grp[w].g must survive —
           lkSetGroups replaces the whole night's list, so the full list is rebuilt here first. */
        const G=((((lg&&lg.grp)||{})[w])||{}).g||[];
        const full=G.map(g=>(g||[]).slice());
        const taken=new Set(ids.map(String));
        for(let gi=0;gi<full.length;gi++)full[gi]=full[gi].filter(x=>!taken.has(String(x)));
        while(full.length<target)full.push([]);
        full[target-1]=ids.slice();
        const add=lkSetGroups(w,full);
        if(add){if(msg)msg.textContent=add;return}
      }
      startScoring(lg,w,ids);
    };
  }


  function regSearch(){
    const lg=typeof lkEnsure==='function'?lkEnsure():null;
    hideChrome(true);
    const el=appEl();if(!el)return;
    const all=[];
    const seen={};
    (lg&&lg.order||[]).forEach(id=>{
      const n=(typeof lgName==='function'&&lgName(id))||id;
      all.push({id,name:n});seen[id]=1;seen[n.toLowerCase()]=1;
    });
    if(typeof TESTERS!=='undefined')TESTERS.forEach(t=>{
      if(!t||!t.id||seen[t.id]||seen[String(t.name||'').toLowerCase()])return;
      all.push({id:t.id,name:t.name||t.id});
    });
    el.innerHTML=`<div class="lkf" id="lkregsearch">
      <h1>Event Registration</h1>
      <label for="lkregq">Select Archer</label>
      <input id="lkregq" type="search" autocomplete="off" placeholder="Search name or number">
      <div class="lk-search-list" id="lkreghits"></div>
      <p class="lk-msg" id="lkregmsg" role="alert"></p>
      ${bar(btn('lkregback','Back','grey'),btn('lkregsel','Select','green'))}
    </div>`;
    let pick=null;
    const draw=q=>{
      const s=String(q||'').trim().toLowerCase();
      const hits=all.filter(a=>!s||a.name.toLowerCase().includes(s)||String(a.id).toLowerCase().includes(s)).slice(0,20);
      $id('lkreghits').innerHTML=hits.map(a=>`<button type="button" data-rid="${esc(a.id)}" class="${pick&&pick.id===a.id?'on':''}">${esc(a.name)}</button>`).join('')||'<p>No matching archer. You can still Select to add a new name.</p>';
      $id('lkreghits').querySelectorAll('[data-rid]').forEach(b=>b.onclick=()=>{
        pick=all.find(a=>a.id===b.getAttribute('data-rid'))||null;
        draw(s);
      });
    };
    draw('');
    $id('lkregq').oninput=()=>draw($id('lkregq').value);
    $id('lkregback').onclick=()=> (typeof lkAuthed==='function'&&lkEnsure()&&lkAuthed(lkEnsure())?selectArchers():home());
    $id('lkregsel').onclick=()=>{
      const typed=($id('lkregq').value||'').trim();
      if(!pick&&typed.length<2){$id('lkregmsg').textContent='Search and tap an archer, or type a new name.';return}
      window._lkRegPick=pick||{id:null,name:typed};
      regDetail();
    };
  }

  function regDetail(){
    const lg=typeof lkEnsure==='function'?lkEnsure():null;
    const pick=window._lkRegPick||{};
    hideChrome(true);
    const el=appEl();if(!el)return;
    const w=nightOf(lg||{});
    el.innerHTML=`<div class="lkf" id="lkregdetail">
      <h1>Register</h1>
      <p><b>${esc(lg?lg.name:LK_NAME)}</b></p>
      <p>${esc(pick.name||'')}</p>
      <label class="lk-tick"><input type="checkbox" id="lkregnighton" checked> Night ${w} · ${esc(typeof lkFmtD==='function'?lkFmtD(LK_DATES[w-1]):LK_DATES[w-1]||'')}</label>
      <label for="lkregclass">Class</label>
      <select id="lkregclass">${CLASSES.map(c=>`<option>${esc(c)}</option>`).join('')}</select>
      <label for="lkregdiv">Division</label>
      <select id="lkregdiv">${DIVS.map(c=>`<option>${esc(c)}</option>`).join('')}</select>
      <label for="lkreground">Round</label>
      <select id="lkreground">${ROUNDS.map((c,i)=>`<option ${w<7&&i===0||w===7&&i===2?'selected':''}>${esc(c)}</option>`).join('')}</select>
      <p class="lk-msg" id="lkregdmsg" role="alert"></p>
      ${bar(btn('lkregdback','Back','grey'),btn('lkregsave','Save','green'))}
    </div>`;
    $id('lkregdback').onclick=()=>regSearch();
    $id('lkregsave').onclick=()=>{
      const on=$id('lkregnighton').checked;
      const night=on?(typeof lkNightKey==='function'?lkNightKey(lg,w):LK_DATES[w-1]):'';
      const rec={
        name:pick.name,
        id:pick.id,
        night,
        className:$id('lkregclass').value,
        division:$id('lkregdiv').value,
        round:$id('lkreground').value,
        at:Date.now()
      };
      let msg='';
      if(on&&typeof lkRegister==='function'){
        msg=lkRegister({posterCode:LK_POSTER_CODE,name:rec.name,night:rec.night,nights:[rec.night],bow:rec.className})||'';
      }else if(!on){
        /* season list only */
        if(typeof lkAddGuest==='function'&&!pick.id)msg=lkAddGuest(rec.name,false)||'';
      }
      if(msg){$id('lkregdmsg').textContent=msg;return}
      const L=typeof lkEnsure==='function'?lkEnsure():lg;
      if(L){
        const id=(typeof lkFindArcher==='function'&&lkFindArcher(L,rec.name))||pick.id;
        if(id){
          L.gn=L.gn||{};
          if(L.gn[id]){L.gn[id].className=rec.className;L.gn[id].division=rec.division;L.gn[id].round=rec.round}
          if(on&&L.reg&&L.reg[rec.night]){
            const row=L.reg[rec.night].find(r=>r&&(r.id===id||r.name===rec.name));
            if(row){row.className=rec.className;row.division=rec.division;row.round=rec.round}
          }
          if(typeof save==='function')save();
        }
      }
      regList();
    };
  }

  function regList(){
    const lg=typeof lkEnsure==='function'?lkEnsure():null;
    hideChrome(true);
    const el=appEl();if(!el)return;
    const w=nightOf(lg||{});
    const rawList=signups(lg,w);
    const seen=new Set();
    const list=rawList.filter(r=>{const k=String(r&&r.name||'').trim().replace(/\s+/g,' ').toLowerCase();if(!k)return true;if(seen.has(k))return false;seen.add(k);return true});
    const rows=list.map((r,i)=>`<tr><td>${esc(targetOf(r,i))}</td><td>${esc(r.name||((typeof lgName==='function'&&lgName(r.id))||''))}</td><td>${esc(r.round||LK_R)}</td></tr>`).join('')||'<tr><td colspan="3">No archers registered for this night.</td></tr>';
    el.innerHTML=`<div class="lkf" id="lkreglist">
      <h1>Registered archers</h1>
      <p>${esc(lg?lg.name:LK_NAME)} · Night ${w}</p>
      <div class="lk-list"><table><thead><tr><th>Target</th><th>Archer</th><th>Round</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${bar(btn('lkreglback','Back','grey'),btn('lkaddarch','Add Archer','green'))}
    </div>`;
    $id('lkreglback').onclick=()=> (typeof lkAuthed==='function'&&lg&&lkAuthed(lg)?selectArchers():home());
    $id('lkaddarch').onclick=()=>regSearch();
  }

  function endsOf(e){return ((e&&e.e)||[]).filter(z=>z&&z.length===3)}
  function nEndsOf(e){return endsOf(e).length}
  function lastEnd(e){const E=(e&&e.e)||[];return E.length?E[E.length-1]:null}
  function hasPartial(e){const L=lastEnd(e);return!!(L&&L.length&&L.length<3)}
  function sessOf(e){return {round:'Lancaster 660',ends:endsOf(e),face3:'vegas',max:660,lancaster:true,xv:11}}
  function waveReady(lg,w,ids){return ids.every(id=>!hasPartial((typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]}))}
  /* Every archer has the same number of complete ends and nobody is mid-arrow. That is the gap between ends. */
  function endsAligned(lg,w,ids){
    if(!ids.length||!waveReady(lg,w,ids))return false;
    const ns=ids.map(id=>nEndsOf((typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]}));
    return ns.every(n=>n===ns[0]);
  }
  function anyScored(lg,w,ids){return ids.some(id=>nEndsOf((typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]})>0||hasPartial((typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]}))}
  function allDone(lg,w,ids){return ids.length>0&&ids.every(id=>typeof lgDoneE==='function'&&lgDoneE((typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]}))}
  function pickEntryId(lg,w,ids){
    const fx=window._csFx;
    if(fx&&fx.ns&&ids.some(id=>fx.ns==='lg|'+lg.code+'|'+w+'|'+id)){
      const id=fx.ns.split('|').pop();if(ids.includes(id))return id;
    }
    const ent=id=>(typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]};
    const part=ids.find(id=>hasPartial(ent(id)));
    if(part)return part;
    /* Stay on the archer whose three arrows are on screen until Next. Do not treat that as the start of the next end. */
    const hd=window._lgHold;
    if(hd&&ids.includes(hd.id)){
      const e=ent(hd.id),last=(e.e||[])[(e.e||[]).length-1];
      if(last&&last.length===3&&(e.e||[]).length===hd.n)return hd.id;
    }
    /* New end, or a reload between archers: first name in the scorecard order with the fewest complete ends.
       The archer who finished the previous end is not carried into the next one. */
    let best=null,bn=1e9;
    ids.forEach(id=>{
      const e=ent(id);
      if(typeof lgDoneE==='function'&&lgDoneE(e))return;
      if(typeof lgLockedBy==='function'&&lgLockedBy(lg,w,id))return;
      const n=nEndsOf(e);
      if(n<bn){bn=n;best=id}
    });
    return best||ids[0];
  }
  function faceSub(s,info){
    if(typeof sheetSections==='function'&&s.ends&&s.ends.length){
      const sec=sheetSections(s)[0];if(sec&&sec.k)return sec.k;
    }
    return ((info&&info.face)||'triangular 40 cm 3-spot')+((info&&info.dist)?' @ '+info.dist:'');
  }
  function oneSheet(id,lg,w,info){
    const e=(typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]};
    const ends=endsOf(e),s=sessOf(e);
    /* Lancaster 660 (and any other round with ROUNDS[round].halfEnds) is shot as two halves with a
       break: the Prog column restarts at the start of each half, as on the paper scoresheet, and the
       round's two halves are shown added together below. The saved/synced total (tot, via lgTot) is
       unchanged -- it is already a flat sum over every end, which equals the two halves added
       together either way. */
    /* window.APP_ROUNDS, not the bare ROUNDS -- lkflow.js's own ROUNDS (line 6) is an unrelated
       array of night-type labels that shadows the real app.js round-definitions object in this
       scope, and that one is a plain script-level const, so window.ROUNDS isn't it either. */
    const half=((typeof window!=='undefined'&&window.APP_ROUNDS&&window.APP_ROUNDS[s.round])||{}).halfEnds||0;
    const esOf=i=>typeof endSum==='function'?endSum(ends[i],s):(typeof lgTot==='function'?lgTot([ends[i]],e):0);
    const arrowsAll=ends.flat();
    const tot=typeof lgTot==='function'?lgTot(ends,e):arrowsAll.reduce((t,a)=>t+(a==='X'?11:a==='M'?0:(+a||0)),0);
    const shot=arrowsAll.length,early=ends.length<(info.ends||20),fullMax=660,per=11;
    const stats=typeof hiStats==='function'?hiStats(arrowsAll,s):'';
    const rows=ends.map((end,i)=>{
      const es=esOf(i);
      const start=typeof halfRunStart==='function'?halfRunStart(i,half):0;
      let run=0;for(let k=start;k<=i;k++)run+=esOf(k);
      return `<tr><td>${i+1}</td><td>${end.map((a,j)=>`<span class="adb ${typeof col==='function'?col(a):''}" role="button" tabindex="0" data-lkfix="${esc(id)},${i},${j}" aria-label="fix end ${i+1} arrow ${a}">${esc(a)}</span>`).join('')}</td><td>${es}</td><td>${run}</td></tr>`;
    }).join('');
    let halvesHtml='';
    if(half&&ends.length){
      const nHalves=Math.ceil((info.ends||ends.length)/half);
      const subs=[];
      for(let h=0;h<nHalves;h++){
        const segEnds=ends.slice(h*half,(h+1)*half);
        if(!segEnds.length)break;
        subs.push(segEnds.reduce((t,_,k)=>t+esOf(h*half+k),0));
      }
      if(subs.length>1||(subs.length===1&&ends.length>=half))halvesHtml=`<div class="ad-sum small">${subs.map((v,i)=>`Round ${i+1} score: <b>${v}</b>`).join(' &nbsp; ')}${subs.length>1?` &nbsp; Total: <b>${subs.reduce((a,b)=>a+b,0)}</b>`:''}</div>`;
    }
    return `<div class="ad-sheet" data-lksid="${esc(id)}"><div class="ad-name">${esc((typeof lgName==='function'&&lgName(id))||id)}</div><div class="ad-band">${esc(info.title||'Lancaster 660')}</div>
      <table class="ad-tab"><thead><tr><th>#</th><th>Scores<div style="font-weight:400">${esc(faceSub(s,info))}</div></th><th>End</th><th>Prog</th></tr></thead><tbody>${rows}</tbody></table>
      ${halvesHtml}
      <div class="ad-sum">${stats}&nbsp; <b class="big">${tot}</b><span class="small muted">&nbsp;/ ${early?shot*per+' <span class="small">('+shot+' arrows shot)</span>':fullMax}</span></div></div>`;
  }
  function finishLater(){
    window._lkScoreMode=null;window._csFx=null;window._lgHold=null;
    home();
  }
  function groupSheet(){
    const lg=typeof lkEnsure==='function'?lkEnsure():null;
    if(!lg){home();return}
    if(needScoreLogin(lg))return;
    const w=nightOf(lg);
    const ids=window._lkScoreIds||window._lkPicked||[];
    if(!ids.length){selectArchers();return}
    hideChrome(true);
    window._lkScoreMode='sheet';
    window._csFx=null;
    const info=typeof lgInfo==='function'?lgInfo(lg,w):{ends:20,title:'Lancaster 660',face:'triangular 40 cm 3-spot',dist:'18 m'};
    const done=allDone(lg,w,ids);
    const arrows=ids.some(id=>{const e=(typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]};return ((e.e||[]).flat().length)>0});
    const canHost=typeof lgCanEd==='function'&&lgCanEd(lg);
    const el=appEl();if(!el)return;
    el.innerHTML=`<div class="ad" id="lksheet">
      <div class="ad-title"><button type="button" class="labfl" id="labfl" title="Every arrow is already saved. Carry on later from Select Archers.">Finish later</button>Score Sheet</div>
      ${done?'':'<button type="button" class="ad-go" id="addsc" style="position:sticky;top:0;z-index:5;width:100%">Add Scores</button>'}
      ${ids.map(id=>oneSheet(id,lg,w,info)).join('')}
      <div class="ad-foot"><button class="ad-back" id="sback">‹ Back</button>${arrows?`<button class="ad-fin" id="finnow">Finished</button>`:''}</div>
      ${!done&&canHost?'<button type="button" class="ad-discard" id="labdiscard">Discard card</button>':''}
    </div>`;
    $id('labfl').onclick=()=>finishLater();
    $id('sback').onclick=()=>{window._lkScoreMode=null;selectArchers()};
    if($id('addsc'))$id('addsc').onclick=()=>{
      window._csFx=null;window._lgHold=null;
      const next=pickEntryId(lg,w,ids);
      window._lgAct=next;window._lkScoreI=Math.max(0,ids.indexOf(next));
      window._lkScoreMode='entry';
      entryScreen();
    };
    if($id('finnow'))$id('finnow').onclick=()=>{
      if(!done){
        const shotN=ids.reduce((t,id)=>t+(((typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]}).e||[]).flat().length,0);
        const totN=ids.reduce((t,id)=>{const e=(typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]};return t+(typeof lgTot==='function'?lgTot(endsOf(e),e):0)},0);
        if(!confirm(`Finish round now? ${shotN} arrows, ${totN} points across the group.`))return;
      }
      window._lkScoreMode=null;review();
    };
    if($id('labdiscard'))$id('labdiscard').onclick=()=>{
      if(!confirm("Discard this card? These archers' scores for this night are deleted for everyone."))return;
      lg.sc=lg.sc||{};
      ids.forEach(id=>{if(lg.sc[id])delete lg.sc[id][w]});
      lg.dirty=1;if(typeof save==='function')save();
      /* A local-only delete would just come back on the next sync -- the relay and every other
         phone still have the old scores, and merging only ever adds newer entries, never removes. */
      if(typeof lgTick==='function')lgTick(true);
      window._lkScoreMode=null;window._csFx=null;window._lgHold=null;
      selectArchers();
    };
    el.querySelectorAll('[data-lkfix]').forEach(b=>{
      const go=()=>{
        const [id,i,j]=b.getAttribute('data-lkfix').split(',');
        const ns='lg|'+lg.code+'|'+w+'|'+id;
        const fx=window._csFx;
        window._csFx=(fx&&fx.ns===ns&&fx.i=== +i&&fx.j=== +j)?null:{ns,i:+i,j:+j};
        if(!window._csFx)return;
        window._lgAct=id;window._lkScoreI=Math.max(0,ids.indexOf(id));
        window._lkFixRet=1;window._lkScoreMode='entry';
        entryScreen();
      };
      b.onclick=b.onkeydown=ev=>{if(ev.type==='keydown'&&ev.key!=='Enter'&&ev.key!==' ')return;go()};
    });
  }
  function entryScreen(){
    const lg=typeof lkEnsure==='function'?lkEnsure():null;
    if(!lg){home();return}
    if(needScoreLogin(lg))return;
    const w=nightOf(lg);
    const ids=window._lkScoreIds||window._lkPicked||[];
    if(!ids.length){selectArchers();return}
    const id=pickEntryId(lg,w,ids);
    window._lgAct=id;
    window._lkScoreI=Math.max(0,ids.indexOf(id));
    window._lkScoreMode='entry';
    hideChrome(true);
    const e=(typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]};
    const E=e.e||[];
    const last=E[E.length-1];
    const fx=window._csFx&&window._csFx.ns==='lg|'+lg.code+'|'+w+'|'+id?window._csFx:null;
    const hold=!!(window._lgHold&&window._lgHold.id===id&&last&&last.length===3);
    const cur=fx&&E[fx.i]?E[fx.i]:(last&&(last.length<3||hold)?last:[]);
    const ei=fx?fx.i:(last&&(last.length<3||hold)?E.length-1:E.length);
    const done=typeof lgDoneE==='function'&&lgDoneE(e);
    const info=typeof lgInfo==='function'?lgInfo(lg,w):{ends:20,title:'Lancaster 660',face:'triangular 40 cm 3-spot',dist:'18 m'};
    const NE=info.ends||20;
    const s=sessOf(e);
    const endTot=typeof endSum==='function'?endSum(cur,s):(typeof lgTot==='function'?lgTot([cur],e):0);
    const completed=E.filter(z=>z&&z.length===3);
    /* Prog restarts at the start of the current half for rounds with ROUNDS[round].halfEnds (see
       oneSheet()'s comment) -- only ends from this half, not the whole round, feed the running total. */
    const half=((typeof window!=='undefined'&&window.APP_ROUNDS&&window.APP_ROUNDS[s.round])||{}).halfEnds||0;
    const halfFrom=typeof halfRunStart==='function'?halfRunStart(ei,half):0;
    const before=completed.slice(halfFrom,fx?fx.i:completed.length-(hold?1:0));
    const prog=(typeof lgTot==='function'?lgTot(before,e):0)+endTot;
    const keys=(typeof LG_KEYS!=='undefined'?LG_KEYS:['X','10','9','8','7','6','M']);
    const lock=typeof lgLockedBy==='function'&&lgLockedBy(lg,w,id);
    const endDone=cur.length===3||done;
    const el=appEl();if(!el)return;
    const ape=3;
    const chips=Array.from({length:ape},(_,j)=>cur[j]!=null?`<span class="adb ${typeof col==='function'?col(cur[j]):''}" role="button" tabindex="0" data-lkfix="${esc(id)},${ei},${j}" aria-label="fix arrow ${esc(cur[j])}"${fx&&fx.i===ei&&fx.j===j?' style="outline:3px solid #3b82f6;outline-offset:2px"':''}>${esc(cur[j])}</span>`:'<span class="adb adb-empty"></span>').join('');
    const hint=lock?`Being scored on ${esc((typeof lgName==='function'&&lgName(lock))||lock)}'s phone.`
      :fx?'Tap a score to fix this arrow.'
      :endDone?(done?(info.done||'Finished')+'.':'End complete. Tap an arrow to fix it, or press Next.')
      :'Tap a score.';
    el.innerHTML=`<div class="ad" id="lgentry">
      <div class="ad-title"><button type="button" class="labfl" id="labfl" title="Every arrow is already saved. Carry on later from Select Archers.">Finish later</button>Score End</div>
      <div class="ad-head"><div class="ad-left">
        <div class="ad-box ad-line" title="${esc((typeof lgName==='function'&&lgName(id))||id)}"><b>${esc((typeof lgName==='function'&&lgName(id))||id)}</b></div>
        <div class="ad-box ad-line"><b id="endno">${done?(info.done||'Finished'):`End ${Math.min(NE,ei+1)} of ${NE}`}</b> · <span id="roundname">${esc(info.title||'Lancaster 660')}</span>${info.dist?` · <b id="enddist">${esc(info.dist)}</b>`:''} · <span id="facesize">${esc(info.face||'triangular 40 cm 3-spot')}</span></div>
      </div>
      <div class="ad-right"><div class="ad-num"><span>End</span><b>${endTot}</b></div><div class="ad-num"><span>Prog</span><b>${prog}</b></div></div></div>
      <div class="ad-chips" aria-label="Arrows this end">${chips}
        <button class="ad-small" id="lgundo" ${(!E.some(x=>x&&x.length)||lock||fx)?'disabled':''}>↶ Undo</button>
        ${fx?`<button class="ad-small" id="delarrow">✕ Delete arrow</button><button class="ad-small" id="fixcancel">Done</button>`:''}
      </div>
      <p class="small muted" id="lkendmsg" style="margin:2px 12px">${hint}</p>
      ${lock||(done&&!fx)?'':`<div class="ad-pad lc-pad" style="--cols:${keys.length}">${keys.map(k=>`<button type="button" class="${typeof col==='function'?col(k):''}" data-lgk="${k}" aria-label="score ${k}" ${endDone&&!fx?'disabled':''}>${k}</button>`).join('')}</div>`}
      <div class="ad-foot"><button class="ad-back" id="eback">‹ Back</button><button class="ad-go" id="enext" ${endDone&&!fx?'':'disabled'}>Next ›</button></div>
    </div>`;
    $id('labfl').onclick=()=>finishLater();
    $id('eback').onclick=()=>{window._csFx=null;window._lgHold=null;window._lkFixRet=null;window._lkScoreMode='sheet';groupSheet()};
    if($id('enext'))$id('enext').onclick=()=>goNext(lg,w,ids,id);
    const tapKey=k=>{
      if(lock)return;
      window._lgAct=id;window._lgKeep=1;
      if(typeof lgKey==='function')lgKey(lg.code,w,id,k);
      window._lgAct=id;window._lgKeep=null;
      const e2=(typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]};
      const L=lastEnd(e2);
      if(L&&L.length===3)window._lgHold={id,n:e2.e.length};
      if(window._lkFixRet&&!window._csFx){window._lkFixRet=null;window._lkScoreMode='sheet';groupSheet();return}
      entryScreen();
    };
    el.querySelectorAll('[data-lgk]').forEach(b=>b.onclick=()=>tapKey(b.getAttribute('data-lgk')));
    el.querySelectorAll('[data-lkfix]').forEach(b=>{
      const go=()=>{
        const [aid,i,j]=b.getAttribute('data-lkfix').split(',');
        const ns='lg|'+lg.code+'|'+w+'|'+aid;
        const curFx=window._csFx;
        window._csFx=(curFx&&curFx.ns===ns&&curFx.i=== +i&&curFx.j=== +j)?null:{ns,i:+i,j:+j};
        entryScreen();
      };
      b.onclick=b.onkeydown=ev=>{if(ev.type==='keydown'&&ev.key!=='Enter'&&ev.key!==' ')return;go()};
    });
    if($id('lgundo'))$id('lgundo').onclick=()=>{
      window._lgAct=id;window._lgKeep=1;window._csFx=null;window._lgHold=null;
      if(typeof lgUndo==='function')lgUndo(lg.code,w,id);
      window._lgKeep=null;
      entryScreen();
    };
    if($id('fixcancel'))$id('fixcancel').onclick=()=>{
      window._csFx=null;
      if(window._lkFixRet){window._lkFixRet=null;window._lkScoreMode='sheet';groupSheet();return}
      entryScreen();
    };
    if($id('delarrow'))$id('delarrow').onclick=()=>{
      window._lgAct=id;window._lgKeep=1;
      if(typeof lgFxDel==='function')lgFxDel(lg.code,w,id);
      window._lgKeep=null;window._lgHold=null;
      if(window._lkFixRet){window._lkFixRet=null;window._lkScoreMode='sheet';groupSheet();return}
      entryScreen();
    };
  }
  function goNext(lg,w,ids,id){
    window._csFx=null;window._lgHold=null;window._lkFixRet=null;
    const mine=nEndsOf((typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]});
    const i=ids.indexOf(id);
    for(let j=1;j<ids.length;j++){
      const n=ids[(i+j)%ids.length];
      const en=(typeof lgEnt==='function'&&lgEnt(lg,n,w))||{e:[]};
      if(hasPartial(en)||nEndsOf(en)<mine){
        if(typeof lgLockedBy==='function'&&lgLockedBy(lg,w,n))continue;
        window._lgAct=n;window._lkScoreI=ids.indexOf(n);window._lkScoreMode='entry';
        entryScreen();return;
      }
    }
    window._lkScoreMode='sheet';
    /* The whole group just finished this end (nobody left to catch up): push it to the relay right
       now rather than waiting on lgTick's own periodic timer, so a spectator on the live leaderboard
       (PR #20's 10s poll) picks it up as soon as possible after the actual event. */
    if(typeof lgAfter==='function')lgAfter(lg);
    groupSheet();
  }
  function scoreScreen(){
    const lg=typeof lkEnsure==='function'?lkEnsure():null;
    if(!lg){home();return}
    if(needScoreLogin(lg))return;
    const w=nightOf(lg);
    const ids=window._lkScoreIds||window._lkPicked||[];
    if(!ids.length){selectArchers();return}
    if(window._lkScoreMode==='sheet'){groupSheet();return}
    if(window._lkScoreMode!=='entry'&&endsAligned(lg,w,ids)&&(allDone(lg,w,ids)||ids.some(id=>nEndsOf((typeof lgEnt==='function'&&lgEnt(lg,id,w))||{e:[]})>0))){groupSheet();return}
    entryScreen();
  }

  async function review(){
    if(typeof lkSyncStart==='function')lkSyncStart();
    if(typeof lkSyncOnce==='function'){try{await lkSyncOnce()}catch(e){}}
    const lg=typeof lkEnsure==='function'?lkEnsure():null;
    hideChrome(true);
    const w=nightOf(lg||{});
    if(typeof lkResultsView==='function'){
      try{history.replaceState(null,'',location.pathname+location.search+'#lk-results&n='+w)}catch(e){}
      lkResultsView(w);
      const back=$id('lkresback');
      if(back)back.onclick=()=>{try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}home(evCode())};
      return;
    }
    const el=appEl();if(!el)return;
    const stand=typeof lkTableHTML==='function'&&lg?lkTableHTML(lg):'<p>No scores yet.</p>';
    el.innerHTML=`<div class="lkf" id="lkreviewpage">
      <h1>Review Scoresheets</h1>
      ${stand}
      ${bar(btn('lkrevback','Back','grey'),'')}
    </div>`;
    $id('lkrevback').onclick=()=>home(evCode());
    if(typeof lkBindStandUI==='function')lkBindStandUI(lg);
  }

  function regEntry(){
    hideChrome(true);
    if(typeof lkSyncStart==='function')lkSyncStart();
    if(typeof lkSyncOnce==='function')lkSyncOnce();
    try{history.replaceState(null,'',location.pathname+location.search+(window.LK_REGISTER_HASH||(typeof LK_REGISTER_HASH==='string'&&LK_REGISTER_HASH)||'#lk-register'))}catch(e){}
    if(typeof lkRegisterView==='function')lkRegisterView();
    const back=document.getElementById('lkregback');
    if(back)back.onclick=()=>{try{history.replaceState(null,'',location.pathname+location.search+(window.LK_HOME_HASH||'#lk-home'))}catch(e){}home(evCode())};
  }

  async function roster(){
    hideChrome(true);
    const lg=typeof lkEnsure==='function'?lkEnsure():null;
    if(typeof lkSyncStart==='function')lkSyncStart();
    if(typeof lkSyncOnce==='function'){try{await lkSyncOnce()}catch(e){}}
    const el=appEl();if(!el)return;
    const list=(typeof lkKnownRegistrants==='function'&&lkKnownRegistrants(lg))||[];
    const host=lg&&typeof lkCanHost==='function'&&lkCanHost(lg);
    const nights=lg&&typeof lkShootDates==='function'?lkShootDates(lg):[];
    /* 25 Nov 2026 (Nathe): a box is BLUE when the archer signed up for that night (night-by-night sign-up, lkNightRegd) and is not ticked paid yet. Tapping it marks
       paid exactly as before (lkSetPaid, host phone only). Paid ticks are read and stored the same way. */
    const regOn=(r,n)=>typeof lkNightRegd==='function'&&lkNightRegd(lg,n,r.id,r.name);
    const paidCell=(r,n)=>{
      const bag=(lg&&lg.paid&&lg.paid[n])||{};
      const on=!!bag[r.id];
      const reg=regOn(r,n);
      const tip=on?'Paid':(reg?'Registered, not paid yet':'Not registered for this night');
      return host?`<input type="checkbox" class="lk-paidbox${reg&&!on?' lk-regd':''}" data-reg="${reg?1:0}" data-lkpaid="${esc(r.id)}" data-lknight="${esc(n)}" ${on?'checked':''} aria-label="${esc(r.name)}: ${tip}" title="${tip}">`:(on?'●':(reg?'<span class="lk-regdot" title="Registered" aria-label="Registered">●</span>':''));
    };
    const row=r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.bow||'')}</td>${nights.map(n=>`<td style="text-align:center">${paidCell(r,n)}</td>`).join('')}${host?`<td><button type="button" class="lk-host" data-lkremove="${esc(r.id)}">Remove</button></td>`:''}</tr>`;
    el.innerHTML=`<div class="lkf" id="lkrosterpage">
      <h1>Registered Archers</h1>
      <p class="small muted">${list.length} archer${list.length===1?'':'s'} registered. ${host?'<span class="lk-key lk-key-reg"></span> Blue = registered for that night, not paid yet. Tap it to mark paid <span class="lk-key lk-key-paid"></span>.':'<span class="lk-regdot">●</span> = registered for that night.'}</p>
      <div style="overflow-x:auto"><table class="lk-tab"><thead><tr><th>Name</th><th>Bow</th>${nights.map((n,i)=>`<th>N${i+1}</th>`).join('')}${host?'<th></th>':''}</tr></thead>
      <tbody>${list.map(row).join('')||`<tr><td colspan="${2+nights.length+(host?1:0)}">No archers registered yet.</td></tr>`}</tbody></table></div>
      <p class="lk-msg" id="lkrostermsg" role="alert"></p>
      ${bar(btn('lkrosterback','Back','grey'),'')}
    </div>`;
    $id('lkrosterback').onclick=()=>home(evCode());
    if(host)el.querySelectorAll('[data-lkpaid]').forEach(box=>box.onchange=()=>{
      if(typeof lkSetPaid==='function')lkSetPaid(box.getAttribute('data-lkpaid'),box.getAttribute('data-lknight'),box.checked);
      box.classList.toggle('lk-regd',box.getAttribute('data-reg')==='1'&&!box.checked);
    });
    if(host)el.querySelectorAll('[data-lkremove]').forEach(b=>b.onclick=()=>{
      const id=b.getAttribute('data-lkremove');
      const name=(list.find(r=>r.id===id)||{}).name||'this archer';
      if(!confirm(`Remove ${name} from the Registered Archers list? Their scores, if any, are kept.`))return;
      const err=typeof lkDropArcher==='function'?lkDropArcher(id):'Could not remove that archer.';
      const msg=$id('lkrostermsg');
      if(err){if(msg)msg.textContent=err;return}
      roster();
    });
  }

  function rules(){
    hideChrome(true);
    const el=appEl();if(!el)return;
    const title='About';
    const body=typeof lkRulesHTML==='function'?lkRulesHTML():'';
    el.innerHTML=`<div class="lkf lk-rules" id="lkrulespage">
      <h1>${esc(title)}</h1>
      ${body}
      ${bar(btn('lkruleback','Back','grey'),'')}
    </div>`;
    $id('lkruleback').onclick=()=>home(evCode());
  }

  function enter(code){
    if(typeof lkEnsure==='function')lkEnsure();
    hideChrome(true);
    const lg=typeof lkGet==='function'?lkGet():null;
    if(scoringOk(lg))selectArchers();
    else login();
  }


  if(!window._lkNavHooked && typeof nav==='function'){
    const _nav=nav;
    window.nav=function(){
      if(shouldBoot()&&document.body.classList.contains('lk-flow'))return;
      hideChrome(false);
      window._lkFlow=false;
      return _nav.apply(this,arguments);
    };
    window._lkNavHooked=1;
  }

  function pathIsPublicEvent(){
    const path=String(location.pathname||'');
    return /\/test(\/|$)/.test(path)||/scoretool-demo/i.test(path)||path==='/'||/\/index\.html$/.test(path);
  }
  function shouldBoot(){
    const q=new URLSearchParams(location.search);
    if(q.get('app')==='1')return false;
    if(q.has('tester'))return false;
    if(typeof lkIsResHash==='function'&&lkIsResHash())return false;
    const path=String(location.pathname||'');
    /* The /test/ page still opens the public event list. The live ScoreTool app at the root stays the normal app unless the URL is an event-home or old register link. */
    if(/\/test(\/|$)/.test(path))return true;
    return wantsEventHome()||wantsRegister();
  }
  function wantsRegister(){
    return typeof lkIsRegHash==='function'&&lkIsRegHash();
  }
  function wantsEventHome(){
    if(wantsRegister())return false;
    if(typeof lkIsHomeHash==='function'&&lkIsHomeHash())return true;
    return false;
  }

  /* Expose for tests and relay refresh */
  window.lkFlowHome=home;
  window.lkFlowEnter=enterFromApp;
  window.lkFlowResume=resumeScoring;
  window.lkFlowList=list;
  /* A relay update (a new PIN, a new registration) redraws whichever login screen is open, not
     always the lite one: the full PIN sign-in (#lkloginpage) must not be swapped out from under
     someone mid-login just because a message arrived. */
  window.lkFlowLogin=()=>{if(document.getElementById('lkloginpage'))lkFullLogin();else login()};
  window.lkFlowSelect=selectArchers;
  window.lkFlowAssigned=showAssigned;
  window.lkFlowReview=review;
  window.lkFlowScore=scoreScreen;
  window.lkFlowHost=hostPw;
  window.lkFlowRules=rules;
  window.lkApplyClaim=applyClaim;
  window.lkMergeClaims=mergeClaimBag;
  window.lkSetClaim=setClaim;
  window.lkClaims=claims;
  window.lkClaimedByOther=claimedByOther;
  window.lkFlowHideChrome=hideChrome;

  const origView=window.lkView;
  window.lkView=function(code){
    hideChrome(true);
    if(typeof lkEnsure==='function'&&!isOnion(code))lkEnsure();
    enterFromApp(code);
  };
  if(typeof origView==='function')window._lkViewOld=origView;

  /* After the app first paints, take over when this is the public test URL. */
  function boot(){
    if(!shouldBoot())return;
    if(window._lkFlowStarted)return;
    window._lkFlowStarted=1;
    hideChrome(true);
    if(wantsRegister()){regEntry();return}
    if(wantsEventHome()){
      const code=(typeof LK_CODE==='string'&&LK_CODE)||'LINGKN26';
      try{history.replaceState(null,'',location.pathname+location.search+(window.LK_HOME_HASH||(typeof LK_HOME_HASH==='string'&&LK_HOME_HASH)||'#lk-home'))}catch(e){}
      home(code);
      return;
    }
    list();
  }
  addEventListener('hashchange',()=>{
    if(window._lkLeftHome)return;
    if(!pathIsPublicEvent())return;
    if(typeof lkIsResHash==='function'&&lkIsResHash())return;
    if(wantsRegister()){regEntry();return}
    if(wantsEventHome()){
      const code=(typeof LK_CODE==='string'&&LK_CODE)||'LINGKN26';
      try{history.replaceState(null,'',location.pathname+location.search+(window.LK_HOME_HASH||(typeof LK_HOME_HASH==='string'&&LK_HOME_HASH)||'#lk-home'))}catch(e){}
      home(code);
    }
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));
  else setTimeout(boot,0);
})();
