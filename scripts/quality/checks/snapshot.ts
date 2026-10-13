import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, statSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { collectScope } from "../../../.agents/skills/hx-agent-code/scripts/core/scope.ts";
import { parseScope } from "../../../.agents/skills/hx-agent-code/scripts/core/model.ts";
import type { Change, Scope } from "../../../.agents/skills/hx-agent-code/scripts/core/model.ts";
import {
    EMPTY_TEXT, GIT, IGNORED_PREFIXES, TEXT_NAMES, MAX_BUFFER, NEWLINE, NUL, SCOPE_ENV, TEXT_EXTENSIONS, UTF8, HOOK_DIR, COLON, GIT_DIR_OPTION, GIT_NUL_OPTION, MODE_ALL, MODE_RANGE, MODE_STAGED, MODE_TREE, MODE_WORKTREE, SLASH, SPACE, TAB, NOT_FOUND,
} from "../../constants/quality.ts";

export type Mode = "all" | "tree" | "worktree" | "staged" | "range";
export type Snapshot = {
    root: string;
    mode: Mode;
    /** Tree SHA, "index" or MODE_WORKTREE: where file contents are read from. */
    source: string;
    /** Base tree for diff based rules; undefined in all/tree modes. */
    base?: string;
    paths: string[];
    files: Map<string, string>;
    /** Changed paths that findings are reported for; null reports every path. */
    scope: Set<string> | null;
    /** Raw change list of a diff based snapshot, including deletions and the old side of renames. */
    changes?: Change[];
};

const INDEX = "index";
const WORKTREE = MODE_WORKTREE;
const BATCH_HEADER = /^[0-9a-f]+ \w+ (?<size>\d+)$/;

export function git(root: string, args: string[], input?: string): string {
    return execFileSync(GIT, [GIT_DIR_OPTION, root, ...args], { encoding: UTF8, input, maxBuffer: MAX_BUFFER });
}

