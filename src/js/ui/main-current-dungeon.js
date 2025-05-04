const MainCurrentDungeon = {
    /**
     * 更新当前地下城显示
     */
    update() {
        // 检查是否有上一次地下城记录
        const lastRecord = DungeonRunner.getLastDungeonRecord();
        if (lastRecord) {
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
     * 开始新地下城时清除记录
     */
    startNewDungeon() {
        DungeonRunner.clearLastDungeonRecord();
        this.update();
    }
}; 