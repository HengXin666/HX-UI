import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join, resolve } from "node:path";
import {
    BASELINE_FILE, BUILD_ENV, CI_FILE, DOCS_DIR, GIT_ADD, GIT_WORKTREE, RULE_CI, STDIO_INHERIT, COVERAGE_FILE, ERROR, EXIT_ERROR, EXIT_OK, JSON_INDENT, NEWLINE, REPORT_DIR,
    SCOPE_ENV, STATE_DIR, UTF8, CMD_BASELINE, COLON, FLAG_BASE, FLAG_HEAD, FLAG_MODE, FLAG_OUT, JSON_EXT, MODE_ALL, MODE_RANGE, MODE_STAGED, MODE_TREE, MODE_WORKTREE, STRING_TYPE, NOT_FOUND,
} from "../../constants/quality.ts";
import { consoleReport, fingerprint, makeReport, parseBaseline } from "../../../.agents/skills/hx-agent-code/scripts/core/report.ts";
import type { Baseline, Finding, Scope } from "../../../.agents/skills/hx-agent-code/scripts/core/model.ts";
import { selectTests } from "../../../.agents/skills/hx-agent-code/scripts/core/affected.ts";
import { parseConfig } from "../../../.agents/skills/hx-agent-code/scripts/ci/config.ts";
import { runTasks } from "../../../.agents/skills/hx-agent-code/scripts/ci/run.ts";
import { git, loadSnapshot } from "../checks/snapshot.ts";
import type { Mode, Snapshot } from "../checks/snapshot.ts";
import { impactGraph } from "./graph.ts";
import { RULES } from "./registry.ts";

export type Flags = Record<string, string[]>;
const TRUSTED = "trusted";
/** Wiring rules must pass outright; vanished violations are pruned so the baseline only ratchets down. */
const NEVER_BASELINED = ["HC-CI", "HC-COLLAB", "HC-META", "HC-TYPE"];
const NONE = "none";
/** A crashing checker surfaces as an Error finding with this prefix; it is never baselined. */
const CHECKER_FAULT = "checker 故障: ";
const MODES: Mode[] = [MODE_ALL, MODE_TREE, MODE_WORKTREE, MODE_STAGED, MODE_RANGE];

export function write(path: string, value: unknown): void {
    mkdirSync(dirname(resolve(path)), { recursive: true });
    writeFileSync(path, typeof value === STRING_TYPE ? value : JSON.stringify(value, null, JSON_INDENT) + NEWLINE);
}

export function one(flags: Flags, key: string, fallback?: string): string | undefined {
    return flags[key]?.at(NOT_FOUND) ?? fallback;
}

export function snapshotFrom(root: string, flags: Flags): Snapshot {
    const mode = one(flags, FLAG_MODE, process.env[SCOPE_ENV] ? MODE_RANGE : MODE_ALL) as Mode;
    if (!MODES.includes(mode)) {
        throw new Error("Unknown mode: " + mode);
    }
    return loadSnapshot(root, mode, one(flags, FLAG_BASE), one(flags, FLAG_HEAD) ?? one(flags, MODE_TREE));
}

/** Runs every selected checker; a crashing checker becomes an Error finding and later checkers still run. */
export function collect(snapshot: Snapshot, flags: Flags): Finding[] {
    const wanted = (flags.rule ?? []).flatMap((item) => item.split(","));
    const group = one(flags, "group");
    const selected = RULES.filter((rule) => (!wanted.length || wanted.includes(rule.id)) && (!group || rule.group === group));
    const unknown = wanted.filter((id) => !RULES.some((rule) => rule.id === id));
    if (unknown.length) {
        throw new Error("Unknown rule: " + unknown.join(", "));
    }
    if (group && !RULES.some((rule) => rule.group === group)) {
        throw new Error("Unknown group: " + group);
    }
    const findings: Finding[] = [];
    for (const rule of selected) {
        try {
            findings.push(...rule.run(snapshot));
        } catch (error) {
            const message = CHECKER_FAULT + (error instanceof Error ? error.message : String(error));
            findings.push({
                ruleId: rule.id, severity: ERROR, path: rule.id, line: 1, message, evidence: message,
                fingerprint: fingerprint(rule.id, rule.id, "tool", message),
            });
        }
    }
    return findings;
}

