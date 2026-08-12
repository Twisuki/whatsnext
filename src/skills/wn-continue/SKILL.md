---
name: wn-continue
description: 继续 / 恢复 / 列出 whatsnext 任务. 新 session 无需历史对话即可复活任务, 也可重启已搁置任务.
argument-hint: [任务名, 可选]
allowed-tools: Read(${CLAUDE_PLUGIN_ROOT}/**)
---

读 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/references/continue.md`, 严格按其步骤继续 / 恢复 / 列出任务. 该文件是权威规范, 以它为准. 用户指定的任务(若有): $ARGUMENTS

若上述意图不属于本命令, 按 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/SKILL.md` 的"参数分诊"规则转到对应动作.
