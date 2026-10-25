'use strict';
const fs=require('node:fs'),path=require('node:path');
const {write}=require('./build-knowledge.cjs');
async function sync(root,get=async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('HTTP '+r.status+' while downloading game assets');return r.json();}){
 const source='https://api.deadlock-api.com/v1/assets',versions=await get(source+'/client-versions');
 if(!Array.isArray(versions)||!versions.length||!versions.every(Number.isSafeInteger))throw Error('Invalid game-build list');const build=Math.max(...versions);
 const model=JSON.parse(fs.readFileSync(path.join(root,'knowledge/hero-models.json'),'utf8'));if(build!==model.build)throw Error('Game build '+build+' needs a mechanics review (current model '+model.build+'). Existing knowledge preserved.');
 const dir=path.join(root,'work','assets-'+build);fs.mkdirSync(dir,{recursive:true});
 for(const endpoint of ['heroes','items'])fs.writeFileSync(path.join(dir,endpoint+'.json'),JSON.stringify(await get(source+'/'+endpoint+'?language=english&client_version='+build)));
 fs.writeFileSync(path.join(dir,'source.json'),JSON.stringify({build,fetchedAt:new Date().toISOString(),source}));return write(root,dir);
}
if(require.main===module){
 if((process.env.HTTPS_PROXY||process.env.https_proxy)&&!process.execArgv.includes('--use-env-proxy')&&process.env.NODE_USE_ENV_PROXY!=='1'){
  if(!process.allowedNodeEnvironmentFlags.has('--use-env-proxy')){console.error('Node.js 24+ is needed in this proxy environment.');process.exit(1);}
  const r=require('node:child_process').spawnSync(process.execPath,['--use-env-proxy',__filename],{stdio:'inherit',env:process.env});process.exit(r.status===null?1:r.status);
 }
 sync(path.resolve(__dirname,'..')).then(k=>console.log('Knowledge build '+k.build+': '+Object.keys(k.heroes).length+' heroes / '+k.items.filter(i=>i.standard).length+' standard items')).catch(e=>{console.error(e.message);process.exitCode=1;});
}
module.exports={sync};
