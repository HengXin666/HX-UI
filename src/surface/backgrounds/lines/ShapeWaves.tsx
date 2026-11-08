// 行为规格参照 docs/research/catalog/backgrounds-2.md 的 ShapeWaves 条目, 实现为 HX 自有.
"use client";

import { useRef, type CSSProperties, type JSX } from "react";
import { BackdropShell, fallbackGradient, splitCommon, useShaderBackdrop, type BackdropCommonProps, type BackdropFrame } from "../../backdrop/kernel";
import { DEG, LINE_GREY } from "./tokens";
import { SHAPE_WAVES_FRAGMENT, shapeIntro, shapeModeOf, type ShapeMode } from "./shape-waves-shader";
import { advanceField, createTextMask, fieldGrid, makeWaveField, packWaves, type WaveField } from "./shape-waves-field";

export interface ShapeWavesProps extends BackdropCommonProps {
  /** 让形状拼出的字样, 默认空 (不叠文字). */
  readonly text?: string;
  /** 字样的字体族, 默认 system-ui, sans-serif. */
  readonly fontFamily?: string;
  /** 字重, 默认 500. */
  readonly fontWeight?: number;
  /** 字高占画布高的比例, 默认 0.6. */
  readonly textSize?: number;
  /** 形状: mixed / squares / circles / triangles, 默认 mixed. */
  readonly shapes?: ShapeMode;
  /** 格边长 (CSS 像素), 默认 10. */
  readonly cellSize?: number;
  /** 形状最大占格比例, 默认 0.75. */
  readonly dotSize?: number;
  /** 形状颜色 (token 名或 CSS 颜色), 默认 muted-foreground. */
  readonly color?: string;
  /** 波动高能处与入场波前染的颜色, 默认 foreground. */
  readonly hoverColor?: string;
  /** 底色 token; 不给时透明. */
  readonly backgroundColor?: string;
  /** 噪声尺度, 越大斑块越大, 默认 1. */
  readonly scale?: number;
  /** 对比度, 默认 1. */
  readonly contrast?: number;
  /** 亮度 (形状平均大小), 默认 0.4. */
  readonly brightness?: number;
  /** 噪声场平移速度 (格每秒), 默认 0. */
  readonly flow?: number;
  /** 平移方向 (度), 默认 0. */
  readonly direction?: number;
  /** 四周暗角宽度, 默认 0.25. */
  readonly fade?: number;
  /** 指针划过压出水花, 默认 true. */
  readonly interactive?: boolean;
  /** 水花半径 (CSS 像素), 默认 40. */
  readonly splashRadius?: number;
  /** 水花强度, 默认 0.4. */
  readonly splashStrength?: number;
  /** 高能处光晕强度, 默认 0.35. */
  readonly glow?: number;
  /** 入场波前由中心扫开, 默认 true. */
  readonly intro?: boolean;
  /** 入场时长 (秒), 默认 1.6. */
  readonly introDuration?: number;
  /** 改变它就重放入场, 默认 0. */
  readonly introKey?: number | string;
  /** 宿主的混合模式. */
  readonly mixBlendMode?: CSSProperties["mixBlendMode"];
}

/** 每帧的可变状态: 波场与打包缓冲, 文字遮罩, 入场起点. */
interface ShapeState {
  field: WaveField | null;
  images: ImageData[];
  flip: number;
  maskKey: string;
  mask: HTMLCanvasElement | null;
  introKey: number | string | null;
  introAt: number;
}

/**
 * 形波: 满屏小格各画一个方 / 圆 / 三角, 大小随缓慢流动的噪声场起伏, 四周收暗角; 指针划过在 JS 侧阻尼波场压出水花,
 * 波及处形状变大, 染向悬停色, 高能处带光晕; 可选文字遮罩让形状拼出字样; 入场是一道扭曲抖动的波前由中心扫开.
 * WebGL2 全屏片元; 减弱动效只画一帧, WebGL 不可用时铺渐变兜底.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-backgrounds-lines.md
 */
