"use client";

import type { ComponentType, JSX } from "react";
import { BlockShell, renderSectionHeading } from "../blocks/_shared";
import type { BlockBaseProps, SectionHeadingData } from "../blocks/_shared";
import { cn } from "../primitives/utils";
import { Metric, type MetricProps } from "../studio/viz/Metric";
import { Ring, type RingProps } from "../viz/charts/Ring";
import { VIZ_SHOT } from "../viz/tokens";

/** 可视化区块在组件自身 props 之外多出的外壳字段: 标题组与 BlockShell 的版式参数. */
export type FrameProps = Omit<BlockBaseProps, "slots"> & {
  heading?: SectionHeadingData;
};

const SHELL_KEYS = ["id", "className", "style", "classNames", "styles", "tone", "pad", "width", "align", "reveal", "backdrop", "as", "labels", "aria-label", "aria-labelledby"] as const;

function split<P extends object>(props: P & FrameProps): { shell: BlockBaseProps; heading?: SectionHeadingData; own: P } {
  const shell: Record<string, unknown> = {};
  const own: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === "heading") continue;
    if ((SHELL_KEYS as readonly string[]).includes(key)) shell[key] = value;
    else own[key] = value;
  }
  return { shell: shell as BlockBaseProps, heading: props.heading, own: own as P };
}

/**
 * 把一个可视化组件包成可进页面描述的区块: 外层 BlockShell 负责留白, 宽度, 锚点与标题组,
 * 内层原样渲染组件. className 与 classNames 归外壳, 要改组件自身样式时在 props 里用组件的插槽.
 */
export function framed<P extends object>(Component: ComponentType<P>, name: string): ComponentType<P & FrameProps> {
  function Framed(props: P & FrameProps): JSX.Element {
    const { shell, heading, own } = split(props);
    return (
      <BlockShell {...shell} heading={heading} renderHeading={heading ? renderSectionHeading : undefined}>
        <Component {...own} />
      </BlockShell>
    );
  }
  Framed.displayName = `Framed(${name})`;
  return Framed;
}

export interface RingRowProps {
  items: readonly RingProps[];
  className?: string;
}

/** 一排环形进度, 窄屏两列. 自检按 4f 错峰成波浪, 齐甩读作复制粘贴 (gauge-readout-moves). */
export function RingRow({ items, className }: RingRowProps): JSX.Element {
  return (
    <div className={cn("grid grid-cols-2 justify-items-center gap-8 md:grid-cols-4", className)}>
      {items.map((item, index) => (
        <Ring key={item.label} delay={index * VIZ_SHOT.gaugeStagger} {...item} />
      ))}
    </div>
  );
}

export interface MetricRowProps {
  items: readonly MetricProps[];
  className?: string;
}

/** 一排指标卡. 卡数决定列数, 最多四列. */
export function MetricRow({ items, className }: MetricRowProps): JSX.Element {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map((item) => (
        <Metric key={item.label} {...item} />
      ))}
    </div>
  );
}
