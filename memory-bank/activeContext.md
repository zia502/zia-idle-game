# Active Context

This file tracks the project's current status, including recent changes, current goals, and open questions.
2025-05-08 11:35:11 - Log of updates made.

*

## Current Focus

*   初始化 Memory Bank。
*   [2025-05-08 11:44:17] - 为 `test-battle-new.html` 调整角色和职业选择逻辑的任务已进入架构阶段。
*   [2025-05-08 11:48:58] - 完成 `test-battle-new.html` 中角色和职业选择逻辑的修改。合并了选择下拉框，实现了主角专属职业逻辑和无角色提示。
*   [2025-05-08 12:14:54] - 根据用户反馈处理 `test-battle-new.html` 中的错误：暂时注释掉未定义的武器盘函数调用，并为角色/职业选择逻辑添加了诊断日志，以解决无法选择角色和添加职业时报错的问题。等待用户提供新的日志信息。
*   [2025-05-08 12:18:42] - 进一步调试 `test-battle-new.html`：修改了 `updateCharacterJobSelect` 函数以改善下拉列表选项的显示和按钮状态更新逻辑。在 `handleAddCharacterToTeam` 函数中为职业数据获取过程添加了更详细的日志记录，以帮助定位潜在的职业ID不匹配问题。
*   [2025-05-08 12:37:35] - 解决了 `test-battle-new.html` 中因角色数据缺少 `rarity` 属性导致无法选择R卡角色的问题。通过修改 `loadGameData` 函数为R/SR/SSR角色动态添加 `rarity` 属性，确保了角色选择和后续职业分配功能恢复正常。添加了额外的诊断日志以辅助调试。
*   [2025-05-08 14:47:00] - 分析 [`test-battle-new.html`](test-battle-new.html) 中的角色数据加载、存储和访问架构，以解决 "ID 未找到" 错误。
*   [2025-05-08 22:58:00] - **New Requirement:** 定义新的技能使用循环逻辑 for `processCharacterAction` in [`src/js/core/battle.js`](src/js/core/battle.js:1).
    *   **Goal:** Allow characters to attempt all available skills until an "offensive action" is performed or no skills remain.
    *   **"Offensive Action" Definition (Simplified):** A skill is offensive if its `effectType` is `damage`, `debuff`, or a `multi_effect`/`trigger` with offensive sub-components. Non-offensive skills (e.g., `buff`, `heal`) do not immediately end the skill phase.
    *   **Logic:**
        1.  Initialize `hasPerformedOffensiveActionThisTurn = false`.
        2.  Loop through `availableSkills`.
        3.  If `hasPerformedOffensiveActionThisTurn` is true, break.
        4.  If `Battle.canUseSkill` is true, attempt `JobSkills.useSkill`.
        5.  If skill used successfully and is offensive, set `hasPerformedOffensiveActionThisTurn = true`.
        6.  After loop, if `hasPerformedOffensiveActionThisTurn` is false, perform normal attack.
    *   **Status:** Pseudocode defined. Memory Bank ([`systemPatterns.md`](memory-bank/systemPatterns.md:1)) updated with this pattern.
*   [2025-05-09 00:00:00] - 在 [`src/js/core/battle.js`](src/js/core/battle.js) 的 `processCharacterAction` 函数中实现了新的多技能使用循环逻辑。角色现在每回合可以尝试使用所有冷却完毕的技能，直到没有可用技能或已执行过攻击性动作。
*   [2025-05-09 14:37:00] - 完成了对 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 文件中技能 `description` 字段的统一格式化。所有描述现在都包含标准的被动标记和CD信息。

*   [2025-05-09 15:01:00] - **UI属性显示检查与调整：**
    *   确认了角色 `baseStats` 主要受等级和职业影响。
    *   检查了主角色卡片 ([`src/js/components/main-character-card.js`](src/js/components/main-character-card.js:1)) 和角色提示框 ([`src/js/components/character-tooltip.js`](src/js/components/character-tooltip.js:1)) 的属性显示逻辑。
    *   修改了 `MainCharacterCard` 的渲染逻辑，使其显示 `character.currentStats.attack` 和 `character.currentStats.hp` / `maxHp`。
    *   修改了 `CharacterTooltip` 的 `generateTooltipContent` 方法，使其优先从 `character.currentStats` 获取并显示属性值。
    *   组队界面 ([`src/js/components/team-management.js`](src/js/components/team-management.js:1)) 未直接显示详细攻防数值，故未修改。
    *   强调了在UI渲染前确保角色对象的 `currentStats` 已通过 `Character._updateCharacterEffectiveStats` 更新的重要性。
