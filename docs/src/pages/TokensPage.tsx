import { useState, type JSX } from "react";
import { H2, H3, P } from "../components/DocKit";

/** 色板: 直接把 CSS 变量的值渲染出来, 不写死色值 —— 换肤时这里自动跟着变。 */
const COLORS = [
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

const RADII = [
  { name: "--radius-sm", use: "极少用" },
  { name: "--radius-md", use: "列表项 / 小控件" },
  { name: "--radius-lg", use: "按钮 / 输入框 (最常用)" },
  { name: "--radius-xl", use: "卡片 / 面板" },
];

const SHADOWS = ["--shadow-xs", "--shadow-sm", "--shadow-md", "--shadow-lg", "--shadow-xl"];

export function TokensPage(): JSX.Element {
  const [mode, setMode] = useState<"dark" | "light">(
    () => (document.documentElement.getAttribute("data-mode") as "dark" | "light") ?? "dark",
  );

  const flip = (): void => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    document.documentElement.setAttribute("data-mode", next);
  };

  return (
    <>
      <P>
        所有颜色、圆角、阴影都来自 CSS 变量。组件里出现任何硬编色值都是错的 ——
        换肤只需改这一层, 组件代码一行不动。
      </P>
      <button
        type="button"
        onClick={flip}
        className="mb-2 rounded-lg border border-border px-2.5 py-1.5 text-[12px] transition-colors hover:bg-accent"
      >
        切到{mode === "dark" ? "亮色" : "暗色"}
      </button>

      <H2>颜色</H2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
        {COLORS.map((c) => (
          <div key={c.name} className="overflow-hidden rounded-xl border border-border">
            <div className="h-14" style={{ background: `var(${c.name})` }} />
            <div className="border-t border-border bg-card/40 px-3 py-2">
              <div className="font-mono text-[11px] text-foreground/90">{c.name}</div>
              <div className="text-[11px] text-muted-foreground">{c.use}</div>
            </div>
          </div>
        ))}
      </div>

      <H2>圆角</H2>
      <P>全部由一个 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">--radius</code> 派生, 改它就整站改手感。</P>
      <div className="flex flex-wrap gap-4">
        {RADII.map((r) => (
          <div key={r.name} className="flex flex-col items-center gap-2">
            <div className="size-20 border border-border bg-card/40" style={{ borderRadius: `var(${r.name})` }} />
            <div className="font-mono text-[11px] text-muted-foreground">{r.name}</div>
            <div className="text-[11px] text-muted-foreground/70">{r.use}</div>
          </div>
        ))}
      </div>

      <H2>阴影</H2>
      <P>白名单制: 普通卡片一律无阴影。只有浮层 (popover / dialog / dropdown) 与拖拽中的元素才用。</P>
      <div className="flex flex-wrap gap-6 rounded-xl bg-card/20 p-6">
        {SHADOWS.map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div className="size-16 rounded-xl border border-border bg-card" style={{ boxShadow: `var(${s})` }} />
            <div className="font-mono text-[11px] text-muted-foreground">{s}</div>
          </div>
        ))}
      </div>

      <H2>字号</H2>
      <P>只放行七档。不要自创中间值。</P>
      <div className="space-y-2">
        {[
          { cls: "text-[20px]", label: "20px", use: "页面标题 / 统计数字" },
          { cls: "text-[15px]", label: "15px", use: "分组标题" },
          { cls: "text-[14px]", label: "14px", use: "卡片标题" },
          { cls: "text-[13px]", label: "13px", use: "正文 (最常用)" },
          { cls: "text-[12px]", label: "12px", use: "说明文字" },
          { cls: "text-[11px]", label: "11px", use: "标签 / 角标" },
          { cls: "text-[10px]", label: "10px", use: "极少用" },
        ].map((t) => (
          <div key={t.label} className="flex items-baseline gap-4 border-b border-border/40 pb-2 last:border-0">
            <span className={`${t.cls} w-24 shrink-0 text-foreground`}>{t.label}</span>
            <span className="text-[12px] text-muted-foreground">{t.use}</span>
          </div>
        ))}
      </div>

      <H2>间距</H2>
      <H3>按容器角色</H3>
      <div className="overflow-hidden rounded-xl border border-border text-[12px]">
        {[
          ["紧凑列表项 (h≈40)", "px-3 py-2.5"],
          ["标准卡片", "px-3.5 pt-3 pb-3"],
          ["宽松卡片 / 设置面板", "p-4"],
          ["页面外层", "px-8"],
          ["Popover 内菜单项", "px-2.5 py-1.5"],
        ].map(([use, cls]) => (
          <div key={cls} className="flex items-center justify-between border-b border-border/40 px-3 py-2 last:border-0">
            <span className="text-muted-foreground">{use}</span>
            <code className="font-mono text-primary">{cls}</code>
          </div>
        ))}
      </div>
    </>
  );
}
