# init - 初始化计划区

在一个仓库里第一次使用 whatsnext 时铺地基: 让 `.whatsnext/` 被 git 忽略, 建一个空的 `.whatsnext/tasks/` 目录. 这是"开第一个任务之前"跑一次的动作, 不新建任何任务(开任务见 [start.md](start.md)).

**没有根索引文件**: whatsnext 不再维护手写的 `tasks/index.md`. 任务列表与 Focus 的真相来源是各任务 `index.md` 的 frontmatter, 由 `scan_tasks.py` 扫描现算(见 [frontmatter.md](frontmatter.md)). 所以 init 只需保证目录就绪, 不建任何索引文件。

**幂等**: 已初始化则什么都不改, 只报告现状. 可安全重复调用; start 在计划区未就绪时也会借道本动作补齐.

## 1. 忽略 `.whatsnext/`

确保 `.whatsnext/` 被 git 忽略:

- 检查 `.git/info/exclude` 是否已含 `.whatsnext/`, 没有则追加一行.
- 用 `.git/info/exclude` 而非 `.gitignore`: 这是私有计划区, 不该进版本库, 也不该污染团队的 ignore 规则.
- 建目录与写文件全程不触发任何 git 操作(add / commit / push).

## 2. 建 `tasks/` 目录

确保 `.whatsnext/tasks/` 目录存在(空目录即可). 任务由 start 在其下建 `<分类>/<任务名>/`; 列任务 / 找 Focus 由 `scan_tasks.py` 扫描该目录得出, 无需索引文件。

## 范围

- init **只铺任务侧地基**(exclude + `tasks/` 空目录). 与 tasks 并列的 `knowledge/` 目录不预建, 留到首次提升经验时由 promote 创建.
- init **不新建任务**. 用户说"开始做某任务"走 start.
- init **不建索引文件**. 任务真相在 frontmatter, 靠脚本扫描, 无手写台账.
- 全程只写 Markdown / 建目录, 不碰 git.
