<div align="center">

# whatsnext skill

跨 session 任务管理 skill: 使用 git-ignored 的任务区整理文档, 使新 session 无需依赖历史对话即可恢复任务状态.

</div>

## 安装

```plain text
帮我安装 https://github.com/Twisuki/whatsnext 的 skill
```

### DeepSeek Harness (DSH)

仓库根目录同时是一个 DSH 插件包: `package.json` 声明 `dsh.bundle.patch`, `cordis.patch.yml` 把插件挂进 profile, `dsh-plugin/host.js` 注册 `/wn` 命令族.

```bash
dsh plugin --profile web add <本仓库绝对路径>
```

远程安装(仓库推到可访问的 git 地址后):

```bash
dsh plugin --profile web add github:Twisuki/whatsnext
```

重启 DSH 后, 输入 `/` 可看到 `wn` / `wn-init` / `wn-start` / `wn-resume` / `wn-save` / `wn-finish` / `wn-stop` / `wn-promote` 八条命令.

DSH 侧的实现细节:

- 共享正文 `skills/**` 未做 DSH 专用改动; 插件在提示词里注入适配: 把 `python` 指到本机真实解释器, 把文档里的相对脚本路径解析成绝对路径, 把 Read / Write / Edit / Bash 映射到 read / write / edit / pwsh.
- skill 目录优先取 `~/.dsh/skills`(含 `whatsnext/SKILL.md` 时), 缺失则回退包内 `skills/`.
- 脚本须以用户仓库根为 cwd 执行(脚本从 cwd 向上找 `.whatsnext`), 提示词会显式提醒.
- 自检: `npm run verify`; 已装到 profile 后 `node scripts/verify-mounted.mjs [profileDir]`.

## 使用

`/wn` 查看帮助, 任务管理, 或进行智能命令分诊, 例如: `/wn 开始做登录页`, `/wn 昨天做到哪了`.

此外还有如下具体命令:

- `/wn-init`: 初始化计划区
- `/wn-start`: 开新任务
- `/wn-resume`: 继续 / 恢复任务, 或列出任务
- `/wn-save`: 保存进展 / 交接当前 session
- `/wn-finish`: 完成任务并归档
- `/wn-stop`: 暂时搁置任务
- `/wn-promote`: 沉淀可复用的经验
