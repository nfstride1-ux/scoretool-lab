/* Note auto-tags: whole-word matching only (no substrings like "sHOT" -> hot, "WELL", "holding"). */
(function(root){
const I=p=>`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px">${p}</svg>`;
const W=list=>new RegExp('(^|[^a-z])('+list.join('|')+')(?![a-z])','i');
const NOTE_TAGS=[
 ['tired','Tired',I('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),W(['tired','tiring','sleepy','exhausted','exhaustion','fatigued?','fatigue','worn out','no sleep','(?:bad|poor|little|not much) sleep','slept (?:badly|poorly)','drained','knackered','buggered','stuffed'])],
 ['weather','Wind/weather',I('<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7"/>'),W(['wind','winds','windy','gusts?','gusty','breezes?','breezy','crosswind','headwind','tailwind','rain','rainy','raining','rained','showers','drizzle','wet','hot','heat','heatwave','humid','cold','freezing','chilly','glare','storm','stormy','thunder','lightning','hail','weather','overcast','fog','foggy','mirage'])],
 ['nerves','Nerves',I('<path d="M3 12h4l3-8 4 16 3-8h4"/>'),W(['nervous','nerves','anxious','anxiety','shaky','shaking','shakes','jittery','jitters','panicked','panicking','choked','under pressure','pressure','stressed','stress'])],
 ['gear','Gear change',I('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'),W(['new (?:arrows?|bow|sight|scope|string|strings|tab|release|limbs|riser|points|nocks|fletch(?:ing|es)?|rest|stabili[sz]ers?|peep)','changed','swapped','tuned','retuned','tuning','re-?tuned','re-?strung','new gear','gear change','equipment change','adjusted my (?:sight|rest|peep|draw|poundage)'])],
 ['injury','Injury',I('<path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/><path d="M9 12h6M12 9v6"/>'),W(['injury','injured','injuries','sore','soreness','pain','painful','hurt','hurts','hurting','strain','strained','sprain','sprained','ache','aching','aches'])],
 ['incomplete','Incomplete',I('<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'),W(['didn.?t (?:finish|complete)','did not (?:finish|complete)','incomplete','retired','withdrew','withdrawn','stopped early','pulled out','dnf'])]
];
/* Negation: a keyword doesn't count when one of the 3 words before it, in the same clause,
   negates it ("no wind", "not windy", "wasn't windy", "without rain", "barely any breeze", "calm, no gusts").
   Clauses split on . , ; : ! ? new lines and but/though/however/although. */
const NEG=/(^|[^a-z'])(no|not|zero|without|calm|barely|hardly|never|nil|none|nothing|wasn.?t|weren.?t|isn.?t|aren.?t|didn.?t|don.?t|doesn.?t|won.?t|n.?t)$/i;
const CLAUSE=/[.,;:!?\n]+|\b(?:but|though|although|however)\b/i;
const negated=pre=>{const w=pre.trim().split(/\s+/).filter(Boolean).slice(-3);return w.some(x=>NEG.test(x.replace(/[^a-z'’]/gi,'')))};
const hit=(re,text)=>String(text||'').split(CLAUSE).some(c=>{if(!c)return false;const g=new RegExp(re.source,'gi');let m;
 while((m=g.exec(c))){const at=m.index+m[1].length;if(!negated(c.slice(0,at)))return true;if(g.lastIndex===m.index)g.lastIndex++}return false});
const tagsOf=t=>NOTE_TAGS.filter(x=>hit(x[3],t));
root.NOTE_TAGS=NOTE_TAGS;root.noteTagsOf=tagsOf;
if(typeof module!=='undefined')module.exports={NOTE_TAGS,tagsOf};
})(typeof window!=='undefined'?window:globalThis);
