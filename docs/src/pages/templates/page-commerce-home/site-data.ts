/**
 * 电商站点外壳数据 (顶栏, 公告, 页脚), 首页 / 商品页 / 结账页共用. 全部可 JSON 序列化.
 */
import type { LinkGroup, LinkItem, MegaMenuPanelData, SiteBrand, SiteFooterBlockProps, SiteHeaderBlockProps } from "@hx/ui";
import { demoImg } from "./compose";

export const BRAND: SiteBrand = { href: "#home", name: "HX Sport", ariaLabel: "HX Sport 首页" };

const megaOf = (gender: string, img: string): MegaMenuPanelData => ({
  columns: [
    {
      title: "新品与精选",
      items: [
        { label: "新品上市", href: `#${img}-new` },
        { label: "畅销榜", href: `#${img}-best` },
        { label: "会员专享", href: `#${img}-member` },
      ],
    },
    {
      title: "鞋类",
      items: [
        { label: "跑步", href: `#${img}-running` },
        { label: "篮球", href: `#${img}-basketball` },
        { label: "训练与健身", href: `#${img}-training` },
        { label: "生活休闲", href: `#${img}-lifestyle` },
      ],
    },
    {
      title: "服装",
      items: [
        { label: "上装与 T 恤", href: `#${img}-tops` },
        { label: "卫衣", href: `#${img}-hoodies` },
        { label: "裤装与紧身裤", href: `#${img}-pants` },
      ],
    },
  ],
  featured: [
    {
      title: `${gender}跑步装备`,
      description: "缓震, 回弹, 一双鞋跑完全马",
      media: demoImg(`mega-${img}`, `${gender}跑步装备`),
      cta: { label: "去选购", href: `#${img}-running` },
    },
  ],
  footer: [{ label: `查看全部${gender}商品`, href: `#${img}-all` }],
});

export const NAV: SiteHeaderBlockProps["nav"] = [
  { label: "新品", href: "#new" },
  { label: "男子", href: "#men", mega: megaOf("男子", "men") },
  { label: "女子", href: "#women", mega: megaOf("女子", "women") },
  { label: "儿童", href: "#kids" },
  { label: "特惠", href: "#sale" },
];

export const HEADER_ACTIONS: SiteHeaderBlockProps["actions"] = [
  { label: "收藏", href: "#favorites", variant: "ghost", icon: "icon-[solar--heart-linear]", ariaLabel: "收藏夹" },
  { label: "购物车", href: "#cart", variant: "ghost", icon: "icon-[solar--cart-large-2-linear]", ariaLabel: "购物车, 2 件商品" },
  { label: "登录", href: "#signin", variant: "primary" },
];

/**
 * 首页顶栏: 大菜单, 公告条.
 * 文档站演示里关闭吸顶: 模板嵌在文档站的滚动容器里, sticky 会浮到文档站自己的顶栏上. 真实项目里传 sticky: true.
 */
export const HOME_HEADER: SiteHeaderBlockProps = {
  brand: BRAND,
  nav: NAV,
  actions: HEADER_ACTIONS,
  sticky: false,
  announcement: {
    message: "会员满 ¥399 免运费, 30 天无理由退货",
    cta: { label: "立即加入", href: "#join", variant: "link" },
    dismissible: true,
    storageKey: "hx-commerce-announce-2026-11",
  },
};

const FOOTER_COLUMNS: LinkGroup[] = [
  {
    title: "资源",
    items: [
      { label: "礼品卡", href: "#gift-card" },
      { label: "门店查询", href: "#stores" },
      { label: "会员计划", href: "#membership" },
    ],
  },
  {
    title: "帮助",
    items: [
      { label: "订单状态", href: "#orders" },
      { label: "配送与送达", href: "#shipping" },
      { label: "退换货", href: "#returns" },
      { label: "联系客服", href: "#contact" },
    ],
  },
  {
    title: "关于我们",
    items: [
      { label: "品牌故事", href: "#about" },
      { label: "工作机会", href: "#careers" },
      { label: "可持续发展", href: "#sustainability" },
    ],
  },
];

const SOCIAL: LinkItem[] = [
  { label: "微博", href: "#weibo", icon: "icon-[solar--chat-round-line-linear]" },
  { label: "小红书", href: "#xhs", icon: "icon-[solar--book-2-linear]" },
  { label: "抖音", href: "#douyin", icon: "icon-[solar--videocamera-record-linear]" },
];

const LEGAL: LinkItem[] = [
  { label: "使用条款", href: "#terms" },
  { label: "隐私政策", href: "#privacy" },
  { label: "Cookie 设置", href: "#cookies" },
];

export const FOOTER: SiteFooterBlockProps = {
  brand: { ...BRAND, description: "为每一次出发准备好装备." },
  columns: FOOTER_COLUMNS,
  social: SOCIAL,
  legal: LEGAL,
  copyright: "© 2026 HX Sport, Inc. 保留所有权利.",
};

/** 结账页只留法务链接与版权, 不放导航 (减少流失). */
export const CHECKOUT_FOOTER: SiteFooterBlockProps = {
  columns: [],
  legal: LEGAL,
  copyright: FOOTER.copyright,
  pad: "sm",
};
