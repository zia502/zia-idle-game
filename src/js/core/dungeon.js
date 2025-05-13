import UI from '../components/UI.js';

/**
 * 地下城管理系统 - 负责游戏中地下城的管理
 */
const Dungeon = {

    // 地下城模板
    dungeons: {
        forest_cave: {
            id: 'forest_cave',
            name: '森林洞穴',
            description: '一个位于森林中的神秘洞穴，有许多低级怪物盘踞。',
            level: 1,
            entrance: 'forest_entrance',
            nextDungeon: 'mountain_path',
            type: 'normal',
            miniBossCount: 2,
            possibleMonsters: ['slime', 'goblin', 'wolf'],
            possibleMiniBosses: ['goblinChief', 'skeletonKing'],
            possibleFinalBosses: ['forestGuardian'],
            rewards: {
                gold: 5000,
                exp: 2000
            },
            chestDrops: {
                silver: [
                    { id: 'wood', type: 'material', rate: 0.4 },
                    { id: 'stone', type: 'material', rate: 0.3 },
                    { id: 'herbs', type: 'material', rate: 0.2 },
                    { id: 'animalHide', type: 'material', rate: 0.1 }
                ],
                gold: [
                    { id: 'magicHerbs', type: 'material', rate: 0.4 },
                    { id: 'crystal', type: 'material', rate: 0.3 },
                    { id: 'beastFang', type: 'material', rate: 0.2 },
                    { id: 'forestEssence', type: 'material', rate: 0.1 }
                ]
            }
        },
        mountain_path: {
            id: 'mountain_path',
            name: '山间小径',
            description: '通往山脉深处的危险小径，盘踞着更强大的怪物。',
            level: 2,
            entrance: 'mountain_entrance',
            nextDungeon: 'ancient_ruins',
            type: 'normal',
            miniBossCount: 2,
            possibleMonsters: ['mountainGoblin', 'rockGolem', 'iceWolf'],
            possibleMiniBosses: ['mountainKing', 'iceElemental'],
            possibleFinalBosses: ['mountainTitan'],
            rewards: {
                gold: 10000,
                exp: 5000
            },
            chestDrops: {
                silver: [
                    { id: 'ironOre', type: 'material', rate: 0.4 },
                    { id: 'crystal', type: 'material', rate: 0.3 },
                    { id: 'iceCrystal', type: 'material', rate: 0.2 },
                    { id: 'mountainHerbs', type: 'material', rate: 0.1 }
                ],
                gold: [
                    { id: 'mountainCrystal', type: 'material', rate: 0.4 },
                    { id: 'iceEssence', type: 'material', rate: 0.3 },
                    { id: 'rockCore', type: 'material', rate: 0.2 },
                    { id: 'windEssence', type: 'material', rate: 0.1 }
                ]
            }
        },
        ancient_ruins: {
            id: 'ancient_ruins',
            name: '古代遗迹',
            description: '一座被遗忘的古代遗迹，隐藏着强大的魔法和危险的守护者。',
            level: 3,
            entrance: 'ruins_entrance',
            nextDungeon: null,
            type: 'normal',
            miniBossCount: 2,
            possibleMonsters: ['ancientGuardian', 'ruinWalker', 'magicConstruct'],
            possibleMiniBosses: ['ruinKeeper', 'magicMaster'],
            possibleFinalBosses: ['ancientDragon'],
            rewards: {
                gold: 20000,
                exp: 10000
            },
            chestDrops: {
                silver: [
                    { id: 'ancientStone', type: 'material', rate: 0.4 },
                    { id: 'magicCrystal', type: 'material', rate: 0.3 },
                    { id: 'ruinFragment', type: 'material', rate: 0.2 },
                    { id: 'ancientHerbs', type: 'material', rate: 0.1 }
                ],
                gold: [
                    { id: 'ancientCrystal', type: 'material', rate: 0.4 },
                    { id: 'magicEssence', type: 'material', rate: 0.3 },
                    { id: 'dragonScale', type: 'material', rate: 0.2 },
                    { id: 'ancientEssence', type: 'material', rate: 0.1 }
                ]
            }
        },
        end_of_star:{
            id: 'end_of_star',
            name: '终焉之星',
            description: '传说中的终焉之星，隐藏着强大的魔法和危险的守护者。',
            level: 10,
            entrance: 'end_of_star_entrance',
            nextDungeon: null,
            type: 'normal',
            miniBossCount: 2,
            possibleFinalBosses: ['ancientDragon'],
            rewards: {
                gold: 100000,
                exp: 300000
            },

        }
    },

    // 地下城入口
    entrances: {
        forest_entrance: {
            id: 'forest_entrance',
            name: '森林入口',
            description: '通往森林洞穴的入口，周围环绕着茂密的树木。',
            dungeonId: 'forest_cave',
            position: { x: 100, y: 200 }
        },
        mountain_entrance: {
            id: 'mountain_entrance',
            name: '山脉入口',
            description: '通往山间小径的入口，位于陡峭的山脚下。',
            dungeonId: 'mountain_path',
            position: { x: 300, y: 400 }
        },
        ruins_entrance: {
            id: 'ruins_entrance',
            name: '遗迹入口',
            description: '通往古代遗迹的入口，被神秘的符文环绕。',
            dungeonId: 'ancient_ruins',
            position: { x: 500, y: 600 }
        }
    },

    // 已解锁的地下城
    unlockedDungeons: ['forest_cave'],

    // 已完成的地下城
    completedDungeons: [],

    // 当前运行的地下城数据
    currentRun: null,

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

    // 加载怪物和Boss模板数据
    loadTemplates() {
        console.log('开始加载地下城模板数据...');

        // 使用本地定义的地下城模板
        // this.dungeons = this.dungeons || {}; // 这行可以移除，因为 this.dungeons 在文件顶部已硬编码初始化

        console.log('地下城模板加载完成:', this.dungeons);

        // 加载怪物模板
        const monstersPath = '/src/data/monsters.json';
        fetch(monstersPath)
            .then(response => response.json())
            .then(data => {
              if (data && typeof data.monsters === 'object' && data.monsters !== null) {
                this.monsterTemplates = data.monsters;
              } else if (data && typeof data === 'object' && data !== null && !data.monsters) { // 处理直接是模板对象的情况
                this.monsterTemplates = data;
              } else {
                console.error("错误：从 monsters.json 加载的怪物模板数据格式不正确或不存在。将使用空模板。", data);
                this.monsterTemplates = {};
              }
              // console.log("处理后的怪物模板数据:", this.monsterTemplates);
            })
            .catch(error => {
              console.error("从服务器加载怪物模板数据失败:", error);
              this.monsterTemplates = {}; // 确保在失败时设置为空对象
            });

        // 加载Boss模板
        const bossesPath = '/src/data/bosses.json';
        fetch(bossesPath)
            .then(response => response.json())
            .then(data => {
              if (data && typeof data.bosses === 'object' && data.bosses !== null) {
                this.bossTemplates = data.bosses;
              } else if (data && typeof data === 'object' && data !== null && !data.bosses) { // 处理直接是模板对象的情况
                this.bossTemplates = data;
              } else {
                console.error("错误：从 bosses.json 加载的Boss模板数据格式不正确或不存在。将使用空模板。", data);
                this.bossTemplates = {};
              }
              // console.log("处理后的Boss模板数据:", this.bossTemplates);
            })
            .catch(error => {
              console.error("从服务器加载Boss模板数据失败:", error);
              this.bossTemplates = {}; // 确保在失败时设置为空对象
            });
    },

    /**
     * 初始化地下城系统
     */
    init() {
        console.log('初始化地下城系统...');

        // 初始化地下城数据
        this.unlockedDungeons = ['forest_cave']; // 默认解锁第一个地下城
        this.completedDungeons = [];
        this.entrances = {
            'forest_entrance': {
                id: 'forest_entrance',
                name: '森林入口'
            },
            'mountain_entrance': {
                id: 'mountain_entrance',
                name: '山道入口'
            }
        };

        // 加载模板
        this.loadTemplates();

        // 加载地下城数据
        this.loadDungeons();

        // 尝试加载保存的地下城进度
        const progressLoaded = this.loadDungeonProgress();
        if (progressLoaded) {
            console.log('成功加载地下城进度，继续上次的地下城探索');

            // 检查角色是否有dungeonOriginalStats
            if (typeof Character !== 'undefined') {
                const characters = Object.values(Character.characters || {});
                let needToRestoreStats = false;

                for (const character of characters) {
                    if (!character.dungeonOriginalStats) {
                        console.log(`角色 ${character.name} 没有地下城原始属性，需要保存当前属性作为地下城原始属性`);
                        needToRestoreStats = true;
                        break;
                    }
                }

                if (needToRestoreStats) {
                    console.log('需要为角色重新保存地下城原始属性');
                    // 为所有角色保存当前属性作为地下城原始属性
                    for (const character of characters) {
                        character.dungeonOriginalStats = JSON.parse(JSON.stringify(character.baseStats));
                        console.log(`为角色 ${character.name} 保存地下城原始属性:`, character.dungeonOriginalStats);
                    }
                }
            }
        } else {
            console.log('没有找到保存的地下城进度或加载失败');
        }

        // 显示初始化消息
        UI.showMessage('地下城系统已初始化');
        console.log('地下城系统初始化完成');
    },

    /**
     * 加载地下城数据
     */
    loadDungeons() {
        try {
            // 尝试从本地存储加载地下城数据
            const savedData = localStorage.getItem('dungeonData');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.unlockedDungeons = data.unlockedDungeons || ['forest_cave'];
                this.completedDungeons = data.completedDungeons || [];
                console.log('从本地存储加载地下城数据成功');
            } else {
                // 如果没有保存的数据，使用默认值
                this.unlockedDungeons = ['forest_cave'];
                this.completedDungeons = [];
                console.log('使用默认地下城数据');
            }

            // 更新UI显示
            if (typeof UI !== 'undefined') {
                UI.updateDungeonList();
            }
        } catch (error) {
            console.error('加载地下城数据失败:', error);
            //this.loadDungeonsFallback();
        }
    },

    /**
     * 保存地下城数据
     */
    saveDungeons() {
        const data = {
            unlockedDungeons: this.unlockedDungeons,
            completedDungeons: this.completedDungeons
        };
        localStorage.setItem('dungeonData', JSON.stringify(data));
    },

    /**
     * 获取可探索的地下城列表
     * @returns {Array} 可探索的地下城列表
     */
    getAvailableDungeons() {
        return this.unlockedDungeons.map(dungeonId => {
            // 优先从dungeons对象中获取地下城数据
            const dungeon = this.dungeons[dungeonId];

            if (!dungeon) {
                console.warn(`找不到地下城: ${dungeonId}`);
                return null;
            }

            const entrance = this.entrances[dungeon.entrance];

            return {
                ...dungeon,
                entrance: entrance,
                isCompleted: this.completedDungeons.includes(dungeonId)
            };
        }).filter(dungeon => dungeon !== null); // 过滤掉null值
    },

    /**
     * 检查是否可以进入地下城
     * @param {string} dungeonId - 地下城ID
     * @returns {boolean} 是否可以进入
     */
    canEnterDungeon(dungeonId) {
        // 检查是否已在地下城中
        if (this.currentRun && this.currentRun.dungeonId) {
            console.log('已在地下城中，无法进入新的地下城');
            return false;
        }

        // 优先从dungeons对象中获取地下城数据
        const dungeon = this.dungeons[dungeonId];
        if (!dungeon) return false;

        // 检查是否已解锁
        if (!this.unlockedDungeons.includes(dungeonId)) return false;

        return true;
    },

    /**
     * 完成地下城
     * @param {string} dungeonId - 地下城ID
     */
    completeDungeon(dungeonId) {
        if (!this.completedDungeons.includes(dungeonId)) {
            this.completedDungeons.push(dungeonId);

            // 解锁下一个地下城
            const template = this.dungeons[dungeonId];
            if (template.nextDungeon && !this.unlockedDungeons.includes(template.nextDungeon)) {
                this.unlockedDungeons.push(template.nextDungeon);
                UI.showMessage(`已解锁新的地下城：${this.dungeons[template.nextDungeon].name}`);
            }

            this.saveDungeons();
        }
    },

    /**
     * 获取地下城入口
     * @param {string} entranceId - 入口ID
     * @returns {Object} 入口信息
     */
    getEntrance(entranceId) {
        return this.entrances[entranceId];
    },

    /**
     * 获取地下城模板
     * @param {string} dungeonId - 地下城ID
     * @returns {Object} 地下城模板
     */
    getTemplate(dungeonId) {
        return this.dungeons[dungeonId];
    },

    /**
     * 获取地下城
     * @param {string} dungeonId - 地下城ID
     * @returns {object|null} 地下城对象
     */
    getDungeon(dungeonId) {
        // 首先尝试从dungeons获取
        if (this.dungeons[dungeonId]) {
            return this.dungeons[dungeonId];
        }

        // 如果都找不到，返回null
        return null;
    },

    /**
     * 获取所有地下城
     * @returns {object} 所有地下城对象
     */
    getAllDungeons() {
        return this.dungeons;
    },

    /**
     * 初始化地下城运行
     * @param {string} dungeonId - 地下城ID
     * @returns {boolean} 是否成功初始化
     */
    initDungeonRun(dungeonId) {
        // 尝试从dungeons获取地下城，如果不存在则从templates获取
        let dungeon = this.getDungeon(dungeonId);

        console.log(`初始化地下城:${dungeonId}`);
        // // 如果在dungeons中找不到，尝试从templates中获取
        // if (!dungeon && this.templates[dungeonId]) {
        //     console.log(`在dungeons中找不到地下城 ${dungeonId}，使用模板`);
        //     dungeon = this.templates[dungeonId];

        //     // 将模板添加到dungeons中
        //     this.dungeons[dungeonId] = {
        //         ...this.templates[dungeonId],
        //         isCompleted: false,
        //         isUnlocked: true
        //     };
        // }

        // 如果仍然找不到地下城，返回失败
        if (!dungeon) {
            console.error(`找不到地下城: ${dungeonId}`);
            return false;
        }

        // 获取地下城类型
        const dungeonType = this.types[dungeon.type] || this.types.normal;

        // 确定普通怪物数量
        const monsterCount = Math.floor(Math.random() *
            (dungeonType.monsterCount.max - dungeonType.monsterCount.min + 1)) +
            dungeonType.monsterCount.min;

        console.log(`生成 ${monsterCount} 个普通怪物`);

        // 生成普通怪物
        const monsters = [];

        // 检查是否有怪物模板
        if (!this.monsterTemplates || Object.keys(this.monsterTemplates).length === 0) {
            console.warn('怪物模板未加载，使用默认怪物');

            // 使用默认怪物
            this.monsterTemplates = {
                slime: {
                    id: 'slime',
                    name: '史莱姆',
                    hp: 100,
                    atk: 10,
                    def: 5,
                    attribute: 'water',
                    xpReward: 50
                },
                goblin: {
                    id: 'goblin',
                    name: '哥布林',
                    hp: 150,
                    atk: 15,
                    def: 8,
                    attribute: 'earth',
                    xpReward: 80
                },
                wolf: {
                    id: 'wolf',
                    name: '狼',
                    hp: 120,
                    atk: 20,
                    def: 3,
                    attribute: 'wind',
                    xpReward: 70
                }
            };
        }

        // 检查是否有Boss模板
        if (!this.bossTemplates || Object.keys(this.bossTemplates).length === 0) {
            console.warn('Boss模板未加载，使用默认Boss');

            // 使用默认Boss
            this.bossTemplates = {
                goblinChief: {
                    id: 'goblinChief',
                    name: '哥布林酋长',
                    hp: 500,
                    atk: 30,
                    def: 15,
                    attribute: 'earth',
                    xpReward: 300,
                    skills: []
                },
                skeletonKing: {
                    id: 'skeletonKing',
                    name: '骷髅王',
                    hp: 600,
                    atk: 35,
                    def: 10,
                    attribute: 'dark',
                    xpReward: 350,
                    skills: []
                },
                forestGuardian: {
                    id: 'forestGuardian',
                    name: '森林守护者',
                    hp: 1000,
                    atk: 50,
                    def: 20,
                    attribute: 'earth',
                    xpReward: 800,
                    skills: []
                }
            };
        }

        // 生成普通怪物
        for (let i = 0; i < monsterCount; i++) {
            const monster = this.generateMonster(dungeon);
            if (monster) {
                monsters.push(monster);
            }
        }

        console.log(`生成普通怪物 ${monsters}`);

        // 生成小boss
        const miniBosses = [];
        const miniBossCount = dungeon.miniBossCount || 2; // 默认至少2个小boss

        console.log(`生成 ${miniBossCount} 个小boss`);

        // 确保生成指定数量的小boss
        for (let i = 0; i < miniBossCount; i++) {
            const miniBoss = this.generateBoss(dungeon, 'mini');
            if (miniBoss) {
                miniBosses.push(miniBoss);
            }
        }
        console.log(`生成小boss `,miniBosses);

        // 生成大boss（但不立即出现）
        const finalBoss = this.generateBoss(dungeon, 'final');
        console.log(`生成大boss ${finalBoss}`);

        if (finalBoss) {
            console.log(`生成大boss: ${finalBoss.name}`);
        } else {
            console.warn('无法生成大boss');
        }

        // 初始化运行数据
        this.currentRun = {
            dungeonId: dungeonId,
            dungeonName: dungeon.name, // 添加地下城名称
            progress: 0,
            monsters: monsters,
            miniBosses: miniBosses,
            finalBoss: finalBoss,
            defeatedMiniBosses: 0,
            defeatedMonsters: 0, // 已击败的普通怪物计数
            currentMonsterIndex: 0,
            monsterCount: monsters.length, // 总怪物数量
            miniBossCount: miniBosses.length, // 总小boss数量
            rewards: [],
            isCompleted: false,
            finalBossAppeared: false
        };

        console.log(`初始化地下城运行: ${dungeon.name}，普通怪物: ${monsters.length}, 小boss: ${miniBosses.length}`);

        // 清除上一次地下城记录
        if (typeof DungeonRunner !== 'undefined' && typeof DungeonRunner.clearLastDungeonRecord === 'function') {
            console.log('清除上一次地下城记录');
            DungeonRunner.clearLastDungeonRecord();
        }

        
                // 保存地下城进度到Game.state
                this.saveDungeonProgress();
        
                // ... 在 Dungeon.initDungeonRun 中，获取到队伍成员后 ...
                const activeTeam = Game.getActiveTeam(); // 或其他获取当前队伍的方式
                if (activeTeam && activeTeam.members && typeof Character !== 'undefined' && Character.validateCharacterBaseStats) {
                    console.log(`进入副本 ${dungeonId} 前，验证队伍成员的 baseStats...`);
                    activeTeam.members.forEach(memberId => {
                        Character.validateCharacterBaseStats(memberId);
                    });
                }
        
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
        const monsterTemplate = this.monsterTemplates[monsterType];
        if (!monsterTemplate) return null;

        // 获取地下城类型
        const dungeonType = this.types[dungeon.type] || this.types.normal;
        const multiplier = dungeonType.monsterMultiplier;

        // 计算怪物属性
        const hp = Math.floor(monsterTemplate.hp * multiplier.hp);
        const attack = Math.floor(monsterTemplate.atk * multiplier.atk);
        const defense = Math.floor(monsterTemplate.def * multiplier.def);

        // 确保怪物有属性
        let attribute = monsterTemplate.attribute;
        if (!attribute) {
            attribute = this.getRandomAttribute();
            console.log(`为怪物 ${monsterTemplate.name} 随机分配属性: ${attribute}`);
        }

        // 创建怪物实例
        const monster = {
            id: `${monsterType}_${Date.now()}`,
            name: monsterTemplate.name,
            attribute: attribute,
            baseStats: {
                hp: hp,
                attack: attack,
                defense: defense,
                maxHp: hp
            },
            currentStats: {
                hp: hp,
                attack: attack,
                defense: defense,
                maxHp: hp
            },
            isBoss: false,
            isMiniBoss: false,
            isFinalBoss: false,
            xpReward: Math.floor(monsterTemplate.xpReward * dungeonType.rewardMultiplier)
        };
        console.log(monster);

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
        if (!bossPool || bossPool.length === 0) {
            console.warn(`无法生成${bossType === 'mini' ? '小' : '大'}boss: 没有可用的boss池`);
            return null;
        }

        console.log(`可用的${bossType === 'mini' ? '小' : '大'}boss池:`, bossPool);

        // 随机选择Boss类型
        const bossMonsterType = bossPool[Math.floor(Math.random() * bossPool.length)];
        console.log(`选择的${bossType === 'mini' ? '小' : '大'}boss类型:`, bossMonsterType);

        // 检查bossTemplates是否存在
        if (!this.bossTemplates) {
            console.error('bossTemplates未定义，无法生成boss');
            return null;
        }

        const bossTemplate = this.bossTemplates[bossMonsterType];
        if (!bossTemplate) {
            console.error(`无法找到boss模板: ${bossMonsterType}，可用的boss模板:`, Object.keys(this.bossTemplates));
            return null;
        }

        console.log(`找到${bossType === 'mini' ? '小' : '大'}boss模板:`, bossTemplate);

        // 获取地下城类型
        const dungeonType = this.types[dungeon.type] || this.types.normal;
        const multiplier = dungeonType.monsterMultiplier;

        // 计算Boss属性
        const hp = Math.floor(bossTemplate.hp * multiplier.hp);
        const attack = Math.floor(bossTemplate.atk * multiplier.atk);
        const defense = Math.floor(bossTemplate.def * multiplier.def);

        // 确保Boss有属性
        let attribute = bossTemplate.attribute;
        if (!attribute) {
            attribute = this.getRandomAttribute();
            console.log(`为Boss ${bossTemplate.name} 随机分配属性: ${attribute}`);
        }

        // 确保Boss有技能
        const skills = bossTemplate.skills || [];

        // 创建Boss实例
        const boss = {
            id: `${bossMonsterType}_${Date.now()}`,
            name: bossTemplate.name,
            attribute: attribute,
            baseStats: {
                hp: hp,
                attack: attack,
                defense: defense,
                maxHp: hp
            },
            currentStats: {
                hp: hp,
                attack: attack,
                defense: defense,
                maxHp: hp
            },
            skills: skills,
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

        // 计算总怪物数量和小boss数量
        const totalMonsters = this.currentRun.monsters.length;
        const totalMiniBosses = this.currentRun.miniBosses.length;

        // 如果没有怪物或小boss，直接返回null
        if (totalMonsters === 0 && totalMiniBosses === 0) {
            console.log('没有怪物或小boss可战斗');
            return null;
        }

        // 计算每个小boss前需要击败的普通怪物数量
        // 将怪物平均分配到每个小boss之前
        const monstersPerMiniBoss = Math.ceil(totalMonsters / Math.max(1, totalMiniBosses + 1));

        // 计算当前应该遇到的小boss索引
        // 根据已击败的怪物数量，确定是否应该遇到小boss
        const defeatedMonsters = this.currentRun.defeatedMonsters || 0;

        // 计算当前应该处于的阶段
        // 每个阶段包含一定数量的怪物和一个小boss
        const currentPhase = Math.floor(defeatedMonsters / monstersPerMiniBoss);

        // 计算当前阶段内已击败的怪物数量
        const monstersDefeatedInCurrentPhase = defeatedMonsters % monstersPerMiniBoss;

        console.log(`当前阶段: ${currentPhase}, 当前阶段已击败怪物: ${monstersDefeatedInCurrentPhase}, 每阶段怪物数: ${monstersPerMiniBoss}`);
        console.log(`总怪物数: ${totalMonsters}, 已击败怪物: ${defeatedMonsters}, 总小boss数: ${totalMiniBosses}, 已击败小boss: ${this.currentRun.defeatedMiniBosses}`);

        // 如果当前阶段内的所有怪物都已击败，并且还有小boss未击败，则返回小boss
        if (monstersDefeatedInCurrentPhase >= monstersPerMiniBoss &&
            this.currentRun.defeatedMiniBosses < totalMiniBosses &&
            currentPhase === this.currentRun.defeatedMiniBosses) {
            console.log(`应该遇到小boss: 当前阶段=${currentPhase}, 已击败小boss=${this.currentRun.defeatedMiniBosses}`);
            return this.currentRun.miniBosses[this.currentRun.defeatedMiniBosses];
        }

        // 如果所有小boss已击败，并且所有怪物也已击败，则让大boss出现
        if (this.currentRun.defeatedMiniBosses >= totalMiniBosses &&
            defeatedMonsters >= totalMonsters &&
            !this.currentRun.finalBossAppeared &&
            this.currentRun.finalBoss) {
            this.currentRun.finalBossAppeared = true;
            console.log('所有小boss和怪物已击败，大boss出现');
            return this.currentRun.finalBoss;
        }

        // 如果当前阶段内还有怪物未击败，或者已经进入新阶段但还有怪物未击败，则返回普通怪物
        if (this.currentRun.currentMonsterIndex < totalMonsters) {
            console.log(`返回普通怪物: currentMonsterIndex=${this.currentRun.currentMonsterIndex}`);
            return this.currentRun.monsters[this.currentRun.currentMonsterIndex];
        }

        console.log('没有更多怪物可战斗');
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
            console.log("处理奖励"+monster);
            try{
                this.processRewards(monster);
            }catch{
                console.log("处理奖励失败");
            }

            // 保存地下城进度
            this.saveDungeonProgress();

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
     * @returns {object} 奖励信息
     */
    processRewards(monster) {
        // 创建奖励信息对象
        const rewardInfo = {
            exp: monster.xpReward || 0,
            items: []
        };

        console.log(monster);
        // 添加经验值
        //Game.addPlayerExp(monster.xpReward);
        //console.log(`玩家获得经验值: ${monster.xpReward}`);

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

        // 处理宝箱掉落 (保留原有逻辑或按需调整)
        if (monster.isBoss) {
            if (monster.isMiniBoss) {
                const silverCount = Math.floor(Math.random() * 3) + 1;
                const goldCount = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < silverCount; i++) {
                    if (typeof Inventory !== 'undefined' && Inventory.addItem) Inventory.addItem('silver_chest', 1);
                    rewardInfo.items.push({ type: 'chest', id: 'silver_chest', count: 1 });
                }
                for (let i = 0; i < goldCount; i++) {
                    if (typeof Inventory !== 'undefined' && Inventory.addItem) Inventory.addItem('gold_chest', 1);
                    rewardInfo.items.push({ type: 'chest', id: 'gold_chest', count: 1 });
                }
                if (Math.random() < 0.0005) {
                    if (typeof Inventory !== 'undefined' && Inventory.addItem) Inventory.addItem('rainbow_chest', 1);
                    rewardInfo.items.push({ type: 'chest', id: 'rainbow_chest', count: 1 });
                }
            } else if (monster.isFinalBoss) {
                const goldCount = Math.floor(Math.random() * 3) + 1;
                const redCount = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < goldCount; i++) {
                    if (typeof Inventory !== 'undefined' && Inventory.addItem) Inventory.addItem('gold_chest', 1);
                    rewardInfo.items.push({ type: 'chest', id: 'gold_chest', count: 1 });
                }
                for (let i = 0; i < redCount; i++) {
                    if (typeof Inventory !== 'undefined' && Inventory.addItem) Inventory.addItem('red_chest', 1);
                    rewardInfo.items.push({ type: 'chest', id: 'red_chest', count: 1 });
                }
                if (Math.random() < 0.02) {
                    if (typeof Inventory !== 'undefined' && Inventory.addItem) Inventory.addItem('rainbow_chest', 1);
                    rewardInfo.items.push({ type: 'chest', id: 'rainbow_chest', count: 1 });
                }
            }
        } else {
            if (typeof Inventory !== 'undefined' && Inventory.addItem) Inventory.addItem('silver_chest', 1);
            rewardInfo.items.push({ type: 'chest', id: 'silver_chest', count: 1 });
        }

        // 怪物直接物品掉落逻辑已根据游戏设计移除
        // 新物品主要通过 chestDrops 获取


        console.log(`处理怪物奖励: 经验 ${monster.xpReward}, 物品/宝箱 ${rewardInfo.items.length}个`);
        return rewardInfo;
    },

    /**
     * 完成地下城
     * @returns {object} 完成结果
     */
    completeDungeon() {
        const dungeonId = this.currentRun.dungeonId;
        const dungeon = this.getDungeon(dungeonId);

        if (!dungeon) return { success: false, message: '地下城不存在' };

        // 恢复队伍成员的地下城原始属性
        const team = Game.getActiveTeam(); // 假设 Game.getActiveTeam() 能正确获取当前队伍
        if (team && team.members) {
            const teamMembers = team.members.map(id => Character.getCharacter(id)).filter(char => char);

            for (const member of teamMembers) {
                if (member.dungeonOriginalStats) { // 检查确保只处理参与了副本的角色
                    console.log(`完成地下城，为 ${member.name} 清理副本状态并刷新属性`);
                    
                    // 清除地下城原始属性
                    delete member.dungeonOriginalStats;

                    // 清除地下城已应用的被动技能记录
                    if (member.dungeonAppliedPassives) {
                        delete member.dungeonAppliedPassives;
                        console.log(`清除 ${member.name} 的地下城已应用被动技能记录`);
                    }

                    // 清除所有BUFF
                    if (typeof BuffSystem !== 'undefined' && BuffSystem.clearAllBuffs) {
                        BuffSystem.clearAllBuffs(member);
                    } else if (member.buffs) {
                        member.buffs = [];
                    }

                    // 直接调用 _updateCharacterEffectiveStats 来恢复和计算属性
                    if (typeof Character !== 'undefined' && Character._updateCharacterEffectiveStats) {
                        // 确保 team.id 是有效的，如果队伍信息可能不完整，需要更健壮的处理
                        const currentTeamId = team.id || null;
                        Character._updateCharacterEffectiveStats(member.id, currentTeamId);
                        console.log(`已为 ${member.name} (队伍ID: ${currentTeamId}) 调用 _updateCharacterEffectiveStats`);
                    } else {
                        console.warn(`Character._updateCharacterEffectiveStats 未定义，无法为 ${member.name} 刷新属性。回退到baseStats。`);
                        member.currentStats = JSON.parse(JSON.stringify(member.baseStats));
                        if (typeof Character !== 'undefined' && Character._ensureStatsIntegrity) {
                           Character._ensureStatsIntegrity(member.currentStats, member.baseStats);
                        }
                        member.weaponBonusStats = JSON.parse(JSON.stringify(member.baseStats));
                         if (typeof Character !== 'undefined' && Character._ensureStatsIntegrity) {
                           Character._ensureStatsIntegrity(member.weaponBonusStats, member.baseStats);
                        }
                    }
                }
            }
        }

        // 清除保存的地下城进度
        if (typeof Game !== 'undefined' && Game.state) {
            delete Game.state.currentDungeon;
            if (typeof Game.saveGame === 'function') {
                Game.saveGame();
                console.log('已清除保存的地下城进度');
            }
        }

        // 原先的 Character.updateTeamWeaponBonusStats 调用可以移除，
        // 因为属性已在上面的循环中为每个成员单独更新。

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
        if (completedDungeons.includes('forest_cave') && playerLevel >= 5 &&
            !Game.state.progress.unlockedDungeons.includes('mountain_path')) {

            Game.state.progress.unlockedDungeons.push('mountain_path');
            UI.showNotification('新地下城已解锁：山间小径');
        }

        // 例如：完成dungeon2并且等级达到10级时解锁dungeon3
        if (completedDungeons.includes('mountain_path') && playerLevel >= 10 &&
            !Game.state.progress.unlockedDungeons.includes('ancient_ruins')) {

            Game.state.progress.unlockedDungeons.push('ancient_ruins');
            UI.showNotification('新地下城已解锁：古代遗迹');
        }

        // 例如：完成dungeon3并且等级达到20级时解锁bossRaid1
        if (completedDungeons.includes('ancient_ruins') && playerLevel >= 20 &&
            !Game.state.progress.unlockedDungeons.includes('bossRaid1')) {

            Game.state.progress.unlockedDungeons.push('bossRaid1');
            UI.showNotification('新地下城已解锁：龙之巢穴');
        }
    },

    /**
     * 获取随机元素属性
     * @returns {string} 随机元素属性
     */
    getRandomAttribute() {
        const attributes = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];
        return attributes[Math.floor(Math.random() * attributes.length)];
    },

    /**
     * 保存地下城进度
     * 将当前地下城运行状态保存到Game.state中
     */
    saveDungeonProgress() {
        if (!this.currentRun || !this.currentRun.dungeonId) {
            console.log('没有正在进行的地下城，无法保存进度');
            return;
        }

        console.log('保存地下城进度:', this.currentRun);

        // 将当前地下城运行状态保存到Game.state中
        if (typeof Game !== 'undefined' && Game.state) {
            // 创建一个深拷贝，避免引用问题
            Game.state.currentDungeon = JSON.parse(JSON.stringify(this.currentRun));

            // 保存游戏状态
            if (typeof Game.saveGame === 'function') {
                Game.saveGame();
                console.log('地下城进度已保存到游戏存档');
            }
        }
    },

    /**
     * 加载地下城进度
     * 从Game.state中加载地下城运行状态
     * @returns {boolean} 是否成功加载进度
     */
    loadDungeonProgress() {
        if (typeof Game === 'undefined' || !Game.state || !Game.state.currentDungeon || Object.keys(Game.state.currentDungeon).length === 0) {
            console.log('没有可加载的地下城进度');
            return false;
        }

        const savedDungeon = Game.state.currentDungeon;
        if (!savedDungeon.dungeonId) {
            console.log('保存的地下城进度无效');
            return false;
        }

        console.log('加载地下城进度:', savedDungeon);

        // 恢复地下城运行状态
        this.currentRun = JSON.parse(JSON.stringify(savedDungeon));

        // 检查地下城是否存在
        const dungeon = this.getDungeon(this.currentRun.dungeonId);
        if (!dungeon) {
            console.error('无法找到地下城:', this.currentRun.dungeonId);
            this.currentRun = null;
            return false;
        }

        // 确保所有角色的dungeonOriginalStats和dungeonAppliedPassives属性被正确设置
        if (typeof Character !== 'undefined' && Character.characters) {
            const characters = Object.values(Character.characters);
            for (const character of characters) {
                // 如果角色没有dungeonOriginalStats，设置它
                if (!character.dungeonOriginalStats) {
                    console.log(`为角色 ${character.name} 设置dungeonOriginalStats`);
                    character.dungeonOriginalStats = JSON.parse(JSON.stringify(character.baseStats));
                }

                // 如果角色没有dungeonAppliedPassives，初始化它
                if (!character.dungeonAppliedPassives) {
                    console.log(`为角色 ${character.name} 初始化dungeonAppliedPassives`);
                    character.dungeonAppliedPassives = {};
                }
            }
        }

        console.log('地下城进度加载成功:', this.currentRun);
        return true;
    },

    /**
     * 重置地下城系统
     */
    reset() {
        console.log('重置地下城系统...');

        // 重置地下城数据和当前运行
        this.dungeons = {};

        // 完全清除currentRun，而不是设置为空对象
        this.currentRun = null;

        // 清除保存的地下城进度
        if (typeof Game !== 'undefined' && Game.state) {
            delete Game.state.currentDungeon;
            console.log('已清除保存的地下城进度');

            // 保存游戏状态
            if (typeof Game.saveGame === 'function') {
                Game.saveGame();
                console.log('已保存游戏状态（清除地下城进度）');
            }
        }

        // 清除所有角色的dungeonOriginalStats
        if (typeof Character !== 'undefined' && Character.characters) {
            for (const characterId in Character.characters) {
                const character = Character.characters[characterId];
                if (character.dungeonOriginalStats) {
                    console.log(`清除角色 ${character.name} 的地下城原始属性`);
                    delete character.dungeonOriginalStats;

                    // 重置currentStats为baseStats的深拷贝
                    character.currentStats = JSON.parse(JSON.stringify(character.baseStats));

                    // 清除地下城已应用的被动技能记录
                    if (character.dungeonAppliedPassives) {
                        delete character.dungeonAppliedPassives;
                        console.log(`清除 ${character.name} 的地下城已应用被动技能记录`);
                    }

                    // 清除所有BUFF
                    if (typeof BuffSystem !== 'undefined') {
                        BuffSystem.clearAllBuffs(character);
                    } else if (character.buffs) {
                        character.buffs = [];
                    }
                }
            }
        }

        console.log('地下城系统重置完成');
        this.init();
    }
};
export default Dungeon;