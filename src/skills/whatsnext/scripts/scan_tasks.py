#!/usr/bin/env python3
"""扫描 .whatsnext/tasks/ 下各任务 index.md 的 frontmatter, 汇总为 JSON.

whatsnext 的任务真相来源是各任务 index.md 的 frontmatter, 而非手写的根索引.
本脚本遍历 tasks/<分类>/<任务名>/index.md, 解析 frontmatter + 取正文首个 `#`
标题, 输出 {tasks, focus}. 只读, 不写任何文件.

用法:
    scan_tasks.py [--root DIR] [--status S ...] [--tags T ...]

    --root    .whatsnext 目录路径, 缺省从当前目录向上查找.
    --status  按状态筛选(可多值), 如 --status active stopped. 不传=全部.
    --tags    按 tags 模糊匹配(可多值). 不传=不按 tags 过滤.

输出(stdout, JSON):
    {
      "tasks": [{"dir": "feat/x", "status": "active", "title": "..."}, ...],
      "focus": ["feat/x"]   # focus:true 的 dir 列表. 空=无; 1=正常; 多=冲突
    }

纯 Python 标准库, 无第三方依赖.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

STATUSES = ("active", "done", "stopped")


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

    只处理本项目 frontmatter 用到的标量与内联数组(`[a, b]`), 不引第三方 YAML.
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


def first_heading(text: str) -> str:
    """取正文第一个 `# ` 行内容作为标题; 无则空串."""
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("# "):
            return s[2:].strip()
    return ""


def as_bool(val) -> bool:
    """frontmatter 布尔值柔性判定; 缺省/异常皆为 False."""
    if isinstance(val, bool):
        return val
    return str(val).strip().lower() in ("true", "yes", "on", "1")


def scan(tasks_dir: Path) -> list[dict]:
    """遍历 tasks/<分类>/<任务名>/index.md, 返回每个任务的解析结果."""
    results = []
    if not tasks_dir.is_dir():
        return results
    for index_md in sorted(tasks_dir.glob("*/*/index.md")):
        rel = index_md.parent.relative_to(tasks_dir)
        dir_str = rel.as_posix()  # "feat/x"
        text = index_md.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        results.append(
            {
                "dir": dir_str,
                "status": fm.get("status", ""),
                "title": first_heading(text),
                "tags": fm.get("tags", []) if isinstance(fm.get("tags"), list) else [],
                "focus": as_bool(fm.get("focus")),
            }
        )
    return results


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="扫描 whatsnext 任务 frontmatter 汇总为 JSON")
    ap.add_argument("--root", help=".whatsnext 目录路径(缺省自动向上查找)")
    ap.add_argument("--status", nargs="*", help="按状态筛选(可多值); 不传=全部")
    ap.add_argument("--tags", nargs="*", help="按 tags 模糊匹配(可多值); 不传=不过滤")
    args = ap.parse_args(argv)

    if args.root:
        wn = Path(args.root)
        if wn.name != ".whatsnext" and (wn / ".whatsnext").is_dir():
            wn = wn / ".whatsnext"
    else:
        wn = find_whatsnext(Path.cwd())

    if wn is None or not wn.is_dir():
        print(json.dumps({"error": "未找到 .whatsnext 目录", "tasks": [], "focus": []}, ensure_ascii=False))
        return 1

    raw = scan(wn / "tasks")

    # 筛选: --status 精确匹配集合; --tags 子串模糊匹配任一.
    status_filter = set(args.status) if args.status else None
    tag_filters = args.tags or None

    tasks = []
    focus = []
    for t in raw:
        if t["focus"]:
            focus.append(t["dir"])
        if status_filter is not None and t["status"] not in status_filter:
            continue
        if tag_filters is not None:
            hay = " ".join(t["tags"]).lower()
            if not any(f.lower() in hay for f in tag_filters):
                continue
        tasks.append({"dir": t["dir"], "status": t["status"], "title": t["title"]})

    print(json.dumps({"tasks": tasks, "focus": focus}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
