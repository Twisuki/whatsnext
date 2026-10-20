# search_knowledge - 搜索经验

搜索经验.

## 使用

```bash
python skills/whatsnext/scripts/search_knowledge.py
```

## 输入

```text
search_knowledge.py [--root DIR] [--label L] [--tags T ...]

--root    .whatsnext 目录路径, 缺省自动查找.
--label   按分类精确筛选(hot/core/ref), 不传=全部.
--tags    模糊匹配(可多值), 命中 tags 或 description, 不传=不过滤.
```

## 输出

```text
{
  "knowledge": [
    {
      "name": "...",
      "title": "...",
      "label": "...",
      "description": "..."
    }
  ]
}
```
