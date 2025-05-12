# Progress

This file tracks the project's progress using a task list format.
2025-05-08 11:35:19 - Log of updates made.

*

## Completed Tasks

*   [2025-05-12 13:36:54] - **Completed Task: 物品系统重构**
    *   创建了新的物品定义文件 [`src/data/items_definitions.json`](src/data/items_definitions.json)。
    *   修改了 [`src/js/core/item.js`](src/js/core/item.js) 以支持新的物品定义和加载机制。
    *   修改了怪物/Boss定义文件 ([`src/data/monsters.json`](src/data/monsters.json), [`src/data/bosses.json`](src/data/bosses.json)) 以添加物品掉落。
    *   修改了 [`src/js/core/dungeon.js`](src/js/core/dungeon.js) 以处理新的掉落逻辑。
    *   修改了 [`src/js/core/inventory.js`](src/js/core/inventory.js) 以正确处理物品堆叠和数据获取，并移除了对旧商店的引用。
    *   （用户需手动删除 [`src/js/core/shop.js`](src/js/core/shop.js) 文件）
    *   修改了 [`src/js/components/UI.js`](src/js/components/UI.js) 以移除商店相关UI和逻辑。
*   [2025-05-12 11:17:01] - **Completed Task:** 修改 [`src/js/core/character.js`](src/js/core/character.js) 中的 `Character.calculateNextLevelExp(level)` 函数以实现新的经验计算逻辑。
    *   实现了基于数据点、边界处理、直接匹配、线性插值和超出范围处理的新算法。
*   [2025-05-09 21:18:00] - **Completed Debugging Task:** 调查并修复了战斗日志中指出的4个新问题。
    *   问题1 (怪物 `maxHp` 初始化): 修改了 [`src/js/core/battle.js`](src/js/core/battle.js:1) 的HP初始化逻辑。
    *   问题2 (“护甲破坏”两次伤害) & 问题3 (“护甲破坏”0伤害日志矛盾): 修改了 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1) 以统一伤害应用和日志。
    *   问题4 (`TypeError: expiredBuffs is not iterable`): 修改了 [`src/js/core/battle.js`](src/js/core/battle.js:1) 的 `updateBuffDurations`，为怪物 `expiredBuffs` 添加了数组检查。
*   [2025-05-09 17:50:00] - **Completed Task:** 修复 Boss 在战斗中不使用技能的 Bug。
    *   **Cause:** Boss 技能数据未正确加载到 `window.bossSkills`，且 `SkillLoader.getSkillInfo` 未从 `window.bossSkills` 查找。
    *   **Fix:** 修改了 [`src/js/core/skill-loader.js`](src/js/core/skill-loader.js:0) 以加载 Boss 技能数据并更新 `getSkillInfo` 的查找逻辑。
*   [2025-05-09 17:07:00] - Boss AI 技能新机制实现：完成 Boss 血量触发技能和常规技能选择逻辑的编码。
*   [2025-05-09 16:37:53] - Boss 技能更新：完成对 src/data/boss-skills.json 的修改，包括 effectType 统一、技能描述调整和防御数值明确化。
*   初始化 Memory Bank。
*   [2025-05-08 11:48:58] - 修改 `test-battle-new.html`：合并职业与稀有度选择，实现主角专属职业逻辑，添加无角色提示。
*   [2025-05-08 12:18:42] - 调试 `test-battle-new.html`：改进了角色/职业下拉列表的显示逻辑和按钮状态管理，并为职业数据获取添加了增强日志，以解决用户反馈的问题。
*   [2025-05-08 21:40:00] - **Completed Task:** 重新审视并明确了技能顶层 `effectType` 标准。
    *   维持了现有的8个通用顶层 `effectType`。
    *   更新了 [`memory-bank/systemPatterns.md`](memory-bank/systemPatterns.md:1) 以包含详细的映射指南，将通用类型关联到 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1) `applySkillEffects` 中的原子效果。
    *   为技能 "霸装架式" 提出了 `effectType` 修改建议 (改为 `multi_effect`)。
    *   更新了 [`memory-bank/activeContext.md`](memory-bank/activeContext.md:1) 和 [`memory-bank/decisionLog.md`](memory-bank/decisionLog.md:1) 以记录此决策。
