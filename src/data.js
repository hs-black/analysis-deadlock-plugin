(function(g){
var d={
  "version": "0.1.1",
  "kind": "mechanics-heuristic",
  "reviewedPatch": null,
  "catalogSource": "https://github.com/0xThiagoAmaral/deadlock-open-assets/blob/main/assets/game/heroes.json",
  "catalogDate": "2026-06-20",
  "heroes": [
    {
      "id": "abrams",
      "name": "Abrams",
      "traits": {
        "dps": 1,
        "burst": 1,
        "engage": 2,
        "control": 2,
        "frontline": 2,
        "clear": 1,
        "heal": 2,
        "poke": 0,
        "mobility": 1
      },
      "threats": [
        "healing",
        "dive"
      ],
      "gunCore": false
    },
    {
      "id": "apollo",
      "name": "Apollo",
      "traits": {
        "dps": 1,
        "burst": 2,
        "engage": 1,
        "control": 1,
        "frontline": 0,
        "clear": 1,
        "heal": 0,
        "poke": 0,
        "mobility": 2
      },
      "threats": [
        "dive",
        "burst"
      ],
      "gunCore": false
    },
    {
      "id": "bebop",
      "name": "Bebop",
      "traits": {
        "dps": 1,
        "burst": 2,
        "engage": 2,
        "control": 2,
        "frontline": 1,
        "clear": 1,
        "heal": 0,
        "poke": 1,
        "mobility": 0
      },
      "threats": [
        "channel",
        "burst"
      ],
      "gunCore": false
    },
    {
      "id": "billy",
      "name": "Billy",
      "traits": null,
      "threats": [],
      "gunCore": null
    },
    {
      "id": "calico",
      "name": "Calico",
      "traits": null,
      "threats": [],
      "gunCore": null
    },
    {
      "id": "celeste",
      "name": "Celeste",
      "traits": {
        "dps": 1,
        "burst": 2,
        "engage": 0,
        "control": 1,
        "frontline": 0,
        "clear": 2,
        "heal": 1,
        "poke": 2,
        "mobility": 1
      },
      "threats": [
        "range",
        "burst"
      ],
      "gunCore": false
    },
    {
      "id": "doorman",
      "name": "The Doorman",
      "traits": {
        "dps": 1,
        "burst": 1,
        "engage": 1,
        "control": 2,
        "frontline": 0,
        "clear": 1,
        "heal": 0,
        "poke": 1,
        "mobility": 2
      },
      "threats": [
        "control",
        "mobility"
      ],
      "gunCore": false
    },
    {
      "id": "drifter",
      "name": "Drifter",
      "traits": null,
      "threats": [],
      "gunCore": null
    },
    {
      "id": "dynamo",
      "name": "Dynamo",
      "traits": {
        "dps": 0,
        "burst": 1,
        "engage": 2,
        "control": 2,
        "frontline": 1,
        "clear": 1,
        "heal": 2,
        "poke": 0,
        "mobility": 1
      },
      "threats": [
        "channel",
        "healing"
      ],
      "gunCore": false
    },
    {
      "id": "graves",
      "name": "Graves",
      "traits": {
        "dps": 1,
        "burst": 1,
        "engage": 0,
        "control": 2,
        "frontline": 0,
        "clear": 2,
        "heal": 0,
        "poke": 1,
        "mobility": 0
      },
      "threats": [
        "control"
      ],
      "gunCore": false
    },
    {
      "id": "grey_talon",
      "name": "Grey Talon",
      "traits": {
        "dps": 1,
        "burst": 2,
        "engage": 0,
        "control": 1,
        "frontline": 0,
        "clear": 1,
        "heal": 0,
        "poke": 2,
        "mobility": 1
      },
      "threats": [
        "range",
        "burst"
      ],
      "gunCore": false
    },
    {
      "id": "haze",
      "name": "Haze",
      "traits": {
        "dps": 2,
        "burst": 1,
        "engage": 0,
        "control": 1,
        "frontline": 0,
        "clear": 1,
        "heal": 0,
        "poke": 1,
        "mobility": 1
      },
      "threats": [
        "gun",
        "channel"
      ],
      "gunCore": true
    },
    {
      "id": "holliday",
      "name": "Holliday",
      "traits": null,
      "threats": [],
      "gunCore": null
    },
    {
      "id": "infernus",
      "name": "Infernus",
      "traits": {
        "dps": 2,
        "burst": 1,
        "engage": 1,
        "control": 1,
        "frontline": 1,
        "clear": 2,
        "heal": 0,
        "poke": 1,
        "mobility": 2
      },
      "threats": [
        "dot",
        "dive"
      ],
      "gunCore": true
    },
    {
      "id": "ivy",
      "name": "Ivy",
      "traits": {
        "dps": 1,
        "burst": 0,
        "engage": 1,
        "control": 1,
        "frontline": 1,
        "clear": 1,
        "heal": 1,
        "poke": 1,
        "mobility": 2
      },
      "threats": [
        "mobility"
      ],
      "gunCore": false
    },
    {
      "id": "kelvin",
      "name": "Kelvin",
      "traits": {
        "dps": 1,
        "burst": 1,
        "engage": 1,
        "control": 2,
        "frontline": 1,
        "clear": 2,
        "heal": 2,
        "poke": 1,
        "mobility": 1
      },
      "threats": [
        "healing",
        "control"
      ],
      "gunCore": false
    },
    {
      "id": "lady_geist",
      "name": "Lady Geist",
      "traits": {
        "dps": 1,
        "burst": 2,
        "engage": 0,
        "control": 1,
        "frontline": 1,
        "clear": 2,
        "heal": 1,
        "poke": 2,
        "mobility": 0
      },
      "threats": [
        "burst",
        "healing"
      ],
      "gunCore": false
    },
    {
      "id": "lash",
      "name": "Lash",
      "traits": {
        "dps": 1,
        "burst": 2,
        "engage": 2,
        "control": 2,
        "frontline": 1,
        "clear": 1,
        "heal": 1,
        "poke": 1,
        "mobility": 2
      },
      "threats": [
        "dive",
        "control"
      ],
      "gunCore": false
    },
    {
      "id": "mcginnis",
      "name": "McGinnis",
      "traits": {
        "dps": 2,
        "burst": 0,
        "engage": 0,
        "control": 1,
        "frontline": 1,
        "clear": 2,
        "heal": 2,
        "poke": 1,
        "mobility": 0
      },
      "threats": [
        "gun",
        "healing"
      ],
      "gunCore": true
    },
    {
      "id": "mina",
      "name": "Mina",
      "traits": null,
      "threats": [],
      "gunCore": null
    },
    {
      "id": "mirage",
      "name": "Mirage",
      "traits": {
        "dps": 2,
        "burst": 1,
        "engage": 1,
        "control": 1,
        "frontline": 1,
        "clear": 1,
        "heal": 0,
        "poke": 1,
        "mobility": 2
      },
      "threats": [
        "gun",
        "mobility"
      ],
      "gunCore": true
    },
    {
      "id": "mo_and_krill",
      "name": "Mo & Krill",
      "traits": {
        "dps": 1,
        "burst": 1,
        "engage": 2,
        "control": 2,
        "frontline": 2,
        "clear": 1,
        "heal": 2,
        "poke": 0,
        "mobility": 2
      },
      "threats": [
        "healing",
        "channel",
        "dive"
      ],
      "gunCore": false
    },
    {
      "id": "paige",
      "name": "Paige",
      "traits": {
        "dps": 0,
        "burst": 1,
        "engage": 1,
        "control": 2,
        "frontline": 1,
        "clear": 1,
        "heal": 2,
        "poke": 1,
        "mobility": 1
      },
      "threats": [
        "control"
      ],
      "gunCore": false
    },
    {
      "id": "paradox",
      "name": "Paradox",
      "traits": {
        "dps": 1,
        "burst": 2,
        "engage": 2,
        "control": 2,
        "frontline": 0,
        "clear": 1,
        "heal": 0,
        "poke": 2,
        "mobility": 1
      },
      "threats": [
        "burst",
        "control"
      ],
      "gunCore": false
    },
    {
      "id": "pocket",
      "name": "Pocket",
      "traits": {
        "dps": 1,
        "burst": 2,
        "engage": 1,
        "control": 0,
        "frontline": 0,
        "clear": 2,
        "heal": 0,
        "poke": 1,
        "mobility": 2
      },
      "threats": [
        "dot",
        "dive"
      ],
      "gunCore": false
    },
    {
      "id": "rem",
      "name": "Rem",
      "traits": null,
      "threats": [],
      "gunCore": null
    },
    {
      "id": "seven",
      "name": "Seven",
      "traits": {
        "dps": 2,
        "burst": 1,
        "engage": 0,
        "control": 1,
        "frontline": 0,
        "clear": 2,
        "heal": 0,
        "poke": 1,
        "mobility": 1
      },
      "threats": [
        "channel"
      ],
      "gunCore": false
    },
    {
      "id": "shiv",
      "name": "Shiv",
      "traits": {
        "dps": 1,
        "burst": 2,
        "engage": 1,
        "control": 0,
        "frontline": 2,
        "clear": 1,
        "heal": 2,
        "poke": 1,
        "mobility": 2
      },
      "threats": [
        "healing",
        "dive",
        "dot"
      ],
      "gunCore": false
    },
    {
      "id": "silver",
      "name": "Silver",
      "traits": null,
      "threats": [],
      "gunCore": null
    },
    {
      "id": "sinclair",
      "name": "Sinclair",
      "traits": null,
      "threats": [],
      "gunCore": null
    },
    {
      "id": "venator",
      "name": "Venator",
      "traits": null,
      "threats": [],
      "gunCore": null
    },
    {
      "id": "victor",
      "name": "Victor",
      "traits": null,
      "threats": [],
      "gunCore": null
    },
    {
      "id": "vindicta",
      "name": "Vindicta",
      "traits": {
        "dps": 2,
        "burst": 2,
        "engage": 0,
        "control": 1,
        "frontline": 0,
        "clear": 1,
        "heal": 0,
        "poke": 2,
        "mobility": 1
      },
      "threats": [
        "range",
        "gun"
      ],
      "gunCore": true
    },
    {
      "id": "viscous",
      "name": "Viscous",
      "traits": {
        "dps": 0,
        "burst": 1,
        "engage": 1,
        "control": 2,
        "frontline": 2,
        "clear": 1,
        "heal": 2,
        "poke": 1,
        "mobility": 1
      },
      "threats": [
        "healing",
        "control"
      ],
      "gunCore": false
    },
    {
      "id": "vyper",
      "name": "Vyper",
      "traits": null,
      "threats": [],
      "gunCore": null
    },
    {
      "id": "warden",
      "name": "Warden",
      "traits": {
        "dps": 2,
        "burst": 1,
        "engage": 1,
        "control": 1,
        "frontline": 2,
        "clear": 1,
        "heal": 1,
        "poke": 1,
        "mobility": 1
      },
      "threats": [
        "gun",
        "healing"
      ],
      "gunCore": true
    },
    {
      "id": "wraith",
      "name": "Wraith",
      "traits": {
        "dps": 2,
        "burst": 1,
        "engage": 1,
        "control": 2,
        "frontline": 0,
        "clear": 1,
        "heal": 0,
        "poke": 1,
        "mobility": 2
      },
      "threats": [
        "gun",
        "control"
      ],
      "gunCore": true
    },
    {
      "id": "yamato",
      "name": "Yamato",
      "traits": {
        "dps": 1,
        "burst": 2,
        "engage": 1,
        "control": 0,
        "frontline": 1,
        "clear": 2,
        "heal": 1,
        "poke": 1,
        "mobility": 2
      },
      "threats": [
        "dive",
        "burst"
      ],
      "gunCore": false
    }
  ],
  "roles": {
    "gun": "枪位（持续武器输出）",
    "dps": "持续输出",
    "burst": "爆发",
    "engage": "先手",
    "control": "控制",
    "frontline": "前排",
    "clear": "清线",
    "heal": "续航",
    "poke": "消耗",
    "mobility": "机动"
  },
  "minimums": {
    "dps": 5,
    "engage": 3,
    "control": 5,
    "frontline": 3,
    "clear": 5
  },
  "items": [
    {
      "id": "healbane",
      "name": "Healbane",
      "threat": "healing",
      "reason": "用重伤削弱回复；先确认自己的伤害能稳定触发。",
      "stage": "针对回复",
      "caution": "具体触发条件与数值以当前商店说明为准"
    },
    {
      "id": "toxic_bullets",
      "name": "Toxic Bullets",
      "threat": "healing",
      "need": "dps",
      "reason": "适合能持续命中、叠加效果的射击路线。",
      "stage": "射击路线备选",
      "caution": "与其他重伤方案择优，别机械重复投资"
    },
    {
      "id": "reactive_barrier",
      "name": "Reactive Barrier",
      "threat": "control",
      "reason": "面对控制接伤害时考虑护盾；需符合它的触发条件。",
      "stage": "对线防御候选",
      "caution": "不是免控，无法代替站位"
    },
    {
      "id": "debuff_reducer",
      "name": "Debuff Reducer",
      "threat": "control",
      "reason": "减少可受减益抗性影响的控制压力。",
      "stage": "防御候选",
      "caution": "并非所有控制都受影响"
    },
    {
      "id": "metal_skin",
      "name": "Metal Skin",
      "threat": "gun",
      "reason": "应对集中的子弹输出窗口。",
      "stage": "团战防御候选",
      "caution": "不等于免疫精神伤害或所有攻击"
    },
    {
      "id": "knockdown",
      "name": "Knockdown",
      "threat": "channel",
      "reason": "考虑用延迟控制打断可被打断的持续施法。",
      "stage": "功能装备候选",
      "caution": "有生效延迟；需考虑免控与施法距离"
    },
    {
      "id": "knockdown",
      "name": "Knockdown",
      "threat": "range",
      "reason": "为远程威胁提供额外控制手段。",
      "stage": "功能装备候选",
      "caution": "必须进入可施放距离，不保证单件即可克制"
    },
    {
      "id": "healing_rite",
      "name": "Healing Rite",
      "threat": "dot",
      "reason": "消耗压力大时考虑补充续航。",
      "stage": "对线续航候选",
      "caution": "先脱离伤害并核对中断条件"
    }
  ]
};
if(typeof module!=="undefined")module.exports=d;else g.RankAdvisorData=d;
})(typeof globalThis!=="undefined"?globalThis:this);
