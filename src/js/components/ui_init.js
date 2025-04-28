/**
 * UI模块 - 负责管理游戏界面和用户交互元素
 */
const UI = {
    /**
     * 当前活跃的屏幕
     */
    activeScreen: null,
    
    /**
     * 通知列表
     */
    notifications: [],
    
    /**
     * 初始化UI系统
     */
    init() {
        console.log('UI系统初始化');
        this.setupEventListeners();
        this.createUIElements();
        
        // 默认显示主屏幕
        this.switchScreen('main-screen');
    },
    
    /**
     * 设置UI事件监听
     */
    setupEventListeners() {
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.adjustLayout();
        });
        
        // 添加导航按钮事件监听
        document.querySelectorAll('[data-screen]').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetScreen = e.target.getAttribute('data-screen');
                if (targetScreen) {
                    this.switchScreen(targetScreen);
                    console.log(`切换到屏幕: ${targetScreen}`);
                }
            });
        });
        
        // 添加保存和重置按钮事件
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (typeof Game !== 'undefined' && typeof Game.saveGame === 'function') {
                    Game.saveGame();
                    this.showNotification('游戏已保存', 'success');
                }
            });
        }
        
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('确定要重置游戏吗？所有进度将会丢失。')) {
                    if (typeof Game !== 'undefined' && typeof Game.resetGame === 'function') {
                        Game.resetGame();
                        this.showNotification('游戏已重置', 'info');
                    }
                }
            });
        }
    },
};
