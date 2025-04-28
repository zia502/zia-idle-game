/**
 * 商店系统 - 负责游戏中的商品交易
 */
const Shop = {
    // 商店数据
    items: {},
    
    // 商店分类
    categories: {
        weapon: { name: '武器', icon: '⚔️' },
        armor: { name: '防具', icon: '🛡️' },
        potion: { name: '药水', icon: '🧪' },
        material: { name: '材料', icon: '📦' },
        special: { name: '特殊', icon: '✨' }
    },
    
    // 商品模板
    itemTemplates: {
        // 药水类
        healing_potion_small: {
            id: 'healing_potion_small',
            name: '初级治疗药水',
            description: '恢复少量生命值',
            category: 'potion',
            basePrice: 50,
            effect: { type: 'heal', value: 20 },
            useInBattle: true,
            stackable: true,
            imgSrc: 'potion_red.png'
        },
        healing_potion_medium: {
            id: 'healing_potion_medium',
            name: '中级治疗药水',
            description: '恢复中量生命值',
            category: 'potion',
            basePrice: 120,
            effect: { type: 'heal', value: 50 },
            useInBattle: true,
            stackable: true,
            imgSrc: 'potion_red.png'
        },
        healing_potion_large: {
            id: 'healing_potion_large',
            name: '高级治疗药水',
            description: '恢复大量生命值',
            category: 'potion',
            basePrice: 300,
            effect: { type: 'heal', value: 120 },
            useInBattle: true,
            stackable: true,
            imgSrc: 'potion_red.png'
        },
        energy_potion_small: {
            id: 'energy_potion_small',
            name: '初级能量药水',
            description: '恢复少量能量',
            category: 'potion',
            basePrice: 50,
            effect: { type: 'energy', value: 10 },
            useInBattle: true,
            stackable: true,
            imgSrc: 'potion_blue.png'
        },
        energy_potion_medium: {
            id: 'energy_potion_medium',
            name: '中级能量药水',
            description: '恢复中量能量',
            category: 'potion',
            basePrice: 120,
            effect: { type: 'energy', value: 25 },
            useInBattle: true,
            stackable: true,
            imgSrc: 'potion_blue.png'
        },
        
        // 材料类
        iron_ore: {
            id: 'iron_ore',
            name: '铁矿石',
            description: '常见的铁矿石，可用于制作武器',
            category: 'material',
            basePrice: 10,
            useInBattle: false,
            stackable: true,
            imgSrc: 'ore_iron.png'
        },
        silver_ore: {
            id: 'silver_ore',
            name: '银矿石',
            description: '品质不错的银矿石，可用于制作高级武器',
            category: 'material',
            basePrice: 25,
            useInBattle: false,
            stackable: true,
            imgSrc: 'ore_silver.png'
        },
        gold_ore: {
            id: 'gold_ore',
            name: '金矿石',
            description: '稀有的金矿石，可用于制作优质武器',
            category: 'material',
            basePrice: 50,
            useInBattle: false,
            stackable: true,
            imgSrc: 'ore_gold.png'
        },
        mithril_ore: {
            id: 'mithril_ore',
            name: '秘银矿石',
            description: '传说中的秘银矿石，可用于制作传说武器',
            category: 'material',
            basePrice: 200,
            useInBattle: false,
            stackable: true,
            imgSrc: 'ore_mithril.png'
        },
        
        // 特殊物品
        dungeon_key: {
            id: 'dungeon_key',
            name: '地下城钥匙',
            description: '打开地下城隐藏宝箱的钥匙',
            category: 'special',
            basePrice: 500,
            useInBattle: false,
            stackable: true,
            imgSrc: 'key.png'
        },
        exp_scroll: {
            id: 'exp_scroll',
            name: '经验卷轴',
            description: '使用后立即获得500点经验值',
            category: 'special',
            basePrice: 1000,
            effect: { type: 'exp', value: 500 },
            useInBattle: false,
            stackable: true,
            imgSrc: 'scroll.png'
        }
    },
    
    // 商店库存 - 不同商店的商品
    inventory: {
        general_store: {
            name: '杂货店',
            description: '出售各种日常物品和药水',
            unlockRequirement: null, // 默认解锁
            items: {
                healing_potion_small: { price: 50, stock: 10, restockRate: 'daily' },
                healing_potion_medium: { price: 120, stock: 5, restockRate: 'daily' },
                energy_potion_small: { price: 50, stock: 10, restockRate: 'daily' },
                energy_potion_medium: { price: 120, stock: 5, restockRate: 'daily' }
            }
        },
        alchemist: {
            name: '炼金商店',
            description: '出售高级药水和稀有材料',
            unlockRequirement: { playerLevel: 10 },
            items: {
                healing_potion_large: { price: 300, stock: 3, restockRate: 'weekly' },
                energy_potion_medium: { price: 120, stock: 5, restockRate: 'weekly' },
                mithril_ore: { price: 200, stock: 1, restockRate: 'monthly' }
            }
        },
        blacksmith: {
            name: '铁匠铺',
            description: '出售武器和铸造材料',
            unlockRequirement: { playerLevel: 5 },
            items: {
                iron_ore: { price: 10, stock: 20, restockRate: 'daily' },
                silver_ore: { price: 25, stock: 10, restockRate: 'weekly' },
                gold_ore: { price: 50, stock: 5, restockRate: 'weekly' }
            }
        },
        rare_dealer: {
            name: '稀有商人',
            description: '出售极其稀有的物品',
            unlockRequirement: { playerLevel: 20, completedDungeon: 'ancient_ruins' },
            items: {
                dungeon_key: { price: 500, stock: 1, restockRate: 'monthly' },
                exp_scroll: { price: 1000, stock: 2, restockRate: 'monthly' },
                mithril_ore: { price: 200, stock: 3, restockRate: 'monthly' }
            }
        }
    },
    
    /**
     * 初始化商店系统
     */
    init() {
        console.log('商店系统初始化');
        
        // 初始化商店物品
        this.refreshInventory();
        
        // 将物品模板复制到items中
        for (const id in this.itemTemplates) {
            this.items[id] = {...this.itemTemplates[id]};
        }
    },
    
    /**
     * 检查商店是否解锁
     * @param {string} shopId - 商店ID
     * @returns {boolean} 是否解锁
     */
    isShopUnlocked(shopId) {
        const shop = this.inventory[shopId];
        if (!shop) return false;
        
        // 如果没有解锁要求，则默认解锁
        if (!shop.unlockRequirement) return true;
        
        // 检查玩家等级要求
        if (shop.unlockRequirement.playerLevel && 
            Game.state.playerLevel < shop.unlockRequirement.playerLevel) {
            return false;
        }
        
        // 检查已完成地下城要求
        if (shop.unlockRequirement.completedDungeon &&
            !Game.state.completedDungeons?.includes(shop.unlockRequirement.completedDungeon)) {
            return false;
        }
        
        return true;
    },
    
    /**
     * 获取所有已解锁商店
     * @returns {object} 已解锁商店列表
     */
    getUnlockedShops() {
        const unlockedShops = {};
        
        for (const shopId in this.inventory) {
            if (this.isShopUnlocked(shopId)) {
                unlockedShops[shopId] = this.inventory[shopId];
            }
        }
        
        return unlockedShops;
    },
    
    /**
     * 获取商店
     * @param {string} shopId - 商店ID
     * @returns {object|null} 商店对象
     */
    getShop(shopId) {
        return this.inventory[shopId] || null;
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
     * 购买物品
     * @param {string} shopId - 商店ID
     * @param {string} itemId - 物品ID
     * @param {number} quantity - 数量
     * @returns {boolean} 是否购买成功
     */
    buyItem(shopId, itemId, quantity = 1) {
        const shop = this.getShop(shopId);
        if (!shop || !this.isShopUnlocked(shopId)) return false;
        
        const shopItem = shop.items[itemId];
        if (!shopItem || shopItem.stock < quantity) return false;
        
        const item = this.getItem(itemId);
        if (!item) return false;
        
        const totalPrice = shopItem.price * quantity;
        
        // 检查玩家是否有足够的金币
        if (!Game.hasEnoughGold(totalPrice)) {
            if (typeof UI !== 'undefined' && typeof UI.showMessage === 'function') {
                UI.showMessage('金币不足');
            } else {
                console.log('金币不足');
            }
            return false;
        }
        
        // 扣除金币
        Game.spendGold(totalPrice);
        
        // 减少库存
        shopItem.stock -= quantity;
        
        // 添加到玩家物品栏
        Inventory.addItem(itemId, quantity);
        
        // 触发物品添加事件
        Events.emit('inventory:itemAdded', {
            itemId,
            itemName: item.name,
            quantity
        });
        
        console.log(`购买物品 ${item.name} x${quantity}`);
        return true;
    },
    
    /**
     * 出售物品
     * @param {string} itemId - 物品ID
     * @param {number} quantity - 数量
     * @returns {boolean} 是否出售成功
     */
    sellItem(itemId, quantity = 1) {
        const item = this.getItem(itemId);
        if (!item) return false;
        
        // 检查玩家是否拥有足够的物品
        if (!Inventory.hasEnoughItems(itemId, quantity)) {
            if (typeof UI !== 'undefined' && typeof UI.showMessage === 'function') {
                UI.showMessage('物品数量不足');
            } else {
                console.log('物品数量不足');
            }
            return false;
        }
        
        // 计算售价（通常是购买价的一半）
        const sellPrice = Math.floor(item.basePrice * 0.5) * quantity;
        
        // 移除物品
        Inventory.removeItem(itemId, quantity);
        
        // 增加金币
        Game.addPlayerGold(sellPrice);
        
        console.log(`出售物品 ${item.name} x${quantity} 获得 ${sellPrice} 金币`);
        return true;
    },
    
    /**
     * 刷新商店库存
     * @param {string} shopId - 商店ID，不指定则刷新所有商店
     */
    refreshInventory(shopId = null) {
        const refreshShop = (id) => {
            const shop = this.getShop(id);
            if (!shop) return;
            
            // 刷新每种物品的库存
            for (const itemId in shop.items) {
                const item = shop.items[itemId];
                
                // 根据补货速率决定是否补货
                let shouldRestock = false;
                
                switch (item.restockRate) {
                    case 'daily':
                        shouldRestock = true;
                        break;
                    case 'weekly':
                        shouldRestock = Game.state.daysPassed % 7 === 0;
                        break;
                    case 'monthly':
                        shouldRestock = Game.state.daysPassed % 30 === 0;
                        break;
                }
                
                if (shouldRestock) {
                    // 补货逻辑
                    const baseItem = this.itemTemplates[itemId];
                    const defaultStock = baseItem ? 5 : 1;
                    const maxStock = item.maxStock || defaultStock * 2;
                    
                    // 随机补货数量，但不超过最大库存
                    const restockAmount = Math.floor(Math.random() * defaultStock) + 1;
                    item.stock = Math.min(item.stock + restockAmount, maxStock);
                }
            }
            
            // 对于铁匠铺，特殊处理：根据玩家等级随机生成武器
            if (id === 'blacksmith' && this.isShopUnlocked('blacksmith')) {
                this.generateBlacksmithWeapons(shop);
            }
        };
        
        if (shopId) {
            refreshShop(shopId);
        } else {
            // 刷新所有商店
            for (const id in this.inventory) {
                refreshShop(id);
            }
        }
        
        console.log('商店库存已刷新');
    },
    
    /**
     * 为铁匠铺生成随机武器
     * @param {object} shop - 商店对象
     */
    generateBlacksmithWeapons(shop) {
        // 实际实现将在武器系统完成后开发
        // 这里只是示例代码占位
        console.log('为铁匠铺生成随机武器');
    },
    
    /**
     * 使用物品
     * @param {string} itemId - 物品ID
     * @param {string} targetId - 目标角色ID
     * @returns {boolean} 是否使用成功
     */
    useItem(itemId, targetId) {
        const item = this.getItem(itemId);
        if (!item || !item.effect) return false;
        
        // 检查玩家是否拥有该物品
        if (!Inventory.hasEnoughItems(itemId)) {
            if (typeof UI !== 'undefined' && typeof UI.showMessage === 'function') {
                UI.showMessage('没有该物品');
            } else {
                console.log('没有该物品');
            }
            return false;
        }
        
        const target = Character.getCharacter(targetId);
        if (!target) return false;
        
        let success = false;
        
        // 根据物品效果类型处理
        switch (item.effect.type) {
            case 'heal':
                // 恢复生命值
                if (target.currentStats.hp < target.baseStats.hp) {
                    const healAmount = item.effect.value;
                    target.currentStats.hp = Math.min(
                        target.currentStats.hp + healAmount,
                        target.baseStats.hp
                    );
                    success = true;
                    if (typeof UI !== 'undefined' && typeof UI.showMessage === 'function') {
                        UI.showMessage(`${target.name} 恢复了 ${healAmount} 点生命值`);
                    } else {
                        console.log(`${target.name} 恢复了 ${healAmount} 点生命值`);
                    }
                } else {
                    if (typeof UI !== 'undefined' && typeof UI.showMessage === 'function') {
                        UI.showMessage(`${target.name} 已满血，无需使用`);
                    } else {
                        console.log(`${target.name} 已满血，无需使用`);
                    }
                }
                break;
                
            case 'energy':
                // 恢复能量
                if (target.currentStats.energy < target.baseStats.energy) {
                    const energyAmount = item.effect.value;
                    target.currentStats.energy = Math.min(
                        target.currentStats.energy + energyAmount,
                        target.baseStats.energy
                    );
                    success = true;
                    if (typeof UI !== 'undefined' && typeof UI.showMessage === 'function') {
                        UI.showMessage(`${target.name} 恢复了 ${energyAmount} 点能量`);
                    } else {
                        console.log(`${target.name} 恢复了 ${energyAmount} 点能量`);
                    }
                } else {
                    if (typeof UI !== 'undefined' && typeof UI.showMessage === 'function') {
                        UI.showMessage(`${target.name} 能量已满，无需使用`);
                    } else {
                        console.log(`${target.name} 能量已满，无需使用`);
                    }
                }
                break;
                
            case 'exp':
                // 增加经验
                const expAmount = item.effect.value;
                Character.addExperience(targetId, expAmount);
                success = true;
                if (typeof UI !== 'undefined' && typeof UI.showMessage === 'function') {
                    UI.showMessage(`${target.name} 获得了 ${expAmount} 点经验值`);
                } else {
                    console.log(`${target.name} 获得了 ${expAmount} 点经验值`);
                }
                break;
        }
        
        // 如果使用成功，减少物品数量
        if (success) {
            Inventory.removeItem(itemId);
        }
        
        return success;
    },
    
    /**
     * 获取保存数据
     * @returns {object} 可以保存的数据对象
     */
    getSaveData() {
        return {
            inventory: this.inventory
        };
    },
    
    /**
     * 加载保存的数据
     * @param {object} data - 保存的数据
     */
    loadData(data) {
        if (data && data.inventory) {
            this.inventory = data.inventory;
        }
    },
    
    /**
     * 重置商店系统
     */
    reset() {
        // 恢复初始库存
        this.inventory = JSON.parse(JSON.stringify(this.inventory));
        
        // 刷新所有商店
        this.refreshInventory();
        
        console.log('商店系统已重置');
    }
}; 