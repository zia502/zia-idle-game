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
        // 攻击力相关
        attackUp: {
            name: '攻击力上升',
            description: '攻击力上升20%',
            type: 'passive',
            effect: (stats) => {
                stats.attack *= 1.2;
                return stats;
            }
        },
        attackExUp: {
            name: '攻击力EX上升',
            description: '攻击力EX上升20%',
            type: 'passive',
            effect: (stats) => {
                stats.attackEx = (stats.attackEx || 0) + 0.2;
                return stats;
            }
        },

        // 暴击相关
        critRateUp: {
            name: '暴击率上升',
            description: '暴击率上升10%',
            type: 'passive',
            effect: (stats) => {
                stats.critRate = (stats.critRate || 0.05) + 0.1;
                return stats;
            }
        },
        critDamageUp: {
            name: '暴击伤害上升',
            description: '暴击伤害上升20%',
            type: 'passive',
            effect: (stats) => {
                stats.critDamage = (stats.critDamage || 1.5) + 0.2;
                return stats;
            }
        },

        // 生存相关
        hpUp: {
            name: 'HP上升',
            description: 'HP上升20%',
            type: 'passive',
            effect: (stats) => {
                stats.hp *= 1.2;
                return stats;
            }
        },
        defenseUp: {
            name: '防御力上升',
            description: '防御力上升20',
            type: 'passive',
            effect: (stats) => {
                stats.defense += 20;
                return stats;
            }
        },

        // 特殊状态相关
        backwaterUp: {
            name: '背水上升',
            description: '背水上升20%',
            type: 'passive',
            effect: (stats) => {
                stats.backwater = (stats.backwater || 0) + 0.2;
                return stats;
            }
        },
        allInUp: {
            name: '浑身上升',
            description: '浑身上升20%',
            type: 'passive',
            effect: (stats) => {
                stats.allIn = (stats.allIn || 0) + 0.2;
                return stats;
            }
        },

        // 伤害相关
        damageUp: {
            name: '伤害增加',
            description: '伤害增加10000',
            type: 'passive',
            effect: (stats) => {
                stats.damageBonus = (stats.damageBonus || 0) + 10000;
                return stats;
            }
        },
        damageMultiplierUp: {
            name: '伤害提升',
            description: '对克制属性伤害提升10%',
            type: 'passive',
            effect: (stats) => {
                stats.damageMultiplier = (stats.damageMultiplier || 1) * 1.1;
                return stats;
            }
        },

        // 连击相关
        daRateUp: {
            name: 'DA概率提升',
            description: 'DA概率提升10%',
            type: 'passive',
            effect: (stats) => {
                stats.daRate = (stats.daRate || 0.15) + 0.1;
                return stats;
            }
        },
        taRateUp: {
            name: 'TA概率提升',
            description: 'TA概率提升5%',
            type: 'passive',
            effect: (stats) => {
                stats.taRate = (stats.taRate || 0.05) + 0.05;
                return stats;
            }
        },

        // 技能伤害相关
        skillDamageUp: {
            name: '技能伤害增加',
            description: '技能伤害增加100',
            type: 'passive',
            effect: (stats) => {
                stats.skillDamageBonus = (stats.skillDamageBonus || 0) + 100;
                return stats;
            }
        },
        skillDamageCapUp: {
            name: '技能伤害上限增加',
            description: '技能伤害上限增加20%',
            type: 'passive',
            effect: (stats) => {
                stats.skillDamageCap = (stats.skillDamageCap || 1) * 1.2;
                return stats;
            }
        },

        // 伤害上限相关
        attackDamageCapUp: {
            name: '攻击伤害上限增加',
            description: '攻击伤害上限增加20%',
            type: 'passive',
            effect: (stats) => {
                stats.attackDamageCap = (stats.attackDamageCap || 1) * 1.2;
                return stats;
            }
        },
        damageCapUp: {
            name: '伤害上限增加',
            description: '伤害上限增加20%',
            type: 'passive',
            effect: (stats) => {
                stats.damageCap = (stats.damageCap || 1) * 1.2;
                return stats;
            }
        }
    },

    // 武器稀有度定义
    rarities: {
        rare: {
            name: '稀有',
            color: '#2196f3',
            statMultiplier: 1.5,
            maxLevel: 60,
            skillSlots: 2
        },
        epic: {
            name: '史诗',
            color: '#9c27b0',
            statMultiplier: 1.8,
            maxLevel: 80,
            skillSlots: 3
        },
        legendary: {
            name: '传说',
            color: '#ff9800',
            statMultiplier: 2.2,
            maxLevel: 100,
            skillSlots: 3
        }
    },

    // 武器模板
    templates: {},

    /**
     * 初始化武器系统
     */
    init() {
        console.log('武器系统已初始化');
        this.loadTemplates();
    },

    /**
     * 加载武器模板数据
     */
    loadTemplates() {
        console.log('加载武器模板数据');

        // 保存当前的基本武器模板
        const basicTemplates = { ...this.templates };

        // 从Python服务器获取JSON数据
        const serverUrl = 'http://localhost:8000';
        const jsonPath = '/src/data/weapons.json';

        console.log(`从服务器加载JSON: ${serverUrl}${jsonPath}`);

        fetch(`${serverUrl}${jsonPath}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // 合并新加载的武器模板与已有的基本武器模板
                this.templates = { ...basicTemplates, ...data };
                console.log('武器模板数据加载成功');
                this.emitLoadedEvent();
            })
            .catch(error => {
                console.error('加载武器模板数据失败:', error);
                this.loadTemplatesFallback();
            });
    },

    /**
     * 备用方法：当服务器不可用时使用
     */
    loadTemplatesFallback() {
        console.log('使用备用方法加载武器模板数据');

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'src/data/weapon-templates.json', false);
            xhr.send(null);

            if (xhr.status === 200) {
                const loadedTemplates = JSON.parse(xhr.responseText);
                const basicTemplates = { ...this.templates };
                this.templates = { ...basicTemplates, ...loadedTemplates };
                console.log('成功直接加载武器模板数据');
            } else {
                throw new Error(`无法加载武器模板数据，状态码: ${xhr.status}`);
            }
        } catch (error) {
            console.error('直接加载武器模板数据失败:', error);
            console.error('%c无法加载完整的武器模板数据!', 'color: red; font-size: 24px; font-weight: bold;');
            console.error('%c请确保 src/data/weapon-templates.json 文件存在', 'color: red; font-size: 18px;');
            console.error('%c或者启动 Python 服务器: python server.py', 'color: red; font-size: 18px;');
            console.warn('将使用基本武器模板继续...');
        }

        this.emitLoadedEvent();
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
     * 创建初始武器
     */
    createInitialWeapons() {
        // 为主角创建一把初始武器
        this.createWeapon({
            name: '新手剑',
            type: 'sword',
            rarity: 'common',
            level: 1,
            attack: 10,
            hp: 50,
            skills: ['powerStrike']
        });
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
        const weaponId = data.id || `weapon_${Date.now()}`;
        const type = this.types[data.type] || this.types.sword;
        const rarity = this.rarities[data.rarity] || this.rarities.common;

        // 计算基础属性
        const baseAttack = data.attack || type.baseStats.attack;
        const baseHp = data.hp || type.baseStats.hp;

        // 应用稀有度倍率
        const attack = Math.floor(baseAttack * rarity.statMultiplier);
        const hp = Math.floor(baseHp * rarity.statMultiplier);

        // 限制技能槽位数量
        const skills = (data.skills || []).slice(0, rarity.skillSlots);

        this.weapons[weaponId] = {
            id: weaponId,
            name: data.name || '未命名武器',
            type: data.type,
            rarity: data.rarity,
            level: data.level || 1,
            maxLevel: rarity.maxLevel,
            exp: data.exp || 0,
            attack: attack,
            hp: hp,
            skills: skills,
            isEquipped: false
        };

        console.log(`创建武器: ${this.weapons[weaponId].name}`);
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
     * 升级武器
     * @param {string} weaponId - 武器ID
     * @param {number} expAmount - 经验值
     */
    upgradeWeapon(weaponId, expAmount) {
        const weapon = this.getWeapon(weaponId);
        if (!weapon) return;

        weapon.exp += expAmount;

        // 检查是否可以升级
        while (weapon.exp >= this.getNextLevelExp(weapon.level) && weapon.level < weapon.maxLevel) {
            weapon.exp -= this.getNextLevelExp(weapon.level);
            weapon.level++;

            // 每升一级增加属性
            const growthRate = 1 + (weapon.level * 0.05);
            weapon.attack = Math.floor(weapon.attack * growthRate);
            weapon.hp = Math.floor(weapon.hp * growthRate);

            console.log(`武器 ${weapon.name} 升级到 ${weapon.level} 级`);
        }
    },

    /**
     * 获取武器升级所需经验
     * @param {number} level - 当前等级
     * @returns {number} 升级所需经验
     */
    getNextLevelExp(level) {
        return Math.floor(50 * Math.pow(1.1, level - 1));
    },

    /**
     * 突破武器（提高等级上限）
     * @param {string} weaponId - 武器ID
     * @param {string} materialId - 突破材料ID
     * @param {number} materialCount - 材料数量
     * @returns {boolean} 是否突破成功
     */
    breakthroughWeapon(weaponId, materialId, materialCount) {
        const weapon = this.getWeapon(weaponId);
        if (!weapon) return false;

        // 检查是否已达到稀有度的最大等级
        const rarityData = this.rarities[weapon.rarity];
        if (weapon.maxLevel >= rarityData.maxLevel) {
            UI.showMessage('此武器已达到当前稀有度的最大等级上限');
            return false;
        }

        // 检查是否有足够的材料
        if (!Inventory.hasEnoughItems(materialId, materialCount)) {
            UI.showMessage('材料不足，无法突破');
            return false;
        }

        // 消耗材料
        Inventory.removeItem(materialId, materialCount);

        // 提高等级上限
        weapon.maxLevel += 10;
        if (weapon.maxLevel > rarityData.maxLevel) {
            weapon.maxLevel = rarityData.maxLevel;
        }

        UI.showNotification(`武器 ${weapon.name} 突破成功，等级上限提升到 ${weapon.maxLevel}`);
        return true;
    },

    /**
     * 升级武器技能
     * @param {string} weaponId - 武器ID
     * @param {number} skillIndex - 技能索引
     * @param {string} materialId - 升级材料ID
     * @param {number} materialCount - 材料数量
     * @returns {boolean} 是否升级成功
     */
    upgradeWeaponSkill(weaponId, skillIndex, materialId, materialCount) {
        const weapon = this.getWeapon(weaponId);
        if (!weapon || skillIndex >= weapon.skills.length) return false;

        // 这里简化处理，实际游戏中可能需要更复杂的技能升级系统
        // 例如技能等级、技能强化效果等

        // 检查是否有足够的材料
        if (!Inventory.hasEnoughItems(materialId, materialCount)) {
            UI.showMessage('材料不足，无法升级技能');
            return false;
        }

        // 消耗材料
        Inventory.removeItem(materialId, materialCount);

        // 这里仅作为示例，实际中可以增加技能等级或效果
        UI.showNotification(`武器 ${weapon.name} 的技能升级成功`);
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
     * 生成随机武器
     * @param {string} rarity - 稀有度
     * @returns {string} 武器ID
     */
    generateRandomWeapon(rarity = 'common') {
        // 随机选择武器类型
        const weaponTypes = Object.keys(this.types);
        const randomType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];

        // 随机选择武器名称
        const prefixes = ['锋利的', '沉重的', '闪亮的', '古老的', '神秘的', '破损的', '坚固的'];
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const typeName = this.types[randomType].name;
        const name = `${randomPrefix}${typeName}`;

        // 随机生成属性值（考虑稀有度）
        const rarityData = this.rarities[rarity] || this.rarities.common;
        const typeData = this.types[randomType];

        const baseAttack = typeData.baseStats.attack;
        const baseHp = typeData.baseStats.hp;

        // 添加一些随机波动
        const attackVariation = Math.random() * 0.2 + 0.9; // 0.9 - 1.1
        const hpVariation = Math.random() * 0.2 + 0.9; // 0.9 - 1.1

        const attack = Math.floor(baseAttack * rarityData.statMultiplier * attackVariation);
        const hp = Math.floor(baseHp * rarityData.statMultiplier * hpVariation);

        // 随机选择技能
        const availableSkills = Object.keys(this.skills);
        const skillCount = Math.min(rarityData.skillSlots, availableSkills.length);
        const skills = [];

        for (let i = 0; i < skillCount; i++) {
            const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
            if (!skills.includes(randomSkill)) {
                skills.push(randomSkill);
            }
        }

        // 创建并返回武器
        return this.createWeapon({
            name: name,
            type: randomType,
            rarity: rarity,
            level: 1,
            attack: attack,
            hp: hp,
            skills: skills
        });
    }
};