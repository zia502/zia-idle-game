/**
 * 技能加载器 - 负责加载R和SR角色技能
 */
let fs, path;
// More reliable check for Node.js environment
const isNodeEnvironment = typeof process !== 'undefined' && process.versions && process.versions.node;

if (isNodeEnvironment) {
    try {
        fs = require('fs');
        path = require('path');
    } catch (e) {
        console.error("SkillLoader: Failed to require 'fs' or 'path' in Node.js environment.", e);
        // fs and path will remain undefined, subsequent checks will handle this.
    }
}

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
        const filePath = 'src/data/r_skills.json';
        const skillKey = 'r_skills';
        const targetGlobal = typeof window !== 'undefined' ? window : global;

        if (isNodeEnvironment && fs && path) { // Node.js environment
            try {
                const absolutePath = path.resolve(filePath);
                const fileContent = fs.readFileSync(absolutePath, 'utf-8');
                const data = JSON.parse(fileContent);
                console.log(`R角色技能加载成功 (Node ${filePath}):`, Object.keys(data).length);
                targetGlobal[skillKey] = data;
            } catch (error) {
                console.error(`加载R角色技能失败 (Node ${filePath}):`, error);
                targetGlobal[skillKey] = {}; // Initialize to prevent errors
            }
        } else if (!isNodeEnvironment && typeof fetch === 'function') { // Browser environment with fetch
            (async () => {
                try {
                    const response = await fetch(filePath);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status} for ${filePath}`);
                    }
                    const data = await response.json();
                    console.log(`R角色技能加载成功 (fetch async ${filePath}):`, Object.keys(data).length);
                    targetGlobal[skillKey] = data;
                } catch (error) {
                    console.error(`加载R角色技能失败 (fetch async ${filePath}):`, error);
                    targetGlobal[skillKey] = {}; // Initialize to prevent errors
                }
            })();
        } else {
            console.error(`SkillLoader: Cannot load ${filePath}. Environment not supported or fs/path/fetch missing.`);
            targetGlobal[skillKey] = {}; // Initialize to prevent errors
        }
    },

    /**
     * 加载SR角色技能
     */
    loadSRSkills() {
        const filePath = 'src/data/sr_skills.json';
        const skillKey = 'sr_skills';
        const targetGlobal = typeof window !== 'undefined' ? window : global;

        if (isNodeEnvironment && fs && path) { // Node.js environment
            try {
                const absolutePath = path.resolve(filePath);
                const fileContent = fs.readFileSync(absolutePath, 'utf-8');
                const data = JSON.parse(fileContent);
                console.log(`SR角色技能加载成功 (Node ${filePath}):`, Object.keys(data).length);
                targetGlobal[skillKey] = data;
            } catch (error) {
                console.error(`加载SR角色技能失败 (Node ${filePath}):`, error);
                targetGlobal[skillKey] = {}; // Initialize to prevent errors
            }
        } else if (!isNodeEnvironment && typeof fetch === 'function') { // Browser environment with fetch
            (async () => {
                try {
                    const response = await fetch(filePath);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status} for ${filePath}`);
                    }
                    const data = await response.json();
                    console.log(`SR角色技能加载成功 (fetch async ${filePath}):`, Object.keys(data).length);
                    targetGlobal[skillKey] = data;
                } catch (error) {
                    console.error(`加载SR角色技能失败 (fetch async ${filePath}):`, error);
                    targetGlobal[skillKey] = {}; // Initialize to prevent errors
                }
            })();
        } else {
            console.error(`SkillLoader: Cannot load ${filePath}. Environment not supported or fs/path/fetch missing.`);
            targetGlobal[skillKey] = {}; // Initialize to prevent errors
        }
    },

    /**
     * 加载SSR角色技能
     */
    loadSSRSkills() {
        const filePath = 'src/data/ssr_skill.json'; // 注意文件名可能是 ssr_skills.json 或 ssr_skill.json
        const skillKey = 'ssr_skills';
        const targetGlobal = typeof window !== 'undefined' ? window : global;

        if (isNodeEnvironment && fs && path) { // Node.js environment
            try {
                const absolutePath = path.resolve(filePath);
                const fileContent = fs.readFileSync(absolutePath, 'utf-8');
                const data = JSON.parse(fileContent);
                console.log(`SSR角色技能加载成功 (Node ${filePath}):`, Object.keys(data).length);
                targetGlobal[skillKey] = data; // 存储到 global.ssr_skills 或 window.ssr_skills
            } catch (error) {
                console.error(`加载SSR角色技能失败 (Node ${filePath}):`, error);
                targetGlobal[skillKey] = {}; // Initialize to prevent errors
            }
        } else if (!isNodeEnvironment && typeof fetch === 'function') { // Browser environment with fetch
            (async () => {
                try {
                    const response = await fetch(filePath);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status} for ${filePath}`);
                    }
                    const data = await response.json();
                    console.log(`SSR角色技能加载成功 (fetch async ${filePath}):`, Object.keys(data).length);
                    targetGlobal[skillKey] = data; // 存储到 window.ssr_skills
                } catch (error) {
                    console.error(`加载SSR角色技能失败 (fetch async ${filePath}):`, error);
                    targetGlobal[skillKey] = {}; // Initialize to prevent errors
                }
            })();
        } else {
            console.error(`SkillLoader: Cannot load ${filePath}. Environment not supported or fs/path/fetch missing.`);
            targetGlobal[skillKey] = {}; // Initialize to prevent errors
        }
    },

    /**
     * 加载Boss技能
     */
    loadBossSkills() {
        const filePath = 'src/data/boss-skills.json';
        const skillKey = 'bossSkills';
        const targetGlobal = typeof window !== 'undefined' ? window : global;

        if (isNodeEnvironment && fs && path) { // Node.js environment
            try {
                const absolutePath = path.resolve(filePath);
                const fileContent = fs.readFileSync(absolutePath, 'utf-8');
                const data = JSON.parse(fileContent);
                if (data && data.bossSkills) {
                    console.log(`Boss技能加载成功 (Node ${filePath}):`, Object.keys(data.bossSkills).length);
                    targetGlobal[skillKey] = data.bossSkills;
                } else {
                    console.error(`加载Boss技能失败 (Node ${filePath}): ${filePath} 格式不正确，缺少 bossSkills 顶层对象。`);
                    targetGlobal[skillKey] = {};
                }
            } catch (error) {
                console.error(`加载Boss技能失败 (Node ${filePath}):`, error);
                targetGlobal[skillKey] = {};
            }
        } else if (!isNodeEnvironment && typeof fetch === 'function') { // Browser environment with fetch
            (async () => {
                try {
                    const response = await fetch(filePath);
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status} for ${filePath}`);
                    }
                    const data = await response.json();
                    if (data && data.bossSkills) {
                        console.log(`Boss技能加载成功 (fetch async ${filePath}):`, Object.keys(data.bossSkills).length);
                        targetGlobal[skillKey] = data.bossSkills;
                    } else {
                        console.error(`加载Boss技能失败 (fetch async ${filePath}): ${filePath} 格式不正确，缺少 bossSkills 顶层对象。`);
                        targetGlobal[skillKey] = {};
                    }
                } catch (error) {
                    console.error(`加载Boss技能失败 (fetch async ${filePath}):`, error);
                    targetGlobal[skillKey] = {};
                }
            })();
        } else {
            console.error(`SkillLoader: Cannot load ${filePath}. Environment not supported or fs/path/fetch missing.`);
            targetGlobal[skillKey] = {}; // Initialize to prevent errors
        }
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
