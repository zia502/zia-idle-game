/**
 * 武器盘加成系统 - 负责在战斗中应用武器盘加成效果
 */
const WeaponBoardBonusSystem = {
    /**
     * 初始化武器盘加成系统
     */
    init() {
        console.log('武器盘加成系统已初始化');
    },

    /**
     * 应用武器盘加成到队伍成员
     * @param {object} team - 队伍对象
     * @param {array} teamMembers - 队伍成员数组
     * @returns {boolean} 是否成功应用
     */
    applyWeaponBoardBonuses(team, teamMembers) {
        if (!team || !team.weaponBoardId || !teamMembers || !teamMembers.length) {
            console.warn('无法应用武器盘加成：队伍或武器盘不存在');
            return false;
        }

        console.log(`开始应用武器盘加成，队伍ID: ${team.id}, 武器盘ID: ${team.weaponBoardId}`);

        // 获取武器盘加成
        let weaponBoardStats;
        try {
            if (typeof Weapon !== 'undefined' && typeof Weapon.calculateWeaponBoardStats === 'function') {
                weaponBoardStats = Weapon.calculateWeaponBoardStats(team.weaponBoardId);
                console.log('获取到武器盘加成:', weaponBoardStats);
            } else {
                console.warn('无法获取武器盘加成：Weapon.calculateWeaponBoardStats方法不存在');
                return false;
            }
        } catch (error) {
            console.error('获取武器盘加成时出错:', error);
            return false;
        }

        if (!weaponBoardStats || !weaponBoardStats.base || !weaponBoardStats.elementStats) {
            console.warn('武器盘加成数据无效');
            return false;
        }

        // 应用基础属性加成到所有队伍成员
        this.applyBaseStatBonuses(teamMembers, weaponBoardStats.base);

        // 应用元素属性加成到对应属性的队伍成员
        this.applyElementalBonuses(teamMembers, weaponBoardStats.elementStats);

        return true;
    },

    /**
     * 应用基础属性加成到所有队伍成员
     * @param {array} teamMembers - 队伍成员数组
     * @param {object} baseStats - 基础属性加成
     */
    applyBaseStatBonuses(teamMembers, baseStats) {
        if (!teamMembers || !baseStats) return;

        console.log('应用基础属性加成:', baseStats);

        for (const member of teamMembers) {
            if (!member || !member.currentStats) continue;

            // 应用攻击力加成
            if (baseStats.attack && baseStats.attack > 0) {
                member.currentStats.attack += baseStats.attack;
                console.log(`为 ${member.name} 添加攻击力加成: +${baseStats.attack}`);
            }

            // 应用生命值加成
            if (baseStats.hp && baseStats.hp > 0) {
                member.currentStats.maxHp += baseStats.hp;
                member.currentStats.hp += baseStats.hp;
                console.log(`为 ${member.name} 添加生命值加成: +${baseStats.hp}`);
            }

            // 如果有其他基础属性加成，可以在这里添加
        }
    },

    /**
     * 应用元素属性加成到对应属性的队伍成员
     * @param {array} teamMembers - 队伍成员数组
     * @param {object} elementStats - 元素属性加成
     */
    applyElementalBonuses(teamMembers, elementStats) {
        if (!teamMembers || !elementStats) return;

        console.log('应用元素属性加成:', elementStats);

        for (const member of teamMembers) {
            if (!member || !member.currentStats || !member.element) continue;

            const element = member.element.toLowerCase();
            const elementBonus = elementStats[element];

            if (!elementBonus) {
                console.log(`${member.name} 的元素 ${element} 没有对应的加成`);
                continue;
            }

            console.log(`为 ${member.name} (${element}属性) 应用元素加成:`, elementBonus);

            // 应用元素攻击力加成（百分比）
            if (elementBonus.attack && elementBonus.attack > 0) {
                const attackBonus = Math.floor(member.currentStats.attack * (elementBonus.attack / 100));
                member.currentStats.attack += attackBonus;
                console.log(`为 ${member.name} 添加${element}属性攻击力加成: +${attackBonus} (${elementBonus.attack}%)`);
            }

            // 应用元素生命值加成（百分比）
            if (elementBonus.hp && elementBonus.hp > 0) {
                const hpBonus = Math.floor(member.currentStats.maxHp * (elementBonus.hp / 100));
                member.currentStats.maxHp += hpBonus;
                member.currentStats.hp += hpBonus;
                console.log(`为 ${member.name} 添加${element}属性生命值加成: +${hpBonus} (${elementBonus.hp}%)`);
            }

            // 应用暴击率加成
            if (elementBonus.critRate && elementBonus.critRate > 0) {
                if (!member.currentStats.critRate) member.currentStats.critRate = 0;
                member.currentStats.critRate += elementBonus.critRate;
                console.log(`为 ${member.name} 添加暴击率加成: +${elementBonus.critRate}%`);
            }

            // 应用DA率加成
            if (elementBonus.daRate && elementBonus.daRate > 0) {
                if (!member.currentStats.daRate) member.currentStats.daRate = 0;
                member.currentStats.daRate += elementBonus.daRate;
                console.log(`为 ${member.name} 添加DA率加成: +${elementBonus.daRate}%`);
            }

            // 应用TA率加成
            if (elementBonus.taRate && elementBonus.taRate > 0) {
                if (!member.currentStats.taRate) member.currentStats.taRate = 0;
                member.currentStats.taRate += elementBonus.taRate;
                console.log(`为 ${member.name} 添加TA率加成: +${elementBonus.taRate}%`);
            }

            // 应用EX攻击力加成
            if (elementBonus.exAttack && elementBonus.exAttack > 0) {
                if (!member.currentStats.exAttack) member.currentStats.exAttack = 0;
                member.currentStats.exAttack += elementBonus.exAttack;
                console.log(`为 ${member.name} 添加EX攻击力加成: +${elementBonus.exAttack}%`);
            }

            // 应用防御力加成
            if (elementBonus.defense && elementBonus.defense > 0) {
                if (!member.currentStats.defense) member.currentStats.defense = 0;
                member.currentStats.defense += elementBonus.defense;
                console.log(`为 ${member.name} 添加防御力加成: +${elementBonus.defense}`);
            }

            // 应用浑身加成
            if (elementBonus.stamina && elementBonus.stamina > 0) {
                if (!member.currentStats.stamina) member.currentStats.stamina = 0;
                member.currentStats.stamina += elementBonus.stamina;
                console.log(`为 ${member.name} 添加浑身加成: +${elementBonus.stamina}`);
            }

            // 应用背水加成
            if (elementBonus.enmity && elementBonus.enmity > 0) {
                if (!member.currentStats.enmity) member.currentStats.enmity = 0;
                member.currentStats.enmity += elementBonus.enmity;
                console.log(`为 ${member.name} 添加背水加成: +${elementBonus.enmity}`);
            }

            // 如果有其他元素属性加成，可以在这里添加
        }
    },

    /**
     * 使用BUFF系统应用武器盘加成
     * @param {object} team - 队伍对象
     * @param {array} teamMembers - 队伍成员数组
     * @returns {boolean} 是否成功应用
     */
    applyWeaponBoardBonusesAsBuffs(team, teamMembers) {
        if (!team || !team.weaponBoardId || !teamMembers || !teamMembers.length || typeof BuffSystem === 'undefined') {
            console.warn('无法应用武器盘加成BUFF：队伍、武器盘不存在或BuffSystem未定义');
            return false;
        }

        console.log(`开始应用武器盘加成BUFF，队伍ID: ${team.id}, 武器盘ID: ${team.weaponBoardId}`);

        // 获取武器盘加成
        let weaponBoardStats;
        try {
            if (typeof Weapon !== 'undefined' && typeof Weapon.calculateWeaponBoardStats === 'function') {
                weaponBoardStats = Weapon.calculateWeaponBoardStats(team.weaponBoardId);
                console.log('获取到武器盘加成:', weaponBoardStats);
            } else {
                console.warn('无法获取武器盘加成：Weapon.calculateWeaponBoardStats方法不存在');
                return false;
            }
        } catch (error) {
            console.error('获取武器盘加成时出错:', error);
            return false;
        }

        if (!weaponBoardStats || !weaponBoardStats.base || !weaponBoardStats.elementStats) {
            console.warn('武器盘加成数据无效');
            return false;
        }

        // 创建一个虚拟的武器盘源对象，用于BUFF来源
        const weaponBoardSource = {
            id: team.weaponBoardId,
            name: '武器盘加成'
        };

        // 应用基础属性加成BUFF到所有队伍成员
        this.applyBaseStatBonusesAsBuffs(teamMembers, weaponBoardStats.base, weaponBoardSource);

        // 应用元素属性加成BUFF到对应属性的队伍成员
        this.applyElementalBonusesAsBuffs(teamMembers, weaponBoardStats.elementStats, weaponBoardSource);

        return true;
    },

    /**
     * 使用BUFF系统应用基础属性加成
     * @param {array} teamMembers - 队伍成员数组
     * @param {object} baseStats - 基础属性加成
     * @param {object} source - BUFF来源
     */
    applyBaseStatBonusesAsBuffs(teamMembers, baseStats, source) {
        if (!teamMembers || !baseStats || !BuffSystem) return;

        console.log('应用基础属性加成BUFF:', baseStats);

        for (const member of teamMembers) {
            if (!member) continue;

            // 创建复合BUFF，包含所有基础属性加成
            const effects = [];

            // 添加攻击力加成
            if (baseStats.attack && baseStats.attack > 0) {
                effects.push({
                    type: 'attackUp',
                    value: baseStats.attack
                });
            }

            // 添加生命值加成
            if (baseStats.hp && baseStats.hp > 0) {
                effects.push({
                    type: 'maxHpUp',
                    value: baseStats.hp
                });
            }

            // 如果有效果，创建并应用复合BUFF
            if (effects.length > 0) {
                const compositeBuff = BuffSystem.createCompositeBuff(
                    '武器盘基础加成',
                    effects,
                    -1, // 永久持续
                    source,
                    1 // 不可叠加
                );

                if (compositeBuff) {
                    BuffSystem.applyCompositeBuff(member, compositeBuff);
                    console.log(`为 ${member.name} 添加武器盘基础加成BUFF`);
                }
            }
        }
    },

    /**
     * 使用BUFF系统应用元素属性加成
     * @param {array} teamMembers - 队伍成员数组
     * @param {object} elementStats - 元素属性加成
     * @param {object} source - BUFF来源
     */
    applyElementalBonusesAsBuffs(teamMembers, elementStats, source) {
        if (!teamMembers || !elementStats || !BuffSystem) return;

        console.log('应用元素属性加成BUFF:', elementStats);

        for (const member of teamMembers) {
            if (!member || !member.element) continue;

            const element = member.element.toLowerCase();
            const elementBonus = elementStats[element];

            if (!elementBonus) {
                console.log(`${member.name} 的元素 ${element} 没有对应的加成`);
                continue;
            }

            console.log(`为 ${member.name} (${element}属性) 应用元素加成BUFF:`, elementBonus);

            // 创建复合BUFF，包含所有元素属性加成
            const effects = [];

            // 添加元素攻击力加成（百分比）
            if (elementBonus.attack && elementBonus.attack > 0) {
                effects.push({
                    type: 'attackPercentUp',
                    value: elementBonus.attack / 100
                });
            }

            // 添加元素生命值加成（百分比）
            if (elementBonus.hp && elementBonus.hp > 0) {
                effects.push({
                    type: 'maxHpPercentUp',
                    value: elementBonus.hp / 100
                });
            }

            // 添加暴击率加成
            if (elementBonus.critRate && elementBonus.critRate > 0) {
                effects.push({
                    type: 'critRateUp',
                    value: elementBonus.critRate
                });
            }

            // 添加DA率加成
            if (elementBonus.daRate && elementBonus.daRate > 0) {
                effects.push({
                    type: 'daRateUp',
                    value: elementBonus.daRate
                });
            }

            // 添加TA率加成
            if (elementBonus.taRate && elementBonus.taRate > 0) {
                effects.push({
                    type: 'taRateUp',
                    value: elementBonus.taRate
                });
            }

            // 添加EX攻击力加成
            if (elementBonus.exAttack && elementBonus.exAttack > 0) {
                effects.push({
                    type: 'exAttackUp',
                    value: elementBonus.exAttack
                });
            }

            // 添加防御力加成
            if (elementBonus.defense && elementBonus.defense > 0) {
                effects.push({
                    type: 'defenseUp',
                    value: elementBonus.defense
                });
            }

            // 添加浑身加成
            if (elementBonus.stamina && elementBonus.stamina > 0) {
                effects.push({
                    type: 'staminaUp',
                    value: elementBonus.stamina
                });
            }

            // 添加背水加成
            if (elementBonus.enmity && elementBonus.enmity > 0) {
                effects.push({
                    type: 'enmityUp',
                    value: elementBonus.enmity
                });
            }

            // 如果有效果，创建并应用复合BUFF
            if (effects.length > 0) {
                const compositeBuff = BuffSystem.createCompositeBuff(
                    `${element}属性武器盘加成`,
                    effects,
                    -1, // 永久持续
                    source,
                    1 // 不可叠加
                );

                if (compositeBuff) {
                    BuffSystem.applyCompositeBuff(member, compositeBuff);
                    console.log(`为 ${member.name} 添加${element}属性武器盘加成BUFF`);
                }
            }
        }
    }
};

// 如果在浏览器环境中，将WeaponBoardBonusSystem添加到全局对象
if (typeof window !== 'undefined') {
    window.WeaponBoardBonusSystem = WeaponBoardBonusSystem;
}
