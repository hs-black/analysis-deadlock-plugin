const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {options,normalize,sync}=require('../tools/sync-data.cjs');
const now=Date.parse('2026-10-25T12:00:00Z'),filters=options([],now);
const assets=[{id:10,name:'Kelvin',class_name:'hero_kelvin',player_selectable:true},{id:99,name:'New Hero',class_name:'hero_new',player_selectable:true},{id:100,name:'Unreleased',class_name:'hero_lab',player_selectable:false}];
const base={heroes:[{id:'kelvin',name:'Kelvin',traits:{hardControl:0},gunCore:false}]};
const raw={heroes:[{hero_id:10,wins:5,matches:10},{hero_id:99,wins:4,matches:10}],counters:[{hero_id:10,enemy_hero_id:99,wins:6,matches_played:10}],synergies:[{hero_id1:10,hero_id2:99,wins:7,matches_played:10}]};
test('sync normalizes API IDs and discovers new playable heroes without fabricated rules',()=>{
 const r=normalize(base,assets,raw,filters,now);a.equal(r.data.heroes.length,2);a.equal(r.data.heroes[0].apiId,10);a.equal(r.data.heroes[1].traits,null);a.equal(r.stats.counters[0].id,'kelvin');a.equal(r.stats.counters[0].enemy,'new_hero');a.equal(r.stats.counters[0].wins,6);a.equal(r.stats.metadata.filters.same_lane_filter,false);
 a.equal(base.heroes.length,1);
});
test('unknown IDs, invalid counts, conflicting pairs and malformed metadata fail closed',()=>{
 a.throws(()=>normalize(base,assets,{...raw,counters:[{hero_id:10,enemy_hero_id:500,wins:1,matches_played:2}]},filters,now),/unknown/);
 a.throws(()=>normalize(base,assets,{...raw,heroes:[{hero_id:10,wins:20,matches:2}]},filters,now),/counts/);
 a.throws(()=>normalize(base,assets,{...raw,counters:[...raw.counters,{...raw.counters[0],wins:2}]},filters,now),/duplicate/);
 a.throws(()=>normalize(base,[...assets,assets[0]],raw,filters,now),/duplicate/);
});
test('date and rank filters are explicit and invalid intervals are rejected',()=>{
 a.equal(filters.match_mode,'ranked');a.equal(filters.max_unix_timestamp-filters.min_unix_timestamp,7*86400);
 const f=options(['--from','2026-10-01','--to','2026-10-20','--min-badge','61','--max-badge','116'],now);a.equal(f.min_average_badge,61);
 for(const args of [['--days','0'],['--from','2026-02-30'],['--to','2027-01-01'],['--min-badge','117'],['--min-badge','100','--max-badge','60'],['--wat','1']])a.throws(()=>options(args,now));
});
test('fetch failures preserve files; success requests consistent filters and packages live results',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'rank-sync-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));fs.mkdirSync(path.join(root,'src'));fs.writeFileSync(path.join(root,'src/data.js'),'module.exports='+JSON.stringify(base));fs.writeFileSync(path.join(root,'catalog.json'),JSON.stringify(base));fs.writeFileSync(path.join(root,'src/stats-data.js'),'old-data');
 await a.rejects(sync(root,filters,async()=>{throw Error('HTTP 403');},now),/403/);a.equal(fs.readFileSync(path.join(root,'src/stats-data.js'),'utf8'),'old-data');
 const requests=[];await sync(root,filters,async url=>{requests.push(new URL(url));return url.includes('/assets/')?assets:url.includes('hero-counter')?raw.counters:url.includes('hero-synergy')?raw.synergies:raw.heroes;},now);
 a.equal(requests.length,4);for(const u of requests.slice(1)){a.equal(u.searchParams.get('match_mode'),'ranked');a.equal(u.searchParams.get('min_unix_timestamp'),String(filters.min_unix_timestamp));}
 a.equal(requests[2].searchParams.get('same_lane_filter'),'false');a.equal(requests[3].searchParams.get('same_lane_filter'),'false');
 a.ok(fs.readFileSync(path.join(root,'src/stats-data.js'),'utf8').includes('RankAdvisorStatsData'));a.equal(JSON.parse(fs.readFileSync(path.join(root,'catalog.json'))).heroes.length,2);
});
