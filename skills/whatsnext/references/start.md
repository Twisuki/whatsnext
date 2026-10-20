# start - 开新任务

新建一个跨 session 的长期任务.

## 前置

先 [init](init.md) 确认已初始化, 若未初始化, 先初始化计划区.

## 结构

任务位于 `.whatsnext/tasks/<任务名>/`, 其中 `<任务名>` 可包含 `/` 分层, 提高可读性.

每个任务包含如下文件:

- index.md(必须): 任务索引, 有固定格式, 详见 [index](../assets/index.md)
- origin.md(可选): 需求原文, 若用户有详细输入则创建
- module.md(可选): 任务模块, 若任务分模块设计则创建, 复杂时可升级为 `modules/` 文件夹, 每个模块一个文件, 并 `modules/index.md` 索引
- plan.md(可选): 任务计划, 若任务分阶段, 且设计工作完成, 进入实施阶段则创建, 复杂时可升级成 `plans/` 文件夹, 每个阶段一个文件, 并 `plans/index.md` 索引
- 其他文件/文件夹(可选): 按任务需求按需创建

## 步骤

1. 使用 new_task.py 脚本创建任务骨架, 详见 [new_task](../scripts/new_task.md)
2. 补充 index.md 其他部分, 和任务对齐
3. 补充其他文档(若有)
