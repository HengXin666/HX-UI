/**
 * 文档页 Props 表的数据源: 从 src/index.ts 的公开组件读出参数类型, 抽成 JSON.
 * 根入口只抽文档页用到的组件: docs/face/docs/specs (递归) 里各页的 importName 与 parts, 其余导出与它们解耦.
 * 子路径入口 SUBPATH_FULL 里的层 (./surface 含 ./backgrounds) 只从子路径发布, 没有别的契约保护, 所以全量抽:
 * 每个首字母大写, 第一个参数有自有属性的导出都进 JSON. 名字与根入口重名时以根入口为准.
 * 只收组件自己声明的属性与它包装的无头库 (Radix 等) 的属性; @types/react 里的 DOM 属性不收, 那些是原生语义.
 * 默认值读参数解构的初始值, 说明读属性上的 JSDoc.
 * 用法: node scripts/docs-props.ts 写 docs/face/docs/props/props.gen.json;
 * 加 --check 时与已入库的 JSON 比对, 不一致即失败.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { DOCS_DIR } from "./constants/quality.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
/** 门面的文档页目录: docs/face/docs. */
const FACE_DOCS = path.join(ROOT, DOCS_DIR, "face", "docs");
const OUT = path.join(FACE_DOCS, "props", "props.gen.json");
const CHECK = process.argv.includes("--check");
const DOM_TYPES = `${path.sep}@types${path.sep}react${path.sep}`;
const FLAGS = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType;
const NO_DEFAULT = "-";
const SPECS_DIR = path.join(FACE_DOCS, "specs");
const IMPORT_NAME = /importName: "(\w+)"/g;
const PARTS = /parts: \[([^\]]*)\]/g;
const QUOTED = /"(\w+)"/g;
const SPEC_FILE = /\.tsx?$/;

/** specs 目录下所有 .ts / .tsx, 递归进子目录 (按页拆分的 core-*.tsx, block-*.tsx 等, 以后再分子目录也不漏). */
function specFiles(dir: string): string[] {
  const out: string[] = [];
  for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) out.push(...specFiles(full));
    else if (SPEC_FILE.test(item.name)) out.push(full);
  }
  return out;
}

/**
 * 各组件页声明的导出名: importName 与 parts 里的每一项.
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */
function targets(): Set<string> {
  const names = new Set<string>();
  for (const file of specFiles(SPECS_DIR)) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(IMPORT_NAME)) names.add(m[1]);
    for (const m of text.matchAll(PARTS)) for (const q of m[1].matchAll(QUOTED)) names.add(q[1]);
  }
  return names;
}

