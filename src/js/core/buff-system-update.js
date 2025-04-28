/**
 * BUFF系统更新 - 扩展BUFF系统以支持所有技能效果
 */

// 在BuffSystem对象中添加以下BUFF类型和方法

/**
 * 添加新的BUFF类型
 */
function updateBuffTypes() {
    // 添加以下BUFF类型到BuffSystem.buffTypes对象中
    
    // 伤害上限
    damageCap: {
        name: '伤害上限',
        description: '限制受到的伤害',
        icon: '🛡️🔒',
        isPositive: true,
        canDispel: false,
        stackable: false
    },
    
    // 元素转换
    elementConversion: {
        name: '元素转换',
        description: '伤害转换为有利属性',
        icon: '🔄',
        isPositive: true,
        canDispel: false,
        stackable: false
    },
    
    // 元素抗性
    elementalResistance: {
        name: '元素抗性',
        description: '减少特定元素伤害',
        icon: '🛡️🔥',
        isPositive: true,
        canDispel: false,
        stackable: true
    },
    
    // 援护
    cover: {
        name: '援护',
        description: '成为攻击目标',
        icon: '🛡️👥',
        isPositive: true,
        canDispel: false,
        stackable: false
    },
    
    // 反击
    counterAttack: {
        name: '反击',
        description: '受到攻击时反击',
        icon: '⚔️↩️',
        isPositive: true,
        canDispel: false,
        stackable: false
    },
    
    // 忽略DEBUFF
    ignoreDebuff: {
        name: '无视DEBUFF',
        description: '无视特定DEBUFF效果',
        icon: '❌🚫',
        isPositive: true,
        canDispel: false,
        stackable: false
    },
    
    // 持续恢复
    regen: {
        name: '持续恢复',
        description: '每回合恢复生命值',
        icon: '💚↗️',
        isPositive: true,
        canDispel: true,
        stackable: true
    },
    
    // 全属性提升
    allStatsUp: {
        name: '全属性提升',
        description: '提高所有属性',
        icon: '⬆️✨',
        isPositive: true,
        canDispel: true,
        stackable: true
    },
    
    // 回合结束效果
    endOfTurn: {
        name: '回合结束效果',
        description: '回合结束时触发效果',
        icon: '🔄',
        isPositive: true,
        canDispel: false,
        stackable: false
    }
}

/**
 * 更新applyBuffEffect方法，支持所有BUFF类型
 * @param {object} target - 目标对象
 * @param {object} buff - BUFF对象
 */
function updateApplyBuffEffect(target, buff) {
    if (!target || !buff) return;
    
    // 根据BUFF类型应用不同效果
    switch (buff.type) {
        case 'shield':
            // 护盾效果直接添加到目标的shield属性
            target.shield = (target.shield || 0) + buff.value;
            break;
            
        case 'allStatsUp':
            // 全属性提升
            const statValue = typeof buff.value === 'number' ? buff.value : 
                              (buff.minValue && buff.maxValue ? 
                               buff.minValue + Math.random() * (buff.maxValue - buff.minValue) : 0.1);
            
            // 提升所有基础属性
            target.currentStats.attack *= (1 + statValue);
            target.currentStats.defense *= (1 + statValue);
            target.currentStats.speed *= (1 + statValue);
            target.currentStats.maxHp *= (1 + statValue);
            
            // 更新当前HP，但不超过新的最大HP
            target.currentStats.hp = Math.min(target.currentStats.hp * (1 + statValue), target.currentStats.maxHp);
            break;
            
        case 'damageCap':
            // 伤害上限不需要在这里处理，会在伤害计算时使用
            break;
            
        case 'elementConversion':
            // 元素转换不需要在这里处理，会在伤害计算时使用
            break;
            
        case 'elementalResistance':
            // 元素抗性不需要在这里处理，会在伤害计算时使用
            break;
            
        case 'cover':
            // 援护效果不需要在这里处理，会在伤害计算时使用
            break;
            
        case 'counterAttack':
            // 反击效果不需要在这里处理，会在回合结束时使用
            break;
            
        case 'ignoreDebuff':
            // 忽略DEBUFF效果不需要在这里处理，会在DEBUFF应用时使用
            break;
            
        case 'regen':
            // 持续恢复不需要在这里处理，会在回合开始时使用
            break;
            
        case 'endOfTurn':
            // 回合结束效果不需要在这里处理，会在回合结束时使用
            break;
            
        // 其他BUFF效果在计算伤害时应用
    }
}

/**
 * 更新removeBuffEffect方法，支持所有BUFF类型
 * @param {object} target - 目标对象
 * @param {object} buff - BUFF对象
 */
function updateRemoveBuffEffect(target, buff) {
    if (!target || !buff) return;
    
    // 根据BUFF类型移除不同效果
    switch (buff.type) {
        case 'shield':
            // 移除护盾效果
            target.shield = 0;
            break;
            
        case 'allStatsUp':
            // 移除全属性提升效果
            // 注意：这里简化处理，实际上应该记录原始值并恢复
            const statValue = typeof buff.value === 'number' ? buff.value : 
                              (buff.minValue && buff.maxValue ? 
                               (buff.minValue + buff.maxValue) / 2 : 0.1);
            
            // 恢复所有基础属性
            target.currentStats.attack /= (1 + statValue);
            target.currentStats.defense /= (1 + statValue);
            target.currentStats.speed /= (1 + statValue);
            target.currentStats.maxHp /= (1 + statValue);
            
            // 确保当前HP不超过新的最大HP
            target.currentStats.hp = Math.min(target.currentStats.hp, target.currentStats.maxHp);
            break;
            
        // 其他BUFF效果不需要特殊处理
    }
}

/**
 * 检查目标是否可以忽略特定类型的DEBUFF
 * @param {object} target - 目标对象
 * @param {string} debuffType - DEBUFF类型
 * @returns {boolean} 是否可以忽略
 */
function canIgnoreDebuff(target, debuffType) {
    if (!target || !target.buffs) return false;
    
    // 检查是否有忽略DEBUFF的BUFF
    return target.buffs.some(buff => 
        buff.type === 'ignoreDebuff' && 
        (!buff.debuffType || buff.debuffType === debuffType)
    );
}

/**
 * 更新processBuffsAtTurnStart方法，支持持续恢复效果
 * @param {object} target - 目标对象
 * @returns {object} 处理结果
 */
function updateProcessBuffsAtTurnStart(target) {
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
        } else if (buff.type === 'hot' || buff.type === 'regen') {
            // 持续治疗
            const healing = Math.floor(buff.value);
            target.currentStats.hp = Math.min(target.currentStats.maxHp, target.currentStats.hp + healing);
            totalHealing += healing;
        }
    }
    
    return { damage: totalDamage, healing: totalHealing };
}

/**
 * 处理援护效果
 * @param {array} teamMembers - 队伍成员
 * @param {object} target - 受到攻击的目标
 * @param {object} attacker - 攻击者
 * @returns {object|null} 援护者或null
 */
function processCoverEffect(teamMembers, target, attacker) {
    if (!teamMembers || !target) return null;
    
    // 检查队伍中是否有角色拥有援护BUFF
    for (const member of teamMembers) {
        if (member === target || member.currentStats.hp <= 0) continue;
        
        if (member.buffs && member.buffs.some(buff => buff.type === 'cover')) {
            const coverBuff = member.buffs.find(buff => buff.type === 'cover');
            
            // 如果有概率属性，则根据概率决定是否触发
            if (coverBuff.chance && Math.random() > coverBuff.chance) {
                continue;
            }
            
            return member;
        }
    }
    
    return null;
}
