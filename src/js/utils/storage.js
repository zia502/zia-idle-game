/**
 * 存储工具 - 负责游戏数据的存储和加载
 */
const Storage = {
    /**
     * 保存数据到本地存储
     * @param {string} key - 存储键名
     * @param {object} data - 要保存的数据
     * @returns {boolean} 是否保存成功
     */
    save(key, data) {
        try {
            // 添加调试信息
            if (key === 'gameData' && data.team && data.team.teams) {
                console.log('保存游戏数据 - 队伍信息:');
                const teamCount = Object.keys(data.team.teams).length;
                console.log(`队伍数量: ${teamCount}`);

                if (teamCount > 0) {
                    Object.entries(data.team.teams).forEach(([teamId, team]) => {
                        console.log(`队伍: ${team.name} (ID: ${teamId}), 成员数: ${team.members ? team.members.length : 0}`);
                    });
                }

                if (data.state && data.state.activeTeamId) {
                    console.log(`当前活动队伍ID: ${data.state.activeTeamId}`);
                    const activeTeam = data.team.teams[data.state.activeTeamId];
                    if (activeTeam) {
                        console.log(`活动队伍: ${activeTeam.name}, 成员数: ${activeTeam.members ? activeTeam.members.length : 0}`);
                    } else {
                        console.warn(`活动队伍ID ${data.state.activeTeamId} 在保存的队伍中不存在!`);
                    }
                }
            }

            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    },

    /**
     * 从本地存储加载数据
     * @param {string} key - 存储键名
     * @returns {object|null} 加载的数据或null
     */
    load(key) {
        try {
            const serialized = localStorage.getItem(key);
            if (serialized === null) return null;

            const data = JSON.parse(serialized);

            // 添加调试信息
            if (key === 'gameData' && data.team && data.team.teams) {
                console.log('加载游戏数据 - 队伍信息:');
                const teamCount = Object.keys(data.team.teams).length;
                console.log(`队伍数量: ${teamCount}`);

                if (teamCount > 0) {
                    Object.entries(data.team.teams).forEach(([teamId, team]) => {
                        console.log(`队伍: ${team.name} (ID: ${teamId}), 成员数: ${team.members ? team.members.length : 0}`);
                    });
                }

                if (data.state && data.state.activeTeamId) {
                    console.log(`当前活动队伍ID: ${data.state.activeTeamId}`);
                    const activeTeam = data.team.teams[data.state.activeTeamId];
                    if (activeTeam) {
                        console.log(`活动队伍: ${activeTeam.name}, 成员数: ${activeTeam.members ? activeTeam.members.length : 0}`);
                    } else {
                        console.warn(`活动队伍ID ${data.state.activeTeamId} 在加载的队伍中不存在!`);

                        // 修复活动队伍ID
                        if (teamCount > 0) {
                            const firstTeamId = Object.keys(data.team.teams)[0];
                            console.log(`自动修复: 将活动队伍ID设置为第一个队伍 ${firstTeamId}`);
                            data.state.activeTeamId = firstTeamId;
                        } else {
                            console.log('没有可用队伍，将活动队伍ID设置为null');
                            data.state.activeTeamId = null;
                        }
                    }
                }
            }

            return data;
        } catch (error) {
            console.error('加载数据失败:', error);
            return null;
        }
    },

    /**
     * 删除本地存储中的数据
     * @param {string} key - 存储键名
     * @returns {boolean} 是否删除成功
     */
    remove(key) {
        try {
            console.log(`正在删除本地存储数据: ${key}`);

            // 检查数据是否存在
            const exists = localStorage.getItem(key) !== null;
            console.log(`数据${exists ? '存在' : '不存在'}`);

            // 删除数据
            localStorage.removeItem(key);

            // 验证是否删除成功
            const stillExists = localStorage.getItem(key) !== null;
            console.log(`删除${stillExists ? '失败' : '成功'}`);

            return !stillExists;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    },

    /**
     * 将数据保存到本地文件
     * @param {object} data - 要保存的数据
     * @param {string} filename - 文件名
     */
    saveToFile(data, filename = 'rpg_game_save.json') {
        try {
            const serialized = JSON.stringify(data, null, 2);
            const blob = new Blob([serialized], {type: 'application/json'});
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 0);

            return true;
        } catch (error) {
            console.error('保存到文件失败:', error);
            return false;
        }
    },

    /**
     * 从文件加载数据
     * @param {Function} callback - 回调函数，接收加载的数据
     */
    loadFromFile(callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) {
                callback(null);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    callback(data);
                } catch (error) {
                    console.error('解析文件失败:', error);
                    callback(null);
                }
            };

            reader.readAsText(file);
        };

        input.click();
    },

    /**
     * 简单加密数据
     * @param {string} data - 要加密的数据
     * @param {string} key - 加密密钥
     * @returns {string} 加密后的数据
     */
    encrypt(data, key) {
        // 简单的XOR加密，仅用于基本混淆
        let result = '';
        for (let i = 0; i < data.length; i++) {
            result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result); // Base64编码
    },

    /**
     * 解密数据
     * @param {string} encryptedData - 加密的数据
     * @param {string} key - 解密密钥
     * @returns {string} 解密后的数据
     */
    decrypt(encryptedData, key) {
        try {
            const data = atob(encryptedData); // Base64解码
            let result = '';
            for (let i = 0; i < data.length; i++) {
                result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        } catch (error) {
            console.error('解密数据失败:', error);
            return null;
        }
    }
};