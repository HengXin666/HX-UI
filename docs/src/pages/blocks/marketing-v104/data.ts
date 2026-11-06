/**
 * V1-04 文档页的 JSON 数据示例 (社证区块): 每个区块一份纯数据, 可直接 JSON.stringify 给 PageComposer / CMS.
 * logo 用内联 svg 数据串 (文档站不带图片资源), 案例媒体用 kind="node" 由 Demos 补上产品 mock.
 */
import type { CaseStudiesProps } from "../../../../../src/blocks/marketing/CaseStudies";
import type { ChangelogListProps } from "../../../../../src/blocks/marketing/ChangelogList";
import type { TestimonialsProps } from "../../../../../src/blocks/marketing/Testimonials";
import type { TweetWallProps } from "../../../../../src/blocks/marketing/TweetWall";

export const DOC_V104 = {
  skins: ["default", "linear", "fintech"],
  skinAttr: "data-skin",
  stage: "flex w-full flex-col gap-6",
  skinGrid: "grid w-full grid-cols-1 gap-4 @container",
  skinFrame: "overflow-hidden rounded-(--radius-lg) border border-border bg-background text-foreground",
  skinTag: "block border-b border-border px-4 py-2 font-mono text-xs text-muted-foreground",
  mock: "flex aspect-video w-full items-end gap-2 bg-muted p-6",
  mockBar: "flex-1 rounded-(--radius-sm) bg-primary/60",
  bars: [35, 60, 48, 76, 66, 92],
} as const;

/** 文字型 logo: 一段内联 svg, 让示例不依赖外部图片. */
function logo(name: string): { name: string; src: string; width: number; height: number } {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='32' viewBox='0 0 120 32'><text x='0' y='23' font-family='sans-serif' font-size='20' font-weight='700'>${name}</text></svg>`;
  return { name, src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`, width: 120, height: 32 };
}

const LONG_QUOTE =
  "我们把三个产品线的营销页从各自维护的模板迁到 HX-UI 区块上, 只用了一个迭代. 最意外的是皮肤切换: 品牌团队改一组令牌, 十几个页面同时换装, 没有任何一处需要回归截图. " +
  "以前每次大促都要临时拼一页, 现在运营直接写 JSON, 工程只做审核. 长文案, 多语言, 窄栏嵌入都没有出现过布局崩坏, 这一点在我们之前用过的三套库里都做不到.";

export const TESTIMONIALS_DATA: TestimonialsProps = {
  heading: { eyebrow: "客户评价", title: "团队为什么换到 HX-UI", description: "引言长度不限, 卡片按行截断, 真溢出时才出现展开按钮." },
  variant: "cards",
  columns: 3,
  clampLines: 5,
  items: [
    { id: "t1", quote: LONG_QUOTE, rating: 5, logo: logo("Northwind"), person: { name: "林知夏", role: "前端负责人", company: "Northwind" } },
    { id: "t2", quote: "区块只吃数据这一条, 让我们的 Agent 能直接生成落地页.", rating: 4, person: { name: "Marcus Bell", role: "Staff Engineer", company: "Acme" } },
    { id: "t3", quote: "暗色优先, 1px 细边, CJK 字距都对. 设计走查第一次零意见.", logo: logo("Globex"), href: "#globex", person: { name: "周屿", role: "设计总监", company: "Globex" } },
    { id: "t4", quote: "减弱动效与键盘焦点默认就对, 无障碍审计一次过.", rating: 5, person: { name: "Ana Ruiz", role: "Accessibility Lead", company: "Initech" } },
  ],
};

export const TESTIMONIALS_CAROUSEL_DATA: TestimonialsProps = {
  ...TESTIMONIALS_DATA,
  heading: { title: "轮播: 分页点 + 左右按钮" },
  variant: "carousel",
  carousel: { perView: 2, loop: true },
};

export const TESTIMONIALS_MARQUEE_DATA: TestimonialsProps = {
  ...TESTIMONIALS_DATA,
  heading: { title: "无限引用流: 悬停或聚焦即暂停" },
  variant: "marquee",
  marquee: { rows: 2, pauseOnHover: true },
};

