#!/usr/bin/env node
/**
 * whatsnext-dsh 装载自检: 用与 DSH 相同的模块解析锚点(profile 目录), 真实 import
 * 已装插件, 并用一个最小 mock context 跑一遍 apply(), 确认八条命令都能注册.
 *
 *   node scripts/verify-mounted.mjs [profileDir]
 *
 * profileDir 缺省取 $DSH_HOME/profiles/web.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const profileDir = process.argv[2] !== undefined
  ? resolve(process.argv[2])
  : join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'profiles', 'web');

const failures = [];
const lines = [];
/** @param {boolean} ok @param {string} message */
const check = (ok, message) => {
  lines.push(`  ${ok ? 'ok  ' : 'FAIL'} ${message}`);
  if (!ok) failures.push(message);
};

const manifestPath = join(profileDir, 'package.json');
check(existsSync(manifestPath), `profile manifest 存在: ${manifestPath}`);
if (!existsSync(manifestPath)) {
  process.stdout.write(`${lines.join('\n')}\n`);
  process.exit(1);
}
const profile = JSON.parse(readFileSync(manifestPath, 'utf8'));
check(
  (profile.dsh?.profile?.bundles ?? []).includes('whatsnext-dsh'),
  'profile 的 dsh.profile.bundles 含有 whatsnext-dsh',
);
check(
  typeof profile.dependencies?.['whatsnext-dsh'] === 'string',
  `profile 依赖含有 whatsnext-dsh (${profile.dependencies?.['whatsnext-dsh'] ?? '缺失'})`,
);

// 与 resolveBundleDir 相同的解析方式: createRequire(profile package.json).resolve.paths
const require = createRequire(join(profileDir, 'package.json'));
const searchPaths = require.resolve.paths('whatsnext-dsh') ?? [];
let packageDir;
for (const base of searchPaths) {
  const candidate = join(base, 'whatsnext-dsh');
  if (existsSync(join(candidate, 'package.json'))) {
    packageDir = candidate;
    break;
  }
}
check(packageDir !== undefined, `resolveBundleDir 能定位到包目录${packageDir === undefined ? '' : `: ${packageDir}`}`);

if (packageDir === undefined) {
  process.stdout.write(`${lines.join('\n')}\n\n${failures.length} 项失败\n`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
check(pkg.dsh?.bundle?.patch !== undefined, `包声明 dsh.bundle.patch: ${pkg.dsh?.bundle?.patch}`);
const entry = pathToFileURL(join(packageDir, pkg.main ?? 'index.js')).href;
const host = await import(entry);
check(host.name === 'whatsnext-commands', `host.name = ${String(host.name)}`);
check(typeof host.apply === 'function', 'host.apply 是可调用的');

// 最小 mock context: 收命令注册, effect 立即执行
const registered = [];
const ctx = {
  effect(factory) {
    return factory();
  },
  commands: {
    register(definition) {
      registered.push(definition);
      return () => {};
    },
  },
};
await host.apply(ctx);
const names = registered.map((definition) => definition.name);
const expected = ['wn', 'wn-init', 'wn-start', 'wn-resume', 'wn-save', 'wn-finish', 'wn-stop', 'wn-promote'];
check(JSON.stringify(names) === JSON.stringify(expected), `注册的命令: ${names.join(', ')}`);
check(
  registered.every((d) => typeof d.description === 'string' && d.description.trim() !== ''),
  '每条命令都有非空 description',
);

// 跑一次 handler, 用假 agent 收 steer 到的消息
const steer = [];
const fakeAgent = { steer: (message) => steer.push(message) };
const result = await registered[0].handler({ agent: fakeAgent, rawInput: '开个登录页任务' });
check(result?.kind === 'success', `handler 返回 success: ${JSON.stringify(result)}`);
check(steer.length === 1, 'handler 向 agent.steer 投递了一条消息');
const text = steer[0]?.content?.[0]?.text ?? '';
check(text.includes('开个登录页任务'), '投递的消息带上了用户原始输入');
// 包目录经 junction 安装时, Node 的 realpath 会把 import.meta.url 解到仓库真实路径,
// 因此这里按真实路径断言(内容必须是绝对路径, 不能是相对路径).
const realPackageDir = realpathSync(packageDir);
const expectedSkillDir = join(realPackageDir, 'src', 'skills', 'whatsnext');
check(
  text.includes(expectedSkillDir),
  `投递的消息带上了 skill 目录绝对路径: ${expectedSkillDir}`,
);
check(text.includes('python3'), '投递的消息带上了 python3 → 本机解释器的适配说明');

process.stdout.write(`whatsnext-dsh 装载自检 (profile: ${profileDir})\n${lines.join('\n')}\n`);
if (failures.length > 0) {
  process.stdout.write(`\n${failures.length} 项失败\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('\n全部通过\n');
}