*   [2025-05-09 14:51:00] - **角色属性计算流程检查与调整：**
    *   分析了角色在地下城内外属性（`baseStats`, `weaponBonusStats`, `multiBonusStats`, `currentStats`, `dungeonOriginalStats`）的计算和应用逻辑，涉及文件 [`src/js/core/character.js`](src/js/core/character.js:1), [`src/js/core/dungeon.js`](src/js/core/dungeon.js:1), 和 [`src/js/core/dungeon-runner.js`](src/js/core/dungeon-runner.js:1)。
    *   根据用户决策，修改了 [`src/js/core/dungeon-runner.js`](src/js/core/dungeon-runner.js:1) 的 `startDungeonRun` 函数，确保在队伍进入地下城时立即为每个成员设置 `dungeonOriginalStats` 属性快照，并清除进入前的buff、重置技能冷却和地下城被动。
    *   确认突破加成 (`multiBonusStats`) 维持基于角色当前最新 `baseStats` 的计算方式。
    *   最终地下城内属性计算流程为：`currentStats = (dungeonOriginalStats + 基于 dungeonOriginalStats 的武器盘加成) + 基于当前 baseStats 的突破加成`。
## Recent Changes
*   [2025-05-09 17:07:00] - **Boss AI 技能选择逻辑实现：**
    *   修改了 [`src/data/boss-skills.json`](src/data/boss-skills.json:0)，为示例技能添加了 `triggerCondition`。
    *   修改了 [`src/js/core/battle.js`](src/js/core/battle.js:0) 中的 `processMonsterAction` 函数，实现了三阶段决策逻辑（血量触发、常规CD、普通攻击）。
    *   在 `Battle` 对象和怪物实例中添加了 `skillCooldowns` 管理。
    *   更新了 `updateBuffDurations` 以处理Boss技能CD。

*   [2025-05-09 16:37:53] - 修改了 src/data/boss-skills.json：统一了多个技能的 effectType 为 "multi_effect"，更新了技能描述以匹配实际效果，并明确了防御相关技能描述中的固定数值。
*   创建了 `memory-bank/productContext.md`。
*   [2025-05-08 11:48:58] - 修改了 `test-battle-new.html` 以更新角色和职业选择UI及相关JavaScript逻辑。
*   [2025-05-08 12:14:54] - 进一步修改 `test-battle-new.html` 以尝试修复错误并添加日志。
*   [2025-05-08 12:18:42] - 再次修改 `test-battle-new.html`，调整了角色/职业选择下拉列表的更新逻辑和相关的按钮状态管理，并为职业数据获取添加了增强日志。
*   [2025-05-09 00:00:00] - 修改了 [`src/js/core/battle.js`](src/js/core/battle.js) 中的 `processCharacterAction` 函数，以实现新的多技能使用规则和攻击性动作判断逻辑。
*   [2025-05-08 12:37:35] - 修改 `test-battle-new.html`：在 `loadGameData` 中为从JSON加载的角色数据动态添加 `rarity` 属性。在 `init` 和 `addEventListeners` 函数中添加了诊断日志。
*   [2025-05-08 23:26:36] - 修改 [`src/js/core/battle.js`](src/js/core/battle.js) `startBattle` 函数，增强了怪物HP初始化的健壮性，优先使用JSON中的 `monster.hp` 作为 `maxHp`，并确保初始HP等于 `maxHp`。添加了诊断日志。
*   [2025-05-09 14:37:00] - 修改了 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 文件，统一了所有技能 `description` 字段的格式，并移除了临时的 `descriptionForEffect` 字段。

