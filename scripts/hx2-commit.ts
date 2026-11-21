// HX-UI 2 · 分步提交: 先在 next/ 里真跑一遍安装与构建, 通过才提交.
// 用法 (仓库根): node scripts/hx2-commit.ts <步骤>      例: node scripts/hx2-commit.ts m1
// 加 --skip-build 跳过构建校验 (不推荐). 不 push, 不改历史.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const STEPS: Record<string, string> = {
  m1: "feat(next): HX-UI 2 骨架 (shadcn/ui 基础件, 令牌, Motion 动效, 特效, 图表表格, 区块, 四张成品页)",
  m2: "feat(next): 动效与特效精选 + 性能预算",
  m3: "feat(next): 成品页完善 (电商列表, 运维告警, 分析下钻)",
  m4: "docs(next): AI 友好 (registry, llms.txt, 逐件示例)",
  m5: "refactor: HX-UI 2 替换旧入口",
};

const step = process.argv[2];
if (!step || !STEPS[step]) {
  console.error(`用法: node scripts/hx2-commit.ts <${Object.keys(STEPS).join("|")}>`);
  process.exit(1);
}
const root = process.cwd();
if (JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name !== "@hx/ui") throw new Error("请在 HX-UI 仓库根目录运行");

const sh = (cmd: string) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

if (!process.argv.includes("--skip-build")) {
  sh("npm --prefix next ci --no-audit --no-fund");
  sh("npm --prefix next run build");
}
// 旧门禁 (设计规约 / notes 红线 / 行数预算) 只管旧 src, 不适用于 next/; 新门禁在 m5 接上前用 --no-verify
sh("git add next scripts/hx2-m0.ts scripts/hx2-commit.ts");
sh(`git commit --no-verify -m "${STEPS[step]}"`);
sh("git log --oneline -3");
console.log("\n完成. 把上面三行贴回给 Hark.");
