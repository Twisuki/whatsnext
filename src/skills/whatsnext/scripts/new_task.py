#!/usr/bin/env python3
"""脚手架: 建新任务目录 + index.md 骨架, 并接管 Focus.

/wn-start 调用. 与 scan_tasks.py / search_knowledge.py 不同, 本脚本**会写文件**:
建 .whatsnext/tasks/<分类>/<任务名>/index.md(frontmatter + 标题骨架), 并把新任务
置为 Focus(清掉原 Focus). 之后由 AI 补简述 / 文件索引 / origin / plan.

用法:
    new_task.py --category feat --name x --title "标题" [选项]

    --category   分类(feat/fix/refactor/docs), 必需.
    --name       任务名(短横线小写), 必需.
    --title      标题正文(# 分类/任务名 - <标题> 的 <标题>), 必需.
    --branch     分支映射, 缺省 <category>-<name> -> main.
    --tags       标签(可多值), 缺省空.
    --period-start  起始日期, 缺省=系统今天.
    --period-end    结束日期, 缺省=***.
    --owner      负责人, 缺省=git config user.name.
    --root       .whatsnext 目录, 缺省向上查找.

输出(stdout, JSON):
    {"created": "feat/x", "path": "...", "focus_changed_from": "feat/old"|null,
     "focus_now": "feat/x", "focus_conflict": ["a","b"]|[]}

纯 Python 标准库.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import date
from pathlib import Path

CATEGORIES = ("feat", "fix", "refactor", "docs")


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
    """判断一份 index.md 的 frontmatter 是否 focus: true."""
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
    """删除 frontmatter 里的 focus 行, 其余原样保留."""
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
            continue  # 丢弃该行
        out.append(line)
    return "".join(out)


def find_focus_tasks(tasks_dir: Path) -> list[tuple[str, Path]]:
    """扫现有各任务 index.md, 返回 focus:true 的 [(dir_str, path)] 列表."""
    found = []
    if not tasks_dir.is_dir():
        return found
    for index_md in sorted(tasks_dir.glob("*/*/index.md")):
        if has_focus_true(index_md.read_text(encoding="utf-8")):
            dir_str = index_md.parent.relative_to(tasks_dir).as_posix()
            found.append((dir_str, index_md))
    return found


def git_user_name() -> str:
    """读 git config user.name; 读不到返回空串."""
    try:
        r = subprocess.run(
            ["git", "config", "user.name"],
            capture_output=True, text=True, timeout=5,
        )
        if r.returncode == 0:
            return r.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        pass
    return ""


def build_index(category, name, title, branch, tags, period_start, period_end, owner, today):
    """组装 index.md 骨架文本."""
    tags_str = "[" + ", ".join(tags) + "]" if tags else "[]"
    return (
        "---\n"
        "status: active\n"
        "progress: 0%\n"
        f"period: {period_start} - {period_end}\n"
        f"updated: {today}\n"
        f"branch: {branch}\n"
        f"owner: {owner}\n"
        f"tags: {tags_str}\n"
        "focus: true\n"
        "---\n\n"
        f"# {category}/{name} - {title}\n\n"
        "<简述本任务要做什么, 结论 / 目标是什么——给未来自己 / AI 的最快恢复入口.>\n\n"
        "## 文件\n\n"
        "- [需求原文](./origin.md) — 外部需求 / 沟通记录逐字存档(有则建)\n"
        "- [推进计划](./plan.md) — 多阶段完成度清单(多阶段任务建)\n"
    )


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="建新任务骨架并接管 Focus")
    ap.add_argument("--category", required=True, choices=CATEGORIES)
    ap.add_argument("--name", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--branch")
    ap.add_argument("--tags", nargs="*")
    ap.add_argument("--period-start", dest="period_start")
    ap.add_argument("--period-end", dest="period_end")
    ap.add_argument("--owner")
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
    dir_str = f"{args.category}/{args.name}"
    task_dir = tasks_dir / args.category / args.name
    index_path = task_dir / "index.md"

    if index_path.exists():
        print(json.dumps({"error": f"任务已存在, 不覆盖: {dir_str}"}, ensure_ascii=False))
        return 1

    today = date.today().isoformat()
    period_start = args.period_start or today
    period_end = args.period_end or "***"
    branch = args.branch or f"{args.category}-{args.name} -> main"
    owner = args.owner or git_user_name()

    # Focus 接管: 先扫现有 focus.
    existing = find_focus_tasks(tasks_dir)
    focus_changed_from = None
    focus_conflict: list[str] = []
    if len(existing) == 1:
        # 原 focus 唯一: 清掉它, 新任务接管.
        old_dir, old_path = existing[0]
        old_path.write_text(strip_focus(old_path.read_text(encoding="utf-8")), encoding="utf-8")
        focus_changed_from = old_dir
    elif len(existing) > 1:
        # 冲突: 只新增, 不动原来的, 交用户裁决.
        focus_conflict = [d for d, _ in existing]

    # 建目录 + 写 index.md 骨架(新任务 focus: true).
    task_dir.mkdir(parents=True, exist_ok=True)
    index_path.write_text(
        build_index(args.category, args.name, args.title, branch,
                    args.tags or [], period_start, period_end, owner, today),
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
