/**
 * 战斗流程更新 - 修改战斗系统以支持完整的回合流程
 * 完整一回合= 回合开始触发事件 + 角色按顺序依次执行技能 + 角色普通攻击 + 怪物执行技能 + 回合结束触发事件
 */

// 在Battle对象中添加以下方法和更新

/**
 * 更新战斗循环，实现完整的回合流程
 * 
 * 原始的processBattle方法需要被修改为以下流程：
 * 1. 回合开始触发事件
 * 2. 角色按顺序依次执行技能
 * 3. 角色普通攻击
 * 4. 怪物执行技能
 * 5. 回合结束触发事件
 */
function updateBattleLoop() {
    // 保存原始的processBattle方法
    const originalProcessBattle = Battle.processBattle;
    
    // 重写processBattle方法
    Battle.processBattle = function(teamMembers, monster) {
        // 初始化战斗
        this.battleLog = [];
        this.currentTurn = 0;
        this.isFirstTurn = true;
        
        // 初始化战斗统计
        const battleStats = {
            totalDamage: 0,
            totalHealing: 0,
            characterStats: {},
            monsterStats: {
                totalDamage: 0,
                totalHealing: 0
            },
            skillsUsed: {}
        };
        
        // 初始化角色统计
        for (const member of teamMembers) {
            battleStats.characterStats[member.id] = {
                totalDamage: 0,
                totalHealing: 0,
                daCount: 0,
                taCount: 0,
                critCount: 0,
                buffsApplied: 0,
                debuffsApplied: 0
            };
            
            // 初始化角色BUFF
            if (!member.buffs) {
                member.buffs = [];
            }
            
            // 触发战斗开始时的特性
            this.processBattleStartTraits(member, teamMembers);
        }
        
        // 初始化怪物BUFF
        if (!monster.buffs) {
            monster.buffs = [];
        }
        
        // 战斗循环
        const MAX_TURNS = 30;
        while (this.currentTurn < MAX_TURNS) {
            this.currentTurn++;
            this.logBattle(`===== 回合 ${this.currentTurn} =====`);
            
            // 1. 回合开始触发事件
            this.logBattle("----- 回合开始触发事件 -----");
            this.processTurnStartBuffs(teamMembers, monster);
            
            // 检查战斗是否已结束
            if (this.isBattleOver(teamMembers, monster)) {
                break;
            }
            
            // 按速度排序角色
            const sortedTeamMembers = [...teamMembers].sort((a, b) =>
                (b.currentStats.speed || 0) - (a.currentStats.speed || 0)
            );
            
            // 2. 角色按顺序依次执行技能
            this.logBattle("----- 角色技能阶段 -----");
            for (const member of sortedTeamMembers) {
                if (member.currentStats.hp <= 0) continue;
                if (this.isStunned(member)) {
                    this.logBattle(`${member.name} 被眩晕，无法使用技能！`);
                    continue;
                }
                
                this.processCharacterSkill(member, monster, battleStats);
                
                // 检查战斗是否已结束
                if (this.isBattleOver(teamMembers, monster)) {
                    break;
                }
            }
            
            // 检查战斗是否已结束
            if (this.isBattleOver(teamMembers, monster)) {
                break;
            }
            
            // 3. 角色普通攻击
            this.logBattle("----- 角色普通攻击阶段 -----");
            for (const member of sortedTeamMembers) {
                if (member.currentStats.hp <= 0) continue;
                if (this.isStunned(member)) {
                    this.logBattle(`${member.name} 被眩晕，无法进行普通攻击！`);
                    continue;
                }
                
                this.processCharacterNormalAttack(member, monster, battleStats);
                
                // 检查战斗是否已结束
                if (this.isBattleOver(teamMembers, monster)) {
                    break;
                }
            }
            
            // 检查战斗是否已结束
            if (this.isBattleOver(teamMembers, monster)) {
                break;
            }
            
            // 4. 怪物执行技能
            if (monster.currentStats.hp > 0) {
                this.logBattle("----- 怪物技能阶段 -----");
                if (this.isStunned(monster)) {
                    this.logBattle(`${monster.name} 被眩晕，无法行动！`);
                } else {
                    this.processMonsterSkill(monster, teamMembers, battleStats);
                }
                
                // 检查战斗是否已结束
                if (this.isBattleOver(teamMembers, monster)) {
                    break;
                }
            }
            
            // 5. 回合结束触发事件
            this.logBattle("----- 回合结束触发事件 -----");
            this.processTurnEndEffects(teamMembers, monster);
            
            // 更新BUFF持续时间
            this.updateBuffDurations(teamMembers, monster);
            
            // 检查战斗是否已结束
            if (this.isBattleOver(teamMembers, monster)) {
                break;
            }
            
            // 第一回合结束
            if (this.currentTurn === 1) {
                this.isFirstTurn = false;
            }
            
            this.logBattle(`===== 回合 ${this.currentTurn} 结束 =====`);
        }
        
        // 判断战斗结果
        const teamAlive = teamMembers.some(member => member.currentStats.hp > 0);
        const monsterAlive = monster.currentStats.hp > 0;
        
        // 计算奖励
        let gold = 0;
        let exp = 0;
        
        if (teamAlive && !monsterAlive) {
            // 队伍胜利
            this.logBattle(`===== 战斗胜利！=====`);
            
            if (monster.goldReward) {
                gold = Math.floor(Math.random() *
                    (monster.goldReward.max - monster.goldReward.min + 1)) +
                    monster.goldReward.min;
                this.logBattle(`获得 ${gold} 金币！`);
            }
            
            if (monster.xpReward) {
                exp = monster.xpReward;
                this.logBattle(`获得 ${exp} 经验值！`);
            }
            
            // 战斗结束后恢复25%HP
            for (const member of teamMembers) {
                if (member.currentStats.hp > 0) {
                    const healAmount = Math.floor(member.currentStats.maxHp * 0.25);
                    member.currentStats.hp = Math.min(
                        member.currentStats.hp + healAmount,
                        member.currentStats.maxHp
                    );
                    this.logBattle(`${member.name} 恢复了 ${healAmount} 点生命值！`);
                }
            }
            
            // 清除所有BUFF
            for (const member of teamMembers) {
                if (typeof BuffSystem !== 'undefined') {
                    BuffSystem.clearAllBuffs(member);
                } else {
                    member.buffs = [];
                }
            }
            
            return {
                success: true,
                victory: true,
                gold,
                exp,
                battleStats,
                turns: this.currentTurn,
                battleLog: this.battleLog
            };
        } else {
            // 队伍失败
            this.logBattle(`===== 战斗失败！=====`);
            
            // 清除所有BUFF
            for (const member of teamMembers) {
                if (typeof BuffSystem !== 'undefined') {
                    BuffSystem.clearAllBuffs(member);
                } else {
                    member.buffs = [];
                }
            }
            
            return {
                success: true,
                victory: false,
                battleStats,
                turns: this.currentTurn,
                battleLog: this.battleLog
            };
        }
    };
}