*   [2025-05-08 12:27:08] - 进一步调试 `test-battle-new.html`：为解决职业ID不匹配问题，修改了职业选项的value确保为字符串，并增强了职业数据查找的日志和健壮性。
*   [2025-05-08 12:37:35] - 解决 `test-battle-new.html` 角色和职业选择问题：通过在 `loadGameData` 中为R/SR/SSR角色动态添加 `rarity` 属性，并添加诊断日志，成功修复了无法选择R卡角色以及后续职业分配的问题。用户确认所有测试步骤均成功。
*   [2025-05-08 14:49:00] - 分析了 [`test-battle-new.html`](test-battle-new.html) 中角色数据加载、存储和访问架构，识别了 "ID 未找到" 错误的潜在原因，并提出了架构改进建议。更新了记忆银行的相关文件 ([`activeContext.md`](memory-bank/activeContext.md), [`decisionLog.md`](memory-bank/decisionLog.md))。
*   [2025-05-08 20:20:00] - 完成SSR技能效果实现：在 [`src/js/core/job-skills.js`](src/js/core/job-skills.js) 中成功添加了 `enmity` (背水伤害) 和 `hpCostPercentageCurrent` (当前HP百分比消耗) 两种技能效果的逻辑。
*   [2025-05-08 21:07:00] - **Completed Task:** Fixed `ReferenceError: damageResult is not defined` in [`src/js/core/battle.js`](src/js/core/battle.js). The issue was caused by attempting to access `damageResult` outside its scope if the attack loop didn't run. Corrected logic to use a `criticalHits` counter, which also fixes critical hit counting for multi-attacks. Updated [`memory-bank/activeContext.md`](memory-bank/activeContext.md).
*   [2025-05-08 21:53:51] - **Completed Task:** Resolved issue where `JobSkills.useSkill` returned `success: false` even when skill effects (e.g., buffs for `warriorSlash`) were applied.
    *   **Root Cause:** Identified in `JobSkills.applySkillEffects` ([`src/js/core/job-skills.js`](src/js/core/job-skills.js:1)). If a `multi_effect` skill contained an unhandled child effect type, the `default` case in the effect processing `switch` statement incorrectly marked that child effect as `success: false`, which then caused the entire `multi_effect` skill to be reported as failed.
    *   **Fix:** Modified the `default` case in `JobSkills.applySkillEffects` ([`src/js/core/job-skills.js:418`](src/js/core/job-skills.js:418)) to set `success: true` for the `currentEffectResult` of an unknown child effect type. This prevents an unhandled child effect from incorrectly causing the entire skill to fail if other child effects were successful.
    *   **Logging:** Commented out diagnostic `[DEBUG]` logs in `processCharacterAction` in [`src/js/core/battle.js`](src/js/core/battle.js).
*   [2025-05-09 00:00:00] - **Completed Task:** 修改 [`src/js/core/battle.js`](src/js/core/battle.js) 中的 `processCharacterAction` 函数以实现新的多技能使用规则。
    *   角色现在每回合可以尝试使用所有冷却完毕的技能，直到没有可用技能或已执行过攻击性动作（基于 `damage`, `debuff`, `multi_effect`, `trigger` 类型的技能）。
    *   如果未执行攻击性技能，则角色会执行普通攻击。
    *   更新了相关的战斗日志记录。
*   [2025-05-08 23:26:36] - **Completed Task:** 调试怪物HP在战斗开始时显示不正确的问题。
    *   在 [`src/js/core/battle.js`](src/js/core/battle.js) 中添加了诊断日志。
    *   分析了日志，确认后端逻辑中怪物HP在回合1开始时是正确的。
    *   推断问题主要在UI层面。
    *   对 [`src/js/core/battle.js`](src/js/core/battle.js) 中的 `startBattle` 函数应用了预防性修复，以增强怪物HP初始化的健壮性。
    *   更新了 [`memory-bank/activeContext.md`](memory-bank/activeContext.md)。
*   [2025-05-08 22:36:00] - **Completed Task:** Debugged and refactored skill usage issue ("角色在战斗中不再使用技能"). Removed fallback/hardcoded skill definitions, unified skill loading to `SkillLoader.getSkillInfo` sourcing strictly from JSON, and commented out diagnostic logs.
*   [2025-05-08 23:30:00] - **Completed Task:** Debugged `defenseDown` atomic effect and standardized `effectType` for "护甲破坏".
        *   Confirmed `defenseDown` is handled by existing `debuff` logic in `JobSkills.applySkillEffects` ([`src/js/core/job-skills.js:394`](src/js/core/job-skills.js:394)) and `BuffSystem` ([`src/js/core/buff-system.js:35`](src/js/core/buff-system.js:35)). No code changes required for these files.
        *   Modified `effectType` of "护甲破坏" (ID: `armorBreak`) in [`src/data/job-skills-templates.json`](src/data/job-skills-templates.json:598) from `"damage_and_debuff"` to `"multi_effect"`.
        *   Updated [`memory-bank/activeContext.md`](memory-bank/activeContext.md).
*   [2025-05-09 09:53:00] - **Completed Task:** 更新技能数据文件以符合标准的8种 `effectType`。
    *   分析了 [`src/data/r_skills.json`](src/data/r_skills.json:1), [`src/data/sr_skills.json`](src/data/sr_skills.json:1), 和 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1)。
    *   修改了 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 中 `zhanShuCeFangYuan` 的 `effectType` 从 `"team_buff"` 为 `"buff"`。
    *   修改了 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 中 `zhanShuCeHeYi` 的 `effectType` 从 `"aoe_debuff"` 为 `"debuff"`。
    *   [`r_skills.json`](src/data/r_skills.json:1) 和 [`sr_skills.json`](src/data/sr_skills.json:1) 已符合标准，未作修改。
    *   更新了 [`memory-bank/activeContext.md`](memory-bank/activeContext.md:1)。
*   [2025-05-09 10:02:00] - **Completed Task:** 全面更新 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 以符合标准的8种 `effectType`。
    *   对 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 进行了彻底检查。
    *   修正了多个技能的顶层 `effectType`，使其符合 `damage`, `buff`, `debuff`, `heal`, `dispel`, `multi_effect`, `passive`, `trigger` 之一。
    *   更新了 [`memory-bank/activeContext.md`](memory-bank/activeContext.md:1)。
