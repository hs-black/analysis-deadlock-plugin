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
 const p=profile();p.unlocked=['paradox','viscous','pocket','abrams','wraith','billy'];p.excluded=['viscous'];
 const e=create(data,p),r=e.analyze(match({available:['paradox','viscous','abrams','wraith','billy']}));
 a.deepEqual(r.recommendations.map(x=>x.id),['paradox','billy']);
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
 const r=create(data,profile()).analyze(match());a.equal(r.winRate,undefined);a.equal(r.lane.winRate,undefined);a.deepEqual(r.warnings,[]);
});
test('items target only initial enemy heroes and no duplicated items',()=>{
 const r=create(data,profile()).analyze(match());a.equal(new Set(r.items.map(x=>x.name)).size,r.items.length);
 a.ok(r.items.some(x=>x.purpose==='antiheal'));a.ok(!r.items.some(x=>x.name==='Metal Skin'));
 a.ok(r.items.every(x=>x.targets.every(t=>enemy.some(id=>data.heroes.find(h=>h.id===id).name===t))));
});
test('aliases and display names canonicalize; prototype keys remain unknown',()=>{
 const p=profile();p.aliases={'雾':'haze'};const e=create(data,p);a.equal(e.resolve('雾'),'haze');a.equal(e.resolve('Mo & Krill'),'mo_and_krill');a.equal(e.resolve('constructor'),null);
 a.equal(e.complete(['雾','Haze','Seven','Wraith','Infernus','McGinnis']),false);
});
test('unsupported current hero never produces speculative recommendations',()=>{
 const r=create(data,profile()).analyze(match({friendly:['unreleased-new-hero',...friendly.slice(1)],own:'unreleased-new-hero'}));a.deepEqual(r.recommendations,[]);a.deepEqual(r.items,[]);
});
const screenshot=['celeste','paige','graves','viscous','apollo','doorman'];
const screenshotMatch=(extra={})=>match({friendly:screenshot,own:'celeste',mate:'paige',foes:['abrams','mo_and_krill'],...extra});
test('reported six-hero roster detects missing weapon carry and recommends eligible gun heroes',()=>{
 const e=create(data,{unlocked:['haze','wraith','vindicta']}),r=e.analyze(screenshotMatch());
 a.equal(r.composition.coverage,6);a.ok(r.composition.gaps.includes('weapon'));a.equal(r.decision,'recommend_swap');a.equal(r.keep,false);
 a.deepEqual(new Set(r.recommendations.map(x=>x.id)),new Set(['haze','wraith','vindicta']));
 a.ok(r.recommendations.every(x=>x.reasons.some(t=>t.includes('补持续武器输出'))));
});
test('pool and own selection give actionable setup messages',()=>{
 const cases=[
  [{unlocked:[]},screenshotMatch(),'needs_pool'],
  [{unlocked:['haze']},screenshotMatch({available:[]}),'no_eligible_candidates'],
  [{unlocked:['celeste','paige','abrams']},screenshotMatch(),'no_eligible_candidates'],
  [{unlocked:['haze']},screenshotMatch({own:null}),'needs_hero']
 ];
 for(const [p,m,status] of cases){const r=create(data,p).analyze(m);a.equal(r.decision,status);a.equal(r.keep,null);a.deepEqual(r.recommendations,[]);a.ok(r.decisionMessage);}
});
test('build changes follow hero identity and change multiple output dimensions',()=>{
 const e=create(data,{unlocked:['haze']}),base=e.analyze(screenshotMatch());
 const r=e.analyze(screenshotMatch({builds:{graves:'weapon'}}));
 a.deepEqual(r.composition.gunHeroes,['graves']);a.ok(!r.composition.gaps.includes('weapon'));
 a.ok(r.composition.totals.spirit<base.composition.totals.spirit);
 a.ok(r.composition.totals.weapon>base.composition.totals.weapon);
 const replaced=e.analyze(screenshotMatch({friendly:['haze',...screenshot.slice(1)],own:'haze',builds:{celeste:'weapon',haze:'spirit'}}));
 a.ok(replaced.composition.gaps.includes('weapon'));a.deepEqual(replaced.composition.gunHeroes,[]);
});
test('unknown allies are not counted as zero and do not block known swap candidates',()=>{
 const r=create(data,{unlocked:['haze']}).analyze(screenshotMatch({friendly:['celeste','unreleased-new-hero',...screenshot.slice(2)]}));
 a.deepEqual(r.composition.gunUnknown,['unreleased-new-hero']);a.deepEqual(r.composition.gaps,[]);a.equal(r.recommendations[0].id,'haze');
});
test('alternatives remain visible when retaining current hero scores better',()=>{
 const r=create(data,{unlocked:['celeste']}).analyze(screenshotMatch({friendly:['wraith',...screenshot.slice(1)],own:'wraith'}));
 a.equal(r.decision,'keep');a.equal(r.keep,true);a.equal(r.recommendations[0].id,'celeste');a.ok(r.recommendations[0].delta<=0);
});
test('Kelvin beam suppression and dome isolation have explicit mechanisms',()=>{
 const e=create(data,profile()),h=e.knowledge.heroes.kelvin;
 a.equal(h.capabilities.interrupt,undefined);a.equal(h.capabilities.setup,undefined);a.ok(!h.tags.includes('hardControl'));
 const r=e.analyze(match());a.ok(r.items.filter(x=>x.name==='Reactive Barrier').every(x=>!x.targets.includes('Kelvin')));
 a.equal(e.heroes.kelvin.mechanicsNote,undefined);
});
test('all catalog heroes have linked abilities and multidimensional models',()=>{
 const e=create(data,profile());for(const h of data.heroes){a.equal(e.resolve(h.name),h.id);a.equal(Object.keys(h.traits).length,14);a.equal(e.knowledge.heroes[h.id].abilities.length,4);}
});
test('inactive catalog heroes require explicit current-match availability and still require pool membership',()=>{
 const custom=JSON.parse(JSON.stringify(data));custom.heroes.find(h=>h.id==='paradox').apiActive=false;
 const e=create(custom,{unlocked:['paradox']});a.equal(e.analyze(match()).decision,'no_eligible_candidates');
 a.equal(e.analyze(match({available:['paradox']})).decision,'recommend_swap');
 a.equal(create(custom,{unlocked:[]}).analyze(match({available:['paradox']})).decision,'needs_pool');
});
