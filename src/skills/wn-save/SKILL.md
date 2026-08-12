---
name: wn-save
description: 保存当前 session 的进展到 whatsnext 计划区, 供下个 session 无缝接续. 到达里程碑或 session 将结束时用.
allowed-tools: Read(${CLAUDE_PLUGIN_ROOT}/**)
---

读 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/references/save.md`, 严格按其步骤保存进展. 该文件是权威规范, 以它为准.

用户附加输入(若有): $ARGUMENTS

若上述意图不属于本命令, 按 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/SKILL.md` 的"参数分诊"规则转到对应动作.
