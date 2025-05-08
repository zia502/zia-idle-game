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