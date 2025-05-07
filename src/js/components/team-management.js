/**
 * 队伍管理模块 - 负责处理队伍管理界面
 */
(function() {
    // 确保UI对象存在
    if (typeof UI === 'undefined') {
        console.error('UI模块未加载');
        return;
    }

    // 队伍最大成员数
    const MAX_TEAM_MEMBERS = 6;
    // 队伍前排成员数（参与战斗的成员数）
    const FRONT_LINE_MEMBERS = 4;

    /**
     * 初始化队伍管理界面
     */
    function initTeamManagement() {
        // 添加事件监听器
        document.addEventListener('click', function(event) {
            // 添加到队伍按钮点击（绿色十字）
            if (event.target.classList.contains('plus-icon') && !event.target.classList.contains('disabled')) {
                const characterId = event.target.dataset.characterId;
                if (characterId) {
                    addCharacterToTeam(characterId);
                }
            }

            // 从队伍移除按钮点击
            if (event.target.classList.contains('remove-from-team-btn')) {
                const characterId = event.target.dataset.characterId;
                if (characterId) {
                    removeCharacterFromTeam(characterId);
                }
            }

            // 创建新队伍按钮点击
            if (event.target.id === 'create-team-btn') {
                createNewTeam();
            }

            // 切换队伍按钮点击
            if (event.target.classList.contains('switch-team-btn')) {
                const teamId = event.target.dataset.teamId;
                if (teamId) {
                    switchActiveTeam(teamId);
                }
            }
        });

        // 监听屏幕切换事件
        document.addEventListener('screenChanged', function(event) {
            if (event.detail.screen === 'character-screen') {
                refreshTeamManagement();
            }
        });

        // 监听角色更新事件
        if (typeof Events !== 'undefined' && typeof Events.on === 'function') {
            Events.on('character:updated', (data) => {
                console.log('队伍管理 - 收到角色更新事件', data);
                // 检查是否是主角的更新
                if (typeof Character !== 'undefined' && typeof Character.getMainCharacter === 'function') {
                    const mainCharacter = Character.getMainCharacter();
                    if (mainCharacter && data.characterId === mainCharacter.id) {
                        console.log('队伍管理 - 主角信息已更新，刷新队伍管理界面');
                        refreshTeamManagement();
                    }
                }
            });

            // 监听武器更新事件
            Events.on('weapon:updated', () => {
                console.log('队伍管理 - 收到武器更新事件，刷新队伍管理界面');
                refreshTeamManagement();
            });
        }
    }

    /**
     * 刷新队伍管理界面
     */
    function refreshTeamManagement() {
        console.log('刷新队伍管理界面');

        // 检查是否需要创建或设置活动队伍
        let needToSetActiveTeam = false;

        // 检查当前活动队伍是否存在
        if (typeof Game !== 'undefined' && typeof Team !== 'undefined') {
            if (!Game.state.activeTeamId) {
                console.log('没有设置活动队伍ID');
                needToSetActiveTeam = true;
            } else {
                // 检查活动队伍是否存在
                const activeTeam = Team.getTeam(Game.state.activeTeamId);
                if (!activeTeam) {
                    console.log(`活动队伍ID ${Game.state.activeTeamId} 不存在，需要重新设置`);
                    needToSetActiveTeam = true;
                }
            }

            // 如果需要设置活动队伍
            if (needToSetActiveTeam) {
                // 尝试使用现有队伍或创建新队伍
                const teams = Object.values(Team.teams || {});
                if (teams.length > 0) {
                    // 如果已有队伍，设置第一个为活动队伍
                    Game.state.activeTeamId = teams[0].id;
                    console.log(`设置已有队伍为活动队伍: ${teams[0].name} (ID: ${teams[0].id})`);

                    // 检查队伍是否包含主角，如果不包含则添加
                    const activeTeam = Team.getTeam(teams[0].id);
                    const mainCharacter = Character.getMainCharacter();

                    if (activeTeam && mainCharacter && !activeTeam.members.includes(mainCharacter.id)) {
                        console.log(`向活动队伍添加主角: ${mainCharacter.name}`);
                        activeTeam.members.push(mainCharacter.id);

                        // 保存游戏状态
                        if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                            console.log('保存添加主角到队伍');
                            Game.saveGame();
                        }
                    }
                } else {
                    // 如果没有队伍，创建一个新队伍
                    const mainCharacter = Character.getMainCharacter();

                    if (!mainCharacter) {
                        console.error('找不到主角，无法创建默认队伍');
                        return;
                    }

                    const teamName = `${mainCharacter.name}的队伍`;
                    const teamData = {
                        name: teamName,
                        members: [mainCharacter.id] // 确保主角在队伍中
                    };

                    const teamId = Team.createTeam(teamData);
                    if (teamId) {
                        Game.state.activeTeamId = teamId;
                        console.log(`创建新队伍并设为活动队伍: ${teamName} (ID: ${teamId})`);

                        // 保存游戏状态
                        if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                            console.log('保存默认队伍创建');
                            Game.saveGame();
                        }
                    }
                }
            }
        }

        renderTeams();
        renderAvailableCharacters();

        // 更新队伍武器盘
        if (typeof TeamWeaponBoard !== 'undefined') {
            console.log('刷新队伍武器盘');

            // 确保队伍有武器盘
            const activeTeamId = Game.state.activeTeamId;
            if (activeTeamId && Team.teams[activeTeamId]) {
                const team = Team.teams[activeTeamId];

                // 如果队伍没有武器盘，创建一个
                if (!team.weaponBoardId && typeof Weapon !== 'undefined') {
                    const weaponBoardName = `board_${team.id}`;
                    const weaponBoard = Weapon.createWeaponBoard(weaponBoardName, 10);
                    team.weaponBoardId = weaponBoard.id;
                    console.log(`在team-management中为队伍 ${team.name} 创建武器盘: ${weaponBoard.id}`);

                    // 保存游戏状态
                    if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                        setTimeout(() => Game.saveGame(), 100);
                    }
                }
            }

            // 渲染武器盘
            if (typeof TeamWeaponBoard.renderTeamWeaponBoard === 'function') {
                setTimeout(() => TeamWeaponBoard.renderTeamWeaponBoard(), 200);
            }
        }
    }

    /**
     * 渲染队伍列表
     */
    function renderTeams() {
        const container = document.getElementById('team-list');
        if (!container) return;

        // 清空容器
        container.innerHTML = '';

        // 获取所有队伍
        if (typeof Team === 'undefined' || !Team.teams) {
            container.innerHTML = '<p>没有队伍</p>';
            return;
        }

        // 获取当前活动队伍ID
        const activeTeamId = Game.state.activeTeamId;

        // 创建队伍卡片
        Object.values(Team.teams).forEach(team => {
            // 创建队伍卡片
            const card = document.createElement('div');
            card.className = `team-card ${team.id === activeTeamId ? 'active' : ''}`;

            // 获取队伍成员
            const members = team.members.map(memberId => Character.getCharacter(memberId)).filter(Boolean);

            // 设置卡片内容
            card.innerHTML = `
                <div class="team-header">
                    <h4>${team.name}</h4>
                    <button class="btn switch-team-btn" data-team-id="${team.id}"
                        ${team.id === activeTeamId ? 'disabled' : ''}>
                        ${team.id === activeTeamId ? '当前队伍' : '切换'}
                    </button>
                </div>
                <div class="team-members">
                    ${members.length > 0 ? `
                        <div class="team-section">
                            <h5>前排队员 (战斗中)</h5>
                            <div class="front-line-members">
                                ${members.slice(0, FRONT_LINE_MEMBERS).map((member, index) => {
                                    // 获取类型和属性的中文名称
                                    const typeDisplay = Character.types[member.type]?.name || member.type;
                                    const attributeDisplay = Character.attributes[member.attribute]?.name || member.attribute;

                                    // 转换稀有度显示（主角不显示稀有度）
                                    let rarityBadge = '';
                                    if (!member.isMainCharacter) {
                                        let rarityDisplay = 'R';
                                        if (member.rarity === 'epic') {
                                            rarityDisplay = 'SR';
                                        } else if (member.rarity === 'legendary') {
                                            rarityDisplay = 'SSR';
                                        }
                                        rarityBadge = `<span class="rarity-badge ${member.rarity}">${rarityDisplay}</span>`;
                                    }

                                    return `
                                        <div class="team-member ${member.rarity}" data-character-id="${member.id}" data-character-instance-id="${member.id}">
                                            <div class="member-position">#${index + 1}</div>
                                            <div class="member-info">
                                                <h4>${member.name}</h4>
                                                ${rarityBadge}
                                                <p>
                                                    等级: ${member.isMainCharacter ? (member.job?.level || 1) : (member.level || 1)}
                                                    <span class="info-separator">|</span>
                                                    类型: ${typeDisplay}
                                                    <span class="info-separator">|</span>
                                                    属性: ${attributeDisplay} <span class="attribute-circle ${member.attribute}"></span>
                                                    ${member.isMainCharacter ? '<span class="main-character-tag">主角</span>' : ''}
                                                </p>
                                            </div>
                                            <div class="member-actions">
                                                ${member.isMainCharacter ?
                                                    '' :
                                                    `<button class="btn remove-from-team-btn" data-character-id="${member.id}">移除</button>`
                                                }
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        ${members.length > FRONT_LINE_MEMBERS ? `
                            <div class="team-section">
                                <h5>后排队员 (备用)</h5>
                                <div class="back-line-members">
                                    ${members.slice(FRONT_LINE_MEMBERS).map((member, index) => {
                                        // 获取类型和属性的中文名称
                                        const typeDisplay = Character.types[member.type]?.name || member.type;
                                        const attributeDisplay = Character.attributes[member.attribute]?.name || member.attribute;

                                        // 转换稀有度显示（主角不显示稀有度）
                                        let rarityBadge = '';
                                        if (!member.isMainCharacter) {
                                            let rarityDisplay = 'R';
                                            if (member.rarity === 'epic') {
                                                rarityDisplay = 'SR';
                                            } else if (member.rarity === 'legendary') {
                                                rarityDisplay = 'SSR';
                                            }
                                            rarityBadge = `<span class="rarity-badge ${member.rarity}">${rarityDisplay}</span>`;
                                        }

                                        return `
                                            <div class="team-member ${member.rarity}" data-character-id="${member.id}" data-character-instance-id="${member.id}">
                                                <div class="member-position">#${index + 5}</div>
                                                <div class="member-info">
                                                    <h4>${member.name}</h4>
                                                    ${rarityBadge}
                                                    <p>
                                                        等级: ${member.isMainCharacter ? (member.job?.level || 1) : (member.level || 1)}
                                                        <span class="info-separator">|</span>
                                                        类型: ${typeDisplay}
                                                        <span class="info-separator">|</span>
                                                        属性: ${attributeDisplay} <span class="attribute-circle ${member.attribute}"></span>
                                                        ${member.isMainCharacter ? '<span class="main-character-tag">主角</span>' : ''}
                                                        ${member.skills && member.skills.length > 0 ?
                                                            `<span class="info-separator">|</span>
                                                            技能: ${member.skills.map(skillId => {
                                                                // 获取技能信息
                                                                let skillName = skillId;
                                                                let skillInfo = null;

                                                                // 尝试从JobSystem获取技能信息
                                                                if (typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                                                                    skillInfo = JobSystem.getSkill(skillId);
                                                                    if (skillInfo && skillInfo.name) {
                                                                        skillName = skillInfo.name;
                                                                    }
                                                                }

                                                                // 如果是R角色技能，尝试从r_skills.json获取
                                                                if (typeof window.r_skills !== 'undefined' && window.r_skills[skillId]) {
                                                                    skillInfo = window.r_skills[skillId];
                                                                    if (skillInfo && skillInfo.name) {
                                                                        skillName = skillInfo.name;
                                                                    }
                                                                }

                                                                // 如果是SR角色技能，尝试从sr_skills.json获取
                                                                if (typeof window.sr_skills !== 'undefined' && window.sr_skills[skillId]) {
                                                                    skillInfo = window.sr_skills[skillId];
                                                                    if (skillInfo && skillInfo.name) {
                                                                        skillName = skillInfo.name;
                                                                    }
                                                                }

                                                                return `<span class="skill-name" data-skill-id="${skillId}">${skillName}</span>`;
                                                            }).join(', ')}`
                                                            : ''}
                                                    </p>
                                                </div>
                                                <div class="member-actions">
                                                    ${member.isMainCharacter ?
                                                        '' :
                                                        `<button class="btn remove-from-team-btn" data-character-id="${member.id}">移除</button>`
                                                    }
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                    ` : '<p>没有队员</p>'}
                </div>
            `;

            // 添加到容器
            container.appendChild(card);
        });
    }

    /**
     * 渲染可用角色列表
     */
    function renderAvailableCharacters() {
        const container = document.getElementById('available-characters-list');
        if (!container) return;

        // 清空容器
        container.innerHTML = '';

        // 获取所有角色
        if (typeof Character === 'undefined' || !Character.characters) {
            console.error('Character模块未定义或没有角色数据');
            container.innerHTML = '<p>没有可用角色</p>';
            return;
        }

        console.log('队伍管理 - Character模块存在，角色数量:', Object.keys(Character.characters).length);

        // 调试输出所有角色的招募状态
        Object.values(Character.characters).forEach(character => {
            console.log(`队伍管理 - 角色 ${character.name} (ID: ${character.id}) - 招募状态: ${character.isRecruited}, 主角: ${character.isMainCharacter}`);
        });

        // 获取当前活动队伍
        const activeTeamId = Game.state.activeTeamId;
        console.log('当前活动队伍ID:', activeTeamId);

        const activeTeam = Team.getTeam(activeTeamId);

        if (!activeTeam) {
            console.error('找不到活动队伍，请先创建或选择一个队伍');
            container.innerHTML = '<p>请先创建或选择一个队伍</p>';

            // 尝试自动创建一个队伍
            if (typeof Character !== 'undefined') {
                const mainCharacter = Character.getMainCharacter();
                if (mainCharacter) {
                    // 创建一个新队伍
                    const teamName = `${mainCharacter.name}的队伍`;
                    const teamData = {
                        name: teamName,
                        members: [mainCharacter.id]
                    };

                    if (typeof Team !== 'undefined' && typeof Team.createTeam === 'function') {
                        const teamId = Team.createTeam(teamData);
                        if (teamId) {
                            // 设置为活动队伍
                            Game.state.activeTeamId = teamId;
                            console.log(`自动创建新队伍并设为活动队伍: ${teamName} (ID: ${teamId})`);

                            // 保存游戏状态
                            if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                                console.log('保存自动创建的队伍');
                                Game.saveGame();
                            }

                            // 刷新队伍管理界面
                            refreshTeamManagement();
                            return;
                        }
                    }
                }
            }

            return;
        }

        console.log('当前活动队伍:', activeTeam.name, '成员数:', activeTeam.members.length);

        // 过滤出可用角色（已招募但不在当前队伍中的角色）
        const availableCharacters = Object.values(Character.characters).filter(
            character => character.isRecruited && !activeTeam.members.includes(character.id)
        );

        console.log('可用角色数量:', availableCharacters.length);

        // 创建角色卡片
        availableCharacters.forEach(character => {
            // 创建角色卡片
            const card = document.createElement('div');
            card.className = `character-card ${character.rarity}`;
            card.dataset.characterId = character.id; // 添加 data-character-id 用于 tooltip
            // 对于可用角色列表，通常是模板角色，所以 instanceId 可以与 id 相同或不设置
            // 如果这些角色在游戏中是唯一实例，则需要设置正确的 instanceId
            card.dataset.characterInstanceId = character.id;

            // 获取类型和属性的中文名称
            const typeDisplay = Character.types[character.type]?.name || character.type;
            const attributeDisplay = Character.attributes[character.attribute]?.name || character.attribute;

            // 转换稀有度显示（主角不显示稀有度）
            let rarityBadge = '';
            if (!character.isMainCharacter) {
                let rarityDisplay = 'R';
                if (character.rarity === 'epic') {
                    rarityDisplay = 'SR';
                } else if (character.rarity === 'legendary') {
                    rarityDisplay = 'SSR';
                }
                rarityBadge = `<span class="rarity-badge ${character.rarity}">${rarityDisplay}</span>`;
            }

            // 设置卡片内容
            // 添加多重抽取显示
            let multiCountDisplay = '';
            if (character.multiCount && character.multiCount > 1) {
                // 检查是否达到多重上限
                if (character.multiCount >= 20) {
                    multiCountDisplay = `<span class="multi-count-badge">+${character.multiCount - 1}</span><span class="multi-count-max">(已达上限)</span>`;
                } else {
                    multiCountDisplay = `<span class="multi-count-badge">+${character.multiCount - 1}</span>`;
                }
            }

            card.innerHTML = `
                <div class="character-info">
                    <h4>${character.name}${multiCountDisplay}</h4>
                    ${rarityBadge}
                    <p>
                        LV: ${character.level || 1}
                        <span class="info-separator">|</span>
                        ${typeDisplay}
                        <span class="info-separator">|</span>
                        ${attributeDisplay} <span class="attribute-circle ${character.attribute}"></span>
                        ${character.isMainCharacter ? '<span class="main-character-tag">主角</span>' : ''}
                    </p>
                </div>
                <div class="character-actions">
                    <span class="plus-icon ${activeTeam.members.length >= MAX_TEAM_MEMBERS ? 'disabled' : ''}"
                          data-character-id="${character.id}" title="添加到队伍">+</span>
                </div>
            `;

            // 添加到容器
            container.appendChild(card);
        });

        // 如果没有可用角色
        if (availableCharacters.length === 0) {
            container.innerHTML = '<p>没有可用角色</p>';
        }
    }

    /**
     * 添加角色到队伍
     * @param {string} characterId - 角色ID
     */
    function addCharacterToTeam(characterId) {
        // 获取当前活动队伍
        const activeTeamId = Game.state.activeTeamId;
        const activeTeam = Team.getTeam(activeTeamId);

        if (!activeTeam) {
            UI.showMessage('请先创建或选择一个队伍');
            return;
        }

        // 检查队伍是否已满
        if (activeTeam.members.length >= MAX_TEAM_MEMBERS) {
            UI.showMessage(`队伍已满，最多只能有${MAX_TEAM_MEMBERS}名成员`);
            return;
        }

        // 检查角色是否已在队伍中
        if (activeTeam.members.includes(characterId)) {
            UI.showMessage('该角色已在队伍中');
            return;
        }

        // 添加角色到队伍
        console.log(`尝试添加角色 ${characterId} 到队伍 ${activeTeamId}`);
        const success = activeTeam.members.indexOf(characterId) === -1;

        if (success) {
            // 添加角色到队伍
            activeTeam.members.push(characterId);
            console.log(`成功添加角色 ${characterId} 到队伍 ${activeTeam.name}`);

            // 保存游戏状态
            if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                console.log('保存队伍变更');
                Game.saveGame();
            }
        }

        if (success) {
            // 显示成功消息
            const character = Character.getCharacter(characterId);
            if (character) {
                UI.showMessage(`${character.name} 已加入队伍`, 'success');
            }

            // 延迟更新界面，确保数据已完全更新
            setTimeout(() => {
                console.log('更新队伍管理界面');
                refreshTeamManagement();
            }, 300);
        } else {
            // 显示失败消息
            UI.showMessage('添加角色到队伍失败', 'error');
        }
    }

    /**
     * 从队伍移除角色
     * @param {string} characterId - 角色ID
     */
    function removeCharacterFromTeam(characterId) {
        // 获取当前活动队伍
        const activeTeamId = Game.state.activeTeamId;
        const activeTeam = Team.getTeam(activeTeamId);

        if (!activeTeam) {
            UI.showMessage('请先创建或选择一个队伍');
            return;
        }

        // 获取角色信息
        const character = Character.getCharacter(characterId);
        if (!character) {
            UI.showMessage('找不到该角色');
            return;
        }

        // 检查是否为主角
        if (character.isMainCharacter) {
            UI.showMessage('主角不能从队伍中移除', 'error');
            return;
        }

        // 检查角色是否在队伍中
        const index = activeTeam.members.indexOf(characterId);
        if (index === -1) {
            UI.showMessage('该角色不在队伍中');
            return;
        }

        // 从队伍移除角色
        console.log(`尝试从队伍 ${activeTeamId} 移除角色 ${characterId}`);

        // 从队伍移除角色
        activeTeam.members.splice(index, 1);
        console.log(`成功从队伍 ${activeTeam.name} 移除角色 ${characterId}`);

        // 保存游戏状态
        if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
            console.log('保存队伍变更');
            Game.saveGame();
        }

        const success = true;

        if (success) {
            // 显示成功消息
            UI.showMessage(`${character.name} 已从队伍移除`, 'success');

            // 延迟更新界面，确保数据已完全更新
            setTimeout(() => {
                console.log('更新队伍管理界面');
                refreshTeamManagement();
            }, 300);
        } else {
            // 显示失败消息
            UI.showMessage('从队伍移除角色失败', 'error');
        }
    }

    /**
     * 创建新队伍
     */
    function createNewTeam() {
        // 弹出输入框
        const teamName = prompt('请输入队伍名称:', '新队伍');
        if (!teamName) return;

        // 获取主角
        const mainCharacter = Character.getMainCharacter();
        if (!mainCharacter) {
            UI.showMessage('找不到主角，无法创建队伍', 'error');
            return;
        }

        // 创建新队伍，默认添加主角
        const teamData = {
            name: teamName,
            members: [mainCharacter.id]
        };

        const teamId = Team.createTeam(teamData);
        if (teamId) {
            // 设置为活动队伍
            Game.state.activeTeamId = teamId;

            // 更新界面
            refreshTeamManagement();

            // 显示成功消息
            UI.showMessage(`队伍 ${teamName} 创建成功，已自动添加主角 ${mainCharacter.name}`, 'success');

            // 保存游戏状态
            if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                console.log('保存队伍创建');
                Game.saveGame();
            }
        } else {
            UI.showMessage('创建队伍失败');
        }
    }

    /**
     * 切换活动队伍
     * @param {string} teamId - 队伍ID
     */
    function switchActiveTeam(teamId) {
        // 设置活动队伍
        console.log(`尝试设置活动队伍: ${teamId}`);

        // 设置为活动队伍
        Game.state.activeTeamId = teamId;
        console.log(`成功设置活动队伍: ${teamId}`);

        // 保存游戏状态
        if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
            console.log('保存队伍变更');
            Game.saveGame();
        }

        const success = true;

        if (success) {
            // 获取队伍信息
            const team = Team.getTeam(teamId);

            // 更新界面
            refreshTeamManagement();

            // 显示成功消息
            UI.showMessage(`已切换到队伍 ${team.name}`, 'success');
        } else {
            UI.showMessage('切换队伍失败', 'error');
        }
    }

    // 初始化
    initTeamManagement();

    // 将方法暴露给UI对象
    UI.refreshTeamManagement = refreshTeamManagement;
})();
