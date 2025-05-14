## 核心产品理念

Zia 是一款纯文字的地下城冒险游戏，核心体验围绕团队构建、武器收集与策略战斗。

## 当前主要目标/里程碑

*   **短期**: 解决 ES6 模块化后技能导入失败的问题。 (进行中)
*   **中期**: 完善游戏核心循环，包括角色成长、地下城挑战、装备获取。
*   **长期**: 扩展游戏内容，增加更多职业、技能、敌人和剧情。

## 关键技术栈/架构特点

*   前端：HTML, CSS, JavaScript (ES6 模块化)
*   数据存储：JSON 文件
*   核心逻辑：纯客户端 JavaScript

## 主要模块/组件

*   `Game`: 游戏主逻辑
*   `Character`: 角色系统
*   `JobSystem`: 职业系统
*   `SkillLoader`: 技能加载
*   `BattleSystem`: 战斗系统
*   `DungeonRunner`: 地下城运行
*   `UI`: 用户界面管理
*   `Events`: 事件系统

## 当前上下文/正在处理的问题

*   [2025-05-14 22:53:00] - Debug Status Update: 开始调查技能导入问题。用户报告在使用 ES6 标准后出现此问题。初步检查 `index.html`, `package.json` 和技能 JSON 文件，未发现明显配置错误。怀疑 `skill-loader.js` 中动态导入 JSON 的方式存在问题。
*   [2025-05-14 22:53:00] - Debug Status Update: 决定修改 `skill-loader.js`，将浏览器环境下加载 JSON 的逻辑从 `fetch().then().then()` 改为 `async/await` 配合 `response.json()`，以提高加载的稳定性和代码一致性。
*   [2025-05-14 22:54:00] - Debug Status Update: 已将 `src/js/core/skill-loader.js` 中浏览器环境的 JSON 加载逻辑修改为使用 `async/await` 和 `response.json()`。

## 最近的变更/决策

*   项目已迁移到 ES6 模块化。
*   [`src/js/core/skill-loader.js`](src/js/core/skill-loader.js) 已被修改，以优化 JSON 加载方式（使用 `async/await` 和 `response.json()`）。

## 开放性问题/待办事项

*   用户需测试修改后的 `skill-loader.js` 是否能解决技能导入问题。
*   如果问题依旧，需要进一步检查服务器MIME类型配置或更深层次的浏览器兼容性问题。
*   考虑是否需要将 `SkillLoader.init()` 方法也改为异步，并处理其调用处的 Promise。

## Memory Bank 元数据

*   上次 UMB 时间: N/A (首次初始化 Memory Bank)
*   上次 UMB 触发器: N/A
