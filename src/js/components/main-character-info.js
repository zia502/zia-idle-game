class MainCharacterInfo {
    constructor(character) {
        this.character = character;
    }

    render() {
        const character = this.character;

        // 调试信息：输出角色对象结构
        console.log('角色对象:', character);
        console.log('角色基础属性:', character.baseStats);
        console.log('角色当前属性:', character.currentStats);

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
                console.log('Character.attributes 未定义或不包含元素:', element);
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
                    console.log(`找到主角队伍的武器盘ID: ${weaponBoardId}`);
                }
            }

            if (typeof Weapon !== 'undefined' && weaponBoardId) {
                // 直接使用 printWeaponBoardStats 方法获取武器盘属性
                if (typeof Weapon.printWeaponBoardStats === 'function') {
                    // printWeaponBoardStats 会在控制台打印详细信息，并返回属性对象
                    weaponBoardStats = Weapon.printWeaponBoardStats(weaponBoardId);
                    console.log('成功获取武器盘属性:', weaponBoardStats);
                }
                // 如果 printWeaponBoardStats 不可用，则使用 calculateWeaponBoardStats
                else if (typeof Weapon.calculateWeaponBoardStats === 'function') {
                    weaponBoardStats = Weapon.calculateWeaponBoardStats(weaponBoardId);
                    console.log('成功计算武器盘属性:', weaponBoardStats);
                }
            } else {
                console.log('无法获取武器盘属性加成，使用默认值');
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
        console.log(`当前元素: ${element}`);
        console.log('武器盘基础属性:', weaponBoardStats.base);
        console.log(`${element}元素属性加成:`, elementStats);

        // 计算预期伤害
        const baseAttack = character.baseStats?.attack || character.currentStats?.attack || 0;
        const elementMultiplier = 1.5; // 克制属性倍率
        const expectedDamage = Math.floor(baseAttack * elementMultiplier);

        // 调试信息：输出攻击力和预期伤害
        console.log('基础攻击力:', baseAttack);
        console.log('预期伤害:', expectedDamage);

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

                <div class="info-stats">
                    <div class="stat-row">
                        <span class="stat-label">等级</span>
                        <span class="stat-value">${character.level}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">攻击力</span>
                        <span class="stat-value">${character.currentStats?.attack }</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">生命值</span>
                        <span class="stat-value">${character.currentStats?.hp }</span>
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