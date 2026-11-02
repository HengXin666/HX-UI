/**
 * 令牌页各分区展示的令牌清单: 变量名 + 用途说明. 页面按变量名拼 var(--...) 渲染,
 * 这里不写任何色值或尺寸值, 值只在 src/tokens.css 一个地方.
 * .agents/notes/implemented/feature/2026-11-01-design-tokens-depth-motion.md
 */

/** 色板: 直接把 CSS 变量的值渲染出来, 不写死色值  换肤时这里自动跟着变. */
export const COLORS = [
  { name: "--background", use: "页面底" },
  { name: "--foreground", use: "正文" },
  { name: "--card", use: "卡片面" },
  { name: "--popover", use: "浮层面" },
  { name: "--primary", use: "主色 / 主操作" },
  { name: "--secondary", use: "次要面" },
  { name: "--muted", use: "静默面" },
  { name: "--accent", use: "hover / 选中底" },
  { name: "--muted-foreground", use: "次要文字" },
  { name: "--border", use: "所有线条" },
  { name: "--input", use: "输入控件底" },
  { name: "--ring", use: "聚焦环" },
  { name: "--destructive", use: "危险" },
];

/** 表面三级: 由低到高, 暗色越高越亮, 亮色靠阴影拉开 */
export const SURFACES = [
  { name: "--surface-sunken", use: "内嵌 / 凹槽", shadow: "--shadow-inner" },
  { name: "--background", use: "页面底", shadow: "" },
  { name: "--surface-raised", use: "抬起的卡片", shadow: "--shadow-md" },
  { name: "--surface-overlay", use: "浮层 / 弹窗", shadow: "--shadow-2xl" },
];

/** 品牌辅色: subtle 是浅底, glow 是光晕, accent-2 与 primary 组成渐变 */
export const BRAND = [
  { name: "--primary-subtle", use: "浅色强调底" },
  { name: "--primary-glow", use: "光晕色" },
  { name: "--accent-2", use: "第二品牌色" },
  { name: "--gradient-brand", use: "品牌渐变" },
];

/** 原始色板: 每个色相 11 阶, 由 CSS 变量直接渲染, 不在这里写色值 */
export const PALETTE_HUES = [
  { hue: "gray", use: "亮色主题中性灰" },
  { hue: "slate", use: "暗色主题中性灰" },
  { hue: "blue", use: "主色 / 链接 / 聚焦" },
  { hue: "green", use: "成功" },
  { hue: "yellow", use: "警告" },
  { hue: "red", use: "危险" },
  { hue: "purple", use: "已完成 / Agent" },
  { hue: "cyan", use: "第二品牌色" },
];

/** 圆角全档: none / xs / full 是新增档, sm..2xl 与 Tailwind 的 rounded-* 同值 */
export const RADII = [
  { name: "--radius-none", use: "直角 / 表格单元" },
  { name: "--radius-xs", use: "复选框内勾 / 细条" },
  { name: "--radius-sm", use: "极少用" },
  { name: "--radius-md", use: "列表项 / 小控件" },
  { name: "--radius-lg", use: "按钮 / 输入框 (最常用)" },
  { name: "--radius-xl", use: "卡片 / 面板" },
  { name: "--radius-2xl", use: "大面板 / Bento 格" },
  { name: "--radius-full", use: "徽标 / 头像 / 胶囊" },
];

export const SHADOWS = ["--shadow-xs", "--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-xl", "--shadow-2xl", "--shadow-glow", "--ring-glow"];

/** 容器宽度: 条形按真实宽度画, 超出预览区时由 min() 截住 */
export const CONTAINERS = [
  { name: "--container-narrow", use: "正文阅读宽度 45rem" },
  { name: "--container-max", use: "常规页面 80rem" },
  { name: "--container-wide", use: "全宽展示区 90rem" },
];

/** 页面纵向节奏: 两个区块之间的留白 */
export const RHYTHMS = [
  { name: "--section-space-y", use: "常规区块间距, 64px 到 96px 随视口" },
  { name: "--section-space-y-lg", use: "首屏 / 大区块间距, 96px 到 160px" },
];

/** 缓动对比: 同一段位移, 同一时长, 只换曲线 */
export const EASINGS = [
  { name: "--ease-out", use: "进入 / 反馈" },
  { name: "--ease-in-out", use: "屏内移动" },
  { name: "--ease-emphasized", use: "强调入场" },
  { name: "--ease-spring", use: "弹簧 (linear(), 旧浏览器回退 cubic-bezier)" },
];

/** 关键帧工具类: 类名必须写全, Tailwind 才扫得到 */
export const ANIMATIONS = [
  "animate-fade-in", "animate-fade-up", "animate-fade-down", "animate-scale-in", "animate-blur-in",
  "animate-slide-in-left", "animate-slide-in-right", "animate-pop", "animate-float", "animate-glow-pulse",
];
