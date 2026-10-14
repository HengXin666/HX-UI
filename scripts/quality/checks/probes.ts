/**
 * Gate self tests: positive and negative probe for every registered rule plus integration boundaries.
 * Each probe runs the real entry in a temporary Git repository; fixtures live in scripts/quality/fixtures.json.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
    CI_FILE, COVERAGE_FILE, ENTRY_FILE, RULE_CI, ERROR, EXIT_ERROR, EXIT_OK, EXIT_TOOL, FIXTURES_FILE, GIT, JSON_INDENT, NEWLINE, NODE,
    REPORT_DIR, UTF8, VENDOR_SKILL, CMD_AUDIT, CMD_BASELINE, CMD_CHECK, COLON_SPACE, FLAG_BASE, GIT_CONFIG, GIT_DIR_OPTION, JSON_EXT, MODE_ALL, MODE_STAGED, MODE_WORKTREE, NODE_MODULES, SLASH, SPACE, STRING_TYPE, EVIDENCE_LIMIT,
} from "../../constants/quality.ts";
import { RULES } from "../runtime/registry.ts";

type Content = string | { repeat?: string; times?: number; suffix?: string; copy?: string; dropRule?: string };
type Fixture = { mode: string; base: Record<string, Content>; positive: Record<string, Content>; negative: Record<string, Content> };
type Result = { probe: string; ok: boolean; detail: string };

const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const ENTRY = join(ROOT, ENTRY_FILE);
const FINDINGS = "findings";
const RULE_OPTION = "--rule";
const GROUP_OPTION = "--group";
const WORKFLOW_DIR = ".github/workflows/";
const MODE_OPTION = "--mode";
const FORMAT_OPTION = "--format";
const OUT_OPTION = "--out";
const HEX_RULE = "PROJECT-UI-HEX";
const FIXTURE_FILE = "src/a.tsx";
const PROBE_NAME = "probe";
const POSITIVE = "positive";
const RULE_PAIR = 2;
const TOOL_ERROR_DETAIL = "exit " + EXIT_TOOL;
const results: Result[] = [];

function content(spec: Content): string {
    if (typeof spec === STRING_TYPE) {
        return spec;
    }
    if (spec.copy) {
        const text = readFileSync(join(ROOT, spec.copy), UTF8);
        if (!spec.dropRule) {
            return text;
        }
        const rows = JSON.parse(text) as Array<{ id: string }>;
        return JSON.stringify(rows.filter((row) => row.id !== spec.dropRule), null, JSON_INDENT);
    }
    return spec.repeat!.repeat(spec.times!) + (spec.suffix ?? "");
}

function writeAll(dir: string, files: Record<string, Content>): void {
    for (const [path, spec] of Object.entries(files)) {
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(join(dir, path), content(spec));
    }
}

function sh(dir: string, args: string[]): void {
    const result = spawnSync(GIT, [GIT_DIR_OPTION, dir, ...args], { encoding: UTF8 });
    if (result.status !== EXIT_OK) {
        throw new Error("git " + args.join(SPACE) + COLON_SPACE + result.stderr);
    }
}

function repo(base: Record<string, Content>): string {
    const dir = mkdtempSync(join(tmpdir(), "hx-probe-"));
    sh(dir, ["init", "-q", "-b", "main"]);
    sh(dir, [GIT_CONFIG, "user.email", "probe@example.com"]);
    sh(dir, [GIT_CONFIG, "user.name", PROBE_NAME]);
    symlinkSync(join(ROOT, NODE_MODULES), join(dir, NODE_MODULES));
    mkdirSync(join(dir, VENDOR_SKILL), { recursive: true });
    writeAll(dir, { ".gitignore": "node_modules\n", ...base });
    sh(dir, ["add", "-A"]);
    sh(dir, ["commit", "-q", "--allow-empty", "-m", FLAG_BASE]);
    return dir;
}

// 探针在临时仓库里运行检查器; 外层 CI runner 注入的 HX_QUALITY_* (范围文件 / 构建目录) 指向真实仓库, 必须剥离, 否则检查器会按错误的范围运行
const PROBE_ENV: NodeJS.ProcessEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("HX_QUALITY_")));

function run(dir: string, args: string[], input?: string) {
    const result = spawnSync(NODE, [ENTRY, ...args, "--root", dir], { encoding: UTF8, input, cwd: dir, env: PROBE_ENV });
    let findings: Array<{ ruleId: string; message: string }> = [];
    let parsed = true;
    try {
        findings = JSON.parse(result.stdout);
    } catch {
        parsed = false;
    }
    return { status: result.status, findings, parsed, stdout: result.stdout, stderr: result.stderr };
}

function record(probe: string, ok: boolean, detail: string): void {
    results.push({ probe, ok, detail });
}

function ruleProbes(fixtures: Record<string, Fixture>): void {
    for (const rule of RULES) {
        const fixture = fixtures[rule.id];
        if (!fixture) {
            record(rule.id, false, "缺少正反 fixture");
            continue;
        }
        for (const side of [POSITIVE, "negative"] as const) {
            const dir = repo(fixture.base);
            writeAll(dir, fixture[side]);
            const out = run(dir, [CMD_CHECK, MODE_OPTION, fixture.mode, RULE_OPTION, rule.id, FORMAT_OPTION, FINDINGS]);
            const hits = out.findings.filter((item) => item.ruleId === rule.id);
            const expected = side === POSITIVE || rule.severity !== ERROR ? EXIT_OK : EXIT_ERROR;
            const ok = out.parsed && (side === POSITIVE ? hits.length === 0 : hits.length > 0) && out.status === expected;
            record(rule.id + SPACE + side, ok, "exit " + out.status + ", findings " + hits.length
                + (ok ? "" : SPACE + (out.parsed ? hits[0]?.message ?? out.stderr.slice(0, EVIDENCE_LIMIT) : "输出不是合法 JSON")));
            rmSync(dir, { recursive: true, force: true });
        }
    }
}

function integration(fixtures: Record<string, Fixture>): void {
    const dir = repo({});
    writeAll(dir, { [FIXTURE_FILE]: fixtures[HEX_RULE].negative[FIXTURE_FILE] as string,
        "src/b.tsx": fixtures["PROJECT-UI-BW"].negative[FIXTURE_FILE] as string });
    const both = run(dir, [CMD_CHECK, MODE_OPTION, MODE_ALL, RULE_OPTION, "PROJECT-UI-HEX,PROJECT-UI-BW", FORMAT_OPTION, FINDINGS]);
    record("two failing checkers both reported", new Set(both.findings.map((item) => item.ruleId)).size === RULE_PAIR, String(both.status));
    record("unknown option is a tool error", run(dir, [CMD_CHECK, "--bogus", "x"]).status === EXIT_TOOL, TOOL_ERROR_DETAIL);
    record("unknown rule is a tool error", run(dir, [CMD_CHECK, RULE_OPTION, "HC-NOPE"]).status === EXIT_TOOL, TOOL_ERROR_DETAIL);
    record("unknown group is a tool error", run(dir, [CMD_CHECK, GROUP_OPTION, "nope"]).status === EXIT_TOOL, TOOL_ERROR_DETAIL);

    writeAll(dir, { "src/c.tsx": 'export const C = () => <button type="text">x</button>;\n' });
    const invalidType = run(dir, [CMD_CHECK, MODE_OPTION, MODE_ALL, RULE_OPTION, "PROJECT-UI-BUTTON-TYPE", FORMAT_OPTION, FINDINGS]);
    record("button with an invalid static type is reported", invalidType.parsed && invalidType.findings.length === 1, String(invalidType.findings.length));

    sh(dir, ["add", FIXTURE_FILE]);
    writeFileSync(join(dir, FIXTURE_FILE), "export const A = 1;\n");
    const staged = run(dir, [CMD_CHECK, MODE_OPTION, MODE_STAGED, RULE_OPTION, HEX_RULE, FORMAT_OPTION, FINDINGS]);
    const worktree = run(dir, [CMD_CHECK, MODE_OPTION, MODE_WORKTREE, RULE_OPTION, HEX_RULE, FORMAT_OPTION, FINDINGS]);
    record("pre-commit reads the index, not the worktree", staged.parsed && worktree.parsed && staged.findings.length > 0 && worktree.findings.length === 0,
        staged.findings.length + SLASH + worktree.findings.length);

    const odd = "src/空 格/ü.tsx";
    writeAll(dir, { [odd]: fixtures[HEX_RULE].negative[FIXTURE_FILE] });
    const unicode = run(dir, [CMD_CHECK, MODE_OPTION, MODE_WORKTREE, RULE_OPTION, HEX_RULE, FORMAT_OPTION, FINDINGS]);
    record("unicode and space paths enter scope", unicode.findings.length > 0, String(unicode.findings.length));
    rmSync(dir, { recursive: true, force: true });
}

/** A violation caused by the diff must surface even when the finding is anchored on a path the diff does not list. */
function scopeProbes(): void {
    const pair = repo({ "x/README.md": "# x\n\nSee AGENTS.md\n", "x/AGENTS.md": "# a\n\nSee README.md\n" });
    rmSync(join(pair, "x/README.md"));
    const deleted = run(pair, [CMD_CHECK, MODE_OPTION, MODE_WORKTREE, RULE_OPTION, "HC-CONTEXT", FORMAT_OPTION, FINDINGS]);
    record("deleting one file of a README/AGENTS pair is reported", deleted.parsed && deleted.findings.length > 0, String(deleted.findings.length));
    rmSync(pair, { recursive: true, force: true });

    const loop = repo({ "src/b.ts": 'import { C } from "./c.ts";\nexport const B = C;\n', "src/c.ts": "export const C = 1;\n" });
    writeFileSync(join(loop, "src/c.ts"), 'import { B } from "./b.ts";\nexport const C = B;\n');
    const cycle = run(loop, [CMD_CHECK, MODE_OPTION, MODE_WORKTREE, RULE_OPTION, "HC-CYCLE", FORMAT_OPTION, FINDINGS]);
    record("a new cycle closed by a later member is reported", cycle.parsed && cycle.findings.length > 0, String(cycle.findings.length));
    rmSync(loop, { recursive: true, force: true });
}

