import type { JSX } from "react";
import { ComparisonMatrix } from "../../../../../src/blocks/marketing/ComparisonMatrix";
import { Faq } from "../../../../../src/blocks/marketing/Faq";
import { Pricing } from "../../../../../src/blocks/marketing/Pricing";
import { BlocksProvider } from "../../../../../src/blocks/_shared/BlocksProvider";
import { V105_DOC } from "../../../../../src/constants/blocks-marketing-v105";
import { CodeBlock, H2, H3, P } from "../../../components/DocKit";
import { FAQ_DATA, MATRIX_DATA, PRICING_DATA } from "./data";
// 集成前皮肤样式不在 @hx/ui/styles.css 里, 演示页直接引源码入口; 集成后这一行可删
import "../../../../../src/skins/index.css";

const json = (value: unknown): string => JSON.stringify(value, null, 2);

/** 一个区块 = 示例 + JSON 数据. */
function BlockDemo({ title, intro, data, children }: { title: string; intro: string; data: unknown; children: JSX.Element }): JSX.Element {
  return (
    <section className={V105_DOC.stack}>
      <H2>{title}</H2>
      <P>{intro}</P>
      <div className={V105_DOC.skinFrame}>{children}</div>
      <H3>JSON 数据示例</H3>
      <CodeBlock code={json(data)} lang="json" />
    </section>
  );
}

/** 三皮肤演示: 同一份数据, 局部挂 data-skin, 外观变化完全来自令牌. */
function SkinTriptych(): JSX.Element {
  return (
    <section className={V105_DOC.stack}>
      <H2>三皮肤演示</H2>
      <P>同一份 JSON 分别放进 linear / fintech / retail 皮肤容器, 区块代码不感知皮肤名.</P>
      {V105_DOC.skins.map((skin) => (
        <div key={skin} data-skin={skin} className={V105_DOC.skinFrame}>
          <div className={V105_DOC.skinLabel}>data-skin={skin}</div>
          <Pricing {...PRICING_DATA} pad="md" />
          <ComparisonMatrix {...MATRIX_DATA} pad="md" tone="muted" />
          <Faq {...FAQ_DATA} pad="md" />
        </div>
      ))}
    </section>
  );
}

/**
 * V1-05 营销区块 D (转化): Pricing / ComparisonMatrix / Faq 的文档页.
 * 每个区块一个示例 + 原样 JSON, 末尾三皮肤对照. 窄屏下 ComparisonMatrix 自动切成逐档卡片.
 *
 * .agents/notes/implemented/feature/2026-11-02-marketing-conversion-blocks.md
 */
export function MarketingV105Page(): JSX.Element {
  return (
    <BlocksProvider locale="zh-CN">
      <div className={V105_DOC.stack}>
        <BlockDemo title="Pricing 定价表" intro="2 到 4 档; 月付/年付切换联动价格, 周期与折扣; 推荐档高亮并在移动端置顶; 免费档与联系销售档; 价格下方说明行与所有档位都包含区." data={PRICING_DATA}>
          <Pricing {...PRICING_DATA} />
        </BlockDemo>
        <BlockDemo title="ComparisonMatrix 对比矩阵" intro="分组行, 粘性表头与首列, 有/无/文字/图标四种单元格 (数字走 Intl), 仅显示差异开关; md 以下退化为逐档卡片." data={MATRIX_DATA}>
          <ComparisonMatrix {...MATRIX_DATA} />
        </BlockDemo>
        <BlockDemo title="Faq 常见问题" intro="单栏或双栏 (标题左, 问答右), 分类分组, 搜索过滤, 原生 details 无 JS 可展开, 尾部联系我们 CTA." data={FAQ_DATA}>
          <Faq {...FAQ_DATA} />
        </BlockDemo>
        <SkinTriptych />
      </div>
    </BlocksProvider>
  );
}

export default MarketingV105Page;