## Open Questions/Issues
*   [2025-05-08 21:25:00] - **New Issue:** 角色在战斗中不再使用技能。
    *   **Analysis:**
        *   对 [`src/js/core/battle.js`](src/js/core/battle.js), [`src/js/core/skill-loader.js`](src/js/core/skill-loader.js), [`src/js/core/job-skills.js`](src/js/core/job-skills.js), [`src/js/core/job-system.js`](src/js/core/job-system.js), 和 [`src/js/core/job-skills-template.js`](src/js/core/job-skills-template.js) 的分析表明，根本原因在于 SSR 技能数据 ([`src/data/ssr_skill.json`](src/data/ssr_skill.json:1)) 没有被整合到核心的技能信息获取路径中。
        *   `JobSystem.getSkill(skillId)` 和 `SkillLoader.getSkillInfo(skillId)` 目前都不会从 SSR特定的数据源（如 `window.ssr_skills` 或 `SSRSkillsTemplate`）查找技能。
        *   这导致当角色尝试使用 SSR 技能时，系统获取到的是一个无效的“备用”技能对象，该对象无法成功执行。
    *   **Proposed Fix:**
        1.  修改 [`src/js/core/skill-loader.js`](src/js/core/skill-loader.js):
            *   添加 `loadSSRSkills()` 方法从 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 加载数据到 `window.ssr_skills`。
            *   在 `SkillLoader.init()` 中调用 `loadSSRSkills()`。
            *   在 `SkillLoader.getSkillInfo()` 的查找顺序中加入对 `window.ssr_skills[skillId]` 的检查。
        2.  修改 [`src/js/core/job-system.js`](src/js/core/job-system.js):
            *   在 `JobSystem.getSkill()` 的查找顺序中加入对 `window.ssr_skills[skillId]` 的检查。
*   **[2025-05-08 21:44:50] - Further Investigation (Protagonist ID: 124124):**
        *   Focused on protagonist (ID: 124124) not using skills, despite `effectType` in skill data files being correct.
        *   Read and analyzed [`src/js/core/battle.js`](src/js/core/battle.js), specifically the `processCharacterAction` function.
        *   Added detailed diagnostic `console.log` statements within `processCharacterAction` in [`src/js/core/battle.js`](src/js/core/battle.js) to trace:
            *   Current acting character ID and name.
            *   Character's full skill list and current cooldown states.
            *   Result of `getAvailableSkills(character)`.
            *   Intermediate steps in skill selection logic and the final chosen skill (or why none was chosen).
            *   Reason for resorting to a normal attack if a skill was not used.
        *   These logs are temporary and will be removed once the root cause is identified and fixed.
        *   Next step: Request user to run the game with these logs to capture output for analysis.
*   [2025-05-08 21:07:00] - **New Issue:** `ReferenceError: damageResult is not defined` at [`src/js/core/battle.js:1076`](src/js/core/battle.js:1076) in `processCharacterAction`.
    *   **Analysis:** The error occurs when attempting to access `damageResult.isCritical` after the attack loop. If the loop for normal attacks doesn't execute (e.g., if the monster is already defeated by a skill used earlier in the turn), `damageResult` remains undefined, leading to the ReferenceError. Additionally, the original logic for `critCount` only considered the last hit of a multi-attack.
    *   **Fix Applied:** Modified [`src/js/core/battle.js`](src/js/core/battle.js) to use a `criticalHits` counter that is correctly incremented within the attack loop for each critical hit. This `criticalHits` counter is then used to update `character.stats.critCount` and `battleStats.characterStats[character.id].critCount` after the loop. This resolves the ReferenceError and correctly counts all critical hits in a multi-attack.
*   [2025-05-08 21:03:00] - **New Issue:** `TypeError: Cannot read properties of null (reading 'teamMembers')` at [`src/js/core/battle.js:960`](src/js/core/battle.js:960) in `processCharacterAction`.
    *   **Analysis:** The error occurs because `this.currentBattle` is `null` when `processCharacterAction` attempts to access `this.currentBattle.teamMembers`. `this.currentBattle` is fully populated at the end of the `startBattle` function, after `processBattle` (which calls `processCharacterAction`) has completed.
    *   **Proposed Fix:** Pass `teamMembers` obstáculos as an argument from `processBattle` to `processCharacterAction` and use this argument instead of `this.currentBattle.teamMembers` within `processCharacterAction`.
