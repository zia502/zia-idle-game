/**
 * 战斗系统整合 - 将所有更新应用到战斗系统中
 */

// 整合战斗系统更新
function integrateBattleSystemUpdates() {
    // 1. 更新BUFF类型
    Object.assign(BuffSystem.buffTypes, {
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
    });

    // 2. 扩展BuffSystem.applyBuffEffect方法
    const originalApplyBuffEffect = BuffSystem.applyBuffEffect;
    BuffSystem.applyBuffEffect = function(target, buff) {
        if (!target || !buff) return;

        // 调用原始方法
        originalApplyBuffEffect.call(this, target, buff);

        // 处理新增的BUFF类型
        switch (buff.type) {
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

            // 其他BUFF类型在其他地方处理
        }
    };

    // 3. 扩展BuffSystem.removeBuffEffect方法
    const originalRemoveBuffEffect = BuffSystem.removeBuffEffect || function() {};
    BuffSystem.removeBuffEffect = function(target, buff) {
        if (!target || !buff) return;

        // 调用原始方法
        originalRemoveBuffEffect.call(this, target, buff);

        // 处理新增的BUFF类型
        switch (buff.type) {
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

            // 其他BUFF类型在其他地方处理
        }
    };

    // 4. 添加BuffSystem.canIgnoreDebuff方法
    BuffSystem.canIgnoreDebuff = function(target, debuffType) {
        if (!target || !target.buffs) return false;

        // 检查是否有忽略DEBUFF的BUFF
        return target.buffs.some(buff =>
            buff.type === 'ignoreDebuff' &&
            (!buff.debuffType || buff.debuffType === debuffType)
        );
    };

    // 5. 扩展BuffSystem.processBuffsAtTurnStart方法
    const originalProcessBuffsAtTurnStart = BuffSystem.processBuffsAtTurnStart;
    BuffSystem.processBuffsAtTurnStart = function(target) {
        if (!target || !target.buffs) return { damage: 0, healing: 0 };

        // 调用原始方法
        const result = originalProcessBuffsAtTurnStart.call(this, target);

        // 处理持续恢复效果
        for (const buff of target.buffs) {
            if (buff.type === 'regen') {
                // 持续恢复
                const healing = Math.floor(buff.value);
                target.currentStats.hp = Math.min(target.currentStats.maxHp, target.currentStats.hp + healing);
                result.healing += healing;
            }
        }

        return result;
    };

    // 6. 添加BuffSystem.processCoverEffect方法
    BuffSystem.processCoverEffect = function(teamMembers, target, attacker) {
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
    };

    // 7. 扩展Battle对象，添加processTurnEndEffects方法
    Battle.processTurnEndEffects = function(teamMembers, monster) {
        console.log('处理回合结束效果');
        
        // 调试雷暴技能
        this.debugSkill('thunderstorm');
        
        // 处理队伍成员的回合结束效果
        for (const member of teamMembers) {
            if (member.currentStats.hp <= 0) continue;
            
            console.log(`处理 ${member.name} 的回合结束效果`);
            
            // 特别处理雷暴技能
            if (member.skills && member.skills.includes('thunderstorm')) {
                console.log(`${member.name} 有雷暴技能，直接触发效果`);
                
                // 手动创建雷暴效果
                const thunderstormEffect = {
                    type: 'multi_attack',
                    count: 5,
                    multiplier: 0.3,
                    targetType: 'all_enemies'
                };
                
                // 直接处理雷暴效果
                this.processEndOfTurnEffect(member, thunderstormEffect, teamMembers, monster);
                this.logBattle(`${member.name} 的雷暴技能被触发！`);
            }

            // 处理BUFF的回合结束效果
            if (member.buffs) {
                for (const buff of member.buffs) {
                    if (buff.type === 'endOfTurn' && buff.effect) {
                        this.processEndOfTurnEffect(member, buff.effect, teamMembers, monster);
                    } else if (buff.type === 'counterAttack' && buff.target) {
                        this.processCounterAttackEffect(member, buff, teamMembers, monster);
                    }
                }
            }

            // 处理被动技能中的回合结束效果
            if (member.skills) {
                console.log(`检查 ${member.name} 的被动技能回合结束效果`);
                for (const skillId of member.skills) {
                    const skill = JobSystem.getSkill(skillId);
                    console.log(`检查技能: ${skillId}, 是否存在: ${!!skill}, 是否被动: ${skill?.passive}, 是否有效果: ${!!skill?.effects}`);
                    if (skill && skill.passive && skill.effects) {
                        for (const effect of skill.effects) {
                            console.log(`技能效果类型: ${effect.type}`);
                            if (effect.type === 'endOfTurn') {
                                console.log(`触发回合结束效果: ${skillId}`);
                                this.processEndOfTurnEffect(member, effect.effect, teamMembers, monster);
                            }
                        }
                    }
                }
            }
        }

        // 处理怪物的回合结束效果
        if (monster.currentStats.hp > 0 && monster.buffs) {
            for (const buff of monster.buffs) {
                if (buff.type === 'endOfTurn' && buff.effect) {
                    this.processEndOfTurnEffect(monster, buff.effect, teamMembers, monster);
                } else if (buff.type === 'counterAttack' && buff.target) {
                    this.processCounterAttackEffect(monster, buff, teamMembers, monster);
                }
            }
        }
    };

    // 8. 添加Battle.getEffectTarget方法
    Battle.getEffectTarget = function(targetType, source, teamMembers, monster) {
        switch (targetType) {
            case 'self':
                return source;
                
            case 'enemy':
                return source === monster ? teamMembers.find(m => m.currentStats.hp > 0) : monster;
                
            case 'ally':
                if (source === monster) return monster;
                const allies = teamMembers.filter(m => m !== source && m.currentStats.hp > 0);
                return allies.length > 0 ? allies[Math.floor(Math.random() * allies.length)] : null;
                
            case 'ally_lowest_hp':
                if (source === monster) return monster;
                const aliveAllies = teamMembers.filter(m => m.currentStats.hp > 0);
                if (aliveAllies.length === 0) return null;
                return aliveAllies.reduce((lowest, current) => 
                    (current.currentStats.hp / current.currentStats.maxHp) < (lowest.currentStats.hp / lowest.currentStats.maxHp) ? current : lowest, aliveAllies[0]);
                
            case 'ally_dead':
                if (source === monster) return null;
                const deadAllies = teamMembers.filter(m => m.currentStats.hp <= 0);
                return deadAllies.length > 0 ? deadAllies[Math.floor(Math.random() * deadAllies.length)] : null;
                
            default:
                return null;
        }
    };
    
    // 9. 添加Battle.getEffectTargets方法
    Battle.getEffectTargets = function(targetType, source, teamMembers, monster) {
        switch (targetType) {
            case 'all_allies':
                return source === monster ? [monster] : teamMembers.filter(m => m.currentStats.hp > 0);
                
            case 'all_enemies':
                return source === monster ? teamMembers.filter(m => m.currentStats.hp > 0) : [monster];
                
            case 'all':
                return [...teamMembers.filter(m => m.currentStats.hp > 0), monster];
                
            default:
                const target = this.getEffectTarget(targetType, source, teamMembers, monster);
                return target ? [target] : [];
        }
    };
    
    // 10. 添加Battle.debugSkill方法
    Battle.debugSkill = function(skillId) {
        console.log(`调试技能: ${skillId}`);
        
        // 检查JobSystem中的技能
        const jsSkill = JobSystem.getSkill(skillId);
        console.log(`JobSystem中的技能:`, jsSkill);
        
        // 检查JobSkillsTemplate中的技能
        if (typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates) {
            const templateSkill = JobSkillsTemplate.templates[skillId];
            console.log(`JobSkillsTemplate中的技能:`, templateSkill);
        }
        
        // 如果有隐者职业的角色，检查其技能列表
        for (const member of this.teamMembers) {
            if (member.job === 'hermit') {
                console.log(`隐者角色 ${member.name} 的技能:`, member.skills);
                if (member.skills && member.skills.includes(skillId)) {
                    console.log(`角色 ${member.name} 拥有技能 ${skillId}`);
                }
            }
        }
    };
    
    // 11. 添加Battle.processEndOfTurnEffect方法
    Battle.processEndOfTurnEffect = function(source, effect, teamMembers, monster) {
        if (!effect || !effect.type) return;

        switch (effect.type) {
            case 'damage':
                // 单体伤害效果
                const target = this.getEffectTarget(effect.targetType, source, teamMembers, monster);
                if (target) {
                    const rawDamage = Math.floor(source.currentStats.attack * (effect.multiplier || 1.0));
                    const actualDamage = this.applyDamageToTarget(source, target, rawDamage);
                    this.logBattle(`${source.name} 的回合结束效果对 ${target.name} 造成了 ${actualDamage} 点伤害！`);
                }
                break;

            case 'multi_attack':
                // 多重攻击效果
                const targets = this.getEffectTargets(effect.targetType, source, teamMembers, monster);
                if (targets.length > 0) {
                    const count = effect.count || 1;
                    const multiplier = effect.multiplier || 0.3;

                    for (const target of targets) {
                        let totalDamage = 0;

                        for (let i = 0; i < count; i++) {
                            if (target.currentStats.hp <= 0) break;

                            const rawDamage = Math.floor(source.currentStats.attack * multiplier);
                            const actualDamage = this.applyDamageToTarget(source, target, rawDamage);
                            totalDamage += actualDamage;
                        }

                        if (totalDamage > 0) {
                            this.logBattle(`${source.name} 的回合结束效果对 ${target.name} 造成了 ${count} 次共 ${totalDamage} 点伤害！`);
                        }
                    }
                }
                break;
        }
    };

    // 9. 添加Battle.processCounterAttackEffect方法
    Battle.processCounterAttackEffect = function(source, buff, teamMembers, monster) {
        const targets = this.getEffectTargets(buff.target, source, teamMembers, monster);
        if (targets.length === 0) return;

        const multiplier = buff.multiplier || 1.0;
        let totalDamage = 0;

        for (const target of targets) {
            if (target.currentStats.hp <= 0) continue;

            const rawDamage = Math.floor(source.currentStats.attack * multiplier);
            const actualDamage = this.applyDamageToTarget(source, target, rawDamage);
            totalDamage += actualDamage;
        }

        if (totalDamage > 0) {
            this.logBattle(`${source.name} 的反击效果造成了 ${totalDamage} 点伤害！`);
        }
    };

    // 10. 添加Battle.getEffectTarget和getEffectTargets方法
    Battle.getEffectTarget = function(targetType, source, teamMembers, monster) {
        switch (targetType) {
            case 'self':
                return source;

            case 'enemy':
                return source === monster ? teamMembers[0] : monster;

            case 'ally_lowest_hp':
                return teamMembers.filter(m => m.currentStats.hp > 0)
                    .sort((a, b) => (a.currentStats.hp / a.currentStats.maxHp) - (b.currentStats.hp / b.currentStats.maxHp))[0];

            case 'ally_dead':
                return teamMembers.find(m => m.currentStats.hp <= 0);

            default:
                return null;
        }
    };

    Battle.getEffectTargets = function(targetType, source, teamMembers, monster) {
        switch (targetType) {
            case 'all_allies':
                return source === monster ? [monster] : teamMembers.filter(m => m.currentStats.hp > 0);

            case 'all_enemies':
                return source === monster ? teamMembers.filter(m => m.currentStats.hp > 0) : [monster];

            case 'all':
                return [...teamMembers.filter(m => m.currentStats.hp > 0), monster];

            default:
                const target = this.getEffectTarget(targetType, source, teamMembers, monster);
                return target ? [target] : [];
        }
    };

    // 11. 扩展Battle.applyDamageToTarget方法
    const originalApplyDamageToTarget = Battle.applyDamageToTarget;
    Battle.applyDamageToTarget = function(attacker, target, rawDamage, options = {}) {
        if (!target || target.currentStats.hp <= 0) return { damage: 0, isCritical: false, attributeBonus: 0 };

        // 检查援护效果
        const cover = BuffSystem.processCoverEffect(this.currentTeamMembers, target, attacker);
        if (cover) {
            this.logBattle(`${cover.name} 援护了 ${target.name}！`);
            target = cover;
        }

        // 使用 JobSkills.applyDamageToTarget 计算基础伤害
        let damageResult = JobSkills.applyDamageToTarget(attacker, target, rawDamage, options);

        // 确保damageResult是一个对象
        if (typeof damageResult !== 'object' || damageResult === null) {
            console.error("JobSkills.applyDamageToTarget返回值不是对象:", damageResult);
            damageResult = { damage: damageResult, isCritical: false, attributeBonus: 0 };
        }

        // 提取伤害值
        let finalDamage = damageResult.damage;

        // 确保finalDamage是一个数字
        if (isNaN(finalDamage) || finalDamage === undefined) {
            console.error("伤害值为NaN或undefined，设置为0");
            finalDamage = 0;
            damageResult.damage = 0;
        }

        // 考虑伤害上限
        if (target.buffs) {
            const damageCap = target.buffs.find(buff => buff.type === 'damageCap');
            if (damageCap && damageCap.value) {
                finalDamage = Math.min(finalDamage, damageCap.value);
                damageResult.damage = finalDamage;
            }
        }

        // 考虑目标的无敌状态
        if (target.buffs && target.buffs.some(buff => buff.type === 'invincible')) {
            const invincibleBuff = target.buffs.find(buff => buff.type === 'invincible');
            if (invincibleBuff) {
                // 消耗一次无敌次数
                if (invincibleBuff.maxHits) {
                    invincibleBuff.maxHits--;
                    if (invincibleBuff.maxHits <= 0) {
                        BuffSystem.removeBuff(target, invincibleBuff.id);
                    }
                }
                finalDamage = 0;
                damageResult.damage = 0;
            }
        }

        // 考虑目标的完全回避状态
        if (target.buffs && target.buffs.some(buff => buff.type === 'evade')) {
            finalDamage = 0;
            damageResult.damage = 0;
            // 可以选择是否消耗回避BUFF
            const evadeBuff = target.buffs.find(buff => buff.type === 'evade');
            if (evadeBuff && options.consumeEvade) {
                BuffSystem.removeBuff(target, evadeBuff.id);
            }
        }

        // 考虑护盾效果
        if (target.shield && target.shield > 0) {
            if (target.shield >= finalDamage) {
                target.shield -= finalDamage;
                finalDamage = 0;
                damageResult.damage = 0;
            } else {
                finalDamage -= target.shield;
                damageResult.damage = finalDamage;
                target.shield = 0;
            }
        }

        // 考虑元素转换
        if (target.buffs) {
            const elementConversion = target.buffs.find(buff => buff.type === 'elementConversion');
            if (elementConversion && elementConversion.maxHits) {
                // 这里可以添加元素转换的逻辑
                // 例如，将伤害转换为目标有利的属性

                // 消耗一次元素转换次数
                elementConversion.maxHits--;
                if (elementConversion.maxHits <= 0) {
                    BuffSystem.removeBuff(target, elementConversion.id);
                }
            }
        }

        // 应用伤害
        target.currentStats.hp = Math.max(0, target.currentStats.hp - finalDamage);

        // 更新damageResult中的damage值
        damageResult.damage = finalDamage;

        return damageResult;
    };

    // 12. 添加Battle.processReviveEffect方法
    Battle.processReviveEffect = function(caster, target, hpRatio) {
        if (!target || target.currentStats.hp > 0) return false;

        // 计算恢复的生命值
        const healAmount = Math.floor(target.currentStats.maxHp * hpRatio);

        // 复活目标
        target.currentStats.hp = healAmount;

        this.logBattle(`${caster.name} 复活了 ${target.name}，恢复了 ${healAmount} 点生命值！`);

        return true;
    };

    // 13. 扩展Battle.processBattle方法，在回合结束时处理回合结束效果
    const originalProcessBattle = Battle.processBattle;
    Battle.processBattle = function(teamMembers, monster) {
        // 保存当前队伍成员，供援护效果使用
        this.currentTeamMembers = teamMembers;

        // 调用原始方法
        const result = originalProcessBattle.call(this, teamMembers, monster);

        // 清理临时变量
        delete this.currentTeamMembers;

        return result;
    };

    // 14. 修改Battle.processBattle方法中的战斗循环，添加回合结束效果处理
    // 注意：这需要修改原始代码，这里只是示例
    /*
    // 在回合结束部分添加以下代码
    // 处理回合结束时的效果
    this.processTurnEndEffects(teamMembers, monster);
    */

    // 15. 扩展JobSkills.applySkillEffects方法，添加对复活效果的支持
    const originalApplySkillEffects = JobSkills.applySkillEffects;
    JobSkills.applySkillEffects = function(character, template, teamMembers, monster) {
        // 根据技能效果类型应用不同效果
        switch (template.effectType) {
            case 'revive':
                return this.applyReviveEffects(character, template, teamMembers, monster);
            default:
                // 调用原始方法处理其他效果类型
                return originalApplySkillEffects.call(this, character, template, teamMembers, monster);
        }
    };

    // 16. 添加JobSkills.applyReviveEffects方法
    JobSkills.applyReviveEffects = function(character, template, teamMembers, monster) {
        const targets = this.getTargets(character, template.targetType, teamMembers, monster);
        const effects = [];

        // 应用复活效果
        for (const target of targets) {
            if (target.currentStats.hp > 0) continue; // 跳过存活的目标

            for (const effect of template.effects) {
                if (effect.type === 'revive') {
                    const hpRatio = effect.hpRatio || 0.3;
                    const success = Battle.processReviveEffect(character, target, hpRatio);

                    if (success) {
                        effects.push({
                            target: target.name,
                            type: 'revive',
                            hpRatio
                        });
                    }
                }
            }
        }

        // 构建消息
        let message = `${character.name} 使用了【${template.name}】`;
        if (effects.length > 0) {
            message += `，复活了 ${effects.length} 名队友！`;
        } else {
            message += `，但没有效果。`;
        }

        return {
            message,
            effects: {
                type: 'revive',
                targets: template.targetType,
                effects
            }
        };
    };
}

