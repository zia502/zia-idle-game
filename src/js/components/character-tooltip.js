/**
 * 角色提示框组件 - 显示角色详细信息
 */
const CharacterTooltip = {
    tooltipElement: null,
    characterDataCache: {}, // 用于缓存角色数据，避免重复获取

    /**
     * 初始化角色提示框
     */
    init() {
        console.log('初始化角色提示框');
        this.createTooltipElement();
        this.attachEventListeners();
    },

    /**
     * 创建提示框元素
     */
    createTooltipElement() {
        const oldTooltip = document.getElementById('character-tooltip');
        if (oldTooltip) {
            oldTooltip.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.id = 'character-tooltip';
        tooltip.className = 'character-tooltip skill-tooltip'; // 复用一些skill-tooltip的样式
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
        tooltip.style.position = 'fixed'; // 使用fixed定位，以便在滚动时也能正确定位
        tooltip.style.zIndex = '10000'; // 确保在最上层
        document.body.appendChild(tooltip);
        this.tooltipElement = tooltip;
        console.log('角色提示框元素已创建');
    },

    /**
     * 添加事件监听器
     */
    attachEventListeners() {
        // 使用事件委托，监听更大范围的父元素，例如 document.body
        // 这样可以处理动态添加的角色卡片
        document.body.addEventListener('mouseover', (event) => {
            const characterCard = this.findCharacterCardElement(event.target);
            if (characterCard) {
                const characterId = characterCard.dataset.characterId;
                const characterInstanceId = characterCard.dataset.characterInstanceId; // 用于区分同一角色模板的不同实例
                if (characterId) {
                    this.showTooltip(characterId, event, characterInstanceId);
                }
            }
        });

        document.body.addEventListener('mouseout', (event) => {
            const characterCard = this.findCharacterCardElement(event.target);
            if (characterCard) {
                this.hideTooltip();
            }
        });

        document.body.addEventListener('mousemove', (event) => {
            if (this.tooltipElement && this.tooltipElement.style.visibility === 'visible') {
                this.positionTooltip(event);
            }
        });
    },

    /**
     * 查找角色卡片元素
     * @param {HTMLElement} element - 当前元素
     * @returns {HTMLElement|null} 角色卡片元素
     */
    findCharacterCardElement(element) {
        // 向上查找具有 data-character-id 属性的元素
        let currentElement = element;
        while (currentElement && currentElement !== document.body) {
            if (currentElement.dataset && currentElement.dataset.characterId) {
                // 确保是角色卡片相关的元素，可以根据具体类名进一步判断
                // 例如: currentElement.classList.contains('character-card')
                return currentElement;
            }
            currentElement = currentElement.parentElement;
        }
        return null;
    },

    /**
     * 显示角色提示框
     * @param {string} characterId - 角色ID (模板ID)
     * @param {MouseEvent} event - 鼠标事件
     * @param {string} [characterInstanceId] - 角色实例ID (可选, 用于区分队伍中相同ID的角色)
     */
    async showTooltip(characterId, event, characterInstanceId) {
        let character = null;

        // 优先从 Character 模块获取已招募或队伍中的角色实例
        if (characterInstanceId && typeof Character !== 'undefined' && typeof Character.getCharacter === 'function') {
            character = Character.getCharacter(characterInstanceId);
        }
        
        // 如果没有实例ID或者找不到实例，则尝试根据模板ID获取
        // 这通常用于酒馆等只显示模板信息的地方
        if (!character && typeof Character !== 'undefined') {
            // 尝试从已加载的 R, SR, SSR 角色列表中查找
            const allCharacters = [
                ...(Character.rCharacters || []),
                ...(Character.srCharacters || []),
                ...(Character.ssrCharacters || [])
            ];
            character = allCharacters.find(c => c.id === characterId);

            // 如果在列表中找不到，并且 Character.characters 中有这个 ID (可能是主角或特殊角色)
            if (!character && Character.characters && Character.characters[characterId]) {
                 character = Character.getCharacter(characterId); // 使用 getCharacter 获取，确保数据一致性
            }
            
            // 如果还是找不到，并且有 Tavern 模块，尝试从 Tavern 的可招募角色中获取
            if (!character && typeof Tavern !== 'undefined' && Tavern.recruitableCharacters) {
                const tavernChar = Tavern.recruitableCharacters.find(c => c.id === characterId);
                if (tavernChar) {
                    // Tavern 中的角色数据可能不完整，需要用 Character.createCharacter 补充
                    character = Character.createCharacter(tavernChar);
                }
            }
        }


        if (!character) {
            // 如果在 Character 模块中找不到，并且 characterId 可能是 Game.player.id
            if (typeof Game !== 'undefined' && Game.player && Game.player.id === characterId) {
                character = Game.player;
            } else {
                console.warn(`角色数据未找到: ${characterId}`);
                this.tooltipElement.innerHTML = `<div>角色数据未找到: ${characterId}</div>`;
                this.tooltipElement.style.visibility = 'visible';
                this.tooltipElement.style.opacity = '1';
                this.positionTooltip(event);
                return;
            }
        }
        
        // 对于从模板获取的角色，其 currentStats 可能不存在，需要处理
        // 同时确保 baseStats, weaponBonusStats, multiBonusStats 也存在，至少是空对象，以避免后续访问 undefined
        character.baseStats = character.baseStats || {};
        character.weaponBonusStats = character.weaponBonusStats || {};
        character.multiBonusStats = character.multiBonusStats || {};
        
        if (!character.currentStats) {
            // 如果 currentStats 不存在，尝试基于其他属性计算或至少初始化
            // 这里的逻辑可能需要根据 character.js 中的最终计算方式调整
            // 简单回退到 baseStats + multiBonusStats (如果 weaponBonusStats 应该包含 baseStats)
            // 或者直接使用 baseStats 作为基础
            let tempCurrentStats = JSON.parse(JSON.stringify(character.weaponBonusStats || character.baseStats || {}));
            if (character.multiBonusStats) {
                for (const key in character.multiBonusStats) {
                    if (tempCurrentStats.hasOwnProperty(key)) {
                        tempCurrentStats[key] += character.multiBonusStats[key];
                    } else {
                        tempCurrentStats[key] = character.multiBonusStats[key];
                    }
                }
            }
            character.currentStats = tempCurrentStats;
        }

        // 确保 maxHp 存在于所有相关属性对象中，如果只有 hp
        const ensureMaxHp = (statsObj) => {
            if (statsObj && typeof statsObj.maxHp === 'undefined' && statsObj.hp !== undefined) {
                statsObj.maxHp = statsObj.hp;
            }
        };
        ensureMaxHp(character.baseStats);
        ensureMaxHp(character.weaponBonusStats);
        ensureMaxHp(character.multiBonusStats); // 虽然 multiBonus 通常是增量，但以防万一
        ensureMaxHp(character.currentStats);


        this.tooltipElement.innerHTML = this.generateTooltipContent(character);
        this.tooltipElement.style.visibility = 'visible';
        this.tooltipElement.style.opacity = '1';
        this.positionTooltip(event);
    },

    /**
     * 隐藏角色提示框
     */
    hideTooltip() {
        if (this.tooltipElement) {
            this.tooltipElement.style.visibility = 'hidden';
            this.tooltipElement.style.opacity = '0';
        }
    },

    /**
     * 定位提示框
     * @param {MouseEvent} event - 鼠标事件
     */
    positionTooltip(event) {
        const tooltip = this.tooltipElement;
        if (!tooltip) return;

        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = event.clientX + 15; // 默认在鼠标右下方
        let top = event.clientY + 15;

        // 避免超出右边界
        if (left + tooltipWidth > viewportWidth) {
            left = event.clientX - tooltipWidth - 15; // 移到鼠标左方
        }
        // 避免超出下边界
        if (top + tooltipHeight > viewportHeight) {
            top = event.clientY - tooltipHeight - 15; // 移到鼠标上方
        }
        // 避免超出左边界 (当移到鼠标左方时)
        if (left < 0) {
            left = 5;
        }
        // 避免超出上边界 (当移到鼠标上方时)
        if (top < 0) {
            top = 5;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    },

    /**
     * 生成提示框内容
     * @param {object} character - 角色对象
     * @returns {string} HTML内容
     */
    generateTooltipContent(character) {
        console.log('generateTooltipContent', character);
        if (!character) return '角色信息不可用';

        const name = character.name || '未知角色';
        const level = character.level || 1;
        const rarityData = (typeof Character !== 'undefined' && Character.rarities && Character.rarities[character.rarity])
            ? Character.rarities[character.rarity]
            : { name: character.rarity || '未知', color: '#ffffff' };
        const attributeData = (typeof Character !== 'undefined' && Character.attributes && Character.attributes[character.attribute])
            ? Character.attributes[character.attribute]
            : { name: character.attribute || '未知' };
        const typeData = (typeof Character !== 'undefined' && Character.types && Character.types[character.type])
            ? Character.types[character.type]
            : { name: character.type || '未知' };

        let jobName = '无';
        if (character.job && character.job.current && typeof JobSystem !== 'undefined' && JobSystem.getJobDetails) {
            const jobDetails = JobSystem.getJobDetails(character.job.current);
            jobName = jobDetails ? jobDetails.name : character.job.current;
        } else if (character.job && character.job.current) {
            jobName = character.job.current;
        }

        let html = `
            <div class="skill-tooltip-header">
                <div class="skill-tooltip-name" style="color: ${rarityData.color};">${name}</div>
                <div class="skill-tooltip-level">Lv. ${level}</div>
            </div>
            <div class="character-tooltip-info">
                <div><strong>稀有度:</strong> <span style="color: ${rarityData.color};">${rarityData.name}</span></div>
                <div><strong>属性:</strong> ${attributeData.name}</div>
                <div><strong>类型:</strong> ${typeData.name}</div>
                ${character.job ? `<div><strong>职业:</strong> ${jobName} (Lv. ${character.job.level || 1})</div>` : ''}
            </div>
        `;

        // 新的属性显示逻辑
        let statsHtml = `<div class="skill-tooltip-subheader">属性:</div>`;
        statsHtml += `<div class="skill-tooltip-stats character-tooltip-stats">`;

        const weaponStats = character.weaponBonusStats || {};
        const multiStats = character.multiBonusStats || {};
        const currentStats = character.currentStats || {}; // 确保 currentStats 可用

        // statDisplayConfig 定义了要显示的属性及其配置
        // 注意：请根据 character.js 中的实际属性键名调整 'key'
        const statDisplayConfig = [
            { key: 'hp', name: '生命', icon: '❤️', isPercent: false, alwaysShow: true },
            { key: 'attack', name: '攻击', icon: '⚔️', isPercent: false },
            { key: 'defense', name: '防御', icon: '🛡️', isPercent: false },
            { key: 'crit', name: '暴击率', icon: '🎯', isPercent: true }, // 假设原键名为 crit
            { key: 'critDmg', name: '暴击伤害', icon: '💥', isPercent: true }, // 假设原键名为 critDmg
            { key: 'daRate', name: '连击率', icon: '✨', isPercent: true }, // 假设键名
            { key: 'taRate', name: '三连击率', icon: '🌟', isPercent: true }, // 假设键名
            // { key: 'speed', name: '速度', icon: '💨', isPercent: false },
            // { key: 'effectHit', name: '效果命中', icon: '🔗', isPercent: true },
            // { key: 'effectResist', name: '效果抵抗', icon: '🛡️‍✨', isPercent: true },
        ];

        const formatDisplayValue = (value, isPercent) => {
            if (value === undefined || value === null || isNaN(parseFloat(value))) return (isPercent ? '0.0%' : '0');
            if (isPercent) return `${(parseFloat(value) * 100).toFixed(1)}%`;
            return Math.round(parseFloat(value));
        };
        
        statDisplayConfig.forEach(config => {
            const statKey = config.key;
            const baseValue = parseFloat(weaponStats[statKey]); // 可能为 NaN
            const multiValue = parseFloat(multiStats[statKey]); // 可能为 NaN
            
            let shouldShow = weaponStats.hasOwnProperty(statKey) ||
                             (multiStats.hasOwnProperty(statKey) && !isNaN(multiValue) && multiValue !== 0) ||
                             config.alwaysShow;

            if (!shouldShow && currentStats.hasOwnProperty(statKey) && !multiStats.hasOwnProperty(statKey)) {
                // 特殊情况：属性在 currentStats 中，但不在 multiStats 中（意味着不受 multiBonus 影响）
                const currentValue = parseFloat(currentStats[statKey]);
                let statLine = `<div><span class="skill-tooltip-stat-icon">${config.icon}</span> ${config.name}: ${formatDisplayValue(currentValue, config.isPercent)}`;
                if (statKey === 'hp') {
                    const currentMaxHp = parseFloat(currentStats.maxHp) || currentValue;
                    statLine += ` / ${formatDisplayValue(currentMaxHp, false)}`;
                }
                statLine += `</div>`;
                statsHtml += statLine;
                return;
            }
            
            if (!shouldShow) return;

            const actualBaseValue = isNaN(baseValue) ? 0 : baseValue;
            const actualMultiValue = isNaN(multiValue) ? 0 : multiValue;

            let baseValueDisplayStr = formatDisplayValue(actualBaseValue, config.isPercent);
            let multiValueDisplayStr = "";

            if (actualMultiValue > 0) {
                multiValueDisplayStr = ` <span class="stat-multibonus-positive">+${formatDisplayValue(actualMultiValue, config.isPercent)}</span>`;
            } else if (actualMultiValue < 0) {
                multiValueDisplayStr = ` <span class="stat-multibonus-negative">${formatDisplayValue(actualMultiValue, config.isPercent)}</span>`;
            }

            let statLine = `<div><span class="skill-tooltip-stat-icon">${config.icon}</span> ${config.name}: ${baseValueDisplayStr}${multiValueDisplayStr}`;

            if (statKey === 'hp') {
                const weaponMaxHp = parseFloat(weaponStats.maxHp);
                const multiMaxHpVal = parseFloat(multiStats.maxHp);

                const actualBaseMaxHp = isNaN(weaponMaxHp) ? actualBaseValue : weaponMaxHp;
                const actualMultiMaxHp = isNaN(multiMaxHpVal) ? 0 : multiMaxHpVal;
                
                let maxHpBaseDisplayStr = formatDisplayValue(actualBaseMaxHp, false);
                let maxHpMultiDisplayStr = "";

                if (actualMultiMaxHp > 0) {
                    maxHpMultiDisplayStr = ` <span class="stat-multibonus-positive">+${formatDisplayValue(actualMultiMaxHp, false)}</span>`;
                } else if (actualMultiMaxHp < 0) {
                    maxHpMultiDisplayStr = ` <span class="stat-multibonus-negative">${formatDisplayValue(actualMultiMaxHp, false)}</span>`;
                }
            }
            statLine += `</div>`;
            statsHtml += statLine;
        });

        statsHtml += `</div>`;
        html += statsHtml;

        // 技能信息
        if (character.skills && character.skills.length > 0) {
            html += '<div class="skill-tooltip-subheader">技能:</div>';
            html += '<div class="character-tooltip-skills">';
            character.skills.forEach(skillId => {
                let skillName = skillId;
                if (typeof SkillLoader !== 'undefined' && SkillLoader.getSkillById) {
                    const skillData = SkillLoader.getSkillById(skillId);
                    if (skillData) skillName = skillData.name;
                } else if (typeof JobSystem !== 'undefined' && JobSystem.getSkill) {
                     const skillData = JobSystem.getSkill(skillId);
                     if (skillData) skillName = skillData.name;
                }
                html += `<div class="character-tooltip-skill-item" data-skill-id="${skillId}">${skillName}</div>`;
            });
            html += '</div>';
        }
        
        return html;
    }
};

// 确保在 DOM 加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CharacterTooltip.init());
} else {
    CharacterTooltip.init();
}