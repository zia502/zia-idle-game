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
     * 获取技能信息
     * @param {string} skillId - 技能ID
     * @returns {object|null} 技能信息
     */
    getSkillInfo(skillId) {
        // 首先尝试从JobSystem获取
        if (typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
            const skill = JobSystem.getSkill(skillId);
            if (skill) return skill;
        }

        // 然后尝试从R技能中获取
        if (window.r_skills && window.r_skills[skillId]) {
            return window.r_skills[skillId];
        }

        // 最后尝试从SR技能中获取
        if (window.sr_skills && window.sr_skills[skillId]) {
            return window.sr_skills[skillId];
        }

        return null;
    }
};

// 立即初始化
SkillLoader.init();

// 在页面加载完成后再次初始化，确保数据已加载
document.addEventListener('DOMContentLoaded', () => {
    SkillLoader.init();
});
