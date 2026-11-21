// HX-UI 2 · M0 止血: 快照提交现有改动, 打 legacy-omni 标签, 开 refactor/hx-ui-2 分支, 建 next/ 目录树.
// 用法 (仓库根): node scripts/hx2-m0.ts           先 --dry-run 看一遍也行
// 只做加法: 不 reset, 不 stash drop, 不删任何文件, 不 push.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DRY = process.argv.includes("--dry-run");
const TAG = "legacy-omni";
const BRANCH = "refactor/hx-ui-2";
const DIRS = [
  "next/src/styles", "next/src/lib", "next/src/hooks", "next/src/components/ui",
  "next/src/motion", "next/src/effects", "next/src/data/charts", "next/src/data/table",
  "next/src/blocks/marketing", "next/src/blocks/commerce", "next/src/blocks/dashboard",
  "next/src/blocks/analytics", "next/src/blocks/shell", "next/src/app",
  "next/site/src/pages", "next/site/src/templates", "next/site/src/demos", "next/site/public",
  "next/registry", "next/tests", "next/scripts",
];

function run(cmd: string, quiet = false): string {
  console.log(`$ ${cmd}`);
  if (DRY && !/^git (status|rev-parse|branch|tag -l)/.test(cmd)) return "";
  const out = execSync(cmd, { encoding: "utf8", stdio: quiet ? "pipe" : ["ignore", "pipe", "inherit"] });
  if (!quiet && out.trim()) console.log(out.trim());
  return out;
}

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (pkg.name !== "@hx/ui") throw new Error("请在 HX-UI 仓库根目录运行");

// 1. 备份: 先把全部未提交改动导出成补丁, 放在仓库外一层, 防万一
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = join(root, "..", `HX-UI-backup-${stamp}.patch`);
if (!DRY) {
  run("git add -A");
  writeFileSync(backup, execSync("git diff --cached --binary", { encoding: "utf8", maxBuffer: 1 << 30 }));
  console.log(`备份补丁: ${backup}`);
}

// 2. 快照提交 (WIP 快照, 跳过钩子; 这是旧线的封存, 不是新功能)
const dirty = run("git status --porcelain", true).trim();
if (dirty || !DRY) {
  run(`git commit --no-verify --allow-empty -m "chore: 封存 omni 1.0 全部未提交改动 (HX-UI 2 重构前快照)"`);
}

// 3. 标签 + 新分支
if (!run(`git tag -l ${TAG}`, true).trim()) run(`git tag ${TAG}`);
const branches = run("git branch --list " + BRANCH, true).trim();
run(branches ? `git switch ${BRANCH}` : `git switch -c ${BRANCH}`);

// 4. 目录树 (hxoa 不能建目录, 这里一次建全, 每个放 .gitkeep 让 git 记住)
for (const d of DIRS) {
  const p = join(root, d);
  if (!DRY) {
    mkdirSync(p, { recursive: true });
    if (!existsSync(join(p, ".gitkeep"))) writeFileSync(join(p, ".gitkeep"), "");
  }
  console.log(`mkdir ${d}`);
}
run("git add next");
run(`git commit --no-verify -m "chore(next): HX-UI 2 目录骨架"`);

console.log(`\n完成. 当前分支 ${BRANCH}, 旧线在标签 ${TAG}. 把下面这行输出贴回给 Hark:`);
run("git log --oneline -3");
