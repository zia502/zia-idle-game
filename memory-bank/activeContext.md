# Active Context

This file tracks the project's current status, including recent changes, current goals, and open questions.
2025-05-08 11:35:11 - Log of updates made.

*

## Current Focus

* 初始化 Memory Bank。
* [2025-05-08 11:44:17] - 为 `test-battle-new.html` 调整角色和职业选择逻辑的任务已进入架构阶段。
* [2025-05-08 11:48:58] - 完成 `test-battle-new.html` 中角色和职业选择逻辑的修改。合并了选择下拉框，实现了主角专属职业逻辑和无角色提示。
* [2025-05-08 12:14:54] - 根据用户反馈处理 `test-battle-new.html` 中的错误：暂时注释掉未定义的武器盘函数调用，并为角色/职业选择逻辑添加了诊断日志，以解决无法选择角色和添加职业时报错的问题。等待用户提供新的日志信息。
* [2025-05-08 12:18:42] - 进一步调试 `test-battle-new.html`：修改了 `updateCharacterJobSelect` 函数以改善下拉列表选项的显示和按钮状态更新逻辑。在 `handleAddCharacterToTeam` 函数中为职业数据获取过程添加了更详细的日志记录，以帮助定位潜在的职业ID不匹配问题。
* [2025-05-08 12:37:35] - 解决了 `test-battle-new.html` 中因角色数据缺少 `rarity` 属性导致无法选择R卡角色的问题。通过修改 `loadGameData` 函数为R/SR/SSR角色动态添加 `rarity` 属性，确保了角色选择和后续职业分配功能恢复正常。添加了额外的诊断日志以辅助调试。
* [2025-05-08 14:47:00] - 分析 [`test-battle-new.html`](test-battle-new.html) 中的角色数据加载、存储和访问架构，以解决 "ID 未找到" 错误。

## Recent Changes

* 创建了 `memory-bank/productContext.md`。
* [2025-05-08 11:48:58] - 修改了 `test-battle-new.html` 以更新角色和职业选择UI及相关JavaScript逻辑。
* [2025-05-08 12:14:54] - 进一步修改 `test-battle-new.html` 以尝试修复错误并添加日志。
* [2025-05-08 12:18:42] - 再次修改 `test-battle-new.html`，调整了角色/职业选择下拉列表的更新逻辑和相关的按钮状态管理，并为职业数据获取添加了增强日志。
* [2025-05-08 12:37:35] - 修改 `test-battle-new.html`：在 `loadGameData` 中为从JSON加载的角色数据动态添加 `rarity` 属性。在 `init` 和 `addEventListeners` 函数中添加了诊断日志。

## Open Questions/Issues
* [2025-05-08 21:07:00] - **New Issue:** `ReferenceError: damageResult is not defined` at [`src/js/core/battle.js:1076`](src/js/core/battle.js:1076) in `processCharacterAction`.
    *   **Analysis:** The error occurs when attempting to access `damageResult.isCritical` after the attack loop. If the loop for normal attacks doesn't execute (e.g., if the monster is already defeated by a skill used earlier in the turn), `damageResult` remains undefined, leading to the ReferenceError. Additionally, the original logic for `critCount` only considered the last hit of a multi-attack.
    *   **Fix Applied:** Modified [`src/js/core/battle.js`](src/js/core/battle.js) to use a `criticalHits` counter that is correctly incremented within the attack loop for each critical hit. This `criticalHits` counter is then used to update `character.stats.critCount` and `battleStats.characterStats[character.id].critCount` after the loop. This resolves the ReferenceError and correctly counts all critical hits in a multi-attack.
* [2025-05-08 21:03:00] - **New Issue:** `TypeError: Cannot read properties of null (reading 'teamMembers')` at [`src/js/core/battle.js:960`](src/js/core/battle.js:960) in `processCharacterAction`.
    *   **Analysis:** The error occurs because `this.currentBattle` is `null` when `processCharacterAction` attempts to access `this.currentBattle.teamMembers`. `this.currentBattle` is fully populated at the end of the `startBattle` function, after `processBattle` (which calls `processCharacterAction`) has completed.
    *   **Proposed Fix:** Pass `teamMembers` obstáculos as an argument from `processBattle` to `processCharacterAction` and use this argument instead of `this.currentBattle.teamMembers` within `processCharacterAction`.

