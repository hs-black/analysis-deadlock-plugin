(function(g){
    'use strict';
    var Q=g.QOL;
    if(!Q||!Q.core||!Q.core.FeatureRegistry){$.Msg('[RankAdvisor] QoL FeatureRegistry missing');return;}
    Q.core.FeatureRegistry.register({id:'rank_advisor',enabledByDefault:true,settings:[],create:function(){
        var root,box,body,settings,status,report,choices,token=0,snapshot,engine,profile,ownSlot=-1,mateSlot=-1,foes=[],manual=null,available=null,last='',topCache=null,wasHideout=false,gunRoles={};
        function valid(p){return p&&p.IsValid&&p.IsValid();}
        function child(p,id){return valid(p)&&p.FindChildTraverse?p.FindChildTraverse(id):null;}
        function label(parent,text,cls){var p=$.CreatePanel('Label',parent,'');p.text=text;p.hittest=false;if(cls)p.AddClass(cls);return p;}
        function button(parent,text,fn){var p=$.CreatePanel('Button',parent,'');p.AddClass('RAButton');p.hittest=true;label(p,text);p.SetPanelEvent('onactivate',fn);return p;}
        function clear(p){if(valid(p))p.RemoveAndDeleteChildren();}
        function hideout(){var p=root;for(var n=0;valid(p)&&n<8;n++,p=p.GetParent()){
            if(['InHideout','inHideoutIntro','connectedToHideout','connectedtoHideout','connectedtohideout'].some(function(c){return p.BHasClass(c);}))return true;
        }return false;}
        function reset(){snapshot.reset();gunRoles={};ownSlot=-1;mateSlot=-1;foes=[];manual=null;available=null;last='';topCache=null;}
        function textByClass(p,cls){var a=p.FindChildrenWithClassTraverse(cls);return a&&a.length?String(a[0].text||'').trim():'';}
        function readTeam(top,id){
            var team=child(top,id),pc=child(team,'PlayersContainer');if(!valid(pc))return [];
            var out=[];for(var i=0;i<pc.GetChildCount();i++){
                var p=pc.GetChild(i);if(!valid(p)||p.paneltype!=='CitadelHudTopBarPlayer')continue;
                out.push(textByClass(p,'HeroNameHidden')||textByClass(p,'HeroName'));
            }return out;
        }
        function read(){
            if(manual)return manual;
            if(!valid(topCache))topCache=child(root,'TopBar');
            return {friendly:readTeam(topCache,'TeamFriendly'),enemy:readTeam(topCache,'TeamEnemy')};
        }
        function csv(s){return String(s||'').split(/[,，\n]/).map(function(x){return x.trim();}).filter(Boolean);}
        function entry(parent,title,value){label(parent,title);var p=$.CreatePanel('TextEntry',parent,'');p.text=value;p.AddClass('RAEntry');p.hittest=true;return p;}
        function showSettings(){
            settings.visible=!settings.visible;if(!settings.visible)return;clear(settings);
            label(settings,'英雄池与手动校正','RAHeading');
            label(settings,'以下设置本次会话有效；导出后可用 profile 文件重新打包。','RAMuted');
            label(settings,'填写英文英雄名或 ID，以英文逗号分隔。未配置英雄池时不推荐换人。','RAMuted');
            var pool=entry(settings,'已确认排位解锁的英雄',profile.unlocked.join(','));
            var avail=entry(settings,'本局确认可选（留空表示未验证）',(available||[]).join(','));
            var allies=entry(settings,'手动己方 6 人（留空使用自动读取）',manual?manual.friendly.join(','):'');
            var enemies=entry(settings,'手动敌方 6 人（锁定后不能覆盖）',manual?manual.enemy.join(','):'');
            var error=label(settings,'','RAWarning');
            button(settings,'应用',function(){
                var p=csv(pool.text),a=csv(avail.text),f=csv(allies.text),e=csv(enemies.text);
                var bad=p.concat(a).filter(function(h){return !engine.resolve(h);});
                if(bad.length){error.text='不认识：'+bad.join(', ');return;}
                if((f.length||e.length)&&(!engine.complete(f)||!engine.complete(e))){error.text='手动阵容需要双方各 6 个不同英雄。';return;}
                profile.unlocked=Array.from(new Set(p.map(engine.resolve)));available=a.length?a.map(engine.resolve):null;
                manual=f.length?{friendly:f,enemy:e}:null;
                settings.visible=false;last='';
            });
            button(settings,'导出英雄池 JSON 到剪贴板',function(){
                try{$.DispatchEvent('CopyStringToClipboard',JSON.stringify(profile,null,2),JSON.stringify(profile,null,2));error.text='已请求复制；保存为 profiles/my.json。';}
                catch(e){error.text='复制接口不可用，请编辑 profiles/default.json。';}
            });
            label(settings,'支持识别：'+g.RankAdvisorData.heroes.map(function(h){return h.id;}).join(', '),'RAMuted');
        }
        function render(s){
            status.text=s.locked?'敌方初始阵容已锁定 · '+(manual?'手动输入':'自动读取'):'等待敌方 6 人 · 可在设置中手动输入';
            if(!s.friendly||!s.enemy){last='';clear(choices);clear(report);label(report,'等待完整阵容。进入赛前后打开计分板，或在设置中填入双方英雄。');return;}
            var input={friendly:s.friendly,enemy:s.enemy,own:engine.resolve(s.friendly[ownSlot]),mate:engine.resolve(s.friendly[mateSlot]),foes:foes.map(function(i){return engine.resolve(s.enemy[i]);}),available:available,gunRoles:gunRoles};
            var sig=JSON.stringify([input,profile.unlocked]);if(sig===last)return;last=sig;
            clear(choices);label(choices,'点击自己的英雄；再选择同路队友与敌人','RAMuted');
            var ownRow=$.CreatePanel('Panel',choices,'');ownRow.AddClass('RARow');
            s.friendly.forEach(function(id,i){button(ownRow,(ownSlot===i?'你 · ':'')+engine.name(engine.resolve(id)||id),function(){ownSlot=i;if(mateSlot===i)mateSlot=-1;last='';});});
            var mateRow=$.CreatePanel('Panel',choices,'');mateRow.AddClass('RARow');
            s.friendly.forEach(function(id,i){if(i!==ownSlot)button(mateRow,(mateSlot===i?'同路 · ':'')+engine.name(engine.resolve(id)||id),function(){mateSlot=mateSlot===i?-1:i;last='';});});
            var enemyRow=$.CreatePanel('Panel',choices,'');enemyRow.AddClass('RARow');
            s.enemy.forEach(function(id,i){button(enemyRow,(foes.indexOf(i)>=0?'对线 · ':'')+engine.name(engine.resolve(id)||id),function(){var k=foes.indexOf(i);if(k>=0)foes.splice(k,1);else if(foes.length<2)foes.push(i);last='';});});
            label(choices,'枪位职责：点击切换 自动 / 枪位 / 其他','RAMuted');
            var gunRow=$.CreatePanel('Panel',choices,'');gunRow.AddClass('RARow');
            s.friendly.forEach(function(raw){var id=engine.resolve(raw)||raw;
                button(gunRow,engine.name(id)+' · '+(typeof gunRoles[id]!=='boolean'?'自动':gunRoles[id]?'枪位':'其他'),function(){
                    if(typeof gunRoles[id]!=='boolean')gunRoles[id]=true;else if(gunRoles[id])gunRoles[id]=false;else delete gunRoles[id];last='';
                });
            });
            var r=engine.analyze(input);clear(report);
            label(report,'阵容倾向','RAHeading');
            label(report,'手工规则覆盖：己方 '+r.composition.coverage+'/6，敌方 '+r.enemyCoverage+'/6','RAMuted');
            label(report,r.composition.missing.length?'部分英雄缺少规则，暂不判断整队短板。':r.composition.gaps.length?'偏少：'+r.composition.gaps.map(function(k){return g.RankAdvisorData.roles[k];}).join('、'):'当前规则未发现明显能力缺口。');
            label(report,'枪位：'+r.composition.gunHeroes.length+' 人'+(r.composition.gunUnknown.length?' · 部分职责未知':''));
            if(r.composition.missing.length)label(report,'缺少资料：'+r.composition.missing.map(engine.name).join('、'),'RAWarning');
            r.mechanicsNotes.forEach(function(x){label(report,x,'RAMuted');});
            label(report,'机制补位建议','RAHeading');
            label(report,r.decisionMessage);
            r.recommendations.forEach(function(x){label(report,engine.name(x.id)+'：'+x.reasons.slice(0,2).join('；'));});
            label(report,'历史胜率与 Counter','RAHeading');
            r.statisticsLines.forEach(function(x){label(report,x,'RAMuted');});
            label(report,'对线分析','RAHeading');if(r.lane.ready)label(report,r.lane.label);r.lane.notes.slice(0,3).forEach(function(x){label(report,'• '+x);});
            label(report,'针对装备候选','RAHeading');
            if(!r.items.length)label(report,'选择自己的英雄后显示；不是固定购买顺序。');
            r.items.slice(0,4).forEach(function(x){label(report,x.name+' → '+x.targets.join(' / '));label(report,x.reason+' '+x.caution,'RAMuted');});
            r.warnings.forEach(function(x){label(report,x,'RAWarning');});
        }
        function tick(t){
            if(t!==token||!valid(root)||!valid(box))return;
            try{
                var inHideout=hideout();if(inHideout&&!wasHideout)reset();wasHideout=inHideout;
                if(inHideout){status.text='等待下一场比赛';clear(report);clear(choices);}
                else {var rows=read();render(snapshot.update({session:'current-hud',captureAllowed:true,friendly:rows.friendly,enemy:rows.enemy}));}
            }catch(e){status.text='读取失败；可使用手动输入';$.Msg('[RankAdvisor] '+String(e));}
            $.Schedule(1,function(){tick(t);});
        }
        return {onEnable:function(){
            root=$.GetContextPanel();profile=JSON.parse(JSON.stringify(g.RankAdvisorProfile));engine=g.RankAdvisorEngine.create(g.RankAdvisorData,profile);snapshot=engine.snapshot();
            var old=child(root,'RankAdvisor');if(valid(old))old.DeleteAsync(0);
            box=$.CreatePanel('Panel',root,'RankAdvisor');box.AddClass('RankAdvisor');box.hittest=false;
            var header=$.CreatePanel('Panel',box,'');header.AddClass('RARow');label(header,'阵容助手 · 原型','RATitle');
            button(header,'展开/收起',function(){body.visible=!body.visible;});button(header,'设置',showSettings);
            button(header,'下一局重置',function(){reset();});
            status=label(box,'等待阵容','RAMuted');body=$.CreatePanel('Panel',box,'');body.AddClass('RABody');body.hittest=false;
            settings=$.CreatePanel('Panel',body,'');settings.AddClass('RASettings');settings.visible=false;
            choices=$.CreatePanel('Panel',body,'');choices.AddClass('RAColumn');report=$.CreatePanel('Panel',body,'');report.AddClass('RAColumn');
            label(box,'按游戏原有方式显示鼠标后操作；只提供建议。','RAMuted');tick(++token);
        },onDisable:function(){token++;if(valid(box))box.DeleteAsync(0);box=null;root=null;topCache=null;last='';}};
    }});
})(typeof globalThis!=='undefined'?globalThis:this);
