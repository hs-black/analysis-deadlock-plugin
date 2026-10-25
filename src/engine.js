(function (g) {
    'use strict';
    function create(data, profile) {
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
        function composition(ids) {
            var missing = ids.filter(function (id) { return !known(id); }), sum = totals(ids);
            return {coverage: ids.length - missing.length, missing: missing, totals: sum,
                gaps: missing.length ? [] : roleKeys.filter(function (k) { return sum[k] < data.minimums[k]; })};
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
            if (b.control + b.burst > a.control + a.burst) notes.push('警惕对面控制接爆发：避免两人同时进入连招范围。');
            if (a.control >= 2 && a.burst >= 2) notes.push('己方具备控制接爆发条件：等队友技能就绪再换血。');
            if (b.heal > a.heal) notes.push('对面续航偏强：减少无收益换血，评估重伤投入。');
            if (a.clear < b.clear) notes.push('清线压力可能较大：避免被兵线和英雄同时消耗。');
            if (!notes.length) notes.push('未发现明显的机制短板；优先按熟练打法处理兵线。');
            // Only a rules-based comparison, never a lane-win probability.
            var edge = (a.poke-b.poke)*0.7+(a.clear-b.clear)*0.6+(a.heal-b.heal)*0.5+(a.control+a.burst-b.control-b.burst)*0.4;
            return {ready:true, edge:edge, label:edge>1.5?'机制搭配偏有利':edge< -1.5?'机制搭配压力较大':'机制搭配接近',notes:notes};
        }
        function fit(candidate, team, enemy, context) {
            var c = composition(team), t = heroes[candidate].traits, ts = threats(enemy), score=0, reasons=[];
            if (!c.missing.length) roleKeys.forEach(function (k) { score += Math.min(c.totals[k],data.minimums[k])*0.6; });
            if (ts.dive && t.control >= 2) {score+=1;reasons.push('增加应对突进的控制');}
            if (ts.channel && t.control >= 2) {score+=0.7;reasons.push('增加控制手段；需核对能否打断目标技能');}
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
            var own=input.own, ownIndex=friendly.indexOf(own), comp=composition(friendly), warnings=[];
            var context={mate:friendly.indexOf(input.mate)>=0&&input.mate!==own?input.mate:null,
                foes:(input.foes||[]).filter(function(id){return enemy.indexOf(id)>=0;})};
            var t=threats(enemy), coveredEnemy=enemy.filter(known).length;
            if(comp.missing.length||coveredEnemy<6)warnings.push('规则覆盖不完整；不据此断言整队缺少某项能力。');
            if(!data.reviewedPatch)warnings.push('机制规则原型，未校准当前版本；不是胜率预测。');
            var items=[], seen={};
            data.items.forEach(function(it){
                if(!t[it.threat]||seen[it.id]||!known(own))return;
                if(it.need&&heroes[own].traits[it.need]<2)return;
                seen[it.id]=true;items.push({name:it.name,reason:it.reason,stage:it.stage,caution:it.caution,targets:t[it.threat].map(name)});
            });
            var recommendations=[], base=null;
            if(ownIndex>=0&&known(own)){
                base=fit(own,friendly,enemy,context);
                var pool=Array.from(new Set((profile.unlocked||[]).map(resolve).filter(Boolean)));
                var available=Array.isArray(input.available)?input.available.map(resolve).filter(Boolean):null;
                pool.forEach(function(id){
                    if(!known(id)||id===own||friendly.indexOf(id)>=0||enemy.indexOf(id)>=0||(profile.excluded||[]).indexOf(id)>=0)return;
                    if(available&&available.indexOf(id)<0)return;
                    var next=friendly.slice();next[ownIndex]=id;var f=fit(id,next,enemy,context), nextComp=composition(next);
                    var reasons=comp.gaps.filter(function(k){return nextComp.gaps.indexOf(k)<0;}).map(function(k){return '补足'+data.roles[k];}).concat(f.reasons);
                    var delta=f.score-base.score;
                    recommendations.push({id:id,delta:delta,reasons:reasons.length?reasons:['结合阵容能力与个人熟练度综合比较'],lane:f.lane});
                });
                recommendations.sort(function(a,b){return b.delta-a.delta||a.id.localeCompare(b.id);});
            }
            if(!profile.unlocked||!profile.unlocked.length)warnings.push('尚未配置已解锁英雄池，不生成换人推荐。');
            if(!Array.isArray(input.available))warnings.push('本局可选状态未自动验证；换人前以游戏选人界面为准。');
            return {ready:true,friendly:friendly,enemy:enemy,composition:comp,enemyCoverage:coveredEnemy,
                ownSelected:ownIndex>=0,lane:lane(own,context.mate,context.foes),items:items,
                recommendations:recommendations.slice(0,3),keep:!recommendations.length||recommendations[0].delta<0.5,warnings:warnings};
        }
        return {resolve:resolve,name:name,complete:complete,snapshot:snapshot,analyze:analyze,heroes:heroes,lane:lane};
    }
    if(typeof module!=='undefined')module.exports={create:create};else g.RankAdvisorEngine={create:create};
})(typeof globalThis!=='undefined'?globalThis:this);
