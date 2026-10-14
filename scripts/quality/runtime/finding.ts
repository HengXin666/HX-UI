import { EVIDENCE_LIMIT } from "../../constants/quality.ts";
import { fingerprint } from "../../../.agents/skills/hx-agent-code/scripts/core/report.ts";
import type { Finding, Severity } from "../../../.agents/skills/hx-agent-code/scripts/core/model.ts";
import type { Snapshot } from "../checks/snapshot.ts";
import { inScope } from "../checks/snapshot.ts";

export type Group = "code" | "docs";
export type Rule = {
    id: string;
    severity: Severity;
    group: Group;
    /** One line of what the rule enforces, copied into reports and docs. */
    summary: string;
    run: (snapshot: Snapshot) => Finding[];
};

/**
 * Builds findings whose fingerprint is rule + path + violation key + its k-th occurrence in the file.
 * Line numbers stay out of the identity, so edits elsewhere keep historical entries matched
 * while every extra occurrence of a known violation becomes a new identity.
 */
export class Collector {
    readonly findings: Finding[] = [];
    private readonly seen = new Map<string, number>();
    private readonly rule: Rule | Pick<Rule, "id" | "severity">;

    constructor(rule: Pick<Rule, "id" | "severity">) {
        this.rule = rule;
    }

    add(path: string, line: number, message: string, evidence: string, key: string): void {
        const identity = JSON.stringify([path, key]);
        const count = (this.seen.get(identity) ?? 0) + 1;
        this.seen.set(identity, count);
        this.findings.push({
            ruleId: this.rule.id, severity: this.rule.severity, path, line: Math.max(1, line), message,
            evidence: evidence.trim().slice(0, EVIDENCE_LIMIT) || key,
            fingerprint: fingerprint(this.rule.id, path, key, String(count)),
        });
    }

    scoped(snapshot: Snapshot): Finding[] {
        return this.findings.filter((item) => inScope(snapshot, item.path));
    }
}
