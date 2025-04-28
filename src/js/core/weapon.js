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
            baseStats: { attack: 10, hp: 50 },
            compatibleTypes: ['attack', 'defense']
        },
        axe: { 
            name: '斧', 
            description: '重型武器，提供高攻击但速度较慢',
            baseStats: { attack: 15, hp: 30 },
            compatibleTypes: ['attack']
        },
        staff: { 
            name: '法杖', 
            description: '魔法武器，提供特殊效果和能力',
            baseStats: { attack: 8, hp: 40 },
            compatibleTypes: ['special', 'healing']
        },
        bow: { 
            name: '弓', 
            description: '远程武器，提供中等攻击和速度',
            baseStats: { attack: 12, hp: 25 },
            compatibleTypes: ['attack', 'special']
        },
        shield: { 
            name: '盾', 
            description: '防御武器，提供高生命值',
            baseStats: { attack: 5, hp: 100 },
            compatibleTypes: ['defense']
        },
        book: { 
            name: '魔导书', 
            description: '知识武器，提供特殊技能和效果',
            baseStats: { attack: 7, hp: 45 },
            compatibleTypes: ['special', 'healing']
        }
    },
    
    // 武器技能定义
    skills: {
        // 攻击技能
        powerStrike: {
            name: '强力一击',
            description: '增加20%攻击力',
            type: 'passive',
            effect: (stats) => {
                stats.attack *= 1.2;
                return stats;
            }
        },
        criticalHit: {
            name: '暴击',
            description: '有15%几率造成双倍伤害',
            type: 'passive',
            effect: (damage) => {
                if (Math.random() < 0.15) {
                    return damage * 2;
                }
                return damage;
            }
        },
        
        // 防御技能
        toughness: {
            name: '坚韧',
            description: '增加30%生命值',
            type: 'passive',
            effect: (stats) => {
                stats.hp *= 1.3;
                return stats;
            }
        },
        shield: {
            name: '护盾',
            description: '受到伤害时有20%几率减少50%伤害',
            type: 'passive',
            effect: (damage) => {
                if (Math.random() < 0.2) {
                    return damage * 0.5;
                }
                return damage;
            }
        },
        
        // 属性技能
        fireEnhance: {
            name: '火属性强化',
            description: '对风属性敌人伤害增加30%',
            type: 'passive',
            effect: (damage, attacker, target) => {
                if (attacker.attribute === 'fire' && target.attribute === 'wind') {
                    return damage * 1.3;
                }
                return damage;
            }
        },
        waterEnhance: {
            name: '水属性强化',
            description: '对火属性敌人伤害增加30%',
            type: 'passive',
            effect: (damage, attacker, target) => {
                if (attacker.attribute === 'water' && target.attribute === 'fire') {
                    return damage * 1.3;
                }
                return damage;
            }
        }
    },
    
    // 武器稀有度定义
    rarities: {
        common: {
            name: '普通',
            color: '#9e9e9e',
            statMultiplier: 1.0,
            maxLevel: 20,
            skillSlots: 1
        },
        uncommon: {
            name: '优秀',
            color: '#4caf50',
            statMultiplier: 1.2,
            maxLevel: 30,
            skillSlots: 2
        },
        rare: {
            name: '稀有',
            color: '#2196f3',
            statMultiplier: 1.5,
            maxLevel: 40,
            skillSlots: 2
        },
        epic: {
            name: '史诗',
            color: '#9c27b0',
            statMultiplier: 1.8,
            maxLevel: 50,
            skillSlots: 3
        },
        legendary: {
            name: '传说',
            color: '#ff9800',
            statMultiplier: 2.2,
            maxLevel: 60,
            skillSlots: 3
        }
    },
    
    /**
     * 初始化武器系统
     */
    init() {
        console.log('武器系统已初始化');
        
        // 创建一些初始武器
        this.createInitialWeapons();
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
        
        this.weaponBoards[boardId] = {
            id: boardId,
            slots: Array(size).fill(null),
            size: size
        };
        
        console.log(`创建武器盘: ${boardId}`);
        return this.weaponBoards[boardId];
    },
    
    /**
     * 将武器添加到武器盘
     * @param {string} boardId - 武器盘ID
     * @param {string} weaponId - 武器ID
     * @param {number} slotIndex - 槽位索引
     * @returns {boolean} 是否添加成功
     */
    addWeaponToBoard(boardId, weaponId, slotIndex) {
        const board = this.getWeaponBoard(boardId);
        const weapon = this.getWeapon(weaponId);
        
        if (!board || !weapon) return false;
        
        // 检查槽位索引是否有效
        if (slotIndex < 0 || slotIndex >= board.size) {
            return false;
        }
        
        // 检查是否已装备在其他武器盘
        if (weapon.isEquipped) {
            // 先从其他武器盘移除
            this.removeWeaponFromAllBoards(weaponId);
        }
        
        // 添加到指定槽位
        board.slots[slotIndex] = weaponId;
        weapon.isEquipped = true;
        
        console.log(`将武器 ${weapon.name} 添加到武器盘 ${boardId} 的槽位 ${slotIndex}`);
        return true;
    },
    
    /**
     * 从武器盘移除武器
     * @param {string} boardId - 武器盘ID
     * @param {number} slotIndex - 槽位索引
     * @returns {string|null} 移除的武器ID
     */
    removeWeaponFromBoard(boardId, slotIndex) {
        const board = this.getWeaponBoard(boardId);
        if (!board) return null;
        
        // 检查槽位索引是否有效
        if (slotIndex < 0 || slotIndex >= board.size) {
            return null;
        }
        
        const weaponId = board.slots[slotIndex];
        if (!weaponId) return null;
        
        // 更新武器状态
        const weapon = this.getWeapon(weaponId);
        if (weapon) {
            weapon.isEquipped = false;
        }
        
        // 移除槽位中的武器
        board.slots[slotIndex] = null;
        
        console.log(`从武器盘 ${boardId} 的槽位 ${slotIndex} 移除武器 ${weaponId}`);
        return weaponId;
    },
    
    /**
     * 从所有武器盘移除指定武器
     * @param {string} weaponId - 武器ID
     */
    removeWeaponFromAllBoards(weaponId) {
        for (const boardId in this.weaponBoards) {
            const board = this.weaponBoards[boardId];
            
            for (let i = 0; i < board.slots.length; i++) {
                if (board.slots[i] === weaponId) {
                    this.removeWeaponFromBoard(boardId, i);
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
        for (const weaponId of board.slots) {
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