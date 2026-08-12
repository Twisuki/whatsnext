# whatsnext

一个私有, 轻量的 Claude Code skill: 用仓库内 git-ignored 的 `.whatsnext/` Markdown 计划区管理跨 session 的长期开发任务, 让新的 AI session 无需依赖历史对话即可恢复 `任务在做什么, 进展到哪, 下一步做什么`.

## 安装

在 Claude Code 里执行:

```
/plugin marketplace add Twisuki/whatsnext
/plugin install whatsnext@whatsnext-marketplace
```

新开一个 Claude Code session 即可加载, 用 `/context` 的 Skills 列表确认 `whatsnext` 出现.
