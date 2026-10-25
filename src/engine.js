(function(g){
'use strict';
var Planner=typeof module!=='undefined'?require('./planner.js'):g.RankAdvisorPlanner;
var Knowledge=typeof module!=='undefined'?require('./knowledge-data.js'):g.RankAdvisorKnowledge;
var Stats=typeof module!=='undefined'?require('./statistics.js'):g.RankAdvisorStatistics;
var StatsData=typeof module!=='undefined'?require('./stats-data.js'):g.RankAdvisorStatsData;
function create(data,profile,statistics){
 var heroes=Object.create(null),aliases=Object.create(null),raw=statistics||StatsData,planner=Planner.create(Knowledge,data,profile,raw),stats=Stats.create(raw);
 function key(s){return String(s||'').trim().toLowerCase().replace(/[\s_&-]+/g,'');}
 data.heroes.forEach(function(h){heroes[h.id]=h;aliases[key(h.id)]=h.id;aliases[key(h.name)]=h.id;});
 Object.keys(profile.aliases||{}).forEach(function(a){if(heroes[profile.aliases[a]])aliases[key(a)]=profile.aliases[a];});
 function resolve(s){return aliases[key(s)]||null;}
 function name(id){return heroes[id]?heroes[id].name:String(id||'');}
 function complete(rows){return Array.isArray(rows)&&rows.length===6&&rows.every(function(s){return typeof s==='string'&&s.trim()&&!/[{}]/.test(s);})&&new Set(rows.map(function(s){return resolve(s)||key(s);})).size===6;}
 function snapshot(){var frozen=null,session=null;return {reset:function(){frozen=null;session=null;},update:function(input){if(session!==input.session){session=input.session;frozen=null;}if(!frozen&&input.captureAllowed&&complete(input.enemy))frozen=input.enemy.slice();return {friendly:complete(input.friendly)?input.friendly.slice():null,enemy:frozen?frozen.slice():null,locked:!!frozen};}};}
 function lane(own,mate,foes,input){var ids=[own,mate].concat(foes||[]);if(ids.length!==4||new Set(ids).size!==4||!ids.every(function(id){return Knowledge.heroes[id];}))return {ready:false,notes:['选择同路队友和两名对线敌人']};var p=planner.pair(own,mate,input||{},foes);return {ready:true,label:name(own)+' + '+name(mate),notes:p.reasons.concat(p.pressure),edge:p.score};}
 function analyze(input){
  if(!complete(input.friendly)||!complete(input.enemy))return {ready:false,status:'等待双方完整阵容'};
  var friendly=input.friendly.map(function(s){return resolve(s)||s;}),enemy=input.enemy.map(function(s){return resolve(s)||s;}),own=resolve(input.own),mate=resolve(input.mate);
  if(friendly.indexOf(own)<0)own=null;if(friendly.indexOf(mate)<0||mate===own)mate=null;
  var foes=(input.foes||[]).map(resolve).filter(function(id){return enemy.indexOf(id)>=0;});if(foes.length!==2||new Set(foes).size!==2)foes=[];
  var available=Array.isArray(input.available)?input.available.map(resolve).filter(Boolean):null,excluded=(profile.excluded||[]).map(resolve);
  var eligible=Array.from(new Set((profile.unlocked||[]).map(resolve).filter(Boolean))).filter(function(id){return id!==own&&friendly.indexOf(id)<0&&enemy.indexOf(id)<0&&excluded.indexOf(id)<0&&(!available||available.indexOf(id)>=0)&&(heroes[id].apiActive!==false||(available&&available.indexOf(id)>=0));});
  var normalized=Object.assign({},input,{friendly:friendly,enemy:enemy,own:own,mate:mate,foes:foes}),r=planner.analyze(normalized,own?eligible:[]),sr=stats.analyze(normalized,own?eligible:[]);
  return Object.assign(r,{ready:true,friendly:friendly,enemy:enemy,ownSelected:!!own,enemyCoverage:enemy.filter(function(id){return !!Knowledge.heroes[id];}).length,lane:lane(own,mate,foes,input),statistics:sr,statisticsLines:Stats.lines(sr,name),mechanicsNotes:[],warnings:[]});
 }
 return {resolve:resolve,name:name,complete:complete,snapshot:snapshot,analyze:analyze,heroes:heroes,lane:lane,knowledge:Knowledge};
}
if(typeof module!=='undefined')module.exports={create:create};else g.RankAdvisorEngine={create:create};
})(typeof globalThis!=='undefined'?globalThis:this);
