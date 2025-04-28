/**
 * 调试工具 - 用于调试游戏状态
 */
const Debug = {
    /**
     * 输出当前游戏状态
     */
    logGameState() {
        console.log('===== 游戏状态调试信息 =====');
        
        // 检查Game模块
        if (typeof Game !== 'undefined') {
            console.log('Game模块存在');
            console.log(`活动队伍ID: ${Game.state.activeTeamId || '无'}`);
            
            // 检查Game.getActiveTeam方法
            if (typeof Game.getActiveTeam === 'function') {
                const activeTeam = Game.getActiveTeam();
                console.log(`活动队伍: ${activeTeam ? activeTeam.name : '无'}`);
            }
        } else {
            console.log('Game模块不存在');
        }
        
        // 检查Team模块
        if (typeof Team !== 'undefined') {
            console.log('Team模块存在');
            console.log(`队伍数量: ${Object.keys(Team.teams).length}`);
            
            // 输出所有队伍
            Object.entries(Team.teams).forEach(([teamId, team]) => {
                console.log(`队伍: ${team.name} (ID: ${teamId}), 成员数: ${team.members ? team.members.length : 0}`);
                if (team.members && team.members.length > 0) {
                    console.log(`队伍 ${team.name} 成员: ${team.members.join(', ')}`);
                }
            });
            
            // 检查活动队伍
            if (typeof Game !== 'undefined' && Game.state.activeTeamId) {
                const team = Team.getTeam(Game.state.activeTeamId);
                if (team) {
                    console.log(`活动队伍存在于Team.teams中: ${team.name}`);
                } else {
                    console.log(`活动队伍ID ${Game.state.activeTeamId} 在Team.teams中不存在`);
                }
            }
        } else {
            console.log('Team模块不存在');
        }
        
        // 检查localStorage
        if (typeof localStorage !== 'undefined') {
            console.log('localStorage存在');
            const gameData = localStorage.getItem('gameData');
            if (gameData) {
                try {
                    const data = JSON.parse(gameData);
                    console.log('localStorage中的游戏数据:');
                    console.log(`活动队伍ID: ${data.state && data.state.activeTeamId ? data.state.activeTeamId : '无'}`);
                    
                    if (data.team && data.team.teams) {
                        console.log(`localStorage中的队伍数量: ${Object.keys(data.team.teams).length}`);
                        
                        // 检查活动队伍是否存在于localStorage中
                        if (data.state && data.state.activeTeamId) {
                            const teamExists = data.team.teams[data.state.activeTeamId] !== undefined;
                            console.log(`活动队伍ID ${data.state.activeTeamId} 在localStorage中${teamExists ? '存在' : '不存在'}`);
                        }
                    } else {
                        console.log('localStorage中没有队伍数据');
                    }
                } catch (error) {
                    console.error('解析localStorage中的游戏数据失败:', error);
                }
            } else {
                console.log('localStorage中没有游戏数据');
            }
        } else {
            console.log('localStorage不存在');
        }
        
        console.log('===== 调试信息结束 =====');
    }
};
