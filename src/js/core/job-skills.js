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
        // console.log(`[DEBUG] JobSkills.useSkill: CALLED - characterId: ${characterId}, skillId: ${skillId}, teamMembers: ${teamMembers.map(m => m.id + '(' + m.name + ')').join(', ')}, monster: ${monster.id}(${monster.name})`);
        const character = Character.getCharacter(characterId);
        if (!character) return { success: false, message: '角色不存在' };

        // 统一使用 SkillLoader.getSkillInfo 获取技能数据/模板
        // const skill = JobSystem.getSkill(skillId); // Replaced
        // if (!skill) {
        //     console.log(`[DEBUG] JobSkills.useSkill: RETURNING (skill not found) - skillId: ${skillId}`);
        //     return { success: false, message: '技能不存在' };
        // }
        // console.log(`[DEBUG] JobSkills.useSkill: Fetched skill - ID: ${skill.id || skillId}, Name: ${skillDisplayName}`);

        // 获取技能模板 (现在统一为技能数据)
        // const template = JobSkillsTemplate.getTemplate(skillId); // Replaced
        const template = SkillLoader.getSkillInfo(skillId); // Use SkillLoader

        if (!template) {
            // console.log(`[DEBUG] JobSkills.useSkill: RETURNING (template/skillData not found) - skillId: ${skillId}, skillName: ${skill ? skillDisplayName : 'N/A'}`); // skill is no longer defined here
            // console.log(`[DEBUG] JobSkills.useSkill: RETURNING (skillData not found via SkillLoader) - skillId: ${skillId}`);
            // return { success: false, message: `技能 ${skill ? skillDisplayName : skillId} 没有模板定义` };
            return { success: false, message: `技能 ${skillId} 没有定义` };
        }
        // console.log(`[DEBUG] JobSkills.useSkill: Fetched template - ID: ${template.id || 'N/A'}, Name: ${template.name}, EffectType: ${template.effectType}, TargetType: ${template.targetType}`);
        // 使用 template.name 或 skillId 作为备用名
        const skillDisplayName = template.name || skillId;
        // console.log(`[DEBUG] JobSkills.useSkill: Fetched skillData (was template) - ID: ${template.id || skillId}, Name: ${skillDisplayName}, EffectType: ${template.effectType}, TargetType: ${template.targetType}`);

        // 检查技能是否在冷却中
        if (character.skillCooldowns && character.skillCooldowns[skillId] > 0) {
            const returnMsg = `技能 ${skillDisplayName} 还在冷却中，剩余 ${character.skillCooldowns[skillId]} 回合`; // Use skillDisplayName
            // console.log(`[DEBUG] JobSkills.useSkill: RETURNING (skill on cooldown) - ${returnMsg}`);
            return {
                success: false,
                message: returnMsg
            };
        }

        // 检查技能是否有初始冷却
        if (template.initialCooldown && template.initialCooldown > 0) {
            if (!character.skillCooldowns) {
                character.skillCooldowns = {};
            }
            character.skillCooldowns[skillId] = template.initialCooldown;
            const returnMsgInitial = `技能 ${skillDisplayName} 需要 ${template.initialCooldown} 回合后才能使用`; // Use skillDisplayName
            // console.log(`[DEBUG] JobSkills.useSkill: RETURNING (skill on initial cooldown) - ${returnMsgInitial}`);
            return {
                success: false,
                message: returnMsgInitial
            };
        }

        // 根据技能类型处理
        let result;
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
            case 'trigger': // trigger 类型也通过 effects 数组定义其行为
                // console.log(`[DEBUG] JobSkills.useSkill: BEFORE applySkillEffects - character: ${character.id}(${character.name}), template: ${template.id || skillId}(${template.name}), targetType: ${template.targetType}`);
                result = this.applySkillEffects(character, template, teamMembers, monster);
                // console.log(`[DEBUG] JobSkills.useSkill: AFTER applySkillEffects - result:`, JSON.parse(JSON.stringify(result)));
                break;
            default:
                // 对于未明确列出的 effectType，如果它有 effects 数组，也尝试通用处理
                if (template.effects && Array.isArray(template.effects) && template.effects.length > 0) {
                    Battle.logBattle(`技能 ${template.name} 的 effectType "${template.effectType}" 不是标准主动类型，尝试通用效果处理。`);
                    // console.log(`[DEBUG] JobSkills.useSkill (default case): BEFORE applySkillEffects - character: ${character.id}(${character.name}), template: ${template.id || skillId}(${template.name}), targetType: ${template.targetType}`);
                    result = this.applySkillEffects(character, template, teamMembers, monster);
                    // console.log(`[DEBUG] JobSkills.useSkill (default case): AFTER applySkillEffects - result:`, JSON.parse(JSON.stringify(result)));
                } else {
                    // console.log(`[DEBUG] JobSkills.useSkill: RETURNING (unknown skill type or no effects) - success: false, message: 未知的技能类型 (${template.effectType}) 或无效果定义。`);
                    return { success: false, message: `未知的技能类型 (${template.effectType}) 或无效果定义。` };
                }
        }

        // 只有在主技能成功执行且不是被触发的技能时，才设置主技能的冷却
        // 被触发的技能的冷却由其自身定义和 useSkill 调用处理
        if (result && result.success && !template.isTriggeredSkill) {
            if (!character.skillCooldowns) {
                character.skillCooldowns = {};
            }
            // 处理 nextCooldown
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

        // --- 详细技能使用日志 ---
        if (result && result.success && typeof Battle !== 'undefined' && Battle.logBattle && !template.isTriggeredSkill) {
            // console.log(`[DEBUG] JobSkills.useSkill: PREPARING DETAILED LOG - result:`, JSON.parse(JSON.stringify(result)), `template:`, JSON.parse(JSON.stringify(template)));
            try {
                let logParts = [];
                logParts.push(`[技能][回合 ${Battle.currentTurn || 0}]`);
                logParts.push(`${character.name} 使用 [${skillDisplayName}]`); // Use skillDisplayName

                const getTargetObject = (name, char, mon, team) => {
                    if (name === mon.name) return mon;
                    return team.find(m => m.name === name);
                };
                
                const getTargetString = (targetType, resEffects, char, mon, team) => {
                    if (targetType === 'self') return "自身";
                    if (targetType === 'all_allies') return "所有友方";
                    if (targetType === 'all_enemies') return "所有敌人";
                    if (targetType === 'enemy') return mon.name;
                    if (targetType === 'ally') {
                        if (resEffects && resEffects.effects && resEffects.effects.length > 0 && resEffects.effects[0].target) {
                            return resEffects.effects[0].target;
                        }
                        // Attempt to find the first living ally that is not self if target is 'ally' but no specific target in effects
                        const firstAlly = team.find(m => m.id !== char.id && m.currentStats.hp > 0);
                        return firstAlly ? firstAlly.name : "某个友方";
                    }
                    // Fallback for other or complex targetings based on actual affected targets
                    if (resEffects && resEffects.effects && Array.isArray(resEffects.effects) && resEffects.effects.length > 0) {
                        const affectedNames = new Set(resEffects.effects.map(e => e.target).filter(t => t));
                        if (affectedNames.size === 1) return affectedNames.values().next().value;
                        if (affectedNames.size > 1) return Array.from(affectedNames).join(', ');
                    }
                    return "目标";
                };

                let targetStringDisplay = getTargetString(template.targetType, result.effects, character, monster, teamMembers);
                logParts.push(`对 ${targetStringDisplay}`);

                let mainEffectDescription = "";
                let targetHpStrings = new Set(); // Use Set to avoid duplicate HP logs for same target

                if (result.effects) {
                    const resEffects = result.effects; // This is the object like { type: 'damage', totalDamage: X, effects: [...] }

                    if (resEffects.type === 'damage' && resEffects.totalDamage !== undefined) {
                        mainEffectDescription = `造成 ${resEffects.totalDamage} 点 ${template.attribute || '物理'} 伤害。`;
                        if (resEffects.effects && Array.isArray(resEffects.effects)) {
                            resEffects.effects.forEach(de => { // de is { target: name, actualDamage: X }
                                const tObj = getTargetObject(de.target, character, monster, teamMembers);
                                if (tObj && tObj.currentStats && typeof tObj.currentStats.hp !== 'undefined' && typeof tObj.currentStats.maxHp !== 'undefined') {
                                    targetHpStrings.add(`${tObj.name} 剩余HP: ${Math.floor(tObj.currentStats.hp)}/${Math.floor(tObj.currentStats.maxHp)}。`);
                                }
                            });
                        }
                    } else if (resEffects.type === 'heal' && resEffects.totalHealing !== undefined) {
                        mainEffectDescription = `为 ${targetStringDisplay} 恢复了 ${resEffects.totalHealing} 点 HP。`;
                         if (resEffects.effects && Array.isArray(resEffects.effects)) {
                            resEffects.effects.forEach(de => { // de is { target: name, healAmount: X }
                                const tObj = getTargetObject(de.target, character, monster, teamMembers);
                                if (tObj && tObj.currentStats && typeof tObj.currentStats.hp !== 'undefined' && typeof tObj.currentStats.maxHp !== 'undefined') {
                                     targetHpStrings.add(`${tObj.name} 剩余HP: ${Math.floor(tObj.currentStats.hp)}/${Math.floor(tObj.currentStats.maxHp)}。`);
                                }
                            });
                        }
                    } else if (resEffects.type === 'buff' || resEffects.type === 'debuff') {
                        if (resEffects.effects && Array.isArray(resEffects.effects) && resEffects.effects.length > 0) {
                            // For buff/debuff, log the first one as representative for the main description
                            const firstActualEffect = resEffects.effects[0]; // { target: name, type: 'attackUp', name: '攻击提升', duration: X }
                            const effectName = firstActualEffect.name || template.effects.find(te => te.type === firstActualEffect.type)?.name || firstActualEffect.type;
                            const duration = firstActualEffect.duration;
                            mainEffectDescription = `施加了 [${effectName}] 效果${duration ? `(持续${duration}回合)` : ''}。`;
                            
                            resEffects.effects.forEach(eff => {
                                const tObj = getTargetObject(eff.target, character, monster, teamMembers);
                                if (tObj && tObj.currentStats && typeof tObj.currentStats.hp !== 'undefined' && typeof tObj.currentStats.maxHp !== 'undefined') {
                                    targetHpStrings.add(`${tObj.name} 剩余HP: ${Math.floor(tObj.currentStats.hp)}/${Math.floor(tObj.currentStats.maxHp)}。`);
                                }
                            });
                        }
                    } else if (resEffects.type === 'dispel') {
                        if (resEffects.effects && Array.isArray(resEffects.effects) && resEffects.effects.length > 0) {
                            const dispelledDetail = resEffects.effects[0]; // { target: name, count: X, dispelPositive: bool }
                            const dispelledTargetName = dispelledDetail.target || targetStringDisplay;
                            const dispelType = dispelledDetail.dispelPositive ? "增益" : "负面";
                            const count = dispelledDetail.count || resEffects.totalDispelCount;
                            if (count > 0) {
                                mainEffectDescription = `驱散了 ${dispelledTargetName} 的 ${count} 个[${dispelType}]效果。`; // Removed space before [
                            } else {
                                mainEffectDescription = `尝试驱散 ${dispelledTargetName} 的[${dispelType}]效果，但未成功。`;
                            }
                            const tObj = getTargetObject(dispelledTargetName, character, monster, teamMembers);
                            if (tObj && tObj.currentStats && typeof tObj.currentStats.hp !== 'undefined' && typeof tObj.currentStats.maxHp !== 'undefined') {
                                targetHpStrings.add(`${tObj.name} 剩余HP: ${Math.floor(tObj.currentStats.hp)}/${Math.floor(tObj.currentStats.maxHp)}。`);
                            }
                        } else {
                             mainEffectDescription = `对 ${targetStringDisplay} 进行了驱散（无具体效果信息）。`;
                        }
                    } else if (result.message && !mainEffectDescription) {
                        let simpleMsg = result.message.replace(`${character.name} 使用了【${skillDisplayName}】，`, '').trim(); // Use skillDisplayName
                        simpleMsg = simpleMsg.replace(/^为 |^对 /, '').trim(); // Remove "为 " or "对 "
                        if (simpleMsg.startsWith(targetStringDisplay)) {
                             simpleMsg = simpleMsg.substring(targetStringDisplay.length).trim().replace(/^了 |^的 /, '').trim(); // Remove target name and "了 " or "的 "
                        }
                        mainEffectDescription = simpleMsg.charAt(0).toUpperCase() + simpleMsg.slice(1);
                         if (!mainEffectDescription.endsWith('.') && !mainEffectDescription.endsWith('！')) mainEffectDescription += '。';
                    }
                }
                
                if (mainEffectDescription) {
                    logParts.push(mainEffectDescription);
                }

                targetHpStrings.forEach(hpStr => logParts.push(hpStr));
                
                Battle.logBattle(logParts.join(' ').trim());

            } catch (e) {
                console.error("Error generating skill log:", e, "Result object:", JSON.stringify(result));
                Battle.logBattle(`[技能][回合 ${Battle.currentTurn || 0}] ${character.name} 使用了 [${skillDisplayName}]。 (详细日志生成失败)`); // Use skillDisplayName
            }
        }
        // --- End 详细技能使用日志 ---

        const finalReturnObject = {
            success: result && result.success !== undefined ? result.success : false, // Ensure success is explicitly from result or defaults to false
            message: result ? result.message : "技能执行失败或无返回信息。",
            effects: result ? result.effects : {}
        };
        // console.log(`[DEBUG] JobSkills.useSkill: RETURNING - success: ${finalReturnObject.success}, message: ${finalReturnObject.message}, effects:`, JSON.parse(JSON.stringify(finalReturnObject.effects)));
        return finalReturnObject;
    },

    /**
     * 应用触发其他技能的效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板 (包含 triggerSkillId)
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果
     */
    applyTriggerSkillEffect(character, template, teamMembers, monster) {
        const triggeredSkillId = template.triggerSkillId;
        if (!triggeredSkillId) {
            return { success: false, message: `技能 ${template.name} 配置错误：缺少 triggerSkillId` };
        }

        // const triggeredSkillTemplate = JobSkillsTemplate.getTemplate(triggeredSkillId); // Replaced
        const triggeredSkillTemplate = SkillLoader.getSkillInfo(triggeredSkillId); // Use SkillLoader
        if (!triggeredSkillTemplate) {
            // 如果 SkillLoader.getSkillInfo 都找不到，则技能确实不存在
             // console.log(`[DEBUG] applyTriggerSkillEffect: Triggered skill ${triggeredSkillId} not found by SkillLoader.`);
             return { success: false, message: `要触发的技能 ${triggeredSkillId} 不存在或无效果定义` };
        } else {
             Battle.logBattle(`${character.name} 的技能 ${template.name} 触发了职业技能 ${triggeredSkillTemplate.name}!`);
            // 标记为被触发的技能，以避免重复冷却设置
            triggeredSkillTemplate.isTriggeredSkill = true;
            // 对于职业技能，我们可能仍希望通过useSkill来处理，因为它有完整的逻辑
            // 但要注意避免无限递归和冷却问题。
            // 简化：直接应用效果，如果 useSkill 导致问题
            // return this.useSkill(character.id, triggeredSkillId, teamMembers, monster);
            // 修正：直接调用效果应用，避免冷却和重复日志
            return this.applySkillEffects(character, triggeredSkillTemplate, teamMembers, monster);
        }
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
        // console.log(`[DEBUG] JobSkills.applySkillEffects: CALLED - character: ${character.id}(${character.name}), template: ${template.id}(${template.name}), targetType: ${template.targetType}, effects:`, JSON.parse(JSON.stringify(template.effects)));
        let message = "";
        let effectsOutput = {};

        // 确保 template.effects 是一个数组
        if (!Array.isArray(template.effects)) {
            // Battle.logBattle(`技能 ${template.name} 的效果定义不是数组。`);
            // 尝试从 template.effect (单数) 获取
            if (template.effect && typeof template.effect === 'object') {
                template.effects = [template.effect]; //包装成数组
            } else {
                 Battle.logBattle(`技能 ${template.name} 没有有效的效果定义。`);
                return { message: `${character.name} 使用了【${template.name}】，但技能效果配置错误。`, effects: {} };
            }
        }


        // 遍历技能定义中的所有效果
        // 注意：原版 switch(template.effectType) 是基于技能模板只有一个主效果类型。
        // 如果一个技能可以有多种类型的效果（例如一个效果是伤害，另一个是buff），需要迭代处理 template.effects
        
        let combinedResults = { messages: [], effectsApplied: [], success: true }; // 添加 success 标志

        // 首先处理hpCostPercentageCurrent效果
        for (const effectDetail of template.effects) {
            if (effectDetail.type === 'hpCostPercentageCurrent') {
                const costValue = parseFloat(effectDetail.value);
                if (isNaN(costValue) || costValue <= 0) {
                    Battle.logBattle(`技能 ${template.name} 的 hpCostPercentageCurrent 值无效: ${effectDetail.value}`);
                    combinedResults.messages.push(`技能 ${template.name} 的HP消耗配置错误。`);
                    combinedResults.success = false;
                    continue;
                }

                let baseHpForCost = character.currentStats.hp; // 默认基于当前HP
                if (effectDetail.basedOn === 'maxHp') {
                    baseHpForCost = character.currentStats.maxHp;
                }

                const hpToCost = Math.floor(baseHpForCost * (costValue / 100));
                
                if (character.currentStats.hp - hpToCost < 1) {
                    if (character.currentStats.hp > 1) { // 如果当前HP大于1，则至少保留1点HP
                        const actualCost = character.currentStats.hp - 1;
                        character.currentStats.hp = 1;
                        Battle.logBattle(`${character.name} 使用技能 ${template.name} 消耗了 ${actualCost} HP (不足以支付全部, HP降至1)。`);
                        combinedResults.messages.push(`${character.name} 消耗了 ${actualCost} HP (HP降至1)。`);
                    } else { // 如果当前HP已经是1，则无法支付消耗
                        Battle.logBattle(`${character.name} 尝试使用技能 ${template.name}，但HP不足以支付消耗 (当前HP: ${character.currentStats.hp})。`);
                        combinedResults.messages.push(`${character.name} HP不足，无法支付技能 ${template.name} 的消耗。`);
                        combinedResults.success = false; // 标记为失败
                        // return { // 如果HP不足，技能发动失败
                        //     message: combinedResults.messages.join(' \n'),
                        //     effects: combinedResults.effectsApplied.length > 0 ? combinedResults.effectsApplied : {},
                        //     success: false
                        // };
                        continue; // 跳过此效果，可能导致后续效果也不执行
                    }
                } else {
                    character.currentStats.hp -= hpToCost;
                    Battle.logBattle(`${character.name} 使用技能 ${template.name} 消耗了 ${hpToCost} HP。`);
                    combinedResults.messages.push(`${character.name} 消耗了 ${hpToCost} HP。`);
                }
                // 更新UI等（如果需要）
                if (typeof UI !== 'undefined' && UI.updateCharacterStatus) {
                    UI.updateCharacterStatus(character.id);
                }
            }
        }

        // 如果HP消耗导致技能失败，则不执行后续效果
        if (!combinedResults.success) {
            return {
                message: combinedResults.messages.join(' \n'),
                effects: combinedResults.effectsApplied.length > 0 ? combinedResults.effectsApplied : {},
                success: false
            };
        }


        for (const effectDetail of template.effects) {
            let currentEffectResult = { message: "", effects: {}, success: true };
            // effectDetail.type 是子效果的类型, template.effectType 可能是父技能的主类型
            const actualEffectType = effectDetail.type || template.effectType;

            switch (actualEffectType) {
                case 'buff':
                    currentEffectResult = this.applyBuffEffects(character, { ...template, ...effectDetail, effects: [effectDetail] }, teamMembers, monster);
                    break;
                case 'debuff':
                    currentEffectResult = this.applyDebuffEffects(character, { ...template, ...effectDetail, effects: [effectDetail] }, teamMembers, monster);
                    break;
                case 'damage':
                case 'enmity': // 将 enmity 视为一种特殊的 damage 类型进行处理
                    // 查找此技能模板中是否定义了 additionalDamage 和 directDamageBonus
                    let totalAdditionalFixedDamage = 0;
                    let totalDirectDamageBonus = 0;
                    if (Array.isArray(template.effects)) { // template.effects 是原始技能的完整效果列表
                        template.effects.forEach(siblingEffect => {
                            if (siblingEffect.type === 'additionalDamage' && typeof siblingEffect.value === 'number') {
                                totalAdditionalFixedDamage += siblingEffect.value;
                            }
                            if (siblingEffect.type === 'directDamageBonus' && typeof siblingEffect.value === 'number') {
                                totalDirectDamageBonus += siblingEffect.value;
                            }
                        });
                    }
                    // 将追加伤害值和直接伤害奖励传递给 applyDamageEffects
                    currentEffectResult = this.applyDamageEffects(character, { ...template, ...effectDetail, effects: [effectDetail], type: actualEffectType }, teamMembers, monster, totalAdditionalFixedDamage, totalDirectDamageBonus);
                    break;
                case 'heal':
                    currentEffectResult = this.applyHealEffects(character, { ...template, ...effectDetail, effects: [effectDetail] }, teamMembers, monster);
                    break;
                case 'dispel': // Standard dispel
                    currentEffectResult = this.applyDispelEffects(character, { ...template, ...effectDetail, effects: [effectDetail] }, teamMembers, monster);
                    break;
                case 'clearDebuff': // Specific action to clear debuffs
                    currentEffectResult = this.applyDispelEffects(character, { ...template, ...effectDetail, dispelPositive: false, effects: [effectDetail] }, teamMembers, monster);
                    break;
                case 'revive':
                    currentEffectResult = this.applyReviveEffects(character, { ...template, ...effectDetail, effects: [effectDetail] }, teamMembers, monster);
                    break;
                case 'damage_and_debuff': // 这类复合类型可能需要特殊处理或拆分
                    currentEffectResult = this.applyDamageAndDebuffEffects(character, { ...template, ...effectDetail, effects: [effectDetail] }, teamMembers, monster);
                    break;
                case 'damage_and_buff':
                    currentEffectResult = this.applyDamageAndBuffEffects(character, { ...template, ...effectDetail, effects: [effectDetail] }, teamMembers, monster);
                    break;
                case 'triggerSkill': // 旧的触发方式，保留兼容性或移除
                     console.warn(`Deprecated effect type 'triggerSkill' used in skill ${template.name}. Use 'castSkill' instead.`);
                     currentEffectResult = this.applyTriggerSkillEffect(character, { ...template, ...effectDetail }, teamMembers, monster); // Assumes applyTriggerSkillEffect uses triggerSkillId
                     break;
                case 'castSkill': // 新的触发方式
                    if (effectDetail.skillId) {
                        // 调用 applyTriggerSkillEffect 可能更合适，因为它处理了日志和 isTriggeredSkill 标记
                        // 但需要确保它能基于 effectDetail.skillId 工作
                         currentEffectResult = this.applyTriggerSkillEffect(character, { ...template, ...effectDetail, triggerSkillId: effectDetail.skillId }, teamMembers, monster);
                    } else {
                        currentEffectResult = { success: false, message: `技能 ${template.name} 的 castSkill 效果缺少 skillId` };
                    }
                    break;
                case 'applyBuffPackage':
                    // 目标应该是 effectDetail 中指定的 targetType，或者继承 template 的
                    const targetForBuffPkg = this.getTargets(character, effectDetail.targetType || template.targetType, teamMembers, monster)[0]; // 通常buff包是单目标或自身
                    if (targetForBuffPkg) {
                        // BuffSystem.applyBuffPackage(target, buffPackageData, source)
                        // buffPackageData 应该是 effectDetail 本身，它包含了 name, duration, dispellable, buffs 数组等
                        const buffPackageApplied = BuffSystem.applyBuffPackage(targetForBuffPkg, effectDetail, character);
                        currentEffectResult = {
                            success: buffPackageApplied, // applyBuffPackage 应返回boolean
                            message: buffPackageApplied ? `${character.name} 对 ${targetForBuffPkg.name} 施加了效果包 ${effectDetail.buffName || effectDetail.name || '效果包'}` : `施加效果包 ${effectDetail.buffName || effectDetail.name || '效果包'} 失败`,
                            effects: { type: 'buffPackage', appliedTo: targetForBuffPkg.name, packageName: effectDetail.buffName || effectDetail.name }
                        };
                    } else {
                        currentEffectResult = { success: false, message: `技能 ${template.name} 的 applyBuffPackage 效果找不到目标` };
                    }
                    break;
                case 'applyDebuff': // 假设 applyDebuff 也是一个包，或者是一个直接的debuff
                    // 如果 effectDetail.buffs 或 effectDetail.debuffs 存在，则按包处理
                    const debuffsToApply = effectDetail.buffs || effectDetail.debuffs;
                    if (Array.isArray(debuffsToApply)) { // 作为debuff包处理
                        const targetForDebuffPkg = this.getTargets(character, effectDetail.targetType || template.targetType, teamMembers, monster)[0];
                        if (targetForDebuffPkg) {
                             // 假设 BuffSystem 有一个 applyDebuffPackage 或能通过 applyBuffPackage 处理 isDebuff:true 的包
                            const debuffPackageData = { ...effectDetail, isDebuff: true, buffs: debuffsToApply }; // 确保标记为debuff
                            const debuffPackageApplied = BuffSystem.applyBuffPackage(targetForDebuffPkg, debuffPackageData, character);
                             currentEffectResult = {
                                success: debuffPackageApplied,
                                message: debuffPackageApplied ? `${character.name} 对 ${targetForDebuffPkg.name} 施加了DEBUFF包 ${effectDetail.buffName || effectDetail.name || 'DEBUFF包'}` : `施加DEBUFF包 ${effectDetail.buffName || effectDetail.name || 'DEBUFF包'} 失败`,
                                effects: { type: 'debuffPackage', appliedTo: targetForDebuffPkg.name, packageName: effectDetail.buffName || effectDetail.name }
                            };
                        } else {
                             currentEffectResult = { success: false, message: `技能 ${template.name} 的 applyDebuff 包效果找不到目标` };
                        }
                    } else { // 作为单个debuff处理
                        currentEffectResult = this.applyDebuffEffects(character, { ...template, ...effectDetail, effects: [effectDetail] }, teamMembers, monster);
                    }
                    break;
                case 'customBuff': // 假设 applyBuffEffects 能处理 effectDetail 本身作为 buff 定义
                    currentEffectResult = this.applyBuffEffects(character, { ...template, ...effectDetail, effects: [effectDetail] }, teamMembers, monster);
                    break;
                case 'echo': // 假设 echo 是一个标准 buff 类型，由 BuffSystem 处理
                    currentEffectResult = this.applyBuffEffects(character, { ...template, ...effectDetail, effects: [effectDetail] }, teamMembers, monster);
                    break;
                case 'fieldEffect':
                    // TODO: Implement field effect logic
                    console.warn(`Unhandled atomic effect type: fieldEffect in skill ${template.name}`);
                    Battle.logBattle(`技能 ${template.name} 尝试应用未实现的场地效果。`);
                    currentEffectResult = { success: true, message: `应用了场地效果（待实现）`, effects: {} }; // 暂时标记为成功
                    break;
                case 'additionalDamage': // Handled by 'damage'/'enmity' case
                    console.log(`Atomic effect 'additionalDamage' for skill ${template.name} will be handled by its corresponding damage/enmity effect.`);
                    currentEffectResult = { success: true, message: `追加伤害效果已记录。`, effects: {} };
                    break;
                case 'directDamageBonus': // Handled by 'damage'/'enmity' case
                    console.log(`Atomic effect 'directDamageBonus' for skill ${template.name} will be handled by its corresponding damage/enmity effect.`);
                    currentEffectResult = { success: true, message: `直接伤害奖励已记录。`, effects: {} };
                    break;
                case 'hpCostPercentageCurrent': // 此效果已在循环前处理，这里跳过
                    continue; // 使用 continue 跳过当前循环迭代
                // Proc效果内的 additionalEffects 数组和 maxStacks
                case 'proc':
                    // proc 效果通常在攻击时由 battle.js 处理，这里可能是主动技能直接触发一个proc定义
                    // Battle.logBattle(`技能 ${template.name} 包含一个 proc 定义，通常由攻击触发。`);
                    // 如果proc定义中有 additionalEffects，需要在这里处理
                    if (effectDetail.additionalEffects && Array.isArray(effectDetail.additionalEffects)) {
                        for (const additionalEffect of effectDetail.additionalEffects) {
                            const tempSubTemplate = { ...template, ...additionalEffect, effects: [additionalEffect], name: `${template.name} (附加效果)` };
                            const subEffectResult = this.applySkillEffects(character, tempSubTemplate, teamMembers, monster); // 递归调用
                            if (subEffectResult.message) combinedResults.messages.push(subEffectResult.message);
                            if (subEffectResult.effects) combinedResults.effectsApplied.push(subEffectResult.effects);
                            if (subEffectResult.success === false) combinedResults.success = false; // 如果子效果失败，则整体失败
                        }
                    }
                    // maxStacks for buffs applied by proc would be handled by BuffSystem
                    currentEffectResult.message = `${character.name} 的技能 ${template.name} 包含proc定义。`;
                    break;
                default:
                    currentEffectResult = {
                        message: `${character.name} 使用了【${template.name}】中的未知效果类型: ${actualEffectType}。该效果被跳过。`,
                        effects: {},
                        // 设置为 true，使得此未知类型不会将整个 multi_effect 标记为失败，
                        // 除非没有其他成功的已知效果。combinedResults.success 的最终状态
                        // 将取决于是否有任何已知效果成功应用。
                        success: true
                    };
            }
            if (currentEffectResult && currentEffectResult.message) combinedResults.messages.push(currentEffectResult.message);
            if (currentEffectResult && currentEffectResult.effects) combinedResults.effectsApplied.push(currentEffectResult.effects);
            if (currentEffectResult && currentEffectResult.success === false) combinedResults.success = false; // 标记整体结果为失败
        }

        const applyEffectsReturnObject = {
            message: combinedResults.messages.join(' \n') || `${character.name} 使用了【${template.name}】。`,
            effects: combinedResults.effectsApplied.length > 0 ? combinedResults.effectsApplied : {},
            success: combinedResults.success // 返回最终的成功状态
        };
        // console.log(`[DEBUG] JobSkills.applySkillEffects: RETURNING - applyEffectsReturnObject:`, JSON.parse(JSON.stringify(applyEffectsReturnObject)));
        return applyEffectsReturnObject;
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
                    name: buff.name, // Add buff name for logging
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
                // Add other buff types as needed
                default:
                    desc = `${effect.name || effect.type || '未知BUFF'}效果`; // Fallback description
            }
            if (desc) {
                const durationText = (effect.duration || template.duration) ? `(持续${effect.duration || template.duration}回合)` : '';
                effectDescriptions.push(`${desc}${durationText}`);
            }
        } // End of for (const effect of template.effects)

        if (effectDescriptions.length > 0) {
            message += effectDescriptions.join('，') + '！';
        } else if (targets.length > 0 && template.effects && template.effects.length > 0) {
            // If there were targets and effects defined, but no descriptions were generated (e.g. all unknown effect types)
            message += `施加了 ${template.effects.length} 个效果。`;
        } else if (targets.length > 0) {
            message += '但未产生具体效果。';
        } else {
            message += '但没有有效目标。';
        }

        return {
            success: true,
            message: message,
            effects: {
                type: 'buff',
                targetType: template.targetType,
                effects: effects
            }
        };
    }, // This comma is for the JobSkills object, applyBuffEffects function definition ends with the brace above.

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
                    name: debuff.name, // Add debuff name for logging
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
                    desc = `防御力降低${effect.value}%`;
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
     * @returns {object} 包含伤害值和相关信息的对象
     */
    applyDamageToTarget(source, target, rawDamage, options = {}) {
        if (!target) return { damage: 0, isCritical: false, attributeBonus: 0 };

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

        // 检查攻击者是否有命中率降低debuff
        if (source.buffs && !options.ignoreHitRate) {
            const missRateBuffs = source.buffs.filter(buff => buff.type === 'missRate');
            let totalMissRate = 0;

            for (const buff of missRateBuffs) {
                totalMissRate += buff.value;
                console.log(`攻击者有命中率降低debuff: ${buff.name}, 降低值: ${(buff.value * 100).toFixed(1)}%`);
                if (typeof window !== 'undefined' && window.log) {
                    window.log(`攻击者有命中率降低debuff: ${buff.name}, 降低值: ${(buff.value * 100).toFixed(1)}%`);
                }
            }

            // 如果有命中率降低效果，进行命中判定
            if (totalMissRate > 0) {
                const hitRoll = Math.random();
                console.log(`命中判定: 随机值 ${hitRoll.toFixed(4)} vs 未命中率 ${totalMissRate.toFixed(4)}`);
                if (typeof window !== 'undefined' && window.log) {
                    window.log(`命中判定: 随机值 ${hitRoll.toFixed(4)} vs 未命中率 ${totalMissRate.toFixed(4)}`);
                }

                if (hitRoll < totalMissRate) {
                    // 攻击未命中
                    console.log(`攻击未命中！`);
                    if (typeof window !== 'undefined' && window.log) {
                        window.log(`攻击未命中！`);
                        window.log(`===== 伤害计算结束 =====`);
                    }
                    return { damage: 0, isCritical: false, attributeBonus: 0, missed: true };
                } else {
                    console.log(`攻击命中！`);
                    if (typeof window !== 'undefined' && window.log) {
                        window.log(`攻击命中！`);
                    }
                }
            }
        }

        // 原始伤害是"造成伤害"
        let finalDamage = rawDamage;
        let isCritical = false;
        let attributeBonus = 0;
        const sourceOriginalAttribute = source.attribute; // 保存原始攻击属性

        // 0. 如果攻击者有元素转换，先转换攻击属性 (这通常不常见，常见的是受到的伤害被转换)
        // let effectiveAttackAttribute = sourceOriginalAttribute;
        // const attackConversionBuff = source.buffs?.find(b => b.type === 'elementConversionAttack' && !b.isSubBuff);
        // if (attackConversionBuff && attackConversionBuff.convertToElement) {
        //     effectiveAttackAttribute = attackConversionBuff.convertToElement;
        //     this.logBattle(`${source.name}的攻击属性临时转为 ${effectiveAttackAttribute}`);
        // }

        // 1. 应用 EX 攻击提升 (独立乘区)
        let exAttackMultiplier = 1.0;
        if (source.buffs) {
            const exAttackBuffs = source.buffs.filter(b => b.type === 'exAttackUp' && !b.isSubBuff);
            exAttackBuffs.forEach(buff => {
                exAttackMultiplier *= (1 + buff.value); // buff.value是百分比, e.g., 0.1 for 10%
            });
        }
        if (exAttackMultiplier > 1.0) {
            finalDamage *= exAttackMultiplier;
            Battle.logBattle(`${source.name} 的EX攻击提升 ${((exAttackMultiplier - 1) * 100).toFixed(0)}%, 伤害变为: ${finalDamage.toFixed(0)}`);
        }
        
        // 2. 应用 背水/浑身 (staminaUp) 效果
        let staminaMultiplier = 1.0;
        if (source.buffs) {
            const staminaBuffs = source.buffs.filter(b => b.type === 'staminaUp' && !b.isSubBuff);
            staminaBuffs.forEach(buff => {
                const hpPercent = source.currentStats.hp / source.currentStats.maxHp;
                // 假设buff.details包含 { type: 'enmity'/'stamina', minBonus: 0.1, maxBonus: 0.9, lowHpThreshold:0.25, highHpThreshold:0.75 }
                // 或者 buff.value 是一个更简单的结构或直接是乘数（如果效果不依赖HP）
                if (buff.details) {
                    const { staminaType, maxBonus = 0, minBonus = 0, lowHpThreshold = 0.25, highHpThreshold = 0.75 } = buff.details;
                    if (staminaType === 'enmity') { // 背水：HP越低，加成越高
                        if (hpPercent <= lowHpThreshold) staminaMultiplier *= (1 + maxBonus);
                        else if (hpPercent < 1) staminaMultiplier *= (1 + minBonus + (maxBonus - minBonus) * (1 - (hpPercent - lowHpThreshold) / (1 - lowHpThreshold)) );
                        else staminaMultiplier *= (1 + minBonus); // 满血时最小加成
                    } else if (staminaType === 'stamina') { // 浑身：HP越高，加成越高
                        if (hpPercent >= highHpThreshold) staminaMultiplier *= (1 + maxBonus);
                        else if (hpPercent > 0) staminaMultiplier *= (1 + minBonus + (maxBonus - minBonus) * (hpPercent / highHpThreshold) );
                        else staminaMultiplier *= (1 + minBonus); // 空血时最小加成
                    }
                } else if (typeof buff.value === 'number') { // 兼容简单乘数
                    staminaMultiplier *= (1 + buff.value);
                }
            });
        }
        if (staminaMultiplier > 1.001) { // 避免浮点数误差显示1.0的情况
            finalDamage *= staminaMultiplier;
            Battle.logBattle(`${source.name} 的背水/浑身效果 ${((staminaMultiplier - 1) * 100).toFixed(0)}%, 伤害变为: ${finalDamage.toFixed(0)}`);
        }

        // 记录是否跳过暴击计算
        if (options.skipCritical) {
            // Battle.logBattle(`跳过暴击计算（技能伤害）`);
        } else {
            const critRate = source.currentStats?.critRate || 0.05;
            const critDamageMultiplier = source.currentStats?.critDamage || 1.5;
            if (Math.random() < critRate) {
                isCritical = true;
                finalDamage *= critDamageMultiplier;
                Battle.logBattle(`${source.name} 触发暴击！伤害x${critDamageMultiplier.toFixed(2)}`);
            }
        }

        if (!options.randomApplied) {
            const randomFactor = 0.95 + (Math.random() * 0.1);
            finalDamage *= randomFactor;
        }

        // 检查目标的debuff效果 (防御下降)
        let targetEffectiveDefense = target.currentStats.defense || 0; // 这是防御值，不是减伤比例
        if (target.buffs) {
            const defenseDownBuffs = target.buffs.filter(buff => buff.type === 'defenseDown' && !buff.isSubBuff);
            let totalDefenseReductionPercent = 0;
            defenseDownBuffs.forEach(buff => {
                totalDefenseReductionPercent += buff.value; // e.g., 0.2 for 20% defense down
            });
            totalDefenseReductionPercent = Math.min(totalDefenseReductionPercent, 0.5); // 防御下降上限50%
            if (totalDefenseReductionPercent > 0) {
                 Battle.logBattle(`${target.name} 防御力降低了 ${(totalDefenseReductionPercent * 100).toFixed(0)}%`);
                targetEffectiveDefense *= (1 - totalDefenseReductionPercent);
            }
        }
        
        // 元素伤害转换 (在属性克制计算前)
        let actualDamageElement = sourceOriginalAttribute; // 伤害计算用的实际元素
        let finalDamageDisplayElement = sourceOriginalAttribute; // 最终显示给用户的伤害元素
        const conversionBuff = target.buffs?.find(b => b.type === 'elementConversion' && !b.isSubBuff);
        if (conversionBuff && conversionBuff.convertToElement && options.originalDamageType) {
            // options.originalDamageType 应该是攻击方原始的攻击属性
            // 转换的是“受到伤害的属性”
            // 这意味着，如果受到火属性攻击，但有转水buff，那么计算克制时，目标视为受到水属性攻击
            // 但攻击方仍然是火属性攻击。
            // 这里的逻辑需要调整：转换的是目标“受到”的伤害属性，而不是攻击方的攻击属性。
            // 因此，属性克制判断时，source.attribute 仍是其原始属性，
            // target "被视为" 受到 conversionBuff.convertToElement 属性的攻击。
            // 为了简化，我们先假设转换会改变最终伤害的标签，实际克制计算仍用原始。
            // 正确的实现是：属性克制判断时，用 conversionBuff.convertToElement 作为 target 的“临时被攻击属性”
            finalDamageDisplayElement = conversionBuff.convertToElement;
            Battle.logBattle(`${target.name} 受到的 ${options.originalDamageType || sourceOriginalAttribute} 伤害将被视为 ${finalDamageDisplayElement} 属性伤害。`);
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

            const oldDamageWithAttrs = finalDamage;
            // 属性克制判断：攻击方属性 vs (目标被转换后的受击属性 或 目标原始属性)
            let targetElementForResistanceCheck = target.attribute;
            if (conversionBuff && conversionBuff.convertToElement) {
                targetElementForResistanceCheck = conversionBuff.convertToElement;
            }

            if (attributes[sourceOriginalAttribute] && attributes[sourceOriginalAttribute].strengths &&
                attributes[sourceOriginalAttribute].strengths.includes(targetElementForResistanceCheck)) {
                attributeBonus = 0.5; // 有利属性
            } else if (attributes[targetElementForResistanceCheck] && attributes[targetElementForResistanceCheck].strengths &&
                       attributes[targetElementForResistanceCheck].strengths.includes(sourceOriginalAttribute)) {
                attributeBonus = -0.25; // 不利属性
            }

            if (attributeBonus !== 0) {
                finalDamage *= (1 + attributeBonus);
                Battle.logBattle(`属性克制 (${sourceOriginalAttribute} vs ${targetElementForResistanceCheck}): ${attributeBonus > 0 ? '+' : ''}${(attributeBonus * 100).toFixed(0)}%, 伤害变为: ${finalDamage.toFixed(0)}`);
            }
        }
        
        // 应用目标防御减伤
        // targetEffectiveDefense 已经考虑了 defenseDown buff 的影响
        // 假设 targetEffectiveDefense 是一个防御“值” (例如 0 到 几百)
        // 防御公式示例: DamageMultiplier = 1 / (1 + DefenseValue / ScalingFactor)
        // ScalingFactor 可以根据游戏平衡调整，例如 200, 500, 1000
        const defenseScalingFactor = 500; // 可调整的防御系数
        const defenseDamageMultiplier = 1 / (1 + Math.max(0, targetEffectiveDefense) / defenseScalingFactor);
        
        if (defenseDamageMultiplier < 1.0) {
            const oldDmg = finalDamage;
            finalDamage *= defenseDamageMultiplier;
            Battle.logBattle(`${target.name} 的防御效果 (乘数 ${defenseDamageMultiplier.toFixed(3)}), 伤害变为: ${finalDamage.toFixed(0)}`);
        }

        // 考虑目标的伤害减免BUFF (damageReduction)
        if (target.buffs) {
            const damageReductionBuffs = target.buffs.filter(buff => buff.type === 'damageReduction' && !buff.isSubBuff);
            let totalDamageReductionPercent = 0;
            damageReductionBuffs.forEach(buff => {
                totalDamageReductionPercent += buff.value; // buff.value是减伤百分比 (0.1 for 10%)
            });
            totalDamageReductionPercent = Math.min(totalDamageReductionPercent, 0.8); // 上限80%

            if (totalDamageReductionPercent > 0) {
                const oldDmg = finalDamage;
                finalDamage *= (1 - totalDamageReductionPercent);
                Battle.logBattle(`${target.name} 的伤害减免BUFF生效 (-${(totalDamageReductionPercent * 100).toFixed(0)}%), 伤害变为: ${finalDamage.toFixed(0)}`);
            }
        }
        
        // DoT易伤 (dot_vulnerability) - 如果当前伤害是DoT类型 (通过options传入)
        if (options.isDoTDamage && target.buffs) {
            const dotVulnerabilityBuffs = target.buffs.filter(b => b.type === 'dot_vulnerability' && !b.isSubBuff);
            let totalVulnerabilityIncrease = 0;
            dotVulnerabilityBuffs.forEach(buff => {
                totalVulnerabilityIncrease += buff.value; // e.g., 0.2 for 20% more DoT damage
            });
            if (totalVulnerabilityIncrease > 0) {
                const oldDmg = finalDamage;
                finalDamage *= (1 + totalVulnerabilityIncrease);
                Battle.logBattle(`${target.name} 受到DoT易伤效果 (+${(totalVulnerabilityIncrease*100).toFixed(0)}%), DoT伤害变为: ${finalDamage.toFixed(0)}`);
            }
        }

        // 最终伤害取整
        finalDamage = Math.max(1, Math.floor(finalDamage));

        // 更新目标HP
        // target.currentStats.hp = Math.max(0, target.currentStats.hp - finalDamage); // HP扣减移至 applyDamageEffects
        // Battle.logBattle(`${source.name} 对 ${target.name} 造成 ${finalDamage} 点 ${finalDamageDisplayElement} 伤害。 ${target.name} 剩余HP: ${target.currentStats.hp}/${target.currentStats.maxHp}`); // 日志移至 applyDamageEffects

        // 更新伤害统计
        if (source.stats) {
            source.stats.totalDamage = (source.stats.totalDamage || 0) + finalDamage;
        }
        if (isCritical && source.stats) {
            source.stats.critCount = (source.stats.critCount || 0) + 1;
        }

        return {
            damage: finalDamage,
            isCritical: isCritical,
            attributeBonus: attributeBonus,
            finalDamageElement: finalDamageDisplayElement // 返回最终伤害的元素类型
        };
    },

    /**
        }


        // 考虑目标的伤害减免BUFF (damageReduction)
        if (target.buffs) {
            const damageReductionBuffs = target.buffs.filter(buff => buff.type === 'damageReduction' && !buff.isSubBuff);
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
        // 如果是技能伤害（通过options.skipCritical判断），使用更高的上限
        if (options.skipCritical) {
            finalDamage = Math.min(finalDamage, 799999); // 技能伤害上限
        } else {
            finalDamage = Math.min(finalDamage, 199999); // 普通攻击伤害上限
        }
        if (beforeCap > finalDamage) {
            console.log(`伤害超过上限: ${beforeCap.toFixed(2)} → ${finalDamage}`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`伤害超过上限: ${beforeCap.toFixed(2)} → ${finalDamage}`);
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

        // 返回包含伤害值和相关信息的对象
        return {
            damage: finalDamage,
            isCritical,
            attributeBonus
        };
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
        let totalDamageAppliedToAllTargets = 0; // 声明变量以跟踪对所有目标造成的总伤害

        // 应用每个伤害效果
        for (const target of targets) {
            for (const effect of template.effects) {
                if (effect.type === 'damage') { // multi_attack has been consolidated into damage with a count property
                    // 计算伤害
                    let damageMultiplier = effect.multiplier || 1.0;
                    let attackCount = effect.count || 1;

                    // 如果有最小和最大倍率，随机生成倍率
                    if (effect.minMultiplier && effect.maxMultiplier) {
                        damageMultiplier = effect.minMultiplier + Math.random() * (effect.maxMultiplier - effect.minMultiplier);
                    }

                    // 应用 character 身上的 skillDamageUp buff 来调整当前 effect 的伤害倍率
                    if (character.buffs) {
                        character.buffs.forEach(buff => {
                            if (buff.type === 'skillDamageUp' && buff.duration > 0 && typeof buff.value === 'number') {
                                damageMultiplier += buff.value; // 直接加到倍率上
                            }
                        });
                    }

                    // 计算每次攻击的伤害
                    for (let i = 0; i < attackCount; i++) {
                        // 检查目标是否已被击败
                        if (target.currentStats.hp <= 0) break;

                        // 计算原始伤害 (使用调整后的倍率)
                        const attackerEffectiveAttack = Character.calculateAttackPower(character);
                        const rawDamage = Math.floor(attackerEffectiveAttack * damageMultiplier);
                        // 新增日志: 记录技能伤害计算的中间值
                        if (typeof Battle !== 'undefined' && Battle.logBattle) {
                            Battle.logBattle(`[调试] 技能 [${template.name}] 对 ${target.name}: ${character.name} 攻击力 ${attackerEffectiveAttack}, 伤害倍率 ${damageMultiplier.toFixed(2)}, 计算原始伤害 ${rawDamage}`);
                        }

                        // 应用伤害到目标，考虑BUFF和DEBUFF
                        const damageOptions = {
                            element: effect.element || template.attribute,
                            isFixedDamage: effect.fixedDamageValue !== undefined,
                            fixedDamageValue: effect.fixedDamageValue,
                            skillName: template.name,
                            ignoreDefense: effect.ignoreDefense || false,
                            hits: 1, // applyDamageToTarget is called per hit in the loop, so this is 1 for this call
                            skipCritical: template.skipCritical !== undefined ? template.skipCritical : (effect.skipCritical !== undefined ? effect.skipCritical : true)
                        };
                        // 直接调用 Battle.applyDamageToTarget (原始版本，假设 battle-system-integration.js 的修改后续处理)
                        // 注意：Battle.applyDamageToTarget 只计算伤害，不直接扣血。扣血仍在此处处理。
                        const actualDamageResult = Battle.applyDamageToTarget(character, target, rawDamage, damageOptions);
                        
                        let damageToApply = 0;
                        if (actualDamageResult && typeof actualDamageResult.damage === 'number') {
                            damageToApply = actualDamageResult.damage;
                        } else {
                            console.error("Battle.applyDamageToTarget did not return a valid damage result:", actualDamageResult);
                        }

                        // 记录旧HP值
                        const oldHp = target.currentStats.hp;

                        // 实际应用伤害到目标HP
                        target.currentStats.hp = Math.max(0, target.currentStats.hp - damageToApply);

                        // 检查 Guts (不死身) 效果
                        if (target.currentStats.hp <= 0) {
                            const gutsBuff = BuffSystem.getBuffsByType(target, 'guts').find(b => b.duration > 0 && (b.currentStacks || 0) > 0);
                            if (gutsBuff) {
                                target.currentStats.hp = 1; // 以1HP存活
                                Battle.logBattle(`${target.name} 因 [${gutsBuff.name}] 效果以1HP存活！`);
                                // 消耗 Guts buff
                                gutsBuff.currentStacks = (gutsBuff.currentStacks || 1) - 1;
                                if (gutsBuff.currentStacks <= 0) {
                                    BuffSystem.removeBuff(target, gutsBuff.id);
                                    Battle.logBattle(`[${gutsBuff.name}] 效果已消耗完毕。`);
                                }
                                // 可能需要阻止后续的“死亡”逻辑，如果伤害计算后立即有死亡判定的话
                            }
                        }

                        // 记录HP变化及最终伤害日志
                        if (typeof Battle !== 'undefined' && Battle.logBattle) {
                            Battle.logBattle(`${character.name} 对 ${target.name} 造成 ${damageToApply} 点伤害。 ${target.name} 剩余HP: ${target.currentStats.hp}/${target.currentStats.maxHp}`);
                        } else { // Fallback to console if Battle.logBattle is not available
                            console.log(`${character.name} 对 ${target.name} 造成 ${damageToApply} 点伤害。 ${target.name} HP: ${Math.floor(oldHp)} -> ${Math.floor(target.currentStats.hp)} (-${damageToApply})`);
                            if (typeof window !== 'undefined' && window.log) {
                                window.log(`${character.name} 对 ${target.name} 造成 ${damageToApply} 点伤害。 ${target.name} HP: ${Math.floor(oldHp)} -> ${Math.floor(target.currentStats.hp)} (-${damageToApply})`);
                            }
                        }

                        // 更新伤害统计
                        if (character.stats) { // 确保 character.stats 存在
                           character.stats.totalDamage = (character.stats.totalDamage || 0) + damageToApply;
                           if(actualDamageResult && actualDamageResult.isCritical) {
                               character.stats.critCount = (character.stats.critCount || 0) + 1;
                           }
                        }
                        totalDamageAppliedToAllTargets += damageToApply; // 使用正确的累加变量

                        effects.push({
                            target: target.name,
                            type: effect.type, // Should be 'damage' or 'enmity'
                            rawDamage, // Raw damage for this hit
                            actualDamage: damageToApply, // Actual damage for this hit
                            isCritical: actualDamageResult ? actualDamageResult.isCritical : false,
                            multiplier: damageMultiplier.toFixed(2) // Multiplier used for this hit (after skillDamageUp)
                        });
                    }
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
            effects: { // This should be the top-level effect type from the skill template
                type: template.type, // e.g., 'damage', 'enmity' from the effectDetail passed in
                totalDamage: Math.floor(totalDamageAppliedToAllTargets),
                details: effects // Array of individual damage applications
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
        // 获取目标
        const targets = this.getTargets(character, template.targetType, teamMembers, monster);
        const effects = [];
        let totalHealing = 0;

        // 输出调试信息
        console.log(`治疗技能目标类型: ${template.targetType}`);
        console.log(`施法者: ${character.name}, HP: ${character.currentStats.hp}/${character.currentStats.maxHp}`);

        // 如果是自身治疗，直接检查施法者是否需要治疗
        if (template.targetType === 'self') {
            if (character.currentStats.hp >= character.currentStats.maxHp) {
                return {
                    message: `${character.name} 使用了【${template.name}】，但自身已经是满血状态！`,
                    effects: {
                        type: 'heal',
                        targets: template.targetType,
                        totalHealing: 0,
                        effects: []
                    }
                };
            }
        } else {
            // 对于其他目标类型，检查是否有需要治疗的目标
            const needsHealing = targets.some(target =>
                target.currentStats.hp > 0 && target.currentStats.hp < target.currentStats.maxHp
            );

            // 输出目标状态
            targets.forEach(target => {
                console.log(`目标: ${target.name}, HP: ${target.currentStats.hp}/${target.currentStats.maxHp}`);
            });

            // 如果没有需要治疗的目标，返回相应消息
            if (!needsHealing) {
                return {
                    message: `${character.name} 使用了【${template.name}】，但所有目标都是满血状态！`,
                    effects: {
                        type: 'heal',
                        targets: template.targetType,
                        totalHealing: 0,
                        effects: []
                    }
                };
            }
        }

        // 应用每个治疗效果
        for (const target of targets) {
            if (target.currentStats.hp <= 0) {
                console.log(`跳过目标 ${target.name} (已倒下)`);
                continue; // 跳过已倒下的目标
            }
            if (target.currentStats.hp >= target.currentStats.maxHp) {
                console.log(`跳过目标 ${target.name} (满血)`);
                continue; // 跳过满血的目标
            }

            for (const effect of template.effects) {
                if (effect.type === 'heal') {
                    // 计算治疗量
                    const healAmount = effect.value || 0;
                    console.log(`对 ${target.name} 应用治疗效果，治疗量: ${healAmount}`);

                    // 记录旧血量
                    const oldHp = target.currentStats.hp;

                    // 应用治疗
                    target.currentStats.hp = Math.min(target.currentStats.maxHp, target.currentStats.hp + healAmount);

                    // 计算实际治疗量
                    const actualHeal = target.currentStats.hp - oldHp;
                    console.log(`${target.name} 实际恢复: ${actualHeal}, 新HP: ${target.currentStats.hp}/${target.currentStats.maxHp}`);

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

        // 检查目标是否有需要驱散的BUFF
        const hasBuffsToDispel = targets.some(target => {
            if (target.currentStats.hp <= 0) return false; // 跳过已倒下的目标
            return target.buffs && target.buffs.length > 0;
        });

        // 如果没有需要驱散的BUFF，返回相应消息
        if (!hasBuffsToDispel) {
            return {
                message: `${character.name} 使用了【${template.name}】，但目标没有可驱散的效果！`,
                effects: {
                    type: 'dispel',
                    targets: template.targetType,
                    totalDispelCount: 0,
                    effects: []
                }
            };
        }

        // 应用每个驱散效果
        for (const target of targets) {
            if (target.currentStats.hp <= 0) continue; // 跳过已倒下的目标
            if (!target.buffs || target.buffs.length === 0) continue; // 跳过没有BUFF的目标

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

        if (totalDispelCount === 0) {
            message += `但没有驱散任何效果！`;
            return {
                message,
                effects: {
                    type: 'dispel',
                    targets: template.targetType,
                    totalDispelCount: 0,
                    effects: []
                }
            };
        }

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
                        const rawDamage = Math.floor(Character.calculateAttackPower(character) * damageMultiplier);

                        // 应用伤害到目标，考虑BUFF和DEBUFF
                        const actualDamage = this.applyDamageToTarget(character, target, rawDamage, { 
                            randomApplied: false,
                            skipStats: false,
                            skipCritical: true
                        });

                        // 记录旧HP值
                        const oldHp = target.currentStats.hp;

                        // 检查HP是否为NaN
                        if (isNaN(oldHp) || oldHp === undefined) {
                            console.error("目标HP为NaN或undefined，尝试修复");
                            target.currentStats.hp = target.currentStats.maxHp || 10000;
                            if (isNaN(target.currentStats.hp)) {
                                target.currentStats.hp = 10000;
                                target.currentStats.maxHp = 10000;
                            }
                        }

                        // 确保伤害是有效数字
                        let damage = actualDamage.damage;
                        if (isNaN(damage) || damage === undefined) {
                            console.error("伤害值为NaN或undefined，设置为0");
                            damage = 0;
                        }

                        // 实际应用伤害到目标HP
                        target.currentStats.hp = Math.max(0, target.currentStats.hp - damage);

                        // 记录HP变化
                        console.log(`${target.name} HP: ${Math.floor(oldHp)} -> ${Math.floor(target.currentStats.hp)} (-${damage})`);
                        if (typeof window !== 'undefined' && window.log) {
                            window.log(`${target.name} HP: ${Math.floor(oldHp)} -> ${Math.floor(target.currentStats.hp)} (-${damage})`);
                        }

                        // 更新伤害统计
                        character.stats.totalDamage += actualDamage.damage;
                        totalDamage += actualDamage.damage;
                        attackDamage += actualDamage.damage;
                    }

                    effects.push({
                        target: target.name,
                        type: 'multi_attack',
                        attackCount,
                        damageMultiplier,
                        attackDamage
                    });
                } else if (effect.type === 'damage') {
                    // 普通伤害
                    const rawDamage = Math.floor(Character.calculateAttackPower(character) * (effect.multiplier || 1.0));
                    const actualDamage = this.applyDamageToTarget(character, target, rawDamage, {
                        randomApplied: false,
                        skipStats: false,
                        skipCritical: true
                    });

                    // 记录旧HP值
                    const oldHp = target.currentStats.hp;

                    // 确保伤害是有效数字
                    let damage = actualDamage.damage;
                    if (isNaN(damage) || damage === undefined) {
                        console.error("伤害值为NaN或undefined，设置为0");
                        damage = 0;
                    }

                    // 实际应用伤害到目标HP
                    target.currentStats.hp = Math.max(0, target.currentStats.hp - damage);

                    // 记录HP变化
                    console.log(`${target.name} HP: ${Math.floor(oldHp)} -> ${Math.floor(target.currentStats.hp)} (-${damage})`);
                    if (typeof window !== 'undefined' && window.log) {
                        window.log(`${target.name} HP: ${Math.floor(oldHp)} -> ${Math.floor(target.currentStats.hp)} (-${damage})`);
                    }

                    // 更新伤害统计
                    character.stats.totalDamage += actualDamage.damage;
                    totalDamage += actualDamage.damage;

                    effects.push({
                        target: target.name,
                        type: 'damage',
                        damage: actualDamage.damage
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
                        desc = `防御力降低${effect.value}%`;
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
    },

    /**
     * 应用复活效果
     * @param {object} character - 角色对象
     * @param {object} template - 技能模板
     * @param {array} teamMembers - 队伍成员
     * @param {object} monster - 怪物对象
     * @returns {object} 技能效果结果
     */
    applyReviveEffects(character, template, teamMembers, monster) {
        const targets = this.getTargets(character, template.targetType, teamMembers, monster);
        const effects = [];
        let revivedCount = 0;

        // 检查是否有已阵亡的目标
        const hasDeadTargets = targets.some(target => target.currentStats.hp <= 0);

        // 如果没有已阵亡的目标，返回相应消息
        if (!hasDeadTargets) {
            return {
                message: `${character.name} 使用了【${template.name}】，但没有需要复活的目标！`,
                effects: {
                    type: 'revive',
                    targets: template.targetType,
                    revivedCount: 0,
                    effects: []
                }
            };
        }

        // 应用每个复活效果
        for (const target of targets) {
            if (target.currentStats.hp > 0) continue; // 跳过存活的目标

            for (const effect of template.effects) {
                if (effect.type === 'revive') {
                    // 计算复活后的HP百分比
                    const revivePercent = effect.value || 0.3; // 默认复活后HP为30%

                    // 应用复活
                    const reviveAmount = Math.floor(target.currentStats.maxHp * revivePercent);
                    target.currentStats.hp = reviveAmount;

                    revivedCount++;

                    effects.push({
                        target: target.name,
                        type: 'revive',
                        reviveAmount: reviveAmount,
                        revivePercent: revivePercent
                    });
                }
            }
        }

        // 生成消息
        let message = `${character.name} 使用了【${template.name}】，`;

        if (revivedCount === 0) {
            message += `但没有复活任何目标！`;
        } else if (template.targetType === 'ally') {
            const revivedTarget = effects[0]?.target || '队友';
            const reviveAmount = effects[0]?.reviveAmount || 0;
            message += `复活了 ${revivedTarget}，恢复 ${reviveAmount} 点生命值！`;
        } else if (template.targetType === 'all_allies') {
            message += `复活了 ${revivedCount} 名队友！`;
        }

        return {
            message,
            effects: {
                type: 'revive',
                targets: template.targetType,
                revivedCount,
                effects
            }
        };
    }
};
