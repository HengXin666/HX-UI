// 行为规格参照 docs/research/catalog/backgrounds-1.md 的 Backgrounds 族共用 (单画布, DPR 上限, 离屏停帧) 条目, 实现为 HX 自有.

/** 字形图集: 每格一个字符, 白字透明底, 着色器按格采样后自己上色. */
export interface GlyphAtlas {
  readonly canvas: HTMLCanvasElement;
  readonly columns: number;
  readonly rows: number;
  readonly count: number;
}

const MASK_INK = "white";
const GLYPH_FILL = 0.78;

/** 图集的行列: 近似方形, 列数为 ceil(sqrt(n)). 纯函数. */
export function atlasGrid(count: number): readonly [number, number] {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  return [columns, Math.max(1, Math.ceil(count / columns))];
}

/**
 * 用 Canvas2D 画一张字形图集. 环境没有 2d 上下文时返回 null, 调用方退到不带字形的画法.
 *
 * @param glyphs 要画的字符, 按 Unicode 码点拆分.
 * @param cell 每格边长 (像素).
 * @param fontFamily CSS 字体族, 建议等宽.
 */
export function createGlyphAtlas(glyphs: string, cell: number, fontFamily: string): GlyphAtlas | null {
  if (typeof document === "undefined") return null;
  const chars = Array.from(glyphs);
  const [columns, rows] = atlasGrid(chars.length);
  const canvas = document.createElement("canvas");
  canvas.width = columns * cell;
  canvas.height = rows * cell;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = MASK_INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(cell * GLYPH_FILL)}px ${fontFamily}`;
  const half = cell / 2;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, (i % columns) * cell + half, Math.floor(i / columns) * cell + half);
  });
  return { canvas, columns, rows, count: chars.length };
}