*   [2025-05-09 10:20:00] - **Completed Task:** 统一并扩展了原子技能效果类型的处理。
    *   **数据文件** ([`r_skills.json`](src/data/r_skills.json:1), [`sr_skills.json`](src/data/sr_skills.json:1), [`ssr_skill.json`](src/data/ssr_skill.json:1)):
        *   `multi_attack` 和 `multiHitDamage` 原子类型已统一为 `damage`，并使用 `count` 属性。
        *   `criticalRateUp` 原子类型已统一为 `critRateUp`。
    *   **逻辑文件** ([`src/js/core/job-skills.js`](src/js/core/job-skills.js:1)):
        *   [`applyDamageEffects()`](src/js/core/job-skills.js:1093) 已更新，以正确处理带有 `count` 属性的 `damage` 原子效果。
        *   [`applySkillEffects()`](src/js/core/job-skills.js:304) 的 `switch` 语句 ([`src/js/core/job-skills.js:390`]) 已扩展，为 `castSkill`, `applyBuffPackage`, `applyDebuff`, `customBuff`, `echo`, `fieldEffect`, `additionalDamage` 等原子类型添加了处理逻辑或占位符。
    *   更新了 [`memory-bank/activeContext.md`](memory-bank/activeContext.md:1)。
*   [2025-05-09 10:29:00] - **Completed Task:** 优化了 `job-skills.js` 中对buff包原子效果的处理。
    *   修改了 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1) 的 `applySkillEffects()` 函数，使其在处理 `applyBuffPackage` 和包含子效果数组的 `applyDebuff` 原子类型时，能够正确调用 `BuffSystem.applyBuffPackage()`。
    *   更新了 [`memory-bank/activeContext.md`](memory-bank/activeContext.md:1)。
*   [2025-05-09 10:33:00] - **Completed Task:** 实现了 `debuffResistOnce` 及相关弱体免疫效果的核心判断逻辑。
    *   修改了 [`src/js/core/buff-system.js`](src/js/core/buff-system.js:1) 中的 `applyBuff()` 函数，在施加负面buff前检查目标是否拥有 `debuffImmunity`、`statusImmunity` 或 `debuffResistOnce`。
    *   如果存在抵抗/免疫，则阻止debuff施加，并正确处理 `debuffResistOnce` 的层数消耗和移除。
    *   更新了 [`memory-bank/activeContext.md`](memory-bank/activeContext.md:1)。
*   [2025-05-09 11:11:00] - **Completed Task:** 重构并统一了游戏中的伤害处理核心逻辑。
    *   明确 `Battle.applyDamageToTarget()` ([`battle.js`第1797行](src/js/core/battle.js:1797)) 作为核心伤害数值计算（暴击、防御、减伤、上限等）的唯一入口。
    *   更新了 [`JobSkills.applyDamageEffects()`](src/js/core/job-skills.js:1161) 以计算技能原始伤害（包含`skillDamageUp`, `additionalDamage`）并调用 `Battle.applyDamageToTarget()`，然后负责实际HP扣减。
    *   修改了 [`src/js/core/battle-system-integration.js`](src/js/core/battle-system-integration.js:1) 中对 `Battle.applyDamageToTarget` 的猴子补丁 ([`battle-system-integration.js`第486行](src/js/core/battle-system-integration.js:486))，使其正确调用原始的 `Battle.applyDamageToTarget`，并在其前后处理援护、追击、吸血等效果。
    *   移除了 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1) 中冗余的 `applyDamageToTarget` ([`job-skills.js`第762行](src/js/core/job-skills.js:762)) 方法。
    *   更新了 [`memory-bank/activeContext.md`](memory-bank/activeContext.md:1)。
*   [2025-05-09 11:43:00] - **Completed Task:** 根据CSV文件更新SSR角色和技能数据。
    *   解析了 [`src/data/skill2.csv`](src/data/skill2.csv:1)，筛选出光属性角色。
    *   向 [`src/data/ssr.json`](src/data/ssr.json:1) 添加了新的光属性SSR角色定义，包括估算的初始HP/ATK和技能列表。
    *   向 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 添加了对应角色的技能定义，确保所有顶层 `effectType` 和原子 `type` 均使用项目已定义的类型。
    *   与用户协作处理了新的效果机制：
        *   修改了 `hpCostPercentageCurrent` 原子效果以支持基于最大HP的消耗。
        *   在 `BuffSystem` 中添加了 `guts` (不死身) buff类型，并在 `JobSkills` 中添加了其触发逻辑。
        *   为被动技能添加了 `onTurnEndIfHpIsOne` 的 `proc` 触发条件，并在回合结束处理中添加了相应检查。
        *   在 `BuffSystem` 中添加了 `directDamageValueUp` buff类型，并在伤害计算中应用其效果。
    *   更新了 [`memory-bank/activeContext.md`](memory-bank/activeContext.md:1)。
*   [2025-05-09 13:58:00] - **Completed Task:** 根据用户定义的 `buffTypes` 属性（来自CSV和澄清）更新了 `BuffSystem` 并规范化了新添加的SSR技能定义。
    *   用户手动更新了 [`src/js/core/buff-system.js`](src/js/core/buff-system.js:1) 中的 `buffTypes` 对象。
    *   更新了 [`src/js/core/buff-system.js`](src/js/core/buff-system.js:1) 中的 `applyBuff()` 方法以正确处理新的 `valueInteraction` 逻辑。
    *   更新了 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 中新添加的光属性角色技能，移除了普通原子buff效果的自定义 `name` 属性，并确保它们将使用 `BuffSystem.buffTypes` 中定义的默认行为。
    *   更新了 [`memory-bank/activeContext.md`](memory-bank/activeContext.md:1)。
