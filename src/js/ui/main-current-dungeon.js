const MainCurrentDungeon = {
    /**
     * 初始化
     */
    init() {
        console.log('初始化MainCurrentDungeon组件');

        // 注册事件监听
        if (typeof Events !== 'undefined') {
            // 监听地下城更新事件
            Events.on('dungeon:updated', () => {
                console.log('MainCurrentDungeon收到地下城更新事件');
                this.update();
            });

            // 监听战斗结束事件
            Events.on('battle:end', (data) => {
                console.log('MainCurrentDungeon收到战斗结束事件:', data.victory ? '胜利' : '失败');
                // 如果在地下城中，且战斗失败，更新显示
                if (typeof Dungeon !== 'undefined' && Dungeon.currentRun && !data.victory) {
                    setTimeout(() => this.update(), 500); // 延迟更新，确保DungeonRunner处理完战斗结果
                }
            });
        }

        // 初始更新
        this.update();
    },
    /**
     * 更新当前地下城显示
     */
    update() {
        const container = document.getElementById('main-current-dungeon');
        if (!container) {
            console.error('找不到main-current-dungeon容器');
            return;
        }

        // 首先检查是否有当前正在进行的地下城
        if (Dungeon.currentRun && Dungeon.currentRun.dungeonId) {
            console.log('检测到当前有活跃的地下城运行，显示当前地下城进度');
            this.showCurrentDungeon();
            return;
        }

        // 如果没有当前地下城，检查是否有上一次地下城记录
        const lastRecord = DungeonRunner.getLastDungeonRecord();
        if (lastRecord) {
            // 强制修正森林洞穴地下城的怪物数量
            if (lastRecord.dungeonName === '森林洞穴' || lastRecord.dungeonId === 'forest_cave') {
                console.log('在update方法中强制修正森林洞穴地下城的怪物数量');
                lastRecord.totalMonsters = 5;
                lastRecord.totalMiniBosses = 2;
            }

            console.log('显示上一次地下城记录:', JSON.stringify(lastRecord, null, 2));

            // 检查记录中的关键数据
            console.log('地下城名称:', lastRecord.dungeonName);
            console.log('怪物名称:', lastRecord.monsterName);
            console.log('怪物类型:', lastRecord.monsterType);
            console.log('战败原因:', lastRecord.defeatReason);
            console.log('已击败怪物:', lastRecord.defeatedMonsters, '/', lastRecord.totalMonsters);
            console.log('已击败小BOSS:', lastRecord.defeatedMiniBosses, '/', lastRecord.totalMiniBosses);
            console.log('队伍统计:', lastRecord.teamStats);

            this.showLastDungeonRecord(lastRecord);
            return;
        }

        // 如果既没有当前地下城，也没有上一次记录，显示未进入地下城状态
        this.showNoDungeon();
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
    showCurrentDungeon() {
        const container = document.getElementById('main-current-dungeon');
        if (!container) {
            console.error('找不到main-current-dungeon容器');
            return;
        }

        if (!Dungeon.currentRun) {
            this.showNoDungeon();
            return;
        }

        // 清除上一次地下城记录，确保UI显示当前地下城进度
        if (typeof DungeonRunner !== 'undefined' && typeof DungeonRunner.clearLastDungeonRecord === 'function') {
            console.log('在showCurrentDungeon中清除上一次地下城记录');
            DungeonRunner.clearLastDungeonRecord();
        }

        const dungeon = Dungeon.getDungeon(Dungeon.currentRun.dungeonId);
        if (!dungeon) {
            this.showNoDungeon();
            return;
        }

        console.log('显示当前地下城进度:', Dungeon.currentRun);

        // 使用Dungeon.currentRun.progress作为进度百分比
        let progressPercent = Dungeon.currentRun.progress || 0;

        // 计算总怪物数量和已击败的怪物数量，仅用于显示
        const totalMonsters = Dungeon.currentRun.monsters.length +
                             Dungeon.currentRun.miniBosses.length +
                             (Dungeon.currentRun.finalBoss ? 1 : 0);

        const defeatedMonsters = Dungeon.currentRun.currentMonsterIndex +
                                Dungeon.currentRun.defeatedMiniBosses +
                                (Dungeon.currentRun.isCompleted ? 1 : 0);

        // 显示当前地下城进度信息
        const html = `
            <div class="current-dungeon-info">
                <h3>${dungeon.name}</h3>
                <div class="dungeon-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="progress-text">${progressPercent}%</div>
                </div>
                <div class="dungeon-stats">
                    <p>普通怪物：${Dungeon.currentRun.currentMonsterIndex}/${Dungeon.currentRun.monsters.length}</p>
                    <p>已击败怪物：${Dungeon.currentRun.defeatedMonsters || 0}</p>
                    <p>小BOSS：${Dungeon.currentRun.defeatedMiniBosses}/${Dungeon.currentRun.miniBosses.length}</p>
                    <p>大BOSS：${Dungeon.currentRun.finalBossAppeared ? '已出现' : '未出现'}</p>
                    <p>总进度：${defeatedMonsters}/${totalMonsters}</p>
                </div>
                <div class="dungeon-controls">
                    <button id="main-dungeon-exit-btn" class="dungeon-btn exit-btn">退出地下城</button>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // 添加退出按钮事件监听器
        const exitButton = document.getElementById('main-dungeon-exit-btn');
        if (exitButton) {
            exitButton.addEventListener('click', () => {
                if (typeof DungeonRunner !== 'undefined' && typeof DungeonRunner.exitDungeon === 'function') {
                    // 确认是否退出地下城
                    if (confirm('确定要退出地下城吗？')) {
                        console.log('用户点击了退出地下城按钮');
                        DungeonRunner.exitDungeon();
                    }
                } else {
                    console.error('DungeonRunner.exitDungeon 方法不存在');
                }
            });
        }
    },

    /**
     * 显示未进入地下城状态
     */
    showNoDungeon() {
        const container = document.getElementById('main-current-dungeon');
        if (!container) {
            console.error('找不到main-current-dungeon容器');
            return;
        }

        container.innerHTML = `
            <div class="no-dungeon">
                <p>未进入地下城</p>
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