/**
 * 处理角色技能
 * @param {object} character - 角色对象
 * @param {object} monster - 怪物对象
 * @param {object} battleStats - 战斗统计
 */
function processCharacterSkill(character, monster, battleStats) {
    // 检查角色是否存活
    if (character.currentStats.hp <= 0) return;
    
    this.logBattle(`${character.name} 的技能阶段开始`);
    
    // 检查角色是否有技能
    if (!character.skills || character.skills.length === 0) {
        this.logBattle(`${character.name} 没有可用的技能`);
        return;
    }
    
    // 获取可用技能（没有冷却的技能）
    const availableSkills = character.skills.filter(skillId => {
        // 跳过被动技能
        const skill = JobSystem.getSkill(skillId);
        if (skill && skill.passive) return false;
        
        // 检查冷却
        return !character.skillCooldowns || !character.skillCooldowns[skillId] || character.skillCooldowns[skillId] <= 0;
    });
    
    if (availableSkills.length === 0) {
        this.logBattle(`${character.name} 没有可用的技能（所有技能都在冷却中）`);
        return;
    }
    
    // 随机选择一个技能
    const skillId = availableSkills[Math.floor(Math.random() * availableSkills.length)];
    const skill = JobSystem.getSkill(skillId);
    
    this.logBattle(`${character.name} 选择使用技能: ${skill ? skill.name : skillId}`);
    
    // 使用技能
    if (typeof JobSkills !== 'undefined' && typeof JobSkills.useSkill === 'function') {
        const result = JobSkills.useSkill(character.id, skillId, [character], monster);
        
        if (result.success) {
            this.logBattle(result.message);
            
            // 设置技能冷却
            if (skill && skill.cooldown) {
                character.skillCooldowns = character.skillCooldowns || {};
                character.skillCooldowns[skillId] = skill.cooldown;
                this.logBattle(`技能 ${skill.name} 进入冷却状态 (${skill.cooldown} 回合)`);
            }
            
            // 更新技能使用统计
            battleStats.skillsUsed = battleStats.skillsUsed || {};
            battleStats.skillsUsed[skillId] = (battleStats.skillsUsed[skillId] || 0) + 1;
        } else {
            this.logBattle(`技能使用失败: ${result.message || '未知原因'}`);
        }
    } else {
        this.logBattle(`技能系统不可用，跳过技能使用`);
    }
    
    this.logBattle(`${character.name} 的技能阶段结束`);
}

