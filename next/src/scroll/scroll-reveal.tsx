import * as React from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

export type RevealEffect = "fade" | "rise" | "flip" | "scale";

export interface ScrollRevealProps {
  /** 要揭示的文字. 纯文字按词 / 字 / 行拆开, 其它内容整块揭示 */
  children: React.ReactNode;
  /** 在哪个元素里滚动; 不给就是整页 */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /** 每一段揭示途中先亮成这个颜色, 再落回文字色. 留空不高亮 */
  highlightColor?: string;
  /** scrub: 跟着滚动位置走; enter: 滚进视口播一次 */
  mode?: "scrub" | "enter";
  /** 每一步揭示多大一块. lines 按渲染出来的行分组, 尺寸变化时重新分 */
  splitBy?: "words" | "chars" | "lines";
  /** fade 原地变亮; rise 从自己的基线下面升上来; flip 从平躺立起来; scale 从小弹大 */
  effect?: RevealEffect;
  /** 相邻两段的错开程度. 越大越是一段一段地出, 越小越像一道柔和的波. enter 模式下是秒 */
  stagger?: number;
  /** enter 模式每一段的时长, 秒 */
  duration?: number;
  /** 揭示追上滚动位置要多少秒, 0 直接绑定滚动 */
  smoothing?: number;
  /** 一开始失焦, 揭示时变清晰 */
  enableBlur?: boolean;
  /** 初始模糊, px */
  blurStrength?: number;
  /** 揭示前的透明度, 0-1 */
  baseOpacity?: number;
  /** 整块揭示前的倾斜, 度. 0 保持水平 */
  baseRotation?: number;
  /** 每一段从自己位置下方多少 px 升上来 */
  baseOffset?: number;
  /** 元素顶部到视口什么位置开始揭示, 0 顶 1 底 */
  start?: number;
  /** 元素底部到视口什么位置全部揭示完, 0 顶 1 底. 页面最后的文字也能揭完 */
  end?: number;
  /** 渲染成哪个标签 */
  as?: "h1" | "h2" | "h3" | "p" | "div";
  /** 外层标签的 class (字号、行高写这里) */
  containerClassName?: string;
  /** 文字层的 class */
  textClassName?: string;
  /** 每一段的 class */
  pieceClassName?: string;
  style?: React.CSSProperties;
  /** 揭示进度变化时调用, 0-1 */
  onProgress?: (p: number) => void;
}

const CJK = /[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/;

function split(text: string, by: "words" | "chars" | "lines") {
  if (by === "chars") return Array.from(text);
  // 中文没有空格: 按字拆, 标点跟在前一个字后面
  const out: string[] = [];
  for (const tok of text.split(/(\s+)/)) {
    if (!tok.trim()) continue;
    if (CJK.test(tok)) {
      for (const ch of Array.from(tok)) {
        if (/[，。、；：！？）」』》,.!?;:)]/.test(ch) && out.length) out[out.length - 1] += ch;
        else out.push(ch);
      }
    } else out.push(tok);
  }
  return out;
}

