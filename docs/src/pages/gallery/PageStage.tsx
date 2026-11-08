import type { JSX } from "react";
import type { ComparisonMatrixProps, FaqProps, FeatureAlternatingProps, ProductDetailProps, SiteFooterBlockProps, SiteHeaderBlockProps } from "@hx/ui";
import { Page, definePage, section } from "../../../../src/page";
import { PRODUCT_BLOCKS } from "../templates/page-product/data";

const KEY = { header: "header", detail: "detail", features: "features", compare: "compare", faq: "faq", footer: "footer" } as const;
const STEP = { order: "order", pay: "pay", pick: "pick", ship: "ship", sign: "sign" } as const;

/** 商品页模板的同一份区块数据, 按 key 取出后改写成页面描述. */
function propsOf<P>(key: string): P {
  return PRODUCT_BLOCKS.find((node) => node.key === key)?.props as unknown as P;
}

const SPEC = definePage({
  sections: [
    { type: KEY.header, key: KEY.header, props: propsOf<SiteHeaderBlockProps>(KEY.header) },
    { type: "product", key: KEY.detail, props: propsOf<ProductDetailProps>(KEY.detail) },
    { type: "alternating", key: KEY.features, props: propsOf<FeatureAlternatingProps>(KEY.features) },
    section(
      "rings",
      {
        heading: { eyebrow: "材料", title: "每双鞋里有多少回收料" },
        items: [
          { value: 62, label: "鞋面再生纱线" },
          { value: 35, label: "中底生物基" },
          { value: 20, label: "外底回收橡胶" },
          { value: 100, label: "包装再生纸" },
        ],
      },
      "materials",
    ),
    section(
      "flow",
      {
        heading: { eyebrow: "配送", title: "从下单到签收" },
        label: "履约流程",
        nodes: [
          { id: STEP.order, label: "下单", detail: "库存锁定 15 分钟, 尺码售罄会立即提示." },
          { id: STEP.pay, label: "支付", detail: "支持分期, 失败自动重试三次." },
          { id: STEP.pick, label: "仓内拣货", detail: "最近的前置仓, 平均 22 分钟出库." },
          { id: STEP.ship, label: "顺丰发货", detail: "一线城市次日达." },
          { id: STEP.sign, label: "签收", detail: "30 天无理由退换." },
        ],
        edges: [
          { from: STEP.order, to: STEP.pay },
          { from: STEP.pay, to: STEP.pick },
          { from: STEP.pick, to: STEP.ship },
          { from: STEP.ship, to: STEP.sign },
        ],
      },
      "delivery",
    ),
    { type: "matrix", key: KEY.compare, props: propsOf<ComparisonMatrixProps>(KEY.compare) },
    { type: KEY.faq, key: KEY.faq, props: propsOf<FaqProps>(KEY.faq) },
    { type: KEY.footer, key: KEY.footer, props: propsOf<SiteFooterBlockProps>(KEY.footer) },
  ],
});

/**
 * 一份 definePage 描述出整张商品页: 区块和可视化混排, 默认注册表, 不写一行版式.
 *
 * .agents/notes/implemented/architecture/2026-11-08-layered-entries.md
 */
export function PageStage(): JSX.Element {
  return <Page spec={SPEC} as="div" />;
}
