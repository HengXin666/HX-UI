"use client";

import * as React from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export type DecryptEffect = "scramble" | "flip" | "fade";
export type DecryptTrigger = "view" | "hover" | "inViewHover" | "click" | "manual";
export type DecryptDirection = "start" | "end" | "center" | "random";

/** 每个字当前的状态, 传给 renderChar */
export interface DecryptChar {
  /** 真实的字 */
  char: string;
  /** 正在显示的字 (解密中是乱码) */
  shown: string;
  /** 已经解出来了 */
  revealed: boolean;
  index: number;
}

export interface DecryptedTextHandle {
  /** 从乱码开始解密一次 */
  play: () => void;
  /** 把字重新打乱 (不自动解密) */
  scramble: () => void;
  /** 直接显示原文 */
  reveal: () => void;
}

export interface DecryptedTextProps {
  /** 要解密的文字 */
  text: string;
  /** 渲染成哪个标签 */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  /** scramble: 原地换字; flip: 解出的字竖着翻进来; fade: 乱码发暗, 解出时变亮 */
  effect?: DecryptEffect;
  /** 什么时候开始解密. manual 只听 ref 的 play() */
  animateOn?: DecryptTrigger;
  /** animateOn 为 click 时: 只解一次, 还是来回切换 */
  clickMode?: "once" | "toggle";
  /** 每一步的间隔, 毫秒 */
  speed?: number;
  /** 非逐字模式下乱跳多少步才落定; 也决定 hoverRadius 下字乱跳多久 */
  maxIterations?: number;
  /** 一步解开一个字 */
  sequential?: boolean;
  /** 逐字模式从哪一头开始 */
  revealDirection?: DecryptDirection;
  /** 乱码只用原文里出现过的字 */
  useOriginalCharsOnly?: boolean;
  /** 乱码字符池 */
  characters?: string;
  /** 悬停时只打乱光标附近这么多像素内的字, 0 表示整段 */
  hoverRadius?: number;
  /** 解完停一会儿再打乱重来; 不在视口时暂停 */
  loop?: boolean;
  /** 循环时原文停留多久, 毫秒 */
  loopDelay?: number;
  /** 乱码时的颜色, 解出后过渡回文字色. 留空沿用文字色 */
  scrambleColor?: string;
  /** 加在外层标签上 */
  parentClassName?: string;
  /** 加在已解出的字上 */
  className?: string;
  /** 加在还是乱码的字上 */
  encryptedClassName?: string;
  style?: React.CSSProperties;
  /** 完全接管每个字怎么画 */
  renderChar?: (c: DecryptChar) => React.ReactNode;
  /** 每次解完调用 */
  onComplete?: () => void;
}

const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+";

function order(n: number, dir: DecryptDirection, seed: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  if (dir === "end") return idx.reverse();
  if (dir === "center") {
    const mid = (n - 1) / 2;
    return idx.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b);
  }
  if (dir === "random") {
    let s = seed || 1;
    for (let i = n - 1; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
  }
  return idx;
}

const isBlank = (c: string) => /\s/.test(c);

