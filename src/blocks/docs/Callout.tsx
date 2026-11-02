"use client";

import type * as React from "react";
import { CALLOUT_ICON, CALLOUT_ROLE, CALLOUT_TONE_CLASS, DOCS_CLASS, DOCS_DEFAULT, DOCS_SLOT, type CALLOUT_SLOTS } from "../../constants/blocks-docs-v109";
import { IconSlot } from "../../layout/Icon";
import { cn } from "../../primitives/utils";
import { resolveSlots } from "../_shared/BlockShell";
import type { BlockBaseProps, CalloutKind, IconName, Rich, SlotClassNames } from "../_shared/types";
import { useDocsText } from "./parts/labels";

export type CalloutSlot = (typeof CALLOUT_SLOTS)[number];

export interface CalloutProps extends Pick<BlockBaseProps, "id" | "className" | "style" | "aria-label"> {
  kind?: CalloutKind;
  title?: Rich;
  /** 覆盖默认图标; 传 false 不显示图标. */
  icon?: IconName | false;
  children?: React.ReactNode;
  classNames?: SlotClassNames<CalloutSlot, { kind: CalloutKind }>;
  /** 覆盖兜底文案 (note / tip / warning / danger, 用作读屏前缀). */
  labels?: Partial<Record<string, string>>;
  ref?: React.Ref<HTMLElement>;
}

/**
 * 提示框: note / tip / warning / danger 四档, 颜色全部来自语义 token (--info / --success / --warning / --destructive).
 * 静态内容一律 role="note", 读屏前缀给出语义名, 不依赖颜色传达含义.
 */
export function Callout({ kind = DOCS_DEFAULT.calloutKind, title, icon, children, classNames, labels, className, style, id, ref, "aria-label": ariaLabel }: CalloutProps): React.JSX.Element {
  const text = useDocsText(labels);
  const cls = resolveSlots<CalloutSlot, { kind: CalloutKind }, string>(classNames, { kind });
  const kindLabel = text[kind];
  return (
    <aside
      ref={ref}
      id={id}
      style={style}
      role={CALLOUT_ROLE[kind]}
      aria-label={ariaLabel ?? (title === undefined || typeof title !== "string" ? kindLabel : `${kindLabel}: ${title}`)}
      data-slot={DOCS_SLOT.callout}
      data-kind={kind}
      className={cn(DOCS_CLASS.callout, CALLOUT_TONE_CLASS[kind], cls.root, className)}
    >
      {icon !== false && (
        <span aria-hidden data-slot={DOCS_SLOT.calloutIcon} className={cn("inline-flex", cls.icon)}>
          <IconSlot source={icon ?? CALLOUT_ICON[kind]} className={DOCS_CLASS.calloutIcon} />
        </span>
      )}
      <div className={DOCS_CLASS.calloutText}>
        {title !== undefined && (
          <p data-slot={DOCS_SLOT.calloutTitle} className={cn(DOCS_CLASS.calloutTitle, cls.title)}>
            {title}
          </p>
        )}
        <div data-slot={DOCS_SLOT.calloutBody} className={cn(DOCS_CLASS.calloutBody, cls.body)}>
          {children}
        </div>
      </div>
    </aside>
  );
}
