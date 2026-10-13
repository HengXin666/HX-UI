import { execFileSync } from "node:child_process";
import { parseBaseline } from "../core/report.ts";
import type { Baseline, Finding } from "../core/model.ts";

export function trustedBaseline(root: string, tree: string): Baseline[] {
    if (tree === "EMPTY") {
        return [];
    }
    const path = "scripts/quality/baseline.json";
    const options = { encoding: "utf8" as const, maxBuffer: 16 * 1024 * 1024 };
    const exists = execFileSync("git", ["-C", root, "ls-tree", tree, "--", path], options).trim();
    if (!exists) {
        return [];
    }
    const text = execFileSync("git", ["-C", root, "show", tree + ":" + path], options);
    return parseBaseline(JSON.parse(text));
}

function identity(item: { ruleId: string; path: string; fingerprint: string }): string {
    return JSON.stringify([item.ruleId, item.path, item.fingerprint]);
}

/**
 * 本次改动新增的基线条目, 只有当它描述的违规在 base tree 上原样存在时才生效
 *
 * 为什么: 只读可信 base 的基线, 会让"首次引入基线"的 PR 永远无法通过; 直接信任
 * 改动里的基线又等于允许自批新违规. 用 base tree 复现来区分两者: 存量债务能复现,
 * 本次新引入的违规在 base 上不存在, 仍然按新增 Error 阻断.
 */
export function reproducedBaseline(proposed: Baseline[], trusted: Baseline[], existing: Finding[]): Baseline[] {
    const approved = new Set(trusted.map(identity));
    const atBase = new Set(existing.filter((item) => item.ruleId !== "HC-CI").map(identity));
    return proposed.filter((item) => item.ruleId !== "HC-CI" && !approved.has(identity(item)) && atBase.has(identity(item)));
}
