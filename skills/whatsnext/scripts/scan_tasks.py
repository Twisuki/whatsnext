from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

STATUSES = ("active", "done", "stopped")


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
        fm[key.strip()] = raw.strip().strip("'\"")
    return fm


def first_heading(text: str) -> str:
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("# "):
            return s[2:].strip()
    return ""


def as_bool(val) -> bool:
    if isinstance(val, bool):
        return val
    return str(val).strip().lower() in ("true", "yes", "on", "1")


def scan(tasks_dir: Path) -> list[dict]:
    results = []
    if not tasks_dir.is_dir():
        return results
    for index_md in sorted(tasks_dir.glob("*/*/index.md")):
        rel = index_md.parent.relative_to(tasks_dir)
        dir_str = rel.as_posix()
        text = index_md.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        results.append({
            "dir": dir_str,
            "status": fm.get("status", ""),
            "title": first_heading(text),
            "focus": as_bool(fm.get("focus")),
        })
    return results


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="扫描 whatsnext 任务 frontmatter 汇总为 JSON")
    ap.add_argument("--root", help=".whatsnext 目录路径(缺省自动向上查找)")
    ap.add_argument("--status", nargs="*", help="按状态筛选(可多值); 不传=全部")
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
    status_filter = set(args.status) if args.status else None

    tasks = []
    focus = []
    for t in raw:
        if t["focus"]:
            focus.append(t["dir"])
        if status_filter is not None and t["status"] not in status_filter:
            continue
        tasks.append({"dir": t["dir"], "status": t["status"], "title": t["title"]})

    print(json.dumps({"tasks": tasks, "focus": focus}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
