import ts from "typescript";
import { extname } from "node:path";
import { MARKDOWN_EXTENSIONS, NEWLINE, WARNING, COLON, GROUP_CODE, GROUP_DOCS, MODE_RANGE, MODE_STAGED, OPTION_PREFIX, NOT_FOUND } from "../../constants/quality.ts";
import { git } from "../checks/snapshot.ts";
import type { Snapshot } from "../checks/snapshot.ts";
import { codeFiles, comments, line, parse, visit } from "./ast.ts";
import { Collector } from "./finding.ts";
import type { Rule } from "./finding.ts";

const CODE = GROUP_CODE;
const DOCS = GROUP_DOCS;
const HUNK = /^@@ -\d+(?:,\d+)? \+(?<start>\d+)(?:,(?<count>\d+))? @@/;
const ALL_LINES = NOT_FOUND;

/** Changed head-side line numbers of one file; ALL_LINES marks a file without a base version. */
function changedLines(snapshot: Snapshot, path: string): Set<number> {
    const base = snapshot.base!;
    const head = snapshot.mode === MODE_RANGE ? [base, snapshot.source] : snapshot.mode === MODE_STAGED ? ["--cached", base] : [base];
    let raw: string;
    try {
        git(snapshot.root, ["cat-file", "-e", base + COLON + path]);
        raw = git(snapshot.root, ["diff", "--no-ext-diff", "-U0", ...head, OPTION_PREFIX, path]);
    } catch {
        return new Set([ALL_LINES]);
    }
    const lines = new Set<number>();
    for (const row of raw.split(NEWLINE)) {
        const match = row.match(HUNK);
        if (match) {
            const start = Number(match.groups!.start);
            const count = match.groups!.count === undefined ? 1 : Number(match.groups!.count);
            for (let index = 0; index < Math.max(count, 1); index++) {
                lines.add(start + index);
            }
        }
    }
    return lines;
}

function touches(lines: Set<number>, from: number, to: number): boolean {
    if (lines.has(ALL_LINES)) {
        return true;
    }
    for (let index = from; index <= to; index++) {
        if (lines.has(index)) {
            return true;
        }
    }
    return false;
}

function diffFiles(snapshot: Snapshot): Array<[string, string, Set<number>]> {
    if (!snapshot.base || snapshot.scope === null) {
        return [];
    }
    return codeFiles(snapshot).filter(([path]) => snapshot.scope!.has(path))
        .map(([path, text]) => [path, text, changedLines(snapshot, path)]);
}

const docSync: Rule = {
    id: "HC-DOCSYNC", severity: WARNING, group: CODE,
    summary: "函数实现与其 JSDoc 只有一侧在 diff 中变化时, 提醒核对另一侧语义",
    run: (snapshot) => {
        const out = new Collector(docSync);
        for (const [path, text, lines] of diffFiles(snapshot)) {
            if (lines.has(ALL_LINES)) {
                continue;
            }
            const source = parse(path, text);
            visit(source, (node) => {
                const docs = ts.isFunctionLike(node) ? ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc) : [];
                if (!docs.length || !("body" in node) || !node.body) {
                    return;
                }
                const doc = touches(lines, line(source, docs[0].getStart(source)), line(source, docs[0].end));
                const body = touches(lines, line(source, node.body.getStart(source)), line(source, node.body.end));
                if (doc !== body) {
                    const name = ts.getNameOfDeclaration(node as ts.Declaration)?.getText(source) ?? "anonymous";
                    out.add(path, line(source, node.getStart(source)), (body ? "实现" : "文档") + "变化而另一侧未改, 核对 "
                        + name + " 的说明是否仍成立", name, name);
                }
            });
        }
        return out.findings;
    },
};

const why: Rule = {
    id: "HC-WHY", severity: WARNING, group: CODE,
    summary: "diff 中新增或修改的注释待 review: 只写意图/原因/约束, 不复述代码",
    run: (snapshot) => {
        const out = new Collector(why);
        for (const [path, text, lines] of diffFiles(snapshot)) {
            const source = parse(path, text);
            for (const comment of comments(source)) {
                const from = line(source, comment.pos);
                if (touches(lines, from, line(source, comment.end))) {
                    out.add(path, from, "注释变更待 review: 是否只说明意图/原因/约束", comment.text.split(NEWLINE)[0], comment.text);
                }
            }
        }
        return out.findings;
    },
};

const docReview: Rule = {
    id: "HC-DOC-REVIEW", severity: WARNING, group: DOCS,
    summary: "diff 中变化的文档待 review: 单一主题, 不与上下层重复, 内容仍成立",
    run: (snapshot) => {
        const out = new Collector(docReview);
        if (!snapshot.base || snapshot.scope === null) {
            return [];
        }
        for (const path of [...snapshot.scope].filter((item) => MARKDOWN_EXTENSIONS.includes(extname(item))).sort()) {
            out.add(path, 1, "文档变更待 review: 单一主题, 无重复权威, 内容仍成立", path, path);
        }
        return out.findings;
    },
};

export const diffRules: Rule[] = [docSync, why, docReview];
