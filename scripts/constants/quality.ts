/**
 * Shared values for the quality gate under scripts/quality.
 * Every threshold, path and exception lives here once, see docs/reference/quality/rules.md.
 */

export const UTF8 = "utf8";
export const ERROR = "error";
export const WARNING = "warning";
export const GIT = "git";
export const NODE = "node";
export const NUL = "\0";
export const NEWLINE = "\n";
export const SLASH = "/";
export const SPACE = " ";
export const DOT = ".";
export const EMPTY_TEXT = "";
export const JSON_INDENT = 4;
export const MAX_BUFFER = 256 * 1024 * 1024;
export const EXIT_OK = 0;
export const EXIT_ERROR = 1;
export const EXIT_TOOL = 2;

export const STATE_DIR = "scripts/.hx_code_quality";
export const REPORT_DIR = STATE_DIR + "/reports";
export const QUALITY_DIR = "scripts/quality";
export const BASELINE_FILE = QUALITY_DIR + "/baseline.json";
export const COVERAGE_FILE = QUALITY_DIR + "/coverage.json";
export const APPROVALS_FILE = QUALITY_DIR + "/approvals.json";
export const FIXTURES_FILE = QUALITY_DIR + "/fixtures.json";
export const CI_FILE = QUALITY_DIR + "/ci.json";
export const ENTRY_FILE = QUALITY_DIR + "/index.ts";
export const VENDOR_SKILL = ".agents/skills/hx-agent-code";
export const VENDOR_PREFIX = ".agents/";
export const PACKAGE_FILE = "package.json";
export const DOCS_PACKAGE_FILE = "docs/package.json";
export const INVENTORY_FILE = "docs/reference/quality/inventory.md";
export const SCOPE_ENV = "HX_QUALITY_SCOPE";
export const BUILD_ENV = "HX_QUALITY_BUILD";

/** Paths never read as project content: vendored upstream skill and dependency trees. */
export const IGNORED_PREFIXES = [VENDOR_PREFIX, "node_modules/", "docs/node_modules/", "docs/dist/", STATE_DIR + SLASH];
export const LOCKFILES = ["package-lock.json", "docs/package-lock.json"];
export const TEXT_EXTENSIONS = [".ts", ".tsx", ".css", ".md", ".mdx", ".json", ".yml", ".yaml", ".sh", ".html"];
export const TEXT_NAMES = ["CODEOWNERS"];
export const CODE_EXTENSIONS = [".ts", ".tsx"];
export const CODE_ROOTS = ["src/", "docs/src/", "docs/scripts/", "scripts/", "docs/vite.config.ts"];
export const HOOK_DIR = ".githooks/";

export const UI_ROOT = "src/";
export const UI_COLOR_EXEMPT = ["src/layout/CodeBlock.tsx"];
export const CONSTANT_DIRS = ["src/constants/", "scripts/constants/"];
export const DUP_THRESHOLD = 3;
export const EVIDENCE_WIDTH = 60;
export const DUP_IGNORED_NUMBERS = ["0", "1"];
export const ABS_PATH_EXEMPT = [FIXTURES_FILE];
export const TEXT_EXEMPT = [FIXTURES_FILE];

export const LOGIC_MAX_LINES = 300;
export const UI_MAX_LINES = 500;
export const DIR_MAX_FILES = 6;
export const HEADER_MAX_LINES = 10;
export const DOC_MAX_LINES = 1500;
export const AGENTS_MAX_LINES = 150;
export const AGENTS_MAX_BYTES = 16384;
export const BUDGET_MAX_BYTES = 65536;

/** docs/ also hosts the documentation site app; these exact app paths are code, not documents. */
export const DOCS_APP_PATHS = [
    "docs/src/", "docs/scripts/", "docs/index.html", "docs/package.json", "docs/package-lock.json",
    "docs/tsconfig.json", "docs/vite.config.ts",
];
export const DOC_TOP_DIRS = ["tutorials", "reference", "architecture", "decisions", "archive"];
export const DOC_EXTENSIONS = [".md", ".mdx", ".yaml"];
export const MARKDOWN_EXTENSIONS = [".md", ".mdx"];
export const ALLOWED_STACK_LOCKFILES = LOCKFILES;
export const FOREIGN_FRAMEWORKS = ["vue", "svelte", "@angular/core", "solid-js", "preact"];
export const DEPENDENCY_FIELDS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
export const ICON_DECLARATION_FIELDS = ["dependencies", "peerDependencies"];
export const ICON_PACKAGE_PREFIX = "@iconify-json/";

/** Upper bound of skill text an agent may inject together with AGENTS.md, measured from the vendored skill. */
export const SKILL_INJECTION_DIRS = [VENDOR_SKILL + "/SKILL.md", VENDOR_SKILL + "/steps/", VENDOR_SKILL + "/references/"];

export const TSCONFIGS = ["tsconfig.json", "docs/tsconfig.json"];
export const TSC_BIN = "node_modules/typescript/bin/tsc";

export const TAB = "\t";
export const COLON = ":";
export const COLON_SPACE = ": ";
export const OPTION_PREFIX = "--";
export const NOT_FOUND = -1;
export const ARG_STRIDE = 2;
export const EVIDENCE_LIMIT = 200;
export const REGEX_GLOBAL = "g";
export const JSON_EXT = ".json";
export const TSX_EXT = ".tsx";
export const NODE_MODULES = "node_modules";
export const DOCS_DIST = "docs-dist";
export const CONTRIBUTING_FILE = "CONTRIBUTING.md";
export const CODEOWNERS_FILE = ".github/CODEOWNERS";
export const LINES_LABEL = " 行";
export const LIMIT_LABEL = " 行, 上限 ";

/** Rule groups, matching the CI groups that run them. */
export const GROUP_CODE = "code";
export const GROUP_DOCS = "docs";
export const GROUP_BUILD = "build";

/** Snapshot modes and entry commands. */
export const MODE_ALL = "all";
export const MODE_TREE = "tree";
export const MODE_WORKTREE = "worktree";
export const MODE_STAGED = "staged";
export const MODE_RANGE = "range";
export const CMD_CHECK = "check";
export const CMD_AUDIT = "audit";
export const CMD_PUSH = "push";
export const CMD_BASELINE = "baseline";
export const FLAG_ROOT = "root";
export const FLAG_MODE = "mode";
export const FLAG_BASE = "base";
export const FLAG_HEAD = "head";
export const FLAG_TREE = "tree";
export const FLAG_OUT = "out";
export const FLAG_RULE = "rule";
export const FLAG_FORMAT = "format";

/** Git command words used by more than one module. */
export const GIT_DIR_OPTION = "-C";
export const GIT_NUL_OPTION = "-z";
export const GIT_CONFIG = "config";
export const STRING_TYPE = "string";
export const DOCS_DIR = "docs";
