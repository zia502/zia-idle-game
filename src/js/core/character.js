/**
 * 角色管理系统 - 负责游戏中角色的管理
 */
const Character = {
    // 角色数据
    characters: {},

    // 角色类型定义
    types: {
        attack: {
            name: '攻击',
            description: '专注于造成高伤害',
            growthRates: { hp: 10, attack: 3, defense: 0.5, speed: 1 }
        },
        defense: {
            name: '防御',
            description: '专注于提高生存能力',
            growthRates: { hp: 15, attack: 1, defense: 2, speed: 0.5 }
        },
        special: {
            name: '特殊',
            description: '擅长特殊技能和属性效果',
            growthRates: { hp: 12, attack: 2, defense: 1, speed: 1.5 }
        },
        healing: {
            name: '治疗',
            description: '擅长恢复队友生命和提供增益',
            growthRates: { hp: 8, attack: 0.8, defense: 1.2, speed: 2 }
        }
    },

    // 属性定义
    attributes: {
        fire: {
            name: '火',
            description: '擅长持续伤害',
            strengths: ['wind'],
            weaknesses: ['water']
        },
        water: {
            name: '水',
            description: '擅长控制和减速',
            strengths: ['fire'],
            weaknesses: ['earth']
        },
        wind: {
            name: '风',
            description: '擅长速度和回避',
            strengths: ['earth'],
            weaknesses: ['fire']
        },
        earth: {
            name: '土',
            description: '擅长防御和抵抗',
            strengths: ['water'],
            weaknesses: ['wind']
        },
        light: {
            name: '光',
            description: '擅长治疗和增益',
            strengths: ['dark'],
            weaknesses: []
        },
        dark: {
            name: '暗',
            description: '擅长削弱和诅咒',
            strengths: [],
            weaknesses: ['light']
        }
    },

    // 角色稀有度定义
    rarities: {
        rare: {
            name: '稀有',
            color: '#2196f3',
            statMultiplier: 1.5,
            maxLevel: 60,
            maxTraits: 1 // 稀有角色最多1个特性
        },
        epic: {
            name: '史诗',
            color: '#9c27b0',
            statMultiplier: 1.8,
            maxLevel: 80,
            maxTraits: 2 // 史诗角色最多2个特性
        },
        legendary: {
            name: '传说',
            color: '#ff9800',
            statMultiplier: 2.2,
            maxLevel: 100,
            maxTraits: 3 // 传说角色最多3个特性
        }
    },


    init(){
        // 初始化传说角色数组
        this.legendaryCharacters = [];

        // 初始化可招募角色数组
        this.recruitableCharacters = [];

        // 初始化R、SR和SSR角色数组
        this.rCharacters = [];
        this.srCharacters = [];
        this.ssrCharacters = [];

        // 加载R、SR和SSR角色数据
        this.loadCharacterData('r', 'src/data/r.json');
        this.loadCharacterData('sr', 'src/data/sr.json');
        this.loadCharacterData('ssr', 'src/data/ssr.json');
    },

    /**
     * 加载角色数据
     * @param {string} type - 角色类型 ('sr' 或 'ssr')
     * @param {string} url - JSON文件的URL
     * @returns {Promise} 加载完成的Promise
     */
    loadCharacterData(type, url) {
        console.log(`开始加载${type.toUpperCase()}角色数据...`);

        // 返回Promise以便调用者可以等待加载完成
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {

                // 根据角色类型设置稀有度
                let rarityValue;
                if (type === 'r') {
                    rarityValue = 'rare';
                } else if (type === 'sr') {
                    rarityValue = 'epic';
                } else if (type === 'ssr') {
                    rarityValue = 'legendary';
                }

                // 为每个角色添加rarity属性
                const characters = Object.values(data).map(character => {
                    return {
                        ...character,
                        rarity: rarityValue // 如果已有rarity属性则保留，否则使用根据类型设置的值
                    };
                });

                if (type === 'r') {
                    this.rCharacters = characters;
                    console.log(`加载了 ${this.rCharacters.length} 个R角色`);
                } else if (type === 'sr') {
                    this.srCharacters = characters;
                    console.log(`加载了 ${this.srCharacters.length} 个SR角色`);
                } else if (type === 'ssr') {
                    this.ssrCharacters = characters;
                    console.log(`加载了 ${this.ssrCharacters.length} 个SSR角色`);
                }

                // 触发角色数据加载完成事件
                if (typeof Events !== 'undefined') {
                    Events.emit(`${type}Characters:loaded`, {
                        type: type,
                        count: type === 'r' ? this.rCharacters.length :
                               type === 'sr' ? this.srCharacters.length : this.ssrCharacters.length
                    });
                }

                // 打印修改后的角色数据，包含rarity属性
                if (type === 'r') {
                    console.log(`成功加载${type.toUpperCase()}角色数据:`);
                    return this.rCharacters;
                } else if (type === 'sr') {
                    console.log(`成功加载${type.toUpperCase()}角色数据:`);
                    return this.srCharacters;
                } else {
                    console.log(`成功加载${type.toUpperCase()}角色数据:`);
                    return this.ssrCharacters;
                }
            })
            .catch(error => {
                console.error(`加载${type.toUpperCase()}角色数据失败:`, error);
                if (type === 'r') {
                    this.rCharacters = []; // 设置为空数组
                } else if (type === 'sr') {
                    this.srCharacters = []; // 设置为空数组
                } else if (type === 'ssr') {
                    this.ssrCharacters = []; // 设置为空数组
                }
                throw error; // 重新抛出错误以便调用者可以捕获
            });
    },

    /**
     * 确保R角色数据已加载
     * @returns {Promise} 加载完成的Promise
     */
    ensureRCharactersLoaded() {
        // 如果R角色数据已加载，直接返回
        if (Array.isArray(this.rCharacters) && this.rCharacters.length > 0) {
            console.log('R角色数据已加载，共 ' + this.rCharacters.length + ' 个角色');
            return Promise.resolve(this.rCharacters);
        }

        // 否则加载R角色数据
        console.log('R角色数据未加载，开始加载...');
        return this.loadCharacterData('r', 'src/data/r.json');
    },

    /**
     * 确保SR角色数据已加载
     * @returns {Promise} 加载完成的Promise
     */
    ensureSRCharactersLoaded() {
        // 如果SR角色数据已加载，直接返回
        if (Array.isArray(this.srCharacters) && this.srCharacters.length > 0) {
            console.log('SR角色数据已加载，共 ' + this.srCharacters.length + ' 个角色');
            return Promise.resolve(this.srCharacters);
        }

        // 否则加载SR角色数据
        console.log('SR角色数据未加载，开始加载...');
        return this.loadCharacterData('sr', 'src/data/sr.json');
    },

    /**
     * 确保SSR角色数据已加载
     * @returns {Promise} 加载完成的Promise
     */
    ensureSSRCharactersLoaded() {
        // 如果SSR角色数据已加载，直接返回
        if (Array.isArray(this.ssrCharacters) && this.ssrCharacters.length > 0) {
            console.log('SSR角色数据已加载，共 ' + this.ssrCharacters.length + ' 个角色');
            return Promise.resolve(this.ssrCharacters);
        }

        // 否则加载SSR角色数据
        console.log('SSR角色数据未加载，开始加载...');
        return this.loadCharacterData('ssr', 'src/data/ssr.json');
    },
    /**
     * 获取角色
     * @param {string} characterId - 角色ID
     * @returns {object|null} 角色对象
     */
    getCharacter(characterId) {

        const character = this.characters[characterId] || null;

        if (!character) {
            console.log(`未找到角色: ${characterId}`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`未找到角色: ${characterId}`);
            }
        } else {

            // 检查角色是否在地下城中
            const inDungeon = typeof Dungeon !== 'undefined' &&
                              Dungeon.currentRun &&
                              character.dungeonOriginalStats;

            // 如果角色不在地下城中，或者其地下城状态异常 (例如有 dungeonOriginalStats 但游戏认为不在地下城)
            // 则需要确保其 currentStats 和 weaponBonusStats 是基于其最新的 baseStats 和 multiBonusStats 计算的。
            // 假设角色此时不属于任何特定队伍，因此 teamId 为 null。
            if (!inDungeon || (character.dungeonOriginalStats && (!Dungeon || !Dungeon.currentRun))) {
                if (character.dungeonOriginalStats && (!Dungeon || !Dungeon.currentRun)) {
                    console.log(`检测到角色 ${character.name} 存在异常地下城状态，清除 dungeonOriginalStats。属性将在需要时重新计算。`);
                    delete character.dungeonOriginalStats;
                     // 清除地下城相关的被动和BUFF
                    if (character.dungeonAppliedPassives) delete character.dungeonAppliedPassives;
                    if (typeof BuffSystem !== 'undefined') BuffSystem.clearAllBuffs(character);
                    else if (character.buffs) character.buffs = [];
                }
                // console.log(`角色 ${character.name} 不在地下城中或状态异常。注意：属性更新已从此函数移除，应在其他适当位置调用。`);
                // 移除: this._updateCharacterEffectiveStats(characterId, null);
            }
        }

        return character;
    },

    /**
     * 获取所有角色
     * @returns {object} 所有角色对象
     */
    getAllCharacters() {
        return this.characters;
    },

    /**
     * 获取主角
     * @returns {object|null} 主角对象
     */
    getMainCharacter() {
        const mainCharacter = Object.values(this.characters).find(character => character.isMainCharacter) || null;

        // 如果找到主角，确保currentStats是最新的
        if (mainCharacter) {
            // 判断是否在地下城中 - 更准确的判断方法
            const inDungeon = typeof Dungeon !== 'undefined' &&
                              Dungeon.currentRun &&
                              mainCharacter.dungeonOriginalStats;

            // 如果主角不在地下城中，或者其地下城状态异常
            if (!inDungeon || (mainCharacter.dungeonOriginalStats && (!Dungeon || !Dungeon.currentRun))) {
                if (mainCharacter.dungeonOriginalStats && (!Dungeon || !Dungeon.currentRun)) {
                    console.log(`检测到主角 ${mainCharacter.name} 存在异常地下城状态，清除 dungeonOriginalStats 并重新计算属性。`);
                    delete mainCharacter.dungeonOriginalStats;
                    if (mainCharacter.dungeonAppliedPassives) delete mainCharacter.dungeonAppliedPassives;
                    if (typeof BuffSystem !== 'undefined') BuffSystem.clearAllBuffs(mainCharacter);
                    else if (mainCharacter.buffs) mainCharacter.buffs = [];
                }
                // console.log(`主角 ${mainCharacter.name} 不在地下城中或状态异常，更新其有效属性。`);
                // 尝试获取主角当前所在的队伍ID
                let teamId = null;
                if (typeof Team !== 'undefined' && Team.findTeamByMember) {
                    const team = Team.findTeamByMember(mainCharacter.id);
                    if (team) {
                        teamId = team.id;
                    }
                }
                this._updateCharacterEffectiveStats(mainCharacter.id, teamId);
            }
        }

        return mainCharacter;
    },

    /**
     * 创建新角色
     * @param {object} data - 角色数据
     * @returns {object} 新角色对象
     */
    createCharacter(data) {
        const type = data.type || 'attack';
        const attribute = data.attribute || 'fire';
        const typeData = this.types[type];
        const attributeData = this.attributes[attribute];

        if (!typeData || !attributeData) return null;

        const characterId = data.id || `char_${Date.now()}`;

        // 使用传入的baseStats或创建一个默认的基础属性对象
        const baseStats = { ...data.baseStats }; // 创建深拷贝，确保原始数据不被修改
        if (!baseStats.maxHp) baseStats.maxHp = baseStats.hp; // 确保maxHp存在
        if (!baseStats.maxAttack) baseStats.maxAttack = baseStats.attack; // 确保maxAttack存在, 假设基础攻击力也是最大攻击力

        const rarity = data.rarity || 'rare'; // 默认稀有度为rare
        const rarityData = this.rarities[rarity] || this.rarities.rare;

        // 对于主角，特性系统已被技能系统取代
        const isMainCharacter = data.isMainCharacter || false;

        // 初始化 multiBonusStats
        const initialMultiBonusStats = {
            hp: 0,
            attack: 0,
            defense: 0,
            // 根据需要添加其他可被突破加成的属性
        };

        // 创建角色对象
        const character = {
            id: characterId,
            name: data.name || '未命名',
            type: type,
            attribute: attribute,
            level: data.level || 1,
            exp: data.exp || 0,
            nextLevelExp: this.calculateNextLevelExp(data.level || 1),
            skills: data.skills || [],
            baseStats: baseStats, // 纯粹原始基础属性
            weaponBonusStats: { ...baseStats }, // 初始时，武器盘加成属性等于基础属性
            multiBonusStats: data.multiBonusStats ? { ...data.multiBonusStats } : initialMultiBonusStats,
            currentStats: { ...baseStats }, // 初始currentStats，后续会由专门函数更新
            growthRates: { ...typeData.growthRates },
            isMainCharacter: isMainCharacter,
            isRecruited: data.isRecruited || false,
            rarity: rarity,
            maxLevel: rarityData.maxLevel, // 设置角色等级上限
            nextAttackCritical: false,
            shield: 0,
            // bonusMultiplier: data.bonusMultiplier || 0, // 已移除传说加成
            stats: {
                totalDamage: 0,
                totalHealing: 0,
                mvpCount: 0,
                battlesParticipated: 0
            },
            job: isMainCharacter ? (data.job || {
                current: 'novice',
                level: 1,
                history: ['novice'],
            }) : null,
            multiCount: data.multiCount || 1
        };

        // 已移除传说加成 bonusMultiplier 的直接应用
        
        // 如果角色在创建时就有 multiCount > 1 且 multiBonusStats 未提供，则计算初始的 multiBonusStats
        if (character.multiCount > 1 && !data.multiBonusStats) {
            this.updateMultiBonusStats(character); // updateMultiBonusStats 将填充 character.multiBonusStats
        }
        // 注意：创建角色后，应调用一个统一的函数来计算最终的 currentStats，
        // 例如 this._updateCharacterEffectiveStats(character);
        // 但根据指令，这里只做属性定义和初始计算相关的修改。

        return character;
    },

    /**
     * 添加角色
     * @param {object} characterData - 角色数据
     */
    addCharacter(characterData) {
        const character = this.createCharacter(characterData);
        if (!character) return null;

        this.characters[character.id] = character;

        // 如果是招募的角色，增加统计
        if (character.isRecruited) {
            Game.stats.charactersRecruited++;
        }

        console.log(`添加角色: ${character.name}`);
        return character.id;
    },

    /**
     * 移除角色
     * @param {string} characterId - 角色ID
     * @returns {boolean} 是否移除成功
     */
    removeCharacter(characterId) {
        const character = this.getCharacter(characterId);
        if (!character) return false;

        // 检查是否为主角
        if (character.isMainCharacter) {
            UI.showMessage('主角不能被移除');
            return false;
        }

        // 检查是否在队伍中
        const teams = Team.getAllTeams();
        for (const team of Object.values(teams)) {
            if (team.members.includes(characterId)) {
                UI.showMessage(`${character.name} 仍在队伍 ${team.name} 中，请先移除`);
                return false;
            }
        }

        delete this.characters[characterId];
        console.log(`移除角色: ${character.name}`);
        return true;
    },

    /**
     * 计算下一级所需经验
     * @param {number} level - 当前等级
     * @returns {number} 下一级所需经验值
     */
    calculateNextLevelExp(level) {
        return Math.floor(100 * Math.pow(1.1, level - 1));
    },

    /**
     * 角色升级
     * @param {string} characterId - 角色ID
     * @param {number} levels - 升级数量
     */
    levelUpCharacter(characterId, levels = 1) {
        const character = this.getCharacter(characterId);
        if (!character) return;

        let statsChanged = false;
        for (let i = 0; i < levels; i++) {
            if (character.level >= character.maxLevel) {
                if (typeof UI !== 'undefined' && typeof UI.showMessage === 'function') {
                    UI.showMessage(`${character.name} 已达到最高等级 ${character.maxLevel}`);
                }
                break;
            }

            character.level++;
            statsChanged = true;
            // console.log("升级前纯粹 baseStats:", JSON.parse(JSON.stringify(character.baseStats)));

            // 等级提升直接修改纯粹的 baseStats
            if (character.isMainCharacter && character.job && typeof JobSystem !== 'undefined') {
                const jobId = character.job.current;
                const job = JobSystem.getJob(jobId);
                if (job && job.baseStats && job.maxStats) {
                    const jobLevel = character.job.level || 1; // 假设职业等级与角色等级同步或有自己的逻辑
                    const levelRatio = Math.min(1, Math.max(0, (jobLevel - 1) / 19));
                    for (const stat in job.baseStats) {
                        if (job.maxStats[stat] && character.baseStats.hasOwnProperty(stat)) {
                            const baseValue = job.baseStats[stat];
                            const maxValue = job.maxStats[stat];
                            character.baseStats[stat] = Math.floor(baseValue + (maxValue - baseValue) * levelRatio);
                        }
                    }
                } else { // 回退到成长率
                    character.baseStats.hp = (character.baseStats.hp || 0) + (character.growthRates.hp || 0);
                    character.baseStats.attack = (character.baseStats.attack || 0) + (character.growthRates.attack || 0);
                    // 其他属性...
                }
            } else {
                character.baseStats.hp = (character.baseStats.hp || 0) + (character.growthRates.hp || 0);
                character.baseStats.attack = (character.baseStats.attack || 0) + (character.growthRates.attack || 0);
                // 其他属性...
            }
            
            // 确保 maxHp 和 maxAttack 更新
            if (character.baseStats.hasOwnProperty('hp')) character.baseStats.maxHp = character.baseStats.hp;
            if (character.baseStats.hasOwnProperty('attack')) character.baseStats.maxAttack = character.baseStats.attack;


            character.nextLevelExp = this.calculateNextLevelExp(character.level);
            // console.log(`${character.name} 升级到 ${character.level} 级, 更新后纯粹 baseStats:`, JSON.parse(JSON.stringify(character.baseStats)));
        }

        if (statsChanged) {
            // 确定角色当前所属的队伍ID，如果角色不在任何队伍中，teamId 可以是 null
            let teamId = null;
            if (typeof Team !== 'undefined' && Team.findTeamByMember) {
                const team = Team.findTeamByMember(characterId);
                if (team) {
                    teamId = team.id;
                }
            }
            this._updateCharacterEffectiveStats(characterId, teamId);
        }

        if (character.isMainCharacter) {
            Game.state.playerLevel = character.level;
        }
    },




    /**
     * 添加经验值
     * @param {string} characterId - 角色ID
     * @param {number} expAmount - 经验值数量
     */
    addExperience(characterId, expAmount) {
        const character = this.getCharacter(characterId);
        if (!character) return;

        console.log(`角色 ${character.name} 获得经验值: ${expAmount}`);

        character.exp += expAmount;

        // 如果是主角，同时给当前职业添加经验
        if (character.isMainCharacter && character.job && typeof JobSystem !== 'undefined' && typeof JobSystem.addJobExp === 'function') {
            JobSystem.addJobExp(character, expAmount);
        }

        // 检查是否可以升级
        while (character.exp >= character.nextLevelExp) {
            character.exp -= character.nextLevelExp;
            this.levelUpCharacter(characterId);
        }
    },

    /**
     * 角色招募
     * @param {string} templateId - 角色模板ID
     * @returns {string|null} 新角色ID或null
     */
    recruitCharacter(templateId) {
        // 检查是否是传说角色
        const isLegendary = templateId.startsWith('legend');

        let template;
        if (isLegendary && Array.isArray(this.legendaryCharacters)) {
            template = this.legendaryCharacters.find(c => c.id === templateId);
        } else if (this.recruitableCharacters) {
            template = this.recruitableCharacters.find(c => c.id === templateId);
        }

        if (!template) return null;

        // 检查传说角色是否已招募过
        if (isLegendary) {
            const existingLegendary = Object.values(this.characters).find(
                char => char.id.includes(template.id) && char.rarity === 'legendary' && char.isRecruited // 确保是已招募的
            );

            if (existingLegendary) {
                // 已有该传说角色，不再进行 bonusMultiplier 增强，直接提示或返回
                UI.showNotification(`${existingLegendary.name} 已经是传说中的伙伴了！`);
                return existingLegendary.id;
            }
        }

        // 检查非传奇角色是否已经招募（通过角色名称和稀有度检查）
        // 注意: 这里需要先获取角色完整信息
        let existingCharacter = null;
        if (!isLegendary && template.name) {
            existingCharacter = Object.values(this.characters).find(
                character => character.name === template.name && 
                             character.rarity === template.rarity &&
                             character.isRecruited
            );
        }

        if (existingCharacter) {
            // 角色已存在，增加多重加成计数
            if (!existingCharacter.multiCount) {
                existingCharacter.multiCount = 1; // 初始值
            }
            existingCharacter.multiCount += 1;

            // 计算并更新 multiBonusStats (纯增量)
            const refundInfo = this.updateMultiBonusStats(existingCharacter);
            
            // 更新角色的 currentStats 和 weaponBonusStats
            let teamId = null;
            if (typeof Team !== 'undefined' && Team.findTeamByMember) {
                const team = Team.findTeamByMember(existingCharacter.id);
                if (team) teamId = team.id;
            }
            this._updateCharacterEffectiveStats(existingCharacter.id, teamId);

            if (refundInfo) {
                if (typeof Game !== 'undefined' && typeof Game.addGold === 'function') {
                    Game.addGold(refundInfo.refundAmount);
                    UI.showNotification(`${existingCharacter.name} 已达到多重上限(${MULTI_LIMIT})，返还 ${refundInfo.refundAmount} 金币`);
                }
            } else {
                UI.showNotification(`已增强 ${existingCharacter.name} (重复 +${existingCharacter.multiCount - 1})`);
            }
            return existingCharacter.id;
        }

        // 创建新角色ID
        const uniqueId = `${template.id}_${Date.now()}`;

        // 基于模板创建角色
        const characterData = {
            ...template,
            id: uniqueId,
            level: 1,
            exp: 0,
            isRecruited: true,
            // bonusMultiplier: template.bonusMultiplier || 0, // 已移除传说加成
            multiCount: 1 // 新添加的属性，初始值为1表示第一次获得
        };

        // 添加角色
        const newCharacterId = this.addCharacter(characterData);
        if (newCharacterId) {
            // 新创建的角色，其 currentStats 和 weaponBonusStats 在 createCharacter 中已基于 baseStats 初始化。
            // 如果需要立即应用队伍的武器盘（如果角色直接加入队伍），则需要调用 _updateCharacterEffectiveStats
            // 假设新招募的角色暂时不属于任何队伍，其 weaponBonusStats 等于 baseStats。
            // 如果有默认队伍或立即分配队伍的逻辑，这里需要调整。
            this._updateCharacterEffectiveStats(newCharacterId, null); // 假设初始不在队伍
            UI.showNotification(`成功招募 ${template.name}`);
            Game.stats.charactersRecruited++;
        }
        return newCharacterId;
    },

    /**
     * 更新角色的多重加成属性 (multiBonusStats) - 这些是纯粹的增量值
     * @param {object} character - 角色对象
     * @returns {object|null} 如果超过上限返回金币补偿信息，否则返回null
     */
    updateMultiBonusStats(character) {
        if (!character || !character.multiCount) {
            if (character) {
                 character.multiBonusStats = character.multiBonusStats || { hp: 0, attack: 0, defense: 0 };
            }
            return null;
        }

        // 确保 multiBonusStats 对象存在且有基本结构
        character.multiBonusStats = character.multiBonusStats || { hp: 0, attack: 0, defense: 0 };


        if (character.multiCount <= 1) {
            character.multiBonusStats.hp = 0;
            character.multiBonusStats.attack = 0;
            character.multiBonusStats.defense = 0;
            // 重置其他可能的突破属性
            return null;
        }

        const MULTI_LIMIT = 20;
        let effectiveMultiCountForBonus = character.multiCount;
        let refundInfo = null;

        if (character.multiCount > MULTI_LIMIT) {
            let refundAmount = 0;
            if (character.rarity === 'rare') refundAmount = 10;
            else if (character.rarity === 'epic') refundAmount = 100;
            else if (character.rarity === 'legendary') refundAmount = 1000;
            
            refundInfo = {
                refundAmount: refundAmount * (character.multiCount - MULTI_LIMIT),
                characterName: character.name
            };
            effectiveMultiCountForBonus = MULTI_LIMIT;
        }

        const bonusCount = effectiveMultiCountForBonus - 1; // 实际产生加成的次数
        
        // 使用角色的纯粹 baseStats 来计算增量
        const pureBaseStats = character.baseStats; // 假设此刻 baseStats 是纯净的

        character.multiBonusStats.hp = Math.floor((pureBaseStats.maxHp || pureBaseStats.hp || 0) * 0.01 * bonusCount);
        character.multiBonusStats.attack = Math.floor((pureBaseStats.maxAttack || pureBaseStats.attack || 0) * 0.01 * bonusCount);
        character.multiBonusStats.defense = bonusCount;
        
        // console.log(`更新了 ${character.name} 的 multiBonusStats (纯增量): ${bonusCount} 次突破`, character.multiBonusStats);
        return refundInfo;
    },
    
    // applyMultiBonusToStats 已废弃

    /**
     * 获取角色招募成本
     * @param {object} characterTemplate - 角色模板
     * @returns {number} 招募成本
     */
    getRecruitmentCost(characterTemplate) {
        const baseCost = {
            'common': 500,
            'uncommon': 1000,
            'rare': 2000,
            'epic': 5000,
            'legendary': 10000
        };

        return baseCost[characterTemplate.rarity] || 2000;
    },

    /**
     * 生成随机可招募角色
     * @param {number} count - 生成数量
     * @returns {array} 可招募角色数组
     */
    generateRandomRecruitables(count = 3) {
        const result = [];

        // 随机决定是否有传说角色出现（概率较低）
        const hasLegendary = Math.random() < 0.05; // 5%概率出现传说角色

        if (hasLegendary && count > 0 && Array.isArray(this.legendaryCharacters) && this.legendaryCharacters.length > 0) {
            // 随机选择一个传说角色
            const availableLegendaries = [...this.legendaryCharacters];
            const randomIndex = Math.floor(Math.random() * availableLegendaries.length);
            const selected = availableLegendaries[randomIndex];

            // 复制并添加唯一标识
            const copy = {...selected};
            result.push(copy);
            count--; // 减少一个需要生成的角色数量
        }

        // 生成其余角色
        for (let i = 0; i < count; i++) {
            // 决定稀有度
            let rarity;
            const roll = Math.random();
            if (roll < 0.75) { // 75%概率
                rarity = 'rare';

                // 如果是稀有角色，从R角色数据中随机选择一个
                if (this.rCharacters && this.rCharacters.length > 0) {
                    const rIndex = Math.floor(Math.random() * this.rCharacters.length);
                    const rTemplate = this.rCharacters[rIndex];

                    // 在添加新角色前，检查是否已存在该角色
                    const existingCharacter = Object.values(this.characters).find(
                        character => character.name === rTemplate.name && 
                                     character.rarity === 'rare' &&
                                     character.isRecruited
                    );

                    if (existingCharacter) {
                        // 角色已存在，增加多重抽取计数
                        if (!existingCharacter.multiCount) {
                            existingCharacter.multiCount = 1;
                        }
                        existingCharacter.multiCount += 1;
                        
                        // 更新多重加成属性
                        const refundInfo = this.updateMultiBonusStats(existingCharacter);
                        
                        // 创建一个副本用于显示结果
                        const rCharacterCopy = {...existingCharacter};
                        
                        // 添加返还金币信息
                        if (refundInfo) {
                            rCharacterCopy.refundInfo = refundInfo;
                            // 增加金币
                            if (typeof Game !== 'undefined' && typeof Game.addGold === 'function') {
                                Game.addGold(refundInfo.refundAmount);
                            }
                        }
                        
                        result.push(rCharacterCopy);
                        continue;
                    }

                    // 复制模板并调整ID和稀有度
                    const rCharacter = {
                        ...rTemplate,
                        id: `r_${Date.now()}_${i}`,
                        rarity: 'rare',
                        isRecruited: true,
                        level: 1,
                        exp: 0,
                        nextLevelExp: this.calculateNextLevelExp(1),
                        maxLevel: this.rarities['rare'].maxLevel,
                        nextAttackCritical: false,
                        shield: 0,
                        bonusMultiplier: 0,
                        currentStats: {...rTemplate.baseStats},
                        traitUnlockLevels: {
                            second: 65,
                            third: 90
                        },
                        stats: {
                            totalDamage: 0,
                            totalHealing: 0,
                            mvpCount: 0,
                            battlesParticipated: 0
                        },
                        multiCount: 1
                    };

                    result.push(rCharacter);
                    continue; // 跳过其余的角色创建步骤
                }
                // 如果没有R角色数据，继续使用随机生成的方式
            } else if (roll < 0.90) { // 15%概率
                rarity = 'epic';

                // 如果是史诗角色，从SR角色数据中随机选择一个
                if (this.srCharacters && this.srCharacters.length > 0) {
                    const srIndex = Math.floor(Math.random() * this.srCharacters.length);
                    const srTemplate = this.srCharacters[srIndex];

                    // 在添加新角色前，检查是否已存在该角色
                    const existingCharacter = Object.values(this.characters).find(
                        character => character.name === srTemplate.name && 
                                     character.rarity === 'epic' &&
                                     character.isRecruited
                    );

                    if (existingCharacter) {
                        // 角色已存在，增加多重抽取计数
                        if (!existingCharacter.multiCount) {
                            existingCharacter.multiCount = 1;
                        }
                        existingCharacter.multiCount += 1;
                        
                        // 更新多重加成属性
                        const refundInfo = this.updateMultiBonusStats(existingCharacter);
                        
                        // 创建一个副本用于显示结果
                        const srCharacterCopy = {...existingCharacter};
                        
                        // 添加返还金币信息
                        if (refundInfo) {
                            srCharacterCopy.refundInfo = refundInfo;
                            // 增加金币
                            if (typeof Game !== 'undefined' && typeof Game.addGold === 'function') {
                                Game.addGold(refundInfo.refundAmount);
                            }
                        }
                        
                        result.push(srCharacterCopy);
                        continue;
                    }

                    // 复制模板并调整ID和稀有度
                    const srCharacter = {
                        ...srTemplate,
                        id: `sr_${Date.now()}_${i}`,
                        rarity: 'epic',
                        isRecruited: true,
                        level: 1,
                        exp: 0,
                        nextLevelExp: this.calculateNextLevelExp(1),
                        maxLevel: this.rarities['epic'].maxLevel,
                        nextAttackCritical: false,
                        shield: 0,
                        bonusMultiplier: 0,
                        currentStats: {...srTemplate.baseStats},
                        traitUnlockLevels: {
                            second: 65,
                            third: 90
                        },
                        stats: {
                            totalDamage: 0,
                            totalHealing: 0,
                            mvpCount: 0,
                            battlesParticipated: 0
                        },
                        multiCount: 1
                    };

                    result.push(srCharacter);
                    continue; // 跳过其余的角色创建步骤
                }
                // 如果没有SR角色数据，继续使用随机生成的方式
            } else if (roll < 0.95) { // 5%概率
                rarity = 'epic';

                // 如果是SSR角色，从SSR角色数据中随机选择一个
                if (this.ssrCharacters && this.ssrCharacters.length > 0) {
                    const ssrIndex = Math.floor(Math.random() * this.ssrCharacters.length);
                    const ssrTemplate = this.ssrCharacters[ssrIndex];

                    // 在添加新角色前，检查是否已存在该角色
                    const existingCharacter = Object.values(this.characters).find(
                        character => character.name === ssrTemplate.name && 
                                     character.rarity === 'legendary' &&
                                     character.isRecruited
                    );

                    if (existingCharacter) {
                        // 角色已存在，增加多重抽取计数
                        if (!existingCharacter.multiCount) {
                            existingCharacter.multiCount = 1;
                        }
                        existingCharacter.multiCount += 1;
                        
                        // 更新多重加成属性
                        const refundInfo = this.updateMultiBonusStats(existingCharacter);
                        
                        // 创建一个副本用于显示结果
                        const ssrCharacterCopy = {...existingCharacter};
                        
                        // 添加返还金币信息
                        if (refundInfo) {
                            ssrCharacterCopy.refundInfo = refundInfo;
                            // 增加金币
                            if (typeof Game !== 'undefined' && typeof Game.addGold === 'function') {
                                Game.addGold(refundInfo.refundAmount);
                            }
                        }
                        
                        result.push(ssrCharacterCopy);
                        continue;
                    }

                    // 复制模板并调整ID和稀有度
                    const ssrCharacter = {
                        ...ssrTemplate,
                        id: `ssr_${Date.now()}_${i}`,
                        rarity: 'legendary', // 修正为legendary（SSR）
                        isRecruited: true,
                        level: 1,
                        exp: 0,
                        nextLevelExp: this.calculateNextLevelExp(1),
                        maxLevel: this.rarities['legendary'].maxLevel, // 修正为legendary的最大等级
                        nextAttackCritical: false,
                        shield: 0,
                        bonusMultiplier: 0,
                        currentStats: {...ssrTemplate.baseStats},
                        traitUnlockLevels: {
                            second: 65,
                            third: 90
                        },
                        stats: {
                            totalDamage: 0,
                            totalHealing: 0,
                            mvpCount: 0,
                            battlesParticipated: 0
                        },
                        multiCount: 1
                    };

                    result.push(ssrCharacter);
                    continue; // 跳过其余的角色创建步骤
                }
                // 如果没有SSR角色数据，尝试使用SR角色
                else if (this.srCharacters && this.srCharacters.length > 0) {
                    const srIndex = Math.floor(Math.random() * this.srCharacters.length);
                    const srTemplate = this.srCharacters[srIndex];

                    // 在添加新角色前，检查是否已存在该角色
                    const existingCharacter = Object.values(this.characters).find(
                        character => character.name === srTemplate.name && 
                                     character.rarity === 'epic' &&
                                     character.isRecruited
                    );

                    if (existingCharacter) {
                        // 角色已存在，增加多重抽取计数
                        if (!existingCharacter.multiCount) {
                            existingCharacter.multiCount = 1;
                        }
                        existingCharacter.multiCount += 1;
                        
                        // 更新多重加成属性
                        const refundInfo = this.updateMultiBonusStats(existingCharacter);
                        
                        // 创建一个副本用于显示结果
                        const srCharacterCopy = {...existingCharacter};
                        
                        // 添加返还金币信息
                        if (refundInfo) {
                            srCharacterCopy.refundInfo = refundInfo;
                            // 增加金币
                            if (typeof Game !== 'undefined' && typeof Game.addGold === 'function') {
                                Game.addGold(refundInfo.refundAmount);
                            }
                        }
                        
                        result.push(srCharacterCopy);
                        continue;
                    }

                    // 复制模板并调整ID和稀有度
                    const srCharacter = {
                        ...srTemplate,
                        id: `sr_${Date.now()}_${i}`,
                        rarity: 'epic',
                        isRecruited: true,
                        level: 1,
                        exp: 0,
                        nextLevelExp: this.calculateNextLevelExp(1),
                        maxLevel: this.rarities['epic'].maxLevel,
                        nextAttackCritical: false,
                        shield: 0,
                        bonusMultiplier: 0,
                        currentStats: {...srTemplate.baseStats},
                        traitUnlockLevels: {
                            second: 65,
                            third: 90
                        },
                        stats: {
                            totalDamage: 0,
                            totalHealing: 0,
                            mvpCount: 0,
                            battlesParticipated: 0
                        },
                        multiCount: 1
                    };

                    result.push(srCharacter);
                    continue; // 跳过其余的角色创建步骤
                }
            } else { // 5%概率(保底)，确保一定比例的传说
                rarity = 'legendary';

                // 如果是传说角色，随机选择一个传说角色模板
                if (Array.isArray(this.legendaryCharacters) && this.legendaryCharacters.length > 0) {
                    const legendIndex = Math.floor(Math.random() * this.legendaryCharacters.length);
                    const legendTemplate = this.legendaryCharacters[legendIndex];

                    // 复制模板并调整ID
                    const legendCharacter = {
                        ...legendTemplate,
                        id: `generated_legend_${Date.now()}_${i}`,
                        multiCount: 1
                    };

                    result.push(legendCharacter);
                    continue; // 跳过其余的角色创建步骤
                } else {
                    // 如果没有传说角色模板，尝试使用SSR角色
                    if (this.ssrCharacters && this.ssrCharacters.length > 0) {
                        const ssrIndex = Math.floor(Math.random() * this.ssrCharacters.length);
                        const ssrTemplate = this.ssrCharacters[ssrIndex];

                        // 在添加新角色前，检查是否已存在该角色
                        const existingCharacter = Object.values(this.characters).find(
                            character => character.name === ssrTemplate.name && 
                                         character.rarity === 'legendary' &&
                                         character.isRecruited
                        );

                        if (existingCharacter) {
                            // 角色已存在，增加多重抽取计数
                            if (!existingCharacter.multiCount) {
                                existingCharacter.multiCount = 1;
                            }
                            existingCharacter.multiCount += 1;
                            
                            // 更新多重加成属性
                            const refundInfo = this.updateMultiBonusStats(existingCharacter);
                            
                            // 创建一个副本用于显示结果
                            const ssrCharacterCopy = {...existingCharacter};
                            
                            // 添加返还金币信息
                            if (refundInfo) {
                                ssrCharacterCopy.refundInfo = refundInfo;
                                // 增加金币
                                if (typeof Game !== 'undefined' && typeof Game.addGold === 'function') {
                                    Game.addGold(refundInfo.refundAmount);
                                }
                            }
                            
                            result.push(ssrCharacterCopy);
                            continue; // 跳过其余的角色创建步骤
                        }

                        // 复制模板并调整ID和稀有度
                        const ssrCharacter = {
                            ...ssrTemplate,
                            id: `ssr_${Date.now()}_${i}`,
                            rarity: 'legendary', // 修正为legendary（SSR）
                            isRecruited: true,
                            level: 1,
                            exp: 0,
                            nextLevelExp: this.calculateNextLevelExp(1),
                            maxLevel: this.rarities['legendary'].maxLevel, // 修正为legendary的最大等级
                            nextAttackCritical: false,
                            shield: 0,
                            bonusMultiplier: 0,
                            currentStats: {...ssrTemplate.baseStats},
                            traitUnlockLevels: {
                                second: 65,
                                third: 90
                            },
                            stats: {
                                totalDamage: 0,
                                totalHealing: 0,
                                mvpCount: 0,
                                battlesParticipated: 0
                            },
                            multiCount: 1
                        };

                        result.push(ssrCharacter);
                        continue; // 跳过其余的角色创建步骤
                    }
                    // 如果没有SSR角色数据，降级为SR角色
                    else if (this.srCharacters && this.srCharacters.length > 0) {
                        const srIndex = Math.floor(Math.random() * this.srCharacters.length);
                        const srTemplate = this.srCharacters[srIndex];

                        // 在添加新角色前，检查是否已存在该角色
                        const existingCharacter = Object.values(this.characters).find(
                            character => character.name === srTemplate.name && 
                                         character.rarity === 'epic' &&
                                         character.isRecruited
                        );

                        if (existingCharacter) {
                            // 角色已存在，增加多重抽取计数
                            if (!existingCharacter.multiCount) {
                                existingCharacter.multiCount = 1;
                            }
                            existingCharacter.multiCount += 1;
                            
                            // 更新多重加成属性
                            const refundInfo = this.updateMultiBonusStats(existingCharacter);
                            
                            // 创建一个副本用于显示结果
                            const srCharacterCopy = {...existingCharacter};
                            
                            // 添加返还金币信息
                            if (refundInfo) {
                                srCharacterCopy.refundInfo = refundInfo;
                                // 增加金币
                                if (typeof Game !== 'undefined' && typeof Game.addGold === 'function') {
                                    Game.addGold(refundInfo.refundAmount);
                                }
                            }
                            
                            result.push(srCharacterCopy);
                            continue; // 跳过其余的角色创建步骤
                        }

                        // 复制模板并调整ID和稀有度
                        const srCharacter = {
                            ...srTemplate,
                            id: `sr_${Date.now()}_${i}`,
                            rarity: 'epic',
                            isRecruited: true,
                            level: 1,
                            exp: 0,
                            nextLevelExp: this.calculateNextLevelExp(1),
                            maxLevel: this.rarities['epic'].maxLevel,
                            nextAttackCritical: false,
                            shield: 0,
                            bonusMultiplier: 0,
                            currentStats: {...srTemplate.baseStats},
                            traitUnlockLevels: {
                                second: 65,
                                third: 90
                            },
                            stats: {
                                totalDamage: 0,
                                totalHealing: 0,
                                mvpCount: 0,
                                battlesParticipated: 0
                            },
                            multiCount: 1
                        };

                        result.push(srCharacter);
                        continue; // 跳过其余的角色创建步骤
                    }
                }
            }

            // 随机选择角色类型
            const types = Object.keys(this.types);
            const randomType = types[Math.floor(Math.random() * types.length)];
            const typeData = this.types[randomType];

            // 随机选择属性
            const attributes = Object.keys(this.attributes);
            const randomAttribute = attributes[Math.floor(Math.random() * attributes.length)];


            // 随机名称
            const firstNames = ['艾', '布', '克', '德', '埃', '弗', '格', '霍', '伊', '贾', '凯', '莱', '米', '尼', '奥', '佩', '奎', '罗', '萨', '泰'];
            const lastNames = ['尔', '恩', '琳', '克', '德', '斯', '顿', '森', '拉', '特', '维', '纳', '洛', '伯', '恩', '托', '根', '威', '尔', '泽'];
            const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const name = `${randomFirstName}${randomLastName}`;

            // 根据角色类型生成描述
            let description;
            switch (randomType) {
                case 'attack':
                    description = '一位技艺高超的战士，在战场上所向披靡。';
                    break;
                case 'defense':
                    description = '坚固的防御者，能够承受巨大的伤害而不退缩。';
                    break;
                case 'special':
                    description = '神秘的施法者，精通各种强大的魔法和特殊能力。';
                    break;
                case 'healing':
                    description = '具有治愈之手的医者，能在危急时刻救助队友。';
                    break;
                default:
                    description = '一位神秘的冒险者，背景不为人知。';
            }

            // 创建角色
            const character = {
                id: `generated_${Date.now()}_${i}`,
                name: name,
                type: randomType,
                attribute: randomAttribute,
                rarity: rarity,
                description: description,
                level: 1,
                exp: 0,
                nextLevelExp: this.calculateNextLevelExp(1),
                baseStats: {...typeData.baseStats},
                currentStats: {...typeData.baseStats},
                growthRates: {...typeData.growthRates},
                isRecruited: true,
                maxLevel: this.rarities[rarity].maxLevel,
                nextAttackCritical: false,
                shield: 0,
                // bonusMultiplier: 0, // 已移除传说加成
                traitUnlockLevels: {
                    second: 65,
                    third: 90
                },
                stats: {
                    totalDamage: 0,
                    totalHealing: 0,
                    mvpCount: 0,
                    battlesParticipated: 0
                },
                multiCount: 1
            };

            result.push(character);
        }

        return result;
    },

    /**
     * 更新队伍中所有角色的武器盘加成属性
     * @param {string} teamId - 队伍ID
     */
    updateTeamWeaponBonusStats(teamId) {
        // console.log(`更新队伍 ${teamId} 中所有角色的武器盘加成属性及最终属性`);
        const team = Team.getTeam(teamId);
        if (!team || !team.members || team.members.length === 0) {
            // console.log('队伍不存在或没有成员，无法更新属性');
            return;
        }
        for (const characterId of team.members) {
            this._updateCharacterEffectiveStats(characterId, teamId);
        }
        // console.log(`队伍 ${teamId} 中所有角色的属性已更新`);
    },

    _ensureStatsIntegrity(statsObject, baseReferenceStats) {
        if (!statsObject) return;
        if (statsObject.hasOwnProperty('hp')) {
            statsObject.maxHp = statsObject.hp;
        } else if (baseReferenceStats && baseReferenceStats.hasOwnProperty('hp')) {
            statsObject.hp = baseReferenceStats.hp;
            statsObject.maxHp = baseReferenceStats.hp;
        }

        if (statsObject.hasOwnProperty('attack')) {
            statsObject.maxAttack = statsObject.attack; // 假设攻击力也是最大攻击力
        } else if (baseReferenceStats && baseReferenceStats.hasOwnProperty('attack')) {
            statsObject.attack = baseReferenceStats.attack;
            statsObject.maxAttack = baseReferenceStats.attack;
        }
        // 可以为其他属性添加类似逻辑
    },
    
    // 新的私有辅助函数，用于计算 (纯粹 baseStats + 武器盘加成)
    _calculateWeaponAugmentedStats(character, teamId) {
        if (!character) return null;

        const inDungeon = typeof Dungeon !== 'undefined' && Dungeon.currentRun && character.dungeonOriginalStats;
        let sourceBaseStats = inDungeon ? { ...character.dungeonOriginalStats } : { ...character.baseStats };
        
        // 确保 sourceBaseStats 完整性
        this._ensureStatsIntegrity(sourceBaseStats, character.baseStats);


        let augmentedStats = { ...sourceBaseStats };

        const team = teamId ? Team.getTeam(teamId) : null;
        const weaponBoard = team && team.weaponBoardId ? Weapon.getWeaponBoard(team.weaponBoardId) : null;

        if (weaponBoard) {
            const boardStats = Weapon.calculateWeaponBoardStats(team.weaponBoardId);
            // console.log(`角色 ${character.name} 的武器盘 ${team.weaponBoardId} 加成:`, boardStats);

            if (boardStats) {
                // 应用固定值加成
                if (boardStats.base) {
                    for (const [stat, value] of Object.entries(boardStats.base)) {
                        augmentedStats[stat] = (augmentedStats[stat] || 0) + value;
                    }
                }
                // 应用百分比加成 (作用于固定值加成之后的基础属性)
                if (boardStats.percentage) {
                    for (const [stat, value] of Object.entries(boardStats.percentage)) {
                        // 百分比加成通常作用于原始基础攻击力/HP等，而不是已累加固定值的部分
                        // 但当前 Weapon.calculateWeaponBoardStats 似乎已处理好，这里直接乘
                        augmentedStats[stat] = (augmentedStats[stat] || 0) * (1 + value);
                    }
                }
                // 应用元素属性加成
                if (boardStats.elementStats && character.attribute) {
                    const elementBonus = boardStats.elementStats[character.attribute];
                    if (elementBonus) {
                        if (elementBonus.attack) augmentedStats.attack = (augmentedStats.attack || 0) + Math.floor(sourceBaseStats.attack * (elementBonus.attack / 100));
                        if (elementBonus.hp) augmentedStats.hp = (augmentedStats.hp || 0) + Math.floor(sourceBaseStats.hp * (elementBonus.hp / 100));
                        if (elementBonus.critRate) augmentedStats.critRate = (augmentedStats.critRate || 0.05) + (elementBonus.critRate / 100);
                        if (elementBonus.daRate) augmentedStats.daRate = (augmentedStats.daRate || 0.1) + (elementBonus.daRate / 100);
                        if (elementBonus.taRate) augmentedStats.taRate = (augmentedStats.taRate || 0.05) + (elementBonus.taRate / 100);
                        if (elementBonus.exAttack) augmentedStats.exAttack = (augmentedStats.exAttack || 0) + (elementBonus.exAttack / 100);
                        if (elementBonus.defense) augmentedStats.defense = (augmentedStats.defense || 0) + elementBonus.defense;
                        if (elementBonus.stamina) augmentedStats.stamina = (augmentedStats.stamina || 0) + elementBonus.stamina;
                        if (elementBonus.enmity) augmentedStats.enmity = (augmentedStats.enmity || 0) + elementBonus.enmity;
                    }
                }
            }
        }
        
        // 确保 augmentedStats 完整性并取整
        this._ensureStatsIntegrity(augmentedStats, sourceBaseStats);
        // 移除主要属性的 Math.floor()，但保留百分比属性的特殊处理和非负值约束
        for (const stat in augmentedStats) {
            if (typeof augmentedStats[stat] === 'number') {
                if (!['critRate', 'daRate', 'taRate', 'exAttack'].includes(stat)) {
                    // 对于非百分比类数值属性，不再向下取整，但确保非负
                    augmentedStats[stat] = Math.max(0, augmentedStats[stat]);
                } else {
                    // 对于百分比类属性，确保非负 (原逻辑已是 Math.max(0, value))
                    augmentedStats[stat] = Math.max(0, augmentedStats[stat]);
                }
            }
        }
        return augmentedStats;
    },

    /**
     * 获取角色最终的、用于战斗和显示的属性。
     * (纯粹 baseStats + 武器盘加成) + multiBonusStats
     * 此函数也会用 (纯粹 baseStats + 武器盘加成) 更新 character.weaponBonusStats
     * @param {string} characterId - 角色ID
     * @param {string | null} teamId - 角色所在队伍的ID，如果不在队伍中则为null
     * @returns {object | null} 角色最终属性对象，或在角色不存在时返回null
     */
    getCharacterFullStats(characterId, teamId) {
        const character = this.characters[characterId]; // 直接从集合中获取角色
        if (!character) {
            console.error(`[getCharacterFullStats] 无法通过ID直接从 this.characters 获取角色: ${characterId}`);
            return null;
        }

        // 1. 计算 (纯粹 baseStats + 武器盘加成)
        const statsAfterWeapon = this._calculateWeaponAugmentedStats(character, teamId);
        if (!statsAfterWeapon) return { ...character.baseStats }; // 回退

        // 2. 更新角色对象上的 weaponBonusStats
        character.weaponBonusStats = { ...statsAfterWeapon };
        this._ensureStatsIntegrity(character.weaponBonusStats, character.baseStats);


        // 3. 在 statsAfterWeapon 的基础上应用 multiBonusStats (纯粹增量)
        let finalStats = { ...statsAfterWeapon };
        if (character.multiBonusStats) {
            for (const stat in character.multiBonusStats) {
                if (character.multiBonusStats.hasOwnProperty(stat) && typeof character.multiBonusStats[stat] === 'number') {
                    finalStats[stat] = (finalStats[stat] || 0) + character.multiBonusStats[stat];
                }
            }
        }

        // 4. 确保最终属性的完整性 (如 maxHp) 并取整
        this._ensureStatsIntegrity(finalStats, character.baseStats); // finalStats.hp 更新后，maxHp 也应更新
        for (const stat in finalStats) {
            if (typeof finalStats[stat] === 'number' && !['critRate', 'daRate', 'taRate', 'exAttack'].includes(stat)) {
                finalStats[stat] = Math.max(0, Math.floor(finalStats[stat]));
            } else if (typeof finalStats[stat] === 'number') {
                finalStats[stat] = Math.max(0, finalStats[stat]);
            }
        }
        
        // console.log(`角色 ${character.name} 的最终属性:`, finalStats);
        return finalStats;
    },

    /**
     * 更新指定角色的 weaponBonusStats 和 currentStats。
     * 这是在角色属性可能发生变化的各种情景下调用的核心函数。
     * @param {string} characterId - 角色ID
     * @param {string | null} teamId - 角色所在队伍的ID，如果不在队伍中则为null
     */
    _updateCharacterEffectiveStats(characterId, teamId = null) {
        const character = this.getCharacter(characterId);
        if (!character) {
            // console.error(`_updateCharacterEffectiveStats: 角色 ${characterId} 未找到`);
            return;
        }
        
        // getCharacterFullStats 内部会更新 character.weaponBonusStats
        // 并返回最终的 (base + weapon + multi) 属性
        const finalEffectiveStats = this.getCharacterFullStats(characterId, teamId);
        
        if (finalEffectiveStats) {
            character.currentStats = finalEffectiveStats;
            // console.log(`角色 ${character.name} 的 currentStats 已更新:`, character.currentStats);
            // console.log(`角色 ${character.name} 的 weaponBonusStats 已更新:`, character.weaponBonusStats);
        } else {
            // console.error(`_updateCharacterEffectiveStats: 无法计算角色 ${characterId} 的最终属性`);
            // 作为回退，至少确保 currentStats 是 baseStats 的拷贝
            character.currentStats = { ...character.baseStats };
            this._ensureStatsIntegrity(character.currentStats, character.baseStats);
            character.weaponBonusStats = { ...character.baseStats }; // weaponBonusStats 也回退
             this._ensureStatsIntegrity(character.weaponBonusStats, character.baseStats);
        }
    },

    /**
     * 加载角色数据
     * @param {object} data - 保存的角色数据
     */
    loadCharacters(data) {
        if (!data) return;
        this.characters = {...data};
    },

    /**
     * 重置角色系统
     */
    reset() {
        console.log('完全重置角色系统');
        // 完全清空角色数据
        this.characters = {};

        // 确保主角被清除
        const mainChar = this.getMainCharacter();
        if (mainChar) {
            console.log('警告：主角仍然存在，强制清除');
            this.characters = {};
        }

        console.log('角色系统重置完成，当前角色数量：0');
        this.init();
    },

    /**
     * 计算角色的攻击力
     * @param {object} character - 角色对象
     * @returns {number} 计算后的攻击力
     */
    calculateAttackPower(character) {
        console.log(`===== calculateAttackPower 开始 =====`);
        console.log(`角色: ${character ? character.name : '未知'}`);

        if (typeof window !== 'undefined' && window.log) {
            window.log(`===== calculateAttackPower 开始 =====`);
            window.log(`角色: ${character ? character.name : '未知'}`);
        }

        if (!character) {
            console.log(`提前返回0攻击力: 角色不存在`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`提前返回0攻击力: 角色不存在`);
            }
            return 0;
        }

        if (!character.currentStats) {
            console.log(`提前返回0攻击力: 角色当前状态不存在`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`提前返回0攻击力: 角色当前状态不存在`);
            }
            return 0;
        }

        // 基础攻击力
        let attackPower = character.currentStats.attack;
        console.log(`初始攻击力: ${attackPower}`);
        if (typeof window !== 'undefined' && window.log) {
            window.log(`初始攻击力: ${attackPower}`);
        }

        // 获取角色的BUFF效果
        const buffs = character.buffs || [];

        // 应用攻击力增加BUFF
        const attackBuffs = buffs.filter(buff => buff.type === 'attackUp');
        let attackBuffPercentage = 0;

        for (const buff of attackBuffs) {
            attackBuffPercentage += buff.value;
        }

        // 应用攻击力降低BUFF
        const attackDownBuffs = buffs.filter(buff => buff.type === 'attackDown');
        let attackDownPercentage = 0;

        for (const buff of attackDownBuffs) {
            attackDownPercentage += buff.value;
        }

        // 限制总攻击力降低不超过50%
        attackDownPercentage = Math.min(attackDownPercentage, 0.5);

        // 根据README中的公式计算攻击力
        // 攻击力=角色自身攻击力*（1+攻击力%提升值）*（1-攻击力%降低值）*（1+浑身BUFF）*（1+背水BUFF）*（1+攻击力EX%提升值）+ 伤害上升总合

        // 应用攻击力%提升值和降低值
        attackPower *= (1 + attackBuffPercentage - attackDownPercentage);

        // 获取角色的血量百分比
        const hpPercentage = character.currentStats.hp / character.currentStats.maxHp;

        // 检查是否有浑身BUFF
        const hunshenBuffs = buffs.filter(buff => buff.type === 'hunshen');
        if (hunshenBuffs.length > 0) {
            // 浑身效果：100%血攻击力上升50%，1%血上升5%
            const hunshenBuff = 0.05 + (hpPercentage * 0.45); // 血量越高加成越大
            attackPower *= (1 + hunshenBuff);

            console.log(`应用浑身BUFF: +${(hunshenBuff * 100).toFixed(1)}% (血量: ${(hpPercentage * 100).toFixed(1)}%)`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`应用浑身BUFF: +${(hunshenBuff * 100).toFixed(1)}% (血量: ${(hpPercentage * 100).toFixed(1)}%)`);
            }
        }

        // 检查是否有背水BUFF
        const beishuiBuffs = buffs.filter(buff => buff.type === 'beishui');
        if (beishuiBuffs.length > 0) {
            // 背水效果：1%血攻击力上升50%，100%血上升5%
            const beishuiBuff = 0.5 - (hpPercentage * 0.45); // 血量越低加成越大
            attackPower *= (1 + beishuiBuff);

            console.log(`应用背水BUFF: +${(beishuiBuff * 100).toFixed(1)}% (血量: ${(hpPercentage * 100).toFixed(1)}%)`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`应用背水BUFF: +${(beishuiBuff * 100).toFixed(1)}% (血量: ${(hpPercentage * 100).toFixed(1)}%)`);
            }
        }

        // 应用攻击力EX加成 (来自武器等)
        let attackExBonus = 0;

        // 从武器中获取攻击力EX加成
        if (character.equipment && character.equipment.weapon) {
            const weapon = character.equipment.weapon;
            if (weapon.attackExBonus) {
                attackExBonus += weapon.attackExBonus;
            }
        }

        attackPower *= (1 + attackExBonus);

        // 添加伤害上升总合
        let damageIncrease = 0;

        // 从武器中获取伤害上升总合
        if (character.equipment && character.equipment.weapon) {
            const weapon = character.equipment.weapon;
            if (weapon.damageIncrease) {
                damageIncrease += weapon.damageIncrease;
            }
        }

        attackPower += damageIncrease;

        console.log(`计算后攻击力: ${attackPower}`);
        if (typeof window !== 'undefined' && window.log) {
            window.log(`计算后攻击力: ${attackPower}`);
            window.log(`===== calculateAttackPower 结束 =====`);
        }

        return attackPower;
    },


    /**
     * 计算治疗量
     * @param {string} healerId - 治疗者ID
     * @param {string} targetId - 目标ID
     * @param {number} baseHealAmount - 基础治疗量
     * @returns {number} 实际治疗量
     */
    calculateHeal(healerId, targetId, baseHealAmount) {
        const healer = this.getCharacter(healerId);
        const target = this.getCharacter(targetId);

        if (!healer || !target) return 0;

        let healAmount = baseHealAmount;

        // 计入角色治疗统计
        healer.stats.totalHealing += healAmount;

        return Math.floor(healAmount);
    },

    /**
     * 评估战斗MVP
     * @param {array} teamMemberIds - 参与战斗的队伍成员ID
     * @returns {object} MVP评估结果
     */
    assessBattleMVP(teamMemberIds) {
        const mvpScores = {};
        let highestScore = 0;
        let mvpId = null;

        // 计算每个角色的分数
        for (const memberId of teamMemberIds) {
            const character = this.getCharacter(memberId);
            if (!character) continue;

            // 简单的评分系统，可以根据需要调整
            const damageScore = character.stats.totalDamage;
            const healingScore = character.stats.totalHealing * 1.2; // 治疗有更高权重

            // 综合评分
            const totalScore = damageScore + healingScore;
            mvpScores[memberId] = {
                name: character.name,
                damage: character.stats.totalDamage,
                healing: character.stats.totalHealing,
                score: totalScore
            };

            // 更新最高分
            if (totalScore > highestScore) {
                highestScore = totalScore;
                mvpId = memberId;
            }

            // 增加战斗参与计数
            character.stats.battlesParticipated++;

            // 重置战斗统计（为下次战斗准备）
            character.stats.totalDamage = 0;
            character.stats.totalHealing = 0;
        }

        // 记录MVP
        if (mvpId) {
            const mvpCharacter = this.getCharacter(mvpId);
            if (mvpCharacter) {
                mvpCharacter.stats.mvpCount++;
            }
        }

        return {
            mvpId,
            mvpName: mvpId ? this.getCharacter(mvpId).name : null,
            scores: mvpScores
        };
    },



    /**
     * 主角转职
     * @param {string} characterId - 主角ID
     * @param {string} newJobId - 新职业ID
     * @returns {boolean} 是否转职成功
     */
    changeJob(characterId, newJobId) {
        const character = this.getCharacter(characterId);
        if (!character || !character.isMainCharacter || !character.job) return false;

        const currentJob = character.job.current;
        const currentJobData = this.jobs[currentJob];
        const newJobData = this.jobs[newJobId];

        if (!currentJobData || !newJobData) return false;

        // 检查是否可以转职到目标职业
        if (currentJobData.nextTierJobs && !currentJobData.nextTierJobs.includes(newJobId)) {
            UI.showMessage(`${character.name} 不能从 ${currentJobData.name} 直接转职为 ${newJobData.name}。`);
            return false;
        }

        // 检查当前职业是否达到转职条件（20级）
        if (character.job.level < 20) {
            UI.showMessage(`${character.name} 需要将 ${currentJobData.name} 职业等级提升至20级才能转职。`);
            return false;
        }

        // 执行转职
        character.job.current = newJobId;
        character.job.level = 1;
        character.job.history.push(newJobId);

        // 更新角色基础属性为新职业属性
        character.baseStats = {...newJobData.baseStats}; // 这是纯粹的 baseStats
        character.growthRates = {...newJobData.growthRates};
        
        // 确保新 baseStats 的完整性
        this._ensureStatsIntegrity(character.baseStats, null); // 第二个参数为null，因为这是全新的base

        // 转职后，属性发生变化，需要更新 weaponBonusStats 和 currentStats
        let teamId = null;
        if (typeof Team !== 'undefined' && Team.findTeamByMember) {
            const team = Team.findTeamByMember(characterId);
            if (team) teamId = team.id;
        }
        this._updateCharacterEffectiveStats(characterId, teamId);

        UI.showNotification(`${character.name} 已成功转职为 ${newJobData.name}！`);
        return true;
    },



    /**
     * 获取角色系统保存数据
     * @returns {object} 可用于保存的数据对象
     */
    getSaveData() {
        return {
            characters: this.characters
            // legendaryCharacters: this.legendaryCharacters // 已移除 bonusMultiplier，不再需要单独保存
        };
    },

    /**
     * 加载角色系统保存数据
     * @param {object} data - 保存的数据对象
     */
    loadSaveData(data) {
        console.log('加载角色系统数据');

        if (!data) return;

        if (data.characters) {
            this.characters = data.characters;
            console.log(`加载了 ${Object.keys(this.characters).length} 个角色`);

            // 清理旧存档数据并调试输出
            Object.values(this.characters).forEach(character => {
                if (character.hasOwnProperty('bonusMultiplier')) {
                    delete character.bonusMultiplier;
                }
                // 确保 delete character.originalBaseStats; 能够有效移除旧存档中的此字段
                if (character.hasOwnProperty('originalBaseStats')) {
                    delete character.originalBaseStats;
                }
                // 确保 multiBonusStats 存在且结构正确
                character.multiBonusStats = character.multiBonusStats || { hp: 0, attack: 0, defense: 0 };

                console.log(`加载角色 ${character.name} (ID: ${character.id}) - 招募状态: ${character.isRecruited}, 主角: ${character.isMainCharacter}`);
            });
        }

        // if (data.legendaryCharacters) { // 已移除 bonusMultiplier，不再需要单独加载
        //     this.legendaryCharacters = data.legendaryCharacters;
        // }

        // 确保R、SR和SSR角色数据已加载
        if (!this.rCharacters || this.rCharacters.length === 0) {
            this.loadCharacterData('r', 'src/data/r.json');
        }

        if (!this.srCharacters || this.srCharacters.length === 0) {
            this.loadCharacterData('sr', 'src/data/sr.json');
        }

        if (!this.ssrCharacters || this.ssrCharacters.length === 0) {
            this.loadCharacterData('ssr', 'src/data/ssr.json');
        }
    }
};