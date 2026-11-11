/**
 * 组件导出清单: 读根入口与 package.json 里每个带类型的子路径入口, 收所有 "组件" 导出并按 "件" 归组.
 * 组件 = 首字母大写的值导出, 类型可调用 (函数组件) 或是 React 的 forwardRef / memo 对象; 类, 上下文与命名空间对象不算.
 * 件 = 一个源文件里的全部组件导出 (Dialog 与 DialogContent 等), 外加 mergeFiles 并进来的拆分文件; 件名取 headOf.
 * 同一个符号从几个入口转出 (surface 转出 backgrounds, motion 转出根入口的 Reveal) 只记一次, 入口都记下.
 * 层按声明文件定: src/surface, src/kits, src/controls 各自一层, 其余 (根入口, motion, viz, blocks, page 等) 为 base.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

export type Layer = "surface" | "kits" | "controls" | "base";

export interface Piece {
  /** 件名: 见 headOf. 不同文件可能同名 (widgets 与 viz 各有 Timeline), 唯一标识用 file. */
  readonly name: string;
  /** 件内全部导出名, 件名本身是导出时排第一, 其余按名字排序. */
  readonly members: readonly string[];
  readonly layer: Layer;
  /** 仓库相对的声明文件. */
  readonly file: string;
  /** 能取到它的入口 (package.json exports 的键). */
  readonly entries: readonly string[];
}

const COMPONENT_NAME = /^[A-Z][A-Za-z0-9]*$/;
const CONSTANT_NAME = /^[A-Z][A-Z0-9_]+$/;
/** React 上下文对象在类型上也是组件 (Provider), 但不是给人直接用的件. */
const CONTEXT_NAME = /Context$/;
const EXOTIC = /ExoticComponent|ForwardRefExoticComponent|MemoExoticComponent|LazyExoticComponent/;
const LAYER_DIRS: readonly [string, Layer][] = [["src/surface/", "surface"], ["src/kits/", "kits"], ["src/controls/", "controls"]];

