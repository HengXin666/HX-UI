import ts from "typescript";
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { CI_FILE, ERROR, MAX_BUFFER, NEWLINE, NODE, PACKAGE_FILE, SLASH, TSC_BIN, TSCONFIGS, UTF8, VENDOR_SKILL, CODEOWNERS_FILE, COLON_SPACE, CONTRIBUTING_FILE, GROUP_CODE, SPACE, TSX_EXT, NODE_MODULES } from "../../constants/quality.ts";
import type { Graph } from "../../../.agents/skills/hx-agent-code/scripts/core/model.ts";
import { exportSnapshot } from "../checks/snapshot.ts";
import type { Snapshot } from "../checks/snapshot.ts";
import { codeFiles, line, parse, visit } from "./ast.ts";
import { Collector } from "./finding.ts";
import type { Rule } from "./finding.ts";

const CODE = GROUP_CODE;
const GRAPH_ROOTS = ["src/", "docs/src/"];
const ALIASES: Record<string, string> = { "@hx/ui": "src/index.ts" };
const SUFFIXES = ["", ".ts", TSX_EXT, "/index.ts", "/index.tsx"];
const TSC_LINE = /^(?<file>.+?)\((?<line>\d+),\d+\): error (?<code>TS\d+): (?<text>.*)$/;

type Edges = { edges: Map<string, string[]>; unresolved: Array<{ path: string; line: number; spec: string }> };

function resolve(snapshot: Snapshot, from: string, spec: string): string | null | undefined {
    if (ALIASES[spec]) {
        return ALIASES[spec];
    }
    if (!spec.startsWith(".")) {
        return undefined;
    }
    const base = normalize(join(dirname(from), spec)).split("\\").join(SLASH);
    const hit = SUFFIXES.map((suffix) => base + suffix).find((path) => snapshot.paths.includes(path));
    return hit ?? null;
}

export function importGraph(snapshot: Snapshot): Edges {
    const edges = new Map<string, string[]>();
    const unresolved: Edges["unresolved"] = [];
    for (const [path, text] of codeFiles(snapshot).filter(([item]) => GRAPH_ROOTS.some((root) => item.startsWith(root)))) {
        const source = parse(path, text);
        const targets = new Set<string>();
        visit(source, (node) => {
            let spec: ts.Expression | undefined;
            if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
                spec = node.moduleSpecifier;
            } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
                spec = node.arguments[0];
            }
            if (!spec) {
                return;
            }
            const at = line(source, node.getStart(source));
            if (!ts.isStringLiteralLike(spec)) {
                unresolved.push({ path, line: at, spec: spec.getText(source) });
                return;
            }
            const target = resolve(snapshot, path, spec.text);
            if (target === null) {
                unresolved.push({ path, line: at, spec: spec.text });
            } else if (target) {
                targets.add(target);
            }
        });
        edges.set(path, [...targets].sort());
    }
    return { edges, unresolved };
}

function cycles(edges: Map<string, string[]>): string[][] {
    let counter = 0;
    const index = new Map<string, number>();
    const low = new Map<string, number>();
    const stack: string[] = [];
    const found: string[][] = [];
    const connect = (node: string) => {
        index.set(node, counter);
        low.set(node, counter++);
        stack.push(node);
        for (const next of edges.get(node) ?? []) {
            if (!index.has(next)) {
                connect(next);
                low.set(node, Math.min(low.get(node)!, low.get(next)!));
            } else if (stack.includes(next)) {
                low.set(node, Math.min(low.get(node)!, index.get(next)!));
            }
        }
        if (low.get(node) === index.get(node)) {
            const part: string[] = [];
            let item: string;
            do {
                item = stack.pop()!;
                part.push(item);
            } while (item !== node);
            if (part.length > 1 || (edges.get(node) ?? []).includes(node)) {
                found.push(part.sort());
            }
        }
    };
    for (const node of [...edges.keys()].sort()) {
        if (!index.has(node)) {
            connect(node);
        }
    }
    return found;
}

