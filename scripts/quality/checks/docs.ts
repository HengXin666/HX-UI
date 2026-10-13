import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import {
    AGENTS_MAX_BYTES, AGENTS_MAX_LINES, APPROVALS_FILE, BUDGET_MAX_BYTES, DEPENDENCY_FIELDS, DOC_EXTENSIONS,
    DOC_MAX_LINES, DOC_TOP_DIRS, DOCS_APP_PATHS, DOCS_PACKAGE_FILE, DOT, ERROR, FOREIGN_FRAMEWORKS, INVENTORY_FILE,
    MARKDOWN_EXTENSIONS, NEWLINE, PACKAGE_FILE, SKILL_INJECTION_DIRS, SLASH, UTF8, WARNING, COLON_SPACE, CONTRIBUTING_FILE, GROUP_CODE, GROUP_DOCS, LIMIT_LABEL, LINES_LABEL, SPACE,
} from "../../constants/quality.ts";
import { Collector } from "../runtime/finding.ts";
import type { Rule } from "../runtime/finding.ts";
import { baseFile } from "./snapshot.ts";
import type { Snapshot } from "./snapshot.ts";

const CODE = GROUP_CODE;
const DOCS = GROUP_DOCS;
const DOCS_ROOT = "docs/";
const README = "README.md";
const AGENTS = "AGENTS.md";
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FORBIDDEN_WORD = /(?:^|-)(?:v[0-9]+|final|copy|bak|tmp|draft)(?:-|$)/;
const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/;
const ALLOWED_NAMES = [README, AGENTS, "CHANGELOG.md", CONTRIBUTING_FILE, "LICENSE", "LICENSE.md", "SECURITY.md"];
const FOREIGN_LOCK = /(?:^|\/)(?:pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/;
const SECTIONS = ["## 架构推荐", "## 依赖推荐"];
const MAJOR = /^\D*(\d+)/;
const SUBJECT_NOTE = /\s*\([^)]*\)\s*$/;
const SUBJECT_SPLIT = /\s*[,+]\s*/;

function docPaths(snapshot: Snapshot): string[] {
    return snapshot.paths.filter((path) => path.startsWith(DOCS_ROOT)
        && !DOCS_APP_PATHS.some((app) => path === app || (app.endsWith(SLASH) && path.startsWith(app))));
}

const docName: Rule = {
    id: "HC-DOCNAME", severity: ERROR, group: DOCS,
    summary: "docs 文档树目录与文件名小写 kebab, 扩展名 md/mdx/yaml, 禁止 v2/final/copy 等副本词, 日期前缀只在 decisions",
    run: (snapshot) => {
        const out = new Collector(docName);
        for (const path of docPaths(snapshot)) {
            const parts = path.slice(DOCS_ROOT.length).split(SLASH);
            const file = parts.pop()!;
            const stem = basename(file, extname(file));
            const problems: string[] = [];
            if (!ALLOWED_NAMES.includes(file)) {
                if (!DOC_EXTENSIONS.includes(extname(file))) {
                    problems.push("扩展名不在 md/mdx/yaml");
                }
                const dated = DATE_PREFIX.test(stem);
                if (dated && parts[0] !== "decisions") {
                    problems.push("日期前缀只允许 decisions 下使用");
                }
                const slug = dated ? stem.replace(DATE_PREFIX, "") : stem;
                if (!KEBAB.test(slug) || FORBIDDEN_WORD.test(slug)) {
                    problems.push("文件名需小写 kebab 且不含 v2/final/copy/bak/tmp/draft");
                }
            }
            for (const part of parts.filter((item) => !KEBAB.test(item) || FORBIDDEN_WORD.test(item))) {
                problems.push("目录 " + part + " 不符合命名");
            }
            for (const problem of problems) {
                out.add(path, 1, problem, path, problem);
            }
        }
        return out.scoped(snapshot);
    },
};

