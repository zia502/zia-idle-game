# BattleLogger 系统文档

## 1. 概述

`BattleLogger` 是一个用于战斗系统的统一日志记录模块。它的主要目的是提供一个结构化、多级别的方式来记录战斗过程中发生的事件。

**好处:**

*   **统一性**: 为所有战斗相关的日志提供单一的来源和格式。
*   **可调试性**: 通过不同级别的日志（特别是 `CONSOLE_DETAIL`），开发者可以深入了解战斗计算的每一步，方便调试和问题定位。
*   **清晰度**: 将面向开发者的详细日志与面向玩家的简洁战斗信息分离开。
*   **可扩展性**: 易于添加新的日志类型或修改现有日志行为。

## 2. 如何使用

### 2.1 访问 BattleLogger

`BattleLogger` 在全局 `window` 对象上可用，可以直接通过 `window.BattleLogger` 或简写为 `BattleLogger` 来访问（如果当前作用域没有其他同名变量）。

```javascript
// 示例：访问 BattleLogger
const logger = window.BattleLogger;
// 或者直接使用
BattleLogger.log(BattleLogger.levels.CONSOLE_INFO, "战斗开始");
```

### 2.2 `BattleLogger.log()` 方法

核心的日志记录方法是 `BattleLogger.log()`。

**方法签名:**

`BattleLogger.log(level, message, details, turn)`

**参数:**

*   `level` (String):必需。日志级别，决定日志的类型和输出位置。必须是 `BattleLogger.levels` 对象中的一个值。
*   `message` (String): 必需。要记录的主要日志信息。
*   `details` (Object | Array | String | Number, 可选): 可选。一个包含额外结构化信息的对象或数组，通常用于 `CONSOLE_DETAIL` 级别，以提供计算过程、状态变化等详细数据。也可以是简单的字符串或数字。
*   `turn` (Number, 可选): 可选。当前的战斗回合数。如果提供，会自动包含在控制台日志的前缀中。

### 2.3 `BattleLogger.levels` 日志级别

`BattleLogger` 定义了以下三个日志级别：

*   **`BattleLogger.levels.CONSOLE_DETAIL`**:
    *   **用途**: 用于记录非常详细的调试信息，主要给开发者在控制台查看。这包括详细的计算步骤、中间值、对象状态等。
    *   **输出**: 仅输出到浏览器的开发者控制台。
    *   **特点**: 通常会结合 `details` 参数来输出结构化的详细数据，这些数据可能会分多行显示以便阅读。

*   **`BattleLogger.levels.CONSOLE_INFO`**:
    *   **用途**: 用于记录一般的、信息性的战斗事件，主要给开发者在控制台查看。例如，角色执行了某个动作，某个状态触发等。
    *   **输出**: 仅输出到浏览器的开发者控制台。
    *   **特点**: 比 `CONSOLE_DETAIL` 简洁，但仍提供有用的上下文信息。

*   **`BattleLogger.levels.BATTLE_LOG`**:
    *   **用途**: 用于记录简洁的、给玩家看的战斗信息。这些信息会显示在游戏的战斗日志界面上。
    *   **输出**: 输出到游戏内的战斗日志界面，也可能同时输出一份到控制台（通常是简化版）。
    *   **特点**: 信息必须简洁明了，易于玩家理解。

### 2.4 代码示例

#### 示例 1: 记录详细的伤害计算过程 (使用 `CONSOLE_DETAIL`)

```javascript
// 假设在伤害计算函数内部
const attacker = { name: "英雄", attack: 150 };
const defender = { name: "怪物", defense: 50, hp: 200 };
const skillDamageMultiplier = 1.2;
const baseDamage = attacker.attack * skillDamageMultiplier;
const finalDamage = Math.max(1, baseDamage - defender.defense);
const hpBefore = defender.hp;
defender.hp -= finalDamage;
const hpAfter = defender.hp;
const currentTurn = 5;

BattleLogger.log(
    BattleLogger.levels.CONSOLE_DETAIL,
    `${attacker.name} 对 ${defender.name} 使用技能造成伤害`,
    {
        attackerName: attacker.name,
        defenderName: defender.name,
        calculation: {
            attackerAttack: attacker.attack,
            skillMultiplier: skillDamageMultiplier,
            baseDamage: baseDamage,
            defenderDefense: defender.defense,
            finalDamageCalculated: finalDamage
        },
        hpChange: {
            target: defender.name,
            hpBefore: hpBefore,
            damageApplied: finalDamage,
            hpAfter: hpAfter
        }
    },
    currentTurn
);

/*
可能的控制台输出 (CONSOLE_DETAIL):
[战斗][回合 5] 英雄 对 怪物 使用技能造成伤害
  Details:
    attackerName: "英雄"
    defenderName: "怪物"
    calculation:
      attackerAttack: 150
      skillMultiplier: 1.2
      baseDamage: 180
      defenderDefense: 50
      finalDamageCalculated: 130
    hpChange:
      target: "怪物"
      hpBefore: 200
      damageApplied: 130
      hpAfter: 70
*/
```

