import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { record, string } from "../core/model.ts";
import { collectScope } from "../core/scope.ts";
import type { Scope } from "../core/model.ts";

function git(root: string, ...args: string[]): string {
    return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
}

function sha(value: unknown): string {
    const result = string(value);
    if (!/^[a-f0-9]{40,64}$/.test(result)) {
        throw new Error("Expected a full Git object ID from the event");
    }
    return result;
}

export type EventScope = { scope: Scope; event: "push" | "pr"; baselineTree: string };

/** 新分支首推没有 before: 有默认分支时取与其的 merge-base, 只检查分叉后的提交, 否则退回空树全量 */
function firstPushBase(root: string, data: Record<string, unknown>, head: string): string {
    const repository = data.repository;
    const branch = repository && typeof repository === "object" ? (repository as Record<string, unknown>).default_branch : undefined;
    if (typeof branch !== "string" || !branch.trim()) {
        return "EMPTY";
    }
    try {
        return git(root, "merge-base", "refs/remotes/origin/" + branch, head);
    } catch {
        return "EMPTY";
    }
}

export function eventScope(root: string, eventName: string, event: unknown): EventScope {
    const data = record(event);
    let base: string;
    let head: string;
    let baselineTree: string;
    if (eventName === "push") {
        if (data.deleted === true) {
            throw new Error("Deleted branch events must be skipped by the workflow");
        }
        head = sha(data.after);
        base = sha(data.before);
        if (/^0+$/.test(base)) {
            base = firstPushBase(root, data, head);
        }
        baselineTree = base;
    } else if (eventName === "pull_request") {
        const pull = record(data.pull_request);
        head = sha(record(pull.head).sha);
        // diff 从 merge-base 算; 基线读目标分支当前提交, 分叉后才审批的历史条目对本 PR 同样有效
        baselineTree = sha(record(pull.base).sha);
        base = git(root, "merge-base", baselineTree, head);
    } else {
        throw new Error("Only push and pull_request events are supported");
    }
    if (git(root, "rev-parse", "HEAD") !== head) {
        throw new Error("Checkout does not match the event head");
    }
    return { scope: collectScope(root, "range", base, head), event: eventName === "push" ? "push" : "pr", baselineTree };
}

export function githubScope(root: string): EventScope {
    const name = string(process.env.GITHUB_EVENT_NAME);
    const event = JSON.parse(readFileSync(string(process.env.GITHUB_EVENT_PATH), "utf8"));
    return eventScope(root, name, event);
}
