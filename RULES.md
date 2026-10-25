# 机制规则与枪位职责

本项目的 0..2 能力分值是作者手工制定的机制比较，不是统计胜率、官方定位或当前补丁强度。`reviewedPatch: null` 表示尚未校准当前版本。新增英雄的覆盖率表示有规则可计算，不表示预测已获验证。

## 资料来源与新增覆盖

参考 [社区英雄资料快照](https://github.com/0xThiagoAmaral/deadlock-open-assets/blob/main/assets/game/heroes.json)（目录记录日期 2026-06-20）。[Valve 更新记录](https://forums.playdeadlock.com/threads/01-30-2026-update.102822/)中包含 Apollo、Celeste、Graves 的技能调整；这些历史材料不能证明当前数值或最优出装。

| 英雄 | 本次机制假设 | 默认枪位 |
| --- | --- | --- |
| Apollo | 位移、反击及近身爆发 | 否 |
| Celeste | 远程技能消耗、控制及范围输出 | 否 |
| Graves | 召唤、范围压制及控制 | 否 |
| Paige | 保护、控制及支援 | 否 |
| The Doorman | 传送、范围控制及隔离 | 否 |

以上默认值只代表分析时选用的路线，尤其 Celeste / Graves 等可以因武器出装改变职责。预览和 HUD 都提供按英雄调整的入口。续航维度包含保护和生存支持，并非所有得分英雄都拥有治疗技能；装备重伤目标由独立的 healing 标签决定。

## 如何计算

- 持续输出、先手、硬控、前排、清线按 `tools/make-data.py` 中的启发式阈值检查。资料不足时不推断整队这些能力的缺口。
- 枪位独立计算：默认由 Haze、Wraith、Vindicta、Infernus、McGinnis、Mirage、Warden 承担。用户本局覆盖优先。未知职责不当作“没有枪位”。
- 在六人职责均明确时，从零枪位补到至少一位提供 3 分规则收益；多堆枪位不重复加分。这是可调整的设计权重，不是实测胜率加成。
- 逐一将你当前英雄替换为已解锁、未占用、未排除且满足本局可选列表的候选。比较补缺口、机制应对、已确认双人路搭配和熟练度的变化。
- 收益达到 0.5 才显示为换人推荐。完整阵容资料不足、没有英雄池或没有可评估候选时，明确说明原因，绝不输出“评估后建议保留”。资料覆盖不足时仍可显示已有证据支持的对线或装备提示。
- “保留”只表示已评估候选没有达到阈值，不意味着阵容完美；缺口会继续显示，未覆盖候选会单独告知。

## 扩展规则

编辑 `tools/make-data.py` 的英雄能力、威胁标签或 `gun_cores` 后，运行 `python tools/make-data.py` 生成 `src/data.js`，再运行 `npm test`。不要只手改生成文件。真实版本校准应记录补丁、来源及验证方法，不能仅为提高覆盖率填写猜测的统计数据。


## Kelvin 控制分类修正（0.2.0）

依据 [Kelvin 技能描述](https://www.deadlock.io/en/heroes/kelvin)（2026-10-25 查阅）：Frost Grenade 减速，Arctic Beam 降低移速及射速，Frozen Shelter 提供隔离/封路及减速。它们不等同于眩晕、定身或打断。Kelvin 的 `hardControl=0`、`softControl=2`，威胁标签为 healing/slow/isolation；不再用于硬控类物品触发推断。

其他英雄原有控制分改为 `hardControl` 启发式维度，仍需逐一核对技能与补丁。定身、位移、眩晕的具体效果也不相同，因此本次删除了“控制分高就能针对持续施法”的评分项。不会声称这次已经完成所有英雄机制审计。

## 统计数据与 counter 指标（0.2.0）

公开接口定义：[OpenAPI](https://api.deadlock-api.com/openapi.json)，同时核对 [公开客户端 schema](https://github.com/deadlock-api/openapi-clients/blob/master/openapi.json)。

- `/v1/assets/heroes`：名称、游戏数字 ID、内部名称及可选状态。保留现有 profile 的字符串 ID；新英雄无机制数据时保留 null，不编造数值。
- `/v1/analytics/hero-stats?bucket=no_bucket`：使用 wins / matches。
- `/v1/analytics/hero-counter-stats?same_lane_filter=false`：hero_id 对 enemy_hero_id 的整场 wins / matches_played，方向不能反转。
- `/v1/analytics/hero-synergy-stats?same_lane_filter=false`：同队两英雄的整场 wins / matches_played；交换双方 ID 不重复计样本。

所有统计使用同一日期、段位、模式筛选。显示实际样本数与二项 Wilson 95% 区间；重复玩家、样本采集偏差和配对相关性未被这个简单区间完全刻画。低于 100 场的配对不参与推荐，统计快照超过 7 天暂停推荐。数据没有自动更新，需重新运行同步命令。

设 A、B 总体胜率为 pA、pB，先计算基线预期 `E = pA*(1-pB) / (pA*(1-pB)+(1-pA)*pB)`，p 限制在 0.01..0.99 以防数值退化。单对 counter 指标为 `(实际对阵胜率 - E) * n/(n+200)`。它试图区分“英雄整体强”和“该对阵额外有利”，但仍受队友、玩家水平、出装和样本选择影响，不构成因果克制证明。

只有对六名初始敌人的配对及双方总体样本均达到门槛，才取六个指标的算术平均作为排序指标。**不把六组场数相加当作独立样本，不把平均值标为整队胜率。** 候选相对当前英雄的指标差至少 0.01（界面显示 1 点）才列入统计候选。这是启发式排序阈值，并非显著性结论或换人胜率提升。当前英雄与候选均显示实际历史胜率/样本，便于核查。

同队胜率单独展示，不与 counter 分数合并。尚无训练/校准过的六对六整队胜率模型，也没有对线胜率预测。Statlocker 公开页面可以展示更多模型结果，但本项目没有其私有数据授权或模型实现，不能声称复现。

## 新英雄目录与运行验证范围

截至本次查阅，[公开英雄分析目录](https://deadlock-api.com/analytics/heroes)包含 Rat King、Baba、Nurse Harrow、Violet，已补入名称。其机制标签保留未知。完整最新可选状态由成功执行同步时的资产接口决定，不通过旧名单猜测。

自动化测试使用明确标记的合成样本验证计算、方向、过滤与失败保护；生产快照通过真实 API 同步获取，二者分开。2026-10-25 已验证在线同步成功：44 个英雄、1,892 组有方向的对阵、946 组同队配对。时间和模式筛选完整记录在 `src/stats-data.js` 的 metadata 中。

本次资源 API 还包含 Deadman Danny、Solomon；Baba、Violet 为非活跃，默认不列入候选。统计中出现历史数据不代表英雄当前可选。手动 `available` 明确包含英雄时允许覆盖资源快照的过时状态，但不会覆盖英雄池、占用和排除限制。
