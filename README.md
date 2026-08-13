# whatsnext

一个私有, 轻量的 Claude Code skill: 用仓库内 git-ignored 的 `.whatsnext/` Markdown 计划区管理跨 session 的长期开发任务, 让新的 AI session 无需依赖历史对话即可恢复 `任务在做什么, 进展到哪, 下一步做什么`.

## 安装

在 Claude Code 里执行:

```
/plugin marketplace add Twisuki/whatsnext
/plugin install whatsnext@whatsnext-marketplace
```

新开一个 Claude Code session 即可加载, 用 `/context` 的 Skills 列表确认 `whatsnext` 出现.

## 命令

`/wn` 是唯一的智能入口, 也是新会话的起点:

- `/wn` — 无参: 说明 whatsnext 是什么 / 怎么用, 并报当前计划区状态(有无 `.whatsnext`, 有哪些任务, 哪个活跃).
- `/wn 描述` — 带参: 按描述智能分诊, 可组合多动作按序完成(如 `结束上一个任务再开个重构任务`).

七个动作命令**专一**, 各只做一件事; 带了不属于自己的意图时只提示改用 `/wn`, 不代跑:

| 命令 | 动作 |
| --- | --- |
| `/wn-init` | 初始化计划区(幂等, 开第一个任务前铺地基) |
| `/wn-start` | 开新任务 |
| `/wn-resume` | 继续 / 恢复 / 列出任务, 重启已搁置任务 |
| `/wn-save` | 保存进展 / 交接当前 session |
| `/wn-finish` | 完成任务并归档 |
| `/wn-stop` | 搁置任务(可逆) |
| `/wn-promote` | 把验证过的经验沉淀到 `.whatsnext/knowledge/` |

## 真相来源: frontmatter + 扫描脚本

whatsnext **不维护手写的根索引文件**. 每个任务的真相(状态 / 进度 / 是否聚焦)都在自己 `index.md` 的 frontmatter; 任务列表与 Focus 由扫描脚本实时算出, 从根上避免"手写台账与磁盘漂移".

- **Focus** 是 frontmatter 的 `focus: true` 字段, 全局唯一(同时只一个任务聚焦)。
- **脚本** `skills/whatsnext/scripts/scan_tasks.py`(纯 Python 标准库, 只读)扫描 `.whatsnext/tasks/` 各 frontmatter, 输出 JSON:

  ```bash
  python3 scan_tasks.py [--status active ...] [--tags x ...]
  # => {"tasks": [{"dir","status","title"}], "focus": ["feat/x"]}
  ```

  列任务 / 找 Focus / 对账都调它, 省去逐个读文件; `focus` 出现多个即唯一性冲突, 提示修正.

- **脚本** `skills/whatsnext/scripts/search_knowledge.py`(同为纯标准库只读)搜索 `.whatsnext/knowledge/` 各经验 frontmatter:

  ```bash
  python3 search_knowledge.py [--label hot] [--tags x ...]
  # => {"knowledge": [{"name","title","label","description"}]}
  ```

  `--label` 按分类(hot/core/ref)精确筛, `--tags` 在 tags 与 description 里模糊匹配; 供发现相关经验时快速定位, 命中后再读正文.

- **脚本** `skills/whatsnext/scripts/new_task.py`(`/wn-start` 调用, **会写文件**)建新任务骨架并接管 Focus:

  ```bash
  python3 new_task.py --category feat --name x --title "标题" [--tags a b] [--owner ...]
  # 建 tasks/feat/x/index.md(frontmatter + 标题), 清原 Focus 并置新任务 focus:true
  ```

  日期缺省取系统今天, `owner` 缺省读 `git config user.name`; 原 Focus 冲突(多个)时只新增不动原来的, 返回冲突交用户裁决. 之后 AI 补简述 / 文件索引 / origin / plan.
