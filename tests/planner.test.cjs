const {test}=require('node:test'),a=require('node:assert/strict');
const data=require('../src/data'),k=require('../src/knowledge-data'),{create}=require('../src/planner');
const friendly=['celeste','paige','graves','viscous','apollo','doorman'],enemy=['abrams','mo_and_krill','kelvin','lash','bebop','dynamo'];
const input={friendly,enemy,own:'celeste',mate:'paige',foes:['abrams','mo_and_krill']};
const planner=(stats)=>create(k,data,{unlocked:['haze','wraith'],familiarity:{}},stats);
function snapshot(){return {schemaVersion:1,metadata:{source:'https://api.deadlock-api.com',fetchedAt:new Date().toISOString(),filters:{same_lane_filter:false}},heroes:data.heroes.map(h=>({id:h.id,wins:5000,matches:10000})),counters:['haze','wraith'].flatMap(id=>enemy.map(enemy=>({id,enemy,wins:id==='haze'?800:300,matches:1000}))),synergies:['haze','wraith'].flatMap(id=>friendly.slice(1).map(ally=>({id,ally,wins:id==='wraith'?800:300,matches:1000}))) };}
test('counter and synergy objectives rank concrete alternatives using historical results',()=>{
 const p=planner(snapshot()),counter=p.analyze({...input,goal:'counter'},['haze','wraith']),synergy=p.analyze({...input,goal:'synergy'},['haze','wraith']);
 a.equal(counter.recommendations[0].id,'haze');a.equal(synergy.recommendations[0].id,'wraith');
 a.equal(counter.recommendations[0].evidence.coverage,6);a.ok(counter.recommendations[0].reasons.some(s=>s.includes('80.0%，1000 场')));
});
test('partial statistics contribute only observed pairs; stale or invalid snapshots contribute no statistics',()=>{
 const s=snapshot();s.counters=s.counters.slice(0,1);const r=planner(s).analyze(input,['haze']).recommendations[0];
 a.equal(r.evidence.coverage,1);a.ok(Math.abs(r.breakdown.counter-(.3*1000/1400*100/6))<1e-8);
 for(const mutate of [s=>s.metadata.fetchedAt='2020-01-01',s=>s.schemaVersion=2,s=>s.metadata.filters.same_lane_filter=true,s=>s.counters[0].matches=10]){
  const x=snapshot();mutate(x);const out=planner(x).analyze(input,['haze']);if(x.counters[0].matches===10)a.equal(out.recommendations[0].evidence.coverage,5);else a.equal(out.recommendations[0].breakdown.counter,0);
 }
});
test('global lane plans cover six heroes once, preserve fixed partners, and agree with candidate partner',()=>{
 const r=planner().analyze({...input,lockMate:true},['haze','wraith']);
 for(const [plan,team,own] of [[r.lanePlan,friendly,'celeste'],...r.recommendations.map(x=>[x.lanePlan,[x.id,...friendly.slice(1)],x.id])]){
  a.equal(plan.pairs.length,3);a.deepEqual(new Set(plan.pairs.flatMap(p=>p.ids)),new Set(team));a.ok(plan.pairs.some(p=>p.ids.includes(own)&&p.ids.includes('paige')));
 }
 for(const x of r.recommendations)a.deepEqual(x.partner.ids,x.lanePlan.pairs.find(p=>p.ids.includes(x.id)).ids);
});
test('explicit interrupts exclude sleep, rabbit hex and reactive barriers',()=>{
 for(const id of ['haze','sinclair','celeste','kelvin'])a.equal(k.heroes[id].capabilities.interrupt,undefined);
 a.match(k.abilities[k.heroes.haze.abilities[0]].description.join(' '),/does not interrupt/i);
 a.match(k.abilities[k.heroes.sinclair.abilities[2]].description.join(' '),/does not interrupt/i);
 const r=planner().analyze(input,['haze','sinclair']);a.ok(r.recommendations.every(x=>!x.reasons.some(s=>s.includes('把 Sleep Dagger 留给')||s.includes('把 Rabbit Hex 留给'))));
 a.equal(k.heroes.celeste.capabilities.setup,undefined);a.equal(k.heroes.vyper.capabilities.setup,undefined);a.equal(k.heroes.victor.capabilities.setup,undefined);a.equal(k.heroes.mina.capabilities.setup,undefined);
});
test('Paige improves weapon partners; gun-triggered spirit heroes keep spirit output',()=>{
 const p=planner();a.ok(p.pair('paige','wraith',{}).reasons.some(s=>s.includes('Plot Armor')&&s.includes('射击')));
 for(const id of ['infernus','mirage','seven','mina'])a.ok(p.hero(id,{}).d.spirit>=2);
 a.ok(p.hero('infernus',{}).d.spirit>p.hero('infernus',{}).d.weapon);
});
test('cleanse scopes, channel prevention and counter-item purposes stay distinct',()=>{
 const p=planner(),pocket=p.loadout('paige',['pocket'],input),infernus=p.loadout('paige',['infernus'],input);
 a.ok(!pocket.some(x=>x.name==='Dispel Magic'));a.ok(pocket.some(x=>x.name==='Divine Barrier'));
 const dispel=infernus.find(x=>x.name==='Dispel Magic');a.ok(dispel);a.ok(dispel.targetDetails.some(x=>x.includes('Afterburn')));
 const rules=k.itemCounters;a.ok(!rules.find(x=>x.name==='Silence Wave').tags.includes('channel'));
 a.ok(rules.find(x=>x.name==='Unstoppable').timing.includes('前开启'));
 const items=p.loadout('wraith',enemy,input);a.equal(new Set(items.map(x=>x.purpose)).size,items.length);a.ok(items.every(x=>k.items.some(i=>i.name===x.name&&i.standard&&i.cost===x.cost)));
});
test('full knowledge references resolve and normal shop excludes special reward prices',()=>{
 a.equal(Object.keys(k.heroes).length,44);a.equal(k.items.filter(i=>i.standard).length,156);
 for(const h of Object.values(k.heroes)){a.equal(h.abilities.length,4);h.abilities.forEach(id=>a.ok(k.abilities[id]));for(const [cap,slot] of Object.entries(h.capabilities))a.ok(k.abilities[h.abilities[slot-1]],h.name+' '+cap);}
 for(const r of k.itemCounters)a.ok(k.items.some(i=>i.standard&&i.name===r.name));a.ok(k.items.filter(i=>i.standard).every(i=>[800,1600,3200,6400].includes(i.cost)));
});
