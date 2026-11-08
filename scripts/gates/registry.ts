/**
 * 门禁唯一注册表: 本仓红线集的单一定义点. 检查点有三个 (提交前 / 推送前 / CI), 而"跑哪些检查"
 * 只能有一个答案; 新增一条门禁 = 往 GATES 追加一行, 不要另起调度脚本.
 *
 * 字段: id 稳定标识 / group 账单单位 / label 写"这条拦什么" (原样进日志, 不进指纹) /
 * cwd 相对仓库根 / args 完整 argv 含解释器 / produces 本次运行内产出的逻辑产物名 /
 * requires 依赖本次运行产出的产物 (缺了就把生产者拉进来, 绝不读上一轮旧产物) / strictArgs 严格档 argv.
 */
import path from "node:path";
import {
  CHECK_FLAG, CHECK_LANES_FILE, DIST_ARTIFACT, DOCS_CWD, DOCS_REGISTRY_FILE, FINGERPRINT_FILE, GROUP_BROWSER,
  GROUP_DOCS, GROUP_GUARD, GROUP_LIB, GROUP_PROBE, GROUP_SHAPE, LINE_BUDGET_FILE, NODE_BIN, PROBE_FILE,
  REPO_CWD, REPO_UP_FROM_GATES, STRICT_FLAG,
} from "../constants/gates.ts";

export type Gate = {
  id: string;
  group: string;
  label: string;
  cwd: string;
  args: string[];
  strictArgs?: string[];
  produces?: string;
  requires?: string;
};

export const REPO_ROOT = path.resolve(import.meta.dirname, REPO_UP_FROM_GATES);

/** tsc 只有一个, 装在仓库根. docs 只是换 -p 指向另一份 tsconfig. */
const TSC = ["node_modules/.bin/tsc"];

