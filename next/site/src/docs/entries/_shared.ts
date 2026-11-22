/** 调参里的颜色选项: 都是主题令牌, 亮暗自动适配 */
export const COLOR_OPTIONS = [
  { value: "var(--brand)", label: "品牌" },
  { value: "var(--chart-2)", label: "青" },
  { value: "var(--chart-3)", label: "琥珀" },
  { value: "var(--chart-4)", label: "品红" },
  { value: "var(--foreground)", label: "前景" },
];
export const SOFT_COLOR_OPTIONS = [
  { value: "color-mix(in oklch, var(--brand) 22%, transparent)", label: "品牌" },
  { value: "color-mix(in oklch, var(--chart-2) 22%, transparent)", label: "青" },
  { value: "color-mix(in oklch, var(--chart-3) 22%, transparent)", label: "琥珀" },
  { value: "color-mix(in oklch, var(--chart-4) 22%, transparent)", label: "品红" },
  { value: "color-mix(in oklch, var(--foreground) 12%, transparent)", label: "白光" },
];
export const FORMAT_OPTIONS = [
  { value: "decimal", label: "数字" },
  { value: "currency", label: "金额" },
  { value: "percent", label: "百分比" },
  { value: "compact", label: "缩写" },
];
export function numberFormat(kind: string): Intl.NumberFormatOptions {
  if (kind === "currency") return { style: "currency", currency: "CNY", maximumFractionDigits: 0 };
  if (kind === "percent") return { style: "percent", maximumFractionDigits: 1 };
  if (kind === "compact") return { notation: "compact", maximumFractionDigits: 1 };
  return { maximumFractionDigits: 0 };
}
export const FORMAT_CODE: Record<string, string> = {
  currency: '{ style: "currency", currency: "CNY", maximumFractionDigits: 0 }',
  percent: '{ style: "percent", maximumFractionDigits: 1 }',
  compact: '{ notation: "compact", maximumFractionDigits: 1 }',
};
