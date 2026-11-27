/**
 * 代码围栏的 info string 解析 (纯函数, 服务端安全).
 *
 *   ```ts title="a.ts" {1,3-5} showLineNumbers=false [解法-C++]
 *
 * - 语言名只取第一个空白或 `{` 之前的 token, 小写; `c++` 归一成 `cpp` 等 (见 LANG_ALIAS)
 * - `title="..."` / `title='...'` 标题栏
 * - `{1,3-5}` 高亮行 (1 起)
 * - `showLineNumbers=false` / `nolinenumbers` 关行号; `startLine=10` 起始行号
 * - `[组名-标签]` 组合代码块 (博客 / 力扣风格选项卡): 相邻且组名相同的围栏合成一块
 * - `collapse` / `collapse=20` 超过 N 行折叠
 */

export interface FenceMeta {
  /** 原样的语言名 (展示用, 例如 "C++") */
  rawLang: string;
  /** 归一后的语言 id (高亮用, 例如 "cpp") */
  lang: string;
  title?: string;
  /** 高亮的行号集合 (1 起) */
  highlight: Set<number>;
  lineNumbers: boolean;
  startLine: number;
  group?: { name: string; label: string };
  /** 超过多少行折叠; 0 表示不折叠 */
  collapse: number;
}

/** 常见别名: 展示名 -> shiki 语言 id */
export const LANG_ALIAS: Record<string, string> = {
  "c++": "cpp",
  cxx: "cpp",
  hpp: "cpp",
  "c#": "csharp",
  cs: "csharp",
  py: "python",
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "shellsession",
  yml: "yaml",
  md: "markdown",
  rs: "rust",
  kt: "kotlin",
  golang: "go",
  dockerfile: "docker",
  text: "plaintext",
  txt: "plaintext",
  plain: "plaintext",
};

/** 渲染成图 / 公式而不是代码的语言 */
export const DIAGRAM_LANGS = new Set(["mermaid", "svg", "math", "latex", "katex", "tex"]);

export const DEFAULT_COLLAPSE = 0;

const TITLE = /\btitle=(?:"([^"]*)"|'([^']*)'|(\S+))/;
const RANGES = /\{([\d,\s-]+)\}/;
const GROUP = /\[([^\]-]+)-([^\]]+)\]/;
const START = /\bstartLine=(\d+)/;
const COLLAPSE = /\bcollapse(?:=(\d+))?\b/;

export function normalizeLang(raw: string): string {
  const l = raw.trim().toLowerCase();
  return LANG_ALIAS[l] ?? l;
}

/** "1,3-5" -> {1,3,4,5}; 非法片段忽略, 单段最多展开 2000 行 */
export function parseRanges(spec: string): Set<number> {
  const out = new Set<number>();
  for (const part of spec.split(",")) {
    const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let i = Math.min(a, b); i <= Math.max(a, b) && i - Math.min(a, b) < 2000; i++) out.add(i);
  }
  return out;
}

/** 解析 className (`language-xxx`) 之外的那一段 meta; lang 由调用方给 */
export function parseFence(rawLang: string, meta?: string | null): FenceMeta {
  const m = meta ?? "";
  const title = m.match(TITLE);
  const ranges = m.match(RANGES);
  const group = m.match(GROUP);
  const start = m.match(START);
  const collapse = m.match(COLLAPSE);
  const lineNumbers = !/\bshowLineNumbers=false\b|\bnolinenumbers\b|\bnoLineNumbers\b/.test(m);
  return {
    rawLang: rawLang.trim(),
    lang: normalizeLang(rawLang || "plaintext") || "plaintext",
    title: title ? (title[1] ?? title[2] ?? title[3]) : undefined,
    highlight: ranges ? parseRanges(ranges[1]) : new Set(),
    lineNumbers,
    startLine: start ? Math.max(1, Number(start[1])) : 1,
    group: group ? { name: group[1].trim(), label: group[2].trim() } : undefined,
    collapse: collapse ? (collapse[1] ? Number(collapse[1]) : 20) : DEFAULT_COLLAPSE,
  };
}

/** 一整行 info string (```ts title="x") 拆成语言和 meta */
export function splitInfo(info: string): { lang: string; meta: string } {
  const s = info.trim();
  const m = s.match(/^([^\s{[]+)\s*([\s\S]*)$/);
  if (!m) return { lang: "", meta: s };
  return { lang: m[1], meta: m[2] };
}

/** 去掉末尾的一个换行 (markdown 解析器给的代码常以 \n 结尾) */
export function trimCode(code: string): string {
  return code.endsWith("\n") ? code.slice(0, -1) : code;
}
