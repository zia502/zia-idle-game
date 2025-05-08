# Decision Log

This file records architectural and implementation decisions using a list format.
2025-05-08 11:35:26 - Log of updates made.

*

## Decision

*   

## Rationale 

*

## Implementation Details

*
---
### Decision
[2025-05-08 11:44:27] - 将 `test-battle-new.html` 中的职业选择与稀有度选择合并到同一个下拉列表。

**Rationale:**
简化用户界面并符合“职业为主角专属”的逻辑。

**Implications/Details:**
UI 调整将影响 `test-battle-new.html` 的角色创建/编辑流程。

---
### Decision
[2025-05-08 14:48:00] - 强化角色数据ID管理策略，确保 `allCharactersData` 集合的键与角色对象内部ID的一致性。

**Rationale:**
解决在 [`test-battle-new.html`](test-battle-new.html) 中发生的 "ID 未找到" 错误。该错误是由于UI（如下拉选择框 [`#character-job-select`](test-battle-new.html:224)）使用角色对象内部的 `id` 属性，而后续在 `allCharactersData` 中查找时，如果该集合的键与此 `id` 不匹配，则导致查找失败。例如，如果 `allCharactersData` 的键是 `r_char1`，而角色对象的 `id` 是 `character_101`，则会出错。

**Implications/Details:**
- **数据加载与处理**: 在 `loadGameData` 函数（[`test-battle-new.html`](test-battle-new.html)）中，当从JSON文件（如 [`r.json`](src/data/r.json:1)）加载数据并构建 `allCharactersData` 时，必须确保用作键的ID与存储的角色对象内部的 `id` 属性完全一致。
- **ID生成/规范化**: 如果原始数据文件中的ID格式不统一，应在加载过程中进行规范化，以确保一致性。
- **UI交互**: 确保UI组件（如 [`#character-job-select`](test-battle-new.html:224)）填充的 `value` 属性直接对应于 `allCharactersData` 中有效的键。
- **错误处理**: 在 `handleAddCharacterToTeam` 函数（[`test-battle-new.html`](test-battle-new.html)）中，即使ID管理得到加强，也应保留或增强对ID查找失败的错误处理和日志记录，以便快速定位未来可能出现的问题。
- **职业数据**: 同样的ID一致性原则也适用于职业数据（`JobSystem.jobs`），确保从UI选择的职业ID能够准确地在职业数据集合中找到对应的条目。
---
### Decision (Code)
[2025-05-08 16:54:09] - 决定 SSR 技能更新流程中的技能ID命名规范和待确认技能的处理方式。

**Rationale:**
根据用户指示，统一技能ID为英文（基于拼音的小驼峰命名），不带角色前缀，以提高一致性和可读性。对于包含特殊机制或描述不明确的技能，不直接修改 JSON 文件，而是整理后交由用户确认，以确保数据准确性并符合用户预期。

**Details:**
*   **技能ID规范:** 从 [`ssrskill.txt`](src/data/ssrskill.txt:1) 提取的技能名，其中文部分被转换为小驼峰式的英文ID (例如，“冰晶结界” -> `bingJingJieJie`)。此ID用于 [`ssr.json`](src/data/ssr.json:1) 的 `skills` 数组和 [`ssr_skill.json`](src/data/ssr_skill.json:1) 的键。
*   **待确认技能处理:**
    *   在解析 [`ssrskill.txt`](src/data/ssrskill.txt:1) 时，包含特定关键词（如“消去不可”，“X回合后才可使用”，“概率”，“仅一次”，“再使用不可”等）的技能被标记为需要用户确认。
    *   这些待确认技能不会被自动写入 [`ssr.json`](src/data/ssr.json:1) 或 [`ssr_skill.json`](src/data/ssr_skill.json:1)。
    *   将整理这些技能及其需要确认的原因，通过 `ask_followup_question` 工具（如果当前模式允许）或在最终报告中向用户提出。
