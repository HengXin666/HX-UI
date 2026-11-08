// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.

/** sRGB 三通道, 0..1, 已做伽马编码, 着色器直接当颜色用. */
export type Rgb = readonly [number, number, number];

const CHANNEL_MAX = 255;
const PERCENT = "%";
const PERCENT_SCALE = 100;
const HEX_SHORT_LENGTHS = [3, 4];
const HEX_FULL = 6;
const HEX_PAIR = 2;
const HEX_RADIX = 16;
const DEG_TO_RAD = Math.PI / 180;
const TOKEN_NAME = /^[a-z][a-z0-9-]*$/;
const HEX_BODY = /^#([0-9a-f]+)$/i;
const FUNC_CALL = /^([a-z-]+)\((.*)\)$/i;
const SRGB_SPACE = "srgb";
const TRANSPARENT = "transparent";

/**
 * 颜色 prop 的写法换成 CSS 颜色串. 裸标识符按语义 token 名读 (primary 读成 var(--primary)),
 * 其余原样交给浏览器 (var(--x), color-mix(...), 用户覆写的任意色值).
 */
export function cssColorOf(value: string): string {
  const text = value.trim();
  if (text.startsWith("--")) return `var(${text})`;
  return TOKEN_NAME.test(text) ? `var(--${text})` : text;
}

function channel(raw: string, scale: number): number {
  const text = raw.trim();
  const n = Number.parseFloat(text);
  if (!Number.isFinite(n)) return Number.NaN;
  return text.endsWith(PERCENT) ? n / PERCENT_SCALE : n / scale;
}

function cube(x: number): number {
  return x * x * x;
}

function encodeSrgb(linear: number): number {
  const x = Math.min(1, Math.max(0, linear));
  return x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055;
}

/**
 * OKLCH 换 sRGB (伽马编码, 越界钳到色域). tokens.css 的色板全部是 oklch, 浏览器不给像素回读时靠它兜底.
 *
 * @param l 明度 0..1.
 * @param c 色度.
 * @param hDeg 色相 (度).
 */
export function oklchToRgb(l: number, c: number, hDeg: number): Rgb {
  const a = c * Math.cos(hDeg * DEG_TO_RAD);
  const b = c * Math.sin(hDeg * DEG_TO_RAD);
  const lc = cube(l + 0.3963377774 * a + 0.2158037573 * b);
  const mc = cube(l - 0.1055613458 * a - 0.0638541728 * b);
  const sc = cube(l - 0.0894841775 * a - 1.291485548 * b);
  return [
    encodeSrgb(4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc),
    encodeSrgb(-1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc),
    encodeSrgb(-0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc),
  ];
}

function parseHex(body: string): Rgb | null {
  const digits = HEX_SHORT_LENGTHS.includes(body.length) ? body.split("").map((d) => d + d).join("") : body;
  if (digits.length < HEX_FULL) return null;
  const [r, g, b] = [0, 1, HEX_PAIR].map((i) => Number.parseInt(digits.slice(i * HEX_PAIR, (i + 1) * HEX_PAIR), HEX_RADIX) / CHANNEL_MAX);
  return [r, g, b];
}

function finite(rgb: Rgb): Rgb | null {
  return rgb.every((v) => Number.isFinite(v)) ? rgb : null;
}

/**
 * 解析常见的 CSS 颜色串: 十六进制, rgb 与 rgba 函数, oklch 函数, color(srgb ...).
 * 解析不了 (var(), color-mix, 命名色) 返回 null, 由调用方走像素回读或兜底色.
 */
export function parseColor(text: string): Rgb | null {
  const source = text.trim().toLowerCase();
  const hex = HEX_BODY.exec(source);
  if (hex) return parseHex(hex[1]);
  const call = FUNC_CALL.exec(source);
  if (!call) return null;
  const [name, args] = call.slice(1);
  const [p0 = "", p1 = "", p2 = "", p3 = ""] = args.replace(/[,/]/g, " ").split(/\s+/).filter(Boolean);
  if (name === "rgb" || name === "rgba") {
    return finite([channel(p0, CHANNEL_MAX), channel(p1, CHANNEL_MAX), channel(p2, CHANNEL_MAX)]);
  }
  if (name === "oklch") {
    const h = Number.parseFloat(p2);
    return finite(oklchToRgb(channel(p0, 1), Number.parseFloat(p1), Number.isFinite(h) ? h : 0));
  }
  if (name === "color" && p0 === SRGB_SPACE) {
    return finite([channel(p1, 1), channel(p2, 1), channel(p3, 1)]);
  }
  return null;
}

let probeCanvas: HTMLCanvasElement | null | undefined;

/** 1x1 画布像素回读: 浏览器自己把 oklch, color-mix 等任意写法算成 sRGB 字节. 写法无效时画出透明, 返回 null. */
function readPixel(css: string): Rgb | null {
  if (probeCanvas === undefined) {
    probeCanvas = typeof document === "undefined" ? null : document.createElement("canvas");
    if (probeCanvas) probeCanvas.width = probeCanvas.height = 1;
  }
  const ctx = probeCanvas?.getContext("2d", { willReadFrequently: true }) ?? null;
  if (!ctx) return null;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = TRANSPARENT;
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return a > 0 ? [r / CHANNEL_MAX, g / CHANNEL_MAX, b / CHANNEL_MAX] : null;
}

/**
 * 在 host 的作用域里求一个颜色 prop 的 sRGB 值: 子树换主题时读到的是子树的 token.
 * 先让浏览器算计算值, 再像素回读, 都不行时解析字符串, 最后用 fallback.
 *
 * @param host 求值所在的元素, 为 null 时用 document.body.
 * @param value 颜色 prop (token 名或 CSS 颜色).
 * @param fallback 全部失败时的颜色.
 */
export function resolveColor(host: Element | null, value: string, fallback: Rgb): Rgb {
  const css = cssColorOf(value);
  if (typeof document === "undefined") return parseColor(css) ?? fallback;
  const parent = host ?? document.body;
  const probe = document.createElement("span");
  probe.style.display = "none";
  probe.style.color = css;
  parent.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  const text = computed || css;
  return readPixel(text) ?? parseColor(text) ?? fallback;
}
