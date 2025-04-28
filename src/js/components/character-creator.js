/**
 * 独立的角色创建模块 - 不依赖于其他模块
 */
(function() {
    // 在页面加载完成后执行
    document.addEventListener('DOMContentLoaded', function() {
        console.log('角色创建模块初始化');

        // 检查是否已有主角
        if (hasMainCharacter()) {
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
        showCharacterCreationDialog();
    });

    /**
     * 检查是否已有主角
     */
    function hasMainCharacter() {
        // 检查是否有主角数据
        if (typeof Character !== 'undefined' && typeof Character.getMainCharacter === 'function') {
            const mainCharacter = Character.getMainCharacter();
            return mainCharacter !== null && mainCharacter !== undefined;
        }
        return false;
    }

    /**
     * 显示角色创建对话框
     */
    function showCharacterCreationDialog() {
        console.log('显示角色创建对话框');

        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.id = 'character-creation-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '999';
        document.body.appendChild(overlay);

        // 创建对话框
        const dialog = document.createElement('div');
        dialog.id = 'character-creation-dialog';
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.backgroundColor = '#fff';
        dialog.style.padding = '20px';
        dialog.style.border = '1px solid #ccc';
        dialog.style.zIndex = '1000';
        dialog.style.maxWidth = '400px';
        dialog.style.width = '90%';
        dialog.style.fontFamily = 'Courier New, Courier, monospace';

        // 设置对话框内容
        dialog.innerHTML = `
            <div style="margin-bottom:15px; padding-bottom:5px; border-bottom:1px solid #ccc; text-align:center;">
                <h2 style="margin:0; font-size:20px;">欢迎来到Zia的世界</h2>
            </div>
            <div style="margin-bottom:20px;">
                <p>在开始你的冒险之前，请告诉我你的名字：</p>
                <div style="margin:15px 0;">
                    <label for="character-name" style="display:block; margin-bottom:5px;">角色名称：</label>
                    <input type="text" id="character-name" placeholder="输入你的名字" maxlength="12"
                           style="width:100%; padding:8px; border:1px solid #ccc; font-family:inherit;">
                </div>
                <div id="name-error" style="color:#900; min-height:20px; margin-top:5px;"></div>
            </div>
            <div style="text-align:right;">
                <button id="start-adventure-btn"
                        style="padding:8px 16px; border:1px solid #ccc; background:transparent; cursor:pointer; font-family:inherit;">
                    开始冒险
                </button>
            </div>
        `;

        // 添加到文档
        document.body.appendChild(dialog);

        // 聚焦到输入框
        setTimeout(function() {
            const nameInput = document.getElementById('character-name');
            if (nameInput) {
                nameInput.focus();
            }
        }, 100);

        // 添加按钮点击事件
        const startButton = document.getElementById('start-adventure-btn');
        if (startButton) {
            startButton.onclick = function() {
                console.log('开始冒险按钮被点击');
                createCharacter();
            };
        }

        // 添加回车键提交
        const nameInput = document.getElementById('character-name');
        if (nameInput) {
            nameInput.onkeypress = function(e) {
                if (e.key === 'Enter') {
                    console.log('回车键被按下');
                    createCharacter();
                }
            };
        }
    }

    /**
     * 创建角色
     */
    function createCharacter() {
        console.log('执行createCharacter函数');

        const nameInput = document.getElementById('character-name');
        const errorElement = document.getElementById('name-error');

        if (!nameInput || !errorElement) {
            console.error('找不到名称输入框或错误元素');
            return;
        }

        const name = nameInput.value.trim();
        console.log('输入的名称:', name);

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
                attribute: 'fire',
                type: 'attack',
                level: 1,
                isMainCharacter: true
            };

            console.log('调用Character.createMainCharacter方法');
            const characterId = Character.createMainCharacter(characterData);

            if (characterId) {
                console.log('创建主角成功:', name, '(ID:', characterId, ')');

                // 创建初始队伍
                if (typeof Team !== 'undefined' && typeof Team.createTeam === 'function') {
                    const teamData = {
                        name: `${name}的队伍`,
                        members: [characterId]
                    };

                    const teamId = Team.createTeam(teamData);

                    if (teamId && typeof Game !== 'undefined') {
                        Game.state.activeTeamId = teamId;
                        console.log('创建初始队伍成功:', teamData.name, '(ID:', teamId, ')');
                    }
                }

                // 显示欢迎消息
                if (typeof UI !== 'undefined' && typeof UI.showNotification === 'function') {
                    UI.showNotification(`欢迎，${name}！你的冒险即将开始！`, 'success', 5000);
                }

                // 关闭对话框
                closeDialog();

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
    }

    /**
     * 关闭对话框
     */
    function closeDialog() {
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
})();
