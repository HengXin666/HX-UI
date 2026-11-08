// 行为规格参照 docs/research/catalog/textanimations.md 全部 33 个条目的无障碍要求, 实现为 HX 自有.

import type { CSSProperties, ElementType, HTMLAttributes, JSX, ReactNode, Ref } from "react";
import { SR_ONLY } from "./tokens";

/**
 * 文本族的外壳: 读屏读一份完整原文 (sr-only), 拆开的视觉层整体 aria-hidden, 不会被逐字拼读.
 *
 * .agents/notes/implemented/feature/2026-11-09-surface-text-kernel.md
 */
export interface TextShellProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** 读屏读到的完整原文. */
  readonly text: string;
  /** 外层标签, 默认 span. */
  readonly as?: ElementType;
  /** 视觉层. */
  readonly children?: ReactNode;
  /** 视觉层包裹的类. */
  readonly visualClassName?: string;
  readonly visualStyle?: CSSProperties;
  readonly ref?: Ref<HTMLElement>;
  /** 写到 data-slot, 方便测试与样式定位. */
  readonly slot?: string;
}

export function TextShell({ text, as: Tag = "span", children, visualClassName, visualStyle, slot, ...rest }: TextShellProps): JSX.Element {
  return (
    <Tag data-slot={slot} {...rest}>
      <span className={SR_ONLY}>{text}</span>
      <span aria-hidden="true" className={visualClassName} style={visualStyle}>
        {children}
      </span>
    </Tag>
  );
}
