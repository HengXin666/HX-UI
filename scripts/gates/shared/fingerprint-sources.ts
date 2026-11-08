/** 质量指纹第一组 ("多严") 的抽取器: 阈值常量 / 整份代码 token / 白名单条目 / 注册表与 lane 表. */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { LANES_FILE, NEWLINE, REGISTRY_FILE, UTF8 } from "../../constants/gates.ts";
import type { Gate } from "../registry.ts";

/** 声明续行最多往后收多少行 (多行 Set / 对象 / 正则). */
const MAX_CONTINUATION = 30;

/** 读扫描根下的文件; 不存在返回 null. */
export function readAt(root: string, file: string): string | null {
  const p = path.join(root, file);
  return fs.existsSync(p) ? fs.readFileSync(p, UTF8) : null;
}

/**
 * 从门禁脚本里抽"决定严格度的常量": 行首全大写常量名的声明行 (去掉尾部注释) 加续行直到语句结束.
 * 第一版只收 `const NAME = <字面量>`, 结果正则 / new Set([...]) / 模板串一个都没读到, 三条门禁的
 * 指纹哈希完全相同而照样打印"通过". 所以宁可多抽: 改扫描根, 白名单, 正则, 阈值都应该要显式承认.
 */
export function thresholdsOf(root: string, script: string): string {
  const src = readAt(root, script);
  if (src === null) return `(缺文件 ${script})`;
  const lines = src.split(NEWLINE);
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^const\s+([A-Z][A-Z0-9_]{2,})\s*=/);
    if (!m) continue;
    let text = lines[i];
    let j = i;
    while (!/[;)]\s*(?:\/\/.*)?$/.test(text) && j < Math.min(lines.length - 1, i + MAX_CONTINUATION)) {
      j += 1;
      text += NEWLINE + lines[j];
    }
    i = j;
    out.push(text.replace(/\/\/.*$/gm, "").replace(/\s+/g, " ").trim());
  }
  return out.length > 0 ? out.join(NEWLINE) : "(无大写常量声明  抽取器没读到任何严格度字段)";
}

/**
 * 去注释后的 token 序列加语法树括号, token 之间只留一个空格, token 内部 (字符串 / 正则 / 模板字面量) 原样保留.
 * 改注释, 换行, 缩进不动指纹, 而只差字面量内空白的放松必须动指纹; 括号记录节点嵌套, 换行只在改变解析结果时体现.
 */
function tokensOf(src: string): string {
  const sourceFile = ts.createSourceFile("fingerprint.ts", src, ts.ScriptTarget.Latest, true);
  const tokens: string[] = [];
  const walk = (node: ts.Node): void => {
    if (node.kind >= ts.SyntaxKind.FirstJSDocNode && node.kind <= ts.SyntaxKind.LastJSDocNode) return;
    const children = node.getChildren(sourceFile);
    if (children.length === 0) {
      tokens.push(node.getText(sourceFile));
      return;
    }
    tokens.push("(");
    children.forEach(walk);
    tokens.push(")");
  };
  walk(sourceFile);
  return tokens.filter(Boolean).join(" ");
}

/** 整份代码的 token 指纹 (判据写在对象数组里, 抽不全大写常量的脚本用它). */
export function codeOf(root: string, files: string[]): string {
  return files
    .map((file) => {
      const src = readAt(root, file);
      if (src === null) return `(缺文件 ${file})`;
      return `${file}:\n${tokensOf(src)}`;
    })
    .join(NEWLINE);
}

/** 白名单条目集: 去注释与空行后排序 (顺序变化不该改指纹, 条目增删必须改). */
export function entriesOf(root: string, file: string): string {
  const src = readAt(root, file);
  if (src === null) return "(缺文件)";
  try {
    const json = JSON.parse(src);
    const a = json.allow ?? json;
    const lines: string[] = [];
    for (const key of Object.keys(a).sort()) lines.push(`${key}: ${[...(a[key] ?? [])].sort().join(", ")}`);
    return lines.join(NEWLINE) || "(空)";
  } catch {
    return src
      .split(NEWLINE)
      .map((l) => l.replace(/^\s*\/\/.*$/, "").trim())
      .filter(Boolean)
      .sort()
      .join(NEWLINE);
  }
}

/** 按扫描根加载门禁模块 (注册表 / lane 表); 文件缺失或求值失败返回 null. */
async function load(root: string, file: string): Promise<Record<string, unknown> | null> {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) return null;
  try {
    return await import(pathToFileURL(p).href);
  } catch {
    return null;
  }
}

/**
 * 注册表: 求值后只取 id / group / cwd / args / strictArgs / produces / requires, **不取 label** (那是显示名).
 * 求值而不是正则抽文本: argv 里引用的常量 (scripts/constants/gates.ts) 改了值, 指纹同样会变.
 */
export async function registryOf(root: string): Promise<string> {
  const mod = await load(root, REGISTRY_FILE);
  const gates = mod?.GATES as Gate[] | undefined;
  if (!Array.isArray(gates)) return "(缺注册表)";
  const lines = gates.map(
    (g) => `${g.id} | ${g.group} | ${g.cwd} | args=${JSON.stringify(g.args)} | strict=${g.strictArgs ? JSON.stringify(g.strictArgs) : "(同 args)"}`,
  );
  for (const g of gates) if (g.produces) lines.push(`produces: ${g.produces}`);
  for (const g of gates) if (g.requires) lines.push(`requires: ${g.requires}`);
  return lines.join(NEWLINE);
}

/** lane 表: 每条 lane 的名字, 前缀与分组, 加排序后的免检前缀. */
export async function lanesOf(root: string): Promise<string> {
  const mod = await load(root, LANES_FILE);
  const lanes = mod?.LANES as Array<{ name: string; prefixes: string[]; groups: string[] }> | undefined;
  if (!Array.isArray(lanes)) return "(缺 lane 表)";
  const lines = lanes.map((l) => `${l.name} | ${JSON.stringify(l.prefixes)} | ${JSON.stringify(l.groups)}`);
  const noGate = mod?.NO_GATE_ENTRIES as Array<{ prefix: string }> | undefined;
  if (Array.isArray(noGate)) lines.push(`NO_GATE: ${noGate.map((e) => e.prefix).sort().join(", ")}`);
  return lines.join(NEWLINE);
}
