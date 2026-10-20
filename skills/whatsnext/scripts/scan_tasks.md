# scan_tasks - 扫描任务

扫描任务.

## 使用

```bash
python skills/whatsnext/scripts/scan_tasks.py
```

## 输入

```text
scan_tasks.py [--root DIR] [--status S ...]

--root    .whatsnext 目录路径, 缺省向上查找.
--status  按状态筛选(可多值), 不传=全部.
```

## 输出

```text
{
  "tasks": [
    {
      "dir": "feat/x",
      "status": "...",
      "title": "..."
    }
  ],
  "focus": ["feat/x"]
}
```
