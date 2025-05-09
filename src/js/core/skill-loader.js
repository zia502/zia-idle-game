/**
 * 技能加载器 - 负责加载R和SR角色技能
 */
const SkillLoader = {
    /**
     * 初始化技能加载器
     */
    init() {
        console.log('技能加载器初始化');
        this.loadRSkills();
        this.loadSRSkills();
        this.loadSSRSkills(); // 添加 SSR 技能加载
        this.loadBossSkills(); // 添加 Boss 技能加载
    },

    /**
     * 加载R角色技能
     */
    loadRSkills() {
        fetch('src/data/r_skills.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('R角色技能加载成功:', Object.keys(data).length);
                window.r_skills = data;
            })
            .catch(error => {
                console.error('加载R角色技能失败:', error);
            });
    },

    /**
     * 加载SR角色技能
     */
    loadSRSkills() {
        fetch('src/data/sr_skills.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('SR角色技能加载成功:', Object.keys(data).length);
                window.sr_skills = data;
            })
            .catch(error => {
                console.error('加载SR角色技能失败:', error);
            });
    },

    /**
     * 加载SSR角色技能
     */
    loadSSRSkills() {
        fetch('src/data/ssr_skill.json') // 注意文件名可能是 ssr_skills.json 或 ssr_skill.json
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
            });
    },

    /**
     * 加载Boss技能
     */
    loadBossSkills() {
        fetch('src/data/boss-skills.json')
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
                }
            })
            .catch(error => {
                console.error('加载Boss技能失败:', error);
                window.bossSkills = {}; // 初始化为空对象以避免后续错误
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

// 立即初始化
SkillLoader.init();

// 在页面加载完成后再次初始化，确保数据已加载
// DOMContentLoaded 可能在 fetch 完成前触发，所以 init 多次调用是合理的，
// 但要注意 fetch 可能被多次调用。理想情况下，应有加载状态防止重复 fetch。
// 为简单起见，暂时保留现有逻辑。
document.addEventListener('DOMContentLoaded', () => {
    SkillLoader.init();
});
