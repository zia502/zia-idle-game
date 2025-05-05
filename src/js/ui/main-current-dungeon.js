const MainCurrentDungeon = {
    /**
     * 更新当前地下城显示
     */
    update() {
        const container = document.getElementById('current-dungeon-container');
        if (!container) return;

        // 检查是否有上一次地下城记录
        const lastRecord = DungeonRunner.getLastDungeonRecord();
        if (lastRecord) {
            console.log('显示上一次地下城记录:', lastRecord);
            this.showLastDungeonRecord(lastRecord);
            return;
        }

        // 如果没有记录，显示当前地下城信息
        if (Dungeon.currentRun) {
            this.showCurrentDungeon();
        } else {
            this.showNoDungeon();
        }
    },

    /**
     * 显示上一次地下城记录
     * @param {object} record - 地下城记录
     */
    showLastDungeonRecord(record) {
        const container = document.getElementById('current-dungeon-container');
        if (!container) return;

        // 创建记录显示HTML
        let html = `
            <div class="last-dungeon-record">
                <h3>上一次地下城记录</h3>
                <div class="record-info">
                    <p>地下城：${record.dungeonName}</p>
                    <p>层数：第 ${record.floor} 层</p>
                    <p>战败怪物：${record.monsterName} (${record.monsterType})</p>
                    <p>战败原因：${record.defeatReason}</p>
                    <p>已击败怪物：${record.defeatedMonsters || 0}/${record.totalMonsters || 0}</p>
                    <p>已击败小BOSS：${record.defeatedMiniBosses || 0}/${record.totalMiniBosses || 0}</p>
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
        const container = document.getElementById('current-dungeon-container');
        if (!container) return;

        if (!Dungeon.currentRun) {
            this.showNoDungeon();
            return;
        }

        const dungeon = Dungeon.getDungeon(Dungeon.currentRun.dungeonId);
        if (!dungeon) {
            this.showNoDungeon();
            return;
        }

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
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * 显示未进入地下城状态
     */
    showNoDungeon() {
        const container = document.getElementById('current-dungeon-container');
        if (!container) return;

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