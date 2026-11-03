"use client";

import * as React from "react";
import {
  LOGO_WALL_CLASS,
  LOGO_WALL_COLS,
  LOGO_WALL_COLS_CLASS,
  LOGO_WALL_MODE,
  MV102_CLASS,
  MV102_DEFAULT,
  MV102_SLOT,
} from "../../constants/blocks-marketing-v102";
import { Marquee } from "../../effects/Marquee";
import { cn } from "../../primitives/utils";
import { BlockShell } from "../_shared/BlockShell";
import { renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, Logo, Rich, SectionHeadingData } from "../_shared/types";
import { LogoMark, resolveBackdrop } from "./parts";

type ValueOf<T> = T[keyof T];
export type LogoWallMode = ValueOf<typeof LOGO_WALL_MODE>;

export interface LogoWallProps extends BlockBaseProps {
  /** 标题 (简写); 给了 heading 时以 heading 为准. */
  title?: Rich;
  /** 说明 (简写, 随标题组渲染). */
  description?: Rich;
  /** logo 上方一行小字说明 ("超过 12,000 个团队..."), 渲染为正文档 <p>, 不走区块标题通道. */
  caption?: Rich;
  eyebrow?: Rich;
  /** 完整标题组 (含动作). */
  heading?: SectionHeadingData;
  logos: Logo[];
  /** grid 静态网格 / marquee 无限滚动. 默认 grid. */
  mode?: LogoWallMode;
  /** 灰度 + 悬停复色. 默认 true. */
  grayscale?: boolean;
  /** 网格在宽容器下的列数. */
  cols?: ValueOf<typeof LOGO_WALL_COLS>;
  /** grid 模式在窄容器下自动转 marquee (design 4.2). 默认 true. */
  autoMarquee?: boolean;
  /** logo 统一高度 (px). */
  logoHeight?: number;
  /** marquee 滚完一份的时长 (秒). */
  duration?: number;
  /** marquee 反向. */
  reverse?: boolean;
}

/** 列表的可访问名称: 取标题文本 (字符串时), 否则交给外壳的 aria-labelledby. */
function listName(heading: SectionHeadingData | undefined): string | undefined {
  return typeof heading?.title === "string" ? heading.title : undefined;
}

/**
 * LogoWall: 客户 / 赞助 / 技术栈 logo 墙. grid 静态网格或 marquee 无限滚动 (复制件 aria-hidden, 悬停暂停,
 * 减弱动效时停住改为手动横滑). 默认灰度, 悬停或键盘聚焦复色. grid 模式在窄容器下自动转 marquee,
 * 两份 DOM 由容器查询二选一 (display:none 的那份不进可访问性树).
 */
export function LogoWall({
  title,
  description,
  caption,
  eyebrow,
  heading,
  logos,
  mode = MV102_DEFAULT.logoMode,
  grayscale = MV102_DEFAULT.logoGrayscale,
  cols = MV102_DEFAULT.logoCols,
  autoMarquee = MV102_DEFAULT.logoAutoMarquee,
  logoHeight = MV102_DEFAULT.logoHeight,
  duration,
  reverse,
  backdrop,
  labels: _labels,
  ...shell
}: LogoWallProps): React.JSX.Element {
  const head: SectionHeadingData | undefined = heading ?? (title !== undefined ? { eyebrow, title, description } : undefined);
  const name = listName(head) ?? (typeof caption === "string" ? caption : undefined);
  const items = logos.map((logo) => (
    <li key={logo.name}>
      <LogoMark logo={logo} grayscale={grayscale} height={logoHeight} />
    </li>
  ));
  const marquee = (className?: string): React.JSX.Element => (
    <div data-slot={MV102_SLOT.logoWallMarquee} className={className}>
      <Marquee pauseOnHover fade reverse={reverse} duration={duration} gap={LOGO_WALL_CLASS.marqueeGap} repeat={MV102_DEFAULT.logoMarqueeRepeat}>
        <ul aria-label={name} className={MV102_CLASS.contents}>
          {items}
        </ul>
      </Marquee>
    </div>
  );
  const grid = (
    <ul
      data-slot={MV102_SLOT.logoWallGrid}
      aria-label={name}
      className={cn(LOGO_WALL_CLASS.grid, LOGO_WALL_COLS_CLASS[cols], autoMarquee && LOGO_WALL_CLASS.gridAutoHidden)}
    >
      {items}
    </ul>
  );
  return (
    <BlockShell {...shell} backdrop={resolveBackdrop(backdrop)} heading={head} renderHeading={renderSectionHeading}>
      <div data-slot={MV102_SLOT.logoWall} data-mode={mode}>
        {caption !== undefined && (
          <p data-slot={MV102_SLOT.logoWallCaption} className={LOGO_WALL_CLASS.caption}>
            {caption}
          </p>
        )}
        {mode === LOGO_WALL_MODE.marquee ? (
          marquee()
        ) : (
          <>
            {grid}
            {autoMarquee && marquee(LOGO_WALL_CLASS.marqueeAutoOnly)}
          </>
        )}
      </div>
    </BlockShell>
  );
}
