/**
 * 队伍管理系统 - 负责游戏中队伍的管理
 */
const Team = {
    // 队伍数据
    teams: {},

    /**
     * 初始化队伍系统
     */
    init() {
        console.log('队伍系统已初始化');
    },

    /**
     * 获取队伍
     * @param {string} teamId - 队伍ID
     * @returns {object|null} 队伍对象
     */
    getTeam(teamId) {
        return this.teams[teamId] || null;
    },

    /**
     * 获取所有队伍
     * @returns {object} 所有队伍对象
     */
    getAllTeams() {
        return this.teams;
    },

    /**
     * 根据成员ID查找队伍
     * @param {string} characterId - 角色ID
     * @returns {object|null} 包含该成员的队伍对象，如果未找到则返回null
     */
    findTeamByMember(characterId) {
        if (!characterId) return null;
        for (const teamId in this.teams) {
            if (this.teams.hasOwnProperty(teamId)) {
                const team = this.teams[teamId];
                if (team.members && team.members.includes(characterId)) {
                    return team;
                }
            }
        }
        return null;
    },

    /**
     * 创建队伍
     * @param {object} data - 队伍数据
     * @returns {string|null} 队伍ID或null
     */
    createTeam(data) {
        try {
            // 确保队伍ID唯一
            let teamId;
            if (data.id) {
                teamId = data.id;
                console.log(`使用提供的队伍ID: ${teamId}`);
            } else {
                const timestamp = Date.now();
                const randomSuffix = Math.floor(Math.random() * 10000);
                teamId = `team_${timestamp}_${randomSuffix}`;
                console.log(`生成新队伍ID: ${teamId}`);
            }

            // 检查ID是否已存在
            if (this.teams[teamId]) {
                console.warn(`队伍ID ${teamId} 已存在，生成新ID`);
                const timestamp = Date.now();
                const randomSuffix = Math.floor(Math.random() * 10000);
                teamId = `team_${timestamp}_${randomSuffix}`;
                console.log(`新生成的队伍ID: ${teamId}`);
            }

            // 确保成员是数组并且有效
            let members = [];
            if (Array.isArray(data.members)) {
                members = [...data.members];

                // 验证成员是否存在
                if (typeof Character !== 'undefined' && typeof Character.getCharacter === 'function') {
                    members = members.filter(memberId => {
                        if (!memberId) return false;
                        const character = Character.getCharacter(memberId);
                        if (!character) {
                            console.warn(`角色ID ${memberId} 不存在，已从队伍中移除`);
                            return false;
                        }
                        return true;
                    });
                }
            }

            // 创建武器盘
            let weaponBoardId = data.weaponBoardId;
            if (!weaponBoardId && typeof Weapon !== 'undefined' && typeof Weapon.createWeaponBoard === 'function') {
                // 为队伍创建一个新的武器盘
                const weaponBoardName = `board_${teamId}`;
                const weaponBoard = Weapon.createWeaponBoard(weaponBoardName, 10); // 10个槽位
                weaponBoardId = weaponBoard.id;
                console.log(`为队伍 ${data.name || '未命名队伍'} 创建武器盘: ${weaponBoardId}`);
            }

            // 创建队伍对象
            const team = {
                id: teamId,
                name: data.name || '未命名队伍',
                members: members,
                weaponBoardId: weaponBoardId,
                isActive: data.isActive || false,
                createdAt: Date.now()
            };

            // 添加到队伍列表
            this.teams[teamId] = team;

            console.log(`创建队伍: ${team.name} (ID: ${teamId}), 成员数: ${members.length}, 武器盘ID: ${weaponBoardId}`);
            if (members.length > 0) {
                console.log(`队伍 ${team.name} 成员ID: ${members.join(', ')}`);
            }

            // 保存游戏状态
            if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                console.log('保存新创建的队伍');
                setTimeout(() => Game.saveGame(), 100);
            }

            return teamId;
        } catch (error) {
            console.error('创建队伍时出错:', error);
            return null;
        }
    },

    /**
     * 添加角色到队伍
     * @param {string} teamId - 队伍ID
     * @param {string} characterId - 角色ID
     * @returns {boolean} 是否成功添加
     */
    addMember(teamId, characterId) {
        const team = this.getTeam(teamId);
        if (!team) return false;

        // 检查角色是否存在
        if (typeof Character !== 'undefined' && typeof Character.getCharacter === 'function') {
            const character = Character.getCharacter(characterId);
            if (!character) {
                console.warn(`添加失败: 角色ID ${characterId} 不存在`);
                return false;
            }
        }

        // 检查角色是否已在队伍中
        if (team.members.includes(characterId)) {
            console.log(`角色 ${characterId} 已在队伍 ${team.name} 中`);
            return false;
        }

        // 检查队伍是否已满
        if (team.members.length >= 6) {
            console.log(`队伍 ${team.name} 已满，无法添加更多角色`);
            return false;
        }

        // 添加角色到队伍
        team.members.push(characterId);

        console.log(`添加角色 ${characterId} 到队伍 ${team.name} (ID: ${teamId})`);
        console.log(`队伍 ${team.name} 当前成员: ${team.members.join(', ')}`);

        // 保存游戏状态
        if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
            setTimeout(() => Game.saveGame(), 100);
        }

        return true;
    },

    /**
     * 从队伍中移除角色
     * @param {string} teamId - 队伍ID
     * @param {string} characterId - 角色ID
     * @returns {boolean} 是否成功移除
     */
    removeMember(teamId, characterId) {
        const team = this.getTeam(teamId);
        if (!team) return false;

        // 检查是否为主角
        if (typeof Character !== 'undefined' && typeof Character.getCharacter === 'function') {
            const character = Character.getCharacter(characterId);
            if (character && character.isMainCharacter) {
                console.warn(`无法移除主角 ${character.name} 从队伍 ${team.name}`);
                return false;
            }
        }

        // 检查角色是否在队伍中
        const index = team.members.indexOf(characterId);
        if (index === -1) {
            console.log(`角色 ${characterId} 不在队伍 ${team.name} 中`);
            return false;
        }

        // 移除角色
        team.members.splice(index, 1);

        console.log(`从队伍 ${team.name} (ID: ${teamId}) 移除角色 ${characterId}`);
        console.log(`队伍 ${team.name} 当前成员: ${team.members.join(', ')}`);

        // 保存游戏状态
        if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
            setTimeout(() => Game.saveGame(), 100);
        }

        return true;
    },

    /**
     * 设置活动队伍
     * @param {string} teamId - 队伍ID
     * @returns {boolean} 是否成功设置
     */
    setActiveTeam(teamId) {
        const team = this.getTeam(teamId);
        if (!team) {
            console.warn(`无法设置活动队伍: 队伍ID ${teamId} 不存在`);
            return false;
        }

        // 重置所有队伍的活动状态
        for (const id in this.teams) {
            this.teams[id].isActive = false;
        }

        // 设置当前队伍为活动状态
        team.isActive = true;

        // 更新Game状态
        if (typeof Game !== 'undefined') {
            Game.state.activeTeamId = teamId;
            console.log(`更新Game.state.activeTeamId为 ${teamId}`);
        }

        console.log(`设置活动队伍: ${team.name} (ID: ${teamId}), 成员数: ${team.members.length}`);
        if (team.members.length > 0) {
            console.log(`队伍 ${team.name} 成员: ${team.members.join(', ')}`);
        }

        // 更新主角元素属性
        if (typeof Character !== 'undefined' && typeof Character.updateMainCharacterElement === 'function') {
            console.log('更新主角元素属性以匹配新队伍的主手武器');
            Character.updateMainCharacterElement(teamId);
        }

        // 保存游戏状态
        if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
            setTimeout(() => Game.saveGame(), 100);
        }

        return true;
    },

    /**
     * 获取活动队伍
     * @returns {object|null} 活动队伍对象
     */
    getActiveTeam() {
        // 从Game状态获取活动队伍ID
        if (typeof Game !== 'undefined' && Game.state.activeTeamId) {
            return this.getTeam(Game.state.activeTeamId);
        }

        // 如果没有设置活动队伍ID，查找isActive为true的队伍
        for (const id in this.teams) {
            if (this.teams[id].isActive) {
                return this.teams[id];
            }
        }

        return null;
    },

    /**
     * 删除队伍
     * @param {string} teamId - 队伍ID
     * @returns {boolean} 是否成功删除
     */
    deleteTeam(teamId) {
        const team = this.getTeam(teamId);
        if (!team) return false;

        // 检查是否为活动队伍
        if (team.isActive) {
            return false;
        }

        // 删除队伍
        delete this.teams[teamId];

        console.log(`删除队伍: ${team.name}`);
        return true;
    },

    /**
     * 重置队伍系统
     */
    reset() {
        this.teams = {};
        this.init();
    },

    /**
     * 获取队伍系统保存数据
     * @returns {object} 可用于保存的数据对象
     */
    getSaveData() {
        // 在保存前验证队伍数据
        const validatedTeams = {};

        Object.entries(this.teams).forEach(([teamId, team]) => {
            // 确保队伍有有效的ID和名称
            if (!teamId || !team.name) {
                console.warn('跳过无效队伍数据');
                return;
            }

            // 确保队伍成员是数组
            const members = Array.isArray(team.members) ? team.members : [];

            // 过滤掉无效的成员ID
            const validMembers = members.filter(memberId => {
                if (!memberId) return false;

                // 如果Character模块存在，验证角色是否存在
                if (typeof Character !== 'undefined' && typeof Character.getCharacter === 'function') {
                    const character = Character.getCharacter(memberId);
                    if (!character) {
                        console.warn(`队伍 ${team.name} 中的角色ID ${memberId} 不存在，已从保存数据中移除`);
                        return false;
                    }
                }

                return true;
            });

            // 创建有效的队伍数据
            validatedTeams[teamId] = {
                id: teamId,
                name: team.name,
                members: validMembers,
                weaponBoardId: team.weaponBoardId
            };

            console.log(`保存队伍 ${team.name} (ID: ${teamId}), 成员数: ${validMembers.length}`);
            if (validMembers.length > 0) {
                console.log(`队伍 ${team.name} 成员ID: ${validMembers.join(', ')}`);
            }
        });

        return {
            teams: validatedTeams
        };
    },

    /**
     * 加载队伍系统保存数据
     * @param {object} data - 保存的数据对象
     */
    loadSaveData(data) {
        console.log('加载队伍系统数据');

        if (!data) {
            console.warn('没有队伍数据可加载');
            return;
        }

        if (data.teams) {
            try {
                // 使用深拷贝确保数据完整性
                const teamsData = JSON.parse(JSON.stringify(data.teams));

                // 清空当前队伍数据
                this.teams = {};

                // 加载队伍数据
                Object.entries(teamsData).forEach(([teamId, teamData]) => {
                    // 验证队伍数据
                    if (!teamId || !teamData.name) {
                        console.warn(`跳过无效队伍数据: ${teamId}`);
                        return;
                    }

                    // 确保队伍成员是数组
                    if (!teamData.members || !Array.isArray(teamData.members)) {
                        console.warn(`队伍 ${teamData.name} 的成员不是数组，已初始化为空数组`);
                        teamData.members = [];
                    }

                    // 验证队伍成员
                    if (typeof Character !== 'undefined' && typeof Character.getCharacter === 'function') {
                        teamData.members = teamData.members.filter(memberId => {
                            if (!memberId) return false;

                            const character = Character.getCharacter(memberId);
                            if (!character) {
                                console.warn(`队伍 ${teamData.name} 中的角色ID ${memberId} 不存在，已从队伍中移除`);
                                return false;
                            }

                            return true;
                        });
                    }

                    // 添加到队伍列表
                    this.teams[teamId] = {
                        id: teamId,
                        name: teamData.name,
                        members: teamData.members,
                        weaponBoardId: teamData.weaponBoardId || null,
                        createdAt: teamData.createdAt || Date.now()
                    };

                    console.log(`加载队伍: ${teamData.name} (ID: ${teamId}), 成员数: ${teamData.members.length}`);
                    if (teamData.members.length > 0) {
                        console.log(`队伍 ${teamData.name} 成员ID: ${teamData.members.join(', ')}`);
                    }
                });

                console.log(`成功加载了 ${Object.keys(this.teams).length} 个队伍`);

                // 检查活动队伍ID是否有效
                if (typeof Game !== 'undefined' && Game.state && Game.state.activeTeamId) {
                    const activeTeamId = Game.state.activeTeamId;
                    if (!this.teams[activeTeamId]) {
                        console.warn(`活动队伍ID ${activeTeamId} 在加载的队伍中不存在!`);

                        // 如果有队伍，设置第一个为活动队伍
                        const teamIds = Object.keys(this.teams);
                        if (teamIds.length > 0) {
                            Game.state.activeTeamId = teamIds[0];
                            console.log(`自动修复: 将活动队伍ID设置为 ${teamIds[0]}`);
                        } else {
                            Game.state.activeTeamId = null;
                            console.log('没有可用队伍，将活动队伍ID设置为null');
                        }
                    }
                }

                // 保存加载后的队伍数据
                if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                    console.log('保存加载后的队伍数据');
                    setTimeout(() => Game.saveGame(), 500); // 延迟保存，确保所有数据都已加载
                }
            } catch (error) {
                console.error('加载队伍数据时出错:', error);
                this.teams = {}; // 重置队伍数据
            }
        } else {
            console.warn('加载的数据中没有队伍信息');
        }
    }
};
