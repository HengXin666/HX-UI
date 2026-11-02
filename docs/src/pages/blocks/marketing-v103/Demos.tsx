import type { ComponentProps, JSX } from "react";
import { BentoFeatures } from "../../../../../src/blocks/marketing/BentoFeatures";
import { FeatureAlternating } from "../../../../../src/blocks/marketing/FeatureAlternating";
import { FeatureGrid } from "../../../../../src/blocks/marketing/FeatureGrid";
import { FigureGrid } from "../../../../../src/blocks/marketing/FigureGrid";
import { Showcase } from "../../../../../src/blocks/marketing/Showcase";
import { StatBand } from "../../../../../src/blocks/marketing/StatBand";
import type { BlockPad, Media } from "../../../../../src/blocks/_shared/types";
import { BENTO_DATA, DOC_V103, FEATURE_ALT_DATA, FEATURE_GRID_DATA, FIGURE_DATA, SHOWCASE_DATA, STAT_DATA } from "./data";

/** 产品 mock: 只用语义色的柱状示意, 代替真实截图 (文档站不带图片资源). */
export function Mock({ alt = false }: { alt?: boolean }): JSX.Element {
  return (
    <div className={DOC_V103.mock}>
      {DOC_V103.bars.map((height, index) => (
        <div key={index} className={alt ? DOC_V103.mockAlt : DOC_V103.mockBar} style={{ height: `${alt ? 100 - height : height}%` }} />
      ))}
    </div>
  );
}

/** 把 JSON 里 kind="node" 的媒体补上 mock 节点. */
function withNode(media: { kind: string; alt: string }, alt = false): Media {
  return { ...media, kind: "node", node: <Mock alt={alt} /> } as Media;
}

const PAD: BlockPad = "sm";

export function FeatureGridDemo(): JSX.Element {
  return <FeatureGrid pad={PAD} {...(FEATURE_GRID_DATA as unknown as ComponentProps<typeof FeatureGrid>)} />;
}

export function FeatureAlternatingDemo(): JSX.Element {
  const items = FEATURE_ALT_DATA.items.map((item, i) => ({ ...item, bullets: [...item.bullets], ctas: [...item.ctas], media: withNode(item.media, i % 2 === 1) }));
  return <FeatureAlternating pad={PAD} heading={FEATURE_ALT_DATA.heading} mediaSide={FEATURE_ALT_DATA.mediaSide} items={items as never} />;
}

export function BentoFeaturesDemo(): JSX.Element {
  const items = BENTO_DATA.items.map((item) => ({
    ...item,
    media: "media" in item ? withNode(item.media) : undefined,
    hoverMedia: "hoverMedia" in item ? withNode(item.hoverMedia, true) : undefined,
  }));
  return <BentoFeatures pad={PAD} heading={BENTO_DATA.heading} cols={BENTO_DATA.cols} rowHeight={BENTO_DATA.rowHeight} items={items as never} />;
}

export function StatBandDemo(): JSX.Element {
  return <StatBand pad={PAD} {...(STAT_DATA as unknown as ComponentProps<typeof StatBand>)} />;
}

export function ShowcaseDemo(): JSX.Element {
  const items = SHOWCASE_DATA.items.map((item, i) => ({ ...item, media: withNode(item.media, i === 1) }));
  return <Showcase pad={PAD} heading={SHOWCASE_DATA.heading} frame={SHOWCASE_DATA.frame} items={items} features={[...SHOWCASE_DATA.features]} />;
}

export function FigureGridDemo(): JSX.Element {
  const items = FIGURE_DATA.items.map((item, i) => ({ ...item, figure: <div className={DOC_V103.figure}>{`0${i + 1}`}</div> }));
  return <FigureGrid pad={PAD} heading={FIGURE_DATA.heading} prefix={FIGURE_DATA.prefix} major={FIGURE_DATA.major} items={items} />;
}
