# 角色数据结构

{
    "id": "r_1746709080308_1",
    "name": "欧忒耳佩",
    "type": "special",
    "attribute": "wind",
    "level": 1,                                    // 角色当前等级
    "exp": 0,                                      // 角色当前等级的经验
    "nextLevelExp": 100,                           // 角色下一级的经验需求
    "skills": [
        "windBlast"
    ],
    "baseStats": {                                 // 角色当前等级的基础属性，不包括装备和多重获取的加成
        "hp": 137,                                 //  hp应该和maxHp保持一致
        "maxHp": 1820,
        "attack": 973,                              //  attack应该和maxAttack保持一致
        "maxAttack": 5187,
        "defense": 10,
        "critRate": 0.03,
        "critDamage": 1.3,
        "daRate": 0.06,
        "taRate": 0.03
    },
    "weaponBonusStats": {                           //武器盘加成后的当前等级属性
        "hp": 137,                                       //  hp应该和maxHp保持一致   
        "maxHp": 1820,
        "attack": 973,                                     //  attack应该和maxAttack保持一致
        "maxAttack": 5187,
        "defense": 10,
        "critRate": 0.03,
        "critDamage": 1.3,
        "daRate": 0.06,
        "taRate": 0.03
    },
    "multiBonusStats": {                               // 纯粹的增量，不包括武器盘加成
        "hp": 18,
        "attack": 51,
        "defense": 1,
        "maxHp": 0
    },
    "currentStats": {                                  // 进入地下城后的当前属性快照，包括武器盘加成和多重获取和技能状态等的加成
        "hp": 137,                                      // 战斗中实时HP
        "maxHp": 1820,                                  // 战斗中实时HP上限
        "attack": 973,                                  // 战斗中实时攻击力
        "maxAttack": 5187,                               //没有使用场景
        "defense": 10,                                   //战斗中实时防御力
        "critRate": 0.03,                                 // 战斗中实时暴击率
        "critDamage": 1.3,                                 // 战斗中实时暴击伤害
        "daRate": 0.06,                                    // 战斗中实时连击率
        "taRate": 0.03                                    // 战斗中实时三连击率
    },
    "growthRates": {                                   // 取消成长率，每次升级提高的属性 用json数据里的 最大HP/ATTack 和等级进行计算
        "hp": 12,
        "attack": 2,
        "defense": 1,
    },
    "isMainCharacter": false,     
    "isRecruited": true,
    "rarity": "rare",
    "maxLevel": 60,                                         // 根据稀有度不同，最大等级不同，角色等级达到最大后，无法继续升级
    "nextLevelExp": 100,                                    // 和上面的重复
    "nextAttackCritical": false,
    "shield": 0,                                            // 战斗中实时护盾值
    "stats": {
        "totalDamage": 0,
        "totalHealing": 0,
        "mvpCount": 0,
        "battlesParticipated": 0
    },
    "job": null,
    "multiCount": 2
}