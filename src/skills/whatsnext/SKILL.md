---
name: whatsnext
description: 用一个私有, 轻量的 Markdown 计划区(.whatsnext/)管理跨 session 的长期开发任务, 让新的 AI session 无需依赖历史对话即可恢复 `任务在做什么, 进展到哪, 下一步做什么`. 当用户要求开始一个需要持久交接的长期任务, 继续或恢复既有任务, 保存进展, 归档完成/搁置的任务, 沉淀可复用经验时使用. 不要用于不需要跨 session 交接的一次性小改动.
---

# whatsnext

用普通 Markdown 作为长期任务的真相来源, 存放在仓库私有的 `.whatsnext/` 计划区(git-ignored). 用 host 的常规文件工具读写, 不建隐藏状态, 不生成校验产物, 不做并行工作流图. 契约是柔性的:**修复明显缺漏, 而非因格式不合而拒绝**.

## 统一前置: 装载契约(幂等)

所有 `/wn*` 命令的第一步都是确保本契约已在上下文, 再进入各自动作:

- Claude Code 无硬性"已装载"标志位. "已装载" = 本 `SKILL.md` 正文已在当前会话上下文里(本会话早先跑过某个 `/wn*` 读过, 或 skill 被自动加载过).
- 判断靠自省"这段契约现在在我上下文吗". 是软信号, **不确定时就读**——重读本文件幂等, 代价仅几百 token(`allowed-tools: Read(${CLAUDE_PLUGIN_ROOT}/**)` 令读自身文件免弹窗).
- 已装载则直接进下一步, 不重复装载.

## 路由

`/wn` 是**唯一的智能入口**, 也是新会话的起点:

- **`/wn`(无参)** — 返回 whatsnext 是什么 / 怎么用 + 当前计划区状态(有无 `.whatsnext`, 有哪些任务, 哪个活跃). 不臆测动作.
- **`/wn 描述`(带参)** — 按下面的分诊规则理解描述, 映射到一个或多个动作并按序完成(可组合, 如"结束上一任务 + 开新任务").

七个动作命令**专一**: 各自只做一件事, 先完整读对应 reference 再动作. 收到不属于本动作的参数时, 只提示用户改用 `/wn` 或正确的 `/wn-*`, 不代跑别的动作(见"参数分诊").

| 情境 | 命令 | reference |
| --- | --- | --- |
| 初始化计划区(仓库首次使用, 开第一个任务前) | `/wn-init` | [references/init.md](references/init.md) |
| 开新任务(含从散落材料迁移开任务) | `/wn-start` | [references/start.md](references/start.md) |
| 继续 / 恢复 / 列出任务, 重启已搁置任务 | `/wn-resume` | [references/resume.md](references/resume.md) |
| 保存进展 / 交接当前 session | `/wn-save` | [references/save.md](references/save.md) |
| 完成任务 | `/wn-finish` | [references/finish.md](references/finish.md) |
| 搁置任务 | `/wn-stop` | [references/stop.md](references/stop.md) |
| 沉淀可复用经验 | `/wn-promote` | [references/promote.md](references/promote.md) |

开始或继续一个任务后, 在到达里程碑或 session 将结束时应用保存指引. 不要为做仪式而打断有效工作.

## 参数分诊

分诊是 `/wn` 独占的职责: 把一段自然语言描述映射到一个或多个动作, 按序执行, 每步走对应 reference 的完整步骤. 例:

- `/wn 开始做登录页` — 开任务意图, 走 [start.md](references/start.md).
- `/wn 上次那个任务到哪了` — 走 [resume.md](references/resume.md).
- `/wn 结束上一个任务再开个重构任务` — **组合**: 先 [finish.md](references/finish.md) 归档当前 Focus, 再 [start.md](references/start.md) 开新任务. 组合动作靠各 reference 自身的 Focus 处理自然衔接(finish 清空 Focus → start 接管), 不额外传递上下文.

宁可先理解意图再分诊, 不机械执行, 也不忽略描述.

**动作命令(`/wn-*`)不分诊**: 收到的参数只当作本动作的输入. 若参数意图明显不属于本动作, 不代跑、不硬套, 只点明并提示用户改用 `/wn`(智能分诊)或正确的 `/wn-*`.

## 目录模型

```text
.whatsnext/
  tasks/                   (无根索引文件; 任务列表与 Focus 由脚本扫描 frontmatter 现算)
    <分类>/<任务名>/
      index.md             任务索引:frontmatter 元数据 + 标题与简述 + 文件索引
      origin.md            需求原文逐字存档(有外部需求时)
      plan.md              有序完成度清单(多阶段任务)
      <其他>.md            LLM 按需命名的兄弟文件, 须在 index 文件索引登记
  knowledge/<title>.md    已验证, 可复用, 自包含的经验, 一条一个文件, 扁平不分层, 与 tasks 并列
  # scripts 随 plugin 分发于 skills/whatsnext/scripts/, 非计划区内容
```

