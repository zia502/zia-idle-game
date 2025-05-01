/**
 * 职业系统 - 定义游戏中的职业和技能
 */
const JobSystem = {
    /**
     * 初始化职业系统
     */
    init() {
        console.log('初始化职业系统');

        // 检查JobSkillsTemplate是否已加载
        if (typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates) {
            console.log('JobSkillsTemplate已加载，职业系统就绪');

            // 触发职业系统就绪事件
            if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
                Events.emit('jobSystem:ready');
            }
        } else {
            console.log('等待JobSkillsTemplate加载...');

            // 监听JobSkillsTemplate加载完成事件
            if (typeof Events !== 'undefined' && typeof Events.on === 'function') {
                Events.on('jobSkillsTemplate:loaded', () => {
                    console.log('JobSkillsTemplate加载完成，职业系统就绪');

                    // 触发职业系统就绪事件
                    if (typeof Events.emit === 'function') {
                        Events.emit('jobSystem:ready');
                    }
                });
            } else {
                console.warn('Events模块未就绪，无法监听JobSkillsTemplate加载事件');
            }
        }
    },
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
            skills: ['warriorSlash', 'armorBreak', 'fiercePounce', 'whirlwind'],
            fixedSkill: 'warriorSlash',
            nextTiers: ['berserker', 'beastLord'],
            unlocked: true, // 默认解锁
            allowedWeapons: ['sword', 'axe'] // 允许使用剑和斧
        },
        fortress: {
            name: '堡垒',
            tier: 1,
            description: '专注于防御和保护队友的职业，拥有极高的防御力。',
            baseStats: { hp: 150, attack: 8, defense: 12, speed: 4 },
            skills: ['fortressGuard', 'shieldWall', 'guardianFormation', 'cover'],
            fixedSkill: 'fortressGuard',
            nextTiers: ['spartan', 'oathShielder'],
            unlocked: true, // 默认解锁
            allowedWeapons: ['sword', 'spear'] // 允许使用剑和枪
        },
        cleric: {
            name: '牧师',
            tier: 1,
            description: '擅长治疗和辅助的职业，能够恢复队友生命值。',
            baseStats: { hp: 90, attack: 6, defense: 6, speed: 7 },
            skills: ['clericLight', 'heal', 'flashSpell', 'resurrection'],
            fixedSkill: 'clericLight',
            nextTiers: ['bishop', 'saint'],
            unlocked: true, // 默认解锁
            allowedWeapons: ['staff', 'spear'] // 允许使用杖和枪
        },
        arcanist: {
            name: '秘法师',
            tier: 1,
            description: '掌握强大魔法的职业，能够造成大量魔法伤害。',
            baseStats: { hp: 80, attack: 14, defense: 4, speed: 6 },
            skills: ['arcanistBolt', 'fireball', 'frostBolt', 'thunderstorm'],
            fixedSkill: 'arcanistBolt',
            nextTiers: ['hermit', 'warlock'],
            unlocked: true, // 默认解锁
            allowedWeapons: ['staff', 'knife'] // 允许使用杖和刀
        },
        spellblade: {
            name: '魔剑士',
            tier: 1,
            description: '将魔法与剑术结合的职业，拥有多样化的攻击手段。',
            baseStats: { hp: 100, attack: 10, defense: 6, speed: 8 },
            skills: ['spellbladeStrike', 'weaken', 'enhance', 'shadowSlash'],
            fixedSkill: 'spellbladeStrike',
            nextTiers: ['darkKnight', 'chaosLord'],
            unlocked: true, // 默认解锁
            allowedWeapons: ['knife', 'bow'] // 允许使用刀和弓
        },
        archer: {
            name: '射手',
            tier: 1,
            description: '擅长远程攻击的职业，拥有高速度和精准度。',
            baseStats: { hp: 85, attack: 11, defense: 5, speed: 10 },
            skills: ['archerShot', 'preciseShot', 'multiShot', 'arrowRain'],
            fixedSkill: 'archerShot',
            nextTiers: ['rattlesnake', 'robinHood'],
            unlocked: true, // 默认解锁
            allowedWeapons: ['axe', 'bow'] // 允许使用斧和弓
        },

        // 二阶职业 - 战士进阶
        berserker: {
            name: '狂战士',
            tier: 2,
            description: '牺牲防御换取极高攻击力的职业，能够造成巨大伤害。',
            baseStats: { hp: 140, attack: 18, defense: 6, speed: 7 },
            skills: ['berserkerRage', 'armorBreak', 'fiercePounce', 'whirlwind'],
            fixedSkill: 'berserkerRage',
            requiredJob: 'warrior',
            requiredLevel: 20,
            unlocked: false, // 默认未解锁
            allowedWeapons: ['sword', 'axe'] // 允许使用剑和斧
        },
        beastLord: {
            name: '兽王',
            tier: 2,
            description: '能够驯服野兽的职业，与野兽一起战斗。',
            baseStats: { hp: 130, attack: 14, defense: 10, speed: 8 },
            skills: ['beastLordCommand', 'armorBreak', 'fiercePounce', 'whirlwind'],
            fixedSkill: 'beastLordCommand',
            requiredJob: 'warrior',
            requiredLevel: 20,
            unlocked: false, // 默认未解锁
            allowedWeapons: ['axe', 'bow'] // 允许使用斧和弓
        },

        // 二阶职业 - 堡垒进阶
        spartan: {
            name: '斯巴达',
            tier: 2,
            description: '精通盾牌与长矛的职业，兼具攻防能力。',
            baseStats: { hp: 160, attack: 12, defense: 14, speed: 5 },
            skills: ['spartanStance', 'shieldWall', 'spearThrust', 'guardianFormation'],
            fixedSkill: 'spartanStance',
            requiredJob: 'fortress',
            requiredLevel: 20,
            unlocked: false, // 默认未解锁
            allowedWeapons: ['sword', 'spear'] // 允许使用剑和枪
        },
        oathShielder: {
            name: '盾誓者',
            tier: 2,
            description: '以保护他人为誓言的职业，能够承受队友的伤害。',
            baseStats: { hp: 180, attack: 9, defense: 16, speed: 4 },
            skills: ['oathShielderVow', 'shieldWall', 'cover', 'bulwark'],
            fixedSkill: 'oathShielderVow',
            requiredJob: 'fortress',
            requiredLevel: 20,
            unlocked: false, // 默认未解锁
            allowedWeapons: ['axe', 'spear'] // 允许使用斧和枪
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
            unlocked: false, // 默认未解锁
            allowedWeapons: ['staff', 'bow'] // 允许使用杖和弓
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
            unlocked: false, // 默认未解锁
            allowedWeapons: ['spear', 'staff'] // 允许使用枪和杖
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
            unlocked: false, // 默认未解锁
            allowedWeapons: ['spear', 'knife'] // 允许使用枪和刀
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
            unlocked: false, // 默认未解锁
            allowedWeapons: ['knife', 'staff'] // 允许使用刀和杖
        },

        // 二阶职业 - 魔剑士进阶
        darkKnight: {
            name: '黑暗剑士',
            tier: 2,
            description: '掌握黑暗力量的剑士，能够吸取敌人生命力。',
            baseStats: { hp: 120, attack: 14, defense: 8, speed: 9 },
            skills: ['darkKnightSlash', 'weaken', 'shadowSlash', 'soulEater'],
            fixedSkill: 'darkKnightSlash',
            requiredJob: 'spellblade',
            requiredLevel: 20,
            unlocked: false, // 默认未解锁
            allowedWeapons: ['sword', 'knife'] // 允许使用剑和刀
        },
        chaosLord: {
            name: '混沌领主',
            tier: 2,
            description: '掌握混沌魔法的剑士，能够造成不可预测的伤害。',
            baseStats: { hp: 110, attack: 16, defense: 7, speed: 10 },
            skills: ['chaosLordDisruption', 'weaken', 'chaosStrike', 'realityWarp'],
            fixedSkill: 'chaosLordDisruption',
            requiredJob: 'spellblade',
            requiredLevel: 20,
            unlocked: false, // 默认未解锁
            allowedWeapons: ['axe', 'knife'] // 允许使用斧和刀
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
            unlocked: false, // 默认未解锁
            allowedWeapons: ['bow', 'staff'] // 允许使用弓和杖
        },
        robinHood: {
            name: '罗宾汉',
            tier: 2,
            description: '精通多种射击技巧的射手，能够支援队友。',
            baseStats: { hp: 100, attack: 14, defense: 6, speed: 14 },
            skills: ['robinHoodArrow', 'multiShot', 'supportFire', 'arrowRain'],
            fixedSkill: 'robinHoodArrow',
            requiredJob: 'archer',
            requiredLevel: 20,
            unlocked: false, // 默认未解锁
            allowedWeapons: ['bow', 'sword'] // 允许使用弓和剑
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
        // 检查技能模板是否已加载
        if (typeof JobSkillsTemplate === 'undefined') {
            console.warn(`JobSkillsTemplate未定义，无法获取技能: ${skillId}`);
            return this.getFallbackSkill(skillId);
        }

        // 检查templates属性是否存在
        if (!JobSkillsTemplate.templates) {
            console.warn(`JobSkillsTemplate.templates未定义，可能技能模板尚未加载，无法获取技能: ${skillId}`);
            return this.getFallbackSkill(skillId);
        }

        // 从JobSkillsTemplate获取技能信息
        const templateSkill = JobSkillsTemplate.templates[skillId];
        if (templateSkill) {
            return templateSkill;
        }

        // 如果找不到技能，返回备用技能
        console.warn(`找不到技能: ${skillId}`);
        return this.getFallbackSkill(skillId);
    },

    /**
     * 获取备用技能信息
     * 当技能模板未加载或找不到技能时使用
     * @param {string} skillId - 技能ID
     * @returns {object} 备用技能信息
     */
    getFallbackSkill(skillId) {
        // 常见技能的备用信息
        const commonSkills = {
            'warriorSlash': {
                name: '狂怒',
                description: '所有参战者获得攻击力+20%,持续3回合。CD5回合',
                type: 'buff',
                power: 1.0,
                effectType: 'buff',
                targetType: 'all_allies',
                effects: [{ type: 'attackUp', value: 0.2, duration: 3 }]
            },
            'armorBreak': {
                name: '护甲破坏',
                description: '对敌方单体造成100%攻击力的伤害，并对敌方单位施加防御力-20%DEBUFF，持续3回合，CD5回合。',
                type: 'attack',
                power: 1.0,
                effectType: 'damage_and_debuff',
                targetType: 'enemy',
                effects: [{ type: 'damage', multiplier: 1.0 }]
            },
            'fiercePounce': {
                name: '猛袭',
                description: '被动:自身DA+15%',
                type: 'buff',
                power: 0.5,
                effectType: 'buff',
                targetType: 'self',
                effects: [{ type: 'daBoost', value: 0.15, passive: true }]
            },
            'whirlwind': {
                name: '旋风斩',
                description: '对所有敌人造成伤害',
                type: 'attack',
                power: 1.2,
                effectType: 'damage',
                targetType: 'all_enemies',
                effects: [{ type: 'damage', multiplier: 1.2 }]
            }
        };

        // 如果是常见技能，返回预定义的备用信息
        if (commonSkills[skillId]) {
            return {
                id: skillId,
                ...commonSkills[skillId]
            };
        }

        // 否则创建一个基本的技能对象
        return {
            id: skillId,
            name: skillId, // 使用ID作为名称
            description: "技能信息尚未加载",
            type: "unknown",
            power: 1.0,
            effectType: "unknown",
            targetType: "unknown",
            effects: []
        };
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
     * @returns {array} 可用技能列表
     */
    getJobSkills(jobId) {
        const job = this.getJob(jobId);
        if (!job) return [];

        // 返回所有技能
        return job.skills;
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
    },

    /**
     * 检查武器是否可以被职业使用
     * @param {string} jobId - 职业ID
     * @param {string} weaponType - 武器类型
     * @returns {boolean} 是否可以使用该武器
     */
    canUseWeapon(jobId, weaponType) {
        const job = this.getJob(jobId);
        if (!job || !job.allowedWeapons) return false;
        return job.allowedWeapons.includes(weaponType);
    },

    /**
     * 获取职业允许使用的武器列表
     * @param {string} jobId - 职业ID
     * @returns {array} 允许使用的武器类型列表
     */
    getAllowedWeapons(jobId) {
        const job = this.getJob(jobId);
        return job?.allowedWeapons || [];
    }
};
