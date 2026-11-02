"use client";

import * as React from "react";
import { QUOTE_CLAMP_CLASS, SOCIAL_CLASS, SOCIAL_SLOT, type QuoteClampLines } from "../../../constants/blocks-marketing-v104";
import { BUTTON_TYPE } from "../../../constants";
import { Button } from "../../../primitives/button";
import { cn } from "../../../primitives/utils";
import type { BlockLabels, Rich } from "../../_shared/types";

/**
 * 是否被截断: 截断态下内容高度大于盒高即溢出. ResizeObserver 跟随宽度变化重算,
 * 所以不假设固定字数, 窄栏, 换字体, 换语言都成立.
 */
function useOverflow(ref: React.RefObject<HTMLElement | null>, enabled: boolean): boolean {
  const [overflow, setOverflow] = React.useState(false);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) {
      setOverflow(false);
      return;
    }
    const measure = () => setOverflow(el.scrollHeight - el.clientHeight > 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, enabled]);
  return overflow;
}

export interface ExpandableQuoteProps {
  quote: Rich;
  /** 截断行数; false 不截断. */
  clampLines: QuoteClampLines | false;
  /** 展开 / 收起按钮; marquee 里卡片不可展开, 只截断. */
  expandable?: boolean;
  large?: boolean;
  labels: Pick<BlockLabels, "expand" | "collapse">;
  className?: string;
}

/**
 * 引言: 视觉上按行截断 (line-clamp, 读屏仍读全文), 真溢出时才出现 "展开" 按钮.
 * 按钮 aria-expanded + aria-controls 指向引言; 文案来自 labels (可覆盖).
 */
export function ExpandableQuote({ quote, clampLines, expandable = true, large, labels, className }: ExpandableQuoteProps): React.JSX.Element {
  const id = React.useId();
  const ref = React.useRef<HTMLQuoteElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const clamped = clampLines !== false && !expanded;
  const overflow = useOverflow(ref, clamped);
  const showToggle = expandable && clampLines !== false && (overflow || expanded);
  return (
    <div className={cn(SOCIAL_CLASS.quoteWrap, className)}>
      <blockquote
        ref={ref}
        id={id}
        data-slot={SOCIAL_SLOT.quote}
        data-state={clamped ? "clamped" : "full"}
        className={cn(large ? SOCIAL_CLASS.quoteLarge : SOCIAL_CLASS.quote, clamped && QUOTE_CLAMP_CLASS[clampLines as QuoteClampLines])}
      >
        {quote}
      </blockquote>
      {showToggle && (
        <Button
          type={BUTTON_TYPE}
          variant="link"
          size="sm"
          data-slot={SOCIAL_SLOT.quoteToggle}
          aria-expanded={expanded}
          aria-controls={id}
          className={SOCIAL_CLASS.quoteToggle}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? labels.collapse : labels.expand}
        </Button>
      )}
    </div>
  );
}
