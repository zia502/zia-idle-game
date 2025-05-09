# Zia 地下城冒险游戏

## 项目简介
Zia 是一个纯文字的地下城冒险游戏，玩家可以组队探索地下城，收集装备，培养角色，挑战各种怪物和boss。游戏专注于团队构建、武器收集和战略战斗，通过纯文本界面为玩家提供沉浸式的冒险体验。

## 功能特点
- 角色招募与队伍组建系统
- 多样化的角色类型和属性
- 丰富的武器收集与升级机制
- 多样化的地下城探索
- 自动战斗系统
- 商店交易系统
- 装备突破与技能升级
- 数据持久化保存

## 安装指南
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 使用说明
1. 创建或选择主角
2. 在酒馆招募队友组建队伍
3. 配置武器盘，增强队伍实力
4. 选择地下城进行冒险
5. 战胜怪物和boss获得经验和掉落物
6. 通过商店交易获取更强力的武器
7. 提升角色等级和武器性能

## 游戏机制详解
### 角色系统
- 主角：可转职、升职，必须在队伍中，主角可以享受所有类型/属性的加成buff
- 主角职业需要升级，一个职业最高20级，升满后解锁2阶职业。每个职业有2个高阶职业的分支，最高3阶。考虑初始职业6个，二阶12个，3阶12个，默认每个职业1级都有1个特性，10级解锁第二个，20级解锁第3个。
- 角色防御力和速度不会根据等级变化，只有HP和攻击力会
- 队友：通过酒馆招募，具有不同属性和特性
- 类型：攻击、防御、特殊、治疗
- 属性：火、水、风、土、光、暗
- 角色和主角都有特性traits，一个角色最多3格特性。稀有角色1个特性，史诗2个，传奇3个

### 特性系统
- 角色和主角都有特性。主角特性跟随自己的职业，可以有4个特性，主角可以自由选择所有职业学习过的特性，但是最多只能装备3个本系的特性，就是第4个特性必须是非本初始职业和它后面的高阶所学到的
- 角色在65级能解锁第二个特性，90级第3个，所以稀有角色只能有1个特性，史诗只能有2个，传奇可以学3个
- 特性分主动和被动，主动有CD
- 特性会给Buff和debuff，有回合数概念
- buff和debuff可以被清除，清除顺序是先清除最新的一个

### 武器系统
- 武器盘：每支队伍最多可装备10把武器
- 武器属性：攻击力、生命值和属性（火、水、风、土、光、暗）
- 升级机制：提高武器基础属性
- 突破系统：提高武器等级上限，0突破40级，1突破60级，2突破80级，3突破100级，4突150级。 4突需要副本特殊材料而不是同一武器
- 技能系统：每把武器可拥有最多3个技能栏，0-2突破只有2格技能，3突破会追加一个技能。每个武器有固定技能，但是效果量随机，比如 A武器有HP提高技能，范围是5%-10%,突破时只会保留原武器的技能。技能可以升级，升级需要对应属性的升级书材料，在不同副本掉落，比如火属性武器只能用火武器升级书升级技能，技能最大15级，0-3突10级，4突15级
- 背水和浑身：
    背水是血越少攻击力越高，Modifier 是效果值，比如 10%,建议范围[1-20%]
    HP Ratio = 1 - (Current HP / Max HP)
    Enmity Strength = Modifier * ((1 + 2 * HP Ratio) * HP Ratio)
    浑身是血越多攻击力越高, Coefficient 是效果值，HP小于25%时，不提供 攻击力加成. 建议范围[1-20]
    [25 ≤ HP Percentage ≤ 100]
    HP Percentage = (Current HP / Max HP) * 100
    Stamina Strength = (HP Percentage / (56 - (Coefficient + (0.4))))^2.9 + 2.1

    ATK = 攻击力 * （1+ Enmity/Stamina %）
- 武器技能一览：
    - X属性攻击力上升Y%
    - X属性攻击力EX上升Y%
    - X属性暴击率上升Y%
    - X属性暴击伤害上升Y%
    - X属性HP上升Y%
    - X属性防御力上升Y%
    - X属性背水上升Y%
    - X属性浑身上升Y%
    - X属性伤害增加Y
    - 对X属性伤害提升Y%
    - X属性DA概率提升Y%
    - X属性TA概率提升Y%
    - X属性技能伤害增加Y
    - X属性技能伤害上限增加Y%
    - X属性攻击伤害上限增加Y%
    - X属性伤害上限增加Y%

