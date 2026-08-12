# frontmatter - 任务 index.md 元数据规范

任务 `index.md` 的 frontmatter 承载结构化元数据. 七字段全必需; 柔性体现在**取值可留空**(如 `tags: []`, `period` 末端 `***`), 而非省略字段. 类型与约束如下:

```ts
interface TaskFrontmatter {
  /**
   * @description 生命周期三态.
   *              active=进行中, done=已完成, stopped=已搁置.
   * @example "active"
   */
  status: "active" | "done" | "stopped";

  /**
   * @description 完成度粗估, 百分比字符串.
   * @example "20%"
   */
  progress: `${number}%`;

  /**
   * @description 开发周期, 起止绝对日期, 格式 `yyyy-MM-dd - yyyy-MM-dd`.
   *              结束未知用 `***` 占位.
   * @example "2026-08-12 - ***"
   * @example "2026-08-12 - 2026-08-20"
   */
  period: string;

  /**
   * @description 最近更新日期, 绝对日期 `yyyy-MM-dd`.
   * @example "2026-08-12"
   */
  updated: string;

  /**
   * @description 分支映射, 格式 `dev_branch -> origin_branch`(开发分支 -> 目标分支).
   *              分支未定可暂填计划名.
   * @example "feat-add-edit-page -> main"
   */
  branch: string;

  /**
   * @description 负责人. 私有单人计划区通常恒为本人.
   * @example "Twisuki"
   */
  owner: string;

  /**
   * @description 标签, 字符串数组. 无标签留空数组 `[]`.
   * @example ["支付", "H5"]
   * @example []
   */
  tags: string[];
}
```

## 完整示例

```yaml
---
status: active
progress: 20%
period: 2026-08-12 - ***
updated: 2026-08-12
branch: feat-add-edit-page -> main
owner: Twisuki
tags: []
---
```

柔性契约: 遇到明显缺漏(缺字段, 格式不合)**修复而非拒绝**, 不做 schema 校验.
