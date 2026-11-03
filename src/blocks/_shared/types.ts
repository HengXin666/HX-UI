/**
 * 区块层公共类型的唯一来源. 所有区块 (marketing / commerce / site / docs / dashboard / portfolio) 只从这里 import.
 * 契约见 docs/reference/2026-ui-library-blocks-design.md 第 3 节; 取值常量在 src/constants/blocks.ts.
 */
import type { ComponentType, CSSProperties, ReactNode } from "react";
import type {
  BLOCK_ALIGN,
  BLOCK_BACKDROP,
  BLOCK_DENSITY,
  BLOCK_LABELS_ZH,
  BLOCK_PAD,
  BLOCK_REVEAL,
  BLOCK_SHELL_SLOTS,
  BLOCK_TAG,
  BLOCK_TITLE_SIZE,
  BLOCK_TONE,
  BLOCK_WIDTH,
  CTA_GROUP_SLOTS,
  CTA_SIZE,
  CTA_VARIANT,
  MEDIA_KIND,
  MEDIA_RATIO,
  MONEY_PERIOD,
  PAGE_COMPOSER_SLOTS,
  SECTION_HEADING_SLOTS,
} from "../../constants/blocks";
import type { PORTFOLIO_HERO_LAYOUT, PORTFOLIO_PROJECT_LAYOUT } from "../../constants/blocks-portfolio-v111";
import type { CALLOUT_KIND } from "../../constants/blocks-docs-v109";
import type { IconSource } from "../../layout/Icon";

type ValueOf<T> = T[keyof T];

/* ---------- 档位 ---------- */

export type BlockTone = ValueOf<typeof BLOCK_TONE>;
export type BlockPad = ValueOf<typeof BLOCK_PAD>;
export type BlockWidth = ValueOf<typeof BLOCK_WIDTH>;
export type BlockAlign = ValueOf<typeof BLOCK_ALIGN>;
/** 入场编排预设; false 关闭 (减弱动效时各预设自动退化为瞬时). */
export type BlockReveal = false | ValueOf<typeof BLOCK_REVEAL>;
export type BlockTag = ValueOf<typeof BLOCK_TAG>;
export type BlockTitleSize = ValueOf<typeof BLOCK_TITLE_SIZE>;
export type BlockDensity = ValueOf<typeof BLOCK_DENSITY>;
export type BackdropVariant = ValueOf<typeof BLOCK_BACKDROP>;
export type HeadingLevel = 1 | 2 | 3 | 4;

/* ---------- classNames / styles 插槽 (component-contract 第 4 节) ---------- */

export type SlotClassNames<S extends string, State = void> =
  | Partial<Record<S, string>>
  | ((state: State) => Partial<Record<S, string>>);
export type SlotStyles<S extends string, State = void> =
  | Partial<Record<S, CSSProperties>>
  | ((state: State) => Partial<Record<S, CSSProperties>>);

export type BlockShellSlot = (typeof BLOCK_SHELL_SLOTS)[number];
export type SectionHeadingSlot = (typeof SECTION_HEADING_SLOTS)[number];
export type CtaGroupSlot = (typeof CTA_GROUP_SLOTS)[number];
export type PageComposerSlot = (typeof PAGE_COMPOSER_SLOTS)[number];

/** BlockShell 插槽函数形态收到的公开状态 (与 data-* 一致). */
export interface BlockShellState {
  tone: BlockTone;
  pad: BlockPad;
  width: BlockWidth;
  align: BlockAlign;
}

/* ---------- 内容类型 (数据驱动, 字符串优先便于 JSON 序列化) ---------- */

/** 可见文案: 字符串优先; 需要富文本时给节点. */
export type Rich = string | ReactNode;

/** 图标来源: Iconify 类串 / 图标组件 / 任意节点, 统一交给 IconSlot 渲染. */
export type IconName = IconSource;

export interface Cta {
  label: Rich;
  href?: string;
  onClick?: () => void;
  variant?: ValueOf<typeof CTA_VARIANT>;
  size?: ValueOf<typeof CTA_SIZE>;
  icon?: IconName;
  /** 图标在文字后 (箭头类). 默认在前. */
  iconEnd?: boolean;
  /** 新窗口打开, 自动补 rel 与读屏提示. */
  external?: boolean;
  /** 仅图标或文案不足以说明时的可访问名称. */
  ariaLabel?: string;
  disabled?: boolean;
}

