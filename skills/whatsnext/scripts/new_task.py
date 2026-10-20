from __future__ import annotations

import argparse
import json
import sys
from datetime import date
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


def has_focus_true(text: str) -> bool:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return False
    for line in lines[1:]:
        if line.strip() == "---":
            break
        key, _, raw = line.partition(":")
        if key.strip() == "focus":
            return raw.strip().strip("'\"").lower() in ("true", "yes", "on", "1")
    return False


def strip_focus(text: str) -> str:
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        return text
    out = [lines[0]]
    in_fm = True
    for line in lines[1:]:
        if in_fm and line.strip() == "---":
            in_fm = False
            out.append(line)
            continue
        if in_fm and line.partition(":")[0].strip() == "focus":
            continue
        out.append(line)
    return "".join(out)


def find_focus_tasks(tasks_dir: Path) -> list[tuple[str, Path]]:
    found = []
    if not tasks_dir.is_dir():
        return found
    for index_md in sorted(tasks_dir.glob("*/*/index.md")):
        if has_focus_true(index_md.read_text(encoding="utf-8")):
            dir_str = index_md.parent.relative_to(tasks_dir).as_posix()
            found.append((dir_str, index_md))
    return found


def build_index(name: str, title: str, period_start: str, period_end: str) -> str:
    return (
        "---\n"
        "status: active\n"
        f"period: {period_start} - {period_end}\n"
        "focus: true\n"
        "---\n\n"
        f"# {name} - {title}\n\n"
        "<简述本任务要做什么, 结论 / 目标是什么——给未来自己 / AI 的最快恢复入口.>\n"
    )


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="建新任务骨架并接管 Focus")
    ap.add_argument("--name", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--period-start", dest="period_start")
    ap.add_argument("--period-end", dest="period_end")
    ap.add_argument("--root")
    args = ap.parse_args(argv)

    if args.root:
        wn = Path(args.root)
        if wn.name != ".whatsnext" and (wn / ".whatsnext").is_dir():
            wn = wn / ".whatsnext"
    else:
        wn = find_whatsnext(Path.cwd())
    if wn is None or not wn.is_dir():
        print(json.dumps({"error": "未找到 .whatsnext 目录"}, ensure_ascii=False))
        return 1

    tasks_dir = wn / "tasks"
    dir_str = args.name
    task_dir = tasks_dir / args.name
    index_path = task_dir / "index.md"

    if index_path.exists():
        print(json.dumps({"error": f"任务已存在, 不覆盖: {dir_str}"}, ensure_ascii=False))
        return 1

    today = date.today().isoformat()
    period_start = args.period_start or today
    period_end = args.period_end or "***"

    existing = find_focus_tasks(tasks_dir)
    focus_changed_from = None
    focus_conflict: list[str] = []
    if len(existing) == 1:
        old_dir, old_path = existing[0]
        old_path.write_text(strip_focus(old_path.read_text(encoding="utf-8")), encoding="utf-8")
        focus_changed_from = old_dir
    elif len(existing) > 1:
        focus_conflict = [d for d, _ in existing]

    task_dir.mkdir(parents=True, exist_ok=True)
    index_path.write_text(
        build_index(args.name, args.title, period_start, period_end),
        encoding="utf-8",
    )

    result = {
        "created": dir_str,
        "path": str(index_path),
        "focus_changed_from": focus_changed_from,
        "focus_now": dir_str,
        "focus_conflict": focus_conflict,
    }
    if focus_conflict:
        result["note"] = (
            f"原有多个 focus({', '.join(focus_conflict)}), 已只新增本任务的 focus 未动原来的; "
            "现存在多个 focus, 请让用户裁决保留哪个."
        )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
