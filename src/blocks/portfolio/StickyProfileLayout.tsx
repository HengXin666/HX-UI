"use client";

import * as React from "react";
import { BLOCK_PAD, BLOCK_TAG } from "../../constants/blocks";
import { PORTFOLIO_CLASS, PORTFOLIO_SLOT, PORTFOLIO_TEXT_ZH } from "../../constants/blocks-portfolio-v111";
import { Prose } from "../../typography/Prose";
import { BlockShell } from "../_shared/BlockShell";
import type { BlockBaseProps, HeadingLevel, LinkItem, ProfileData } from "../_shared/types";
import { SocialLinks } from "./parts/SocialLinks";
import { hashTarget, useScrollSpy } from "./parts/useScrollSpy";

const NAME_TAG = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;

export interface StickyProfileAside extends ProfileData {
  /** 页内导航; href 为 "#节 id" 的项参与 scrollspy. */
  nav?: LinkItem[];
}

export interface StickyProfileLayoutProps extends BlockBaseProps {
  /** 左栏内容: 姓名 + 职位 + 简介 + 页内导航 + 社交. */
  aside: StickyProfileAside;
  /** 右栏长滚动内容 (通常是带 id 的 ExperienceTimeline / ProjectGrid / PostList). */
  children?: React.ReactNode;
  /** 姓名的标题层级, 默认 h1. */
  level?: HeadingLevel;
  navLabel?: string;
  socialLabel?: string;
  /** scrollspy 判定带 (IntersectionObserver rootMargin). */
  spyRootMargin?: string;
  /** 受控的当前节 id; 给了就不用内置 scrollspy 的结果. */
  activeId?: string;
  ref?: React.Ref<HTMLElement>;
}

/**
 * 粘性侧栏布局 (brittanychiang.com): 宽容器下左栏 sticky, 右栏自然滚动; 窄容器退化为上下堆叠并隐藏页内导航.
 * 断点用容器查询 (@5xl, 设计文档 3.3), 放进窄栏也正确.
 * 页内导航由 useScrollSpy 高亮: IntersectionObserver 观察右栏各节, 不轮询 scroll; 当前项 aria-current="location".
 * 指示线的伸缩只过渡 width, 减弱动效下无过渡.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-portfolio-v111.md
 */
export function StickyProfileLayout({
  aside,
  children,
  level = 1,
  navLabel = PORTFOLIO_TEXT_ZH.nav,
  socialLabel = PORTFOLIO_TEXT_ZH.social,
  spyRootMargin,
  activeId,
  as = BLOCK_TAG.div,
  pad = BLOCK_PAD.none,
  labels,
  classNames,
  ref,
  ...shell
}: StickyProfileLayoutProps): React.JSX.Element {
  const nav = aside.nav ?? [];
  const ids = React.useMemo(() => nav.map((item) => hashTarget(item.href)).filter((id): id is string => id !== undefined), [nav]);
  const spied = useScrollSpy(ids, { rootMargin: spyRootMargin });
  const current = activeId ?? spied;
  const Name = NAME_TAG[level];
  return (
    <BlockShell {...shell} ref={ref} as={as} pad={pad} classNames={classNames}>
      <div data-slot={PORTFOLIO_SLOT.sticky} className={PORTFOLIO_CLASS.stickyRoot}>
        <header data-slot={PORTFOLIO_SLOT.stickyAside} className={PORTFOLIO_CLASS.stickyAside}>
          <div className={PORTFOLIO_CLASS.stickyHeader}>
            <Name className={PORTFOLIO_CLASS.heroNameMinimal}>{aside.name}</Name>
            {aside.role !== undefined && <p className={PORTFOLIO_CLASS.heroRole}>{aside.role}</p>}
            {aside.bio !== undefined && (
              <Prose size="sm" className={PORTFOLIO_CLASS.heroBio}>
                {typeof aside.bio === "string" ? <p>{aside.bio}</p> : aside.bio}
              </Prose>
            )}
            {nav.length > 0 && (
              <nav data-slot={PORTFOLIO_SLOT.stickyNav} aria-label={navLabel} className={PORTFOLIO_CLASS.stickyNav}>
                <ul className={PORTFOLIO_CLASS.stickyNavList}>
                  {nav.map((item) => {
                    const target = hashTarget(item.href);
                    const isCurrent = target !== undefined ? target === current : item.current;
                    return (
                      <li key={item.href}>
                        <a href={item.href} aria-current={isCurrent ? "location" : undefined} className={PORTFOLIO_CLASS.stickyNavLink}>
                          <span aria-hidden className={PORTFOLIO_CLASS.stickyNavLine} />
                          <span>{item.label}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
          </div>
          <SocialLinks items={aside.links ?? []} label={socialLabel} labels={labels} />
        </header>
        <div data-slot={PORTFOLIO_SLOT.stickyMain} className={PORTFOLIO_CLASS.stickyMain}>
          {children}
        </div>
      </div>
    </BlockShell>
  );
}
