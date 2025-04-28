/**
 * 物品栏系统 - 负责管理玩家的物品
 */
const Inventory = {
    // 物品数据
    items: {},
    
    /**
     * 初始化物品栏系统
     */
    init() {
        console.log('物品栏系统初始化');
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
     * @returns {boolean} 是否成功添加
     */
    addItem(itemId, count = 1) {
        if (!itemId || count <= 0) return false;
        
        if (!this.items[itemId]) {
            this.items[itemId] = {
                id: itemId,
                count: 0
            };
        }
        
        this.items[itemId].count += count;
        console.log(`添加物品 ${itemId} x${count}`);
        
        // 如果存在事件系统，触发物品添加事件
        if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
            // 尝试从Shop获取物品信息
            let itemName = itemId;
            if (typeof Shop !== 'undefined' && typeof Shop.getItem === 'function') {
                const itemData = Shop.getItem(itemId);
                if (itemData) {
                    itemName = itemData.name;
                }
            }
            
            Events.emit('inventory:itemAdded', {
                itemId,
                itemName,
                quantity: count
            });
        }
        
        return true;
    },
    
    /**
     * 移除物品
     * @param {string} itemId - 物品ID
     * @param {number} count - 数量
     * @returns {boolean} 是否成功移除
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
        
        // 如果存在事件系统，触发物品移除事件
        if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
            // 尝试从Shop获取物品信息
            let itemName = itemId;
            if (typeof Shop !== 'undefined' && typeof Shop.getItem === 'function') {
                const itemData = Shop.getItem(itemId);
                if (itemData) {
                    itemName = itemData.name;
                }
            }
            
            Events.emit('inventory:itemRemoved', {
                itemId,
                itemName,
                quantity: count
            });
        }
        
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
     * 获取特定分类的物品
     * @param {string} category - 物品分类
     * @returns {object} 分类物品列表
     */
    getItemsByCategory(category) {
        if (!category || typeof Shop === 'undefined' || typeof Shop.getItem !== 'function') {
            return {};
        }
        
        const categoryItems = {};
        
        for (const itemId in this.items) {
            const itemData = Shop.getItem(itemId);
            if (itemData && itemData.category === category) {
                categoryItems[itemId] = this.items[itemId];
            }
        }
        
        return categoryItems;
    },
    
    /**
     * 使用物品
     * @param {string} itemId - 物品ID
     * @param {string} targetId - 目标ID（通常是角色ID）
     * @returns {boolean} 是否成功使用
     */
    useItem(itemId, targetId) {
        // 确保Shop模块存在并有useItem函数
        if (typeof Shop === 'undefined' || typeof Shop.useItem !== 'function') {
            console.error('商店模块未加载或不支持使用物品功能');
            return false;
        }
        
        // 调用Shop模块的useItem方法
        return Shop.useItem(itemId, targetId);
    },
    
    /**
     * 获取保存数据
     * @returns {object} 可用于保存的数据对象
     */
    getSaveData() {
        return {
            items: this.items
        };
    },
    
    /**
     * 加载保存的数据
     * @param {object} data - 保存的数据
     */
    loadSaveData(data) {
        if (data && data.items) {
            this.items = data.items;
        }
    },
    
    /**
     * 重置物品栏系统
     */
    reset() {
        this.items = {};
        console.log('物品栏系统已重置');
    }
}; 