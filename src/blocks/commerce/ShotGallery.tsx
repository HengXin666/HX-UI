"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import { GALLERY_CLASS as C, GALLERY_SHOT as S, GALLERY_TEXT } from "../../constants/sections-commerce";
import { useReducedMotion } from "../../hooks/browser/media/useReducedMotion";
import type { ModelMedia } from "../../commerce/catalog";

export interface ShotGalleryProps {
  media: readonly ModelMedia[];
  /** 受控当前张; 换颜色时把该色首图的下标传进来. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  texts?: Partial<typeof GALLERY_TEXT>;
  className?: string;
}

/** 某张图在当前镜头里的姿态: 在场 / 刚离场 / 候场. 离场方向跟着切换方向走. */
function poseOf(i: number, current: number, previous: number, dir: number, still: boolean): React.CSSProperties {
  if (still) return { opacity: i === current ? 1 : 0, transitionDuration: "0ms" };
  const base = { transitionDuration: `${S.ms}ms` };
  if (i === current) return { ...base, opacity: 1, transform: `translateX(0) scale(${S.pushIn.to})` };
  if (i === previous) return { ...base, opacity: 0, transform: `translateX(${-dir * S.driftPct}%) scale(${S.out})` };
  return { ...base, opacity: 0, transform: `translateX(${dir * S.driftPct}%) scale(${S.pushIn.from})`, transitionDuration: "0ms" };
}

/**
 * 镜头化商品画廊: 主图叠放, 换图是一个短推镜 (新图从 1.04 推到 1, 旧图略放大淡出, 按前后方向带 3% 横移),
 * 不做轮播滑轨. 主图区可聚焦, 左右键与 Home / End 切换; 缩略图是 tablist, 读屏报 "第几张 / 共几张".
 * 减弱动效时直接切, 不做过渡.
 */
export function ShotGallery({ media, index, defaultIndex = 0, onIndexChange, texts, className }: ShotGalleryProps): React.JSX.Element | null {
  const t = { ...GALLERY_TEXT, ...texts };
  const reduced = useReducedMotion();
  const [own, setOwn] = React.useState(defaultIndex);
  const current = Math.min(Math.max(index ?? own, 0), Math.max(media.length - 1, 0));
  const prev = React.useRef({ index: current, dir: 1 });
  const [shot, setShot] = React.useState({ previous: current, dir: 1 });

  React.useEffect(() => {
    if (prev.current.index === current) return;
    const dir = current > prev.current.index ? 1 : -1;
    setShot({ previous: prev.current.index, dir });
    prev.current = { index: current, dir };
  }, [current]);

  if (media.length === 0) return null;
  const go = (next: number): void => {
    const n = (next + media.length) % media.length;
    if (index === undefined) setOwn(n);
    onIndexChange?.(n);
  };
  const onKey = (e: React.KeyboardEvent): void => {
    const keys: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: media.length - 1 };
    if (e.key in keys) {
      e.preventDefault();
      go(keys[e.key]);
    }
  };

  return (
    <div className={className ? `${C.root} ${className}` : C.root} data-slot="shot-gallery">
      <div className={C.stage} tabIndex={0} role="group" aria-roledescription="carousel" aria-label={t.label} onKeyDown={onKey}>
        {media.map((m, i) => (
          <img key={m.src} src={m.src} srcSet={m.srcSet} alt={i === current ? m.alt : ""} aria-hidden={i !== current || undefined} className={C.slide} style={poseOf(i, current, shot.previous, shot.dir, reduced)} draggable={false} />
        ))}
        <span className={C.counter} aria-live="polite" data-slot="shot-gallery-counter">{`${current + 1} ${t.of} ${media.length}`}</span>
      </div>
      {media.length > 1 ? (
        <div className={C.thumbs} role="tablist" aria-label={t.thumbs}>
          {media.map((m, i) => (
            <button key={m.src} type={BUTTON_TYPE} role="tab" aria-selected={i === current} aria-label={m.alt || `${i + 1}`} className={C.thumb} onClick={() => go(i)}>
              <img src={m.src} alt="" className={C.thumbImg} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
