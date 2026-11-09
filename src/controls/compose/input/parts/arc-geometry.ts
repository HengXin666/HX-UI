/**
 * ArcField 的弯曲几何: 整条输入框沿一条抛物线下垂 bend 像素, 外框, 文字基线与按钮都取同一条曲线.
 * 曲线 y(x) = 4 bend u (1 - u), u = x / width; 两端为 0, 中点为 bend.
 *
 * .agents/notes/implemented/feature/2026-11-08-controls-compose.md
 */

/** 弧度转角度 (按钮沿切线旋转用). */
export const ARC_DEG = 180 / Math.PI;
/** 投影三档: [纵向偏移 px, 模糊 px, 不透明度]. */
export const ARC_SHADOWS = { none: [0, 0, 0], sm: [5, 12, 0.3], md: [10, 24, 0.4], lg: [16, 40, 0.52] } as const;
export type ArcShadow = keyof typeof ARC_SHADOWS;
/** 支持 selectionStart 的输入类型; 其余 (email, number) 读不到光标, 只能按交互推断. */
export const ARC_SELECTABLE = ["text", "search", "url", "tel", "password"] as const;
export const ARC_DEFAULTS = { width: 450, bend: 28, height: 64, cornerRadius: 18, fontSize: 16 } as const;
/** 文字 / 按钮与外框的留白, 按钮与文字的间距. */
export const ARC_INSET = 8;
export const ARC_PAD_X = 18;
export const ARC_GAP = 10;
/** 规格里的显隐过渡: 文字切换 250ms, 按钮滤镜与透明度 200ms. */
export const ARC_MS = { swap: 250, button: 200 } as const;
/** 平均字宽系数, 按钮宽在量到之前的估计. */
export const ARC_CHAR_EM = 0.6;

const FOUR = 4;
const TWO = 2;
const PERCENT = 100;

/** 曲线在 x 处的下垂量. */
export function arcSag(x: number, width: number, bend: number): number {
  if (width <= 0) return 0;
  const u = x / width;
  return FOUR * bend * u * (1 - u);
}

/** 曲线在 x 处的斜率 dy/dx. */
export function arcSlope(x: number, width: number, bend: number): number {
  if (width <= 0) return 0;
  return (FOUR * bend * (1 - (TWO * x) / width)) / width;
}

/** 曲线在 x 处的切线角 (度), 按钮旋转用. */
export function arcAngle(x: number, width: number, bend: number): number {
  return Math.atan(arcSlope(x, width, bend)) * ARC_DEG;
}

const f = (n: number): string => n.toFixed(2);

/**
 * 曲线在 [xa, xb] 一段的二次贝塞尔, 竖向整体下移 baseY. 抛物线的子段仍是抛物线,
 * 控制点取两端切线的交点 (x 在中点, y 由起点切线外推).
 */
export function arcSlice(xa: number, xb: number, baseY: number, width: number, bend: number): string {
  const ya = baseY + arcSag(xa, width, bend);
  const yb = baseY + arcSag(xb, width, bend);
  const xm = (xa + xb) / TWO;
  const ym = ya + arcSlope(xa, width, bend) * (xm - xa);
  return `M${f(xa)},${f(ya)} Q${f(xm)},${f(ym)} ${f(xb)},${f(yb)}`;
}

/**
 * 外框: 上下两条同曲率的边, 左右竖边, 四角按 cornerRadius 收圆. 画在线宽一半的内缩里, 线不被裁掉.
 */
export function arcOutline(width: number, height: number, bend: number, radius: number, stroke: number): string {
  const s = stroke / TWO;
  const w = width - stroke;
  const h = height - stroke;
  const r = Math.max(0, Math.min(radius, w / TWO, h / TWO));
  const sag = (x: number): number => arcSag(x, w, bend);
  const ctrl = s + sag(r) + arcSlope(r, w, bend) * (w / TWO - r);
  const L = s;
  const R = s + w;
  return [
    `M${f(L + r)},${f(s + sag(r))}`,
    `Q${f(L + w / TWO)},${f(ctrl)} ${f(R - r)},${f(s + sag(w - r))}`,
    `Q${f(R)},${f(s)} ${f(R)},${f(s + r)}`,
    `L${f(R)},${f(s + h - r)}`,
    `Q${f(R)},${f(s + h)} ${f(R - r)},${f(s + h + sag(w - r))}`,
    `Q${f(L + w / TWO)},${f(ctrl + h)} ${f(L + r)},${f(s + h + sag(r))}`,
    `Q${f(L)},${f(s + h)} ${f(L)},${f(s + h - r)}`,
    `L${f(L)},${f(s + r)}`,
    `Q${f(L)},${f(s)} ${f(L + r)},${f(s + sag(r))}`,
    "Z",
  ].join(" ");
}

/** 投影: drop-shadow 跟着弯曲的外框走, 颜色取前景色按档位混透明. */
export function arcShadow(size: ArcShadow): string {
  const [y, blur, alpha] = ARC_SHADOWS[size];
  if (alpha === 0) return "none";
  return `drop-shadow(0 ${y}px ${blur}px color-mix(in srgb, var(--foreground) ${alpha * PERCENT}%, transparent))`;
}

/** 该类型能否读到光标位置. */
export function arcSelectable(type: string): boolean {
  return (ARC_SELECTABLE as readonly string[]).includes(type);
}

const THREE = 3;

/** 曲线在 [xa, xb] 上的平均下垂: 直排文字的竖向位置取它, 两端偏离最小. */
export function arcMeanSag(xa: number, xb: number, width: number, bend: number): number {
  if (width <= 0 || xb <= xa) return arcSag(xa, width, bend);
  const ua = xa / width;
  const ub = xb / width;
  const span = ub - ua;
  const mean = (ub * ub - ua * ua) / TWO / span - (ub ** THREE - ua ** THREE) / THREE / span;
  return FOUR * bend * mean;
}
