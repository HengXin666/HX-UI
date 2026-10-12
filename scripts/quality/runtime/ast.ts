import ts from "typescript";
import { extname } from "node:path";
import { CODE_EXTENSIONS, CODE_ROOTS, NEWLINE, SPACE, TSX_EXT } from "../../constants/quality.ts";
import type { Snapshot } from "../checks/snapshot.ts";

export type Comment = { pos: number; end: number; text: string; trailing: boolean };

const TSX = TSX_EXT;
const cache = new Map<string, ts.SourceFile>();

export function isCode(path: string): boolean {
    return CODE_EXTENSIONS.includes(extname(path)) && CODE_ROOTS.some((root) => path.startsWith(root));
}

export function codeFiles(snapshot: Snapshot): Array<[string, string]> {
    return [...snapshot.files].filter(([path]) => isCode(path));
}

export function parse(path: string, text: string): ts.SourceFile {
    const key = path + NEWLINE + text;
    let source = cache.get(key);
    if (!source) {
        const kind = extname(path) === TSX ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
        source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, kind);
        cache.set(key, source);
    }
    return source;
}

export function visit(node: ts.Node, callback: (node: ts.Node) => void): void {
    callback(node);
    ts.forEachChild(node, (child) => visit(child, callback));
}

/** Every comment of the file, found from token trivia so strings and regex literals never count. */
export function comments(source: ts.SourceFile): Comment[] {
    const text = source.text;
    const found = new Map<number, Comment>();
    const take = (ranges: ts.CommentRange[] | undefined, trailing: boolean) => {
        for (const range of ranges ?? []) {
            if (!found.has(range.pos)) {
                found.set(range.pos, { pos: range.pos, end: range.end, text: text.slice(range.pos, range.end), trailing });
            }
        }
    };
    const walk = (node: ts.Node) => {
        if (node.kind === ts.SyntaxKind.JsxText) {
            return;
        }
        take(ts.getLeadingCommentRanges(text, node.pos), false);
        take(ts.getTrailingCommentRanges(text, node.end), true);
        for (const child of node.getChildren(source)) {
            walk(child);
        }
    };
    walk(source);
    return [...found.values()].sort((a, b) => a.pos - b.pos);
}

/** Source text with comments blanked out, offsets and line breaks preserved. */
export function withoutComments(source: ts.SourceFile): string {
    let text = source.text;
    for (const comment of comments(source)) {
        const blank = comment.text.replace(/[^\n]/g, SPACE);
        text = text.slice(0, comment.pos) + blank + text.slice(comment.end);
    }
    return text;
}

export function line(source: ts.SourceFile, position: number): number {
    return source.getLineAndCharacterOfPosition(position).line + 1;
}
