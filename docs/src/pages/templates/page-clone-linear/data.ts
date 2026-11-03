/**
 * linear.app 首屏复刻 (以战代练) 的数据. 目的不是好看, 而是暴露 HX-UI 的缺口:
 * 每一处与 linear 不一致的地方都**故意不打补丁**, 证据记在
 * docs/reference/2026-ui-library-clone-findings.md.
 *
 * 取证: 2026-11-03 实测 GET https://linear.app 与其 static.linear.app/web/_next/static/css/*.css.
 * 首屏结构 (实测): SiteHeader (Log in / Sign up) -> 左对齐四行 h1 + 右侧一行描述与 "New Loops ->" 链接
 *   -> DOM 产品界面 (侧栏 + 议题详情, 不是截图) -> "Powering the companies building the future" + 7 个 svg logo.
 * 实测令牌: --title-8-size 4rem, --title-8-letter-spacing -.022em, line-height 1, font-weight 510,
 *   --color-bg-primary #08090a, --color-text-tertiary #8a8f98, --homepage-max-width 1344px + 外边距.
 * 全部可 JSON 序列化: 无函数, 无节点.
 */
import type { BlockNode, Logo } from "../../../../../src/blocks/_shared/types";
import type { HeroProps } from "../../../../../src/blocks/marketing/Hero";
import type { LogoWallProps } from "../../../../../src/blocks/marketing/LogoWall";
import type { SiteHeaderBlockProps } from "../../../../../src/blocks/site";

/** linear 实测用的是内联 svg 字标; 我们的 Logo.src 只收 URL, 只能退到 simpleicons 的方形图标 (缺口 C-15). */
const icon = (slug: string): string => `https://cdn.simpleicons.org/${slug}/ffffff`;
const logo = (name: string, slug: string): Logo => ({ name, src: icon(slug), width: 32, height: 32 });

/** linear 首屏 logo 行的实测顺序 (aria-label 取证). */
export const LINEAR_LOGOS: Logo[] = [
  logo("OpenAI", "openai"),
  logo("Vercel", "vercel"),
  logo("Salesforce", "salesforce"),
  logo("Figma", "figma"),
  logo("Cursor", "cursor"),
  logo("Coinbase", "coinbase"),
  logo("Ramp", "ramp"),
];

const ARIA = { nav: "Main", mobileOpen: "Open menu", mobileTitle: "Menu", back: "Back", close: "Close" };

/**
 * 头部: linear 的 Sign up 是 "反色实底" (白底黑字, S36ykG_variant-invert), Log in 是纯文字链.
 * 我们的 Cta variant 只有 primary (品牌色实底) / ghost (muted 字), 没有 invert (缺口 C-11).
 */
export const LINEAR_HEADER = {
  brand: { href: "#home", name: "Linear" },
  sticky: true,
  blurOnScroll: true,
  transparent: true,
  nav: [
    { label: "Product", href: "#product" },
    { label: "Resources", href: "#resources" },
    { label: "Customers", href: "#customers" },
    { label: "Pricing", href: "#pricing" },
    { label: "Now", href: "#now" },
    { label: "Contact", href: "#contact" },
  ],
  actions: [
    { label: "Log in", href: "#login", variant: "ghost", size: "sm" },
    { label: "Sign up", href: "#signup", variant: "primary", size: "sm" },
  ],
  ariaLabels: ARIA,
} satisfies SiteHeaderBlockProps;

/**
 * 首屏. linear 是 "标题左, 描述右下, 同一行基线对齐" 的不对称版式; Hero 没有这种版式,
 * 只能退到 product 版式 + align start: 描述被压到标题下方另起一行 (缺口 C-05).
 * linear 首屏**没有**两个按钮 (注册在头部); 任务书写的 "一主一幽灵" 按钮放在头部 actions 里, 不塞进 Hero.
 * 主视觉: linear 是活的 DOM 产品界面; 我们只有占位 svg (缺口 C-17).
 */
export const LINEAR_HERO = {
  layout: "product",
  align: "start",
  title: "The product development system for teams and agents",
  lead: "Purpose-built for planning and building products. Designed for the AI era.",
  pill: { badge: "New", label: "Loops", href: "#loops" },
  media: { kind: "image", src: "./demo/saas-hero.svg", alt: "Linear app placeholder (not a real screenshot)", ratio: "16/9", priority: true },
  frame: "none",
  backdrop: { variant: "aurora", mask: { fade: "bottom" } },
  titleSize: "lg",
  width: "wide",
  pad: "lg",
} satisfies HeroProps;

/** 客户 logo 行: linear 是 7 个单色字标一排; 我们的网格最多 6 列, 第 7 个会折行 (缺口 C-16). */
export const LINEAR_LOGO_WALL = {
  title: "Powering the companies building the future",
  logos: LINEAR_LOGOS,
  mode: "grid",
  cols: 6,
  grayscale: true,
  autoMarquee: false,
  logoHeight: 24,
  pad: "sm",
  width: "wide",
} satisfies LogoWallProps;

/** 首屏三块的顺序 (与 linear 实测一致). */
export const LINEAR_CLONE_PAGE: BlockNode[] = [
  { type: "SiteHeader", key: "header", props: LINEAR_HEADER },
  { type: "Hero", key: "hero", props: LINEAR_HERO },
  { type: "LogoWall", key: "customers", props: LINEAR_LOGO_WALL },
];
