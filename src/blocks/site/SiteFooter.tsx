"use client";

import * as React from "react";
import { SITE_BLOCK_CLASS, SITE_BLOCK_DEFAULT, SITE_BLOCK_ID, SITE_BLOCK_SLOT } from "../../constants/blocks-site-v101";
import { BLOCK_ALIGN } from "../../constants/blocks";
import { cn } from "../../primitives/utils";
import { SiteFooter as SiteFooterPart } from "../../site/footer/SiteFooter";
import { BlockShell } from "../_shared/BlockShell";
import { containerOf, toSiteGroups, toSiteLinks, toSocialLinks, useSiteAria } from "./parts/adapt";
import { FooterBadges, FooterEnd, FooterNewsletter } from "./parts/footer-parts";
import { BrandLink } from "./parts/header-parts";
import type { SiteFooterBlockProps } from "./parts/types";

export type { SiteFooterBlockProps };

/**
 * 页脚区块 (design 4.1 SiteFooter): 品牌 + 介绍 + 订阅 + 认证徽章, 多列链接组 (lg 多列, md 以下折叠为 Accordion),
 * 底部版权 + 法务链接 + 运行状态 + 主题切换 + 语言选择 + 社交图标. 复用 src/site SiteFooter / LocaleSwitcher / ThemeSwitcher 零件.
 * 地标: 零件输出 <footer> (contentinfo), 链接组 / 法务 / 社交各自具名 (ariaLabels.footerNav / legal / social).
 * BlockBaseProps: tone 由外壳上色 (零件底色让位), width 映射零件容器档, 其余交给 BlockShell. 所有文案来自 props.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-site-v101.md
 */
export function SiteFooter({
  columns,
  brand,
  newsletter,
  social,
  legal,
  locale,
  badges,
  status,
  themeSwitch,
  copyright,
  ariaLabels,
  labels,
  id,
  className,
  style,
  classNames,
  styles,
  tone,
  pad = SITE_BLOCK_DEFAULT.pad,
  width,
  align,
  reveal,
  backdrop,
  as = SITE_BLOCK_DEFAULT.tag,
  slots,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SiteFooterBlockProps): React.JSX.Element {
  const aria = useSiteAria(labels, ariaLabels);
  const groups = React.useMemo(() => toSiteGroups(columns, SITE_BLOCK_ID.group), [columns]);
  const legalLinks = React.useMemo(() => toSiteLinks(legal, SITE_BLOCK_ID.legal), [legal]);
  const socialLinks = React.useMemo(() => toSocialLinks(social), [social]);
  const hasBrand = brand !== undefined || Boolean(badges?.length);

  return (
    <BlockShell
      id={id}
      className={className}
      style={style}
      classNames={classNames}
      styles={styles}
      tone={tone}
      pad={pad}
      width={SITE_BLOCK_DEFAULT.shellWidth}
      align={align}
      reveal={reveal}
      backdrop={backdrop}
      as={as}
      slots={slots}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <SiteFooterPart
        className={cn(SITE_BLOCK_CLASS.inherit, align === BLOCK_ALIGN.center && "text-center")}
        container={containerOf(width)}
        labels={{ nav: aria.footerNav, social: aria.social, legal: aria.legal }}
        groups={groups}
        brand={
          hasBrand ? (
            <div data-slot={SITE_BLOCK_SLOT.footerBrand} className={SITE_BLOCK_CLASS.stack}>
              {brand ? <BrandLink brand={brand} /> : null}
              <FooterBadges badges={badges} />
            </div>
          ) : undefined
        }
        description={brand?.description}
        subscribe={newsletter ? <FooterNewsletter newsletter={newsletter} /> : undefined}
        social={socialLinks}
        legal={legalLinks}
        locale={status || themeSwitch || locale ? <FooterEnd status={status} themeSwitch={themeSwitch} locale={locale} /> : undefined}
        copyright={copyright}
      />
    </BlockShell>
  );
}
