"use client";

import * as React from "react";
import { EXTERNAL_LINK } from "../../../constants/blocks";
import { PORTFOLIO_CLASS, PORTFOLIO_DEFAULT, PORTFOLIO_SLOT } from "../../../constants/blocks-portfolio-v111";
import { Image } from "../../../media/image/image";
import { cn } from "../../../primitives/utils";
import { useBlockLabels } from "../../_shared/BlocksProvider";
import type { BlockLabels } from "../../_shared/types";

export interface HoverPreviewLinkProps {
  href: string;
  children: React.ReactNode;
  /** 悬停 / 聚焦时浮出的预览图; 没有 src 时退化为普通链接. 预览是装饰, 读屏不读. */
  preview?: { src?: string; alt?: string };
  external?: boolean;
  previewWidth?: number;
  previewHeight?: number;
  className?: string;
  labels?: Partial<BlockLabels>;
  ref?: React.Ref<HTMLAnchorElement>;
}

/**
 * rauno.me 式行内链接预览: 悬停或键盘聚焦时在链接上方浮出一张小图, 横向跟随指针.
 * 显隐只过渡 opacity 与 translate (纯 CSS, group-hover / group-focus-within), 减弱动效下无过渡;
 * 指针位置写进 CSS 变量, 不触发 React 重渲染. 预览不拦截指针, 不进 Tab 序.
 */
export function HoverPreviewLink({
  href,
  children,
  preview,
  external = false,
  previewWidth = PORTFOLIO_DEFAULT.previewWidth,
  previewHeight = PORTFOLIO_DEFAULT.previewHeight,
  className,
  labels: labelsProp,
  ref,
}: HoverPreviewLinkProps): React.JSX.Element {
  const labels = useBlockLabels(labelsProp);
  const hostRef = React.useRef<HTMLSpanElement>(null);
  const onPointerMove = React.useCallback((event: React.PointerEvent<HTMLSpanElement>) => {
    const host = hostRef.current;
    if (host === null) return;
    const rect = host.getBoundingClientRect();
    const fromStart = getComputedStyle(host).direction === "rtl" ? rect.right - event.clientX : event.clientX - rect.left;
    host.style.setProperty(PORTFOLIO_DEFAULT.previewXVar, `${Math.round(fromStart)}${PORTFOLIO_DEFAULT.pxUnit}`);
  }, []);
  const onBlur = React.useCallback(() => {
    hostRef.current?.style.removeProperty(PORTFOLIO_DEFAULT.previewXVar);
  }, []);
  const link = (
    <a ref={ref} href={href} className={className} {...(external ? EXTERNAL_LINK : {})}>
      {children}
      {external && <span className={PORTFOLIO_CLASS.srOnly}>{` (${labels.externalLink})`}</span>}
    </a>
  );
  if (preview?.src === undefined || preview.src === "") return link;
  return (
    <span ref={hostRef} data-slot={PORTFOLIO_SLOT.preview} className={PORTFOLIO_CLASS.previewHost} onPointerMove={onPointerMove} onBlur={onBlur}>
      {link}
      <span aria-hidden className={cn(PORTFOLIO_CLASS.previewCard)}>
        <Image src={preview.src} alt="" width={previewWidth} height={previewHeight} />
      </span>
    </span>
  );
}