/** HC-CI reads workflow YAML by hand: a quoted run scalar may hold ` #`, a trailing comment never runs anything. */
function workflowProbes(): void {
    const runner = "node " + VENDOR_SKILL + "/scripts/ci.ts ";
    const target = WORKFLOW_DIR + "quality-code.yml";
    const others = Object.fromEntries(readdirSync(join(ROOT, WORKFLOW_DIR))
        .map((name) => WORKFLOW_DIR + name).filter((path) => path.includes("/quality-") && path !== target)
        .map((path) => [path, { copy: path }]));
    const steps = "jobs:\n  code:\n    steps:\n      - run: ";
    const cases: Array<[string, string, number]> = [
        ["HC-CI accepts a quoted run scalar containing a hash", steps + '"echo \' #\' && ' + runner + 'code"\n', 0],
        ["HC-CI rejects a runner command that is only a trailing comment", steps + "echo hi # " + runner + "code\n", 1],
    ];
    for (const [probe, body, expected] of cases) {
        const dir = repo({ ...others, [target]: body, [CI_FILE]: { copy: CI_FILE } });
        const out = run(dir, [CMD_CHECK, MODE_OPTION, MODE_ALL, RULE_OPTION, RULE_CI, FORMAT_OPTION, FINDINGS]);
        record(probe, out.parsed && out.findings.length === expected, String(out.findings.length));
        rmSync(dir, { recursive: true, force: true });
    }
}

