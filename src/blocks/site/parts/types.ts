/**
 * 站点区块 (V1-01) 的 props 形状. 公共内容类型 (Cta, LinkItem, LinkGroup, Logo, Media, Rich, BlockBaseProps)
 * 一律从 ../_shared/types 导入, 这里只声明各区块自己的 props, 不另立内容类型.
 */
import type { ReactNode } from "react";
import type { SITE_BLOCK_ARIA_FALLBACK, SITE_BLOCK_STATUS } from "../../../constants/blocks-site-v101";
import type { LocaleSwitcherProps } from "../../../site/overlay/LocaleSwitcher";
import type { SearchOverlayProps } from "../../../site/overlay/SearchOverlay";
import type { ThemeSwitcherLabels } from "../../../site/theme/ThemeSwitcher";
import type { SiteCollapse, SiteTone } from "../../../site/types";
import type { BlockBaseProps, Cta, IconName, LinkGroup, LinkItem, Logo, Media, Rich } from "../../_shared/types";

/** 站点区块的地标 / 按钮名称; 未给的键回退到 BlocksProvider 的内置文案 (SITE_BLOCK_ARIA_FALLBACK). */
export type SiteBlockAriaLabels = { -readonly [K in keyof typeof SITE_BLOCK_ARIA_FALLBACK]: string };

/** 品牌: logo (亮暗双图) 和 / 或名称, 链到首页. */
export interface SiteBrand {
  href: string;
  logo?: Logo;
  name?: Rich;
  /** 只有 logo 时链接的可访问名称; 缺省用 logo.name. */
  ariaLabel?: string;
}

/** 大菜单特色卡 (shopify 式图片卡). */
export interface MegaMenuFeatured {
  title: Rich;
  description?: Rich;
  media?: Media;
  cta: Cta;
}

/** 大菜单面板数据 (design 4.1 MegaMenuPanel). */
export interface MegaMenuPanelData {
  columns: LinkGroup[];
  featured?: MegaMenuFeatured[];
  /** 面板底部链接 (查看全部, 联系销售). */
  footer?: LinkItem[];
  /** 底部链接在顶栏下拉与移动钻取中作为一列时的标题; 不给则下拉中不显示 footer. */
  footerTitle?: Rich;
}

/** 带大菜单的顶级入口. 不带 mega 的入口直接用 LinkItem. */
export interface MegaMenuSpec {
  label: Rich;
  href?: string;
  current?: boolean;
  mega: MegaMenuPanelData;
}

export type SiteNavEntry = LinkItem | MegaMenuSpec;

/** 搜索入口: 直接透传给 src/site 的 SearchOverlay (文案全部由调用方给). */
export type SearchSpec = Omit<SearchOverlayProps, "ref" | "className" | "style" | "classNames" | "styles" | "trigger">;

export interface AnnouncementBlockProps extends BlockBaseProps {
  message: Rich;
  cta?: Cta;
  icon?: IconName;
  /** 语义色档; 不给时由 tone 推出 (brand / inverted -> primary, 其余 neutral). */
  intent?: SiteTone;
  dismissible?: boolean;
  /** 记住关闭状态的 localStorage 键 (换公告时换键); false 只在内存里记. */
  storageKey?: string | false;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 窄屏时正文单行截断, 带展开 / 收起按钮 (文案取 labels.expand / labels.collapse). 默认 true. */
  truncate?: boolean;
  ariaLabels?: Partial<SiteBlockAriaLabels>;
}

export interface MegaMenuPanelBlockProps extends BlockBaseProps, MegaMenuPanelData {}

export interface MobileNavBlockProps extends BlockBaseProps {
  items: SiteNavEntry[];
  /** 抽屉底部账号区按钮 (登录, 注册). */
  footer?: Cta[];
  /** 账号区自定义节点 (头像菜单), 排在 footer 按钮之前. */
  account?: ReactNode;
  search?: SearchSpec;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  ariaLabels?: Partial<SiteBlockAriaLabels>;
}

export interface SiteHeaderBlockProps extends BlockBaseProps {
  brand: SiteBrand;
  nav?: SiteNavEntry[];
  actions?: Cta[];
  search?: SearchSpec;
  /** 吸顶, 默认 true. */
  sticky?: boolean;
  /** 覆盖在 hero 上: 未滚动时透明, 外壳脱离文档流 (sticky 时 fixed, 否则 absolute). */
  transparent?: boolean;
  /** 滚动后玻璃模糊底, 默认 true. */
  blurOnScroll?: boolean;
  collapse?: SiteCollapse;
  announcement?: AnnouncementBlockProps;
  /** 二级本地导航 (apple 产品页式), 位于顶栏下方. */
  localNav?: LinkItem[];
  /** 移动抽屉底部按钮; 缺省用 actions. */
  mobileFooter?: Cta[];
  account?: ReactNode;
  ariaLabels?: Partial<SiteBlockAriaLabels>;
}

export type SiteStatusState = (typeof SITE_BLOCK_STATUS)[keyof typeof SITE_BLOCK_STATUS];

/** 页脚订阅 (design 4.2 Newsletter 的页脚内嵌版). onSubmit 抛错即进入失败态. */
export interface SiteNewsletter {
  title?: Rich;
  lead?: Rich;
  placeholder: string;
  /** 输入框的可访问名称 (占位符不能代替 label). */
  inputLabel: string;
  submitLabel: Rich;
  onSubmit?: (email: string) => Promise<void> | void;
  consent?: Rich;
  successMessage?: Rich;
  errorMessage?: Rich;
}

export interface SiteFooterBlockProps extends BlockBaseProps {
  columns: LinkGroup[];
  brand?: SiteBrand & { description?: Rich };
  newsletter?: SiteNewsletter;
  /** 社交图标链接: icon 必给, label (字符串) 作 aria-label. */
  social?: LinkItem[];
  legal?: LinkItem[];
  /** 语言选择: 透传 LocaleSwitcher, 页脚默认 mode="dialog". */
  locale?: LocaleSwitcherProps;
  badges?: Media[];
  status?: { label: Rich; href: string; state: SiteStatusState };
  /** 给出文案即显示主题切换. */
  themeSwitch?: ThemeSwitcherLabels | false;
  copyright?: Rich;
  ariaLabels?: Partial<SiteBlockAriaLabels>;
}
