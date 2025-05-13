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
---
### Decision (Debug)
[2025-05-13 14:21:59] - **修复游戏重置后角色创建对话框不显示的问题**

**Rationale:**
用户反馈在游戏重置后，角色创建对话框没有按预期显示。经检查，[`src/js/core/game.js`](src/js/core/game.js) 的 `resetGame()` 方法在尝试调用角色创建逻辑时，依赖的 `CharacterCreation` 模块导入语句被注释掉了。

**Details:**
*   **修改 [`src/js/core/game.js`](src/js/core/game.js):**
    *   取消了文件顶部对 `CharacterCreation` 模块的导入语句的注释: `import CharacterCreation from '../components/character-creation.js';` ([`src/js/core/game.js:11`](src/js/core/game.js:11))。
*   **影响:**
    *   确保 `Game.resetGame()` 方法能够正确调用 `CharacterCreation.init(true)`，从而在游戏重置后强制显示角色创建对话框。

**Affected components/files:**
*   [`src/js/core/game.js`](src/js/core/game.js)
---
### Decision (Debug)
[2025-05-13 13:21:10] - **修复 `Character.createMainCharacter方法不存在` 错误**

**Rationale:**
用户反馈在 [`src/js/components/character-creation.js`](src/js/components/character-creation.js:234) 的 `createCharacter` 方法中出现 `Character.createMainCharacter方法不存在` 错误。经检查，[`src/js/components/character-creation.js`](src/js/components/character-creation.js) 未导入 `Character` 模块。此外，[`src/js/core/character.js`](src/js/core/character.js) 中不存在 `createMainCharacter` 方法，但存在 `addCharacter` 方法，该方法内部调用 `createCharacter` 并处理角色添加逻辑。

**Details:**
*   **修改 [`src/js/components/character-creation.js`](src/js/components/character-creation.js):**
    *   在文件顶部添加了 `import Character from '../core/character.js';` 以及其他相关模块的导入语句。
    *   在 `createCharacter` 方法中 ([`src/js/components/character-creation.js:191`](src/js/components/character-creation.js:191))，将对 `Character.createMainCharacter(characterData)` 的调用修改为 `Character.addCharacter(characterData)`。
*   **影响:**
    *   确保 `CharacterCreation` 模块能够正确访问 `Character` 模块的功能，并调用正确的方法来创建和添加主角。

**Affected components/files:**
*   [`src/js/components/character-creation.js`](src/js/components/character-creation.js)
---
### Decision (Debug)
[2025-05-13 13:18:40] - **修复 `SyntaxError: Identifier 'Inventory' has already been declared` in `game.js`**

**Rationale:**
用户反馈在 [`src/js/core/game.js`](src/js/core/game.js:1368) 出现 `SyntaxError: Identifier 'Inventory' has already been declared` 错误。这是因为 [`src/js/core/game.js`](src/js/core/game.js) 文件顶部通过 `import Inventory from './inventory.js';` 导入了 `Inventory` 模块，同时在文件内部 ([`src/js/core/game.js:1368`](src/js/core/game.js:1368)) 又通过 `const Inventory = { ... };` 声明了一个同名对象，导致了声明冲突。

**Details:**
*   **修改 [`src/js/core/game.js`](src/js/core/game.js):**
    *   移除了文件内部的 `const Inventory = { ... };` 对象声明 (从原第 1368 行到第 1470 行)。
    *   保留了文件顶部的 `import Inventory from './inventory.js';` ([`src/js/core/game.js:10`](src/js/core/game.js:10)) 语句，确保游戏逻辑使用从 [`src/js/core/inventory.js`](src/js/core/inventory.js) 导入的 `Inventory` 模块。
*   **影响:**
    *   解决了 `Inventory` 标识符重复声明的 `SyntaxError`。

**Affected components/files:**
*   [`src/js/core/game.js`](src/js/core/game.js)
---
### Decision (Debug)
[2025-05-13 12:21:41] - **修复 `game.js` 中的多个 `ReferenceError`**

**Rationale:**
用户反馈在 [`src/js/core/game.js`](src/js/core/game.js) 中出现多个 `ReferenceError`，包括：
1.  `Character模块未加载或updateMainCharacterElement方法不存在` ([`game.js:139`](src/js/core/game.js:139))
2.  `Team或Character模块未定义，无法更新weaponBonusStats` ([`game.js:111`](src/js/core/game.js:111))
3.  `DungeonRunner模块未定义或init方法不存在` ([`game.js:98`](src/js/core/game.js:98))
这些错误表明 [`src/js/core/game.js`](src/js/core/game.js) 文件试图使用 `Character`、`Team` 和 `DungeonRunner` 对象，但这些模块没有被正确导入。

**Details:**
*   **修改 [`src/js/core/game.js`](src/js/core/game.js):**
    *   在文件顶部添加了以下导入语句：
        *   `import Character from './character.js';`
        *   `import Team from './team.js';`
        *   `import DungeonRunner from './dungeon-runner.js';`
        *   以及其他根据代码上下文推断可能需要的模块，如 `Events`, `Storage`, `FileUtils`, `Resources`, `Weapon`, `Inventory`。
*   **影响:**
    *   这使得 `Game` 模块能够正确访问所需的其他核心模块，解决了上述 `ReferenceError`。

**Affected components/files:**
*   [`src/js/core/game.js`](src/js/core/game.js)
---
### Decision (Debug)
[2025-05-13 12:17:44] - **修复 `ReferenceError: Dungeon is not defined` in `UI.js`**

**Rationale:**
用户反馈在 [`src/js/components/UI.js`](src/js/components/UI.js:2849) 的 `updateDungeonList` 函数中出现 `ReferenceError: Dungeon is not defined` 错误。这是因为该文件试图使用 `Dungeon` 对象（调用 `Dungeon.currentRun`）但没有导入 `Dungeon` 模块。

**Details:**
*   **修改 [`src/js/components/UI.js`](src/js/components/UI.js):**
    *   在文件顶部添加了 `import Dungeon from '../core/dungeon.js';` 语句。
*   **影响:**
    *   这使得 `UI` 模块能够正确访问 `Dungeon` 对象，解决了该 `ReferenceError`。

**Affected components/files:**
*   [`src/js/components/UI.js`](src/js/components/UI.js)
---
### Decision (Debug)
[2025-05-13 12:15:59] - **修复 `ReferenceError: UI is not defined` in `dungeon.js`**

**Rationale:**
用户反馈在 [`src/js/core/dungeon.js`](src/js/core/dungeon.js:322) 的 `init` 函数中出现 `ReferenceError: UI is not defined` 错误。这是因为该文件试图使用 `UI` 对象（调用 `UI.showMessage`）但没有导入 `UI` 模块。

**Details:**
*   **修改 [`src/js/core/dungeon.js`](src/js/core/dungeon.js):**
    *   在文件顶部添加了 `import UI from '../components/UI.js';` 语句。
*   **影响:**
    *   这使得 `Dungeon` 模块能够正确访问 `UI` 对象，解决了该 `ReferenceError`。

**Affected components/files:**
*   [`src/js/core/dungeon.js`](src/js/core/dungeon.js)
---
### Decision (Debug)
[2025-05-13 11:49:40] - **修复 `SyntaxError: The requested module './core/weapon.js' does not provide an export named 'default'`**

**Rationale:**
用户报告的错误 `Uncaught SyntaxError: The requested module './core/weapon.js' does not provide an export named 'default' (at main.js:9:8)` 表明 [`src/js/main.js`](src/js/main.js:9) 尝试导入 [`src/js/core/weapon.js`](src/js/core/weapon.js) 的默认导出，但该文件未提供。检查 [`src/js/core/weapon.js`](src/js/core/weapon.js) 确认了它定义了 `Weapon` 对象但缺少 `export default Weapon;` 语句。

**Details:**
*   **修改 [`src/js/core/weapon.js`](src/js/core/weapon.js):**
    *   在文件末尾 ([`src/js/core/weapon.js:1198`](src/js/core/weapon.js:1198)) 添加了 `export default Weapon;` 语句。
*   **影响:**
    *   这使得 [`main.js`](src/js/main.js) 中的 `import Weapon from './core/weapon.js';` 语句能够成功导入模块，解决了该 `SyntaxError`。

**Affected components/files:**
*   [`src/js/core/weapon.js`](src/js/core/weapon.js)
---
### Decision (Debug)
[2025-05-13 10:27:00] - **修复JavaScript加载错误和文件未找到错误**

**Rationale:**
用户报告的错误包括 `Uncaught SyntaxError: Unexpected token 'export'`，`Uncaught ReferenceError`，以及多个 `404 (File not found)` 错误。这些问题主要源于：
1.  ES6模块脚本未使用 `type="module"` 加载。
2.  HTML中引用了不存在的JavaScript文件。

**Details:**
*   **修改 [`index.html`](index.html):**
    *   为所有位于 `src/js/core/` 和 `src/js/components/` 目录下的 `<script>` 标签添加了 `type="module"` 属性。这解决了 `Unexpected token 'export'` 和相关的 `ReferenceError` 问题，确保模块正确加载和解析。
    *   移除了对以下不存在文件的 `<script>` 引用：`src/js/core/quest.js` ([`index.html:431`](index.html:431)), `src/js/components/ui_init.js` ([`index.html:442`](index.html:442)), `src/js/components/character-creator.js` ([`index.html:444`](index.html:444)), `src/js/utils/helpers.js` ([`index.html:460`](index.html:460))。这些文件在 `src/js/` 目录结构中未找到，移除引用以解决 `404` 错误。
*   **影响:** 这些更改旨在解决大部分初始报告的错误，特别是与模块加载和文件引用相关的错误。`Identifier 'Inventory' has already been declared` 错误也可能因此得到解决，因为模块化加载会改变作用域。

**Affected components/files:**
*   [`index.html`](index.html)
---
### Decision (Architecture)
[2025-05-12 16:14:00] - **修正：新设计物品（经验材料等）的掉落机制**

**Rationale:**
根据用户最新澄清，新设计的物品（如经验材料 `exp_small`, `exp_medium`, `exp_large` 以及其他新分类的占位符物品）应通过怪物掉落的**宝箱**获得，而不是通过怪物直接掉落。这修正了先前可能在 `code` 模式中实现的直接掉落逻辑。核心机制将依赖现有的 `chestDrops` 定义。

**Implications/Details:**

*   **物品获取途径:** 新设计的物品（特别是 `exp_small`, `exp_medium`, `exp_large` 和其他来自 [`src/data/items_definitions.json`](src/data/items_definitions.json) 的新分类占位符物品）将**仅通过**修改现有地下城定义中的 `chestDrops` ([`src/js/core/dungeon.js`](src/js/core/dungeon.js) 中 `Dungeon.dungeons.<dungeon_id>.chestDrops`) 来实现掉落。
*   **代码修改范围 (指导 `code` 模式):**
    *   **主要修改:** `code` 模式应专注于向 [`src/js/core/dungeon.js`](src/js/core/dungeon.js) 中各个地下城的 `chestDrops` 对象添加新的经验材料和占位符物品条目，并为其分配合理的掉落率 (`rate`)。
    *   **关键修正/回退:**
        *   **移除/忽略直接掉落:** `code` 模式需要**忽略或回退**任何先前为这些新物品实现的直接怪物掉落逻辑。这包括：
            *   在怪物/Boss定义文件 ([`src/data/monsters.json`](src/data/monsters.json), [`src/data/bosses.json`](src/data/bosses.json)) 中为新物品添加的 `drops` 数组条目。
            *   在 [`src/js/core/dungeon.js`](src/js/core/dungeon.js) 的 `Dungeon.processRewards()` 函数中，任何专门用于处理这些新物品直接掉落的逻辑。
        *   **保留通用直接掉落 (如果存在):** 如果项目中已存在用于其他旧物品的通用直接掉落机制，该机制本身可以保留，但**不能**用于掉落这些新的、指定通过宝箱获取的物品。
