# index - 任务索引文件结构

## frontmatter

```ts
interface TaskFrontmatter {
	/** 状态: 进行中 | 已完成 | 已搁置 */
  status: "active" | "done" | "stopped";

	/** 开发周期: yyyy-MM-dd - yyyy-MM-dd, 或 yyyy-MM-dd - *** */
  period: string;

	/** 当前聚焦任务: 全局唯一, 若发现多个 true, 告知用户处理 */
  focus?: boolean;
}
```

## 结构

```index.md
---
status: active
period: 2026-08-12 - ***
focus: true
---

# 标题

简述本任务要做什么, 结论是什么.

## 文件

- [origin](origin.md) - 外部需求 / 沟通记录逐字存档

```
