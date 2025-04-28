/**
 * 职业技能模板系统 - 定义游戏中职业技能的模板结构
 */
const JobSkillsTemplate = {
    /**
     * 初始化技能模板系统
     */
    init() {
        console.log('初始化职业技能模板系统');
        this.loadTemplates();
    },

    /**
     * 加载技能模板数据
     */
    loadTemplates() {
        console.log('加载技能模板数据');

        // 由于CORS限制，我们直接在JS中定义模板数据，而不是从JSON文件加载
        this.templates = {
          "warriorSlash": {
            "name": "狂怒",
            "description": "所有参战者获得攻击力+20%,持续3回合。CD5回合",
            "type": "buff",
            "fixed": true,
            "cooldown": 5,
            "effectType": "buff",
            "targetType": "all_allies",
            "duration": 3,
            "effects": [
              {
                "type": "attackUp",
                "value": 0.2,
                "duration": 3,
                "stackable": true,
                "dispellable": true
              }
            ]
          },
          "fortressGuard": {
            "name": "佰长之护",
            "description": "无敌1次，持续3回合。攻击力降低20%。CD8回合",
            "type": "defense",
            "fixed": true,
            "cooldown": 8,
            "effectType": "buff",
            "targetType": "self",
            "duration": 3,
            "effects": [
              {
                "type": "invincible",
                "value": 1,
                "maxHits": 1,
                "duration": 3,
                "stackable": false,
                "dispellable": false
              },
              {
                "type": "attackDown",
                "value": 0.2,
                "duration": 3,
                "stackable": true,
                "dispellable": true
              }
            ]
          },
          "clericLight": {
            "name": "全体净化",
            "description": "所有参战者净化一个debuff,CD4回合",
            "type": "heal",
            "fixed": true,
            "cooldown": 4,
            "effectType": "dispel",
            "targetType": "all_allies",
            "effects": [
              {
                "type": "dispel",
                "count": 1,
                "dispelPositive": false
              }
            ]
          },
          "arcanistBolt": {
            "name": "致盲",
            "description": "对敌方单体施加黑暗debuff[降低50%攻击命中率],持续3回合,CD5回合",
            "type": "magic",
            "fixed": true,
            "cooldown": 5,
            "effectType": "debuff",
            "targetType": "enemy",
            "duration": 3,
            "effects": [
              {
                "type": "missRate",
                "value": 0.5,
                "duration": 3,
                "stackable": true,
                "dispellable": true,
                "name": "黑暗",
                "description": "降低攻击命中率",
                "icon": "🌑"
              }
            ]
          },
          "spellbladeStrike": {
            "name": "加速",
            "description": "我方全体获得DA[普通攻击变成连击]+10%,TA[普通攻击变成三连击]+5%buff，持续3回合,CD7回合",
            "type": "attack",
            "fixed": true,
            "cooldown": 7,
            "effectType": "buff",
            "targetType": "all_allies",
            "duration": 3,
            "effects": [
              {
                "type": "daBoost",
                "value": 0.1,
                "duration": 3,
                "stackable": true,
                "dispellable": true,
                "name": "DA提升",
                "description": "提高双重攻击率",
                "icon": "⚔️⚔️"
              },
              {
                "type": "taBoost",
                "value": 0.05,
                "duration": 3,
                "stackable": true,
                "dispellable": true,
                "name": "TA提升",
                "description": "提高三重攻击率",
                "icon": "⚔️⚔️⚔️"
              }
            ]
          },
          "archerShot": {
            "name": "剑雨",
            "description": "对敌方全体造成150%-300%攻击力的伤害，CD5回合",
            "type": "attack",
            "fixed": true,
            "cooldown": 5,
            "effectType": "damage",
            "targetType": "all_enemies",
            "effects": [
              {
                "type": "damage",
                "minMultiplier": 1.5,
                "maxMultiplier": 3.0
              }
            ]
          },
          "berserkerRage": {
            "name": "暴走",
            "description": "全体获得以下状态:DA+100%,TA+50%。持续3回合，CD6回合。",
            "type": "attack",
            "fixed": true,
            "cooldown": 6,
            "effectType": "buff",
            "targetType": "all_allies",
            "duration": 3,
            "effects": [
              {
                "type": "daBoost",
                "value": 1.0,
                "duration": 3,
                "stackable": true,
                "dispellable": true,
                "name": "DA大幅提升",
                "description": "大幅提高双重攻击率",
                "icon": "⚔️⚔️"
              },
              {
                "type": "taBoost",
                "value": 0.5,
                "duration": 3,
                "stackable": true,
                "dispellable": true,
                "name": "TA大幅提升",
                "description": "大幅提高三重攻击率",
                "icon": "⚔️⚔️⚔️"
              }
            ]
          },
          "spartanStance": {
            "name": "盾墙",
            "description": "我方全体获得全属性伤害70%减免BUFF，持续一回合。CD5回合",
            "type": "defense",
            "fixed": true,
            "cooldown": 5,
            "effectType": "buff",
            "targetType": "all_allies",
            "duration": 1,
            "effects": [
              {
                "type": "damageReduction",
                "value": 0.7,
                "duration": 1,
                "stackable": true,
                "dispellable": true,
                "name": "盾墙",
                "description": "减少受到的所有伤害",
                "icon": "🛡️🛡️"
              }
            ]
          },
          "bishopBlessing": {
            "name": "全体治疗",
            "description": "我方全体回复2000HP，CD5回合",
            "type": "heal",
            "fixed": true,
            "cooldown": 5,
            "effectType": "heal",
            "targetType": "all_allies",
            "effects": [
              {
                "type": "heal",
                "value": 2000
              }
            ]
          },
          "hermitSpell": {
            "name": "以太爆发",
            "description": "对敌方全体造成300-400%攻击力的伤害。CD5回合",
            "type": "magic",
            "fixed": true,
            "cooldown": 5,
            "effectType": "damage",
            "targetType": "all_enemies",
            "effects": [
              {
                "type": "damage",
                "minMultiplier": 3.0,
                "maxMultiplier": 4.0
              }
            ]
          },
          "warlockCurse": {
            "name": "霾晦",
            "description": "对敌方全体施加以下DEBUFF，持续3回合，CD5回合 1.攻击力降低15% 2.防御力降低15% 3.命中降低50% 4.中毒（每回合1000伤害）",
            "type": "magic",
            "fixed": true,
            "cooldown": 5,
            "effectType": "debuff",
            "targetType": "all_enemies",
            "duration": 3,
            "effects": [
              {
                "type": "attackDown",
                "value": 0.15,
                "duration": 3,
                "stackable": true,
                "dispellable": true
              },
              {
                "type": "defenseDown",
                "value": 0.15,
                "duration": 3,
                "stackable": true,
                "dispellable": true
              },
              {
                "type": "missRate",
                "value": 0.5,
                "duration": 3,
                "stackable": true,
                "dispellable": true,
                "name": "命中降低",
                "description": "降低攻击命中率",
                "icon": "👁️❌"
              },
              {
                "type": "dot",
                "value": 1000,
                "duration": 3,
                "stackable": true,
                "dispellable": true,
                "name": "中毒",
                "description": "每回合受到伤害",
                "icon": "☠️"
              }
            ]
          },
          "darkKnightSlash": {
            "name": "惨雾",
            "description": "对敌方全体施加以下DEBUFF，持续4回合，CD5回合 1.攻击力降低25% 2.防御力降低25%",
            "type": "attack",
            "fixed": true,
            "cooldown": 5,
            "effectType": "debuff",
            "targetType": "all_enemies",
            "duration": 4,
            "effects": [
              {
                "type": "attackDown",
                "value": 0.25,
                "duration": 4,
                "stackable": true,
                "dispellable": true
              },
              {
                "type": "defenseDown",
                "value": 0.25,
                "duration": 4,
                "stackable": true,
                "dispellable": true
              }
            ]
          },
          "rattlesnakeAim": {
            "name": "疾风步",
            "description": "自身获得以下BUFF，持续一回合,CD5回合 1.攻击力+100% 2.完全回避（回避所有伤害，不可回避除外）",
            "type": "attack",
            "fixed": true,
            "cooldown": 5,
            "effectType": "buff",
            "targetType": "self",
            "duration": 1,
            "effects": [
              {
                "type": "attackUp",
                "value": 1.0,
                "duration": 1,
                "stackable": true,
                "dispellable": true
              },
              {
                "type": "evade",
                "value": 1.0,
                "duration": 1,
                "stackable": false,
                "dispellable": true,
                "name": "完全回避",
                "description": "回避所有伤害",
                "icon": "💨"
              }
            ]
          },
          "robinHoodArrow": {
            "name": "一支穿云箭",
            "description": "对敌方造成5次100%攻击力的伤害 CD5回合，并施加以下 DEBUFF，持续3回合：1.DA降低100% 2.TA降低100% 3.命中降低50% 4.麻痹（无法行动，包括技能和普通攻击）",
            "type": "attack",
            "fixed": true,
            "cooldown": 5,
            "effectType": "damage_and_debuff",
            "targetType": "enemy",
            "duration": 3,
            "effects": [
              {
                "type": "multi_attack",
                "count": 5,
                "multiplier": 1.0
              },
              {
                "type": "daDown",
                "value": 1.0,
                "duration": 3,
                "stackable": false,
                "dispellable": true,
                "name": "DA禁止",
                "description": "无法触发双重攻击",
                "icon": "⚔️⚔️❌"
              },
              {
                "type": "taDown",
                "value": 1.0,
                "duration": 3,
                "stackable": false,
                "dispellable": true,
                "name": "TA禁止",
                "description": "无法触发三重攻击",
                "icon": "⚔️⚔️⚔️❌"
              },
              {
                "type": "missRate",
                "value": 0.5,
                "duration": 3,
                "stackable": true,
                "dispellable": true,
                "name": "命中降低",
                "description": "降低攻击命中率",
                "icon": "👁️❌"
              },
              {
                "type": "stun",
                "value": 1.0,
                "duration": 3,
                "stackable": false,
                "dispellable": true,
                "name": "麻痹",
                "description": "无法行动",
                "icon": "⚡"
              }
            ]
          },
          "beastLordCommand": {
            "name": "兽王指令",
            "description": "对敌方全体造成200%攻击力伤害，并施加防御力降低10%debuff和攻击力降低10%debuff,持续3回合。我方全体获得樵夫之歌[1.我方全体获得浑身buff,效果10%-20% 2.我方全体获得恢复buff，效果3000]buff，无法驱散，持续3回合CD6回合。",
            "type": "attack",
            "fixed": true,
            "cooldown": 6,
            "effectType": "damage_and_buff",
            "targetType": "all",
            "duration": 3,
            "effects": [
              {
                "type": "damage",
                "multiplier": 2.0,
                "target": "all_enemies"
              },
              {
                "type": "defenseDown",
                "value": 0.1,
                "duration": 3,
                "stackable": true,
                "dispellable": true,
                "target": "all_enemies"
              },
              {
                "type": "attackDown",
                "value": 0.1,
                "duration": 3,
                "stackable": true,
                "dispellable": true,
                "target": "all_enemies"
              },
              {
                "type": "allStatsUp",
                "minValue": 0.1,
                "maxValue": 0.2,
                "duration": 3,
                "stackable": true,
                "dispellable": false,
                "target": "all_allies",
                "name": "樵夫之歌",
                "description": "提高所有属性"
              },
              {
                "type": "regen",
                "value": 3000,
                "duration": 3,
                "stackable": true,
                "dispellable": false,
                "target": "all_allies",
                "name": "樵夫之歌",
                "description": "每回合恢复生命值"
              }
            ]
          },
          "oathShielderVow": {
            "name": "盾誓者誓言",
            "description": "自身获得英勇之盾BUFF，持续一回合,CD8回合 英勇之盾: 1.全体援护（自身成为攻击目标，aoe除外） 2.防御力+1000 3.单次受到的伤害，最大值锁定为500 4.回合结束时,对敌方全体造成100%攻击力的伤害",
            "type": "defense",
            "fixed": true,
            "cooldown": 8,
            "effectType": "buff",
            "targetType": "self",
            "duration": 1,
            "effects": [
              {
                "type": "cover",
                "value": 1.0,
                "duration": 1,
                "stackable": false,
                "dispellable": false,
                "name": "英勇之盾",
                "description": "成为攻击目标"
              },
              {
                "type": "defenseUp",
                "value": 1000,
                "duration": 1,
                "stackable": true,
                "dispellable": false,
                "name": "英勇之盾",
                "description": "增加防御力"
              },
              {
                "type": "damageCap",
                "value": 500,
                "duration": 1,
                "stackable": false,
                "dispellable": false,
                "name": "英勇之盾",
                "description": "限制受到的伤害"
              },
              {
                "type": "counterAttack",
                "multiplier": 1.0,
                "target": "all_enemies",
                "duration": 1,
                "stackable": false,
                "dispellable": false,
                "name": "英勇之盾",
                "description": "回合结束时反击"
              }
            ]
          },
          "saintPrayer": {
            "name": "主教座堂",
            "description": "我方全体获得以下强化：1.伤害吸收盾5000，持续到消耗完 2.主教座堂BUFF,持续2次，受到攻击降低一次，无法驱散: a.受到的伤害转为主角有利属性 b.主角有利属性伤害减轻20% CD16回合",
            "type": "heal",
            "fixed": true,
            "cooldown": 16,
            "effectType": "buff",
            "targetType": "all_allies",
            "effects": [
              {
                "type": "shield",
                "value": 5000,
                "stackable": false,
                "dispellable": false,
                "name": "主教座堂",
                "description": "伤害吸收盾"
              },
              {
                "type": "elementConversion",
                "maxHits": 2,
                "stackable": false,
                "dispellable": false,
                "name": "主教座堂",
                "description": "伤害转换为有利属性"
              },
              {
                "type": "elementalResistance",
                "value": 0.2,
                "maxHits": 2,
                "stackable": false,
                "dispellable": false,
                "name": "主教座堂",
                "description": "有利属性伤害减轻"
              }
            ]
          },
          "chaosLordDisruption": {
            "name": "荒凉无序",
            "description": "对敌方单体造成2次150%攻击力的伤害，并施加以下DEBUFF，持续3回合，CD6回合 2.防御力降低20% 3.DA降低30% 3.TA降低20%",
            "type": "attack",
            "fixed": true,
            "cooldown": 6,
            "effectType": "damage_and_debuff",
            "targetType": "enemy",
            "duration": 3,
            "effects": [
              {
                "type": "multi_attack",
                "count": 2,
                "multiplier": 1.5
              },
              {
                "type": "defenseDown",
                "value": 0.2,
                "duration": 3,
                "stackable": true,
                "dispellable": true
              },
              {
                "type": "daDown",
                "value": 0.3,
                "duration": 3,
                "stackable": true,
                "dispellable": true
              },
              {
                "type": "taDown",
                "value": 0.2,
                "duration": 3,
                "stackable": true,
                "dispellable": true
              }
            ]
          },

          // 普通技能（从JobSystem.skills移植）
          "armorBreak": {
            "name": "护甲破坏",
            "description": "对敌方单体造成100%攻击力的伤害，并对敌方单位施加防御力-20%DEBUFF，持续3回合，CD5回合。",
            "type": "attack",
            "fixed": false,
            "cooldown": 5,
            "effectType": "damage_and_debuff",
            "targetType": "enemy",
            "duration": 3,
            "effects": [
              {
                "type": "damage",
                "multiplier": 1.0
              },
              {
                "type": "defenseDown",
                "value": 0.2,
                "duration": 3,
                "stackable": true,
                "dispellable": true
              }
            ]
          },
          "fiercePounce": {
            "name": "猛袭",
            "description": "被动:自身DA+15%",
            "type": "buff",
            "fixed": false,
            "passive": true,
            "effectType": "buff",
            "targetType": "self",
            "effects": [
              {
                "type": "daBoost",
                "value": 0.15,
                "passive": true
              }
            ]
          },
          "whirlwind": {
            "name": "旋风斩",
            "description": "被动:攻击时30%概率触发旋转攻击周围所有敌人，造成120%攻击力的伤害。",
            "type": "aoe",
            "fixed": false,
            "passive": true,
            "effectType": "damage",
            "targetType": "all_enemies",
            "effects": [
              {
                "type": "proc",
                "chance": 0.3,
                "onAttack": true,
                "effect": {
                  "type": "damage",
                  "multiplier": 1.2,
                  "targetType": "all_enemies"
                }
              }
            ]
          },
          "shieldWall": {
            "name": "盾墙",
            "description": "我方全体获得50%伤害减免，持续一回合。CD5回合",
            "type": "defense",
            "fixed": false,
            "cooldown": 5,
            "effectType": "buff",
            "targetType": "all_allies",
            "duration": 1,
            "effects": [
              {
                "type": "damageReduction",
                "value": 0.5,
                "duration": 1,
                "stackable": true,
                "dispellable": true
              }
            ]
          },
          "guardianFormation": {
            "name": "守护方阵",
            "description": "被动:组成防御阵型，增加全队20%防御力。",
            "type": "buff",
            "fixed": false,
            "passive": true,
            "effectType": "buff",
            "targetType": "all_allies",
            "effects": [
              {
                "type": "defenseUp",
                "value": 0.2,
                "passive": true
              }
            ]
          },
          "cover": {
            "name": "援护",
            "description": "被动:我方单位被攻击时，有40%概率代替承受伤害。",
            "type": "buff",
            "fixed": false,
            "passive": true,
            "effectType": "buff",
            "targetType": "self",
            "effects": [
              {
                "type": "cover",
                "chance": 0.4,
                "passive": true
              }
            ]
          },
          "heal": {
            "name": "治愈",
            "description": "恢复HP最低的我方单位1000hp，CD5回合",
            "type": "heal",
            "fixed": false,
            "cooldown": 5,
            "effectType": "heal",
            "targetType": "ally_lowest_hp",
            "effects": [
              {
                "type": "heal",
                "value": 1000
              }
            ]
          },
          "flashSpell": {
            "name": "闪光术",
            "description": "被动:攻击时有30%概率触发，对敌方全体造成100-150%攻击力的伤害。",
            "type": "magic",
            "fixed": false,
            "passive": true,
            "effectType": "damage",
            "targetType": "all_enemies",
            "effects": [
              {
                "type": "proc",
                "chance": 0.3,
                "onAttack": true,
                "effect": {
                  "type": "damage",
                  "minMultiplier": 1.0,
                  "maxMultiplier": 1.5,
                  "targetType": "all_enemies"
                }
              }
            ]
          },
          "resurrection": {
            "name": "复活",
            "description": "复活倒下的队友，恢复30%生命值，CD10回合",
            "type": "heal",
            "fixed": false,
            "cooldown": 10,
            "effectType": "revive",
            "targetType": "ally_dead",
            "effects": [
              {
                "type": "revive",
                "hpRatio": 0.3
              }
            ]
          },
          "fireball": {
            "name": "火球术",
            "description": "发射一个火球，对敌方单体造成200%-300%攻击力伤害。CD6回合",
            "type": "magic",
            "fixed": false,
            "cooldown": 6,
            "effectType": "damage",
            "targetType": "enemy",
            "effects": [
              {
                "type": "damage",
                "minMultiplier": 2.0,
                "maxMultiplier": 3.0,
                "element": "fire"
              }
            ]
          },
          "frostBolt": {
            "name": "寒冰",
            "description": "被动:攻击时有15%概率发射一支冰箭，造成60%攻击力的冰属性伤害并施加攻击力-10%DEBUFF，持续2回合。",
            "type": "magic",
            "fixed": false,
            "passive": true,
            "effectType": "damage_and_debuff",
            "targetType": "enemy",
            "effects": [
              {
                "type": "proc",
                "chance": 0.15,
                "onAttack": true,
                "effect": {
                  "type": "damage",
                  "multiplier": 0.6,
                  "element": "ice",
                  "followUp": {
                    "type": "attackDown",
                    "value": 0.1,
                    "duration": 2,
                    "stackable": true,
                    "dispellable": true
                  }
                }
              }
            ]
          },
          "thunderstorm": {
            "name": "雷暴",
            "description": "被动:回合结束时对敌方全体造成5次30%攻击力的伤害",
            "type": "magic",
            "fixed": false,
            "passive": true,
            "effectType": "damage",
            "targetType": "all_enemies",
            "effects": [
              {
                "type": "endOfTurn",
                "effect": {
                  "type": "multi_attack",
                  "count": 5,
                  "multiplier": 0.3,
                  "targetType": "all_enemies",
                  "element": "thunder"
                }
              }
            ]
          },
          "weaken": {
            "name": "虚弱",
            "description": "对敌方单体施加攻击力-20%DEBUFF，防御力-20%DEBUFF，持续2回合，CD5回合。",
            "type": "attack",
            "fixed": false,
            "cooldown": 5,
            "effectType": "debuff",
            "targetType": "enemy",
            "duration": 2,
            "effects": [
              {
                "type": "attackDown",
                "value": 0.2,
                "duration": 2,
                "stackable": true,
                "dispellable": true
              },
              {
                "type": "defenseDown",
                "value": 0.2,
                "duration": 2,
                "stackable": true,
                "dispellable": true
              }
            ]
          },
          "enhance": {
            "name": "强化",
            "description": "被动:提高我方全体10%攻击力",
            "type": "buff",
            "fixed": false,
            "passive": true,
            "effectType": "buff",
            "targetType": "all_allies",
            "effects": [
              {
                "type": "attackUp",
                "value": 0.1,
                "passive": true
              }
            ]
          },
          "shadowSlash": {
            "name": "暗影斩",
            "description": "被动:攻击时有15%概率触发，对敌方单体造成250%-350%攻击力的伤害。",
            "type": "attack",
            "fixed": false,
            "passive": true,
            "effectType": "damage",
            "targetType": "enemy",
            "effects": [
              {
                "type": "proc",
                "chance": 0.15,
                "onAttack": true,
                "effect": {
                  "type": "damage",
                  "minMultiplier": 2.5,
                  "maxMultiplier": 3.5,
                  "element": "dark"
                }
              }
            ]
          },
          "preciseShot": {
            "name": "精准射击",
            "description": "被动:无视命中率降低DEBUFF，攻击必定命中",
            "type": "attack",
            "fixed": false,
            "passive": true,
            "effectType": "buff",
            "targetType": "self",
            "effects": [
              {
                "type": "ignoreDebuff",
                "debuffType": "missRate",
                "passive": true
              }
            ]
          },
          "multiShot": {
            "name": "多重射击",
            "description": "被动: 攻击时50%概率触发，对敌方单体造成80%-120%伤害",
            "type": "attack",
            "fixed": false,
            "passive": true,
            "effectType": "damage",
            "targetType": "enemy",
            "effects": [
              {
                "type": "proc",
                "chance": 0.5,
                "onAttack": true,
                "effect": {
                  "type": "damage",
                  "minMultiplier": 0.8,
                  "maxMultiplier": 1.2
                }
              }
            ]
          },
          "arrowRain": {
            "name": "箭雨",
            "description": "同时射出多支箭，对全部敌人造成3次80%-100%攻击力的伤害。CD6回合",
            "type": "aoe",
            "fixed": false,
            "cooldown": 6,
            "effectType": "damage",
            "targetType": "all_enemies",
            "effects": [
              {
                "type": "multi_attack",
                "count": 3,
                "minMultiplier": 0.8,
                "maxMultiplier": 1.0,
                "targetType": "all_enemies"
              }
            ]
          }
        };

        console.log('技能模板数据加载成功');

        // 触发技能模板加载完成事件
        if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
            Events.emit('jobSkillsTemplate:loaded');
        }
    },

    /**
     * 技能效果类型枚举
     */
    EFFECT_TYPES: {
        BUFF: 'buff',           // 增益效果
        DEBUFF: 'debuff',       // 减益效果
        DAMAGE: 'damage',       // 伤害效果
        HEAL: 'heal',           // 治疗效果
        DISPEL: 'dispel',       // 驱散效果
        SHIELD: 'shield',       // 护盾效果
        DOT: 'dot',             // 持续伤害
        HOT: 'hot'              // 持续治疗
    },

    /**
     * 技能目标类型枚举
     */
    TARGET_TYPES: {
        SELF: 'self',           // 自身
        ALLY: 'ally',           // 单个队友
        ALL_ALLIES: 'all_allies', // 所有队友
        ENEMY: 'enemy',         // 单个敌人
        ALL_ENEMIES: 'all_enemies' // 所有敌人
    },

    /**
     * 获取技能模板
     * @param {string} templateId - 模板ID
     * @returns {object|null} 技能模板
     */
    getTemplate(templateId) {
        return this.templates[templateId] || null;
    },

    /**
     * 创建技能实例
     * @param {string} templateId - 模板ID
     * @param {object} overrides - 覆盖默认属性的对象
     * @returns {object|null} 技能实例
     */
    createSkill(templateId, overrides = {}) {
        const template = this.getTemplate(templateId);
        if (!template) return null;

        // 创建技能实例
        return {
            ...template,
            ...overrides,
            id: templateId,
            cooldownRemaining: 0
        };
    }
};
