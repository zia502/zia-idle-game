# System Patterns *Optional*

This file documents recurring patterns and standards used in the project.
It is optional, but recommended to be updated as the project evolves.
2025-05-08 11:35:32 - Log of updates made.

*

## Coding Patterns

*   

## Architectural Patterns

*   

---
### Skill System Patterns
[2025-05-08 20:45:00] - Standardized Skill EffectTypes
[2025-05-08 21:38:00] - Refined `effectType` guidance and mapping to atomic effects.

**Standardized Top-Level `effectType` List and Definitions:**

The top-level `effectType` in skill JSON files provides a high-level classification. The actual skill execution relies on the `type` property within each object in the `effects` array, which corresponds to atomic or compound-atomic effects processed by `JobSkills.applySkillEffects`.

*   **`damage`**:
    *   **Description**: The primary effect of the skill is to inflict direct damage.
    *   **Atomic Effect Mapping**: Corresponds to `damage` or `enmity` types in the `applySkillEffects` switch.
    *   **Skill JSON (`effects` array)**: Must contain effect objects with `type: "damage"` or `type: "enmity"`.
    *   *Example*: Deals 100 fire damage to the target.

*   **`buff`**:
    *   **Description**: The primary effect of the skill is to apply a beneficial status effect to friendly targets.
    *   **Atomic Effect Mapping**: Corresponds to `buff` type in `applySkillEffects`.
    *   **Skill JSON (`effects` array)**: Must contain effect objects with `type: "buff"`.
    *   *Example*: Increases target's attack by 20% for 3 turns.

*   **`debuff`**:
    *   **Description**: The primary effect of the skill is to apply a detrimental status effect to enemy targets.
    *   **Atomic Effect Mapping**: Corresponds to `debuff` type in `applySkillEffects`.
    *   **Skill JSON (`effects` array)**: Must contain effect objects with `type: "debuff"`.
    *   *Example*: Decreases target's defense by 15% for 2 turns.

*   **`heal`**:
    *   **Description**: The primary effect of the skill is to restore health to friendly targets.
    *   **Atomic Effect Mapping**: Corresponds to `heal` type in `applySkillEffects`.
    *   **Skill JSON (`effects` array)**: Must contain effect objects with `type: "heal"`.
    *   *Example*: Heals the target for 500 HP.

*   **`dispel`**:
    *   **Description**: The primary effect of the skill is to remove one or more status effects (buffs or debuffs) from a target.
    *   **Atomic Effect Mapping**: Corresponds to `dispel` type in `applySkillEffects`.
    *   **Skill JSON (`effects` array)**: Must contain effect objects with `type: "dispel"`.
    *   *Example*: Dispels all debuffs from the target.

*   **`multi_effect`**:
    *   **Description**: Used for skills that combine multiple distinct core effects, or include complex effects not covered by a single basic `effectType`. The top-level `multi_effect` serves as a general category, with specific atomic effects detailed within the `effects` array.
    *   **Atomic Effect Mapping (Combinations)**: Can include any combination of atomic types processed by `applySkillEffects` (e.g., `damage`, `buff`, `debuff`, `heal`, `dispel`, `revive`, `triggerSkill`, `proc`, `damage_and_buff`, `damage_and_debuff`).
    *   **Guidance**:
        *   Use `multi_effect` if the skill's core function is not a singular `damage`, `buff`, `debuff`, `heal`, or `dispel`.
        *   Use `multi_effect` if the skill includes effects like `revive`, `triggerSkill`, `proc`, or compound types like `damage_and_buff`.
        *   Cost-type effects (e.g., `hpCostPercentageCurrent`) are usually paired with primary effects. The skill's top-level `effectType` should reflect the primary effect(s) (e.g., `damage` or `multi_effect`).
    *   *Example*: A skill that deals damage and applies a buff to the caster.

*   **`passive`**:
    *   **Description**: The skill's effects are triggered passively, automatically activating under certain conditions or providing continuous stat bonuses without active casting.
    *   **Processing Logic**: Typically handled outside the `useSkill` -> `applySkillEffects` pathway, often within other game logic parts (e.g., event callbacks, status checks).
    *   **Skill JSON (`effects` array)**: Describes the specific parameters and nature of the passive effect.
    *   *Example*: Increases defense when HP is below 30%.