/**
 * Baseline comes from a committed tree (the diff base, else HEAD), never from the working copy.
 * An empty base tree (a push whose remote base cannot be proven) holds no baseline, so HEAD stands in.
 */
function baselineTree(snapshot: Snapshot): string {
    return snapshot.base && git(snapshot.root, ["ls-tree", snapshot.base]).trim() ? snapshot.base : "HEAD";
}

/**
 * 基线条目只有在 base tree 上用同一 checker 复现出同一 finding 时才生效.
 *
 * .agents/notes/implemented/process/2026-10-14-pr3-quality-gates-ci-fixes.md
 */
function baseline(snapshot: Snapshot, flags: Flags): Baseline[] {
    const choice = one(flags, CMD_BASELINE, TRUSTED)!;
    if (choice === NONE) {
        return [];
    }
    if (choice !== TRUSTED) {
        return parseBaseline(JSON.parse(readFileSync(choice, UTF8)));
    }
    const tree = baselineTree(snapshot);
    try {
        return parseBaseline(JSON.parse(git(snapshot.root, ["show", tree + COLON + BASELINE_FILE])));
    } catch {
        return [];
    }
}

export function check(root: string, flags: Flags): number {
    const snapshot = snapshotFrom(root, flags);
    const findings = collect(snapshot, flags);
    if (one(flags, "format") === "findings") {
        process.stdout.write(JSON.stringify(findings) + NEWLINE);
        return findings.some((item) => item.severity === ERROR) ? EXIT_ERROR : EXIT_OK;
    }
    const out = one(flags, FLAG_OUT, join(root, REPORT_DIR, "review"))!;
    const report = makeReport(findings, baseline(snapshot, flags));
    write(out + JSON_EXT, { ...report.json, mode: snapshot.mode, source: snapshot.source });
    write(out + ".md", report.markdown);
    consoleReport(findings, resolve(out + JSON_EXT));
    console.log("新增 Error: " + report.json.errors + ", Warning: " + report.json.warnings + ", 历史: " + report.json.historical);
    return report.exitCode;
}

export function makeBaseline(root: string, flags: Flags): number {
    const tree = one(flags, MODE_TREE);
    const approvedBy = one(flags, "approved-by");
    const reason = one(flags, "reason");
    if (!tree || !approvedBy || !reason) {
        throw new Error("baseline requires --tree, --approved-by and --reason");
    }
    const snapshot = loadSnapshot(root, MODE_TREE, undefined, tree);
    const current = new Set(collect(loadSnapshot(root, MODE_ALL), {}).map((item) => item.fingerprint));
    const entries = collect(snapshot, {})
        .filter((item) => item.severity === ERROR && !NEVER_BASELINED.includes(item.ruleId) && !item.message.startsWith(CHECKER_FAULT)
            && current.has(item.fingerprint))
        .map((item) => ({ ruleId: item.ruleId, path: item.path, fingerprint: item.fingerprint, reason, approvedBy }))
        .sort((a, b) => JSON.stringify([a.path, a.ruleId, a.fingerprint]) < JSON.stringify([b.path, b.ruleId, b.fingerprint]) ? NOT_FOUND : 1);
    write(one(flags, FLAG_OUT, join(root, BASELINE_FILE))!, entries);
    const counts: Record<string, number> = {};
    for (const entry of entries) {
        counts[entry.ruleId] = (counts[entry.ruleId] ?? 0) + 1;
    }
    console.log("baseline: " + entries.length + " 条, " + JSON.stringify(counts));
    return EXIT_OK;
}

export function graph(root: string, flags: Flags): number {
    process.stdout.write(JSON.stringify(impactGraph(snapshotFrom(root, flags))) + NEWLINE);
    return EXIT_OK;
}

/** 依赖文档站构建产物的测试; 推送检查时它们读本次检出现建的产物, 不读工作区里可能过期的 docs/dist */
const DIST_TESTS = ["docs:smoke", "docs:shell"];
const GIT_ENV = ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_PREFIX"];

