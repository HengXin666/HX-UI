import type * as React from "react";
import { HERO_CLASS, MV102_SLOT } from "../../constants/blocks-marketing-v102";

export interface HeroEditorialProps {
  /** 左列: pill / eyebrow / 标题. */
  head: React.ReactNode;
  /** 右列: lead / CTA / 命令 / 信任条. */
  aside: React.ReactNode;
}

/**
 * Hero 的 editorial 版式 (N1): 标题左, 导语右, 导语首行与标题末行基线对齐.
 * 原理: 网格 items-baseline 按各列 "首基线" 对齐; 左列把内容包进 inline-block,
 * 而 inline-block 的基线取它的最后一个行盒, 所以左列首基线 = h1 末行基线;
 * 右列是 flex 列, 首基线取第一个子项 (lead) 的第一行. 两者因此落在同一条基线上.
 * 窄容器 (< @3xl) 单列堆叠, 不做基线对齐.
 */
export function HeroEditorial({ head, aside }: HeroEditorialProps): React.JSX.Element {
  return (
    <div className={HERO_CLASS.editorial}>
      <div data-slot={MV102_SLOT.heroText} className={HERO_CLASS.editorialHead}>
        <div className={HERO_CLASS.editorialHeadInner}>{head}</div>
      </div>
      <div data-slot={MV102_SLOT.heroAside} className={HERO_CLASS.editorialAside}>
        {aside}
      </div>
    </div>
  );
}
