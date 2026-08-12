---
name: wn-init
description: 初始化当前仓库的 whatsnext 计划区(幂等). 开第一个任务前铺地基, 不新建任务.
allowed-tools: Read(${CLAUDE_PLUGIN_ROOT}/**)
---

读 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/references/init.md`, 严格按其步骤初始化本仓库的 whatsnext 计划区. 该文件是权威规范, 以它为准.

用户附加输入(若有): $ARGUMENTS

若上述输入的意图不属于本命令(init 只铺地基不建任务), 按 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/SKILL.md` 的"参数分诊"规则转到对应动作.
