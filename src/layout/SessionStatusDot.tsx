"use client";

import type { JSX } from "react";
import { cn } from "../primitives/utils";

/**
 * 列表项的行首状态指示。
 *
 * ## 最小可用示例
 *
 * ```tsx
 * import { SessionStatusDot } from "@hx/ui";
 *
 * <SessionStatusDot status="running" />                   // 转圈: 正在执行
 * <SessionStatusDot status="unread" />                    // 实心绿点: 有新结果待看
 * <SessionStatusDot status="pending-input" />             // 脉冲琥珀点: 等待输入
 * <SessionStatusDot status="idle" />                      // 不渲染, 不占位
 * <SessionStatusDot status="unread" label="构建已完成" />  // 覆盖读屏文本
 * ```
 *
 * ## 四态为什么是这四个
 *
 * 它们是一条"从开始到结束"的轴, 不是四件互不相干的事: 执行中 (转圈) -> 等待
 * 外部输入 (脉冲点) -> 执行结束且结果未被查看 (实心点) -> 无状态 (不渲染)。
 * 三态互斥且可派生自同一组事实 (在跑 / 在等 / 有未读), 于是调用方只需回答三个
 * 布尔量, 不必自己挑尺寸、颜色与动画  那三件事正是各调用点最容易做得不一致的。
 *
 * ## idle 返回 null 而不是渲染一个占位空盒
 *
 * 留一个固定宽度的空盒, 会让整列空盒看起来像加载失败, 也让调用方无法用一次判断
 * 把这一格整体省掉。返回 null 时它完全不进 DOM, 与 {@link ./Icon} 的空值语义一致:
 * 没有状态就该像从没写过状态。
 *
 * ## 转圈为什么用 CSS 而不是库里已有的 motion
 *
 * `animate-spin` 是 Tailwind 自带的原子类: 一个 1px 描边圆加一条透明边就是弧线,
 * 零额外产物。motion 在本库承担的是弹层进出场这类需要编排与中断的动效; 把单元素
 * 匀速旋转交给它, 只是把一行 CSS 换成一次 JS 订阅。
 */

/**
 * 四种状态。`idle` 表示"没有状态", 不渲染任何节点。
 */
export type SessionStatus = "running" | "unread" | "idle" | "pending-input";

/**
 * 各状态的几何与配色。
 *
 * 颜色直接写在各元素上而不是让圆点继承外层文字色: 三态的色相**本身就是信息**
 * (主色=进行中 / 绿=已完成待看 / 琥珀=等待输入), 与"可被外层文字色统一改色"的
 * 通用圆点不是一类东西。写在这里而不是调用点, 是为了让"同一状态到哪都是同一个
 * 样子"成为类型可查的事实。
 *
 * `emerald-*` 与 `amber-*` 是设计规约明确放行的语义原色 (成功 / 警告), 其余
 * 调色盘一律禁止  见 scripts/check-ui-rules.mjs 的 PALETTE_BAN。
 */
const RING = "border border-current border-t-transparent";
const DOT = "block rounded-full";

/**
 * 未传 `label` 时的读屏文本。
 *
 * 一个圆点对读屏用户等于零信息, 所以视觉上可以只是一个点, 无障碍树里必须是文字。
 * 做成"不传就不渲染"的话, 绝大多数调用点会省掉它, 而省掉在视觉上看不出任何区别;
 * 因此每一态都给兜底文案, `label` 只用于覆盖更具体的描述。
 */
const DEFAULT_LABEL: Record<Exclude<SessionStatus, "idle">, string> = {
  running: "进行中",
  unread: "已完成, 有未读更新",
  "pending-input": "等待输入",
};

export interface SessionStatusDotProps {
  readonly status: SessionStatus;
  /** 读屏文本。省略时取该状态的兜底文案。 */
  readonly label?: string;
  readonly className?: string;
}

/**
 * 状态指示点。四态互斥, 判定顺序固定: 先判 idle 早退, 再按状态给出几何。
 *
 * 外框固定 `size-3.5` 并居中, 是刻意的: 弧线与圆点的直径不同, 若让它们各自撑开
 * 宽度, 同一列里"有转圈的行"与"有点的行"文字起点会差几个像素。固定外框之后,
 * 指示器占的横向空间与状态无关, 同一列天然对齐。
 *
 * .agents/notes/implemented/feature/2026-10-12-session-status-indicator.md
 */
export function SessionStatusDot({ status, label, className }: SessionStatusDotProps): JSX.Element | null {
  if (status === "idle") return null;

  return (
    <span className={cn("relative inline-flex size-3.5 shrink-0 items-center justify-center", className)}>
      {status === "running" ? (
        <span aria-hidden className={cn(RING, DOT, "size-3.5 text-primary animate-spin")} />
      ) : null}
      {status === "unread" ? <span aria-hidden className={cn(DOT, "size-2 bg-emerald-500")} /> : null}
      {status === "pending-input" ? (
        <>
          {/*
            呼吸层是独立的一层, 不是给圆点本体加动画: 本体 ping 会周期性消失,
            而"正在等待输入"恰恰是最需要它保持可见的时刻。与 StateDot 的 pulse 同构。
          */}
          <span aria-hidden className={cn(DOT, "absolute size-2 bg-amber-500 opacity-60 animate-ping")} />
          <span aria-hidden className={cn(DOT, "relative size-2 bg-amber-500")} />
        </>
      ) : null}
      <span className="sr-only">{label ?? DEFAULT_LABEL[status]}</span>
    </span>
  );
}
