/**
 * 职业技能测试演示
 */
const SkillTest = {
    /**
     * 初始化测试环境
     */
    init() {
        console.log('职业技能测试初始化');
        this.setupTestEnvironment();
    },
    
    /**
     * 设置测试环境
     */
    setupTestEnvironment() {
        // 创建测试角色
        this.createTestCharacters();
        
        // 创建测试怪物
        this.createTestMonster();
        
        // 创建测试队伍
        this.createTestTeam();
        
        // 初始化UI
        this.setupUI();
    },
    
    /**
     * 创建测试角色
     */
    createTestCharacters() {
        // 清除现有角色
        Character.characters = {};
        
        // 创建战士角色
        Character.characters.warrior = {
            id: 'warrior',
            name: '战士',
            type: 'attack',
            attribute: 'fire',
            level: 20,
            job: {
                current: 'warrior',
                level: 20,
                history: ['novice', 'warrior'],
                jobTraits: {
                    warrior: ['berserker', 'tank', 'counterAttack']
                }
            },
            baseStats: { hp: 150, attack: 15, defense: 12, speed: 8 },
            currentStats: { 
                hp: 150, 
                maxHp: 150, 
                attack: 15, 
                defense: 12, 
                speed: 8,
                daRate: 0.15,
                taRate: 0.05
            },
            traits: ['berserker'],
            stats: { totalDamage: 0, totalHealing: 0, daCount: 0, taCount: 0, critCount: 0 },
            buffs: [],
            skillCooldowns: {}
        };
        
        // 创建堡垒角色
        Character.characters.fortress = {
            id: 'fortress',
            name: '堡垒',
            type: 'defense',
            attribute: 'earth',
            level: 20,
            job: {
                current: 'fortress',
                level: 20,
                history: ['novice', 'fortress'],
                jobTraits: {
                    fortress: ['guardian', 'tank', 'ironSkin']
                }
            },
            baseStats: { hp: 200, attack: 10, defense: 20, speed: 6 },
            currentStats: { 
                hp: 200, 
                maxHp: 200, 
                attack: 10, 
                defense: 20, 
                speed: 6,
                daRate: 0.15,
                taRate: 0.05
            },
            traits: ['guardian', 'tank'],
            stats: { totalDamage: 0, totalHealing: 0, daCount: 0, taCount: 0, critCount: 0 },
            buffs: [],
            skillCooldowns: {}
        };
        
        // 创建牧师角色
        Character.characters.cleric = {
            id: 'cleric',
            name: '牧师',
            type: 'healing',
            attribute: 'light',
            level: 20,
            job: {
                current: 'cleric',
                level: 20,
                history: ['novice', 'cleric'],
                jobTraits: {
                    cleric: ['healer', 'quickLearner', 'lifelink']
                }
            },
            baseStats: { hp: 120, attack: 8, defense: 10, speed: 12 },
            currentStats: { 
                hp: 120, 
                maxHp: 120, 
                attack: 8, 
                defense: 10, 
                speed: 12,
                daRate: 0.15,
                taRate: 0.05
            },
            traits: ['healer'],
            stats: { totalDamage: 0, totalHealing: 0, daCount: 0, taCount: 0, critCount: 0 },
            buffs: [],
            skillCooldowns: {}
        };
        
        // 创建秘法师角色
        Character.characters.arcanist = {
            id: 'arcanist',
            name: '秘法师',
            type: 'special',
            attribute: 'water',
            level: 20,
            job: {
                current: 'arcanist',
                level: 20,
                history: ['novice', 'arcanist'],
                jobTraits: {
                    arcanist: ['elementalMastery', 'magicAmplification', 'elementalBurst']
                }
            },
            baseStats: { hp: 100, attack: 18, defense: 8, speed: 14 },
            currentStats: { 
                hp: 100, 
                maxHp: 100, 
                attack: 18, 
                defense: 8, 
                speed: 14,
                daRate: 0.15,
                taRate: 0.05
            },
            traits: ['elementalMastery'],
            stats: { totalDamage: 0, totalHealing: 0, daCount: 0, taCount: 0, critCount: 0 },
            buffs: [],
            skillCooldowns: {}
        };
        
        // 创建魔剑士角色
        Character.characters.spellblade = {
            id: 'spellblade',
            name: '魔剑士',
            type: 'attack',
            attribute: 'dark',
            level: 20,
            job: {
                current: 'spellblade',
                level: 20,
                history: ['novice', 'spellblade'],
                jobTraits: {
                    spellblade: ['elementalMastery', 'criticalStrike', 'assassin']
                }
            },
            baseStats: { hp: 130, attack: 16, defense: 10, speed: 12 },
            currentStats: { 
                hp: 130, 
                maxHp: 130, 
                attack: 16, 
                defense: 10, 
                speed: 12,
                daRate: 0.15,
                taRate: 0.05
            },
            traits: ['elementalMastery', 'criticalStrike'],
            stats: { totalDamage: 0, totalHealing: 0, daCount: 0, taCount: 0, critCount: 0 },
            buffs: [],
            skillCooldowns: {}
        };
        
        // 创建射手角色
        Character.characters.archer = {
            id: 'archer',
            name: '射手',
            type: 'attack',
            attribute: 'wind',
            level: 20,
            job: {
                current: 'archer',
                level: 20,
                history: ['novice', 'archer'],
                jobTraits: {
                    archer: ['criticalStrike', 'quickLearner', 'assassin']
                }
            },
            baseStats: { hp: 110, attack: 17, defense: 7, speed: 16 },
            currentStats: { 
                hp: 110, 
                maxHp: 110, 
                attack: 17, 
                defense: 7, 
                speed: 16,
                daRate: 0.15,
                taRate: 0.05
            },
            traits: ['criticalStrike'],
            stats: { totalDamage: 0, totalHealing: 0, daCount: 0, taCount: 0, critCount: 0 },
            buffs: [],
            skillCooldowns: {}
        };
    },
    
    /**
     * 创建测试怪物
     */
    createTestMonster() {
        this.testMonster = {
            id: 'test_monster',
            name: '测试怪物',
            type: 'attack',
            attribute: 'fire',
            level: 20,
            baseStats: { hp: 5000, attack: 20, defense: 15, speed: 10 },
            currentStats: { 
                hp: 5000, 
                maxHp: 5000, 
                attack: 20, 
                defense: 15, 
                speed: 10,
                daRate: 0.1,
                taRate: 0.03
            },
            traits: [],
            stats: { totalDamage: 0, totalHealing: 0 },
            buffs: [],
            goldReward: { min: 100, max: 200 },
            xpReward: 500
        };
    },
    
    /**
     * 创建测试队伍
     */
    createTestTeam() {
        this.testTeam = [
            Character.characters.warrior,
            Character.characters.fortress,
            Character.characters.cleric,
            Character.characters.arcanist
        ];
    },
    
    /**
     * 设置UI
     */
    setupUI() {
        // 清空测试容器
        const container = document.getElementById('skill-test-container');
        if (!container) {
            console.error('找不到技能测试容器');
            return;
        }
        
        container.innerHTML = '';
        
        // 创建角色选择区域
        const characterSelection = document.createElement('div');
        characterSelection.className = 'character-selection';
        characterSelection.innerHTML = '<h3>选择角色</h3>';
        
        // 添加角色选择按钮
        for (const charId in Character.characters) {
            const character = Character.characters[charId];
            const button = document.createElement('button');
            button.className = 'character-button';
            button.textContent = `${character.name} (${JobSystem.getJob(character.job.current).name})`;
            button.dataset.characterId = charId;
            button.addEventListener('click', () => this.selectCharacter(charId));
            characterSelection.appendChild(button);
        }
        
        // 创建技能区域
        const skillArea = document.createElement('div');
        skillArea.className = 'skill-area';
        skillArea.innerHTML = '<h3>职业技能</h3><div id="skill-buttons"></div>';
        
        // 创建怪物状态区域
        const monsterStatus = document.createElement('div');
        monsterStatus.className = 'monster-status';
        monsterStatus.innerHTML = `
            <h3>怪物状态</h3>
            <div id="monster-hp">HP: ${this.testMonster.currentStats.hp}/${this.testMonster.currentStats.maxHp}</div>
            <div id="monster-buffs">BUFF: 无</div>
        `;
        
        // 创建战斗日志区域
        const battleLog = document.createElement('div');
        battleLog.className = 'battle-log';
        battleLog.innerHTML = '<h3>战斗日志</h3><div id="log-content"></div>';
        
        // 添加重置按钮
        const resetButton = document.createElement('button');
        resetButton.className = 'reset-button';
        resetButton.textContent = '重置测试';
        resetButton.addEventListener('click', () => this.resetTest());
        
        // 添加所有元素到容器
        container.appendChild(characterSelection);
        container.appendChild(skillArea);
        container.appendChild(monsterStatus);
        container.appendChild(battleLog);
        container.appendChild(resetButton);
        
        // 默认选择第一个角色
        this.selectCharacter(Object.keys(Character.characters)[0]);
    },
    
    /**
     * 选择角色
     * @param {string} characterId - 角色ID
     */
    selectCharacter(characterId) {
        this.selectedCharacterId = characterId;
        const character = Character.characters[characterId];
        
        // 更新技能按钮
        const skillButtons = document.getElementById('skill-buttons');
        skillButtons.innerHTML = '';
        
        // 获取职业信息
        const job = JobSystem.getJob(character.job.current);
        
        // 添加固定技能按钮
        if (job && job.fixedSkill) {
            const skill = JobSystem.getSkill(job.fixedSkill);
            const button = document.createElement('button');
            button.className = 'skill-button';
            button.textContent = `${skill.name} - ${skill.description}`;
            button.dataset.skillId = job.fixedSkill;
            
            // 检查技能是否在冷却中
            if (character.skillCooldowns && character.skillCooldowns[job.fixedSkill] > 0) {
                button.disabled = true;
                button.textContent += ` (冷却中: ${character.skillCooldowns[job.fixedSkill]}回合)`;
            }
            
            button.addEventListener('click', () => this.useSkill(job.fixedSkill));
            skillButtons.appendChild(button);
        }
        
        // 高亮选中的角色按钮
        const characterButtons = document.querySelectorAll('.character-button');
        characterButtons.forEach(btn => {
            if (btn.dataset.characterId === characterId) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    },
    
    /**
     * 使用技能
     * @param {string} skillId - 技能ID
     */
    useSkill(skillId) {
        const character = Character.characters[this.selectedCharacterId];
        if (!character) return;
        
        // 使用技能
        const result = JobSkills.useSkill(character.id, skillId, this.testTeam, this.testMonster);
        
        // 记录日志
        this.logMessage(result.message);
        
        // 更新怪物状态
        this.updateMonsterStatus();
        
        // 更新技能冷却
        this.updateSkillButtons();
    },
    
    /**
     * 更新怪物状态
     */
    updateMonsterStatus() {
        const monsterHp = document.getElementById('monster-hp');
        monsterHp.textContent = `HP: ${this.testMonster.currentStats.hp}/${this.testMonster.currentStats.maxHp}`;
        
        const monsterBuffs = document.getElementById('monster-buffs');
        if (this.testMonster.buffs && this.testMonster.buffs.length > 0) {
            const buffText = this.testMonster.buffs.map(buff => 
                `${buff.name} (${buff.value}x, ${buff.duration}回合)`
            ).join(', ');
            monsterBuffs.textContent = `BUFF: ${buffText}`;
        } else {
            monsterBuffs.textContent = 'BUFF: 无';
        }
        
        // 检查怪物是否被击败
        if (this.testMonster.currentStats.hp <= 0) {
            this.logMessage(`${this.testMonster.name} 被击败了！`);
            this.resetMonster();
        }
    },
    
    /**
     * 更新技能按钮
     */
    updateSkillButtons() {
        const character = Character.characters[this.selectedCharacterId];
        if (!character) return;
        
        // 获取职业信息
        const job = JobSystem.getJob(character.job.current);
        
        // 更新固定技能按钮
        if (job && job.fixedSkill) {
            const skillButton = document.querySelector(`.skill-button[data-skill-id="${job.fixedSkill}"]`);
            if (skillButton) {
                const skill = JobSystem.getSkill(job.fixedSkill);
                
                // 检查技能是否在冷却中
                if (character.skillCooldowns && character.skillCooldowns[job.fixedSkill] > 0) {
                    skillButton.disabled = true;
                    skillButton.textContent = `${skill.name} - ${skill.description} (冷却中: ${character.skillCooldowns[job.fixedSkill]}回合)`;
                } else {
                    skillButton.disabled = false;
                    skillButton.textContent = `${skill.name} - ${skill.description}`;
                }
            }
        }
    },
    
    /**
     * 记录日志消息
     * @param {string} message - 日志消息
     */
    logMessage(message) {
        const logContent = document.getElementById('log-content');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = message;
        logContent.appendChild(logEntry);
        
        // 滚动到底部
        logContent.scrollTop = logContent.scrollHeight;
    },
    
    /**
     * 重置怪物
     */
    resetMonster() {
        this.testMonster.currentStats.hp = this.testMonster.currentStats.maxHp;
        this.testMonster.buffs = [];
        this.updateMonsterStatus();
        this.logMessage(`${this.testMonster.name} 已重置。`);
    },
    
    /**
     * 重置测试
     */
    resetTest() {
        // 重置角色
        this.setupTestEnvironment();
        
        // 清空日志
        const logContent = document.getElementById('log-content');
        logContent.innerHTML = '';
        
        this.logMessage('测试环境已重置。');
    },
    
    /**
     * 减少所有角色的技能冷却时间
     */
    reduceCooldowns() {
        for (const charId in Character.characters) {
            const character = Character.characters[charId];
            if (character.skillCooldowns) {
                for (const skillId in character.skillCooldowns) {
                    if (character.skillCooldowns[skillId] > 0) {
                        character.skillCooldowns[skillId]--;
                    }
                }
            }
        }
        
        // 更新技能按钮
        this.updateSkillButtons();
        this.logMessage('所有技能冷却时间减少1回合。');
    }
};
