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
            let hasJob = false;
            let jobName = '';
            let jobLevel = 1;

            // 检查job是否存在
            if (mainCharacter.job) {
                hasJob = true;

                // 检查job是否为对象
                if (typeof mainCharacter.job === 'object' && mainCharacter.job.current) {
                    // 尝试从JobSystem获取职业名称
                    if (typeof JobSystem !== 'undefined' && JobSystem.jobs && JobSystem.jobs[mainCharacter.job.current]) {
                        jobName = JobSystem.jobs[mainCharacter.job.current].name;
                    } else {
                        jobName = mainCharacter.job.current;
                    }

                    // 获取职业等级
                    if (mainCharacter.job.level) {
                        jobLevel = mainCharacter.job.level;
                    }
                } else if (typeof mainCharacter.job === 'string') {
                    jobName = mainCharacter.job;

                    // 获取职业等级
                    if (mainCharacter.jobLevel) {
                        jobLevel = mainCharacter.jobLevel;
                    }
                }
            }

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
                        <div class="hero-name">${mainCharacter.name}</div>`;

            // 只有当有职业时才显示职业信息
            if (hasJob) {
                html += `
                        <div class="hero-class">${jobName}</div>
                        <div class="hero-level">等级 ${jobLevel}</div>`;
            }

            html += `
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

                // 检查JobSystem是否已就绪
                const jobSystemReady = typeof JobSystem !== 'undefined' &&
                                      typeof JobSkillsTemplate !== 'undefined' &&
                                      JobSkillsTemplate.templates;

                // 如果JobSystem未就绪，显示加载中消息
                if (!jobSystemReady) {
                    html += `<div class="skill-item loading">技能加载中...</div>`;

                    // 添加一个重试按钮
                    html += `<button class="retry-button" onclick="MainUI.updateMainHeroInfo()">刷新技能</button>`;
                } else {
                    // JobSystem已就绪，正常显示技能
                    mainCharacter.skills.forEach(skill => {
                        // 检查技能是否为字符串ID
                        if (typeof skill === 'string') {
                            // 尝试从JobSystem获取技能信息
                            const skillInfo = JobSystem.getSkill(skill);

                            if (skillInfo) {
                                html += `<div class="skill-item" data-skill-id="${skill}">${skillInfo.name}</div>`;
                            } else {
                                // 如果找不到技能信息，只显示技能ID
                                html += `<div class="skill-item">${skill}</div>`;
                            }
                        } else if (typeof skill === 'object' && skill !== null) {
                            // 如果技能是对象，直接使用其属性
                            html += `<div class="skill-item" data-skill-id="${skill.id || ''}">${skill.name || '未知技能'}</div>`;
                        } else {
                            // 处理其他情况
                            html += `<div class="skill-item">未知技能</div>`;
                        }
                    });
                }

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

                    // 获取角色职业
                    let hasJob = false;
                    let jobName = '';
                    let jobLevel = 1;

                    // 检查job是否存在
                    if (character.job) {
                        hasJob = true;

                        // 检查job是否为对象
                        if (typeof character.job === 'object' && character.job.current) {
                            // 尝试从JobSystem获取职业名称
                            if (typeof JobSystem !== 'undefined' && JobSystem.jobs && JobSystem.jobs[character.job.current]) {
                                jobName = JobSystem.jobs[character.job.current].name;
                            } else {
                                jobName = character.job.current;
                            }

                            // 获取职业等级
                            if (character.job.level) {
                                jobLevel = character.job.level;
                            }
                        } else if (typeof character.job === 'string') {
                            jobName = character.job;

                            // 获取职业等级
                            if (character.jobLevel) {
                                jobLevel = character.jobLevel;
                            }
                        }
                    }

                    html += `
                        <div class="team-member">
                            <div class="member-avatar">${character.name.charAt(0)}</div>
                            <div class="member-info">
                                <div class="member-name">${character.name}</div>`;

                    // 只有当有职业时才显示职业信息
                    if (hasJob) {
                        html += `<div class="member-class">${jobName}</div>
                                <div class="member-level">等级 ${jobLevel}</div>`;
                    }

                    // 添加技能信息
                    if (character.skills && character.skills.length > 0) {
                        html += '<div class="member-skills">';

                        // 检查JobSystem是否已就绪
                        const jobSystemReady = typeof JobSystem !== 'undefined' &&
                                              typeof JobSkillsTemplate !== 'undefined' &&
                                              JobSkillsTemplate.templates;

                        if (!jobSystemReady) {
                            // 如果JobSystem未就绪，显示加载中的技能点
                            character.skills.forEach(() => {
                                html += `<div class="member-skill skill-loading" title="技能加载中..."></div>`;
                            });
                        } else {
                            // 显示所有技能
                            character.skills.forEach(skill => {
                                // 检查技能是否为字符串ID
                                if (typeof skill === 'string') {
                                    // 尝试从JobSystem获取技能信息
                                    const skillInfo = JobSystem.getSkill(skill);

                                    if (skillInfo) {
                                        // 根据技能类型确定颜色
                                        let skillClass = '';

                                        // 检查技能效果类型
                                        if (skillInfo.effects) {
                                            // 检查是否有伤害效果
                                            const hasDamage = skillInfo.effects.some(effect =>
                                                effect.type === 'damage' || effect.type === 'dot' ||
                                                (effect.type === 'proc' && effect.effect && effect.effect.type === 'damage') ||
                                                (effect.type === 'endOfTurn' && effect.effect &&
                                                 (effect.effect.type === 'damage' || effect.effect.type === 'multi_attack')));

                                            // 检查是否有治疗效果
                                            const hasHeal = skillInfo.effects.some(effect =>
                                                effect.type === 'heal' || effect.type === 'dispel');

                                            // 检查是否有BUFF效果
                                            const hasBuff = skillInfo.effects.some(effect =>
                                                effect.type === 'attackUp' || effect.type === 'defenseUp' ||
                                                effect.type === 'daBoost' || effect.type === 'taBoost' ||
                                                effect.type === 'shield' || effect.type === 'invincible');

                                            // 检查是否有DEBUFF效果
                                            const hasDebuff = skillInfo.effects.some(effect =>
                                                effect.type === 'attackDown' || effect.type === 'defenseDown' ||
                                                effect.type === 'daDown' || effect.type === 'taDown' ||
                                                effect.type === 'missRate');

                                            // 确定技能类型
                                            if (hasDamage) {
                                                skillClass = 'skill-damage';
                                            } else if (hasHeal) {
                                                skillClass = 'skill-heal';
                                            } else if (hasBuff && !hasDebuff) {
                                                skillClass = 'skill-buff';
                                            } else if (hasDebuff && !hasBuff) {
                                                skillClass = 'skill-debuff';
                                            } else if (hasBuff && hasDebuff) {
                                                // 同时有BUFF和DEBUFF，优先显示为BUFF
                                                skillClass = 'skill-buff';
                                            } else {
                                                // 默认为BUFF
                                                skillClass = 'skill-buff';
                                            }
                                        } else {
                                            // 直接根据effectType判断
                                            if (skillInfo.effectType) {
                                                if (skillInfo.effectType === 'damage' || skillInfo.effectType.includes('damage')) {
                                                    skillClass = 'skill-damage';
                                                } else if (skillInfo.effectType === 'heal' || skillInfo.effectType.includes('heal')) {
                                                    skillClass = 'skill-heal';
                                                } else if (skillInfo.effectType === 'revive') {
                                                    skillClass = 'skill-heal'; // 复活技能使用绿色（与治疗相同）
                                                } else if (skillInfo.effectType === 'buff' || skillInfo.effectType.includes('buff')) {
                                                    skillClass = 'skill-buff';
                                                } else if (skillInfo.effectType === 'debuff' || skillInfo.effectType.includes('debuff')) {
                                                    skillClass = 'skill-debuff';
                                                } else if (skillInfo.effectType === 'dispel') {
                                                    skillClass = 'skill-debuff'; // 驱散技能使用与debuff相同的颜色
                                                } else {
                                                    skillClass = 'skill-buff'; // 默认
                                                }
                                            } else {
                                                skillClass = 'skill-buff'; // 默认
                                            }
                                        }

                                        html += `<div class="member-skill ${skillClass}" data-skill-id="${skill}" title="${skillInfo.name}"></div>`;
                                    } else {
                                        // 如果找不到技能信息，显示默认圆点
                                        html += `<div class="member-skill skill-buff" title="${skill}"></div>`;
                                    }
                                } else if (typeof skill === 'object' && skill !== null) {
                                    // 如果技能是对象，直接使用其属性
                                    html += `<div class="member-skill skill-buff" data-skill-id="${skill.id || ''}" title="${skill.name || '未知技能'}"></div>`;
                                } else {
                                    // 处理其他情况
                                    html += `<div class="member-skill skill-buff" title="未知技能"></div>`;
                                }
                            });
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

            // 检查Weapon和Team模块是否存在
            if (typeof Weapon === 'undefined' || typeof Team === 'undefined') {
                console.warn('Weapon或Team模块未定义');
                return;
            }

            // 获取当前队伍
            const activeTeamId = Game.state.activeTeamId;
            if (!activeTeamId || !Team.teams[activeTeamId]) {
                // 如果没有当前队伍，显示默认的空武器盘
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
            const weaponBoard = Weapon.getWeaponBoard(weaponBoardId);
            if (!weaponBoard) {
                return;
            }

            // 更新武器盘HTML
            let html = `
                <div class="weapon-board-container">
                    <div class="main-weapon-slot">
                        <!-- 主手武器槽 -->
                        ${this.renderWeaponSlot(weaponBoard, 'main')}
                    </div>
                    <div class="sub-weapons-grid">
                        <!-- 9个副武器槽 -->
                        ${this.renderSubWeaponSlots(weaponBoard)}
                    </div>
                </div>
            `;

            weaponBoardContainer.innerHTML = html;

            // 绑定武器槽点击事件
            this.bindWeaponSlotEvents(weaponBoardId);
        } catch (error) {
            console.error('更新武器盘时出错:', error);
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
                return `<div class="empty-weapon-slot" data-slot="${slotType}">主手武器</div>`;
            }

            // 获取武器信息
            const weapon = Weapon.getWeapon(weaponId);
            if (!weapon) {
                return `<div class="empty-weapon-slot" data-slot="${slotType}">主手武器</div>`;
            }

            // 获取武器稀有度样式
            const rarityClass = this.getRarityClass(weapon.rarity);

            // 获取武器属性样式
            const attributeHtml = this.getAttributeHtml(weapon.attribute);

            return `
                <div class="empty-weapon-slot ${rarityClass}" data-slot="${slotType}" data-weapon-id="${weaponId}">
                    <div class="weapon-item">
                        <div class="weapon-icon">${weapon.name.charAt(0)}</div>
                        <div class="weapon-name">${weapon.name}</div>
                        <div class="weapon-type">${weapon.type || '未知类型'}</div>
                        <div class="weapon-attributes">${attributeHtml}</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('渲染武器槽时出错:', error);
            return `<div class="empty-weapon-slot" data-slot="${slotType}">主手武器</div>`;
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
                    html += `<div class="empty-weapon-slot" data-slot="${slotType}">副武器${i}</div>`;
                    continue;
                }

                // 获取武器信息
                const weapon = Weapon.getWeapon(weaponId);
                if (!weapon) {
                    html += `<div class="empty-weapon-slot" data-slot="${slotType}">副武器${i}</div>`;
                    continue;
                }

                // 获取武器稀有度样式
                const rarityClass = this.getRarityClass(weapon.rarity);

                // 获取武器属性样式
                const attributeHtml = this.getAttributeHtml(weapon.attribute);

                html += `
                    <div class="empty-weapon-slot ${rarityClass}" data-slot="${slotType}" data-weapon-id="${weaponId}">
                        <div class="weapon-item">
                            <div class="weapon-icon">${weapon.name.charAt(0)}</div>
                            <div class="weapon-name">${weapon.name}</div>
                            <div class="weapon-type">${weapon.type || '未知类型'}</div>
                            <div class="weapon-attributes">${attributeHtml}</div>
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
                html += `<div class="empty-weapon-slot" data-slot="sub${i}">副武器${i}</div>`;
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

        return `<span class="weapon-attribute ${attributeClass}" title="${attribute}"></span>`;
    },

    /**
     * 绑定武器槽点击事件
     * @param {string} weaponBoardId - 武器盘ID
     */
    bindWeaponSlotEvents(weaponBoardId) {
        const weaponSlots = document.querySelectorAll('#main-weapon-board .empty-weapon-slot');

        weaponSlots.forEach(slot => {
            // 移除可能存在的旧事件监听器
            const newSlot = slot.cloneNode(true);
            slot.parentNode.replaceChild(newSlot, slot);

            // 添加点击事件
            newSlot.addEventListener('click', () => {
                const slotType = newSlot.getAttribute('data-slot');
                const weaponId = newSlot.getAttribute('data-weapon-id');

                console.log(`点击了武器槽: ${slotType}, 武器ID: ${weaponId || '无'}, 武器盘ID: ${weaponBoardId}`);

                // 如果武器系统已加载，切换到武器界面
                if (typeof UI !== 'undefined' && typeof UI.switchScreen === 'function') {
                    // 保存当前选中的槽位，以便在武器界面中使用
                    if (typeof Weapon !== 'undefined') {
                        Weapon.selectedSlot = slotType;
                        Weapon.selectedBoardId = weaponBoardId;

                        // 如果是队伍武器盘，保存队伍ID
                        const activeTeamId = Game.state.activeTeamId;
                        if (activeTeamId) {
                            Weapon.selectedTeamId = activeTeamId;
                        }
                    }

                    UI.switchScreen('weapon-screen');
                }
            });
        });
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
