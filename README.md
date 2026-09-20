# whatsnext

一个私有, 轻量的 skill: 用仓库内 git-ignored 的 `.whatsnext/` Markdown 计划区管理跨 session 的长期开发任务, 让新的 AI session 无需依赖历史对话即可恢复 `任务在做什么, 进展到哪, 下一步做什么`.

同一份 skill 正文(`src/skills/**`)供三种 agent 使用: Claude Code、Codex CLI、DeepSeek Harness(DSH). 各自的安装入口不同, 正文不复制.

## 安装

### Claude Code

在 Claude Code 里执行:

```
/plugin marketplace add Twisuki/whatsnext
/plugin install whatsnext@whatsnext-marketplace
```

使用 `/reload-plugin` 加载插件, 之后输入 `/wn` 观察到指令提示确认加载

### Codex CLI

本仓库自带 Codex marketplace(`whatsnext-local`). clone 后在 Codex 里执行:

```
codex plugin add whatsnext@whatsnext-local
```

新开一个 Codex 会话加载 skill, 之后输入 `/wn` 观察到指令提示确认加载.

### DeepSeek Harness (DSH)

本仓库根目录本身就是一个 DSH 插件包(`whatsnext-dsh`): `package.json` 声明 `dsh.bundle.patch`, `cordis.patch.yml` 把插件行插进 profile 的 bundle 层, `src/dsh-plugin/host.js` 注册 `/wn` 命令族.

本机安装(clone 后, 把路径换成你自己的仓库绝对路径):

```
dsh plugin --profile web add <你的项目地址>
```

远程安装(仓库已推到可访问的 git 地址时):

```
dsh plugin --profile web add github:Twisuki/whatsnext
```

把 `web` 换成你要用的 profile 名(如 `tui`、`headless`). 该命令在 profile 目录里跑 pnpm, 因此需要本机有 `pnpm`; 装完 `dsh plugin` 会自动因 `dsh.bundle.patch` 把 `whatsnext-dsh` 追加进 profile 的 `dsh.profile.bundles`.

重启 DSH(`dsh web`)后, 在输入框敲 `/` 应能看到 `wn` / `wn-init` / `wn-start` / `wn-resume` / `wn-save` / `wn-finish` / `wn-stop` / `wn-promote` 八条命令.

不用 pnpm 时的手工挂载(两步都做):

1. 在 `~/.dsh/profiles/<profile>/package.json` 的 `dependencies` 里加 `"whatsnext-dsh": "link:<本仓库绝对路径>"`, 并跑一次 `pnpm install`;
2. 在 `~/.dsh/profiles/<profile>/cordis.patch.yml` 里加:

```yaml
- insert:
    - id: whatsnext-commands
      name: whatsnext-dsh
```

DSH 侧的实现细节:

- skill 正文就是 `src/skills/**`, 未做任何 DSH 专用改动; 插件在提示词里注入适配信息(把 `${CLAUDE_PLUGIN_ROOT}` 换成真实绝对路径, 把 `python3` 指到本机真实解释器, 把 Read/Bash 映射到 DSH 的 read/pwsh).
- skill 目录优先取 `~/.dsh/skills/whatsnext`(自行放置时可覆盖), 缺失则回退包内 `src/skills/whatsnext`.
- 解释器探测: 按 PATH 里的 `python3` → `python` → `py -3` → 常见安装目录顺序, 实跑一次验证, 只认真正可用的解释器; 都找不到时提示词会引导模型走 skill 里写明的"无 python 回退"(纯手工读写 Markdown).
- 自检: `npm run verify`(不需要 DSH 运行时, 校验 bundle 契约、命令表、skill 文件完备性与提示词注入); 已装到某个 profile 后, `node scripts/verify-mounted.mjs [profileDir]` 再用真实的 profile 解析路径 import 一遍插件, 并用 mock context 跑一次注册与提示词投递.

## 使用

`/wn` 是唯一的智能入口, 也是新会话的起点:

- `/wn` — 无参: 说明 whatsnext 是什么 / 怎么用, 并报当前计划区状态(有无 `.whatsnext`, 有哪些任务, 哪个活跃).
- `/wn 描述` — 带参: 按描述智能分诊, 可组合多动作按序完成(如 `结束上一个任务再开个重构任务`).

七个动作命令**专一**, 各只做一件事; 带了不属于自己的意图时只提示改用 `/wn`, 不代跑:

- `/wn-init`: 初始化计划区(幂等, 开第一个任务前铺地基)
- `/wn-start`: 开新任务
- `/wn-resume`: 继续 / 恢复 / 列出任务, 重启已搁置任务
- `/wn-save`: 保存进展 / 交接当前 session
- `/wn-finish`: 完成任务并归档
- `/wn-stop`: 搁置任务(可逆)
- `/wn-promote`: 把验证过的经验沉淀到 `.whatsnext/knowledge/`
