class MainCharacterInfo {
    constructor(character) {
        this.character = character;

        // 添加事件监听器，在武器盘更新时重新计算属性
        if (typeof Events !== 'undefined' && typeof Events.on === 'function') {
            Events.on('weapon:updated', () => {
                // console.log('MainCharacterInfo: 收到武器盘更新事件，重新计算属性');
                // 这里不需要做任何事情，因为每次渲染时都会重新计算属性
                // 只需确保UI.renderMainCharacter()被调用即可
            });

            // 移除对character:exp-updated事件的监听，避免重复处理
            // 现在只在ui-main-character.js中处理此事件
        }
    }

    /**
     * 渲染职业经验进度条
     * @param {object} character - 角色对象
     * @param {number} jobLevel - 职业等级
     * @returns {string} 职业经验进度条HTML
     */
    renderJobExpBar(character, jobLevel) {
        // 如果没有职业或已达到最高等级，不显示经验条
        if (!character.job || !character.job.current || jobLevel >= 20) {
            return '';
        }

        // 获取职业信息
        const jobId = character.job.current;
        const jobInfo = typeof JobSystem !== 'undefined' ? JobSystem.getJob(jobId) : null;

        if (!jobInfo) {
            return '';
        }

        // 获取当前经验和下一级所需经验
        const currentExp = character.job.exp || 0;
        const nextLevelExp = typeof JobSystem !== 'undefined' && typeof JobSystem.calculateJobLevelExp === 'function'
            ? JobSystem.calculateJobLevelExp(jobLevel, jobInfo.tier)
            : 100000; // 默认值

        // 计算经验百分比
        const expPercent = Math.min(100, Math.max(0, (currentExp / nextLevelExp) * 100));

        // 返回进度条HTML
        return `
            <div class="job-exp-container">
                <div class="job-exp-info">
                    <span class="job-exp-label">职业经验</span>
                    <span class="job-exp-value">${currentExp}/${nextLevelExp}</span>
                </div>
                <div class="job-exp-bar">
                    <div class="job-exp-fill" style="width: ${expPercent}%"></div>
                </div>
            </div>
        `;
    }