*   [2025-05-08 23:14:00] - **New Issue:** 怪物（月影狼王）HP在战斗开始UI显示时为1716/4000，但后端逻辑显示为4000/4000。
    *   **Analysis:**
        *   在 [`src/js/core/battle.js`](src/js/core/battle.js) 的 `startBattle` 和 `processBattle` 函数中添加了诊断日志。
        *   日志显示，在 `processBattle` 的回合1开始时，以及在 `processTurnStartBuffs` 执行后，怪物的HP在后端逻辑中是4000/4000。
        *   搜索了 `Events.on('battle:start')`，未发现监听器。
        *   检查了怪物数据 [`src/data/monsters.json`](src/data/monsters.json)，月影狼王定义简单，无特殊技能或预设buff。
    *   **Root Cause Hypothesis:** UI层面在战斗初始化时未能正确获取或显示怪物的满HP状态。实际战斗逻辑中的HP是正确的。
    *   **Diagnostic Logs Added (to be removed after fix):**
        *   In `startBattle` (after monster HP init): `console.log(\`[DEBUG] startBattle: 怪物 ${monsterCharacter.name} (ID: ${monsterCharacter.id}) HP 初始化后: ${monsterCharacter.currentStats.hp}/${monsterCharacter.currentStats.maxHp}\`);`
        *   In `processBattle` (turn start): `console.log(\`[DEBUG] processBattle: 回合 ${this.currentTurn} 开始。怪物 ${monster.name} HP: ${monster.currentStats.hp}/${monster.currentStats.maxHp}\`);`
        *   In `processBattle` (after `processTurnStartBuffs`): `console.log(\`[DEBUG] processBattle: 回合 ${this.currentTurn}，processTurnStartBuffs 后。怪物 ${monster.name} HP: ${monster.currentStats.hp}/${monster.currentStats.maxHp}\`);`
    *   **Proposed Fix / Next Steps:**
        1.  **UI Investigation (User Task):** 检查UI代码如何获取并首次显示怪物HP，确保在战斗数据完全准备好后渲染。
        2.  **Preventive Fix (Applied):** 修改了 [`src/js/core/battle.js`](src/js/core/battle.js) 中 `startBattle` 函数的怪物HP初始化逻辑，使其更健壮，优先使用JSON中的 `monster.hp` 作为 `maxHp`，并确保初始HP等于 `maxHp`。
*   需要更明确的主角指定机制，而不是简单地假定队伍中的第一个角色。
*   职业赋予主角后，如果主角被从队伍中移除，职业状态如何处理。
*   `test-battle-new.html` 中角色选择和职业添加功能在之前的测试中存在问题，新的修改和日志旨在解决这些问题。等待用户测试反馈。 **[已解决 2025-05-08 12:37:35]**
*   武器盘相关函数 (`handleOpenWeaponSelectionModal` 等) 的定义缺失或未在此处考虑，导致相关事件监听器被临时注释。
*   [2025-05-08 12:26:54] - 调试 `test-battle-new.html`：为解决潜在的职业ID不匹配问题，修改了 `updateCharacterJobSelect` 函数以确保职业选项的 `value` 为字符串。同时，在 `handleAddCharacterToTeam` 函数中为职业数据查找逻辑添加了更健壮的日志记录和回退检查机制，以应对 `JobSystem.jobs` 中职业ID可能为数字或字符串的情况。 **[相关问题已通过rarity属性修复一并解决 2025-05-08 12:37:35]**
*   [2025-05-08 14:47:00] - 发现 [`test-battle-new.html`](test-battle-new.html) 中的 "ID 未找到" 错误（例如 `character_101`）很可能源于角色对象的内部 `id` 属性与其在 `allCharactersData` 集合中的键不一致。当UI使用内部 `id` 属性构建下拉选项，然后该值用于在 `allCharactersData` 中查找时，如果键名不同则会导致查找失败。
*   [2025-05-08 16:53:58] - **Current Focus:** 等待用户确认对一批 SSR 技能的处理。这些技能因包含特殊机制（如“消去不可”、“X回合后可用”、“概率触发”、“仅一次”等）或描述需要进一步明确，未自动更新到 [`ssr.json`](src/data/ssr.json:1) 和 [`ssr_skill.json`](src/data/ssr_skill.json:1) 中。
*   [2025-05-08 16:53:58] - **Recent Changes:**
    *   根据 [`ssrskill.txt`](src/data/ssrskill.txt:1) 的内容，更新了 [`ssr.json`](src/data/ssr.json:1) 中明确可处理的 SSR 角色技能列表（使用新的英文技能ID，无角色前缀）。
    *   根据 [`ssrskill.txt`](src/data/ssrskill.txt:1) 的内容，更新/创建了 [`ssr_skill.json`](src/data/ssr_skill.json:1) 中明确可处理的 SSR 技能详情（使用新的英文技能ID作为键，填充了中文名和描述）。
