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
        gold: 10000,
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
    init() {
        console.log("初始化游戏核心...");
        this.loadGame();
        this.setupEventListeners();
        this.checkUnlocks();

        // 检查活动队伍是否存在
        this.checkActiveTeam();

        // 添加初始经验材料
        if (typeof Inventory !== 'undefined' && !this.hasInitialExpMaterials) {
            Inventory.addItem('exp_small', 10);
            Inventory.addItem('exp_medium', 10);
            Inventory.addItem('exp_large', 10);
            this.hasInitialExpMaterials = true;
        }

        this.startGameLoop();

        // 触发游戏加载完成事件
        if (typeof Events !== 'undefined') {
            Events.emit('game:loaded', { version: this.state.version });
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
            console.log(`角色 ${data.name} 升级到 ${data.level} 级`);
            this.checkUnlocks();
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
     * 检查游戏解锁条件
     */
    checkUnlocks() {
        // 检查商店解锁
        if (!this.state.unlocks.features.shop && this.state.playerLevel >= 2) {
            this.state.unlocks.features.shop = true;
            this.triggerUnlock('shop');
        }

        // 检查制作系统解锁
        if (!this.state.unlocks.features.crafting && this.state.playerLevel >= 5) {
            this.state.unlocks.features.crafting = true;
            this.triggerUnlock('crafting');
        }

        // 检查地下城解锁
        if (!this.state.unlocks.features.dungeon && this.state.playerLevel >= 3) {
            this.state.unlocks.features.dungeon = true;
            this.triggerUnlock('dungeon');
        }

        // 检查竞技场解锁
        if (!this.state.unlocks.features.arena && this.state.playerLevel >= 10) {
            this.state.unlocks.features.arena = true;
            this.triggerUnlock('arena');
        }
    },

    /**
     * 触发功能解锁事件
     * @param {string} feature 解锁的功能名称
     */
    triggerUnlock(feature) {
        console.log(`解锁新功能: ${feature}`);

        if (typeof Events !== 'undefined') {
            Events.emit('game:unlock', { feature });
        }
    },

    /**
     * 增加玩家经验和等级
     * @param {number} exp 经验值
     */
    addPlayerExp(exp) {
        // 简单等级系统示例
        const expNeeded = this.state.playerLevel * 100;
        const newExp = exp + (this.state.exp || 0);

        if (newExp >= expNeeded) {
            this.state.playerLevel++;
            this.state.exp = newExp - expNeeded;

            console.log(`玩家升级到 ${this.state.playerLevel} 级!`);
            this.checkUnlocks();

            if (typeof Events !== 'undefined') {
                Events.emit('player:levelup', {
                    level: this.state.playerLevel,
                    exp: this.state.exp
                });
            }
        } else {
            this.state.exp = newExp;
        }
    },

    /**
     * 添加金币
     * @param {number} amount 金币数量
     */
    addGold(amount) {
        this.state.gold += amount;

        if (typeof Events !== 'undefined') {
            Events.emit('player:goldChanged', {
                gold: this.state.gold,
                change: amount
            });
        }

        // 更新UI显示
        const goldElement = document.getElementById('gold-display');
        if (goldElement) {
            goldElement.textContent = `金币: ${this.state.gold}`;
        }

        return this.state.gold;
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
                    : {}
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
    loadGame(externalSaveData = null) {
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
                    console.log("没有找到保存的游戏数据");
                    // 确保初始金币为10000
                    this.state.gold = 10000;

                    // 更新UI显示
                    const goldElement = document.getElementById('gold-display');
                    if (goldElement) {
                        goldElement.textContent = `金币: ${this.state.gold}`;
                    }
                    return false;
                }
            }

            // 恢复游戏状态
            this.state = { ...this.state, ...saveData.state };
            this.settings = { ...this.settings, ...saveData.settings };

            // 加载其他模块数据 - 先加载角色数据，再加载队伍数据
            if (typeof Character !== 'undefined' && saveData.character && typeof Character.loadSaveData === 'function') {
                console.log('加载角色数据');
                Character.loadSaveData(saveData.character);
            }

            if (typeof Inventory !== 'undefined' && saveData.inventory) {
                if (typeof Inventory.loadSaveData === 'function') {
                    Inventory.loadSaveData(saveData.inventory);
                } else if (typeof Inventory.loadData === 'function') {
                    Inventory.loadData(saveData.inventory);
                }
            }

            if (typeof Shop !== 'undefined' && saveData.shop && typeof Shop.loadSaveData === 'function') {
                Shop.loadSaveData(saveData.shop);
            }

            // 确保在加载角色数据后再加载队伍数据
            if (typeof Team !== 'undefined' && saveData.team && typeof Team.loadSaveData === 'function') {
                console.log('加载队伍数据');
                Team.loadSaveData(saveData.team);

                // 验证队伍成员是否存在
                if (typeof Character !== 'undefined' && Team.teams) {
                    Object.values(Team.teams).forEach(team => {
                        if (team.members && Array.isArray(team.members)) {
                            // 过滤掉不存在的角色ID
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

            console.log("游戏数据已加载");

            // 如果是从外部文件加载的，保存到本地存储
            if (externalSaveData && typeof Storage !== 'undefined') {
                Storage.save('gameData', saveData);
                console.log("从外部文件加载的游戏数据已保存到本地存储");
            }

            // 更新UI显示
            if (typeof UI !== 'undefined') {
                // 更新金币显示
                if (typeof UI.updateGoldDisplay === 'function') {
                    UI.updateGoldDisplay();
                }

                // 更新主角信息
                if (typeof UI.renderMainCharacter === 'function') {
                    UI.renderMainCharacter();
                }

                // 更新队伍显示
                if (typeof UI.renderTeam === 'function') {
                    UI.renderTeam();
                }
            }

            if (typeof Events !== 'undefined') {
                Events.emit('game:loaded', { version: this.state.version });
            }

            return true;
        } catch (error) {
            console.error("加载游戏失败:", error);
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
        try {
            console.log("开始重置游戏...");

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
                gold: 10000,
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
                }
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

            // 重置其他模块
            if (typeof Character !== 'undefined' && typeof Character.reset === 'function') {
                console.log("重置角色系统...");
                Character.reset();

                // 检查主角是否被清除
                const mainChar = Character.getMainCharacter();
                if (mainChar) {
                    console.warn("警告：主角未被清除，强制清除");
                    Character.characters = {};
                }
            }

            if (typeof Inventory !== 'undefined' && typeof Inventory.reset === 'function') {
                console.log("重置物品栏系统...");
                Inventory.reset();
            }

            if (typeof Shop !== 'undefined' && typeof Shop.reset === 'function') {
                console.log("重置商店系统...");
                Shop.reset();
            }

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

            console.log("游戏已完全重置");

            // 切换到主屏幕
            if (typeof UI !== 'undefined' && typeof UI.switchScreen === 'function') {
                UI.switchScreen('main-screen');
            }

            // 强制显示角色创建对话框
            console.log("准备显示角色创建对话框...");

            // 尝试关闭任何现有的对话框
            try {
                // 尝试使用CharacterCreation模块
                if (typeof CharacterCreation !== 'undefined') {
                    console.log("找到CharacterCreation模块");

                    if (typeof CharacterCreation.closeDialog === 'function') {
                        CharacterCreation.closeDialog();
                    }

                    // 延迟一点时间再显示对话框，确保其他操作已完成
                    setTimeout(() => {
                        try {
                            if (typeof CharacterCreation.init === 'function') {
                                console.log("强制初始化角色创建系统");
                                // 使用forceShow参数调用init方法
                                CharacterCreation.init(true);
                            } else if (typeof CharacterCreation.showCharacterCreationDialog === 'function') {
                                console.log("直接显示角色创建对话框");
                                CharacterCreation.showCharacterCreationDialog();
                            } else {
                                console.error("无法找到CharacterCreation方法，尝试使用备用方法");
                                // 尝试使用character-creator.js中的函数
                                showCharacterCreationDialog();
                            }
                        } catch (e) {
                            console.error("显示角色创建对话框时出错:", e);
                            // 尝试使用character-creator.js中的函数
                            if (typeof showCharacterCreationDialog === 'function') {
                                console.log("尝试使用备用的showCharacterCreationDialog函数");
                                showCharacterCreationDialog();
                            } else {
                                console.error("所有尝试都失败，无法显示角色创建对话框");
                                alert("重置游戏成功，请刷新页面重新开始游戏。");
                            }
                        }
                    }, 1000);
                } else {
                    console.warn("找不到CharacterCreation模块，尝试使用备用方法");

                    // 尝试使用character-creator.js中的函数
                    setTimeout(() => {
                        if (typeof showCharacterCreationDialog === 'function') {
                            console.log("使用备用的showCharacterCreationDialog函数");
                            showCharacterCreationDialog();
                        } else {
                            console.error("无法找到任何角色创建函数");
                            alert("重置游戏成功，请刷新页面重新开始游戏。");
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error("处理角色创建对话框时出错:", error);
                alert("重置游戏成功，请刷新页面重新开始游戏。");
            }

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
    }
};

// 注意: 队伍管理类已移至 team.js
// 这里不再定义 Team 对象，而是使用 team.js 中定义的 Team 对象

/**
 * 物品栏管理类
 */
const Inventory = {
    // 物品栏数据
    items: {},

    /**
     * 初始化物品栏系统
     */
    init() {
        console.log('物品栏系统已初始化');
    },

    /**
     * 获取所有物品
     * @returns {object} 所有物品对象
     */
    getAll() {
        return this.items;
    },

    /**
     * 获取物品
     * @param {string} itemId - 物品ID
     * @returns {object|null} 物品对象
     */
    getItem(itemId) {
        return this.items[itemId] || null;
    },

    /**
     * 获取物品数量
     * @param {string} itemId - 物品ID
     * @returns {number} 物品数量
     */
    getItemCount(itemId) {
        const item = this.getItem(itemId);
        return item ? item.count : 0;
    },

    /**
     * 添加物品
     * @param {string} itemId - 物品ID
     * @param {number} count - 数量
     */
    addItem(itemId, count = 1) {
        if (!itemId) return;

        if (!this.items[itemId]) {
            this.items[itemId] = {
                id: itemId,
                count: 0
            };
        }

        this.items[itemId].count += count;
        console.log(`添加物品 ${itemId} x${count}`);
    },

    /**
     * 移除物品
     * @param {string} itemId - 物品ID
     * @param {number} count - 数量
     * @returns {boolean} 是否移除成功
     */
    removeItem(itemId, count = 1) {
        const item = this.getItem(itemId);
        if (!item || item.count < count) return false;

        item.count -= count;

        // 如果数量为0，删除该物品
        if (item.count <= 0) {
            delete this.items[itemId];
        }

        console.log(`移除物品 ${itemId} x${count}`);
        return true;
    },

    /**
     * 检查是否有足够物品
     * @param {string} itemId - 物品ID
     * @param {number} count - 数量
     * @returns {boolean} 是否有足够物品
     */
    hasEnoughItems(itemId, count = 1) {
        return this.getItemCount(itemId) >= count;
    },

    /**
     * 加载物品栏数据
     * @param {object} data - 保存的物品栏数据
     */
    loadData(data) {
        if (!data) return;
        this.items = {...data};
    },

    /**
     * 重置物品栏系统
     */
    reset() {
        this.items = {};
        this.init();
    }
};