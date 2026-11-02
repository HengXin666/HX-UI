import type { JSX, ReactNode } from "react";
import { BlocksProvider } from "../../../../../src/blocks/_shared/BlocksProvider";
import { Callout, Code, CodeBlock, H2, P, Preview } from "../../../components/DocKit";
import {
  CASE_STUDIES_ACCORDION_DATA,
  CASE_STUDIES_DATA,
  CHANGELOG_CARDS_DATA,
  CHANGELOG_DATA,
  DOC_V104,
  TESTIMONIALS_CAROUSEL_DATA,
  TESTIMONIALS_DATA,
  TESTIMONIALS_MARQUEE_DATA,
  TWEET_WALL_DATA,
} from "./data";
import { CaseStudiesDemo, ChangelogListDemo, TestimonialsDemo, TweetWallDemo } from "./Demos";
import { SkinTriptych } from "./SkinTriptych";

const JSON_INDENT = 2;

/** 一个区块的文档段: 说明 + 预览 (代码标签页给 JSON 数据). */
function Section({ title, children, data, demo }: { title: string; children: ReactNode; data: unknown; demo: ReactNode }): JSX.Element {
  return (
    <>
      <H2>{title}</H2>
      <P>{children}</P>
      <Preview align="stretch" lang="json" code={JSON.stringify(data, null, JSON_INDENT)}>
        <div className={DOC_V104.stage}>{demo}</div>
      </Preview>
    </>
  );
}

/**
 * V1-04 营销区块 C (社证) 文档页: 每个区块一个示例 + JSON 数据 + 三皮肤并排演示.
 * 路由与导航登记 (nav.ts / App.tsx / navIcons.ts) 归集成任务.
 */
export function MarketingV104Page(): JSX.Element {
  return (
    <BlocksProvider>
      <P>
        社证类区块: 客户评价, 客户案例, 更新日志与社区推文墙. 全部只吃数据, 引言长度不设上限; 预览的 "代码" 标签页就是喂给区块的 JSON,
        案例媒体在 JSON 里写 <Code>kind: "node"</Code>, 页面再补上产品 mock 节点.
      </P>
      <Callout title="共有 props">
        每个区块都接受 BlockBaseProps: tone, pad, width, align, reveal, backdrop, slots, id 与 aria-label.
      </Callout>
      <Section title="Testimonials · cards" data={TESTIMONIALS_DATA} demo={<TestimonialsDemo />}>
        网格排列, columns 1 到 4 走容器查询; clampLines 按行截断长引言, 只有真溢出才出现 "展开"; rating 与来源 logo 可选.
      </Section>
      <Section title="Testimonials · carousel" data={TESTIMONIALS_CAROUSEL_DATA} demo={<TestimonialsDemo data={TESTIMONIALS_CAROUSEL_DATA} />}>
        stripe 式引用轮播: 分页点, 计数与左右按钮, perView 1 到 3, loop 首尾相接.
      </Section>
      <Section title="Testimonials · marquee" data={TESTIMONIALS_MARQUEE_DATA} demo={<TestimonialsDemo data={TESTIMONIALS_MARQUEE_DATA} />}>
        resend 式无限引用流: 悬停或键盘聚焦即暂停, 另有显式暂停按钮, 两行反向滚动.
      </Section>
      <Section title="CaseStudies · tabs" data={CASE_STUDIES_DATA} demo={<CaseStudiesDemo />}>
        supabase 式客户 tabs: 每个客户含 logo, 标题, 描述, 关键数据点, 用到的产品与链接; value / defaultValue / onValueChange 三件套.
      </Section>
      <Section title="CaseStudies · accordion" data={CASE_STUDIES_ACCORDION_DATA} demo={<CaseStudiesDemo data={CASE_STUDIES_ACCORDION_DATA} />}>
        stripe 式手风琴客户故事: 图 + 数据 + 用到的产品, 同一份 items.
      </Section>
      <Section title="ChangelogList · list" data={CHANGELOG_DATA} demo={<ChangelogListDemo />}>
        日期 + 版本号 + 标题 + 摘要 + 标签 + 链接; groupBy 为 month 或 version 时分组, limit 截断后出 "查看全部" 入口 (viewAll).
      </Section>
      <Section title="ChangelogList · cards" data={CHANGELOG_CARDS_DATA} demo={<ChangelogListDemo data={CHANGELOG_CARDS_DATA} />}>
        linear 式 changelog 四卡.
      </Section>
      <Section title="TweetWall" data={TWEET_WALL_DATA} demo={<TweetWallDemo />}>
        supabase 式社区推文墙: 瀑布流水位堆叠, collapsible 时先露一截, 底部渐隐加 "展开更多".
      </Section>
      <H2>三皮肤演示</H2>
      <P>同一份 Testimonials 与 ChangelogList 数据分别放进 default, linear, fintech 三个皮肤作用域.</P>
      <Preview align="stretch">
        <SkinTriptych />
      </Preview>
      <CodeBlock lang="tsx" code={`<div data-skin="linear"><Testimonials {...TESTIMONIALS_DATA} /></div>`} />
    </BlocksProvider>
  );
}
