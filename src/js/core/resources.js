/**
 * 资源管理系统 - 负责游戏中各种资源的管理
 */
const Resources = {
    // 资源数据
    resources: {},

    // 资源定义
    definitions: {
        gold: {
            name: '金币',
            description: '基础货币',
            icon: '💰',
            baseValue: 1,
            visible: true
        },
        gems: {
            name: '宝石',
            description: '高级货币，用于购买稀有升级',
            icon: '💎',
            baseValue: 0,
            visible: false,
            unlockCondition: () => Resources.get('gold') >= 1000
        }
    },

    /**
     * 初始化资源系统
     */
    init() {
        // 初始化每种资源
        for (const [id, definition] of Object.entries(this.definitions)) {
            this.resources[id] = {
                id,
                name: definition.name,
                description: definition.description,
                icon: definition.icon,
                amount: definition.baseValue,
                total: definition.baseValue, // 历史总量
                perSecond: 0, // 每秒产出
                unlocked: definition.visible
            };
        }

        console.log('资源系统已初始化');
    },

    /**
     * 获取资源
     * @param {string} resourceId - 资源ID
     * @returns {object} 资源对象
     */
    get(resourceId) {
        return this.resources[resourceId] || null;
    },

    /**
     * 获取所有资源
     * @returns {object} 所有资源对象
     */
    getAll() {
        return this.resources;
    },

    /**
     * 获取已解锁的资源列表
     * @returns {array} 已解锁的资源数组
     */
    getUnlocked() {
        return Object.values(this.resources).filter(resource => resource.unlocked);
    },

    /**
     * 添加资源
     * @param {string} resourceId - 资源ID
     * @param {number} amount - 数量
     * @param {boolean} addToTotal - 是否计入历史总量
     */
    add(resourceId, amount, addToTotal = true) {
        if (!this.resources[resourceId]) return;

        const resource = this.resources[resourceId];
        resource.amount += amount;

        if (addToTotal) {
            resource.total += amount;
            Game.stats.resourcesCollected += amount;
        }

        // 检查资源解锁
        this.checkResourceUnlocks();
    },

    /**
     * 减少资源
     * @param {string} resourceId - 资源ID
     * @param {number} amount - 数量
     * @returns {boolean} 是否成功减少
     */
    spend(resourceId, amount) {
        if (!this.resources[resourceId]) return false;

        const resource = this.resources[resourceId];

        // 检查是否有足够的资源
        if (resource.amount < amount) return false;

        resource.amount -= amount;
        return true;
    },

    /**
     * 检查是否有足够的资源
     * @param {object} costs - 消耗配置 {resourceId: amount, ...}
     * @returns {boolean} 是否有足够的资源
     */
    hasEnough(costs) {
        for (const [resourceId, amount] of Object.entries(costs)) {
            const resource = this.get(resourceId);
            if (!resource || resource.amount < amount) {
                return false;
            }
        }
        return true;
    },

    /**
     * 消耗多种资源
     * @param {object} costs - 消耗配置 {resourceId: amount, ...}
     * @returns {boolean} 是否成功消耗
     */
    spendMultiple(costs) {
        // 首先检查是否有足够的资源
        if (!this.hasEnough(costs)) return false;

        // 消耗资源
        for (const [resourceId, amount] of Object.entries(costs)) {
            this.spend(resourceId, amount);
        }

        return true;
    },

    /**
     * 计算资源产出速率
     */
    calculateRates() {
        // 重置所有资源的产出速率
        for (const resource of Object.values(this.resources)) {
            resource.perSecond = 0;
        }

        // 根据建筑计算产出速率
        if (typeof Buildings !== 'undefined' && typeof Buildings.getAll === 'function') {
            const buildings = Buildings.getAll();
            for (const building of Object.values(buildings)) {
                if (building.owned > 0 && building.production) {
                    for (const [resourceId, rate] of Object.entries(building.production)) {
                        const resource = this.get(resourceId);
                        if (resource) {
                            // 建筑数量 * 基础产出 * 建筑有效性 * 全局生产系数
                            const productionMultiplier = (typeof Game !== 'undefined' && Game.state && Game.state.productionMultiplier) ? Game.state.productionMultiplier : 1.0;
                            resource.perSecond += building.owned * rate * building.efficiency * productionMultiplier;
                        }
                    }
                }
            }
        }
    },

    /**
     * 检查资源解锁条件
     */
    checkResourceUnlocks() {
        for (const [id, definition] of Object.entries(this.definitions)) {
            const resource = this.resources[id];

            // 如果已解锁，跳过
            if (resource.unlocked) continue;

            // 检查解锁条件
            if (definition.unlockCondition && definition.unlockCondition()) {
                resource.unlocked = true;
                console.log(`资源已解锁: ${resource.name}`);
                UI.showNotification(`新资源解锁: ${resource.name}`);
            }
        }
    },

    /**
     * 更新资源产出
     * @param {number} deltaTime - 时间差（秒）
     */
    update(deltaTime) {
        // 更新资源产出速率
        this.calculateRates();

        // 应用产出
        for (const resource of Object.values(this.resources)) {
            if (resource.perSecond !== 0) {
                this.add(resource.id, resource.perSecond * deltaTime);
            }
        }
    },

    /**
     * 加载资源数据
     * @param {object} data - 保存的资源数据
     */
    loadData(data) {
        if (!data) return;

        for (const [id, savedResource] of Object.entries(data)) {
            if (this.resources[id]) {
                // 保留资源定义，仅更新数据
                this.resources[id] = {
                    ...this.resources[id],
                    amount: savedResource.amount,
                    total: savedResource.total,
                    unlocked: savedResource.unlocked
                };
            }
        }
    },

    /**
     * 重置资源系统
     */
    reset() {
        this.init();
    }
};