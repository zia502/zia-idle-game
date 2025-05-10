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