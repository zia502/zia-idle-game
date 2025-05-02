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

        // 确保怪物的HP和maxHp是有效数字
        if (!monsterCharacter.currentStats.maxHp || isNaN(monsterCharacter.currentStats.maxHp)) {
            console.error("怪物maxHp无效，设置为默认值10000");
            monsterCharacter.currentStats.maxHp = 10000;
        }

        if (!monsterCharacter.currentStats.hp || isNaN(monsterCharacter.currentStats.hp)) {
            console.error("怪物hp无效，设置为maxHp");
            monsterCharacter.currentStats.hp = monsterCharacter.currentStats.maxHp;
        }

        console.log("创建怪物角色对象:", monsterCharacter);

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

        // 应用武器盘加成
        if (typeof WeaponBoardBonusSystem !== 'undefined') {
            this.logBattle('应用武器盘加成...');
            const bonusApplied = WeaponBoardBonusSystem.applyWeaponBoardBonuses(team, teamMembers);
            if (bonusApplied) {
                this.logBattle('武器盘加成已应用到队伍成员');
            } else {
                this.logBattle('无法应用武器盘加成');
            }
        } else {
            console.warn('WeaponBoardBonusSystem未定义，无法应用武器盘加成');
        }

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
        console.log("初始化怪物HP前:", monster.currentStats);
        monster.currentStats.hp = monster.currentStats.maxHp || monster.currentStats.hp;
        console.log("初始化怪物HP后:", monster.currentStats);

        // 确保HP是有效数字
        if (isNaN(monster.currentStats.hp) || monster.currentStats.hp === undefined) {
            console.error("怪物HP初始化为NaN或undefined，强制设置为maxHp");
            monster.currentStats.hp = monster.currentStats.maxHp;
            if (isNaN(monster.currentStats.hp) || monster.currentStats.hp === undefined) {
                console.error("怪物maxHp也是NaN或undefined，强制设置为10000");
                monster.currentStats.hp = 10000;
                monster.currentStats.maxHp = 10000;
            }
        }

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

            // 处理队伍成员和怪物的行动顺序（玩家永远先手，按照队伍1,2,3,4的顺序行动）
            // 不再使用速度排序，而是保持队伍成员的原始顺序，然后将怪物放在最后
            const allEntities = [...teamMembers, monster];

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

            // 在每个回合结束时打印双方的HP
            this.logBattle(`\n===== 回合 ${this.currentTurn} 结束时的HP状态 =====`);

            // 检查怪物HP是否为NaN
            if (isNaN(monster.currentStats.hp) || monster.currentStats.hp === undefined) {
                console.error("怪物HP为NaN或undefined，尝试修复");
                monster.currentStats.hp = monster.currentStats.maxHp || 10000;
                if (isNaN(monster.currentStats.hp)) {
                    monster.currentStats.hp = 10000;
                    monster.currentStats.maxHp = 10000;
                }
            }

            // 计算百分比，确保不会产生NaN
            const monsterHpPercent = monster.currentStats.maxHp > 0 ?
                Math.floor((monster.currentStats.hp / monster.currentStats.maxHp) * 100) : 0;

            this.logBattle(`${monster.name} HP: ${Math.floor(monster.currentStats.hp)}/${monster.currentStats.maxHp} (${monsterHpPercent}%)`);
            console.log(`怪物当前状态: `, monster.currentStats);

            for (const member of teamMembers) {
                if (member.currentStats.hp > 0) {
                    // 计算百分比，确保不会产生NaN
                    const memberHpPercent = member.currentStats.maxHp > 0 ?
                        Math.floor((member.currentStats.hp / member.currentStats.maxHp) * 100) : 0;

                    this.logBattle(`${member.name} HP: ${Math.floor(member.currentStats.hp)}/${member.currentStats.maxHp} (${memberHpPercent}%)`);
                } else {
                    this.logBattle(`${member.name} 已阵亡`);
                }
            }
            this.logBattle(`=======================================`);

            // 处理回合结束效果
            this.logBattle(`----- 回合结束触发事件 -----`);

            // 处理队伍成员的回合结束效果
            for (const member of teamMembers) {
                if (member.currentStats.hp <= 0) continue;

                // 处理技能的回合结束效果
                if (member.skills) {
                    for (const skillId of member.skills) {
                        // 获取技能信息
                        let skill = null;

                        // 尝试从 JobSystem 获取技能
                        if (typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                            skill = JobSystem.getSkill(skillId);
                        }

                        // 如果从 JobSystem 中没有找到，尝试从 JobSkillsTemplate 获取
                        if (!skill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates) {
                            skill = JobSkillsTemplate.templates[skillId];
                        }

                        // 如果没有找到技能信息，继续下一个技能
                        if (!skill) continue;

                        // 处理被动技能的回合结束效果
                        if (skill.passive && skill.effects) {
                            for (const effect of skill.effects) {
                                // 处理回合结束类型的效果
                                if (effect.type === 'endOfTurn') {
                                    this.processEndOfTurnEffect(member, effect.effect, teamMembers, monster, skillId);
                                }
                            }
                        }

                        // 处理雷暴技能（特殊情况，如果技能模板没有正确定义）
                        if (skillId === 'thunderstorm' && (!skill.effects || !skill.effects.some(e => e.type === 'endOfTurn'))) {
                            // 创建标准的雷暴效果
                            const thunderstormEffect = {
                                type: 'multi_attack',
                                count: 5,
                                multiplier: 0.3,
                                targetType: 'all_enemies'
                            };

                            // 使用通用处理方法
                            this.processEndOfTurnEffect(member, thunderstormEffect, teamMembers, monster, 'thunderstorm');
                        }
                    }
                }

                // 处理BUFF的回合结束效果
                if (member.buffs) {
                    for (const buff of member.buffs) {
                        if (buff.type === 'endOfTurn' && buff.effect) {
                            this.processEndOfTurnEffect(member, buff.effect, teamMembers, monster);
                        }
                    }
                }
            }

            // 处理怪物的回合结束效果
            if (monster.currentStats.hp > 0) {
                // 处理怪物的BUFF回合结束效果
                if (monster.buffs) {
                    for (const buff of monster.buffs) {
                        if (buff.type === 'endOfTurn' && buff.effect) {
                            this.processEndOfTurnEffect(monster, buff.effect, teamMembers, monster);
                        }
                    }
                }
            }

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
        // 处理一次性被动技能
        if (character.skills) {
            for (const skillId of character.skills) {
                const skill = JobSystem.getSkill(skillId);
                if (skill && skill.passive && skill.oneTime) {
                    // 处理一次性被动技能
                    for (const effect of skill.effects) {
                        if (effect.passive) {
                            // 应用被动效果
                            this.applyPassiveEffect(character, effect, teamMembers);
                        }
                    }
                }
            }
        }

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
     * 应用被动效果
     * @param {object} character - 角色对象
     * @param {object} effect - 效果对象
     * @param {array} teamMembers - 队伍成员
     */
    applyPassiveEffect(character, effect, teamMembers) {
        switch (effect.type) {
            case 'daBoost':
                // 提升DA（连击）概率
                character.currentStats.daBoost = (character.currentStats.daBoost || 0) + effect.value;
                this.logBattle(`${character.name} 的被动技能提升了 ${effect.value * 100}% 的连击概率！`);
                break;
            case 'taBoost':
                // 提升TA（三连击）概率
                character.currentStats.taBoost = (character.currentStats.taBoost || 0) + effect.value;
                this.logBattle(`${character.name} 的被动技能提升了 ${effect.value * 100}% 的三连击概率！`);
                break;
            case 'attackUp':
                // 提升攻击力
                character.currentStats.attack = Math.floor(character.currentStats.attack * (1 + effect.value));
                this.logBattle(`${character.name} 的被动技能提升了 ${effect.value * 100}% 的攻击力！`);
                break;
            case 'defenseUp':
                // 提升防御力
                character.currentStats.defense = Math.floor(character.currentStats.defense * (1 + effect.value));
                this.logBattle(`${character.name} 的被动技能提升了 ${effect.value * 100}% 的防御力！`);
                break;
            case 'speedUp':
                // 提升速度
                character.currentStats.speed = Math.floor(character.currentStats.speed * (1 + effect.value));
                this.logBattle(`${character.name} 的被动技能提升了 ${effect.value * 100}% 的速度！`);
                break;
            // 可以添加其他类型的被动效果
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

            // 处理被动技能
            if (member.skills) {
                for (const skillId of member.skills) {
                    const skill = JobSystem.getSkill(skillId);
                    // 只处理非一次性被动技能
                    if (skill && skill.passive && skill.effects) {
                        // 检查是否是一次性被动技能
                        if (skill.oneTime) {
                            // 一次性被动技能已经在战斗开始时处理过，跳过
                            continue;
                        }
                        // 处理非一次性被动技能
                        for (const effect of skill.effects) {
                            if (effect.type === 'startOfTurn') {
                                this.processStartOfTurnEffect(member, effect.effect, teamMembers, monster);
                            }
                        }
                    }
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

            // 如果是治疗技能，检查是否有需要治疗的目标
            if (skill && skill.effectType === 'heal') {
                // 根据目标类型获取可能的目标
                let targets = [];
                if (skill.targetType === 'self') {
                    targets = [character];
                } else if (skill.targetType === 'ally' || skill.targetType === 'ally_lowest_hp') {
                    // 选择生命值最低的队友
                    // 我们在这里使用外部作用域的teamMembers变量
                    // 如果在其他地方调用，则只查看当前角色
                    const allTeamMembers = typeof teamMembers !== 'undefined' ? teamMembers : [character];
                    const aliveMembers = allTeamMembers.filter(member => member.currentStats.hp > 0);
                    if (aliveMembers.length > 0) {
                        aliveMembers.sort((a, b) => a.currentStats.hp / a.currentStats.maxHp - b.currentStats.hp / b.currentStats.maxHp);
                        targets = [aliveMembers[0]];
                    }
                } else if (skill.targetType === 'all_allies') {
                    const allTeamMembers = typeof teamMembers !== 'undefined' ? teamMembers : [character];
                    targets = allTeamMembers.filter(member => member.currentStats.hp > 0);
                }

                // 检查是否有需要治疗的目标
                const needsHealing = targets.some(target =>
                    target.currentStats.hp > 0 && target.currentStats.hp < target.currentStats.maxHp
                );

                // 如果没有需要治疗的目标，跳过这个技能
                if (!needsHealing) {
                    this.logBattle(`${character.name} 的技能 ${skill.name} 不需要使用（所有目标都是满血状态）`);
                    return false;
                }
            }

            // 如果是复活技能，检查是否有需要复活的目标
            if (skill && skill.effectType === 'revive') {
                // 获取所有队伍成员
                const allTeamMembers = typeof teamMembers !== 'undefined' ? teamMembers : [character];

                // 检查是否有阵亡的目标
                const hasDeadTargets = allTeamMembers.some(target => target.currentStats.hp <= 0);

                // 如果没有阵亡的目标，跳过这个技能
                if (!hasDeadTargets) {
                    this.logBattle(`${character.name} 的技能 ${skill.name} 不需要使用（没有阵亡的目标）`);
                    return false;
                }
            }

            // 如果是驱散技能，检查是否有需要驱散的BUFF
            if (skill && skill.effectType === 'dispel') {
                // 获取所有队伍成员
                const allTeamMembers = typeof teamMembers !== 'undefined' ? teamMembers : [character];

                // 检查是否有需要驱散的BUFF
                const hasBuffsToDispel = allTeamMembers.some(target =>
                    target.currentStats.hp > 0 && target.buffs && target.buffs.length > 0 &&
                    target.buffs.some(buff => buff.type === 'debuff')
                );

                // 如果没有需要驱散的BUFF，跳过这个技能
                if (!hasBuffsToDispel) {
                    this.logBattle(`${character.name} 的技能 ${skill.name} 不需要使用（没有可驱散的BUFF）`);
                    return false;
                }
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

                // 如果找到了技能，并且是被动技能，且不是一次性被动技能
                if (skill && (skill.passive || (skill.effects && skill.effects.some(e => e.passive))) && !skill.oneTime) {
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
                                    // 检查是否已经应用过这个被动技能的防御力提升
                                    if (!character.appliedPassiveDefense) {
                                        character.appliedPassiveDefense = {};
                                    }

                                    // 如果这个技能的防御力提升还没有应用过，才应用它
                                    if (!character.appliedPassiveDefense[skill.name]) {
                                        // 直接加上防御力值（整数）
                                        character.currentStats.defense += effect.value;
                                        this.logBattle(`防御力提升: +${effect.value} (来自被动技能: ${skill.name})`);

                                        // 标记这个技能的防御力提升已经应用过
                                        character.appliedPassiveDefense[skill.name] = true;
                                    }
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
            // 检查怪物是否已被击败
            if (monster.currentStats.hp <= 0) break;

            // 计算伤害
            const rawDamage = Character.calculateAttackPower(character);
            const damageResult = JobSkills.applyDamageToTarget(character, monster, rawDamage, {
                skipCritical: false,
                randomApplied: false,
                isMultiAttack: attackCount > 1,
                attackIndex: i + 1,
                totalAttacks: attackCount
            });

            // 应用伤害
            const oldHp = monster.currentStats.hp;

            // 检查HP是否为NaN
            if (isNaN(oldHp) || oldHp === undefined) {
                console.error("怪物HP为NaN或undefined，尝试修复");
                monster.currentStats.hp = monster.currentStats.maxHp || 10000;
                if (isNaN(monster.currentStats.hp)) {
                    monster.currentStats.hp = 10000;
                    monster.currentStats.maxHp = 10000;
                }
            }

            // 确保伤害是有效数字
            let damage = damageResult.damage;
            if (isNaN(damage) || damage === undefined) {
                console.error("伤害值为NaN或undefined，设置为0");
                damage = 0;
            }

            monster.currentStats.hp = Math.max(0, monster.currentStats.hp - damage);

            // 记录HP变化
            this.logBattle(`${monster.name} HP: ${Math.floor(oldHp)} -> ${Math.floor(monster.currentStats.hp)} (-${damage})`);

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

            if (damageResult.missed) {
                damageMessage += `对 ${monster.name} 的攻击未命中！`;
            } else {
                damageMessage += `对 ${monster.name} 造成 ${damageResult.damage} 点伤害`;
                if (damageResult.isCritical) {
                    damageMessage += '（暴击！）';
                }

                if (damageResult.attributeBonus > 0) {
                    damageMessage += '（属性克制！）';
                } else if (damageResult.attributeBonus < 0) {
                    damageMessage += '（属性被克制！）';
                }
            }

            this.logBattle(damageMessage);

            // 检查是否有追击BUFF
            if (character.buffs && character.buffs.some(buff => buff.type === 'chase')) {
                const chaseBuff = character.buffs.find(buff => buff.type === 'chase');
                if (chaseBuff && chaseBuff.value > 0) {
                    // 计算追击伤害
                    const chaseDamage = Math.floor(damageResult.damage * chaseBuff.value);
                    if (chaseDamage > 0) {
                        monster.currentStats.hp = Math.max(0, monster.currentStats.hp - chaseDamage);
                        totalDamage += chaseDamage;
                        this.logBattle(`${character.name} 触发追击效果，额外造成 ${chaseDamage} 点伤害！`);
                        this.logBattle(`${monster.name} HP: ${Math.floor(monster.currentStats.hp + chaseDamage)} -> ${Math.floor(monster.currentStats.hp)} (-${chaseDamage})`);
                    }
                }
            }
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

        // 在普通攻击完成后检查一次被动技能触发
        if (!isDA && !isTA) {
            this.processAttackProcEffects(character, monster, battleStats);
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

        // 选择目标（基于敌对心/威胁值的AI）
        const aliveMembers = teamMembers.filter(member => member.currentStats.hp > 0);
        if (aliveMembers.length === 0) return;

        // 计算总威胁值和每个角色的威胁值
        let totalThreat = 0;
        const memberThreats = aliveMembers.map(member => {
            // 默认敌对心为100%
            let threatValue = 100;

            // 检查角色是否有敌对心BUFF
            if (member.buffs) {
                for (const buff of member.buffs) {
                    if (buff.type === 'threatUp') {
                        // 增加敌对心值
                        threatValue += buff.value;
                    } else if (buff.type === 'threatDown') {
                        // 减少敌对心值
                        threatValue -= buff.value;
                    }
                }
            }

            // 确保威胁值不小于0
            threatValue = Math.max(0, threatValue);
            totalThreat += threatValue;

            return {
                member,
                threatValue
            };
        });

        // 如果总威胁值为0（极少数情况），使用随机选择
        if (totalThreat <= 0) {
            const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
            return target;
        }

        // 基于威胁值随机选择目标
        const roll = Math.random() * totalThreat;
        let cumulativeThreat = 0;
        let target = aliveMembers[0]; // 默认值，以防出错

        for (const memberThreat of memberThreats) {
            cumulativeThreat += memberThreat.threatValue;
            if (roll < cumulativeThreat) {
                target = memberThreat.member;
                break;
            }
        }

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
                            const oldHp = target.currentStats.hp;

                            // 检查HP是否为NaN
                            if (isNaN(oldHp) || oldHp === undefined) {
                                console.error("角色HP为NaN或undefined，尝试修复");
                                target.currentStats.hp = target.currentStats.maxHp || 1000;
                                if (isNaN(target.currentStats.hp)) {
                                    target.currentStats.hp = 1000;
                                    target.currentStats.maxHp = 1000;
                                }
                            }

                            // 确保伤害是有效数字
                            if (isNaN(damage) || damage === undefined) {
                                console.error("伤害值为NaN或undefined，设置为0");
                                damage = 0;
                            }

                            target.currentStats.hp = Math.max(0, target.currentStats.hp - damage);

                            // 记录HP变化
                            this.logBattle(`${target.name} HP: ${Math.floor(oldHp)} -> ${Math.floor(target.currentStats.hp)} (-${damage})`);

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
                                        // 检查是否已经应用过这个被动技能的防御力提升
                                        if (!monster.appliedPassiveDefense) {
                                            monster.appliedPassiveDefense = {};
                                        }

                                        // 如果这个技能的防御力提升还没有应用过，才应用它
                                        if (!monster.appliedPassiveDefense[skill.name]) {
                                            // 直接加上防御力值（整数）
                                            monster.currentStats.defense += effect.value;
                                            this.logBattle(`BOSS防御力提升: +${effect.value} (来自被动技能: ${skill.name})`);

                                            // 标记这个技能的防御力提升已经应用过
                                            monster.appliedPassiveDefense[skill.name] = true;
                                        }
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
                const rawDamage = Character.calculateAttackPower(monster);
                const damageResult = JobSkills.applyDamageToTarget(monster, target, rawDamage, {
                    skipCritical: false,
                    randomApplied: false,
                    isMultiAttack: attackCount > 1,
                    attackIndex: i + 1,
                    totalAttacks: attackCount
                });

                // 应用伤害
                const oldHp = target.currentStats.hp;

                // 检查HP是否为NaN
                if (isNaN(oldHp) || oldHp === undefined) {
                    console.error("角色HP为NaN或undefined，尝试修复");
                    target.currentStats.hp = target.currentStats.maxHp || 1000;
                    if (isNaN(target.currentStats.hp)) {
                        target.currentStats.hp = 1000;
                        target.currentStats.maxHp = 1000;
                    }
                }

                // 确保伤害是有效数字
                let damage = damageResult.damage;
                if (isNaN(damage) || damage === undefined) {
                    console.error("伤害值为NaN或undefined，设置为0");
                    damage = 0;
                }

                target.currentStats.hp = Math.max(0, target.currentStats.hp - damage);

                // 记录HP变化
                this.logBattle(`${target.name} HP: ${Math.floor(oldHp)} -> ${Math.floor(target.currentStats.hp)} (-${damage})`);

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

                if (damageResult.missed) {
                    damageMessage += `对 ${target.name} 的攻击未命中！`;
                } else {
                    damageMessage += `对 ${target.name} 造成 ${damageResult.damage} 点伤害`;
                    if (damageResult.isCritical) {
                        damageMessage += '（暴击！）';
                    }

                    if (damageResult.attributeBonus > 0) {
                        damageMessage += '（属性克制！）';
                    } else if (damageResult.attributeBonus < 0) {
                        damageMessage += '（属性被克制！）';
                    }
                }

                if (damageResult.skillBonus > 0) {
                    damageMessage += `（技能加成：+${Math.floor(damageResult.skillBonus)}）`;
                }

                if (damageResult.buffBonus > 0) {
                    damageMessage += `（BUFF加成：+${Math.floor(damageResult.buffBonus)}）`;
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
                                    const damageResult = JobSkills.applyDamageToTarget(source, target, rawDamage, {
                                        skipCritical: true, // 跳过暴击计算
                                        isSpecialAttack: true // 标记为特殊攻击
                                    });

                                    // 确保damageResult是一个对象，并且有damage属性
                                    if (typeof damageResult === 'object' && 'damage' in damageResult) {
                                        actualDamage = damageResult.damage;
                                        this.logBattle(`JobSkills.applyDamageToTarget计算得到伤害: ${actualDamage}`);
                                    } else {
                                        // 如果返回值不是预期的对象，使用简单的伤害计算
                                        this.logBattle(`JobSkills.applyDamageToTarget返回值异常，使用简单公式计算伤害`);
                                        actualDamage = Math.floor(rawDamage / (1 + target.currentStats.defense));
                                        this.logBattle(`简单公式计算得到伤害: ${actualDamage}`);
                                    }
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

                                        // 确保damageResult是一个对象，并且有damage属性
                                        if (typeof damageResult === 'object' && 'damage' in damageResult) {
                                            actualDamage = damageResult.damage;
                                            this.logBattle(`Character.calculateDamage计算得到伤害: ${actualDamage}`);
                                        } else {
                                            // 如果返回值不是预期的对象，使用简单的伤害计算
                                            this.logBattle(`Character.calculateDamage返回值异常，使用简单公式计算伤害`);
                                            actualDamage = Math.floor(rawDamage / (1 + target.currentStats.defense));
                                            this.logBattle(`简单公式计算得到伤害: ${actualDamage}`);
                                        }
                                    } else {
                                        // 如果都不可用，使用简单的伤害计算
                                        this.logBattle(`Character.calculateDamage不可用，使用简单公式计算伤害`);
                                        actualDamage = Math.floor(rawDamage / (1 + target.currentStats.defense));
                                        this.logBattle(`简单公式计算得到伤害: ${actualDamage}`);
                                    }
                                }

                                // 应用伤害
                                const oldHp = target.currentStats.hp;
                                const damage = actualDamage.damage || actualDamage;

                                // 确保伤害是有效数字
                                if (isNaN(damage) || damage === undefined) {
                                    console.error("伤害值为NaN或undefined，设置为0");
                                    damage = 0;
                                }

                                // 记录伤害应用
                                this.logBattle(`应用伤害: ${damage}`);

                                // 应用伤害到目标HP
                                target.currentStats.hp = Math.max(0, target.currentStats.hp - damage);

                                // 记录HP变化
                                this.logBattle(`${target.name} HP: ${Math.floor(oldHp)} -> ${Math.floor(target.currentStats.hp)} (-${damage})`);

                                // 更新伤害统计
                                source.stats.totalDamage += damage;

                                // 如果是旋风斩，特别标记
                                if (skillId === 'whirlwind') {
                                    this.logBattle(`${source.name} 的旋风斩对 ${target.name} 造成了 ${damage} 点伤害！`);
                                } else {
                                    this.logBattle(`${source.name} 的 ${skill.name} 对 ${target.name} 造成了 ${damage} 点伤害！`);
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
    },






};