const cycle: Rule = {
    id: "HC-CYCLE", severity: ERROR, group: CODE,
    summary: "src 与 docs/src 的 AST 导入图无环, 无法解析的相对导入或动态导入显式报错",
    run: (snapshot) => {
        const out = new Collector(cycle);
        const graph = importGraph(snapshot);
        for (const part of cycles(graph.edges)) {
            out.add(part[0], 1, "导入环: " + part.join(" -> "), part.join(SPACE), part.join(SPACE));
        }
        for (const item of graph.unresolved) {
            out.add(item.path, item.line, "无法静态解析的导入 " + item.spec, item.spec, item.spec);
        }
        return out.scoped(snapshot);
    },
};

const typecheck: Rule = {
    id: "HC-TYPE", severity: ERROR, group: CODE,
    summary: "对检查快照运行 tsc --noEmit (tsconfig.json 与 docs/tsconfig.json), 全量解析项目引用",
    run: (snapshot) => {
        const out = new Collector(typecheck);
        const dir = exportSnapshot(snapshot, [NODE_MODULES, "docs/" + NODE_MODULES]);
        try {
            for (const config of TSCONFIGS.filter((item) => snapshot.paths.includes(item))) {
                const result = spawnSync(NODE, [join(snapshot.root, TSC_BIN), "--noEmit", "--pretty", "false", "-p", config], {
                    cwd: dir, encoding: UTF8, maxBuffer: MAX_BUFFER,
                });
                const lines = (result.stdout + result.stderr).split(NEWLINE).filter(Boolean);
                for (const row of lines) {
                    const match = row.match(TSC_LINE);
                    const path = match ? normalize(join(dirname(config), match.groups!.file)) : config;
                    out.add(path, match ? Number(match.groups!.line) : 1, match ? match.groups!.code + SPACE + match.groups!.text : row, row, row);
                }
                if (result.status !== 0 && !lines.length) {
                    out.add(config, 1, "tsc 退出 " + result.status + " 但没有诊断输出", String(result.error ?? ""), "tool");
                }
            }
        } finally {
            if (dir !== snapshot.root) {
                rmSync(dir, { recursive: true, force: true });
            }
        }
        return out.findings;
    },
};

export const graphRules: Rule[] = [cycle, typecheck];

/** Impact graph for the vendored selector: AST import edges plus module to test mapping. */
export function impactGraph(snapshot: Snapshot): Graph {
    const graph = importGraph(snapshot);
    const inputs: Record<string, string[]> = {};
    for (const [path, targets] of graph.edges) {
        inputs[path] = targets;
    }
    const smoke = ["docs:smoke", "docs:shell"];
    return {
        complete: graph.unresolved.length === 0,
        inputs,
        modules: {
            lib: { paths: ["src"], tests: smoke, dependsOn: [], contracts: [] },
            docs: { paths: ["docs/src", "docs/scripts"], tests: ["docs:icons", ...smoke], dependsOn: ["lib"], contracts: [] },
            e2e: { paths: ["scripts/check-smoke.ts", "scripts/check-shell.ts"], tests: smoke, dependsOn: [], contracts: [] },
            quality: {
                paths: ["scripts/quality", "scripts/constants", VENDOR_SKILL, ".githooks"], tests: ["quality:probes"],
                dependsOn: [], contracts: [],
            },
            meta: {
                paths: ["README.md", "AGENTS.md", CONTRIBUTING_FILE, "LICENSE", "NOTICE", "UPSTREAM_COMMIT", ".gitignore",
                    ".github/ISSUE_TEMPLATE", ".github/PULL_REQUEST_TEMPLATE.md", CODEOWNERS_FILE, "docs/reference",
                    "scripts/sync-upstream.sh"],
                tests: [], dependsOn: [], contracts: [],
            },
        },
        global: [PACKAGE_FILE, "package-lock.json", "tsconfig.json", "docs/package.json", "docs/package-lock.json",
            "docs/tsconfig.json", "docs/vite.config.ts", "docs/index.html", ".github/workflows", CI_FILE],
    };
}
