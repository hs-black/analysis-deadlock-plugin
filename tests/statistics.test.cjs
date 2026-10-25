const {test}=require('node:test'),a=require('node:assert/strict');
const {create,record,lines}=require('../src/statistics.js'),engine=require('../src/engine.js'),data=require('../src/data.js');
const now=Date.parse('2026-10-25T12:00:00Z');
const enemies=['abrams','mo_and_krill','kelvin','lash','bebop','dynamo'];
const friendly=['celeste','paige','graves','viscous','apollo','doorman'];
const input={friendly,enemy:enemies,own:'celeste'};
// Synthetic counts solely for deterministic tests. Never packaged as match data.
function fixture(){return {schemaVersion:1,metadata:{source:'https://api.deadlock-api.com',fetchedAt:new Date(now).toISOString(),filters:{same_lane_filter:false,match_mode:'ranked'}},heroes:['celeste','rat_king',...enemies].map(id=>({id,wins:500,matches:1000})),counters:['celeste','rat_king'].flatMap(id=>enemies.map(enemy=>({id,enemy,wins:id==='rat_king'?650:500,matches:1000}))),synergies:[{id:'paige',ally:'celeste',wins:550,matches:1000}]};}
test('counter rows preserve direction, include sample intervals, and compare against all six enemies',()=>{
 const r=create(fixture()).analyze(input,['rat_king'],now);a.equal(r.own.coverage,6);a.equal(r.own.counters[0].record.winRate,.5);a.equal(r.recommendations[0].id,'rat_king');a.equal(r.own.synergies[0].record.winRate,.55);
 a.ok(r.own.overall.low<.5&&r.own.overall.high>.5);a.equal(r.winProbability,undefined);a.equal(r.recommendations[0].winRate,undefined);
 a.ok(lines(r,x=>x).some(x=>x.includes('不是胜率提升')));
});
test('baseline strength alone does not masquerade as a counter advantage',()=>{
 const s=fixture();s.heroes.find(h=>h.id==='rat_king').wins=650;
 const r=create(s).analyze(input,['rat_king'],now);a.ok(Math.abs(r.candidates[0].index)<1e-10);a.deepEqual(r.recommendations,[]);
});
test('sparse or incomplete data never supplies a zero effect or a six-enemy recommendation',()=>{
 for(const mode of ['missing','sparse']){const s=fixture();if(mode==='missing')s.counters.pop();else Object.assign(s.counters.at(-1),{wins:5,matches:10});
  const r=create(s).analyze(input,['rat_king'],now);a.equal(r.candidates[0].index,null);a.deepEqual(r.recommendations,[]);
 }
});
test('absent, stale, future and same-lane-only snapshots cannot generate counter recommendations',()=>{
 a.equal(create(null).analyze(input,['rat_king'],now).loaded,false);
 for(const age of [8*86400000,-86400000]){const s=fixture();s.metadata.fetchedAt=new Date(now-age).toISOString();const r=create(s).analyze(input,['rat_king'],now);a.equal(r.fresh,false);a.deepEqual(r.recommendations,[]);}
 const s=fixture();s.metadata.filters.same_lane_filter=true;a.equal(create(s).analyze(input,['rat_king'],now).loaded,false);
});
test('invalid counts and zero samples never render a percentage',()=>{for(const r of [{wins:0,matches:0},{wins:11,matches:10},{wins:-1,matches:10},{wins:NaN,matches:10},{wins:2,matches:3.5}])a.equal(record(r,100),null);});
test('new heroes can be evaluated statistically without invented mechanics and eligibility remains enforced',()=>{
 const s=fixture();s.metadata.fetchedAt=new Date().toISOString();
 const e=engine.create(data,{unlocked:['rat_king']},s),r=e.analyze(input);
 a.equal(data.heroes.find(h=>h.id==='rat_king').traits,null);a.equal(r.decision,'no_supported_candidates');a.equal(r.statistics.recommendations[0].id,'rat_king');
 a.deepEqual(e.analyze({...input,available:[]}).statistics.recommendations,[]);
});
