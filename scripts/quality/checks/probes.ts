/**
 * Gate self tests: positive and negative probe for every registered rule plus integration boundaries.
 * Each probe runs the real entry in a temporary Git repository; fixtures live in scripts/quality/fixtures.json.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
    COVERAGE_FILE, ENTRY_FILE, ERROR, EXIT_ERROR, EXIT_OK, EXIT_TOOL, FIXTURES_FILE, GIT, JSON_INDENT, NEWLINE, NODE,
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
const MODE_OPTION = "--mode";
const FORMAT_OPTION = "--format";
const OUT_OPTION = "--out";
const HEX_RULE = "PROJECT-UI-HEX";
const FIXTURE_FILE = "src/a.tsx";
const PROBE_NAME = "probe";
const POSITIVE = "positive";
const RULE_PAIR = 2;
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

function run(dir: string, args: string[], input?: string) {
    const result = spawnSync(NODE, [ENTRY, ...args, "--root", dir], { encoding: UTF8, input, cwd: dir });
    let findings: Array<{ ruleId: string; message: string }> = [];
    try {
        findings = JSON.parse(result.stdout);
    } catch {
        findings = [];
    }
    return { status: result.status, findings, stdout: result.stdout, stderr: result.stderr };
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
            const ok = (side === POSITIVE ? hits.length === 0 : hits.length > 0) && out.status === expected;
            record(rule.id + SPACE + side, ok, "exit " + out.status + ", findings " + hits.length
                + (ok ? "" : SPACE + (hits[0]?.message ?? out.stderr.slice(0, EVIDENCE_LIMIT))));
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
    record("unknown option is a tool error", run(dir, [CMD_CHECK, "--bogus", "x"]).status === EXIT_TOOL, "exit 2");
    record("unknown rule is a tool error", run(dir, [CMD_CHECK, RULE_OPTION, "HC-NOPE"]).status === EXIT_TOOL, "exit 2");

    sh(dir, ["add", FIXTURE_FILE]);
    writeFileSync(join(dir, FIXTURE_FILE), "export const A = 1;\n");
    const staged = run(dir, [CMD_CHECK, MODE_OPTION, MODE_STAGED, RULE_OPTION, HEX_RULE, FORMAT_OPTION, FINDINGS]);
    const worktree = run(dir, [CMD_CHECK, MODE_OPTION, MODE_WORKTREE, RULE_OPTION, HEX_RULE, FORMAT_OPTION, FINDINGS]);
    record("pre-commit reads the index, not the worktree", staged.findings.length > 0 && worktree.findings.length === 0,
        staged.findings.length + SLASH + worktree.findings.length);

    const odd = "src/空 格/ü.tsx";
    writeAll(dir, { [odd]: fixtures[HEX_RULE].negative[FIXTURE_FILE] });
    const unicode = run(dir, [CMD_CHECK, MODE_OPTION, MODE_WORKTREE, RULE_OPTION, HEX_RULE, FORMAT_OPTION, FINDINGS]);
    record("unicode and space paths enter scope", unicode.findings.length > 0, String(unicode.findings.length));
    rmSync(dir, { recursive: true, force: true });
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
        OUT_OPTION, join(dir, CMD_AUDIT)], { encoding: UTF8 });
    record("audit fails when a catalog rule loses its coverage row", out.status === EXIT_ERROR, String(out.status));
    rmSync(dir, { recursive: true, force: true });
}

function main(): number {
    const fixtures = (JSON.parse(readFileSync(join(ROOT, FIXTURES_FILE), UTF8)) as { rules: Record<string, Fixture> }).rules;
    ruleProbes(fixtures);
    integration(fixtures);
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
