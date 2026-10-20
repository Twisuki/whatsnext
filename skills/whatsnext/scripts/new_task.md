# new_task - 创建新任务

创建新任务结构, 接管 focus.

## 使用

```bash
python skills/whatsnext/scripts/new_task.py
```

## 输入

```text
new_task.py --name "feat/x" --title "标题" [选项]

--name       任务名, 必需.
--title      标题正文, 必需.
--period-start  起始日期, 缺省=系统今天.
--period-end    结束日期, 缺省=***.
--root       .whatsnext 目录, 缺省自动查找.
```

## 输出

```text
{
  "created": "feat/x",
  "path": "...",
  "focus_changed_from": "feat/old" | null,
  "focus_now": "feat/x",
  "focus_conflict": ["a","b"] | [] # 若有多个 focus, 在这里返回
}
```
