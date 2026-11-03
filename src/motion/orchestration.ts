"use client";

import { useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { MS_PER_SECOND, ORCHESTRATION_ROLE, STAGGER_GAP_S, STAGGER_STEP_TOKEN } from "../constants/motion";

/**
 * 区块级入场编排预设 (审计 E10).
 *
 * 一个区块里常见的五类元素按固定先后出现: 眉标 -> 标题 -> lead -> CTA -> 媒体. 这里只给出
 * "每个角色晚多少秒", 不决定怎么动: 区块层把延迟交给 Reveal 的 delay 或 SplitText 的 delay.
 * 间隔取 --stagger-step 令牌 (V0-01), 改令牌即全站编排节奏一起变; 读不到时回退 STAGGER_GAP_S.
 * 减弱动效 (prefers-reduced-motion) 时所有延迟归零, 区块整体一次落到终态.
 *
 * .agents/notes/implemented/feature/2026-11-02-scroll-motion-orchestration.md
 */
export type OrchestrationRole = (typeof ORCHESTRATION_ROLE)[keyof typeof ORCHESTRATION_ROLE];

const { eyebrow, title, lead, cta, media } = ORCHESTRATION_ROLE;

/** 常见区块的出场顺序. 同一档内的角色同时出现. */
export const ORCHESTRATION_PRESETS = {
  /** 首屏: 文字自上而下依次出现, 媒体最后压轴. */
  hero: [[eyebrow], [title], [lead], [cta], [media]],
  /** 左右分栏: 媒体与眉标同时进场, 文字随后依次跟上. */
  split: [[eyebrow, media], [title], [lead], [cta]],
  /** 媒体优先 (产品图 / 视频首屏): 先给画面, 再给说明. */
  mediaFirst: [[media], [eyebrow], [title], [lead], [cta]],
  /** 紧凑区块 (特性卡, CTA 条): 眉标与标题一起, 少一拍. */
  compact: [[eyebrow, title], [lead], [cta], [media]],
} as const satisfies Record<string, ReadonlyArray<ReadonlyArray<OrchestrationRole>>>;

export type OrchestrationPresetName = keyof typeof ORCHESTRATION_PRESETS;
export type OrchestrationOrder = ReadonlyArray<ReadonlyArray<OrchestrationRole>>;

/** 每个角色的延迟 (s). 顺序里没出现的角色延迟为 undefined, 调用方按 0 处理或不包 Reveal. */
export type OrchestrationDelays = Partial<Record<OrchestrationRole, number>>;

export interface OrchestrationOptions {
  /** 相邻两档的间隔 (s). 省略时读 --stagger-step 令牌. */
  step?: number;
  /** 第一档之前的延迟 (s). */
  delay?: number;
  /** 减弱动效: 为真时所有延迟归零. */
  reduced?: boolean;
}

/** 读 --stagger-step 令牌并换成秒. 支持 ms 与 s 两种写法; 服务端或令牌缺失时回退 STAGGER_GAP_S. */
export function readStaggerStep(): number {
  const doc = globalThis.document;
  if (!doc?.documentElement || !globalThis.getComputedStyle) return STAGGER_GAP_S;
  const raw = globalThis.getComputedStyle(doc.documentElement).getPropertyValue(STAGGER_STEP_TOKEN).trim();
  const value = Number.parseFloat(raw);
  if (!raw || Number.isNaN(value)) return STAGGER_GAP_S;
  return raw.endsWith("ms") ? value / MS_PER_SECOND : value;
}

/** 把出场顺序换成每个角色的延迟. 纯函数, 可在服务端与测试里直接调用. */
export function orchestrate(order: OrchestrationOrder, options: OrchestrationOptions = {}): OrchestrationDelays {
  const delays: OrchestrationDelays = {};
  const step = options.step ?? readStaggerStep();
  const start = options.delay ?? 0;
  order.forEach((beat, index) => {
    for (const role of beat) delays[role] = options.reduced ? 0 : start + index * step;
  });
  return delays;
}

/** 解析预设名或自定义顺序. */
function resolveOrder(order: OrchestrationPresetName | OrchestrationOrder): OrchestrationOrder {
  return typeof order === "string" ? ORCHESTRATION_PRESETS[order] : order;
}

/**
 * 组件内取编排延迟. 令牌只在挂载时读一次; 减弱动效随系统设置实时归零.
 *
 * ```tsx
 * const delay = useOrchestration("hero");
 * <Reveal delay={delay.title}><h1>…</h1></Reveal>
 * ```
 */
export function useOrchestration(
  order: OrchestrationPresetName | OrchestrationOrder = "hero",
  options: Omit<OrchestrationOptions, "reduced"> = {},
): OrchestrationDelays {
  const reduced = useReducedMotion() === true;
  const step = useMemo(() => options.step ?? readStaggerStep(), [options.step]);
  const resolved = resolveOrder(order);
  return useMemo(
    () => orchestrate(resolved, { step, delay: options.delay, reduced }),
    [resolved, step, options.delay, reduced],
  );
}