// 整合额外的战斗系统更新
function integrateAdditionalBattleSystemUpdates() {
    // 1. 添加回合开始效果处理方法
    Battle.processTurnStartEffects = function(entity, teamMembers, monster) {
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
    };

    // 2. 添加回合开始效果处理方法
    Battle.processStartOfTurnEffect = function(source, effect, teamMembers, monster) {
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
    };

    // 3. 添加攻击概率触发效果处理方法
    Battle.processAttackProcEffects = function(attacker, target, battleStats) {
        if (!attacker || !attacker.skills || attacker.currentStats.hp <= 0 || target.currentStats.hp <= 0) return;

        // 处理被动技能中的攻击触发效果
        for (const skillId of attacker.skills) {
            const skill = JobSystem.getSkill(skillId);
            if (!skill || !skill.passive || !skill.effects) continue;

            for (const effect of skill.effects) {
                if (effect.type === 'proc' && effect.onAttack) {
                    // 检查触发概率
                    const chance = effect.chance || 0.5;
                    const roll = Math.random();

                    if (roll < chance) {
                        // 记录触发的技能ID，以便在processProcEffect中使用
                        if (!effect.effect.sourceSkillId) {
                            effect.effect.sourceSkillId = skillId;
                        }

                        this.processProcEffect(attacker, target, effect.effect, battleStats);
                    }
                }
            }
        }
    };

    // 4. 添加触发效果处理方法
    Battle.processProcEffect = function(source, target, effect, battleStats) {
        if (!effect || !effect.type) return;

        // 查找触发的被动技能
        let triggeringSkill = null;
        let skillName = "未知技能";
        let skillDescription = "";

        // 如果effect中有sourceSkillId，直接使用它获取技能信息
        if (effect.sourceSkillId) {
            // 首先尝试从JobSystem获取技能
            triggeringSkill = JobSystem.getSkill(effect.sourceSkillId);

            // 如果找不到，尝试从JobSkillsTemplate获取
            if (!triggeringSkill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates) {
                triggeringSkill = JobSkillsTemplate.templates[effect.sourceSkillId];
            }

            if (triggeringSkill) {
                skillName = triggeringSkill.name;
                skillDescription = triggeringSkill.description;
            }
        }

        // 如果没有sourceSkillId或找不到技能，尝试通过效果匹配查找
        if (!triggeringSkill && source && source.skills) {
            for (const skillId of source.skills) {
                const skill = JobSystem.getSkill(skillId);
                if (skill && skill.passive && skill.effects) {
                    for (const skillEffect of skill.effects) {
                        if (skillEffect.type === 'proc' && skillEffect.effect &&
                            JSON.stringify(skillEffect.effect) === JSON.stringify(effect)) {
                            triggeringSkill = skill;
                            skillName = skill.name;
                            skillDescription = skill.description;
                            break;
                        }
                    }
                    if (triggeringSkill) break;
                }
            }
        }

        // 如果仍然找不到技能，尝试从JobSkillsTemplate获取
        if (!triggeringSkill && typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates) {
            for (const templateId in JobSkillsTemplate.templates) {
                const template = JobSkillsTemplate.templates[templateId];
                if (template && template.passive && template.effects) {
                    for (const templateEffect of template.effects) {
                        if (templateEffect.type === 'proc' && templateEffect.effect &&
                            JSON.stringify(templateEffect.effect) === JSON.stringify(effect)) {
                            triggeringSkill = template;
                            skillName = template.name;
                            skillDescription = template.description;
                            break;
                        }
                    }
                    if (triggeringSkill) break;
                }
            }
        }

        // 打印被动技能触发信息
        if (triggeringSkill) {
            this.logBattle(`${source.name} 的被动技能【${skillName}】触发！！`);
            if (skillDescription) {
                this.logBattle(`技能描述: ${skillDescription}`);
            }
        }

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
                this.logBattle(`原始伤害: ${rawDamage}`);

                // 应用伤害
                const actualDamageObject = this.applyDamageToTarget(source, target, rawDamage);

                // 确保actualDamageObject是一个对象
                let damage = 0;
                if (typeof actualDamageObject === 'object' && actualDamageObject !== null && 'damage' in actualDamageObject) {
                    damage = actualDamageObject.damage;
                } else if (typeof actualDamageObject === 'number') {
                    damage = actualDamageObject;
                    console.warn("applyDamageToTarget返回了数字而不是对象");
                }

                this.logBattle(`应用伤害1: ${damage}`);

                // 更新伤害统计
                source.stats.totalDamage += damage;
                battleStats.totalDamage += damage;

                this.logBattle(`${source.name} 对 ${target.name} 造成了 ${damage} 点伤害！`);
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

                this.logBattle(`${source.name} 对 ${target.name} 造成了 ${count} 次共 ${totalDamage} 点伤害！`);
                break;

            case 'debuff':
                // DEBUFF效果
                const debuff = BuffSystem.createBuff(effect.debuffType, effect.value, effect.duration, source);
                if (debuff) {
                    BuffSystem.applyBuff(target, debuff);
                    this.logBattle(`${source.name} 对 ${target.name} 施加了 ${debuff.name} 效果！`);
                }
                break;
        }

        // 处理后续效果
        if (effect.followUp) {
            // 如果有后续效果，递归处理
            this.processProcEffect(source, target, effect.followUp, battleStats);
        }
    };

    // 5. 添加多重射击效果处理方法
    Battle.processMultiShotEffect = function(source, target, effect, battleStats) {
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
    };

    // 6. 扩展Battle.processTurnStartBuffs方法，添加对回合开始效果的处理
    const originalProcessTurnStartBuffs = Battle.processTurnStartBuffs;
    Battle.processTurnStartBuffs = function(teamMembers, monster) {
        // 调用原始方法处理BUFF效果
        originalProcessTurnStartBuffs.call(this, teamMembers, monster);

        // 处理队伍成员的回合开始效果
        for (const member of teamMembers) {
            if (member.currentStats.hp <= 0) continue;

            this.processTurnStartEffects(member, teamMembers, monster);
        }

        // 处理怪物的回合开始效果
        if (monster.currentStats.hp > 0) {
            this.processTurnStartEffects(monster, teamMembers, monster);
        }
    };

    // 7. 扩展Battle.processCharacterAction方法，添加对攻击概率触发效果的处理
    const originalProcessCharacterAction = Battle.processCharacterAction;
    Battle.processCharacterAction = function(character, monster, battleStats) {
        // 调用原始方法处理普通攻击
        originalProcessCharacterAction.call(this, character, monster, battleStats);

        // 如果Battle对象已经有processAttackProcEffects方法，直接调用
        if (typeof this.processAttackProcEffects === 'function') {
            this.processAttackProcEffects(character, monster, battleStats);
        }
    };

    // 8. 扩展Battle.processMonsterAction方法，添加对攻击概率触发效果的处理
    const originalProcessMonsterAction = Battle.processMonsterAction;
    Battle.processMonsterAction = function(monster, teamMembers, battleStats) {
        // 调用原始方法处理普通攻击
        originalProcessMonsterAction.call(this, monster, teamMembers, battleStats);

        // 获取目标
        const aliveMembers = teamMembers.filter(member => member.currentStats.hp > 0);
        if (aliveMembers.length === 0) return;

        const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];

        // 如果Battle对象已经有processAttackProcEffects方法，直接调用
        if (typeof this.processAttackProcEffects === 'function') {
            this.processAttackProcEffects(monster, target, battleStats);
        }
    };

    console.log('额外的战斗系统更新已应用');
}

// 在游戏初始化时调用此函数
function initBattleSystemUpdates() {
    // 整合战斗系统更新
    integrateBattleSystemUpdates();

    // 整合额外的战斗系统更新
    integrateAdditionalBattleSystemUpdates();

    console.log('战斗系统更新已应用');
}