*   **`trigger`**:
    *   **Description**: The skill's effects are actively triggered upon a specific event or condition (distinct from the continuous or auto-check nature of `passive`). The `useSkill` function routes these to `applySkillEffects`.
    *   **Atomic Effect Mapping**: The `effects` array usually contains `type: "triggerSkill"` to activate another skill, or directly defines atomic effects like `damage` or `buff` as the triggered outcome.
    *   **Skill JSON (`effects` array)**: Defines the specific atomic effects that occur upon triggering.
    *   *Example*: Has a chance to counter-attack with damage when hit.

**Important Clarifications on Atomic Effects vs. Top-Level `effectType`:**

*   Atomic effect types like `revive`, `proc`, `enmity`, `damage_and_buff`, `damage_and_debuff`, and `triggerSkill` (which are handled in the `applySkillEffects` switch in [`src/js/core/job-skills.js`](src/js/core/job-skills.js:366)) should be represented at the top-level `effectType` as follows:
    *   `enmity`: Can be classified under the top-level `damage` if it's the sole primary damage effect.
    *   All others (`revive`, `proc`, `damage_and_buff`, `damage_and_debuff`, `triggerSkill`): Should be classified under the top-level `multi_effect`.
    *   The specific atomic type (e.g., `"revive"`) is then specified in the `type` field of an object within the skill's `effects` array.
*   Cost-inducing effects like `hpCostPercentageCurrent` are not primary effect types. They are defined within the `effects` array and are prioritized in `applySkillEffects`. The skill's top-level `effectType` is determined by its main beneficial/offensive effects.

---
### [2025-05-08 22:58:00] - Multi-Skill Attempt Loop Pattern

**Context:** In [`src/js/core/battle.js`](src/js/core/battle.js:1) `processCharacterAction`, characters should attempt to use all available (off-cooldown) skills in a turn until an "offensive action" is performed or no more skills can be used.

**Pattern:**

1.  **`hasPerformedOffensiveActionThisTurn` Flag:** A boolean flag, initialized to `false` at the start of a character's turn.
2.  **Skill Iteration:** Loop through the character's `availableSkills` list.
    *   **Pre-check:** If `hasPerformedOffensiveActionThisTurn` is `true`, break the loop.
    *   **Usability Check:** For each skill, call `Battle.canUseSkill`.
    *   **Attempt Use:** If usable, call `JobSkills.useSkill`.
    *   **Outcome:**
        *   If successful:
            *   Determine if the skill was "offensive" (e.g., based on `skill.effectType` like `damage`, `debuff`, or offensive `multi_effect`).
            *   If offensive, set `hasPerformedOffensiveActionThisTurn = true`.
            *   Log the skill usage.
        *   If failed: Log the failure.
3.  **Normal Attack Condition:** After the loop, if `hasPerformedOffensiveActionThisTurn` is still `false`, the character performs a normal attack. Otherwise, no normal attack is made.

**"Offensive Action" Definition (Simplified for this pattern):**
A skill is considered "offensive" if its `effectType` is one of:
*   `damage`
*   `debuff`
*   `multi_effect` (if it contains offensive sub-effects, requires careful checking or a helper function)
*   `trigger` (if its triggered effect is offensive)

Skills with `effectType` like `buff`, `heal`, `dispel` are generally not considered "offensive" for the purpose of ending the skill usage phase immediately, allowing characters to potentially use a buff and then an attack skill. The exact definition of "offensive" might need refinement based on game balance.

---
### [2025-05-09 17:03:00] - Boss AI Skill Selection Pattern

**Context:** Bosses require a new skill selection logic that prioritizes HP threshold-triggered skills, then considers regular cooldown-based skills, and finally resorts to a basic attack.

**Pattern:**

**Phase 1: HP Threshold Skill Check (Highest Priority)**
1.  **Trigger Identification:** At the start of the Boss's turn, identify all skills with a `triggerCondition: { type: "hp_threshold", value: Number, priority: Number }`.
2.  **Condition Check:** For each identified skill, check if `Boss.currentHP / Boss.maxHP <= triggerCondition.value`.
3.  **Selection:**
    *   If multiple skills meet the HP threshold:
        *   Sort them by `triggerCondition.priority` (ascending, lower value is higher priority).
        *   If priorities are equal, sort by their original order in the Boss's skill list.
    *   Select the highest priority skill.