const docTree: Rule = {
    id: "HC-DOCS", severity: ERROR, group: DOCS,
    summary: "docs 文档只放在 " + DOC_TOP_DIRS.join(SLASH) + " 之下, 同目录不得出现去掉副本词后同名的文档",
    run: (snapshot) => {
        const out = new Collector(docTree);
        const stems = new Map<string, string>();
        for (const path of docPaths(snapshot)) {
            const top = path.slice(DOCS_ROOT.length).split(SLASH)[0];
            if (!DOC_TOP_DIRS.includes(top)) {
                out.add(path, 1, "文档必须位于 docs/{" + DOC_TOP_DIRS.join(",") + "}/ 之下", path, "top");
            }
            const topic = dirname(path) + SLASH + basename(path, extname(path)).replace(/-(?:v\d+|new|old|copy)$/, "");
            const owner = stems.get(topic);
            if (owner) {
                out.add(path, 1, "与 " + owner + " 是同主题副本, 就地更新原文", path, "copy");
            }
            stems.set(topic, path);
        }
        return out.scoped(snapshot);
    },
};

const docSize: Rule = {
    id: "HC-DOCSIZE", severity: ERROR, group: DOCS, summary: "单个文档不超过 " + DOC_MAX_LINES + LINES_LABEL,
    run: (snapshot) => {
        const out = new Collector(docSize);
        const tree = new Set(docPaths(snapshot));
        for (const [path, text] of snapshot.files) {
            const lines = text.replace(/\n$/, "").split(NEWLINE).length;
            const document = MARKDOWN_EXTENSIONS.includes(extname(path)) || (tree.has(path) && DOC_EXTENSIONS.includes(extname(path)));
            if (document && lines > DOC_MAX_LINES) {
                out.add(path, DOC_MAX_LINES + 1, lines + LIMIT_LABEL + DOC_MAX_LINES, path, "size");
            }
        }
        return out.scoped(snapshot);
    },
};

function pairPath(dir: string, name: string): string {
    return dir === DOT ? name : dir + SLASH + name;
}

const context: Rule = {
    id: "HC-CONTEXT", severity: ERROR, group: DOCS,
    summary: "每个含 README.md 或 AGENTS.md 的目录两者都存在并互相引用, AGENTS 少于 " + AGENTS_MAX_LINES + " 行且少于 "
        + AGENTS_MAX_BYTES + " bytes",
    run: (snapshot) => {
        const out = new Collector(context);
        const dirs = new Set(snapshot.paths.filter((path) => [README, AGENTS].includes(basename(path))).map(dirname));
        for (const dir of dirs) {
            const readme = snapshot.files.get(pairPath(dir, README));
            const agents = snapshot.files.get(pairPath(dir, AGENTS));
            if (readme === undefined || agents === undefined) {
                const present = pairPath(dir, readme === undefined ? AGENTS : README);
                out.add(present, 1, "缺少同目录配对文件 " + (readme === undefined ? README : AGENTS), present, "pair");
                continue;
            }
            if (!agents.includes(README) || !readme.includes(AGENTS)) {
                out.add(pairPath(dir, AGENTS), 1, "README.md 与 AGENTS.md 需要互相引用", dir, "link");
            }
            const lines = agents.replace(/\n$/, "").split(NEWLINE).length;
            if (lines >= AGENTS_MAX_LINES || Buffer.byteLength(agents, UTF8) >= AGENTS_MAX_BYTES) {
                out.add(pairPath(dir, AGENTS), 1, "AGENTS.md 超出上下文上限", lines + LINES_LABEL, "size");
            }
        }
        return out.scoped(snapshot);
    },
};

/** Size of the pinned vendored skill text; it is excluded from snapshots because upstream owns it. */
function bytes(path: string): number {
    if (!existsSync(path)) {
        return 0;
    }
    if (!statSync(path).isDirectory()) {
        return readFileSync(path).length;
    }
    return readdirSync(path).reduce((sum, name) => sum + bytes(join(path, name)), 0);
}

const budget: Rule = {
    id: "HC-BUDGET", severity: ERROR, group: DOCS,
    summary: "每个文件的祖先 AGENTS.md 与 skill 注入上界合计不超过 " + BUDGET_MAX_BYTES + " bytes",
    run: (snapshot) => {
        const out = new Collector(budget);
        const skill = SKILL_INJECTION_DIRS.reduce((sum, item) => sum + bytes(join(snapshot.root, item)), 0);
        for (const path of snapshot.paths) {
            let total = skill;
            for (let dir = dirname(path); ; dir = dirname(dir)) {
                total += Buffer.byteLength(snapshot.files.get(pairPath(dir, AGENTS)) ?? "", UTF8);
                if (dir === DOT) {
                    break;
                }
            }
            if (total > BUDGET_MAX_BYTES) {
                out.add(path, 1, "上下文注入 " + total + " bytes, 上限 " + BUDGET_MAX_BYTES, path, "budget");
            }
        }
        return out.scoped(snapshot);
    },
};

