'use strict';
const data=RankAdvisorData;
let profile={label:'我的排位英雄池',unlocked:[],excluded:[],familiarity:{},aliases:{}},engine=RankAdvisorEngine.create(data,profile),snapshot=engine.snapshot(),state=null,epoch=0,gunRoles={},builds={},goal="balanced",lockMate=false;
const $=id=>document.getElementById(id);
function el(tag,text,parent){const p=document.createElement(tag);if(text)p.textContent=text;if(parent)parent.append(p);return p;}
function select(parent,values,value,change){const p=el('select',null,parent);values.forEach(x=>{const o=el('option',x.name,p);o.value=x.id;});p.value=value;p.onchange=change;return p;}
const a=['haze','wraith','vindicta','seven','infernus','mcginnis'],b=['abrams','mo_and_krill','kelvin','lash','bebop','dynamo'];
const inputs=[[],[]];[a,b].forEach((team,t)=>{team.forEach((id,i)=>{const p=el('label',(t?'敌方':'己方')+(i+1),$('teams'));inputs[t].push(select(p,data.heroes,id,()=>{}));});});
function renderPool(){const p=$('pool');p.replaceChildren();data.heroes.forEach(h=>{const row=el('label',null,p),c=el('input',null,row);c.type='checkbox';c.checked=profile.unlocked.includes(h.id);row.append(document.createTextNode(h.name+(h.apiActive===false?'（资源标为非活跃）':'')));c.onchange=()=>{profile.unlocked=c.checked?[...new Set(profile.unlocked.concat(h.id))]:profile.unlocked.filter(id=>id!==h.id);render();};});}
let own=0,mate=1,foes=[0,1];
function renderSelectors(){const p=$('selectors');p.replaceChildren();if(!state?.friendly||!state?.enemy)return;
const ownValues=state.friendly.map((id,i)=>({id:String(i),name:engine.name(engine.resolve(id)||id)}));
const enemyValues=state.enemy.map((id,i)=>({id:String(i),name:engine.name(engine.resolve(id)||id)}));
select(el('label','你使用的英雄',p),ownValues,String(own),e=>{own=+e.target.value;render();});
select(el('label','同路队友',p),ownValues,String(mate),e=>{mate=+e.target.value;render();});
select(el('label','推荐目标',p),[{id:'balanced',name:'综合补位'},{id:'counter',name:'优先 Counter 对面'},{id:'synergy',name:'优先队友配合'}],goal,e=>{goal=e.target.value;render();});
const lock=el('input',null,el('label','固定当前搭档',p));lock.type='checkbox';lock.checked=lockMate;lock.onchange=()=>{lockMate=lock.checked;render();};
const routes=el('details',null,p);el('summary','调整己方出装方向',routes);
state.friendly.forEach(id=>select(el('label',engine.name(id),routes),[{id:'default',name:'常见路线'},{id:'weapon',name:'武器输出'},{id:'spirit',name:'元灵输出'},{id:'support',name:'功能保护'}],builds[id]||'default',e=>{builds[id]=e.target.value;render();}));
[0,1].forEach(n=>select(el('label','对线敌人 '+(n+1),p),enemyValues,String(foes[n]),e=>{foes[n]=+e.target.value;render();}));}
function line(p,t,cls){const e=el('p',t,p);if(cls)e.className=cls;}
function render(){const p=$('result');p.replaceChildren();if(!state?.friendly||!state?.enemy)return;
const r=engine.analyze({friendly:state.friendly,enemy:state.enemy,builds,goal,lockMate,own:engine.resolve(state.friendly[own]),mate:engine.resolve(state.friendly[mate]),foes:foes.map(i=>engine.resolve(state.enemy[i]))});
el('h2',r.decisionMessage,p);
line(p,r.composition.summary);if(r.enemyPlan.length)line(p,'对局重点：'+r.enemyPlan.join('；'));
r.recommendations.forEach(x=>{const c=el('article',null,p);c.className='recommendation';el('h3',x.rank+'. '+engine.name(x.id),c);x.reasons.forEach(t=>line(c,t));
if(x.partner)line(c,'推荐同路：'+engine.name(x.partner.ids.find(id=>id!==x.id))+' · '+x.partner.reasons[0],'accent');
if(x.lanePlan){const lanes=el('details',null,c);el('summary','换后完整分路',lanes);x.lanePlan.pairs.forEach(p=>line(lanes,p.ids.map(engine.name).join(' + ')));}line(c,x.plan);line(c,'取舍：'+x.tradeoff,'muted');
if(x.items.length)line(c,'针对装：'+x.items.slice(0,2).map(i=>i.name+'（'+i.cost+'）').join(' → '),'muted');});
el('h2','当前阵容 · 分路搭配',p);if(r.lanePlan)r.lanePlan.pairs.forEach((pair,i)=>{const c=el('div',null,p);c.className='card';el('b',pair.ids.map(engine.name).join(' + '),c);pair.reasons.forEach(t=>line(c,t));pair.pressure.forEach(t=>line(c,t,'muted'));});
el('h2',engine.name(engine.resolve(state.friendly[own]))+' · 针对出装',p);r.items.forEach(x=>{const c=el('div',null,p);c.className='card';el('b',x.name+' · '+x.cost+' · '+x.stage,c);line(c,'针对 '+x.targetDetails.join(' / '));line(c,x.reason+'。'+x.timing);if(x.alternatives.length)line(c,'同用途备选：'+x.alternatives.map(i=>i.name+' '+i.cost).join(' / '),'muted');});
const structure=el('details',null,p);el('summary','查看阵容各维度',structure);const table=el('table',null,structure);Object.keys(r.dimensions).forEach(key=>{const row=el('tr',null,table);el('th',r.dimensions[key],row);el('td',r.composition.gaps.includes(key)?'优先补充':r.composition.strengths.includes(key)?'充足':'可用',row);});
const evidence=el('details',null,p);el('summary','数据与依据',evidence);line(evidence,'技能与装备：游戏资源 build '+r.evidence.build);r.statisticsLines.forEach(t=>line(evidence,t,'muted'));const link=el('a','查看技能与装备资料库',evidence);link.href='/knowledge';link.target='_blank';}
$('capture').onclick=()=>{state=snapshot.update({session:epoch,captureAllowed:true,friendly:inputs[0].map(p=>p.value),enemy:inputs[1].map(p=>p.value)});$('status').textContent=state.locked?'敌方快照已锁定：'+state.enemy.map(engine.name).join(' / '):'等待 6 个不同敌方英雄';$('error').textContent=state.friendly?'':'己方需要 6 个不同英雄';renderSelectors();render();};
$('reset').onclick=()=>{epoch++;snapshot.reset();state=null;gunRoles={};builds={};lockMate=false;$('status').textContent='已清空；再次读入阵容开启下一局';$('result').replaceChildren();$('selectors').replaceChildren();};
$('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(profile,null,2)],{type:'application/json'}));const a=el('a');a.href=url;a.download='my.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onchange=async e=>{try{const p=JSON.parse(await e.target.files[0].text());if(!Array.isArray(p.unlocked)||!p.unlocked.every(id=>data.heroes.some(h=>h.id===id)))throw Error('不合法的英雄池');profile={label:String(p.label||'我的英雄池'),unlocked:p.unlocked,excluded:p.excluded||[],familiarity:p.familiarity||{},aliases:p.aliases||{}};engine=RankAdvisorEngine.create(data,profile);snapshot=engine.snapshot();state=null;renderPool();$('capture').click();}catch(e){$('error').textContent=e.message;}};
renderPool();$('capture').click();
