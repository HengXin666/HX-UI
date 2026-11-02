import type { JSX } from "react";
import { CaseStudies, type CaseStudiesProps } from "../../../../../src/blocks/marketing/CaseStudies";
import { ChangelogList, type ChangelogListProps } from "../../../../../src/blocks/marketing/ChangelogList";
import { Testimonials, type TestimonialsProps } from "../../../../../src/blocks/marketing/Testimonials";
import { TweetWall } from "../../../../../src/blocks/marketing/TweetWall";
import type { BlockPad, Media } from "../../../../../src/blocks/_shared/types";
import { CASE_STUDIES_DATA, CHANGELOG_DATA, DOC_V104, TESTIMONIALS_DATA, TWEET_WALL_DATA } from "./data";

const PAD: BlockPad = "sm";

/** 产品 mock: 只用语义色的柱状示意, 代替真实截图. */
export function Mock(): JSX.Element {
  return (
    <div className={DOC_V104.mock}>
      {DOC_V104.bars.map((height, index) => (
        <div key={index} className={DOC_V104.mockBar} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

/** 把 JSON 里 kind="node" 的媒体补上 mock 节点. */
function withNode(media?: Media): Media | undefined {
  return media && media.kind === "node" ? { ...media, node: <Mock /> } : media;
}

export function TestimonialsDemo({ data = TESTIMONIALS_DATA }: { data?: TestimonialsProps }): JSX.Element {
  return <Testimonials pad={PAD} {...data} />;
}

export function CaseStudiesDemo({ data = CASE_STUDIES_DATA }: { data?: CaseStudiesProps }): JSX.Element {
  const items = data.items.map((item) => ({ ...item, media: withNode(item.media) }));
  return <CaseStudies pad={PAD} {...data} items={items} />;
}

export function ChangelogListDemo({ data = CHANGELOG_DATA }: { data?: ChangelogListProps }): JSX.Element {
  return <ChangelogList pad={PAD} {...data} />;
}

export function TweetWallDemo(): JSX.Element {
  return <TweetWall pad={PAD} {...TWEET_WALL_DATA} />;
}
