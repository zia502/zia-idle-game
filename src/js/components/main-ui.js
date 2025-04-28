/**
 * 主界面UI组件
 */
const MainUI = {
    /**
     * 初始化主界面
     */
    init() {
        try {
            console.log('初始化主界面UI');

            // 初始化菜单图标点击事件
            this.initMenuIcons();

            // 初始化主界面数据 - 使用try-catch分别处理每个部分，确保一个部分失败不会影响其他部分
            try {
                this.updateMainHeroInfo();
            } catch (error) {
                console.error('初始化主角信息时出错:', error);
            }

            try {
                this.updateCurrentTeam();
            } catch (error) {
                console.error('初始化队伍信息时出错:', error);
            }

            try {
                this.updateWeaponBoard();
            } catch (error) {
                console.error('初始化武器盘时出错:', error);
            }

            try {
                this.updateCurrentDungeon();
            } catch (error) {
                console.error('初始化地下城信息时出错:', error);
            }

            try {
                this.updateBattleLog();
            } catch (error) {
                console.error('初始化战斗日志时出错:', error);
            }

            // 注册事件监听
            this.registerEventListeners();

            console.log('主界面UI初始化完成');
        } catch (error) {
            console.error('初始化主界面UI时出错:', error);
        }
    },

    /**
     * 初始化菜单图标点击事件
     */
    initMenuIcons() {
        try {
            console.log('初始化菜单图标点击事件');
            const menuIcons = document.querySelectorAll('.menu-icon');
            console.log(`找到 ${menuIcons.length} 个菜单图标`);

            menuIcons.forEach(icon => {
                // 移除可能存在的旧事件监听器
                const newIcon = icon.cloneNode(true);
                icon.parentNode.replaceChild(newIcon, icon);

                const screenId = newIcon.getAttribute('data-screen');
                console.log(`为图标添加点击事件，目标屏幕: ${screenId}`);

                newIcon.addEventListener('click', (event) => {
                    event.preventDefault();
                    console.log(`点击了菜单图标，切换到: ${screenId}`);

                    if (screenId && typeof UI !== 'undefined') {
                        if (typeof UI.switchScreen === 'function') {
                            UI.switchScreen(screenId);
                        } else {
                            console.error('UI.switchScreen 不是一个函数');
                        }
                    } else {
                        console.error('无效的屏幕ID或UI未定义');
                    }
                });
            });

            // 添加直接点击事件处理，以防事件委托失败
            document.addEventListener('click', (event) => {
                let target = event.target;

                // 向上查找最近的.menu-icon元素
                while (target && !target.classList.contains('menu-icon')) {
                    target = target.parentElement;
                }

                if (target && target.classList.contains('menu-icon')) {
                    const screenId = target.getAttribute('data-screen');
                    console.log(`通过事件委托点击了菜单图标，切换到: ${screenId}`);

                    if (screenId && typeof UI !== 'undefined' && typeof UI.switchScreen === 'function') {
                        UI.switchScreen(screenId);
                    }
                }
            });
        } catch (error) {
            console.error('初始化菜单图标时出错:', error);
        }
    },

    /**
     * 更新主角信息
     */
    updateMainHeroInfo() {
        try {
            const heroInfoContainer = document.getElementById('main-hero-info');
            if (!heroInfoContainer) return;

            // 检查Character模块是否存在
            if (typeof Character === 'undefined') {
                console.warn('Character模块未定义');
                heroInfoContainer.innerHTML = '<div class="empty-message">角色系统未加载</div>';
                return;
            }

            // 检查getMainCharacter方法是否存在
            if (typeof Character.getMainCharacter !== 'function') {
                console.warn('Character.getMainCharacter方法未定义');
                heroInfoContainer.innerHTML = '<div class="empty-message">无法获取主角信息</div>';
                return;
            }

            // 获取主角信息
            const mainCharacter = Character.getMainCharacter();
            if (!mainCharacter) {
                heroInfoContainer.innerHTML = '<div class="empty-message">未创建主角</div>';
                return;
            }

            // 获取主角职业
            const jobName = mainCharacter.job || '战士';
            const jobLevel = mainCharacter.jobLevel || 1;

            // 获取主角属性（确保属性存在，否则使用默认值）
            const maxHp = mainCharacter.maxHp || mainCharacter.hp || 100;
            const attack = mainCharacter.attack || 10;
            const defense = mainCharacter.defense || 5;
            const speed = mainCharacter.speed || 5;

            // 构建主角信息HTML
            let html = `
                <div class="hero-basic-info">
                    <div class="hero-avatar">${mainCharacter.name.charAt(0)}</div>
                    <div class="hero-details">
                        <div class="hero-name">${mainCharacter.name}</div>
                        <div class="hero-class">${jobName}</div>
                        <div class="hero-level">等级 ${jobLevel}</div>
                    </div>
                </div>
                <div class="hero-stats">
                    <div class="stat-item">
                        <span class="stat-name">生命值</span>
                        <span class="stat-value">${maxHp}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-name">攻击力</span>
                        <span class="stat-value">${attack}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-name">防御力</span>
                        <span class="stat-value">${defense}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-name">速度</span>
                        <span class="stat-value">${speed}</span>
                    </div>
                </div>
            `;

            // 添加技能信息
            if (mainCharacter.skills && mainCharacter.skills.length > 0) {
                html += `
                    <div class="hero-skills">
                        <div class="skill-title">技能</div>
                        <div class="skill-list">
                `;

                mainCharacter.skills.forEach(skill => {
                    html += `<div class="skill-item" title="${skill.description || ''}">${skill.name}</div>`;
                });

                html += `
                        </div>
                    </div>
                `;
            }

            heroInfoContainer.innerHTML = html;
        } catch (error) {
            console.error('更新主角信息时出错:', error);
            const heroInfoContainer = document.getElementById('main-hero-info');
            if (heroInfoContainer) {
                heroInfoContainer.innerHTML = '<div class="empty-message">加载主角信息时出错</div>';
            }
        }
    },

    /**
     * 更新当前队伍信息
     */
    updateCurrentTeam() {
        try {
            const teamContainer = document.getElementById('main-current-team');
            if (!teamContainer) return;

            // 检查Game和Team模块是否存在
            if (typeof Game === 'undefined') {
                console.warn('Game模块未定义');
                teamContainer.innerHTML = '<div class="empty-message">游戏系统未加载</div>';
                return;
            }

            if (typeof Team === 'undefined') {
                console.warn('Team模块未定义');
                teamContainer.innerHTML = '<div class="empty-message">队伍系统未加载</div>';
                return;
            }

            // 检查Character模块是否存在
            if (typeof Character === 'undefined') {
                console.warn('Character模块未定义');
                teamContainer.innerHTML = '<div class="empty-message">角色系统未加载</div>';
                return;
            }

            // 获取当前队伍
            const activeTeamId = Game.state.activeTeamId;
            if (!activeTeamId) {
                teamContainer.innerHTML = '<div class="empty-message">未选择队伍</div>';
                return;
            }

            if (!Team.teams || !Team.teams[activeTeamId]) {
                teamContainer.innerHTML = '<div class="empty-message">未找到队伍信息</div>';
                return;
            }

            const team = Team.teams[activeTeamId];

            // 构建队伍信息HTML
            let html = '';

            if (team.members && team.members.length > 0) {
                team.members.forEach(memberId => {
                    // 检查角色是否存在
                    if (!Character.characters || !Character.characters[memberId]) {
                        return;
                    }

                    const character = Character.characters[memberId];

                    const jobName = character.job || '未知';
                    const jobLevel = character.jobLevel || 1;

                    html += `
                        <div class="team-member">
                            <div class="member-avatar">${character.name.charAt(0)}</div>
                            <div class="member-info">
                                <div class="member-name">${character.name}</div>
                                <div class="member-class">${jobName}</div>
                                <div class="member-level">等级 ${jobLevel}</div>
                    `;

                    // 添加技能信息
                    if (character.skills && character.skills.length > 0) {
                        html += '<div class="member-skills">';

                        // 最多显示3个技能
                        const displaySkills = character.skills.slice(0, 3);
                        displaySkills.forEach(skill => {
                            html += `<div class="member-skill" title="${skill.description || ''}">${skill.name}</div>`;
                        });

                        if (character.skills.length > 3) {
                            html += `<div class="member-skill">+${character.skills.length - 3}</div>`;
                        }

                        html += '</div>';
                    }

                    html += `
                            </div>
                        </div>
                    `;
                });
            }

            if (html === '') {
                html = '<div class="empty-message">队伍中没有成员</div>';
            }

            teamContainer.innerHTML = html;
        } catch (error) {
            console.error('更新队伍信息时出错:', error);
            const teamContainer = document.getElementById('main-current-team');
            if (teamContainer) {
                teamContainer.innerHTML = '<div class="empty-message">加载队伍信息时出错</div>';
            }
        }
    },

    /**
     * 更新武器盘
     */
    updateWeaponBoard() {
        try {
            const weaponBoardContainer = document.getElementById('main-weapon-board');
            if (!weaponBoardContainer) return;

            // 检查Weapon模块是否存在
            if (typeof Weapon === 'undefined') {
                console.warn('Weapon模块未定义');
                // 不显示错误消息，因为我们已经有了默认的空武器槽UI
                return;
            }

            // 获取武器数据
            // 这里需要根据实际的武器系统实现
            // 目前只显示空的武器槽，但添加了点击事件

            // 为所有武器槽添加点击事件
            const weaponSlots = weaponBoardContainer.querySelectorAll('.empty-weapon-slot');
            weaponSlots.forEach(slot => {
                // 移除可能存在的旧事件监听器
                const newSlot = slot.cloneNode(true);
                slot.parentNode.replaceChild(newSlot, slot);

                // 添加点击事件
                newSlot.addEventListener('click', () => {
                    const slotType = newSlot.getAttribute('data-slot');
                    console.log(`点击了武器槽: ${slotType}`);

                    // 如果武器系统已加载，切换到武器界面
                    if (typeof UI !== 'undefined' && typeof UI.switchScreen === 'function') {
                        UI.switchScreen('weapon-screen');
                    }
                });
            });
        } catch (error) {
            console.error('更新武器盘时出错:', error);
        }
    },

    /**
     * 更新当前地下城信息
     */
    updateCurrentDungeon() {
        try {
            const dungeonContainer = document.getElementById('main-current-dungeon');
            if (!dungeonContainer) return;

            // 检查Dungeon模块是否存在
            if (typeof Dungeon === 'undefined') {
                console.error('Dungeon模块未定义');
                dungeonContainer.innerHTML = '<div class="empty-message">地下城系统未加载</div>';
                return;
            }

            // 获取当前地下城
            if (!Dungeon.currentRun || !Dungeon.currentRun.dungeonId) {
                dungeonContainer.innerHTML = '<div class="empty-message">未进入地下城</div>';
                return;
            }

            const dungeonId = Dungeon.currentRun.dungeonId;
            const currentDungeon = Dungeon.getDungeon(dungeonId);

            if (!currentDungeon) {
                dungeonContainer.innerHTML = '<div class="empty-message">未找到地下城信息</div>';
                return;
            }

            // 计算进度
            let progressPercent = 0;
            if (Dungeon.currentRun) {
                // 简单计算进度：已击败的怪物数量 / 总怪物数量
                const totalMonsters = Dungeon.currentRun.monsters.length +
                                     Dungeon.currentRun.miniBosses.length +
                                     (Dungeon.currentRun.finalBoss ? 1 : 0);

                const defeatedMonsters = Dungeon.currentRun.currentMonsterIndex +
                                        Dungeon.currentRun.defeatedMiniBosses +
                                        (Dungeon.currentRun.isCompleted ? 1 : 0);

                progressPercent = totalMonsters > 0 ?
                                 Math.min(100, Math.round((defeatedMonsters / totalMonsters) * 100)) : 0;
            }

            // 构建地下城信息HTML
            const html = `
                <div class="dungeon-info">
                    <div class="dungeon-name">${currentDungeon.name}</div>
                    <div class="dungeon-description">${currentDungeon.description || '无描述'}</div>
                    <div class="dungeon-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="progress-text">${progressPercent}%</div>
                    </div>
                </div>
            `;

            dungeonContainer.innerHTML = html;
        } catch (error) {
            console.error('更新地下城信息时出错:', error);
            const dungeonContainer = document.getElementById('main-current-dungeon');
            if (dungeonContainer) {
                dungeonContainer.innerHTML = '<div class="empty-message">加载地下城信息时出错</div>';
            }
        }
    },

    /**
     * 更新战斗日志
     */
    updateBattleLog() {
        try {
            const logContainer = document.getElementById('main-battle-log');
            if (!logContainer) return;

            // 检查Battle模块是否存在
            if (typeof Battle === 'undefined') {
                console.warn('Battle模块未定义');
                logContainer.innerHTML = '<div class="empty-message">战斗系统未加载</div>';
                return;
            }

            // 获取战斗日志
            let battleLogs = [];

            if (Battle.getBattleLogs && typeof Battle.getBattleLogs === 'function') {
                battleLogs = Battle.getBattleLogs();
            } else if (Battle.logs) {
                // 备选：如果Battle.logs存在，使用它
                battleLogs = Battle.logs;
            }

            if (!battleLogs || battleLogs.length === 0) {
                logContainer.innerHTML = '<div class="empty-message">暂无战斗记录</div>';
                return;
            }

            // 构建日志HTML
            let html = '';

            // 最多显示最近的10条日志
            const recentLogs = battleLogs.slice(-10);
            recentLogs.forEach(log => {
                const logClass = log.type || 'normal';
                const time = log.time ? new Date(log.time).toLocaleTimeString() : '';

                html += `
                    <div class="log-entry ${logClass}">
                        <span class="log-time">${time}</span>
                        <span class="log-content">${log.message}</span>
                    </div>
                `;
            });

            logContainer.innerHTML = html;
        } catch (error) {
            console.error('更新战斗日志时出错:', error);
            const logContainer = document.getElementById('main-battle-log');
            if (logContainer) {
                logContainer.innerHTML = '<div class="empty-message">加载战斗日志时出错</div>';
            }
        }
    },

    /**
     * 注册事件监听
     */
    registerEventListeners() {
        // 监听角色变化事件
        if (typeof Events !== 'undefined') {
            Events.on('character:updated', () => {
                this.updateMainHeroInfo();
            });

            Events.on('team:updated', () => {
                this.updateCurrentTeam();
            });

            Events.on('dungeon:updated', () => {
                this.updateCurrentDungeon();
            });

            Events.on('battle:log', () => {
                this.updateBattleLog();
            });
        }
    }
};

// 当DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 等待游戏系统初始化完成后再初始化主界面
    if (typeof Game !== 'undefined' && Game.state.isRunning) {
        MainUI.init();
    } else if (typeof Events !== 'undefined') {
        Events.on('game:started', () => {
            MainUI.init();
        });
    }
});
