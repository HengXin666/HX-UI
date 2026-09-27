import { useEffect, useRef, useState, type JSX, type ComponentProps } from "react";
import * as LDRS from "ldrs/react";
import { cn } from "./utils";

/**
 * 加载指示器。44 种形态来自 UI Ball 的 LDRS (MIT), 支持三种播放模式。
 *
 * 为什么用 LDRS 而不是自己画:
 *   这些形态是逐帧手调出来的 —— 每个关键帧各自的插值曲线、每个元素各自的延迟。
 *   手写复刻只能得到"看起来像但没那个劲"的东西。
 *
 * 三种模式:
 *   fixed    固定一个形态。用在需要稳定预期的位置 (按钮内的加载态不该每两秒换个样子)。
 *   rotate   每隔 interval 毫秒随机换一个, 带交叉淡入淡出。
 *            用在整页加载、长任务等待 —— 停留时间长的地方, 换形态能让等待不那么难熬。
 *   random   每次挂载随机挑一个, 之后不再变。用在只出现一瞬间的地方 (按钮点击反馈)。
 *
 * 为什么默认用 fixed 而不是 rotate:
 *   加载指示器最不该出现的是"界面里同时有五种转圈"。rotate 只在明确传了才生效,
 *   避免每个使用方无意中把界面变成转盘。
 *
 * 「播几次换一个」是按时间实现的, 不是按轮数 ——
 * 44 个形态的周期从 0.5s 到 1.8s 不等, 按轮数换算会得到不一致的停留时长,
 * 看起来像随机抽搐。按时间则无论形态周期多长, 都稳定停留 interval 那么久。
 */

export type SpinVariant =
  | "quantum" | "waveform" | "dotPulse" | "superballs" | "helix" | "miyagi"
  | "trefoil" | "trio" | "bouncy" | "spiral" | "pulsar" | "ring2" | "ring"
  | "dotStream" | "ripples" | "hourglass" | "infinity" | "jelly" | "ping"
  | "pinwheel" | "metronome" | "newtonsCradle" | "grid" | "tailChase"
  | "lineWobble" | "chaoticOrbit" | "cardio" | "hatch" | "leapfrog"
  | "lineSpinner" | "momentum" | "orbit" | "square" | "squircle" | "reuleaux"
  | "treadmill" | "tailspin" | "wobble" | "zoomies" | "mirage" | "jellyTriangle";

/** 形态表。key 是公开的 variant 名, value 是 LDRS 的 React 组件。 */
const VARIANTS = {
  quantum: LDRS.Quantum, waveform: LDRS.Waveform, dotPulse: LDRS.DotPulse,
  superballs: LDRS.Superballs, helix: LDRS.Helix, miyagi: LDRS.Miyagi,
  trefoil: LDRS.Trefoil, trio: LDRS.Trio, bouncy: LDRS.Bouncy, spiral: LDRS.Spiral,
  pulsar: LDRS.Pulsar, ring2: LDRS.Ring2, ring: LDRS.Ring, dotStream: LDRS.DotStream,
  ripples: LDRS.Ripples, hourglass: LDRS.Hourglass, infinity: LDRS.Infinity,
  jelly: LDRS.Jelly, ping: LDRS.Ping, pinwheel: LDRS.Pinwheel,
  metronome: LDRS.Metronome, newtonsCradle: LDRS.NewtonsCradle, grid: LDRS.Grid,
  tailChase: LDRS.TailChase, lineWobble: LDRS.LineWobble,
  chaoticOrbit: LDRS.ChaoticOrbit, cardio: LDRS.Cardio, hatch: LDRS.Hatch,
  leapfrog: LDRS.Leapfrog, lineSpinner: LDRS.LineSpinner, momentum: LDRS.Momentum,
  orbit: LDRS.Orbit, square: LDRS.Square, squircle: LDRS.Squircle,
  reuleaux: LDRS.Reuleaux, treadmill: LDRS.Treadmill, tailspin: LDRS.Tailspin,
  wobble: LDRS.Wobble, zoomies: LDRS.Zoomies, mirage: LDRS.Mirage,
  jellyTriangle: LDRS.JellyTriangle,
} as const;

/** 全部可选形态。文档站的选择器用它, 避免白名单抄两遍。 */
export const SPIN_VARIANTS = Object.keys(VARIANTS) as SpinVariant[];

/**
 * 轮播用的推荐池。
 *
 * 44 个全放进来会出现「上一个还在慢慢转、下一个突然很激烈」的观感断裂。
 * 这十几个的节奏与体量接近, 换起来才顺。
 * 想要别的组合就传 rotatePool。
 */
