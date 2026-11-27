/* Microsoft Clarity (31 Oct 2026, project z660yw0kiw): how the app is used (taps and scrolling), typed details hidden.
   1. Masking: every typed field (text, search, email, number, textarea, select and the like) gets data-clarity-mask="true",
      now and whenever the app draws new screens, so names, emails, notes and messages are never sent. Strict masking is
      also set in the Clarity dashboard.
   2. Loading: the official Clarity snippet, loaded async from clarity.ms. The service worker never touches clarity.ms
      requests. With no signal the script simply fails to load and nothing else in the app is affected.
   Automated test browsers (navigator.webdriver) are skipped, so test runs are not recorded. analytics.js is separate and unchanged. */
(function(){
 try{if(navigator.webdriver)return;}catch(e){return;}
 var SKIP=/^(checkbox|radio|button|submit|reset|range|color|image|hidden|file)$/i;
 function mk(n){if(!n||n.nodeType!==1)return;
  var L=(n.matches&&n.matches('input,textarea,select,[contenteditable]'))?[n]:[];
  if(n.querySelectorAll)L=L.concat([].slice.call(n.querySelectorAll('input,textarea,select,[contenteditable]')));
  for(var i=0;i<L.length;i++){var el=L[i];if(el.tagName=='INPUT'&&SKIP.test(el.type||''))continue;
   if(el.getAttribute('data-clarity-mask')!=='true')el.setAttribute('data-clarity-mask','true');}}
 window.clarityMask=mk;
 try{mk(document.documentElement);
  new MutationObserver(function(R){for(var i=0;i<R.length;i++){var a=R[i].addedNodes;for(var j=0;j<a.length;j++)mk(a[j]);}})
   .observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',function(){mk(document.documentElement);});}catch(e){}
 try{
  (function(c,l,a,r,i,t,y){
   c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
   t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
   y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window,document,"clarity","script","z660yw0kiw");
 }catch(e){}
})();
