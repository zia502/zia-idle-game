/**
 * 地下城运行器 - 负责处理地下城战斗的逐步执行
 */
const DungeonRunner = {
    /**
     * 当前运行状态
     */
    isRunning: false,

    /**
     * 暂停状态
     */
    isPaused: false,

    /**
     * 战斗日志显示速度（毫秒）- 固定值
     */
    logDisplaySpeed: 800,

    /**
     * 当前运行数据
     */
    currentRun: null,

    /**
     * 上一次地下城记录
     */
    lastDungeonRecord: null,

    /**
     * 当前地下城信息
     */
    currentDungeonInfo: null,

    /**
     * 初始化地下城运行器
     */
    init() {
        // console.log('初始化地下城运行器...');
        this.setupEventListeners();

        // 检查是否有正在进行的地下城探索
        if (typeof Dungeon !== 'undefined' && Dungeon.currentRun) {
            // console.log('检测到正在进行的地下城探索，检查是否应该自动继续');

            // 检查Game.state.currentDungeon是否存在
            const hasSavedDungeon = typeof Game !== 'undefined' && Game.state &&
                                   Game.state.currentDungeon &&
                                   Object.keys(Game.state.currentDungeon || {}).length > 0;

            // console.log('是否有保存的地下城进度:', hasSavedDungeon);

            // 检查角色是否有dungeonOriginalStats
            let hasCharacterDungeonStats = false;
            if (typeof Character !== 'undefined' && Character.characters) {
                const characters = Object.values(Character.characters);
                for (const character of characters) {
                    if (character.dungeonOriginalStats) {
                        hasCharacterDungeonStats = true;
                        break;
                    }
                }
            }

            // console.log('角色是否有地下城原始属性:', hasCharacterDungeonStats);

            // 只有当Game.state.currentDungeon存在且角色有dungeonOriginalStats时才自动继续
            if (hasSavedDungeon && hasCharacterDungeonStats) {
                console.log('确认用户确实在地下城中，自动继续');
                this.isRunning = true;
                this.isPaused = false;

                // 延迟一段时间后继续处理下一个怪物
                setTimeout(() => {
                    this.processNextMonster();
                }, this.logDisplaySpeed);
            } else {
                // console.log('检测到不一致的地下城状态，不自动继续');
                // 清理不一致的状态
                if (!hasSavedDungeon) {
                    // console.log('没有保存的地下城进度，重置Dungeon.currentRun');
                    Dungeon.currentRun = null;
                }

                if (!hasCharacterDungeonStats) {
                    // console.log('角色没有地下城原始属性，重置Dungeon.currentRun');
                    Dungeon.currentRun = null;
                }

                // 如果Game.state.currentDungeon存在但角色没有dungeonOriginalStats，清除Game.state.currentDungeon
                if (hasSavedDungeon && !hasCharacterDungeonStats && typeof Game !== 'undefined' && Game.state) {
                    // console.log('保存的地下城进度存在但角色没有地下城原始属性，清除保存的地下城进度');
                    Game.state.currentDungeon = null;
                    delete Game.state.currentDungeon;

                    // 保存游戏状态
                    if (typeof Game.saveGame === 'function') {
                        Game.saveGame();
                        // console.log('已清除保存的地下城进度');
                    }
                }
            }
        }
    },

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        if (typeof Events === 'undefined') {
            console.warn('Events模块未定义，无法设置事件监听');
            return;
        }

        // 监听地下城开始事件
        Events.on('dungeon:start', (data) => {
            // console.log('收到地下城开始事件:', data);
            this.startDungeonRun(data.dungeonId);
        });
    },

    /**
     * 开始地下城运行
     * @param {string} dungeonId - 地下城ID
     */
    startDungeonRun(dungeonId) {
        if (this.isRunning) {
            console.warn('地下城运行器已在运行中');
            return;
        }

        // 检查Dungeon模块是否存在
        if (typeof Dungeon === 'undefined') {
            console.error('Dungeon模块未定义');
            return;
        }

        // 获取当前地下城运行数据
        const currentRun = Dungeon.currentRun;

        // 检查当前运行数据是否有效
        if (!currentRun) {
            console.error('地下城运行数据不存在');

            // 尝试初始化地下城运行
            if (dungeonId && typeof Dungeon.initDungeonRun === 'function') {
                // console.log(`尝试初始化地下城运行: ${dungeonId}`);
                const success = Dungeon.initDungeonRun(dungeonId);
                if (!success) {
                    console.error(`初始化地下城运行失败: ${dungeonId}`);
                    return;
                }
            } else {
                console.error('无法初始化地下城运行，dungeonId不存在或initDungeonRun方法不存在');
                return;
            }
        }

        // 重新获取当前地下城运行数据
        const updatedCurrentRun = Dungeon.currentRun;
        if (!updatedCurrentRun) {
            console.error('初始化后地下城运行数据仍不存在');
            return;
        }

        // 如果ID不匹配，可能是因为事件触发延迟，尝试使用当前运行的ID
        const actualDungeonId = updatedCurrentRun.dungeonId || dungeonId;
        if (!actualDungeonId) {
            console.error('无法确定地下城ID');
            return;
        }

        // 获取地下城信息
        let dungeonName = '未知地下城';
        let dungeon = null;

        // 尝试从getDungeon获取
        if (typeof Dungeon.getDungeon === 'function') {
            dungeon = Dungeon.getDungeon(actualDungeonId);
            if (dungeon && dungeon.name) {
                dungeonName = dungeon.name;
            }
        }

        // 如果getDungeon失败，尝试从templates获取
        if (!dungeon && Dungeon.templates && Dungeon.templates[actualDungeonId]) {
            dungeon = Dungeon.templates[actualDungeonId];
            if (dungeon && dungeon.name) {
                dungeonName = dungeon.name;
            }
        }

        console.log(`开始地下城运行: ${dungeonName}`);

        // 设置运行状态
        this.isRunning = true;

        // 清空战斗日志和重置地下城状态
        if (typeof Battle !== 'undefined') {
            Battle.battleLog = [];
            // 重置地下城回合数
            Battle.dungeonTurn = 0;

            // 清除所有角色的dungeonOriginalStats，确保被识别为新的地下城探索
            if (typeof Game !== 'undefined' && typeof Game.getActiveTeam === 'function' &&
                typeof Character !== 'undefined' && typeof Character.getCharacter === 'function') {
                const team = Game.getActiveTeam();
                if (team && team.members) {
                    // console.log('清除队伍成员的地下城原始属性，确保被识别为新的地下城探索');
                    for (const memberId of team.members) {
                        const member = Character.getCharacter(memberId);
                        member.dungeonAppliedPassives = {};
                        member.skillCooldowns = {};
                        if (member && member.dungeonOriginalStats) {
                            delete member.dungeonOriginalStats;
                            // console.log(`已清除 ${member.name} 的地下城原始属性`);
                        }
                    }
                }
            }
        }

        // 清除上一次地下城记录
        this.clearLastDungeonRecord();
        console.log('已清除上一次地下城记录，确保UI显示当前地下城进度');

        // 添加地下城开始日志
        this.addBattleLog(`开始挑战地下城: ${dungeonName}`, 'info');

        // 更新地下城进度
        this.updateDungeonProgress();

        // 开始处理第一个怪物
        setTimeout(() => {
            this.processNextMonster();
        }, this.logDisplaySpeed);
    },

    /**
     * 处理下一个怪物
     */
    processNextMonster() {
        if (!this.isRunning || !Dungeon.currentRun) {
            console.warn('地下城运行器未运行或当前运行数据不存在');
            return;
        }

        try {
            // 检查是否有大boss
            if (!Dungeon.currentRun.finalBoss) {
                console.warn('地下城没有大boss，尝试生成默认大boss');

                return;
            }

            // 获取当前怪物
            let monster;

            // 尝试使用Dungeon.getCurrentMonster()方法
            if (typeof Dungeon.getCurrentMonster === 'function') {
                monster = Dungeon.getCurrentMonster();
            }
            // 如果方法不存在或返回null，尝试直接从currentRun获取
            else if (Dungeon.currentRun.monsters && Dungeon.currentRun.monsters.length > 0) {
                if (Dungeon.currentRun.currentMonsterIndex >= Dungeon.currentRun.monsters.length) {
                    Dungeon.currentRun.currentMonsterIndex = 0;
                }
                monster = Dungeon.currentRun.monsters[Dungeon.currentRun.currentMonsterIndex];
            }

            if (!monster) {
                // console.log('没有找到当前怪物，检查是否有小boss或大boss');

                // 如果没有更多怪物，检查是否有小boss
                if (Dungeon.currentRun.defeatedMiniBosses < Dungeon.currentRun.miniBosses.length) {
                    // 处理小boss
                    this.processMiniBoss();
                } else if (!Dungeon.currentRun.finalBossAppeared && Dungeon.currentRun.finalBoss) {
                    // 处理大boss
                    this.processFinalBoss();
                } else {
                    // 完成地下城
                    this.completeDungeon();
                }
                return;
            }

            // 添加遇到怪物的日志
            this.addBattleLog(`地下城回合${Battle.dungeonTurn+1}-遇到了 ${monster.name}`, 'warning');

            // 延迟一段时间后开始战斗
            setTimeout(() => {
                this.startBattle(monster);
            }, this.logDisplaySpeed);
        } catch (error) {
            console.error('处理下一个怪物时出错:', error);
            this.addBattleLog('处理怪物时出错，地下城探索中断', 'danger');
            this.isRunning = false;
        }
    },

    /**
     * 处理小boss
     */
    processMiniBoss() {
        if (!this.isRunning || !Dungeon.currentRun) {
            console.warn('地下城运行器未运行或当前运行数据不存在');
            return;
        }

        try {
            // 检查是否有小boss
            if (!Dungeon.currentRun.miniBosses || !Array.isArray(Dungeon.currentRun.miniBosses) || Dungeon.currentRun.miniBosses.length === 0) {
                console.warn('地下城没有小boss');

                // 重置已击败的小boss计数
                Dungeon.currentRun.defeatedMiniBosses = 0;
            }

            // 检查是否已击败所有小boss
            if (Dungeon.currentRun.defeatedMiniBosses >= Dungeon.currentRun.miniBosses.length) {
                // console.log('已击败所有小boss，检查是否有大boss');
                if (!Dungeon.currentRun.finalBossAppeared && Dungeon.currentRun.finalBoss) {
                    this.processFinalBoss();
                } else {
                    this.completeDungeon();
                }
                return;
            }

            // 获取下一个小boss
            const miniBoss = Dungeon.currentRun.miniBosses[Dungeon.currentRun.defeatedMiniBosses];
            if (!miniBoss) {
                // console.log('没有更多小boss，检查是否有大boss');
                // 如果没有更多小boss，检查是否有大boss
                if (!Dungeon.currentRun.finalBossAppeared && Dungeon.currentRun.finalBoss) {
                    this.processFinalBoss();
                } else {
                    this.completeDungeon();
                }
                return;
            }

            // 添加遇到小boss的日志
            this.addBattleLog(`遇到了小BOSS: ${miniBoss.name}！`, 'danger');

            // 延迟一段时间后开始战斗
            setTimeout(() => {
                this.startBattle(miniBoss, true);
            }, this.logDisplaySpeed * 1.5);
        } catch (error) {
            console.error('处理小boss时出错:', error);
            this.addBattleLog('处理小boss时出错，地下城探索中断', 'danger');
            this.isRunning = false;
        }
    },

    /**
     * 处理大boss
     */
    processFinalBoss() {
        if (!this.isRunning || !Dungeon.currentRun) {
            console.warn('地下城运行器未运行或当前运行数据不存在');
            return;
        }

        try {
            // 检查是否有大boss
            if (!Dungeon.currentRun.finalBoss) {
                console.warn('地下城没有大boss，尝试生成默认大boss');

                return;
            }

            // 获取大boss
            const finalBoss = Dungeon.currentRun.finalBoss;
            if (!finalBoss) {
                // console.log('无法创建大boss，完成地下城');
                this.completeDungeon();
                return;
            }

            // 标记大boss已出现
            Dungeon.currentRun.finalBossAppeared = true;

            // 添加遇到大boss的日志
            this.addBattleLog(`所有小boss已击败！大BOSS ${finalBoss.name} 出现了！`, 'danger');

            // 延迟一段时间后开始战斗
            setTimeout(() => {
                this.startBattle(finalBoss, true, true);
            }, this.logDisplaySpeed * 2);
        } catch (error) {
            console.error('处理大boss时出错:', error);
            this.addBattleLog('处理大boss时出错，地下城探索中断', 'danger');
            this.isRunning = false;
        }
    },

    /**
     * 开始战斗
     * @param {object} monster - 怪物对象
     * @param {boolean} isBoss - 是否为boss
     * @param {boolean} isFinalBoss - 是否为最终boss
     */
    startBattle(monster, isBoss = false, isFinalBoss = false) {
        if (!this.isRunning || !Dungeon.currentRun) {
            console.warn('地下城运行器未运行或当前运行数据不存在');
            return;
        }

        try {
            // 检查怪物对象是否有效
            if (!monster || typeof monster !== 'object') {
                console.error('无效的怪物对象:', monster);
                this.addBattleLog('无效的怪物对象，无法进行战斗', 'error');
                this.isRunning = false;
                return;
            }

            // 保存当前地下城信息
            // 获取地下城名称
            let dungeonName = '未知地下城';
            if (Dungeon.currentRun.dungeonId) {
                // 尝试从getDungeon获取
                if (typeof Dungeon.getDungeon === 'function') {
                    const dungeon = Dungeon.getDungeon(Dungeon.currentRun.dungeonId);
                    if (dungeon && dungeon.name) {
                        dungeonName = dungeon.name;
                    }
                }

                // 如果getDungeon失败，尝试从templates获取
                if (dungeonName === '未知地下城' && Dungeon.templates && Dungeon.templates[Dungeon.currentRun.dungeonId]) {
                    const template = Dungeon.templates[Dungeon.currentRun.dungeonId];
                    if (template && template.name) {
                        dungeonName = template.name;
                    }
                }
            }

            this.currentDungeonInfo = {
                dungeonName: dungeonName,
                currentFloor: Dungeon.currentRun.currentFloor || 0,
                dungeonId: Dungeon.currentRun.dungeonId
            };

            // 确保Dungeon.currentRun也有dungeonName属性
            Dungeon.currentRun.dungeonName = dungeonName;

            // console.log('保存当前地下城信息:', this.currentDungeonInfo);

            // 获取当前活动队伍
            let team;
            if (typeof Game.getActiveTeam === 'function') {
                team = Game.getActiveTeam();
            } else if (Game.activeTeam) {
                team = Game.activeTeam;
            }

            if (!team) {
                this.addBattleLog('没有活动队伍，无法进行战斗', 'error');
                this.isRunning = false;
                return;
            }

            // 检查Battle模块是否存在
            if (typeof Battle === 'undefined' || typeof Battle.startBattle !== 'function') {
                console.error('Battle模块未定义或startBattle方法不存在');
                this.addBattleLog('战斗系统未加载，无法进行战斗', 'error');
                this.isRunning = false;
                return;
            }

            // 保存原始的logBattle方法
            const originalLogBattle = Battle.logBattle;

            // 重写logBattle方法，使其发出事件
            Battle.logBattle = (message) => {
                // 调用原始方法
                if (typeof originalLogBattle === 'function') {
                    originalLogBattle.call(Battle, message);
                } else {
                    // console.log('战斗日志:', message);
                    // 如果原始方法不存在，直接添加到battleLog数组
                    if (!Battle.battleLog) Battle.battleLog = [];
                    Battle.battleLog.push({
                        message: message,
                        type: 'normal',
                        time: Date.now()
                    });
                }

                // 发出事件
                if (typeof Events !== 'undefined') {
                    Events.emit('battle:log', { message });
                }

                // 更新战斗日志显示
                if (typeof MainUI !== 'undefined') {
                    MainUI.updateBattleLog();
                }
            };

            // 开始战斗
            const result = Battle.startBattle(team, monster);

            // 恢复原始的logBattle方法
            Battle.logBattle = originalLogBattle;

            // 处理战斗结果
            setTimeout(() => {
                this.processBattleResult(result, isBoss, isFinalBoss);
            }, this.logDisplaySpeed);
        } catch (error) {
            console.error('开始战斗时出错:', error);
            this.addBattleLog('开始战斗时出错，地下城探索中断', 'danger');
            this.isRunning = false;

            // 恢复原始的logBattle方法（如果存在）
            if (typeof Battle !== 'undefined' && typeof Battle.logBattle !== 'undefined') {
                const originalLogBattle = Battle.logBattle;
                if (typeof originalLogBattle === 'function') {
                    Battle.logBattle = originalLogBattle;
                }
            }
        }
    },

    /**
     * 处理战斗结果
     * @param {object} result - 战斗结果
     * @param {boolean} isBoss - 是否为boss
     * @param {boolean} isFinalBoss - 是否为最终boss
     */
    processBattleResult(result, isBoss = false, isFinalBoss = false) {
        // console.log('开始处理战斗结果:', { result, isBoss, isFinalBoss });
        // console.log('当前DungeonRunner状态:', { isRunning: this.isRunning, currentRun: this.currentRun });

        // 详细记录战斗结果对象
        // console.log('战斗结果对象详细结构:', {
        //     success: result.success,
        //     victory: result.victory,
        //     defeated: result.defeated,
        //     failed: result.failed,
        //     monster: result.monster,
        //     teamMembers: result.teamMembers,
        //     battleLog: result.battleLog,
        //     turnCount: result.turnCount,
        //     totalDamage: result.totalDamage,
        //     totalHealing: result.totalHealing
        // });

        try {
            // 检查结果对象是否有效
            if (!result || typeof result !== 'object') {
                console.error('无效的战斗结果:', result);
                this.addBattleLog('无效的战斗结果，地下城探索中断', 'error');
                this.isRunning = false;
                return;
            }

            // 确保result.monster存在并有正确的名称
            if (!result.monster) {
                // 如果result.monster不存在，尝试从当前战斗中获取怪物信息
                if (typeof Battle !== 'undefined' && Battle.currentMonster) {
                    result.monster = Battle.currentMonster;
                } else {
                    // 如果无法获取当前战斗的怪物，使用默认值
                    result.monster = { name: '未知怪物' };
                }
            }

            // 如果monster.name不存在或为空，尝试设置一个有意义的名称
            if (!result.monster.name || result.monster.name === '未知怪物') {
                // 尝试从当前地下城运行中获取怪物名称
                if (Dungeon.currentRun) {
                    if (isFinalBoss && Dungeon.currentRun.finalBoss) {
                        result.monster.name = Dungeon.currentRun.finalBoss.name || '大BOSS';
                    } else if (isBoss) {
                        // 尝试获取当前小boss名称
                        const miniBossIndex = Dungeon.currentRun.defeatedMiniBosses;
                        if (Dungeon.currentRun.miniBosses && Dungeon.currentRun.miniBosses[miniBossIndex]) {
                            result.monster.name = Dungeon.currentRun.miniBosses[miniBossIndex].name || '小BOSS';
                        } else {
                            result.monster.name = '小BOSS';
                        }
                    } else {
                        // 尝试获取当前普通怪物名称
                        const monsterIndex = Dungeon.currentRun.currentMonsterIndex;
                        if (Dungeon.currentRun.monsters && Dungeon.currentRun.monsters[monsterIndex]) {
                            result.monster.name = Dungeon.currentRun.monsters[monsterIndex].name || '普通怪物';
                        } else {
                            result.monster.name = '普通怪物';
                        }
                    }
                }
            }

            // 检查战斗结果
            const isVictory = result.success && result.victory;
            const isDefeated = result.defeated || result.failed || !result.success || !result.victory;

            // console.log('战斗结果判断:', {
            //     isVictory,
            //     isDefeated,
            //     success: result.success,
            //     victory: result.victory,
            //     defeated: result.defeated,
            //     failed: result.failed
            // });

            if (isVictory && !isDefeated) {
                // 战斗胜利
                // 处理奖励
                const rewardInfo = Dungeon.processRewards(result.monster);

                // 显示物品奖励
                if (rewardInfo.items && rewardInfo.items.length > 0) {
                    const itemCounts = {};

                    // 统计每种物品的数量
                    rewardInfo.items.forEach(item => {
                        if (!itemCounts[item.id]) {
                            itemCounts[item.id] = 0;
                        }
                        itemCounts[item.id] += item.count || 1;
                    });

                    let msg = "";
                    // 显示物品奖励
                    for (const [itemId, count] of Object.entries(itemCounts)) {
                        let itemName = itemId;

                        // 尝试获取物品名称
                        if (itemId === 'silver_chest') {
                            itemName = '银宝箱';
                        } else if (itemId === 'gold_chest') {
                            itemName = '金宝箱';
                        } else if (itemId === 'red_chest') {
                            itemName = '红宝箱';
                        } else if (itemId === 'rainbow_chest') {
                            itemName = '彩虹宝箱';
                        }

                        msg += `,${itemName} x${count}`;
                    }
                    // 显示奖励信息
                    this.addBattleLog(`击败了${result.monster.name},获得经验值: ${rewardInfo.exp} ${msg}`, 'success');
                }

                if (isBoss) {
                    if (isFinalBoss) {
                        // 击败最终boss
                        this.addBattleLog(`击败了大BOSS ${result.monster.name}！`, 'success');

                        // 延迟一段时间后完成地下城
                        setTimeout(() => {
                            this.completeDungeon();
                        }, this.logDisplaySpeed);
                    } else {

                        // 增加已击败的小boss数量
                        Dungeon.currentRun.defeatedMiniBosses++;

                        // 更新地下城进度
                        this.updateDungeonProgress(true);

                        // 保存地下城进度
                        if (typeof Dungeon.saveDungeonProgress === 'function') {
                            Dungeon.saveDungeonProgress();
                            // console.log('已保存地下城进度（击败小BOSS后）');
                        }

                        // 延迟一段时间后处理下一个怪物或boss
                        setTimeout(() => {
                            if (Dungeon.currentRun.defeatedMiniBosses < Dungeon.currentRun.miniBosses.length) {
                                this.processMiniBoss();
                            } else if (!Dungeon.currentRun.finalBossAppeared && Dungeon.currentRun.finalBoss) {
                                this.processFinalBoss();
                            } else {
                                this.completeDungeon();
                            }
                        }, this.logDisplaySpeed);
                    }
                } else {

                    // 增加当前怪物索引和已击败怪物计数
                    Dungeon.currentRun.currentMonsterIndex++;
                    Dungeon.currentRun.defeatedMonsters = (Dungeon.currentRun.defeatedMonsters || 0) + 1;

                    // 更新地下城进度
                    this.updateDungeonProgress(true);

                    // 保存地下城进度
                    if (typeof Dungeon.saveDungeonProgress === 'function') {
                        Dungeon.saveDungeonProgress();
                        // console.log('已保存地下城进度（击败普通怪物后）');
                    }

                    // 延迟一段时间后处理下一个怪物
                    setTimeout(() => {
                        this.processNextMonster();
                    }, this.logDisplaySpeed);
                }
            } else {
                // console.log('战斗失败，开始处理失败逻辑');
                // 战斗失败
                this.addBattleLog(`队伍被 ${result.monster.name} 击败了...`, 'danger');

                // 添加失败信息
                this.addBattleLog('地下城挑战失败！', 'danger');

                // 更新地下城进度
                this.updateDungeonProgress();

                // 计算总怪物数量和已击败的怪物数量
                let totalMonsters = 0;
                let defeatedMonsters = 0;
                let totalMiniBosses = 0;
                let defeatedMiniBosses = 0;
                let dungeonId = '';

                // 从Dungeon.currentRun中获取数据
                if (Dungeon.currentRun) {
                    console.log('从Dungeon.currentRun中获取怪物统计数据');

                    // 获取地下城ID
                    dungeonId = Dungeon.currentRun.dungeonId;
                    console.log(`当前地下城ID: ${dungeonId}`);

                    // 获取已击败怪物数量
                    if (typeof Dungeon.currentRun.defeatedMonsters === 'number') {
                        defeatedMonsters = Dungeon.currentRun.defeatedMonsters;
                        console.log(`从Dungeon.currentRun.defeatedMonsters获取到已击败怪物数量: ${defeatedMonsters}`);
                    }

                    // 获取已击败小BOSS数量
                    if (typeof Dungeon.currentRun.defeatedMiniBosses === 'number') {
                        defeatedMiniBosses = Dungeon.currentRun.defeatedMiniBosses;
                        console.log(`从Dungeon.currentRun.defeatedMiniBosses获取到已击败小BOSS数量: ${defeatedMiniBosses}`);
                    }
                }

                // 从Dungeon.dungeons中获取地下城配置
                if (dungeonId && typeof Dungeon !== 'undefined' && Dungeon.dungeons && Dungeon.dungeons[dungeonId]) {
                    console.log(`从Dungeon.dungeons[${dungeonId}]获取地下城配置`);

                    const dungeonConfig = Dungeon.dungeons[dungeonId];

                    // 获取小BOSS数量
                    if (dungeonConfig.miniBossCount) {
                        totalMiniBosses = dungeonConfig.miniBossCount;
                        console.log(`从Dungeon.dungeons[${dungeonId}].miniBossCount获取到总小BOSS数量: ${totalMiniBosses}`);
                    }

                    // 获取地下城类型
                    const dungeonType = dungeonConfig.type || 'normal';
                    console.log(`地下城类型: ${dungeonType}`);

                    // 从地下城类型获取怪物数量范围
                    if (Dungeon.types && Dungeon.types[dungeonType] && Dungeon.types[dungeonType].monsterCount) {
                        const monsterCountRange = Dungeon.types[dungeonType].monsterCount;
                        // 使用范围的平均值作为总怪物数量
                        totalMonsters = Math.floor((monsterCountRange.min + monsterCountRange.max) / 2);
                        console.log(`从Dungeon.types[${dungeonType}].monsterCount获取到总怪物数量范围: ${monsterCountRange.min}-${monsterCountRange.max}，使用平均值: ${totalMonsters}`);
                    }
                }

                // 如果仍然没有获取到小BOSS数量，尝试从Dungeon.templates获取
                if (totalMiniBosses === 0 && dungeonId && typeof Dungeon !== 'undefined' && Dungeon.templates && Dungeon.templates[dungeonId]) {
                    console.log(`从Dungeon.templates[${dungeonId}]获取小BOSS数量`);

                    const template = Dungeon.templates[dungeonId];

                    if (template.miniBossCount) {
                        totalMiniBosses = template.miniBossCount;
                        console.log(`从模板获取到总小BOSS数量: ${totalMiniBosses}`);
                    }
                }

                // 如果仍然没有获取到怪物数量，尝试从Dungeon.currentRun中获取
                if (totalMonsters === 0 && Dungeon.currentRun) {
                    // 获取总怪物数量
                    if (Dungeon.currentRun.monsterCount) {
                        totalMonsters = Dungeon.currentRun.monsterCount;
                        console.log(`从Dungeon.currentRun.monsterCount获取到总怪物数量: ${totalMonsters}`);
                    } else if (Dungeon.currentRun.monsters && Dungeon.currentRun.monsters.length > 0) {
                        totalMonsters = Dungeon.currentRun.monsters.length;
                        console.log(`从Dungeon.currentRun.monsters.length获取到总怪物数量: ${totalMonsters}`);
                    }

                    // 获取总小BOSS数量
                    if (totalMiniBosses === 0) {
                        if (Dungeon.currentRun.miniBossCount) {
                            totalMiniBosses = Dungeon.currentRun.miniBossCount;
                            console.log(`从Dungeon.currentRun.miniBossCount获取到总小BOSS数量: ${totalMiniBosses}`);
                        } else if (Dungeon.currentRun.miniBosses && Dungeon.currentRun.miniBosses.length > 0) {
                            totalMiniBosses = Dungeon.currentRun.miniBosses.length;
                            console.log(`从Dungeon.currentRun.miniBosses.length获取到总小BOSS数量: ${totalMiniBosses}`);
                        }
                    }
                }

                // 如果仍然为0，根据地下城ID设置特定值
                if (dungeonId === 'forest_cave') {
                    // 森林洞穴地下城
                    if (totalMonsters === 0) {
                        totalMonsters = 5; // 森林洞穴的怪物数量
                        console.log(`为森林洞穴设置特定的总怪物数量: ${totalMonsters}`);
                    }

                    if (totalMiniBosses === 0) {
                        totalMiniBosses = 2; // 森林洞穴的小BOSS数量
                        console.log(`为森林洞穴设置特定的总小BOSS数量: ${totalMiniBosses}`);
                    }
                } else {
                    // 其他地下城，使用默认值
                    if (totalMonsters === 0) {
                        totalMonsters = 10; // 默认值
                        console.log(`设置默认总怪物数量: ${totalMonsters}`);
                    }

                    if (totalMiniBosses === 0) {
                        totalMiniBosses = 2; // 默认值
                        console.log(`设置默认总小BOSS数量: ${totalMiniBosses}`);
                    }
                }

                // 如果在地下城中，尝试从this.currentDungeonInfo获取更多信息
                if (this.currentDungeonInfo) {
                    console.log('从this.currentDungeonInfo中获取更多信息');

                    if (this.currentDungeonInfo.defeatedMonsters !== undefined) {
                        defeatedMonsters = this.currentDungeonInfo.defeatedMonsters;
                        console.log(`从this.currentDungeonInfo.defeatedMonsters获取到已击败怪物数量: ${defeatedMonsters}`);
                    }

                    if (this.currentDungeonInfo.defeatedMiniBosses !== undefined) {
                        defeatedMiniBosses = this.currentDungeonInfo.defeatedMiniBosses;
                        console.log(`从this.currentDungeonInfo.defeatedMiniBosses获取到已击败小BOSS数量: ${defeatedMiniBosses}`);
                    }
                }

                console.log('战斗失败时的统计数据:', {
                    totalMonsters,
                    defeatedMonsters,
                    totalMiniBosses,
                    defeatedMiniBosses
                });

                // 在获取队伍统计信息前，确保战斗结果中包含正确的战斗状态
                if (result) {
                    // 明确设置战斗失败标志
                    result.victory = false;
                    result.defeated = true;
                    result.failed = true;

                    // 如果有队伍成员信息，确保所有队伍成员的HP为0（表示阵亡）
                    if (result.teamMembers) {
                        for (const member of result.teamMembers) {
                            if (member.currentStats) {
                                // 保存原始HP值用于调试
                                const originalHp = member.currentStats.hp;
                                // 设置HP为0表示阵亡
                                member.currentStats.hp = 0;
                                console.log(`设置角色 ${member.name} 的HP从 ${originalHp} 变为 0（阵亡）`);
                            }

                            // 从Battle.currentBattle中获取战斗统计数据
                            if (typeof Battle !== 'undefined' && Battle.currentBattle &&
                                Battle.currentBattle.battleStats &&
                                Battle.currentBattle.battleStats.characterStats &&
                                Battle.currentBattle.battleStats.characterStats[member.id]) {

                                // 获取战斗统计数据
                                const battleStats = Battle.currentBattle.battleStats.characterStats[member.id];

                                // 更新角色的统计数据
                                if (!member.stats) {
                                    member.stats = {
                                        totalDamage: battleStats.totalDamage || 0,
                                        totalHealing: battleStats.totalHealing || 0,
                                        daCount: battleStats.daCount || 0,
                                        taCount: battleStats.taCount || 0,
                                        critCount: battleStats.critCount || 0
                                    };
                                } else {
                                    member.stats.totalDamage = battleStats.totalDamage || 0;
                                    member.stats.totalHealing = battleStats.totalHealing || 0;
                                    member.stats.daCount = battleStats.daCount || 0;
                                    member.stats.taCount = battleStats.taCount || 0;
                                    member.stats.critCount = battleStats.critCount || 0;
                                }

                                console.log(`从Battle.currentBattle中获取角色 ${member.name} 的战斗统计数据:`, member.stats);
                            } else {
                                console.log(`无法从Battle.currentBattle中获取角色 ${member.name} 的战斗统计数据`);
                            }
                        }
                    }
                }

                // 获取队伍统计信息
                const teamStats = this.getTeamStats(result);
                console.log('获取到的队伍统计信息:', teamStats);

                // 获取地下城ID
                const currentDungeonId = Dungeon.currentRun?.dungeonId || '';

                // 如果是森林洞穴地下城，强制设置正确的怪物数量
                if (currentDungeonId === 'forest_cave' ||
                    this.currentDungeonInfo?.dungeonName === '森林洞穴' ||
                    Dungeon.currentRun?.dungeonName === '森林洞穴') {
                    console.log('在processBattleResult中强制设置森林洞穴地下城的怪物数量');
                    totalMonsters = 5;
                    totalMiniBosses = 2;
                }

                // 保存战斗记录
                const currentRunData = {
                    dungeonId: currentDungeonId,
                    dungeonName: this.currentDungeonInfo?.dungeonName || Dungeon.currentRun?.dungeonName || '未知地下城',
                    floor: this.currentDungeonInfo?.currentFloor || 0,
                    monsterName: result.monster.name || '未知怪物',
                    monsterType: result.monster.isBoss ? 'BOSS' : (result.monster.isMiniBoss ? '小BOSS' : '普通怪物'),
                    defeatReason: this.getDefeatReason(result),
                    teamStats: teamStats,
                    defeatedMonsters: defeatedMonsters,
                    totalMonsters: totalMonsters,
                    defeatedMiniBosses: defeatedMiniBosses,
                    totalMiniBosses: totalMiniBosses
                };

                // console.log('准备保存的战斗记录:', currentRunData);
                // console.log('当前Dungeon.currentRun状态:', Dungeon.currentRun);
                // console.log('当前lastDungeonRecord状态:', this.lastDungeonRecord);

                // 先保存战斗记录
                this.lastDungeonRecord = currentRunData;
                // console.log('战斗记录已保存，新的lastDungeonRecord:', this.lastDungeonRecord);

                // 然后清理地下城状态
                // console.log('开始清理地下城状态');
                this.exitDungeon();

                // 更新UI显示
                if (typeof MainUI !== 'undefined') {
                    console.log('战斗失败后更新UI显示');
                    MainUI.updateCurrentDungeon();
                }

                // 如果MainCurrentDungeon组件存在，直接调用它的update方法
                if (typeof MainCurrentDungeon !== 'undefined' && typeof MainCurrentDungeon.update === 'function') {
                    console.log('使用MainCurrentDungeon组件更新地下城显示');
                    setTimeout(() => MainCurrentDungeon.update(), 100); // 短暂延迟确保lastDungeonRecord已设置
                }
            }
        } catch (error) {
            console.error('处理战斗结果时出错:', error);
            this.addBattleLog('处理战斗结果时出错，地下城探索中断', 'danger');
            this.isRunning = false;

            // 更新地下城信息显示
            if (typeof MainUI !== 'undefined') {
                MainUI.updateCurrentDungeon();
            }
        }
    },

    /**
     * 完成地下城
     */
    completeDungeon() {
        if (!this.isRunning || !Dungeon.currentRun) {
            console.warn('地下城运行器未运行或当前运行数据不存在');
            return;
        }

        try {
            // 标记地下城已完成
            Dungeon.currentRun.isCompleted = true;

            // 获取地下城名称
            let dungeonName = '未知地下城';
            try {
                if (Dungeon.currentRun.dungeonId) {
                    const dungeonTemplate = Dungeon.templates[Dungeon.currentRun.dungeonId];
                    if (dungeonTemplate) {
                        dungeonName = dungeonTemplate.name;
                    } else if (typeof Dungeon.getDungeon === 'function') {
                        const dungeon = Dungeon.getDungeon(Dungeon.currentRun.dungeonId);
                        if (dungeon) {
                            dungeonName = dungeon.name;
                        }
                    }
                }
            } catch (error) {
                console.error('获取地下城名称时出错:', error);
            }

            // 添加完成日志
            this.addBattleLog(`地下城 ${dungeonName} 挑战成功！`, 'success');

            // 不再显示奖励信息，因为奖励已经在每次战斗胜利后立即给予

            // 更新地下城进度
            this.updateDungeonProgress(true);

            // 完成地下城
            if (typeof Dungeon.completeDungeon === 'function' && Dungeon.currentRun.dungeonId) {
                try {
                    Dungeon.completeDungeon(Dungeon.currentRun.dungeonId);
                } catch (error) {
                    console.error('调用Dungeon.completeDungeon时出错:', error);
                }
            }

            // 结束地下城运行
            this.isRunning = false;

            // 更新地下城信息显示
            if (typeof MainUI !== 'undefined') {
                console.log('地下城完成后更新UI显示');
                MainUI.updateCurrentDungeon();
            }

            // 如果MainCurrentDungeon组件存在，直接调用它的update方法
            if (typeof MainCurrentDungeon !== 'undefined' && typeof MainCurrentDungeon.update === 'function') {
                console.log('使用MainCurrentDungeon组件更新地下城显示');
                MainCurrentDungeon.update();
            }
        } catch (error) {
            console.error('完成地下城时出错:', error);
            this.addBattleLog('完成地下城时出错', 'danger');
            this.isRunning = false;

            // 更新地下城信息显示
            if (typeof MainUI !== 'undefined') {
                console.log('地下城完成出错后更新UI显示');
                MainUI.updateCurrentDungeon();
            }

            // 如果MainCurrentDungeon组件存在，直接调用它的update方法
            if (typeof MainCurrentDungeon !== 'undefined' && typeof MainCurrentDungeon.update === 'function') {
                console.log('使用MainCurrentDungeon组件更新地下城显示');
                MainCurrentDungeon.update();
            }
        }
    },

    /**
     * 添加战斗日志
     * @param {string} message - 日志消息
     * @param {string} type - 日志类型 (info, success, warning, danger)
     */
    addBattleLog(message, type = 'info') {
        if (typeof Battle === 'undefined') {
            console.warn('Battle模块未定义，无法添加战斗日志');
            return;
        }

        // 添加到战斗日志
        Battle.battleLog = Battle.battleLog || [];
        Battle.battleLog.push({
            message: message,
            type: type,
            time: Date.now()
        });

        // 如果日志超过100条，保留最新的100条
        if (Battle.battleLog.length > 100) {
            Battle.battleLog = Battle.battleLog.slice(-100);
        }

        // 发出事件
        if (typeof Events !== 'undefined') {
            Events.emit('battle:log', { message, type });
        }

        // 更新战斗日志显示
        if (typeof MainUI !== 'undefined') {
            // 使用setTimeout确保在DOM更新后执行滚动
            setTimeout(() => {
                MainUI.updateBattleLog();
            }, 0);
        }
    },

    /**
     * 更新地下城进度
     * @param {boolean} saveProgress - 是否保存地下城进度
     */
    updateDungeonProgress(saveProgress = false) {
        if (!Dungeon.currentRun) {
            return;
        }

        // 计算总怪物数量（普通怪物 + 小BOSS + 大BOSS）
        const totalMonsters = Dungeon.currentRun.monsters.length +
                             Dungeon.currentRun.miniBosses.length +
                             (Dungeon.currentRun.finalBoss ? 1 : 0);

        // 计算已击败的怪物数量
        const defeatedMonsters = Dungeon.currentRun.currentMonsterIndex +
                                Dungeon.currentRun.defeatedMiniBosses +
                                (Dungeon.currentRun.isCompleted ? 1 : 0);

        // 计算进度百分比 - 确保是整数
        const progress = totalMonsters > 0 ?
                        Math.floor((defeatedMonsters / totalMonsters) * 100) : 0;

        // 更新进度
        Dungeon.currentRun.progress = progress;

        // 如果需要，保存地下城进度
        if (saveProgress && typeof Dungeon.saveDungeonProgress === 'function') {
            Dungeon.saveDungeonProgress();
            // console.log('已保存地下城进度（更新进度时）');
        }

        // 发出事件
        if (typeof Events !== 'undefined') {
            Events.emit('dungeon:updated');
        }

        // 更新地下城信息显示
        if (typeof MainUI !== 'undefined') {
            MainUI.updateCurrentDungeon();
        }
    },

    /**
     * 退出地下城
     */
    exitDungeon() {
        // console.log('开始退出地下城，当前状态:', {
        //     currentRun: this.currentRun,
        //     isRunning: this.isRunning,
        //     lastDungeonRecord: this.lastDungeonRecord
        // });

        // 刷新主角信息
        if (typeof UI !== 'undefined' && typeof UI.renderMainCharacter === 'function') {
             UI.renderMainCharacter();
        }

        // 保存战斗记录
        if (this.currentRun) {
            // 恢复队伍成员的地下城原始属性
            if (this.currentRun.team && this.currentRun.team.members) {
                for (const member of this.currentRun.team.members) {
                    const character = Character.getCharacter(member);
                    if (character && character.dungeonOriginalStats) {
                        character.currentStats = JSON.parse(JSON.stringify(character.dungeonOriginalStats));
                        delete character.dungeonOriginalStats;
                    }
                }

                // 清除所有BUFF
                for (const member of this.currentRun.team.members) {
                    const character = Character.getCharacter(member);
                    if (character && typeof BuffSystem !== 'undefined') {
                        BuffSystem.clearAllBuffs(character);
                    }
                }
            }
        }

        // 重置地下城运行状态
        this.currentRun = null;
        this.isRunning = false;

        // 清除Dungeon.currentRun
        if (typeof Dungeon !== 'undefined') {
            Dungeon.currentRun = null;
        }

        // 清除保存的地下城进度
        if (typeof Storage !== 'undefined') {
            Storage.remove('dungeonProgress');
        }

        // 清除Game.state中的地下城进度
        if (typeof Game !== 'undefined' && Game.state) {
            delete Game.state.currentDungeon;
            if (typeof Game.saveGame === 'function') {
                Game.saveGame();
            }
        }

        // console.log('地下城状态已清理，当前状态:', {
        //     currentRun: this.currentRun,
        //     isRunning: this.isRunning,
        //     lastDungeonRecord: this.lastDungeonRecord
        // });

        // 更新UI显示
        if (typeof MainUI !== 'undefined') {
            console.log('退出地下城后更新UI显示');
            MainUI.updateCurrentDungeon();
        }

        // 如果MainCurrentDungeon组件存在，直接调用它的update方法
        if (typeof MainCurrentDungeon !== 'undefined' && typeof MainCurrentDungeon.update === 'function') {
            console.log('使用MainCurrentDungeon组件更新地下城显示');
            MainCurrentDungeon.update();
        }

        // 更新地下城列表显示
        if (typeof UI !== 'undefined' && typeof UI.updateDungeonList === 'function') {
            UI.updateDungeonList();
        }
    },

    /**
     * 获取战败原因
     * @param {object} battle - 战斗记录
     * @returns {string} 战败原因
     */
    getDefeatReason(battle) {
        if (!battle || !battle.teamMembers) {
            return '队伍全灭';
        }

        const aliveMembers = battle.teamMembers.filter(member => member.currentStats.hp > 0);
        if (aliveMembers.length === 0) {
            return '队伍全灭';
        }

        const totalDamage = battle.teamMembers.reduce((sum, member) => sum + (member.stats?.totalDamage || 0), 0);
        const monsterHp = battle.monster?.currentStats?.maxHp || 0;

        if (totalDamage < monsterHp * 0.1) {
            return '输出不足';
        } else if (totalDamage < monsterHp * 0.3) {
            return '伤害不够';
        } else if (totalDamage < monsterHp * 0.5) {
            return '未能造成有效伤害';
        } else {
            return '战斗失败';
        }
    },

    /**
     * 获取队伍统计信息
     * @param {object} battle - 战斗记录
     * @returns {array} 队伍成员统计信息
     */
    getTeamStats(battle) {
        console.log('获取队伍统计信息，战斗记录:', battle);

        // 首先尝试从Battle.currentBattle获取最新的战斗统计数据
        if (typeof Battle !== 'undefined' && Battle.currentBattle &&
            Battle.currentBattle.battleStats && Battle.currentBattle.teamMembers) {

            console.log('从Battle.currentBattle获取最新的战斗统计数据');

            const teamStats = [];

            // 遍历队伍成员
            for (const member of Battle.currentBattle.teamMembers) {
                // 获取角色的战斗统计数据
                const characterStats = Battle.currentBattle.battleStats.characterStats &&
                                      Battle.currentBattle.battleStats.characterStats[member.id];

                if (characterStats) {
                    console.log(`从Battle.currentBattle中获取角色 ${member.name} 的战斗统计数据:`, characterStats);

                    // 如果战斗失败，所有角色都应该是阵亡的
                    const isAlive = Battle.currentBattle.victory !== false && member.currentStats?.hp > 0;

                    teamStats.push({
                        name: member.name || '未知角色',
                        totalDamage: characterStats.totalDamage || 0,
                        totalHealing: characterStats.totalHealing || 0,
                        daCount: characterStats.daCount || 0,
                        taCount: characterStats.taCount || 0,
                        critCount: characterStats.critCount || 0,
                        isAlive: isAlive
                    });
                } else {
                    console.log(`无法从Battle.currentBattle中获取角色 ${member.name} 的战斗统计数据，使用角色自身的统计数据`);

                    // 如果战斗失败，所有角色都应该是阵亡的
                    const isAlive = Battle.currentBattle.victory !== false && member.currentStats?.hp > 0;

                    teamStats.push({
                        name: member.name || '未知角色',
                        totalDamage: member.stats?.totalDamage || 0,
                        totalHealing: member.stats?.totalHealing || 0,
                        daCount: member.stats?.daCount || 0,
                        taCount: member.stats?.taCount || 0,
                        critCount: member.stats?.critCount || 0,
                        isAlive: isAlive
                    });
                }
            }

            if (teamStats.length > 0) {
                console.log('成功从Battle.currentBattle获取队伍统计信息:', teamStats);
                return teamStats;
            }
        }

        // 如果没有战斗记录或队伍成员，尝试从Game.getActiveTeam获取
        if (!battle || !battle.teamMembers) {
            console.log('战斗记录中没有队伍成员信息，尝试从Game.getActiveTeam获取');

            if (typeof Game !== 'undefined' && typeof Game.getActiveTeam === 'function') {
                const team = Game.getActiveTeam();
                if (team && team.members && team.members.length > 0) {
                    console.log('从Game.getActiveTeam获取到队伍成员:', team.members);

                    const teamStats = [];
                    for (const memberId of team.members) {
                        if (typeof Character !== 'undefined' && typeof Character.getCharacter === 'function') {
                            const character = Character.getCharacter(memberId);
                            if (character) {
                                console.log(`获取到角色 ${character.name} 的统计信息:`, character.stats);

                                // 如果战斗失败，所有角色都应该是阵亡的
                                const isAlive = battle && battle.victory === false ? false : character.currentStats?.hp > 0;

                                teamStats.push({
                                    name: character.name || '未知角色',
                                    totalDamage: character.stats?.totalDamage || 0,
                                    totalHealing: character.stats?.totalHealing || 0,
                                    daCount: character.stats?.daCount || 0,
                                    taCount: character.stats?.taCount || 0,
                                    critCount: character.stats?.critCount || 0,
                                    isAlive: isAlive
                                });
                            }
                        }
                    }

                    if (teamStats.length > 0) {
                        console.log('成功获取队伍统计信息:', teamStats);
                        return teamStats;
                    }
                }
            }

            console.warn('无法获取队伍统计信息，返回空数组');
            return [];
        }

        // 从战斗记录中获取队伍统计信息
        const teamStats = battle.teamMembers.map(member => {
            console.log(`从战斗记录中获取角色 ${member.name} 的统计信息:`, member.stats);

            // 如果战斗失败，所有角色都应该是阵亡的
            const isAlive = battle.victory !== false && member.currentStats?.hp > 0;

            return {
                name: member.name || '未知角色',
                totalDamage: member.stats?.totalDamage || 0,
                totalHealing: member.stats?.totalHealing || 0,
                daCount: member.stats?.daCount || 0,
                taCount: member.stats?.taCount || 0,
                critCount: member.stats?.critCount || 0,
                isAlive: isAlive
            };
        });

        console.log('成功从战斗记录中获取队伍统计信息:', teamStats);
        return teamStats;
    },

    /**
     * 获取上一次地下城记录
     * @returns {object|null} 上一次地下城记录
     */
    getLastDungeonRecord() {
        // 如果没有上一次地下城记录，返回null
        if (!this.lastDungeonRecord) {
            return null;
        }

        // 获取地下城ID
        const dungeonId = this.lastDungeonRecord.dungeonId || '';

        // 如果是森林洞穴地下城，确保小BOSS数量为2
        if (dungeonId === 'forest_cave' || this.lastDungeonRecord.dungeonName === '森林洞穴') {
            // 确保小BOSS数量为2
            if (this.lastDungeonRecord.totalMiniBosses !== 2) {
                console.log('修正森林洞穴地下城的小BOSS数量为2');
                this.lastDungeonRecord.totalMiniBosses = 2;
            }

            // 确保怪物数量合理
            if (this.lastDungeonRecord.totalMonsters === 0 || this.lastDungeonRecord.totalMonsters > 10) {
                console.log('修正森林洞穴地下城的怪物数量为5');
                this.lastDungeonRecord.totalMonsters = 5;
            }
        }

        return this.lastDungeonRecord;
    },

    /**
     * 清除上一次地下城记录
     */
    clearLastDungeonRecord() {
        this.lastDungeonRecord = null;
    }
};
