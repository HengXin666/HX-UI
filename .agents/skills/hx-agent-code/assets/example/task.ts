import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

/**
 * Keep the runnable example separate from production checker coverage
 *

 * .agents/notes/implemented/process/2026-10-07-agent-code-installation-contract.md
 */
/** 按范围的 head 读文件内容, 不读工作区: 同一个 checker 也会被拿去复现 base tree 上的存量违规 */
function readAt(head: string, path: string): string {
    return execFileSync("git", ["show", head + ":" + path], { encoding: "utf8" });
}

function exampleMain(): void {
    const command = process.argv[2];
    const source = "src/value.txt";
    const build = process.env.HX_QUALITY_BUILD;
    if (command === "check") {
        const scope = JSON.parse(readFileSync(process.env.HX_QUALITY_SCOPE!, "utf8"));
        const changed = scope.changes.some((item: { path: string }) => item.path === source);
        const value = changed ? readAt(scope.head, source).trim() : "";
        process.stdout.write(JSON.stringify(changed && value !== "ready" ? [{
            ruleId: "PROJECT-VALUE", severity: "error", path: source, line: 1,
            message: "Expected ready", evidence: "Example checker", fingerprint: "value:" + value,
        }] : []));
    } else if (command === "docs") {
        const scope = JSON.parse(readFileSync(process.env.HX_QUALITY_SCOPE!, "utf8"));
        const findings = [];
        for (const item of scope.changes as { path: string; status: string }[]) {
            if (item.path.endsWith(".md") && item.status !== "D") {
                const text = readAt(scope.head, item.path);
                if (!text.trim()) {
                    findings.push({
                        ruleId: "PROJECT-DOCS", severity: "error", path: item.path, line: 1,
                        message: "Empty document", evidence: "Example docs checker", fingerprint: "empty-document",
                    });
                }
            }
        }
        process.stdout.write(JSON.stringify(findings));
    } else if (command === "build") {
        assert(build);
        mkdirSync(build, { recursive: true });
        writeFileSync(join(build, "value.txt"), readFileSync(source));
    } else if (command === "test") {
        assert(build);
        assert.equal(readFileSync(join(build, "value.txt"), "utf8").trim(), "ready");
    } else if (command === "graph") {
        process.stdout.write(JSON.stringify({
            complete: true, inputs: {}, global: ["scripts", ".github", ".agents"],
            modules: {
                value: { paths: ["src"], tests: ["value:unit"], dependsOn: [], contracts: [] },
                docs: { paths: ["docs"], tests: [], dependsOn: [], contracts: [] },
            },
        }));
    } else {
        throw new Error("Unknown example command");
    }
}

exampleMain();