4.  **Action & CD:**
    *   If a skill is selected, the Boss uses this skill.
    *   **Crucially, this type of skill usage IGNORES its own cooldown and DOES NOT trigger a cooldown after use.**
    *   The Boss's turn ends (no normal attack).

**Phase 2: Regular Skill Check (If No HP Threshold Skill Used)**
1.  **Condition:** This phase executes only if no skill was chosen in Phase 1.
2.  **Skill Iteration:** Iterate through the Boss's skill list in their defined order.
3.  **CD Check:** For each skill, check its current cooldown status (managed dynamically on the Boss instance in battle, e.g., `bossInstance.skillCooldowns[skillId] === 0`).
4.  **Selection:** Select the first skill that is not on cooldown.
5.  **Action & CD:**
    *   If a skill is selected, the Boss uses this skill.
    *   The skill's cooldown is then set according to its definition (e.g., `bossInstance.skillCooldowns[skillId] = skill.cooldown`).
    *   The Boss's turn ends (no normal attack).

**Phase 3: No Skill Available**
1.  **Condition:** This phase executes if no skill was chosen in Phase 1 or Phase 2.
2.  **Action:** The Boss performs a normal attack or takes no action (based on game design).

**Skill Cooldown Management (for Regular Skills):**
*   Skill cooldowns are dynamic and managed on the Boss's battle instance (e.g., an object like `skillCooldowns: { skill_A: 0, skill_B: 2 }`).
*   When a regular skill is used, its entry in `skillCooldowns` is updated to its defined `cooldown` value.
*   At the end/start of each Boss turn, all active cooldowns in `skillCooldowns` are decremented by 1 (until they reach 0).
*   HP threshold-triggered skills do not interact with this `skillCooldowns` mechanism when triggered by HP.

---

## Testing Patterns

*
---
### [2025-05-10 22:33:00] - 统一效果函数返回值模式

**Context:** 在技能系统 ([`src/js/core/job-skills.js`](src/js/core/job-skills.js:1)) 中，多个负责应用具体技能效果的函数（如 `applyDamageEffects`, `applyBuffEffects`, `applySkillEffects` 等）需要一种标准化的方式来报告其操作是否成功。

**Pattern:**
所有原子或复合效果应用函数应统一返回一个包含以下结构的对象：
```javascript
{
  success: boolean, // 必需：表示操作是否成功。判定条件依据具体效果逻辑。
  message?: string, // 可选：提供操作结果的描述信息，用于日志或用户反馈。
  effects?: object  // 可选：包含效果应用具体细节的对象或数组，供日志记录或进一步处理。
}
```

**Rationale:**
*   **明确性:** `success` 标志提供了明确的操作结果状态。
*   **健壮性:** 调用方（如 `JobSkills.useSkill`）可以可靠地判断子操作是否成功，并据此决定后续逻辑。
*   **可维护性:** 标准化的返回接口使得添加新效果或修改现有效果时更容易遵循统一的错误处理和结果上报机制。
*   **日志与调试:** `message` 和 `effects` 字段有助于生成更详细、更有用的日志，方便调试和问题追踪。

**Implementation Example (Conceptual):**
```javascript
// 在 applyDamageEffects 函数中
function applyDamageEffects(character, template, teamMembers, monster) {
    // ... 伤害计算和应用逻辑 ...
    let damageDealt = calculateAndApplyDamage(...);
    
    if (damageDealt > 0) {
        return { 
            success: true, 
            message: `${character.name} 对 ${target.name} 造成了 ${damageDealt} 点伤害。`,
            effects: { type: 'damage', totalDamage: damageDealt, /* ...其他细节 */ }
        };
    } else if (no_valid_targets) {
         return { success: true, message: "没有有效的伤害目标。", effects: {type: 'damage', totalDamage: 0}}; // 逻辑上成功，因为没有目标可伤害
    }
    else {
        return { 
            success: false, 
            message: `对 ${target.name} 的伤害尝试失败。`,
            effects: { type: 'damage', totalDamage: 0 }
        };
    }
}
```
此模式已应用于 [`src/js/core/job-skills.js`](src/js/core/job-skills.js:1) 中的所有 `apply*Effects` 系列函数。

