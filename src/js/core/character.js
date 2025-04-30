/**
 * 角色管理系统 - 负责游戏中角色的管理
 */
const Character = {
    // 角色数据
    characters: {},

    // 角色类型定义
    types: {
        attack: {
            name: '攻击',
            description: '专注于造成高伤害',
            baseStats: { hp: 80, attack: 15, defense: 5, speed: 8 },
            growthRates: { hp: 10, attack: 3, defense: 0.5, speed: 1 }
        },
        defense: {
            name: '防御',
            description: '专注于提高生存能力',
            baseStats: { hp: 120, attack: 8, defense: 12, speed: 4 },
            growthRates: { hp: 15, attack: 1, defense: 2, speed: 0.5 }
        },
        special: {
            name: '特殊',
            description: '擅长特殊技能和属性效果',
            baseStats: { hp: 90, attack: 12, defense: 6, speed: 10 },
            growthRates: { hp: 12, attack: 2, defense: 1, speed: 1.5 }
        },
        healing: {
            name: '治疗',
            description: '擅长恢复队友生命和提供增益',
            baseStats: { hp: 70, attack: 6, defense: 8, speed: 12 },
            growthRates: { hp: 8, attack: 0.8, defense: 1.2, speed: 2 }
        }
    },

    // 属性定义
    attributes: {
        fire: {
            name: '火',
            description: '擅长持续伤害',
            strengths: ['wind'],
            weaknesses: ['water']
        },
        water: {
            name: '水',
            description: '擅长控制和减速',
            strengths: ['fire'],
            weaknesses: ['earth']
        },
        wind: {
            name: '风',
            description: '擅长速度和回避',
            strengths: ['earth'],
            weaknesses: ['fire']
        },
        earth: {
            name: '土',
            description: '擅长防御和抵抗',
            strengths: ['water'],
            weaknesses: ['wind']
        },
        light: {
            name: '光',
            description: '擅长治疗和增益',
            strengths: ['dark'],
            weaknesses: []
        },
        dark: {
            name: '暗',
            description: '擅长削弱和诅咒',
            strengths: [],
            weaknesses: ['light']
        }
    },

    // 特性定义
    traits: {
        // 攻击型特性
        berserker: {
            name: '狂战士',
            description: '生命值低于30%时，攻击力提高50%',
            type: 'passive', // 被动特性
            compatibleTypes: ['attack'], // 只有攻击型角色可以拥有此特性
            effect: (character, stats) => {
                if (stats.currentHp < stats.maxHp * 0.3) {
                    stats.attack *= 1.5;
                }
                return stats;
            }
        },
        assassin: {
            name: '刺客',
            description: '第一次攻击时伤害提高40%',
            type: 'passive', // 被动特性
            compatibleTypes: ['attack'], // 只有攻击型角色可以拥有
            effect: (character, damage, isFirstAttack) => {
                if (isFirstAttack) {
                    return damage * 1.4;
                }
                return damage;
            }
        },
        criticalStrike: {
            name: '暴击强化',
            description: '暴击几率提高15%，暴击伤害提高20%',
            type: 'passive', // 被动特性
            compatibleTypes: ['attack'],
            effect: (character, stats) => {
                stats.critRate = (stats.critRate || 0.05) + 0.15;
                stats.critDamage = (stats.critDamage || 0.5) + 0.2;
                return stats;
            }
        },

        // 防御型特性
        guardian: {
            name: '守护者',
            description: '队友生命值低于30%时，防御力提高40%',
            type: 'passive', // 被动特性
            compatibleTypes: ['defense'], // 只有防御型角色可以拥有此特性
            effect: (character, stats, team) => {
                if (team.some(c => c.currentHp < c.maxHp * 0.3 && c.id !== character.id)) {
                    stats.defense *= 1.4;
                }
                return stats;
            }
        },
        tank: {
            name: '坦克',
            description: '生命值提高25%，但速度降低10%',
            type: 'passive', // 被动特性
            compatibleTypes: ['defense'], // 只有防御型角色可以拥有
            effect: (character, stats) => {
                stats.hp *= 1.25;
                stats.speed *= 0.9;
                return stats;
            }
        },
        ironSkin: {
            name: '钢铁之肤',
            description: '减少受到的伤害15%',
            type: 'passive', // 被动特性
            compatibleTypes: ['defense'],
            effect: (character, damage) => {
                return damage * 0.85;
            }
        },

        // 特殊型特性
        elementalMastery: {
            name: '元素掌控',
            description: '属性相符时，造成的伤害提高25%',
            type: 'passive', // 被动特性
            compatibleTypes: ['attack', 'special'], // 攻击和特殊类型可以拥有
            effect: (character, damage, target) => {
                const attackerAttribute = character.attribute;
                const targetAttribute = target.attribute;

                if (this.attributes[attackerAttribute].strengths.includes(targetAttribute)) {
                    return damage * 1.25;
                }
                return damage;
            }
        },
        tactician: {
            name: '战术家',
            description: '战斗开始时，全队速度提高15%',
            type: 'passive', // 被动特性
            compatibleTypes: ['special', 'healing'], // 特殊和治疗类型可以拥有
            effect: (character, stats, team) => {
                if (Battle.isFirstTurn) {
                    team.forEach(member => {
                        member.currentStats.speed *= 1.15;
                    });
                }
                return stats;
            }
        },
        magicAmplification: {
            name: '魔法增幅',
            description: '特殊攻击伤害提高30%',
            type: 'passive', // 被动特性
            compatibleTypes: ['special'],
            effect: (character, damage, isSpecialAttack) => {
                if (isSpecialAttack) {
                    return damage * 1.3;
                }
                return damage;
            }
        },

        // 治疗型特性
        healer: {
            name: '治疗师',
            description: '治疗效果提高30%',
            type: 'passive', // 被动特性
            compatibleTypes: ['healing', 'defense'], // 治疗和防御类型可以拥有
            effect: (character, healAmount) => healAmount * 1.3
        },
        quickLearner: {
            name: '快速学习',
            description: '获得的经验值增加20%',
            type: 'passive', // 被动特性
            compatibleTypes: ['attack', 'special', 'defense', 'healing'], // 所有类型角色都可以拥有
            effect: (character, expGain) => expGain * 1.2
        },
        lifelink: {
            name: '生命链接',
            description: '治疗队友时，自身也恢复相当于治疗量20%的生命值',
            type: 'passive', // 被动特性
            compatibleTypes: ['healing'],
            effect: (character, healAmount, target) => {
                // 治疗目标
                target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount);
                // 自身也回复
                if (character.id !== target.id) {
                    character.currentHp = Math.min(character.maxHp, character.currentHp + (healAmount * 0.2));
                }
                return healAmount;
            }
        },

        // 主动特性（需要触发概率）
        counterAttack: {
            name: '反击',
            description: '受到攻击时，有30%几率反击，造成75%攻击力的伤害',
            type: 'active', // 主动特性
            triggerRate: 0.3, // 30%触发概率
            compatibleTypes: ['attack', 'defense'],
            effect: (character, attacker) => {
                // 计算反击伤害
                const damage = character.currentStats.attack * 0.75;
                attacker.currentHp -= damage;
                return {
                    triggered: true,
                    message: `${character.name} 反击了 ${attacker.name}，造成了 ${damage} 点伤害！`
                };
            }
        },
        criticalSurge: {
            name: '暴击涌动',
            description: '攻击时，有20%几率使下次攻击必定暴击',
            type: 'active', // 主动特性
            triggerRate: 0.2, // 20%触发概率
            compatibleTypes: ['attack', 'special'],
            effect: (character) => {
                character.nextAttackCritical = true;
                return {
                    triggered: true,
                    message: `${character.name} 的下次攻击将必定暴击！`
                };
            }
        },
        elementalBurst: {
            name: '元素爆发',
            description: '攻击时，有15%几率对目标造成额外150%的属性伤害',
            type: 'active', // 主动特性
            triggerRate: 0.15, // 15%触发概率
            compatibleTypes: ['special'],
            effect: (character, target, baseDamage) => {
                const extraDamage = baseDamage * 1.5;
                target.currentHp -= extraDamage;
                return {
                    triggered: true,
                    message: `${character.name} 触发了元素爆发，对 ${target.name} 造成额外 ${extraDamage} 点 ${this.attributes[character.attribute].name} 属性伤害！`
                };
            }
        },
        divineBlessing: {
            name: '神圣祝福',
            description: '治疗时，有25%几率使目标获得一个护盾，可抵挡相当于治疗量50%的伤害',
            type: 'active', // 主动特性
            triggerRate: 0.25, // 25%触发概率
            compatibleTypes: ['healing'],
            effect: (character, target, healAmount) => {
                target.shield = (target.shield || 0) + (healAmount * 0.5);
                return {
                    triggered: true,
                    message: `${character.name} 的神圣祝福为 ${target.name} 提供了 ${healAmount * 0.5} 点护盾！`
                };
            }
        }
    },

    // 角色稀有度定义
    rarities: {
        rare: {
            name: '稀有',
            color: '#2196f3',
            statMultiplier: 1.5,
            maxLevel: 60,
            maxTraits: 1 // 稀有角色最多1个特性
        },
        epic: {
            name: '史诗',
            color: '#9c27b0',
            statMultiplier: 1.8,
            maxLevel: 80,
            maxTraits: 2 // 史诗角色最多2个特性
        },
        legendary: {
            name: '传说',
            color: '#ff9800',
            statMultiplier: 2.2,
            maxLevel: 100,
            maxTraits: 3 // 传说角色最多3个特性
        }
    },

    // 可招募角色模板
    recruitableCharacters: [
        {
            id: 'recruit1',
            name: '剑士阿尔',
            type: 'attack',
            attribute: 'fire',
            traits: ['berserker'],
            rarity: 'rare',
            description: '曾是王国军队的一名普通士兵，善于使用剑术。'
        },
        {
            id: 'recruit2',
            name: '守卫贝尔',
            type: 'defense',
            attribute: 'earth',
            traits: ['guardian'],
            rarity: 'rare',
            description: '城堡的忠诚守卫，坚固如山的防御是他的骄傲。'
        },
        {
            id: 'recruit3',
            name: '法师凯拉',
            type: 'special',
            attribute: 'water',
            traits: ['elementalMastery'],
            rarity: 'rare',
            description: '来自北方的天才法师，擅长水系魔法。'
        },
        {
            id: 'recruit4',
            name: '牧师莉娜',
            type: 'healing',
            attribute: 'light',
            traits: ['quickLearner'],
            rarity: 'rare',
            description: '神殿的虔诚牧师，治愈之手可以抚平任何伤痕。'
        },
        {
            id: 'recruit5',
            name: '刺客达克',
            type: 'attack',
            attribute: 'dark',
            traits: ['berserker'],
            rarity: 'epic',
            description: '行走在阴影中的刺客，擅长精准的致命一击。'
        },
        {
            id: 'recruit6',
            name: '游侠艾拉',
            type: 'special',
            attribute: 'wind',
            traits: ['quickLearner'],
            rarity: 'epic',
            description: '森林中的守护者，弓箭精准如风，从不落空。'
        }
    ],

    // 传说角色模板 (固定的传说角色)
    legendaryCharacters: [
        {
            id: 'legend1',
            name: '龙骑士卡尔',
            type: 'attack',
            attribute: 'fire',
            traits: ['berserker', 'elementalMastery'],
            rarity: 'legendary',
            bonusMultiplier: 0, // 重复获取时的加成倍率，初始为0%
            description: '传说中的龙骑士，曾与远古巨龙并肩作战，拥有操控烈焰的能力。'
        },
        {
            id: 'legend2',
            name: '圣盾珊德拉',
            type: 'defense',
            attribute: 'light',
            traits: ['guardian', 'tank'],
            rarity: 'legendary',
            bonusMultiplier: 0,
            description: '神圣帝国的守护者，她的盾牌据说能抵挡任何邪恶力量。'
        },
        {
            id: 'legend3',
            name: '暗影大法师莫里斯',
            type: 'special',
            attribute: 'dark',
            traits: ['elementalMastery', 'tactician'],
            rarity: 'legendary',
            bonusMultiplier: 0,
            description: '掌握禁忌魔法的大法师，传闻他能操控时间和空间。'
        },
        {
            id: 'legend4',
            name: '生命之树爱丽丝',
            type: 'healing',
            attribute: 'earth',
            traits: ['healer', 'quickLearner'],
            rarity: 'legendary',
            bonusMultiplier: 0,
            description: '精灵族最后的祭司，与自然共鸣，拥有起死回生的神奇能力。'
        }
    ],

    // 职业系统定义
    jobs: {
        // 初始职业
        novice: {
            name: '见习者',
            description: '刚踏上冒险征程的新手',
            tier: 1, // 职业阶级，1-3
            baseStats: { hp: 100, attack: 10, defense: 10, speed: 10 },
            growthRates: { hp: 10, attack: 2, defense: 1, speed: 1 },
            unlockTraits: {
                1: 'quickLearner', // 1级解锁
                10: 'elementalMastery', // 10级解锁
                20: 'berserker' // 20级解锁
            },
            nextTierJobs: ['warrior', 'mage'] // 下一级可选职业
        },

        // 二阶职业 - 战士路线
        warrior: {
            name: '战士',
            description: '擅长近战的强力战斗者',
            tier: 2,
            baseStats: { hp: 150, attack: 15, defense: 12, speed: 8 },
            growthRates: { hp: 15, attack: 3, defense: 1.5, speed: 0.8 },
            unlockTraits: {
                1: 'berserker',
                10: 'tank',
                20: 'counterAttack'
            },
            nextTierJobs: ['berserker', 'paladin']
        },

        // 二阶职业 - 法师路线
        mage: {
            name: '法师',
            description: '掌握元素魔法的施法者',
            tier: 2,
            baseStats: { hp: 90, attack: 18, defense: 6, speed: 12 },
            growthRates: { hp: 8, attack: 4, defense: 0.6, speed: 1.5 },
            unlockTraits: {
                1: 'elementalMastery',
                10: 'magicAmplification',
                20: 'elementalBurst'
            },
            nextTierJobs: ['archmage', 'enchanter']
        },

        // 三阶职业 - 战士路线延伸
        berserker: {
            name: '狂战士',
            description: '不惧死亡的疯狂战士',
            tier: 3,
            baseStats: { hp: 180, attack: 25, defense: 10, speed: 12 },
            growthRates: { hp: 18, attack: 5, defense: 0.5, speed: 1.5 },
            unlockTraits: {
                1: 'berserker',
                10: 'criticalStrike',
                20: 'assassin'
            }
        },
        paladin: {
            name: '圣骑士',
            description: '兼具防御与治愈能力的战士',
            tier: 3,
            baseStats: { hp: 200, attack: 15, defense: 20, speed: 7 },
            growthRates: { hp: 20, attack: 2, defense: 4, speed: 0.7 },
            unlockTraits: {
                1: 'guardian',
                10: 'healer',
                20: 'divineBlessing'
            }
        },

        // 三阶职业 - 法师路线延伸
        archmage: {
            name: '大法师',
            description: '掌握毁灭性魔法的大师',
            tier: 3,
            baseStats: { hp: 100, attack: 30, defense: 8, speed: 15 },
            growthRates: { hp: 10, attack: 6, defense: 0.8, speed: 1.5 },
            unlockTraits: {
                1: 'elementalMastery',
                10: 'elementalBurst',
                20: 'criticalSurge'
            }
        },
        enchanter: {
            name: '附魔师',
            description: '专注于增益与辅助魔法的法师',
            tier: 3,
            baseStats: { hp: 120, attack: 20, defense: 10, speed: 18 },
            growthRates: { hp: 12, attack: 4, defense: 1, speed: 2 },
            unlockTraits: {
                1: 'tactician',
                10: 'quickLearner',
                20: 'magicAmplification'
            }
        }
    },

    /**
     * 初始化角色系统
     */
    init() {
        console.log('角色系统已初始化');

        // 确保有可招募的角色
        if (!this.recruitableCharacters || this.recruitableCharacters.length === 0) {
            this.recruitableCharacters = [
                {
                    id: 'recruit1',
                    name: '剑士阿尔',
                    type: 'attack',
                    attribute: 'fire',
                    traits: ['berserker'],
                    rarity: 'rare',
                    description: '曾是王国军队的一名普通士兵，善于使用剑术。'
                },
                {
                    id: 'recruit2',
                    name: '守卫贝尔',
                    type: 'defense',
                    attribute: 'earth',
                    traits: ['guardian'],
                    rarity: 'rare',
                    description: '城堡的忠诚守卫，坚固如山的防御是他的骄傲。'
                },
                {
                    id: 'recruit3',
                    name: '法师凯拉',
                    type: 'special',
                    attribute: 'water',
                    traits: ['elementalMastery'],
                    rarity: 'rare',
                    description: '来自北方的天才法师，擅长水系魔法。'
                },
                {
                    id: 'recruit4',
                    name: '牧师莉娜',
                    type: 'healing',
                    attribute: 'light',
                    traits: ['quickLearner'],
                    rarity: 'rare',
                    description: '神殿的虔诚牧师，治愈之手可以抚平任何伤痕。'
                }
            ];
        }

        // 确保有传说角色
        if (!this.legendaryCharacters || this.legendaryCharacters.length === 0) {
            this.legendaryCharacters = [
                {
                    id: 'legend1',
                    name: '炎龙战神',
                    type: 'attack',
                    attribute: 'fire',
                    traits: ['berserker', 'criticalStrike'],
                    rarity: 'legendary',
                    description: '传说中的战神，掌握着炎龙之力，能够摧毁一切敌人。',
                    bonusMultiplier: 0.2
                },
                {
                    id: 'legend2',
                    name: '圣光守护者',
                    type: 'defense',
                    attribute: 'light',
                    traits: ['guardian', 'divineProtection'],
                    rarity: 'legendary',
                    description: '被圣光祝福的守护者，拥有近乎不灭的防御力。',
                    bonusMultiplier: 0.2
                },
                {
                    id: 'legend3',
                    name: '深渊魔导师',
                    type: 'special',
                    attribute: 'dark',
                    traits: ['elementalMastery', 'magicAmplification'],
                    rarity: 'legendary',
                    description: '掌握深渊魔法的强大法师，能够操控时空。',
                    bonusMultiplier: 0.2
                }
            ];
        }
    },

    /**
     * 获取角色
     * @param {string} characterId - 角色ID
     * @returns {object|null} 角色对象
     */
    getCharacter(characterId) {
        console.log(`尝试获取角色: ${characterId}`);

        if (typeof window !== 'undefined' && window.log) {
            window.log(`尝试获取角色: ${characterId}`);
        }

        const character = this.characters[characterId] || null;

        if (!character) {
            console.log(`未找到角色: ${characterId}`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`未找到角色: ${characterId}`);
            }
        } else {
            console.log(`成功获取角色: ${character.name} (ID: ${characterId})`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`成功获取角色: ${character.name} (ID: ${characterId})`);
            }
        }

        return character;
    },

    /**
     * 获取所有角色
     * @returns {object} 所有角色对象
     */
    getAllCharacters() {
        return this.characters;
    },

    /**
     * 获取主角
     * @returns {object|null} 主角对象
     */
    getMainCharacter() {
        return Object.values(this.characters).find(character => character.isMainCharacter) || null;
    },

    /**
     * 创建新角色
     * @param {object} data - 角色数据
     * @returns {object} 新角色对象
     */
    createCharacter(data) {
        const type = data.type || 'attack';
        const attribute = data.attribute || 'fire';
        const typeData = this.types[type];
        const attributeData = this.attributes[attribute];

        if (!typeData || !attributeData) return null;

        const characterId = data.id || `char_${Date.now()}`;

        const baseStats = {...typeData.baseStats};
        const rarity = data.rarity || 'rare'; // 默认稀有度为rare
        const rarityData = this.rarities[rarity] || this.rarities.rare;

        // 初始特性，根据稀有度限制特性数量
        let traits = (data.traits || []).slice(0, rarityData.maxTraits);

        // 对于主角，可以有特殊处理
        const isMainCharacter = data.isMainCharacter || false;
        if (isMainCharacter) {
            // 主角可以拥有4个特性，但第4个必须来自不同的职业系统
            traits = (data.traits || []).slice(0, 4);
        }

        // 创建角色对象
        const character = {
            id: characterId,
            name: data.name || '未命名',
            type: type,
            attribute: attribute,
            level: data.level || 1,
            exp: data.exp || 0,
            nextLevelExp: this.calculateNextLevelExp(data.level || 1),
            traits: traits,
            availableTraits: data.availableTraits || [], // 可供选择的特性池
            unlockedTraits: data.unlockedTraits || [], // 已解锁但未装备的特性
            skills: data.skills || [],
            baseStats: baseStats,
            currentStats: {...baseStats},
            growthRates: {...typeData.growthRates},
            isMainCharacter: isMainCharacter,
            isRecruited: data.isRecruited || false,
            rarity: rarity,
            maxLevel: rarityData.maxLevel, // 设置角色等级上限
            maxTraits: isMainCharacter ? 4 : rarityData.maxTraits, // 主角特殊处理
            // 战斗相关的临时状态
            nextAttackCritical: false, // 是否必定暴击
            shield: 0, // 护盾值
            // 传说角色的属性加成
            bonusMultiplier: data.bonusMultiplier || 0,
            // 记录第一个特性和第二个特性的解锁等级
            traitUnlockLevels: {
                second: 65, // 65级解锁第二个特性
                third: 90   // 90级解锁第三个特性
            },
            // 记录战斗表现
            stats: {
                totalDamage: 0,
                totalHealing: 0,
                mvpCount: 0,
                battlesParticipated: 0
            },
            // 职业系统（主角专用）
            job: isMainCharacter ? (data.job || {
                current: 'novice',  // 当前职业
                level: 1,           // 职业等级
                history: ['novice'], // 历史职业
                jobTraits: {}       // 各职业学到的特性
            }) : null
        };

        // 如果是传说角色，应用bonusMultiplier
        if (character.rarity === 'legendary' && character.bonusMultiplier > 0) {
            // 应用全属性加成
            const multiplier = 1 + character.bonusMultiplier;
            for (const stat in character.baseStats) {
                character.baseStats[stat] = Math.floor(character.baseStats[stat] * multiplier);
                character.currentStats[stat] = character.baseStats[stat];
            }
        }

        return character;
    },

    /**
     * 添加角色
     * @param {object} characterData - 角色数据
     */
    addCharacter(characterData) {
        const character = this.createCharacter(characterData);
        if (!character) return null;

        this.characters[character.id] = character;

        // 如果是招募的角色，增加统计
        if (character.isRecruited) {
            Game.stats.charactersRecruited++;
        }

        console.log(`添加角色: ${character.name}`);
        return character.id;
    },

    /**
     * 移除角色
     * @param {string} characterId - 角色ID
     * @returns {boolean} 是否移除成功
     */
    removeCharacter(characterId) {
        const character = this.getCharacter(characterId);
        if (!character) return false;

        // 检查是否为主角
        if (character.isMainCharacter) {
            UI.showMessage('主角不能被移除');
            return false;
        }

        // 检查是否在队伍中
        const teams = Team.getAllTeams();
        for (const team of Object.values(teams)) {
            if (team.members.includes(characterId)) {
                UI.showMessage(`${character.name} 仍在队伍 ${team.name} 中，请先移除`);
                return false;
            }
        }

        delete this.characters[characterId];
        console.log(`移除角色: ${character.name}`);
        return true;
    },

    /**
     * 计算下一级所需经验
     * @param {number} level - 当前等级
     * @returns {number} 下一级所需经验值
     */
    calculateNextLevelExp(level) {
        return Math.floor(100 * Math.pow(1.1, level - 1));
    },

    /**
     * 角色升级
     * @param {string} characterId - 角色ID
     * @param {number} levels - 升级数量
     */
    levelUpCharacter(characterId, levels = 1) {
        const character = this.getCharacter(characterId);
        if (!character) return;

        let newTraitsUnlocked = false;

        for (let i = 0; i < levels; i++) {
            // 检查是否已达到最高等级
            if (character.level >= character.maxLevel) {
                UI.showMessage(`${character.name} 已达到最高等级 ${character.maxLevel}`);
                break;
            }

            const oldLevel = character.level;
            character.level++;

            // 更新属性 - 根据需求，只有HP和攻击力会随等级提升
            character.baseStats.hp += character.growthRates.hp;
            character.baseStats.attack += character.growthRates.attack;
            character.currentStats.hp = character.baseStats.hp;
            character.currentStats.attack = character.baseStats.attack;

            // 检查是否解锁新特性
            if (!character.isMainCharacter) { // 非主角的特性解锁机制
                // 稀有角色最多1个特性，史诗可以有2个，传说可以有3个
                if (character.level >= character.traitUnlockLevels.second &&
                    character.traits.length < 2 &&
                    character.rarity !== 'rare') {
                    newTraitsUnlocked = true;
                    UI.showNotification(`${character.name} 达到65级，可以装备第二个特性！`);
                }

                if (character.level >= character.traitUnlockLevels.third &&
                    character.traits.length < 3 &&
                    character.rarity === 'legendary') {
                    newTraitsUnlocked = true;
                    UI.showNotification(`${character.name} 达到90级，可以装备第三个特性！`);
                }
            } else {
                // 主角的职业特性解锁 - 根据职业等级解锁
                this.checkJobTraitUnlocks(characterId);
            }

            // 更新下一级所需经验
            character.nextLevelExp = this.calculateNextLevelExp(character.level);

            console.log(`${character.name} 升级到 ${character.level} 级`);
        }

        // 如果解锁了新特性，提示玩家
        if (newTraitsUnlocked) {
            UI.showMessage(`${character.name} 解锁了新的特性槽位，可以在角色界面配置特性。`);
        }

        // 如果是主角，同步更新主角等级
        if (character.isMainCharacter) {
            Game.state.playerLevel = character.level;
        }
    },

    /**
     * 检查主角职业特性解锁
     * @param {string} characterId - 角色ID
     */
    checkJobTraitUnlocks(characterId) {
        const character = this.getCharacter(characterId);
        if (!character || !character.isMainCharacter || !character.job) return;

        const jobLevel = character.job.level;
        const currentJob = character.job.current;

        // 职业等级1/10/20解锁特性
        if (jobLevel === 1 || jobLevel === 10 || jobLevel === 20) {
            // 这里需要根据职业系统设计具体实现
            // 模拟解锁特性
            const unlockedTrait = `${currentJob}_trait_${jobLevel === 1 ? 'basic' : jobLevel === 10 ? 'advanced' : 'master'}`;

            // 将解锁的特性添加到职业特性库
            if (!character.job.jobTraits[currentJob]) {
                character.job.jobTraits[currentJob] = [];
            }

            character.job.jobTraits[currentJob].push(unlockedTrait);
            character.unlockedTraits.push(unlockedTrait);

            UI.showNotification(`${character.name} 的 ${currentJob} 职业等级达到 ${jobLevel}，解锁了新特性: ${unlockedTrait}！`);
        }
    },

    /**
     * 为角色装备特性
     * @param {string} characterId - 角色ID
     * @param {string} traitId - 特性ID
     * @param {number} slotIndex - 特性槽位索引
     * @returns {boolean} 是否装备成功
     */
    equipTrait(characterId, traitId, slotIndex) {
        const character = this.getCharacter(characterId);
        if (!character) return false;

        // 检查特性是否存在
        const trait = this.traits[traitId];
        if (!trait) return false;

        // 检查特性是否兼容该角色类型
        if (!trait.compatibleTypes.includes(character.type) && !character.isMainCharacter) {
            UI.showMessage(`${character.name} 不能装备 ${trait.name} 特性，类型不兼容。`);
            return false;
        }

        // 对于主角的特殊限制：第4个特性必须来自不同的职业系统
        if (character.isMainCharacter && slotIndex === 3) {
            // 这里需要根据职业系统设计具体实现
            // 检查该特性是否来自非当前职业体系
            const currentJobSystem = character.job.current.split('_')[0]; // 假设职业名称格式为"system_jobname"
            const traitJobSystem = traitId.split('_')[0]; // 假设特性ID格式类似

            if (currentJobSystem === traitJobSystem) {
                UI.showMessage(`第4个特性槽位必须装备来自不同职业系统的特性。`);
                return false;
            }
        }

        // 检查角色的特性解锁状态
        if (!character.isMainCharacter) {
            // 非主角根据等级限制特性数量
            if (slotIndex === 1 && character.level < character.traitUnlockLevels.second) {
                UI.showMessage(`需要角色达到65级才能装备第二个特性。`);
                return false;
            }

            if (slotIndex === 2 && character.level < character.traitUnlockLevels.third) {
                UI.showMessage(`需要角色达到90级才能装备第三个特性。`);
                return false;
            }

            // 检查稀有度限制
            if (slotIndex >= character.maxTraits) {
                UI.showMessage(`${character.name} 的稀有度限制了可装备的特性数量。`);
                return false;
            }
        }

        // 确保特性数组有足够空间
        while (character.traits.length <= slotIndex) {
            character.traits.push(null);
        }

        // 装备特性
        character.traits[slotIndex] = traitId;

        console.log(`${character.name} 装备了特性 ${trait.name} 到槽位 ${slotIndex + 1}`);
        UI.showNotification(`${character.name} 装备了特性: ${trait.name}`);

        return true;
    },

    /**
     * 移除角色的特性
     * @param {string} characterId - 角色ID
     * @param {number} slotIndex - 特性槽位索引
     * @returns {boolean} 是否移除成功
     */
    unequipTrait(characterId, slotIndex) {
        const character = this.getCharacter(characterId);
        if (!character || slotIndex >= character.traits.length || !character.traits[slotIndex]) {
            return false;
        }

        const traitId = character.traits[slotIndex];
        const trait = this.traits[traitId];

        character.traits[slotIndex] = null;
        // 调整数组，移除末尾的空值
        while (character.traits.length > 0 && character.traits[character.traits.length - 1] === null) {
            character.traits.pop();
        }

        console.log(`从 ${character.name} 移除了特性 ${trait.name}`);
        UI.showNotification(`从 ${character.name} 移除了特性: ${trait.name}`);

        return true;
    },

    /**
     * 添加经验值
     * @param {string} characterId - 角色ID
     * @param {number} expAmount - 经验值数量
     */
    addExperience(characterId, expAmount) {
        const character = this.getCharacter(characterId);
        if (!character) return;

        // 应用特性加成
        if (character.traits.includes('quickLearner')) {
            expAmount = this.traits.quickLearner.effect(character, expAmount);
        }

        character.exp += expAmount;

        // 检查是否可以升级
        while (character.exp >= character.nextLevelExp) {
            character.exp -= character.nextLevelExp;
            this.levelUpCharacter(characterId);
        }
    },

    /**
     * 招募角色
     * @param {string} templateId - 角色模板ID
     * @returns {string|null} 新角色ID或null
     */
    recruitCharacter(templateId) {
        // 检查是否是传说角色
        const isLegendary = templateId.startsWith('legend');

        let template;
        if (isLegendary) {
            template = this.legendaryCharacters.find(c => c.id === templateId);
        } else {
            template = this.recruitableCharacters.find(c => c.id === templateId);
        }

        if (!template) return null;

        // 检查传说角色是否已招募过
        if (isLegendary) {
            const existingLegendary = Object.values(this.characters).find(
                char => char.id.includes(template.id) && char.rarity === 'legendary'
            );

            if (existingLegendary) {
                // 已有该传说角色，增加其属性加成
                if (existingLegendary.bonusMultiplier < 0.2) { // 加成上限20%
                    existingLegendary.bonusMultiplier += 0.01; // 每次加1%

                    // 更新基础属性
                    for (const stat in existingLegendary.baseStats) {
                        const baseValue = this.types[existingLegendary.type].baseStats[stat] || 0;
                        existingLegendary.baseStats[stat] = Math.floor(
                            baseValue * (1 + existingLegendary.bonusMultiplier)
                        );
                        existingLegendary.currentStats[stat] = existingLegendary.baseStats[stat];
                    }

                    UI.showNotification(`已增强 ${existingLegendary.name} 的属性 (加成: ${Math.floor(existingLegendary.bonusMultiplier * 100)}%)`);
                } else {
                    // 已达到20%上限，直接加固定值
                    for (const stat in existingLegendary.baseStats) {
                        existingLegendary.baseStats[stat] += 1;
                        existingLegendary.currentStats[stat] += 1;
                    }

                    UI.showNotification(`已增强 ${existingLegendary.name} 的全部属性 +1`);
                }

                return existingLegendary.id; // 返回现有角色ID
            }
        }

        // 创建新角色ID
        const uniqueId = `${template.id}_${Date.now()}`;

        // 基于模板创建角色
        const characterData = {
            ...template,
            id: uniqueId,
            level: 1,
            exp: 0,
            isRecruited: true,
            bonusMultiplier: template.bonusMultiplier || 0
        };

        // 添加角色
        const newCharacterId = this.addCharacter(characterData);
        if (newCharacterId) {
            UI.showNotification(`成功招募 ${template.name}`);
            Game.stats.charactersRecruited++;
        }

        return newCharacterId;
    },

    /**
     * 获取角色招募成本
     * @param {object} characterTemplate - 角色模板
     * @returns {number} 招募成本
     */
    getRecruitmentCost(characterTemplate) {
        const baseCost = {
            'common': 500,
            'uncommon': 1000,
            'rare': 2000,
            'epic': 5000,
            'legendary': 10000
        };

        return baseCost[characterTemplate.rarity] || 2000;
    },

    /**
     * 生成随机可招募角色
     * @param {number} count - 生成数量
     * @returns {array} 可招募角色数组
     */
    generateRandomRecruitables(count = 3) {
        const result = [];

        // 随机决定是否有传说角色出现（概率较低）
        const hasLegendary = Math.random() < 0.05; // 5%概率出现传说角色

        if (hasLegendary && count > 0) {
            // 随机选择一个传说角色
            const availableLegendaries = this.legendaryCharacters || [];
            if (availableLegendaries.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableLegendaries.length);
                const selected = availableLegendaries[randomIndex];

                // 复制并添加唯一标识
                const copy = {...selected};
                copy.id = `legend_${Date.now()}`;
                result.push(copy);
                count--; // 减少一个需要生成的角色数量
            }
        }

        // 生成其余角色
        for (let i = 0; i < count; i++) {
            // 决定稀有度
            let rarity;
            const roll = Math.random();
            if (roll < 0.60) { // 60%概率
                rarity = 'rare';
            } else if (roll < 0.90) { // 30%概率
                rarity = 'epic';
            } else { // 10%概率
                rarity = 'legendary';
            }

            // 随机选择角色类型
            const types = Object.keys(this.types || {attack: {}, defense: {}, special: {}, healing: {}});
            const randomType = types[Math.floor(Math.random() * types.length)];

            // 随机选择属性
            const attributes = Object.keys(this.attributes || {fire: {}, water: {}, earth: {}, wind: {}, light: {}, dark: {}});
            const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];

            // 随机名称
            const firstNames = ['艾', '布', '克', '德', '埃', '弗', '格', '霍', '伊', '贾', '凯', '莱', '米', '尼', '奥', '佩', '奎', '罗', '萨', '泰'];
            const lastNames = ['尔', '恩', '琳', '克', '德', '斯', '顿', '森', '拉', '特', '维', '纳', '洛', '伯', '恩', '托', '根', '威', '尔', '泽'];
            const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const name = `${randomFirstName}${randomLastName}`;

            // 根据角色类型生成描述
            let description;
            switch (randomType) {
                case 'attack':
                    description = '一位技艺高超的战士，在战场上所向披靡。';
                    break;
                case 'defense':
                    description = '坚固的防御者，能够承受巨大的伤害而不退缩。';
                    break;
                case 'special':
                    description = '神秘的施法者，精通各种强大的魔法和特殊能力。';
                    break;
                case 'healing':
                    description = '具有治愈之手的医者，能在危急时刻救助队友。';
                    break;
                default:
                    description = '一位神秘的冒险者，背景不为人知。';
            }

            // 创建角色
            const character = {
                id: `generated_${Date.now()}_${i}`,
                name: name,
                type: randomType,
                attribute: randomAttribute,
                rarity: rarity,
                description: description
            };

            result.push(character);
        }

        return result;
    },

    /**
     * 获取角色完整状态（包括装备加成）
     * @param {string} characterId - 角色ID
     * @param {string} teamId - 队伍ID
     * @returns {object} 角色完整状态
     */
    getCharacterFullStats(characterId, teamId) {
        const character = this.getCharacter(characterId);
        if (!character) return null;

        const team = Team.getTeam(teamId);
        if (!team) return character.currentStats;

        // 获取武器盘
        const weaponBoard = Weapon.getWeaponBoard(team.weaponBoardId);
        if (!weaponBoard) return character.currentStats;

        // 开始计算完整状态
        const fullStats = {...character.currentStats};

        // 应用武器盘加成
        const boardStats = Weapon.calculateWeaponBoardStats(team.weaponBoardId);

        // 合并基本属性
        for (const [stat, value] of Object.entries(boardStats.base)) {
            fullStats[stat] += value;
        }

        // 应用百分比加成
        for (const [stat, value] of Object.entries(boardStats.percentage)) {
            fullStats[stat] *= (1 + value);
        }

        // 应用特性效果
        for (const traitId of character.traits) {
            const trait = this.traits[traitId];
            if (trait && trait.effect) {
                fullStats = trait.effect(character, fullStats, team.members.map(id => this.getCharacter(id)));
            }
        }

        // 确保属性为正数并取整
        for (const stat in fullStats) {
            fullStats[stat] = Math.max(0, Math.floor(fullStats[stat]));
        }

        return fullStats;
    },

    /**
     * 加载角色数据
     * @param {object} data - 保存的角色数据
     */
    loadCharacters(data) {
        if (!data) return;
        this.characters = {...data};
    },

    /**
     * 重置角色系统
     */
    reset() {
        console.log('完全重置角色系统');
        // 完全清空角色数据
        this.characters = {};

        // 确保主角被清除
        const mainChar = this.getMainCharacter();
        if (mainChar) {
            console.log('警告：主角仍然存在，强制清除');
            this.characters = {};
        }

        console.log('角色系统重置完成，当前角色数量：0');
        this.init();
    },

    /**
     * 获取与角色类型兼容的特性
     * @param {string} characterType - 角色类型
     * @returns {array} 兼容的特性数组
     */
    getCompatibleTraits(characterType) {
        const compatibleTraits = [];

        for (const [traitId, trait] of Object.entries(this.traits)) {
            if (trait.compatibleTypes && trait.compatibleTypes.includes(characterType)) {
                compatibleTraits.push(traitId);
            }
        }

        return compatibleTraits;
    },

    /**
     * 生成随机可招募角色
     * @param {number} count - 生成数量
     * @returns {array} 可招募角色数组
     */
    generateRandomRecruitables(count = 3) {
        const result = [];

        // 随机决定是否有传说角色出现（概率较低）
        const hasLegendary = Math.random() < 0.05; // 5%概率出现传说角色

        if (hasLegendary && count > 0) {
            // 随机选择一个传说角色
            const availableLegendaries = [...this.legendaryCharacters];
            const randomIndex = Math.floor(Math.random() * availableLegendaries.length);
            const selected = availableLegendaries[randomIndex];

            // 复制并添加唯一标识
            const copy = {...selected};
            result.push(copy);
            count--; // 减少一个需要生成的角色数量
        }

        // 生成其余角色
        for (let i = 0; i < count; i++) {
            // 决定稀有度
            let rarity;
            const roll = Math.random();
            if (roll < 0.75) { // 75%概率
                rarity = 'rare';
            } else if (roll < 0.95) { // 20%概率
                rarity = 'epic';
            } else { // 5%概率(保底)，确保一定比例的传说
                rarity = 'legendary';

                // 如果是传说角色，随机选择一个传说角色模板
                const legendIndex = Math.floor(Math.random() * this.legendaryCharacters.length);
                const legendTemplate = this.legendaryCharacters[legendIndex];

                // 复制模板并调整ID
                const legendCharacter = {
                    ...legendTemplate,
                    id: `generated_legend_${Date.now()}_${i}`
                };

                result.push(legendCharacter);
                continue; // 跳过其余的角色创建步骤
            }

            // 随机选择角色类型
            const types = Object.keys(this.types);
            const randomType = types[Math.floor(Math.random() * types.length)];

            // 随机选择属性
            const attributes = Object.keys(this.attributes);
            const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];

            // 获取与类型兼容的特性
            const compatibleTraits = this.getCompatibleTraits(randomType);

            // 随机选择一个特性
            const randomTrait = compatibleTraits[Math.floor(Math.random() * compatibleTraits.length)];

            // 随机名称
            const firstNames = ['艾', '布', '克', '德', '埃', '弗', '格', '霍', '伊', '贾', '凯', '莱', '米', '尼', '奥', '佩', '奎', '罗', '萨', '泰'];
            const lastNames = ['尔', '恩', '琳', '克', '德', '斯', '顿', '森', '拉', '特', '维', '纳', '洛', '伯', '恩', '托', '根', '威', '尔', '泽'];
            const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const name = `${randomFirstName}${randomLastName}`;

            // 根据角色类型生成描述
            let description;
            switch (randomType) {
                case 'attack':
                    description = '一位技艺高超的战士，在战场上所向披靡。';
                    break;
                case 'defense':
                    description = '坚固的防御者，能够承受巨大的伤害而不退缩。';
                    break;
                case 'special':
                    description = '神秘的施法者，精通各种强大的魔法和特殊能力。';
                    break;
                case 'healing':
                    description = '具有治愈之手的医者，能在危急时刻救助队友。';
                    break;
                default:
                    description = '一位神秘的冒险者，背景不为人知。';
            }

            // 创建角色
            const character = {
                id: `generated_${Date.now()}_${i}`,
                name: name,
                type: randomType,
                attribute: randomAttribute,
                traits: [randomTrait],
                rarity: rarity,
                description: description
            };

            result.push(character);
        }

        return result;
    },

    /**
     * 计算角色对目标造成的伤害
     * @param {string} attackerId - 攻击者ID
     * @param {string} targetId - 目标ID
     * @param {boolean} isSpecialAttack - 是否为特殊攻击
     * @param {object} options - 额外选项
     * @returns {object} 伤害信息
     */
    calculateDamage(attackerId, targetId, isSpecialAttack = false, options = {}) {
        console.log(`===== calculateDamage 开始 =====`);
        console.log(`攻击者ID: ${attackerId}, 目标ID: ${targetId}`);

        if (typeof window !== 'undefined' && window.log) {
            window.log(`===== calculateDamage 开始 =====`);
            window.log(`攻击者ID: ${attackerId}, 目标ID: ${targetId}`);
        }

        const attacker = this.getCharacter(attackerId);
        const target = this.getCharacter(targetId);

        console.log(`攻击者对象: ${attacker ? '存在' : '不存在'}`);
        console.log(`目标对象: ${target ? '存在' : '不存在'}`);

        if (typeof window !== 'undefined' && window.log) {
            window.log(`攻击者对象: ${attacker ? '存在' : '不存在'}`);
            window.log(`目标对象: ${target ? '存在' : '不存在'}`);
        }

        if (!attacker || !target) {
            console.log(`提前返回0伤害: 攻击者或目标不存在`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`提前返回0伤害: 攻击者或目标不存在`);
            }
            return { damage: 0, isCritical: false };
        }

        // 获取攻击者和防御者的属性
        const attackerAttribute = attacker.attribute;
        const targetAttribute = target.attribute;

        // 检查是否是首次攻击
        const isFirstAttack = !attacker.hasAttacked;
        if (!options.isMultiAttack) { // 只有在非多重攻击时才标记为已攻击
            attacker.hasAttacked = true;
        }

        // 获取攻击者的BUFF效果
        const attackerBuffs = attacker.buffs || [];

        // 基础攻击力计算
        let attackPower = this.calculateAttackPower(attacker);

        // 应用随机波动 (0.95~1.05)
        const randomFactor = 0.95 + (Math.random() * 0.1);

        // 计算造成伤害 (根据README中的公式)
        // 造成伤害=目标攻击力*(0.95~1.05随机值)*（1+属性克制百分比）*（如果暴击*1.5）*（1+暴击伤害增加%，如果触发暴击）*（1+对被攻击目标属性伤害提升%）
        let damage = attackPower * randomFactor;

        // 应用属性克制
        let attributeBonus = 0;
        if (this.attributes[attackerAttribute] && this.attributes[attackerAttribute].strengths &&
            this.attributes[attackerAttribute].strengths.includes(targetAttribute)) {
            attributeBonus = 0.5; // 有利属性攻击: 造成约1.5倍的伤害
        } else if (this.attributes[targetAttribute] && this.attributes[targetAttribute].strengths &&
                  this.attributes[targetAttribute].strengths.includes(attackerAttribute)) {
            attributeBonus = -0.25; // 不利属性攻击: 造成约0.75倍（即减少25%）的伤害
        }
        damage *= (1 + attributeBonus);

        // 检查暴击
        let isCritical = false;

        // 如果options.skipCritical为true，则跳过暴击计算
        if (!options.skipCritical) {
            // 获取暴击率加成BUFF
            const critRateBuffs = attackerBuffs.filter(buff => buff.type === 'critRate');
            let critRateBonus = 0;

            for (const buff of critRateBuffs) {
                critRateBonus += buff.value;
            }

            // 计算最终暴击率
            const finalCritRate = (attacker.currentStats.critRate || 0.05) + critRateBonus;

            // 如果有必定暴击效果或随机触发
            if (attacker.nextAttackCritical || Math.random() < finalCritRate) {
                isCritical = true;

                // 基础暴击伤害倍率1.5
                let critMultiplier = 1.5;

                // 获取暴击伤害加成BUFF
                const critDamageBuffs = attackerBuffs.filter(buff => buff.type === 'critDamage');
                let critDamageBonus = 0;

                for (const buff of critDamageBuffs) {
                    critDamageBonus += buff.value;
                }

                // 应用暴击伤害加成
                critMultiplier += critDamageBonus;
                damage *= critMultiplier;

                // 重置必定暴击状态
                if (!options.isMultiAttack) { // 只有在非多重攻击时才重置
                    attacker.nextAttackCritical = false;
                }

                console.log(`触发暴击！伤害 x${critMultiplier.toFixed(2)}`);
                if (typeof window !== 'undefined' && window.log) {
                    window.log(`触发暴击！伤害 x${critMultiplier.toFixed(2)}`);
                }
            }
        } else {
            console.log(`跳过暴击计算（技能伤害）`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`跳过暴击计算（技能伤害）`);
            }
        }

        // 应用对特定属性伤害提升
        const attributeDamageBonus = attacker.currentStats.attributeDamageBonus?.[targetAttribute] || 0;
        damage *= (1 + attributeDamageBonus);

        // 应用特性效果
        for (const traitId of attacker.traits) {
            if (!traitId) continue;
            const trait = this.traits[traitId];
            if (trait && trait.type === 'passive') {
                // 根据特性类型应用不同效果
                if (trait.effect && (isFirstAttack && traitId === 'assassin')) {
                    damage = trait.effect(attacker, damage, true);
                } else if (trait.effect && (isSpecialAttack && traitId === 'magicAmplification')) {
                    damage = trait.effect(attacker, damage, true);
                } else if (trait.effect && traitId === 'elementalMastery') {
                    damage = trait.effect(attacker, damage, target);
                }
            }
        }

        // 计算受到伤害 (根据README中的公式)
        // 受到伤害= 造成伤害 / （1+防御力%）*（1-伤害降低%）*（1-属性伤害减轻%）

        // 计算目标的防御力 
        let targetDefense = target.currentStats.defense;

        console.log(`目标 ${target.name} 的原始防御力: ${targetDefense}`);
        if (typeof window !== 'undefined' && window.log) {
            window.log(`目标 ${target.name} 的原始防御力: ${targetDefense}`);
        }


        // 应用防御力下降BUFF
        const defenseDownBuffs = attackerBuffs.filter(buff => buff.type === 'defenseDown');
        let defenseDownPercentage = 0;

        for (const buff of defenseDownBuffs) {
            defenseDownPercentage += buff.value;
        }

        // 防御下降上限为50%
        defenseDownPercentage = Math.min(defenseDownPercentage, 0.5);

        if (defenseDownPercentage > 0) {
            console.log(`应用防御力下降BUFF: -${(defenseDownPercentage * 100).toFixed(1)}%`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`应用防御力下降BUFF: -${(defenseDownPercentage * 100).toFixed(1)}%`);
            }
        }

        targetDefense *= (1 - defenseDownPercentage);

        console.log(`最终防御力: ${targetDefense} (${(targetDefense * 100).toFixed(1)}%)`);
        if (typeof window !== 'undefined' && window.log) {
            window.log(`最终防御力: ${targetDefense} (${(targetDefense * 100).toFixed(1)}%)`);
        }

        // 应用防御力减伤
        const damageBeforeDefense = damage;
        damage = damage / (1 + targetDefense);

        console.log(`防御减伤: ${damageBeforeDefense} -> ${damage} (减少了 ${(damageBeforeDefense - damage).toFixed(1)} 点伤害)`);
        if (typeof window !== 'undefined' && window.log) {
            window.log(`防御减伤: ${damageBeforeDefense} -> ${damage} (减少了 ${(damageBeforeDefense - damage).toFixed(1)} 点伤害)`);
        }

        // 应用属性伤害减轻
        const attributeDamageReduction = target.currentStats.attributeResistance?.[attackerAttribute] || 0;
        damage *= (1 - attributeDamageReduction);

        // 应用目标的防御特性
        for (const traitId of target.traits) {
            if (!traitId) continue;
            const trait = this.traits[traitId];
            if (trait && trait.type === 'passive' && traitId === 'ironSkin') {
                damage = trait.effect(target, damage);
            }
        }

        // 应用目标的伤害减免BUFF
        const targetBuffs = target.buffs || [];
        const damageReductionBuffs = targetBuffs.filter(buff => buff.type === 'damageReduction');
        let damageReductionPercentage = 0;

        for (const buff of damageReductionBuffs) {
            damageReductionPercentage += buff.value;
        }

        damage *= (1 - damageReductionPercentage);

        // 应用护盾减伤
        if (target.shield > 0) {
            if (target.shield >= damage) {
                target.shield -= damage;
                damage = 0;
            } else {
                damage -= target.shield;
                target.shield = 0;
            }
        }

        // 应用伤害上限(99999)
        damage = Math.min(damage, 99999);

        // 取整
        damage = Math.floor(damage);

        console.log(`最终伤害(取整): ${damage}`);
        if (typeof window !== 'undefined' && window.log) {
            window.log(`最终伤害(取整): ${damage}`);
        }

        // 计入角色伤害统计
        if (!options.skipStats) {
            attacker.stats = attacker.stats || { totalDamage: 0, totalHealing: 0 };
            attacker.stats.totalDamage += damage;
        }

        console.log(`===== calculateDamage 结束 =====`);
        if (typeof window !== 'undefined' && window.log) {
            window.log(`===== calculateDamage 结束 =====`);
        }

        return {
            damage,
            isCritical,
            attributeBonus,
            isFirstAttack,
            isMultiAttack: options.isMultiAttack || false
        };
    },

    /**
     * 计算角色的攻击力
     * @param {object} character - 角色对象
     * @returns {number} 计算后的攻击力
     */
    calculateAttackPower(character) {
        console.log(`===== calculateAttackPower 开始 =====`);
        console.log(`角色: ${character ? character.name : '未知'}`);

        if (typeof window !== 'undefined' && window.log) {
            window.log(`===== calculateAttackPower 开始 =====`);
            window.log(`角色: ${character ? character.name : '未知'}`);
        }

        if (!character) {
            console.log(`提前返回0攻击力: 角色不存在`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`提前返回0攻击力: 角色不存在`);
            }
            return 0;
        }

        if (!character.currentStats) {
            console.log(`提前返回0攻击力: 角色当前状态不存在`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`提前返回0攻击力: 角色当前状态不存在`);
            }
            return 0;
        }

        // 基础攻击力
        let attackPower = character.currentStats.attack;
        console.log(`初始攻击力: ${attackPower}`);
        if (typeof window !== 'undefined' && window.log) {
            window.log(`初始攻击力: ${attackPower}`);
        }

        // 获取角色的BUFF效果
        const buffs = character.buffs || [];

        // 应用攻击力增加BUFF
        const attackBuffs = buffs.filter(buff => buff.type === 'attackUp');
        let attackBuffPercentage = 0;

        for (const buff of attackBuffs) {
            attackBuffPercentage += buff.value;
        }

        // 应用攻击力降低BUFF
        const attackDownBuffs = buffs.filter(buff => buff.type === 'attackDown');
        let attackDownPercentage = 0;

        for (const buff of attackDownBuffs) {
            attackDownPercentage += buff.value;
        }

        // 限制总攻击力降低不超过50%
        attackDownPercentage = Math.min(attackDownPercentage, 0.5);

        // 根据README中的公式计算攻击力
        // 攻击力=角色自身攻击力*（1+攻击力%提升值）*（1-攻击力%降低值）*（1+浑身BUFF）*（1+背水BUFF）*（1+攻击力EX%提升值）+ 伤害上升总合

        // 应用攻击力%提升值和降低值
        attackPower *= (1 + attackBuffPercentage - attackDownPercentage);

        // 获取角色的血量百分比
        const hpPercentage = character.currentStats.hp / character.currentStats.maxHp;

        // 检查是否有浑身BUFF
        const hunshenBuffs = buffs.filter(buff => buff.type === 'hunshen');
        if (hunshenBuffs.length > 0) {
            // 浑身效果：100%血攻击力上升50%，1%血上升5%
            const hunshenBuff = 0.05 + (hpPercentage * 0.45); // 血量越高加成越大
            attackPower *= (1 + hunshenBuff);

            console.log(`应用浑身BUFF: +${(hunshenBuff * 100).toFixed(1)}% (血量: ${(hpPercentage * 100).toFixed(1)}%)`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`应用浑身BUFF: +${(hunshenBuff * 100).toFixed(1)}% (血量: ${(hpPercentage * 100).toFixed(1)}%)`);
            }
        }

        // 检查是否有背水BUFF
        const beishuiBuffs = buffs.filter(buff => buff.type === 'beishui');
        if (beishuiBuffs.length > 0) {
            // 背水效果：1%血攻击力上升50%，100%血上升5%
            const beishuiBuff = 0.5 - (hpPercentage * 0.45); // 血量越低加成越大
            attackPower *= (1 + beishuiBuff);

            console.log(`应用背水BUFF: +${(beishuiBuff * 100).toFixed(1)}% (血量: ${(hpPercentage * 100).toFixed(1)}%)`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`应用背水BUFF: +${(beishuiBuff * 100).toFixed(1)}% (血量: ${(hpPercentage * 100).toFixed(1)}%)`);
            }
        }

        // 应用攻击力EX加成 (来自特性、武器等)
        let attackExBonus = 0;

        // 从特性中获取攻击力EX加成
        for (const traitId of character.traits) {
            if (!traitId) continue;
            const trait = this.traits[traitId];
            if (trait && trait.attackExBonus) {
                attackExBonus += trait.attackExBonus;
            }
        }

        // 从武器中获取攻击力EX加成
        if (character.equipment && character.equipment.weapon) {
            const weapon = character.equipment.weapon;
            if (weapon.attackExBonus) {
                attackExBonus += weapon.attackExBonus;
            }
        }

        attackPower *= (1 + attackExBonus);

        // 添加伤害上升总合
        let damageIncrease = 0;

        // 从特性中获取伤害上升总合
        for (const traitId of character.traits) {
            if (!traitId) continue;
            const trait = this.traits[traitId];
            if (trait && trait.damageIncrease) {
                damageIncrease += trait.damageIncrease;
            }
        }

        // 从武器中获取伤害上升总合
        if (character.equipment && character.equipment.weapon) {
            const weapon = character.equipment.weapon;
            if (weapon.damageIncrease) {
                damageIncrease += weapon.damageIncrease;
            }
        }

        attackPower += damageIncrease;

        console.log(`计算后攻击力: ${attackPower}`);
        if (typeof window !== 'undefined' && window.log) {
            window.log(`计算后攻击力: ${attackPower}`);
            window.log(`===== calculateAttackPower 结束 =====`);
        }

        return attackPower;
    },

    /**
     * 处理角色特性触发
     * @param {string} characterId - 角色ID
     * @param {string} eventType - 事件类型 (attack, damaged, etc)
     * @param {object} eventData - 事件数据
     * @returns {array} 触发的特性效果
     */
    processTraitTriggers(characterId, eventType, eventData) {
        const character = this.getCharacter(characterId);
        if (!character) return [];

        const triggeredEffects = [];

        for (const traitId of character.traits) {
            if (!traitId) continue;
            const trait = this.traits[traitId];

            // 只处理主动特性
            if (trait && trait.type === 'active') {
                // 检查触发概率
                if (Math.random() < trait.triggerRate) {
                    // 根据事件类型和特性执行不同逻辑
                    if (eventType === 'attack' && traitId === 'criticalSurge') {
                        const result = trait.effect(character);
                        if (result.triggered) {
                            triggeredEffects.push(result);
                        }
                    } else if (eventType === 'attack' && traitId === 'elementalBurst') {
                        const result = trait.effect(character, eventData.target, eventData.baseDamage);
                        if (result.triggered) {
                            triggeredEffects.push(result);
                        }
                    } else if (eventType === 'heal' && traitId === 'divineBlessing') {
                        const result = trait.effect(character, eventData.target, eventData.healAmount);
                        if (result.triggered) {
                            triggeredEffects.push(result);
                        }
                    } else if (eventType === 'damaged' && traitId === 'counterAttack') {
                        const result = trait.effect(character, eventData.attacker);
                        if (result.triggered) {
                            triggeredEffects.push(result);
                        }
                    }
                }
            }
        }

        return triggeredEffects;
    },

    /**
     * 计算治疗量
     * @param {string} healerId - 治疗者ID
     * @param {string} targetId - 目标ID
     * @param {number} baseHealAmount - 基础治疗量
     * @returns {number} 实际治疗量
     */
    calculateHeal(healerId, targetId, baseHealAmount) {
        const healer = this.getCharacter(healerId);
        const target = this.getCharacter(targetId);

        if (!healer || !target) return 0;

        let healAmount = baseHealAmount;

        // 应用治疗特性加成
        for (const traitId of healer.traits) {
            if (!traitId) continue;
            const trait = this.traits[traitId];
            if (trait && trait.type === 'passive' && traitId === 'healer') {
                healAmount = trait.effect(healer, healAmount);
            }
        }

        // 计入角色治疗统计
        healer.stats.totalHealing += healAmount;

        return Math.floor(healAmount);
    },

    /**
     * 评估战斗MVP
     * @param {array} teamMemberIds - 参与战斗的队伍成员ID
     * @returns {object} MVP评估结果
     */
    assessBattleMVP(teamMemberIds) {
        const mvpScores = {};
        let highestScore = 0;
        let mvpId = null;

        // 计算每个角色的分数
        for (const memberId of teamMemberIds) {
            const character = this.getCharacter(memberId);
            if (!character) continue;

            // 简单的评分系统，可以根据需要调整
            const damageScore = character.stats.totalDamage;
            const healingScore = character.stats.totalHealing * 1.2; // 治疗有更高权重

            // 综合评分
            const totalScore = damageScore + healingScore;
            mvpScores[memberId] = {
                name: character.name,
                damage: character.stats.totalDamage,
                healing: character.stats.totalHealing,
                score: totalScore
            };

            // 更新最高分
            if (totalScore > highestScore) {
                highestScore = totalScore;
                mvpId = memberId;
            }

            // 增加战斗参与计数
            character.stats.battlesParticipated++;

            // 重置战斗统计（为下次战斗准备）
            character.stats.totalDamage = 0;
            character.stats.totalHealing = 0;
        }

        // 记录MVP
        if (mvpId) {
            const mvpCharacter = this.getCharacter(mvpId);
            if (mvpCharacter) {
                mvpCharacter.stats.mvpCount++;
            }
        }

        return {
            mvpId,
            mvpName: mvpId ? this.getCharacter(mvpId).name : null,
            scores: mvpScores
        };
    },

    /**
     * 升级主角职业
     * @param {string} characterId - 主角ID
     * @returns {boolean} 是否升级成功
     */
    upgradeJobLevel(characterId) {
        const character = this.getCharacter(characterId);
        if (!character || !character.isMainCharacter || !character.job) return false;

        const currentJob = character.job.current;
        const jobData = this.jobs[currentJob];

        if (!jobData) return false;

        // 检查是否达到该职业等级上限
        if (character.job.level >= 20) {
            UI.showMessage(`${character.name} 的 ${jobData.name} 职业已达到最高等级。`);
            return false;
        }

        // 执行职业升级
        character.job.level++;

        // 检查是否解锁新特性
        if (jobData.unlockTraits[character.job.level]) {
            const traitId = jobData.unlockTraits[character.job.level];

            // 将解锁的特性添加到职业特性库
            if (!character.job.jobTraits[currentJob]) {
                character.job.jobTraits[currentJob] = [];
            }

            character.job.jobTraits[currentJob].push(traitId);
            character.unlockedTraits.push(traitId);

            UI.showNotification(`${character.name} 的 ${jobData.name} 职业等级升至 ${character.job.level}，解锁了特性: ${this.traits[traitId].name}！`);
        } else {
            UI.showNotification(`${character.name} 的 ${jobData.name} 职业等级升至 ${character.job.level}。`);
        }

        // 如果达到20级，提示可以转职
        if (character.job.level === 20 && jobData.nextTierJobs && jobData.nextTierJobs.length > 0) {
            UI.showMessage(`${character.name} 的 ${jobData.name} 职业已达到最高等级，可以选择进阶为更高级的职业。`);
        }

        return true;
    },

    /**
     * 主角转职
     * @param {string} characterId - 主角ID
     * @param {string} newJobId - 新职业ID
     * @returns {boolean} 是否转职成功
     */
    changeJob(characterId, newJobId) {
        const character = this.getCharacter(characterId);
        if (!character || !character.isMainCharacter || !character.job) return false;

        const currentJob = character.job.current;
        const currentJobData = this.jobs[currentJob];
        const newJobData = this.jobs[newJobId];

        if (!currentJobData || !newJobData) return false;

        // 检查是否可以转职到目标职业
        if (currentJobData.nextTierJobs && !currentJobData.nextTierJobs.includes(newJobId)) {
            UI.showMessage(`${character.name} 不能从 ${currentJobData.name} 直接转职为 ${newJobData.name}。`);
            return false;
        }

        // 检查当前职业是否达到转职条件（20级）
        if (character.job.level < 20) {
            UI.showMessage(`${character.name} 需要将 ${currentJobData.name} 职业等级提升至20级才能转职。`);
            return false;
        }

        // 执行转职
        character.job.current = newJobId;
        character.job.level = 1;
        character.job.history.push(newJobId);

        // 更新角色基础属性为新职业属性
        character.baseStats = {...newJobData.baseStats};
        character.growthRates = {...newJobData.growthRates};

        // 解锁新职业的初始特性
        if (newJobData.unlockTraits[1]) {
            const traitId = newJobData.unlockTraits[1];

            // 将解锁的特性添加到职业特性库
            if (!character.job.jobTraits[newJobId]) {
                character.job.jobTraits[newJobId] = [];
            }

            character.job.jobTraits[newJobId].push(traitId);
            character.unlockedTraits.push(traitId);
        }

        UI.showNotification(`${character.name} 已成功转职为 ${newJobData.name}！`);

        return true;
    },

    /**
     * 获取主角可用的职业特性
     * @param {string} characterId - 主角ID
     * @returns {array} 可用特性列表
     */
    getAvailableJobTraits(characterId) {
        const character = this.getCharacter(characterId);
        if (!character || !character.isMainCharacter || !character.job) return [];

        const availableTraits = [];

        // 收集所有已解锁的职业特性
        for (const jobId in character.job.jobTraits) {
            const jobTraits = character.job.jobTraits[jobId];
            for (const traitId of jobTraits) {
                if (this.traits[traitId]) {
                    availableTraits.push({
                        id: traitId,
                        name: this.traits[traitId].name,
                        description: this.traits[traitId].description,
                        job: this.jobs[jobId]?.name || jobId
                    });
                }
            }
        }

        return availableTraits;
    },

    /**
     * 获取角色系统保存数据
     * @returns {object} 可用于保存的数据对象
     */
    getSaveData() {
        return {
            characters: this.characters,
            legendaryCharacters: this.legendaryCharacters
        };
    },

    /**
     * 加载角色系统保存数据
     * @param {object} data - 保存的数据对象
     */
    loadSaveData(data) {
        console.log('加载角色系统数据');

        if (!data) return;

        if (data.characters) {
            this.characters = data.characters;
            console.log(`加载了 ${Object.keys(this.characters).length} 个角色`);

            // 调试输出所有角色的招募状态
            Object.values(this.characters).forEach(character => {
                console.log(`加载角色 ${character.name} (ID: ${character.id}) - 招募状态: ${character.isRecruited}, 主角: ${character.isMainCharacter}`);
            });
        }

        if (data.legendaryCharacters) {
            this.legendaryCharacters = data.legendaryCharacters;
        }
    }
};