#### 示例 2: 记录一般的技能使用信息 (使用 `CONSOLE_INFO`)

```javascript
const characterName = "法师";
const skillName = "火球术";
const targetName = "哥布林";
const currentTurn = 3;

BattleLogger.log(
    BattleLogger.levels.CONSOLE_INFO,
    `${characterName} 对 ${targetName} 施放了 ${skillName}。`,
    null, // details 为 null 或省略
    currentTurn
);

/*
可能的控制台输出 (CONSOLE_INFO):
[战斗][回合 3] 法师 对 哥布林 施放了 火球术。
*/
```

#### 示例 3: 记录给玩家看的战斗日志 (使用 `BATTLE_LOG`)

```javascript
const attackerName = "勇者";
const defenderName = "恶龙";
const damageDealt = 250;
const currentTurn = 10; // 回合数对于 BATTLE_LOG 通常由UI层面处理或不直接显示

BattleLogger.log(
    BattleLogger.levels.BATTLE_LOG,
    `${attackerName} 攻击了 ${defenderName}，造成了 ${damageDealt} 点伤害！`
    // details 和 turn 通常对 BATTLE_LOG 不是必需的，或由UI自行处理
);

/*
可能的界面战斗日志输出 (BATTLE_LOG):
勇者 攻击了 恶龙，造成了 250 点伤害！

可能的控制台输出 (如果 BATTLE_LOG 也镜像到控制台):
[战斗] 勇者 攻击了 恶龙，造成了 250 点伤害！
*/
```

## 3. 日志格式

### 3.1 控制台日志前缀

所有通过 `BattleLogger` 输出到控制台的日志（`CONSOLE_DETAIL` 和 `CONSOLE_INFO`）都会带有 `[战斗]` 前缀。如果 `turn` 参数被提供给 `BattleLogger.log()` 方法，前缀会变为 `[战斗][回合 X]`，其中 `X` 是当前的回合数。

例如:
`[战斗][回合 1] 玩家回合开始`
`[战斗] 怪物使用了防御技能`

### 3.2 `CONSOLE_DETAIL` 细节显示

当使用 `BattleLogger.levels.CONSOLE_DETAIL` 级别并提供了 `details` 对象时，这些细节通常会以结构化的方式分行显示在主 `message` 之下，以便于阅读和分析复杂的计算过程或状态。

例如，在伤害计算中：
*   攻击力计算步骤
*   防御力影响
*   最终伤害值
*   目标 HP 扣除前后的状态

这些都会清晰地列出，如示例1所示。

## 4. 集成点

`BattleLogger` 已经被集成到游戏的核心战斗逻辑中，以取代旧的日志记录方式并提供更丰富的日志信息。

主要涉及的文件有：

*   **新文件**: [`src/js/core/battle-logger.js`](src/js/core/battle-logger.js:0) - `BattleLogger` 模块的实现。
*   **修改文件**: [`src/js/core/battle.js`](src/js/core/battle.js:0) - 核心战斗逻辑文件，所有原有的 `Battle.logBattle()` 调用已被替换为新的 `BattleLogger.log()` 调用。

关键的集成节点包括：

*   伤害计算函数 (例如 `applyDamageToTarget`)
*   技能使用处理 (例如 `processCharacterSkills`, `processMonsterAction`)
*   普通攻击执行 (例如 `executeNormalAttack`)
*   BUFF/DEBUFF 效果的更新与处理 (例如 `updateBuffDurations`, `processTurnStartBuffs`)
*   回合开始/结束等关键战斗阶段。

通过这些集成点，`BattleLogger` 能够捕获战斗流程中大部分重要事件的详细信息。