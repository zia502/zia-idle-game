/**
 * 物品系统 - 负责物品定义与功能
 */
const Item = {
    // 物品类型定义
    types: {
      INGREDIENT: 'ingredient',
      EXPERIENCE_MATERIAL: 'experience_material',
      ASCENSION_MATERIAL: 'ascension_material',
      SPECIAL_ITEM: 'special_item',
      EQUIPMENT: 'equipment', // 保留现有类型或按需调整
      CONSUMABLE: 'consumable'  // 保留现有类型或按需调整
    },
    itemDefinitions: {}, // 存储从JSON加载的物品定义

    // 物品效果类型
    effectTypes: {
        heal: { name: '治疗', description: '恢复生命值' },
        energy: { name: '能量', description: '恢复能量值' },
        buff: { name: '增益', description: '提供属性增益效果' },
        special: { name: '特殊', description: '特殊效果' }
    },
    
    /**
     * 初始化物品系统
     */
    async init() {
        console.log('物品系统初始化');
        await this.loadItemDefinitions(); // 确保在游戏初始化时调用
        
        // 如果有事件系统，注册相关事件
        if (typeof Events !== 'undefined' && typeof Events.on === 'function') {
            Events.on('item:use', this.handleItemUse.bind(this));
        }
    },

    /**
     * 从JSON文件加载物品定义
     */
    async loadItemDefinitions() {
        try {
            const response = await fetch('src/data/items_definitions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.itemDefinitions = await response.json();
            console.log('物品定义加载成功:', this.itemDefinitions);
        } catch (error) {
            console.error('加载物品定义失败:', error);
            this.itemDefinitions = {}; // 加载失败则置为空对象
        }
    },
    
    /**
     * 创建一个新物品实例
     * @param {string} itemId - 物品ID
     * @param {number} quantity - 物品数量，默认为1
     * @returns {object|null} 新物品对象或null（如果未找到定义）
     */
    createItem(itemId, quantity = 1) {
        const definition = this.itemDefinitions[itemId];
        if (!definition) {
            console.error(`创建物品失败: 未在 Item.itemDefinitions 中找到物品ID ${itemId}`);
            // 可选: 尝试从旧系统查找或返回错误
            return null;
        }

        // 基于定义创建物品实例
        const item = {
            ...definition, // 复制定义中的所有属性
            quantity: quantity
        };
        
        // 确保类型和可堆叠性正确
        if (!item.type || !this.types[item.type.toUpperCase().replace(/ /g, '_')]) {
             // 如果类型在 itemDefinitions 中但不在 Item.types 中，则记录警告或使用默认值
            console.warn(`物品 ${itemId} 的类型 "${item.type}" 在 Item.types 中未定义。`);
        }
        // stackable 属性应直接来自 definition

        return item;
    },
    
    /**
     * 获取物品数据（优先从 itemDefinitions 获取）
     * @param {string} itemId - 物品ID
     * @returns {object|null} 物品定义数据或null
     */
    getItemData(itemId) {
        if (this.itemDefinitions[itemId]) {
            return { ...this.itemDefinitions[itemId] }; // 返回副本以防意外修改
        }
        // 可选: 尝试从旧系统查找
        console.warn(`在 Item.itemDefinitions 中未找到物品数据: ${itemId}`);
        return null;
    },

    /**
     * 使用物品
     * @param {string} itemId - 物品ID
     * @param {object} target - 目标对象（角色或其他目标）
     * @returns {boolean} 是否成功使用
     */
    useItem(itemId, target) {
        // 从物品库存中获取物品实例（包含数量等信息）
        let inventoryItemInstance = null;
        if (typeof Inventory !== 'undefined' && typeof Inventory.getItem === 'function') {
            inventoryItemInstance = Inventory.getItem(itemId); // 假设 Inventory.getItem 返回的是包含数量的实例
        }
        
        if (!inventoryItemInstance || inventoryItemInstance.quantity <= 0) {
            console.error(`使用物品失败: 库存中未找到物品 ${itemId} 或数量不足`);
            return false;
        }
        
        // 检查是否可以使用该物品
        if (!this.canUseItem(item, target)) {
            console.error(`使用物品失败: 无法使用物品 ${item.name}`);
            return false;
        }
        
        // 应用物品效果
        const result = this.applyItemEffects(item, target);
        
        // 如果成功应用效果，从库存中移除物品
        if (result && typeof Inventory !== 'undefined' && typeof Inventory.removeItem === 'function') {
            Inventory.removeItem(itemId, 1);
        }
        
        return result;
    },
    
    /**
     * 检查是否可以使用物品
     * @param {object} item - 物品对象
     * @param {object} target - 目标对象
     * @returns {boolean} 是否可以使用
     */
    canUseItem(item, target) {
        // 检查物品是否存在
        if (!item) return false;
        
        // 检查是否为可使用物品（当前只有药水可以使用）
        if (item.type !== 'potion' && item.type !== 'special') {
            return false;
        }
        
        // 检查目标是否存在
        if (!target) return false;
        
        // 检查等级需求
        if (item.requiredLevel && target.level < item.requiredLevel) {
            return false;
        }
        
        // 检查战斗状态
        const inBattle = typeof Game !== 'undefined' && typeof Game.inBattle === 'function' && Game.inBattle();
        if (inBattle && !item.useInBattle) {
            return false;
        }
        
        return true;
    },
    
    /**
     * 应用物品效果
     * @param {object} item - 物品对象
     * @param {object} target - 目标对象
     * @returns {boolean} 是否成功应用
     */
    applyItemEffects(item, target) {
        if (!item || !item.effects || !target) return false;
        
        const effects = Array.isArray(item.effects) ? item.effects : [item.effects];
        
        effects.forEach(effect => {
            switch (effect.type) {
                case 'heal':
                    if (typeof target.heal === 'function') {
                        target.heal(effect.value);
                    } else if (target.hp !== undefined && target.maxHp !== undefined) {
                        target.hp = Math.min(target.hp + effect.value, target.maxHp);
                    }
                    break;
                    
                case 'mana':
                    if (typeof target.restoreMana === 'function') {
                        target.restoreMana(effect.value);
                    } else if (target.mp !== undefined && target.maxMp !== undefined) {
                        target.mp = Math.min(target.mp + effect.value, target.maxMp);
                    }
                    break;
                    
                case 'energy':
                    if (typeof target.restoreEnergy === 'function') {
                        target.restoreEnergy(effect.value);
                    } else if (target.energy !== undefined && target.maxEnergy !== undefined) {
                        target.energy = Math.min(target.energy + effect.value, target.maxEnergy);
                    }
                    break;
                    
                case 'buff':
                    if (typeof target.addBuff === 'function') {
                        target.addBuff({
                            id: effect.id || `buff_${Date.now()}`,
                            name: effect.name || item.name,
                            stat: effect.stat,
                            value: effect.value,
                            duration: effect.duration || 3
                        });
                    }
                    break;
                    
                default:
                    console.warn(`未知物品效果类型: ${effect.type}`);
                    break;
            }
        });
        
        // 触发物品使用事件
        if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
            Events.emit('item:used', {
                itemId: item.id,
                itemName: item.name,
                target: target.name || 'Unknown',
                effects: item.effects
            });
        }
        
        return true;
    },
    
    /**
     * 处理物品使用事件
     * @param {object} data - 事件数据
     */
    handleItemUse(data) {
        if (!data || !data.itemId) return;
        
        const target = data.target || (typeof Character !== 'undefined' ? Character.current : null);
        
        if (target) {
            this.useItem(data.itemId, target);
        }
    },
    
    /**
     * 获取物品展示文本
     * @param {object} item - 物品对象
     * @returns {string} 格式化的物品信息文本
     */
    getItemDisplayText(item) {
        if (!item) return '';
        
        const rarity = item.rarity || 'common'; // 假设物品定义中有rarity
        const itemDefinition = this.getItemData(item.id); // 从 itemDefinitions 获取基础定义
        const typeName = itemDefinition ? itemDefinition.type : '未知';
        const typeIcon = itemDefinition ? (this.types[typeName.toUpperCase().replace(/ /g, '_')] ? this.types[typeName.toUpperCase().replace(/ /g, '_')].icon || '?' : '?') : '?';


        let text = `<span style="color:${rarity === 'common' ? 'grey' : 'blue'}">${item.name}</span> ${typeIcon}\n`; // 简化颜色逻辑
        text += `${rarity}的${typeName}\n`;
        
        if (item.description) {
            text += `${item.description}\n`;
        }
        
        if (item.stats && Object.keys(item.stats).length > 0) {
            for (const stat in item.stats) {
                text += `${stat}: +${item.stats[stat]}\n`;
            }
        }
        
        if (item.effects && item.effects.length > 0) {
            item.effects.forEach(effect => {
                const effectType = this.effectTypes[effect.type] || { name: '效果' };
                text += `${effectType.name}: ${effect.value}\n`;
            });
        }
        
        if (item.requiredLevel && item.requiredLevel > 1) {
            text += `需要等级: ${item.requiredLevel}\n`;
        }
        
        if (item.price) { // 检查 price 是否存在
             text += `价值: ${item.price} 金币`;
        }
        
        return text;
    }
};
// 确保在Game.init或类似的地方调用 Item.init()
// 例如:
// Game.init() {
//   ...
//   await Item.init();
//   ...
// }
export default Item;