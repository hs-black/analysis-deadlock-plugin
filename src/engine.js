(function (g) {
    'use strict';
    var Stats=typeof module!=='undefined'?require('./statistics.js'):g.RankAdvisorStatistics;
    var statsData=typeof module!=='undefined'?require('./stats-data.js'):g.RankAdvisorStatsData;
    function create(data, profile, statistics) {
        var stats=Stats.create(statistics||statsData);
        var heroes = Object.create(null), aliases = Object.create(null), roleKeys = Object.keys(data.minimums);
        function key(s) { return String(s || '').trim().toLowerCase().replace(/[\s_&-]+/g, ''); }
        data.heroes.forEach(function (h) { heroes[h.id] = h; aliases[key(h.id)] = h.id; aliases[key(h.name)] = h.id; });
        Object.keys(profile.aliases || {}).forEach(function (a) { if (heroes[profile.aliases[a]]) aliases[key(a)] = profile.aliases[a]; });
        function resolve(s) { return aliases[key(s)] || null; }
        function name(id) { return heroes[id] ? heroes[id].name : String(id || '未知'); }
        function known(id) { return !!(heroes[id] && heroes[id].traits); }
        function complete(rows) {
            return Array.isArray(rows) && rows.length === 6 && rows.every(function (s) {
                return typeof s === 'string' && s.trim() && !/[{}]/.test(s);
            }) && new Set(rows.map(function (s) { return resolve(s) || key(s); })).size === 6;
        }
        function snapshot() {
            var frozen = null, session = null;
            return {
                reset: function () { frozen = null; session = null; },
                update: function (input) {
                    // A caller-owned match/session identity must change only at a confirmed boundary.
                    if (session !== input.session) { session = input.session; frozen = null; }
                    if (!frozen && input.captureAllowed && complete(input.enemy)) frozen = input.enemy.slice();
                    return {friendly: complete(input.friendly) ? input.friendly.slice() : null,
                        enemy: frozen ? frozen.slice() : null, locked: !!frozen};
                }
            };
        }
        function totals(ids) {
            var out = {}; Object.keys(data.roles).forEach(function (k) { out[k] = 0; });
            ids.forEach(function (id) { if (known(id)) Object.keys(out).forEach(function (k) { out[k] += heroes[id].traits[k] || 0; }); });
            return out;
        }
        function gunRole(id, overrides) {
            if (overrides && typeof overrides[id] === 'boolean') return overrides[id];
            return known(id) && typeof heroes[id].gunCore === 'boolean' ? heroes[id].gunCore : null;
        }
        function composition(ids, overrides) {
            var missing = ids.filter(function (id) { return !known(id); }), sum = totals(ids);
            var guns = ids.filter(function(id){return gunRole(id,overrides)===true;}), unknown = ids.filter(function(id){return gunRole(id,overrides)===null;});
            var gaps = missing.length ? [] : roleKeys.filter(function (k) { return sum[k] < data.minimums[k]; });
            if (!unknown.length && !guns.length) gaps.unshift('gun');
            return {coverage: ids.length - missing.length, missing: missing, totals: sum,
                gunHeroes:guns, gunUnknown:unknown, gaps:gaps};
        }
        function threats(enemy) {
            var t = Object.create(null); enemy.forEach(function (id) { if (known(id)) heroes[id].threats.forEach(function (x) { (t[x] || (t[x] = [])).push(id); }); });
            return t;
        }
        function lane(own, mate, foes) {
            var ids = [own, mate].concat(foes || []);
            if (ids.length !== 4 || new Set(ids).size !== 4 || !ids.every(known)) return {ready: false, notes: ['请确认同路队友及两名敌人；所有英雄需要有规则数据。']};
            var a = totals([own, mate]), b = totals(foes), notes = [];
            if (b.poke > a.poke) notes.push('对面远程消耗能力偏强：优先保血、利用掩体补刀。');
            if (b.hardControl + b.burst > a.hardControl + a.burst) notes.push('警惕对面硬控接爆发：避免两人同时进入连招范围。');
            if (a.hardControl >= 2 && a.burst >= 2) notes.push('己方具备硬控接爆发条件：等队友技能就绪再换血。');
            if (foes.indexOf('kelvin')>=0) notes.push('Kelvin：减速与降低射速、冰罩隔离；不按眩晕或打断计算。');
            if (b.heal > a.heal) notes.push('对面续航偏强：减少无收益换血，评估重伤投入。');
            if (a.clear < b.clear) notes.push('清线压力可能较大：避免被兵线和英雄同时消耗。');
            if (!notes.length) notes.push('未发现明显的机制短板；优先按熟练打法处理兵线。');
            // Only a rules-based comparison, never a lane-win probability.
            var edge = (a.poke-b.poke)*0.7+(a.clear-b.clear)*0.6+(a.heal-b.heal)*0.5+(a.hardControl+a.burst-b.hardControl-b.burst)*0.4;
            return {ready:true, edge:edge, label:edge>1.5?'机制搭配偏有利':edge< -1.5?'机制搭配压力较大':'机制搭配接近',notes:notes};
        }
        function fit(candidate, team, enemy, context) {
            var c = composition(team,context.gunRoles), t = heroes[candidate].traits, ts = threats(enemy), score=0, reasons=[];
            if (!c.missing.length) roleKeys.forEach(function (k) { score += Math.min(c.totals[k],data.minimums[k])*0.6; });
            // One assigned weapon carry fills a distinct role; stacking more earns no extra score.
            if (!c.gunUnknown.length && c.gunHeroes.length) score+=3;
            if (ts.dive && t.hardControl >= 2) {score+=1;reasons.push('增加应对突进的硬控');}
            if (ts.range && t.mobility >= 2) {score+=0.5;reasons.push('增加接近远程目标的机动性');}
            var l = lane(candidate,context.mate,context.foes);
            if(l.ready)score+=l.edge*0.35;
            var f=Number((profile.familiarity||{})[candidate]);
            if(Number.isFinite(f))score+=Math.max(0,Math.min(2,f))*0.8;
            return {score:score,reasons:reasons,lane:l};
        }
        function analyze(input) {
            if(!complete(input.friendly)||!complete(input.enemy))return {ready:false,status:'等待双方完整阵容'};
            var friendly=input.friendly.map(function(s){return resolve(s)||s;}),enemy=input.enemy.map(function(s){return resolve(s)||s;});
            var own=input.own, ownIndex=friendly.indexOf(own), comp=composition(friendly,input.gunRoles), warnings=[];
            var context={mate:friendly.indexOf(input.mate)>=0&&input.mate!==own?input.mate:null,
                foes:(input.foes||[]).filter(function(id){return enemy.indexOf(id)>=0;}),gunRoles:input.gunRoles};
            var t=threats(enemy), coveredEnemy=enemy.filter(known).length;
            if(comp.missing.length||coveredEnemy<6)warnings.push('规则覆盖不完整；不据此断言整队缺少某项能力。');
            if(!data.reviewedPatch)warnings.push('机制规则原型，未校准当前版本；不是胜率预测。');
            warnings.push('枪位指承担持续武器输出的职责；默认定位可按本局出装手动调整。');
            var items=[], seen={};
            data.items.forEach(function(it){
                if(!t[it.threat]||seen[it.id]||!known(own))return;
                if(it.need&&heroes[own].traits[it.need]<2)return;
                seen[it.id]=true;items.push({name:it.name,reason:it.reason,stage:it.stage,caution:it.caution,targets:t[it.threat].map(name)});
            });
            var recommendations=[], base=null, decision, eligible=[];
            var pool=Array.from(new Set((profile.unlocked||[]).map(resolve).filter(Boolean)));
            var available=Array.isArray(input.available)?input.available.map(resolve).filter(Boolean):null;
            eligible=pool.filter(function(id){return id!==own&&friendly.indexOf(id)<0&&enemy.indexOf(id)<0&&(profile.excluded||[]).indexOf(id)<0&&(!available||available.indexOf(id)>=0)&&(heroes[id].apiActive!==false||(available&&available.indexOf(id)>=0));});
            if(ownIndex<0)decision='needs_hero';
            else if(comp.missing.length||coveredEnemy<6||comp.gunUnknown.length)decision='insufficient_data';
            else if(!pool.length)decision='needs_pool';
            else if(!eligible.length)decision='no_eligible_candidates';
            else if(!eligible.some(known))decision='no_supported_candidates';
            else {
                base=fit(own,friendly,enemy,context);
                eligible.filter(known).forEach(function(id){
                    var next=friendly.slice();next[ownIndex]=id;var f=fit(id,next,enemy,context), nextComp=composition(next,input.gunRoles);
                    var reasons=comp.gaps.filter(function(k){return nextComp.gaps.indexOf(k)<0;}).map(function(k){return '补足'+data.roles[k];}).concat(f.reasons);
                    var delta=f.score-base.score;
                    recommendations.push({id:id,delta:delta,reasons:reasons.length?reasons:['结合阵容能力与个人熟练度综合比较'],lane:f.lane});
                });
                recommendations.sort(function(a,b){return b.delta-a.delta||a.id.localeCompare(b.id);});
                decision=recommendations[0].delta>=0.5?'recommend_swap':'keep';
            }
            var messages={needs_hero:'先选择你使用的英雄，再比较换人收益。',
                insufficient_data:'资料不足，暂时无法判断是否值得换人；这不代表建议保留。',
                needs_pool:'请先勾选已解锁英雄池，才能从你可用的英雄中推荐换人。',
                no_eligible_candidates:'英雄池中没有符合占用、排除、资源可选状态和本局可选条件的替换候选。',
                no_supported_candidates:'可选候选尚未覆盖规则，暂时无法比较换人收益。',
                recommend_swap:'可以考虑换人：以下候选相对你当前英雄有规则收益。',
                keep:'已比较有规则数据的可用候选，暂未发现明显换人收益。'};
            if(eligible.some(function(id){return !known(id);}))warnings.push('部分英雄池候选未覆盖，比较结果只适用于已有规则的候选。');
            if(!profile.unlocked||!profile.unlocked.length)warnings.push('尚未配置已解锁英雄池，不生成换人推荐。');
            if(!Array.isArray(input.available))warnings.push('本局可选状态未自动验证；换人前以游戏选人界面为准。');
            var statResult=stats.analyze({friendly:friendly,enemy:enemy,own:own},ownIndex>=0?eligible:[]);
            return {ready:true,friendly:friendly,enemy:enemy,composition:comp,enemyCoverage:coveredEnemy,statistics:statResult,statisticsLines:Stats.lines(statResult,name),
                mechanicsNotes:friendly.concat(enemy).filter(function(id){return heroes[id]&&heroes[id].mechanicsNote;}).map(function(id){return name(id)+'：'+heroes[id].mechanicsNote;}),
                ownSelected:ownIndex>=0,lane:lane(own,context.mate,context.foes),items:items,
                recommendations:decision==='recommend_swap'?recommendations.filter(function(x){return x.delta>=0.5;}).slice(0,3):[],
                decision:decision,decisionMessage:messages[decision],keep:decision==='keep'?true:decision==='recommend_swap'?false:null,warnings:warnings};
        }
        return {resolve:resolve,name:name,complete:complete,snapshot:snapshot,analyze:analyze,heroes:heroes,lane:lane};
    }
    if(typeof module!=='undefined')module.exports={create:create};else g.RankAdvisorEngine={create:create};
})(typeof globalThis!=='undefined'?globalThis:this);
