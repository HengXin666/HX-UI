import { useMemo, useState, type JSX } from "react";
import { SegmentedControl, toast } from "@hx/ui";
import { BuyBar, ShotGallery } from "../../../../src/blocks/commerce/sections";
import { defaultSelection, sampleProduct, sampleRelated, sampleReviews, type Selection } from "../../../../src/commerce/model";
import { DIRECTIONS, Page, type DirectionName } from "../../../../src/page";
import { pdpTemplate } from "../../../../src/page/templates";
import { CodeBlock, H2, P } from "../../components/DocKit";

/** 方向切换项: 由 DIRECTIONS 表生成, 新增方向不用改这里. */
const DIRECTION_ITEMS = Object.values(DIRECTIONS).map((d) => ({ key: d.name, label: d.name }));

/** 购买区所在拍的 id, BuyBar 盯它. */
const BUY_BEAT = "buy";
const CTA = "加入购物车";

const USAGE = `import { pdpTemplate } from "@hx/ui/templates";
import { BuyBar } from "@hx/ui/sections";
import { Page } from "@hx/ui/page";

const [selection, setSelection] = useState(() => defaultSelection(product));
const { spec, issues } = pdpTemplate({ product, reviews, related, direction: "retail-luxe", url, selection, onSelectionChange: setSelection });

<Page spec={spec} />
<BuyBar product={product} selection={selection} ctaLabel="加入购物车" watchId="buy" onBuy={addToCart} />`;

/**
 * 标杆页 A: 电商详情页. 一份商品模型 (3 色 7 码, 有缺码和不生产的组合) + 评价 + 推荐,
 * 由 pdpTemplate 出整页; 购买区与粘性购买条共用一份选择. 上方切美术方向, 下方单独演示镜头化画廊.
 */
export function PdpPage(): JSX.Element {
  const product = useMemo(() => sampleProduct(), []);
  const reviews = useMemo(() => sampleReviews(), []);
  const related = useMemo(() => sampleRelated(), []);
  const [direction, setDirection] = useState<DirectionName>("retail-luxe");
  const [selection, setSelection] = useState<Selection>(() => defaultSelection(product));
  const [shot, setShot] = useState(0);

  const { spec, issues } = useMemo(
    () => pdpTemplate({ product, reviews, related, direction, url: "https://shop.example.com/p/fell", selection, onSelectionChange: setSelection }),
    [product, reviews, related, direction, selection],
  );

  return (
    <>
      <P>一份商品数据进, 整页出. 切方向只换气质 (镜头, 节奏, 版式), 不改数据; 选到售罄组合时购买区和底部购买条一起禁用. 往下滚过购买区, 底部会滑出购买条.</P>
      <SegmentedControl items={DIRECTION_ITEMS} value={direction} onChange={setDirection} />
      {issues.length > 0 ? <P>{`商品数据有 ${issues.length} 个问题: ${issues.map((i) => i.code).join(", ")}`}</P> : null}
      <Page key={direction} spec={spec} />
      <H2 id="shot-gallery">镜头化画廊</H2>
      <P>换图是一个短推镜, 不是轮播滑轨: 新图从 1.04 推到 1, 旧图略放大淡出, 按前后方向带 3% 横移. 主图可聚焦, 左右键和 Home / End 切换, 系统减弱动效时直接切.</P>
      <div style={{ maxWidth: "28rem" }}>
        <ShotGallery media={product.media} index={shot} onIndexChange={setShot} />
      </div>
      <H2 id="usage">接入</H2>
      <CodeBlock code={USAGE} />
      <BuyBar product={product} selection={selection} ctaLabel={CTA} watchId={BUY_BEAT} onBuy={(v) => toast.success(`已加入购物车: ${v.sku ?? v.id}`)} />
    </>
  );
}
