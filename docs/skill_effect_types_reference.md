# 技能子效果类型说明

本文档列出并解释了在项目技能数据 (`src/data/*.json`) 中实际使用的所有子效果类型 (`effects[].type`)。

## 直接效果型

### `damage`
-   **功能**: 对目标造成直接伤害。伤害值通常基于攻击者的攻击力、技能的倍率 (`multiplier` 或 `minMultiplier`/`maxMultiplier`)，并可能受元素属性 (`element`)、暴击、目标防御等多种因素影响。
-   **处理逻辑**: 主要由 `JobSkills.applyDamageEffects()` 处理。该方法会进一步调用 `Battle.applyDamageToTarget()` 来计算最终伤害并更新目标状态。

### `heal`
-   **功能**: 为目标恢复生命值。治疗量可以是固定值 (`value`) 或基于目标最大生命值的百分比 (`healType: "percentageMaxHp"`)。
-   **处理逻辑**: 主要由 `JobSkills.applyHealEffects()` 处理。

### `multi_attack`
-   **功能**: 对目标进行多次独立的伤害判定。通常包含 `count` (攻击次数) 和 `multiplier` (每次攻击的伤害倍率) 或 `multiplierPerHit` 属性。
-   **处理逻辑**: 此类型通常在 `JobSkills.applyDamageEffects()` 内部通过循环处理多次伤害计算，或在 `JobSkills.applyDamageAndDebuffEffects()` 等复合效果函数中处理。`ssr_skill.json` 中也用 `multiHitDamage` 表示类似概念。

### `hpCostPercentageCurrent`
-   **功能**: 消耗施法者当前生命值或最大生命值一定百分比的HP作为技能代价。通过 `value` (百分比) 和可选的 `basedOn: "maxHp"` 来定义。
-   **处理逻辑**: 在 `JobSkills.applySkillEffects()` 中有专门的前置逻辑来处理此消耗，在应用其他效果之前执行。

## Buff/Debuff 型

以下效果通常由 `BuffSystem` 定义和管理，通过 `JobSkills.applyBuffEffects()`（增益）或 `JobSkills.applyDebuffEffects()`（减益）应用到目标身上。

### `attackUp`
-   **功能**: 提升目标的攻击力。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.attackUp` 定义。

### `defenseUp`
-   **功能**: 提升目标的防御力。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.defenseUp` 定义。

### `attackDown`
-   **功能**: 降低目标的攻击力。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.attackDown` 定义。

### `defenseDown`
-   **功能**: 降低目标的防御力。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.defenseDown` 定义。

### `missRate`
-   **功能**: 降低目标的攻击命中率。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.missRate` 定义。

### `daBoost`
-   **功能**: 提升目标的双重攻击（Double Attack）触发概率。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.daBoost` 定义。

### `taBoost`
-   **功能**: 提升目标的三重攻击（Triple Attack）触发概率。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.taBoost` 定义。

### `daDown`
-   **功能**: 降低目标的双重攻击触发概率。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.daDown` 定义。

### `taDown`
-   **功能**: 降低目标的三重攻击触发概率。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.taDown` 定义。

### `critRateUp`
-   **功能**: 提升目标的暴击率 (Critical Hit Rate)。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.critRateUp` 定义。

### `damageReduction`
-   **功能**: 减少目标受到的伤害。可能指定特定属性的伤害减免（通过 `elementType` 参数）或所有伤害减免。
-   **处理逻辑**: 通用伤害减免由 `BuffSystem.buffTypes.allDamageTakenReduction` 定义。特定属性减免可能通过 `elementalResistance` 实现，或作为此效果的参数。

### `dot`
-   **功能**: 对目标施加持续伤害效果（Damage Over Time），如中毒，每回合损失一定生命值。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.dot` 定义。

### `evade`
-   **功能**: 使目标能够回避攻击。可能是完全回避所有伤害 (`evasionAll`) 或特定次数的回避。
-   **处理逻辑**: 完全回避由 `BuffSystem.buffTypes.evasionAll` 定义。`job-skills-templates.json` 中也使用 `evade`，`sr_skills.json` 中使用 `dodge`。

### `invincible`
-   **功能**: 使目标在一定持续时间内或定次数内完全免疫伤害。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.invincible` 定义。

### `stun`
-   **功能**: 使目标眩晕，无法行动。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.stun` 定义。

### `staminaUp`
-   **功能**: 浑身效果，通常指目标当前生命值越高，获得的攻击或其他属性增益越大。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.staminaUp` 定义。

### `enmityUp`
-   **功能**: 背水效果，通常指目标当前生命值越低，获得的攻击或其他属性增益越大。也用于直接提升仇恨值。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.enmityUp` 定义（用于背水）。直接的仇恨提升也使用此类型，如 `BuffSystem.buffTypes.threatUp`。

### `regen`
-   **功能**: 使目标每回合恢复一定量的生命值。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.regen` 定义。

### `cover`
-   **功能**: 使施法者为队友援护，代替其承受单体攻击。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.cover` 定义。

### `damageCap`
-   **功能**: 限制角色受到的伤害上限。
-   **处理逻辑**: 

### `damageCapUp`
-   **功能**: 提升目标造成伤害的上限。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.damageCapUp` 定义。

### `skillDamageCapUp`
-   **功能**: 提升目标技能造成伤害的上限。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.skillDamageCapUp` 定义。

### `elementalDamageCap`
-   **功能**: 限制目标受到的特定元素伤害的上限值。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.elementalDamageCap` 定义。

### `shield`
-   **功能**: 为目标提供一个可以吸收一定量伤害的护盾。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.shield` 定义。

### `elementConversion`
-   **功能**: 将目标受到的伤害转换为特定的元素属性。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.damageElementConversion` 定义。