*   **现有宝箱逻辑:** 确认现有的“怪物掉落宝箱数量”的逻辑（用户指出在 `Dungeon.processRewards` 中）和（推测存在的）“开启宝箱并根据 `chestDrops` 抽取物品”的逻辑不需要为本次任务修改。本次任务仅更新宝箱的“内容物清单” (`chestDrops`)。
*   **先前决策的修正:** 此决策修正了 [2025-05-12 13:30:04] 关于“物品系统重构 - 核心架构决策”中关于“怪物掉落机制”的部分。原先设想的为新物品在怪物定义中添加 `drops` 数组并修改 `Dungeon.processRewards` 处理直接掉落的方案，现已明确**不适用于这些新设计的物品**。这些新物品将完全依赖 `chestDrops`。
---
### Decision (Architecture)
[2025-05-10 19:26:00] - 采纳新的三阶段战斗顺序：我方技能 -> 我方普攻 -> 敌方行动。

**Rationale:**
根据规范编写器模式的建议，为了提供更清晰和结构化的战斗流程，将原有的战斗顺序调整为明确的三个阶段。这有助于更好地管理技能释放、普通攻击的执行时机以及敌方行动的插入点。

**Implications/Details:**
*   **战斗主循环修改:** 需要重构战斗主循环逻辑（主要在 [`src/js/core/battle.js`](src/js/core/battle.js:1) 的 `processTurn` 或类似函数）。
*   **阶段划分:**
    *   **我方技能阶段:** 允许我方所有角色依次使用可用技能。
    *   **我方普攻阶段:** 在所有我方角色技能阶段结束后，允许我方所有存活且本回合未进行过主要攻击动作（如某些特殊技能可能取代普攻）的角色执行普通攻击。
    *   **敌方行动阶段:** 在我方所有行动完成后，敌方单位执行其行动逻辑。
*   **角色状态管理:**
    *   Buff/Debuff 的持续时间应在每个完整回合结束时（即敌方行动阶段之后）统一更新。
    *   技能和普攻的资源消耗（如MP、能量）在其各自执行时处理。
*   **函数/模块设计:**
    *   可能需要为每个阶段创建独立的处理函数，例如 `executePlayerSkillPhase()`, `executePlayerAttackPhase()`, `executeEnemyPhase()`。
    *   `processCharacterAction` 可能会被分解或调整，以适应新的阶段划分。
*   **现有逻辑兼容性:** 需要评估当前技能使用逻辑（如每回合多技能、攻击性技能判断）如何融入新的“我方技能阶段”。
*   **UI更新:** 战斗日志和界面反馈可能需要调整以清晰反映新的三阶段流程。
---
### Decision (Code)
[2025-05-09 14:51:00] - 调整角色进入地下城时属性快照的设置时机，并确认突破加成的计算基准。

**Rationale:**
为了更准确地反映角色“进入地下城时”的属性状态，`dungeonOriginalStats`（属性快照）的设置时机从之前的加载流程中移至 `DungeonRunner.startDungeonRun()` 函数中，在队伍确认进入地下城后立即为每个队员设置。这确保了武器盘加成基于进入时的准确属性。
用户确认突破加成 (`multiBonusStats`) 的计算基准维持现状，即基于角色当前的、最新的 `baseStats` 计算，这允许突破效果反映角色在地下城外的持续成长。

**Details:**
*   修改了 [`src/js/core/dungeon-runner.js`](src/js/core/dungeon-runner.js) 的 `startDungeonRun` 函数：
    *   在 `this.isRunning = true;` 之后添加了逻辑，为队伍中每个成员创建 `dungeonOriginalStats`，其值为当时的 `member.baseStats`。
    *   同时，清除了角色进入地下城前的buff，并重置了技能冷却 (`skillCooldowns`) 和地下城已应用的被动技能记录 (`dungeonAppliedPassives`)。
*   突破加成 (`multiBonusStats`) 的计算逻辑 (在 [`src/js/core/character.js`](src/js/core/character.js:687) 的 `updateMultiBonusStats` 函数中) 保持不变，继续使用角色当前的 `baseStats`。
*   因此，在地下城中，角色的最终属性 (`currentStats`) 计算公式为：`(dungeonOriginalStats + 基于 dungeonOriginalStats 的武器盘加成) + 基于当前 baseStats 的突破加成`。
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
[2025-05-08 22:36:00] - Refactor Skill Loading & Remove Fallbacks/Hardcoding

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

---
### Decision (Architecture)
[2025-05-09 17:03:00] - Adopt new Boss skill selection mechanism with HP threshold triggers.

**Rationale:**
To introduce more dynamic and challenging Boss encounters, a new skill selection logic is required. This logic prioritizes skills triggered by the Boss's HP percentage, allowing for strategic phase-based abilities. These HP-triggered skills operate without cooldown constraints. If no HP-triggered skills are applicable, the Boss falls back to a standard cooldown-based skill selection, and finally to a basic attack if no skills are available. This aligns with the user's confirmed detailed logic.

**Implications/Details:**
*   **Skill Data Structure (`boss-skills.json`):**
*   Skills can now include a `triggerCondition` object: `{ type: "hp_threshold", value: 0.xx, priority: N }`.
*   `value` represents the HP percentage (e.g., 0.50 for 50%).
*   `priority` is an integer (lower value means higher priority) for resolving conflicts if multiple HP threshold skills are met.
*   **Boss AI Logic (e.g., in `src/js/core/battle.js` or a dedicated Boss AI module):**
1.  **HP Threshold Check:** At the start of the Boss's turn, evaluate all skills with `hp_threshold` conditions.
    *   If conditions met, select based on `priority` (then original skill order for ties).
    *   Selected skill is used *without* CD check and *does not* enter CD. Turn ends.
2.  **Regular Skill Check:** If no HP skill used, iterate through skills, select the first one not on cooldown.
    *   Use skill, set its CD. Turn ends.
3.  **Default Action:** If no skills used, perform a normal attack.
*   **Cooldown Management:**
*   Skill cooldowns for Bosses will be managed dynamically on the Boss's instance during battle (e.g., `boss.skillCooldowns = {"skill_id": current_cd_value}`).
*   HP-triggered skills, when activated via HP threshold, bypass this CD mechanism entirely. If these skills also have a regular `cooldown` property (for potential use as a regular skill if not HP-triggered), that CD applies only when used as a regular skill.
*   **Affected Files:**
*   [`src/data/boss-skills.json`](src/data/boss-skills.json:0) (or equivalent): To add `triggerCondition` to relevant skills.
*   [`src/js/core/battle.js`](src/js/core/battle.js:0) (or Boss AI module): To implement the new two-phase decision logic and integrate dynamic CD management for Bosses.
*   Boss character representation in battle: Needs to store `skillCooldowns`.
*   **System Patterns:** A new "Boss AI Skill Selection Pattern" has been added to [`memory-bank/systemPatterns.md`](memory-bank/systemPatterns.md:1).

---
### Decision (Debug)
[2025-05-09 17:50:00] - Resolve "Boss不使用技能" bug by correcting skill data loading and access.

**Rationale:**
The root cause of the Boss not using any skills was twofold:
1.  Boss skill data from [`src/data/boss-skills.json`](src/data/boss-skills.json:0) was not being loaded into the `window.bossSkills` object.
2.  The `SkillLoader.getSkillInfo` method in [`src/js/core/skill-loader.js`](src/js/core/skill-loader.js:0) did not include `window.bossSkills` in its lookup paths.
This meant that for HP-triggered skills (Phase 1 of Boss AI), `window.bossSkills` was likely undefined, preventing skill data retrieval. For regular skills (Phase 2), `SkillLoader.getSkillInfo` would return null for Boss-specific skills, leading to them being filtered out as unusable.

**Details:**
The fix involved modifying [`src/js/core/skill-loader.js`](src/js/core/skill-loader.js:0):
1.  **Added `loadBossSkills()` method:** This new method fetches data from [`src/data/boss-skills.json`](src/data/boss-skills.json:0) and stores the `bossSkills` object into `window.bossSkills`. Error handling was included to initialize `window.bossSkills` as an empty object if loading fails or the JSON structure is incorrect.
2.  **Called `loadBossSkills()` in `SkillLoader.init()`:** Ensured that Boss skills are loaded during the skill system initialization.
3.  **Updated `SkillLoader.getSkillInfo()`:** Added a check for `window.bossSkills[skillId]` in the skill lookup sequence. This allows `getAvailableSkills` (used in Phase 2 of Boss AI) to correctly retrieve Boss skill data.

**Affected Files:**
*   [`src/js/core/skill-loader.js`](src/js/core/skill-loader.js:0)
---
### Decision (Debug)
[2025-05-09 20:21:00] - Fix `ReferenceError` for `totalDamageAppliedToAllTargets` in `job-skills.js`.

**Rationale:**
The variable `totalDamageAppliedToAllTargets` was used in [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1268) within the `applyDamageEffects` function without prior declaration, leading to a `ReferenceError`. The fix involves declaring and initializing this variable at the beginning of the function.

**Details:**
*   Added `let totalDamageAppliedToAllTargets = 0;` at the beginning of the `applyDamageEffects` function in [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1180).

---
### Decision (Debug)
[2025-05-09 20:21:00] - Fix `TypeError` for `expiredBuffs` not iterable in `battle.js`.

**Rationale:**
The variable `expiredBuffs` in [`src/js/core/battle.js`](src/js/core/battle.js:859) within the `updateBuffDurations` function was not guaranteed to be an iterable object (it could be `null` or `undefined` if `BuffSystem.updateBuffDurations` returned such). This caused a `TypeError` when attempting to iterate over it. The fix ensures that the variable is an array before iteration.

**Details:**
*   In [`src/js/core/battle.js`](src/js/core/battle.js:857), after `const expiredBuffs = BuffSystem.updateBuffDurations(member);`, added `const actualExpiredBuffs = Array.isArray(expiredBuffs) ? expiredBuffs : [];`.
*   Changed the loop at line 859 from `for (const buff of expiredBuffs)` to `for (const buff of actualExpiredBuffs)`.
---
### Decision (Debug)
[2025-05-09 20:52:00] - 修复战斗日志相关的多个问题 (问题1-5)

**Rationale & Details:**

*   **问题1: 怪物 `maxHp` 初始化问题**
    *   **根本原因:** 怪物数据源中 `hp` 属性缺失或无效。
    *   **修复策略:** 代码中已有备用逻辑。增强了 [`src/js/core/battle.js`](src/js/core/battle.js:184) 的错误日志，以更明确地指向数据源问题。

*   **问题2: 角色攻击力未算入武器盘**
    *   **根本原因:** [`src/js/core/weapon.js`](src/js/core/weapon.js:861) 的 `calculateCurrentStats` 函数在处理武器等级属性时，若缺少150级属性数据 (`150Attack`, `150Hp`) 可能导致计算错误 (NaN)，影响武器盘整体攻击力加成。
    *   **修复策略:** 修改了 `calculateCurrentStats` ([`src/js/core/weapon.js:867-875`](src/js/core/weapon.js:867))，增加了对150级属性数据缺失或无效情况的处理，确保即使数据不完整也能返回有效的1级属性值。

*   **问题3: 直接造成393伤害的来源不明确**
    *   **根本原因:** [`src/js/core/battle.js`](src/js/core/battle.js:1848) 的 `applyDamageToTarget` 函数缺乏统一的、包含伤害来源信息的日志。
    *   **修复策略:** 修改了 `applyDamageToTarget` ([`src/js/core/battle.js:2045`](src/js/core/battle.js:2045) 附近)，在扣减HP后添加了详细的战斗日志，记录攻击者、伤害来源（通过`options`参数传递，如技能名、普攻、buff名）、实际伤害及HP变化。相应地，在普通攻击调用点 ([`src/js/core/battle.js:1100`](src/js/core/battle.js:1100) 和 [`src/js/core/battle.js:1326`](src/js/core/battle.js:1326)) 添加了 `isNormalAttack: true` 标志。

