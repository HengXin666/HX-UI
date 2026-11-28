/** 视觉组件共用的调色板: 主题令牌 + 参考站的经典配色 */
export const PALETTES: Record<string, { label: string; colors: string[] }> = {
  classic: { label: "经典", colors: ["#5227FF", "#7cff67", "#5227FF"] },
  brand: { label: "品牌", colors: ["var(--brand)", "var(--chart-2)", "var(--brand)"] },
  ocean: { label: "海洋", colors: ["#0ea5e9", "#22d3ee", "#6366f1"] },
  sunset: { label: "日落", colors: ["#f97316", "#ec4899", "#8b5cf6"] },
  mono: { label: "单色", colors: ["var(--foreground)", "var(--muted-foreground)", "var(--foreground)"] },
};
export const PALETTE_OPTIONS = Object.entries(PALETTES).map(([value, p]) => ({ value, label: p.label }));
export const colorsCode = (key: string) => `[${PALETTES[key].colors.map((c) => `"${c}"`).join(", ")}]`;

/** 按与默认值的差异生成 JSX 属性 */
export function diffProps(v: Record<string, unknown>, d: Record<string, unknown>, skip: string[] = []) {
  const out: string[] = [];
  for (const [k, val] of Object.entries(v)) {
    if (skip.includes(k) || val === d[k]) continue;
    if (typeof val === "string") out.push(`${k}="${val}"`);
    else if (typeof val === "boolean") out.push(val ? k : `${k}={false}`);
    else out.push(`${k}={${val}}`);
  }
  return out;
}
