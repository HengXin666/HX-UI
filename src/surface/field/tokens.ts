// 行为规格参照 docs/research/catalog/animations.md 的 SplashCursor, MetaBalls, MetallicPaint, LaserFlow, RippleDistortion, ShapeBlur, ElectricLogo 条目, 实现为 HX 自有.
/**
 * field 族 (着色器场) 的手感合同. 数值是规格条目里的常数与 props 默认值, 注释写原规格名.
 * 全部走 backdrop 内核的 WebGL2 通道 (useShaderBackdrop + 乒乓离屏通道); 规格没给, 由本库定的值单独标注.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-field.md
 */

/* ── InkSplash (规格 SplashCursor) ── */
export const INK = {
  /** BLOOM_THRESHOLD, BLOOM_KNEE; BLOOM_ITERATIONS 4 对应泛光金字塔 4 级. */
  bloomThreshold: 0.3,
  bloomKnee: 0.7,
  bloomLevels: 4,
  /** 指针推力 6000 x force / sqrt(spread), 补色 0.15 x intensity x min(dt x 60, 1) / sqrt(spread), 点击 1100 x force. */
  push: 6000,
  dye: 0.15,
  click: 1100,
  /** 帧长上限 1/60 秒. */
  maxDt: 1 / 60,
  /** 花瓣形溅点: 0.78 + 0.22 sin(5a + seed) sin(3a - 1.7 seed). */
  petalBase: 0.78,
  petalAmp: 0.22,
  /** 本库定: 溅点半径 (以画面高为 1 的平方) 0.0025 x size, 涡度 swirl x 10, 染料耗散 1 / trail, 速度耗散 0.2 / momentum, 压力热启动保留 0.8. */
  radius: 0.0025,
  curlScale: 10,
  velocityDissipation: 0.2,
  pressureKeep: 0.8,
  /** 本库定: 画质档的模拟网格 / 染料缓冲比例与压力迭代次数. */
  quality: {
    low: { sim: 0.12, dye: 0.3, steps: 8 },
    medium: { sim: 0.18, dye: 0.45, steps: 14 },
    high: { sim: 0.25, dye: 0.6, steps: 20 },
  },
  /** 本库定: 入场 1.2 秒画一道 S 形. 彩虹模式色相每秒走 0.25 x colorSpeed 圈. */
  introS: 1.2,
  hueRate: 0.25,
  /** 一帧最多几个溅点. */
  maxSplats: 4,
  /** 速度编码范围 (格每秒), 8 位缓冲也能存负值. */
  velocityRange: 1024,
  pressureRange: 512,
} as const;

export type InkQuality = keyof typeof INK.quality;
