/**
 * 战斗系统 - 负责游戏中的战斗逻辑
 */
const Battle = {
    // 战斗状态
    isFirstTurn: true,
    currentTurn: 0,
    battleLog: [],
    currentBattle: null, // 保存当前战斗信息
    dungeonTurn: 0, // 地下城回合数
    bossSkillCooldowns: {}, // 存储Boss技能的当前冷却时间

    // 战斗常量
    BASE_DAMAGE_CAP: 199999,
    BASE_SKILL_DAMAGE_CAP: 899999, // Can be different if skills have a separate base cap

    /**
     * 初始化战斗系统
     */
    init() {
        console.log('战斗系统已初始化');
    },

    /**
     * 重置战斗系统
     */
    reset() {
        console.log('重置战斗系统...');
        this.isFirstTurn = true;
        this.currentTurn = 0;
        this.battleLog = [];
        this.currentBattle = null;
        this.dungeonTurn = 0;

        // 清除备用队员信息
        if (this.backLineMembers) {
            this.backLineMembers = [];
        }

        console.log('战斗系统已重置');
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
this.resetProcCounts(); // 重置技能Proc触发计数
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
            skills: monster.skills || [], // 添加 skills 属性
            skillCooldowns: {}, // 初始化技能冷却时间
            isFinalBoss: monster.isFinalBoss || false,
            stats: { totalDamage: 0, totalHealing: 0 },
            xpReward: monster.xpReward || 100
        };

        // 确保怪物的HP和maxHp是有效数字
        if (!monsterCharacter.currentStats) { // 如果 currentStats 不存在，则初始化
            monsterCharacter.currentStats = {};
            console.warn(`怪物 ${monsterCharacter.name} (ID: ${monsterCharacter.id}) 的 currentStats 未定义，已初始化为空对象。`);
        }

        // 优先从 monster.hp (JSON原始数据) 设置 maxHp
        // 然后确保 hp 等于 maxHp
        const initialMaxHpFromJson = monster.hp; // 直接从传入的 monster 对象 (JSON 数据) 的顶层 hp 获取
        
        if (typeof initialMaxHpFromJson === 'number' && !isNaN(initialMaxHpFromJson) && initialMaxHpFromJson > 0) {
            monsterCharacter.currentStats.maxHp = initialMaxHpFromJson;
        } else {
            let foundHpInBaseStats = false;
            if (monster.baseStats) {
                if (typeof monster.baseStats.maxHp === 'number' && !isNaN(monster.baseStats.maxHp) && monster.baseStats.maxHp > 0) {
                    monsterCharacter.currentStats.maxHp = monster.baseStats.maxHp;
                    foundHpInBaseStats = true;
                    console.log(`怪物 ${monsterCharacter.name} (ID: ${monsterCharacter.id}) 使用 monster.baseStats.maxHp: ${monster.baseStats.maxHp} 作为 maxHp。`);
                } else if (typeof monster.baseStats.hp === 'number' && !isNaN(monster.baseStats.hp) && monster.baseStats.hp > 0) {
                    monsterCharacter.currentStats.maxHp = monster.baseStats.hp;
                    foundHpInBaseStats = true;
                    console.log(`怪物 ${monsterCharacter.name} (ID: ${monsterCharacter.id}) 使用 monster.baseStats.hp: ${monster.baseStats.hp} 作为 maxHp。`);
                }
            }

            if (!foundHpInBaseStats) {
                console.error(`怪物 ${monsterCharacter.name} (ID: ${monsterCharacter.id}) 的原始 maxHp (来自 monster.hp: ${initialMaxHpFromJson}) 和 baseStats 无效。将尝试使用 currentStats.maxHp (${monsterCharacter.currentStats.maxHp}) 或默认值 10000。`);
                if (!(typeof monsterCharacter.currentStats.maxHp === 'number' && !isNaN(monsterCharacter.currentStats.maxHp) && monsterCharacter.currentStats.maxHp > 0)) {
                    monsterCharacter.currentStats.maxHp = 10000; // 最后的默认值
                }
            }
        }

        // 设置当前HP为maxHp
        monsterCharacter.currentStats.hp = monsterCharacter.currentStats.maxHp;
        
        // 再次检查并确保hp和maxHp是有效数字，以防万一
        if (isNaN(monsterCharacter.currentStats.maxHp)) {
            console.error("怪物maxHp在最终检查时仍无效，强制设置为默认值10000");
            monsterCharacter.currentStats.maxHp = 10000;
        }
        if (isNaN(monsterCharacter.currentStats.hp) || monsterCharacter.currentStats.hp > monsterCharacter.currentStats.maxHp) {
            console.error("怪物hp在最终检查时无效或大于maxHp，强制设置为maxHp");
            monsterCharacter.currentStats.hp = monsterCharacter.currentStats.maxHp;
        }


        console.log(`[DEBUG] startBattle: 怪物 ${monsterCharacter.name} (ID: ${monsterCharacter.id}) HP 初始化后: ${monsterCharacter.currentStats.hp}/${monsterCharacter.currentStats.maxHp}`);
        console.log(`怪物当前hp: ${monsterCharacter.currentStats.hp}, 怪物状态: `, monsterCharacter);

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
            console.log(`[DEBUG] processBattle: 回合 ${this.currentTurn} 开始。怪物 ${monster.name} HP: ${monster.currentStats.hp}/${monster.currentStats.maxHp}`);

            // 如果在地下城中，增加地下城总回合数
            if (typeof Dungeon !== 'undefined' && Dungeon.currentRun) {
                this.dungeonTurn++;
            }
            // 处理回合开始时的BUFF效果
            this.processTurnStartBuffs(teamMembers, monster);
            console.log(`[DEBUG] processBattle: 回合 ${this.currentTurn}，processTurnStartBuffs 后。怪物 ${monster.name} HP: ${monster.currentStats.hp}/${monster.currentStats.maxHp}`);

            // 处理队伍成员和怪物的行动顺序（玩家永远先手，按照队伍1,2,3,4的顺序行动）
            // 不再使用速度排序，而是保持队伍成员的原始顺序，然后将怪物放在最后
            const allEntities = [...teamMembers, monster];
            const extraTurnQueue = [];

            // 处理每个实体的行动 (Main Pass)
            for (const entity of allEntities) {
                if (this.isBattleOver(teamMembers, monster)) break;
                if (entity.currentStats.hp <= 0) continue;
                if (this.isStunned(entity)) {
                    this.logBattle(`${entity.name} 被眩晕，无法行动！`);
                    continue;
                }

                if (entity === monster) {
                    this.processMonsterAction(monster, teamMembers, battleStats);
                } else { // Player Character
                    this.processCharacterAction(entity, monster, battleStats, teamMembers);

                    // 检查再攻击 BUFF
                    if (entity.currentStats.hp > 0 && !this.isStunned(entity) && typeof BuffSystem !== 'undefined') {
                        const extraTurnBuffs = BuffSystem.getBuffsByType(entity, 'extraAttackTurn');
                        if (extraTurnBuffs && extraTurnBuffs.length > 0) {
                            const activeExtraTurnBuff = extraTurnBuffs.find(b => b.duration > 0); // Find first active one
                            if (activeExtraTurnBuff) {
                                this.logBattle(`${entity.name} 触发了 [再攻击]，将进行一次额外行动!`);
                                BuffSystem.removeBuff(entity, activeExtraTurnBuff.id); // 消耗BUFF
                                extraTurnQueue.push(entity); // 加入额外行动队列
                            }
                        }
                    }
                }
                if (this.isBattleOver(teamMembers, monster)) break;
            }

            // 处理额外行动队列
            let safetyExtraTurnCounter = 0;
            const maxExtraTurnsPerRound = allEntities.length * 2; // 安全上限

            while (extraTurnQueue.length > 0 && safetyExtraTurnCounter < maxExtraTurnsPerRound) {
                if (this.isBattleOver(teamMembers, monster)) break;
                
                const entityForExtraTurn = extraTurnQueue.shift(); // 取出队列中的第一个
                safetyExtraTurnCounter++;

                if (entityForExtraTurn.currentStats.hp <= 0 || this.isStunned(entityForExtraTurn)) {
                    continue;
                }

                this.logBattle(`--- ${entityForExtraTurn.name} 开始额外行动 (第 ${safetyExtraTurnCounter} 次额外行动) ---`);
                this.processCharacterAction(entityForExtraTurn, monster, battleStats, teamMembers); // 执行额外行动

                // 重要：通常额外行动不应再触发“再攻击”从而无限循环。
                // 由于我们消耗了原BUFF，此处的额外行动不会因同一个BUFF再次触发。
                // 如果新BUFF在此额外行动中被施加，它将在下一轮主行动或下一轮额外行动队列处理时考虑（如果队列逻辑允许动态添加）。
                // 当前设计：额外行动不检查新的再攻击buff以加入当前轮次的extraTurnQueue。
                if (this.isBattleOver(teamMembers, monster)) break;
            }
            if (safetyExtraTurnCounter >= maxExtraTurnsPerRound && extraTurnQueue.length > 0) {
                this.logBattle(`警告：额外行动次数达到上限 (${maxExtraTurnsPerRound})，剩余 ${extraTurnQueue.length} 个额外行动未执行。`);
            }


            // 更新BUFF持续时间 (在所有主行动和额外行动之后)
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
            console.log(`怪物当前hp: ${monster.currentStats.hp}, 怪物状态: `, monster.currentStats);

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
                this.logBattle(`\n回合 ${this.dungeonTurn} 结束, ${monster.name} HP: ${Math.floor(monster.currentStats.hp)}/${monster.currentStats.maxHp} (${monsterHpPercent}%)`);
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
                                    this.logBattle(`回合结束${member.name}触发技能${skill.name}`);
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

            // 触发回合结束事件，用于更新UI
            if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
                Events.emit('battle:turn-end');
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
        const allEntities = [...teamMembers, monster];
        for (const entity of allEntities) {
            if (entity.currentStats.hp <= 0) continue;

            // 处理 DoT/HoT (来自 BuffSystem)
            if (typeof BuffSystem !== 'undefined') {
                const result = BuffSystem.processBuffsAtTurnStart(entity);
                if (result.damage > 0) {
                    // 应用持续伤害
                    const damageResult = this.applyDamageToTarget(null, entity, result.damage, { isDot: true }); // 假设 applyDamageToTarget 能处理
                    this.logBattle(`${entity.name} 受到 ${damageResult.damage} 点持续伤害！`);
                }
                if (result.healing > 0) {
                    // 应用持续治疗
                    const actualHeal = Math.min(result.healing, entity.currentStats.maxHp - entity.currentStats.hp);
                    entity.currentStats.hp += actualHeal;
                    this.logBattle(`${entity.name} 恢复了 ${actualHeal} 点生命值！`);
                }
            }

            // 触发回合开始的 Proc 效果
            this.handleProcTrigger(entity, 'onTurnStart', { teamMembers, monster });
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
                const actualExpiredBuffs = Array.isArray(expiredBuffs) ? expiredBuffs : []; // 确保是可迭代的

                let buffNames = "";
                for (const buff of actualExpiredBuffs) {
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
            const expiredBuffsFromSystem = BuffSystem.updateBuffDurations(monster);
            // 确保 expiredBuffs 是可迭代的，以防 BuffSystem.updateBuffDurations 返回 null 或 undefined
            const expiredBuffs = Array.isArray(expiredBuffsFromSystem) ? expiredBuffsFromSystem : [];

            let buffNames = "";
            for (const buff of expiredBuffs) { // 现在迭代的是确保为数组的 expiredBuffs
                buffNames += buff.name + ", ";
            }
            if (buffNames !== "") {
                this.logBattle(`${monster.name} 的 ${buffNames} 效果已结束！`);
            };
        }

        // 更新怪物技能冷却 (常规技能)
        if (monster.skillCooldowns) {
            for (const skillId in monster.skillCooldowns) {
                if (monster.skillCooldowns[skillId] > 0) {
                    monster.skillCooldowns[skillId]--;
                    if (monster.skillCooldowns[skillId] === 0) {
                        const skillData = SkillLoader.getSkillInfo(skillId) || (window.bossSkills && window.bossSkills[skillId]);
                        if (skillData) {
                            // this.logBattle(`${monster.name} 的技能 ${skillData.name} 冷却结束，可以再次使用！`);
                        } else {
                            // this.logBattle(`${monster.name} 的技能 ${skillId} 冷却结束，可以再次使用！`);
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
    processCharacterAction(character, monster, battleStats, currentTeamMembers) {
        if (character.currentStats.hp <= 0) return;

        // // DEBUG LOG: 函数入口
        // console.log(`[DEBUG] processCharacterAction: Character ID: ${character.id}, Name: ${character.name}`);

        // // DEBUG LOG: 角色技能列表及冷却
        // if (character.skills && character.skills.length > 0) {
        //     const skillStates = character.skills.map(skillId => {
        //         const sData = SkillLoader.getSkillInfo(skillId);
        //         const cd = character.skillCooldowns && character.skillCooldowns[skillId] ? character.skillCooldowns[skillId] : 0;
        //         return `${skillId} (Cooldown: ${cd}, Name: ${sData ? sData.name : 'N/A'})`;
        //     });
        //     console.log(`[DEBUG] Character ${character.id} skills: [${skillStates.join(', ')}]`);
        // } else {
        //     console.log(`[DEBUG] Character ${character.id} has no skills in character.skills array.`);
        // }

        let usedAnySkillThisTurn = false;
        let performedNormalAttack = false; // 新增：标记是否已执行普攻
        // const offensiveSkillTypes = ['damage', 'debuff', 'multi_effect', 'trigger']; // 不再需要此变量

        // --- 技能使用阶段 ---
        const availableSkills = this.getAvailableSkills(character);
        // // DEBUG LOG: getAvailableSkills 结果
        // console.log(`[DEBUG] Character ${character.id} getAvailableSkills result: [${availableSkills.join(', ')}]`);

        if (availableSkills && availableSkills.length > 0) {
            for (const skillToUseId of availableSkills) {
                // 检查战斗结束条件
                if (this.isBattleOver(currentTeamMembers, monster) || character.currentStats.hp <= 0 || monster.currentStats.hp <= 0) {
                    break;
                }

                // // DEBUG LOG: 尝试使用的技能
                // console.log(`[DEBUG] Character ${character.id} attempting to use skill ID: ${skillToUseId}`);
                const skillData = SkillLoader.getSkillInfo(skillToUseId);

                if (skillData) {
                    // // DEBUG LOG: 获取到的技能数据
                    // console.log(`[DEBUG] Character ${character.id} skillData for ${skillToUseId}:`, JSON.parse(JSON.stringify(skillData)));
                    if (this.canUseSkill(character, skillToUseId, skillData)) {
                        // // DEBUG LOG: canUseSkill 返回 true
                        // console.log(`[DEBUG] Character ${character.id} canUseSkill for ${skillToUseId} returned true.`);
                        if (typeof JobSkills !== 'undefined' && typeof JobSkills.useSkill === 'function') {
                            try {
                                if (typeof Character !== 'undefined' && !Character.characters[character.id]) {
                                    Character.characters[character.id] = character;
                                }
                                if (typeof JobSkillsTemplate !== 'undefined' && !JobSkillsTemplate.templates[skillToUseId]) {
                                    JobSkillsTemplate.templates[skillToUseId] = skillData;
                                }

                                const targets = this.getEffectTargets(skillData.targetType, character, currentTeamMembers, monster);
                                const result = JobSkills.useSkill(character.id, skillToUseId, targets, monster);

                                if (result.success) {
                                    usedAnySkillThisTurn = true;
                                    // // DEBUG LOG: 技能使用成功
                                    // console.log(`[DEBUG] Character ${character.id} successfully used skill ${skillToUseId}. Message: ${result.message}`);
                                    this.logBattle(result.message || `${character.name} 使用了技能 ${skillData.name}。`);
                                    this.setSkillCooldown(character, skillToUseId, skillData);
                                    this.recordSkillUsage(character, skillToUseId);

                                    // 不再因为技能是“攻击性”而打断循环
                                    // if (offensiveSkillTypes.includes(skillData.effectType)) {
                                    //     hasPerformedOffensiveActionThisTurn = true; // This variable is removed
                                    //     this.logBattle(`${character.name} 使用的技能 ${skillData.name} 是攻击性技能。`);
                                    // }
                                    // 触发技能使用后的 Proc
                                    this.handleProcTrigger(character, 'onSkillUse', { skillId: skillToUseId, skillData, targets, battleStats });
                                } else {
                                    // // DEBUG LOG: 技能使用失败 (JobSkills.useSkill 返回 false)
                                    // console.log(`[DEBUG] Character ${character.id} failed to use skill ${skillToUseId} (JobSkills.useSkill returned false). Message: ${result.message}`);
                                    this.logBattle(`${character.name} 尝试使用技能 ${skillData.name || skillToUseId} 失败。${result.message ? '原因: ' + result.message : ''}`);
                                }
                            } catch (error) {
                                console.error(`技能 ${skillToUseId} 使用错误:`, error);
                                // // DEBUG LOG: 技能使用时发生异常
                                // console.log(`[DEBUG] Character ${character.id} error using skill ${skillToUseId}:`, error);
                                this.logBattle(`${character.name} 尝试使用技能 ${skillData.name || skillToUseId} 时发生错误。`);
                            }
                        } else {
                            // // DEBUG LOG: JobSkills 或 JobSkills.useSkill 未定义
                            // console.log(`[DEBUG] Character ${character.id} cannot use skill ${skillToUseId}: JobSkills.useSkill is not defined.`);
                        }
                    } else {
                        // // DEBUG LOG: canUseSkill 返回 false
                        // console.log(`[DEBUG] Character ${character.id} canUseSkill for ${skillToUseId} returned false. SkillData:`, JSON.parse(JSON.stringify(skillData)));
                         // this.logBattle(`${character.name} 无法使用技能 ${skillData.name || skillToUseId} (不满足使用条件)。`); // 可选：过于详细的日志
                    }
                } else {
                    // // DEBUG LOG: 未获取到技能数据
                    // console.log(`[DEBUG] Character ${character.id} could not get skillData for skill ID: ${skillToUseId}.`);
                }
            }
        } else {
            // // DEBUG LOG: 没有可用技能
            // console.log(`[DEBUG] Character ${character.id} has no available skills this turn.`);
            this.logBattle(`${character.name} 没有可用的技能。`);
        }

        // --- 普通攻击阶段 ---
        // 在所有技能尝试完毕后，如果角色和目标存活，且本回合未执行过普攻，则执行一次普通攻击
        if (character.currentStats.hp > 0 && monster.currentStats.hp > 0 && !performedNormalAttack) {
            if (!this.isBattleOver(currentTeamMembers, monster)) {
                this.logBattle(`${character.name} 在技能使用后，执行普通攻击。`);
                this.executeNormalAttack(character, monster, battleStats, currentTeamMembers); // 调用封装的普攻逻辑
                performedNormalAttack = true;
            } else {
                 this.logBattle(`${character.name} 或 ${monster.name} 已被击败，无法执行普通攻击。`);
            }
        } else if (performedNormalAttack) {
            this.logBattle(`${character.name} 本回合已执行过普通攻击。`);
        } else if (character.currentStats.hp <= 0) {
            this.logBattle(`${character.name} 已被击败，无法执行普通攻击。`);
        } else if (monster.currentStats.hp <= 0) {
            this.logBattle(`${monster.name} 已被击败，${character.name} 无需执行普通攻击。`);
        }


        // 原普通攻击逻辑已移至 executeNormalAttack 函数，此处不再需要重复代码。
// --- End of Turn Triggers for the current character ---
    if (character.currentStats.hp > 0) { // Only for living characters
        // Standard onTurnEnd proc
        this.handleProcTrigger(character, 'onTurnEnd', { battleStats });

        // Specific HP-based onTurnEnd proc
        const hpPercent = character.currentStats.hp / character.currentStats.maxHp;
        if (hpPercent < 0.25) {
            this.logBattle(`${character.name} HP (${(hpPercent*100).toFixed(1)}%) 低于25%，检查特定回合结束触发...`);
            this.handleProcTrigger(character, 'onTurnEndHpBelow25Percent', { battleStats });
        }
    }
    },
executeNormalAttack(character, monster, battleStats, currentTeamMembers) {
        // // DEBUG LOG: 进入普通攻击阶段
        // console.log(`[DEBUG] Character ${character.id} executing normal attack.`);

        let daRate = character.currentStats.daRate || 0.10;
        let taRate = character.currentStats.taRate || 0.05;

        // 应用BUFF效果调整DA/TA率
        if (character.buffs) {
            for (const buff of character.buffs) {
                if (buff.type === 'daBoost') daRate += buff.value;
                if (buff.type === 'taBoost') taRate += buff.value;
                // TODO: 处理 daDown, taDown
            }
        }
        daRate = Math.max(0, daRate); // 确保不为负
        taRate = Math.max(0, taRate);

        const roll = Math.random();
        let attackCount = 1;
        let attackType = "普通攻击";
        let isDA = false;
        let isTA = false;

        if (roll < taRate) {
            attackCount = 3;
            attackType = "三重攻击";
            isTA = true;
            if (character.stats) character.stats.taCount = (character.stats.taCount || 0) + 1;
        } else if (roll < taRate + daRate) {
            attackCount = 2;
            attackType = "双重攻击";
            isDA = true;
            if (character.stats) character.stats.daCount = (character.stats.daCount || 0) + 1;
        }

        let totalDamageDealt = 0;
        let totalHits = 0;
        let criticalHits = 0;

        for (let i = 0; i < attackCount; i++) {
            if (monster.currentStats.hp <= 0) break;

            // 触发攻击前的 Proc (e.g., 攻击前加buff)
            this.handleProcTrigger(character, 'beforeAttack', { target: monster, attackIndex: i, battleStats });

            const rawDamage = Character.calculateAttackPower(character); // 假设这个函数存在且正确
            const damageResult = this.applyDamageToTarget(character, monster, rawDamage, {
                skipCritical: false,
                isMultiAttack: attackCount > 1,
                attackIndex: i + 1,
                totalAttacks: attackCount,
                attackType: 'single', // Normal attacks are single target
                isSkillDamage: false, // 明确这不是技能伤害
                isNormalAttack: true, // 添加此行以指明是普通攻击
                playerTeam: currentTeamMembers ? currentTeamMembers : [character], // Provide team context
                enemyTeam: [monster], // Provide enemy context
                battleStats: battleStats,
                // damageElementType: character.currentStats.attackElement || null // If normal attacks can have elements
            });

            totalDamageDealt += damageResult.damage;
            totalHits++;
            if (damageResult.isCritical) criticalHits++;

            // 触发单次攻击命中后的 Proc (e.g., 追击)
            this.handleProcTrigger(character, 'onAttackHit', { target: monster, damageDealt: damageResult.damage, isCritical: damageResult.isCritical, attackIndex: i, battleStats });

            // 只在第一次攻击时记录攻击类型日志
            if (i === 0) {
                let damageMessage = `${character.name} ${attackType}，`;
                if (damageResult.missed) {
                    damageMessage += `对 ${monster.name} 的攻击未命中！`;
                } else {
                    damageMessage += `对 ${monster.name} 造成 ${damageResult.damage} 点伤害`;
                    if (damageResult.isCritical) damageMessage += '（暴击！）';
                }
                // 暂时不打印单次伤害日志，在后面打印总伤害
                // this.logBattle(damageMessage);
            }
        }

        // 记录总伤害日志
        if (totalHits > 0) {
             let summaryMessage = `${character.name} ${attackType} (${totalHits}次攻击)`;
             if (criticalHits > 0) summaryMessage += ` (${criticalHits}次暴击)`;
             summaryMessage += `，总共对 ${monster.name} 造成 ${totalDamageDealt} 点伤害！`;
             this.logBattle(summaryMessage);
        }


        // 更新统计
        if (character.stats) {
            character.stats.totalDamage = (character.stats.totalDamage || 0) + totalDamageDealt;
            character.stats.critCount = (character.stats.critCount || 0) + criticalHits; // 使用累加的 criticalHits
        }
        if (battleStats && battleStats.characterStats && battleStats.characterStats[character.id]) {
            battleStats.characterStats[character.id].totalDamage += totalDamageDealt;
            battleStats.totalDamage += totalDamageDealt;
            if (isDA) battleStats.characterStats[character.id].daCount++;
            if (isTA) battleStats.characterStats[character.id].taCount++;
            battleStats.characterStats[character.id].critCount += criticalHits; // 使用累加的 criticalHits
        }

        // 触发整个攻击动作完成后的 Proc (包括DA/TA)
        this.handleProcTrigger(character, 'onAttackFinish', { target: monster, totalDamage: totalDamageDealt, isDA, isTA, battleStats });
        if (isTA) {
             this.handleProcTrigger(character, 'onTripleAttack', { target: monster, totalDamage: totalDamageDealt, battleStats });
        } else if (isDA) {
             this.handleProcTrigger(character, 'onDoubleAttack', { target: monster, totalDamage: totalDamageDealt, battleStats });
        }
    },

    /**
     * 处理怪物行动
     * @param {object} monster - 怪物对象
     * @param {array} teamMembers - 队伍成员
     * @param {object} battleStats - 战斗统计
     */
    processMonsterAction(monster, teamMembers, battleStats) {
        if (monster.currentStats.hp <= 0) return;

        let usedActionThisTurn = false;

        // --- 阶段一：血量触发技能 ---
        const hpPercent = monster.currentStats.hp / monster.currentStats.maxHp;
        const triggeredSkills = [];
        if (monster.skills && window.bossSkills) { // 确保 monster.skills 和 window.bossSkills 存在
            for (const skillId of monster.skills) {
                const skillData = window.bossSkills[skillId]; // 从全局 bossSkills 获取技能数据
                if (skillData && skillData.triggerCondition && skillData.triggerCondition.type === "hp_threshold") {
                    if (hpPercent <= skillData.triggerCondition.value) {
                        triggeredSkills.push({ ...skillData, id: skillId }); // 添加id到技能数据中
                    }
                }
            }
        }


        if (triggeredSkills.length > 0) {
            triggeredSkills.sort((a, b) => {
                const priorityA = a.triggerCondition.priority !== undefined ? a.triggerCondition.priority : Infinity;
                const priorityB = b.triggerCondition.priority !== undefined ? b.triggerCondition.priority : Infinity;
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                // 如果优先级相同，则按原始顺序（此处简化为ID顺序，实际应为boss.skills中的顺序）
                return monster.skills.indexOf(a.id) - monster.skills.indexOf(b.id);
            });

            const skillToUse = triggeredSkills[0];
            const skillData = skillToUse; // skillToUse 已经包含了完整的技能数据

            this.logBattle(`${monster.name} 血量 (${(hpPercent * 100).toFixed(1)}%) 触发技能 ${skillData.name}!`);
            if (typeof JobSkills !== 'undefined' && typeof JobSkills.useSkill === 'function') {
                try {
                    if (typeof Character !== 'undefined') { Character.characters = Character.characters || {}; Character.characters[monster.id] = monster; }
                    if (typeof JobSkillsTemplate !== 'undefined' && !JobSkillsTemplate.templates[skillData.id]) { JobSkillsTemplate.templates[skillData.id] = skillData; }

                    const targets = this.getEffectTargets(skillData.targetType, monster, teamMembers, monster);
                    const targetForSkill = this.selectMonsterTarget(monster, teamMembers); // HP触发技能也需要目标
                    const result = JobSkills.useSkill(monster.id, skillData.id, targets, targetForSkill);

                    if (result.success) {
                        this.logBattle(result.message || `${monster.name} 使用了血量触发技能 ${skillData.name}。`);
                        // 血量触发技能不进入CD，也不记录常规使用次数
                        this.handleProcTrigger(monster, 'onSkillUse', { skillId: skillData.id, skillData, targets, battleStats });
                        usedActionThisTurn = true;
                    } else {
                        this.logBattle(`${monster.name} 尝试使用血量触发技能 ${skillData.name} 失败。${result.message ? '原因: ' + result.message : ''}`);
                    }
                } catch (error) {
                    console.error(`怪物血量触发技能 ${skillData.id} 使用错误:`, error);
                    this.logBattle(`${monster.name} 尝试使用血量触发技能 ${skillData.name} 时发生错误。`);
                }
            }
        }

        // --- 阶段二：常规技能 ---
        if (!usedActionThisTurn) {
            const availableSkills = this.getAvailableSkills(monster); // getAvailableSkills 内部会检查CD

            if (availableSkills.length > 0) {
                // 按原始顺序选择第一个可用技能
                let skillToUseId = null;
                let skillDataToUse = null;

                for (const id of monster.skills) { // 遍历Boss原始技能列表以保持顺序
                    if (availableSkills.includes(id)) {
                         skillToUseId = id;
                         skillDataToUse = SkillLoader.getSkillInfo(skillToUseId) || (window.bossSkills && window.bossSkills[skillToUseId]);
                         if (skillDataToUse) break; // 找到第一个可用的
                    }
                }


                if (skillToUseId && skillDataToUse) {
                    this.logBattle(`${monster.name} 准备使用常规技能 ${skillDataToUse.name}。`);
                    if (typeof JobSkills !== 'undefined' && typeof JobSkills.useSkill === 'function') {
                        try {
                            if (typeof Character !== 'undefined') { Character.characters = Character.characters || {}; Character.characters[monster.id] = monster; }
                            if (typeof JobSkillsTemplate !== 'undefined' && !JobSkillsTemplate.templates[skillToUseId]) { JobSkillsTemplate.templates[skillToUseId] = skillDataToUse; }

                            const targets = this.getEffectTargets(skillDataToUse.targetType, monster, teamMembers, monster);
                            const targetForSkill = this.selectMonsterTarget(monster, teamMembers);
                            const result = JobSkills.useSkill(monster.id, skillToUseId, targets, targetForSkill);

                            if (result.success) {
                                this.logBattle(result.message || `${monster.name} 使用了技能 ${skillDataToUse.name}。`);
                                this.setSkillCooldown(monster, skillToUseId, skillDataToUse); // 常规技能设置CD
                                this.recordSkillUsage(monster, skillToUseId);
                                this.handleProcTrigger(monster, 'onSkillUse', { skillId: skillToUseId, skillData: skillDataToUse, targets, battleStats });
                                usedActionThisTurn = true;
                            } else {
                                 this.logBattle(`${monster.name} 尝试使用技能 ${skillDataToUse.name} 失败。${result.message ? '原因: ' + result.message : ''}`);
                            }
                        } catch (error) {
                            console.error(`怪物常规技能 ${skillToUseId} 使用错误:`, error);
                            this.logBattle(`${monster.name} 尝试使用技能 ${skillDataToUse.name} 时发生错误。`);
                        }
                    }
                }
            }
        }

        // --- 阶段三：无技能可用 (普通攻击) ---
        if (!usedActionThisTurn) {
            const target = this.selectMonsterTarget(monster, teamMembers);
            if (!target) return; // 没有有效目标

            this.logBattle(`${monster.name} 没有可用技能，进行普通攻击。`);
            let daRate = monster.currentStats.daRate || 0.1;
            let taRate = monster.currentStats.taRate || 0.03;

            if (monster.buffs) {
                for (const buff of monster.buffs) {
                    if (buff.type === 'daBoost') daRate += buff.value;
                    if (buff.type === 'taBoost') taRate += buff.value;
                }
            }
            daRate = Math.max(0, daRate);
            taRate = Math.max(0, taRate);

            const roll = Math.random();
            let attackCount = 1;
            let attackType = "普通攻击";
            let isDA = false;
            let isTA = false;

            if (roll < taRate) { attackCount = 3; attackType = "三重攻击"; isTA = true; }
            else if (roll < taRate + daRate) { attackCount = 2; attackType = "双重攻击"; isDA = true; }

            let totalDamageDealt = 0;
            let totalHits = 0;
            let criticalHits = 0;

            for (let i = 0; i < attackCount; i++) {
                if (target.currentStats.hp <= 0) break;

                this.handleProcTrigger(monster, 'beforeAttack', { target, attackIndex: i, battleStats });
                const rawDamage = Character.calculateAttackPower(monster);
                const damageResult = this.applyDamageToTarget(monster, target, rawDamage, {
                    isMultiAttack: attackCount > 1,
                    attackIndex: i + 1,
                    totalAttacks: attackCount,
                    isNormalAttack: true, // 添加此行以指明是普通攻击
                    isSkillDamage: false  // 明确这不是技能伤害
                });

                totalDamageDealt += damageResult.damage;
                totalHits++;
                if (damageResult.isCritical) criticalHits++;
                this.handleProcTrigger(monster, 'onAttackHit', { target, damageDealt: damageResult.damage, isCritical: damageResult.isCritical, attackIndex: i, battleStats });

                if (target.currentStats.hp <= 0) {
                    this.logBattle(`${target.name} 被击败了！`);
                    this.handleCharacterDefeat(target, teamMembers);
                    break;
                }
            }

            if (totalHits > 0) {
                let summaryMessage = `${monster.name} ${attackType} (${totalHits}次攻击)`;
                if (criticalHits > 0) summaryMessage += ` (${criticalHits}次暴击)`;
                summaryMessage += `，总共对 ${target.name} 造成 ${totalDamageDealt} 点伤害！`;
                this.logBattle(summaryMessage);
            }

            if (monster.stats) monster.stats.totalDamage = (monster.stats.totalDamage || 0) + totalDamageDealt;
            if (battleStats && battleStats.monsterStats) battleStats.monsterStats.totalDamage += totalDamageDealt;
            this.handleProcTrigger(monster, 'onAttackFinish', { target, totalDamage: totalDamageDealt, isDA, isTA, battleStats });
            if (isTA) this.handleProcTrigger(monster, 'onTripleAttack', { target, totalDamage: totalDamageDealt, battleStats });
            else if (isDA) this.handleProcTrigger(monster, 'onDoubleAttack', { target, totalDamage: totalDamageDealt, battleStats });
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

    // Removed old processAttackProcEffects and executeSingleProcEffect

    /**
     * 中心化的 Proc 触发处理函数
     * @param {object} entity - 触发事件的实体
     * @param {string} triggerType - 触发类型 (e.g., 'onAttackHit', 'onDamagedByEnemy', 'onTurnStart', 'onSkillUse')
     * @param {object} context - 触发事件的上下文信息 (e.g., { target, damageDealt, skillId, battleStats })
     */
    handleProcTrigger(entity, triggerType, context = {}) {
        if (!entity || entity.currentStats.hp <= 0) return;

        const potentialProcs = [];

        // 1. 检查被动技能中的 Proc 定义
        if (entity.skills) {
            for (const skillId of entity.skills) {
                const skillData = SkillLoader.getSkillInfo(skillId); // 需要 SkillLoader
                if (skillData && skillData.passive && skillData.effects) {
                    for (const effectDef of skillData.effects) {
                        if (effectDef.type === 'proc' && effectDef.triggerCondition === triggerType) {
                            potentialProcs.push({ procDef: effectDef, sourceSkill: skillData });
                        }
                    }
                }
            }
        }

        // 2. 检查 BUFF 中的 Proc 定义 (如果 buff 对象包含 proc 定义)
        if (entity.buffs) {
            for (const buff of entity.buffs) {
                // 假设 buff 对象本身可能包含 proc 定义 (需要 BuffSystem 支持)
                if (buff.procDefinition && buff.procDefinition.triggerCondition === triggerType) {
                     potentialProcs.push({ procDef: buff.procDefinition, sourceBuff: buff });
                }
                // 或者，如果 buff 包的 effects 包含 proc 定义
                if (buff.isBuffPackage && buff.effects) {
                     for (const effectDef of buff.effects) {
                         if (effectDef.type === 'proc' && effectDef.triggerCondition === triggerType) {
                             potentialProcs.push({ procDef: effectDef, sourceBuffPackage: buff });
                         }
                     }
                }
            }
        }

        // 3. 处理所有潜在的 Proc
        for (const { procDef, sourceSkill, sourceBuff, sourceBuffPackage } of potentialProcs) {
            const chance = procDef.chance || 1.0; // 默认100%触发
            if (Math.random() < chance) {
                // 检查触发次数限制
                if (procDef.maxActivations) {
                    const activationKey = `${entity.id}_${sourceSkill?.id || sourceBuff?.id || sourceBuffPackage?.id}_${procDef.name || triggerType}`;
                    let activationCount = this.procActivationCounts[activationKey] || 0;
                    if (activationCount >= procDef.maxActivations) {
                        continue; // 已达上限
                    }
                    this.procActivationCounts[activationKey] = activationCount + 1;
                    this.logBattle(`Proc [${procDef.name || triggerType}] 触发 (${activationCount + 1}/${procDef.maxActivations})`);
                } else {
                     this.logBattle(`Proc [${procDef.name || triggerType}] 触发!`);
                }


                // 执行 Proc 效果
                if (procDef.triggeredEffects && Array.isArray(procDef.triggeredEffects)) {
                    for (const triggeredEffect of procDef.triggeredEffects) {
                        this.executeTriggeredEffect(entity, triggeredEffect, context, procDef);
                    }
                }
            }
        }
    },

    /**
     * 执行由 Proc 触发的单个效果
     * @param {object} source - Proc 的来源实体
     * @param {object} effectDef - 触发的效果定义 (e.g., { type: 'damage', multiplier: 1.5 })
     * @param {object} triggerContext - 触发 Proc 的上下文
     * @param {object} procDefinition - 原始的 Proc 定义 (用于日志和次数限制等)
     */
    executeTriggeredEffect(source, effectDef, triggerContext, procDefinition) {
        const { target, battleStats } = triggerContext; // 从上下文中获取目标和战斗统计
        const teamMembers = this.currentBattle?.teamMembers || []; // 获取当前队伍成员
        const monster = this.currentBattle?.monster; // 获取当前怪物

        // 确定效果的目标
        const effectTargets = this.getEffectTargets(effectDef.targetType || 'target', source, teamMembers, monster, triggerContext); // 传递 triggerContext

        for (const currentTarget of effectTargets) {
            if (!currentTarget || currentTarget.currentStats.hp <= 0) continue; // 跳过无效或已阵亡目标

            this.logBattle(`  执行效果: ${effectDef.type} on ${currentTarget.name}`);

            switch (effectDef.type) {
                case 'damage':
                    let rawDamage = 0;
                    const multiplier = effectDef.multiplier || effectDef.minMultiplier || 0; // 处理倍率
                    if (multiplier > 0) {
                         rawDamage = Character.calculateAttackPower(source) * multiplier;
                         // TODO: 处理 min/maxMultiplier
                    } else if (effectDef.value) { // 固定伤害
                         rawDamage = effectDef.value;
                    }
                    if (rawDamage > 0) {
                        const damageResult = this.applyDamageToTarget(source, currentTarget, rawDamage, {
                            isProc: true, // 标记为Proc伤害
                            damageType: effectDef.damageType, // 如 'plain_damage'
                            elementType: effectDef.elementType // 传递元素类型
                        });
                        this.logBattle(`    对 ${currentTarget.name} 造成 ${damageResult.damage} 点伤害.`);
                        if (currentTarget.currentStats.hp <= 0) {
                             this.logBattle(`    ${currentTarget.name} 被击败!`);
                             this.handleCharacterDefeat(currentTarget, teamMembers);
                        }
                    }
                    break;
                case 'multiHitDamage':
                     let totalMultiHitDamage = 0;
                     const hitCount = effectDef.count || 1;
                     const multiplierPerHit = effectDef.multiplierPerHit || 0;
                     for (let i = 0; i < hitCount; i++) {
                         if (currentTarget.currentStats.hp <= 0) break;
                         const hitRawDamage = Character.calculateAttackPower(source) * multiplierPerHit;
                         if (hitRawDamage > 0) {
                             const hitDamageResult = this.applyDamageToTarget(source, currentTarget, hitRawDamage, {
                                 isProc: true, isMultiHit: true, attackIndex: i, totalAttacks: hitCount,
                                 damageType: effectDef.damageType, elementType: effectDef.elementType
                             });
                             totalMultiHitDamage += hitDamageResult.damage;
                             if (currentTarget.currentStats.hp <= 0) {
                                 this.logBattle(`    ${currentTarget.name} 在第 ${i+1} 次攻击后被击败!`);
                                 this.handleCharacterDefeat(currentTarget, teamMembers);
                                 break;
                             }
                         }
                     }
                     this.logBattle(`    对 ${currentTarget.name} 进行 ${hitCount} 次攻击，共造成 ${totalMultiHitDamage} 点伤害.`);
                    break;
                case 'heal':
                    let healAmount = 0;
                    if (effectDef.healType === 'percentageMaxHp') {
                        healAmount = Math.floor(currentTarget.currentStats.maxHp * effectDef.value);
                    } else { // 默认固定值
                        healAmount = effectDef.value || 0;
                    }
                    if (healAmount > 0) {
                        const actualHeal = Math.min(healAmount, currentTarget.currentStats.maxHp - currentTarget.currentStats.hp);
                        currentTarget.currentStats.hp += actualHeal;
                        this.logBattle(`    为 ${currentTarget.name} 恢复了 ${actualHeal} 点HP.`);
                        // TODO: 更新治疗统计
                    }
                    break;
                case 'applyBuff': // 重命名以区分 BuffSystem.applyBuff
                case 'applyDebuff':
                    const buffOptions = {
                        canDispel: effectDef.dispellable,
                        stackable: effectDef.stackable,
                        maxStacks: effectDef.maxStacks,
                        elementType: effectDef.elementType, // For elemental buffs/resists
                        statusToImmune: effectDef.status, // For status immunity
                        convertToElementType: effectDef.convertToElementType // For damage conversion
                        // Add other specific options as needed
                    };
                    const buffObject = BuffSystem.createBuff(effectDef.buffType, effectDef.value, effectDef.duration, source, buffOptions);
                    if (buffObject) {
                        BuffSystem.applyBuff(currentTarget, buffObject);
                        this.logBattle(`    为 ${currentTarget.name} 施加了 ${buffObject.name}.`);
                    }
                    break;
                 case 'applyBuffPackage':
                     // 假设 effectDef 包含 buffName, duration, dispellable, stackable, maxStacks, buffs/effects, buffsPerStack
                     BuffSystem.applyBuffPackage(currentTarget, effectDef, source);
                     this.logBattle(`    为 ${currentTarget.name} 施加了效果包 [${effectDef.buffName}].`);
                     break;
                case 'dispel':
                    const dispelPositive = effectDef.dispelPositive || false; // true驱散增益, false驱散减益
                    const dispelCount = effectDef.count || 1;
                    const dispelled = BuffSystem.dispelBuffs(currentTarget, dispelPositive, dispelCount);
                    if (dispelled.length > 0) {
                        this.logBattle(`    驱散了 ${currentTarget.name} 的 ${dispelled.map(b => b.name).join(', ')}.`);
                    } else {
                        this.logBattle(`    尝试驱散 ${currentTarget.name}，但没有可驱散的BUFF.`);
                    }
                    break;
                 case 'dispelAll':
                     const dispelAllPositive = effectDef.dispelPositive || false;
                     const allBuffs = [...currentTarget.buffs]; // 复制数组
                     let dispelledAllCount = 0;
                     for(const buff of allBuffs) {
                         if (buff.canDispel && buff.isPositive === dispelAllPositive) {
                             if (BuffSystem.removeBuff(currentTarget, buff.id)) {
                                 dispelledAllCount++;
                             }
                         }
                     }
                     this.logBattle(`    驱散了 ${currentTarget.name} 的 ${dispelledAllCount} 个所有${dispelAllPositive ? '增益' : '减益'}状态.`);
                     break;
                case 'castSkill':
                    if (effectDef.skillId) {
                        this.logBattle(`    触发释放技能: ${effectDef.skillId}`);
                        const skillData = SkillLoader.getSkillInfo(effectDef.skillId);
                        if (skillData && typeof JobSkills !== 'undefined' && typeof JobSkills.useSkill === 'function') {
                             // 确定触发技能的目标
                             const castTargets = this.getEffectTargets(skillData.targetType, source, teamMembers, monster, triggerContext);
                             try {
                                 // 确保实体和技能模板可用
                                 if (typeof Character !== 'undefined') { Character.characters = Character.characters || {}; Character.characters[source.id] = source; }
                                 if (typeof JobSkillsTemplate !== 'undefined' && !JobSkillsTemplate.templates[effectDef.skillId]) { JobSkillsTemplate.templates[effectDef.skillId] = skillData; }

                                 // 调用技能 (注意：这里可能导致递归或复杂交互，需谨慎处理)
                                 // 传递原始触发的目标可能不合适，应根据触发技能本身的目标类型来定
                                 const castResult = JobSkills.useSkill(source.id, effectDef.skillId, castTargets, monster); // 传递新目标
                                 if (castResult.success) {
                                     this.logBattle(`    由Proc触发的技能 ${skillData.name} 成功释放: ${castResult.message}`);
                                     // 注意：被触发的技能通常不计入冷却或使用次数，除非特殊设计
                                 }
                             } catch (error) {
                                 console.error(`Proc触发的技能 ${effectDef.skillId} 使用错误:`, error);
                             }
                        } else {
                             console.warn(`Proc尝试触发未知技能: ${effectDef.skillId}`);
                        }
                    }
                    break;
                // 添加其他效果类型...
                default:
                    this.logBattle(`    未知的触发效果类型: ${effectDef.type}`);
            }
        }
    },

    /**
     * 记录战斗日志
     * @param {string} message - 日志消息
     * @param {boolean} forceLog - 是否强制记录（不过滤）
     */
    logBattle(message, forceLog = false) {
        // 简单的日志过滤，避免重复或过于频繁的日志
        // if (!forceLog && this.battleLog.length > 0 && this.battleLog[this.battleLog.length - 1] === message) {
        //     return; // Skip duplicate messages unless forced
        // }

        // 添加新日志
        this.battleLog.push(message);

        // 限制日志长度
        const MAX_LOG_LINES = 150; // 增加日志容量
        if (this.battleLog.length > MAX_LOG_LINES) {
            this.battleLog = this.battleLog.slice(-MAX_LOG_LINES);
        }

        console.log(`[战斗][回合 ${this.currentTurn}] ${message}`); // 添加回合信息

        // 触发日志更新事件
        if (typeof Events !== 'undefined') {
            Events.emit('battle:log', { message });
        }

        // 更新UI (如果可用)
        if (typeof MainUI !== 'undefined' && typeof MainUI.updateBattleLog === 'function') {
            MainUI.updateBattleLog();
        }
    },

    // --- Helper Methods for Skill Usage ---

    getAvailableSkills(entity) {
        if (!entity.skills) return [];
        return entity.skills.filter(skillId => {
            const skillData = SkillLoader.getSkillInfo(skillId);
            if (!skillData || skillData.passive) return false; // 过滤被动技能
            return this.canUseSkill(entity, skillId, skillData); // 检查冷却和次数
        });
    },

    canUseSkill(entity, skillId, skillData) {
        // 1. 检查冷却
        if (entity.skillCooldowns && entity.skillCooldowns[skillId] > 0) {
            return false;
        }
        // 2. 检查初始冷却 (仅在战斗中第一次使用时检查)
        const usageCount = (entity.skillUsageCount && entity.skillUsageCount[skillId]) || 0;
        if (usageCount === 0 && skillData.initialCooldown && this.currentTurn < skillData.initialCooldown) {
             return false;
        }
        // 3. 检查使用次数限制 (once, oncePerBattle)
        if (skillData.once && usageCount > 0) {
            return false;
        }
        // TODO: 实现 oncePerBattle 检查 (需要战斗实例ID或标记)

        // 4. 检查沉默状态
        if (entity.buffs && entity.buffs.some(b => b.type === 'silence')) {
             // 检查是否有沉默免疫
             if (!(entity.buffs && entity.buffs.some(b => b.type === 'statusImmunity' && b.statusToImmune === 'silence'))) {
                 this.logBattle(`${entity.name} 处于沉默状态，无法使用技能 ${skillData.name}!`);
                 return false;
             }
        }

        // 5. TODO: 检查其他条件 (如 HP 阈值, 特定 buff 存在等)

        return true;
    },

    setSkillCooldown(entity, skillId, skillData) {
        if (!entity.skillCooldowns) entity.skillCooldowns = {};
        const usageCount = (entity.skillUsageCount && entity.skillUsageCount[skillId]) || 0;
        let cooldown = skillData.cooldown || 0;
        // 处理 nextCooldown
        if (usageCount > 0 && skillData.nextCooldown !== undefined) {
            cooldown = skillData.nextCooldown;
        }
        entity.skillCooldowns[skillId] = cooldown;
    },

    recordSkillUsage(entity, skillId) {
        if (!entity.skillUsageCount) entity.skillUsageCount = {};
        entity.skillUsageCount[skillId] = (entity.skillUsageCount[skillId] || 0) + 1;
    },

    // --- Helper Methods for Target Selection ---

    selectMonsterTarget(monster, teamMembers) {
        const aliveMembers = teamMembers.filter(member => member.currentStats.hp > 0);
        if (aliveMembers.length === 0) return null;

        // 计算总威胁值
        let totalThreat = 0;
        const memberThreats = aliveMembers.map(member => {
            let threatValue = 100; // Base threat
            if (member.buffs) {
                for (const buff of member.buffs) {
                    if (buff.type === 'threatUp') threatValue *= (1 + buff.value); // 假设 threatUp 是百分比增加
                    else if (buff.type === 'threatDown') threatValue *= (1 - buff.value); // 假设 threatDown 是百分比减少
                }
            }
            threatValue = Math.max(1, threatValue); // Ensure minimum threat
            totalThreat += threatValue;
            return { member, threatValue };
        });

        if (totalThreat <= 0) { // Fallback if all threat is negative or zero
            return aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
        }

        // 按威胁值随机选择
        const roll = Math.random() * totalThreat;
        let cumulativeThreat = 0;
        for (const memberThreat of memberThreats) {
            cumulativeThreat += memberThreat.threatValue;
            if (roll < cumulativeThreat) {
                return memberThreat.member;
            }
        }

        // Fallback (should not happen if totalThreat > 0)
        return aliveMembers[aliveMembers.length - 1];
    },

    getEffectTargets(targetType, source, teamMembers, monster, triggerContext = {}) {
        const aliveTeamMembers = teamMembers.filter(m => m.currentStats.hp > 0);
        const aliveEnemies = monster.currentStats.hp > 0 ? [monster] : []; // Assuming single monster for now

        switch (targetType) {
            case 'self':
                return [source];
            case 'enemy': // 通常指单个主要敌人
                return source === monster ? [this.selectMonsterTarget(source, aliveTeamMembers)] : aliveEnemies;
            case 'random_enemy':
                 const enemiesForRandom = source === monster ? aliveTeamMembers : aliveEnemies;
                 return enemiesForRandom.length > 0 ? [enemiesForRandom[Math.floor(Math.random() * enemiesForRandom.length)]] : [];
            case 'all_enemies':
                return source === monster ? aliveTeamMembers : aliveEnemies;
            case 'ally': // 单个随机友方 (不含自己)
                const potentialAllies = aliveTeamMembers.filter(m => m !== source);
                return potentialAllies.length > 0 ? [potentialAllies[Math.floor(Math.random() * potentialAllies.length)]] : [];
            case 'all_allies': // 所有友方 (含自己)
                return aliveTeamMembers;
            case 'ally_lowest_hp':
                 if (aliveTeamMembers.length === 0) return [];
                 return [aliveTeamMembers.reduce((lowest, current) =>
                     (current.currentStats.hp / current.currentStats.maxHp) < (lowest.currentStats.hp / lowest.currentStats.maxHp) ? current : lowest, aliveTeamMembers[0])];
            case 'ally_dead':
                 const deadAllies = teamMembers.filter(m => m.currentStats.hp <= 0);
                 // TODO: Decide if it targets one random dead ally or all? Assuming one for now.
                 return deadAllies.length > 0 ? [deadAllies[Math.floor(Math.random() * deadAllies.length)]] : [];
            case 'self_and_main': // 需要识别主角
                 const mainCharacter = teamMembers.find(m => m.isMainCharacter); // Assuming isMainCharacter property exists
                 const targets = [source];
                 if (mainCharacter && mainCharacter !== source && mainCharacter.currentStats.hp > 0) {
                     targets.push(mainCharacter);
                 }
                 return targets;
            case 'all_allies_fire':
            case 'all_allies_water':
            case 'all_allies_earth':
            case 'all_allies_wind':
            case 'all_allies_light':
            case 'all_allies_dark':
                 const elementType = targetType.split('_').pop();
                 return aliveTeamMembers.filter(m => m.attribute === elementType); // Assuming attribute property exists
            case 'target': // Usually refers to the target of the triggering action (e.g., onAttackHit)
                 return triggerContext.target && triggerContext.target.currentStats.hp > 0 ? [triggerContext.target] : [];
            default: // Fallback or specific ID target
                 const specificTarget = teamMembers.find(m => m.id === targetType);
                 return specificTarget && specificTarget.currentStats.hp > 0 ? [specificTarget] : [];
        }
    },
reviveCharacter(character, hpPercentToRestore, teamData) { // teamData is e.g. Game.playerTeam
        if (!character || !teamData || !teamData.members) {
            console.error("Revive failed: Invalid character or team data provided for revival.");
            this.logBattle(`对 ${character ? character.name : '未知角色'} 的复活操作失败: 缺少参数。`);
            return false;
        }

        if (character.currentStats.hp > 0) {
            this.logBattle(`${character.name} 还活着，不需要复活。`);
            return false; // Already alive
        }

        // 1. Restore HP
        const hpRestored = Math.floor(character.currentStats.maxHp * hpPercentToRestore);
        character.currentStats.hp = Math.max(1, hpRestored); // Ensure at least 1 HP
        
        this.logBattle(`${character.name} 被复活了，恢复了 ${character.currentStats.hp}点HP!`);

        // 2. Clear any death-related statuses/buffs
        // Example: remove a "Death" debuff if your system uses one
        if (typeof BuffSystem !== 'undefined' && character.buffs) {
            const deathDebuff = character.buffs.find(b => b.type === 'deathStatus' || b.name === '死亡');
            if (deathDebuff) {
                BuffSystem.removeBuff(character, deathDebuff.id);
            }
        }
        // character.isDead = false; // If using a direct flag

        // 3. Team Reordering
        const memberId = character.id;
        const currentIndex = teamData.members.indexOf(memberId);

        if (currentIndex > -1) {
            teamData.members.splice(currentIndex, 1); 
            teamData.members.push(memberId);      
            this.logBattle(`${character.name} 在队伍中的顺序已移至末尾。`);

            // Notify UI or other systems if necessary
            // This part is highly dependent on how UI and global state are managed.
            // Example:
            if (typeof Game !== 'undefined' && Game.playerTeam && Game.playerTeam.id === teamData.id) {
                 // If direct Game.playerTeam was modified, UI might auto-update or need a signal
                 if (typeof UI !== 'undefined' && typeof UI.renderTeam === 'function') {
                    // UI.renderTeam(Game.playerTeam); // This might be too direct, an event is better
                 }
                 if (typeof Events !== 'undefined' && Events.emit) {
                    Events.emit('team:orderChanged', { teamId: teamData.id, newOrder: teamData.members });
                 }
            } else {
                console.warn("Team data provided for revive reorder might not be the main player team. UI update might be manual.");
            }
        } else {
            console.error(`Revived character ${memberId} not found in the provided teamData.members list for reordering.`);
            // Potentially add to end if they should be in team but weren't?
            // teamData.members.push(memberId); // Risky if character shouldn't be in this specific team list
        }
        
        // Trigger 'onRevive' procs
        this.handleProcTrigger(character, 'onRevive', { battleStats: (this.currentBattle ? this.currentBattle.battleStats : {}) });

        return true;
    },

     // --- Helper Method for Damage Application (Refined) ---
     // This assumes the core damage calculation logic (defense reduction, crits, elemental advantage)
     // might be complex and potentially better placed within Character or a dedicated DamageCalculator module.
     // For now, this method handles applying the calculated damage and checks like shield/invincible.
     applyDamageToTarget(attacker, target, rawDamage, options = {}) {
         // options may include: { isProc, attackType: 'single'/'aoe', playerTeam, enemyTeam, battleStats }
         if (!target || target.currentStats.hp <= 0 || rawDamage <= 0) {
             return { damage: 0, isCritical: false, missed: false, isProc: options.isProc, actualTarget: target };
         }

         let actualTarget = target;
         const originalTarget = target;
         const battleStats = options.battleStats || {}; // Ensure battleStats exists

         // --- Cover Logic ---
         // Cover applies if:
         // 1. Attack is single target.
         // 2. Original target has living allies on their team.
         // 3. One of those allies has an active 'cover' buff.
         if (options.attackType === 'single' && typeof BuffSystem !== 'undefined') {
             let alliesOfOriginalTarget = [];
             const playerTeam = options.playerTeam || [];
             const enemyTeam = options.enemyTeam || [];

             const originalTargetIsPlayer = playerTeam.some(p => p.id === originalTarget.id);
             const originalTargetIsEnemy = enemyTeam.some(e => e.id === originalTarget.id);

             if (originalTargetIsPlayer) {
                 alliesOfOriginalTarget = playerTeam.filter(member => member.id !== originalTarget.id && member.currentStats.hp > 0);
             } else if (originalTargetIsEnemy) {
                 alliesOfOriginalTarget = enemyTeam.filter(enemy => enemy.id !== originalTarget.id && enemy.currentStats.hp > 0);
             }

             if (alliesOfOriginalTarget.length > 0) {
                 const potentialCoverers = [];
                 for (const ally of alliesOfOriginalTarget) {
                     const coverBuffs = BuffSystem.getBuffsByType(ally, 'cover'); // Assumes BuffSystem is globally available
                     if (coverBuffs && coverBuffs.length > 0) {
                         // Assuming the first active cover buff is chosen. Add more complex priority later if needed.
                         potentialCoverers.push({ coverer: ally, buff: coverBuffs[0] });
                     }
                 }

                 if (potentialCoverers.length > 0) {
                     // TODO: Implement priority logic if multiple coverers (e.g., position, specific skill priority)
                     // For now, take the first one found.
                     // A more robust selection would involve sorting or checking specific cover conditions.
                     const selectedCovererInfo = potentialCoverers[0]; // Simplistic choice
                     actualTarget = selectedCovererInfo.coverer;
                     this.logBattle(`${actualTarget.name} 援护了 ${originalTarget.name}!`);
                 }
             }
         }
         // All subsequent calculations use 'actualTarget'

         let finalDamage = rawDamage;
         let isCritical = false;
         let missed = false;

         // TODO: Implement Hit/Evasion check against actualTarget
         // if (Math.random() < calculateMissChance(attacker, actualTarget)) { missed = true; finalDamage = 0; }

         if (!missed) {
             // TODO: Implement Critical Hit check & damage bonus (attacker vs actualTarget)
             // if (!options.skipCritical && Math.random() < calculateCritChance(attacker, actualTarget)) {
             //     isCritical = true;
             //     finalDamage *= calculateCritMultiplier(attacker, actualTarget);
             // }

             // TODO: Implement Defense reduction (actualTarget's defense)
             // finalDamage *= calculateDefenseReduction(attacker, actualTarget);

             // TODO: Implement Elemental Advantage/Disadvantage bonus/penalty (attacker vs actualTarget)
             // finalDamage *= calculateElementMultiplier(attacker, actualTarget, options.elementType);

             // TODO: Implement other damage modifiers (buffs/debuffs on attacker/actualTarget)

             // --- New Defense Calculation ---

             // --- Apply Attacker's Damage Cap Up (General and Skill-Specific) ---
             let currentDamageCap = Battle.BASE_DAMAGE_CAP || 199999; // Default base cap
             let capAppliedBy = "基础"; // For logging

             if (attacker && attacker.buffs && typeof BuffSystem !== 'undefined') {
                 if (options.isSkillDamage) {
                     let totalSkillDamageCapUpBonus = 0;
                     const skillCapBuffs = BuffSystem.getBuffsByType(attacker, 'skillDamageCapUp');
                     if (skillCapBuffs) {
                         skillCapBuffs.forEach(buff => {
                             if (buff.duration > 0 && buff.value) {
                                 totalSkillDamageCapUpBonus += buff.value;
                             }
                         });
                     }
                     if (totalSkillDamageCapUpBonus > 0) {
                         const baseForSkillCap = Battle.BASE_SKILL_DAMAGE_CAP || Battle.BASE_DAMAGE_CAP || 899999;
                         currentDamageCap = baseForSkillCap * (1 + totalSkillDamageCapUpBonus);
                         capAppliedBy = `技能伤害上限提升 (${totalSkillDamageCapUpBonus*100}%)`;
                     }
                 }
                 
                 // If not a skill, or if skill cap wasn't applied (no skillDamageCapUp buff), check for general damageCapUp
                 // Or, if general damage cap can further increase skill cap (more complex, not implementing now)
                 // Current logic: Skill cap takes precedence. If no skill cap applied, check general.
                 if (capAppliedBy === "基础" || options.applyGeneralCapEvenWithSkillCap) { // Latter part for future flexibility
                     let totalDamageCapUpBonus = 0;
                     const damageCapBuffs = BuffSystem.getBuffsByType(attacker, 'damageCapUp');
                     if (damageCapBuffs) {
                         damageCapBuffs.forEach(buff => {
                             if (buff.duration > 0 && buff.value) {
                                 totalDamageCapUpBonus += buff.value;
                             }
                         });
                     }
                     if (totalDamageCapUpBonus > 0) {
                         const generalCalculatedCap = (Battle.BASE_DAMAGE_CAP || 999999) * (1 + totalDamageCapUpBonus);
                         // If skill cap was already set, only update if general cap is higher (or based on specific game rule)
                         // For now, if skill cap was set, it's dominant. If not, general cap applies.
                         if (capAppliedBy === "基础") {
                            currentDamageCap = generalCalculatedCap;
                            capAppliedBy = `伤害上限提升 (${totalDamageCapUpBonus*100}%)`;
                         } else if (options.applyGeneralCapEvenWithSkillCap && generalCalculatedCap > currentDamageCap) {
                            // Example: if general cap can exceed a specific skill cap
                            // currentDamageCap = generalCalculatedCap;
                            // capAppliedBy = `通用伤害上限提升 (${totalDamageCapUpBonus*100}%)`;
                         }
                     }
                 }
             }

             if (finalDamage > currentDamageCap) {
                 this.logBattle(`${attacker.name} 的 ${capAppliedBy} 触发，伤害从 ${Math.floor(finalDamage)} 限制到 ${Math.floor(currentDamageCap)}`);
                 finalDamage = Math.floor(currentDamageCap);
             }
             finalDamage = Math.floor(finalDamage);

             // --- Apply actualTarget's Defensive Measures ---
             const targetEffectiveDefense = Math.max(0, (actualTarget.currentStats.defense || 0) - (attacker.currentStats.ignoreDefense || 0));
             finalDamage = finalDamage / (1 + targetEffectiveDefense/100);
             // --- End New Defense Calculation ---

             finalDamage = Math.max(1, Math.floor(finalDamage)); // Minimum 1 damage unless missed

             // 1. Invincibility
             if (actualTarget.buffs && actualTarget.buffs.some(b => b.type === 'invincible' && b.duration > 0)) {
                 this.logBattle(`${actualTarget.name} 无敌，免疫了伤害!`);
                 finalDamage = 0;
             }

             // 2. EvasionAll
             if (finalDamage > 0 && actualTarget.buffs && actualTarget.buffs.some(b => b.type === 'evasionAll' && b.duration > 0)) {
                 this.logBattle(`${actualTarget.name} 完全回避了伤害!`);
                 finalDamage = 0;
                 missed = true;
             }

             // 3. Shield
             if (finalDamage > 0 && actualTarget.shield && actualTarget.shield > 0) {
                 const shieldDamage = Math.min(finalDamage, actualTarget.shield);
                 actualTarget.shield -= shieldDamage;
                 finalDamage -= shieldDamage;
                 this.logBattle(`${actualTarget.name} 的护盾吸收了 ${shieldDamage} 点伤害 (剩余 ${actualTarget.shield})`);
             }

             // 4. Damage Cap (Elemental or All) - Applied to actualTarget
             if (actualTarget.buffs && options.damageElementType) {
                 actualTarget.buffs.forEach(buff => {
                     if (buff.type === 'elementalDamageCap' && buff.elementType === options.damageElementType && buff.duration > 0) {
                         if (finalDamage > buff.value) {
                             this.logBattle(`${actualTarget.name} 的${buff.elementType}属性伤害上限触发，伤害从 ${finalDamage} 降低到 ${buff.value}`);
                             finalDamage = buff.value;
                         }
                     }
                     // TODO: Implement general damageCapUp logic for actualTarget (this is for damage TAKEN cap, different from attacker's damageCapUp)
                 });
             }
             finalDamage = Math.floor(finalDamage); // Ensure integer damage after cap

             // 5. Damage Reduction (All Damage or Elemental) - Applied to actualTarget
             let damageReduction = 0;
             if (actualTarget.buffs) {
                 actualTarget.buffs.forEach(buff => {
                     if (buff.type === 'allDamageTakenReduction' && buff.duration > 0) {
                         damageReduction += buff.value; // Assuming buff.value is a percentage like 0.2 for 20%
                     }
                     //todo 根据elementalResistance 的 元素伤害类型来判断是否减伤
                     else if (buff.type === 'elementalResistance' && buff.duration > 0) {
                        damageReduction += buff.value; // Assuming buff.value is a percentage like 0.2 for 20%
                    }
                 });
             }
             finalDamage *= Math.max(0, 1 - damageReduction);
             finalDamage = Math.floor(finalDamage);

         } // End if (!missed)

         // Apply final damage to actualTarget
         const previousHp = actualTarget.currentStats.hp; // Store HP before damage
         const actualDamageDealt = finalDamage; // finalDamage is the conclusive damage to be applied
 
         actualTarget.currentStats.hp = Math.max(0, previousHp - actualDamageDealt);
 
         // Enhanced Logging for Damage Dealt
         let damageSourceInfo = "";
         if (options && options.skillName) {
             damageSourceInfo = `通过 [${options.skillName}]`;
         } else if (options && options.isNormalAttack) {
             damageSourceInfo = `通过 普通攻击`;
         } else if (options && options.buffName) { // For DOTs or other buff-induced damage
             damageSourceInfo = `通过 [${options.buffName}] 效果`;
         } else if (options && options.isProc) {
             damageSourceInfo = `通过 触发效果`;
         }
         
         const attackerName = attacker ? attacker.name : '未知攻击者';
 
         if (actualDamageDealt > 0) {
             this.logBattle(
                 `${attackerName} ${damageSourceInfo} 对 ${actualTarget.name} 造成了 ${actualDamageDealt} 点伤害！` +
                 ` HP: ${previousHp} -> ${actualTarget.currentStats.hp}` +
                 `${isCritical ? ' (暴击!)' : ''}` // Missed is handled earlier or results in 0 damage
             );
         } else if (missed) { // 'missed' flag should be set if an attack misses entirely
             this.logBattle(
                 `${attackerName} ${damageSourceInfo} 对 ${actualTarget.name} 的攻击未命中！`
             );
         } else if (rawDamage > 0 && actualDamageDealt === 0) { // Damage was dealt but fully mitigated (e.g. invincible, shield)
              this.logBattle(
                 `${attackerName} ${damageSourceInfo} 对 ${actualTarget.name} 的攻击被完全吸收/免疫。 HP: ${actualTarget.currentStats.hp}`
             );
         }
         // End Enhanced Logging
 
         if (attacker && attacker.stats && actualDamageDealt > 0) { // Record attacker's damage dealt
             attacker.stats.totalDamage = (attacker.stats.totalDamage || 0) + actualDamageDealt;
             if (battleStats.characterStats && battleStats.characterStats[attacker.id]) {
                 battleStats.characterStats[attacker.id].totalDamage += actualDamageDealt;
             } else if (battleStats.monsterStats && attacker.id === options.enemyTeam?.[0]?.id) { // Basic monster damage tracking
                 battleStats.monsterStats.totalDamage += actualDamageDealt;
             }
         }
 
 
         // Trigger onDamaged proc for the actualTarget that took damage
         if (actualDamageDealt > 0) {
             this.handleProcTrigger(actualTarget, 'onDamaged', { attacker, damageTaken: actualDamageDealt, isCritical, isProc: options.isProc, battleStats, originalTarget: originalTarget });
             if (attacker) {
                 this.handleProcTrigger(actualTarget, 'onDamagedByEnemy', { attacker, damageTaken: actualDamageDealt, isCritical, isProc: options.isProc, battleStats, originalTarget: originalTarget });
             }
         }
         // If original target was different and didn't take damage due to cover, maybe trigger 'onTargetedButCovered' proc? (Future enhancement)
 
         return { damage: actualDamageDealt, isCritical, missed, isProc: options.isProc, actualTarget: actualTarget, originalTarget: originalTarget };
     },

     // --- Helper Method for Character Defeat ---
     handleCharacterDefeat(defeatedCharacter, teamMembers) {
         // Remove character from active team members? Or just mark as defeated?
         // For now, just log and handle backup.
         if (this.backLineMembers && this.backLineMembers.length > 0) {
             const backup = this.backLineMembers.shift();
             // Find the index of the defeated character in the current front line
             const targetIndex = teamMembers.findIndex(member => member.id === defeatedCharacter.id);
             if (targetIndex !== -1) {
                 teamMembers[targetIndex] = backup; // Replace in the array
                 this.logBattle(`${backup.name} 从后排上场替换阵亡的 ${defeatedCharacter.name}！`);
                 // Trigger battle start traits for the new member
                 this.processBattleStartTraits(backup, teamMembers);
             } else {
                  // Should not happen if defeatedCharacter was in teamMembers
                  console.error(`无法在队伍中找到阵亡角色 ${defeatedCharacter.name} 的位置`);
                  this.backLineMembers.unshift(backup); // Put back if replacement failed
             }
         }
     },

     // --- Proc Activation Count Tracking ---
     procActivationCounts: {}, // Stores counts like { 'entityId_skillId_procName': count }

     // Reset proc counts at the start of each battle
     resetProcCounts() {
         this.procActivationCounts = {};
     },


};