/**
 * 处理角色普通攻击
 * @param {object} character - 角色对象
 * @param {object} monster - 怪物对象
 * @param {object} battleStats - 战斗统计
 */
function processCharacterNormalAttack(character, monster, battleStats) {
    // 检查角色是否存活
    if (character.currentStats.hp <= 0) return;
    
    this.logBattle(`${character.name} 的普通攻击阶段开始`);
    
    // 处理角色特性触发
    const triggeredEffects = Character.processTraitTriggers(character.id, 'attack', { target: monster });
    
    // 应用特性效果
    for (const effect of triggeredEffects) {
        if (effect.message) {
            this.logBattle(`${character.name} ${effect.message}`);
        }
    }
    
    // 检查DA和TA触发
    let attackCount = 1;
    let isDA = false;
    let isTA = false;
    
    // 获取DA和TA概率
    const daRate = character.currentStats.daRate || 0.15;
    const taRate = character.currentStats.taRate || 0.05;
    
    // 先检查TA，再检查DA
    if (Math.random() < taRate) {
        attackCount = 3;
        isTA = true;
        character.stats.taCount++;
        this.logBattle(`${character.name} 触发三重攻击！`);
    } else if (Math.random() < daRate) {
        attackCount = 2;
        isDA = true;
        character.stats.daCount++;
        this.logBattle(`${character.name} 触发双重攻击！`);
    }
    
    // 执行攻击
    let totalDamage = 0;
    for (let i = 0; i < attackCount; i++) {
        // 检查怪物是否已被击败
        if (monster.currentStats.hp <= 0) break;
        
        // 计算伤害
        const damageResult = Character.calculateDamage(character.id, monster.id, false, {
            isMultiAttack: i > 0, // 第一次攻击不是多重攻击
            skipStats: true // 不计入角色总伤害统计（我们会在最后统一计算）
        });
        
        // 应用伤害
        monster.currentStats.hp = Math.max(0, monster.currentStats.hp - damageResult.damage);
        
        // 累计伤害
        totalDamage += damageResult.damage;
        
        // 记录暴击次数
        if (damageResult.isCritical) {
            character.stats.critCount++;
        }
        
        // 记录战斗日志
        let damageMessage = `${character.name} `;
        
        if (i > 0) {
            damageMessage += `第${i+1}次攻击 `;
        }
        
        damageMessage += `攻击 ${monster.name}，造成 ${damageResult.damage} 点伤害`;
        
        if (damageResult.isCritical) {
            damageMessage += '（暴击！）';
        }
        
        if (damageResult.attributeBonus > 0) {
            damageMessage += '（属性克制！）';
        } else if (damageResult.attributeBonus < 0) {
            damageMessage += '（属性被克制！）';
        }
        
        this.logBattle(damageMessage);
    }
    
    // 更新角色伤害统计
    character.stats.totalDamage += totalDamage;
    
    // 更新战斗统计
    if (battleStats && battleStats.characterStats && battleStats.characterStats[character.id]) {
        battleStats.characterStats[character.id].totalDamage += totalDamage;
        battleStats.totalDamage += totalDamage;
        
        if (isDA) {
            battleStats.characterStats[character.id].daCount++;
        }
        
        if (isTA) {
            battleStats.characterStats[character.id].taCount++;
        }
    }
    
    // 检查怪物是否被击败
    if (monster.currentStats.hp <= 0) {
        this.logBattle(`${monster.name} 被击败了！`);
    }
    
    this.logBattle(`${character.name} 的普通攻击阶段结束`);
}

/**
 * 处理怪物技能
 * @param {object} monster - 怪物对象
 * @param {array} teamMembers - 队伍成员
 * @param {object} battleStats - 战斗统计
 */
