import * as React from "react";
import { m, useInView, type TargetAndTransition, type Transition } from "motion/react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export type SplitEffect = "rise" | "fade" | "blur" | "flip" | "pop" | "skew" | "wave";
export type SplitFrom = "start" | "center" | "end" | "random";
export type SplitEase = "out" | "inOut" | "spring";
export type SplitHover = "none" | "lift" | "brand";

export interface SplitTextProps {
  /** 要拆分的文字 */
  text: string;
  /** 渲染成哪个标签 */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  /** 按字还是按词拆. 中日韩文字按词拆时每个字仍是一段 */
  split?: "chars" | "words";
  /** 每一段怎么登场 */
  effect?: SplitEffect;
  /** mount: 挂载即播; inView: 滚到视口里才播 */
  trigger?: "mount" | "inView";
  /** 相邻两段的间隔, 秒 */
  stagger?: number;
  /** 每一段的时长, 秒 */
  duration?: number;
  /** 整体延迟, 秒 */
  delay?: number;
  /** 缓动. spring 带一点回弹 */
  ease?: SplitEase;
  /** 从哪一头开始 */
  from?: SplitFrom;
  /** 鼠标悬停单个字时的反馈 */
  hover?: SplitHover;
  /** 播完停一会儿再重播 */
  loop?: boolean;
  /** 循环时两次之间的停顿, 秒 */
  loopDelay?: number;
  className?: string;
  /** 每次播完调用 */
  onComplete?: () => void;
}

const HIDDEN: Record<SplitEffect, TargetAndTransition> = {
  rise: { opacity: 0, y: "0.7em" },
  fade: { opacity: 0 },
  blur: { opacity: 0, y: "0.25em", filter: "blur(12px)" },
  flip: { opacity: 0, rotateX: -95, y: "0.2em" },
  pop: { opacity: 0, scale: 0.3 },
  skew: { opacity: 0, x: "-0.4em", skewX: -14 },
  wave: { opacity: 0, y: "0.9em", rotate: 10 },
};

const SHOWN: Record<SplitEffect, TargetAndTransition> = {
  rise: { opacity: 1, y: 0 },
  fade: { opacity: 1 },
  blur: { opacity: 1, y: 0, filter: "blur(0px)" },
  flip: { opacity: 1, rotateX: 0, y: 0 },
  pop: { opacity: 1, scale: 1 },
  skew: { opacity: 1, x: 0, skewX: 0 },
  wave: { opacity: 1, y: 0, rotate: 0 },
};

const HOVER: Record<SplitHover, TargetAndTransition | undefined> = {
  none: undefined,
  lift: { y: "-0.18em", transition: { type: "spring", stiffness: 500, damping: 18 } },
  brand: { color: "var(--brand)", transition: { duration: 0.15 } },
};

const CJK = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\uff00-\uffef\u3000-\u303f]/;
/** 不能出现在行首的标点: 粘在前一个字后面, 不会单独掉到下一行 */
const NO_START = /^[，。、！？：；）」』】》〉,.!?:;)\]}…]$/;

type Unit = { text: string; space: boolean };

/** 字素级拆分, emoji 与组合字符不会被拆坏 */
function graphemes(s: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s), (x) => x.segment);
  }
  return Array.from(s);
}

/** 词: 空白分隔; 词里含中日韩文字时, 那些字各自成词 */
function words(text: string): Unit[] {
  const out: Unit[] = [];
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) { out.push({ text: part, space: true }); continue; }
    let buf = "";
    for (const g of graphemes(part)) {
      if (NO_START.test(g) && !buf && out.length && !out[out.length - 1].space) {
        out[out.length - 1].text += g;
      } else if (CJK.test(g)) {
        if (buf) out.push({ text: buf, space: false });
        out.push({ text: g, space: false });
        buf = "";
      } else buf += g;
    }
    if (buf) out.push({ text: buf, space: false });
  }
  return out;
}

/** 可复现的伪随机顺序, 同一段文字每次一样, 预渲染与客户端一致 */
function shuffledRanks(n: number, seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const rank = new Array<number>(n);
  idx.forEach((v, r) => (rank[v] = r));
  return rank;
}

function order(i: number, n: number, from: SplitFrom, ranks: number[] | null): number {
  if (from === "end") return n - 1 - i;
  if (from === "center") return Math.abs(i - (n - 1) / 2);
  if (from === "random" && ranks) return ranks[i];
  return i;
}

/**
 * 文字拆成字或词, 逐段登场.
 * 读屏读整句 (sr-only 原文), 动画层 aria-hidden.
 * 系统开了减弱动效时直接显示终态.
 */
export function SplitText({
  text,
  as = "p",
  split = "chars",
  effect = "rise",
  trigger = "inView",
  stagger = 0.03,
  duration = 0.6,
  delay = 0,
  ease = "out",
  from = "start",
  hover = "none",
  loop = false,
  loopDelay = 1.6,
  className,
  onComplete,
}: SplitTextProps) {
  const Tag = as;
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [round, setRound] = React.useState(0);
  const go = trigger === "mount" || inView;

  // 词组: 按字拆时, 一个词里的字包在一个不换行的盒子里, 不会从词中间断行
  const groups = React.useMemo(() => words(text), [text]);
  const pieces = React.useMemo(
    () => (split === "words" ? groups.filter((g) => !g.space).length : groups.reduce((s, g) => s + (g.space ? 0 : graphemes(g.text).length), 0)),
    [groups, split],
  );
  const ranks = React.useMemo(() => (from === "random" ? shuffledRanks(pieces, text) : null), [from, pieces, text]);
  const maxOrder = React.useMemo(() => {
    let mx = 0;
    for (let i = 0; i < pieces; i++) mx = Math.max(mx, order(i, pieces, from, ranks));
    return mx;
  }, [pieces, from, ranks]);

  const done = React.useRef(onComplete);
  done.current = onComplete;
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const finish = React.useCallback(() => {
    done.current?.();
    if (loop) timer.current = window.setTimeout(() => setRound((r) => r + 1), loopDelay * 1000);
  }, [loop, loopDelay]);

  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  const base: Transition =
    ease === "spring"
      ? { type: "spring", bounce: 0.4, duration: duration * 1.4 }
      : { duration, ease: ease === "inOut" ? [0.65, 0, 0.35, 1] : [0.22, 1, 0.36, 1] };
  const needs3d = effect === "flip";

  let k = 0;
  const piece = (content: string, key: string) => {
    const i = k++;
    const o = order(i, pieces, from, ranks);
    const last = o === maxOrder;
    return (
      <m.span
        key={key}
        className="inline-block whitespace-pre will-change-transform"
        style={needs3d ? { transformPerspective: 600, transformOrigin: "50% 100%" } : undefined}
        initial={HIDDEN[effect]}
        animate={go ? { ...SHOWN[effect], transition: { ...base, delay: delay + o * stagger } } : HIDDEN[effect]}
        whileHover={HOVER[hover]}
        onAnimationComplete={last && go ? finish : undefined}
      >
        {content}
      </m.span>
    );
  };

  return (
    <Tag ref={ref as React.Ref<never>} className={cn(className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden key={round}>
        {groups.map((g, gi) =>
          g.space ? (
            <React.Fragment key={gi}>{g.text}</React.Fragment>
          ) : split === "words" ? (
            piece(g.text, `w${gi}`)
          ) : (
            <span key={gi} className="inline-block whitespace-nowrap">
              {graphemes(g.text).map((c, ci) => piece(c, `c${gi}-${ci}`))}
            </span>
          ),
        )}
      </span>
    </Tag>
  );
}