*   **文件更新:**
    *   [`ssr.json`](src/data/ssr.json:1): 仅更新明确技能的ID到对应角色的 `skills` 数组。
    *   [`ssr_skill.json`](src/data/ssr_skill.json:1): 为明确技能创建或更新条目，键为新的英文ID，值为技能的中文名和描述。其他复杂字段（`type`, `effects`等）暂时留空或使用默认值，待后续完善。
---
### Decision
[2025-05-08 20:46:00] - 采纳标准化的技能 `effectType` 列表以统一技能定义。

**Rationale:**
规范编写器模式分析发现，当前技能文件（尤其是 [`ssr_skill.json`](src/data/ssr_skill.json)）中的顶层 `effectType` 用法不统一，主要起描述作用，而核心逻辑依赖于 `effects` 数组内的原子 `type`。为了提高数据一致性、可维护性，并为未来的技能逻辑处理提供更清晰的分类，决定采纳一套标准化的 `effectType`。这套标准基于规范编写器的建议，并结合了对现有技能多样性的考虑。

**Implications/Details:**
*   **标准列表采纳:** 最终采纳的 `effectType` 列表为：`damage`, `buff`, `debuff`, `heal`, `dispel`, `multi_effect`, `passive`, `trigger`。其详细定义已记录在 [`memory-bank/systemPatterns.md`](memory-bank/systemPatterns.md)。
*   **文件修改:**
    *   需要修改技能数据文件，如 [`ssr_skill.json`](src/data/ssr_skill.json), [`sr_skills.json`](src/data/sr_skills.json), [`r_skills.json`](src/data/r_skills.json)，将其中的 `effectType` 值更新为新的标准值。
    *   可能需要调整技能处理逻辑，例如在 [`src/js/core/job-skills.js`](src/js/core/job-skills.js) 或其他相关模块中，如果存在基于旧 `effectType` 的 `switch` 语句或条件判断，需要更新以适应新的标准。
*   **数据一致性:** 确保所有技能定义都遵循新的 `effectType` 标准。
*   **未来扩展:** 新的 `effectType` 为未来添加更复杂的技能逻辑提供了基础。
---
### Decision (Debug)
[2025-05-08 21:25:00] - Resolve "角色在战斗中不再使用技能" bug by integrating SSR skill data loading.

**Rationale:**
Analysis revealed that SSR skill data from [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) was not being loaded or accessed by `JobSystem.getSkill()` or `SkillLoader.getSkillInfo()`. This resulted in the system using fallback/empty skill objects for SSR skills, leading to failed skill executions.

**Details:**
The fix involves two main parts:
1.  **Modify [`src/js/core/skill-loader.js`](src/js/core/skill-loader.js):**
    *   Implement a `loadSSRSkills()` method to fetch data from [`src/data/ssr_skill.json`](src/data/ssr_skill.json:1) and store it in `window.ssr_skills`.
    *   Call `loadSSRSkills()` within `SkillLoader.init()`.
    *   Update `SkillLoader.getSkillInfo()` to include `window.ssr_skills` in its lookup sequence.
2.  **Modify [`src/js/core/job-system.js`](src/js/core/job-system.js):**
    *   Update `JobSystem.getSkill()` to include `window.ssr_skills` in its lookup sequence, ensuring consistency.
---
### Decision (Spec)
[2025-05-08 21:40:00] - 重新审视并明确技能顶层 `effectType` 标准，维持通用类型并强化映射指导。

**Rationale:**
用户反馈技能 "霸装架式" 的 `effectType: "self_buff_tradeoff"` 不符合 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1) 中 `applySkillEffects` 函数处理的原子效果类型。这表明需要更清晰的 `effectType` 定义和使用指南。
经过分析，决定继续使用先前在 [`memory-bank/systemPatterns.md`](memory-bank/systemPatterns.md:1) 中定义的8个通用顶层 `effectType` (`damage`, `buff`, `debuff`, `heal`, `dispel`, `multi_effect`, `passive`, `trigger`)。这种方法的好处是保持顶层分类的简洁性，同时通过技能的 `effects` 数组内部的 `type` 属性来指定具体的原子效果，这与 `applySkillEffects` 的现有处理逻辑一致。

