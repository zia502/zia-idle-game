/**
 * 物品系统 - 负责物品定义与功能
 */
const Item = {
    // 物品类型定义
    types: {
        potion: { name: '药水', icon: '🧪', stackable: true },
        material: { name: '材料', icon: '📦', stackable: true },
        special: { name: '特殊', icon: '✨', stackable: true }
    },
    
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
    init() {
        console.log('物品系统初始化');
        
        // 如果有事件系统，注册相关事件
        if (typeof Events !== 'undefined' && typeof Events.on === 'function') {
            Events.on('item:use', this.handleItemUse.bind(this));
        }
    },
    
    /**
     * 创建一个新物品
     * @param {object} itemData - 物品数据
     * @returns {object} 新物品对象
     */
    createItem(itemData) {
        if (!itemData || !itemData.id || !itemData.name || !itemData.type) {
            console.error('创建物品失败: 缺少必要数据');
            return null;
        }
        
        // 确保物品类型有效
        if (!this.types[itemData.type]) {
            console.error(`创建物品失败: 未知物品类型 ${itemData.type}`);
            return null;
        }
        
        // 创建物品基本结构
        const item = {
            id: itemData.id,
            name: itemData.name,
            description: itemData.description || '',
            type: itemData.type,
            rarity: itemData.rarity || 'common',
            price: itemData.price || 0,
            stackable: itemData.hasOwnProperty('stackable') ? 
                itemData.stackable : this.types[itemData.type].stackable,
            imgSrc: itemData.imgSrc || 'default_item.png',
            
            // 可选属性
            stats: itemData.stats || {},
            effects: itemData.effects || [],
            useInBattle: !!itemData.useInBattle,
            requirements: itemData.requirements || {},
            requiredLevel: itemData.requiredLevel || 1
        };
        
        return item;
    },
    
    /**
     * 使用物品
     * @param {string} itemId - 物品ID
     * @param {object} target - 目标对象（角色或其他目标）
     * @returns {boolean} 是否成功使用
     */
    useItem(itemId, target) {
        // 从物品库存中获取物品
        let item = null;
        if (typeof Shop !== 'undefined' && typeof Shop.getItem === 'function') {
            item = Shop.getItem(itemId);
        } else if (typeof Inventory !== 'undefined' && typeof Inventory.getItem === 'function') {
            const invItem = Inventory.getItem(itemId);
            if (invItem && invItem.count > 0) {
                item = invItem;
            }
        }
        
        if (!item) {
            console.error(`使用物品失败: 未找到物品 ${itemId}`);
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
        
        const rarity = this.rarities[item.rarity] || this.rarities.common;
        const type = this.types[item.type] || { name: '未知', icon: '?' };
        
        let text = `<span style="color:${rarity.color}">${item.name}</span> ${type.icon}\n`;
        text += `${rarity.name}的${type.name}\n`;
        
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
        
        text += `价值: ${item.price} 金币`;
        
        return text;
    }
}; 