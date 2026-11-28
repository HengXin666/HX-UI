/**
 * "use client" 边界检查.  Run: node scripts/check-client.ts [--dist]
 *
 * React Server Components 下, 用到客户端能力的模块必须在文件顶部写 "use client";
 * 反过来, 纯工具 / 类型 / 蓝图核心不能写, 否则它们的导出在服务端组件里会变成客户端引用 (函数不能调, 字符串拿不到).
 *
 * 源码 (src/**) 的规则, 任一不符 exit 1:
 *   需要 "use client"   调用了 hook (useX / React.useX / use(...)), createContext, class 组件 (extends Component),
 *                       JSX 上写了事件处理 (onX={...}), 直接用了浏览器全局 (window, document, localStorage,
 *                       ResizeObserver, matchMedia, requestAnimationFrame ...), 或值导入了只能在客户端跑的包
 *                       (motion/react, recharts, three, @react-three/*).
 *   不该有 "use client" 不渲染 JSX, 也一条上面的特征都没有 (桶文件 index.ts, 工具, 常量, 类型): 指令多余, 会把服务端安全的导出也变成客户端引用.
 *                       (只包一层 radix 的 shadcn 组件可以保留上游带的指令: radix 自己是客户端组件, 导出都是组件, 没有副作用.)
 *   顶层浏览器全局      模块顶层 (导入时就求值) 直接用 window / document 等, 没有 typeof 守卫: 服务端渲染会崩, 不管有没有指令.
 *   指令位置            必须是文件第一条语句 (前面只能有注释).
 * 例外要写在文件里, 带理由, 方便审查:
 *   // hx:server-safe <理由>   用到浏览器全局但都在函数体里且有 typeof 守卫, 模块本身可在服务端导入 (如剪贴板工具)
 *   // hx:client <理由>        没有上面的特征但确实只能在客户端用
 *
 * 公共入口 (package.json exports 里不带 * 的那些, 例如 ".", "./theme", "./data", "./blueprint/ui"):
 *   顺着 re-export 找到每个导出的来源模块; 来源是客户端模块的, 只能是组件 (大写开头) 或 hook (useX).
 *   常量, 工具函数, 类实例这类值从客户端模块导出, 在服务端组件里拿到的是客户端引用 (字符串读不到, 函数不能调),
 *   要挪到服务端安全的模块再从入口导出 (如 hooks/theme-script.ts, data/charts/helpers.ts).
 *   带 * 的逐文件入口 ("./ui/*" 等) 不查: 跟 shadcn 上游一样, 文件里的 xxxVariants 随文件的指令走.
 *
 * --dist: 额外检查 dist/ (build:lib 之后): 源码带指令的模块, 产物 .js 第一行必须是 "use client";
 *         源码不带的, 产物也不能带. 用来确认 vite.lib.config.ts 的 renderChunk 补指令逐文件生效.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");

const BROWSER_GLOBALS = new Set([
  "window",
  "document",
  "navigator",
  "location",
  "localStorage",
  "sessionStorage",
  "matchMedia",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "requestIdleCallback",
  "ResizeObserver",
  "IntersectionObserver",
  "MutationObserver",
  "PointerEvent",
  "DOMParser",
]);
/** 值导入这些包就说明模块只能在客户端跑 (type-only 导入不算). */
const CLIENT_PACKAGES = [/^motion\/react(-m|-client)?$/, /^framer-motion$/, /^recharts$/, /^three($|\/)/, /^@react-three\//];

type Reason = string;

function walk(dir: string, out: string[] = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(f) && !/\.(typetest|test|d)\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}

/** 文件开头 (只跳过注释) 的指令序言 */
function prologue(sf: ts.SourceFile): string[] {
  const out: string[] = [];
  for (const st of sf.statements) {
    if (ts.isExpressionStatement(st) && ts.isStringLiteral(st.expression)) out.push(st.expression.text);
    else break;
  }
  return out;
}

function isDeclarationName(node: ts.Identifier): boolean {
  const p = node.parent;
  if (!p) return false;
  if ((ts.isPropertyAccessExpression(p) || ts.isQualifiedName(p)) && (p as ts.PropertyAccessExpression).name === node) return true;
  if ((ts.isPropertyAssignment(p) || ts.isPropertyDeclaration(p) || ts.isPropertySignature(p) || ts.isMethodDeclaration(p) || ts.isEnumMember(p)) && p.name === node) return true;
  if ((ts.isVariableDeclaration(p) || ts.isParameter(p) || ts.isFunctionDeclaration(p) || ts.isBindingElement(p)) && p.name === node) return true;
  if (ts.isBindingElement(p) && p.propertyName === node) return true;
  if (ts.isImportSpecifier(p) || ts.isExportSpecifier(p) || ts.isImportClause(p) || ts.isNamespaceImport(p)) return true;
  if (ts.isJsxAttribute(p) || ts.isLabeledStatement(p)) return true;
  return false;
}

function analyze(file: string, text: string) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const reasons = new Set<Reason>();
  const add = (r: Reason) => reasons.size < 4 && reasons.add(r);
  let shadowed = new Set<string>(); // 顶层自己声明的同名标识符 (如参数叫 document) 不算全局

  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier)) {
      const spec = st.moduleSpecifier.text;
      const typeOnly = st.importClause?.isTypeOnly || (st.importClause?.namedBindings && ts.isNamedImports(st.importClause.namedBindings) && !st.importClause.name && st.importClause.namedBindings.elements.every((e) => e.isTypeOnly));
      if (!typeOnly && st.importClause && CLIENT_PACKAGES.some((re) => re.test(spec))) add(`导入客户端包 ${spec}`);
    }
  }

  const topLevel: ts.Identifier[] = [];
  let hasJsx = false;
  let depth = 0; // >0: 在函数体 / 类方法里, 模块求值时不会执行
  const visit = (node: ts.Node, locals: Set<string>) => {
    if (ts.isTypeNode(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isImportDeclaration(node)) return;
    let scope = locals;
    if (ts.isFunctionLike(node) && node.parameters?.length) {
      scope = new Set(locals);
      for (const prm of node.parameters) if (ts.isIdentifier(prm.name)) scope.add(prm.name.text);
    }
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) hasJsx = true;
    if (ts.isCallExpression(node)) {
      const c = node.expression;
      const name = ts.isIdentifier(c) ? c.text : ts.isPropertyAccessExpression(c) && ts.isIdentifier(c.expression) && c.expression.text === "React" ? c.name.text : "";
      if (/^use[A-Z0-9]/.test(name) || (name === "use" && ts.isPropertyAccessExpression(c))) add(`调用 hook ${name}()`);
      if (name === "createContext") add("createContext()");
    }
    if (ts.isClassLike(node)) {
      for (const h of node.heritageClauses ?? []) for (const t of h.types) if (/\b(Component|PureComponent)$/.test(t.expression.getText(sf))) add("class 组件");
    }
    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name)) {
      const v = node.initializer && ts.isJsxExpression(node.initializer) ? node.initializer.expression : undefined;
      if (/^on[A-Z]/.test(node.name.text)) add(`JSX 事件 ${node.name.text}`);
      else if (v && (ts.isArrowFunction(v) || ts.isFunctionExpression(v))) add(`JSX 函数属性 ${node.name.text}`);
    }
    if (ts.isIdentifier(node) && BROWSER_GLOBALS.has(node.text) && !isDeclarationName(node) && !scope.has(node.text) && !shadowed.has(node.text)) {
      add(`浏览器全局 ${node.text}`);
      if (depth === 0) topLevel.push(node);
    }
    const fn = ts.isFunctionLike(node) || ts.isClassStaticBlockDeclaration(node);
    if (fn) depth++;
    ts.forEachChild(node, (n) => visit(n, scope));
    if (fn) depth--;
  };
  // 顶层声明的同名变量 (少见, 但避免误报)
  shadowed = new Set(
    sf.statements.flatMap((s) => (ts.isVariableStatement(s) ? s.declarationList.declarations.flatMap((d) => (ts.isIdentifier(d.name) ? [d.name.text] : [])) : [])),
  );
  // `use(...)` 只在从 react 导入时算 hook
  const importsUse = sf.statements.some(
    (s) => ts.isImportDeclaration(s) && ts.isStringLiteral(s.moduleSpecifier) && s.moduleSpecifier.text === "react" && s.importClause?.namedBindings && ts.isNamedImports(s.importClause.namedBindings) && s.importClause.namedBindings.elements.some((e) => e.name.text === "use" && !e.isTypeOnly),
  );
  if (importsUse && /\buse\(/.test(text)) add("调用 hook use()");
  visit(sf, new Set());

  // 模块顶层 (导入时就求值) 直接碰浏览器全局: 服务端渲染 (含客户端组件的 SSR) 会崩. 同一条顶层语句里有 typeof 守卫才放过.
  const unguarded = topLevel.filter((id) => {
    let st: ts.Node = id;
    while (st.parent && st.parent !== sf) st = st.parent;
    return !new RegExp(`typeof\\s+${id.text}\\b`).test(st.getText(sf));
  });
  const pro = prologue(sf);
  const hasDirective = pro.includes("use client");
  const misplaced = !hasDirective && /^\s*["']use client["'];?\s*$/m.test(text);
  const marker = (k: string) => new RegExp(`^\\s*//\\s*hx:${k}\\s+\\S`, "m").test(text);
  return { hasJsx, unguarded: unguarded.map((id) => `${id.text} (第 ${sf.getLineAndCharacterOfPosition(id.getStart(sf)).line + 1} 行)`), reasons: [...reasons], hasDirective, misplaced, serverSafe: marker("server-safe"), forceClient: marker("client") };
}

const errors: string[] = [];
const files = walk(SRC);
const clientSet = new Set<string>();
let clientCount = 0;
for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const r = analyze(file, readFileSync(file, "utf8"));
  const browserOnly = r.reasons.length > 0 && r.reasons.every((x) => x.startsWith("浏览器全局"));
  const needs = r.forceClient || (r.reasons.length > 0 && !(r.serverSafe && browserOnly));
  if (r.serverSafe && !browserOnly) errors.push(`${rel}: 标了 hx:server-safe, 但还有 ${r.reasons.filter((x) => !x.startsWith("浏览器全局")).join(", ")}`);
  if (r.unguarded.length) errors.push(`${rel}: 模块顶层直接用了浏览器全局 ${r.unguarded.join(", ")}, SSR 时会崩; 挪进函数 / effect, 或加 typeof 守卫`);
  if (r.misplaced) errors.push(`${rel}: "use client" 必须是文件第一条语句 (前面只能有注释)`);
  else if (needs && !r.hasDirective) errors.push(`${rel}: 缺 "use client" (${r.reasons.join(", ") || "hx:client"})`);
  else if (!needs && r.hasDirective && !r.hasJsx)
    errors.push(`${rel}: 多余的 "use client" (不渲染 JSX, 也没有 hook / 事件 / 浏览器全局 / 客户端包; 桶文件和工具模块写了它, 导出在服务端就变成客户端引用); 删掉, 或写 // hx:client <理由>`);
  if (r.hasDirective) {
    clientCount++;
    clientSet.add(relative(SRC, file).replace(/\\/g, "/").replace(/\.tsx?$/, ""));
  }
}