export const DecryptedText = React.forwardRef<DecryptedTextHandle, DecryptedTextProps>(function DecryptedText(
  {
    text,
    as: Tag = "span",
    effect = "scramble",
    animateOn = "hover",
    clickMode = "once",
    speed = 50,
    maxIterations = 10,
    sequential = false,
    revealDirection = "start",
    useOriginalCharsOnly = false,
    characters = POOL,
    hoverRadius = 0,
    loop = false,
    loopDelay = 2000,
    scrambleColor = "",
    parentClassName,
    className,
    encryptedClassName,
    style,
    renderChar,
    onComplete,
  },
  ref,
) {
  const reduce = useReducedMotion();
  const chars = React.useMemo(() => Array.from(text), [text]);
  const pool = React.useMemo(() => {
    const src = useOriginalCharsOnly ? Array.from(new Set(chars.filter((c) => !isBlank(c)))) : Array.from(characters);
    return src.length ? src : Array.from(POOL);
  }, [chars, characters, useOriginalCharsOnly]);
  const rand = React.useCallback(() => pool[Math.floor(Math.random() * pool.length)], [pool]);

  // view/click 起始就是乱码, 原文不会先闪一下
  const startsHidden = !reduce && (animateOn === "view" || animateOn === "inViewHover" || animateOn === "click");
  const [shown, setShown] = React.useState<string[]>(() => (startsHidden ? chars.map((c) => (isBlank(c) ? c : pool[(c.charCodeAt(0) * 7) % pool.length])) : chars));
  const [revealed, setRevealed] = React.useState<boolean[]>(() => chars.map((c) => !startsHidden || isBlank(c)));
  const [flipKey, setFlipKey] = React.useState<number[]>(() => chars.map(() => 0));

  const root = React.useRef<HTMLElement>(null);
  const spans = React.useRef<(HTMLSpanElement | null)[]>([]);
  const timer = React.useRef<number | null>(null);
  const loopTimer = React.useRef<number | null>(null);
  const heat = React.useRef<number[]>(chars.map(() => 0));
  const hoverTimer = React.useRef<number | null>(null);
  const done = React.useRef(!startsHidden);
  const toggled = React.useRef(false);
  const visible = React.useRef(true);
  const cb = React.useRef(onComplete);
  cb.current = onComplete;

  const stop = React.useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    if (loopTimer.current) window.clearTimeout(loopTimer.current);
    timer.current = loopTimer.current = null;
  }, []);

  const showAll = React.useCallback(() => {
    stop();
    setShown(chars);
    setRevealed(chars.map(() => true));
    done.current = true;
  }, [chars, stop]);

  const scrambleAll = React.useCallback(() => {
    stop();
    setShown(chars.map((c) => (isBlank(c) ? c : rand())));
    setRevealed(chars.map((c) => isBlank(c)));
    done.current = false;
  }, [chars, rand, stop]);

  const play = React.useCallback(() => {
    if (reduce) return showAll();
    stop();
    done.current = false;
    const seq = order(chars.length, revealDirection, chars.length * 31 + 7).filter((i) => !isBlank(chars[i]));
    const open = chars.map((c) => isBlank(c));
    let step = 0;
    const tick = () => {
      step += 1;
      const was = open.slice();
      if (sequential) {
        const i = seq[step - 1];
        if (i !== undefined) open[i] = true;
      } else {
        // 非逐字: 先整体乱跳, 后半程按方向逐步落定, 看起来是 "被破解" 而不是一下全对
        const settleFrom = Math.max(1, Math.floor(maxIterations * 0.5));
        if (step >= settleFrom) {
          const k = Math.ceil(((step - settleFrom + 1) / Math.max(1, maxIterations - settleFrom + 1)) * seq.length);
          for (let j = 0; j < Math.min(k, seq.length); j++) open[seq[j]] = true;
        }
      }
      const finished = open.every(Boolean);
      setShown(chars.map((c, i) => (open[i] ? c : rand())));
      setRevealed(open.slice());
      if (effect === "flip") setFlipKey((f) => f.map((v, i) => (open[i] && !was[i] ? v + 1 : v)));
      if (finished) {
        stop();
        done.current = true;
        cb.current?.();
        if (loop) {
          const again = () => {
            if (!visible.current) { loopTimer.current = window.setTimeout(again, 400); return; }
            scrambleAll();
            loopTimer.current = window.setTimeout(play, speed * 4);
          };
          loopTimer.current = window.setTimeout(again, loopDelay);
        }
      }
    };
    tick();
    timer.current = window.setInterval(tick, Math.max(16, speed));
  }, [chars, effect, loop, loopDelay, maxIterations, rand, reduce, revealDirection, scrambleAll, sequential, showAll, speed, stop]);

  React.useImperativeHandle(ref, () => ({ play, scramble: scrambleAll, reveal: showAll }), [play, scrambleAll, showAll]);

  // 文字变了: 按当前触发方式回到起点
  const first = React.useRef(true);
  React.useEffect(() => {
    heat.current = chars.map(() => 0);
    if (first.current) { first.current = false; return; }
    if (startsHidden) scrambleAll(); else showAll();
    toggled.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // 进入视口
  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      if (e.isIntersecting && (animateOn === "view" || animateOn === "inViewHover") && !done.current && !timer.current) play();
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [animateOn, play]);

  React.useEffect(() => () => { stop(); if (hoverTimer.current) window.clearInterval(hoverTimer.current); }, [stop]);
  React.useEffect(() => { if (reduce) showAll(); }, [reduce, showAll]);

  // 半径悬停: 光标附近的字按距离加热, 热度随步数衰减
  const runHeat = React.useCallback(() => {
    if (hoverTimer.current) return;
    hoverTimer.current = window.setInterval(() => {
      let any = false;
      const h = heat.current;
      setShown(chars.map((c, i) => {
        if (h[i] <= 0 || isBlank(c)) return c;
        h[i] -= 1; any = true;
        return Math.random() < Math.min(1, h[i] / maxIterations + 0.25) ? rand() : c;
      }));
      setRevealed(chars.map((_, i) => h[i] <= 0));
      if (!any && hoverTimer.current) { window.clearInterval(hoverTimer.current); hoverTimer.current = null; }
    }, Math.max(16, speed));
  }, [chars, maxIterations, rand, speed]);

  const hoverable = animateOn === "hover" || animateOn === "inViewHover";
  const onMove = (e: React.PointerEvent) => {
    if (reduce || !hoverable || hoverRadius <= 0 || timer.current) return;
    spans.current.forEach((s, i) => {
      if (!s || isBlank(chars[i])) return;
      const r = s.getBoundingClientRect();
      const d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY);
      if (d < hoverRadius) heat.current[i] = Math.max(heat.current[i], Math.round(maxIterations * (1 - d / hoverRadius)));
    });
    runHeat();
  };
  const onEnter = () => {
    if (reduce || !hoverable || hoverRadius > 0) return;
    if (animateOn === "inViewHover" && !done.current) return;
    play();
  };
  const onClick = () => {
    if (animateOn !== "click" || reduce) return;
    if (clickMode === "toggle" && done.current) { toggled.current = !toggled.current; scrambleAll(); return; }
    if (clickMode === "once" && done.current) return;
    play();
  };

  const Comp = Tag as React.ElementType;
  return (
    <Comp
      ref={root}
      className={cn("hx-decrypt", animateOn === "click" && "cursor-pointer", parentClassName)}
      style={{ ...style, ...(scrambleColor ? ({ "--hx-dt-scramble": scrambleColor } as React.CSSProperties) : null) }}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onClick={onClick}
      data-state={revealed.every(Boolean) ? "revealed" : "encrypted"}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {chars.map((c, i) => {
          const open = revealed[i];
          const info: DecryptChar = { char: c, shown: shown[i] ?? c, revealed: open, index: i };
          if (renderChar) return <React.Fragment key={i}>{renderChar(info)}</React.Fragment>;
          return (
            <span
              key={effect === "flip" ? `${i}-${flipKey[i]}` : i}
              ref={(el) => { spans.current[i] = el; }}
              data-encrypted={open ? undefined : ""}
              className={cn(
                "hx-dt-c",
                effect === "fade" && "hx-dt-fade",
                effect === "flip" && open && flipKey[i] > 0 && "hx-dt-flip",
                open ? className : encryptedClassName,
              )}
            >
              {info.shown}
            </span>
          );
        })}
      </span>
    </Comp>
  );
});