const config = ts.getParsedCommandLineOfConfigFile(path.join(ROOT, "tsconfig.json"), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined });
if (!config) throw new Error("docs-props: 读不到 tsconfig.json");
/** 全量抽 props 的子路径入口 (相对 package.json exports 的键). ./surface 已经 re-export ./backgrounds, 两个都列上, 以后拆开也不漏. */
const SUBPATH_FULL = ["./backgrounds", "./surface"];
const COMPONENT_NAME = /^[A-Z]/;
const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8")) as { exports?: Record<string, { types?: string } | string> };
const subEntries = SUBPATH_FULL.map((key) => {
  const spec = pkg.exports?.[key];
  const types = typeof spec === "object" ? spec.types : undefined;
  if (!types) throw new Error(`docs-props: package.json exports 里没有 ${key}`);
  const base = path.join(ROOT, types.replace(/^\.\/dist\//, "src/").replace(/\.d\.ts$/, ""));
  const file = [`${base}.ts`, `${base}.tsx`].find((f) => existsSync(f));
  if (!file) throw new Error(`docs-props: 子路径 ${key} 找不到源码入口`);
  return file;
});
const program = ts.createProgram([ENTRY, ...subEntries], { ...config.options, noEmit: true });
const checker = program.getTypeChecker();
const entry = program.getSourceFile(ENTRY);
if (!entry) throw new Error("docs-props: 读不到 src/index.ts");

/** 解构参数里每个属性的初始值文本, 能折成字面量类型的写字面量. */
function defaultsOf(param: ts.ParameterDeclaration): Map<string, string> {
  const out = new Map<string, string>();
  if (!ts.isObjectBindingPattern(param.name)) return out;
  for (const el of param.name.elements) {
    if (!el.initializer || el.dotDotDotToken) continue;
    const key = (el.propertyName ?? el.name).getText();
    const t = checker.getTypeAtLocation(el.initializer);
    const literal = t.isLiteral() || (t.flags & ts.TypeFlags.BooleanLiteral) !== 0;
    out.set(key, literal ? checker.typeToString(t, undefined, FLAGS).replace(/'/g, '"') : el.initializer.getText());
  }
  return out;
}

/** 只要有一个声明不在 @types/react 里就收: 组件自己的, Radix 的, cva 变体的. */
function own(symbol: ts.Symbol): boolean {
  const decls = symbol.getDeclarations() ?? [];
  if (decls.length === 0) return true;
  return decls.some((d) => !d.getSourceFile().fileName.includes(DOM_TYPES));
}

/** 字面量联合 (含经类型别名起名的, 如 BlockTone) 展开成字面量, 读者不用再去翻别名. */
function typeText(type: ts.Type): string {
  const t = checker.getNonNullableType(type);
  if (t.isUnion() && t.types.every((m) => m.isLiteral() || (m.flags & ts.TypeFlags.BooleanLiteral) !== 0)) {
    const parts = t.types.map((m) => checker.typeToString(m, undefined, FLAGS));
    const bools = parts.filter((p) => p === "true" || p === "false");
    const rest = parts.filter((p) => p !== "true" && p !== "false");
    return clean([...rest, ...(bools.length === 2 ? ["boolean"] : bools)].join(" | "));
  }
  return clean(checker.typeToString(t, undefined, FLAGS));
}

function clean(type: string): string {
  return type.replace(/'/g, '"').replace(/ \| undefined$/, "").replace(/^undefined \| /, "");
}

interface Row { name: string; type: string; default: string; desc: string; required: boolean }

function rowsOf(decl: ts.SignatureDeclaration): Row[] | undefined {
  const param = decl.parameters[0];
  if (!param) return undefined;
  const type = checker.getTypeAtLocation(param);
  const defaults = defaultsOf(param);
  const rows: Row[] = [];
  for (const prop of checker.getPropertiesOfType(type)) {
    if (!own(prop)) continue;
    const name = prop.getName();
    if (name === "key" || name === "ref") continue;
    const t = checker.getTypeOfSymbolAtLocation(prop, param);
    rows.push({
      name,
      type: typeText(t),
      default: defaults.get(name) ?? NO_DEFAULT,
      desc: ts.displayPartsToString(prop.getDocumentationComment(checker)).replace(/\s+/g, " ").trim(),
      required: (prop.flags & ts.SymbolFlags.Optional) === 0,
    });
  }
  return rows;
}

/** 导出名 -> 实现声明 (跟着别名走到函数或箭头函数). */
function implementation(symbol: ts.Symbol): ts.SignatureDeclaration | undefined {
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  for (const d of target.getDeclarations() ?? []) {
    if (ts.isFunctionDeclaration(d)) return d;
    if (ts.isVariableDeclaration(d) && d.initializer) {
      let init: ts.Expression = d.initializer;
      while (ts.isCallExpression(init) && init.arguments[0]) init = init.arguments[0];
      if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) return init;
    }
  }
  return undefined;
}

const wanted = targets();
const result: Record<string, Row[]> = {};
const moduleSymbol = checker.getSymbolAtLocation(entry);
for (const symbol of moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : []) {
  const name = symbol.getName();
  if (!wanted.has(name)) continue;
  const decl = implementation(symbol);
  if (!decl) continue;
  const rows = rowsOf(decl);
  if (rows && rows.length > 0) result[name] = rows;
}
let subCount = 0;
for (const file of subEntries) {
  const source = program.getSourceFile(file);
  const sym = source ? checker.getSymbolAtLocation(source) : undefined;
  for (const symbol of sym ? checker.getExportsOfModule(sym) : []) {
    const name = symbol.getName();
    if (!COMPONENT_NAME.test(name) || name in result) continue;
    const decl = implementation(symbol);
    if (!decl) continue;
    const rows = rowsOf(decl);
    if (rows && rows.length > 0) {
      result[name] = rows;
      subCount += 1;
    }
  }
}

const missing = [...wanted].filter((name) => !(name in result));
if (missing.length > 0) {
  console.error(`docs-props: 组件页引用的导出读不到属性: ${missing.join(", ")}`);
  process.exit(1);
}
const sorted = Object.fromEntries(Object.keys(result).sort().map((key) => [key, result[key]]));
const text = JSON.stringify(sorted, null, 1) + "\n";
if (CHECK) {
  const now = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (now !== text) {
    console.error("docs-props: props.gen.json 与源码类型不一致, 跑 node scripts/docs-props.ts 重新生成");
    process.exit(1);
  }
  console.log(`docs-props: 通过 (${Object.keys(sorted).length} 个组件, 其中子路径 ${subCount} 个)`);
} else {
  writeFileSync(OUT, text);
  console.log(`docs-props: 写入 ${Object.keys(sorted).length} 个组件, 其中子路径 ${subCount} 个`);
}
