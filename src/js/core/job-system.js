/**
 * 职业系统 - 定义游戏中的职业和技能
 */
const JobSystem = {
    /**
     * 职业定义
     */
    jobs: {
        // 一阶职业
        warrior: {
            name: '战士',
            tier: 1,
            description: '擅长近战和防御的职业，拥有高生命值和防御力。',
            baseStats: { hp: 120, attack: 12, defense: 8, speed: 5 },
            skills: ['warriorSlash', 'powerStrike'],
            fixedSkill: 'warriorSlash',
            nextTiers: ['berserker', 'beastLord'],
            unlocked: true // 默认解锁
        },
        fortress: {
            name: '堡垒',
            tier: 1,
            description: '专注于防御和保护队友的职业，拥有极高的防御力。',
            baseStats: { hp: 150, attack: 8, defense: 12, speed: 4 },
            skills: ['fortressGuard', 'shieldBash'],
            fixedSkill: 'fortressGuard',
            nextTiers: ['spartan', 'oathShielder'],
            unlocked: true // 默认解锁
        },
        cleric: {
            name: '牧师',
            tier: 1,
            description: '擅长治疗和辅助的职业，能够恢复队友生命值。',
            baseStats: { hp: 90, attack: 6, defense: 6, speed: 7 },
            skills: ['clericLight', 'heal', 'bless'],
            fixedSkill: 'clericLight',
            nextTiers: ['bishop', 'saint'],
            unlocked: true // 默认解锁
        },
        arcanist: {
            name: '秘法师',
            tier: 1,
            description: '掌握强大魔法的职业，能够造成大量魔法伤害。',
            baseStats: { hp: 80, attack: 14, defense: 4, speed: 6 },
            skills: ['arcanistBolt', 'fireball', 'frostBolt'],
            fixedSkill: 'arcanistBolt',
            nextTiers: ['hermit', 'warlock'],
            unlocked: true // 默认解锁
        },
        spellblade: {
            name: '魔剑士',
            tier: 1,
            description: '将魔法与剑术结合的职业，拥有多样化的攻击手段。',
            baseStats: { hp: 100, attack: 10, defense: 6, speed: 8 },
            skills: ['spellbladeStrike', 'magicSlash', 'elementalEnhance'],
            fixedSkill: 'spellbladeStrike',
            nextTiers: ['darkKnight', 'chaosLord'],
            unlocked: true // 默认解锁
        },
        archer: {
            name: '射手',
            tier: 1,
            description: '擅长远程攻击的职业，拥有高速度和精准度。',
            baseStats: { hp: 85, attack: 11, defense: 5, speed: 10 },
            skills: ['archerShot', 'preciseShot', 'multiShot'],
            fixedSkill: 'archerShot',
            nextTiers: ['rattlesnake', 'robinHood'],
            unlocked: true // 默认解锁
        },

        // 二阶职业 - 战士进阶
        berserker: {
            name: '狂战士',
            tier: 2,
            description: '牺牲防御换取极高攻击力的职业，能够造成巨大伤害。',
            baseStats: { hp: 140, attack: 18, defense: 6, speed: 7 },
            skills: ['berserkerRage', 'powerStrike', 'rage', 'whirlwind'],
            fixedSkill: 'berserkerRage',
            requiredJob: 'warrior',
            requiredLevel: 20,
            unlocked: false // 默认未解锁
        },
        beastLord: {
            name: '兽王',
            tier: 2,
            description: '能够驯服野兽的职业，与野兽一起战斗。',
            baseStats: { hp: 130, attack: 14, defense: 10, speed: 8 },
            skills: ['beastLordCommand', 'powerStrike', 'beastCall', 'packTactics'],
            fixedSkill: 'beastLordCommand',
            requiredJob: 'warrior',
            requiredLevel: 20,
            unlocked: false // 默认未解锁
        },

        // 二阶职业 - 堡垒进阶
        spartan: {
            name: '斯巴达',
            tier: 2,
            description: '精通盾牌与长矛的职业，兼具攻防能力。',
            baseStats: { hp: 160, attack: 12, defense: 14, speed: 5 },
            skills: ['spartanStance', 'shieldBash', 'spearThrust', 'phalanx'],
            fixedSkill: 'spartanStance',
            requiredJob: 'fortress',
            requiredLevel: 20,
            unlocked: false // 默认未解锁
        },
        oathShielder: {
            name: '盾誓者',
            tier: 2,
            description: '以保护他人为誓言的职业，能够承受队友的伤害。',
            baseStats: { hp: 180, attack: 9, defense: 16, speed: 4 },
            skills: ['oathShielderVow', 'shieldBash', 'guardianOath', 'bulwark'],
            fixedSkill: 'oathShielderVow',
            requiredJob: 'fortress',
            requiredLevel: 20,
            unlocked: false // 默认未解锁
        },

        // 二阶职业 - 牧师进阶
        bishop: {
            name: '主教',
            tier: 2,
            description: '拥有强大治疗能力的职业，能够复活倒下的队友。',
            baseStats: { hp: 100, attack: 8, defense: 8, speed: 9 },
            skills: ['bishopBlessing', 'heal', 'massHeal', 'resurrection'],
            fixedSkill: 'bishopBlessing',
            requiredJob: 'cleric',
            requiredLevel: 20,
            unlocked: false // 默认未解锁
        },
        saint: {
            name: '圣者',
            tier: 2,
            description: '掌握神圣力量的职业，能够驱散负面效果并增强队友。',
            baseStats: { hp: 110, attack: 10, defense: 7, speed: 8 },
            skills: ['saintPrayer', 'heal', 'purify', 'divineBlessing'],
            fixedSkill: 'saintPrayer',
            requiredJob: 'cleric',
            requiredLevel: 20,
            unlocked: false // 默认未解锁
        },

        // 二阶职业 - 秘法师进阶
        hermit: {
            name: '隐者',
            tier: 2,
            description: '专注于元素魔法的职业，能够操控自然元素。',
            baseStats: { hp: 90, attack: 16, defense: 5, speed: 8 },
            skills: ['hermitSpell', 'fireball', 'thunderstorm', 'elementalMastery'],
            fixedSkill: 'hermitSpell',
            requiredJob: 'arcanist',
            requiredLevel: 20,
            unlocked: false // 默认未解锁
        },
        warlock: {
            name: '术士',
            tier: 2,
            description: '掌握黑暗魔法的职业，能够诅咒敌人并吸取生命力。',
            baseStats: { hp: 95, attack: 18, defense: 4, speed: 7 },
            skills: ['warlockCurse', 'fireball', 'curse', 'lifeDrain'],
            fixedSkill: 'warlockCurse',
            requiredJob: 'arcanist',
            requiredLevel: 20,
            unlocked: false // 默认未解锁
        },

        // 二阶职业 - 魔剑士进阶
        darkKnight: {
            name: '黑暗剑士',
            tier: 2,
            description: '掌握黑暗力量的剑士，能够吸取敌人生命力。',
            baseStats: { hp: 120, attack: 14, defense: 8, speed: 9 },
            skills: ['darkKnightSlash', 'magicSlash', 'darkSlash', 'soulEater'],
            fixedSkill: 'darkKnightSlash',
            requiredJob: 'spellblade',
            requiredLevel: 20,
            unlocked: false // 默认未解锁
        },
        chaosLord: {
            name: '混沌领主',
            tier: 2,
            description: '掌握混沌魔法的剑士，能够造成不可预测的伤害。',
            baseStats: { hp: 110, attack: 16, defense: 7, speed: 10 },
            skills: ['chaosLordDisruption', 'magicSlash', 'chaosStrike', 'realityWarp'],
            fixedSkill: 'chaosLordDisruption',
            requiredJob: 'spellblade',
            requiredLevel: 20,
            unlocked: false // 默认未解锁
        },

        // 二阶职业 - 射手进阶
        rattlesnake: {
            name: '响尾蛇',
            tier: 2,
            description: '专注于致命一击的射手，能够造成巨大伤害。',
            baseStats: { hp: 95, attack: 17, defense: 4, speed: 12 },
            skills: ['rattlesnakeAim', 'preciseShot', 'venom', 'assassinate'],
            fixedSkill: 'rattlesnakeAim',
            requiredJob: 'archer',
            requiredLevel: 20,
            unlocked: false // 默认未解锁
        },
        robinHood: {
            name: '罗宾汉',
            tier: 2,
            description: '精通多种射击技巧的射手，能够支援队友。',
            baseStats: { hp: 100, attack: 14, defense: 6, speed: 14 },
            skills: ['robinHoodArrow', 'multiShot', 'supportFire', 'rainOfArrows'],
            fixedSkill: 'robinHoodArrow',
            requiredJob: 'archer',
            requiredLevel: 20,
            unlocked: false // 默认未解锁
        }
    },

    /**
     * 技能定义
     */
    skills: {
        // 职业固定技能
        warriorSlash: {
            name: '狂怒',
            description: '所有参战者获得攻击力+20%,持续3回合。CD5回合',
            type: 'attack',
            power: 1.0,
            cost: 0,
            fixed: true
        },
        fortressGuard: {
            name: '佰长之护',
            description: '无敌1次，持续3回合。攻击力降低20%。CD8回合',
            type: 'defense',
            power: 0.5,
            cost: 0,
            fixed: true
        },
        clericLight: {
            name: '全体净化',
            description: '所有参战者净化一个debuff,CD4回合',
            type: 'heal',
            power: 0.1,
            cost: 0,
            fixed: true
        },
        arcanistBolt: {
            name: '致盲',
            description: '对敌方单体施加黑暗debuff[降低50%攻击命中率],持续3回合,CD5回合',
            type: 'magic',
            power: 1.0,
            cost: 0,
            fixed: true
        },
        spellbladeStrike: {
            name: '加速',
            description: '我方全体获得DA[普通攻击变成连击]+10%,TA[普通攻击变成三连击]+5%buff，持续3回合,CD7回合',
            type: 'attack',
            power: 1.0,
            cost: 0,
            fixed: true
        },
        archerShot: {
            name: '剑雨',
            description: '对敌方全体造成150%-300%攻击力的伤害，CD5回合',
            type: 'attack',
            power: 1.0,
            cost: 0,
            fixed: true
        },
        berserkerRage: {
            name: '暴走',
            description: '全体获得以下状态:DA+100%,TA+50%。持续3回合，CD6回合。',
            type: 'attack',
            power: 1.1,
            cost: 0,
            fixed: true
        },
        beastLordCommand: {
            name: '兽王指令',
            description: '对敌方全体造成200%攻击力伤害，并施加防御力降低10%debuff和攻击力降低10%debuff,持续3回合。\
            我方全体获得樵夫之歌[1.我方全体获得浑身buff,效果10%-20% 2.我方全体获得恢复buff，效果3000]buff，无法驱散，持续3回合CD6回合。',
            type: 'attack',
            power: 1.0,
            cost: 0,
            fixed: true
        },
        spartanStance: {
            name: '盾墙',
            description: '我方全体获得全属性伤害70%减免BUFF，持续一回合。CD5回合',
            type: 'defense',
            power: 0.6,
            cost: 0,
            fixed: true
        },
        oathShielderVow: {
            name: '盾誓者誓言',
            description: '自身获得英勇之盾BUFF，持续一回合,CD8回合\
            英勇之盾: 1.全体援护（自身成为攻击目标，aoe除外）\
                     2.防御力+1000\
                     3.单次受到的伤害，最大值锁定为500\
                     4.回合结束时,对敌方全体造成100%攻击力的伤害',
            type: 'defense',
            power: 0.4,
            cost: 0,
            fixed: true
        },
        bishopBlessing: {
            name: '全体治疗',
            description: '我方全体回复2000HP，CD5回合',
            type: 'heal',
            power: 0.15,
            cost: 0,
            fixed: true
        },
        saintPrayer: {
            name: '主教座堂',
            description: '我方全体获得以下强化：\
                            1.伤害吸收盾5000，持续到消耗完\
                            2.主教座堂BUFF,持续2次，受到攻击降低一次，无法驱散:\
                                a.受到的伤害转为主角有利属性\
                                b.主角有利属性伤害减轻20%\
                            CD16回合',
            type: 'heal',
            power: 0.1,
            cost: 0,
            fixed: true
        },
        hermitSpell: {
            name: '以太爆发',
            description: '对敌方全体造成300-400%攻击力的伤害。CD5回合',
            type: 'magic',
            power: 1.1,
            cost: 0,
            fixed: true
        },
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
            fixed: true
        },
        darkKnightSlash: {
            name: '惨雾',
            description: '对敌方全体施加以下DEBUFF，持续4回合，CD5回合\
                            1.攻击力降低25%\
                            2.防御力降低25%',
            type: 'attack',
            power: 1.1,
            cost: 0,
            fixed: true
        },
        chaosLordDisruption: {
            name: '荒凉无序',
            description: '对敌方单体造成2次150%攻击力的伤害，并施加以下DEBUFF，持续3回合，CD6回合\
                            2.防御力降低20%\
                            3.DA降低30%\
                            3.TA降低20%',
            type: 'attack',
            power: 1.0,
            cost: 0,
            fixed: true
        },
        rattlesnakeAim: {
            name: '疾风步',
            description: '自身获得以下BUFF，持续一回合,CD5回合\
                            1.攻击力+100%\
                            2.完全回避（回避所有伤害，不可回避除外）',
            type: 'attack',
            power: 1.2,
            cost: 0,
            fixed: true
        },
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
            fixed: true
        },

        // 战士技能
        powerStrike: {
            name: '强力打击',
            description: '用力挥舞武器，造成150%攻击力的伤害。',
            type: 'attack',
            power: 1.5,
            cost: 10
        },
        rage: {
            name: '狂怒',
            description: '进入狂怒状态，增加30%攻击力，但减少20%防御力。',
            type: 'buff',
            power: 1.3,
            cost: 15
        },
        whirlwind: {
            name: '旋风斩',
            description: '旋转攻击周围所有敌人，造成120%攻击力的伤害。',
            type: 'aoe',
            power: 1.2,
            cost: 20
        },

        // 堡垒技能
        shieldBash: {
            name: '盾击',
            description: '用盾牌击打敌人，造成80%攻击力的伤害并有30%几率眩晕敌人。',
            type: 'attack',
            power: 0.8,
            cost: 10
        },
        spearThrust: {
            name: '长矛刺击',
            description: '用长矛刺击敌人，造成130%攻击力的伤害。',
            type: 'attack',
            power: 1.3,
            cost: 12
        },
        phalanx: {
            name: '方阵',
            description: '组成防御阵型，增加全队20%防御力。',
            type: 'buff',
            power: 1.2,
            cost: 18
        },
        guardianOath: {
            name: '守护誓言',
            description: '立下守护誓言，承受队友50%的伤害。',
            type: 'buff',
            power: 0.5,
            cost: 15
        },
        bulwark: {
            name: '壁垒',
            description: '成为不可动摇的壁垒，增加50%防御力。',
            type: 'buff',
            power: 1.5,
            cost: 20
        },

        // 牧师技能
        heal: {
            name: '治疗',
            description: '恢复目标30%最大生命值。',
            type: 'heal',
            power: 0.3,
            cost: 15
        },
        bless: {
            name: '祝福',
            description: '祝福目标，增加10%所有属性。',
            type: 'buff',
            power: 1.1,
            cost: 20
        },
        massHeal: {
            name: '群体治疗',
            description: '恢复全队20%最大生命值。',
            type: 'heal',
            power: 0.2,
            cost: 25
        },
        resurrection: {
            name: '复活',
            description: '复活倒下的队友，恢复50%生命值。',
            type: 'heal',
            power: 0.5,
            cost: 40
        },
        purify: {
            name: '净化',
            description: '净化目标，移除所有负面状态。',
            type: 'heal',
            power: 1.0,
            cost: 15
        },
        divineBlessing: {
            name: '神圣祝福',
            description: '赐予神圣祝福，增加全队15%所有属性。',
            type: 'buff',
            power: 1.15,
            cost: 30
        },

        // 秘法师技能
        fireball: {
            name: '火球术',
            description: '发射一个火球，造成140%攻击力的火属性伤害。',
            type: 'magic',
            power: 1.4,
            cost: 15
        },
        frostBolt: {
            name: '冰霜箭',
            description: '发射一支冰箭，造成120%攻击力的冰属性伤害并减少目标20%速度。',
            type: 'magic',
            power: 1.2,
            cost: 12
        },
        thunderstorm: {
            name: '雷暴',
            description: '召唤雷暴攻击所有敌人，造成130%攻击力的雷属性伤害。',
            type: 'magic',
            power: 1.3,
            cost: 25
        },
        elementalMastery: {
            name: '元素掌控',
            description: '掌控元素力量，增加30%魔法伤害。',
            type: 'buff',
            power: 1.3,
            cost: 20
        },
        curse: {
            name: '诅咒',
            description: '诅咒目标，减少20%所有属性。',
            type: 'debuff',
            power: 0.8,
            cost: 18
        },
        lifeDrain: {
            name: '生命吸取',
            description: '吸取目标生命力，造成100%攻击力的伤害并恢复自身同等生命值。',
            type: 'magic',
            power: 1.0,
            cost: 20
        },

        // 魔剑士技能
        magicSlash: {
            name: '魔法斩击',
            description: '附魔武器进行斩击，造成120%攻击力的魔法伤害。',
            type: 'attack',
            power: 1.2,
            cost: 12
        },
        elementalEnhance: {
            name: '元素强化',
            description: '用元素强化武器，增加20%攻击力。',
            type: 'buff',
            power: 1.2,
            cost: 15
        },
        darkSlash: {
            name: '暗影斩',
            description: '用黑暗能量斩击，造成140%攻击力的暗属性伤害。',
            type: 'attack',
            power: 1.4,
            cost: 18
        },
        soulEater: {
            name: '噬魂',
            description: '吞噬敌人灵魂，造成120%攻击力的伤害并恢复15%最大生命值。',
            type: 'attack',
            power: 1.2,
            cost: 20
        },
        chaosStrike: {
            name: '混沌打击',
            description: '释放混沌能量，造成100-200%攻击力的随机伤害。',
            type: 'attack',
            power: 1.5,
            cost: 18
        },
        realityWarp: {
            name: '现实扭曲',
            description: '扭曲现实，有30%几率使敌人攻击失败。',
            type: 'buff',
            power: 0.3,
            cost: 25
        },

        // 射手技能
        preciseShot: {
            name: '精准射击',
            description: '瞄准敌人弱点，造成160%攻击力的伤害。',
            type: 'attack',
            power: 1.6,
            cost: 15
        },
        multiShot: {
            name: '多重射击',
            description: '同时射出多支箭，对随机敌人造成3次80%攻击力的伤害。',
            type: 'attack',
            power: 0.8,
            cost: 18
        },
        venom: {
            name: '毒箭',
            description: '射出淬毒的箭，造成100%攻击力的伤害并使目标中毒，每回合受到10%攻击力的伤害。',
            type: 'attack',
            power: 1.0,
            cost: 15
        },
        assassinate: {
            name: '暗杀',
            description: '瞄准敌人要害，造成200%攻击力的伤害，如果敌人生命值低于30%则必定暴击。',
            type: 'attack',
            power: 2.0,
            cost: 25
        },
        supportFire: {
            name: '火力支援',
            description: '为队友提供火力支援，增加全队15%攻击力。',
            type: 'buff',
            power: 1.15,
            cost: 20
        },
        rainOfArrows: {
            name: '箭雨',
            description: '向空中射出大量箭矢，对所有敌人造成120%攻击力的伤害。',
            type: 'aoe',
            power: 1.2,
            cost: 25
        }
    },

    /**
     * 获取职业信息
     * @param {string} jobId - 职业ID
     * @returns {object|null} 职业信息
     */
    getJob(jobId) {
        return this.jobs[jobId] || null;
    },

    /**
     * 获取技能信息
     * @param {string} skillId - 技能ID
     * @returns {object|null} 技能信息
     */
    getSkill(skillId) {
        return this.skills[skillId] || null;
    },

    /**
     * 获取角色可用的职业列表
     * @param {object} character - 角色对象
     * @returns {array} 可用职业列表
     */
    getAvailableJobs(character) {
        if (!character) return [];

        const availableJobs = [];

        // 添加所有一阶职业（可以随时切换）
        for (const jobId in this.jobs) {
            const job = this.jobs[jobId];
            if (job.tier === 1) {
                availableJobs.push(jobId);
            }
        }

        // 添加已解锁的二阶职业
        if (character.job && character.job.unlockedJobs) {
            for (const jobId of character.job.unlockedJobs) {
                if (!availableJobs.includes(jobId)) {
                    const job = this.getJob(jobId);
                    if (job && job.tier === 2) {
                        availableJobs.push(jobId);
                    }
                }
            }
        }

        return availableJobs;
    },

    /**
     * 获取职业可用的技能列表
     * @param {string} jobId - 职业ID
     * @param {number} jobLevel - 职业等级
     * @returns {array} 可用技能列表
     */
    getJobSkills(jobId, jobLevel = 1) {
        const job = this.getJob(jobId);
        if (!job) return [];

        // 简单规则：每5级解锁一个新技能
        const availableSkillCount = Math.min(job.skills.length, Math.floor(jobLevel / 5) + 1);
        return job.skills.slice(0, availableSkillCount);
    },

    /**
     * 解锁职业
     * @param {object} character - 角色对象
     * @param {string} jobId - 要解锁的职业ID
     * @returns {boolean} 是否成功解锁
     */
    unlockJob(character, jobId) {
        if (!character || !jobId) return false;

        const job = this.getJob(jobId);
        if (!job) return false;

        // 一阶职业默认解锁
        if (job.tier === 1) return true;

        // 检查是否满足解锁条件
        if (job.requiredJob && job.requiredLevel) {
            // 检查角色是否有该职业的历史记录和等级
            const jobHistory = character.job?.jobLevels || {};
            const requiredJobLevel = jobHistory[job.requiredJob] || 0;

            if (requiredJobLevel < job.requiredLevel) {
                console.log(`解锁${job.name}失败：需要${job.requiredJob}达到${job.requiredLevel}级`);
                return false;
            }
        }

        // 初始化解锁职业列表
        if (!character.job.unlockedJobs) {
            character.job.unlockedJobs = [];
        }

        // 添加到解锁列表
        if (!character.job.unlockedJobs.includes(jobId)) {
            character.job.unlockedJobs.push(jobId);
            console.log(`解锁职业成功：${job.name}`);
        }

        return true;
    },

    /**
     * 切换职业
     * @param {object} character - 角色对象
     * @param {string} newJobId - 新职业ID
     * @returns {boolean} 是否成功切换
     */
    changeJob(character, newJobId) {
        if (!character || !newJobId) return false;

        const newJob = this.getJob(newJobId);
        if (!newJob) return false;

        // 检查是否可以切换到该职业
        if (newJob.tier === 1) {
            // 一阶职业可以随时切换
        } else if (newJob.tier === 2) {
            // 二阶职业需要解锁
            if (!character.job?.unlockedJobs || !character.job.unlockedJobs.includes(newJobId)) {
                console.log(`切换到${newJob.name}失败：该职业尚未解锁`);
                return false;
            }
        } else {
            console.log(`切换到${newJob.name}失败：不支持的职业等级`);
            return false;
        }

        // 保存当前职业等级
        if (!character.job.jobLevels) {
            character.job.jobLevels = {};
        }
        character.job.jobLevels[character.job.current] = character.job.level;

        // 切换职业
        const oldJobId = character.job.current;
        character.job.current = newJobId;

        // 设置职业等级
        character.job.level = character.job.jobLevels[newJobId] || 1;

        // 更新职业历史
        if (!character.job.history) {
            character.job.history = [oldJobId];
        }
        if (!character.job.history.includes(newJobId)) {
            character.job.history.push(newJobId);
        }

        // 更新角色属性
        if (newJob.baseStats) {
            // 保留当前生命值比例
            const hpRatio = character.currentStats.hp / character.baseStats.hp;

            // 更新基础属性
            character.baseStats = {
                ...character.baseStats,
                ...newJob.baseStats
            };

            // 更新当前生命值
            character.currentStats.hp = Math.floor(character.baseStats.hp * hpRatio);
        }

        // 更新技能
        if (newJob.skills) {
            // 获取职业技能
            character.skills = this.getJobSkills(newJobId, character.job.level);
        }

        console.log(`切换职业成功：从${oldJobId}切换到${newJobId}`);
        return true;
    }
};
