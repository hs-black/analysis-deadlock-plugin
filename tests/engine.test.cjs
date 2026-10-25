const {test}=require('node:test'),a=require('node:assert/strict');
const data=require('../src/data.js'),{create}=require('../src/engine.js');
const friendly=['haze','wraith','vindicta','seven','infernus','mcginnis'];
const enemy=['abrams','mo_and_krill','kelvin','lash','bebop','dynamo'];
const profile=()=>({unlocked:['haze','paradox','viscous','pocket','abrams'],excluded:[],familiarity:{},aliases:{}});
const match=(extra={})=>({friendly,enemy,own:'haze',mate:'wraith',foes:['abrams','bebop'],...extra});
test('snapshot ignores incomplete/duplicate/placeholder rosters, freezes first complete roster',()=>{
 const e=create(data,profile()),s=e.snapshot();
 for(const enemies of [enemy.slice(1),['abrams','abrams',...enemy.slice(2)],['{s:hero_name}',...enemy.slice(1)]])a.equal(s.update({session:1,captureAllowed:true,friendly,enemy:enemies}).locked,false);
 const v=s.update({session:1,captureAllowed:true,friendly,enemy});v.enemy[0]='haze';
 const later=s.update({session:1,captureAllowed:true,friendly:['pocket',...friendly.slice(1)],enemy:['shiv',...enemy.slice(1)]});
 a.deepEqual(later.enemy,enemy);a.equal(later.friendly[0],'pocket');
 a.deepEqual(s.update({session:1,captureAllowed:true,friendly:[],enemy:[]}).enemy,enemy);
 a.equal(s.update({session:2,captureAllowed:false,friendly,enemy}).locked,false);
 a.equal(s.update({session:2,captureAllowed:true,friendly,enemy}).locked,true);s.reset();
 a.equal(s.update({session:2,captureAllowed:true,friendly,enemy:[]}).locked,false);
});
test('unknown nonempty hero labels can freeze but cannot masquerade as covered data',()=>{
 const e=create(data,profile()),r=e.analyze(match({friendly:['unreleased-new-hero',...friendly.slice(1)]}));
 a.equal(r.composition.coverage,5);a.deepEqual(r.composition.gaps,[]);
});
test('empty pool returns no swap recommendations',()=>{const p=profile();p.unlocked=[];a.deepEqual(create(data,p).analyze(match()).recommendations,[]);});
test('pool, exclusion, occupancy and availability are all enforced',()=>{
 const p=profile();p.unlocked=['paradox','viscous','pocket','abrams','wraith','apollo'];p.excluded=['viscous'];
 const e=create(data,p),r=e.analyze(match({available:['paradox','viscous','abrams','wraith','apollo']}));
 a.deepEqual(r.recommendations.map(x=>x.id),['paradox']);
 a.deepEqual(e.analyze(match({available:[]})).recommendations,[]);
});
test('changing selected hero recomputes marginal team composition',()=>{
 const e=create(data,profile());const r=e.analyze(match()),f=['paradox',...friendly.slice(1)];
 const n=e.analyze(match({friendly:f,own:'paradox'}));a.notDeepEqual(r.composition.totals,n.composition.totals);
 a.ok(n.recommendations.every(x=>x.id!=='paradox'));
});
test('lane requires four supported distinct heroes in their respective teams',()=>{
 const e=create(data,profile());a.equal(e.analyze(match()).lane.ready,true);
 for(const m of [{mate:'haze'},{mate:'pocket'},{foes:['abrams','abrams']},{foes:['abrams','haze']},{foes:[]}])a.equal(e.analyze(match(m)).lane.ready,false);
});
test('mechanical output never claims a win probability',()=>{
 const r=create(data,profile()).analyze(match());a.equal(r.winRate,undefined);a.equal(r.lane.winRate,undefined);a.ok(r.warnings.some(x=>x.includes('不是胜率')));
});
test('items target only initial enemy heroes and no duplicated items',()=>{
 const r=create(data,profile()).analyze(match());a.equal(new Set(r.items.map(x=>x.name)).size,r.items.length);
 a.ok(r.items.some(x=>x.name==='Healbane'));a.ok(!r.items.some(x=>x.name==='Metal Skin'));
 a.ok(r.items.every(x=>x.targets.every(t=>enemy.some(id=>data.heroes.find(h=>h.id===id).name===t))));
});
test('aliases and display names canonicalize; prototype keys remain unknown',()=>{
 const p=profile();p.aliases={'雾':'haze'};const e=create(data,p);a.equal(e.resolve('雾'),'haze');a.equal(e.resolve('Mo & Krill'),'mo_and_krill');a.equal(e.resolve('constructor'),null);
 a.equal(e.complete(['雾','Haze','Seven','Wraith','Infernus','McGinnis']),false);
});
test('unsupported current hero never produces speculative recommendations',()=>{
 const r=create(data,profile()).analyze(match({friendly:['apollo',...friendly.slice(1)],own:'apollo'}));a.deepEqual(r.recommendations,[]);a.deepEqual(r.items,[]);
});
