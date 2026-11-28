"use client";
/**
 * useUnfold: 给一列按顺序排的行加 "从上到下展开 / 收起" 动效. Tree 用它; 任何 "一段行插进来 / 拿走" 的列表都能用.
 *
 *   const { entries, ref } = useUnfold(rows, (r) => r.id, "slide");
 *   entries.map(({ key, item, exiting }) => <div key={key} ref={ref(key)} inert={exiting} aria-hidden={exiting || undefined}>...</div>)
 *
 * 收起时离开的行先留在 entries 里 (exiting = true) 播完动画再移除; 调用方要让它们不可聚焦, 不被读屏读到 (inert + aria-hidden).
 * 行可以分散在不同的父元素里 (嵌套 DOM 也行), 只要 entries 的顺序就是显示顺序.
 * 实现: 改动提交前在渲染阶段量一次每行看到的位置, 提交后量新布局, 交给 planUnfold (unfold.ts) 算出逐行关键帧,
 * 再用 Web Animations 播 (只动 transform / opacity). 动画中途再改动时从当前看到的状态接着走, 不跳.
 * 首次挂载不播; 减弱动效或 type="none" 时没有动画, 离开的行立刻移除.
 */
import * as React from "react";
import { useReducedMotion } from "@/motion/use-reduced-motion";
import { mergeUnfoldKeys, planUnfold, resolveUnfold, sampleUnfold, type UnfoldItem, type UnfoldOptions, type UnfoldTrack, type UnfoldType, type UnfoldView } from "@/motion/unfold";

export interface UnfoldEntry<T> {
  key: string;
  item: T;
  /** 正在收起离开: 渲染成 inert + aria-hidden, 动画播完自动移除 */
  exiting: boolean;
}

export interface UnfoldResult<T> {
  /** 要渲染的行: items 加上正在离开的行, 按显示顺序 */
  entries: UnfoldEntry<T>[];
  /** 每行的 ref (同一个 key 返回同一个函数) */
  ref: (key: string) => (el: HTMLElement | null) => void;
}

const SEP = "\u0001";
const CLIPPING = /(auto|scroll|hidden|clip)/;

/** 可见区域: 视口与所有会裁剪的祖先的交集 */
function viewOf(el: HTMLElement): UnfoldView {
  let top = 0;
  let bottom = window.innerHeight;
  for (let p = el.parentElement; p; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (!CLIPPING.test(cs.overflowY)) continue;
    const r = p.getBoundingClientRect();
    top = Math.max(top, r.top);
    bottom = Math.min(bottom, r.bottom);
  }
  return { top, bottom };
}

interface Running {
  anim: Animation;
  track: UnfoldTrack;
}

