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