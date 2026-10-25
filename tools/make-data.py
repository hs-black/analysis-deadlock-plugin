import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
d=json.loads((root/'catalog.json').read_text())
# Authored baseline mechanics, NOT learned scores or current-patch performance.
# dps burst engage control frontline clear heal poke mobility; ordinal 0..2.
rows={
'apollo':([1,2,1,1,0,1,0,0,2],['dive','burst']),
'celeste':([1,2,0,1,0,2,1,2,1],['range','burst']),
'graves':([1,1,0,2,0,2,0,1,0],['control']),
'paige':([0,1,1,2,1,1,2,1,1],['control']),
'doorman':([1,1,1,2,0,1,0,1,2],['control','mobility']),
'abrams':([1,1,2,2,2,1,2,0,1],['healing','dive']),
'bebop':([1,2,2,2,1,1,0,1,0],['channel','burst']),
'dynamo':([0,1,2,2,1,1,2,0,1],['channel','healing']),
'grey_talon':([1,2,0,1,0,1,0,2,1],['range','burst']),
'haze':([2,1,0,1,0,1,0,1,1],['gun','channel']),
'infernus':([2,1,1,1,1,2,0,1,2],['dot','dive']),
'ivy':([1,0,1,1,1,1,1,1,2],['mobility']),
'kelvin':([1,1,1,2,1,2,2,1,1],['healing','control']),
'lady_geist':([1,2,0,1,1,2,1,2,0],['burst','healing']),
'lash':([1,2,2,2,1,1,1,1,2],['dive','control']),
'mcginnis':([2,0,0,1,1,2,2,1,0],['gun','healing']),
'mirage':([2,1,1,1,1,1,0,1,2],['gun','mobility']),
'mo_and_krill':([1,1,2,2,2,1,2,0,2],['healing','channel','dive']),
'paradox':([1,2,2,2,0,1,0,2,1],['burst','control']),
'pocket':([1,2,1,0,0,2,0,1,2],['dot','dive']),
'seven':([2,1,0,1,0,2,0,1,1],['channel']),
'shiv':([1,2,1,0,2,1,2,1,2],['healing','dive','dot']),
'vindicta':([2,2,0,1,0,1,0,2,1],['range','gun']),
'viscous':([0,1,1,2,2,1,2,1,1],['healing','control']),
'warden':([2,1,1,1,2,1,1,1,1],['gun','healing']),
'wraith':([2,1,1,2,0,1,0,1,2],['gun','control']),
'yamato':([1,2,1,0,1,2,1,1,2],['dive','burst'])}
keys='dps burst engage control frontline clear heal poke mobility'.split()
gun_cores={'haze','wraith','vindicta','infernus','mcginnis','mirage','warden'}
for h in d['heroes']:
 if h['id'] in rows:
  values,threats=rows[h['id']];h.update(traits=dict(zip(keys,values)),threats=threats,gunCore=h['id'] in gun_cores)
 else:h.update(traits=None,threats=[],gunCore=None)
d['roles']={'gun':'枪位（持续武器输出）','dps':'持续输出','burst':'爆发','engage':'先手','control':'控制','frontline':'前排','clear':'清线','heal':'续航','poke':'消耗','mobility':'机动'}
d['minimums']={'dps':5,'engage':3,'control':5,'frontline':3,'clear':5}
d['items']=[
 {'id':'healbane','name':'Healbane','threat':'healing','reason':'用重伤削弱回复；先确认自己的伤害能稳定触发。','stage':'针对回复','caution':'具体触发条件与数值以当前商店说明为准'},
 {'id':'toxic_bullets','name':'Toxic Bullets','threat':'healing','need':'dps','reason':'适合能持续命中、叠加效果的射击路线。','stage':'射击路线备选','caution':'与其他重伤方案择优，别机械重复投资'},
 {'id':'reactive_barrier','name':'Reactive Barrier','threat':'control','reason':'面对控制接伤害时考虑护盾；需符合它的触发条件。','stage':'对线防御候选','caution':'不是免控，无法代替站位'},
 {'id':'debuff_reducer','name':'Debuff Reducer','threat':'control','reason':'减少可受减益抗性影响的控制压力。','stage':'防御候选','caution':'并非所有控制都受影响'},
 {'id':'metal_skin','name':'Metal Skin','threat':'gun','reason':'应对集中的子弹输出窗口。','stage':'团战防御候选','caution':'不等于免疫精神伤害或所有攻击'},
 {'id':'knockdown','name':'Knockdown','threat':'channel','reason':'考虑用延迟控制打断可被打断的持续施法。','stage':'功能装备候选','caution':'有生效延迟；需考虑免控与施法距离'},
 {'id':'knockdown','name':'Knockdown','threat':'range','reason':'为远程威胁提供额外控制手段。','stage':'功能装备候选','caution':'必须进入可施放距离，不保证单件即可克制'},
 {'id':'healing_rite','name':'Healing Rite','threat':'dot','reason':'消耗压力大时考虑补充续航。','stage':'对线续航候选','caution':'先脱离伤害并核对中断条件'}]
(root/'src/data.js').write_text('(function(g){\nvar d='+json.dumps(d,ensure_ascii=False,indent=2)+';\nif(typeof module!=="undefined")module.exports=d;else g.RankAdvisorData=d;\n})(typeof globalThis!=="undefined"?globalThis:this);\n')