---
### [2025-05-10] - 战斗日志系统模式

**Context:** 为了统一战斗系统中的日志打印格式，分离调试信息和玩家可见信息，并提高日志系统的可维护性和扩展性，引入了 `BattleLogger` 模块。

**Pattern:**

**`BattleLogger` 对象/模块:**

*   **核心函数:** `BattleLogger.log(level, message, details = null, turn = null)`
    *   `level`: 字符串，定义日志级别。
        *   `BattleLogger.levels.CONSOLE_DETAIL`: 详细控制台调试日志，包含计算过程。
        *   `BattleLogger.levels.CONSOLE_INFO`: 一般控制台信息日志。
        *   `BattleLogger.levels.BATTLE_LOG`: 简洁的战斗界面日志，给玩家看。
    *   `message`: 字符串，主要的日志内容。
    *   `details`: 对象（可选），用于 `CONSOLE_DETAIL`，包含结构化的计算步骤或额外数据。
        *   示例: `{ calculation: "攻击力计算", steps: ["基础: 100", "加成: +20"], damageDealt: 30, currentHp: 70, maxHp: 100 }`
    *   `turn`: 数字（可选），当前战斗回合，用于控制台日志前缀 `[战斗][回合 X]`。

*   **内部逻辑:**
    1.  根据 `level` 确定输出目标和格式。
    2.  `CONSOLE_DETAIL`: 打印带回合前缀的消息和 `details` 中的详细步骤。
    3.  `CONSOLE_INFO`: 打印带回合前缀的消息，可选择性打印 `details` 中的简要信息。
    4.  `BATTLE_LOG`: 将 `message` 发送到UI更新函数 (如 `UI.addBattleLogMessage`)。
    5.  使用 `console.log` 输出到控制台。

**集成方式:**

*   替换现有战斗系统（如 [`src/js/core/battle.js`](src/js/core/battle.js:1)）中的 `Battle.logBattle()` 调用。
*   在关键战斗逻辑节点（如伤害计算、技能使用、Buff处理）插入对 `BattleLogger.log()` 的调用，根据需要选择合适的 `level` 并提供 `details`。

**可扩展性:**

*   **新级别:** 易于通过扩展 `BattleLogger.levels` 和 `switch` 语句添加。
*   **新输出:** 可以在 `switch` 语句中为特定级别添加新的输出逻辑（如发送到服务器）。
*   **格式化/过滤:** 可以引入专门的格式化函数或过滤配置。

**示例调用:**

```javascript
// 详细伤害计算日志 (控制台)
BattleLogger.log(
    BattleLogger.levels.CONSOLE_DETAIL,
    `${attacker.name} 对 ${target.name} 的伤害计算完成`,
    {
        calculation: "最终伤害应用",
        steps: [
            `原始计算伤害: ${calculatedDamage}`,
            `减伤后: ${finalDamage}`
        ],
        damageDealt: finalDamage,
        currentHp: target.currentStats.hp,
        maxHp: target.currentStats.maxHp
    }
);

// 玩家可见的伤害日志 (战斗界面)
BattleLogger.log(
    BattleLogger.levels.BATTLE_LOG,
    `${attacker.name} 对 ${target.name} 造成了 ${finalDamage} 点伤害。`
);

// Buff 应用日志 (控制台信息 + 战斗界面)
BattleLogger.log(
    BattleLogger.levels.CONSOLE_INFO,
    `${target.name} 获得了Buff: ${buff.name} (持续 ${buff.duration} 回合)`
);
BattleLogger.log(
    BattleLogger.levels.BATTLE_LOG,
    `${target.name} 获得了 ${buff.name} 效果。`
);
```

---
### [2025-05-11 19:42:00] - 群体目标处理与敌方队伍管理模式

**Context:** 解决战斗系统中群体技能（如 `all_enemies`, `all_allies`）无法正确作用于所有预期目标的问题。这需要引入对“敌方队伍”的明确管理，并重构目标选择和效果应用逻辑。

**Pattern:**