*   [2025-05-08 16:59:35] - **Recent Changes:** 用户确认了所有先前待处理的SSR技能的处理方式。这些技能已按照建议的英文ID添加至 [`ssr.json`](src/data/ssr.json:1) 的角色技能列表和 [`ssr_skill.json`](src/data/ssr_skill.json:1) 的技能详情中，描述按原样记录。
*   [2025-05-08 16:59:35] - **Current Focus:** SSR技能数据更新任务已完成。
*   [2025-05-08 17:37:27] - **Recent Changes:** 根据 [`ssrskill.txt`](src/data/ssrskill.txt:1) 的描述，全面更新了 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 文件，补充并结构化了所有SSR角色的技能效果，包括 `type`, `cooldown`, `effectType`, `targetType` 和具体的 `effects` 数组。
*   [2025-05-08 20:20:00] - 在 [`src/js/core/job-skills.js`](src/js/core/job-skills.js) 中实现了 `enmity` (背水伤害) 和 `hpCostPercentageCurrent` (当前HP百分比消耗) 技能效果。`enmity` 伤害会根据攻击者当前的HP百分比动态调整，`hpCostPercentageCurrent` 会扣除发动者当前HP的一定百分比作为代价，并确保HP至少保留1点。
*   [2025-05-08 17:37:27] - **Current Focus:** 完成了对 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 文件中SSR角色技能效果的分析和补充。
*   [2025-05-08 20:27:05] - **Recent Changes:** 修改了 [`src/js/core/battle.js`](src/js/core/battle.js:1) 中的 `applyDamageToTarget` 函数，实现了新的防御力减伤公式 (伤害 / (1 + 防御百分比))，替换了旧的占位符防御逻辑。
*   [2025-05-08 20:27:05] - **Current Focus:** 完成了对战斗系统中伤害计算公式的调整，特别是防御力对伤害减免的计算方式。
*   [2025-05-08 20:39:36] - **Recent Changes:** 修改了 [`src/js/core/battle.js`](src/js/core/battle.js:1) 中的战斗伤害上限。普通攻击上限调整为 199999，技能伤害上限调整为 899999。
*   [2025-05-08 20:39:36] - **Current Focus:** 完成了战斗伤害上限的调整。
*   [2025-05-08 20:52:00] - **Recent Changes:** 标准化了技能的 `effectType`。
    *   修改了数据文件 [`src/data/ssr_skill.json`](src/data/ssr_skill.json), [`src/data/sr_skills.json`](src/data/sr_skills.json), 和 [`src/data/r_skills.json`](src/data/r_skills.json)，将其中的顶层 `effectType` 字段更新为标准化的8个类型之一 (`damage`, `buff`, `debuff`, `heal`, `dispel`, `multi_effect`, `passive`, `trigger`)。
    *   修改了逻辑文件 [`src/js/core/job-skills.js`](src/js/core/job-skills.js) 中的 `useSkill` 函数，调整了 `switch` 语句以正确处理新的标准化 `effectType`，特别是 `multi_effect` 和 `trigger` 类型，确保它们通过 `applySkillEffects` 进行通用处理。
*   [2025-05-08 20:52:00] - **Current Focus:** 完成了技能 `effectType` 的标准化任务。
*   [2025-05-08 21:16:00] - **Recent Changes:** Implemented detailed skill usage logging in combat.
    *   Modified [`src/js/core/job-skills.js`](src/js/core/job-skills.js):
        *   Added comprehensive logging logic at the end of the `useSkill` method to record skill usage details (caster, skill name, target(s), effects like damage/heal/buff/debuff, and target HP) using `Battle.logBattle`.
        *   Updated `applyBuffEffects` and `applyDebuffEffects` to include the `name` of the buff/debuff in their returned effect details, facilitating more descriptive logs.
*   [2025-05-08 21:16:00] - **Current Focus:** Completed implementation of detailed skill usage logs. Preparing to update progress and finalize task.
*   [2025-05-08 21:40:00] - **Recent Changes:**
    *   根据用户反馈和对 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1) 中 `applySkillEffects` 函数的分析，重新审视并明确了技能顶层 `effectType` 的标准。
    *   决定继续使用现有的8个通用顶层 `effectType` (`damage`, `buff`, `debuff`, `heal`, `dispel`, `multi_effect`, `passive`, `trigger`)。
    *   更新了 [`memory-bank/systemPatterns.md`](memory-bank/systemPatterns.md:1) 以包含详细的指导原则，说明这些通用顶层类型如何映射到 `applySkillEffects` 中处理的更具体的原子效果类型。
    *   针对技能“霸装架式”的 `effectType: "self_buff_tradeoff"`，建议将其顶层 `effectType` 修改为 `multi_effect`，并在其 `effects` 数组中具体定义增益和代价效果。
