/**
 * 导出给非 Web 端 (安卓 Compose 等) 用的机器可读令牌与组件清单, 由 build-lib.ts 调用, 也可单独跑:
 *   node scripts/export-tokens.ts [输出目录, 默认 dist]
 *
 *   dist/tokens.json      theme.css 里的亮 / 暗令牌, 每个皮肤 (data-theme) 合并后的完整一套, 颜色给 sRGB 十六进制;
 *                         圆角 (px), 动效时长与缓动, 字体, 图标集版本
 *   dist/components.json  src/components/ui 下每个 cva 定义的变体与尺寸, 供其它端对照实现
 * 不引新依赖: CSS 与 cva 都只解析库里自己的写法.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Vars = Record<string, string>;
type Mode = "light" | "dark";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const THEME_CSS = join(ROOT, "src", "styles", "theme.css");
const UI_DIR = join(ROOT, "src", "components", "ui");
const SCHEMA = "hx-ui-tokens/1";
const ROOT_FONT_PX = 16;
const RADIUS_STEPS: Record<string, number> = { sm: -4, md: -2, lg: 0, xl: 4, "2xl": 10 };
const SKIN = /\[data-theme="([a-z]+)"\]/;
const DARK = ".dark";

function blocks(css: string): { selector: string; vars: Vars }[] {
  const out: { selector: string; vars: Vars }[] = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const vars: Vars = {};
    for (const d of m[2].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) vars[d[1]] = d[2].trim();
    // 选择器前面可能粘着 @import / @custom-variant 这类不带花括号的语句
    out.push({ selector: (m[1].split(";").pop() ?? "").trim(), vars });
  }
  return out;
}

/** 把选择器归到 (基础 | 皮肤) x (亮 | 暗); @theme 等其它块返回 null. */
function classify(selector: string): { skin: string | null; mode: Mode } | null {
  const skin = selector.match(SKIN)?.[1] ?? null;
  const dark = selector.startsWith(DARK);
  if (selector === ":root") return { skin: null, mode: "light" };
  if (selector === DARK) return { skin: null, mode: "dark" };
  if (skin) return { skin, mode: dark ? "dark" : "light" };
  return null;
}

function resolveVars(vars: Vars): Vars {
  const out: Vars = {};
  const get = (k: string, depth = 0): string => {
    const v = vars[k] ?? "";
    if (depth > 8) return v;
    return v.replace(/var\(--([\w-]+)\)/g, (_, ref: string) => get(ref, depth + 1));
  };
  for (const k of Object.keys(vars)) out[k] = get(k);
  return out;
}

const hex2 = (n: number) => Math.round(Math.min(1, Math.max(0, n)) * 255).toString(16).padStart(2, "0");

function oklchToHex(l: number, c: number, h: number, a: number): string {
  const r = (h * Math.PI) / 180;
  const A = c * Math.cos(r), B = c * Math.sin(r);
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  const gamma = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  return "#" + lin.map((x) => hex2(gamma(x))).join("") + (a < 1 ? hex2(a) : "");
}

const alpha = (s: string | undefined) => (s === undefined ? 1 : s.endsWith("%") ? parseFloat(s) / 100 : parseFloat(s));

/** 颜色统一成 #RRGGBB(AA); 不是颜色的值原样返回. */
function color(v: string): string {
  const ok = v.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)$/);
  if (ok) return oklchToHex(+ok[1], +ok[2], +ok[3], alpha(ok[4]));
  const rgb = v.match(/^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)$/);
  if (rgb) return "#" + [rgb[1], rgb[2], rgb[3]].map((n) => hex2(+n / 255)).join("") + (rgb[4] ? hex2(alpha(rgb[4])) : "");
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v.toLowerCase();
  return v;
}

function colors(vars: Vars): Vars {
  const out: Vars = {};
  for (const [k, v] of Object.entries(resolveVars(vars))) {
    const c = color(v);
    if (c.startsWith("#")) out[k] = c;
  }
  return out;
}

function radius(base: Vars): Record<string, number> {
  const r = parseFloat(base["radius"] ?? "0.75") * ROOT_FONT_PX;
  return Object.fromEntries(Object.entries(RADIUS_STEPS).map(([k, d]) => [k, r + d]));
}

function motion(base: Vars) {
  const duration: Record<string, number> = {};
  const easing: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(base)) {
    if (k.startsWith("dur-")) duration[k.slice(4)] = parseFloat(v);
    const bez = v.match(/^cubic-bezier\(([^)]+)\)$/);
    if (k.startsWith("ease-") && bez) easing[k.slice(5)] = bez[1].split(",").map((x) => parseFloat(x));
  }
  return { duration, easing };
}