export function ShapeWaves(props: ShapeWavesProps): JSX.Element {
  const {
    text = "", fontFamily = "system-ui, sans-serif", fontWeight = 500, textSize = 0.6, shapes = "mixed", cellSize = 10, dotSize = 0.75,
    color = "muted-foreground", hoverColor = "foreground", backgroundColor, scale = 1, contrast = 1, brightness = 0.4, flow = 0, direction = 0,
    fade = 0.25, interactive = true, splashRadius = 40, splashStrength = 0.4, glow = 0.35, intro = true, introDuration = 1.6, introKey = 0,
    mixBlendMode, style, ...common
  } = props;
  const { options, rest, opacity, children } = splitCommon(common);
  const pointerOn = options.pointer !== false && interactive;
  const cell = Math.max(cellSize, 2);
  const state = useRef<ShapeState>({ field: null, images: [], flip: 0, maskKey: "", mask: null, introKey: null, introAt: 0 });

  const uniforms = (frame: BackdropFrame) => {
    const s = state.current;
    const width = frame.fit.width / Math.max(frame.fit.scale, 1e-3);
    const height = frame.fit.height / Math.max(frame.fit.scale, 1e-3);
    const [cols, rows] = fieldGrid(width, height, cell);
    let f = s.field;
    if (!f || f.cols !== cols || f.rows !== rows) {
      f = makeWaveField(cols, rows);
      s.field = f;
      s.images = typeof ImageData === "undefined" ? [] : [new ImageData(cols, rows), new ImageData(cols, rows)];
      s.images.forEach((img) => packWaves(f as WaveField, img.data));
    }
    const p = frame.pointer;
    const input = pointerOn && p.inside && !frame.still
      ? { x: (p.x * width) / cell, y: rows - (p.y * height) / cell, radius: splashRadius / cell, strength: splashStrength }
      : null;
    const wasSettled = f.settled;
    advanceField(f, frame.dt, input);
    if (!(wasSettled && f.settled)) {
      s.flip = 1 - s.flip;
      const out = s.images[s.flip];
      if (out) packWaves(f, out.data);
    }
    const maskKey = [text, fontFamily, fontWeight, textSize, Math.round(width), Math.round(height)].join("|");
    if (maskKey !== s.maskKey) {
      s.maskKey = maskKey;
      s.mask = createTextMask({ text, fontFamily, fontWeight, textSize }, width, height);
    }
    if (s.introKey !== introKey) {
      s.introKey = introKey;
      s.introAt = frame.elapsed;
    }
    const drift = flow * frame.time;
    return {
      u_ink: frame.colors[0] ?? LINE_GREY,
      u_hover: frame.colors[1] ?? LINE_GREY,
      u_bg: frame.colors[2] ?? LINE_GREY,
      u_opaque: backgroundColor !== undefined,
      u_has_text: s.mask !== null,
      u_grid: [cols, rows],
      u_cell: cell,
      u_mode: shapeModeOf(shapes),
      u_dot: Math.min(Math.max(dotSize, 0), 1),
      u_scale: scale,
      u_contrast: contrast,
      u_bright: brightness,
      u_flow: [Math.cos(direction * DEG) * drift, Math.sin(direction * DEG) * drift],
      u_fade: fade,
      u_glow: glow,
      u_intro: shapeIntro(frame.elapsed - s.introAt, introDuration, intro),
    };
  };

  const textures = () => ({ u_field: state.current.images[state.current.flip], u_mask: state.current.mask });
  const handle = useShaderBackdrop(
    { fragment: SHAPE_WAVES_FRAGMENT, uniforms, textures },
    { ...options, colors: [color, hoverColor, backgroundColor ?? color] },
  );
  const fallback = backgroundColor === undefined ? fallbackGradient([color, hoverColor]) : fallbackGradient([backgroundColor]);
  return (
    <BackdropShell handle={handle} fallback={fallback} opacity={opacity} style={{ mixBlendMode, ...style }} {...rest}>
      {children}
    </BackdropShell>
  );
}
