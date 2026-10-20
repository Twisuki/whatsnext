# knowledge - 经验文件结构

## 命名

`<title>.md`, title 为纯 ascii, 使用 `-` 连接单词, 全小写, 尽可能短.

## frontmatter

```ts
interface KnowledgeFrontmatter {
  /** 标题, 注意不是文件名 */
	title: string;

	/** 分类标签: 常用 | 核心 | 偶尔查阅 */
	label: "hot" | "core" | "ref";

	/** 搜索标签 */
	tags: string[];

	/** 简短描述 */
	description: string;
}
```

## 结构

```use-ascii-characters.md
---
title: 使用 ascii 字符
label: hot
tags: [标点, 字符, ascii]
description: 文档中使用 ascii 字符, 即使是非英文文档也使用 ascii 的标点符号.
---

# 使用 ascii 字符

<正文>
```
