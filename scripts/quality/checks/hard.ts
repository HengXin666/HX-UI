import ts from "typescript";
import {
    ABS_PATH_EXEMPT, CONSTANT_DIRS, EVIDENCE_WIDTH, SLASH, DUP_IGNORED_NUMBERS, DUP_THRESHOLD, EMPTY_TEXT, ERROR, LOCKFILES, NEWLINE, COLON, GROUP_CODE, REGEX_GLOBAL, SPACE, STRING_TYPE, NOT_FOUND,
} from "../../constants/quality.ts";
import { codeFiles, line, parse, visit } from "../runtime/ast.ts";
import { Collector } from "../runtime/finding.ts";
import type { Rule } from "../runtime/finding.ts";
import { lineOf } from "./snapshot.ts";
import type { Snapshot } from "./snapshot.ts";

const CODE = GROUP_CODE;
const NUMBER = "number";
const STRING = STRING_TYPE;

/**
 * Filesystem absolute path forms: POSIX system roots, Windows drives, UNC, home and file URLs.
 * The left guard keeps URL paths such as example.com/home out of the match.
 */
const ABSOLUTE = new RegExp([
    String.raw`(?<![\w.~:#/-])/(?!/)(?=[\w.~/-])(?:[\w.~+-]+/)*[\w.~+-]+(?=[/\s"'\x60]|$)`,
    String.raw`(?<![\w])[A-Za-z]:\\(?=[\w.-])`,
    String.raw`(?<![\w])[A-Za-z]:/(?=[\w.-]+/)`,
    String.raw`(?<![\w/~])~[/]`,
    String.raw`\\\\[\w.-]+\\`,
    String.raw`file:\/\/\/`,
].join("|"), REGEX_GLOBAL);
const PATH_CALL = /(?:^|\.)(?:join|resolve|normalize|relative)$/;
const ROOTED = /^(?:\/(?!\/)[\w.~-]|[A-Za-z]:[\\/])/;

function excludedLiteral(node: ts.Node): boolean {
    const parent = node.parent;
    if (!parent) {
        return true;
    }
    if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent) || ts.isExternalModuleReference(parent)
        || ts.isLiteralTypeNode(parent) || ts.isModuleDeclaration(parent) || ts.isImportTypeNode(parent)) {
        return true;
    }
    if (ts.isCallExpression(parent) && parent.expression.kind === ts.SyntaxKind.ImportKeyword) {
        return true;
    }
    if ((ts.isPropertyAssignment(parent) || ts.isPropertySignature(parent) || ts.isPropertyDeclaration(parent)
        || ts.isMethodDeclaration(parent) || ts.isEnumMember(parent)) && parent.name === node) {
        return true;
    }
    return ts.isExpressionStatement(parent) && ts.isSourceFile(parent.parent);
}

function literalKey(node: ts.Node): string | undefined {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        return node.text === EMPTY_TEXT ? undefined : STRING + COLON + node.text;
    }
    if (ts.isNumericLiteral(node)) {
        const value = String(Number(node.text));
        const signed = ts.isPrefixUnaryExpression(node.parent) && node.parent.operator === ts.SyntaxKind.MinusToken;
        return DUP_IGNORED_NUMBERS.includes(value) && !signed ? undefined : NUMBER + COLON + (signed ? "-" : "") + value;
    }
    return undefined;
}

/** Tooling under scripts/ and the shipped library plus its docs site are counted as separate pools. */
function pool(path: string): string {
    return CONSTANT_DIRS.find((dir) => path.startsWith(dir.split(SLASH)[0] + SLASH)) ?? CONSTANT_DIRS[0];
}

const constDup: Rule = {
    id: "PROJECT-CONST-DUP", severity: ERROR, group: CODE,
    summary: "同一字符串或数字字面量在同一代码池 (库与文档站 / scripts 工具) 出现 >= " + DUP_THRESHOLD
        + " 次必须提取为常量, 分别放到 " + CONSTANT_DIRS.join(" 与 "),
    run: (snapshot) => {
        const out = new Collector(constDup);
        const uses = new Map<string, Array<{ path: string; line: number; evidence: string }>>();
        for (const [path, text] of codeFiles(snapshot)) {
            if (CONSTANT_DIRS.some((dir) => path.startsWith(dir))) {
                continue;
            }
            const source = parse(path, text);
            visit(source, (node) => {
                const literal = excludedLiteral(node) ? undefined : literalKey(node);
                const key = literal && pool(path) + SPACE + literal;
                if (key) {
                    const at = line(source, node.getStart(source));
                    const list = uses.get(key) ?? [];
                    list.push({ path, line: at, evidence: text.split(NEWLINE)[at - 1] ?? key });
                    uses.set(key, list);
                }
            });
        }
        for (const [key, list] of [...uses].sort(([a], [b]) => (a < b ? NOT_FOUND : 1))) {
            if (list.length < DUP_THRESHOLD) {
                continue;
            }
            const [dir, ...rest] = key.split(SPACE);
            const literal = rest.join(SPACE);
            const shown = literal.length > EVIDENCE_WIDTH ? literal.slice(0, EVIDENCE_WIDTH) + "..." : literal;
            for (const use of list) {
                out.add(use.path, use.line, "字面量 " + shown + " 出现 " + list.length + " 次, 提取到 " + dir + " 后引用",
                    use.evidence, key);
            }
        }
        return out.scoped(snapshot);
    },
};

function concatenation(source: ts.SourceFile, out: Collector, path: string): void {
    visit(source, (node) => {
        let literal: ts.Node | undefined;
        if (ts.isCallExpression(node) && PATH_CALL.test(node.expression.getText(source)) && node.arguments.length) {
            literal = node.arguments[0];
        } else if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken
            && !ts.isBinaryExpression(node.parent)) {
            let left: ts.Expression = node;
            while (ts.isBinaryExpression(left)) {
                left = left.left;
            }
            literal = left;
        } else if (ts.isTemplateExpression(node)) {
            literal = node.head;
        }
        const text = literal && (ts.isStringLiteralLike(literal) || ts.isTemplateHead(literal)) ? literal.text : undefined;
        if (text !== undefined && ROOTED.test(text)) {
            out.add(path, line(source, node.getStart(source)), "绝对路径拼接: 以根路径开头的字面量参与路径构造",
                node.getText(source).split(NEWLINE)[0], "concat:" + text);
        }
    });
}

const absPath: Rule = {
    id: "PROJECT-NO-ABS-PATH", severity: ERROR, group: CODE,
    summary: "禁止任何文件系统绝对路径写法 (POSIX 系统根目录, Windows 盘符与 UNC, 家目录, file URL, shebang) 及以根路径开头的路径拼接",
    run: (snapshot) => {
        const out = new Collector(absPath);
        for (const [path, text] of snapshot.files) {
            if (ABS_PATH_EXEMPT.includes(path) || LOCKFILES.includes(path)) {
                continue;
            }
            for (const match of text.matchAll(ABSOLUTE)) {
                const at = lineOf(text, match.index);
                out.add(path, at, "绝对路径写法, 改为仓库相对路径或运行时解析", text.split(NEWLINE)[at - 1] ?? match[0],
                    "path:" + match[0]);
            }
        }
        for (const [path, text] of codeFiles(snapshot)) {
            concatenation(parse(path, text), out, path);
        }
        return out.scoped(snapshot);
    },
};

export const hardRules: Rule[] = [constDup, absPath];
export type { Snapshot };
