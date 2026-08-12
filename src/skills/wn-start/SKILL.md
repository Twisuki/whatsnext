---
name: wn-start
description: 开一个跨 session 的长期任务. 在 .whatsnext/tasks/ 建落脚点并接管 Focus. 用户要开始需持久交接的任务时用.
argument-hint: [任务描述]
allowed-tools: Read(${CLAUDE_PLUGIN_ROOT}/**)
---

读 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/references/start.md`, 严格按其步骤开新任务. 该文件是权威规范, 以它为准. 用户输入的任务描述: $ARGUMENTS

若上述意图不属于本命令, 按 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/SKILL.md` 的"参数分诊"规则转到对应动作.
