import type * as React from "react";
import { HERO_PAD_TOP_PROP, HERO_PAD_TOP_VAR, type HERO_PAD_TOP } from "../../constants/blocks-marketing-v102";

export type HeroPadTop = (typeof HERO_PAD_TOP)[keyof typeof HERO_PAD_TOP];

/**
 * N13: 把 padTop 落成 Hero 根节点的 inline style. 档位映射 tokens.css 的 --hero-pad-top-*,
 * 数字按 px; 写进 --hero-pad-top 再由 padding-top 读取. inline style 优先于 pad 的 py 类,
 * 所以只改 Hero 顶部, 底部仍走 pad, --section-pad-* 与其它区块不受影响.
 */
export function heroPadTopStyle(padTop: HeroPadTop | number | undefined, style?: React.CSSProperties): React.CSSProperties | undefined {
  if (padTop === undefined) return style;
  const value = typeof padTop === "number" ? `${padTop}px` : HERO_PAD_TOP_VAR[padTop];
  return { [HERO_PAD_TOP_PROP.name]: value, paddingTop: HERO_PAD_TOP_PROP.value, ...style } as React.CSSProperties;
}
