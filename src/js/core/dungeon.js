/**
 * 地下城管理系统 - 负责游戏中地下城的管理
 */
const Dungeon = {
    // 地下城数据
    dungeons: {},

    // 当前运行的地下城数据
    currentRun: {
        dungeonId: null,
        progress: 0,
        monsters: [],
        miniBosses: [],
        finalBoss: null,
        defeatedMiniBosses: 0,
        currentMonsterIndex: 0,
        rewards: [],
        isCompleted: false,
        finalBossAppeared: false
    },

    // 地下城类型定义
    types: {
        normal: {
            name: '普通',
            description: '普通的地下城，有小boss和大boss',
            monsterCount: { min: 10, max: 20 },
            monsterMultiplier: {
                hp: 1.0,
                atk: 1.0,
                def: 1.0
            },
            rewardMultiplier: 1.0
        },
        elite: {
            name: '精英',
            description: '较难的地下城，有更好的奖励',
            monsterCount: { min: 30, max: 50},
            monsterMultiplier: {
                hp: 2.0,
                atk: 2.0,
                def: 2.0
            },
            rewardMultiplier: 1.5
        },
        boss: {
            name: '噩梦',
            description: '挑战强大的Boss，获得丰厚奖励',
            monsterCount: { min: 1, max: 1 },
            monsterMultiplier: {
                hp: 3.0,
                atk: 3.0,
                def: 3.0
            },
            rewardMultiplier: 2.0
        }
    },

    // 宝箱类型定义
    chestTypes: {
        silver: {
            name: '银宝箱',
            description: '普通宝箱，可能包含基础装备和材料',
            dropRate: 1.0
        },
        gold: {
            name: '金宝箱',
            description: '高级宝箱，可能包含稀有装备和材料',
            dropRate: 1.0
        },
        red: {
            name: '红宝箱',
            description: '史诗宝箱，可能包含传说装备和材料',
            dropRate: 1.0
        },
        rainbow: {
            name: '彩虹宝箱',
            description: '稀有宝箱，必定包含传说装备和材料',
            dropRate: 0.0005 // 0.05% for miniBoss, 0.02 for finalBoss
        }
    },

    // 地下城定义
    definitions: {
        dungeon1: {
            id: 'dungeon1',
            name: '森林洞穴',
            description: '一个位于森林中的神秘洞穴，有许多低级怪物盘踞。',
            type: 'normal',
            miniBossCount: 2,
            possibleMonsters: ['剧毒史莱姆', '暗影哥布林', '月影狼王', '岩石巨像', '深渊食人魔'],
            possibleMiniBosses: ['森林守护者', '山岳之王'],
            possibleFinalBosses: ['大地泰坦'],
            rewards: {
                gold: 5000,
                exp: 2000,
                weapons: ['surturFlame', 'surturSword']
            }
        },
        dungeon2: {
            id: 'dungeon2',
            name: '废弃矿井',
            description: '一个废弃的矿井，现在被各种怪物占据。',
            type: 'normal',
            miniBossCount: 3,
            possibleMonsters: ['暗影哥布林', '岩石巨像', '深渊食人魔', '熔岩巨魔', '冰霜巨魔'],
            possibleMiniBosses: ['晶石巨像', '沙海巨虫'],
            possibleFinalBosses: ['岩龙'],
            rewards: {
                gold: 5000,
                exp: 5000,
                weapons: ['gonggongTouch', 'gonggongPillar']
            }
        },
        dungeon3: {
            id: 'dungeon3',
            name: '古代遗迹',
            description: '一座古老文明的遗迹，有强大的守卫和珍贵的宝藏。',
            type: 'elite',
            miniBossCount: 4,
            possibleMonsters: ['岩石巨像', '深渊食人魔', '熔岩巨魔', '冰霜巨魔', '风暴巨魔'],
            possibleMiniBosses: ['暗影幻影', '死亡骑士'],
            possibleFinalBosses: ['暗影魔龙'],
            rewards: {
                gold: 10000,
                exp: 10000,
                weapons: ['dagdaBreath', 'dagdaHorn']
            }
        }
    },

    // 怪物定义
    monsters: {
    },

    bosses:{

    },

    /**
     * 初始化地下城系统
     */
    init() {
        // 复制地下城定义到地下城数据
        for (const [id, definition] of Object.entries(this.definitions)) {
            this.dungeons[id] = {...definition};
        }

        console.log('地下城系统已初始化');
    },

    /**
     * 获取地下城
     * @param {string} dungeonId - 地下城ID
     * @returns {object|null} 地下城对象
     */
    getDungeon(dungeonId) {
        return this.dungeons[dungeonId] || null;
    },

    /**
     * 获取所有地下城
     * @returns {object} 所有地下城对象
     */
    getAllDungeons() {
        return this.dungeons;
    },

    /**
     * 获取可用地下城
     * @returns {array} 可用地下城数组
     */
    getAvailableDungeons() {
        const playerLevel = Game.state.playerLevel;
        const unlockedDungeons = Game.state.progress.unlockedDungeons;

        return Object.values(this.dungeons).filter(dungeon => {
            return unlockedDungeons.includes(dungeon.id) &&
                   playerLevel >= dungeon.minLevel;
        });
    },

    /**
     * 初始化地下城运行
     * @param {string} dungeonId - 地下城ID
     * @returns {boolean} 是否成功初始化
     */
    initDungeonRun(dungeonId) {
        const dungeon = this.getDungeon(dungeonId);
        if (!dungeon) return false;

        const dungeonType = this.types[dungeon.type] || this.types.normal;

        // 确定普通怪物数量
        const monsterCount = Math.floor(Math.random() *
            (dungeonType.monsterCount.max - dungeonType.monsterCount.min + 1)) +
            dungeonType.monsterCount.min;

        // 生成普通怪物
        const monsters = [];
        for (let i = 0; i < monsterCount; i++) {
            const monster = this.generateMonster(dungeon);
            if (monster) {
                monsters.push(monster);
            }
        }

        // 生成小boss
        const miniBosses = [];
        const miniBossCount = dungeon.miniBossCount || 2; // 默认至少2个小boss

        // 确保生成指定数量的小boss
        for (let i = 0; i < miniBossCount; i++) {
            const miniBoss = this.generateBoss(dungeon, 'mini');
            if (miniBoss) {
                miniBosses.push(miniBoss);
            }
        }

        // 生成大boss（但不立即出现）
        const finalBoss = this.generateBoss(dungeon, 'final');

        // 初始化运行数据
        this.currentRun = {
            dungeonId: dungeonId,
            progress: 0,
            monsters: monsters,
            miniBosses: miniBosses,
            finalBoss: finalBoss,
            defeatedMiniBosses: 0,
            currentMonsterIndex: 0,
            rewards: [],
            isCompleted: false,
            finalBossAppeared: false
        };

        console.log(`初始化地下城运行: ${dungeon.name}，普通怪物: ${monsters.length}, 小boss: ${miniBosses.length}`);
        return true;
    },

    /**
     * 生成普通怪物
     * @param {object} dungeon - 地下城对象
     * @returns {object} 怪物对象
     */
    generateMonster(dungeon) {
        const monsterPool = dungeon.possibleMonsters;
        if (!monsterPool || monsterPool.length === 0) return null;

        // 随机选择怪物类型
        const monsterType = monsterPool[Math.floor(Math.random() * monsterPool.length)];
        const monsterTemplate = this.monsters[monsterType];
        if (!monsterTemplate) return null;

        // 获取地下城类型
        const dungeonType = this.types[dungeon.type] || this.types.normal;
        const multiplier = dungeonType.monsterMultiplier;

        // 计算怪物属性
        const stats = {
            hp: Math.floor(monsterTemplate.hp * multiplier.hp),
            atk: Math.floor(monsterTemplate.atk * multiplier.atk),
            def: Math.floor(monsterTemplate.def * multiplier.def)
        };

        // 创建怪物实例
        const monster = {
            id: `${monsterType}_${Date.now()}`,
            name: monsterTemplate.name,
            attribute: monsterTemplate.attribute,
            stats: stats,
            isBoss: false,
            isMiniBoss: false,
            isFinalBoss: false,
            xpReward: Math.floor(monsterTemplate.xpReward * dungeonType.rewardMultiplier)
        };

        return monster;
    },

    /**
     * 生成Boss怪物
     * @param {object} dungeon - 地下城对象
     * @param {string} bossType - Boss类型 ('mini' 或 'final')
     * @returns {object} Boss怪物对象
     */
    generateBoss(dungeon, bossType = 'mini') {
        const bossPool = bossType === 'mini' ? dungeon.possibleMiniBosses : dungeon.possibleFinalBosses;
        if (!bossPool || bossPool.length === 0) return null;

        // 随机选择Boss类型
        const bossMonsterType = bossPool[Math.floor(Math.random() * bossPool.length)];
        const bossTemplate = this.monsters[bossMonsterType];
        if (!bossTemplate) return null;

        // 获取地下城类型
        const dungeonType = this.types[dungeon.type] || this.types.normal;
        const multiplier = dungeonType.monsterMultiplier;

        // 计算Boss属性
        const stats = {
            hp: Math.floor(bossTemplate.hp * multiplier.hp),
            atk: Math.floor(bossTemplate.atk * multiplier.atk),
            def: Math.floor(bossTemplate.def * multiplier.def)
        };

        // 创建Boss实例
        const boss = {
            id: `${bossMonsterType}_${Date.now()}`,
            name: bossTemplate.name,
            attribute: bossTemplate.attribute,
            stats: stats,
            skills: bossTemplate.skills,
            isBoss: true,
            isMiniBoss: bossType === 'mini',
            isFinalBoss: bossType === 'final',
            xpReward: Math.floor(bossTemplate.xpReward * dungeonType.rewardMultiplier)
        };

        return boss;
    },

    /**
     * 获取当前怪物
     * @returns {object|null} 当前怪物对象
     */
    getCurrentMonster() {
        // 如果大boss已经出现，返回大boss
        if (this.currentRun.finalBossAppeared && this.currentRun.finalBoss) {
            return this.currentRun.finalBoss;
        }

        // 如果还有小boss未击败，优先返回小boss
        if (this.currentRun.miniBosses.length > 0 &&
            this.currentRun.defeatedMiniBosses < this.currentRun.miniBosses.length) {
            return this.currentRun.miniBosses[this.currentRun.defeatedMiniBosses];
        }

        // 如果所有小boss已击败，但大boss还未出现，则让大boss出现
        if (this.currentRun.miniBosses.length > 0 &&
            this.currentRun.defeatedMiniBosses >= this.currentRun.miniBosses.length &&
            !this.currentRun.finalBossAppeared &&
            this.currentRun.finalBoss) {
            this.currentRun.finalBossAppeared = true;
            return this.currentRun.finalBoss;
        }

        // 如果没有boss或所有boss已击败，返回普通怪物
        if (this.currentRun.currentMonsterIndex < this.currentRun.monsters.length) {
            return this.currentRun.monsters[this.currentRun.currentMonsterIndex];
        }

        return null;
    },

    /**
     * 进行战斗
     * @returns {object} 战斗结果
     */
    battle() {
        const monster = this.getCurrentMonster();
        if (!monster) return { success: false, message: '没有可战斗的怪物' };

        // 获取当前活动队伍
        let team;
        if (typeof Game.getActiveTeam === 'function') {
            team = Game.getActiveTeam();
        } else if (Game.activeTeam) {
            team = Game.activeTeam;
        }
        if (!team) return { success: false, message: '没有活动队伍' };

        // 交由战斗系统处理
        const result = Battle.startBattle(team, monster);

        // 处理战斗结果
        if (result.victory) {
            // 增加统计
            Game.stats.battlesWon++;

            if (monster.isBoss) {
                Game.stats.bossesDefeated++;

                // 如果是小boss，增加已击败小boss计数
                if (monster.isMiniBoss) {
                    this.currentRun.defeatedMiniBosses++;
                }

                // 如果是大boss，完成地下城
                if (monster.isFinalBoss) {
                    return this.completeDungeon();
                }
            } else {
                Game.stats.monstersDefeated++;
                // 如果是普通怪物，增加怪物索引
                this.currentRun.currentMonsterIndex++;
            }

            // 处理奖励
            this.processRewards(monster);

            // 检查是否所有普通怪物和小boss都已击败，但大boss还未出现
            if (this.currentRun.currentMonsterIndex >= this.currentRun.monsters.length &&
                this.currentRun.defeatedMiniBosses >= this.currentRun.miniBosses.length &&
                !this.currentRun.finalBossAppeared &&
                this.currentRun.finalBoss) {
                this.currentRun.finalBossAppeared = true;
                result.message += '\n所有小boss已击败！大boss出现了！';
            }

            // 检查是否没有更多怪物可战斗
            if (this.currentRun.currentMonsterIndex >= this.currentRun.monsters.length &&
                this.currentRun.defeatedMiniBosses >= this.currentRun.miniBosses.length &&
                (this.currentRun.finalBossAppeared || !this.currentRun.finalBoss)) {
                return this.completeDungeon();
            }
        } else {
            // 增加统计
            Game.stats.battlesLost++;
        }

        return result;
    },

    /**
     * 处理怪物奖励
     * @param {object} monster - 怪物对象
     */
    processRewards(monster) {
        // 添加经验值
        Game.addPlayerExp(monster.xpReward);

        // 给队伍中的每个角色添加经验
        let team;
        if (typeof Game.getActiveTeam === 'function') {
            team = Game.getActiveTeam();
        } else if (Game.activeTeam) {
            team = Game.activeTeam;
        }
        if (team) {
            team.members.forEach(characterId => {
                Character.addExperience(characterId, monster.xpReward);
            });
        }

        // 处理宝箱掉落
        if (monster.isBoss) {
            if (monster.isMiniBoss) {
                // 小boss掉落
                const silverCount = Math.floor(Math.random() * 3) + 1;
                const goldCount = Math.floor(Math.random() * 3) + 1;
                
                // 掉落银宝箱
                for (let i = 0; i < silverCount; i++) {
                    this.currentRun.rewards.push({ type: 'chest', id: 'silver' });
                }
                
                // 掉落金宝箱
                for (let i = 0; i < goldCount; i++) {
                    this.currentRun.rewards.push({ type: 'chest', id: 'gold' });
                }
                
                // 0.05%概率掉落彩虹宝箱
                if (Math.random() < 0.0005) {
                    this.currentRun.rewards.push({ type: 'chest', id: 'rainbow' });
                }
            } else if (monster.isFinalBoss) {
                // 最终boss掉落
                const goldCount = Math.floor(Math.random() * 3) + 1;
                const redCount = Math.floor(Math.random() * 3) + 1;
                
                // 掉落金宝箱
                for (let i = 0; i < goldCount; i++) {
                    this.currentRun.rewards.push({ type: 'chest', id: 'gold' });
                }
                
                // 掉落红宝箱
                for (let i = 0; i < redCount; i++) {
                    this.currentRun.rewards.push({ type: 'chest', id: 'red' });
                }
                
                // 2%概率掉落彩虹宝箱
                if (Math.random() < 0.02) {
                    this.currentRun.rewards.push({ type: 'chest', id: 'rainbow' });
                }
            }
        } else {
            // 普通怪物掉落一个银宝箱
            this.currentRun.rewards.push({ type: 'chest', id: 'silver' });
        }

        console.log(`处理怪物奖励: 经验 ${monster.xpReward}`);
    },

    /**
     * 完成地下城
     * @returns {object} 完成结果
     */
    completeDungeon() {
        const dungeonId = this.currentRun.dungeonId;
        const dungeon = this.getDungeon(dungeonId);

        if (!dungeon) return { success: false, message: '地下城不存在' };

        // 检查是否击败了大boss
        const finalBossDefeated = this.currentRun.finalBoss && this.currentRun.finalBossAppeared;

        // 只有击败大boss才算真正完成地下城
        if (finalBossDefeated) {
            // 标记为已完成
            this.currentRun.isCompleted = true;

            // 检查是否是第一次完成
            const isFirstCompletion = !Game.state.progress.completedDungeons.includes(dungeonId);
            
            // 如果是第一次完成，给予金币奖励
            if (isFirstCompletion) {
                Game.addGold(dungeon.rewards.gold);
            }

            // 添加到已完成地下城列表
            if (!Game.state.progress.completedDungeons.includes(dungeonId)) {
                Game.state.progress.completedDungeons.push(dungeonId);
            }

            // 增加地下城完成统计
            if (!Game.stats.dungeonCompletions[dungeonId]) {
                Game.stats.dungeonCompletions[dungeonId] = 0;
            }
            Game.stats.dungeonCompletions[dungeonId]++;

            // 检查是否解锁新地下城
            this.checkDungeonUnlocks();

            // 整合所有奖励
            const rewards = this.currentRun.rewards;

            console.log(`地下城 ${dungeon.name} 已完成！大boss已击败！`);

            return {
                success: true,
                victory: true,
                message: `恭喜！您已击败大boss并完成地下城 ${dungeon.name}`,
                rewards: rewards,
                dungeonCompleted: true,
                isFirstCompletion: isFirstCompletion
            };
        } else {
            // 如果没有击败大boss，但没有更多怪物可战斗
            console.log(`地下城 ${dungeon.name} 探索结束，但未击败大boss`);

            return {
                success: true,
                victory: false,
                message: `地下城探索结束，但您未能击败大boss。请再次尝试！`,
                rewards: this.currentRun.rewards,
                dungeonCompleted: false
            };
        }
    },

    /**
     * 检查是否解锁新地下城
     */
    checkDungeonUnlocks() {
        // 根据玩家等级和已完成的地下城来解锁新的地下城
        const playerLevel = Game.state.playerLevel;
        const completedDungeons = Game.state.progress.completedDungeons;

        // 例如：完成dungeon1并且等级达到5级时解锁dungeon2
        if (completedDungeons.includes('dungeon1') && playerLevel >= 5 &&
            !Game.state.progress.unlockedDungeons.includes('dungeon2')) {

            Game.state.progress.unlockedDungeons.push('dungeon2');
            UI.showNotification('新地下城已解锁：废弃矿井');
        }

        // 例如：完成dungeon2并且等级达到10级时解锁dungeon3
        if (completedDungeons.includes('dungeon2') && playerLevel >= 10 &&
            !Game.state.progress.unlockedDungeons.includes('dungeon3')) {

            Game.state.progress.unlockedDungeons.push('dungeon3');
            UI.showNotification('新地下城已解锁：古代遗迹');
        }

        // 例如：完成dungeon3并且等级达到20级时解锁bossRaid1
        if (completedDungeons.includes('dungeon3') && playerLevel >= 20 &&
            !Game.state.progress.unlockedDungeons.includes('bossRaid1')) {

            Game.state.progress.unlockedDungeons.push('bossRaid1');
            UI.showNotification('新地下城已解锁：龙之巢穴');
        }
    },

    /**
     * 重置地下城系统
     */
    reset() {
        // 重置地下城数据和当前运行
        this.dungeons = {};
        this.currentRun = {
            dungeonId: null,
            progress: 0,
            monsters: [],
            miniBosses: [],
            finalBoss: null,
            defeatedMiniBosses: 0,
            currentMonsterIndex: 0,
            rewards: [],
            isCompleted: false,
            finalBossAppeared: false
        };

        this.init();
    }
};