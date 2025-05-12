# 测试用例：攻击Buff叠加（聂查瓦尔皮利 - 一伐架式）

**最后更新时间:** 2025-05-12 10:00:00

**测试目标：** 验证 `stackable: true` 和 `stackable: false` 的攻击buff同时存在时，攻击力计算的正确性，特别是针对角色 '聂查瓦尔皮利' 的2格技能 "一伐架式"。

**相关用户反馈：** 用户反馈说 `stackable: true` 和 `stackable: false` 的攻击buff同时生效了。

**涉及角色与技能：**

*   **角色：** '聂查瓦尔皮利' (ID: `character_036`)
    *   相关文件: [`src/data/ssr.json`](src/data/ssr.json)
*   **技能1 (通用可叠加攻击buff)：**
    *   类型: `attackUp`
    *   效果: 攻击力 +20% (`value: 0.2`)
    *   `stackable: true` (根据 [`src/js/core/buff-system.js`](src/js/core/buff-system.js) 中 `attackUp` 的默认定义)
*   **技能2 (聂查瓦尔皮利2格技能)：** "一伐架式"
    *   ID: `yiFaJiaShi`
    *   相关文件: [`src/data/ssr_skill.json`](src/data/ssr_skill.json)
    *   效果: 攻击力 +300% (`value: 3.0`)
    *   `stackable: false` (技能定义中明确指定)

**核心计算逻辑参考：**
*   [`src/js/core/character.js`](src/js/core/character.js) - `calculateAttackPower` 函数 ([`src/js/core/character.js:1512`](src/js/core/character.js:1512))
*   Memory Bank: [`decisionLog.md`](memory-bank/decisionLog.md) (决策日期: 2025-05-11 16:55:15 - 更新 `calculateAttackPower` 函数以区分可叠加与不可叠加的攻击Buff)

**测试场景与步骤：**

1.  **前提条件：**
    *   创建一个测试角色（例如 '测试员A'，可暂时代表 '聂查瓦尔皮利' 以简化自身buff的测试）。
    *   设定其基础攻击力 (Base Attack) 为 **1000**。
    *   确保战斗日志系统 (`BattleLogger`) 配置为输出 `CONSOLE_DETAIL` 级别日志。

2.  **步骤1：施加可叠加的攻击buff**
    *   对 '测试员A' 施加一个通用的 "攻击力提升" buff：
        *   效果: 攻击力 +20% (`value: 0.2`)
        *   `stackable: true`
        *   持续时间: 1 回合
    *   **预期中间攻击力计算：**
        *   基础攻击力 = 1000
        *   可叠加buff贡献 = `1000 * 0.2 = 200`
        *   此时攻击力 = `1000 + 200 = 1200`
    *   **验证点1：**
        *   角色 `currentStats.attack` 应为 1200。
        *   `calculateAttackPower` 日志应显示可叠加buff的正确应用。

3.  **步骤2：施加 "一伐架式" (不可叠加攻击buff)**
    *   对 '测试员A' 施加 "一伐架式" 技能的buff：
        *   效果: 攻击力 +300% (`value: 3.0`)
        *   `stackable: false`
        *   持续时间: 1 回合
    *   **预期最终攻击力计算 (基于 `calculateAttackPower` 逻辑)：**
        1.  取步骤1计算后的攻击力作为基础：1200 (此处的 "基础" 指的是已应用了可叠加buff的攻击力，因为不可叠加buff是在此之后独立乘算的)。
            *   或者更准确地说，从原始基础攻击力开始：
            *   原始基础攻击力 = 1000
            *   应用可叠加buff (+20%)：`1000 * (1 + 0.2) = 1200`
        2.  应用不可叠加buff "一伐架式" (+300%)：`1200 * (1 + 3.0) = 1200 * 4.0 = 4800`
    *   **验证点2：**
        *   角色 `currentStats.attack` 应为 4800。
        *   `calculateAttackPower` 日志应清晰展示：
            *   初始攻击力。
            *   可叠加buff的累加效果。
            *   不可叠加buff的独立乘算效果。

4.  **步骤3：回合结束/Buff过期**
    *   使回合进行，让两个buff都过期。
    *   **预期攻击力：** 恢复到基础攻击力 1000。
    *   **验证点3：** 角色 `currentStats.attack` 应为 1000。

**预期结果总结：**

*   施加通用 `stackable: true` buff (+20%) 后，攻击力：**1200**。
*   接着施加 "一伐架式" (`stackable: false`, +300%) 后，最终攻击力：**4800**。
*   Buff过期后，攻击力恢复到：**1000**。
*   战斗日志 (`CONSOLE_DETAIL`) 必须清晰、逐步地展示攻击力的计算过程，明确区分可叠加buff的加法处理和不可叠加buff的乘法处理。