*   **问题4: “护甲破坏”技能0伤害问题**
    *   **根本原因:** 技能伤害计算过程不透明，难以判断0伤害的具体原因。
    *   **修复策略:** 在 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1177) 的 `applyDamageEffects` 函数中，为 `type: "damage"` 的效果添加了调试日志 ([`src/js/core/job-skills.js:1211`](src/js/core/job-skills.js:1211) 之后)，记录攻击者有效攻击力、技能伤害倍率和计算出的原始伤害值，以便追踪。

*   **问题5: “护甲破坏”中使用未知效果类型 `defenseDown` 问题**
    *   **根本原因:** 在 [`src/data/job-skills-templates.json`](src/data/job-skills-templates.json:607) 中，`armorBreak` 技能的降防效果错误地使用了 `type: "defenseDown"`。原子效果的 `type` 应为通用类型（如 "debuff"），具体的debuff种类应由 `buffType` 指定。
    *   **修复策略:** 修改了 [`src/data/job-skills-templates.json`](src/data/job-skills-templates.json:607) 中 `armorBreak` 的效果定义，将 `type: "defenseDown"` 改为 `type: "debuff"`，并添加 `buffType: "defenseDown"`。

*   **问题6: 已执行攻击性技能后不再进行普通攻击问题**
    *   **确认:** 此行为是预期的，由 `processCharacterAction` 中的 `hasPerformedOffensiveActionThisTurn` 标志控制，符合系统设计。无需代码修改。
---
### Decision (Debug)
[2025-05-09 21:03:48] - 修改 `processCharacterAction` 以允许技能后普攻

**Rationale:**
根据用户澄清的战斗逻辑和 `spec-pseudocode` 模式提供的伪代码，玩家应该能够在使用完所有当前回合可用的技能之后，再执行一次普通攻击。当前的实现是使用一个 `hasPerformedOffensiveActionThisTurn` 标志来阻止在攻击性技能后使用其他技能或普攻，这不符合新需求。

**Details:**
*   **修改 [`src/js/core/battle.js`](src/js/core/battle.js:1) 中的 `processCharacterAction` 函数:**
    *   移除了 `hasPerformedOffensiveActionThisTurn` 变量及其相关的所有逻辑。
    *   技能使用循环 (`for (const skillToUseId of availableSkills)`) 现在会尝试使用所有可用的技能，不再因为某个技能是“攻击性”的而提前中断。
    *   引入了新的布尔标志 `performedNormalAttack`，初始化为 `false`。
    *   在技能使用循环之后，添加了一个新的条件块来执行普通攻击：
        *   条件：角色HP > 0，怪物HP > 0，且 `!performedNormalAttack`。
        *   如果满足条件且战斗未结束 (`!this.isBattleOver(...)`)，则记录日志并调用一个新的辅助函数 `this.executeNormalAttack(character, monster, battleStats, currentTeamMembers)`。
        *   调用后设置 `performedNormalAttack = true`。
        *   添加了相应的日志来处理角色或目标死亡导致无法普攻的情况。
*   **创建新的辅助函数 `executeNormalAttack`:**
    *   将 `processCharacterAction` 中原有的普通攻击逻辑（包括DA/TA判断、伤害计算、Proc触发、统计更新等）完整迁移到这个新的私有方法中。
    *   `executeNormalAttack` 接收 `character`, `monster`, `battleStats`, `currentTeamMembers` 作为参数。
*   **Memory Bank 更新:**
    *   [`memory-bank/activeContext.md`](memory-bank/activeContext.md:1) 已更新，记录了此项修改。
    *   [`memory-bank/progress.md`](memory-bank/progress.md:1) 已更新，将此任务标记为完成。
    *   [`memory-bank/decisionLog.md`](memory-bank/decisionLog.md:1) (此文件) 已更新此决策。

---
### Decision (Debug)
[2025-05-09 21:18:00] - 修复战斗日志中的4个新问题

**Rationale:**
根据用户提供的战斗日志分析和代码审查，对指出的4个问题进行了修复。

**Details:**
1.  **怪物 `maxHp` 初始化问题依然存在：**
    *   **Fix Strategy:** 修改 [`src/js/core/battle.js`](src/js/core/battle.js:1) 中的怪物HP初始化逻辑。
    *   **Implementation:** 在 `startBattle` 函数中，当从 `monster.hp` 获取 `initialMaxHpFromJson` 无效时，在尝试 `monsterCharacter.currentStats.maxHp` 之前，增加了对 `monster.baseStats.maxHp` 和 `monster.baseStats.hp` 的检查和使用。
    *   **Affected file:** [`src/js/core/battle.js`](src/js/core/battle.js:1)

2.  **技能“护甲破坏”造成两次伤害 及 问题3 “护甲破坏”技能伤害日志仍然矛盾 (0伤害 vs 实际伤害)：**
    *   **Fix Strategy:** 统一伤害应用和日志记录，移除冗余的伤害处理点。
    *   **Implementation:**
        *   在 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1)，注释掉了约 1042-1043 行附近一个旧的、多余的HP扣减 (`target.currentStats.hp = ...`) 和相关的 `Battle.logBattle` 最终伤害日志。
        *   修改了 `JobSkills.applyDamageEffects` 函数 ([`src/js/core/job-skills.js:1177`](src/js/core/job-skills.js:1177)) 内部的日志记录逻辑 (约 [`src/js/core/job-skills.js:1262`](src/js/core/job-skills.js:1262) 附近)，将原来的 `console.log` 替换为 `Battle.logBattle`，以确保最终生效的伤害和HP变化通过标准战斗日志输出。
    *   **Rationale for Combined Fix:** 这两个问题被认为是相关的，因为冗余的伤害处理点可能导致0伤害日志（如果其计算结果为0）和另一次实际伤害及日志。通过统一处理，旨在确保伤害只被计算和应用一次，并且日志准确反映该单次事件。
    *   **Affected file:** [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1)

3.  **`TypeError: expiredBuffs is not iterable` 错误复现 ([`src/js/core/battle.js:901`](src/js/core/battle.js:901))：**
    *   **Fix Strategy:** 加强数组类型检查。
    *   **Implementation:** 在 [`src/js/core/battle.js`](src/js/core/battle.js:1) 的 `updateBuffDurations` 函数中，为处理怪物（`monster`）的 `expiredBuffs` 时（约 [`src/js/core/battle.js:913`](src/js/core/battle.js:913) 之后），添加了与处理队伍成员时相同的 `Array.isArray()` 检查，确保从 `BuffSystem.updateBuffDurations(monster)` 返回的值在迭代前被确认为数组。
    *   **Affected file:** [`src/js/core/battle.js`](src/js/core/battle.js:1)
---
### Decision (Debug)
[2025-05-09 21:38:00] - 修复玩家回合普通攻击执行两次的问题

**Rationale:**
根据 `spec-pseudocode` 的分析，在 [`src/js/core/battle.js`](src/js/core/battle.js:1) 的 `processCharacterAction` 函数中，调用新的 `this.executeNormalAttack(...)` 方法后，仍有残留的旧普通攻击逻辑，导致普通攻击流程被执行了两次。移除这部分残留逻辑以解决此问题。

**Details:**
*   在 [`src/js/core/battle.js`](src/js/core/battle.js:1) 的 `processCharacterAction` 函数中，移除了 `this.executeNormalAttack(...)` 调用（约第1068行）之后的残留普通攻击逻辑代码块（原第1083行至第1200行）。
---
### Decision (Code)
[2025-05-10 19:35:00] - 在 `src/js/core/battle.js` 中实现新的三阶段战斗流程。

**Rationale:**
根据架构师提供的战斗系统修改架构方案，将战斗流程明确划分为“我方技能”、“我方普攻”、“敌方行动”三个阶段，以提高代码的模块化和可维护性。

**Details:**
*   重构了 `processBattle` ([`src/js/core/battle.js:400`](src/js/core/battle.js:400)) 函数，使其按顺序调用新的阶段处理函数。
*   新增了 `executePlayerSkillPhase(teamMembers, monster, battleStats)` ([`src/js/core/battle.js:519`](src/js/core/battle.js:519)) 函数，负责处理所有我方角色的技能使用。
*   新增了 `executePlayerAttackPhase(teamMembers, monster, battleStats)` ([`src/js/core/battle.js:533`](src/js/core/battle.js:533)) 函数，负责处理所有我方角色的普通攻击。
*   新增了 `executeEnemyPhase(monster, teamMembers, battleStats)` ([`src/js/core/battle.js:552`](src/js/core/battle.js:552)) 函数，复用原有的 `processMonsterAction` ([`src/js/core/battle.js:965`](src/js/core/battle.js:965)) 逻辑处理敌方行动。
*   新增了 `processCharacterSkills(character, monster, battleStats, teamMembers)` ([`src/js/core/battle.js:563`](src/js/core/battle.js:563)) 辅助函数，用于处理单个角色的技能选择和使用逻辑，取代了部分原 `processCharacterAction` ([`src/js/core/battle.js:839`](src/js/core/battle.js:839)) 的功能。
*   新增了 `processCharacterNormalAttack(character, monster, battleStats, teamMembers)` ([`src/js/core/battle.js:609`](src/js/core/battle.js:609)) 辅助函数，用于处理单个角色的普通攻击逻辑，调用了现有的 `this.executeNormalAttack` ([`src/js/core/battle.js:846`](src/js/core/battle.js:846))。
*   调整了 `updateBuffDurations` ([`src/js/core/battle.js:746`](src/js/core/battle.js:746))、`processTurnStartBuffs` ([`src/js/core/battle.js:715`](src/js/core/battle.js:715)) 和 `processEndOfTurnEffect` ([`src/js/core/battle.js:1933`](src/js/core/battle.js:1933)) 的调用时机，以适应新的三阶段流程。`processEndOfTurnEffect` ([`src/js/core/battle.js:1933`](src/js/core/battle.js:1933)) 现在在 `processBattle` ([`src/js/core/battle.js:400`](src/js/core/battle.js:400)) 的每回合末尾统一调用。
*   原 `processCharacterAction` ([`src/js/core/battle.js:839`](src/js/core/battle.js:839)) 函数已被注释掉，其功能由新的辅助函数和阶段处理函数承担。
---
### Decision (Debug)
[2025-05-10 20:45:06] - Fix "未知的BUFF类型: critRateUp" error by correcting buff type casing.

**Rationale:**
The error "未知的BUFF类型: critRateUp" was caused by an incorrect casing of the buff type identifier. The buff system defines this buff as 'criticalRateUp' (camelCase with capital 'C') in [`src/js/core/buff-system.js`](src/js/core/buff-system.js:28), but it was referenced as 'critRateUp' (lowercase 'c') in [`src/js/core/weapon-board-bonus-system.js`](src/js/core/weapon-board-bonus-system.js:322). JavaScript object property names are case-sensitive, leading to the lookup failure.

**Details:**
*   Modified [`src/js/core/weapon-board-bonus-system.js`](src/js/core/weapon-board-bonus-system.js:322) to change `type: 'critRateUp'` to `type: 'criticalRateUp'`.
*   This aligns the reference with the definition in [`src/js/core/buff-system.js`](src/js/core/buff-system.js:28), resolving the error.
---
### Decision (Code)
[2025-05-10 20:51:00] - 统一暴击率相关的 BUFF 类型为 `critRateUp`。

**Rationale:**
根据用户反馈，为了保持代码库中 BUFF 类型命名的一致性，将之前因大小写问题临时修改的 `criticalRateUp` 统一改回 `critRateUp`。

