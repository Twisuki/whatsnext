from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def find_whatsnext(start: Path) -> Path | None:
    start = start.resolve()
    for d in (start, *start.parents):
        if d.name == ".whatsnext" and d.is_dir():
            return d
        cand = d / ".whatsnext"
        if cand.is_dir():
            return cand
    return None


def parse_frontmatter(text: str) -> dict:
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
    results = []
    if not knowledge_dir.is_dir():
        return results
    for md in sorted(knowledge_dir.glob("*.md")):
        fm = parse_frontmatter(md.read_text(encoding="utf-8"))
        tags = fm.get("tags", [])
        results.append({
            "name": md.stem,
            "title": fm.get("title", ""),
            "label": fm.get("label", ""),
            "description": fm.get("description", ""),
            "_tags": tags if isinstance(tags, list) else [],
        })
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
        out.append({
            "name": k["name"],
            "title": k["title"],
            "label": k["label"],
            "description": k["description"],
        })

    print(json.dumps({"knowledge": out}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
