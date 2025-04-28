/**
 * 职业技能模板系统 - 定义游戏中职业技能的模板结构
 */
const JobSkillsTemplate = {
    /**
     * 技能效果类型枚举
     */
    EFFECT_TYPES: {
        BUFF: 'buff',           // 增益效果
        DEBUFF: 'debuff',       // 减益效果
        DAMAGE: 'damage',       // 伤害效果
        HEAL: 'heal',           // 治疗效果
        DISPEL: 'dispel',       // 驱散效果
        MULTI_ATTACK: 'multi_attack', // 多重攻击
        SPECIAL: 'special'      // 特殊效果
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
     * 技能模板定义
     */
    templates: {
        // 战士职业固定技能
        warriorSlash: {
            name: '狂怒',
            description: '所有参战者获得攻击力+20%,持续3回合。CD5回合',
            type: 'buff',
            power: 1.0,
            cost: 0,
            fixed: true,
            cooldown: 5,
            effectType: 'buff',
            targetType: 'all_allies',
            duration: 3,
            effects: [
                {
                    type: 'attackUp',
                    value: 0.2,
                    duration: 3,
                    stackable: true,
                    dispellable: true
                }
            ]
        },
        
        // 堡垒职业固定技能
        fortressGuard: {
            name: '佰长之护',
            description: '无敌1次，持续3回合。攻击力降低20%。CD8回合',
            type: 'defense',
            power: 0.5,
            cost: 0,
            fixed: true,
            cooldown: 8,
            effectType: 'buff',
            targetType: 'self',
            duration: 3,
            effects: [
                {
                    type: 'invincible',
                    value: 1,
                    maxHits: 1,
                    duration: 3,
                    stackable: false,
                    dispellable: false
                },
                {
                    type: 'attackDown',
                    value: 0.2,
                    duration: 3,
                    stackable: true,
                    dispellable: true
                }
            ]
        },
        
        // 牧师职业固定技能
        clericLight: {
            name: '全体净化',
            description: '所有参战者净化一个debuff,CD4回合',
            type: 'heal',
            power: 0.1,
            cost: 0,
            fixed: true,
            cooldown: 4,
            effectType: 'dispel',
            targetType: 'all_allies',
            effects: [
                {
                    type: 'dispel',
                    count: 1,
                    dispelPositive: false
                }
            ]
        },
        
        // 秘法师职业固定技能
        arcanistBolt: {
            name: '致盲',
            description: '对敌方单体施加黑暗debuff[降低50%攻击命中率],持续3回合,CD5回合',
            type: 'magic',
            power: 1.0,
            cost: 0,
            fixed: true,
            cooldown: 5,
            effectType: 'debuff',
            targetType: 'enemy',
            duration: 3,
            effects: [
                {
                    type: 'missRate',
                    value: 0.5,
                    duration: 3,
                    stackable: true,
                    dispellable: true,
                    name: '黑暗',
                    description: '降低攻击命中率',
                    icon: '🌑'
                }
            ]
        },
        
        // 魔剑士职业固定技能
        spellbladeStrike: {
            name: '加速',
            description: '我方全体获得DA[普通攻击变成连击]+10%,TA[普通攻击变成三连击]+5%buff，持续3回合,CD7回合',
            type: 'attack',
            power: 1.0,
            cost: 0,
            fixed: true,
            cooldown: 7,
            effectType: 'buff',
            targetType: 'all_allies',
            duration: 3,
            effects: [
                {
                    type: 'daBoost',
                    value: 0.1,
                    duration: 3,
                    stackable: true,
                    dispellable: true,
                    name: 'DA提升',
                    description: '提高双重攻击率',
                    icon: '⚔️⚔️'
                },
                {
                    type: 'taBoost',
                    value: 0.05,
                    duration: 3,
                    stackable: true,
                    dispellable: true,
                    name: 'TA提升',
                    description: '提高三重攻击率',
                    icon: '⚔️⚔️⚔️'
                }
            ]
        },
        
        // 射手职业固定技能
        archerShot: {
            name: '剑雨',
            description: '对敌方全体造成150%-300%攻击力的伤害，CD5回合',
            type: 'attack',
            power: 1.0,
            cost: 0,
            fixed: true,
            cooldown: 5,
            effectType: 'damage',
            targetType: 'all_enemies',
            effects: [
                {
                    type: 'damage',
                    minMultiplier: 1.5,
                    maxMultiplier: 3.0
                }
            ]
        },
        
        // 狂战士职业固定技能
        berserkerRage: {
            name: '暴走',
            description: '全体获得以下状态:DA+100%,TA+50%。持续3回合，CD6回合。',
            type: 'attack',
            power: 1.1,
            cost: 0,
            fixed: true,
            cooldown: 6,
            effectType: 'buff',
            targetType: 'all_allies',
            duration: 3,
            effects: [
                {
                    type: 'daBoost',
                    value: 1.0,
                    duration: 3,
                    stackable: true,
                    dispellable: true,
                    name: 'DA大幅提升',
                    description: '大幅提高双重攻击率',
                    icon: '⚔️⚔️'
                },
                {
                    type: 'taBoost',
                    value: 0.5,
                    duration: 3,
                    stackable: true,
                    dispellable: true,
                    name: 'TA大幅提升',
                    description: '大幅提高三重攻击率',
                    icon: '⚔️⚔️⚔️'
                }
            ]
        },
        
        // 斯巴达职业固定技能
        spartanStance: {
            name: '盾墙',
            description: '我方全体获得全属性伤害70%减免BUFF，持续一回合。CD5回合',
            type: 'defense',
            power: 0.6,
            cost: 0,
            fixed: true,
            cooldown: 5,
            effectType: 'buff',
            targetType: 'all_allies',
            duration: 1,
            effects: [
                {
                    type: 'damageReduction',
                    value: 0.7,
                    duration: 1,
                    stackable: true,
                    dispellable: true,
                    name: '盾墙',
                    description: '减少受到的所有伤害',
                    icon: '🛡️🛡️'
                }
            ]
        },
        
        // 主教职业固定技能
        bishopBlessing: {
            name: '全体治疗',
            description: '我方全体回复2000HP，CD5回合',
            type: 'heal',
            power: 0.15,
            cost: 0,
            fixed: true,
            cooldown: 5,
            effectType: 'heal',
            targetType: 'all_allies',
            effects: [
                {
                    type: 'heal',
                    value: 2000
                }
            ]
        },
        
        // 大法师职业固定技能
        hermitSpell: {
            name: '以太爆发',
            description: '对敌方全体造成300-400%攻击力的伤害。CD5回合',
            type: 'magic',
            power: 1.1,
            cost: 0,
            fixed: true,
            cooldown: 5,
            effectType: 'damage',
            targetType: 'all_enemies',
            effects: [
                {
                    type: 'damage',
                    minMultiplier: 3.0,
                    maxMultiplier: 4.0
                }
            ]
        },
        
        // 术士职业固定技能
        warlockCurse: {
            name: '霾晦',
            description: '对敌方全体施加以下DEBUFF，持续3回合，CD5回合\
                            1.攻击力降低15%\
                            2.防御力降低15%\
                            3.命中降低50%\
                            4.中毒（每回合1000伤害）',
            type: 'magic',
            power: 1.0,
            cost: 0,
            fixed: true,
            cooldown: 5,
            effectType: 'debuff',
            targetType: 'all_enemies',
            duration: 3,
            effects: [
                {
                    type: 'attackDown',
                    value: 0.15,
                    duration: 3,
                    stackable: true,
                    dispellable: true
                },
                {
                    type: 'defenseDown',
                    value: 0.15,
                    duration: 3,
                    stackable: true,
                    dispellable: true
                },
                {
                    type: 'missRate',
                    value: 0.5,
                    duration: 3,
                    stackable: true,
                    dispellable: true,
                    name: '命中降低',
                    description: '降低攻击命中率',
                    icon: '👁️❌'
                },
                {
                    type: 'dot',
                    value: 1000,
                    duration: 3,
                    stackable: true,
                    dispellable: true,
                    name: '中毒',
                    description: '每回合受到伤害',
                    icon: '☠️'
                }
            ]
        },
        
        // 黑暗骑士职业固定技能
        darkKnightSlash: {
            name: '惨雾',
            description: '对敌方全体施加以下DEBUFF，持续4回合，CD5回合\
                            1.攻击力降低25%\
                            2.防御力降低25%',
            type: 'attack',
            power: 1.1,
            cost: 0,
            fixed: true,
            cooldown: 5,
            effectType: 'debuff',
            targetType: 'all_enemies',
            duration: 4,
            effects: [
                {
                    type: 'attackDown',
                    value: 0.25,
                    duration: 4,
                    stackable: true,
                    dispellable: true
                },
                {
                    type: 'defenseDown',
                    value: 0.25,
                    duration: 4,
                    stackable: true,
                    dispellable: true
                }
            ]
        },
        
        // 游侠职业固定技能
        rattlesnakeAim: {
            name: '疾风步',
            description: '自身获得以下BUFF，持续一回合,CD5回合\
                            1.攻击力+100%\
                            2.完全回避（回避所有伤害，不可回避除外）',
            type: 'attack',
            power: 1.2,
            cost: 0,
            fixed: true,
            cooldown: 5,
            effectType: 'buff',
            targetType: 'self',
            duration: 1,
            effects: [
                {
                    type: 'attackUp',
                    value: 1.0,
                    duration: 1,
                    stackable: true,
                    dispellable: true
                },
                {
                    type: 'evade',
                    value: 1.0,
                    duration: 1,
                    stackable: false,
                    dispellable: true,
                    name: '完全回避',
                    description: '回避所有伤害',
                    icon: '💨'
                }
            ]
        },
        
        // 罗宾汉职业固定技能
        robinHoodArrow: {
            name: '一支穿云箭',
            description: '对敌方造成5次100%攻击力的伤害 CD5回合，并施加以下 DEBUFF，持续3回合：\
                            1.DA降低100%\
                            2.TA降低100%\
                            3.命中降低50%\
                            4.麻痹（无法行动，包括技能和普通攻击）',
            type: 'attack',
            power: 1.0,
            cost: 0,
            fixed: true,
            cooldown: 5,
            effectType: 'damage_and_debuff',
            targetType: 'enemy',
            duration: 3,
            effects: [
                {
                    type: 'multi_attack',
                    count: 5,
                    multiplier: 1.0
                },
                {
                    type: 'daDown',
                    value: 1.0,
                    duration: 3,
                    stackable: false,
                    dispellable: true,
                    name: 'DA禁止',
                    description: '无法触发双重攻击',
                    icon: '⚔️⚔️❌'
                },
                {
                    type: 'taDown',
                    value: 1.0,
                    duration: 3,
                    stackable: false,
                    dispellable: true,
                    name: 'TA禁止',
                    description: '无法触发三重攻击',
                    icon: '⚔️⚔️⚔️❌'
                },
                {
                    type: 'missRate',
                    value: 0.5,
                    duration: 3,
                    stackable: true,
                    dispellable: true,
                    name: '命中降低',
                    description: '降低攻击命中率',
                    icon: '👁️❌'
                },
                {
                    type: 'stun',
                    value: 1.0,
                    duration: 3,
                    stackable: false,
                    dispellable: true,
                    name: '麻痹',
                    description: '无法行动',
                    icon: '⚡'
                }
            ]
        }
    },
    
    /**
     * 获取技能模板
     * @param {string} skillId - 技能ID
     * @returns {object} 技能模板对象
     */
    getTemplate(skillId) {
        return this.templates[skillId];
    }
};
