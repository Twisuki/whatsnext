---
name: wn-stop
description: 搁置一个 whatsnext 任务(可逆), 记录搁置原因与重启条件并归档. 仅在用户明确要暂停 / 放弃任务时用.
argument-hint: [任务名, 可选]
allowed-tools: Read(${CLAUDE_PLUGIN_ROOT}/**)
---

读 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/references/stop.md`, 严格按其步骤搁置任务. 该文件是权威规范, 以它为准. 用户指定的任务(若有): $ARGUMENTS

若上述意图不属于本命令, 按 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/SKILL.md` 的"参数分诊"规则转到对应动作.
