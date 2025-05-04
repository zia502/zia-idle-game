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

            // 获取主角属性（始终使用weaponBonusStats作为显示属性）
            let maxHp = mainCharacter.currentStats.hp;
            let attack = mainCharacter.currentStats.attack;

            // 无论是否在地下城中，都使用weaponBonusStats作为显示属性
            if (mainCharacter.weaponBonusStats) {
                console.log('使用weaponBonusStats作为显示属性:', mainCharacter.weaponBonusStats);
                attack = mainCharacter.weaponBonusStats.attack || attack;
                maxHp = mainCharacter.weaponBonusStats.hp || maxHp;
            } else {
                // 如果weaponBonusStats不存在，尝试更新它
                try {
                    if (typeof Character !== 'undefined' && typeof Character.getCharacterFullStats === 'function' &&
                        typeof Game !== 'undefined' && Game.state && Game.state.activeTeamId &&
                        mainCharacter && mainCharacter.id) {

                        const teamId = Game.state.activeTeamId;

                        // 确保所有必要的对象都存在
                        if (typeof Team !== 'undefined' && typeof Team.getTeam === 'function' &&
                            typeof Team.getTeam(teamId) === 'object' && Team.getTeam(teamId) !== null &&
                            typeof Weapon !== 'undefined' && typeof Weapon.getWeaponBoard === 'function') {

                            try {
                                // 更新weaponBonusStats
                                const completeStats = Character.getCharacterFullStats(mainCharacter.id, teamId, true);

                                if (completeStats && typeof completeStats === 'object') {
                                    console.log('获取到主角完整属性并更新weaponBonusStats:', completeStats);
                                    attack = completeStats.attack || attack;
                                    maxHp = completeStats.hp || maxHp;
                                }
                            } catch (innerError) {
                                console.error('调用getCharacterFullStats时出错:', innerError);
                            }
                        }
                    }
                } catch (outerError) {
                    console.error('尝试获取完整属性时出错:', outerError);
                }
            }

            // 获取主角元素属性（默认为火属性）
            const elementAttribute = mainCharacter.attribute || 'fire';
            const elementName = this.getElementName(elementAttribute);

            // 构建主角信息HTML
            let html = `
                <div class="hero-basic-info">
                    <div class="hero-avatar">${mainCharacter.name.charAt(0)}</div>
                    <div class="hero-details">
                        <div class="hero-name">${mainCharacter.name}</div>
                        <div class="hero-element attribute-${elementAttribute}">${elementName}</div>`;

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
                return `<div class="weapon-slot" data-slot="${slotType}">主手武器</div>`;
            }

            // 获取武器信息
            const weapon = Weapon.getWeapon(weaponId);
            if (!weapon) {
                return `<div class="weapon-slot" data-slot="${slotType}">主手武器</div>`;
            }

            // 获取武器稀有度样式
            const rarityClass = this.getRarityClass(weapon.rarity);

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
                <div class="weapon-slot ${rarityClass}" data-slot="${slotType}" data-weapon-id="${weaponId}">
                    <div class="weapon-item">
                        <div class="weapon-icon">${weapon.name.charAt(0)}</div>
                        <div class="weapon-name">${weapon.name}</div>
                        <div class="weapon-attributes">
                            <div class="weapon-type">
                                <img src="src/assets/${UI.weaponTypeIcons[weapon.type]}" class="type-icon" alt="${weapon.type}">
                            </div>
                            <div class="weapon-element">
                                <img src="src/assets/${UI.elementIcons[weapon.element]}" class="element-icon" alt="${weapon.element}">
                            </div>
                        </div>
                        <div class="weapon-breakthrough">
                            ${breakthroughStars}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('渲染武器槽时出错:', error);
            return `<div class="weapon-slot" data-slot="${slotType}">主手武器</div>`;
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
                    html += `<div class="weapon-slot" data-slot="${slotType}">副武器${i}</div>`;
                    continue;
                }

                // 获取武器信息
                const weapon = Weapon.getWeapon(weaponId);
                if (!weapon) {
                    html += `<div class="weapon-slot" data-slot="${slotType}">副武器${i}</div>`;
                    continue;
                }

                // 获取武器稀有度样式
                const rarityClass = this.getRarityClass(weapon.rarity);

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
                    <div class="weapon-slot ${rarityClass}" data-slot="${slotType}" data-weapon-id="${weaponId}">
                        <div class="weapon-item">
                            <div class="weapon-icon">${weapon.name.charAt(0)}</div>
                            <div class="weapon-name">${weapon.name}</div>
                            <div class="weapon-attributes">
                                <div class="weapon-type">
                                    <img src="src/assets/${UI.weaponTypeIcons[weapon.type]}" class="type-icon" alt="${weapon.type}">
                                </div>
                                <div class="weapon-element">
                                    <img src="src/assets/${UI.elementIcons[weapon.element]}" class="element-icon" alt="${weapon.element}">
                                </div>
                            </div>
                            <div class="weapon-breakthrough">
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
                html += `<div class="weapon-slot" data-slot="sub${i}">副武器${i}</div>`;
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
     * 获取武器类型名称
     * @param {string} type - 武器类型
     * @returns {string} 武器类型名称
     */
    getWeaponTypeName(type) {
        if (!type) return '未知类型';

        // 武器类型映射
        const typeNames = {
            'sword': '剑',
            'knife': '刀',
            'staff': '杖',
            'bow': '弓',
            'axe': '斧',
            'spear': '枪',
            'fist': '拳套',
            'gun': '枪械',
            'hammer': '锤',
            'wand': '魔杖',
            'dagger': '匕首',
            'katana': '太刀',
            'whip': '鞭',
            'scythe': '镰刀',
            'shield': '盾',
            'book': '书',
            'orb': '宝珠',
            'harp': '竖琴',
            'lance': '长枪',
            'mace': '钉锤'
        };

        return typeNames[type.toLowerCase()] || type;
    },

    /**
     * 绑定武器槽点击事件
     * @param {string} weaponBoardId - 武器盘ID
     */
    bindWeaponSlotEvents(weaponBoardId) {
        // 选择所有武器槽，包括空槽和已装备武器的槽
        const weaponSlots = document.querySelectorAll('#main-weapon-board .empty-weapon-slot, #main-weapon-board .weapon-slot');

        weaponSlots.forEach(slot => {
            // 移除可能存在的旧事件监听器
            const newSlot = slot.cloneNode(true);
            slot.parentNode.replaceChild(newSlot, slot);

            // 添加自定义样式，表明武器槽不可点击
            newSlot.style.cursor = 'default';

            // 不再添加点击事件，武器盘点击更换武器功能已关闭
            // 可以添加一个提示信息
            newSlot.setAttribute('title', '武器盘更换功能已关闭');

            // 如果需要，可以添加一个点击事件只显示提示信息
            newSlot.addEventListener('click', () => {
                const slotType = newSlot.getAttribute('data-slot');
                const weaponId = newSlot.getAttribute('data-weapon-id');

                console.log(`点击了武器槽，但更换功能已关闭: ${slotType}, 武器ID: ${weaponId || '无'}`);

                // 如果有UI.showMessage方法，可以显示一个提示
                if (typeof UI !== 'undefined' && typeof UI.showMessage === 'function') {
                    UI.showMessage('请使用队伍管理界面更换武器');
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

            // 检查是否有当前地下城运行
            if (!Dungeon.currentRun || !Dungeon.currentRun.dungeonId) {
                // 如果没有当前地下城运行，尝试从Game.state加载
                if (typeof Game !== 'undefined' && Game.state && Game.state.currentDungeon && Object.keys(Game.state.currentDungeon).length > 0) {
                    console.log('检测到保存的地下城进度，尝试加载');

                    // 尝试加载地下城进度
                    if (typeof Dungeon.loadDungeonProgress === 'function') {
                        const loaded = Dungeon.loadDungeonProgress();
                        if (!loaded || !Dungeon.currentRun) {
                            console.log('加载地下城进度失败');
                            dungeonContainer.innerHTML = '<div class="empty-message">未进入地下城</div>';
                            return;
                        }
                        console.log('成功加载地下城进度');
                    } else {
                        // 如果loadDungeonProgress方法不存在，直接使用Game.state.currentDungeon
                        console.log('Dungeon.loadDungeonProgress方法不存在，直接使用Game.state.currentDungeon');
                        Dungeon.currentRun = JSON.parse(JSON.stringify(Game.state.currentDungeon));
                    }
                } else {
                    // 如果没有保存的地下城进度，显示未进入地下城
                    dungeonContainer.innerHTML = '<div class="empty-message">未进入地下城</div>';
                    return;
                }
            }

            const dungeonId = Dungeon.currentRun.dungeonId;
            const currentDungeon = Dungeon.getDungeon(dungeonId);

            if (!currentDungeon) {
                dungeonContainer.innerHTML = '<div class="empty-message">未找到地下城信息</div>';
                return;
            }

            // 获取进度
            let progressPercent = 0;
            if (Dungeon.currentRun.progress !== undefined) {
                // 使用DungeonRunner设置的进度
                progressPercent = Math.min(100, Math.max(0, Dungeon.currentRun.progress));
            } else {
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

            // 计算当前阶段
            let stageText = '';
            let stageClass = '';

            if (Dungeon.currentRun.isCompleted) {
                stageText = '已完成';
                stageClass = 'completed';
            } else if (Dungeon.currentRun.finalBossAppeared) {
                stageText = '大BOSS战';
                stageClass = 'final-boss';
            } else if (Dungeon.currentRun.defeatedMiniBosses < Dungeon.currentRun.miniBosses.length) {
                stageText = `小BOSS战 (${Dungeon.currentRun.defeatedMiniBosses + 1}/${Dungeon.currentRun.miniBosses.length})`;
                stageClass = 'mini-boss';
            } else {
                stageText = `普通怪物 (${Dungeon.currentRun.currentMonsterIndex}/${Dungeon.currentRun.monsters.length})`;
                stageClass = 'normal';
            }

            // 构建地下城信息HTML
            const html = `
                <div class="dungeon-info">
                    <div class="dungeon-header">
                        <div class="dungeon-name">${currentDungeon.name}</div>
                        <div class="dungeon-stage ${stageClass}">${stageText}</div>
                    </div>
                    <div class="dungeon-description">${currentDungeon.description || '无描述'}</div>
                    <div class="dungeon-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="progress-text">${progressPercent}%</div>
                    </div>
                    <div class="dungeon-stats">
                        <div class="stat-item">
                            <span class="stat-label">普通怪物:</span>
                            <span class="stat-value">${Dungeon.currentRun.currentMonsterIndex}/${Dungeon.currentRun.monsters.length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">小BOSS:</span>
                            <span class="stat-value">${Dungeon.currentRun.defeatedMiniBosses}/${Dungeon.currentRun.miniBosses.length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">大BOSS:</span>
                            <span class="stat-value">${Dungeon.currentRun.finalBossAppeared ? (Dungeon.currentRun.isCompleted ? '已击败' : '战斗中') : '未出现'}</span>
                        </div>
                    </div>
                    <div class="dungeon-controls">
                        <button id="dungeon-pause-btn" class="dungeon-btn pause-btn">暂停</button>
                        <button id="dungeon-exit-btn" class="dungeon-btn exit-btn">退出</button>
                    </div>
                </div>
            `;

            dungeonContainer.innerHTML = html;

            // 添加暂停和退出按钮事件
            this.bindDungeonControlEvents();
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

            if (Battle.battleLog) {
                // 直接使用Battle.battleLog
                battleLogs = Battle.battleLog;
            } else if (Battle.getBattleLogs && typeof Battle.getBattleLogs === 'function') {
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

            // 最多显示最近的20条日志
            const recentLogs = battleLogs.slice(-20);

            recentLogs.forEach(log => {
                // 处理日志对象或字符串
                let message = '';
                let logClass = 'normal';
                let time = '';

                if (typeof log === 'string') {
                    message = log;
                    time = new Date().toLocaleTimeString();
                } else if (typeof log === 'object' && log !== null) {
                    message = log.message || '';
                    logClass = log.type || 'normal';
                    time = log.time ? new Date(log.time).toLocaleTimeString() : new Date().toLocaleTimeString();
                }

                // 根据消息内容设置样式
                if (message.includes('击败') || message.includes('胜利')) {
                    logClass = 'success';
                } else if (message.includes('BOSS') || message.includes('遇到了')) {
                    logClass = 'warning';
                } else if (message.includes('失败') || message.includes('被击败')) {
                    logClass = 'danger';
                } else if (message.includes('回合') || message.includes('#####')) {
                    logClass = 'round';
                    // 清理回合标记
                    message = message.replace(/#####/g, '').trim();
                }

                html += `
                    <div class="log-entry ${logClass}">
                        <span class="log-time">${time}</span>
                        <span class="log-content">${message}</span>
                    </div>
                `;
            });

            // 更新日志容器内容
            logContainer.innerHTML = html;

            // 滚动到底部
            logContainer.scrollTop = logContainer.scrollHeight;
        } catch (error) {
            console.error('更新战斗日志时出错:', error);
            const logContainer = document.getElementById('main-battle-log');
            if (logContainer) {
                logContainer.innerHTML = '<div class="empty-message">加载战斗日志时出错</div>';
            }
        }
    },

    /**
     * 获取元素属性的中文名称
     * @param {string} element - 元素属性
     * @returns {string} 中文名称
     */
    getElementName(element) {
        const elementMap = {
            'fire': '火',
            'water': '水',
            'earth': '土',
            'wind': '风',
            'light': '光',
            'dark': '暗'
        };
        return elementMap[element] || element;
    },

    /**
     * 绑定地下城控制按钮事件
     */
    bindDungeonControlEvents() {
        const pauseBtn = document.getElementById('dungeon-pause-btn');
        const exitBtn = document.getElementById('dungeon-exit-btn');

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (typeof DungeonRunner === 'undefined') {
                    console.warn('DungeonRunner模块未定义');
                    return;
                }

                if (DungeonRunner.isRunning) {
                    // 暂停地下城探索
                    DungeonRunner.pauseExploration();
                    pauseBtn.textContent = '继续';
                    pauseBtn.classList.add('paused');
                } else {
                    // 继续地下城探索
                    DungeonRunner.resumeExploration();
                    pauseBtn.textContent = '暂停';
                    pauseBtn.classList.remove('paused');
                }
            });
        }

        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                if (typeof DungeonRunner === 'undefined') {
                    console.warn('DungeonRunner模块未定义');
                    return;
                }

                // 确认是否退出
                if (confirm('确定要退出地下城探索吗？')) {
                    DungeonRunner.exitDungeon();
                }
            });
        }
    },

    /**
     * 注册事件监听
     */
    registerEventListeners() {
        // 监听角色变化事件
        if (typeof Events !== 'undefined') {
            Events.on('character:updated', (data) => {
                console.log('MainUI 收到角色更新事件', data);
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

            // 监听武器变化事件
            Events.on('weapon:updated', () => {
                console.log('MainUI 收到武器更新事件');
                this.updateWeaponBoard();
            });
        }

        // 兼容旧版事件系统
        document.addEventListener('weaponChanged', () => {
            console.log('MainUI 收到武器变化事件');
            this.updateWeaponBoard();
        });
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