// ---- 公共入口的导出来源
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const resolveSrc = (from: string, spec: string): string | null => {
  const base = spec.startsWith("@/") ? join(SRC, spec.slice(2)) : resolve(dirname(from), spec);
  for (const c of [base + ".ts", base + ".tsx", join(base, "index.ts"), join(base, "index.tsx")]) if (existsSync(c)) return c;
  return null;
};
const valueExports = new Map<string, Map<string, string>>(); // 模块 -> 导出名 -> 来源模块
function exportsOf(file: string, seen = new Set<string>()): Map<string, string> {
  const hit = valueExports.get(file);
  if (hit) return hit;
  const out = new Map<string, string>();
  if (seen.has(file)) return out;
  seen.add(file);
  const sf = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const isExported = (n: ts.Node) => ts.canHaveModifiers(n) && !!ts.getModifiers(n)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  for (const st of sf.statements) {
    if (ts.isExportDeclaration(st)) {
      if (st.isTypeOnly) continue;
      const target = st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier) ? resolveSrc(file, st.moduleSpecifier.text) : null;
      if (st.moduleSpecifier && !target) continue; // 第三方包的 re-export
      if (!st.exportClause) {
        for (const [n, o] of exportsOf(target!, seen)) out.set(n, o); // export * from
      } else if (ts.isNamespaceExport(st.exportClause)) {
        for (const [n, o] of exportsOf(target!, seen)) out.set(`${st.exportClause.name.text}.${n}`, o); // export * as NS
      } else {
        for (const e of st.exportClause.elements) {
          if (e.isTypeOnly) continue;
          const local = (e.propertyName ?? e.name).text;
          out.set(e.name.text, target ? exportsOf(target, seen).get(local) ?? target : file);
        }
      }
    } else if (isExported(st)) {
      if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) ts.isIdentifier(d.name) && out.set(d.name.text, file);
      else if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isEnumDeclaration(st)) && st.name) out.set(st.name.text, file);
    }
  }
  valueExports.set(file, out);
  return out;
}
const isClient = (f: string) => prologue(ts.createSourceFile(f, readFileSync(f, "utf8"), ts.ScriptTarget.Latest, true)).includes("use client");
let entryCount = 0;
for (const [key, target] of Object.entries<Record<string, string> | string>(pkg.exports ?? {})) {
  const js = typeof target === "string" ? target : target.default;
  if (key.includes("*") || !js?.endsWith(".js")) continue;
  const src = resolveSrc(join(SRC, "x"), "./" + js.replace(/^\.\/dist\//, "").replace(/\.js$/, ""));
  if (!src) {
    errors.push(`exports["${key}"] -> ${js}: 在 src/ 里找不到对应模块`);
    continue;
  }
  entryCount++;
  for (const [name, origin] of exportsOf(src)) {
    const leaf = name.split(".").pop()!;
    if (/^[A-Z][a-z0-9]/.test(leaf) || /^use[A-Z0-9]/.test(leaf)) continue; // 组件 / hook: 客户端引用正好可用
    if (isClient(origin))
      errors.push(`exports["${key}"] 的 ${name} 来自客户端模块 ${relative(ROOT, origin).replace(/\\/g, "/")}: 服务端组件里拿到的是客户端引用, 挪到服务端安全的模块再导出`);
  }
}

let distChecked = 0;
if (process.argv.includes("--dist")) {
  if (!existsSync(DIST)) errors.push("dist/ 不存在, 先跑 npm run build:lib");
  else {
    for (const mod of files.map((f) => relative(SRC, f).replace(/\\/g, "/").replace(/\.tsx?$/, ""))) {
      const js = join(DIST, mod + ".js");
      if (!existsSync(js)) continue; // 纯类型模块没有 JS 产物
      distChecked++;
      const first = readFileSync(js, "utf8").split("\n", 1)[0].trim();
      const has = /^["']use client["'];?$/.test(first);
      if (clientSet.has(mod) && !has) errors.push(`dist/${mod}.js: 源码有 "use client", 产物第一行没有`);
      if (!clientSet.has(mod) && has) errors.push(`dist/${mod}.js: 源码没有 "use client", 产物却带了`);
    }
  }
}

console.log(`check-client: ${files.length} 个模块, ${clientCount} 个客户端模块, ${files.length - clientCount} 个服务端安全; 公共入口 ${entryCount} 个${distChecked ? `; dist 逐文件核对 ${distChecked} 个` : ""}`);
if (errors.length) {
  console.error(`\ncheck-client: ${errors.length} 个问题\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log("check-client: OK");
