/**
 * 技能提示框组件 - 显示技能详细信息
 */
const SkillTooltip = {
    translations: {
        effect_type: {},
        target_type: {}
    }, // 用于存储加载的翻译

    /**
     * 初始化技能提示框
     */
    async init() { // 改为异步函数以加载翻译
        console.log('初始化技能提示框');
        await this.loadTranslations(); // 加载翻译
        this.createTooltipElement();
        this.attachEventListeners();
    },

    /**
     * 加载翻译文件
     */
    async loadTranslations() {
        try {
            const [effectTypeResponse, targetTypeResponse] = await Promise.all([
                fetch('src/data/translations/effect_type_translations_zh.json'),
                fetch('src/data/translations/target_type_translations_zh.json')
            ]);

            if (!effectTypeResponse.ok) {
                console.error('无法加载技能效果翻译文件:', effectTypeResponse.statusText);
            } else {
                this.translations.effect_type = await effectTypeResponse.json();
                console.log('技能效果翻译已加载:', this.translations.effect_type);
            }

            if (!targetTypeResponse.ok) {
                console.error('无法加载目标类型翻译文件:', targetTypeResponse.statusText);
            } else {
                this.translations.target_type = await targetTypeResponse.json();
                console.log('目标类型翻译已加载:', this.translations.target_type);
            }

        } catch (error) {
            console.error('加载翻译文件时出错:', error);
        }
    },

    /**
     * 创建提示框元素
     */
    createTooltipElement() {
        // 先移除可能存在的旧提示框
        const oldTooltip = document.getElementById('skill-tooltip');
        if (oldTooltip) {
            oldTooltip.remove();
        }

        // 创建提示框元素
        const tooltip = document.createElement('div');
        tooltip.id = 'skill-tooltip';
        tooltip.className = 'skill-tooltip';

        // 确保提示框初始状态是隐藏的
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';

        document.body.appendChild(tooltip);

        // 保存引用
        this.tooltipElement = tooltip;

        console.log('技能提示框元素已创建');
    },

    /**
     * 添加事件监听器
     */
    attachEventListeners() {
        // 移除可能存在的旧事件监听器
        if (this.mouseover) document.removeEventListener('mouseover', this.mouseover);
        if (this.mousemove) document.removeEventListener('mousemove', this.mousemove);
        if (this.mouseout) document.removeEventListener('mouseout', this.mouseout);

        // 监听技能项的鼠标事件
        this.mouseover = (event) => {
            const skillItem = this.findSkillElement(event.target);
            if (skillItem) {
                const skillId = skillItem.dataset.skillId;
                if (skillId) {
                    console.log(`显示技能提示框: ${skillId}`);
                    this.showTooltip(skillId, event);
                }
            }
        };

        this.mousemove = (event) => {
            if (this.tooltipElement.classList.contains('visible')) {
                this.positionTooltip(event);
            }
        };

        this.mouseout = (event) => {
            const skillItem = this.findSkillElement(event.target);
            if (skillItem) {
                this.hideTooltip();
            }
        };

        document.addEventListener('mouseover', this.mouseover);
        document.addEventListener('mousemove', this.mousemove);
        document.addEventListener('mouseout', this.mouseout);
    },

    /**
     * 查找技能元素
     * @param {HTMLElement} element - 当前元素
     * @returns {HTMLElement|null} 技能元素
     */
    findSkillElement(element) {
        // 检查元素或其父元素是否是技能项
        if (element.classList.contains('skill-item') || element.classList.contains('member-skill') || element.classList.contains('skill-name')) {
            return element;
        }

        // 检查父元素
        let parent = element.parentElement;
        while (parent) {
            if (parent.classList.contains('skill-item') || parent.classList.contains('member-skill') || parent.classList.contains('skill-name')) {
                return parent;
            }
            parent = parent.parentElement;
        }

        return null;
    },

    /**
     * 显示技能提示框
     * @param {string} skillId - 技能ID
     * @param {MouseEvent} event - 鼠标事件
     */
    showTooltip(skillId, event) {
        // 获取技能信息
        let skillInfo = null;

        // 尝试从JobSystem获取技能信息
        if (typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
            skillInfo = JobSystem.getSkill(skillId);
        } else {
            // 如果JobSystem不可用，尝试直接从模板获取
            // 尝试从RSkillsTemplate获取
            if (typeof RSkillsTemplate !== 'undefined' && RSkillsTemplate.templates && RSkillsTemplate.templates[skillId]) {
                skillInfo = RSkillsTemplate.templates[skillId];
            }
            // 尝试从SRSkillsTemplate获取
            else if (typeof SRSkillsTemplate !== 'undefined' && SRSkillsTemplate.templates && SRSkillsTemplate.templates[skillId]) {
                skillInfo = SRSkillsTemplate.templates[skillId];
            }
            // 尝试从JobSkillsTemplate获取
            else if (typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
                skillInfo = JobSkillsTemplate.templates[skillId];
            }
            // 如果是R角色技能，尝试从r_skills.json获取
            else if (typeof window.r_skills !== 'undefined' && window.r_skills[skillId]) {
                skillInfo = window.r_skills[skillId];
            }
            // 如果是SR角色技能，尝试从sr_skills.json获取
            else if (typeof window.sr_skills !== 'undefined' && window.sr_skills[skillId]) {
                skillInfo = window.sr_skills[skillId];
            }
        }

        if (!skillInfo) {
            console.warn(`找不到技能信息: ${skillId}`);
            // 创建一个基本的技能信息对象
            skillInfo = {
                name: skillId,
                description: '技能信息未找到',
                type: 'unknown',
                effects: []
            };
        }

        // 生成提示框内容
        this.tooltipElement.innerHTML = this.generateTooltipContent(skillInfo);

        // 显示提示框
        this.tooltipElement.classList.add('visible');
        // 确保提示框可见
        this.tooltipElement.style.visibility = 'visible';
        this.tooltipElement.style.opacity = '1';

        // 定位提示框
        this.positionTooltip(event);
    },

    /**
     * 隐藏技能提示框
     */
    hideTooltip() {
        this.tooltipElement.classList.remove('visible');
        // 确保提示框隐藏
        this.tooltipElement.style.visibility = 'hidden';
        this.tooltipElement.style.opacity = '0';
    },

    /**
     * 定位提示框
     * @param {MouseEvent} event - 鼠标事件
     */
    positionTooltip(event) {
        const tooltip = this.tooltipElement;
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;

        // 获取视口尺寸
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 计算位置，避免超出视口
        let left = event.clientX + 15;
        let top = event.clientY + 15;

        // 检查右边界
        if (left + tooltipWidth > viewportWidth) {
            left = event.clientX - tooltipWidth - 15;
        }

        // 检查下边界
        if (top + tooltipHeight > viewportHeight) {
            top = event.clientY - tooltipHeight - 15;
        }

        // 确保不会出现在负值位置
        left = Math.max(0, left);
        top = Math.max(0, top);

        // 设置位置（相对于视口）
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    },

    /**
     * 生成提示框内容
     * @param {object} skill - 技能信息
     * @returns {string} HTML内容
     */
    generateTooltipContent(skill) {
        // 技能类型图标
        const typeIcons = {
            'attack': '⚔️',
            'magic': '✨',
            'heal': '❤️',
            'buff': '⬆️',
            'debuff': '⬇️',
            'defense': '🛡️',
            'aoe': '💥'
        };

        // 效果类型图标
        const effectIcons = {
            'attackUp': '⚔️⬆️',
            'defenseUp': '🛡️⬆️',
            'attackDown': '⚔️⬇️',
            'defenseDown': '🛡️⬇️',
            'heal': '❤️',
            'damage': '💥',
            'dot': '☠️',
            'shield': '🛡️',
            'dispel': '✨',
            'invincible': '✨',
            'daBoost': '⚔️⚔️',
            'taBoost': '⚔️⚔️⚔️',
            'daDown': '⚔️⚔️❌',
            'taDown': '⚔️⚔️⚔️❌',
            'missRate': '👁️❌',
            'damageReduction': '🛡️'
        };

        // 基本信息
        let html = `
            <div class="skill-tooltip-header">
                <div class="skill-tooltip-name">
                    ${skill.name}
                    ${skill.fixed ? '<span class="skill-fixed-tag">固定</span>' : ''}
                    ${skill.passive ? '<span class="skill-passive-tag">被动</span>' : ''}
                </div>
                <div class="skill-tooltip-type skill-type-${skill.type}">
                    ${typeIcons[skill.type] || ''} ${skill.type}
                </div>
            </div>
            <div class="skill-tooltip-description">${skill.description}</div>
        `;

        // 技能统计信息
        html += '<div class="skill-tooltip-stats">';

        // 冷却时间
        if (skill.cooldown) {
            html += `<div class="skill-tooltip-stat"><span class="skill-tooltip-stat-icon">⏱️</span> 冷却: ${skill.cooldown}回合</div>`;
        }

        // 持续时间
        if (skill.duration) {
            html += `<div class="skill-tooltip-stat"><span class="skill-tooltip-stat-icon">⌛</span> 持续: ${skill.duration}回合</div>`;
        }

        // 目标类型
        if (skill.targetType) {
            const translatedTargetType = this.translations.target_type[skill.targetType] || skill.targetType;
            html += `<div class="skill-tooltip-stat"><span class="skill-tooltip-stat-icon">🎯</span> 目标: ${translatedTargetType}</div>`;
        }

        html += '</div>';

        // 效果详情
        if (skill.effects && skill.effects.length > 0) {
            html += '<div class="skill-tooltip-effects">';

            skill.effects.forEach(effect => {
                const effectIcon = effectIcons[effect.type] || '✨';
                const translatedEffectType = this.translations.effect_type[effect.type] || effect.type;
                let effectText = '';

                // 根据效果类型生成描述
                switch (effect.type) {
                    case 'attackUp':
                        effectText = `${this.translations.effect_type['attackUp'] || '攻击力提升'} ${effect.value * 100}%`;
                        if (effect.duration) effectText += ` (持续${effect.duration}回合)`;
                        break;
                    case 'defenseUp':
                        effectText = `${this.translations.effect_type['defenseUp'] || '防御力提升'} ${typeof effect.value === 'number' && effect.value > 1 ? effect.value : effect.value * 100 + '%'}`;
                        if (effect.duration) effectText += ` (持续${effect.duration}回合)`;
                        break;
                    case 'attackDown':
                        effectText = `${this.translations.effect_type['attackDown'] || '攻击力下降'} ${effect.value * 100}%`;
                        if (effect.duration) effectText += ` (持续${effect.duration}回合)`;
                        break;
                    case 'defenseDown':
                        effectText = `${this.translations.effect_type['defenseDown'] || '防御力下降'} ${effect.value * 100}%`;
                        if (effect.duration) effectText += ` (持续${effect.duration}回合)`;
                        break;
                    case 'heal':
                        effectText = `${this.translations.effect_type['heal'] || '治疗'} ${effect.value}`;
                        break;
                    case 'damage':
                        if (effect.minMultiplier && effect.maxMultiplier) {
                            effectText = `造成 ${effect.minMultiplier * 100}%-${effect.maxMultiplier * 100}% 攻击力的${this.translations.effect_type['damage'] || '伤害'}`;
                        } else if (effect.multiplier) {
                            effectText = `造成 ${effect.multiplier * 100}% 攻击力的${this.translations.effect_type['damage'] || '伤害'}`;
                        } else {
                            effectText = `${this.translations.effect_type['damage'] || '造成伤害'}`;
                        }
                        break;
                    case 'dot':
                        effectText = `每回合造成 ${effect.value} 点${this.translations.effect_type['dot'] || '持续伤害'}`;
                        if (effect.duration) effectText += ` (持续${effect.duration}回合)`;
                        break;
                    case 'shield':
                        effectText = `创建 ${effect.value} 点${this.translations.effect_type['shield'] || '护盾'}`;
                        break;
                    case 'dispel':
                        effectText = `${this.translations.effect_type['dispel'] || '驱散增益'} ${effect.count} 个${effect.dispelPositive ? '增益' : '减益'}效果`;
                        break;
                    case 'invincible':
                        effectText = `${this.translations.effect_type['invincible'] || '无敌'} ${effect.maxHits} 次`;
                        if (effect.duration) effectText += ` (持续${effect.duration}回合)`;
                        break;
                    case 'daBoost':
                        effectText = `${this.translations.effect_type['daBoost'] || '双重攻击概率提升'} ${effect.value * 100}%`;
                        if (effect.duration) effectText += ` (持续${effect.duration}回合)`;
                        break;
                    case 'taBoost':
                        effectText = `${this.translations.effect_type['taBoost'] || '三重攻击概率提升'} ${effect.value * 100}%`;
                        if (effect.duration) effectText += ` (持续${effect.duration}回合)`;
                        break;
                    case 'daDown':
                        effectText = `${this.translations.effect_type['daDown'] || '双重攻击概率下降'} ${effect.value * 100}%`;
                        if (effect.duration) effectText += ` (持续${effect.duration}回合)`;
                        break;
                    case 'taDown':
                        effectText = `${this.translations.effect_type['taDown'] || '三重攻击概率下降'} ${effect.value * 100}%`;
                        if (effect.duration) effectText += ` (持续${effect.duration}回合)`;
                        break;
                    case 'missRate':
                        effectText = `${this.translations.effect_type['missRate'] || '命中率下降'} ${effect.value * 100}%`;
                        if (effect.duration) effectText += ` (持续${effect.duration}回合)`;
                        break;
                    case 'damageReduction':
                        effectText = `${this.translations.effect_type['damageReduction'] || '伤害减免'} ${effect.value * 100}%`;
                        if (effect.duration) effectText += ` (持续${effect.duration}回合)`;
                        break;
                    case 'multi_attack':
                        if (effect.minMultiplier && effect.maxMultiplier) {
                            effectText = `造成 ${effect.count} 次 ${effect.minMultiplier * 100}%-${effect.maxMultiplier * 100}% 攻击力的${this.translations.effect_type['multi_attack'] || '多段攻击'}`;
                        } else if (effect.multiplier) {
                            effectText = `造成 ${effect.count} 次 ${effect.multiplier * 100}% 攻击力的${this.translations.effect_type['multi_attack'] || '多段攻击'}`;
                        } else {
                            effectText = `造成 ${effect.count} 次${this.translations.effect_type['multi_attack'] || '多段攻击'}`;
                        }
                        break;
                    case 'proc':
                        effectText = `${effect.chance * 100}% 几率${this.translations.effect_type['proc'] || '效果触发'}`;
                        if (effect.onAttack) effectText += '（攻击时）';
                        break;
                    case 'endOfTurn':
                        effectText = `${this.translations.effect_type['endOfTurn'] || '回合结束效果'}`;
                        break;
                    case 'cover':
                        if (effect.chance) {
                            effectText = `${effect.chance * 100}% 几率代替队友承受${this.translations.effect_type['cover'] || '援护'}伤害`;
                        } else {
                            effectText = `代替队友承受${this.translations.effect_type['cover'] || '援护'}伤害`;
                        }
                        if (effect.duration) effectText += ` (持续${effect.duration}回合)`;
                        break;
                    case 'revive':
                        effectText = `${this.translations.effect_type['revive'] || '复活'}倒下的队友，恢复 ${effect.hpRatio * 100}% 生命值`;
                        break;
                    case 'ignoreDebuff':
                        effectText = `${this.translations.effect_type['ignoreDebuff'] || '无视弱体'} ${effect.debuffType === 'missRate' ? (this.translations.effect_type['missRate'] || '命中率降低') : effect.debuffType} 减益效果`;
                        break;
                    default:
                        effectText = effect.name || translatedEffectType;
                }

                html += `
                    <div class="skill-tooltip-effect">
                        <div class="skill-tooltip-effect-icon effect-type-${effect.type}">${effectIcon}</div>
                        <div class="skill-tooltip-effect-text">${effectText}</div>
                    </div>
                `;

                // 如果有子效果，也显示
                if (effect.effect) {
                    const subEffect = effect.effect;
                    const subEffectIcon = effectIcons[subEffect.type] || '✨';
                    let subEffectText = '';

                    // 简单处理子效果
                    if (subEffect.type === 'damage') {
                        if (subEffect.minMultiplier && subEffect.maxMultiplier) {
                            subEffectText = `造成 ${subEffect.minMultiplier * 100}%-${subEffect.maxMultiplier * 100}% 攻击力的伤害`;
                        } else if (subEffect.multiplier) {
                            subEffectText = `造成 ${subEffect.multiplier * 100}% 攻击力的伤害`;
                        }
                    }

                    if (subEffectText) {
                        html += `
                            <div class="skill-tooltip-effect" style="margin-left: 15px;">
                                <div class="skill-tooltip-effect-icon effect-type-${subEffect.type}">${subEffectIcon}</div>
                                <div class="skill-tooltip-effect-text">${subEffectText}</div>
                            </div>
                        `;
                    }
                }
            });

            html += '</div>';
        }

        return html;
    }
};
