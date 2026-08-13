# save - 保存进展 / 交接当前 session

把本 session 积累的理解落回 `.whatsnext/` 的文件, 让下一个 session 能靠 resume 无缝复活. save 是 resume 的镜像: resume 只读, save 只写. 核心是**克制**——只重写恢复含义确实变了的文档, 不无脑全刷, 不为做仪式打断有效工作.

## 1. 何时 save

- 到达里程碑, 或 session 将结束.
- 用户显式要求保存 / 交接.
- **有实质改动才 save**: 若这次什么恢复含义都没变(纯读, 纯讨论), 不产生 save, 也不刷任何日期.

## 2. 写什么 - 增量判断

逐个文件问"它的恢复含义变了吗", 变了才动. 没变的不碰.

**任务 `index.md`**
- **frontmatter**: `progress` 按实际推进更新; `status` 若发生流转则改(完成/搁置另见 finish / stop); `period` / `branch` 若变则更新; `updated` 只要本次 save 动了该任务任何文档, 就刷成**当天日期**(取真实当天, 不臆造).
- **标题与简述**: 仅当任务方向或结论变了才改; 日常推进通常不动.
- **文件索引**: 本 session 新建了兄弟文件才补登记一行.

**`plan.md`**(若有)
- 勾掉已完成项(`- [x]`, 可附结果 / 日期), 追加新暴露的待办, 废弃或改方向的项用删除线归档并注明原因与日期. 不重复 index 的目标.

**其余兄弟文件**(origin / findings / api / context 等)
- 只在本 session 产生了该文件负责的新内容时才写. origin 是存档, 一般只增不改.

**无根索引文件**
- whatsnext 不维护手写的 `tasks/index.md`. frontmatter 即真相, 任务列表 / 状态 / Focus 由 `scan_tasks.py` 扫描现算. save 只动 frontmatter 与兄弟文件, 没有"更新根索引"这一步.

## 3. 现实与文档对账

resume 恢复时若记下了"git 现实 vs 文档"的偏差(分支不符, 有未提交改动, 进度对不上), save 是消解它的授权时机: 核对当前仓库实况(可用脚本快照对照), 把 frontmatter 的 `branch` / `progress` 等更新到与现实一致. 这是 SKILL.md "现实与文档不符时, 下次授权保存再更新"的落点.

## 4. Focus 处理

- **默认不动 Focus**. Focus 是导航状态, 不该被每次 save 悄悄改写.
- 仅当用户本次明确在做另一个任务, 或明说"聚焦切到 X"时, 才改 frontmatter 的 `focus`: 目标任务加 `focus: true`, 原 Focus 任务去掉 `focus`. 同时只能一个 Focus(改完可调脚本确认 `focus` 只剩一个).

## 5. 边界

- **只写变化**: 不重写恢复含义没变的文档; save 不是全量快照.
- **不碰 git**: 整理 `.whatsnext` 绝不 add / commit / push / tag / publish, 除非用户明确要求.
- **不改状态语义**: save 只记录进展; 把任务置为已完成 / 已搁置分别走 finish / stop, 不在 save 里顺手改 `status` 到终态.
- **日期取真实当天**: 刷 `updated` / 填 `period` 用执行时的实际日期, 不臆造.
