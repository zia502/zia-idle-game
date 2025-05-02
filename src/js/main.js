/**
 * 主入口文件 - 负责初始化游戏
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化游戏...');

    try {
        // 检查并初始化依赖模块
        if (typeof Events === 'undefined') {
            throw new Error('找不到Events模块');
        }

        // 首先初始化事件系统
        console.log('初始化事件系统...');
        Events.init();

        // 初始化资源系统
        if (typeof Resources !== 'undefined') {
            console.log('初始化资源系统...');
            Resources.init();
        } else {
            console.warn('找不到Resources模块，跳过初始化');
        }

        // 初始化建筑系统
        if (typeof Buildings !== 'undefined') {
            console.log('初始化建筑系统...');
            Buildings.init();
        } else {
            console.warn('找不到Buildings模块，跳过初始化');
        }

        // 初始化物品系统
        if (typeof Item !== 'undefined') {
            console.log('初始化物品系统...');
            Item.init();
        } else {
            console.warn('找不到Item模块，跳过初始化');
        }

        // 初始化武器系统
        if (typeof Weapon !== 'undefined') {
            console.log('初始化武器系统...');
            Weapon.init();

            // 监听武器模板加载完成事件
            Events.on('weaponTemplate:loaded', () => {
                console.log('武器模板加载完成，更新UI');
                UI.renderWeaponInventory();
            });
        } else {
            console.warn('找不到Weapon模块，跳过初始化');
        }

        // 初始化职业技能模板系统
        if (typeof JobSkillsTemplate !== 'undefined') {
            console.log('初始化职业技能模板系统...');
            JobSkillsTemplate.init();

            // 监听技能模板加载完成事件，然后再初始化职业系统
            Events.on('jobSkillsTemplate:loaded', function() {
                console.log('技能模板加载完成，现在初始化职业系统...');

                // 初始化职业系统
                if (typeof JobSystem !== 'undefined') {
                    console.log('初始化职业系统...');
                    JobSystem.init();

                    // 监听职业系统就绪事件，然后再触发游戏加载完成事件
                    Events.on('jobSystem:ready', function() {
                        // 通知游戏加载完成（只触发一次）
                        if (!window.gameLoadedEmitted) {
                            window.gameLoadedEmitted = true;
                            console.log('职业系统就绪，现在触发游戏加载完成事件');

                            // 延迟一点时间，确保所有系统都已初始化
                            setTimeout(() => {
                                Events.emit('game:loaded');
                            }, 100);
                        }
                    });
                } else {
                    console.warn('找不到JobSystem模块，跳过初始化');
                }
            });
        } else {
            console.warn('找不到JobSkillsTemplate模块，跳过初始化');

            // 如果没有技能模板系统，仍然初始化职业系统
            if (typeof JobSystem !== 'undefined') {
                console.log('初始化职业系统...');
                JobSystem.init();
            } else {
                console.warn('找不到JobSystem模块，跳过初始化');
            }
        }

        // 初始化角色系统 - 在职业系统就绪后初始化
        Events.on('jobSystem:ready', function() {
            console.log('职业系统就绪，现在初始化角色系统...');

            if (typeof Character !== 'undefined') {
                console.log('初始化角色系统...');
                Character.init();
            } else {
                console.warn('找不到Character模块，跳过初始化');
            }
        });

        // 初始化背包系统
        if (typeof Inventory !== 'undefined') {
            console.log('初始化背包系统...');
            Inventory.init();
        } else {
            console.warn('找不到Inventory模块，跳过初始化');
        }

        // 初始化商店系统
        if (typeof Shop !== 'undefined') {
            console.log('初始化商店系统...');
            Shop.init();
        } else {
            console.warn('找不到Shop模块，跳过初始化');
        }

        // 初始化队伍系统
        if (typeof Team !== 'undefined') {
            console.log('初始化队伍系统...');
            Team.init();
        } else {
            console.warn('找不到Team模块，跳过初始化');
        }

        // 初始化BUFF系统
        if (typeof BuffSystem !== 'undefined') {
            console.log('初始化BUFF系统...');
            BuffSystem.init();
        } else {
            console.warn('找不到BuffSystem模块，跳过初始化');
        }

        // 初始化武器盘加成系统
        if (typeof WeaponBoardBonusSystem !== 'undefined') {
            console.log('初始化武器盘加成系统...');
            WeaponBoardBonusSystem.init();
        } else {
            console.warn('找不到WeaponBoardBonusSystem模块，跳过初始化');
        }

        // 在职业系统就绪后初始化UI系统
        Events.on('jobSystem:ready', function() {
            console.log('职业系统就绪，现在初始化UI系统...');

            // 初始化UI系统
            if (typeof UI !== 'undefined') {
                console.log('初始化UI系统...');
                UI.init();
            } else {
                console.warn('找不到UI模块，跳过初始化');
            }

            // 初始化技能提示框
            if (typeof SkillTooltip !== 'undefined') {
                console.log('初始化技能提示框...');
                SkillTooltip.init();
            } else {
                console.warn('找不到SkillTooltip模块，跳过初始化');
            }
        });

        // 最后初始化游戏核心
        if (typeof Game !== 'undefined') {
            console.log('初始化游戏核心...');
            Game.init();

            // 更新金币显示
            const goldElement = document.getElementById('gold-display');
            if (goldElement) {
                goldElement.textContent = `金币: ${Game.state.gold}`;
            }

            // 游戏初始化完成，但不在这里触发game:loaded事件
            // 而是在JobSystem就绪后触发
            console.log('游戏初始化完成!');

            // 输出调试信息
            if (typeof Debug !== 'undefined' && typeof Debug.logGameState === 'function') {
                console.log('输出游戏状态调试信息...');
                setTimeout(() => Debug.logGameState(), 1000);
            }
        } else {
            throw new Error('找不到Game模块');
        }
    } catch (error) {
        console.error('游戏初始化失败:', error);
        alert('游戏初始化失败: ' + error.message);
    }
});

// 页面关闭前保存游戏状态
window.addEventListener('beforeunload', function() {
    console.log('页面即将关闭，保存游戏状态...');

    // 保存游戏状态
    if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
        Game.saveGame();
    }
});