/** package.json exports 里带类型的入口 -> 源码入口文件. */
export function entryFiles(root: string): [string, string][] {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as { exports?: Record<string, { types?: string } | string> };
  const out: [string, string][] = [];
  for (const [key, spec] of Object.entries(pkg.exports ?? {})) {
    const types = typeof spec === "object" ? spec.types : undefined;
    if (!types) continue;
    const base = path.join(root, types.replace(/^\.\/dist\//, "src/").replace(/\.d\.ts$/, ""));
    const file = [`${base}.ts`, `${base}.tsx`].find((f) => existsSync(f));
    if (!file) throw new Error(`docs-catalog: 入口 ${key} 找不到源码 (${types})`);
    out.push([key, file]);
  }
  return out;
}

function isComponent(checker: ts.TypeChecker, symbol: ts.Symbol): boolean {
  if (!(symbol.flags & ts.SymbolFlags.Value) || symbol.flags & ts.SymbolFlags.Class) return false;
  const decl = symbol.valueDeclaration;
  if (!decl) return false;
  const type = checker.getTypeOfSymbolAtLocation(symbol, decl);
  if (type.getConstructSignatures().length > 0) return false;
  if (type.getCallSignatures().length > 0) return true;
  return EXOTIC.test(checker.typeToString(type));
}

function layerOf(file: string): Layer {
  return LAYER_DIRS.find(([dir]) => file.startsWith(dir))?.[1] ?? "base";
}

const kebab = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();
const stem = (file: string): string => kebab(path.basename(file).replace(/\.tsx?$/, ""));

/** 拼出来的件名至少几个字符, 再短就不像名字. */
const MIN_HEAD = 4;

/** 名字按大写切成词. */
const words = (name: string): string[] => name.match(/[A-Z][a-z0-9]*|[a-z0-9]+/g) ?? [name];

/**
 * 件名: 能当其余名字前缀的最短名 (Dialog); 没有时取与文件名同名的 (scroll-area.tsx 的 ScrollArea);
 * 再没有取全部名字的共同词头 (Typography, Resizable); 词头太短 (Charts.tsx 的 Hx) 时用文件名.
 */
function headOf(names: readonly string[], file: string): string {
  const sorted = [...names].sort((a, b) => a.length - b.length || a.localeCompare(b));
  const prefix = sorted.find((h) => sorted.every((n) => n === h || (n.startsWith(h) && /[A-Z]/.test(n.charAt(h.length)))));
  if (prefix) return prefix;
  const named = sorted.find((n) => kebab(n) === stem(file));
  if (named) return named;
  const split = sorted.map(words);
  const common: string[] = [];
  for (const [i, word] of split[0].entries()) {
    if (!split.every((w) => w[i] === word)) break;
    common.push(word);
  }
  const joined = common.join("");
  if (joined.length >= MIN_HEAD) return joined;
  return stem(file).split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

/**
 * 一个源文件一件. 再并两类跨文件的: 同名文件 (layout/ContextMenu.tsx 与 primitives/context-menu.tsx) 且件名不同,
 * 同目录下 "<文件名>-xxx" 的拆分文件 (sidebar-parts.tsx, sidebar-menu.tsx 并进 sidebar.tsx).
 */
function mergeFiles(byFile: Map<string, Map<string, Set<string>>>): Map<string, string[]> {
  const files = [...byFile.keys()].sort((a, b) => a.length - b.length || a.localeCompare(b));
  const owner = new Map<string, string>();
  for (const file of files) {
    const host = files.find((other) => {
      if (other === file || (owner.has(other) && owner.get(other) !== other)) return false;
      const mine = kebab(headOf([...byFile.get(file)!.keys()], file));
      const theirs = kebab(headOf([...byFile.get(other)!.keys()], other));
      // 两边都真有同名导出 (widgets 与 viz 的 Timeline) 是两件; 一边的件名是拼出来的词头时并.
      const twins = mine === theirs && byFile.get(file)!.has(headOf([...byFile.get(file)!.keys()], file)) && byFile.get(other)!.has(headOf([...byFile.get(other)!.keys()], other));
      const sameStem = stem(other) === stem(file) && !twins && (mine.startsWith(theirs) || theirs.startsWith(mine));
      const split = path.dirname(other) === path.dirname(file) && stem(file).startsWith(`${stem(other)}-`);
      return (sameStem && other < file) || split;
    });
    owner.set(file, host ?? file);
  }
  const groups = new Map<string, string[]>();
  for (const file of files) {
    const host = owner.get(file)!;
    groups.set(host, [...(groups.get(host) ?? []), file]);
  }
  return groups;
}

/** 全部件, 按层与件名排序. */
export function readPieces(root: string): Piece[] {
  const entries = entryFiles(root);
  const config = ts.getParsedCommandLineOfConfigFile(path.join(root, "tsconfig.json"), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined });
  if (!config) throw new Error("docs-catalog: 读不到 tsconfig.json");
  const program = ts.createProgram(entries.map(([, file]) => file), { ...config.options, noEmit: true });
  const checker = program.getTypeChecker();
  /** 声明文件 -> 导出名 -> 入口集合. */
  const byFile = new Map<string, Map<string, Set<string>>>();
  for (const [key, file] of entries) {
    const source = program.getSourceFile(file);
    const moduleSymbol = source ? checker.getSymbolAtLocation(source) : undefined;
    for (const exported of moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : []) {
      const name = exported.getName();
      if (!COMPONENT_NAME.test(name) || CONSTANT_NAME.test(name) || CONTEXT_NAME.test(name)) continue;
      const target = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      if (!isComponent(checker, target)) continue;
      const declFile = path.relative(root, target.valueDeclaration!.getSourceFile().fileName).split(path.sep).join("/");
      const names = byFile.get(declFile) ?? new Map<string, Set<string>>();
      byFile.set(declFile, names);
      const at = names.get(name) ?? new Set<string>();
      names.set(name, at.add(key));
    }
  }
  const pieces: Piece[] = [];
  for (const [file, group] of mergeFiles(byFile)) {
    const names = new Map(group.flatMap((f) => [...byFile.get(f)!]));
    const name = headOf([...names.keys()], file);
    const members = [...names.keys()].sort((a, b) => Number(b === name) - Number(a === name) || a.localeCompare(b));
    const entrySet = new Set(members.flatMap((m) => [...names.get(m)!]));
    pieces.push({ name, members, layer: layerOf(file), file, entries: [...entrySet].sort() });
  }
  return pieces.sort((a, b) => a.layer.localeCompare(b.layer) || a.name.localeCompare(b.name));
}
