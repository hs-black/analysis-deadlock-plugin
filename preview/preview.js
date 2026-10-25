'use strict';
const data=RankAdvisorData;
let profile={label:'我的排位英雄池',unlocked:[],excluded:[],familiarity:{},aliases:{}},engine=RankAdvisorEngine.create(data,profile),snapshot=engine.snapshot(),state=null,epoch=0,gunRoles={};
const $=id=>document.getElementById(id);
function el(tag,text,parent){const p=document.createElement(tag);if(text)p.textContent=text;if(parent)parent.append(p);return p;}
function select(parent,values,value,change){const p=el('select',null,parent);values.forEach(x=>{const o=el('option',x.name,p);o.value=x.id;});p.value=value;p.onchange=change;return p;}
const a=['haze','wraith','vindicta','seven','infernus','mcginnis'],b=['abrams','mo_and_krill','kelvin','lash','bebop','dynamo'];
const inputs=[[],[]];[a,b].forEach((team,t)=>{team.forEach((id,i)=>{const p=el('label',(t?'敌方':'己方')+(i+1),$('teams'));inputs[t].push(select(p,data.heroes,id,()=>{}));});});
function renderPool(){const p=$('pool');p.replaceChildren();data.heroes.forEach(h=>{const row=el('label',null,p),c=el('input',null,row);c.type='checkbox';c.checked=profile.unlocked.includes(h.id);row.append(document.createTextNode(h.name+(h.apiActive===false?'（资源标为非活跃）':'')+(h.traits?'':'（机制规则待核对）')));c.onchange=()=>{profile.unlocked=c.checked?[...new Set(profile.unlocked.concat(h.id))]:profile.unlocked.filter(id=>id!==h.id);render();};});}
let own=0,mate=1,foes=[0,1];
function renderSelectors(){const p=$('selectors');p.replaceChildren();if(!state?.friendly||!state?.enemy)return;
const ownValues=state.friendly.map((id,i)=>({id:String(i),name:engine.name(engine.resolve(id)||id)}));
const enemyValues=state.enemy.map((id,i)=>({id:String(i),name:engine.name(engine.resolve(id)||id)}));
select(el('label','你使用的英雄',p),ownValues,String(own),e=>{own=+e.target.value;render();});
select(el('label','同路队友',p),ownValues,String(mate),e=>{mate=+e.target.value;render();});
el('p','枪位职责（按本局出装调整；自动为规则默认）',p);
state.friendly.forEach(id=>select(el('label',engine.name(id),p),[{id:'auto',name:'自动'},{id:'gun',name:'承担枪位'},{id:'other',name:'其他职责'}],typeof gunRoles[id]==='boolean'?(gunRoles[id]?'gun':'other'):'auto',e=>{if(e.target.value==='auto')delete gunRoles[id];else gunRoles[id]=e.target.value==='gun';render();}));
[0,1].forEach(n=>select(el('label','对线敌人 '+(n+1),p),enemyValues,String(foes[n]),e=>{foes[n]=+e.target.value;render();}));}
function line(p,t,cls){const e=el('p',t,p);if(cls)e.className=cls;}
function render(){const p=$('result');p.replaceChildren();if(!state?.friendly||!state?.enemy)return;
const r=engine.analyze({friendly:state.friendly,enemy:state.enemy,gunRoles,own:engine.resolve(state.friendly[own]),mate:engine.resolve(state.friendly[mate]),foes:foes.map(i=>engine.resolve(state.enemy[i]))});
el('h2','阵容倾向',p);line(p,'手工规则覆盖 '+r.composition.coverage+'/6 · '+(r.composition.missing.length?'资料不足':r.composition.gaps.map(k=>data.roles[k]).join('、')||'无明显缺口'));
line(p,'枪位：'+r.composition.gunHeroes.length+' 人'+(r.composition.gunUnknown.length?' · 部分职责未知':''));
if(r.composition.missing.length)line(p,'缺少资料：'+r.composition.missing.map(engine.name).join('、'),'warn');
r.mechanicsNotes.forEach(x=>line(p,x,'muted'));
el('h2','机制补位候选',p);line(p,r.decisionMessage);r.recommendations.forEach(x=>line(p,engine.name(x.id)+'：'+x.reasons.join('；')));
el('h2','历史胜率与 Counter',p);r.statisticsLines.forEach(x=>line(p,x));
el('h2','对线',p);if(r.lane.ready)line(p,r.lane.label);r.lane.notes.forEach(x=>line(p,x));el('h2','针对装备',p);r.items.forEach(x=>{const c=el('div',null,p);c.className='card';el('b',x.name+' → '+x.targets.join(' / '),c);line(c,x.reason);line(c,x.caution,'muted');});r.warnings.forEach(x=>line(p,x,'warn'));}
$('capture').onclick=()=>{state=snapshot.update({session:epoch,captureAllowed:true,friendly:inputs[0].map(p=>p.value),enemy:inputs[1].map(p=>p.value)});$('status').textContent=state.locked?'敌方快照已锁定：'+state.enemy.map(engine.name).join(' / '):'等待 6 个不同敌方英雄';$('error').textContent=state.friendly?'':'己方需要 6 个不同英雄';renderSelectors();render();};
$('reset').onclick=()=>{epoch++;snapshot.reset();state=null;gunRoles={};$('status').textContent='已清空；再次读入阵容开启下一局';$('result').replaceChildren();$('selectors').replaceChildren();};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(profile,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download='my.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onchange=async e=>{try{const p=JSON.parse(await e.target.files[0].text());if(!Array.isArray(p.unlocked)||!p.unlocked.every(id=>data.heroes.some(h=>h.id===id)))throw Error('不合法的英雄池');profile={label:String(p.label||'我的英雄池'),unlocked:p.unlocked,excluded:p.excluded||[],familiarity:p.familiarity||{},aliases:p.aliases||{}};engine=RankAdvisorEngine.create(data,profile);snapshot=engine.snapshot();state=null;renderPool();$('capture').click();}catch(e){$('error').textContent=e.message;}};
renderPool();$('capture').click();