export const DEFAULT_ROTATE_POOL: readonly SpinVariant[] = [
  "quantum", "helix", "trefoil", "trio", "superballs", "pulsar",
  "orbit", "ring2", "grid", "chaoticOrbit", "wobble", "pinwheel",
];

const SIZES = { sm: 16, md: 24, lg: 40, xl: 64 } as const;
export type SpinSize = keyof typeof SIZES | number;
export type SpinMode = "fixed" | "rotate" | "random";

export interface SpinProps extends Omit<ComponentProps<"span">, "color"> {
  size?: SpinSize;
  /** 固定播放时的形态。mode 为 rotate / random 时作为初始值。 */
  variant?: SpinVariant;
  /** 播放模式。默认 fixed —— 见文件顶部关于"界面里不该同时有五种转圈"的说明。 */
  mode?: SpinMode;
  /** 轮播间隔 (毫秒)。默认 2200 —— 短于 1.5s 会让人来不及看清形态, 长于 4s 又失去轮播的意义。 */
  interval?: number;
  /** 轮播候选池。默认用 DEFAULT_ROTATE_POOL。 */
  rotatePool?: readonly SpinVariant[];
  color?: string;
  speed?: number;
  label?: string;
}

/** 随机挑一个, 但排除 avoid —— 避免连续两次抽到同一个。 */
function pickRandom(pool: readonly SpinVariant[], avoid?: SpinVariant): SpinVariant {
  if (pool.length === 0) return "quantum";
  if (pool.length === 1) return pool[0];
  const candidates = avoid ? pool.filter((v) => v !== avoid) : pool;
  const list = candidates.length ? candidates : pool;
  return list[Math.floor(Math.random() * list.length)];
}

/** 一个形态实例。单独拆出来是为了给轮播的两层加不同的动画。 */
function Loader({ variant, size, color, speed }: {
  variant: SpinVariant;
  size: number;
  color: string;
  speed?: number;
}): JSX.Element {
  const C = VARIANTS[variant];
  return <C size={size} color={color} speed={speed} />;
}

function Spin({
  className,
  size = "md",
  variant = "quantum",
  mode = "fixed",
  interval = 2200,
  rotatePool = DEFAULT_ROTATE_POOL,
  color = "currentColor",
  speed,
  label,
  style,
  ...props
}: SpinProps): JSX.Element {
  const px = typeof size === "number" ? size : SIZES[size];

  /*
   * 当前与上一个形态。
   *
   * 用两层叠着做交叉淡入: 新形态一进来就在底下开始播, 旧形态在上面淡出。
   * 若直接替换, 新形态会从动画的第 0 帧开始 —— 看起来像"卡了一下又重新开始",
   * 叠着则两边的动画都在连续运行, 只有不透明度在变。
   */
  const [current, setCurrent] = useState<SpinVariant>(() =>
    mode === "random" ? pickRandom(rotatePool) : variant,
  );
  const [previous, setPrevious] = useState<SpinVariant | null>(null);
  // 用 ref 存"正在淡出的那一个什么时候该清掉", 避免把它写进依赖数组
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode !== "rotate") return;
    const id = setInterval(() => {
      setCurrent((prev) => {
        const next = pickRandom(rotatePool, prev);
        setPrevious(prev);
        if (clearTimer.current) clearTimeout(clearTimer.current);
        clearTimer.current = setTimeout(() => setPrevious(null), 420);
        return next;
      });
    }, interval);
    return () => {
      clearInterval(id);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, [mode, interval, rotatePool]);

  // 卸载时清掉淡出定时器, 否则会往已卸载的组件里 setState
  useEffect(() => () => { if (clearTimer.current) clearTimeout(clearTimer.current); }, []);

  const common = { size: px, color, speed };

  return (
    <span
      data-slot="spin"
      data-variant={current}
      data-mode={mode}
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("hx-spin-root inline-flex shrink-0 items-center justify-center", className)}
      style={style}
      {...props}
    >
      {/* 淡出层: 旧的形态。绝对定位铺满, 因此不占位、不影响根节点尺寸。 */}
      {previous ? (
        <span className="hx-spin-fade-out" aria-hidden="true">
          <Loader {...common} variant={previous} />
        </span>
      ) : null}
      {/*
        淡入层: 当前的形态。它是唯一参与布局的一层, 尺寸由它决定。
        key 必须是 current —— React 会复用同一个 DOM 节点, 而复用意味着
        CSS animation 不会重新触发 (它只在元素新插入时跑一次)。
        没有 key 时"淡入"这一半永远不生效, 看起来就是新图形瞬间出现。
      */}
      <span key={current} className="hx-spin-fade-in">
        <Loader {...common} variant={current} />
      </span>
    </span>
  );
}

export { Spin };
