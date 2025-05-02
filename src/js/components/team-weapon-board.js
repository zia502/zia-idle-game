/**
 * 队伍武器盘管理
 */
const TeamWeaponBoard = {
    /**
     * 初始化队伍武器盘
     */
    init() {
        console.log('初始化队伍武器盘');
        this.renderTeamWeaponBoard();
        this.bindEvents();
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 监听队伍变化事件
        document.addEventListener('teamChanged', () => {
            console.log('TeamWeaponBoard 收到队伍变化事件');
            this.renderTeamWeaponBoard();
        });

        // 监听武器变化事件 (旧版事件系统)
        document.addEventListener('weaponChanged', () => {
            console.log('TeamWeaponBoard 收到武器变化事件');
            this.renderTeamWeaponBoard();
        });

        // 新版事件系统
        if (typeof Events !== 'undefined') {
            Events.on('team:updated', () => {
                console.log('TeamWeaponBoard 收到队伍更新事件');
                this.renderTeamWeaponBoard();
            });

            Events.on('weapon:updated', () => {
                console.log('TeamWeaponBoard 收到武器更新事件');
                this.renderTeamWeaponBoard();
            });
        }
    },

    /**
     * 渲染队伍武器盘
     */
    renderTeamWeaponBoard() {
        try {
            const container = document.getElementById('team-weapon-board');
            if (!container) return;

            // 检查Team和Weapon模块是否存在
            if (typeof Team === 'undefined' || typeof Weapon === 'undefined') {
                container.innerHTML = '<div class="empty-message">武器系统未加载</div>';
                return;
            }

            // 获取当前队伍
            const activeTeamId = Game.state.activeTeamId;
            if (!activeTeamId || !Team.teams[activeTeamId]) {
                container.innerHTML = '<div class="empty-message">未选择队伍</div>';
                return;
            }

            const team = Team.teams[activeTeamId];
            const weaponBoardId = team.weaponBoardId;

            // 如果队伍没有武器盘，创建一个
            if (!weaponBoardId) {
                const weaponBoardName = `board_${team.id}`;
                const weaponBoard = Weapon.createWeaponBoard(weaponBoardName, 10); // 10个槽位
                team.weaponBoardId = weaponBoard.id;
                console.log(`为队伍 ${team.name} 创建武器盘: ${weaponBoard.id}`);

                // 保存游戏状态
                if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                    setTimeout(() => Game.saveGame(), 100);
                }
            }

            // 获取武器盘
            console.log(`尝试获取武器盘: ${weaponBoardId}`);
            console.log('所有武器盘:', Weapon.weaponBoards);

            const weaponBoard = Weapon.getWeaponBoard(weaponBoardId);
            if (!weaponBoard) {
                console.error(`未找到武器盘: ${weaponBoardId}`);

                // 尝试创建新的武器盘
                const weaponBoardName = `board_${team.id}`;
                const newWeaponBoard = Weapon.createWeaponBoard(weaponBoardName, 10);
                team.weaponBoardId = newWeaponBoard.id;
                console.log(`为队伍 ${team.name} 创建新武器盘: ${newWeaponBoard.id}`);

                // 保存游戏状态
                if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                    setTimeout(() => Game.saveGame(), 100);
                }

                // 使用新创建的武器盘
                const updatedWeaponBoard = Weapon.getWeaponBoard(newWeaponBoard.id);
                if (!updatedWeaponBoard) {
                    container.innerHTML = '<div class="empty-message">创建武器盘失败</div>';
                    return;
                }

                // 继续使用新创建的武器盘
                return this.renderTeamWeaponBoard();
            }

            // 构建武器盘HTML
            let html = `
                <div class="team-weapon-board-container">
                    <div class="team-weapon-board-header">
                        <div class="team-weapon-board-title">${team.name} 的武器盘</div>
                    </div>
                    <div class="team-weapon-board-content">
                        <div class="team-main-weapon-slot">
                            <!-- 主手武器槽 -->
                            ${this.renderWeaponSlot(weaponBoard, 'main')}
                        </div>
                        <div class="team-sub-weapons-grid">
                            <!-- 9个副武器槽 -->
                            ${this.renderSubWeaponSlots(weaponBoard)}
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = html;

            // 绑定武器槽点击事件
            this.bindWeaponSlotEvents();
        } catch (error) {
            console.error('渲染队伍武器盘时出错:', error);
            const container = document.getElementById('team-weapon-board');
            if (container) {
                container.innerHTML = '<div class="empty-message">加载武器盘时出错</div>';
            }
        }
    },

    /**
     * 渲染主武器槽
     * @param {object} weaponBoard - 武器盘对象
     * @param {string} slotType - 槽位类型
     * @returns {string} 武器槽HTML
     */
    renderWeaponSlot(weaponBoard, slotType) {
        try {
            // 获取槽位中的武器
            const weaponId = weaponBoard.slots[slotType];

            if (!weaponId) {
                return `<div class="team-weapon-slot" data-slot="${slotType}">主手武器</div>`;
            }

            // 获取武器信息
            const weapon = Weapon.getWeapon(weaponId);
            if (!weapon) {
                return `<div class="team-weapon-slot" data-slot="${slotType}">主手武器</div>`;
            }

            // 获取武器稀有度样式
            const rarityClass = this.getRarityClass(weapon.rarity);
            const currentStats = Weapon.calculateCurrentStats(weapon);

            // 构建突破星星HTML
            const breakthroughStars = Array(4).fill().map((_, index) => {
                const isLast = index === 3;
                const isFinal = weapon.breakthrough === 4;
                const currentBreakthrough = weapon.breakthrough || 0;

                if (isLast) {
                    return `<div class="star ${isFinal ? 'final' : 'breakthrough-4'}"></div>`;
                } else {
                    if (index < currentBreakthrough) {
                        return `<div class="star breakthrough-1"></div>`;
                    } else {
                        return `<div class="star breakthrough-0"></div>`;
                    }
                }
            }).join('');

            return `
                <div class="team-weapon-slot ${rarityClass}" data-slot="${slotType}" data-weapon-id="${weaponId}">
                    <div class="team-weapon-item">
                        <div class="team-weapon-icon">${weapon.name.charAt(0)}</div>
                        <div class="team-weapon-name">${weapon.name}</div>
                        <div class="team-weapon-type">
                            <img src="src/assets/${UI.weaponTypeIcons[weapon.type]}" class="type-icon" alt="${weapon.type}">
                            ${UI.getWeaponTypeName(weapon.type)}
                        </div>
                        <div class="team-weapon-element">
                            <img src="src/assets/${UI.elementIcons[weapon.element]}" class="element-icon" alt="${weapon.element}">
                            ${UI.getWeaponElementName(weapon.element)}
                        </div>
                        <div class="team-weapon-stats">
                            <div>等级: ${weapon.level}/${Weapon.breakthroughLevels[weapon.breakthrough || 0]}</div>
                            <div>攻击: ${currentStats.attack}</div>
                            <div>生命: ${currentStats.hp}</div>
                        </div>
                        <div class="team-weapon-breakthrough">
                            ${breakthroughStars}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('渲染武器槽时出错:', error);
            return `<div class="team-weapon-slot" data-slot="${slotType}">主手武器</div>`;
        }
    },

    /**
     * 渲染副武器槽
     * @param {object} weaponBoard - 武器盘对象
     * @returns {string} 副武器槽HTML
     */
    renderSubWeaponSlots(weaponBoard) {
        try {
            let html = '';

            // 渲染9个副武器槽
            for (let i = 1; i <= 9; i++) {
                const slotType = `sub${i}`;
                const weaponId = weaponBoard.slots[slotType];

                if (!weaponId) {
                    html += `<div class="team-weapon-slot" data-slot="${slotType}">副武器${i}</div>`;
                    continue;
                }

                // 获取武器信息
                const weapon = Weapon.getWeapon(weaponId);
                if (!weapon) {
                    html += `<div class="team-weapon-slot" data-slot="${slotType}">副武器${i}</div>`;
                    continue;
                }

                // 获取武器稀有度样式
                const rarityClass = this.getRarityClass(weapon.rarity);
                const currentStats = Weapon.calculateCurrentStats(weapon);

                // 构建突破星星HTML
                const breakthroughStars = Array(4).fill().map((_, index) => {
                    const isLast = index === 3;
                    const isFinal = weapon.breakthrough === 4;
                    const currentBreakthrough = weapon.breakthrough || 0;

                    if (isLast) {
                        return `<div class="star ${isFinal ? 'final' : 'breakthrough-4'}"></div>`;
                    } else {
                        if (index < currentBreakthrough) {
                            return `<div class="star breakthrough-1"></div>`;
                        } else {
                            return `<div class="star breakthrough-0"></div>`;
                        }
                    }
                }).join('');

                html += `
                    <div class="team-weapon-slot ${rarityClass}" data-slot="${slotType}" data-weapon-id="${weaponId}">
                        <div class="team-weapon-item">
                            <div class="team-weapon-icon">${weapon.name.charAt(0)}</div>
                            <div class="team-weapon-name">${weapon.name}</div>
                            <div class="team-weapon-type">
                                <img src="src/assets/${UI.weaponTypeIcons[weapon.type]}" class="type-icon" alt="${weapon.type}">
                                ${UI.getWeaponTypeName(weapon.type)}
                            </div>
                            <div class="team-weapon-element">
                                <img src="src/assets/${UI.elementIcons[weapon.element]}" class="element-icon" alt="${weapon.element}">
                                ${UI.getWeaponElementName(weapon.element)}
                            </div>
                            <div class="team-weapon-stats">
                                <div>等级: ${weapon.level}/${Weapon.breakthroughLevels[weapon.breakthrough || 0]}</div>
                                <div>攻击: ${currentStats.attack}</div>
                                <div>生命: ${currentStats.hp}</div>
                            </div>
                            <div class="team-weapon-breakthrough">
                                ${breakthroughStars}
                            </div>
                        </div>
                    </div>
                `;
            }

            return html;
        } catch (error) {
            console.error('渲染副武器槽时出错:', error);
            let html = '';
            for (let i = 1; i <= 9; i++) {
                html += `<div class="team-weapon-slot" data-slot="sub${i}">副武器${i}</div>`;
            }
            return html;
        }
    },

    /**
     * 获取武器稀有度样式
     * @param {string} rarity - 武器稀有度
     * @returns {string} 稀有度CSS类名
     */
    getRarityClass(rarity) {
        if (!rarity) return '';

        switch (rarity.toLowerCase()) {
            case 'common':
            case '普通':
                return 'common';
            case 'uncommon':
            case '优秀':
                return 'uncommon';
            case 'rare':
            case '稀有':
                return 'rare';
            case 'epic':
            case '史诗':
                return 'epic';
            case 'legendary':
            case '传说':
                return 'legendary';
            default:
                return '';
        }
    },

    /**
     * 获取武器属性HTML
     * @param {string} attribute - 武器属性
     * @returns {string} 属性HTML
     */
    getAttributeHtml(attribute) {
        if (!attribute) return '';

        let attributeClass = '';

        switch (attribute.toLowerCase()) {
            case 'fire':
            case '火':
                attributeClass = 'fire';
                break;
            case 'water':
            case '水':
                attributeClass = 'water';
                break;
            case 'earth':
            case '土':
                attributeClass = 'earth';
                break;
            case 'wind':
            case '风':
                attributeClass = 'wind';
                break;
            case 'light':
            case '光':
                attributeClass = 'light';
                break;
            case 'dark':
            case '暗':
                attributeClass = 'dark';
                break;
            default:
                return '';
        }

        return `<span class="team-weapon-attribute ${attributeClass}" title="${attribute}"></span>`;
    },

    /**
     * 绑定武器槽点击事件
     */
    bindWeaponSlotEvents() {
        // 选择所有武器槽，包括空槽和已装备武器的槽
        const weaponSlots = document.querySelectorAll('#team-weapon-board .team-weapon-slot, #team-weapon-board .team-weapon-slot-filled');

        // 创建tooltip容器
        const tooltipContainer = document.createElement('div');
        tooltipContainer.className = 'weapon-tooltip-container';
        document.body.appendChild(tooltipContainer);

        weaponSlots.forEach(slot => {
            // 移除可能存在的旧事件监听器
            const newSlot = slot.cloneNode(true);
            slot.parentNode.replaceChild(newSlot, slot);

            // 添加鼠标悬停事件
            newSlot.addEventListener('mouseenter', (e) => {
                const weaponId = newSlot.getAttribute('data-weapon-id');
                if (!weaponId) return;

                const weapon = Weapon.getWeapon(weaponId);
                if (!weapon) return;

                const currentStats = Weapon.calculateCurrentStats(weapon);

                const tooltip = document.createElement('div');
                tooltip.className = 'weapon-tooltip';
                tooltip.innerHTML = `
                    <div class="weapon-name">${weapon.name}</div>
                    <div class="weapon-breakthrough">
                        ${Array(4).fill().map((_, index) => {
                            const isLast = index === 3;
                            const isFinal = weapon.breakthrough === 4;
                            const currentBreakthrough = weapon.breakthrough || 0;

                            if (isLast) {
                                return `<div class="star ${isFinal ? 'final' : 'breakthrough-4'}"></div>`;
                            } else {
                                if (index < currentBreakthrough) {
                                    return `<div class="star breakthrough-1"></div>`;
                                } else {
                                    return `<div class="star breakthrough-0"></div>`;
                                }
                            }
                        }).join('')}
                    </div>
                    <div class="weapon-icons">
                        <div class="weapon-type">
                            <img src="src/assets/${UI.weaponTypeIcons[weapon.type]}" class="type-icon" alt="${weapon.type}">
                        </div>
                        <div class="weapon-element">
                            <img src="src/assets/${UI.elementIcons[weapon.element]}" class="element-icon" alt="${weapon.element}">
                        </div>
                    </div>
                    <div class="weapon-stats">
                        <div>等级: ${weapon.level}/${Weapon.breakthroughLevels[weapon.breakthrough || 0]}</div>
                        <div>攻击: ${currentStats.attack}</div>
                        <div>生命: ${currentStats.hp}</div>
                    </div>
                    ${weapon.specialEffects.length > 0 ? `
                        <div class="weapon-effects">
                            <div>特殊效果:</div>
                            ${weapon.specialEffects.map(effect => {
                                const isUnlocked = weapon.level >= effect.unlock;
                                return `<div class="effect-item ${isUnlocked ? 'unlocked' : 'locked'}">
                                    ${UI.getWeaponSkillName(effect.type)} Lv.${effect.level}
                                    ${!isUnlocked ? '<span class="unlock-hint">(需要武器等级达到' + effect.unlock + '级)</span>' : ''}
                                </div>`;
                            }).join('')}
                        </div>
                    ` : ''}
                `;

                tooltipContainer.innerHTML = '';
                tooltipContainer.appendChild(tooltip);
                tooltipContainer.style.display = 'block';

                const rect = e.target.getBoundingClientRect();
                tooltipContainer.style.left = `${rect.left + rect.width / 2}px`;
                tooltipContainer.style.top = `${rect.bottom + 5}px`;
            });

            newSlot.addEventListener('mouseleave', () => {
                tooltipContainer.style.display = 'none';
            });

            newSlot.addEventListener('click', () => {
                const slotType = newSlot.getAttribute('data-slot');
                const weaponId = newSlot.getAttribute('data-weapon-id');

                console.log(`点击了武器槽: ${slotType}, 武器ID: ${weaponId || '无'}`);

                // 获取当前队伍
                const activeTeamId = Game.state.activeTeamId;
                if (!activeTeamId) {
                    console.error('未找到活动队伍');
                    return;
                }

                const team = Team.teams[activeTeamId];
                if (!team) {
                    console.error('未找到队伍信息');
                    return;
                }

                // 获取武器盘ID
                const weaponBoardId = team.weaponBoardId;
                if (!weaponBoardId) {
                    console.error('未找到武器盘ID');
                    return;
                }

                // 显示武器选择对话框
                UI.showWeaponSelectionDialog(weaponBoardId, slotType, team.id);
            });
        });
    }
};

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 等待游戏核心加载完成
    if (typeof Game !== 'undefined' && Game.isInitialized) {
        TeamWeaponBoard.init();
    } else {
        // 监听游戏初始化完成事件
        document.addEventListener('gameInitialized', () => {
            TeamWeaponBoard.init();
        });
    }
});
