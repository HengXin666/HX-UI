"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import { isFunction } from "../../constants/hooks";
import { TOUR_ACTIVE, TOUR_CLASS as C, TOUR_LAND, TOUR_SHOT, TOUR_TEXT } from "../../constants/sections-saas";

/** 导览的一站: 指向真实界面里 data-tour 等于 target 的元素. */
export interface TourStop {
  target: string;
  title: string;
  body?: string;
}

export interface ProductTourProps {
  stops: TourStop[];
  /** 被讲解的真实界面 (活组件), 里面用 data-tour 标出各站目标. */
  children: React.ReactNode;
  /** 可见时自动播放; 默认开, 减弱动效时始终关. */
  autoplay?: boolean;
  /** 每站停留毫秒数, 不含飞行. */
  holdMs?: number;
  index?: number;
  onIndexChange?: (index: number) => void;
  texts?: Partial<typeof TOUR_TEXT>;
  id?: string;
}

interface Point {
  x: number;
  y: number;
}

const REDUCED = "(prefers-reduced-motion: reduce)";

function prefersReduced(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.(REDUCED).matches === true;
}

const translate = (p: Point): string => `translate(${p.x}px, ${p.y}px)`;

/** 弧线中点: 两点中点再往上抬, 抬高按距离取比例并封顶; 竖直飞行时也往上抬, 读起来像手腕抬起再落下. */
export function arcMidpoint(from: Point, to: Point): Point {
  const lift = Math.min(Math.hypot(to.x - from.x, to.y - from.y) * TOUR_SHOT.arcRatio, TOUR_SHOT.arcMaxPx);
  return { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - lift };
}

/** 目标在舞台坐标系里的落点. */
function landingOf(stage: HTMLElement, target: HTMLElement): Point {
  const s = stage.getBoundingClientRect();
  const r = target.getBoundingClientRect();
  return { x: r.left - s.left + r.width * TOUR_LAND.x, y: r.top - s.top + r.height * TOUR_LAND.y };
}

