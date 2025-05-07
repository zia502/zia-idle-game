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

        // Helper function to format stat values
        const formatStatValue = (value, isPercent = false) => {
            if (value === undefined || value === null) return 'N/A';
            if (isPercent) return `${(value * 100).toFixed(1)}%`;
            return Math.round(value);
        };

        // Helper function to generate HTML for a stats block
        const generateSingleStatsBlock = (statsObject, title) => {
            if (!statsObject || Object.keys(statsObject).length === 0) return ''; // Do not display if statsObject is empty
            
            let blockHtml = `<div class="skill-tooltip-subheader">${title}:</div>`;
            blockHtml += '<div class="skill-tooltip-stats character-tooltip-stats">';
            
            const hp = formatStatValue(statsObject.hp);
            // Ensure maxHp is derived correctly if not present
            const maxHpToDisplay = statsObject.maxHp !== undefined ? formatStatValue(statsObject.maxHp) : (statsObject.hp !== undefined ? formatStatValue(statsObject.hp) : 'N/A');

            const attack = formatStatValue(statsObject.attack);
            const defense = formatStatValue(statsObject.defense);
            const crit = formatStatValue(statsObject.crit, true);
            const critDmg = formatStatValue(statsObject.critDmg, true);
            // Add other stats like speed, effectHit, effectResist if they exist in statsObject
            // const speed = formatStatValue(statsObject.speed);

            blockHtml += `<div><span class="skill-tooltip-stat-icon">❤️</span> HP: ${hp}${maxHpToDisplay !== 'N/A' && hp !== maxHpToDisplay ? ' / ' + maxHpToDisplay : (hp !== 'N/A' && maxHpToDisplay === 'N/A' ? ' / ' + hp : (hp !== 'N/A' ? ' / ' + maxHpToDisplay : ''))}</div>`;
            if (statsObject.attack !== undefined) blockHtml += `<div><span class="skill-tooltip-stat-icon">⚔️</span> 攻击: ${attack}</div>`;
            if (statsObject.defense !== undefined) blockHtml += `<div><span class="skill-tooltip-stat-icon">🛡️</span> 防御: ${defense}</div>`;
            if (statsObject.crit !== undefined) blockHtml += `<div><span class="skill-tooltip-stat-icon">🎯</span> 暴击: ${crit}</div>`;
            if (statsObject.critDmg !== undefined) blockHtml += `<div><span class="skill-tooltip-stat-icon">💥</span> 暴伤: ${critDmg}</div>`;
            // if (statsObject.speed !== undefined) blockHtml += `<div><span class="skill-tooltip-stat-icon">💨</span> 速度: ${speed}</div>`;
            blockHtml += '</div>';
            return blockHtml;
        };

        let statsHtml = '';

        // 1. 原始基础属性 (character.baseStats)
        if (character.baseStats && Object.keys(character.baseStats).length > 0) {
            statsHtml += generateSingleStatsBlock(character.baseStats, '基础属性');
        }

        // 2. 武器盘加成后的属性 (character.weaponBonusStats)
        // Only show if different from baseStats or if baseStats is not shown (e.g. not available)
        if (character.weaponBonusStats && Object.keys(character.weaponBonusStats).length > 0 &&
            (!character.baseStats || Object.keys(character.baseStats).length === 0 || JSON.stringify(character.weaponBonusStats) !== JSON.stringify(character.baseStats))) {
            statsHtml += generateSingleStatsBlock(character.weaponBonusStats, '武器盘加成后');
        }

        // 3. 突破系统附加值 (character.multiBonusStats)
        if (character.multiBonusStats && Object.keys(character.multiBonusStats).length > 0) {
            const hasActualMultiBonus = Object.values(character.multiBonusStats).some(val => val !== 0 && val !== undefined && val !== null);
            if (hasActualMultiBonus) {
                statsHtml += generateSingleStatsBlock(character.multiBonusStats, '突破系统加成');
            }
        }
        
        // 4. 最终显示的总属性 (character.currentStats)
        // Determine the last significant stat block shown for comparison
        let lastShownStats = null;
        if (character.multiBonusStats && Object.values(character.multiBonusStats).some(val => val !== 0 && val !== undefined && val !== null)) {
            // If multiBonus was shown, currentStats should be compared to weaponBonusStats (or baseStats if weaponBonus wasn't shown)
            // This logic is tricky because multiBonus is an *addition* to weaponBonusStats.
            // So currentStats = weaponBonusStats + multiBonusStats.
            // We want to show currentStats if it's meaningfully different from weaponBonusStats (i.e., multiBonus had an effect).
            lastShownStats = character.weaponBonusStats;
        } else if (character.weaponBonusStats && Object.keys(character.weaponBonusStats).length > 0 &&
                   (!character.baseStats || Object.keys(character.baseStats).length === 0 || JSON.stringify(character.weaponBonusStats) !== JSON.stringify(character.baseStats))) {
            lastShownStats = character.weaponBonusStats;
        } else if (character.baseStats && Object.keys(character.baseStats).length > 0) {
            lastShownStats = character.baseStats;
        }

        if (character.currentStats && Object.keys(character.currentStats).length > 0) {
            if (!lastShownStats || JSON.stringify(character.currentStats) !== JSON.stringify(lastShownStats)) {
                statsHtml += generateSingleStatsBlock(character.currentStats, '最终属性 (总计)');
            } else if (statsHtml.trim() === "" && character.baseStats && JSON.stringify(character.currentStats) === JSON.stringify(character.baseStats)) {
                // If only base stats exist and currentStats is same as baseStats, and no other blocks were shown, show it as "最终属性"
                 statsHtml += generateSingleStatsBlock(character.currentStats, '最终属性 (总计)');
            }
        }
        
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