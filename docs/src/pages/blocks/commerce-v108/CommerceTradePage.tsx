import { useMemo, useState, type JSX } from "react";
import { BlocksProvider } from "../../../../../src/blocks/_shared/BlocksProvider";
import { CartSummary, type CartLineData } from "../../../../../src/blocks/commerce/CartSummary";
import { CheckoutSteps } from "../../../../../src/blocks/commerce/CheckoutSteps";
import { ProductDetail } from "../../../../../src/blocks/commerce/ProductDetail";
import { ProductGrid } from "../../../../../src/blocks/commerce/ProductGrid";
import { SearchResults, type SearchQueryState } from "../../../../../src/blocks/commerce/SearchResults";
import { Callout, Code, H2, H3, P, Preview } from "../../../components/DocKit";
import { useDemoImages } from "../../../components/MediaDemo";
import { CART_LINES, CART_TOTALS, CHECKOUT, DEMO_IMAGE_KEYS, DETAIL, FILTERS, RESULTS, SORT, STEP_KEYS, json, withDemoMedia } from "./commerce-v108-data";

const WIDE = "w-full";
const FIELD = "flex flex-col gap-1 text-sm";
const INPUT = "h-9 rounded-md border border-input bg-background px-3";
const OPEN_BTN = "inline-flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium";

/** 一步结账表单的演示内容 (真实项目里由调用方的表单库渲染). */
function StepFields({ fields }: { fields: string[] }): JSX.Element {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => (
        <label key={f} className={FIELD}>
          {f}
          <input className={INPUT} />
        </label>
      ))}
    </div>
  );
}

/**
 * V1-08 电商交易与搜索区块文档页: ProductDetail / CartSummary / CheckoutSteps / SearchResults,
 * 每个区块一个可交互示例 + JSON 数据. 示例图 canvas 现画, 不请求外部地址.
 */
export function CommerceTradePage(): JSX.Element {
  const images = useDemoImages(DEMO_IMAGE_KEYS);
  const d = useMemo(
    () => ({ detail: withDemoMedia(DETAIL, images), lines: withDemoMedia(CART_LINES, images), results: withDemoMedia(RESULTS, images) }),
    [images],
  );
  const [lines, setLines] = useState<CartLineData[] | null>(null);
  const cart = lines ?? d.lines;
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState<SearchQueryState>({ query: "跑鞋", filters: {} });
  const [emptySearch, setEmptySearch] = useState(false);

  const updateQty = (line: CartLineData, qty: number) => setLines(cart.map((l) => (l === line ? { ...l, qty } : l)));
  const remove = (line: CartLineData) => setLines(cart.filter((l) => l !== line));
  const steps = STEP_KEYS.map((s, i) => ({
    ...s,
    content: <StepFields fields={[["收货人", "手机号", "省市区", "详细地址"], ["配送方式", "期望送达"], ["持卡人", "卡号"]][i]} />,
  }));

  return (
    <BlocksProvider locale="zh-CN">
      <P>
        电商交易与搜索区块 (设计稿 4.3, 审计 B14 到 B16). 数据驱动, 金额全部经 <Code>Intl</Code>, 图片全部经 <Code>media/Image</Code>, 布局走容器查询. 代码标签页给出可直接用于{" "}
        <Code>PageComposer</Code> 的 JSON.
      </P>

      <H2>ProductDetail</H2>
      <P>桌面左画廊右信息 (信息栏粘性), 移动端画廊横滑 + 圆点; 点图开灯箱. 选白色时色板 media 替换画廊首图; 42 码缺货不可选, 41 码显示仅剩 3 件.</P>
      <Preview code={json(DETAIL)}>
        <ProductDetail className={WIDE} pad="sm" {...d.detail} showQuantity />
      </Preview>

      <H2>CartSummary</H2>
      <H3>页面版</H3>
      <P>数量步进与移除由回调驱动, 区块不自己算合计 (合计行由服务端给出). 优惠码 onApply 返回字符串即视为失败并显示该文案.</P>
      <Preview code={json({ lines: CART_LINES, totals: CART_TOTALS, checkout: CHECKOUT })}>
        <CartSummary
          className={WIDE}
          pad="sm"
          width="narrow"
          lines={cart}
          totals={CART_TOTALS}
          checkout={CHECKOUT}
          secondary={[{ label: "继续购物", href: "#shop", variant: "link" }]}
          note="运费与税费在结账时确认."
          promo={{ onApply: async (code) => (code.toUpperCase() === "HX100" ? true : "优惠码无效或已过期") }}
          onQtyChange={updateQty}
          onRemove={remove}
          empty={{ action: { label: "去逛逛", href: "#shop" } }}
        />
      </Preview>
      <H3>抽屉版</H3>
      <Preview code={json({ variant: "drawer", lines: CART_LINES, totals: CART_TOTALS, checkout: CHECKOUT })}>
        <CartSummary variant="drawer" trigger={<button type="button" className={OPEN_BTN}>打开购物袋</button>} lines={cart} totals={CART_TOTALS} checkout={CHECKOUT} onQtyChange={updateQty} onRemove={remove} />
      </Preview>

      <H2>CheckoutSteps</H2>
      <Callout title="步骤由调用方掌控">current 受控; 每步可用 canContinue 禁用继续. 切步后焦点移到步骤标题. 移动端订单摘要折叠到顶部并显示总计.</Callout>
      <Preview code={json({ steps: STEP_KEYS, current: step, summary: { lines: CART_LINES, totals: CART_TOTALS, checkout: CHECKOUT } })}>
        <CheckoutSteps
          className={WIDE}
          pad="sm"
          steps={steps}
          current={step}
          onStepChange={setStep}
          submit={{ label: "提交订单", variant: "primary", onClick: () => setStep(0) }}
          summary={{ lines: d.lines, totals: CART_TOTALS, checkout: CHECKOUT }}
        />
      </Preview>

      <H2>SearchResults</H2>
      <P>桌面左侧筛选栏, 容器变窄后筛选进 Sheet. 已选筛选显示为胶囊, 总数经 aria-live 播报. 结果区传入 ProductGrid (pad="none").</P>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={emptySearch} onChange={(e) => setEmptySearch(e.currentTarget.checked)} />
        演示空结果
      </label>
      <Preview code={json({ query: search.query, filters: FILTERS, sort: SORT, total: 266 })}>
        <SearchResults
          className={WIDE}
          pad="sm"
          query={search.query}
          filters={FILTERS}
          selected={search.filters}
          sort={{ ...SORT, value: search.sort }}
          total={emptySearch ? 0 : 266}
          onChange={setSearch}
          results={<ProductGrid pad="none" width="full" cols={3} products={d.results} card={{ showFavorite: true }} />}
        />
      </Preview>
    </BlocksProvider>
  );
}