function manifest(text: string | undefined): Record<string, string> {
    const data = JSON.parse(text ?? "{}");
    return Object.assign({}, ...DEPENDENCY_FIELDS.map((field) => data[field] ?? {}));
}

const stack: Rule = {
    id: "HC-STACK", severity: ERROR, group: CODE,
    summary: "登记栈为 React + TS + npm, 新增其他前端框架或其他包管理器锁文件需先裁决",
    run: (snapshot) => {
        const out = new Collector(stack);
        for (const path of snapshot.paths.filter((item) => FOREIGN_LOCK.test(item))) {
            out.add(path, 1, "包管理器迁移未经裁决, 登记栈为 npm (package-lock.json)", path, "lock");
        }
        for (const file of [PACKAGE_FILE, DOCS_PACKAGE_FILE]) {
            const deps = manifest(snapshot.files.get(file));
            for (const name of FOREIGN_FRAMEWORKS.filter((item) => item in deps)) {
                out.add(file, 1, "新增未经裁决的前端栈 " + name, name, name);
            }
        }
        return out.scoped(snapshot);
    },
};

/** An approval subject lists one or more `name@range` entries and covers a dependency only for the major it names. */
function approved(snapshot: Snapshot, name: string, range: string): string | undefined {
    const list = JSON.parse(snapshot.files.get(APPROVALS_FILE) ?? "[]") as Array<Record<string, string>>;
    const covers = (spec: string): boolean => {
        const at = spec.lastIndexOf("@");
        return (at > 0 ? spec.slice(0, at) : spec) === name && (at <= 0 || spec.slice(at + 1).match(MAJOR)?.[1] === range.match(MAJOR)?.[1]);
    };
    return list.find((item) => item.status === "approved"
        && (item.subject ?? "").replace(SUBJECT_NOTE, "").split(SUBJECT_SPLIT).some(covers))?.id;
}

const dependencies: Rule = {
    id: "HC-DEPS", severity: WARNING, group: CODE,
    summary: "依赖变化进 review: 新直接依赖与跨大版本需批准记录, 否则 unapproved; 补丁/小版本 review-only",
    run: (snapshot) => {
        const out = new Collector(dependencies);
        for (const file of [PACKAGE_FILE, DOCS_PACKAGE_FILE]) {
            const before = baseFile(snapshot, file);
            if (before === undefined || !snapshot.scope?.has(file)) {
                continue;
            }
            const old = manifest(before);
            for (const [name, range] of Object.entries(manifest(snapshot.files.get(file)))) {
                if (old[name] === range) {
                    continue;
                }
                const major = !old[name] || old[name].match(MAJOR)?.[1] !== range.match(MAJOR)?.[1];
                const id = approved(snapshot, name, range);
                const status = major ? (id ? "approved " + id : "unapproved") : "review-only";
                out.add(file, 1, name + SPACE + (old[name] ?? "(new)") + " -> " + range + COLON_SPACE + status, name, name);
            }
        }
        return out.findings;
    },
};

const reuse: Rule = {
    id: "HC-REUSE", severity: WARNING, group: CODE,
    summary: "inventory 必须含架构推荐与依赖推荐, 依赖变化时需同步更新 inventory",
    run: (snapshot) => {
        const out = new Collector(reuse);
        const inventory = snapshot.files.get(INVENTORY_FILE);
        for (const section of SECTIONS.filter((item) => !inventory?.includes(item))) {
            out.add(INVENTORY_FILE, 1, "缺少取证推荐小节 " + section, section, section);
        }
        const changed = [PACKAGE_FILE, DOCS_PACKAGE_FILE].some((file) => snapshot.scope?.has(file));
        if (changed && !snapshot.scope?.has(INVENTORY_FILE)) {
            out.add(PACKAGE_FILE, 1, "依赖清单变化但 inventory 未更新复用与推荐证据", PACKAGE_FILE, "stale");
        }
        return out.findings;
    },
};

export const docsRules: Rule[] = [docName, docTree, docSize, context, budget, stack, dependencies, reuse];
export type { Snapshot };
