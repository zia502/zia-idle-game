import UI from './UI.js';
import Character from '../core/character.js';
import Events from './events.js';
import JobSystem from '../core/job-system.js';
import MainCharacterInfo from './main-character-info.js';

/**
 * UI模块扩展 - 主角信息渲染
 */
(function() {
    // 确保UI对象存在
    if (typeof UI === 'undefined') {
        console.error('UI模块未加载');
        return;
    }

    // 添加标志，防止循环调用
    let isUpdatingMainUI = false;
    let isHandlingExpUpdate = false;

    /**
     * 渲染主角信息
     * @param {boolean} skipMainUI - 是否跳过更新主界面
     * @param {boolean} isFromExpUpdate - 是否来自经验更新事件
     */
    UI.renderMainCharacter = function(skipMainUI = false, isFromExpUpdate = false) {
        // console.log('渲染主角信息');

        // 如果正在处理经验更新事件，并且这个调用也来自经验更新，则跳过
        if (isHandlingExpUpdate && isFromExpUpdate) {
            return;
        }

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
            // console.log('主角不存在');
            mainCharacterContainer.innerHTML = '<div class="empty-message">主角信息未找到</div>';
            return;
        }

        // console.log('主角信息:', mainCharacter);

        // 使用 MainCharacterInfo 组件渲染主角信息
        const mainCharacterInfo = new MainCharacterInfo(mainCharacter);
        mainCharacterContainer.innerHTML = mainCharacterInfo.render();

        // 添加职业按钮事件
        const jobButton = mainCharacterContainer.querySelector('.job-button');
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

        // 同时更新主界面中的主角信息，但避免循环调用
        if (!skipMainUI && typeof MainUI !== 'undefined' && typeof MainUI.updateMainHeroInfo === 'function' && !isUpdatingMainUI) {
            // console.log('同时更新主界面中的主角信息');
            isUpdatingMainUI = true;
            try {
                MainUI.updateMainHeroInfo();
            } finally {
                isUpdatingMainUI = false;
            }
        }
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
        if (character.skills) {
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
        Events.on('character:created', () => {
            // console.log('角色创建完成事件触发，渲染主角信息');
            UI.renderMainCharacter();
        });

        // 在角色更新时重新渲染主角信息（包括元素属性变化）
        Events.on('character:updated', (data) => {
            // console.log('角色更新事件触发，重新渲染主角信息', data);
            // 检查是否是主角的更新
            if (typeof Character !== 'undefined' && typeof Character.getMainCharacter === 'function') {
                const mainCharacter = Character.getMainCharacter();
                if (mainCharacter && data.characterId === mainCharacter.id) {
                    // console.log('主角信息已更新，重新渲染UI');
                    UI.renderMainCharacter();
                }
            }
        });

        // 在武器更新时重新渲染主角信息
        Events.on('weapon:updated', () => {
            // console.log('武器更新事件触发，重新渲染主角信息');
            // 武器盘更新时，主角的属性可能会受到影响，所以需要重新渲染
            UI.renderMainCharacter();
        });

        // 在职业经验更新时重新渲染主角信息
        Events.on('character:exp-updated', () => {
            // console.log('职业经验更新事件触发，重新渲染主角信息');

            // 设置标志，表示正在处理经验更新事件
            isHandlingExpUpdate = true;

            try {
                // 更新主角信息，跳过更新主界面，并标记为来自经验更新
                UI.renderMainCharacter(true, true);

                // 直接更新主界面中的主角信息
                if (typeof MainUI !== 'undefined' && typeof MainUI.updateMainHeroInfo === 'function') {
                    MainUI.updateMainHeroInfo();
                }
            } finally {
                // 重置标志
                isHandlingExpUpdate = false;
            }
        });

        // 在切换到角色界面时也渲染主角信息
        Events.on('ui:screenChanged', (data) => {
            if (data.screen === 'character-screen') {
                // console.log('切换到角色界面，渲染主角信息');
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
                    // console.log('页面加载完成，主角已存在，渲染主角信息');
                    UI.renderMainCharacter();
                }
            }
        }, 500); // 延迟500毫秒，确保其他模块已加载
    });
})();