**Details:**
*   **还原更改:**
    *   [`src/js/core/weapon-board-bonus-system.js`](src/js/core/weapon-board-bonus-system.js:322): `criticalRateUp` -> `critRateUp`
*   **修改定义:**
    *   [`src/js/core/buff-system.js`](src/js/core/buff-system.js:28): 定义 `criticalRateUp` -> `critRateUp`
*   **全局替换:**
    *   [`src/js/core/job-skills.js`](src/js/core/job-skills.js:649): `criticalRateUp` -> `critRateUp`
    *   [`src/js/core/buff-system.js`](src/js/core/buff-system.js:696): `criticalRateUp` -> `critRateUp`
    *   [`src/js/core/buff-system.js`](src/js/core/buff-system.js:772): `criticalRateUp` -> `critRateUp`
*   **文档更新:**
    *   [`docs/skill_effect_types_reference.md`](docs/skill_effect_types_reference.md:65): `BuffSystem.buffTypes.criticalRateUp` -> `BuffSystem.buffTypes.critRateUp`
---
### Decision (Debug)
[2025-05-10 21:07:00] - Fix `TypeError: Cannot read properties of undefined (reading 'currentStats')` in `job-skills.js` for skill `blazingStrike2`.

**Rationale:**
The error occurred in `JobSkills.applyDebuffEffects` at line 807 when trying to access `targets[0].currentStats.hp`. Investigation revealed that the `targets` array was empty or invalid. This was traced back to an incorrect parameter being passed to `JobSkills.useSkill` in `Battle.processCharacterSkills` ([`src/js/core/battle.js:580`](src/js/core/battle.js:580)). Instead of passing the full `teamMembers` array as the third argument, it was passing `targets` (the result of `Battle.getEffectTargets`). This incorrect `teamMembers` list was then propagated down through `JobSkills.applySkillEffects` to `JobSkills.applyDebuffEffects`, where `JobSkills.getTargets` likely returned an empty array due to the incomplete input list, leading to `targets[0]` being undefined.

**Details:**
*   Modified [`src/js/core/battle.js`](src/js/core/battle.js) at line [580](src/js/core/battle.js:580).
*   Changed the third argument of the `JobSkills.useSkill` call from `targets` to `teamMembers`.
    *   Original: `JobSkills.useSkill(character.id, skillToUseId, targets, monster);`
    *   Fixed: `JobSkills.useSkill(character.id, skillToUseId, teamMembers, monster);`
*   This ensures that `JobSkills` methods receive the complete list of team members, allowing internal target selection logic to function correctly.
---
### Decision (Code)
[2025-05-10 22:33:00] - 统一 `JobSkills` 中各 `apply*Effects` 函数及 `applySkillEffects` 的返回值结构。

**Rationale:**
原始代码中，`JobSkills.useSkill` 调用的多个效果应用函数（如 `applyDamageEffects`, `applyBuffEffects`）没有统一的返回值，特别是缺少明确的 `success` 状态，导致 `useSkill` 方法难以准确判断技能是否成功施放。统一返回结构 `{ success: boolean, message?: string, effects?: object }` 可以提高代码的健壮性、可读性和可维护性，使得技能的成功与否有明确的判定依据。

**Details:**
*   修改了 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1) 中的以下函数，确保它们都返回 `{ success: boolean, message?: string, effects?: object }` 结构：
    *   `applyDamageEffects`
    *   `applyBuffEffects`
    *   `applyDebuffEffects`
    *   `applyHealEffects`
    *   `applyDispelEffects`
    *   `applyReviveEffects`
    *   `applySkillEffects` (包括其对子效果成功状态的汇总逻辑)
    *   `applyTriggerSkillEffect`
*   `success` 的判定条件根据各函数具体逻辑确定（例如，造成伤害、成功施加buff/debuff、成功治疗/复活、成功驱散，或在没有有效目标/条件不满足时也可能视为“逻辑上的成功执行”）。
*   `useSkill` 方法已更新，以正确处理和依赖这些函数返回的新结构中的 `success` 属性来判断技能的整体使用结果。
*   调用方（如 [`src/js/core/battle.js`](src/js/core/battle.js:1) 中的 `processCharacterSkills`）经检查已能兼容此新结构。

---
### Decision (Architecture)
[2025-05-10] - 设计并引入新的战斗日志系统 `BattleLogger`。

**Rationale:**
为了统一战斗系统中的日志打印格式，将详细的调试信息（如计算过程）与给玩家看的简洁战斗记录分离开来。当前日志系统（主要依赖 `Battle.logBattle()`）功能较为单一，不利于扩展和精细化控制。新的 `BattleLogger` 旨在提供多级日志、结构化详细信息记录以及更清晰的集成点。

**Implications/Details:**
*   **新模块/对象:** `BattleLogger`
*   **核心方法:** `BattleLogger.log(level, message, details = null, turn = null)`
*   **日志级别 (`level`):**
    *   `CONSOLE_DETAIL`: 用于控制台的详细调试日志，包含计算过程。前缀 `[战斗][回合 X]`。
    *   `CONSOLE_INFO`: 用于控制台的一般信息日志。前缀 `[战斗][回合 X]`。
    *   `BATTLE_LOG`: 用于战斗界面日志 (`battleLog`)，简洁，给玩家看。
*   **`details` 参数:** 对象，用于 `CONSOLE_DETAIL` 级别，传递结构化数据（如伤害计算步骤、HP变化）。
*   **集成方案:**
*   替换现有 [`src/js/core/battle.js`](src/js/core/battle.js:1) (及其他相关文件) 中的 `Battle.logBattle()` 调用。
*   在战斗流程的关键节点（伤害计算、技能使用、BUFF处理等）插入对 `BattleLogger.log()` 的调用，并根据上下文选择合适的 `level` 和 `details`。
*   例如，在伤害计算中：
    *   使用 `CONSOLE_DETAIL` 记录每一步计算（攻击力、防御、最终伤害）。
    *   使用 `BATTLE_LOG` 记录最终对玩家显示的伤害结果。
*   **可扩展性:**
*   易于添加新的日志级别。
*   易于添加新的日志输出目标（如服务器日志）。
*   日志格式化和过滤机制可以后续增强。
*   **内存银行更新:**
*   相关的系统模式已更新到 [`memory-bank/systemPatterns.md`](memory-bank/systemPatterns.md:1)。
*   **UI 依赖:** `BATTLE_LOG` 级别依赖一个UI接口函数（如 `UI.addBattleLogMessage(message)`）来将日志显示在界面上。如果此函数不存在，`BattleLogger` 会回退到 `console.log`。

---
### Decision (Debug)
[2025-05-10 23:37:00] - Resolve `ReferenceError: BattleLogger is not defined` by ensuring script load order.

**Rationale:**
The error `ReferenceError: BattleLogger is not defined` occurred in [`src/js/core/buff-system.js`](src/js/core/buff-system.js:909) because the `BattleLogger` object, defined in [`src/js/core/battle-logger.js`](src/js/core/battle-logger.js), was not loaded and defined at the time `buff-system.js` was executed. While `battle-logger.js` correctly exposed `BattleLogger` to the global `window` object, the script itself was not included in [`index.html`](index.html).

**Details:**
*   **Verification:** Confirmed that [`src/js/core/battle-logger.js`](src/js/core/battle-logger.js) correctly assigns `BattleLogger` to `window.BattleLogger`.
*   **Root Cause:** The `<script>` tag for [`src/js/core/battle-logger.js`](src/js/core/battle-logger.js) was missing from [`index.html`](index.html).
*   **Fix:** Added `<script src="src/js/core/battle-logger.js"></script>` to [`index.html`](index.html) (line 427, before the script tag for `src/js/core/buff-system.js`). This ensures that `BattleLogger` is defined before any script that depends on it is executed.
*   **Affected Files:**
    *   [`index.html`](index.html) (Modified)
    *   [`src/js/core/buff-system.js`](src/js/core/buff-system.js) (Error source, now fixed)
    *   [`src/js/core/battle-logger.js`](src/js/core/battle-logger.js) (Verified)
---
### Decision (Code)
[2025-05-11 11:33:09] - 增强 `Character.js` 中的 `loadSaveData` 和 `getCharacterFullStats` 函数。

**Rationale:**
为了提高角色属性在加载存档和计算过程中的一致性和健壮性。`loadSaveData` 需要确保所有角色的属性在加载后得到刷新，并进行必要的完整性检查。`getCharacterFullStats` 需要更稳健地处理武器属性计算中可能发生的错误，并确保 `weaponBonusStats` 始终得到更新。

**Details:**
*   **`loadSaveData` in [`src/js/core/character.js`](src/js/core/character.js:1780):**
    *   在遍历已加载的角色时，确保 `baseStats`, `weaponBonusStats`, `currentStats` 存在，并对 `baseStats` 调用 `_ensureStatsIntegrity`。
    *   在函数末尾添加了逻辑，遍历所有已加载的角色 (`this.characters`)，并为每个角色调用 `_updateCharacterEffectiveStats(characterId, teamId)` 以刷新其最终属性。
*   **`getCharacterFullStats` in [`src/js/core/character.js`](src/js/core/character.js:1402):**
    *   在调用 `this._calculateWeaponAugmentedStats(character, teamId)` 时使用了 `try...catch` 块。
    *   如果捕获到错误，或者 `_calculateWeaponAugmentedStats` 返回 falsy 值，`statsAfterWeapon` 将安全回退到角色的 `baseStats` 的一个副本 (`{ ...character.baseStats }`)，并调用 `_ensureStatsIntegrity` 确保其完整性。
    *   无论 `_calculateWeaponAugmentedStats` 的结果如何，`character.weaponBonusStats` 都会被更新为最终确定的 `statsAfterWeapon`（可能是回退值）。
---
### Decision (Code)
[2025-05-11 12:03:41] - 修改 `completeDungeon` 函数以正确恢复角色副本外属性。

**Rationale:**
当前在 `completeDungeon` 函数中，当角色退出副本时，其 `currentStats` 被直接设置为 `dungeonOriginalStats`（即进入副本前的 `baseStats`），这忽略了角色在副本外的武器盘和多重获取加成。虽然之后有调用 `Character.updateTeamWeaponBonusStats`，但可能由于执行顺序或覆盖问题，导致最终 `currentStats` 不正确。修复方案要求在清除角色副本特定状态后，直接为每个参与副本的成员调用 `Character._updateCharacterEffectiveStats` 来正确地重新计算并设置其 `weaponBonusStats` 和 `currentStats`。

**Details:**
*   修改了 [`src/js/core/dungeon.js`](src/js/core/dungeon.js:1) 中的 `completeDungeon` 函数。
*   在角色状态恢复循环内，清除了 `dungeonOriginalStats`, `dungeonAppliedPassives`, 和 `buffs`。
*   然后，为每个成员调用 `Character._updateCharacterEffectiveStats(member.id, team.id)`。
*   移除了函数末尾对 `Character.updateTeamWeaponBonusStats` 的调用。
---
### Decision (Code)
[2025-05-11 12:19:27] - 实现新的角色 `baseStats` 计算和验证逻辑。

**Rationale:**
为了引入更精确和可验证的角色基础属性成长机制，替换了原有的基于 `growthRates` 的简单累加方式。新的逻辑基于角色模板中定义的1级和满级属性，通过线性插值计算任意等级的期望属性值。同时增加了验证机制，以确保角色在加载或进入副本时其 `baseStats` 符合预期。

