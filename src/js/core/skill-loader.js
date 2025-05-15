/**
 * 技能加载器 - 负责加载R和SR角色技能
 */
const SkillLoader = {
    loadingPromise: null,
    isInitialized: false,

    /**
     * 初始化技能加载器
     * @returns {Promise} 当所有技能加载完成时解析的 Promise
     */
    init() {
        if (this.isInitialized && this.loadingPromise) {
            console.log('技能加载器已初始化，返回现有 Promise');
            return this.loadingPromise;
        }
        this.isInitialized = true;
        console.log('技能加载器初始化');

        this.loadingPromise = Promise.all([
            this.loadRSkills(),
            this.loadSRSkills(),
            this.loadSSRSkills(),
            this.loadBossSkills()
        ]).then(() => {
            console.log('所有技能数据加载完成');
            if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
                Events.emit('skillLoader:ready'); // 发射技能加载完成事件
            }
        }).catch(error => {
            console.error('一个或多个技能文件加载失败:', error);
            // 即使部分失败，也尝试继续，但标记错误
            if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
                Events.emit('skillLoader:error', error);
            }
            return Promise.reject(error); // 将错误传递下去
        });
        return this.loadingPromise;
    },

    /**
     * 加载R角色技能
     * @returns {Promise}
     */
    loadRSkills() {
        return fetch('src/data/r_skills.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status} for r_skills.json`);
                }
                return response.json();
            })
            .then(data => {
                console.log('R角色技能加载成功:', Object.keys(data).length);
                window.r_skills = data;
            })
            .catch(error => {
                console.error('加载R角色技能失败:', error);
                window.r_skills = {}; // 确保即使失败也有定义
                throw error; // 重新抛出错误以被 Promise.all 捕获
            });
    },

    /**
     * 加载SR角色技能
     * @returns {Promise}
     */
    loadSRSkills() {
        return fetch('src/data/sr_skills.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status} for sr_skills.json`);
                }
                return response.json();
            })
            .then(data => {
                console.log('SR角色技能加载成功:', Object.keys(data).length);
                window.sr_skills = data;
            })
            .catch(error => {
                console.error('加载SR角色技能失败:', error);
                window.sr_skills = {}; // 确保即使失败也有定义
                throw error; // 重新抛出错误以被 Promise.all 捕获
            });
    },

    /**
     * 加载SSR角色技能
     * @returns {Promise}
     */
    loadSSRSkills() {
        return fetch('src/data/ssr_skill.json') // 注意文件名可能是 ssr_skills.json 或 ssr_skill.json
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status} for ssr_skill.json`);
                }
                return response.json();
            })
            .then(data => {
                console.log('SSR角色技能加载成功:', Object.keys(data).length);
                window.ssr_skills = data; // 存储到 window.ssr_skills
            })
            .catch(error => {
                console.error('加载SSR角色技能失败:', error);
                window.ssr_skills = {}; // 确保即使失败也有定义
                throw error; // 重新抛出错误以被 Promise.all 捕获
            });
    },

    /**
     * 加载Boss技能
     * @returns {Promise}
     */
    loadBossSkills() {
        return fetch('src/data/boss-skills.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status} for boss-skills.json`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.bossSkills) {
                    console.log('Boss技能加载成功:', Object.keys(data.bossSkills).length);
                    window.bossSkills = data.bossSkills; // 存储到 window.bossSkills
                } else {
                    console.error('加载Boss技能失败: boss-skills.json 格式不正确，缺少 bossSkills 顶层对象。');
                    window.bossSkills = {}; // 初始化为空对象以避免后续错误
                    // 不再抛出错误，允许其他技能加载继续
                }
            })
            .catch(error => {
                console.error('加载Boss技能失败:', error);
                window.bossSkills = {}; // 初始化为空对象以避免后续错误
                // 不再抛出错误，允许其他技能加载继续
            });
    },

    /**
     * 获取技能信息
     * @param {string} skillId - 技能ID
     * @returns {object|null} 技能信息
     */
    getSkillInfo(skillId) {
        // 1. 尝试从 JobSkillsTemplate (通用职业技能模板)
        if (typeof JobSkillsTemplate !== 'undefined' && JobSkillsTemplate.templates && JobSkillsTemplate.templates[skillId]) {
            return JobSkillsTemplate.templates[skillId];
        }

        // 2. 尝试从 RSkillsTemplate (R卡角色特有技能模板, 如果存在)
        if (typeof RSkillsTemplate !== 'undefined' && RSkillsTemplate.templates && RSkillsTemplate.templates[skillId]) {
            return RSkillsTemplate.templates[skillId];
        }

        // 3. 尝试从 SRSkillsTemplate (SR卡角色特有技能模板, 如果存在)
        if (typeof SRSkillsTemplate !== 'undefined' && SRSkillsTemplate.templates && SRSkillsTemplate.templates[skillId]) {
            return SRSkillsTemplate.templates[skillId];
        }

        // 4. 尝试从 window.bossSkills (Boss技能数据) - 调整优先级，Boss技能可能更特定
        if (window.bossSkills && window.bossSkills[skillId]) {
            return window.bossSkills[skillId];
        }

        // 5. 尝试从 window.ssr_skills (SSR技能数据)
        if (window.ssr_skills && window.ssr_skills[skillId]) {
            return window.ssr_skills[skillId];
        }

        // 6. 尝试从 window.sr_skills (SR技能数据)
        if (window.sr_skills && window.sr_skills[skillId]) {
            return window.sr_skills[skillId];
        }

        // 7. 尝试从 window.r_skills (R技能数据)
        if (window.r_skills && window.r_skills[skillId]) {
            return window.r_skills[skillId];
        }
        
        console.warn(`SkillLoader.getSkillInfo: 找不到技能 ${skillId} 在任何已知数据源中。`);
        return null;
    }
};

// 初始化不再在此处自动调用，将由主应用逻辑控制
// SkillLoader.init();

// document.addEventListener('DOMContentLoaded', () => {
//     SkillLoader.init(); // 这个也移除，由主逻辑控制
// });
