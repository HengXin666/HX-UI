import type { JSX } from "react";
import { PageComposer } from "../../../../../src/blocks/_shared";
import type { BlockRegistry, BlockWidth } from "../../../../../src/blocks/_shared/types";
import { ExperienceTimeline, PostList, ProfileHero, ProjectGrid, StickyProfileLayout, type StickyProfileAside } from "../../../../../src/blocks/portfolio";
import { SiteFooter } from "../../../../../src/blocks/site";
import { SkinSwitcher, type TemplateSkin } from "../shared/template-skins";
import { PORTFOLIO_BLOCKS, type PortfolioSections } from "./data";

interface PortfolioBodyProps {
  id?: string;
  aside: StickyProfileAside;
  sections: PortfolioSections;
  width?: BlockWidth;
}

/**
 * 粘性双栏主体 (brittanychiang.com 型): 左栏姓名 + 页内导航 + 社交, 右栏依次是经历, 项目, 文章.
 * 只把数据转交给区块; 姓名在 ProfileHero 里已是 h1, 侧栏降为 h2.
 */
function PortfolioBody({ id, aside, sections, width }: PortfolioBodyProps): JSX.Element {
  return (
    <StickyProfileLayout id={id} aside={aside} level={2} width={width}>
      <ExperienceTimeline {...sections.experience} />
      <ProjectGrid {...sections.projects} />
      <PostList {...sections.posts} />
    </StickyProfileLayout>
  );
}

const PORTFOLIO_REGISTRY: BlockRegistry = { ProfileHero, PortfolioBody, SiteFooter };

/** 个人主页整页: PageComposer 按 data.ts 的区块序列渲染, skin 写到根节点 data-skin. */
export function PortfolioPage({ skin }: { skin?: TemplateSkin }): JSX.Element {
  return <PageComposer blocks={PORTFOLIO_BLOCKS} registry={PORTFOLIO_REGISTRY} skin={skin} />;
}

/** 文档站用的模板页: 皮肤切换条 (default / mono / linear) + 整页. */
export function TemplatePortfolioPage(): JSX.Element {
  return <SkinSwitcher>{(skin) => <PortfolioPage skin={skin} />}</SkinSwitcher>;
}
