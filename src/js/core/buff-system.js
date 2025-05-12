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
            name: '攻击力提升', description: '提高攻击力', icon: '⚔️', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add'
        },
        attackDown: {
            name: '攻击力下降', description: '降低攻击力', icon: '⚔️❌', isPositive: false,
            canDispel: true, stackable: true, valueInteraction: 'add'
        },
        // 防御相关
        defenseUp: {
            name: '防御力提升', description: '提高防御力', icon: '🛡️', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add'
        },
        defenseDown: { 
            name: '防御力下降', description: '降低防御力', icon: '🛡️❌', isPositive: false,
            canDispel: true, stackable: true, valueInteraction: 'add' // 效果值上限-50在属性计算中处理
        },
        // 暴击相关
        critRateUp: {
            name: '暴击率提升', description: '提高暴击率', icon: '🎯', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add' // 效果值上限100%在属性计算中处理
        },
        criticalDamageUp: { 
            name: '暴击伤害提升', description: '提高暴击伤害', icon: '💥', isPositive: true,
            canDispel: true, stackable: false, valueInteraction: 'max'
        },
        // 多重攻击相关
        daBoost: { 
            name: 'DA提升', description: '提高双重攻击率', icon: '⚔️⚔️', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add' // 效果值上限100%在属性计算中处理
        },
        taBoost: { 
            name: 'TA提升', description: '提高三重攻击率', icon: '⚔️⚔️⚔️', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add' // 效果值上限100%在属性计算中处理
        },
        daDown: { 
            name: 'DA降低', description: '降低双重攻击率', icon: '⚔️⚔️❌', isPositive: false,
            canDispel: true, stackable: true, valueInteraction: 'add' // 效果值上限-100%在属性计算中处理
        },
        taDown: { 
            name: 'TA降低', description: '降低三重攻击率', icon: '⚔️⚔️⚔️❌', isPositive: false,
            canDispel: true, stackable: true, valueInteraction: 'add' // 效果值上限-100%在属性计算中处理
        },
        // 命中相关
        missRate: { 
            name: '命中率降低', description: '降低攻击命中率', icon: '👁️❌', isPositive: false,
            canDispel: true, stackable: false, valueInteraction: 'max' // 效果值上限100%在属性计算中处理
        },
        // 伤害相关
        damageUp: { 
            name: '伤害提升', description: '提高造成的伤害', icon: '🔥', isPositive: true,
            canDispel: true, stackable: false, valueInteraction: 'max'
        },
        allDamageTakenReduction: { 
            name: '全伤害减免', description: '减少受到的所有类型伤害', icon: '🛡️⬇️', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add' // 效果值上限100%在属性计算中处理
        },
        echo: { 
            name: '追击', description: '攻击时追加额外伤害', icon: '⚔️✨', isPositive: true,
            canDispel: true, stackable: false, valueInteraction: 'max' // 只取最高值的追击效果
        },
        damageCapUp: { 
            name: '伤害上限提升', description: '提高造成的伤害上限', icon: '⬆️💥', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'max' // 效果值上限20%在属性计算中处理
        },
        skillDamageCapUp: { 
            name: '技能伤害上限提升', description: '提高技能造成的伤害上限', icon: '⬆️🔥', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'max' // 效果值上限20%在属性计算中处理
        },
        skillDamageUp: {
            name: '技能伤害提升', description: '提高技能造成的伤害倍率', icon: '📜🔥', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add'
        },
        directDamageValueUp: {
            name: '固定伤害值提升', description: '每次攻击的原始伤害增加固定数值', icon: '⚔️+', isPositive: true,
            canDispel: true, stackable: false, valueInteraction: 'max'
        },
        // 持续伤害/治疗
        dot: { 
            name: '持续伤害', description: '每回合受到伤害', icon: '☠️', isPositive: false,
            canDispel: true, stackable: false, valueInteraction: 'replace' // 新的替换旧的同名DOT
        },
        regen: { 
            name: '再生', description: '每回合恢复生命值', icon: '💚', isPositive: true,
            canDispel: true, stackable: false, valueInteraction: 'max'
        },
        // 状态效果
        numbness: { 
            name: '麻痹', description: '无法行动', icon: '💫', isPositive: false,
            canDispel: true, stackable: false, valueInteraction: 'replace'
        },
        stun: { 
            name: '眩晕', description: '无法行动', icon: '😵', isPositive: false,
            canDispel: true, stackable: false, valueInteraction: 'replace'
        },
        silence: { 
            name: '沉默', description: '无法使用技能', icon: '🤐', isPositive: false,
            canDispel: true, stackable: false, valueInteraction: 'replace'
        },
        statusImmunity: { 
            name: '状态免疫', description: '免疫特定的负面状态', icon: '🚫✨', isPositive: true,
            canDispel: false, stackable: false, valueInteraction: 'replace'
        },
        debuffImmunity: { 
            name: '弱体免疫', description: '免疫所有弱体效果', icon: '🛡️🚫', isPositive: true,
            canDispel: false, stackable: false, valueInteraction: 'replace'
        },
        // 特殊效果
        shield: { 
            name: '护盾', description: '抵挡一定量的伤害', icon: '🔰', isPositive: true,
            canDispel: true, stackable: false, valueInteraction: 'max' // 取最高护盾值
        },
        invincible: {
            name: '无敌', description: '完全免疫伤害', icon: '🛡️✨', isPositive: true,
            canDispel: false, stackable: false, valueInteraction: 'replace'
        },
        evasionAll: { 
            name: '完全回避', description: '回避所有伤害', icon: '💨', isPositive: true,
            canDispel: true, stackable: false, valueInteraction: 'replace'
        },
        reflect: {
            name: '反伤', description: '反弹一部分受到的伤害', icon: '↩️', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add'
        },
        cover: {
            name: '援护', description: '替代队友承受单体攻击', icon: '🛡️🫂', isPositive: true,
            canDispel: true, stackable: false, valueInteraction: 'replace'
        },
        threatUp: {
            name: '敌对心提升', description: '更容易被敌人攻击', icon: '🎯⬆️', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add'
        },
        threatDown: {
            name: '敌对心降低', description: '更不容易被敌人攻击', icon: '🎯⬇️', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add'
        },
        extraAttackTurn: {
            name: '再攻击', description: '本回合可以再次行动', icon: '⚔️🔄', isPositive: true,
            canDispel: true, stackable: false, valueInteraction: 'replace'
        },
        debuffResistOnce: {
            name: '弱体无效(次)', description: '抵抗下一次受到的弱体效果', icon: '🛡️🔮', isPositive: true,
            canDispel: true, stackable: false, maxStacks: 1, valueInteraction: 'replace'
        },
        guts: {
            name: '不死身', description: '受到致命伤害时以1HP存活 (消耗型)', icon: '💪❤️‍🩹', isPositive: true,
            canDispel: false, stackable: false, maxStacks: 1, valueInteraction: 'replace'
        },
        // 元素增益/抗性
        elementalResistance: { 
            name: '元素伤害减轻', description: '减少受到的特定元素伤害', icon: '🛡️🔥', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add'
        },
        elementalDamageUp: {
            name: '元素伤害提升', description: '提高造成的特定元素伤害', icon: '🔥⬆️', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add'
        },
        // 背水/浑身
        staminaUp: { 
            name: '浑身', description: 'HP越高，属性提升越大', icon: '💪🟢', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add'
        },
        enmityUp: { 
            name: '背水', description: 'HP越低，属性提升越大', icon: '💪🔴', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'add'
        },
        // 元素伤害转换
        damageElementConversion: { 
            name: '伤害属性转换', description: '将受到的伤害转换为特定元素', icon: '🔄🎨', isPositive: true,
            canDispel: true, stackable: false, valueInteraction: 'replace'
        },
        elementalDamageCap: {
            name: '元素伤害上限', description: '限制受到的特定元素伤害的上限', icon: '🛡️🚫🔥', isPositive: true,
            canDispel: true, stackable: true, valueInteraction: 'max' 
        },
        // EX攻击提升 (already exists as exAttackUp, but ssr_skill.json might use a different term)
        // dot_vulnerability (already exists)

        // 复合BUFF类型 - This is a structural type, not an effect type itself.
        // Individual effects within a composite buff will use the types above.
        // The 'compositeBuff' type in buffTypes might be redundant if we handle buff packages structurally.
        // For now, keeping it for potential direct use, but applyBuffPackage in skills.json is the main driver.
        buffPackage: { 
            name: '效果包', description: '一个包含多种效果的特殊状态', icon: '📦✨', isPositive: true,
            canDispel: true, stackable: false, maxStacks: 1, valueInteraction: 'replace' 
        }
    }, // End of buffTypes

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
     * @param {object} options - 额外选项，如 { canDispel, stackable, maxStacks, elementType, statusToImmune, valueInteraction, etc. }
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
        // maxStacks: Use option if provided, then buffTypeDefinition, then default to 1 if stackable is false, else allow multiple if stackable true and no maxStacks defined
        let maxStacks;
        if (options.maxStacks !== undefined) {
            maxStacks = options.maxStacks;
        } else if (buffTypeDefinition.maxStacks !== undefined) {
            maxStacks = buffTypeDefinition.maxStacks;
        } else {
            maxStacks = stackable ? Infinity : 1; // If stackable but no specific max, assume Infinity
        }

        const isPositive = options.isPositive !== undefined ? options.isPositive : buffTypeDefinition.isPositive;
        const name = options.name || buffTypeDefinition.name; 
        const description = options.description || buffTypeDefinition.description;
        const icon = options.icon || buffTypeDefinition.icon;
        const valueInteraction = options.valueInteraction || buffTypeDefinition.valueInteraction || (stackable ? 'add' : 'replace');


        const buff = {
            id: `${type}_${name}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type,
            name,
            description,
            icon,
            value, 
            duration,
            initialDuration: duration,
            isPositive,
            canDispel,
            stackable,
            maxStacks,
            currentStacks: 1, 
            source: source ? { id: source.id, name: source.name } : null,
            createdAt: Date.now(),
            valueInteraction // Store this for applyBuff logic
        };

        // 添加特定于类型的属性
        if (type === 'elementalResistance' || type === 'elementalDamageUp' || type === 'elementalDamageCap') {
            buff.elementType = options.elementType; 
        }
        if (type === 'statusImmunity') {
            buff.statusToImmune = options.statusToImmune; 
        }
        if (type === 'damageElementConversion') {
            buff.convertToElementType = options.convertToElementType;
        }
        if (options.buffsPerStack) { 
            buff.buffsPerStack = options.buffsPerStack;
        }
        if (options.effects) { 
             buff.effects = options.effects; 
        }
        if (options.maxHits) { // For buffs like evasion with limited hits
            buff.maxHits = options.maxHits;
            buff.hitsRemaining = options.maxHits;
        }


        return buff;
    },

    /**
     * 创建一个复合BUFF (Buff Package)
     * @param {string} name - BUFF包的名称 (e.g., "晓之誇炎")
     * @param {array} effects - 子效果定义数组 (来自ssr_skill.json的effects数组)
     * @param {number} duration - 持续回合数
     * @param {object} source - BUFF来源
     * @param {object} packageOptions - 从ssr_skill.json读取的buff包的属性 { dispellable, stackable, maxStacks, icon, description, valueInteraction }
     * @returns {object} 复合BUFF对象 (实际上是一个标记了类型的普通buff，其effects将在applyBuffPackage时处理)
     */
    createBuffPackage(name, effects, duration, source = null, packageOptions = {}) {
        const buffTypeDef = this.buffTypes['buffPackage'] || {};
        return this.createBuff(
            'buffPackage', 
            null, 
            duration,
            source,
            {
                name: name,
                description: packageOptions.description || buffTypeDef.description || `效果包: ${name}`,
                icon: packageOptions.icon || buffTypeDef.icon || '📦✨',
                canDispel: packageOptions.dispellable !== undefined ? packageOptions.dispellable : buffTypeDef.canDispel,
                stackable: packageOptions.stackable !== undefined ? packageOptions.stackable : buffTypeDef.stackable,
                maxStacks: packageOptions.maxStacks !== undefined ? packageOptions.maxStacks : buffTypeDef.maxStacks,
                isPositive: packageOptions.isPositive !== undefined ? packageOptions.isPositive : buffTypeDef.isPositive, 
                effects: effects, 
                isBuffPackage: true,
                valueInteraction: packageOptions.valueInteraction || buffTypeDef.valueInteraction || 'replace'
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

        // 检查弱体抵抗和免疫 (仅对负面BUFF生效)
        if (buff.isPositive === false) {
            const immunityBuff = target.buffs.find(b => b.type === 'debuffImmunity' && b.duration > 0);
            if (immunityBuff) {
                Battle.logBattle(`${target.name} 因 [${immunityBuff.name}] 效果免疫了 [${buff.name}]。`);
                return false; 
            }
            const specificImmunity = target.buffs.find(b => b.type === 'statusImmunity' && b.statusToImmune === buff.type && b.duration > 0);
            if (specificImmunity) {
                 Battle.logBattle(`${target.name} 因 [${specificImmunity.name}] 效果免疫了 [${buff.name}]。`);
                return false; 
            }
            const resistOnceBuff = target.buffs.find(b => b.type === 'debuffResistOnce' && (b.currentStacks || 0) > 0 && b.duration > 0);
            if (resistOnceBuff) {
                Battle.logBattle(`${target.name} 因 [${resistOnceBuff.name}] 效果抵抗了 [${buff.name}]。`);
                resistOnceBuff.currentStacks = (resistOnceBuff.currentStacks || 1) - 1;
                if (resistOnceBuff.currentStacks <= 0) {
                    this.removeBuff(target, resistOnceBuff.id); 
                    Battle.logBattle(`[${resistOnceBuff.name}] 效果已消耗完毕。`);
                }
                return false; 
            }
        }

        buff.isSubBuff = isSubBuff;
        if (isSubBuff && !buff.parentBuffId) {
            console.error("子BUFF缺少parentBuffId:", buff);
            return false;
        }

        const existingBuff = target.buffs.find(b =>
            b.type === buff.type &&
            b.name === buff.name && 
            b.isSubBuff === isSubBuff && 
            (isSubBuff ? b.parentBuffId === buff.parentBuffId : (b.source?.id === buff.source?.id || !b.source || !buff.source)) // Allow matching if one or both sources are null
        );

        if (existingBuff) {
            const buffTypeDef = this.buffTypes[existingBuff.type] || {};
            // valueInteraction should be on the buff object itself (from createBuff), 
            // which gets it from options or buffTypeDefinition.
            const interaction = buff.valueInteraction || existingBuff.valueInteraction || buffTypeDef.valueInteraction || (existingBuff.stackable ? 'add' : 'replace');
            let needsRecalculate = false;

            // 刷新持续时间 (取更长的, 或永续覆盖)
            if (buff.duration === -1) { // New buff is permanent
                if(existingBuff.duration !== -1) needsRecalculate = true;
                existingBuff.duration = -1;
            } else if (existingBuff.duration !== -1 && buff.duration > existingBuff.duration) { // Only refresh if new is longer and existing is not permanent
                existingBuff.duration = buff.duration;
                needsRecalculate = true; 
            }
            // If existing is permanent, new finite duration does not override unless explicitly designed to. Current logic: permanent stays.

            // 处理叠加层数
            if (existingBuff.stackable) { // Check stackable from the buff instance itself
                const maxStacks = existingBuff.maxStacks || Infinity; // Use Infinity if no maxStacks defined for a stackable buff
                if ((existingBuff.currentStacks || 1) < maxStacks) {
                    existingBuff.currentStacks = (existingBuff.currentStacks || 1) + 1;
                    needsRecalculate = true;
                } else if (maxStacks === Infinity && interaction === 'add') { // For infinitely stackable 'add' buffs, always increment
                    existingBuff.currentStacks = (existingBuff.currentStacks || 1) + 1;
                    needsRecalculate = true;
                }
            }
            
            if (!isSubBuff) { 
                let valueChanged = false;
                const oldValue = existingBuff.value;

                switch (interaction) {
                    case 'add':
                        if (typeof buff.value === 'number') { 
                            if (typeof existingBuff.value === 'number') {
                                existingBuff.value += buff.value;
                            } else { 
                                existingBuff.value = buff.value;
                            }
                        }
                        break;
                    case 'max':
                        if (typeof buff.value === 'number') {
                            if (typeof existingBuff.value !== 'number' || buff.value > existingBuff.value) {
                                existingBuff.value = buff.value;
                            }
                        }
                        break;
                    case 'independent':
                        // If 'independent' and an existing buff is found, this implies a refresh of this specific instance.
                        // True independence (multiple instances from different skills/sources with same type/name)
                        // would mean the `find` logic for `existingBuff` should be more specific (e.g., include a unique effect instance ID).
                        // Given current find logic, we treat it like 'replace' for this specific found instance.
                        existingBuff.value = buff.value;
                        break;
                    case 'replace':
                    default:
                        existingBuff.value = buff.value;
                        break;
                }

                if (oldValue !== existingBuff.value) {
                    valueChanged = true;
                }
                if (valueChanged) {
                    needsRecalculate = true;
                }
            } 
            
            if (needsRecalculate) {
                this.recalculateStatsWithBuffs(target);
            }
            Battle.logBattle(`${target.name} 的BUFF [${existingBuff.name}] 已更新 (层数: ${existingBuff.currentStacks}, 持续时间: ${existingBuff.duration}, 值: ${existingBuff.value})。`);
            return true;
        } else {
            // --- 添加新的BUFF ---
            const buffTypeDefForNew = this.buffTypes[buff.type] || {};
            const isActuallyStackable = buff.stackable; 
            const valueInteractionForNew = buff.valueInteraction || buffTypeDefForNew.valueInteraction || (isActuallyStackable ? 'add' : 'replace');

            if ((!isActuallyStackable || valueInteractionForNew === 'replace') && !isSubBuff) {
                let oldBuffIndex = -1;
                do { 
                    oldBuffIndex = target.buffs.findIndex(b => b.type === buff.type && b.name === buff.name && !b.isSubBuff);
                    if (oldBuffIndex > -1) {
                        const removedBuff = target.buffs.splice(oldBuffIndex, 1)[0];
                        this.removeBuffEffect(target, removedBuff); 
                        Battle.logBattle(`因应用新的 [${buff.name}] (stackable: ${isActuallyStackable}, interaction: ${valueInteractionForNew}), 移除了旧的 [${removedBuff.name}]。`);
                    }
                } while (oldBuffIndex > -1 && valueInteractionForNew === 'replace' && !isActuallyStackable);
            }
            
            target.buffs.push(buff);
            if (buff.name === '一伐架式') {
                BattleLogger.log(BattleLogger.levels.CONSOLE_DETAIL, `[DEBUG_YIFA] Buff '一伐架式' pushed to target ${target.name}. Duration: ${buff.duration}, Value: ${buff.value}, Stackable: ${buff.stackable}`);
            }
            if (buff.isBuffPackage && Array.isArray(buff.effects)) {
                this.applySubBuffsFromPackage(target, buff, buff.source || source);
            }
            this.recalculateStatsWithBuffs(target);
            Battle.logBattle(`${target.name} 获得了BUFF [${buff.name}] (值: ${buff.value}, 持续时间: ${buff.duration}, 层数: ${buff.currentStacks})。`);
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
        if (!target || !buffPackageData || !(buffPackageData.buffs || buffPackageData.effects)) return false;

        if (!target.buffs) target.buffs = [];
        
        const packageName = buffPackageData.buffName || buffPackageData.name || '效果包';

        let existingPackage = target.buffs.find(b =>
            b.isBuffPackage && 
            b.name === packageName &&
            b.source?.id === source?.id 
        );

        const buffTypeDef = this.buffTypes['buffPackage'] || {};
        const packageOptions = {
            description: buffPackageData.description || buffTypeDef.description,
            icon: buffPackageData.icon || buffTypeDef.icon,
            canDispel: buffPackageData.dispellable !== undefined ? buffPackageData.dispellable : buffTypeDef.canDispel,
            stackable: buffPackageData.stackable !== undefined ? buffPackageData.stackable : buffTypeDef.stackable,
            maxStacks: buffPackageData.maxStacks !== undefined ? buffPackageData.maxStacks : buffTypeDef.maxStacks,
            isPositive: buffPackageData.isPositive !== undefined ? buffPackageData.isPositive : buffTypeDef.isPositive,
            valueInteraction: buffPackageData.valueInteraction || buffTypeDef.valueInteraction || 'replace',
            buffsPerStack: buffPackageData.buffsPerStack
        };


        if (existingPackage) {
            let needsUpdate = false;
            const newDuration = buffPackageData.duration === 99 ? -1 : buffPackageData.duration;

            if (newDuration === -1 || existingPackage.duration === -1) {
                 if (existingPackage.duration !== -1) needsUpdate = true;
                 existingPackage.duration = -1;
            } else if (newDuration > existingPackage.duration) {
                 existingPackage.duration = newDuration;
                 needsUpdate = true;
            }

            if (existingPackage.stackable) {
                const maxStacks = existingPackage.maxStacks || Infinity;
                 if ((existingPackage.currentStacks || 1) < maxStacks) {
                    existingPackage.currentStacks = (existingPackage.currentStacks || 1) + 1;
                    needsUpdate = true;
                }
            }
            
            // Update other properties from packageOptions if they can change on re-application
            existingPackage.canDispel = packageOptions.canDispel;
            // existingPackage.stackable = packageOptions.stackable; // Stackability usually doesn't change
            // existingPackage.maxStacks = packageOptions.maxStacks; // Max stacks usually doesn't change
            existingPackage.valueInteraction = packageOptions.valueInteraction;


            if (needsUpdate) {
                this.removeSubBuffsOf(target, existingPackage.id);
                this.applySubBuffsFromPackage(target, existingPackage, source);
                this.recalculateStatsWithBuffs(target);
            }
            Battle.logBattle(`${target.name} 的效果包 [${existingPackage.name}] 已更新。`);
            return true;

        } else {
            if (!packageOptions.stackable) { // If new package is not stackable, remove old one of same name from any source
                const oldPackageIndex = target.buffs.findIndex(b => b.isBuffPackage && b.name === packageName);
                if (oldPackageIndex > -1) {
                    const removedPackage = target.buffs.splice(oldPackageIndex, 1)[0];
                    this.removeSubBuffsOf(target, removedPackage.id);
                     Battle.logBattle(`移除了旧的效果包 [${removedPackage.name}] 以应用新的 [${packageName}]。`);
                }
            }

            const newPackage = this.createBuffPackage(
                packageName,
                buffPackageData.buffs || buffPackageData.effects, 
                buffPackageData.duration === 99 ? -1 : buffPackageData.duration,
                source,
                packageOptions
            );
            if (!newPackage) return false;

            target.buffs.push(newPackage);
            this.applySubBuffsFromPackage(target, newPackage, source);
            this.recalculateStatsWithBuffs(target);
            Battle.logBattle(`${target.name} 获得了效果包 [${newPackage.name}]。`);
            return true;
        }
    },

    /**
     * 根据BUFF包及其当前状态，应用其子效果
     * @param {object} target - 目标对象
     * @param {object} buffPackage - BUFF包对象 (已存在于target.buffs中)
     * @param {object} source - 原始施法者 (用于子buff的source记录，可选)
     */
    applySubBuffsFromPackage(target, buffPackage, _source) { // _source is the original caster of the package
        if (!buffPackage || !buffPackage.effects || !Array.isArray(buffPackage.effects)) return;

        const parentBuffId = buffPackage.id;
        const parentDuration = buffPackage.duration;
        const parentStacks = buffPackage.currentStacks || 1;
        const buffsPerStackDef = buffPackage.buffsPerStack; 

        for (const effectDef of buffPackage.effects) {
            let effectValue = effectDef.value;
            let effectType = effectDef.type;
            let effectDuration = effectDef.duration !== undefined ? effectDef.duration : parentDuration; // Sub-buff can have its own duration

            let perStackValue = null;
            if (buffsPerStackDef && Array.isArray(buffsPerStackDef)) {
                const stackEffectDef = buffsPerStackDef.find(ps => ps.type === effectType);
                if (stackEffectDef) {
                    perStackValue = stackEffectDef.value;
                }
            }

            if (perStackValue !== null) {
                effectValue = typeof perStackValue === 'number' ? perStackValue * parentStacks : perStackValue;
            }
            
            // Inherit canDispel from package if not specified on sub-buff
            const subBuffCanDispel = effectDef.canDispel !== undefined ? effectDef.canDispel : buffPackage.canDispel;

            const subBuff = this.createBuff(
                effectType,
                effectValue,
                effectDuration, 
                buffPackage.source, // Source of sub-buff is the original caster of the package
                { 
                    canDispel: subBuffCanDispel, 
                    stackable: false, // Sub-buffs of a package instance are generally not themselves stackable with each other
                    maxStacks: 1,
                    name: effectDef.name || `${buffPackage.name}-${effectType}`,
                    // valueInteraction for sub-buffs is typically 'replace' as their value is derived from the parent
                    valueInteraction: 'replace' 
                }
            );

            if (subBuff) {
                subBuff.parentBuffId = parentBuffId; 
                this.applyBuff(target, subBuff, true); 
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
            const index = target.buffs.findIndex(b => b.id === subBuff.id);
            if (index > -1) {
                target.buffs.splice(index, 1);
                // No need to call removeBuffEffect here as their effects are tied to the parent
            }
        }
    },

    /**
     * 根据当前BUFF重新计算角色属性 (非常简化，实际应更复杂)
     * @param {object} target - 目标对象
     */
    recalculateStatsWithBuffs(target) {
        if (!target || !target.baseStats) return;

        // 保存当前的HP和MaxHP，以防被意外覆盖
        const preservedHp = target.currentStats ? target.currentStats.hp : undefined;
        const preservedMaxHp = target.currentStats ? target.currentStats.maxHp : undefined;

        // 重置为基础属性 (或战斗开始时的属性)
        target.currentStats = JSON.parse(JSON.stringify(target.originalStats || target.baseStats));
        if (!target.buffs) target.buffs = [];

        // 恢复之前保存的HP和MaxHP
        // 确保 maxHp 优先使用 preservedMaxHp，如果不存在则尝试从 baseStats 获取，最后才是 currentStats (可能已被重置)
        target.currentStats.maxHp = preservedMaxHp !== undefined ? preservedMaxHp :
                                   (target.originalStats ? target.originalStats.maxHp : undefined) ||
                                   target.baseStats.maxHp ||
                                   target.currentStats.maxHp || 0;
        // 确保 hp 不超过恢复后的 maxHp，并且不低于0
        target.currentStats.hp = preservedHp !== undefined ? Math.max(0, Math.min(preservedHp, target.currentStats.maxHp)) :
                                 Math.max(0, target.currentStats.maxHp || 0);


        // 应用所有BUFF效果来修改其他属性
        // applyBuffEffect 应该主要修改攻防等属性，不应直接修改HP（持续伤害/治疗由其他机制处理）
        target.buffs.forEach(buff => {
            if (buff.duration > 0 || buff.duration === -1) {
                this.applyBuffEffect(target, buff);
            }
        });

        // 再次确保HP不超上限，因为applyBuffEffect可能会影响maxHp（例如通过某种buff）
        if (target.currentStats.hp > target.currentStats.maxHp) {
            target.currentStats.hp = target.currentStats.maxHp;
        }
        // 确保HP不为负 (虽然伤害计算时已处理，但多一层保险)
        if (target.currentStats.hp < 0) {
             target.currentStats.hp = 0;
        }
    },

    /**
     * 应用单个BUFF的属性修改效果 (简化版)
     * @param {object} target - 目标对象
     * @param {object} buff - BUFF对象
     */
    applyBuffEffect(target, buff) {
        if (!target || !buff || !target.currentStats) return;
        const value = buff.value * (buff.currentStacks || 1); //考虑层数

        switch (buff.type) {
            case 'attackUp': target.currentStats.attack = Math.max(0, (target.currentStats.attack || 0) + (target.baseStats.attack * value)); break; // 假设value是百分比
            case 'attackDown': target.currentStats.attack = Math.max(0, (target.currentStats.attack || 0) - (target.baseStats.attack * value)); break;
            case 'defenseUp': target.currentStats.defense = Math.max(0, (target.currentStats.defense || 0) + (target.baseStats.defense * value)); break;
            case 'defenseDown': target.currentStats.defense = Math.max(0, (target.currentStats.defense || 0) - value); break; // 假设是固定值，上限-50在外部处理
            case 'critRateUp': target.currentStats.critRate = Math.min(1, (target.currentStats.critRate || 0) + value); break; // 上限100%
            case 'criticalDamageUp': target.currentStats.critDamage = (target.currentStats.critDamage || 1.5) + value; break;
            case 'daBoost': target.currentStats.daRate = Math.min(1, (target.currentStats.daRate || 0) + value); break; // 上限100%
            case 'taBoost': target.currentStats.taRate = Math.min(1, (target.currentStats.taRate || 0) + value); break; // 上限100%
            // ... 其他属性修改型buff
            case 'shield': 
                // 护盾值不直接修改stats，而是作为独立属性存在于target上，由伤害计算逻辑处理
                // target.shield = (target.shield || 0) + value; // 如果是叠加逻辑
                if (!target.shield || value > target.shield) { // 如果是取最大值逻辑
                    target.shield = value;
                }
                break;
             case 'staminaUp': // 浑身，具体效果在伤害公式中体现
             case 'enmityUp':  // 背水，具体效果在伤害公式中体现
                break; 
            // 注意：很多buff（如echo, dot, regen, status effects）的效果不是直接修改面板属性，
            // 而是由战斗流程的其他部分（如攻击时、回合开始/结束时）来检查和触发。
        }
    },

    /**
     * 移除BUFF并反转其属性修改效果 (简化版)
     * @param {object} target - 目标对象
     * @param {string} buffId - 要移除的BUFF ID
     */
    removeBuff(target, buffId) {
        if (!target || !target.buffs) return;
        const index = target.buffs.findIndex(b => b.id === buffId);
        if (index > -1) {
            const removedBuff = target.buffs.splice(index, 1)[0];
            if (removedBuff.name === '一伐架式') {
                BattleLogger.log(BattleLogger.levels.CONSOLE_DETAIL, `[DEBUG_YIFA] Buff '一伐架式' removed from target ${target.name}. Reason: Duration ended or dispelled.`);
            }
            if (removedBuff.isBuffPackage) { // 如果是包，移除其子buff
                this.removeSubBuffsOf(target, removedBuff.id);
            }
            this.removeBuffEffect(target, removedBuff); // 反转属性修改
            this.recalculateStatsWithBuffs(target); // 重新计算所有剩余buff
            Battle.logBattle(`${target.name} 的BUFF [${removedBuff.name}] 效果结束。`);
        }
    },
    
    /**
     * 移除一个复合BUFF及其所有子BUFF
     * @param {object} target - 目标对象
     * @param {string} buffId - 父BUFF的ID
     */
    removeCompositeBuff(target, buffId) {
        if (!target || !target.buffs || !buffId) return;
        const index = target.buffs.findIndex(b => b.id === buffId && b.isBuffPackage);
        if (index > -1) {
            const removedPackage = target.buffs.splice(index, 1)[0];
            this.removeSubBuffsOf(target, removedPackage.id); // 移除子buff
            // 父包本身可能没有直接的属性修改效果，其效果通过子buff体现
            // 但如果父包有，也需要反转
            // this.removeBuffEffect(target, removedPackage); 
            this.recalculateStatsWithBuffs(target);
            Battle.logBattle(`${target.name} 的效果包 [${removedPackage.name}] 已移除。`);
        } else {
            // 如果不是包，按普通buff移除
            this.removeBuff(target, buffId);
        }
    },


    /**
     * 反转单个BUFF的属性修改效果 (简化版)
     * @param {object} target - 目标对象
     * @param {object} buff - BUFF对象
     */
    removeBuffEffect(target, buff) {
        if (!target || !buff || !target.currentStats) return;
        const value = buff.value * (buff.currentStacks || 1);

        switch (buff.type) {
            case 'attackUp': target.currentStats.attack = Math.max(0, (target.currentStats.attack || 0) - (target.baseStats.attack * value)); break;
            case 'attackDown': target.currentStats.attack = Math.max(0, (target.currentStats.attack || 0) + (target.baseStats.attack * value)); break;
            case 'defenseUp': target.currentStats.defense = Math.max(0, (target.currentStats.defense || 0) - (target.baseStats.defense * value)); break;
            case 'defenseDown': target.currentStats.defense = Math.max(0, (target.currentStats.defense || 0) + value); break;
            case 'critRateUp': target.currentStats.critRate = Math.max(0, (target.currentStats.critRate || 0) - value); break;
            case 'criticalDamageUp': target.currentStats.critDamage = Math.max(1.5, (target.currentStats.critDamage || 1.5) - value); break;
            case 'daBoost': target.currentStats.daRate = Math.max(0, (target.currentStats.daRate || 0) - value); break;
            case 'taBoost': target.currentStats.taRate = Math.max(0, (target.currentStats.taRate || 0) - value); break;
            // ... 其他属性修改型buff的反转
            case 'shield':
                // 护盾移除时不直接影响属性，其值在target.shield中管理
                // 如果需要，可以在这里将target.shield清零或根据特定逻辑处理
                // target.shield = 0; // 示例：简单清零
                break;
        }
    },

    /**
     * 驱散目标身上的BUFF
     * @param {object} target - 目标对象
     * @param {boolean} isPositive - true驱散正面BUFF，false驱散负面BUFF
     * @param {number} count - 驱散数量
     */
    dispelBuffs(target, isPositive, count = 1) {
        if (!target || !target.buffs) return;
        let dispelledCount = 0;
        const buffsToDispel = [];

        // 从后往前遍历，因为我们会修改数组
        for (let i = target.buffs.length - 1; i >= 0; i--) {
            if (dispelledCount >= count) break;
            const buff = target.buffs[i];
            if (buff.isPositive === isPositive && buff.canDispel) {
                buffsToDispel.push(buff.id);
                dispelledCount++;
            }
        }

        buffsToDispel.forEach(buffId => this.removeBuff(target, buffId));
        if (dispelledCount > 0) {
            Battle.logBattle(`${target.name} 的 ${dispelledCount} 个${isPositive ? '正面' : '负面'}效果被驱散了。`);
        }
        return dispelledCount;
    },

    /**
     * 更新目标身上所有BUFF的持续时间
     * @param {object} target - 目标对象
     */
    updateBuffDurations(target) {
        if (!target || !target.buffs) return;
        let statsChanged = false;
        for (let i = target.buffs.length - 1; i >= 0; i--) {
            const buff = target.buffs[i];
            if (buff.duration > 0) {
                buff.duration--;
                if (buff.duration === 0) {
                    const removedBuff = target.buffs.splice(i, 1)[0];
                     if (removedBuff.isBuffPackage) { // 如果是包，移除其子buff
                        this.removeSubBuffsOf(target, removedBuff.id);
                    }
                    this.removeBuffEffect(target, removedBuff); // 反转属性修改
                    statsChanged = true;
                    Battle.logBattle(`${target.name} 的BUFF [${removedBuff.name}] 效果结束。`);
                }
            }
        }
        if (statsChanged) {
            this.recalculateStatsWithBuffs(target);
        }
    },

    /**
     * 处理回合开始时的BUFF效果（如DOT、再生）
     * @param {object} target - 目标对象
     * @returns {object} { damage: number, healing: number }
     */
    processBuffsAtTurnStart(target) {
        let turnDamage = 0;
        let turnHealing = 0;
        if (!target || !target.buffs) return { damage: turnDamage, healing: turnHealing };

        for (const buff of target.buffs) {
            if (buff.duration > 0 || buff.duration === -1) { // -1 for permanent
                switch (buff.type) {
                    case 'dot':
                        const dotDamage = Math.floor(buff.value * (buff.currentStacks || 1));
                        target.currentStats.hp = Math.max(0, target.currentStats.hp - dotDamage);
                        turnDamage += dotDamage;
                        Battle.logBattle(`${target.name} 因 [${buff.name}] 受到 ${dotDamage} 点持续伤害。`);
                        break;
                    case 'regen':
                        const regenAmount = Math.floor(buff.value * (buff.currentStacks || 1));
                        const oldHp = target.currentStats.hp;
                        target.currentStats.hp = Math.min(target.currentStats.maxHp, target.currentStats.hp + regenAmount);
                        turnHealing += (target.currentStats.hp - oldHp);
                        Battle.logBattle(`${target.name} 因 [${buff.name}] 恢复了 ${regenAmount} 点生命。`);
                        break;
                }
            }
        }
        if (turnDamage > 0 || turnHealing > 0) {
            this.recalculateStatsWithBuffs(target); // HP变化可能影响其他依赖HP的buff或属性
        }
        return { damage: turnDamage, healing: turnHealing };
    },

    /**
     * 获取目标身上的所有BUFF
     * @param {object} target - 目标对象
     * @returns {array} BUFF数组
     */
    getBuffs(target) {
        return target && target.buffs ? target.buffs : [];
    },

    /**
     * 获取目标身上特定类型的BUFF
     * @param {object} target - 目标对象
     * @param {string} type - BUFF类型
     * @returns {array} BUFF数组
     */
    getBuffsByType(target, type) {
        if (!target || !target.buffs) return [];
        return target.buffs.filter(buff => buff.type === type && (buff.duration > 0 || buff.duration === -1));
    },

    /**
     * 清除目标身上所有BUFF
     * @param {object} target - 目标对象
     */
    clearAllBuffs(target) {
        if (target && target.buffs) {
            for (let i = target.buffs.length - 1; i >= 0; i--) {
                const buff = target.buffs[i];
                 if (buff.isBuffPackage) {
                    this.removeSubBuffsOf(target, buff.id);
                }
                this.removeBuffEffect(target, buff);
            }
            target.buffs = [];
            this.recalculateStatsWithBuffs(target);
            BattleLogger.log(BattleLogger.levels.BATTLE_LOG, `${target.name} 的所有BUFF效果已被清除。`);
        }
    },

    /**
     * 根据类型名称获取BUFF的完整定义
     * @param {string} typeName - BUFF的类型名称 (例如 "defenseDown", "attackUp")
     * @returns {object|null} BUFF的定义对象，如果未找到则返回null
     */
    getBuffDefinition(typeName) {
        if (this.buffTypes.hasOwnProperty(typeName)) {
            return this.buffTypes[typeName];
        }
        return null;
    }
};

// 确保在其他模块加载和使用BuffSystem之前，这些扩展和方法已经准备好
if (typeof window !== 'undefined') {
    window.BuffSystem = BuffSystem;
}

export default BuffSystem;
