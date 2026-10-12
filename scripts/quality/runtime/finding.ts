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
 * Builds findings from the rule, path, violation key and a location anchor.
 * The anchor prevents an inserted violation from inheriting an approval for a later one.
 */
export class Collector {
    readonly findings: Finding[] = [];
    private readonly rule: Rule | Pick<Rule, "id" | "severity">;

    constructor(rule: Pick<Rule, "id" | "severity">) {
        this.rule = rule;
    }

    add(path: string, line: number, message: string, evidence: string, key: string): void {
        const identity = JSON.stringify([path, key, line]);
        this.findings.push({
            ruleId: this.rule.id, severity: this.rule.severity, path, line: Math.max(1, line), message,
            evidence: evidence.trim().slice(0, EVIDENCE_LIMIT) || key,
            fingerprint: fingerprint(this.rule.id, path, key, identity),
        });
    }

    scoped(snapshot: Snapshot): Finding[] {
        return this.findings.filter((item) => inScope(snapshot, item.path));
    }
}
