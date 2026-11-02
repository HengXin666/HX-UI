"use client";

import * as React from "react";
import { BUTTON_TYPE } from "../../constants";
import { BLOCK_ALIGN, BLOCK_TONE, BLOCK_WIDTH } from "../../constants/blocks";
import { HERO_CLASS, HERO_FRAME, HERO_LAYOUT, HERO_MEDIA_SIDE, MV102_CLASS, MV102_DEFAULT, MV102_SLOT } from "../../constants/blocks-marketing-v102";
import { BrowserFrame } from "../../media/frames/browser-frame";
import { MaskFade } from "../../effects/MaskFade";
import { RotatingText } from "../../motion/RotatingText";
import { Button } from "../../primitives/button";
import { cn } from "../../primitives/utils";
import { Display } from "../../typography/Display";
import { Eyebrow } from "../../typography/Eyebrow";
import { Lead } from "../../typography/Lead";
import { BlockShell } from "../_shared/BlockShell";
import { useBlockLabels } from "../_shared/BlocksProvider";
import { CtaGroup } from "../_shared/SectionHeading";
import type { BlockBaseProps, BlockTitleSize, Cta, HeadingLevel, Logo, Media, Rich } from "../_shared/types";
import { LogoMark, MediaView, resolveBackdrop } from "./parts";

type ValueOf<T> = T[keyof T];
export type HeroLayout = ValueOf<typeof HERO_LAYOUT>;

export interface HeroPill {
  label: Rich;
  href?: string;
  /** 胶囊内前置的小徽标 ("New"). */
  badge?: Rich;
}

export interface HeroTrust {
  logos?: Logo[];
  text?: Rich;
}

export interface HeroProps extends BlockBaseProps {
  /** 版式, 默认 centered. */
  layout?: HeroLayout;
  eyebrow?: Rich;
  /** 事件胶囊 (resend "What you missed ...", shadcn 公告). */
  pill?: HeroPill;
  title: Rich;
  /** 标题第二行的轮换词 (shopify, vercel). 一个词时等同静态. */
  rotate?: string[];
  /** 轮换停留时长 (ms). */
  rotateInterval?: number;
  lead?: Rich;
  /** 通常一主一次两个. */
  ctas?: Cta[];
  /** 安装命令 (tailwind / nextjs). */
  command?: string;
  /** 分屏与产品版式的媒体; media-bg / video-bg 的背景. */
  media?: Media;
  /** 产品 mock 节点 (linear / shadcn 的 DOM 产品界面), 优先于 media. */
  mockup?: React.ReactNode;
  /** 媒体外框: none / browser. */
  frame?: ValueOf<typeof HERO_FRAME>;
  /** 浏览器外框地址栏文字. */
  frameAddress?: Rich;
  /** 分屏媒体位置. */
  mediaSide?: ValueOf<typeof HERO_MEDIA_SIDE>;
  /** 媒体底 / 视频底是否加压暗渐变, 保证文字对比. 默认 true. */
  scrim?: boolean;
  trust?: HeroTrust;
  titleSize?: BlockTitleSize;
  titleLevel?: HeadingLevel;
}

const TAG = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;

function Pill({ pill }: { pill: HeroPill }): React.JSX.Element {
  const inner = (
    <>
      {pill.badge !== undefined && <span className={HERO_CLASS.pillBadge}>{pill.badge}</span>}
      <span>{pill.label}</span>
    </>
  );
  return pill.href ? (
    <a data-slot={MV102_SLOT.heroPill} href={pill.href} className={HERO_CLASS.pill}>
      {inner}
    </a>
  ) : (
    <span data-slot={MV102_SLOT.heroPill} className={HERO_CLASS.pill}>
      {inner}
    </span>
  );
}

