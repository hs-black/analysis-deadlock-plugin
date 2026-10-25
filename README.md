# Deadlock Rank Advisor 0.3.0

嵌入 QoL Lock HUD 的阵容、换人与分路助手。选择自己的英雄和排位英雄池后，给出最多三个可换英雄，说明换人的收益、推荐搭档、打法、取舍及针对装备。浏览器预览与游戏 HUD 共用同一分析引擎。

## 这版改了什么

- **统一推荐**：把阵容补位、技能应对、真实历史 counter / 同队数据、双人路搭配和熟练度合并排序。可切换“综合补位 / 优先 Counter / 优先队友配合”。
- **完整英雄机制模型**：当前目录 44 名英雄均关联四个主技能；包含 176 个主技能引用及变身等关联记录，共 208 条技能记录。覆盖 Celeste、Paige、Graves、Apollo、The Doorman、Rat King、Nurse Harrow 等。
- **14 个能力维度**：持续武器、元灵、爆发、范围伤害、团控、前排、续航、保护、先手、节奏、成长、清线、消耗、机动。出装路线可按己方英雄调整。
- **分路建议**：枚举六人的 15 种双人组合，推荐三组搭配；支持固定当前搭档。每个换人候选都有换后的完整分路，而不只是“选个枪位”。
- **针对装备**：收录 156 件常规装备的作用、价格、属性及组件；其中 35 条直接针对规则用于推荐，按重伤、打断、留人、解控、保护、减抗等用途去重，并写明对谁、何时使用。
- **简洁报告**：默认显示行动建议；各维度和历史样本放在可展开详情中。技能与装备资料库可搜索原始说明、升级效果和来源。

你反馈的阵容 `Celeste / Paige / Graves / Viscous / Apollo / The Doorman` 在默认路线下会提示补持续武器输出。选择自己为 Celeste，英雄池勾选 Haze / Wraith / Vindicta，仓库附带数据的综合排序首选 **Wraith**，结合武器输出、Telekinesis 应对持续施法和历史对阵表现给出理由。调整目标、队友出装或英雄池会重新排序。

## 启动预览

