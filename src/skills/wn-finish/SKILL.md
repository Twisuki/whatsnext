---
name: wn-finish
description: 完成一个 whatsnext 任务, 归档到已归档表. 仅在用户明确表示任务已完成时用; 搁置走 /wn-stop.
argument-hint: [任务名, 可选]
allowed-tools: Read(${CLAUDE_PLUGIN_ROOT}/**)
---

**前置(幂等)**: 确保 whatsnext 契约已在上下文. 若本会话尚未装载, 先 Read `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/SKILL.md`; 已装载则直接进下一步.

读 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/references/finish.md`, 严格按其步骤完成任务. 该文件是权威规范, 以它为准. 用户指定的任务(若有): $ARGUMENTS

本命令专一, 只做完成归档. 若参数意图不属于本动作, 不代跑, 只提示用户改用 `/wn`(智能分诊)或正确的 `/wn-*`.
