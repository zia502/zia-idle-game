/**
 * 物品栏系统 - 负责管理玩家的物品
 */
import Item from './item.js';
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

        const itemData = Item.getItemData(itemId); // 从 Item 模块获取物品定义

        if (!itemData) {
            console.error(`添加物品失败: 未找到物品定义 ${itemId}`);
            return false;
        }

        if (this.items[itemId]) { // 如果物品已存在
            if (itemData.stackable) {
                this.items[itemId].count += count;
            } else {
                // 不可堆叠物品，可以考虑创建新条目或报错/忽略
                // 为简单起见，这里假设不可堆叠物品如果已存在则不增加（或每个都是独立实例，这需要更复杂的库存结构）
                // 当前逻辑：如果不可堆叠且已存在，则不增加数量，但仍返回true表示操作尝试过
                console.warn(`尝试向库存添加已存在的不可堆叠物品 ${itemId}。数量未增加。`);
            }
        } else { // 如果物品不存在，创建新条目
            this.items[itemId] = {
                id: itemId,
                name: itemData.name, // 从物品定义获取
                type: itemData.type, // 从物品定义获取
                icon: itemData.icon, // 从物品定义获取
                stackable: itemData.stackable, // 从物品定义获取
                description: itemData.description, // 从物品定义获取
                // 根据需要添加其他从 itemData 获取的属性
                count: count
            };
        }
        
        console.log(`添加物品 ${this.items[itemId].name || itemId} x${count}`);
        
        // 如果存在事件系统，触发物品添加事件
        if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
            Events.emit('inventory:itemAdded', {
                itemId,
                itemName: this.items[itemId].name || itemId,
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
        const itemName = item.name || itemId; // 获取物品名称用于日志
        
        // 如果数量为0，删除该物品
        if (item.count <= 0) {
            delete this.items[itemId];
        }
        
        console.log(`移除物品 ${itemName} x${count}`);
        
        // 如果存在事件系统，触发物品移除事件
        if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
            Events.emit('inventory:itemRemoved', {
                itemId,
                itemName: itemName,
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
     * @param {string} type - 物品类型 (来自 Item.types)
     * @returns {object} 分类物品列表
     */
    getItemsByType(type) {
        if (!type) {
            return {};
        }
        
        const typeItems = {};
        for (const itemId in this.items) {
            // 物品实例中应包含 type 信息
            if (this.items[itemId].type === type) {
                typeItems[itemId] = this.items[itemId];
            }
        }
        return typeItems;
    },
    
    /**
     * 使用物品 (此方法现在应直接调用 Item.useItem)
     * @param {string} itemId - 物品ID
     * @param {object} target - 目标对象
     * @returns {boolean} 是否成功使用
     */
    useItem(itemId, target) {
        // 确保 Item 模块存在并有 useItem 函数
        if (typeof Item === 'undefined' || typeof Item.useItem !== 'function') {
            console.error('物品模块未加载或不支持使用物品功能');
            return false;
        }
        
        // 调用 Item 模块的 useItem 方法
        // Item.useItem 内部会处理从库存中消耗物品的逻辑
        return Item.useItem(itemId, target);
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
export default Inventory;