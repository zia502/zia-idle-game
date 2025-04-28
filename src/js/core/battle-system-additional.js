/**
 * 战斗系统额外更新 - 添加对回合开始效果和攻击概率触发效果的支持
 */

// 在Battle对象中添加以下方法和更新

/**
 * 处理回合开始时的效果
 * @param {object} entity - 实体对象（角色或怪物）
 * @param {array} teamMembers - 队伍成员
 * @param {object} monster - 怪物对象
 */
function processTurnStartEffects(entity, teamMembers, monster) {
    if (!entity || entity.currentStats.hp <= 0) return;
    
    // 处理BUFF中的回合开始效果
    if (entity.buffs) {
        for (const buff of entity.buffs) {
            if (buff.type === 'startOfTurn' && buff.effect) {
                this.processStartOfTurnEffect(entity, buff.effect, teamMembers, monster);
            }
        }
    }
    
    // 处理被动技能中的回合开始效果
    if (entity.skills) {
        for (const skillId of entity.skills) {
            const skill = JobSystem.getSkill(skillId);
            if (skill && skill.passive && skill.effects) {
                for (const effect of skill.effects) {
                    if (effect.type === 'startOfTurn') {
                        this.processStartOfTurnEffect(entity, effect.effect, teamMembers, monster);
                    }
                }
            }
        }
    }
}

/**
 * 处理回合开始时的特定效果
 * @param {object} source - 效果来源
 * @param {object} effect - 效果对象
 * @param {array} teamMembers - 队伍成员
 * @param {object} monster - 怪物对象
 */
function processStartOfTurnEffect(source, effect, teamMembers, monster) {
    if (!effect || !effect.type) return;
    
    switch (effect.type) {
        case 'damage':
            // 单体伤害效果
            const target = this.getEffectTarget(effect.targetType, source, teamMembers, monster);
            if (target) {
                const rawDamage = Math.floor(source.currentStats.attack * (effect.multiplier || 1.0));
                const actualDamage = this.applyDamageToTarget(source, target, rawDamage);
                this.logBattle(`${source.name} 的回合开始效果对 ${target.name} 造成了 ${actualDamage} 点伤害！`);
            }
            break;
            
        case 'heal':
            // 治疗效果
            const healTarget = this.getEffectTarget(effect.targetType, source, teamMembers, monster);
            if (healTarget) {
                const healAmount = Math.floor(effect.value || (source.currentStats.attack * 0.5));
                healTarget.currentStats.hp = Math.min(healTarget.currentStats.maxHp, healTarget.currentStats.hp + healAmount);
                this.logBattle(`${source.name} 的回合开始效果为 ${healTarget.name} 恢复了 ${healAmount} 点生命值！`);
            }
            break;
            
        case 'buff':
            // BUFF效果
            const buffTargets = this.getEffectTargets(effect.targetType, source, teamMembers, monster);
            for (const target of buffTargets) {
                if (target.currentStats.hp <= 0) continue;
                
                const buff = BuffSystem.createBuff(effect.buffType, effect.value, effect.duration, source);
                if (buff) {
                    BuffSystem.applyBuff(target, buff);
                    this.logBattle(`${source.name} 的回合开始效果为 ${target.name} 添加了 ${buff.name} 效果！`);
                }
            }
            break;
            
        case 'debuff':
            // DEBUFF效果
            const debuffTargets = this.getEffectTargets(effect.targetType, source, teamMembers, monster);
            for (const target of debuffTargets) {
                if (target.currentStats.hp <= 0) continue;
                
                const debuff = BuffSystem.createBuff(effect.debuffType, effect.value, effect.duration, source);
                if (debuff) {
                    BuffSystem.applyBuff(target, debuff);
                    this.logBattle(`${source.name} 的回合开始效果对 ${target.name} 施加了 ${debuff.name} 效果！`);
                }
            }
            break;
    }
}

/**
 * 处理攻击概率触发效果
 * @param {object} attacker - 攻击者
 * @param {object} target - 目标
 * @param {object} battleStats - 战斗统计
 */
function processAttackProcEffects(attacker, target, battleStats) {
    if (!attacker || !attacker.skills || attacker.currentStats.hp <= 0 || target.currentStats.hp <= 0) return;
    
    // 处理被动技能中的攻击触发效果
    for (const skillId of attacker.skills) {
        const skill = JobSystem.getSkill(skillId);
        if (!skill || !skill.passive || !skill.effects) continue;
        
        for (const effect of skill.effects) {
            if (effect.type === 'proc' && effect.onAttack) {
                // 检查触发概率
                if (Math.random() < (effect.chance || 0.5)) {
                    this.processProcEffect(attacker, target, effect.effect, battleStats);
                }
            }
        }
    }
}