function tokens() {
  const css = readFileSync(THEME_CSS, "utf8");
  const raw: Record<string, Record<Mode, Vars>> = { base: { light: {}, dark: {} } };
  let font: Vars = {};
  for (const b of blocks(css)) {
    if (b.selector.startsWith("@theme")) font = { ...font, ...b.vars };
    const k = classify(b.selector);
    if (!k) continue;
    const key = k.skin ?? "base";
    raw[key] ??= { light: {}, dark: {} };
    Object.assign(raw[key][k.mode], b.vars);
  }
  const base = raw.base;
  const merged = (mode: Mode, skin: Record<Mode, Vars>) =>
    // 皮肤只写了亮色时, 暗色沿用亮色里的覆盖 (CSS 里同一条 [data-theme] 对两种模式都生效)
    colors({ ...base.light, ...(mode === "dark" ? base.dark : {}), ...skin.light, ...(mode === "dark" ? skin.dark : {}) });
  const skins: Record<string, Record<Mode, Vars>> = {};
  for (const [name, skin] of Object.entries(raw)) if (name !== "base") skins[name] = { light: merged("light", skin), dark: merged("dark", skin) };
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  return {
    $schema: SCHEMA,
    version: pkg.version as string,
    colors: { light: colors(base.light), dark: colors({ ...base.light, ...base.dark }) },
    skins,
    radius: radius(base.light),
    motion: motion(base.light),
    font: { sans: font["font-sans"] ?? "", mono: font["font-mono"] ?? "" },
    icons: { set: "lucide", version: (pkg.dependencies?.["lucide-react"] ?? "") as string },
  };
}

/** 从 start 处的 "{" 找到配对的 "}", 返回中间的内容. */
function braced(src: string, start: number): string {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === "{") depth++;
    if (src[i] === "}" && --depth === 0) return src.slice(start + 1, i);
  }
  return "";
}

/** 只取对象字面量的第一层键 (键后跟冒号). */
function topKeys(body: string): string[] {
  const keys: string[] = [];
  let depth = 0;
  // 去掉注释和类名字符串 (里面的 hover: 之类不是键), 只留作键用的引号串
  const noComment = body.replace(/\/\/[^\n]*/g, "");
  const plain = noComment.replace(/"[^"]*"/g, (s, at: number) => (/^\s*:/.test(noComment.slice(at + s.length)) ? s : '""'));
  for (const m of plain.matchAll(/[{}]|(?:^|[\s,])"?([\w-]+)"?\s*:/g)) {
    if (m[0] === "{") depth++;
    else if (m[0] === "}") depth--;
    else if (depth === 0) keys.push(m[1]);
  }
  return keys;
}

function components() {
  const out: Record<string, Record<string, unknown>> = {};
  for (const file of readdirSync(UI_DIR).filter((f) => f.endsWith(".tsx")).sort()) {
    const src = readFileSync(join(UI_DIR, file), "utf8");
    // 任何 cva 赋值都算 (progress 的 track 不带 Variants 后缀), 名字去掉 Variants 后缀
    for (const m of src.matchAll(/const\s+(\w+?)(?:Variants)?\s*=\s*cva\(/g)) {
      const at = src.indexOf("variants:", m.index);
      if (at < 0) continue;
      const body = braced(src, src.indexOf("{", at));
      const entry: Record<string, unknown> = {};
      for (const key of topKeys(body)) {
        const k = body.search(new RegExp(`(^|[\\s,])${key}\\s*:\\s*\\{`));
        entry[key] = topKeys(braced(body, body.indexOf("{", k)));
      }
      const def = src.indexOf("defaultVariants:", at);
      if (def > 0) {
        const d = braced(src, src.indexOf("{", def));
        entry["default"] = Object.fromEntries([...d.matchAll(/([\w-]+)\s*:\s*"([^"]+)"/g)].map((x) => [x[1], x[2]]));
      }
      out[m[1]] = entry;
    }
  }
  return out;
}

/*
 * 令牌与组件清单从源码现解析, 不手写第二份.
 */
export function exportTokens(outDir: string) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "tokens.json"), JSON.stringify(tokens(), null, 2) + "\n");
  writeFileSync(join(outDir, "components.json"), JSON.stringify({ $schema: SCHEMA, components: components() }, null, 2) + "\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  exportTokens(resolve(ROOT, process.argv[2] ?? "dist"));
  console.log("[export-tokens] tokens.json, components.json");
}