export const GATES: Gate[] = [
  {
    id: "typecheck",
    group: GROUP_LIB,
    label: "组件库类型检查 (tsc -p tsconfig.json --noEmit)",
    cwd: REPO_CWD,
    args: [...TSC, "-p", "tsconfig.json", "--noEmit"],
  },
  {
    id: "ui-rules",
    group: GROUP_LIB,
    label: "设计规约与注释规约 (scripts/quality 的 PROJECT-UI-* 规则, 与 npm run check:ui 同一条命令, 历史项走 baseline)",
    cwd: REPO_CWD,
    args: ["npm", "run", "--silent", "check:ui"],
  },
  {
    id: "economy",
    group: GROUP_LIB,
    label: "安装图节约 (sideEffects 只声明 CSS) 并写出可复原的刻画产物",
    cwd: REPO_CWD,
    args: [NODE_BIN, "scripts/check-economy.mjs"],
  },
  {
    id: "api-snapshot",
    group: GROUP_LIB,
    label: "公共符号快照 (具名导出与展开后的星号桶, 变了必须显式承认)",
    cwd: REPO_CWD,
    args: [NODE_BIN, "scripts/check-api-snapshot.mjs"],
  },
  {
    id: "api-version",
    group: GROUP_LIB,
    label: "公共符号变化必须伴随版本号变化",
    cwd: REPO_CWD,
    args: [NODE_BIN, "scripts/check-api-version.mjs"],
  },
  {
    id: "weight",
    group: GROUP_LIB,
    label: "重依赖不得进入默认安装图 (monaco / xyflow / shiki / markstream 只能是可选 peer)",
    cwd: REPO_CWD,
    args: [NODE_BIN, "scripts/check-weight.mjs"],
  },
  {
    id: "motion",
    group: GROUP_LIB,
    label: "动效契约 (布局位移 / 手势 / 滚动进度 / 出场 / 身份)",
    cwd: REPO_CWD,
    args: [NODE_BIN, "scripts/check-motion.mjs"],
  },
  {
    id: "blueprint",
    group: GROUP_LIB,
    label: "蓝图纯逻辑断言 (类型协变 / 连接判定 / 独占顶替 / 环 / 分支求值 / 序列化往返 / 布局质量)",
    cwd: REPO_CWD,
    args: [NODE_BIN, "scripts/check-blueprint.mjs"],
    // --strict: docs/node_modules 里没有 vite 时不再静默 exit 0
    strictArgs: [NODE_BIN, "scripts/check-blueprint.mjs", STRICT_FLAG],
  },
  {
    id: "docs-typecheck",
    group: GROUP_DOCS,
    label: "文档站类型检查 (tsc -p docs/tsconfig.json --noEmit)",
    cwd: REPO_CWD,
    args: [...TSC, "-p", "docs/tsconfig.json", "--noEmit"],
  },
  {
    id: "icons",
    group: GROUP_DOCS,
    label: "图标名 (Iconify 类串是字符串, TS 与 Tailwind 都管不到, 写错只会静默留白)",
    cwd: DOCS_CWD,
    args: [NODE_BIN, "scripts/check-icons.ts"],
  },
  {
    id: "registry",
    group: GROUP_DOCS,
    label: "文档注册表对账 (nav ↔ App 分支 ↔ 页面文件 ↔ 图标 ↔ 库导出; 幽灵页即 FAIL)",
    cwd: REPO_CWD,
    args: [NODE_BIN, DOCS_REGISTRY_FILE],
  },
  {
    id: "line-budget",
    group: GROUP_SHAPE,
    label: "单文件行数上限 (ts<=450 / tsx<=250) + 存量棘轮只降不升",
    cwd: REPO_CWD,
    args: [NODE_BIN, LINE_BUDGET_FILE],
  },
  {
    id: "docs-build",
    group: GROUP_BROWSER,
    label: "文档站构建 (vite build, 产出 docs/dist)",
    cwd: DOCS_CWD,
    args: ["node_modules/.bin/vite", "build"],
    produces: DIST_ARTIFACT,
  },
  {
    id: "smoke",
    group: GROUP_BROWSER,
    label: "逐页浏览器冒烟 (渲染出来但是空的 / 页面崩了但 tsc 全绿)",
    cwd: REPO_CWD,
    args: [NODE_BIN, "scripts/check-smoke.ts"],
    strictArgs: [NODE_BIN, "scripts/check-smoke.ts", STRICT_FLAG],
    requires: DIST_ARTIFACT,
  },
  {
    id: "shell",
    group: GROUP_BROWSER,
    label: "文档站外壳交互 (主题三态 / ⌘K 搜索 / 目录锚点 / 表格行点击 / 窄屏导航)",
    cwd: REPO_CWD,
    args: [NODE_BIN, "scripts/check-shell.ts"],
    strictArgs: [NODE_BIN, "scripts/check-shell.ts", STRICT_FLAG],
    requires: DIST_ARTIFACT,
  },
  {
    id: "visual-baseline",
    group: GROUP_BROWSER,
    label: "视觉基线 (夹具的计算样式与减弱动效, 对不上提交里的 JSON 就失败)",
    cwd: REPO_CWD,
    args: [NODE_BIN, "scripts/check-visual-baseline.mjs"],
  },
  {
    id: "bp-e2e",
    group: GROUP_BROWSER,
    label: "蓝图 e2e: 外观 / 快捷键 / 增删改查 / 撤销重做 / 保存加载 / 同步 (真实浏览器)",
    cwd: REPO_CWD,
    args: [NODE_BIN, "scripts/e2e/run.mjs"],
    requires: DIST_ARTIFACT,
  },
  {
    id: "lanes",
    group: GROUP_GUARD,
    label: "分流覆盖 (每个顶层条目都必须被 lane 或免检声明认领, 否则改它一条门禁都不跑)",
    cwd: REPO_CWD,
    args: [NODE_BIN, CHECK_LANES_FILE],
  },
  {
    id: "fingerprint",
    group: GROUP_GUARD,
    label: "质量指纹 (阈值 / 白名单 / 注册表 / 检查点接线 变了就必须显式承认)",
    cwd: REPO_CWD,
    args: [NODE_BIN, FINGERPRINT_FILE, CHECK_FLAG],
  },
  {
    id: "probe",
    group: GROUP_PROBE,
    label: "负向探针 (违规组必须 FAIL / 合规组必须 PASS / 接线被摘必须 FAIL)",
    cwd: REPO_CWD,
    args: [NODE_BIN, PROBE_FILE],
  },
];

export const GROUPS: string[] = [...new Set(GATES.map((g) => g.group))];

/** 按 id 取门禁; 未知 id 返回 undefined 而不是抛  调用方要能打印可操作信息. */
export function gateById(id: string): Gate | undefined {
  return GATES.find((g) => g.id === id);
}
