/**
 * 文档页 Props 表的数据源: 从 src/index.ts 的公开组件读出参数类型, 抽成 JSON.
 * 根入口只抽文档页用到的组件: docs/face/docs/specs (递归) 里各页的 importName 与 parts, 其余导出与它们解耦;
 * 这些名字必须全部读到属性, 缺一个即失败; 总数少于 MIN_TOTAL (子路径少于 MIN_SUBPATH) 也失败.
 * 子路径入口 SUBPATH_FULL 里的层 (./surface 含 ./backgrounds, ./controls, ./kits) 只从子路径发布, 没有别的契约保护, 所以全量抽:
 * 每个首字母大写, 第一个参数有自有属性的导出都进 JSON. 名字与根入口重名时以根入口为准.
 * 只收组件自己声明的属性与它包装的无头库 (Radix 等) 的属性; @types/react 里的 DOM 属性不收, 那些是原生语义.
 * 默认值读参数解构的初始值, 说明读属性上的 JSDoc.
 * 可复现: 字面量联合按源码书写顺序输出 (读不出时按字典序), 不随 checker 的内部类型 id 变;
 * 第三方包的说明随装的版本变, 所以生成前核对 node_modules 与 package-lock.json, 不一致先让人 npm ci.
 * 用法: node scripts/docs-props.ts 写 docs/face/docs/props/props.gen.json;
 * 加 --check 时与已入库的 JSON 比对, 不一致即失败. DOCS_PROPS_STATS=1 打印联合成员顺序的来源统计.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { DOCS_DIR } from "./constants/quality.ts";
import { readSpecs } from "./docs-catalog/specs.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
/** 门面的文档页目录: docs/face/docs. */
const FACE_DOCS = path.join(ROOT, DOCS_DIR, "face", "docs");
const OUT = path.join(FACE_DOCS, "props", "props.gen.json");
const CHECK = process.argv.includes("--check");
const DOM_TYPES = `${path.sep}@types${path.sep}react${path.sep}`;
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

/**
 * 联合成员在源码里写下的顺序. checker 给的 t.types 按内部类型 id 排, 而字面量类型是全程序共享的:
 * 谁先在别的文件 (比如某个版本的 @radix-ui d.ts) 里出现过 "vertical", 谁就排在前面,
 * 于是同一份源码在不同的 node_modules 下会生成 "vertical | horizontal" 或 "horizontal | vertical".
 * 这里顺着属性声明的类型节点 (联合, 括号, 类型别名, T["k"] 索引访问, keyof typeof X 等) 读出书写顺序; 读不出来的返回 undefined.
 *
 * .agents/notes/implemented/process/2026-11-24-docs-props-deterministic.md
 */
