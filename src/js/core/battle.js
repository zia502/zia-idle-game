/**
 * 战斗系统 - 负责游戏中的战斗逻辑
 */
const Battle = {
    // 战斗状态
    isFirstTurn: true,
    currentTurn: 0,
    battleLog: [],
    currentBattle: null, // 保存当前战斗信息

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

        // 检查是否在地下城中，如果是，则累加回合数
        if (typeof Dungeon !== 'undefined' && Dungeon.currentRun) {
            // 如果没有dungeonTurn属性，初始化为0
            if (typeof this.dungeonTurn === 'undefined') {
                this.dungeonTurn = 0;
            }

            // 记录当前地下城回合
            console.log(`地下城当前回合: ${this.dungeonTurn}`);
        } else {
            // 不在地下城中，重置回合数
            this.dungeonTurn = 0;
        }

        // 重置当前战斗的回合数
        this.currentTurn = 0;
        // 不再清空战斗日志，保留之前的记录
        // this.battleLog = [];

        // 确保Character对象存在
        if (typeof Character === 'undefined') {
            window.Character = {
                characters: {},
                getCharacter: function(id) {
                    return this.characters[id];
                },
                traits: {}
            };
        } else if (typeof Character.getCharacter !== 'function') {
            Character.getCharacter = function(id) {
                return this.characters[id];
            };
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
                    // 保存之前的统计数据用于调试
                    const oldStats = JSON.stringify(character.stats);

                    // 重置统计数据
                    character.stats.totalDamage = 0;
                    character.stats.totalHealing = 0;
                    character.stats.daCount = 0;
                    character.stats.taCount = 0;
                    character.stats.critCount = 0;

                    console.log(`重置角色 ${character.name} 的战斗统计，从 ${oldStats} 变为 ${JSON.stringify(character.stats)}`);
                }

                // 重置战斗状态
                character.hasAttacked = false;

                // 初始化DA和TA概率
                if (!character.currentStats.daRate) {
                    character.currentStats.daRate = 0.1; // 默认10%双重攻击率
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
        console.log('前排成员:', frontLineMembers.map(member => member.name).join(', '));

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
            stats: { totalDamage: 0, totalHealing: 0 },
            xpReward: monster.xpReward || 100
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
        let monsterTypeText = '';
        if (monsterCharacter.isBoss) {
            if (monsterCharacter.isMiniBoss) {
                monsterTypeText = '(小BOSS)';
            } else if (monsterCharacter.isFinalBoss) {
                monsterTypeText = '(大BOSS)';
            } else {
                monsterTypeText = '(BOSS)';
            }
        }

        // 检查是否在地下城中
        const inDungeon = typeof Dungeon !== 'undefined' && Dungeon.currentRun;

        // 检查是否是地下城中的第一场战斗
        // 如果有任何队员有dungeonOriginalStats属性，则不是第一场战斗
        // 如果有任何队员有dungeonAppliedPassives属性，也不是第一场战斗
        const isFirstBattleInDungeon = inDungeon &&
            !teamMembers.some(member => member.dungeonOriginalStats) &&
            !teamMembers.some(member => member.dungeonAppliedPassives && Object.keys(member.dungeonAppliedPassives).length > 0);

        console.log(`是否是地下城中的第一场战斗: ${isFirstBattleInDungeon}`);

        // 如果在地下城中且是第一场战斗，记录日志
        if (inDungeon && isFirstBattleInDungeon) {
            console.log('检测到在地下城中且是第一场战斗');

            // 确保所有角色的dungeonAppliedPassives被初始化为空对象
            for (const member of teamMembers) {
                member.dungeonAppliedPassives = {};
            }
        }

        // 处理角色属性
        for (const member of teamMembers) {
            // 初始化originalStats用于战斗失败时恢复
            if (!member.originalStats) {
                member.originalStats = {};
            }

            // 如果在地下城中且是第一场战斗，使用weaponBonusStats
            if (inDungeon && isFirstBattleInDungeon) {
                if (member.weaponBonusStats) {
                    console.log(`${member.name} 使用weaponBonusStats作为战斗属性`);
                    member.currentStats = JSON.parse(JSON.stringify(member.weaponBonusStats));
                    // 保存当前状态作为战斗原始属性
                    member.originalStats = JSON.parse(JSON.stringify(member.weaponBonusStats));
                } else {
                    console.log(`${member.name} 没有weaponBonusStats，使用baseStats`);
                    member.currentStats = JSON.parse(JSON.stringify(member.baseStats));
                    member.originalStats = JSON.parse(JSON.stringify(member.baseStats));
                }
            } else {
                // 不在地下城中或不是第一场战斗，保持当前状态
                console.log(`${member.name} 保持当前状态`);
                // 保存当前状态作为战斗原始属性
                member.originalStats = JSON.parse(JSON.stringify(member.currentStats));
            }
            console.log(`${member.name} 的战斗属性:`, member.currentStats);
        }

        // 不再需要应用武器盘加成，因为已经在weaponBonusStats中包含了这些加成
        console.log('使用角色的weaponBonusStats属性，不再单独应用武器盘加成');

        // 战斗循环
        let battleResult = this.processBattle(teamMembers, monsterCharacter);

        // 战斗失败时恢复队伍成员为weaponBonusStats
        if (!battleResult.victory) {
            for (const member of teamMembers) {
                if (member.weaponBonusStats) {
                    console.log(`战斗失败，恢复 ${member.name} 为weaponBonusStats`);
                    member.currentStats = JSON.parse(JSON.stringify(member.weaponBonusStats));

                    // 保持当前HP不变，除非HP大于maxHP
                    if (member.currentStats.hp > member.currentStats.maxHp) {
                        member.currentStats.hp = member.currentStats.maxHp;
                    }
                } else if (member.originalStats) {
                    // 如果没有weaponBonusStats，则使用originalStats
                    console.log(`战斗失败，恢复 ${member.name} 的战斗前状态（无weaponBonusStats）`);
                    member.currentStats = JSON.parse(JSON.stringify(member.originalStats));

                    // 保持当前HP不变，除非HP大于maxHP
                    if (member.currentStats.hp > member.currentStats.maxHp) {
                        member.currentStats.hp = member.currentStats.maxHp;
                    }
                }
            }
        } else {
            // 战斗胜利时，保持当前状态，不恢复
            console.log('战斗胜利，保持队伍成员当前状态');
        }

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
            }
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

        // 创建战斗结果对象
        const result = {
            success: true,
            victory: battleResult.victory,
            message: this.battleLog.join('\n'),
            turns: this.currentTurn,
            mvp: mvp,
            monster: monsterCharacter,
            teamMembers: teamMembers, // 添加队伍成员信息
            gold: battleResult.gold || 0,
            exp: battleResult.exp || 0,
            battleStats: battleResult.battleStats || {}
        };

        // 保存当前战斗信息
        this.currentBattle = result;

        // 返回战斗结果
        return result;
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

            // 如果在地下城中，增加地下城总回合数
            if (typeof Dungeon !== 'undefined' && Dungeon.currentRun) {
                this.dungeonTurn++;
            }
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
                    this.processCharacterAction(entity, monster, battleStats);
                }
            }

            // 更新BUFF持续时间
            this.updateBuffDurations(teamMembers, monster);


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

            //this.logBattle(`${monster.name} HP: ${Math.floor(monster.currentStats.hp)}/${monster.currentStats.maxHp} (${monsterHpPercent}%)`, true); // 强制记录，不过滤
            console.log(`怪物当前状态: `, monster.currentStats);

            for (const member of teamMembers) {
                if (member.currentStats.hp > 0) {
                    // 计算百分比，确保不会产生NaN
                    const memberHpPercent = member.currentStats.maxHp > 0 ?
                        Math.floor((member.currentStats.hp / member.currentStats.maxHp) * 100) : 0;

                    //this.logBattle(`${member.name} HP: ${Math.floor(member.currentStats.hp)}/${member.currentStats.maxHp} (${memberHpPercent}%)`, true); // 强制记录，不过滤
                } else {
                    this.logBattle(`${member.name} 已阵亡`, true); // 强制记录，不过滤
                }
            }

            // 在每个回合结束时打印双方的HP
            if (monster.currentStats.hp > 0) {
                this.logBattle(`\n回合 ${this.currentTurn} 结束, ${monster.name} HP: ${Math.floor(monster.currentStats.hp)}/${monster.currentStats.maxHp} (${monsterHpPercent}%)`);
            }

            // 处理回合结束效果
            console.log(`----- 回合结束触发事件 -----`);

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

            if (monster.xpReward) {
                exp = monster.xpReward;
                // this.logBattle(`地下城回合${this.dungeonTurn}- 战斗胜利，获得 ${exp} 经验值！`);
            }

            // 在地下城中不清除BUFF，只在非地下城战斗中清除
            const inDungeon = typeof Dungeon !== 'undefined' && Dungeon.currentRun;
            if (!inDungeon) {
                // 非地下城战斗，清除所有BUFF
                for (const member of teamMembers) {
                    if (typeof BuffSystem !== 'undefined') {
                        BuffSystem.clearAllBuffs(member);
                    } else {
                        member.buffs = [];
                    }
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

            // 在地下城中不清除BUFF，只在非地下城战斗中清除
            const inDungeon = typeof Dungeon !== 'undefined' && Dungeon.currentRun;
            if (!inDungeon) {
                for (const member of teamMembers) {
                    if (typeof BuffSystem !== 'undefined') {
                        BuffSystem.clearAllBuffs(member);
                    } else {
                        member.buffs = [];
                    }
                }
            } else {

                // 在地下城战斗失败时，立即调用DungeonRunner.exitDungeon()
                if (typeof DungeonRunner !== 'undefined' && typeof DungeonRunner.exitDungeon === 'function') {
                    console.log('地下城战斗失败，立即退出地下城');
                    DungeonRunner.exitDungeon();
                }
            }

            // 确保战斗统计信息包含队伍成员的统计
            for (const member of teamMembers) {
                if (!member.stats) {
                    member.stats = {
                        totalDamage: 0,
                        totalHealing: 0,
                        daCount: 0,
                        taCount: 0,
                        critCount: 0
                    };
                }

                // 确保战斗统计中包含这个队员的数据
                if (battleStats && battleStats.characterStats && !battleStats.characterStats[member.id]) {
                    battleStats.characterStats[member.id] = {
                        totalDamage: member.stats.totalDamage || 0,
                        totalHealing: member.stats.totalHealing || 0,
                        daCount: member.stats.daCount || 0,
                        taCount: member.stats.taCount || 0,
                        critCount: member.stats.critCount || 0
                    };
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
        // 检查是否在地下城中
        const inDungeon = typeof Dungeon !== 'undefined' && Dungeon.currentRun;

        // 初始化已应用的被动技能跟踪
        if (inDungeon && !character.dungeonAppliedPassives) {
            character.dungeonAppliedPassives = {};
        }

        // 处理一次性被动技能
        if (character.skills) {
            for (const skillId of character.skills) {
                const skill = JobSystem.getSkill(skillId);
                if (skill && skill.passive && skill.oneTime) {
                    // 在地下城中检查该被动技能是否已经应用过
                    if (inDungeon && character.dungeonAppliedPassives && character.dungeonAppliedPassives[skillId]) {
                        continue;
                    }

                    // 处理一次性被动技能
                    for (const effect of skill.effects) {
                        if (effect.passive) {
                            // 应用被动效果
                            this.applyPassiveEffect(character, effect, teamMembers);

                            // 在地下城中标记该被动技能已应用
                            if (inDungeon && character.dungeonAppliedPassives) {
                                character.dungeonAppliedPassives[skillId] = true;
                            }
                        }
                    }
                }
            }
        }

        if (!character) return;

    },

    /**
     * 应用被动效果
     * @param {object} character - 角色对象
     * @param {object} effect - 效果对象
     * @param {array} teamMembers - 队伍成员
     */
    applyPassiveEffect(character, effect, _teamMembers) {
        switch (effect.type) {
            case 'daBoost':
                // 提升DA（连击）概率
                character.currentStats.daRate = (character.currentStats.daRate || 0) + effect.value;
                //this.logBattle(`${character.name} 的被动技能提升了 ${effect.value * 100}% 的连击概率！`);
                break;
            case 'taBoost':
                // 提升TA（三连击）概率
                character.currentStats.taRate = (character.currentStats.taRate || 0) + effect.value;
                //this.logBattle(`${character.name} 的被动技能提升了 ${effect.value * 100}% 的三连击概率！`);
                break;
            case 'attackUp':
                // 提升攻击力
                character.currentStats.attack = Math.floor(character.currentStats.attack * (1 + effect.value));
                //this.logBattle(`${character.name} 的被动技能提升了 ${effect.value * 100}% 的攻击力！`);
                break;
            case 'defenseUp':
                // 提升防御力
                character.currentStats.defense = Math.floor(character.currentStats.defense * (1 + effect.value));
                //this.logBattle(`${character.name} 的被动技能提升了 ${effect.value * 100}% 的防御力！`);
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

                const buffNames = "";
                for (const buff of expiredBuffs) {
                    buffNames += buff.name + ", ";
                }
                if (buffNames !== "") {
                    this.logBattle(`${member.name} 的 ${buffNames} 效果已结束！`);
                };
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

                            // if (skill) {
                            //     this.logBattle(`${member.name} 的技能 ${skill.name} 冷却结束，可以再次使用！`);
                            // } else {
                            //     this.logBattle(`${member.name} 的技能 ${skillId} 冷却结束，可以再次使用！`);
                            // }
                        }
                    }
                }
            }
        }

        // 更新怪物的BUFF
        if (typeof BuffSystem !== 'undefined') {
            const expiredBuffs = BuffSystem.updateBuffDurations(monster);

            const buffNames = "";
            for (const buff of expiredBuffs) {
                buffNames += buff.name + ", ";
            }
            if (buffNames !== "") {
                this.logBattle(`${monster.name} 的 ${buffNames} 效果已结束！`);
            };
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

                        // if (skill) {
                        //     this.logBattle(`${monster.name} 的技能 ${skill.name} 冷却结束，可以再次使用！`);
                        // } else {
                        //     this.logBattle(`${monster.name} 的技能 ${skillId} 冷却结束，可以再次使用！`);
                        // }
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
        // 检查角色是否存活
        if (character.currentStats.hp <= 0) return;
        const monster_starthp = monster.currentStats.hp;

        // 处理角色特性触发
        let triggeredEffects = [];

        // 如果Character对象有processTraitTriggers方法，使用它
        if (typeof Character !== 'undefined' && typeof Character.processTraitTriggers === 'function') {
            triggeredEffects = Character.processTraitTriggers(character.id, 'attack', { target: monster });
        }


        // 1. 使用技能阶段
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
                return !skill.passive;
            }

            return true;
        }) : [];

        if (availableSkills && availableSkills.length > 0) {
            // 使用所有可用技能
            for (const skillId of availableSkills) {
                let skill = null;
                if (typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                    skill = JobSystem.getSkill(skillId);
                }

                if (!skill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
                    skill = JobSkillsTemplate.templates[skillId];
                }

                if (!skill) continue;

                // 使用技能
                if (typeof JobSkills !== 'undefined' && typeof JobSkills.useSkill === 'function') {
                    try {
                        if (typeof Character !== 'undefined' && !Character.characters[character.id]) {
                            Character.characters[character.id] = character;
                        }

                        if (typeof JobSkillsTemplate !== 'undefined' && !JobSkillsTemplate.templates[skillId]) {
                            JobSkillsTemplate.templates[skillId] = skill;
                        }

                        const result = JobSkills.useSkill(character.id, skillId, [character], monster);

                        if (result.success) {
                            this.logBattle(result.message);

                            if (skill.cooldown) {
                                character.skillCooldowns[skillId] = skill.cooldown;
                            }
                        }
                    } catch (error) {
                        console.error("技能使用错误:", error);
                    }
                }
            }
        }

        // 2. 普通攻击阶段
        // 计算DA和TA率
        let daRate = character.currentStats.daRate || 0.10;
        let taRate = character.currentStats.taRate || 0.05;

        // 应用BUFF效果
        if (character.buffs) {
            for (const buff of character.buffs) {
                if (buff.type === 'daBoost') daRate += buff.value;
                if (buff.type === 'taBoost') taRate += buff.value;
            }
        }

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
        } else if (roll < taRate + daRate) {
            attackCount = 2;
            attackType = "双重攻击";
            isDA = true;
            character.stats.daCount++;
        }

        // 执行攻击
        let totalDamage = 0;
        for (let i = 0; i < attackCount; i++) {
            if (monster.currentStats.hp <= 0) break;

            const rawDamage = Character.calculateAttackPower(character);
            const damageResult = JobSkills.applyDamageToTarget(character, monster, rawDamage, {
                skipCritical: false,
                randomApplied: false,
                isMultiAttack: attackCount > 1,
                attackIndex: i + 1,
                totalAttacks: attackCount
            });

            let damage = damageResult.damage;
            if (isNaN(damage) || damage === undefined) {
                damage = 0;
            }

            monster.currentStats.hp = Math.max(0, monster.currentStats.hp - damage);
            totalDamage += damageResult.damage;

            if (damageResult.isCritical) {
                character.stats.critCount++;
            }

            // 只在第一次攻击时记录战斗日志
            if (i === 0) {
                let damageMessage = `${character.name} ${attackType}，`;
                if (damageResult.missed) {
                    damageMessage += `对 ${monster.name} 的攻击未命中！`;
                } else {
                    damageMessage += `对 ${monster.name} 造成 ${damageResult.damage} 点伤害`;
                    if (damageResult.isCritical) {
                        damageMessage += '（暴击！）';
                    }
                }
            }
        }

        if (attackCount > 1) {
            this.logBattle(`${character.name} ${attackType} 总共造成 ${totalDamage} 点伤害！`);
        }

        // 更新角色伤害统计
        character.stats.totalDamage += totalDamage;

        // 更新战斗统计
        if (battleStats && battleStats.characterStats && battleStats.characterStats[character.id]) {
            battleStats.characterStats[character.id].totalDamage += totalDamage;
            battleStats.totalDamage += totalDamage;

            if (isDA) battleStats.characterStats[character.id].daCount++;
            if (isTA) battleStats.characterStats[character.id].taCount++;
        }

        // 检查怪物是否被击败
        if (monster.currentStats.hp <= 0) {
            this.logBattle(`HP${monster_starthp}的${monster.name} 被击败了！`);
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

        // 选择目标
        const aliveMembers = teamMembers.filter(member => member.currentStats.hp > 0);
        if (aliveMembers.length === 0) return;

        let totalThreat = 0;
        const memberThreats = aliveMembers.map(member => {
            let threatValue = 100;
            if (member.buffs) {
                for (const buff of member.buffs) {
                    if (buff.type === 'threatUp') threatValue += buff.value;
                    else if (buff.type === 'threatDown') threatValue -= buff.value;
                }
            }
            threatValue = Math.max(0, threatValue);
            totalThreat += threatValue;
            return { member, threatValue };
        });

        if (totalThreat <= 0) {
            const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
            return target;
        }

        const roll = Math.random() * totalThreat;
        let cumulativeThreat = 0;
        let target = aliveMembers[0];

        for (const memberThreat of memberThreats) {
            cumulativeThreat += memberThreat.threatValue;
            if (roll < cumulativeThreat) {
                target = memberThreat.member;
                break;
            }
        }

        // 1. 使用技能阶段
        const availableSkills = monster.skills ? monster.skills.filter(skillId => {
            if (monster.skillCooldowns[skillId] && monster.skillCooldowns[skillId] > 0) {
                return false;
            }

            let skill = null;
            if (typeof window !== 'undefined' && window.bossSkills && window.bossSkills[skillId]) {
                skill = window.bossSkills[skillId];
            }
            if (!skill && typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                skill = JobSystem.getSkill(skillId);
            }
            if (!skill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
                skill = JobSkillsTemplate.templates[skillId];
            }

            if (skill) return !skill.passive;
            return true;
        }) : [];

        let usedSkill = false;

        if (availableSkills && availableSkills.length > 0) {
            const skillId = availableSkills[Math.floor(Math.random() * availableSkills.length)];
            let skill = null;

            if (typeof window !== 'undefined' && window.bossSkills && window.bossSkills[skillId]) {
                skill = window.bossSkills[skillId];
            }
            if (!skill && typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                skill = JobSystem.getSkill(skillId);
            }
            if (!skill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
                skill = JobSkillsTemplate.templates[skillId];
            }

            if (skill) {
                try {
                    if (!monster.id) monster.id = `boss_${Date.now()}`;
                    if (typeof Character !== 'undefined') {
                        Character.characters = Character.characters || {};
                        Character.characters[monster.id] = monster;
                    }
                    if (typeof JobSkillsTemplate !== 'undefined' && !JobSkillsTemplate.templates[skillId]) {
                        JobSkillsTemplate.templates[skillId] = skill;
                    }

                    if (typeof JobSkills !== 'undefined' && typeof JobSkills.useSkill === 'function') {
                        const result = JobSkills.useSkill(monster.id, skillId, [monster], target);
                        if (result.success) {
                            this.logBattle(result.message);
                            monster.skillCooldowns[skillId] = skill.cooldown || 3;
                            usedSkill = true;
                        }
                    }
                } catch (error) {
                    console.error("BOSS技能使用错误:", error);
                }
            }
        }

        // 2. 普通攻击阶段
        if (!usedSkill) {
            let daRate = monster.currentStats.daRate || 0.1;
            let taRate = monster.currentStats.taRate || 0.03;

            if (monster.buffs) {
                for (const buff of monster.buffs) {
                    if (buff.type === 'daBoost') daRate += buff.value;
                    if (buff.type === 'taBoost') taRate += buff.value;
                }
            }

            const roll = Math.random();
            let attackCount = 1;
            let attackType = "普通攻击";

            if (roll < taRate) {
                attackCount = 3;
                attackType = "三重攻击";
            } else if (roll < taRate + daRate) {
                attackCount = 2;
                attackType = "双重攻击";
            }

            let totalDamage = 0;
            for (let i = 0; i < attackCount; i++) {
                if (target.currentStats.hp <= 0) break;

                const rawDamage = Character.calculateAttackPower(monster);
                const damageResult = JobSkills.applyDamageToTarget(monster, target, rawDamage, {
                    skipCritical: false,
                    randomApplied: false,
                    isMultiAttack: attackCount > 1,
                    attackIndex: i + 1,
                    totalAttacks: attackCount
                });

                let damage = damageResult.damage;
                if (isNaN(damage) || damage === undefined) {
                    damage = 0;
                }

                target.currentStats.hp = Math.max(0, target.currentStats.hp - damage);
                totalDamage += damageResult.damage;

                if (damageResult.isCritical) {
                    monster.stats.critCount++;
                }

                if (i === 0) {
                    let damageMessage = `${monster.name} ${attackType}，`;
                    if (damageResult.missed) {
                        damageMessage += `对 ${target.name} 的攻击未命中！`;
                    } else {
                        damageMessage += `对 ${target.name} 造成 ${damageResult.damage} 点伤害`;
                        if (damageResult.isCritical) {
                            damageMessage += '（暴击！）';
                        }
                    }
                    this.logBattle(damageMessage);
                }
            }

            if (attackCount > 1) {
                this.logBattle(`${monster.name} ${attackType} 总共造成 ${totalDamage} 点伤害！`);
            }

            monster.stats.totalDamage += totalDamage;
            if (battleStats && battleStats.monsterStats) {
                battleStats.monsterStats.totalDamage += totalDamage;
            }
        }

        if (target.currentStats.hp <= 0) {
            this.logBattle(`${target.name} 被击败了！`);
            if (this.backLineMembers && this.backLineMembers.length > 0) {
                const backup = this.backLineMembers.shift();
                this.backLineMembers.push(target);
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
    processAttackProcEffects(source, target, _battleStats) {
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

                            // 处理伤害效果
                            if (effect.effect && effect.effect.type === 'damage') {
                                const procMultiplier = effect.effect.multiplier || 1.0;

                                // 计算原始伤害
                                const rawDamage = source.currentStats.attack * procMultiplier;

                                // 使用JobSkills.applyDamageToTarget方法计算实际伤害
                                let actualDamage = 0;

                                if (typeof JobSkills !== 'undefined' && typeof JobSkills.applyDamageToTarget === 'function') {
                                    // 使用JobSkills.applyDamageToTarget方法，添加skipCritical选项
                                    const damageResult = JobSkills.applyDamageToTarget(source, target, rawDamage, {
                                        skipCritical: true, // 跳过暴击计算
                                        isSpecialAttack: true // 标记为特殊攻击
                                    });

                                    // 确保damageResult是一个对象，并且有damage属性
                                    if (typeof damageResult === 'object' && 'damage' in damageResult) {
                                        actualDamage = damageResult.damage;
                                    } else {
                                        // 如果返回值不是预期的对象，使用简单的伤害计算
                                        actualDamage = Math.floor(rawDamage / (1 + target.currentStats.defense));
                                    }
                                } else {
                                    // 如果JobSkills.applyDamageToTarget不可用，使用Character.calculateDamage方法
                                    if (typeof Character !== 'undefined' && typeof Character.calculateDamage === 'function') {
                                        // 确保Character.characters中有source和target
                                        if (typeof Character.characters !== 'undefined') {
                                            Character.characters[source.id] = source;
                                            Character.characters[target.id] = target;
                                        }
                                        // 计算伤害，设置isSpecialAttack=true，skipCritical=true，确保不触发暴击
                                        const damageResult = Character.calculateDamage(source.id, target.id, true, {
                                            skipCritical: true, // 跳过暴击计算
                                            isSpecialAttack: true // 标记为特殊攻击
                                        });

                                        // 确保damageResult是一个对象，并且有damage属性
                                        if (typeof damageResult === 'object' && 'damage' in damageResult) {
                                            actualDamage = damageResult.damage;
                                        } else {
                                            // 如果返回值不是预期的对象，使用简单的伤害计算
                                            actualDamage = Math.floor(rawDamage / (1 + target.currentStats.defense));
                                        }
                                    } else {
                                        // 如果都不可用，使用简单的伤害计算
                                        actualDamage = Math.floor(rawDamage / (1 + target.currentStats.defense));
                                    }
                                }

                                // 应用伤害
                                const damage = actualDamage.damage || actualDamage;

                                // 确保伤害是有效数字
                                if (isNaN(damage) || damage === undefined) {
                                    console.error("伤害值为NaN或undefined，设置为0");
                                    damage = 0;
                                }

                                // 应用伤害到目标HP
                                target.currentStats.hp = Math.max(0, target.currentStats.hp - damage);

                                // 更新伤害统计
                                source.stats.totalDamage += damage;

                                // 记录被动技能伤害
                                if (skillId === 'whirlwind') {
                                    this.logBattle(`${source.name} 的旋风斩对 ${target.name} 造成了 ${damage} 点伤害！`, true); // 强制记录，不过滤
                                } else {
                                    this.logBattle(`${source.name} 的 ${skill.name}触发了！ 对 ${target.name} 造成了 ${damage} 点伤害！`, true); // 强制记录，不过滤
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
     * @param {boolean} forceLog - 是否强制记录（不过滤）
     */
    logBattle(message, forceLog = false) {

        // 添加新日志
        this.battleLog.push(message);

        // 如果日志超过100条，保留最新的100条
        if (this.battleLog.length > 100) {
            this.battleLog = this.battleLog.slice(-100);
        }

        console.log(`[战斗] ${message}`);

        // 触发日志更新事件，确保UI更新
        if (typeof Events !== 'undefined') {
            Events.emit('battle:log', { message });
        }

        // 如果MainUI存在，直接调用更新方法
        if (typeof MainUI !== 'undefined') {
            MainUI.updateBattleLog();
        }
    },



};
