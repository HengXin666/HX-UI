import { useEffect, useState } from "react";

/** 把 CSS 变量 (oklch 等任意写法) 解析成 #rrggbb, three.js 只认 sRGB */
function resolve(vars: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof document === "undefined") return out;
  // 用探针元素解析, var() 套 var() 也能拿到最终颜色
  const probe = document.createElement("span");
  probe.style.display = "none";
  document.body.appendChild(probe);
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  for (const v of vars) {
    probe.style.color = "";
    probe.style.color = v.startsWith("--") ? `var(${v})` : v;
    const raw = getComputedStyle(probe).color;
    if (!ctx || !raw) { out[v] = "#888888"; continue; }
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#888888";
    ctx.fillStyle = raw;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    out[v] = `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  }
  probe.remove();
  return out;
}

/** 读主题色, 亮暗切换 (html 的 class / style / data-*) 时重新读 */
export function useThemeColors<T extends string>(vars: readonly T[]): Record<T, string> {
  const key = vars.join("|");
  const [colors, setColors] = useState(() => resolve([...vars]) as Record<T, string>);
  useEffect(() => {
    const update = () => setColors(resolve(key.split("|")) as Record<T, string>);
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-mode"] });
    return () => mo.disconnect();
  }, [key]);
  return colors;
}

export function hasWebGL() {
  if (typeof document === "undefined") return true;
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

/** 0..1 -> 0..1 */
export const easeOutCubic = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
