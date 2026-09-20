/**
 * whatsnext 的 DeepSeek Harness 宿主层(DSH 侧薄壳).
 *
 * 事实源仍是一份共享的 skill 正文 `src/skills/**`(Claude Code / Codex 用同一份,
 * 本插件的 patch 不复制它们): 命令 handler 只负责
 *
 *   1. 解析出 skill 目录的绝对路径(用户级 ~/.dsh/skills/whatsnext 优先, 包内
 *      src/skills/whatsnext 回退), 把正文里所有 `${CLAUDE_PLUGIN_ROOT}` 占位
 *      换成这个真实路径;
 *   2. 探测本机真实可用的 Python 解释器绝对路径(skill 正文写的是 `python3`,
 *      Windows 上常只有 `python` / `py -3`, 且 PATH 里的 python3 可能是应用商店
 *      假壳), 把解释器路径 + "python3 即此解释器"的适配说明注入提示词;
 *   3. 把用户的原始输入(参数)与命令对应的 reference 文件路径一并交给主模型.
 *
 * skill 正文本身不做任何改动 —— 适配信息全在提示词里, 因此 Claude Code /
 * Codex 的既有路径零回归.
 *
 * @module whatsnext-dsh
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 插件服务名. */
const name = 'whatsnext-commands';

/** 需要的宿主服务: 斜杠命令注册表. */
const inject = ['commands'];

/** 本文件所在目录(src/dsh-plugin)的上一级 = 包根. */
const PACKAGE_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

/** 包内随附的 skill 目录(skill 正文的随包副本). */
const BUNDLED_SKILL_DIR = join(PACKAGE_ROOT, 'src', 'skills', 'whatsnext');

/** skill 正文的通用回退文案(读取失败时用). */
const SKILL_DIR_LABEL = BUNDLED_SKILL_DIR;

/**
 * 命令表. `reference` 为 null 表示入口命令(读主 SKILL.md 自行分诊).
 * `action` 是写进提示词的中文动作名, 只用于"专一"约束的措辞.
 */
const COMMANDS = {
  wn: { reference: null, action: '智能分诊与总览' },
  'wn-init': { reference: 'init.md', action: '初始化计划区' },
  'wn-start': { reference: 'start.md', action: '开新任务' },
  'wn-resume': { reference: 'resume.md', action: '继续 / 恢复任务' },
  'wn-save': { reference: 'save.md', action: '保存进展' },
  'wn-finish': { reference: 'finish.md', action: '完成任务' },
  'wn-stop': { reference: 'stop.md', action: '搁置任务' },
  'wn-promote': { reference: 'promote.md', action: '沉淀经验' },
};

/** 读取 skill 失败时的兜底描述(正常情况下读 frontmatter 的 description). */
const FALLBACK_DESCRIPTIONS = {
  wn: 'whatsnext 唯一智能入口: 无参给帮助与计划区现状, 带描述按意图智能分诊',
  'wn-init': '初始化当前仓库的 whatsnext 计划区(幂等), 不新建任务',
  'wn-start': '开一个跨 session 的长期任务并接管 Focus',
  'wn-resume': '继续 / 恢复 / 列出任务, 重启已搁置任务',
  'wn-save': '保存进展 / 交接当前 session',
  'wn-finish': '完成任务并归档',
  'wn-stop': '搁置任务(可逆)',
  'wn-promote': '把验证过的经验沉淀到 .whatsnext/knowledge/',
};

/**
 * 解析一个 frontmatter 块里的顶层标量键, 支持 `key: value` 与
 * `key: >-` / `key: |` 折叠块(description 常用后者).
 * @param {string} text - 文件全文.
 * @returns {Record<string, string>} 键值表(值已去掉引号与首尾空白).
 */
