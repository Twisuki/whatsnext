# init - 初始化计划区

在一个仓库里第一次使用 whatsnext 时铺地基: 让 `.whatsnext/` 被 git 忽略, 建一个空的任务索引 `.whatsnext/tasks/index.md`. 这是"开第一个任务之前"跑一次的动作, 不新建任何任务(开任务见 [start.md](start.md)).

**幂等**: 已初始化则什么都不改, 只报告现状. 可安全重复调用; start 在计划区未就绪时也会借道本动作补齐.

## 1. 忽略 `.whatsnext/`

确保 `.whatsnext/` 被 git 忽略:

- 检查 `.git/info/exclude` 是否已含 `.whatsnext/`, 没有则追加一行.
- 用 `.git/info/exclude` 而非 `.gitignore`: 这是私有计划区, 不该进版本库, 也不该污染团队的 ignore 规则.
- 建目录与写文件全程不触发任何 git 操作(add / commit / push).

## 2. 建任务索引 `tasks/index.md`

`.whatsnext/tasks/index.md` 是全仓库任务索引, 新 session 恢复的第一入口. 不存在则建一个空骨架:

```markdown
# 计划索引 · tasks

本地私有计划区, 不纳入版本控制(已在 `.git/info/exclude` 排除 `.whatsnext/`).
按 `<分类>/<任务名>` 分层, 分类等于分支名前缀.

## 活跃任务

| 任务 | 状态 | 说明 |
| --- | --- | --- |

## 已归档

| 任务 | 状态 | 说明 |
| --- | --- | --- |

## 约定

- `.whatsnext/tasks/<分类>/<任务名>/index.md` — 任务索引与恢复入口.
- 分类枚举锁定: feat / fix / refactor / docs, 等于分支名前缀.
- Focus 唯一: 活跃任务中同时只有一个聚焦标记, 是导航而非任务状态.
```

两张表初始为空. 活跃任务由 start 往"活跃任务"表加行; 已 done / stopped 的任务由 finish / stop 从活跃表移入"已归档"表. 文件本身留原地不动.

## 范围

- init **只铺任务侧地基**(exclude + `tasks/index.md`). 与 tasks 并列的 `knowledge/` 目录不预建, 留到首次提升经验时由 promote 创建.
- init **不新建任务**. 用户说"开始做某任务"走 start.
- 全程只写 Markdown, 不碰 git.
