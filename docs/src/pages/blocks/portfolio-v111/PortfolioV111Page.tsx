import type { JSX } from "react";
import { PORTFOLIO_DOC } from "../../../../../src/constants/blocks-portfolio-v111";
import { ProfileHero, ProjectGrid } from "../../../../../src/blocks/portfolio";
import { Callout, Code, CodeBlock, H2, P, Preview } from "../../../components/DocKit";
import { useDemoImages } from "../../../components/MediaDemo";
import { PortfolioHomeDemo } from "./PortfolioHomeDemo";
import {
  PORTFOLIO_DEMO_EXPERIENCE,
  PORTFOLIO_DEMO_NAV,
  PORTFOLIO_DEMO_POSTS,
  PORTFOLIO_DEMO_PROFILE,
  PORTFOLIO_DEMO_PROJECTS,
  withImages,
} from "./portfolioDemoData";

const HOME_CODE = `<StickyProfileLayout aside={{ ...profile, nav }}>
  <ProfileHero id="about" layout="minimal" name="关于" pad="sm" width="full">…</ProfileHero>
  <ExperienceTimeline id="experience" heading={{ title: "经历" }} items={experience} limit={3} pad="sm" width="full" />
  <ProjectGrid id="projects" heading={{ title: "项目" }} items={projects} pad="sm" width="full" />
  <PostList id="writing" heading={{ title: "文章" }} items={posts} rssHref="/rss.xml" allPosts={{ label: "全部文章", href: "/blog" }} pad="sm" width="full" />
</StickyProfileLayout>`;

const JSON_EXAMPLE = JSON.stringify(
  {
    aside: { ...PORTFOLIO_DEMO_PROFILE, nav: PORTFOLIO_DEMO_NAV },
    experience: PORTFOLIO_DEMO_EXPERIENCE.slice(0, 2),
    projects: PORTFOLIO_DEMO_PROJECTS.slice(0, 2).map((p, i) => ({ ...p, media: { src: `/img/project-${i + 1}.webp`, alt: p.title, ratio: "16/9" } })),
    posts: PORTFOLIO_DEMO_POSTS.slice(0, 2),
  },
  null,
  2,
);

/**
 * V1-11 作品集区块文档页: 完整个人主页拼装, 三种 ProfileHero 版式, ProjectGrid 两档, JSON 数据示例, 三皮肤演示.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-portfolio-v111.md
 */
export function PortfolioV111Page(): JSX.Element {
  const images = useDemoImages(PORTFOLIO_DOC.imageLabels);
  const [avatar] = useDemoImages(PORTFOLIO_DOC.avatarLabel);
  const projects = withImages(PORTFOLIO_DEMO_PROJECTS, images.map((img) => img.src));
  return (
    <>
      <P>
        个人主页与作品集区块: <Code>ProfileHero</Code>, <Code>StickyProfileLayout</Code>, <Code>ExperienceTimeline</Code>,
        <Code>ProjectGrid</Code>, <Code>PostList</Code>, 外加 rauno.me 式的 <Code>HoverPreviewLink</Code>. 全部只吃数据, 颜色与尺寸来自令牌.
      </P>
      <Callout title="容器查询">
        粘性左栏在区块容器 ≥ @5xl 时生效, 更窄时上下堆叠并隐藏页内导航; scrollspy 由 IntersectionObserver 驱动, 不监听 scroll.
      </Callout>

      <H2>完整个人主页</H2>
      <Preview align="stretch" code={HOME_CODE}>
        <div className={PORTFOLIO_DOC.stage}>
          <PortfolioHomeDemo idPrefix="pf-" />
        </div>
      </Preview>

      <H2>ProfileHero 三种版式</H2>
      <Preview align="stretch" code={`<ProfileHero layout="start" name="…" role="…" bio="…" avatar={avatar} links={links} backdrop={{ variant: "grid", mask: { fade: "radial" } }} />`}>
        <div className={PORTFOLIO_DOC.skinGrid}>
          <ProfileHero {...PORTFOLIO_DEMO_PROFILE} level={3} layout="start" pad="sm" avatar={avatar ? { src: avatar.src, alt: "" } : undefined} backdrop={{ variant: "grid", mask: { fade: "radial" } }} />
          <ProfileHero {...PORTFOLIO_DEMO_PROFILE} level={3} layout="centered" pad="sm" tone="muted" avatar={avatar ? { src: avatar.src, alt: "" } : undefined} />
          <ProfileHero {...PORTFOLIO_DEMO_PROFILE} level={3} layout="minimal" pad="sm" width="narrow" />
        </div>
      </Preview>

      <H2>ProjectGrid 列表档</H2>
      <Preview align="stretch" code={`<ProjectGrid layout="list" items={projects} featuredFirst />`}>
        <ProjectGrid layout="list" items={projects} featuredFirst pad="sm" width="full" />
      </Preview>

      <H2>JSON 数据示例</H2>
      <P>所有字段都可 JSON 序列化, 适合 PageComposer 或 CMS 直接生成; 图标用 Iconify 类串.</P>
      <CodeBlock code={JSON_EXAMPLE} lang="json" />

      <H2>三皮肤演示</H2>
      <P>同一份数据在 default / mono / retail 三套皮肤下渲染, 区块不感知皮肤名, 外观差异全部来自令牌.</P>
      <div className={PORTFOLIO_DOC.skinGrid}>
        {PORTFOLIO_DOC.skins.map((skin) => (
          <div key={skin} data-skin={skin} className={PORTFOLIO_DOC.skinFrame}>
            <p className={PORTFOLIO_DOC.skinTag}>data-skin="{skin}"</p>
            <PortfolioHomeDemo compact idPrefix={`pf-${skin}-`} />
          </div>
        ))}
      </div>
    </>
  );
}
