import ts from "typescript";
import { dirname, extname } from "node:path";
import {
    CODE_ROOTS, DIR_MAX_FILES, DOT, ERROR, HEADER_MAX_LINES, LOGIC_MAX_LINES, MARKDOWN_EXTENSIONS, NEWLINE,
    TEXT_EXEMPT, UI_MAX_LINES, WARNING, GROUP_CODE, GROUP_DOCS, LIMIT_LABEL, LINES_LABEL, TSX_EXT, SPACE,
} from "../../constants/quality.ts";
import { codeFiles, comments, line, parse, visit } from "../runtime/ast.ts";
import type { Comment } from "../runtime/ast.ts";
import { Collector } from "../runtime/finding.ts";
import type { Rule } from "../runtime/finding.ts";
import { lineOf } from "./snapshot.ts";
import type { Snapshot } from "./snapshot.ts";

const CODE = GROUP_CODE;
const DOCS = GROUP_DOCS;
const SCRIPT_EXTENSIONS = /\.(?:js|mjs|cjs)$/;
const UI_FILE = TSX_EXT;
const LINE_COMMENT = "//";
const BLOCK_OPEN = /^\/\*\*?(?![\s/*]|$)/;
const LINE_SPACING = /^\/\/\/?(?:[^\s/]|\s{2,}\S)/;
const STAR_SPACING = /^\s*\*(?![\s/]|$)/;
const CSS_TOKEN = /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|(?<comment>\/\*[\s\S]*?\*\/)/g;
const FENCE = /^\s*(?<mark>`{3,}|~{3,})(?<info>.*)$/;
const INLINE_CODE = /`[^`\n]*`/g;
const BAD_TEXT = /[\p{Extended_Pictographic}\uFE0F]|(?![\x00-\x7F])\p{P}/gu;

const ext: Rule = {
    id: "HC-EXT", severity: ERROR, group: CODE, summary: "仓库内禁止手写 .js/.mjs/.cjs, 脚本统一 .ts",
    run: (snapshot) => {
        const out = new Collector(ext);
        for (const path of snapshot.paths.filter((item) => SCRIPT_EXTENSIONS.test(item))) {
            out.add(path, 1, "禁止 js/mjs/cjs 源文件, 迁移到 .ts", path, path);
        }
        return out.scoped(snapshot);
    },
};

const size: Rule = {
    id: "HC-SIZE", severity: ERROR, group: CODE,
    summary: "逻辑文件 .ts 不超过 " + LOGIC_MAX_LINES + " 行, UI 文件 .tsx 不超过 " + UI_MAX_LINES + LINES_LABEL,
    run: (snapshot) => {
        const out = new Collector(size);
        for (const [path, text] of codeFiles(snapshot)) {
            const limit = extname(path) === UI_FILE ? UI_MAX_LINES : LOGIC_MAX_LINES;
            const count = text.replace(/\n$/, "").split(NEWLINE).length;
            if (count > limit) {
                out.add(path, limit + 1, count + LIMIT_LABEL + limit, path, "lines>" + limit);
            }
        }
        return out.scoped(snapshot);
    },
};

const directory: Rule = {
    id: "HC-DIR", severity: WARNING, group: CODE, summary: "单目录直接文件数大于 " + DIR_MAX_FILES + " 时待 review",
    run: (snapshot) => {
        const out = new Collector(directory);
        const counts = new Map<string, string[]>();
        for (const path of snapshot.paths) {
            const dir = dirname(path);
            counts.set(dir, [...(counts.get(dir) ?? []), path]);
        }
        for (const [dir, files] of counts) {
            const touched = snapshot.scope === null || files.some((file) => snapshot.scope!.has(file));
            if (files.length > DIR_MAX_FILES && touched && dir !== DOT) {
                const first = files.find((file) => snapshot.scope?.has(file)) ?? files[0];
                out.add(first, 1, dir + " 直接包含 " + files.length + " 个文件, 上限 " + DIR_MAX_FILES, dir, dir);
            }
        }
        return out.findings;
    },
};

const header: Rule = {
    id: "HC-COMMENT", severity: ERROR, group: CODE, summary: "文件头连续注释不超过 " + HEADER_MAX_LINES + LINES_LABEL,
    run: (snapshot) => {
        const out = new Collector(header);
        for (const [path, text] of codeFiles(snapshot)) {
            const source = parse(path, text);
            let end = 0;
            let lines = 0;
            for (const comment of comments(source)) {
                if (text.slice(end, comment.pos).trim()) {
                    break;
                }
                lines += comment.text.split(NEWLINE).length;
                end = comment.end;
            }
            if (lines > HEADER_MAX_LINES) {
                out.add(path, 1, "文件头注释 " + lines + LIMIT_LABEL + HEADER_MAX_LINES + ", 原因写入 note 或 docs",
                    text.split(NEWLINE)[0], "header");
            }
        }
        return out.scoped(snapshot);
    },
};

function trailingColumns(source: ts.SourceFile, list: Comment[], out: Collector, path: string): void {
    const trailing = list.filter((item) => item.trailing && item.text.startsWith(LINE_COMMENT));
    for (let index = 1; index < trailing.length; index++) {
        const previous = source.getLineAndCharacterOfPosition(trailing[index - 1].pos);
        const current = source.getLineAndCharacterOfPosition(trailing[index].pos);
        if (current.line === previous.line + 1 && current.character !== previous.character) {
            out.add(path, current.line + 1, "连续尾随注释起始列未对齐 (" + previous.character + " / " + current.character + ")",
                trailing[index].text, "align");
        }
    }
}

const commentSpace: Rule = {
    id: "HC-COMMENT-SPACE", severity: ERROR, group: CODE,
    summary: "注释标记后恰好一个空格, 连续尾随单行注释起始列对齐",
    run: (snapshot) => {
        const out = new Collector(commentSpace);
        for (const [path, text] of codeFiles(snapshot)) {
            const source = parse(path, text);
            const list = comments(source);
            for (const comment of list) {
                const at = line(source, comment.pos);
                const lines = comment.text.split(NEWLINE);
                if (LINE_SPACING.test(comment.text) || BLOCK_OPEN.test(comment.text)) {
                    out.add(path, at, "注释标记后需要恰好一个空格", lines[0], "space");
                }
                lines.slice(1).forEach((item, offset) => {
                    if (STAR_SPACING.test(item)) {
                        out.add(path, at + offset + 1, "块注释的 * 后需要一个空格", item, "star");
                    }
                });
            }
            trailingColumns(source, list, out, path);
        }
        return out.scoped(snapshot);
    },
};

/** Same-length blank keeps offsets of the remaining prose aligned with the original file. */
function blank(text: string): string {
    return text.replace(/[^\n]/g, SPACE);
}

/** A fence closes only with the same mark character, at least as long as the opener, and no info string. */
function markdownProse(text: string): string {
    let opener: string | undefined;
    return text.split(NEWLINE).map((row) => {
        const fence = FENCE.exec(row);
        if (opener === undefined && fence) {
            opener = fence.groups!.mark;
            return blank(row);
        }
        if (opener !== undefined) {
            if (fence && fence.groups!.mark[0] === opener[0] && fence.groups!.mark.length >= opener.length && !fence.groups!.info.trim()) {
                opener = undefined;
            }
            return blank(row);
        }
        return row.replace(INLINE_CODE, blank);
    }).join(NEWLINE);
}

/** Comment and document text only; strings stay out because UI copy is localized data. */
function prose(path: string, text: string): Array<{ offset: number; text: string }> {
    if (MARKDOWN_EXTENSIONS.includes(extname(path))) {
        return [{ offset: 0, text: markdownProse(text) }];
    }
    if (path.startsWith(".github/") && /\.ya?ml$/.test(path)) {
        return [{ offset: 0, text }];
    }
    if (extname(path) === ".css") {
        return [...text.matchAll(CSS_TOKEN)].filter((match) => match.groups!.comment !== undefined)
            .map((match) => ({ offset: match.index, text: match[0] }));
    }
    if (CODE_ROOTS.some((root) => path.startsWith(root)) && /\.tsx?$/.test(path)) {
        return comments(parse(path, text)).map((item) => ({ offset: item.pos, text: item.text }));
    }
    return [];
}

const textRule: Rule = {
    id: "HC-TEXT", severity: ERROR, group: DOCS,
    summary: "注释与文档不用 emoji 或非 ASCII 标点, 中文正文允许, 代码字符串与代码块不检查",
    run: (snapshot) => {
        const out = new Collector(textRule);
        for (const [path, text] of snapshot.files) {
            if (TEXT_EXEMPT.includes(path)) {
                continue;
            }
            for (const part of prose(path, text)) {
                for (const match of part.text.matchAll(BAD_TEXT)) {
                    const at = lineOf(text, part.offset + match.index);
                    out.add(path, at, "非 ASCII 标点或 emoji: " + match[0], text.split(NEWLINE)[at - 1] ?? match[0], match[0]);
                }
            }
        }
        return out.scoped(snapshot);
    },
};

function parameterNames(node: ts.SignatureDeclaration): Array<string | undefined> {
    return node.parameters.map((item) => (ts.isIdentifier(item.name) ? item.name.text : undefined));
}

const docSignature: Rule = {
    id: "HC-DOCSIG", severity: ERROR, group: CODE, summary: "已写 @param 的函数文档必须与参数名逐一对应",
    run: (snapshot) => {
        const out = new Collector(docSignature);
        for (const [path, text] of codeFiles(snapshot)) {
            const source = parse(path, text);
            visit(source, (node) => {
                if (!ts.isFunctionLike(node)) {
                    return;
                }
                const tags = ts.getJSDocTags(node).filter(ts.isJSDocParameterTag);
                const documented = tags.map((tag) => tag.name.getText(source)).filter((name) => !name.includes(DOT));
                if (!documented.length) {
                    return;
                }
                const names = parameterNames(node);
                const at = line(source, node.getStart(source));
                for (const name of documented.filter((item) => !names.includes(item))) {
                    if (!names.includes(undefined)) {
                        out.add(path, at, "@param " + name + " 不是该函数的参数", name, "stale:" + name);
                    }
                }
                for (const name of names.filter((item): item is string => !!item && !documented.includes(item))) {
                    out.add(path, at, "参数 " + name + " 缺少 @param", name, "missing:" + name);
                }
            });
        }
        return out.scoped(snapshot);
    },
};

export const codeRules: Rule[] = [ext, size, directory, header, commentSpace, textRule, docSignature];
export type { Snapshot };