### 地下城系统
- 多样的地下城关卡
- 随机生成的怪物和boss，怪物boss也有自身属性
- 每个地下城有多个小boss和一个大boss
- 小boss随机出现，数量可配置
- 只有击败所有小boss后，大boss才会出现
- 战利品掉落系统
- 经验值获取系统

### 商店系统
- 可使用掉落物交换武器
- 可以出售武器，换取金币

### 旅馆系统
- 玩家可以恢复全部HP和状态并且复活，不要钱
- 食物系统，玩家可以选择购买菜单上的食物，给队伍一段时间的buff，比如8小时的buff，提高火属性角色攻击力5%，时间以服务器时间为准

### 存档系统
- 游戏存档默认保存浏览器，用户可以另存为到本地，也可以载入存档，存档可以简单加密

### 战斗系统
- BUFF系统：相同名字的BUFF或DEBUFF可以累加效果,比如攻击力上升10%和攻击力上升20%。会累加成30%，回合数无法累加，以最后施放的BUFF持续回合为准。
    - 有可以被驱散的BUFF和不可驱散BUFF
    - 如果一个特殊BUFF包含多个效果，则独立计算BUFF，不会和其他BUFF累加：比如我有一个攻击力上升10%BUFF还有一个狂暴(也有攻击力上升)，则狂暴不会被其他攻击力上升累加，但是第一个bUFF可以。最后计算攻击力时也是相加而不是相乘
- 普通攻击基础命中率为100%，技能必定命中
- 完整一回合= 回合开始触发事件 + 角色按顺序依次执行技能+ 角色普通攻击+ 怪物执行技能 + 回合结束触发事件
- DA和TA: 游戏中默认普通攻击为单击，DA代表double attack,TA代表triple attack。
- 玩家组成队伍后可以选择副本进入，会一直刷这个地下城，会有地下城战斗次数统计，和每个怪物boss的简单战斗记录，战斗信息需要实时打印，交战记录可以省略成类似"遇到了XX怪物/BOSS，经历N回合后，战胜了XX，本场战斗MVP:XX角色,共造成XX伤害，占比XX%"
- 战斗可以有简单的MVP评分系统
- 每个角色可以看到历史MVP记录，和总伤害统计，地下城次数
- 队伍全灭后自动返回旅馆，等待玩家休息并复活
- 每次打完地下城会有小回复，也要打印日志，恢复各角色25%HP
- 战斗使用回合制，先统计所有角色的特性是否触发，然后速度高的先使用特性，然后角色按速度先后进行普通攻击，再变成怪物回合 开始使用特性，再普通攻击。被动特性默认直接触发。主动特性可以触发多个。
- 存在全局的角色攻击伤害上限/技能伤害上限和 攻击/防御下降上限，角色攻击伤害上限为一次99999（普通攻击）技能伤害上限为199999（主动和被动触发）， 攻击和防御下降  最多50%，比如如果boss防御力是80，那最多只能降低到40
- 伤害公式为  造成伤害=目标攻击力/10 *(0.95~1.05随机值)*（1+属性克制百分比）*（如果暴击*1.5）*（1+暴击伤害增加%，如果触发暴击）*（1+对被攻击目标属性伤害提升%）
- 受到伤害公式为  受到伤害= 造成伤害 / （1+防御力%）*（1-受到伤害降低%）*（1-属性伤害减轻%）
- 角色攻击力计算方法为  攻击力= 角色自身攻击力 *（1+武器盘攻击力%提升值）* （1+攻击力BUFF%提升值）*（1+浑身  Stamina Strength）*（1+背水 Enmity Strength）*（1+EX攻击力%提升值）+ 伤害上升总合
- 有利属性攻击: 造成约1.5倍的伤害
- 不利属性攻击: 造成约0.75倍（即减少25%）的伤害

## BUFF词缀
- 暴击率上升
- 暴击伤害增加
- 攻击力上升
- 防御力上升
- 对X属性伤害提升
- 受到伤害降低
- 属性伤害减轻
- 浑身上升
- 背水上升
- 敌对心上升
- 攻击伤害上限提高
- 技能伤害上限提高
- 伤害上升
- EX攻击力上升
- DA上升
- TA上升
- HP回复
- 伤害转为X属性

## 技术栈
- HTML5/CSS3 - 基础页面结构和样式
- JavaScript (ES6+) - 游戏核心逻辑

## 贡献指南
欢迎贡献代码或提出建议！请按照以下步骤：
1. Fork 此仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 许可证
本项目采用 MIT 许可证 - 详情请参阅 LICENSE 文件。

## 联系方式
GitHub: [zia502](https://github.com/zia502)