*   [2025-05-08 21:40:00] - **Current Focus:** 完成对技能 `effectType` 标准的重新审视和文档更新。解决了用户关于 `effectType` 不一致的反馈。
*   [2025-05-08 21:53:23] - **Issue Resolved:** `JobSkills.useSkill` incorrectly returning `success: false` for successfully applied skills (e.g., `warriorSlash`).
    *   **Analysis:** The root cause was in `JobSkills.applySkillEffects` ([`src/js/core/job-skills.js`](src/js/core/job-skills.js:1)). If a `multi_effect` skill contained an unknown child effect type, the `default` case in the child effect processing `switch` statement would set `currentEffectResult.success = false`. This propagated, causing `JobSkills.useSkill` to return `success: false` even if other child effects (like buffs) were successfully applied.
    *   **Fix Applied:**
        *   Modified `JobSkills.applySkillEffects` in [`src/js/core/job-skills.js:418`](src/js/core/job-skills.js:418) (specifically the `default` case of the inner `switch` statement for `actualEffectType`): Changed `success: false` to `success: true` for `currentEffectResult` when an unknown child effect type is encountered. The message was also updated to indicate the effect was skipped. This prevents an unknown child effect from causing the entire `multi_effect` skill to be marked as failed.
        *   Commented out the `[DEBUG]` `console.log` statements previously added to `processCharacterAction` in [`src/js/core/battle.js`](src/js/core/battle.js) for diagnosing this issue.
    *   **Status:** Fix implemented and diagnostic logs adjusted. The skill system should now more accurately report success for partially successful multi-effect skills.
*   [2025-05-08 22:36:00] - **Issue Resolved & Refactored:** "角色在战斗中不再使用技能" (originally manifesting as `warriorSlash` not working).
    *   **Root Cause:** Incorrect skill data loading due to fallback logic (`JobSystem.getFallbackSkill`), hardcoded basic templates (`JobSkillsTemplate.loadBasicTemplates`), and conflicting definitions (`warriorSlash` defined as 【狂怒】 in JSON and basic templates).
*   [2025-05-08 22:42:00] - **New Issue Investigation:** Protagonist uses first available skill (e.g., "Rage") but not subsequent available skills (e.g., "Armor Break").
    *   **Analysis of `src/js/core/battle.js` - `processCharacterAction`:**
        *   The function retrieves a list of available skills using `this.getAvailableSkills(character)`.
        *   It then explicitly attempts to use only the *first* skill in this list (`availableSkills[0]`).
        *   There is no loop or further logic to iterate through or attempt other skills in the `availableSkills` list if the first one is attempted (regardless of success) or if there are multiple skills available.
        *   Once a skill attempt is made (passes `canUseSkill` and enters `JobSkills.useSkill`), the character proceeds to the normal attack phase.
    *   **Assessment:** This "use only the first available skill" logic is likely a simplified implementation and not the intended final behavior, as it can lead to suboptimal combat actions (e.g., using a buff and then not an available attack skill).
    *   **Recommendation for Improvement (Conceptual):**
        1.  **Iterate Through Available Skills:** Modify `processCharacterAction` to loop through all skills returned by `getAvailableSkills`.
        2.  **Define Skill Usage Limits:** Determine game design rules for skill usage per turn (e.g., one major skill, or one buff + one attack).
        3.  **Skill Prioritization (Optional Advanced):** Introduce skill priorities or categories (buff, debuff, damage) to make more intelligent choices within the loop.
        4.  **Conditional Continuation:** If a skill is used, decide if the loop should continue (e.g., allow a buff then an attack) or break (e.g., after a major attack skill).
    *   **Next Step:** Awaiting user feedback or further instructions on how the skill selection logic should be modified. No code changes made yet due to the core nature of this logic.
    *   **Fix Applied:** Refactored skill loading per user request. Removed fallback logic and hardcoded templates. Unified skill data acquisition to `SkillLoader.getSkillInfo`. Ensured skill data is sourced strictly from JSON files (`job-skills-templates.json`, `r/sr/ssr_skills.json`). Kept `warriorSlash` as 【狂怒】 in JSON per user instruction. Corrected `applyBuffEffects` return logic. Diagnostic logs added during debugging were commented out.
