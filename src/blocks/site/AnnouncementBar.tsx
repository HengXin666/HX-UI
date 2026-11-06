"use client";

import * as React from "react";
import { SITE_BLOCK_DEFAULT, SITE_BLOCK_SLOT } from "../../constants/blocks-site-v101";
import { BlockShell } from "../_shared/BlockShell";
import { AnnouncementCore, useAnnouncementOpen } from "./parts/announcement-core";
import type { AnnouncementBlockProps } from "./parts/types";

export type { AnnouncementBlockProps };

/**
 * 公告条区块 (design 4.1 AnnouncementBar): 一行通知, 可带图标与 Cta, 可关闭并记住关闭状态 (localStorage),
 * 语义色由 intent 决定 (缺省由 tone 推出), 窄屏单行截断 + 展开. 复用 src/site AnnouncementBar 零件.
 * 外壳 (BlockShell) 承接 BlockBaseProps; 默认不留纵向白, 宽度贴边 (零件自带容器). 关闭后整块不渲染.
 * open / defaultOpen / onOpenChange 三件套 (契约 2.1); 所有文案来自 props, aria 名称可经 ariaLabels 覆盖.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-site-v101.md
 */
export function AnnouncementBar(props: AnnouncementBlockProps): React.JSX.Element | null {
  const {
    id, className, style, classNames, styles, tone, pad = SITE_BLOCK_DEFAULT.pad, align, reveal, backdrop,
    as = SITE_BLOCK_DEFAULT.tag, slots, "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy,
    open, defaultOpen, storageKey, onOpenChange,
  } = props;
  const [isOpen, dismiss] = useAnnouncementOpen({ open, defaultOpen, storageKey, onOpenChange });
  if (!isOpen) return null;
  return (
    <BlockShell
      id={id}
      className={className}
      style={style}
      classNames={classNames}
      styles={styles}
      tone={tone}
      pad={pad}
      width={SITE_BLOCK_DEFAULT.shellWidth}
      align={align}
      reveal={reveal}
      backdrop={backdrop}
      as={as}
      slots={slots}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <div data-slot={SITE_BLOCK_SLOT.announcement}>
        <AnnouncementCore {...props} isOpen={isOpen} onDismiss={dismiss} />
      </div>
    </BlockShell>
  );
}
