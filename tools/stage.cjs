#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const project=path.resolve(__dirname,'..');
function validateProfile(p){
 if(!p||typeof p!=='object'||Array.isArray(p))throw Error('profile must be an object');
 const data=require('../src/data.js'),ids=new Set(data.heroes.map(h=>h.id));
 for(const k of ['unlocked','excluded'])if(!Array.isArray(p[k])||!p[k].every(id=>ids.has(id)))throw Error(k+' must contain supported hero IDs');
 for(const k of ['familiarity','aliases'])if(!p[k]||typeof p[k]!=='object'||Array.isArray(p[k]))throw Error(k+' must be an object');
 for(const [id,n] of Object.entries(p.familiarity))if(!ids.has(id)||!Number.isInteger(n)||n<0||n>2)throw Error('familiarity must be 0, 1 or 2');
 for(const [alias,id] of Object.entries(p.aliases))if(!alias.trim()||!ids.has(id)||alias.length>100)throw Error('invalid alias');
 return {label:String(p.label||'我的英雄池').slice(0,100),unlocked:[...new Set(p.unlocked)],excluded:[...new Set(p.excluded)],familiarity:p.familiarity,aliases:p.aliases};
}
function patchHud(hud){
 if(hud.includes('rank_advisor/'))throw Error('Already integrated; stage from a clean QoL source');
 const app=/<include\s+src="s2r:\/\/panorama\/scripts\/core\/ql_app\.vjs(?:_c)?"\s*\/>/g;
 if((hud.match(app)||[]).length!==1||!hud.includes('ql_feature_registry')||!hud.includes('</styles>'))throw Error('Unsupported QoL HUD layout; expected FeatureRegistry and one ql_app include');
 const includes=['data','profile','engine','hud'].map(f=>'\t\t<include src="s2r://panorama/scripts/rank_advisor/'+f+'.vjs_c" />').join('\n');
 return hud.replace('</styles>','\t<include src="s2r://panorama/styles/rank_advisor.vcss_c" />\n\t</styles>').replace(app,m=>includes+'\n\t\t'+m);
}
function stage(qol,out,profilePath){
 qol=fs.realpathSync(qol);out=path.resolve(out);
 const rel=path.relative(qol,out);
 if(!rel||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)))throw Error('Output must be outside the QoL source');
 if(fs.existsSync(out))throw Error('Output already exists; choose a new output directory');
 const hudPath=path.join(qol,'panorama/layout/hud.xml');const patched=patchHud(fs.readFileSync(hudPath,'utf8'));
 const profile=validateProfile(JSON.parse(fs.readFileSync(profilePath,'utf8')));
 fs.mkdirSync(out,{recursive:true});
 try{
  for(const entry of ['panorama','scripts','soundevents','sounds','translations','LICENSE','NOTICE','THIRD_PARTY_NOTICES.md']){
   const source=path.join(qol,entry);if(fs.existsSync(source))fs.cpSync(source,path.join(out,entry),{recursive:true,dereference:false});
  }
  const target=path.join(out,'panorama/scripts/rank_advisor');fs.mkdirSync(target,{recursive:true});
  for(const f of ['data.js','engine.js','hud.js'])fs.copyFileSync(path.join(project,'src',f),path.join(target,f));
  fs.writeFileSync(path.join(target,'profile.js'),'(function(g){g.RankAdvisorProfile='+JSON.stringify(profile)+';})(globalThis);\n');
  fs.mkdirSync(path.join(out,'panorama/styles'),{recursive:true});fs.copyFileSync(path.join(project,'src/hud.css'),path.join(out,'panorama/styles/rank_advisor.css'));
  fs.writeFileSync(path.join(out,'panorama/layout/hud.xml'),patched);
  fs.writeFileSync(path.join(out,'RANK_ADVISOR_BUILD.json'),JSON.stringify({version:'0.1.0',source:qol,profileLabel:profile.label,compiled:false},null,2));
 }catch(e){throw Error('Staging failed; partial output kept at '+out+': '+e.message);}
 return out;
}
if(require.main===module){
 try{
  const args=process.argv.slice(2),o={};for(let i=0;i<args.length;i+=2){if(!['--qol','--out','--profile'].includes(args[i])||!args[i+1])throw Error('Usage: node tools/stage.cjs --qol <QoL source> --out <new directory> [--profile profiles/my.json]');o[args[i]]=args[i+1];}
  if(!o['--qol']||!o['--out'])throw Error('--qol and --out are required');
  console.log('Source staged at '+stage(o['--qol'],o['--out'],o['--profile']||path.join(project,'profiles/default.json'))+'\nNot compiled. Build this source with the QoL builder on Windows.');
 }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={stage,patchHud,validateProfile};