function declaredOrder(node: ts.TypeNode | undefined, depth = 0): string[] | undefined {
  if (!node || depth > 8) return undefined;
  if (ts.isParenthesizedTypeNode(node)) return declaredOrder(node.type, depth + 1);
  if (ts.isUnionTypeNode(node)) return collect(node.types, depth);
  if (ts.isLiteralTypeNode(node)) {
    if (node.literal.kind === ts.SyntaxKind.NullKeyword) return [];
    return [checker.typeToString(checker.getTypeFromTypeNode(node), undefined, FLAGS)];
  }
  if (node.kind === ts.SyntaxKind.BooleanKeyword) return ["true", "false"];
  if (node.kind === ts.SyntaxKind.UndefinedKeyword) return [];
  if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.KeyOfKeyword && ts.isTypeQueryNode(node.type)) return queryOrder(node.type, "keys");
  if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.ReadonlyKeyword) return declaredOrder(node.type, depth + 1);
  if (ts.isTupleTypeNode(node)) return collect(node.elements, depth);
  if (ts.isIndexedAccessTypeNode(node)) {
    // (typeof X)[keyof typeof X] 与 (typeof ARR)[number]: 对象的值 / 数组的元素, 按书写顺序
    const obj = ts.isParenthesizedTypeNode(node.objectType) ? node.objectType.type : node.objectType;
    if (ts.isTypeQueryNode(obj) && ts.isTypeOperatorNode(node.indexType) && node.indexType.operator === ts.SyntaxKind.KeyOfKeyword) return queryOrder(obj, "values");
    if (ts.isTypeQueryNode(obj) && node.indexType.kind === ts.SyntaxKind.NumberKeyword) return queryOrder(obj, "elements");
  }
  if (ts.isTypeReferenceNode(node) && node.typeArguments?.length === 1 && ts.isTypeQueryNode(node.typeArguments[0])) {
    // ValueOf<typeof X> 这类 "T[keyof T]" 的单参别名
    let sym = checker.getSymbolAtLocation(node.typeName);
    if (sym && sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
    const alias = sym?.getDeclarations()?.find(ts.isTypeAliasDeclaration);
    if (alias?.typeParameters?.length === 1 && ts.isIndexedAccessTypeNode(alias.type) && ts.isTypeOperatorNode(alias.type.indexType)) return queryOrder(node.typeArguments[0], "values");
    return undefined;
  }
  if (ts.isTypeReferenceNode(node) && !node.typeArguments) {
    let sym = checker.getSymbolAtLocation(node.typeName);
    if (sym && sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
    const alias = sym?.getDeclarations()?.find(ts.isTypeAliasDeclaration);
    return alias && !alias.typeParameters ? declaredOrder(alias.type, depth + 1) : undefined;
  }
  if (ts.isIndexedAccessTypeNode(node) && ts.isLiteralTypeNode(node.indexType) && ts.isStringLiteral(node.indexType.literal)) {
    const prop = checker.getPropertyOfType(checker.getTypeFromTypeNode(node.objectType), node.indexType.literal.text);
    const decl = prop?.getDeclarations()?.find((d): d is ts.PropertySignature => ts.isPropertySignature(d));
    return declaredOrder(decl?.type, depth + 1);
  }
  return undefined;
}

function collect(nodes: readonly ts.TypeNode[], depth: number): string[] | undefined {
  const out: string[] = [];
  for (const n of nodes) {
    const sub = declaredOrder(ts.isNamedTupleMember(n) ? n.type : n, depth + 1);
    if (!sub) return undefined;
    out.push(...sub);
  }
  return out;
}

/** 字面量表达式 -> 与 checker.typeToString 同格式的文本 ('a', 1, true) */
function literalText(e: ts.Expression): string | undefined {
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return `'${e.text}'`;
  if (ts.isNumericLiteral(e)) return e.text;
  if (e.kind === ts.SyntaxKind.TrueKeyword) return "true";
  if (e.kind === ts.SyntaxKind.FalseKeyword) return "false";
  if (ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(e.operand)) return `-${e.operand.text}`;
  return undefined;
}

/** typeof X: X 的对象字面量的键 / 值, 或数组字面量 (含 d.ts 里的 readonly 元组注解) 的元素, 按书写顺序 */
function queryOrder(q: ts.TypeQueryNode, mode: "keys" | "values" | "elements"): string[] | undefined {
  let sym = checker.getSymbolAtLocation(q.exprName);
  if (sym && sym.flags & ts.SymbolFlags.Alias) sym = checker.getAliasedSymbol(sym);
  const v = sym?.getDeclarations()?.find(ts.isVariableDeclaration);
  if (!v) return undefined;
  let init = v.initializer;
  while (init && (ts.isAsExpression(init) || ts.isSatisfiesExpression(init) || ts.isParenthesizedExpression(init))) init = init.expression;
  if (!init) return mode === "elements" && v.type ? declaredOrder(v.type, 1) : undefined;
  const all = (xs: (string | undefined)[]) => (xs.every((x) => x !== undefined) ? (xs as string[]) : undefined);
  if (ts.isArrayLiteralExpression(init)) return mode === "elements" ? all(init.elements.map(literalText)) : undefined;
  if (!ts.isObjectLiteralExpression(init) || mode === "elements") return undefined;
  if (mode === "keys") return all(init.properties.map((p) => (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? `'${p.name.text}'` : p.name && ts.isNumericLiteral(p.name) ? p.name.text : undefined)));
  return all(init.properties.map((p) => (ts.isPropertyAssignment(p) ? literalText(p.initializer) : undefined)));
}

/**
 * 属性的各个声明里第一个读得出书写顺序的: 带类型注解的属性 / 参数, 或 cva 这类
 * "对象字面量的键 -> 联合" (VariantProps 映射出来的属性, 声明就是配置对象里的 variant: { a: ..., b: ... }).
 */
function writtenOrder(decls: readonly ts.Declaration[]): string[] | undefined {
  for (const d of decls) {
    if ((ts.isPropertySignature(d) || ts.isPropertyDeclaration(d) || ts.isParameter(d)) && d.type) {
      const o = declaredOrder(d.type);
      if (o) return o;
    }
    if (ts.isPropertyAssignment(d) && ts.isObjectLiteralExpression(d.initializer)) {
      const keys = d.initializer.properties.map((p) => (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) || ts.isNumericLiteral(p.name)) ? p.name.text : undefined));
      if (keys.every((k) => k !== undefined)) return keys.map((k) => (/^-?\d+(\.\d+)?$/.test(k!) || k === "true" || k === "false" ? k! : `'${k}'`));
    }
  }
  return undefined;
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
    const bools = parts.filter((p) => p === "true" || p === "false");
    const rest = parts.filter((p) => p !== "true" && p !== "false");
    return clean([...rest, ...(bools.length === 2 ? ["boolean"] : bools)].join(" | "));
  }
  return clean(checker.typeToString(t, undefined, FLAGS));
}

