---
name: wn-finish
description: 完成一个 whatsnext 任务, 归档到已归档表. 仅在用户明确表示任务已完成时用; 搁置走 /wn-stop.
argument-hint: [任务名, 可选]
allowed-tools: Read(${CLAUDE_PLUGIN_ROOT}/**)
---

读 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/references/finish.md`, 严格按其步骤完成任务. 该文件是权威规范, 以它为准. 用户指定的任务(若有): $ARGUMENTS

若上述意图不属于本命令, 按 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/SKILL.md` 的"参数分诊"规则转到对应动作.