**Details:**
*   **`src/js/core/character.js`**:
    *   添加了 `_getCharacterTemplate(character)`: 根据角色实例（特别是其ID）查找并返回其原始模板对象。处理了角色ID可能包含实例后缀的情况。
    *   添加了 `getExpectedBaseStatAtLevel(statName, templateBaseStats, currentLevel, characterMaxLevel)`: 根据模板1级属性、满级属性（如果存在）、当前等级和角色最大等级，通过线性插值计算期望的基础属性值。对非百分比属性结果向下取整。
    *   修改了 `levelUpCharacter(characterId, levels = 1)`:
        *   现在使用 `_getCharacterTemplate` 获取角色模板。
        *   使用 `getExpectedBaseStatAtLevel` 来更新角色升级后的 `baseStats` (hp, attack, defense, critRate, critDamage, daRate, taRate)。
        *   如果找不到模板，则跳过 `baseStats` 更新，但保留等级和经验逻辑。
    *   添加了 `validateCharacterBaseStats(characterId)`:
        *   获取角色及其模板。
        *   对指定的 `baseStats` (hp, attack, defense, critRate, critDamage, daRate, taRate) 调用 `getExpectedBaseStatAtLevel` 计算期望值。
        *   比较期望值与角色当前的 `baseStats` 中的实际值，对浮点数使用容差比较。
        *   如果不匹配，则在控制台输出警告。
    *   修改了 `loadSaveData(data)`:
        *   在加载并刷新完所有角色属性后，遍历所有已加载角色并调用 `this.validateCharacterBaseStats(charId)` 进行验证。
*   **`src/js/core/dungeon.js`**:
    *   修改了 `initDungeonRun(dungeonId)`:
        *   在获取到要进入副本的队伍成员后，遍历队伍成员并为每个成员调用 `Character.validateCharacterBaseStats(memberId)`。
---
### Decision (Code)
[2025-05-11 12:47:42] - 修改 `loadSaveData` 函数以处理异步角色模板加载。

**Rationale:**
修复 `loadSaveData` 函数在调用 `validateCharacterBaseStats` 时，因依赖的异步角色模板数据（R, SR, SSR 角色列表）可能尚未完全加载完成，导致验证时找不到模板而出错的问题。

**Details:**
*   将 [`src/js/core/character.js`](src/js/core/character.js:1) 中的 `loadSaveData` 函数修改为 `async` 函数。
*   使用 `Promise.all()` 等待所有 `this.loadCharacterData()`（用于加载R, SR, SSR角色模板）的异步操作完成后，再执行后续的角色属性刷新和 `baseStats` 验证逻辑。
---
### Decision (Code)
[2025-05-11 12:58:48] - 增强 `validateCharacterBaseStats` 函数并更新其在 `loadSaveData` 中的调用。

**Rationale:**
为了在角色基础属性验证失败时提供自动修正能力，并确保在加载存档时应用此修正。这有助于维护数据一致性，特别是在属性计算逻辑或模板数据发生变化后。

**Details:**
*   **`validateCharacterBaseStats(characterId, autoCorrect = false)` in [`src/js/core/character.js`](src/js/core/character.js:1):**
    *   添加了可选参数 `autoCorrect`，默认值为 `false`。
    *   当检测到属性不匹配且 `autoCorrect` 为 `true` 时：
        *   将角色对象 (`character.baseStats`) 中对应的属性值更新为计算出的 `expectedValue`。
        *   如果修正的是 `hp`，则同步更新 `character.baseStats.maxHp` 为 `expectedValue`。
        *   如果修正的是 `attack`，则同步更新 `character.baseStats.maxAttack` 为 `expectedValue`。
        *   记录一条日志说明已进行自动修正。
    *   如果进行了任何自动修正 (`CorrectionMade` 为 `true`)：
        *   在函数末尾（但在打印“验证通过”或“已自动修正”日志之后）调用 `this._updateCharacterEffectiveStats(characterId, teamId)` 来刷新派生属性。
        *   `teamId` 通过 `Team.findTeamByMember(characterId)?.id || null` 获取。
*   **`loadSaveData(data)` in [`src/js/core/character.js`](src/js/core/character.js:1):**
    *   在函数末尾，调用 `this.validateCharacterBaseStats(charId)` 时，将第二个参数（`autoCorrect`）设置为 `true`。
    *   更新了相关的日志消息，以反映自动修正的启用。
---
### Decision (Code)
[2025-05-11 16:55:15] - 更新 `calculateAttackPower` 函数以区分可叠加与不可叠加的攻击Buff。

**Rationale:**
根据新的需求，攻击力计算需要更精细地处理不同类型的 `attackUp` Buff。可叠加的Buff应累加其效果值，而不可叠加的Buff则各自形成独立的乘算区间。这能提供更灵活和策略性的Buff设计。

**Details:**
*   修改了 [`src/js/core/character.js`](src/js/core/character.js:1512) 中的 `calculateAttackPower` 函数。
*   **可叠加 `attackUp` Buff:**
    *   筛选 `buffs` 数组中 `type === 'attackUp'` 且 `stackable === true` (或 `stackable` 未定义) 的Buff。
    *   将其 `value` 累加到 `cumulativeAttackUpPercentage`。
*   **不可叠加 `attackUp` Buff:**
    *   筛选 `buffs` 数组中 `type === 'attackUp'` 且 `stackable === false` 的Buff。
    *   对每个此类Buff，将其 `(1 + buff.value)` 作为一个独立的乘数乘到 `attackPower` 上。
*   **`attackDown` Buff:**
    *   逻辑保持不变，假设其总是可叠加，并累加到 `cumulativeAttackDownPercentage`，上限为50%。
*   **乘算顺序:**
    1.  应用累积的攻升/攻降 (`cumulativeModifier`)。
    2.  依次应用每个独立的不可叠加攻升Buff。
    3.  应用其他乘算区间（浑身、背水、EX攻击）。
    4.  最后加算固定伤害上升。
*   日志记录 (`window.logBattle.log`) 已更新，以反映新的计算步骤和中间值。
---
### Decision (Code)
[2025-05-11 18:10:00] - 在 `applyDamageToTarget` 函数中实现属性克制伤害计算逻辑。

**Rationale:**
根据用户需求，在伤害计算流程中加入元素属性克制机制，以增加战斗策略性。采用用户指定的基于攻击方视角的克制关系判断，并特殊处理光暗互克情况。

**Details:**
*   **文件修改:** [`src/js/core/battle.js`](src/js/core/battle.js:1775)
*   **插入位置:** 在 `applyDamageToTarget` 函数内，伤害浮动计算之后，伤害上限判断之前。
*   **克制逻辑:**
    *   攻击方属性 (`attacker.attribute`) 对比目标属性 (`actualTarget.attribute`)。
    *   属性克制关系定义在 `Character.attributes` (通过 `strengths` 和 `weaknesses` 数组)。
    *   攻击方克制目标方 (攻击方 `strengths` 包含目标属性): 伤害 x1.5。
    *   攻击方被目标方克制 (攻击方 `weaknesses` 包含目标属性): 伤害 x0.75。
    *   光暗互克 (`light` vs `dark` 或 `dark` vs `light`): 伤害 x1.5，此逻辑优先于或补充普通克制。
    *   无克制关系: 伤害 x1.0。
*   **记录:**
    *   伤害变化记录在 `calculationSteps` 数组中。
    *   使用 `BattleLogger.log` (级别 `CONSOLE_DETAIL` 和 `BATTLE_LOG`) 记录属性克制相关的战斗信息。
*   **条件检查:** 确保在 `attacker`, `actualTarget` 及其属性有效，并且 `Character.attributes` 可用时才执行此逻辑。
---
### Decision (Code)
[2025-05-11 18:45:48] - 修改战斗逻辑中对 `attacker.isBoss` 的检查方式。

**Rationale:**
根据用户请求，为了更稳健地判断攻击者是否为Boss，采用 `!!` 操作符将 `attacker.isBoss` 强制转换为布尔值。这确保了即使 `attacker.isBoss` 的值为 `undefined` 或其他非布尔真值/假值时，逻辑也能正确处理。

**Details:**
*   在 [`src/js/core/battle.js`](src/js/core/battle.js:1760) 的 `applyDamageToTarget` 函数中，修改了以下代码行：
    *   原代码:
        ```javascript
        const attackerIsPlayer = !attacker.isBoss;
        const targetIsMonster = attacker.isBoss;
        ```
    *   修改后代码:
        ```javascript
        const isAttackerEffectivelyBoss = !!attacker.isBoss;
        const attackerIsPlayer = !isAttackerEffectivelyBoss;
        const targetIsMonster = isAttackerEffectivelyBoss;
        ```
*   此更改确保了 `attackerIsPlayer` 和 `targetIsMonster` 的值总是基于 `attacker.isBoss` 的布尔真假性来设定。

---
### Decision (Architecture)
[2025-05-11 19:42:00] - 采纳针对战斗系统中群体技能（如 `all_enemies`, `all_allies`）的核心架构调整方案。

**Rationale:**
当前战斗系统在处理群体目标技能时存在根本性缺陷。无论是玩家对全体敌人施放技能，还是怪物对我方全体施放技能，都仅作用于单个目标。这是因为：
1.  对于玩家的 `all_enemies` 技能：战斗系统缺乏对“敌方队伍”的统一管理，仅处理单个 `monster` 实例。
2.  对于怪物或玩家的 `all_allies` 技能：尽管我方队伍 (`playerTeam`) 是一个数组，但目标获取逻辑 ([`JobSkills.getTargets()`](src/js/core/job-skills.js:1080)) 或后续的效果应用函数未能正确迭代处理所有成员。

此架构调整旨在解决这些问题，使群体技能能够正确作用于所有预期目标。

**Implications/Details:**
*   **引入“敌方队伍” (`enemyParty`) 概念:**
    *   修改战斗初始化逻辑 ([`Battle.startBattle`](src/js/core/battle.js:0))，使其能够接收并管理一个由多个独立敌人对象组成的 `enemyParty` 数组。这将取代或补充当前单个 `monster` 的处理方式。
    *   战斗遭遇的定义（例如在 `src/data/monsters.json` 或 `src/data/bosses.json`）可能需要调整，以支持配置包含多个怪物的队伍。
*   **重构目标获取逻辑 ([`JobSkills.getTargets()`](src/js/core/job-skills.js:1080)):**
    *   确保函数能够接收完整的 `playerTeam` 和新的 `enemyParty` 作为参数。
    *   对于 `targetType: "all_enemies"`，函数应迭代 `enemyParty` 并返回所有存活的敌人对象数组。
    *   对于 `targetType: "all_allies"`，函数应迭代 `playerTeam` (或从施法者角度看的友方队伍) 并返回所有存活的友方角色数组。
    *   对于 `targetType: "all_characters"`，函数应合并并返回 `playerTeam` 和 `enemyParty` 中所有存活单位。
    *   其他如 `random_enemy`, `lowest_hp_enemy` 等类型也需相应调整以从正确的队伍中选取。
*   **调整技能效果应用函数 (如 [`JobSkills.applyDamageEffects()`](src/js/core/job-skills.js:766), [`JobSkills.applyDebuffEffects()`](src/js/core/job-skills.js:625) 等):**
    *   这些函数必须能够接收一个目标对象数组（而不是单个目标）。
    *   内部逻辑需要迭代此目标数组，并对每个目标独立应用效果、计算结果、记录日志。
    *   返回值需要能汇总对多个目标的操作结果。
*   **更新技能使用主逻辑 ([`JobSkills.useSkill`](src/js/core/job-skills.js:0), [`JobSkills.applySkillEffects`](src/js/core/job-skills.js:0)):**
    *   确保从 `getTargets` 获取的目标数组能正确传递到效果应用函数。
    *   `applySkillEffects` 在处理如 `multi_effect` 时，需要正确地将目标数组传递给其调用的原子效果处理函数。
*   **UI 影响:**
    *   战斗界面需要能渲染多个敌人。
    *   如果玩家技能是单体目标，UI需支持从多个敌人中选择。
    *   群体技能的日志和视觉反馈应清晰指示所有受影响目标。
*   **影响范围:** 这是一项涉及战斗系统核心的重大变更，需要仔细规划和测试。
---
### Decision (Debug)
[2025-05-11 20:13:00] - 确认怪物 AoE 技能仅影响单个我方单位的根本原因。

