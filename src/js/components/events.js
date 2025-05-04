/**
 * 事件模块 - 负责处理游戏中的事件监听和触发
 */
const Events = {
    /**
     * 存储所有事件监听器
     */
    listeners: {},

    /**
     * 初始化事件系统
     */
    init() {
        console.log('事件系统初始化');
        this.setupGameListeners();
    },

    /**
     * 设置游戏基础事件监听
     */
    setupGameListeners() {
        // 监听游戏加载完成事件
        this.on('game:loaded', () => {
            console.log('游戏加载完成');

            // 始终等待JobSystem就绪后再切换到主屏幕
            console.log('等待JobSystem就绪后再切换到主屏幕');

            // 监听JobSystem就绪事件
            this.once('jobSystem:ready', () => {
                console.log('JobSystem就绪，现在切换到主屏幕');

                // 确保UI系统已初始化
                if (typeof UI !== 'undefined' && typeof UI.switchScreen === 'function') {
                    // 延迟一点时间，确保技能模板数据已完全加载
                    setTimeout(() => {
                        UI.switchScreen('main-screen');
                    }, 100);
                } else {
                    console.warn('UI模块未定义，无法切换到主屏幕');
                }
            });
        });

        // 监听角色升级事件
        this.on('character:levelup', (data) => {
            const character = Character ? Character.getCharacter(data.characterId) : null;
            if (character) {
                if (typeof UI !== 'undefined' && typeof UI.showNotification === 'function') {
                    UI.showNotification(`${character.name} 升级到了 ${character.level} 级！`);

                    // 检查是否解锁了新的特性
                    if (data.unlockedTraits && data.unlockedTraits.length > 0) {
                        const traitNames = data.unlockedTraits.map(traitId =>
                            Character.traits[traitId] ? Character.traits[traitId].name : '未知特性'
                        ).join(', ');

                        UI.showNotification(`${character.name} 解锁了新特性: ${traitNames}`);
                    }
                } else {
                    console.log(`${character.name} 升级到了 ${character.level} 级！`);
                }
            }
        });

        // 监听商店解锁事件
        this.on('shop:unlock', (data) => {
            if (typeof UI !== 'undefined' && typeof UI.showNotification === 'function') {
                UI.showNotification(`解锁了新商店: ${data.shopName}`);
            } else {
                console.log(`解锁了新商店: ${data.shopName}`);
            }
        });

        // 监听物品获取事件
        this.on('inventory:itemAdded', (data) => {
            if (typeof UI !== 'undefined' && typeof UI.showNotification === 'function') {
                if (data.quantity > 1) {
                    UI.showNotification(`获得了 ${data.quantity}x ${data.itemName}`);
                } else {
                    UI.showNotification(`获得了 ${data.itemName}`);
                }
            } else {
                console.log(`获得了 ${data.quantity}x ${data.itemName}`);
            }
        });

        // 监听战斗开始事件
        this.on('battle:start', (data) => {
            if (typeof UI !== 'undefined' && typeof UI.showNotification === 'function') {
                UI.showNotification(`开始挑战 ${data.dungeonName}！`);
            } else {
                console.log(`开始挑战 ${data.dungeonName}！`);
            }
        });

        // 监听战斗结束事件
        this.on('battle:end', (data) => {
            if (typeof UI !== 'undefined' && typeof UI.showNotification === 'function') {
                if (data.victory) {
                    UI.showNotification(`击败了 ${data.dungeonName}！获得了 ${data.exp} 经验值`);
                } else {
                    UI.showNotification(`在 ${data.dungeonName} 中失败了...`);
                }
            } else {
                if (data.victory) {
                    console.log(`击败了 ${data.dungeonName}！获得了 ${data.exp} 经验值`);
                } else {
                    console.log(`在 ${data.dungeonName} 中失败了...`);
                }
            }
        });
    },

    /**
     * 添加事件监听器
     * @param {string} eventName - 事件名称
     * @param {function} callback - 回调函数
     */
    on(eventName, callback) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }

        this.listeners[eventName].push(callback);
    },

    /**
     * 移除事件监听器
     * @param {string} eventName - 事件名称
     * @param {function} callback - 回调函数
     */
    off(eventName, callback) {
        if (!this.listeners[eventName]) {
            return;
        }

        const index = this.listeners[eventName].indexOf(callback);
        if (index !== -1) {
            this.listeners[eventName].splice(index, 1);
        }
    },

    /**
     * 触发事件
     * @param {string} eventName - 事件名称
     * @param {object} data - 事件数据
     */
    emit(eventName, data = {}) {
        if (!this.listeners[eventName]) {
            return;
        }

        this.listeners[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`事件处理错误 (${eventName}):`, error);
            }
        });
    },

    /**
     * 只触发一次的事件监听
     * @param {string} eventName - 事件名称
     * @param {function} callback - 回调函数
     */
    once(eventName, callback) {
        const onceCallback = (data) => {
            callback(data);
            this.off(eventName, onceCallback);
        };

        this.on(eventName, onceCallback);
    },

    /**
     * 清除所有事件监听器
     */
    clearAll() {
        this.listeners = {};
    },

    /**
     * 清除特定事件的所有监听器
     * @param {string} eventName - 事件名称
     */
    clear(eventName) {
        if (this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
    }
};