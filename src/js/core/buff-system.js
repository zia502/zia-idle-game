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
        chase: {
            name: '追击',
            description: '普通攻击额外造成一定百分比的伤害',
            icon: '⚔️↗️',
            isPositive: true,
            canDispel: true,
            stackable: false
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
        },

        // 背水/浑身
        staminaUp: {
            name: '背水/浑身',
            description: '根据HP百分比提升属性',
            icon: '💪',
            isPositive: true,
            canDispel: true,
            stackable: true // 通常同名效果会覆盖或取最高，但具体实现看游戏逻辑
        },

        // 元素伤害转换
        elementConversion: {
            name: '元素伤害转换',
            description: '将受到的伤害转换为特定元素',
            icon: '🔄',
            isPositive: true, // 通常是增益，但也可能被视为特殊机制
            canDispel: true, // 通常不可驱散，但根据游戏设定
            stackable: false // 通常不叠加，新效果覆盖旧效果
        },

        // EX攻击提升
        exAttackUp: {
            name: 'EX攻击提升',
            description: '独立乘区的攻击力提升',
            icon: '⚔️⭐',
            isPositive: true,
            canDispel: true,
            stackable: true
        },

        // DoT易伤
        dot_vulnerability: {
            name: 'DoT易伤',
            description: '增加受到的持续伤害',
            icon: '☠️➕',
            isPositive: false, // 对目标是负面效果
            canDispel: true,
            stackable: true
        },

        // 复合BUFF类型
        compositeBuff: {
            name: '复合BUFF',
            description: '包含多个效果的BUFF',
            icon: '✨',
            isPositive: true,
            canDispel: true,
            stackable: true,
            maxStacks: 3
        }
    },

    /**
     * 初始化BUFF系统
     */
    init() {
        console.log('BUFF系统已初始化');
    },

    /**
     * 创建一个BUFF
     * @param {string} type - BUFF类型
     * @param {number} value - BUFF效果值
     * @param {number} duration - 持续回合数，-1表示永续
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
     * 创建一个复合BUFF
     * @param {string} name - BUFF名称
     * @param {array} effects - 子效果数组
     * @param {number} duration - 持续回合数
     * @param {object} source - BUFF来源
     * @param {number} maxStacks - 最大叠加层数
     * @returns {object} 复合BUFF对象
     */
    createCompositeBuff(name, effects, duration, source = null, maxStacks = 3) {
        return {
            id: `composite_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: 'compositeBuff',
            name,
            description: '包含多个效果的BUFF',
            icon: '✨',
            effects,
            duration,
            initialDuration: duration,
            isPositive: true,
            canDispel: true,
            stackable: true,
            maxStacks,
            currentStacks: 1,
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
    applyBuff(target, buff, isSubBuff = false) {
        if (!target || !buff) return false;

        // 初始化目标的BUFF数组
        if (!target.buffs) {
            target.buffs = [];
        }

        // 如果是子BUFF，它总是可叠加的（因为它属于一个父BUFF）
        // 并且它的持续时间等属性由父BUFF管理
        if (isSubBuff) {
            // 为了区分，给子BUFF一个标记
            buff.isSubBuff = true;
            // parentBuffId 应该在创建子buff时由 applyCompositeBuff 设置好
            // buff.parentBuffId = buff.source?.id;
        }

        // 检查是否可以叠加
        if (buff.stackable || isSubBuff) {
            const existingBuffOfSameTypeAndSource = target.buffs.find(
                b => b.type === buff.type &&
                (b.source?.id === buff.source?.id || (isSubBuff && b.parentBuffId === buff.parentBuffId)) && // 子buff通过parentBuffId匹配
                b.name === buff.name && // 确保是完全相同的BUFF
                b.isSubBuff === isSubBuff // 区分主副BUFF
            );

            if (existingBuffOfSameTypeAndSource) {
                const currentStacks = existingBuffOfSameTypeAndSource.currentStacks || 1;
                const maxStacks = existingBuffOfSameTypeAndSource.maxStacks || buff.maxStacks || 1; // 优先用已存在BUFF的maxStacks

                if (currentStacks < maxStacks) {
                    existingBuffOfSameTypeAndSource.currentStacks = currentStacks + 1;
                    existingBuffOfSameTypeAndSource.duration = Math.max(existingBuffOfSameTypeAndSource.duration, buff.duration);
                    // 对于叠加层数的BUFF，效果值如何变化需要具体定义，这里假设简单相加或取最大
                    if (buff.stackingValueBehavior === 'add') {
                        existingBuffOfSameTypeAndSource.value += buff.value;
                    } else if (buff.stackingValueBehavior === 'max') {
                        existingBuffOfSameTypeAndSource.value = Math.max(existingBuffOfSameTypeAndSource.value, buff.value);
                    } else { // 默认替换或根据类型特定逻辑
                        existingBuffOfSameTypeAndSource.value = buff.value;
                    }
                } else {
                    // 已达到最大层数，刷新持续时间，并可能更新效果值（如取最大）
                    existingBuffOfSameTypeAndSource.duration = Math.max(existingBuffOfSameTypeAndSource.duration, buff.duration);
                    if (buff.stackingValueBehavior === 'max') {
                         existingBuffOfSameTypeAndSource.value = Math.max(existingBuffOfSameTypeAndSource.value, buff.value);
                    } else {
                        existingBuffOfSameTypeAndSource.value = buff.value; // 默认刷新为新值
                    }
                }
                this.applyBuffEffect(target, existingBuffOfSameTypeAndSource);
                this.recalculateStatsWithBuffs(target);
                return true;
            }
            // 如果没有找到完全匹配的，且是可叠加类型，则添加新的
            target.buffs.push(buff);
        } else {
            // 不可叠加的主BUFF (isSubBuff 为 false 且 buff.stackable 为 false)
            const existingBuff = target.buffs.find(b => b.type === buff.type && !b.isSubBuff);
            if (existingBuff) {
                // 已存在同类型BUFF，更新持续时间和效果值
                existingBuff.duration = Math.max(existingBuff.duration, buff.duration);
                if (buff.type === 'chase') {
                    existingBuff.value = Math.max(existingBuff.value, buff.value);
                } else {
                    existingBuff.value = buff.value;
                }
                this.applyBuffEffect(target, existingBuff); // 重新应用效果
                return true; // 替换了旧BUFF，所以返回
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
     * 应用复合BUFF到目标
     * @param {object} target - 目标对象
     * @param {object} compositeBuffData - 从技能JSON读取的复合BUFF定义
     * @param {object} source - BUFF来源角色
     * @returns {boolean} 是否成功应用
     */
    applyCompositeBuff(target, compositeBuffData, source) {
        if (!target || !compositeBuffData) return false;

        if (!target.buffs) {
            target.buffs = [];
        }

        let existingCompositeBuff = target.buffs.find(b => b.type === 'compositeBuff' && b.name === compositeBuffData.name && !b.isSubBuff);

        if (existingCompositeBuff) {
            // 复合BUFF已存在
            const currentStacks = existingCompositeBuff.currentStacks || 1;
            const maxStacks = existingCompositeBuff.maxStacks || compositeBuffData.maxStacks || 1;

            if (existingCompositeBuff.stackable && currentStacks < maxStacks) {
                existingCompositeBuff.currentStacks = currentStacks + 1;
                existingCompositeBuff.duration = Math.max(existingCompositeBuff.duration, compositeBuffData.duration);
                // 叠加子效果
                for (const effect of compositeBuffData.effects) {
                    // 创建子BUFF时，其source应该是父BUFF (existingCompositeBuff)
                    const subBuff = this.createBuff(effect.type, effect.value, existingCompositeBuff.duration, existingCompositeBuff);
                    if (subBuff) {
                        subBuff.parentBuffId = existingCompositeBuff.id;
                        subBuff.maxStacks = effect.maxStacks; // 子效果也可能有自己的maxStacks
                        this.applyBuff(target, subBuff, true); // true表示是子BUFF
                    }
                }
            } else {
                // 刷新持续时间，并重新应用子效果 (先移除旧的子效果)
                this.removeSubBuffsOf(target, existingCompositeBuff.id); // 移除所有旧的子BUFF
                existingCompositeBuff.duration = Math.max(existingCompositeBuff.duration, compositeBuffData.duration);
                existingCompositeBuff.effects = compositeBuffData.effects; // 更新效果定义
                // 重新应用所有子效果
                for (const effect of compositeBuffData.effects) {
                    const subBuff = this.createBuff(effect.type, effect.value, existingCompositeBuff.duration, existingCompositeBuff);
                    if (subBuff) {
                        subBuff.parentBuffId = existingCompositeBuff.id;
                        subBuff.maxStacks = effect.maxStacks;
                        this.applyBuff(target, subBuff, true);
                    }
                }
            }
        } else {
            // 新建复合BUFF
            const newCompositeBuff = this.createCompositeBuff(
                compositeBuffData.name,
                compositeBuffData.effects, // 这是效果定义数组
                compositeBuffData.duration,
                source, // 技能施放者
                compositeBuffData.maxStacks || 1,
                compositeBuffData.icon, // 从数据中获取图标
                compositeBuffData.description // 从数据中获取描述
            );
            if (!newCompositeBuff) return false;

            target.buffs.push(newCompositeBuff);
            // 应用子效果
            for (const effect of newCompositeBuff.effects) { // newCompositeBuff.effects 是子效果的定义
                const subBuff = this.createBuff(effect.type, effect.value, newCompositeBuff.duration, newCompositeBuff); // source 是父BUFF
                if (subBuff) {
                    subBuff.parentBuffId = newCompositeBuff.id;
                    subBuff.maxStacks = effect.maxStacks; // 子效果也可能有自己的maxStacks
                    this.applyBuff(target, subBuff, true);
                }
            }
            existingCompositeBuff = newCompositeBuff; // 用于后续处理
        }
        
        // 确保复合BUFF的子效果能正确更新角色属性
        this.recalculateStatsWithBuffs(target);

        return true;
    },

    /**
     * 移除指定父BUFF的所有子BUFF
     * @param {object} target - 目标对象
     * @param {string} parentBuffId - 父BUFF的ID
     */
    removeSubBuffsOf(target, parentBuffId) {
        if (!target || !target.buffs || !parentBuffId) return;
        const subBuffsToRemove = target.buffs.filter(b => b.isSubBuff && b.parentBuffId === parentBuffId);
        for (const subBuff of subBuffsToRemove) {
            this.removeBuffEffect(target, subBuff); // 先移除效果
            const index = target.buffs.findIndex(b => b.id === subBuff.id);
            if (index > -1) {
                target.buffs.splice(index, 1);
            }
        }
    },
    
    /**
     * 重新计算应用BUFF后的属性（辅助函数，具体实现在Character或Battle中）
     * @param {object} target - 目标对象
     */
    recalculateStatsWithBuffs(target) {
        // 这个函数应该在Character.js或Battle.js中实现，
        // 它会遍历所有非子BUFF和有效的子BUFF来更新currentStats
        // console.log(`触发 ${target.name} 的属性重新计算（因复合BUFF变更）`);
        if (typeof Character !== 'undefined' && typeof Character.updateCharacterStats === 'function') {
            Character.updateCharacterStats(target.id || target); // 传入ID或对象
        } else if (typeof Battle !== 'undefined' && typeof Battle.updateEntityStats === 'function') {
            Battle.updateEntityStats(target);
        }
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

        const buffToRemove = target.buffs[buffIndex];

        // 如果移除的是复合BUFF，也移除其所有子BUFF
        if (buffToRemove.type === 'compositeBuff' && !buffToRemove.isSubBuff) {
            this.removeSubBuffsOf(target, buffToRemove.id);
        }

        // 移除BUFF效果
        this.removeBuffEffect(target, buffToRemove);

        // 从数组中移除BUFF
        target.buffs.splice(buffIndex, 1);
        
        this.recalculateStatsWithBuffs(target); // 属性可能变化

        return true;
    },

    /**
     * 移除复合BUFF（或其一层）
     * @param {object} target - 目标对象
     * @param {string} buffId - 复合BUFF的ID
     * @returns {boolean} 是否成功移除
     */
    removeCompositeBuff(target, buffId) {
        if (!target || !target.buffs || !buffId) return false;

        const buffIndex = target.buffs.findIndex(b => b.id === buffId && b.type === 'compositeBuff' && !b.isSubBuff);
        if (buffIndex === -1) return false;

        const compositeBuff = target.buffs[buffIndex];

        if (compositeBuff.currentStacks && compositeBuff.currentStacks > 1) {
            compositeBuff.currentStacks--;
            // 移除对应的一层子效果。这里简化处理：移除与最新一层相关的子BUFF。
            // 一个更健壮的方法是标记子BUFF属于第几层。
            // 当前简单实现：找到每个子效果类型的一个实例并移除。
            if (compositeBuff.effects && Array.isArray(compositeBuff.effects)) {
                for (const effectDef of compositeBuff.effects) {
                    const subBuffToRemove = target.buffs.find(
                        b => b.isSubBuff && b.parentBuffId === compositeBuff.id && b.type === effectDef.type
                    );
                    if (subBuffToRemove) {
                        this.removeBuff(target, subBuffToRemove.id); // 使用通用的removeBuff
                    }
                }
            }
        } else {
            // 层数减到0或本身不可叠加，直接移除整个复合BUFF及其所有子BUFF
            this.removeSubBuffsOf(target, compositeBuff.id);
            this.removeBuffEffect(target, compositeBuff); // 移除复合BUFF自身的效果（如果有）
            target.buffs.splice(buffIndex, 1);
        }
        
        this.recalculateStatsWithBuffs(target);

        return true;
    },

    /**
     * 移除BUFF效果（例如从属性上减去加成）
     * @param {object} target - 目标对象
     * @param {object} buff - BUFF对象
     */
    removeBuffEffect(target, buff) {
        if (!target || !buff) return;

        // 根据BUFF类型移除不同效果
        switch (buff.type) {
            case 'shield':
                // 护盾效果在被消耗时减少，这里移除是指BUFF消失时，护盾值也消失
                // 如果护盾值是加到角色属性上的，这里需要减去
                // 假设 target.shield 是一个临时值，在BUFF消失时清零或重算
                // 如果buff.value是这个特定护盾buff提供的量，则减去它
                // target.shield = Math.max(0, (target.shield || 0) - buff.value);
                // 更安全的做法是，在recalculateStatsWithBuffs中处理护盾总值
                break;
            // 其他属性类BUFF的移除，通常在recalculateStatsWithBuffs中通过重新计算currentStats实现
        }
        // 触发一次属性重算，以确保移除的效果正确反映
        this.recalculateStatsWithBuffs(target);
    },


    /**
     * 驱散BUFF
     * @param {object} target - 目标对象
     * @param {boolean} isPositive - true驱散增益，false驱散减益
     * @param {number} count - 驱散数量
     * @returns {array} 被驱散的BUFF列表
     */
    dispelBuffs(target, isPositive, count = 1) {
        if (!target || !target.buffs) return [];

        const buffsToDispel = [];
        const dispelledBuffsOutput = []; // 用于记录被驱散的BUFF信息

        // 筛选出可驱散的、符合类型的BUFF（非子BUFF）
        const candidateBuffs = target.buffs.filter(buff =>
            buff.canDispel &&
            buff.isPositive === isPositive &&
            !buff.isSubBuff // 不直接驱散子BUFF，它们随父BUFF管理
        );

        // 按创建时间排序，优先驱散旧的 (可选策略)
        candidateBuffs.sort((a, b) => a.createdAt - b.createdAt);

        for (let i = 0; i < count && candidateBuffs.length > 0; i++) {
            const buffToDispel = candidateBuffs.shift(); // 取出最早创建的
            if (buffToDispel) {
                buffsToDispel.push(buffToDispel.id);
                dispelledBuffsOutput.push({ name: buffToDispel.name, type: buffToDispel.type });
                // 如果是复合BUFF，其子BUFF也应被移除
                if (buffToDispel.type === 'compositeBuff') {
                    this.removeSubBuffsOf(target, buffToDispel.id);
                }
            }
        }

        // 移除选中的BUFF
        buffsToDispel.forEach(buffId => {
            this.removeBuff(target, buffId); // removeBuff内部会处理子BUFF和属性重算
        });
        
        console.log(`驱散了 ${target.name} 的 ${dispelledBuffsOutput.length} 个 ${isPositive ? '增益' : '减益'} BUFF:`, dispelledBuffsOutput.map(b => b.name));
        return dispelledBuffsOutput;
    },

    /**
     * 更新目标身上所有BUFF的持续时间
     * @param {object} target - 目标对象
     */
    updateBuffDurations(target) {
        if (!target || !target.buffs) return []; // 如果没有buffs，返回空数组

        const expiredBuffsToReturn = []; // 用于收集实际过期的BUFF对象
        const expiredBuffIds = []; // 用于收集过期BUFF的ID，方便移除

        // 从后向前遍历，因为我们会修改数组
        for (let i = target.buffs.length - 1; i >= 0; i--) {
            const buff = target.buffs[i];
            let isExpired = false;

            // 子BUFF的持续时间由父BUFF决定，不单独减少
            if (buff.isSubBuff) {
                const parentBuff = target.buffs.find(b => b.id === buff.parentBuffId && !b.isSubBuff);
                if (parentBuff) {
                    buff.duration = parentBuff.duration; // 同步持续时间
                    if (parentBuff.duration === 0) { // 父BUFF已过期
                        isExpired = true;
                    }
                } else { // 孤儿自BUFF，也让它过期
                    isExpired = true;
                }
                if (isExpired) {
                    expiredBuffIds.push(buff.id);
                    // 注意：子buff通常不直接返回给battle.js用于显示过期，除非有特殊需求
                    expiredBuffsToReturn.push({...buff}); // 如果需要返回子buff信息
                }
                continue;
            }

            if (buff.duration > 0) {
                buff.duration--;
            }

            if (buff.duration === 0) {
                isExpired = true;
                expiredBuffIds.push(buff.id);
                expiredBuffsToReturn.push({...buff}); // 收集过期的主BUFF信息

                // 如果是复合BUFF过期，其子BUFF也应被移除
                if (buff.type === 'compositeBuff') {
                    // 收集此复合BUFF下的子BUFF，如果它们也需要显示过期
                    target.buffs.forEach(subBuff => {
                        if (subBuff.isSubBuff && subBuff.parentBuffId === buff.id) {
                            expiredBuffsToReturn.push({...subBuff}); // 按需添加
                        }
                    });
                    this.removeSubBuffsOf(target, buff.id);
                }
            }
        }

        // 移除所有过期的BUFF
        // 创建一个临时的已移除buff的集合，避免重复添加（如果expiredBuffsToReturn已包含）
        const removedBuffsForReturn = [];
        expiredBuffIds.forEach(buffId => {
            const buffIndex = target.buffs.findIndex(b => b.id === buffId);
            if (buffIndex > -1) {
                const expiredBuff = target.buffs[buffIndex];
                // 确保我们只添加那些在expiredBuffsToReturn中尚不存在的、且确实被移除的buff
                // 但由于expiredBuffsToReturn是在判断duration === 0时添加的，这里主要是处理移除逻辑
                this.removeBuffEffect(target, expiredBuff); // 移除效果
                target.buffs.splice(buffIndex, 1);
                console.log(`${target.name} 的BUFF ${expiredBuff.name} 已过期并移除。`);
            }
        });
        
        if (expiredBuffIds.length > 0) {
            this.recalculateStatsWithBuffs(target);
        }
        return expiredBuffsToReturn; // 返回收集到的过期BUFF对象数组
    },

    /**
     * 处理目标在回合开始时的BUFF效果（如DoT, HoT）
     * @param {object} target - 目标对象
     */
    processBuffsAtTurnStart(target) {
        if (!target || !target.buffs) {
            return { damage: 0, healing: 0 };
        }

        let totalDamage = 0;
        let totalHealing = 0;

        // 只处理非子BUFF的DoT/HoT
        const activeBuffs = target.buffs.filter(buff => !buff.isSubBuff);

        for (const buff of activeBuffs) {
            switch (buff.type) {
                case 'dot':
                    totalDamage += buff.value;
                    // console.log(`${target.name} 将计算持续伤害 ${buff.value} 点 (来自 ${buff.name})`);
                    break;
                case 'hot':
                    totalHealing += buff.value;
                    // console.log(`${target.name} 将计算持续治疗 ${buff.value} 点 (来自 ${buff.name})`);
                    break;
            }
        }
        return { damage: totalDamage, healing: totalHealing };
    },

    /**
     * 获取目标身上的所有BUFF（只包括主BUFF，不包括子BUFF）
     * @param {object} target - 目标对象
     * @returns {array} BUFF数组
     */
    getBuffs(target) {
        if (!target || !target.buffs) return [];
        return target.buffs.filter(buff => !buff.isSubBuff);
    },


    /**
     * 获取目标身上指定类型的所有BUFF（只包括主BUFF）
     * @param {object} target - 目标对象
     * @param {string} type - BUFF类型
     * @returns {array} BUFF数组
     */
    getBuffsByType(target, type) {
        if (!target || !target.buffs) return [];
        return target.buffs.filter(buff => buff.type === type && !buff.isSubBuff);
    },

    /**
     * 清除目标身上所有BUFF和子BUFF
     * @param {object} target - 目标对象
     */
    clearAllBuffs(target) {
        if (!target || !target.buffs) return;
        // 在移除前，先移除所有BUFF的效果
        for (const buff of [...target.buffs]) { // 遍历副本，因为数组会被修改
            this.removeBuffEffect(target, buff);
        }
        target.buffs = [];
        console.log(`清除了 ${target.name} 的所有BUFF。`);
        this.recalculateStatsWithBuffs(target);
    }
    // Removed erroneous code block that was causing syntax errors.
    // The BuffSystem object definition ends here.
};