/**
 * 把待推送的提交检出到独立工作树, 依赖目录链接回主工作树
 *
 * 为什么: 推送的是 scope.head, 不是工作区; 未提交的修复或过期产物都不能让推送检查变绿.
 * 工作树放在仓库的同级目录, 让 ../ 相对的兄弟目录 (如 HX-Blueprint-Demo) 解析结果与主工作树一致.
 */
function checkout(root: string, head: string): { dir: string; cleanup: () => void } {
    const dir = mkdtempSync(join(dirname(root), "." + basename(root) + "-push-"));
    rmSync(dir, { recursive: true, force: true });
    git(root, [GIT_WORKTREE, GIT_ADD, "--detach", "--quiet", dir, head]);
    for (const modules of ["node_modules", join(DOCS_DIR, "node_modules")]) {
        if (existsSync(join(root, modules)) && !existsSync(join(dir, modules))) {
            symlinkSync(join(root, modules), join(dir, modules), "dir");
        }
    }
    return {
        dir,
        cleanup: () => {
            try {
                git(root, [GIT_WORKTREE, "remove", "--force", dir]);
            } catch {
                rmSync(dir, { recursive: true, force: true });
                git(root, [GIT_WORKTREE, "prune"]);
            }
        },
    };
}

/** Local affected tests through the same registry, plan selection and task runner as CI. */
export function tests(root: string, flags: Flags, scope?: Scope): number {
    const event = one(flags, "event", "local")!;
    const config = parseConfig(JSON.parse(readFileSync(join(root, CI_FILE), UTF8)));
    const snapshot = scope ? loadSnapshot(root, MODE_TREE, undefined, scope.head) : snapshotFrom(root, flags);
    const plan = selectTests(scope ?? {
        mode: snapshot.mode, base: snapshot.base ?? "", head: snapshot.source,
        changes: snapshot.changes ?? [...(snapshot.scope ?? snapshot.paths)].map((path) => ({ status: "M", path })),
    }, impactGraph(snapshot), event === "full" ? "pr" : event);
    const reports = join(root, REPORT_DIR);
    write(join(reports, "test-plan.json"), plan);
    const env: NodeJS.ProcessEnv = { ...process.env, [BUILD_ENV]: process.env[BUILD_ENV] ?? EMPTY_BUILD };
    const tasks = plan.tests.map((id) => config.tests.find((task) => task.id === id)!);
    const pushed = scope && tasks.length ? checkout(root, scope.head) : undefined;
    let findings: Finding[];
    try {
        let cwd = root;
        if (pushed) {
            cwd = pushed.dir;
            GIT_ENV.forEach((key) => delete env[key]);
            if (!process.env[BUILD_ENV] && plan.tests.some((id) => DIST_TESTS.includes(id))) {
                env[BUILD_ENV] = join(pushed.dir, REPORT_DIR, "push-build");
                const built = spawnSync(process.execPath, ["scripts/quality/index.ts", "build"], { cwd, env, stdio: STDIO_INHERIT });
                if (built.status !== 0) {
                    throw new Error("pushed tree docs build failed");
                }
            }
        }
        findings = runTasks(cwd, tasks, config.timeoutMs, env, join(reports, "tests-tasks"));
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        findings = [{ ruleId: RULE_CI, severity: ERROR, path: CI_FILE, line: 1, message, evidence: "pre-push tests",
            fingerprint: fingerprint(RULE_CI, CI_FILE, "pre-push", message) }];
    } finally {
        pushed?.cleanup();
    }
    const report = makeReport(findings, []);
    write(join(reports, "tests.json"), report.json);
    write(join(reports, "tests.md"), report.markdown);
    console.log("测试计划: " + (plan.tests.join(", ") || "(无)") + (plan.full ? " [全量]" : ""));
    consoleReport(findings, resolve(join(reports, "tests.json")));
    return report.exitCode;
}

const EMPTY_BUILD = "";
export const STATE = STATE_DIR;
export const COVERAGE = COVERAGE_FILE;
