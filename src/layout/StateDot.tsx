"use client";

import type { JSX } from "react";
import { TONE } from "../constants";
import { cn } from "../primitives/utils";

/**
 * 状态点。一个纯色圆点, 用颜色表达"现在怎么样"。
 *
 * ## 最小可用示例
 *
 * ```tsx
 * import { StateDot } from "@hx/ui";
 *
 * <StateDot tone="ok" label="已连接" />
 * <StateDot tone="busy" label="同步中" pulse />
 * <StateDot tone="error" label="连接失败" />
 * ```
 *
 * ## 为什么颜色必须走语义 token
 *
 * 状态点是"一眼扫过去"的控件, 它的颜色就是全部信息。若在组件里写死色值,
 * 换主题时它不会跟着变, 于是"深色下合适、亮色下对比度崩掉"的那一个点会一直
 * 留在界面上。所以五档全部映射到语义 token, 换肤只改 tokens.css。
 *
 * ## label 为什么是必填的
 *
 * 圆点对读屏用户等于零信息。把状态文字**始终**渲染在 `sr-only` 里, 视觉上是
 * 一个点, 无障碍树里是"已连接"。做成可选的话绝大多数调用点会省掉它,
 * 而"省掉"在视觉上看不出任何区别。
 */

export type StateTone = "ok" | "warn" | "error" | "idle" | "busy";

export interface StateDotProps {
  readonly tone: StateTone;
  /** 无障碍文本。视觉上不显示, 读屏会念。 */
  readonly label: string;
  /** 呼吸动画。用于"正在进行中"这类需要持续提示的状态。 */
  readonly pulse?: boolean;
  readonly className?: string;
}

/**
 * 五档语气对应的颜色。
 *
 * ok / warn / error 用语义状态 token (success / warning / destructive), 不用调色盘色:
 * 绿=正常、黄=注意、红=故障是跨产品的共识, 色相不变, 但明度要随主题调到底色上可读.
 * idle 用中性 token, busy 用 link 蓝: 它们表达的是"没有状态"与"过渡中", 不该抢注意力;
 * busy 不用 primary, 因为暗色 primary 是实底蓝, 在深灰底上做前景对比不够.
 *
 * `bg-current` 配 `text-*`: 颜色只由一个 text 类决定, 圆点、呼吸圈、以及将来
 * 同行的说明文字天然同色, 不会出现"点是一个色、文字是另一个色"。
 */
const TONE_CLASS: Record<StateTone, string> = {
  ok: TONE.success,
  warn: TONE.warning,
  error: "text-destructive",
  idle: "text-muted-foreground/50",
  busy: "text-link",
};

export function StateDot({ tone, label, pulse, className }: StateDotProps): JSX.Element {
  return (
    <span className={cn("relative inline-flex size-2 items-center justify-center", className)}>
      {/*
        呼吸圈是**独立的一层**, 不是给圆点自己加动画: 让圆点本体 ping 会让它周期性
        消失, 状态点最该稳定的那一刻 (正在忙) 反而看不清。这里让底下那层扩散淡出,
        圆点本体始终保持实心。
      */}
      {pulse ? (
        <span
          aria-hidden
          className={cn("absolute inset-0 rounded-full bg-current opacity-60 animate-ping", TONE_CLASS[tone])}
        />
      ) : null}
      <span aria-hidden className={cn("relative block size-2 shrink-0 rounded-full bg-current", TONE_CLASS[tone])} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
