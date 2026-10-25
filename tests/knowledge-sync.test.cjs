const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {sync}=require('../tools/sync-knowledge.cjs'),{build}=require('../tools/build-knowledge.cjs');
test('unreviewed game build leaves packaged knowledge untouched',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'advisor-knowledge-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'knowledge'));fs.mkdirSync(path.join(dir,'src'));fs.writeFileSync(path.join(dir,'knowledge/hero-models.json'),JSON.stringify({build:6819}));fs.writeFileSync(path.join(dir,'src/knowledge-data.js'),'previous valid knowledge');
 let calls=0;await a.rejects(sync(dir,async()=>{calls++;return [6820,6819];}),/mechanics review/);a.equal(calls,1);a.equal(fs.readFileSync(path.join(dir,'src/knowledge-data.js'),'utf8'),'previous valid knowledge');
});
test('build resolves signatures and transformation skills, preserving source descriptions and upgrade values',()=>{
 const h={id:1,name:'Test',player_selectable:true,items:{signature1:'a',signature2:'b',signature3:'c',signature4:'d'}};
 const items=['a','b','c','d','form'].map((key,i)=>({id:i,class_name:key,name:key,description:{desc:'<b>Ability</b> text'},upgrades:[{property_upgrades:[{name:'Damage',bonus:20}]}],dependent_abilities:key==='d'?{form:{}}:{}}));
 const result=build([h],items,{build:1},{build:1,heroes:{test:{capabilities:{setup:1}}}},{heroes:[{id:'test',apiId:1}]});
 a.equal(Object.keys(result.abilities).length,5);a.deepEqual(result.abilities.d.dependencies,['form']);a.equal(result.abilities.a.description[0],'Ability text');a.equal(result.abilities.a.upgrades[0].property_upgrades[0].bonus,20);
 a.throws(()=>build([h],items.slice(1),{build:1},{build:1,heroes:{test:{capabilities:{setup:1}}}},{heroes:[{id:'test',apiId:1}]}),/Missing ability/);
});
