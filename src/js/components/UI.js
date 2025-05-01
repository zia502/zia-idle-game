/**
 * UI模块 - 负责管理游戏界面和用户交互元素
 */
const UI = {
    /**
     * 当前活跃的屏幕
     */
    activeScreen: null,

    /**
     * 通知列表
     */
    notifications: [],

    /**
     * 初始化UI系统
     */
    init() {
        // 添加样式到文档
        const style = document.createElement('style');
        style.textContent = `
            .breakthrough-stars {
                display: inline-block;
                margin-left: 5px;
            }
            .breakthrough-stars .star {
                font-size: 16px;
                margin-right: 2px;
                text-shadow: 0 0 1px rgba(0, 0, 0, 0.3);
            }
            .weapon-details-content .breakthrough-stars .star {
                font-size: 24px;
                margin-right: 4px;
                text-shadow: 0 0 2px rgba(0, 0, 0, 0.4);
            }
            .breakthrough-stars .star.filled {
                color: gold;
                text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
            }
            .breakthrough-stars .star.final {
                color: #3498db;
                text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
            }
            .breakthrough-stars .star.empty {
                color: #ccc;
                text-shadow: 0 0 1px rgba(0, 0, 0, 0.3);
            }
            .weapon-details-content {
                background-color: #f0f7f0;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .weapon-item-content {
                height: 100%;
                width: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 5px;
                border-radius: 4px;
                border: 2px solid #ccc;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            }
            .weapon-item-content:hover {
                transform: scale(1.05);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .weapon-item-content.rarity-common {
                border-color: #9e9e9e;
                background: linear-gradient(to bottom right, #ffffff, #f5f5f5);
            }
            .weapon-item-content.rarity-3 {
                border-color: #4169e1;
                background: linear-gradient(to bottom right, #ffffff, #e3f2fd);
            }
            .weapon-item-content.rarity-4 {
                border-color: #9c27b0;
                background: linear-gradient(to bottom right, #ffffff, #f3e5f5);
            }
            .weapon-item-content.rarity-5 {
                border-color: #ffd700;
                background: linear-gradient(to bottom right, #ffffff, #fff8e1);
                box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
            }
            .weapon-icon {
                font-size: 24px;
                margin-bottom: 5px;
            }
            .weapon-level-info {
                font-size: 12px;
                text-align: center;
                color: #333;
                text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 2px;
            }
            .weapon-level {
                color: #1a237e;
                font-size: 10px;
            }
            .weapon-breakthrough {
                color: #4a148c;
                font-size: 10px;
                display: flex;
                align-items: center;
                gap: 2px;
            }
            .weapon-breakthrough .star {
                display: inline-block;
                background: url(src/assets/stars.png) no-repeat;
                width: 20px;
                height: 20px;
                margin: 0 0px;
                background-size: 44px 834px;
                background-position-x: 0;
                transform: scale(0.7);  /* 缩放显示区域到14x14 */
                transform-origin: center;
            }
            .weapon-breakthrough .star.breakthrough-0 {
                background-position-y: -763px;
            }
            .weapon-breakthrough .star.breakthrough-1,
            .weapon-breakthrough .star.breakthrough-2,
            .weapon-breakthrough .star.breakthrough-3 {
                background-position-y: -685px;
            }
            .weapon-breakthrough .star.breakthrough-4 {
                background-position-y: -790px;
            }
            .weapon-tooltip .weapon-breakthrough {
                color: #ffd700;
            }
        `;
        document.head.appendChild(style);
        
        console.log('UI系统初始化');
        this.setupEventListeners();
        this.createUIElements();

        // 初始化资源显示
        if (typeof Game !== 'undefined') {
            this.updateGoldDisplay();
        }

        // 默认显示主屏幕
        this.switchScreen('main-screen');
    },

    /**
     * 设置UI事件监听
     */
    setupEventListeners() {
        // 防止重复绑定事件
        if (this.eventsInitialized) {
            console.log('UI事件已初始化，跳过重复绑定');
            return;
        }

        console.log('初始化UI事件监听器');

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.adjustLayout();
        });

        // 添加导航按钮事件监听
        document.querySelectorAll('[data-screen]').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetScreen = e.target.getAttribute('data-screen');
                if (targetScreen) {
                    this.switchScreen(targetScreen);
                    console.log(`切换到屏幕: ${targetScreen}`);
                }
            });
        });

        // 添加保存和重置按钮事件
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            // 移除可能存在的旧事件监听器
            saveBtn.replaceWith(saveBtn.cloneNode(true));
            const newSaveBtn = document.getElementById('save-btn');

            newSaveBtn.addEventListener('click', () => {
                if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                    Game.saveGame();
                    this.showNotification('游戏已保存', 'success');
                }
            });
        }

        // 导出存档按钮
        const exportSaveBtn = document.getElementById('export-save-btn');
        if (exportSaveBtn) {
            // 移除可能存在的旧事件监听器
            exportSaveBtn.replaceWith(exportSaveBtn.cloneNode(true));
            const newExportSaveBtn = document.getElementById('export-save-btn');

            newExportSaveBtn.addEventListener('click', () => {
                if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function' &&
                    typeof FileUtils !== 'undefined') {
                    const success = Game.saveGame(true); // 传入true表示导出为文件
                    if (success) {
                        this.showNotification('游戏存档已导出', 'success');
                    } else {
                        this.showNotification('导出存档失败', 'error');
                    }
                } else {
                    this.showNotification('导出功能不可用', 'error');
                }
            });
        }

        // 载入存档按钮
        const importSaveBtn = document.getElementById('import-save-btn');
        const saveFileInput = document.getElementById('save-file-input');

        if (importSaveBtn && saveFileInput) {
            // 移除可能存在的旧事件监听器
            importSaveBtn.replaceWith(importSaveBtn.cloneNode(true));
            saveFileInput.replaceWith(saveFileInput.cloneNode(true));

            const newImportSaveBtn = document.getElementById('import-save-btn');
            const newSaveFileInput = document.getElementById('save-file-input');

            // 点击载入存档按钮时，触发文件选择
            newImportSaveBtn.addEventListener('click', () => {
                newSaveFileInput.click();
            });

            // 选择文件后，加载存档
            newSaveFileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;

                this.showLoading(true, '正在加载存档...');

                if (typeof Game !== 'undefined' && typeof Game.loadGameFromFile === 'function') {
                    Game.loadGameFromFile(file)
                        .then(() => {
                            this.showNotification('游戏存档已加载', 'success');
                            // 刷新界面
                            if (typeof UI.switchScreen === 'function') {
                                UI.switchScreen('main-screen');
                            }
                        })
                        .catch(error => {
                            this.showNotification(`加载存档失败: ${error.message}`, 'error');
                        })
                        .finally(() => {
                            this.showLoading(false);
                            // 清空文件输入，以便下次选择同一文件时也能触发change事件
                            newSaveFileInput.value = '';
                        });
                } else {
                    this.showLoading(false);
                    this.showNotification('载入功能不可用', 'error');
                }
            });
        }

        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            // 移除可能存在的旧事件监听器
            resetBtn.replaceWith(resetBtn.cloneNode(true));
            const newResetBtn = document.getElementById('reset-btn');

            newResetBtn.addEventListener('click', () => {
                if (confirm('确定要重置游戏吗？所有进度将会丢失。')) {
                    if (typeof Game !== 'undefined' && typeof Game.resetGame === 'function') {
                        Game.resetGame();
                        this.showNotification('游戏已重置', 'info');
                    }
                }
            });
        }

        // 标记事件已初始化
        this.eventsInitialized = true;
    },

    /**
     * 创建UI元素
     */
    createUIElements() {
        // 检查通知容器是否存在，不存在则创建
        if (!document.getElementById('notification-container')) {
            const notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }

        // 检查消息框是否存在，不存在则创建
        if (!document.getElementById('message-box')) {
            const messageBox = document.createElement('div');
            messageBox.id = 'message-box';
            messageBox.className = 'message-box hidden';
            document.body.appendChild(messageBox);
        }

        // 创建加载指示器
        if (!document.getElementById('loading-indicator')) {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'loading-indicator';
            loadingIndicator.className = 'loading-indicator hidden';
            loadingIndicator.innerHTML = `
                <div class="spinner"></div>
                <div class="loading-text">加载中...</div>
            `;
            document.body.appendChild(loadingIndicator);
        }
    },

    /**
     * 切换显示屏幕
     * @param {string} screenId - 屏幕元素ID
     */
    switchScreen(screenId) {
        // 检查当前是否已经在目标屏幕上
        const targetScreen = document.getElementById(screenId);
        if (!targetScreen) {
            console.warn(`屏幕 ${screenId} 不存在`);
            return;
        }

        // 如果当前屏幕已经是活跃的，不需要重复切换
        if (this.activeScreen === screenId) {
            console.log(`已经在屏幕 ${screenId} 上，无需切换`);
            return;
        }

        // 隐藏所有屏幕
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // 显示目标屏幕
        targetScreen.classList.remove('hidden');
        this.activeScreen = screenId;

        // 创建并触发自定义事件
        const screenEvent = new CustomEvent('screenChanged', {
            detail: { screen: screenId }
        });
        document.dispatchEvent(screenEvent);

        // 更新导航按钮的活跃状态
        document.querySelectorAll('.nav-button').forEach(button => {
            if (button.getAttribute('data-target') === screenId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // 如果切换到主屏幕，更新主界面UI
        if (screenId === 'main-screen' && typeof MainUI !== 'undefined') {
            try {
                // 检查JobSystem是否已就绪
                const jobSystemReady = typeof JobSystem !== 'undefined' &&
                                      typeof JobSkillsTemplate !== 'undefined' &&
                                      JobSkillsTemplate.templates;

                if (jobSystemReady) {
                    MainUI.updateMainHeroInfo();
                    MainUI.updateCurrentTeam();
                    MainUI.updateWeaponBoard();
                    MainUI.updateCurrentDungeon();
                    MainUI.updateBattleLog();
                } else {
                    console.log('JobSystem未就绪，暂不更新主界面UI');
                    // 监听JobSystem就绪事件
                    if (typeof Events !== 'undefined') {
                        Events.once('jobSystem:ready', () => {
                            console.log('JobSystem就绪，现在更新主界面UI');
                            MainUI.updateMainHeroInfo();
                            MainUI.updateCurrentTeam();
                            MainUI.updateWeaponBoard();
                            MainUI.updateCurrentDungeon();
                            MainUI.updateBattleLog();
                        });
                    }
                }
            } catch (error) {
                console.error('更新主界面时出错:', error);
            }
        }

        console.log(`切换到屏幕: ${screenId}`);
    },

    /**
     * 显示通知消息
     * @param {string} message - 通知内容
     * @param {string} type - 通知类型 (info, success, warning, error)
     * @param {number} duration - 持续时间(毫秒)
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon"></div>
            <div class="notification-message">${message}</div>
        `;

        notificationContainer.appendChild(notification);

        // 添加到通知列表
        this.notifications.push({
            element: notification,
            timestamp: Date.now(),
            duration: duration
        });

        // 显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // 设置自动消失
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
                // 从列表中移除
                const index = this.notifications.findIndex(n => n.element === notification);
                if (index !== -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }, duration);
    },

    /**
     * 显示消息框
     * @param {string} message - 消息内容
     * @param {number} duration - 持续时间(毫秒)
     */
    showMessage(message, duration = 1500) {
        const messageBox = document.getElementById('message-box');
        if (!messageBox) return;

        messageBox.textContent = message;
        messageBox.classList.remove('hidden');

        // 设置自动消失
        clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            messageBox.classList.add('hidden');
        }, duration);
    },

    /**
     * 显示加载指示器
     * @param {boolean} show - 是否显示
     * @param {string} text - 加载文本
     */
    showLoading(show = true, text = '加载中...') {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (!loadingIndicator) return;

        const loadingText = loadingIndicator.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = text;
        }

        if (show) {
            loadingIndicator.classList.remove('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
        }
    },

    /**
     * 调整界面布局
     */
    adjustLayout() {
        // 根据窗口大小调整UI布局
        const isMobile = window.innerWidth < 768;
        document.body.classList.toggle('mobile-layout', isMobile);

        // 触发布局调整事件
        Events.emit('ui:layoutChanged', { isMobile });
    },

    /**
     * 更新资源显示
     * @param {object} resources - 资源对象
     */
    updateResourceDisplay(resources) {
        const goldElement = document.getElementById('gold-display');
        if (goldElement && resources.gold !== undefined) {
            goldElement.textContent = `金币: ${resources.gold}`;
        }

        const gemElement = document.getElementById('gem-display');
        if (gemElement && resources.gems !== undefined) {
            gemElement.textContent = `宝石: ${resources.gems}`;
        }

        const energyElement = document.getElementById('energy-display');
        if (energyElement && resources.energy !== undefined) {
            energyElement.textContent = `能量: ${resources.energy}/${resources.maxEnergy}`;
        }
    },

    /**
     * 更新金币显示
     */
    updateGoldDisplay() {
        if (typeof Game !== 'undefined') {
            const goldElement = document.getElementById('gold-display');
            if (goldElement) {
                goldElement.textContent = `金币: ${Game.state.gold}`;
            }
        }
    },

    /**
     * 更新角色状态显示
     * @param {object} character - 角色对象
     */
    updateCharacterStats(character) {
        if (!character) return;

        const charContainer = document.getElementById(`character-${character.id}`);
        if (!charContainer) return;

        // 更新血量
        const hpBar = charContainer.querySelector('.hp-bar');
        if (hpBar) {
            const hpPercent = (character.currentStats.hp / character.baseStats.hp) * 100;
            hpBar.style.width = `${hpPercent}%`;
            hpBar.setAttribute('data-tooltip', `${character.currentStats.hp}/${character.baseStats.hp}`);
        }

        // 更新等级
        const levelElement = charContainer.querySelector('.character-level');
        if (levelElement) {
            levelElement.textContent = character.level;
        }

        // 更新经验条
        const expBar = charContainer.querySelector('.exp-bar');
        if (expBar) {
            const expPercent = (character.exp / Character.getExpToNextLevel(character.level)) * 100;
            expBar.style.width = `${expPercent}%`;
        }
    },

    /**
     * 渲染商店界面
     * @param {string} shopId - 商店ID
     */
    renderShop(shopId) {
        const shopContainer = document.getElementById('shop-container');
        if (!shopContainer) return;

        // 清空现有内容
        shopContainer.innerHTML = '';

        // 获取商店数据
        const shop = Shop.getShop(shopId);
        if (!shop) {
            shopContainer.innerHTML = '<div class="error-message">商店不存在</div>';
            return;
        }

        // 创建商店标题
        const shopHeader = document.createElement('div');
        shopHeader.className = 'shop-header';
        shopHeader.innerHTML = `
            <h2>${shop.name}</h2>
            <p>${shop.description}</p>
        `;
        shopContainer.appendChild(shopHeader);

        // 创建商品列表
        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'shop-items-grid';

        // 遍历商品
        Object.entries(shop.items).forEach(([itemId, shopItem]) => {
            const item = Shop.getItem(itemId);
            if (!item) return;

            const itemElement = document.createElement('div');
            itemElement.className = 'shop-item';

            const canAfford = Game.hasEnoughGold(shopItem.price);
            if (!canAfford) {
                itemElement.classList.add('cannot-afford');
            }

            if (shopItem.stock <= 0) {
                itemElement.classList.add('out-of-stock');
            }

            itemElement.innerHTML = `
                <div class="item-image">
                    <img src="${item.imgSrc || 'assets/images/items/default.png'}" alt="${item.name}">
                </div>
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <p class="item-description">${item.description}</p>
                    <div class="item-details">
                        <span class="item-price">${shopItem.price} 金币</span>
                        <span class="item-stock">库存: ${shopItem.stock}</span>
                    </div>
                </div>
                <button class="buy-button" data-item-id="${itemId}" ${(!canAfford || shopItem.stock <= 0) ? 'disabled' : ''}>
                    购买
                </button>
            `;

            itemsGrid.appendChild(itemElement);
        });

        shopContainer.appendChild(itemsGrid);

        // 添加购买事件监听
        itemsGrid.querySelectorAll('.buy-button').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.getAttribute('data-item-id');
                if (itemId) {
                    Shop.buyItem(shopId, itemId);
                    UI.renderShop(shopId); // 刷新商店显示
                }
            });
        });
    },

    /**
     * 渲染物品栏
     */
    renderInventory() {
        const inventoryContainer = document.getElementById('inventory-container');
        if (!inventoryContainer) return;

        // 清空现有内容
        inventoryContainer.innerHTML = '';

        // 获取物品栏数据
        const inventory = Inventory.getInventory();
        if (!inventory || Object.keys(inventory).length === 0) {
            inventoryContainer.innerHTML = '<div class="empty-message">物品栏为空</div>';
            return;
        }

        // 创建物品栏标题
        const inventoryHeader = document.createElement('div');
        inventoryHeader.className = 'inventory-header';
        inventoryHeader.innerHTML = `<h2>物品栏</h2>`;
        inventoryContainer.appendChild(inventoryHeader);

        // 创建物品网格
        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'inventory-items-grid';

        // 遍历物品
        Object.entries(inventory).forEach(([itemId, quantity]) => {
            const item = Shop.getItem(itemId);
            if (!item || quantity <= 0) return;

            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.setAttribute('data-item-id', itemId);

            itemElement.innerHTML = `
                <div class="item-image">
                    <img src="${item.imgSrc || 'assets/images/items/default.png'}" alt="${item.name}">
                    <span class="item-quantity">${quantity}</span>
                </div>
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <p class="item-description">${item.description}</p>
                </div>
                ${item.useInBattle ? '<button class="use-button">使用</button>' : ''}
            `;

            itemsGrid.appendChild(itemElement);
        });

        inventoryContainer.appendChild(itemsGrid);

        // 添加使用物品事件监听
        itemsGrid.querySelectorAll('.use-button').forEach(button => {
            button.addEventListener('click', function() {
                const itemElement = this.closest('.inventory-item');
                const itemId = itemElement.getAttribute('data-item-id');

                if (itemId) {
                    // 显示角色选择对话框
                    UI.showCharacterSelection(itemId);
                }
            });
        });
    },

    /**
     * 显示角色选择对话框
     * @param {string} itemId - 物品ID
     */
    showCharacterSelection(itemId) {
        // 创建对话框
        const dialog = document.createElement('div');
        dialog.className = 'character-selection-dialog';

        // 创建标题
        const title = document.createElement('h3');
        title.textContent = '选择角色';
        dialog.appendChild(title);

        // 获取队伍成员
        const team = Team.getTeamMembers();

        // 创建角色列表
        const characterList = document.createElement('div');
        characterList.className = 'character-list';

        team.forEach(characterId => {
            const character = Character.getCharacter(characterId);
            if (!character) return;

            const characterElement = document.createElement('div');
            characterElement.className = 'character-select-item';
            characterElement.setAttribute('data-character-id', characterId);

            // 显示角色信息
            characterElement.innerHTML = `
                <div class="character-avatar">
                    <img src="${character.avatarSrc || 'assets/images/characters/default.png'}" alt="${character.name}">
                </div>
                <div class="character-info">
                    <h4>${character.name}</h4>
                    <div class="stats-bar">
                        <div class="hp-display">HP: ${character.currentStats.hp}/${character.baseStats.hp}</div>
                        <div class="energy-display">能量: ${character.currentStats.energy}/${character.baseStats.energy}</div>
                    </div>
                </div>
            `;

            characterList.appendChild(characterElement);
        });

        dialog.appendChild(characterList);

        // 添加按钮
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'dialog-buttons';

        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-button';
        cancelButton.textContent = '取消';
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });

        buttonContainer.appendChild(cancelButton);
        dialog.appendChild(buttonContainer);

        // 添加角色选择事件
        characterList.querySelectorAll('.character-select-item').forEach(item => {
            item.addEventListener('click', function() {
                const characterId = this.getAttribute('data-character-id');

                // 使用物品
                Shop.useItem(itemId, characterId);

                // 关闭对话框
                document.body.removeChild(dialog);

                // 刷新物品栏显示
                UI.renderInventory();
            });
        });

        // 添加到文档
        document.body.appendChild(dialog);
    },

    /**
     * 渲染队伍角色
     */
    renderTeam() {
        const teamContainer = document.getElementById('team-container');
        if (!teamContainer) return;

        // 清空现有内容
        teamContainer.innerHTML = '';

        // 获取队伍成员
        const team = Team.getTeamMembers();

        if (!team || team.length === 0) {
            teamContainer.innerHTML = '<div class="empty-message">队伍为空</div>';
            return;
        }

        team.forEach(characterId => {
            const character = Character.getCharacter(characterId);
            if (!character) return;

            const characterElement = document.createElement('div');
            characterElement.className = 'team-character';
            characterElement.id = `character-${character.id}`;

            // 计算HP百分比
            const hpPercent = (character.currentStats.hp / character.baseStats.hp) * 100;
            // 计算经验百分比
            const expToNext = Character.getExpToNextLevel(character.level);
            const expPercent = (character.exp / expToNext) * 100;

            characterElement.innerHTML = `
                <div class="character-header">
                    <div class="character-avatar">
                        <img src="${character.avatarSrc || 'assets/images/characters/default.png'}" alt="${character.name}">
                        <div class="character-level">${character.level}</div>
                    </div>
                    <div class="character-name">${character.name}</div>
                </div>
                <div class="character-stats">
                    <div class="hp-container">
                        <div class="hp-bar" style="width: ${hpPercent}%" data-tooltip="${character.currentStats.hp}/${character.baseStats.hp}"></div>
                    </div>
                    <div class="exp-container">
                        <div class="exp-bar" style="width: ${expPercent}%"></div>
                    </div>
                    <div class="stat-values">
                        <div class="hp-value">${character.currentStats.hp}/${character.baseStats.hp}</div>
                        <div class="exp-value">${character.exp}/${expToNext}</div>
                    </div>
                </div>
                <div class="character-actions">
                    <button class="details-button" data-character-id="${character.id}">详情</button>
                </div>
            `;

            teamContainer.appendChild(characterElement);
        });

        // 添加角色详情按钮事件
        teamContainer.querySelectorAll('.details-button').forEach(button => {
            button.addEventListener('click', function() {
                const characterId = this.getAttribute('data-character-id');
                if (characterId) {
                    UI.showCharacterDetails(characterId);
                }
            });
        });
    },

    /**
     * 显示角色详情
     * @param {string} characterId - 角色ID
     */
    showCharacterDetails(characterId) {
        const character = Character.getCharacter(characterId);
        if (!character) return;

        // 创建对话框
        const dialog = document.createElement('div');
        dialog.className = 'character-details-dialog';

        // 角色基本信息
        dialog.innerHTML = `
            <div class="dialog-header">
                <h2>${character.name}</h2>
                <button class="close-button">&times;</button>
            </div>
            <div class="character-info-container">
                <div class="character-portrait">
                    <img src="${character.portraitSrc || character.avatarSrc || 'assets/images/characters/default.png'}" alt="${character.name}">
                    <div class="character-level-badge">Lv.${character.level}</div>
                </div>
                <div class="character-details">
                    <div class="stat-row">
                        <div class="stat-label">生命值</div>
                        <div class="stat-value">${character.currentStats.hp}/${character.baseStats.hp}</div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-label">攻击力</div>
                        <div class="stat-value">${character.baseStats.atk}</div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-label">防御力</div>
                        <div class="stat-value">${character.baseStats.def}</div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-label">魔法攻击</div>
                        <div class="stat-value">${character.baseStats.matk}</div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-label">魔法防御</div>
                        <div class="stat-value">${character.baseStats.mdef}</div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-label">速度</div>
                        <div class="stat-value">${character.baseStats.spd}</div>
                    </div>
                    <div class="exp-info">
                        <div class="exp-label">经验值</div>
                        <div class="exp-bar-container">
                            <div class="exp-bar" style="width: ${(character.exp / Character.getExpToNextLevel(character.level)) * 100}%"></div>
                        </div>
                        <div class="exp-value">${character.exp}/${Character.getExpToNextLevel(character.level)}</div>
                    </div>
                </div>
            </div>
            <div class="character-equipment">
                <h3>装备</h3>
                <div class="equipment-slots">
                    <div class="equipment-slot weapon-slot" data-slot="weapon">
                        ${character.equipment.weapon ?
                            `<img src="${character.equipment.weapon.imgSrc || 'assets/images/items/weapon.png'}" alt="${character.equipment.weapon.name}" data-tooltip="${character.equipment.weapon.name}">` :
                            '<div class="empty-slot">无武器</div>'}
                    </div>
                    <div class="equipment-slot armor-slot" data-slot="armor">
                        ${character.equipment.armor ?
                            `<img src="${character.equipment.armor.imgSrc || 'assets/images/items/armor.png'}" alt="${character.equipment.armor.name}" data-tooltip="${character.equipment.armor.name}">` :
                            '<div class="empty-slot">无护甲</div>'}
                    </div>
                    <div class="equipment-slot accessory-slot" data-slot="accessory">
                        ${character.equipment.accessory ?
                            `<img src="${character.equipment.accessory.imgSrc || 'assets/images/items/accessory.png'}" alt="${character.equipment.accessory.name}" data-tooltip="${character.equipment.accessory.name}">` :
                            '<div class="empty-slot">无饰品</div>'}
                    </div>
                </div>
            </div>
            <div class="character-traits">
                <h3>特性</h3>
                <div class="traits-slots">
                    ${character.traits.map((traitId, index) => {
                        const trait = traitId ? Character.traits[traitId] : null;
                        return `
                            <div class="trait-slot" data-slot="${index}">
                                ${trait ?
                                    `<div class="trait-item" data-tooltip="${trait.name}: ${trait.description}">
                                        <img src="${trait.imgSrc || 'assets/images/traits/default.png'}" alt="${trait.name}">
                                        <div class="trait-name">${trait.name}</div>
                                    </div>` :
                                    '<div class="empty-slot">空</div>'}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        // 添加到文档
        document.body.appendChild(dialog);

        // 添加关闭按钮事件
        dialog.querySelector('.close-button').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    },

    /**
     * 获取武器稀有度对应的样式类
     * @param {string} rarity - 武器稀有度
     * @returns {string} 样式类名
     */
    getRarityClass(rarity) {
        switch(rarity) {
            case 'rare':
                return 'rarity-3';
            case 'epic':
                return 'rarity-4';
            case 'legendary':
                return 'rarity-5';
            default:
                return 'rarity-common';
        }
    },

    /**
     * 获取武器类型的中文名称
     * @param {string} type - 武器类型
     * @returns {string} 中文名称
     */
    getWeaponTypeName(type) {
        const typeMap = {
            'sword': '剑',
            'knife': '刀',
            'staff': '杖',
            'bow': '弓',
            'axe': '斧',
            'spear': '枪'
        };
        return typeMap[type] || type;
    },

    /**
     * 获取武器属性的中文名称
     * @param {string} element - 武器属性
     * @returns {string} 中文名称
     */
    getWeaponElementName(element) {
        const elementMap = {
            'fire': '火',
            'water': '水',
            'earth': '土',
            'wind': '风',
            'light': '光',
            'dark': '暗'
        };
        return elementMap[element] || element;
    },

    /**
     * 获取武器技能的中文名称
     * @param {string} skillType - 技能类型
     * @returns {string} 中文名称
     */
    getWeaponSkillName(skillType) {
        const skillMap = {
            'abandon': '暴风',
            'aegis': '守护',
            'arts': '穷理',
            'beastEssence': '绝涯',
            'bladeshield': '刃界',
            'celere': '刹那',
            'convergence': '励行',
            'deathstrike': '武技',
            'devastation': '破坏',
            'dualEdge': '二手',
            'enmity': '背水',
            'essence': '攻刃',
            'fandango': '乱舞',
            'fortified': '坚守',
            'haunt': '无双',
            'heroism': '军神',
            'majesty': '神威',
            'might': '愤怒',
            'sephiraTek': '技巧',
            'sovereign': '霸道',
            'restraint': '克己',
            'spearhead': '锐锋',
            'stamina': '浑身',
            'verve': '志气'
        };
        return skillMap[skillType] || skillType;
    },

    /**
     * 获取武器突破等级的星星显示
     * @param {number} breakthrough - 突破等级
     * @param {boolean} isFinal - 是否为终突
     * @returns {string} 星星HTML
     */
    getBreakthroughStars(breakthrough = 0, isFinal = false) {
        const totalStars = 4;
        let html = '<div class="breakthrough-stars">';
        
        // 添加已突破的星星
        for (let i = 0; i < breakthrough; i++) {
            html += '<span class="star filled">★</span>';
        }
        
        // 如果是终突,添加蓝色星星
        if (isFinal) {
            html += '<span class="star final">★</span>';
            // 补充剩余空星
            for (let i = breakthrough + 1; i < totalStars; i++) {
                html += '<span class="star empty">☆</span>';
            }
        } else {
            // 补充剩余空星
            for (let i = breakthrough; i < totalStars; i++) {
                html += '<span class="star empty">☆</span>';
            }
        }
        
        html += '</div>';
        return html;
    },

    /**
     * 渲染武器库
     */
    renderWeaponInventory() {
        console.log('开始渲染武器库存...');
        const inventoryContainer = document.getElementById('weapon-inventory');
        if (!inventoryContainer) {
            console.error('找不到武器库存容器');
            return;
        }

        // 清空现有内容
        inventoryContainer.innerHTML = '';

        // 创建排序和筛选控制面板
        const controlPanel = document.createElement('div');
        controlPanel.className = 'weapon-control-panel';
        
        // 排序控制
        const sortControl = document.createElement('div');
        sortControl.className = 'sort-control';
        sortControl.innerHTML = `
            <label>排序方式：</label>
            <select id="weapon-sort-by">
                <option value="default">默认</option>
                <option value="attack">攻击力</option>
                <option value="hp">生命值</option>
                <option value="level">等级</option>
                <option value="breakthrough">突破等级</option>
                <option value="type">武器类型</option>
                <option value="element">属性</option>
            </select>
            <select id="weapon-sort-order">
                <option value="asc">升序</option>
                <option value="desc">降序</option>
            </select>
            <button id="reset-sort-btn" class="btn btn-small">重置排序</button>
        `;

        // 筛选控制
        const filterControl = document.createElement('div');
        filterControl.className = 'filter-control';
        filterControl.innerHTML = `
            <label>属性筛选：</label>
            <select id="weapon-filter-element">
                <option value="all">全部</option>
                <option value="fire">火</option>
                <option value="water">水</option>
                <option value="earth">土</option>
                <option value="wind">风</option>
                <option value="light">光</option>
                <option value="dark">暗</option>
            </select>
            <label>类型筛选：</label>
            <select id="weapon-filter-type">
                <option value="all">全部</option>
                <option value="sword">剑</option>
                <option value="knife">刀</option>
                <option value="staff">杖</option>
                <option value="bow">弓</option>
                <option value="axe">斧</option>
                <option value="spear">枪</option>
            </select>
            <button id="reset-filter-btn" class="btn btn-small">重置筛选</button>
        `;

        controlPanel.appendChild(sortControl);
        controlPanel.appendChild(filterControl);
        inventoryContainer.appendChild(controlPanel);

        // 获取所有武器
        const weapons = Weapon.getAllWeapons();
        console.log('获取到的武器列表:', weapons);
        
        if (!weapons || Object.keys(weapons).length === 0) {
            console.log('武器库为空');
            inventoryContainer.innerHTML = '<div class="empty-message">武器库为空</div>';
            return;
        }

        // 创建武器网格
        const weaponsGrid = document.createElement('div');
        weaponsGrid.className = 'weapons-grid';

        // 计算总页数
        const itemsPerPage = 36; // 6x8
        const totalItems = Object.keys(weapons).length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        let currentPage = 1;

        console.log(`武器总数: ${totalItems}, 总页数: ${totalPages}`);

        // 添加网格布局样式
        const gridStyle = document.createElement('style');
        gridStyle.textContent = `
            .weapon-control-panel {
                margin-bottom: 20px;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 5px;
                font-size: 12px;
            }
            .sort-control, .filter-control {
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .sort-control label, .filter-control label {
                white-space: nowrap;
            }
            .sort-control select, .filter-control select {
                margin-right: 5px;
                padding: 3px;
                border-radius: 3px;
                border: 1px solid #ccc;
                font-size: 12px;
            }
            .btn-small {
                padding: 3px 8px;
                font-size: 12px;
                border-radius: 3px;
                background-color: #e0e0e0;
                border: 1px solid #ccc;
                cursor: pointer;
            }
            .btn-small:hover {
                background-color: #d0d0d0;
            }
            .weapons-grid {
                display: grid;
                grid-template-columns: repeat(6, 1fr);
                grid-gap: 10px;
                padding: 10px;
                width: 600px;
                min-height: 600px;
            }
            .weapon-item {
                position: relative;
                width: 100%;
                aspect-ratio: 1;
                border: 1px solid #ccc;
                border-radius: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .weapon-item:hover {
                transform: scale(1.05);
                box-shadow: 0 0 10px rgba(0,0,0,0.2);
            }
            .weapon-item.selected {
                border-color: #4CAF50;
                box-shadow: 0 0 10px rgba(76,175,80,0.5);
            }
        `;
        document.head.appendChild(gridStyle);

        // 创建分页按钮
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination';
        const prevButton = document.createElement('button');
        prevButton.textContent = '上一页';
        prevButton.disabled = true;
        const nextButton = document.createElement('button');
        nextButton.textContent = '下一页';
        nextButton.disabled = totalPages <= 1;

        paginationContainer.appendChild(prevButton);
        paginationContainer.appendChild(nextButton);
        inventoryContainer.appendChild(paginationContainer);

        // 排序和筛选函数
        const sortAndFilterWeapons = () => {
            const sortBy = document.getElementById('weapon-sort-by').value;
            const sortOrder = document.getElementById('weapon-sort-order').value;
            const filterElement = document.getElementById('weapon-filter-element').value;
            const filterType = document.getElementById('weapon-filter-type').value;

            let sortedWeapons = Object.entries(weapons);

            // 应用筛选
            if (filterElement !== 'all') {
                sortedWeapons = sortedWeapons.filter(([_, weapon]) => weapon.element === filterElement);
            }
            if (filterType !== 'all') {
                sortedWeapons = sortedWeapons.filter(([_, weapon]) => weapon.type === filterType);
            }

            // 应用排序
            sortedWeapons.sort((a, b) => {
                const weaponA = a[1];
                const weaponB = b[1];
                let comparison = 0;

                switch(sortBy) {
                    case 'attack':
                        comparison = Weapon.calculateCurrentStats(weaponA).attack - Weapon.calculateCurrentStats(weaponB).attack;
                        break;
                    case 'hp':
                        comparison = Weapon.calculateCurrentStats(weaponA).hp - Weapon.calculateCurrentStats(weaponB).hp;
                        break;
                    case 'level':
                        comparison = weaponA.level - weaponB.level;
                        break;
                    case 'breakthrough':
                        comparison = (weaponA.breakthrough || 0) - (weaponB.breakthrough || 0);
                        break;
                    case 'type':
                        comparison = weaponA.type.localeCompare(weaponB.type);
                        break;
                    case 'element':
                        comparison = weaponA.element.localeCompare(weaponB.element);
                        break;
                    default:
                        comparison = 0;
                }

                return sortOrder === 'asc' ? comparison : -comparison;
            });

            return sortedWeapons;
        };

        // 渲染当前页的武器
        const renderCurrentPage = () => {
            console.log(`渲染第 ${currentPage} 页武器`);
            weaponsGrid.innerHTML = '';
            const sortedWeapons = sortAndFilterWeapons();
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, sortedWeapons.length);
            const currentWeapons = sortedWeapons.slice(startIndex, endIndex);

            console.log(`当前页武器范围: ${startIndex} - ${endIndex}, 数量: ${currentWeapons.length}`);

            currentWeapons.forEach(([weaponId, weapon]) => {
                console.log(`渲染武器: ${weaponId}`, weapon);
                const weaponElement = document.createElement('div');
                weaponElement.className = 'weapon-item';
                weaponElement.setAttribute('data-weapon-id', weaponId);

                const rarityClass = this.getRarityClass(weapon.rarity);
                const currentStats = Weapon.calculateCurrentStats(weapon);

                weaponElement.innerHTML = `
                    <div class="weapon-item-content ${rarityClass}">
                        <div class="weapon-icon">${weapon.name.charAt(0)}</div>
                        <div class="weapon-level-info">
                            <div class="weapon-level">Lv.${weapon.level}</div>
                            <div class="weapon-breakthrough">
                                ${Array(4).fill().map((_, index) => {
                                    const isFilled = index < (weapon.breakthrough || 0);
                                    const isFinal = weapon.breakthrough === 4;
                                    return `<div class="star ${isFinal ? 'breakthrough-4' : isFilled ? 'breakthrough-1' : 'breakthrough-0'}"></div>`;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                `;

                // 添加鼠标悬停事件
                weaponElement.addEventListener('mouseenter', (e) => {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'weapon-tooltip';
                    tooltip.innerHTML = `
                        <div class="weapon-name">${weapon.name}</div>
                        <div class="weapon-breakthrough">
                            突破等级: ${this.getBreakthroughStars(weapon.breakthrough, weapon.breakthrough === 4)}
                        </div>
                        <div class="weapon-icons">
                            <div class="weapon-type">
                                <img src="src/assets/${weaponTypeIcons[weapon.type]}" class="type-icon" alt="${weapon.type}">
                            </div>
                            <div class="weapon-element">
                                <img src="src/assets/${elementIcons[weapon.element]}" class="element-icon" alt="${weapon.element}">
                            </div>
                        </div>
                        <div class="weapon-stats">
                            <div>等级: ${weapon.level}/${Weapon.breakthroughLevels[weapon.breakthrough || 0]}</div>
                            <div>攻击: ${currentStats.attack}</div>
                            <div>生命: ${currentStats.hp}</div>
                        </div>
                        <div class="weapon-effects">
                            <div>特殊效果:</div>
                            ${weapon.specialEffects.map(effect => {
                                const isUnlocked = weapon.level >= effect.unlock;
                                return `<div class="effect-item ${isUnlocked ? 'unlocked' : 'locked'}">
                                    ${this.getWeaponSkillName(effect.type)} Lv.${effect.level}
                                    ${!isUnlocked ? '<span class="unlock-hint">(需要武器等级达到' + effect.unlock + '级)</span>' : ''}
                                </div>`;
                            }).join('')}
                        </div>
                    `;
                    tooltipContainer.innerHTML = '';
                    tooltipContainer.appendChild(tooltip);
                    tooltipContainer.style.display = 'block';
                    
                    const rect = e.target.getBoundingClientRect();
                    tooltipContainer.style.left = `${rect.left + rect.width / 2}px`;
                    tooltipContainer.style.top = `${rect.bottom + 5}px`;
                });

                weaponElement.addEventListener('mouseleave', () => {
                    tooltipContainer.style.display = 'none';
                });

                weaponElement.addEventListener('click', () => {
                    // 移除其他武器的选中状态
                    document.querySelectorAll('.weapon-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    // 添加当前武器的选中状态
                    weaponElement.classList.add('selected');
                    this.showWeaponDetails(weaponId);
                });

                weaponsGrid.appendChild(weaponElement);
            });

            // 更新分页按钮状态
            prevButton.disabled = currentPage === 1;
            nextButton.disabled = currentPage === totalPages;
        };

        // 添加排序和筛选事件监听
        document.getElementById('weapon-sort-by').addEventListener('change', () => {
            currentPage = 1;
            renderCurrentPage();
        });
        document.getElementById('weapon-sort-order').addEventListener('change', () => {
            currentPage = 1;
            renderCurrentPage();
        });
        document.getElementById('weapon-filter-element').addEventListener('change', () => {
            currentPage = 1;
            renderCurrentPage();
        });
        document.getElementById('weapon-filter-type').addEventListener('change', () => {
            currentPage = 1;
            renderCurrentPage();
        });

        // 添加分页按钮事件
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderCurrentPage();
            }
        });

        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderCurrentPage();
            }
        });

        // 创建tooltip容器
        const tooltipContainer = document.createElement('div');
        tooltipContainer.className = 'weapon-tooltip-container';
        document.body.appendChild(tooltipContainer);

        // 初始渲染
        renderCurrentPage();

        // 添加所有元素到容器
        inventoryContainer.appendChild(weaponsGrid);
        console.log('武器库存渲染完成');

        // 添加重置按钮事件监听
        document.getElementById('reset-sort-btn').addEventListener('click', () => {
            document.getElementById('weapon-sort-by').value = 'default';
            document.getElementById('weapon-sort-order').value = 'asc';
            currentPage = 1;
            renderCurrentPage();
        });

        document.getElementById('reset-filter-btn').addEventListener('click', () => {
            document.getElementById('weapon-filter-element').value = 'all';
            document.getElementById('weapon-filter-type').value = 'all';
            currentPage = 1;
            renderCurrentPage();
        });
    },

    /**
     * 显示武器详情
     * @param {string} weaponId - 武器ID
     */
    showWeaponDetails(weaponId) {
        const detailsContainer = document.getElementById('weapon-details');
        if (!detailsContainer) return;

        const weapon = Weapon.getWeapon(weaponId);
        if (!weapon) return;

        // 获取武器稀有度样式
        const rarityClass = this.getRarityClass(weapon.rarity);

        // 计算当前属性
        const currentStats = Weapon.calculateCurrentStats(weapon);

        detailsContainer.innerHTML = `
            <div class="weapon-details-content ${rarityClass}">
                <div class="weapon-header">
                    <div class="weapon-icon">
                        <img src="src/assets/${weaponTypeIcons[weapon.type]}" class="type-icon" alt="${weapon.type}">
                    </div>
                    <div class="weapon-title">
                        <h3>${weapon.name}</h3>
                        <div class="weapon-breakthrough-info">
                            ${this.getBreakthroughStars(weapon.breakthrough, weapon.breakthrough === 4)}
                        </div>
                        <div class="weapon-attributes">
                            <div class="weapon-type">
                                <img src="src/assets/${weaponTypeIcons[weapon.type]}" class="type-icon" alt="${weapon.type}">
                            </div>
                            <div class="weapon-element">
                                <img src="src/assets/${elementIcons[weapon.element]}" class="element-icon" alt="${weapon.element}">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="weapon-stats">
                    <div class="stat-row">
                        <div class="stat-label">等级</div>
                        <div class="stat-value">${weapon.level}/${Weapon.breakthroughLevels[weapon.breakthrough || 0]}</div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-label">攻击力</div>
                        <div class="stat-value">${currentStats.attack}</div>
                    </div>
                    <div class="stat-row">
                        <div class="stat-label">生命值</div>
                        <div class="stat-value">${currentStats.hp}</div>
                    </div>
                </div>
                <div class="weapon-effects">
                    <h4>特殊效果</h4>
                    ${weapon.specialEffects.map(effect => {
                        const isUnlocked = weapon.level >= effect.unlock;
                        return `
                            <div class="effect-item ${isUnlocked ? 'unlocked' : 'locked'}">
                                <div class="effect-name">${this.getWeaponSkillName(effect.type)}</div>
                                <div class="effect-level">Lv.${effect.level}</div>
                                <div class="effect-description">
                                    ${effect.description || ''}
                                    ${!isUnlocked ? '<span class="unlock-hint">(需要武器等级达到' + effect.unlock + '级)</span>' : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        // 更新强化界面的信息
        this.updateEnhancementInfo(weaponId);
    },

    /**
     * 更新强化界面信息
     * @param {string} weaponId - 武器ID
     */
    updateEnhancementInfo(weaponId) {
        const weapon = Weapon.getWeapon(weaponId);
        if (!weapon) return;

        // 更新突破信息
        document.getElementById('current-breakthrough').textContent = weapon.breakthrough || 0;
        const maxLevel = Weapon.breakthroughLevels[weapon.breakthrough || 0];
        document.getElementById('max-level').textContent = maxLevel;

        // 更新等级信息
        document.getElementById('current-level').textContent = weapon.level;
        document.getElementById('current-exp').textContent = weapon.exp;
        document.getElementById('required-exp').textContent = Weapon.calculateExpRequired(weapon.level, weapon.level + 1);

        // 绑定突破按钮事件
        const breakthroughBtn = document.getElementById('breakthrough-btn');
        breakthroughBtn.onclick = () => {
            this.showBreakthroughMaterialSelection(weaponId);
        };

        // 绑定终突按钮事件
        const finalBreakthroughBtn = document.getElementById('final-breakthrough-btn');
        finalBreakthroughBtn.onclick = () => {
            // 这里需要实现终突逻辑
            console.log('终突武器:', weaponId);
        };

        // 绑定升级按钮事件
        const upgradeBtn = document.getElementById('upgrade-btn');
        const addExpBtn = document.getElementById('add-exp-btn');
        
        // 检查是否已达到等级上限
        const isMaxLevel = weapon.level >= maxLevel;
        if (isMaxLevel) {
            upgradeBtn.disabled = true;
            addExpBtn.disabled = true;
            upgradeBtn.title = '已达到当前突破等级上限';
            addExpBtn.title = '已达到当前突破等级上限';
        } else {
            upgradeBtn.disabled = false;
            addExpBtn.disabled = false;
            upgradeBtn.title = '';
            addExpBtn.title = '';
        }

        upgradeBtn.onclick = () => {
            this.showWeaponUpgradeMaterialSelection(weaponId);
        };

        addExpBtn.onclick = () => {
            this.showWeaponUpgradeMaterialSelection(weaponId);
        };
    },

    /**
     * 显示突破材料选择框
     * @param {string} targetWeaponId - 目标武器ID
     */
    showBreakthroughMaterialSelection(targetWeaponId) {
        const targetWeapon = Weapon.getWeapon(targetWeaponId);
        if (!targetWeapon) return;

        // 计算最大可选材料数量
        const maxMaterials = 3 - (targetWeapon.breakthrough || 0);
        if (maxMaterials <= 0) {
            this.showNotification('该武器已达到最大突破等级,请使用终突功能', 'warning');
            return;
        }

        // 创建选择框容器
        const dialog = document.createElement('div');
        dialog.className = 'breakthrough-dialog';
        dialog.innerHTML = `
            <div class="breakthrough-dialog-content">
                <div class="dialog-header">
                    <h3>选择突破材料</h3>
                    <button class="close-button">&times;</button>
                </div>
                <div class="breakthrough-info">
                    <p>目标武器: ${targetWeapon.name}</p>
                    <p>当前突破等级: ${targetWeapon.breakthrough || 0}</p>
                    <p>可选材料数量: <span id="selected-count">0</span>/<span id="max-materials">${maxMaterials}</span></p>
                </div>
                <div class="material-weapons-grid">
                    ${this.renderBreakthroughMaterials(targetWeaponId)}
                </div>
                <div class="dialog-footer">
                    <button class="confirm-btn" disabled>确认突破</button>
                    <button class="cancel-btn">取消</button>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .breakthrough-dialog {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .breakthrough-dialog-content {
                background: white;
                padding: 20px;
                border-radius: 8px;
                min-width: 500px;
                max-width: 80%;
                max-height: 80vh;
                overflow-y: auto;
            }
            .dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            .close-button {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
            }
            .breakthrough-info {
                margin-bottom: 15px;
            }
            .material-weapons-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 10px;
                margin-bottom: 15px;
            }
            .material-weapon-item {
                aspect-ratio: 1;
                min-width: 80px;
                max-width: 120px;
            }
            .material-weapon-content {
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 5px;
                border-radius: 4px;
                border: 2px solid #ccc;
                cursor: pointer;
                transition: all 0.2s;
                position: relative;
            }
            .material-weapon-content:hover {
                transform: scale(1.05);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .material-weapon-item.selected .material-weapon-content {
                border: 2px solid #4169e1;
                box-shadow: 0 0 8px rgba(65, 105, 225, 0.5);
                background: rgba(65, 105, 225, 0.1);
            }
            .material-weapon-content.rarity-common {
                border-color: #9e9e9e;
                background: linear-gradient(to bottom right, #ffffff, #f5f5f5);
            }
            .material-weapon-content.rarity-3 {
                border-color: #4169e1;
                background: linear-gradient(to bottom right, #ffffff, #e3f2fd);
            }
            .material-weapon-content.rarity-4 {
                border-color: #9c27b0;
                background: linear-gradient(to bottom right, #ffffff, #f3e5f5);
            }
            .material-weapon-content.rarity-5 {
                border-color: #ffd700;
                background: linear-gradient(to bottom right, #ffffff, #fff8e1);
                box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
            }
            .material-weapon-name {
                font-size: 12px;
                text-align: center;
                color: #333;
                text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
            }
            .material-weapon-level {
                color: #1a237e;
            }
            .material-weapon-breakthrough {
                color: #4a148c;
            }
            .material-weapon-breakthrough span {
                color: #2e7d32;
            }
            .dialog-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            .dialog-footer button {
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .confirm-btn {
                background: #4CAF50;
                color: white;
                border: none;
            }
            .confirm-btn:hover:not(:disabled) {
                background: #45a049;
            }
            .confirm-btn:disabled {
                background: #cccccc;
                cursor: not-allowed;
            }
            .cancel-btn {
                background: white;
                border: 1px solid #ccc;
            }
            .cancel-btn:hover {
                background: #f5f5f5;
            }
        `;
        document.head.appendChild(style);

        // 添加到文档
        document.body.appendChild(dialog);

        // 绑定事件
        const closeBtn = dialog.querySelector('.close-button');
        const cancelBtn = dialog.querySelector('.cancel-btn');
        const confirmBtn = dialog.querySelector('.confirm-btn');
        const materialItems = dialog.querySelectorAll('.material-weapon-item');
        const selectedCountElement = dialog.querySelector('#selected-count');

        closeBtn.onclick = () => document.body.removeChild(dialog);
        cancelBtn.onclick = () => document.body.removeChild(dialog);

        // 材料选择事件
        let selectedMaterials = new Set();
        materialItems.forEach(item => {
            item.onclick = () => {
                if (item.classList.contains('disabled')) return;
                
                if (item.classList.contains('selected')) {
                    item.classList.remove('selected');
                    selectedMaterials.delete(item.dataset.weaponId);
                } else {
                    // 检查是否达到最大选择数量
                    if (selectedMaterials.size >= maxMaterials) {
                        this.showNotification(`最多只能选择${maxMaterials}把武器作为突破材料`, 'warning');
                        return;
                    }

                    // 检查武器突破等级
                    const weaponId = item.dataset.weaponId;
                    const weapon = Weapon.getWeapon(weaponId);
                    if (weapon && weapon.breakthrough > 0) {
                        // 显示确认对话框
                        const confirmDialog = document.createElement('div');
                        confirmDialog.className = 'confirm-dialog';
                        confirmDialog.innerHTML = `
                            <div class="confirm-dialog-content">
                                <div class="dialog-message">当前武器突破等级不为0，是否确认使用？</div>
                                <div class="dialog-buttons">
                                    <button class="confirm-btn">确认</button>
                                    <button class="cancel-btn">取消</button>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(confirmDialog);

                        // 添加确认按钮事件
                        confirmDialog.querySelector('.confirm-btn').onclick = () => {
                            item.classList.add('selected');
                            selectedMaterials.add(weaponId);
                            document.body.removeChild(confirmDialog);
                            // 更新选择数量显示
                            selectedCountElement.textContent = selectedMaterials.size;
                            // 更新确认按钮状态
                            confirmBtn.disabled = selectedMaterials.size === 0;
                        };

                        // 添加取消按钮事件
                        confirmDialog.querySelector('.cancel-btn').onclick = () => {
                            document.body.removeChild(confirmDialog);
                        };

                        return;
                    }

                    item.classList.add('selected');
                    selectedMaterials.add(weaponId);
                }

                // 更新选择数量显示
                selectedCountElement.textContent = selectedMaterials.size;
                // 更新确认按钮状态
                confirmBtn.disabled = selectedMaterials.size === 0;
            };

            // 添加tooltip
            item.addEventListener('mouseenter', (e) => {
                const weaponId = item.dataset.weaponId;
                const weapon = Weapon.getWeapon(weaponId);
                if (!weapon) return;

                const tooltip = document.createElement('div');
                tooltip.className = 'weapon-tooltip';
                const currentStats = Weapon.calculateCurrentStats(weapon);
                tooltip.innerHTML = `
                    <div class="weapon-name">${weapon.name}</div>
                    <div class="weapon-breakthrough">
                        突破等级: ${this.getBreakthroughStars(weapon.breakthrough, weapon.breakthrough === 4)}
                    </div>
                    <div class="weapon-icons">
                        <div class="weapon-type">
                            <img src="src/assets/${weaponTypeIcons[weapon.type]}" class="type-icon" alt="${weapon.type}">
                        </div>
                        <div class="weapon-element">
                            <img src="src/assets/${elementIcons[weapon.element]}" class="element-icon" alt="${weapon.element}">
                        </div>
                    </div>
                    <div class="weapon-stats">
                        <div>等级: ${weapon.level}/${Weapon.breakthroughLevels[weapon.breakthrough || 0]}</div>
                        <div>攻击: ${currentStats.attack}</div>
                        <div>生命: ${currentStats.hp}</div>
                    </div>
                    ${weapon.specialEffects.length > 0 ? `
                        <div class="weapon-effects">
                            <div>特殊效果:</div>
                            ${weapon.specialEffects.map(effect => {
                                const isUnlocked = weapon.level >= effect.unlock;
                                return `<div class="effect-item ${isUnlocked ? 'unlocked' : 'locked'}">
                                    ${this.getWeaponSkillName(effect.type)} Lv.${effect.level}
                                    ${!isUnlocked ? '<span class="unlock-hint">(需要武器等级达到' + effect.unlock + '级)</span>' : ''}
                                </div>`;
                            }).join('')}
                        </div>
                    ` : ''}
                `;
                tooltipContainer.innerHTML = '';
                tooltipContainer.appendChild(tooltip);
                tooltipContainer.style.display = 'block';
                
                const rect = e.target.getBoundingClientRect();
                tooltipContainer.style.left = `${rect.left + rect.width / 2}px`;
                tooltipContainer.style.top = `${rect.bottom + 5}px`;
            });

            item.addEventListener('mouseleave', () => {
                tooltipContainer.style.display = 'none';
            });
        });

        // 添加确认对话框样式
        const confirmStyle = document.createElement('style');
        confirmStyle.textContent = `
            .confirm-dialog {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .confirm-dialog-content {
                background: white;
                padding: 20px;
                border-radius: 8px;
                min-width: 300px;
                text-align: center;
            }
            .dialog-message {
                margin-bottom: 20px;
                font-size: 16px;
                color: #333;
            }
            .dialog-buttons {
                display: flex;
                justify-content: center;
                gap: 10px;
            }
            .dialog-buttons button {
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                border: none;
                font-size: 14px;
            }
            .confirm-btn {
                background: #4CAF50;
                color: white;
            }
            .cancel-btn {
                background: #f44336;
                color: white;
            }
        `;
        document.head.appendChild(confirmStyle);

        // 确认突破事件
        confirmBtn.onclick = () => {
            if (selectedMaterials.size > 0) {
                // 计算新的突破等级
                const newBreakthrough = (targetWeapon.breakthrough || 0) + selectedMaterials.size;
                if (newBreakthrough > 3) {
                    this.showNotification('突破等级不能超过3', 'error');
                    return;
                }
                
                // 先进行突破
                Weapon.breakthroughWeapon(targetWeaponId, Array.from(selectedMaterials));
                
                // 保存游戏状态
                Game.saveGame();
                
                // 刷新显示
                this.showWeaponDetails(targetWeaponId);
                this.renderWeaponInventory();
                document.body.removeChild(dialog);
                
                this.showNotification('突破成功！', 'success');
            }
        };
    },

    /**
     * 渲染突破材料列表
     * @param {string} targetWeaponId - 目标武器ID
     * @returns {string} 材料列表HTML
     */
    renderBreakthroughMaterials(targetWeaponId) {
        const targetWeapon = Weapon.getWeapon(targetWeaponId);
        if (!targetWeapon) return '';

        // 获取所有可用作材料的武器
        const materials = Object.entries(Weapon.getAllWeapons())
            .filter(([id, weapon]) => {
                // 排除目标武器自身
                if (id === targetWeaponId) return false;
                // 排除已装备的武器
                if (weapon.isEquipped) return false;
                // 只显示同名武器
                if (weapon.name !== targetWeapon.name) return false;
                return true;
            });

        if (materials.length === 0) {
            return '<div class="empty-message">没有可用的突破材料</div>';
        }

        return materials.map(([id, weapon]) => {
            const rarityClass = this.getRarityClass(weapon.rarity);
            return `
                <div class="material-weapon-item ${weapon.isEquipped ? 'disabled' : ''}" data-weapon-id="${id}">
                    <div class="material-weapon-content ${rarityClass}">
                        <div class="material-weapon-name">${weapon.name}</div>
                        <div class="material-weapon-level">Lv.${weapon.level}</div>
                        <div class="material-weapon-breakthrough"><span>突</span>${weapon.breakthrough || 0}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * 显示武器升级材料选择对话框
     * @param {string} weaponId - 目标武器ID
     */
    showWeaponUpgradeMaterialSelection(weaponId) {
        const weapon = Weapon.getWeapon(weaponId);
        if (!weapon) return;

        // 创建对话框容器
        const dialog = document.createElement('div');
        dialog.className = 'upgrade-dialog';
        dialog.innerHTML = `
            <div class="upgrade-dialog-content">
                <div class="dialog-header">
                    <h3>选择升级材料</h3>
                    <button class="close-button">&times;</button>
                </div>
                <div class="upgrade-info">
                    <p>目标武器: ${weapon.name}</p>
                    <p>当前等级: ${weapon.level}/${Weapon.breakthroughLevels[weapon.breakthrough || 0]}</p>
                    <p>当前经验: ${weapon.exp}</p>
                </div>
                <div class="material-list">
                    ${this.renderUpgradeMaterials()}
                </div>
                <div class="dialog-footer">
                    <button class="confirm-btn" disabled>确认升级</button>
                    <button class="cancel-btn">取消</button>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .upgrade-dialog {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .upgrade-dialog-content {
                background: white;
                padding: 20px;
                border-radius: 8px;
                min-width: 500px;
                max-width: 80%;
                max-height: 80vh;
                overflow-y: auto;
            }
            .dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            .close-button {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
            }
            .upgrade-info {
                margin-bottom: 15px;
            }
            .material-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 10px;
                margin-bottom: 15px;
            }
            .material-item {
                border: 1px solid #ccc;
                padding: 10px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .material-item:hover {
                border-color: #4169e1;
            }
            .material-item.selected {
                border-color: #4169e1;
                background: rgba(65, 105, 225, 0.1);
            }
            .material-item.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .material-item .exp-value {
                color: #4CAF50;
                font-weight: bold;
            }
            .material-item .quantity {
                color: #666;
                font-size: 0.9em;
            }
            .dialog-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            .dialog-footer button {
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .confirm-btn {
                background: #4CAF50;
                color: white;
                border: none;
            }
            .confirm-btn:hover:not(:disabled) {
                background: #45a049;
            }
            .confirm-btn:disabled {
                background: #cccccc;
                cursor: not-allowed;
            }
            .cancel-btn {
                background: white;
                border: 1px solid #ccc;
            }
            .cancel-btn:hover {
                background: #f5f5f5;
            }
        `;
        document.head.appendChild(style);

        // 添加到文档
        document.body.appendChild(dialog);

        // 绑定事件
        const closeBtn = dialog.querySelector('.close-button');
        const cancelBtn = dialog.querySelector('.cancel-btn');
        const confirmBtn = dialog.querySelector('.confirm-btn');
        const materialItems = dialog.querySelectorAll('.material-item');

        closeBtn.onclick = () => document.body.removeChild(dialog);
        cancelBtn.onclick = () => document.body.removeChild(dialog);

        // 材料选择事件
        let selectedMaterial = null;
        materialItems.forEach(item => {
            item.onclick = () => {
                if (item.classList.contains('disabled')) return;
                
                // 取消之前的选择
                materialItems.forEach(i => i.classList.remove('selected'));
                
                // 选择当前材料
                item.classList.add('selected');
                selectedMaterial = item.dataset.itemId;
                
                // 更新确认按钮状态
                confirmBtn.disabled = false;
            };
        });

        // 确认升级事件
        confirmBtn.onclick = () => {
            if (selectedMaterial) {
                const item = Shop.getItem(selectedMaterial);
                if (item && item.effect && item.effect.type === 'weapon_exp') {
                    // 使用材料
                    if (Inventory.removeItem(selectedMaterial)) {
                        // 升级武器
                        Weapon.upgradeWeapon(weaponId, item.effect.value);
                        this.showWeaponDetails(weaponId); // 刷新详情显示
                        this.renderWeaponInventory(); // 刷新武器列表显示
                        this.showNotification(`成功使用 ${item.name}，获得 ${item.effect.value} 点经验值`, 'success');
                    } else {
                        this.showNotification('材料数量不足', 'error');
                    }
                }
                document.body.removeChild(dialog);
            }
        };
    },

    /**
     * 渲染升级材料列表
     * @returns {string} 材料列表HTML
     */
    renderUpgradeMaterials() {
        const materials = [
            { id: 'exp_small', name: '经验上升(小)', exp: 10000 },
            { id: 'exp_medium', name: '经验上升(中)', exp: 50000 },
            { id: 'exp_large', name: '经验上升(大)', exp: 100000 }
        ];

        return materials.map(material => {
            const quantity = Inventory.getItemCount(material.id);
            return `
                <div class="material-item ${quantity <= 0 ? 'disabled' : ''}" data-item-id="${material.id}">
                    <div class="material-name">${material.name}</div>
                    <div class="exp-value">+${material.exp} 经验</div>
                    <div class="quantity">库存: ${quantity}</div>
                </div>
            `;
        }).join('');
    }
};

// 添加武器类型和属性的图标映射
const weaponTypeIcons = {
    sword: 'weapon_sword.png',
    knife: 'weapon_knife.png',
    spear: 'weapon_spear.png',
    staff: 'weapon_staff.png',
    axe: 'weapon_axe.png',
    bow: 'weapon_bow.png'
};

const elementIcons = {
    fire: 'element_fire.png',
    water: 'element_water.png',
    wind: 'element_wind.png',
    light: 'element_light.png',
    dark: 'element_dark.png',
    earth: 'element_earth.png'
};

// 获取武器类型图标HTML
function getWeaponTypeIconHtml(type) {
    const iconPath = weaponTypeIcons[type];
    return iconPath ? `<img src="src/assets/${iconPath}" class="type-icon" alt="${type}">` : type;
}

// 获取属性图标HTML
function getElementIconHtml(element) {
    const iconPath = elementIcons[element];
    return iconPath ? `<img src="src/assets/${iconPath}" class="element-icon" alt="${element}">` : element;
}

// 修改tooltip内容生成
function createWeaponTooltip(weapon) {
    const currentStats = Weapon.calculateCurrentStats(weapon);
    return `
        <div class="weapon-tooltip">
            <div class="weapon-name">${weapon.name}</div>
            <div class="weapon-icons">
                <div class="weapon-type">
                    <img src="src/assets/${weaponTypeIcons[weapon.type]}" class="type-icon" alt="${weapon.type}">
                </div>
                <div class="weapon-element">
                    <img src="src/assets/${elementIcons[weapon.element]}" class="element-icon" alt="${weapon.element}">
                </div>
            </div>
            <div class="weapon-stats">
                <div>攻击: ${currentStats.attack}</div>
                <div>生命: ${currentStats.hp}</div>
            </div>
            <div class="weapon-effects">
                ${weapon.specialEffects.map(effect => `<div>${effect.name} Lv.${effect.level}</div>`).join('')}
            </div>
        </div>
    `;
}

// 修改武器详情页面显示
function showWeaponDetails(weapon) {
    const detailsContainer = document.getElementById('weapon-details');
    if (!detailsContainer || !weapon) return;

    const currentStats = Weapon.calculateCurrentStats(weapon);
    
    detailsContainer.innerHTML = `
        <div class="weapon-details-content ${rarityClass}">
            <div class="weapon-header">
                <div class="weapon-icon">
                    ${getWeaponTypeIconHtml(weapon.type)}
                </div>
                <div class="weapon-title">
                    <h3>${weapon.name}</h3>
                    <div class="weapon-breakthrough-info">
                        ${this.getBreakthroughStars(weapon.breakthrough, weapon.breakthrough === 4)}
                    </div>
                    <div class="weapon-attributes">
                        <div class="weapon-type">
                            <img src="src/assets/${weaponTypeIcons[weapon.type]}" class="type-icon" alt="${weapon.type}">
                        </div>
                        <div class="weapon-element">
                            <img src="src/assets/${elementIcons[weapon.element]}" class="element-icon" alt="${weapon.element}">
                        </div>
                    </div>
                </div>
            </div>
            <div class="weapon-stats">
                <div class="stat-row">
                    <div class="stat-label">等级</div>
                    <div class="stat-value">${weapon.level}/${Weapon.breakthroughLevels[weapon.breakthrough || 0]}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">攻击力</div>
                    <div class="stat-value">${currentStats.attack}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">生命值</div>
                    <div class="stat-value">${currentStats.hp}</div>
                </div>
            </div>
            <div class="weapon-effects">
                <h4>特殊效果</h4>
                ${weapon.specialEffects.map(effect => {
                    const isUnlocked = weapon.level >= effect.unlock;
                    return `
                        <div class="effect-item ${isUnlocked ? 'unlocked' : 'locked'}">
                            <div class="effect-name">${this.getWeaponSkillName(effect.type)}</div>
                            <div class="effect-level">Lv.${effect.level}</div>
                            <div class="effect-description">
                                ${effect.description || ''}
                                ${!isUnlocked ? '<span class="unlock-hint">(需要武器等级达到' + effect.unlock + '级)</span>' : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}
