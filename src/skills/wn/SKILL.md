---
name: wn
description: whatsnext 总入口. 列出所有 wn 命令与对应动作, 并预热 skill 上下文. 不确定用哪个动作时先运行.
allowed-tools: Read(${CLAUDE_PLUGIN_ROOT}/**)
---

读 `${CLAUDE_PLUGIN_ROOT}/skills/whatsnext/SKILL.md` 装载 whatsnext 的路由与契约, 然后:

1. 用一段话说明 whatsnext 是什么(跨 session 的私有 Markdown 计划区).
2. 列出命令清单与各自动作:
   - `/wn` — 本入口: 帮助 + 预热
   - `/wn-init` — 初始化计划区
   - `/wn-start` — 开新任务
   - `/wn-continue` — 继续 / 恢复 / 列出任务
   - `/wn-save` — 保存进展
   - `/wn-finish` — 完成任务
   - `/wn-stop` — 搁置任务
   - `/wn-promote` — 沉淀经验
3. 报当前仓库计划区现状: 有没有 `.whatsnext/tasks/index.md`, 若有则读出当前 Focus 与活跃任务; 没有则提示可先 `/wn-init`.

用户附加输入(若有): $ARGUMENTS

若带了参数, 按 SKILL.md 的"参数分诊"规则理解意图并转到对应动作(如"开始做登录页"转 start, "上次任务到哪了"转 continue); 无参才只做上面的总览与导航. 不擅自开任务或改文件.
