const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {stage,patchHud,validateProfile}=require('../tools/stage.cjs');
const hud='<root><styles></styles><scripts><include src="s2r://panorama/scripts/core/ql_feature_registry.vjs_c" /><include src="s2r://panorama/scripts/core/ql_app.vjs_c" /></scripts></root>';
test('stage preserves originals, inserts before app boot, preserves licenses, refuses overwrite',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rank-advisor-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const qol=path.join(dir,'qol'),out=path.join(dir,'staged');fs.mkdirSync(path.join(qol,'panorama/layout'),{recursive:true});fs.writeFileSync(path.join(qol,'panorama/layout/hud.xml'),hud);fs.writeFileSync(path.join(qol,'LICENSE'),'fixture license');
 stage(qol,out,path.resolve(__dirname,'../profiles/default.json'));
 a.equal(fs.readFileSync(path.join(qol,'panorama/layout/hud.xml'),'utf8'),hud);
 const p=fs.readFileSync(path.join(out,'panorama/layout/hud.xml'),'utf8');
 a.ok(p.indexOf('rank_advisor/hud')<p.indexOf('core/ql_app'));a.equal((p.match(/rank_advisor\/engine/g)||[]).length,1);
 a.ok(p.indexOf('rank_advisor/statistics')<p.indexOf('rank_advisor/engine'));a.ok(fs.existsSync(path.join(out,'panorama/scripts/rank_advisor/stats-data.js')));
 a.equal(fs.readFileSync(path.join(out,'LICENSE'),'utf8'),'fixture license');a.ok(fs.existsSync(path.join(out,'panorama/scripts/rank_advisor/profile.js')));
 a.throws(()=>stage(qol,out,path.resolve(__dirname,'../profiles/default.json')),/exists/);
 a.throws(()=>stage(qol,path.join(qol,'subdir'),path.resolve(__dirname,'../profiles/default.json')),/outside/);
});
test('unsupported or repeated integrations fail before writing',()=>{a.throws(()=>patchHud('<root/>'),/Unsupported/);a.throws(()=>patchHud(patchHud(hud)),/Already/);});
test('invalid profile cannot silently widen hero eligibility',()=>{
 const p={unlocked:[],excluded:[],familiarity:{},aliases:{}};a.throws(()=>validateProfile({...p,unlocked:['not-a-hero']}));a.throws(()=>validateProfile({...p,familiarity:{haze:3}}));a.throws(()=>validateProfile({...p,aliases:{'x':'bogus'}}));a.deepEqual(validateProfile(p).unlocked,[]);
});
