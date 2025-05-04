/**
 * 武器管理系统 - 负责游戏中武器的管理
 */
const Weapon = {
    // 武器数据
    weapons: {},

    // 武器盘数据
    weaponBoards: {},

    // 武器类型定义
    types: {
        sword: {
            name: '剑',
            description: '平衡型武器，提供均衡的攻击和生命值',
            baseStats: { attack: 10, hp: 50 }
        },
        knife: {
            name: '刀',
            description: '快速型武器，提供较高的攻击速度',
            baseStats: { attack: 8, hp: 40 }
        },
        staff: {
            name: '杖',
            description: '魔法武器，提供特殊效果和能力',
            baseStats: { attack: 7, hp: 45 }
        },
        bow: {
            name: '弓',
            description: '远程武器，提供中等攻击和速度',
            baseStats: { attack: 12, hp: 25 }
        },
        axe: {
            name: '斧',
            description: '重型武器，提供高攻击但速度较慢',
            baseStats: { attack: 15, hp: 30 }
        },
        spear: {
            name: '枪',
            description: '长柄武器，提供均衡的攻击和防御',
            baseStats: { attack: 11, hp: 35 }
        }
    },

    // 武器技能定义
    skills: {
        // 暴风系列 - DA/TA提升
        abandon: {
            name: '暴风',
            description: '提高DA和TA概率',
            type: 'passive',
            levels: {
                1: { daRate: 7, taRate: 3 },
                2: { daRate: 10, taRate: 6 },
                3: { daRate: 15, taRate: 10 }
            }
        },
        // 守护系列 - HP提升
        aegis: {
            name: '守护',
            description: '提高生命值',
            type: 'passive',
            levels: {
                1: { hp: 14 },
                2: { hp: 20 },
                3: { hp: 30 }
            }
        },
        // 穷理系列 - 技能伤害上限提升
        arts: {
            name: '穷理',
            description: '提高技能伤害上限',
            type: 'passive',
            levels: {
                1: { na_cap: 5 },
                2: { na_cap: 7 },
                3: { na_cap: 10 }
            }
        },
        // 绝涯系列 - 伤害上限提升
        beastEssence: {
            name: '绝涯',
            description: '提高伤害上限',
            type: 'passive',
            levels: {
                1: { skill_cap: 10 },
                2: { skill_cap: 20 },
                3: { skill_cap: 30 }
            }
        },
        // 刃界系列 - HP/暴击提升
        bladeshield: {
            name: '刃界',
            description: '提高生命值和暴击率',
            type: 'passive',
            levels: {
                1: { hp: 12, critRate: 4 },
                2: { hp: 14, critRate: 6 },
                3: { hp: 20, critRate: 10 }
            }
        },
        // 刹那系列 - 攻击/暴击提升
        celere: {
            name: '刹那',
            description: '提高攻击力和暴击率',
            type: 'passive',
            levels: {
                1: { attack: 20, critRate: 4 },
                2: { attack: 26, critRate: 8 },
                3: { attack: 30, critRate: 12 }
            }
        },
        // 励行系列 - EX攻击/防御提升
        convergence: {
            name: '励行',
            description: '提高EX攻击力和防御力',
            type: 'passive',
            levels: {
                1: { exAttack: 20, defense: 15 },
                2: { exAttack: 30, defense: 20 },
                3: { exAttack: 40, defense: 30 }
            }
        },
        // 武技系列 - 额外伤害
        deathstrike: {
            name: '武技',
            description: '提高额外伤害',
            type: 'passive',
            levels: {
                1: { bonus: 10000 },
                2: { bonus: 30000 },
                3: { bonus: 50000 }
            }
        },
        // 破坏系列 - TA提升
        devastation: {
            name: '破坏',
            description: '提高TA概率',
            type: 'passive',
            levels: {
                1: { taRate: 5 },
                2: { taRate: 9 },
                3: { taRate: 12 }
            }
        },
        // 二手系列 - DA提升
        dualEdge: {
            name: '二手',
            description: '提高DA概率',
            type: 'passive',
            levels: {
                1: { daRate: 8 },
                2: { daRate: 12 },
                3: { daRate: 18 }
            }
        },
        // 背水系列 - 血量越低攻击越高
        enmity: {
            name: '背水',
            description: '血量越低攻击力越高',
            type: 'passive',
            levels: {
                1: { enmity: 7 },
                2: { enmity: 12 },
                3: { enmity: 18 }
            }
        },
        // 攻刃系列 - 攻击力提升
        essence: {
            name: '攻刃',
            description: '提高攻击力',
            type: 'passive',
            levels: {
                1: { attack: 16 },
                2: { attack: 24 },
                3: { attack: 36 }
            }
        },
        // 乱舞系列 - 攻击/TA提升
        fandango: {
            name: '乱舞',
            description: '提高攻击力和TA概率',
            type: 'passive',
            levels: {
                1: { attack: 22, taRate: 4 },
                2: { attack: 28, taRate: 6 },
                3: { attack: 32, taRate: 9 }
            }
        },
        // 坚守系列 - 防御力提升
        fortified: {
            name: '坚守',
            description: '提高防御力',
            type: 'passive',
            levels: {
                1: { defense: 20 },
                2: { defense: 32 },
                3: { defense: 45 }
            }
        },
        // 无双系列 - 攻击/DA提升
        haunt: {
            name: '无双',
            description: '提高攻击力和DA概率',
            type: 'passive',
            levels: {
                1: { attack: 24, daRate: 7 },
                2: { attack: 29, daRate: 10 },
                3: { attack: 32, daRate: 16 }
            }
        },
        // 军神系列 - HP/DA提升
        heroism: {
            name: '军神',
            description: '提高生命值和DA概率',
            type: 'passive',
            levels: {
                1: { hp: 14, daRate: 7 },
                2: { hp: 20, daRate: 10 },
                3: { hp: 30, daRate: 15 }
            }
        },
        // 神威系列 - 攻击/HP提升
        majesty: {
            name: '神威',
            description: '提高攻击力和生命值',
            type: 'passive',
            levels: {
                1: { hp: 12, attack: 12 },
                2: { hp: 24, attack: 24 },
                3: { hp: 40, attack: 40 }
            }
        },
        // 愤怒系列 - 攻击/EX攻击提升
        might: {
            name: '愤怒',
            description: '提高攻击力和EX攻击力',
            type: 'passive',
            levels: {
                1: { attack: 20, exAttack: 12 },
                2: { attack: 26, exAttack: 15 },
                3: { attack: 32, exAttack: 18 }
            }
        },
        // 技巧系列 - 暴击率提升
        sephiraTek: {
            name: '技巧',
            description: '提高暴击率',
            type: 'passive',
            levels: {
                1: { critRate: 8 },
                2: { critRate: 12 },
                3: { critRate: 20 }
            }
        },
        // 霸道系列 - EX攻击提升
        sovereign: {
            name: '霸道',
            description: '提高EX攻击力',
            type: 'passive',
            levels: {
                1: { exAttack: 28 },
                2: { exAttack: 36 },
                3: { exAttack: 46 }
            }
        },
        // 克己系列 - DA/暴击提升
        restraint: {
            name: '克己',
            description: '提高DA概率和暴击率',
            type: 'passive',
            levels: {
                1: { daRate: 7, critRate: 10 },
                2: { daRate: 10, critRate: 13 },
                3: { daRate: 15, critRate: 17 }
            }
        },
        // 锐锋系列 - TA/暴击提升
        spearhead: {
            name: '锐锋',
            description: '提高TA概率和暴击率',
            type: 'passive',
            levels: {
                1: { taRate: 4, critRate: 6 },
                2: { taRate: 6, critRate: 10 },
                3: { taRate: 8, critRate: 15 }
            }
        },
        // 浑身系列 - 浑身值提升
        stamina: {
            name: '浑身',
            description: '提高浑身值',
            type: 'passive',
            levels: {
                1: { stamina: 6 },
                2: { stamina: 6 },
                3: { stamina: 15 }
            }
        },
        // 志气系列 - HP/浑身提升
        verve: {
            name: '志气',
            description: '提高生命值和浑身值',
            type: 'passive',
            levels: {
                1: { hp: 10, stamina: 4 },
                2: { hp: 15, stamina: 7 },
                3: { hp: 18, stamina: 10 }
            }
        }
    },

    // 武器突破等级上限
    breakthroughLevels: {
        0: 40,  // 初始最高等级
        1: 60,  // 第一次突破
        2: 80,  // 第二次突破
        3: 100, // 第三次突破
        4: 150  // 终突
    },

    // 武器模板
    templates: {},

    /**
     * 初始化武器系统
     */
    init() {
        console.log('武器系统开始初始化...');

        // 先加载基本武器模板，确保templates不为空
        this.loadBasicTemplates();

        // 然后尝试加载完整的武器模板
        this.loadTemplates();

        console.log('武器系统初始化完成');
    },

    /**
     * 加载基本武器模板，确保templates不为空
     */
    loadBasicTemplates() {
        console.log('加载基本武器模板');
        this.templates = {
            // 基本武器类型
            sword: {
                name: '剑',
                description: '平衡型武器，提供均衡的攻击和生命值',
                baseStats: { attack: 10, hp: 50 }
            },
            knife: {
                name: '刀',
                description: '快速型武器，提供较高的攻击速度',
                baseStats: { attack: 8, hp: 40 }
            },
            staff: {
                name: '杖',
                description: '魔法武器，提供特殊效果和能力',
                baseStats: { attack: 7, hp: 45 }
            },
            bow: {
                name: '弓',
                description: '远程武器，提供中等攻击和速度',
                baseStats: { attack: 12, hp: 25 }
            },
            axe: {
                name: '斧',
                description: '重型武器，提供高攻击但速度较慢',
                baseStats: { attack: 15, hp: 30 }
            },
            spear: {
                name: '枪',
                description: '长柄武器，提供均衡的攻击和防御',
                baseStats: { attack: 11, hp: 35 }
            }
        };
        console.log('基本武器模板加载完成');
    },

    /**
     * 加载武器模板数据
     */
    loadTemplates() {
        console.log('开始加载武器模板数据...');
        console.log('当前templates状态:', this.templates);

        // 保存当前的基本武器模板
        const basicTemplates = { ...this.templates };

        // 从Python服务器获取JSON数据
        const serverUrl = 'http://localhost:8000';
        const jsonPath = '/src/data/weapons.json';

        console.log(`尝试从服务器加载JSON: ${serverUrl}${jsonPath}`);

        fetch(`${serverUrl}${jsonPath}`)
            .then(response => {
                console.log('服务器响应状态:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('成功从服务器获取数据:', data);
                // 合并新加载的武器模板与已有的基本武器模板
                this.templates = { ...basicTemplates, ...data };
                console.log('合并后的templates:', this.templates);
                console.log('武器模板数据加载成功');
                this.emitLoadedEvent();
            })
            .catch(error => {
                console.error('从服务器加载武器模板数据失败:', error);
                this.loadTemplatesFallback();
            });
    },

    /**
     * 备用方法：当服务器不可用时使用
     */
    loadTemplatesFallback() {
        console.log('开始使用备用方法加载武器模板数据...');
        console.log('当前templates状态:', this.templates);

        fetch('src/data/weapons.json')
            .then(response => {
                console.log('获取响应:', response);
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('成功获取武器模板数据:', data);
                const basicTemplates = { ...this.templates };
                this.templates = { ...basicTemplates, ...data };
                console.log('合并后的templates:', this.templates);
                console.log('成功直接加载武器模板数据');
                this.emitLoadedEvent();
            })
            .catch(error => {
                console.error('直接加载武器模板数据失败:', error);
                console.error('%c无法加载完整的武器模板数据!', 'color: red; font-size: 24px; font-weight: bold;');
                console.error('%c请确保 src/data/weapons.json 文件存在', 'color: red; font-size: 18px;');
                console.error('%c或者启动 Python 服务器: python server.py', 'color: red; font-size: 18px;');
                console.warn('将使用基本武器模板继续...');
                this.emitLoadedEvent();
            });
    },

    /**
     * 触发武器模板加载完成事件
     */
    emitLoadedEvent() {
        if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
            Events.emit('weaponTemplate:loaded');
        }
    },

    /**
     * 获取武器
     * @param {string} weaponId - 武器ID
     * @returns {object|null} 武器对象
     */
    getWeapon(weaponId) {
        return this.weapons[weaponId] || null;
    },

    /**
     * 获取所有武器
     * @returns {object} 所有武器对象
     */
    getAllWeapons() {
        return this.weapons;
    },

    /**
     * 创建武器
     * @param {object} data - 武器数据
     * @returns {string} 武器ID
     */
    createWeapon(data) {
        //console.log('开始创建武器...');
        //console.log('武器数据:', data);

        const weaponId = data.id || `weapon_${Date.now()}`;
        const type = this.types[data.type] || this.types.sword;

        // 转换稀有度数值为对应的名称
        let rarityName = 'common';
        switch(data.rarity) {
            case 3:
                rarityName = 'rare';
                break;
            case 4:
                rarityName = 'epic';
                break;
            case 5:
                rarityName = 'legendary';
                break;
            default:
                rarityName = 'common';
        }

        //console.log('武器类型:', type);
        //console.log('武器稀有度:', rarityName);

        // 创建武器对象
        this.weapons[weaponId] = {
            id: weaponId,
            name: data.name || '未命名武器',
            type: data.type,
            element: data.element,
            rarity: rarityName,
            level: data.level || 1,
            exp: data.exp || 0,
            breakthrough: data.breakthrough || 0,
            baseStats: { ...data.baseStats },
            specialEffects: [...(data.specialEffects || [])],
            isEquipped: false
        };

        //console.log(`创建武器成功: ${this.weapons[weaponId].name}`);
        //console.log('武器详情:', this.weapons[weaponId]);
        Game.stats.weaponsCollected++;

        return weaponId;
    },

    /**
     * 获取武器盘
     * @param {string} boardId - 武器盘ID
     * @returns {object|null} 武器盘对象
     */
    getWeaponBoard(boardId) {
        return this.weaponBoards[boardId] || null;
    },

    /**
     * 获取所有武器盘
     * @returns {object} 所有武器盘对象
     */
    getAllWeaponBoards() {
        return this.weaponBoards;
    },

    /**
     * 创建武器盘
     * @param {string} boardId - 武器盘ID
     * @param {number} size - 武器盘大小
     * @returns {object} 武器盘对象
     */
    createWeaponBoard(boardId, size = 10) {
        if (!boardId) boardId = `board_${Date.now()}`;

        // 创建具有命名槽位的武器盘
        const slots = {
            main: null  // 主手武器槽
        };

        // 添加9个副武器槽
        for (let i = 1; i <= 9; i++) {
            slots[`sub${i}`] = null;
        }

        this.weaponBoards[boardId] = {
            id: boardId,
            slots: slots,
            size: size
        };

        console.log(`创建武器盘: ${boardId}`);
        return this.weaponBoards[boardId];
    },

    /**
     * 将武器添加到武器盘
     * @param {string} boardId - 武器盘ID
     * @param {string} weaponId - 武器ID
     * @param {string} slotType - 槽位类型 (main, sub1, sub2, ...)
     * @returns {boolean} 是否添加成功
     */
    addWeaponToBoard(boardId, weaponId, slotType) {
        const board = this.getWeaponBoard(boardId);
        const weapon = this.getWeapon(weaponId);

        if (!board || !weapon) return false;

        // 检查槽位类型是否有效
        if (!board.slots.hasOwnProperty(slotType)) {
            console.error(`无效的槽位类型: ${slotType}`);
            return false;
        }

        // 检查是否已装备在其他武器盘
        if (weapon.isEquipped) {
            // 先从其他武器盘移除
            this.removeWeaponFromAllBoards(weaponId);
        }

        // 添加到指定槽位
        board.slots[slotType] = weaponId;
        weapon.isEquipped = true;

        console.log(`将武器 ${weapon.name} 添加到武器盘 ${boardId} 的槽位 ${slotType}`);

        // 如果是主手武器，更新主角元素属性
        if (slotType === 'main') {
            // 查找拥有此武器盘的队伍
            let teamId = null;
            if (typeof Team !== 'undefined' && Team.teams) {
                for (const id in Team.teams) {
                    if (Team.teams[id].weaponBoardId === boardId) {
                        teamId = id;
                        break;
                    }
                }
            }

            // 如果找到队伍，更新主角元素属性
            if (teamId && typeof Character !== 'undefined' && typeof Character.updateMainCharacterElement === 'function') {
                console.log('更新主角元素属性为武器元素');
                Character.updateMainCharacterElement(teamId);
            }
        }

        // 打印更新后的武器盘属性
        this.printWeaponBoardStats(boardId);

        // 查找拥有此武器盘的队伍
        let teamId = null;
        if (typeof Team !== 'undefined' && Team.teams) {
            for (const id in Team.teams) {
                if (Team.teams[id].weaponBoardId === boardId) {
                    teamId = id;
                    break;
                }
            }
        }

        // 如果找到队伍，更新所有角色的weaponBonusStats
        if (teamId && typeof Character !== 'undefined' && typeof Character.updateTeamWeaponBonusStats === 'function') {
            console.log('更新队伍中所有角色的武器盘加成属性');
            Character.updateTeamWeaponBonusStats(teamId);
        }

        // 触发武器变化事件
        if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
            Events.emit('weapon:updated', { boardId, weaponId, slotType });
        } else {
            // 兼容旧版事件系统
            const event = new CustomEvent('weaponChanged', {
                detail: { boardId, weaponId, slotType }
            });
            document.dispatchEvent(event);
        }

        return true;
    },

    /**
     * 从武器盘移除武器
     * @param {string} boardId - 武器盘ID
     * @param {string} slotType - 槽位类型 (main, sub1, sub2, ...)
     * @returns {string|null} 移除的武器ID
     */
    removeWeaponFromBoard(boardId, slotType) {
        const board = this.getWeaponBoard(boardId);
        if (!board) return null;

        // 检查槽位类型是否有效
        if (!board.slots.hasOwnProperty(slotType)) {
            console.error(`无效的槽位类型: ${slotType}`);
            return null;
        }

        const weaponId = board.slots[slotType];
        if (!weaponId) return null;

        // 更新武器状态
        const weapon = this.getWeapon(weaponId);
        if (weapon) {
            weapon.isEquipped = false;
        }

        // 移除槽位中的武器
        board.slots[slotType] = null;

        console.log(`从武器盘 ${boardId} 的槽位 ${slotType} 移除武器 ${weaponId}`);

        // 如果是主手武器，更新主角元素属性为默认火属性
        if (slotType === 'main') {
            // 查找拥有此武器盘的队伍
            let teamId = null;
            if (typeof Team !== 'undefined' && Team.teams) {
                for (const id in Team.teams) {
                    if (Team.teams[id].weaponBoardId === boardId) {
                        teamId = id;
                        break;
                    }
                }
            }

            // 如果找到队伍，更新主角元素属性
            if (teamId && typeof Character !== 'undefined' && typeof Character.updateMainCharacterElement === 'function') {
                console.log('主手武器被移除，重置主角元素属性为火属性');
                Character.updateMainCharacterElement(teamId);
            }
        }

        // 打印更新后的武器盘属性
        this.printWeaponBoardStats(boardId);

        // 查找拥有此武器盘的队伍
        let teamId = null;
        if (typeof Team !== 'undefined' && Team.teams) {
            for (const id in Team.teams) {
                if (Team.teams[id].weaponBoardId === boardId) {
                    teamId = id;
                    break;
                }
            }
        }

        // 如果找到队伍，更新所有角色的weaponBonusStats
        if (teamId && typeof Character !== 'undefined' && typeof Character.updateTeamWeaponBonusStats === 'function') {
            console.log('更新队伍中所有角色的武器盘加成属性');
            Character.updateTeamWeaponBonusStats(teamId);
        }

        return weaponId;
    },

    /**
     * 从所有武器盘移除指定武器
     * @param {string} weaponId - 武器ID
     */
    removeWeaponFromAllBoards(weaponId) {
        for (const boardId in this.weaponBoards) {
            const board = this.weaponBoards[boardId];

            // 遍历所有槽位
            for (const slotType in board.slots) {
                if (board.slots[slotType] === weaponId) {
                    this.removeWeaponFromBoard(boardId, slotType);
                }
            }
        }
    },

    /**
     * 计算武器盘属性总和
     * @param {string} boardId - 武器盘ID
     * @returns {object} 属性总和
     */
    calculateWeaponBoardStats(boardId) {
        const board = this.getWeaponBoard(boardId);
        if (!board) return {
            base: { attack: 0, hp: 0 },
            elementStats: {
                fire: { hp: 0, attack: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                water: { hp: 0, attack: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                earth: { hp: 0, attack: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                wind: { hp: 0, attack: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                light: { hp: 0, attack: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                dark: { hp: 0, attack: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 }
            }
        };

        // 初始化结果
        const result = {
            base: { attack: 0, hp: 0 },
            elementStats: {
                fire: { hp: 0, attack: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                water: { hp: 0, attack: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                earth: { hp: 0, attack: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                wind: { hp: 0, attack: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                light: { hp: 0, attack: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 },
                dark: { hp: 0, attack: 0, critRate: 0, daRate: 0, taRate: 0, exAttack: 0, defense: 0, stamina: 0, enmity: 0, na_cap: 0, skill_cap: 0, bonusDamage: 0 }
            }
        };

        // 计算所有武器的基础属性总和和技能加成
        for (const slotType in board.slots) {
            const weaponId = board.slots[slotType];
            if (!weaponId) continue;

            const weapon = this.getWeapon(weaponId);
            if (!weapon) continue;

            // 获取武器当前属性
            const currentStats = this.calculateCurrentStats(weapon);

            // 添加基础属性
            result.base.attack += currentStats.attack;
            result.base.hp += currentStats.hp;

            // 处理武器技能
            if (weapon.specialEffects && weapon.specialEffects.length > 0) {
                weapon.specialEffects.forEach(effect => {
                    // 检查技能是否已解锁
                    if (weapon.level >= effect.unlock) {
                        const skill = this.skills[effect.type];
                        if (skill && skill.levels) {
                            // 直接使用技能等级数据
                            const levelData = skill.levels[effect.level];

                            // 根据武器属性添加技能加成
                            const element = weapon.element.toLowerCase();
                            if (levelData.hp) {
                                result.elementStats[element].hp += levelData.hp;
                            }
                            if (levelData.attack) {
                                result.elementStats[element].attack += levelData.attack;
                            }
                            if (levelData.critRate) {
                                result.elementStats[element].critRate += levelData.critRate;
                            }
                            if (levelData.daRate) {
                                result.elementStats[element].daRate += levelData.daRate;
                            }
                            if (levelData.taRate) {
                                result.elementStats[element].taRate += levelData.taRate;
                            }
                            if (levelData.exAttack) {
                                result.elementStats[element].exAttack += levelData.exAttack;
                            }
                            if (levelData.defense) {
                                result.elementStats[element].defense += levelData.defense;
                            }
                            if (levelData.stamina) {
                                result.elementStats[element].stamina += levelData.stamina;
                            }
                            if (levelData.enmity) {
                                result.elementStats[element].enmity += levelData.enmity;
                            }
                            if (levelData.na_cap) {
                                result.elementStats[element].na_cap += levelData.na_cap;
                            }
                            if (levelData.skill_cap) {
                                result.elementStats[element].skill_cap += levelData.skill_cap;
                            }
                            if (levelData.bonus) {
                                result.elementStats[element].bonusDamage += levelData.bonus;
                            }
                        }
                    }
                });
            }
        }

        return result;
    },

    /**
     * 计算武器当前属性
     * @param {object} weapon - 武器对象
     * @returns {object} 当前属性
     */
    calculateCurrentStats(weapon) {
        const baseStats = weapon.baseStats;
        const currentLevel = weapon.level;
        const maxLevel = this.breakthroughLevels[weapon.breakthrough || 0];

        // 计算当前等级对应的基础属性值（线性增长）
        const attack = Math.floor(baseStats.attack + Math.floor((baseStats["150Attack"] - baseStats.attack) * (currentLevel - 1) / (maxLevel - 1)));
        const hp = Math.floor(baseStats.hp + Math.floor((baseStats["150Hp"] - baseStats.hp) * (currentLevel - 1) / (maxLevel - 1)));

        // 创建基础属性对象
        let stats = { attack, hp };


        return stats;
    },

    /**
     * 计算升级所需经验
     * @param {number} currentLevel - 当前等级
     * @param {number} targetLevel - 目标等级
     * @returns {number} 所需经验值
     */
    calculateExpRequired(currentLevel, targetLevel) {
        // 线性经验值计算
        const baseExp = 50000; // 100级所需经验
        const expPerLevel = baseExp / 99; // 每级所需经验
        return Math.floor(expPerLevel * (targetLevel - currentLevel));
    },

    /**
     * 突破武器
     * @param {string} weaponId - 武器ID
     * @param {Array<string>} materialWeaponIds - 材料武器ID数组
     */
    breakthroughWeapon(weaponId, materialWeaponIds) {
        const weapon = this.getWeapon(weaponId);
        if (!weapon) return false;

        // 确保materialWeaponIds是数组
        const materials = Array.isArray(materialWeaponIds) ? materialWeaponIds : [materialWeaponIds];

        // 计算新的突破等级
        const newBreakthrough = (weapon.breakthrough || 0) + materials.length;
        if (newBreakthrough > 3) {
            console.error('突破等级不能超过3');
            return false;
        }

        // 消耗所有材料武器
        materials.forEach(materialId => {
            this.deleteWeapon(materialId);
        });

        // 更新突破次数和等级上限
        weapon.breakthrough = newBreakthrough;
        weapon.maxLevel = this.breakthroughLevels[weapon.breakthrough];

        // 确保武器数据被正确保存
        this.weapons[weaponId] = weapon;

        return true;
    },

    /**
     * 终突武器
     * @param {string} weaponId - 武器ID
     * @param {string} specialMaterialId - 特殊材料ID
     */
    finalBreakthrough(weaponId, specialMaterialId) {
        const weapon = this.getWeapon(weaponId);

        // 消耗特殊材料
        Inventory.removeItem(specialMaterialId);

        // 更新突破次数和等级上限
        weapon.breakthrough = 4;
        weapon.maxLevel = this.breakthroughLevels[4];

        return true;
    },

    /**
     * 升级武器
     * @param {string} weaponId - 武器ID
     * @param {number} expAmount - 经验值
     */
    upgradeWeapon(weaponId, expAmount) {
        const weapon = this.getWeapon(weaponId);
        if (!weapon) return false;

        // 检查是否已达到等级上限
        const maxLevel = this.breakthroughLevels[weapon.breakthrough || 0];
        if (weapon.level >= maxLevel) {
            console.log('武器已达到当前突破等级上限，无法继续升级');
            return false;
        }

        // 添加经验值
        weapon.exp += expAmount;

        // 升级直到经验不足或达到等级上限
        while (weapon.level < maxLevel) {
            const expToNextLevel = this.calculateExpRequired(weapon.level, weapon.level + 1);
            if (weapon.exp < expToNextLevel) break;

            // 升级
            weapon.exp -= expToNextLevel;
            weapon.level++;

            // 更新当前属性
            const currentStats = this.calculateCurrentStats(weapon);
            weapon.currentAttack = currentStats.attack;
            weapon.currentHp = currentStats.hp;
        }

        return true;
    },

    /**
     * 加载武器数据
     * @param {object} data - 保存的武器数据
     */
    loadWeapons(data) {
        if (!data) return;
        this.weapons = {...data};
    },

    /**
     * 加载武器盘数据
     * @param {object} data - 保存的武器盘数据
     */
    loadWeaponBoards(data) {
        if (!data) return;
        this.weaponBoards = {...data};
    },

    /**
     * 重置武器系统
     */
    reset() {
        this.weapons = {};
        this.weaponBoards = {};
        this.init();
    },

    /**
      * 创建初始武器
      */
    createInitialWeapons() {
            console.log('开始创建初始武器...');
            console.log('当前templates状态:', this.templates);

            // 检查是否有可用的武器模板
            if (!this.templates || Object.keys(this.templates).length === 0) {
                console.error('没有可用的武器模板，无法创建初始武器');
                return;
            }

            // 为每种武器创建8把
            const weapons = [
                'surturFlame', 'surturSword', 'gonggongTouch', 'gonggongPillar',
                'dagdaBreath', 'dagdaHorn', 'gaiaEmbrace', 'gaiaRoot',
                'lughBlade', 'lughCrown', 'anubisScale', 'anubisStaff'
            ];

            console.log('计划创建的武器列表:', weapons);

            weapons.forEach(weaponId => {
                if (!this.templates[weaponId]) {
                    console.error(`未找到武器模板: ${weaponId}`);
                    return;
                }

                for (let i = 0; i < 8; i++) {
                    const weaponData = {
                        id: `${weaponId}_${i + 1}`,
                        name: this.templates[weaponId].name,
                        type: this.templates[weaponId].type,
                        element: this.templates[weaponId].element,
                        rarity: this.templates[weaponId].rarity,
                        level: 1,
                        exp: 0,
                        breakthrough: 0,
                        baseStats: { ...this.templates[weaponId].baseStats },
                        specialEffects: [...this.templates[weaponId].specialEffects]
                    };
                    this.createWeapon(weaponData);
                }
            });

            console.log('初始武器创建完成');
            console.log('当前所有武器:', this.weapons);

            // 保存游戏状态
            if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                console.log('保存武器数据到游戏状态');
                setTimeout(() => Game.saveGame(), 100);
            }

            // 更新UI显示
            if (typeof UI !== 'undefined' && typeof UI.renderWeaponInventory === 'function') {
                console.log('更新武器库存UI显示');
                setTimeout(() => UI.renderWeaponInventory(), 200);
            }
        },

    /**
     * 删除武器
     * @param {string} weaponId - 武器ID
     * @returns {boolean} 是否删除成功
     */
    deleteWeapon(weaponId) {
        const weapon = this.getWeapon(weaponId);
        if (!weapon) return false;

        // 如果武器已装备，先从所有武器盘中移除
        if (weapon.isEquipped) {
            this.removeWeaponFromAllBoards(weaponId);
        }

        // 删除武器
        delete this.weapons[weaponId];
        return true;
    },

    /**
     * 打印武器盘上所有武器的技能信息
     * @param {string} boardId - 武器盘ID
     */
    printWeaponBoardSkills(boardId) {
        const board = this.getWeaponBoard(boardId);
        if (!board) {
            console.log('未找到武器盘:', boardId);
            return;
        }

        console.log('\n=== 武器盘技能详情 ===');
        console.log(`武器盘ID: ${boardId}`);

        for (const slotType in board.slots) {
            const weaponId = board.slots[slotType];
            if (!weaponId) continue;

            const weapon = this.getWeapon(weaponId);
            if (!weapon) continue;

            // console.log(`\n槽位 ${slotType}: ${weapon.name}`);
            // console.log(`- 等级: ${weapon.level}`);
            // console.log(`- 属性: ${weapon.element}`);
            // console.log(`- 突破: ${weapon.breakthrough || 0}`);

            if (weapon.specialEffects && weapon.specialEffects.length > 0) {
                //console.log('- 技能:');
                weapon.specialEffects.forEach(effect => {
                    const skill = this.skills[effect.type];
                    const isUnlocked = weapon.level >= effect.unlock;
                    //console.log(`  * ${skill.name} Lv.${effect.level} ${isUnlocked ? '(已解锁)' : `(需要${effect.unlock}级)`}`);
                    if (isUnlocked) {
                        const levelData = skill.levels[effect.level];
                        const effectStats = {
                            attack: levelData.attack || 0,
                            hp: levelData.hp || 0,
                            critRate: levelData.critRate || 0,
                            daRate: levelData.daRate || 0,
                            taRate: levelData.taRate || 0,
                            exAttack: levelData.exAttack || 0,
                            defense: levelData.defense || 0,
                            stamina: levelData.stamina || 0,
                            enmity: levelData.enmity || 0,
                            na_cap: levelData.na_cap || 0,
                            skill_cap: levelData.skill_cap || 0,
                            bonus: levelData.bonus || 0
                        };
                        //console.log(`    效果:`, effectStats);
                    }
                });
            } else {
                console.log('- 无技能');
            }
        }
    },

    /**
     * 打印武器盘属性并返回属性对象
     * @param {string} boardId - 武器盘ID
     * @returns {object} 武器盘属性对象，包含base和elementStats
     */
    printWeaponBoardStats(boardId) {
        // 先打印技能详情
        this.printWeaponBoardSkills(boardId);

        const stats = this.calculateWeaponBoardStats(boardId);

        console.log('\n=== 武器盘属性统计 ===');
        console.log('基础属性:');
        console.log(`- 总攻击力: ${stats.base.attack}`);
        console.log(`- 总生命值: ${stats.base.hp}`);

        console.log('\n属性加成:');
        const elements = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];
        const elementNames = {
            fire: '火',
            water: '水',
            earth: '土',
            wind: '风',
            light: '光',
            dark: '暗'
        };

        elements.forEach(element => {
            const elementStats = stats.elementStats[element];
            if (elementStats.hp > 0 || elementStats.attack > 0 || elementStats.critRate > 0 ||
                elementStats.daRate > 0 || elementStats.taRate > 0 || elementStats.exAttack > 0 ||
                elementStats.defense > 0 || elementStats.stamina > 0 || elementStats.enmity > 0 ||
                elementStats.na_cap > 0 || elementStats.skill_cap > 0 || elementStats.bonusDamage > 0) {
                console.log(`\n${elementNames[element]}属性加成:`);
                if (elementStats.hp > 0) {
                    console.log(`- HP提升: ${elementStats.hp}%`);
                }
                if (elementStats.attack > 0) {
                    console.log(`- 攻击力提升: ${elementStats.attack}%`);
                }
                if (elementStats.critRate > 0) {
                    console.log(`- 暴击率提升: ${elementStats.critRate}%`);
                }
                if (elementStats.daRate > 0) {
                    console.log(`- DA率提升: ${elementStats.daRate}%`);
                }
                if (elementStats.taRate > 0) {
                    console.log(`- TA率提升: ${elementStats.taRate}%`);
                }
                if (elementStats.exAttack > 0) {
                    console.log(`- EX攻击力提升: ${elementStats.exAttack}%`);
                }
                if (elementStats.defense > 0) {
                    console.log(`- 防御力提升: ${elementStats.defense}%`);
                }
                if (elementStats.stamina > 0) {
                    console.log(`- 浑身值提升: ${elementStats.stamina}%`);
                }
                if (elementStats.enmity > 0) {
                    console.log(`- 背水值提升: ${elementStats.enmity}%`);
                }
                if (elementStats.na_cap > 0) {
                    console.log(`- 技能伤害上限提升: ${elementStats.na_cap}%`);
                }
                if (elementStats.skill_cap > 0) {
                    console.log(`- 伤害上限提升: ${elementStats.skill_cap}%`);
                }
                if (elementStats.bonusDamage > 0) {
                    console.log(`- 额外伤害: ${elementStats.bonusDamage}`);
                }
            }
        });

        // 返回武器盘属性对象，以便在UI中使用
        return stats;
    }
};