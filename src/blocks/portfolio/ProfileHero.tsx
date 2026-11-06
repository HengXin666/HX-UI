"use client";

import * as React from "react";
import { BLOCK_ALIGN, BLOCK_CLASS } from "../../constants/blocks";
import { PORTFOLIO_CLASS, PORTFOLIO_DEFAULT, PORTFOLIO_HERO_LAYOUT, PORTFOLIO_SLOT, PORTFOLIO_TEXT_ZH } from "../../constants/blocks-portfolio-v111";
import { cn } from "../../primitives/utils";
import { Prose } from "../../typography/Prose";
import { BlockShell } from "../_shared/BlockShell";
import type { BlockBaseProps, HeadingLevel, ProfileData, ProfileHeroLayout } from "../_shared/types";
import { PortfolioMedia } from "./parts/PortfolioMedia";
import { SocialLinks } from "./parts/SocialLinks";

const NAME_TAG = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;

export interface ProfileHeroProps extends BlockBaseProps, ProfileData {
  /** start 左对齐 (默认), centered 居中, minimal 只有文字 (不渲染头像与背景层). */
  layout?: ProfileHeroLayout;
  /** 姓名的标题层级, 默认 h1 (首屏). 放进侧栏等非首屏位置时可降级. */
  level?: HeadingLevel;
  /** 社交链接列表的可访问名称. */
  socialLabel?: string;
  /** 额外节点 (按钮组, 状态徽标), 渲染在社交链接之后. */
  children?: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
}

/**
 * 个人介绍首屏: 姓名 (大标题) + 职位 + 一句介绍 (Prose) + 社交链接 + 可选头像与背景层.
 * layout=minimal 对应 leerob.com 的纯排版版式: 小号姓名, 无头像, 忽略 backdrop.
 * 头像走 src/media/Image; 背景效果走 BlockShell 的 backdrop.
 */
export function ProfileHero({
  name,
  role,
  bio,
  avatar,
  links = [],
  layout = PORTFOLIO_DEFAULT.heroLayout,
  level = 1,
  socialLabel = PORTFOLIO_TEXT_ZH.social,
  children,
  backdrop,
  align,
  labels,
  ref,
  ...shell
}: ProfileHeroProps): React.JSX.Element {
  const minimal = layout === PORTFOLIO_HERO_LAYOUT.minimal;
  const centered = layout === PORTFOLIO_HERO_LAYOUT.centered;
  const Name = NAME_TAG[level];
  const nameId = React.useId();
  const showAvatar = !minimal && avatar !== undefined;
  const text = (
    <div className={cn(PORTFOLIO_CLASS.heroText, centered ? PORTFOLIO_CLASS.heroCentered : PORTFOLIO_CLASS.heroStart)}>
      <Name id={nameId} data-slot={PORTFOLIO_SLOT.heroName} className={cn(minimal ? PORTFOLIO_CLASS.heroNameMinimal : cn(BLOCK_CLASS.displayType, PORTFOLIO_CLASS.heroName))}>
        {name}
      </Name>
      {role !== undefined && (
        <p data-slot={PORTFOLIO_SLOT.heroRole} className={PORTFOLIO_CLASS.heroRole}>
          {role}
        </p>
      )}
      {bio !== undefined && (
        <Prose data-slot-part={PORTFOLIO_SLOT.heroBio} className={PORTFOLIO_CLASS.heroBio}>
          {typeof bio === "string" ? <p>{bio}</p> : bio}
        </Prose>
      )}
    </div>
  );
  return (
    <BlockShell
      {...shell}
      ref={ref}
      align={align ?? (centered ? BLOCK_ALIGN.center : BLOCK_ALIGN.start)}
      backdrop={minimal ? undefined : backdrop}
      aria-labelledby={shell["aria-labelledby"] ?? (shell["aria-label"] === undefined ? nameId : undefined)}
    >
      <div data-slot={PORTFOLIO_SLOT.hero} data-layout={layout} className={cn(PORTFOLIO_CLASS.heroRoot, centered ? PORTFOLIO_CLASS.heroCentered : PORTFOLIO_CLASS.heroStart)}>
        {showAvatar ? (
          <div className={cn(PORTFOLIO_CLASS.heroRow, centered && PORTFOLIO_CLASS.heroCentered)}>
            <div data-slot={PORTFOLIO_SLOT.heroAvatar} className={PORTFOLIO_CLASS.avatar}>
              <PortfolioMedia media={{ ...avatar, priority: avatar.priority ?? true }} ratio={PORTFOLIO_DEFAULT.avatarRatio} />
            </div>
            {text}
          </div>
        ) : (
          text
        )}
        <SocialLinks items={links} label={socialLabel} labels={labels} />
        {children}
      </div>
    </BlockShell>
  );
}
