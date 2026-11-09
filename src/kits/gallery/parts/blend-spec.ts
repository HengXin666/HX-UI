/**
 * BlendSlider 的规格常数与转场关键帧.
 *
 * .agents/notes/implemented/feature/2026-11-09-kits-gallery.md
 */

/** 规格默认 (MorphSlider.jsx:478-495). 时间换成 ms. */
export const BLEND_DEFAULTS = { duration: 1100, autoplayDelay: 4000 } as const;
/** 标题换位占总时长的比例, 指示条宽度占的比例 (MorphSlider.jsx:602-603). */
export const BLEND_CAPTION_RATIO = 0.66;
export const BLEND_DOT_RATIO = 0.45;
/** 减弱动效时转场上限 ms (MorphSlider.jsx:358 的 min(duration, 0.4)). */
export const BLEND_REDUCED_MS = 400;
/** 熔化时的起始模糊 px, 旋入的起始角度与放大, 标题起始下移 px. HX 自定 (规格在着色器里). */
export const BLEND_MELT_BLUR_PX = 14;
export const BLEND_SWIRL_DEG = 10;
export const BLEND_SWIRL_SCALE = 1.15;
export const BLEND_CAPTION_RISE_PX = 12;
/** 横扫翻页的拖拽阈值 px. HX 自定. */
export const BLEND_SWIPE_PX = 40;

export type BlendTransition = "melt" | "ripple" | "shear" | "swirl";

/** 新一幅进场的关键帧. dir 1 为前进 (从右边来), -1 为后退. */
export function blendFrames(kind: BlendTransition, dir: 1 | -1): Keyframe[] {
  switch (kind) {
    case "ripple":
      return [{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)" }];
    case "shear":
      return dir > 0 ? [{ clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)" }] : [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }];
    case "swirl":
      return [
        { opacity: 0, transform: `rotate(${-dir * BLEND_SWIRL_DEG}deg) scale(${BLEND_SWIRL_SCALE})` },
        { opacity: 1, transform: "rotate(0deg) scale(1)" },
      ];
    default:
      return [
        { opacity: 0, filter: `blur(${BLEND_MELT_BLUR_PX}px)` },
        { opacity: 1, filter: "blur(0px)" },
      ];
  }
}

/** 减弱动效时只淡入. */
export const BLEND_FADE: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