- **无根索引**: `tasks/` 下不放手写索引文件. 真相唯一来源是各任务 `index.md` 的 frontmatter, 由 `scan_tasks.py` 扫描汇总(任务列表 + Focus). 消除"手写台账与磁盘漂移".
- **任务快照脚本**: `python3 ${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/scripts/scan_tasks.py` 输出 `{tasks:[{dir,status,title}], focus:string[]}`, 支持 `--status` / `--tags` 筛选. 列任务 / 找 Focus / 对账都调它, 免逐个读文件; 无 python 时回退直接遍历 frontmatter.
- **分类 = 分支名**, 枚举锁定:`feat/` `fix/` `refactor/` `docs/`.
- **每仓库独立**,git-ignored(`.git/info/exclude` 排除 `.whatsnext/`), 不跨仓库共享.
- **开任务阈值**: 跨 session, 需交接, 或有多个专题才开任务; 一次性小改不开, 避免污染计划区.

## 文件契约

每个文件单一职责, 不混装. 基线文件(模板见 [assets/](assets/)):

- **`index.md`(必需)** — 任务的索引, 保持极薄. 只含三样:frontmatter 结构化元数据(七个核心字段全必需:`status` 三态 / `progress` / `period` / `updated` / `branch` / `owner` / `tags`, 加可选 `focus`——当前聚焦任务标 `focus: true`; 柔性在取值可留空而非省字段, 类型与约束见 [references/frontmatter.md](references/frontmatter.md)), 标题与简述, 文件索引(列出兄弟文件及各自角色, 因文件自由命名, 不登记则新 session 不知读谁). 不堆原文, 不堆流水, 不装叙述内容.
- **`origin.md`(有外部需求时必需)** — 需求原文 / 沟通记录逐字存档, 按时间线分段, 每段标来源 + 绝对日期. 只存原文, 任何结论/推断归 index.
- **`plan.md`(多阶段任务推荐)** — 有序完成度清单. 完成标 `- [x]`(可附结果), 废弃或改方向用删除线归档并注明原因与日期, 不重复 index 的目标.

其余文件(context / findings / api / test 等)由 LLM 按需临场创建并命名, 在 index 文件索引登记即可. 叙述性内容进独立兄弟文件, 结构化元数据进 frontmatter.

## 恢复协议

新 session 恢复一个任务, 按序, 按需读, 其余懒加载:

1. 调 `scan_tasks.py` → 拿任务快照 + Focus(`focus` 数组: 空=无, 单=聚焦, 多=冲突)
2. 目标任务 `index.md` → 读 frontmatter(状态 / 进度)+ 标题与简述 + 文件索引
3. 按文件索引**按需**读兄弟文件(origin / plan / 其他)
4. 实时 git 状态
5. 懒加载边界: 其余任务, 排查细节, 无关 knowledge 不预读

## 经验发现(有界)

任务被开始, 恢复, 或给出实质性新方向时, 在执行前检查是否有适用的项目经验, 无需等用户点名:

1. 读任务已链接的相关 knowledge.
2. 扫 `.whatsnext/knowledge/` 下各文件的 frontmatter(`title` / `label` / `tags` / `description`), 与用户请求 + 任务目标比对; 文件名 / 元数据不足以判断时, 才在可能相关的文件内搜正文.
3. 明显相关的才读正文; 都不相关就继续, 不追问经验放在哪.

扫元数据是例行发现, 正文保持懒加载, 不预载无关 knowledge. (任务侧已有 `scan_tasks.py` 消费 frontmatter; knowledge 侧的搜索脚本可同法引入, 免逐个扫.)

## 边界

- **状态三态**:`active` / `done` / `stopped`. 写进 frontmatter, 不写在散文里.
- **Focus 唯一**: 同时只有一个任务 frontmatter 标 `focus: true`; 它是导航, 不是任务状态. 脚本扫出多个即冲突, 交 LLM 提示修. 已完成(`done`)/ 已搁置(`stopped`)的任务靠 status 被脚本排除出活跃列表,**文件留原地**.
- **经验提升三门槛**(缺一不提升): 已验证 + 可能被其他任务复用 + 能写成自包含结论. 一条经验一个文件, 扁平存放, frontmatter 带 `title` / `label` / `tags` / `description` 供搜索(规范见 [references/knowledge.md](references/knowledge.md)). 失败尝试与未决研究留在任务里不提升, 被现实推翻的经验重写或删除. 提升动作见 [references/promote.md](references/promote.md).
- **一个顶层 session 作为操作者**: 可协调子 agent, 但须把结果汇总回权威的任务文档. 不加跨 session 锁, 认领, 合并协议.
- **不碰 git**: 整理 `.whatsnext` 绝不 add / commit / push / tag / publish, 除非用户明确要求.
- **不做**: 编号 ADR 体系,schema 校验器, 手写的索引台账/激活规则/修订历史/陈旧标记/复核台账. (真相在 frontmatter, 任务列表与 Focus 由脚本**实时扫描**得出——这是现算而非手写台账, 不违背本条; 同理 knowledge 的 frontmatter 也是供脚本消费的元数据, 非台账.)

当现实与文档不符时, 检查仓库, 说明偏差, 在下次授权保存时更新可见文档——优先修复而非因 schema 错误拒绝.
