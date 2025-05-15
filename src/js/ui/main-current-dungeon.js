const MainCurrentDungeon = {
    /**
     * 初始化
     */
    init() {
        console.log('MainCurrentDungeon: 初始化组件');

        // 注册事件监听
        if (typeof Events !== 'undefined') {
            Events.on('dungeon:updated', (data) => {
                console.log('MainCurrentDungeon: 收到 dungeon:updated 事件', data);
                this.update();
            });

            Events.on('battle:end', (data) => {
                console.log('MainCurrentDungeon: 收到 battle:end 事件:', data.victory ? '胜利' : '失败');
                if (typeof Dungeon !== 'undefined' && Dungeon.currentRun && !data.victory) {
                    setTimeout(() => this.update(), 500);
                }
            });
            
            Events.on('dungeon:initialized', () => {
                console.log('MainCurrentDungeon: 收到 dungeon:initialized 事件');
                this.update();
            });
        }

        // 初始更新
        if (typeof Dungeon !== 'undefined' && Dungeon.isInitialized) {
            console.log('MainCurrentDungeon: Dungeon 已初始化，立即更新');
            this.update();
        } else {
            console.log('MainCurrentDungeon: Dungeon 未初始化，等待 dungeon:initialized 事件');
            // 可以在此处显示一个初始的“加载中”状态，如果 update 方法还没有处理
            this.showNoDungeon("地城数据加载中...");
        }
    },
    /**
     * 更新当前地下城显示
     */
    update() {
        const container = document.getElementById('main-current-dungeon');
        if (!container) {
            console.error('MainCurrentDungeon: 找不到 main-current-dungeon 容器');
            return;
        }

        if (typeof Dungeon === 'undefined' || !Dungeon.isInitialized) {
            console.log('MainCurrentDungeon: Dungeon 模块未定义或未初始化，显示加载中...');
            this.showNoDungeon("地城数据加载中...");
            return;
        }

        const currentRunData = Dungeon.currentRun;

        if (currentRunData && currentRunData.dungeonId) {
            console.log('MainCurrentDungeon: 检测到当前有活跃的地下城运行，显示当前地下城进度', currentRunData);
            this.showCurrentDungeon(currentRunData);
        } else {
            // 如果没有当前地下城，检查是否有上一次地下城记录
            const lastRecord = typeof DungeonRunner !== 'undefined' && DungeonRunner.getLastDungeonRecord ? DungeonRunner.getLastDungeonRecord() : null;
            if (lastRecord) {
                // 强制修正森林洞穴地下城的怪物数量 (此逻辑可考虑是否保留或移至 DungeonRunner)
                if (lastRecord.dungeonName === '森林洞穴' || lastRecord.dungeonId === 'forest_cave') {
                    lastRecord.totalMonsters = 5;
                    lastRecord.totalMiniBosses = 2;
                }
                console.log('MainCurrentDungeon: 显示上一次地下城记录:', JSON.stringify(lastRecord, null, 2));
                this.showLastDungeonRecord(lastRecord);
            } else {
                // 如果既没有当前地下城，也没有上一次记录，显示未进入地下城状态
                console.log('MainCurrentDungeon: 没有当前运行的地下城，也没有上一条记录');
                this.showNoDungeon();
            }
        }
    },

    /**
     * 显示上一次地下城记录
     * @param {object} record - 地下城记录
     */
    showLastDungeonRecord(record) {
        const container = document.getElementById('main-current-dungeon');
        if (!container) {
            console.error('找不到main-current-dungeon容器');
            return;
        }

        // 强制修正森林洞穴地下城的怪物数量
        if (record.dungeonName === '森林洞穴' || record.dungeonId === 'forest_cave') {
            console.log('强制修正森林洞穴地下城的怪物数量');
            record.totalMonsters = 5;
            record.totalMiniBosses = 2;
        }

        // 创建记录显示HTML
        let html = `
            <div class="last-dungeon-record">
                <h3>上一次地下城记录</h3>
                <div class="record-info">
                    <p>地下城：${record.dungeonName}</p>
                    ${record.floor ? `<p>层数：第 ${record.floor} 层</p>` : ''}
                    <p>战败怪物：${record.monsterName} (${record.monsterType})</p>
                    <p>战败原因：${record.defeatReason}</p>
                </div>
                <div class="team-stats">
                    <h4>队伍统计</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>角色</th>
                                <th>总伤害</th>
                                <th>总治疗</th>
                                <th>连击次数</th>
                                <th>三连击次数</th>
                                <th>暴击次数</th>
                                <th>状态</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        // 添加每个队员的统计信息
        if (record.teamStats && record.teamStats.length > 0) {
            record.teamStats.forEach(member => {
                html += `
                    <tr>
                        <td>${member.name}</td>
                        <td>${member.totalDamage}</td>
                        <td>${member.totalHealing}</td>
                        <td>${member.daCount}</td>
                        <td>${member.taCount}</td>
                        <td>${member.critCount}</td>
                        <td>${member.isAlive ? '存活' : '阵亡'}</td>
                    </tr>
                `;
            });
        } else {
            html += `
                <tr>
                    <td colspan="7" style="text-align: center;">无队伍统计数据</td>
                </tr>
            `;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * 显示当前地下城信息
     */
    showCurrentDungeon(currentRunData) {
        const container = document.getElementById('main-current-dungeon');
        if (!container) {
            console.error('MainCurrentDungeon: 找不到 main-current-dungeon 容器');
            return;
        }

        if (!currentRunData || !currentRunData.dungeonId) {
            console.log('MainCurrentDungeon: showCurrentDungeon - 无效的 currentRunData 或 dungeonId，显示无地城状态');
            this.showNoDungeon();
            return;
        }

        // 清除上一次地下城记录，确保UI显示当前地下城进度
        if (typeof DungeonRunner !== 'undefined' && typeof DungeonRunner.clearLastDungeonRecord === 'function') {
            console.log('MainCurrentDungeon: 在 showCurrentDungeon 中清除上一次地下城记录');
            DungeonRunner.clearLastDungeonRecord();
        }

        const staticDungeonData = Dungeon.getDungeon(currentRunData.dungeonId);
        if (!staticDungeonData) {
            console.error(`MainCurrentDungeon: showCurrentDungeon - 无法获取地城静态数据 for ID: ${currentRunData.dungeonId}`);
            this.showNoDungeon("地城数据错误");
            return;
        }

        const dungeonName = currentRunData.dungeonName || staticDungeonData.name;
        console.log('MainCurrentDungeon: 显示当前地下城进度:', currentRunData);

        let progressPercent = currentRunData.progress || 0;

        // 确保 monsters 和 miniBosses 是数组
        const monstersArray = Array.isArray(currentRunData.monsters) ? currentRunData.monsters : [];
        const miniBossesArray = Array.isArray(currentRunData.miniBosses) ? currentRunData.miniBosses : [];
        
        const totalMonstersInRun = monstersArray.length +
                                   miniBossesArray.length +
                                   (currentRunData.finalBoss ? 1 : 0);

        const defeatedMonstersInRun = (currentRunData.currentMonsterIndex || 0) +
                                      (currentRunData.defeatedMiniBosses || 0) +
                                      (currentRunData.isCompleted && currentRunData.finalBossAppeared ? 1 : 0);

        const html = `
            <div class="current-dungeon-info">
                <h3>${dungeonName}</h3>
                <div class="dungeon-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="progress-text">${progressPercent}%</div>
                </div>
                <div class="dungeon-stats">
                    <p>普通怪物：${currentRunData.currentMonsterIndex || 0}/${monstersArray.length}</p>
                    <p>已击败怪物（本轮）：${currentRunData.defeatedMonsters || 0}</p>
                    <p>小BOSS：${currentRunData.defeatedMiniBosses || 0}/${miniBossesArray.length}</p>
                    <p>大BOSS：${currentRunData.finalBossAppeared ? '已出现' : '未出现'}</p>
                    <p>总进度（本轮）：${defeatedMonstersInRun}/${totalMonstersInRun}</p>
                </div>
                <div class="dungeon-controls">
                    <button id="main-dungeon-exit-btn" class="dungeon-btn exit-btn">退出地下城</button>
                </div>
            </div>
        `;

        container.innerHTML = html;

        const exitButton = document.getElementById('main-dungeon-exit-btn');
        if (exitButton) {
            exitButton.addEventListener('click', () => {
                if (typeof DungeonRunner !== 'undefined' && typeof DungeonRunner.exitDungeon === 'function') {
                    if (confirm('确定要退出地下城吗？')) {
                        console.log('MainCurrentDungeon: 用户点击了退出地下城按钮');
                        DungeonRunner.exitDungeon(); // DungeonRunner.exitDungeon 应该会触发 dungeon:updated 事件
                    }
                } else {
                    console.error('MainCurrentDungeon: DungeonRunner.exitDungeon 方法不存在');
                }
            });
        }
    },

    /**
     * 显示未进入地下城状态
     */
    showNoDungeon(message = "未进入地下城") {
        const container = document.getElementById('main-current-dungeon');
        if (!container) {
            console.error('MainCurrentDungeon: 找不到 main-current-dungeon 容器');
            return;
        }

        container.innerHTML = `
            <div class="no-dungeon">
                <p>${message}</p>
            </div>
        `;
    },

    /**
     * 开始新地下城时清除记录
     */
    startNewDungeon() {
        DungeonRunner.clearLastDungeonRecord();
        this.update();
    }
};