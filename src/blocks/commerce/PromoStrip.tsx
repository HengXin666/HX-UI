"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import {
  ARIA_LIVE,
  BROWSE_CLASS as C,
  BROWSE_ICON,
  COMMERCE_BROWSE_SLOT,
  PROMO_STRIP_TONE,
  PROMO_STRIP_TONE_CLASS,
  browseSlot,
  type BrowseTexts,
  type PromoStripTone,
} from "../../constants/blocks-commerce-v107";
import { BLOCK_PAD, BLOCK_TAG, BLOCK_WIDTH, EXTERNAL_LINK } from "../../constants/blocks";
import { useControllableState } from "../../hooks/state/useControllableState";
import { IconSlot } from "../../layout/Icon";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { useBlocks } from "../_shared/BlocksProvider";
import type { BlockBaseProps, IconName, Rich } from "../_shared/types";
import { useBrowseTexts } from "./browse/media";
import { useCarousel } from "./browse/use-carousel";
import { useCountdown } from "./browse/use-countdown";

const slot = (part?: string): string => browseSlot(COMMERCE_BROWSE_SLOT.promoStrip, part);

/** 一条促销信息 (可 JSON 序列化). */
export interface PromoStripItemData {
  text: Rich;
  /** 有 href 时 linkLabel (或 text 本身) 成为链接. */
  href?: string;
  linkLabel?: Rich;
  external?: boolean;
  /** 倒计时截止时间 (ISO 串 / 时间戳); 到点后倒计时消失. */
  endsAt?: string | number;
  icon?: IconName;
}

export interface PromoStripProps extends BlockBaseProps {
  /** 一条或多条; 多条时按 rotate 间隔轮换 (hover / 焦点暂停). */
  items: PromoStripItemData[];
  /** 语气档: neutral / brand / inverted / sale / success, 默认 brand. */
  promoTone?: PromoStripTone;
  /** 多条轮换间隔 ms; 不传时只显示第一条. */
  rotate?: number;
  /** 显示关闭按钮. 打开状态三件套. */
  dismissible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  texts?: Partial<BrowseTexts>;
  ref?: React.Ref<HTMLElement>;
}

/** 一条信息里的倒计时: role="timer", 不播报每秒变化; 时长全部经 Intl 格式化. */
function Countdown({ endsAt, label }: { endsAt: string | number; label: string }): React.JSX.Element | null {
  const { locale } = useBlocks();
  const cd = useCountdown(endsAt, locale);
  if (cd.done || cd.remaining === null) return null;
  return (
    <span role="timer" aria-live={ARIA_LIVE.off} data-slot={slot("timer")} className={C.stripTimer}>
      <span className={C.srOnly}>{label}</span>
      <time dateTime={cd.iso}>{cd.text}</time>
    </span>
  );
}

function ItemBody({ item, label }: { item: PromoStripItemData; label: string }): React.JSX.Element {
  const link =
    item.href !== undefined ? (
      <a href={item.href} data-slot={slot("link")} className={cn(C.stripLink, C.focus)} {...(item.external ? EXTERNAL_LINK : {})}>
        {item.linkLabel ?? item.text}
      </a>
    ) : null;
  return (
    <>
      {item.icon !== undefined && (
        <span aria-hidden data-slot={slot("icon")}>
          <IconSlot source={item.icon} />
        </span>
      )}
      {(item.href === undefined || item.linkLabel !== undefined) && (
        <span data-slot={slot("text")} className={C.stripText}>
          {item.text}
        </span>
      )}
      {item.endsAt !== undefined && <Countdown endsAt={item.endsAt} label={label} />}
      {link}
    </>
  );
}

/**
 * 促销条 (apple Upgrade 公告 / nike 免运费条): 一行信息 + 可选倒计时或链接, 语气档, 可关闭, 多条轮换.
 * 默认 as="aside", width="bleed", pad="none"; 关闭后不渲染 (状态可受控, 持久化交给调用方).
 */
export function PromoStrip({
  items,
  promoTone = PROMO_STRIP_TONE.brand,
  rotate,
  dismissible = false,
  open,
  defaultOpen = true,
  onOpenChange,
  texts,
  labels: _labels,
  as = BLOCK_TAG.aside,
  width = BLOCK_WIDTH.bleed,
  pad = BLOCK_PAD.none,
  className,
  ref,
  ...shell
}: PromoStripProps): React.JSX.Element | null {
  const t = useBrowseTexts(texts);
  const [shown, setShown] = useControllableState<boolean>({ value: open, defaultValue: defaultOpen, onChange: onOpenChange });
  const carousel = useCarousel({ count: items.length, autoplay: rotate });
  const item = items[carousel.index];
  if (!shown || item === undefined) return null;

  return (
    <BlockShell {...shell} ref={ref} as={as} width={width} pad={pad} className={cn(C.strip, PROMO_STRIP_TONE_CLASS[promoTone], className)}>
      <div
        data-slot={slot()}
        data-tone={promoTone}
        className={C.stripInner}
        aria-live={items.length > 1 && !carousel.playing ? ARIA_LIVE.polite : ARIA_LIVE.off}
        {...(items.length > 1 ? carousel.pauseHandlers : {})}
      >
        <ItemBody item={item} label={t.countdown} />
      </div>
      {dismissible && (
        <button
          type={BUTTON_TYPE}
          data-slot={slot("close")}
          aria-label={t.dismiss}
          onClick={() => setShown(false)}
          className={cn(C.stripClose, C.colors, C.focus)}
        >
          <span aria-hidden className={cn(BROWSE_ICON.close, C.icon)} />
        </button>
      )}
    </BlockShell>
  );
}
