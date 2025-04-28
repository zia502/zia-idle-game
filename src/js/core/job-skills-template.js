/**
 * 职业技能模板系统 - 定义游戏中职业技能的模板结构
 */
const JobSkillsTemplate = {
    /**
     * 初始化技能模板系统
     */
    init() {
        console.log('初始化职业技能模板系统');
        this.loadTemplates();
    },

    /**
     * 加载技能模板数据
     */
    loadTemplates() {
        console.log('加载技能模板数据');

        // 初始化模板对象
        this.templates = {};

        // 从Python服务器获取JSON数据
        // 使用端口8000，这是我们Python服务器的默认端口
        const serverUrl = 'http://localhost:8000';
        const jsonPath = '/src/data/job-skills-templates.json';

        console.log(`从服务器加载JSON: ${serverUrl}${jsonPath}`);

        fetch(`${serverUrl}${jsonPath}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP错误! 状态: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                this.templates = data;
                console.log('技能模板数据加载成功');
                this.emitLoadedEvent();
            })
            .catch(error => {
                console.error('加载技能模板数据失败:', error);

                // 如果从服务器加载失败，尝试使用备用方法
                this.loadTemplatesFallback();
            });
    },

    /**
     * 备用方法：当服务器不可用时使用
     */
    loadTemplatesFallback() {
        console.log('使用备用方法加载技能模板数据');

        // 如果服务器不可用，提示用户启动Python服务器
        console.warn('无法从服务器加载数据。请确保Python服务器正在运行:');
        console.warn('1. 打开命令行');
        console.warn('2. 导航到项目根目录');
        console.warn('3. 运行命令: python server.py');

        // 在控制台中显示更明显的错误消息
        console.error('%c请启动Python服务器!', 'color: red; font-size: 24px; font-weight: bold;');
        console.error('%c运行: python server.py', 'color: red; font-size: 18px;');

        // 尝试创建一个最小的模板对象，包含基本技能
        this.templates = {
            // 战士技能
            "warriorSlash": {
                "name": "狂怒",
                "description": "所有参战者获得攻击力+20%,持续3回合。CD5回合",
                "type": "buff",
                "power": 1.0,
                "effectType": "buff",
                "targetType": "all_allies",
                "duration": 3,
                "effects": [{"type": "attackUp", "value": 0.2, "duration": 3}]
            },
            // 堡垒技能
            "fortressGuard": {
                "name": "佰长之护",
                "description": "无敌1次，持续3回合。攻击力降低20%。CD8回合",
                "type": "defense",
                "power": 0.5,
                "effectType": "buff",
                "targetType": "self",
                "duration": 3,
                "effects": [{"type": "invincible", "value": 1, "duration": 3}]
            },
            // 牧师技能
            "clericLight": {
                "name": "全体净化",
                "description": "所有参战者净化一个debuff,CD4回合",
                "type": "heal",
                "power": 0.1,
                "effectType": "dispel",
                "targetType": "all_allies",
                "effects": [{"type": "dispel", "count": 1}]
            }
        };

        // 显示警告，但仍然触发加载完成事件
        this.emitLoadedEvent();
    },

    /**
     * 触发技能模板加载完成事件
     */
    emitLoadedEvent() {
        if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
            Events.emit('jobSkillsTemplate:loaded');
        }
    },

    /**
     * 技能效果类型枚举
     */
    EFFECT_TYPES: {
        BUFF: 'buff',           // 增益效果
        DEBUFF: 'debuff',       // 减益效果
        DAMAGE: 'damage',       // 伤害效果
        HEAL: 'heal',           // 治疗效果
        DISPEL: 'dispel',       // 驱散效果
        SHIELD: 'shield',       // 护盾效果
        DOT: 'dot',             // 持续伤害
        HOT: 'hot'              // 持续治疗
    },

    /**
     * 技能目标类型枚举
     */
    TARGET_TYPES: {
        SELF: 'self',           // 自身
        ALLY: 'ally',           // 单个队友
        ALL_ALLIES: 'all_allies', // 所有队友
        ENEMY: 'enemy',         // 单个敌人
        ALL_ENEMIES: 'all_enemies' // 所有敌人
    },

    /**
     * 获取技能模板
     * @param {string} templateId - 模板ID
     * @returns {object|null} 技能模板
     */
    getTemplate(templateId) {
        return this.templates[templateId] || null;
    },

    /**
     * 创建技能实例
     * @param {string} templateId - 模板ID
     * @param {object} overrides - 覆盖默认属性的对象
     * @returns {object|null} 技能实例
     */
    createSkill(templateId, overrides = {}) {
        const template = this.getTemplate(templateId);
        if (!template) return null;

        // 创建技能实例
        return {
            ...template,
            ...overrides,
            id: templateId,
            cooldownRemaining: 0
        };
    }
};
