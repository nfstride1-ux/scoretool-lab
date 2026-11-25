/* Isolate ScoreTool storage when this build is served from /test/, so the live app's
   tester data on the same GitHub Pages origin is never read or written.
   Local tests (pathname "/") and the live root app are unchanged. */
(function(){
  try{
    if(!/\/test(\/|$)/.test(String(location.pathname||''))) return;
    var P='sttest.';
    var proto=Storage.prototype;
    var rawGet=proto.getItem, rawSet=proto.setItem, rawRm=proto.removeItem, rawKey=proto.key, rawClear=proto.clear;
    var lenDesc=Object.getOwnPropertyDescriptor(proto,'length');
    var rawLen=function(store){return lenDesc&&lenDesc.get?lenDesc.get.call(store):store.length};
    var isLS=function(s){try{return s===window.localStorage}catch(e){return false}};
    var mapped=function(k){k=String(k==null?'':k);return k.indexOf(P)===0?k:P+k};
    proto.getItem=function(k){return rawGet.call(this,isLS(this)?mapped(k):k)};
    proto.setItem=function(k,v){return rawSet.call(this,isLS(this)?mapped(k):k,v)};
    proto.removeItem=function(k){return rawRm.call(this,isLS(this)?mapped(k):k)};
    proto.key=function(i){
      if(!isLS(this))return rawKey.call(this,i);
      var ks=[],j,k,n=rawLen(this);
      for(j=0;j<n;j++){k=rawKey.call(this,j);if(k&&k.indexOf(P)===0)ks.push(k.slice(P.length))}
      return i>=0&&i<ks.length?ks[i]:null;
    };
    proto.clear=function(){
      if(!isLS(this))return rawClear.call(this);
      var drop=[],j,k,n=rawLen(this);
      for(j=0;j<n;j++){k=rawKey.call(this,j);if(k&&k.indexOf(P)===0)drop.push(k)}
      for(j=0;j<drop.length;j++)rawRm.call(this,drop[j]);
    };
    if(lenDesc&&lenDesc.get){
      Object.defineProperty(proto,'length',{configurable:true,enumerable:lenDesc.enumerable,get:function(){
        if(!isLS(this))return rawLen(this);
        var n=0,j,k,N=rawLen(this);
        for(j=0;j<N;j++){k=rawKey.call(this,j);if(k&&k.indexOf(P)===0)n++}
        return n;
      }});
    }
    window.__ST_TEST_STORE=P;
  }catch(e){}
})();

/* The live app's service worker is scoped to /scoretool-demo/, so a first visit
   to /test/ can be intercepted and the test page cached as the live index.html.
   Restore the live index in any non-test scoretool-* caches. Test caches use
   the scoretool-test- prefix and never delete live caches. */
(function(){
  try{
    if(!/\/test(\/|$)/.test(String(location.pathname||''))) return;
    if(!window.caches) return;
    var origin=location.origin;
    var liveDir=origin+'/scoretool-demo/';
    var liveFile=origin+'/scoretool-demo/index.html';
    caches.keys().then(function(keys){
      var live=keys.filter(function(k){return k.indexOf('scoretool-')===0 && k.indexOf('scoretool-test-')!==0});
      if(!live.length) return;
      return fetch(liveFile,{cache:'reload'}).then(function(r){
        if(!r||!r.ok)return;
        return Promise.all(live.map(function(name){
          return caches.open(name).then(function(c){
            return Promise.all([c.put(liveFile,r.clone()), c.put(liveDir,r.clone())]);
          });
        }));
      });
    }).catch(function(){});
  }catch(e){}
})();