    render() {
        const character = this.character;

        // 调试信息：输出角色对象结构
        // console.log('角色对象:', character);
        // console.log('角色基础属性:', character.baseStats);
        // console.log('角色当前属性:', character.currentStats);

        // 使用 element 或 attribute 属性
        const element = character.element || character.attribute || 'fire';

        // 使用 Character.attributes 而不是 Character.elements
        let elementName = '火';
        let elementColor = '#ff4d4d';

        try {
            if (Character && Character.attributes && Character.attributes[element]) {
                elementName = Character.attributes[element].name;

                // 为不同元素设置颜色
                switch(element) {
                    case 'fire': elementColor = '#ff4d4d'; break;
                    case 'water': elementColor = '#4da6ff'; break;
                    case 'earth': elementColor = '#8c6d3f'; break;
                    case 'wind': elementColor = '#80ff80'; break;
                    case 'light': elementColor = '#ffff80'; break;
                    case 'dark': elementColor = '#9966ff'; break;
                    default: elementColor = '#ff4d4d';
                }
            } else {
                // console.log('Character.attributes 未定义或不包含元素:', element);
            }
        } catch (error) {
            console.error('获取元素信息时出错:', error);
        }

        // 获取职业信息
        let jobName = '新手';
        let jobLevel = 1;
        let allowedWeapons = [];

        try {
            if (typeof Character !== 'undefined') {
                if (typeof Character.getJobName === 'function') {
                    jobName = Character.getJobName(character);
                }

                if (typeof Character.getJobLevel === 'function') {
                    jobLevel = Character.getJobLevel(character);
                }
            }

            if (typeof JobSystem !== 'undefined' && typeof JobSystem.getAllowedWeapons === 'function' && character.job) {
                allowedWeapons = JobSystem.getAllowedWeapons(character.job.current);
            }
        } catch (error) {
            console.error('获取职业信息时出错:', error);
        }

        // 获取武器盘属性加成
        let weaponBoardStats = { base: { attack: 0, hp: 0 }, elementStats: {} };
        try {
            // 主角没有直接的 weaponBoardId，需要通过当前队伍获取
            let weaponBoardId = null;

            // 获取当前队伍
            if (typeof Game !== 'undefined' && Game.state && Game.state.activeTeamId) {
                const teamId = Game.state.activeTeamId;
                const team = typeof Team !== 'undefined' ? Team.getTeam(teamId) : null;

                if (team && team.weaponBoardId) {
                    weaponBoardId = team.weaponBoardId;
                    // console.log(`找到主角队伍的武器盘ID: ${weaponBoardId}`);
                }
            }

            if (typeof Weapon !== 'undefined' && weaponBoardId) {
                // 直接使用 printWeaponBoardStats 方法获取武器盘属性
                if (typeof Weapon.printWeaponBoardStats === 'function') {
                    // printWeaponBoardStats 会在控制台打印详细信息，并返回属性对象
                    weaponBoardStats = Weapon.printWeaponBoardStats(weaponBoardId);
                    // console.log('成功获取武器盘属性:', weaponBoardStats);
                }
                // 如果 printWeaponBoardStats 不可用，则使用 calculateWeaponBoardStats
                else if (typeof Weapon.calculateWeaponBoardStats === 'function') {
                    weaponBoardStats = Weapon.calculateWeaponBoardStats(weaponBoardId);
                    // console.log('成功计算武器盘属性:', weaponBoardStats);
                }
            } else {
                // console.log('无法获取武器盘属性加成，使用默认值');
                weaponBoardStats = {
                    base: { attack: 0, hp: 0 },
                    elementStats: {
                        fire: { attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                        water: { attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                        earth: { attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                        wind: { attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                        light: { attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                        dark: { attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 }
                    }
                };
            }
        } catch (error) {
            console.error('获取武器盘属性加成时出错:', error);
        }

        // 获取当前元素的属性加成
        const elementStats = weaponBoardStats.elementStats[element] || {
            attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0,
            stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0
        };

        // 调试信息
        // console.log(`当前元素: ${element}`);
        // console.log('武器盘基础属性:', weaponBoardStats.base);
        // console.log(`${element}元素属性加成:`, elementStats);

        // 获取包含武器盘加成的完整属性值
        let totalAttack = character.currentStats?.attack || 0;
        let totalHp = character.currentStats?.hp || 0;

        // 无论是否在地下城中，都使用weaponBonusStats作为显示属性
        if (character.weaponBonusStats) {
            // console.log('使用weaponBonusStats作为显示属性:', character.weaponBonusStats);
            totalAttack = character.weaponBonusStats.attack || 0;
            totalHp = character.weaponBonusStats.hp || 0;
        } else {
            // 如果weaponBonusStats不存在，尝试更新它
            try {
                if (typeof Character !== 'undefined' && typeof Character.getCharacterFullStats === 'function' &&
                    typeof Game !== 'undefined' && Game.state && Game.state.activeTeamId) {

                    const teamId = Game.state.activeTeamId;

                    // 确保所有必要的对象都存在
                    if (character && character.id && teamId &&
                        typeof Team !== 'undefined' && typeof Team.getTeam === 'function' &&
                        typeof Team.getTeam(teamId) === 'object' && Team.getTeam(teamId) !== null &&
                        typeof Weapon !== 'undefined' && typeof Weapon.getWeaponBoard === 'function') {

                        try {
                            // 更新weaponBonusStats
                            const completeStats = Character.getCharacterFullStats(character.id, teamId, true);

                            if (completeStats && typeof completeStats === 'object') {
                                // console.log('获取到完整属性并更新weaponBonusStats:', completeStats);
                                totalAttack = completeStats.attack || totalAttack;
                                totalHp = completeStats.hp || totalHp;
                            } else {
                                // 如果无法获取完整属性，使用备用计算方式
                                // console.log('无法获取完整属性，使用备用计算方式');
                                totalAttack = (character.baseStats?.attack || 0) + (weaponBoardStats.base?.attack || 0);
                                totalHp = (character.baseStats?.hp || 0) + (weaponBoardStats.base?.hp || 0);
                            }
                        } catch (innerError) {
                            console.error('调用getCharacterFullStats时出错:', innerError);
                            // 使用备用计算方式
                            totalAttack = (character.baseStats?.attack || 0) + (weaponBoardStats.base?.attack || 0);
                            totalHp = (character.baseStats?.hp || 0) + (weaponBoardStats.base?.hp || 0);
                        }
                    } else {
                        // 如果缺少必要对象，使用备用计算方式
                        // console.log('缺少必要对象，使用备用计算方式');
                        totalAttack = (character.baseStats?.attack || 0) + (weaponBoardStats.base?.attack || 0);
                        totalHp = (character.baseStats?.hp || 0) + (weaponBoardStats.base?.hp || 0);
                    }
                } else {
                    // 如果Character.getCharacterFullStats不可用，使用备用计算方式
                    // console.log('Character.getCharacterFullStats不可用，使用备用计算方式');
                    totalAttack = (character.baseStats?.attack || 0) + (weaponBoardStats.base?.attack || 0);
                    totalHp = (character.baseStats?.hp || 0) + (weaponBoardStats.base?.hp || 0);
                }
            } catch (error) {
                console.error('获取完整属性时出错:', error);
                // 使用备用计算方式
                totalAttack = (character.baseStats?.attack || 0) + (weaponBoardStats.base?.attack || 0);
                totalHp = (character.baseStats?.hp || 0) + (weaponBoardStats.base?.hp || 0);
            }
        }

        // console.log('角色基础攻击力:', character.currentStats?.attack);
        // console.log('武器盘攻击力加成:', weaponBoardStats.base?.attack || 0);
        // console.log('总攻击力:', totalAttack);
        // console.log('角色基础生命值:', character.currentStats?.hp);
        // console.log('武器盘生命值加成:', weaponBoardStats.base?.hp || 0);
        // console.log('总生命值:', totalHp);

        // 计算预期伤害 (使用包含武器盘加成的总攻击力)
        const elementMultiplier = 1.5; // 克制属性倍率

        // 计算暴击倍率 - 只有当暴击率=100%时才使用1.5倍伤害
        // 检查角色的暴击率，如果没有明确设置，则假设不是100%
        const hasCritical = elementStats.critRate >= 100; // 只有当暴击率达到100%时才计算暴击
        const critMultiplier = hasCritical ? 1.5 : 1.0;

        // 计算攻击力提升百分比效果
        const attackPercentBonus = elementStats.attack / 100 || 0;

        // 计算EX攻击力提升百分比效果
        const exAttackBonus = elementStats.exAttack / 100 || 0;

        // 计算浑身提升效果
        // 浑身提升效果 = (100 / (56 - (浑身数值 + (0.4))))^2.9 + 2.1
        let staminaBonus = 0;
        if (elementStats.stamina > 0) {
            const staminaCoefficient = elementStats.stamina + 0.4;
            const staminaBase = 56 - staminaCoefficient;
            if (staminaBase > 0) { // 防止除以零或负数
                staminaBonus = Math.pow(100 / staminaBase, 2.9) + 2.1;
                staminaBonus = staminaBonus / 100; // 转换为小数
            }
        }

        // 计算最终预期伤害
        // 预期伤害 = 总攻击力 * 1.5(克属) * (1+ 攻击力提升%) * (1.5 如果暴击100%) * (1+EX攻击力提升%) * (1+浑身提升效果%)
        const expectedDamage = Math.floor(
            totalAttack *
            elementMultiplier *
            (1 + attackPercentBonus) *
            critMultiplier *
            (1 + exAttackBonus) *
            (1 + staminaBonus)
        );

        // 调试信息：输出攻击力和预期伤害
        // console.log('总攻击力:', totalAttack);
        // console.log('元素克制倍率:', elementMultiplier);
        // console.log('攻击力提升百分比:', attackPercentBonus);
        // console.log('暴击率:', elementStats.critRate, '%');
        // console.log('暴击率是否达到100%:', hasCritical);
        // console.log('暴击倍率:', critMultiplier);
        // console.log('EX攻击力提升:', exAttackBonus);
        // console.log('浑身值:', elementStats.stamina);
        // console.log('浑身提升效果:', staminaBonus);
        // console.log('预期伤害:', expectedDamage);

        return `
            <div class="main-character-info" style="border-color: ${elementColor}">
                <div class="info-header">
                    <h2>${character.name || '未知角色'}</h2>
                </div>

                <div class="character-job">
                    <div class="job-info">
                        <span class="job-name">${jobName}</span>
                        <span class="job-level">Lv.${jobLevel}</span>
                        <span class="element-badge" style="background-color: ${elementColor}">${elementName}</span>
                    </div>
                    <div class="allowed-weapons">
                        ${allowedWeapons.map(weaponType => {
                            if (typeof UI !== 'undefined' && UI.weaponTypeIcons && UI.getWeaponTypeName) {
                                return `<img src="src/assets/${UI.weaponTypeIcons[weaponType]}" alt="${UI.getWeaponTypeName(weaponType)}" title="${UI.getWeaponTypeName(weaponType)}">`;
                            } else {
                                return `<span>${weaponType}</span>`;
                            }
                        }).join('')}
                    </div>
                </div>

                <!-- 职业经验进度条 -->
                ${this.renderJobExpBar(character, jobLevel)}

                <div class="info-stats">
                    <div class="stat-row">
                        <span class="stat-label">攻击力</span>
                        <span class="stat-value">${totalAttack}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">生命值</span>
                        <span class="stat-value">${totalHp}</span>
                    </div>
                </div>

                <div class="weapon-board-bonus">
                    <h3>武器盘加成</h3>
                    <div class="weapon-board-base-stats">
                        <h4>基础属性</h4>
                        <div class="stat-row">
                            <span class="stat-label">总攻击力</span>
                            <span class="stat-value">${weaponBoardStats.base.attack}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">总生命值</span>
                            <span class="stat-value">${weaponBoardStats.base.hp}</span>
                        </div>
                    </div>

                    <div class="weapon-board-element-stats">
                        <h4>${elementName}属性加成</h4>
                        ${elementStats.attack > 0 ? `
                            <div class="stat-row">
                                <span class="stat-label">攻击力提升</span>
                                <span class="stat-value">+${elementStats.attack}%</span>
                            </div>
                        ` : ''}
                        ${elementStats.hp > 0 ? `
                            <div class="stat-row">
                                <span class="stat-label">生命值提升</span>
                                <span class="stat-value">+${elementStats.hp}%</span>
                            </div>
                        ` : ''}
                        ${elementStats.critRate > 0 ? `
                            <div class="stat-row">
                                <span class="stat-label">暴击率提升</span>
                                <span class="stat-value">+${elementStats.critRate}%</span>
                            </div>
                        ` : ''}
                        ${elementStats.daRate > 0 ? `
                            <div class="stat-row">
                                <span class="stat-label">DA率提升</span>
                                <span class="stat-value">+${elementStats.daRate}%</span>
                            </div>
                        ` : ''}
                        ${elementStats.taRate > 0 ? `
                            <div class="stat-row">
                                <span class="stat-label">TA率提升</span>
                                <span class="stat-value">+${elementStats.taRate}%</span>
                            </div>
                        ` : ''}
                        ${elementStats.exAttack > 0 ? `
                            <div class="stat-row">
                                <span class="stat-label">EX攻击力提升</span>
                                <span class="stat-value">+${elementStats.exAttack}%</span>
                            </div>
                        ` : ''}
                        ${elementStats.defense > 0 ? `
                            <div class="stat-row">
                                <span class="stat-label">防御力提升</span>
                                <span class="stat-value">+${elementStats.defense}%</span>
                            </div>
                        ` : ''}
                        ${elementStats.stamina > 0 ? `
                            <div class="stat-row">
                                <span class="stat-label">浑身值提升</span>
                                <span class="stat-value">+${elementStats.stamina}%</span>
                            </div>
                        ` : ''}
                        ${elementStats.enmity > 0 ? `
                            <div class="stat-row">
                                <span class="stat-label">背水值提升</span>
                                <span class="stat-value">+${elementStats.enmity}%</span>
                            </div>
                        ` : ''}
                        ${elementStats.na_cap > 0 ? `
                            <div class="stat-row">
                                <span class="stat-label">技能伤害上限提升</span>
                                <span class="stat-value">+${elementStats.na_cap}%</span>
                            </div>
                        ` : ''}
                        ${elementStats.skill_cap > 0 ? `
                            <div class="stat-row">
                                <span class="stat-label">伤害上限提升</span>
                                <span class="stat-value">+${elementStats.skill_cap}%</span>
                            </div>
                        ` : ''}
                        ${elementStats.bonusDamage > 0 ? `
                            <div class="stat-row">
                                <span class="stat-label">额外伤害</span>
                                <span class="stat-value">${elementStats.bonusDamage}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="expected-damage">
                    <h3>预期伤害</h3>
                    <div class="stat-row">
                        <span class="stat-label">对克制属性</span>
                        <span class="stat-value">${expectedDamage}</span>
                    </div>
                </div>

                <div class="character-actions">
                    <button class="details-button" data-character-id="${character.id}">详情</button>
                    <button class="job-button" data-character-id="${character.id}">职业</button>
                </div>
            </div>
        `;
    }
}