export const CASE_STUDIES_DATA: CaseStudiesProps = {
  heading: { eyebrow: "客户案例", title: "从一页到一整站" },
  variant: "tabs",
  productsLabel: "用到的产品",
  linkLabel: "阅读完整案例",
  items: [
    {
      id: "northwind",
      logo: logo("Northwind"),
      title: "Northwind 用两周重建了全部营销页",
      description: "四十个页面迁到 PageComposer, 运营直接维护 JSON, 发布周期从一周缩到一天.",
      metrics: [{ value: 40, label: "页面迁移" }, { value: 6, suffix: "x", label: "发布频率" }, { value: 32, suffix: "%", label: "首屏提速" }],
      media: { kind: "node", alt: "" },
      products: ["Blocks", { label: "PageComposer", href: "#composer" }, "Skins"],
      quote: { text: "工程只做审核, 内容自己长出来.", person: { name: "林知夏", role: "前端负责人" } },
      href: "#northwind",
    },
    {
      id: "globex",
      logo: logo("Globex"),
      title: "Globex 一套令牌覆盖六个品牌",
      description: "品牌差异全部收进皮肤 css, 区块代码零分叉.",
      metrics: [{ value: 6, label: "品牌" }, { value: 0, label: "代码分叉" }],
      media: { kind: "node", alt: "" },
      products: ["Skins", "Tokens"],
      href: "#globex",
    },
    {
      id: "acme",
      logo: logo("Acme"),
      title: "Acme 让 Agent 生成落地页",
      description: "schema 驱动的区块让模型输出可校验的 JSON, 而不是不可控的标记.",
      metrics: [{ value: 120, suffix: "+", label: "自动生成页面" }],
      products: ["Blocks", "Agent schema"],
      href: "#acme",
    },
  ],
};

export const CASE_STUDIES_ACCORDION_DATA: CaseStudiesProps = { ...CASE_STUDIES_DATA, heading: { title: "手风琴形态" }, variant: "accordion" };

export const CHANGELOG_DATA: ChangelogListProps = {
  heading: { eyebrow: "Changelog", title: "最近更新" },
  variant: "list",
  groupBy: "month",
  limit: 5,
  viewAll: { label: "查看全部更新", href: "#changelog", icon: "lucide:arrow-right", iconEnd: true },
  items: [
    { id: "c1", date: "2026-10-28", version: "v1.4.0", title: "社证区块上线", summary: "Testimonials, CaseStudies, ChangelogList 与 TweetWall.", tags: [{ label: "新增", tone: "success" }], href: "#v1-4-0" },
    { id: "c2", date: "2026-10-12", version: "v1.3.2", title: "容器查询栅格", summary: "所有营销区块改用容器查询, 窄栏嵌入不再错位.", tags: [{ label: "改进", tone: "info" }] },
    { id: "c3", date: "2026-09-30", version: "v1.3.0", title: "fintech 皮肤", summary: "新增第六套皮肤, 只覆盖语义令牌.", tags: [{ label: "新增", tone: "success" }, { label: "皮肤" }], href: "#v1-3-0" },
    { id: "c4", date: "2026-09-08", version: "v1.2.1", title: "修复轮播焦点丢失", tags: [{ label: "修复", tone: "warning" }] },
    { id: "c5", date: "2026-08-20", version: "v1.2.0", title: "PageComposer 公测", summary: "按 schema 数组渲染整页.", tags: [{ label: "公测", tone: "primary" }] },
    { id: "c6", date: "2026-07-02", version: "v1.1.0", title: "被 limit 截掉的旧条目", summary: "只有 '查看全部' 能看到." },
  ],
};

export const CHANGELOG_CARDS_DATA: ChangelogListProps = { ...CHANGELOG_DATA, heading: { title: "linear 式 changelog 四卡" }, variant: "cards", groupBy: "none", columns: 4, limit: 4 };

export const TWEET_WALL_DATA: TweetWallProps = {
  heading: { eyebrow: "社区", title: "大家在说" },
  columns: 3,
  collapsible: true,
  moreLabel: "展开更多",
  lessLabel: "收起",
  items: [
    { id: "w1", person: { name: "Dev Kim" }, handle: "@devkim", body: "HX-UI 的 marquee 居然记得给键盘用户一个暂停按钮.", date: "2026-10-20", href: "#w1" },
    { id: "w2", person: { name: "苏沐" }, handle: "@sumu", body: LONG_QUOTE, date: "2026-10-18" },
    { id: "w3", person: { name: "Lena Ortiz" }, handle: "@lena", body: "换皮肤只改令牌, 这才是设计系统该有的样子.", date: "2026-10-15" },
    { id: "w4", person: { name: "Raj Patel" }, handle: "@raj", body: "JSON in, page out. Shipped our launch page in an afternoon.", date: "2026-10-11" },
    { id: "w5", person: { name: "陈一" }, handle: "@chenyi", body: "瀑布流高度参差也不会撑破列.", date: "2026-10-09" },
    { id: "w6", person: { name: "Mia Chen" }, handle: "@mia", body: "Dark mode first, thin borders, proper CJK spacing.", date: "2026-10-02" },
  ],
};