### `elementalResistance`
-   **功能**: 提升目标对特定元素伤害的抗性，从而减少受到的该元素伤害。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.elementalResistance` 定义。

### `threatUp`
-   **功能**: 提升目标的敌对心（仇恨值），使其更容易成为敌人的攻击目标。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.threatUp` 定义。

### `threatDown`
-   **功能**: 降低目标的敌对心，使其更不容易成为敌人的攻击目标。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.threatDown` 定义。

### `exAttackUp`
-   **功能**: 提升目标的EX攻击力（通常是一个独立的攻击力乘区）。
-   **处理逻辑**: 在 `sr_skills.json` 中使用。`BuffSystem` 中没有直接名为 `exAttackUp` 的类型，但其效果类似于攻击增益，可能在属性计算时作为独立乘区处理。

### `echo`
-   **功能**: 使目标的普通攻击或技能攻击追加一次或多次额外伤害（追击）。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.echo` 定义。

### `debuffImmunity`
-   **功能**: 使目标免疫所有或特定类型的负面效果（弱体）。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.debuffImmunity` (通用弱体免疫) 和 `BuffSystem.buffTypes.statusImmunity` (特定状态免疫) 定义。

### `debuffResistOnce`
-   **功能**: 使目标能够抵抗下一次受到的负面效果，消耗后失效。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.debuffResistOnce` 定义。

### `extraAttackTurn`
-   **功能**: 使目标在本回合内获得额外的攻击或行动机会。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.extraAttackTurn` 定义。

### `directDamageValueUp`
-   **功能**: 提升目标每次攻击造成的原始伤害固定数值。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.directDamageValueUp` 定义。

### `guts`
-   **功能**: 根性效果，当目标受到致命伤害时，能以1点HP存活下来，通常有次数限制。
-   **处理逻辑**: 由 `BuffSystem.buffTypes.guts` 定义。

## 功能型/逻辑型

### `dispel`
-   **功能**: 驱散目标身上的增益效果（如果目标是敌人）或减益效果（如果目标是友方）。可指定驱散数量 (`count`) 和类型 (`dispelPositive`: true为增益，false为减益)。
-   **处理逻辑**: 主要由 `JobSkills.applyDispelEffects()` 处理，其核心是调用 `BuffSystem.dispelBuffs()`。

### `dispelAll`
-   **功能**: 驱散目标身上所有的某种类型的效果（通常是敌方的所有增益）。
-   **处理逻辑**: 类似 `dispel`，但通常 `count` 值会非常大以确保全部驱散。

### `cleanse`
-   **功能**: 净化目标身上的减益效果。与 `dispel` 类似，但通常特指移除负面状态。
-   **处理逻辑**: 在 `JobSkills.applyDispelEffects()` 中通过设置 `dispelPositive: false` 来实现对减益的驱散。

### `revive`
-   **功能**: 复活已阵亡的队友，并恢复其一定百分比 (`hpPercentage` 或 `hpRatio`) 的生命值。
-   **处理逻辑**: 主要由 `JobSkills.applyReviveEffects()` 处理。

### `ignoreDebuff`
-   **功能**: 使施法者无视特定类型的减益效果（例如 `missRate`）。
-   **处理逻辑**: 通常作为被动效果，在相关的计算逻辑（如命中判定）中检查此状态。

### `conditional_heal`
-   **功能**: 根据特定条件对目标进行治疗，例如当目标生命值低于一定百分比时 (`condition: "hp_below_50"`)。
-   **处理逻辑**: 在 `JobSkills.applyHealEffects()` 或通用的效果处理逻辑中，根据 `condition` 字段判断是否执行治疗。

### `castSkill`
-   **功能**: 触发并释放另一个预定义的技能。通常在其父效果（如 `proc`）的 `triggeredEffects` 中定义，包含要释放的 `skillId`。
-   **处理逻辑**: 由 `JobSkills.applyTriggerSkillEffect()` 处理，该方法会进一步调用 `JobSkills.useSkill()` 来执行被触发的技能。

## 容器/触发型

这些类型本身不直接产生效果，而是作为容器或定义了触发条件，其内部的子效果才是实际执行的内容。

### `proc`
-   **功能**: 定义一个有特定概率 (`chance`) 在满足特定条件时（如 `onAttack`, `onDamagedByEnemy`, `onTurnStart`, `onTurnEndHpBelow25Percent`, `onTripleAttack`）触发一组效果 (`triggeredEffects` 或 `effect`) 的机制。
-   **处理逻辑**: 由战斗系统的相应阶段（如攻击结算、回合开始/结束）检查触发条件和概率，若满足则执行其内部定义的效果。`JobSkills.applySkillEffects()` 可能会处理一些被动 `proc` 的初始化。

### `endOfTurn`
-   **功能**: 定义在回合结束时自动触发的一组效果 (`effect`)。
-   **处理逻辑**: 由战斗系统的回合结束阶段处理，执行其内部定义的效果。

### `applyBuffPackage`
-   **功能**: 应用一个预定义的“效果包”（Buff Package），该效果包本身包含多个子Buff或Debuff。效果包有自己的名称 (`buffName`)、持续时间、是否可驱散等属性，其包含的具体效果在 `buffs` 或 `buffsPerStack` 数组中定义。
-   **处理逻辑**: 主要由 `BuffSystem.applyBuffPackage()` 处理。该方法会先应用效果包本身作为一个状态，然后根据包的定义（包括层数 `currentStacks` 和每层效果 `buffsPerStack`）来应用其包含的各个子效果。子效果由 `BuffSystem.applySubBuffsFromPackage()` 应用。