function processMonsterSkill(monster, teamMembers, battleStats) {
    // 检查怪物是否存活
    if (monster.currentStats.hp <= 0) return;
    
    this.logBattle(`${monster.name} 的技能阶段开始`);
    
    // 选择目标（简单AI：随机选择一个存活的队伍成员）
    const aliveMembers = teamMembers.filter(member => member.currentStats.hp > 0);
    if (aliveMembers.length === 0) return;
    
    const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
    
    // 检查怪物是否有技能
    if (!monster.skills || monster.skills.length === 0) {
        this.logBattle(`${monster.name} 没有可用的技能`);
        
        // 执行普通攻击
        this.processMonsterNormalAttack(monster, teamMembers, battleStats);
        return;
    }
    
    // 获取可用技能（没有冷却的技能）
    const availableSkills = monster.skills.filter(skillId => {
        return !monster.skillCooldowns || !monster.skillCooldowns[skillId] || monster.skillCooldowns[skillId] <= 0;
    });
    
    if (availableSkills.length === 0) {
        this.logBattle(`${monster.name} 没有可用的技能（所有技能都在冷却中）`);
        
        // 执行普通攻击
        this.processMonsterNormalAttack(monster, teamMembers, battleStats);
        return;
    }
    
    // 随机选择一个技能
    const skillId = availableSkills[Math.floor(Math.random() * availableSkills.length)];
    
    // 获取技能信息
    let skill = null;
    if (typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates) {
        skill = JobSkillsTemplate.templates[skillId];
    }
    
    if (!skill) {
        this.logBattle(`${monster.name} 找不到技能 ${skillId} 的定义，将进行普通攻击`);
        
        // 执行普通攻击
        this.processMonsterNormalAttack(monster, teamMembers, battleStats);
        return;
    }
    
    this.logBattle(`${monster.name} 选择使用技能: ${skill.name}`);
    
    // 使用技能
    if (skill.effectType === 'damage' || skill.effectType === 'damage_and_debuff') {
        // 获取目标
        let targets = [];
        if (skill.targetType === 'all_enemies') {
            targets = aliveMembers;
        } else if (skill.targetType === 'enemy') {
            targets = [target];
        } else {
            targets = [target]; // 默认单体目标
        }
        
        // 计算伤害
        for (const currentTarget of targets) {
            let damage = 0;
            for (const effect of skill.effects) {
                if (effect.type === 'damage') {
                    const multiplier = effect.multiplier || 1.0;
                    damage += Math.floor(monster.currentStats.attack * multiplier);
                }
            }
            
            // 应用伤害
            currentTarget.currentStats.hp = Math.max(0, currentTarget.currentStats.hp - damage);
            this.logBattle(`${monster.name} 使用了 ${skill.name}，对 ${currentTarget.name} 造成 ${damage} 点伤害！`);
            
            // 更新怪物伤害统计
            monster.stats = monster.stats || { totalDamage: 0, totalHealing: 0 };
            monster.stats.totalDamage += damage;
            
            // 更新战斗统计
            if (battleStats && battleStats.monsterStats) {
                battleStats.monsterStats.totalDamage += damage;
            }
            
            // 应用debuff
            if (skill.effectType === 'damage_and_debuff') {
                for (const effect of skill.effects) {
                    if (effect.type !== 'damage') {
                        this.logBattle(`${currentTarget.name} 受到了 ${effect.type} 效果！`);
                        
                        // 创建BUFF
                        if (typeof BuffSystem !== 'undefined') {
                            const buff = BuffSystem.createBuff(effect.type, effect.value, effect.duration, monster);
                            if (buff) {
                                BuffSystem.applyBuff(currentTarget, buff);
                            }
                        }
                    }
                }
            }
            
            // 检查角色是否被击败
            if (currentTarget.currentStats.hp <= 0) {
                this.logBattle(`${currentTarget.name} 被击败了！`);
            }
        }
    } else if (skill.effectType === 'buff') {
        // 应用buff
        this.logBattle(`${monster.name} 使用了 ${skill.name}，获得了增益效果！`);
        
        for (const effect of skill.effects) {
            if (effect.type && typeof BuffSystem !== 'undefined') {
                const buff = BuffSystem.createBuff(effect.type, effect.value, effect.duration, monster);
                if (buff) {
                    BuffSystem.applyBuff(monster, buff);
                }
            }
        }
    } else if (skill.effectType === 'debuff') {
        // 获取目标
        let targets = [];
        if (skill.targetType === 'all_enemies') {
            targets = aliveMembers;
        } else if (skill.targetType === 'enemy') {
            targets = [target];
        } else {
            targets = [target]; // 默认单体目标
        }
        
        // 应用debuff
        for (const currentTarget of targets) {
            this.logBattle(`${monster.name} 使用了 ${skill.name}，对 ${currentTarget.name} 施加了减益效果！`);
            
            for (const effect of skill.effects) {
                if (effect.type && typeof BuffSystem !== 'undefined') {
                    const buff = BuffSystem.createBuff(effect.type, effect.value, effect.duration, monster);
                    if (buff) {
                        BuffSystem.applyBuff(currentTarget, buff);
                    }
                }
            }
        }
    }
    
    // 设置技能冷却
    monster.skillCooldowns = monster.skillCooldowns || {};
    monster.skillCooldowns[skillId] = skill.cooldown || 3;
    this.logBattle(`技能 ${skill.name} 进入冷却状态 (${skill.cooldown || 3} 回合)`);
    
    // 更新技能使用统计
    battleStats.skillsUsed = battleStats.skillsUsed || {};
    battleStats.skillsUsed[skillId] = (battleStats.skillsUsed[skillId] || 0) + 1;
    
    this.logBattle(`${monster.name} 的技能阶段结束`);
}

