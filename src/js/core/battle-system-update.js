/**
 * 战斗系统更新 - 扩展战斗系统以支持所有技能效果
 */

// 在Battle对象中添加以下方法和更新

/**
 * 处理回合结束时的效果
 * @param {array} teamMembers - 队伍成员
 * @param {object} monster - 怪物对象
 */
function processTurnEndEffects(teamMembers, monster) {
    // 处理队伍成员的回合结束效果
    for (const member of teamMembers) {
        if (member.currentStats.hp <= 0) continue;

        // 处理BUFF中的回合结束效果
        if (member.buffs) {
            for (const buff of member.buffs) {
                if (buff.type === 'endOfTurn' && buff.effect) {
                    this.processEndOfTurnEffect(member, buff.effect, teamMembers, monster);
                } else if (buff.type === 'counterAttack' && buff.target) {
                    this.processCounterAttackEffect(member, buff, teamMembers, monster);
                } else if (buff.type === 'regen') {
                    // 处理持续恢复效果
                    const healing = Math.floor(buff.value);
                    member.currentStats.hp = Math.min(member.currentStats.maxHp, member.currentStats.hp + healing);
                    this.logBattle(`${member.name} 恢复了 ${healing} 点生命值！`);
                }
            }
        }

        // 处理被动技能中的回合结束效果
        if (member.skills) {
            for (const skillId of member.skills) {
                const skill = JobSystem.getSkill(skillId);
                if (skill && skill.passive && skill.effects) {
                    for (const effect of skill.effects) {
                        if (effect.type === 'endOfTurn') {
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
            } else if (buff.type === 'regen') {
                // 处理持续恢复效果
                const healing = Math.floor(buff.value);
                monster.currentStats.hp = Math.min(monster.currentStats.maxHp, monster.currentStats.hp + healing);
                this.logBattle(`${monster.name} 恢复了 ${healing} 点生命值！`);
            }
        }
    }
}



/**
 * 处理反击效果
 * @param {object} source - 效果来源
 * @param {object} buff - BUFF对象
 * @param {array} teamMembers - 队伍成员
 * @param {object} monster - 怪物对象
 */
function processCounterAttackEffect(source, buff, teamMembers, monster) {
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
}







/**
 * 处理复活效果
 * @param {object} caster - 施法者
 * @param {object} target - 目标
 * @param {number} hpRatio - 恢复生命值比例
 * @returns {boolean} 是否成功复活
 */
function processReviveEffect(caster, target, hpRatio) {
    if (!target || target.currentStats.hp > 0) return false;

    // 计算恢复的生命值
    const healAmount = Math.floor(target.currentStats.maxHp * hpRatio);

    // 复活目标
    target.currentStats.hp = healAmount;

    this.logBattle(`${caster.name} 复活了 ${target.name}，恢复了 ${healAmount} 点生命值！`);

    return true;
}

// 更新战斗循环，在回合结束时处理回合结束效果
function updateBattleLoop() {
    // 在战斗循环的回合结束部分添加以下代码

    // 处理回合结束时的效果
    this.processTurnEndEffects(teamMembers, monster);
}

// 更新JobSkills.applySkillEffects方法，添加对复活效果的支持
function updateApplySkillEffects() {
    // 在applySkillEffects方法的switch语句中添加以下case

    case 'revive':
        return this.applyReviveEffects(character, template, teamMembers, monster);
}

// 添加applyReviveEffects方法
function applyReviveEffects(character, template, teamMembers, monster) {
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
}
