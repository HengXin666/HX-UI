/** Shared values of the gate bus under scripts/gates (registry, lanes, run, probes, fingerprint). */

/**
 * 门禁分组名: 注册表, lane 表与检查点各自引用, 只在这里定义一次.
 *
 * .agents/notes/implemented/process/2026-11-08-gates-ts.md
 */
export const GROUP_LIB = "lib";
export const GROUP_DOCS = "docs";
export const GROUP_SHAPE = "shape";
export const GROUP_BROWSER = "browser";
export const GROUP_GUARD = "guard";
export const GROUP_PROBE = "probe";

/** 注册表 argv 与工作目录. */
export const NODE_BIN = "node";
export const REPO_CWD = ".";
export const DOCS_CWD = "docs";
export const STRICT_FLAG = "--strict";
export const CHECK_FLAG = "--check";
export const DIST_ARTIFACT = "dist";

/** run.ts 的命令行参数闭集. */
export const FLAG_LIST = "--list";
export const FLAG_DRY_RUN = "--dry-run";
export const FLAG_ALL = "--all";
export const FLAG_STAGED = "--staged";
export const FLAG_HELP = "--help";
export const FLAG_GROUP = "--group";
export const FLAG_FROM = "--from";
export const FLAG_CHECKPOINT = "--checkpoint";

/** 退出码 2 = 用法 / 输入 / 工具错误 (区别于 1 = 内容违规); JSON 快照缩进. */
export const EXIT_TOOL = 2;
export const JSON_INDENT = 2;

/** 指纹来源的两组: "多严" 与 "还跑不跑". */
export const FP_STRICTNESS = "strictness";
export const FP_WIRING = "wiring";
export const GATES_CONSTANTS_FILE = "scripts/constants/gates.ts";

/** 输出排版: 门禁 id 列宽与耗时换算. */
export const ID_WIDTH = 14;
export const MS_PER_SECOND = 1000;
export const SECONDS_DIGITS = 2;
/** process.argv 里用户参数的起点. */
export const ARGV_START = 2;
/** 探针自身坏了 (夹具没建成 / 抛异常) 时的伪退出码, 与门禁的 0 / 1 都不同. */
export const PROBE_BROKEN = -1;

/** 路径片段与文本编码. */
export const UTF8 = "utf8";
export const GIT = "git";
export const SRC_DIR = "src";
export const DOCS_DIR = "docs";
export const SCRIPTS_DIR = "scripts";
export const GATES_DIR = "gates";
export const NEWLINE = "\n";
export const SLASH = "/";
export const SPACE = " ";
export const LIST_SEP = ", ";
export const REPO_UP_FROM_GATES = "../..";
export const REPO_UP_FROM_GATE_SUBDIR = "../../..";
export const REPO_UP_FROM_PROBES = "../../../..";

/** 探针夹具: 空 JSON 文件内容. */
export const EMPTY_JSON = "{}\n";

/** 门禁文件名 (指纹与探针按它们读注册表与 lane 表). */
export const REGISTRY_FILE = "scripts/gates/registry.ts";
export const LANES_FILE = "scripts/gates/lanes.ts";
export const DOCS_REGISTRY_FILE = "scripts/gates/frontend/check-docs-registry.ts";
export const LINE_BUDGET_FILE = "scripts/gates/frontend/check-line-budget.ts";
export const CHECK_LANES_FILE = "scripts/gates/shared/check-lanes.ts";
export const FINGERPRINT_FILE = "scripts/gates/shared/check-fingerprint.ts";
export const PROBE_FILE = "scripts/gates/shared/probe-gates.ts";
export const HOOKS_DIR = "scripts/gates/hooks";
export const PRE_COMMIT = "pre-commit";
export const LINE_BUDGET_BASELINE = "scripts/gates/baselines/line-budget.json";

/** 无 git 时遍历文件系统要跳过的目录. */
export const WALK_SKIP = ["node_modules", ".git", "dist", ".vite", ".bpprobe"];
