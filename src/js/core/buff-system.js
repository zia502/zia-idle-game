/**
 * BUFF系统 - 负责游戏中的BUFF效果管理
 */
const BuffSystem = {
    /**
     * BUFF类型定义
     */
    buffTypes: {
        // 攻击相关
        attackUp: {
            name: '攻击力提升',
            description: '提高攻击力',
            icon: '⚔️',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        attackDown: {
            name: '攻击力下降',
            description: '降低攻击力',
            icon: '⚔️❌',
            isPositive: false,
            canDispel: true,
            stackable: true
        },

        // 防御相关
        defenseUp: {
            name: '防御力提升',
            description: '提高防御力',
            icon: '🛡️',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        defenseDown: {
            name: '防御力下降',
            description: '降低防御力',
            icon: '🛡️❌',
            isPositive: false,
            canDispel: true,
            stackable: true
        },

        // 速度相关
        speedUp: {
            name: '速度提升',
            description: '提高速度',
            icon: '💨',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        speedDown: {
            name: '速度下降',
            description: '降低速度',
            icon: '💨❌',
            isPositive: false,
            canDispel: true,
            stackable: true
        },

        // 暴击相关
        critRate: {
            name: '暴击率提升',
            description: '提高暴击率',
            icon: '🎯',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        critDamage: {
            name: '暴击伤害提升',
            description: '提高暴击伤害',
            icon: '💥',
            isPositive: true,
            canDispel: true,
            stackable: true
        },

        // 多重攻击相关
        daBoost: {
            name: 'DA提升',
            description: '提高双重攻击率',
            icon: '⚔️⚔️',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        taBoost: {
            name: 'TA提升',
            description: '提高三重攻击率',
            icon: '⚔️⚔️⚔️',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        daDown: {
            name: 'DA降低',
            description: '降低双重攻击率',
            icon: '⚔️⚔️❌',
            isPositive: false,
            canDispel: true,
            stackable: true
        },
        taDown: {
            name: 'TA降低',
            description: '降低三重攻击率',
            icon: '⚔️⚔️⚔️❌',
            isPositive: false,
            canDispel: true,
            stackable: true
        },

        // 命中相关
        missRate: {
            name: '命中率降低',
            description: '降低攻击命中率',
            icon: '👁️❌',
            isPositive: false,
            canDispel: true,
            stackable: true
        },

        // 伤害相关
        damageIncrease: {
            name: '伤害提升',
            description: '提高造成的伤害',
            icon: '🔥',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        damageReduction: {
            name: '伤害减免',
            description: '减少受到的伤害',
            icon: '🛡️',
            isPositive: true,
            canDispel: true,
            stackable: true
        },

        // 持续伤害/治疗
        dot: {
            name: '持续伤害',
            description: '每回合受到伤害',
            icon: '☠️',
            isPositive: false,
            canDispel: true,
            stackable: true
        },
        hot: {
            name: '持续治疗',
            description: '每回合恢复生命值',
            icon: '💚',
            isPositive: true,
            canDispel: true,
            stackable: true
        },

        // 状态效果
        numbness: {
            name: '麻痹',
            description: '无法行动',
            icon: '💫',
            isPositive: false,
            canDispel: true,
            stackable: false
        },
        stun: {
            name: '眩晕',
            description: '无法行动',
            icon: '💫',
            isPositive: false,
            canDispel: true,
            stackable: false
        },
        silence: {
            name: '沉默',
            description: '无法使用技能',
            icon: '🤐',
            isPositive: false,
            canDispel: true,
            stackable: false
        },

        // 特殊效果
        shield: {
            name: '护盾',
            description: '抵挡一定量的伤害',
            icon: '🔰',
            isPositive: true,
            canDispel: false,
            stackable: true
        },
        invincible: {
            name: '无敌',
            description: '完全免疫伤害一次',
            icon: '🛡️✨',
            isPositive: true,
            canDispel: false,
            stackable: false
        },
        evade: {
            name: '完全回避',
            description: '回避所有伤害',
            icon: '💨',
            isPositive: true,
            canDispel: true,
            stackable: false
        },
        reflect: {
            name: '反伤',
            description: '反弹一部分受到的伤害',
            icon: '↩️',
            isPositive: true,
            canDispel: true,
            stackable: true
        },

        // 元素增益
        fireEnhance: {
            name: '火属性增强',
            description: '提高火属性伤害',
            icon: '🔥',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        waterEnhance: {
            name: '水属性增强',
            description: '提高水属性伤害',
            icon: '💧',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        windEnhance: {
            name: '风属性增强',
            description: '提高风属性伤害',
            icon: '🌪️',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        earthEnhance: {
            name: '土属性增强',
            description: '提高土属性伤害',
            icon: '🌍',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        lightEnhance: {
            name: '光属性增强',
            description: '提高光属性伤害',
            icon: '✨',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        darkEnhance: {
            name: '暗属性增强',
            description: '提高暗属性伤害',
            icon: '🌑',
            isPositive: true,
            canDispel: true,
            stackable: true
        }
    },

    /**
     * 初始化BUFF系统
     */
    init() {
        console.log('BUFF系统已初始化');
    },

    /**
     * 创建一个新的BUFF
     * @param {string} type - BUFF类型
     * @param {number} value - BUFF效果值
     * @param {number} duration - 持续回合数
     * @param {object} source - BUFF来源
     * @returns {object} BUFF对象
     */
    createBuff(type, value, duration, source = null) {
        const buffType = this.buffTypes[type];
        if (!buffType) {
            console.error(`未知的BUFF类型: ${type}`);
            return null;
        }

        return {
            id: `${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type,
            name: buffType.name,
            description: buffType.description,
            icon: buffType.icon,
            value,
            duration,
            initialDuration: duration,
            isPositive: buffType.isPositive,
            canDispel: buffType.canDispel,
            stackable: buffType.stackable,
            source: source ? { id: source.id, name: source.name } : null,
            createdAt: Date.now()
        };
    },

    /**
     * 应用BUFF到目标
     * @param {object} target - 目标对象
     * @param {object} buff - BUFF对象
     * @returns {boolean} 是否成功应用
     */
    applyBuff(target, buff) {
        if (!target || !buff) return false;

        // 初始化目标的BUFF数组
        if (!target.buffs) {
            target.buffs = [];
        }

        // 检查是否可以叠加
        if (buff.stackable) {
            // 可叠加BUFF，直接添加
            target.buffs.push(buff);
        } else {
            // 不可叠加BUFF，检查是否已存在同类型BUFF
            const existingBuff = target.buffs.find(b => b.type === buff.type);
            if (existingBuff) {
                // 已存在同类型BUFF，更新持续时间和效果值
                existingBuff.duration = Math.max(existingBuff.duration, buff.duration);
                existingBuff.value = Math.max(existingBuff.value, buff.value);
            } else {
                // 不存在同类型BUFF，添加新BUFF
                target.buffs.push(buff);
            }
        }

        // 应用BUFF效果
        this.applyBuffEffect(target, buff);

        return true;
    },

    /**
     * 应用BUFF效果
     * @param {object} target - 目标对象
     * @param {object} buff - BUFF对象
     */
    applyBuffEffect(target, buff) {
        if (!target || !buff) return;

        // 根据BUFF类型应用不同效果
        switch (buff.type) {
            case 'shield':
                // 护盾效果直接添加到目标的shield属性
                target.shield = (target.shield || 0) + buff.value;
                break;

            // 其他BUFF效果在计算伤害时应用
        }
    },

    /**
     * 移除BUFF
     * @param {object} target - 目标对象
     * @param {string} buffId - BUFF ID
     * @returns {boolean} 是否成功移除
     */
    removeBuff(target, buffId) {
        if (!target || !target.buffs || !buffId) return false;

        const buffIndex = target.buffs.findIndex(buff => buff.id === buffId);
        if (buffIndex === -1) return false;

        const buff = target.buffs[buffIndex];

        // 移除BUFF效果
        this.removeBuffEffect(target, buff);

        // 从数组中移除BUFF
        target.buffs.splice(buffIndex, 1);

        return true;
    },

    /**
     * 移除BUFF效果
     * @param {object} target - 目标对象
     * @param {object} buff - BUFF对象
     */
    removeBuffEffect(target, buff) {
        if (!target || !buff) return;

        // 根据BUFF类型移除不同效果
        switch (buff.type) {
            case 'shield':
                // 移除护盾效果
                target.shield = Math.max(0, (target.shield || 0) - buff.value);
                break;

            // 其他BUFF效果在计算伤害时应用，无需在此移除
        }
    },

    /**
     * 驱散目标的BUFF
     * @param {object} target - 目标对象
     * @param {boolean} isPositive - 是否驱散正面BUFF
     * @param {number} count - 驱散数量，默认为1
     * @returns {array} 被驱散的BUFF数组
     */
    dispelBuffs(target, isPositive, count = 1) {
        if (!target || !target.buffs) return [];

        // 筛选可驱散的指定类型BUFF
        const dispellableBuffs = target.buffs.filter(buff =>
            buff.canDispel && buff.isPositive === isPositive
        );

        // 按持续时间排序，优先驱散持续时间短的
        dispellableBuffs.sort((a, b) => a.duration - b.duration);

        // 获取要驱散的BUFF
        const buffsToDispel = dispellableBuffs.slice(0, count);

        // 驱散BUFF
        const dispelledBuffs = [];
        for (const buff of buffsToDispel) {
            if (this.removeBuff(target, buff.id)) {
                dispelledBuffs.push(buff);
            }
        }

        return dispelledBuffs;
    },

    /**
     * 更新目标的BUFF持续时间
     * @param {object} target - 目标对象
     * @returns {array} 已过期的BUFF数组
     */
    updateBuffDurations(target) {
        if (!target || !target.buffs) return [];

        const expiredBuffs = [];

        // 更新每个BUFF的持续时间
        for (let i = target.buffs.length - 1; i >= 0; i--) {
            const buff = target.buffs[i];
            buff.duration--;

            // 检查BUFF是否已过期
            if (buff.duration <= 0) {
                // 移除BUFF效果
                this.removeBuffEffect(target, buff);

                // 从数组中移除BUFF
                target.buffs.splice(i, 1);

                // 添加到已过期BUFF数组
                expiredBuffs.push(buff);
            }
        }

        return expiredBuffs;
    },

    /**
     * 处理回合开始时的BUFF效果
     * @param {object} target - 目标对象
     * @returns {object} 处理结果
     */
    processBuffsAtTurnStart(target) {
        if (!target || !target.buffs) return { damage: 0, healing: 0 };

        let totalDamage = 0;
        let totalHealing = 0;

        // 处理持续伤害和治疗BUFF
        for (const buff of target.buffs) {
            if (buff.type === 'dot') {
                // 持续伤害
                const damage = Math.floor(buff.value);
                target.currentStats.hp = Math.max(0, target.currentStats.hp - damage);
                totalDamage += damage;
            } else if (buff.type === 'hot') {
                // 持续治疗
                const healing = Math.floor(buff.value);
                target.currentStats.hp = Math.min(target.currentStats.maxHp, target.currentStats.hp + healing);
                totalHealing += healing;
            }
        }

        return { damage: totalDamage, healing: totalHealing };
    },

    /**
     * 获取目标的所有BUFF
     * @param {object} target - 目标对象
     * @returns {array} BUFF数组
     */
    getBuffs(target) {
        if (!target || !target.buffs) return [];
        return [...target.buffs];
    },

    /**
     * 获取目标的指定类型BUFF
     * @param {object} target - 目标对象
     * @param {string} type - BUFF类型
     * @returns {array} 指定类型的BUFF数组
     */
    getBuffsByType(target, type) {
        if (!target || !target.buffs) return [];
        return target.buffs.filter(buff => buff.type === type);
    },

    /**
     * 清除目标的所有BUFF
     * @param {object} target - 目标对象
     */
    clearAllBuffs(target) {
        if (!target) return;

        // 移除所有BUFF效果
        if (target.buffs) {
            for (const buff of target.buffs) {
                this.removeBuffEffect(target, buff);
            }
        }

        // 清空BUFF数组
        target.buffs = [];
    }
};
