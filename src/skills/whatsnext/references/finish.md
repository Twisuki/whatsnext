# finish - 完成任务

任务正常终结: 活干完了, 把 `status` 落到 `done`, 文件留原地. 与搁置(主动暂停 / 放弃)语义不同, 那走 [stop.md](stop.md). 无根索引文件——"归档"= 改 frontmatter 的 status, 之后脚本按 status 过滤自然把它排除出活跃列表, 无需搬任何表行.

终态基本单向(done 之后一般不回退), 所以落 done 前先把关, 再收尾, 再归档.

## 1. 完成把关

确认任务真的完成, 不是每次 save 都能升级成 finish:

- 目标达成, 简述里说的事做完了.
- `plan.md`(若有)待办清空: 剩余未勾项要么已完成, 要么明确不做——**不做的用删除线归档并注明原因**, 不留模糊未决项.
- 若还有想做但这次不做的事, 那不是 finish, 是 stop(搁置)或另开任务.

## 2. 收尾写入

先按 [save.md](save.md) 把最后进展落盘(增量判断, 只写变化), 再做归档专属的状态流转, 避免重复 save 的写入细节.

## 3. 状态流转(finish 独有)

只改任务 `index.md` frontmatter, 不动别处:

- `status`: `active` → `done`.
- `progress`: 归到 `100%`.
- `period`: 结束端从 `***` 落成完成日期(取真实当天), 如 `2026-08-12 - 2026-08-20`.
- `updated`: 刷成当天日期.
- `focus`: 若该任务是当前 Focus, 去掉 `focus` 字段(或置 false)——见第 4 节.

改完 status 即"归档": 脚本 `scan_tasks.py --status active` 不再列出它, 文件留原地不删不移.

## 4. Focus 处理

- 若被 finish 的任务正是当前 Focus, 去掉其 frontmatter 的 `focus` 后 Focus 悬空: **提示用户下一个聚焦谁**, 不自行挑选(与 resume 的"Focus 缺失不擅自挑一个"一致). 不把 `focus` 转移到别的任务。
- 若被 finish 的任务不是当前 Focus(其 frontmatter 本就无 focus), Focus 不受影响.

## 边界

- **不碰 git**: 整理 `.whatsnext` 绝不 add / commit / push, 除非用户明确要求.
- **终态单向**: 除非用户明确要重开, 不把 `done` 改回 `active`.
- **日期取真实当天**: `period` 结束端与 `updated` 用执行时的实际日期, 不臆造.
