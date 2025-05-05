/**
 * 创建主角方法 - 添加到Character对象
 */
Character.createMainCharacter = function(data) {
    // 检查是否已有主角
    const existingMainCharacter = this.getMainCharacter();
    if (existingMainCharacter) {
        console.warn('主角已存在，无法创建新主角');
        return existingMainCharacter.id;
    }

    // 设置主角数据
    const characterData = {
        ...data,
        isMainCharacter: true,
        level: 1,
        exp: 0,
        // 默认主角职业
        job: {
            current: data.job?.current || 'warrior',
            level: data.job?.level || 1,
            history: data.job?.history || ['warrior'],
            jobLevels: data.job?.jobLevels || { 'warrior': 1 },
            unlockedJobs: data.job?.unlockedJobs || []
        },
        // 默认属性
        baseStats: {
            hp: 120,
            attack: 12,
            defense: 8,
            speed: 5
        },
        // 当前属性初始化为与基础属性相同
        currentStats: {
            hp: 120,
            attack: 12,
            defense: 8,
            speed: 5
        },
        // 装备
        equipment: {
            weapon: null,
            armor: null,
            accessory: null
        },
        // 技能
        skills: data.skills || ['warriorSlash']
    };

    // 如果存在职业系统，根据职业调整属性
    if (typeof JobSystem !== 'undefined') {
        const jobInfo = JobSystem.getJob(characterData.job.current);
        if (jobInfo) {
            // 应用职业基础属性
            if (jobInfo.baseStats) {
                characterData.baseStats = {
                    ...characterData.baseStats,
                    ...jobInfo.baseStats
                };
                // 完全复制基础属性到当前属性
                characterData.currentStats = { ...characterData.baseStats };
            }

            // 应用职业技能
            if (jobInfo.skills) {
                characterData.skills = jobInfo.skills;
            }
        }
    }

    // 添加主角
    const characterId = this.addCharacter(characterData);

    if (characterId) {
        console.log(`创建主角成功: ${data.name}`);

        // 设置游戏主角等级
        if (typeof Game !== 'undefined') {
            Game.state.playerLevel = 1;
        }
    }
    console.log(characterData);
    return characterId;
};

/**
 * 获取主角方法 - 添加到Character对象
 * @returns {object|null} 主角对象或null
 */
Character.getMainCharacter = function() {
    // 检查是否有角色数据
    if (!this.characters || Object.keys(this.characters).length === 0) {
        console.log('没有角色数据');
        return null;
    }

    // 遍历所有角色，查找主角
    for (const id in this.characters) {
        const character = this.characters[id];
        if (character && character.isMainCharacter) {
            // console.log('找到主角:', character.name);
            return character;
        }
    }

    console.log('未找到主角');
    return null;
};

/**
 * 获取升级所需经验值 - 添加到Character对象
 * @param {number} level - 当前等级
 * @returns {number} 升级所需经验值
 */
Character.getExpToNextLevel = function(level) {
    // 简单的经验值计算公式
    return Math.floor(100 * Math.pow(1.5, level - 1));
};

/**
 * 获取角色职业名称 - 添加到Character对象
 * @param {object} character - 角色对象
 * @returns {string} 职业名称
 */
Character.getJobName = function(character) {
    if (!character || !character.job || !character.job.current) {
        return '战士';
    }

    if (typeof JobSystem !== 'undefined') {
        const jobInfo = JobSystem.getJob(character.job.current);
        if (jobInfo) {
            return jobInfo.name;
        }
    }

    return character.job.current;
};

/**
 * 获取角色职业等级 - 添加到Character对象
 * @param {object} character - 角色对象
 * @returns {number} 职业等级
 */
Character.getJobLevel = function(character) {
    if (!character || !character.job) {
        return 1;
    }

    return character.job.level || 1;
};

/**
 * 获取角色技能 - 添加到Character对象
 * @param {object} character - 角色对象
 * @returns {array} 技能列表
 */
Character.getCharacterSkills = function(character) {
    if (!character) {
        return [];
    }

    return character.skills || [];
};

/**
 * 切换角色职业 - 添加到Character对象
 * @param {string} characterId - 角色ID
 * @param {string} newJobId - 新职业ID
 * @returns {boolean} 是否成功切换
 */