*   [2025-05-09 14:06:00] - **Completed Task:** Finalized normalization of atomic buff effect definitions within newly added SSR skills in [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1), ensuring they correctly use default names and properties from the updated `BuffSystem.buffTypes`.
*   [2025-05-09 14:37:00] - **Completed Task:** 统一 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 文件中技能 `description` 字段的格式。
    *   所有技能描述已更新，以包含标准的被动标记和CD信息。
    *   更新了 [`memory-bank/activeContext.md`](memory-bank/activeContext.md:1)。

*   [2025-05-09 15:01:00] - **Completed Sub-Task:** 检查并调整了UI组件（主角色卡片、角色提示框）中的角色属性显示逻辑，确保其优先使用 `currentStats` 来展示武器盘和突破加成后的数据。
    *   修改了 [`src/js/components/main-character-card.js`](src/js/components/main-character-card.js:1)。
    *   修改了 [`src/js/components/character-tooltip.js`](src/js/components/character-tooltip.js:1)。
    *   更新了 [`memory-bank/activeContext.md`](memory-bank/activeContext.md:1)。
*   [2025-05-09 14:51:00] - **Completed Task:** 检查并调整了角色属性计算流程，特别是进入地下城时的属性快照机制。
    *   分析了 [`src/js/core/character.js`](src/js/core/character.js:1), [`src/js/core/dungeon.js`](src/js/core/dungeon.js:1), 和 [`src/js/core/dungeon-runner.js`](src/js/core/dungeon-runner.js:1) 中的相关逻辑。
    *   修改了 [`src/js/core/dungeon-runner.js`](src/js/core/dungeon-runner.js:1) 的 `startDungeonRun` 函数，以在进入地下城时立即为队伍成员设置准确的 `dungeonOriginalStats`，并重置相关状态。
    *   确认了突破加成 (`multiBonusStats`) 仍基于角色当前的 `baseStats` 计算。
    *   更新了 [`memory-bank/decisionLog.md`](memory-bank/decisionLog.md:1) 和 [`memory-bank/activeContext.md`](memory-bank/activeContext.md:1)。
* [2025-05-09 20:21:00] - **Completed Debugging Task:** Fixed JavaScript errors: `ReferenceError` in `job-skills.js` and `TypeError` in `battle.js`.
*   [2025-05-09 20:52:00] - **Completed Debugging Task:** 调查并修复了战斗日志中指出的6个问题。
    *   问题1 (怪物HP初始化): 增强日志。
    *   问题2 (角色攻击力未算武器盘): 修复 `calculateCurrentStats`。
    *   问题3 (伤害来源不明确): 增强 `applyDamageToTarget` 日志。
    *   问题4 (“护甲破坏”0伤害): 添加 `applyDamageEffects` 日志。
    *   问题5 (“护甲破坏”未知效果类型): 修正 `job-skills-templates.json` 中的技能定义。
    *   问题6 (攻击后不普攻): 确认为预期行为。
*   [2025-05-09 21:03:48] - **Completed Task:** 根据 `spec-pseudocode` 的输出和用户澄清，修改了 [`src/js/core/battle.js`](src/js/core/battle.js:1) 中的 `processCharacterAction` 函数。
    *   **Change:** 玩家现在可以在使用完所有当前回合可用的技能之后，再执行一次普通攻击。
    *   **Details:**
        *   移除了原有的 `hasPerformedOffensiveActionThisTurn` 标志和相关逻辑。
        *   技能使用循环现在会遍历所有可用技能，不再因“攻击性”技能而提前中止。
        *   在技能循环之后，添加了新的逻辑来执行一次普通攻击（前提是角色和目标仍然存活，且本回合未执行过普攻）。
        *   原有的普通攻击详细逻辑被封装到一个新的辅助函数 `executeNormalAttack` 中，并在适当的时候调用。
    *   Memory Bank (`activeContext.md`, `progress.md`, `decisionLog.md`) 已更新。
