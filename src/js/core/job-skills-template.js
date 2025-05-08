/**
 * 职业技能模板系统 - 定义游戏中职业技能的模板结构
 */
const JobSkillsTemplate = {
    // 初始化模板对象
    templates: {},

    /**
     * 初始化技能模板系统
     */
    init() {
        console.log('初始化职业技能模板系统');

        // 先加载基本技能模板，确保templates不为空 - Removed as per user request
        // this.loadBasicTemplates();

        // 直接尝试加载完整的技能模板
        this.loadTemplates();
    },

    /**
     * 加载技能模板数据
     */
    loadTemplates() {
        console.log('加载技能模板数据');

        // 保存当前的基本技能模板
        const basicTemplates = { ...this.templates };

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
                // 合并新加载的技能模板与已有的基本技能模板
                this.templates = { ...basicTemplates, ...data };
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
        console.warn('无法从服务器加载数据。正在尝试直接加载所有技能模板...');

        try {
            // 直接从 job-skills-templates.json 文件加载所有技能
            // 注意：这是一个同步操作，在实际生产环境中可能需要异步处理
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'src/data/job-skills-templates.json', false); // 同步请求
            xhr.send(null);

            if (xhr.status === 200) {
                // 合并新加载的技能模板与已有的基本技能模板
                const loadedTemplates = JSON.parse(xhr.responseText);

                // 保存当前的基本技能模板
                const basicTemplates = { ...this.templates };

                // 更新模板，优先使用加载的模板
                this.templates = { ...basicTemplates, ...loadedTemplates };

                console.log('成功直接加载技能模板数据');
            } else {
                throw new Error(`无法加载技能模板数据，状态码: ${xhr.status}`);
            }
        } catch (error) {
            console.error('直接加载技能模板数据失败:', error);

            // 如果直接加载也失败，显示更明显的错误消息
            console.error('%c无法加载完整的技能模板数据!', 'color: red; font-size: 24px; font-weight: bold;');
            console.error('%c请确保 src/data/job-skills-templates.json 文件存在', 'color: red; font-size: 18px;');
            console.error('%c或者启动 Python 服务器: python server.py', 'color: red; font-size: 18px;');
            console.warn('将使用基本技能模板继续...');

            // 不需要重新设置 this.templates，因为我们已经在 loadBasicTemplates 中设置了基本技能
        }

        // 触发加载完成事件
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
