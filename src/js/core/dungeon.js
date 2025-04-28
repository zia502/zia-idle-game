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
            monsterCount: { min: 3, max: 5 },
            rewardMultiplier: 1.0
        },
        elite: {
            name: '精英',
            description: '较难的地下城，有更好的奖励',
            monsterCount: { min: 5, max: 8 },
            rewardMultiplier: 1.5
        },
        boss: {
            name: 'Boss',
            description: '挑战强大的Boss，获得丰厚奖励',
            monsterCount: { min: 1, max: 3 },
            rewardMultiplier: 2.0
        }
    },

    // 地下城定义
    definitions: {
        dungeon1: {
            id: 'dungeon1',
            name: '森林洞穴',
            description: '一个位于森林中的神秘洞穴，有许多低级怪物盘踞。',
            type: 'normal',
            minLevel: 1,
            maxLevel: 10,
            miniBossCount: 2,  // 小boss数量
            possibleMonsters: ['slime', 'wolf', 'goblin'],
            possibleMiniBosses: ['goblinChief'],  // 小boss池
            possibleFinalBosses: ['skeletonKing'],  // 大boss池
            rewards: {
                gold: { min: 50, max: 100 },
                exp: { min: 20, max: 40 },
                items: [
                    { id: 'smallPotion', chance: 0.7 },
                    { id: 'woodMaterial', chance: 0.5 }
                ],
                weapons: { chance: 0.3, rarities: ['common', 'uncommon'] }
            }
        },
        dungeon2: {
            id: 'dungeon2',
            name: '废弃矿井',
            description: '一个废弃的矿井，现在被各种怪物占据。',
            type: 'normal',
            minLevel: 5,
            maxLevel: 15,
            miniBossCount: 3,  // 小boss数量
            possibleMonsters: ['goblin', 'skeleton', 'bat'],
            possibleMiniBosses: ['goblinChief', 'miner'],  // 小boss池
            possibleFinalBosses: ['skeletonKing'],  // 大boss池
            rewards: {
                gold: { min: 100, max: 200 },
                exp: { min: 40, max: 80 },
                items: [
                    { id: 'potion', chance: 0.6 },
                    { id: 'stoneMaterial', chance: 0.5 },
                    { id: 'ironOre', chance: 0.4 }
                ],
                weapons: { chance: 0.4, rarities: ['common', 'uncommon', 'rare'] }
            }
        },
        dungeon3: {
            id: 'dungeon3',
            name: '古代遗迹',
            description: '一座古老文明的遗迹，有强大的守卫和珍贵的宝藏。',
            type: 'elite',
            minLevel: 10,
            maxLevel: 25,
            miniBossCount: 4,  // 小boss数量
            possibleMonsters: ['skeleton', 'mummy', 'ghost'],
            possibleMiniBosses: ['ancientGuardian', 'miner'],  // 小boss池
            possibleFinalBosses: ['pharaoh'],  // 大boss池
            rewards: {
                gold: { min: 200, max: 400 },
                exp: { min: 80, max: 150 },
                items: [
                    { id: 'greatPotion', chance: 0.5 },
                    { id: 'ancientRelic', chance: 0.4 },
                    { id: 'magicDust', chance: 0.3 }
                ],
                weapons: { chance: 0.5, rarities: ['uncommon', 'rare', 'epic'] }
            }
        },
        bossRaid1: {
            id: 'bossRaid1',
            name: '龙之巢穴',
            description: '一个强大的龙盘踞的洞穴，击败它获得丰厚奖励。',
            type: 'boss',
            minLevel: 20,
            maxLevel: 30,
            miniBossCount: 5,  // 小boss数量
            possibleMonsters: ['dragonling', 'dragonServant'],
            possibleMiniBosses: ['ancientGuardian', 'pharaoh'],  // 小boss池
            possibleFinalBosses: ['dragonLord'],  // 大boss池
            rewards: {
                gold: { min: 500, max: 1000 },
                exp: { min: 200, max: 300 },
                items: [
                    { id: 'dragonScale', chance: 0.8 },
                    { id: 'dragonBlood', chance: 0.6 },
                    { id: 'legendaryCore', chance: 0.3 }
                ],
                weapons: { chance: 0.7, rarities: ['rare', 'epic', 'legendary'] }
            }
        }
    },

    // 怪物定义
    monsters: {
        // 普通怪物
        slime: {
            name: '史莱姆',
            type: 'normal',
            baseStats: { hp: 30, attack: 5, defense: 2, speed: 3 },
            attribute: 'water',
            xpReward: 10,
            goldReward: { min: 5, max: 10 }
        },
        goblin: {
            name: '哥布林',
            type: 'normal',
            baseStats: { hp: 45, attack: 8, defense: 3, speed: 6 },
            attribute: 'earth',
            xpReward: 15,
            goldReward: { min: 8, max: 15 }
        },
        wolf: {
            name: '狼',
            type: 'normal',
            baseStats: { hp: 40, attack: 10, defense: 2, speed: 8 },
            attribute: 'wind',
            xpReward: 12,
            goldReward: { min: 7, max: 12 }
        },
        skeleton: {
            name: '骷髅',
            type: 'normal',
            baseStats: { hp: 55, attack: 12, defense: 5, speed: 4 },
            attribute: 'dark',
            xpReward: 18,
            goldReward: { min: 10, max: 18 }
        },
        bat: {
            name: '蝙蝠',
            type: 'normal',
            baseStats: { hp: 35, attack: 7, defense: 2, speed: 10 },
            attribute: 'wind',
            xpReward: 13,
            goldReward: { min: 6, max: 12 }
        },
        mummy: {
            name: '木乃伊',
            type: 'normal',
            baseStats: { hp: 70, attack: 14, defense: 8, speed: 3 },
            attribute: 'earth',
            xpReward: 22,
            goldReward: { min: 12, max: 20 }
        },
        ghost: {
            name: '幽灵',
            type: 'normal',
            baseStats: { hp: 50, attack: 15, defense: 4, speed: 7 },
            attribute: 'dark',
            xpReward: 20,
            goldReward: { min: 10, max: 18 }
        },
        dragonling: {
            name: '小龙',
            type: 'normal',
            baseStats: { hp: 80, attack: 18, defense: 10, speed: 8 },
            attribute: 'fire',
            xpReward: 30,
            goldReward: { min: 15, max: 25 }
        },
        dragonServant: {
            name: '龙仆',
            type: 'normal',
            baseStats: { hp: 100, attack: 22, defense: 12, speed: 6 },
            attribute: 'dark',
            xpReward: 35,
            goldReward: { min: 18, max: 30 }
        },

        // Boss怪物
        goblinChief: {
            name: '哥布林酋长',
            type: 'boss',
            baseStats: { hp: 120, attack: 15, defense: 8, speed: 7 },
            attribute: 'earth',
            xpReward: 50,
            goldReward: { min: 30, max: 50 },
            dropItems: [
                { id: 'goblinTooth', chance: 0.5 },
                { id: 'leatherScraps', chance: 0.7 }
            ],
            dropWeapons: { chance: 0.4, rarities: ['common', 'uncommon'] }
        },
        skeletonKing: {
            name: '骷髅王',
            type: 'boss',
            baseStats: { hp: 180, attack: 22, defense: 12, speed: 5 },
            attribute: 'dark',
            xpReward: 70,
            goldReward: { min: 40, max: 70 },
            dropItems: [
                { id: 'skeletonBone', chance: 0.6 },
                { id: 'darkEssence', chance: 0.4 }
            ],
            dropWeapons: { chance: 0.5, rarities: ['uncommon', 'rare'] }
        },
        miner: {
            name: '疯狂矿工',
            type: 'boss',
            baseStats: { hp: 150, attack: 18, defense: 15, speed: 4 },
            attribute: 'earth',
            xpReward: 60,
            goldReward: { min: 35, max: 60 },
            dropItems: [
                { id: 'miningPick', chance: 0.5 },
                { id: 'gemstone', chance: 0.4 }
            ],
            dropWeapons: { chance: 0.45, rarities: ['uncommon', 'rare'] }
        },
        ancientGuardian: {
            name: '远古守卫',
            type: 'boss',
            baseStats: { hp: 250, attack: 28, defense: 20, speed: 6 },
            attribute: 'light',
            xpReward: 100,
            goldReward: { min: 60, max: 100 },
            dropItems: [
                { id: 'guardianCore', chance: 0.5 },
                { id: 'ancientStone', chance: 0.6 }
            ],
            dropWeapons: { chance: 0.6, rarities: ['rare', 'epic'] }
        },
        pharaoh: {
            name: '法老',
            type: 'boss',
            baseStats: { hp: 300, attack: 35, defense: 25, speed: 7 },
            attribute: 'dark',
            xpReward: 120,
            goldReward: { min: 80, max: 150 },
            dropItems: [
                { id: 'pharaohMask', chance: 0.4 },
                { id: 'cursedGem', chance: 0.5 }
            ],
            dropWeapons: { chance: 0.7, rarities: ['rare', 'epic'] }
        },
        dragonLord: {
            name: '龙王',
            type: 'boss',
            baseStats: { hp: 500, attack: 50, defense: 40, speed: 8 },
            attribute: 'fire',
            xpReward: 200,
            goldReward: { min: 150, max: 300 },
            dropItems: [
                { id: 'dragonHeart', chance: 0.6 },
                { id: 'dragonScales', chance: 0.8 },
                { id: 'legendaryCore', chance: 0.3 }
            ],
            dropWeapons: { chance: 0.8, rarities: ['epic', 'legendary'] }
        }
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

        // 计算怪物等级
        const levelRange = dungeon.maxLevel - dungeon.minLevel;
        const level = dungeon.minLevel + Math.floor(Math.random() * (levelRange + 1));

        // 计算怪物属性
        const stats = {};
        for (const [stat, value] of Object.entries(monsterTemplate.baseStats)) {
            // 基础值 * (1 + 等级系数)
            stats[stat] = Math.floor(value * (1 + (level - 1) * 0.1));
        }

        // 创建怪物实例
        const monster = {
            id: `${monsterType}_${Date.now()}`,
            name: monsterTemplate.name,
            type: monsterTemplate.type,
            attribute: monsterTemplate.attribute,
            level: level,
            baseStats: {...monsterTemplate.baseStats},
            currentStats: {...stats},
            isBoss: false,
            isMiniBoss: false,
            isFinalBoss: false,
            xpReward: Math.floor(monsterTemplate.xpReward * (1 + (level - 1) * 0.1)),
            goldReward: {
                min: Math.floor(monsterTemplate.goldReward.min * (1 + (level - 1) * 0.1)),
                max: Math.floor(monsterTemplate.goldReward.max * (1 + (level - 1) * 0.1))
            },
            dropItems: monsterTemplate.dropItems,
            dropWeapons: monsterTemplate.dropWeapons
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

        // 计算Boss等级，大boss比小boss高几级
        const levelRange = dungeon.maxLevel - dungeon.minLevel;
        const levelBonus = bossType === 'final' ? 5 : 2;
        const level = dungeon.minLevel + Math.floor(Math.random() * (levelRange + 1)) + levelBonus;

        // 计算Boss属性
        const stats = {};
        for (const [stat, value] of Object.entries(bossTemplate.baseStats)) {
            // 基础值 * (1 + 等级系数) * boss加成
            const bossMultiplier = bossType === 'final' ? 1.5 : 1.2;
            stats[stat] = Math.floor(value * (1 + (level - 1) * 0.1) * bossMultiplier);
        }

        // 创建Boss实例
        const boss = {
            id: `${bossMonsterType}_${Date.now()}`,
            name: bossTemplate.name,
            type: bossTemplate.type,
            attribute: bossTemplate.attribute,
            level: level,
            baseStats: {...bossTemplate.baseStats},
            currentStats: {...stats},
            isBoss: true,
            isMiniBoss: bossType === 'mini',
            isFinalBoss: bossType === 'final',
            xpReward: Math.floor(bossTemplate.xpReward * (1 + (level - 1) * 0.1) * (bossType === 'final' ? 2.0 : 1.5)),
            goldReward: {
                min: Math.floor(bossTemplate.goldReward.min * (1 + (level - 1) * 0.1) * (bossType === 'final' ? 2.0 : 1.5)),
                max: Math.floor(bossTemplate.goldReward.max * (1 + (level - 1) * 0.1) * (bossType === 'final' ? 2.0 : 1.5))
            },
            dropItems: bossTemplate.dropItems,
            dropWeapons: bossTemplate.dropWeapons
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
        // 计算金币奖励
        const goldReward = Math.floor(Math.random() *
            (monster.goldReward.max - monster.goldReward.min + 1)) +
            monster.goldReward.min;

        // 添加金币
        Game.addGold(goldReward);

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

        // 处理掉落物品
        if (monster.isBoss && monster.dropItems) {
            monster.dropItems.forEach(item => {
                if (Math.random() < item.chance) {
                    Inventory.addItem(item.id, 1);
                    this.currentRun.rewards.push({ type: 'item', id: item.id, count: 1 });
                }
            });
        }

        // 处理武器掉落
        if (monster.isBoss && monster.dropWeapons && Math.random() < monster.dropWeapons.chance) {
            const rarities = monster.dropWeapons.rarities;
            const rarity = rarities[Math.floor(Math.random() * rarities.length)];

            const weaponId = Weapon.generateRandomWeapon(rarity);
            this.currentRun.rewards.push({ type: 'weapon', id: weaponId });
        }

        console.log(`处理怪物奖励: 金币 ${goldReward}, 经验 ${monster.xpReward}`);
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
                dungeonCompleted: true
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