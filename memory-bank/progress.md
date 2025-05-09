# Progress

This file tracks the project's progress using a task list format.
2025-05-08 11:35:19 - Log of updates made.

*

## Completed Tasks

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
## Current Tasks
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