Character.changeJob = function(characterId, newJobId) {
    const character = this.getCharacter(characterId);
    if (!character) {
        console.error('找不到角色:', characterId);
        return false;
    }

    if (typeof JobSystem === 'undefined' || typeof JobSystem.changeJob !== 'function') {
        console.error('职业系统未就绪');
        return false;
    }

    // 获取旧职业和新职业信息
    const oldJobId = character.job.current;
    const oldJob = JobSystem.getJob(oldJobId);
    const newJob = JobSystem.getJob(newJobId);

    // 切换职业
    const success = JobSystem.changeJob(character, newJobId);

    if (success && character.isMainCharacter) {
        console.log('主角职业变更成功，检查武器兼容性');

        // 获取当前队伍
        if (typeof Game !== 'undefined' && Game.state && Game.state.activeTeamId) {
            const teamId = Game.state.activeTeamId;
            const team = typeof Team !== 'undefined' ? Team.getTeam(teamId) : null;

            if (team) {
                // 获取武器盘
                const weaponBoardId = team.weaponBoardId;
                const weaponBoard = typeof Weapon !== 'undefined' ? Weapon.getWeaponBoard(weaponBoardId) : null;

                if (weaponBoard) {
                    // 获取主手武器
                    const mainWeaponId = weaponBoard.slots.main;

                    if (mainWeaponId) {
                        const mainWeapon = Weapon.getWeapon(mainWeaponId);

                        if (mainWeapon) {
                            console.log(`检查主手武器 ${mainWeapon.name} (类型: ${mainWeapon.type}) 是否与新职业 ${newJob.name} 兼容`);

                            // 检查新职业是否可以使用当前主手武器
                            if (!newJob.allowedWeapons.includes(mainWeapon.type)) {
                                console.log(`新职业 ${newJob.name} 无法使用当前主手武器 ${mainWeapon.name}，将自动移除`);

                                // 移除主手武器
                                Weapon.removeWeaponFromBoard(weaponBoardId, 'main');

                                // 更新UI
                                if (typeof MainUI !== 'undefined' && typeof MainUI.updateWeaponBoard === 'function') {
                                    MainUI.updateWeaponBoard();
                                }

                                if (typeof TeamWeaponBoard !== 'undefined' && typeof TeamWeaponBoard.renderTeamWeaponBoard === 'function') {
                                    TeamWeaponBoard.renderTeamWeaponBoard();
                                }

                                // 显示通知
                                if (typeof UI !== 'undefined' && typeof UI.showNotification === 'function') {
                                    UI.showNotification(`由于职业变更，主手武器 ${mainWeapon.name} 已被移除`, 'warning');
                                }
                            } else {
                                console.log(`新职业 ${newJob.name} 可以使用当前主手武器 ${mainWeapon.name}，无需移除`);
                            }
                        }
                    }
                }
            }
        }
    }

    return success;
};

/**
 * 解锁角色职业 - 添加到Character对象
 * @param {string} characterId - 角色ID
 * @param {string} jobId - 要解锁的职业ID
 * @returns {boolean} 是否成功解锁
 */
Character.unlockJob = function(characterId, jobId) {
    const character = this.getCharacter(characterId);
    if (!character) {
        console.error('找不到角色:', characterId);
        return false;
    }

    if (typeof JobSystem === 'undefined' || typeof JobSystem.unlockJob !== 'function') {
        console.error('职业系统未就绪');
        return false;
    }

    return JobSystem.unlockJob(character, jobId);
};

/**
 * 获取角色可用职业 - 添加到Character对象
 * @param {string} characterId - 角色ID
 * @returns {array} 可用职业列表
 */
Character.getAvailableJobs = function(characterId) {
    const character = this.getCharacter(characterId);
    if (!character) {
        console.error('找不到角色:', characterId);
        return [];
    }

    if (typeof JobSystem === 'undefined' || typeof JobSystem.getAvailableJobs !== 'function') {
        console.error('职业系统未就绪');
        return [];
    }

    return JobSystem.getAvailableJobs(character);
};

/**
 * 更新主角元素属性 - 根据主手武器属性
 * @param {string} teamId - 队伍ID
 * @returns {boolean} 是否成功更新
 */
Character.updateMainCharacterElement = function(teamId) {
    try {
        console.log('更新主角元素属性，队伍ID:', teamId);

        // 获取主角
        const mainCharacter = this.getMainCharacter();
        if (!mainCharacter) {
            console.error('找不到主角');
            return false;
        }
        console.log('当前主角:', mainCharacter.name, '当前元素:', mainCharacter.attribute);

        // 获取队伍
        const team = typeof Team !== 'undefined' ? Team.getTeam(teamId) : null;
        if (!team) {
            console.error('找不到队伍:', teamId);
            return false;
        }
        console.log('找到队伍:', team.name, '(ID:', team.id, ')');

        // 获取武器盘
        const weaponBoardId = team.weaponBoardId;
        console.log('武器盘ID:', weaponBoardId);
        const weaponBoard = typeof Weapon !== 'undefined' ? Weapon.getWeaponBoard(weaponBoardId) : null;
        if (!weaponBoard) {
            console.error('找不到武器盘:', weaponBoardId);
            return false;
        }
        console.log('找到武器盘:', weaponBoard.id);

        // 获取主手武器
        const mainWeaponId = weaponBoard.slots.main;
        console.log('主手武器ID:', mainWeaponId);

        if (mainWeaponId) {
            // 有主手武器，获取武器元素
            const mainWeapon = Weapon.getWeapon(mainWeaponId);
            if (mainWeapon && mainWeapon.element) {
                console.log('找到主手武器:', mainWeapon.name, '元素:', mainWeapon.element);

                // 更新主角元素属性为武器元素
                const oldElement = mainCharacter.attribute;
                mainCharacter.attribute = mainWeapon.element;
                console.log(`主角元素属性已从 ${oldElement} 更新为 ${mainWeapon.element} (来自主手武器 ${mainWeapon.name})`);

                // 触发角色更新事件
                if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
                    console.log('触发character:updated事件');
                    Events.emit('character:updated', { characterId: mainCharacter.id });
                }

                return true;
            } else {
                console.error('主手武器无效或没有元素属性');
            }
        } else {
            // 没有主手武器，设置为默认火属性
            if (mainCharacter.attribute !== 'fire') {
                const oldElement = mainCharacter.attribute;
                mainCharacter.attribute = 'fire';
                console.log(`主角元素属性已从 ${oldElement} 重置为默认火属性 (无主手武器)`);

                // 触发角色更新事件
                if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
                    console.log('触发character:updated事件');
                    Events.emit('character:updated', { characterId: mainCharacter.id });
                }

                return true;
            } else {
                console.log('主角已经是火属性，无需更改');
            }
        }

        return false;
    } catch (error) {
        console.error('更新主角元素属性时出错:', error);
        return false;
    }
};
