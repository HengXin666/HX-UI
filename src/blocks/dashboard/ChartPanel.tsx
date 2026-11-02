"use client";

import * as React from "react";
import { DASH_CLASS, DASH_DEFAULT, DASH_SLOT, dashText, type CHART_PANEL_SLOTS } from "../../constants/blocks-dashboard-v110";
import { BUTTON_TYPE } from "../../constants";
import { cn } from "../../primitives/utils";
import { resolveSlots } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import { CtaGroup } from "../_shared/SectionHeading";
import type { BlockBaseProps, Cta, Rich, SlotClassNames } from "../_shared/types";

export type ChartPanelSlot = (typeof CHART_PANEL_SLOTS)[number];

/** 时间范围的一档. */
export interface ChartRangeOption {
  value: string;
  label: Rich;
}

/** 时间范围切换: 受控 value / 非受控 defaultValue / onValueChange (component-contract 2.1). */
export interface ChartRange {
  options: ReadonlyArray<ChartRangeOption>;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export interface ChartPanelState {
  range?: string;
  empty: boolean;
  loading: boolean;
}

export interface ChartPanelProps extends Pick<BlockBaseProps, "id" | "className" | "style" | "slots" | "aria-label"> {
  title: Rich;
  description?: Rich;
  /** 标题右侧动作: Cta 数据或任意节点 (导出, 更多菜单). */
  actions?: ReadonlyArray<Cta> | React.ReactNode;
  /** 图表节点 (src/charts 的 HxLineChart / HxBarChart ...); 函数形态收到当前范围, 便于按范围取数. */
  chart?: React.ReactNode | ((range: string | undefined) => React.ReactNode);
  range?: ChartRange;
  /** 主读数 (例如本期合计), 显示在标题下方. */
  value?: Rich;
  footer?: Rich;
  /** 没有 chart 时的空态高度; 与图表 height 对齐防跳动. 默认 260. */
  height?: number;
  loading?: boolean;
  classNames?: SlotClassNames<ChartPanelSlot, ChartPanelState>;
  labels?: Partial<Record<string, string>>;
  ref?: React.Ref<HTMLElement>;
}

function isCtaList(value: unknown): value is ReadonlyArray<Cta> {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null && !React.isValidElement(item) && "label" in item);
}

/**
 * 图表面板 (设计文档 4.5): 标题 + 主读数 + 时间范围 + 动作 + 图表 + 脚注, 只负责外框, 图表本身由调用方传入.
 * 时间范围是一组 aria-pressed 的切换按钮, 位于 role="group" 中并以 labels.range 命名.
 */
export function ChartPanel({
  title,
  description,
  actions,
  chart,
  range,
  value,
  footer,
  height = DASH_DEFAULT.chartHeight,
  loading = false,
  classNames,
  labels,
  slots,
  className,
  style,
  id,
  ref,
  "aria-label": ariaLabel,
}: ChartPanelProps): React.JSX.Element {
  const { locale } = useBlocks();
  const text = dashText(locale, labels);
  const titleId = React.useId();
  const [innerRange, setInnerRange] = React.useState(range?.defaultValue ?? range?.options[0]?.value);
  const current = range?.value ?? innerRange;
  const select = (next: string): void => {
    if (range?.value === undefined) setInnerRange(next);
    range?.onValueChange?.(next);
  };
  const body = typeof chart === "function" ? chart(current) : chart;
  const empty = body === undefined || body === null || body === false;
  const cls = resolveSlots<ChartPanelSlot, ChartPanelState, string>(classNames, { range: current, empty, loading });
  return (
    <section
      ref={ref}
      id={id}
      style={style}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel === undefined ? titleId : undefined}
      aria-busy={loading || undefined}
      data-slot={DASH_SLOT.chart}
      data-loading={loading || undefined}
      data-empty={empty || undefined}
      className={cn(DASH_CLASS.panel, cls.root, className)}
    >
      <div data-slot={DASH_SLOT.chartHeader} className={cn(DASH_CLASS.panelHeader, cls.header)}>
        <div className={DASH_CLASS.panelHeadText}>
          <h3 id={titleId} data-slot={DASH_SLOT.chartTitle} className={cn(DASH_CLASS.panelTitle, cls.title)}>
            {title}
          </h3>
          {description !== undefined && <p className={DASH_CLASS.panelDescription}>{description}</p>}
          {value !== undefined && <p className={DASH_CLASS.panelValue}>{value}</p>}
        </div>
        <div className={DASH_CLASS.panelActions}>
          {range !== undefined && range.options.length > 0 && (
            <div role="group" aria-label={text.range} data-slot={DASH_SLOT.chartRange} className={cn(DASH_CLASS.range, cls.range)}>
              {range.options.map((option) => (
                <button
                  key={option.value}
                  type={BUTTON_TYPE}
                  aria-pressed={option.value === current}
                  data-state={option.value === current ? "on" : "off"}
                  onClick={() => select(option.value)}
                  className={cn(DASH_CLASS.rangeItem, DASH_CLASS.focus)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          {isCtaList(actions) ? <CtaGroup items={actions} /> : (actions as React.ReactNode)}
        </div>
      </div>
      {slots?.before}
      <div data-slot={DASH_SLOT.chartBody} className={cn(DASH_CLASS.panelBody, cls.body)}>
        {empty ? (
          <div className={DASH_CLASS.chartEmpty} style={{ height }}>
            {loading ? null : text.chartEmpty}
          </div>
        ) : (
          body
        )}
      </div>
      {slots?.after}
      {footer !== undefined && (
        <div data-slot={DASH_SLOT.chartFooter} className={cn(DASH_CLASS.panelFooter, cls.footer)}>
          {footer}
        </div>
      )}
    </section>
  );
}
