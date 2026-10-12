import { CI_FILE, COVERAGE_FILE, ENTRY_FILE, ERROR, HOOK_DIR, PACKAGE_FILE, VENDOR_SKILL, CODEOWNERS_FILE, COLON_SPACE, CONTRIBUTING_FILE, GIT_CONFIG, GROUP_BUILD, GROUP_CODE, GROUP_DOCS, NEWLINE, SPACE, CMD_PUSH, MODE_STAGED } from "../../constants/quality.ts";
import { parseConfig } from "../../../.agents/skills/hx-agent-code/scripts/ci/config.ts";
import { codeRules } from "../checks/code.ts";
import { docsRules } from "../checks/docs.ts";
import { hardRules } from "../checks/hard.ts";
import { uiRules } from "../checks/ui.ts";
import { diffRules } from "./diff.ts";
import { Collector } from "./finding.ts";
import type { Rule } from "./finding.ts";
import { graphRules } from "./graph.ts";

const CODE = GROUP_CODE;
const WORKFLOWS = ".github/workflows/";
const CI_GROUPS: Record<string, string[]> = {
    "quality-code.yml": [CODE], "quality-docs.yml": [GROUP_DOCS], "quality-build.yml": [GROUP_BUILD, "compatibility"],
    "quality-tests.yml": ["tests"],
};
const COLLAB_FILES = [
    ".github/ISSUE_TEMPLATE/bug.yml", ".github/ISSUE_TEMPLATE/feature.yml", ".github/ISSUE_TEMPLATE/component-request.yml",
    ".github/PULL_REQUEST_TEMPLATE.md", CODEOWNERS_FILE, CONTRIBUTING_FILE,
];
const CODEOWNERS = CODEOWNERS_FILE;
/** Owners confirmed through the GitHub API as the repository owner, see docs/reference/quality/inventory.md. */
const VERIFIED_OWNERS = ["@HengXin666"];
const HOOKS: Record<string, string> = { "pre-commit": MODE_STAGED, "pre-push": CMD_PUSH };
const RUNNER = VENDOR_SKILL + "/scripts/ci.ts";

const ci: Rule = {
    id: "HC-CI", severity: ERROR, group: CODE,
    summary: "三个 push/PR 入口与可复用测试流程存在并调用 vendored runner, ci.json 通过 runner 配置校验",
    run: (snapshot) => {
        const out = new Collector(ci);
        for (const [file, groups] of Object.entries(CI_GROUPS)) {
            const text = snapshot.files.get(WORKFLOWS + file);
            for (const group of groups.filter((item) => !text?.includes(RUNNER + SPACE + item))) {
                out.add(WORKFLOWS + file, 1, "工作流缺失或未调用 " + RUNNER + SPACE + group, file, group);
            }
        }
        try {
            parseConfig(JSON.parse(snapshot.files.get(CI_FILE) ?? "null"));
        } catch (error) {
            out.add(CI_FILE, 1, "ci.json 无效: " + String(error), CI_FILE, GIT_CONFIG);
        }
        return out.findings;
    },
};

const collab: Rule = {
    id: "HC-COLLAB", severity: ERROR, group: CODE,
    summary: "Bug/Feature/组件需求 Issue 模板, PR 模板, CODEOWNERS 与 CONTRIBUTING 存在且归属为已验证身份",
    run: (snapshot) => {
        const out = new Collector(collab);
        for (const file of COLLAB_FILES.filter((item) => !snapshot.files.get(item)?.trim())) {
            out.add(file, 1, "协作文件缺失或为空", file, file);
        }
        const owners = (snapshot.files.get(CODEOWNERS) ?? "").split(NEWLINE).filter((row) => row.trim() && !row.startsWith("#"))
            .flatMap((row) => row.trim().split(/\s+/).slice(1));
        for (const owner of owners.filter((item) => !VERIFIED_OWNERS.includes(item))) {
            out.add(CODEOWNERS, 1, "CODEOWNERS 含未验证身份 " + owner, owner, owner);
        }
        return out.findings;
    },
};

/** Registry and wiring audit; the catalog side is audited by the vendored cli audit. */
const meta: Rule = {
    id: "HC-META", severity: ERROR, group: CODE,
    summary: "注册表与 coverage.json 一一对应, hook 与 package 脚本接到单一入口",
    run: (snapshot) => {
        const out = new Collector(meta);
        const rows = JSON.parse(snapshot.files.get(COVERAGE_FILE) ?? "[]") as Array<Record<string, unknown>>;
        const implemented = new Set(rows.filter((row) => row.status === "implemented").map((row) => String(row.id)));
        for (const rule of RULES.filter((item) => !implemented.has(item.id))) {
            out.add(COVERAGE_FILE, 1, rule.id + " 已注册但 coverage 未登记为 implemented", rule.id, "unlisted:" + rule.id);
        }
        const ids = new Set(RULES.map((rule) => rule.id));
        for (const id of [...implemented].filter((item) => !ids.has(item))) {
            out.add(COVERAGE_FILE, 1, id + " 登记为 implemented 但注册表没有对应 checker", id, "unregistered:" + id);
        }
        for (const [hook, word] of Object.entries(HOOKS)) {
            const text = snapshot.files.get(HOOK_DIR + hook) ?? "";
            if (!text.includes(ENTRY_FILE) || !text.includes(word)) {
                out.add(HOOK_DIR + hook, 1, "Git hook 未接到 " + ENTRY_FILE + SPACE + word, hook, hook);
            }
        }
        if (!(snapshot.files.get(PACKAGE_FILE) ?? "").includes(ENTRY_FILE)) {
            out.add(PACKAGE_FILE, 1, "package.json 脚本未接到质量入口", PACKAGE_FILE, "scripts");
        }
        return out.findings;
    },
};

export const RULES: Rule[] = [...uiRules, ...hardRules, ...codeRules, ...docsRules, ...graphRules, ...diffRules, ci, collab, meta];
