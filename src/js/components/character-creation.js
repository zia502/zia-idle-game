/**
 * 角色创建模块 - 负责处理游戏开始时的角色创建流程
 *
 * 整合了character-creator.js和character-creation.js的功能
 */

import Character from '../core/character.js';
import Team from '../core/team.js';
import Game from '../core/game.js';
import UI from './UI.js';
import Events from './events.js'; // 路径已更正 (events.js 与 character-creation.js 在同一目录下 components)
import Storage from '../utils/storage.js';

// 声明全局函数，以便Game.resetGame()可以调用
let showCharacterCreationDialog;
let closeCharacterCreationDialog;

const CharacterCreation = {
    /**
     * 初始化角色创建系统
     * @param {boolean} forceShow - 是否强制显示角色创建对话框
     */
    init(forceShow = false) {
        console.log('[DEBUG] CharacterCreation.init() 被调用, forceShow:', forceShow); // 添加调试日志
        console.log('角色创建系统初始化', forceShow ? '(强制显示)' : '');

        // 如果强制显示，直接显示对话框
        if (forceShow) {
            console.log('强制显示角色创建对话框');
            this.showCharacterCreationDialog();
            return;
        }

        // 检查是否已经有主角
        if (this.hasMainCharacter()) {
            console.log('已存在主角，跳过角色创建');
            return;
        }

        // 检查是否有存档数据
        if (typeof Storage !== 'undefined') {
            const saveData = Storage.load('gameData');
            if (saveData && saveData.character && saveData.character.characters) {
                // 查找主角
                const characters = Object.values(saveData.character.characters);
                const mainCharacter = characters.find(char => char.isMainCharacter);

                if (mainCharacter) {
                    console.log(`从存档中找到主角: ${mainCharacter.name}，跳过角色创建`);
                    return;
                }
            }
        }

        // 显示角色创建对话框
        console.log('没有找到主角，显示角色创建对话框');
        this.showCharacterCreationDialog();
    },

    /**
     * 检查是否已经有主角
     * @returns {boolean} 是否已有主角
     */
    hasMainCharacter() {
        // 检查是否有主角数据
        if (typeof Character !== 'undefined' && typeof Character.getMainCharacter === 'function') {
            const mainCharacter = Character.getMainCharacter();
            return mainCharacter !== null && mainCharacter !== undefined;
        }
        return false;
    },

    /**
     * 显示角色创建对话框
     */
    showCharacterCreationDialog() {
        console.log('[DEBUG] CharacterCreation.showCharacterCreationDialog() 被调用'); // 添加调试日志
        console.log('显示角色创建对话框');

        // 先移除可能存在的旧对话框
        this.closeDialog();

        // 创建遮罩层，阻止点击其他元素
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.id = 'character-creation-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '999';
        document.body.appendChild(overlay);

        // 创建对话框容器
        const dialog = document.createElement('div');
        dialog.className = 'dialog character-creation-dialog';
        dialog.id = 'character-creation-dialog';
        dialog.style.zIndex = '1000';

        // 设置对话框内容
        dialog.innerHTML = `
            <div class="dialog-header">
                <h2>欢迎来到Zia的世界</h2>
            </div>
            <div class="dialog-content">
                <p>在开始你的冒险之前，请告诉我你的名字：</p>
                <div class="input-group">
                    <label for="character-name">角色名称：</label>
                    <input type="text" id="character-name" placeholder="输入你的名字" maxlength="12">
                </div>
                <div class="error-message" id="name-error"></div>
            </div>
            <div class="dialog-buttons">
                <button id="start-adventure" class="btn">开始冒险</button>
            </div>
        `;

        // 添加到文档
        document.body.appendChild(dialog);

        // 聚焦到输入框
        setTimeout(() => {
            const nameInput = document.getElementById('character-name');
            if (nameInput) {
                nameInput.focus();
            }
        }, 100);

        // 使用直接函数定义，避免this绑定问题
        const self = this;

        // 添加按钮事件 - 使用直接函数而不是箭头函数
        const startButton = document.getElementById('start-adventure');
        if (startButton) {
            startButton.onclick = function() {
                console.log('开始冒险按钮被点击');
                self.createCharacter();
            };
        }

        // 添加回车键提交
        const nameInput = document.getElementById('character-name');
        if (nameInput) {
            nameInput.onkeypress = function(e) {
                if (e.key === 'Enter') {
                    console.log('回车键被按下');
                    self.createCharacter();
                }
            };
        }
    },

    /**
     * 创建角色
     */
    createCharacter() {
        console.log('执行createCharacter方法');
        const nameInput = document.getElementById('character-name');
        const errorElement = document.getElementById('name-error');

        if (!nameInput || !errorElement) {
            console.error('找不到名称输入框或错误元素');
            return;
        }

        const name = nameInput.value.trim();
        console.log(`输入的名称: "${name}"`);

        // 验证名称
        if (!name) {
            errorElement.textContent = '请输入角色名称';
            nameInput.focus();
            return;
        }

        if (name.length < 2) {
            errorElement.textContent = '角色名称至少需要2个字符';
            nameInput.focus();
            return;
        }

        // 清除错误信息
        errorElement.textContent = '';

        // 创建主角
        if (typeof Character !== 'undefined' && typeof Character.createMainCharacter === 'function') {
            const characterData = {
                name: name,
                // 默认属性
                attribute: 'fire',
                type: 'attack',
                level: 1,
                isMainCharacter: true
            };

            console.log('调用Character.addCharacter方法'); // 修改日志
            const characterId = Character.addCharacter(characterData); // 修改方法调用

            if (characterId) {
                console.log(`创建主角成功: ${name} (ID: ${characterId})`);

                // 创建初始队伍
                if (typeof Team !== 'undefined' && typeof Team.createTeam === 'function') {
                    const teamData = {
                        name: `${name}的队伍`,
                        members: [characterId]
                    };

                    const teamId = Team.createTeam(teamData);

                    if (teamId && typeof Game !== 'undefined') {
                        // 设置为活动队伍
                        Game.state.activeTeamId = teamId;
                        console.log(`创建初始队伍成功: ${teamData.name} (ID: ${teamId})`);
                    }
                }

                // 显示欢迎消息
                if (typeof UI !== 'undefined' && typeof UI.showNotification === 'function') {
                    UI.showNotification(`欢迎，${name}！你的冒险即将开始！`, 'success', 5000);
                }

                // 关闭对话框
                this.closeDialog();

                // 触发角色创建完成事件
                if (typeof Events !== 'undefined' && typeof Events.emit === 'function') {
                    Events.emit('character:created', { characterId });
                }

                // 保存游戏状态
                if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                    console.log('保存角色创建数据');
                    Game.saveGame();
                }
            } else {
                console.error('创建角色失败');
                errorElement.textContent = '创建角色失败，请重试';
            }
        } else {
            console.error('Character.createMainCharacter方法不存在');
            errorElement.textContent = '角色系统未就绪，请刷新页面重试';
        }
    },

    /**
     * 关闭对话框
     */
    closeDialog() {
        console.log('关闭角色创建对话框');

        // 移除遮罩层
        const overlay = document.getElementById('character-creation-overlay');
        if (overlay) {
            overlay.remove();
        }

        // 移除对话框
        const dialog = document.getElementById('character-creation-dialog');
        if (dialog) {
            dialog.remove();
        }
    }
};

// 实现全局函数，以便Game.resetGame()可以调用
showCharacterCreationDialog = function() {
    CharacterCreation.showCharacterCreationDialog();
};

closeCharacterCreationDialog = function() {
    CharacterCreation.closeDialog();
};

// 添加到Events监听器，在游戏加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，等待游戏初始化');

    if (typeof Events !== 'undefined' && typeof Events.on === 'function') {
        Events.on('game:loaded', () => {
            console.log('[DEBUG] character-creation.js: game:loaded 事件被触发'); // 添加调试日志
            console.log('游戏加载完成，初始化角色创建系统');
            CharacterCreation.init();
        });
    } else {
        console.log('Events模块未就绪，直接初始化角色创建系统');
        // 如果Events模块不可用，延迟一段时间后直接初始化
        setTimeout(() => {
            CharacterCreation.init();
        }, 1000);
    }
});

export default CharacterCreation;