/** 舞台是否在视口里; 没有 IntersectionObserver 时当作可见. */
function useInView(ref: React.RefObject<HTMLElement | null>): boolean {
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!isFunction(globalThis.IntersectionObserver)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

/**
 * 产品导览 (cursor-flyover 网页版): 光标在真实界面上沿弧线飞到下一处, 落定后目标描边, 标注淡入.
 * 只动光标与标注的 transform / opacity, 被讲解的界面原样可用; 悬停或聚焦时暂停, 有播放 / 暂停键 (WCAG 2.2.2).
 * 减弱动效时不飞, 光标直接落位, 也不自动播放. 每到一站, 读屏念一句 "第 n 步: 标题. 说明".
 * .agents/notes/implemented/architecture/2026-11-20-saas-benchmark.md
 */
export function ProductTour({ stops, children, autoplay = true, holdMs = TOUR_SHOT.holdMs, index: controlled, onIndexChange, texts, id }: ProductTourProps): React.JSX.Element {
  const t = { ...TOUR_TEXT, ...texts };
  const stageRef = React.useRef<HTMLDivElement>(null);
  const screenRef = React.useRef<HTMLDivElement>(null);
  const cursorRef = React.useRef<HTMLSpanElement>(null);
  const noteRef = React.useRef<HTMLSpanElement>(null);
  const lastPoint = React.useRef<Point | null>(null);
  const [own, setOwn] = React.useState(0);
  const [landed, setLanded] = React.useState(false);
  const [playing, setPlaying] = React.useState(autoplay);
  const [held, setHeld] = React.useState(false);
  const inView = useInView(stageRef);
  const count = stops.length;
  const index = Math.min(controlled ?? own, Math.max(count - 1, 0));
  const stop = stops[index];

  const go = React.useCallback(
    (next: number) => {
      const wrapped = ((next % count) + count) % count;
      setOwn(wrapped);
      onIndexChange?.(wrapped);
    },
    [count, onIndexChange],
  );

  React.useEffect(() => {
    if (prefersReduced()) setPlaying(false);
  }, []);

  /** 放标注: 默认在落点右下, 右侧放不下时翻到左侧. */
  const placeNote = React.useCallback((p: Point) => {
    const note = noteRef.current;
    const stage = stageRef.current;
    if (!note || !stage) return;
    const gap = TOUR_SHOT.noteGapPx;
    const w = note.offsetWidth;
    const x = p.x + gap + w > stage.clientWidth ? Math.max(p.x - gap - w, 0) : p.x + gap;
    note.style.transform = translate({ x, y: p.y + gap });
  }, []);

  // 每站: 标出目标, 光标飞过去, 落定后出标注.
  React.useEffect(() => {
    const stage = stageRef.current;
    const cursor = cursorRef.current;
    const target = stop ? screenRef.current?.querySelector<HTMLElement>(`[data-tour="${stop.target}"]`) : null;
    if (!stage || !cursor || !target) return;
    target.setAttribute(TOUR_ACTIVE.attr, TOUR_ACTIVE.on);
    const to = landingOf(stage, target);
    const from = lastPoint.current;
    lastPoint.current = to;
    setLanded(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const land = (): void => {
      cursor.style.transform = translate(to);
      placeNote(to);
      setLanded(true);
    };
    if (!from || prefersReduced() || !isFunction(cursor.animate)) {
      land();
    } else {
      cursor.animate([{ transform: translate(from) }, { transform: translate(arcMidpoint(from, to)) }, { transform: translate(to) }], {
        duration: TOUR_SHOT.flyMs,
        easing: TOUR_SHOT.easing,
        fill: "forwards",
      });
      timer = setTimeout(land, TOUR_SHOT.flyMs);
    }
    return () => {
      if (timer) clearTimeout(timer);
      target.removeAttribute(TOUR_ACTIVE.attr);
    };
  }, [stop, placeNote]);

  // 舞台尺寸变化 (换行, 换断点) 时直接重新落位, 不飞.
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !isFunction(globalThis.ResizeObserver)) return;
    const ro = new ResizeObserver(() => {
      const target = stop ? screenRef.current?.querySelector<HTMLElement>(`[data-tour="${stop.target}"]`) : null;
      if (!target || !cursorRef.current) return;
      const p = landingOf(stage, target);
      lastPoint.current = p;
      cursorRef.current.style.transform = translate(p);
      placeNote(p);
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, [stop, placeNote]);

  // 自动播放: 播放中, 可见, 无悬停无焦点, 已落定.
  React.useEffect(() => {
    if (!playing || !inView || held || !landed || count < 2) return;
    const timer = setTimeout(() => go(index + 1), holdMs);
    return () => clearTimeout(timer);
  }, [playing, inView, held, landed, count, index, holdMs, go]);

  const onStepKey = (e: React.KeyboardEvent): void => {
    const map: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: count - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    go(map[e.key]);
  };

  return (
    <section id={id} className={C.root} aria-label={t.region} data-slot="product-tour" data-index={index}>
      <div
        ref={stageRef}
        className={C.stage}
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={() => setHeld(false)}
      >
        <div ref={screenRef} className={C.screen}>
          {children}
        </div>
        <span ref={cursorRef} className={C.cursor} aria-hidden data-slot="tour-cursor">
          <svg viewBox="0 0 20 20" fill="currentColor" stroke="var(--background)" strokeWidth="1.2">
            <path d="M3 2l13 7-6 1.6L7.4 17z" />
          </svg>
        </span>
        <span ref={noteRef} className={C.note} aria-hidden data-shown={landed} data-slot="tour-note">
          <span className={C.noteTitle}>{stop?.title}</span>
          {stop?.body ? <span className={C.noteBody}>{stop.body}</span> : null}
        </span>
      </div>
      <div className={C.bar}>
        <div role="tablist" aria-label={t.steps} className={C.steps} onKeyDown={onStepKey}>
          {stops.map((s, i) => (
            <button key={s.target} type={BUTTON_TYPE} role="tab" aria-selected={i === index} tabIndex={i === index ? 0 : -1} className={C.step} onClick={() => go(i)}>
              {s.title}
            </button>
          ))}
        </div>
        <button type={BUTTON_TYPE} className={C.control} onClick={() => go(index - 1)}>
          {t.prev}
        </button>
        <button type={BUTTON_TYPE} className={C.control} onClick={() => go(index + 1)}>
          {t.next}
        </button>
        <button type={BUTTON_TYPE} className={C.control} aria-pressed={playing} onClick={() => setPlaying((p) => !p)} data-slot="tour-play">
          {playing ? t.pause : t.play}
        </button>
      </div>
      <p className={C.live} aria-live="polite" data-slot="tour-live">
        {stop ? `${t.step} ${index + 1} ${t.stepUnit}: ${stop.title}${stop.body ? `. ${stop.body}` : ""}` : null}
      </p>
    </section>
  );
}