需要 Node.js；推荐安装 [Node.js 24 LTS](https://nodejs.org/)。Windows 安装时保留加入 PATH，安装完成后重新打开 PowerShell。此前提示“无法识别 npm”说明 Node/npm 尚未安装或终端尚未加载新 PATH。

```powershell
node --version
npm --version
git clone https://github.com/hs-black/analysis-deadlock-plugin.git
cd analysis-deadlock-plugin
npm run preview
```

已经下载仓库的用户先在项目目录 `git pull`，ZIP 用户重新下载并解压。没有 npm 依赖，无需 `npm install`。打开 **http://127.0.0.1:4173**，页面版本应是 **0.3.0**。

1. 填入双方阵容，点“读入阵容”；首次完整敌方阵容会锁定，己方更新后继续重算。
2. 勾选自己确认已解锁排位的英雄，选择“你使用的英雄”。
3. 选择推荐目标，查看前三候选及“换后完整分路”。默认自由重组搭档；需要保留同路关系时勾选“固定当前搭档”。
4. 指定两名对线敌人，会在你所在的一路加入清线、消耗、回复和防抓提示。其余路按己方配合优化。
5. 在“调整己方出装方向”中选择武器、元灵或功能路线。
6. [技能与装备资料库](http://127.0.0.1:4173/knowledge)提供全文搜索。英雄池可导出为 `profiles/my.json`，供 HUD 打包使用。

预览使用模拟阵容。游戏内版本需要下面的 QoL 源码接入与 CSDK 构建；目前已验证浏览器及模拟 Panorama 生命周期，尚未完成 Deadlock 实机和 Windows/CSDK 编译验证。

## 英雄池

```json
{
  "label": "我的主账号",
  "unlocked": ["haze", "wraith", "vindicta"],
  "excluded": [],
  "familiarity": {"haze": 2, "wraith": 1},
  "aliases": {"游戏里的本地化名字": "haze"}
}
```

`unlocked` 由用户确认排位资格；`excluded` 排除不想玩的英雄；`familiarity` 为 0/1/2，影响排序；`aliases` 映射游戏显示名到项目 ID。所有 ID 见 `catalog.json`。候选还会排除双方已占用英雄；HUD 的“本局确认可选”可进一步限定范围。Baba、Violet 在这份资源快照中为非活跃，默认不推荐；本局明确可选列表可以覆盖该状态，但不会覆盖英雄池限制。

## 数据与更新

技能及装备来自 [Deadlock API 游戏资源](https://api.deadlock-api.com/v1/assets/heroes?language=english&client_version=6819)，本次固定 **client build 6819** 核对。常规商店外的特殊价格物品保留在原始资料中，不参与推荐。模型和装备针对规则位于 `knowledge/`，来源与算法详见 [RULES.md](RULES.md)。

仓库附带 2026-10-25 同步的真实统计：44 个英雄、1,892 组有方向的对阵、946 组同队配对；窗口为 2026-10-18 19:24:53 至 2026-10-25 19:24:53 UTC，普通地图排位、所有段位。

停止预览后更新：

```powershell
git pull
npm run sync-data
npm run sync-knowledge
npm test
npm run preview
```

- `sync-data` 默认抓取最近 7 天排位统计，也更新英雄名称和可选状态。可按日期、段位筛选：`npm run sync-data -- --from 2026-10-01 --to 2026-10-25 --min-badge 61 --max-badge 116`。日期为 UTC，结束日不包含在内。
- `sync-knowledge` 下载与机制模型版本一致的技能和装备，并生成本地资料库。若游戏 build 已变化，会提示维护者先复核 `knowledge/hero-models.json`，保留现有资料；单纯更新名字不会自动赋予新英雄机制评分。
- 超过 7 天的统计不再影响排序，机制和分路建议仍可使用。筛选窗口可能跨补丁，可按已核实的补丁日期缩小。
- HUD 读取打包的本地数据，更新后需要重新 stage / 构建 VPK。预览刷新即可读取新数据。

当前模型是有来源的机制评分结合历史配对表现，尚未用实战结果校准权重；对阵胜率是历史整场结果，分路评分使用技能配合及同队统计。项目未接入 Statlocker 的私有模型，也未训练六对六胜率预测。自动账号识别、排位解锁和分路读取尚未接入。

## 2. 接入 QoL 源码（Windows 示例）

此版本是 QoL 集成源码；不能将本项目源码直接放进游戏 addons 当作插件使用。

取得 [QoL Lock 源码](https://github.com/civo7/QOLLOCK)，比如解压到 `C:\Mods\QOLLOCK`。接入工具依据所检查的 QoL 4.0.5 布局：它需要 HUD 中存在 FeatureRegistry 和唯一的 `ql_app` 启动引用。如果上游改变接入方式，脚本会报错，避免盲目修改。

在本项目目录执行：

```powershell
node tools/stage.cjs --qol "C:\Mods\QOLLOCK" --out "C:\Mods\QOLLOCK-advisor" --profile "profiles\my.json"
```

输出目录必须尚不存在，并位于 QoL 源码目录之外。脚本复制资源源码和原许可证，把分析、统计快照和 HUD 脚本及样式加入 HUD，脚本加载位于 `ql_app` 启动之前。原 QoL 目录不被修改。未提供 `--profile` 时使用空的默认英雄池。

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

## 代码与验证

- `knowledge/hero-models.json`：44 个英雄的能力、打法、技能引用及针对标签。
- `knowledge/item-counters.json`：35 条装备针对规则、使用时机与适用出装路线。
- `src/knowledge-data.js`：带 build、来源和升级效果的生成资料库。
- `src/planner.js`：统一换人排序、三组分路、装备建议。
- `src/engine.js`：英雄池过滤、名字解析、敌方快照冻结。
- `src/statistics.js` / `src/stats-data.js`：历史记录展示和真实统计快照。
- `preview/` / `src/hud.js`：浏览器和 QoL Panorama 界面。
- `tools/build-knowledge.cjs`：从下载资产和人工复核模型生成资料库。
- `tools/sync-knowledge.cjs` / `tools/sync-data.cjs`：资源与统计同步。

运行 `npm test` 验证推荐目标变化、机制例外、装备解控范围、完整分路、英雄池过滤、敌方冻结、HUD 生命周期及 stage。已完成的检查见 [VERIFICATION.txt](VERIFICATION.txt)。

分析接口：

```js
engine.analyze({
  friendly, enemy, own, mate, foes,
  goal: 'balanced', // counter / synergy
  builds: {graves: 'weapon'}, // default / weapon / spirit / support
  lockMate: false,
  available: undefined
});
```

`available: undefined` 使用英雄池及资源状态，`[]` 表示本局没有可换候选。返回 `recommendations` 包含最多三个可用候选和相对当前英雄的收益、搭档、完整分路、出装及统计依据；即使保留当前英雄分数更高，也显示排名靠前的备选。`lanePlan` 为当前阵容的三组分路。

QoL 接入参考：[FeatureRegistry](https://github.com/civo7/QOLLOCK/blob/main/docs/core/feature_registry.md)、[英雄标签绑定](https://github.com/civo7/QOLLOCK/blob/main/panorama/layout/citadel_hud_top_bar_player.xml)、[构建器](https://github.com/civo7/QOLLOCK/blob/main/build_mod/build_mod.ps1)。自有代码使用 MIT 许可，上游资源保留各自许可证。
