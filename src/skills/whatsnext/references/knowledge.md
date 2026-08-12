# knowledge - 经验文件规范

已验证, 可复用, 自包含的项目经验, 一条一个文件, 扁平存放于 `.whatsnext/knowledge/<title>.md`(不分层, 不建索引). 每个文件承载**一条可独立检索, 独立应用**的正向指导.

frontmatter 四字段全必需. `title` / `tags` / `description` 供搜索, `label` 供分类:

```ts
interface KnowledgeFrontmatter {
  /**
   * @description 这条经验的标题, 点明结论. 与文件名 <title>.md 对应.
   * @example "支付宝唤端优先解析 scheme 而非执行 document.write"
   */
  title: string;

  /**
   * @description 单值分类标签, 枚举. hot=高频复用; core=核心约定; ref=偶尔查阅.
   *              取值可随需要扩充, 但同一条经验只归一类.
   * @example "hot"
   */
  label: "hot" | "core" | "ref";

  /**
   * @description 搜索标签, 字符串数组. 用自然的项目搜索词, 无则留空数组 `[]`.
   * @example ["支付", "H5", "唤端"]
   */
  tags: string[];

  /**
   * @description 简短描述, 供搜索时判断相关性. 比 title 稍展开, 说清适用场景.
   * @example "H5 内唤起支付宝客户端时, 安全抠取 alipays:// scheme 跳转, 避免 XSS."
   */
  description: string;
}
```

## 完整示例

```markdown
---
title: 支付宝唤端优先解析 scheme 而非执行 document.write
label: hot
tags: [支付, H5, 唤端]
description: H5 内唤起支付宝客户端时, 安全抠取 alipays:// scheme 跳转, 避免 XSS.
---

# 支付宝唤端优先解析 scheme 而非执行 document.write

<持久结论: 该怎么做, 为什么>

<应用所需的上下文: 在什么场景下适用>

<简短示例或步骤(如有用)>
```

## 正文规范

- **自包含**: 脱离产出它的任务也能读懂. 写清持久结论 + 应用上下文 + 简短示例 / 步骤. 源链接只辅助考古, 不能是唯一解释.
- **只放正向指导**: 进度, 失败尝试, 临时决策留在产出它的任务里, 不进 knowledge.
- **一文件一实践**: parts 能被独立选用 / 修改就拆成多个文件; 必须作为整体理解才合在一起.

柔性契约: 遇到明显缺漏(缺字段, 格式不合)修复而非拒绝, 不做 schema 校验.
