---
name: wn-start
description: 开一个跨 session 的长期任务. 在 .whatsnext/tasks/ 建落脚点并接管 Focus. 用户要开始需持久交接的任务时用.
argument-hint: [任务描述]
allowed-tools: Read(${CLAUDE_PLUGIN_ROOT}/**), Bash(python3 ${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/scripts/scan_tasks.py *), Bash(python3 ${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/scripts/search_knowledge.py *)
---

**前置(幂等)**: 确保 whatsnext 契约已在上下文. 若本会话尚未装载, 先 Read `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/SKILL.md`; 已装载则直接进下一步.

读 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/references/start.md`, 严格按其步骤开新任务. 该文件是权威规范, 以它为准. 用户输入的任务描述: $ARGUMENTS

本命令专一, 只做开新任务. 若参数意图不属于本动作, 不代跑, 只提示用户改用 `/wn`(智能分诊)或正确的 `/wn-*`.
