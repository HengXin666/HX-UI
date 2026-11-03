"use client";

import * as React from "react";
import { EXTERNAL_LINK } from "../../../constants/blocks";
import { RATIO_SEPARATOR, SOCIAL_CLASS, SOCIAL_DEFAULT, SOCIAL_SLOT } from "../../../constants/blocks-marketing-v104";
import { Image } from "../../../media/image/image";
import { ThemedImage } from "../../../media/image/themed-image";
import { Avatar, AvatarFallback, AvatarImage } from "../../../primitives/avatar";
import { cn } from "../../../primitives/utils";
import type { Logo, Media, Person } from "../../_shared/types";

/**
 * 社证区块 (Testimonials / CaseStudies / ChangelogList / TweetWall) 共用的小零件:
 * logo (亮暗双图), 评分, 人物行, 媒体. 只认 _shared/types 的内容类型, 不定义新类型.
 */

/** 链接属性: 外链补 target 与 rel. */
export function linkProps(href: string, external?: boolean): React.AnchorHTMLAttributes<HTMLAnchorElement> {
  return external ? { href, ...EXTERNAL_LINK } : { href };
}

/** logo: 有 darkSrc / srcDark 时两张图按祖先 data-mode 切换; 有 href 时包成链接. */
export function LogoMark({
  logo,
  href,
  decorative = false,
  className,
}: {
  logo: Logo;
  href?: string;
  /** 旁边已有名字 (标题, 读屏文字) 时置 true, 图片 alt 为空, 避免重复朗读. */
  decorative?: boolean;
  className?: string;
}): React.JSX.Element {
  const dark = logo.darkSrc ?? logo.srcDark;
  const alt = decorative ? "" : logo.name;
  const img = (src: string, extra?: string) => (
    <img
      src={src}
      alt={alt}
      width={logo.width}
      height={logo.height}
      loading="lazy"
      decoding="async"
      className={cn(SOCIAL_CLASS.logo, extra, className)}
    />
  );
  const src = logo.src;
  const body =
    logo.node !== undefined ? logo.node : src === undefined ? logo.name : dark ? (
      <>
        {img(src, SOCIAL_CLASS.logoLight)}
        {img(dark, SOCIAL_CLASS.logoDark)}
      </>
    ) : (
      img(src)
    );
  const target = logo.href ?? href;
  if (!target) return <span data-slot={SOCIAL_SLOT.logo} className={SOCIAL_CLASS.logoLink}>{body}</span>;
  return (
    <a data-slot={SOCIAL_SLOT.logo} className={SOCIAL_CLASS.logoLink} {...linkProps(target, true)}>
      {body}
    </a>
  );
}

/** 评分: 星形图标 + 读屏的 "值/满分" (纯数字, 不含语言文案). 值超界时夹到 0..max, 四舍五入到整星. */
export function Rating({ value, max = SOCIAL_DEFAULT.ratingMax }: { value: number; max?: number }): React.JSX.Element {
  const clamped = Math.min(Math.max(value, 0), max);
  const filled = Math.round(clamped);
  return (
    <span role="img" aria-label={`${clamped}/${max}`} data-slot={SOCIAL_SLOT.rating} className={SOCIAL_CLASS.rating}>
      {Array.from({ length: max }, (_, index) => (
        <span key={index} aria-hidden className={index < filled ? SOCIAL_CLASS.starOn : SOCIAL_CLASS.starOff} />
      ))}
    </span>
  );
}

/** 姓名首字母 (拉丁取前两个词首字母, 中日韩取首字). */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, SOCIAL_DEFAULT.maxInitials)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toUpperCase();
}

/** 人物行: 头像 + 姓名 (可链接) + 职位 · 公司. 名字与职位过长时单行截断, 不撑破卡片. */
export function PersonLine({
  person,
  href,
  extra,
  className,
}: {
  person: Person;
  href?: string;
  extra?: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  const target = person.href ?? href;
  const hasMeta = person.role !== undefined || person.company !== undefined;
  return (
    <div data-slot={SOCIAL_SLOT.person} className={cn(SOCIAL_CLASS.person, className)}>
      <Avatar className={SOCIAL_CLASS.avatar}>
        {person.avatar?.src && <AvatarImage src={person.avatar.src} alt={person.avatar.alt} />}
        <AvatarFallback aria-hidden>{initials(person.name)}</AvatarFallback>
      </Avatar>
      <div className={SOCIAL_CLASS.personText}>
        {target ? (
          <a className={SOCIAL_CLASS.personLink} {...linkProps(target, true)}>{person.name}</a>
        ) : (
          <span className={SOCIAL_CLASS.personName}>{person.name}</span>
        )}
        {hasMeta && (
          <span className={SOCIAL_CLASS.personMeta}>
            {person.role}
            {person.role !== undefined && person.company !== undefined && <span aria-hidden className={SOCIAL_CLASS.separator}>·</span>}
            {person.company}
          </span>
        )}
        {extra}
      </div>
    </div>
  );
}

/** Media.ratio ("16/9" 或数字) -> 数字. */
export function ratioOf(media: Media): number {
  const { ratio } = media;
  if (typeof ratio === "number" && ratio > 0) return ratio;
  if (typeof ratio === "string") {
    const [w, h] = ratio.split(RATIO_SEPARATOR).map(Number);
    if (w > 0 && h > 0) return w / h;
  }
  return SOCIAL_DEFAULT.mediaRatio;
}

/** 媒体: node 直出; 图片走 media 原语 (懒加载, 比例盒防 CLS, 亮暗双图); 视频只取封面. */
export function MediaView({ media, className }: { media: Media; className?: string }): React.JSX.Element | null {
  if (media.kind === "node") return <div className={cn(SOCIAL_CLASS.media, className)}>{media.node}</div>;
  const src = media.kind === "video" ? media.poster : media.src;
  if (!src) return null;
  const dark = media.darkSrc ?? media.srcDark;
  const common = {
    alt: media.alt,
    ratio: ratioOf(media),
    priority: media.priority,
    sizes: media.sizes,
    objectPosition: media.focal ? `${media.focal[0] * 100}% ${media.focal[1] * 100}%` : undefined,
    rootClassName: cn(SOCIAL_CLASS.media, className),
  };
  if (dark && media.kind !== "video") return <ThemedImage {...common} lightSrc={src} darkSrc={dark} />;
  return <Image {...common} src={src} srcSet={media.srcSet} />;
}