**Rationale:**
用户报告怪物使用的全体攻击技能错误地只对我方队伍中的一个单位造成效果。经调查，问题根源在于 [`src/js/core/job-skills.js`](src/js/core/job-skills.js) 中的 `getTargets` 函数在处理由怪物发起的、目标类型为 `all_enemies`（意指我方全体）的技能时存在逻辑缺陷。
具体来说，当 [`src/js/core/battle.js`](src/js/core/battle.js) 中的 `processMonsterAction` 函数调用 `JobSkills.useSkill` 时，它将一个通过 `selectMonsterTarget` 选定的单个我方角色作为 `JobSkills.useSkill` 的第四个参数（即 `monster` 参数）传递。随后，在 `JobSkills.useSkill` 内部调用 `JobSkills.getTargets` 时，对于 `targetType: "all_enemies"` 的情况 ([`src/js/core/job-skills.js:1114`](src/js/core/job-skills.js:1114))，`JobSkills.getTargets` 错误地将其接收到的第四个参数（即那个单个的我方角色）视为唯一目标，而不是处理本应代表我方全体的第三个参数 (`teamMembers`)。

**Implications/Details:**
*   此问题是系统性的，影响所有由怪物施放且目标类型定义为 `all_enemies` (期望作用于我方全体) 的技能。
*   修复此问题需要修改 [`src/js/core/job-skills.js`](src/js/core/job-skills.js) 中的 `getTargets` 函数，使其能够正确区分施法者身份（玩家或怪物），并相应地解析 `all_enemies` 和 `all_allies` 等目标类型。
*   此修复方向与 Memory Bank 中已记录的关于“群体目标处理与敌方队伍管理模式” ([`memory-bank/systemPatterns.md:281`](memory-bank/systemPatterns.md:281)) 和相关架构决策 ([`memory-bank/decisionLog.md:583`](memory-bank/decisionLog.md:583)) 一致，即需要更鲁棒的目标选择逻辑。

---
### Decision (Code)
[2025-05-11 20:17:00] - 修复怪物 AoE 技能的目标选择逻辑。

**Rationale:**
怪物使用的目标类型为 `all_enemies` (意指我方全体) 的技能，由于 `JobSkills.getTargets` 函数的逻辑缺陷，错误地只作用于单个我方单位。该函数未能正确区分施法者阵营来解析 `all_enemies` 和 `all_allies`。

**Details:**
*   修改了 [`src/js/core/job-skills.js`](src/js/core/job-skills.js):
    *   **`useSkill` 函数:**
        *   在函数开始时，通过比较 `characterId` 是否存在于传入的 `teamMembers` 数组中，来确定施法者是否为玩家角色 (`isCasterPlayer`)。
        *   将 `isCasterPlayer` 标志传递给所有内部调用的效果应用函数 (如 `applyDamageEffects`, `applySkillEffects` 等)。
    *   **效果应用函数 (如 `applyDamageEffects`, `applyBuffEffects`, `applySkillEffects` 等):**
        *   修改了这些函数的签名，以接收 `isCasterPlayer` 参数。
        *   将 `isCasterPlayer` 参数传递给它们内部对 `this.getTargets` 的调用。
    *   **`getTargets` 函数:**
        *   修改了函数签名，增加 `isCasterPlayer` 参数: `getTargets(character, targetType, teamMembers, monster, isCasterPlayer)`。
        *   更新了 `case "all_enemies":` 和 `case "all_allies":` 的逻辑：
            *   **`all_enemies`**:
                *   如果 `isCasterPlayer` 为 `true` (玩家施法)，目标是 `monster` (当前系统的单个敌方单位)。
                *   如果 `isCasterPlayer` 为 `false` (怪物施法)，目标是 `teamMembers` (我方全体角色)。
            *   **`all_allies`**:
                *   如果 `isCasterPlayer` 为 `true` (玩家施法)，目标是 `teamMembers` (我方全体角色)。
                *   如果 `isCasterPlayer` 为 `false` (怪物施法)，目标是 `character` (即怪物施法者自身，适用于怪物对自己队伍施放的群体技能；在当前单怪物系统中，这意味着怪物对自己施法)。
*   **兼容性检查:**
    *   确认了 [`src/js/core/battle.js`](src/js/core/battle.js) 中对 `JobSkills.useSkill` 的调用点 (如 `processMonsterAction` 和 `processCharacterSkills`) 不需要修改，因为它们传递的参数与新的 `JobSkills` 内部逻辑兼容，`isCasterPlayer` 的判断能够正确进行。
---
### Decision (Debug)
[2025-05-11 20:44:15] - [Bug Fix Strategy: Ensure backline units are combat-ready]

**Rationale:**
The user reported that backline units were not joining combat after the frontline was defeated. The investigation revealed that while the substitution logic in `Battle.handleCharacterDefeat` appeared correct, the `Battle.isBattleOver` check might prematurely end the battle if the frontline units are defeated and the backline units, though present in `this.backLineMembers`, were not considered "active" or "alive" by `isBattleOver` in time, or if their HP wasn't full when they were initially assigned to the backline. The most direct fix is to ensure that when units are designated as backline members at the start of a battle, their HP is explicitly set to full. This guarantees that if they are called upon, they are in a ready state.

**Details:**
Modified [`src/js/core/battle.js`](src/js/core/battle.js) within the `startBattle` function. When characters are added to the `backLineMembers` list, their `currentStats.hp` is now explicitly set to `currentStats.maxHp`. This ensures that any prior combat damage doesn't carry over for backline units in a way that prevents them from being viable replacements.
```diff
<<<<<<< SEARCH
:start_line:136
-------
                    backLineMembers.push(character);
=======
                    // Ensure backline members are at full HP when battle starts
                    if (character.currentStats && typeof character.currentStats.maxHp === 'number') {
                        character.currentStats.hp = character.currentStats.maxHp;
                    }
                    backLineMembers.push(character);
>>>>>>> REPLACE
```
**Affected components/files:**
*   [`src/js/core/battle.js`](src/js/core/battle.js)
---
### Decision (Code)
[2025-05-11 21:47:31] - 标准化 `calculateAttackPower` 函数中的日志记录。

**Rationale:**
用户报告 `calculateAttackPower` 函数 ([`src/js/core/character.js`](src/js/core/character.js:1512)) 中的日志未按预期打印。经检查，该函数使用了旧的 `window.logBattle.log()` 和 `Battle.logBattle()` 方法进行日志记录。为了与项目中其他部分保持一致，并利用 `BattleLogger` 提供的多级日志功能，决定将此处的日志记录迁移到 `BattleLogger.log()`。

**Details:**
*   修改了 [`src/js/core/character.js`](src/js/core/character.js) 中的 `calculateAttackPower` 函数。
*   所有 `window.logBattle.log()` 和 `Battle.logBattle()` 调用已替换为 `BattleLogger.log()`。
*   详细的计算步骤日志使用了 `BattleLogger.levels.CONSOLE_DETAIL` 级别。
*   函数开始和结束的概要日志使用了 `BattleLogger.levels.CONSOLE_INFO` 或 `CONSOLE_DETAIL` 级别。
*   日志消息中添加了角色名和ID，以便更好地追踪。
---
### Decision (Debug)
[2025-05-11 21:59:00] - 增强 `calculateAttackPower` 函数的日志记录以追踪攻击力倍率。

**Rationale:**
用户反馈技能 "一伐架式" ([`src/data/ssr_skill.json`](src/data/ssr_skill.json))（一个独立的、不可叠加的buff）参与计算时，攻击力倍率异常。为了能够清晰地追踪所有参与计算的攻击力buff及其来源，从而理解最终倍率的构成，需要增强 [`src/js/core/character.js`](src/js/core/character.js) 中 `calculateAttackPower` 函数 ([`src/js/core/character.js:1512`](src/js/core/character.js:1512)) 的日志记录。

**Details:**
*   修改了 [`src/js/core/character.js`](src/js/core/character.js) 中的 `calculateAttackPower` 函数 ([`src/js/core/character.js:1512`](src/js/core/character.js:1512))。
*   引入 `calculationSteps` 数组，用于收集每一步攻击力计算的详细描述。
*   **初始攻击力日志增强：** 记录 `character.currentStats.attack` 的初始值，并注明其由 `baseStats`, `weaponBonusStats`, `multiBonusStats` 构成。
*   **可叠加Buff日志增强：**
    *   分别列出所有参与计算的可叠加 `attackUp` buff及其效果值。
    *   分别列出所有参与计算的 `attackDown` buff及其效果值。
    *   记录应用累积修正后的攻击力。
*   **独立Buff日志增强：**
    *   对于每个独立的 `attackUp` buff (如 "一伐架式")，记录其名称、来源（如果buff对象中有 `source` 属性）、乘算因子和应用后的攻击力。
*   **其他乘区日志增强：** 保持对浑身、背水、EX攻击等乘区的日志记录，并尝试加入buff来源。
*   **固定值Buff日志增强：** 如果存在固定攻击力上升的buff，记录其名称、来源和效果。
*   **最终倍率日志：** 计算并记录最终攻击力相对于初始 `currentStats.attack` 的总倍率。
*   **统一日志输出：** 所有 `calculationSteps` 通过 `BattleLogger.log` 的 `details` 参数在 `CONSOLE_DETAIL` 级别一次性输出，提供完整的计算链路。
*   **Affected components/files:**
    *   [`src/js/core/character.js`](src/js/core/character.js)
---
### Decision (Architecture)
[2025-05-12 13:30:04] - 物品系统重构 - 核心架构决策 (部分内容已由 [2025-05-12 16:14:00] 的决策修正)

**Rationale:**
为了实现更灵活和可扩展的物品系统，满足新的游戏机制需求（如新的物品分类、经验材料等），并移除不再需要的商店功能。

**Implications/Details:**

*   **新物品分类与属性:**
    *   **分类:** 在 [`src/js/core/item.js`](src/js/core/item.js) 中，`Item.types` 将更新为包含 `ingredient`, `experience_material`, `ascension_material`, `special_item`。
    *   **默认属性:** 所有物品将默认拥有 `stackable: true` 属性。
    *   **新属性:** 为所有物品添加 `type` 属性，其值对应新的分类。

*   **物品定义存储与加载:**
    *   **存储:** 所有物品的定义（包括ID, 名称, 类型, 特定属性如 `exp`，以及 `stackable` 等）将存储在一个新的JSON文件 [`src/data/items_definitions.json`](src/data/items_definitions.json) 中。
    *   **加载:** 在 [`src/js/core/item.js`](src/js/core/item.js) 中实现一个新的静态方法 `Item.loadItemDefinitions()`，负责从 [`src/data/items_definitions.json`](src/data/items_definitions.json) 加载物品定义数据，并可能将其存储在 `Item` 类的静态属性中（例如 `Item.definitions`）供全局访问。
    *   **创建逻辑:** [`src/js/core/item.js`](src/js/core/item.js) 中的 `Item.createItem(itemId, quantity)` 方法将调整，以从 `Item.definitions` (或类似的数据源) 中查找物品模板，并根据模板创建物品实例，正确设置所有属性。

