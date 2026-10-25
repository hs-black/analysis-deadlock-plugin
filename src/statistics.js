(function(g){
    'use strict';
    function validCount(r){return r&&Number.isSafeInteger(r.wins)&&Number.isSafeInteger(r.matches)&&r.matches>0&&r.wins>=0&&r.wins<=r.matches;}
    function record(r,min){
        if(!validCount(r))return null;
        var n=r.matches,p=r.wins/n,z=1.96,den=1+z*z/n,mid=(p+z*z/(2*n))/den,half=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/den;
        return {wins:r.wins,matches:n,winRate:p,low:Math.max(0,mid-half),high:Math.min(1,mid+half),sufficient:n>=min};
    }
    function create(snapshot){
        var s=snapshot||{},min=30,heroes=Object.create(null),counters=Object.create(null),synergies=Object.create(null);
        (s.heroes||[]).forEach(function(r){heroes[r.id]=record(r,100);});
        (s.counters||[]).forEach(function(r){counters[r.id+'|'+r.enemy]=record(r,min);});
        (s.synergies||[]).forEach(function(r){synergies[[r.id,r.ally].sort().join('|')]=record(r,min);});
        function summary(id,team,enemies){
            var base=heroes[id]||null,rows=enemies.map(function(enemy){
                var r=counters[id+'|'+enemy]||null,b=heroes[enemy],effect=null;
                if(r&&r.sufficient&&base&&base.sufficient&&b&&b.sufficient){
                    // Adjust for both heroes' baseline strength. This is an association index,
                    // NOT a causal effect or a probability for the six-versus-six match.
                    var p=Math.max(.01,Math.min(.99,base.winRate)),q=Math.max(.01,Math.min(.99,b.winRate));
                    var expected=(p*(1-q))/(p*(1-q)+(1-p)*q);
                    effect=(r.winRate-expected)*r.matches/(r.matches+400);
                }
                return {enemy:enemy,record:r,effect:effect};
            });
            var covered=rows.filter(function(x){return x.effect!==null;});
            return {id:id,overall:base,counters:rows,synergies:team.filter(function(x){return x!==id;}).map(function(ally){return {ally:ally,record:synergies[[id,ally].sort().join('|')]||null};}),
                coverage:covered.length,index:enemies.length===6&&covered.length===6?covered.reduce(function(n,x){return n+x.effect;},0)/6:null};
        }
        function analyze(input,eligible,now){
            var loaded=s.schemaVersion===1&&s.metadata&&s.metadata.source==='https://api.deadlock-api.com'&&s.metadata.filters&&s.metadata.filters.same_lane_filter===false;
            var age=loaded?(now||Date.now())-Date.parse(s.metadata.fetchedAt):NaN;
            var fresh=loaded&&Number.isFinite(age)&&age>=-300000&&age<=7*86400000;
            var own=summary(input.own,input.friendly,input.enemy),candidates=eligible.map(function(id){return summary(id,input.friendly.filter(function(x){return x!==input.own;}),input.enemy);});
            var recommendations=fresh&&own.index!==null?candidates.filter(function(x){return x.index!==null&&x.index-own.index>=.01;}).sort(function(a,b){return b.index-a.index;}).slice(0,3):[];
            return {loaded:!!loaded,fresh:!!fresh,metadata:loaded?s.metadata:null,own:own,candidates:candidates,recommendations:recommendations,
                status:!loaded?'尚未加载对局统计：运行 npm run sync-data 后刷新。':!fresh?'统计快照超过 7 天或日期无效；仅展示历史数据，暂停统计推荐。':own.index===null?'对当前六名敌人的统计覆盖不足，暂不比较 counter 指标。':'已加载真实历史对局统计；counter 指标不是本局获胜概率。'};
        }
        return {analyze:analyze};
    }
    function formatRecord(r){return !r?'无样本':(r.winRate*100).toFixed(1)+'% · '+r.matches+' 场 · 95% 区间 '+(r.low*100).toFixed(1)+'–'+(r.high*100).toFixed(1)+'%'+(r.sufficient?'':' · 样本不足');}
    function lines(r,name){
        if(!r.loaded)return ['尚未加载历史对局数据；可运行 npm run sync-data 更新。'];
        var m=r.metadata,f=m.filters,out=[];
        out.push('来源 Deadlock API · '+m.fetchedAt+' · '+(m.windowStart||'')+' 至 '+(m.windowEnd||'')+' · '+f.match_mode+' · 段位 '+(f.min_average_badge==null?'不限':f.min_average_badge)+'–'+(f.max_average_badge==null?'不限':f.max_average_badge));
        if(!r.fresh)out.push('历史数据已过期，当前排序使用技能机制与阵容搭配。');
        out.push(name(r.own.id)+' 总体：'+formatRecord(r.own.overall));
        r.own.counters.forEach(function(x){out.push('对阵 '+name(x.enemy)+'：'+formatRecord(x.record));});
        r.own.synergies.forEach(function(x){out.push('与 '+name(x.ally)+' 同队：'+formatRecord(x.record));});
        return out;
    }
    var api={create:create,record:record,lines:lines};if(typeof module!=='undefined')module.exports=api;else g.RankAdvisorStatistics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