*   [2025-05-09 21:38:00] - **Completed Debugging Task:** 修复了 [`src/js/core/battle.js`](src/js/core/battle.js:1) 中 `processCharacterAction` 函数内普通攻击执行两次的bug。移除了在调用 `this.executeNormalAttack()` 之后残留的旧攻击逻辑。
- 2025-05-10 16:06:41: 开始任务 - 创建技能子效果类型 Markdown 文档。
*   [2025-05-10 16:22:32] - 完成任务 - 创建技能子效果类型 Markdown 文档 [`docs/skill_effect_types_reference.md`](docs/skill_effect_types_reference.md)。
*   [2025-05-10 17:05:07] - 完成任务 - 根据统一化修改建议，对技能JSON文件和 `src/js/core/job-skills.js` 进行修改。
* [2025-05-10 17:21:34] - Debugging Task Status Update: Start investigating battle log HP rollback issue.
* [2025-05-10 17:27:01] - Debugging Task Status Update: Inserted diagnostic logs in `battle.js`.
* [2025-05-10 18:24:36] - Debugging Task Status Update: Added more diagnostic logs to `battle.js` at the end of `applyDamageToTarget`.
* [2025-05-10 18:29:22] - Debugging Task Status Update: All three object reference tracing logs inserted correctly into `battle.js` and `job-skills.js`.
* [2025-05-10 18:34:55] - Debugging Task Status Update: All `_debugRefId` tracing logs inserted.
* [2025-05-10 18:42:14] - Debugging Task Status Update: Added diagnostic logs for proc healing in `battle.js`.
* [2025-05-10 18:48:41] - Debugging Task Status Update: Added final diagnostic log in `battle.js` for pinpointing HP rollback.
* [2025-05-10 18:54:10] - Debugging Task Status Update: Added final HP check log in `JobSkills.useSkill` exit.
* [2025-05-10 19:02:54] - Debugging Task Status Update: Corrected log insertion in `JobSkills.useSkill`. Ready for new user logs.
*   [2025-05-10 19:34:00] - **Completed Task:** 在 [`src/js/core/battle.js`](src/js/core/battle.js:1) 中实现了新的三阶段战斗流程（我方技能 -> 我方普攻 -> 敌方行动）。
    *   重构了 `processBattle` ([`src/js/core/battle.js:400`](src/js/core/battle.js:400)) 函数。
    *   创建了新的阶段处理函数: `executePlayerSkillPhase` ([`src/js/core/battle.js:519`](src/js/core/battle.js:519)), `executePlayerAttackPhase` ([`src/js/core/battle.js:533`](src/js/core/battle.js:533)), `executeEnemyPhase` ([`src/js/core/battle.js:552`](src/js/core/battle.js:552))。
    *   创建了新的辅助函数: `processCharacterSkills` ([`src/js/core/battle.js:563`](src/js/core/battle.js:563)), `processCharacterNormalAttack` ([`src/js/core/battle.js:609`](src/js/core/battle.js:609))。
    *   调整了状态处理函数的调用时机。
- [2025-05-10 19:44:00] 开始为 `src/js/core/battle.js` 的新三阶段战斗流程编写测试用例。
- [2025-05-10 19:44:00] 创建并修正了测试文件 `test-battle-logic.html` 用于执行战斗逻辑测试。
* [2025-05-10 20:44:56] - Completed Debugging Task: Investigated and fixed "未知的BUFF类型: critRateUp" error. Corrected buff type casing in [`src/js/core/weapon-board-bonus-system.js`](src/js/core/weapon-board-bonus-system.js:322).
* [2025-05-10 20:51:00] - **Completed Task:** 统一暴击率相关的 BUFF 类型为 `critRateUp`。
    *   还原了 [`src/js/core/weapon-board-bonus-system.js`](src/js/core/weapon-board-bonus-system.js:322) 中的 `criticalRateUp` 为 `critRateUp`。
    *   修改了 [`src/js/core/buff-system.js`](src/js/core/buff-system.js:28) 中的 BUFF 定义从 `criticalRateUp` 为 `critRateUp`。
    *   在 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:649), [`src/js/core/buff-system.js`](src/js/core/buff-system.js:696) 和 [`src/js/core/buff-system.js:772`](src/js/core/buff-system.js:772) 中将 `criticalRateUp` 替换为 `critRateUp`。
    *   更新了 [`docs/skill_effect_types_reference.md`](docs/skill_effect_types_reference.md:65) 中的文档。
* [2025-05-10 21:07:00] - Debugging Task Status Update: Investigating `TypeError` in `job-skills.js:807`. Root cause identified as incorrect `teamMembers` argument passed to `JobSkills.useSkill` in `battle.js`. Preparing to apply fix.
*   [2025-05-10 22:33:00] - **Completed Task:** 修复 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1) 中 `useSkill` 方法及相关效果函数返回值不统一的问题。
    *   统一了 `apply*Effects` 系列函数和 `applySkillEffects` 的返回结构为 `{ success: boolean, message?: string, effects?: object }`。
    *   更新了 `useSkill` 以适配新结构。
    *   验证了 [`src/js/core/battle.js`](src/js/core/battle.js:1) 调用方的兼容性。
    *   添加了相关JSDoc和测试说明。
*   [2025-05-10 23:28:00] - **Completed Task:** 统一战斗系统日志记录功能。
    *   创建了新的日志模块 [`src/js/core/battle-logger.js`](src/js/core/battle-logger.js) 并实现了 `BattleLogger` 对象及其多级日志方法。
    *   将 [`src/js/core/battle.js`](src/js/core/battle.js) 中的旧日志调用替换为 `BattleLogger.log()`。
    *   在伤害计算、技能使用、普通攻击、BUFF处理等关键节点添加了详细的控制台日志和简洁的界面日志。
    *   确保控制台日志包含回合前缀和必要的计算细节。
