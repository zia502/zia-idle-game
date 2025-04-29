/**
 * 职业技能系统 - 负责游戏中职业固定技能的实现
 */
const JobSkills = {
    /**
     * 初始化职业技能系统
     */
    init() {
        console.log('职业技能系统已初始化');
    },

    /**
     * 使用职业技能
     * @param {string} characterId - 角色ID
     * @param {string} skillId - 技能ID
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能使用结果
     */
    useSkill(characterId, skillId, teamMembers, monster) {
        const character = Character.getCharacter(characterId);
        if (!character) return { success: false, message: '角色不存在' };

        const skill = JobSystem.getSkill(skillId);
        if (!skill) return { success: false, message: '技能不存在' };

        // 获取技能模板
        const template = JobSkillsTemplate.getTemplate(skillId);
        if (!template) return { success: false, message: `技能 ${skill.name} 没有模板定义` };

        // 检查技能是否在冷却中
        if (character.skillCooldowns && character.skillCooldowns[skillId] > 0) {
            return {
                success: false,
                message: `技能 ${skill.name} 还在冷却中，剩余 ${character.skillCooldowns[skillId]} 回合`
            };
        }

        // 执行技能效果
        const result = this.applySkillEffects(character, template, teamMembers, monster);

        // 设置技能冷却
        if (!character.skillCooldowns) {
            character.skillCooldowns = {};
        }

        // 使用模板中的冷却时间
        character.skillCooldowns[skillId] = template.cooldown || 5; // 默认5回合冷却

        return {
            success: true,
            message: result.message,
            effects: result.effects
        };
    },

    /**
     * 应用技能效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果
     */
    applySkillEffects(character, template, teamMembers, monster) {
        // 根据技能效果类型应用不同效果
        switch (template.effectType) {
            case 'buff':
                return this.applyBuffEffects(character, template, teamMembers, monster);
            case 'debuff':
                return this.applyDebuffEffects(character, template, teamMembers, monster);
            case 'damage':
                return this.applyDamageEffects(character, template, teamMembers, monster);
            case 'heal':
                return this.applyHealEffects(character, template, teamMembers, monster);
            case 'dispel':
                // dispel也被视为heal
                return this.applyHealEffects(character, template, teamMembers, monster);
            case 'damage_and_debuff':
                return this.applyDamageAndDebuffEffects(character, template, teamMembers, monster);
            case 'damage_and_buff':
                return this.applyDamageAndBuffEffects(character, template, teamMembers, monster);
            default:
                return {
                    message: `${character.name} 使用了【${template.name}】，但没有效果。`,
                    effects: {}
                };
        }
    },

    /**
     * 应用BUFF效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果
     */
    applyBuffEffects(character, template, teamMembers, monster) {
        const targets = this.getTargets(character, template.targetType, teamMembers, monster);
        const effects = [];

        // 应用每个BUFF效果
        for (const target of targets) {
            if (target.currentStats.hp <= 0) continue; // 跳过已倒下的目标

            for (const effect of template.effects) {
                // 创建BUFF
                const buff = BuffSystem.createBuff(effect.type, effect.value, effect.duration || template.duration, character);

                // 设置BUFF属性
                if (buff && effect.name) buff.name = effect.name;
                if (buff && effect.description) buff.description = effect.description;
                if (buff && effect.icon) buff.icon = effect.icon;
                if (buff && effect.maxHits) buff.maxHits = effect.maxHits;

                // 应用BUFF
                if (buff) {
                    BuffSystem.applyBuff(target, buff);
                }

                // 特殊处理：DA和TA提升
                if (effect.type === 'daBoost') {
                    target.currentStats.daRate = (target.currentStats.daRate || 0.15) + effect.value;
                } else if (effect.type === 'taBoost') {
                    target.currentStats.taRate = (target.currentStats.taRate || 0.05) + effect.value;
                }

                effects.push({
                    target: target.name,
                    type: effect.type,
                    value: effect.value,
                    duration: effect.duration || template.duration
                });
            }
        }

        // 生成消息
        let message = `${character.name} 使用了【${template.name}】，`;

        if (template.targetType === 'self') {
            message += `获得了`;
        } else if (template.targetType === 'ally') {
            message += `为 ${targets[0]?.name || '队友'} 提供了`;
        } else if (template.targetType === 'all_allies') {
            message += `为全队提供了`;
        }

        // 添加效果描述
        const effectDescriptions = [];
        for (const effect of template.effects) {
            let desc = '';

            switch (effect.type) {
                case 'attackUp':
                    desc = `攻击力提升${effect.value * 100}%`;
                    break;
                case 'defenseUp':
                    desc = `防御力提升${effect.value * 100}%`;
                    break;
                case 'daBoost':
                    desc = `DA率提升${effect.value * 100}%`;
                    break;
                case 'taBoost':
                    desc = `TA率提升${effect.value * 100}%`;
                    break;
                case 'damageReduction':
                    desc = `伤害减免${effect.value * 100}%`;
                    break;
                case 'invincible':
                    desc = `无敌效果（抵挡${effect.maxHits || 1}次攻击）`;
                    break;
                case 'evade':
                    desc = `完全回避效果`;
                    break;
                default:
                    desc = effect.name || effect.type;
            }

            effectDescriptions.push(desc);
        }

        message += effectDescriptions.join('，');

        if (template.duration > 0) {
            message += `，持续${template.duration}回合！`;
        } else {
            message += `！`;
        }

        return {
            message,
            effects: {
                type: 'buff',
                targets: template.targetType,
                effects
            }
        };
    },

    /**
     * 应用DEBUFF效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果
     */
    applyDebuffEffects(character, template, teamMembers, monster) {
        const targets = this.getTargets(character, template.targetType, teamMembers, monster);
        const effects = [];

        // 应用每个DEBUFF效果
        for (const target of targets) {
            for (const effect of template.effects) {
                // 创建DEBUFF
                const debuff = BuffSystem.createBuff(effect.type, effect.value, effect.duration || template.duration, character);

                // 设置DEBUFF属性
                if (debuff && effect.name) debuff.name = effect.name;
                if (debuff && effect.description) debuff.description = effect.description;
                if (debuff && effect.icon) debuff.icon = effect.icon;

                // 应用DEBUFF
                if (debuff) {
                    BuffSystem.applyBuff(target, debuff);
                }

                // 特殊处理：DA和TA降低
                if (effect.type === 'daDown') {
                    target.currentStats.daRate = Math.max(0, (target.currentStats.daRate || 0.1) - effect.value);
                } else if (effect.type === 'taDown') {
                    target.currentStats.taRate = Math.max(0, (target.currentStats.taRate || 0.03) - effect.value);
                }

                effects.push({
                    target: target.name,
                    type: effect.type,
                    value: effect.value,
                    duration: effect.duration || template.duration
                });
            }
        }

        // 生成消息
        let message = `${character.name} 使用了【${template.name}】，`;

        if (template.targetType === 'enemy') {
            message += `使 ${targets[0]?.name || '敌人'} `;
        } else if (template.targetType === 'all_enemies') {
            message += `使敌方全体 `;
        }

        // 添加效果描述
        const effectDescriptions = [];
        for (const effect of template.effects) {
            let desc = '';

            switch (effect.type) {
                case 'attackDown':
                    desc = `攻击力降低${effect.value * 100}%`;
                    break;
                case 'defenseDown':
                    desc = `防御力降低${effect.value * 100}%`;
                    break;
                case 'missRate':
                    desc = `命中率降低${effect.value * 100}%`;
                    break;
                case 'daDown':
                    desc = `无法触发双重攻击`;
                    break;
                case 'taDown':
                    desc = `无法触发三重攻击`;
                    break;
                case 'dot':
                    desc = `陷入中毒状态（每回合受到${effect.value}点伤害）`;
                    break;
                case 'stun':
                    desc = `陷入麻痹状态（无法行动）`;
                    break;
                default:
                    desc = effect.name || effect.type;
            }

            effectDescriptions.push(desc);
        }

        message += effectDescriptions.join('，');

        if (template.duration > 0) {
            message += `，持续${template.duration}回合！`;
        } else {
            message += `！`;
        }

        return {
            message,
            effects: {
                type: 'debuff',
                targets: template.targetType,
                effects
            }
        };
    },

    /**
     * 应用伤害到目标
     * @param {object} source - 伤害来源
     * @param {object} target - 目标对象
     * @param {number} rawDamage - 原始伤害值
     * @param {object} options - 额外选项
     * @returns {number} 实际造成的伤害
     */
    applyDamageToTarget(source, target, rawDamage, options = {}) {
        if (!target) return 0;

        // 添加详细日志
        console.log(`===== 伤害计算详情 =====`);
        console.log(`攻击者: ${source.name}, 目标: ${target.name}`);
        console.log(`原始伤害(rawDamage): ${rawDamage}`);

        if (typeof window !== 'undefined' && window.log) {
            window.log(`===== 伤害计算详情 =====`);
            window.log(`攻击者: ${source.name || '未知'}, 目标: ${target.name || '未知'}`);
            window.log(`攻击者攻击力: ${source.currentStats?.attack || '未知'}`);
            window.log(`目标防御力: ${target.currentStats?.defense || '未知'} (${(target.currentStats?.defense * 100).toFixed(1)}%)`);
            window.log(`原始伤害(rawDamage): ${rawDamage}`);
        }

        // 原始伤害是"造成伤害"
        let finalDamage = rawDamage;

        // 应用随机波动 (0.95~1.05)，如果options中没有指定已应用随机波动
        if (!options.randomApplied) {
            const randomFactor = 0.95 + (Math.random() * 0.1);
            console.log(`随机波动因子: ${randomFactor.toFixed(4)}`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`随机波动因子: ${randomFactor.toFixed(4)}`);
            }

            const oldDamage = finalDamage;
            finalDamage *= randomFactor;
            console.log(`应用随机波动后的伤害: ${oldDamage} * ${randomFactor.toFixed(4)} = ${finalDamage.toFixed(2)}`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`应用随机波动后的伤害: ${oldDamage} * ${randomFactor.toFixed(4)} = ${finalDamage.toFixed(2)}`);
            }
        }

        // 应用属性克制
        if (source.attribute && target.attribute) {
            // 获取属性关系
            const attributes = Character.attributes || {
                fire: { strengths: ['wind'] },
                water: { strengths: ['fire'] },
                earth: { strengths: ['water'] },
                wind: { strengths: ['earth'] },
                light: { strengths: ['dark'] },
                dark: { strengths: ['light'] }
            };

            let attributeBonus = 0;
            if (attributes[source.attribute] && attributes[source.attribute].strengths &&
                attributes[source.attribute].strengths.includes(target.attribute)) {
                attributeBonus = 0.5; // 有利属性攻击: 造成约1.5倍的伤害
                console.log(`属性克制: ${source.attribute} 对 ${target.attribute} 有优势 (+50%)`);
                if (typeof window !== 'undefined' && window.log) {
                    window.log(`属性克制: ${source.attribute} 对 ${target.attribute} 有优势 (+50%)`);
                }
            } else if (attributes[target.attribute] && attributes[target.attribute].strengths &&
                      attributes[target.attribute].strengths.includes(source.attribute)) {
                attributeBonus = -0.25; // 不利属性攻击: 造成约0.75倍（即减少25%）的伤害
                console.log(`属性克制: ${source.attribute} 对 ${target.attribute} 有劣势 (-25%)`);
                if (typeof window !== 'undefined' && window.log) {
                    window.log(`属性克制: ${source.attribute} 对 ${target.attribute} 有劣势 (-25%)`);
                }
            } else {
                console.log(`属性克制: 无属性克制关系`);
                if (typeof window !== 'undefined' && window.log) {
                    window.log(`属性克制: 无属性克制关系`);
                }
            }

            const oldDamage = finalDamage;
            finalDamage *= (1 + attributeBonus);
            console.log(`应用属性克制后的伤害: ${oldDamage.toFixed(2)} * (1 + ${attributeBonus}) = ${finalDamage.toFixed(2)}`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`应用属性克制后的伤害: ${oldDamage.toFixed(2)} * (1 + ${attributeBonus}) = ${finalDamage.toFixed(2)}`);
            }
        }

        // 计算"受到伤害"
        // 受到伤害= 造成伤害 / （1+防御力%）*（1-伤害降低%）*（1-属性伤害减轻%）
        console.log(`开始计算"受到伤害"公式`);
        if (typeof window !== 'undefined' && window.log) {
            window.log(`开始计算"受到伤害"公式`);
        }

        // 应用防御力减伤
        if (target.currentStats && typeof target.currentStats.defense === 'number') {
            const oldDamage = finalDamage;
            const defenseValue = target.currentStats.defense;
            console.log(`目标防御力: ${defenseValue} (${(defenseValue * 100).toFixed(1)}%)`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`目标防御力: ${defenseValue} (${(defenseValue * 100).toFixed(1)}%)`);
            }

            finalDamage = finalDamage / (1 + defenseValue);
            console.log(`应用防御力减伤后的伤害: ${oldDamage.toFixed(2)} / (1 + ${defenseValue}) = ${finalDamage.toFixed(2)}`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`应用防御力减伤后的伤害: ${oldDamage.toFixed(2)} / (1 + ${defenseValue}) = ${finalDamage.toFixed(2)}`);
            }
        }

        // 考虑目标的伤害减免BUFF
        if (target.buffs) {
            const damageReductionBuffs = target.buffs.filter(buff => buff.type === 'damageReduction');
            for (const buff of damageReductionBuffs) {
                const oldDamage = finalDamage;
                console.log(`伤害减免BUFF: ${buff.name || 'Unknown'} (${(buff.value * 100).toFixed(1)}%)`);
                if (typeof window !== 'undefined' && window.log) {
                    window.log(`伤害减免BUFF: ${buff.name || 'Unknown'} (${(buff.value * 100).toFixed(1)}%)`);
                }

                finalDamage *= (1 - buff.value);
                console.log(`应用伤害减免BUFF后的伤害: ${oldDamage.toFixed(2)} * (1 - ${buff.value}) = ${finalDamage.toFixed(2)}`);
                if (typeof window !== 'undefined' && window.log) {
                    window.log(`应用伤害减免BUFF后的伤害: ${oldDamage.toFixed(2)} * (1 - ${buff.value}) = ${finalDamage.toFixed(2)}`);
                }
            }
        }

        // 应用属性伤害减轻
        if (source.attribute && target.currentStats && target.currentStats.attributeResistance) {
            const attributeDamageReduction = target.currentStats.attributeResistance[source.attribute] || 0;
            if (attributeDamageReduction > 0) {
                const oldDamage = finalDamage;
                console.log(`属性伤害减轻: ${source.attribute} (${(attributeDamageReduction * 100).toFixed(1)}%)`);
                if (typeof window !== 'undefined' && window.log) {
                    window.log(`属性伤害减轻: ${source.attribute} (${(attributeDamageReduction * 100).toFixed(1)}%)`);
                }

                finalDamage *= (1 - attributeDamageReduction);
                console.log(`应用属性伤害减轻后的伤害: ${oldDamage.toFixed(2)} * (1 - ${attributeDamageReduction}) = ${finalDamage.toFixed(2)}`);
                if (typeof window !== 'undefined' && window.log) {
                    window.log(`应用属性伤害减轻后的伤害: ${oldDamage.toFixed(2)} * (1 - ${attributeDamageReduction}) = ${finalDamage.toFixed(2)}`);
                }
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
            }
        }

        // 考虑目标的完全回避状态
        if (target.buffs && target.buffs.some(buff => buff.type === 'evade')) {
            finalDamage = 0;
            // 可以选择是否消耗回避BUFF
            const evadeBuff = target.buffs.find(buff => buff.type === 'evade');
            if (evadeBuff && options.consumeEvade) {
                BuffSystem.removeBuff(target, evadeBuff.id);
            }
        }

        // 考虑护盾
        if (target.shield && target.shield > 0) {
            if (target.shield >= finalDamage) {
                target.shield -= finalDamage;
                finalDamage = 0;
            } else {
                finalDamage -= target.shield;
                target.shield = 0;
            }
        }

        // 应用伤害上限
        const beforeCap = finalDamage;
        finalDamage = Math.min(finalDamage, 99999);
        if (beforeCap > 99999) {
            console.log(`伤害超过上限: ${beforeCap.toFixed(2)} → 99999`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`伤害超过上限: ${beforeCap.toFixed(2)} → 99999`);
            }
        }

        // 取整
        const beforeFloor = finalDamage;
        finalDamage = Math.floor(finalDamage);
        console.log(`最终伤害(取整): ${beforeFloor.toFixed(2)} → ${finalDamage}`);
        if (typeof window !== 'undefined' && window.log) {
            window.log(`最终伤害(取整): ${beforeFloor.toFixed(2)} → ${finalDamage}`);
            window.log(`===== 伤害计算结束 =====`);
        }

        // 应用伤害
        target.currentStats.hp = Math.max(0, target.currentStats.hp - finalDamage);

        return finalDamage;
    },

    /**
     * 应用伤害效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果
     */
    applyDamageEffects(character, template, teamMembers, monster) {
        const targets = this.getTargets(character, template.targetType, teamMembers, monster);
        const effects = [];
        let totalDamage = 0;

        // 应用每个伤害效果
        for (const target of targets) {
            for (const effect of template.effects) {
                if (effect.type === 'damage') {
                    // 计算伤害
                    let damageMultiplier = effect.multiplier || 1.0;

                    // 如果有最小和最大倍率，随机生成倍率
                    if (effect.minMultiplier && effect.maxMultiplier) {
                        damageMultiplier = effect.minMultiplier + Math.random() * (effect.maxMultiplier - effect.minMultiplier);
                    }

                    // 计算原始伤害
                    const rawDamage = Math.floor(character.currentStats.attack * damageMultiplier);

                    // 应用伤害到目标，考虑BUFF和DEBUFF
                    const actualDamage = this.applyDamageToTarget(character, target, rawDamage, { randomApplied: false });

                    // 更新伤害统计
                    character.stats.totalDamage += actualDamage;
                    totalDamage += actualDamage;

                    effects.push({
                        target: target.name,
                        type: 'damage',
                        rawDamage,
                        actualDamage,
                        multiplier: damageMultiplier.toFixed(2)
                    });
                }
            }
        }

        // 生成消息
        let message = `${character.name} 使用了【${template.name}】，`;

        if (template.targetType === 'enemy') {
            message += `对 ${targets[0]?.name || '敌人'} `;
        } else if (template.targetType === 'all_enemies') {
            message += `对敌方全体 `;
        }

        message += `造成了 ${totalDamage} 点伤害！`;

        return {
            message,
            effects: {
                type: 'damage',
                targets: template.targetType,
                totalDamage,
                effects
            }
        };
    },

    /**
     * 应用治疗效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果
     */
    applyHealEffects(character, template, teamMembers, monster) {
        const targets = this.getTargets(character, template.targetType, teamMembers, monster);
        const effects = [];
        let totalHealing = 0;

        // 应用每个治疗效果
        for (const target of targets) {
            if (target.currentStats.hp <= 0) continue; // 跳过已倒下的目标

            for (const effect of template.effects) {
                if (effect.type === 'heal') {
                    // 计算治疗量
                    const healAmount = effect.value || 0;

                    // 记录旧血量
                    const oldHp = target.currentStats.hp;

                    // 应用治疗
                    target.currentStats.hp = Math.min(target.currentStats.maxHp, target.currentStats.hp + healAmount);

                    // 计算实际治疗量
                    const actualHeal = target.currentStats.hp - oldHp;

                    // 更新治疗统计
                    if (character.stats) {
                        character.stats.totalHealing += actualHeal;
                    }

                    totalHealing += actualHeal;

                    effects.push({
                        target: target.name,
                        type: 'heal',
                        healAmount: actualHeal
                    });
                }
            }
        }

        // 生成消息
        let message = `${character.name} 使用了【${template.name}】，`;

        if (template.targetType === 'self') {
            message += `恢复了 ${totalHealing} 点生命值！`;
        } else if (template.targetType === 'ally') {
            message += `为 ${targets[0]?.name || '队友'} 恢复了 ${totalHealing} 点生命值！`;
        } else if (template.targetType === 'all_allies') {
            message += `为全队恢复了 ${totalHealing} 点生命值！`;
        }

        return {
            message,
            effects: {
                type: 'heal',
                targets: template.targetType,
                totalHealing,
                effects
            }
        };
    },

    /**
     * 应用驱散效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果
     */
    applyDispelEffects(character, template, teamMembers, monster) {
        const targets = this.getTargets(character, template.targetType, teamMembers, monster);
        const effects = [];
        let totalDispelCount = 0;

        // 应用每个驱散效果
        for (const target of targets) {
            if (target.currentStats.hp <= 0) continue; // 跳过已倒下的目标

            for (const effect of template.effects) {
                if (effect.type === 'dispel') {
                    // 驱散BUFF
                    const dispelledBuffs = BuffSystem.dispelBuffs(
                        target,
                        effect.dispelPositive || false,
                        effect.count || 1
                    );

                    totalDispelCount += dispelledBuffs.length;

                    effects.push({
                        target: target.name,
                        type: 'dispel',
                        count: dispelledBuffs.length,
                        dispelPositive: effect.dispelPositive || false
                    });
                }
            }
        }

        // 生成消息
        let message = `${character.name} 使用了【${template.name}】，`;

        if (template.targetType === 'self') {
            message += `驱散了自身 ${totalDispelCount} 个`;
        } else if (template.targetType === 'ally') {
            message += `驱散了 ${targets[0]?.name || '队友'} ${totalDispelCount} 个`;
        } else if (template.targetType === 'all_allies') {
            message += `驱散了队伍中 ${totalDispelCount} 个`;
        } else if (template.targetType === 'enemy') {
            message += `驱散了 ${targets[0]?.name || '敌人'} ${totalDispelCount} 个`;
        } else if (template.targetType === 'all_enemies') {
            message += `驱散了敌方 ${totalDispelCount} 个`;
        }

        // 添加驱散类型
        const dispelType = template.effects[0]?.dispelPositive ? '增益' : '负面';
        message += `${dispelType}效果！`;

        return {
            message,
            effects: {
                type: 'dispel',
                targets: template.targetType,
                totalDispelCount,
                effects
            }
        };
    },

    /**
     * 应用伤害和BUFF效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果
     */
    applyDamageAndBuffEffects(character, template, teamMembers, monster) {
        // 先应用伤害效果
        const damageResult = this.applyDamageEffects(character, template, teamMembers, monster);

        // 再应用BUFF效果
        const buffTargets = this.getTargets(character, template.targetType === 'enemy' ? 'self' : template.targetType, teamMembers, monster);
        const buffEffects = [];

        // 应用每个BUFF效果
        for (const target of buffTargets) {
            if (target.currentStats.hp <= 0) continue; // 跳过已倒下的目标

            for (const effect of template.effects) {
                if (effect.type !== 'damage' && effect.type !== 'dot') {
                    // 创建BUFF
                    const buff = BuffSystem.createBuff(effect.type, effect.value, effect.duration || template.duration, character);

                    // 设置BUFF属性
                    if (buff && effect.name) buff.name = effect.name;
                    if (buff && effect.description) buff.description = effect.description;
                    if (buff && effect.icon) buff.icon = effect.icon;
                    if (buff && effect.maxHits) buff.maxHits = effect.maxHits;

                    // 应用BUFF
                    if (buff) {
                        BuffSystem.applyBuff(target, buff);
                    }

                    buffEffects.push({
                        target: target.name,
                        type: effect.type,
                        value: effect.value,
                        duration: effect.duration || template.duration
                    });
                }
            }
        }

        // 合并消息
        let message = damageResult.message;
        if (buffEffects.length > 0) {
            message += ` 同时，${character.name} 获得了增益效果！`;
        }

        return {
            message,
            effects: {
                type: 'damage_and_buff',
                damageEffects: damageResult.effects,
                buffEffects: {
                    type: 'buff',
                    targets: template.targetType === 'enemy' ? 'self' : template.targetType,
                    effects: buffEffects
                }
            }
        };
    },

    /**
     * 应用伤害和DEBUFF效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果
     */
    applyDamageAndDebuffEffects(character, template, teamMembers, monster) {
        const targets = this.getTargets(character, template.targetType, teamMembers, monster);
        const effects = [];
        let totalDamage = 0;

        // 应用每个效果
        for (const target of targets) {
            // 先应用伤害效果
            for (const effect of template.effects) {
                if (effect.type === 'multi_attack') {
                    // 多重攻击
                    const attackCount = effect.count || 1;
                    const damageMultiplier = effect.multiplier || 1.0;
                    let attackDamage = 0;

                    // 计算每次攻击的伤害
                    for (let i = 0; i < attackCount; i++) {
                        // 检查目标是否已被击败
                        if (target.currentStats.hp <= 0) break;

                        // 计算原始伤害
                        const rawDamage = Math.floor(character.currentStats.attack * damageMultiplier);

                        // 应用伤害到目标，考虑BUFF和DEBUFF
                        const actualDamage = this.applyDamageToTarget(character, target, rawDamage, { randomApplied: false });

                        // 更新伤害统计
                        character.stats.totalDamage += actualDamage;
                        totalDamage += actualDamage;
                        attackDamage += actualDamage;
                    }

                    effects.push({
                        target: target.name,
                        type: 'multi_attack',
                        attackCount,
                        damageMultiplier,
                        attackDamage
                    });
                }
            }

            // 再应用DEBUFF效果
            for (const effect of template.effects) {
                if (effect.type !== 'multi_attack' && effect.type !== 'damage') {
                    // 创建DEBUFF
                    const debuff = BuffSystem.createBuff(effect.type, effect.value, effect.duration || template.duration, character);

                    // 设置DEBUFF属性
                    if (debuff && effect.name) debuff.name = effect.name;
                    if (debuff && effect.description) debuff.description = effect.description;
                    if (debuff && effect.icon) debuff.icon = effect.icon;

                    // 应用DEBUFF
                    if (debuff) {
                        BuffSystem.applyBuff(target, debuff);
                    }

                    // 特殊处理：DA和TA降低
                    if (effect.type === 'daDown') {
                        target.currentStats.daRate = Math.max(0, (target.currentStats.daRate || 0.1) - effect.value);
                    } else if (effect.type === 'taDown') {
                        target.currentStats.taRate = Math.max(0, (target.currentStats.taRate || 0.03) - effect.value);
                    }

                    effects.push({
                        target: target.name,
                        type: effect.type,
                        value: effect.value,
                        duration: effect.duration || template.duration
                    });
                }
            }
        }

        // 生成消息
        let message = `${character.name} 使用了【${template.name}】，`;

        // 添加伤害描述
        const multiAttackEffect = template.effects.find(e => e.type === 'multi_attack');
        if (multiAttackEffect) {
            message += `对 ${targets[0]?.name || '敌人'} 造成了 ${multiAttackEffect.count} 次攻击，总计 ${totalDamage} 点伤害`;
        } else {
            message += `对 ${targets[0]?.name || '敌人'} 造成了 ${totalDamage} 点伤害`;
        }

        // 添加DEBUFF描述
        const debuffEffects = template.effects.filter(e => e.type !== 'multi_attack' && e.type !== 'damage');
        if (debuffEffects.length > 0) {
            message += `，并使其`;

            // 添加效果描述
            const effectDescriptions = [];
            for (const effect of debuffEffects) {
                let desc = '';

                switch (effect.type) {
                    case 'attackDown':
                        desc = `攻击力降低${effect.value * 100}%`;
                        break;
                    case 'defenseDown':
                        desc = `防御力降低${effect.value * 100}%`;
                        break;
                    case 'missRate':
                        desc = `命中率降低${effect.value * 100}%`;
                        break;
                    case 'daDown':
                        desc = `无法触发双重攻击`;
                        break;
                    case 'taDown':
                        desc = `无法触发三重攻击`;
                        break;
                    case 'stun':
                        desc = `陷入麻痹状态（无法行动）`;
                        break;
                    default:
                        desc = effect.name || effect.type;
                }

                effectDescriptions.push(desc);
            }

            message += effectDescriptions.join('，');

            if (template.duration > 0) {
                message += `，持续${template.duration}回合！`;
            } else {
                message += `！`;
            }
        } else {
            message += `！`;
        }

        return {
            message,
            effects: {
                type: 'damage_and_debuff',
                targets: template.targetType,
                totalDamage,
                effects
            }
        };
    },

    /**
     * 获取技能目标
     * @param {object} character - 角色对象
     * @param {string} targetType - 目标类型
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {array} 目标数组
     */
    getTargets(character, targetType, teamMembers, monster) {
        switch (targetType) {
            case 'self':
                return [character];
            case 'ally':
                // 默认选择生命值最低的队友
                const aliveMembers = teamMembers.filter(member => member.currentStats.hp > 0);
                if (aliveMembers.length === 0) return [];
                aliveMembers.sort((a, b) => a.currentStats.hp / a.currentStats.maxHp - b.currentStats.hp / b.currentStats.maxHp);
                return [aliveMembers[0]];
            case 'all_allies':
                return teamMembers;
            case 'enemy':
                return [monster];
            case 'all_enemies':
                return [monster]; // 当前只有一个怪物
            default:
                return [];
        }
    },

    /**
     * 更新技能冷却时间
     * @param {array} teamMembers - 队伍成员
     */
    updateCooldowns(teamMembers) {
        for (const member of teamMembers) {
            if (member.skillCooldowns) {
                for (const skillId in member.skillCooldowns) {
                    if (member.skillCooldowns[skillId] > 0) {
                        member.skillCooldowns[skillId]--;
                    }
                }
            }
        }
    }
};