export function useUnfold<T>(items: readonly T[], getKey: (item: T) => string, options?: UnfoldType | UnfoldOptions | null): UnfoldResult<T> {
  const reduce = useReducedMotion();
  const optionsKey = typeof options === "object" && options ? JSON.stringify(options) : String(options ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const o = React.useMemo(() => resolveUnfold(options), [optionsKey]);
  const animate = !reduce && o.type !== "none";

  const els = React.useRef(new Map<string, HTMLElement>());
  const refs = React.useRef(new Map<string, (el: HTMLElement | null) => void>());
  const running = React.useRef(new Map<string, Running>());
  const committed = React.useRef<{ keys: string[]; items: Map<string, T> }>({ keys: [], items: new Map() });
  const mounted = React.useRef(false);
  /** 播完的离开行: 下次渲染丢掉 */
  const done = React.useRef(new Set<string>());
  const snapshot = React.useRef<{ sig: string; at: Map<string, { top: number; opacity: number }> } | null>(null);
  const timer = React.useRef(0);
  const [, bump] = React.useReducer((x: number) => x + 1, 0);

  const nextKeys = items.map(getKey);
  const merged = animate && mounted.current ? mergeUnfoldKeys(committed.current.keys, nextKeys, (k) => !done.current.has(k)) : nextKeys;
  const sig = merged.join(SEP);

  // 渲染阶段 (DOM 还是改动前): 量每行现在看到的位置和不透明度
  if (animate && mounted.current && sig !== committed.current.keys.join(SEP) && snapshot.current?.sig !== sig) {
    const at = new Map<string, { top: number; opacity: number }>();
    for (const k of committed.current.keys) {
      const el = els.current.get(k);
      if (!el) continue;
      const run = running.current.get(k);
      const opacity = run ? sampleUnfold(run.track, Number(run.anim.currentTime ?? 0)).opacity : 1;
      at.set(k, { top: el.getBoundingClientRect().top, opacity });
    }
    snapshot.current = { sig, at };
  }

  const current = new Map<string, T>();
  items.forEach((it, i) => current.set(nextKeys[i], it));
  const entries: UnfoldEntry<T>[] = merged.map((key) =>
    current.has(key) ? { key, item: current.get(key) as T, exiting: false } : { key, item: committed.current.items.get(key) as T, exiting: true },
  );

  const stopAll = React.useCallback(() => {
    for (const { anim } of running.current.values()) anim.cancel();
    running.current.clear();
    window.clearTimeout(timer.current);
  }, []);

  React.useLayoutEffect(() => {
    committed.current.items = new Map(entries.map((e) => [e.key, e.item]));
    // 播完的离开行已在这次渲染里丢掉
    done.current.clear();
  });

  React.useLayoutEffect(() => {
    committed.current.keys = merged;
    const live = new Set(merged);
    for (const k of refs.current.keys()) if (!live.has(k)) refs.current.delete(k);
    const first = !mounted.current;
    mounted.current = true;
    const snap = snapshot.current;
    snapshot.current = null;
    if (!animate) {
      stopAll();
      return;
    }
    if (first || !snap || snap.sig !== sig) return;

    // 先撤掉进行中的动画, 再量新布局 (不含 transform) 和元素自己的不透明度
    for (const { anim } of running.current.values()) anim.cancel();
    running.current.clear();
    window.clearTimeout(timer.current);
    const inNext = new Set(nextKeys);
    const list: UnfoldItem[] = [];
    const natural = new Map<string, number>();
    for (const k of merged) {
      const el = els.current.get(k);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const op = Number.parseFloat(getComputedStyle(el).opacity);
      natural.set(k, Number.isFinite(op) ? op : 1);
      const before = snap.at.get(k);
      list.push({ key: k, phase: !inNext.has(k) ? "exit" : before ? "stay" : "enter", top: r.top, height: r.height, y: before ? before.top - r.top : undefined, opacity: before?.opacity });
    }
    const exits = merged.filter((k) => !inNext.has(k));
    const first0 = list[0] ? els.current.get(list[0].key) : undefined;
    const plan = first0 ? planUnfold(list, viewOf(first0), o) : { end: 0, tracks: new Map<string, UnfoldTrack>() };
    for (const [k, track] of plan.tracks) {
      const el = els.current.get(k);
      if (!el) continue;
      const nat = natural.get(k) ?? 1;
      const frames: Keyframe[] = track.frames.map((f) => (track.fades ? { offset: f.offset, transform: `translateY(${f.y}px)`, opacity: f.opacity * nat } : { offset: f.offset, transform: `translateY(${f.y}px)` }));
      const leaving = !inNext.has(k);
      const anim = el.animate(frames, { duration: track.duration, easing: "linear", fill: leaving ? "forwards" : "none" });
      const run = { anim, track };
      running.current.set(k, run);
      if (!leaving) anim.onfinish = () => running.current.get(k) === run && running.current.delete(k);
    }
    if (exits.length) {
      timer.current = window.setTimeout(() => {
        for (const k of exits) done.current.add(k);
        bump();
      }, plan.end);
    }
    // 只在显示的行变了时规划; 其余依赖都在 sig 里
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, animate]);

  React.useEffect(() => stopAll, [stopAll]);

  const ref = React.useCallback((key: string) => {
    let fn = refs.current.get(key);
    if (!fn) {
      fn = (el: HTMLElement | null) => {
        if (el) els.current.set(key, el);
        else els.current.delete(key);
      };
      refs.current.set(key, fn);
    }
    return fn;
  }, []);

  return { entries, ref };
}
