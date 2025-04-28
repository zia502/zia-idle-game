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
        // 隐藏所有屏幕
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // 显示目标屏幕
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
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

            console.log(`切换到屏幕: ${screenId}`);
        } else {
            console.warn(`屏幕 ${screenId} 不存在`);
        }
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
    }
};
