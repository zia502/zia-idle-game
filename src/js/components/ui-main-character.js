/**
 * UI模块扩展 - 主角信息渲染
 */
(function() {
    // 确保UI对象存在
    if (typeof UI === 'undefined') {
        console.error('UI模块未加载');
        return;
    }

    /**
     * 渲染主角信息
     */
    UI.renderMainCharacter = function() {
        console.log('渲染主角信息');

        const mainCharacterContainer = document.getElementById('main-character-info');
        if (!mainCharacterContainer) {
            console.error('找不到主角信息容器');
            return;
        }

        // 清空现有内容
        mainCharacterContainer.innerHTML = '';

        // 获取主角
        if (typeof Character === 'undefined' || typeof Character.getMainCharacter !== 'function') {
            console.error('Character模块未加载或getMainCharacter方法不存在');
            mainCharacterContainer.innerHTML = '<div class="error-message">角色系统未就绪</div>';
            return;
        }

        const mainCharacter = Character.getMainCharacter();
        if (!mainCharacter) {
            console.log('主角不存在');
            mainCharacterContainer.innerHTML = '<div class="empty-message">主角信息未找到</div>';
            return;
        }

        console.log('主角信息:', mainCharacter);

        // 获取职业信息
        let jobName = '新手';
        let jobLevel = 1;

        if (typeof Character.getJobName === 'function') {
            jobName = Character.getJobName(mainCharacter);
        }

        if (typeof Character.getJobLevel === 'function') {
            jobLevel = Character.getJobLevel(mainCharacter);
        }

        // 获取允许使用的武器
        let allowedWeapons = [];
        if (typeof JobSystem !== 'undefined' && typeof JobSystem.getAllowedWeapons === 'function') {
            allowedWeapons = JobSystem.getAllowedWeapons(mainCharacter.job.current);
        }

        // 创建主角卡片
        const characterCard = document.createElement('div');
        characterCard.className = 'character-card main-character-card';
        characterCard.id = `character-${mainCharacter.id}`;

        // 计算HP百分比
        const hpPercent = (mainCharacter.currentStats?.hp / mainCharacter.baseStats?.hp) * 100 || 100;

        // 计算经验百分比
        let expPercent = 0;
        let expToNext = 100;

        if (typeof Character.getExpToNextLevel === 'function') {
            expToNext = Character.getExpToNextLevel(mainCharacter.level);
            expPercent = (mainCharacter.exp / expToNext) * 100;
        } else {
            console.warn('Character.getExpToNextLevel方法不存在');
        }

        // 设置主角卡片内容
        characterCard.innerHTML = `
            <div class="character-header">
                <div class="character-avatar">
                    <img src="${mainCharacter.avatarSrc || 'assets/images/characters/default.png'}" alt="${mainCharacter.name}">
                    <div class="character-level">${mainCharacter.level || 1}</div>
                </div>
                <div class="character-name">${mainCharacter.name}</div>
                <div class="character-job">
                    <span class="job-name">${jobName}</span>
                    <span class="job-level">Lv.${jobLevel}</span>
                    <div class="allowed-weapons">
                        ${allowedWeapons.map(weaponType => `
                            <img src="src/assets/${UI.weaponTypeIcons[weaponType]}" alt="${UI.getWeaponTypeName(weaponType)}" title="${UI.getWeaponTypeName(weaponType)}">
                        `).join('')}
                    </div>
                </div>
                <div class="character-attributes">
                    <span class="attribute-tag attribute-${mainCharacter.attribute || 'fire'}">${mainCharacter.attribute || '火'}</span>
                    <span class="type-tag type-${mainCharacter.type || 'attack'}">${mainCharacter.type || '攻击'}</span>
                </div>
            </div>
            <div class="character-stats">
                <div class="stat-row">
                    <div class="stat-label">生命值</div>
                    <div class="hp-container">
                        <div class="hp-bar" style="width: ${hpPercent}%" data-tooltip="${mainCharacter.currentStats?.hp || 0}/${mainCharacter.baseStats?.hp || 0}"></div>
                    </div>
                    <div class="hp-value">${mainCharacter.currentStats?.hp || 0}/${mainCharacter.baseStats?.hp || 0}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">经验</div>
                    <div class="exp-container">
                        <div class="exp-bar" style="width: ${expPercent}%"></div>
                    </div>
                    <div class="exp-value">${mainCharacter.exp || 0}/${expToNext}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">攻击力</div>
                    <div class="stat-value">${mainCharacter.baseStats?.attack || 0}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">防御力</div>
                    <div class="stat-value">${mainCharacter.baseStats?.defense || 0}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">速度</div>
                    <div class="stat-value">${mainCharacter.baseStats?.speed || 0}</div>
                </div>
            </div>
            <div class="character-actions">
                <button class="details-button" data-character-id="${mainCharacter.id}">详情</button>
                <button class="job-button" data-character-id="${mainCharacter.id}">职业</button>
            </div>
        `;

        // 添加到容器
        mainCharacterContainer.appendChild(characterCard);

        // 添加详情按钮事件
        const detailsButton = characterCard.querySelector('.details-button');
        if (detailsButton) {
            detailsButton.addEventListener('click', function() {
                if (typeof UI.showCharacterDetails === 'function') {
                    UI.showCharacterDetails(mainCharacter.id);
                } else {
                    console.warn('UI.showCharacterDetails方法不存在');
                    // 如果方法不存在，创建一个临时的详情显示
                    UI.showTempCharacterDetails(mainCharacter);
                }
            });
        }

        // 添加职业按钮事件
        const jobButton = characterCard.querySelector('.job-button');
        if (jobButton) {
            jobButton.addEventListener('click', function() {
                if (typeof UI.showJobSelection === 'function') {
                    UI.showJobSelection(mainCharacter.id);
                } else {
                    console.warn('UI.showJobSelection方法不存在');
                    alert('职业选择功能尚未实现');
                }
            });
        }

        console.log('主角信息渲染完成');
    };

    /**
     * 显示临时角色详情（当UI.showCharacterDetails不存在时使用）
     * @param {object} character - 角色对象
     */
    UI.showTempCharacterDetails = function(character) {
        if (!character) return;

        // 创建对话框
        const dialog = document.createElement('div');
        dialog.className = 'dialog character-details-dialog';
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.backgroundColor = '#fff';
        dialog.style.padding = '20px';
        dialog.style.border = '1px solid #ccc';
        dialog.style.zIndex = '1000';
        dialog.style.maxWidth = '80%';
        dialog.style.maxHeight = '80%';
        dialog.style.overflow = 'auto';

        // 获取职业信息
        let jobName = '新手';
        let jobLevel = 1;

        if (typeof Character.getJobName === 'function') {
            jobName = Character.getJobName(character);
        }

        if (typeof Character.getJobLevel === 'function') {
            jobLevel = Character.getJobLevel(character);
        }

        // 获取技能信息
        let skills = [];
        if (typeof Character.getCharacterSkills === 'function') {
            skills = Character.getCharacterSkills(character);
        } else if (character.skills) {
            skills = character.skills;
        }

        // 设置对话框内容
        dialog.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:5px; border-bottom:1px solid #ccc;">
                <h2 style="margin:0;">${character.name}</h2>
                <button class="close-button" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
            </div>

            <div style="display:flex; margin-bottom:20px;">
                <div style="flex:0 0 100px; position:relative;">
                    <img src="${character.avatarSrc || 'assets/images/characters/default.png'}" alt="${character.name}" style="width:100px; height:100px; object-fit:cover; border:1px solid #ccc;">
                    <div style="position:absolute; bottom:0; right:0; background:#333; color:#fff; padding:2px 5px; font-size:12px;">Lv.${character.level || 1}</div>
                </div>

                <div style="flex:1; margin-left:15px;">
                    <div style="margin-bottom:10px;">
                        <strong>职业：</strong> ${jobName} (Lv.${jobLevel})
                    </div>

                    <div style="margin-bottom:5px;">
                        <strong>生命值：</strong> ${character.currentStats?.hp || 0}/${character.baseStats?.hp || 0}
                    </div>

                    <div style="margin-bottom:5px;">
                        <strong>攻击力：</strong> ${character.baseStats?.attack || 0}
                    </div>

                    <div style="margin-bottom:5px;">
                        <strong>防御力：</strong> ${character.baseStats?.defense || 0}
                    </div>

                    <div style="margin-bottom:5px;">
                        <strong>速度：</strong> ${character.baseStats?.speed || 0}
                    </div>

                    <div style="margin-bottom:5px;">
                        <strong>经验值：</strong> ${character.exp || 0}/${Character.getExpToNextLevel ? Character.getExpToNextLevel(character.level) : 100}
                    </div>
                </div>
            </div>

            <div style="margin-bottom:20px;">
                <h3 style="margin-top:0; padding-bottom:5px; border-bottom:1px solid #eee;">装备</h3>
                <div style="display:flex; gap:10px;">
                    <div style="flex:1; padding:5px; border:1px solid #eee; text-align:center;">
                        <div style="font-weight:bold; margin-bottom:5px;">武器</div>
                        <div>${character.equipment?.weapon ? character.equipment.weapon.name : '无'}</div>
                    </div>
                    <div style="flex:1; padding:5px; border:1px solid #eee; text-align:center;">
                        <div style="font-weight:bold; margin-bottom:5px;">防具</div>
                        <div>${character.equipment?.armor ? character.equipment.armor.name : '无'}</div>
                    </div>
                    <div style="flex:1; padding:5px; border:1px solid #eee; text-align:center;">
                        <div style="font-weight:bold; margin-bottom:5px;">饰品</div>
                        <div>${character.equipment?.accessory ? character.equipment.accessory.name : '无'}</div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom:20px;">
                <h3 style="margin-top:0; padding-bottom:5px; border-bottom:1px solid #eee;">特性</h3>
                <div style="display:flex; flex-wrap:wrap; gap:10px;">
                    ${character.traits && character.traits.length > 0 ?
                        character.traits.map(trait => `
                            <div style="padding:5px 10px; border:1px solid #eee; border-radius:3px;">${trait}</div>
                        `).join('') :
                        '<div>无特性</div>'
                    }
                </div>
            </div>

            <div>
                <h3 style="margin-top:0; padding-bottom:5px; border-bottom:1px solid #eee;">技能</h3>
                <div style="display:flex; flex-direction:column; gap:5px;">
                    ${skills.length > 0 ?
                        skills.map(skillId => {
                            const skillInfo = typeof JobSystem !== 'undefined' && typeof JobSystem.getSkill === 'function' ?
                                JobSystem.getSkill(skillId) : null;

                            return `
                                <div style="padding:8px; border:1px solid #eee; display:flex; justify-content:space-between; ${skillInfo && skillInfo.fixed ? 'background-color:#f0f0f0;' : ''}">
                                    <div>
                                        ${skillInfo ? skillInfo.name : skillId}
                                        ${skillInfo && skillInfo.fixed ? '<span style="color:#ff6600; margin-left:5px;">[固定]</span>' : ''}
                                    </div>
                                    ${skillInfo ? `<div style="color:#666; font-size:12px;">${skillInfo.type}</div>` : ''}
                                </div>
                            `;
                        }).join('') :
                        '<div>无技能</div>'
                    }
                </div>
            </div>
        `;

        // 添加到文档
        document.body.appendChild(dialog);

        // 添加关闭按钮事件
        dialog.querySelector('.close-button').addEventListener('click', function() {
            document.body.removeChild(dialog);
        });
    };

    // 添加到Events监听器，在角色创建完成后渲染主角信息
    if (typeof Events !== 'undefined' && typeof Events.on === 'function') {
        Events.on('character:created', (data) => {
            console.log('角色创建完成事件触发，渲染主角信息');
            UI.renderMainCharacter();
        });

        // 在角色更新时重新渲染主角信息（包括元素属性变化）
        Events.on('character:updated', (data) => {
            console.log('角色更新事件触发，重新渲染主角信息', data);
            // 检查是否是主角的更新
            if (typeof Character !== 'undefined' && typeof Character.getMainCharacter === 'function') {
                const mainCharacter = Character.getMainCharacter();
                if (mainCharacter && data.characterId === mainCharacter.id) {
                    console.log('主角信息已更新，重新渲染UI');
                    UI.renderMainCharacter();
                }
            }
        });

        // 在切换到角色界面时也渲染主角信息
        Events.on('ui:screenChanged', (data) => {
            if (data.screen === 'character-screen') {
                console.log('切换到角色界面，渲染主角信息');
                UI.renderMainCharacter();
            }
        });
    }

    // 在UI初始化完成后，如果主角已存在，则渲染主角信息
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (typeof Character !== 'undefined' && typeof Character.getMainCharacter === 'function') {
                const mainCharacter = Character.getMainCharacter();
                if (mainCharacter) {
                    console.log('页面加载完成，主角已存在，渲染主角信息');
                    UI.renderMainCharacter();
                }
            }
        }, 500); // 延迟500毫秒，确保其他模块已加载
    });
})();