function ignored(path: string): boolean {
    return IGNORED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function isText(path: string): boolean {
    return TEXT_EXTENSIONS.includes(extname(path)) || path.startsWith(HOOK_DIR) || TEXT_NAMES.includes(basename(path));
}

function split(raw: string): string[] {
    return raw.split(NUL).filter(Boolean);
}

function readBlobs(root: string, entries: Array<[string, string]>): Map<string, string> {
    const files = new Map<string, string>();
    const wanted = entries.filter(([path]) => isText(path));
    if (!wanted.length) {
        return files;
    }
    const output = execFileSync(GIT, [GIT_DIR_OPTION, root, "cat-file", "--batch"], {
        input: wanted.map(([, sha]) => sha).join(NEWLINE) + NEWLINE, maxBuffer: MAX_BUFFER,
    });
    let offset = 0;
    for (const [path] of wanted) {
        const end = output.indexOf(NEWLINE, offset);
        const header = output.subarray(offset, end).toString(UTF8).match(BATCH_HEADER);
        if (!header) {
            throw new Error("Unexpected git cat-file output for " + path);
        }
        const size = Number(header.groups!.size);
        files.set(path, output.subarray(end + 1, end + 1 + size).toString(UTF8));
        offset = end + 1 + size + 1;
    }
    return files;
}

function treeEntries(root: string, tree: string): Array<[string, string]> {
    return split(git(root, ["ls-tree", "-r", GIT_NUL_OPTION, "--full-tree", tree]))
        .map((line): [string, string] => [line.slice(line.indexOf(TAB) + 1), line.split(TAB)[0].split(SPACE).at(NOT_FOUND)!])
        .filter(([path]) => !ignored(path));
}

function indexEntries(root: string): Array<[string, string]> {
    return split(git(root, ["ls-files", "-s", GIT_NUL_OPTION]))
        .map((line): [string, string] => [line.slice(line.indexOf(TAB) + 1), line.split(SPACE)[1]])
        .filter(([path]) => !ignored(path));
}

function worktreeFiles(root: string): { paths: string[]; files: Map<string, string> } {
    const paths = split(git(root, ["ls-files", "-co", "--exclude-standard", GIT_NUL_OPTION]))
        .filter((path) => !ignored(path) && existsSync(join(root, path)) && statSync(join(root, path)).isFile());
    const files = new Map<string, string>();
    for (const path of paths) {
        if (isText(path)) {
            files.set(path, readFileSync(join(root, path), UTF8));
        }
    }
    return { paths: [...new Set(paths)].sort(), files };
}

function fromScope(root: string, scope: Scope): Snapshot {
    const changed = new Set(scope.changes.filter((item) => item.status !== "D" && !ignored(item.path)).map((item) => item.path));
    if (scope.mode === MODE_RANGE) {
        const entries = treeEntries(root, scope.head);
        return {
            root, mode: MODE_RANGE, source: scope.head, base: scope.base, paths: entries.map(([path]) => path).sort(),
            files: readBlobs(root, entries), scope: changed, changes: scope.changes,
        };
    }
    if (scope.mode === MODE_STAGED) {
        const entries = indexEntries(root);
        return {
            root, mode: MODE_STAGED, source: INDEX, base: scope.base, paths: entries.map(([path]) => path).sort(),
            files: readBlobs(root, entries), scope: changed, changes: scope.changes,
        };
    }
    return {
        root, mode: MODE_WORKTREE, source: WORKTREE, base: scope.base, ...worktreeFiles(root), scope: changed, changes: scope.changes,
    };
}

/**
 * Read one consistent snapshot: worktree, Git index or an exact tree, never a mix.
 * HX_QUALITY_SCOPE from the CI runner wins over the requested mode.
 */
export function loadSnapshot(root: string, mode: Mode, base?: string, head?: string): Snapshot {
    const injected = process.env[SCOPE_ENV];
    if (injected) {
        return fromScope(root, parseScope(JSON.parse(readFileSync(injected, UTF8))));
    }
    if (mode === MODE_ALL) {
        return { root, mode, source: WORKTREE, ...worktreeFiles(root), scope: null };
    }
    if (mode === MODE_TREE) {
        const tree = git(root, ["rev-parse", "--verify", head + "^{tree}"]).trim();
        const entries = treeEntries(root, tree);
        return {
            root, mode, source: tree, paths: entries.map(([path]) => path).sort(), files: readBlobs(root, entries),
            scope: null,
        };
    }
    return fromScope(root, collectScope(root, mode, base, head));
}

export function inScope(snapshot: Snapshot, path: string): boolean {
    return snapshot.scope === null || snapshot.scope.has(path);
}

/** Reads a file of the base side of the diff, or undefined when absent. */
export function baseFile(snapshot: Snapshot, path: string): string | undefined {
    if (!snapshot.base) {
        return undefined;
    }
    try {
        return git(snapshot.root, ["show", snapshot.base + COLON + path]);
    } catch {
        return undefined;
    }
}

/** Materialize a non-worktree snapshot so compiler tools read exactly the checked contents. */
export function exportSnapshot(snapshot: Snapshot, links: string[]): string {
    if (snapshot.source === WORKTREE) {
        return snapshot.root;
    }
    const target = mkdtempSync(join(tmpdir(), "hx-quality-"));
    if (snapshot.source === INDEX) {
        git(snapshot.root, ["checkout-index", "-a", "--prefix=" + target + SLASH]);
    } else {
        const archive = execFileSync(GIT, [GIT_DIR_OPTION, snapshot.root, "archive", snapshot.source], { maxBuffer: MAX_BUFFER });
        execFileSync("tar", ["-x", GIT_DIR_OPTION, target], { input: archive });
    }
    for (const link of links) {
        if (existsSync(join(snapshot.root, link)) && !existsSync(join(target, link))) {
            symlinkSync(join(snapshot.root, link), join(target, link));
        }
    }
    return target;
}

export function lineOf(text: string, offset: number): number {
    let line = 1;
    for (let index = text.indexOf(NEWLINE); index !== NOT_FOUND && index < offset; index = text.indexOf(NEWLINE, index + 1)) {
        line++;
    }
    return line;
}

export const NO_TEXT = EMPTY_TEXT;
