import {
  BentoFeatures,
  CaseStudies,
  ChangelogList,
  CodeShowcase,
  ComparisonMatrix,
  CtaBanner,
  Faq,
  FeatureAlternating,
  FeatureGrid,
  FigureGrid,
  Hero,
  InstallBlock,
  LogoWall,
  Newsletter,
  Pricing,
  Showcase,
  StatBand,
  Testimonials,
  TweetWall,
} from "../blocks/marketing";
import {
  CampaignHero,
  CartSummary,
  CategoryTiles,
  CheckoutSteps,
  ProductDetail,
  ProductGrid,
  ProductRail,
  PromoStrip,
  SearchResults,
} from "../blocks/commerce";
import { ActivityFeed, KpiRow } from "../blocks/dashboard";
import { AnnouncementBar, SiteFooter, SiteHeader } from "../blocks/site";
import { Compare } from "../studio/viz/Compare";
import { Process } from "../studio/viz/Process";
import { BarChart } from "../viz/charts/BarChart";
import { Trend } from "../viz/charts/Trend";
import { FlowGraph } from "../viz/flow/FlowGraph";
import { Funnel } from "../viz/flow/Funnel";
import { Timeline } from "../viz/flow/Timeline";
import { framed, MetricRow, RingRow } from "./frame";

/** 站点外壳: 顶栏, 公告条, 页脚. */
export const SITE_SECTIONS = {
  announcement: AnnouncementBar,
  header: SiteHeader,
  footer: SiteFooter,
} as const;

/** 软件与品牌的营销区块. */
export const MARKETING_SECTIONS = {
  hero: Hero,
  logos: LogoWall,
  features: FeatureGrid,
  bento: BentoFeatures,
  alternating: FeatureAlternating,
  showcase: Showcase,
  figures: FigureGrid,
  stats: StatBand,
  testimonials: Testimonials,
  tweets: TweetWall,
  cases: CaseStudies,
  pricing: Pricing,
  matrix: ComparisonMatrix,
  faq: Faq,
  cta: CtaBanner,
  newsletter: Newsletter,
  code: CodeShowcase,
  install: InstallBlock,
  changelog: ChangelogList,
} as const;

/** 电商: 活动, 类目, 列表, 详情, 购物车与结账. */
export const COMMERCE_SECTIONS = {
  campaign: CampaignHero,
  promo: PromoStrip,
  categories: CategoryTiles,
  products: ProductGrid,
  rail: ProductRail,
  product: ProductDetail,
  search: SearchResults,
  cart: CartSummary,
  checkout: CheckoutSteps,
} as const;

/** 数据, 内容与流程的可视化. 都包了 BlockShell, 可以直接带标题组进页面. */
export const DATA_SECTIONS = {
  kpis: KpiRow,
  activity: ActivityFeed,
  metrics: framed(MetricRow, "MetricRow"),
  rings: framed(RingRow, "RingRow"),
  bars: framed(BarChart, "BarChart"),
  trend: framed(Trend, "Trend"),
  funnel: framed(Funnel, "Funnel"),
  flow: framed(FlowGraph, "FlowGraph"),
  timeline: framed(Timeline, "Timeline"),
  process: framed(Process, "Process"),
  compare: framed(Compare, "Compare"),
} as const;

/** 默认注册表: 上面四组合并. 自定义区块用 createPage 合并进来, 同名覆盖. */
export const DEFAULT_SECTIONS = {
  ...SITE_SECTIONS,
  ...MARKETING_SECTIONS,
  ...COMMERCE_SECTIONS,
  ...DATA_SECTIONS,
} as const;

export type DefaultSections = typeof DEFAULT_SECTIONS;
