---
name: wn-promote
description: 把任务里验证过的经验沉淀成 .whatsnext/knowledge/ 下可复用的项目经验. 经验满足三门槛时用.
allowed-tools: Read(${CLAUDE_PLUGIN_ROOT}/**), Bash(python3 ${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/scripts/search_knowledge.py *)
---

**前置(幂等)**: 确保 whatsnext 契约已在上下文. 若本会话尚未装载, 先 Read `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/SKILL.md`; 已装载则直接进下一步.

读 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/references/promote.md`, 严格按其步骤沉淀经验. 该文件是权威规范, 以它为准.

用户附加输入(若有): $ARGUMENTS

本命令专一, 只做经验沉淀. 若参数意图不属于本动作, 不代跑, 只提示用户改用 `/wn`(智能分诊)或正确的 `/wn-*`.
