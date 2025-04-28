/**
 * 建筑系统 - 负责游戏中建筑的管理
 */
const Buildings = {
    // 建筑数据
    buildings: {},
    
    // 建筑定义
    definitions: {
        // 基础建筑
        hut: {
            id: 'hut',
            name: '小屋',
            description: '简单的住所，提供基础生活空间',
            category: 'housing',
            baseCost: { gold: 50 },
            costMultiplier: 1.15,
            baseProduction: { gold: 1 },
            unlocked: true,
            maxLevel: 10
        },
        farm: {
            id: 'farm',
            name: '农场',
            description: '生产食物和基础资源',
            category: 'production',
            baseCost: { gold: 100 },
            costMultiplier: 1.2,
            baseProduction: { food: 2 },
            unlocked: true,
            maxLevel: 10
        },
        mine: {
            id: 'mine',
            name: '矿场',
            description: '开采矿石和宝石',
            category: 'production',
            baseCost: { gold: 150 },
            costMultiplier: 1.25,
            baseProduction: { stone: 1, gems: 0.1 },
            unlocked: false,
            unlockCondition: () => Buildings.getBuildingLevel('hut') >= 3,
            maxLevel: 10
        }
    },
    
    /**
     * 初始化建筑系统
     */
    init() {
        // 初始化每种建筑
        for (const [id, definition] of Object.entries(this.definitions)) {
            this.buildings[id] = {
                id,
                name: definition.name,
                description: definition.description,
                category: definition.category,
                level: 0,
                owned: 0,
                efficiency: 1.0,
                unlocked: definition.unlocked || false,
                production: {}
            };
            
            // 设置生产数据
            if (definition.baseProduction) {
                for (const [resourceId, amount] of Object.entries(definition.baseProduction)) {
                    this.buildings[id].production[resourceId] = amount;
                }
            }
        }
        
        console.log('建筑系统已初始化');
    },
    
    /**
     * 获取建筑
     * @param {string} buildingId - 建筑ID
     * @returns {object|null} 建筑对象
     */
    getBuilding(buildingId) {
        return this.buildings[buildingId] || null;
    },
    
    /**
     * 获取所有建筑
     * @returns {object} 所有建筑对象
     */
    getAll() {
        return this.buildings;
    },
    
    /**
     * 获取已解锁的建筑
     * @returns {array} 已解锁的建筑数组
     */
    getUnlocked() {
        return Object.values(this.buildings).filter(building => building.unlocked);
    },
    
    /**
     * 获取建筑等级
     * @param {string} buildingId - 建筑ID
     * @returns {number} 建筑等级
     */
    getBuildingLevel(buildingId) {
        const building = this.getBuilding(buildingId);
        return building ? building.level : 0;
    },
    
    /**
     * 计算建筑升级成本
     * @param {string} buildingId - 建筑ID
     * @returns {object|null} 升级成本
     */
    getUpgradeCost(buildingId) {
        const building = this.getBuilding(buildingId);
        const definition = this.definitions[buildingId];
        
        if (!building || !definition) return null;
        
        // 检查是否达到最大等级
        if (definition.maxLevel && building.level >= definition.maxLevel) {
            return null;
        }
        
        const costs = {};
        
        // 计算升级成本
        for (const [resourceId, baseCost] of Object.entries(definition.baseCost)) {
            costs[resourceId] = Math.floor(baseCost * Math.pow(definition.costMultiplier, building.level));
        }
        
        return costs;
    },
    
    /**
     * 升级建筑
     * @param {string} buildingId - 建筑ID
     * @returns {boolean} 是否成功升级
     */
    upgradeBuilding(buildingId) {
        const building = this.getBuilding(buildingId);
        const definition = this.definitions[buildingId];
        
        if (!building || !definition || !building.unlocked) return false;
        
        // 检查是否达到最大等级
        if (definition.maxLevel && building.level >= definition.maxLevel) {
            return false;
        }
        
        // 计算升级成本
        const costs = this.getUpgradeCost(buildingId);
        
        // 检查资源是否足够
        if (!Resources.hasEnough(costs)) {
            return false;
        }
        
        // 消耗资源
        Resources.spendMultiple(costs);
        
        // 升级建筑
        building.level++;
        building.owned++;
        
        // 更新生产效率
        this.updateBuildingProduction(buildingId);
        
        // 检查解锁条件
        this.checkBuildingUnlocks();
        
        console.log(`升级建筑: ${building.name} 到 ${building.level} 级`);
        
        // 触发建筑升级事件
        if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
            Events.emit('building:upgraded', {
                buildingId,
                buildingName: building.name,
                level: building.level
            });
        }
        
        return true;
    },
    
    /**
     * 更新建筑生产
     * @param {string} buildingId - 建筑ID
     */
    updateBuildingProduction(buildingId) {
        const building = this.getBuilding(buildingId);
        const definition = this.definitions[buildingId];
        
        if (!building || !definition || !definition.baseProduction) return;
        
        // 更新生产数据
        for (const [resourceId, baseAmount] of Object.entries(definition.baseProduction)) {
            // 生产量 = 基础生产 * (1 + 等级 * 0.1) * 效率
            building.production[resourceId] = baseAmount * (1 + building.level * 0.1) * building.efficiency;
        }
    },
    
    /**
     * 检查建筑解锁条件
     */
    checkBuildingUnlocks() {
        for (const [id, definition] of Object.entries(this.definitions)) {
            const building = this.buildings[id];
            
            // 如果已解锁，跳过
            if (building.unlocked) continue;
            
            // 检查解锁条件
            if (definition.unlockCondition && definition.unlockCondition()) {
                building.unlocked = true;
                console.log(`建筑已解锁: ${building.name}`);
                
                // 触发建筑解锁事件
                if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
                    Events.emit('building:unlocked', {
                        buildingId: id,
                        buildingName: building.name
                    });
                }
                
                // 如果有UI，显示通知
                if (typeof UI !== 'undefined' && typeof UI.showNotification === 'function') {
                    UI.showNotification(`新建筑解锁: ${building.name}`);
                }
            }
        }
    },
    
    /**
     * 获取保存数据
     * @returns {object} 可用于保存的数据对象
     */
    getSaveData() {
        return {
            buildings: this.buildings
        };
    },
    
    /**
     * 加载保存的数据
     * @param {object} data - 保存的数据
     */
    loadSaveData(data) {
        if (data && data.buildings) {
            // 合并保存的数据和当前数据
            for (const [id, savedBuilding] of Object.entries(data.buildings)) {
                if (this.buildings[id]) {
                    this.buildings[id] = {
                        ...this.buildings[id],
                        level: savedBuilding.level,
                        owned: savedBuilding.owned,
                        efficiency: savedBuilding.efficiency,
                        unlocked: savedBuilding.unlocked
                    };
                    
                    // 更新生产数据
                    this.updateBuildingProduction(id);
                }
            }
        }
    },
    
    /**
     * 重置建筑系统
     */
    reset() {
        this.buildings = {};
        this.init();
    }
};