function baselineProbe(): void {
    const one = 'export const A = () => <div className="text-[#111111]" />;\n';
    const dir = repo({ [FIXTURE_FILE]: one });
    const file = join(dir, "baseline.json");
    run(dir, [CMD_BASELINE, "--tree", "HEAD", "--approved-by", PROBE_NAME, "--reason", PROBE_NAME, OUT_OPTION, file]);
    const kept = run(dir, [CMD_CHECK, MODE_OPTION, MODE_ALL, RULE_OPTION, HEX_RULE, "--baseline", file, OUT_OPTION, join(dir, "r1")]);
    record("historical baseline Error does not block", kept.status === EXIT_OK, String(kept.status));
    writeFileSync(join(dir, FIXTURE_FILE), one + one.replace("A =", "B ="));
    const grown = run(dir, [CMD_CHECK, MODE_OPTION, MODE_ALL, RULE_OPTION, HEX_RULE, "--baseline", file, OUT_OPTION, join(dir, "r2")]);
    record("new occurrence of a baselined violation blocks", grown.status === EXIT_ERROR, String(grown.status));
    rmSync(dir, { recursive: true, force: true });
}

function auditProbe(): void {
    const dir = repo({ [COVERAGE_FILE]: { copy: COVERAGE_FILE, dropRule: "HC-TEXT" } });
    const out = spawnSync(NODE, [join(ROOT, VENDOR_SKILL, "scripts/cli.ts"), CMD_AUDIT, "--manifest", join(dir, COVERAGE_FILE),
        OUT_OPTION, join(dir, CMD_AUDIT)], { encoding: UTF8, env: PROBE_ENV });
    record("audit fails when a catalog rule loses its coverage row", out.status === EXIT_ERROR, String(out.status));
    rmSync(dir, { recursive: true, force: true });
}

function main(): number {
    const fixtures = (JSON.parse(readFileSync(join(ROOT, FIXTURES_FILE), UTF8)) as { rules: Record<string, Fixture> }).rules;
    ruleProbes(fixtures);
    integration(fixtures);
    scopeProbes();
    workflowProbes();
    baselineProbe();
    auditProbe();
    const failed = results.filter((item) => !item.ok);
    const out = join(ROOT, REPORT_DIR, "probes");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out + JSON_EXT, JSON.stringify({ total: results.length, failed: failed.length, results }, null, JSON_INDENT) + NEWLINE);
    writeFileSync(out + ".md", ["# Probes", "", ...results.map((item) => "- " + (item.ok ? "PASS" : "FAIL") + SPACE + item.probe
        + COLON_SPACE + item.detail), ""].join(NEWLINE));
    const shown = failed.length <= 10 ? failed.map((item) => "FAIL " + item.probe + COLON_SPACE + item.detail) : [];
    console.log([...shown, "Probes: " + results.length + " 项, 失败 " + failed.length, "完整报告: " + out + JSON_EXT].join(NEWLINE));
    return failed.length ? EXIT_ERROR : EXIT_OK;
}

process.exitCode = main();
