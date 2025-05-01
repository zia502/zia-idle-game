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
                1: { da: 7, ta: 3 },
                2: { da: 10, ta: 6 },
                3: { da: 15, ta: 10 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.abandon.levels[level];
                stats.daRate = (stats.daRate || 0) + levelData.da / 100;
                stats.taRate = (stats.taRate || 0) + levelData.ta / 100;
                return stats;
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
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.aegis.levels[level];
                stats.hp = Math.floor(stats.hp * (1 + levelData.hp / 100));
                return stats;
            }
        },
        // 穷理系列 - 技能伤害上限提升
        arts: {
            name: '穷理',
            description: '提高技能伤害上限',
            type: 'passive',
            levels: {
                1: { cap: 5 },
                2: { cap: 7 },
                3: { cap: 10 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.arts.levels[level];
                stats.skillDamageCap = (stats.skillDamageCap || 1) * (1 + levelData.cap / 100);
                return stats;
            }
        },
        // 绝涯系列 - 伤害上限提升
        beastEssence: {
            name: '绝涯',
            description: '提高伤害上限',
            type: 'passive',
            levels: {
                1: { cap: 10 },
                2: { cap: 20 },
                3: { cap: 30 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.beastEssence.levels[level];
                stats.damageCap = (stats.damageCap || 1) * (1 + levelData.cap / 100);
                return stats;
            }
        },
        // 刃界系列 - HP/暴击提升
        bladeshield: {
            name: '刃界',
            description: '提高生命值和暴击率',
            type: 'passive',
            levels: {
                1: { hp: 12, crit: 4 },
                2: { hp: 14, crit: 6 },
                3: { hp: 20, crit: 10 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.bladeshield.levels[level];
                stats.hp = Math.floor(stats.hp * (1 + levelData.hp / 100));
                stats.critRate = (stats.critRate || 0) + levelData.crit / 100;
                return stats;
            }
        },
        // 刹那系列 - 攻击/暴击提升
        celere: {
            name: '刹那',
            description: '提高攻击力和暴击率',
            type: 'passive',
            levels: {
                1: { atk: 20, crit: 4 },
                2: { atk: 26, crit: 8 },
                3: { atk: 30, crit: 12 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.celere.levels[level];
                stats.attack = Math.floor(stats.attack * (1 + levelData.atk / 100));
                stats.critRate = (stats.critRate || 0) + levelData.crit / 100;
                return stats;
            }
        },
        // 励行系列 - EX攻击/防御提升
        convergence: {
            name: '励行',
            description: '提高EX攻击力和防御力',
            type: 'passive',
            levels: {
                1: { exatk: 20, def: 15 },
                2: { exatk: 30, def: 20 },
                3: { exatk: 40, def: 30 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.convergence.levels[level];
                stats.exAttack = (stats.exAttack || 0) * (1 + levelData.exatk / 100);
                stats.defense = (stats.defense || 0) * (1 + levelData.def / 100);
                return stats;
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
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.deathstrike.levels[level];
                stats.bonusDamage = (stats.bonusDamage || 0) + levelData.bonus;
                return stats;
            }
        },
        // 破坏系列 - TA提升
        devastation: {
            name: '破坏',
            description: '提高TA概率',
            type: 'passive',
            levels: {
                1: { ta: 5 },
                2: { ta: 9 },
                3: { ta: 12 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.devastation.levels[level];
                stats.taRate = (stats.taRate || 0) + levelData.ta / 100;
                return stats;
            }
        },
        // 二手系列 - DA提升
        dualEdge: {
            name: '二手',
            description: '提高DA概率',
            type: 'passive',
            levels: {
                1: { da: 8 },
                2: { da: 12 },
                3: { da: 18 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.dualEdge.levels[level];
                stats.daRate = (stats.daRate || 0) + levelData.da / 100;
                return stats;
            }
        },
        // 背水系列 - 血量越低攻击越高
        enmity: {
            name: '背水',
            description: '血量越低攻击力越高',
            type: 'passive',
            levels: {
                1: { value: 7 },
                2: { value: 12 },
                3: { value: 18 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.enmity.levels[level];
                stats.enmity = (stats.enmity || 0) + levelData.value / 100;
                return stats;
            }
        },
        // 攻刃系列 - 攻击力提升
        essence: {
            name: '攻刃',
            description: '提高攻击力',
            type: 'passive',
            levels: {
                1: { atk: 16 },
                2: { atk: 24 },
                3: { atk: 36 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.essence.levels[level];
                stats.attack = Math.floor(stats.attack * (1 + levelData.atk / 100));
                return stats;
            }
        },
        // 乱舞系列 - 攻击/TA提升
        fandango: {
            name: '乱舞',
            description: '提高攻击力和TA概率',
            type: 'passive',
            levels: {
                1: { atk: 22, ta: 4 },
                2: { atk: 28, ta: 6 },
                3: { atk: 32, ta: 9 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.fandango.levels[level];
                stats.attack = Math.floor(stats.attack * (1 + levelData.atk / 100));
                stats.taRate = (stats.taRate || 0) + levelData.ta / 100;
                return stats;
            }
        },
        // 坚守系列 - 防御力提升
        fortified: {
            name: '坚守',
            description: '提高防御力',
            type: 'passive',
            levels: {
                1: { def: 20 },
                2: { def: 32 },
                3: { def: 45 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.fortified.levels[level];
                stats.defense = (stats.defense || 0) * (1 + levelData.def / 100);
                return stats;
            }
        },
        // 无双系列 - 攻击/DA提升
        haunt: {
            name: '无双',
            description: '提高攻击力和DA概率',
            type: 'passive',
            levels: {
                1: { atk: 24, da: 7 },
                2: { atk: 29, da: 10 },
                3: { atk: 32, da: 16 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.haunt.levels[level];
                stats.attack = Math.floor(stats.attack * (1 + levelData.atk / 100));
                stats.daRate = (stats.daRate || 0) + levelData.da / 100;
                return stats;
            }
        },
        // 军神系列 - HP/DA提升
        heroism: {
            name: '军神',
            description: '提高生命值和DA概率',
            type: 'passive',
            levels: {
                1: { hp: 14, da: 7 },
                2: { hp: 20, da: 10 },
                3: { hp: 30, da: 15 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.heroism.levels[level];
                stats.hp = Math.floor(stats.hp * (1 + levelData.hp / 100));
                stats.daRate = (stats.daRate || 0) + levelData.da / 100;
                return stats;
            }
        },
        // 神威系列 - 攻击/HP提升
        majesty: {
            name: '神威',
            description: '提高攻击力和生命值',
            type: 'passive',
            levels: {
                1: { hp: 12, atk: 12 },
                2: { hp: 24, atk: 24 },
                3: { hp: 40, atk: 40 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.majesty.levels[level];
                stats.hp = Math.floor(stats.hp * (1 + levelData.hp / 100));
                stats.attack = Math.floor(stats.attack * (1 + levelData.atk / 100));
                return stats;
            }
        },
        // 愤怒系列 - 攻击/EX攻击提升
        might: {
            name: '愤怒',
            description: '提高攻击力和EX攻击力',
            type: 'passive',
            levels: {
                1: { atk: 20, exatk: 12 },
                2: { atk: 26, exatk: 15 },
                3: { atk: 32, exatk: 18 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.might.levels[level];
                stats.attack = Math.floor(stats.attack * (1 + levelData.atk / 100));
                stats.exAttack = (stats.exAttack || 0) * (1 + levelData.exatk / 100);
                return stats;
            }
        },
        // 技巧系列 - 暴击率提升
        sephiraTek: {
            name: '技巧',
            description: '提高暴击率',
            type: 'passive',
            levels: {
                1: { crit: 8 },
                2: { crit: 12 },
                3: { crit: 20 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.sephiraTek.levels[level];
                stats.critRate = (stats.critRate || 0) + levelData.crit / 100;
                return stats;
            }
        },
        // 霸道系列 - EX攻击提升
        sovereign: {
            name: '霸道',
            description: '提高EX攻击力',
            type: 'passive',
            levels: {
                1: { exatk: 28 },
                2: { exatk: 36 },
                3: { exatk: 46 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.sovereign.levels[level];
                stats.exAttack = (stats.exAttack || 0) * (1 + levelData.exatk / 100);
                return stats;
            }
        },
        // 克己系列 - DA/暴击提升
        restraint: {
            name: '克己',
            description: '提高DA概率和暴击率',
            type: 'passive',
            levels: {
                1: { da: 7, crit: 10 },
                2: { da: 10, crit: 13 },
                3: { da: 15, crit: 17 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.restraint.levels[level];
                stats.daRate = (stats.daRate || 0) + levelData.da / 100;
                stats.critRate = (stats.critRate || 0) + levelData.crit / 100;
                return stats;
            }
        },
        // 锐锋系列 - TA/暴击提升
        spearhead: {
            name: '锐锋',
            description: '提高TA概率和暴击率',
            type: 'passive',
            levels: {
                1: { ta: 4, crit: 6 },
                2: { ta: 6, crit: 10 },
                3: { ta: 8, crit: 15 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.spearhead.levels[level];
                stats.taRate = (stats.taRate || 0) + levelData.ta / 100;
                stats.critRate = (stats.critRate || 0) + levelData.crit / 100;
                return stats;
            }
        },
        // 浑身系列 - 浑身值提升
        stamina: {
            name: '浑身',
            description: '提高浑身值',
            type: 'passive',
            levels: {
                1: { value: 6 },
                2: { value: 6 },
                3: { value: 15 }
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.stamina.levels[level];
                stats.stamina = (stats.stamina || 0) + levelData.value / 100;
                return stats;
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
            },
            effect: function(stats, level) {
                const levelData = Weapon.skills.verve.levels[level];
                stats.hp = Math.floor(stats.hp * (1 + levelData.hp / 100));
                stats.stamina = (stats.stamina || 0) + levelData.stamina / 100;
                return stats;
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
        console.log('开始创建武器...');
        console.log('武器数据:', data);

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

        console.log('武器类型:', type);
        console.log('武器稀有度:', rarityName);

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

        console.log(`创建武器成功: ${this.weapons[weaponId].name}`);
        console.log('武器详情:', this.weapons[weaponId]);
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
        if (!board) return { base: { attack: 0, hp: 0 }, percentage: { attack: 0, hp: 0 } };

        // 初始化结果
        const result = {
            base: { attack: 0, hp: 0 },
            percentage: { attack: 0, hp: 0 }
        };

        // 计算所有武器的基础属性总和
        for (const slotType in board.slots) {
            const weaponId = board.slots[slotType];
            if (!weaponId) continue;

            const weapon = this.getWeapon(weaponId);
            if (!weapon) continue;

            // 添加基础属性
            result.base.attack += weapon.attack;
            result.base.hp += weapon.hp;

            // 处理武器技能
            for (const skillId of weapon.skills) {
                const skill = this.skills[skillId];
                if (skill && skill.type === 'passive') {
                    // 计算属性加成百分比（简化处理）
                    if (skillId === 'powerStrike') {
                        result.percentage.attack += 0.2;
                    } else if (skillId === 'toughness') {
                        result.percentage.hp += 0.3;
                    }
                }
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
        const attack = Math.floor(baseStats.attack + (baseStats["150Attack"] - baseStats.attack) * (currentLevel - 1) / (maxLevel - 1));
        const hp = Math.floor(baseStats.hp + (baseStats["150Hp"] - baseStats.hp) * (currentLevel - 1) / (maxLevel - 1));
        
        // 创建基础属性对象
        let stats = { attack, hp };
        
        // 应用已解锁的技能效果
        if (weapon.specialEffects && weapon.specialEffects.length > 0) {
            weapon.specialEffects.forEach(effect => {
                // 检查技能是否已解锁
                if (currentLevel >= effect.unlock) {
                    const skill = this.skills[effect.type];
                    if (skill && skill.effect) {
                        // 应用技能效果
                        stats = skill.effect(stats, effect.level);
                    }
                }
            });
        }
        
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
    }
};