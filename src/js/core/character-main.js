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
        // 默认主角特性
        traits: data.traits || ['quickLearner'],
        // 默认主角职业
        job: {
            current: data.job?.current || 'warrior',
            level: data.job?.level || 1,
            history: data.job?.history || ['warrior'],
            jobLevels: data.job?.jobLevels || { 'warrior': 1 },
            unlockedJobs: data.job?.unlockedJobs || [],
            jobTraits: data.job?.jobTraits || {}
        },
        // 默认属性
        baseStats: {
            hp: 100,
            attack: 10,
            defense: 5,
            speed: 5
        },
        currentStats: {
            hp: 100
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
                characterData.currentStats.hp = characterData.baseStats.hp;
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
            console.log('找到主角:', character.name);
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

    return JobSystem.changeJob(character, newJobId);
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