1.  **敌方队伍 (`enemyParty`) 管理 ([`src/js/core/battle.js`](src/js/core/battle.js:0)):**
    *   **数据结构:** 在 `Battle` 实例中维护一个 `enemyParty` 数组，其中包含当前战斗中所有独立的敌人对象。
    *   **初始化:** `Battle.startBattle` 负责根据遭遇配置（例如，怪物ID数组或更复杂的配置）创建并填充 `enemyParty`。每个敌人对象都拥有独立的状态（HP, buffs, etc.）。
    *   **替代单一怪物:** `enemyParty` 取代或补充了之前战斗系统对单个 `monster` 实例的依赖。

2.  **目标获取重构 ([`JobSkills.getTargets()`](src/js/core/job-skills.js:1080)):**
    *   **参数:** 函数接收施法者、技能、玩家队伍 (`playerTeam`) 和敌方队伍 (`enemyParty`)。
    *   **`targetType: "all_enemies"`:** 迭代 `enemyParty`，返回所有存活敌人对象的数组。
    *   **`targetType: "all_allies"`:** 迭代施法者所属的队伍（`playerTeam` 或 `enemyParty`，取决于施法者身份），返回所有存活友方单位的数组。
    *   **`targetType: "all_characters"`:** 合并 `playerTeam` 和 `enemyParty` 中所有存活单位并返回。
    *   **其他目标类型:** 确保能从正确的队伍（`playerTeam` 或 `enemyParty`）中选择目标。
    *   **返回值:** 始终返回一个目标对象数组（即使只有一个目标或没有目标）。

3.  **技能效果应用调整 (e.g., [`JobSkills.applyDamageEffects()`](src/js/core/job-skills.js:766)):**
    *   **参数:** 效果应用函数接收一个目标对象数组 (`targets`)。
    *   **迭代处理:** 函数内部必须遍历 `targets` 数组，对每个 `currentTarget`独立应用技能效果、计算结果、记录日志。
    *   **结果汇总:** 返回值应能反映对多个目标的操作结果（例如，一个包含每个目标效果详情的数组，以及一个总体成功状态）。参考“统一效果函数返回值模式”。

4.  **技能使用流程 ([`JobSkills.useSkill()`](src/js/core/job-skills.js:0), [`JobSkills.applySkillEffects()`](src/js/core/job-skills.js:0)):**
    *   `useSkill` 确保将从 `getTargets` 返回的目标数组正确传递给 `applySkillEffects`。
    *   `applySkillEffects` 在分发到具体的原子效果处理函数（如 `applyDamageEffects`）时，传递完整的目标数组。

**Rationale:**
*   **准确性:** 确保群体技能按预期作用于所有相关目标。
*   **灵活性:** 为更复杂的战斗遭遇（如多Boss战）和多样化的目标选择型技能（如随机X个敌人）奠定基础。
*   **可维护性:** 清晰分离了队伍管理、目标选择和效果应用逻辑。

**Example (Conceptual `getTargets` for `all_enemies`):**
```javascript
case "all_enemies":
  if (enemyParty && enemyParty.length > 0) {
    targets = enemyParty.filter(enemy => enemy && enemy.currentStats && enemy.currentStats.hp > 0);
  }
  break;
```

**Example (Conceptual `applyDamageEffects`):**
```javascript
function applyDamageEffects(caster, skillEffect, targets, /*...other params...*/) {
  const results = [];
  let overallSuccess = false;
  if (!targets || targets.length === 0) {
    return { success: true, message: "没有有效的伤害目标。", effects: [] }; // Or false depending on desired strictness
  }
  for (const currentTarget of targets) {
    // ... calculate damage for currentTarget ...
    // ... apply damage to currentTarget ...
    // ... log for currentTarget ...
    results.push({ targetId: currentTarget.id, damageDealt: calculatedDamage, hpAfter: currentTarget.currentStats.hp });
    overallSuccess = true; // Mark success if at least one target was affected
  }
  return { success: overallSuccess, effects: results };
}
```
---
### [2025-05-12 13:30:35] - 物品定义与加载模式

**Context:** 为了支持新的物品系统，需要一个标准化的物品定义结构和加载机制。

**Pattern:**

