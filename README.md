# Deadlock Rank Advisor 0.1.1

QoL Lock 的游戏内阵容助手源码原型。已经实现分析引擎、Panorama HUD、QoL 源码接入工具和浏览器开发预览。**此包不含已编译 VPK，也未通过 Deadlock 实机验证。**

## 获取源码

本项目仓库：[hs-black/analysis-deadlock-plugin](https://github.com/hs-black/analysis-deadlock-plugin)。

```bash
git clone https://github.com/hs-black/analysis-deadlock-plugin.git
cd analysis-deadlock-plugin
npm test
npm run preview
```

也可以在 GitHub 点击 **Code → Download ZIP** 下载并解压。无需安装 npm 依赖。浏览器预览地址是 `http://127.0.0.1:4173`；预览不连接游戏。要在游戏内使用，请继续阅读下方的 QoL 源码接入与 Windows/CSDK 编译步骤。

## 已实现

- 第一次读齐敌方 6 个不同英雄后锁定，后续敌方换人不改变分析依据。
- 己方阵容更新后重算；点击己方英雄指定“你”，再点选同路队友和两名敌人。
- 人工确认的排位英雄池、排除列表、熟练度 0/1/2；不默认任何英雄已解锁。
- 可手动填写本局实际可选英雄，再次限制推荐范围。
- 阵容能力缺口、相对当前英雄的换人候选、双人路机制分析、针对装备候选及理由。
- 单独检查枪位（持续武器输出）职责；支持按本局出装将己方英雄标记为枪位或其他职责。
- 区分资料不足、未配置英雄池、无可用候选与评估后建议保留；未知数据不会被当作零能力。
- 回到已识别的 Hideout 时重置，也提供“下一局重置”按钮。
- 在新的目录生成集成后的 QoL 源码，不覆盖原 QoL 源码、不安装游戏文件。

## 0.1.1 修复

修复“覆盖 1/6 · 资料不足”却显示“没有足够理由建议换人”的误导提示。新增 Apollo、Celeste、Graves、Paige、The Doorman 的手工机制规则，枪位职责独立于泛化的持续输出。

示例：己方 Celeste / Paige / Graves / Viscous / Apollo / The Doorman，敌方 Abrams / Mo & Krill / Kelvin / Lash / Bebop / Dynamo。按默认职责会提示缺少枪位；选择 Celeste 为自己，英雄池勾选 Haze / Wraith / Vindicta，会产生带“补足枪位”理由的候选。未配置英雄池则明确提示先配置，不能直接推断你能换哪些英雄。

枪位是本局职责，不是“这个英雄有没有枪”。若 Graves、Celeste 等准备承担武器输出，在预览的“枪位职责”或 HUD 同名按钮中调整。默认职责及分数均为可修订的启发式规则，详见 [RULES.md](RULES.md)。设置只保留本局，下一局重置时清空。

更新：先停止预览，在克隆目录运行 `git pull`，再运行 `npm run preview` 并刷新页面；使用 ZIP 则重新下载并解压最新源码。页面顶部应显示 `0.1.1`。已编译的游戏内版本需要重新 stage/构建。

## 数据范围与限制

这是机制规则原型，不是胜率模型，不联网拉取实时段位或统计。英雄目录含 38 个名字，其中 **27 个具有手工基础规则**，其余 11 个只支持识别和保存英雄池，暂不参与推荐。目录参考社区 2026-06-20 快照，规则未针对当前补丁校准。装备是待核对的功能候选，不提供未经验证的当前价格、数值或购买顺序。`src/data.js` 中有完整覆盖范围和数据标识。

没有自动获取排位解锁资格、玩家 Steam 账号、可选状态或分路；这些由用户确认。不同账号应使用不同 profile 文件并重新选择/构建，当前版本不会自动识别账号切换。中文版英雄名称可通过 profile 的 `aliases` 映射，或使用手动阵容。自动读取依赖 QoL 的 `HeroNameHidden` / `HeroName` 标签，空值时可尝试打开计分板。

从中途加入比赛时，只能锁定首次读到的阵容。未检测到 Hideout/客户端保留 HUD 的特殊情况下，请在下一场开始前点“下一局重置”。同一局内误点会重新采集，请仅在新局使用。自己的英雄通过己方顶部栏位置选择；若客户端重排玩家位置，请重新确认选择。

## 1. 先在本机预览（不需要游戏）

安装 Node.js 20 或更新版，无需 npm install。解压后在此目录执行：

```powershell
npm test
npm run preview
```

打开 `http://127.0.0.1:4173`。这是模拟阵容的开发预览，不会连接游戏。可以改动双方英雄并“读入阵容”，验证敌方已锁定而己方继续更新；“下一局”清空快照。勾选确认解锁的英雄，再导出 `my.json` 到本项目 `profiles` 目录。也可直接编辑 `profiles/default.json`。

配置示例（必须按自己账号的实际解锁情况填写，以下仅是格式例子）：

```json
{
  "label": "我的主账号",
  "unlocked": ["haze", "paradox", "viscous"],
  "excluded": [],
  "familiarity": {"haze": 2, "paradox": 1, "viscous": 0},
  "aliases": {"游戏里显示的本地化英雄名": "haze"}
}
```

- `unlocked`：你确认已获得排位资格的英雄 ID。
- `excluded`：不希望推荐的英雄。
- `familiarity`：0 = 不熟，1 = 能玩，2 = 主玩；未填写不加熟练度权重。
- `aliases`：游戏实际显示的名字 → 英雄 ID。仅映射名字，不赋予解锁资格。
- 所有 ID 在 `catalog.json`。不认识的 profile ID 会阻止打包准备。

## 2. 接入 QoL 源码（Windows 示例）

此版本是 QoL 集成源码；不能将本项目源码直接放进游戏 addons 当作插件使用。

取得 [QoL Lock 源码](https://github.com/civo7/QOLLOCK)，比如解压到 `C:\Mods\QOLLOCK`。接入工具依据所检查的 QoL 4.0.5 布局：它需要 HUD 中存在 FeatureRegistry 和唯一的 `ql_app` 启动引用。如果上游改变接入方式，脚本会报错，避免盲目修改。

在本项目目录执行：

```powershell
node tools/stage.cjs --qol "C:\Mods\QOLLOCK" --out "C:\Mods\QOLLOCK-advisor" --profile "profiles\my.json"
```

输出目录必须尚不存在，并位于 QoL 源码目录之外。脚本复制资源源码和原许可证，把四个分析器脚本及样式加入 HUD，脚本加载位于 `ql_app` 启动之前。原 QoL 目录不被修改。未提供 `--profile` 时使用空的默认英雄池。

## 3. 编译 VPK

需要在 Windows 上配置 QoL 官方构建器所要求的 CSDK，包括 `resourcecompiler.exe` 和 `CSDKCfgVPK.exe`。它们不是 Node 依赖，本包不分发。参考上游 `build_mod/build_mod.ps1`；本环境未执行该脚本、未验证 CSDK 编译结果。

也提供一条命令的本机构建包装脚本：它先 stage，再复制上游构建器到新的输出目录，写入独立 CSDK 配置并调用批处理构建。不会修改原 QoL 配置。此 PowerShell 包装脚本尚未在 Windows/CSDK 环境运行。

```powershell
& .\tools\build.ps1 -QolSource "C:\Mods\QOLLOCK" -CsdkPath "C:\Reduced_CSDK_12" -Profile ".\profiles\my.json" -Out "C:\Mods\AdvisorBuild"
```

`Out` 必须是新的目录。也可以使用已经配置好的上游构建器，手动运行：

```powershell
& "C:\Mods\QOLLOCK\build_mod\build_mod.ps1" -Batch -ModFolderName "qol_rank_advisor" -SourcePath "C:\Mods\QOLLOCK-advisor" -OutputPath "C:\Mods\Builds\qol_rank_advisor.vpk"
```

构建器可能根据 VPK 格式产生 `_dir.vpk` 和配套数据文件，以其输出为准。首次使用请先完成上游构建器/CSDK设置；仅安装 Deadlock 并不保证已有编译工具。

## 4. 游戏内使用

1. 退出游戏，保留原 QoL 包用于恢复。
2. 用你现有的 mod 管理器停用原 QoL，安装本次构建得到的整套集成包。它包含 QoL 资源，不要与原 QoL 同时启用。
3. 重启游戏，先在自定义/测试环境检查。HUD 右上区域应出现“阵容助手 · 原型”。
4. 双方英雄读齐后状态会显示“敌方初始阵容已锁定”。打开计分板或使用游戏原有鼠标交互方式，点击自己的英雄，再选择同路队友及两名对线敌人。
5. “设置”中可调整英雄池、本局可选列表，或手动输入双方 6 人阵容（英文 ID、逗号分隔）。锁定后的敌方不会被手动输入覆盖。
6. HUD 显示短板、换人候选、对线提示和装备候选；建议不自动选择英雄或购买装备。
7. HUD 修改的配置仅在当前会话内生效。应用后“导出英雄池 JSON 到剪贴板”，保存为 profile 文件，重新 stage/构建才能随包持久保存。

卸载：停用集成包，重新启用原 QoL，重启游戏。接入工具本身未改动游戏文件。

## 实机验收

离线测试无法证明 native UI 绑定或 Source 2 渲染正确。需要核对：

- 赛前等待区能读齐两队，英雄名称映射正确；未知名字能手动校正。
- 点击“你”、同路、对线敌人时光标可达，HUD 不遮挡关键区域。
- 敌方换人不改变冻结快照，己方换人后推荐变化。
- 下一局自动/手动清理快照，未配置英雄池时没有换人推荐。
- 不同分辨率下滚动、收起、设置入口可用；没有新增控制台报错或明显帧率下降。

## 项目结构

- `src/engine.js`：不依赖游戏的分析与快照逻辑。
- `src/data.js`：基础规则、英雄目录、装备候选；由 `tools/make-data.py` 生成。
- `src/hud.js`、`src/hud.css`：Panorama 与 QoL FeatureRegistry 集成。
- `profiles/*.json`：用户自行确认的英雄池。
- `tools/stage.cjs`：校验并生成新的集成源码目录。
- `preview/`：使用同一引擎的开发演示。
- `tests/`：快照、推荐过滤、未知数据、HUD生命周期模拟、接入工具测试。

## 后续扩展接口

`engine.analyze({friendly, enemy, own, mate, foes, available, gunRoles})` 的 `available` 可由未来验证过的原生选人适配器提供。`undefined` 表示未验证，`[]` 表示没有可用候选，这两个含义不可混用。

`gunRoles` 为英雄 ID → 布尔值的本局映射，例如 `{graves: true}`；省略表示默认职责，未知英雄仍需规则资料。返回的 `decision` 区分等待原因、`recommend_swap` 与 `keep`；资料或资格不足时 `keep` 为 `null`，不能用真假值直接推断“保留”。

未来统计包应按补丁、段位和样本量生成，独立于游戏运行时下载。`hero-counter-stats` / `hero-synergy-stats` 是整场结果；`lane-matchup-stats` 的胜率也是整场胜率。对线应另用早期经济差等指标。当前版本没有假装接入这些统计。

## 参考

- QoL 模块机制：https://github.com/civo7/QOLLOCK/blob/main/docs/core/feature_registry.md
- QoL 英雄绑定：https://github.com/civo7/QOLLOCK/blob/main/panorama/layout/citadel_hud_top_bar_player.xml
- QoL 构建工具：https://github.com/civo7/QOLLOCK/blob/main/build_mod/build_mod.ps1
- 英雄名称目录参考：https://github.com/0xThiagoAmaral/deadlock-open-assets/blob/main/assets/game/heroes.json
- 统计接口说明：https://api.deadlock-api.com/openapi.json

分析器自有代码使用 MIT 许可；QoL 及其他上游资源保留各自许可证。本项目不是 QoL 官方发布。
