(function(g){
'use strict';
var labels={weapon:'持续武器输出',spirit:'元灵输出',burst:'瞬间爆发',aoe:'范围伤害',teamControl:'团控',frontline:'前排承伤',sustain:'续航',save:'保护救人',engage:'先手',tempo:'游走节奏',scaling:'后期成长',clear:'清线推进',poke:'远程消耗',mobility:'机动'};
var targets={weapon:7,spirit:7,aoe:7,teamControl:4,frontline:5,sustain:4,save:3,engage:4,tempo:8,scaling:7,clear:8};
var weights={weapon:1.3,spirit:1.3,aoe:1,teamControl:1.2,frontline:1.1,sustain:.65,save:.75,engage:1,tempo:.75,scaling:.6,clear:.8};
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function pairKey(a,b){return [a,b].sort().join('|');}
function create(k,data,profile,snapshot){
 var hs=k.heroes,overall=Object.create(null),counter=Object.create(null),synergy=Object.create(null),s=snapshot||{},meta=s.metadata;
 function rec(r){return r&&Number.isSafeInteger(r.matches)&&r.matches>0&&Number.isSafeInteger(r.wins)&&r.wins>=0&&r.wins<=r.matches?{p:r.wins/r.matches,n:r.matches}:null;}
 (s.heroes||[]).forEach(function(r){overall[r.id]=rec(r);});(s.counters||[]).forEach(function(r){counter[r.id+'|'+r.enemy]=rec(r);});(s.synergies||[]).forEach(function(r){synergy[pairKey(r.id,r.ally)]=rec(r);});
 function fresh(){var age=meta?Date.now()-Date.parse(meta.fetchedAt):Infinity;return s.schemaVersion===1&&meta&&meta.source==='https://api.deadlock-api.com'&&meta.filters&&meta.filters.same_lane_filter===false&&age>=-300000&&age<7*86400000;}
 function name(id){return hs[id]?hs[id].name:(data.heroes.find(function(h){return h.id===id;})||{}).name||String(id||'');}
 function ability(id,cap){var h=hs[id],slot=h&&h.capabilities[cap];return h&&slot&&k.abilities[h.abilities[slot-1]];}
 function abilityName(id,cap){var a=ability(id,cap);return a?a.name:'';}
 function hero(id,input){var h=hs[id];if(!h)return null;var d=Object.assign({},h.dimensions),route=(input.builds||{})[id]||'default';
  if(route==='default'&&input.gunRoles&&typeof input.gunRoles[id]==='boolean')route=input.gunRoles[id]?'weapon':'spirit';
  if(route==='weapon'){d.weapon=clamp(Math.max(2.5,d.weapon+1),0,3);d.spirit=Math.max(0,d.spirit-.5);d.aoe=Math.max(0,d.aoe-.5);}
  if(route==='spirit'){d.spirit=clamp(d.spirit+1,0,3);d.weapon=Math.max(0,d.weapon-1);d.aoe=clamp(d.aoe+.5,0,3);}
  if(route==='support'){d.save=clamp(d.save+.5,0,3);d.weapon=Math.max(0,d.weapon-1);d.spirit=Math.max(0,d.spirit-.5);}
  var tags=h.tags.slice();if(d.weapon>=2.5&&tags.indexOf('gunCarry')<0)tags.push('gunCarry');if(d.spirit>=2.5)tags.push('spiritPressure');if(d.frontline>=2.5)tags.push('frontline');
  return {id:id,name:h.name,d:d,tags:tags,route:route==='default'?h.route:route,model:h};
 }
 function composition(ids,input){var sum={},missing=[],members=ids.map(function(id){return hero(id,input);});Object.keys(labels).forEach(function(key){sum[key]=0;});members.forEach(function(h,i){if(!h){missing.push(ids[i]);return;}Object.keys(sum).forEach(function(key){sum[key]+=h.d[key];});});
  var guns=members.filter(function(h){return h&&h.d.weapon>=2.5;}),gaps=missing.length?[]:Object.keys(targets).filter(function(key){return sum[key]<targets[key];}).sort(function(a,b){return (sum[a]/targets[a])-(sum[b]/targets[b]);});
  if(!missing.length&&!guns.length&&gaps.indexOf('weapon')<0)gaps.unshift('weapon');
  var strengths=Object.keys(targets).filter(function(key){return sum[key]>=targets[key]+2;}).sort(function(a,b){return sum[b]/targets[b]-sum[a]/targets[a];}).slice(0,3);
  var score=Object.keys(targets).reduce(function(v,key){return v+Math.min(sum[key],targets[key])*weights[key];},0);if(guns.length)score+=2;
  return {coverage:ids.length-missing.length,missing:missing,totals:sum,gaps:gaps,strengths:strengths,gunHeroes:guns.map(function(h){return h.id;}),gunUnknown:missing,score:score,
   summary:(strengths.length?strengths.map(function(x){return labels[x];}).join('、')+'充足；':'')+(gaps.length?'优先补'+gaps.slice(0,2).map(function(x){return labels[x];}).join('、'):'可围绕现有输出核心安排先手与保护')};
 }
 function matchup(id,enemy){var r=counter[id+'|'+enemy],a=overall[id],b=overall[enemy];if(!fresh()||!r||!a||!b||r.n<30||a.n<100||b.n<100)return null;var p=clamp(a.p,.01,.99),q=clamp(b.p,.01,.99),expected=p*(1-q)/(p*(1-q)+(1-p)*q);return {effect:(r.p-expected)*r.n/(r.n+400),rate:r.p,n:r.n};}
 function synergyEffect(a,b){var r=synergy[pairKey(a,b)],x=overall[a],y=overall[b];if(!fresh()||!r||!x||!y||r.n<30||x.n<100||y.n<100)return null;var p=clamp(x.p,.01,.99),q=clamp(y.p,.01,.99),expected=p*q/(p*q+(1-p)*(1-q));return {effect:(r.p-expected)*r.n/(r.n+400),rate:r.p,n:r.n};}
 function pair(a,b,input,foes){var x=hero(a,input),y=hero(b,input);if(!x||!y||a===b)return {ids:[a,b],score:0,reasons:[]};var d=x.d,e=y.d,sy=synergyEffect(a,b),reasons=[],score=0;
  score+=Math.min(4,d.poke+e.poke)*.5+Math.min(4,d.clear+e.clear)*.45+Math.min(3,d.sustain+e.sustain)*.6;
  score+=Math.max(d.burst,e.burst)*Math.min(1,(ability(a,'setup')?1:0)+(ability(b,'setup')?1:0))*.65;
  score+=Math.max(d.save*e.weapon,e.save*d.weapon,d.save*e.spirit,e.save*d.spirit)*.22;
  if(d.scaling>=3&&e.scaling>=3&&d.sustain+e.sustain<2)score-=1.4;
  if(sy)score+=sy.effect*12;
  var setters=[a,b].filter(function(id){return ability(id,'setup');}).sort(function(a,b){return hs[a].capabilities.setup-hs[b].capabilities.setup;}),setter=setters[0],finisher=setter===a?b:a;
  if(setter)reasons.push(name(setter)+' 用 '+abilityName(setter,'setup')+(setter==='apollo'?' 限制目标，结束时由 ':hs[setter].capabilities.setup===4?' 开大留人，':' 留人，')+name(finisher)+' 跟伤害');
  var saver=d.save>=e.save?a:b,carry=saver===a?b:a;if(ability(saver,'save'))reasons.push(name(saver)+' 留 '+abilityName(saver,'save')+' 保护 '+name(carry));
  if(ability(a,'weaponBuff')&&e.weapon>=2)reasons.unshift(name(a)+' 的 '+abilityName(a,'weaponBuff')+' 强化 '+name(b)+' 的射击');
  if(ability(b,'weaponBuff')&&d.weapon>=2)reasons.unshift(name(b)+' 的 '+abilityName(b,'weaponBuff')+' 强化 '+name(a)+' 的射击');
  if(!reasons.length)reasons.push(name(d.clear>=e.clear?a:b)+' 先清兵，搭档从侧面消耗');
  var pressure=[];if(Array.isArray(foes)&&foes.length===2){var enemy=foes.map(function(id){return hero(id,input);});if(enemy.every(Boolean)){
   var ep=enemy.reduce(function(n,h){return n+h.d.poke;},0),ec=enemy.reduce(function(n,h){return n+h.d.clear;},0);score+=(d.poke+e.poke-ep)*.25+(d.clear+e.clear-ec)*.25;
   if(ep>d.poke+e.poke)pressure.push('先用掩体保血，让清线更快的一人处理兵线');
   if(enemy.some(function(h){return h.tags.indexOf('healing')>=0;}))pressure.push('缩短无收益换血，重伤到手后再持续压人');
   if(enemy.some(function(h){return h.tags.indexOf('catch')>=0;}))pressure.push('两人错开站位，留保护技能接应被抓的人');
  }}
  return {ids:[a,b],score:score,reasons:reasons.slice(0,2),pressure:pressure,synergy:sy};
 }
 function lanePartners(own,team,input,foes){return team.filter(function(id){return id!==own;}).map(function(id){return pair(own,id,input,foes);}).sort(function(a,b){return b.score-a.score;});}
 function partitions(ids){if(!ids.length)return [[]];var a=ids[0],out=[];ids.slice(1).forEach(function(b){partitions(ids.filter(function(id){return id!==a&&id!==b;})).forEach(function(rest){out.push([[a,b]].concat(rest));});});return out;}
 function lanePlan(team,input){var locked=input.lockMate&&team.indexOf(input.mate)>=0&&team.indexOf(input.own)>=0?pairKey(input.own,input.mate):null;
  var plans=partitions(team).filter(function(ps){return !locked||ps.some(function(p){return pairKey(p[0],p[1])===locked;});}).map(function(ps){var pairs=ps.map(function(p){var foes=p.indexOf(input.own)>=0?input.foes:null;return pair(p[0],p[1],input,foes);});return {pairs:pairs,score:pairs.reduce(function(n,p){return n+p.score;},0)};}).sort(function(a,b){return b.score-a.score;});return plans[0]||null;
 }
 function interactions(id,team,enemy,input){var h=hero(id,input);if(!h)return {score:0,reasons:[]};var es=enemy.map(function(e){return hero(e,input);}).filter(Boolean),score=0,reasons=[];
  var channels=es.filter(function(e){return ability(e.id,'channel');});if(ability(id,'interrupt')&&channels.length){var reactive=id==='apollo';score+=Math.min(2,channels.length*.6)*(reactive?.5:1);reasons.push((reactive?'Riposte 成功反击后眩晕目标；':(h.model.interruptNote?h.model.interruptNote+' ':'把 '+abilityName(id,'interrupt')+' 留给 '))+(!reactive?channels.slice(0,2).map(function(e){return name(e.id)+' 的 '+abilityName(e.id,'channel');}).join(' / '):'跟队友一起限制持续施法目标'));}
  var guns=es.filter(function(e){return e.d.weapon>=2.5;});if(guns.length&&(ability(id,'disarm')||id==='kelvin')){score+=Math.min(2,guns.length*.6);reasons.push('用 '+(abilityName(id,'disarm')||'Arctic Beam')+' 压制 '+guns.slice(0,2).map(function(e){return e.name;}).join(' / ')+' 的射击窗口');}
  var divers=es.filter(function(e){return e.tags.indexOf('dive')>=0||e.tags.indexOf('catch')>=0;});if(ability(id,'save')&&divers.length){score+=Math.min(1.8,divers.length*.45);reasons.push('留 '+abilityName(id,'save')+' 接应被 '+divers.slice(0,2).map(function(e){return e.name;}).join(' / ')+' 切入的队友');}
  var aoeAlly=team.filter(function(a){return a!==id&&hero(a,input)&&hero(a,input).d.aoe>=2.5;})[0];if(ability(id,'group')&&aoeAlly){score+=1.3;reasons.push(abilityName(id,'group')+' 聚拢或限制多人，接 '+name(aoeAlly)+' 的范围伤害');}
  var grouping=team.find(function(a){return a!==id&&ability(a,'group');});if(h.d.aoe>=2.5&&grouping){score+=1.1;reasons.push('把范围伤害接在 '+name(grouping)+' 的 '+abilityName(grouping,'group')+' 后面');}
  if(ability(id,'weaponBuff')){var gunAlly=team.find(function(a){return a!==id&&hero(a,input)&&hero(a,input).d.weapon>=2.5;});if(gunAlly){score+=1.2;reasons.push(abilityName(id,'weaponBuff')+' 强化 '+name(gunAlly)+' 的武器输出');}}
  if(id==='sinclair'){var copy=es.sort(function(a,b){return b.d.teamControl-a.d.teamControl;})[0];if(copy&&copy.d.teamControl>=2){score+=.8;reasons.push('Audience Participation 可复制 '+copy.name+' 的大招补团战能力');}}
  return {score:score,reasons:reasons};
 }
 function loadout(own,enemy,input){var h=hero(own,input);if(!h)return [];var es=enemy.map(function(id){return hero(id,input);}).filter(Boolean),items=k.items.filter(function(i){return i.standard;});
  var scored=(k.itemCounters||[]).map(function(rule){var item=items.find(function(i){return i.name===rule.name;});if(!item)return null;
   if(rule.route==='weapon'&&h.d.weapon<2)return null;if(rule.route==='spirit'&&h.d.spirit<2)return null;if(rule.route==='spiritBurst'&&(h.d.spirit<2||h.d.burst<2))return null;
   if(rule.name==='Spirit Shredder'&&composition(input.friendly||[own],input).totals.spirit<7)return null;
   if(rule.name==='Bullet Resist Shredder'&&composition(input.friendly||[own],input).totals.weapon<7)return null;
   if(rule.route==='commit'&&!ability(own,'channel')&&h.d.frontline<2&&h.d.weapon<2.5)return null;
   var matched=es.filter(function(e){return rule.tags.some(function(t){return e.tags.indexOf(t)>=0;});});if(!matched.length)return null;
   var score=rule.weight+Math.min(2,matched.length*.45)-(item.cost/6400)*.7+(rule.route==='support'?(h.d.save>=2?.6:-1.4):0);
   if(rule.name==='Divine Barrier'&&matched.some(function(e){return e.tags.indexOf('ultimateDot')>=0;}))score+=.8;
   if(rule.purpose==='antiheal'&&matched.filter(function(e){return e.tags.indexOf('healing')>=0;}).length>=2)score+=1.5;
   if(rule.name==='Healbane'&&h.route==='weapon')score-=1;if(rule.name==='Toxic Bullets'&&h.route==='weapon')score+=.8;
   var targets=matched.map(function(e){return e.name;}),details=matched.map(function(e){var cap=rule.purpose==='cleanse'?'cleanseTarget':rule.purpose==='interrupt'?(ability(e.id,'channel')?'channel':'flight'):null;return cap&&ability(e.id,cap)?e.name+' · '+abilityName(e.id,cap):e.name;});
   var timing=rule.timing;if(rule.name==='Knockdown'&&matched.some(function(e){return e.id==='warden'||e.id==='rem';}))timing+='；面对免控升级，改在起手前限制其进场';
   if(rule.name==='Cursed Relic')timing+='，期间自身输出降低';
   return {id:item.className,name:item.name,cost:item.cost,purpose:rule.purpose,score:score,reason:rule.effect,timing:timing,targets:targets,targetDetails:details,stage:item.cost<=1600?'对线/首轮交战':item.cost<=3200?'中期针对':'关键团战',source:'https://api.deadlock-api.com/v1/assets/items/'+item.id+'?client_version='+k.build};
  }).filter(Boolean).sort(function(a,b){return b.score-a.score;});var chosen=[],seen={};scored.forEach(function(i){if(!seen[i.purpose]){seen[i.purpose]=true;i.alternatives=scored.filter(function(j){return j.purpose===i.purpose&&j.id!==i.id;}).slice(0,2).map(function(j){return {name:j.name,cost:j.cost};});chosen.push(i);}});return chosen.slice(0,4);
 }
 function analyze(input,eligible){var team=input.friendly,enemy=input.enemy,own=input.own,comp=composition(team,input),goal=input.goal||'balanced',w=goal==='counter'?{comp:.65,mech:1.2,counter:.7,synergy:.15,lane:.25}:goal==='synergy'?{comp:1.1,mech:.7,counter:.2,synergy:.65,lane:.5}:{comp:1,mech:1,counter:.4,synergy:.3,lane:.35};
  function evaluate(id,next){var h=hero(id,input);if(!h)return null;var c=composition(next,input),mechanics=interactions(id,next,enemy,input),partners=lanePartners(id,next,input,input.foes),fullPlan=lanePlan(next,Object.assign({},input,{own:id})),best=fullPlan&&fullPlan.pairs.find(function(p){return p.ids.indexOf(id)>=0;})||partners[0];
   var ms=enemy.map(function(e){var r=matchup(id,e);return r?Object.assign({enemy:e},r):null;}).filter(Boolean),ss=next.filter(function(a){return a!==id;}).map(function(a){var r=synergyEffect(id,a);return r?Object.assign({ally:a},r):null;}).filter(Boolean);
   var counterPoints=ms.reduce(function(n,r){return n+r.effect*100;},0)/6,synergyPoints=ss.reduce(function(n,r){return n+r.effect*100;},0)/5;
   var familiarity=clamp(Number((profile.familiarity||{})[id])||0,0,2)*.7,score=c.score*w.comp+mechanics.score*w.mech+counterPoints*w.counter+synergyPoints*w.synergy+(fullPlan?fullPlan.score/3:0)*w.lane+familiarity;
   return {id:id,score:score,composition:c,mechanics:mechanics,partners:partners,partner:best,lanePlan:fullPlan,matchups:ms,synergies:ss,counterPoints:counterPoints,synergyPoints:synergyPoints,model:h.model,route:h.route};
  }
  var base=team.indexOf(own)>=0?evaluate(own,team):null,candidates=eligible.map(function(id){var next=team.map(function(h){return h===own?id:h;});return evaluate(id,next);}).filter(Boolean).sort(function(a,b){return b.score-a.score||a.id.localeCompare(b.id);});
  var top=candidates.slice(0,3).map(function(x,i){var reasons=x.mechanics.reasons.slice(),fills=comp.gaps.filter(function(key){return x.composition.totals[key]>comp.totals[key];});if(fills.length)reasons.unshift('补'+fills.slice(0,2).map(function(key){return labels[key];}).join('、'));
   var strong=x.matchups.slice().sort(function(a,b){return b.effect-a.effect;})[0];if(strong&&strong.effect>.01)reasons.push('对 '+name(strong.enemy)+' 的对阵表现较好：'+(strong.rate*100).toFixed(1)+'%，'+strong.n+' 场');
   var ally=x.synergies.slice().sort(function(a,b){return b.effect-a.effect;})[0];if(ally&&ally.effect>.01)reasons.push('与 '+name(ally.ally)+' 同队表现较好：'+(ally.rate*100).toFixed(1)+'%，'+ally.n+' 场');
   if(!reasons.length)reasons.push(x.model.strength);var old=hero(own,input),lost=old?Object.keys(targets).filter(function(key){return old.d[key]-hero(x.id,input).d[key]>=1;}).sort(function(a,b){return (old.d[b]-hero(x.id,input).d[b])-(old.d[a]-hero(x.id,input).d[a]);}):[];
   return {id:x.id,rank:i+1,delta:base?x.score-base.score:0,score:x.score,reasons:reasons.slice(0,3),tradeoff:lost.length?'换后'+lost.slice(0,2).map(function(key){return labels[key];}).join('、')+'减少':x.model.tradeoff,plan:x.model.plan,route:x.route,partner:x.partner,lanePlan:x.lanePlan,items:loadout(x.id,enemy,input),evidence:{matchups:x.matchups,synergies:x.synergies,coverage:x.matchups.length},breakdown:{composition:x.composition.score,mechanics:x.mechanics.score,counter:x.counterPoints,synergy:x.synergyPoints}};
  });
  var decision=!own?'needs_hero':!profile.unlocked||!profile.unlocked.length?'needs_pool':!eligible.length?'no_eligible_candidates':!top.length?'no_supported_candidates':base&&top[0].delta<=0?'keep':'recommend_swap';
  var message=decision==='recommend_swap'?'首选换成 '+name(top[0].id):decision==='keep'?'保留 '+name(own)+' 更合适；需要调整打法时可选下列英雄':decision==='needs_hero'?'先选择你使用的英雄':decision==='needs_pool'?'勾选已解锁英雄，生成换人推荐':'当前英雄池没有可替换候选';
  var threats={};enemy.forEach(function(id){var h=hero(id,input);if(h)h.tags.forEach(function(t){threats[t]=(threats[t]||0)+1;});});var enemyPlan=[];if(threats.healing>=2)enemyPlan.push('优先重伤压回复');if(threats.dive>=2||threats.catch>=2)enemyPlan.push('留保护接第一轮突进');if(threats.channel>=2)enemyPlan.push('分配打断盯住持续施法');if(threats.gunCarry>=3)enemyPlan.push('缴械与子弹防御价值高');if(threats.spiritPressure>=3)enemyPlan.push('补元灵抗性接技能轮转');
  return {composition:comp,recommendations:top,decision:decision,decisionMessage:message,keep:decision==='keep'?true:decision==='recommend_swap'?false:null,enemyPlan:enemyPlan.slice(0,3),lanePartners:base?base.partners.slice(0,3):[],lanePlan:lanePlan(team,input),items:loadout(own,enemy,input),evidence:{build:k.build,metadata:meta,fresh:!!fresh(),coverage:base?base.matchups.length:0},dimensions:labels};
 }
 return {analyze:analyze,composition:composition,pair:pair,hero:hero,loadout:loadout,labels:labels};
}
var api={create:create,labels:labels};if(typeof module!=='undefined')module.exports=api;else g.RankAdvisorPlanner=api;
})(typeof globalThis!=='undefined'?globalThis:this);
