import type { BlockNode } from "../../../../../src/blocks/_shared/types";
import { siteBlockRegistry } from "../../../../../src/blocks/site";
/**
 * 站点外壳演示数据 (V1-01). 纯 JSON 形状 (字符串优先, 无节点), 可直接作 PageComposer 的 blocks 数组序列化.
 * 文案只出现在这里, 区块本身不写死任何文案.
 *
 * .agents/notes/implemented/feature/2026-11-02-blocks-site-v101.md
 */
export const SITE_SHELL_ARIA = {
  nav: "主导航",
  localNav: "本页导航",
  mobileOpen: "打开菜单",
  mobileTitle: "菜单",
  back: "返回",
  close: "关闭",
  announcement: "站点公告",
  dismiss: "关闭公告",
  footerNav: "页脚导航",
  social: "社交媒体",
  legal: "法务链接",
};

export const SITE_SHELL_ANNOUNCEMENT = {
  message: "HX-UI 区块层 V1 预览版上线: 用 JSON 拼出整页.",
  cta: { label: "查看更新", href: "#changelog" },
  icon: "lucide:sparkles",
  intent: "info",
  storageKey: "hx-docs-announcement-v101",
  ariaLabels: SITE_SHELL_ARIA,
};

export const SITE_SHELL_HEADER = {
  brand: { href: "#", name: "HX-UI" },
  sticky: true,
  nav: [
    {
      label: "产品",
      mega: {
        columns: [
          { title: "构建", items: [
            { label: "区块", href: "#blocks", description: "数据驱动的页面区块" },
            { label: "零件", href: "#parts", description: "顶栏, 导航, 页脚原语" },
          ] },
          { title: "主题", items: [
            { label: "皮肤", href: "#skins", description: "六套语义 token 皮肤" },
            { label: "密度", href: "#density", description: "紧凑 / 舒适 / 宽松" },
          ] },
        ],
        featured: [
          { title: "整页模板", description: "stripe / supabase / nike 型拼法", cta: { label: "浏览模板", href: "#templates", variant: "link" as const } },
        ],
        footer: [{ label: "全部组件", href: "#all" }],
        footerTitle: "更多",
      },
    },
    { label: "文档", href: "#docs" },
    { label: "定价", href: "#pricing", current: true },
  ],
  actions: [
    { label: "登录", href: "#login", variant: "ghost" as const },
    { label: "开始使用", href: "#start", variant: "primary" as const },
  ],
  localNav: [
    { label: "概览", href: "#overview", current: true },
    { label: "规格", href: "#specs" },
  ],
  ariaLabels: SITE_SHELL_ARIA,
};

export const SITE_SHELL_FOOTER = {
  brand: { href: "#", name: "HX-UI", description: "一个库拼出任何前端页面." },
  columns: [
    { title: "产品", items: [{ label: "区块", href: "#blocks" }, { label: "皮肤", href: "#skins" }] },
    { title: "资源", items: [{ label: "文档", href: "#docs" }, { label: "更新日志", href: "#changelog" }] },
    { title: "公司", items: [{ label: "关于", href: "#about" }, { label: "联系", href: "#contact" }] },
  ],
  newsletter: {
    title: "订阅更新",
    placeholder: "name@example.com",
    inputLabel: "邮箱地址",
    submitLabel: "订阅",
    successMessage: "已订阅, 感谢关注.",
    errorMessage: "订阅失败, 请稍后再试.",
  },
  social: [{ label: "GitHub", href: "https://github.com", icon: "lucide:github", external: true }],
  legal: [{ label: "隐私", href: "#privacy" }, { label: "条款", href: "#terms" }],
  status: { label: "所有系统正常", href: "#status", state: "ok" },
  copyright: "© 2026 HX-UI",
  ariaLabels: SITE_SHELL_ARIA,
};

/** PageComposer 的 blocks 数组 (type 即 siteBlockRegistry 的键). */
export const SITE_SHELL_PAGE: ReadonlyArray<BlockNode<typeof siteBlockRegistry>> = [
  { type: "SiteHeader", key: "header", props: { ...SITE_SHELL_HEADER, announcement: SITE_SHELL_ANNOUNCEMENT } },
  { type: "SiteFooter", key: "footer", props: SITE_SHELL_FOOTER },
];

/** 三皮肤预览 (design 7: default / mono / retail). */
export const SITE_SHELL_SKINS = ["default", "mono", "retail"] as const;