const stats = { declared: 0, sorted: 0 };

function clean(type: string): string {
  return type.replace(/'/g, '"').replace(/ \| undefined$/, "").replace(/^undefined \| /, "");
}

/**
 * 第三方包 (Radix 等) 的属性说明直接读自 node_modules 里的 d.ts, 所以 props.gen.json 也取决于装的版本:
 * 本地 node_modules 比 package-lock.json 旧时, 生成结果会和 CI (npm ci) 的不一样 (例如 Radix 某版 JSDoc 里的 "so that that").
 * 记下用到的包, 生成前与 lockfile 对一遍, 不一致就直接说清楚, 而不是报一个看不出原因的 diff.
 */
const usedPackages = new Set<string>();
function noteDependency(file: string) {
  const i = file.lastIndexOf("/node_modules/"); // ts 的文件名一律是正斜杠
  if (i < 0) return;
  const rest = file.slice(i + "/node_modules/".length).split("/");
  const name = rest[0].startsWith("@") ? `${rest[0]}/${rest[1]}` : rest[0];
  usedPackages.add(path.relative(ROOT, file.slice(0, i + "/node_modules/".length) + name).split(path.sep).join("/"));
}
function lockDrift(): string[] {
  const lockFile = path.join(ROOT, "package-lock.json");
  if (!existsSync(lockFile)) return [];
  const lock = JSON.parse(readFileSync(lockFile, "utf8")) as { packages?: Record<string, { version?: string }> };
  const out: string[] = [];
  for (const dir of [...usedPackages].sort()) {
    if (dir.includes("@types/react")) continue; // DOM 属性不收, 版本不影响输出
    const want = lock.packages?.[dir]?.version;
    const pj = path.join(ROOT, dir, "package.json");
    if (!want || !existsSync(pj)) continue;
    const have = (JSON.parse(readFileSync(pj, "utf8")) as { version?: string }).version;
    if (have !== want) out.push(`${dir.replace(/^node_modules\//, "")} ${have} (lockfile ${want})`);
  }
  return out;
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
    for (const d of prop.getDeclarations() ?? []) noteDependency(d.getSourceFile().fileName);
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
const drift = lockDrift();
if (drift.length > 0) {
  console.error(`docs-props: node_modules 与 package-lock.json 不一致, 这些包的类型与说明会进 props.gen.json, 生成结果因此不可复现:\n  ${drift.join("\n  ")}\n先在仓库根目录跑 npm ci 再重新生成 / 检查`);
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