*   [2025-05-08 23:30:00] - **Debug Task: `defenseDown` and `effectType` Standardization**
        *   **Issue 1:** Atomic effect `defenseDown` in skill "护甲破坏" ([`src/data/job-skills-templates.json`](src/data/job-skills-templates.json:590)) was reported as unknown in `applySkillEffects` ([`src/js/core/job-skills.js`](src/js/core/job-skills.js:304)).
            *   **Analysis:** Checked `applySkillEffects` ([`src/js/core/job-skills.js:390`](src/js/core/job-skills.js:390)). Found that `debuff` case ([`src/js/core/job-skills.js:394`](src/js/core/job-skills.js:394)) correctly calls `applyDebuffEffects` ([`src/js/core/job-skills.js:588`](src/js/core/job-skills.js:588)). Checked [`src/js/core/buff-system.js`](src/js/core/buff-system.js) and confirmed `defenseDown` is a defined `buffType` ([`src/js/core/buff-system.js:35`](src/js/core/buff-system.js:35)) and handled by generic buff/debuff application logic.
            *   **Resolution:** No code changes needed for `job-skills.js` or `buff-system.js`. The `defenseDown` effect should be defined with `type: "defenseDown"` within the skill's `effects` array, and its parent `effectType` should be a standard one (e.g. `multi_effect` or `debuff`).
        *   **Issue 2:** Skill "护甲破坏" had a top-level `effectType` of `"damage_and_debuff"` ([`src/data/job-skills-templates.json:598`](src/data/job-skills-templates.json:598)), which is not one of the 8 standard types.
            *   **Analysis:** Located "护甲破坏" (ID: `armorBreak`) in [`src/data/job-skills-templates.json`](src/data/job-skills-templates.json:590).
            *   **Resolution:** Changed `effectType` for `armorBreak` from `"damage_and_debuff"` to `"multi_effect"` in [`src/data/job-skills-templates.json`](src/data/job-skills-templates.json:598). The `effects` array already correctly defined the damage and `defenseDown` atomic effects.
*   [2025-05-09 09:26:00] - 澄清了包含多个buff效果的技能的处理流程：
    *   如果顶层 `effectType` 是 `'buff'`，则 `JobSkills.applyBuffEffects` 会遍历技能的 `effects` 数组并应用所有buff。
    *   如果顶层 `effectType` 是 `'multi_effect'`，则 `JobSkills.applySkillEffects` 会遍历技能的 `effects` 数组。对于其中 `type: "buff"` 的每个子效果，它会单独调用 `JobSkills.applyBuffEffects` 来处理该buff。
    *   两种情况下，多个buff都会被正确处理。参考 [`src/js/core/job-skills.js`](src/js/core/job-skills.js)。
*   [2025-05-09 09:53:00] - 更新了 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 中部分技能的顶层 `effectType` 以符合8种标准类型。具体修改：
    *   `zhanShuCeFangYuan` 的 `effectType`: `"team_buff"` -> `"buff"`
    *   `zhanShuCeHeYi` 的 `effectType`: `"aoe_debuff"` -> `"debuff"`
    *   文件 [`src/data/r_skills.json`](src/data/r_skills.json:1) 和 [`src/data/sr_skills.json`](src/data/sr_skills.json:1) 经检查已符合标准，未作修改。
*   [2025-05-09 10:02:00] - 对 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 进行了全面检查和更新，确保所有技能的顶层 `effectType` 符合8种标准类型。多个非标准 `effectType` (如 `"aoe_damage_and_debuff"`, `"passive_team_buff"`, `"self_evasion"`, `"enmity_damage"`, `"revive_ally"` 等) 已根据其效果内容和 [`memory-bank/systemPatterns.md`](memory-bank/systemPatterns.md:1) 的指导原则，被修正为 `"multi_effect"`, `"passive"`, `"buff"`, `"damage"`, 或 `"trigger"` 等标准类型。
*   [2025-05-09 10:20:00] - 修改了 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1) 以支持统一后的原子效果类型并处理新的原子效果：
    *   [`applyDamageEffects()`](src/js/core/job-skills.js:1093) 现在将原子效果中的 `count` 属性作为 `hits` 传递给 `applyDamageToTarget`，以支持统一后的多段伤害处理。
    *   [`applySkillEffects()`](src/js/core/job-skills.js:304) 的 `switch` 语句 ([`src/js/core/job-skills.js:390`]) 已扩展，为 `castSkill`, `applyBuffPackage`, `applyDebuff`, `customBuff`, `echo`, `fieldEffect`, `additionalDamage` 添加了处理逻辑或占位符。
