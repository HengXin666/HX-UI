import type { JSX } from "react";
import { DISPLAY_SIZE, KICKER_MARKER, LEAD_MEASURE, TEXT_TONE, TYPOGRAPHY_DOC } from "../../../../src/constants/typography";
import { Display, Eyebrow, GradientText, Kicker, Lead, Prose } from "../../../../src/typography";
import { Callout, Code, H2, P, Preview } from "../../components/DocKit";

const DISPLAY_SIZES = Object.values(DISPLAY_SIZE);

/** Kicker 示例用的装饰图标 (aria-hidden 由组件补). */
function SparkIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1}>
      <path d="M8 1v4M8 11v4M1 8h4M11 8h4M3 3l2.5 2.5M10.5 10.5 13 13M13 3l-2.5 2.5M5.5 10.5 3 13" />
    </svg>
  );
}

/**
 * 版式件文档页: Display, Eyebrow, Kicker, Lead, GradientText, Prose 与中文回退.
 * 集成前从源码相对路径引入, 集成分片接好公共导出后可改为从 @hx/ui 引入.
 *
 * .agents/notes/implemented/feature/2026-11-02-typography.md
 */
export function TypographyPage(): JSX.Element {
  return (
    <>
      <P>
        营销尺度与正文尺度的版式件. 字号只引用 <Code>--fs-*</Code> 与 <Code>--fs-display-*</Code> 令牌,
        颜色只来自语义令牌, 每个节点带 <Code>data-slot</Code>, 都支持 <Code>classNames</Code> / <Code>styles</Code>.
      </P>
      <Callout title="与 TypographyH1..H4 的分工">
        TypographyH1 (30px) 是文档尺度; 落地页首屏, 区块主标题用 Display, 长文正文整体包一层 Prose.
      </Callout>

      <H2>Display</H2>
      <P>
        <Code>size</Code> 为 sm / md / lg / xl / 2xl, 对应 <Code>--fs-display-sm..2xl</Code>. 默认 <Code>balance</Code>,
        <Code>as</Code> 只换语义标签不改视觉.
      </P>
      <Preview code={`<Display as="h1" size="xl">Ship interfaces people remember</Display>`}>
        <div className={TYPOGRAPHY_DOC.stage}>
          {DISPLAY_SIZES.map((size) => (
            <Display key={size} as="h2" size={size}>
              {TYPOGRAPHY_DOC.display}
            </Display>
          ))}
        </div>
      </Preview>

      <H2>Eyebrow</H2>
      <P>标题上方的小号大写眉标, 默认 <Code>tone="primary"</Code>, 字距放宽.</P>
      <Preview code={`<Eyebrow>New in 0.2</Eyebrow>`}>
        <div className={TYPOGRAPHY_DOC.stage}>
          <Eyebrow>{TYPOGRAPHY_DOC.eyebrow}</Eyebrow>
          <Eyebrow tone={TEXT_TONE.success} size="sm">{TYPOGRAPHY_DOC.eyebrow}</Eyebrow>
        </div>
      </Preview>

      <H2>Kicker</H2>
      <P>
        标题前的标识行, <Code>marker="bar"</Code> 画 1px 短竖线, 或用 <Code>icon</Code> 放图标.
        子部件 slot: <Code>icon</Code> / <Code>bar</Code> / <Code>label</Code>.
      </P>
      <Preview code={`<Kicker marker="bar" tone="primary">Changelog</Kicker>\n<Kicker icon={<SparkIcon />}>Changelog</Kicker>`}>
        <div className={TYPOGRAPHY_DOC.stage}>
          <Kicker marker={KICKER_MARKER.bar} tone={TEXT_TONE.primary}>{TYPOGRAPHY_DOC.kicker}</Kicker>
          <Kicker icon={<SparkIcon />}>{TYPOGRAPHY_DOC.kicker}</Kicker>
        </div>
      </Preview>

      <H2>Lead</H2>
      <P>
        比正文大一号的导语段, 行高放松. <Code>measure</Code> 控制最大行宽: narrow / default / wide / none.
      </P>
      <Preview code={`<Lead measure="default">A typography layer for marketing pages…</Lead>`}>
        <Lead measure={LEAD_MEASURE.default}>{TYPOGRAPHY_DOC.lead}</Lead>
      </Preview>

      <H2>GradientText</H2>
      <P>
        文字渐变, 色标只接受语义令牌名 (<Code>primary</Code>, <Code>link</Code>, <Code>accent</Code> 等). 不传色标时用
        <Code>--gradient-brand</Code>. 高对比模式下退回系统文字色.
      </P>
      <Preview code={`<Display size="lg">Built on <GradientText>semantic gradients</GradientText></Display>`}>
        <div className={TYPOGRAPHY_DOC.stage}>
          <Display as="p" size="md">
            Built on <GradientText>{TYPOGRAPHY_DOC.gradient}</GradientText>
          </Display>
          <Display as="p" size="md">
            <GradientText from="success" to="link" angle={90}>{TYPOGRAPHY_DOC.gradient}</GradientText>
          </Display>
        </div>
      </Preview>

      <H2>Prose</H2>
      <P>
        博客 / 文档正文容器: 标题层级间距, 段落, 列表, 引用, 代码, 表格, 图片, hr 的基线样式. 子元素是普通 HTML.
      </P>
      <Preview code={`<Prose as="article" size="md">{markdownHtml}</Prose>`}>
        <Prose as="article">
          <h2>Getting started</h2>
          <p>
            Install the package, import <code>styles.css</code> once, then wrap rendered markdown in <a href="#prose">Prose</a>.
          </p>
          <ul>
            <li>Headings, paragraphs and lists</li>
            <li>Quotes, code and tables</li>
          </ul>
          <blockquote><p>Typography is what language looks like.</p></blockquote>
          <pre><code>npm install @hx/ui</code></pre>
          <table>
            <thead><tr><th>Token</th><th>Use</th></tr></thead>
            <tbody>
              <tr><td>--fs-display-lg</td><td>Hero title</td></tr>
              <tr><td>--fs-lead</td><td>Lead paragraph</td></tr>
            </tbody>
          </table>
          <hr />
          <p>End of sample.</p>
        </Prose>
      </Preview>

      <H2>中文回退</H2>
      <P>
        所有版式件都有 <Code>cjk</Code> 开关 (auto / true / false). auto 时先看 <Code>lang</Code> (zh / ja / ko),
        再看直接文本是否含中日韩字符; 命中后写 <Code>data-cjk</Code>, 标题字距改用 <Code>--tracking-display-cjk</Code>,
        眉标取消大写, 正文行距放宽, em 与引用不再伪斜体. Prose 只看 lang, 中文正文请传 <Code>lang="zh-CN"</Code>.
      </P>
      <Preview code={`<Eyebrow lang="zh-CN">新版本</Eyebrow>\n<Display size="lg">让界面被记住</Display>`}>
        <div className={TYPOGRAPHY_DOC.stage}>
          <Eyebrow lang="zh-CN">新版本</Eyebrow>
          <Display as="p" size="lg">{TYPOGRAPHY_DOC.displayCjk}</Display>
          <Display as="p" size="lg" cjk={false}>{TYPOGRAPHY_DOC.displayCjk}</Display>
        </div>
      </Preview>
    </>
  );
}
