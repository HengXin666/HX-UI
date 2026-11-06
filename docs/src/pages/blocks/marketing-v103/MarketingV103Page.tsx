import type { JSX, ReactNode } from "react";
import { BlocksProvider } from "../../../../../src/blocks/_shared/BlocksProvider";
import { Callout, Code, CodeBlock, H2, P, Preview } from "../../../components/DocKit";
import { BENTO_DATA, DOC_V103, FEATURE_ALT_DATA, FEATURE_GRID_DATA, FIGURE_DATA, SHOWCASE_DATA, STAT_DATA } from "./data";
import { BentoFeaturesDemo, FeatureAlternatingDemo, FeatureGridDemo, FigureGridDemo, ShowcaseDemo, StatBandDemo } from "./Demos";
import { SkinTriptych } from "./SkinTriptych";

const JSON_INDENT = 2;

/** 一个区块的文档段: 说明 + 预览 (代码标签页给 JSON 数据) . */
function Section({ title, children, data, demo }: { title: string; children: ReactNode; data: unknown; demo: ReactNode }): JSX.Element {
  return (
    <>
      <H2>{title}</H2>
      <P>{children}</P>
      <Preview align="stretch" lang="json" code={JSON.stringify(data, null, JSON_INDENT)}>
        <div className={DOC_V103.stage}>{demo}</div>
      </Preview>
    </>
  );
}

/**
 * V1-03 营销区块 B (特性与数据) 文档页: 六个区块各一个示例 + JSON 数据 + 三皮肤并排演示.
 * 路由与导航登记 (nav.ts / App.tsx / navIcons.ts) 归集成任务.
 */
export function MarketingV103Page(): JSX.Element {
  return (
    <BlocksProvider>
      <P>
        特性与数据类区块: 全部只吃数据, 栅格走容器查询, 颜色只读语义令牌. 预览的 "代码" 标签页就是喂给区块的 JSON,
        媒体在 JSON 里写 <Code>kind: "node"</Code>, 页面再补上产品 mock 节点.
      </P>
      <Callout title="共有 props">
        每个区块都接受 BlockBaseProps: tone, pad, width, align, reveal, backdrop, slots, id 与 aria-label.
      </Callout>
      <Section title="FeatureGrid" data={FEATURE_GRID_DATA} demo={<FeatureGridDemo />}>
        特性网格, cols 2 / 3 / 4, variant card 或 plain; 给 href 时整格可点, cta 渲染格底链接.
      </Section>
      <Section title="FeatureAlternating" data={FEATURE_ALT_DATA} demo={<FeatureAlternatingDemo />}>
        左右交替图文, mediaSide 决定首段媒体侧; 窄容器单列, 媒体在上. 每段可带要点列表与 CTA 组.
      </Section>
      <Section title="BentoFeatures" data={BENTO_DATA} demo={<BentoFeaturesDemo />}>
        复用 box/Bento 的跨度与断点; span 写大格 / 横跨 / 竖跨, hoverMedia 悬停或聚焦时淡入替换, background 做图片底格.
      </Section>
      <Section title="StatBand" data={STAT_DATA} demo={<StatBandDemo />}>
        2 到 4 个大数字, 数字进入视口时滚动 (AnimatedNumber), format 透传 Intl.NumberFormat.
      </Section>
      <Section title="Showcase" data={SHOWCASE_DATA} demo={<ShowcaseDemo />}>
        多张截图时出 tabs, value / defaultValue / onValueChange 三件套; frame="browser" 用 BrowserFrame 包边, darkSrc 走 ThemedImage.
      </Section>
      <Section title="FigureGrid" data={FIGURE_DATA} demo={<FigureGridDemo />}>
        编号说明网格, 编号由 prefix + major + 序号生成 (Fig 0.1 / 0.2 / 0.3), figure 放示意节点.
      </Section>
      <H2>三皮肤演示</H2>
      <P>同一份 StatBand 与 FeatureGrid 数据分别放进 default, linear, fintech 三个皮肤作用域.</P>
      <Preview align="stretch">
        <SkinTriptych />
      </Preview>
      <CodeBlock lang="tsx" code={`<div data-skin="linear"><StatBand {...STAT_DATA} /></div>`} />
    </BlocksProvider>
  );
}
