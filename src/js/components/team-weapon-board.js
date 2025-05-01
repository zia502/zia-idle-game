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

            // 获取武器属性样式
            const attributeHtml = this.getAttributeHtml(weapon.element);

            return `
                <div class="team-weapon-slot ${rarityClass}" data-slot="${slotType}" data-weapon-id="${weaponId}">
                    <button class="remove-weapon-btn" data-slot="${slotType}" data-board-id="${weaponBoard.id}" title="移除武器">×</button>
                    <div class="team-weapon-item">
                        <div class="team-weapon-icon">${weapon.name.charAt(0)}</div>
                        <div class="team-weapon-name">${weapon.name}</div>
                        <div class="team-weapon-type">${weapon.type || '未知类型'}</div>
                        <div class="team-weapon-attributes">${attributeHtml}</div>
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

                // 获取武器属性样式
                const attributeHtml = this.getAttributeHtml(weapon.element);

                html += `
                    <div class="team-weapon-slot ${rarityClass}" data-slot="${slotType}" data-weapon-id="${weaponId}">
                        <button class="remove-weapon-btn" data-slot="${slotType}" data-board-id="${weaponBoard.id}" title="移除武器">×</button>
                        <div class="team-weapon-item">
                            <div class="team-weapon-icon">${weapon.name.charAt(0)}</div>
                            <div class="team-weapon-name">${weapon.name}</div>
                            <div class="team-weapon-type">${weapon.type || '未知类型'}</div>
                            <div class="team-weapon-attributes">${attributeHtml}</div>
                        </div>
                    </div>
                `;
            }

            return html;
        } catch (error) {
            console.error('渲染副武器槽时出错:', error);

            // 出错时返回空槽位
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

        // 选择所有移除按钮
        const removeButtons = document.querySelectorAll('#team-weapon-board .remove-weapon-btn');

        // 绑定移除按钮事件
        removeButtons.forEach(btn => {
            btn.addEventListener('click', (event) => {
                // 阻止事件冒泡，避免触发槽位的点击事件
                event.stopPropagation();

                const slotType = btn.getAttribute('data-slot');
                const boardId = btn.getAttribute('data-board-id');

                console.log(`点击了移除按钮: 槽位 ${slotType}, 武器盘 ${boardId}`);

                // 移除武器
                if (typeof Weapon !== 'undefined' && typeof Weapon.removeWeaponFromBoard === 'function') {
                    const removedWeaponId = Weapon.removeWeaponFromBoard(boardId, slotType);

                    if (removedWeaponId) {
                        console.log(`成功移除武器: ${removedWeaponId}`);

                        // 更新武器盘显示
                        this.renderTeamWeaponBoard();

                        // 如果MainUI存在，也更新它
                        if (typeof MainUI !== 'undefined' && typeof MainUI.updateWeaponBoard === 'function') {
                            MainUI.updateWeaponBoard();
                        }

                        // 保存游戏状态
                        if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                            Game.saveGame();
                        }

                        // 显示通知
                        if (typeof UI !== 'undefined' && typeof UI.showNotification === 'function') {
                            UI.showNotification('武器已移除', 'success');
                        }
                    }
                }
            });
        });

        weaponSlots.forEach(slot => {
            // 移除可能存在的旧事件监听器
            const newSlot = slot.cloneNode(true);
            slot.parentNode.replaceChild(newSlot, slot);

            newSlot.addEventListener('click', () => {
                const slotType = newSlot.getAttribute('data-slot');
                const weaponId = newSlot.getAttribute('data-weapon-id');

                console.log(`点击了武器槽: ${slotType}, 武器ID: ${weaponId || '无'}`);

                // 获取当前队伍ID
                const activeTeamId = Game.state.activeTeamId;
                if (!activeTeamId) {
                    console.error('未找到当前队伍ID');
                    return;
                }

                // 获取队伍信息
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

                // 使用新的武器选择对话框
                if (typeof UI !== 'undefined' && typeof UI.showWeaponSelectionDialog === 'function') {
                    UI.showWeaponSelectionDialog(weaponBoardId, slotType, activeTeamId);
                } else {
                    console.warn('UI.showWeaponSelectionDialog方法不存在，回退到旧的武器选择方式');

                    // 如果武器系统已加载，切换到武器界面（旧方式）
                    if (typeof UI !== 'undefined' && typeof UI.switchScreen === 'function') {
                        // 保存当前选中的槽位，以便在武器界面中使用
                        if (typeof Weapon !== 'undefined') {
                            Weapon.selectedSlot = slotType;

                            // 保存队伍ID
                            if (activeTeamId) {
                                Weapon.selectedTeamId = activeTeamId;
                            }
                        }

                        UI.switchScreen('weapon-screen');
                    }
                }
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
