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
        const mvp = Character.assessBattleMVP(team.members);

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
        const MAX_TURNS = 50;

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
            this.logBattle(`===== 回合 ${this.currentTurn} =====`);

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
        }

        // 更新怪物的BUFF
        if (typeof BuffSystem !== 'undefined') {
            const expiredBuffs = BuffSystem.updateBuffDurations(monster);

            for (const buff of expiredBuffs) {
                this.logBattle(`${monster.name} 的 ${buff.name} 效果已结束！`);
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
        // 检查角色是否存活
        if (character.currentStats.hp <= 0) return;

        // 处理角色特性触发
        const triggeredEffects = Character.processTraitTriggers(character.id, 'attack', { target: monster });

        // 应用特性效果
        for (const effect of triggeredEffects) {
            if (effect.message) {
                this.logBattle(`${character.name} ${effect.message}`);
            }
        }

        // 检查DA和TA触发
        let attackCount = 1;
        let isDA = false;
        let isTA = false;

        // 获取DA和TA概率
        const daRate = character.currentStats.daRate || 0.15;
        const taRate = character.currentStats.taRate || 0.05;

        // 先检查TA，再检查DA
        if (Math.random() < taRate) {
            attackCount = 3;
            isTA = true;
            character.stats.taCount++;
            this.logBattle(`${character.name} 触发三重攻击！`);
        } else if (Math.random() < daRate) {
            attackCount = 2;
            isDA = true;
            character.stats.daCount++;
            this.logBattle(`${character.name} 触发双重攻击！`);
        }

        // 执行攻击
        let totalDamage = 0;
        for (let i = 0; i < attackCount; i++) {
            // 检查怪物是否已被击败
            if (monster.currentStats.hp <= 0) break;

            // 计算伤害
            const damageResult = Character.calculateDamage(character.id, monster.id, false, {
                isMultiAttack: i > 0, // 第一次攻击不是多重攻击
                skipStats: true // 不计入角色总伤害统计（我们会在最后统一计算）
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

            if (i > 0) {
                damageMessage += `第${i+1}次攻击 `;
            }

            damageMessage += `攻击 ${monster.name}，造成 ${damageResult.damage} 点伤害`;

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

        // 检查DA和TA触发（怪物也可以有多重攻击）
        let attackCount = 1;
        let isDA = false;
        let isTA = false;

        // 获取DA和TA概率
        const daRate = monster.currentStats.daRate || 0.1; // 怪物默认10%双重攻击率
        const taRate = monster.currentStats.taRate || 0.03; // 怪物默认3%三重攻击率

        // 先检查TA，再检查DA
        if (Math.random() < taRate) {
            attackCount = 3;
            isTA = true;
            this.logBattle(`${monster.name} 触发三重攻击！`);
        } else if (Math.random() < daRate) {
            attackCount = 2;
            isDA = true;
            this.logBattle(`${monster.name} 触发双重攻击！`);
        }

        // 执行攻击
        let totalDamage = 0;
        for (let i = 0; i < attackCount; i++) {
            // 检查目标是否已被击败
            if (target.currentStats.hp <= 0) break;

            // 计算伤害（简化版，可以根据需要扩展）
            const damage = Math.floor(monster.currentStats.attack * (100 - target.currentStats.defense) / 100);

            // 应用伤害
            target.currentStats.hp = Math.max(0, target.currentStats.hp - damage);

            // 累计伤害
            totalDamage += damage;

            // 记录战斗日志
            let damageMessage = `${monster.name} `;

            if (i > 0) {
                damageMessage += `第${i+1}次攻击 `;
            }

            damageMessage += `攻击 ${target.name}，造成 ${damage} 点伤害`;

            this.logBattle(damageMessage);
        }

        // 更新怪物伤害统计
        monster.stats.totalDamage += totalDamage;

        // 更新战斗统计
        if (battleStats && battleStats.monsterStats) {
            battleStats.monsterStats.totalDamage += totalDamage;
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
     * 记录战斗日志
     * @param {string} message - 日志消息
     */
    logBattle(message) {
        this.battleLog.push(message);
        console.log(`[战斗] ${message}`);
    }
};
