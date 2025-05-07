/**
 * 酒馆招募模块 - 负责处理酒馆招募界面
 */
(function() {
    // 确保UI对象存在
    if (typeof UI === 'undefined') {
        console.error('UI模块未加载');
        return;
    }

    // 招募价格
    const SINGLE_RECRUIT_COST = 2000; // 单抽价格
    const MULTI_RECRUIT_COST = 9000;  // 五连抽价格
    const MULTI_RECRUIT_COUNT = 5;    // 五连抽数量
    const SR_RECRUIT_COST = 10000;    // 必得SR抽卡价格
    const SSR_RECRUIT_COST = 20000;   // 必得SSR抽卡价格

    // 当前招募结果
    let currentRecruitResults = [];

    /**
     * 初始化酒馆招募界面
     */
    function initTavernScreen() {
        // 添加事件监听器
        document.addEventListener('click', function(event) {
            // 单抽按钮点击
            if (event.target.id === 'recruit-one-btn') {
                recruitCharacters(1);
            }

            // 五连抽按钮点击
            if (event.target.id === 'recruit-five-btn') {
                recruitCharacters(MULTI_RECRUIT_COUNT);
            }

            // 必得SR抽卡按钮点击
            if (event.target.id === 'recruit-sr-btn') {
                recruitSRCharacter();
            }

            // 必得SSR抽卡按钮点击
            if (event.target.id === 'recruit-ssr-btn') {
                recruitSSRCharacter();
            }

            // 关闭结果按钮点击
            if (event.target.id === 'close-result-btn') {
                hideRecruitResult();
            }
        });

        // 监听屏幕切换事件
        document.addEventListener('screenChanged', function(event) {
            if (event.detail.screen === 'tavern-screen') {
                refreshTavernScreen();
            }
        });
    }

    /**
     * 刷新酒馆招募界面
     */
    function refreshTavernScreen() {
        console.log('刷新酒馆招募界面');

        // 隐藏招募结果
        hideRecruitResult();

        // 渲染已招募角色
        renderRecruitedCharacters();

        // 更新金币显示
        updateGoldDisplay();
    }

    /**
     * 招募角色
     * @param {number} count - 招募数量
     */
    function recruitCharacters(count) {
        console.log(`招募${count}个角色`);

        // 计算招募价格
        const cost = count === 1 ? SINGLE_RECRUIT_COST : MULTI_RECRUIT_COST;

        // 检查金币是否足够
        if (typeof Game === 'undefined' || !Game.hasEnoughGold(cost)) {
            UI.showMessage('金币不足，无法招募角色');
            return;
        }

        // 扣除金币
        if (Game.removeGold(cost)) {
            // 生成随机角色
            if (typeof Character !== 'undefined' && typeof Character.generateRandomRecruitables === 'function') {
                currentRecruitResults = Character.generateRandomRecruitables(count);

                // 添加角色到游戏
                currentRecruitResults.forEach(character => {
                    if (typeof Character !== 'undefined' && typeof Character.addCharacter === 'function') {
                        const newCharacterId = Character.addCharacter(character);
                        console.log(`添加角色: ${character.name} ( ${character.rarity})`);
                    }
                });

                // 显示招募结果
                showRecruitResult();

                // 更新金币显示
                updateGoldDisplay();

                // 保存游戏状态
                if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                    console.log('保存游戏状态');
                    Game.saveGame();
                }
            } else {
                console.error('Character模块未定义或没有generateRandomRecruitables方法');
                UI.showMessage('招募系统出现错误，请稍后再试');
            }
        } else {
            UI.showMessage('金币不足，无法招募角色');
        }
    }

    /**
     * 招募必得SR角色
     */
    function recruitSRCharacter() {
        console.log('招募必得SR角色');

        // 检查金币是否足够
        if (typeof Game === 'undefined' || !Game.hasEnoughGold(SR_RECRUIT_COST)) {
            UI.showMessage('金币不足，无法招募SR角色');
            return;
        }

        // 检查是否有SR角色数据
        if (typeof Character === 'undefined') {
            UI.showMessage('角色系统未加载，请稍后再试');
            return;
        }

        // 确保SR角色数据已加载
        UI.showMessage('正在准备SR角色数据，请稍候...');

        // 使用确保SR角色数据已加载方法
        Character.ensureSRCharactersLoaded()
            .then(srCharacters => {
                console.log('SR角色数据加载成功，共 ' + srCharacters.length + ' 个角色');
                processSRRecruitment();
            })
            .catch(error => {
                console.error('SR角色数据加载失败:', error);
                UI.showMessage('无法加载SR角色数据，请刷新页面后再试');
            });

        /**
         * 处理SR角色招募流程
         */
        function processSRRecruitment() {
            // 扣除金币
            if (Game.removeGold(SR_RECRUIT_COST)) {
                // 清空当前招募结果
                currentRecruitResults = [];

                // 随机选择一个SR角色
                const randomIndex = Math.floor(Math.random() * Character.srCharacters.length);
                const selectedSR = Character.srCharacters[randomIndex];

                console.log(`选择了SR角色: ${selectedSR.name}`);

                // 创建角色数据
                const srCharacter = {
                    ...selectedSR,
                    rarity: 'epic',
                    isRecruited: true,
                    level: 1,
                    exp: 0
                };

                // 添加到结果中
                currentRecruitResults.push(srCharacter);

                // 添加角色到游戏
                if (typeof Character !== 'undefined' && typeof Character.addCharacter === 'function') {
                    const newCharacterId = Character.addCharacter(srCharacter);
                    console.log(`添加SR角色: ${srCharacter.name} (ID: ${newCharacterId})`);
                }

                // 显示招募结果
                showRecruitResult();

                // 更新金币显示
                updateGoldDisplay();

                // 保存游戏状态
                if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                    console.log('保存游戏状态');
                    Game.saveGame();
                }
            } else {
                UI.showMessage('金币不足，无法招募SR角色');
            }
        }
    }

    /**
     * 招募必得SSR角色
     */
    function recruitSSRCharacter() {
        console.log('招募必得SSR角色');

        // 检查金币是否足够
        if (typeof Game === 'undefined' || !Game.hasEnoughGold(SSR_RECRUIT_COST)) {
            UI.showMessage('金币不足，无法招募SSR角色');
            return;
        }

        // 检查是否有SSR角色数据
        if (typeof Character === 'undefined') {
            UI.showMessage('角色系统未加载，请稍后再试');
            return;
        }

        // 确保SSR角色数据已加载
        UI.showMessage('正在准备SSR角色数据，请稍候...');

        // 使用新的确保SSR角色数据已加载方法
        Character.ensureSSRCharactersLoaded()
            .then(ssrCharacters => {
                console.log('SSR角色数据加载成功，共 ' + ssrCharacters.length + ' 个角色');
                processSSRRecruitment();
            })
            .catch(error => {
                console.error('SSR角色数据加载失败:', error);
                UI.showMessage('无法加载SSR角色数据，请刷新页面后再试');
            });

        /**
         * 处理SSR角色招募流程
         */
        function processSSRRecruitment() {
            // 扣除金币
            if (Game.removeGold(SSR_RECRUIT_COST)) {
                // 清空当前招募结果
                currentRecruitResults = [];

                // 随机选择一个SSR角色
                const randomIndex = Math.floor(Math.random() * Character.ssrCharacters.length);
                const selectedSSR = Character.ssrCharacters[randomIndex];

                console.log(`选择了SSR角色: ${selectedSSR.name}`);

                // 创建角色数据
                const ssrCharacter = {
                    ...selectedSSR,
                    rarity: 'legendary',
                    isRecruited: true,
                    level: 1,
                    exp: 0
                };

                // 添加到结果中
                currentRecruitResults.push(ssrCharacter);

                // 添加角色到游戏
                if (typeof Character !== 'undefined' && typeof Character.addCharacter === 'function') {
                    const newCharacterId = Character.addCharacter(ssrCharacter);
                    console.log(`添加SSR角色: ${ssrCharacter.name} (ID: ${newCharacterId})`);
                }

                // 显示招募结果
                showRecruitResult();

                // 更新金币显示
                updateGoldDisplay();

                // 保存游戏状态
                if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                    console.log('保存游戏状态');
                    Game.saveGame();
                }
            } else {
                UI.showMessage('金币不足，无法招募SSR角色');
            }
        }
    }

    /**
     * 显示招募结果
     */
    function showRecruitResult() {
        console.log('显示招募结果');

        const resultContainer = document.getElementById('recruit-result');
        const resultList = document.getElementById('recruited-result-list');

        if (!resultContainer || !resultList) {
            console.error('找不到招募结果容器');
            return;
        }

        // 清空结果列表
        resultList.innerHTML = '';

        // 添加招募结果
        currentRecruitResults.forEach(character => {
            const resultItem = document.createElement('div');
            resultItem.className = `recruit-result-item ${character.rarity}`;
            //console.log(character);

            // 获取类型和属性的中文名称
            const typeDisplay = Character.types[character.type]?.name || character.type;
            const attributeDisplay = Character.attributes[character.attribute]?.name || character.attribute;

            // 转换稀有度显示
            let rarityDisplay = 'R';
            if (character.rarity === 'epic') {
                rarityDisplay = 'SR';
            } else if (character.rarity === 'legendary') {
                rarityDisplay = 'SSR';
            }

            // 显示多重抽取信息
            let multiCountInfo = '';
            if (character.multiCount && character.multiCount > 1) {
                multiCountInfo = `<span class="multi-count-badge">+${character.multiCount - 1}</span>`;
            }

            // 显示返还金币信息
            let refundInfo = '';
            if (character.refundInfo) {
                refundInfo = `
                    <div class="refund-info">
                        <p>已达到突破上限，返还 ${character.refundInfo.refundAmount} 金币</p>
                    </div>
                `;
            }

            resultItem.innerHTML = `
                <div class="recruit-result-info">
                    <h4>${character.name}${multiCountInfo}</h4>
                    <span class="rarity-badge ${character.rarity}">${rarityDisplay}</span>
                    <p>
                        类型: ${typeDisplay}
                        <span class="info-separator">|</span>
                        属性: ${attributeDisplay} <span class="attribute-circle ${character.attribute}"></span>
                    </p>
                    <p>${character.description || ''}</p>
                    ${refundInfo}
                </div>
            `;

            resultList.appendChild(resultItem);
        });

        // 显示结果容器
        resultContainer.classList.remove('hidden');

        // 隐藏招募按钮
        document.getElementById('tavern-recruitment').classList.add('hidden');
    }

    /**
     * 隐藏招募结果
     */
    function hideRecruitResult() {
        console.log('隐藏招募结果');

        const resultContainer = document.getElementById('recruit-result');

        if (resultContainer) {
            resultContainer.classList.add('hidden');
        }

        // 显示招募按钮
        const recruitmentContainer = document.getElementById('tavern-recruitment');
        if (recruitmentContainer) {
            recruitmentContainer.classList.remove('hidden');
        }

        // 更新已招募角色列表
        renderRecruitedCharacters();
    }

    /**
     * 渲染已招募角色
     */
    function renderRecruitedCharacters() {
        console.log('渲染已招募角色');

        const container = document.getElementById('recruited-characters');
        if (!container) {
            console.error('找不到recruited-characters容器');
            return;
        }

        // 清空容器
        container.innerHTML = '';

        // 获取已招募角色
        let recruitedCharacters = [];

        // 如果Character模块存在，尝试获取已招募角色
        if (typeof Character !== 'undefined' && Character.characters) {
            console.log('Character模块存在，角色数量:', Object.keys(Character.characters).length);

            // 调试输出所有角色的招募状态
            Object.values(Character.characters).forEach(character => {
                console.log(`角色 ${character.name} (ID: ${character.id}) - 招募状态: ${character.isRecruited}, 主角: ${character.isMainCharacter}`);
            });

            recruitedCharacters = Object.values(Character.characters).filter(
                character => character.isRecruited && !character.isMainCharacter
            );

            console.log('过滤后的已招募角色数量:', recruitedCharacters.length);
        } else {
            console.error('Character模块未定义或没有角色数据');
        }

        // 如果没有已招募角色，显示默认消息
        if (recruitedCharacters.length === 0) {
            container.innerHTML = '<p>没有已招募的角色</p>';
            return;
        }

        // 创建角色卡片
        recruitedCharacters.forEach(character => {
            // 创建角色卡片
            const card = document.createElement('div');
            card.className = `character-card ${character.rarity}`;

            // 获取类型和属性的中文名称
            const typeDisplay = Character.types[character.type]?.name || character.type;
            const attributeDisplay = Character.attributes[character.attribute]?.name || character.attribute;

            // 转换稀有度显示（主角不显示稀有度）
            let rarityBadge = '';
            if (!character.isMainCharacter) {
                let rarityDisplay = 'R';
                if (character.rarity === 'epic') {
                    rarityDisplay = 'SR';
                } else if (character.rarity === 'legendary') {
                    rarityDisplay = 'SSR';
                }
                rarityBadge = `<span class="rarity-badge ${character.rarity}">${rarityDisplay}</span>`;
            }

            // 添加多重抽取显示
            let multiCountDisplay = '';
            if (character.multiCount && character.multiCount > 1) {
                // 检查是否达到多重上限
                if (character.multiCount >= 20) {
                    multiCountDisplay = `<span class="multi-count-badge">+${character.multiCount - 1}</span><span class="multi-count-max">(已达上限)</span>`;
                } else {
                    multiCountDisplay = `<span class="multi-count-badge">+${character.multiCount - 1}</span>`;
                }
            }

            // 设置卡片内容
            card.innerHTML = `
                <div class="character-info">
                    <h4>${character.name}${multiCountDisplay}</h4>
                    ${rarityBadge}
                    <p>
                        LV: ${character.level || 1}
                        <span class="info-separator">|</span>
                        ${typeDisplay}
                        <span class="info-separator">|</span>
                        ${attributeDisplay} <span class="attribute-circle ${character.attribute}"></span>
                        ${character.isMainCharacter ? '<span class="main-character-tag">主角</span>' : ''}
                        ${character.skills && character.skills.length > 0 ?
                            `<span class="info-separator">|</span>
                            ${character.skills.map(skillId => {
                                // 获取技能信息
                                let skillName = skillId;
                                let skillInfo = null;

                                // 尝试从JobSystem获取技能信息
                                if (typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function') {
                                    skillInfo = JobSystem.getSkill(skillId);
                                    if (skillInfo && skillInfo.name) {
                                        skillName = skillInfo.name;
                                    }
                                }

                                // 如果是R角色技能，尝试从r_skills.json获取
                                if (typeof window.r_skills !== 'undefined' && window.r_skills[skillId]) {
                                    skillInfo = window.r_skills[skillId];
                                    if (skillInfo && skillInfo.name) {
                                        skillName = skillInfo.name;
                                    }
                                }

                                // 如果是SR角色技能，尝试从sr_skills.json获取
                                if (typeof window.sr_skills !== 'undefined' && window.sr_skills[skillId]) {
                                    skillInfo = window.sr_skills[skillId];
                                    if (skillInfo && skillInfo.name) {
                                        skillName = skillInfo.name;
                                    }
                                }

                                return `<span class="skill-name" data-skill-id="${skillId}">${skillName}</span>`;
                            }).join(', ')}`
                            : ''}
                    </p>
                </div>
            `;

            // 添加到容器
            container.appendChild(card);
        });
    }

    /**
     * 更新金币显示
     */
    function updateGoldDisplay() {
        const goldDisplay = document.getElementById('gold-display');
        if (goldDisplay && typeof Game !== 'undefined') {
            goldDisplay.textContent = `金币: ${Game.state.gold}`;
        }
    }

    // 初始化
    initTavernScreen();

    // 将方法暴露给UI对象
    UI.refreshTavernScreen = refreshTavernScreen;
})();
