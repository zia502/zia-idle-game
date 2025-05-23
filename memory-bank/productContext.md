# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
2025-05-08 11:34:53 - Log of updates made will be appended as footnotes to the end of this file.

*

## Project Goal

* Zia 是一个纯文字的地下城冒险游戏，玩家可以组队探索地下城，收集装备，培养角色，挑战各种怪物和boss。游戏专注于团队构建、武器收集和战略战斗，通过纯文本界面为玩家提供沉浸式的冒险体验。

## Key Features

* 角色招募与队伍组建系统
* 多样化的角色类型和属性
* 丰富的武器收集与升级机制
* 多样化的地下城探索
* 自动战斗系统
* 扩展的物品分类与管理系统 (包括通过地下城宝箱获取新的经验材料等物品)
* 装备突破与技能升级
* 数据持久化保存
* 主角专属的职业系统
* 战斗中后排角色自动增援前排机制

## Overall Architecture

* HTML5/CSS3 - 基础页面结构和样式
* JavaScript (ES6+) - 游戏核心逻辑

## Documentation

*   [`docs/battle-logger-usage.md`](docs/battle-logger-usage.md) - BattleLogger 系统使用文档

[2025-05-08 11:44:40] - 更新关键特性，明确职业系统为主角专属。
[2025-05-10 23:31:28] - 添加 BattleLogger 系统文档链接。
[2025-05-12 09:24:14] - 添加“战斗中后排角色自动增援前排机制”到关键特性。
[2025-05-12 16:17:00] - 更新“扩展的物品分类与管理系统”特性，以反映新物品通过宝箱获取。