export type MediaRatio = ValueOf<typeof MEDIA_RATIO> | number;

export interface Media {
  kind?: ValueOf<typeof MEDIA_KIND>;
  src?: string;
  /** 暗色模式下替换的图 (设计稿写作 srcDark, 任务书写作 darkSrc, 两者等价, 同时给时 darkSrc 优先). */
  darkSrc?: string;
  srcDark?: string;
  srcSet?: string;
  sizes?: string;
  /** 必填: 装饰图传空串. */
  alt: string;
  ratio?: MediaRatio;
  /** 焦点 [x, y], 0 到 1, 对应 object-position. */
  focal?: readonly [number, number];
  /** 首屏图: 不懒加载, fetchpriority=high. */
  priority?: boolean;
  poster?: string;
  placeholder?: string;
  width?: number;
  height?: number;
  /** kind="node" 时的自定义节点 (产品 mock). */
  node?: ReactNode;
}

export interface LinkItem {
  label: Rich;
  href: string;
  description?: Rich;
  icon?: IconName;
  badge?: Rich;
  external?: boolean;
  /** 当前页 (aria-current="page"). */
  current?: boolean;
}

export interface LinkGroup {
  title: Rich;
  items: LinkItem[];
}

export type MoneyPeriod = ValueOf<typeof MONEY_PERIOD>;

export interface Money {
  amount: number;
  /** ISO 4217 (USD, CNY). 格式化走 Intl.NumberFormat(locale, { style: "currency" }). */
  currency: string;
  /** 划线原价 (设计稿写作 compareAt, 两者等价, 同时给时 originalAmount 优先). */
  originalAmount?: number;
  compareAt?: number;
  period?: MoneyPeriod;
  /** 价格旁的补充说明 (含税, 按席位). */
  note?: Rich;
}

export interface Person {
  name: string;
  role?: Rich;
  company?: Rich;
  avatar?: Media;
  href?: string;
}

export interface Logo {
  name: string;
  src?: string;
  /** 内联节点 (如 svg 品牌字标): 给了就直接渲染, 不出 <img>; 此时 src 可省, src / darkSrc 忽略. */
  node?: ReactNode;
  darkSrc?: string;
  /** 设计稿写法, 与 darkSrc 等价. */
  srcDark?: string;
  href?: string;
  width?: number;
  height?: number;
}

export interface Badge {
  label: Rich;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "info";
}

export interface Stat {
  value: number | string;
  prefix?: Rich;
  suffix?: Rich;
  label: Rich;
  href?: string;
}

/* ---------- 背景层 ---------- */

export interface MaskSpec {
  /** 渐隐方向: 四周 / 上 / 下 / 起 / 止. */
  fade?: "radial" | "top" | "bottom" | "start" | "end";
}

export interface BackdropSpec {
  variant: BackdropVariant;
  mask?: MaskSpec;
  /** variant="image" 时的图. */
  media?: Media;
  /** 透传给注入的背景组件 (MeshGradient 的色板, Grain 的强度). */
  options?: Record<string, unknown>;
}

/** 注入式背景组件收到的 props (BlocksProvider.backdrops 注册). */
export interface BackdropLayerProps {
  spec: BackdropSpec;
  tone: BlockTone;
  className?: string;
}

export type BackdropRenderer = ComponentType<BackdropLayerProps>;

/* ---------- 区块共有 props ---------- */

