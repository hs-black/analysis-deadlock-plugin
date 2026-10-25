#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const SOURCE='https://api.deadlock-api.com';
function options(args,now=Date.now()){
 const opts={};for(let i=0;i<args.length;i+=2){if(!['--days','--from','--to','--min-badge','--max-badge'].includes(args[i])||!args[i+1])throw Error('Usage: npm run sync-data -- [--days 7] [--from YYYY-MM-DD --to YYYY-MM-DD] [--min-badge 61 --max-badge 116]');opts[args[i]]=args[i+1];}
 const days=opts['--days']===undefined?7:Number(opts['--days']);if(!Number.isInteger(days)||days<1||days>90)throw Error('--days must be 1..90');
 const date=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Date must be YYYY-MM-DD (UTC)');const n=Date.parse(s+'T00:00:00Z');if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==s)throw Error('Invalid date');return n;};
 const end=opts['--to']?date(opts['--to']):now,start=opts['--from']?date(opts['--from']):end-days*86400000;
 if(start>=end||end>now||end-start>90*86400000)throw Error('Require a past interval no longer than 90 days; --to is exclusive');
 const filters={game_mode:'normal',match_mode:'ranked',min_unix_timestamp:Math.floor(start/1000),max_unix_timestamp:Math.floor(end/1000)};
 for(const [arg,key] of [['--min-badge','min_average_badge'],['--max-badge','max_average_badge']])if(opts[arg]!==undefined){const v=Number(opts[arg]);if(!Number.isInteger(v)||v<0||v>116)throw Error('Badge must be 0..116');filters[key]=v;}
 if(filters.min_average_badge>filters.max_average_badge)throw Error('Badge range reversed');return filters;
}
function counts(r,field){if(!Number.isSafeInteger(r.wins)||!Number.isSafeInteger(r[field])||r[field]<=0||r.wins<0||r.wins>r[field])throw Error('Invalid win/sample counts');return {wins:r.wins,matches:r[field]};}
function normalize(data,assets,raw,filters,now=Date.now()){
 if(!Array.isArray(assets)||!assets.length||!['heroes','counters','synergies'].every(k=>Array.isArray(raw[k])&&raw[k].length))throw Error('Empty or malformed API response; preserving previous data');
 const referenced=new Set(raw.heroes.map(r=>r.hero_id).concat(raw.counters.flatMap(r=>[r.hero_id,r.enemy_hero_id]),raw.synergies.flatMap(r=>[r.hero_id1,r.hero_id2])));
 const next=JSON.parse(JSON.stringify(data)),ids=new Map(),seen=new Set(),mapped=new Set(),key=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
 for(const a of assets){
  if(!Number.isSafeInteger(a.id)||a.id<0||typeof a.name!=='string'||!a.name.trim()||typeof a.class_name!=='string'||seen.has(a.id))throw Error('Invalid/duplicate hero metadata');seen.add(a.id);
  let h=next.heroes.find(h=>h.apiId===a.id)||next.heroes.find(h=>key(h.name)===key(a.name));
  if(!h&&a.player_selectable!==true&&!referenced.has(a.id))continue;
  if(!h){let id=a.name.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');if(!id||next.heroes.some(h=>h.id===id))id='hero_'+a.id;h={id,name:a.name,traits:null,threats:[],gunCore:null};next.heroes.push(h);}
  if(mapped.has(h.id))throw Error('Ambiguous hero identity '+h.id);mapped.add(h.id);
  h.apiId=a.id;h.apiActive=a.player_selectable===true&&!a.disabled&&!a.in_development;h.name=a.name;h.className=a.class_name;h.catalogVerifiedAt=new Date(now).toISOString();ids.set(a.id,h.id);
 }
 const map=id=>{if(!ids.has(id))throw Error('Stats contain unknown hero ID '+id+'; refusing incomplete mapping');return ids.get(id);};
 const unique=(rows,fn)=>{const keys=new Map();for(const r of rows){const k=fn(r);if(keys.has(k)){if(JSON.stringify(keys.get(k))!==JSON.stringify(r))throw Error('Conflicting duplicate statistics');}else keys.set(k,r);}return [...keys.values()];};
 const heroes=unique(raw.heroes.map(r=>({id:map(r.hero_id),...counts(r,'matches')})),r=>r.id);
 const counters=unique(raw.counters.map(r=>({id:map(r.hero_id),enemy:map(r.enemy_hero_id),...counts(r,'matches_played')})),r=>r.id+'|'+r.enemy);
 const synergies=unique(raw.synergies.map(r=>{const pair=[map(r.hero_id1),map(r.hero_id2)].sort();return {id:pair[0],ally:pair[1],...counts(r,'matches_played')};}),r=>r.id+'|'+r.ally);
 next.catalogSource=SOURCE+'/v1/assets/heroes';next.catalogDate=new Date(now).toISOString().slice(0,10);
 return {data:next,stats:{schemaVersion:1,metadata:{source:SOURCE,fetchedAt:new Date(now).toISOString(),windowStart:new Date(filters.min_unix_timestamp*1000).toISOString(),windowEnd:new Date(filters.max_unix_timestamp*1000).toISOString(),filters:{...filters,same_lane_filter:false},minimumSamples:100,patch:null},heroes,counters,synergies}};
}
function script(name,value){return '(function(g){var d='+JSON.stringify(value,null,2)+';if(typeof module!=="undefined")module.exports=d;else g.'+name+'=d;})(typeof globalThis!=="undefined"?globalThis:this);\n';}
async function sync(root,filters,get=async url=>{
 const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('HTTP '+r.status+' from '+new URL(url).pathname+(r.headers.get('retry-after')?' (Retry-After '+r.headers.get('retry-after')+')':''));return r.json();
},now=Date.now()){
 const url=(endpoint,params)=>SOURCE+endpoint+'?'+new URLSearchParams(params);
 // Deliberately sequential: analytics queries share a server queue and rate limits.
 const assets=await get(url('/v1/assets/heroes',{language:'english'}));
 const raw={heroes:await get(url('/v1/analytics/hero-stats',{...filters,bucket:'no_bucket'})),counters:await get(url('/v1/analytics/hero-counter-stats',{...filters,same_lane_filter:'false',min_matches:1})),synergies:await get(url('/v1/analytics/hero-synergy-stats',{...filters,same_lane_filter:'false',min_matches:1}))};
 const built=normalize(require(path.join(root,'src/data.js')),assets,raw,filters,now);
 const catalog={...JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8')),catalogSource:built.data.catalogSource,catalogDate:built.data.catalogDate,heroes:built.data.heroes.map(({traits,threats,gunCore,...h})=>h)};
 const outputs={'src/data.js':script('RankAdvisorData',built.data),'src/stats-data.js':script('RankAdvisorStatsData',built.stats),'catalog.json':JSON.stringify(catalog,null,2)+'\n'};
 // All responses and IDs validated before any existing output is replaced.
 for(const [p,s] of Object.entries(outputs))fs.writeFileSync(path.join(root,p+'.tmp'),s);
 for(const p of Object.keys(outputs))fs.renameSync(path.join(root,p+'.tmp'),path.join(root,p));
 return built;
}
if(require.main===module){
 // Preserve inherited proxy and trust configuration. Node 24 provides native env-proxy support.
 if((process.env.HTTPS_PROXY||process.env.https_proxy)&&!process.execArgv.includes('--use-env-proxy')&&process.env.NODE_USE_ENV_PROXY!=='1'){
  if(!process.allowedNodeEnvironmentFlags.has('--use-env-proxy')){console.error('This environment uses an HTTPS proxy. Install Node.js 24+ for --use-env-proxy support.');process.exit(1);}
  const r=require('node:child_process').spawnSync(process.execPath,['--use-env-proxy',__filename,...process.argv.slice(2)],{stdio:'inherit',env:process.env});process.exit(r.status===null?1:r.status);
 }
 let filters;try{filters=options(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}
 if(filters)sync(path.resolve(__dirname,'..'),filters).then(r=>console.log('Updated '+r.data.heroes.length+' heroes, '+r.stats.counters.length+' counter pairs. Refresh preview; rebuild VPK to update HUD.')).catch(e=>{console.error('Sync failed: '+e.message);process.exitCode=1;});
}
module.exports={options,normalize,sync};
