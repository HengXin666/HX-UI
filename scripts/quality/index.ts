/**
 * Single entry of the HX-UI quality gate; hooks, npm scripts and CI groups all call this file.
 * Commands and checkpoints are documented in docs/reference/quality/rules.md.
 */
import { spawnSync } from "node:child_process";
import { chmodSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { USER_ARGS_START } from "../constants/browser.ts";
import { main as vendoredCli } from "../../.agents/skills/hx-agent-code/scripts/cli.ts";
import { collectScope } from "../../.agents/skills/hx-agent-code/scripts/core/scope.ts";
import { saveToolError } from "../../.agents/skills/hx-agent-code/scripts/core/report.ts";
import {
    BUILD_ENV, COVERAGE_FILE, EXIT_ERROR, EXIT_OK, EXIT_TOOL, GIT, NEWLINE, REPORT_DIR, UTF8, CMD_AUDIT, CMD_BASELINE, CMD_CHECK, CMD_PUSH, DOCS_DIR, DOCS_DIST, FLAG_BASE, FLAG_HEAD, FLAG_MODE, FLAG_OUT, FLAG_ROOT, GIT_CONFIG, GIT_DIR_OPTION, GROUP_BUILD, MODE_RANGE, MODE_TREE, MODE_WORKTREE, OPTION_PREFIX, SPACE, ARG_STRIDE,
} from "../constants/quality.ts";
import { git } from "./checks/snapshot.ts";
import { check, graph, makeBaseline, one, tests } from "./runtime/run.ts";
import type { Flags } from "./runtime/run.ts";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const HOOKS_PATH = ".githooks";
const EXECUTABLE = 0o755;
const ZERO = /^0+$/;
const EMPTY = "EMPTY";
const NPM = "npm";
const OPTIONS: Record<string, string[]> = {
    check: [FLAG_MODE, FLAG_BASE, FLAG_HEAD, MODE_TREE, "rule", "group", "format", CMD_BASELINE, FLAG_OUT, FLAG_ROOT],
    baseline: [MODE_TREE, "approved-by", "reason", FLAG_OUT, FLAG_ROOT],
    graph: [FLAG_MODE, FLAG_BASE, FLAG_HEAD, FLAG_ROOT],
    tests: ["event", FLAG_MODE, FLAG_BASE, FLAG_HEAD, FLAG_ROOT],
    push: ["remote", FLAG_ROOT], done: [FLAG_ROOT], hooks: [FLAG_ROOT], audit: [FLAG_ROOT], build: [FLAG_ROOT], layer: ["name"],
};
const LAYERS: Record<string, [number, string]> = {
    frontend: [EXIT_ERROR, "blocked: frontend/ui 与 frontend/api 层尚无测试框架, 见 approvals.json APR-dependency-ui-test-runner"],
    backend: [EXIT_OK, "not-applicable: 组件库没有后端代码 (仓库无服务端入口与 API 路由)"],
    contract: [EXIT_OK, "not-applicable: 没有 docs/reference/api 契约, 组件库不发起请求"],
    perf: [EXIT_ERROR, "blocked: 文档站 38 个路由的首屏预算需要 Playwright, 见 approvals.json APR-dependency-perf-runner"],
};

function parse(command: string, args: string[]): Flags {
    const flags: Flags = Object.create(null);
    for (let index = 0; index < args.length; index += ARG_STRIDE) {
        const key = args[index].replace(/^--/, "");
        const value = args[index + 1];
        if (!args[index].startsWith(OPTION_PREFIX) || !OPTIONS[command]?.includes(key) || value === undefined || value.startsWith(OPTION_PREFIX)) {
            throw new Error("Unknown option or missing value: " + args[index]);
        }
        (flags[key] ??= []).push(value);
    }
    return flags;
}

/** pre-push: every pushed ref gets its exact range; an unprovable base scans everything. */
function push(root: string, flags: Flags): number {
    const remote = one(flags, "remote", "origin")!;
    let status = EXIT_OK;
    for (const row of readFileSync(0, UTF8).split(NEWLINE).filter(Boolean)) {
        const [, local, , remoteSha] = row.split(SPACE);
        if (ZERO.test(local)) {
            continue;
        }
        let base = remoteSha;
        if (ZERO.test(base)) {
            try {
                base = git(root, ["merge-base", local, "refs/remotes/" + remote + "/HEAD"]).trim();
            } catch {
                base = EMPTY;
            }
        }
        const range = { mode: [MODE_RANGE], base: [base], head: [local] };
        status = Math.max(status, check(root, range));
        status = Math.max(status, tests(root, { event: [CMD_PUSH] }, collectScope(root, MODE_RANGE, base, local)));
    }
    return status;
}

function hooks(root: string): number {
    let current = "";
    try {
        current = git(root, [GIT_CONFIG, "--get", "core.hooksPath"]).trim();
    } catch {
        current = "";
    }
    if (current && current !== HOOKS_PATH) {
        console.error("core.hooksPath 已是 " + current + ", 未覆盖; 请在该目录的 hook 中调用 " + HOOKS_PATH + " 下同名脚本");
        return EXIT_ERROR;
    }
    for (const name of readdirSync(join(root, HOOKS_PATH))) {
        chmodSync(join(root, HOOKS_PATH, name), EXECUTABLE);
    }
    const result = spawnSync(GIT, [GIT_DIR_OPTION, root, GIT_CONFIG, "core.hooksPath", HOOKS_PATH], { stdio: "inherit" });
    if (result.error || result.status !== EXIT_OK) {
        console.error("Git hooks 安装失败: " + (result.error?.message ?? "git config 退出 " + result.status));
        return EXIT_ERROR;
    }
    console.log("Git hooks 已指向 " + HOOKS_PATH + " (pre-commit / pre-push / post-commit), 原 .git/hooks 下的同名 hook 会被继续调用");
    return EXIT_OK;
}

function build(root: string): number {
    const out = process.env[BUILD_ENV];
    if (!out) {
        throw new Error(BUILD_ENV + " is required for build");
    }
    const result = spawnSync(NPM, ["--prefix", DOCS_DIR, "run", GROUP_BUILD, OPTION_PREFIX, "--outDir", join(out, DOCS_DIST), "--emptyOutDir"], {
        cwd: root, stdio: "inherit",
    });
    return result.status ?? EXIT_TOOL;
}

export function main(argv: string[]): number {
    const [command, ...rest] = argv;
    const flags = parse(command, rest);
    const root = one(flags, FLAG_ROOT, ROOT)!;
    switch (command) {
        case CMD_CHECK: return check(root, flags);
        case CMD_BASELINE: return makeBaseline(root, flags);
        case "graph": return graph(root, flags);
        case "tests": return tests(root, flags);
        case CMD_PUSH: return push(root, flags);
        case "done": return Math.max(check(root, { mode: [MODE_WORKTREE] }), tests(root, { mode: [MODE_WORKTREE] }));
        case "hooks": return hooks(root);
        case GROUP_BUILD: return build(root);
        case CMD_AUDIT: return vendoredCli([CMD_AUDIT, "--manifest", join(root, COVERAGE_FILE), "--out", join(root, REPORT_DIR, CMD_AUDIT)]);
        case "layer": {
            const [code, message] = LAYERS[one(flags, "name") ?? ""] ?? [EXIT_TOOL, "unknown layer"];
            console.log(message);
            return code;
        }
        default: throw new Error("Usage: index.ts check|baseline|graph|tests|push|done|hooks|build|audit|layer");
    }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    try {
        process.exitCode = main(process.argv.slice(USER_ARGS_START));
    } catch (error) {
        saveToolError(error, join(ROOT, REPORT_DIR, "tool-error"));
        process.exitCode = EXIT_TOOL;
    }
}
