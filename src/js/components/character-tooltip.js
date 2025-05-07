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
        if (!character.currentStats && character.baseStats) {
            character.currentStats = JSON.parse(JSON.stringify(character.baseStats));
        }
        // 确保 maxHp 存在
        if (character.currentStats && typeof character.currentStats.maxHp === 'undefined' && character.currentStats.hp) {
            character.currentStats.maxHp = character.currentStats.hp;
        }


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

        // 优先使用 currentStats，如果不存在则使用 baseStats
        const stats = character.currentStats || character.baseStats || {};
        const hp = stats.hp !== undefined ? Math.round(stats.hp) : 'N/A';
        const maxHp = stats.maxHp !== undefined ? Math.round(stats.maxHp) : (stats.hp !== undefined ? Math.round(stats.hp) : 'N/A');
        const attack = stats.attack !== undefined ? Math.round(stats.attack) : 'N/A';
        const defense = stats.defense !== undefined ? Math.round(stats.defense) : 'N/A';
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
            <div class="skill-tooltip-stats character-tooltip-stats">
                <div><span class="skill-tooltip-stat-icon">❤️</span> HP: ${hp} / ${maxHp}</div>
                <div><span class="skill-tooltip-stat-icon">⚔️</span> 攻击: ${attack}</div>
                <div><span class="skill-tooltip-stat-icon">🛡️</span> 防御: ${defense}</div>
            </div>
        `;

        // 技能信息
        if (character.skills && character.skills.length > 0) {
            html += '<div class="skill-tooltip-subheader">技能:</div>';
            html += '<div class="character-tooltip-skills">';
            character.skills.forEach(skillId => {
                let skillName = skillId;
                let skillDescription = '点击查看详情'; // 默认描述
                // 尝试从 SkillLoader 或 JobSystem 获取技能详细信息
                if (typeof SkillLoader !== 'undefined' && SkillLoader.getSkillById) {
                    const skillData = SkillLoader.getSkillById(skillId);
                    if (skillData) {
                        skillName = skillData.name;
                        skillDescription = skillData.description || skillDescription;
                    }
                } else if (typeof JobSystem !== 'undefined' && JobSystem.getSkill) {
                     const skillData = JobSystem.getSkill(skillId);
                     if (skillData) {
                        skillName = skillData.name;
                        skillDescription = skillData.description || skillDescription;
                    }
                }
                html += `<div class="character-tooltip-skill-item" data-skill-id="${skillId}">${skillName}</div>`;
            });
            html += '</div>';
        }
        
        // 如果有武器盘加成，显示加成后的属性
        if (character.weaponBonusStats && JSON.stringify(character.weaponBonusStats) !== JSON.stringify(character.baseStats)) {
            html += '<div class="skill-tooltip-subheader">武器盘加成后属性:</div>';
            html += '<div class="skill-tooltip-stats character-tooltip-stats">';
            const wbs = character.weaponBonusStats;
            const wbHp = wbs.hp !== undefined ? Math.round(wbs.hp) : 'N/A';
            const wbMaxHp = wbs.maxHp !== undefined ? Math.round(wbs.maxHp) : (wbs.hp !== undefined ? Math.round(wbs.hp) : 'N/A');
            const wbAttack = wbs.attack !== undefined ? Math.round(wbs.attack) : 'N/A';
            const wbDefense = wbs.defense !== undefined ? Math.round(wbs.defense) : 'N/A';
            html += `<div><span class="skill-tooltip-stat-icon">❤️</span> HP: ${wbHp} / ${wbMaxHp}</div>`;
            html += `<div><span class="skill-tooltip-stat-icon">⚔️</span> 攻击: ${wbAttack}</div>`;
            html += `<div><span class="skill-tooltip-stat-icon">🛡️</span> 防御: ${wbDefense}</div>`;
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