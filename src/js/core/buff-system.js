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
        criticalRateUp: { // Renamed from critRate for consistency with ssr_skill.json
            name: '暴击率提升',
            description: '提高暴击率',
            icon: '🎯',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        criticalDamageUp: { // Renamed from critDamage
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
        missRate: { // This is for target's miss rate on attacker
            name: '命中率降低',
            description: '降低攻击命中率',
            icon: '👁️❌',
            isPositive: false,
            canDispel: true,
            stackable: true
        },
        // 伤害相关
        damageUp: { // Renamed from damageIncrease
            name: '伤害提升',
            description: '提高造成的伤害',
            icon: '🔥',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        allDamageTakenReduction: { // Renamed from damageReduction for clarity
            name: '全伤害减免',
            description: '减少受到的所有类型伤害',
            icon: '🛡️⬇️',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        echo: { // Added for追击, distinct from chase which might be specific
            name: '追击',
            description: '攻击时追加额外伤害',
            icon: '⚔️✨',
            isPositive: true,
            canDispel: true,
            stackable: true // Echo effects can often stack from different sources
        },
        damageCapUp: {
            name: '伤害上限提升',
            description: '提高造成的伤害上限',
            icon: '⬆️💥',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        skillDamageCapUp: {
            name: '技能伤害上限提升',
            description: '提高技能造成的伤害上限',
            icon: '⬆️🔥',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        // 持续伤害/治疗
        dot: { // Damage Over Time
            name: '持续伤害',
            description: '每回合受到伤害',
            icon: '☠️',
            isPositive: false,
            canDispel: true,
            stackable: true
        },
        regen: { // Renamed from hot (Heal Over Time) for consistency
            name: '再生',
            description: '每回合恢复生命值',
            icon: '💚',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        // 状态效果
        numbness: { // 麻痹
            name: '麻痹',
            description: '无法行动',
            icon: '💫',
            isPositive: false,
            canDispel: true,
            stackable: false
        },
        stun: { // 眩晕
            name: '眩晕',
            description: '无法行动',
            icon: '😵',
            isPositive: false,
            canDispel: true,
            stackable: false
        },
        silence: { // 沉默
            name: '沉默',
            description: '无法使用技能',
            icon: '🤐',
            isPositive: false,
            canDispel: true,
            stackable: false
        },
        statusImmunity: { // For specific immunities like "silence immunity"
            name: '状态免疫',
            description: '免疫特定的负面状态',
            icon: '🚫✨',
            isPositive: true,
            canDispel: false, // Usually not dispellable
            stackable: false
        },
        debuffImmunity: { // General debuff immunity
            name: '弱体免疫',
            description: '免疫所有弱体效果',
            icon: '🛡️🚫',
            isPositive: true,
            canDispel: false,
            stackable: false
        },
        // 特殊效果
        shield: {
            name: '护盾',
            description: '抵挡一定量的伤害',
            icon: '🔰',
            isPositive: true,
            canDispel: true, // Shields can sometimes be dispelled
            stackable: true // Multiple shields can add up or take the highest
        },
        invincible: {
            name: '无敌',
            description: '完全免疫伤害', // Removed "once" as duration/hits will handle it
            icon: '🛡️✨',
            isPositive: true,
            canDispel: false, // Usually not dispellable
            stackable: false
        },
        evasionAll: { // Renamed from evade for clarity
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
        cover: {
            name: '援护',
            description: '替代队友承受单体攻击',
            icon: '🛡️🫂',
            isPositive: true,
            canDispel: true,
            stackable: false
        },
        threatUp: {
            name: '敌对心提升',
            description: '更容易被敌人攻击',
            icon: '🎯⬆️',
            isPositive: true, // For tanks
            canDispel: true,
            stackable: true
        },
        threatDown: {
            name: '敌对心降低',
            description: '更不容易被敌人攻击',
            icon: '🎯⬇️',
            isPositive: true, // For dps/healers
            canDispel: true,
            stackable: true
        },
        extraAttackTurn: {
            name: '再攻击',
            description: '本回合可以再次行动',
            icon: '⚔️🔄',
            isPositive: true,
            canDispel: true,
            stackable: false
        },
        debuffResistOnce: {
            name: '弱体无效(次)',
            description: '抵抗下一次受到的弱体效果',
            icon: '🛡️🔮',
            isPositive: true,
            canDispel: true, // Can be dispelled before it triggers
            stackable: true // Can have multiple stacks of resist
        },
        // 元素增益/抗性
        elementalResistance: { // Generic elemental resistance
            name: '元素伤害减轻',
            description: '减少受到的特定元素伤害',
            icon: '🛡️🔥', // Icon can be generic or specific if needed
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        // elementalDamageCap is not a buff on character, but a check during damage calculation
        // fireEnhance, waterEnhance etc. are specific applications of a general "elementalDamageUp" type
        elementalDamageUp: {
            name: '元素伤害提升',
            description: '提高造成的特定元素伤害',
            icon: '🔥⬆️', // Icon can be generic or specific
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        // 背水/浑身
        staminaUp: { // In GBF, "Stamina" usually means "浑身" (higher HP, more power)
            name: '浑身',
            description: 'HP越高，属性提升越大',
            icon: '💪🟢',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        enmityUp: { // In GBF, "Enmity" usually means "背水" (lower HP, more power)
            name: '背水',
            description: 'HP越低，属性提升越大',
            icon: '💪🔴',
            isPositive: true,
            canDispel: true,
            stackable: true
        },
        // 元素伤害转换
        damageElementConversion: { // Renamed from elementConversion
            name: '伤害属性转换',
            description: '将受到的伤害转换为特定元素',
            icon: '🔄🎨',
            isPositive: true,
            canDispel: true,
            stackable: false
        },
        // EX攻击提升 (already exists as exAttackUp, but ssr_skill.json might use a different term)
        // dot_vulnerability (already exists)

        // 复合BUFF类型 - This is a structural type, not an effect type itself.
        // Individual effects within a composite buff will use the types above.
        // The 'compositeBuff' type in buffTypes might be redundant if we handle buff packages structurally.
        // For now, keeping it for potential direct use, but applyBuffPackage in skills.json is the main driver.
        buffPackage: { // Used to represent a named collection of buffs from ssr_skill.json
            name: '效果包',
            description: '一个包含多种效果的特殊状态',
            icon: '📦✨',
            isPositive: true, // Depends on the content of the package
            canDispel: true,  // Depends on the 'dispellable' property of the package itself
            stackable: true, // Depends on the 'stackable' property of the package itself
            maxStacks: 1      // Default, can be overridden by the package definition
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
     * @param {object} options - 额外选项，如 { कैनDispel, stackable, maxStacks, elementType, statusToImmune, etc. }
     * @returns {object} BUFF对象
     */
    createBuff(type, value, duration, source = null, options = {}) {
        const buffTypeDefinition = this.buffTypes[type];
        if (!buffTypeDefinition) {
            console.error(`未知的BUFF类型: ${type}`);
            return null;
        }

        // 优先使用options中的定义，否则使用buffTypeDefinition的默认值
        const canDispel = options.canDispel !== undefined ? options.canDispel : buffTypeDefinition.canDispel;
        const stackable = options.stackable !== undefined ? options.stackable : buffTypeDefinition.stackable;
        const maxStacks = options.maxStacks !== undefined ? options.maxStacks : (buffTypeDefinition.maxStacks || 1);
        const isPositive = options.isPositive !== undefined ? options.isPositive : buffTypeDefinition.isPositive;
        const name = options.name || buffTypeDefinition.name; // 允许技能定义覆盖默认名称，例如具名buff包
        const description = options.description || buffTypeDefinition.description;
        const icon = options.icon || buffTypeDefinition.icon;

        const buff = {
            id: `${type}_${name}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type,
            name,
            description,
            icon,
            value, // For simple buffs, this is the direct value. For complex ones, it might be an object or not used.
            duration,
            initialDuration: duration,
            isPositive,
            canDispel,
            stackable,
            maxStacks,
            currentStacks: 1, // Initial stack count
            source: source ? { id: source.id, name: source.name } : null,
            createdAt: Date.now()
        };

        // 添加特定于类型的属性
        if (type === 'elementalResistance' || type === 'elementalDamageUp') {
            buff.elementType = options.elementType; // e.g., 'fire', 'water'
        }
        if (type === 'statusImmunity') {
            buff.statusToImmune = options.statusToImmune; // e.g., 'silence', 'stun'
        }
        if (type === 'damageElementConversion') {
            buff.convertToElementType = options.convertToElementType;
        }
        if (options.buffsPerStack) { // For buff packages that scale with stacks
            buff.buffsPerStack = options.buffsPerStack;
        }
        if (options.effects) { // For buff packages that contain multiple sub-effects
             buff.effects = options.effects; // This will be an array of effect definitions
        }


        return buff;
    },

    /**
     * 创建一个复合BUFF (Buff Package)
     * @param {string} name - BUFF包的名称 (e.g., "晓之誇炎")
     * @param {array} effects - 子效果定义数组 (来自ssr_skill.json的effects数组)
     * @param {number} duration - 持续回合数
     * @param {object} source - BUFF来源
     * @param {object} packageOptions - 从ssr_skill.json读取的buff包的属性 { dispellable, stackable, maxStacks, icon, description }
     * @returns {object} 复合BUFF对象 (实际上是一个标记了类型的普通buff，其effects将在applyBuffPackage时处理)
     */
    createBuffPackage(name, effects, duration, source = null, packageOptions = {}) {
        // 'buffPackage' 类型用于识别这是一个容器
        // 其 'effects' 属性将包含真正的子buff定义
        // 'canDispel', 'stackable', 'maxStacks' 直接来自 packageOptions
        return this.createBuff(
            'buffPackage', // 特定的类型来标识这是一个包
            null, // value 对于包本身可能无直接意义，其效果来自内部effects
            duration,
            source,
            {
                name: name,
                description: packageOptions.description || `效果包: ${name}`,
                icon: packageOptions.icon || '📦✨',
                canDispel: packageOptions.dispellable !== undefined ? packageOptions.dispellable : true,
                stackable: packageOptions.stackable !== undefined ? packageOptions.stackable : true,
                maxStacks: packageOptions.maxStacks || 1,
                isPositive: packageOptions.isPositive !== undefined ? packageOptions.isPositive : true, // 包通常是增益，但可覆盖
                effects: effects, // 存储子效果定义
                isBuffPackage: true // 自定义标记
            }
        );
    },

    /**
     * 应用BUFF到目标，处理叠加、刷新、层数和子效果计算
     * @param {object} target - 目标对象
     * @param {object} buff - 要应用的BUFF对象
     * @param {boolean} isSubBuff - 标记此buff是否为buff包的子buff
     * @returns {boolean} 是否成功应用或更新
     */
    applyBuff(target, buff, isSubBuff = false) {
        if (!target || !buff) return false;
        if (!target.buffs) target.buffs = [];

        // 标记是否为子BUFF
        buff.isSubBuff = isSubBuff;
        // 如果是子buff，确保它有关联的parentBuffId (应由applyBuffPackage设置)
        if (isSubBuff && !buff.parentBuffId) {
            console.error("子BUFF缺少parentBuffId:", buff);
            return false;
        }

        // 查找已存在的匹配BUFF
        const existingBuff = target.buffs.find(b =>
            b.type === buff.type &&
            b.name === buff.name && // 名字也需匹配，区分同类型不同名buff包
            b.isSubBuff === isSubBuff && // 区分主副BUFF
            (isSubBuff ? b.parentBuffId === buff.parentBuffId : b.source?.id === buff.source?.id) // 子buff按父ID匹配，主buff按来源匹配
        );

        if (existingBuff) {
            // --- 更新已存在的BUFF ---
            const maxStacks = existingBuff.maxStacks || 1;
            let needsRecalculate = false;

            // 刷新持续时间 (取更长的)
            if (buff.duration === -1 || existingBuff.duration === -1) { // 永续覆盖
                 if (existingBuff.duration !== -1) needsRecalculate = true; // 之前不是永续
                 existingBuff.duration = -1;
            } else if (buff.duration > existingBuff.duration) {
                 existingBuff.duration = buff.duration;
                 needsRecalculate = true; // 持续时间变化可能影响计算
            }

            // 处理叠加层数
            if (existingBuff.stackable && (existingBuff.currentStacks || 1) < maxStacks) {
                existingBuff.currentStacks = (existingBuff.currentStacks || 1) + 1;
                needsRecalculate = true;
            }

            // 更新效果值 (根据叠加行为)
            // 注意：对于子buff，其值可能依赖于父buff层数，在recalculateStats中处理
            if (!isSubBuff) { // 主buff才直接更新value
                 if (buff.stackingValueBehavior === 'add' && existingBuff.stackable && existingBuff.currentStacks > 1) {
                     // 累加逻辑可能复杂，取决于具体效果，这里简化为替换或取最大
                     existingBuff.value = buff.value; // 默认替换
                 } else if (buff.stackingValueBehavior === 'max') {
                     if (buff.value > existingBuff.value) {
                         existingBuff.value = buff.value;
                         needsRecalculate = true;
                     }
                 } else { // 默认替换
                     if (existingBuff.value !== buff.value) {
                         existingBuff.value = buff.value;
                         needsRecalculate = true;
                     }
                 }
            }

            // 如果有任何变化，重新计算属性
            if (needsRecalculate) {
                this.applyBuffEffect(target, existingBuff); // 应用效果（如护盾）
                this.recalculateStatsWithBuffs(target);
            }
            return true;

        } else {
            // --- 添加新的BUFF ---
            // 如果是不可叠加的主buff，先移除同类型的旧buff
            if (!buff.stackable && !isSubBuff) {
                const oldBuffIndex = target.buffs.findIndex(b => b.type === buff.type && !b.isSubBuff);
                if (oldBuffIndex > -1) {
                    this.removeBuff(target, target.buffs[oldBuffIndex].id);
                }
            }

            // 添加新buff
            target.buffs.push(buff);
            this.applyBuffEffect(target, buff); // 应用初始效果
            this.recalculateStatsWithBuffs(target); // 重新计算属性
            return true;
        }
    },

    /**
     * 应用一个BUFF包（来自技能定义）到目标
     * @param {object} target - 目标对象
     * @param {object} buffPackageData - 从技能JSON读取的buff包定义 (包含 name, effects, duration, dispellable, stackable, maxStacks 等)
     * @param {object} source - BUFF来源角色
     * @returns {boolean} 是否成功应用或更新
     */
    applyBuffPackage(target, buffPackageData, source) {
        if (!target || !buffPackageData || !buffPackageData.effects) return false;

        if (!target.buffs) target.buffs = [];

        // 查找已存在的同名BUFF包
        let existingPackage = target.buffs.find(b =>
            b.isBuffPackage && // 确保是包类型
            b.name === buffPackageData.buffName &&
            b.source?.id === source?.id // 同来源
        );

        if (existingPackage) {
            // --- 更新已存在的BUFF包 ---
            const maxStacks = existingPackage.maxStacks || 1;
            let needsUpdate = false;

            // 刷新持续时间
            const newDuration = buffPackageData.duration === 99 ? -1 : buffPackageData.duration; // 处理永续
            if (newDuration === -1 || existingPackage.duration === -1) {
                 if (existingPackage.duration !== -1) needsUpdate = true;
                 existingPackage.duration = -1;
            } else if (newDuration > existingPackage.duration) {
                 existingPackage.duration = newDuration;
                 needsUpdate = true;
            }

            // 叠加层数
            if (existingPackage.stackable && (existingPackage.currentStacks || 1) < maxStacks) {
                existingPackage.currentStacks = (existingPackage.currentStacks || 1) + 1;
                needsUpdate = true;
            }

            // 如果层数或持续时间变化，需要重新计算和应用子效果
            if (needsUpdate) {
                // 1. 移除旧的子效果
                this.removeSubBuffsOf(target, existingPackage.id);
                // 2. 根据新的层数和持续时间，重新创建并应用子效果
                this.applySubBuffsFromPackage(target, existingPackage, source);
                this.recalculateStatsWithBuffs(target);
            }
            return true;

        } else {
            // --- 创建新的BUFF包 ---
            const newPackage = this.createBuffPackage(
                buffPackageData.buffName,
                buffPackageData.buffs || buffPackageData.effects, // JSON中可能是buffs或effects
                buffPackageData.duration === 99 ? -1 : buffPackageData.duration,
                source,
                { // 传递包的属性
                    dispellable: buffPackageData.dispellable,
                    stackable: buffPackageData.stackable,
                    maxStacks: buffPackageData.maxStacks,
                    icon: buffPackageData.icon, // 可选
                    description: buffPackageData.description, // 可选
                    buffsPerStack: buffPackageData.buffsPerStack // 传递叠层效果定义
                }
            );
            if (!newPackage) return false;

            target.buffs.push(newPackage);
            // 应用初始的子效果
            this.applySubBuffsFromPackage(target, newPackage, source);
            this.recalculateStatsWithBuffs(target);
            return true;
        }
    },

    /**
     * 根据BUFF包及其当前状态，应用其子效果
     * @param {object} target - 目标对象
     * @param {object} buffPackage - BUFF包对象 (已存在于target.buffs中)
     * @param {object} source - 原始施法者 (用于子buff的source记录，可选)
     */
    applySubBuffsFromPackage(target, buffPackage, _source) {
        if (!buffPackage || !buffPackage.effects || !Array.isArray(buffPackage.effects)) return;

        const parentBuffId = buffPackage.id;
        const parentDuration = buffPackage.duration;
        const parentStacks = buffPackage.currentStacks || 1;
        const buffsPerStackDef = buffPackage.buffsPerStack; // 获取叠层效果定义

        for (const effectDef of buffPackage.effects) {
            let effectValue = effectDef.value;
            let effectType = effectDef.type;

            // 检查是否是叠层效果
            let perStackValue = null;
            if (buffsPerStackDef && Array.isArray(buffsPerStackDef)) {
                const stackEffectDef = buffsPerStackDef.find(ps => ps.type === effectType);
                if (stackEffectDef) {
                    perStackValue = stackEffectDef.value;
                }
            }

            // 如果是叠层效果，根据层数计算最终值
            if (perStackValue !== null) {
                // 假设叠层效果是线性叠加
                effectValue = perStackValue * parentStacks;
            }

            // 创建子BUFF
            const subBuff = this.createBuff(
                effectType,
                effectValue,
                parentDuration, // 子buff持续时间跟随父buff
                buffPackage, // 子buff的直接来源是父buff包
                { // 传递从父级继承或自身的属性
                    canDispel: buffPackage.canDispel, // 子buff的可驱散性通常跟随父buff
                    stackable: false, // 子buff本身通常不独立叠加，其效果由父buff层数决定
                    maxStacks: 1,
                    name: effectDef.name || `${buffPackage.name}-${effectType}` // 可以给子buff一个更具体的名字
                }
            );

            if (subBuff) {
                subBuff.parentBuffId = parentBuffId; // 关联父buff
                this.applyBuff(target, subBuff, true); // 应用子buff
            }
        }
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