1.  **物品定义 (`src/data/items_definitions.json`):**
    *   一个JSON对象，键为物品的唯一ID (`itemId`)。
    *   每个物品ID对应一个物品定义对象，包含以下标准属性：
        *   `id` (string): 物品的唯一标识符 (与键相同)。
        *   `name` (string): 物品的显示名称。
        *   `type` (string): 物品的分类，例如 `ingredient`, `experience_material`, `ascension_material`, `special_item`。
        *   `description` (string, optional): 物品的描述文本。
        *   `icon` (string, optional): 物品图标的路径或标识符。
        *   `stackable` (boolean): 物品是否可堆叠 (默认为 `true`)。
        *   `value` (number, optional): 物品的某种价值，如售价 (如果未来重新引入商店或用于其他目的)。
    *   特定类型的物品可以有额外属性：
        *   `experience_material`:
            *   `exp` (number): 该经验材料提供的经验值。
        *   其他类型可根据需要扩展。

    **示例 (`src/data/items_definitions.json`):**
    ```json
    {
      "exp_small": {
        "id": "exp_small",
        "name": "经验上升(小)",
        "type": "experience_material",
        "description": "少量提升角色经验。",
        "icon": "path/to/exp_small_icon.png",
        "stackable": true,
        "exp": 10000
      },
      "iron_ore": {
        "id": "iron_ore",
        "name": "铁矿石",
        "type": "ingredient",
        "description": "基础的锻造材料。",
        "icon": "path/to/iron_ore_icon.png",
        "stackable": true
      }
      // ...更多物品定义
    }
    ```

2.  **物品加载 (`Item.loadItemDefinitions` in `src/js/core/item.js`):**
    *   一个静态方法，在游戏初始化时或首次需要物品数据时调用。
    *   负责通过 `fetch` 或类似机制异步加载 [`src/data/items_definitions.json`](src/data/items_definitions.json)。
    *   加载成功后，将解析的JSON对象存储在 `Item` 类的一个静态属性中，例如 `Item.definitions`。
    *   应包含错误处理逻辑，以应对文件加载失败或JSON格式错误的情况。

3.  **物品创建 (`Item.createItem` in `src/js/core/item.js`):**
    *   接收 `itemId` 和可选的 `quantity` 作为参数。
    *   从 `Item.definitions[itemId]` 获取物品模板。
    *   如果找不到模板，则返回 `null` 或抛出错误。
    *   基于模板创建一个新的物品实例，复制所有属性。
    *   如果提供了 `quantity`，则设置物品实例的 `quantity` 属性。
    *   返回创建的物品实例。

---
### [2025-05-12 13:30:35] - 怪物掉落物定义模式

**Context:** 为怪物和Boss定义其可能掉落的物品及其概率和数量。

**Pattern:**

1.  **怪物数据结构 (e.g., in `src/data/monsters.json`, `src/data/bosses.json`):**
    *   每个怪物/Boss对象中增加一个 `drops` 数组。
    *   `drops` 数组可以为空（表示不掉落任何特定物品）或包含一个或多个掉落项对象。

2.  **掉落项对象结构:**
    *   `itemId` (string): 掉落物品的ID，必须与 [`src/data/items_definitions.json`](src/data/items_definitions.json) 中定义的物品ID对应。
    *   `chance` (number): 物品的掉落概率，范围 0 到 1 (例如, 0.75 表示 75% 的概率)。
    *   `quantityMin` (number): 如果掉落，物品数量的最小值（至少为1）。
    *   `quantityMax` (number): 如果掉落，物品数量的最大值。如果 `quantityMin` 等于 `quantityMax`，则数量固定。

    **示例 (在怪物定义中):**
    ```json
    {
      "id": "goblin_warrior",
      "name": "哥布林战士",
      // ...其他怪物属性...
      "drops": [
        { "itemId": "gold_coin", "chance": 0.8, "quantityMin": 5, "quantityMax": 15 },
        { "itemId": "broken_sword_hilt", "chance": 0.25, "quantityMin": 1, "quantityMax": 1 },
        { "itemId": "exp_small", "chance": 0.1, "quantityMin": 1, "quantityMax": 2 }
      ]
    }
    ```

