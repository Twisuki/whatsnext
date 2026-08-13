---
name: wn
description: whatsnext 唯一智能入口. 无参给帮助与计划区现状; 带描述则按意图智能分诊, 可组合多动作完成. 不确定用哪个动作, 或想一句话交办时用.
argument-hint: [想做什么, 可选]
allowed-tools: Read(${CLAUDE_PLUGIN_ROOT}/**), Bash(python3 ${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/scripts/scan_tasks.py *)
---

**前置(幂等)**: 确保 whatsnext 契约已在上下文. 若本会话尚未装载(上下文里没有主 SKILL.md 的路由/契约内容), 先 Read `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/SKILL.md`; 已装载则直接进下一步.

用户描述(若有): $ARGUMENTS

装载后分两支:

**有描述** — 按主 SKILL.md 的"参数分诊"规则理解意图, 映射到一个或多个动作, 按序执行, 每步走对应 reference 的完整步骤(如"结束上一个任务再开新任务" = 先 finish 再 start). 组合动作靠各 reference 自身的 Focus 处理自然衔接, 不额外传递上下文.

**无描述** — 给总览与导航, 不臆测动作:

1. 一段话说明 whatsnext 是什么(跨 session 的私有 Markdown 计划区)与怎么用(`/wn` 交办 + 七个专一动作命令).
2. 列出命令清单:
   - `/wn` — 本入口: 智能交办 + 帮助
   - `/wn-init` — 初始化计划区
   - `/wn-start` — 开新任务
   - `/wn-resume` — 继续 / 恢复 / 列出任务
   - `/wn-save` — 保存进展
   - `/wn-finish` — 完成任务
   - `/wn-stop` — 搁置任务
   - `/wn-promote` — 沉淀经验
3. 报当前计划区状态: 有没有 `.whatsnext/tasks/` 目录; 有则调 `python3 ${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/scripts/scan_tasks.py --status active stopped` 读出活跃 + 搁置任务与当前 Focus(默认不列已完成的 done, 减少归档噪音; 用户明确要看全部再去掉筛选); 没有则提示可先 `/wn-init`.
