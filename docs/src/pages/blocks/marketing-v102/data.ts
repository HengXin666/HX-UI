/**
 * V1-02 营销区块 A 文档页的示例数据. 全部是可 JSON 序列化的纯数据, 同一份既喂给组件, 也原样展示为 "数据示例 JSON".
 */
import type { CtaBannerProps } from "../../../../../src/blocks/marketing/CtaBanner";
import type { HeroProps } from "../../../../../src/blocks/marketing/Hero";
import type { LogoWallProps } from "../../../../../src/blocks/marketing/LogoWall";
import type { Logo } from "../../../../../src/blocks/_shared/types";

/** 三皮肤切换演示 (data-skin). */
export const DEMO_SKINS = ["default", "mono", "retail"] as const;
export type DemoSkin = (typeof DEMO_SKINS)[number];

const icon = (slug: string): string => `https://cdn.simpleicons.org/${slug}`;

export const DEMO_LOGOS: Logo[] = [
  { name: "Vercel", src: icon("vercel"), width: 32, height: 32 },
  { name: "Stripe", src: icon("stripe"), width: 32, height: 32 },
  { name: "Shopify", src: icon("shopify"), width: 32, height: 32 },
  { name: "Supabase", src: icon("supabase"), width: 32, height: 32 },
  { name: "Astro", src: icon("astro"), width: 32, height: 32 },
  { name: "Resend", src: icon("resend"), width: 32, height: 32 },
  { name: "Linear", src: icon("linear"), width: 32, height: 32 },
  { name: "Framer", src: icon("framer"), width: 32, height: 32 },
];

/** vercel / astro 式: 居中 + 轮换词 + beam 背景 + 双 CTA + 信任行. */
export const HERO_CENTERED: HeroProps = {
  layout: "centered",
  pill: { badge: "New", label: "HX-UI 区块层 V1 已发布", href: "#marketing-v102" },
  title: "用数据拼出整页,",
  rotate: ["营销首屏", "电商首页", "文档站", "作品集"],
  lead: "Hero, LogoWall, CtaBanner, Newsletter 只吃 props, 三套皮肤开箱即用.",
  ctas: [
    { label: "开始使用", href: "#hero", variant: "primary" },
    { label: "查看源码", href: "#logo-wall", variant: "secondary" },
  ],
  command: "npm i @hx/ui",
  trust: { text: "被这些团队信任", logos: DEMO_LOGOS.slice(0, 5) },
  backdrop: { variant: "beam", mask: { fade: "bottom" }, options: { color: "primary" } },
};

/** stripe 式: 分屏 + mesh + 颗粒. */
export const HERO_SPLIT: HeroProps = {
  layout: "split",
  eyebrow: "金融基础设施",
  title: "为互联网经济打造的支付平台",
  lead: "从首笔交易到上市, 同一套 API.",
  ctas: [
    { label: "立即开始", href: "#", variant: "primary" },
    { label: "联系销售", href: "#", variant: "ghost" },
  ],
  media: { kind: "image", src: "https://picsum.photos/seed/hxui-split/1200/900", alt: "仪表盘截图", ratio: "4/3" },
  backdrop: { variant: "mesh", options: { colors: ["primary", "accent-2", "success"], grain: true } },
};

/** shopify / resend 式: 全幅背景图 + 压暗 + 轮换词. */
export const HERO_MEDIA_BG: HeroProps = {
  layout: "media-bg",
  pill: { label: "What you missed at Forward", href: "#" },
  title: "成为下一个",
  rotate: ["全球品牌", "独立创业者", "家喻户晓的名字"],
  ctas: [{ label: "免费开始", href: "#", variant: "primary" }],
  media: { kind: "image", src: "https://picsum.photos/seed/hxui-bg/1920/1080", alt: "", priority: true },
};

/** framer 式: 视频底 (自带暂停按钮). */
export const HERO_VIDEO_BG: HeroProps = {
  layout: "video-bg",
  title: "专业级网站构建器",
  lead: "设计, CMS 与发布, 一处完成.",
  ctas: [{ label: "免费试用", href: "#", variant: "primary" }],
  media: { kind: "video", src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", alt: "产品演示视频" },
};

/** linear / vercel 式: 产品截图放进浏览器框, 底部淡出. */
export const HERO_PRODUCT: HeroProps = {
  layout: "product",
  title: "为现代团队设计的产品工具",
  lead: "计划, 构建, 发布, 一气呵成.",
  ctas: [{ label: "开始构建", href: "#", variant: "primary" }],
  frame: "browser",
  frameAddress: "app.example.com",
  media: { kind: "image", src: "https://picsum.photos/seed/hxui-product/1600/1000", alt: "产品界面截图", ratio: "16/9" },
  backdrop: { variant: "grid", mask: { fade: "radial" } },
};

export const LOGO_WALL_GRID: LogoWallProps = {
  title: "被全球最好的团队采用",
  description: "灰度显示, 悬停或键盘聚焦时复色; 窄容器自动转跑马灯.",
  logos: DEMO_LOGOS,
  mode: "grid",
  cols: 4,
  align: "center",
};

export const LOGO_WALL_MARQUEE: LogoWallProps = { logos: DEMO_LOGOS, mode: "marquee", pad: "md", tone: "muted" };

export const CTA_BOXED: CtaBannerProps = {
  title: "一个周末上线, 扩展到百万用户",
  lead: "免费开始, 随时升级.",
  ctas: [
    { label: "开始项目", href: "#", variant: "primary" },
    { label: "预约演示", href: "#", variant: "secondary" },
  ],
  variant: "boxed",
  fill: "mesh",
};

export const CTA_INLINE: CtaBannerProps = {
  title: "准备好开始了吗?",
  ctas: [{ label: "免费注册", href: "#", variant: "primary" }],
  variant: "inline",
  titleSize: "sm",
};

export const CTA_FULL: CtaBannerProps = {
  eyebrow: "企业版",
  title: "与销售团队聊聊",
  ctas: [
    { label: "联系我们", href: "#", variant: "secondary" },
    { label: "查看定价", href: "#", variant: "ghost" },
  ],
  variant: "full",
  media: { kind: "image", src: "https://picsum.photos/seed/hxui-cta/1920/800", alt: "" },
};

/** Newsletter 的可序列化部分 (onSubmit 由页面注入). */
export const NEWSLETTER_DATA = {
  title: "订阅更新",
  lead: "每月一封, 只发产品更新与教程.",
  placeholder: "you@example.com",
  emailLabel: "邮箱地址",
  submitLabel: "订阅",
  submittingLabel: "提交中...",
  successMessage: "已订阅, 请查收确认邮件.",
  errorMessage: "提交失败, 请稍后重试.",
  invalidMessage: "请输入有效的邮箱地址.",
  consent: "订阅即表示同意我们的隐私政策, 可随时退订.",
  variant: "card",
} as const;

/** PageComposer 用法示例: 同一份数据拼成整页. */
export const COMPOSER_BLOCKS = [
  { type: "Hero", props: HERO_CENTERED },
  { type: "LogoWall", props: LOGO_WALL_MARQUEE },
  { type: "CtaBanner", props: CTA_BOXED },
] as const;

export const json = (value: unknown): string => JSON.stringify(value, null, 2);