- [IN PROGRESS] 2025-05-10 23:30:12 - Start documenting BattleLogger system (docs/battle-logger-usage.md)
- [DONE] 2025-05-10 23:31:14 - Completed documenting BattleLogger system (docs/battle-logger-usage.md)
* [2025-05-10 23:34:18] - **Completed Debugging Task:** Fixed `TypeError: Battle.logBattle is not a function` in `buff-system.js`. Replaced `Battle.logBattle` with `BattleLogger.log(BattleLogger.levels.BATTLE_LOG, ...)`.
* [2025-05-10 23:37:00] - **Completed Debugging Task:** Resolved `ReferenceError: BattleLogger is not defined` in [`src/js/core/buff-system.js`](src/js/core/buff-system.js:909). Added `<script src="src/js/core/battle-logger.js"></script>` to [`index.html`](index.html) before [`src/js/core/buff-system.js`](src/js/core/buff-system.js).
* [2025-05-11 10:15:27] - **Completed Task:** 修改了 [`src/js/components/character-tooltip.js`](src/js/components/character-tooltip.js:1) 中的 `findCharacterCardElement` 函数，以满足新的提示框显示逻辑：仅当鼠标悬停在 `<h4>` 标签上时才查找父元素的 `data-character-id`。
* [2025-05-11 10:25:46] - **Completed Task:** 修改了 [`src/js/components/character-tooltip.js`](src/js/components/character-tooltip.js:1) 中的 `findCharacterCardElement` 函数，以支持在 `<h4>` 或具有 `member-name` 类的元素上触发提示框，并正确查找 `data-character-id`。
* [2025-05-11 10:51:18] - **Completed Task:** 修改 [`src/js/components/team-management.js`](src/js/components/team-management.js:1) 的 `renderTeams` 函数，以正确显示角色突破次数徽章。
* [2025-05-11 11:33:01] - **Completed Task:** 修改了 [`src/js/core/character.js`](src/js/core/character.js:1) 中的 `loadSaveData` 和 `getCharacterFullStats` 函数。
    *   `loadSaveData`: 增强了属性完整性检查，并在加载后刷新所有角色属性。
    *   `getCharacterFullStats`: 增加了错误处理和回退机制，确保 `weaponBonusStats` 总是更新。
* [2025-05-11 12:03:17] - **Completed Task:** 修改 [`src/js/core/dungeon.js`](src/js/core/dungeon.js:1) 中的 `completeDungeon` 函数，以正确恢复角色在副本外的属性。
* [2025-05-11 12:19:12] - **Completed Task:** 实现新的 `baseStats` 计算和验证逻辑。
    *   修改了 [`src/js/core/character.js`](src/js/core/character.js:1): 添加 `_getCharacterTemplate`, `getExpectedBaseStatAtLevel`, `validateCharacterBaseStats`；修改 `levelUpCharacter`, `loadSaveData`。
    *   修改了 [`src/js/core/dungeon.js`](src/js/core/dungeon.js:1): 在 `initDungeonRun` 中调用 `validateCharacterBaseStats`。
* [2025-05-11 12:36:58] - **Completed Task:** 修改 [`src/js/core/character.js`](src/js/core/character.js:1) 中的 `validateCharacterBaseStats` 函数，取消了成功验证日志的注释。
* [2025-05-11 12:47:32] - **Completed Task:** 修改 [`src/js/core/character.js`](src/js/core/character.js:1) 中的 `loadSaveData` 函数，修复了角色模板异步加载问题。
* [2025-05-11 12:58:48] - **Completed Task:** 修改 [`src/js/core/character.js`](src/js/core/character.js:1) 中的 `validateCharacterBaseStats` 函数，添加 `autoCorrect` 参数及相关逻辑，并更新 `loadSaveData` 函数以启用自动修正。
* [2025-05-11 19:42:00] - **Completed Task:** 完成对战斗系统群体技能支持的架构设计。

*   [2025-05-11 20:13:00] - **Debugging Task:** 调查怪物 AoE 技能只对单个我方单位生效的问题。
    *   **Status:** 分析完成。根本原因已定位到 [`src/js/core/job-skills.js`](src/js/core/job-skills.js) 的 `getTargets` 函数在处理怪物施放的 `all_enemies` 技能时，由于参数传递问题，错误地将单个我方角色识别为唯一目标。
*   [2025-05-11 20:17:00] - **Completed Task:** 修复怪物 AoE 技能未能正确作用于我方所有单位的问题。
    *   修改了 [`src/js/core/job-skills.js`](src/js/core/job-skills.js) 中的 `useSkill` 和 `getTargets` 函数。
    *   `useSkill` 现在判断施法者阵营 (`isCasterPlayer`) 并传递给效果应用函数及 `getTargets`。
    *   `getTargets` 根据 `isCasterPlayer` 正确解析 `all_enemies` 和 `all_allies` 目标类型。
    *   怪物施放 `all_enemies` 时，目标为我方全体；玩家施放 `all_enemies` 时，目标为敌方。
    *   怪物施放 `all_allies` 时，目标为自身；玩家施放 `all_allies` 时，目标为我方全体。
*   [2025-05-11 21:47:31] - **Completed Debugging Task:** 修复 `calculateAttackPower` 函数 ([`src/js/core/character.js`](src/js/core/character.js:1512)) 中的日志记录问题。
    *   将日志记录从 `window.logBattle.log()` / `Battle.logBattle()` 迁移到 `BattleLogger.log()`。
    *   使用了 `CONSOLE_DETAIL` 和 `CONSOLE_INFO` 日志级别。
*   [2025-05-11 21:59:00] - **Completed Debugging Task:** 增强 `calculateAttackPower` 函数 ([`src/js/core/character.js`](src/js/core/character.js:1512)) 的日志记录，以详细追踪攻击力倍率构成。
    *   日志现在收集详细的计算步骤，包括初始攻击力来源、各可叠加buff贡献、各独立buff（含来源）的乘算影响、其他乘算区间及最终总倍率。
    *   所有步骤通过 `BattleLogger.log` 的 `details` 参数在 `CONSOLE_DETAIL` 级别输出。

