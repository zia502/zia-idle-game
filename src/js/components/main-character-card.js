class MainCharacterCard {
    constructor(character) {
        this.character = character;
    }

    render() {
        const character = this.character;
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

        // 获取武器盘属性加成
        let weaponBoardStats = { elementStats: {} };
        try {
            if (typeof Weapon !== 'undefined' && typeof Weapon.calculateWeaponBoardStats === 'function' && character.weaponBoardId) {
                weaponBoardStats = Weapon.calculateWeaponBoardStats(character.weaponBoardId);
            } else {
                console.log('无法获取武器盘属性加成，使用默认值');
                weaponBoardStats = {
                    elementStats: {
                        fire: { attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0 },
                        water: { attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0 },
                        earth: { attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0 },
                        wind: { attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0 },
                        light: { attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0 },
                        dark: { attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0 }
                    }
                };
            }
        } catch (error) {
            console.error('获取武器盘属性加成时出错:', error);
        }

        const elementStats = weaponBoardStats.elementStats[element] || {
            attack: 0, hp: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0
        };

        // 计算预期伤害
        const baseAttack = character.attack;
        const elementMultiplier = 1.5; // 克制属性倍率
        const expectedDamage = Math.floor(baseAttack * elementMultiplier);

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

        return `
            <div class="character-card main-character" style="border-color: ${elementColor}">
                <div class="character-header">
                    <h2>${character.name}</h2>
                    <span class="element-badge" style="background-color: ${elementColor}">${elementName}</span>
                </div>

                <div class="character-job">
                    <div class="job-info">
                        <span class="job-name">${jobName}</span>
                        <span class="job-level">Lv.${jobLevel}</span>
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

                <div class="character-stats">
                    <div class="stat-row">
                        <span class="stat-label">等级</span>
                        <span class="stat-value">${character.level}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">攻击力</span>
                        <span class="stat-value">${character.currentStats?.attack || character.baseStats?.attack || 0}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">生命值</span>
                        <span class="stat-value">${character.currentStats?.hp || character.baseStats?.hp || 0} / ${character.currentStats?.maxHp || character.baseStats?.maxHp || 0}</span>
                    </div>
                </div>

                <div class="weapon-board-bonus">
                    <h3>武器盘加成</h3>
                    <div class="bonus-stats">
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

        // 在下一个事件循环中添加事件监听器
        setTimeout(() => {
            try {
                // 添加详情按钮事件
                const detailsButton = document.querySelector('.character-card .details-button');
                if (detailsButton) {
                    detailsButton.addEventListener('click', function() {
                        const characterId = this.getAttribute('data-character-id');
                        if (typeof UI !== 'undefined') {
                            if (typeof UI.showCharacterDetails === 'function') {
                                UI.showCharacterDetails(characterId);
                            } else if (typeof UI.showTempCharacterDetails === 'function') {
                                const character = Character.getCharacter(characterId);
                                if (character) {
                                    UI.showTempCharacterDetails(character);
                                }
                            }
                        }
                    });
                }

                // 添加职业按钮事件
                const jobButton = document.querySelector('.character-card .job-button');
                if (jobButton) {
                    jobButton.addEventListener('click', function() {
                        const characterId = this.getAttribute('data-character-id');
                        if (typeof UI !== 'undefined' && typeof UI.showJobSelection === 'function') {
                            UI.showJobSelection(characterId);
                        } else {
                            console.warn('UI.showJobSelection方法不存在');
                            alert('职业选择功能尚未实现');
                        }
                    });
                }
            } catch (error) {
                console.error('添加事件监听器时出错:', error);
            }
        }, 0);
    }
}