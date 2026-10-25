const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
class Panel{
 constructor(type,parent,id){this.paneltype=type;this.parent=parent;this.id=id;this.children=[];this.classes=new Set();this.valid=true;this.text='';this.events={};if(parent)parent.children.push(this);}
 IsValid(){return this.valid;} GetParent(){return this.parent;} GetChildCount(){return this.children.length;} GetChild(i){return this.children[i];}
 AddClass(c){this.classes.add(c);} BHasClass(c){return this.classes.has(c);} SetPanelEvent(k,f){this.events[k]=f;}
 FindChildTraverse(id){for(const c of this.children){if(c.id===id)return c;const x=c.FindChildTraverse(id);if(x)return x;}return null;}
 FindChildrenWithClassTraverse(cls){return this.children.flatMap(c=>[...(c.classes.has(cls)?[c]:[]),...c.FindChildrenWithClassTraverse(cls)]);}
 RemoveAndDeleteChildren(){this.children.forEach(c=>c.DeleteAsync());this.children=[];}
 DeleteAsync(){this.valid=false;this.RemoveAndDeleteChildren();if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
}
function harness(unlocked=[]){
 const root=new Panel('CitadelHud',null,'Hud'),top=new Panel('CitadelHudTopBar',root,'TopBar'),queue=[],logs=[];let manifest;
 const a=['Haze','Wraith','Vindicta','Seven','Infernus','McGinnis'],b=['Abrams','Mo & Krill','Kelvin','Lash','Bebop','Dynamo'];
 const rows=[];[a,b].forEach((team,n)=>{const t=new Panel('CitadelHudTopBarTeam',top,n?'TeamEnemy':'TeamFriendly'),container=new Panel('Panel',t,'PlayersContainer');rows[n]=team.map(id=>{const p=new Panel('CitadelHudTopBarPlayer',container,''),l=new Panel('Label',p,'');l.AddClass('HeroNameHidden');l.text=id;return l;});});
 const ctx=vm.createContext({QOL:{core:{FeatureRegistry:{register:m=>manifest=m}}},$:{GetContextPanel:()=>root,CreatePanel:(t,p,id)=>new Panel(t,p,id),Schedule:(s,f)=>queue.push(f),Msg:t=>logs.push(t),DispatchEvent:()=>{}}});
 for(const f of ['data','stats-data','statistics','knowledge-data','planner','profile','engine','hud'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/'+f+'.js'),'utf8'),ctx);
 ctx.RankAdvisorProfile.unlocked=unlocked;
 const inst=manifest.create();inst.onEnable();return {root,rows,queue,logs,inst,step:()=>queue.shift()?.(),texts:()=>{const walk=p=>[p.text,...p.children.flatMap(walk)];const box=root.FindChildTraverse('RankAdvisor');return box?walk(box).filter(Boolean).join('\n'):'';}};
}
test('HUD reads native-shape panels, locks enemy, updates allies, resets in hideout and cancels on disable',()=>{
 const h=harness();assert.ok(h.texts().includes('初始阵容已锁定'));assert.equal(h.queue.length,1);assert.equal(h.logs.length,0);
 const box=h.root.FindChildTraverse('RankAdvisor'),count=box.children.length;h.step();assert.equal(box.children.length,count);
 h.rows[1][0].text='Shiv';h.rows[0][0].text='Pocket';h.step();assert.ok(h.texts().includes('Pocket'));assert.ok(h.texts().includes('Abrams'));assert.ok(!h.texts().includes('Shiv'));
 h.root.AddClass('InHideout');h.step();assert.ok(h.texts().includes('等待下一场'));h.root.classes.delete('InHideout');h.step();assert.ok(h.texts().includes('Shiv'));
 h.inst.onDisable();h.step();assert.equal(h.queue.length,0);assert.equal(h.root.FindChildTraverse('RankAdvisor'),null);assert.deepEqual(h.logs,[]);
});

test('HUD shows concrete swaps, lanes and build controls without evidence clutter',()=>{
 const h=harness(['haze','wraith','vindicta']);
 ['Celeste','Paige','Graves','Viscous','Apollo','The Doorman'].forEach((name,i)=>h.rows[0][i].text=name);h.step();
 const click=text=>{const walk=p=>[p,...p.children.flatMap(walk)];const b=walk(h.root).find(p=>p.paneltype==='Button'&&p.children.some(c=>c.text===text));assert.ok(b,'button '+text);b.events.onactivate();h.step();};
 click('Celeste');assert.ok(h.texts().includes('首选换成'));assert.ok(h.texts().includes('补持续武器输出'));assert.ok(h.texts().includes('当前阵容 · 分路搭配'));assert.ok(!h.texts().includes('95%'));assert.ok(!h.texts().includes('不能据此推断'));
 click('Graves · 常见');assert.ok(h.texts().includes('Graves · 武器'));assert.ok(!h.texts().includes('补持续武器输出'));
 click('下一局重置');assert.ok(h.texts().includes('Graves · 常见'));click('Celeste');assert.ok(h.texts().includes('补持续武器输出'));assert.deepEqual(h.logs,[]);h.inst.onDisable();
});