export function ScrollReveal({
  children,
  scrollContainerRef,
  highlightColor = "",
  mode = "scrub",
  splitBy = "words",
  effect = "fade",
  stagger = 0.05,
  duration = 0.8,
  smoothing = 0,
  enableBlur = true,
  blurStrength = 4,
  baseOpacity = 0.1,
  baseRotation = 3,
  baseOffset = 0,
  start = 1,
  end = 1,
  as: Tag = "h2",
  containerClassName,
  textClassName,
  pieceClassName,
  style,
  onProgress,
}: ScrollRevealProps) {
  const reduce = useReducedMotion();
  const root = React.useRef<HTMLElement>(null);
  const pieces = React.useRef<(HTMLSpanElement | null)[]>([]);
  const text = typeof children === "string" || typeof children === "number" ? String(children) : null;
  const parts = React.useMemo(() => (text == null ? null : split(text, splitBy)), [text, splitBy]);
  const [lineOf, setLineOf] = React.useState<number[] | null>(null);
  const [entered, setEntered] = React.useState(false);
  const cb = React.useRef(onProgress);
  cb.current = onProgress;

  // 按行分组: 量每个词的 offsetTop
  React.useLayoutEffect(() => {
    if (splitBy !== "lines" || !parts) { setLineOf(null); return; }
    const measure = () => {
      let line = -1, last = -Infinity;
      setLineOf(pieces.current.slice(0, parts.length).map((el) => {
        const t = el?.offsetTop ?? 0;
        if (t > last + 2) { line += 1; last = t; }
        return line;
      }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (root.current) ro.observe(root.current);
    return () => ro.disconnect();
  }, [parts, splitBy]);

  const groupOf = (i: number) => (lineOf ? lineOf[i] : i);
  const groups = parts ? (lineOf ? (lineOf[lineOf.length - 1] ?? 0) + 1 : parts.length) : 1;

  const paint = React.useCallback((P: number) => {
    const el = root.current;
    if (!el) return;
    const n = Math.max(1, groups);
    const len = Math.min(1, Math.max(1 / n, (1 / n) * (0.2 / Math.max(0.005, stagger))));
    el.style.setProperty("--hx-sr-rot", `${baseRotation * (1 - Math.min(1, P * 1.25))}deg`);
    const list = pieces.current;
    const count = parts ? parts.length : 1;
    for (let i = 0; i < count; i++) {
      const s = list[i];
      if (!s) continue;
      const g = parts ? groupOf(i) : 0;
      const st = n === 1 ? 0 : (g / (n - 1)) * (1 - len);
      const v = Math.min(1, Math.max(0, (P - st) / len));
      s.style.setProperty("--v", v.toFixed(4));
      s.dataset.state = v >= 1 ? "on" : v > 0 ? "mid" : "off";
    }
    cb.current?.(P);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, stagger, baseRotation, parts, lineOf]);

  // scrub
  React.useEffect(() => {
    if (mode !== "scrub") return;
    if (reduce) { paint(1); return; }
    const scroller = scrollContainerRef?.current ?? null;
    let raf = 0, shown = -1, target = 0, last = 0;
    const read = () => {
      const el = root.current;
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      const box = scroller ? scroller.getBoundingClientRect() : { top: 0, height: window.innerHeight };
      const top = r.top - box.top, vh = box.height;
      const a = vh * start, b = vh * end - r.height;
      return Math.min(1, Math.max(0, (a - top) / Math.max(1, a - b)));
    };
    const tick = (now: number) => {
      const dt = last ? (now - last) / 1000 : 0.016;
      last = now;
      target = read();
      shown = shown < 0 || smoothing <= 0 ? target : shown + (target - shown) * Math.min(1, dt / Math.max(0.016, smoothing));
      paint(shown);
      raf = Math.abs(target - shown) > 0.0005 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } };
    const src: HTMLElement | Window = scroller ?? window;
    src.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    kick();
    return () => { cancelAnimationFrame(raf); src.removeEventListener("scroll", kick); window.removeEventListener("resize", kick); };
  }, [mode, reduce, scrollContainerRef, smoothing, start, end, paint]);

  // enter
  React.useEffect(() => {
    if (mode !== "enter") return;
    const el = root.current;
    if (!el) return;
    if (reduce) { setEntered(true); return; }
    setEntered(false);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setEntered(true); io.disconnect(); } }, { root: scrollContainerRef?.current ?? null, threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [mode, reduce, scrollContainerRef, text]);

  const enter = mode === "enter";
  const vars = {
    "--hx-sr-base": baseOpacity,
    "--hx-sr-blur": `${enableBlur ? blurStrength : 0}px`,
    "--hx-sr-off": `${baseOffset}px`,
    "--hx-sr-hl": highlightColor || "currentColor",
    "--hx-sr-dur": `${duration}s`,
    ...(mode === "enter" ? { "--hx-sr-rot": `${entered ? 0 : baseRotation}deg` } : null),
  } as React.CSSProperties;
  const Comp = Tag as React.ElementType;
  const piece = (content: React.ReactNode, i: number) => (
    <span
      key={i}
      ref={(el) => { pieces.current[i] = el; }}
      className={cn("hx-sr-p", `hx-sr-${effect}`, highlightColor && "hx-sr-hl", pieceClassName)}
      data-state={enter ? (entered ? "on" : "off") : undefined}
      style={enter ? ({ "--v": entered ? 1 : 0, transitionDelay: `${(parts ? groupOf(i) : 0) * stagger}s` } as React.CSSProperties) : undefined}
    >
      {effect === "rise" ? <span className="hx-sr-in">{content}</span> : content}
    </span>
  );
  return (
    <Comp ref={root} className={cn("hx-sr", enter && "hx-sr-enter", containerClassName)} style={{ ...vars, ...style }} data-mode={mode}>
      {text != null && <span className="sr-only">{text}</span>}
      <span className={cn("hx-sr-text", textClassName)} aria-hidden={text != null ? true : undefined}>
        {parts
          ? parts.map((w, i) => {
              const sep = splitBy !== "chars" && /\s$/.test(w) === false && i < parts.length - 1 && !CJK.test(w.slice(-1)) ? " " : "";
              return <React.Fragment key={i}>{piece(w.trim() || w, i)}{sep}</React.Fragment>;
            })
          : piece(children, 0)}
      </span>
    </Comp>
  );
}
