---
name: whatsnext
description: 用一个私有, 轻量的 Markdown 计划区(.whatsnext/)管理跨 session 的长期开发任务, 让新的 AI session 无需依赖历史对话即可恢复 `任务在做什么, 进展到哪, 下一步做什么`. 当用户要求开始一个需要持久交接的长期任务, 继续或恢复既有任务, 保存进展, 归档完成/搁置的任务, 沉淀可复用经验时使用. 不要用于不需要跨 session 交接的一次性小改动.
---

# whatsnext

用普通 Markdown 作为长期任务的真相来源, 存放在仓库私有的 `.whatsnext/` 计划区(git-ignored). 用 host 的常规文件工具读写, 不建隐藏状态, 不生成校验产物, 不做并行工作流图. 契约是柔性的:**修复明显缺漏, 而非因格式不合而拒绝**.

## 路由

先完整读对应的 reference, 再动作:

- 初始化计划区(仓库首次使用, 开第一个任务前):[references/init.md](references/init.md)
- 开新任务:[references/start.md](references/start.md)
- 继续 / 恢复 / 列出任务:[references/continue.md](references/continue.md)
- 保存进展 / 交接当前 session:[references/save.md](references/save.md)
- 完成任务:[references/finish.md](references/finish.md)
- 搁置任务:[references/stop.md](references/stop.md)
- 沉淀可复用经验:[references/promote.md](references/promote.md)

开始或继续一个任务后, 在到达里程碑或 session 将结束时应用保存指引. 不要为做仪式而打断有效工作.

## 目录模型

```text
.whatsnext/
  tasks/
    index.md               计划索引: 活跃任务表 + 唯一 Focus 标记
    <分类>/<任务名>/
      index.md             任务索引:frontmatter 元数据 + 标题与简述 + 文件索引
      origin.md            需求原文逐字存档(有外部需求时)
      plan.md              有序完成度清单(多阶段任务)
      <其他>.md            LLM 按需命名的兄弟文件, 须在 index 文件索引登记
  knowledge/<title>.md    已验证, 可复用, 自包含的经验, 一条一个文件, 扁平不分层, 与 tasks 并列
```

- **分类 = 分支名**, 枚举锁定:`feat/` `fix/` `refactor/` `docs/`.
- **每仓库独立**,git-ignored(`.git/info/exclude` 排除 `.whatsnext/`), 不跨仓库共享.
- **开任务阈值**: 跨 session, 需交接, 或有多个专题才开任务; 一次性小改不开, 避免污染计划区.

## 文件契约

每个文件单一职责, 不混装. 基线文件(模板见 [assets/](assets/)):

- **`index.md`(必需)** — 任务的索引, 保持极薄. 只含三样:frontmatter 结构化元数据(七字段全必需:`status` 三态 / `progress` / `period` / `updated` / `branch` / `owner` / `tags`, 柔性在取值可留空而非省字段, 类型与约束见 [references/frontmatter.md](references/frontmatter.md)), 标题与简述, 文件索引(列出兄弟文件及各自角色, 因文件自由命名, 不登记则新 session 不知读谁). 不堆原文, 不堆流水, 不装叙述内容.
- **`origin.md`(有外部需求时必需)** — 需求原文 / 沟通记录逐字存档, 按时间线分段, 每段标来源 + 绝对日期. 只存原文, 任何结论/推断归 index.
- **`plan.md`(多阶段任务推荐)** — 有序完成度清单. 完成标 `- [x]`(可附结果), 废弃或改方向用删除线归档并注明原因与日期, 不重复 index 的目标.

其余文件(context / findings / api / test 等)由 LLM 按需临场创建并命名, 在 index 文件索引登记即可. 叙述性内容进独立兄弟文件, 结构化元数据进 frontmatter.

## 恢复协议

新 session 恢复一个任务, 按序, 按需读, 其余懒加载:

1. 根 `.whatsnext/tasks/index.md` → 找 Focus(当前聚焦的任务)
2. 任务 `index.md` → 读 frontmatter(状态 / 进度)+ 标题与简述 + 文件索引
3. 按文件索引**按需**读兄弟文件(origin / plan / 其他)
4. 实时 git 状态
5. 懒加载边界: 其余任务, 排查细节, 无关 knowledge 不预读

## 经验发现(有界)

任务被开始, 恢复, 或给出实质性新方向时, 在执行前检查是否有适用的项目经验, 无需等用户点名:

1. 读任务已链接的相关 knowledge.
2. 扫 `.whatsnext/knowledge/` 下各文件的 frontmatter(`title` / `label` / `tags` / `description`), 与用户请求 + 任务目标比对; 文件名 / 元数据不足以判断时, 才在可能相关的文件内搜正文.
3. 明显相关的才读正文; 都不相关就继续, 不追问经验放在哪.

扫元数据是例行发现, 正文保持懒加载, 不预载无关 knowledge. 后续可引入直接调用的搜索脚本消费这些 frontmatter, 免逐个扫.

## 边界

- **状态三态**:`active` / `done` / `stopped`. 写进 frontmatter, 不写在散文里.
- **Focus 唯一**: 根 index 同时只有一个 Focus 标记; 它是导航, 不是任务状态. 已完成(`done`)/ 已搁置(`stopped`)的任务移出活跃列表,**文件留原地**.
- **经验提升三门槛**(缺一不提升): 已验证 + 可能被其他任务复用 + 能写成自包含结论. 一条经验一个文件, 扁平存放, frontmatter 带 `title` / `label` / `tags` / `description` 供搜索(规范见 [references/knowledge.md](references/knowledge.md)). 失败尝试与未决研究留在任务里不提升, 被现实推翻的经验重写或删除. 提升动作见 [references/promote.md](references/promote.md).
- **一个顶层 session 作为操作者**: 可协调子 agent, 但须把结果汇总回权威的任务文档. 不加跨 session 锁, 认领, 合并协议.
- **不碰 git**: 整理 `.whatsnext` 绝不 add / commit / push / tag / publish, 除非用户明确要求.
- **不做**: 编号 ADR 体系,schema 校验器, 必需的索引台账/激活规则/修订历史/陈旧标记/复核台账. (knowledge 的 frontmatter 元数据是可选搜索辅助, 供脚本消费, 非必需台账, 不在此列.)

当现实与文档不符时, 检查仓库, 说明偏差, 在下次授权保存时更新可见文档——优先修复而非因 schema 错误拒绝.