**Implications/Details:**
*   **标准维持与强化:** 坚持使用8个通用顶层 `effectType`。
*   **文档更新:**
    *   [`memory-bank/systemPatterns.md`](memory-bank/systemPatterns.md:1) 已更新，为每个通用顶层 `effectType` 提供了详细的定义，并明确了它们如何映射到 `applySkillEffects` ([`src/js/core/job-skills.js:281`](src/js/core/job-skills.js:281)) 中处理的原子或复合原子效果类型（如 `damage`, `buff`, `debuff`, `heal`, `dispel`, `revive`, `enmity`, `damage_and_debuff`, `damage_and_buff`, `triggerSkill`, `proc`）。
    *   特别强调 `multi_effect` 用于组合效果或包含 `revive`, `triggerSkill`, `proc` 等复杂原子效果的技能。
*   **特定案例处理 ("霸装架式"):**
    *   技能 "霸装架式" 的原 `effectType: "self_buff_tradeoff"` 应修改为顶层 `effectType: "multi_effect"`。
    *   其 `effects` 数组应包含至少两个对象：一个 `type: "buff"` 用于描述增益，另一个用于描述 "tradeoff"（例如 `type: "debuff"` 或 `type: "hpCostPercentageCurrent"`）。
*   **数据一致性:** 未来的技能定义和现有技能的审查应遵循此更新后的标准。
*   **代码影响:** [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1) 中的 `useSkill` ([`src/js/core/job-skills.js:20`](src/js/core/job-skills.js:20)) 和 `applySkillEffects` ([`src/js/core/job-skills.js:281`](src/js/core/job-skills.js:281)) 函数的现有逻辑与此方案兼容，主要依赖 `effects` 数组中的原子 `type` 进行分发。
---
### Decision (Debug)
[2025-05-08 22:36:00] - Refactor Skill Loading &amp; Remove Fallbacks/Hardcoding

**Rationale:**
Identified root cause of skill usage failure (`warriorSlash` executing as 【狂怒】) as incorrect skill data being returned. This stemmed from multiple issues: incorrect fallback logic in `JobSystem.getFallbackSkill`, incorrect hardcoded definitions in `JobSkillsTemplate.loadBasicTemplates`, and an incorrect definition in `job-skills-templates.json` itself (which user instructed to keep as is, implying `warriorSlash` ID *should* map to 【狂怒】 based on the authoritative JSON). User explicitly requested removal of all fallback mechanisms and hardcoded basic templates, enforcing strict loading solely from JSON data files. Refactored skill acquisition to use a single unified function (`SkillLoader.getSkillInfo`) and removed redundant/fallback functions/logic (`JobSystem.getFallbackSkill`, `JobSkillsTemplate.getTemplate`, `JobSkillsTemplate.loadBasicTemplates`). Corrected `applyBuffEffects` return logic.

**Details:**
*   Unified skill data lookup to `SkillLoader.getSkillInfo`, searching templates and `window.r/sr/ssr_skills`.
*   Removed `JobSystem.getFallbackSkill`.
*   Removed `JobSkillsTemplate.getTemplate`.
*   Removed `JobSkillsTemplate.loadBasicTemplates` and its call from `init`.
*   Modified `JobSystem.getSkill` to call `SkillLoader.getSkillInfo`.
*   Modified `JobSkills.useSkill` to call `SkillLoader.getSkillInfo` instead of `JobSystem.getSkill` and `JobSkillsTemplate.getTemplate`.
*   Corrected return value of `JobSkills.applyBuffEffects` to include `success: true`.
*   Reverted `warriorSlash` definition in `job-skills-templates.json` back to "狂怒" as per user instruction.
*   Affected files: [`src/js/core/job-system.js`](src/js/core/job-system.js), [`src/js/core/skill-loader.js`](src/js/core/skill-loader.js), [`src/js/core/job-skills-template.js`](src/js/core/job-skills-template.js), [`src/js/core/job-skills.js`](src/js/core/job-skills.js), [`src/data/job-skills-templates.json`](src/data/job-skills-templates.json).