function parseFrontmatter(text) {
  const out = {};
  if (typeof text !== 'string') return out;
  const lines = text.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== '---') return out;
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === '---') break;
    const match = /^([A-Za-z0-9_-]+):(.*)$/.exec(line);
    if (match === null) continue;
    const key = match[1];
    const rawValue = match[2].trim();
    const block = /^([>|])[+-]?$/.exec(rawValue);
    if (block !== null) {
      const parts = [];
      for (let j = i + 1; j < lines.length; j += 1) {
        const next = lines[j];
        if (next.trim() === '---' || /^[A-Za-z0-9_-]+:/.test(next)) break;
        if (next.trim() !== '') parts.push(next.trim());
        i = j;
      }
      out[key] = parts.join(block[1] === '>' ? ' ' : '\n');
      continue;
    }
    out[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
  return out;
}

/**
 * 读一份 skill 的 frontmatter description.
 * @param {string} file - SKILL.md 绝对路径.
 * @returns {string} description, 读不到则空串.
 */
function readSkillDescription(file) {
  try {
    return parseFrontmatter(readFileSync(file, 'utf8')).description ?? '';
  } catch {
    return '';
  }
}

/**
 * 解析最终生效的 skill 目录: 用户级 ~/.dsh/skills/whatsnext 优先(可编辑、可跨
 * agent 共享), 包内 src/skills/whatsnext 回退(装完即用).
 * @returns {string} skill 目录绝对路径, 保证是存在的那个.
 */
function resolveSkillDir() {
  const home = process.env.DSH_HOME ?? join(homedir(), '.dsh');
  const userDir = join(home, 'skills', 'whatsnext');
  if (existsSync(join(userDir, 'SKILL.md'))) return userDir;
  if (existsSync(join(BUNDLED_SKILL_DIR, 'SKILL.md'))) return BUNDLED_SKILL_DIR;
  return SKILL_DIR_LABEL;
}

/**
 * 在 PATH 里解析一个可执行文件的绝对路径(不经过 shell, 避免引号被吞).
 * @param {string} command - 可执行名, 如 `python`.
 * @returns {string[]} 命中的绝对路径, 未命中为空数组.
 */
function lookupOnPath(command) {
  const finder = process.platform === 'win32' ? 'where' : 'which';
  try {
    const result = spawnSync(finder, [command], { encoding: 'utf8', timeout: 10_000, windowsHide: true });
    if (result.error !== undefined || result.status !== 0) return [];
    return String(result.stdout ?? '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line !== '');
  } catch {
    return [];
  }
}

/**
 * 列出目录下匹配前缀的子目录(不做递归, 读不到就当空).
 * @param {string} root - 待列目录.
 * @param {string} prefix - 子目录名前缀, 如 `Python`.
 * @returns {string[]} 命中的绝对路径.
 */
function listVersionDirs(root, prefix) {
  try {
    return readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith(prefix))
      .map((entry) => join(root, entry.name))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

/**
 * 常见安装位置里直接找 python 可执行文件, 作为 PATH 解析之外的兜底.
 *
 * PATH 解析依赖 spawn, 而某些受限环境会拒绝子进程的管道 stdio(EPERM); 此时
 * 直接看已知目录仍可能找到解释器. 纯 existsSync/readdirSync, 不会失败.
 * @returns {string[]} 候选绝对路径.
 */
function filesystemPythonCandidates() {
  const home = homedir();
  const candidates = [];
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA ?? join(home, 'AppData', 'Local');
    const roots = [
      join(localAppData, 'Programs', 'Python'),
      process.env.ProgramFiles ?? 'C:\\Program Files',
      process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)',
      'C:\\',
    ];
    for (const root of roots) {
      for (const dir of listVersionDirs(root, 'Python')) candidates.push(join(dir, 'python.exe'));
    }
  } else {
    for (const prefix of ['/usr/local/bin', '/usr/bin', '/opt/homebrew/bin', join(home, '.local', 'bin')]) {
      candidates.push(join(prefix, 'python3'), join(prefix, 'python'));
    }
  }
  return candidates;
}