/**
 * 处理特定的触发效果
 * @param {object} source - 效果来源
 * @param {object} target - 目标
 * @param {object} effect - 效果对象
 * @param {object} battleStats - 战斗统计
 */
function processProcEffect(source, target, effect, battleStats) {
    if (!effect || !effect.type) return;
    
    switch (effect.type) {
        case 'damage':
            // 伤害效果
            let damageMultiplier = effect.multiplier || 1.0;
            
            // 如果有最小和最大倍率，随机生成倍率
            if (effect.minMultiplier && effect.maxMultiplier) {
                damageMultiplier = effect.minMultiplier + Math.random() * (effect.maxMultiplier - effect.minMultiplier);
            }
            
            // 计算原始伤害
            const rawDamage = Math.floor(source.currentStats.attack * damageMultiplier);
            
            // 应用伤害
            const actualDamage = this.applyDamageToTarget(source, target, rawDamage);
            
            // 更新伤害统计
            source.stats.totalDamage += actualDamage;
            battleStats.totalDamage += actualDamage;
            
            this.logBattle(`${source.name} 的 ${effect.name || '技能'} 触发，对 ${target.name} 造成了 ${actualDamage} 点伤害！`);
            break;
            
        case 'multi_attack':
            // 多重攻击效果
            const count = effect.count || 1;
            const multiDamageMultiplier = effect.multiplier || 1.0;
            let totalDamage = 0;
            
            for (let i = 0; i < count; i++) {
                if (target.currentStats.hp <= 0) break;
                
                // 计算原始伤害
                const multiRawDamage = Math.floor(source.currentStats.attack * multiDamageMultiplier);
                
                // 应用伤害
                const multiActualDamage = this.applyDamageToTarget(source, target, multiRawDamage);
                
                // 更新伤害统计
                source.stats.totalDamage += multiActualDamage;
                battleStats.totalDamage += multiActualDamage;
                totalDamage += multiActualDamage;
            }
            
            this.logBattle(`${source.name} 的 ${effect.name || '多重攻击'} 触发，对 ${target.name} 造成了 ${count} 次共 ${totalDamage} 点伤害！`);
            break;
            
        case 'debuff':
            // DEBUFF效果
            const debuff = BuffSystem.createBuff(effect.debuffType, effect.value, effect.duration, source);
            if (debuff) {
                BuffSystem.applyBuff(target, debuff);
                this.logBattle(`${source.name} 的 ${effect.name || '技能'} 触发，对 ${target.name} 施加了 ${debuff.name} 效果！`);
            }
            break;
    }
    
    // 处理后续效果
    if (effect.followUp) {
        // 如果有后续效果，递归处理
        this.processProcEffect(source, target, effect.followUp, battleStats);
    }
}

/**
 * 处理特定的多重射击效果（如multiShot）
 * @param {object} source - 效果来源
 * @param {object} target - 目标
 * @param {object} effect - 效果对象
 * @param {object} battleStats - 战斗统计
 */
function processMultiShotEffect(source, target, effect, battleStats) {
    if (!effect || !effect.type || target.currentStats.hp <= 0) return;
    
    // 检查触发概率
    if (Math.random() >= (effect.chance || 0.5)) return;
    
    // 计算伤害倍率
    let damageMultiplier = effect.multiplier || 1.0;
    
    // 如果有最小和最大倍率，随机生成倍率
    if (effect.minMultiplier && effect.maxMultiplier) {
        damageMultiplier = effect.minMultiplier + Math.random() * (effect.maxMultiplier - effect.minMultiplier);
    }
    
    // 计算原始伤害
    const rawDamage = Math.floor(source.currentStats.attack * damageMultiplier);
    
    // 应用伤害
    const actualDamage = this.applyDamageToTarget(source, target, rawDamage);
    
    // 更新伤害统计
    source.stats.totalDamage += actualDamage;
    battleStats.totalDamage += actualDamage;
    
    this.logBattle(`${source.name} 的多重射击触发，对 ${target.name} 造成了额外 ${actualDamage} 点伤害！`);
}
