"use client";

import * as React from "react";
import { MEDIA_KIND } from "../../constants/blocks";
import { MV103_CLASS, MV103_DEFAULT, MV103_SLOT, SHOWCASE_FRAME, focalOf, mediaKindOf, mediaRatioOf } from "../../constants/blocks-marketing-v103";
import { IconSlot } from "../../layout/Icon";
import { BrowserFrame } from "../../media/frames/browser-frame";
import { Image } from "../../media/image/image";
import { ThemedImage } from "../../media/image/themed-image";
import { Video } from "../../media/video";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../primitives/tabs";
import { BlockShell } from "../_shared/BlockShell";
import { renderSectionHeading } from "../_shared/SectionHeading";
import type { BlockBaseProps, IconName, Media, Rich, SectionHeadingData } from "../_shared/types";

/** 一张截图 (一个 tab): 亮暗双图给 media.darkSrc 即走 ThemedImage. */
export interface ShowcaseItem {
  /** tab 值; 未给时用下标. */
  value?: string;
  /** tab 标签; 只有一张图时不显示 tab. */
  label: Rich;
  media: Media;
  /** 浏览器外框地址栏里的文字. */
  address?: Rich;
  /** 截图下方的说明. */
  caption?: Rich;
}

export interface ShowcaseFeature {
  key?: string;
  icon?: IconName;
  title: Rich;
  body?: Rich;
}

export interface ShowcaseProps extends BlockBaseProps {
  heading?: SectionHeadingData;
  items: ShowcaseItem[];
  /** 截图下方的特性列表. */
  features?: ShowcaseFeature[];
  /** browser: BrowserFrame 包边; none: 圆角描边盒. 默认 browser. */
  frame?: (typeof SHOWCASE_FRAME)[keyof typeof SHOWCASE_FRAME];
  /** 当前 tab (受控); 与 defaultValue / onValueChange 构成三件套, 原样交给 Tabs (radix). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** tab 栏的可访问名称; 未给时用标题文字. */
  tabsLabel?: string;
  ref?: React.Ref<HTMLElement>;
}

/** 媒体渲染: 节点原样; 视频走 media/Video; 图片有暗色图时走 ThemedImage, 否则 Image. */
function MediaView({ media }: { media: Media }): React.JSX.Element | null {
  const kind = mediaKindOf(media);
  if (kind === MEDIA_KIND.node) return <>{media.node}</>;
  if (!media.src) return null;
  if (kind === MEDIA_KIND.video) return <Video title={media.alt} src={media.src} poster={media.poster} />;
  const dark = media.darkSrc ?? media.srcDark;
  const common = { alt: media.alt, ratio: mediaRatioOf(media.ratio), priority: media.priority, objectPosition: focalOf(media.focal), sizes: media.sizes, placeholder: media.placeholder };
  if (dark) return <ThemedImage {...common} lightSrc={media.src} darkSrc={dark} />;
  return <Image {...common} src={media.src} srcSet={media.srcSet} />;
}

function Stage({ item, frame }: { item: ShowcaseItem; frame: ShowcaseProps["frame"] }): React.JSX.Element {
  const body = frame === SHOWCASE_FRAME.browser ? (
    <BrowserFrame address={item.address}>
      <MediaView media={item.media} />
    </BrowserFrame>
  ) : (
    <div className={MV103_CLASS.mediaBox}>
      <MediaView media={item.media} />
    </div>
  );
  return (
    <figure data-slot={MV103_SLOT.showcaseStage} className={MV103_CLASS.showcaseStack}>
      {body}
      {item.caption !== undefined && <figcaption className={MV103_CLASS.body}>{item.caption}</figcaption>}
    </figure>
  );
}

function valueOf(item: ShowcaseItem, index: number): string {
  return item.value ?? String(index);
}

/**
 * 产品截图展示段 (vercel 的客户大截图 + tabs, supabase 的 Dashboard tabs). 多张图时上方 tabs 切换
 * (primitives/tabs, 键盘与 aria 由 radix 提供), 一张图时不出 tab 栏. 亮暗双图用 ThemedImage, 可选 BrowserFrame 包边.
 * 遵循 docs/architecture/component-contract.md: tab 状态三件套原样交给 radix, 不在区块里保存副本.
 */
export function Showcase({
  heading,
  items,
  features,
  frame = MV103_DEFAULT.frame,
  value,
  defaultValue,
  onValueChange,
  tabsLabel,
  labels: _labels,
  ref,
  ...shell
}: ShowcaseProps): React.JSX.Element {
  const listLabel = tabsLabel ?? (typeof heading?.title === "string" ? heading.title : undefined);
  const first = items[0];
  return (
    <BlockShell {...shell} ref={ref} heading={heading} renderHeading={renderSectionHeading}>
      <div data-slot={MV103_SLOT.showcase} className={MV103_CLASS.showcaseStack}>
        {items.length > 1 ? (
          <Tabs
            value={value}
            defaultValue={value === undefined ? (defaultValue ?? valueOf(first, 0)) : undefined}
            onValueChange={onValueChange}
            className={MV103_CLASS.showcaseTabs}
          >
            <TabsList aria-label={listLabel}>
              {items.map((item, index) => (
                <TabsTrigger key={valueOf(item, index)} value={valueOf(item, index)}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {items.map((item, index) => (
              <TabsContent key={valueOf(item, index)} value={valueOf(item, index)} className={MV103_CLASS.fullWidth}>
                <Stage item={item} frame={frame} />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          first !== undefined && <Stage item={first} frame={frame} />
        )}
        {features !== undefined && features.length > 0 && (
          <ul role="list" data-slot={MV103_SLOT.showcaseFeatures} className={MV103_CLASS.showcaseFeatures}>
            {features.map((feature, index) => (
              <li key={feature.key ?? (typeof feature.title === "string" ? feature.title : index)} className={MV103_CLASS.plainItem}>
                {feature.icon !== undefined && (
                  <span aria-hidden className={MV103_CLASS.icon}>
                    <IconSlot source={feature.icon} />
                  </span>
                )}
                <h3 className={MV103_CLASS.title}>{feature.title}</h3>
                {feature.body !== undefined && <p className={MV103_CLASS.body}>{feature.body}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </BlockShell>
  );
}
