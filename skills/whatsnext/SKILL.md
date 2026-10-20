---
name: whatsnext
description: whatsnext skill(wn), 跨 session 任务管理 skill: 使用 git-ignored 的任务区整理文档, 使新 session 无需依赖历史对话即可恢复任务状态.
---

# whatsnext

## 前置

所有 `/wn*` 命令要保证本契约已在上下文, 契约不必重复装载.

## 原语

wn 负责管理 `任务 task` 和 `经验 knowledge`, 任务是跨 session 的, 经验是可复用的.

任务有 `status: active | done | stopped` 三态, 表示 `进行中 | 已完成 | 已搁置`.

任务有 `focus: boolean` 标记, 表示当前聚焦的任务, 全局唯一.

经验有 `label: "hot" | "core" | "ref"` 分类, 表示 `常用 | 核心 | 偶尔查阅`.

开发过程中, 聚焦于一个任务, 随时整理文档, 必要时读取经验, 任务完成后归档.

## 命令

whatsnext 命令如下:

- `/wn-init`: 初始化计划区, 详见 [init](references/init.md)
- `/wn-start`: 开新任务, 详见 [start](references/start.md)
- `/wn-resume`: 继续 / 恢复任务, 或列出任务, 详见 [resume](references/resume.md)
- `/wn-save`: 保存进展 / 交接当前 session, 详见 [save](references/save.md)
- `/wn-finish`: 完成任务并归档, 详见 [finish](references/finish.md)
- `/wn-stop`: 暂时搁置任务, 详见 [stop](references/stop.md)
- `/wn-promote`: 沉淀可复用的经验, 详见 [promote](references/promote.md)

此外还有 `/wn` 汇总命令:

- 若无参, 则说明 whatsnext 作用和用法, 展示任务状态(有无 `.whatsnext`, 有哪些任务, 哪个活跃)
- 若带参, 则根据描述智能分诊, 映射为单个或组合任务, 再根据对应 references 文档处理任务.
- 若参数不清或冲突, 询问用户具体意图.

## 示例

- `/wn 开始做登录页`: 进入 [start](references/start.md) 任务
- `/wn 昨天做到哪了`: 进入 [resume](references/resume.md) 任务
- `/wn 迁移 .plan 的任务到 wn`: 复杂任务, 先确认现状, 再 [init](references/init.md) 初始化, 再 [start](references/start.md) 把任务按格式迁移
- `/wn-resume 个人中心`: 进入 [resume](references/resume.md) 任务, 找到个人中心任务并恢复
- `/wn-finish 暂时搁置本任务`: 命令和描述冲突, 询问用户具体意图

## 脚本

- `scan_tasks.py`: 扫描任务, 详见 [scan_tasks](scripts/scan_tasks.md)
- `search_knowledge.py`: 搜索经验, 详见 [search_knowledge](scripts/search_knowledge.md)
- `new_task.py`: 创建新任务, 详见 [new_task](scripts/new_task.md)

## 结构

```text
.whatsnext/ - 使用 `.git/info/exclude` 排除的 wn 文件夹
  tasks/ - 任务区
    <文件夹>/<文件夹>/ - 任务文件夹
      index.md - 固定格式的任务索引文件
      <其他>.md - 按需命名的其他文档
  knowledge/ - 经验区
    <title>.md - 已验证可复用的一条经验
```

- 不维护索引: 每个任务的 index.md 作为索引, 不再维护总 index.md, 提供 `scan_tasks.py` 实时读取内容, 使用前阅读 [scan_tasks](scripts/scan_tasks.md).
- 分级任务名: 按分支或分类对任务文件夹进行分级, 如 `feat/xxx`, `refactor/xxx`, 便于查找.
- 跨仓库无感: 使用 `.git/info/exclude` 排除 `.whatsnext`, 而非 `.gitignore`, 避免污染仓库, 确保其他开发者对 wn 完全无感.
- 开任务阈值: 跨 session 的复杂任务, 一次性小任务不需要 wn.
