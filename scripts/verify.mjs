#!/usr/bin/env node
/**
 * whatsnext-dsh 自检: 不需要 DSH 运行时, 只验证插件包自身的静态契约与运行环境探测.
 *
 *   node scripts/verify.mjs
 *
 * 检查项:
 *   1. package.json 的 dsh.bundle.patch 指向的文件存在, 且 patch 里的插件行 name
 *      等于本包 package.json 的 name(resolveBundleDir 靠这个等式找到包).
 *   2. host.js 导出 apply / inject / name, 且 inject 里声明了 commands 服务.
 *   3. 八条命令都能从 skills/wn-xxx/SKILL.md 解析出非空 description.
 *   4. 共享 skill 正文所依赖的 reference / script / asset 文件全部存在.
 *   5. 每条命令的提示词里都带上了 skill 绝对路径、脚本绝对路径与解释器适配说明.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  COMMANDS,
  buildPrompt,
  detectPython,
  parseFrontmatter,
  resolveSkillDir,
  resolveSkillsRoot,
} from '../dsh-plugin/host.js';

const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];
const notes = [];

const pass = (message) => notes.push('  ok   ' + message);
const fail = (message) => failures.push('  FAIL ' + message);

function check(condition, message) {
  if (condition) pass(message);
  else fail(message);
}

// 1. bundle patch 契约
const manifest = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
const patchRel = manifest.dsh?.bundle?.patch;
check(typeof patchRel === 'string' && patchRel !== '', 'package.json 声明了 dsh.bundle.patch');
const patchPath = patchRel === undefined ? '' : join(PACKAGE_ROOT, patchRel);
check(patchPath !== '' && existsSync(patchPath), 'patch 文件存在: ' + patchRel);
if (patchPath !== '' && existsSync(patchPath)) {
  const patchText = readFileSync(patchPath, 'utf8');
  const names = [...patchText.matchAll(/^\s*-?\s*name:\s*'?([^\s'#]+)'?\s*$/gm)].map((m) => m[1]);
  check(names.includes(manifest.name), 'patch 的插件行 name (' + (names.join(', ') || '无') + ') 与本包 name (' + manifest.name + ') 一致');
  const ids = [...patchText.matchAll(/^\s*-?\s*id:\s*([^\s#]+)\s*$/gm)].map((m) => m[1]);
  check(ids.length > 0, 'patch 声明了插件行 id: ' + (ids.join(', ') || '无'));
}

// 2. host.js 导出面
const host = await import('../dsh-plugin/host.js');
check(typeof host.apply === 'function', 'host.js 导出 apply');
check(Array.isArray(host.inject) && host.inject.includes('commands'), 'host.js 的 inject 声明了 commands 服务');
check(host.name === 'whatsnext-commands', 'host.name = ' + String(host.name));

// 3/4. skill 目录与文件完备性
const skillsRoot = resolveSkillsRoot();
const skillDir = resolveSkillDir();
check(existsSync(join(skillDir, 'SKILL.md')), '契约 skill 可解析: ' + skillDir);
for (const relative of [
  'SKILL.md',
  'assets/index.md',
  'assets/knowledge.md',
  'references/init.md',
  'references/start.md',
  'references/resume.md',
  'references/save.md',
  'references/finish.md',
  'references/stop.md',
  'references/promote.md',
  'scripts/scan_tasks.py',
  'scripts/search_knowledge.py',
  'scripts/new_task.py',
]) {
  check(existsSync(join(skillDir, relative)), '存在 whatsnext/' + relative);
}
const commandSkills = ['wn', 'wn-init', 'wn-start', 'wn-resume', 'wn-save', 'wn-finish', 'wn-stop', 'wn-promote'];
for (const skill of commandSkills) {
  check(existsSync(join(skillsRoot, skill, 'SKILL.md')), '存在 ' + skill + '/SKILL.md');
}

// 5. 八条命令的提示词
const python = detectPython();
notes.push('  info 探测到的 Python 解释器: ' + (python ?? '(未找到, 将走手工回退)'));
const expected = commandSkills;
check(JSON.stringify(Object.keys(COMMANDS)) === JSON.stringify(expected), '命令表为八条: ' + Object.keys(COMMANDS).join(', '));
for (const command of expected) {
  const spec = COMMANDS[command];
  const prompt = buildPrompt(command, '示例输入', { skillsRoot, skillDir, python });
  const hasRoot = prompt.includes(skillDir);
  const hasPython = python === null
    ? prompt.includes('手工扫描')
    : prompt.includes(python) && prompt.includes('python');
  const hasInput = prompt.includes('示例输入');
  const hasTarget = spec.reference === null || prompt.includes(join(skillDir, 'references', spec.reference));
  check(hasRoot && hasPython && hasInput && hasTarget, '/' + command + ' 提示词含 skill 路径 / 解释器适配 / 用户输入 / reference 路径');
  const skillFile = join(skillsRoot, spec.skill, 'SKILL.md');
  const description = existsSync(skillFile) ? parseFrontmatter(readFileSync(skillFile, 'utf8')).description : '';
  check(typeof description === 'string' && description.trim() !== '', '/' + command + ' 的 description 非空');
}
const wnPrompt = buildPrompt('wn', '', { skillsRoot, skillDir, python });
check(wnPrompt.includes(join(skillDir, 'scripts', 'scan_tasks.py')), '/wn 提示词带扫任务脚本绝对路径');
check(wnPrompt.includes('--status active stopped'), '/wn 提示词带扫任务脚本的 --status 参数');

process.stdout.write('whatsnext-dsh 自检 (' + PACKAGE_ROOT + ')\n' + notes.join('\n') + '\n');
if (failures.length > 0) {
  process.stdout.write(failures.join('\n') + '\n\n' + failures.length + ' 项失败\n');
  process.exitCode = 1;
} else {
  process.stdout.write('\n全部通过\n');
}
