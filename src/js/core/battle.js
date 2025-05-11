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
     * 处理战斗过程 - 新的三阶段流程
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物角色对象
     * @returns {object} 战斗结果
     */
    processBattle(teamMembers, monster) {
        const MAX_TURNS = 99;
        console.log("初始化怪物HP前:", monster.currentStats);
        monster.currentStats.hp = monster.currentStats.maxHp || monster.currentStats.hp;
        console.log("初始化怪物HP后:", monster.currentStats);

        if (isNaN(monster.currentStats.hp) || monster.currentStats.hp === undefined) {
            console.error("怪物HP初始化为NaN或undefined，强制设置为maxHp");
            monster.currentStats.hp = monster.currentStats.maxHp;
            if (isNaN(monster.currentStats.hp) || monster.currentStats.hp === undefined) {
                console.error("怪物maxHp也是NaN或undefined，强制设置为10000");
                monster.currentStats.hp = 10000;
                monster.currentStats.maxHp = 10000;
            }
        }

        const battleStats = {
            totalDamage: 0,
            totalHealing: 0,
            characterStats: {},
            monsterStats: { totalDamage: 0, totalHealing: 0 }
        };

        for (const member of teamMembers) {
            battleStats.characterStats[member.id] = {
                totalDamage: 0, totalHealing: 0, daCount: 0, taCount: 0, critCount: 0, buffsApplied: 0, debuffsApplied: 0
            };
            if (!member.buffs) member.buffs = [];
            this.processBattleStartTraits(member, teamMembers);
        }
        if (!monster.buffs) monster.buffs = [];

        while (this.currentTurn < MAX_TURNS) {
            this.currentTurn++;
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, `\n===== 回合 ${this.currentTurn} 开始 =====`, null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `回合 ${this.currentTurn} 开始`, null, this.currentTurn);
            if (typeof Dungeon !== 'undefined' && Dungeon.currentRun) this.dungeonTurn++;

            this.processTurnStartBuffs(teamMembers, monster);
            if (this.isBattleOver(teamMembers, monster)) break;

            // --- 我方技能阶段 ---
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, "--- 我方技能阶段 ---", null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, "我方技能阶段开始", null, this.currentTurn);
            this.executePlayerSkillPhase(teamMembers, monster, battleStats);
            if (this.isBattleOver(teamMembers, monster)) break;

            // --- 我方普攻阶段 ---
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, "--- 我方普攻阶段 ---", null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, "我方普攻阶段开始", null, this.currentTurn);
            this.executePlayerAttackPhase(teamMembers, monster, battleStats);
            if (this.isBattleOver(teamMembers, monster)) break;

            // --- 敌方行动阶段 ---
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, "--- 敌方行动阶段 ---", null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, "敌方行动阶段开始", null, this.currentTurn);
            this.executeEnemyPhase(monster, teamMembers, battleStats);
            if (this.isBattleOver(teamMembers, monster)) break;

            // --- 回合结束处理 ---
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, "--- 回合结束处理 ---", null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, "回合结束处理开始", null, this.currentTurn);
            this.updateBuffDurations(teamMembers, monster); // 更新Buff持续时间

            // 处理所有实体的回合结束效果
            for (const entity of [...teamMembers, monster]) {
                if (entity.currentStats.hp > 0) {
                    this.processEndOfTurnEffect(entity, null, teamMembers, monster); // 调整调用方式
                }
            }
            
            const monsterHpPercent = monster.currentStats.maxHp > 0 ? Math.floor((monster.currentStats.hp / monster.currentStats.maxHp) * 100) : 0;
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, `${monster.name} HP: ${Math.floor(monster.currentStats.hp)}/${monster.currentStats.maxHp} (${monsterHpPercent}%)`, null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${monster.name} HP: ${Math.floor(monster.currentStats.hp)}/${monster.currentStats.maxHp} (${monsterHpPercent}%)`, { summary: `${monster.name} HP`}, this.currentTurn);
            teamMembers.forEach(member => {
                if (member.currentStats.hp > 0) {
                    const memberHpPercent = member.currentStats.maxHp > 0 ? Math.floor((member.currentStats.hp / member.currentStats.maxHp) * 100) : 0;
                    BattleLogger.log(BattleLogger.levels.BATTLE_LOG, `${member.name} HP: ${Math.floor(member.currentStats.hp)}/${member.currentStats.maxHp} (${memberHpPercent}%)`, null, this.currentTurn);
                    BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${member.name} HP: ${Math.floor(member.currentStats.hp)}/${member.currentStats.maxHp} (${memberHpPercent}%)`, { summary: `${member.name} HP`}, this.currentTurn);
                } else {
                    BattleLogger.log(BattleLogger.levels.BATTLE_LOG, `${member.name} 已阵亡`, null, this.currentTurn);
                    BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${member.name} 已阵亡`, null, this.currentTurn);
                }
            });


            if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
                Events.emit('battle:turn-end');
            }
            if (this.currentTurn === 1) this.isFirstTurn = false;
        }

        const teamAlive = teamMembers.some(member => member.currentStats.hp > 0);
        const monsterAlive = monster.currentStats.hp > 0;
        let gold = 0;
        let exp = 0;

        if (teamAlive && !monsterAlive) {
            this.logBattle(`===== 战斗胜利！回合数: ${this.currentTurn} =====`);
            if (monster.xpReward) exp = monster.xpReward;
            // 地下城中不清除BUFF
            if (!(typeof Dungeon !== 'undefined' && Dungeon.currentRun)) {
                teamMembers.forEach(member => BuffSystem.clearAllBuffs(member));
            }
            return { victory: true, gold, exp, battleStats, turns: this.currentTurn, battleLog: this.battleLog };
        } else {
            this.logBattle(`===== 战斗失败！回合数: ${this.currentTurn} =====`);
            if (!(typeof Dungeon !== 'undefined' && Dungeon.currentRun)) {
                teamMembers.forEach(member => BuffSystem.clearAllBuffs(member));
            } else {
                if (typeof DungeonRunner !== 'undefined' && typeof DungeonRunner.exitDungeon === 'function') {
                    DungeonRunner.exitDungeon();
                }
            }
            teamMembers.forEach(member => {
                if (!member.stats) member.stats = { totalDamage: 0, totalHealing: 0, daCount: 0, taCount: 0, critCount: 0 };
                if (battleStats.characterStats && !battleStats.characterStats[member.id]) {
                    battleStats.characterStats[member.id] = { ...member.stats };
                }
            });
            return { victory: false, battleStats, turns: this.currentTurn, battleLog: this.battleLog };
        }
    },

    /**
     * 执行玩家技能阶段
     */
    executePlayerSkillPhase(teamMembers, monster, battleStats) {
        for (const character of teamMembers) {
            if (this.isBattleOver(teamMembers, monster)) break;
            if (character.currentStats.hp <= 0 || this.isStunned(character)) continue;
            
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, `-- ${character.name} 的技能行动 --`, null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${character.name} 的技能行动开始`, null, this.currentTurn);
            this.processCharacterSkills(character, monster, battleStats, teamMembers);
        }
    },

    /**
     * 执行玩家普攻阶段
     */
    executePlayerAttackPhase(teamMembers, monster, battleStats) {
        for (const character of teamMembers) {
            if (this.isBattleOver(teamMembers, monster)) break;
            if (character.currentStats.hp <= 0 || this.isStunned(character)) continue;

            // 检查角色是否在本回合已经通过技能执行了“主要攻击动作”
            // 这个逻辑可能需要根据游戏设计细化，例如，某些技能可能取代普攻
            // 简单起见，如果角色在本回合未使用任何“攻击性”技能，则允许普攻
            // 或者，如果架构师方案中没有明确此规则，则默认所有角色都可以普攻（如果技能阶段没普攻）
            // 当前简化：如果角色在技能阶段没有标记自己已行动（例如通过一个内部状态），则普攻
            // 另一个简化：总是允许普攻，除非角色有特殊状态阻止（如某些技能的后摇）
            // 采纳：如果角色未被眩晕且存活，就尝试普攻。具体是否攻击由 processCharacterNormalAttack 内部逻辑决定。
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, `-- ${character.name} 的普攻行动 --`, null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${character.name} 的普攻行动开始`, null, this.currentTurn);
            this.processCharacterNormalAttack(character, monster, battleStats, teamMembers);
        }
    },

    /**
     * 执行敌方行动阶段
     */
    executeEnemyPhase(monster, teamMembers, battleStats) {
        if (this.isBattleOver(teamMembers, monster)) return;
        if (monster.currentStats.hp <= 0 || this.isStunned(monster)) return;

        BattleLogger.log(BattleLogger.levels.BATTLE_LOG, `-- ${monster.name} 的行动 --`, null, this.currentTurn);
        BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${monster.name} 的行动开始`, null, this.currentTurn);
        this.processMonsterAction(monster, teamMembers, battleStats);
    },
    
    /**
     * 处理角色技能（新辅助函数）
     */
    processCharacterSkills(character, monster, battleStats, teamMembers) {
        // 移植原 processCharacterAction 中的技能使用逻辑
        let usedAnySkillThisTurn = false;
        const availableSkills = this.getAvailableSkills(character);

        if (availableSkills && availableSkills.length > 0) {
            for (const skillToUseId of availableSkills) {
                if (this.isBattleOver(teamMembers, monster) || character.currentStats.hp <= 0 || monster.currentStats.hp <= 0) break;

                const skillData = SkillLoader.getSkillInfo(skillToUseId);
                if (skillData && this.canUseSkill(character, skillToUseId, skillData)) {
                    if (typeof JobSkills !== 'undefined' && typeof JobSkills.useSkill === 'function') {
                        try {
                            if (typeof Character !== 'undefined' && !Character.characters[character.id]) Character.characters[character.id] = character;
                            if (typeof JobSkillsTemplate !== 'undefined' && !JobSkillsTemplate.templates[skillToUseId]) JobSkillsTemplate.templates[skillToUseId] = skillData;
                            
                            const targets = this.getEffectTargets(skillData.targetType, character, teamMembers, monster);
                            const result = JobSkills.useSkill(character.id, skillToUseId, targets, monster); // 假设 useSkill 的最后一个参数是主要目标

                            if (result.success) {
                                usedAnySkillThisTurn = true;
                                const skillUsedMessage = result.message || `${character.name} 使用了技能 ${skillData.name}。`;
                                BattleLogger.log(BattleLogger.levels.BATTLE_LOG, skillUsedMessage, null, this.currentTurn);
                                BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, skillUsedMessage, { caster: character.name, skill: skillData.name, target: targets.map(t => t.name) }, this.currentTurn);
                                this.setSkillCooldown(character, skillToUseId, skillData);
                                this.recordSkillUsage(character, skillToUseId);
                                this.handleProcTrigger(character, 'onSkillUse', { skillId: skillToUseId, skillData, targets, battleStats });
                                // 根据架构，这里不再判断攻击性技能来打断，而是允许使用所有可用技能
                            } else {
                                const skillFailedMessage = `${character.name} 尝试使用技能 ${skillData.name || skillToUseId} 失败。${result.message ? '原因: ' + result.message : ''}`;
                                BattleLogger.log(BattleLogger.levels.BATTLE_LOG, skillFailedMessage, null, this.currentTurn);
                                BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, skillFailedMessage, { caster: character.name, skill: skillData.name }, this.currentTurn);
                            }
                        } catch (error) {
                            console.error(`技能 ${skillToUseId} 使用错误:`, error);
                            const skillErrorMessage = `${character.name} 尝试使用技能 ${skillData.name || skillToUseId} 时发生错误。`;
                            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, skillErrorMessage, null, this.currentTurn);
                            BattleLogger.log(BattleLogger.levels.CONSOLE_ERROR, skillErrorMessage, { error: error.toString() }, this.currentTurn); // Assuming CONSOLE_ERROR level or similar
                        }
                    }
                }
            }
        } else {
            const noSkillMessage = `${character.name} 没有可用的技能。`;
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, noSkillMessage, null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, noSkillMessage, null, this.currentTurn);
        }
        // 返回是否使用了技能，可能用于 processCharacterNormalAttack 的判断
        return usedAnySkillThisTurn;
    },

    /**
     * 处理角色普通攻击（新辅助函数）
     */
    processCharacterNormalAttack(character, monster, battleStats, teamMembers) {
        // 移植原 processCharacterAction 中的普攻决策逻辑
        // 架构方案中提到普攻阶段，意味着角色通常会进行普攻，除非有特殊情况
        // 简化：如果角色存活且敌人存活，就执行普攻
        // 之前的逻辑是：如果没有使用“攻击性”技能，则普攻。
        // 新逻辑：在专门的普攻阶段，角色执行普攻。
        // 进一步思考：如果一个角色在技能阶段使用了某种“替代普攻”的技能，是否还应普攻？
        // 暂时假设：普攻阶段就是普攻，除非角色有特殊状态（如无法攻击）。
        // 之前的 `performedNormalAttack` 标记在 `processCharacterAction` 中，现在需要一种新的方式来避免重复普攻（如果适用）。
        // 但由于这是独立的普攻阶段，每个角色应该都有机会普攻一次。

        if (character.currentStats.hp > 0 && monster.currentStats.hp > 0) {
            if (!this.isBattleOver(teamMembers, monster)) {
                // BattleLogger.log in executeNormalAttack will handle this
                this.executeNormalAttack(character, monster, battleStats, teamMembers);
            } else {
                 BattleLogger.log(BattleLogger.levels.BATTLE_LOG, `${character.name} 或 ${monster.name} 已被击败，无法执行普通攻击。`, null, this.currentTurn);
                 BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${character.name} 或 ${monster.name} 已被击败，无法执行普通攻击。`, null, this.currentTurn);
            }
        } else if (character.currentStats.hp <= 0) {
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, `${character.name} 已被击败，无法执行普通攻击。`, null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${character.name} 已被击败，无法执行普通攻击。`, null, this.currentTurn);
        } else if (monster.currentStats.hp <= 0) {
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, `${monster.name} 已被击败，${character.name} 无需执行普通攻击。`, null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${monster.name} 已被击败，${character.name} 无需执行普通攻击。`, null, this.currentTurn);
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
                //BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${character.name} 的被动技能提升了 ${effect.value * 100}% 的连击概率！`, null, this.currentTurn);
                break;
            case 'taBoost':
                // 提升TA（三连击）概率
                character.currentStats.taRate = (character.currentStats.taRate || 0) + effect.value;
                //BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${character.name} 的被动技能提升了 ${effect.value * 100}% 的三连击概率！`, null, this.currentTurn);
                break;
            case 'attackUp':
                // 提升攻击力
                character.currentStats.attack = Math.floor(character.currentStats.attack * (1 + effect.value));
                //BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${character.name} 的被动技能提升了 ${effect.value * 100}% 的攻击力！`, null, this.currentTurn);
                break;
            case 'defenseUp':
                // 提升防御力
                character.currentStats.defense = Math.floor(character.currentStats.defense * (1 + effect.value));
                //BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${character.name} 的被动技能提升了 ${effect.value * 100}% 的防御力！`, null, this.currentTurn);
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
                    const damageResult = this.applyDamageToTarget(null, entity, result.damage, { isDot: true, buffName: result.sourceBuffName || '持续伤害' });
                    // applyDamageToTarget 内部会记录日志
                }
                if (result.healing > 0) {
                    // 应用持续治疗
                    const actualHeal = Math.min(result.healing, entity.currentStats.maxHp - entity.currentStats.hp);
                    entity.currentStats.hp += actualHeal;
                    BattleLogger.log(BattleLogger.levels.BATTLE_LOG, `${entity.name} 恢复了 ${actualHeal} 点生命值！ (来自${result.sourceBuffName || '持续恢复'})`, null, this.currentTurn);
                    BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${entity.name} 恢复了 ${actualHeal} 点生命值！ (来自${result.sourceBuffName || '持续恢复'})`, { healAmount: actualHeal, currentHp: entity.currentStats.hp }, this.currentTurn);
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
                    const expiredMsg = `${member.name} 的 ${buffNames} 效果已结束！`;
                    BattleLogger.log(BattleLogger.levels.BATTLE_LOG, expiredMsg, null, this.currentTurn);
                    BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, expiredMsg, { buffs: actualExpiredBuffs.map(b => b.name) }, this.currentTurn);
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
                            //     BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${member.name} 的技能 ${skill.name} 冷却结束，可以再次使用！`, null, this.currentTurn);
                            // } else {
                            //     BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${member.name} 的技能 ${skillId} 冷却结束，可以再次使用！`, null, this.currentTurn);
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
                const monsterExpiredMsg = `${monster.name} 的 ${buffNames} 效果已结束！`;
                BattleLogger.log(BattleLogger.levels.BATTLE_LOG, monsterExpiredMsg, null, this.currentTurn);
                BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, monsterExpiredMsg, { buffs: expiredBuffs.map(b => b.name) }, this.currentTurn);
            };
        }

        // 更新怪物技能冷却 (常规技能)
        if (monster.skillCooldowns) {
            for (const skillId in monster.skillCooldowns) {
                if (monster.skillCooldowns[skillId] > 0) {
                    monster.skillCooldowns[skillId]--;
                    if (monster.skillCooldowns[skillId] === 0) {
                        const skillData = SkillLoader.getSkillInfo(skillId) || (window.bossSkills && window.bossSkills[skillId]);
                        // if (skillData) {
                        //     BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${monster.name} 的技能 ${skillData.name} 冷却结束，可以再次使用！`, null, this.currentTurn);
                        // } else {
                        //     BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${monster.name} 的技能 ${skillId} 冷却结束，可以再次使用！`, null, this.currentTurn);
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

    // processCharacterAction 函数将被移除或大幅修改，其核心逻辑已移至
    // processCharacterSkills 和 processCharacterNormalAttack，并通过新的三阶段流程调用。
    // 为保持 executeNormalAttack 的独立性，暂时保留 processCharacterAction 的空壳或注释掉。
    // 后续可以完全移除 processCharacterAction。
    /*
    processCharacterAction(character, monster, battleStats, currentTeamMembers) {
        // 此函数的功能已被新的三阶段战斗流程取代
        // 技能处理在 executePlayerSkillPhase -> processCharacterSkills
        // 普攻处理在 executePlayerAttackPhase -> processCharacterNormalAttack
        console.warn("旧的 processCharacterAction 被调用，这可能不符合新的战斗流程。");
    },
    */
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
            // 单次攻击的详细日志由 applyDamageToTarget 内部处理
        }

        // 记录总伤害日志
        if (totalHits > 0) {
             let summaryMessage = `${character.name} ${attackType} (${totalHits}次攻击)`;
             if (criticalHits > 0) summaryMessage += ` (${criticalHits}次暴击)`;
             summaryMessage += `，总共对 ${monster.name} 造成 ${totalDamageDealt} 点伤害！`;
             BattleLogger.log(BattleLogger.levels.BATTLE_LOG, summaryMessage, null, this.currentTurn);
             BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, summaryMessage, {
                attacker: character.name,
                target: monster.name,
                attackType: attackType,
                hits: totalHits,
                criticalHits: criticalHits,
                totalDamage: totalDamageDealt
             }, this.currentTurn);
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
            const hpTriggerMsg = `${monster.name} 血量 (${(hpPercent * 100).toFixed(1)}%) 触发技能 ${skillData.name}!`;
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, hpTriggerMsg, null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, hpTriggerMsg, { skill: skillData.name, hpPercent: hpPercent }, this.currentTurn);

            if (typeof JobSkills !== 'undefined' && typeof JobSkills.useSkill === 'function') {
                try {
                    if (typeof Character !== 'undefined') { Character.characters = Character.characters || {}; Character.characters[monster.id] = monster; }
                    if (typeof JobSkillsTemplate !== 'undefined' && !JobSkillsTemplate.templates[skillData.id]) { JobSkillsTemplate.templates[skillData.id] = skillData; }

                    const targets = this.getEffectTargets(skillData.targetType, monster, teamMembers, monster);
                    const targetForSkill = this.selectMonsterTarget(monster, teamMembers); // HP触发技能也需要目标
                    const result = JobSkills.useSkill(monster.id, skillData.id, targets, targetForSkill);

                    if (result.success) {
                        const skillSuccessMsg = result.message || `${monster.name} 使用了血量触发技能 ${skillData.name}。`;
                        BattleLogger.log(BattleLogger.levels.BATTLE_LOG, skillSuccessMsg, null, this.currentTurn);
                        BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, skillSuccessMsg, { caster: monster.name, skill: skillData.name, target: targets.map(t=>t.name) }, this.currentTurn);
                        this.handleProcTrigger(monster, 'onSkillUse', { skillId: skillData.id, skillData, targets, battleStats });
                        usedActionThisTurn = true;
                    } else {
                        const skillFailMsg = `${monster.name} 尝试使用血量触发技能 ${skillData.name} 失败。${result.message ? '原因: ' + result.message : ''}`;
                        BattleLogger.log(BattleLogger.levels.BATTLE_LOG, skillFailMsg, null, this.currentTurn);
                        BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, skillFailMsg, { caster: monster.name, skill: skillData.name }, this.currentTurn);
                    }
                } catch (error) {
                    console.error(`怪物血量触发技能 ${skillData.id} 使用错误:`, error);
                    const skillErrorMsg = `${monster.name} 尝试使用血量触发技能 ${skillData.name} 时发生错误。`;
                    BattleLogger.log(BattleLogger.levels.BATTLE_LOG, skillErrorMsg, null, this.currentTurn);
                    BattleLogger.log(BattleLogger.levels.CONSOLE_ERROR, skillErrorMsg, { error: error.toString() }, this.currentTurn);
                }
            }
        }

        // --- 阶段二：常规技能 ---
        if (!usedActionThisTurn) {
            const availableSkills = this.getAvailableSkills(monster); // getAvailableSkills 内部会检查CD

            if (availableSkills.length > 0) {
                let skillToUseId = null;
                let skillDataToUse = null;

                for (const id of monster.skills) {
                    if (availableSkills.includes(id)) {
                         skillToUseId = id;
                         skillDataToUse = SkillLoader.getSkillInfo(skillToUseId) || (window.bossSkills && window.bossSkills[skillToUseId]);
                         if (skillDataToUse) break;
                    }
                }

                if (skillToUseId && skillDataToUse) {
                    const prepSkillMsg = `${monster.name} 准备使用常规技能 ${skillDataToUse.name}。`;
                    BattleLogger.log(BattleLogger.levels.BATTLE_LOG, prepSkillMsg, null, this.currentTurn);
                    BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, prepSkillMsg, { skill: skillDataToUse.name }, this.currentTurn);
                    if (typeof JobSkills !== 'undefined' && typeof JobSkills.useSkill === 'function') {
                        try {
                            if (typeof Character !== 'undefined') { Character.characters = Character.characters || {}; Character.characters[monster.id] = monster; }
                            if (typeof JobSkillsTemplate !== 'undefined' && !JobSkillsTemplate.templates[skillToUseId]) { JobSkillsTemplate.templates[skillToUseId] = skillDataToUse; }

                            const targets = this.getEffectTargets(skillDataToUse.targetType, monster, teamMembers, monster);
                            const targetForSkill = this.selectMonsterTarget(monster, teamMembers);
                            const result = JobSkills.useSkill(monster.id, skillToUseId, targets, targetForSkill);

                            if (result.success) {
                                const skillSuccessMsg = result.message || `${monster.name} 使用了技能 ${skillDataToUse.name}。`;
                                BattleLogger.log(BattleLogger.levels.BATTLE_LOG, skillSuccessMsg, null, this.currentTurn);
                                BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, skillSuccessMsg, { caster: monster.name, skill: skillDataToUse.name, target: targets.map(t=>t.name) }, this.currentTurn);
                                this.setSkillCooldown(monster, skillToUseId, skillDataToUse);
                                this.recordSkillUsage(monster, skillToUseId);
                                this.handleProcTrigger(monster, 'onSkillUse', { skillId: skillToUseId, skillData: skillDataToUse, targets, battleStats });
                                usedActionThisTurn = true;
                            } else {
                                 const skillFailMsg = `${monster.name} 尝试使用技能 ${skillDataToUse.name} 失败。${result.message ? '原因: ' + result.message : ''}`;
                                 BattleLogger.log(BattleLogger.levels.BATTLE_LOG, skillFailMsg, null, this.currentTurn);
                                 BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, skillFailMsg, { caster: monster.name, skill: skillDataToUse.name }, this.currentTurn);
                            }
                        } catch (error) {
                            console.error(`怪物常规技能 ${skillToUseId} 使用错误:`, error);
                            const skillErrorMsg = `${monster.name} 尝试使用技能 ${skillDataToUse.name} 时发生错误。`;
                            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, skillErrorMsg, null, this.currentTurn);
                            BattleLogger.log(BattleLogger.levels.CONSOLE_ERROR, skillErrorMsg, { error: error.toString() }, this.currentTurn);
                        }
                    }
                }
            }
        }

        // --- 阶段三：无技能可用 (普通攻击) ---
        if (!usedActionThisTurn) {
            const target = this.selectMonsterTarget(monster, teamMembers);
            if (!target) return;

            const monsterAttackMsg = `${monster.name} 没有可用技能，进行普通攻击。`;
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, monsterAttackMsg, null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, monsterAttackMsg, null, this.currentTurn);
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
                    isNormalAttack: true,
                    isSkillDamage: false
                });

                totalDamageDealt += damageResult.damage;
                totalHits++;
                if (damageResult.isCritical) criticalHits++;
                this.handleProcTrigger(monster, 'onAttackHit', { target, damageDealt: damageResult.damage, isCritical: damageResult.isCritical, attackIndex: i, battleStats });

                if (target.currentStats.hp <= 0) {
                    BattleLogger.log(BattleLogger.levels.BATTLE_LOG, `${target.name} 被击败了！`, null, this.currentTurn);
                    BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${target.name} 被击败了！`, null, this.currentTurn);
                    this.handleCharacterDefeat(target, teamMembers);
                    break;
                }
            }

            if (totalHits > 0) {
                let summaryMessage = `${monster.name} ${attackType} (${totalHits}次攻击)`;
                if (criticalHits > 0) summaryMessage += ` (${criticalHits}次暴击)`;
                summaryMessage += `，总共对 ${target.name} 造成 ${totalDamageDealt} 点伤害！`;
                BattleLogger.log(BattleLogger.levels.BATTLE_LOG, summaryMessage, null, this.currentTurn);
                BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, summaryMessage, {
                    attacker: monster.name,
                    target: target.name,
                    attackType: attackType,
                    hits: totalHits,
                    criticalHits: criticalHits,
                    totalDamage: totalDamageDealt
                }, this.currentTurn);
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
                    const procActivationMsg = `Proc [${procDef.name || triggerType}] 触发 (${activationCount + 1}/${procDef.maxActivations})`;
                    BattleLogger.log(BattleLogger.levels.BATTLE_LOG, procActivationMsg, null, this.currentTurn);
                    BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, procActivationMsg, { entity: entity.name, proc: procDef.name || triggerType }, this.currentTurn);
                } else {
                     const procTriggerMsg = `Proc [${procDef.name || triggerType}] 触发!`;
                     BattleLogger.log(BattleLogger.levels.BATTLE_LOG, procTriggerMsg, null, this.currentTurn);
                     BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, procTriggerMsg, { entity: entity.name, proc: procDef.name || triggerType }, this.currentTurn);
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
            if (!currentTarget || currentTarget.currentStats.hp <= 0) continue;

            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `  执行效果: ${effectDef.type} on ${currentTarget.name}`, { effectDetails: effectDef }, this.currentTurn);

            switch (effectDef.type) {
                case 'damage':
                    let rawDamage = 0;
                    const multiplier = effectDef.multiplier || effectDef.minMultiplier || 0;
                    if (multiplier > 0) {
                         rawDamage = Character.calculateAttackPower(source) * multiplier;
                    } else if (effectDef.value) {
                         rawDamage = effectDef.value;
                    }
                    if (rawDamage > 0) {
                        const damageResult = this.applyDamageToTarget(source, currentTarget, rawDamage, {
                            isProc: true,
                            damageType: effectDef.damageType,
                            elementType: effectDef.elementType,
                            skillName: procDefinition ? (procDefinition.name || procDefinition.triggerCondition) : '触发效果'
                        });
                        // applyDamageToTarget will log BATTLE_LOG and CONSOLE_DETAIL
                        if (currentTarget.currentStats.hp <= 0) {
                             const defeatedMsg = `    ${currentTarget.name} 被击败!`;
                             BattleLogger.log(BattleLogger.levels.BATTLE_LOG, defeatedMsg, null, this.currentTurn);
                             BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, defeatedMsg, null, this.currentTurn);
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
                                 damageType: effectDef.damageType, elementType: effectDef.elementType,
                                 skillName: procDefinition ? (procDefinition.name || procDefinition.triggerCondition) : '触发多段效果'
                             });
                             totalMultiHitDamage += hitDamageResult.damage;
                             if (currentTarget.currentStats.hp <= 0) {
                                 const defeatedMultiHitMsg = `    ${currentTarget.name} 在第 ${i+1} 次攻击后被击败!`;
                                 BattleLogger.log(BattleLogger.levels.BATTLE_LOG, defeatedMultiHitMsg, null, this.currentTurn);
                                 BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, defeatedMultiHitMsg, null, this.currentTurn);
                                 this.handleCharacterDefeat(currentTarget, teamMembers);
                                 break;
                             }
                         }
                     }
                     const multiHitSummary = `    对 ${currentTarget.name} 进行 ${hitCount} 次攻击，共造成 ${totalMultiHitDamage} 点伤害.`;
                     BattleLogger.log(BattleLogger.levels.BATTLE_LOG, multiHitSummary, null, this.currentTurn);
                     BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, multiHitSummary, { totalDamage: totalMultiHitDamage, hits: hitCount }, this.currentTurn);
                    break;
                case 'heal':
                    let healAmount = 0;
                    const hpBeforeHeal = currentTarget.currentStats.hp;
                    if (effectDef.healType === 'percentageMaxHp') {
                        healAmount = Math.floor(currentTarget.currentStats.maxHp * effectDef.value);
                    } else {
                        healAmount = effectDef.value || 0;
                    }
                    if (healAmount > 0) {
                        const actualHeal = Math.min(healAmount, currentTarget.currentStats.maxHp - currentTarget.currentStats.hp);
                        currentTarget.currentStats.hp += actualHeal;
                        const healMsg = `    为 ${currentTarget.name} 恢复了 ${actualHeal} 点HP.`;
                        BattleLogger.log(BattleLogger.levels.BATTLE_LOG, healMsg, null, this.currentTurn);
                        BattleLogger.log(BattleLogger.levels.CONSOLE_DETAIL, healMsg, {
                            calculation: "治疗量",
                            steps: [`治疗前HP: ${hpBeforeHeal}`, `计划治疗: ${healAmount}`, `实际治疗: ${actualHeal}`],
                            finalHp: currentTarget.currentStats.hp
                        }, this.currentTurn);
                    }
                    break;
                case 'applyBuff':
                case 'applyDebuff':
                    const buffOptions = {
                        canDispel: effectDef.dispellable,
                        stackable: effectDef.stackable,
                        maxStacks: effectDef.maxStacks,
                        elementType: effectDef.elementType,
                        statusToImmune: effectDef.status,
                        convertToElementType: effectDef.convertToElementType
                    };
                    const buffObject = BuffSystem.createBuff(effectDef.buffType, effectDef.value, effectDef.duration, source, buffOptions);
                    if (buffObject) {
                        BuffSystem.applyBuff(currentTarget, buffObject);
                        const buffAppliedMsg = `    为 ${currentTarget.name} 施加了 ${buffObject.name}.`;
                        BattleLogger.log(BattleLogger.levels.BATTLE_LOG, buffAppliedMsg, null, this.currentTurn);
                        BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, buffAppliedMsg, { buff: buffObject }, this.currentTurn);
                    }
                    break;
                 case 'applyBuffPackage':
                     BuffSystem.applyBuffPackage(currentTarget, effectDef, source);
                     const buffPkgMsg = `    为 ${currentTarget.name} 施加了效果包 [${effectDef.buffName}].`;
                     BattleLogger.log(BattleLogger.levels.BATTLE_LOG, buffPkgMsg, null, this.currentTurn);
                     BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, buffPkgMsg, { buffPackage: effectDef.buffName }, this.currentTurn);
                     break;
                case 'dispel':
                    const dispelPositive = effectDef.dispelPositive || false;
                    const dispelCount = effectDef.count || 1;
                    const dispelled = BuffSystem.dispelBuffs(currentTarget, dispelPositive, dispelCount);
                    if (dispelled.length > 0) {
                        const dispelMsg = `    驱散了 ${currentTarget.name} 的 ${dispelled.map(b => b.name).join(', ')}.`;
                        BattleLogger.log(BattleLogger.levels.BATTLE_LOG, dispelMsg, null, this.currentTurn);
                        BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, dispelMsg, { dispelledBuffs: dispelled.map(b => b.name) }, this.currentTurn);
                    } else {
                        const noDispelMsg = `    尝试驱散 ${currentTarget.name}，但没有可驱散的BUFF.`;
                        BattleLogger.log(BattleLogger.levels.BATTLE_LOG, noDispelMsg, null, this.currentTurn);
                        BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, noDispelMsg, null, this.currentTurn);
                    }
                    break;
                 case 'dispelAll':
                     const dispelAllPositive = effectDef.dispelPositive || false;
                     const allBuffs = [...currentTarget.buffs];
                     let dispelledAllCount = 0;
                     for(const buff of allBuffs) {
                         if (buff.canDispel && buff.isPositive === dispelAllPositive) {
                             if (BuffSystem.removeBuff(currentTarget, buff.id)) {
                                 dispelledAllCount++;
                             }
                         }
                     }
                     const dispelAllMsg = `    驱散了 ${currentTarget.name} 的 ${dispelledAllCount} 个所有${dispelAllPositive ? '增益' : '减益'}状态.`;
                     BattleLogger.log(BattleLogger.levels.BATTLE_LOG, dispelAllMsg, null, this.currentTurn);
                     BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, dispelAllMsg, { count: dispelledAllCount }, this.currentTurn);
                     break;
                case 'castSkill':
                    if (effectDef.skillId) {
                        const castSkillMsg = `    触发释放技能: ${effectDef.skillId}`;
                        BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, castSkillMsg, { skillId: effectDef.skillId }, this.currentTurn);
                        const skillData = SkillLoader.getSkillInfo(effectDef.skillId);
                        if (skillData && typeof JobSkills !== 'undefined' && typeof JobSkills.useSkill === 'function') {
                             const castTargets = this.getEffectTargets(skillData.targetType, source, teamMembers, monster, triggerContext);
                             try {
                                 if (typeof Character !== 'undefined') { Character.characters = Character.characters || {}; Character.characters[source.id] = source; }
                                 if (typeof JobSkillsTemplate !== 'undefined' && !JobSkillsTemplate.templates[effectDef.skillId]) { JobSkillsTemplate.templates[effectDef.skillId] = skillData; }
                                 const castResult = JobSkills.useSkill(source.id, effectDef.skillId, castTargets, monster);
                                 if (castResult.success) {
                                     const castSuccessMsg = `    由Proc触发的技能 ${skillData.name} 成功释放: ${castResult.message}`;
                                     BattleLogger.log(BattleLogger.levels.BATTLE_LOG, castSuccessMsg, null, this.currentTurn);
                                     BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, castSuccessMsg, { skill: skillData.name }, this.currentTurn);
                                 }
                             } catch (error) {
                                 console.error(`Proc触发的技能 ${effectDef.skillId} 使用错误:`, error);
                             }
                        } else {
                             console.warn(`Proc尝试触发未知技能: ${effectDef.skillId}`);
                        }
                    }
                    break;
                default:
                    BattleLogger.log(BattleLogger.levels.CONSOLE_WARN, `    未知的触发效果类型: ${effectDef.type}`, { effectDef: effectDef }, this.currentTurn);
            }
        }
    },

    // Battle.logBattle 方法已被 BattleLogger.log 取代

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
                 const silenceMsg = `${entity.name} 处于沉默状态，无法使用技能 ${skillData.name}!`;
                 BattleLogger.log(BattleLogger.levels.BATTLE_LOG, silenceMsg, null, this.currentTurn);
                 BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, silenceMsg, null, this.currentTurn);
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
            BattleLogger.log(BattleLogger.levels.CONSOLE_ERROR, `对 ${character ? character.name : '未知角色'} 的复活操作失败: 缺少参数。`, {character, teamData}, this.currentTurn);
            return false;
        }

        if (character.currentStats.hp > 0) {
            const aliveMsg = `${character.name} 还活着，不需要复活。`;
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, aliveMsg, null, this.currentTurn);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, aliveMsg, null, this.currentTurn);
            return false; // Already alive
        }

        // 1. Restore HP
        const hpBeforeRevive = character.currentStats.hp;
        const hpRestored = Math.floor(character.currentStats.maxHp * hpPercentToRestore);
        character.currentStats.hp = Math.max(1, hpRestored); // Ensure at least 1 HP
        
        const reviveMsg = `${character.name} 被复活了，恢复了 ${character.currentStats.hp}点HP!`;
        BattleLogger.log(BattleLogger.levels.BATTLE_LOG, reviveMsg, null, this.currentTurn);
        BattleLogger.log(BattleLogger.levels.CONSOLE_DETAIL, reviveMsg, {
            calculation: "复活HP恢复",
            steps: [`最大HP: ${character.currentStats.maxHp}`, `恢复百分比: ${hpPercentToRestore*100}%`, `计划恢复: ${hpRestored}`],
            hpBefore: hpBeforeRevive,
            hpAfter: character.currentStats.hp
        }, this.currentTurn);


        // 2. Clear any death-related statuses/buffs
        if (typeof BuffSystem !== 'undefined' && character.buffs) {
            const deathDebuff = character.buffs.find(b => b.type === 'deathStatus' || b.name === '死亡');
            if (deathDebuff) {
                BuffSystem.removeBuff(character, deathDebuff.id);
            }
        }

        // 3. Team Reordering
        const memberId = character.id;
        const currentIndex = teamData.members.indexOf(memberId);

        if (currentIndex > -1) {
            teamData.members.splice(currentIndex, 1);
            teamData.members.push(memberId);
            BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${character.name} 在队伍中的顺序已移至末尾。`, null, this.currentTurn);

            if (typeof Game !== 'undefined' && Game.playerTeam && Game.playerTeam.id === teamData.id) {
                 if (typeof Events !== 'undefined' && Events.emit) {
                    Events.emit('team:orderChanged', { teamId: teamData.id, newOrder: teamData.members });
                 }
            } else {
                console.warn("Team data provided for revive reorder might not be the main player team. UI update might be manual.");
            }
        } else {
            console.error(`Revived character ${memberId} not found in the provided teamData.members list for reordering.`);
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
                     const selectedCovererInfo = potentialCoverers[0];
                     actualTarget = selectedCovererInfo.coverer;
                     const coverMsg = `${actualTarget.name} 援护了 ${originalTarget.name}!`;
                     BattleLogger.log(BattleLogger.levels.BATTLE_LOG, coverMsg, null, this.currentTurn);
                     BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, coverMsg, { coverer: actualTarget.name, originalTarget: originalTarget.name }, this.currentTurn);
                 }
             }
         }
         
         let finalDamage = rawDamage;
         let isCritical = false;
         let missed = false;
         const calculationSteps = [];
         const attackerNameForLog = attacker ? attacker.name : '效果';
         calculationSteps.push(`初始伤害: ${rawDamage} (来自 ${attackerNameForLog}${options.skillName ? ` 的技能 [${options.skillName}]` : (options.isNormalAttack ? ' 的普通攻击' : (options.buffName ? ` 的BUFF [${options.buffName}]` : ''))})`);


         if (!missed) {
             // TODO: Implement Hit/Evasion check
             // calculationSteps.push(`命中检定: ...`);

             // TODO: Implement Critical Hit check & damage bonus
             // calculationSteps.push(`暴击检定: ...`);
             // if (isCritical) calculationSteps.push(`暴击伤害调整: ${finalDamage}`);
             
             const initialDamageBeforeDefense = finalDamage;
             
             const damageBeforeFluctuation = finalDamage;
             finalDamage = Math.floor(finalDamage * (0.95 + Math.random() * 0.1));
             calculationSteps.push(`伤害浮动 (0.95-1.05): ${damageBeforeFluctuation} -> ${finalDamage}`);

           // --- 属性克制计算 (光暗优先) ---
           if (attacker && attacker.attribute && actualTarget && actualTarget.attribute &&
               typeof Character !== 'undefined' && Character.attributes) { // 确保 options.playerTeam 存在
               
               const attackerElement = attacker.attribute;
               const targetElement = actualTarget.attribute;
               const attackerAttrDef = Character.attributes[attackerElement];
               
               let elementalMultiplier = 1.0;
               let elementalLog = "";
               let 光暗规则已应用 = false;

               const isAttackerEffectivelyBoss = !!attacker.isBoss;
               const attackerIsPlayer = !isAttackerEffectivelyBoss;
               const targetIsMonster = isAttackerEffectivelyBoss;

               // 1. 光暗克制规则 (玩家有利，优先)
               if (attackerIsPlayer && targetIsMonster) { // 玩家攻击怪物
                   if (attackerElement === 'light' && targetElement === 'dark') {
                       elementalMultiplier = 1.5;
                       elementalLog = `光克暗 (玩家有利)! 伤害 x${elementalMultiplier.toFixed(1)}`;
                       光暗规则已应用 = true;
                   } else if (attackerElement === 'dark' && targetElement === 'light') {
                       elementalMultiplier = 1.5;
                       elementalLog = `暗克光 (玩家有利)! 伤害 x${elementalMultiplier.toFixed(1)}`;
                       光暗规则已应用 = true;
                   }
               } else if (!attackerIsPlayer && targetIsMonster === false) { // 怪物攻击玩家 (targetIsMonster === false 表示目标是玩家)
                   if (attackerElement === 'light' && targetElement === 'dark') {
                       elementalMultiplier = 0.75;
                       elementalLog = `光对暗 (玩家有利)! ${attacker.name || '怪物'}伤害 x${elementalMultiplier.toFixed(2)}`;
                       光暗规则已应用 = true;
                   } else if (attackerElement === 'dark' && targetElement === 'light') {
                       elementalMultiplier = 0.75;
                       elementalLog = `暗对光 (玩家有利)! ${attacker.name || '怪物'}伤害 x${elementalMultiplier.toFixed(2)}`;
                       光暗规则已应用 = true;
                   }
               }

               // 2. 常规属性克制 (如果光暗规则未应用)
               if (!光暗规则已应用 && attackerAttrDef) {
                   if (attackerAttrDef.strengths && attackerAttrDef.strengths.includes(targetElement)) {
                       elementalMultiplier = 1.5;
                       elementalLog = `属性有利 (${attackerElement} 克 ${targetElement})! 伤害 x${elementalMultiplier.toFixed(1)}`;
                   }
                   else if (attackerAttrDef.weaknesses && attackerAttrDef.weaknesses.includes(targetElement)) {
                       elementalMultiplier = 0.75;
                       elementalLog = `属性不利 (${attackerElement} 被 ${targetElement} 克制)! 伤害 x${elementalMultiplier.toFixed(2)}`;
                   }
               }

               if (elementalMultiplier !== 1.0) {
                   const damageBeforeElemental = finalDamage;
                   finalDamage = Math.floor(finalDamage * elementalMultiplier);
                   calculationSteps.push(`${elementalLog}: ${damageBeforeElemental} -> ${finalDamage}`);
                   BattleLogger.log(BattleLogger.levels.CONSOLE_DETAIL,
                       `${attackerNameForLog} ${elementalLog}`,
                       { attacker: attackerNameForLog, target: actualTarget.name, multiplier: elementalMultiplier },
                       this.currentTurn
                   );
                   BattleLogger.log(BattleLogger.levels.BATTLE_LOG,
                       `${attackerNameForLog} ${elementalLog}`,
                       null,
                       this.currentTurn);
               }else{
                    calculationSteps.push(`属性无克制: 伤害不变`);
               }
           }
           // --- 属性克制计算结束 ---
             
           const damageBeforeTargetDefense = finalDamage;
             const targetEffectiveDefense = Math.max(0, (actualTarget.currentStats.defense || 0) - (attacker?.currentStats?.ignoreDefense || 0));
             finalDamage = Math.floor(finalDamage / (1 + targetEffectiveDefense / 100));
             calculationSteps.push(`目标防御减免 (防御: ${targetEffectiveDefense}): ${damageBeforeTargetDefense} -> ${finalDamage}`);
             
             finalDamage = Math.max(1, Math.floor(finalDamage));
             calculationSteps.push(`最小伤害保证: ${finalDamage}`);

             // --- Apply actualTarget's Defensive Measures ---
             if (actualTarget.buffs && actualTarget.buffs.some(b => b.type === 'invincible' && b.duration > 0)) {
                 const invincibleMsg = `${actualTarget.name} 无敌，免疫了伤害!`;
                 BattleLogger.log(BattleLogger.levels.BATTLE_LOG, invincibleMsg, null, this.currentTurn);
                 BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, invincibleMsg, null, this.currentTurn);
                 calculationSteps.push(`目标无敌: ${finalDamage} -> 0`);
                 finalDamage = 0;
             }

             if (finalDamage > 0 && actualTarget.buffs && actualTarget.buffs.some(b => b.type === 'evasionAll' && b.duration > 0)) {
                 const evasionMsg = `${actualTarget.name} 完全回避了伤害!`;
                 BattleLogger.log(BattleLogger.levels.BATTLE_LOG, evasionMsg, null, this.currentTurn);
                 BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, evasionMsg, null, this.currentTurn);
                 calculationSteps.push(`目标完全回避: ${finalDamage} -> 0`);
                 finalDamage = 0;
                 missed = true;
             }

             if (finalDamage > 0 && actualTarget.shield && actualTarget.shield > 0) {
                 const shieldDamage = Math.min(finalDamage, actualTarget.shield);
                 actualTarget.shield -= shieldDamage;
                 finalDamage -= shieldDamage;
                 const shieldMsg = `${actualTarget.name} 的护盾吸收了 ${shieldDamage} 点伤害 (剩余 ${actualTarget.shield})`;
                 BattleLogger.log(BattleLogger.levels.BATTLE_LOG, shieldMsg, null, this.currentTurn);
                 BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, shieldMsg, { absorbed: shieldDamage, shieldLeft: actualTarget.shield }, this.currentTurn);
                 calculationSteps.push(`目标护盾吸收: ${shieldDamage} (剩余护盾: ${actualTarget.shield}), 伤害变为: ${finalDamage}`);
             }

             if (actualTarget.buffs && options.damageElementType) {
                 actualTarget.buffs.forEach(buff => {
                     if (buff.type === 'elementalDamageCap' && buff.elementType === options.damageElementType && buff.duration > 0) {
                         if (finalDamage > buff.value) {
                             const elemCapMsg = `${actualTarget.name} 的${buff.elementType}属性伤害上限触发，伤害从 ${finalDamage} 降低到 ${buff.value}`;
                             BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, elemCapMsg, null, this.currentTurn);
                             calculationSteps.push(`目标元素伤害上限 (${buff.elementType}): ${finalDamage} -> ${buff.value}`);
                             finalDamage = buff.value;
                         }
                     }
                 });
             }
             finalDamage = Math.floor(finalDamage);

             let damageReduction = 0;
             if (actualTarget.buffs) {
                 actualTarget.buffs.forEach(buff => {
                     if (buff.type === 'allDamageTakenReduction' && buff.duration > 0) damageReduction += buff.value;
                     else if (buff.type === 'elementalResistance' && buff.elementType === options.damageElementType && buff.duration > 0) damageReduction += buff.value;
                 });
             }
             if (damageReduction > 0) {
                 const damageBeforeReduction = finalDamage;
                 finalDamage *= Math.max(0, 1 - damageReduction);
                 finalDamage = Math.floor(finalDamage);
                 calculationSteps.push(`目标伤害减免 (${(damageReduction * 100).toFixed(0)}%): ${damageBeforeReduction} -> ${finalDamage}`);
             }
         } else {
            calculationSteps.push(`攻击未命中!`);
         }

            // --- Apply Attacker's Damage Cap Up ---
             let currentDamageCap = options.isSkillDamage ? (Battle.BASE_SKILL_DAMAGE_CAP || 899999) : (Battle.BASE_DAMAGE_CAP || 199999);
             let capAppliedBy = options.isSkillDamage ? "技能基础上限" : "普攻基础上限";
             calculationSteps.push(`初始上限: ${currentDamageCap} (类型: ${capAppliedBy})`);

             if (attacker && attacker.buffs && typeof BuffSystem !== 'undefined') {
                 if (options.isSkillDamage) {
                     let totalSkillDamageCapUpBonus = 0;
                     const skillCapBuffs = BuffSystem.getBuffsByType(attacker, 'skillDamageCapUp');
                     if (skillCapBuffs) skillCapBuffs.forEach(b => { if (b.duration > 0 && b.value) totalSkillDamageCapUpBonus += b.value; });
                     if (totalSkillDamageCapUpBonus > 0) {
                         currentDamageCap = (Battle.BASE_SKILL_DAMAGE_CAP || 899999) * (1 + totalSkillDamageCapUpBonus);
                         capAppliedBy = `技能伤害上限提升 (${totalSkillDamageCapUpBonus*100}%)`;
                         calculationSteps.push(`攻击方技能上限提升后: ${currentDamageCap} (来自 ${capAppliedBy})`);
                     }
                 }
                 // General damageCapUp can also apply or take precedence if higher
                 let totalDamageCapUpBonus = 0;
                 const damageCapBuffs = BuffSystem.getBuffsByType(attacker, 'damageCapUp');
                 if (damageCapBuffs) damageCapBuffs.forEach(b => { if (b.duration > 0 && b.value) totalDamageCapUpBonus += b.value; });
                 if (totalDamageCapUpBonus > 0) {
                     const generalCalculatedCap = (options.isSkillDamage ? (Battle.BASE_SKILL_DAMAGE_CAP || 899999) : (Battle.BASE_DAMAGE_CAP || 199999)) * (1 + totalDamageCapUpBonus);
                     if (generalCalculatedCap > currentDamageCap) { // Only apply if general cap is higher or if it's the only cap
                        currentDamageCap = generalCalculatedCap;
                        capAppliedBy = `通用伤害上限提升 (${totalDamageCapUpBonus*100}%)`;
                        calculationSteps.push(`攻击方通用上限提升后: ${currentDamageCap} (来自 ${capAppliedBy})`);
                     }
                 }
             }         

        if (finalDamage > currentDamageCap) {
                 const capMsg = `${attackerNameForLog} 的 ${capAppliedBy} 触发，伤害从 ${Math.floor(finalDamage)} 限制到 ${Math.floor(currentDamageCap)}`;
                 BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, capMsg, null, this.currentTurn); // BATTLE_LOG might be too verbose for this
                 calculationSteps.push(`攻击方上限应用: ${finalDamage} -> ${Math.floor(currentDamageCap)} (原因: ${capAppliedBy})`);
                 finalDamage = Math.floor(currentDamageCap);
             }

         const previousHp = actualTarget.currentStats.hp;
         const actualDamageDealt = finalDamage;
         actualTarget.currentStats.hp = Math.max(0, previousHp - actualDamageDealt);
         calculationSteps.push(`HP变化: ${previousHp} - ${actualDamageDealt} = ${actualTarget.currentStats.hp}`);

         BattleLogger.log(BattleLogger.levels.CONSOLE_DETAIL, `${attackerNameForLog} 对 ${actualTarget.name} 的伤害计算`, {
            calculation: `伤害计算: ${attackerNameForLog} -> ${actualTarget.name}`,
            steps: calculationSteps,
            isCriticalHit: isCritical,
            wasMissed: missed
         }, this.currentTurn);
 
         let damageSourceInfo = "";
         if (options && options.skillName) damageSourceInfo = `通过 [${options.skillName}]`;
         else if (options && options.isNormalAttack) damageSourceInfo = `通过 普通攻击`;
         else if (options && options.buffName) damageSourceInfo = `通过 [${options.buffName}] 效果`;
         else if (options && options.isProc) damageSourceInfo = `通过 触发效果`;
         
         const attackerDisplayName = attacker ? attacker.name : '环境效果';
 
         if (actualDamageDealt > 0) {
             BattleLogger.log(BattleLogger.levels.BATTLE_LOG,
                 `${attackerDisplayName} ${damageSourceInfo} 对 ${actualTarget.name} 造成了 ${actualDamageDealt} 点伤害！` +
                 ` HP: ${previousHp} -> ${actualTarget.currentStats.hp}` +
                 `${isCritical ? ' (暴击!)' : ''}`, null, this.currentTurn
             );
         } else if (missed) {
             BattleLogger.log(BattleLogger.levels.BATTLE_LOG,
                 `${attackerDisplayName} ${damageSourceInfo} 对 ${actualTarget.name} 的攻击未命中！`, null, this.currentTurn
             );
         } else if (rawDamage > 0 && actualDamageDealt === 0) {
              BattleLogger.log(BattleLogger.levels.BATTLE_LOG,
                 `${attackerDisplayName} ${damageSourceInfo} 对 ${actualTarget.name} 的攻击被完全吸收/免疫。 HP: ${actualTarget.currentStats.hp}`, null, this.currentTurn
             );
         }
 
         if (attacker && attacker.stats && actualDamageDealt > 0) {
             attacker.stats.totalDamage = (attacker.stats.totalDamage || 0) + actualDamageDealt;
             if (battleStats.characterStats && battleStats.characterStats[attacker.id]) {
                 battleStats.characterStats[attacker.id].totalDamage += actualDamageDealt;
             } else if (battleStats.monsterStats && attacker.id === options.enemyTeam?.[0]?.id) {
                 battleStats.monsterStats.totalDamage += actualDamageDealt;
             }
         }
 
         if (actualDamageDealt > 0) {
             this.handleProcTrigger(actualTarget, 'onDamaged', { attacker, damageTaken: actualDamageDealt, isCritical, isProc: options.isProc, battleStats, originalTarget: originalTarget });
             if (attacker) {
                 this.handleProcTrigger(actualTarget, 'onDamagedByEnemy', { attacker, damageTaken: actualDamageDealt, isCritical, isProc: options.isProc, battleStats, originalTarget: originalTarget });
             }
         }
 
         return { damage: actualDamageDealt, isCritical, missed, isProc: options.isProc, actualTarget: actualTarget, originalTarget: originalTarget };
     },

     // --- Helper Method for Character Defeat ---
     handleCharacterDefeat(defeatedCharacter, teamMembers) {
         if (this.backLineMembers && this.backLineMembers.length > 0) {
             const backup = this.backLineMembers.shift();
             const targetIndex = teamMembers.findIndex(member => member.id === defeatedCharacter.id);
             if (targetIndex !== -1) {
                 teamMembers[targetIndex] = backup;
                 const backupMsg = `${backup.name} 从后排上场替换阵亡的 ${defeatedCharacter.name}！`;
                 BattleLogger.log(BattleLogger.levels.BATTLE_LOG, backupMsg, null, this.currentTurn);
                 BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, backupMsg, null, this.currentTurn);
                 this.processBattleStartTraits(backup, teamMembers);
             } else {
                  console.error(`无法在队伍中找到阵亡角色 ${defeatedCharacter.name} 的位置`);
                  this.backLineMembers.unshift(backup);
             }
         }
     },

     // --- Proc Activation Count Tracking ---
     procActivationCounts: {}, // Stores counts like { 'entityId_skillId_procName': count }
 
     // Reset proc counts at the start of each battle
     resetProcCounts() {
         this.procActivationCounts = {};
     },
 
     /**
      * 处理回合结束时的效果（通用）
      * @param {object} entity - 当前实体 (角色或怪物)
      * @param {object} specificEffect - （可选）来自技能或BUFF的特定回合结束效果定义
      * @param {array} teamMembers - 玩家队伍
      * @param {object} monster - 怪物对象
      * @param {string} sourceSkillId - （可选）触发此效果的技能ID
      */
     processEndOfTurnEffect(entity, specificEffect, teamMembers, monster, sourceSkillId = null) {
         if (!entity || entity.currentStats.hp <= 0) return;
 
         // 1. 处理来自技能定义的被动回合结束效果
         if (entity.skills && !specificEffect) {
             for (const skillId of entity.skills) {
                 const skill = SkillLoader.getSkillInfo(skillId);
                 if (skill && skill.passive && skill.effects) {
                     for (const effect of skill.effects) {
                         if (effect.type === 'endOfTurn' || (effect.procDefinition && effect.procDefinition.triggerCondition === 'onTurnEnd')) {
                             if (effect.type === 'proc') {
                                 this.handleProcTrigger(entity, 'onTurnEnd', { teamMembers, monster, battleStats: this.currentBattle ? this.currentBattle.battleStats : {} });
                             } else if (effect.effect) {
                                 BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${entity.name} 的技能 [${skill.name}] 触发回合结束效果。`, { effect: effect.effect }, this.currentTurn);
                                 this.executeTriggeredEffect(entity, effect.effect, { teamMembers, monster, battleStats: this.currentBattle ? this.currentBattle.battleStats : {} }, effect);
                             }
                         }
                         if (effect.procDefinition && effect.procDefinition.triggerCondition === 'onTurnEndIfHpIsOne' && entity.currentStats.hp === 1) {
                             BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${entity.name} HP为1，触发技能 [${skill.name}] 的特殊回合结束效果。`, { skill: skill.name }, this.currentTurn);
                             this.handleProcTrigger(entity, 'onTurnEndIfHpIsOne', { teamMembers, monster, battleStats: this.currentBattle ? this.currentBattle.battleStats : {} });
                         }
                     }
                 }
             }
         }
 
         // 2. 处理来自BUFF的回合结束效果
         if (entity.buffs && !specificEffect) {
             const currentBuffs = [...entity.buffs];
             for (const buff of currentBuffs) {
                 if (buff.onTurnEndEffect) {
                     BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${entity.name} 的BUFF [${buff.name}] 触发回合结束效果。`, { buff: buff.name, effect: buff.onTurnEndEffect }, this.currentTurn);
                     this.executeTriggeredEffect(entity, buff.onTurnEndEffect, { teamMembers, monster, battleStats: this.currentBattle ? this.currentBattle.battleStats : {} }, buff);
                 }
                 if (buff.procDefinition && buff.procDefinition.triggerCondition === 'onTurnEnd') {
                      this.handleProcTrigger(entity, 'onTurnEnd', { teamMembers, monster, battleStats: this.currentBattle ? this.currentBattle.battleStats : {} });
                 }
             }
         }
         
         // 3. 如果传入了 specificEffect
         if (specificEffect) {
             BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, `${entity.name} ${sourceSkillId ? `的技能 [${sourceSkillId}]` : ''} 触发特定回合结束效果。`, { effect: specificEffect }, this.currentTurn);
             this.executeTriggeredEffect(entity, specificEffect, { teamMembers, monster, battleStats: this.currentBattle ? this.currentBattle.battleStats : {} }, {});
         }
     }
 };

if (typeof window !== 'undefined') {
    window.Battle = Battle;
}
