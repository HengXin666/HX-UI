import * as React from "react";
import { AnimatePresence, m } from "motion/react";
import { Check, Minus, Plus, RotateCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/blocks/marketing/site-header";
import { ThemeToggle } from "@/blocks/shell/theme-toggle";
import { ProductGallery } from "@/blocks/commerce/product-gallery";
import { VariantPicker } from "@/blocks/commerce/variant-picker";
import { Price } from "@/blocks/commerce/price";
import { Rating } from "@/blocks/commerce/rating";
import { ProductCard, type ProductSummary } from "@/blocks/commerce/product-card";
import { BuyBar } from "@/blocks/commerce/buy-bar";
import { Segmented } from "@/blocks/analytics/segmented";
import { Section } from "@/blocks/marketing/section";
import { Reveal } from "@/motion/reveal";
import { IMG } from "../assets";
import { BackLink } from "../pages/back-link";

const COLORS = [
  { value: "ink", label: "墨黑", swatch: "oklch(0.25 0.01 270)" },
  { value: "bone", label: "骨白", swatch: "oklch(0.94 0.01 90)" },
  { value: "moss", label: "苔绿", swatch: "oklch(0.55 0.08 140)" },
];
const SIZES = ["38", "39", "40", "41", "42", "43", "44"];
/** 库存: 颜色 × 尺码, 0 = 售罄 */
const STOCK: Record<string, Record<string, number>> = {
  ink: { 38: 3, 39: 8, 40: 12, 41: 0, 42: 6, 43: 2, 44: 0 },
  bone: { 38: 0, 39: 4, 40: 9, 41: 7, 42: 0, 43: 5, 44: 1 },
  moss: { 38: 2, 39: 0, 40: 3, 41: 4, 42: 2, 43: 0, 44: 0 },
};

const CATALOG: (ProductSummary & { cat: string })[] = [
  { id: "1", name: "Stride 轻量跑鞋", image: IMG.shoeB, hoverImage: IMG.shoeA, price: 699, compareAt: 899, rating: 4.7, reviews: 1286, tag: "新品", cat: "鞋履" },
  { id: "2", name: "Cloud 降噪耳机", image: IMG.headphones, price: 1_499, rating: 4.8, reviews: 3_402, cat: "数码" },
  { id: "3", name: "Atlas 运动腕表", image: IMG.watch, price: 2_199, compareAt: 2_499, rating: 4.6, reviews: 874, cat: "数码" },
  { id: "4", name: "Pebble 真无线耳塞", image: IMG.earbuds, price: 599, rating: 4.5, reviews: 2_115, tag: "热卖", cat: "数码" },
  { id: "5", name: "Daily 通勤套装", image: IMG.carry, price: 1_288, rating: 4.4, reviews: 312, cat: "配件" },
  { id: "6", name: "Court 复古板鞋", image: IMG.shoeD, hoverImage: IMG.shoeC, price: 559, rating: 4.6, reviews: 958, cat: "鞋履" },
];

function Pdp() {
  const [color, setColor] = React.useState("ink");
  const [size, setSize] = React.useState<string>();
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const buyRef = React.useRef<HTMLDivElement>(null);
  const left = size ? STOCK[color][size] : undefined;
  const colorLabel = COLORS.find((c) => c.value === color)!.label;

  const add = () => {
    if (!size) {
      buyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast("请先选择尺码");
      return;
    }
    setAdded(true);
    toast.success("已加入购物袋", { description: `Stride 轻量跑鞋 · ${colorLabel} · ${size} 码 × ${qty}` });
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      <Reveal preset="fade" inView={false}>
        <ProductGallery
          media={[
            { src: IMG.shoeB, alt: "Stride 轻量跑鞋 侧面" },
            { src: IMG.shoeA, alt: "Stride 轻量跑鞋 俯视" },
            { src: IMG.shoeC, alt: "Stride 轻量跑鞋 细节" },
            { src: IMG.shoeE, alt: "Stride 轻量跑鞋 场景" },
          ]}
        />
      </Reveal>
      <Reveal preset="up" inView={false} delay={0.1} className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">新品</Badge>
          <Rating value={4.7} count={1286} />
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Stride 轻量跑鞋</h1>
        <p className="mt-2 text-muted-foreground">单只 212 g，超临界发泡中底，每天 10 公里也不累脚。</p>
        <Price amount={699} compareAt={899} size="lg" className="mt-5" />
        <div ref={buyRef} className="mt-8 space-y-6">
          <VariantPicker name="color" label="颜色" value={color} onChange={(v) => { setColor(v); setSize(undefined); }} options={COLORS} />
          <VariantPicker name="size" label="尺码 (EU)" value={size} onChange={setSize} options={SIZES.map((s) => ({ value: s, label: s, soldOut: STOCK[color][s] === 0 }))} />
          <div className="h-5 text-sm">
            <AnimatePresence mode="wait">
              {left !== undefined && (
                <m.span key={`${color}${size}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={left <= 3 ? "text-warning" : "text-success"}>
                  {left <= 3 ? `仅剩 ${left} 件` : "有货，今天 18:00 前下单当日发出"}
                </m.span>
              )}
            </AnimatePresence>
          </div>
          <div className="flex gap-3">
            <div className="flex h-12 items-center rounded-xl border">
              <Button variant="ghost" size="icon" className="size-12 rounded-xl" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="减少"><Minus className="size-4" /></Button>
              <span className="w-8 text-center tabular">{qty}</span>
              <Button variant="ghost" size="icon" className="size-12 rounded-xl" onClick={() => setQty((q) => Math.min(left ?? 9, q + 1))} aria-label="增加"><Plus className="size-4" /></Button>
            </div>
            <Button className="h-12 flex-1 rounded-xl text-base" onClick={add}>
              <AnimatePresence mode="wait" initial={false}>
                <m.span key={added ? "ok" : "add"} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.18 }} className="inline-flex items-center gap-2">
                  {added ? <><Check className="size-4" />已加入</> : <><ShoppingBag className="size-4" />{size ? "加入购物袋" : "选择尺码"}</>}
                </m.span>
              </AnimatePresence>
            </Button>
          </div>
          <ul className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            {[[Truck, "满 299 包邮"], [RotateCcw, "30 天无理由"], [ShieldCheck, "正品保障"]].map(([I, t]) => {
              const Icon = I as typeof Truck;
              return <li key={t as string} className="flex flex-col items-center gap-1.5 rounded-lg bg-muted/60 py-3"><Icon className="size-4" />{t as string}</li>;
            })}
          </ul>
          <Accordion type="single" collapsible defaultValue="d">
            <AccordionItem value="d"><AccordionTrigger>产品详情</AccordionTrigger><AccordionContent className="text-muted-foreground">鞋面为一体编织网布，透气率比上代提升 31%。中底采用超临界氮气发泡，回弹 72%。外底碳素橡胶覆盖前掌高磨损区。</AccordionContent></AccordionItem>
            <AccordionItem value="s"><AccordionTrigger>尺码建议</AccordionTrigger><AccordionContent className="text-muted-foreground">版型正常偏窄，脚背较高建议选大半码。</AccordionContent></AccordionItem>
          </Accordion>
        </div>
      </Reveal>
      <BuyBar target={buyRef} image={IMG.shoeB} title="Stride 轻量跑鞋" subtitle={size ? `${colorLabel} · ${size} 码` : colorLabel} amount={699} compareAt={899} ctaLabel={size ? "加入购物袋" : "选择尺码"} onBuy={add} />
    </div>
  );
}

function Plp() {
  const [cat, setCat] = React.useState("全部");
  const [sort, setSort] = React.useState<"hot" | "low" | "high">("hot");
  const list = CATALOG.filter((p) => cat === "全部" || p.cat === cat).sort((a, b) =>
    sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : (b.reviews ?? 0) - (a.reviews ?? 0),
  );
  return (
    <Section eyebrow="你可能还喜欢" title="搭配推荐" align="left">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented value={cat} onChange={setCat} options={["全部", "鞋履", "数码", "配件"].map((c) => ({ value: c, label: c }))} />
        <Segmented className="ml-auto" value={sort} onChange={setSort} options={[{ value: "hot", label: "热度" }, { value: "low", label: "价格 ↑" }, { value: "high", label: "价格 ↓" }]} />
      </div>
      <m.div layout className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {list.map((p) => (
            <m.div key={p.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <ProductCard product={p} onOpen={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
            </m.div>
          ))}
        </AnimatePresence>
      </m.div>
    </Section>
  );
}

export default function Shop() {
  return (
    <div>
      <BackLink />
      <SiteHeader
        brand={<span className="font-semibold tracking-tight">STRIDE</span>}
        links={[{ label: "男士", href: "#" }, { label: "女士", href: "#" }, { label: "跑步", href: "#" }, { label: "数码", href: "#" }]}
        actions={<><ThemeToggle /><Button variant="ghost" size="icon" className="size-9" aria-label="购物袋"><ShoppingBag className="size-4" /></Button></>}
      />
      <Pdp />
      <Plp />
      <div className="h-24" />
    </div>
  );
}