/**
 * 处理怪物普通攻击
 * @param {object} monster - 怪物对象
 * @param {array} teamMembers - 队伍成员
 * @param {object} battleStats - 战斗统计
 */
function processMonsterNormalAttack(monster, teamMembers, battleStats) {
    // 检查怪物是否存活
    if (monster.currentStats.hp <= 0) return;
    
    this.logBattle(`${monster.name} 的普通攻击阶段开始`);
    
    // 选择目标（简单AI：随机选择一个存活的队伍成员）
    const aliveMembers = teamMembers.filter(member => member.currentStats.hp > 0);
    if (aliveMembers.length === 0) return;
    
    const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
    
    // 检查DA和TA触发（怪物也可以有多重攻击）
    let attackCount = 1;
    let isDA = false;
    let isTA = false;
    
    // 获取DA和TA概率
    const daRate = monster.currentStats.daRate || 0.1; // 怪物默认10%双重攻击率
    const taRate = monster.currentStats.taRate || 0.03; // 怪物默认3%三重攻击率
    
    // 先检查TA，再检查DA
    if (Math.random() < taRate) {
        attackCount = 3;
        isTA = true;
        this.logBattle(`${monster.name} 触发三重攻击！`);
    } else if (Math.random() < daRate) {
        attackCount = 2;
        isDA = true;
        this.logBattle(`${monster.name} 触发双重攻击！`);
    }
    
    // 执行攻击
    let totalDamage = 0;
    for (let i = 0; i < attackCount; i++) {
        // 检查目标是否已被击败
        if (target.currentStats.hp <= 0) break;
        
        // 计算伤害（简化版，可以根据需要扩展）
        const damage = Math.floor(monster.currentStats.attack * (100 - target.currentStats.defense) / 100);
        
        // 应用伤害
        target.currentStats.hp = Math.max(0, target.currentStats.hp - damage);
        
        // 累计伤害
        totalDamage += damage;
        
        // 记录战斗日志
        let damageMessage = `${monster.name} `;
        
        if (i > 0) {
            damageMessage += `第${i+1}次攻击 `;
        }
        
        damageMessage += `攻击 ${target.name}，造成 ${damage} 点伤害`;
        
        this.logBattle(damageMessage);
    }
    
    // 更新怪物伤害统计
    monster.stats = monster.stats || { totalDamage: 0, totalHealing: 0 };
    monster.stats.totalDamage += totalDamage;
    
    // 更新战斗统计
    if (battleStats && battleStats.monsterStats) {
        battleStats.monsterStats.totalDamage += totalDamage;
    }
    
    // 检查角色是否被击败
    if (target.currentStats.hp <= 0) {
        this.logBattle(`${target.name} 被击败了！`);
        
        // 检查是否有备用队友可以上场
        if (this.backLineMembers && this.backLineMembers.length > 0) {
            // 获取一个备用队友
            const backup = this.backLineMembers.shift();
            
            // 将阵亡角色移到队伍最后（备用队友列表末尾）
            this.backLineMembers.push(target);
            
            // 将备用队友加入战斗队伍
            const targetIndex = teamMembers.findIndex(member => member.id === target.id);
            if (targetIndex !== -1) {
                teamMembers[targetIndex] = backup;
                this.logBattle(`${backup.name} 从后排上场替换阵亡的 ${target.name}！`);
            }
        }
    }
    
    this.logBattle(`${monster.name} 的普通攻击阶段结束`);
}

// 在游戏初始化时调用此函数
function initBattleFlowUpdates() {
    // 添加新方法
    Battle.processCharacterSkill = processCharacterSkill;
    Battle.processCharacterNormalAttack = processCharacterNormalAttack;
    Battle.processMonsterSkill = processMonsterSkill;
    Battle.processMonsterNormalAttack = processMonsterNormalAttack;
    
    // 更新战斗循环
    updateBattleLoop();
    
    console.log('战斗流程更新已应用');
}