*   **怪物掉落机制 (已由 [2025-05-12 16:14:00] 的决策修正):**
    *   ~~**数据结构:** 怪物定义文件 (如 [`src/data/monsters.json`](src/data/monsters.json), [`src/data/bosses.json`](src/data/bosses.json)) 将为每个怪物/Boss添加一个 `drops` 数组。~~ (此方案不适用于新设计的物品)
    *   ~~**掉落项结构:** `drops` 数组中的每个元素是一个对象，包含：~~
        *   ~~`itemId` (string): 掉落物品的ID，对应 [`src/data/items_definitions.json`](src/data/items_definitions.json) 中的ID。~~
        *   ~~`chance` (number, 0-1): 物品的掉落概率。~~
        *   ~~`quantityMin` (number): 掉落数量的最小值。~~
        *   ~~`quantityMax` (number): 掉落数量的最大值。~~
    *   ~~**处理逻辑:** [`src/js/core/dungeon.js`](src/js/core/dungeon.js) 中的 `Dungeon.processRewards()` ([`src/js/core/dungeon.js:933`](src/js/core/dungeon.js:933)) 函数将修改，以遍历被击败怪物的 `drops` 数组。对每个掉落项，根据 `chance` 判定是否掉落，若掉落则在 `quantityMin` 和 `quantityMax` 之间随机生成数量，并通过 `Inventory.addItem()` 添加到玩家库存。~~ (此逻辑不适用于新设计的物品的直接掉落)
    *   **修正:** 新设计的物品将通过 `chestDrops` 机制掉落，详见 [2025-05-12 16:14:00] 的决策。

*   **商店功能移除:**
    *   **文件删除:** 删除 [`src/js/core/shop.js`](src/js/core/shop.js) 文件。
    *   **UI清理:** 从 [`src/js/components/UI.js`](src/js/components/UI.js) 中移除 `renderShop()` ([`src/js/components/UI.js:697`](src/js/components/UI.js:697)) 函数、相关的UI元素（如商店按钮）和所有相关的事件监听器。
    *   **代码引用清理:** 检查并移除项目中所有对 `Shop` 对象或 [`src/js/core/shop.js`](src/js/core/shop.js) 的引用，特别是在 [`src/js/core/item.js`](src/js/core/item.js) 和 [`src/js/core/inventory.js`](src/js/core/inventory.js) 中，确保物品数据的获取和管理不再依赖于已移除的商店系统。

*   **物品堆叠确认:**
    *   确认 [`src/js/core/inventory.js`](src/js/core/inventory.js) 中的 `addItem` 等相关方法能够正确处理基于物品 `stackable` 属性的堆叠逻辑。

---
### Decision (Debug)
[2025-05-13 10:49:31] - **修复JavaScript模块加载和依赖错误**

**Rationale:**
用户报告的错误包括 `Uncaught ReferenceError: Character is not defined`，多个组件中 `UI module not loaded`，以及 `main.js` 中 `找不到Events模块`。这些问题主要源于：
1.  主入口脚本 [`main.js`](src/js/main.js:462) 未使用 `type="module"` 加载，导致其无法导入其他模块。
2.  [`character-main.js`](src/js/core/character-main.js) 未导入其依赖的 `Character` 模块。
3.  [`UI.js`](src/js/components/UI.js) 未导出 `UI` 对象，导致其他依赖它的组件模块无法导入。

**Details:**
*   **修改 [`index.html`](index.html):**
    *   为 `<script src="src/js/main.js"></script>` 添加了 `type="module"`。
    *   移除了对已废弃脚本 `<script type="module" src="src/js/core/shop.js"></script>` 的引用。
*   **修改 [`src/js/core/character-main.js`](src/js/core/character-main.js):**
    *   在文件顶部添加了 `import Character from './character.js';`。
*   **修改 [`src/js/components/UI.js`](src/js/components/UI.js):**
    *   在文件末尾添加了 `export default UI;`。
*   **修改以下组件文件以导入 `UI` 模块:**
    *   [`src/js/components/ui-main-character.js`](src/js/components/ui-main-character.js): 添加 `import UI from './UI.js';`
    *   [`src/js/components/job-selection.js`](src/js/components/job-selection.js): 添加 `import UI from './UI.js';`
    *   [`src/js/components/tavern.js`](src/js/components/tavern.js): 添加 `import UI from './UI.js';`
    *   [`src/js/components/team-management.js`](src/js/components/team-management.js): 添加 `import UI from './UI.js';`

**Affected components/files:**
*   [`index.html`](index.html)
*   [`src/js/core/character-main.js`](src/js/core/character-main.js)
*   [`src/js/components/UI.js`](src/js/components/UI.js)
*   [`src/js/components/ui-main-character.js`](src/js/components/ui-main-character.js)
*   [`src/js/components/job-selection.js`](src/js/components/job-selection.js)
*   [`src/js/components/tavern.js`](src/js/components/tavern.js)
*   [`src/js/components/team-management.js`](src/js/components/team-management.js)
---
### Decision (Debug)
[2025-05-13 11:03:17] - **修复 `Error: 找不到Game模块` 以及间接修复 `Error: 找不到Events模块`**

**Rationale:**
用户最初报告 `Error: 找不到Events模块` ([`main.js:10`](src/js/main.js:10))。经过诊断，发现 `Events` 模块本身导入和导出均正确，且在 `DOMContentLoaded` 事件中 `Events.init()` 能够成功调用，表明 `Events` 模块已正确加载。
后续的控制台日志显示新的主要错误为 `Error: 找不到Game模块` ([`main.js:231`](src/js/main.js:231) 附近)。检查 [`main.js`](src/js/main.js) 发现 `import Game from './core/game.js';` 以及其他多个核心模块的导入语句被注释掉了。

**Details:**
*   **修改 [`src/js/main.js`](src/js/main.js):**
    *   取消了对 `Game`模块的导入语句 `// import Game from './core/game.js';` ([`src/js/main.js:21`](src/js/main.js:21) 附近) 的注释。
    *   同时取消了对其他必要核心模块的导入注释，包括 `Resources`, `Buildings`, `Item`, `Weapon`, `JobSkillsTemplate`, `JobSystem`, `Character`, `Inventory`, `Team`, `BuffSystem`, `Dungeon`, `WeaponBoardBonusSystem`, `SkillTooltip`。
    *   移除了之前为诊断 `Events` 模块问题而添加的 `console.log` 语句。
*   **影响:**
    *   取消对 `Game` 模块的导入，直接解决了 `Error: 找不到Game模块` 的问题。
    *   由于 `Events` 模块的加载和初始化本身沒有问题，而最初的错误报告可能是由于后续 `Game` 模块或其他模块加载失败导致初始化流程中断或错误信息被不准确地归因。通过确保所有核心模块正确导入，预计最初报告的 `Events` 模块找不到的问题也将随之解决。

**Affected components/files:**
*   [`src/js/main.js`](src/js/main.js)
---
### Decision (Debug)
[2025-05-13 11:05:12] - **修复 `SyntaxError: The requested module './core/buildings.js' does not provide an export named 'default'`**

**Rationale:**
在修复了 `Game` 模块导入问题后，用户报告了新的错误，指出 [`src/js/core/buildings.js`](src/js/core/buildings.js) 模块没有默认导出。检查该文件确认了它定义了 `Buildings` 对象但缺少导出语句。

**Details:**
*   **修改 [`src/js/core/buildings.js`](src/js/core/buildings.js):**
    *   在文件末尾添加了 `export default Buildings;` 语句。
*   **影响:**
    *   这使得 [`main.js`](src/js/main.js) 中的 `import Buildings from './core/buildings.js';` 语句能够成功导入模块，解决了该 `SyntaxError`。

**Affected components/files:**
*   [`src/js/core/buildings.js`](src/js/core/buildings.js)
---
### Decision (Debug)
[2025-05-13 11:09:58] - **移除 `buildings.js` 模块引用并修复 `dungeon.js` 导出错误**

**Rationale:**
用户明确表示不需要 `buildings.js` 模块。同时，在解决了 `buildings.js` 的导出问题后，出现了新的 `SyntaxError` 指出 [`src/js/core/dungeon.js`](src/js/core/dungeon.js) 模块没有默认导出。

**Details:**
*   **移除 `buildings.js`:**
    *   在 [`src/js/main.js`](src/js/main.js) 中注释掉了 `import Buildings from './core/buildings.js';`。
    *   在 [`index.html`](index.html) 中注释掉了 `<script type="module" src="src/js/core/buildings.js"></script>`。
    *   建议用户可以手动删除 [`src/js/core/buildings.js`](src/js/core/buildings.js) 文件。
*   **修复 `dungeon.js` 导出错误:**
    *   检查了 [`src/js/core/dungeon.js`](src/js/core/dungeon.js)，确认其定义了 `Dungeon` 对象但缺少导出语句。
    *   在 [`src/js/core/dungeon.js`](src/js/core/dungeon.js) 文件末尾添加了 `export default Dungeon;`。
*   **影响:**
    *   移除了不再需要的 `buildings.js` 模块的加载。
    *   解决了 `dungeon.js` 模块的导入问题。

**Affected components/files:**
*   [`src/js/main.js`](src/js/main.js)
*   [`index.html`](index.html)
*   [`src/js/core/dungeon.js`](src/js/core/dungeon.js)
---
### Decision (Debug)
[2025-05-13 11:12:42] - **修复 `SyntaxError: The requested module './core/game.js' does not provide an export named 'default'`**

**Rationale:**
在修复了 `dungeon.js` 的导出问题后，用户报告了新的 `SyntaxError`，指出 [`src/js/core/game.js`](src/js/core/game.js) 模块没有默认导出。检查该文件确认了它定义了 `Game` 对象但缺少导出语句。

**Details:**
*   **修改 [`src/js/core/game.js`](src/js/core/game.js):**
    *   在文件末尾添加了 `export default Game;` 语句。
*   **影响:**
    *   这使得 [`main.js`](src/js/main.js) 中的 `import Game from './core/game.js';` 语句能够成功导入模块，解决了该 `SyntaxError`。

**Affected components/files:**
*   [`src/js/core/game.js`](src/js/core/game.js)
---
### Decision (Debug)
[2025-05-13 11:14:02] - **修复 `SyntaxError: The requested module './core/inventory.js' does not provide an export named 'default'`**

**Rationale:**
在修复了 `game.js` 的导出问题后，用户报告了新的 `SyntaxError`，指出 [`src/js/core/inventory.js`](src/js/core/inventory.js) 模块没有默认导出。检查该文件确认了它定义了 `Inventory` 对象但缺少导出语句。

**Details:**
*   **修改 [`src/js/core/inventory.js`](src/js/core/inventory.js):**
    *   在文件末尾添加了 `export default Inventory;` 语句。
*   **影响:**
    *   这使得 [`main.js`](src/js/main.js) 中的 `import Inventory from './core/inventory.js';` 语句能够成功导入模块，解决了该 `SyntaxError`。

**Affected components/files:**
*   [`src/js/core/inventory.js`](src/js/core/inventory.js)
---
### Decision (Debug)
[2025-05-13 11:15:20] - **修复 `SyntaxError: The requested module './core/item.js' does not provide an export named 'default'`**

**Rationale:**
在修复了 `inventory.js` 的导出问题后，用户报告了新的 `SyntaxError`，指出 [`src/js/core/item.js`](src/js/core/item.js) 模块没有默认导出。检查该文件确认了它定义了 `Item` 对象但缺少导出语句。

**Details:**
*   **修改 [`src/js/core/item.js`](src/js/core/item.js):**
    *   在文件末尾添加了 `export default Item;` 语句。
*   **影响:**
    *   这使得 [`main.js`](src/js/main.js) 中的 `import Item from './core/item.js';` 语句能够成功导入模块，解决了该 `SyntaxError`。

**Affected components/files:**
*   [`src/js/core/item.js`](src/js/core/item.js)
---
### Decision (Debug)
[2025-05-13 11:17:08] - **修复 `SyntaxError: The requested module './core/job-skills-template.js' does not provide an export named 'default'`**

**Rationale:**
在修复了 `item.js` 的导出问题后，用户报告了新的 `SyntaxError`，指出 [`src/js/core/job-skills-template.js`](src/js/core/job-skills-template.js) 模块没有默认导出。检查该文件确认了它定义了 `JobSkillsTemplate` 对象但缺少导出语句。

**Details:**
*   **修改 [`src/js/core/job-skills-template.js`](src/js/core/job-skills-template.js):**
    *   在文件末尾添加了 `export default JobSkillsTemplate;` 语句。