*   [2025-05-09 10:29:00] - 修正了 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1) 中 `applySkillEffects()` 函数对 `applyBuffPackage` 和 `applyDebuff` 原子类型的处理逻辑。现在，当原子效果类型为 `applyBuffPackage` 时，会尝试调用 `BuffSystem.applyBuffPackage()`。当类型为 `applyDebuff` 且包含子效果数组时，也会尝试通过 `BuffSystem.applyBuffPackage()` (标记为debuff包) 处理，否则按单个debuff处理。这确保了对buff包的更准确处理。
*   [2025-05-09 10:33:00] - 增强了 [`src/js/core/buff-system.js`](src/js/core/buff-system.js:1) 中 `applyBuff()` 函数的逻辑，以正确处理 `debuffResistOnce`、`debuffImmunity` 和 `statusImmunity` 效果。现在，在尝试应用负面buff之前，会检查目标是否拥有这些抵抗/免疫效果。如果存在，则负面buff将被阻止应用，并且 `debuffResistOnce` 的层数会相应减少。
*   [2025-05-09 11:11:00] - 重构了伤害处理逻辑，以提高一致性和集中化：
    *   [`JobSkills.applyDamageEffects()`](src/js/core/job-skills.js:1161) 现在负责计算技能的原始伤害（包括`skillDamageUp`和`additionalDamage`效果），然后调用 `Battle.applyDamageToTarget()` ([`battle.js`第1797行](src/js/core/battle.js:1797)) 进行核心伤害计算（暴击、防御、减伤等），并最终负责扣减目标HP。
    *   [`src/js/core/battle-system-integration.js`](src/js/core/battle-system-integration.js:1) 中对 `Battle.applyDamageToTarget` 的猴子补丁 ([`battle-system-integration.js`第486行](src/js/core/battle-system-integration.js:486)) 已更新，现在它正确调用 `Battle.js` 中的原始 `applyDamageToTarget`。援护逻辑在原始计算前执行，追击和吸血逻辑在原始计算后执行。
    *   移除了 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1) 中多余的 `applyDamageToTarget` ([`job-skills.js`第762行](src/js/core/job-skills.js:762)) 方法。
*   [2025-05-09 11:43:00] - 根据 [`src/data/skill2.csv`](src/data/skill2.csv:1) 的内容，更新了 [`src/data/ssr.json`](src/data/ssr.json:1) 和 [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) 文件，添加了新的光属性SSR角色及其技能。
    *   角色初始HP/ATK已根据最大值按比例估算。
    *   技能的顶层 `effectType` 和原子 `type` 均使用了项目中已定义的类型。
    *   与用户确认并处理了新的效果机制，如基于最大HP的百分比HP消耗（通过修改 `hpCostPercentageCurrent` 实现）和“不死身”效果（添加了 `guts` buff类型及相应处理逻辑）。
    *   为萝莎米娅的被动技能添加了 `onTurnEndIfHpIsOne` 的 `proc` 触发条件，并在回合结束逻辑中添加了检查。
    *   为萝莎米娅的“陆踏符”技能引入了 `directDamageValueUp` buff类型，并在伤害计算中应用。
*   [2025-05-09 13:58:00] - 完成了对新SSR技能JSON定义中原子buff效果的规范化。
    *   移除了新添加技能中普通原子buff效果的自定义 `name` 属性，使其默认使用 `BuffSystem.buffTypes` 中定义的名称。
    *   确认了这些原子buff效果将使用 `BuffSystem.buffTypes` 中更新后的 `canDispel`, `stackable`, `maxStacks`, 和 `valueInteraction` 默认行为。
*   [2025-05-09 14:06:00] - Finalized updates to [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) for newly added光属性角色技能. Ensured common atomic buff/debuff effects do not carry unnecessary `name` overrides and rely on `BuffSystem.buffTypes` defaults. Verified that `canDispel` and `stackable` properties are also implicitly handled by `BuffSystem.buffTypes` unless an explicit override is needed (which was not the case for these common buffs after `buffTypes` update).