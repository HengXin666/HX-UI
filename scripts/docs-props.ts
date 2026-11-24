/**
 * 文档页 Props 表的数据源: 从 src/index.ts 与 SUBPATH_FULL 子路径入口的公开组件读出参数类型, 写 docs/face/docs/props/props.gen.json.
 * 根入口只抽组件页 (docs/face/docs/specs) 引用的 importName 与 parts, 缺一个即失败; 子路径入口全量抽.
 * 只收组件自己与它包装的无头库 (Radix 等) 声明的属性, 不收 @types/react 的 DOM 属性.
 * 输出可复现: 联合按书写顺序 (scripts/docs-props/union-order.ts), 生成前核对 lockfile (scripts/docs-props/lock-drift.ts).
 * 用法: node scripts/docs-props.ts [--check]; DOCS_PROPS_STATS=1 打印联合顺序的来源统计.
 *
 * .agents/notes/implemented/process/2026-11-24-docs-props-deterministic.md
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { DOCS_DIR, PACKAGE_FILE, UTF8 } from "./constants/quality.ts";
import { BOOLEAN_TEXTS, BOOLEAN_TYPE_TEXT, DOM_TYPES_PACKAGE } from "./constants/docs-props.ts";
import { readSpecs } from "./docs-catalog/specs.ts";
import { dependencyLog } from "./docs-props/lock-drift.ts";
import { unionOrder } from "./docs-props/union-order.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
/** 门面的文档页目录: docs/face/docs. */
const FACE_DOCS = path.join(ROOT, DOCS_DIR, "face", "docs");
const OUT = path.join(FACE_DOCS, "props", "props.gen.json");
const CHECK = process.argv.includes("--check");
const DOM_TYPES = path.sep + DOM_TYPES_PACKAGE.split("/").join(path.sep) + path.sep;
const FLAGS = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType;
const NO_DEFAULT = "-";
/** 跑完至少要有这么多组件 (2026-11-11 批 0 时 225 个, 其中子路径 200 个); 少了说明扫描漏了入口或组件页. */
const MIN_TOTAL = 225;
const MIN_SUBPATH = 200;

/**
 * 各组件页声明的导出名: specs 目录递归 (specs/<层>/<组>/<id>.tsx) 里每页的 importName 与 parts,
 * 扫描与 docs-catalog 共用 scripts/docs-catalog/specs.ts (importName 找不到同层 id 时直接报错).
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */
function targets(): Set<string> {
  const names = new Set<string>();
  for (const spec of readSpecs(ROOT)) for (const name of [spec.importName, ...spec.parts]) names.add(name);
  return names;
}

const config = ts.getParsedCommandLineOfConfigFile(path.join(ROOT, "tsconfig.json"), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined });
if (!config) throw new Error("docs-props: 读不到 tsconfig.json");
/** 全量抽 props 的子路径入口 (相对 package.json exports 的键). ./surface 已经 re-export ./backgrounds, 两个都列上, 以后拆开也不漏. ./controls 与 ./kits 同样只从子路径发布. */
const SUBPATH_FULL = ["./backgrounds", "./controls", "./kits", "./surface"];
const COMPONENT_NAME = /^[A-Z]/;
const pkg = JSON.parse(readFileSync(path.join(ROOT, PACKAGE_FILE), UTF8)) as { exports?: Record<string, { types?: string } | string> };
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
const writtenOrder = unionOrder(checker, FLAGS);

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

/**
 * 字面量联合 (含经类型别名起名的, 如 BlockTone) 展开成字面量, 读者不用再去翻别名.
 * 成员顺序与 node_modules 无关: 能从声明读出书写顺序就按书写顺序, 读不出来 (cva 变体, 映射类型等) 按字典序;
 * 同一份源码在任何机器上生成的 props.gen.json 都一样.
 */
function typeText(type: ts.Type, decls: readonly ts.Declaration[] = []): string {
  const t = checker.getNonNullableType(type);
  if (t.isUnion() && t.types.every((m) => m.isLiteral() || (m.flags & ts.TypeFlags.BooleanLiteral) !== 0)) {
    const written = writtenOrder(decls);
    const rank = (p: string) => {
      const i = written ? written.indexOf(p) : -1;
      return i < 0 ? Number.MAX_SAFE_INTEGER : i;
    };
    const parts = t.types
      .map((m) => checker.typeToString(m, undefined, FLAGS))
      .sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0));
    if (process.env.DOCS_PROPS_STATS) {
      const ok = written && parts.every((p) => written.includes(p));
      stats[ok ? "declared" : "sorted"]++;
    }
    const bools = parts.filter((p) => BOOLEAN_TEXTS.includes(p));
    const rest = parts.filter((p) => !BOOLEAN_TEXTS.includes(p));
    return clean([...rest, ...(bools.length === BOOLEAN_TEXTS.length ? [BOOLEAN_TYPE_TEXT] : bools)].join(" | "));
  }
  return clean(checker.typeToString(t, undefined, FLAGS));
}

const stats = { declared: 0, sorted: 0 };

function clean(type: string): string {
  return type.replace(/'/g, '"').replace(/ \| undefined$/, "").replace(/^undefined \| /, "");
}

const dependencies = dependencyLog(ROOT);

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
    for (const d of prop.getDeclarations() ?? []) dependencies.note(d.getSourceFile().fileName);
    rows.push({
      name,
      type: typeText(t, prop.getDeclarations()),
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
if (process.env.DOCS_PROPS_STATS) console.log(`docs-props: 字面量联合 ${stats.declared} 个按书写顺序, ${stats.sorted} 个按字典序`);
const total = Object.keys(result).length;
if (total < MIN_TOTAL || subCount < MIN_SUBPATH) {
  console.error(`docs-props: 只读到 ${total} 个组件 (子路径 ${subCount} 个), 应不少于 ${MIN_TOTAL} (子路径 ${MIN_SUBPATH}); 检查入口与 specs 扫描`);
  process.exit(1);
}
const drift = dependencies.drift();
if (drift.length > 0) {
  console.error(`docs-props: node_modules 与 package-lock.json 不一致, 这些包的类型与说明会进 props.gen.json, 生成结果因此不可复现:\n  ${drift.join("\n  ")}\n先在仓库根目录跑 npm ci 再重新生成 / 检查`);
  process.exit(1);
}
const sorted = Object.fromEntries(Object.keys(result).sort().map((key) => [key, result[key]]));
const text = JSON.stringify(sorted, null, 1) + "\n";
if (CHECK) {
  const now = existsSync(OUT) ? readFileSync(OUT, UTF8) : "";
  if (now !== text) {
    console.error("docs-props: props.gen.json 与源码类型不一致, 跑 node scripts/docs-props.ts 重新生成");
    process.exit(1);
  }
  console.log(`docs-props: 通过 (${Object.keys(sorted).length} 个组件, 其中子路径 ${subCount} 个)`);
} else {
  writeFileSync(OUT, text);
  console.log(`docs-props: 写入 ${Object.keys(sorted).length} 个组件, 其中子路径 ${subCount} 个`);
}