export interface BlockBaseProps {
  /** 锚点, 也用于 ScrollSpy. */
  id?: string;
  className?: string;
  style?: CSSProperties;
  classNames?: SlotClassNames<BlockShellSlot, BlockShellState>;
  styles?: SlotStyles<BlockShellSlot, BlockShellState>;
  tone?: BlockTone;
  pad?: BlockPad;
  width?: BlockWidth;
  align?: BlockAlign;
  reveal?: BlockReveal;
  /** 背景层: 内置/注入的规格, 或直接给节点 (例如 <MeshGradient />). */
  backdrop?: BackdropSpec | ReactNode;
  as?: BlockTag;
  /** 覆盖区块内置 aria 兜底文案. */
  labels?: Partial<BlockLabels>;
  /** "90% 数据 + 10% 定制" 的插槽. */
  slots?: BlockSlots;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export interface BlockSlots {
  before?: ReactNode;
  after?: ReactNode;
  media?: ReactNode;
}

/** 区块标题组的数据形态; 各区块的 heading prop 直接用它. */
export interface SectionHeadingData {
  eyebrow?: Rich;
  title: Rich;
  description?: Rich;
  actions?: Cta[];
}

/* ---------- 语言与上下文 ---------- */

export type BlockLabels = { [K in keyof typeof BLOCK_LABELS_ZH]: string };

export interface BlocksContextValue {
  /** BCP 47; 未给时依次取 LocaleProvider, navigator.language. */
  locale: string;
  labels: BlockLabels;
  density: BlockDensity;
  /** 注入式背景组件 (mesh / grain / beam ...), 避免区块层直接 import 效果层. */
  backdrops: Partial<Record<BackdropVariant, BackdropRenderer>>;
  formatMoney: (money: Money, options?: Intl.NumberFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
}

/* ---------- 整页组合 ---------- */

/** 区块注册表: 名称 -> 组件. 由调用方以参数注入 (src/blocks/registry.ts 归集成任务). */
// biome-ignore lint/suspicious/noExplicitAny: 注册表需要接纳各区块各自的 props 类型
export type BlockRegistry = Record<string, ComponentType<any>>;

export interface BlockNode<R extends BlockRegistry = BlockRegistry> {
  type: keyof R & string;
  /** React key 与默认锚点; 未给时用 props.id 或下标. */
  key?: string;
  props?: Record<string, unknown>;
}

export type {
  BlockShellProps,
} from "./BlockShell";
export type { SectionHeadingProps, CtaGroupProps, CtaButtonProps } from "./SectionHeading";
export type { BlocksProviderProps } from "./BlocksProvider";
export type { PageComposerProps } from "./PageComposer";

/* ---------- portfolio (V1-11, 契约见设计文档 4.6) ---------- */

export type ProfileHeroLayout = ValueOf<typeof PORTFOLIO_HERO_LAYOUT>;
export type ProjectGridLayout = ValueOf<typeof PORTFOLIO_PROJECT_LAYOUT>;

/** 个人资料: ProfileHero 与 StickyProfileLayout 侧栏共用. links 带 icon 时渲染为图标链接. */
export interface ProfileData {
  name: Rich;
  role?: Rich;
  bio?: Rich;
  avatar?: Media;
  links?: LinkItem[];
}

/** 一段经历. current 为真时高亮 (当前在职). */
export interface ExperienceItem {
  period: Rich;
  title: Rich;
  org: Rich;
  href?: string;
  body?: Rich;
  tags?: string[];
  current?: boolean;
}

/** 一个项目. href 为卡片主链接, links 为额外外链 (源码, 演示). */
export interface ProjectItem {
  title: Rich;
  media?: Media;
  body?: Rich;
  href?: string;
  external?: boolean;
  tags?: string[];
  featured?: boolean;
  links?: LinkItem[];
}

/** 一篇文章. date 用 ISO 串便于 JSON 序列化. */
export interface PostItem {
  title: Rich;
  date: string | number | Date;
  href: string;
  excerpt?: Rich;
  tags?: string[];
}

/* ---------- docs (V1-09, 契约见设计文档 4.4) ---------- */

export type CalloutKind = ValueOf<typeof CALLOUT_KIND>;

/** TOC 一项: id 对应正文标题的锚点; depth 为标题层级 (2 = h2). */
export interface TocItem {
  id: string;
  label: Rich;
  depth: number;
}

/** ApiTable 一行. type 是类型串, 过长时折叠. */
export interface ApiRow {
  name: string;
  type: string;
  default?: string;
  description: Rich;
  required?: boolean;
  /** 已废弃说明; 给了就划线并附说明. */
  deprecated?: Rich;
}

/** 文档站首页的检索入口: 只给入口外观与行为, 搜索面板由调用方实现 (例如 Command). */
export interface SearchSpec {
  placeholder?: string;
  /** 快捷键提示, 例如 "⌘K". */
  shortcut?: string;
  href?: string;
  onOpen?: () => void;
}

/** 文档站首页一张入口卡 (组件 / 指南 / 主题). */
export interface DocsHomeCard {
  title: Rich;
  href: string;
  description?: Rich;
  icon?: IconName;
  badge?: Rich;
  external?: boolean;
}
