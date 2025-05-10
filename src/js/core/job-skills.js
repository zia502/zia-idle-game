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
     * @returns {object} 技能使用结果 { success: boolean, message?: string, effects?: object }
     */
    useSkill(characterId, skillId, teamMembers, monster) {
        console.log(`[DEBUG JS.useSkill Entry] Monster: ${monster.name}, RefID: ${monster._debugRefId || 'NO_REF_ID'}, HP: ${monster.currentStats.hp}/${monster.currentStats.maxHp}`);
        const character = Character.getCharacter(characterId);
        if (!character) return { success: false, message: '角色不存在' };

        const template = SkillLoader.getSkillInfo(skillId);

        if (!template) {
            return { success: false, message: `技能 ${skillId} 没有定义` };
        }
        const skillDisplayName = template.name || skillId;

        if (character.skillCooldowns && character.skillCooldowns[skillId] > 0) {
            const returnMsg = `技能 ${skillDisplayName} 还在冷却中，剩余 ${character.skillCooldowns[skillId]} 回合`;
            return {
                success: false,
                message: returnMsg
            };
        }
        
        let applyInitialCooldown = template.initialCooldown && template.initialCooldown > 0;
        if (applyInitialCooldown && character.skillUsedOnce && character.skillUsedOnce[skillId] && template.applyInitialCooldownOnce) {
            applyInitialCooldown = false; 
        }

        if (applyInitialCooldown) {
            if (!character.skillCooldowns) {
                character.skillCooldowns = {};
            }
            character.skillCooldowns[skillId] = template.initialCooldown;
            const returnMsgInitial = `技能 ${skillDisplayName} 需要 ${template.initialCooldown} 回合后才能使用`;
            return {
                success: false,
                message: returnMsgInitial
            };
        }

        let result = { success: false, message: `技能 ${skillDisplayName} 执行未产生预期结果。`, effects: {} }; 

        switch (template.effectType) {
            case 'damage':
                result = this.applyDamageEffects(character, template, teamMembers, monster);
                break;
            case 'buff':
                result = this.applyBuffEffects(character, template, teamMembers, monster);
                break;
            case 'debuff':
                result = this.applyDebuffEffects(character, template, teamMembers, monster);
                break;
            case 'heal':
                result = this.applyHealEffects(character, template, teamMembers, monster);
                break;
            case 'dispel':
                result = this.applyDispelEffects(character, template, teamMembers, monster);
                break;
            case 'revive':
                result = this.applyReviveEffects(character, template, teamMembers, monster);
                break;
            case 'multi_effect':
            case 'trigger':
                result = this.applySkillEffects(character, template, teamMembers, monster);
                break;
            default:
                if (template.effects && Array.isArray(template.effects) && template.effects.length > 0) {
                    Battle.logBattle(`技能 ${template.name} 的 effectType "${template.effectType}" 不是标准主动类型，尝试通用效果处理。`);
                    result = this.applySkillEffects(character, template, teamMembers, monster);
                } else {
                    return { success: false, message: `未知的技能类型 (${template.effectType}) 或无效果定义。` };
                }
        }

        if (result && result.success && !template.isTriggeredSkill) {
            if (!character.skillCooldowns) {
                character.skillCooldowns = {};
            }
            if (template.nextCooldown !== undefined && character.skillUsedOnce && character.skillUsedOnce[skillId]) {
                character.skillCooldowns[skillId] = template.nextCooldown;
            } else {
                character.skillCooldowns[skillId] = template.cooldown || 5;
            }

            if (!character.skillUsedOnce) {
                character.skillUsedOnce = {};
            }
            character.skillUsedOnce[skillId] = true;
        }

        if (result && result.success && typeof Battle !== 'undefined' && Battle.logBattle && !template.isTriggeredSkill) {
            try {
                let logParts = [];
                logParts.push(`[技能][回合 ${Battle.currentTurn || 0}]`);
                logParts.push(`${character.name} 使用 [${skillDisplayName}]`);

                const getTargetObject = (name, char, mon, team) => {
                    if (name === mon.name) return mon;
                    return team.find(m => m.name === name);
                };
                
                const getTargetString = (targetType, resEffectsContainer, char, mon, team) => {
                    if (targetType === 'self') return "自身";
                    if (targetType === 'all_allies') return "所有友方";
                    if (targetType === 'all_enemies') return "所有敌人";
                    if (targetType === 'enemy') return mon.name;
                    if (targetType === 'ally') {
                        const actualEffectsArray = Array.isArray(resEffectsContainer) ? resEffectsContainer : (resEffectsContainer && resEffectsContainer.effects && Array.isArray(resEffectsContainer.effects) ? resEffectsContainer.effects : []);
                        if (actualEffectsArray.length > 0 && actualEffectsArray[0].target) {
                             return actualEffectsArray[0].target;
                        }
                        const firstAlly = team.find(m => m.id !== char.id && m.currentStats.hp > 0);
                        return firstAlly ? firstAlly.name : "某个友方";
                    }
                    const actualEffectsArrayForFallback = Array.isArray(resEffectsContainer) ? resEffectsContainer : (resEffectsContainer && resEffectsContainer.effects && Array.isArray(resEffectsContainer.effects) ? resEffectsContainer.effects : (resEffectsContainer && resEffectsContainer.details && Array.isArray(resEffectsContainer.details) ? resEffectsContainer.details : [] ) );
                    if (actualEffectsArrayForFallback.length > 0) {
                        const affectedNames = new Set(actualEffectsArrayForFallback.map(e => e.target).filter(t => t));
                        if (affectedNames.size === 1) return affectedNames.values().next().value;
                        if (affectedNames.size > 1) return Array.from(affectedNames).join(', ');
                    }
                    return "目标";
                };

                let targetStringDisplay = getTargetString(template.targetType, result.effects, character, monster, teamMembers);
                logParts.push(`对 ${targetStringDisplay}`);

                let mainEffectDescription = "";
                let targetHpStrings = new Set();

                if (result.effects) { 
                    const resEffectsContainer = result.effects.effects || result.effects; 
                    const actualEffectsArray = Array.isArray(resEffectsContainer) ? resEffectsContainer : (resEffectsContainer && typeof resEffectsContainer === 'object' && !Array.isArray(resEffectsContainer) ? [resEffectsContainer] : []);

                    if (actualEffectsArray.length > 0) {
                        let damageTotal = 0;
                        let healTotal = 0;
                        const effectDescriptions = [];

                        actualEffectsArray.forEach(atomicEffectResult => {
                            const individualResults = Array.isArray(atomicEffectResult) ? atomicEffectResult : [atomicEffectResult];

                            individualResults.forEach(indivRes => {
                                const effectDetailsToLog = indivRes.details || indivRes.effects || (indivRes.type === indivRes.name ? [] : [indivRes]); 

                                if (indivRes.type === 'damage' && indivRes.totalDamage !== undefined) {
                                    damageTotal += indivRes.totalDamage;
                                    if (Array.isArray(effectDetailsToLog)) {
                                        effectDetailsToLog.forEach(de => {
                                            const tObj = getTargetObject(de.target, character, monster, teamMembers);
                                            if (tObj && tObj.currentStats) {
                                                targetHpStrings.add(`${tObj.name} 剩余HP: ${Math.floor(tObj.currentStats.hp)}/${Math.floor(tObj.currentStats.maxHp)}。`);
                                            }
                                        });
                                    }
                                } else if (indivRes.type === 'heal' && indivRes.totalHealing !== undefined) {
                                    healTotal += indivRes.totalHealing;
                                    if (Array.isArray(effectDetailsToLog)) {
                                         effectDetailsToLog.forEach(de => {
                                            const tObj = getTargetObject(de.target, character, monster, teamMembers);
                                            if (tObj && tObj.currentStats) {
                                                targetHpStrings.add(`${tObj.name} 剩余HP: ${Math.floor(tObj.currentStats.hp)}/${Math.floor(tObj.currentStats.maxHp)}。`);
                                            }
                                        });
                                    }
                                } else if ((indivRes.type === 'buff' || indivRes.type === 'debuff') && Array.isArray(effectDetailsToLog) && effectDetailsToLog.length > 0) {
                                    const firstEffect = effectDetailsToLog[0];
                                    effectDescriptions.push(`施加了 [${firstEffect.name || firstEffect.type}] 效果${firstEffect.duration ? `(持续${firstEffect.duration}回合)` : ''}`);
                                    effectDetailsToLog.forEach(eff => {
                                         const tObj = getTargetObject(eff.target, character, monster, teamMembers);
                                         if (tObj && tObj.currentStats) {
                                            targetHpStrings.add(`${tObj.name} 剩余HP: ${Math.floor(tObj.currentStats.hp)}/${Math.floor(tObj.currentStats.maxHp)}。`);
                                         }
                                    });
                                } else if (indivRes.type === 'dispel' && Array.isArray(effectDetailsToLog) && effectDetailsToLog.length > 0) {
                                    const dispelledDetail = effectDetailsToLog[0];
                                    const dispelledTargetName = dispelledDetail.target || targetStringDisplay;
                                    const dispelType = dispelledDetail.dispelPositive ? "增益" : "负面";
                                    const count = dispelledDetail.count || indivRes.totalDispelCount;
                                    if (count > 0) {
                                        effectDescriptions.push(`驱散了 ${dispelledTargetName} 的 ${count} 个[${dispelType}]效果`);
                                    }
                                    const tObj = getTargetObject(dispelledTargetName, character, monster, teamMembers);
                                    if (tObj && tObj.currentStats) {
                                        targetHpStrings.add(`${tObj.name} 剩余HP: ${Math.floor(tObj.currentStats.hp)}/${Math.floor(tObj.currentStats.maxHp)}。`);
                                    }
                                }
                            });
                        });

                        if (damageTotal > 0) {
                            effectDescriptions.unshift(`造成 ${damageTotal} 点 ${template.attribute || '物理'} 伤害`);
                        }
                        if (healTotal > 0) {
                             effectDescriptions.unshift(`恢复了 ${healTotal} 点 HP`);
                        }
                        mainEffectDescription = effectDescriptions.join('，') + (effectDescriptions.length > 0 ? '。' : '');
                    }
                }
                
                if (!mainEffectDescription && result.message) { 
                    let simpleMsg = result.message.replace(`${character.name} 使用了【${skillDisplayName}】，`, '').trim();
                    simpleMsg = simpleMsg.replace(/^为 |^对 /, '').trim();
                    if (simpleMsg.startsWith(targetStringDisplay)) {
                         simpleMsg = simpleMsg.substring(targetStringDisplay.length).trim().replace(/^了 |^的 /, '').trim();
                    }
                    mainEffectDescription = simpleMsg.charAt(0).toUpperCase() + simpleMsg.slice(1);
                     if (!mainEffectDescription.endsWith('.') && !mainEffectDescription.endsWith('！') && mainEffectDescription) mainEffectDescription += '。';
                }

                if (mainEffectDescription) {
                    logParts.push(mainEffectDescription);
                }

                targetHpStrings.forEach(hpStr => logParts.push(hpStr));
                
                Battle.logBattle(logParts.join(' ').trim());

            } catch (e) {
                console.error("Error generating skill log:", e, "Result object:", JSON.stringify(result));
                Battle.logBattle(`[技能][回合 ${Battle.currentTurn || 0}] ${character.name} 使用了 [${skillDisplayName}]。 (详细日志生成失败)`);
            }
        }

        const finalReturnObject = {
            success: result ? result.success : false, 
            message: result ? result.message : "技能执行失败或无返回信息。",
            effects: result ? result.effects : {} 
        };
        console.log(`[DEBUG JS.useSkill EXIT] Monster: ${monster.name}, RefID: ${monster._debugRefId || 'NO_REF_ID'}, HP: ${monster.currentStats.hp}/${monster.currentStats.maxHp}`);
        if (typeof Battle !== 'undefined' && Battle.logBattle) {
            Battle.logBattle(`[调试][JS.useSkill EXIT] ${monster.name} HP: ${monster.currentStats.hp}/${monster.currentStats.maxHp}`);
        }
        return finalReturnObject;
    },

    /**
     * 应用触发其他技能的效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板 (包含 triggerSkillId)
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果 { success: boolean, message?: string, effects?: object }
     */
    applyTriggerSkillEffect(character, template, teamMembers, monster) {
        const triggeredSkillId = template.triggerSkillId;
        if (!triggeredSkillId) {
            return { success: false, message: `技能 ${template.name} 配置错误：缺少 triggerSkillId` };
        }

        const triggeredSkillTemplate = SkillLoader.getSkillInfo(triggeredSkillId);
        if (!triggeredSkillTemplate) {
             return { success: false, message: `要触发的技能 ${triggeredSkillId} 不存在或无效果定义` };
        }

        Battle.logBattle(`${character.name} 的技能 ${template.name} 触发了职业技能 ${triggeredSkillTemplate.name}!`);
        triggeredSkillTemplate.isTriggeredSkill = true;
        const triggerResult = this.applySkillEffects(character, triggeredSkillTemplate, teamMembers, monster);
        return {
            success: triggerResult.success, 
            message: triggerResult.message || `${character.name} 触发了 ${triggeredSkillTemplate.name}。`,
            effects: triggerResult.effects 
        };
    },
    
    /**
     * 应用技能效果 (通常用于 multi_effect 或 trigger 类型)
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果 { success: boolean, message?: string, effects?: object }
     * @test Test with a multi_effect skill that includes damage and buff. Expected: both effects applied, success: true.
     * @test Test with a multi_effect skill where one sub-effect targets an invalid/dead target. Expected: other valid sub-effects apply, success: true if at least one sub-effect succeeded.
     * @test Test with a multi_effect skill where a cost (hpCostPercentageCurrent) cannot be paid. Expected: success: false, no other effects applied.
     * @test Test with a trigger skill that casts another skill. Expected: triggered skill executes, overall success depends on triggered skill.
     */
    applySkillEffects(character, template, teamMembers, monster) {
        let combinedResults = { messages: [], effectsApplied: [], overallSuccess: false };

        if (!Array.isArray(template.effects)) {
            if (template.effect && typeof template.effect === 'object') {
                template.effects = [template.effect];
            } else {
                Battle.logBattle(`技能 ${template.name} 没有有效的效果定义。`);
                return { 
                    success: false, 
                    message: `${character.name} 使用了【${template.name}】，但技能效果配置错误。`, 
                    effects: {} 
                };
            }
        }
        
        let costSuccess = true;
        for (const effectDetail of template.effects) {
            if (effectDetail.type === 'hpCostPercentageCurrent') {
                const costValue = parseFloat(effectDetail.value);
                if (isNaN(costValue) || costValue <= 0) {
                    Battle.logBattle(`技能 ${template.name} 的 hpCostPercentageCurrent 值无效: ${effectDetail.value}`);
                    combinedResults.messages.push(`技能 ${template.name} 的HP消耗配置错误。`);
                    costSuccess = false;
                    break; 
                }

                let baseHpForCost = character.currentStats.hp;
                if (effectDetail.basedOn === 'maxHp') {
                    baseHpForCost = character.currentStats.maxHp;
                }

                const hpToCost = Math.floor(baseHpForCost * (costValue / 100));
                
                if (character.currentStats.hp - hpToCost < 1) {
                    if (character.currentStats.hp > 1) {
                        const actualCost = character.currentStats.hp - 1;
                        character.currentStats.hp = 1;
                        Battle.logBattle(`${character.name} 使用技能 ${template.name} 消耗了 ${actualCost} HP (不足以支付全部, HP降至1)。`);
                        combinedResults.messages.push(`${character.name} 消耗了 ${actualCost} HP (HP降至1)。`);
                    } else {
                        Battle.logBattle(`${character.name} 尝试使用技能 ${template.name}，但HP不足以支付消耗 (当前HP: ${character.currentStats.hp})。`);
                        combinedResults.messages.push(`${character.name} HP不足，无法支付技能 ${template.name} 的消耗。`);
                        costSuccess = false;
                        break; 
                    }
                } else {
                    character.currentStats.hp -= hpToCost;
                    Battle.logBattle(`${character.name} 使用技能 ${template.name} 消耗了 ${hpToCost} HP。`);
                    combinedResults.messages.push(`${character.name} 消耗了 ${hpToCost} HP。`);
                }
                if (typeof UI !== 'undefined' && UI.updateCharacterStatus) {
                    UI.updateCharacterStatus(character.id);
                }
            }
        }
        
        if (!costSuccess) {
             return {
                success: false,
                message: combinedResults.messages.join(' \n') || `技能 ${template.name} 因HP消耗失败而无法使用。`,
                effects: combinedResults.effectsApplied.length > 0 ? combinedResults.effectsApplied : {}
            };
        }

        for (const effectDetail of template.effects) {
            if (monster.currentStats.hp <= 0 && template.targetType && template.targetType.includes('enemy')) {
                 combinedResults.messages.push(`战斗结束，${monster.name} 已被击败。`);
                 combinedResults.overallSuccess = true; 
            }
            if (effectDetail.type === 'hpCostPercentageCurrent') {
                continue;
            }

            let currentEffectResult = { success: false, message: "", effects: {} }; 
            const actualEffectType = effectDetail.type || template.effectType;
            const buffDefinition = BuffSystem.getBuffDefinition(actualEffectType);

            if (buffDefinition) {
                const optionsForEffect = { ...template, ...effectDetail, effects: [effectDetail], buffType: actualEffectType };
                currentEffectResult = buffDefinition.isPositive 
                    ? this.applyBuffEffects(character, optionsForEffect, teamMembers, monster) 
                    : this.applyDebuffEffects(character, optionsForEffect, teamMembers, monster);
            } else {
                switch (actualEffectType) {
                    case 'damage':
                    case 'enmity':
                        let totalAdditionalFixedDamage = 0;
                        let totalDirectDamageBonus = 0;
                        if (Array.isArray(template.effects)) {
                            template.effects.forEach(siblingEffect => {
                                if (siblingEffect.type === 'additionalDamage' && typeof siblingEffect.value === 'number') totalAdditionalFixedDamage += siblingEffect.value;
                                if (siblingEffect.type === 'directDamageBonus' && typeof siblingEffect.value === 'number') totalDirectDamageBonus += siblingEffect.value;
                            });
                        }
                        currentEffectResult = this.applyDamageEffects(character, { ...template, ...effectDetail, effects: [effectDetail], type: actualEffectType }, teamMembers, monster, totalAdditionalFixedDamage, totalDirectDamageBonus);
                        break;
                    case 'heal':
                        currentEffectResult = this.applyHealEffects(character, { ...template, ...effectDetail, effects: [effectDetail] }, teamMembers, monster);
                        break;
                    case 'dispel':
                        currentEffectResult = this.applyDispelEffects(character, { ...template, ...effectDetail, effects: [effectDetail] }, teamMembers, monster);
                        break;
                    case 'cleanse':
                        currentEffectResult = this.applyDispelEffects(character, { ...template, ...effectDetail, dispelPositive: false, effects: [effectDetail] }, teamMembers, monster);
                        break;
                    case 'revive':
                        currentEffectResult = this.applyReviveEffects(character, { ...template, ...effectDetail, effects: [effectDetail] }, teamMembers, monster);
                        break;
                    case 'castSkill':
                        currentEffectResult = effectDetail.skillId 
                            ? this.applyTriggerSkillEffect(character, { ...template, ...effectDetail, triggerSkillId: effectDetail.skillId }, teamMembers, monster)
                            : { success: false, message: `技能 ${template.name} 的 castSkill 效果缺少 skillId` };
                        break;
                    case 'applyBuffPackage':
                        const targetForBuffPkg = this.getTargets(character, effectDetail.targetType || template.targetType, teamMembers, monster)[0];
                        if (targetForBuffPkg) {
                            const buffPackageApplied = BuffSystem.applyBuffPackage(targetForBuffPkg, effectDetail, character);
                            currentEffectResult = {
                                success: buffPackageApplied,
                                message: buffPackageApplied ? `${character.name} 对 ${targetForBuffPkg.name} 施加了效果包 ${effectDetail.buffName || effectDetail.name || '效果包'}` : `施加效果包 ${effectDetail.buffName || effectDetail.name || '效果包'} 失败`,
                                effects: { type: 'buffPackage', appliedTo: targetForBuffPkg.name, packageName: effectDetail.buffName || effectDetail.name }
                            };
                        } else {
                            currentEffectResult = { success: false, message: `技能 ${template.name} 的 applyBuffPackage 效果找不到目标` };
                        }
                        break;
                    case 'echo':
                        currentEffectResult = this.applyBuffEffects(character, { ...template, ...effectDetail, effects: [effectDetail], buffType: actualEffectType }, teamMembers, monster);
                        break;
                    case 'fieldEffect':
                        console.warn(`Unhandled atomic effect type: fieldEffect in skill ${template.name}`);
                        Battle.logBattle(`技能 ${template.name} 尝试应用未实现的场地效果。`);
                        currentEffectResult = { success: true, message: `应用了场地效果（待实现）`, effects: {} }; 
                        break;
                    case 'proc':
                        let procSubEffectsSuccess = true; 
                        if (effectDetail.additionalEffects && Array.isArray(effectDetail.additionalEffects)) {
                            for (const additionalEffect of effectDetail.additionalEffects) {
                                const tempSubTemplate = { ...template, ...additionalEffect, effects: [additionalEffect], name: `${template.name} (附加效果)` };
                                const subEffectResult = this.applySkillEffects(character, tempSubTemplate, teamMembers, monster); 
                                if (subEffectResult.message) combinedResults.messages.push(subEffectResult.message);
                                if (subEffectResult.effects) combinedResults.effectsApplied.push(subEffectResult.effects);
                                if (!subEffectResult.success) procSubEffectsSuccess = false; 
                            }
                        }
                        currentEffectResult = {
                            success: procSubEffectsSuccess, 
                            message: `${character.name} 的技能 ${template.name} 包含proc定义${procSubEffectsSuccess ? '' : '，部分附加效果失败'}。`,
                            effects: { type: 'proc' } 
                        };
                        break;
                    default:
                        currentEffectResult = {
                            success: false, 
                            message: `${character.name} 使用了【${template.name}】中的未知原子效果类型: ${actualEffectType}。该原子效果处理失败。`,
                            effects: { type: 'unknown', unknownType: actualEffectType },
                        };
                        Battle.logBattle(currentEffectResult.message); 
                }
            }

            if (currentEffectResult) {
                if (currentEffectResult.message) combinedResults.messages.push(currentEffectResult.message);
                if (currentEffectResult.effects) combinedResults.effectsApplied.push(currentEffectResult.effects);
                if (currentEffectResult.success) {
                    combinedResults.overallSuccess = true; 
                }
            }
        }
        
        const hasNonCostEffects = template.effects.some(e => e.type !== 'hpCostPercentageCurrent');
        if (!hasNonCostEffects && costSuccess) { 
            combinedResults.overallSuccess = true;
        }

        return {
            success: combinedResults.overallSuccess, 
            message: combinedResults.messages.join(' \n') || `${character.name} 使用了【${template.name}】。`,
            effects: combinedResults.effectsApplied.length > 0 ? combinedResults.effectsApplied : {}
        };
    },

    /**
     * 应用BUFF效果
     * @param {object} character - 角色对象
     * @param {object} optionsForEffect - 包含技能模板和当前效果详情的选项对象
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果 { success: boolean, message?: string, effects?: object }
     * @test Test applying a single buff to self. Expected: success: true, buff applied.
     * @test Test applying buffs to all allies. Expected: success: true, buffs applied to all living allies.
     * @test Test applying buff to a dead target. Expected: success: true (as no valid target), no buff applied to dead target.
     */
    applyBuffEffects(character, optionsForEffect, teamMembers, monster) {
        const targets = this.getTargets(character, optionsForEffect.targetType, teamMembers, monster);
        const effectsAppliedDetails = [];
        let appliedAtLeastOneBuff = false;

        if (targets.length === 0 && optionsForEffect.targetType !== 'self') {
            return {
                success: true, 
                message: `${character.name} 使用了【${optionsForEffect.name}】，但没有有效的目标施加BUFF。`,
                effects: { type: 'buff', targetType: optionsForEffect.targetType, effects: [] }
            };
        }

        for (const target of targets) {
            if (target.currentStats.hp <= 0) continue;

            for (const effectDetail of optionsForEffect.effects) { 
                const buffTypeToApply = optionsForEffect.buffType || effectDetail.type;

                const buff = BuffSystem.createBuff(
                    buffTypeToApply,
                    effectDetail.value,
                    effectDetail.duration || optionsForEffect.duration,
                    character,
                    {
                        name: effectDetail.name,
                        description: effectDetail.description,
                        icon: effectDetail.icon,
                        maxHits: effectDetail.maxHits,
                        elementType: effectDetail.elementType,
                        statusToImmune: effectDetail.statusToImmune,
                        convertToElementType: effectDetail.convertToElementType,
                        buffsPerStack: effectDetail.buffsPerStack,
                        canDispel: effectDetail.canDispel, 
                        stackable: effectDetail.stackable, 
                        maxStacks: effectDetail.maxStacks, 
                        valueInteraction: effectDetail.valueInteraction 
                    }
                );

                if (buff) {
                    BuffSystem.applyBuff(target, buff);
                    appliedAtLeastOneBuff = true; 
                }

                if (buffTypeToApply === 'daBoost' && buff) {
                    target.currentStats.daRate = (target.currentStats.daRate || 0.15) + buff.value;
                } else if (buffTypeToApply === 'taBoost' && buff) {
                    target.currentStats.taRate = (target.currentStats.taRate || 0.05) + buff.value;
                }

                effectsAppliedDetails.push({
                    target: target.name,
                    type: buffTypeToApply,
                    name: buff ? buff.name : buffTypeToApply,
                    value: effectDetail.value,
                    duration: effectDetail.duration || optionsForEffect.duration
                });
            }
        }

        let message = `${character.name} 使用了【${optionsForEffect.name}】，`;

        if (optionsForEffect.targetType === 'self') {
            message += `获得了`;
        } else if (optionsForEffect.targetType === 'ally') {
            message += `为 ${targets[0]?.name || '队友'} 提供了`;
        } else if (optionsForEffect.targetType === 'all_allies') {
            message += `为全队提供了`;
        }

        const effectDescriptions = [];
        for (const effectDetail of optionsForEffect.effects) {
            let desc = '';
            const buffTypeForDesc = optionsForEffect.buffType || effectDetail.type;
            const buffDef = BuffSystem.getBuffDefinition(buffTypeForDesc);
            const buffDisplayName = buffDef ? buffDef.name : (effectDetail.name || buffTypeForDesc);

            switch (buffTypeForDesc) {
                case 'attackUp':
                case 'defenseUp':
                case 'daBoost':
                case 'taBoost':
                case 'damageReduction':
                case 'critRateUp':
                case 'criticalDamageUp':
                case 'skillDamageUp':
                case 'directDamageValueUp':
                    desc = `${buffDisplayName}${typeof effectDetail.value === 'number' ? (buffDef && (buffDef.valueInteraction === 'add' || buffDef.valueInteraction === 'max') && !String(effectDetail.value).includes('%') && effectDetail.value < 2 && effectDetail.value > -2 ? (effectDetail.value * 100).toFixed(0) + '%' : effectDetail.value) : ''}`;
                    break;
                case 'invincible':
                    desc = `${buffDisplayName}（抵挡${effectDetail.maxHits || 1}次攻击）`;
                    break;
                case 'evade': 
                case 'evasionAll':
                    desc = `${buffDisplayName}`;
                    break;
                default:
                    desc = `${buffDisplayName}效果`;
            }
            if (desc) {
                const durationText = (effectDetail.duration || optionsForEffect.duration) ? `(持续${effectDetail.duration || optionsForEffect.duration}回合)` : '';
                effectDescriptions.push(`${desc}${durationText}`);
            }
        }

        if (effectDescriptions.length > 0) {
            message += effectDescriptions.join('，') + '！';
        } else if (targets.length > 0 && optionsForEffect.effects && optionsForEffect.effects.length > 0 && appliedAtLeastOneBuff) {
             message += `施加了 ${effectsAppliedDetails.length} 个效果。`;
        } else if (targets.length > 0) {
            message += '但未产生具体效果。';
        } else { 
            message += '但没有有效目标。';
        }
        
        const success = appliedAtLeastOneBuff || (targets.length === 0 && optionsForEffect.targetType !== 'self');
        return {
            success: success,
            message: message,
            effects: {
                type: 'buff',
                targetType: optionsForEffect.targetType,
                effects: effectsAppliedDetails
            }
        };
    },

    /**
     * 应用DEBUFF效果
     * @param {object} character - 角色对象
     * @param {object} optionsForEffect - 包含技能模板和当前效果详情的选项对象
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果 { success: boolean, message?: string, effects?: object }
     * @test Test applying a debuff to an enemy. Expected: success: true, debuff applied.
     * @test Test applying debuff to no valid targets. Expected: success: true, message indicates no target.
     */
    applyDebuffEffects(character, optionsForEffect, teamMembers, monster) {
        const targets = this.getTargets(character, optionsForEffect.targetType, teamMembers, monster);
        const effectsAppliedDetails = [];
        let appliedAtLeastOneDebuff = false;

        if (targets.length === 0) {
            return {
                success: true, 
                message: `${character.name} 使用了【${optionsForEffect.name}】，但没有有效的目标施加DEBUFF。`,
                effects: { type: 'debuff', targetType: optionsForEffect.targetType, effects: [] }
            };
        }

        for (const target of targets) {
            if (target.currentStats.hp <= 0) continue;

            for (const effectDetail of optionsForEffect.effects) { 
                const buffTypeToApply = optionsForEffect.buffType || effectDetail.type;
                
                const debuff = BuffSystem.createBuff(
                    buffTypeToApply,
                    effectDetail.value,
                    effectDetail.duration || optionsForEffect.duration,
                    character,
                     {
                        name: effectDetail.name,
                        description: effectDetail.description,
                        icon: effectDetail.icon,
                        elementType: effectDetail.elementType,
                        statusToImmune: effectDetail.statusToImmune,
                        convertToElementType: effectDetail.convertToElementType,
                        buffsPerStack: effectDetail.buffsPerStack,
                        canDispel: effectDetail.canDispel,
                        stackable: effectDetail.stackable,
                        maxStacks: effectDetail.maxStacks,
                        valueInteraction: effectDetail.valueInteraction
                    }
                );

                if (debuff) {
                    BuffSystem.applyBuff(target, debuff);
                    appliedAtLeastOneDebuff = true;
                }

                if (buffTypeToApply === 'daDown' && debuff) {
                    target.currentStats.daRate = Math.max(0, (target.currentStats.daRate || 0.1) - debuff.value);
                } else if (buffTypeToApply === 'taDown' && debuff) {
                    target.currentStats.taRate = Math.max(0, (target.currentStats.taRate || 0.03) - debuff.value);
                }

                effectsAppliedDetails.push({
                    target: target.name,
                    type: buffTypeToApply,
                    name: debuff ? debuff.name : buffTypeToApply,
                    value: effectDetail.value,
                    duration: effectDetail.duration || optionsForEffect.duration
                });
            }
        }

        let message = `${character.name} 使用了【${optionsForEffect.name}】，`;

        if (optionsForEffect.targetType === 'enemy') {
            message += `使 ${targets[0]?.name || '敌人'} `;
        } else if (optionsForEffect.targetType === 'all_enemies') {
            message += `使敌方全体 `;
        }

        const effectDescriptions = [];
        for (const effectDetail of optionsForEffect.effects) {
            let desc = '';
            const buffTypeForDesc = optionsForEffect.buffType || effectDetail.type;
            const buffDef = BuffSystem.getBuffDefinition(buffTypeForDesc);
            const buffDisplayName = buffDef ? buffDef.name : (effectDetail.name || buffTypeForDesc);

            switch (buffTypeForDesc) {
                case 'attackDown':
                case 'defenseDown': 
                case 'missRate':
                    desc = `${buffDisplayName}${typeof effectDetail.value === 'number' ? (buffDef && (buffDef.valueInteraction === 'add' || buffDef.valueInteraction === 'max') && !String(effectDetail.value).includes('%') && effectDetail.value < 2 && effectDetail.value > -2 ? (effectDetail.value * 100).toFixed(0) + '%' : effectDetail.value) : ''}`;
                    break;
                case 'daDown':
                    desc = `无法触发双重攻击`; 
                    break;
                case 'taDown':
                    desc = `无法触发三重攻击`; 
                    break;
                case 'dot':
                    desc = `${buffDisplayName}（每回合受到${effectDetail.value}点伤害）`;
                    break;
                case 'stun':
                case 'numbness': 
                case 'silence':  
                    desc = `${buffDisplayName}（无法行动）`; 
                    break;
                default:
                    desc = `${buffDisplayName}效果`;
            }
            if (desc) {
                 const durationText = (effectDetail.duration || optionsForEffect.duration) ? `(持续${effectDetail.duration || optionsForEffect.duration}回合)` : '';
                effectDescriptions.push(`${desc}${durationText}`);
            }
        }

        message += effectDescriptions.join('，');

        if (optionsForEffect.duration > 0 && !effectDescriptions.some(d => d.includes('持续'))) { 
             message += `，持续${optionsForEffect.duration}回合！`;
        } else if (effectDescriptions.length > 0) {
            message += `！`;
        } else if (targets.length > 0) {
             message += '但未产生具体效果。';
        } else { 
            message += '但没有有效目标。';
        }
        
        const success = appliedAtLeastOneDebuff || targets.length === 0;
        return {
            success: success,
            message,
            effects: {
                type: 'debuff',
                targets: optionsForEffect.targetType, 
                effects: effectsAppliedDetails
            }
        };
    },

    /**
     * 应用伤害效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板 (应只包含 type: 'damage' 或 'enmity' 的 effects)
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @param {number} [additionalFixedDamage=0] - 额外的固定伤害值
     * @param {number} [directDamageBonus=0] - 直接伤害加成
     * @returns {object} 技能效果结果 { success: boolean, message?: string, effects?: object }
     * @test Test single target damage. Expected: success: true, damage dealt.
     * @test Test AOE damage. Expected: success: true, damage dealt to all enemies.
     * @test Test damage with no valid targets. Expected: success: true, message indicates no target.
     */
    applyDamageEffects(character, template, teamMembers, monster, additionalFixedDamage = 0, directDamageBonus = 0) {
        const targets = this.getTargets(character, template.targetType, teamMembers, monster);
        const effectsAppliedDetails = []; 
        let totalDamageAppliedToAllTargets = 0; 

        if (targets.length === 0) {
            return {
                success: true, 
                message: `${character.name} 使用了【${template.name}】，但没有有效的目标造成伤害。`,
                effects: { type: template.effects[0]?.type || 'damage', totalDamage: 0, details: [] }
            };
        }

        for (const target of targets) {
            const effectsToProcess = template.effects || [];
            for (const effect of effectsToProcess) {
                if (effect.type === 'damage' || effect.type === 'enmity') { 
                    let damageMultiplier = effect.multiplier || 1.0;
                    let attackCount = effect.count || 1;

                    if (effect.minMultiplier && effect.maxMultiplier) {
                        damageMultiplier = effect.minMultiplier + Math.random() * (effect.maxMultiplier - effect.minMultiplier);
                    }

                    if (character.buffs) {
                        character.buffs.forEach(buff => {
                            if (buff.type === 'skillDamageUp' && buff.duration > 0 && typeof buff.value === 'number') {
                                damageMultiplier += buff.value; 
                            }
                        });
                    }

                    for (let i = 0; i < attackCount; i++) {
                        if (target.currentStats.hp <= 0) break;

                        const attackerEffectiveAttack = Character.calculateAttackPower(character);
                        let rawDamage = Math.floor(attackerEffectiveAttack * damageMultiplier);
                        
                        rawDamage += directDamageBonus;
                        rawDamage += additionalFixedDamage;

                        if (typeof Battle !== 'undefined' && Battle.logBattle) {
                            Battle.logBattle(`[调试] 技能 [${template.name}] 对 ${target.name}: ${character.name} 攻击力 ${attackerEffectiveAttack}, 伤害倍率 ${damageMultiplier.toFixed(2)}, 额外固定伤害 ${additionalFixedDamage}, 直接伤害加成 ${directDamageBonus}, 计算原始伤害 ${rawDamage}`);
                        }

                        const damageOptions = {
                            element: effect.element || template.attribute,
                            isFixedDamage: effect.fixedDamageValue !== undefined,
                            fixedDamageValue: effect.fixedDamageValue,
                            skillName: template.name,
                            ignoreDefense: effect.ignoreDefense || false,
                            hits: 1, 
                            skipCritical: template.skipCritical !== undefined ? template.skipCritical : (effect.skipCritical !== undefined ? effect.skipCritical : true)
                        };
                        
                        const actualDamageResult = Battle.applyDamageToTarget(character, target, rawDamage, damageOptions);
                        
                        let damageToApply = 0;
                        if (actualDamageResult && typeof actualDamageResult.damage === 'number') {
                            damageToApply = actualDamageResult.damage;
                        } else {
                            console.error("Battle.applyDamageToTarget did not return a valid damage result:", actualDamageResult);
                        }

                        if (target.currentStats.hp <= 0) { 
                            const gutsBuff = BuffSystem.getBuffsByType(target, 'guts').find(b => b.duration > 0 && (b.currentStacks || 0) > 0);
                            if (gutsBuff) {
                                target.currentStats.hp = 1; 
                                Battle.logBattle(`${target.name} 因 [${gutsBuff.name}] 效果以1HP存活！`);
                                gutsBuff.currentStacks = (gutsBuff.currentStacks || 1) - 1;
                                if (gutsBuff.currentStacks <= 0) {
                                    BuffSystem.removeBuff(target, gutsBuff.id);
                                    Battle.logBattle(`[${gutsBuff.name}] 效果已消耗完毕。`);
                                }
                            }
                        }

                        if (character.stats) { 
                           character.stats.totalDamage = (character.stats.totalDamage || 0) + damageToApply;
                           if(actualDamageResult && actualDamageResult.isCritical) {
                                character.stats.critCount = (character.stats.critCount || 0) + 1;
                           }
                        }
                        totalDamageAppliedToAllTargets += damageToApply; 

                        effectsAppliedDetails.push({
                            target: target.name,
                            type: effect.type, 
                            rawDamage, 
                            actualDamage: damageToApply, 
                            isCritical: actualDamageResult ? actualDamageResult.isCritical : false,
                            multiplier: damageMultiplier.toFixed(2) 
                        });
                    }
                }
            }
        }

        let message = `${character.name} 使用了【${template.name}】，`;
        if (template.targetType === 'enemy') {
            message += `对 ${targets[0]?.name || '敌人'} `;
        } else if (template.targetType === 'all_enemies') {
            message += `对敌方全体 `;
        }
        message += `造成了 ${Math.floor(totalDamageAppliedToAllTargets)} 点伤害！`;

        return {
            success: totalDamageAppliedToAllTargets > 0 || targets.length === 0, 
            message,
            effects: { 
                type: template.effects.find(e => e.type === 'damage' || e.type === 'enmity')?.type || 'damage', 
                totalDamage: Math.floor(totalDamageAppliedToAllTargets),
                details: effectsAppliedDetails
            }
        };
    },

    /**
     * 应用治疗效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果 { success: boolean, message?: string, effects?: object }
     * @test Test healing a target with low HP. Expected: success: true, HP increased.
     * @test Test healing a full HP target. Expected: success: true, message indicates full HP.
     * @test Test healing with no valid targets. Expected: success: true, message indicates no target.
     */
    applyHealEffects(character, template, teamMembers, monster) {
        const targets = this.getTargets(character, template.targetType, teamMembers, monster);
        const effectsAppliedDetails = []; 
        let totalHealing = 0;
        let needsHealingInitially = false;

        if (targets.length > 0) {
            if (template.targetType === 'self') {
                if (character.currentStats.hp < character.currentStats.maxHp && character.currentStats.hp > 0) {
                    needsHealingInitially = true;
                }
            } else {
                needsHealingInitially = targets.some(target =>
                    target.currentStats.hp > 0 && target.currentStats.hp < target.currentStats.maxHp
                );
            }
        }
        
        if (!needsHealingInitially && targets.length > 0) {
             return {
                success: true, 
                message: `${character.name} 使用了【${template.name}】，但所有有效目标都是满血状态或无法被治疗！`,
                effects: { type: 'heal', targets: template.targetType, totalHealing: 0, effects: [] }
            };
        }
        if (targets.length === 0) {
             return {
                success: true, 
                message: `${character.name} 使用了【${template.name}】，但没有有效目标！`,
                effects: { type: 'heal', targets: template.targetType, totalHealing: 0, effects: [] }
            };
        }

        for (const target of targets) {
            if (target.currentStats.hp <= 0 || target.currentStats.hp >= target.currentStats.maxHp) {
                continue; 
            }

            for (const effect of template.effects) {
                if (effect.type === 'heal') {
                    const healAmount = effect.value || 0;
                    const oldHp = target.currentStats.hp;
                    target.currentStats.hp = Math.min(target.currentStats.maxHp, target.currentStats.hp + healAmount);
                    const actualHeal = target.currentStats.hp - oldHp;

                    if (character.stats) {
                        character.stats.totalHealing = (character.stats.totalHealing || 0) + actualHeal;
                    }
                    totalHealing += actualHeal;

                    effectsAppliedDetails.push({
                        target: target.name,
                        type: 'heal',
                        healAmount: actualHeal
                    });
                }
            }
        }

        let message = `${character.name} 使用了【${template.name}】，`;
        if (totalHealing > 0) {
            if (template.targetType === 'self') {
                message += `恢复了 ${totalHealing} 点生命值！`;
            } else if (template.targetType === 'ally') {
                const healedTarget = effectsAppliedDetails.length > 0 ? effectsAppliedDetails[0].target : (targets[0]?.name || '队友');
                message += `为 ${healedTarget} 恢复了 ${totalHealing} 点生命值！`;
            } else if (template.targetType === 'all_allies') {
                message += `为全队恢复了 ${totalHealing} 点生命值！`;
            }
        } else {
            message += `但未造成治疗效果。`; 
        }
        
        return {
            success: totalHealing > 0 || !needsHealingInitially, 
            message,
            effects: {
                type: 'heal',
                targets: template.targetType,
                totalHealing,
                effects: effectsAppliedDetails
            }
        };
    },

    /**
     * 应用驱散效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果 { success: boolean, message?: string, effects?: object }
     * @test Test dispelling a debuff from an enemy. Expected: success: true, debuff removed.
     * @test Test dispelling when no buffs/debuffs are present. Expected: success: true, message indicates no effects to dispel.
     */
    applyDispelEffects(character, template, teamMembers, monster) {
        const targets = this.getTargets(character, template.targetType, teamMembers, monster);
        const effectsAppliedDetails = []; 
        let totalDispelCount = 0;
        let hasBuffsToDispelInitially = false;

        if (targets.length > 0) {
            hasBuffsToDispelInitially = targets.some(target => 
                target.currentStats.hp > 0 && target.buffs && target.buffs.some(b => (template.effects[0]?.dispelPositive ? b.isPositive : !b.isPositive) && b.canDispel !== false)
            );
        }

        if (!hasBuffsToDispelInitially && targets.length > 0) {
            return {
                success: true, 
                message: `${character.name} 使用了【${template.name}】，但目标没有可驱散的效果！`,
                effects: { type: 'dispel', targets: template.targetType, totalDispelCount: 0, effects: [] }
            };
        }
         if (targets.length === 0) {
            return {
                success: true, 
                message: `${character.name} 使用了【${template.name}】，但没有有效目标！`,
                effects: { type: 'dispel', targets: template.targetType, totalDispelCount: 0, effects: [] }
            };
        }

        for (const target of targets) {
            if (target.currentStats.hp <= 0) continue; 
            if (!target.buffs || !target.buffs.some(b => (template.effects[0]?.dispelPositive ? b.isPositive : !b.isPositive) && b.canDispel !== false)) continue;

            for (const effect of template.effects) {
                if (effect.type === 'dispel') {
                    const dispelledBuffs = BuffSystem.dispelBuffs(
                        target,
                        effect.dispelPositive || false,
                        effect.count || 1
                    );
                    totalDispelCount += dispelledBuffs.length;
                    if (dispelledBuffs.length > 0) {
                        effectsAppliedDetails.push({
                            target: target.name,
                            type: 'dispel',
                            count: dispelledBuffs.length,
                            dispelPositive: effect.dispelPositive || false,
                            dispelled: dispelledBuffs.map(b => b.name)
                        });
                    }
                }
            }
        }

        let message = `${character.name} 使用了【${template.name}】，`;
        if (totalDispelCount === 0) {
            message += `但没有驱散任何效果！`; 
        } else {
            const dispelType = template.effects[0]?.dispelPositive ? '增益' : '负面';
            if (template.targetType === 'self') {
                message += `驱散了自身 ${totalDispelCount} 个${dispelType}效果！`;
            } else if (template.targetType === 'ally') {
                const dispelledTargetName = effectsAppliedDetails.length > 0 ? effectsAppliedDetails[0].target : (targets[0]?.name || '队友');
                message += `驱散了 ${dispelledTargetName} ${totalDispelCount} 个${dispelType}效果！`;
            } else if (template.targetType === 'all_allies') {
                message += `驱散了队伍中 ${totalDispelCount} 个${dispelType}效果！`;
            } else if (template.targetType === 'enemy') {
                message += `驱散了 ${targets[0]?.name || '敌人'} ${totalDispelCount} 个${dispelType}效果！`;
            } else if (template.targetType === 'all_enemies') {
                message += `驱散了敌方 ${totalDispelCount} 个${dispelType}效果！`;
            }
        }

        return {
            success: totalDispelCount > 0 || !hasBuffsToDispelInitially, 
            message,
            effects: {
                type: 'dispel',
                targets: template.targetType,
                totalDispelCount,
                effects: effectsAppliedDetails
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
        console.log(`获取目标，目标类型: ${targetType}`);
        let targets = [];

        switch (targetType) {
            case 'self':
                targets = [character];
                break;
            case 'ally':
                // 选择HP百分比最低的非自身存活队友
                const otherAliveAllies = teamMembers.filter(member => member.id !== character.id && member.currentStats.hp > 0);
                if (otherAliveAllies.length > 0) {
                    otherAliveAllies.sort((a, b) => (a.currentStats.hp / a.currentStats.maxHp) - (b.currentStats.hp / b.currentStats.maxHp));
                    targets = [otherAliveAllies[0]];
                } else {
                    targets = [character]; // 没有其他队友则选自己
                }
                break;
            case 'ally_lowest_hp':
                // 选择生命值最低的队友（包括施法者自身）
                const allAliveMembers = teamMembers.filter(member => member.currentStats.hp > 0);
                if (allAliveMembers.length > 0) {
                    allAliveMembers.sort((a, b) => (a.currentStats.hp / a.currentStats.maxHp) - (b.currentStats.hp / b.currentStats.maxHp));
                    targets = [allAliveMembers[0]];
                }
                break;
            case 'all_allies':
                targets = teamMembers.filter(member => member.currentStats.hp > 0);
                break;
            case 'enemy':
                if (monster && monster.currentStats.hp > 0) {
                    targets = [monster];
                }
                break;
            case 'all_enemies':
                if (monster && monster.currentStats.hp > 0) {
                    targets = [monster]; // 当前只有一个怪物
                }
                break;
            default:
                // 检查是否是特定元素的目标类型
                if (targetType && typeof targetType === 'string') {
                    if (targetType.startsWith('all_allies_')) {
                        const element = targetType.substring('all_allies_'.length);
                        targets = teamMembers.filter(member => member.currentStats.hp > 0 && member.attribute === element);
                        if (targets.length === 0) Battle.logBattle(`技能目标 ${targetType} 未找到符合条件的队友。`);
                    } else if (targetType.startsWith('all_enemies_')) {
                        const element = targetType.substring('all_enemies_'.length);
                        if (monster && monster.currentStats.hp > 0 && monster.attribute === element) {
                            targets = [monster];
                        }
                        if (targets.length === 0) Battle.logBattle(`技能目标 ${targetType} 未找到符合条件的敌人。`);
                    } else {
                        console.log(`未知的目标类型: ${targetType}，返回空数组`);
                    }
                } else {
                    console.log(`未知的目标类型: ${targetType}，返回空数组`);
                }
        }
        // 最后统一过滤一次，确保返回的都是存活且有效的对象
        return targets.filter(t => t && t.currentStats && t.currentStats.hp > 0);
    },


    /**
     * 应用复活效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果 { success: boolean, message?: string, effects?: object }
     * @test Test reviving a dead ally. Expected: success: true, ally revived.
     * @test Test reviving when no allies are dead. Expected: success: true, message indicates no target.
     */
    applyReviveEffects(character, template, teamMembers, monster) {
        let potentialTargets = [];
        switch (template.targetType) {
            case 'ally': 
                potentialTargets = teamMembers.filter(member => member.id !== character.id && member.currentStats.hp <= 0);
                if (potentialTargets.length > 0) potentialTargets = [potentialTargets[0]]; 
                break;
            case 'all_allies':
                potentialTargets = teamMembers.filter(member => member.currentStats.hp <= 0);
                break;
            case 'self': 
                if (character.currentStats.hp <= 0) potentialTargets = [character];
                break;
            default: 
                 potentialTargets = this.getTargets(character, template.targetType, teamMembers, monster)
                                       .filter(t => t.currentStats.hp <=0); 
        }
        
        const effectsAppliedDetails = []; 
        let revivedCount = 0;
        const hasDeadTargetsInitially = potentialTargets.length > 0;

        if (!hasDeadTargetsInitially) {
            return {
                success: true, 
                message: `${character.name} 使用了【${template.name}】，但没有需要复活的目标！`,
                effects: { type: 'revive', targets: template.targetType, revivedCount: 0, effects: [] }
            };
        }

        for (const target of potentialTargets) { 
            if (target.currentStats.hp > 0) continue; 

            for (const effect of template.effects) {
                if (effect.type === 'revive') {
                    const revivePercent = effect.value || 0.3; 
                    const reviveAmount = Math.floor(target.currentStats.maxHp * revivePercent);
                    target.currentStats.hp = reviveAmount;
                    Battle.logBattle(`${target.name} 被复活了，恢复了 ${reviveAmount} HP。`);
                    revivedCount++;
                    effectsAppliedDetails.push({
                        target: target.name,
                        type: 'revive',
                        reviveAmount: reviveAmount,
                        revivePercent: revivePercent
                    });
                }
            }
        }

        let message = `${character.name} 使用了【${template.name}】，`;
        if (revivedCount === 0) {
            message += `但没有复活任何目标！`; 
        } else if (template.targetType === 'ally' && effectsAppliedDetails.length > 0) {
            const revivedTarget = effectsAppliedDetails[0]?.target || '队友';
            const reviveAmount = effectsAppliedDetails[0]?.reviveAmount || 0;
            message += `复活了 ${revivedTarget}，恢复 ${reviveAmount} 点生命值！`;
        } else if (template.targetType === 'all_allies') {
            message += `复活了 ${revivedCount} 名队友！`;
        } else if (revivedCount > 0) { 
             message += `复活了 ${revivedCount} 个目标！`;
        }

        return {
            success: revivedCount > 0, 
            message,
            effects: {
                type: 'revive',
                targets: template.targetType,
                revivedCount,
                effects: effectsAppliedDetails
            }
        };
    }
};
