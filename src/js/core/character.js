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

        // 初始化SR和SSR角色数组
        this.srCharacters = [];
        this.ssrCharacters = [];

        // 加载SR和SSR角色数据
        this.loadCharacterData('sr', 'src/data/sr.json');
        this.loadCharacterData('ssr', 'src/data/ssr.json');
    },

    /**
     * 加载角色数据
     * @param {string} type - 角色类型 ('sr' 或 'ssr')
     * @param {string} url - JSON文件的URL
     */
    loadCharacterData(type, url) {
        console.log(`开始加载${type.toUpperCase()}角色数据...`);

        // 从JSON文件加载角色数据
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log(`成功加载${type.toUpperCase()}角色数据:`, data);
                if (type === 'sr') {
                    this.srCharacters = Object.values(data);
                    console.log(`加载了 ${this.srCharacters.length} 个SR角色`);
                } else if (type === 'ssr') {
                    this.ssrCharacters = Object.values(data);
                    console.log(`加载了 ${this.ssrCharacters.length} 个SSR角色`);
                }
            })
            .catch(error => {
                console.error(`加载${type.toUpperCase()}角色数据失败:`, error);
                if (type === 'sr') {
                    this.srCharacters = []; // 设置为空数组
                } else if (type === 'ssr') {
                    this.ssrCharacters = []; // 设置为空数组
                }
            });
    },
    /**
     * 获取角色
     * @param {string} characterId - 角色ID
     * @returns {object|null} 角色对象
     */
    getCharacter(characterId) {
        console.log(`尝试获取角色: ${characterId}`);

        if (typeof window !== 'undefined' && window.log) {
            window.log(`尝试获取角色: ${characterId}`);
        }

        const character = this.characters[characterId] || null;

        if (!character) {
            console.log(`未找到角色: ${characterId}`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`未找到角色: ${characterId}`);
            }
        } else {
            console.log(`成功获取角色: ${character.name} (ID: ${characterId})`);
            if (typeof window !== 'undefined' && window.log) {
                window.log(`成功获取角色: ${character.name} (ID: ${characterId})`);
            }

            // 检查是否存在异常状态：有dungeonOriginalStats但不在地下城中
            const abnormalState = character.dungeonOriginalStats &&
                                 (!Dungeon || !Dungeon.currentRun);

            if (abnormalState) {
                console.log(`检测到角色 ${character.name} 存在异常状态：有dungeonOriginalStats但不在地下城中，清除它`);

                // 重置currentStats为baseStats的深拷贝
                character.currentStats = JSON.parse(JSON.stringify(character.baseStats));

                // 清除地下城原始属性
                delete character.dungeonOriginalStats;

                // 清除地下城已应用的被动技能记录
                if (character.dungeonAppliedPassives) {
                    delete character.dungeonAppliedPassives;
                    console.log(`清除 ${character.name} 的地下城已应用被动技能记录`);
                }

                // 清除所有BUFF
                if (typeof BuffSystem !== 'undefined') {
                    BuffSystem.clearAllBuffs(character);
                    console.log(`清除 ${character.name} 的所有BUFF`);
                } else if (character.buffs) {
                    character.buffs = [];
                    console.log(`清除 ${character.name} 的所有BUFF（直接清除buffs数组）`);
                }
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

            // 检查是否存在异常状态：有dungeonOriginalStats但不在地下城中
            const abnormalState = mainCharacter.dungeonOriginalStats &&
                                 (!Dungeon || !Dungeon.currentRun);

            if (inDungeon) {
                // 在地下城中，保留当前状态
                console.log('主角在地下城中，保留当前状态');
                return mainCharacter;
            } else {
                // 不在地下城中，重置currentStats为baseStats的深拷贝
                mainCharacter.currentStats = JSON.parse(JSON.stringify(mainCharacter.baseStats));

                // 如果有dungeonOriginalStats但不在地下城中，清除它
                if (abnormalState) {
                    console.log('检测到异常状态：有dungeonOriginalStats但不在地下城中，清除它');
                    delete mainCharacter.dungeonOriginalStats;

                    // 清除地下城已应用的被动技能记录
                    if (mainCharacter.dungeonAppliedPassives) {
                        delete mainCharacter.dungeonAppliedPassives;
                        console.log(`清除 ${mainCharacter.name} 的地下城已应用被动技能记录`);
                    }

                    // 清除所有BUFF
                    if (typeof BuffSystem !== 'undefined') {
                        BuffSystem.clearAllBuffs(mainCharacter);
                        console.log(`清除 ${mainCharacter.name} 的所有BUFF`);
                    } else if (mainCharacter.buffs) {
                        mainCharacter.buffs = [];
                        console.log(`清除 ${mainCharacter.name} 的所有BUFF（直接清除buffs数组）`);
                    }
                }
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
        const baseStats = data.baseStats;
        const rarity = data.rarity || 'rare'; // 默认稀有度为rare
        const rarityData = this.rarities[rarity] || this.rarities.rare;

        // 对于主角，特性系统已被技能系统取代
        const isMainCharacter = data.isMainCharacter || false;


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
            baseStats: baseStats,
            currentStats: {...baseStats},
            // 新增：武器盘加成后的属性，仅用于界面显示
            weaponBonusStats: {...baseStats},
            growthRates: {...typeData.growthRates},
            isMainCharacter: isMainCharacter,
            isRecruited: data.isRecruited || false,
            rarity: rarity,
            maxLevel: rarityData.maxLevel, // 设置角色等级上限
            // 战斗相关的临时状态
            nextAttackCritical: false, // 是否必定暴击
            shield: 0, // 护盷值
            // 传说角色的属性加成
            bonusMultiplier: data.bonusMultiplier || 0,
            // 记录战斗表现
            stats: {
                totalDamage: 0,
                totalHealing: 0,
                mvpCount: 0,
                battlesParticipated: 0
            },
            // 职业系统（主角专用）
            job: isMainCharacter ? (data.job || {
                current: 'novice',  // 当前职业
                level: 1,           // 职业等级
                history: ['novice'], // 历史职业
            }) : null
        };

        // 如果是传说角色，应用bonusMultiplier
        if (character.rarity === 'legendary' && character.bonusMultiplier > 0) {
            // 应用全属性加成
            const multiplier = 1 + character.bonusMultiplier;
            for (const stat in character.baseStats) {
                character.baseStats[stat] = Math.floor(character.baseStats[stat] * multiplier);
                character.currentStats[stat] = character.baseStats[stat];
            }
        }

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

        for (let i = 0; i < levels; i++) {
            // 检查是否已达到最高等级
            if (character.level >= character.maxLevel) {
                if (typeof UI !== 'undefined' && typeof UI.showMessage === 'function') {
                    UI.showMessage(`${character.name} 已达到最高等级 ${character.maxLevel}`);
                }
                break;
            }

            const oldLevel = character.level;
            character.level++;
            console.log("升级前基础:", character.baseStats);

            // 如果是主角且有职业，使用职业属性
            if (character.isMainCharacter && character.job && typeof JobSystem !== 'undefined') {
                // 获取当前职业信息
                const jobId = character.job.current;
                const job = JobSystem.getJob(jobId);

                if (job && job.baseStats && job.maxStats) {
                    // 根据职业等级在baseStats和maxStats之间进行插值
                    const jobLevel = character.job.level || 1;
                    const levelRatio = (jobLevel - 1) / 19; // 1级为0，20级为1

                    // 更新基础属性
                    for (const stat in job.baseStats) {
                        if (job.maxStats[stat]) {
                            const baseValue = job.baseStats[stat];
                            const maxValue = job.maxStats[stat];
                            const newValue = Math.floor(baseValue + (maxValue - baseValue) * levelRatio);

                            console.log("更新角色属性1");
                            console.log(newValue);
                            // 更新角色属性
                            character.baseStats[stat] = newValue;
                        }
                    }

                    console.log(`根据职业 ${job.name} (等级 ${jobLevel}) 更新角色属性 ${jobLevel}`);
                } else {
                    // 如果没有职业信息，使用默认成长率
                    character.baseStats.hp += character.growthRates.hp;
                    character.baseStats.attack += character.growthRates.attack;
                }
            } else {
                // 非主角或没有职业，使用默认成长率
                character.baseStats.hp += character.growthRates.hp;
                character.baseStats.attack += character.growthRates.attack;
            }


            console.log('升级后的基础属性:', character.baseStats);
            // TODO 可能需要触发一次 切换武器 来更新weaponBonusStats和currentStats

            // 更新下一级所需经验
            character.nextLevelExp = this.calculateNextLevelExp(character.level);

            console.log(`${character.name} 升级到 ${character.level} 级`,character);
        }

        // 如果是主角，同步更新主角等级
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
     * 招募角色
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
                char => char.id.includes(template.id) && char.rarity === 'legendary'
            );

            if (existingLegendary) {
                // 已有该传说角色，增加其属性加成
                if (existingLegendary.bonusMultiplier < 0.2) { // 加成上限20%
                    existingLegendary.bonusMultiplier += 0.01; // 每次加1%

                    // 更新基础属性
                    for (const stat in existingLegendary.baseStats) {
                        const baseValue = this.types[existingLegendary.type].baseStats[stat] || 0;
                        existingLegendary.baseStats[stat] = Math.floor(
                            baseValue * (1 + existingLegendary.bonusMultiplier)
                        );
                        existingLegendary.currentStats[stat] = existingLegendary.baseStats[stat];
                    }

                    UI.showNotification(`已增强 ${existingLegendary.name} 的属性 (加成: ${Math.floor(existingLegendary.bonusMultiplier * 100)}%)`);
                } else {
                    // 已达到20%上限，直接加固定值
                    for (const stat in existingLegendary.baseStats) {
                        existingLegendary.baseStats[stat] += 1;
                        existingLegendary.currentStats[stat] += 1;
                    }

                    UI.showNotification(`已增强 ${existingLegendary.name} 的全部属性 +1`);
                }

                return existingLegendary.id; // 返回现有角色ID
            }
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
            bonusMultiplier: template.bonusMultiplier || 0
        };

        // 添加角色
        const newCharacterId = this.addCharacter(characterData);
        if (newCharacterId) {
            UI.showNotification(`成功招募 ${template.name}`);
            Game.stats.charactersRecruited++;
        }

        return newCharacterId;
    },

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
            } else if (roll < 0.90) { // 15%概率
                rarity = 'epic';

                // 如果是史诗角色，从SR角色数据中随机选择一个
                if (this.srCharacters && this.srCharacters.length > 0) {
                    const srIndex = Math.floor(Math.random() * this.srCharacters.length);
                    const srTemplate = this.srCharacters[srIndex];

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
                        }
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

                    // 复制模板并调整ID和稀有度
                    const ssrCharacter = {
                        ...ssrTemplate,
                        id: `ssr_${Date.now()}_${i}`,
                        rarity: 'epic',
                        isRecruited: true,
                        level: 1,
                        exp: 0,
                        nextLevelExp: this.calculateNextLevelExp(1),
                        maxLevel: this.rarities['epic'].maxLevel,
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
                        }
                    };

                    result.push(ssrCharacter);
                    continue; // 跳过其余的角色创建步骤
                }
                // 如果没有SSR角色数据，尝试使用SR角色
                else if (this.srCharacters && this.srCharacters.length > 0) {
                    const srIndex = Math.floor(Math.random() * this.srCharacters.length);
                    const srTemplate = this.srCharacters[srIndex];

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
                        }
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
                        id: `generated_legend_${Date.now()}_${i}`
                    };

                    result.push(legendCharacter);
                    continue; // 跳过其余的角色创建步骤
                } else {
                    // 如果没有传说角色模板，尝试使用SSR角色
                    if (this.ssrCharacters && this.ssrCharacters.length > 0) {
                        const ssrIndex = Math.floor(Math.random() * this.ssrCharacters.length);
                        const ssrTemplate = this.ssrCharacters[ssrIndex];

                        // 复制模板并调整ID和稀有度
                        const ssrCharacter = {
                            ...ssrTemplate,
                            id: `ssr_${Date.now()}_${i}`,
                            rarity: 'epic',
                            isRecruited: true,
                            level: 1,
                            exp: 0,
                            nextLevelExp: this.calculateNextLevelExp(1),
                            maxLevel: this.rarities['epic'].maxLevel,
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
                            }
                        };

                        result.push(ssrCharacter);
                        continue; // 跳过其余的角色创建步骤
                    }
                    // 如果没有SSR角色数据，降级为SR角色
                    else if (this.srCharacters && this.srCharacters.length > 0) {
                        const srIndex = Math.floor(Math.random() * this.srCharacters.length);
                        const srTemplate = this.srCharacters[srIndex];

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
                            }
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
                bonusMultiplier: 0,
                traitUnlockLevels: {
                    second: 65,
                    third: 90
                },
                stats: {
                    totalDamage: 0,
                    totalHealing: 0,
                    mvpCount: 0,
                    battlesParticipated: 0
                }
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
        console.log(`更新队伍 ${teamId} 中所有角色的武器盘加成属性`);

        const team = Team.getTeam(teamId);
        if (!team || !team.members || team.members.length === 0) {
            console.log('队伍不存在或没有成员');
            return;
        }

        // 遍历队伍中的所有角色
        for (const characterId of team.members) {
            // 获取角色完整属性并更新weaponBonusStats
            this.getCharacterFullStats(characterId, teamId, true);
        }

        console.log(`队伍 ${teamId} 中所有角色的武器盘加成属性已更新`);
    },

    /**
     * 获取角色完整状态（包括装备加成）
     * @param {string} characterId - 角色ID
     * @param {string} teamId - 队伍ID
     * @param {boolean} updateWeaponBonusStats - 是否更新角色的weaponBonusStats属性
     * @returns {object} 角色完整状态
     */
    getCharacterFullStats(characterId, teamId, updateWeaponBonusStats = false) {
        const character = this.getCharacter(characterId);
        if (!character) return null;

        const team = Team.getTeam(teamId);
        if (!team) return character.currentStats;

        // 获取武器盘
        const weaponBoard = Weapon.getWeaponBoard(team.weaponBoardId);
        if (!weaponBoard) return character.currentStats;

        // 检查角色是否在地下城中
        const inDungeon = typeof Dungeon !== 'undefined' &&
                          Dungeon.currentRun &&
                          character.dungeonOriginalStats;

        // 开始计算完整状态 - 始终使用baseStats或dungeonOriginalStats作为基础，避免重复计算
        let baseStats;

        if (inDungeon) {
            // 在地下城中，使用dungeonOriginalStats作为基础计算武器盘加成
            console.log('角色在地下城中，使用dungeonOriginalStats作为基础计算武器盘加成');
            baseStats = {...character.dungeonOriginalStats};

            // 添加地下城中的BUFF效果，但不包括武器盘加成
            // 这里可以添加地下城特有的效果处理，如果有的话
        } else {
            // 不在地下城中，使用baseStats作为基础
            console.log('角色不在地下城中，使用baseStats作为基础');
            baseStats = {...character.baseStats};
        }

        const fullStats = {...baseStats};

        // 确保所有需要的属性都存在
        if (fullStats.critRate === undefined) fullStats.critRate = 0.05; // 默认5%暴击率
        if (fullStats.daRate === undefined) fullStats.daRate = 0.1; // 默认10%双攻率
        if (fullStats.taRate === undefined) fullStats.taRate = 0.05; // 默认5%三攻率
        if (fullStats.exAttack === undefined) fullStats.exAttack = 0; // 默认0%EX攻击加成
        if (fullStats.stamina === undefined) fullStats.stamina = 0; // 默认0浑身值
        if (fullStats.enmity === undefined) fullStats.enmity = 0; // 默认0背水值

        console.log('计算角色完整属性，基础属性:', baseStats);

        // 应用武器盘加成
        const boardStats = Weapon.calculateWeaponBoardStats(team.weaponBoardId);
        console.log('武器盘加成:', boardStats);

        // 确保boardStats和其属性存在
        if (boardStats && boardStats.base) {
            // 合并基本属性
            for (const [stat, value] of Object.entries(boardStats.base)) {
                if (fullStats[stat] !== undefined) {
                    fullStats[stat] += value;
                }
            }
        }

        // 确保boardStats和其percentage属性存在
        if (boardStats && boardStats.percentage) {
            // 应用百分比加成
            for (const [stat, value] of Object.entries(boardStats.percentage)) {
                if (fullStats[stat] !== undefined) {
                    fullStats[stat] *= (1 + value);
                }
            }
        }

        // 应用元素属性加成
        if (boardStats && boardStats.elementStats) {
            const characterElement = character.attribute || 'fire'; // 默认为火属性
            const elementBonus = boardStats.elementStats[characterElement];

            if (elementBonus) {
                console.log(`应用${characterElement}元素属性加成:`, elementBonus);

                // 应用攻击力百分比加成
                if (elementBonus.attack && fullStats.attack !== undefined) {
                    // 元素攻击力是百分比加成
                    fullStats.attack += Math.floor(fullStats.attack * (elementBonus.attack / 100));
                }

                fullStats.maxHp = fullStats.hp;
                // 应用HP百分比加成
                if (elementBonus.hp && fullStats.hp !== undefined) {
                    // 元素HP是百分比加成
                    fullStats.hp += Math.floor(fullStats.hp * (elementBonus.hp / 100));
                    fullStats.maxHp = fullStats.hp;
                }

                // 应用暴击率加成
                if (elementBonus.critRate) {
                    fullStats.critRate += elementBonus.critRate / 100; // 转换为小数
                }

                // 应用DA率加成
                if (elementBonus.daRate) {
                    fullStats.daRate += elementBonus.daRate / 100; // 转换为小数
                }

                // 应用TA率加成
                if (elementBonus.taRate) {
                    fullStats.taRate += elementBonus.taRate / 100; // 转换为小数
                }

                // 应用EX攻击加成
                if (elementBonus.exAttack) {
                    fullStats.exAttack += elementBonus.exAttack / 100; // 转换为小数
                }

                // 应用防御力加成
                if (elementBonus.defense && fullStats.defense !== undefined) {
                    fullStats.defense += elementBonus.defense;
                }

                // 应用浑身加成
                if (elementBonus.stamina) {
                    fullStats.stamina += elementBonus.stamina;
                }

                // 应用背水加成
                if (elementBonus.enmity) {
                    fullStats.enmity += elementBonus.enmity;
                }
            }
        }


        // 确保属性为正数并取整（只对整数属性取整）
        for (const stat in fullStats) {
            if (stat === 'critRate' || stat === 'daRate' || stat === 'taRate' || stat === 'exAttack') {
                // 这些是小数属性，不需要取整
                fullStats[stat] = Math.max(0, fullStats[stat]);
            } else {
                // 其他属性取整
                fullStats[stat] = Math.max(0, Math.floor(fullStats[stat]));
            }
        }

        // 如果需要，更新角色的weaponBonusStats属性
        if (updateWeaponBonusStats) {
            console.log('更新角色的weaponBonusStats属性:', fullStats);
            character.weaponBonusStats = {...fullStats};
        }

        console.log('计算完成的完整属性:', fullStats);
        return fullStats;
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
        character.baseStats = {...newJobData.baseStats};
        character.growthRates = {...newJobData.growthRates};


        UI.showNotification(`${character.name} 已成功转职为 ${newJobData.name}！`);

        return true;
    },



    /**
     * 获取角色系统保存数据
     * @returns {object} 可用于保存的数据对象
     */
    getSaveData() {
        return {
            characters: this.characters,
            legendaryCharacters: this.legendaryCharacters
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

            // 调试输出所有角色的招募状态
            Object.values(this.characters).forEach(character => {
                console.log(`加载角色 ${character.name} (ID: ${character.id}) - 招募状态: ${character.isRecruited}, 主角: ${character.isMainCharacter}`);
            });
        }

        if (data.legendaryCharacters) {
            this.legendaryCharacters = data.legendaryCharacters;
        }

        // 确保SR和SSR角色数据已加载
        if (this.srCharacters.length === 0) {
            this.loadCharacterData('sr', 'src/data/sr.json');
        }

        if (this.ssrCharacters.length === 0) {
            this.loadCharacterData('ssr', 'src/data/ssr.json');
        }
    }
};