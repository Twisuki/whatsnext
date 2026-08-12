# start - 开新任务

为一个跨 session 的长期任务在 `.whatsnext/tasks/` 里开出落脚点: 选分类, 建任务目录, 写一份极薄的 `index.md` 作为恢复入口, 并在根 `index.md` 登记新任务, 接管 Focus. 目标是让任何未来的 session 无需历史对话, 仅凭这几个文件就能复活任务.

先判断是否该开: 跨 session, 需交接, 或有多个专题才开; 一次性小改不开, 避免污染计划区. 该开则按下面步骤.

任务内容不必凭空来. 常见来源: 用户当场描述的新目标; 或**仓库里已散落的材料**(随手记的 TODO / notes / 设计草稿 / 聊天整理 / 代码注释里的计划). 后者见第 0.5 节, 先归纳再落成任务.

## 0. 确保计划区就绪

start 依赖已初始化的计划区(`.whatsnext/` 已被 exclude, `tasks/index.md` 存在). 若尚未初始化, 先借道 [init.md](init.md) 补齐, 再继续. init 幂等, 已就绪则无副作用.

## 0.5. 从已有材料开任务(可选)

若任务源自仓库里散落的文档而非对话:

- **先读后收编**: 读那些材料, 归纳出这个任务要做什么, 目标 / 结论是什么, 再按下面步骤落成契约化任务. 不逐字搬运, 提炼成 index 的标题与简述.
- **原文归 origin**: 若材料是外部需求 / 沟通记录, 值得逐字留存, 抄进 `origin.md`; 加工后的结论归 index.
- **散料多, 明显分属不同目标**时, 拆成多个任务各自 start, 不硬塞进一个.
- **源文件留原地**: 收编是"读进来整理", 不删不移原文件. whatsnext 只管 `.whatsnext/` 内的落位.

start 依赖已初始化的计划区(`.whatsnext/` 已被 exclude, `tasks/index.md` 存在). 若尚未初始化, 先借道 [init.md](init.md) 补齐, 再继续. init 幂等, 已就绪则无副作用.

## 1. 建任务路径

路径固定为 `.whatsnext/tasks/<分类>/<任务名>/`:

- **分类**枚举锁定, 等于分支名前缀: `feat` / `fix` / `refactor` / `docs`, 据任务性质选一.
- **任务名**用短横线小写, 简短达意, 如 `add-edit-page` / `request` / `atom`.
- 合起来如 `.whatsnext/tasks/feat/add-edit-page/`.

## 2. 建任务文件

`index.md` 必建. 其余基线文件按需:

- **`index.md`(必需)** — 任务索引与恢复入口, 见第 3 步.
- **`origin.md`** — 有外部需求(PM / 沟通记录)时建, 逐字存档原文, 不加工.
- **`plan.md`** — 多阶段任务建, 有序完成度清单.
- 其余(context / findings / api / test 等)不预建, 推进中按需临场创建并命名, 建后必须回到 `index.md` 文件索引登记.

模板见 [assets/](../assets/): `index.md` / `origin.md` / `plan.md` 三个骨架, 复制后填写.

## 3. 写 index.md

保持极薄, 只含三样:

**frontmatter** — 七字段全必需, 类型与约束见 [frontmatter.md](frontmatter.md). 开新任务的初值:

```yaml
---
status: active
progress: 0%
period: 2026-08-12 - ***
updated: 2026-08-12
branch: feat-add-edit-page -> main
owner: Twisuki
tags: []
---
```

- `status` 开新任务恒为 `active`; `progress` 初始 `0%`.
- `period` 起始填今天, 结束未知用 `***`; `branch` 分支未定可暂填计划名; `tags` 无则 `[]`.

**标题** — frontmatter 之下用 `#` 顶级标题写 `<分类>/<任务名> - <标题>`, 紧跟一段说明本任务要做什么, 结论 / 目标是什么, 作为最快恢复入口.

**文件索引** — `## 文件` 小节列出所有兄弟文件及各自角色. 因文件自由命名, 不登记则新 session 不知该读谁; 每新建一个兄弟文件都要回来补一行.

## 4. 更新根 index.md

`.whatsnext/tasks/index.md` 的活跃任务表必须登记新任务:

- 加一行: 任务(链接到任务 `index.md`)/ 状态 / 说明.
- **Focus 唯一**: 开新任务通常即接管 Focus, 把 Focus 标记移到新任务(如状态列标 `active·focus`), 原 Focus 任务去标. Focus 是"当前聚焦哪个", 同时只能一个, 是导航而非任务状态.

全程只写 Markdown, 不 add / commit / push.