3.  **掉落处理逻辑 (e.g., `Dungeon.processRewards` in `src/js/core/dungeon.js`):**
    *   当一个怪物被击败时，遍历其 `drops` 数组。
    *   对于每个掉落项：
        *   生成一个 0 到 1 之间的随机数。
        *   如果随机数小于或等于 `itemDrop.chance`，则该物品掉落。
        *   如果掉落，则在 `itemDrop.quantityMin` 和 `itemDrop.quantityMax` (包含两者) 之间随机确定一个整数作为掉落数量。
        *   使用 `Inventory.addItem(itemDrop.itemId, determinedQuantity)` 将掉落的物品添加到玩家库存。

**重要备注 (针对新设计的物品，如经验材料):**
[2025-05-12 16:14:00] - 上述“怪物掉落物定义模式”描述的是一种通用的怪物直接掉落物品的机制。然而，根据最新设计决策，**新设计的物品，特别是经验材料 (`exp_small`, `exp_medium`, `exp_large`) 以及其他新分类的占位符物品，将不会使用此直接掉落机制。** 这些新物品将**仅通过**地下城宝箱的 `chestDrops` 机制获得。因此，在为这些新物品配置掉落时，应修改位于 [`src/js/core/dungeon.js`](src/js/core/dungeon.js) 中各个 `Dungeon.dungeons.<dungeon_id>.chestDrops` 对象的定义，而不是怪物的 `drops` 数组。
---
### [2025-05-12 16:17:00] - 地下城宝箱掉落物定义模式 (chestDrops)

**Context:** 定义地下城中宝箱开启时可能掉落的物品及其概率。这是新设计的物品（如经验材料 `exp_small`, `exp_medium`, `exp_large`）的主要获取途径。

**Pattern:**

1.  **位置:** 定义在 [`src/js/core/dungeon.js`](src/js/core/dungeon.js) 文件中，作为各个地下城对象 `Dungeon.dungeons.<dungeon_id>` 的一个属性，名为 `chestDrops`。

2.  **`chestDrops` 结构:**
    *   是一个对象，其键是物品的唯一ID (`itemId`)，这些ID必须与 [`src/data/items_definitions.json`](src/data/items_definitions.json) 中定义的物品ID对应。
    *   每个 `itemId` 键对应的值是一个数字，代表该物品从宝箱中掉落的概率（通常是一个0到1之间的值，但具体实现可能依赖于总概率的归一化）。

    **示例 (在地下城定义中):**
    ```javascript
    // In src/js/core/dungeon.js
    // Dungeon.dungeons.beginner_dungeon = {
    //   id: "beginner_dungeon",
    //   name: "初心者の洞窟",
    //   // ... other dungeon properties ...
    //   chestDrops: {
    //     "exp_small": 0.5, // 50% 概率掉落小型经验材料
    //     "potion_minor_heal": 0.3, // 30% 概率掉落小型治疗药水
    //     "gold_pouch_small": 0.2, // 20% 概率掉落小钱袋
    //     "exp_medium": 0.1 // 10% 概率掉落中型经验材料
    //   },
    //   // ...
    // };
    ```

3.  **掉落处理逻辑 (推测):**
    *   当玩家在地下城中开启宝箱时（通常在战斗胜利后，根据怪物掉落宝箱的数量决定开启次数）。
    *   系统会根据对应地下城的 `chestDrops` 定义来抽取物品。
    *   具体的抽取逻辑可能涉及：
        *   遍历 `chestDrops` 中的所有物品。
        *   为每个物品生成随机数，并与物品的 `rate` (概率) 比较，以决定是否掉落该物品。
        *   或者，所有物品的概率相加，然后生成一个随机数落入某个区间来决定掉落哪个物品（类似权重抽奖）。
        *   掉落数量通常为1，除非 `chestDrops` 的结构支持定义数量（当前示例仅为概率）。
    *   **注意:** 此任务不涉及修改此处理逻辑，仅涉及更新 `chestDrops` 的内容。

**适用性:**
*   此模式是新设计的物品（如 `exp_small`, `exp_medium`, `exp_large` 和其他来自 [`src/data/items_definitions.json`](src/data/items_definitions.json) 的新分类占位符物品）的**唯一指定获取途径**。
*   `code` 模式在实现这些新物品的掉落时，应**仅修改**各个地下城的 `chestDrops` 对象。