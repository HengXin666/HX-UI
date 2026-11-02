import type { JSX } from "react";
import { PORTFOLIO_DOC } from "../../../../../src/constants/blocks-portfolio-v111";
import { ExperienceTimeline, HoverPreviewLink, PostList, ProfileHero, ProjectGrid, StickyProfileLayout } from "../../../../../src/blocks/portfolio";
import { Prose } from "../../../../../src/typography/Prose";
import { useDemoImages } from "../../../components/MediaDemo";
import { PORTFOLIO_DEMO_EXPERIENCE, PORTFOLIO_DEMO_NAV, PORTFOLIO_DEMO_POSTS, PORTFOLIO_DEMO_PROFILE, PORTFOLIO_DEMO_PROJECTS, withImages } from "./portfolioDemoData";

/**
 * 完整个人主页 (brittanychiang.com 型): StickyProfileLayout 左栏粘性 + 右栏
 * ProfileHero(minimal) → ExperienceTimeline → ProjectGrid → PostList. 区块全部 pad="sm" width="full", 放进右栏.
 * compact 为真时只给三皮肤演示用的短版本 (无粘性导航之外的长内容).
 */
export function PortfolioHomeDemo({ compact = false, idPrefix = "" }: { compact?: boolean; idPrefix?: string }): JSX.Element {
  const images = useDemoImages(PORTFOLIO_DOC.imageLabels);
  const projects = withImages(PORTFOLIO_DEMO_PROJECTS, images.map((img) => img.src));
  const nav = PORTFOLIO_DEMO_NAV.map((item) => ({ ...item, href: `#${idPrefix}${item.href.slice(1)}` }));
  const id = (href: string): string => `${idPrefix}${href.slice(1)}`;
  const [about, experience, work, writing] = PORTFOLIO_DEMO_NAV.map((item) => id(item.href));
  return (
    <StickyProfileLayout aside={{ ...PORTFOLIO_DEMO_PROFILE, nav }} level={2} width="full">
      <ProfileHero id={about} layout="minimal" level={3} name="关于" pad="sm" width="full">
        <Prose size="md">
          <p>
            目前在 <HoverPreviewLink href="https://example.com" external preview={{ src: images[0]?.src, alt: "Atlas" }}>Atlas</HoverPreviewLink> 做设计系统,
            之前在 <HoverPreviewLink href="https://example.com" external preview={{ src: images[1]?.src, alt: "Lumen" }}>Lumen</HoverPreviewLink> 写文档站.
          </p>
        </Prose>
      </ProfileHero>
      <ExperienceTimeline
        id={experience}
        heading={{ title: "经历" }}
        items={PORTFOLIO_DEMO_EXPERIENCE}
        limit={compact ? 2 : PORTFOLIO_DOC.timelineLimit}
        pad="sm"
        width="full"
      />
      <ProjectGrid id={work} heading={{ title: "项目" }} items={compact ? projects.slice(0, 2) : projects} layout={compact ? "list" : "grid"} pad="sm" width="full" />
      <PostList
        id={writing}
        heading={{ title: "文章" }}
        items={PORTFOLIO_DEMO_POSTS}
        limit={compact ? 2 : PORTFOLIO_DOC.postLimit}
        rssHref="#rss"
        allPosts={{ label: "全部文章", href: "#posts" }}
        pad="sm"
        width="full"
      />
    </StickyProfileLayout>
  );
}