/**
 * 探测本机真实可用的 Python 解释器, 返回其绝对路径.
 *
 * skill 正文里的命令写的是 `python3`; Windows 上常见只有 `python` / `py -3`,
 * 且 PATH 里的 `python3.exe` 可能是应用商店占位壳(执行即失败). 因此逐个候选
 * 实跑一次 `-c "import sys; print(sys.executable)"` 验证, 只有退出码 0 且 stdout
 * 非空才算可用. 找不到返回 null, 由提示词引导走 skill 里的"无 python 回退".
 *
 * 候选顺序: PATH 里命中的 python3 → python → (Windows) py -3 兜底 →
 * 常见安装目录直接探测. 全部以 shell: false 执行: 参数原样传给子进程,
 * 不会被 shell 的引号规则改写.
 * @returns {string | null} 解释器绝对路径.
 */
function detectPython() {
  const candidates = [];
  for (const command of ['python3', 'python']) {
    for (const resolved of lookupOnPath(command)) candidates.push({ command: resolved, args: [] });
  }
  for (const resolved of lookupOnPath('py')) candidates.push({ command: resolved, args: ['-3'] });
  for (const resolved of filesystemPythonCandidates()) {
    if (existsSync(resolved)) candidates.push({ command: resolved, args: [] });
  }

  for (const { command, args } of candidates) {
    let result;
    try {
      result = spawnSync(
        command,
        [...args, '-c', 'import sys; print(sys.executable)'],
        { encoding: 'utf8', timeout: 10_000, windowsHide: true },
      );
    } catch {
      continue;
    }
    if (result.error !== undefined || result.status !== 0) continue;
    const resolved = String(result.stdout ?? '').trim().split(/\r?\n/)[0].trim();
    if (resolved !== '') return resolved;
  }
  return null;
}

/**
 * 组装一次命令调用的提示词: 适配说明 + 命令专属指令 + 用户原始输入.
 * @param {string} command - 命令名(不含斜杠).
 * @param {string} rawInput - 命令名之后的原始输入(含分隔空白).
 * @param {{ skillDir: string, python: string | null }} env - 解析好的运行环境.
 * @returns {string} 交给主模型的一条用户消息文本.
 */
function buildPrompt(command, rawInput, env) {
  const spec = COMMANDS[command];
  const input = String(rawInput ?? '').trim();
  const target = spec.reference === null
    ? join(env.skillDir, 'SKILL.md')
    : join(env.skillDir, 'references', spec.reference);

  const lines = [
    `##### whatsnext 运行适配(本段由 DSH 插件注入, 不是 skill 正文)`,
    ``,
    `- skill 目录(即文档里的 \${CLAUDE_PLUGIN_ROOT}): ${env.skillDir}`,
    `- 下文文档里出现的 \${CLAUDE_PLUGIN_ROOT} 一律等于上面这个绝对路径, 无需再替换.`,
  ];
  if (env.python === null) {
    lines.push(
      `- 本机未探测到可用 Python: 文档里的脚本命令一律放弃, 改用文档写明的"无 python 回退"路径手工读写 Markdown.`,
    );
  } else {
    lines.push(
      `- 本机 Python 解释器: ${env.python}`,
      `- 文档命令里写的 python3 即上条解释器: 照抄文档命令时把 python3 换成该路径后再执行.`,
    );
  }
  lines.push(
    `- 本机工具对应: 文档里的 Read = read 工具, Bash = pwsh 工具.`,
    `- 脚本须以当前项目的真实工作目录(用户的仓库根)为 cwd 执行, 不要在插件目录内执行:`,
    `  三个脚本都从 cwd 向上寻找 .whatsnext, 在别处执行会误建计划区. 不确定仓库根时先跑 git rev-parse --show-toplevel.`,
    `- 插件里的文件在工作区之外, 用绝对路径读取(上面的 skill 目录/脚本路径都已是绝对路径).`,
    ``,
    `##### 命令 /${command}`,
    ``,
  );

  if (command === 'wn') {
    lines.push(
      `用户输入(可能为空): ${input === '' ? '(无)' : input}`,
      ``,
      `本命令是 whatsnext 唯一的智能入口:`,
      ``,
      `1. 先装载契约(幂等): 用 read 工具读 ${target}; 若本会话上下文里已有该契约, 直接进下一步, 不重复读.`,
      `2. 用户输入为空: 按 SKILL.md 的"无参"分支, 说明 whatsnext 是什么 / 怎么用、列出八条命令, 并报当前计划区现状`,
      `   (有没有 .whatsnext/tasks; 有则调上面的 Python 跑 ${join(env.skillDir, 'scripts', 'scan_tasks.py')} --status active stopped 读出活跃与搁置任务及 Focus). 不臆测动作.`,
      `3. 用户输入非空: 按 SKILL.md 的"参数分诊"规则理解意图, 映射到一个或多个动作, 按序执行, 每步读对应 reference 并走完整步骤`,
      `   (如"结束上一个任务再开个重构任务" = 先读 references/finish.md 归档, 再读 references/start.md 开新任务).`,
      ``,
      `本命令独占分诊职责; 实现动作时严格按 reference 的流程, 不跳步、不自创流程.`,
    );
  } else {
    lines.push(
      `用户附加输入(可能为空): ${input === '' ? '(无)' : input}`,
      ``,
      `用 read 工具读 ${target}, 严格按其步骤执行 —— 该文件是权威规范, 以它为准.`,
      ``,
      `本命令专一, 只做"${spec.action}". 用户若给了不属于本动作的意图, 不代跑、不硬套:`,
      `只点明并提示改用 /wn(智能分诊)或正确的 /wn-* 命令.`,
    );
  }

  return lines.join('\n');
}