*   **影响:**
    *   这使得 [`main.js`](src/js/main.js) 中的 `import JobSkillsTemplate from './core/job-skills-template.js';` 语句能够成功导入模块，解决了该 `SyntaxError`。

**Affected components/files:**
*   [`src/js/core/job-skills-template.js`](src/js/core/job-skills-template.js)
---
### Decision (Debug)
[2025-05-13 11:18:04] - **修复 [`src/js/core/job-system.js`](src/js/core/job-system.js) 缺少默认导出问题**

**Rationale:**
在处理一系列模块导入错误时，根据 [`main.js`](src/js/main.js) 的导入顺序，检查到 [`src/js/core/job-system.js`](src/js/core/job-system.js) 文件。该文件定义了 `JobSystem` 对象但缺少默认导出语句，这会导致 `import JobSystem from './core/job-system.js';` 失败。

**Details:**
*   **修改 [`src/js/core/job-system.js`](src/js/core/job-system.js):**
    *   在文件末尾添加了 `export default JobSystem;` 语句。
*   **影响:**
    *   确保 `JobSystem` 模块可以被正确导入。

**Affected components/files:**
*   [`src/js/core/job-system.js`](src/js/core/job-system.js)
---
### Decision (Debug)
[2025-05-13 11:19:14] - **修复 [`src/js/core/team.js`](src/js/core/team.js) 缺少默认导出问题**

**Rationale:**
在处理一系列模块导入错误时，根据 [`main.js`](src/js/main.js) 的导入顺序，检查到 [`src/js/core/team.js`](src/js/core/team.js) 文件。该文件定义了 `Team` 对象但缺少默认导出语句，这会导致 `import Team from './core/team.js';` 失败。

**Details:**
*   **修改 [`src/js/core/team.js`](src/js/core/team.js):**
    *   在文件末尾添加了 `export default Team;` 语句。
*   **影响:**
    *   确保 `Team` 模块可以被正确导入。

**Affected components/files:**
*   [`src/js/core/team.js`](src/js/core/team.js)
---
### Decision (Debug)
[2025-05-13 11:20:29] - **修复 [`src/js/core/weapon-board-bonus-system.js`](src/js/core/weapon-board-bonus-system.js) 缺少默认导出问题**

**Rationale:**
在处理一系列模块导入错误时，根据 [`main.js`](src/js/main.js) 的导入顺序，检查到 [`src/js/core/weapon-board-bonus-system.js`](src/js/core/weapon-board-bonus-system.js) 文件。该文件定义了 `WeaponBoardBonusSystem` 对象但缺少默认导出语句，这会导致 `import WeaponBoardBonusSystem from './core/weapon-board-bonus-system.js';` 失败。

**Details:**
*   **修改 [`src/js/core/weapon-board-bonus-system.js`](src/js/core/weapon-board-bonus-system.js):**
    *   在文件末尾添加了 `export default WeaponBoardBonusSystem;` 语句。
*   **影响:**
    *   确保 `WeaponBoardBonusSystem` 模块可以被正确导入。

**Affected components/files:**
*   [`src/js/core/weapon-board-bonus-system.js`](src/js/core/weapon-board-bonus-system.js)
---
### Decision (Debug)
[2025-05-13 11:21:34] - **修复 [`src/js/components/skill-tooltip.js`](src/js/components/skill-tooltip.js) 缺少默认导出问题**

**Rationale:**
在处理一系列模块导入错误时，根据 [`main.js`](src/js/main.js) 的导入顺序，检查到 [`src/js/components/skill-tooltip.js`](src/js/components/skill-tooltip.js) 文件。该文件定义了 `SkillTooltip` 对象但缺少默认导出语句，这会导致 `import SkillTooltip from './components/skill-tooltip.js';` 失败。

**Details:**
*   **修改 [`src/js/components/skill-tooltip.js`](src/js/components/skill-tooltip.js):**
    *   在文件末尾添加了 `export default SkillTooltip;` 语句。
*   **影响:**
    *   确保 `SkillTooltip` 模块可以被正确导入。这是本次排查中最后一个在 `main.js` 中启用的、需要检查导出语句的模块。

**Affected components/files:**
*   [`src/js/components/skill-tooltip.js`](src/js/components/skill-tooltip.js)
---
### Decision (Debug)
[2025-05-13 11:29:41] - **修复 [`src/js/core/resources.js`](src/js/core/resources.js) 缺少默认导出问题**

**Rationale:**
在处理一系列模块导入错误时，根据 [`main.js`](src/js/main.js) 的导入顺序，检查到 [`src/js/core/resources.js`](src/js/core/resources.js) 文件。该文件定义了 `Resources` 对象但缺少默认导出语句，这会导致 `import Resources from './core/resources.js';` 失败。

**Details:**
*   **修改 [`src/js/core/resources.js`](src/js/core/resources.js):**
    *   在文件末尾添加了 `export default Resources;` 语句。
*   **影响:**
    *   确保 `Resources` 模块可以被正确导入。

**Affected components/files:**
*   [`src/js/core/resources.js`](src/js/core/resources.js)
---
### Decision (Debug)
[2025-05-13 17:18:29] - **修复 `file-utils.js` 模块未提供默认导出问题**

**Rationale:**
错误 "Uncaught SyntaxError: The requested module '../utils/file-utils.js' does not provide an export named 'default' (at game.js:6:8)" 表明 [`src/js/core/game.js`](src/js/core/game.js:6) 尝试默认导入 [`src/js/utils/file-utils.js`](src/js/utils/file-utils.js)，但后者未提供默认导出。

**Details:**
*   **修改 [`src/js/utils/file-utils.js`](src/js/utils/file-utils.js):**
    *   在文件末尾添加了 `export default FileUtils;` 语句。
*   **影响:**
    *   使得 [`src/js/core/game.js`](src/js/core/game.js:6) 中的 `import FileUtils from '../utils/file-utils.js';` 语句能够成功导入模块。

**Affected components/files:**
*   [`src/js/utils/file-utils.js`](src/js/utils/file-utils.js)
*   [`src/js/core/game.js`](src/js/core/game.js)

---
### Decision (Debug)
[2025-05-13 17:24:09] - 修复CSS中多个图标路径引用错误

**Rationale:**
用户报告多个图标文件（`team-icon.png`, `shop-icon.png`, `tavern-icon.png`, `weapon-icon.png`, `dungeon-icon.png`）返回404错误，且 `team-icon.png` 抛出 `SyntaxError`。经检查，所有这些图标都在 [`src/css/main-ui.css`](src/css/main-ui.css) 中通过 `background-image: url('../img/icons/...')` 引用，但实际图片位于 `src/icon/` 目录或需要用户提供。`SyntaxError` 已由用户确认为解决。

**Details:**
*   **修改 [`src/css/main-ui.css`](src/css/main-ui.css):**
    *   将 `url('../img/icons/team-icon.png')` ([`src/css/main-ui.css:81`](src/css/main-ui.css:81)) 修改为 `url('../icon/team.png')`。
    *   将 `url('../img/icons/shop-icon.png')` ([`src/css/main-ui.css:188`](src/css/main-ui.css:188)) 修改为 `url('../icon/bag.png')` (根据用户指示)。
    *   将 `url('../img/icons/tavern-icon.png')` ([`src/css/main-ui.css:107`](src/css/main-ui.css:107)) 修改为 `url('../icon/beerbar.png')` (根据用户指示)。
    *   将 `url('../img/icons/weapon-icon.png')` ([`src/css/main-ui.css:134`](src/css/main-ui.css:134)) 修改为 `url('../icon/weapon.png')` (根据用户指示，用户将提供此文件)。
    *   将 `url('../img/icons/dungeon-icon.png')` ([`src/css/main-ui.css:160`](src/css/main-ui.css:160)) 修改为 `url('../icon/dungeon.png')`。
*   **影响:**
    *   解决了图标的404错误。
    *   `SyntaxError` 已由用户确认为解决，可能与路径修正间接相关或为其他因素。

**Affected components/files:**
*   [`src/css/main-ui.css`](src/css/main-ui.css)

---
### Decision (Debug)
[2025-05-13 17:39:00] - **修复 `weapon.js` 和 `inventory.js` 中的 `ReferenceError`**

**Rationale:**
用户报告了两个 `ReferenceError`：
1.  `ReferenceError: Game is not defined` at [`weapon.js:526`](src/js/core/weapon.js:526)
2.  `ReferenceError: Item is not defined` at [`inventory.js:51`](src/js/core/inventory.js:51)

这些错误表明相关模块未能正确访问 `Game` 和 `Item` 对象，通常是由于缺少模块导入。

**Details:**
*   **修改 [`src/js/core/weapon.js`](src/js/core/weapon.js):**
    *   在文件顶部 ([`src/js/core/weapon.js:4`](src/js/core/weapon.js:4)) 添加了 `import Game from './game.js';`。
*   **修改 [`src/js/core/inventory.js`](src/js/core/inventory.js):**
    *   在文件顶部 ([`src/js/core/inventory.js:4`](src/js/core/inventory.js:4)) 添加了 `import Item from './item.js';`。
*   **影响:**
    *   这些更改确保了 `Weapon` 模块可以访问 `Game` 对象，`Inventory` 模块可以访问 `Item` 对象，从而解决了 `ReferenceError`。

**Affected components/files:**
*   [`src/js/core/weapon.js`](src/js/core/weapon.js)
*   [`src/js/core/inventory.js`](src/js/core/inventory.js)

---
### Decision (Debug)
[2025-05-13 18:00:00] - **修复游戏初始化期间 `character.js` 中的 `ReferenceError: Team is not defined`**

**Rationale:**
用户报告在游戏初始化时发生 `ReferenceError: Team is not defined`，错误堆栈指向 [`character.js`](src/js/core/character.js) 的 `updateTeamWeaponBonusStats` 函数 ([`src/js/core/character.js:1360`](src/js/core/character.js:1360))。此函数尝试访问 `Team.getTeam()`，但 `Team` 模块未在该文件中导入。

**Details:**
*   **修改 [`src/js/core/character.js`](src/js/core/character.js):**
    *   在文件顶部 ([`src/js/core/character.js:4`](src/js/core/character.js:4)) 添加了以下导入语句：
        *   `import Team from './team.js';`
        *   `import Dungeon from './dungeon.js';` (根据代码中对 `Dungeon.currentRun` 的使用情况添加)
        *   `import BuffSystem from './buff-system.js';` (根据代码中对 `BuffSystem.clearAllBuffs` 的使用情况添加)
*   **影响:**
    *   确保 `Character` 模块能够正确访问 `Team` 模块以及其他依赖的模块，解决了初始化时的 `ReferenceError`。

**Affected components/files:**
*   [`src/js/core/character.js`](src/js/core/character.js)

---
### Decision (Debug)
[2025-05-13 18:03:00] - **修复 `index.html` 中内联 `onclick` 事件处理器无法找到 `UI` 对象的问题**

**Rationale:**
用户报告在点击HTML元素上的内联 `onclick` 事件时发生 `ReferenceError: UI is not defined` (at `(索引):95`)。这是因为 `UI` 模块虽然在 [`main.js`](src/js/main.js) 中被导入并初始化，但并未挂载到全局 `window` 对象上，导致内联事件处理器无法在全局作用域中找到它。

**Details:**
*   **修改 [`src/js/main.js`](src/js/main.js):**
    *   在 `UI.init()` 调用之后，添加了 `window.UI = UI;` ([`src/js/main.js:198`](src/js/main.js:198) 附近)。
*   **影响:**
    *   将 `UI` 对象暴露到全局作用域，使得 `index.html` 中的内联 `onclick="UI.switchScreen(...)"` 等调用能够正确执行。

**Affected components/files:**
*   [`src/js/main.js`](src/js/main.js)