* [2025-05-11 22:20:00] - Debugging Task Started: 调查 "一伐架式" 独立buff未在日志中正确显示且最终攻击倍率不符预期的问题。
* [2025-05-11 22:20:00] - Debugging Action: 增强了 `calculateAttackPower` ([`src/js/core/character.js`](src/js/core/character.js:1512)) 的日志，以在函数入口处打印所有当前buff的详细信息。
## Current Tasks
*   [2025-05-12 10:06:00] - **TDD Cycle End:** 设计并编写了针对 `stackable: true` 和 `stackable: false` 攻击buff同时生效时计算逻辑的测试用例。特别关注角色 '聂查瓦尔皮利' 的2格技能 "一伐架式"。测试用例设计文档位于 [`memory-bank/test-cases/buff-stacking-nezahualpilli.md`](memory-bank/test-cases/buff-stacking-nezahualpilli.md)，相应的Vitest测试代码已写入 [`test/buff-stacking.test.js`](test/buff-stacking.test.js)。
*   [2025-05-12 09:46:00] - **TDD Cycle Start:** 开始为战斗系统“后排角色自动增援前排”功能编写单元/集成测试。目标文件：[`test/battle-reinforcement.test.js`](test/battle-reinforcement.test.js:0)。
*   [2025-05-12 09:46:00] - **TDD Cycle End:** 完成为战斗系统“后排角色自动增援前排”功能编写的7个单元/集成测试，并通过 Vitest 在 JSDOM 环境下成功运行。测试覆盖了多种增援场景，包括空位、多空位、后排不足、后排无人、前排全灭以及回合效果导致阵亡等情况。测试文件：[`test/battle-reinforcement.test.js`](test/battle-reinforcement.test.js:0)。Memory Bank 已更新。
*   [2025-05-11 20:20:00] - **TDD Cycle Start:** 开始为怪物和玩家 AoE 技能修复编写单元/集成测试。目标文件：[`test-battle-logic.html`](test-battle-logic.html)。
*   [2025-05-11 20:24:00] - **TDD Cycle End:** 完成为怪物和玩家 AoE 技能修复编写单元/集成测试。覆盖了怪物 AoE (all_enemies), 玩家 AoE (all_enemies), 玩家 AoE (all_allies), 以及双方的单体技能 (single_enemy, single_ally) 场景。测试添加在 [`test-battle-logic.html`](test-battle-logic.html)。
*   [2025-05-08 21:03:00] - 调试战斗中 TypeError (技能 warriorSlash 使用错误: TypeError: Cannot read properties of null (reading 'teamMembers') at battle.js:960).

*   [2025-05-08 14:49:00] - 准备向用户呈现关于 [`test-battle-new.html`](test-battle-new.html) "ID 未找到" 错误的分析、架构建议以及记忆银行更新的总结。
*   [2025-05-08 23:14:00] - **Investigating:** 怪物（月影狼王）HP在战斗开始UI显示时为1716/4000，但后端逻辑显示为4000/4000。
    *   **Status:** 已添加诊断日志，分析了日志，应用了预防性修复到 `battle.js`。主要怀疑UI层面问题。等待用户确认UI层面的检查。
*   [2025-05-08 22:42:00] - **Current Task:** Investigating skill selection logic in `processCharacterAction` ([`src/js/core/battle.js`](src/js/core/battle.js)).
    *   Analyzed `processCharacterAction`: Confirmed it only attempts to use the first skill from the `availableSkills` list.
    *   Assessed this as likely a simplified implementation.
    *   Formulated recommendations for improvement (iteration, prioritization).
    *   Updated [`memory-bank/activeContext.md`](memory-bank/activeContext.md) with findings.
    *   Awaiting feedback/decision on implementing changes.
    *   [2025-05-11 19:42:00] - **Current Task:** 架构设计：战斗系统群体技能支持（包括 `all_enemies` 和 `all_allies`）。
    
    ## Next Steps

