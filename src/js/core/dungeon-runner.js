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
     * 初始化地下城运行器
     */
    init() {
        console.log('初始化地下城运行器...');
        this.setupEventListeners();
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
            console.log('收到地下城开始事件:', data);
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
                console.log(`尝试初始化地下城运行: ${dungeonId}`);
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

        console.log(`开始地下城运行: ${actualDungeonId}, 当前运行ID: ${updatedCurrentRun.dungeonId}, 地下城名称: ${dungeonName}`);

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
                    console.log('清除队伍成员的地下城原始属性，确保被识别为新的地下城探索');
                    for (const memberId of team.members) {
                        const member = Character.getCharacter(memberId);
                        if (member && member.dungeonOriginalStats) {
                            delete member.dungeonOriginalStats;
                            console.log(`已清除 ${member.name} 的地下城原始属性`);
                        }
                    }
                }
            }
        }

        // 添加地下城开始日志
        this.addBattleLog(`开始挑战地下城: ${dungeonName}`, 'info');

        // 更新地下城进度
        this.updateDungeonProgress(0);

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
            // 检查是否有怪物数组
            if (!Dungeon.currentRun.monsters || !Array.isArray(Dungeon.currentRun.monsters) || Dungeon.currentRun.monsters.length === 0) {
                console.warn('地下城没有普通怪物，尝试生成默认怪物');

                // 创建默认怪物
                Dungeon.currentRun.monsters = [
                    {
                        id: 'default_monster_1',
                        name: '史莱姆',
                        attribute: 'water',
                        baseStats: {
                            hp: 100,
                            attack: 10,
                            defense: 5,
                            maxHp: 100
                        },
                        currentStats: {
                            hp: 100,
                            attack: 10,
                            defense: 5,
                            maxHp: 100
                        },
                        isBoss: false,
                        isMiniBoss: false,
                        isFinalBoss: false,
                        xpReward: 50
                    },
                    {
                        id: 'default_monster_2',
                        name: '哥布林',
                        attribute: 'earth',
                        baseStats: {
                            hp: 150,
                            attack: 15,
                            defense: 8,
                            maxHp: 150
                        },
                        currentStats: {
                            hp: 150,
                            attack: 15,
                            defense: 8,
                            maxHp: 150
                        },
                        isBoss: false,
                        isMiniBoss: false,
                        isFinalBoss: false,
                        xpReward: 80
                    }
                ];
            }

            // 检查是否有小boss数组
            if (!Dungeon.currentRun.miniBosses || !Array.isArray(Dungeon.currentRun.miniBosses) || Dungeon.currentRun.miniBosses.length === 0) {
                console.warn('地下城没有小boss，尝试生成默认小boss');

                // 创建默认小boss
                Dungeon.currentRun.miniBosses = [
                    {
                        id: 'default_miniboss',
                        name: '哥布林酋长',
                        attribute: 'earth',
                        baseStats: {
                            hp: 500,
                            attack: 30,
                            defense: 15,
                            maxHp: 500
                        },
                        currentStats: {
                            hp: 500,
                            attack: 30,
                            defense: 15,
                            maxHp: 500
                        },
                        isBoss: true,
                        isMiniBoss: true,
                        isFinalBoss: false,
                        xpReward: 300,
                        skills: []
                    }
                ];
            }

            // 检查是否有大boss
            if (!Dungeon.currentRun.finalBoss) {
                console.warn('地下城没有大boss，尝试生成默认大boss');

                // 创建默认大boss
                Dungeon.currentRun.finalBoss = {
                    id: 'default_finalboss',
                    name: '森林守护者',
                    attribute: 'earth',
                    baseStats: {
                        hp: 1000,
                        attack: 50,
                        defense: 20,
                        maxHp: 1000
                    },
                    currentStats: {
                        hp: 1000,
                        attack: 50,
                        defense: 20,
                        maxHp: 1000
                    },
                    isBoss: true,
                    isMiniBoss: false,
                    isFinalBoss: true,
                    xpReward: 800,
                    skills: []
                };
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
                console.log('没有找到当前怪物，检查是否有小boss或大boss');

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
            this.addBattleLog(`遇到了 ${monster.name}`, 'warning');

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
                console.warn('地下城没有小boss，尝试生成默认小boss');

                // 创建默认小boss
                Dungeon.currentRun.miniBosses = [
                    {
                        id: 'default_miniboss',
                        name: '哥布林酋长',
                        attribute: 'earth',
                        baseStats: {
                            hp: 500,
                            attack: 30,
                            defense: 15,
                            maxHp: 500
                        },
                        currentStats: {
                            hp: 500,
                            attack: 30,
                            defense: 15,
                            maxHp: 500
                        },
                        isBoss: true,
                        isMiniBoss: true,
                        isFinalBoss: false,
                        xpReward: 300,
                        skills: []
                    }
                ];

                // 重置已击败的小boss计数
                Dungeon.currentRun.defeatedMiniBosses = 0;
            }

            // 检查是否已击败所有小boss
            if (Dungeon.currentRun.defeatedMiniBosses >= Dungeon.currentRun.miniBosses.length) {
                console.log('已击败所有小boss，检查是否有大boss');
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
                console.log('没有更多小boss，检查是否有大boss');
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

                // 创建默认大boss
                Dungeon.currentRun.finalBoss = {
                    id: 'default_finalboss',
                    name: '森林守护者',
                    attribute: 'earth',
                    baseStats: {
                        hp: 1000,
                        attack: 50,
                        defense: 20,
                        maxHp: 1000
                    },
                    currentStats: {
                        hp: 1000,
                        attack: 50,
                        defense: 20,
                        maxHp: 1000
                    },
                    isBoss: true,
                    isMiniBoss: false,
                    isFinalBoss: true,
                    xpReward: 800,
                    skills: []
                };
            }

            // 获取大boss
            const finalBoss = Dungeon.currentRun.finalBoss;
            if (!finalBoss) {
                console.log('无法创建大boss，完成地下城');
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
                    console.log('战斗日志:', message);
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
            this.addBattleLog(`开始与 ${monster.name} 战斗...`, isBoss ? 'danger' : 'warning');
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
        if (!this.isRunning || !Dungeon.currentRun) {
            console.warn('地下城运行器未运行或当前运行数据不存在');
            return;
        }

        try {
            // 检查结果对象是否有效
            if (!result || typeof result !== 'object') {
                console.error('无效的战斗结果:', result);
                this.addBattleLog('无效的战斗结果，地下城探索中断', 'error');
                this.isRunning = false;
                return;
            }

            // 确保result.monster存在
            if (!result.monster) {
                result.monster = { name: '未知怪物' };
            }

            // 检查战斗结果
            const isVictory = result.success || result.victory;

            if (isVictory) {
                // 战斗胜利
                if (isBoss) {
                    if (isFinalBoss) {
                        // 击败最终boss
                        this.addBattleLog(`击败了大BOSS ${result.monster.name}！`, 'success');

                        // 延迟一段时间后完成地下城
                        setTimeout(() => {
                            this.completeDungeon();
                        }, this.logDisplaySpeed);
                    } else {
                        // 击败小boss
                        this.addBattleLog(`击败了小BOSS ${result.monster.name}！`, 'success');

                        // 增加已击败的小boss数量
                        Dungeon.currentRun.defeatedMiniBosses++;

                        // 更新地下城进度
                        const totalMonsters = Dungeon.currentRun.monsters.length || 0;
                        const totalMiniBosses = Dungeon.currentRun.miniBosses.length || 0;
                        const progress = ((Dungeon.currentRun.currentMonsterIndex + Dungeon.currentRun.defeatedMiniBosses) /
                                         Math.max(1, totalMonsters + totalMiniBosses)) * 80; // 小boss占80%进度

                        this.updateDungeonProgress(progress);

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
                    // 击败普通怪物
                    this.addBattleLog(`击败了 ${result.monster.name}！`, 'success');

                    // 增加当前怪物索引
                    Dungeon.currentRun.currentMonsterIndex++;

                    // 更新地下城进度
                    const totalMonsters = Dungeon.currentRun.monsters.length || 1;
                    const totalMiniBosses = Dungeon.currentRun.miniBosses.length || 0;
                    const progress = (Dungeon.currentRun.currentMonsterIndex / totalMonsters) *
                                     (50 / Math.max(1, totalMonsters + totalMiniBosses + 1)); // 普通怪物占50%进度

                    this.updateDungeonProgress(progress);

                    // 延迟一段时间后处理下一个怪物
                    setTimeout(() => {
                        this.processNextMonster();
                    }, this.logDisplaySpeed);
                }
            } else {
                // 战斗失败
                this.addBattleLog(`队伍被 ${result.monster.name} 击败了...`, 'danger');

                // 结束地下城运行
                this.isRunning = false;

                // 添加失败信息
                this.addBattleLog('地下城挑战失败！', 'danger');

                // 更新地下城进度
                this.updateDungeonProgress(0);

                // 重置地下城运行
                Dungeon.currentRun = null;

                // 更新地下城信息显示
                if (typeof MainUI !== 'undefined') {
                    MainUI.updateCurrentDungeon();
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

            // 处理奖励
            let totalGold = 0;
            let totalExp = 0;

            if (Dungeon.currentRun.rewards && Array.isArray(Dungeon.currentRun.rewards)) {
                Dungeon.currentRun.rewards.forEach(reward => {
                    if (reward) {
                        totalGold += reward.gold || 0;
                        totalExp += reward.exp || 0;
                    }
                });
            }

            // 添加奖励日志
            this.addBattleLog(`获得了 ${totalGold} 金币和 ${totalExp} 经验值！`, 'success');

            // 更新地下城进度
            this.updateDungeonProgress(100);

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
                MainUI.updateCurrentDungeon();
            }
        } catch (error) {
            console.error('完成地下城时出错:', error);
            this.addBattleLog('完成地下城时出错', 'danger');
            this.isRunning = false;

            // 更新地下城信息显示
            if (typeof MainUI !== 'undefined') {
                MainUI.updateCurrentDungeon();
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

        // 发出事件
        if (typeof Events !== 'undefined') {
            Events.emit('battle:log', { message, type });
        }

        // 更新战斗日志显示
        if (typeof MainUI !== 'undefined') {
            MainUI.updateBattleLog();
        }
    },

    /**
     * 更新地下城进度
     * @param {number} progress - 进度百分比 (0-100)
     */
    updateDungeonProgress(progress) {
        if (!Dungeon.currentRun) {
            return;
        }

        // 更新进度
        Dungeon.currentRun.progress = Math.min(100, Math.max(0, progress));

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
     * 暂停地下城探索
     */
    pauseExploration() {
        if (!this.isRunning) {
            console.warn('地下城探索已经暂停');
            return;
        }

        this.isRunning = false;
        this.isPaused = true;

        this.addBattleLog('地下城探索已暂停', 'info');

        // 发出事件
        if (typeof Events !== 'undefined') {
            Events.emit('dungeon:paused');
        }

        // 更新地下城信息显示
        if (typeof MainUI !== 'undefined') {
            MainUI.updateCurrentDungeon();
        }
    },

    /**
     * 继续地下城探索
     */
    resumeExploration() {
        if (this.isRunning) {
            console.warn('地下城探索已在运行中');
            return;
        }

        if (!this.isPaused) {
            console.warn('地下城探索未暂停，无法继续');
            return;
        }

        this.isRunning = true;
        this.isPaused = false;

        this.addBattleLog('地下城探索继续进行', 'info');

        // 发出事件
        if (typeof Events !== 'undefined') {
            Events.emit('dungeon:resumed');
        }

        // 更新地下城信息显示
        if (typeof MainUI !== 'undefined') {
            MainUI.updateCurrentDungeon();
        }

        // 继续处理下一个怪物
        setTimeout(() => {
            this.processNextMonster();
        }, this.logDisplaySpeed);
    },

    /**
     * 退出地下城
     */
    exitDungeon() {
        if (!Dungeon.currentRun) {
            console.warn('没有正在进行的地下城探索');
            return;
        }

        this.isRunning = false;
        this.isPaused = false;

        this.addBattleLog('退出地下城探索', 'warning');

        // 恢复队伍成员的地下城原始属性
        const team = Game.getActiveTeam();
        if (team && team.members) {
            const teamMembers = team.members.map(id => Character.getCharacter(id)).filter(char => char);

            for (const member of teamMembers) {
                if (member.dungeonOriginalStats) {
                    console.log(`退出地下城，恢复 ${member.name} 的地下城原始属性`);
                    member.currentStats = JSON.parse(JSON.stringify(member.dungeonOriginalStats));

                    // 清除地下城原始属性
                    delete member.dungeonOriginalStats;

                    // 清除地下城已应用的被动技能记录
                    if (member.dungeonAppliedPassives) {
                        delete member.dungeonAppliedPassives;
                        console.log(`清除 ${member.name} 的地下城已应用被动技能记录`);
                    }

                    // 清除所有BUFF
                    if (typeof BuffSystem !== 'undefined') {
                        BuffSystem.clearAllBuffs(member);
                    } else {
                        member.buffs = [];
                    }
                }
            }
        }

        // 重置地下城运行
        Dungeon.currentRun = null;

        // 发出事件
        if (typeof Events !== 'undefined') {
            Events.emit('dungeon:exited');
        }

        // 更新地下城信息显示
        if (typeof MainUI !== 'undefined') {
            MainUI.updateCurrentDungeon();
        }
    }
};
