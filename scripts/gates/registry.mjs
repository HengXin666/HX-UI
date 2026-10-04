/**
 * 门禁唯一注册表 —— 本仓红线集的**单一定义点**。
 *
 * 为什么单独一个文件: 检查点有三个 (提交前 / 推送前 / CI), 而"跑哪些检查"这件事
 * 必须在人脑里只有一个答案。同一套判据在两个检查点上各写一遍的后果是实测出来的:
 * HX-Jungle 的 pre-commit 硬编了 6 条命令, 而 CI 只跑 1 条, 于是 browser_gate /
 * code_policy / skill_gate **从来没有在 CI 上跑过**, 谁都没发现。
 *
 * 新增一条门禁 = 往 GATES 追加一行, 不要另起调度脚本。
 *
 * 字段:
 *   id          稳定标识, 被 --group / 指纹 / 输出引用
 *   group       账单单位 (lib / docs / shape / browser / guard / probe), 由命令行选
 *   label       写"这条拦什么", 不写命令复述 —— 它会原样打进日志
 *   cwd         相对仓库根; 有些门禁必须在自己那层跑 (docs 的图标集在 docs/node_modules)
 *   args        完整 argv, 含解释器 —— 不拼接
 *   produces    本条在**本次运行内**产出的逻辑产物名
 *   requires    依赖某个产物由本次运行产出; 缺了就把生产者拉进来 (绝不读上一轮的旧产物)
 *   strictArgs  严格档 argv (CI / 手动全量); 缺省等于 args
 */
import path from "node:path";

export const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");

/** tsc 只有一个, 装在仓库根。docs 只是换 -p 指向另一份 tsconfig。 */
const TSC = ["node_modules/.bin/tsc"];

export const GATES = [
  {
    id: "typecheck",
    group: "lib",
    label: "组件库类型检查 (tsc -p tsconfig.json --noEmit)",
    cwd: ".",
    args: [...TSC, "-p", "tsconfig.json", "--noEmit"],
  },
  {
    id: "ui-rules",
    group: "lib",
    label: "设计规约 (硬编色 / 非语义调色盘 / 非 1px 边框 / 漏写 type 的 button)",
    cwd: ".",
    args: ["node", "scripts/check-ui-rules.mjs", "src"],
  },
  {
    id: "blueprint",
    group: "lib",
    label: "蓝图纯逻辑断言 (类型协变 / 连接判定 / 独占顶替 / 环 / 分支求值 / 序列化往返 / 布局质量)",
    cwd: ".",
    args: ["node", "scripts/check-blueprint.mjs"],
    // --strict: docs/node_modules 里没有 vite 时不再静默 exit 0
    strictArgs: ["node", "scripts/check-blueprint.mjs", "--strict"],
  },
  {
    id: "docs-typecheck",
    group: "docs",
    label: "文档站类型检查 (tsc -p docs/tsconfig.json --noEmit)",
    cwd: ".",
    args: [...TSC, "-p", "docs/tsconfig.json", "--noEmit"],
  },
  {
    id: "icons",
    group: "docs",
    label: "图标名 (Iconify 类串是字符串, TS 与 Tailwind 都管不到, 写错只会静默留白)",
    cwd: "docs",
    args: ["node", "scripts/check-icons.mjs"],
  },
  {
    id: "registry",
    group: "docs",
    label: "文档注册表对账 (nav ↔ App 分支 ↔ 页面文件 ↔ 图标 ↔ 库导出; 幽灵页即 FAIL)",
    cwd: ".",
    args: ["node", "scripts/gates/frontend/check-docs-registry.mjs"],
  },
  {
    id: "line-budget",
    group: "shape",
    label: "单文件行数上限 (ts<=450 / tsx<=250) + 存量棘轮只降不升",
    cwd: ".",
    args: ["node", "scripts/gates/frontend/check-line-budget.mjs"],
  },
  {
    id: "docs-build",
    group: "browser",
    label: "文档站构建 (vite build, 产出 docs/dist)",
    cwd: "docs",
    args: ["node_modules/.bin/vite", "build"],
    produces: "dist",
  },
  {
    id: "smoke",
    group: "browser",
    label: "逐页浏览器冒烟 (渲染出来但是空的 / 页面崩了但 tsc 全绿)",
    cwd: ".",
    args: ["node", "scripts/check-smoke.mjs"],
    strictArgs: ["node", "scripts/check-smoke.mjs", "--strict"],
    requires: "dist",
  },
  {
    id: "shell",
    group: "browser",
    label: "文档站外壳交互 (主题三态 / ⌘K 搜索 / 目录锚点 / 表格行点击 / 窄屏导航)",
    cwd: ".",
    args: ["node", "scripts/check-shell.mjs"],
    strictArgs: ["node", "scripts/check-shell.mjs", "--strict"],
    requires: "dist",
  },
  {
    id: "bp-e2e",
    group: "browser",
    label: "蓝图 e2e: 外观 / 快捷键 / 增删改查 / 撤销重做 / 保存加载 / 同步 (真实浏览器)",
    cwd: ".",
    args: ["node", "scripts/e2e/run.mjs"],
    requires: "dist",
  },
  {
    id: "lanes",
    group: "guard",
    label: "分流覆盖 (每个顶层条目都必须被 lane 或免检声明认领, 否则改它一条门禁都不跑)",
    cwd: ".",
    args: ["node", "scripts/gates/shared/check-lanes.mjs"],
  },
  {
    id: "fingerprint",
    group: "guard",
    label: "质量指纹 (阈值 / 白名单 / 注册表 / 检查点接线 变了就必须显式承认)",
    cwd: ".",
    args: ["node", "scripts/gates/shared/check-fingerprint.mjs", "--check"],
  },
  {
    id: "probe",
    group: "probe",
    label: "负向探针 (违规组必须 FAIL / 合规组必须 PASS / 接线被摘必须 FAIL)",
    cwd: ".",
    args: ["node", "scripts/gates/shared/probe-gates.mjs"],
  },
];

export const GROUPS = [...new Set(GATES.map((g) => g.group))];

/** 按 id 取门禁; 未知 id 返回 undefined 而不是抛 —— 调用方要能打印可操作信息。 */
export function gateById(id) {
  return GATES.find((g) => g.id === id);
}
