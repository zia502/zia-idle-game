import Character from './character.js';
import Team from './team.js';
import DungeonRunner from './dungeon-runner.js';
import Events from '../components/events.js'; // 路径已更正
import Storage from '../utils/storage.js'; // 根据 game.js:586 的使用情况添加
import FileUtils from '../utils/file-utils.js'; // 根据 game.js:595 的使用情况添加
import Resources from './resources.js'; // 根据 game.js:367 的使用情况添加
// import Shop from './shop.js'; // shop.js 已被移除
import Weapon from './weapon.js'; // 根据 game.js:278 的使用情况添加
import Inventory from './inventory.js'; // 根据 game.js:300 的使用情况添加
// import CharacterCreation from '../components/character-creation.js'; // 不再需要导入，我们使用内联方法
import Battle from './battle.js'; // 根据 game.js:876 的使用情况添加
import Dungeon from './dungeon.js'; // 根据 game.js:1169 的使用情况添加
import BuffSystem from './buff-system.js'; // 根据 game.js:1247 的使用情况添加
import UI from '../components/UI.js'; // 根据 game.js:1282 的使用情况添加


/**
 * 游戏核心模块
 * 负责管理游戏状态、游戏循环和核心逻辑
 */
const Game = {
    // 游戏状态
    state: {
        isRunning: false,
        isPaused: false,
        gameTime: 0,  // 游戏内部时间（秒）
        lastTick: 0,  // 上次更新时间
        tickRate: 1000, // 游戏更新频率（毫秒）
        version: '0.1.0',
        playerLevel: 1,
        gold: 100000,
        gems: 0,
        energy: 100,
        maxEnergy: 100,
        energyRegenRate: 1, // 每分钟恢复量
        lastEnergySave: 0,
        productionMultiplier: 1.0, // 生产系数
        progress: {
            completedDungeons: [],
            unlockedDungeons: ['dungeon1']
        },
        activeTeamId: null,
        unlocks: {
            features: {
                shop: false,
                crafting: false,
                dungeon: false,
                arena: false
            }
        }
    },

    // 游戏设置
    settings: {
        soundEnabled: true,
        musicEnabled: true,
        notificationsEnabled: true,
        autoSaveInterval: 60, // 自动保存间隔（秒）
        darkMode: false
    },

    // 游戏统计
    stats: {
        battlesWon: 0,
        battlesLost: 0,
        monstersDefeated: 0,
        bossesDefeated: 0,
        resourcesCollected: 0,
        charactersRecruited: 0,
        dungeonCompletions: {}
    },

    /**
     * 初始化游戏
     */
    async init() { // 改为 async
        console.log("初始化游戏核心...");
        await this.loadGame(); // 等待 loadGame 完成
        this.setupEventListeners();

        // 检查活动队伍是否存在
        this.checkActiveTeam();

        // 确保主角元素属性与主手武器同步
        this.syncMainCharacterElement();

        // 更新所有队伍中角色的weaponBonusStats
        this.updateAllTeamsWeaponBonusStats();

        // 初始化地下城运行器
        this.initDungeonRunner();

        this.startGameLoop();

        // 触发游戏加载完成事件
        if (typeof Events !== 'undefined') {
            console.log('[DEBUG] Game.init() 即将触发 game:loaded 事件 (所有核心异步加载已完成)');
            Events.emit('game:loaded', { version: this.state.version });
        }
    },

    /**
     * 初始化地下城运行器
     */
    initDungeonRunner() {
        if (typeof DungeonRunner !== 'undefined' && typeof DungeonRunner.init === 'function') {
            console.log('初始化地下城运行器...');
            try {
                DungeonRunner.init();
                console.log('地下城运行器初始化完成');
            } catch (error) {
                console.error('初始化地下城运行器时出错:', error);
            }
        } else {
            console.warn('DungeonRunner模块未定义或init方法不存在');
        }
    },

    /**
     * 更新所有队伍中角色的weaponBonusStats
     */
    updateAllTeamsWeaponBonusStats() {
        console.log('更新所有队伍中角色的weaponBonusStats');

        // 检查Team和Character模块是否存在
        if (typeof Team === 'undefined' || typeof Character === 'undefined' ||
            typeof Character.updateTeamWeaponBonusStats !== 'function') {
            console.log('Team或Character模块未定义，无法更新weaponBonusStats');
            return;
        }

        // 获取所有队伍
        const teams = Team.getAllTeams();
        if (!teams || Object.keys(teams).length === 0) {
            console.log('没有队伍，无需更新weaponBonusStats');
            return;
        }

        // 遍历所有队伍，更新weaponBonusStats
        for (const teamId in teams) {
            Character.updateTeamWeaponBonusStats(teamId);
        }

        console.log('所有队伍中角色的weaponBonusStats已更新');
    },

    /**
     * 同步主角元素属性与主手武器
     */
    syncMainCharacterElement() {
        try {
            console.log("同步主角元素属性与主手武器...");

            // 检查必要的模块是否存在
            if (typeof Character === 'undefined' || typeof Character.updateMainCharacterElement !== 'function') {
                console.warn("Character模块未加载或updateMainCharacterElement方法不存在，无法同步主角元素属性");
                return;
            }

            // 获取活动队伍ID
            const activeTeamId = this.state.activeTeamId;
            if (!activeTeamId) {
                console.warn("没有活动队伍，无法同步主角元素属性");
                return;
            }

            // 更新主角元素属性
            Character.updateMainCharacterElement(activeTeamId);
            console.log("主角元素属性同步完成");
        } catch (error) {
            console.error("同步主角元素属性时出错:", error);
        }
    },

    /**
     * 检查活动队伍是否存在，如果不存在则创建或设置一个
     */
    checkActiveTeam() {
        if (typeof Team === 'undefined') return;

        console.log('检查活动队伍...');

        // 获取所有队伍
        const teams = Object.values(Team.teams || {});
        console.log(`当前队伍数量: ${teams.length}`);

        // 输出所有队伍信息
        teams.forEach(team => {
            console.log(`队伍: ${team.name} (ID: ${team.id}), 成员数: ${team.members ? team.members.length : 0}`);
            if (team.members && team.members.length > 0) {
                console.log(`队伍 ${team.name} 成员: ${team.members.join(', ')}`);
            }
        });

        // 检查是否有活动队伍ID
        if (!this.state.activeTeamId) {
            console.log('没有设置活动队伍ID');
        } else {
            console.log(`当前活动队伍ID: ${this.state.activeTeamId}`);

            // 检查活动队伍是否存在
            const activeTeam = Team.getTeam(this.state.activeTeamId);
            if (!activeTeam) {
                console.log(`活动队伍ID ${this.state.activeTeamId} 不存在，需要重新设置`);
                this.state.activeTeamId = null;
            } else {
                console.log(`活动队伍存在: ${activeTeam.name} (ID: ${activeTeam.id}), 成员数: ${activeTeam.members ? activeTeam.members.length : 0}`);

                // 检查队伍是否包含主角，如果不包含则添加
                if (typeof Character !== 'undefined') {
                    const mainCharacter = Character.getMainCharacter();
                    if (mainCharacter && !activeTeam.members.includes(mainCharacter.id)) {
                        console.log(`向活动队伍添加主角: ${mainCharacter.name}`);
                        activeTeam.members.push(mainCharacter.id);

                        // 保存游戏状态
                        this.saveGame();
                    }
                }

                return; // 活动队伍存在，不需要进一步处理
            }
        }

        // 如果没有活动队伍，尝试设置一个
        if (teams.length > 0) {
            // 如果已有队伍，设置第一个为活动队伍
            const firstTeam = teams[0];
            this.state.activeTeamId = firstTeam.id;
            console.log(`设置已有队伍为活动队伍: ${firstTeam.name} (ID: ${firstTeam.id})`);

            // 检查队伍是否包含主角，如果不包含则添加
            if (typeof Character !== 'undefined') {
                const mainCharacter = Character.getMainCharacter();

                if (mainCharacter && !firstTeam.members.includes(mainCharacter.id)) {
                    console.log(`向活动队伍添加主角: ${mainCharacter.name}`);
                    firstTeam.members.push(mainCharacter.id);
                }
            }
        } else {
            // 如果没有队伍，创建一个新队伍
            if (typeof Character !== 'undefined') {
                const mainCharacter = Character.getMainCharacter();

                if (mainCharacter) {
                    const teamName = `${mainCharacter.name}的队伍`;
                    const teamData = {
                        name: teamName,
                        members: [mainCharacter.id] // 确保主角在队伍中
                    };

                    // 使用当前时间戳创建唯一ID
                    const timestamp = Date.now();
                    const randomSuffix = Math.floor(Math.random() * 10000);
                    teamData.id = `team_${timestamp}_${randomSuffix}`;

                    const teamId = Team.createTeam(teamData);
                    if (teamId) {
                        this.state.activeTeamId = teamId;
                        console.log(`创建新队伍并设为活动队伍: ${teamName} (ID: ${teamId})`);
                    }
                }
            }
        }

        // 保存游戏状态
        console.log('保存活动队伍设置');
        this.saveGame();
    },

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        if (typeof Events === 'undefined') return;

        // 角色升级事件
        Events.on('character:levelup', (data) => {
            console.log(`角色 ${data.name} 升级到 ${data.level} 级.`);
        });

        // 监听角色创建成功事件
        Events.on('character:created', (data) => {
            console.log('收到角色创建事件，数据：', data);
            if (!data) {
                console.error('角色创建事件数据为空');
                return;
            }

            const characterName = data.name || (data.character && data.character.name) || '未知角色';
            console.log(`角色 ${characterName} 创建成功，添加初始经验材料`);

            // 初始化武器
            if (typeof Weapon !== 'undefined') {
                console.log('检查武器系统状态:', {
                    weaponExists: !!Weapon,
                    createMethodExists: typeof Weapon.createInitialWeapons === 'function'
                });

                if (typeof Weapon.createInitialWeapons === 'function') {
                    console.log('开始初始化武器...');
                    try {
                        Weapon.createInitialWeapons();
                        console.log('武器初始化完成');
                    } catch (error) {
                        console.error('初始化武器时出错:', error);
                    }
                } else {
                    console.error('Weapon.createInitialWeapons 方法不存在');
                }
            } else {
                console.error('Weapon 模块未定义');
            }

            // 添加初始经验材料
            if (typeof Inventory !== 'undefined' && !this.hasInitialExpMaterials) {
                console.log('添加初始经验材料...');
                Inventory.addItem('exp_small', 10);
                // Inventory.addItem('exp_medium', 10);
                // Inventory.addItem('exp_large', 10);
                this.hasInitialExpMaterials = true;
                // 保存游戏状态
                this.saveGame();
                console.log('初始经验材料添加完成');
            }
        });

        // 其他游戏事件监听
        Events.on('inventory:itemAdded', (data) => {
            if (data.isRare) {
                console.log(`获得稀有物品: ${data.name}`);
            }
        });
    },

    /**
     * 开始游戏主循环
     */
    startGameLoop() {
        if (this.state.isRunning) return;

        this.state.isRunning = true;
        this.state.lastTick = Date.now();
        this.gameLoop();

        // 设置自动保存
        this.autoSaveInterval = setInterval(() => {
            this.saveGame();
        }, this.settings.autoSaveInterval * 1000);

        console.log("游戏循环已启动");
    },

    /**
     * 游戏循环
     */
    gameLoop() {
        if (!this.state.isRunning || this.state.isPaused) return;

        const now = Date.now();
        const deltaTime = (now - this.state.lastTick) / 1000;
        this.state.lastTick = now;

        // 更新游戏时间
        this.state.gameTime += deltaTime;

        // 更新能量
        this.updateEnergy(deltaTime);

        // 游戏逻辑更新
        this.update(deltaTime);

        // 继续游戏循环
        setTimeout(() => this.gameLoop(), this.state.tickRate);
    },

    /**
     * 游戏逻辑更新
     * @param {number} deltaTime 时间增量（秒）
     */
    update(deltaTime) {
        // 更新各系统
        if (typeof Resources !== 'undefined' && typeof Resources.update === 'function') {
            Resources.update(deltaTime);
        }
    },

    /**
     * 更新玩家能量
     * @param {number} deltaTime 时间增量（秒）
     */
    updateEnergy(deltaTime) {
        // 每分钟恢复能量
        const energyGain = (deltaTime / 60) * this.state.energyRegenRate;
        if (this.state.energy < this.state.maxEnergy) {
            this.state.energy = Math.min(this.state.maxEnergy, this.state.energy + energyGain);
        }
    },

    /**
     * 暂停游戏
     */
    pauseGame() {
        this.state.isPaused = true;
        console.log("游戏已暂停");
    },

    /**
     * 恢复游戏
     */
    resumeGame() {
        this.state.isPaused = false;
        this.state.lastTick = Date.now();
        console.log("游戏已恢复");
    },

    /**
     * 停止游戏
     */
    stopGame() {
        this.state.isRunning = false;
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        console.log("游戏已停止");
    },


    /**
     * 添加金币到游戏中
     * @param {number} amount - 要添加的金币数量
     * @returns {boolean} 是否添加成功
     */
    addGold(amount) {
        if (!amount || amount <= 0) return false;

        const oldAmount = this.state.gold;
        this.state.gold += amount;

        // 触发金币更新事件
        if (typeof Events !== 'undefined') {
            Events.emit('gold:updated', {
                oldAmount: oldAmount,
                newAmount: this.state.gold,
                change: amount
            });
        }

        console.log(`添加了 ${amount} 金币，当前金币: ${this.state.gold}`);
        return true;
    },

    /**
     * 减少金币
     * @param {number} amount 金币数量
     * @returns {boolean} 是否成功减少
     */
    removeGold(amount) {
        if (this.state.gold < amount) return false;

        this.state.gold -= amount;

        if (typeof Events !== 'undefined') {
            Events.emit('player:goldChanged', {
                gold: this.state.gold,
                change: -amount
            });
        }

        // 更新UI显示
        const goldElement = document.getElementById('gold-display');
        if (goldElement) {
            goldElement.textContent = `金币: ${this.state.gold}`;
        }

        return true;
    },

    /**
     * 检查是否有足够的金币
     * @param {number} amount 金币数量
     * @returns {boolean} 是否有足够的金币
     */
    hasEnoughGold(amount) {
        return this.state.gold >= amount;
    },

    /**
     * 添加宝石
     * @param {number} amount 宝石数量
     */
    addGems(amount) {
        this.state.gems += amount;

        if (typeof Events !== 'undefined') {
            Events.emit('player:gemsChanged', {
                gems: this.state.gems,
                change: amount
            });
        }

        return this.state.gems;
    },

    /**
     * 减少宝石
     * @param {number} amount 宝石数量
     * @returns {boolean} 是否成功减少
     */
    removeGems(amount) {
        if (this.state.gems < amount) return false;

        this.state.gems -= amount;

        if (typeof Events !== 'undefined') {
            Events.emit('player:gemsChanged', {
                gems: this.state.gems,
                change: -amount
            });
        }

        return true;
    },

    /**
     * 使用能量
     * @param {number} amount 能量数量
     * @returns {boolean} 是否成功使用
     */
    useEnergy(amount) {
        if (this.state.energy < amount) return false;

        this.state.energy -= amount;

        if (typeof Events !== 'undefined') {
            Events.emit('player:energyChanged', {
                energy: this.state.energy,
                maxEnergy: this.state.maxEnergy,
                change: -amount
            });
        }

        return true;
    },

    /**
     * 增加能量
     * @param {number} amount 能量数量
     */
    addEnergy(amount) {
        this.state.energy = Math.min(this.state.maxEnergy, this.state.energy + amount);

        if (typeof Events !== 'undefined') {
            Events.emit('player:energyChanged', {
                energy: this.state.energy,
                maxEnergy: this.state.maxEnergy,
                change: amount
            });
        }

        return this.state.energy;
    },

    /**
     * 保存游戏状态
     * @param {boolean} exportFile - 是否导出为文件
     * @returns {boolean} 是否保存成功
     */
    saveGame(exportFile = false) {
        try {
            const saveData = {
                state: this.state,
                settings: this.settings,
                timestamp: Date.now(),

                // 保存其他模块数据
                character: typeof Character !== 'undefined' && typeof Character.getSaveData === 'function'
                    ? Character.getSaveData()
                    : {},

                inventory: typeof Inventory !== 'undefined' && typeof Inventory.getSaveData === 'function'
                    ? Inventory.getSaveData()
                    : {},

                shop: typeof Shop !== 'undefined' && typeof Shop.getSaveData === 'function'
                    ? Shop.getSaveData()
                    : {},

                // 保存队伍数据
                team: typeof Team !== 'undefined' && typeof Team.getSaveData === 'function'
                    ? Team.getSaveData()
                    : {},

                // 保存武器系统数据
                weapon: typeof Weapon !== 'undefined' ? {
                    weapons: Weapon.weapons,
                    weaponBoards: Weapon.weaponBoards
                } : {}
            };

            // 使用存储工具保存数据
            if (typeof Storage !== 'undefined') {
                Storage.save('gameData', saveData);
                console.log("游戏已保存到本地存储");

                if (typeof Events !== 'undefined') {
                    Events.emit('game:saved', { timestamp: saveData.timestamp });
                }

                // 如果需要导出为文件
                if (exportFile && typeof FileUtils !== 'undefined') {
                    // 获取当前日期时间作为文件名的一部分
                    const now = new Date();
                    const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
                    const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

                    // 获取主角名称（如果有）
                    let characterName = "unknown";
                    if (typeof Character !== 'undefined' && typeof Character.getMainCharacter === 'function') {
                        const mainChar = Character.getMainCharacter();
                        if (mainChar && mainChar.name) {
                            characterName = mainChar.name.replace(/[^a-zA-Z0-9]/g, '_');
                        }
                    }

                    // 创建文件名
                    const filename = `zia_save_${characterName}_${dateStr}_${timeStr}.zia`;

                    // 导出为文件
                    const success = FileUtils.saveToFile(saveData, filename, true);
                    if (success) {
                        console.log(`游戏已导出为文件: ${filename}`);
                        return true;
                    } else {
                        console.error("导出游戏存档文件失败");
                        return false;
                    }
                }

                return true;
            } else {
                console.error("存储模块未加载，无法保存游戏");
                return false;
            }
        } catch (error) {
            console.error("保存游戏失败:", error);
            return false;
        }
    },

    /**
     * 加载游戏状态
     * @param {object} [externalSaveData] - 外部存档数据（从文件加载）
     * @returns {boolean} 是否加载成功
     */
    async loadGame(externalSaveData = null) { // 改为 async
        try {
            let saveData = externalSaveData;

            // 如果没有提供外部存档数据，则从本地存储加载
            if (!saveData) {
                if (typeof Storage === 'undefined') {
                    console.error("存储模块未加载，无法加载游戏");
                    return false;
                }

                saveData = Storage.load('gameData');
                if (!saveData) {
                    console.log("没有找到保存的游戏数据，将执行 Character.init()");
                    this.state.gold = 100000; // 确保初始金币
                    const goldElement = document.getElementById('gold-display');
                    if (goldElement) {
                        goldElement.textContent = `金币: ${this.state.gold}`;
                    }
                    // 初始化角色系统（包括加载模板数据）
                    if (typeof Character !== 'undefined' && typeof Character.init === 'function') {
                        await Character.init(); // 等待 Character 初始化
                        console.log("Character.init() 完成 (loadGame - 无存档)");
                    }
                    // 初始化其他可能依赖角色模板的系统，例如队伍
                    if (typeof Team !== 'undefined' && typeof Team.init === 'function') {
                         Team.init(); // 假设Team.init是同步的或内部处理异步
                    }
                    return false; // 表示从新游戏开始
                }
            }

            // 恢复游戏状态
            this.state = { ...this.state, ...saveData.state };
            this.settings = { ...this.settings, ...saveData.settings };

            // 加载其他模块数据 - 先加载角色数据，再加载队伍数据
            if (typeof Character !== 'undefined' && saveData.character && typeof Character.loadSaveData === 'function') {
                console.log('加载角色数据 (Game.loadGame)');
                await Character.loadSaveData(saveData.character); // 等待角色数据加载
                console.log("Character.loadSaveData() 完成 (loadGame - 有存档)");
                // 检查是否有异常的地下城状态
                this.checkAbnormalDungeonState();
            }

            // 加载物品栏数据
            if (typeof Inventory !== 'undefined' && saveData.inventory) {
                console.log('加载物品栏数据');
                Inventory.items = saveData.inventory.items || {};
            }

            // Shop 模块已移除
            // if (typeof Shop !== 'undefined' && saveData.shop && typeof Shop.loadSaveData === 'function') {
            //     Shop.loadSaveData(saveData.shop);
            // }

            // 加载武器系统数据
            if (typeof Weapon !== 'undefined' && saveData.weapon) {
                console.log('加载武器系统数据');
                if (saveData.weapon.weapons) {
                    Weapon.weapons = saveData.weapon.weapons;
                }
                if (saveData.weapon.weaponBoards) {
                    Weapon.weaponBoards = saveData.weapon.weaponBoards;
                }
                 if (typeof Weapon.init === 'function' && !Weapon.initialized) { // 确保Weapon也初始化
                    Weapon.init();
                }
            }


            // 确保在加载角色数据后再加载队伍数据
            if (typeof Team !== 'undefined' && saveData.team && typeof Team.loadSaveData === 'function') {
                console.log('加载队伍数据');
                Team.loadSaveData(saveData.team);
                 if (typeof Team.init === 'function' && !Team.initialized) { // 确保Team也初始化
                    Team.init();
                }

                // 验证队伍成员是否存在
                if (typeof Character !== 'undefined' && Team.teams) {
                    Object.values(Team.teams).forEach(team => {
                        if (team.members && Array.isArray(team.members)) {
                            team.members = team.members.filter(memberId => {
                                const exists = Character.getCharacter(memberId) !== null;
                                if (!exists) {
                                    console.warn(`队伍 ${team.name} 中的角色ID ${memberId} 不存在，已移除`);
                                }
                                return exists;
                            });
                        }
                    });
                }
            }

            console.log("游戏数据已加载 (Game.loadGame)");

            if (externalSaveData && typeof Storage !== 'undefined') {
                Storage.save('gameData', saveData);
                console.log("从外部文件加载的游戏数据已保存到本地存储");
            }

            if (typeof UI !== 'undefined') {
                if (typeof UI.updateGoldDisplay === 'function') UI.updateGoldDisplay();
                if (typeof UI.renderMainCharacter === 'function') UI.renderMainCharacter();
                if (typeof UI.renderTeam === 'function') UI.renderTeam();
            }
            
            // game:loaded 事件移至 Game.init() 末尾，确保所有异步加载完成后再触发
            // if (typeof Events !== 'undefined') {
            //     Events.emit('game:loaded', { version: this.state.version });
            // }

            return true;
        } catch (error) {
            console.error("加载游戏失败 (Game.loadGame):", error);
            return false;
        }
    },

    /**
     * 从文件加载游戏
     * @param {File} file - 存档文件
     * @returns {Promise<boolean>} 是否加载成功
     */
    loadGameFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error("未提供文件"));
                return;
            }

            if (!file.name.toLowerCase().endsWith('.zia')) {
                reject(new Error("文件格式不正确，请选择.zia格式的存档文件"));
                return;
            }

            if (typeof FileUtils === 'undefined') {
                reject(new Error("文件工具模块未加载"));
                return;
            }

            // 验证文件格式
            FileUtils.validateSaveFile(file)
                .then(isValid => {
                    if (!isValid) {
                        reject(new Error("无效的存档文件"));
                        return;
                    }

                    // 从文件加载数据
                    return FileUtils.loadFromFile(file, true);
                })
                .then(saveData => {
                    // 加载游戏数据
                    const success = this.loadGame(saveData);
                    if (success) {
                        console.log("从文件加载游戏成功");
                        resolve(true);
                    } else {
                        reject(new Error("加载游戏数据失败"));
                    }
                })
                .catch(error => {
                    console.error("从文件加载游戏失败:", error);
                    reject(error);
                });
        });
    },

    /**
     * 重置游戏
     */
    resetGame() {
        console.log("Game.resetGame方法被调用");
        try {
            console.log("开始重置游戏...");

            // 检查模块状态
            console.log("模块状态检查:", {
                Character: typeof Character !== 'undefined',
                Team: typeof Team !== 'undefined',
                Storage: typeof Storage !== 'undefined',
                UI: typeof UI !== 'undefined',
                Events: typeof Events !== 'undefined'
            });

            // 清除本地存储 - 先执行这一步，确保数据被完全清除
            if (typeof Storage !== 'undefined') {
                console.log("清除本地存储数据...");
                Storage.remove('gameData');

                // 双重检查，确保数据被清除
                const stillExists = localStorage.getItem('gameData') !== null;
                if (stillExists) {
                    console.warn("警告：gameData仍然存在，尝试强制清除");
                    localStorage.removeItem('gameData');
                }
            }

            // 重置游戏状态
            this.state = {
                isRunning: false,
                isPaused: false,
                gameTime: 0,
                lastTick: 0,
                tickRate: 1000,
                version: this.state.version,
                playerLevel: 1,
                gold: 100000,
                gems: 0,
                energy: 100,
                maxEnergy: 100,
                energyRegenRate: 1,
                lastEnergySave: 0,
                productionMultiplier: 1.0,
                progress: {
                    completedDungeons: [],
                    unlockedDungeons: ['dungeon1']
                },
                activeTeamId: null,
                unlocks: {
                    features: {
                        shop: false,
                        crafting: false,
                        dungeon: false,
                        arena: false
                    }
                },
                // 确保清除地下城进度
                currentDungeon: null
            };

            // 重置游戏统计
            this.stats = {
                battlesWon: 0,
                battlesLost: 0,
                monstersDefeated: 0,
                bossesDefeated: 0,
                resourcesCollected: 0,
                charactersRecruited: 0,
                dungeonCompletions: {}
            };

            console.log("游戏状态已重置");

            // 重置战斗系统
            if (typeof Battle !== 'undefined') {
                console.log("重置战斗系统...");
                // 清空战斗日志
                Battle.battleLog = [];
                // 重置战斗状态
                Battle.isFirstTurn = true;
                Battle.currentTurn = 0;
                Battle.currentBattle = null;
                Battle.dungeonTurn = 0;

                // 如果Battle有reset方法，调用它
                if (typeof Battle.reset === 'function') {
                    Battle.reset();
                }

                console.log("战斗系统已重置");
            }

            // 重置地下城运行器
            if (typeof DungeonRunner !== 'undefined') {
                console.log("重置地下城运行器...");
                DungeonRunner.isRunning = false;
                DungeonRunner.isPaused = false;
                DungeonRunner.currentRun = null;
                DungeonRunner.lastDungeonRecord = null;
                DungeonRunner.currentDungeonInfo = null;

                // 如果DungeonRunner有reset方法，调用它
                if (typeof DungeonRunner.reset === 'function') {
                    DungeonRunner.reset();
                }

                console.log("地下城运行器已重置");
            }

            // 重置地下城系统
            if (typeof Dungeon !== 'undefined' && typeof Dungeon.reset === 'function') {
                console.log("重置地下城系统...");
                Dungeon.reset();

                // 确保地下城当前运行被清除
                if (Dungeon.currentRun) {
                    console.warn("警告：Dungeon.currentRun仍然存在，强制清除");
                    Dungeon.currentRun = null;
                }
            }

            // 重置物品栏系统
            if (typeof Inventory !== 'undefined' && typeof Inventory.reset === 'function') {
                console.log("重置物品栏系统...");
                Inventory.reset();
            }

            // 重置武器系统 - 在角色系统重置之前执行
            if (typeof Weapon !== 'undefined') {
                console.log("重置武器系统...");
                Weapon.weapons = {};
                Weapon.weaponBoards = {};
                // 重新初始化武器系统
                if (typeof Weapon.init === 'function') {
                    Weapon.init();
                }
            }

            // 重置角色系统
            if (typeof Character !== 'undefined' && typeof Character.reset === 'function') {
                console.log("重置角色系统...");
                Character.reset();

                // 检查主角是否被清除
                const mainChar = Character.getMainCharacter();
                if (mainChar) {
                    console.warn("警告：主角未被清除，强制清除");
                    Character.characters = {};
                }

                // 检查所有角色是否有dungeonOriginalStats或战斗相关属性
                if (Character.characters) {
                    for (const characterId in Character.characters) {
                        const character = Character.characters[characterId];

                        // 清除地下城原始属性
                        if (character.dungeonOriginalStats) {
                            console.warn(`警告：角色 ${character.name} 仍有dungeonOriginalStats，强制清除`);
                            delete character.dungeonOriginalStats;
                        }

                        // 清除战斗统计
                        if (character.stats) {
                            character.stats = {
                                totalDamage: 0,
                                totalHealing: 0,
                                daCount: 0,
                                taCount: 0,
                                critCount: 0
                            };
                        }

                        // 清除战斗状态
                        if (character.hasAttacked !== undefined) {
                            delete character.hasAttacked;
                        }

                        // 清除BUFF
                        if (character.buffs) {
                            character.buffs = [];
                        }

                        // 清除技能冷却
                        if (character.skillCooldowns) {
                            character.skillCooldowns = {};
                        }

                        // 清除已应用的被动技能
                        if (character.dungeonAppliedPassives) {
                            delete character.dungeonAppliedPassives;
                        }

                        // 清除原始状态
                        if (character.originalStats) {
                            delete character.originalStats;
                        }
                    }
                }
            }

            // 重置队伍系统
            if (typeof Team !== 'undefined' && typeof Team.reset === 'function') {
                console.log("重置队伍系统...");
                Team.reset();

                // 检查队伍是否被清除
                if (Team.teams && Object.keys(Team.teams).length > 0) {
                    console.warn("警告：队伍未被清除，强制清除");
                    Team.teams = {};
                    Team.activeTeamId = null;
                }
            }

            // 重置BUFF系统
            if (typeof BuffSystem !== 'undefined' && typeof BuffSystem.reset === 'function') {
                console.log("重置BUFF系统...");
                BuffSystem.reset();
            }

            // 清除UI中的战斗日志显示
            if (typeof UI !== 'undefined') {
                console.log("清除UI中的战斗日志显示...");
                const battleLogElement = document.getElementById('main-battle-log');
                if (battleLogElement) {
                    battleLogElement.innerHTML = '';
                }
            }

            // 使用DungeonRunner的clearDungeonUI方法清除地下城UI
            if (typeof DungeonRunner !== 'undefined' && typeof DungeonRunner.clearDungeonUI === 'function') {
                console.log("使用DungeonRunner.clearDungeonUI清除地下城UI...");
                DungeonRunner.clearDungeonUI();
            }

            console.log("游戏已完全重置");

            // 切换到主屏幕
            if (typeof UI !== 'undefined' && typeof UI.switchScreen === 'function') {
                UI.switchScreen('main-screen');
            }

            // 强制显示角色创建对话框
            console.log("准备显示角色创建对话框...");

            // 创建一个简单的角色创建对话框
            const createCharacterDialog = () => {
                console.log("创建简单的角色创建对话框");

                // 检查Character模块是否可用
                console.log("Character模块状态:", {
                    isDefined: typeof Character !== 'undefined',
                    hasAddCharacter: typeof Character !== 'undefined' && typeof Character.addCharacter === 'function',
                    hasGetMainCharacter: typeof Character !== 'undefined' && typeof Character.getMainCharacter === 'function',
                    mainCharacter: typeof Character !== 'undefined' && typeof Character.getMainCharacter === 'function' ? Character.getMainCharacter() : null
                });

                // 先移除可能存在的旧对话框
                const oldOverlay = document.getElementById('character-creation-overlay');
                if (oldOverlay) oldOverlay.remove();

                const oldDialog = document.getElementById('character-creation-dialog');
                if (oldDialog) oldDialog.remove();

                // 创建遮罩层
                const overlay = document.createElement('div');
                overlay.className = 'dialog-overlay';
                overlay.id = 'character-creation-overlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                overlay.style.zIndex = '999';
                document.body.appendChild(overlay);

                // 创建对话框
                const dialog = document.createElement('div');
                dialog.className = 'dialog character-creation-dialog';
                dialog.id = 'character-creation-dialog';
                dialog.style.position = 'fixed';
                dialog.style.top = '50%';
                dialog.style.left = '50%';
                dialog.style.transform = 'translate(-50%, -50%)';
                dialog.style.backgroundColor = '#fff';
                dialog.style.padding = '20px';
                dialog.style.borderRadius = '5px';
                dialog.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
                dialog.style.zIndex = '1000';
                dialog.style.width = '400px';
                dialog.style.maxWidth = '90%';

                // 设置对话框内容
                dialog.innerHTML = `
                    <div class="dialog-header">
                        <h2>欢迎来到Zia的世界</h2>
                    </div>
                    <div class="dialog-content">
                        <p>在开始你的冒险之前，请告诉我你的名字：</p>
                        <div class="input-group">
                            <label for="character-name">角色名称：</label>
                            <input type="text" id="character-name" placeholder="输入你的名字" maxlength="12">
                        </div>
                        <div class="error-message" id="name-error" style="color: red;"></div>
                    </div>
                    <div class="dialog-buttons">
                        <button id="start-adventure" class="btn" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">开始冒险</button>
                    </div>
                `;

                // 添加到文档
                document.body.appendChild(dialog);

                // 聚焦到输入框
                setTimeout(() => {
                    const nameInput = document.getElementById('character-name');
                    if (nameInput) {
                        nameInput.focus();
                    }
                }, 100);

                // 添加按钮事件
                const startButton = document.getElementById('start-adventure');
                if (startButton) {
                    startButton.onclick = function() {
                        console.log('开始冒险按钮被点击');
                        createCharacterFromDialog();
                    };
                }

                // 添加回车键提交
                const nameInput = document.getElementById('character-name');
                if (nameInput) {
                    nameInput.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter') {
                            console.log('回车键被按下');
                            createCharacterFromDialog();
                        }
                    });
                }
            };

            // 从对话框创建角色
            const createCharacterFromDialog = () => {
                console.log('从对话框创建角色');
                const nameInput = document.getElementById('character-name');
                const errorElement = document.getElementById('name-error');

                if (!nameInput || !errorElement) {
                    console.error('找不到名称输入框或错误元素');
                    return;
                }

                const name = nameInput.value.trim();
                console.log(`输入的名称: "${name}"`);

                // 验证名称
                if (!name) {
                    errorElement.textContent = '请输入角色名称';
                    nameInput.focus();
                    return;
                }

                if (name.length < 2) {
                    errorElement.textContent = '角色名称至少需要2个字符';
                    nameInput.focus();
                    return;
                }

                // 清除错误信息
                errorElement.textContent = '';

                // 创建主角
                if (typeof Character !== 'undefined' && typeof Character.addCharacter === 'function') {
                    const characterData = {
                        name: name,
                        // 默认属性
                        attribute: 'fire',
                        type: 'attack',
                        level: 1,
                        isMainCharacter: true
                    };

                    console.log('调用Character.addCharacter方法');
                    const characterId = Character.addCharacter(characterData);

                    if (characterId) {
                        console.log(`创建主角成功: ${name} (ID: ${characterId})`);

                        // 创建初始队伍
                        if (typeof Team !== 'undefined' && typeof Team.createTeam === 'function') {
                            const teamData = {
                                name: `${name}的队伍`,
                                members: [characterId]
                            };

                            const teamId = Team.createTeam(teamData);

                            if (teamId) {
                                // 设置为活动队伍
                                this.state.activeTeamId = teamId;
                                console.log(`创建初始队伍成功: ${teamData.name} (ID: ${teamId})`);
                            }
                        }

                        // 显示欢迎消息
                        if (typeof UI !== 'undefined' && typeof UI.showNotification === 'function') {
                            UI.showNotification(`欢迎，${name}！你的冒险即将开始！`, 'success', 5000);
                        }

                        // 关闭对话框
                        const overlay = document.getElementById('character-creation-overlay');
                        if (overlay) overlay.remove();

                        const dialog = document.getElementById('character-creation-dialog');
                        if (dialog) dialog.remove();

                        // 触发角色创建完成事件
                        if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
                            Events.emit('character:created', { characterId });
                        }

                        // 保存游戏状态
                        this.saveGame();

                        // 刷新UI
                        if (typeof UI !== 'undefined' && typeof UI.switchScreen === 'function') {
                            UI.switchScreen('main-screen');
                        }
                    } else {
                        console.error('创建角色失败');
                        errorElement.textContent = '创建角色失败，请重试';
                    }
                } else {
                    console.error('Character.addCharacter方法不存在');
                    errorElement.textContent = '角色系统未就绪，请刷新页面重试';
                }
            };

            // 延迟一点时间再显示对话框，确保其他操作已完成
            console.log("即将显示角色创建对话框...");
            setTimeout(() => {
                console.log("现在显示角色创建对话框");
                createCharacterDialog();
                console.log("角色创建对话框已创建");
            }, 1000);

            if (typeof Events !== 'undefined') {
                Events.emit('game:reset');
            }
        } catch (error) {
            console.error("重置游戏失败:", error);
        }
    },

    /**
     * 获取游戏当前状态
     * @returns {object} 游戏状态对象
     */
    getState() {
        return this.state;
    },

    /**
     * 获取游戏设置
     * @returns {object} 游戏设置对象
     */
    getSettings() {
        return this.settings;
    },

    /**
     * 更新游戏设置
     * @param {object} newSettings 新的设置值
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };

        // 触发设置更新事件
        if (typeof Events !== 'undefined') {
            Events.emit('settings:updated', this.settings);
        }

        // 保存设置
        this.saveGame();

        return this.settings;
    },

    /**
     * 获取当前活动队伍
     * @returns {object|null} 队伍对象
     */
    getActiveTeam() {
        if (this.state.activeTeamId && typeof Team !== 'undefined') {
            return Team.getTeam(this.state.activeTeamId);
        }

        // 如果没有活动队伍，但有activeTeam属性，返回该属性
        if (this.activeTeam) {
            return this.activeTeam;
        }

        return null;
    },

    /**
     * 检查并修复异常的地下城状态
     * 当页面刷新或异常退出地下城时，可能会导致角色保留dungeonOriginalStats但Dungeon.currentRun为null
     */
    checkAbnormalDungeonState() {
        console.log('检查异常的地下城状态...');

        // 检查Dungeon模块是否存在
        if (typeof Dungeon === 'undefined') {
            console.log('Dungeon模块未定义，跳过检查');
            return;
        }

        // 检查是否有当前地下城运行
        const inDungeon = Dungeon.currentRun !== null && Dungeon.currentRun !== undefined && Dungeon.currentRun.dungeonId !== null;
        console.log(`当前是否在地下城中: ${inDungeon}`);

        // 检查是否有保存的地下城进度
        const hasSavedDungeon = !!(this.state && this.state.currentDungeon && Object.keys(this.state.currentDungeon || {}).length > 0);
        console.log(`是否有保存的地下城进度: ${hasSavedDungeon}`);

        // 如果保存的地下城进度是空对象，视为没有保存的地下城进度
        if (this.state && this.state.currentDungeon && Object.keys(this.state.currentDungeon).length === 0) {
            console.log('保存的地下城进度是空对象，清除它');
            delete this.state.currentDungeon;
            this.saveGame();
        }

        // 如果在地下城中但没有保存的地下城进度，保存当前地下城进度
        if (inDungeon && !hasSavedDungeon && typeof Dungeon.saveDungeonProgress === 'function') {
            console.log('检测到在地下城中但没有保存的地下城进度，保存当前地下城进度');
            Dungeon.saveDungeonProgress();
            console.log('已保存当前地下城进度');
        }
        // 如果有保存的地下城进度但Dungeon.currentRun为null，尝试加载地下城进度
        else if (hasSavedDungeon && !inDungeon && typeof Dungeon.loadDungeonProgress === 'function') {
            console.log('检测到有保存的地下城进度但不在地下城中，尝试加载地下城进度');
            const loaded = Dungeon.loadDungeonProgress();
            if (loaded) {
                console.log('成功加载地下城进度，现在在地下城中');
                return; // 成功加载地下城进度，不需要进一步处理
            } else {
                // 加载失败，清除保存的地下城进度
                console.log('地下城进度加载失败，清除保存的地下城进度');
                this.state.currentDungeon = null;
                delete this.state.currentDungeon;
                this.saveGame();

                // 强制刷新本地存储
                if (typeof Storage !== 'undefined' && typeof Storage.save === 'function') {
                    const gameData = {
                        state: this.state,
                        settings: this.settings,
                        timestamp: Date.now()
                    };
                    Storage.save('gameData', gameData);
                    console.log('已强制刷新本地存储');
                }
            }
        }

        // 如果不在地下城中，检查所有角色是否有dungeonOriginalStats
        if (!inDungeon && typeof Character !== 'undefined') {
            console.log('不在地下城中，检查所有角色是否有dungeonOriginalStats');

            const characters = Object.values(Character.characters || {});
            let abnormalStateFound = false;

            for (const character of characters) {
                if (character.dungeonOriginalStats) {
                    console.log(`检测到角色 ${character.name} 存在异常状态：有dungeonOriginalStats但不在地下城中`);
                    abnormalStateFound = true;

                    // 重置currentStats为baseStats的深拷贝
                    character.currentStats = JSON.parse(JSON.stringify(character.baseStats));

                    // 清除地下城原始属性
                    delete character.dungeonOriginalStats;

                    // 清除地下城已应用的被动技能记录
                    if (character.dungeonAppliedPassives) {
                        delete character.dungeonAppliedPassives;
                        console.log(`清除 ${character.name} 的地下城已应用被动技能记录`);
                    }

                    // 清除所有BUFF
                    if (typeof BuffSystem !== 'undefined') {
                        BuffSystem.clearAllBuffs(character);
                        console.log(`清除 ${character.name} 的所有BUFF`);
                    } else if (character.buffs) {
                        character.buffs = [];
                        console.log(`清除 ${character.name} 的所有BUFF（直接清除buffs数组）`);
                    }
                }
            }

            if (abnormalStateFound) {
                console.log('已修复异常的地下城状态');

                // 清除保存的地下城进度
                if (this.state) {
                    this.state.currentDungeon = null;
                    delete this.state.currentDungeon;
                    console.log('已清除保存的地下城进度');
                }

                // 保存游戏状态以确保修复被保存
                this.saveGame();

                // 强制刷新本地存储
                if (typeof Storage !== 'undefined' && typeof Storage.save === 'function') {
                    const gameData = {
                        state: this.state,
                        settings: this.settings,
                        timestamp: Date.now()
                    };
                    Storage.save('gameData', gameData);
                    console.log('已强制刷新本地存储');
                }

                // 更新UI显示
                if (typeof UI !== 'undefined' && typeof UI.renderMainCharacter === 'function') {
                    UI.renderMainCharacter();
                }

                if (typeof UI !== 'undefined' && typeof UI.renderTeam === 'function') {
                    UI.renderTeam();
                }
            } else {
                console.log('未检测到异常的地下城状态');
            }
        } else if (inDungeon && typeof Character !== 'undefined') {
            // 在地下城中，检查所有角色是否有dungeonOriginalStats和dungeonAppliedPassives
            console.log('在地下城中，检查所有角色是否有dungeonOriginalStats和dungeonAppliedPassives');

            const characters = Object.values(Character.characters || {});
            let needToSaveOriginalStats = false;
            let needToInitAppliedPassives = false;

            for (const character of characters) {
                // 检查是否需要保存原始属性
                if (!character.dungeonOriginalStats) {
                    console.log(`检测到角色 ${character.name} 在地下城中但没有dungeonOriginalStats，需要保存原始属性`);
                    needToSaveOriginalStats = true;
                }

                // 检查是否需要初始化已应用的被动技能记录
                if (!character.dungeonAppliedPassives) {
                    console.log(`检测到角色 ${character.name} 在地下城中但没有dungeonAppliedPassives，需要初始化`);
                    needToInitAppliedPassives = true;
                }
            }

            // 处理需要保存原始属性的情况
            if (needToSaveOriginalStats) {
                console.log('为所有角色保存地下城原始属性');
                for (const character of characters) {
                    if (!character.dungeonOriginalStats) {
                        character.dungeonOriginalStats = JSON.parse(JSON.stringify(character.baseStats));
                        console.log(`为角色 ${character.name} 保存地下城原始属性:`, character.dungeonOriginalStats);
                    }
                }
            }

            // 处理需要初始化已应用的被动技能记录的情况
            if (needToInitAppliedPassives) {
                console.log('为所有角色初始化dungeonAppliedPassives');
                for (const character of characters) {
                    if (!character.dungeonAppliedPassives) {
                        character.dungeonAppliedPassives = {};
                        console.log(`为角色 ${character.name} 初始化dungeonAppliedPassives`);
                    }
                }
            }

            // 如果有任何修改，保存游戏状态
            if (needToSaveOriginalStats || needToInitAppliedPassives) {
                // 保存游戏状态以确保修复被保存
                this.saveGame();
            }
        }
    }
};

// 注意: 队伍管理类已移至 team.js
// 这里不再定义 Team 对象，而是使用 team.js 中定义的 Team 对象

// 内部 Inventory 对象已移除，将使用从 './inventory.js' 导入的模块
window.Game = Game; // Make Game globally accessible
export default Game;