---
name: wn-promote
description: 把任务里验证过的经验沉淀成 .whatsnext/knowledge/ 下可复用的项目经验. 经验满足三门槛时用.
allowed-tools: Read(${CLAUDE_PLUGIN_ROOT}/**)
---

读 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/references/promote.md`, 严格按其步骤沉淀经验. 该文件是权威规范, 以它为准.

用户附加输入(若有): $ARGUMENTS

若上述意图不属于本命令, 按 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/SKILL.md` 的"参数分诊"规则转到对应动作.