function Trust({ trust, centered }: { trust: HeroTrust; centered: boolean }): React.JSX.Element {
  return (
    <div data-slot={MV102_SLOT.heroTrust} className={cn(HERO_CLASS.trust, centered && HERO_CLASS.trustCenter)}>
      {trust.text !== undefined && <p className={HERO_CLASS.trustText}>{trust.text}</p>}
      {trust.logos && trust.logos.length > 0 && (
        <ul className={cn(HERO_CLASS.trustLogos, centered && MV102_CLASS.justifyCenter)}>
          {trust.logos.map((logo) => (
            <li key={logo.name}>
              <LogoMark logo={logo} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 背景视频的暂停 / 播放按钮 (WCAG 2.2.2). 背景层不可交互, 所以按钮放在内容层. */
function VideoToggle({ videoRef, playing, overrides }: { videoRef: React.RefObject<HTMLVideoElement | null>; playing: boolean; overrides?: HeroProps["labels"] }): React.JSX.Element {
  const labels = { ...useBlockLabels(), ...overrides };
  const toggle = (): void => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };
  return (
    <Button type={BUTTON_TYPE} variant="outline" size="sm" data-slot={MV102_SLOT.heroVideoToggle} aria-pressed={!playing} onClick={toggle} className={HERO_CLASS.videoToggle}>
      {playing ? labels.pause : labels.play}
    </Button>
  );
}

/**
 * Hero: 首屏区块. 五种版式覆盖 shopify (media-bg + 轮换词), vercel (centered + beam + 截图),
 * stripe (media-bg 或 centered + mesh), resend (media-bg + pill + beam), astro (centered + 渐变),
 * linear / apple (product), framer (video-bg).
 * 文案全部来自 props; 背景 mesh / grain / beam / image 经 parts.resolveBackdrop 落成效果层.
 */
export function Hero(props: HeroProps): React.JSX.Element {
  const {
    layout = MV102_DEFAULT.heroLayout,
    eyebrow, pill, title, rotate, rotateInterval, lead, ctas, command, media, mockup,
    frame = MV102_DEFAULT.heroFrame, frameAddress, mediaSide = MV102_DEFAULT.heroMediaSide,
    scrim = MV102_DEFAULT.heroScrim, trust,
    titleSize = MV102_DEFAULT.heroTitleSize, titleLevel = MV102_DEFAULT.heroTitleLevel,
    backdrop, tone, align, width, pad = MV102_DEFAULT.heroPad, slots, labels, ...shell
  } = props;
  const isBg = layout === HERO_LAYOUT.mediaBg || layout === HERO_LAYOUT.videoBg;
  const isSplit = layout === HERO_LAYOUT.split;
  const resolvedAlign = align ?? (isSplit ? BLOCK_ALIGN.start : BLOCK_ALIGN.center);
  const centered = resolvedAlign === BLOCK_ALIGN.center;
  const titleId = React.useId();
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = React.useState(false);

  const bgMedia = isBg && media ? (
    <>
      <MediaView
        media={{ ...media, alt: layout === HERO_LAYOUT.videoBg ? media.alt : "", kind: layout === HERO_LAYOUT.videoBg ? "video" : media.kind }}
        fill
        hideVideoToggle
        videoRef={videoRef}
        onVideoPlay={() => setPlaying(true)}
        onVideoPause={() => setPlaying(false)}
      />
      {scrim && <span className={tone === BLOCK_TONE.inverted ? MV102_CLASS.scrimInverted : MV102_CLASS.scrim} />}
    </>
  ) : null;
  const effect = resolveBackdrop(backdrop);
  const layered = bgMedia ? (
    <>
      {bgMedia}
      {effect}
    </>
  ) : effect;

  const text = (
    <div data-slot={MV102_SLOT.heroText} className={cn(HERO_CLASS.text, centered ? HERO_CLASS.textCenter : HERO_CLASS.textStart)}>
      {pill && <Pill pill={pill} />}
      {eyebrow !== undefined && (
        <Eyebrow data-slot={MV102_SLOT.heroEyebrow} tone="primary">
          {eyebrow}
        </Eyebrow>
      )}
      <Display as={TAG[titleLevel]} id={titleId} size={titleSize} data-slot={MV102_SLOT.heroTitle}>
        {title}
        {rotate && rotate.length > 0 && (
          <span data-slot={MV102_SLOT.heroRotate} className={HERO_CLASS.rotateLine}>
            <RotatingText words={rotate} interval={rotateInterval} />
          </span>
        )}
      </Display>
      {lead !== undefined && (
        <Lead data-slot={MV102_SLOT.heroLead} measure="default">
          {lead}
        </Lead>
      )}
      {ctas && ctas.length > 0 && <CtaGroup items={ctas} classNames={{ root: centered ? MV102_CLASS.justifyCenter : undefined }} />}
      {command && (
        <code data-slot={MV102_SLOT.heroCommand} className={HERO_CLASS.command}>
          <span aria-hidden className={HERO_CLASS.commandPrompt}>
            {MV102_DEFAULT.commandPrompt}
          </span>
          {command}
        </code>
      )}
      {layout === HERO_LAYOUT.videoBg && media && <VideoToggle videoRef={videoRef} playing={playing} overrides={labels} />}
      {trust && <Trust trust={trust} centered={centered} />}
    </div>
  );

  const visualInner = slots?.media ?? mockup ?? (media && !isBg ? <MediaView media={{ priority: true, ...media }} /> : null);
  const framed = visualInner && frame === HERO_FRAME.browser ? <BrowserFrame address={frameAddress}>{visualInner}</BrowserFrame> : visualInner;
  const visual = framed ? (
    <div data-slot={MV102_SLOT.heroMedia} className={cn(layout === HERO_LAYOUT.product ? HERO_CLASS.productMedia : undefined, isSplit && mediaSide === HERO_MEDIA_SIDE.start && HERO_CLASS.splitMediaStart)}>
      {layout === HERO_LAYOUT.product ? <MaskFade direction="bottom">{framed}</MaskFade> : framed}
    </div>
  ) : null;

  let body: React.ReactNode;
  if (isSplit) body = <div className={HERO_CLASS.split}>{text}{visual}</div>;
  else if (layout === HERO_LAYOUT.product) body = <div className={HERO_CLASS.product}>{text}{visual}</div>;
  else if (isBg) body = <div className={HERO_CLASS.bgMinHeight}>{text}</div>;
  else body = text;

  return (
    <BlockShell
      {...shell}
      tone={tone ?? (isBg ? BLOCK_TONE.image : undefined)}
      align={resolvedAlign}
      width={width ?? (isSplit ? BLOCK_WIDTH.wide : undefined)}
      pad={pad}
      backdrop={layered}
      slots={{ before: slots?.before, after: slots?.after }}
      aria-labelledby={shell["aria-labelledby"] ?? (shell["aria-label"] ? undefined : titleId)}
    >
      <div data-slot={MV102_SLOT.hero} data-layout={layout}>
        {body}
      </div>
    </BlockShell>
  );
}
