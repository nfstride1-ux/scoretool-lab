const {tagsOf}=require('./tags.js');const a=require('assert');
const n=t=>tagsOf(t).map(x=>x[1]);
const cases=[
['I shot well. I was holding well on the target and felt good',[]],
['shot nicely, showed good form, the target was clean',[]],
['Wanted to rest, chose to shoot. Felt rested and steady. Shakespeare. Painted arrows. Gearing up for nationals',[]],
['Very windy today, gusty from the left',['Wind/weather']],
['it was raining and cold',['Wind/weather']],
['sun glare on the boss',['Wind/weather']],
['felt tired, bad sleep',['Tired']],
['really nervous, hands shaking',['Nerves']],
['new arrows this week',['Gear change']],
['shoulder sore',['Injury']],
["didn't finish the round",['Incomplete']],
['hot and windy, tired and sore, new sight',['Tired','Wind/weather','Gear change','Injury']],
['No wind at all. Was perfect day. And i could hold the bow steady at 90 and 70. At 50 I started to struggle a bit.',[]],
['not windy, calm and sunny, perfect day',[]],
["it wasn't windy",[]],
['without any rain',[]],
['barely any breeze, hardly a gust',[]],
['calm day, zero wind',[]],
['no wind but it rained later',['Wind/weather']],
['not tired, not nervous, no pain',[]],
['I never felt sore',[]],
["didn't finish, no wind",['Incomplete']],
['no sleep last night',['Tired']],
];
for(const[t,e]of cases)a.deepStrictEqual(n(t),e,t);
console.log('tags: '+cases.length+' cases ok');
