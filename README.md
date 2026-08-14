# whatsnext

一个私有, 轻量的 Claude Code skill: 用仓库内 git-ignored 的 `.whatsnext/` Markdown 计划区管理跨 session 的长期开发任务, 让新的 AI session 无需依赖历史对话即可恢复 `任务在做什么, 进展到哪, 下一步做什么`.

## 安装

### Claude Code

在 Claude Code 里执行:

```
/plugin marketplace add Twisuki/whatsnext
/plugin install whatsnext@whatsnext-marketplace
```

使用 `/reload-plugin` 加载插件, 之后输入 `/wn` 观察到指令提示确认加载

### Codex CLI

本仓库自带 Codex marketplace(`whatsnext-local`). clone 后在 Codex 里执行:

```
codex plugin add whatsnext@whatsnext-local
```

新开一个 Codex 会话加载 skill, 之后输入 `/wn` 观察到指令提示确认加载.

## 使用

`/wn` 是唯一的智能入口, 也是新会话的起点:

- `/wn` — 无参: 说明 whatsnext 是什么 / 怎么用, 并报当前计划区状态(有无 `.whatsnext`, 有哪些任务, 哪个活跃).
- `/wn 描述` — 带参: 按描述智能分诊, 可组合多动作按序完成(如 `结束上一个任务再开个重构任务`).

七个动作命令**专一**, 各只做一件事; 带了不属于自己的意图时只提示改用 `/wn`, 不代跑:

- `/wn-init`: 初始化计划区(幂等, 开第一个任务前铺地基)
- `/wn-start`: 开新任务
- `/wn-resume`: 继续 / 恢复 / 列出任务, 重启已搁置任务
- `/wn-save`: 保存进展 / 交接当前 session
- `/wn-finish`: 完成任务并归档
- `/wn-stop`: 搁置任务(可逆)
- `/wn-promote`: 把验证过的经验沉淀到 `.whatsnext/knowledge/`
