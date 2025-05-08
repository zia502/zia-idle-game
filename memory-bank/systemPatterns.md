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

**Standardized `effectType` List and Definitions:**

*   **`damage`**: 技能的主要效果是造成直接伤害。
    *   *示例*：对目标造成100点火焰伤害。
*   **`buff`**: 技能的主要效果是为友方目标施加增益状态。
    *   *示例*：提升目标攻击力20%，持续3回合。
*   **`debuff`**: 技能的主要效果是为敌方目标施加减益状态。
    *   *示例*：降低目标防御力15%，持续2回合。
*   **`heal`**: 技能的主要效果是恢复友方目标的生命值。
    *   *示例*：为目标恢复500点生命值。
*   **`dispel`**: 技能的主要效果是移除目标身上的一个或多个状态效果（可以是增益或减益）。
    *   *示例*：驱散目标身上的所有减益效果。
*   **`multi_effect`**: 技能包含多种不同类型的核心效果，这些效果在技能的 `effects` 数组中分别定义。顶层的 `effectType` 作为一个概括。
    *   *示例*：一个技能同时造成伤害并为自身施加一个buff。
*   **`passive`**: 技能的效果是被动触发的，通常在满足特定条件时自动生效，或者提供持续性的属性加成，不需要主动施放。
    *   *示例*：当生命值低于30%时，提升自身防御力。
*   **`trigger`**: 技能的效果是在特定事件发生时触发的。这与 `passive` 类似，但更强调事件驱动。
    *   *示例*：当受到攻击时，有概率反弹部分伤害。
## Testing Patterns

*