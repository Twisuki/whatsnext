#!/usr/bin/env python3
"""搜索 .whatsnext/knowledge/ 下各经验文件的 frontmatter, 汇总为 JSON.

whatsnext 的经验(knowledge)一条一文件, 扁平存于 knowledge/*.md, frontmatter 带
title/label/tags/description. 本脚本扫描它们, 按 label 筛 + tags 模糊匹配, 输出候选
供 LLM 快速定位, 免逐个开文件. 与 scan_tasks.py 对称: 只读, 不写.

用法:
    search_knowledge.py [--root DIR] [--label L] [--tags T ...]

    --root    .whatsnext 目录路径, 缺省从当前目录向上查找.
    --label   按分类精确筛选(hot/core/ref). 不传=全部.
    --tags    模糊匹配(可多值), 命中 tags 数组或 description 子串(大小写不敏感).
              不传=不按 tags 过滤.

输出(stdout, JSON):
    {"knowledge": [{"name", "title", "label", "description"}, ...]}

纯 Python 标准库, 无第三方依赖.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def find_whatsnext(start: Path) -> Path | None:
    """从 start 向上找 .whatsnext 目录; start 本身若是 .whatsnext 也接受."""
    start = start.resolve()
    for d in (start, *start.parents):
        if d.name == ".whatsnext" and d.is_dir():
            return d
        cand = d / ".whatsnext"
        if cand.is_dir():
            return cand
    return None


def parse_frontmatter(text: str) -> dict:
    """极简 YAML frontmatter 解析: 取首个 `---`...`---` 块内的 key: value.

    只处理标量与内联数组(`[a, b]`), 不引第三方 YAML.
    柔性: 无 frontmatter 或字段缺失都不报错, 返回能解析到的部分.
    """
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}
    fm: dict = {}
    for line in lines[1:]:
        if line.strip() == "---":
            break
        if ":" not in line:
            continue
        key, _, raw = line.partition(":")
        key = key.strip()
        val = raw.strip()
        if val.startswith("[") and val.endswith("]"):
            inner = val[1:-1].strip()
            fm[key] = [x.strip().strip("'\"") for x in inner.split(",") if x.strip()]
        else:
            fm[key] = val.strip("'\"")
    return fm


def scan(knowledge_dir: Path) -> list[dict]:
    """遍历 knowledge/*.md(扁平, 非嵌套), 返回每条经验的解析结果."""
    results = []
    if not knowledge_dir.is_dir():
        return results
    for md in sorted(knowledge_dir.glob("*.md")):
        fm = parse_frontmatter(md.read_text(encoding="utf-8"))
        tags = fm.get("tags", [])
        results.append(
            {
                "name": md.stem,
                "title": fm.get("title", ""),
                "label": fm.get("label", ""),
                "description": fm.get("description", ""),
                "_tags": tags if isinstance(tags, list) else [],
            }
        )
    return results


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="搜索 whatsnext knowledge frontmatter 汇总为 JSON")
    ap.add_argument("--root", help=".whatsnext 目录路径(缺省自动向上查找)")
    ap.add_argument("--label", help="按分类精确筛选(hot/core/ref); 不传=全部")
    ap.add_argument("--tags", nargs="*", help="模糊匹配(可多值), 命中 tags 或 description; 不传=不过滤")
    args = ap.parse_args(argv)

    if args.root:
        wn = Path(args.root)
        if wn.name != ".whatsnext" and (wn / ".whatsnext").is_dir():
            wn = wn / ".whatsnext"
    else:
        wn = find_whatsnext(Path.cwd())

    if wn is None or not wn.is_dir():
        print(json.dumps({"error": "未找到 .whatsnext 目录", "knowledge": []}, ensure_ascii=False))
        return 1

    raw = scan(wn / "knowledge")

    tag_filters = args.tags or None

    out = []
    for k in raw:
        if args.label is not None and k["label"] != args.label:
            continue
        if tag_filters is not None:
            hay = " ".join(k["_tags"] + [k["description"]]).lower()
            if not any(f.lower() in hay for f in tag_filters):
                continue
        out.append(
            {
                "name": k["name"],
                "title": k["title"],
                "label": k["label"],
                "description": k["description"],
            }
        )

    print(json.dumps({"knowledge": out}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