/**
 * 组装一条交给主模型的用户消息. 优先用 DSH 官方的 createUserMessage,
 * 解析不到 `@deepseek-ai/dsh-llm` 时按同一形状手工构造(该包在 profile 依赖树里,
 * 正常一定能解析到).
 * @param {string} text - 提示词文本.
 * @returns {Promise<object>} UserMessage 形状的对象.
 */
async function buildUserMessage(text) {
  try {
    const mod = await import('@deepseek-ai/dsh-llm');
    if (typeof mod.createUserMessage === 'function') {
      return mod.createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } });
    }
  } catch {
    /* 回退到手工构造 */
  }
  return {
    role: 'user',
    content: [{ type: 'text', text }],
    source: { kind: 'user' },
  };
}

/** 插件激活: 解析一次运行环境, 注册八条命令. */
async function apply(ctx) {
  const skillDir = resolveSkillDir();
  const python = detectPython();
  const env = { skillDir, python };

  if (!existsSync(join(skillDir, 'SKILL.md'))) {
    process.stderr.write(
      `${name}: warning: 未找到 ${join(skillDir, 'SKILL.md')}, 命令会不可用; 请确认包内 src/skills/whatsnext/ 存在\n`,
    );
  }
  if (python === null) {
    process.stderr.write(
      `${name}: warning: 未探测到可用 Python, /wn* 的脚本步骤将走 skill 的"无 python 回退"\n`,
    );
  }

  ctx.effect(() => {
    const disposers = [];
    for (const [command, spec] of Object.entries(COMMANDS)) {
      const skillFile = spec.reference === null
        ? join(skillDir, 'SKILL.md')
        : join(skillDir, 'references', spec.reference);
      const description = readSkillDescription(skillFile) || FALLBACK_DESCRIPTIONS[command];
      disposers.push(ctx.commands.register({
        name: command,
        description,
        input: { hint: command === 'wn' ? '[想做什么, 可选]' : '[可选附加输入]' },
        handler: async ({ agent, rawInput }) => {
          const text = buildPrompt(command, rawInput, env);
          const message = await buildUserMessage(text);
          // steer: 空闲时开一轮, 忙时在最近一步边界插入.
          agent.steer(message);
          return { kind: 'success', text: `已启动 /${command}(${spec.action}).` };
        },
      }));
    }
    return () => {
      for (const dispose of disposers) dispose();
    };
  }, 'whatsnext command registration');
}

export { apply, inject, name };
export { COMMANDS, buildPrompt, detectPython, parseFrontmatter, resolveSkillDir };
