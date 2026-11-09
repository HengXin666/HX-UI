// 行为规格参照 docs/research/catalog/animations.md 的 LogoLoop, OrbitImages 条目, 实现为 HX 自有.
/**
 * loop 族 (循环行进的条带与轨道) 的手感合同. 数值是规格条目里的常数与 props 默认值, 注释写原规格名.
 * 规格没给, 由本库定的值单独标注.
 *
 * .agents/notes/implemented/feature/2026-11-10-surface-loop.md
 */

/* ── MarkRail (规格 LogoLoop) ── */
export const RAIL = {
  /** 速度跟随目标的时间常数 (SMOOTH_TAU). */
  smoothTauS: 0.25,
  /** 甩出后的滑行衰减 (GLIDE_TAU). */
  glideTauS: 0.8,
  /** 超过这个位移 (px) 才算拖动, 之后的点击被吞掉 (DRAG_THRESHOLD). */
  dragThresholdPx: 6,
  /** 甩出速度上限 px/s (MAX_FLING). */
  maxFling: 4000,
  /** 入场: 每件淡入时长与整列错峰总量 (INTRO_TIME, INTRO_STAGGER). */
  introS: 0.7,
  introStaggerS: 0.45,
  /** 帧长上限 (秒). */
  maxDtS: 0.1,
  /** 拖动速度采样的平滑时间常数 (本库定). */
  dragVelTauS: 0.05,
  /** 进视口判定 (threshold). */
  viewThreshold: 0.1,
  /** 悬停件的过渡时长 ms (transform 0.3s). */
  hoverMs: 300,
  /** 默认速度 px/s 与间距 px (本库定; 规格没有带默认值的签名). */
  speed: 80,
  gap: 40,
  /** 两侧渐隐占宽度的比例 (本库定). */
  fadeShare: 0.08,
} as const;