*   创建 `memory-bank/decisionLog.md`。 (此条目可能已过时，因为该文件已存在)
*   创建 `memory-bank/systemPatterns.md`。 (此条目可能已过时，因为该文件已存在)
*   根据 `activeContext.md` 中的 "Open Questions/Issues" 进一步完善主角和职业系统。
*   如果当前问题解决，将继续处理武器盘相关功能的实现或修复。
*   [2025-05-08 16:53:42] - 完成 SSR 角色技能更新：根据 [`ssrskill.txt`](src/data/ssrskill.txt:1) 更新了 [`ssr.json`](src/data/ssr.json:1) 中的角色技能列表和 [`ssr_skill.json`](src/data/ssr_skill.json:1) 中的技能详情。部分技能因包含特殊机制或描述不明确，已整理完毕等待用户确认。
*   [2025-05-08 16:53:42] - 当前任务：等待用户确认特定 SSR 技能的处理方式。
*   [2025-05-08 16:59:25] - 根据用户确认，将所有先前待处理的 SSR 技能（包含特殊机制的技能）添加到了 [`ssr.json`](src/data/ssr.json:1) 和 [`ssr_skill.json`](src/data/ssr_skill.json:1) 中。技能ID使用建议的英文ID，描述按原样记录。
*   [2025-05-08 16:59:25] - SSR 技能更新流程已全部完成。
*   [2025-05-08 17:37:27] - 完成 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 文件中 SSR 角色技能效果的分析和补充：根据 [`src/data/ssrskill.txt`](src/data/ssrskill.txt:1) 的描述，全面更新了技能的 `type`, `cooldown`, `effectType`, `targetType` 和 `effects` 字段，确保了技能效果的清晰、具体和结构化。
*   [2025-05-08 20:27:18] - **Completed Task:** 修改了 [`src/js/core/battle.js`](src/js/core/battle.js:1) 中的伤害计算函数，调整了防御力对伤害的减免方式。新的公式为 `finalDamage / (1 + defensePercent)`，并确保其在正确的计算步骤中应用。
*   [2025-05-08 20:39:43] - **Completed Task:** 调整了 [`src/js/core/battle.js`](src/js/core/battle.js:1) 中的战斗伤害上限，普通攻击上限设置为 199999，技能伤害上限设置为 899999。
*   [2025-05-08 20:53:00] - **Completed Task:** 标准化项目中的技能 `effectType`。修改了相关的数据文件 ([`src/data/ssr_skill.json`](src/data/ssr_skill.json), [`src/data/sr_skills.json`](src/data/sr_skills.json), [`src/data/r_skills.json`](src/data/r_skills.json)) 和逻辑文件 ([`src/js/core/job-skills.js`](src/js/core/job-skills.js))。
*   [2025-05-08 21:17:00] - **Completed Task:** Implemented detailed skill usage logging in combat.
    *   Modified [`src/js/core/job-skills.js`](src/js/core/job-skills.js) to add logging logic in `useSkill` and enhance returned data from `applyBuffEffects` and `applyDebuffEffects`.
    *   Ensured logs capture turn, caster, skill, target, primary effect (damage, heal, buff/debuff application, dispel), and target HP status, following provided specifications.
    *   No changes were needed in [`src/js/core/battle.js`](src/js/core/battle.js) regarding `applyDamageToTarget`'s internal logging, as its existing logs for special events (cover, shield, etc.) do not conflict with the new higher-level skill logs.
* [2025-05-11 16:55:04] - **Completed Task:** 修改 `src/js/core/character.js` 中的 `calculateAttackPower` 函数以实现新的攻击力计算逻辑。
    *   区分处理可叠加 (`stackable: true` 或未定义) 和不可叠加 (`stackable: false`) 的 `attackUp` Buff。
    *   可叠加 `attackUp` 的 `value` 进行加法累积。
    *   不可叠加 `attackUp` 作为独立乘算区间 `(1 + buff.value)`。
    *   `attackDown` 逻辑保持不变。
    *   其他乘算区间（浑身、背水、EX攻击）和固定伤害上升的应用顺序已调整。
* [2025-05-11 18:10:00] - **Completed Task:** 修改 [`src/js/core/battle.js`](src/js/core/battle.js:1775) 中的 `applyDamageToTarget` 函数，实现属性克制伤害计算逻辑。
    *   根据攻击方和目标方的元素属性应用伤害修正（克制增伤1.5倍，被克制减伤0.75倍，光暗互克增伤1.5倍）。
    *   伤害变化记录在 `calculationSteps` 和 `BattleLogger` 中。
    *   确保逻辑在 `attacker` 和 `actualTarget` 及其属性有效时执行。
* [2025-05-11 18:45:48] - **Completed Task:** 修改了 [`src/js/core/battle.js`](src/js/core/battle.js:1760) 中的战斗逻辑，以更稳健地检查 `attacker.isBoss` 属性。
    *   使用 `!!attacker.isBoss` 来确保布尔上下文，并相应更新了 `attackerIsPlayer` 和 `targetIsMonster` 的赋值。
    *   [2025-05-11 19:42:00] - **Next Step:** 开始实施战斗系统对“敌方队伍” (`enemyParty`) 的支持。
    *   [2025-05-11 19:42:00] - **Next Step:** 重构 [`JobSkills.getTargets()`](src/js/core/job-skills.js:1080) 以正确处理 `all_enemies` 和 `all_allies` 并返回目标数组。
    *   [2025-05-11 19:42:00] - **Next Step:** 修改技能效果应用函数 (如 [`JobSkills.applyDamageEffects()`](src/js/core/job-skills.js:766)) 以迭代处理目标数组。
*   [2025-05-11 20:44:15] - [Debugging Task Status Update: Completed] Investigated and fixed issue where backline units would not join combat. Ensured backline units have full HP at the start of battle by modifying [`src/js/core/battle.js`](src/js/core/battle.js).
* [2025-05-11 22:30:00] - Debugging Task Status Update: Added diagnostic logs to trace "一伐架式" buff lifecycle. Files modified: [`src/js/core/job-skills.js`](src/js/core/job-skills.js), [`src/js/core/buff-system.js`](src/js/core/buff-system.js).
* [2025-05-12 09:49:34] - **Completed Task:** 创建/更新了 `.gitignore` 文件，内容为 `node_modules/`。
* [2025-05-12 12:14:24] - **Completed Task:** 优化 [`src/js/core/dungeon.js`](src/js/core/dungeon.js) 文件。
    *   删除了 `copyTemplatesToDungeons()` 和 `loadTemplatesFallback()` 函数。
    *   移除了对 `copyTemplatesToDungeons()` 的调用。
    *   修改了 `loadTemplates()` 以增强模板加载的健壮性。