class CharacterCard {
    constructor(character) {
        this.character = character;
    }

    render() {
        const character = this.character;
        const element = character.element;
        const elementName = Character.elements[element].name;
        const elementColor = Character.elements[element].color;
        
        // 获取武器盘属性加成
        const weaponBoardStats = Weapon.calculateWeaponBoardStats(character.weaponBoardId);
        const elementStats = weaponBoardStats.elementStats[element];
        
        // 计算预期伤害
        const baseAttack = character.attack;
        const elementMultiplier = 1.5; // 克制属性倍率
        const expectedDamage = Math.floor(baseAttack * elementMultiplier);
        
        return `
            <div class="character-card" style="border-color: ${elementColor}">
                <div class="character-header">
                    <h2>${character.name}</h2>
                    <span class="element-badge" style="background-color: ${elementColor}">${elementName}</span>
                </div>
                
                <div class="character-stats">
                    <div class="stat-row">
                        <span class="stat-label">等级</span>
                        <span class="stat-value">${character.level}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">攻击力</span>
                        <span class="stat-value">${character.attack}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">生命值</span>
                        <span class="stat-value">${character.hp}</span>
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
            </div>
        `;
    }
} 