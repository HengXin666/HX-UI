/**
 * 皮肤层 (src/skins) 的字面量: 皮肤名, 密度名, DOM 属性名, 以及文档演示页的标签与类名.
 */

/**
 * 七套皮肤. default 即现状, 其余六套以 [data-skin="<name>"] 覆盖语义令牌.
 *
 * .agents/notes/implemented/feature/2026-11-02-skins-density.md
 * .agents/notes/implemented/feature/2026-11-08-library-gaps.md
 */
export const SKIN = {
  default: "default",
  mono: "mono",
  linear: "linear",
  fintech: "fintech",
  emerald: "emerald",
  retail: "retail",
  midnight: "midnight",
} as const;

export type SkinName = (typeof SKIN)[keyof typeof SKIN];

/** 皮肤内的形态档. 目前只有 retail 用: sharp 圆角 0, round 大圆角. */
export const SKIN_VARIANT = {
  sharp: "sharp",
  round: "round",
} as const;

export type SkinVariant = (typeof SKIN_VARIANT)[keyof typeof SKIN_VARIANT];

/** 三档密度. comfortable 等于 Tailwind 默认间距. */
export const DENSITY = {
  compact: "compact",
  comfortable: "comfortable",
  spacious: "spacious",
} as const;

export type DensityName = (typeof DENSITY)[keyof typeof DENSITY];

/** 写在 documentElement 上的属性名. */
export const SKIN_ATTR = {
  skin: "data-skin",
  variant: "data-skin-variant",
  density: "data-density",
} as const;

/** 皮肤清单: 名称, 中文标签, 一句气质说明, 可选形态档. 顺序即演示页按钮顺序. */
export const SKIN_LIST: ReadonlyArray<{
  readonly name: SkinName;
  readonly label: string;
  readonly desc: string;
  readonly variants?: readonly SkinVariant[];
}> = [
  { name: SKIN.default, label: "默认", desc: "GitHub Dimmed 灰底蓝调, 现状不变" },
  { name: SKIN.mono, label: "黑白极简", desc: "Vercel 式, 主色近黑近白, 小圆角, 极淡阴影" },
  { name: SKIN.linear, label: "暗紫灰", desc: "Linear 式, 低对比, 1px 细边, 微光" },
  { name: SKIN.fintech, label: "亮紫金融", desc: "Stripe 式, 高饱和主色, 大圆角, 柔和阴影" },
  { name: SKIN.emerald, label: "暗底绿光", desc: "Supabase 式, 深色为主, 薄荷绿光晕" },
  {
    name: SKIN.retail,
    label: "黑白大图",
    desc: "Nike / Apple 式, 强对比, 零装饰, 圆角 0 或很大",
    variants: [SKIN_VARIANT.sharp, SKIN_VARIANT.round],
  },
  { name: SKIN.midnight, label: "午夜紫", desc: "文档站门面同款, 紫调近黑底, 紫色主色, 青绿第二强调; 亮色沿用默认" },
];

/** 密度清单: 名称, 中文标签, 适用场景. */
export const DENSITY_LIST: ReadonlyArray<{ readonly name: DensityName; readonly label: string; readonly desc: string }> = [
  { name: DENSITY.compact, label: "紧凑", desc: "工具与控制台" },
  { name: DENSITY.comfortable, label: "舒适", desc: "默认" },
  { name: DENSITY.spacious, label: "宽松", desc: "营销与落地页" },
];

/** 文档演示页的标签与类名 (只在 docs/src/pages/skins 使用). */
export const SKINS_DOC = {
  variantLabel: { sharp: "直角", round: "大圆角" } as Record<SkinVariant, string>,
  /** 切换按钮行 */
  switchRow: "flex flex-wrap items-center gap-2",
  /** 演示面: 整块铺当前皮肤的页面底色, 用大圆角卡片承载代表性组件 */
  stage: "grid w-full gap-4 rounded-xl border border-border bg-background p-4 sm:grid-cols-2",
  tile: "flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-md",
  tileTitle: "text-sm font-medium text-heading",
  tileText: "text-xs text-muted-foreground",
  row: "flex flex-wrap items-center gap-2",
  hero: "flex flex-col gap-2 rounded-lg border border-border bg-(image:--gradient-hero) p-6 sm:col-span-2",
  heroTitle: "text-3xl font-semibold tracking-tight text-heading [font-family:var(--font-display)]",
  brandBar: "h-2 w-full rounded-full bg-(image:--gradient-brand)",
  glowTile: "flex flex-col gap-2 rounded-lg bg-card p-4 shadow-glow",
  swatches: "grid grid-cols-6 gap-1.5",
  swatch: "h-8 rounded-md border border-border",
  meta: "font-mono text-xs text-muted-foreground",
} as const;

/** 色块演示用的语义令牌, 每格一个 bg-* 类. */
export const SKINS_DOC_SWATCHES = [
  "bg-background",
  "bg-card",
  "bg-muted",
  "bg-primary",
  "bg-accent-2",
  "bg-heading",
] as const;
