/**
 * 战斗系统 - 负责游戏中的战斗逻辑
 */
const Battle = {
    // 战斗状态
    isFirstTurn: true,
    currentTurn: 0,
    battleLog: [],

    /**
     * 初始化战斗系统
     */
    init() {
        console.log('战斗系统已初始化');
    },

    /**
     * 开始战斗
     * @param {object} team - 玩家队伍
     * @param {object} monster - 怪物对象
     * @returns {object} 战斗结果
     */
    startBattle(team, monster) {
        // 重置战斗状态
        this.isFirstTurn = true;
        this.currentTurn = 0;
        this.battleLog = [];

        // 确保Character对象存在
        if (typeof Character === 'undefined') {
            window.Character = {
                characters: {},
                getCharacter: function(id) {
                    return this.characters[id];
                },
                traits: {}
            };
            this.logBattle('Character对象已初始化');
        } else if (typeof Character.getCharacter !== 'function') {
            Character.getCharacter = function(id) {
                return this.characters[id];
            };
            this.logBattle('Character.getCharacter方法已添加');
        }

        // 获取队伍成员（前4名为前排，后2名为后排备用）
        const frontLineMembers = [];
        const backLineMembers = [];
        const FRONT_LINE_COUNT = 4; // 前排成员数量

        // 处理所有队伍成员
        for (let i = 0; i < team.members.length; i++) {
            const memberId = team.members[i];
            const character = Character.getCharacter(memberId);
            if (character) {
                // 重置战斗统计
                if (!character.stats) {
                    character.stats = {
                        totalDamage: 0,
                        totalHealing: 0,
                        daCount: 0,
                        taCount: 0,
                        critCount: 0
                    };
                } else {
                    character.stats.totalDamage = 0;
                    character.stats.totalHealing = 0;
                    character.stats.daCount = 0;
                    character.stats.taCount = 0;
                    character.stats.critCount = 0;
                }

                // 重置战斗状态
                character.hasAttacked = false;

                // 初始化DA和TA概率
                if (!character.currentStats.daRate) {
                    character.currentStats.daRate = 0.15; // 默认15%双重攻击率
                }

                if (!character.currentStats.taRate) {
                    character.currentStats.taRate = 0.05; // 默认5%三重攻击率
                }

                // 区分前排和后排
                if (i < FRONT_LINE_COUNT) {
                    frontLineMembers.push(character);
                } else {
                    backLineMembers.push(character);
                }
            }
        }

        // 合并前排和后排，前排成员先上场
        const teamMembers = [...frontLineMembers];

        // 记录备用队员信息，供后续使用
        this.backLineMembers = backLineMembers;

        if (teamMembers.length === 0) {
            return { success: false, message: '队伍中没有角色' };
        }

        // 创建怪物角色对象（用于战斗计算）
        const monsterCharacter = {
            id: monster.id,
            name: monster.name,
            type: monster.type || 'attack',
            attribute: monster.attribute || 'fire',
            level: monster.level || 1,
            baseStats: {...monster.baseStats},
            currentStats: {...monster.currentStats},
            isBoss: monster.isBoss || false,
            isMiniBoss: monster.isMiniBoss || false,
            isFinalBoss: monster.isFinalBoss || false,
            traits: [],
            stats: { totalDamage: 0, totalHealing: 0 }
        };

        // 触发战斗开始事件
        if (typeof Events !== 'undefined') {
            Events.emit('battle:start', {
                team: team,
                monster: monster,
                dungeonName: monster.name
            });
        }

        // 记录战斗开始
        this.logBattle(`遇到了 ${monster.name}${monster.isBoss ? (monster.isMiniBoss ? '(小BOSS)' : '(大BOSS)') : ''}`);

        // 战斗循环
        let battleResult = this.processBattle(teamMembers, monsterCharacter);

        // 计算MVP
        let mvp = { mvpId: null, score: 0 };

        // 如果Character对象有assessBattleMVP方法，使用它
        if (typeof Character !== 'undefined' && typeof Character.assessBattleMVP === 'function') {
            mvp = Character.assessBattleMVP(team.members);
        } else {
            // 否则，自己计算MVP（基于伤害）
            let highestDamage = 0;
            for (const memberId of team.members) {
                const character = Character.getCharacter(memberId);
                if (character && character.stats && character.stats.totalDamage > highestDamage) {
                    highestDamage = character.stats.totalDamage;
                    mvp.mvpId = memberId;
                    mvp.score = highestDamage;
                }
            }
        }

        // 记录战斗结果
        if (battleResult.victory) {
            const totalDamage = team.members.reduce((sum, memberId) => {
                const character = Character.getCharacter(memberId);
                return sum + (character ? character.stats.totalDamage : 0);
            }, 0);

            const mvpCharacter = Character.getCharacter(mvp.mvpId);
            if (mvpCharacter) {
                const mvpDamagePercent = Math.round((mvpCharacter.stats.totalDamage / totalDamage) * 100);

                this.logBattle(`经历 ${this.currentTurn} 回合后，战胜了 ${monster.name}，本场战斗MVP: ${mvpCharacter.name}, 共造成 ${mvpCharacter.stats.totalDamage} 伤害，占比 ${mvpDamagePercent}%`);
            } else {
                this.logBattle(`经历 ${this.currentTurn} 回合后，战胜了 ${monster.name}`);
            }
        } else {
            this.logBattle(`经历 ${this.currentTurn} 回合后，被 ${monster.name} 击败了`);
        }

        // 触发战斗结束事件
        if (typeof Events !== 'undefined') {
            Events.emit('battle:end', {
                victory: battleResult.victory,
                team: team,
                monster: monster,
                dungeonName: monster.name,
                turns: this.currentTurn,
                mvp: mvp,
                gold: battleResult.gold || 0,
                exp: battleResult.exp || 0,
                battleStats: battleResult.battleStats || {}
            });
        }

        // 返回战斗结果
        return {
            success: true,
            victory: battleResult.victory,
            message: this.battleLog.join('\n'),
            turns: this.currentTurn,
            mvp: mvp,
            gold: battleResult.gold || 0,
            exp: battleResult.exp || 0,
            battleStats: battleResult.battleStats || {}
        };
    },

    /**
     * 处理战斗过程
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物角色对象
     * @returns {object} 战斗结果
     */
    processBattle(teamMembers, monster) {
        // 最大回合数限制，防止无限循环
        const MAX_TURNS = 99;

        // 初始化怪物HP
        monster.currentStats.hp = monster.currentStats.maxHp || monster.currentStats.hp;

        // 初始化战斗统计
        const battleStats = {
            totalDamage: 0,
            totalHealing: 0,
            characterStats: {},
            monsterStats: {
                totalDamage: 0,
                totalHealing: 0
            }
        };

        // 初始化角色统计
        for (const member of teamMembers) {
            battleStats.characterStats[member.id] = {
                totalDamage: 0,
                totalHealing: 0,
                daCount: 0,
                taCount: 0,
                critCount: 0,
                buffsApplied: 0,
                debuffsApplied: 0
            };

            // 初始化角色BUFF
            if (!member.buffs) {
                member.buffs = [];
            }

            // 触发战斗开始时的特性
            this.processBattleStartTraits(member, teamMembers);
        }

        // 初始化怪物BUFF
        if (!monster.buffs) {
            monster.buffs = [];
        }

        // 战斗循环
        while (this.currentTurn < MAX_TURNS) {
            this.currentTurn++;
            this.logBattle(`##### 回合 ${this.currentTurn} #####`);

            // 处理回合开始时的BUFF效果
            this.processTurnStartBuffs(teamMembers, monster);

            // 处理队伍成员和怪物的行动顺序（按速度排序）
            const allEntities = [...teamMembers, monster].sort((a, b) =>
                (b.currentStats.speed || 0) - (a.currentStats.speed || 0)
            );

            // 处理每个实体的行动
            for (const entity of allEntities) {
                // 检查战斗是否已结束
                if (this.isBattleOver(teamMembers, monster)) {
                    break;
                }

                // 检查实体是否存活
                if (entity.currentStats.hp <= 0) {
                    continue;
                }

                // 检查实体是否被眩晕
                if (this.isStunned(entity)) {
                    this.logBattle(`${entity.name} 被眩晕，无法行动！`);
                    continue;
                }

                // 处理实体行动
                if (entity === monster) {
                    // 怪物行动
                    this.processMonsterAction(monster, teamMembers, battleStats);
                } else {
                    // 角色行动
                    this.logBattle(`开始角色行动`);
                    this.processCharacterAction(entity, monster, battleStats);
                }
            }

            // 更新BUFF持续时间
            this.updateBuffDurations(teamMembers, monster);

            // 检查战斗是否已结束
            if (this.isBattleOver(teamMembers, monster)) {
                break;
            }

            // 第一回合结束
            if (this.currentTurn === 1) {
                this.isFirstTurn = false;
            }
        }

        // 判断战斗结果
        const teamAlive = teamMembers.some(member => member.currentStats.hp > 0);
        const monsterAlive = monster.currentStats.hp > 0;

        // 计算奖励
        let gold = 0;
        let exp = 0;

        if (teamAlive && !monsterAlive) {
            // 队伍胜利
            this.logBattle(`===== 战斗胜利！=====`);

            if (monster.goldReward) {
                gold = Math.floor(Math.random() *
                    (monster.goldReward.max - monster.goldReward.min + 1)) +
                    monster.goldReward.min;
                this.logBattle(`获得 ${gold} 金币！`);
            }

            if (monster.xpReward) {
                exp = monster.xpReward;
                this.logBattle(`获得 ${exp} 经验值！`);
            }

            // 战斗结束后恢复25%HP
            for (const member of teamMembers) {
                if (member.currentStats.hp > 0) {
                    const healAmount = Math.floor(member.currentStats.maxHp * 0.25);
                    member.currentStats.hp = Math.min(
                        member.currentStats.hp + healAmount,
                        member.currentStats.maxHp
                    );
                    this.logBattle(`${member.name} 恢复了 ${healAmount} 点生命值！`);
                }
            }

            // 清除所有BUFF
            for (const member of teamMembers) {
                if (typeof BuffSystem !== 'undefined') {
                    BuffSystem.clearAllBuffs(member);
                } else {
                    member.buffs = [];
                }
            }

            return {
                victory: true,
                gold,
                exp,
                battleStats,
                turns: this.currentTurn,
                battleLog: this.battleLog
            };
        } else {
            // 队伍失败
            this.logBattle(`===== 战斗失败！=====`);

            // 清除所有BUFF
            for (const member of teamMembers) {
                if (typeof BuffSystem !== 'undefined') {
                    BuffSystem.clearAllBuffs(member);
                } else {
                    member.buffs = [];
                }
            }

            return {
                victory: false,
                battleStats,
                turns: this.currentTurn,
                battleLog: this.battleLog
            };
        }
    },

    /**
     * 处理战斗开始时的特性触发
     * @param {object} character - 角色对象
     * @param {array} teamMembers - 队伍成员
     */
    processBattleStartTraits(character, teamMembers) {
        if (!character || !character.traits) return;

        for (const traitId of character.traits) {
            if (!traitId) continue;
            const trait = Character.traits[traitId];
            if (trait && trait.type === 'passive' && trait.triggerTiming === 'battleStart') {
                if (trait.effect) {
                    const result = trait.effect(character, character.currentStats, teamMembers);
                    if (result && result.message) {
                        this.logBattle(`${character.name} 的特性 ${trait.name} 触发：${result.message}`);
                    }
                }
            }
        }
    },

    /**
     * 处理回合开始时的BUFF效果
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     */
    processTurnStartBuffs(teamMembers, monster) {
        // 处理队伍成员的BUFF
        for (const member of teamMembers) {
            if (member.currentStats.hp <= 0) continue;

            if (typeof BuffSystem !== 'undefined') {
                const result = BuffSystem.processBuffsAtTurnStart(member);

                if (result.damage > 0) {
                    this.logBattle(`${member.name} 受到 ${result.damage} 点持续伤害！`);
                }

                if (result.healing > 0) {
                    this.logBattle(`${member.name} 恢复了 ${result.healing} 点生命值！`);
                }
            }
        }

        // 处理怪物的BUFF
        if (monster.currentStats.hp > 0 && typeof BuffSystem !== 'undefined') {
            const result = BuffSystem.processBuffsAtTurnStart(monster);

            if (result.damage > 0) {
                this.logBattle(`${monster.name} 受到 ${result.damage} 点持续伤害！`);
            }

            if (result.healing > 0) {
                this.logBattle(`${monster.name} 恢复了 ${result.healing} 点生命值！`);
            }
        }
    },

    /**
     * 更新BUFF持续时间
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     */
    updateBuffDurations(teamMembers, monster) {
        // 更新队伍成员的BUFF
        for (const member of teamMembers) {
            if (typeof BuffSystem !== 'undefined') {
                const expiredBuffs = BuffSystem.updateBuffDurations(member);

                for (const buff of expiredBuffs) {
                    this.logBattle(`${member.name} 的 ${buff.name} 效果已结束！`);
                }
            }

            // 更新技能冷却
            if (member.skillCooldowns) {
                for (const skillId in member.skillCooldowns) {
                    if (member.skillCooldowns[skillId] > 0) {
                        member.skillCooldowns[skillId]--;
                        if (member.skillCooldowns[skillId] === 0) {
                            // 首先尝试从JobSystem获取技能
                            let skill = null;
                            if (typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                                skill = JobSystem.getSkill(skillId);
                            }

                            // 如果JobSystem中没有找到，尝试从JobSkillsTemplate获取
                            if (!skill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
                                skill = JobSkillsTemplate.templates[skillId];
                            }

                            if (skill) {
                                this.logBattle(`${member.name} 的技能 ${skill.name} 冷却结束，可以再次使用！`);
                            } else {
                                this.logBattle(`${member.name} 的技能 ${skillId} 冷却结束，可以再次使用！`);
                            }
                        }
                    }
                }
            }
        }

        // 更新怪物的BUFF
        if (typeof BuffSystem !== 'undefined') {
            const expiredBuffs = BuffSystem.updateBuffDurations(monster);

            for (const buff of expiredBuffs) {
                this.logBattle(`${monster.name} 的 ${buff.name} 效果已结束！`);
            }
        }

        // 更新怪物技能冷却
        if (monster.skillCooldowns) {
            for (const skillId in monster.skillCooldowns) {
                if (monster.skillCooldowns[skillId] > 0) {
                    monster.skillCooldowns[skillId]--;
                    if (monster.skillCooldowns[skillId] === 0) {
                        // 首先尝试从bossSkills获取技能
                        let skill = null;

                        // 如果有全局的bossSkills对象
                        if (typeof window !== 'undefined' && window.bossSkills && window.bossSkills[skillId]) {
                            skill = window.bossSkills[skillId];
                        }

                        // 如果JobSystem中有这个技能
                        if (!skill && typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                            skill = JobSystem.getSkill(skillId);
                        }

                        // 如果JobSkillsTemplate中有这个技能
                        if (!skill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
                            skill = JobSkillsTemplate.templates[skillId];
                        }

                        if (skill) {
                            this.logBattle(`${monster.name} 的技能 ${skill.name} 冷却结束，可以再次使用！`);
                        } else {
                            this.logBattle(`${monster.name} 的技能 ${skillId} 冷却结束，可以再次使用！`);
                        }
                    }
                }
            }
        }
    },

    /**
     * 检查实体是否被眩晕
     * @param {object} entity - 实体对象
     * @returns {boolean} 是否被眩晕
     */
    isStunned(entity) {
        if (!entity || !entity.buffs) return false;

        return entity.buffs.some(buff => buff.type === 'stun');
    },

    /**
     * 处理角色行动
     * @param {object} character - 角色对象
     * @param {object} monster - 怪物对象
     * @param {object} battleStats - 战斗统计
     */
    processCharacterAction(character, monster, battleStats) {
        this.logBattle(`检查角色是否存活`);
        // 检查角色是否存活
        if (character.currentStats.hp <= 0) return;

        // 处理角色特性触发
        let triggeredEffects = [];

        // 如果Character对象有processTraitTriggers方法，使用它
        if (typeof Character !== 'undefined' && typeof Character.processTraitTriggers === 'function') {
            triggeredEffects = Character.processTraitTriggers(character.id, 'attack', { target: monster });
        }


        this.logBattle(`应用特性效果`);
        // 应用特性效果
        for (const effect of triggeredEffects) {
            if (effect.message) {
                this.logBattle(`${character.name} ${effect.message}`);
            }
        }

        // 1. 使用技能阶段
        this.logBattle(`\n----- ${character.name} 技能阶段 -----`);

        // 初始化技能冷却
        if (!character.skillCooldowns) {
            character.skillCooldowns = {};
        }

        // 获取可用技能（没有冷却的主动技能）
        const availableSkills = character.skills ? character.skills.filter(skillId => {
            // 首先检查冷却
            if (character.skillCooldowns[skillId] && character.skillCooldowns[skillId] > 0) {
                return false;
            }

            // 然后检查是否是被动技能
            let skill = null;

            // 从JobSystem获取技能
            if (typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                skill = JobSystem.getSkill(skillId);
            }

            // 如果JobSystem中没有找到，尝试从JobSkillsTemplate获取
            if (!skill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
                skill = JobSkillsTemplate.templates[skillId];
            }

            // 如果找到了技能，检查是否是被动技能
            if (skill) {
                // 如果技能有passive属性且为true，则是被动技能，不应该主动使用
                return !skill.passive;
            }

            // 如果找不到技能定义，默认认为是主动技能
            return true;
        }) : [];

        if (availableSkills && availableSkills.length > 0) {
            this.logBattle(`${character.name} 有 ${availableSkills.length} 个可用技能`);

            // 使用所有可用技能
            for (const skillId of availableSkills) {
                // 首先尝试从JobSystem获取技能
                let skill = null;
                if (typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                    skill = JobSystem.getSkill(skillId);
                }

                // 如果JobSystem中没有找到，尝试从JobSkillsTemplate获取
                if (!skill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
                    skill = JobSkillsTemplate.templates[skillId];
                }

                if (!skill) {
                    this.logBattle(`找不到技能 ${skillId} 的定义，跳过使用`);
                    continue;
                }

                this.logBattle(`${character.name} 使用技能: ${skill.name}`);

                // 使用技能
                if (typeof JobSkills !== 'undefined' && typeof JobSkills.useSkill === 'function') {
                    try {
                        // 确保Character对象中有角色
                        if (typeof Character !== 'undefined' && !Character.characters[character.id]) {
                            Character.characters[character.id] = character;
                            this.logBattle(`将角色 ${character.name} 添加到Character.characters中`);
                        }

                        // 确保JobSkillsTemplate中有技能模板
                        if (typeof JobSkillsTemplate !== 'undefined' && !JobSkillsTemplate.templates[skillId]) {
                            JobSkillsTemplate.templates[skillId] = skill;
                            this.logBattle(`将技能 ${skill.name} 添加到JobSkillsTemplate.templates中`);
                        }

                        // 使用技能
                        const result = JobSkills.useSkill(character.id, skillId, [character], monster);

                        if (result.success) {
                            this.logBattle(result.message);

                            // 设置技能冷却
                            if (skill.cooldown) {
                                character.skillCooldowns[skillId] = skill.cooldown;
                                this.logBattle(`技能 ${skill.name} 进入冷却状态 (${skill.cooldown} 回合)`);
                            }
                        } else {
                            this.logBattle(`技能使用失败: ${result.message || '未知原因'}`);
                        }
                    } catch (error) {
                        this.logBattle(`技能使用出错: ${error.message}`);
                        console.error("技能使用错误:", error);
                    }
                } else {
                    this.logBattle(`技能系统不可用，跳过技能使用`);
                }
            }
        } else {
            this.logBattle(`${character.name} 没有可用的技能 (所有技能都在冷却中)`);
        }

        // 2. 普通攻击阶段
        this.logBattle(`\n----- ${character.name} 普通攻击阶段 -----`);

        // 显示当前BUFF信息
        if (character.buffs && character.buffs.length > 0) {
            this.logBattle(`${character.name} 当前BUFF:`);
            for (const buff of character.buffs) {
                const source = buff.source ? `(来自: ${buff.source.name})` : '';
                const duration = buff.duration > 0 ? `(剩余: ${buff.duration}回合)` : '';
                this.logBattle(`- ${buff.name}: ${buff.description} ${source} ${duration}`);
            }
        }

        // 计算DA和TA率
        let daRate = character.currentStats.daRate || 0.15; // 基础DA率15%
        let taRate = character.currentStats.taRate || 0.05; // 基础TA率5%

        // 应用BUFF效果
        if (character.buffs) {
            for (const buff of character.buffs) {
                if (buff.type === 'daBoost') {
                    daRate += buff.value;
                    this.logBattle(`DA率提升: +${buff.value * 100}% (来自: ${buff.name})`);
                }
                if (buff.type === 'taBoost') {
                    taRate += buff.value;
                    this.logBattle(`TA率提升: +${buff.value * 100}% (来自: ${buff.name})`);
                }
            }
        }

        // 应用被动技能效果
        if (character.skills) {
            for (const skillId of character.skills) {
                // 获取技能定义
                let skill = null;

                // 从JobSystem获取技能
                if (typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                    skill = JobSystem.getSkill(skillId);
                }

                // 如果JobSystem中没有找到，尝试从JobSkillsTemplate获取
                if (!skill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
                    skill = JobSkillsTemplate.templates[skillId];
                }

                // 如果找到了技能，并且是被动技能
                if (skill && (skill.passive || (skill.effects && skill.effects.some(e => e.passive)))) {
                    this.logBattle(`应用被动技能: ${skill.name}`);

                    // 应用被动技能效果
                    if (skill.effects) {
                        for (const effect of skill.effects) {
                            if (effect.passive) {
                                // DA和TA提升
                                if (effect.type === 'daBoost') {
                                    daRate += effect.value;
                                    this.logBattle(`DA率提升: +${effect.value * 100}% (来自被动技能: ${skill.name})`);
                                }
                                if (effect.type === 'taBoost') {
                                    taRate += effect.value;
                                    this.logBattle(`TA率提升: +${effect.value * 100}% (来自被动技能: ${skill.name})`);
                                }

                                // 攻击力提升
                                if (effect.type === 'attackUp') {
                                    const attackBoost = character.currentStats.attack * effect.value;
                                    character.currentStats.attack += attackBoost;
                                    this.logBattle(`攻击力提升: +${Math.floor(attackBoost)} (来自被动技能: ${skill.name})`);
                                }

                                // 防御力提升
                                if (effect.type === 'defenseUp') {
                                    const defenseBoost = character.currentStats.defense * effect.value;
                                    character.currentStats.defense += defenseBoost;
                                    this.logBattle(`防御力提升: +${Math.floor(defenseBoost)} (来自被动技能: ${skill.name})`);
                                }

                                // 生命值提升
                                if (effect.type === 'hpUp') {
                                    const hpBoost = character.currentStats.maxHp * effect.value;
                                    character.currentStats.maxHp += hpBoost;
                                    character.currentStats.hp += hpBoost;
                                    this.logBattle(`生命值提升: +${Math.floor(hpBoost)} (来自被动技能: ${skill.name})`);
                                }

                                // 暴击率提升
                                if (effect.type === 'critRateUp') {
                                    character.currentStats.critRate = (character.currentStats.critRate || 0.05) + effect.value;
                                    this.logBattle(`暴击率提升: +${effect.value * 100}% (来自被动技能: ${skill.name})`);
                                }

                                // 暴击伤害提升
                                if (effect.type === 'critDamageUp') {
                                    character.currentStats.critDamage = (character.currentStats.critDamage || 1.5) + effect.value;
                                    this.logBattle(`暴击伤害提升: +${effect.value * 100}% (来自被动技能: ${skill.name})`);
                                }
                            }
                        }
                    }
                }
            }
        }

        // 显示最终DA和TA率
        this.logBattle(`${character.name} 当前DA率: ${(daRate * 100).toFixed(1)}%, TA率: ${(taRate * 100).toFixed(1)}%`);

        // 决定攻击类型
        const roll = Math.random();
        let attackCount = 1;
        let attackType = "普通攻击";
        let isDA = false;
        let isTA = false;

        if (roll < taRate) {
            attackCount = 3;
            attackType = "三重攻击";
            isTA = true;
            character.stats.taCount++;
            this.logBattle(`${character.name} 触发三重攻击！(概率: ${(taRate * 100).toFixed(1)}%)`);
        } else if (roll < taRate + daRate) {
            attackCount = 2;
            attackType = "双重攻击";
            isDA = true;
            character.stats.daCount++;
            this.logBattle(`${character.name} 触发双重攻击！(概率: ${(daRate * 100).toFixed(1)}%)`);
        }

        // 执行攻击
        let totalDamage = 0;
        for (let i = 0; i < attackCount; i++) {
            // 检查目标是否已被击败
            if (monster.currentStats.hp <= 0) break;

            // 计算伤害
            const rawDamage = Math.floor(character.currentStats.attack * (100 - monster.currentStats.defense) / 100);
            const damageResult = JobSkills.applyDamageToTarget(character, monster, rawDamage, {
                isMultiAttack: i > 0, // 第一次攻击不是多重攻击
                skipStats: true, // 不计入角色总伤害统计（我们会在最后统一计算）
                skipCritical: false // 允许暴击
            });

            // 应用伤害
            monster.currentStats.hp = Math.max(0, monster.currentStats.hp - damageResult.damage);

            // 累计伤害
            totalDamage += damageResult.damage;

            // 记录暴击次数
            if (damageResult.isCritical) {
                character.stats.critCount++;
            }

            // 记录战斗日志
            let damageMessage = `${character.name} `;

            if (i === 0) {
                damageMessage += `${attackType}，`;
            } else {
                damageMessage += `第${i+1}次攻击 `;
            }

            damageMessage += `对 ${monster.name} 造成 ${damageResult.damage} 点伤害`;

            if (damageResult.isCritical) {
                damageMessage += '（暴击！）';
            }

            if (damageResult.attributeBonus > 0) {
                damageMessage += '（属性克制！）';
            } else if (damageResult.attributeBonus < 0) {
                damageMessage += '（属性被克制！）';
            }

            this.logBattle(damageMessage);
        }

        if (attackCount > 1) {
            this.logBattle(`${character.name} 总共造成 ${totalDamage} 点伤害！`);
        }

        // 更新角色伤害统计
        character.stats.totalDamage += totalDamage;

        // 更新战斗统计
        if (battleStats && battleStats.characterStats && battleStats.characterStats[character.id]) {
            battleStats.characterStats[character.id].totalDamage += totalDamage;
            battleStats.totalDamage += totalDamage;

            if (isDA) {
                battleStats.characterStats[character.id].daCount++;
            }

            if (isTA) {
                battleStats.characterStats[character.id].taCount++;
            }
        }

        // 检查怪物是否被击败
        if (monster.currentStats.hp <= 0) {
            this.logBattle(`${monster.name} 被击败了！`);
        }
    },

    /**
     * 处理怪物行动
     * @param {object} monster - 怪物对象
     * @param {array} teamMembers - 队伍成员
     * @param {object} battleStats - 战斗统计
     */
    processMonsterAction(monster, teamMembers, battleStats) {
        // 检查怪物是否存活
        if (monster.currentStats.hp <= 0) return;

        // 选择目标（简单AI：随机选择一个存活的队伍成员）
        const aliveMembers = teamMembers.filter(member => member.currentStats.hp > 0);
        if (aliveMembers.length === 0) return;

        const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];

        // 1. 使用技能阶段
        this.logBattle(`\n----- ${monster.name} 技能阶段 -----`);

        // 初始化技能冷却
        if (!monster.skillCooldowns) {
            monster.skillCooldowns = {};
        }

        // 获取可用技能（没有冷却的主动技能）
        const availableSkills = monster.skills ? monster.skills.filter(skillId => {
            // 首先检查冷却
            if (monster.skillCooldowns[skillId] && monster.skillCooldowns[skillId] > 0) {
                return false;
            }

            // 然后检查是否是被动技能
            let skill = null;

            // 如果有全局的bossSkills对象
            if (typeof window !== 'undefined' && window.bossSkills && window.bossSkills[skillId]) {
                skill = window.bossSkills[skillId];
            }

            // 如果JobSystem中有这个技能
            if (!skill && typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                skill = JobSystem.getSkill(skillId);
            }

            // 如果JobSkillsTemplate中有这个技能
            if (!skill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
                skill = JobSkillsTemplate.templates[skillId];
            }

            // 如果找到了技能，检查是否是被动技能
            if (skill) {
                // 如果技能有passive属性且为true，则是被动技能，不应该主动使用
                return !skill.passive;
            }

            // 如果找不到技能定义，默认认为是主动技能
            return true;
        }) : [];

        let usedSkill = false;

        if (availableSkills && availableSkills.length > 0) {
            // 随机选择一个技能
            const skillId = availableSkills[Math.floor(Math.random() * availableSkills.length)];

            // 首先尝试从bossSkills获取技能
            let skill = null;

            // 如果有全局的bossSkills对象
            if (typeof window !== 'undefined' && window.bossSkills && window.bossSkills[skillId]) {
                skill = window.bossSkills[skillId];
            }

            // 如果JobSystem中有这个技能
            if (!skill && typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                skill = JobSystem.getSkill(skillId);
            }

            // 如果JobSkillsTemplate中有这个技能
            if (!skill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
                skill = JobSkillsTemplate.templates[skillId];
            }

            if (skill) {
                this.logBattle(`${monster.name} 选择使用技能: ${skill.name}`);

                // 使用技能
                try {
                    // 确保BOSS有ID
                    if (!monster.id) {
                        monster.id = `boss_${Date.now()}`;
                    }

                    // 确保Character对象中有BOSS
                    if (typeof Character !== 'undefined') {
                        Character.characters = Character.characters || {};
                        Character.characters[monster.id] = monster;
                    }

                    // 确保JobSkillsTemplate中有技能模板
                    if (typeof JobSkillsTemplate !== 'undefined' && !JobSkillsTemplate.templates[skillId]) {
                        JobSkillsTemplate.templates[skillId] = skill;
                    }

                    // 尝试使用JobSkills.useSkill方法
                    if (typeof JobSkills !== 'undefined' && typeof JobSkills.useSkill === 'function') {
                        try {
                            const result = JobSkills.useSkill(monster.id, skillId, [monster], target);
                            if (result.success) {
                                this.logBattle(result.message);

                                // 设置技能冷却
                                monster.skillCooldowns[skillId] = skill.cooldown || 3;
                                this.logBattle(`技能 ${skill.name} 进入冷却状态 (${skill.cooldown || 3} 回合)`);

                                usedSkill = true;
                            } else {
                                this.logBattle(`BOSS技能使用失败: ${result.message || '未知原因'}`);
                            }
                        } catch (error) {
                            this.logBattle(`BOSS技能使用出错: ${error.message}`);
                            console.error("BOSS技能使用错误:", error);
                        }
                    }

                    // 如果JobSkills.useSkill不可用或失败，手动处理技能效果
                    if (!usedSkill) {
                        if (skill.effectType === 'damage' || skill.effectType === 'damage_and_debuff') {
                            // 计算伤害
                            let damage = 0;
                            for (const effect of skill.effects) {
                                if (effect.type === 'damage') {
                                    const multiplier = effect.multiplier || 1.0;
                                    // 增加基础伤害，以适应更高的生命值
                                    damage += Math.floor(monster.currentStats.attack * multiplier * (100 - target.currentStats.defense) / 100);
                                }
                            }

                            // 应用伤害
                            target.currentStats.hp = Math.max(0, target.currentStats.hp - damage);

                            // 更新怪物伤害统计
                            monster.stats.totalDamage += damage;

                            // 更新战斗统计
                            if (battleStats && battleStats.monsterStats) {
                                battleStats.monsterStats.totalDamage += damage;
                            }

                            this.logBattle(`${monster.name} 使用了 ${skill.name}，对 ${target.name} 造成 ${damage} 点伤害！`);

                            // 应用debuff
                            if (skill.effectType === 'damage_and_debuff') {
                                for (const effect of skill.effects) {
                                    if (effect.type !== 'damage') {
                                        this.logBattle(`${target.name} 受到了 ${effect.type} 效果！`);

                                        // 如果有BuffSystem，应用debuff
                                        if (typeof BuffSystem !== 'undefined') {
                                            const buff = BuffSystem.createBuff(effect.type, effect.value, effect.duration || 3, monster);
                                            if (buff) {
                                                BuffSystem.applyBuff(target, buff);
                                            }
                                        }
                                    }
                                }
                            }
                        } else if (skill.effectType === 'buff') {
                            // 应用buff
                            this.logBattle(`${monster.name} 使用了 ${skill.name}，获得了增益效果！`);

                            // 如果有BuffSystem，应用buff
                            if (typeof BuffSystem !== 'undefined') {
                                for (const effect of skill.effects) {
                                    const buff = BuffSystem.createBuff(effect.type, effect.value, effect.duration || 3, monster);
                                    if (buff) {
                                        BuffSystem.applyBuff(monster, buff);
                                    }
                                }
                            }
                        } else if (skill.effectType === 'debuff') {
                            // 应用debuff
                            this.logBattle(`${monster.name} 使用了 ${skill.name}，对 ${target.name} 施加了减益效果！`);

                            // 如果有BuffSystem，应用debuff
                            if (typeof BuffSystem !== 'undefined') {
                                for (const effect of skill.effects) {
                                    const buff = BuffSystem.createBuff(effect.type, effect.value, effect.duration || 3, monster);
                                    if (buff) {
                                        BuffSystem.applyBuff(target, buff);
                                    }
                                }
                            }
                        }

                        // 设置技能冷却
                        monster.skillCooldowns[skillId] = skill.cooldown || 3;
                        this.logBattle(`技能 ${skill.name} 进入冷却状态 (${skill.cooldown || 3} 回合)`);

                        usedSkill = true;
                    }
                } catch (error) {
                    this.logBattle(`BOSS技能使用出错: ${error.message}`);
                    console.error("BOSS技能使用错误:", error);
                }
            }
        }

        // 2. 普通攻击阶段（如果没有使用技能）
        if (!usedSkill) {
            this.logBattle(`\n----- ${monster.name} 普通攻击阶段 -----`);

            // 显示当前BUFF信息
            if (monster.buffs && monster.buffs.length > 0) {
                this.logBattle(`${monster.name} 当前BUFF:`);
                for (const buff of monster.buffs) {
                    const source = buff.source ? `(来自: ${buff.source.name})` : '';
                    const duration = buff.duration > 0 ? `(剩余: ${buff.duration}回合)` : '';
                    this.logBattle(`- ${buff.name}: ${buff.description} ${source} ${duration}`);
                }
            }

            // 计算DA和TA率
            let daRate = monster.currentStats.daRate || 0.1; // 怪物默认10%双重攻击率
            let taRate = monster.currentStats.taRate || 0.03; // 怪物默认3%三重攻击率

            // 应用BUFF效果
            if (monster.buffs) {
                for (const buff of monster.buffs) {
                    if (buff.type === 'daBoost') {
                        daRate += buff.value;
                        this.logBattle(`BOSS DA率提升: +${buff.value * 100}% (来自: ${buff.name})`);
                    }
                    if (buff.type === 'taBoost') {
                        taRate += buff.value;
                        this.logBattle(`BOSS TA率提升: +${buff.value * 100}% (来自: ${buff.name})`);
                    }
                }
            }

            // 应用被动技能效果
            if (monster.skills) {
                for (const skillId of monster.skills) {
                    // 获取技能定义
                    let skill = null;

                    // 如果有全局的bossSkills对象
                    if (typeof window !== 'undefined' && window.bossSkills && window.bossSkills[skillId]) {
                        skill = window.bossSkills[skillId];
                    }

                    // 如果JobSystem中有这个技能
                    if (!skill && typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                        skill = JobSystem.getSkill(skillId);
                    }

                    // 如果JobSkillsTemplate中有这个技能
                    if (!skill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
                        skill = JobSkillsTemplate.templates[skillId];
                    }

                    // 如果找到了技能，并且是被动技能
                    if (skill && (skill.passive || (skill.effects && skill.effects.some(e => e.passive)))) {
                        this.logBattle(`应用BOSS被动技能: ${skill.name}`);

                        // 应用被动技能效果
                        if (skill.effects) {
                            for (const effect of skill.effects) {
                                if (effect.passive) {
                                    // DA和TA提升
                                    if (effect.type === 'daBoost') {
                                        daRate += effect.value;
                                        this.logBattle(`BOSS DA率提升: +${effect.value * 100}% (来自被动技能: ${skill.name})`);
                                    }
                                    if (effect.type === 'taBoost') {
                                        taRate += effect.value;
                                        this.logBattle(`BOSS TA率提升: +${effect.value * 100}% (来自被动技能: ${skill.name})`);
                                    }

                                    // 攻击力提升
                                    if (effect.type === 'attackUp') {
                                        const attackBoost = monster.currentStats.attack * effect.value;
                                        monster.currentStats.attack += attackBoost;
                                        this.logBattle(`BOSS攻击力提升: +${Math.floor(attackBoost)} (来自被动技能: ${skill.name})`);
                                    }

                                    // 防御力提升
                                    if (effect.type === 'defenseUp') {
                                        const defenseBoost = monster.currentStats.defense * effect.value;
                                        monster.currentStats.defense += defenseBoost;
                                        this.logBattle(`BOSS防御力提升: +${Math.floor(defenseBoost)} (来自被动技能: ${skill.name})`);
                                    }

                                    // 生命值提升
                                    if (effect.type === 'hpUp') {
                                        const hpBoost = monster.currentStats.maxHp * effect.value;
                                        monster.currentStats.maxHp += hpBoost;
                                        monster.currentStats.hp += hpBoost;
                                        this.logBattle(`BOSS生命值提升: +${Math.floor(hpBoost)} (来自被动技能: ${skill.name})`);
                                    }

                                    // 暴击率提升
                                    if (effect.type === 'critRateUp') {
                                        monster.currentStats.critRate = (monster.currentStats.critRate || 0.05) + effect.value;
                                        this.logBattle(`BOSS暴击率提升: +${effect.value * 100}% (来自被动技能: ${skill.name})`);
                                    }

                                    // 暴击伤害提升
                                    if (effect.type === 'critDamageUp') {
                                        monster.currentStats.critDamage = (monster.currentStats.critDamage || 1.5) + effect.value;
                                        this.logBattle(`BOSS暴击伤害提升: +${effect.value * 100}% (来自被动技能: ${skill.name})`);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 显示最终DA和TA率
            this.logBattle(`${monster.name} 当前DA率: ${(daRate * 100).toFixed(1)}%, TA率: ${(taRate * 100).toFixed(1)}%`);

            // 决定攻击类型
            const roll = Math.random();
            let attackCount = 1;
            let attackType = "普通攻击";

            if (roll < taRate) {
                attackCount = 3;
                attackType = "三重攻击";
                this.logBattle(`${monster.name} 触发三重攻击！(概率: ${(taRate * 100).toFixed(1)}%)`);
            } else if (roll < taRate + daRate) {
                attackCount = 2;
                attackType = "双重攻击";
                this.logBattle(`${monster.name} 触发双重攻击！(概率: ${(daRate * 100).toFixed(1)}%)`);
            }

            // 执行攻击
            let totalDamage = 0;
            for (let i = 0; i < attackCount; i++) {
                // 检查目标是否已被击败
                if (target.currentStats.hp <= 0) break;

                // 计算伤害
                const rawDamage = Math.floor(monster.currentStats.attack * (100 - target.currentStats.defense) / 100);
                const damageResult = JobSkills.applyDamageToTarget(monster, target, rawDamage, {
                    isMultiAttack: i > 0, // 第一次攻击不是多重攻击
                    skipStats: true, // 不计入怪物总伤害统计（我们会在最后统一计算）
                    skipCritical: false // 允许暴击
                });

                // 应用伤害
                target.currentStats.hp = Math.max(0, target.currentStats.hp - damageResult.damage);

                // 累计伤害
                totalDamage += damageResult.damage;

                // 记录暴击次数
                if (damageResult.isCritical) {
                    monster.stats.critCount++;
                }

                // 记录战斗日志
                let damageMessage = `${monster.name} `;

                if (i === 0) {
                    damageMessage += `${attackType}，`;
                } else {
                    damageMessage += `第${i+1}次攻击 `;
                }

                damageMessage += `对 ${target.name} 造成 ${damageResult.damage} 点伤害`;

                if (damageResult.isCritical) {
                    damageMessage += '（暴击！）';
                }

                if (damageResult.attributeBonus > 0) {
                    damageMessage += '（属性克制！）';
                } else if (damageResult.attributeBonus < 0) {
                    damageMessage += '（属性被克制！）';
                }

                this.logBattle(damageMessage);
            }

            if (attackCount > 1) {
                this.logBattle(`${monster.name} 总共造成 ${totalDamage} 点伤害！`);
            }

            // 更新怪物伤害统计
            monster.stats.totalDamage += totalDamage;

            // 更新战斗统计
            if (battleStats && battleStats.monsterStats) {
                battleStats.monsterStats.totalDamage += totalDamage;
            }
        }

        // 检查角色是否被击败
        if (target.currentStats.hp <= 0) {
            this.logBattle(`${target.name} 被击败了！`);

            // 检查是否有备用队友可以上场
            if (this.backLineMembers && this.backLineMembers.length > 0) {
                // 获取一个备用队友
                const backup = this.backLineMembers.shift();

                // 将阵亡角色移到队伍最后（备用队友列表末尾）
                this.backLineMembers.push(target);

                // 将备用队友加入战斗队伍
                const targetIndex = teamMembers.findIndex(member => member.id === target.id);
                if (targetIndex !== -1) {
                    teamMembers[targetIndex] = backup;
                    this.logBattle(`${backup.name} 从后排上场替换阵亡的 ${target.name}！`);
                }
            }
        }
    },

    /**
     * 检查战斗是否结束
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {boolean} 战斗是否结束
     */
    isBattleOver(teamMembers, monster) {
        // 检查怪物是否被击败
        if (monster.currentStats.hp <= 0) {
            return true;
        }

        // 检查队伍是否全灭
        const allDefeated = teamMembers.every(member => member.currentStats.hp <= 0);
        return allDefeated;
    },

    /**
     * 处理攻击概率触发效果
     * @param {object} source - 攻击来源
     * @param {object} target - 攻击目标
     * @param {object} battleStats - 战斗统计
     */
    processAttackProcEffects(source, target, battleStats) {
        if (!source || !source.skills) return;

        // 遍历角色的所有技能
        for (const skillId of source.skills) {
            // 获取技能定义
            let skill = null;

            // 从JobSystem获取技能
            if (typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                skill = JobSystem.getSkill(skillId);
            }

            // 如果JobSystem中没有找到，尝试从JobSkillsTemplate获取
            if (!skill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
                skill = JobSkillsTemplate.templates[skillId];
            }

            // 如果找到了技能，并且是被动技能
            if (skill && skill.passive && skill.effects) {
                for (const effect of skill.effects) {
                    if (effect.type === 'proc' && effect.onAttack) {
                        // 检查触发概率
                        const roll = Math.random();
                        if (roll < (effect.chance || 0.3)) {
                            this.logBattle(`${source.name} 的被动技能【${skill.name}】触发！`);
                            this.logBattle(`技能描述: ${skill.description}`);

                            // 处理伤害效果
                            if (effect.effect && effect.effect.type === 'damage') {
                                const procMultiplier = effect.effect.multiplier || 1.0;

                                // 计算原始伤害
                                const rawDamage = source.currentStats.attack * procMultiplier;
                                this.logBattle(`原始伤害: ${Math.floor(rawDamage)}`);

                                // 使用JobSkills.applyDamageToTarget方法计算实际伤害
                                let actualDamage = 0;

                                if (typeof JobSkills !== 'undefined' && typeof JobSkills.applyDamageToTarget === 'function') {
                                    this.logBattle(`使用JobSkills.applyDamageToTarget计算伤害`);
                                    // 使用JobSkills.applyDamageToTarget方法，添加skipCritical选项
                                    actualDamage = JobSkills.applyDamageToTarget(source, target, rawDamage, {
                                        skipCritical: true, // 跳过暴击计算
                                        isSpecialAttack: true // 标记为特殊攻击
                                    });
                                } else {
                                    this.logBattle(`JobSkills.applyDamageToTarget不可用，尝试使用Character.calculateDamage`);
                                    // 如果JobSkills.applyDamageToTarget不可用，使用Character.calculateDamage方法
                                    if (typeof Character !== 'undefined' && typeof Character.calculateDamage === 'function') {
                                        // 确保Character.characters中有source和target
                                        if (typeof Character.characters !== 'undefined') {
                                            Character.characters[source.id] = source;
                                            Character.characters[target.id] = target;
                                        }
                                        this.logBattle(`使用Character.calculateDamage计算伤害`);
                                        // 计算伤害，设置isSpecialAttack=true，skipCritical=true，确保不触发暴击
                                        const damageResult = Character.calculateDamage(source.id, target.id, true, {
                                            skipCritical: true, // 跳过暴击计算
                                            isSpecialAttack: true // 标记为特殊攻击
                                        });
                                        actualDamage = damageResult.damage;
                                        this.logBattle(`计算得到伤害: ${actualDamage}`);
                                    } else {
                                        // 如果都不可用，使用简单的伤害计算
                                        this.logBattle(`Character.calculateDamage不可用，使用简单公式计算伤害`);
                                        actualDamage = Math.floor(rawDamage / (1 + target.currentStats.defense));
                                        this.logBattle(`简单公式计算得到伤害: ${actualDamage}`);
                                    }
                                }

                                // 应用伤害
                                target.currentStats.hp = Math.max(0, target.currentStats.hp - actualDamage);
                                this.logBattle(`应用伤害: ${actualDamage}`);

                                // 更新伤害统计
                                source.stats.totalDamage += actualDamage;

                                // 如果是旋风斩，特别标记
                                if (skillId === 'whirlwind') {
                                    this.logBattle(`${source.name} 对 ${target.name} 造成了 ${actualDamage} 点伤害！`);
                                } else {
                                    this.logBattle(`${source.name} 的 ${skill.name} 对 ${target.name} 造成了 ${actualDamage} 点伤害！`);
                                }
                            }
                        }
                    }
                }
            }
        }
    },

    /**
     * 记录战斗日志
     * @param {string} message - 日志消息
     */
    logBattle(message) {
        this.battleLog.push(message);
        console.log(`[战斗] ${message}`);
    }
};