* 需要更明确的主角指定机制，而不是简单地假定队伍中的第一个角色。
* 职业赋予主角后，如果主角被从队伍中移除，职业状态如何处理。
* `test-battle-new.html` 中角色选择和职业添加功能在之前的测试中存在问题，新的修改和日志旨在解决这些问题。等待用户测试反馈。 **[已解决 2025-05-08 12:37:35]**
* 武器盘相关函数 (`handleOpenWeaponSelectionModal` 等) 的定义缺失或未在此处考虑，导致相关事件监听器被临时注释。
* [2025-05-08 12:26:54] - 调试 `test-battle-new.html`：为解决潜在的职业ID不匹配问题，修改了 `updateCharacterJobSelect` 函数以确保职业选项的 `value` 为字符串。同时，在 `handleAddCharacterToTeam` 函数中为职业数据查找逻辑添加了更健壮的日志记录和回退检查机制，以应对 `JobSystem.jobs` 中职业ID可能为数字或字符串的情况。 **[相关问题已通过rarity属性修复一并解决 2025-05-08 12:37:35]**
* [2025-05-08 14:47:00] - 发现 [`test-battle-new.html`](test-battle-new.html) 中的 "ID 未找到" 错误（例如 `character_101`）很可能源于角色对象的内部 `id` 属性与其在 `allCharactersData` 集合中的键不一致。当UI使用内部 `id` 属性构建下拉选项，然后该值用于在 `allCharactersData` 中查找时，如果键名不同则会导致查找失败。
* [2025-05-08 16:53:58] - **Current Focus:** 等待用户确认对一批 SSR 技能的处理。这些技能因包含特殊机制（如“消去不可”、“X回合后可用”、“概率触发”、“仅一次”等）或描述需要进一步明确，未自动更新到 [`ssr.json`](src/data/ssr.json:1) 和 [`ssr_skill.json`](src/data/ssr_skill.json:1) 中。
* [2025-05-08 16:53:58] - **Recent Changes:**
    *   根据 [`ssrskill.txt`](src/data/ssrskill.txt:1) 的内容，更新了 [`ssr.json`](src/data/ssr.json:1) 中明确可处理的 SSR 角色技能列表（使用新的英文技能ID，无角色前缀）。
    *   根据 [`ssrskill.txt`](src/data/ssrskill.txt:1) 的内容，更新/创建了 [`ssr_skill.json`](src/data/ssr_skill.json:1) 中明确可处理的 SSR 技能详情（使用新的英文技能ID作为键，填充了中文名和描述）。
* [2025-05-08 16:59:35] - **Recent Changes:** 用户确认了所有先前待处理的SSR技能的处理方式。这些技能已按照建议的英文ID添加至 [`ssr.json`](src/data/ssr.json:1) 的角色技能列表和 [`ssr_skill.json`](src/data/ssr_skill.json:1) 的技能详情中，描述按原样记录。
* [2025-05-08 16:59:35] - **Current Focus:** SSR技能数据更新任务已完成。
* [2025-05-08 17:37:27] - **Recent Changes:** 根据 [`ssrskill.txt`](src/data/ssrskill.txt:1) 的描述，全面更新了 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 文件，补充并结构化了所有SSR角色的技能效果，包括 `type`, `cooldown`, `effectType`, `targetType` 和具体的 `effects` 数组。
* [2025-05-08 20:20:00] - 在 [`src/js/core/job-skills.js`](src/js/core/job-skills.js) 中实现了 `enmity` (背水伤害) 和 `hpCostPercentageCurrent` (当前HP百分比消耗) 技能效果。`enmity` 伤害会根据攻击者当前的HP百分比动态调整，`hpCostPercentageCurrent` 会扣除发动者当前HP的一定百分比作为代价，并确保HP至少保留1点。
* [2025-05-08 17:37:27] - **Current Focus:** 完成了对 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 文件中SSR角色技能效果的分析和补充。
* [2025-05-08 20:27:05] - **Recent Changes:** 修改了 [`src/js/core/battle.js`](src/js/core/battle.js:1) 中的 `applyDamageToTarget` 函数，实现了新的防御力减伤公式 (伤害 / (1 + 防御百分比))，替换了旧的占位符防御逻辑。
* [2025-05-08 20:27:05] - **Current Focus:** 完成了对战斗系统中伤害计算公式的调整，特别是防御力对伤害减免的计算方式。
* [2025-05-08 20:39:36] - **Recent Changes:** 修改了 [`src/js/core/battle.js`](src/js/core/battle.js:1) 中的战斗伤害上限。普通攻击上限调整为 199999，技能伤害上限调整为 899999。
* [2025-05-08 20:39:36] - **Current Focus:** 完成了战斗伤害上限的调整。
* [2025-05-08 20:52:00] - **Recent Changes:** 标准化了技能的 `effectType`。
    *   修改了数据文件 [`src/data/ssr_skill.json`](src/data/ssr_skill.json), [`src/data/sr_skills.json`](src/data/sr_skills.json), 和 [`src/data/r_skills.json`](src/data/r_skills.json)，将其中的顶层 `effectType` 字段更新为标准化的8个类型之一 (`damage`, `buff`, `debuff`, `heal`, `dispel`, `multi_effect`, `passive`, `trigger`)。
    *   修改了逻辑文件 [`src/js/core/job-skills.js`](src/js/core/job-skills.js) 中的 `useSkill` 函数，调整了 `switch` 语句以正确处理新的标准化 `effectType`，特别是 `multi_effect` 和 `trigger` 类型，确保它们通过 `applySkillEffects` 进行通用处理。
* [2025-05-08 20:52:00] - **Current Focus:** 完成了技能 `effectType` 的标准化任务。