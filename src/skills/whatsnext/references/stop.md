# stop - 搁置任务

任务主动暂停或放弃: 把 `status` 落到 `stopped`, 文件留原地. 与正常完成语义不同, 那走 [finish.md](finish.md). 无根索引文件——"归档"= 改 frontmatter 的 status, 脚本按 status 过滤自然把它排除出活跃列表.

stop 是**可逆**的: 搁置的任务日后可重启回 active(见第 5 节). 所以重点不是把关完成, 而是记清"为什么停, 满足什么条件能重启".

## 1. 记录搁置原因(stop 独有)

在任务 `index.md` 简述或 `plan.md` 里, 留一段搁置说明, 带绝对日期:

- **为什么停**: 阻塞在什么(等外部依赖 / 等他人 / 需求待定), 还是暂时让位于更紧急的任务.
- **重启条件**: 满足什么就能捡回来继续.

这是未来 resume 恢复时判断"能不能, 要不要重启"的依据, 别省.

## 2. 收尾写入

先按 [save.md](save.md) 把当前进展落盘(增量判断, 只写变化), 再做归档专属的状态流转, 避免重复 save 的写入细节.

## 3. 状态流转(stop 独有)

只改任务 `index.md` frontmatter:

- `status`: `active` → `stopped`.
- `progress`: **保留当前值**, 如实反映半途进度, 不归 100%.
- `period`: 结束端**保留 `***`**——搁置不是终结, 结束未定; 搁置时点由 `updated` + 原因记录承载.
- `updated`: 刷成当天日期.
- `focus`: 若该任务是当前 Focus, 去掉 `focus` 字段(或置 false)——见第 4 节.

改完 status 即"归档": 脚本 `scan_tasks.py --status active` 不再列出它, 文件留原地.

## 4. Focus 处理

- 若被 stop 的任务正是当前 Focus, 去掉其 frontmatter 的 `focus` 后 Focus 悬空: **提示用户下一个聚焦谁**, 不自行挑选(与 resume 的"Focus 缺失不擅自挑一个"一致).
- 若被 stop 的任务不是当前 Focus, Focus 不受影响.

## 边界

- **不碰 git**: 整理 `.whatsnext` 绝不 add / commit / push, 除非用户明确要求.
- **可逆**: stopped 不是终态, 日后可由 [resume.md](resume.md) 恢复并重启; 与 finish 的 `done` 单向不同. stop 只负责搁置, 重启是 resume 的事.
- **日期取真实当天**: `updated` 与原因记录里的日期用执行时的实际日期, 不臆造.
