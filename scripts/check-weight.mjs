#!/usr/bin/env node
/**
 * 重依赖不能进默认安装图.
 * monaco、xyflow、shiki、markstream 只允许作为可选 peer, 同时留在 devDependencies 里给仓库自己构建.
 * 使用方不装它们也能装上 @hx/ui. 用到编辑器、蓝图画布、高亮或流式 Markdown 时再自己装.
 */
import fs from "node:fs";
import path from "node:path";

const HEAVY = ["@monaco-editor/react", "monaco-editor", "@xyflow/react", "shiki", "markstream-react"];
const pkg = JSON.parse(fs.readFileSync(path.join(path.resolve(import.meta.dirname, ".."), "package.json"), "utf8"));
const dependencies = pkg.dependencies ?? {};
const peers = pkg.peerDependencies ?? {};
const meta = pkg.peerDependenciesMeta ?? {};
const dev = pkg.devDependencies ?? {};
const problems = [];

for (const name of HEAVY) {
  if (name in dependencies) problems.push(`${name} 还在 dependencies`);
  if (!(name in peers)) problems.push(`${name} 没有放进 peerDependencies`);
  if (meta[name]?.optional !== true) problems.push(`${name} 不是可选 peer`);
  if (!(name in dev)) problems.push(`${name} 不在 devDependencies, 仓库自己会编不过`);
}

if (problems.length > 0) {
  console.error("check-weight: 安装图超重");
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`check-weight: 通过 (${HEAVY.length} 个重包是可选 peer)`);
