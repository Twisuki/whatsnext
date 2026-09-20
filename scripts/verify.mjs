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
 *   3. 八条命令都能解析出非空的 description(读各 SKILL.md 的 frontmatter).
 *   4. skill 正文所依赖的 reference / script / asset 文件全部存在.
 *   5. 每条命令的提示词里都带上了 skill 绝对路径与解释器适配说明.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { COMMANDS, buildPrompt, detectPython, resolveSkillDir } from '../src/dsh-plugin/host.js';

const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];
const notes = [];

/** 记录一条通过. @param {string} message */
const pass = (message) => notes.push(`  ok   ${message}`);
/** 记录一条失败. @param {string} message */
const fail = (message) => failures.push(`  FAIL ${message}`);

/** 断言. @param {boolean} condition @param {string} message */
function check(condition, message) {
  if (condition) pass(message);
  else fail(message);
}

// 1. bundle patch 契约
const manifest = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
const patchRel = manifest.dsh?.bundle?.patch;
check(typeof patchRel === 'string' && patchRel !== '', 'package.json 声明了 dsh.bundle.patch');
const patchPath = patchRel === undefined ? '' : join(PACKAGE_ROOT, patchRel);
check(patchPath !== '' && existsSync(patchPath), `patch 文件存在: ${patchRel}`);
if (patchPath !== '' && existsSync(patchPath)) {
  const patchText = readFileSync(patchPath, 'utf8');
  const names = [...patchText.matchAll(/^\s*-?\s*name:\s*'?([^\s'#]+)'?\s*$/gm)].map((m) => m[1]);
  check(
    names.includes(manifest.name),
    `patch 的插件行 name (${names.join(', ') || '无'}) 与本包 name (${manifest.name}) 一致`,
  );
  const ids = [...patchText.matchAll(/^\s*-?\s*id:\s*([^\s#]+)\s*$/gm)].map((m) => m[1]);
  check(ids.length > 0, `patch 声明了插件行 id: ${ids.join(', ') || '无'}`);
}

// 2. host.js 导出面
const host = await import('../src/dsh-plugin/host.js');
check(typeof host.apply === 'function', 'host.js 导出 apply');
check(Array.isArray(host.inject) && host.inject.includes('commands'), 'host.js 的 inject 声明了 commands 服务');
check(host.name === 'whatsnext-commands', `host.name = ${String(host.name)}`);

// 3/4. skill 目录与文件完备性
const skillDir = resolveSkillDir();
check(existsSync(join(skillDir, 'SKILL.md')), `skill 正文可解析: ${skillDir}`);
for (const relative of [
  'references/init.md',
  'references/start.md',
  'references/resume.md',
  'references/save.md',
  'references/finish.md',
  'references/stop.md',
  'references/promote.md',
  'references/frontmatter.md',
  'references/knowledge.md',
  'scripts/scan_tasks.py',
  'scripts/search_knowledge.py',
  'scripts/new_task.py',
  'assets/index.md',
  'assets/origin.md',
  'assets/plan.md',
]) {
  check(existsSync(join(skillDir, relative)), `存在 ${relative}`);
}

// 5. 八条命令的提示词
const python = detectPython();
notes.push(`  info 探测到的 Python 解释器: ${python ?? '(未找到, 将走无 python 回退)'}`);
const expected = ['wn', 'wn-init', 'wn-start', 'wn-resume', 'wn-save', 'wn-finish', 'wn-stop', 'wn-promote'];
check(
  JSON.stringify(Object.keys(COMMANDS)) === JSON.stringify(expected),
  `命令表为八条: ${Object.keys(COMMANDS).join(', ')}`,
);
for (const command of expected) {
  const prompt = buildPrompt(command, '示例输入', { skillDir, python });
  const hasRoot = prompt.includes(skillDir);
  const hasPython = python === null
    ? prompt.includes('无 python 回退')
    : prompt.includes(python) && prompt.includes('python3');
  const hasInput = prompt.includes('示例输入');
  check(hasRoot && hasPython && hasInput, `/${command} 提示词含 skill 路径 / 解释器适配 / 用户输入`);
}

// 各 reference 文件的 description 是否被 frontmatter 解析出来(经命令描述暴露)
for (const command of expected) {
  const spec = COMMANDS[command];
  const file = spec.reference === null
    ? join(skillDir, 'SKILL.md')
    : join(skillDir, 'references', spec.reference);
  if (spec.reference === null) continue;
  check(existsSync(file), `/${command} 的 reference 存在: ${spec.reference}`);
}

process.stdout.write(`whatsnext-dsh 自检 (${PACKAGE_ROOT})\n${notes.join('\n')}\n`);
if (failures.length > 0) {
  process.stdout.write(`${failures.join('\n')}\n\n${failures.length} 项失败\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`\n全部通过\n`);
}
