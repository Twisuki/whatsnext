# start - 开新任务

为一个跨 session 的长期任务在 `.whatsnext/tasks/` 里开出落脚点: 选分类, 调脚手架脚本建目录 + 极薄的 `index.md` 骨架并接管 Focus, 再补人写的简述与文件索引. 目标是让任何未来的 session 无需历史对话, 仅凭这几个文件就能复活任务. (无根索引文件, 任务列表与 Focus 由 `scan_tasks.py` 扫描 frontmatter 得出.)

先判断是否该开: 跨 session, 需交接, 或有多个专题才开; 一次性小改不开, 避免污染计划区. 该开则按下面步骤.

任务内容不必凭空来. 常见来源: 用户当场描述的新目标; 或**仓库里已散落的材料**(随手记的 TODO / notes / 设计草稿 / 聊天整理 / 代码注释里的计划). 后者见第 0.5 节, 先归纳再落成任务.

## 0. 确保计划区就绪

start 依赖已初始化的计划区(`.whatsnext/` 已被 exclude, `tasks/` 目录存在). 若尚未初始化, 先借道 [init.md](init.md) 补齐, 再继续. init 幂等, 已就绪则无副作用.

## 0.5. 从已有材料开任务(可选)

若任务源自仓库里散落的文档而非对话:

- **先读后收编**: 读那些材料, 归纳出这个任务要做什么, 目标 / 结论是什么, 再按下面步骤落成契约化任务. 不逐字搬运, 提炼成 index 的标题与简述.
- **原文归 origin**: 若材料是外部需求 / 沟通记录, 值得逐字留存, 抄进 `origin.md`; 加工后的结论归 index.
- **散料多, 明显分属不同目标**时, 拆成多个任务各自 start, 不硬塞进一个.
- **源文件留原地**: 收编是"读进来整理", 不删不移原文件. whatsnext 只管 `.whatsnext/` 内的落位.

## 1. 建任务路径

路径固定为 `.whatsnext/tasks/<分类>/<任务名>/`:

- **分类**枚举锁定, 等于分支名前缀: `feat` / `fix` / `refactor` / `docs`, 据任务性质选一.
- **任务名**用短横线小写, 简短达意, 如 `add-edit-page` / `request` / `atom`.
- 合起来如 `.whatsnext/tasks/feat/add-edit-page/`.

## 2. 调脚手架脚本建骨架 + 接管 Focus

用 `new_task.py` 一步建好目录 + `index.md` 骨架, 并自动接管 Focus, 免手工填模板:

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/scripts/new_task.py \
  --category feat --name add-edit-page --title "<标题>" [--tags a b] [--branch ...] \
  [--period-start yyyy-MM-dd] [--period-end yyyy-MM-dd] [--owner ...]
```

脚本行为:

- 建 `.whatsnext/tasks/<分类>/<任务名>/index.md`, 写好 frontmatter(status `active` / progress `0%` / `focus: true`, 其余按参数)+ 标题 + 待 AI 补的占位.
- 缺省值: `updated` 与 `period` 起始 = 系统今天; `period` 结束 = `***`; `branch` = `<分类>-<任务名> -> main`; `owner` = `git config user.name`; `tags` = `[]`.
- **接管 Focus(脚本自动做)**: 原 Focus 唯一则清掉它、新任务置 focus; 原本无 Focus 则直接接管; 原 Focus 冲突(多个)则只新增不动原来的, 并在输出里返回冲突, 交用户裁决——**读脚本返回的 focus 变更信息并转达用户**.
- 目录已存在则报错不覆盖.

**无 python 回退**: 脚本不可用时, 手工建目录 + 按 [frontmatter.md](frontmatter.md) 写 index.md(frontmatter 七字段 + `focus: true` + 标题), 并按第 4 步手工清原 Focus. 模板见 [assets/](../assets/).

## 3. 补 index.md 的人写部分

脚本只铺了骨架, 回到 `index.md` 补两样(保持极薄):

- **简述** — 标题下一段, 说明本任务要做什么, 结论 / 目标是什么, 作为最快恢复入口. 替换骨架里的占位.
- **文件索引** — `## 文件` 小节列出所有兄弟文件及各自角色. 因文件自由命名, 不登记则新 session 不知该读谁; 每新建一个兄弟文件都要回来补一行.

其余基线文件按需建(脚本不建它们):

- **`origin.md`** — 有外部需求(PM / 沟通记录)时建, 逐字存档原文, 不加工.
- **`plan.md`** — 多阶段任务建, 有序完成度清单.
- 其余(context / findings / api / test 等)推进中按需临场创建并命名, 建后回 `index.md` 文件索引登记. 模板见 [assets/](../assets/).

## 4. Focus 接管的回退(仅无脚本时)

脚本已自动接管 Focus(第 2 步), 正常无需本步. 仅当走了无 python 回退时手工做:

- 调 `scan_tasks.py` 或直接扫出当前 `focus`; 若有原 Focus 任务, 去掉其 frontmatter 的 `focus` 字段.
- 新任务保持 `focus: true`. 完成后应只有新任务一个 Focus.
- 原本无 Focus(如 finish/stop 后悬空)则直接接管.

全程只写 Markdown, 不 add / commit / push.
