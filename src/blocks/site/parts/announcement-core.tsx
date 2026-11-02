"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../../constants";
import { CTA_VARIANT } from "../../../constants/blocks";
import { SITE_BLOCK_CLASS, SITE_BLOCK_DEFAULT, SITE_BLOCK_SLOT } from "../../../constants/blocks-site-v101";
import { SITE_CLASSES, SITE_STORAGE } from "../../../constants/site";
import { useLocalStorage } from "../../../hooks/browser/useLocalStorage";
import { cn } from "../../../primitives/utils";
import { AnnouncementBar } from "../../../site/header/AnnouncementBar";
import { useBlockLabels } from "../../_shared/BlocksProvider";
import { CtaButton } from "../../_shared/SectionHeading";
import type { BlockLabels } from "../../_shared/types";
import { iconNode, intentOf, useSiteAria } from "./adapt";
import type { AnnouncementBlockProps } from "./types";

/** 公告的开合状态: 受控 open > localStorage (storageKey) > 内存. 关闭后整块不渲染 (外壳也不留空节点). */
export function useAnnouncementOpen({
  open: openProp,
  defaultOpen = SITE_BLOCK_DEFAULT.open,
  storageKey,
  onOpenChange,
}: Pick<AnnouncementBlockProps, "open" | "defaultOpen" | "storageKey" | "onOpenChange">): readonly [boolean, () => void] {
  const persisted = storageKey !== false;
  const [dismissed, setDismissed] = useLocalStorage<boolean>(persisted && storageKey ? storageKey : SITE_STORAGE.announcement, !defaultOpen);
  const [memoryOpen, setMemoryOpen] = React.useState(defaultOpen);
  const open = openProp ?? (persisted ? !dismissed : memoryOpen);
  const close = React.useCallback((): void => {
    if (openProp === undefined) {
      if (persisted) setDismissed(true);
      else setMemoryOpen(false);
    }
    onOpenChange?.(false);
  }, [openProp, persisted, setDismissed, onOpenChange]);
  return [open, close] as const;
}

function Message({ message, truncate, labels }: { message: React.ReactNode; truncate: boolean; labels: BlockLabels }): React.JSX.Element {
  const [expanded, setExpanded] = React.useState(false);
  const bodyId = React.useId();
  if (!truncate) return <span data-slot={SITE_BLOCK_SLOT.announcementMessage}>{message}</span>;
  return (
    <>
      <span id={bodyId} data-slot={SITE_BLOCK_SLOT.announcementMessage} data-expanded={expanded ? "" : undefined} className={cn(!expanded && SITE_BLOCK_CLASS.clamp)}>
        {message}
      </span>
      <button
        type={BUTTON_TYPE}
        aria-expanded={expanded}
        aria-controls={bodyId}
        onClick={() => setExpanded((value) => !value)}
        data-slot={SITE_BLOCK_SLOT.announcementToggle}
        className={cn(SITE_BLOCK_CLASS.toggle, SITE_CLASSES.focus)}
      >
        {expanded ? labels.collapse : labels.expand}
      </button>
    </>
  );
}

export interface AnnouncementCoreProps extends AnnouncementBlockProps {
  /** 已由外层算好的开合与关闭动作. */
  isOpen: boolean;
  onDismiss: () => void;
}

/**
 * 公告条内核: 复用 src/site AnnouncementBar 零件 (受控, 不让零件自己读写存储), 补上 Cta 与窄屏截断展开.
 * Cta 有 href 时交给零件渲染链接; 只有 onClick 时渲染成行内 link 按钮.
 */
export function AnnouncementCore({
  message,
  cta,
  icon,
  intent,
  tone,
  dismissible = SITE_BLOCK_DEFAULT.dismissible,
  truncate = SITE_BLOCK_DEFAULT.truncate,
  labels,
  ariaLabels,
  isOpen,
  onDismiss,
}: AnnouncementCoreProps): React.JSX.Element | null {
  const blockLabels = useBlockLabels(labels);
  const aria = useSiteAria(labels, ariaLabels);
  if (!isOpen) return null;
  const linked = cta?.href !== undefined;
  return (
    <AnnouncementBar
      icon={iconNode(icon)}
      href={linked ? cta?.href : undefined}
      linkLabel={linked ? cta?.label : undefined}
      external={cta?.external}
      tone={intentOf(tone, intent)}
      dismissible={dismissible}
      storageKey={false}
      open
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
      labels={{ region: aria.announcement, dismiss: aria.dismiss }}
    >
      <Message message={message} truncate={truncate} labels={blockLabels} />
      {cta && !linked ? <CtaButton cta={{ ...cta, variant: cta.variant ?? CTA_VARIANT.link }} /> : null}
    </AnnouncementBar>
  );
}
